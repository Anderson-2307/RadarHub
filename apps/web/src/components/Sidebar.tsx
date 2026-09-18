import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, conta, logout } = useAuth();
  const [colapsadas, setColapsadas] = useState<Record<string, boolean>>({});

  function alternar(section: string) {
    setColapsadas((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Fechar menu">
          ✕
        </button>
        <img src="/radarhub-icon.png" alt="" className="brand-icon" />
        <div className="brand-title">
          RADAR <span>HUB</span>
        </div>
        <div className="brand-subtitle">Monitoramento de Indicadores</div>
      </div>
      {links.map((group) => {
        const aberta = !colapsadas[group.section];
        const temAtivo = group.items.some((item) =>
          item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
        );
        return (
          <div key={group.section}>
            <button
              type="button"
              className="side-section-toggle"
              onClick={() => alternar(group.section)}
              aria-expanded={aberta}
            >
              <span className="side-section">{group.section}</span>
              <span className={`side-toggle-icon${temAtivo && !aberta ? " has-active" : ""}`}>
                {aberta ? "−" : "+"}
              </span>
            </button>
            {aberta && (
              <div className="side-group">
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
            )}
          </div>
        );
      })}

      {usuario && (
        <div className="sidebar-account">
          <div className="sidebar-account-info">
            <span className="sidebar-account-nome">{usuario.nome}</span>
            <span className="sidebar-account-conta">{conta?.nome}</span>
          </div>
          <button type="button" className="sidebar-account-sair" onClick={sair}>
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
