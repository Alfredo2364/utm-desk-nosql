import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  UserCheck,
  Search,
  BarChart3,
  Users,
  Eye,
  Plus,
  Terminal,
  MapPin,
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import DirectivoDashboard from './DirectivoDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import TecnicoDashboard from './TecnicoDashboard';
import ReportanteDashboard from './ReportanteDashboard';
import AssignTechnicianModal from '../AssignTechnicianModal';
import { patchEstado } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboard({
  incidencias = [],
  estadisticas = {},
  loading,
  onSelectIncidencia,
  onRefresh,
  onOpenNewModal,
  onSeedData,
  isSeeding,
}) {
  const { currentUser, usuariosDemo } = useAuth();
  const [superTab, setSuperTab] = useState('global'); // 'global' | 'admin_catalogos' | 'analitica' | 'simulador_roles'
  const [simulatedRoleView, setSimulatedRoleView] = useState('reportante');
  const [selectedIncidenciaAsignar, setSelectedIncidenciaAsignar] = useState(null);
  const [updatingCode, setUpdatingCode] = useState(null);
  const [filtroArea, setFiltroArea] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const handleInstantStatus = async (codigo, nuevoEstado, e) => {
    e.stopPropagation();
    setUpdatingCode(codigo);
    try {
      await patchEstado(
        codigo,
        nuevoEstado,
        `Ejecución directa Super Admin (${currentUser?.email}) -> ${nuevoEstado}`
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    } finally {
      setUpdatingCode(null);
    }
  };

  const filtradas = incidencias.filter((inc) => {
    if (filtroArea !== 'todas' && inc.categoria !== filtroArea) return false;
    if (filtroEstado !== 'todos') {
      if (filtroEstado === 'en_proceso' || filtroEstado === 'en_progreso') {
        if (inc.estado !== 'en_proceso' && inc.estado !== 'en_progreso') return false;
      } else if (inc.estado !== filtroEstado) {
        return false;
      }
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const mCod = inc.codigo?.toLowerCase().includes(q);
      const mTit = inc.titulo?.toLowerCase().includes(q);
      const mUbi =
        inc.ubicacion?.edificio?.toLowerCase().includes(q) ||
        inc.ubicacion?.aula?.toLowerCase().includes(q) ||
        inc.ubicacion?.aula_laboratorio?.toLowerCase().includes(q);
      if (!mCod && !mTit && !mUbi) return false;
    }
    return true;
  });

  const formatCategoria = (cat) => {
    const map = {
      computo_telecomunicaciones: 'Cómputo y Redes',
      infraestructura_mantenimiento: 'Infraestructura',
      sistemas_servicios_academicos: 'Sistemas Académicos',
    };
    return map[cat] || cat?.replace(/_/g, ' ') || 'General';
  };

  const extractEdificioClave = (ubi) => {
    if (!ubi) return 'ED-A';
    if (ubi.edificioId && ubi.edificioId.length <= 8) return ubi.edificioId;
    const match = String(ubi.edificio || '').match(/ED-[A-Z0-9]+/i);
    if (match) return match[0].toUpperCase();
    return String(ubi.edificio || 'Campus').split('-')[0].trim();
  };

  const totalAbiertas = incidencias.filter((i) => i.estado === 'abierta').length;
  const totalEnProceso = incidencias.filter(
    (i) => i.estado === 'en_proceso' || i.estado === 'en_progreso' || i.estado === 'asignada'
  ).length;
  const totalResueltas = incidencias.filter(
    (i) => i.estado === 'resuelta' || i.estado === 'cerrada'
  ).length;
  const totalSinAsignar = incidencias.filter(
    (i) => !i.tecnico_asignado?.nombre && i.estado !== 'resuelta' && i.estado !== 'cerrada'
  ).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Banner Maestro Super Admin */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                SUPER ADMIN ROOT
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Centro de Comando y Ejecución Global • UTM Desk NoSQL Cloud
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Control general de módulos, expedientes, asignación de técnicos, estados operativos, analítica y catálogos institucionales.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-amber-300">
              <span>
                Sesión activa: <strong>{currentUser?.email}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400">Alcance: Control General del Sistema</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenNewModal && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Registrar Incidencia</span>
              </button>
            )}
            {onSeedData && (
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isSeeding ? 'Restaurando...' : 'Restaurar Datos Base'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Navegación del Super Admin (Ensanchadas en Grid uniforme) */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => setSuperTab('global')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              superTab === 'global'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/70'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>1. Ejecución Operativa ({incidencias.length})</span>
          </button>

          <button
            onClick={() => setSuperTab('admin_catalogos')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              superTab === 'admin_catalogos'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/70'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>2. CRUD Usuarios y Edificios</span>
          </button>

          <button
            onClick={() => setSuperTab('analitica')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              superTab === 'analitica'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/70'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>3. Analítica y Reportes</span>
          </button>

          <button
            onClick={() => setSuperTab('simulador_roles')}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              superTab === 'simulador_roles'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/70'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>4. Visor de Interfaces por Rol</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EJECUCIÓN OPERATIVA TOTAL */}
      {superTab === 'global' && (
        <div className="space-y-4">
          {/* Tarjetas de Resumen Rápido */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Expedientes
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{incidencias.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Abiertas / En Proceso
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {totalAbiertas + totalEnProceso}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Resueltas / Cerradas
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{totalResueltas}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Pendientes de Asignar
              </span>
              <div className="text-2xl font-black text-rose-900 mt-1">{totalSinAsignar}</div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros Ensanchada */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código de folio (INC-2026-0001), título, edificio o aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700 min-w-[200px] cursor-pointer"
              >
                <option value="todas">Todas las Áreas Técnicas</option>
                <option value="computo_telecomunicaciones">Cómputo y Telecomunicaciones</option>
                <option value="infraestructura_mantenimiento">Infraestructura y Mantenimiento</option>
                <option value="sistemas_servicios_academicos">Sistemas y Servicios Académicos</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700 min-w-[175px] cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="abierta">Abierta</option>
                <option value="asignada">Asignada</option>
                <option value="en_proceso">En Proceso</option>
                <option value="resuelta">Resuelta</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>
          </div>

          {/* Tabla de Ejecución Directa Super Admin */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Control Directo de Expedientes ({filtradas.length} registros)
              </h3>
              <span className="text-xs text-slate-500">
                Haz clic en cualquier fila o en "Ver Expediente" para abrir bitácora y evidencias
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Folio</th>
                    <th className="px-4 py-3">Incidencia</th>
                    <th className="px-4 py-3 whitespace-nowrap">Área</th>
                    <th className="px-4 py-3">Ubicación</th>
                    <th className="px-4 py-3 whitespace-nowrap">Técnico Asignado</th>
                    <th className="px-4 py-3 whitespace-nowrap">Estado Directo</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.map((inc) => (
                    <tr
                      key={inc._id || inc.codigo}
                      onClick={() => onSelectIncidencia(inc)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                    >
                      {/* Folio */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {inc.codigo}
                        </span>
                      </td>

                      {/* Incidencia */}
                      <td className="px-4 py-3.5 min-w-[220px] max-w-[300px]">
                        <div className="font-bold text-slate-900 truncate" title={inc.titulo}>
                          {inc.titulo}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {inc.descripcion}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                          {formatCategoria(inc.categoria)}
                        </span>
                      </td>

                      {/* Ubicación compacta y limpia */}
                      <td className="px-4 py-3.5 min-w-[180px] max-w-[230px]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold shrink-0">
                            {extractEdificioClave(inc.ubicacion)}
                          </span>
                          <span
                            className="font-medium text-slate-800 truncate text-xs"
                            title={inc.ubicacion?.aula || inc.ubicacion?.aula_laboratorio}
                          >
                            {inc.ubicacion?.aula || inc.ubicacion?.aula_laboratorio}
                          </span>
                        </div>
                      </td>

                      {/* Técnico Asignado */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {inc.tecnico_asignado?.nombre ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{inc.tecnico_asignado.nombre}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs font-bold">
                            Sin Asignar
                          </span>
                        )}
                      </td>

                      {/* Cambiar Estado Directo */}
                      <td className="px-4 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={inc.estado === 'en_progreso' ? 'en_proceso' : inc.estado}
                          disabled={updatingCode === inc.codigo}
                          onChange={(e) => handleInstantStatus(inc.codigo, e.target.value, e)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:border-amber-500 min-w-[130px] cursor-pointer"
                        >
                          <option value="abierta">abierta</option>
                          <option value="asignada">asignada</option>
                          <option value="en_proceso">en_proceso</option>
                          <option value="resuelta">resuelta</option>
                          <option value="cerrada">cerrada</option>
                        </select>
                      </td>

                      {/* Acciones Root (Botones ensanchados en una sola fila) */}
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedIncidenciaAsignar(inc)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Turnar Técnico
                          </button>
                          <button
                            onClick={() => onSelectIncidencia(inc)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Ver Expediente
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRUD DE USUARIOS Y EDIFICIOS */}
      {superTab === 'admin_catalogos' && (
        <AdminDashboard
          incidencias={incidencias}
          estadisticas={estadisticas}
          loading={loading}
          onSelectIncidencia={onSelectIncidencia}
          onRefresh={onRefresh}
          onOpenNewModal={onOpenNewModal}
          defaultTab="usuarios"
        />
      )}

      {/* TAB 3: ANALÍTICA Y REPORTES */}
      {superTab === 'analitica' && <DirectivoDashboard />}

      {/* TAB 4: SIMULADOR / VISOR DE LAS 5 INTERFACES POR ROL */}
      {superTab === 'simulador_roles' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Inspector de Interfaces por Perfil de Usuario (Tabla 3 del ERS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Previsualiza y opera la interfaz específica diseñada para cada uno de los 5 perfiles del sistema:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'reportante', label: '1. Reportante' },
                { id: 'tecnico', label: '2. Técnico' },
                { id: 'supervisor', label: '3. Supervisor' },
                { id: 'directivo', label: '4. Directivo' },
                { id: 'admin', label: '5. Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSimulatedRoleView(r.id)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    simulatedRoleView === r.id
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {simulatedRoleView === 'reportante' && (
            <ReportanteDashboard
              incidencias={incidencias}
              loading={loading}
              onSelectIncidencia={onSelectIncidencia}
              onOpenNewModal={onOpenNewModal}
            />
          )}
          {simulatedRoleView === 'tecnico' && (
            <TecnicoDashboard
              incidencias={incidencias}
              loading={loading}
              onSelectIncidencia={onSelectIncidencia}
              onRefresh={onRefresh}
            />
          )}
          {simulatedRoleView === 'supervisor' && (
            <SupervisorDashboard
              incidencias={incidencias}
              estadisticas={estadisticas}
              loading={loading}
              onSelectIncidencia={onSelectIncidencia}
              onRefresh={onRefresh}
              onOpenNewModal={onOpenNewModal}
              onNavigateToAnalitica={() => setSuperTab('analitica')}
            />
          )}
          {simulatedRoleView === 'directivo' && <DirectivoDashboard />}
          {simulatedRoleView === 'admin' && (
            <AdminDashboard
              incidencias={incidencias}
              estadisticas={estadisticas}
              loading={loading}
              onSelectIncidencia={onSelectIncidencia}
              onRefresh={onRefresh}
              onOpenNewModal={onOpenNewModal}
            />
          )}
        </div>
      )}

      {selectedIncidenciaAsignar && (
        <AssignTechnicianModal
          isOpen={true}
          incidencia={selectedIncidenciaAsignar}
          usuariosDemo={usuariosDemo}
          onClose={() => setSelectedIncidenciaAsignar(null)}
          onAssigned={() => {
            setSelectedIncidenciaAsignar(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
