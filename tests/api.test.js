'use strict';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {createApp}=require('../src/server');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ea3-peliculas-'));
const {server,db}=createApp({dbPath:path.join(tmp,'tests.sqlite')});
let base;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(tmp,{recursive:true,force:true});});
async function request(url,method='GET',data){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json()};}
test('API responde y el frontend está disponible',async()=>{const health=await request('/api/health');assert.equal(health.status,200);const index=await fetch(base+'/');assert.equal(index.status,200);assert.match(await index.text(),/CineGestor/);});
test('catálogos iniciales y CRUD',async()=>{
 const list=await request('/api/generos');assert.equal(list.status,200);assert.equal(list.body.length,5);
 const added=await request('/api/generos','POST',{nombre:'Comedia',estado:'Activo',descripcion:'Humor'});assert.equal(added.status,201);
 const id=added.body.id;
 assert.equal((await request(`/api/generos/${id}`)).body.nombre,'Comedia');
 assert.equal((await request(`/api/generos/${id}`,'PATCH',{descripcion:'Comedia y humor'})).body.descripcion,'Comedia y humor');
 assert.equal((await request(`/api/generos/${id}`,'DELETE')).status,200);
 assert.equal((await request(`/api/generos/${id}`)).status,404);
});
test('duplicados, validación de relaciones y HTTP',async()=>{
 assert.equal((await request('/api/generos','POST',{nombre:'Acción'})).status,409);
 const invalid=await request('/api/media','POST',{serial:'X1',titulo:'Prueba',url_pelicula:'www.invalida',anio_estreno:2020,genero_id:1,director_id:99,productora_id:99,tipo_id:1});
 assert.equal(invalid.status,400);
 const director=await request('/api/directores','POST',{nombres:'Directora de prueba',estado:'Activo'});
 const productora=await request('/api/productoras','POST',{nombre:'Productora de prueba',estado:'Activo'});
 const media=await request('/api/media','POST',{serial:'PEL-001',titulo:'Prueba de película',url_pelicula:'https://example.com/pelicula',anio_estreno:2024,genero_id:1,director_id:director.body.id,productora_id:productora.body.id,tipo_id:1});
 assert.equal(media.status,201);
 assert.equal((await request(`/api/directores/${director.body.id}`,'DELETE')).status,409);
 assert.equal((await request(`/api/media/${media.body.id}`,'DELETE')).status,200);
});
