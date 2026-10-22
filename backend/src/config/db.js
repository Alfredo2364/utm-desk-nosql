const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI || mongoURI.includes('tu_usuario')) {
    console.warn('⚠️ [MongoDB] MONGO_URI no configurado o contiene valores por defecto.');
    console.warn('⚠️ [MongoDB] Configure su archivo .env con la cadena de conexión de MongoDB Atlas.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [MongoDB Atlas] Conectado exitosamente: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Atlas] Error al conectar: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
