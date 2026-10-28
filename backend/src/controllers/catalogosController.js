const Usuario = require('../models/Usuario');
const Edificio = require('../models/Edificio');

// ==================== USUARIOS (CRUD ADMIN / SUPERADMIN) ====================

const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find().sort({ createdAt: -1 }).select('-password');
    return res.status(200).json({ ok: true, total: usuarios.length, usuarios });
  } catch (error) {
    next(error);
  }
};

const createUsuario = async (req, res, next) => {
  try {
    const {
      nombre,
      email,
      correo,
      password,
      rol,
      area,
      cargo,
      departamento_carrera,
      id_tecnico,
    } = req.body;

    const finalEmail = (email || correo || '').trim().toLowerCase();
    if (!finalEmail) {
      return res.status(400).json({
        ok: false,
        error: 'El correo institucional (correo / email) es obligatorio.',
      });
    }

    const existe = await Usuario.findOne({
      $or: [{ email: finalEmail }, { correo: finalEmail }],
    });
    if (existe) {
      return res.status(409).json({
        ok: false,
        error: `El correo '${finalEmail}' ya se encuentra registrado en el sistema.`,
      });
    }

    // Según Tabla 9: Solo los técnicos necesitan el campo area
    const finalArea = rol === 'tecnico' ? area || 'computo_telecomunicaciones' : null;

    const nuevoUsuario = new Usuario({
      nombre,
      correo: finalEmail,
      email: finalEmail,
      password: password || 'utm123456',
      rol: rol || 'reportante',
      area: finalArea,
      cargo: cargo || 'Personal Universitario',
      departamento_carrera: departamento_carrera || 'Campus General',
      id_tecnico: id_tecnico || null,
      activo: true,
      creadoEn: new Date(),
    });

    const guardado = await nuevoUsuario.save();
    const obj = guardado.toObject();
    delete obj.password;

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente',
      usuario: obj,
    });
  } catch (error) {
    next(error);
  }
};

const updateUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, rol, area, cargo, departamento_carrera, activo, id_tecnico } = req.body;

    const finalArea = rol && rol !== 'tecnico' ? null : area;

    const actualizado = await Usuario.findByIdAndUpdate(
      id,
      {
        nombre,
        rol,
        area: finalArea,
        cargo,
        departamento_carrera,
        activo,
        id_tecnico,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!actualizado) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Usuario actualizado exitosamente',
      usuario: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await Usuario.findByIdAndDelete(id);

    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      mensaje: `Usuario '${eliminado.nombre}' eliminado correctamente del catálogo.`,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== EDIFICIOS Y AULAS (CRUD ADMIN / SUPERADMIN) ====================

const getEdificios = async (req, res, next) => {
  try {
    const edificios = await Edificio.find().sort({ codigo: 1 });
    return res.status(200).json({ ok: true, total: edificios.length, edificios });
  } catch (error) {
    next(error);
  }
};

const createEdificio = async (req, res, next) => {
  try {
    const { clave, codigo, nombre, descripcion, pisos, responsable, aulas } = req.body;
    const finalClave = (clave || codigo || '').trim().toUpperCase();

    if (!finalClave) {
      return res.status(400).json({
        ok: false,
        error: 'La clave corta del edificio (ej. ED-A) es obligatoria.',
      });
    }

    const existe = await Edificio.findOne({
      $or: [{ codigo: finalClave }, { clave: finalClave }],
    });
    if (existe) {
      return res.status(409).json({
        ok: false,
        error: `Ya existe un edificio con la clave '${finalClave}'.`,
      });
    }

    const nuevoEdificio = new Edificio({
      clave: finalClave,
      codigo: finalClave,
      nombre,
      descripcion: descripcion || '',
      pisos: pisos || 1,
      responsable: responsable || 'Coordinación Campus',
      aulas: aulas || [],
      activo: true,
    });

    const guardado = await nuevoEdificio.save();
    return res.status(201).json({
      ok: true,
      mensaje: 'Edificio registrado exitosamente en el catálogo',
      edificio: guardado,
    });
  } catch (error) {
    next(error);
  }
};

const updateEdificio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clave, codigo, nombre, descripcion, pisos, responsable, aulas, activo } = req.body;

    const updateFields = {
      nombre,
      descripcion,
      pisos,
      responsable,
      aulas,
      activo,
    };
    if (clave || codigo) {
      updateFields.clave = (clave || codigo).toUpperCase();
      updateFields.codigo = (clave || codigo).toUpperCase();
    }

    const actualizado = await Edificio.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!actualizado) {
      return res.status(404).json({ ok: false, error: 'Edificio no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Edificio actualizado exitosamente',
      edificio: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEdificio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await Edificio.findByIdAndDelete(id);

    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Edificio no encontrado' });
    }

    return res.status(200).json({
      ok: true,
      mensaje: `Edificio '${eliminado.nombre}' eliminado del catálogo.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEdificios,
  createEdificio,
  updateEdificio,
  deleteEdificio,
};
