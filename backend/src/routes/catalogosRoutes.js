const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth');
const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEdificios,
  createEdificio,
  updateEdificio,
  deleteEdificio,
} = require('../controllers/catalogosController');

// ==================== RUTAS DE USUARIOS (SOLO ADMIN) ====================
router.get('/usuarios', verificarRol('admin'), getUsuarios);
router.post('/usuarios', verificarRol('admin'), createUsuario);
router.put('/usuarios/:id', verificarRol('admin'), updateUsuario);
router.delete('/usuarios/:id', verificarRol('admin'), deleteUsuario);

// ==================== RUTAS DE EDIFICIOS ====================
// Lectura de catálogo: Permitida a usuarios autenticados para poblar selectores en creación de incidencias
router.get('/edificios', getEdificios);

// Modificaciones de edificios y aulas: Exclusivas para Admin
router.post('/edificios', verificarRol('admin'), createEdificio);
router.put('/edificios/:id', verificarRol('admin'), updateEdificio);
router.delete('/edificios/:id', verificarRol('admin'), deleteEdificio);

module.exports = router;
