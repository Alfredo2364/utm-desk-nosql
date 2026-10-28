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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Despacho y Asignación de Técnico
              </h3>
              <p className="text-[11px] font-mono text-slate-500">{incidencia.codigo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Incidencia:</span>
            <div className="font-semibold text-slate-900">{incidencia.titulo}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Área requerida: <span className="font-semibold capitalize text-slate-800">{incidencia.categoria?.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-slate-600 font-mono text-[11px]">
            <span className="font-bold text-slate-700 block mb-0.5 uppercase text-[10px]">Asignación Actual:</span>
            {incidencia.tecnico_asignado?.nombre ? (
              <div className="text-slate-900 font-semibold">
                👤 {incidencia.tecnico_asignado.nombre} ({incidencia.tecnico_asignado.email})
              </div>
            ) : (
              <div className="text-amber-700 font-semibold">⚠️ Ticket sin asignar en la cola</div>
            )}
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Seleccionar Agente Especialista *
            </label>
            <div className="space-y-1.5">
              {tecnicos.map((tec) => (
                <label
                  key={tec.email}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-md border cursor-pointer transition-all ${
                    selectedEmail === tec.email
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tecnico"
                    value={tec.email}
                    checked={selectedEmail === tec.email}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="mt-0.5 text-slate-900"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{tec.nombre}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{tec.email}</div>
                    <div className="text-[10px] text-slate-600 capitalize mt-0.5 font-medium">
                      Especialidad: {tec.area?.replace('_', ' ')}
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
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmail}
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Asignación</span>
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
