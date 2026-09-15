import { useEffect, useState } from "react";
import type { Indicador } from "@radar-sebrae/shared";
import { indicadoresApi } from "../api/client";

export function IndicadoresPage() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1.0");
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setIndicadores(await indicadoresApi.listar());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro("Informe o nome do indicador.");
      return;
    }
    await indicadoresApi.criar({
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ordem: indicadores.length + 1,
      peso: Number(peso) || 1,
    });
    setNome("");
    setDescricao("");
    setPeso("1.0");
    carregar();
  }

  async function alternarAtivo(ind: Indicador) {
    await indicadoresApi.atualizar(ind.id, { ativo: !ind.ativo });
    carregar();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Indicadores</h1>
          <p>Defina os indicadores que compõem o radar de avaliação. São eles que formam os eixos do gráfico.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Novo indicador</h3>
        <p className="sub">O peso é usado para ponderar o indicador em cálculos futuros (padrão 1.0).</p>
        <div className="form-grid">
          <div className="field-group">
            <label>Nome do indicador</label>
            <input
              type="text"
              placeholder="Ex: Gestão Municipal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Descrição (opcional)</label>
            <input
              type="text"
              placeholder="Detalhe o que este indicador avalia"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
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
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn-primary" onClick={salvar}>
            Salvar indicador
          </button>
        </div>
        {erro && <div className="error-msg">{erro}</div>}
      </div>

      <div className="card">
        <h3>Indicadores cadastrados</h3>
        <p className="sub">{indicadores.length} indicador(es)</p>
        {indicadores.length === 0 ? (
          <div className="empty-state">Nenhum indicador cadastrado ainda.</div>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Nome</th>
                <th>Peso</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((i) => (
                <tr key={i.id}>
                  <td>{i.ordem}</td>
                  <td>{i.nome}</td>
                  <td>{i.peso.toFixed(1)}</td>
                  <td>
                    <span className={`badge ${i.ativo ? "active" : "inactive"}`}>
                      {i.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => alternarAtivo(i)}>
                      {i.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
