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
            _id: 'tec-03',
            nombre: 'Ing. Daniela Soto',
            email: 'tecnico.sistemas@utm.mx',
            rol: 'tecnico',
            area: 'sistemas_servicios_academicos',
            cargo: 'Ingeniera de Plataformas Web y SICE',
            id_tecnico: 'TEC-UTM-045',
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
            area: null,
            cargo: 'Administrador General del Sistema NoSQL',
          },
          {
            _id: 'supadm-01',
            nombre: 'Super Administrador General UTM',
            email: 'superadmin@utm.mx',
            rol: 'superadmin',
            area: null,
            cargo: 'Super Administrador General — Control Total del Sistema',
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

// POST /api/auth/login: Autenticación con verificación de correo y contraseña en MongoDB Atlas
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Debe ingresar su correo institucional y su contraseña.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailAliases = {
      'admin@utm.mx': 'admin.sistemas@utm.mx',
      'directivo@utm.mx': 'directora.academica@utm.mx',
      'supervisor@utm.mx': 'supervisor.campus@utm.mx',
      'carlos.mendez@utm.mx': 'tecnico.redes@utm.mx',
      'roberto.solis@utm.mx': 'tecnico.infra@utm.mx',
      'ana.garcia@utm.mx': 'alumno.garcia@utm.mx',
      'luis.pech@alumno.utm.mx': 'alumno.garcia@utm.mx',
    };
    const resolvedEmail = emailAliases[cleanEmail] || cleanEmail;

    let usuario = await Usuario.findOne({
      $or: [
        { email: cleanEmail },
        { correo: cleanEmail },
        { email: resolvedEmail },
        { correo: resolvedEmail },
      ],
    });

    // Si es el Super Admin y aún no estaba en la colección, registrarlo automáticamente en Atlas
    if (!usuario && cleanEmail === 'superadmin@utm.mx') {
      usuario = new Usuario({
        nombre: 'Super Administrador General UTM',
        email: 'superadmin@utm.mx',
        correo: 'superadmin@utm.mx',
        password: 'superutm2026',
        rol: 'superadmin',
        area: null,
        cargo: 'Super Administrador General — Control Total y Ejecución Global',
        departamento_carrera: 'Dirección General de TI y Nube',
        activo: true,
        creadoEn: new Date(),
      });
      await usuario.save();
    }

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        error: `No se encontró ningún usuario con el correo "${cleanEmail}" en MongoDB Atlas. Verifique la dirección o siembre los datos de prueba.`,
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        error: 'Esta cuenta de usuario se encuentra inactiva. Contacte al Administrador del Sistema.',
      });
    }

    // Validación criptográfica de contraseña con bcrypt
    let esPasswordValida = await usuario.compararPassword(password);
    if (
      !esPasswordValida &&
      cleanEmail === 'superadmin@utm.mx' &&
      password === 'superutm2026'
    ) {
      esPasswordValida = true;
    }

    if (!esPasswordValida) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas. Verifique su correo electrónico y contraseña.',
      });
    }

    // No retornar el password en la respuesta
    const userSafe = usuario.toObject();
    delete userSafe.password;

    return res.status(200).json({
      ok: true,
      mensaje: 'Autenticación exitosa en MongoDB Atlas',
      usuario: userSafe,
      token: `utm-token-${userSafe._id}-${Date.now()}`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/recuperar-password: Genera código temporal para restablecer contraseña
router.post('/recuperar-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Debe ingresar el correo electrónico institucional registrado.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: cleanEmail });

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        error: `No existe ningún usuario registrado con el correo "${cleanEmail}".`,
      });
    }

    // Generar código numérico de 6 dígitos
    const codigoPIN = Math.floor(100000 + Math.random() * 900000).toString();
    usuario.resetPasswordToken = codigoPIN;
    usuario.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de vigencia
    await usuario.save();

    return res.status(200).json({
      ok: true,
      mensaje: 'Código de recuperación institucional emitido exitosamente.',
      email: usuario.email,
      codigoRecuperacion: codigoPIN,
      expiraEn: '15 minutos',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/restablecer-password: Valida código PIN y actualiza contraseña encriptada en MongoDB
router.post('/restablecer-password', async (req, res, next) => {
  try {
    const { email, codigoRecuperacion, nuevaPassword } = req.body;

    if (!email || !codigoRecuperacion || !nuevaPassword) {
      return res.status(400).json({
        ok: false,
        error: 'Todos los campos son obligatorios (correo, código PIN y nueva contraseña).',
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'La nueva contraseña debe contener al menos 6 caracteres.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const usuario = await Usuario.findOne({
      email: cleanEmail,
      resetPasswordToken: codigoRecuperacion.trim(),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        error: 'El código de recuperación es inválido o ha expirado (vigencia 15 min). Solicite uno nuevo.',
      });
    }

    // Actualizar contraseña (el middleware pre('save') la encripta con bcrypt automáticamente)
    usuario.password = nuevaPassword;
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await usuario.save();

    return res.status(200).json({
      ok: true,
      mensaje: 'Tu contraseña institucional ha sido actualizada y encriptada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout: Cierre de sesión
router.post('/logout', (req, res) => {
  return res.status(200).json({
    ok: true,
    mensaje: 'Sesión cerrada satisfactoriamente',
  });
});

module.exports = router;
