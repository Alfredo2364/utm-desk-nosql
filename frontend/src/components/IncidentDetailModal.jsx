import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  User,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  FolderOpen,
  Loader2,
  RefreshCw,
  UserCheck,
  Check,
  Building,
  Shield,
  Layers,
  ChevronRight,
  Copy,
  Link2,
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
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyFolio = () => {
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      setCopiedFolio(true);
      setTimeout(() => setCopiedFolio(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (codigo) url.searchParams.set('id', codigo);
      navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

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
      // Garantizar que la URL refleje inmediatamente ?id=<codigo>
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.get('id') !== codigo && url.searchParams.get('folio') !== codigo) {
          url.searchParams.set('id', codigo);
          url.searchParams.delete('folio');
          window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
        }
      }
    }
    return () => {
      // Al desmontar el modal, retirar el parámetro id de la URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        url.searchParams.delete('folio');
        const qs = url.searchParams.toString();
        window.history.replaceState({}, '', url.pathname + (qs ? `?${qs}` : ''));
      }
    };
  }, [codigo]);

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

  const handleEvidenceUploaded = async () => {
    await fetchDossier();
    if (onIncidentUpdated) onIncidentUpdated();
  };

  if (!codigo) return null;

  const isOwner =
    incidencia?.reportante?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
  const isAssignedTech =
    incidencia?.tecnico_asignado?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
  const isAdminOrSuper = rol === 'admin' || rol === 'superadmin';

  // Permisos estrictos según Tabla 3 y Tabla 4 del ERS Cloud:
  // - Cargar evidencia: Reportante (Propias), Técnico (Asignadas), Admin/SuperAdmin (Sí), Supervisor (No), Directivo (No)
  const canUploadEvidence =
    (rol === 'reportante' && isOwner) ||
    (rol === 'tecnico' && isAssignedTech) ||
    isAdminOrSuper;

  // - Cambiar estado y Agregar revisión: Técnico (Asignadas), Admin/SuperAdmin (Sí), Supervisor (No), Reportante (No), Directivo (No)
  const canManageStatus = (rol === 'tecnico' && isAssignedTech) || isAdminOrSuper;
  const canAddReview = (rol === 'tecnico' && isAssignedTech) || isAdminOrSuper;

  // - Gestión / Asignación de técnico: Supervisor, Admin y SuperAdmin
  const canAssignTechnician = rol === 'supervisor' || isAdminOrSuper;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'critica':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            CRÍTICA
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-50 text-orange-800 border border-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            ALTA
          </span>
        );
      case 'media':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            MEDIA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            BAJA
          </span>
        );
    }
  };

  const getStatusBadge = (s) => {
    const config = {
      abierta: 'bg-blue-50 text-blue-800 border-blue-200',
      asignada: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      en_proceso: 'bg-amber-50 text-amber-800 border-amber-200',
      en_progreso: 'bg-amber-50 text-amber-800 border-amber-200',
      pendiente_revision: 'bg-purple-50 text-purple-800 border-purple-200',
      resuelta: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      cerrada: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${config[s] || 'bg-slate-100'}`}>
        {s?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 text-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-xs bg-slate-800 text-emerald-400 px-2.5 py-1 rounded border border-slate-700">
              {codigo}
            </span>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="capitalize">{incidencia?.categoria?.replace('_', ' ')}</span>
              <span>/</span>
              <span className="truncate max-w-md text-slate-200 font-medium">{incidencia?.titulo}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyLink}
              title="Copiar URL directa de este ticket para compartir"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3 text-cyan-400" />}
              <span>{copiedLink ? 'URL Copiada' : 'Copiar URL'}</span>
            </button>
            <button
              onClick={handleCopyFolio}
              title="Copiar Folio Oficial"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedFolio ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedFolio ? 'Copiado' : 'Copiar Folio'}</span>
            </button>
            <button
              onClick={fetchDossier}
              title="Refrescar expediente"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two-Column Split Pane */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-slate-600" />
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Cargando documento en MongoDB Atlas...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs text-rose-700 font-semibold">{error}</p>
            <button
              onClick={fetchDossier}
              className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-md"
            >
              Reintentar
            </button>
          </div>
        ) : incidencia ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Columna Izquierda: Contenido Principal (68%) */}
            <div className="lg:col-span-8 p-5 overflow-y-auto space-y-5">
              {/* Título y Descripción */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                  <span>EXPEDIENTE TÉCNICO</span>
                  <span>•</span>
                  <span>REGISTRADO EL {new Date(incidencia.createdAt).toLocaleString('es-MX')}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {incidencia.titulo}
                </h2>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {incidencia.descripcion}
                </div>
              </div>

              {/* Especificaciones Polimórficas */}
              <PolymorphicDetail
                categoria={incidencia.categoria}
                detalle={incidencia.detalle}
              />

              {/* Bóveda de Evidencias */}
              <EvidenceGrid evidencias={incidencia.evidencias_adjuntas} />

              {/* Uploader de Evidencias */}
              {canUploadEvidence && (
                <EvidenceUploader
                  codigo={incidencia.codigo}
                  onEvidenceUploaded={handleEvidenceUploaded}
                />
              )}

              {/* Timeline de Revisiones y Auditoría */}
              <TimelineReviews
                revisiones={incidencia.revisiones}
                onAddRevision={handleAddRevision}
                isSubmitting={isSubmittingReview}
                canAddReviewProp={canAddReview}
              />
            </div>

            {/* Columna Derecha: Inspector de Metadatos & Propiedades (32%) */}
            <div className="lg:col-span-4 p-5 overflow-y-auto bg-slate-50/60 space-y-4 text-xs">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Inspector de Propiedades
              </div>

              {/* Aviso de Permisos según Rol (Tabla 3 y Tabla 4 del ERS Cloud) */}
              {rol === 'supervisor' && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] leading-relaxed">
                  <strong>Modo Supervisión (Tabla 3 y 4):</strong> Tu acceso es de gestión y seguimiento. Puedes consultar el expediente y asignar técnico, pero no modificar el estado, las revisiones ni las evidencias.
                </div>
              )}
              {rol === 'tecnico' && !isAssignedTech && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <strong>Modo Consulta de Área (Tabla 4):</strong> Esta incidencia aún no está asignada a tu cuenta. Solo el técnico asignado puede cambiar su estado, registrar revisiones o adjuntar evidencias.
                </div>
              )}

              {/* Folio Oficial & Canal de Levantamiento */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Folio Institucional</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {incidencia.codigo}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500">Canal de Ingreso:</span>
                  <span className="font-semibold text-slate-800 capitalize font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {incidencia.canal_origen ? incidencia.canal_origen.replace('_', ' ') : 'Portal Autoservicio'}
                  </span>
                </div>
              </div>

              {/* Estado Operativo & Acciones de Flujo de Trabajo */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Estado Operativo</span>
                  {getStatusBadge(incidencia.estado)}
                </div>

                {canManageStatus && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Transicionar Estado (RF-04):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {incidencia.estado !== 'en_proceso' && incidencia.estado !== 'en_progreso' && (
                        <button
                          onClick={() => handleStatusChange('en_proceso')}
                          disabled={changingStatus}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-[11px] text-center cursor-pointer"
                        >
                          En Proceso
                        </button>
                      )}
                      {incidencia.estado !== 'resuelta' && (
                        <button
                          onClick={() => handleStatusChange('resuelta')}
                          disabled={changingStatus}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resuelta</span>
                        </button>
                      )}
                      {incidencia.estado !== 'cerrada' && (
                        <button
                          onClick={() => handleStatusChange('cerrada')}
                          disabled={changingStatus}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-semibold text-[11px] text-center cursor-pointer"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Nivel de Prioridad */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nivel de Prioridad</span>
                {getPriorityBadge(incidencia.prioridad)}
              </div>

              {/* Técnico Asignado */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Técnico Responsable</span>
                  {canAssignTechnician && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      {incidencia.tecnico_asignado?.nombre ? 'Cambiar' : 'Asignar'}
                    </button>
                  )}
                </div>

                {incidencia.tecnico_asignado?.nombre ? (
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{incidencia.tecnico_asignado.nombre}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {incidencia.tecnico_asignado.email}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      Área: {incidencia.tecnico_asignado.area?.replace('_', ' ')}
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-700 font-medium italic p-2 bg-amber-50/60 rounded border border-amber-200 text-[11px]">
                    ⚠️ Sin técnico asignado
                  </div>
                )}
              </div>

              {/* Datos del Reportante */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-medium block">Reportante</span>
                <div className="font-bold text-slate-900">{incidencia.reportante?.nombre}</div>
                <div className="text-slate-500 text-[11px] font-mono truncate">{incidencia.reportante?.email}</div>
                <div className="text-[10px] text-slate-400 capitalize">
                  Rol: {incidencia.reportante?.rol} • {incidencia.reportante?.departamento_carrera}
                </div>
              </div>

              {/* Ubicación Física */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-medium block">Ubicación Física</span>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{incidencia.ubicacion?.edificio}</span>
                </div>
                <div className="text-slate-600 text-[11px] pl-4 font-mono">
                  {incidencia.ubicacion?.aula_laboratorio} • {incidencia.ubicacion?.piso}
                </div>
                {incidencia.ubicacion?.referencias && (
                  <div className="text-[10px] text-slate-400 pl-4 italic">
                    Ref: {incidencia.ubicacion.referencias}
                  </div>
                )}
              </div>

              {/* SLA & Temporizadores */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                <span className="text-slate-500 font-sans block mb-1 font-medium">Trazabilidad SLA</span>
                <div className="flex justify-between text-slate-600">
                  <span>Creado:</span>
                  <span>{new Date(incidencia.createdAt).toLocaleDateString('es-MX')}</span>
                </div>
                {incidencia.fecha_resolucion && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Resuelto:</span>
                    <span>{new Date(incidencia.fecha_resolucion).toLocaleDateString('es-MX')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>UTM DESK • PROTOCOLO NoSQL MONGODB ATLAS</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold rounded-md transition-colors"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>

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
