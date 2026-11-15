'use strict';
const { Router } = require('../router');
const { httpError, intId, requireId, dbError, validatePayload, textField, urlField, validateYear } = require('../utils');

const cols = [
  'serial', 'titulo', 'sinopsis', 'url_pelicula', 'portada', 'anio_estreno',
  'genero_id', 'director_id', 'productora_id', 'tipo_id'
];
const textCols = ['serial', 'titulo', 'sinopsis'];
const rels = {
  genero_id: { table: 'generos', name: 'género', active: true },
  director_id: { table: 'directores', name: 'director', active: true },
  productora_id: { table: 'productoras', name: 'productora', active: true },
  tipo_id: { table: 'tipos', name: 'tipo', active: false }
};

const selectMedia = `
  SELECT m.*, g.nombre AS genero, d.nombres AS director,
         p.nombre AS productora, t.nombre AS tipo
  FROM media m
  JOIN generos g ON g.id = m.genero_id
  JOIN directores d ON d.id = m.director_id
  JOIN productoras p ON p.id = m.productora_id
  JOIN tipos t ON t.id = m.tipo_id
`;

function mediaRouter(db) {
  const router = Router();
  const getOne = (id) => db.prepare(`${selectMedia} WHERE m.id = ?`).get(id);

  function checkRelation(key, id) {
    const cfg = rels[key];
    const reference = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id);
    if (!reference) throw httpError(400, `El ${cfg.name} seleccionado no existe.`);
    if (cfg.active && reference.estado !== 'Activo') {
      throw httpError(400, `El ${cfg.name} debe estar Activo para asociarlo a una producción.`);
    }
  }

  function normalizar(body, current = null, full = false) {
    validatePayload(body, cols, cols, full);
    const out = {};
    for (const [key, value] of Object.entries(body)) {
      if (textCols.includes(key)) out[key] = textField(value, key, true);
      else if (['url_pelicula', 'portada'].includes(key)) out[key] = urlField(value, key);
      else if (key === 'anio_estreno') out[key] = validateYear(value);
      else if (Object.hasOwn(rels, key)) {
        if (!Number.isSafeInteger(value) || value < 1) throw httpError(400, `${key} debe ser un ID entero positivo.`);
        // Si la asociación no cambia, permitir editar la producción aunque el
        // catálogo asociado haya pasado posteriormente a estado Inactivo.
        if (!current || current[key] !== value) checkRelation(key, value);
        out[key] = value;
      }
    }
    return out;
  }

  router.get('/', (req, res) => {
    const allowed = Object.keys(rels);
    const unknown = Object.keys(req.query).filter((key) => !allowed.includes(key));
    if (unknown.length) throw httpError(400, `Filtros desconocidos: ${unknown.join(', ')}`);
    const clauses = [];
    const params = [];
    for (const key of allowed) {
      if (req.query[key] !== undefined) {
        const id = intId(req.query[key]);
        if (!id) throw httpError(400, `${key} debe ser un entero positivo.`);
        clauses.push(`m.${key} = ?`);
        params.push(id);
      }
    }
    const sql = `${selectMedia} ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY m.id`;
    const datos = db.prepare(sql).all(...params);
    res.json({ total: datos.length, datos });
  });
  router.get('/:id', (req, res) => {
    const found = getOne(requireId(req));
    if (!found) throw httpError(404, 'Producción no encontrada.');
    res.json({ datos: found });
  });
  router.post('/', (req, res) => {
    const data = normalizar(req.body, null, true);
    const names = Object.keys(data);
    try {
      const placeholders = names.map(() => '?').join(', ');
      const result = db.prepare(`INSERT INTO media (${names.join(', ')}) VALUES (${placeholders})`).run(...Object.values(data));
      const created = getOne(result.lastInsertRowid);
      res.status(201).location(`/api/media/${created.id}`).json({ mensaje: 'Producción creada.', datos: created });
    } catch (e) { throw dbError(e); }
  });
  function update(req, res, full) {
    const id = requireId(req);
    const current = getOne(id);
    if (!current) throw httpError(404, 'Producción no encontrada.');
    const data = normalizar(req.body, current, full);
    const names = Object.keys(data);
    try {
      const updates = names.map((key) => `${key} = ?`).join(', ');
      db.prepare(`UPDATE media SET ${updates}, fecha_actualizacion = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
        .run(...Object.values(data), id);
      res.json({ mensaje: 'Producción actualizada.', datos: getOne(id) });
    } catch (e) { throw dbError(e); }
  }
  router.put('/:id', (req, res) => update(req, res, true));
  router.patch('/:id', (req, res) => update(req, res, false));
  router.delete('/:id', (req, res) => {
    const id = requireId(req);
    const result = db.prepare('DELETE FROM media WHERE id = ?').run(id);
    if (!result.changes) throw httpError(404, 'Producción no encontrada.');
    res.json({ mensaje: 'Producción eliminada.' });
  });
  return router;
}
module.exports = { mediaRouter };
