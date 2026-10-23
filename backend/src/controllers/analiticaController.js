const Incidencia = require('../models/Incidencia');

/**
 * GET /api/analitica/metricas
 * KPIs de gestión: Totales, tasa de resolución, severidades y distribución por área
 */
const getMetricasGenerales = async (req, res, next) => {
  try {
    const total = await Incidencia.countDocuments();
    const abiertas = await Incidencia.countDocuments({ estado: 'abierta' });
    const enProgreso = await Incidencia.countDocuments({ estado: 'en_progreso' });
    const pendientes = await Incidencia.countDocuments({ estado: 'pendiente_revision' });
    const resueltas = await Incidencia.countDocuments({ estado: 'resuelta' });
    const cerradas = await Incidencia.countDocuments({ estado: 'cerrada' });
    const criticas = await Incidencia.countDocuments({ prioridad: 'critica' });
    const altas = await Incidencia.countDocuments({ prioridad: 'alta' });

    // Tasa de resolución
    const totalResueltasOCerradas = resueltas + cerradas;
    const tasaResolucion = total > 0 ? ((totalResueltasOCerradas / total) * 100).toFixed(1) : '0.0';

    // Distribución por categoría polimórfica
    const porCategoria = await Incidencia.aggregate([
      {
        $group: {
          _id: '$categoria',
          total: { $sum: 1 },
          resueltas: {
            $sum: {
              $cond: [{ $in: ['$estado', ['resuelta', 'cerrada']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.status(200).json({
      ok: true,
      kpis: {
        total,
        abiertas,
        enProgreso,
        pendientes,
        resueltas,
        cerradas,
        criticas,
        altas,
        tasaResolucion: Number(tasaResolucion),
      },
      porCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analitica/mttr
 * Cálculo de MTTR (Mean Time to Resolution - Tiempo Medio de Resolución)
 */
const getMTTR = async (req, res, next) => {
  try {
    const resueltas = await Incidencia.find({
      estado: { $in: ['resuelta', 'cerrada'] },
    }).select('codigo titulo categoria prioridad createdAt fecha_resolucion updatedAt revisiones');

    if (resueltas.length === 0) {
      return res.status(200).json({
        ok: true,
        mttrHoras: 0,
        mttrDias: 0,
        totalCasosAnalizados: 0,
        mensaje: 'Aún no hay incidencias resueltas para calcular el MTTR.',
        mttrPorCategoria: {},
      });
    }

    let sumaMilisegundos = 0;
    const tiemposPorCategoria = {};

    resueltas.forEach((inc) => {
      const inicio = new Date(inc.createdAt).getTime();
      let fin = inc.fecha_resolucion ? new Date(inc.fecha_resolucion).getTime() : null;

      // Si no tiene fecha_resolucion explícita, buscar en la última revisión
      if (!fin && inc.revisiones && inc.revisiones.length > 0) {
        const revResolucion = inc.revisiones.slice().reverse().find(
          (r) => r.estado_asignado === 'resuelta' || r.estado_asignado === 'cerrada'
        );
        if (revResolucion) {
          fin = new Date(revResolucion.fecha_revision).getTime();
        }
      }

      // Fallback a updatedAt
      if (!fin) {
        fin = new Date(inc.updatedAt).getTime();
      }

      const duracionMs = Math.max(0, fin - inicio);
      sumaMilisegundos += duracionMs;

      // Agrupar por categoría
      if (!tiemposPorCategoria[inc.categoria]) {
        tiemposPorCategoria[inc.categoria] = { sumaMs: 0, count: 0 };
      }
      tiemposPorCategoria[inc.categoria].sumaMs += duracionMs;
      tiemposPorCategoria[inc.categoria].count += 1;
    });

    const promedioMs = sumaMilisegundos / resueltas.length;
    const mttrHoras = (promedioMs / (1000 * 60 * 60)).toFixed(1);
    const mttrDias = (promedioMs / (1000 * 60 * 60 * 24)).toFixed(1);

    const desgloseCategoria = {};
    for (const [cat, data] of Object.entries(tiemposPorCategoria)) {
      const horas = (data.sumaMs / data.count / (1000 * 60 * 60)).toFixed(1);
      desgloseCategoria[cat] = {
        horasPromedio: Number(horas),
        totalResueltas: data.count,
      };
    }

    return res.status(200).json({
      ok: true,
      totalCasosAnalizados: resueltas.length,
      mttrHoras: Number(mttrHoras),
      mttrDias: Number(mttrDias),
      mttrPorCategoria: desgloseCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analitica/aulas-cronicas
 * Pipeline de agregación en MongoDB Atlas para identificar aulas y edificios con fallas crónicas
 */
const getAulasCronicas = async (req, res, next) => {
  try {
    const rankingAulas = await Incidencia.aggregate([
      {
        $group: {
          _id: {
            edificio: '$ubicacion.edificio',
            aula: '$ubicacion.aula_laboratorio',
          },
          totalIncidencias: { $sum: 1 },
          criticas: {
            $sum: { $cond: [{ $eq: ['$prioridad', 'critica'] }, 1, 0] },
          },
          abiertas: {
            $sum: { $cond: [{ $eq: ['$estado', 'abierta'] }, 1, 0] },
          },
          resueltas: {
            $sum: { $cond: [{ $in: ['$estado', ['resuelta', 'cerrada']] }, 1, 0] },
          },
          categorias: { $addToSet: '$categoria' },
          ultimosTickets: {
            $push: {
              codigo: '$codigo',
              titulo: '$titulo',
              prioridad: '$prioridad',
              estado: '$estado',
              fecha: '$createdAt',
            },
          },
        },
      },
      { $sort: { totalIncidencias: -1, criticas: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          edificio: '$_id.edificio',
          aula_laboratorio: '$_id.aula',
          totalIncidencias: 1,
          criticas: 1,
          abiertas: 1,
          resueltas: 1,
          categorias: 1,
          ultimosTickets: { $slice: ['$ultimosTickets', 3] },
        },
      },
    ]);

    return res.status(200).json({
      ok: true,
      totalEspaciosDetectados: rankingAulas.length,
      aulasCronicas: rankingAulas,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetricasGenerales,
  getMTTR,
  getAulasCronicas,
};
