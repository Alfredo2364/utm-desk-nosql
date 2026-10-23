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

  // Filtrar según pestaña
  const filtradas = incidencias.filter((inc) => {
    if (tabAsignacion === 'mis_asignadas') {
      return inc.tecnico_asignado?.email?.toLowerCase() === currentUser.email?.toLowerCase();
    }
    return true; // Ya vienen filtradas por área desde el backend
  });

  const misAsignadasCount = incidencias.filter(
    (inc) => inc.tecnico_asignado?.email?.toLowerCase() === currentUser.email?.toLowerCase()
  ).length;

  const handleQuickStatusChange = async (codigo, nuevoEstado, e) => {
    e.stopPropagation();
    setUpdatingCode(codigo);
    try {
      await patchEstado(codigo, nuevoEstado, `Cambio rápido desde la bandeja técnica por ${currentUser.nombre}`);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Técnico */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Perfil: Técnico Especialista</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Bandeja Técnica: {currentUser.nombre}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Área de atención: <span className="text-emerald-400 font-bold">{getAreaName(currentUser.area)}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Mis Asignadas</span>
            <span className="text-lg font-black text-emerald-400">{misAsignadasCount}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total en Área</span>
            <span className="text-lg font-black text-white">{incidencias.length}</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas: Mis Asignadas vs Área General */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setTabAsignacion('todas_area')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              tabAsignacion === 'todas_area'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas en mi Área ({incidencias.length})
          </button>
          <button
            onClick={() => setTabAsignacion('mis_asignadas')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              tabAsignacion === 'mis_asignadas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Solo Mis Asignadas ({misAsignadasCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 italic">
          Solo puedes modificar estado y revisiones de las incidencias que tengas asignadas
        </span>
      </div>

      {/* Listado de Incidencias Operativas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Cargando tickets de tu área operativa...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="text-slate-800 font-bold text-sm">
            {tabAsignacion === 'mis_asignadas'
              ? 'No tienes incidencias asignadas actualmente'
              : 'No hay incidencias pendientes en tu área'}
          </div>
          <p className="text-xs text-slate-500">
            {tabAsignacion === 'mis_asignadas'
              ? 'Puedes revisar la pestaña de "Todas en mi Área" para tomar un ticket pendiente.'
              : '¡Excelente trabajo! Todo el campus está operando sin reportes en esta área.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map((inc) => {
            const estaAsignadaAMi =
              inc.tecnico_asignado?.email?.toLowerCase() === currentUser.email?.toLowerCase();
            const sinAsignar = !inc.tecnico_asignado?.email;

            return (
              <div
                key={inc._id || inc.codigo}
                onClick={() => onSelectIncidencia(inc)}
                className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  estaAsignadaAMi ? 'border-emerald-300 ring-1 ring-emerald-400/30' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {inc.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        inc.prioridad === 'critica'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : inc.prioridad === 'alta'
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {inc.prioridad}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">
                    {inc.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {inc.descripcion}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 mb-3 space-y-1">
                    <div>
                      📍 <span className="font-semibold text-slate-800">{inc.ubicacion?.edificio}</span> ({inc.ubicacion?.aula_laboratorio})
                    </div>
                    <div>
                      👤 Reportante: {inc.reportante?.nombre} ({inc.reportante?.rol})
                    </div>
                    <div>
                      🛠️ Técnico: {inc.tecnico_asignado?.nombre ? (
                        <span className={estaAsignadaAMi ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                          {inc.tecnico_asignado.nombre} {estaAsignadaAMi && '(Tú)'}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">⚠️ Disponible / Sin asignar</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas del Técnico */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold uppercase text-[10px] text-slate-400">Estado:</span>
                    <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-800 capitalize">
                      {inc.estado?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Botones de acción según asignación */}
                  <div className="flex items-center space-x-1.5">
                    {sinAsignar && (
                      <button
                        onClick={(e) => handleQuickStatusChange(inc.codigo, 'en_progreso', e)}
                        disabled={updatingCode === inc.codigo}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs"
                      >
                        {updatingCode === inc.codigo ? 'Tomando...' : 'Tomar Ticket'}
                      </button>
                    )}

                    {estaAsignadaAMi && inc.estado !== 'resuelta' && (
                      <button
                        onClick={(e) => handleQuickStatusChange(inc.codigo, 'resuelta', e)}
                        disabled={updatingCode === inc.codigo}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>{updatingCode === inc.codigo ? 'Cerrando...' : 'Marcar Resuelta'}</span>
                      </button>
                    )}

                    <span className="text-emerald-600 font-semibold text-xs flex items-center pl-1">
                      Ver Expediente
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
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
