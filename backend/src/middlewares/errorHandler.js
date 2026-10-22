const multer = require('multer');

/**
 * Middleware de manejo de errores centralizado para Express
 */
const errorHandler = (err, req, res, next) => {
  console.error(`💥 [Error Handler]:`, err);

  // Errores propios de Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        ok: false,
        error: 'El archivo excede el límite máximo de 5MB.',
        code: 'LIMIT_FILE_SIZE',
      });
    }
    return res.status(400).json({
      ok: false,
      error: `Error en la carga del archivo: ${err.message}`,
      code: err.code,
    });
  }

  // Validación de tipo de archivo custom
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      ok: false,
      error: err.message,
      code: 'INVALID_FILE_TYPE',
    });
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      ok: false,
      error: 'Error de validación en MongoDB',
      detalles: mensajes,
    });
  }

  // Error de clave duplicada en MongoDB (ej. código duplicado)
  if (err.code === 11000) {
    const campoDuplicado = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({
      ok: false,
      error: `Ya existe un registro con el mismo valor para '${campoDuplicado}'.`,
      code: 'DUPLICATE_KEY',
    });
  }

  // Error de Cast Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      ok: false,
      error: `Identificador o formato de datos no válido: ${err.value}`,
    });
  }

  // Error HTTP personalizado
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor.';

  return res.status(statusCode).json({
    ok: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
