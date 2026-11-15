'use strict';
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
function intId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && String(n) === String(value) ? n : null;
}
function requireId(req) {
  const id = intId(req.params.id);
  if (!id) throw httpError(400, 'El ID debe ser un entero positivo.');
  return id;
}
function dbError(error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error.message)) return httpError(409, 'Ya existe otro registro con un campo que debe ser único.');
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || /FOREIGN KEY constraint failed/i.test(error.message)) return httpError(409, 'No se puede eliminar: el registro está relacionado con una producción.');
  if (error.code?.startsWith('SQLITE_CONSTRAINT') || /constraint failed/i.test(error.message)) return httpError(400, 'Los datos no cumplen las restricciones de la base de datos.');
  return error;
}
function validatePayload(body, fields, required = [], full = false) {
  if (!isObject(body)) throw httpError(400, 'Envía un objeto JSON válido.');
  const unknown = Object.keys(body).filter((key) => !fields.includes(key));
  if (unknown.length) throw httpError(400, `Campos no permitidos: ${unknown.join(', ')}`);
  if (full) {
    const absent = required.filter((key) => !Object.hasOwn(body, key));
    if (absent.length) throw httpError(400, `Faltan campos obligatorios: ${absent.join(', ')}`);
  }
  if (!Object.keys(body).length) throw httpError(400, 'Debes enviar al menos un campo.');
}
function textField(value, name, required = false) {
  if (typeof value !== 'string') throw httpError(400, `El campo ${name} debe ser texto.`);
  const v = value.trim();
  if (required && !v) throw httpError(400, `El campo ${name} no puede estar vacío.`);
  return v;
}
function stateField(value) {
  const str = textField(value, 'estado').toLowerCase();
  if (str !== 'activo' && str !== 'inactivo') throw httpError(400, 'El estado debe ser Activo o Inactivo.');
  return str === 'activo' ? 'Activo' : 'Inactivo';
}
function urlField(value, name) {
  const v = textField(value, name, true);
  try {
    const parsed = new URL(v);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocolo no admitido');
  } catch { throw httpError(400, `El campo ${name} debe ser una URL http/https válida.`); }
  return v;
}
function validateYear(value) {
  const limit = new Date().getUTCFullYear() + 10;
  if (!Number.isInteger(value) || value < 1888 || value > limit) {
    throw httpError(400, `El año de estreno debe estar entre 1888 y ${limit}.`);
  }
  return value;
}
module.exports = { httpError, intId, requireId, dbError, validatePayload, textField, stateField, urlField, validateYear };
