import { useEffect, useState } from "react";
import type { Cidade, Indicador } from "@radar-sebrae/shared";
import { avaliacoesApi, cidadesApi, indicadoresApi } from "../api/client";

export function AvaliacoesPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [cidadeId, setCidadeId] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    Promise.all([cidadesApi.listar(), indicadoresApi.listar(true)]).then(([c, i]) => {
      setCidades(c.filter((x) => x.ativo));
      setIndicadores(i);
      const iniciais: Record<string, string> = {};
      i.forEach((ind) => (iniciais[ind.id] = "5"));
      setNotas(iniciais);
    });
  }, []);

  function setNota(id: string, valor: string) {
    setNotas((prev) => ({ ...prev, [id]: valor }));
  }

  async function salvar() {
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

    const notasArray = indicadores.map((ind) => ({
      indicadorId: ind.id,
      nota: Number(notas[ind.id]),
    }));

    for (const n of notasArray) {
      if (Number.isNaN(n.nota) || n.nota < 0 || n.nota > 10) {
        setErro("Todas as notas devem estar entre 0 e 10.");
        return;
      }
    }

    try {
      await avaliacoesApi.criar({
        cidadeId,
        dataAvaliacao,
        periodoInicio,
        periodoFim,
        notas: notasArray,
      });
      setSucesso(true);
    } catch (err: any) {
      setErro(err?.response?.data?.error ?? "Erro ao registrar avaliação.");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Registrar avaliação</h1>
          <p>Selecione o município, o período avaliado e dê uma nota de 0 a 10 para cada indicador ativo.</p>
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

      <div className="card">
        <h3>Indicadores</h3>
        <p className="sub">Nota de 0 (crítico) a 10 (excelente) para cada indicador.</p>
        {indicadores.length === 0 ? (
          <div className="empty-state">
            Nenhum indicador ativo cadastrado. Cadastre indicadores antes de registrar uma avaliação.
          </div>
        ) : (
          <div className="notas-grid">
            {indicadores.map((ind) => (
              <div className="nota-row" key={ind.id}>
                <label>{ind.nome}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={notas[ind.id] ?? ""}
                  onChange={(e) => setNota(ind.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn-accent" onClick={salvar} disabled={indicadores.length === 0}>
            Salvar avaliação
          </button>
          {sucesso && <span style={{ color: "#00867b", fontWeight: 600, fontSize: 13.5 }}>Avaliação registrada com sucesso.</span>}
        </div>
        {erro && <div className="error-msg">{erro}</div>}
      </div>
    </div>
  );
}
