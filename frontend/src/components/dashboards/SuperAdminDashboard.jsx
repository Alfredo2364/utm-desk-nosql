import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  UserCheck,
  Search,
  BarChart3,
  Users,
  Building2,
  Eye,
  Plus,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  Layers,
  Terminal,
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
  const [superTab, setSuperTab] = useState('global'); // 'global' | 'admin_catalogos' | 'analitica' | 'simulador_roles' | 'matriz_credenciales'
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

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Banner Maestro Super Admin */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 sm:p-5 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" />
                SUPER ADMIN ROOT
              </span>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Centro de Comando y Ejecución Global • UTM Desk NoSQL Cloud
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Acceso irrestricto a todos los módulos, endpoints REST, estados operativos, revisiones, evidencias Supabase HD, analítica y catálogos.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-amber-300">
              <span>Sesión activa: <strong>{currentUser?.email}</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Alcance: Control General del Sistema</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenNewModal && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Incidencia</span>
              </button>
            )}
            {onSeedData && (
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSeeding ? 'Restaurando...' : 'Restaurar Semilla Atlas'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Navegación del Super Admin */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSuperTab('global')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              superTab === 'global'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. Ejecución Operativa Total ({incidencias.length})</span>
          </button>

          <button
            onClick={() => setSuperTab('admin_catalogos')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              superTab === 'admin_catalogos'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. CRUD Usuarios y Edificios</span>
          </button>

          <button
            onClick={() => setSuperTab('analitica')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              superTab === 'analitica'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>3. Analítica y Reportes (RF-07 / RF-08)</span>
          </button>

          <button
            onClick={() => setSuperTab('simulador_roles')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              superTab === 'simulador_roles'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>4. Visor de Interfaces por Rol</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EJECUCIÓN OPERATIVA TOTAL */}
      {superTab === 'global' && (
        <div className="space-y-4">
          {/* Filtros Rápidos */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar folio (INC-2026-0001), título o aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium bg-white"
              >
                <option value="todas">Todas las Áreas</option>
                <option value="computo_telecomunicaciones">Cómputo y Telecomunicaciones</option>
                <option value="infraestructura_mantenimiento">Infraestructura y Mantenimiento</option>
                <option value="sistemas_servicios_academicos">Sistemas y Servicios Académicos</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium bg-white"
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
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Control Directo de Expedientes (`incidencias_campus`) — {filtradas.length} registros
              </h3>
              <span className="text-[11px] text-slate-500">
                Haz clic en cualquier fila para abrir el expediente, agregar revisiones o subir evidencias a Supabase
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-3 py-2.5">Código</th>
                    <th className="px-3 py-2.5">Incidencia</th>
                    <th className="px-3 py-2.5">Categoría</th>
                    <th className="px-3 py-2.5">Ubicación (`edificioId` / `aula`)</th>
                    <th className="px-3 py-2.5">Técnico Asignado</th>
                    <th className="px-3 py-2.5">Cambiar Estado Directo (RF-04)</th>
                    <th className="px-3 py-2.5 text-right">Acciones Root</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.map((inc) => (
                    <tr
                      key={inc._id || inc.codigo}
                      onClick={() => onSelectIncidencia(inc)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3 font-mono font-bold text-slate-900">
                        {inc.codigo}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800 max-w-xs truncate">
                        {inc.titulo}
                      </td>
                      <td className="px-3 py-3 capitalize text-slate-600">
                        {inc.categoria?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-700">
                        <span className="font-bold">{inc.ubicacion?.edificioId || inc.ubicacion?.edificio}</span>
                        {' • '}
                        <span>{inc.ubicacion?.aula || inc.ubicacion?.aula_laboratorio}</span>
                      </td>
                      <td className="px-3 py-3">
                        {inc.tecnico_asignado?.nombre ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <UserCheck className="w-3.5 h-3.5" />
                            {inc.tecnico_asignado.nombre}
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-bold">
                            Sin Asignar
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={inc.estado === 'en_progreso' ? 'en_proceso' : inc.estado}
                          disabled={updatingCode === inc.codigo}
                          onChange={(e) => handleInstantStatus(inc.codigo, e.target.value, e)}
                          className="px-2 py-1 rounded border border-slate-300 bg-white font-mono font-bold text-[11px] text-slate-900 focus:border-amber-500 cursor-pointer"
                        >
                          <option value="abierta">abierta</option>
                          <option value="asignada">asignada</option>
                          <option value="en_proceso">en_proceso</option>
                          <option value="resuelta">resuelta</option>
                          <option value="cerrada">cerrada</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedIncidenciaAsignar(inc)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Turnar Técnico
                        </button>
                        <button
                          onClick={() => onSelectIncidencia(inc)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded text-[11px] font-bold cursor-pointer"
                        >
                          Expediente
                        </button>
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
          defaultTab="usuarios"
        />
      )}

      {/* TAB 3: ANALÍTICA Y REPORTES */}
      {superTab === 'analitica' && <DirectivoDashboard />}

      {/* TAB 4: SIMULADOR / VISOR DE LAS 5 INTERFACES POR ROL */}
      {superTab === 'simulador_roles' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Inspector de Interfaces por Perfil de Usuario (Tabla 3 del ERS)
              </h3>
              <p className="text-xs text-slate-500">
                Previsualiza y opera la interfaz específica diseñada para cada uno de los 5 perfiles del sistema sin salir de tu cuenta Super Admin:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
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
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    simulatedRoleView === r.id
                      ? 'bg-slate-900 text-amber-400'
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
            />
          )}
        </div>
      )}

      {selectedIncidenciaAsignar && (
        <AssignTechnicianModal
          incidencia={selectedIncidenciaAsignar}
          tecnicos={usuariosDemo.filter((u) => u.rol === 'tecnico')}
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
