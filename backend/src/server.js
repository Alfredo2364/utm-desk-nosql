const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
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
app.use(morgan('dev'));

// Middleware de autenticación global para identificar usuario y rol
app.use(autenticar);

// Ruta de comprobación de salud y configuración
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    sistema: 'UTM Desk NoSQL Cloud API',
    version: '1.3.0 (RBAC + Respaldo NoSQL)',
    respaldoNoSQL: true,
    estado: 'Servicio Activo con RBAC',
    usuarioActual: req.user ? { email: req.user.email, rol: req.user.rol } : null,
    servicios: {
      mongodbAtlas: process.env.MONGO_URI ? 'Configurado' : 'Pendiente .env',
      supabaseStorage: process.env.SUPABASE_URL ? 'Configurado' : 'Pendiente .env',
    },
    timestamp: new Date().toISOString(),
  });
});

// Rutas Principales del Sistema
app.use('/api/auth', authRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/analitica', analiticaRoutes);
app.use('/api', catalogosRoutes); // /api/usuarios y /api/edificios

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    ok: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware de manejo de errores centralizado
app.use(errorHandler);

// Inicializar conexión a base de datos y arrancar servidor
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

module.exports = app;
