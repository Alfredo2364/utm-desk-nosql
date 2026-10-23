const Usuario = require('../models/Usuario');
const Edificio = require('../models/Edificio');

// ==================== USUARIOS (CRUD ADMIN) ====================

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
    const { nombre, email, rol, area, cargo, departamento_carrera, id_tecnico } = req.body;

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(409).json({
        ok: false,
        error: `El correo '${email}' ya se encuentra registrado en el sistema.`,
      });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      email: email.toLowerCase(),
      rol,
      area: area || 'general',
      cargo: cargo || 'Personal Universitario',
      departamento_carrera: departamento_carrera || 'Campus General',
      id_tecnico: id_tecnico || null,
      activo: true,
    });

    const guardado = await nuevoUsuario.save();
    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente',
      usuario: guardado,
    });
  } catch (error) {
    next(error);
  }
};

const updateUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, rol, area, cargo, departamento_carrera, activo, id_tecnico } = req.body;

    const actualizado = await Usuario.findByIdAndUpdate(
      id,
      {
        nombre,
        rol,
        area,
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

// ==================== EDIFICIOS Y AULAS (CRUD ADMIN) ====================

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
    const { codigo, nombre, descripcion, pisos, responsable, aulas } = req.body;

    const existe = await Edificio.findOne({ codigo: codigo.toUpperCase() });
    if (existe) {
      return res.status(409).json({
        ok: false,
        error: `Ya existe un edificio con el código '${codigo.toUpperCase()}'.`,
      });
    }

    const nuevoEdificio = new Edificio({
      codigo: codigo.toUpperCase(),
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
    const { nombre, descripcion, pisos, responsable, aulas, activo } = req.body;

    const actualizado = await Edificio.findByIdAndUpdate(
      id,
      {
        nombre,
        descripcion,
        pisos,
        responsable,
        aulas,
        activo,
      },
      { new: true, runValidators: true }
    );

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
      mensaje: `Edificio '${eliminado.nombre}' eliminado correctamente del catálogo.`,
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
