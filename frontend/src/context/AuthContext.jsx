import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsuariosDemo } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Lista de usuarios demo disponibles
  const [usuariosDemo, setUsuariosDemo] = useState([]);

  // Usuario activo predeterminado: Alumno Daniel García (Reportante)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('utm_desk_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      _id: 'rep-01',
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'reportante',
      area: 'general',
      cargo: 'Estudiante de Ing. en Computación',
      departamento_carrera: 'Ingeniería en Computación',
    };
  });

  // Cargar usuarios demo desde el backend
  useEffect(() => {
    getUsuariosDemo()
      .then((data) => {
        if (data && data.usuarios) {
          setUsuariosDemo(data.usuarios);
          // Si el usuario actual está en la lista de DB, sincronizar datos
          const matching = data.usuarios.find(
            (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (matching) {
            setCurrentUser(matching);
          }
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar usuarios demo desde el backend:', err.message);
      });
  }, []);

  // Cambiar usuario activo (Persona Demo Switcher)
  const cambiarUsuarioDemo = (email) => {
    const user = usuariosDemo.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('utm_desk_user', JSON.stringify(user));
    }
  };

  // Cabeceras HTTP para autenticación y RBAC
  const getAuthHeaders = () => {
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
        rol: currentUser.rol,
        area: currentUser.area,
        usuariosDemo,
        cambiarUsuarioDemo,
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
