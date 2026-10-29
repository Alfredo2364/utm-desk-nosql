const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { autenticar } = require('./middlewares/auth');
const incidenciasRoutes = require('./routes/incidenciasRoutes');
const analiticaRoutes = require('./routes/analiticaRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (!process.env.VERCEL) {
  app.use(morgan('dev'));
}

// Middleware Serverless: garantiza que la conexión a MongoDB Atlas (o el respaldo NoSQL)
// esté inicializada antes de procesar cualquier petición en Vercel Functions
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️ [DB Middleware] Aviso:', err.message);
  }
  next();
});

// Middleware de autenticación global para identificar usuario y rol
app.use(autenticar);

// Ruta de comprobación de salud y configuración
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    ok: true,
    sistema: 'UTM Desk NoSQL Cloud API',
    version: '1.5.0 (Vercel Services + Express + Vite)',
    respaldoNoSQL: true,
    entorno: process.env.VERCEL ? 'Vercel Services' : 'Servidor Local',
    estadoConexionMongo: mongoose.connection.readyState === 1 ? 'MongoDB Atlas Conectado' : 'Respaldo NoSQL Activo',
    usuarioActual: req.user ? { email: req.user.email, rol: req.user.rol } : null,
    servicios: {
      mongodbAtlas: process.env.MONGO_URI || process.env.MONGODB_URI ? 'Configurado' : 'Modo Respaldo',
      supabaseStorage: process.env.SUPABASE_URL ? 'Configurado' : 'Modo Simulado',
    },
    timestamp: new Date().toISOString(),
  });
});

// Rutas Principales del Sistema (Soporta /api/* y rutas directas de servicios)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/incidencias', '/incidencias'], incidenciasRoutes);
app.use(['/api/analitica', '/analitica'], analiticaRoutes);
app.use(['/api', '/'], catalogosRoutes); // /usuarios y /edificios

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware de manejo de errores centralizado
app.use(errorHandler);

// Iniciar servidor HTTP cuando se ejecute directamente (Local o Vercel Express Service)
if (require.main === module) {
  const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 [UTM Desk Server] Servidor backend escuchando en http://localhost:${PORT}`);
      console.log(`📋 [Rutas] Endpoints de incidencias en http://localhost:${PORT}/api/incidencias`);
      console.log(`📊 [Analítica] Endpoints de analítica en http://localhost:${PORT}/api/analitica`);
      console.log(`👥 [Catálogos] Catálogos de Usuarios y Edificios en http://localhost:${PORT}/api/usuarios`);
      console.log(`❤️  [Health] Verificación en http://localhost:${PORT}/api/health`);
    });
  };

  startServer();
}

module.exports = app;
