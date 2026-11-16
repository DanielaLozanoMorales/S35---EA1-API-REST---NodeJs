import { useCallback, useEffect, useState } from "react";
import { api, lista, mensajeError } from "../api";
import { ok, fail, confirmar } from "../alerts";

export default function CrudPage({ titulo, recurso, campos, columnas, filtros = [] }) {
  const vacio = Object.fromEntries(campos.map((c) => [c.name, c.default ?? ""]));
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState({}); // catálogos para selects (géneros, directores...)
  const [form, setForm] = useState(vacio);
  const [filtro, setFiltro] = useState({});
  const [editId, setEditId] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const fuentes = [...new Set([...campos, ...filtros].map((c) => c.fuente).filter(Boolean))];

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtro).filter(([, v]) => v));
      setItems(lista(await api.get(`/${recurso}`, { params })));
      const pares = await Promise.all(fuentes.map(async (f) => [f, lista(await api.get(`/${f}`))]));
      setCat(Object.fromEntries(pares));
    } catch (e) {
      fail(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [recurso, filtro]); // eslint-disable-line

  useEffect(() => { cerrar(); setFiltro({}); }, [recurso]); // eslint-disable-line
  useEffect(() => { cargar(); }, [cargar]);

  const cerrar = () => { setAbierto(false); setEditId(null); setForm(vacio); };
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const opciones = (c) => {
    if (c.opciones) return c.opciones.map((o) => ({ id: o, texto: o }));
    return (cat[c.fuente] || [])
      .filter((o) => !c.soloActivos || o.estado === "Activo" || String(o.id) === String(form[c.name]))
      .map((o) => ({ id: o.id, texto: o.nombre ?? o.nombres }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(
      campos.map((c) => [c.name, (c.type === "number" || c.fuente) && form[c.name] !== "" ? Number(form[c.name]) : form[c.name]])
    );
    try {
      if (editId) await api.put(`/${recurso}/${editId}`, datos);
      else await api.post(`/${recurso}`, datos);
      ok(editId ? "Registro actualizado" : "Registro creado");
      cerrar();
      cargar();
    } catch (err) {
      fail(mensajeError(err));
    }
  };

  const editar = (it) => {
    setForm(Object.fromEntries(campos.map((c) => [c.name, it[c.name] ?? ""])));
    setEditId(it.id);
    setAbierto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (it) => {
    if (!(await confirmar(it.titulo || it.nombre || it.nombres))) return;
    try {
      await api.delete(`/${recurso}/${it.id}`);
      ok("Registro eliminado");
      cargar();
    } catch (err) {
      fail(mensajeError(err)); // p. ej. 409 si tiene producciones relacionadas
    }
  };

  const campo = (c) => {
    const props = { id: c.name, name: c.name, value: form[c.name], onChange: cambiar, required: c.required };
    if (c.type === "textarea") return <textarea className="form-control" rows="3" {...props} />;
    if (c.type === "select" || c.fuente)
      return (
        <select className="form-select" {...props}>
          <option value="">Selecciona...</option>
          {opciones(c).map((o) => <option key={o.id} value={o.id}>{o.texto}</option>)}
        </select>
      );
    return <input className="form-control" type={c.type || "text"} {...props} />;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 m-0">{titulo}</h1>
        {!abierto && <button className="btn btn-acento" onClick={() => setAbierto(true)}>Agregar</button>}
      </div>

      {abierto && (
        <form className="card card-body mb-4" onSubmit={guardar}>
          <h2 className="h5">{editId ? "Editar registro" : "Nuevo registro"}</h2>
          <div className="row g-3">
            {campos.map((c) => (
              <div key={c.name} className={c.type === "textarea" ? "col-12" : "col-md-6"}>
                <label htmlFor={c.name} className="form-label">{c.label}</label>
                {campo(c)}
              </div>
            ))}
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-acento" type="submit">Guardar</button>
            <button className="btn btn-outline-secondary" type="button" onClick={cerrar}>Cancelar</button>
          </div>
        </form>
      )}

      {filtros.length > 0 && (
        <div className="row g-2 mb-3">
          {filtros.map((f) => (
            <div className="col-md-4" key={f.name}>
              <select className="form-select" aria-label={f.label} value={filtro[f.name] || ""}
                onChange={(e) => setFiltro({ ...filtro, [f.name]: e.target.value })}>
                <option value="">{f.label}: todos</option>
                {(cat[f.fuente] || []).map((o) => <option key={o.id} value={o.id}>{o.nombre ?? o.nombres}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="table-responsive bg-white border rounded">
        <table className="table align-middle m-0">
          <thead>
            <tr>{columnas.map((c) => <th key={c.titulo}>{c.titulo}</th>)}<th className="text-end">Acciones</th></tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={columnas.length + 1} className="text-center py-4">Cargando...</td></tr>}
            {!cargando && items.length === 0 && (
              <tr><td colSpan={columnas.length + 1} className="text-center py-4 text-muted">Aún no hay registros. Usa «Agregar» para crear el primero.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                {columnas.map((c) => <td key={c.titulo}>{c.ver(it, cat)}</td>)}
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-dark me-2" onClick={() => editar(it)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(it)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
