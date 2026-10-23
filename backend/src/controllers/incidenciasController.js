const Incidencia = require('../models/Incidencia');
const { uploadEvidenceToSupabase } = require('../config/supabase');

/**
 * Genera un código correlativo para incidencias si no es provisto
 * Ejemplo: UTM-2026-0142 (Garantiza código único sin colisiones)
 */
const generarCodigoIncidencia = async () => {
  const anio = new Date().getFullYear();
  let num = (await Incidencia.countDocuments()) + 1;
  let codigo = `UTM-${anio}-${String(num).padStart(4, '0')}`;
  while (await Incidencia.exists({ codigo })) {
    num++;
    codigo = `UTM-${anio}-${String(num).padStart(4, '0')}`;
  }
  return codigo;
};

/**
 * GET /api/incidencias
 * Listar incidencias con filtros de búsqueda por categoria, estado y prioridad,
 * aplicando las restricciones RBAC según el rol del usuario autenticado:
 * - Reportante: Solo sus propias incidencias creadas.
 * - Técnico: Solo incidencias de su área operativa (o asignadas).
 * - Supervisor / Admin / Directivo: Acceso global con filtros completos.
 */
const getIncidencias = async (req, res, next) => {
  try {
    const { categoria, estado, prioridad, search, asignacion } = req.query;
    const filtro = {};
    const rol = req.user?.rol?.toLowerCase() || 'reportante';
    const emailUsuario = req.user?.email?.toLowerCase();
    const areaTecnico = req.user?.area;

    // --- RESTRICCIONES RBAC ---
    if (rol === 'reportante') {
      // Un reportante SOLO ve las incidencias que él mismo creó
      filtro['reportante.email'] = emailUsuario;
    } else if (rol === 'tecnico') {
      // Un técnico solo ve las incidencias correspondientes a su área técnica
      if (asignacion === 'mis_asignadas') {
        filtro['tecnico_asignado.email'] = emailUsuario;
      } else {
        // Por defecto, incidencias de su área operativa
        if (areaTecnico && areaTecnico !== 'general') {
          filtro.categoria = areaTecnico;
        }
      }
    }

    // Filtros adicionales enviados por el cliente
    if (categoria && categoria !== 'todas' && rol !== 'tecnico') {
      filtro.categoria = categoria;
    }

    if (estado && estado !== 'todos') {
      filtro.estado = estado;
    }

    if (prioridad && prioridad !== 'todas') {
      filtro.prioridad = prioridad;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filtro.$or = [
        { codigo: regex },
        { titulo: regex },
        { 'ubicacion.edificio': regex },
        { 'ubicacion.aula_laboratorio': regex },
      ];
    }

    // Consulta directa a MongoDB aprovechando los índices
    const incidencias = await Incidencia.find(filtro)
      .sort({ createdAt: -1 })
      .select('-__v');

    // Métricas para la bandeja activa según el contexto del usuario
    const baseStatsQuery = rol === 'reportante'
      ? { 'reportante.email': emailUsuario }
      : rol === 'tecnico' && areaTecnico && areaTecnico !== 'general'
      ? { categoria: areaTecnico }
      : {};

    const estadisticas = {
      total: await Incidencia.countDocuments(baseStatsQuery),
      abiertas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'abierta' }),
      en_progreso: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'en_progreso' }),
      resueltas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'resuelta' }),
      criticas: await Incidencia.countDocuments({ ...baseStatsQuery, prioridad: 'critica' }),
    };

    return res.status(200).json({
      ok: true,
      totalResultados: incidencias.length,
      estadisticas,
      incidencias,
      usuarioContexto: {
        email: req.user.email,
        rol: req.user.rol,
        area: req.user.area,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/incidencias/:codigo
 * Obtener el expediente completo sin usar JOINs, aprovechando la estructura embebida de MongoDB
 */
const getIncidenciaByCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        error: 'El parámetro código es requerido',
      });
    }

    const incidencia = await Incidencia.findOne({
      codigo: codigo.toUpperCase(),
    }).select('-__v');

    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró ningún expediente con el código ${codigo.toUpperCase()}`,
      });
    }

    return res.status(200).json({
      ok: true,
      incidencia,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidencias
 * Registrar una nueva incidencia con soporte de esquema polimórfico
 */
const createIncidencia = async (req, res, next) => {
  try {
    const {
      codigo,
      titulo,
      descripcion,
      categoria,
      prioridad,
      ubicacion,
      reportante,
      detalle,
    } = req.body;

    // Asignar código automático si no viene especificado
    const finalCodigo = codigo ? codigo.toUpperCase() : await generarCodigoIncidencia();

    // Asignar datos del reportante respetando el formulario o la sesión actual
    const datosReportante = {
      nombre: reportante?.nombre || req.user?.nombre || 'Usuario Campus',
      email: (reportante?.email || req.user?.email || 'usuario@utm.mx').toLowerCase(),
      rol: reportante?.rol || req.user?.rol || 'estudiante',
      departamento_carrera: reportante?.departamento_carrera || req.user?.departamento_carrera || 'General',
    };

    const nuevaIncidencia = new Incidencia({
      codigo: finalCodigo,
      titulo,
      descripcion,
      categoria,
      prioridad: prioridad || 'media',
      ubicacion,
      reportante: datosReportante,
      detalle,
      estado: 'abierta',
      revisiones: [],
      evidencias_adjuntas: [],
    });

    const guardada = await nuevaIncidencia.save();

    return res.status(201).json({
      ok: true,
      mensaje: 'Incidencia creada exitosamente',
      incidencia: guardada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidencias/:codigo/evidencias/archivo
 * Subir evidencia fotográfica o documental a Supabase Storage con validación RBAC:
 * - Reportante: Solo puede subir a tickets creados por él mismo.
 * - Técnico / Supervisor / Admin: Pueden subir evidencias técnicas a tickets operativos.
 */
const subirEvidencia = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const file = req.file;
    const rol = req.user?.rol?.toLowerCase() || 'reportante';
    const emailUsuario = req.user?.email?.toLowerCase();

    if (!file) {
      return res.status(400).json({
        ok: false,
        error: "No se proporcionó ningún archivo en el campo 'archivo'.",
      });
    }

    // 1. Verificar existencia del expediente en MongoDB Atlas
    const incidenciaExistente = await Incidencia.findOne({
      codigo: codigo.toUpperCase(),
    });

    if (!incidenciaExistente) {
      return res.status(404).json({
        ok: false,
        error: `No existe expediente con el código ${codigo.toUpperCase()}`,
      });
    }

    // 2. VALIDACIÓN RBAC: Si es reportante, debe ser dueño de la incidencia
    if (rol === 'reportante') {
      const emailReportante = incidenciaExistente.reportante?.email?.toLowerCase();
      if (emailReportante !== emailUsuario) {
        return res.status(403).json({
          ok: false,
          error: 'Acceso denegado: Solo puedes adjuntar evidencias a tus propias incidencias reportadas.',
          codigo: 'FORBIDDEN_EVIDENCE_UPLOAD',
        });
      }
    }

    // 3. Subir buffer a Supabase Storage y generar URL firmada de 6 días
    const { path, signedUrl, expiresAt, size } = await uploadEvidenceToSupabase(
      file.buffer,
      file.originalname,
      file.mimetype,
      codigo.toUpperCase()
    );

    // 4. Estructurar el subdocumento de la evidencia
    const nuevaEvidencia = {
      nombre_archivo: file.originalname,
      nombre_original: file.originalname,
      tipo_mime: file.mimetype,
      tamanio_bytes: size,
      supabase_path: path,
      url_firmada: signedUrl,
      url_expira: expiresAt,
      subido_por: req.user?.nombre || req.body.subido_por || 'Personal Campus',
      fecha_subida: new Date(),
    };

    // 5. Operación atómica de MongoDB con operador $push
    const incidenciaActualizada = await Incidencia.findOneAndUpdate(
      { codigo: codigo.toUpperCase() },
      { $push: { evidencias_adjuntas: nuevaEvidencia } },
      { new: true, runValidators: true }
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Evidencia subida a Supabase Storage y registrada en MongoDB Atlas correctamente.',
      evidencia: nuevaEvidencia,
      totalEvidencias: incidenciaActualizada.evidencias_adjuntas.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/incidencias/:codigo/estado
 * Actualizar el estado de la incidencia.
 * RBAC:
 * - Técnico: Solo en incidencias que tenga asignadas (o auto-asignación si está libre en su área).
 * - Supervisor y Admin: Acceso global para cambiar cualquier estado.
 * - Reportante y Directivo: 403 Forbidden.
 */
const actualizarEstado = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const { nuevoEstado, observaciones } = req.body;
    const rol = req.user?.rol?.toLowerCase();
    const emailUsuario = req.user?.email?.toLowerCase();

    if (!nuevoEstado) {
      return res.status(400).json({
        ok: false,
        error: 'El campo nuevoEstado es obligatorio',
      });
    }

    const incidencia = await Incidencia.findOne({ codigo: codigo.toUpperCase() });
    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    // Restricción RBAC para Técnicos
    if (rol === 'tecnico') {
      const tecnicoAsignadoEmail = incidencia.tecnico_asignado?.email?.toLowerCase();
      
      // Si ya está asignada a otro técnico, denegar
      if (tecnicoAsignadoEmail && tecnicoAsignadoEmail !== emailUsuario) {
        return res.status(403).json({
          ok: false,
          error: `Acceso denegado: Esta incidencia está asignada al técnico ${incidencia.tecnico_asignado.nombre}. Solo el técnico asignado puede actualizar el estado.`,
          codigo: 'FORBIDDEN_TECHNICIAN_ASSIGNMENT',
        });
      }

      // Si no estaba asignada, auto-asignarla al técnico que toma la acción
      if (!tecnicoAsignadoEmail) {
        incidencia.tecnico_asignado = {
          id: req.user._id,
          nombre: req.user.nombre,
          email: req.user.email,
          id_tecnico: req.user.id_tecnico || 'TEC-AUTO',
          area: req.user.area,
          fecha_asignacion: new Date(),
          asignado_por: 'Auto-asignación al atender',
        };
      }
    }

    const estadoAnterior = incidencia.estado;
    incidencia.estado = nuevoEstado;

    // Si se transiciona a resuelta o cerrada, registrar fecha_resolucion para MTTR
    if (nuevoEstado === 'resuelta' || nuevoEstado === 'cerrada') {
      if (!incidencia.fecha_resolucion) {
        incidencia.fecha_resolucion = new Date();
      }
    }

    // Agregar nota automática en el historial embebido
    incidencia.revisiones.push({
      fecha_revision: new Date(),
      tecnico: {
        nombre: req.user.nombre,
        id_tecnico: req.user.id_tecnico || 'SOP-UTM',
        departamento: req.user.cargo || 'Soporte Técnico',
      },
      diagnostico: `Cambio de estado: ${estadoAnterior} ➔ ${nuevoEstado}.`,
      estado_anterior: estadoAnterior,
      estado_asignado: nuevoEstado,
      accion_realizada: 'Actualización de estado operativo',
      observaciones: observaciones || '',
    });

    await incidencia.save();

    return res.status(200).json({
      ok: true,
      mensaje: `Estado actualizado a '${nuevoEstado}' correctamente`,
      incidencia,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidencias/:codigo/revisiones
 * Registrar una revisión técnica en la línea de tiempo.
 * RBAC:
 * - Técnico: Solo en incidencias que tenga asignadas.
 * - Supervisor y Admin: Acceso global.
 */
const addRevision = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const {
      tecnico_nombre,
      tecnico_id,
      diagnostico,
      estado_asignado,
      accion_realizada,
      observaciones,
    } = req.body;

    const rol = req.user?.rol?.toLowerCase();
    const emailUsuario = req.user?.email?.toLowerCase();

    const incidencia = await Incidencia.findOne({
      codigo: codigo.toUpperCase(),
    });

    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    // Validación RBAC para técnicos
    if (rol === 'tecnico') {
      const tecnicoAsignadoEmail = incidencia.tecnico_asignado?.email?.toLowerCase();
      if (tecnicoAsignadoEmail && tecnicoAsignadoEmail !== emailUsuario) {
        return res.status(403).json({
          ok: false,
          error: `Acceso denegado: Solo el técnico asignado (${incidencia.tecnico_asignado.nombre}) puede registrar revisiones técnicas en este ticket.`,
          codigo: 'FORBIDDEN_TECHNICIAN_REVIEW',
        });
      }

      // Si no estaba asignada, asignarla al técnico
      if (!tecnicoAsignadoEmail) {
        incidencia.tecnico_asignado = {
          id: req.user._id,
          nombre: req.user.nombre,
          email: req.user.email,
          id_tecnico: req.user.id_tecnico || 'TEC-AUTO',
          area: req.user.area,
          fecha_asignacion: new Date(),
          asignado_por: 'Auto-asignación al diagnosticar',
        };
      }
    }

    const nuevaRevision = {
      fecha_revision: new Date(),
      tecnico: {
        nombre: tecnico_nombre || req.user.nombre || 'Técnico de Guardia',
        id_tecnico: tecnico_id || req.user.id_tecnico || 'TEC-UTM-001',
        departamento: req.user.cargo || 'Soporte Técnico Campus',
      },
      diagnostico,
      estado_anterior: incidencia.estado,
      estado_asignado: estado_asignado || incidencia.estado,
      accion_realizada: accion_realizada || '',
      observaciones: observaciones || '',
    };

    incidencia.revisiones.push(nuevaRevision);

    if (estado_asignado) {
      incidencia.estado = estado_asignado;
      if (estado_asignado === 'resuelta' || estado_asignado === 'cerrada') {
        incidencia.fecha_resolucion = new Date();
      }
    }

    await incidencia.save();

    return res.status(201).json({
      ok: true,
      mensaje: 'Revisión técnica añadida exitosamente',
      revision: nuevaRevision,
      nuevoEstado: incidencia.estado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/incidencias/:codigo/asignar
 * Asignar o reasignar un técnico a la incidencia.
 * RBAC:
 * - Exclusivo para Supervisor y Admin.
 */
const asignarTecnico = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const { tecnico_id, tecnico_nombre, tecnico_email, tecnico_area, id_tecnico } = req.body;

    if (!tecnico_email || !tecnico_nombre) {
      return res.status(400).json({
        ok: false,
        error: 'Debe especificar el nombre y correo del técnico a asignar',
      });
    }

    const incidencia = await Incidencia.findOne({ codigo: codigo.toUpperCase() });
    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    const tecnicoAnterior = incidencia.tecnico_asignado?.nombre || 'Sin asignación previa';

    incidencia.tecnico_asignado = {
      id: tecnico_id || null,
      nombre: tecnico_nombre,
      email: tecnico_email.toLowerCase(),
      id_tecnico: id_tecnico || 'TEC-ASIG',
      area: tecnico_area || incidencia.categoria,
      fecha_asignacion: new Date(),
      asignado_por: `${req.user.nombre} (${req.user.rol.toUpperCase()})`,
    };

    // Si estaba abierta, moverla a en_progreso
    if (incidencia.estado === 'abierta') {
      incidencia.estado = 'en_progreso';
    }

    incidencia.revisiones.push({
      fecha_revision: new Date(),
      tecnico: {
        nombre: req.user.nombre,
        id_tecnico: 'SUP-ADM',
        departamento: 'Supervisión de Operaciones',
      },
      diagnostico: `Reasignación operativa: De '${tecnicoAnterior}' a '${tecnico_nombre}'.`,
      estado_anterior: incidencia.estado,
      estado_asignado: incidencia.estado,
      accion_realizada: 'Reasignación de técnico responsable',
      observaciones: `Asignado por ${req.user.nombre}`,
    });

    await incidencia.save();

    return res.status(200).json({
      ok: true,
      mensaje: `Técnico ${tecnico_nombre} asignado exitosamente a ${incidencia.codigo}`,
      incidencia,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncidencias,
  getIncidenciaByCodigo,
  createIncidencia,
  subirEvidencia,
  actualizarEstado,
  addRevision,
  asignarTecnico,
};
