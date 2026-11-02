# API REST – Gestión de películas y series

**Evidencia de aprendizaje:** API REST – Node.js  
**Asignatura:** Ingeniería Web II  
**Institución:** IU Digital de Antioquia  
**Integrantes:** Daniela Lozano Morales, Yovany Anotonio Espinosa David, Jossy Esteban Paternina Julio

## 1. Objetivo

Desarrollar una API REST en JavaScript del lado del servidor con Node.js (módulo HTTP nativo), respaldada por una base de datos relacional SQLite y comprobada con Postman. Se implementan los módulos Género, Director, Productora, Tipo y Media.

**Alcance de esta evidencia:** API y base de datos. El enunciado general menciona frontend e integración futura; **esta entrega se limita a la API REST** solicitada en la actividad. No incluye sistema de usuarios ni seguridad, porque el caso de estudio no los solicita por ahora.

## 2. Requisitos previos

- Node.js **22.13 o superior** y npm (solo para ejecutar los scripts). Descargar de https://nodejs.org/
- Postman (https://www.postman.com/downloads/) o un cliente HTTP equivalente.
- No necesitas instalar paquetes adicionales ni SQLite por separado: se utiliza el módulo `node:sqlite` que viene con Node.js. En versiones 22.x puede aparecer una advertencia de característica experimental.

## 3. Instalación y ejecución

```bash
npm start
```

Abrir: <http://localhost:3000/api>

Para desarrollo, también se puede ejecutar `npm run dev`. Para ejecutar pruebas automatizadas: `npm test`.

La base de datos se crea automáticamente en `data/peliculas.sqlite` al iniciar por primera vez. El esquema está en `sql/schema.sql`.

## 4. Diseño de la base de datos

| Tabla | Campos (además del identificador y las fechas) | Relaciones |
| --- | --- | --- |
| `generos` | `nombre` (único), `estado`, `descripcion` | 1 género tiene muchas producciones |
| `directores` | `nombres`, `estado` | 1 director tiene muchas producciones |
| `productoras` | `nombre` (único), `estado`, `slogan`, `descripcion` | 1 productora tiene muchas producciones |
| `tipos` | `nombre` (único), `descripcion` | 1 tipo tiene muchas producciones |
| `media` | `serial` (único), `titulo`, `sinopsis`, `url_pelicula` (única), `portada`, `anio_estreno`, `genero_id`, `director_id`, `productora_id`, `tipo_id` | 4 claves foráneas |

Todas las tablas incluyen `id`, `fecha_creacion`, `fecha_actualizacion`; se generan automáticamente. En la columna `portada` se almacena una URL a una imagen, no el archivo binario.

Relaciones: `generos (1) → (N) media`, `directores (1) → (N) media`, `productoras (1) → (N) media`, `tipos (1) → (N) media`.

La aplicación precarga los géneros **Acción, Aventura, Ciencia ficción, Drama y Terror** y los tipos **Película y Serie**, tal como solicita el caso. No precarga películas ficticias.

## 5. Métodos de la API

Los cinco recursos tienen los siguientes métodos:

| Método | Ruta de ejemplo | Finalidad |
| --- | --- | --- |
| GET | `/api/generos` | Listar registros |
| GET | `/api/generos/1` | Consultar por ID |
| POST | `/api/generos` | Crear registro |
| PUT | `/api/generos/1` | Actualizar registro; requiere campos obligatorios |
| PATCH | `/api/generos/1` | Actualizar parcialmente |
| DELETE | `/api/generos/1` | Eliminar registro |

Reemplaza `generos` por `directores`, `productoras`, `tipos` o `media` para utilizar los otros módulos.

Consultas opcionales:
- `GET /api/generos?estado=Activo`
- `GET /api/directores?estado=Inactivo`
- `GET /api/productoras?estado=Activo`
- `GET /api/media?genero_id=1`
- `GET /api/media?tipo_id=2`
- `GET /api/media?genero_id=1&tipo_id=2`

## 6. Ejemplos de peticiones en Postman

Encabezado para POST, PUT o PATCH: `Content-Type: application/json`.

### Género — POST `/api/generos`

```json
{
  "nombre": "Comedia",
  "estado": "Activo",
  "descripcion": "Producciones de humor"
}
```

### Director — POST `/api/directores`

```json
{
  "nombres": "Director de ejemplo",
  "estado": "Activo"
}
```

### Productora — POST `/api/productoras`

```json
{
  "nombre": "Productora de ejemplo",
  "estado": "Activo",
  "slogan": "Historias que inspiran",
  "descripcion": "Productora creada para prácticas académicas"
}
```

### Tipo — POST `/api/tipos`

```json
{
  "nombre": "Documental",
  "descripcion": "Producción audiovisual documental"
}
```

### Media — POST `/api/media`

Primero consulta en Postman los IDs existentes con GET en cada catálogo. La solicitud siguiente **supone** que existen y están activos el género 1, el director 1, la productora 1, y existe el tipo 1. Reemplaza los identificadores por los que devuelva tu propia API.

```json
{
  "serial": "PEL-001",
  "titulo": "Película de ejemplo",
  "sinopsis": "Historia ficticia utilizada para probar la API.",
  "url_pelicula": "https://example.com/videos/pelicula-ejemplo",
  "portada": "https://example.com/portadas/pelicula-ejemplo.jpg",
  "anio_estreno": 2024,
  "genero_id": 1,
  "director_id": 1,
  "productora_id": 1,
  "tipo_id": 1
}
```

**Importante:** las direcciones `example.com` son datos demostrativos; no alojan películas ni portadas reales. El sistema administra sus enlaces y metadatos, no reproduce videos desde el backend.

## 7. Reglas de negocio implementadas

1. `serial` y `url_pelicula` no pueden repetirse. La base de datos lo garantiza con `UNIQUE`.
2. Una producción tiene exactamente un género principal, un director principal, una productora principal y un tipo.
3. Solo pueden **seleccionarse** géneros, directores y productoras en estado `Activo` al crear o modificar una asociación de Media.
4. `tipos` no tiene campo `estado`, en concordancia con el PDF.
5. Las fechas de creación/actualización se gestionan en el servidor, no en Postman.
6. Si un catálogo está relacionado con alguna producción, no puede borrarse sin borrar o reasignar antes esa producción.
7. Se admite modificar los demás atributos de Media si una asociación que ya existía quedó inactiva; no se admite seleccionarla como asociación nueva.
8. Las URLs de películas/portadas deben usar `http` o `https`; `anio_estreno` debe ser un número entero válido.

## 8. Respuestas HTTP

| Código | Significado |
| --- | --- |
| 200 | Consulta, actualización o eliminación exitosa |
| 201 | Registro creado |
| 400 | Error de validación o asociación inválida/inactiva |
| 404 | Ruta o registro inexistente |
| 409 | Conflicto por duplicados o borrado con relaciones |
| 500 | Error no controlado del servidor |

## 9. Pruebas en Postman

1. Inicia el servidor con `npm start`.
2. En Postman, selecciona **Import → File** e importa `postman/API_Peliculas.postman_collection.json`.
3. En la colección configura `baseUrl` con `http://localhost:3000` (ya viene por defecto).
4. Ejecuta las peticiones en el orden de sus carpetas. Las pruebas crean datos de demostración y almacenan IDs automáticamente.
5. Comprueba las respuestas 200, 201, 400 y 409; toma capturas para la entrega.

La colección contiene rutas de consultas, creación, modificación, eliminación y una validación de una asociación inactiva. Los módulos son independientes, salvo los cuatro vínculos de Media.

## 10. Evidencias recomendadas para entregar

- Código fuente de la carpeta `src` y `package.json`.
- Esquema SQL (`sql/schema.sql`).
- Colección de Postman ejecutada y capturas de solicitudes/respuestas.
- README con instrucciones y explicación de las relaciones.
- Nombres de **2 a 4 integrantes**, según la actividad.

## 11. Notas técnicas

La API usa **Node.js HTTP nativo y `node:sqlite`**, sin Express ni dependencias externas. Express se mencionó como recurso de consulta, pero no es obligatorio en el enunciado. Se permite CORS abierto **solo como implementación académica local**. No debe publicarse en internet sin incorporar controles de autenticación/autorización, validación adicional, límites de solicitudes y configuración de CORS adecuada.

## 12. Referencias

- IU Digital de Antioquia. *Caso de estudio: Películas*. Material de Ingeniería Web II, PDF suministrado en la actividad.
- Node.js. *HTTP*. https://nodejs.org/api/http.html
- Node.js. *SQLite*. https://nodejs.org/api/sqlite.html
- Express. *Express.js* (lectura recomendada por la actividad). https://expressjs.com/es/
- SQLite. *SQLite Documentation*. https://www.sqlite.org/docs.html
- Postman. *Postman Documentation*. https://learning.postman.com/docs/
