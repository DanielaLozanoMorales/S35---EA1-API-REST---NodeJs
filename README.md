# CineGestor — Evidencia de aprendizaje 3

**IU Digital de Antioquia · Proyecto Integrado II**

Versión autónoma y desplegable basada en el caso de estudio del repositorio de la evidencia 1: https://github.com/DanielaLozanoMorales/S35---EA1-API-REST---NodeJs . Esta entrega integra un **backend REST en Node.js con SQLite** y un **frontend HTML, CSS y JavaScript**, sin dependencias npm externas. Conserva las cinco entidades y rutas principales documentadas en el proyecto original (géneros, directores, productoras, tipos y media).

> **Importante**: Esta es una implementación integral preparada como propuesta de EA3 a partir de la descripción pública de la EA1; no equivale a haber modificado o desplegado el repositorio original de la estudiante. Antes de publicar, comparar y conservar las mejoras correspondientes a las entregas EA1 y EA2.

## Autores de la entrega base
Daniela Lozano Morales · Yovany Anotonio Espinosa David · Jossy Esteban Paternina Julio. Verificar ortografía de todos los nombres y si continúa el mismo grupo para EA3.

## Iniciar localmente

Requiere **Node.js 22.13 o superior** (recomendado 22.16.0 en esta configuración).

```bash
npm start
```

Abrir: http://localhost:3000/ · API: http://localhost:3000/api · Salud: http://localhost:3000/api/health

Para ejecutar las pruebas:

```bash
npm test
```

No hace falta ejecutar `npm install`, porque esta implementación usa exclusivamente librerías incluidas en Node.js.

## Estructura

- `src/server.js`: servidor HTTP, rutas y validaciones.
- `src/database.js`: tablas SQLite, conexión y datos iniciales.
- `public/`: interfaz web con operaciones crear, listar, editar y eliminar.
- `tests/`: pruebas automatizadas.
- `render.yaml`: configuración para despliegue como Web Service en Render.
- `.node-version`: versión de Node compatible con `node:sqlite`.

## API

Cada entidad (`generos`, `directores`, `productoras`, `tipos`, `media`) admite:

- `GET /api/ENTIDAD` y `GET /api/ENTIDAD/:id`
- `POST /api/ENTIDAD`
- `PUT /api/ENTIDAD/:id`
- `PATCH /api/ENTIDAD/:id`
- `DELETE /api/ENTIDAD/:id`

`GET /api/health` devuelve un JSON con estado `ok`. Datos iniciales: géneros Acción, Aventura, Ciencia ficción, Drama, Terror; tipos Película y Serie.

## Despliegue en Render

1. Subir **esta carpeta `aplicacion` como raíz** de un repositorio nuevo, o incorporar sus archivos al repositorio existente conservando historial y trabajo anterior. **No subir el archivo `.sqlite`, ni `.env`**.
2. En https://dashboard.render.com seleccionar **New → Web Service**.
3. Conectar el repositorio y rama `main`.
4. Configurar `Runtime: Node`, `Build Command: npm install`, `Start Command: npm start`, `Instance Type: Free`, `Health Check Path: /api/health` y `NODE_VERSION=22.16.0`. El archivo `render.yaml` contiene un ejemplo equivalente.
5. Esperar un estado satisfactorio; abrir `https://NOMBRE-SERVICIO.onrender.com/` y verificar `.../api/health`.
6. Ejecutar las operaciones en el navegador, crear registro y verificar respuesta API desde otra pestaña. Tomar capturas reales de Render, del navegador y del repositorio.

**Advertencia de persistencia:** Render Free usa almacenamiento efímero. El archivo `data/peliculas.sqlite` puede perder los cambios en reinicios, suspensión o nuevos despliegues; las tablas y catálogos básicos se regeneran al iniciar. Para datos permanentes, migrar a una base de datos administrada como PostgreSQL o un plan con disco persistente.

**Seguridad:** diseño académico demostrativo, sin cuentas ni permisos, por lo que **no debe utilizarse con datos personales o reales** como solución de producción. Antes de exponer datos reales implementar autenticación, autorización, límites de solicitudes y controles adicionales.

## Evidencia de aprendizaje 3

Entregar URL de GitHub con el código final, URL de la aplicación **efectivamente publicada**, video grabado y subido por el grupo a YouTube (3–5 min), enlace de Google Drive si también lo solicita la rúbrica, y documento con portada, introducción, desarrollo, capturas auténticas y conclusiones. No incluir enlaces inventados en la entrega.
