import { useEffect, useState } from "react";
import type { Cidade, Estado } from "@radar-sebrae/shared";
import { cidadesApi, estadosApi } from "../api/client";

export function CidadesPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [nome, setNome] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const [c, e] = await Promise.all([cidadesApi.listar(), estadosApi.listar()]);
    setCidades(c);
    setEstados(e);
    if (!estadoId && e.length) setEstadoId(e.find((x) => x.uf === "BA")?.id ?? e[0].id);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    setErro(null);
    if (!nome.trim() || !estadoId) {
      setErro("Informe o nome do município e selecione o estado.");
      return;
    }
    try {
      await cidadesApi.criar(nome.trim(), estadoId);
      setNome("");
      carregar();
    } catch (err: any) {
      setErro(err?.response?.data?.error ?? "Erro ao cadastrar município.");
    }
  }

  async function alternarAtivo(cidade: Cidade) {
    await cidadesApi.atualizar(cidade.id, { ativo: !cidade.ativo });
    carregar();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Municípios</h1>
          <p>Cadastre os municípios que serão avaliados no Radar Hub.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Novo município</h3>
        <p className="sub">Informe o nome e o estado (UF).</p>
        <div className="form-grid">
          <div className="field-group">
            <label>Nome do município</label>
            <input
              type="text"
              placeholder="Ex: Feira de Santana"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Estado</label>
            <select value={estadoId} onChange={(e) => setEstadoId(e.target.value)}>
              {estados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({e.uf})
                </option>
              ))}
            </select>
          </div>
          <div className="field-group" style={{ justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={salvar}>
              Salvar município
            </button>
          </div>
        </div>
        {erro && <div className="error-msg">{erro}</div>}
      </div>

      <div className="card">
        <h3>Municípios cadastrados</h3>
        <p className="sub">{cidades.length} município(s)</p>
        {cidades.length === 0 ? (
          <div className="empty-state">Nenhum município cadastrado ainda.</div>
        ) : (
          <div className="chip-list">
            {cidades.map((c) => (
              <div key={c.id} className={`chip${c.ativo ? "" : " inactive"}`}>
                {c.nome} — {c.uf}
                <button onClick={() => alternarAtivo(c)} title={c.ativo ? "Desativar" : "Ativar"}>
                  {c.ativo ? "✕" : "✓"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
