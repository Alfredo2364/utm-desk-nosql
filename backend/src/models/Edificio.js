const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['aula', 'laboratorio', 'otro', 'auditorio', 'oficina_administrativa', 'taller'],
    default: 'aula',
  },
  piso: {
    type: String,
    default: 'Planta Baja',
  },
  capacidad: {
    type: Number,
    default: 30,
  },
});

const edificioSchema = new mongoose.Schema(
  {
    clave: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    codigo: {
      type: String,
      required: [true, 'La clave/código del edificio es obligatoria'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del edificio es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
    },
    pisos: {
      type: Number,
      default: 2,
    },
    responsable: {
      type: String,
      default: 'Coordinación de Infraestructura',
    },
    aulas: [aulaSchema],
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'edificios',
  }
);

// Sincronizar 'clave' (Tabla 10 / Figura 6 del documento) y 'codigo'
edificioSchema.pre('validate', function (next) {
  if (this.clave && !this.codigo) {
    this.codigo = this.clave.toUpperCase();
  }
  if (this.codigo && !this.clave) {
    this.clave = this.codigo.toUpperCase();
  }
  next();
});

const Edificio = mongoose.model('Edificio', edificioSchema);

module.exports = Edificio;
