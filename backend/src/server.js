require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const incidenciasRoutes = require('./routes/incidenciasRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Ruta de comprobación de salud y configuración
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    sistema: 'UTM Desk NoSQL Cloud API',
    version: '1.0.0',
    estado: 'Servicio Activo',
    servicios: {
      mongodbAtlas: process.env.MONGO_URI ? 'Configurado' : 'Pendiente .env',
      supabaseStorage: process.env.SUPABASE_URL ? 'Configurado' : 'Pendiente .env',
    },
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API de Incidencias
app.use('/api/incidencias', incidenciasRoutes);

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
    console.log(`📋 [Rutas] Endpoints disponibles en http://localhost:${PORT}/api/incidencias`);
    console.log(`❤️  [Health] Verificación en http://localhost:${PORT}/api/health`);
  });
};

startServer();

module.exports = app;
