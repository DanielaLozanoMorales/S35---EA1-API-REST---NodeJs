'use strict';
const http = require('node:http');
const { URL } = require('node:url');
const { openDatabase } = require('./db');
const { catalogRouter } = require('./routes/catalogos');
const { mediaRouter } = require('./routes/media');

const METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

function responseWriter(res) {
  let code = 200;
  const headers = {};
  return {
    status(status) { code = status; return this; },
    location(path) { headers.Location = path; return this; },
    json(object) {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
      res.end(JSON.stringify(object));
    }
  };
}

async function parseJson(req) {
  if (['GET', 'DELETE'].includes(req.method)) return undefined;
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw Object.assign(new Error('El JSON supera 1 MB.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!bytes) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('El cuerpo de la solicitud no contiene JSON válido.'), { status: 400 }); }
}

function createApp(db = openDatabase()) {
  const routes = [];
  for (const name of ['generos', 'directores', 'productoras', 'tipos', 'media']) {
    const router = name === 'media' ? mediaRouter(db) : catalogRouter(db, name);
    for (const route of router.routes) routes.push({ ...route, prefix: `/api/${name}` });
  }

  return http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', METHODS);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const answer = responseWriter(res);
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const path = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
      if (req.method === 'GET' && path === '/') {
        answer.json({ nombre: 'API REST Películas', ruta: '/api', estado: 'ok' }); return;
      }
      if (req.method === 'GET' && path === '/api') {
        answer.json({ descripcion: 'API de películas y series', recursos: ['/api/generos', '/api/directores', '/api/productoras', '/api/tipos', '/api/media'] }); return;
      }
      let found = null;
      let id = null;
      for (const route of routes) {
        if (route.method !== req.method) continue;
        if (route.path === '/' && path === route.prefix) { found = route; break; }
        if (route.path === '/:id' && path.startsWith(route.prefix + '/')) {
          const suffix = path.slice(route.prefix.length + 1);
          if (suffix && !suffix.includes('/')) { found = route; id = suffix; break; }
        }
      }
      if (!found) { answer.status(404).json({ error: 'Ruta no encontrada.' }); return; }
      req.params = id === null ? {} : { id };
      req.query = Object.fromEntries(url.searchParams.entries());
      req.body = await parseJson(req);
      await found.handler(req, answer);
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      if (!res.headersSent) answer.status(status).json({ error: status >= 500 ? 'Error interno del servidor.' : error.message });
    }
  });
}
module.exports = { createApp };
