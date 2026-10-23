import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  User,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle,
  FolderOpen,
  Loader2,
  RefreshCw,
  UserCheck,
  Check,
} from 'lucide-react';
import { getIncidenciaByCodigo, addRevision, patchEstado } from '../services/api';
import PolymorphicDetail from './PolymorphicDetail';
import TimelineReviews from './TimelineReviews';
import EvidenceGrid from './EvidenceGrid';
import EvidenceUploader from './EvidenceUploader';
import AssignTechnicianModal from './AssignTechnicianModal';
import { useAuth } from '../context/AuthContext';

export default function IncidentDetailModal({ codigo, onClose, onIncidentUpdated }) {
  const { currentUser, rol, usuariosDemo } = useAuth();
  const [incidencia, setIncidencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIncidenciaByCodigo(codigo);
      setIncidencia(data.incidencia);
    } catch (err) {
      setError(err.message || 'Error al obtener el expediente completo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigo) {
      fetchDossier();
    }
  }, [codigo]);

  // Manejar adición de nueva revisión
  const handleAddRevision = async (reviewData) => {
    setIsSubmittingReview(true);
    try {
      await addRevision(codigo, reviewData);
      await fetchDossier();
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err) {
      alert(`Error al guardar revisión: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Manejar cambio rápido de estado
  const handleStatusChange = async (nuevoEstado) => {
    setChangingStatus(true);
    try {
      await patchEstado(codigo, nuevoEstado, `Transición a ${nuevoEstado} por ${currentUser.nombre}`);
      await fetchDossier();
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setChangingStatus(false);
    }
  };

  // Manejar nueva evidencia subida
  const handleEvidenceUploaded = async (newEvidence) => {
    await fetchDossier();
    if (onIncidentUpdated) onIncidentUpdated();
  };

  if (!codigo) return null;

  // Lógica de permisos de carga de evidencias
  const isOwner = incidencia?.reportante?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
  const canUploadEvidence =
    (rol === 'reportante' && isOwner) ||
    rol === 'tecnico' ||
    rol === 'supervisor' ||
    rol === 'admin';

  const canManageStatus = rol === 'tecnico' || rol === 'supervisor' || rol === 'admin';
  const canAssignTechnician = rol === 'supervisor' || rol === 'admin';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-50 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  {codigo}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Expediente NoSQL MongoDB Atlas
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                {incidencia?.titulo || 'Cargando expediente...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDossier}
              title="Refrescar expediente"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Consultando documento embebido en MongoDB Atlas...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2 text-rose-700 text-sm">
              <AlertTriangle className="w-6 h-6 mx-auto text-rose-600" />
              <p className="font-semibold">{error}</p>
              <button
                onClick={fetchDossier}
                className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-lg"
              >
                Reintentar
              </button>
            </div>
          ) : incidencia ? (
            <>
              {/* Sección 1: Información Base, Estado y Asignación */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Estado:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {incidencia.estado?.replace('_', ' ')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Prioridad:
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold capitalize bg-amber-100 text-amber-800">
                      {incidencia.prioridad}
                    </span>
                  </div>

                  {/* Acciones de cambio de estado para Técnicos, Supervisores y Admin */}
                  {canManageStatus && (
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-400 font-semibold mr-1">Mover a:</span>
                      {incidencia.estado !== 'en_progreso' && (
                        <button
                          onClick={() => handleStatusChange('en_progreso')}
                          disabled={changingStatus}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 font-semibold"
                        >
                          En Progreso
                        </button>
                      )}
                      {incidencia.estado !== 'resuelta' && (
                        <button
                          onClick={() => handleStatusChange('resuelta')}
                          disabled={changingStatus}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resuelta</span>
                        </button>
                      )}
                      {incidencia.estado !== 'cerrada' && (
                        <button
                          onClick={() => handleStatusChange('cerrada')}
                          disabled={changingStatus}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-semibold"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Descripción Detallada */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Descripción del Incidente
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                    {incidencia.descripcion}
                  </p>
                </div>

                {/* Grid Ubicación, Reportante y Técnico Asignado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Ubicación */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <MapPin className="w-4 h-4" />
                      <span>Ubicación en Campus</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {incidencia.ubicacion?.edificio}
                    </div>
                    <div className="text-slate-600 font-medium">
                      {incidencia.ubicacion?.aula_laboratorio} • {incidencia.ubicacion?.piso || 'Planta Baja'}
                    </div>
                    {incidencia.ubicacion?.referencias && (
                      <div className="text-[11px] text-slate-500 italic pt-1">
                        Ref: {incidencia.ubicacion.referencias}
                      </div>
                    )}
                  </div>

                  {/* Reportante */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                      <User className="w-4 h-4" />
                      <span>Reportante</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {incidencia.reportante?.nombre}
                    </div>
                    <div className="text-slate-600 truncate">{incidencia.reportante?.email}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      Rol: {incidencia.reportante?.rol} • {incidencia.reportante?.departamento_carrera}
                    </div>
                  </div>

                  {/* Técnico Asignado */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                        <UserCheck className="w-4 h-4" />
                        <span>Técnico Responsable</span>
                      </div>
                      {canAssignTechnician && (
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="text-[10px] text-indigo-700 font-bold hover:underline"
                        >
                          {incidencia.tecnico_asignado?.nombre ? 'Cambiar' : 'Asignar'}
                        </button>
                      )}
                    </div>

                    {incidencia.tecnico_asignado?.nombre ? (
                      <>
                        <div className="font-semibold text-slate-800 text-sm">
                          {incidencia.tecnico_asignado.nombre}
                        </div>
                        <div className="text-slate-600 truncate">{incidencia.tecnico_asignado.email}</div>
                        <div className="text-[11px] text-emerald-700 font-medium capitalize">
                          Área: {incidencia.tecnico_asignado.area?.replace('_', ' ')}
                        </div>
                      </>
                    ) : (
                      <div className="py-2 text-amber-700 font-semibold italic text-xs">
                        ⚠️ Sin técnico asignado
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Detalle Polimórfico */}
              <PolymorphicDetail
                categoria={incidencia.categoria}
                detalle={incidencia.detalle}
              />

              {/* Sección 3: Galería de Evidencias */}
              <EvidenceGrid evidencias={incidencia.evidencias_adjuntas} />

              {/* Sección 4: Carga Drag & Drop de Evidencias (Solo si autorizado) */}
              {canUploadEvidence ? (
                <EvidenceUploader
                  codigo={incidencia.codigo}
                  onEvidenceUploaded={handleEvidenceUploaded}
                />
              ) : (
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 text-xs text-center italic">
                  ℹ️ La carga de evidencias está reservada al reportante titular de la incidencia y al personal técnico operativo.
                </div>
              )}

              {/* Sección 5: Línea de Tiempo de Revisiones Técnicas */}
              <TimelineReviews
                revisiones={incidencia.revisiones}
                onAddRevision={handleAddRevision}
                isSubmitting={isSubmittingReview}
              />
            </>
          ) : null}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            UTM Desk NoSQL • Control de Acceso Basado en Roles (RBAC)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>

      {/* Modal de Asignación de Técnico */}
      {showAssignModal && (
        <AssignTechnicianModal
          isOpen={true}
          onClose={() => setShowAssignModal(false)}
          incidencia={incidencia}
          usuariosDemo={usuariosDemo}
          onAssigned={() => {
            fetchDossier();
            if (onIncidentUpdated) onIncidentUpdated();
          }}
        />
      )}
    </div>
  );
}
