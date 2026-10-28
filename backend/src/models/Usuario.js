const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    correo: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
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
      default: 'utm123456',
    },
    rol: {
      type: String,
      required: true,
      enum: {
        values: ['reportante', 'tecnico', 'supervisor', 'directivo', 'admin', 'superadmin'],
        message: 'Rol no válido en la matriz RBAC',
      },
      default: 'reportante',
      index: true,
    },
    // Área operativa (solo obligatoria/relevante para Técnicos según Tabla 9)
    area: {
      type: String,
      enum: [
        'computo',
        'infraestructura',
        'sistemas',
        'computo_telecomunicaciones',
        'infraestructura_mantenimiento',
        'sistemas_servicios_academicos',
        'general',
        null,
        '',
      ],
      default: null,
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
    creadoEn: {
      type: Date,
      default: Date.now,
    },
    // Tokens de recuperación de contraseña
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'usuarios',
  }
);

// Sincronizar 'correo' (Tabla 9 del documento) y 'email'
usuarioSchema.pre('validate', function (next) {
  if (this.correo && !this.email) {
    this.email = this.correo;
  }
  if (this.email && !this.correo) {
    this.correo = this.email;
  }
  if (!this.creadoEn) {
    this.creadoEn = new Date();
  }
  next();
});

// Middleware Mongoose: Encriptación segura de contraseña con bcrypt (Salt 10)
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    if (this.password && this.password.startsWith('$2')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método de instancia: Comparación criptográfica segura de contraseña
usuarioSchema.methods.compararPassword = async function (passwordCandidata) {
  if (!this.password) return false;
  if (this.password.startsWith('$2')) {
    return await bcrypt.compare(passwordCandidata, this.password);
  }
  return this.password === passwordCandidata;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
