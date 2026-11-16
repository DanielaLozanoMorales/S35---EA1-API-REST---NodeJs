// Configuración de los 5 módulos. CrudPage construye cada pantalla a partir de esto.
const estado = { name: "estado", label: "Estado", type: "select", opciones: ["Activo", "Inactivo"], default: "Activo" };
const badge = (it) => <span className={`badge ${it.estado === "Activo" ? "text-bg-success" : "text-bg-secondary"}`}>{it.estado}</span>;

export const modulos = [
  {
    ruta: "/generos", recurso: "generos", titulo: "Géneros",
    campos: [
      { name: "nombre", label: "Nombre", required: true },
      estado,
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
    columnas: [
      { titulo: "Nombre", ver: (it) => it.nombre },
      { titulo: "Estado", ver: badge },
      { titulo: "Descripción", ver: (it) => it.descripcion },
    ],
  },
  {
    ruta: "/directores", recurso: "directores", titulo: "Directores",
    campos: [{ name: "nombres", label: "Nombres", required: true }, estado],
    columnas: [
      { titulo: "Nombres", ver: (it) => it.nombres },
      { titulo: "Estado", ver: badge },
    ],
  },
  {
    ruta: "/productoras", recurso: "productoras", titulo: "Productoras",
    campos: [
      { name: "nombre", label: "Nombre", required: true },
      estado,
      { name: "slogan", label: "Slogan" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
    columnas: [
      { titulo: "Nombre", ver: (it) => it.nombre },
      { titulo: "Estado", ver: badge },
      { titulo: "Slogan", ver: (it) => it.slogan },
    ],
  },
  {
    ruta: "/tipos", recurso: "tipos", titulo: "Tipos",
    campos: [
      { name: "nombre", label: "Nombre", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
    columnas: [
      { titulo: "Nombre", ver: (it) => it.nombre },
      { titulo: "Descripción", ver: (it) => it.descripcion },
    ],
  },
  {
    ruta: "/media", recurso: "media", titulo: "Películas y series",
    campos: [
      { name: "serial", label: "Serial (único)", required: true },
      { name: "titulo", label: "Título", required: true },
      { name: "sinopsis", label: "Sinopsis", type: "textarea" },
      { name: "url_pelicula", label: "URL de la película (única)", type: "url", required: true },
      { name: "portada", label: "URL de la portada", type: "url" },
      { name: "anio_estreno", label: "Año de estreno", type: "number", required: true },
      { name: "genero_id", label: "Género", fuente: "generos", soloActivos: true, required: true },
      { name: "director_id", label: "Director", fuente: "directores", soloActivos: true, required: true },
      { name: "productora_id", label: "Productora", fuente: "productoras", soloActivos: true, required: true },
      { name: "tipo_id", label: "Tipo", fuente: "tipos", required: true },
    ],
    filtros: [
      { name: "genero_id", label: "Filtrar por género", fuente: "generos" },
      { name: "tipo_id", label: "Filtrar por tipo", fuente: "tipos" },
    ],
    columnas: [
      { titulo: "Portada", ver: (it) => it.portada ? <img className="portada" src={it.portada} alt={it.titulo} onError={(e) => (e.currentTarget.style.visibility = "hidden")} /> : <div className="portada" /> },
      { titulo: "Título", ver: (it) => <><strong>{it.titulo}</strong><div className="small text-muted">{it.serial}</div></> },
      { titulo: "Año", ver: (it) => it.anio_estreno },
      { titulo: "Género", ver: (it, c) => nombreDe(c.generos, it.genero_id) },
      { titulo: "Director", ver: (it, c) => nombreDe(c.directores, it.director_id) },
      { titulo: "Productora", ver: (it, c) => nombreDe(c.productoras, it.productora_id) },
      { titulo: "Tipo", ver: (it, c) => nombreDe(c.tipos, it.tipo_id) },
    ],
  },
];

function nombreDe(lista = [], id) {
  const o = lista.find((x) => x.id === id);
  return o ? o.nombre ?? o.nombres : id;
}
