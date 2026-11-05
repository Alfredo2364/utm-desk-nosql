const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { initializeMemoryFallback } = require('../utils/memoryDatabase');

// Desactivar buffering para evitar cuelgues de 10000ms en serverless
mongoose.set('bufferCommands', false);

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

const DIRECT_ATLAS_URI =
  'mongodb://argentmoon221_db_user:kbdWSABdFdJXxRNi@ac-bkabupl-shard-00-00.z7fflwr.mongodb.net:27017,ac-bkabupl-shard-00-01.z7fflwr.mongodb.net:27017,ac-bkabupl-shard-00-02.z7fflwr.mongodb.net:27017/utm_desk_db?ssl=true&replicaSet=atlas-nnfy2c-shard-0&authSource=admin&retryWrites=true&w=majority';

const SRV_ATLAS_URI =
  'mongodb+srv://argentmoon221_db_user:kbdWSABdFdJXxRNi@cluster0.z7fflwr.mongodb.net/utm_desk_db?retryWrites=true&w=majority';

const connectDB = async () => {
  // Inicializar el respaldo en memoria para evitar cualquier 'buffering timed out'
  initializeMemoryFallback();

  // Si ya existe conexión activa en caché (warm serverless invocation), reutilizarla en 0ms
  if (cached.conn && mongoose.connection.readyState === 1) {
    return true;
  }

  const envURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  const isDefaultOrSRV = !envURI || envURI.includes('cluster0.z7fflwr.mongodb.net') || envURI.startsWith('mongodb+srv://');
  const primaryURI = isDefaultOrSRV ? DIRECT_ATLAS_URI : envURI;
  const fallbackURI = isDefaultOrSRV ? (envURI || SRV_ATLAS_URI) : DIRECT_ATLAS_URI;

  if (!cached.promise) {
    const tryConnect = async (uri) => {
      return mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 6000,
        maxPoolSize: 5,
        dbName: 'utm_desk_db',
      });
    };

    cached.promise = tryConnect(primaryURI)
      .catch((err) => {
        console.warn('⚠️ [MongoDB Atlas] Primer intento falló, reintentando con URI alternativa:', err.message);
        return tryConnect(fallbackURI);
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
