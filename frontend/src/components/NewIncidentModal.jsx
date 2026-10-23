import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Cpu,
  Wrench,
  GraduationCap,
  Send,
  Loader2,
  AlertCircle,
  Building,
  User,
} from 'lucide-react';
import { createIncidencia } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NewIncidentModal({ isOpen, onClose, onIncidentCreated }) {
  const { currentUser } = useAuth();
  const [categoria, setCategoria] = useState('computo_telecomunicaciones');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Datos base
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    edificio: 'Edificio A - Tecnologías de la Información',
    aula_laboratorio: 'Laboratorio de Cómputo L-01',
    piso: 'Piso 1',
    referencias: '',
    reportante_nombre: currentUser?.nombre || '',
    reportante_email: currentUser?.email || '',
    reportante_rol: currentUser?.rol === 'reportante' ? 'estudiante' : currentUser?.rol || 'estudiante',
    reportante_departamento: currentUser?.departamento_carrera || '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        reportante_nombre: currentUser.nombre || '',
        reportante_email: currentUser.email || '',
        reportante_rol: currentUser.rol === 'reportante' ? 'estudiante' : currentUser.rol || 'estudiante',
        reportante_departamento: currentUser.departamento_carrera || '',
      }));
    }
  }, [currentUser]);

  // Campos polimórficos
  const [detalleComputo, setDetalleComputo] = useState({
    tipo_dispositivo: 'PC de Escritorio / Estación de Trabajo',
    marca_modelo: 'Dell OptiPlex 7090',
    numero_serie_activo: '',
    direccion_ip: '',
    mac_address: '',
    sistema_operativo: 'Windows 11 Pro Education',
    software_afectado: '',
    tipo_falla_red: 'sin_conexion',
  });

  const [detalleInfra, setDetalleInfra] = useState({
    tipo_servicio: 'electricidad',
    tipo_dano: '',
    nivel_urgencia: 'rutinario',
    requiere_corte_suministro: false,
    tipo_suministro_afectado: 'energia_electrica',
    afecta_seguridad_personal: false,
  });

  const [detalleSistemas, setDetalleSistemas] = useState({
    plataforma: 'SICE',
    modulo_afectado: '',
    matricula_estudiante_afectado: '',
    url_modulo: 'https://sice.utm.mx',
    codigo_error_http: '500 Internal Server Error',
    navegador_utilizado: 'Google Chrome',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let detallePolimorfico = {};
    if (categoria === 'computo_telecomunicaciones') {
      detallePolimorfico = detalleComputo;
    } else if (categoria === 'infraestructura_mantenimiento') {
      detallePolimorfico = detalleInfra;
    } else if (categoria === 'sistemas_servicios_academicos') {
      detallePolimorfico = detalleSistemas;
    }

    const payload = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      categoria,
      prioridad: formData.prioridad,
      ubicacion: {
        edificio: formData.edificio,
        aula_laboratorio: formData.aula_laboratorio,
        piso: formData.piso,
        referencias: formData.referencias,
      },
      reportante: {
        nombre: formData.reportante_nombre,
        email: formData.reportante_email,
        rol: formData.reportante_rol,
        departamento_carrera: formData.reportante_departamento || 'General',
      },
      detalle: detallePolimorfico,
    };

    try {
      await createIncidencia(payload);
      if (onIncidentCreated) onIncidentCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar la incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registrar Nueva Incidencia de Campus
              </h2>
              <p className="text-xs text-slate-500">
                El formulario adapta sus campos polimórficos según la categoría seleccionada
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Categoría Polimórfica */}
          <div>
            <label className="block text-slate-700 font-bold mb-2 uppercase tracking-wider text-[11px]">
              Seleccione la Categoría de la Incidencia *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCategoria('computo_telecomunicaciones')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                  categoria === 'computo_telecomunicaciones'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${categoria === 'computo_telecomunicaciones' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Cómputo y Redes</div>
                  <div className="text-[11px] text-slate-500">Hardware, switches, Wi-Fi, IPs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('infraestructura_mantenimiento')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                  categoria === 'infraestructura_mantenimiento'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${categoria === 'infraestructura_mantenimiento' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Infraestructura</div>
                  <div className="text-[11px] text-slate-500">Plomería, electricidad, aulas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('sistemas_servicios_academicos')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                  categoria === 'sistemas_servicios_academicos'
                    ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${categoria === 'sistemas_servicios_academicos' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Sistemas Académicos</div>
                  <div className="text-[11px] text-slate-500">SICE, Moodle, plataforma web</div>
                </div>
              </button>
            </div>
          </div>

          {/* Información General */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Información General del Incidente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-slate-600 font-semibold mb-1">Título de la Incidencia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Falla en proyector o gotera en laboratorio..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Prioridad *</label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Descripción Detallada *</label>
              <textarea
                required
                rows={2}
                placeholder="Explique las circunstancias, síntomas observados y alcance de la falla..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Ubicación y Reportante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ubicación */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <Building className="w-4 h-4" />
                <span>Ubicación en Campus</span>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Edificio *</label>
                <input
                  type="text"
                  required
                  value={formData.edificio}
                  onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Aula / Lab *</label>
                  <input
                    type="text"
                    required
                    value={formData.aula_laboratorio}
                    onChange={(e) => setFormData({ ...formData, aula_laboratorio: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Piso</label>
                  <input
                    type="text"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Reportante */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                <User className="w-4 h-4" />
                <span>Datos del Reportante</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Juan Pérez"
                    value={formData.reportante_nombre}
                    onChange={(e) => setFormData({ ...formData, reportante_nombre: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@utm.mx"
                    value={formData.reportante_email}
                    onChange={(e) => setFormData({ ...formData, reportante_email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Rol</label>
                  <select
                    value={formData.reportante_rol}
                    onChange={(e) => setFormData({ ...formData, reportante_rol: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="tecnico">Técnico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Carrera / Área</label>
                  <input
                    type="text"
                    placeholder="Ej. Computación"
                    value={formData.reportante_departamento}
                    onChange={(e) => setFormData({ ...formData, reportante_departamento: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Campos Específicos Polimórficos */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
              3. Atributos Polimórficos de Categoría ({categoria.replace('_', ' ')})
            </h3>

            {categoria === 'computo_telecomunicaciones' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Dispositivo *</label>
                  <input
                    type="text"
                    required
                    value={detalleComputo.tipo_dispositivo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, tipo_dispositivo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    value={detalleComputo.marca_modelo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, marca_modelo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">No. Serie / Activo</label>
                  <input
                    type="text"
                    placeholder="UTM-ACT-202X"
                    value={detalleComputo.numero_serie_activo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, numero_serie_activo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="10.20.X.X"
                    value={detalleComputo.direccion_ip}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, direccion_ip: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">MAC Address</label>
                  <input
                    type="text"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={detalleComputo.mac_address}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, mac_address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Falla de Red</label>
                  <select
                    value={detalleComputo.tipo_falla_red}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, tipo_falla_red: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="sin_conexion">Sin Conexión</option>
                    <option value="intermitencia">Intermitencia</option>
                    <option value="velocidad_degradada">Velocidad Degradada</option>
                    <option value="falla_hardware">Falla Hardware</option>
                  </select>
                </div>
              </div>
            )}

            {categoria === 'infraestructura_mantenimiento' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Servicio *</label>
                  <select
                    value={detalleInfra.tipo_servicio}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, tipo_servicio: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="electricidad">Electricidad</option>
                    <option value="plomeria_fontaneria">Plomería y Fontanería</option>
                    <option value="aire_acondicionado">Aire Acondicionado</option>
                    <option value="cerrajeria">Cerrajería</option>
                    <option value="albanileria_pintura">Albañilería y Pintura</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Nivel de Urgencia</label>
                  <select
                    value={detalleInfra.nivel_urgencia}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, nivel_urgencia: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="rutinario">Rutinario</option>
                    <option value="urgente">Urgente</option>
                    <option value="emergencia_riesgo">Emergencia / Riesgo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Suministro Afectado</label>
                  <select
                    value={detalleInfra.tipo_suministro_afectado}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, tipo_suministro_afectado: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="energia_electrica">Energía Eléctrica</option>
                    <option value="agua_potable">Agua Potable</option>
                    <option value="red_climatizacion">Red Climatización</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 mb-1">Descripción del Daño *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tubería rota con fuga activa..."
                    value={detalleInfra.tipo_dano}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, tipo_dano: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1 sm:col-span-3">
                  <input
                    type="checkbox"
                    id="corte"
                    checked={detalleInfra.requiere_corte_suministro}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, requiere_corte_suministro: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="corte" className="text-slate-700 font-medium cursor-pointer">
                    Requiere corte urgente del suministro principal (agua / luz)
                  </label>
                </div>
              </div>
            )}

            {categoria === 'sistemas_servicios_academicos' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Plataforma Institucional *</label>
                  <select
                    value={detalleSistemas.plataforma}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, plataforma: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="SICE">SICE (Control Escolar)</option>
                    <option value="Moodle_Campus_Virtual">Moodle (Campus Virtual)</option>
                    <option value="Correo_Institucional">Correo Institucional UTM</option>
                    <option value="Biblioteca_Digital">Biblioteca Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Módulo del Sistema</label>
                  <input
                    type="text"
                    placeholder="Ej. Inscripción, Actas..."
                    value={detalleSistemas.modulo_afectado}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, modulo_afectado: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Matrícula o Grupo Afectado</label>
                  <input
                    type="text"
                    placeholder="Ej. 20240101 o Grupo 401"
                    value={detalleSistemas.matricula_estudiante_afectado}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, matricula_estudiante_afectado: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">URL del Módulo</label>
                  <input
                    type="text"
                    value={detalleSistemas.url_modulo}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, url_modulo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Código de Error HTTP</label>
                  <input
                    type="text"
                    placeholder="500, 403, 404..."
                    value={detalleSistemas.codigo_error_http}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, codigo_error_http: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando en MongoDB Atlas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Crear Expediente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
