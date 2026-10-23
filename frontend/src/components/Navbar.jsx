import React, { useState } from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  ChevronDown,
  BarChart3,
  Layers,
  Wrench,
  GraduationCap,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenNewModal,
  onSeedData,
  isSeeding,
  onRefresh,
  activeNav,
  onChangeNav,
}) {
  const { currentUser, rol, usuariosDemo, cambiarUsuarioDemo } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'reportante':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tecnico':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'directivo':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleIcon = (userRole) => {
    switch (userRole) {
      case 'tecnico':
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case 'supervisor':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'directivo':
        return <BarChart3 className="w-3.5 h-3.5 text-purple-600" />;
      case 'admin':
        return <Sparkles className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <GraduationCap className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const canCreateTicket = rol === 'reportante' || rol === 'supervisor' || rol === 'admin';
  const canViewAnalitica = rol === 'directivo' || rol === 'supervisor' || rol === 'admin';
  const canViewCatalogos = rol === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  UTM <span className="text-emerald-600">Desk</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RBAC Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Control de Acceso Basado en Roles • MongoDB Atlas & Supabase
              </p>
            </div>
          </div>

          {/* Enlaces de Navegación según Rol */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold">
            <button
              onClick={() => onChangeNav('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeNav === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Bandeja Operativa
            </button>

            {canViewAnalitica && (
              <button
                onClick={() => onChangeNav('analitica')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeNav === 'analitica'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analítica Directiva</span>
              </button>
            )}

            {canViewCatalogos && (
              <button
                onClick={() => onChangeNav('catalogos')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeNav === 'catalogos'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Catálogos (CRUD)</span>
              </button>
            )}
          </nav>

          {/* Persona Switcher & Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Selector de Rol / Persona Demo */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs"
                title="Cambiar perfil de usuario para probar la matriz de permisos"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  {getRoleIcon(currentUser.rol)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-bold text-slate-800 truncate max-w-[130px] leading-tight">
                    {currentUser.nombre}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize leading-tight">
                    Rol: {currentUser.rol}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Menú Desplegable con Personas Demo */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Alternar Perfil Demo (RBAC)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Selecciona un rol para probar sus permisos y vistas específicas:
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {usuariosDemo.map((u) => {
                      const isSelected = u.email.toLowerCase() === currentUser.email.toLowerCase();
                      return (
                        <button
                          key={u.email}
                          onClick={() => {
                            cambiarUsuarioDemo(u.email);
                            setDropdownOpen(false);
                            onChangeNav('dashboard');
                          }}
                          className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2.5 ${
                            isSelected ? 'bg-emerald-50/80 font-bold' : ''
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            {getRoleIcon(u.rol)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 truncate block">
                                {u.nombre}
                              </span>
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold border ${getRoleBadgeStyle(
                                  u.rol
                                )}`}
                              >
                                {u.rol}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {u.email}
                            </div>
                            <div className="text-[10px] text-emerald-700 capitalize mt-0.5">
                              {u.cargo || u.area?.replace('_', ' ')}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Refrescar */}
            <button
              onClick={onRefresh}
              title="Refrescar datos"
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Sembrar Demo */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Restaurar base de datos con usuarios y datos demo"
              className="hidden xl:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSeeding ? 'Sembrando...' : 'Reset Datos'}</span>
            </button>

            {/* Nueva Incidencia (Solo roles autorizados) */}
            {canCreateTicket && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Incidencia</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
