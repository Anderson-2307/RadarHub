import { useMemo, useRef } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { PontuacaoDimensao } from "@radar-sebrae/shared";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  labels: string[];
  atual: number[];
  anterior?: number[] | null;
}

export function RadarComparativo({ labels, atual, anterior }: Props) {
  const chartRef = useRef<ChartJS<"radar">>(null);

  const data = useMemo(() => {
    const datasets = [];
    if (anterior) {
      datasets.push({
        label: "Período anterior",
        data: anterior,
        borderColor: "#9fb2c9",
        backgroundColor: "rgba(159,178,201,.18)",
        borderWidth: 2,
        pointRadius: 3,
      });
    }
    datasets.push({
      label: "Período atual",
      data: atual,
      borderColor: "#0b4f96",
      backgroundColor: "rgba(11,79,150,.20)",
      borderWidth: 2.5,
      pointRadius: 3,
    });
    return { labels, datasets };
  }, [labels, atual, anterior]);

  const options = {
    animation: { duration: 700 },
    plugins: { legend: { display: false } },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 20, backdropColor: "transparent" },
        angleLines: { color: "#e3e8f0" },
        grid: { color: "#e3e8f0" },
        pointLabels: { font: { size: 10.5 } },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div style={{ height: 340 }} id="radar-canvas-wrapper">
      <Radar ref={chartRef} data={data} options={options as any} />
    </div>
  );
}

export function exportarRadarPNG() {
  const canvas = document.querySelector<HTMLCanvasElement>("#radar-canvas-wrapper canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "radar_comparativo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function dimensoesParaValores(labels: string[], porDimensao: PontuacaoDimensao[]) {
  return labels.map((label) => {
    const dim = porDimensao.find((d) => d.nome === label);
    return dim ? Number(dim.pontuacao.toFixed(1)) : 0;
  });
}

export { dimensoesParaValores };
