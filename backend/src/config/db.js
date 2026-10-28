const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { initializeMemoryFallback } = require('../utils/memoryDatabase');

// Configurar servidores DNS públicos (Google / Cloudflare) para evitar fallos 'querySrv ETIMEOUT' en Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignorar si el entorno restringe cambio de DNS
}

const connectDB = async () => {
  // Inicializar el respaldo en memoria para que nunca ocurra 'buffering timed out after 10000ms'
  initializeMemoryFallback();

  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('tu_usuario')) {
    console.warn('⚠️ [MongoDB] MONGO_URI no configurado. Operando con base de datos en memoria.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4500,
      dbName: 'utm_desk_db',
    });
    console.log(
      `✅ [MongoDB Atlas] Conectado exitosamente: ${conn.connection.host} (Base de datos: ${conn.connection.name})`
    );
    return true;
  } catch (error) {
    console.warn(
      `⚠️ [MongoDB Atlas] No se pudo alcanzar el clúster remoto (${error.message}). Operando con respaldo NoSQL activo sin interrupción.`
    );
    return false;
  }
};

module.exports = connectDB;
