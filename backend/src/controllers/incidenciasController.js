const Incidencia = require('../models/Incidencia');
const { uploadEvidenceToSupabase } = require('../config/supabase');
const { normalizarAreaTecnica } = require('../middlewares/auth');

/**
 * Genera un código correlativo único con el formato oficial INC-AAAA-NNNN (RF-01)
 */
const generarCodigoIncidencia = async () => {
  const anio = new Date().getFullYear();
  let num = (await Incidencia.countDocuments()) + 1;
  let codigo = `INC-${anio}-${String(num).padStart(4, '0')}`;
  while (await Incidencia.exists({ codigo })) {
    num++;
    codigo = `INC-${anio}-${String(num).padStart(4, '0')}`;
  }
  return codigo;
};

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Construye una expresión regular insensible a acentos/diacríticos y mayúsculas.
 * Soporta "sAbado" <-> "Sábado", "MartEs" <-> "martes", "ano" <-> "año", etc.
 */
function buildAccentInsensitiveRegex(raw) {
  if (!raw || !String(raw).trim()) return null;
  const clean = String(raw).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const charMap = {
    'a': '[aáàäâAÁÀÄÂ]',
    'e': '[eéèëêEÉÈËÊ]',
    'i': '[iíìïîIÍÌÏÎ]',
    'o': '[oóòöôOÓÒÖÔ]',
    'u': '[uúùüûUÚÙÜÛ]',
    'n': '[nñNÑ]',
    'c': '[cçCÇ]'
  };
  let pattern = '';
  for (const char of clean) {
    const lower = char.toLowerCase();
    if (charMap[lower]) {
      pattern += charMap[lower];
    } else {
      pattern += escapeRegex(char);
    }
  }
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
}

/**
 * Parsea un folio flexible extrayendo año y número secuencial
 */
function parseFolio(raw) {
  if (!raw) return null;
  const clean = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = clean.match(/^(?:INC|UTM)?(?:(202\d))?0*(\d{1,5})$/);
  if (match) {
    const year = match[1] || '202[0-9]';
    const num = match[2];
    const padded = num.padStart(4, '0');
    return {
      year,
      num,
      padded,
      pattern: `-(?:${year}-)?0*${num}$`
    };
  }
  return null;
}

/**
 * Busca una incidencia por código exacto o equivalente (soporta INC-YYYY-NNNN, UTM-YYYY-NNNN, inc20260001, 0001, 1, etc.)
 */
const buscarPorCodigo = async (rawCodigo) => {
  if (!rawCodigo) return null;
  const raw = String(rawCodigo).trim();
  const upper = raw.toUpperCase();

  // 1. Coincidencia exacta directa
  let inc = await Incidencia.findOne({ codigo: upper });
  if (inc) return inc;

  // 2. Prefijo alternativo UTM- <-> INC-
  const alt = upper.startsWith('UTM-')
    ? upper.replace(/^UTM-/, 'INC-')
    : upper.startsWith('INC-')
    ? upper.replace(/^INC-/, 'UTM-')
    : null;
  if (alt) {
    inc = await Incidencia.findOne({ codigo: alt });
    if (inc) return inc;
  }

  // 3. Parser de Folio Inteligente (soporta "inc20260001", "2026-0001", "utm 2026 0001", "0001", "1")
  const parsed = parseFolio(raw);
  if (parsed) {
    try {
      inc = await Incidencia.findOne({
        codigo: { $regex: new RegExp(parsed.pattern, 'i') },
      });
      if (inc) return inc;
    } catch {
      // continuar
    }
  }

  // 4. Búsqueda por número puro al final (ej. "1", "6", "0001", "0006")
  const numMatch = raw.match(/\d+$/);
  if (numMatch) {
    const padded = numMatch[0].padStart(4, '0');
    try {
      inc = await Incidencia.findOne({
        codigo: { $regex: new RegExp(`-${padded}$`, 'i') },
      });
      if (inc) return inc;
    } catch {
      // continuar
    }
  }

  return null;
};

/**
 * RF-02 | GET /api/incidencias
 * Listar incidencias aplicando filtros y Matriz de Permisos (Tabla 4):
 * - Reportante: Propias
 * - Técnico: Su área
 * - Supervisor / Admin / SuperAdmin: Todas
 */
const getIncidencias = async (req, res, next) => {
  try {
    const { categoria, estado, prioridad, search, asignacion } = req.query;
    const filtro = {};
    const rol = req.user?.rol?.toLowerCase() || 'reportante';
    const emailUsuario = (req.user?.email || req.user?.correo || '').toLowerCase();
    const areaNormalizada = normalizarAreaTecnica(req.user?.area);

    // --- RESTRICCIONES RBAC (Tabla 4) ---
    if (rol === 'reportante') {
      filtro.$or = [
        { 'reportante.email': emailUsuario },
        ...(req.user?._id ? [{ reportadoPor: req.user._id }] : []),
      ];
    } else if (rol === 'tecnico') {
      if (areaNormalizada && areaNormalizada !== 'general') {
        filtro.categoria = areaNormalizada;
      }
      if (asignacion === 'mis_asignadas') {
        filtro.$or = [
          { 'tecnico_asignado.email': emailUsuario },
          ...(req.user?._id ? [{ asignadoA: req.user._id }] : []),
        ];
      }
    }

    // Filtros adicionales enviados por query string (?categoria=&estado=)
    if (categoria && categoria !== 'todas' && rol !== 'tecnico') {
      filtro.categoria = normalizarAreaTecnica(categoria) || categoria;
    }

    if (estado && estado !== 'todos') {
      if (estado === 'en_proceso' || estado === 'en_progreso') {
        filtro.estado = { $in: ['en_proceso', 'en_progreso'] };
      } else {
        filtro.estado = estado;
      }
    }

    if (prioridad && prioridad !== 'todas') {
      filtro.prioridad = prioridad;
    }

    if (search && String(search).trim() !== '') {
      const trimmedSearch = String(search).trim();
      const regex = buildAccentInsensitiveRegex(trimmedSearch);
      const searchOr = [];

      if (regex) {
        searchOr.push(
          { codigo: regex },
          { titulo: regex },
          { descripcion: regex },
          { categoria: regex },
          { 'ubicacion.edificio': regex },
          { 'ubicacion.edificioId': regex },
          { 'ubicacion.aula': regex },
          { 'ubicacion.aula_laboratorio': regex },
          { 'tecnico_asignado.nombre': regex },
          { 'reportante.nombre': regex }
        );
      }

      // Soporte para buscar folio por número directo (ej: "0006" o "6")
      const numMatch = trimmedSearch.match(/^\d{1,4}$/);
      if (numMatch) {
        const padded = numMatch[0].padStart(4, '0');
        searchOr.push({ codigo: new RegExp(`-${padded}$`, 'i') });
      }

      if (searchOr.length > 0) {
        if (filtro.$or) {
          filtro.$and = [{ $or: filtro.$or }, { $or: searchOr }];
          delete filtro.$or;
        } else {
          filtro.$or = searchOr;
        }
      }
    }

    const incidencias = await Incidencia.find(filtro)
      .sort({ fechaReporte: -1, createdAt: -1 })
      .select('-__v');

    const baseStatsQuery =
      rol === 'reportante'
        ? { 'reportante.email': emailUsuario }
        : rol === 'tecnico' && areaNormalizada && areaNormalizada !== 'general'
        ? { categoria: areaNormalizada }
        : {};

    const estadisticas = {
      total: await Incidencia.countDocuments(baseStatsQuery),
      abiertas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'abierta' }),
      asignadas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'asignada' }),
      en_progreso: await Incidencia.countDocuments({
        ...baseStatsQuery,
        estado: { $in: ['en_proceso', 'en_progreso'] },
      }),
      resueltas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'resuelta' }),
      cerradas: await Incidencia.countDocuments({ ...baseStatsQuery, estado: 'cerrada' }),
      criticas: await Incidencia.countDocuments({ ...baseStatsQuery, prioridad: 'critica' }),
    };

    return res.status(200).json({
      ok: true,
      totalResultados: incidencias.length,
      estadisticas,
      incidencias,
      usuarioContexto: {
        email: emailUsuario,
        rol: req.user.rol,
        area: req.user.area,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RF-03 | GET /api/incidencias/:codigo
 * Consultar expediente completo en una sola lectura sin JOINs.
 * RBAC (Tabla 4):
 * - Reportante: Solo Propias
 * - Técnico: Solo Su área
 * - Supervisor / Admin / SuperAdmin: Todas
 */
const getIncidenciaByCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const rol = req.user?.rol?.toLowerCase() || 'reportante';
    const emailUsuario = (req.user?.email || req.user?.correo || '').toLowerCase();
    const areaNormalizada = normalizarAreaTecnica(req.user?.area);

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        error: 'El parámetro código es requerido',
      });
    }

    const incidencia = await buscarPorCodigo(codigo);

    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró ningún expediente con el código ${codigo.toUpperCase()}`,
      });
    }

    // Validación RBAC (Tabla 4)
    if (rol === 'reportante') {
      const esPropia =
        incidencia.reportante?.email?.toLowerCase() === emailUsuario ||
        (req.user?._id && String(incidencia.reportadoPor) === String(req.user._id));
      if (!esPropia) {
        return res.status(403).json({
          ok: false,
          error: 'Acceso denegado (Tabla 4): Un reportante solo puede consultar sus propias incidencias.',
          codigo: 'FORBIDDEN_OWNERSHIP',
        });
      }
    } else if (rol === 'tecnico') {
      if (areaNormalizada && areaNormalizada !== 'general' && incidencia.categoria !== areaNormalizada) {
        return res.status(403).json({
          ok: false,
          error: `Acceso denegado (Tabla 4): Este expediente pertenece al área '${incidencia.categoria}' y tu perfil técnico corresponde a '${areaNormalizada}'.`,
          codigo: 'FORBIDDEN_AREA',
        });
      }
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
 * RF-01 | POST /api/incidencias
 * Registrar una nueva incidencia con esquema polimórfico y código INC-AAAA-NNNN.
 * RBAC (Tabla 4): Reportante, Supervisor, Admin y SuperAdmin.
 */
const createIncidencia = async (req, res, next) => {
  try {
    const {
      codigo,
      titulo,
      descripcion,
      categoria,
      prioridad,
      canal_origen,
      ubicacion,
      reportante,
      reportadoPor,
      detalle,
    } = req.body;

    const finalCodigo = codigo ? codigo.toUpperCase() : await generarCodigoIncidencia();

    const datosReportante = {
      nombre: reportante?.nombre || req.user?.nombre || 'Integrante Comunidad UTM',
      email: (reportante?.email || req.user?.email || req.user?.correo || 'alumno.garcia@utm.mx').toLowerCase(),
      rol: reportante?.rol || req.user?.rol || 'reportante',
      departamento_carrera: reportante?.departamento_carrera || req.user?.departamento_carrera || 'Campus UTM',
    };

    const nuevaIncidencia = new Incidencia({
      codigo: finalCodigo,
      titulo,
      descripcion,
      categoria: normalizarAreaTecnica(categoria) || categoria,
      prioridad: prioridad || 'media',
      canal_origen: canal_origen || 'portal_autoservicio',
      ubicacion,
      reportadoPor: reportadoPor || req.user?._id || null,
      reportante: datosReportante,
      fechaReporte: new Date(),
      detalle,
      estado: 'abierta',
      revisiones: [],
      evidencias_adjuntas: [],
    });

    const guardada = await nuevaIncidencia.save();

    return res.status(201).json({
      ok: true,
      mensaje: 'Incidencia registrada exitosamente',
      incidencia: guardada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RF-06 | POST /api/incidencias/:codigo/evidencias/archivo
 * Cargar evidencia a Supabase Storage (con compresor Sharp HD) y registrar en MongoDB con $push.
 * RBAC (Tabla 4):
 * - Reportante: Solo en sus propias incidencias ("Propias")
 * - Técnico: Solo en las incidencias que tiene asignadas ("Asignadas")
 * - Admin / SuperAdmin: Acceso global ("Sí")
 * - Supervisor / Directivo: Denegado ("No")
 */
const subirEvidencia = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const file = req.file;
    const rol = req.user?.rol?.toLowerCase() || 'reportante';
    const emailUsuario = (req.user?.email || req.user?.correo || '').toLowerCase();

    if (!file) {
      return res.status(400).json({
        ok: false,
        error: "No se proporcionó ningún archivo en el campo 'archivo'.",
      });
    }

    const incidenciaExistente = await buscarPorCodigo(codigo);

    if (!incidenciaExistente) {
      return res.status(404).json({
        ok: false,
        error: `No existe expediente con el código ${codigo.toUpperCase()}`,
      });
    }

    // Validación RBAC estricta según Tabla 4
    if (rol === 'reportante') {
      const emailReportante = incidenciaExistente.reportante?.email?.toLowerCase();
      const esPropia =
        emailReportante === emailUsuario ||
        (req.user?._id && String(incidenciaExistente.reportadoPor) === String(req.user._id));
      if (!esPropia) {
        return res.status(403).json({
          ok: false,
          error: 'Acceso denegado (Tabla 4): El reportante solo puede adjuntar evidencias a sus propias incidencias.',
          codigo: 'FORBIDDEN_EVIDENCE_UPLOAD',
        });
      }
    } else if (rol === 'tecnico') {
      const tecnicoEmail = incidenciaExistente.tecnico_asignado?.email?.toLowerCase();
      const esAsignada =
        tecnicoEmail === emailUsuario ||
        (req.user?._id && String(incidenciaExistente.asignadoA) === String(req.user._id));
      if (!esAsignada) {
        return res.status(403).json({
          ok: false,
          error: 'Acceso denegado (Tabla 4): El técnico solo puede cargar evidencias en incidencias que tenga asignadas.',
          codigo: 'FORBIDDEN_TECHNICIAN_EVIDENCE',
        });
      }
    }

    // Subir buffer optimizado con Sharp HD a Supabase Storage y generar URL firmada de 6 días
    const { path, signedUrl, expiresAt, size, originalSize, ahorroPct } =
      await uploadEvidenceToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype,
        incidenciaExistente.codigo
      );

    const ahora = new Date();
    const nuevaEvidencia = {
      nombre_archivo: file.originalname,
      nombre_original: file.originalname,
      tipo_mime: file.mimetype,
      peso_kb: Math.max(1, Math.round(size / 1024)),
      tamanio_bytes: size,
      tamanio_original_bytes: originalSize || size,
      ahorro_compresion: ahorroPct || '0%',
      ruta_storage: path,
      supabase_path: path,
      url_storage: signedUrl,
      url_firmada: signedUrl,
      url_expira: expiresAt,
      subido_por: req.user?.nombre || req.body.subido_por || 'Usuario Campus',
      fecha_carga: ahora,
      fecha_subida: ahora,
    };

    const incidenciaActualizada = await Incidencia.findOneAndUpdate(
      { _id: incidenciaExistente._id },
      { $push: { evidencias_adjuntas: nuevaEvidencia } },
      { new: true, runValidators: true }
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Evidencia optimizada, subida a Supabase Storage y registrada en MongoDB Atlas con $push.',
      evidencia: nuevaEvidencia,
      totalEvidencias: incidenciaActualizada.evidencias_adjuntas.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RF-04 | PATCH /api/incidencias/:codigo/estado
 * Cambiar el estado de la incidencia y agregar revisión con estadoAnterior y estadoNuevo.
 * Estados: abierta, asignada, en_proceso (o en_progreso), resuelta y cerrada.
 * RBAC (Tabla 4):
 * - Técnico: Solo en incidencias Asignadas
 * - Admin / SuperAdmin: Sí (acceso global)
 * - Reportante / Supervisor / Directivo: No (403)
 */
const actualizarEstado = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const nuevoEstado = req.body.nuevoEstado || req.body.estado;
    const observaciones = req.body.observaciones || req.body.comentario || '';
    const rol = req.user?.rol?.toLowerCase();
    const emailUsuario = (req.user?.email || req.user?.correo || '').toLowerCase();

    if (!nuevoEstado) {
      return res.status(400).json({
        ok: false,
        error: 'El campo nuevoEstado (o estado) es obligatorio',
      });
    }

    const incidencia = await buscarPorCodigo(codigo);
    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    // Validación RBAC para Técnicos según Tabla 4 ("Asignadas")
    if (rol === 'tecnico') {
      const tecnicoAsignadoEmail = incidencia.tecnico_asignado?.email?.toLowerCase();
      const esAsignada =
        tecnicoAsignadoEmail === emailUsuario ||
        (req.user?._id && String(incidencia.asignadoA) === String(req.user._id));

      if (!esAsignada) {
        return res.status(403).json({
          ok: false,
          error:
            'Acceso denegado (Tabla 4): Un técnico solo puede cambiar el estado de las incidencias que tiene asignadas.',
          codigo: 'FORBIDDEN_TECHNICIAN_ASSIGNMENT',
        });
      }
    }

    const estadoAnterior = incidencia.estado;
    incidencia.estado = nuevoEstado;

    const ahora = new Date();
    if (nuevoEstado === 'resuelta' || nuevoEstado === 'cerrada') {
      if (!incidencia.fechaResolucion) {
        incidencia.fechaResolucion = ahora;
        incidencia.fecha_resolucion = ahora;
      }
      const inicio = new Date(incidencia.fechaReporte || incidencia.createdAt || ahora).getTime();
      incidencia.tiempoResolucionMin = Math.max(1, Math.round((ahora.getTime() - inicio) / 60000));
    }

    const comentarioRevision =
      observaciones || `Cambio de estado: ${estadoAnterior} ➔ ${nuevoEstado}.`;

    incidencia.revisiones.push({
      tecnicoId: req.user?._id || null,
      fecha: ahora,
      fecha_revision: ahora,
      tecnico: {
        nombre: req.user?.nombre || 'Técnico Asignado',
        id_tecnico: req.user?.id_tecnico || 'TEC-UTM',
        departamento: req.user?.cargo || 'Soporte Técnico UTM',
      },
      comentario: comentarioRevision,
      diagnostico: comentarioRevision,
      estadoAnterior,
      estado_anterior: estadoAnterior,
      estadoNuevo: nuevoEstado,
      estado_asignado: nuevoEstado,
      accion_realizada: 'Actualización de estado operativo (RF-04)',
      observaciones,
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
 * RF-05 | POST /api/incidencias/:codigo/revisiones
 * Agrega un comentario de técnico al historial con $push.
 * RBAC (Tabla 4):
 * - Técnico: Solo en incidencias Asignadas
 * - Admin / SuperAdmin: Sí
 * - Reportante / Supervisor / Directivo: No (403)
 */
const addRevision = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const {
      tecnicoId,
      tecnico_nombre,
      tecnico_id,
      comentario,
      diagnostico,
      estadoNuevo,
      estado_asignado,
      accion_realizada,
      observaciones,
    } = req.body;

    const textoDiagnostico = diagnostico || comentario;
    if (!textoDiagnostico) {
      return res.status(400).json({
        ok: false,
        error: 'El comentario o diagnóstico técnico es obligatorio.',
      });
    }

    const rol = req.user?.rol?.toLowerCase();
    const emailUsuario = (req.user?.email || req.user?.correo || '').toLowerCase();

    const incidencia = await buscarPorCodigo(codigo);
    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    if (rol === 'tecnico') {
      const tecnicoAsignadoEmail = incidencia.tecnico_asignado?.email?.toLowerCase();
      const esAsignada =
        tecnicoAsignadoEmail === emailUsuario ||
        (req.user?._id && String(incidencia.asignadoA) === String(req.user._id));

      if (!esAsignada) {
        return res.status(403).json({
          ok: false,
          error:
            'Acceso denegado (Tabla 4): Solo el técnico asignado puede agregar revisiones a este ticket.',
          codigo: 'FORBIDDEN_TECHNICIAN_REVIEW',
        });
      }
    }

    const ahora = new Date();
    const estadoPrevio = incidencia.estado;
    const estadoFinal = estadoNuevo || estado_asignado || incidencia.estado;

    const nuevaRevision = {
      tecnicoId: tecnicoId || req.user?._id || null,
      fecha: ahora,
      fecha_revision: ahora,
      tecnico: {
        nombre: tecnico_nombre || req.user?.nombre || 'Técnico UTM',
        id_tecnico: tecnico_id || req.user?.id_tecnico || 'TEC-UTM-001',
        departamento: req.user?.cargo || 'Soporte Técnico Campus',
      },
      comentario: textoDiagnostico,
      diagnostico: textoDiagnostico,
      estadoAnterior: estadoPrevio,
      estado_anterior: estadoPrevio,
      estadoNuevo: estadoFinal,
      estado_asignado: estadoFinal,
      accion_realizada: accion_realizada || 'Revisión técnica registrada',
      observaciones: observaciones || '',
    };

    const updateOps = {
      $push: { revisiones: nuevaRevision },
    };

    if (estadoFinal !== estadoPrevio) {
      updateOps.$set = { estado: estadoFinal };
      if (estadoFinal === 'resuelta' || estadoFinal === 'cerrada') {
        const inicio = new Date(incidencia.fechaReporte || incidencia.createdAt || ahora).getTime();
        updateOps.$set.fechaResolucion = ahora;
        updateOps.$set.fecha_resolucion = ahora;
        updateOps.$set.tiempoResolucionMin = Math.max(1, Math.round((ahora.getTime() - inicio) / 60000));
      }
    }

    const incidenciaActualizada = await Incidencia.findOneAndUpdate(
      { _id: incidencia._id },
      updateOps,
      { new: true, runValidators: true }
    );

    const revGuardada =
      incidenciaActualizada.revisiones[incidenciaActualizada.revisiones.length - 1];

    return res.status(201).json({
      ok: true,
      mensaje: 'Revisión técnica añadida exitosamente con $push',
      revision: revGuardada,
      nuevoEstado: incidenciaActualizada.estado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/incidencias/:codigo/asignar
 * Asignar o reasignar un técnico a la incidencia (Gestión de Supervisor, Admin y SuperAdmin).
 */
const asignarTecnico = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const { tecnicoId, nombre, email, id_tecnico, area } = req.body;

    if (!email && !nombre && !tecnicoId) {
      return res.status(400).json({
        ok: false,
        error: 'Se requiere proporcionar los datos del técnico a asignar.',
      });
    }

    const incidencia = await buscarPorCodigo(codigo);
    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    const ahora = new Date();
    incidencia.asignadoA = tecnicoId || null;
    incidencia.tecnico_asignado = {
      id: tecnicoId || null,
      nombre: nombre || 'Técnico Especialista',
      email: (email || '').toLowerCase(),
      id_tecnico: id_tecnico || 'TEC-ASIG',
      area: normalizarAreaTecnica(area) || incidencia.categoria,
      fecha_asignacion: ahora,
      asignado_por: req.user?.nombre || 'Supervisor Campus',
    };

    const estadoPrevio = incidencia.estado;
    if (incidencia.estado === 'abierta') {
      incidencia.estado = 'asignada';
    }

    const notaAsignacion = `Ticket asignado al técnico ${incidencia.tecnico_asignado.nombre} (${incidencia.tecnico_asignado.email}) por ${req.user?.nombre || 'Supervisión'}.`;

    incidencia.revisiones.push({
      tecnicoId: req.user?._id || null,
      fecha: ahora,
      fecha_revision: ahora,
      tecnico: {
        nombre: req.user?.nombre || 'Supervisor de Operaciones',
        id_tecnico: 'SUP-UTM',
        departamento: 'Supervisión y Gestión de Tickets',
      },
      comentario: notaAsignacion,
      diagnostico: notaAsignacion,
      estadoAnterior: estadoPrevio,
      estado_anterior: estadoPrevio,
      estadoNuevo: incidencia.estado,
      estado_asignado: incidencia.estado,
      accion_realizada: 'Asignación de técnico responsable',
      observaciones: '',
    });

    await incidencia.save();

    return res.status(200).json({
      ok: true,
      mensaje: `Incidencia ${incidencia.codigo} asignada a ${incidencia.tecnico_asignado.nombre}`,
      incidencia,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncidencias,
  getIncidenciaByCodigo,
  buscarPorCodigo,
  buildAccentInsensitiveRegex,
  createIncidencia,
  subirEvidencia,
  actualizarEstado,
  addRevision,
  asignarTecnico,
};
