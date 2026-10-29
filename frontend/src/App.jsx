import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncidentDetailModal from './components/IncidentDetailModal';
import NewIncidentModal from './components/NewIncidentModal';
import Login from './components/Login';
import ReportanteDashboard from './components/dashboards/ReportanteDashboard';
import TecnicoDashboard from './components/dashboards/TecnicoDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import DirectivoDashboard from './components/dashboards/DirectivoDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';
import { getIncidencias, seedDemoData } from './services/api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser, rol, isAuthenticated } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'analitica' | 'catalogos'

  // Sincronizar parámetros en la URL (id / folio, tab, nuevo)
  const syncUrlParams = (updates = {}) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);

      // Manejo de id / folio
      if ('id' in updates) {
        if (updates.id) {
          url.searchParams.set('id', updates.id);
          url.searchParams.delete('folio');
        } else {
          url.searchParams.delete('id');
          url.searchParams.delete('folio');
        }
      }

      // Manejo de pestaña activa
      if ('tab' in updates) {
        if (updates.tab && updates.tab !== 'dashboard') {
          url.searchParams.set('tab', updates.tab);
        } else {
          url.searchParams.delete('tab');
        }
      }

      // Manejo de modal nueva incidencia
      if ('nuevo' in updates) {
        if (updates.nuevo) {
          url.searchParams.set('nuevo', '1');
        } else {
          url.searchParams.delete('nuevo');
          url.searchParams.delete('nueva');
          url.searchParams.delete('modal');
        }
      }

      const queryString = url.searchParams.toString();
      const targetUrl = url.pathname + (queryString ? `?${queryString}` : '');

      if (updates.push) {
        window.history.pushState({}, '', targetUrl);
      } else {
        window.history.replaceState({}, '', targetUrl);
      }
    } catch {
      // Ignorar fallos de manipulación de URL
    }
  };

  const handleOpenIncident = (codigoOrObj) => {
    const code =
      typeof codigoOrObj === 'object' && codigoOrObj !== null
        ? codigoOrObj.codigo || codigoOrObj.codigo_unico || codigoOrObj._id
        : codigoOrObj;
    if (!code) return;
    setSelectedCodigo(code);
    syncUrlParams({ id: code, push: true });
  };

  const handleCloseIncident = () => {
    setSelectedCodigo(null);
    syncUrlParams({ id: null });
  };

  const handleOpenNewModal = () => {
    setIsNewModalOpen(true);
    syncUrlParams({ nuevo: true, push: true });
  };

  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    syncUrlParams({ nuevo: false });
  };

  const handleNavChange = (nav) => {
    setActiveNav(nav);
    syncUrlParams({ tab: nav });
  };

  // Leer y sincronizar parámetros de la URL al cargar la página o navegar con el historial
  useEffect(() => {
    const applyUrlState = () => {
      if (typeof window === 'undefined') return;
      try {
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id') || params.get('folio');
        const tabParam = params.get('tab');
        const nuevoParam =
          params.get('nuevo') || params.get('nueva') || params.get('modal') === 'nuevo';

        if (idParam) {
          setSelectedCodigo(idParam);
        } else {
          setSelectedCodigo(null);
        }

        if (tabParam && ['dashboard', 'analitica', 'catalogos'].includes(tabParam)) {
          setActiveNav(tabParam);
        }

        if (nuevoParam === '1' || nuevoParam === 'true') {
          setIsNewModalOpen(true);
        } else {
          setIsNewModalOpen(false);
        }
      } catch {
        // Ignorar
      }
    };

    applyUrlState();
    window.addEventListener('popstate', applyUrlState);
    return () => window.removeEventListener('popstate', applyUrlState);
  }, []);

  const [filters, setFilters] = useState({
    categoria: 'todas',
    estado: 'todos',
    prioridad: 'todas',
    search: '',
  });

  // Cargar incidencias desde la API (según Tabla 4, el rol 'directivo' solo consulta analítica)
  const loadIncidencias = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.rol === 'directivo') {
      setIncidencias([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getIncidencias(filters);
      setIncidencias(data.incidencias || []);
      setEstadisticas(data.estadisticas || {});
    } catch (err) {
      console.error('Error cargando incidencias:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadIncidencias();
    }
  }, [loadIncidencias, currentUser]);

  // Ajustar navegación según rol RBAC
  useEffect(() => {
    if (rol === 'directivo') {
      setActiveNav('analitica');
      return;
    }
    if (activeNav === 'catalogos' && rol !== 'admin' && rol !== 'superadmin') {
      setActiveNav('dashboard');
    }
    if (activeNav === 'analitica' && (rol === 'reportante' || rol === 'tecnico')) {
      setActiveNav('dashboard');
    }
  }, [rol, activeNav]);

  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadIncidencias();
      alert('¡Base de datos MongoDB Atlas restaurada con los 6 perfiles (incluyendo Super Admin), catálogos e incidencias!');
    } catch (err) {
      alert(`Error al sembrar datos: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Renderizado dinámico de la interfaz exclusiva para cada rol (Tabla 3 y Tabla 4 + Super Admin)
  const renderRoleDashboard = () => {
    if (activeNav === 'analitica' && (rol === 'directivo' || rol === 'supervisor' || rol === 'admin' || rol === 'superadmin')) {
      return <DirectivoDashboard />;
    }

    if (activeNav === 'catalogos' && (rol === 'admin' || rol === 'superadmin')) {
      return (
        <AdminDashboard
          incidencias={incidencias}
          estadisticas={estadisticas}
          loading={loading}
          onSelectIncidencia={handleOpenIncident}
          onRefresh={loadIncidencias}
          onOpenNewModal={handleOpenNewModal}
          defaultTab="usuarios"
        />
      );
    }

    switch (rol) {
      case 'superadmin':
        return (
          <SuperAdminDashboard
            incidencias={incidencias}
            estadisticas={estadisticas}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onRefresh={loadIncidencias}
            onOpenNewModal={handleOpenNewModal}
            onSeedData={handleSeedData}
            isSeeding={isSeeding}
          />
        );
      case 'reportante':
        return (
          <ReportanteDashboard
            incidencias={incidencias}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onOpenNewModal={handleOpenNewModal}
          />
        );
      case 'tecnico':
        return (
          <TecnicoDashboard
            incidencias={incidencias}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onRefresh={loadIncidencias}
          />
        );
      case 'supervisor':
        return (
          <SupervisorDashboard
            incidencias={incidencias}
            estadisticas={estadisticas}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onRefresh={loadIncidencias}
            onOpenNewModal={handleOpenNewModal}
            onNavigateToAnalitica={() => handleNavChange('analitica')}
          />
        );
      case 'directivo':
        return <DirectivoDashboard />;
      case 'admin':
        return (
          <AdminDashboard
            incidencias={incidencias}
            estadisticas={estadisticas}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onRefresh={loadIncidencias}
            onOpenNewModal={handleOpenNewModal}
          />
        );
      default:
        return (
          <Dashboard
            incidencias={incidencias}
            estadisticas={estadisticas}
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
            onSelectIncidencia={handleOpenIncident}
            onSeedData={handleSeedData}
            isSeeding={isSeeding}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 flex flex-col font-sans text-slate-800">
      <Navbar
        onOpenNewModal={handleOpenNewModal}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        onRefresh={loadIncidencias}
        activeNav={activeNav}
        onChangeNav={handleNavChange}
        onTrackFolio={handleOpenIncident}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderRoleDashboard()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">UTM Desk NoSQL Cloud</span>
            <span>•</span>
            <span className="capitalize">
              Sesión activa: <strong className="text-slate-900">{currentUser?.nombre}</strong> ({rol})
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
            <span>Matriz Tabla 3 y 4 ERS</span>
            <span>•</span>
            <span>MongoDB Atlas M0</span>
            <span>•</span>
            <span>Supabase Storage + Sharp HD</span>
          </div>
        </div>
      </footer>

      {selectedCodigo && (
        <IncidentDetailModal
          codigo={selectedCodigo}
          onClose={handleCloseIncident}
          onIncidentUpdated={loadIncidencias}
        />
      )}

      {isNewModalOpen && (
        <NewIncidentModal
          isOpen={isNewModalOpen}
          onClose={handleCloseNewModal}
          onIncidentCreated={loadIncidencias}
        />
      )}
    </div>
  );
}
