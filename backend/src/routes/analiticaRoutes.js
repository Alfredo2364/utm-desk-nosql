const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth');
const {
  getMetricasGenerales,
  getMTTR,
  getAulasCronicas,
} = require('../controllers/analiticaController');

// Según Tabla 4: Consultar analítica y generar reportes -> Supervisor, Directivo, Admin y SuperAdmin
router.use(verificarRol('directivo', 'supervisor', 'admin', 'superadmin'));

// GET /api/analitica/metricas
router.get('/metricas', getMetricasGenerales);

// RF-07 | GET /api/analitica/tiempo-medio (y alias /mttr)
router.get('/tiempo-medio', getMTTR);
router.get('/mttr', getMTTR);

// RF-08 | GET /api/analitica/fallas-cronicas (y alias /aulas-cronicas)
router.get('/fallas-cronicas', getAulasCronicas);
router.get('/aulas-cronicas', getAulasCronicas);

module.exports = router;
