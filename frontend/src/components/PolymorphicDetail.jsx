import React from 'react';
import {
  Cpu,
  Wrench,
  GraduationCap,
  Wifi,
  Server,
  AlertTriangle,
  Zap,
  Globe,
  HardDrive,
  Hash,
  ShieldAlert,
} from 'lucide-react';

export default function PolymorphicDetail({ categoria, detalle }) {
  if (!detalle) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm italic">
        Sin detalles específicos registrados para esta categoría.
      </div>
    );
  }

  // 1. Cómputo y Telecomunicaciones
  if (categoria === 'computo_telecomunicaciones') {
    return (
      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-blue-200/60">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Detalle Polimórfico: Cómputo y Telecomunicaciones
            </h4>
            <p className="text-xs text-blue-800">
              Metadatos técnicos de hardware, red institucional y direccionamiento IP
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Tipo de Dispositivo</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              {detalle.tipo_dispositivo || 'No especificado'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Marca / Modelo</span>
            <span className="font-semibold text-slate-800">
              {detalle.marca_modelo || 'No especificado'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">No. Serie / Activo UTM</span>
            <span className="font-mono font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
              {detalle.numero_serie_activo || 'S/N'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Dirección IP Asignada</span>
            <span className="font-mono text-blue-700 font-semibold">
              {detalle.direccion_ip || 'DHCP Dinámico'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Dirección Física (MAC)</span>
            <span className="font-mono text-slate-700">
              {detalle.mac_address || 'No registrada'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Tipo de Falla de Red</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Wifi className="w-3 h-3 text-amber-600" />
              {detalle.tipo_falla_red || 'Falla física'}
            </span>
          </div>

          {detalle.sistema_operativo && (
            <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs col-span-1 sm:col-span-2">
              <span className="text-slate-500 block mb-1">Sistema Operativo / Firmware</span>
              <span className="font-medium text-slate-800">{detalle.sistema_operativo}</span>
            </div>
          )}

          {detalle.software_afectado && (
            <div className="bg-white/90 p-3 rounded-lg border border-blue-100 shadow-xs col-span-1 sm:col-span-3">
              <span className="text-slate-500 block mb-1">VLAN / Software Afectado</span>
              <span className="font-medium text-slate-800">{detalle.software_afectado}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Infraestructura y Mantenimiento
  if (categoria === 'infraestructura_mantenimiento') {
    return (
      <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-amber-200/60">
          <div className="p-2 bg-amber-600 text-white rounded-lg shadow-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Detalle Polimórfico: Infraestructura y Mantenimiento
            </h4>
            <p className="text-xs text-amber-800">
              Evaluación de daños en inmuebles, redes hidráulicas y riesgos de seguridad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/90 p-3 rounded-lg border border-amber-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Tipo de Servicio Requerido</span>
            <span className="font-semibold text-slate-800 capitalize">
              {detalle.tipo_servicio ? detalle.tipo_servicio.replace('_', ' ') : 'General'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Nivel de Urgencia</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                detalle.nivel_urgencia === 'emergencia_riesgo'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {detalle.nivel_urgencia ? detalle.nivel_urgencia.replace('_', ' ') : 'Estándar'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Corte de Suministro</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                detalle.requiere_corte_suministro
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {detalle.requiere_corte_suministro ? '⚠️ SÍ REQUIERE CORTE' : 'No requerido'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-100 shadow-xs sm:col-span-2">
            <span className="text-slate-500 block mb-1">Descripción del Daño Físico</span>
            <span className="font-medium text-slate-800">{detalle.tipo_dano || 'No especificado'}</span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Suministro Afectado</span>
            <span className="font-medium text-slate-800 capitalize flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              {detalle.tipo_suministro_afectado ? detalle.tipo_suministro_afectado.replace('_', ' ') : 'Ninguno'}
            </span>
          </div>

          {detalle.afecta_seguridad_personal && (
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 sm:col-span-3 flex items-center space-x-2 text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs">
                Atención: Esta incidencia compromete la seguridad física de los ocupantes del campus.
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
      <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/40 border border-purple-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-purple-200/60">
          <div className="p-2 bg-purple-600 text-white rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Detalle Polimórfico: Sistemas y Servicios Académicos
            </h4>
            <p className="text-xs text-purple-800">
              Plataformas institucionales universitarias, SICE, Moodle y servicios estudiantiles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Plataforma Afectada</span>
            <span className="font-bold text-purple-900 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-600" />
              {detalle.plataforma || 'No especificada'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Módulo del Sistema</span>
            <span className="font-semibold text-slate-800">
              {detalle.modulo_afectado || 'General'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Matrícula / Afectados</span>
            <span className="font-mono font-medium text-slate-800">
              {detalle.matricula_estudiante_afectado || 'Sin matrícula'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs sm:col-span-2">
            <span className="text-slate-500 block mb-1">URL del Módulo o Endpoint</span>
            <span className="font-mono text-purple-700 truncate block">
              {detalle.url_modulo || 'No provista'}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs">
            <span className="text-slate-500 block mb-1">Código de Error HTTP</span>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {detalle.codigo_error_http || 'Error de Aplicación'}
            </span>
          </div>

          {detalle.navegador_utilizado && (
            <div className="bg-white/90 p-3 rounded-lg border border-purple-100 shadow-xs sm:col-span-3">
              <span className="text-slate-500 block mb-1">Navegador y Sistema Operativo del Cliente</span>
              <span className="text-slate-800 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                {detalle.navegador_utilizado}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback si no encaja en ninguna categoría conocida
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <pre className="text-xs text-slate-700 overflow-x-auto">
        {JSON.stringify(detalle, null, 2)}
      </pre>
    </div>
  );
}
