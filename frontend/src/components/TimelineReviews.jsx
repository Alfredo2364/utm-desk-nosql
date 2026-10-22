import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TimelineReviews({ revisiones = [], onAddRevision, isSubmitting }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tecnico_nombre: '',
    tecnico_id: '',
    diagnostico: '',
    estado_asignado: 'en_progreso',
    accion_realizada: '',
    observaciones: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.diagnostico.trim() || !formData.tecnico_nombre.trim()) return;

    await onAddRevision(formData);
    setFormData({
      tecnico_nombre: '',
      tecnico_id: '',
      diagnostico: '',
      estado_asignado: 'en_progreso',
      accion_realizada: '',
      observaciones: '',
    });
    setShowForm(false);
  };

  const getStatusBadge = (estado) => {
    const map = {
      abierta: 'bg-blue-100 text-blue-800 border-blue-200',
      en_progreso: 'bg-amber-100 text-amber-800 border-amber-200',
      pendiente_revision: 'bg-purple-100 text-purple-800 border-purple-200',
      resuelta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cerrada: 'bg-slate-200 text-slate-800 border-slate-300',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border capitalize ${
          map[estado] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {estado ? estado.replace('_', ' ') : 'N/A'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Línea de Tiempo de Revisiones ({revisiones.length})
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{showForm ? 'Ocultar Formulario' : 'Agregar Diagnóstico / Revisión'}</span>
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Formulario desplegable para agregar revisión */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 border border-emerald-200 rounded-xl space-y-3">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-900">
            Nueva Entrada en Expediente Técnico
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Nombre del Técnico *</label>
              <input
                type="text"
                required
                value={formData.tecnico_nombre}
                onChange={(e) => setFormData({ ...formData, tecnico_nombre: e.target.value })}
                placeholder="Ej. Ing. Carlos Vega"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">ID / Matrícula Técnico</label>
              <input
                type="text"
                value={formData.tecnico_id}
                onChange={(e) => setFormData({ ...formData, tecnico_id: e.target.value })}
                placeholder="Ej. TEC-UTM-089"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Nuevo Estado *</label>
              <select
                value={formData.estado_asignado}
                onChange={(e) => setFormData({ ...formData, estado_asignado: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-semibold"
              >
                <option value="en_progreso">En Progreso</option>
                <option value="pendiente_revision">Pendiente de Revisión</option>
                <option value="resuelta">Resuelta</option>
                <option value="cerrada">Cerrada</option>
                <option value="abierta">Abierta</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-600 font-medium mb-1">Diagnóstico Técnico *</label>
            <textarea
              required
              rows={2}
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              placeholder="Describa el análisis realizado y causa raíz encontrada..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Acción Realizada</label>
              <input
                type="text"
                value={formData.accion_realizada}
                onChange={(e) => setFormData({ ...formData, accion_realizada: e.target.value })}
                placeholder="Ej. Reemplazo de conector RJ45, parcheo de BD..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Observaciones / Pendientes</label>
              <input
                type="text"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Ej. Se programó visita de seguimiento..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Revisión Técnica'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Listado Timeline */}
      {revisiones.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          No hay revisiones registradas aún en este expediente. Los técnicos pueden agregar diagnósticos arriba.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {revisiones.map((rev, idx) => (
            <div key={rev._id || idx} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white" />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-800 text-xs">
                      {rev.tecnico?.nombre || 'Técnico Responsable'}
                    </span>
                    {rev.tecnico?.id_tecnico && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {rev.tecnico.id_tecnico}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="font-mono">
                      {new Date(rev.fecha_revision).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>Estado: {getStatusBadge(rev.estado_asignado)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Diagnóstico: </span>
                    <span className="text-slate-600">{rev.diagnostico}</span>
                  </div>

                  {rev.accion_realizada && (
                    <div>
                      <span className="font-semibold text-slate-700">Acción Realizada: </span>
                      <span className="text-slate-600 font-medium">{rev.accion_realizada}</span>
                    </div>
                  )}

                  {rev.observaciones && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-600">Observaciones: </span>
                      {rev.observaciones}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
