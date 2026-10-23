import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building,
  CheckCircle2,
  PieChart,
  Flame,
  Loader2,
  RefreshCw,
  Shield,
  Layers,
} from 'lucide-react';
import {
  getMetricasAnalitica,
  getMttrAnalitica,
  getAulasCronicasAnalitica,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DirectivoDashboard() {
  const { currentUser } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [mttrData, setMttrData] = useState(null);
  const [aulasCronicas, setAulasCronicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalitica = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resMetricas, resMttr, resAulas] = await Promise.all([
        getMetricasAnalitica(),
        getMttrAnalitica(),
        getAulasCronicasAnalitica(),
      ]);

      setMetricas(resMetricas);
      setMttrData(resMttr);
      setAulasCronicas(resAulas.aulasCronicas || []);
    } catch (err) {
      setError(err.message || 'Error al obtener datos de analítica');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalitica();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Generando métricas y análisis de MTTR en MongoDB Atlas...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 text-rose-800 text-sm">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="font-bold">{error}</p>
        <button
          onClick={fetchAnalitica}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg"
        >
          Reintentar Carga de Analítica
        </button>
      </div>
    );
  }

  const kpis = metricas?.kpis || {};

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Directivo */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold mb-2 border border-purple-400/30">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Perfil: Órgano Directivo / Solo Lectura</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Tablero de Inteligencia y Analítica Campus
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Monitoreo gerencial de eficiencia operativa, MTTR y detección temprana de infraestructura con fallas crónicas.
          </p>
        </div>

        <button
          onClick={fetchAnalitica}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-800/60 hover:bg-purple-800 text-white font-semibold text-xs border border-purple-400/40"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar Indicadores</span>
        </button>
      </div>

      {/* 1. Tarjetas de Métricas Ejecutivas (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Volumen Histórico
            </span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.abiertas} abiertas • {kpis.enProgreso} en atención
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tasa de Resolución
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {kpis.tasaResolucion}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.resueltas + kpis.cerradas} incidencias resueltas con éxito
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fallas Críticas Activas
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{kpis.criticas}</div>
          <div className="text-[11px] text-rose-700/80 mt-1 font-semibold">
            Requieren atención prioritaria
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Puntos Crónicos Detectados
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {aulasCronicas.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Espacios con reincidencia &gt; 1 falla
          </div>
        </div>
      </div>

      {/* 2. Sección de MTTR (Mean Time to Resolution) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-lg">
                Tiempo Medio de Resolución (MTTR)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiempo promedio transcurrido entre la creación del ticket y su resolución por parte de los técnicos
            </p>
          </div>
          <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">
            {mttrData?.totalCasosAnalizados || 0} tickets resueltos evaluados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Promedio General */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-6 rounded-2xl border border-indigo-100 text-center space-y-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              MTTR Promedio Global
            </span>
            <div className="text-4xl font-black text-indigo-700">
              {mttrData?.mttrHoras || 0} <span className="text-lg font-bold">Horas</span>
            </div>
            <div className="text-xs text-indigo-600 font-semibold">
              Equivalente a {(mttrData?.mttrDias || 0)} días promedio
            </div>
          </div>

          {/* Desglose por Categoría */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              MTTR por Departamento Operativo:
            </h4>

            {mttrData?.mttrPorCategoria && Object.keys(mttrData.mttrPorCategoria).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(mttrData.mttrPorCategoria).map(([cat, data]) => (
                  <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-800 capitalize">
                        {cat.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-indigo-700 font-mono">
                        {data.horasPromedio} hrs ({data.totalResueltas} casos)
                      </span>
                    </div>
                    {/* Barra de progreso visual */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (data.horasPromedio / 48) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-xs italic py-4">
                No hay suficientes datos de resolución por categoría aún.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tabla Analítica: Aulas y Espacios con Fallas Crónicas */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Aulas y Espacios con Fallas Crónicas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Áreas del campus con mayor reincidencia de incidencias para priorizar mantenimiento preventivo
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Pipeline de Agregación NoSQL
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Edificio</th>
                <th className="px-4 py-3">Aula / Laboratorio</th>
                <th className="px-4 py-3 text-center">Total Incidencias</th>
                <th className="px-4 py-3 text-center">Fallas Críticas</th>
                <th className="px-4 py-3 text-center">Resueltas</th>
                <th className="px-4 py-3">Categorías Afectadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aulasCronicas.map((aula, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {aula.edificio}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    {aula.aula_laboratorio}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-lg">
                      {aula.totalIncidencias}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {aula.criticas > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded">
                        {aula.criticas}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-emerald-700 font-bold">
                      {aula.resueltas} / {aula.totalIncidencias}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {aula.categorias?.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize"
                        >
                          {c.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
