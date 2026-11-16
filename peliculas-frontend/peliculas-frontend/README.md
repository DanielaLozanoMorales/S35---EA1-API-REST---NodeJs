# EA2 – Frontend ReactJs (Películas y Series)

Aplicación en ReactJs que consume la API REST de la EA1 (Node.js + SQLite).
Módulos: Géneros, Directores, Productoras, Tipos y Media (películas y series).

Librerías: React, axios, react-router-dom v5, sweetalert2 y Bootstrap.

## Ejecución
1. Levantar la API de la EA1: `npm start` en su carpeta (puerto 3000).
2. En este proyecto:
   ```
   npm install
   npm run dev
   ```
3. Abrir http://localhost:5173

Si la API usa otra URL, copia `.env.example` a `.env` y cambia `VITE_API_URL`.

## Estructura
- `src/api.js`: instancia de axios y manejo de errores.
- `src/config.jsx`: define campos y columnas de cada módulo.
- `src/components/CrudPage.jsx`: pantalla CRUD reutilizable (listar, crear, editar, eliminar).
- `src/App.jsx`: menú y rutas con React Router.

## Reglas de negocio reflejadas en la interfaz
- En Media solo se pueden elegir géneros, directores y productoras en estado Activo.
- Serial y URL de la película son únicos: si se repiten, la API responde 409 y se muestra con SweetAlert2.
- No se puede eliminar un registro con producciones relacionadas (error 409 mostrado al usuario).
- Media se puede filtrar por género y por tipo.
