import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { asignarTecnico } from '../services/api';

export default function AssignTechnicianModal({
  isOpen,
  onClose,
  incidencia,
  usuariosDemo = [],
  onAssigned,
}) {
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !incidencia) return null;

  // Filtrar solo usuarios con rol 'tecnico'
  const tecnicos = usuariosDemo.filter((u) => u.rol === 'tecnico');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmail) return;

    const tec = tecnicos.find((t) => t.email.toLowerCase() === selectedEmail.toLowerCase());
    if (!tec) return;

    setLoading(true);
    setError(null);

    try {
      await asignarTecnico(incidencia.codigo, {
        tecnico_id: tec._id,
        tecnico_nombre: tec.nombre,
        tecnico_email: tec.email,
        tecnico_area: tec.area,
        id_tecnico: tec.id_tecnico || 'TEC-UTM',
      });

      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al asignar técnico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Asignación de Técnico Operativo
              </h3>
              <p className="text-xs font-mono text-slate-500">{incidencia.codigo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="text-slate-500 block mb-1">Incidencia:</span>
            <div className="font-semibold text-slate-800 text-sm">{incidencia.titulo}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Área requerida: <span className="font-semibold capitalize">{incidencia.categoria?.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <span className="font-semibold text-slate-700 block mb-1">Estado de asignación actual:</span>
            {incidencia.tecnico_asignado?.nombre ? (
              <div className="font-medium text-emerald-800">
                👤 {incidencia.tecnico_asignado.nombre} ({incidencia.tecnico_asignado.email})
              </div>
            ) : (
              <div className="text-amber-700 italic">⚠️ Sin técnico asignado actualmente</div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
              Seleccionar Técnico Responsable *
            </label>
            <div className="space-y-2">
              {tecnicos.map((tec) => (
                <label
                  key={tec.email}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedEmail === tec.email
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tecnico"
                    value={tec.email}
                    checked={selectedEmail === tec.email}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="mt-1 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{tec.nombre}</div>
                    <div className="text-[11px] text-slate-500">{tec.email}</div>
                    <div className="text-[10px] text-emerald-700 font-medium capitalize mt-0.5">
                      Área: {tec.area?.replace('_', ' ')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmail}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <span>Guardar Asignación</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
