import React from 'react';
import {
  MapPin,
  Clock,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Wrench,
  GraduationCap,
  Flame,
} from 'lucide-react';

export default function IncidentCard({ incidencia, onSelect }) {
  const {
    codigo,
    titulo,
    descripcion,
    categoria,
    estado,
    prioridad,
    ubicacion,
    reportante,
    revisiones = [],
    evidencias_adjuntas = [],
    createdAt,
  } = incidencia;

  // Badge de Estado Micro-Enterprise
  const getStatusBadge = (status) => {
    const config = {
      abierta: {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Abierta',
      },
      en_progreso: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'En Progreso',
      },
      pendiente_revision: {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        label: 'Pendiente Revisión',
      },
      resuelta: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Resuelta',
      },
      cerrada: {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Cerrada',
      },
    };

    const current = config[status] || config.abierta;

    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${current.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
        <span>{current.label}</span>
      </span>
    );
  };

  // Badge de Prioridad
  const getPriorityBadge = (priority) => {
    const config = {
      critica: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Crítica',
      },
      alta: {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        label: 'Alta',
      },
      media: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Media',
      },
      baja: {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        label: 'Baja',
      },
    };

    const current = config[priority] || config.media;

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${current.bg}`}
      >
        <span>{current.label}</span>
      </span>
    );
  };

  const getCategoryInfo = (cat) => {
    switch (cat) {
      case 'computo_telecomunicaciones':
        return {
          label: 'Cómputo & Redes',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
        };
      case 'infraestructura_mantenimiento':
        return {
          label: 'Infraestructura',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'sistemas_servicios_academicos':
        return {
          label: 'Sistemas Académicos',
          color: 'text-purple-700 bg-purple-50 border-purple-200',
        };
      default:
        return {
          label: 'Campus General',
          color: 'text-slate-700 bg-slate-50 border-slate-200',
        };
    }
  };

  const categoryInfo = getCategoryInfo(categoria);

  return (
    <div
      onClick={() => onSelect(incidencia)}
      className="group bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Encabezado: Código, Categoría y Prioridad */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {codigo}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${categoryInfo.color}`}
            >
              <span>{categoryInfo.label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {getPriorityBadge(prioridad)}
          </div>
        </div>

        {/* Título y Descripción */}
        <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-700 transition-colors line-clamp-1 mb-1 leading-snug">
          {titulo}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {descripcion}
        </p>
      </div>

      <div>
        {/* Ubicación: Edificio y Aula */}
        <div className="bg-slate-50 rounded-md p-2 mb-3 border border-slate-100 text-[11px] text-slate-600 font-mono truncate">
          <span className="text-slate-800 font-semibold">{ubicacion?.edificio || 'Campus UTM'}</span> • {ubicacion?.aula_laboratorio}
        </div>

        {/* Pie de Tarjeta: Estado, Contadores y Acción */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          <div>{getStatusBadge(estado)}</div>

          <div className="flex items-center space-x-2 text-slate-400">
            {/* Contador de Evidencias */}
            <div
              className={`flex items-center space-x-1 text-[11px] font-mono ${
                evidencias_adjuntas.length > 0 ? 'text-slate-700 font-semibold' : ''
              }`}
              title={`${evidencias_adjuntas.length} evidencias adjuntas`}
            >
              <Paperclip className="w-3 h-3" />
              <span>{evidencias_adjuntas.length}</span>
            </div>

            {/* Contador de Revisiones */}
            <div
              className={`flex items-center space-x-1 text-[11px] font-mono ${
                revisiones.length > 0 ? 'text-slate-700 font-semibold' : ''
              }`}
              title={`${revisiones.length} revisiones técnicas`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{revisiones.length}</span>
            </div>

            <span className="text-slate-300">|</span>

            <span className="text-slate-900 font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
              Expediente
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
