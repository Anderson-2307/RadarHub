import { NavLink } from "react-router-dom";

const links = [
  { section: "Principal", items: [
    { to: "/", label: "Visão Geral" },
    { to: "/comparador", label: "Comparador de Radar" },
    { to: "/ranking", label: "Ranking de Municípios" },
  ]},
  { section: "Cadastros", items: [
    { to: "/cidades", label: "Municípios" },
    { to: "/indicadores", label: "Indicadores" },
    { to: "/avaliacoes", label: "Registrar Avaliação" },
  ]},
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        RADAR HUB
      </div>
      {links.map((group) => (
        <div key={group.section}>
          <div className="side-section">{group.section}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `side-link${isActive ? " active" : ""}`}
            >
              <span className="ic" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
