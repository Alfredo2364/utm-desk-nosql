const mongoose = require('mongoose');

// Subdocumento embebido: Revisiones Técnicas
const revisionSchema = new mongoose.Schema(
  {
    fecha_revision: {
      type: Date,
      default: Date.now,
      required: true,
    },
    tecnico: {
      nombre: { type: String, required: true },
      id_tecnico: { type: String, required: true },
      departamento: { type: String, default: 'Soporte Técnico UTM' },
    },
    diagnostico: {
      type: String,
      required: true,
      trim: true,
    },
    estado_anterior: {
      type: String,
      enum: ['abierta', 'en_progreso', 'pendiente_revision', 'resuelta', 'cerrada'],
    },
    estado_asignado: {
      type: String,
      required: true,
      enum: ['abierta', 'en_progreso', 'pendiente_revision', 'resuelta', 'cerrada'],
    },
    accion_realizada: {
      type: String,
      default: '',
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

// Subdocumento embebido: Evidencias Adjuntas (Almacenadas en Supabase Storage)
const evidenciaSchema = new mongoose.Schema(
  {
    nombre_archivo: {
      type: String,
      required: true,
    },
    nombre_original: {
      type: String,
      required: true,
    },
    tipo_mime: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    },
    tamanio_bytes: {
      type: Number,
      required: true,
      max: [5242880, 'El archivo excede el tamaño máximo permitido de 5MB'],
    },
    supabase_path: {
      type: String,
      required: true,
    },
    url_firmada: {
      type: String,
      required: true,
    },
    url_expira: {
      type: Date,
      required: true,
    },
    subido_por: {
      type: String,
      default: 'Usuario del Campus',
    },
    fecha_subida: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Esquema Principal Polimórfico: Incidencias de Campus
const incidenciaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código de incidencia es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    titulo: {
      type: String,
      required: [true, 'El título de la incidencia es obligatorio'],
      trim: true,
      maxlength: 150,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción detallada es obligatoria'],
      trim: true,
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: [
          'computo_telecomunicaciones',
          'infraestructura_mantenimiento',
          'sistemas_servicios_academicos',
        ],
        message: 'Categoría no válida en el campus',
      },
      index: true,
    },
    estado: {
      type: String,
      required: true,
      enum: ['abierta', 'en_progreso', 'pendiente_revision', 'resuelta', 'cerrada'],
      default: 'abierta',
      index: true,
    },
    prioridad: {
      type: String,
      required: true,
      enum: ['baja', 'media', 'alta', 'critica'],
      default: 'media',
      index: true,
    },
    ubicacion: {
      edificio: { type: String, required: true, trim: true },
      aula_laboratorio: { type: String, required: true, trim: true },
      piso: { type: String, default: 'Planta Baja' },
      referencias: { type: String, default: '' },
    },
    reportante: {
      nombre: { type: String, required: true },
      email: { type: String, required: true },
      rol: {
        type: String,
        default: 'estudiante',
      },
      departamento_carrera: { type: String, default: 'General' },
    },
    // Campo Polimórfico: Su estructura varía según el valor de 'categoria'
    detalle: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (detalle) {
          if (!detalle || typeof detalle !== 'object') return false;

          if (this.categoria === 'computo_telecomunicaciones') {
            return (
              detalle.tipo_dispositivo &&
              typeof detalle.tipo_dispositivo === 'string'
            );
          }
          if (this.categoria === 'infraestructura_mantenimiento') {
            return (
              detalle.tipo_servicio &&
              typeof detalle.tipo_servicio === 'string'
            );
          }
          if (this.categoria === 'sistemas_servicios_academicos') {
            return (
              detalle.plataforma &&
              typeof detalle.plataforma === 'string'
            );
          }
          return true;
        },
        message: 'Los atributos del campo detalle no cumplen con los requerimientos polimórficos de la categoría especificada.',
      },
    },
    // Subdocumentos Embebidos
    revisiones: [revisionSchema],
    evidencias_adjuntas: [evidenciaSchema],
    // Técnico asignado para RBAC
    tecnico_asignado: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
      nombre: { type: String, default: null },
      email: { type: String, default: null },
      id_tecnico: { type: String, default: null },
      area: { type: String, default: null },
      fecha_asignacion: { type: Date, default: null },
      asignado_por: { type: String, default: null },
    },
    // Fecha en la que la incidencia pasó a 'resuelta' (para métricas MTTR)
    fecha_resolucion: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'incidencias_campus',
  }
);

// Índices compuestos para optimizar búsquedas por filtros frecuentes
incidenciaSchema.index({ categoria: 1, estado: 1 });
incidenciaSchema.index({ 'ubicacion.edificio': 1 });

const Incidencia = mongoose.model('Incidencia', incidenciaSchema);

module.exports = Incidencia;
