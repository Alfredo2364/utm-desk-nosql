import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncidentDetailModal from './components/IncidentDetailModal';
import NewIncidentModal from './components/NewIncidentModal';
import ReportanteDashboard from './components/dashboards/ReportanteDashboard';
import TecnicoDashboard from './components/dashboards/TecnicoDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import DirectivoDashboard from './components/dashboards/DirectivoDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import { getIncidencias, seedDemoData } from './services/api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser, rol } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'analitica' | 'catalogos'

  const [filters, setFilters] = useState({
    categoria: 'todas',
    estado: 'todos',
    prioridad: 'todas',
    search: '',
  });

  // Cargar incidencias desde la API (con cabeceras RBAC del usuario activo)
  const loadIncidencias = useCallback(async () => {
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
    loadIncidencias();
  }, [loadIncidencias]);

  // Si cambia el usuario y su rol no permite analítica o catálogos, regresar a dashboard
  useEffect(() => {
    if (activeNav === 'catalogos' && rol !== 'admin') {
      setActiveNav('dashboard');
    }
    if (activeNav === 'analitica' && rol === 'reportante') {
      setActiveNav('dashboard');
    }
  }, [rol, activeNav]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadIncidencias();
      alert('¡Base de datos MongoDB Atlas restaurada con usuarios RBAC, catálogos e incidencias!');
    } catch (err) {
      alert(`Error al sembrar datos: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Renderizado dinámico del dashboard según rol RBAC
  const renderRoleDashboard = () => {
    if (activeNav === 'analitica') {
      return <DirectivoDashboard />;
    }

    if (activeNav === 'catalogos' && rol === 'admin') {
      return (
        <AdminDashboard
          incidencias={incidencias}
          estadisticas={estadisticas}
          loading={loading}
          onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
          onRefresh={loadIncidencias}
        />
      );
    }

    switch (rol) {
      case 'reportante':
        return (
          <ReportanteDashboard
            incidencias={incidencias}
            loading={loading}
            onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
            onOpenNewModal={() => setIsNewModalOpen(true)}
          />
        );
      case 'tecnico':
        return (
          <TecnicoDashboard
            incidencias={incidencias}
            loading={loading}
            onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
            onRefresh={loadIncidencias}
          />
        );
      case 'supervisor':
        return (
          <SupervisorDashboard
            incidencias={incidencias}
            estadisticas={estadisticas}
            loading={loading}
            onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
            onRefresh={loadIncidencias}
            onNavigateToAnalitica={() => setActiveNav('analitica')}
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
            onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
            onRefresh={loadIncidencias}
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
            onSelectIncidencia={(inc) => setSelectedCodigo(inc.codigo)}
            onSeedData={handleSeedData}
            isSeeding={isSeeding}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Barra de Navegación con Selector RBAC */}
      <Navbar
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        onRefresh={loadIncidencias}
        activeNav={activeNav}
        onChangeNav={(nav) => setActiveNav(nav)}
      />

      {/* Contenido Principal Adaptativo */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderRoleDashboard()}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">UTM Desk NoSQL Cloud</span>
            <span>•</span>
            <span className="capitalize">
              Sesión activa: <strong className="text-slate-900">{currentUser.nombre}</strong> ({rol})
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Control de Acceso RBAC</span>
            <span>•</span>
            <span>MongoDB Atlas NoSQL</span>
            <span>•</span>
            <span>Supabase Storage</span>
          </div>
        </div>
      </footer>

      {/* Modal de Expediente Detallado (GET /:codigo) */}
      {selectedCodigo && (
        <IncidentDetailModal
          codigo={selectedCodigo}
          onClose={() => setSelectedCodigo(null)}
          onIncidentUpdated={loadIncidencias}
        />
      )}

      {/* Modal para Crear Nueva Incidencia */}
      {isNewModalOpen && (
        <NewIncidentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onIncidentCreated={loadIncidencias}
        />
      )}
    </div>
  );
}
