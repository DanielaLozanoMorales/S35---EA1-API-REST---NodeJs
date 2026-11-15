'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function openDatabase(dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'peliculas.sqlite')) {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new DatabaseSync(dbFile);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8'));

  // Categorías especificadas en el PDF del caso de estudio.
  const addGenre = db.prepare('INSERT OR IGNORE INTO generos (nombre, descripcion) VALUES (?, ?)');
  const addType = db.prepare('INSERT OR IGNORE INTO tipos (nombre, descripcion) VALUES (?, ?)');
  db.exec('BEGIN TRANSACTION');
  try {
    for (const nombre of ['Acción', 'Aventura', 'Ciencia ficción', 'Drama', 'Terror']) {
      addGenre.run(nombre, `Producciones del género ${nombre.toLowerCase()}`);
    }
    addType.run('Película', 'Producción cinematográfica');
    addType.run('Serie', 'Producción por episodios');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  return db;
}
module.exports = { openDatabase };
