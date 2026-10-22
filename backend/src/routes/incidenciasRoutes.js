const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const {
  getIncidencias,
  getIncidenciaByCodigo,
  createIncidencia,
  subirEvidencia,
  addRevision,
} = require('../controllers/incidenciasController');
const { seedDatabase } = require('../seed/seedData');

// GET /api/incidencias: Listar incidencias con filtros de búsqueda por categoria, estado y prioridad
router.get('/', getIncidencias);

// POST /api/incidencias/seed: Poblar datos de prueba (útil para pruebas de desarrollo)
router.post('/seed', async (req, res, next) => {
  try {
    const ok = await seedDatabase();
    if (ok) {
      return res.status(200).json({ ok: true, mensaje: 'Base de datos poblada con éxito' });
    }
    return res.status(500).json({ ok: false, error: 'No se pudo poblar la base de datos' });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidencias/:codigo: Obtener expediente completo sin JOINs
router.get('/:codigo', getIncidenciaByCodigo);

// POST /api/incidencias: Registrar nueva incidencia polimórfica
router.post('/', createIncidencia);

// POST /api/incidencias/:codigo/evidencias/archivo: Subir archivo multipart/form-data a Supabase Storage y registrar en MongoDB
router.post('/:codigo/evidencias/archivo', upload.single('archivo'), subirEvidencia);

// POST /api/incidencias/:codigo/revisiones: Agregar nota de revisión técnica y actualizar estado
router.post('/:codigo/revisiones', addRevision);

module.exports = router;
