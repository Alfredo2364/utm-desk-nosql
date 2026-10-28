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
import { useAuth } from '../context/AuthContext';

export default function TimelineReviews({
  revisiones = [],
  onAddRevision,
  isSubmitting,
  canAddReviewProp,
}) {
  const { currentUser, rol } = useAuth();
  const canAddReview =
    canAddReviewProp !== undefined
      ? canAddReviewProp
      : rol === 'tecnico' || rol === 'admin' || rol === 'superadmin';

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tecnico_nombre: currentUser?.nombre || '',
    tecnico_id: currentUser?.id_tecnico || 'TEC-UTM',
    diagnostico: '',
    estado_asignado: 'en_proceso',
    accion_realizada: '',
    observaciones: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.diagnostico.trim() || !formData.tecnico_nombre.trim()) return;

    await onAddRevision(formData);
    setFormData({
      tecnico_nombre: currentUser?.nombre || '',
      tecnico_id: currentUser?.id_tecnico || 'TEC-UTM',
      diagnostico: '',
      estado_asignado: 'en_proceso',
      accion_realizada: '',
      observaciones: '',
    });
    setShowForm(false);
  };

  const getStatusBadge = (estado) => {
    const map = {
      abierta: 'bg-blue-50 text-blue-700 border-blue-200',
      asignada: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      en_proceso: 'bg-amber-50 text-amber-700 border-amber-200',
      en_progreso: 'bg-amber-50 text-amber-700 border-amber-200',
      pendiente_revision: 'bg-purple-50 text-purple-700 border-purple-200',
      resuelta: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cerrada: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
          map[estado] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {estado ? estado.replace('_', ' ') : 'N/A'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Bitácora de Revisiones e Intervenciones ({revisiones.length})
          </h3>
        </div>
        {canAddReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showForm ? 'Ocultar' : 'Agregar Diagnóstico'}</span>
            {showForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Formulario desplegable */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">
            Nueva Entrada en Expediente Técnico
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Nombre del Técnico *</label>
              <input
                type="text"
                required
                value={formData.tecnico_nombre}
                onChange={(e) => setFormData({ ...formData, tecnico_nombre: e.target.value })}
                placeholder="Ej. Ing. Carlos Vega"
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">ID Técnico</label>
              <input
                type="text"
                value={formData.tecnico_id}
                onChange={(e) => setFormData({ ...formData, tecnico_id: e.target.value })}
                placeholder="Ej. TEC-UTM-089"
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Nuevo Estado *</label>
              <select
                value={formData.estado_asignado}
                onChange={(e) => setFormData({ ...formData, estado_asignado: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-slate-900"
              >
                <option value="en_proceso">En Proceso (en_proceso)</option>
                <option value="asignada">Asignada</option>
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
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Acción Realizada</label>
              <input
                type="text"
                value={formData.accion_realizada}
                onChange={(e) => setFormData({ ...formData, accion_realizada: e.target.value })}
                placeholder="Ej. Reemplazo de conector RJ45, parchado de software..."
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Observaciones</label>
              <input
                type="text"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Ej. Programada revisión de seguimiento..."
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Registrar Revisión'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Listado Timeline */}
      {revisiones.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-md border border-dashed border-slate-200">
          No hay revisiones técnicas registradas en este expediente.
        </div>
      ) : (
        <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {revisiones.map((rev, idx) => (
            <div key={rev._id || idx} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-900 text-xs">
                      {rev.tecnico?.nombre || 'Técnico Responsable'}
                    </span>
                    {rev.tecnico?.id_tecnico && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
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
                    <span>•</span>
                    <div>{getStatusBadge(rev.estado_asignado)}</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Diagnóstico: </span>
                    <span className="text-slate-600">{rev.diagnostico}</span>
                  </div>

                  {rev.accion_realizada && (
                    <div>
                      <span className="font-semibold text-slate-700">Acción: </span>
                      <span className="text-slate-600 font-medium">{rev.accion_realizada}</span>
                    </div>
                  )}

                  {rev.observaciones && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100 mt-1">
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
