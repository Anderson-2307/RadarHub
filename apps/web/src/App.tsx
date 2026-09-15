import { Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { VisaoGeralPage } from "./pages/VisaoGeral";
import { ComparadorPage } from "./pages/Comparador";
import { RankingPage } from "./pages/Ranking";
import { CidadesPage } from "./pages/Cidades";
import { IndicadoresPage } from "./pages/Indicadores";
import { AvaliacoesPage } from "./pages/Avaliacoes";

export default function App() {
  return (
    <div className="shell">
      <Sidebar />
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
