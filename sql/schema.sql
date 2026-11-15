-- Caso de estudio Películas (IU Digital de Antioquia)
-- Identificadores y fechas de auditoría son administrados por SQLite.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS generos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  descripcion TEXT NOT NULL DEFAULT '',
  fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  fecha_actualizacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS directores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  fecha_actualizacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS productoras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  slogan TEXT NOT NULL DEFAULT '',
  descripcion TEXT NOT NULL DEFAULT '',
  fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  fecha_actualizacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  descripcion TEXT NOT NULL DEFAULT '',
  fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  fecha_actualizacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  sinopsis TEXT NOT NULL,
  url_pelicula TEXT NOT NULL UNIQUE,
  portada TEXT NOT NULL,
  anio_estreno INTEGER NOT NULL CHECK (anio_estreno BETWEEN 1888 AND 2200),
  genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE RESTRICT,
  director_id INTEGER NOT NULL REFERENCES directores(id) ON DELETE RESTRICT,
  productora_id INTEGER NOT NULL REFERENCES productoras(id) ON DELETE RESTRICT,
  tipo_id INTEGER NOT NULL REFERENCES tipos(id) ON DELETE RESTRICT,
  fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  fecha_actualizacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_media_genero ON media(genero_id);
CREATE INDEX IF NOT EXISTS idx_media_director ON media(director_id);
CREATE INDEX IF NOT EXISTS idx_media_productora ON media(productora_id);
CREATE INDEX IF NOT EXISTS idx_media_tipo ON media(tipo_id);
