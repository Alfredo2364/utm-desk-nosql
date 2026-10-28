const { createClient } = require('@supabase/supabase-js');
const { optimizeEvidenceBuffer } = require('../utils/imageOptimizer');

const rawUrl = process.env.SUPABASE_URL || '';
// Sanitizar URL eliminando rutas secundarias como /rest/v1/ o barras finales
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const defaultBucket = process.env.SUPABASE_BUCKET || 'evidencias-campus';

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('tu-proyecto')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ [Supabase Storage] Cliente inicializado correctamente.');
    
    // Asegurar que el bucket privado exista en Supabase
    (async () => {
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (!error && buckets) {
          const exists = buckets.some((b) => b.name === defaultBucket);
          if (!exists) {
            console.log(`📦 [Supabase Storage] Creando bucket privado '${defaultBucket}'...`);
            await supabase.storage.createBucket(defaultBucket, {
              public: false,
            });
            console.log(`✅ [Supabase Storage] Bucket '${defaultBucket}' creado exitosamente.`);
          } else {
            console.log(`✅ [Supabase Storage] Bucket '${defaultBucket}' listo y accesible.`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ [Supabase Storage] Verificación inicial de bucket: ${e.message}`);
      }
    })();
  } catch (err) {
    console.error('❌ [Supabase Storage] Error al inicializar cliente:', err.message);
  }
} else {
  console.warn('⚠️ [Supabase Storage] SUPABASE_URL o SUPABASE_SERVICE_KEY no configurados en .env.');
}

/**
 * Sube un buffer de archivo al bucket privado de Supabase Storage
 * y genera una URL firmada con vigencia de 6 días (518400 segundos).
 * 
 * @param {Buffer} fileBuffer - Buffer del archivo recibido por multer
 * @param {string} originalName - Nombre original del archivo
 * @param {string} mimeType - Tipo MIME (image/png, image/jpeg, application/pdf)
 * @param {string} incidentCode - Código de la incidencia para organizar la carpeta
 * @returns {Promise<{ path: string, signedUrl: string, expiresAt: Date, size: number }>}
 */
const uploadEvidenceToSupabase = async (fileBuffer, originalName, mimeType, incidentCode) => {
  if (!supabase) {
    throw new Error('El cliente de Supabase Storage no está configurado. Verifique SUPABASE_URL y SUPABASE_SERVICE_KEY en su archivo .env');
  }

  // 1. Optimización y compresión inteligente sin pérdida de nitidez (Sharp + MozJPEG / Lanczos3)
  const {
    buffer: optimizedBuffer,
    mimeType: finalMimeType,
    originalSize,
    compressedSize,
    ahorroPct,
    fueComprimido,
  } = await optimizeEvidenceBuffer(fileBuffer, mimeType, originalName);

  // Sanitizar y generar ruta única: incidencias/{codigo}/{timestamp}_{nombre}
  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `incidencias/${incidentCode}/${Date.now()}_${cleanName}`;

  // 2. Subir el buffer optimizado al bucket de Supabase
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(defaultBucket)
    .upload(filePath, optimizedBuffer, {
      contentType: finalMimeType,
      upsert: true,
    });

  if (uploadError) {
    // Si el bucket no existía, intentar crearlo y reintentar la subida
    if (uploadError.message && uploadError.message.includes('not found')) {
      await supabase.storage.createBucket(defaultBucket, { public: false });
      const retry = await supabase.storage
        .from(defaultBucket)
        .upload(filePath, optimizedBuffer, {
          contentType: finalMimeType,
          upsert: true,
        });
      if (retry.error) {
        throw new Error(`Error al subir archivo a Supabase Storage tras crear bucket: ${retry.error.message}`);
      }
    } else {
      throw new Error(`Error al subir archivo a Supabase Storage: ${uploadError.message}`);
    }
  }

  // 3. Generar URL firmada por 6 días (6 días * 24 h * 60 m * 60 s = 518400 segundos)
  const SIX_DAYS_IN_SECONDS = 6 * 24 * 60 * 60; // 518400 segundos
  const { data: signedData, error: signError } = await supabase.storage
    .from(defaultBucket)
    .createSignedUrl(filePath, SIX_DAYS_IN_SECONDS);

  if (signError) {
    throw new Error(`Error al generar URL firmada en Supabase: ${signError.message}`);
  }

  const expiresAt = new Date(Date.now() + SIX_DAYS_IN_SECONDS * 1000);

  return {
    path: filePath,
    signedUrl: signedData.signedUrl,
    expiresAt,
    size: compressedSize,
    originalSize,
    ahorroPct,
    fueComprimido,
  };
};

module.exports = {
  supabase,
  defaultBucket,
  uploadEvidenceToSupabase,
};
