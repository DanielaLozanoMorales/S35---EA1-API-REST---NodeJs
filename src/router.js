'use strict';
// Enrutador HTTP mínimo construido con los módulos nativos de Node.js.
// Implementa los métodos REST requeridos sin paquetes externos.
function Router() {
  const routes = [];
  const router = { routes };
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    router[method.toLowerCase()] = (path, handler) => {
      routes.push({ method, path, handler });
      return router;
    };
  }
  return router;
}
module.exports = { Router };
