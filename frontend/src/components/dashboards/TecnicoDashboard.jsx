import React, { useState } from 'react';
import {
  Wrench,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Paperclip,
  ArrowRight,
  Filter,
  Check,
  Send,
  Loader2,
  Search,
  Building,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patchEstado } from '../../services/api';

export default function TecnicoDashboard({
  incidencias = [],
  loading,
  onSelectIncidencia,
  onRefresh,
}) {
  const { currentUser } = useAuth();
  const [tabAsignacion, setTabAsignacion] = useState('todas_area'); // 'todas_area' | 'mis_asignadas'
  const [updatingCode, setUpdatingCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todas');

  const misAsignadasCount = incidencias.filter(
    (inc) => inc.tecnico_asignado?.email?.toLowerCase() === currentUser.email?.toLowerCase()
  ).length;

  const filtradas = incidencias.filter((inc) => {
    if (tabAsignacion === 'mis_asignadas') {
      if (inc.tecnico_asignado?.email?.toLowerCase() !== currentUser.email?.toLowerCase()) {
        return false;
      }
    }
    if (priorityFilter !== 'todas' && inc.prioridad !== priorityFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchCod = inc.codigo?.toLowerCase().includes(q);
      const matchTit = inc.titulo?.toLowerCase().includes(q);
      const matchUbi = inc.ubicacion?.edificio?.toLowerCase().includes(q) || inc.ubicacion?.aula_laboratorio?.toLowerCase().includes(q);
      if (!matchCod && !matchTit && !matchUbi) return false;
    }
    return true;
  });

  const handleQuickStatusChange = async (codigo, nuevoEstado, e) => {
    e.stopPropagation();
    setUpdatingCode(codigo);
    try {
      await patchEstado(codigo, nuevoEstado, `Cambio rápido desde la consola técnica por ${currentUser.nombre}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingCode(null);
    }
  };

  const getAreaName = (area) => {
    switch (area) {
      case 'computo_telecomunicaciones':
        return 'Cómputo, Redes y Telecomunicaciones';
      case 'infraestructura_mantenimiento':
        return 'Infraestructura y Mantenimiento de Inmuebles';
      case 'sistemas_servicios_academicos':
        return 'Sistemas y Servicios Académicos (SICE/Moodle)';
      default:
        return 'Soporte General Campus';
    }
  };

  const getPriorityBadge = (prioridad) => {
    const config = {
      critica: 'bg-rose-50 text-rose-700 border-rose-200',
      alta: 'bg-orange-50 text-orange-700 border-orange-200',
      media: 'bg-amber-50 text-amber-700 border-amber-200',
      baja: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config[prioridad] || 'bg-slate-100 text-slate-700'}`}>
        {prioridad}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Consola Técnica */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Consola Técnica Operativa
            </h1>
            <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase">
              AGENTE ACTIVO
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Técnico: <strong className="text-slate-800">{currentUser.nombre}</strong></span>
            <span>•</span>
            <span>Especialidad: <strong className="text-slate-800">{getAreaName(currentUser.area)}</strong></span>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center space-x-2 text-xs shrink-0">
          <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mis Asignadas:</span>
            <span className="font-mono font-black text-slate-900">{misAsignadasCount}</span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total en Área:</span>
            <span className="font-mono font-black text-slate-900">{incidencias.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar con Pestañas de Cola y Filtros */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Segmented Queue Tab Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setTabAsignacion('todas_area')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tabAsignacion === 'todas_area'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cola del Área ({incidencias.length})
          </button>
          <button
            onClick={() => setTabAsignacion('mis_asignadas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tabAsignacion === 'mis_asignadas'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mis Asignadas ({misAsignadasCount})
          </button>
        </div>

        {/* Search & Priority */}
        <div className="flex items-center space-x-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar código, aula o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium bg-white"
          >
            <option value="todas">Prioridad: Todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Grid de Tickets Operativos */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Cargando tickets de la cola técnica...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <div className="text-slate-900 font-bold text-sm">
            {tabAsignacion === 'mis_asignadas'
              ? 'No tienes incidencias asignadas en este momento'
              : 'Cola despejada sin incidencias pendientes en tu área'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tabAsignacion === 'mis_asignadas'
              ? 'Cambia a la pestaña "Cola del Área" para reclamar un ticket pendiente.'
              : 'Todas las solicitudes han sido resueltas o asignadas exitosamente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtradas.map((inc) => {
            const estaAsignadaAMi =
              inc.tecnico_asignado?.email?.toLowerCase() === currentUser.email?.toLowerCase();
            const sinAsignar = !inc.tecnico_asignado?.email;

            return (
              <div
                key={inc._id || inc.codigo}
                onClick={() => onSelectIncidencia(inc)}
                className={`bg-white rounded-lg border p-4 shadow-xs hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between ${
                  estaAsignadaAMi ? 'border-slate-300 ring-1 ring-slate-900/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                        {inc.codigo}
                      </span>
                      {getPriorityBadge(inc.prioridad)}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(inc.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 leading-snug">
                    {inc.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {inc.descripcion}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 text-[11px] text-slate-600 mb-3 space-y-1 font-mono">
                    <div className="truncate">
                      📍 <span className="text-slate-900 font-semibold">{inc.ubicacion?.edificio}</span> • {inc.ubicacion?.aula_laboratorio}
                    </div>
                    <div className="truncate">
                      👤 Solicitante: {inc.reportante?.nombre} ({inc.reportante?.rol})
                    </div>
                    <div className="truncate">
                      🛠️ Responsable: {inc.tecnico_asignado?.nombre ? (
                        <span className={estaAsignadaAMi ? 'text-emerald-700 font-bold' : 'text-slate-800 font-semibold'}>
                          {inc.tecnico_asignado.nombre} {estaAsignadaAMi && '(Asignado a ti)'}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">⚠️ Sin Asignar (Disponible)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de Tarjeta Técnica */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Estado:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {inc.estado?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {estaAsignadaAMi && inc.estado !== 'en_proceso' && inc.estado !== 'en_progreso' && inc.estado !== 'resuelta' && inc.estado !== 'cerrada' && (
                      <button
                        onClick={(e) => handleQuickStatusChange(inc.codigo, 'en_proceso', e)}
                        disabled={updatingCode === inc.codigo}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] transition-colors cursor-pointer"
                      >
                        {updatingCode === inc.codigo ? 'Actualizando...' : 'Iniciar Atención'}
                      </button>
                    )}

                    {estaAsignadaAMi && inc.estado !== 'resuelta' && inc.estado !== 'cerrada' && (
                      <button
                        onClick={(e) => handleQuickStatusChange(inc.codigo, 'resuelta', e)}
                        disabled={updatingCode === inc.codigo}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{updatingCode === inc.codigo ? 'Cerrando...' : 'Marcar Resuelta'}</span>
                      </button>
                    )}

                    <span className="text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center pl-1">
                      Expediente <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
