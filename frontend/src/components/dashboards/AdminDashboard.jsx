import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  BarChart3,
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  UserCheck,
  AlertCircle,
  Settings,
} from 'lucide-react';
import SupervisorDashboard from './SupervisorDashboard';
import DirectivoDashboard from './DirectivoDashboard';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEdificios,
  createEdificio,
  updateEdificio,
  deleteEdificio,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard({
  incidencias = [],
  estadisticas = {},
  loading,
  onSelectIncidencia,
  onRefresh,
  onOpenNewModal,
  defaultTab = 'operativa',
}) {
  const { currentUser, usuariosDemo } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab); // 'operativa' | 'analitica' | 'usuarios' | 'edificios'

  // Estados Catálogo de Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    nombre: '',
    email: '',
    rol: 'reportante',
    area: 'general',
    cargo: '',
    departamento_carrera: '',
  });

  // Estados Catálogo de Edificios
  const [edificios, setEdificios] = useState([]);
  const [loadingEdificios, setLoadingEdificios] = useState(false);
  const [showEdificioModal, setShowEdificioModal] = useState(false);
  const [edificioFormData, setEdificioFormData] = useState({
    codigo: '',
    nombre: '',
    pisos: 2,
    responsable: '',
    descripcion: '',
    nuevaAulaCodigo: '',
    nuevaAulaNombre: '',
    aulas: [],
  });

  // Cargar Catálogos
  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      console.warn('Error al cargar usuarios:', err.message);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchEdificios = async () => {
    setLoadingEdificios(true);
    try {
      const data = await getEdificios();
      setEdificios(data.edificios || []);
    } catch (err) {
      console.warn('Error al cargar edificios:', err.message);
    } finally {
      setLoadingEdificios(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchEdificios();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios') fetchUsuarios();
    if (activeTab === 'edificios') fetchEdificios();
  }, [activeTab]);

  // Manejadores CRUD Usuarios
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUsuario(editingUser._id, userFormData);
      } else {
        await createUsuario(userFormData);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserFormData({
        nombre: '',
        email: '',
        rol: 'reportante',
        area: 'general',
        cargo: '',
        departamento_carrera: '',
      });
      fetchUsuarios();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${nombre}?`)) return;
    try {
      await deleteUsuario(id);
      fetchUsuarios();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Manejadores CRUD Edificios
  const handleSaveEdificio = async (e) => {
    e.preventDefault();
    try {
      await createEdificio({
        codigo: edificioFormData.codigo,
        nombre: edificioFormData.nombre,
        pisos: Number(edificioFormData.pisos),
        responsable: edificioFormData.responsable,
        descripcion: edificioFormData.descripcion,
        aulas: edificioFormData.aulas,
      });
      setShowEdificioModal(false);
      setEdificioFormData({
        codigo: '',
        nombre: '',
        pisos: 2,
        responsable: '',
        descripcion: '',
        nuevaAulaCodigo: '',
        nuevaAulaNombre: '',
        aulas: [],
      });
      fetchEdificios();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteEdificio = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el edificio ${nombre}?`)) return;
    try {
      await deleteEdificio(id);
      fetchEdificios();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddAulaToList = () => {
    if (!edificioFormData.nuevaAulaCodigo || !edificioFormData.nuevaAulaNombre) return;
    setEdificioFormData({
      ...edificioFormData,
      aulas: [
        ...edificioFormData.aulas,
        {
          codigo: edificioFormData.nuevaAulaCodigo.toUpperCase(),
          nombre: edificioFormData.nuevaAulaNombre,
          tipo: 'aula',
          piso: 'Piso 1',
        },
      ],
      nuevaAulaCodigo: '',
      nuevaAulaNombre: '',
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Enterprise Admin */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Consola Maestra de Administración
            </h1>
            <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase">
              ADMIN CONTROL TOTAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión operativa transversal, BI directivo y administración de catálogos maestros institucionales
          </p>
        </div>

        {/* Tab Navigation Enterprise */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('operativa')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'operativa'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operativa
          </button>
          <button
            onClick={() => setActiveTab('analitica')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analitica'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analítica
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Usuarios ({usuarios.length})
          </button>
          <button
            onClick={() => setActiveTab('edificios')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'edificios'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Edificios ({edificios.length})
          </button>
        </div>
      </div>

      {/* Renderizado de la Pestaña Activa */}
      {activeTab === 'operativa' && (
        <SupervisorDashboard
          incidencias={incidencias}
          estadisticas={estadisticas}
          loading={loading}
          onSelectIncidencia={onSelectIncidencia}
          onRefresh={onRefresh}
          onOpenNewModal={onOpenNewModal}
          onNavigateToAnalitica={() => setActiveTab('analitica')}
        />
      )}

      {activeTab === 'analitica' && <DirectivoDashboard />}

      {/* 3. CRUD Catálogo de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Catálogo Maestro de Usuarios del Campus ({usuarios.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gestión de cuentas institucionales, asignación de roles RBAC y áreas técnicas de especialidad
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({
                  nombre: '',
                  email: '',
                  rol: 'reportante',
                  area: 'general',
                  cargo: '',
                  departamento_carrera: '',
                });
                setShowUserModal(true);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          {loadingUsuarios ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Cargando usuarios desde MongoDB Atlas...
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Nombre</th>
                    <th className="px-4 py-2.5">Correo Institucional</th>
                    <th className="px-4 py-2.5">Rol RBAC</th>
                    <th className="px-4 py-2.5">Área Especialidad</th>
                    <th className="px-4 py-2.5">Cargo / Carrera</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{u.nombre}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">
                        {u.area?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.cargo || u.departamento_carrera}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserFormData({
                              nombre: u.nombre,
                              email: u.email,
                              rol: u.rol,
                              area: u.area || 'general',
                              cargo: u.cargo || '',
                              departamento_carrera: u.departamento_carrera || '',
                            });
                            setShowUserModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Editar Usuario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.nombre)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. CRUD Catálogo de Edificios y Aulas */}
      {activeTab === 'edificios' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Catálogo Maestro de Edificios y Espacios Físicos ({edificios.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Estructura física del campus universitario para ubicación y enrutamiento exacto de incidencias
              </p>
            </div>

            <button
              onClick={() => setShowEdificioModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Edificio</span>
            </button>
          </div>

          {loadingEdificios ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Cargando edificios desde MongoDB Atlas...
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {edificios.map((edif) => (
                <div key={edif._id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs bg-slate-200 text-slate-900 px-2 py-0.5 rounded border border-slate-300">
                        {edif.codigo}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{edif.nombre}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteEdificio(edif._id, edif.nombre)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Eliminar Edificio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-slate-500 text-[11px]">{edif.descripcion}</p>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1 text-[11px]">
                      Aulas y Laboratorios ({edif.aulas?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {edif.aulas?.map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white text-slate-700 rounded border border-slate-200 text-[10px] font-mono font-medium"
                        >
                          {a.codigo} - {a.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Nuevo/Editar Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                {editingUser ? 'Editar Registro de Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userFormData.nombre}
                  onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono focus:border-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Rol RBAC *</label>
                  <select
                    value={userFormData.rol}
                    onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-slate-900"
                  >
                    <option value="reportante">Reportante</option>
                    <option value="tecnico">Técnico</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="directivo">Directivo</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Área Técnica</label>
                  <select
                    value={userFormData.area}
                    onChange={(e) => setUserFormData({ ...userFormData, area: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  >
                    <option value="general">General</option>
                    <option value="computo_telecomunicaciones">Cómputo & Redes</option>
                    <option value="infraestructura_mantenimiento">Infraestructura</option>
                    <option value="sistemas_servicios_academicos">Sistemas Académicos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Cargo / Departamento</label>
                <input
                  type="text"
                  value={userFormData.cargo}
                  onChange={(e) => setUserFormData({ ...userFormData, cargo: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Edificio */}
      {showEdificioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Registrar Edificio</h3>
              <button onClick={() => setShowEdificioModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdificio} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="EDIF-E"
                    value={edificioFormData.codigo}
                    onChange={(e) => setEdificioFormData({ ...edificioFormData, codigo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-mono text-xs focus:border-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Edificio E - Posgrado"
                    value={edificioFormData.nombre}
                    onChange={(e) => setEdificioFormData({ ...edificioFormData, nombre: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Responsable</label>
                <input
                  type="text"
                  value={edificioFormData.responsable}
                  onChange={(e) => setEdificioFormData({ ...edificioFormData, responsable: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900"
                />
              </div>

              {/* Agregar Aulas */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-700 block text-[11px]">Aulas / Laboratorios a vincular:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cod (E-101)"
                    value={edificioFormData.nuevaAulaCodigo}
                    onChange={(e) => setEdificioFormData({ ...edificioFormData, nuevaAulaCodigo: e.target.value })}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Nombre Aula"
                    value={edificioFormData.nuevaAulaNombre}
                    onChange={(e) => setEdificioFormData({ ...edificioFormData, nuevaAulaNombre: e.target.value })}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAulaToList}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {edificioFormData.aulas.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                      {a.codigo} ({a.nombre})
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEdificioModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold"
                >
                  Guardar Edificio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
