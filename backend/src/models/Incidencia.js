const mongoose = require('mongoose');

const ESTADOS_VALIDOS = [
  'abierta',
  'asignada',
  'en_proceso',
  'en_progreso',
  'pendiente_revision',
  'resuelta',
  'cerrada',
];

// Subdocumento embebido: Revisiones Técnicas (compatible con Figuras 2-4 del ERS y UI)
const revisionSchema = new mongoose.Schema(
  {
    tecnicoId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    fecha_revision: {
      type: Date,
      default: Date.now,
    },
    tecnico: {
      nombre: { type: String, default: 'Técnico UTM' },
      id_tecnico: { type: String, default: 'TEC-UTM' },
      departamento: { type: String, default: 'Soporte Técnico UTM' },
    },
    comentario: {
      type: String,
      trim: true,
    },
    diagnostico: {
      type: String,
      trim: true,
    },
    estadoAnterior: {
      type: String,
      enum: ESTADOS_VALIDOS,
    },
    estado_anterior: {
      type: String,
      enum: ESTADOS_VALIDOS,
    },
    estadoNuevo: {
      type: String,
      enum: ESTADOS_VALIDOS,
    },
    estado_asignado: {
      type: String,
      enum: ESTADOS_VALIDOS,
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

revisionSchema.pre('validate', function (next) {
  if (this.comentario && !this.diagnostico) this.diagnostico = this.comentario;
  if (this.diagnostico && !this.comentario) this.comentario = this.diagnostico;
  if (this.estadoAnterior && !this.estado_anterior) this.estado_anterior = this.estadoAnterior;
  if (this.estado_anterior && !this.estadoAnterior) this.estadoAnterior = this.estado_anterior;
  if (this.estadoNuevo && !this.estado_asignado) this.estado_asignado = this.estadoNuevo;
  if (this.estado_asignado && !this.estadoNuevo) this.estadoNuevo = this.estado_asignado;
  if (this.fecha && !this.fecha_revision) this.fecha_revision = this.fecha;
  if (this.fecha_revision && !this.fecha) this.fecha = this.fecha_revision;
  next();
});

// Subdocumento embebido: Evidencias Adjuntas (Almacenadas en Supabase Storage, compatible con Figuras 2-4 y UI)
const evidenciaSchema = new mongoose.Schema(
  {
    nombre_archivo: {
      type: String,
      required: true,
    },
    nombre_original: {
      type: String,
    },
    tipo_mime: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'],
    },
    peso_kb: {
      type: Number,
      default: 0,
    },
    tamanio_bytes: {
      type: Number,
      default: 0,
      max: [5242880, 'El archivo excede el tamaño máximo permitido de 5MB'],
    },
    tamanio_original_bytes: {
      type: Number,
      default: 0,
    },
    ahorro_compresion: {
      type: String,
      default: '0%',
    },
    ruta_storage: {
      type: String,
    },
    supabase_path: {
      type: String,
    },
    url_storage: {
      type: String,
    },
    url_firmada: {
      type: String,
    },
    url_expira: {
      type: Date,
    },
    subido_por: {
      type: String,
      default: 'Usuario del Campus',
    },
    fecha_carga: {
      type: Date,
      default: Date.now,
    },
    fecha_subida: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

evidenciaSchema.pre('validate', function (next) {
  if (!this.nombre_original && this.nombre_archivo) this.nombre_original = this.nombre_archivo;
  if (!this.ruta_storage && this.supabase_path) this.ruta_storage = this.supabase_path;
  if (!this.supabase_path && this.ruta_storage) this.supabase_path = this.ruta_storage;
  if (!this.url_storage && this.url_firmada) this.url_storage = this.url_firmada;
  if (!this.url_firmada && this.url_storage) this.url_firmada = this.url_storage;
  if (!this.peso_kb && this.tamanio_bytes) this.peso_kb = Math.max(1, Math.round(this.tamanio_bytes / 1024));
  if (!this.tamanio_bytes && this.peso_kb) this.tamanio_bytes = this.peso_kb * 1024;
  if (!this.fecha_carga && this.fecha_subida) this.fecha_carga = this.fecha_subida;
  if (!this.fecha_subida && this.fecha_carga) this.fecha_subida = this.fecha_carga;
  next();
});

// Esquema Principal Polimórfico: Incidencias de Campus
const incidenciaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código de incidencia es obligatorio'],
      trim: true,
      uppercase: true,
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
    },
    estado: {
      type: String,
      required: true,
      enum: ESTADOS_VALIDOS,
      default: 'abierta',
    },
    prioridad: {
      type: String,
      required: true,
      enum: ['baja', 'media', 'alta', 'critica'],
      default: 'media',
    },
    canal_origen: {
      type: String,
      enum: [
        'portal_autoservicio',
        'ventanilla_presencial',
        'mesa_telefonica',
        'correo_institucional',
        'monitoreo_automatico',
      ],
      default: 'portal_autoservicio',
    },
    ubicacion: {
      edificioId: { type: String, trim: true },
      aula: { type: String, trim: true },
      edificio: { type: String, trim: true },
      aula_laboratorio: { type: String, trim: true },
      piso: { type: String, default: 'Planta Baja' },
      referencias: { type: String, default: '' },
    },
    // Referencias directas de colección según Tabla 7 y Figuras 2-4
    reportadoPor: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    asignadoA: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fechaReporte: {
      type: Date,
      default: Date.now,
    },
    fechaResolucion: {
      type: Date,
      default: null,
    },
    tiempoResolucionMin: {
      type: Number,
      default: null,
    },
    // Información enriquecida del reportante para la interfaz
    reportante: {
      nombre: { type: String, default: 'Usuario Campus' },
      email: { type: String, default: 'alumno.garcia@utm.mx' },
      rol: { type: String, default: 'reportante' },
      departamento_carrera: { type: String, default: 'General' },
    },
    // Campo Polimórfico: Su estructura varía según el valor de 'categoria' (Figuras 2, 3 y 4)
    detalle: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (detalle) {
          if (!detalle || typeof detalle !== 'object') return false;

          if (this.categoria === 'computo_telecomunicaciones') {
            return Boolean(
              detalle.tipo_dispositivo ||
              detalle.ip ||
              detalle.direccion_ip ||
              detalle.puertoUplink
            );
          }
          if (this.categoria === 'infraestructura_mantenimiento') {
            return Boolean(
              detalle.tipo_servicio ||
              detalle.tipoDano ||
              detalle.insumos
            );
          }
          if (this.categoria === 'sistemas_servicios_academicos') {
            return Boolean(
              detalle.plataforma && typeof detalle.plataforma === 'string'
            );
          }
          return true;
        },
        message:
          'Los atributos del campo detalle no cumplen con los requerimientos polimórficos de la categoría especificada.',
      },
    },
    // Subdocumentos Embebidos
    revisiones: [revisionSchema],
    evidencias_adjuntas: [evidenciaSchema],
    // Técnico asignado enriquecido para RBAC
    tecnico_asignado: {
      id: { type: mongoose.Schema.Types.Mixed, default: null },
      nombre: { type: String, default: null },
      email: { type: String, default: null },
      id_tecnico: { type: String, default: null },
      area: { type: String, default: null },
      fecha_asignacion: { type: Date, default: null },
      asignado_por: { type: String, default: null },
    },
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

// Sincronización automática de campos entre formato ERS (Figuras 2-4) y UI
incidenciaSchema.pre('validate', function (next) {
  if (this.ubicacion) {
    if (this.ubicacion.edificioId && !this.ubicacion.edificio) {
      this.ubicacion.edificio = this.ubicacion.edificioId;
    }
    if (this.ubicacion.edificio && !this.ubicacion.edificioId) {
      // Extraer clave corta si viene como "Edificio A (ED-A)" o usar el valor
      const match = this.ubicacion.edificio.match(/\((ED-[A-Z0-9]+)\)/i);
      this.ubicacion.edificioId = match ? match[1].toUpperCase() : this.ubicacion.edificio;
    }
    if (this.ubicacion.aula && !this.ubicacion.aula_laboratorio) {
      this.ubicacion.aula_laboratorio = this.ubicacion.aula;
    }
    if (this.ubicacion.aula_laboratorio && !this.ubicacion.aula) {
      this.ubicacion.aula = this.ubicacion.aula_laboratorio;
    }
  }

  // Sincronizar fechas de resolución y cálculo de tiempoResolucionMin
  if (this.fechaResolucion && !this.fecha_resolucion) {
    this.fecha_resolucion = this.fechaResolucion;
  }
  if (this.fecha_resolucion && !this.fechaResolucion) {
    this.fechaResolucion = this.fecha_resolucion;
  }
  if (!this.fechaReporte) {
    this.fechaReporte = this.createdAt || new Date();
  }
  if (this.fechaResolucion && this.tiempoResolucionMin == null) {
    const inicio = new Date(this.fechaReporte || this.createdAt || Date.now()).getTime();
    const fin = new Date(this.fechaResolucion).getTime();
    this.tiempoResolucionMin = Math.max(1, Math.round((fin - inicio) / 60000));
  }

  // Sincronizar detalle polimórfico (Figuras 2-4 <-> UI)
  if (this.detalle && typeof this.detalle === 'object') {
    if (this.categoria === 'computo_telecomunicaciones') {
      if (this.detalle.ip && !this.detalle.direccion_ip) this.detalle.direccion_ip = this.detalle.ip;
      if (this.detalle.direccion_ip && !this.detalle.ip) this.detalle.ip = this.detalle.direccion_ip;
      if (this.detalle.vlan && !this.detalle.segmento_vlan) this.detalle.segmento_vlan = `VLAN-${this.detalle.vlan}`;
      if (!this.detalle.tipo_dispositivo && (this.detalle.ip || this.detalle.puertoUplink)) {
        this.detalle.tipo_dispositivo = 'Switch / Nodo de Red';
      }
    } else if (this.categoria === 'infraestructura_mantenimiento') {
      if (this.detalle.tipoDano && !this.detalle.tipo_servicio) this.detalle.tipo_servicio = this.detalle.tipoDano;
      if (this.detalle.tipo_servicio && !this.detalle.tipoDano) this.detalle.tipoDano = this.detalle.tipo_servicio;
      if (Array.isArray(this.detalle.insumos) && !this.detalle.materiales_requeridos) {
        this.detalle.materiales_requeridos = this.detalle.insumos;
      }
      if (Array.isArray(this.detalle.materiales_requeridos) && !this.detalle.insumos) {
        this.detalle.insumos = this.detalle.materiales_requeridos;
      }
    } else if (this.categoria === 'sistemas_servicios_academicos') {
      if (this.detalle.estudiantesAfectados != null && this.detalle.usuarios_afectados == null) {
        this.detalle.usuarios_afectados = this.detalle.estudiantesAfectados;
      }
      if (this.detalle.usuarios_afectados != null && this.detalle.estudiantesAfectados == null) {
        this.detalle.estudiantesAfectados = this.detalle.usuarios_afectados;
      }
      if (this.detalle.codigoCurso && !this.detalle.modulo_afectado) {
        this.detalle.modulo_afectado = `${this.detalle.codigoCurso} (${this.detalle.periodoEscolar || '2026-3'})`;
      }
    }
  }

  next();
});

// Tabla 8 (Página 14 del ERS): Los 4 índices oficiales definidos sobre incidencias_campus
incidenciaSchema.index({ codigo: 1 }, { unique: true, name: 'idx_codigo_unico' });
incidenciaSchema.index({ categoria: 1, estado: 1 }, { name: 'idx_categoria_estado' });
incidenciaSchema.index(
  { 'ubicacion.edificioId': 1, 'ubicacion.aula': 1, fechaReporte: -1 },
  { name: 'idx_ubicacion_historial' }
);
incidenciaSchema.index({ fechaReporte: -1 }, { name: 'idx_fecha_reporte' });

const Incidencia = mongoose.model('Incidencia', incidenciaSchema);

module.exports = Incidencia;
