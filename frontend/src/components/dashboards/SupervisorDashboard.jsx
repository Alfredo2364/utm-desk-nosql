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
}) {
  const { currentUser, usuariosDemo } = useAuth();
  const [selectedIncidenciaParaAsignar, setSelectedIncidenciaParaAsignar] = useState(null);
  const [filtroArea, setFiltroArea] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado local para supervisión
  const filtradas = incidencias.filter((inc) => {
    if (filtroArea !== 'todas' && inc.categoria !== filtroArea) return false;
    if (filtroEstado !== 'todos' && inc.estado !== filtroEstado) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchCodigo = inc.codigo?.toLowerCase().includes(q);
      const matchTitulo = inc.titulo?.toLowerCase().includes(q);
      const matchTecnico = inc.tecnico_asignado?.nombre?.toLowerCase().includes(q);
      const matchUbicacion = inc.ubicacion?.edificio?.toLowerCase().includes(q);
      if (!matchCodigo && !matchTitulo && !matchTecnico && !matchUbicacion) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Supervisor con Enlace a Analítica */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>Perfil: Supervisor General de Campus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Panel de Supervisión Operativa
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
            Monitoreo en tiempo real de todas las incidencias de los tres departamentos técnicos del campus y balanceo de cargas de trabajo.
          </p>
        </div>

        <button
          onClick={onNavigateToAnalitica}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Ver Módulo de Analítica Directiva</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Total General</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{incidencias.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <span className="text-blue-600 font-bold uppercase text-[10px]">Abiertas</span>
          <div className="text-2xl font-black text-blue-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'abierta').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
          <span className="text-amber-600 font-bold uppercase text-[10px]">En Progreso</span>
          <div className="text-2xl font-black text-amber-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'en_progreso').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-emerald-600 font-bold uppercase text-[10px]">Resueltas</span>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">
            {incidencias.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
          <span className="text-rose-600 font-bold uppercase text-[10px]">Críticas Activas</span>
          <div className="text-2xl font-black text-rose-900 mt-0.5">
            {incidencias.filter((i) => i.prioridad === 'critica' && i.estado !== 'resuelta').length}
          </div>
        </div>
      </div>

      {/* Filtros de Supervisión */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, técnico o aula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
          >
            <option value="todas">Todas las Áreas</option>
            <option value="computo_telecomunicaciones">Cómputo & Redes</option>
            <option value="infraestructura_mantenimiento">Infraestructura</option>
            <option value="sistemas_servicios_academicos">Sistemas Académicos</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
          >
            <option value="todos">Todos los Estados</option>
            <option value="abierta">Abiertas</option>
            <option value="en_progreso">En Progreso</option>
            <option value="pendiente_revision">Pendientes</option>
            <option value="resuelta">Resueltas</option>
          </select>
        </div>
      </div>

      {/* Tabla Panorámica con Botón de Asignación */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Gestión de Asignación y Seguimiento Operativo ({filtradas.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Haz clic en "Asignar" para delegar o reasignar técnicos
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Incidencia</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Técnico Asignado</th>
                <th className="px-4 py-3 text-right">Reasignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((inc) => (
                <tr
                  key={inc._id || inc.codigo}
                  onClick={() => onSelectIncidencia(inc)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {inc.codigo}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                    {inc.titulo}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {inc.categoria?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{inc.ubicacion?.edificio}</div>
                    <div className="text-[11px] text-slate-400">{inc.ubicacion?.aula_laboratorio}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {inc.estado?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inc.tecnico_asignado?.nombre ? (
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{inc.tecnico_asignado.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⚠️ Sin Asignar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncidenciaParaAsignar(inc);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
                    >
                      {inc.tecnico_asignado?.nombre ? 'Reasignar' : 'Asignar'}
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
