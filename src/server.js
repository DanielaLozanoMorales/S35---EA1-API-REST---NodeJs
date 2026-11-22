'use strict';
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { TABLES, connect, rows, byId, insert, update } = require('./database');

const PUBLIC = path.resolve(__dirname, '../public');
const RESOURCES = Object.keys(TABLES);
const relationColumns = { genero_id: 'generos', director_id: 'directores', productora_id: 'productoras', tipo_id: 'tipos' };

function send(res, status, data, extra={}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  });
  res.end(JSON.stringify(data));
}
function fail(status, message) { const e = new Error(message); e.status = status; throw e; }
function validURL(value) { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } }
function validate(db, table, source, method, current) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) fail(400, 'El cuerpo debe ser un objeto JSON');
  const spec = TABLES[table];
  const allowed = spec.fields;
  const unknown = Object.keys(source).filter(k => !allowed.includes(k));
  if (unknown.length) fail(400, `Campos no permitidos: ${unknown.join(', ')}`);
  if (method === 'POST' || method === 'PUT') {
    for (const key of spec.required) if (!((key in source) && source[key] !== '' && source[key] !== null)) fail(400, `El campo ${key} es obligatorio`);
  }
  if (method === 'PATCH' && !Object.keys(source).length) fail(400, 'Debes enviar al menos un campo');
  const data = { ...source };
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith('_id') || key === 'anio_estreno') {
      if (!Number.isSafeInteger(value) || value < (key === 'anio_estreno' ? 1888 : 1) || (key === 'anio_estreno' && value > new Date().getUTCFullYear() + 5)) fail(400, `Valor inválido para ${key}`);
    } else if (typeof value !== 'string') fail(400, `${key} debe ser texto`);
    else {
      data[key] = value.trim();
      if (data[key].length > (key === 'sinopsis' || key === 'descripcion' ? 3000 : 500)) fail(400, `${key} supera la longitud permitida`);
      if (spec.required.includes(key) && !data[key]) fail(400, `${key} no puede estar vacío`);
    }
    if (key === 'estado' && !['Activo', 'Inactivo'].includes(data[key])) fail(400, 'El estado debe ser Activo o Inactivo');
    if ((key === 'url_pelicula' || key === 'portada') && data[key] && !validURL(data[key])) fail(400, `${key} debe ser URL http(s)`);
  }
  if (table === 'media') {
    const combined = { ...(current || {}), ...data };
    for (const [column, resource] of Object.entries(relationColumns)) {
      const id = combined[column];
      if (id === undefined) continue;
      const related = byId(db, resource, id);
      if (!related) fail(400, `No existe el registro ${column}: ${id}`);
      if (column !== 'tipo_id' && related.estado !== 'Activo' && (!current || current[column] !== id)) fail(400, `La asociación ${column} debe estar activa`);
    }
  }
  return data;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''; let length = 0;
    req.on('data', chunk => { length += chunk.length; if (length > 128*1024) { reject(Object.assign(new Error('Cuerpo demasiado grande'), { status: 413 })); req.destroy(); return; } body += chunk.toString('utf8'); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(Object.assign(new Error('El cuerpo no contiene JSON válido'), {status:400})); } });
    req.on('error', reject);
  });
}
function staticFile(url, res) {
  const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'] };
  const found = files[url];
  if (!found) { send(res, 404, {error:'Ruta no encontrada'}); return; }
  fs.readFile(path.join(PUBLIC, found[0]), (err, buf) => {
    if (err) return send(res, 500, {error:'No se pudo cargar la interfaz'});
    res.writeHead(200, { 'Content-Type': found[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff' });
    res.end(buf);
  });
}
function createApp(options={}) {
  const db = connect(options.dbPath || process.env.DB_PATH || path.join(__dirname, '../data/peliculas.sqlite'));
  const server = http.createServer(async (req, res) => {
    const target = new URL(req.url, 'http://localhost');
    const pathname = target.pathname;
    try {
      if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { status: 'ok', service: 'Gestión de películas y series', timestamp: new Date().toISOString() });
      if (req.method === 'GET' && (pathname === '/api' || pathname === '/api/')) return send(res, 200, { servicio:'API REST - Películas y series', recursos: RESOURCES, frontend:'/' });
      const match = pathname.match(/^\/api\/(generos|directores|productoras|tipos|media)(?:\/(\d+))?\/?$/);
      if (!match) return req.method === 'GET' ? staticFile(pathname, res) : send(res, 404, {error:'Ruta no encontrada'});
      const table = match[1], id = match[2] ? Number(match[2]) : null;
      if (req.method === 'GET') {
        if (id) { const record = byId(db, table, id); return record ? send(res, 200, record) : send(res, 404, {error:'Registro no encontrado'}); }
        const filters = {};
        const allowedFilters = table === 'media' ? ['genero_id', 'tipo_id'] : (table === 'tipos' ? [] : ['estado']);
        for (const key of allowedFilters) if (target.searchParams.has(key)) {
          const value = target.searchParams.get(key);
          if (key.endsWith('_id')) { if (!/^\d+$/.test(value)) fail(400, `Filtro inválido: ${key}`); filters[key] = Number(value); }
          else { if (!['Activo','Inactivo'].includes(value)) fail(400,'Estado inválido'); filters[key] = value; }
        }
        return send(res, 200, rows(db, table, filters));
      }
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return send(res, 405, {error:'Método no permitido'}, {Allow:'GET, POST, PUT, PATCH, DELETE'});
      if (req.method === 'POST' && id) return send(res,405,{error:'POST se utiliza sobre la colección'});
      if (req.method !== 'POST' && !id) return send(res,405,{error:`${req.method} requiere identificador`});
      const current = id ? byId(db, table, id) : null;
      if (id && !current) return send(res, 404, {error:'Registro no encontrado'});
      if (req.method === 'DELETE') {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
        return send(res, 200, { mensaje:'Registro eliminado', id });
      }
      const input = await readBody(req);
      const data = validate(db, table, input, req.method, current);
      if (req.method === 'POST') return send(res, 201, insert(db, table, data));
      return send(res, 200, update(db, table, id, data));
    } catch (e) {
      let status = e.status || 500;
      let message = e.message;
      if (/UNIQUE constraint failed/.test(message)) { status=409; message='Ya existe un registro con un valor único duplicado'; }
      else if (/FOREIGN KEY constraint failed/.test(message)) { status=409; message='No se puede eliminar: el registro está relacionado con una producción'; }
      else if (/CHECK constraint failed|NOT NULL constraint failed/.test(message)) { status=400; message='No se cumplen las reglas de validación de los datos'; }
      else if (status === 500) { console.error(e); message='Error interno del servidor'; }
      if (!res.headersSent) send(res, status, {error: message});
    }
  });
  return { server, db };
}
if (require.main === module) {
  const {server} = createApp();
  const port = Number.parseInt(process.env.PORT || '3000', 10);
  server.listen(port, '0.0.0.0', () => console.log(`Aplicación activa en http://localhost:${port}`));
}
module.exports = { createApp };
