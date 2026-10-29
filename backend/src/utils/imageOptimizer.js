let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('⚠️ [ImageOptimizer] Sharp no disponible en este entorno serverless, se usará passthrough:', err.message);
}

/**
 * Optimizador inteligente de imágenes para evidencias de UTM Desk
 * 
 * Diseñado específicamente para:
 * 1. Proteger el almacenamiento y cuota de ancho de banda de Supabase Storage.
 * 2. Mantener nitidez absoluta (sin desenfoque ni artefactos) en textos,
 *    códigos de error, números de serie de equipos y puertos de red (Lanczos3 + MozJPEG).
 * 3. Auto-orientar fotos tomadas desde smartphones (EXIF orientation).
 * 4. Preservar archivos no-imagen (como PDFs) sin alteración alguna.
 * 
 * @param {Buffer} fileBuffer - Buffer del archivo original
 * @param {string} mimeType - MIME type detectado (image/jpeg, image/png, application/pdf, etc.)
 * @param {string} originalName - Nombre del archivo original
 * @returns {Promise<{ buffer: Buffer, mimeType: string, originalSize: number, compressedSize: number, ahorroPct: string, fueComprimido: boolean }>}
 */
const optimizeEvidenceBuffer = async (fileBuffer, mimeType, originalName = '') => {
  const originalSize = fileBuffer.length;

  // Si no es imagen (por ejemplo, documentos PDF) o sharp no está disponible, retornar sin modificar
  if (!sharp || !mimeType || !mimeType.startsWith('image/')) {
    return {
      buffer: fileBuffer,
      mimeType,
      originalSize,
      compressedSize: originalSize,
      ahorroPct: '0%',
      fueComprimido: false,
    };
  }

  try {
    // Pipeline de Sharp con algoritmo de redimensionamiento Lanczos3 para máxima nitidez
    let pipeline = sharp(fileBuffer, { failOnError: false })
      .rotate() // Auto-orientación EXIF (elimina fotos de cabeza o de lado en móviles)
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside', // Mantiene la relación de aspecto sin recortar
        withoutEnlargement: true, // Si es menor a 1920px (ej. captura 800x600), no la estira
        kernel: sharp.kernel.lanczos3, // Kernel de máxima nitidez para detalles finos
      });

    let finalMimeType = mimeType;

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      // MozJPEG: Compresión perceptual avanzada sin borrosidad (83% calidad mantiene texto 100% legible)
      pipeline = pipeline.jpeg({
        quality: 83,
        mozjpeg: true,
        progressive: true,
      });
    } else if (mimeType === 'image/png') {
      // PNG optimizado
      pipeline = pipeline.png({
        compressionLevel: 8,
        adaptiveFiltering: true,
        quality: 85,
      });
    } else if (mimeType === 'image/webp') {
      pipeline = pipeline.webp({
        quality: 82,
        effort: 5,
      });
    } else {
      // Cualquier otro formato de imagen compatible, estandarizar a JPEG de alta fidelidad
      pipeline = pipeline.jpeg({
        quality: 83,
        mozjpeg: true,
        progressive: true,
      });
      finalMimeType = 'image/jpeg';
    }

    const compressedBuffer = await pipeline.toBuffer();
    const compressedSize = compressedBuffer.length;

    // Si por alguna razón la imagen comprimida resulta mayor (raro, pero posible en iconos mínimos),
    // conservamos la más liviana
    if (compressedSize >= originalSize) {
      return {
        buffer: fileBuffer,
        mimeType,
        originalSize,
        compressedSize: originalSize,
        ahorroPct: '0%',
        fueComprimido: false,
      };
    }

    const ahorroCalculado = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1) + '%';

    return {
      buffer: compressedBuffer,
      mimeType: finalMimeType,
      originalSize,
      compressedSize,
      ahorroPct: ahorroCalculado,
      fueComprimido: true,
    };
  } catch (error) {
    console.warn(`⚠️ [ImageOptimizer] Advertencia al optimizar imagen '${originalName}': ${error.message}. Se enviará el archivo original.`);
    return {
      buffer: fileBuffer,
      mimeType,
      originalSize,
      compressedSize: originalSize,
      ahorroPct: '0%',
      fueComprimido: false,
    };
  }
};

module.exports = {
  optimizeEvidenceBuffer,
};
