import { BrowserRouter, NavLink, Redirect, Route, Switch } from "react-router-dom";
import CrudPage from "./components/CrudPage";
import { modulos } from "./config";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg barra">
        <div className="container">
          <span className="navbar-brand text-white">Películas y Series</span>
          <ul className="navbar-nav flex-row flex-wrap gap-3">
            {modulos.map((m) => (
              <li className="nav-item" key={m.ruta}>
                <NavLink className="nav-link" activeClassName="activo" to={m.ruta}>{m.titulo}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <main className="container py-4">
        <Switch>
          <Redirect exact from="/" to="/media" />
          {modulos.map((m) => (
            <Route key={m.ruta} path={m.ruta}>
              <CrudPage {...m} />
            </Route>
          ))}
          <Route><p>Página no encontrada.</p></Route>
        </Switch>
      </main>
    </BrowserRouter>
  );
}
