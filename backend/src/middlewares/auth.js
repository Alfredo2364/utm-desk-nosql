const Usuario = require('../models/Usuario');

/**
 * Middleware para identificar y autenticar al usuario actual.
 * Admite autenticación vía:
 * 1. Cabecera 'x-user-email' / 'x-user-role' (óptimo para cambio dinámico de perfiles y demo)
 * 2. Cabecera Authorization: Bearer <email_o_token>
 */
const autenticar = async (req, res, next) => {
  try {
    let email = req.headers['x-user-email'];
    const headerRol = req.headers['x-user-role'];
    const authHeader = req.headers['authorization'];

    if (!email && authHeader && authHeader.startsWith('Bearer ')) {
      email = authHeader.split(' ')[1];
    }

    // Si viene un correo de usuario, buscar en MongoDB Atlas
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      let usuario = await Usuario.findOne({ email: cleanEmail });

      if (usuario) {
        req.user = usuario;
        return next();
      }

      // Si no está registrado en DB pero se especificó cabecera de rol, estructurar usuario temporal
      req.user = {
        _id: req.headers['x-user-id'] || 'demo-user-id',
        email: cleanEmail,
        nombre: req.headers['x-user-name'] || cleanEmail.split('@')[0],
        rol: headerRol || 'reportante',
        area: req.headers['x-user-area'] || 'general',
        departamento_carrera: 'Campus General',
      };
      return next();
    }

    // Si se envió solo el rol vía cabecera
    if (headerRol) {
      req.user = {
        _id: 'temp-id',
        email: `usuario.${headerRol}@utm.mx`,
        nombre: `Usuario ${headerRol.toUpperCase()}`,
        rol: headerRol,
        area: req.headers['x-user-area'] || (headerRol === 'tecnico' ? 'computo_telecomunicaciones' : 'general'),
      };
      return next();
    }

    // Usuario por defecto si no se envían cabeceras (Reportante Invitado)
    req.user = {
      _id: 'guest-id',
      email: 'alumno.garcia@utm.mx',
      nombre: 'Alumno García (Demo)',
      rol: 'reportante',
      area: 'general',
    };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC)
 * @param  {...string} rolesPermitidos - Lista de roles autorizados para el endpoint
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado: Se requiere identificar el rol del usuario.',
        codigo: 'UNAUTHORIZED',
      });
    }

    const rolUsuario = req.user.rol.toLowerCase();

    // El rol 'admin' tiene acceso total o si el rol coincide con los permitidos
    if (rolesPermitidos.includes(rolUsuario) || rolUsuario === 'admin') {
      return next();
    }

    return res.status(403).json({
      ok: false,
      error: `Acceso denegado: El rol actual ('${rolUsuario}') no tiene permisos para esta acción. Roles autorizados: ${rolesPermitidos.join(', ')}.`,
      codigo: 'FORBIDDEN_ROLE',
      rolActual: rolUsuario,
      rolesRequeridos: rolesPermitidos,
    });
  };
};

module.exports = {
  autenticar,
  verificarRol,
};
