import React from 'react';
import { Database, Plus, RefreshCw, Server, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenNewModal, onSeedData, isSeeding, onRefresh, health }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  UTM <span className="text-emerald-600">Desk</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NoSQL Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Gestión Polimórfica de Incidencias • MongoDB Atlas & Supabase Storage
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">MongoDB Atlas</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-medium">Supabase Storage</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              title="Refrescar bandeja"
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Cargar datos polimórficos de prueba"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSeeding ? 'Sembrando...' : 'Sembrar Demo'}</span>
            </button>

            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Incidencia</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
