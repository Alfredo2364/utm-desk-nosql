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
  Lock,
} from 'lucide-react';
import { createIncidencia, getEdificios } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CANONICAL_EDIFICIOS = [
  {
    clave: 'ED-A',
    codigo: 'ED-A',
    nombre: 'Edificio A - Tecnologías de la Información',
    pisos: 3,
    aulas: [
      { codigo: 'A-101', nombre: 'Aula 101', piso: 'Planta Baja' },
      { codigo: 'A-102', nombre: 'Laboratorio de cómputo', piso: 'Planta Baja' },
      { codigo: 'L-02', nombre: 'Laboratorio de Redes y Telecomunicaciones L-02', piso: 'Piso 2' },
    ],
  },
  {
    clave: 'ED-B',
    codigo: 'ED-B',
    nombre: 'Edificio B - Ciencias Básicas y Laboratorios',
    pisos: 2,
    aulas: [
      { codigo: 'B-101', nombre: 'Aula Magna B-101', piso: 'Planta Baja' },
      { codigo: 'B-204', nombre: 'Laboratorio B-204', piso: 'Piso 2' },
    ],
  },
  {
    clave: 'ED-C',
    codigo: 'ED-C',
    nombre: 'Edificio C - Servicios Académicos y Control Escolar',
    pisos: 2,
    aulas: [
      { codigo: 'C-001', nombre: 'Sala de Captura Docente y Control Escolar C-001', piso: 'Planta Baja' },
      { codigo: 'ESC-03', nombre: 'Ventanilla 3 de Control Escolar', piso: 'Piso 1' },
    ],
  },
  {
    clave: 'ED-D',
    codigo: 'ED-D',
    nombre: 'Edificio D - Aulas Multimedia e Innovación',
    pisos: 2,
    aulas: [
      { codigo: 'D-204', nombre: 'Aula Inteligente D-204', piso: 'Piso 2' },
      { codigo: 'D-205', nombre: 'Aula de Seminarios D-205', piso: 'Piso 2' },
    ],
  },
];

function formatRolDisplay(rol) {
  const r = (rol || '').toLowerCase().trim();
  const map = {
    reportante: 'Estudiante / Reportante',
    estudiante: 'Estudiante Universitario',
    docente: 'Docente / Investigador',
    administrativo: 'Personal Administrativo',
    tecnico: 'Técnico Especialista',
    supervisor: 'Supervisor de Campus',
    directivo: 'Directivo de la UTM',
    admin: 'Administrador Maestro',
    superadmin: 'Super Administrador General',
  };
  return map[r] || rol || 'Estudiante';
}

export default function NewIncidentModal({ isOpen, onClose, onIncidentCreated }) {
  const { currentUser } = useAuth();
  const [categoria, setCategoria] = useState('computo_telecomunicaciones');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Catálogo de Edificios precargados para selección rápida
  const [edificiosList, setEdificiosList] = useState(CANONICAL_EDIFICIOS);
  const [selectedEdificioKey, setSelectedEdificioKey] = useState('ED-A');
  const [selectedAulaKey, setSelectedAulaKey] = useState('A-101');
  const [isCustomEdificio, setIsCustomEdificio] = useState(false);
  const [isCustomAula, setIsCustomAula] = useState(false);

  // Datos base
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    canal_origen: 'portal_autoservicio',
    edificio: 'Edificio A - Tecnologías de la Información',
    aula_laboratorio: 'Aula 101',
    piso: 'Planta Baja',
    referencias: '',
    reportante_nombre: currentUser?.nombre || '',
    reportante_email: currentUser?.email || '',
    reportante_rol: currentUser?.rol === 'reportante' ? 'estudiante' : currentUser?.rol || 'estudiante',
    reportante_departamento: currentUser?.departamento_carrera || '',
  });

  useEffect(() => {
    getEdificios()
      .then((data) => {
        if (data && data.edificios && data.edificios.length > 0) {
          setEdificiosList(data.edificios);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        reportante_nombre: currentUser.nombre || '',
        reportante_email: currentUser.email || '',
        reportante_rol: currentUser.rol === 'reportante' ? 'estudiante' : currentUser.rol || 'estudiante',
        reportante_departamento: currentUser.departamento_carrera || prev.reportante_departamento || '',
      }));
    }
  }, [currentUser]);

  const handleEdificioSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomEdificio(true);
      setIsCustomAula(true);
      setFormData((prev) => ({
        ...prev,
        edificio: '',
        aula_laboratorio: '',
        piso: '',
      }));
      return;
    }

    setIsCustomEdificio(false);
    setSelectedEdificioKey(val);

    const edif = edificiosList.find(
      (item) => (item.clave || item.codigo) === val || item.nombre === val
    );
    if (edif) {
      const edifNombre = edif.nombre || edif.clave;
      const firstAula = edif.aulas && edif.aulas.length > 0 ? edif.aulas[0] : null;
      setIsCustomAula(false);
      setSelectedAulaKey(firstAula ? (firstAula.codigo || firstAula.nombre) : '');
      setFormData((prev) => ({
        ...prev,
        edificio: edifNombre,
        aula_laboratorio: firstAula ? firstAula.nombre : 'Aula General',
        piso: firstAula ? (firstAula.piso || 'Planta Baja') : 'Planta Baja',
      }));
    }
  };

  const handleAulaSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomAula(true);
      setFormData((prev) => ({ ...prev, aula_laboratorio: '', piso: '' }));
      return;
    }

    setIsCustomAula(false);
    setSelectedAulaKey(val);
    const edif = edificiosList.find(
      (item) => (item.clave || item.codigo) === selectedEdificioKey || item.nombre === selectedEdificioKey
    );
    const aula = edif?.aulas?.find((a) => (a.codigo || a.nombre) === val);
    if (aula) {
      setFormData((prev) => ({
        ...prev,
        aula_laboratorio: aula.nombre,
        piso: aula.piso || prev.piso || 'Planta Baja',
      }));
    }
  };

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
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] uppercase tracking-wider">Ubicación Física</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Catálogo Campus
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Edificio del Campus *
                </label>
                <select
                  value={isCustomEdificio ? '__custom__' : selectedEdificioKey}
                  onChange={handleEdificioSelect}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {edificiosList.map((edif) => {
                    const key = edif.clave || edif.codigo || edif.nombre;
                    return (
                      <option key={key} value={key}>
                        {edif.nombre} ({edif.clave || edif.codigo})
                      </option>
                    );
                  })}
                  <option value="__custom__">+ Otro edificio / ubicación manual...</option>
                </select>
                {isCustomEdificio && (
                  <input
                    type="text"
                    required
                    placeholder="Escriba el nombre del edificio..."
                    value={formData.edificio}
                    onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                    className="mt-1.5 w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 bg-slate-50"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Aula / Laboratorio *
                  </label>
                  {!isCustomEdificio && !isCustomAula ? (
                    <select
                      value={selectedAulaKey}
                      onChange={handleAulaSelect}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium focus:border-slate-900 bg-white"
                    >
                      {(() => {
                        const currentEdif = edificiosList.find(
                          (item) => (item.clave || item.codigo) === selectedEdificioKey || item.nombre === selectedEdificioKey
                        );
                        const aulas = currentEdif?.aulas || [];
                        return (
                          <>
                            {aulas.map((a) => {
                              const aKey = a.codigo || a.nombre;
                              return (
                                <option key={aKey} value={aKey}>
                                  {a.nombre} ({a.codigo})
                                </option>
                              );
                            })}
                            <option value="__custom__">+ Otra aula / manual...</option>
                          </>
                        );
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Ej. Aula 101, Cubículo 4..."
                      value={formData.aula_laboratorio}
                      onChange={(e) => setFormData({ ...formData, aula_laboratorio: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 bg-white"
                    />
                  )}
                  {isCustomAula && !isCustomEdificio && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomAula(false);
                        const currentEdif = edificiosList.find(
                          (item) => (item.clave || item.codigo) === selectedEdificioKey || item.nombre === selectedEdificioKey
                        );
                        if (currentEdif?.aulas?.[0]) {
                          setSelectedAulaKey(currentEdif.aulas[0].codigo || currentEdif.aulas[0].nombre);
                          setFormData((prev) => ({
                            ...prev,
                            aula_laboratorio: currentEdif.aulas[0].nombre,
                            piso: currentEdif.aulas[0].piso || 'Planta Baja',
                          }));
                        }
                      }}
                      className="mt-1 text-[10px] text-slate-500 hover:text-slate-800 underline block"
                    >
                      ← Volver a lista de aulas
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Piso / Nivel
                  </label>
                  <input
                    type="text"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                    placeholder="Ej. Planta Baja, Piso 1..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Solicitante */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] uppercase tracking-wider">Datos del Solicitante</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <Lock className="w-2.5 h-2.5 inline" /> Rol Fijado
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="flex items-center justify-between text-slate-600 mb-1">
                    <span>Nombre Completo *</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      <Lock className="w-2.5 h-2.5 inline mr-0.5" /> Sesión
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formData.reportante_nombre}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-100 text-slate-700 text-xs font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="flex items-center justify-between text-slate-600 mb-1">
                    <span>Correo Institucional *</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      <Lock className="w-2.5 h-2.5 inline mr-0.5" /> Verificado
                    </span>
                  </label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={formData.reportante_email}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-100 text-slate-700 text-xs font-mono cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="flex items-center justify-between text-slate-600 mb-1">
                    <span>Rol Campus</span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 inline text-slate-400" /> Fijo
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formatRolDisplay(currentUser?.rol)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-100 text-slate-700 text-xs font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Departamento / Carrera</label>
                  <input
                    type="text"
                    value={formData.reportante_departamento}
                    onChange={(e) => setFormData({ ...formData, reportante_departamento: e.target.value })}
                    placeholder="Ej. Ing. en Computación"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 bg-white"
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
