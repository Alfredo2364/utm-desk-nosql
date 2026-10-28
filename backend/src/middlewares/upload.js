const multer = require('multer');

// Almacenamiento en memoria para pasar el buffer al compresor Sharp HD y luego a Supabase Storage
const storage = multer.memoryStorage();

// Límite estricto de 5 Megabytes (5 * 1024 * 1024 bytes) conforme a RF-06 y RNF-06
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Filtro de tipos MIME: JPG, PNG y PDF conforme a RF-06 y RNF-06
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Formato no permitido. Solo se aceptan archivos JPG, PNG y PDF.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // 1 archivo por petición al endpoint de evidencia
  },
  fileFilter,
});

module.exports = upload;
