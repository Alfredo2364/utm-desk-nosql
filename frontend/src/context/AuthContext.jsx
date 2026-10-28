import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsuariosDemo, loginUser, logoutUser } from '../services/api';

const AuthContext = createContext();

const DEFAULT_USUARIOS_DEMO = [
  {
    _id: 'supadm-01',
    nombre: 'Super Administrador General UTM',
    email: 'superadmin@utm.mx',
    rol: 'superadmin',
    area: null,
    cargo: 'Super Administrador General — Control Total y Ejecución Global',
  },
  {
    _id: 'adm-01',
    nombre: 'Administrador Maestro UTM',
    email: 'admin.sistemas@utm.mx',
    rol: 'admin',
    area: null,
    cargo: 'Administrador de Usuarios y Catálogos (Tabla 3)',
  },
  {
    _id: 'dir-01',
    nombre: 'Dra. Patricia Arango',
    email: 'directora.academica@utm.mx',
    rol: 'directivo',
    area: null,
    cargo: 'Directivo de la UTM — Analítica y Reportes (Tabla 3)',
  },
  {
    _id: 'sup-01',
    nombre: 'Ing. Carlos Mendoza',
    email: 'supervisor.campus@utm.mx',
    rol: 'supervisor',
    area: null,
    cargo: 'Supervisor de Gestión y Seguimiento de Tickets (Tabla 3)',
  },
  {
    _id: 'tec-01',
    nombre: 'Luis Hernández Pech (Téc. Cómputo)',
    email: 'tecnico.redes@utm.mx',
    rol: 'tecnico',
    area: 'computo_telecomunicaciones',
    cargo: 'Especialista en Cómputo y Telecomunicaciones (Figura 5)',
  },
  {
    _id: 'tec-02',
    nombre: 'Téc. Marco Peña (Téc. Infraestructura)',
    email: 'tecnico.infra@utm.mx',
    rol: 'tecnico',
    area: 'infraestructura_mantenimiento',
    cargo: 'Técnico de Infraestructura y Mantenimiento Físico',
  },
  {
    _id: 'tec-03',
    nombre: 'Ing. Daniela Soto (Téc. Sistemas)',
    email: 'tecnico.sistemas@utm.mx',
    rol: 'tecnico',
    area: 'sistemas_servicios_academicos',
    cargo: 'Ingeniera de Sistemas y Servicios Académicos',
  },
  {
    _id: 'rep-01',
    nombre: 'Alumno Daniel García',
    email: 'alumno.garcia@utm.mx',
    rol: 'reportante',
    area: null,
    cargo: 'Integrante de la Comunidad Universitaria — Reportante (Tabla 3)',
  },
];

export function AuthProvider({ children }) {
  // Lista de usuarios demo disponibles en MongoDB Atlas (con respaldo inmediato para la UI)
  const [usuariosDemo, setUsuariosDemo] = useState(DEFAULT_USUARIOS_DEMO);
  const [authLoading, setAuthLoading] = useState(false);

  // Usuario activo autenticado: siempre inicia en null para mostrar la pantalla de Login al abrir la app
  const [currentUser, setCurrentUser] = useState(() => {
    localStorage.removeItem('utm_desk_user');
    localStorage.removeItem('utm_desk_token');
    return null;
  });

  // Cargar usuarios demo desde el backend (MongoDB Atlas) para el selector de acceso rápido en Login
  useEffect(() => {
    getUsuariosDemo()
      .then((data) => {
        if (data && data.usuarios) {
          setUsuariosDemo(data.usuarios);
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar usuarios demo desde el backend:', err.message);
      });
  }, []);

  // Iniciar sesión con validación manual de credenciales en MongoDB Atlas
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await loginUser(email, password);
      if (data && data.usuario) {
        setCurrentUser(data.usuario);
        localStorage.setItem('utm_desk_user', JSON.stringify(data.usuario));
        if (data.token) {
          localStorage.setItem('utm_desk_token', data.token);
        }
        return data.usuario;
      }
      throw new Error('Respuesta inválida del servidor de autenticación');
    } finally {
      setAuthLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignorar fallo de red en logout
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('utm_desk_user');
      localStorage.removeItem('utm_desk_token');
    }
  };

  // Cabeceras HTTP para autenticación y RBAC
  const getAuthHeaders = () => {
    if (!currentUser) return {};
    return {
      'x-user-email': currentUser.email,
      'x-user-role': currentUser.rol,
      'x-user-area': currentUser.area || 'general',
      'x-user-name': currentUser.nombre,
      'x-user-id': currentUser._id,
      'Authorization': `Bearer ${currentUser.email}`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        rol: currentUser?.rol || null,
        area: currentUser?.area || null,
        isAuthenticated: !!currentUser,
        authLoading,
        usuariosDemo,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
