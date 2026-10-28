const Incidencia = require('../models/Incidencia');

/**
 * GET /api/analitica/metricas
 * KPIs de gestión: Totales, tasa de resolución, severidades y distribución por área
 */
const getMetricasGenerales = async (req, res, next) => {
  try {
    const total = await Incidencia.countDocuments();
    const abiertas = await Incidencia.countDocuments({ estado: 'abierta' });
    const asignadas = await Incidencia.countDocuments({ estado: 'asignada' });
    const enProgreso = await Incidencia.countDocuments({
      estado: { $in: ['en_proceso', 'en_progreso'] },
    });
    const pendientes = await Incidencia.countDocuments({ estado: 'pendiente_revision' });
    const resueltas = await Incidencia.countDocuments({ estado: 'resuelta' });
    const cerradas = await Incidencia.countDocuments({ estado: 'cerrada' });
    const criticas = await Incidencia.countDocuments({ prioridad: 'critica' });
    const altas = await Incidencia.countDocuments({ prioridad: 'alta' });

    const totalResueltasOCerradas = resueltas + cerradas;
    const tasaResolucion =
      total > 0 ? ((totalResueltasOCerradas / total) * 100).toFixed(1) : '0.0';

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
        asignadas,
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
 * RF-07 | GET /api/analitica/tiempo-medio (y /api/analitica/mttr)
 * Aggregation Pipeline en el servidor de base de datos:
 * $match de resueltas, $group por edificio y $avg de tiempoResolucionMin.
 */
const getMTTR = async (req, res, next) => {
  try {
    // 1. Aggregation Pipeline oficial RF-07 en MongoDB Atlas: $match -> $group por edificio -> $avg de tiempoResolucionMin
    const porEdificio = await Incidencia.aggregate([
      {
        $match: {
          estado: { $in: ['resuelta', 'cerrada'] },
        },
      },
      {
        $addFields: {
          edificioClave: {
            $ifNull: ['$ubicacion.edificioId', '$ubicacion.edificio'],
          },
          minutosCalculados: {
            $ifNull: [
              '$tiempoResolucionMin',
              {
                $divide: [
                  {
                    $subtract: [
                      { $ifNull: ['$fechaResolucion', { $ifNull: ['$fecha_resolucion', '$updatedAt'] }] },
                      { $ifNull: ['$fechaReporte', '$createdAt'] },
                    ],
                  },
                  60000,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$edificioClave',
          edificioNombre: { $first: '$ubicacion.edificio' },
          promedioResolucionMin: { $avg: '$minutosCalculados' },
          totalResueltas: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          edificioId: '$_id',
          edificio: { $ifNull: ['$edificioNombre', '$_id'] },
          tiempoPromedioMin: { $round: ['$promedioResolucionMin', 1] },
          tiempoPromedioHoras: {
            $round: [{ $divide: ['$promedioResolucionMin', 60] }, 1],
          },
          totalResueltas: 1,
        },
      },
      { $sort: { tiempoPromedioMin: 1 } },
    ]);

    // 2. Aggregation Pipeline por categoría y global
    const resueltas = await Incidencia.find({
      estado: { $in: ['resuelta', 'cerrada'] },
    }).select(
      'codigo titulo categoria prioridad createdAt fechaReporte fechaResolucion fecha_resolucion tiempoResolucionMin updatedAt revisiones'
    );

    if (resueltas.length === 0) {
      return res.status(200).json({
        ok: true,
        mttrMinutos: 0,
        mttrHoras: 0,
        mttrDias: 0,
        totalCasosAnalizados: 0,
        porEdificio: [],
        mttrPorCategoria: {},
      });
    }

    let sumaMinutos = 0;
    const tiemposPorCategoria = {};

    resueltas.forEach((inc) => {
      let min = inc.tiempoResolucionMin;
      if (min == null) {
        const inicio = new Date(inc.fechaReporte || inc.createdAt).getTime();
        const fin = new Date(
          inc.fechaResolucion || inc.fecha_resolucion || inc.updatedAt
        ).getTime();
        min = Math.max(1, Math.round((fin - inicio) / 60000));
      }
      sumaMinutos += min;

      if (!tiemposPorCategoria[inc.categoria]) {
        tiemposPorCategoria[inc.categoria] = { sumaMin: 0, count: 0 };
      }
      tiemposPorCategoria[inc.categoria].sumaMin += min;
      tiemposPorCategoria[inc.categoria].count += 1;
    });

    const promedioMin = sumaMinutos / resueltas.length;
    const mttrMinutos = Number(promedioMin.toFixed(1));
    const mttrHoras = Number((promedioMin / 60).toFixed(1));
    const mttrDias = Number((promedioMin / (60 * 24)).toFixed(1));

    const desgloseCategoria = {};
    for (const [cat, data] of Object.entries(tiemposPorCategoria)) {
      const minProm = data.sumaMin / data.count;
      desgloseCategoria[cat] = {
        minutosPromedio: Number(minProm.toFixed(1)),
        horasPromedio: Number((minProm / 60).toFixed(1)),
        totalResueltas: data.count,
      };
    }

    return res.status(200).json({
      ok: true,
      totalCasosAnalizados: resueltas.length,
      mttrMinutos,
      mttrHoras,
      mttrDias,
      porEdificio,
      mttrPorCategoria: desgloseCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RF-08 | GET /api/analitica/fallas-cronicas (y /api/analitica/aulas-cronicas)
 * Aggregation Pipeline: $group por edificio y aula, $sort por conteo descendente y $limit.
 */
const getAulasCronicas = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const rankingAulas = await Incidencia.aggregate([
      {
        $group: {
          _id: {
            edificioId: { $ifNull: ['$ubicacion.edificioId', '$ubicacion.edificio'] },
            aula: { $ifNull: ['$ubicacion.aula', '$ubicacion.aula_laboratorio'] },
          },
          edificioNombre: { $first: '$ubicacion.edificio' },
          totalIncidencias: { $sum: 1 },
          criticas: {
            $sum: { $cond: [{ $eq: ['$prioridad', 'critica'] }, 1, 0] },
          },
          abiertas: {
            $sum: { $cond: [{ $eq: ['$estado', 'abierta'] }, 1, 0] },
          },
          resueltas: {
            $sum: {
              $cond: [{ $in: ['$estado', ['resuelta', 'cerrada']] }, 1, 0],
            },
          },
          categorias: { $addToSet: '$categoria' },
          ultimosTickets: {
            $push: {
              codigo: '$codigo',
              titulo: '$titulo',
              prioridad: '$prioridad',
              estado: '$estado',
              fecha: { $ifNull: ['$fechaReporte', '$createdAt'] },
            },
          },
        },
      },
      { $sort: { totalIncidencias: -1, criticas: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          edificioId: '$_id.edificioId',
          edificio: { $ifNull: ['$edificioNombre', '$_id.edificioId'] },
          aula: '$_id.aula',
          aula_laboratorio: '$_id.aula',
          totalIncidencias: 1,
          conteo: '$totalIncidencias',
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
      fallasCronicas: rankingAulas,
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
