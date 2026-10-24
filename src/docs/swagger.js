const swaggerUi = require('swagger-ui-express');
const spec = require('./openapi');

/** Dokumentasi interaktif di /api/docs dan spesifikasi mentah di /api/docs.json. */
const mountDocs = (app) => {
  app.get('/api/docs.json', (_req, res) => res.json(spec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'BengkelKu API Docs' }));
};

module.exports = { mountDocs };
