const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { verificarRol } = require('../middlewares/auth');
const {
  getIncidencias,
  getIncidenciaByCodigo,
  createIncidencia,
  subirEvidencia,
  actualizarEstado,
  addRevision,
  asignarTecnico,
} = require('../controllers/incidenciasController');
const { seedDatabase } = require('../seed/seedData');

// GET /api/incidencias: Listar incidencias con filtros RBAC aplicados
router.get('/', getIncidencias);

// POST /api/incidencias/seed: Poblar datos de prueba (incluyendo usuarios, edificios e incidencias con RBAC)
router.post('/seed', async (req, res, next) => {
  try {
    const ok = await seedDatabase();
    if (ok) {
      return res.status(200).json({ ok: true, mensaje: 'Base de datos MongoDB Atlas poblada con éxito con usuarios RBAC y catálogo de edificios.' });
    }
    return res.status(500).json({ ok: false, error: 'No se pudo poblar la base de datos' });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidencias/:codigo: Obtener expediente completo sin JOINs
router.get('/:codigo', getIncidenciaByCodigo);

// POST /api/incidencias: Registrar nueva incidencia polimórfica (Reportantes, Supervisores, Admin)
router.post('/', createIncidencia);

// POST /api/incidencias/:codigo/evidencias/archivo: Subir archivo multipart/form-data con validación RBAC
router.post('/:codigo/evidencias/archivo', upload.single('archivo'), subirEvidencia);

// PATCH /api/incidencias/:codigo/estado: Actualizar estado operativo (Técnicos asignados, Supervisores, Admin)
router.patch('/:codigo/estado', verificarRol('tecnico', 'supervisor', 'admin'), actualizarEstado);

// POST /api/incidencias/:codigo/revisiones: Agregar nota de diagnóstico técnico (Técnicos asignados, Supervisores, Admin)
router.post('/:codigo/revisiones', verificarRol('tecnico', 'supervisor', 'admin'), addRevision);

// PATCH /api/incidencias/:codigo/asignar: Asignar o reasignar técnico (Exclusivo Supervisor y Admin)
router.patch('/:codigo/asignar', verificarRol('supervisor', 'admin'), asignarTecnico);

module.exports = router;
