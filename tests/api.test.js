'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../src/db');
const { createApp } = require('../src/app');

test('Caso de estudio: CRUD de los cinco módulos y reglas de negocio', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'api-peliculas-test-'));
  const db = openDatabase(path.join(folder, 'pruebas.sqlite'));
  const server = createApp(db).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(folder, { recursive: true, force: true });
  });
  const call = async (method, route, body) => {
    const response = await fetch(base + route, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    return { status: response.status, ...data };
  };

  const gen = await call('GET', '/api/generos');
  assert.equal(gen.status, 200);
  assert.equal(gen.total, 5);
  const tipo = await call('GET', '/api/tipos');
  assert.equal(tipo.total, 2);
  const generoId = gen.datos.find((row) => row.nombre === 'Acción').id;
  const tipoId = tipo.datos.find((row) => row.nombre === 'Película').id;

  const nuevoGenero = await call('POST', '/api/generos', {
    nombre: 'Comedia', estado: 'Activo', descripcion: 'Humor'
  });
  assert.equal(nuevoGenero.status, 201);
  assert.equal((await call('PUT', `/api/generos/${nuevoGenero.datos.id}`, {
    nombre: 'Comedia', estado: 'Activo', descripcion: 'Humor y diversión'
  })).status, 200);

  const director = await call('POST', '/api/directores', { nombres: 'Dirección de prueba', estado: 'Activo' });
  assert.equal(director.status, 201);
  const productora = await call('POST', '/api/productoras', {
    nombre: 'Estudio de prueba', estado: 'Activo', slogan: 'Creamos historias', descripcion: 'Ejemplo'
  });
  assert.equal(productora.status, 201);

  assert.equal((await call('PATCH', `/api/directores/${director.datos.id}`, { estado: 'Inactivo' })).status, 200);
  const movie = {
    serial: 'PEL-AUTO-001', titulo: 'Ejemplo de prueba', sinopsis: 'Sinopsis para pruebas.',
    url_pelicula: 'https://example.com/video-test-1',
    portada: 'https://example.com/portada-test-1.jpg', anio_estreno: 2024,
    genero_id: generoId, director_id: director.datos.id,
    productora_id: productora.datos.id, tipo_id: tipoId
  };
  const rejected = await call('POST', '/api/media', movie);
  assert.equal(rejected.status, 400);
  assert.match(rejected.error, /Activo/);

  assert.equal((await call('PATCH', `/api/directores/${director.datos.id}`, { estado: 'Activo' })).status, 200);
  const created = await call('POST', '/api/media', movie);
  assert.equal(created.status, 201);
  assert.equal(created.datos.genero, 'Acción');
  assert.equal(created.datos.tipo, 'Película');
  const movieId = created.datos.id;
  assert.equal((await call('POST', '/api/media', { ...movie, url_pelicula: 'https://example.com/otro-video' })).status, 409);
  assert.equal((await call('POST', '/api/media', { ...movie, serial: 'SER-UNICO' })).status, 409);
  assert.equal((await call('DELETE', `/api/productoras/${productora.datos.id}`)).status, 409);

  const filtered = await call('GET', `/api/media?genero_id=${generoId}&tipo_id=${tipoId}`);
  assert.equal(filtered.total, 1);
  const changed = await call('PUT', `/api/media/${movieId}`, { ...movie, titulo: 'Título editado' });
  assert.equal(changed.status, 200);
  assert.equal(changed.datos.titulo, 'Título editado');
  assert.equal((await call('PATCH', `/api/media/${movieId}`, { sinopsis: 'Sinopsis revisada' })).status, 200);
  assert.equal((await call('GET', `/api/media/${movieId}`)).datos.sinopsis, 'Sinopsis revisada');

  const otherGenre = await call('POST', '/api/generos', {
    nombre: 'Especial', estado: 'Inactivo', descripcion: 'Categorización de prueba'
  });
  assert.equal((await call('PATCH', `/api/media/${movieId}`, { genero_id: otherGenre.datos.id })).status, 400);
  assert.equal((await call('PATCH', `/api/generos/${generoId}`, { estado: 'Inactivo' })).status, 200);
  // La edición no altera la relación con el género previamente seleccionado.
  assert.equal((await call('PATCH', `/api/media/${movieId}`, { titulo: 'Título final' })).status, 200);

  assert.equal((await call('DELETE', `/api/media/${movieId}`)).status, 200);
  assert.equal((await call('GET', `/api/media/${movieId}`)).status, 404);
  assert.equal((await call('DELETE', `/api/directores/${director.datos.id}`)).status, 200);
  assert.equal((await call('DELETE', `/api/productoras/${productora.datos.id}`)).status, 200);
  assert.equal((await call('DELETE', `/api/generos/${nuevoGenero.datos.id}`)).status, 200);
  assert.equal((await call('DELETE', `/api/generos/${otherGenre.datos.id}`)).status, 200);
  const newType = await call('POST', '/api/tipos', { nombre: 'Documental', descripcion: 'Contenido informativo' });
  assert.equal(newType.status, 201);
  assert.equal((await call('DELETE', `/api/tipos/${newType.datos.id}`)).status, 200);

  assert.equal((await call('GET', '/api/directores/0')).status, 400);
  assert.equal((await call('GET', '/api/ruta-incorrecta')).status, 404);
});
