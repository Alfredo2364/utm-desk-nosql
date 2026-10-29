import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Wrench,
  GraduationCap,
  Building,
  Search,
  LogOut,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenNewModal,
  onRefresh,
  activeNav,
  onChangeNav,
  onTrackFolio,
}) {
  const { currentUser, rol, logout } = useAuth();
  const [trackFolioInput, setTrackFolioInput] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackFolioInput.trim() && onTrackFolio) {
      onTrackFolio(trackFolioInput.trim().toUpperCase());
      setTrackFolioInput('');
    }
  };

  const getRoleIcon = (userRole) => {
    switch (userRole) {
      case 'superadmin':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'admin':
        return <Sparkles className="w-4 h-4 text-rose-400" />;
      case 'directivo':
        return <BarChart3 className="w-4 h-4 text-purple-400" />;
      case 'supervisor':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      case 'tecnico':
        return <Wrench className="w-4 h-4 text-emerald-400" />;
      default:
        return <GraduationCap className="w-4 h-4 text-slate-300" />;
    }
  };

  // Permisos estrictos según Tabla 4 del ERS Cloud
  const canCreateTicket =
    rol === 'reportante' || rol === 'supervisor' || rol === 'admin' || rol === 'superadmin';
  const canViewTickets =
    rol === 'reportante' ||
    rol === 'tecnico' ||
    rol === 'supervisor' ||
    rol === 'admin' ||
    rol === 'superadmin';
  const canViewAnalitica =
    rol === 'directivo' || rol === 'supervisor' || rol === 'admin' || rol === 'superadmin';
  const canViewCatalogos = rol === 'admin' || rol === 'superadmin';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-slate-200 shadow-md">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Izquierda: Identidad + Navegación Principal */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Brand */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs font-black text-xs ${
                  rol === 'superadmin' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600'
                }`}
              >
                UTM
              </div>
              <div className="flex items-baseline space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  DESK
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  NoSQL Cloud
                </span>
              </div>
            </div>

            {/* Navigation Tabs según el Rol (Tabla 4) */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs">
              {canViewTickets && (
                <button
                  onClick={() => onChangeNav('dashboard')}
                  className={`px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeNav === 'dashboard'
                      ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {rol === 'superadmin'
                    ? 'Consola General'
                    : rol === 'reportante'
                    ? 'Mis Incidencias'
                    : rol === 'tecnico'
                    ? 'Bandeja de mi Área'
                    : rol === 'supervisor'
                    ? 'Supervisión Global'
                    : 'Gestión Operativa'}
                </button>
              )}

              {canViewAnalitica && (
                <button
                  onClick={() => onChangeNav('analitica')}
                  className={`px-3.5 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeNav === 'analitica' || rol === 'directivo'
                      ? 'bg-slate-800 text-purple-300 border border-slate-700 shadow-xs'
                      : 'text-slate-300 hover:text-purple-300 hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Analítica y Reportes</span>
                </button>
              )}

              {canViewCatalogos && (
                <button
                  onClick={() => onChangeNav('catalogos')}
                  className={`px-3.5 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeNav === 'catalogos'
                      ? 'bg-slate-800 text-indigo-300 border border-slate-700 shadow-xs'
                      : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>Catálogos</span>
                </button>
              )}
            </nav>
          </div>

          {/* Derecha: Buscador de Folio, Perfil Activo y Botones de Acción */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Rastrear por Folio Oficial */}
            {canViewTickets && (
              <form onSubmit={handleTrackSubmit} className="relative hidden xl:flex items-center">
                <input
                  type="text"
                  placeholder="Folio (INC-2026-0001)..."
                  value={trackFolioInput}
                  onChange={(e) => setTrackFolioInput(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-48 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </form>
            )}

            {/* Indicador del Usuario Activo */}
            {currentUser && (
              <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border bg-slate-800/90 border-slate-700 text-xs whitespace-nowrap">
                <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                  {getRoleIcon(currentUser.rol)}
                </div>
                <div className="text-left">
                  <span className="font-semibold text-slate-100 block text-xs leading-tight">
                    {currentUser.nombre?.split(' ')[0]} {currentUser.nombre?.split(' ')[1] || ''}
                  </span>
                  <span className="text-[10px] uppercase font-mono block leading-none text-slate-400 mt-0.5">
                    {currentUser.rol}
                  </span>
                </div>
              </div>
            )}

            {/* Refrescar datos */}
            <button
              onClick={onRefresh}
              title="Refrescar datos"
              className="p-2 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Registrar Incidencia (Solo Reportante, Supervisor, Admin y SuperAdmin según Tabla 4) */}
            {canCreateTicket && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Registrar Incidencia</span>
              </button>
            )}

            {/* Cerrar Sesión */}
            {currentUser && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-slate-200 hover:text-rose-200 bg-slate-800 hover:bg-rose-950/70 rounded-lg transition-colors border border-slate-700 hover:border-rose-700 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
