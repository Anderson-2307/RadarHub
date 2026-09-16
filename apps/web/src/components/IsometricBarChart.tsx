interface Props {
  labels: string[];
  valores: number[];
  cor: string;
  max?: number;
}

// Escurece (percent negativo) ou clareia (positivo) uma cor hex.
function ajustarCor(hex: string, percent: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const BAR_W = 44;
const GAP = 28;
const DEPTH_X = 16;
const DEPTH_Y = -12;
const CHART_H = 170;
const PAD_TOP = 34;
const PAD_BOTTOM = 46;
const PAD_LEFT = 24;

export function IsometricBarChart({ labels, valores, cor, max = 100 }: Props) {
  const corTopo = ajustarCor(cor, 22);
  const corLado = ajustarCor(cor, -22);

  const svgWidth = PAD_LEFT * 2 + labels.length * (BAR_W + GAP) + DEPTH_X;
  const svgHeight = PAD_TOP + CHART_H + PAD_BOTTOM + Math.abs(DEPTH_Y);
  const baseY = PAD_TOP + CHART_H;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={CHART_H + PAD_TOP + PAD_BOTTOM}>
      <line
        x1={PAD_LEFT - 6}
        y1={baseY}
        x2={svgWidth - PAD_LEFT + DEPTH_X}
        y2={baseY}
        stroke="#e3e8f0"
        strokeWidth={1}
      />
      {labels.map((label, i) => {
        const x = PAD_LEFT + i * (BAR_W + GAP);
        const h = Math.max(2, (Math.min(valores[i] ?? 0, max) / max) * CHART_H);
        const y0 = baseY;
        const y1 = baseY - h;

        const bfl = [x, y0];
        const bfr = [x + BAR_W, y0];
        const tfl = [x, y1];
        const tfr = [x + BAR_W, y1];
        const bbr = [x + BAR_W + DEPTH_X, y0 + DEPTH_Y];
        const tbr = [x + BAR_W + DEPTH_X, y1 + DEPTH_Y];
        const tbl = [x + DEPTH_X, y1 + DEPTH_Y];

        const pts = (arr: number[][]) => arr.map((p) => p.join(",")).join(" ");

        return (
          <g key={label}>
            <polygon points={pts([bfr, bbr, tbr, tfr])} fill={corLado} />
            <polygon points={pts([tfl, tfr, tbr, tbl])} fill={corTopo} />
            <polygon points={pts([bfl, bfr, tfr, tfl])} fill={cor} />
            <text
              x={x + BAR_W / 2 + DEPTH_X / 2}
              y={y1 + DEPTH_Y - 8}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="var(--text)"
            >
              {Math.round(valores[i] ?? 0)}
            </text>
            <foreignObject x={x - GAP / 2} y={baseY + 8} width={BAR_W + GAP} height={PAD_BOTTOM - 8}>
              <div
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.25,
                  textAlign: "center",
                  color: "var(--text-soft)",
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
