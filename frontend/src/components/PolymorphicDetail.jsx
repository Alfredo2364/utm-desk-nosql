import React, { useState } from 'react';
import {
  Cpu,
  Wrench,
  GraduationCap,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Globe,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';

export default function PolymorphicDetail({ categoria, detalle }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (!detalle) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-500 text-xs italic">
        Sin especificaciones polimórficas registradas.
      </div>
    );
  }

  // 1. Cómputo y Telecomunicaciones
  if (categoria === 'computo_telecomunicaciones') {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Especificaciones Técnicas: Cómputo y Redes
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
            IT-ASSET-SPEC
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Tipo de Dispositivo</span>
            <span className="font-semibold text-slate-900 sm:col-span-2">
              {detalle.tipo_dispositivo || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Marca / Modelo</span>
            <span className="font-medium text-slate-800 sm:col-span-2">
              {detalle.marca_modelo || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Activo Fijo / No. Serie</span>
            <div className="sm:col-span-2 flex items-center space-x-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">
                {detalle.numero_serie_activo || 'S/N'}
              </span>
              {detalle.numero_serie_activo && (
                <button
                  onClick={() => copyToClipboard(detalle.numero_serie_activo, 'sn')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copiar número de serie"
                >
                  {copiedKey === 'sn' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Dirección IPv4</span>
            <div className="sm:col-span-2 flex items-center space-x-2">
              <span className="font-mono text-slate-900 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {detalle.direccion_ip || 'DHCP Dinámico'}
              </span>
              {detalle.direccion_ip && (
                <button
                  onClick={() => copyToClipboard(detalle.direccion_ip, 'ip')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copiar IP"
                >
                  {copiedKey === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Dirección MAC</span>
            <span className="font-mono text-slate-700 sm:col-span-2">
              {detalle.mac_address || 'No registrada'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Tipo de Falla de Red</span>
            <span className="sm:col-span-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 uppercase font-mono">
                {detalle.tipo_falla_red || 'Falla física'}
              </span>
            </span>
          </div>

          {detalle.sistema_operativo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
              <span className="text-slate-500 font-medium sm:col-span-1">Sistema Operativo / Firmware</span>
              <span className="text-slate-800 sm:col-span-2 font-mono text-[11px]">
                {detalle.sistema_operativo}
              </span>
            </div>
          )}

          {detalle.software_afectado && (
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
              <span className="text-slate-500 font-medium sm:col-span-1">VLAN / Software Afectado</span>
              <span className="text-slate-800 sm:col-span-2 font-medium">
                {detalle.software_afectado}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Infraestructura y Mantenimiento
  if (categoria === 'infraestructura_mantenimiento') {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Especificaciones: Infraestructura y Mantenimiento
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
            FACILITIES-SPEC
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Tipo de Servicio</span>
            <span className="font-semibold text-slate-900 sm:col-span-2 capitalize">
              {detalle.tipo_servicio ? detalle.tipo_servicio.replace('_', ' ') : 'General'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Nivel de Urgencia</span>
            <span className="sm:col-span-2">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] border ${
                  detalle.nivel_urgencia === 'emergencia_riesgo'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                {detalle.nivel_urgencia ? detalle.nivel_urgencia.replace('_', ' ').toUpperCase() : 'ESTÁNDAR'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Corte de Suministro</span>
            <span className="sm:col-span-2">
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                  detalle.requiere_corte_suministro
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {detalle.requiere_corte_suministro ? 'REQUIERE CORTE URGENTE' : 'NO REQUERIDO'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Diagnóstico Físico / Daño</span>
            <span className="text-slate-800 font-medium sm:col-span-2">
              {detalle.tipo_dano || 'No especificado'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Suministro Afectado</span>
            <span className="text-slate-800 sm:col-span-2 capitalize flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              {detalle.tipo_suministro_afectado ? detalle.tipo_suministro_afectado.replace('_', ' ') : 'Ninguno'}
            </span>
          </div>

          {detalle.afecta_seguridad_personal && (
            <div className="p-3 bg-rose-50/80 border-t border-rose-200 text-rose-800 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs">
                Protocolo de Seguridad: Esta falla compromete la integridad física del personal/alumnado.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Sistemas y Servicios Académicos
  if (categoria === 'sistemas_servicios_academicos') {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Especificaciones: Sistemas y Servicios Académicos
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
            ACADEMIC-SYSTEMS-SPEC
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Plataforma Afectada</span>
            <span className="font-bold text-slate-900 sm:col-span-2">
              {detalle.plataforma || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Módulo del Sistema</span>
            <span className="font-medium text-slate-800 sm:col-span-2">
              {detalle.modulo_afectado || 'General'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Matrícula / Usuarios Afectados</span>
            <span className="font-mono text-slate-800 sm:col-span-2">
              {detalle.matricula_estudiante_afectado || 'Sin matrícula'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Endpoint / URL Módulo</span>
            <div className="sm:col-span-2 flex items-center space-x-2 truncate">
              <span className="font-mono text-slate-800 text-[11px] truncate block">
                {detalle.url_modulo || 'No provista'}
              </span>
              {detalle.url_modulo && (
                <button
                  onClick={() => copyToClipboard(detalle.url_modulo, 'url')}
                  className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                  title="Copiar URL"
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
            <span className="text-slate-500 font-medium sm:col-span-1">Código de Error HTTP</span>
            <span className="sm:col-span-2">
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {detalle.codigo_error_http || 'Error 500'}
              </span>
            </span>
          </div>

          {detalle.navegador_utilizado && (
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50/50">
              <span className="text-slate-500 font-medium sm:col-span-1">Navegador del Cliente</span>
              <span className="text-slate-700 sm:col-span-2 font-mono text-[11px]">
                {detalle.navegador_utilizado}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-700">
      <pre className="overflow-x-auto">{JSON.stringify(detalle, null, 2)}</pre>
    </div>
  );
}
