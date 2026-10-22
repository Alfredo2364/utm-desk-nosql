import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncidentDetailModal from './components/IncidentDetailModal';
import NewIncidentModal from './components/NewIncidentModal';
import { getIncidencias, seedDemoData, checkHealth } from './services/api';

export default function App() {
  const [incidencias, setIncidencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [health, setHealth] = useState(null);

  const [filters, setFilters] = useState({
    categoria: 'todas',
    estado: 'todos',
    prioridad: 'todas',
    search: '',
  });

  // Cargar incidencias desde la API
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
  }, [filters]);

  useEffect(() => {
    loadIncidencias();
  }, [loadIncidencias]);

  // Verificar estado del backend al montar
  useEffect(() => {
    checkHealth().then((h) => setHealth(h));
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadIncidencias();
    } catch (err) {
      alert(`Error al sembrar datos: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Barra de Navegación */}
      <Navbar
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        onRefresh={loadIncidencias}
        health={health}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">UTM Desk NoSQL Cloud</span>
            <span>•</span>
            <span>Sistema Integral de Gestión de Campus</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Mongoose ODM Polymorphic Schema</span>
            <span>•</span>
            <span>Supabase Storage Bucket</span>
            <span>•</span>
            <span>React + Tailwind CSS</span>
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
