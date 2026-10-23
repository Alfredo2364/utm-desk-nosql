import React from 'react';
import { Plus, Inbox, Clock, CheckCircle2, ShieldCheck, MapPin, Paperclip, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReportanteDashboard({
  incidencias = [],
  loading,
  onSelectIncidencia,
  onOpenNewModal,
}) {
  const { currentUser } = useAuth();

  const abiertas = incidencias.filter((i) => i.estado === 'abierta').length;
  const enProgreso = incidencias.filter((i) => i.estado === 'en_progreso').length;
  const resueltas = incidencias.filter((i) => i.estado === 'resuelta' || i.estado === 'cerrada').length;

  const getStatusBadge = (estado) => {
    const config = {
      abierta: 'bg-blue-100 text-blue-800 border-blue-200',
      en_progreso: 'bg-amber-100 text-amber-800 border-amber-200',
      pendiente_revision: 'bg-purple-100 text-purple-800 border-purple-200',
      resuelta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cerrada: 'bg-slate-200 text-slate-800 border-slate-300',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
          config[estado] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {estado?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner de Bienvenida y Acción Rápida */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/60 text-emerald-100 text-xs font-semibold mb-2 border border-emerald-500/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Perfil: Reportante Campus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Bienvenido, {currentUser.nombre}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Desde este portal puedes reportar fallas en aulas, equipos de cómputo y servicios del campus. Podrás consultar el avance de tus reportes y adjuntar evidencias.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <Plus className="w-5 h-5 text-emerald-600" />
          <span>Reportar Nueva Falla</span>
        </button>
      </div>

      {/* Métricas de Mis Reportes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              Mis Tickets
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{incidencias.length}</div>
          </div>
          <Inbox className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">
              Por Atender
            </span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{abiertas}</div>
          </div>
          <Clock className="w-5 h-5 text-blue-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-amber-600 font-bold uppercase tracking-wider text-[10px]">
              En Atención
            </span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{enProgreso}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">
              Resueltas
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{resueltas}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Lista de Mis Incidencias */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Mis Incidencias Reportadas ({incidencias.length})
            </h3>
            <p className="text-xs text-slate-500">
              Solo tú y el personal técnico pueden visualizar el seguimiento de estos expedientes
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Cargando tus expedientes desde MongoDB Atlas...
          </div>
        ) : incidencias.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-slate-700 font-bold text-sm">Aún no has reportado incidencias</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Si detectas una falla en proyectores, red, goteras o sistemas del campus, regístrala aquí.
            </p>
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span>Crear mi primer reporte</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidencias.map((inc) => (
              <div
                key={inc._id || inc.codigo}
                onClick={() => onSelectIncidencia(inc)}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {inc.codigo}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {inc.categoria?.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm hover:text-emerald-700">
                    {inc.titulo}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {inc.ubicacion?.edificio} • {inc.ubicacion?.aula_laboratorio}
                    </span>
                    <span>•</span>
                    <span>{new Date(inc.createdAt).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                  {getStatusBadge(inc.estado)}

                  <div className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    <Paperclip className="w-3 h-3" />
                    <span>{inc.evidencias_adjuntas?.length || 0}</span>
                  </div>

                  <span className="text-emerald-600 font-semibold text-xs flex items-center">
                    Ver <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
