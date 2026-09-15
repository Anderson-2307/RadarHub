import { useEffect, useState } from "react";
import type { RankingItem } from "@radar-sebrae/shared";
import { rankingApi } from "../api/client";

export function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    rankingApi.listar().then(setRanking);
  }, []);

  const maior = ranking[0]?.notaMedia ?? 10;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Ranking de municípios</h1>
          <p>Ordenado pela nota média da avaliação mais recente de cada município.</p>
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            Nenhuma avaliação registrada ainda. Cadastre municípios, indicadores e registre avaliações para ver o ranking.
          </div>
        </div>
      ) : (
        <div className="city-cards">
          {ranking.map((r, idx) => (
            <div className="city-card" key={r.cidadeId}>
              <span className="tag">#{idx + 1}</span>
              <h4>{r.cidadeNome}</h4>
              <div className="uf">{r.uf}</div>
              <div className="score-bar-bg">
                <div
                  className="score-bar"
                  style={{ width: `${Math.min(100, (r.notaMedia / maior) * 100)}%` }}
                />
              </div>
              <div className="score-num">
                <span>{r.notaMedia.toFixed(1)} / 10</span>
                <span>
                  {r.variacaoPercentual === null
                    ? "—"
                    : `${r.variacaoPercentual >= 0 ? "+" : ""}${r.variacaoPercentual}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
