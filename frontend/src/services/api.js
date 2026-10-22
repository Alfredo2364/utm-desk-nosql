/**
 * Servicio de conexión a la API REST de UTM Desk NoSQL Cloud
 */

const API_BASE_URL = '/api';

/**
 * Obtener listado de incidencias con filtros
 */
export async function getIncidencias(filters = {}) {
  const params = new URLSearchParams();
  if (filters.categoria && filters.categoria !== 'todas') {
    params.append('categoria', filters.categoria);
  }
  if (filters.estado && filters.estado !== 'todos') {
    params.append('estado', filters.estado);
  }
  if (filters.prioridad && filters.prioridad !== 'todas') {
    params.append('prioridad', filters.prioridad);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/incidencias${queryString}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener incidencias');
  }
  
  return await response.json();
}

/**
 * Obtener expediente completo sin JOINs
 */
export async function getIncidenciaByCodigo(codigo) {
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `No se pudo encontrar el expediente ${codigo}`);
  }
  
  return await response.json();
}

/**
 * Registrar una nueva incidencia polimórfica
 */
export async function createIncidencia(incidenciaData) {
  const response = await fetch(`${API_BASE_URL}/incidencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(incidenciaData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al registrar la incidencia');
  }

  return await response.json();
}

/**
 * Subir evidencia en formato multipart/form-data al endpoint de Supabase Storage
 * Campo del archivo: 'archivo'
 */
export async function uploadEvidencia(codigo, file, subidoPor = 'Usuario Campus') {
  // Validación preliminar en frontend
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('El archivo excede el tamaño máximo permitido de 5MB');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG y documentos PDF.');
  }

  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('subido_por', subidoPor);

  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/evidencias/archivo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al subir la evidencia a Supabase Storage');
  }

  return await response.json();
}

/**
 * Registrar una nueva revisión técnica en la línea de tiempo
 */
export async function addRevision(codigo, revisionData) {
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/revisiones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(revisionData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al agregar la revisión técnica');
  }

  return await response.json();
}

/**
 * Poblar base de datos con datos de demostración
 */
export async function seedDemoData() {
  const response = await fetch(`${API_BASE_URL}/incidencias/seed`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al sembrar datos');
  }

  return await response.json();
}

/**
 * Consultar estado de salud del backend
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return { ok: false };
    return await response.json();
  } catch {
    return { ok: false };
  }
}
