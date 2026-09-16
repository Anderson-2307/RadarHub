import { useEffect, useState } from "react";
import type { DashboardOverview } from "@radar-sebrae/shared";
import { dashboardApi } from "../api/client";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { RadarComparativo } from "../components/RadarComparativo";
import { IsometricBarChart } from "../components/IsometricBarChart";
import { Link } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

function formatPeriodo(periodo: string) {
  const [ano, mes] = periodo.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[Number(mes) - 1]}/${ano.slice(2)}`;
}

const ORDEM_EIXOS = ["Gestão", "Competitividade", "Inovação"];
const COR_EIXO: Record<string, string> = {
  Gestão: "#00274d",
  Competitividade: "#0b4f96",
  Inovação: "#e79c00",
};

function agruparPorEixo(dimensoes: { eixoNome: string; nome: string; media: number }[]) {
  const grupos = new Map<string, { nome: string; media: number }[]>();
  for (const d of dimensoes) {
    const atual = grupos.get(d.eixoNome) ?? [];
    atual.push({ nome: d.nome, media: d.media });
    grupos.set(d.eixoNome, atual);
  }
  const nomes = [...ORDEM_EIXOS.filter((n) => grupos.has(n)), ...Array.from(grupos.keys()).filter((n) => !ORDEM_EIXOS.includes(n))];
  return nomes.map((eixoNome) => ({ eixoNome, dimensoes: grupos.get(eixoNome)! }));
}

export function VisaoGeralPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    dashboardApi.overview().then(setData);
  }, []);

  const semDados = !data || data.totalCidades === 0;

  return (
    <div>
      <div className="hero-banner">
        <div className="hero-banner-text">
          <span className="hero-eyebrow">
            <span className="hero-dot" />
            Panorama geral do Radar Hub
          </span>
          <h1>
            Desenvolvimento municipal{" "}
            <span>em uma visão só</span>
          </h1>
          <p>
            Acompanhe a evolução dos municípios atendidos, identifique dimensões críticas e
            compare o progresso ao longo do tempo — índice de maturidade de 0 a 100.
          </p>
        </div>
        {data && (
          <div className="hero-banner-stat">
            <span className="hero-stat-label">Índice médio geral</span>
            <span className="hero-stat-value">{data.indiceMedioGeral.toFixed(0)}</span>
            <span className="hero-stat-sub">de 100 — {data.totalCidades} município(s) avaliados</span>
          </div>
        )}
      </div>

      {semDados ? (
        <div className="card">
          <div className="empty-state">
            Ainda não há avaliações registradas.{" "}
            <Link to="/avaliacoes" style={{ color: "var(--sebrae-blue-700)", fontWeight: 700 }}>
              Cadastre municípios, indicadores e registre a primeira avaliação
            </Link>{" "}
            para ver o panorama aqui.
          </div>
        </div>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi">
              <span className="label">Índice médio geral</span>
              <div className="val">{data!.indiceMedioGeral.toFixed(0)}</div>
            </div>
            <div className="kpi">
              <span className="label">Municípios avaliados</span>
              <div className="val">{data!.totalCidades}</div>
            </div>
            <div className="kpi">
              <span className="label">Avaliações registradas</span>
              <div className="val">{data!.totalAvaliacoes}</div>
            </div>
            <div className="kpi">
              <span className="label">Dimensão mais crítica</span>
              <div className="val" style={{ fontSize: 16 }}>
                {data!.dimensaoCritica?.nome ?? "—"}
                {data!.dimensaoCritica && (
                  <span className="delta down">{data!.dimensaoCritica.media.toFixed(0)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid-main">
            <div className="card">
              <h3>Top 5 municípios</h3>
              <p className="sub">Índice geral da avaliação mais recente</p>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: data!.topRanking.map((r) => `${r.cidadeNome} — ${r.uf}`),
                    datasets: [
                      {
                        label: "Índice geral",
                        data: data!.topRanking.map((r) => r.indiceGeral),
                        backgroundColor: "rgba(11,79,150,.75)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y" as const,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { suggestedMin: 0, suggestedMax: 100, grid: { color: "#e3e8f0" } },
                      y: { grid: { display: false } },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3>Evolução do índice médio</h3>
              <p className="sub">Todas as avaliações agrupadas por período</p>
              <div style={{ height: 260 }}>
                <Line
                  data={{
                    labels: data!.evolucaoTemporal.map((p) => formatPeriodo(p.periodo)),
                    datasets: [
                      {
                        label: "Índice médio",
                        data: data!.evolucaoTemporal.map((p) => p.indiceMedio),
                        borderColor: "#00b3a4",
                        backgroundColor: "rgba(0,179,164,.15)",
                        borderWidth: 2.5,
                        pointRadius: 4,
                        fill: true,
                        tension: 0.35,
                      },
                    ],
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { suggestedMin: 0, suggestedMax: 100, grid: { color: "#e3e8f0" } },
                      x: { grid: { display: false } },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Perfil médio por dimensão</h3>
            <p className="sub">Média geral de todos os municípios, por dimensão (avaliação mais recente)</p>
            <RadarComparativo
              labels={data!.perfilMedioDimensoes.map((p) => p.nome)}
              atual={data!.perfilMedioDimensoes.map((p) => Number(p.media.toFixed(1)))}
            />
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Dimensões por eixo</h3>
            <p className="sub">Pontuação média (0-100) de cada dimensão, agrupada por eixo</p>
            <div className="eixos-cols">
              {agruparPorEixo(data!.perfilMedioDimensoes).map((grupo) => (
                <div key={grupo.eixoNome} style={{ textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 14 }}>{grupo.eixoNome}</h4>
                  <IsometricBarChart
                    labels={grupo.dimensoes.map((d) => d.nome)}
                    valores={grupo.dimensoes.map((d) => d.media)}
                    cor={COR_EIXO[grupo.eixoNome] ?? "#0b4f96"}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
