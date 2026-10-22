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

  // Badge de Estado
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
        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
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
        icon: <Flame className="w-3 h-3 text-rose-600 animate-pulse" />,
      },
      alta: {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        label: 'Alta',
        icon: <AlertTriangle className="w-3 h-3 text-orange-600" />,
      },
      media: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Media',
        icon: null,
      },
      baja: {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        label: 'Baja',
        icon: null,
      },
    };

    const current = config[priority] || config.media;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${current.bg}`}
      >
        {current.icon}
        <span>{current.label}</span>
      </span>
    );
  };

  // Icono y Etiqueta de Categoría
  const getCategoryInfo = (cat) => {
    switch (cat) {
      case 'computo_telecomunicaciones':
        return {
          label: 'Cómputo & Redes',
          icon: <Cpu className="w-3.5 h-3.5 text-blue-600" />,
          color: 'text-blue-700 bg-blue-50/70 border-blue-200',
        };
      case 'infraestructura_mantenimiento':
        return {
          label: 'Infraestructura',
          icon: <Wrench className="w-3.5 h-3.5 text-amber-600" />,
          color: 'text-amber-700 bg-amber-50/70 border-amber-200',
        };
      case 'sistemas_servicios_academicos':
        return {
          label: 'Sistemas Académicos',
          icon: <GraduationCap className="w-3.5 h-3.5 text-purple-600" />,
          color: 'text-purple-700 bg-purple-50/70 border-purple-200',
        };
      default:
        return {
          label: 'Campus General',
          icon: null,
          color: 'text-slate-700 bg-slate-50 border-slate-200',
        };
    }
  };

  const categoryInfo = getCategoryInfo(categoria);

  return (
    <div
      onClick={() => onSelect(incidencia)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-emerald-400 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Encabezado: Código, Categoría y Prioridad */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 px-2 py-0.5 rounded transition-colors border border-slate-200">
              {codigo}
            </span>
            <span
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${categoryInfo.color}`}
            >
              {categoryInfo.icon}
              <span>{categoryInfo.label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {getPriorityBadge(prioridad)}
          </div>
        </div>

        {/* Título y Descripción */}
        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1.5 leading-snug">
          {titulo}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {descripcion}
        </p>
      </div>

      <div>
        {/* Ubicación: Edificio y Aula */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 mb-3.5 border border-slate-100 space-y-1">
          <div className="flex items-center text-xs text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-1.5" />
            <span className="truncate">{ubicacion?.edificio || 'Campus UTM'}</span>
          </div>
          <div className="text-[11px] text-slate-500 pl-5 truncate font-mono">
            {ubicacion?.aula_laboratorio} • {ubicacion?.piso || 'Planta Baja'}
          </div>
        </div>

        {/* Pie de Tarjeta: Estado, Contadores y Acción */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div>{getStatusBadge(estado)}</div>

          <div className="flex items-center space-x-3 text-slate-400">
            {/* Contador de Evidencias */}
            <div
              className={`flex items-center space-x-1 text-[11px] ${
                evidencias_adjuntas.length > 0 ? 'text-teal-600 font-medium' : ''
              }`}
              title={`${evidencias_adjuntas.length} evidencias adjuntas en Supabase`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{evidencias_adjuntas.length}</span>
            </div>

            {/* Contador de Revisiones */}
            <div
              className={`flex items-center space-x-1 text-[11px] ${
                revisiones.length > 0 ? 'text-emerald-600 font-medium' : ''
              }`}
              title={`${revisiones.length} revisiones técnicas`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{revisiones.length}</span>
            </div>

            <span className="text-slate-300">|</span>

            <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center font-semibold text-[11px]">
              Expediente
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
