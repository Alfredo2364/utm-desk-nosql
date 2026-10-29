const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

let isMemoryMode = false;

const store = {
  usuarios: [],
  edificios: [],
  incidencias: [],
};

function getNestedValue(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  return pathStr.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

function matchesCondition(fieldVal, cond) {
  if (cond instanceof RegExp) {
    return cond.test(String(fieldVal ?? ''));
  }
  if (cond && typeof cond === 'object' && !(cond instanceof Date) && !mongoose.isValidObjectId(cond)) {
    if (cond.$regex !== undefined) {
      const reg = cond.$regex instanceof RegExp
        ? cond.$regex
        : new RegExp(String(cond.$regex), cond.$options || 'i');
      return reg.test(String(fieldVal ?? ''));
    }
    if (Array.isArray(cond.$in)) {
      return cond.$in.some((item) => String(item) === String(fieldVal));
    }
    if (cond.$gt !== undefined) {
      if (!fieldVal) return false;
      return new Date(fieldVal) > new Date(cond.$gt);
    }
    if (cond.$gte !== undefined) {
      if (!fieldVal) return false;
      return new Date(fieldVal) >= new Date(cond.$gte);
    }
    if (cond.$lt !== undefined) {
      if (!fieldVal) return false;
      return new Date(fieldVal) < new Date(cond.$lt);
    }
  }
  if (fieldVal === undefined && cond === null) return true;
  return String(fieldVal) === String(cond);
}

function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      if (!val.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(val)) {
      if (!val.every((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    const fieldVal = key.includes('.') ? getNestedValue(doc, key) : doc[key];
    if (!matchesCondition(fieldVal, val)) {
      return false;
    }
  }
  return true;
}

function createQueryChain(itemsPromise) {
  let sortSpec = null;
  let selectSpec = null;
  let limitVal = null;

  const applyModifiers = (result) => {
    if (!result) return result;
    const isArray = Array.isArray(result);
    let list = isArray ? [...result] : [result];

    if (sortSpec && isArray) {
      const entries = Object.entries(sortSpec);
      list.sort((a, b) => {
        for (const [field, dir] of entries) {
          const va = getNestedValue(a, field) ?? a[field] ?? 0;
          const vb = getNestedValue(b, field) ?? b[field] ?? 0;
          const cmp =
            va instanceof Date || vb instanceof Date
              ? new Date(va).getTime() - new Date(vb).getTime()
              : String(va).localeCompare(String(vb), undefined, { numeric: true });
          if (cmp !== 0) return dir === -1 ? -cmp : cmp;
        }
        return 0;
      });
    }

    if (limitVal != null && isArray) {
      list = list.slice(0, limitVal);
    }

    if (selectSpec && typeof selectSpec === 'string') {
      const tokens = selectSpec.trim().split(/\s+/);
      const excludeFields = tokens.filter((t) => t.startsWith('-')).map((t) => t.slice(1));
      if (excludeFields.length > 0) {
        list = list.map((item) => {
          const clone = typeof item.toObject === 'function' ? wrapDocument(item.toObject(), item.__colName) : { ...item };
          excludeFields.forEach((f) => {
            delete clone[f];
          });
          return clone;
        });
      }
    }

    return isArray ? list : list[0] || null;
  };

  const chain = {
    sort(spec) {
      sortSpec = spec;
      return chain;
    },
    select(spec) {
      selectSpec = spec;
      return chain;
    },
    limit(n) {
      limitVal = n;
      return chain;
    },
    lean() {
      return chain;
    },
    exec() {
      return Promise.resolve(itemsPromise).then(applyModifiers);
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(itemsPromise).then(applyModifiers).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return Promise.resolve(itemsPromise).then(applyModifiers).catch(onRejected);
    },
  };

  return chain;
}

function normalizeIncidenciaFields(raw) {
  const doc = { ...raw };
  if (!doc._id) doc._id = new mongoose.Types.ObjectId().toString();
  if (!doc.codigo && doc.codigo_unico) doc.codigo = doc.codigo_unico;
  if (!doc.codigo_unico && doc.codigo) doc.codigo_unico = doc.codigo;

  if (!doc.createdAt) doc.createdAt = doc.fechaReporte ? new Date(doc.fechaReporte) : new Date();
  if (!doc.fechaReporte) doc.fechaReporte = new Date(doc.createdAt);
  doc.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

  if (doc.ubicacion) {
    doc.ubicacion = { ...doc.ubicacion };
    if (!doc.ubicacion.edificioId && doc.ubicacion.edificio) {
      const m = String(doc.ubicacion.edificio).match(/ED-[A-Z0-9]+/i);
      doc.ubicacion.edificioId = m ? m[0].toUpperCase() : doc.ubicacion.edificio;
    }
    if (!doc.ubicacion.edificio && doc.ubicacion.edificioId) {
      doc.ubicacion.edificio = doc.ubicacion.edificioId;
    }
    if (!doc.ubicacion.aula && doc.ubicacion.aula_laboratorio) {
      doc.ubicacion.aula = doc.ubicacion.aula_laboratorio;
    }
    if (!doc.ubicacion.aula_laboratorio && doc.ubicacion.aula) {
      doc.ubicacion.aula_laboratorio = doc.ubicacion.aula;
    }
  }

  if (Array.isArray(doc.revisiones)) {
    doc.revisiones = doc.revisiones.map((r) => ({
      ...r,
      comentario: r.comentario || r.observaciones || 'Revisión técnica registrada',
      observaciones: r.observaciones || r.comentario || 'Revisión técnica registrada',
      estadoAnterior: r.estadoAnterior || r.estado_anterior || 'abierta',
      estado_anterior: r.estado_anterior || r.estadoAnterior || 'abierta',
      estadoNuevo: r.estadoNuevo || r.estado_nuevo || doc.estado || 'en_proceso',
      estado_nuevo: r.estado_nuevo || r.estadoNuevo || doc.estado || 'en_proceso',
      fecha: r.fecha ? new Date(r.fecha) : new Date(),
    }));
  } else {
    doc.revisiones = [];
  }

  if (!Array.isArray(doc.evidencias_adjuntas)) {
    doc.evidencias_adjuntas = [];
  }

  if ((doc.estado === 'resuelta' || doc.estado === 'cerrada') && doc.tiempoResolucionMin == null) {
    const start = new Date(doc.fechaReporte || doc.createdAt).getTime();
    const end = new Date(doc.fechaResolucion || doc.fecha_resolucion || doc.updatedAt).getTime();
    doc.tiempoResolucionMin = Math.max(1, Math.round((end - start) / 60000));
  }

  return doc;
}

function wrapDocument(rawObj, colName) {
  if (!rawObj) return null;
  let base = { ...rawObj };
  if (!base._id) base._id = new mongoose.Types.ObjectId().toString();
  if (!base.createdAt) base.createdAt = new Date();
  if (!base.updatedAt) base.updatedAt = new Date();

  if (colName === 'usuarios') {
    if (!base.correo && base.email) base.correo = String(base.email).toLowerCase().trim();
    if (!base.email && base.correo) base.email = String(base.correo).toLowerCase().trim();
    if (!base.creadoEn) base.creadoEn = base.createdAt;
  } else if (colName === 'edificios') {
    if (!base.clave && base.codigo) base.clave = String(base.codigo).toUpperCase().trim();
    if (!base.codigo && base.clave) base.codigo = String(base.clave).toUpperCase().trim();
  } else if (colName === 'incidencias') {
    base = normalizeIncidenciaFields(base);
  }

  Object.defineProperty(base, '__colName', {
    value: colName,
    enumerable: false,
    writable: true,
  });

  Object.defineProperty(base, 'toObject', {
    value: function () {
      const plain = {};
      for (const k of Object.keys(this)) {
        plain[k] = this[k];
      }
      return plain;
    },
    enumerable: false,
  });

  if (colName === 'usuarios') {
    Object.defineProperty(base, 'compararPassword', {
      value: async function (candidatePassword) {
        if (!this.password) return false;
        if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
          return bcrypt.compare(candidatePassword, this.password);
        }
        return candidatePassword === this.password;
      },
      enumerable: false,
    });
  }

  Object.defineProperty(base, 'save', {
    value: async function () {
      this.updatedAt = new Date();
      if (colName === 'usuarios') {
        if (!this.correo && this.email) this.correo = String(this.email).toLowerCase().trim();
        if (!this.email && this.correo) this.email = String(this.correo).toLowerCase().trim();
        if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
          this.password = await bcrypt.hash(this.password, 10);
        }
      } else if (colName === 'edificios') {
        if (!this.clave && this.codigo) this.clave = String(this.codigo).toUpperCase().trim();
        if (!this.codigo && this.clave) this.codigo = String(this.clave).toUpperCase().trim();
      } else if (colName === 'incidencias') {
        const normalized = normalizeIncidenciaFields(this.toObject());
        Object.assign(this, normalized);
      }

      const arr = store[colName];
      const idx = arr.findIndex((item) => String(item._id) === String(this._id));
      if (idx >= 0) {
        arr[idx] = this;
      } else {
        arr.push(this);
      }
      return this;
    },
    enumerable: false,
  });

  return base;
}

function runIncidenciaAggregate(pipeline = []) {
  const docs = store.incidencias;
  const firstStage = pipeline[0] || {};
  const secondStage = pipeline[1] || {};
  const thirdStage = pipeline[2] || {};

  // Caso 1: getMetricasGenerales -> group por '$categoria'
  if (firstStage.$group && firstStage.$group._id === '$categoria') {
    const map = {};
    docs.forEach((d) => {
      const cat = d.categoria || 'general';
      if (!map[cat]) map[cat] = { _id: cat, total: 0, resueltas: 0 };
      map[cat].total += 1;
      if (d.estado === 'resuelta' || d.estado === 'cerrada') {
        map[cat].resueltas += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }

  // Caso 2: RF-07 getMTTR -> $match resueltas -> $addFields -> $group por '$edificioClave'
  if (firstStage.$match && thirdStage.$group && thirdStage.$group._id === '$edificioClave') {
    const resueltas = docs.filter((d) => d.estado === 'resuelta' || d.estado === 'cerrada');
    const byEdif = {};
    resueltas.forEach((d) => {
      const clave = d.ubicacion?.edificioId || d.ubicacion?.edificio || 'ED-A';
      const nombre = d.ubicacion?.edificio || clave;
      let min = d.tiempoResolucionMin;
      if (min == null) {
        const start = new Date(d.fechaReporte || d.createdAt).getTime();
        const end = new Date(d.fechaResolucion || d.fecha_resolucion || d.updatedAt).getTime();
        min = Math.max(1, Math.round((end - start) / 60000));
      }
      if (!byEdif[clave]) {
        byEdif[clave] = {
          edificioId: clave,
          edificio: nombre,
          sumaMin: 0,
          totalResueltas: 0,
        };
      }
      byEdif[clave].sumaMin += min;
      byEdif[clave].totalResueltas += 1;
    });

    return Object.values(byEdif)
      .map((item) => {
        const promMin = item.sumaMin / item.totalResueltas;
        return {
          edificioId: item.edificioId,
          edificio: item.edificio,
          tiempoPromedioMin: Number(promMin.toFixed(1)),
          tiempoPromedioHoras: Number((promMin / 60).toFixed(1)),
          totalResueltas: item.totalResueltas,
        };
      })
      .sort((a, b) => a.tiempoPromedioMin - b.tiempoPromedioMin);
  }

  // Caso 3: RF-08 getAulasCronicas -> $group por edificioId y aula
  if (firstStage.$group && firstStage.$group._id && firstStage.$group._id.aula) {
    const limitStage = pipeline.find((s) => s.$limit != null);
    const limit = limitStage ? limitStage.$limit : 10;
    const byAula = {};

    docs.forEach((d) => {
      const edificioId = d.ubicacion?.edificioId || d.ubicacion?.edificio || 'ED-A';
      const edificioNombre = d.ubicacion?.edificio || edificioId;
      const aula = d.ubicacion?.aula || d.ubicacion?.aula_laboratorio || 'Aula General';
      const key = `${edificioId}__${aula}`;

      if (!byAula[key]) {
        byAula[key] = {
          edificioId,
          edificio: edificioNombre,
          aula,
          aula_laboratorio: aula,
          totalIncidencias: 0,
          conteo: 0,
          criticas: 0,
          abiertas: 0,
          resueltas: 0,
          categoriasSet: new Set(),
          ultimosTickets: [],
        };
      }
      const g = byAula[key];
      g.totalIncidencias += 1;
      g.conteo += 1;
      if (d.prioridad === 'critica') g.criticas += 1;
      if (d.estado === 'abierta') g.abiertas += 1;
      if (d.estado === 'resuelta' || d.estado === 'cerrada') g.resueltas += 1;
      if (d.categoria) g.categoriasSet.add(d.categoria);
      g.ultimosTickets.push({
        codigo: d.codigo,
        titulo: d.titulo,
        prioridad: d.prioridad,
        estado: d.estado,
        fecha: d.fechaReporte || d.createdAt,
      });
    });

    return Object.values(byAula)
      .map((g) => ({
        edificioId: g.edificioId,
        edificio: g.edificio,
        aula: g.aula,
        aula_laboratorio: g.aula_laboratorio,
        totalIncidencias: g.totalIncidencias,
        conteo: g.conteo,
        criticas: g.criticas,
        abiertas: g.abiertas,
        resueltas: g.resueltas,
        categorias: Array.from(g.categoriasSet),
        ultimosTickets: g.ultimosTickets.slice(0, 3),
      }))
      .sort((a, b) => b.totalIncidencias - a.totalIncidencias || b.criticas - a.criticas)
      .slice(0, limit);
  }

  return [];
}

function patchMongooseModel(Model, colName) {
  const orig = {
    find: Model.find.bind(Model),
    findOne: Model.findOne.bind(Model),
    findById: Model.findById.bind(Model),
    findByIdAndUpdate: Model.findByIdAndUpdate.bind(Model),
    findByIdAndDelete: Model.findByIdAndDelete.bind(Model),
    countDocuments: Model.countDocuments.bind(Model),
    exists: Model.exists.bind(Model),
    deleteMany: Model.deleteMany.bind(Model),
    insertMany: Model.insertMany.bind(Model),
    syncIndexes: Model.syncIndexes.bind(Model),
    aggregate: Model.aggregate ? Model.aggregate.bind(Model) : null,
    protoSave: Model.prototype.save,
  };

  const useMem = () => mongoose.connection.readyState !== 1;

  Model.find = function (filter = {}) {
    if (!useMem()) return orig.find(filter);
    const items = store[colName].filter((d) => matchesFilter(d, filter));
    return createQueryChain(items);
  };

  Model.findOne = function (filter = {}) {
    if (!useMem()) return orig.findOne(filter);
    const found = store[colName].find((d) => matchesFilter(d, filter)) || null;
    return createQueryChain(found);
  };

  Model.findById = function (id) {
    if (!useMem()) return orig.findById(id);
    const found = store[colName].find((d) => String(d._id) === String(id)) || null;
    return createQueryChain(found);
  };

  Model.findByIdAndUpdate = function (id, update = {}, options = {}) {
    if (!useMem()) return orig.findByIdAndUpdate(id, update, options);
    const idx = store[colName].findIndex((d) => String(d._id) === String(id));
    if (idx === -1) return createQueryChain(null);
    const target = store[colName][idx];
    const cleanUpdate = { ...(update.$set || update) };
    delete cleanUpdate.$set;
    Object.entries(cleanUpdate).forEach(([k, v]) => {
      if (v !== undefined) target[k] = v;
    });
    target.updatedAt = new Date();
    const wrapped = wrapDocument(target.toObject(), colName);
    store[colName][idx] = wrapped;
    return createQueryChain(wrapped);
  };

  Model.findByIdAndDelete = async function (id) {
    if (!useMem()) return orig.findByIdAndDelete(id);
    const idx = store[colName].findIndex((d) => String(d._id) === String(id));
    if (idx === -1) return null;
    const [removed] = store[colName].splice(idx, 1);
    return removed;
  };

  Model.countDocuments = async function (filter = {}) {
    if (!useMem()) return orig.countDocuments(filter);
    return store[colName].filter((d) => matchesFilter(d, filter)).length;
  };

  Model.exists = async function (filter = {}) {
    if (!useMem()) return orig.exists(filter);
    const found = store[colName].find((d) => matchesFilter(d, filter));
    return found ? { _id: found._id } : null;
  };

  Model.deleteMany = async function (filter = {}) {
    if (!useMem()) return orig.deleteMany(filter);
    if (!filter || Object.keys(filter).length === 0) {
      const count = store[colName].length;
      store[colName] = [];
      return { deletedCount: count };
    }
    const before = store[colName].length;
    store[colName] = store[colName].filter((d) => !matchesFilter(d, filter));
    return { deletedCount: before - store[colName].length };
  };

  Model.insertMany = async function (docs = []) {
    if (!useMem()) return orig.insertMany(docs);
    const wrapped = docs.map((d) => wrapDocument(d, colName));
    store[colName].push(...wrapped);
    return wrapped;
  };

  Model.syncIndexes = async function () {
    if (!useMem()) return orig.syncIndexes();
    return [];
  };

  if (colName === 'incidencias') {
    Model.aggregate = async function (pipeline = []) {
      if (!useMem()) return orig.aggregate(pipeline);
      return runIncidenciaAggregate(pipeline);
    };
  }

  Model.prototype.save = async function (...args) {
    if (!useMem()) return orig.protoSave.apply(this, args);
    const plain = this.toObject ? this.toObject() : { ...this };
    const wrapped = wrapDocument(plain, colName);
    await wrapped.save();
    Object.assign(this, wrapped.toObject());
    return wrapped;
  };
}

function initializeMemoryFallback() {
  if (isMemoryMode) return;
  isMemoryMode = true;

  const Usuario = require('../models/Usuario');
  const Edificio = require('../models/Edificio');
  const Incidencia = require('../models/Incidencia');
  const { demoUsuarios, demoEdificios, demoIncidencias } = require('../seed/seedData');

  patchMongooseModel(Usuario, 'usuarios');
  patchMongooseModel(Edificio, 'edificios');
  patchMongooseModel(Incidencia, 'incidencias');

  // Pre-poblar en memoria con los datos oficiales de la semilla (con contraseñas hasheadas con bcrypt)
  store.usuarios = demoUsuarios.map((u) => {
    const plain = u.passwordPlain || 'utm123456';
    const hashedPassword = bcrypt.hashSync(plain, 10);
    const copy = { ...u, password: hashedPassword, creadoEn: new Date() };
    delete copy.passwordPlain;
    return wrapDocument(copy, 'usuarios');
  });

  store.edificios = demoEdificios.map((e) => wrapDocument({ ...e }, 'edificios'));
  store.incidencias = demoIncidencias.map((inc) => wrapDocument({ ...inc }, 'incidencias'));

  console.log(
    `🛡️  [Respaldo NoSQL Activo] Base de datos en memoria inicializada con ${store.usuarios.length} usuarios (bcrypt), ${store.edificios.length} edificios y ${store.incidencias.length} incidencias.`
  );
}

module.exports = {
  initializeMemoryFallback,
  isMemoryMode: () => isMemoryMode,
};
