/**
 * searchHelper.js
 * Utilidad inteligente y tolerante a fallos para búsqueda de incidencias y folios en UTM Desk NoSQL Cloud.
 * 
 * Capacidades:
 * 1. Insensible a mayúsculas/minúsculas ("EjeMplos", "MartEs")
 * 2. Insensible a acentos/diacríticos ("sAbado" <-> "Sábado", "ano" <-> "año")
 * 3. Tolerante a erratas, faltas ortográficas y transposición de letras ("matres" -> "martes", "edifisio" -> "edificio", "ejenplo" -> "ejemplo", "swich" -> "switch")
 * 4. Búsqueda flexible de folios ("0001", "1", "INC-2026-0001", "utm 2026 0001", "inc20260001")
 * 5. Búsqueda tokenizada multi-palabra (ej. "edificio b proyector")
 * 6. Blindado contra caídas o errores de sintaxis (símbolos como "(", "[", "*", "+", "?", "\")
 */

/**
 * Normaliza un texto eliminando acentos/diacríticos y pasándolo a minúsculas.
 * Seguro contra null, undefined y tipos no-string.
 */
export function normalizeText(str) {
  if (str == null) return '';
  try {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch {
    return String(str).toLowerCase().trim();
  }
}

/**
 * Limpia un folio o código dejando únicamente caracteres alfanuméricos en minúsculas.
 * Ej: "UTM-2026-0001" -> "utm20260001", "INC 2026 0001" -> "inc20260001"
 */
export function cleanFolio(str) {
  if (!str) return '';
  return normalizeText(str).replace(/[^a-z0-9]/g, '');
}

/**
 * Distancia Damerau-Levenshtein óptima:
 * Cuenta inserciones, eliminaciones, sustituciones y transposiciones de letras adyacentes.
 */
export function damerauLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  
  const m = a.length;
  const n = b.length;
  const d = [];
  
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,        // eliminación
        d[i][j - 1] + 1,        // inserción
        d[i - 1][j - 1] + cost   // sustitución
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposición (ej. "matres" -> "martes")
      }
    }
  }
  return d[m][n];
}

const CATEGORIA_LABELS = {
  computo_telecomunicaciones: 'computo redes telecomunicaciones internet wifi cableado router switch pc informatica',
  infraestructura_mantenimiento: 'infraestructura mantenimiento electricidad luminarias lamparas luz agua plomeria aire clima gotera',
  sistemas_servicios_academicos: 'sistemas servicios academicos sia plataforma portal calificaciones escolar software',
};

/**
 * Extrae los campos de búsqueda de una incidencia.
 */
export function extractSearchCorpus(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;

  const parts = [
    item.codigo,
    item.codigo_unico,
    item.titulo,
    item.descripcion,
    item.categoria,
    CATEGORIA_LABELS[item.categoria] || '',
    item.prioridad,
    item.estado,
    (item.estado === 'en_proceso' || item.estado === 'en_progreso') ? 'en proceso en progreso' : '',
    item.ubicacion?.edificio,
    item.ubicacion?.edificioId,
    item.ubicacion?.aula,
    item.ubicacion?.aula_laboratorio,
    item.ubicacion?.piso,
    item.tecnico_asignado?.nombre,
    item.tecnico_asignado?.email,
    item.reportante?.nombre,
    item.reportante?.email,
    item.reportante?.departamento,
    item.reportante?.carrera,
    item.impactoOperativo,
    item.diagnosticoInicial,
    item.accionCorrectiva,
  ];
  return parts.filter(Boolean).join(' ');
}

/**
 * Evalúa si una palabra/token coincide con el texto considerando erratas y variaciones.
 */
function isTokenMatch(token, textWords, normCorpus) {
  if (!token) return true;
  
  const tokenLen = token.length;
  const isNumber = /^\d+$/.test(token);

  // Números cortos no deben hacer substring genérico (evita que '6' coincida con '2026')
  if (!isNumber && normCorpus.includes(token)) return true;

  for (const word of textWords) {
    if (word === token) return true;
    if (word.includes(token)) return true;

    // Los números no se evalúan con distancia de Levenshtein (evita que '0006' coincida con '0001')
    if (isNumber) continue;

    // Manejo de singular/plural en español (ej. "ejemplos" vs "ejemplo")
    if (tokenLen >= 4 && (token === `${word}s` || word === `${token}s` || token === `${word}es` || word === `${token}es`)) {
      return true;
    }

    // Tolerancia ortográfica mediante Damerau-Levenshtein
    const maxDist = tokenLen <= 3 ? 0 : tokenLen <= 5 ? 1 : 2;
    if (maxDist > 0 && Math.abs(word.length - tokenLen) <= maxDist) {
      if (damerauLevenshtein(token, word) <= maxDist) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Función principal de coincidencia difusa para el buscador.
 * 
 * @param {Object|string} item - Incidencia o texto a evaluar
 * @param {string} rawQuery - Cadena escrita por el usuario en el buscador
 * @returns {boolean} - true si coincide o si la búsqueda está vacía
 */
export function matchFuzzy(item, rawQuery) {
  if (!rawQuery || !String(rawQuery).trim()) return true;

  const normQuery = normalizeText(rawQuery);
  if (!normQuery) return true;

  // 1. Coincidencia inteligente de Folio / Código (soporta "0001", "1", "INC-2026-0001", "utm 2026 0001", "inc20260001")
  const itemCode = cleanFolio(item?.codigo || item?.codigo_unico || '');
  const alphaQuery = cleanFolio(rawQuery);

  if (alphaQuery && itemCode) {
    if (itemCode.includes(alphaQuery)) return true;
    if (alphaQuery.startsWith('inc') && itemCode.includes(alphaQuery.replace(/^inc/, 'utm'))) return true;
    if (alphaQuery.startsWith('utm') && itemCode.includes(alphaQuery.replace(/^utm/, 'inc'))) return true;

    // Búsqueda por número secuencial (ej: "1" o "6" para "0001" o "0006")
    if (/^\d{1,4}$/.test(alphaQuery)) {
      const padded = alphaQuery.padStart(4, '0');
      if (itemCode.endsWith(padded)) return true;
    }
  }

  // 2. Extracción y normalización de texto del registro
  const corpus = extractSearchCorpus(item);
  const normCorpus = normalizeText(corpus);

  // Evitar que números de 1 o 2 dígitos hagan match con el año '2026' dentro del corpus
  const isShortNumber = /^\d{1,2}$/.test(normQuery);
  if (!isShortNumber && normCorpus.includes(normQuery)) {
    return true;
  }

  // 3. Separación por tokens para soportar multi-palabras y erratas
  const queryTokens = normQuery.split(/[\s,./\\;:+*_-]+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  const textWords = normCorpus.split(/[^a-z0-9]+/).filter(Boolean);

  // Cada palabra del usuario debe coincidir con alguna parte del registro
  return queryTokens.every((token) => isTokenMatch(token, textWords, normCorpus));
}

export default matchFuzzy;
