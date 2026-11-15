'use strict';
const { Router } = require('../router');
const { httpError, requireId, dbError, validatePayload, textField, stateField } = require('../utils');

const configs = {
  generos: { table: 'generos', required: ['nombre'], optional: ['estado', 'descripcion'] },
  directores: { table: 'directores', required: ['nombres'], optional: ['estado'] },
  productoras: { table: 'productoras', required: ['nombre'], optional: ['estado', 'slogan', 'descripcion'] },
  tipos: { table: 'tipos', required: ['nombre'], optional: ['descripcion'] }
};

function catalogRouter(db, name) {
  const router = Router();
  const cfg = configs[name];
  const cols = [...cfg.required, ...cfg.optional];
  const requiredText = new Set(cfg.required);

  function normalizar(body, full = false) {
    validatePayload(body, cols, cfg.required, full);
    const out = {};
    for (const [key, value] of Object.entries(body)) {
      out[key] = key === 'estado' ? stateField(value) : textField(value, key, requiredText.has(key));
    }
    return out;
  }

  router.get('/', (req, res) => {
    let sql = `SELECT * FROM ${cfg.table}`;
    const params = [];
    if (cfg.optional.includes('estado') && req.query.estado !== undefined) {
      sql += ' WHERE estado = ?';
      params.push(stateField(req.query.estado));
    }
    sql += ' ORDER BY id';
    const datos = db.prepare(sql).all(...params);
    res.json({ total: datos.length, datos });
  });
  router.get('/:id', (req, res) => {
    const dato = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(requireId(req));
    if (!dato) throw httpError(404, 'Registro no encontrado.');
    res.json({ datos: dato });
  });
  router.post('/', (req, res) => {
    const data = normalizar(req.body, true);
    const names = Object.keys(data);
    try {
      const query = `INSERT INTO ${cfg.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`;
      const result = db.prepare(query).run(...Object.values(data));
      const created = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(result.lastInsertRowid);
      res.status(201).location(`/api/${name}/${created.id}`).json({ mensaje: 'Registro creado.', datos: created });
    } catch (e) { throw dbError(e); }
  });
  function update(req, res, full) {
    const id = requireId(req);
    const original = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id);
    if (!original) throw httpError(404, 'Registro no encontrado.');
    const data = normalizar(req.body, full);
    const names = Object.keys(data);
    try {
      const query = `UPDATE ${cfg.table} SET ${names.map((key) => `${key} = ?`).join(', ')}, fecha_actualizacion = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`;
      db.prepare(query).run(...Object.values(data), id);
      res.json({ mensaje: 'Registro actualizado.', datos: db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id) });
    } catch (e) { throw dbError(e); }
  }
  router.put('/:id', (req, res) => update(req, res, true));
  router.patch('/:id', (req, res) => update(req, res, false));
  router.delete('/:id', (req, res) => {
    const id = requireId(req);
    try {
      const result = db.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).run(id);
      if (!result.changes) throw httpError(404, 'Registro no encontrado.');
      res.status(200).json({ mensaje: 'Registro eliminado.' });
    } catch (e) { throw dbError(e); }
  });
  return router;
}
module.exports = { catalogRouter };
