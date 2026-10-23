const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth');
const {
  getMetricasGenerales,
  getMTTR,
  getAulasCronicas,
} = require('../controllers/analiticaController');

// Todas las rutas de analítica requieren rol Directivo, Admin o Supervisor
router.use(verificarRol('directivo', 'admin', 'supervisor'));

// GET /api/analitica/metricas
router.get('/metricas', getMetricasGenerales);

// GET /api/analitica/mttr
router.get('/mttr', getMTTR);

// GET /api/analitica/aulas-cronicas
router.get('/aulas-cronicas', getAulasCronicas);

module.exports = router;
