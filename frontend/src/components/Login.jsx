import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordRecoveryModal from './PasswordRecoveryModal';

export default function Login() {
  const { login, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor ingrese su correo electrónico institucional.');
      return;
    }
    if (!password) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-slate-800 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Encabezado Institucional */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SISTEMA INSTITUCIONAL • UTM</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            UTM Desk NoSQL Cloud
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sistema Integral de Gestión, Resolución y Analítica de Incidencias en el Campus
          </p>
        </div>

        {/* Card de Autenticación Manual */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md p-6 sm:p-8 space-y-5">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Iniciar Sesión
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Ingresa tus credenciales institucionales para acceder al sistema.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-md flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Correo Institucional *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="usuario@utm.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-md bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Contraseña *</label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline font-mono cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-md bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autenticación protegida con bcrypt</span>
            </div>
            <span>División TIC - UTM</span>
          </div>
        </div>
      </div>

      {showRecoveryModal && (
        <PasswordRecoveryModal
          onClose={() => setShowRecoveryModal(false)}
          onSuccessReset={(resetEmail, newPass) => {
            setEmail(resetEmail);
            setPassword(newPass);
          }}
        />
      )}
    </div>
  );
}
