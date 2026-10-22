const multer = require('multer');

// Almacenamiento en memoria para pasar directamente el buffer a Supabase Storage
const storage = multer.memoryStorage();

// Límite estricto de 5 Megabytes (5 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Filtro de tipos MIME: Solo JPG, PNG y PDF
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
