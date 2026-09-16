import { useEffect, useMemo, useState } from "react";
import type { Cidade, EixoComEstrutura } from "@radar-sebrae/shared";
import { avaliacoesApi, cidadesApi, estruturaApi } from "../api/client";

function eixoClasse(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("gest")) return "eixo-gestao";
  if (n.includes("competit")) return "eixo-competitividade";
  if (n.includes("inova")) return "eixo-inovacao";
  return "eixo-gestao";
}

export function AvaliacoesPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [estrutura, setEstrutura] = useState<EixoComEstrutura[]>([]);
  const [cidadeId, setCidadeId] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function notasIniciais(est: EixoComEstrutura[]) {
    const iniciais: Record<string, string> = {};
    est.forEach((eixo) =>
      eixo.dimensoes.forEach((dim) =>
        dim.indicadores.filter((i) => i.ativo).forEach((ind) => (iniciais[ind.id] = "3"))
      )
    );
    return iniciais;
  }

  useEffect(() => {
    Promise.all([cidadesApi.listar(), estruturaApi.listar()]).then(([c, est]) => {
      setCidades(c.filter((x) => x.ativo));
      setEstrutura(est);
      setNotas(notasIniciais(est));
    });
  }, []);

  const indicadoresAtivos = useMemo(
    () =>
      estrutura.flatMap((eixo) =>
        eixo.dimensoes.flatMap((dim) => dim.indicadores.filter((i) => i.ativo))
      ),
    [estrutura]
  );

  function setNota(id: string, valor: string) {
    setNotas((prev) => ({ ...prev, [id]: valor }));
  }

  const indicePrevia = useMemo(() => {
    let somaGeral = 0;
    for (const eixo of estrutura) {
      let somaDim = 0;
      let qtdDim = 0;
      for (const dim of eixo.dimensoes) {
        const ativos = dim.indicadores.filter((i) => i.ativo);
        if (ativos.length === 0) continue;
        let somaPonderada = 0;
        let somaPesos = 0;
        for (const ind of ativos) {
          const nota = Number(notas[ind.id]);
          if (Number.isNaN(nota)) continue;
          somaPonderada += nota * ind.peso;
          somaPesos += ind.peso;
        }
        if (somaPesos === 0) continue;
        const mediaDim = somaPonderada / somaPesos;
        somaDim += ((mediaDim - 1) / 4) * 100;
        qtdDim += 1;
      }
      if (qtdDim === 0) continue;
      somaGeral += (somaDim / qtdDim) * eixo.peso;
    }
    return somaGeral;
  }, [estrutura, notas]);

  async function salvar() {
    if (salvando) return;
    setErro(null);
    setSucesso(false);

    if (!cidadeId || !dataAvaliacao || !periodoInicio || !periodoFim) {
      setErro("Preencha o município, a data e o período da avaliação.");
      return;
    }
    if (periodoFim < periodoInicio) {
      setErro("O fim do período não pode ser anterior ao início.");
      return;
    }

    const notasArray = indicadoresAtivos.map((ind) => ({
      indicadorId: ind.id,
      nota: Number(notas[ind.id]),
    }));

    for (const n of notasArray) {
      if (Number.isNaN(n.nota) || n.nota < 1 || n.nota > 5) {
        setErro("Todas as notas devem estar entre 1 e 5.");
        return;
      }
    }

    setSalvando(true);
    try {
      await avaliacoesApi.criar({
        cidadeId,
        dataAvaliacao,
        periodoInicio,
        periodoFim,
        notas: notasArray,
      });
      setSucesso(true);
      setCidadeId("");
      setDataAvaliacao("");
      setPeriodoInicio("");
      setPeriodoFim("");
      setNotas(notasIniciais(estrutura));
    } catch (err: any) {
      setErro(err?.response?.data?.error ?? "Erro ao registrar avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Registrar avaliação</h1>
          <p>Selecione o município, o período avaliado e dê uma nota de 1 a 5 (maturidade) para cada indicador ativo.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Dados da avaliação</h3>
        <div className="form-grid">
          <div className="field-group">
            <label>Município</label>
            <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
              <option value="">-- selecione --</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.uf}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Data da avaliação</label>
            <input type="date" value={dataAvaliacao} onChange={(e) => setDataAvaliacao(e.target.value)} />
          </div>
          <div />
          <div className="field-group">
            <label>Período — início</label>
            <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
          </div>
          <div className="field-group">
            <label>Período — fim</label>
            <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
          </div>
        </div>
      </div>

      {indicadoresAtivos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            Nenhum indicador ativo cadastrado. Cadastre indicadores em "Estrutura do Radar" antes de
            registrar uma avaliação.
          </div>
        </div>
      ) : (
        <>
          <div className="kpi-row" style={{ gridTemplateColumns: "repeat(1, 1fr)", marginBottom: 20 }}>
            <div className="kpi">
              <span className="label">Índice geral (prévia)</span>
              <div className="val">{indicePrevia.toFixed(1)} / 100</div>
            </div>
          </div>

          <div className="eixos-cols">
            {estrutura.map((eixo) => (
              <div className={`eixo-col ${eixoClasse(eixo.nome)}`} key={eixo.id}>
                <div className="eixo-col-head">
                  <h4>{eixo.nome}</h4>
                  <span>{Math.round(eixo.peso * 100)}%</span>
                </div>
                {eixo.dimensoes.map((dim) => {
                  const ativos = dim.indicadores.filter((i) => i.ativo);
                  if (ativos.length === 0) return null;
                  return (
                    <div className="dimensao-block" key={dim.id}>
                      <h5>{dim.nome}</h5>
                      {ativos.map((ind) => (
                        <div className="nota-row" style={{ background: "transparent", border: "none", padding: "4px 0" }} key={ind.id}>
                          <label style={{ color: "inherit" }}>{ind.nome}</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            step={1}
                            value={notas[ind.id] ?? ""}
                            onChange={(e) => setNota(ind.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="btn-accent" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar avaliação"}
              </button>
              {sucesso && <span style={{ color: "#00867b", fontWeight: 600, fontSize: 13.5 }}>Avaliação registrada com sucesso.</span>}
            </div>
            {erro && <div className="error-msg">{erro}</div>}
          </div>
        </>
      )}
    </div>
  );
}
