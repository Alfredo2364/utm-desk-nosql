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
  Building2,
  User,
  ShieldCheck,
  Tag,
  MapPin,
  Flame,
  Clock,
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
    canal_origen: 'portal_autoservicio',
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
      canal_origen: formData.canal_origen,
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
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Enterprise */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              NUEVO TICKET
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Registrar Incidencia de Servicio
              </h2>
              <p className="text-[11px] text-slate-500">
                Esquema polimórfico MongoDB Atlas • Almacenamiento seguro Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Segmented Control de Categoría Polimórfica */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Área de Clasificación del Ticket *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCategoria('computo_telecomunicaciones')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  categoria === 'computo_telecomunicaciones'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Cómputo & Redes</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('infraestructura_mantenimiento')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  categoria === 'infraestructura_mantenimiento'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Infraestructura & Obra</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('sistemas_servicios_academicos')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  categoria === 'sistemas_servicios_academicos'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Sistemas Académicos</span>
              </button>
            </div>
          </div>

          {/* Sección 1: Información General del Incidente */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-2">
              <span>1. Identificación y Alcance del Problema</span>
              <span className="text-[10px] text-slate-400 font-normal">Campos requeridos *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">
                  Título Breve de la Falla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Intermitencia en switch de laboratorio L-01 o falla de proyector..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nivel de Prioridad *
                </label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="baja">Baja (Normal)</option>
                  <option value="media">Media (Estándar)</option>
                  <option value="alta">Alta (Urgente)</option>
                  <option value="critica">Crítica (Interrupción)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Canal de Levantamiento *
                </label>
                <select
                  value={formData.canal_origen}
                  onChange={(e) => setFormData({ ...formData, canal_origen: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="portal_autoservicio">Portal Web Autoservicio</option>
                  <option value="ventanilla_presencial">Ventanilla Presencial</option>
                  <option value="mesa_telefonica">Mesa de Ayuda Telefónica</option>
                  <option value="correo_institucional">Correo Institucional</option>
                  <option value="monitoreo_automatico">Monitoreo Red / IoT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Descripción Detallada del Incidente *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Describa el comportamiento anómalo observado, el impacto en usuarios o clases y pasos de reproducción..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Sección 2: Ubicación Física y Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Ubicación */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold border-b border-slate-100 pb-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] uppercase tracking-wider">Ubicación Física</span>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Edificio *</label>
                <input
                  type="text"
                  required
                  value={formData.edificio}
                  onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Aula / Laboratorio *</label>
                  <input
                    type="text"
                    required
                    value={formData.aula_laboratorio}
                    onChange={(e) => setFormData({ ...formData, aula_laboratorio: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Piso / Nivel</label>
                  <input
                    type="text"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Solicitante */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold border-b border-slate-100 pb-1.5">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] uppercase tracking-wider">Datos del Solicitante</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.reportante_nombre}
                    onChange={(e) => setFormData({ ...formData, reportante_nombre: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    value={formData.reportante_email}
                    onChange={(e) => setFormData({ ...formData, reportante_email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Rol Campus</label>
                  <select
                    value={formData.reportante_rol}
                    onChange={(e) => setFormData({ ...formData, reportante_rol: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="tecnico">Técnico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Departamento / Carrera</label>
                  <input
                    type="text"
                    value={formData.reportante_departamento}
                    onChange={(e) => setFormData({ ...formData, reportante_departamento: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Atributos Polimórficos de la Categoría */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                3. Atributos Específicos ({categoria.replace('_', ' ')})
              </span>
              <span className="text-[10px] font-mono text-slate-400">Polymorphic Schema</span>
            </div>

            {categoria === 'computo_telecomunicaciones' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Dispositivo *</label>
                  <input
                    type="text"
                    required
                    value={detalleComputo.tipo_dispositivo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, tipo_dispositivo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    value={detalleComputo.marca_modelo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, marca_modelo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">No. Serie / Activo</label>
                  <input
                    type="text"
                    placeholder="UTM-ACT-202X"
                    value={detalleComputo.numero_serie_activo}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, numero_serie_activo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="10.20.X.X"
                    value={detalleComputo.direccion_ip}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, direccion_ip: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Dirección MAC</label>
                  <input
                    type="text"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={detalleComputo.mac_address}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, mac_address: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Falla de Red</label>
                  <select
                    value={detalleComputo.tipo_falla_red}
                    onChange={(e) => setDetalleComputo({ ...detalleComputo, tipo_falla_red: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Tipo de Servicio *</label>
                  <select
                    value={detalleInfra.tipo_servicio}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, tipo_servicio: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
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
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
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
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
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
                    placeholder="Ej. Fuga de agua activa bajo tarja, contacto sobrecalentado..."
                    value={detalleInfra.tipo_dano}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, tipo_dano: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1 sm:col-span-3">
                  <input
                    type="checkbox"
                    id="corte"
                    checked={detalleInfra.requiere_corte_suministro}
                    onChange={(e) => setDetalleInfra({ ...detalleInfra, requiere_corte_suministro: e.target.checked })}
                    className="rounded text-slate-900 border-slate-300"
                  />
                  <label htmlFor="corte" className="text-slate-700 font-medium cursor-pointer">
                    Requiere corte urgente del suministro principal (agua / luz)
                  </label>
                </div>
              </div>
            )}

            {categoria === 'sistemas_servicios_academicos' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Plataforma Institucional *</label>
                  <select
                    value={detalleSistemas.plataforma}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, plataforma: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold"
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
                    placeholder="Ej. Inscripciones, Actas, Calificaciones..."
                    value={detalleSistemas.modulo_afectado}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, modulo_afectado: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Matrícula o Grupo Afectado</label>
                  <input
                    type="text"
                    placeholder="Ej. 20240101 o Grupo 401"
                    value={detalleSistemas.matricula_estudiante_afectado}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, matricula_estudiante_afectado: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">URL del Módulo</label>
                  <input
                    type="text"
                    value={detalleSistemas.url_modulo}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, url_modulo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Código de Error HTTP</label>
                  <input
                    type="text"
                    placeholder="500, 403, 404..."
                    value={detalleSistemas.codigo_error_http}
                    onChange={(e) => setDetalleSistemas({ ...detalleSistemas, codigo_error_http: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando en MongoDB Atlas...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Crear Ticket de Incidencia</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
