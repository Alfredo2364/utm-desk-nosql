import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { recuperarPassword, restablecerPassword } from '../services/api';

export default function PasswordRecoveryModal({ isOpen, onClose, onSuccessEmail }) {
  const [step, setStep] = useState(1); // 1: Solicitar código | 2: Ingresar PIN y nueva contraseña
  const [email, setEmail] = useState('');
  const [codigoPIN, setCodigoPIN] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Paso 1: Solicitar Código de Recuperación
  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await recuperarPassword(email.trim());
      setCodigoGenerado(res.codigoRecuperacion);
      setCodigoPIN(res.codigoRecuperacion); // Auto-rellenar para comodidad
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Restablecer Contraseña
  const handleRestablecer = async (e) => {
    e.preventDefault();
    if (!codigoPIN.trim() || !nuevaPassword) return;

    if (nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden. Verifique ambos campos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await restablecerPassword(email.trim(), codigoPIN.trim(), nuevaPassword);
      setSuccessMsg('Contraseña actualizada y encriptada exitosamente en MongoDB Atlas.');
      setTimeout(() => {
        if (onSuccessEmail) onSuccessEmail(email.trim());
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (codigoGenerado) {
      navigator.clipboard.writeText(codigoGenerado);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Recuperación de Contraseña Institucional
              </h3>
              <p className="text-[10px] text-slate-400">Verificación segura con tokens en MongoDB Atlas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-md flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-md flex items-center space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            /* Paso 1: Ingreso de correo institucional */
            <form onSubmit={handleSolicitarCodigo} className="space-y-4">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Ingrese su correo electrónico institucional registrado (`@utm.mx`). Generaremos un código PIN temporal de verificación válido por 15 minutos.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="usuario@utm.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-white focus:ring-1 focus:ring-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-slate-400 hover:text-white font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-md shadow-xs disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <span>Solicitar Código PIN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Paso 2: Ingreso de código PIN y nueva contraseña */
            <form onSubmit={handleRestablecer} className="space-y-3.5">
              {codigoGenerado && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Código PIN generado para <strong>{email}</strong>:</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-emerald-400 hover:text-emerald-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="text-xl font-mono font-black text-center text-emerald-400 tracking-widest py-1 bg-slate-900 rounded border border-slate-800">
                    {codigoGenerado}
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono">
                    Válido por 15 minutos en MongoDB Atlas
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Código PIN de Verificación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 654321"
                  value={codigoPIN}
                  onChange={(e) => setCodigoPIN(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-wider text-sm focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium">Nueva Contraseña (mín. 6 caracteres) *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ← Cambiar correo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow-xs disabled:opacity-50 transition-colors text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Actualizando con bcrypt...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar Nueva Contraseña</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
