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

// POST /api/incidencias/seed: Poblar datos de prueba (incluyendo usuarios, edificios e incidencias con RBAC)
router.post('/seed', async (req, res, next) => {
  try {
    const ok = await seedDatabase();
    if (ok) {
      return res.status(200).json({
        ok: true,
        mensaje: 'Base de datos MongoDB Atlas poblada con éxito con los 6 perfiles (incluyendo Super Admin), edificios y expedientes.',
      });
    }
    return res.status(500).json({ ok: false, error: 'No se pudo poblar la base de datos' });
  } catch (err) {
    next(err);
  }
});

// RF-02 | GET /api/incidencias: Listar incidencias según Tabla 4 (Reportante: Propias, Técnico: Su área, Supervisor/Admin/SuperAdmin: Todas, Directivo: No)
router.get(
  '/',
  verificarRol('reportante', 'tecnico', 'supervisor', 'admin', 'superadmin'),
  getIncidencias
);

// RF-03 | GET /api/incidencias/:codigo: Consultar expediente según Tabla 4 (Reportante: Propias, Técnico: Su área, Supervisor/Admin/SuperAdmin: Todas, Directivo: No)
router.get(
  '/:codigo',
  verificarRol('reportante', 'tecnico', 'supervisor', 'admin', 'superadmin'),
  getIncidenciaByCodigo
);

// RF-01 | POST /api/incidencias: Registrar incidencia según Tabla 4 (Reportante: Sí, Supervisor: Sí, Admin/SuperAdmin: Sí | Técnico: No, Directivo: No)
router.post(
  '/',
  verificarRol('reportante', 'supervisor', 'admin', 'superadmin'),
  createIncidencia
);

// RF-06 | POST /api/incidencias/:codigo/evidencias/archivo: Cargar evidencia según Tabla 4 (Reportante: Propias, Técnico: Asignadas, Admin/SuperAdmin: Sí | Supervisor: No, Directivo: No)
router.post(
  '/:codigo/evidencias/archivo',
  verificarRol('reportante', 'tecnico', 'admin', 'superadmin'),
  upload.single('archivo'),
  subirEvidencia
);

// RF-04 | PATCH /api/incidencias/:codigo/estado: Cambiar estado según Tabla 4 (Técnico: Asignadas, Admin/SuperAdmin: Sí | Reportante: No, Supervisor: No, Directivo: No)
router.patch(
  '/:codigo/estado',
  verificarRol('tecnico', 'admin', 'superadmin'),
  actualizarEstado
);

// RF-05 | POST /api/incidencias/:codigo/revisiones: Agregar revisión según Tabla 4 (Técnico: Asignadas, Admin/SuperAdmin: Sí | Reportante: No, Supervisor: No, Directivo: No)
router.post(
  '/:codigo/revisiones',
  verificarRol('tecnico', 'admin', 'superadmin'),
  addRevision
);

// Gestión de Supervisión | PATCH /api/incidencias/:codigo/asignar: Turnar/Asignar técnico (Supervisor, Admin, SuperAdmin)
router.patch(
  '/:codigo/asignar',
  verificarRol('supervisor', 'admin', 'superadmin'),
  asignarTecnico
);

module.exports = router;
