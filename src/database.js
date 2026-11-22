'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const TABLES = {
  generos: { fields: ['nombre', 'estado', 'descripcion'], required: ['nombre'], unique: ['nombre'] },
  directores: { fields: ['nombres', 'estado'], required: ['nombres'], unique: [] },
  productoras: { fields: ['nombre', 'estado', 'slogan', 'descripcion'], required: ['nombre'], unique: ['nombre'] },
  tipos: { fields: ['nombre', 'descripcion'], required: ['nombre'], unique: ['nombre'] },
  media: {
    fields: ['serial', 'titulo', 'sinopsis', 'url_pelicula', 'portada', 'anio_estreno', 'genero_id', 'director_id', 'productora_id', 'tipo_id'],
    required: ['serial', 'titulo', 'url_pelicula', 'anio_estreno', 'genero_id', 'director_id', 'productora_id', 'tipo_id'],
    unique: ['serial', 'url_pelicula']
  }
};
const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS generos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')), descripcion TEXT NOT NULL DEFAULT '', fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS directores (id INTEGER PRIMARY KEY AUTOINCREMENT, nombres TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')), fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS productoras (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, estado TEXT NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo')), slogan TEXT NOT NULL DEFAULT '', descripcion TEXT NOT NULL DEFAULT '', fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tipos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, descripcion TEXT NOT NULL DEFAULT '', fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, serial TEXT NOT NULL UNIQUE, titulo TEXT NOT NULL, sinopsis TEXT NOT NULL DEFAULT '', url_pelicula TEXT NOT NULL UNIQUE, portada TEXT NOT NULL DEFAULT '', anio_estreno INTEGER NOT NULL, genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE RESTRICT, director_id INTEGER NOT NULL REFERENCES directores(id) ON DELETE RESTRICT, productora_id INTEGER NOT NULL REFERENCES productoras(id) ON DELETE RESTRICT, tipo_id INTEGER NOT NULL REFERENCES tipos(id) ON DELETE RESTRICT, fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_media_genero ON media(genero_id);
CREATE INDEX IF NOT EXISTS idx_media_tipo ON media(tipo_id);
`;

function connect(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(schema);
  const seed = db.prepare('INSERT OR IGNORE INTO generos (nombre, descripcion) VALUES (?, ?)');
  for (const nombre of ['Acción', 'Aventura', 'Ciencia ficción', 'Drama', 'Terror']) seed.run(nombre, 'Género de películas y series');
  for (const nombre of ['Película', 'Serie']) db.prepare('INSERT OR IGNORE INTO tipos (nombre) VALUES (?)').run(nombre);
  return db;
}

function rows(db, table, filters={}) {
  let sql = `SELECT * FROM ${table}`;
  const names = Object.keys(filters);
  const args = names.map(k => filters[k]);
  if (names.length) sql += ` WHERE ${names.map(k => `${k} = ?`).join(' AND ')}`;
  sql += ` ORDER BY id DESC`;
  return db.prepare(sql).all(...args);
}
function byId(db, table, id) { return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id); }
function insert(db, table, values) {
  const keys = Object.keys(values);
  if (!keys.length) throw new Error('No hay campos para guardar');
  const res = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(()=>'?').join(', ')})`).run(...keys.map(k=>values[k]));
  return byId(db, table, Number(res.lastInsertRowid));
}
function update(db, table, id, values) {
  const keys = Object.keys(values);
  if (keys.length) db.prepare(`UPDATE ${table} SET ${keys.map(k=>`${k} = ?`).join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`).run(...keys.map(k=>values[k]), id);
  return byId(db, table, id);
}
module.exports = { TABLES, connect, rows, byId, insert, update };
