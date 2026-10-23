const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// GET /api/auth/usuarios-demo: Lista los usuarios demo para el selector de roles del frontend
router.get('/usuarios-demo', async (req, res, next) => {
  try {
    const usuarios = await Usuario.find({ activo: true })
      .select('-password')
      .sort({ rol: 1 });

    if (usuarios.length === 0) {
      // Fallback predeterminado si no se ha ejecutado el seed
      return res.status(200).json({
        ok: true,
        usuarios: [
          {
            _id: 'rep-01',
            nombre: 'Alumno Daniel García',
            email: 'alumno.garcia@utm.mx',
            rol: 'reportante',
            area: 'general',
            cargo: 'Estudiante de Ing. en Computación',
            departamento_carrera: 'Ingeniería en Computación',
          },
          {
            _id: 'tec-01',
            nombre: 'Ing. Roberto Méndez',
            email: 'tecnico.redes@utm.mx',
            rol: 'tecnico',
            area: 'computo_telecomunicaciones',
            cargo: 'Especialista en Telecomunicaciones y Redes',
            id_tecnico: 'TEC-UTM-092',
          },
          {
            _id: 'tec-02',
            nombre: 'Téc. Marco Peña',
            email: 'tecnico.infra@utm.mx',
            rol: 'tecnico',
            area: 'infraestructura_mantenimiento',
            cargo: 'Técnico de Mantenimiento Eléctrico/Hidráulico',
            id_tecnico: 'TEC-UTM-018',
          },
          {
            _id: 'sup-01',
            nombre: 'Ing. Carlos Mendoza',
            email: 'supervisor.campus@utm.mx',
            rol: 'supervisor',
            area: 'general',
            cargo: 'Supervisor General de Operaciones de Campus',
          },
          {
            _id: 'dir-01',
            nombre: 'Dra. Patricia Arango',
            email: 'directora.academica@utm.mx',
            rol: 'directivo',
            area: 'general',
            cargo: 'Directora de División y Planeación Universitaria',
          },
          {
            _id: 'adm-01',
            nombre: 'Administrador Maestro UTM',
            email: 'admin.sistemas@utm.mx',
            rol: 'admin',
            area: 'general',
            cargo: 'Administrador General del Sistema NoSQL',
          },
        ],
      });
    }

    return res.status(200).json({ ok: true, usuarios });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/perfil: Obtener perfil del usuario actual autenticado
router.get('/perfil', (req, res) => {
  return res.status(200).json({
    ok: true,
    usuario: req.user,
  });
});

// POST /api/auth/login: Login básico
router.post('/login', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Debe ingresar un correo electrónico' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('-password');
    if (!usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Autenticación exitosa',
      usuario,
      token: usuario.email, // Token simplificado para desarrollo
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
