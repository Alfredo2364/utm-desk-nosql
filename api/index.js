/**
 * Punto de entrada Serverless Function para Vercel (/api/*)
 * Reenvía todas las peticiones de /api/* a la aplicación Express del Backend.
 */
const app = require('../backend/src/server');

module.exports = app;
