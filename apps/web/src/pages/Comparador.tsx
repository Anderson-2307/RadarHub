import { useEffect, useMemo, useState } from "react";
import type { Avaliacao, Cidade, EixoComEstrutura } from "@radar-sebrae/shared";
import { avaliacoesApi, cidadesApi, estruturaApi } from "../api/client";
import { RadarComparativo, exportarRadarPNG, dimensoesParaValores } from "../components/RadarComparativo";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function formatDataBR(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function ComparadorPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [estrutura, setEstrutura] = useState<EixoComEstrutura[]>([]);
  const [cidadeId, setCidadeId] = useState("");
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [idAnterior, setIdAnterior] = useState("");
  const [idAtual, setIdAtual] = useState("");

  useEffect(() => {
    Promise.all([cidadesApi.listar(), estruturaApi.listar()]).then(([c, est]) => {
      setCidades(c.filter((x) => x.ativo));
      setEstrutura(est);
    });
  }, []);

  useEffect(() => {
    if (!cidadeId) {
      setAvaliacoes([]);
      return;
    }
    avaliacoesApi.listarPorCidade(cidadeId).then((lista) => {
      setAvaliacoes(lista);
      if (lista.length >= 2) {
        setIdAnterior(lista[lista.length - 2].id);
        setIdAtual(lista[lista.length - 1].id);
      } else if (lista.length === 1) {
        setIdAnterior("");
        setIdAtual(lista[0].id);
      } else {
        setIdAnterior("");
        setIdAtual("");
      }
    });
  }, [cidadeId]);

  const labels = useMemo(
    () => estrutura.flatMap((eixo) => eixo.dimensoes.map((d) => d.nome)),
    [estrutura]
  );

  const avaliacaoAtual = avaliacoes.find((a) => a.id === idAtual);
  const avaliacaoAnterior = avaliacoes.find((a) => a.id === idAnterior);

  const valoresAtual = avaliacaoAtual ? dimensoesParaValores(labels, avaliacaoAtual.porDimensao) : [];
  const valoresAnterior = avaliacaoAnterior ? dimensoesParaValores(labels, avaliacaoAnterior.porDimensao) : null;

  const variacoes = labels.map((label, idx) => {
    const atual = valoresAtual[idx] ?? 0;
    const anterior = valoresAnterior ? valoresAnterior[idx] : null;
    let diff: number | null = null;
    if (anterior !== null) {
      diff = anterior === 0 ? (atual > 0 ? 100 : 0) : ((atual - anterior) / anterior) * 100;
    }
    return { label, atual, anterior, diff };
  });

  const indiceAtual = avaliacaoAtual?.indiceGeral ?? 0;
  const indiceAnterior = avaliacaoAnterior?.indiceGeral ?? null;
  const deltaIndice = indiceAnterior !== null ? indiceAtual - indiceAnterior : null;

  async function exportarPDF() {
    const el = document.getElementById("area-exportar");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const cidadeNome = cidades.find((c) => c.id === cidadeId)?.nome ?? "";

    pdf.setFontSize(16);
    pdf.text(`Radar Comparativo — ${cidadeNome}`, 105, 15, { align: "center" });
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 15, 24, imgWidth, imgHeight);
    pdf.save(`radar_comparativo_${cidadeNome || "cidade"}.pdf`);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Comparador de Radar</h1>
          <p>Compare a evolução do índice de um município entre dois períodos, por dimensão.</p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <span className="label">Índice geral — período atual</span>
          <div className="val">
            {indiceAtual.toFixed(0)}
            {deltaIndice !== null && (
              <span className={`delta ${deltaIndice >= 0 ? "up" : "down"}`}>
                {deltaIndice >= 0 ? "+" : ""}
                {deltaIndice.toFixed(0)}
              </span>
            )}
          </div>
        </div>
        <div className="kpi">
          <span className="label">Municípios avaliados</span>
          <div className="val">{cidades.length}</div>
        </div>
        <div className="kpi">
          <span className="label">Avaliações deste município</span>
          <div className="val">{avaliacoes.length}</div>
        </div>
        <div className="kpi">
          <span className="label">Dimensões no radar</span>
          <div className="val">{labels.length}</div>
        </div>
      </div>

      <div className="grid-main">
        <div className="card" id="area-exportar">
          <h3>Radar Comparativo</h3>
          <p className="sub">
            {cidades.find((c) => c.id === cidadeId)?.nome ?? "Selecione um município"}
          </p>

          <div className="filters">
            <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
              <option value="">-- selecione o município --</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.uf}
                </option>
              ))}
            </select>
            <div className="filters-periodos">
              <select value={idAnterior} onChange={(e) => setIdAnterior(e.target.value)}>
                <option value="">Sem período anterior</option>
                {avaliacoes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatDataBR(a.periodoInicio)} → {formatDataBR(a.periodoFim)}
                  </option>
                ))}
              </select>
              <select value={idAtual} onChange={(e) => setIdAtual(e.target.value)}>
                <option value="">-- período atual --</option>
                {avaliacoes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatDataBR(a.periodoInicio)} → {formatDataBR(a.periodoFim)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!avaliacaoAtual ? (
            <div className="empty-state">
              Selecione um município com ao menos uma avaliação registrada para visualizar o radar.
            </div>
          ) : (
            <>
              <RadarComparativo labels={labels} atual={valoresAtual} anterior={valoresAnterior} />
              <div className="legend-row">
                {valoresAnterior && (
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#9fb2c9" }} />
                    Período anterior
                  </div>
                )}
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--sebrae-blue-700)" }} />
                  Período atual
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Variação por dimensão</h3>
          <p className="sub">Diferença percentual entre os períodos selecionados</p>
          {variacoes.length === 0 || !avaliacaoAtual ? (
            <div className="empty-state">Sem dados para exibir.</div>
          ) : (
            <div className="variacao-table">
              <div className="variacao-head">
                <span>Dimensão</span>
                <span>Anterior</span>
                <span>Atual</span>
                <span>Variação</span>
              </div>
              {variacoes.map((v) => (
                <div className="variacao-row" key={v.label}>
                  <span className="indic-name">{v.label}</span>
                  <span className="pill prev">{v.anterior !== null ? v.anterior : "—"}</span>
                  <span className="pill now">{v.atual}</span>
                  {v.diff !== null ? (
                    <span className={`pill ${v.diff >= 0 ? "diff-up" : "diff-down"}`}>
                      {v.diff >= 0 ? "+" : ""}
                      {v.diff.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="pill">—</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {avaliacaoAtual && (
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn-ghost" onClick={exportarRadarPNG}>
                Exportar PNG
              </button>
              <button className="btn-primary" onClick={exportarPDF}>
                Exportar PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
