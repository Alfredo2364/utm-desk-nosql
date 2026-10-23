const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      default: 'utm123456', // Contraseña por defecto para pruebas/demo
    },
    rol: {
      type: String,
      required: true,
      enum: {
        values: ['reportante', 'tecnico', 'supervisor', 'directivo', 'admin'],
        message: 'Rol no válido en la matriz RBAC',
      },
      default: 'reportante',
      index: true,
    },
    // Área operativa (especialmente relevante para Técnicos)
    area: {
      type: String,
      enum: [
        'computo_telecomunicaciones',
        'infraestructura_mantenimiento',
        'sistemas_servicios_academicos',
        'general',
      ],
      default: 'general',
      index: true,
    },
    cargo: {
      type: String,
      default: 'Personal Universitario',
    },
    departamento_carrera: {
      type: String,
      default: 'Campus General',
    },
    id_tecnico: {
      type: String,
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'usuarios',
  }
);

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
