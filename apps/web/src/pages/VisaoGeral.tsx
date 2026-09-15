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
import { Link } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

function formatPeriodo(periodo: string) {
  const [ano, mes] = periodo.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[Number(mes) - 1]}/${ano.slice(2)}`;
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
            Acompanhe a evolução dos municípios atendidos, identifique indicadores críticos e
            compare o progresso ao longo do tempo.
          </p>
        </div>
        {data && (
          <div className="hero-banner-stat">
            <span className="hero-stat-label">Nota média geral</span>
            <span className="hero-stat-value">{data.notaMediaGeral.toFixed(1)}</span>
            <span className="hero-stat-sub">de 10 — {data.totalCidades} município(s) avaliados</span>
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
              <span className="label">Nota média geral</span>
              <div className="val">{data!.notaMediaGeral.toFixed(1)}</div>
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
              <span className="label">Indicador mais crítico</span>
              <div className="val" style={{ fontSize: 16 }}>
                {data!.indicadorCritico?.nome ?? "—"}
                {data!.indicadorCritico && (
                  <span className="delta down">{data!.indicadorCritico.media.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid-main">
            <div className="card">
              <h3>Top 5 municípios</h3>
              <p className="sub">Nota média da avaliação mais recente</p>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: data!.topRanking.map((r) => `${r.cidadeNome} — ${r.uf}`),
                    datasets: [
                      {
                        label: "Nota média",
                        data: data!.topRanking.map((r) => r.notaMedia),
                        backgroundColor: "rgba(11,79,150,.75)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y" as const,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { suggestedMin: 0, suggestedMax: 10, grid: { color: "#e3e8f0" } },
                      y: { grid: { display: false } },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3>Evolução da nota média</h3>
              <p className="sub">Todas as avaliações agrupadas por período</p>
              <div style={{ height: 260 }}>
                <Line
                  data={{
                    labels: data!.evolucaoTemporal.map((p) => formatPeriodo(p.periodo)),
                    datasets: [
                      {
                        label: "Nota média",
                        data: data!.evolucaoTemporal.map((p) => p.notaMedia),
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
                      y: { suggestedMin: 0, suggestedMax: 10, grid: { color: "#e3e8f0" } },
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
            <h3>Perfil médio dos indicadores</h3>
            <p className="sub">Média geral de todos os municípios, por indicador (avaliação mais recente)</p>
            <RadarComparativo
              labels={data!.perfilMedioIndicadores.map((p) => p.nome)}
              atual={data!.perfilMedioIndicadores.map((p) => Number(p.media.toFixed(1)))}
            />
          </div>
        </>
      )}
    </div>
  );
}
