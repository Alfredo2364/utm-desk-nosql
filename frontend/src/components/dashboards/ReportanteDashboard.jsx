import React, { useState } from 'react';
import {
  Plus,
  Inbox,
  Clock,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Paperclip,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchFuzzy } from '../../utils/searchHelper';

export default function ReportanteDashboard({
  incidencias = [],
  loading,
  onSelectIncidencia,
  onOpenNewModal,
}) {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  const abiertas = incidencias.filter((i) => i.estado === 'abierta').length;
  const enProgreso = incidencias.filter((i) => i.estado === 'en_progreso').length;
  const resueltas = incidencias.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada').length;

  const filtradas = incidencias.filter((inc) => {
    if (estadoFilter !== 'todos' && inc.estado !== estadoFilter) return false;
    if (searchTerm && !matchFuzzy(inc, searchTerm)) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (estado) => {
    const config = {
      abierta: 'bg-blue-50 text-blue-700 border-blue-200',
      en_progreso: 'bg-amber-50 text-amber-700 border-amber-200',
      pendiente_revision: 'bg-purple-50 text-purple-700 border-purple-200',
      resuelta: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cerrada: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
          config[estado] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {estado?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header Enterprise */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Portal de Autoservicio • Solicitudes del Usuario
            </h1>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold uppercase">
              {currentUser.rol}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Seguimiento de tickets reportados por <span className="font-medium text-slate-800">{currentUser.nombre}</span> ({currentUser.email})
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Solicitud</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Total Solicitudes
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{incidencias.length}</div>
          </div>
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md">
            <Inbox className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">
              Por Atender
            </span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{abiertas}</div>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-amber-600 font-bold uppercase tracking-wider text-[10px]">
              En Atención Técnica
            </span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{enProgreso}</div>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-md">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">
              Resueltas / Cerradas
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{resueltas}</div>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de folio, título o aula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Estado:
          </span>
          {['todos', 'abierta', 'en_progreso', 'resuelta'].map((st) => (
            <button
              key={st}
              onClick={() => setEstadoFilter(st)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors capitalize whitespace-nowrap cursor-pointer ${
                estadoFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'todos' ? 'Todos' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Cargando expedientes desde MongoDB Atlas...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 bg-white p-6 space-y-2.5">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-slate-800 font-bold text-sm">No se encontraron tickets</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No tienes solicitudes activas que coincidan con el criterio seleccionado.
            </p>
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Solicitud</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Asunto de Incidencia</th>
                  <th className="px-4 py-2.5">Categoría</th>
                  <th className="px-4 py-2.5">Ubicación</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-center">Adjuntos</th>
                  <th className="px-4 py-2.5 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((inc) => (
                  <tr
                    key={inc._id || inc.codigo}
                    onClick={() => onSelectIncidencia(inc)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {inc.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs sm:max-w-md">
                        {inc.titulo}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs sm:max-w-md">
                        {inc.descripcion}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 font-medium">
                      {inc.categoria?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{inc.ubicacion?.edificio}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inc.ubicacion?.aula_laboratorio}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {new Date(inc.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(inc.estado)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        {inc.evidencias_adjuntas?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-slate-900 hover:text-emerald-700 font-semibold text-xs inline-flex items-center gap-0.5">
                        Ver <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
