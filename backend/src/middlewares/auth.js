const Usuario = require('../models/Usuario');

/**
 * Normaliza el nombre del área técnica (convierte 'computo' -> 'computo_telecomunicaciones', etc.)
 */
const normalizarAreaTecnica = (area) => {
  if (!area) return null;
  const a = area.toLowerCase().trim();
  if (a === 'computo' || a === 'computo_telecomunicaciones') return 'computo_telecomunicaciones';
  if (a === 'infraestructura' || a === 'infraestructura_mantenimiento') return 'infraestructura_mantenimiento';
  if (a === 'sistemas' || a === 'sistemas_servicios_academicos') return 'sistemas_servicios_academicos';
  return a;
};

/**
 * Middleware para identificar y autenticar al usuario actual.
 * Admite autenticación vía:
 * 1. Cabecera 'x-user-email' / 'x-user-role'
 * 2. Cabecera Authorization: Bearer <email_o_token>
 */
const autenticar = async (req, res, next) => {
  try {
    let email = req.headers['x-user-email'] || req.headers['x-user-correo'];
    const headerRol = req.headers['x-user-role'];
    const authHeader = req.headers['authorization'];

    if (!email && authHeader && authHeader.startsWith('Bearer ')) {
      email = authHeader.split(' ')[1];
    }

    // Si viene un correo de usuario, buscar en MongoDB Atlas
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      let usuario = await Usuario.findOne({
        $or: [{ email: cleanEmail }, { correo: cleanEmail }],
      });

      if (usuario) {
        req.user = usuario;
        return next();
      }

      // Si no está registrado en DB pero se especificó cabecera de rol, estructurar usuario temporal
      req.user = {
        _id: req.headers['x-user-id'] || 'demo-user-id',
        email: cleanEmail,
        correo: cleanEmail,
        nombre: req.headers['x-user-name'] || cleanEmail.split('@')[0],
        rol: headerRol || 'reportante',
        area: req.headers['x-user-area'] || null,
        departamento_carrera: 'Campus General',
      };
      return next();
    }

    // Si se envió solo el rol vía cabecera
    if (headerRol) {
      req.user = {
        _id: 'temp-id',
        email: `usuario.${headerRol}@utm.mx`,
        correo: `usuario.${headerRol}@utm.mx`,
        nombre: `Usuario ${headerRol.toUpperCase()}`,
        rol: headerRol,
        area: req.headers['x-user-area'] || (headerRol === 'tecnico' ? 'computo_telecomunicaciones' : null),
      };
      return next();
    }

    // Usuario por defecto si no se envían cabeceras (Admin/SuperAdmin para pruebas directas de Postman sin cabeceras o Reportante)
    req.user = {
      _id: 'postman-superadmin-id',
      email: 'superadmin@utm.mx',
      correo: 'superadmin@utm.mx',
      nombre: 'Super Administrador General UTM',
      rol: 'superadmin',
      area: 'general',
    };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC) conforme a Tabla 4 del ERS
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

    // Los roles 'admin' y 'superadmin' tienen acceso total o si el rol coincide con los permitidos
    if (
      rolesPermitidos.includes(rolUsuario) ||
      rolUsuario === 'admin' ||
      rolUsuario === 'superadmin'
    ) {
      return next();
    }

    return res.status(403).json({
      ok: false,
      error: `Acceso denegado: El rol actual ('${rolUsuario}') no tiene permisos para esta acción según la Matriz de Roles (Tabla 4). Roles autorizados: ${rolesPermitidos.join(', ')}.`,
      codigo: 'FORBIDDEN_ROLE',
      rolActual: rolUsuario,
      rolesRequeridos: rolesPermitidos,
    });
  };
};

module.exports = {
  autenticar,
  verificarRol,
  normalizarAreaTecnica,
};
