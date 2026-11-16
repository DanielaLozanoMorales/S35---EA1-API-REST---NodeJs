import axios from "axios";

// URL base de la API de la actividad EA1 (NodeJs)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// La API responde { total, datos: [...] } en los listados
export const lista = (res) => (Array.isArray(res.data) ? res.data : res.data?.datos ?? []);

export const mensajeError = (e) => {
  if (!e.response) return "No hay conexión con la API. Verifica que esté corriendo en el puerto 3000.";
  const d = e.response.data;
  const m = typeof d === "string" ? d : d?.error || d?.mensaje || d?.message || d?.detalle;
  if (!m) return `Error ${e.response.status}`;
  return typeof m === "string" ? m : JSON.stringify(m);
};
