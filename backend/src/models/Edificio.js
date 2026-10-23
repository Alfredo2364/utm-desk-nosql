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
    enum: ['aula', 'laboratorio', 'auditorio', 'oficina_administrativa', 'taller'],
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
    codigo: {
      type: String,
      required: [true, 'El código de edificio es obligatorio'],
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

const Edificio = mongoose.model('Edificio', edificioSchema);

module.exports = Edificio;
