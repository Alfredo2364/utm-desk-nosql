/**
 * Servicio de conexión a la API REST de UTM Desk NoSQL Cloud con soporte RBAC
 */

const API_BASE_URL = '/api';

/**
 * Obtiene las cabeceras de autenticación actuales guardadas en localStorage
 */
function getStoredHeaders() {
  const saved = localStorage.getItem('utm_desk_user');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      return {
        'x-user-email': u.email,
        'x-user-role': u.rol,
        'x-user-area': u.area || 'general',
        'x-user-name': u.nombre,
        'x-user-id': u._id,
        'Authorization': `Bearer ${u.email}`,
      };
    } catch {
      // fallback
    }
  }
  return {
    'x-user-email': 'alumno.garcia@utm.mx',
    'x-user-role': 'reportante',
  };
}

/**
 * Obtener listado de incidencias con filtros y reglas RBAC
 */
export async function getIncidencias(filters = {}, customHeaders = null) {
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
  if (filters.asignacion) {
    params.append('asignacion', filters.asignacion);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const headers = customHeaders || getStoredHeaders();

  const response = await fetch(`${API_BASE_URL}/incidencias${queryString}`, {
    headers: {
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener incidencias');
  }

  return await response.json();
}

/**
 * Obtener expediente completo sin JOINs
 */
export async function getIncidenciaByCodigo(codigo, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}`, {
    headers: {
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `No se pudo encontrar el expediente ${codigo}`);
  }

  return await response.json();
}

/**
 * Registrar una nueva incidencia polimórfica
 */
export async function createIncidencia(incidenciaData, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/incidencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
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
export async function uploadEvidencia(codigo, file, subidoPor = 'Usuario Campus', customHeaders = null) {
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

  const headers = customHeaders || getStoredHeaders();

  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/evidencias/archivo`, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al subir la evidencia a Supabase Storage');
  }

  return await response.json();
}

/**
 * Actualizar estado de la incidencia (PATCH /api/incidencias/:codigo/estado)
 */
export async function patchEstado(codigo, nuevoEstado, observaciones = '', customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ nuevoEstado, observaciones }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar estado');
  }

  return await response.json();
}

/**
 * Registrar una nueva revisión técnica en la línea de tiempo
 */
export async function addRevision(codigo, revisionData, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/revisiones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
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
 * Asignar o reasignar técnico (PATCH /api/incidencias/:codigo/asignar)
 */
export async function asignarTecnico(codigo, tecnicoData, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/incidencias/${codigo}/asignar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(tecnicoData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al reasignar técnico');
  }

  return await response.json();
}

// ==================== ENDPOINTS DE ANALÍTICA (DIRECTIVO & ADMIN) ====================

export async function getMetricasAnalitica(customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/analitica/metricas`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al consultar métricas');
  }
  return await response.json();
}

export async function getMttrAnalitica(customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/analitica/mttr`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al consultar MTTR');
  }
  return await response.json();
}

export async function getAulasCronicasAnalitica(customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/analitica/aulas-cronicas`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al consultar aulas crónicas');
  }
  return await response.json();
}

// ==================== CATÁLOGOS CRUD (USUARIOS & EDIFICIOS) ====================

export async function getUsuarios(customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/usuarios`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al consultar catálogo de usuarios');
  }
  return await response.json();
}

export async function createUsuario(data, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear usuario');
  }
  return await response.json();
}

export async function updateUsuario(id, data, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar usuario');
  }
  return await response.json();
}

export async function deleteUsuario(id, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar usuario');
  }
  return await response.json();
}

export async function getEdificios(customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/edificios`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al consultar catálogo de edificios');
  }
  return await response.json();
}

export async function createEdificio(data, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/edificios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear edificio');
  }
  return await response.json();
}

export async function updateEdificio(id, data, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/edificios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar edificio');
  }
  return await response.json();
}

export async function deleteEdificio(id, customHeaders = null) {
  const headers = customHeaders || getStoredHeaders();
  const response = await fetch(`${API_BASE_URL}/edificios/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar edificio');
  }
  return await response.json();
}

// ==================== AUTH & DEMO UTILS ====================

export async function loginUser(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor Backend (puerto 5000). Asegúrate de ejecutar: npm --prefix backend run dev'
    );
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok || !data) {
    throw new Error(
      data?.error ||
        'El servidor Backend (puerto 5000) no está encendido. Ejecuta en otra terminal: npm --prefix backend run dev'
    );
  }
  return data;
}

export async function recuperarPassword(email) {
  const response = await fetch(`${API_BASE_URL}/auth/recuperar-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error al solicitar código de recuperación');
  }
  return data;
}

export async function restablecerPassword(email, codigoRecuperacion, nuevaPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/restablecer-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, codigoRecuperacion, nuevaPassword }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error al restablecer la contraseña');
  }
  return data;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
  } catch {
    // Ignore error on client-side logout
  }
}

export async function getUsuariosDemo() {
  const response = await fetch(`${API_BASE_URL}/auth/usuarios-demo`);
  if (!response.ok) {
    return { ok: false, usuarios: [] };
  }
  return await response.json();
}

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

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return { ok: false };
    return await response.json();
  } catch {
    return { ok: false };
  }
}
