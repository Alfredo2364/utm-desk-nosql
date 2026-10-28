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
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'admin':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'directivo':
        return <BarChart3 className="w-3.5 h-3.5 text-purple-400" />;
      case 'supervisor':
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'tecnico':
        return <Wrench className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <GraduationCap className="w-3.5 h-3.5 text-slate-300" />;
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
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-white shadow-xs font-black text-xs ${
                  rol === 'superadmin' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600'
                }`}
              >
                UTM
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  DESK
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  NoSQL Cloud
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs según el Rol (Tabla 4) */}
          <nav className="hidden md:flex items-center space-x-1 text-xs">
            {canViewTickets && (
              <button
                onClick={() => onChangeNav('dashboard')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeNav === 'dashboard'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeNav === 'analitica' || rol === 'directivo'
                    ? 'bg-slate-800 text-purple-300 font-semibold'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analítica & Reportes</span>
              </button>
            )}

            {canViewCatalogos && (
              <button
                onClick={() => onChangeNav('catalogos')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeNav === 'catalogos'
                    ? 'bg-slate-800 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Catálogos (Usuarios / Edificios)</span>
              </button>
            )}
          </nav>

          {/* Acciones Globales y Usuario Autenticado */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Rastrear por Folio Oficial */}
            {canViewTickets && (
              <form onSubmit={handleTrackSubmit} className="hidden lg:flex items-center relative">
                <input
                  type="text"
                  placeholder="Folio (INC-2026-0001)..."
                  value={trackFolioInput}
                  onChange={(e) => setTrackFolioInput(e.target.value)}
                  className="pl-7 pr-2 py-1 rounded bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-[11px] font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-44 transition-all focus:w-52"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </form>
            )}

            {/* Indicador del Usuario Activo (sin selector de cambio rápido) */}
            {currentUser && (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md border bg-slate-800/90 border-slate-700 text-xs">
                <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center shrink-0">
                  {getRoleIcon(currentUser.rol)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-100 block text-[11px] leading-tight truncate max-w-[140px]">
                    {currentUser.nombre?.split(' ')[0]} {currentUser.nombre?.split(' ')[1] || ''}
                  </span>
                  <span className="text-[9px] uppercase font-mono block leading-none text-slate-400">
                    {currentUser.rol}
                  </span>
                </div>
              </div>
            )}

            {/* Refrescar datos */}
            <button
              onClick={onRefresh}
              title="Refrescar datos"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Registrar Incidencia (Solo Reportante, Supervisor, Admin y SuperAdmin según Tabla 4) */}
            {canCreateTicket && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Incidencia</span>
              </button>
            )}

            {/* Cerrar Sesión */}
            {currentUser && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-300 hover:text-rose-300 hover:bg-slate-800 rounded-md transition-colors border border-slate-700 text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
