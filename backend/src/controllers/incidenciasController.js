const Incidencia = require('../models/Incidencia');
const { uploadEvidenceToSupabase } = require('../config/supabase');

/**
 * Genera un código correlativo para incidencias si no es provisto
 * Ejemplo: UTM-2026-0142
 */
const generarCodigoIncidencia = async () => {
  const anio = new Date().getFullYear();
  const count = await Incidencia.countDocuments();
  const secuencia = String(count + 1).padStart(4, '0');
  return `UTM-${anio}-${secuencia}`;
};

/**
 * GET /api/incidencias
 * Listar incidencias con filtros de búsqueda por categoria, estado y prioridad
 */
const getIncidencias = async (req, res, next) => {
  try {
    const { categoria, estado, prioridad, search } = req.query;
    const filtro = {};

    if (categoria && categoria !== 'todas') {
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

    // Métricas rápidas de bandeja
    const estadisticas = {
      total: await Incidencia.countDocuments(),
      abiertas: await Incidencia.countDocuments({ estado: 'abierta' }),
      en_progreso: await Incidencia.countDocuments({ estado: 'en_progreso' }),
      resueltas: await Incidencia.countDocuments({ estado: 'resuelta' }),
      criticas: await Incidencia.countDocuments({ prioridad: 'critica' }),
    };

    return res.status(200).json({
      ok: true,
      totalResultados: incidencias.length,
      estadisticas,
      incidencias,
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

    // Búsqueda del documento íntegro (incluye detalle polimórfico, revisiones y evidencias embebidas)
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

    const nuevaIncidencia = new Incidencia({
      codigo: finalCodigo,
      titulo,
      descripcion,
      categoria,
      prioridad: prioridad || 'media',
      ubicacion,
      reportante,
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
 * Recibe archivo multipart/form-data vía Multer (campo 'archivo'),
 * lo sube a Supabase Storage en bucket privado,
 * genera URL firmada de 6 días, y realiza $push atómico en MongoDB Atlas
 */
const subirEvidencia = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const file = req.file;

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

    // 2. Subir buffer a Supabase Storage y generar URL firmada de 6 días
    const { path, signedUrl, expiresAt, size } = await uploadEvidenceToSupabase(
      file.buffer,
      file.originalname,
      file.mimetype,
      codigo.toUpperCase()
    );

    // 3. Estructurar el subdocumento de la evidencia
    const nuevaEvidencia = {
      nombre_archivo: file.originalname,
      nombre_original: file.originalname,
      tipo_mime: file.mimetype,
      tamanio_bytes: size,
      supabase_path: path,
      url_firmada: signedUrl,
      url_expira: expiresAt,
      subido_por: req.body.subido_por || 'Técnico / Reportante Campus',
      fecha_subida: new Date(),
    };

    // 4. Operación atómica de MongoDB con operador $push
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
 * POST /api/incidencias/:codigo/revisiones
 * Registrar una revisión técnica en la línea de tiempo y actualizar el estado
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

    const incidencia = await Incidencia.findOne({
      codigo: codigo.toUpperCase(),
    });

    if (!incidencia) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró la incidencia ${codigo.toUpperCase()}`,
      });
    }

    const nuevaRevision = {
      fecha_revision: new Date(),
      tecnico: {
        nombre: tecnico_nombre || 'Técnico de Guardia',
        id_tecnico: tecnico_id || 'TEC-UTM-001',
        departamento: 'Soporte Técnico Campus',
      },
      diagnostico,
      estado_anterior: incidencia.estado,
      estado_asignado: estado_asignado || incidencia.estado,
      accion_realizada: accion_realizada || '',
      observaciones: observaciones || '',
    };

    // Actualizar estado general y agregar al historial embebido
    incidencia.revisiones.push(nuevaRevision);
    if (estado_asignado) {
      incidencia.estado = estado_asignado;
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

module.exports = {
  getIncidencias,
  getIncidenciaByCodigo,
  createIncidencia,
  subirEvidencia,
  addRevision,
};
