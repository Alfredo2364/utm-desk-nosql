import React, { useState } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertCircle,
  Inbox,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  Building,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import IncidentCard from './IncidentCard';
import { matchFuzzy } from '../utils/searchHelper';

export default function Dashboard({
  incidencias = [],
  estadisticas = {},
  filters,
  onFilterChange,
  loading,
  onSelectIncidencia,
  onSeedData,
  isSeeding,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const incidenciasFiltradas = filters?.search
    ? incidencias.filter((inc) => matchFuzzy(inc, filters.search))
    : incidencias;

  const categories = [
    { id: 'todas', label: 'Todas las Categorías' },
    { id: 'computo_telecomunicaciones', label: 'Cómputo & Redes' },
    { id: 'infraestructura_mantenimiento', label: 'Infraestructura' },
    { id: 'sistemas_servicios_academicos', label: 'Sistemas Académicos' },
  ];

  const states = [
    { id: 'todos', label: 'Todos' },
    { id: 'abierta', label: 'Abiertas' },
    { id: 'en_progreso', label: 'En Progreso' },
    { id: 'pendiente_revision', label: 'Pendientes' },
    { id: 'resuelta', label: 'Resueltas' },
    { id: 'cerrada', label: 'Cerradas' },
  ];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'abierta':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'en_progreso':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pendiente_revision':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'resuelta':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cerrada':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityBadgeClass = (prioridad) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
      case 'alta':
        return 'bg-orange-50 text-orange-700 font-semibold border-orange-200';
      case 'media':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'baja':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Métricas Rápidas del Campus */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Tickets
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {estadisticas.total ?? incidencias.length}
            </div>
          </div>
          <div className="p-2 rounded-md bg-slate-100 text-slate-600">
            <Inbox className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Abiertas
            </div>
            <div className="text-2xl font-black text-blue-900 mt-0.5 font-mono">
              {estadisticas.abiertas ?? incidencias.filter(i => i.estado === 'abierta').length}
            </div>
          </div>
          <div className="p-2 rounded-md bg-blue-50 text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              En Progreso
            </div>
            <div className="text-2xl font-black text-amber-900 mt-0.5 font-mono">
              {estadisticas.en_progreso ?? incidencias.filter(i => i.estado === 'en_progreso').length}
            </div>
          </div>
          <div className="p-2 rounded-md bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Resueltas
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-0.5 font-mono">
              {estadisticas.resueltas ?? incidencias.filter(i => i.estado === 'resuelta').length}
            </div>
          </div>
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-rose-100 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Prioridad Crítica
            </div>
            <div className="text-2xl font-black text-rose-900 mt-0.5 font-mono">
              {estadisticas.criticas ?? incidencias.filter(i => i.prioridad === 'critica').length}
            </div>
          </div>
          <div className="p-2 rounded-md bg-rose-50 text-rose-600">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Control, Búsqueda y Filtros */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Búsqueda por Texto y Código */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (ej. UTM-2026-0001), título, edificio o aula..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
          </div>

          {/* Filtro Prioridad y Conmutador de Vista */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.prioridad}
              onChange={(e) => onFilterChange('prioridad', e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="todas">Prioridad: Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>

            {/* View Switcher */}
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Tabla"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Filtros: Categorías y Estados */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Categorías */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Categoría:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onFilterChange('categoria', cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  filters.categoria === cat.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Estados */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Estado:
            </span>
            {states.map((st) => (
              <button
                key={st.id}
                onClick={() => onFilterChange('estado', st.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filters.estado === st.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bandeja de Trabajo (Resultados) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-lg border border-slate-200 p-4 space-y-2.5 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                <div className="h-4 w-14 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-10 w-full bg-slate-100 rounded"></div>
              <div className="h-6 w-full bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : incidenciasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              No se encontraron incidencias
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
              No hay reportes que coincidan con los filtros aplicados. Puedes limpiar los filtros o sembrar datos de prueba en MongoDB Atlas.
            </p>
          </div>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-600" />
            <span>{isSeeding ? 'Sembrando datos...' : 'Sembrar Datos de Demostración'}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {incidenciasFiltradas.map((incidencia) => (
            <IncidentCard
              key={incidencia._id || incidencia.codigo}
              incidencia={incidencia}
              onSelect={onSelectIncidencia}
            />
          ))}
        </div>
      ) : (
        /* Vista de Tabla Interactiva */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Título de Incidencia</th>
                  <th className="px-4 py-2.5">Categoría</th>
                  <th className="px-4 py-2.5">Ubicación (Edificio / Aula)</th>
                  <th className="px-4 py-2.5">Prioridad</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-center">Evidencias</th>
                  <th className="px-4 py-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidenciasFiltradas.map((inc) => (
                  <tr
                    key={inc._id || inc.codigo}
                    onClick={() => onSelectIncidencia(inc)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {inc.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                      {inc.titulo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {inc.categoria.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{inc.ubicacion?.edificio}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inc.ubicacion?.aula_laboratorio}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getPriorityBadgeClass(inc.prioridad)}`}>
                        {inc.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${getStatusBadgeClass(inc.estado)}`}>
                        {inc.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        {inc.evidencias_adjuntas?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-slate-900 hover:text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                        Ver Expediente
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
