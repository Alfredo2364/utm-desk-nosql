const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { initializeMemoryFallback } = require('../utils/memoryDatabase');

// Configurar servidores DNS públicos (Google / Cloudflare) en entornos locales Windows
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // Ignorar si el entorno restringe cambio de DNS
  }
}

// Caché global de conexión para funciones Serverless (Vercel)
let cached = global.__utmMongoCache;
if (!cached) {
  cached = global.__utmMongoCache = {
    conn: null,
    promise: null,
    seededCheckDone: false,
  };
}

/**
 * Si la base de datos en MongoDB Atlas está completamente vacía al desplegar,
 * inserta automáticamente la semilla inicial (usuarios con bcrypt, edificios e incidencias).
 */
async function ensureAtlasSeededIfEmpty() {
  if (cached.seededCheckDone || mongoose.connection.readyState !== 1) return;
  cached.seededCheckDone = true;

  try {
    const Usuario = require('../models/Usuario');
    const Edificio = require('../models/Edificio');
    const Incidencia = require('../models/Incidencia');
    const { demoUsuarios, demoEdificios, demoIncidencias } = require('../seed/seedData');

    const userCount = await Usuario.countDocuments();
    if (userCount === 0) {
      console.log('🌱 [MongoDB Atlas] Colección vacía detectada. Sembrando datos iniciales automáticamente...');
      const usuariosConHash = await Promise.all(
        demoUsuarios.map(async (u) => {
          const plain = u.passwordPlain || 'utm123456';
          const hashedPassword = await bcrypt.hash(plain, 10);
          const copy = { ...u, password: hashedPassword, creadoEn: new Date() };
          delete copy.passwordPlain;
          return copy;
        })
      );
      await Usuario.insertMany(usuariosConHash);
      await Edificio.insertMany(demoEdificios);
      for (const incData of demoIncidencias) {
        const doc = new Incidencia(incData);
        await doc.save();
      }
      await Incidencia.syncIndexes();
      console.log('✅ [MongoDB Atlas] Semilla inicial creada exitosamente.');
    }
  } catch (err) {
    console.warn('⚠️ [MongoDB Atlas] Aviso en verificación de semilla inicial:', err.message);
  }
}

const connectDB = async () => {
  // Inicializar el respaldo en memoria para evitar cualquier 'buffering timed out'
  initializeMemoryFallback();

  // Si ya existe conexión activa en caché (warm serverless invocation), reutilizarla en 0ms
  if (cached.conn && mongoose.connection.readyState === 1) {
    return true;
  }

  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('tu_usuario')) {
    console.warn('⚠️ [MongoDB] MONGO_URI no configurado. Operando con base de datos en memoria.');
    return false;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 5, // Óptimo para funciones Serverless en Vercel
        dbName: 'utm_desk_db',
      })
      .then(async (mongooseInstance) => {
        cached.conn = mongooseInstance;
        console.log(
          `✅ [MongoDB Atlas] Conectado: ${mongooseInstance.connection.host} (${mongooseInstance.connection.name})`
        );
        await ensureAtlasSeededIfEmpty();
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.warn(
          `⚠️ [MongoDB Atlas] No se pudo alcanzar el clúster remoto (${error.message}). Operando con respaldo NoSQL activo.`
        );
        return null;
      });
  }

  const conn = await cached.promise;
  return !!conn;
};

module.exports = connectDB;
