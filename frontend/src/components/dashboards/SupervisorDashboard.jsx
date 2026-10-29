import React, { useState } from 'react';
import {
  Users,
  BarChart3,
  UserCheck,
  Filter,
  Search,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AssignTechnicianModal from '../AssignTechnicianModal';

export default function SupervisorDashboard({
  incidencias = [],
  estadisticas = {},
  loading,
  onSelectIncidencia,
  onRefresh,
  onNavigateToAnalitica,
  onOpenNewModal,
}) {
  const { currentUser, usuariosDemo } = useAuth();
  const [selectedIncidenciaParaAsignar, setSelectedIncidenciaParaAsignar] = useState(null);
  const [filtroArea, setFiltroArea] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado local para supervisión
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
      const matchCodigo = inc.codigo?.toLowerCase().includes(q);
      const matchTitulo = inc.titulo?.toLowerCase().includes(q);
      const matchTecnico = inc.tecnico_asignado?.nombre?.toLowerCase().includes(q);
      const matchUbicacion =
        inc.ubicacion?.edificio?.toLowerCase().includes(q) ||
        inc.ubicacion?.aula_laboratorio?.toLowerCase().includes(q);
      if (!matchCodigo && !matchTitulo && !matchTecnico && !matchUbicacion) return false;
    }
    return true;
  });

  const sinAsignarCount = incidencias.filter(
    (i) => !i.tecnico_asignado?.email && i.estado !== 'resuelta' && i.estado !== 'cerrada'
  ).length;

  const getPriorityBadge = (prioridad) => {
    const config = {
      critica: 'bg-rose-50 text-rose-700 border-rose-200',
      alta: 'bg-orange-50 text-orange-700 border-orange-200',
      media: 'bg-amber-50 text-amber-700 border-amber-200',
      baja: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
          config[prioridad] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {prioridad}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Supervisor Enterprise */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Centro de Supervisión y Seguimiento de Tickets
            </h1>
            <span className="font-mono text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold uppercase border border-blue-200">
              ROL: SUPERVISOR (TABLA 3 Y 4)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registra incidencias, consulta todos los tickets, asigna técnicos y supervisa analítica. (Solo gestión: no altera estados, revisiones ni evidencias).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenNewModal && (
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <span>+ Registrar Incidencia</span>
            </button>
          )}
          {onNavigateToAnalitica && (
            <button
              onClick={onNavigateToAnalitica}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analítica y Reportes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon Dispatcher */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total General</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{incidencias.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-blue-100 shadow-xs">
          <span className="text-blue-600 font-bold uppercase text-[10px] tracking-wider">Abiertas</span>
          <div className="text-2xl font-black text-blue-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'abierta').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-amber-100 shadow-xs">
          <span className="text-amber-600 font-bold uppercase text-[10px] tracking-wider">En Progreso</span>
          <div className="text-2xl font-black text-amber-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'en_progreso').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-xs">
          <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider">Resueltas</span>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-rose-100 shadow-xs">
          <span className="text-rose-600 font-bold uppercase text-[10px] tracking-wider">Sin Asignar Activas</span>
          <div className="text-2xl font-black text-rose-900 mt-0.5">
            {sinAsignarCount}
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de folio, técnico, edificio o aula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white min-w-[190px] cursor-pointer"
          >
            <option value="todas">Todas las Áreas</option>
            <option value="computo_telecomunicaciones">Cómputo & Redes</option>
            <option value="infraestructura_mantenimiento">Infraestructura</option>
            <option value="sistemas_servicios_academicos">Sistemas Académicos</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white min-w-[170px] cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="abierta">Abiertas</option>
            <option value="en_progreso">En Progreso</option>
            <option value="pendiente_revision">Pendientes</option>
            <option value="resuelta">Resueltas</option>
          </select>
        </div>
      </div>

      {/* Dispatcher Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Matriz de Seguimiento y Despacho Operativo ({filtradas.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Click en "Asignar" para delegar o rebalancear técnicos
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-2.5">Código</th>
                <th className="px-4 py-2.5">Incidencia</th>
                <th className="px-4 py-2.5">Área</th>
                <th className="px-4 py-2.5">Ubicación</th>
                <th className="px-4 py-2.5">Prioridad</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Técnico Asignado</th>
                <th className="px-4 py-2.5 text-right">Despacho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((inc) => (
                <tr
                  key={inc._id || inc.codigo}
                  onClick={() => onSelectIncidencia(inc)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {inc.codigo}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                    {inc.titulo}
                  </td>
                  <td className="px-4 py-3.5 capitalize text-slate-600 whitespace-nowrap">
                    {inc.categoria?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-[220px]">
                    <div className="font-semibold text-slate-800 truncate">{inc.ubicacion?.edificio}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{inc.ubicacion?.aula_laboratorio}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getPriorityBadge(inc.prioridad)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
                      {inc.estado?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {inc.tecnico_asignado?.nombre ? (
                      <div className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{inc.tecnico_asignado.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-[10px] whitespace-nowrap">
                        ⚠️ Sin Asignar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncidenciaParaAsignar(inc);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {inc.tecnico_asignado?.nombre ? 'Reasignar' : 'Asignar Técnico'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Asignación / Reasignación */}
      {selectedIncidenciaParaAsignar && (
        <AssignTechnicianModal
          isOpen={true}
          onClose={() => setSelectedIncidenciaParaAsignar(null)}
          incidencia={selectedIncidenciaParaAsignar}
          usuariosDemo={usuariosDemo}
          onAssigned={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
