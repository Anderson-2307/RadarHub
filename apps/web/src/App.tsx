import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { RequireAuth } from "./components/RequireAuth";
import { LoginPage } from "./pages/Login";
import { VisaoGeralPage } from "./pages/VisaoGeral";
import { ComparadorPage } from "./pages/Comparador";
import { RankingPage } from "./pages/Ranking";
import { CidadesPage } from "./pages/Cidades";
import { IndicadoresPage } from "./pages/Indicadores";
import { AvaliacoesPage } from "./pages/Avaliacoes";

function AppShell() {
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  return (
    <div className="shell">
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
        >
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-brand">
          <img src="/radarhub-icon.png" alt="" className="mobile-brand-icon" />
          <span className="mobile-brand-title">
            RADAR <span>HUB</span>
          </span>
        </div>
      </div>

      {menuAberto && <div className="sidebar-backdrop" onClick={() => setMenuAberto(false)} />}

      <Sidebar open={menuAberto} onClose={() => setMenuAberto(false)} />

      <main className="content">
        <Routes>
          <Route path="/" element={<VisaoGeralPage />} />
          <Route path="/comparador" element={<ComparadorPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/cidades" element={<CidadesPage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/avaliacoes" element={<AvaliacoesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
