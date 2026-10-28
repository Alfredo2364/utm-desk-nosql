import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  Flame,
  Loader2,
  RefreshCw,
  Layers,
  Download,
  Printer,
  FileSpreadsheet,
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
  const [reportMsg, setReportMsg] = useState(null);

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
      setAulasCronicas(resAulas.aulasCronicas || resAulas.fallasCronicas || []);
    } catch (err) {
      setError(err.message || 'Error al obtener datos de analítica');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalitica();
  }, []);

  const handleExportCSV = () => {
    const kpis = metricas?.kpis || {};
    const porEdificio = mttrData?.porEdificio || [];
    let csv = 'REPORTE EJECUTIVO DE ANALITICA - UTM DESK NOSQL CLOUD\n';
    csv += `Generado por:,${currentUser?.nombre || 'Directivo UTM'} (${currentUser?.email || ''})\n`;
    csv += `Fecha:,${new Date().toLocaleString('es-MX')}\n\n`;
    csv += '1. METRICAS GENERALES\n';
    csv += `Total Incidencias,${kpis.total || 0}\n`;
    csv += `Abiertas,${kpis.abiertas || 0}\n`;
    csv += `En Proceso,${kpis.enProgreso || 0}\n`;
    csv += `Resueltas,${(kpis.resueltas || 0) + (kpis.cerradas || 0)}\n`;
    csv += `Tasa de Resolucion (%),${kpis.tasaResolucion || 0}%\n`;
    csv += `MTTR Global (Minutos),${mttrData?.mttrMinutos || 0}\n`;
    csv += `MTTR Global (Horas),${mttrData?.mttrHoras || 0}\n\n`;

    csv += '2. RF-07 TIEMPO MEDIO DE RESOLUCION POR EDIFICIO ($match resueltas -> $group edificio -> $avg tiempoResolucionMin)\n';
    csv += 'Clave Edificio,Nombre Edificio,Promedio (Minutos),Promedio (Horas),Total Resueltas\n';
    porEdificio.forEach((ed) => {
      csv += `"${ed.edificioId || ''}","${ed.edificio || ''}",${ed.tiempoPromedioMin || 0},${ed.tiempoPromedioHoras || 0},${ed.totalResueltas || 0}\n`;
    });

    csv += '\n3. RF-08 RANKING DE AULAS CON FALLAS CRONICAS ($group edificio y aula -> $sort conteo -> $limit)\n';
    csv += 'Edificio,Aula / Laboratorio,Total Incidencias,Criticas,Abiertas,Resueltas\n';
    aulasCronicas.forEach((a) => {
      csv += `"${a.edificio || a.edificioId}","${a.aula_laboratorio || a.aula}",${a.totalIncidencias},${a.criticas},${a.abiertas},${a.resueltas}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Reporte_Directivo_UTM_Desk_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setReportMsg('Reporte CSV descargado exitosamente.');
    setTimeout(() => setReportMsg(null), 4000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Ejecutando Aggregation Pipelines (RF-07 y RF-08) en MongoDB Atlas...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-3 text-rose-800 text-xs">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchAnalitica}
          className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-md hover:bg-rose-700 cursor-pointer"
        >
          Reintentar Consulta
        </button>
      </div>
    );
  }

  const kpis = metricas?.kpis || {};
  const porEdificio = mttrData?.porEdificio || [];

  return (
    <div className="space-y-4 animate-fadeIn text-slate-800">
      {/* Header Directivo (Tabla 3 y 4) */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Portal Ejecutivo Directivo • Analítica y Generación de Reportes
            </h1>
            <span className="font-mono text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-bold uppercase border border-purple-200">
              ROL: DIRECTIVO (TABLA 3 Y 4)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta exclusiva de métricas, tiempo medio de atención por edificio (`RF-07`) y aulas con fallas crónicas (`RF-08`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Generar Reporte CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={fetchAnalitica}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {reportMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>✅ {reportMsg}</span>
        </div>
      )}

      {/* 1. KPIs Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Volumen Total
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {kpis.abiertas} abiertas • {kpis.enProgreso} en proceso
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Tasa de Resolución
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {kpis.tasaResolucion}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {(kpis.resueltas || 0) + (kpis.cerradas || 0)} incidencias solucionadas
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              Fallas Críticas
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">{kpis.criticas}</div>
          <div className="text-[11px] text-rose-700/80 mt-0.5 font-medium">
            Prioridad máxima de atención
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Aulas Monitorizadas
            </span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {aulasCronicas.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Espacios en ranking RF-08
          </div>
        </div>
      </div>

      {/* 2. RF-07: Tiempo Medio de Resolución por Edificio y Categoría */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                RF-07: Tiempo Medio de Resolución (`GET /api/analitica/tiempo-medio`)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aggregation Pipeline en MongoDB Atlas: `$match` de resueltas, `$group` por edificio y `$avg` de `tiempoResolucionMin`.
            </p>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono font-semibold border border-slate-200">
            {mttrData?.totalCasosAnalizados || 0} resueltas analizadas
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Promedio General */}
          <div className="lg:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tiempo Medio Global
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {mttrData?.mttrMinutos || 0}{' '}
              <span className="text-sm font-bold text-slate-500">min</span>
            </div>
            <div className="text-xs text-emerald-700 font-bold font-mono">
              Equivalente a {mttrData?.mttrHoras || 0} Horas (~{mttrData?.mttrDias || 0} días)
            </div>
          </div>

          {/* Tabla RF-07 Por Edificio */}
          <div className="lg:col-span-8">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Promedio Calculado por Edificio en MongoDB Atlas (`porEdificio`):
            </h4>
            {porEdificio.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Clave Edificio</th>
                      <th className="px-3 py-2">Nombre del Edificio</th>
                      <th className="px-3 py-2">Promedio (`tiempoResolucionMin`)</th>
                      <th className="px-3 py-2">En Horas</th>
                      <th className="px-3 py-2 text-right">Casos Resueltos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {porEdificio.map((ed, i) => (
                      <tr key={ed.edificioId || i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">
                          {ed.edificioId}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{ed.edificio}</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700">
                          {ed.tiempoPromedioMin} min
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {ed.tiempoPromedioHoras} hrs
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {ed.totalResueltas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-400 text-xs italic py-2">
                Sin incidencias resueltas aún para agrupar por edificio.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RF-08: Aulas con Fallas Crónicas */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                RF-08: Aulas y Laboratorios con Fallas Crónicas (`GET /api/analitica/fallas-cronicas`)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aggregation Pipeline: `$group` por edificio y aula, `$sort` por conteo de mayor a menor y `$limit`.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Edificio (`edificioId`)</th>
                <th className="px-4 py-2.5">Aula / Laboratorio (`aula`)</th>
                <th className="px-4 py-2.5">Total Reportes</th>
                <th className="px-4 py-2.5">Críticas</th>
                <th className="px-4 py-2.5">Abiertas / Resueltas</th>
                <th className="px-4 py-2.5">Categorías Detectadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aulasCronicas.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.edificio}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">
                    {item.aula_laboratorio || item.aula}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-xs">
                      {item.totalIncidencias}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.criticas > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-mono font-bold text-[11px]">
                        {item.criticas} críticas
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    <span className="text-amber-700 font-semibold">{item.abiertas} abiertas</span>
                    {' / '}
                    <span className="text-emerald-700 font-semibold">{item.resueltas} resueltas</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.categorias || []).map((c) => (
                        <span
                          key={c}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] capitalize border border-slate-200"
                        >
                          {c?.replace('_', ' ')}
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
