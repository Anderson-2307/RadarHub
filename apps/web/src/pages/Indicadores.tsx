import { useEffect, useState } from "react";
import type { EixoComEstrutura } from "@radar-sebrae/shared";
import { estruturaApi, indicadoresApi } from "../api/client";

function eixoClasse(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("gest")) return "eixo-gestao";
  if (n.includes("competit")) return "eixo-competitividade";
  if (n.includes("inova")) return "eixo-inovacao";
  return "eixo-gestao";
}

export function IndicadoresPage() {
  const [estrutura, setEstrutura] = useState<EixoComEstrutura[]>([]);
  const [dimensaoId, setDimensaoId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1.0");
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setEstrutura(await estruturaApi.listar());
  }

  useEffect(() => {
    carregar();
  }, []);

  const dimensoes = estrutura.flatMap((e) => e.dimensoes.map((d) => ({ ...d, eixoNome: e.nome })));
  const totalIndicadores = dimensoes.reduce((acc, d) => acc + d.indicadores.length, 0);

  async function salvar() {
    setErro(null);
    if (!dimensaoId) {
      setErro("Selecione a dimensão do indicador.");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe o nome do indicador.");
      return;
    }
    const dimensao = dimensoes.find((d) => d.id === dimensaoId);
    await indicadoresApi.criar({
      dimensaoId,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ordem: (dimensao?.indicadores.length ?? 0) + 1,
      peso: Number(peso) || 1,
    });
    setNome("");
    setDescricao("");
    setPeso("1.0");
    carregar();
  }

  async function alternarAtivo(indicadorId: string, ativo: boolean) {
    await indicadoresApi.atualizar(indicadorId, { ativo: !ativo });
    carregar();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Estrutura do Radar</h1>
          <p>
            Três eixos, doze dimensões, um índice de 0 a 100. Cadastre os indicadores (escala de
            maturidade de 1 a 5) dentro de cada dimensão.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Novo indicador</h3>
        <p className="sub">O peso pondera o indicador dentro da média da sua dimensão (padrão 1.0).</p>
        <div className="form-grid">
          <div className="field-group">
            <label>Dimensão</label>
            <select value={dimensaoId} onChange={(e) => setDimensaoId(e.target.value)}>
              <option value="">-- selecione --</option>
              {dimensoes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.eixoNome} — {d.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Nome do indicador</label>
            <input
              type="text"
              placeholder="Ex: Planejamento estratégico"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Peso</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>
          <div className="field-group" style={{ gridColumn: "1 / -1" }}>
            <label>Descrição (opcional)</label>
            <input
              type="text"
              placeholder="Detalhe o que este indicador avalia"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn-primary" onClick={salvar}>
            Salvar indicador
          </button>
        </div>
        {erro && <div className="error-msg">{erro}</div>}
      </div>

      <div className="card">
        <h3>Eixos e dimensões</h3>
        <p className="sub">{totalIndicadores} indicador(es) cadastrado(s) no total</p>

        {estrutura.length === 0 ? (
          <div className="empty-state">Nenhum eixo cadastrado ainda.</div>
        ) : (
          <div className="eixos-cols">
            {estrutura.map((eixo) => (
              <div className={`eixo-col ${eixoClasse(eixo.nome)}`} key={eixo.id}>
                <div className="eixo-col-head">
                  <h4>{eixo.nome}</h4>
                  <span>{Math.round(eixo.peso * 100)}%</span>
                </div>
                {eixo.dimensoes.map((dimensao) => (
                  <div className="dimensao-block" key={dimensao.id}>
                    <h5>{dimensao.nome}</h5>
                    {dimensao.indicadores.length === 0 ? (
                      <ul>
                        <li style={{ opacity: 0.7 }}>Nenhum indicador cadastrado</li>
                      </ul>
                    ) : (
                      <ul>
                        {dimensao.indicadores.map((ind) => (
                          <li key={ind.id}>
                            {ind.nome}
                            {" "}
                            <button
                              className="icon-btn"
                              style={{ color: "inherit", opacity: ind.ativo ? 1 : 0.5 }}
                              onClick={() => alternarAtivo(ind.id, ind.ativo)}
                            >
                              ({ind.ativo ? "ativo" : "inativo"})
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
