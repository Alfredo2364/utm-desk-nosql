const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Edificio = require('../models/Edificio');

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
    const nombre = body.nombre !== undefined ? body.nombre : req.query?.nombre;
    const rol = body.rol !== undefined ? body.rol : req.query?.rol;
    const area = body.area !== undefined ? body.area : req.query?.area;
    const cargo = body.cargo !== undefined ? body.cargo : req.query?.cargo;
    const departamento_carrera = body.departamento_carrera !== undefined ? body.departamento_carrera : req.query?.departamento_carrera;
    const activo = body.activo !== undefined ? body.activo : (req.query?.activo !== undefined ? req.query.activo === 'true' : undefined);
    const id_tecnico = body.id_tecnico !== undefined ? body.id_tecnico : req.query?.id_tecnico;
    const email = body.email || body.correo || req.query?.email || req.query?.correo;

    const finalArea = rol && rol !== 'tecnico' ? null : area;
    const cleanEmail = (email || '').trim().toLowerCase();

    let usuario = null;

    // 1. Buscar por _id si no es nulo o indefinido
    if (id && id !== 'undefined' && id !== 'null' && mongoose.isValidObjectId(id)) {
      try {
        usuario = await Usuario.findById(id);
      } catch (err) {
        // ID no convertible a ObjectId
      }
    }

    // 2. Si no se encontró por ID, buscar por email recibido en el cuerpo o query
    if (!usuario && cleanEmail) {
      usuario = await Usuario.findOne({
        $or: [{ email: cleanEmail }, { correo: cleanEmail }],
      });
    }

    // 3. Si el ID de la URL es en sí un correo
    if (!usuario && id && id.includes('@')) {
      const paramEmail = id.trim().toLowerCase();
      usuario = await Usuario.findOne({
        $or: [{ email: paramEmail }, { correo: paramEmail }],
      });
    }

    // 4. Si aún no se localiza, buscar por nombre exacto o aproximado
    if (!usuario && nombre) {
      usuario = await Usuario.findOne({
        nombre: { $regex: new RegExp(`^${escapeRegex(nombre.trim())}$`, 'i') },
      });
    }

    // 5. Fallback especial si el usuario aún no estaba persistido en DB pero existe en demoUsuarios
    if (!usuario) {
      const { demoUsuarios } = require('../seed/seedData');
      const demo = demoUsuarios.find((du) => {
        const dMail = (du.email || du.correo || '').toLowerCase();
        return (
          (cleanEmail && dMail === cleanEmail) ||
          (id && id.includes('@') && dMail === id.toLowerCase()) ||
          (nombre && du.nombre.toLowerCase().includes(nombre.trim().toLowerCase()))
        );
      });
      if (demo) {
        usuario = new Usuario({
          ...demo,
          _id: mongoose.isValidObjectId(id) ? id : demo._id,
        });
      }
    }

    if (!usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    // Actualizar campos
    if (nombre !== undefined) usuario.nombre = nombre;
    if (rol !== undefined) usuario.rol = rol;
    usuario.area = finalArea;
    if (cargo !== undefined) usuario.cargo = cargo;
    if (departamento_carrera !== undefined) usuario.departamento_carrera = departamento_carrera;
    if (activo !== undefined) usuario.activo = activo;
    if (id_tecnico !== undefined) usuario.id_tecnico = id_tecnico;
    if (cleanEmail) {
      usuario.email = cleanEmail;
      usuario.correo = cleanEmail;
    }

    const guardado = await usuario.save();
    const obj = guardado.toObject ? guardado.toObject() : { ...guardado };
    delete obj.password;

    return res.status(200).json({
      ok: true,
      mensaje: 'Usuario actualizado exitosamente',
      usuario: obj,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    let eliminado = null;

    if (id && id !== 'undefined' && id !== 'null') {
      try {
        eliminado = await Usuario.findByIdAndDelete(id);
      } catch (e) {}
    }

    if (!eliminado && id && id.includes('@')) {
      const cleanEmail = id.trim().toLowerCase();
      eliminado = await Usuario.findOneAndDelete({
        $or: [{ email: cleanEmail }, { correo: cleanEmail }],
      });
    }

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
    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
    const { clave, codigo, nombre, descripcion, pisos, responsable, aulas, activo } = body;

    const updateFields = {
      nombre,
      descripcion,
      pisos,
      responsable,
      aulas,
      activo,
    };
    const finalClave = (clave || codigo || '').toUpperCase().trim();
    if (finalClave) {
      updateFields.clave = finalClave;
      updateFields.codigo = finalClave;
    }

    let actualizado = null;
    if (id && id !== 'undefined' && id !== 'null') {
      try {
        actualizado = await Edificio.findByIdAndUpdate(id, updateFields, {
          new: true,
          runValidators: false,
        });
      } catch (e) {}
    }

    if (!actualizado && (finalClave || id)) {
      const matchClave = finalClave || id.toUpperCase().trim();
      actualizado = await Edificio.findOneAndUpdate(
        { $or: [{ clave: matchClave }, { codigo: matchClave }] },
        updateFields,
        { new: true, runValidators: false }
      );
    }

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
    let eliminado = null;

    if (id && id !== 'undefined' && id !== 'null') {
      try {
        eliminado = await Edificio.findByIdAndDelete(id);
      } catch (e) {}
    }

    if (!eliminado && id) {
      const matchClave = id.toUpperCase().trim();
      eliminado = await Edificio.findOneAndDelete({
        $or: [{ clave: matchClave }, { codigo: matchClave }],
      });
    }

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
