import { Router } from "express";
import { calcularIndice } from "../lib/indice";
import { buscarLinhasBrutas, agruparPorAvaliacao } from "../lib/avaliacoesBrutas";

export const rankingRouter = Router();

rankingRouter.get("/", async (_req, res) => {
  const linhas = await buscarLinhasBrutas();
  const porAvaliacao = agruparPorAvaliacao(linhas);

  const avaliacoesPorCidade = new Map<
    string,
    { cidadeNome: string; uf: string; ativa: boolean; periodoInicio: string; indiceGeral: number }[]
  >();

  for (const [, linhasAvaliacao] of porAvaliacao) {
    const { cidadeId, cidadeNome, uf, cidadeAtiva, periodoInicio } = linhasAvaliacao[0];
    const { indiceGeral } = calcularIndice(linhasAvaliacao);
    const atual = avaliacoesPorCidade.get(cidadeId) ?? [];
    atual.push({ cidadeNome, uf, ativa: cidadeAtiva, periodoInicio, indiceGeral });
    avaliacoesPorCidade.set(cidadeId, atual);
  }

  const ranking = Array.from(avaliacoesPorCidade.entries())
    .map(([cidadeId, avaliacoes]) => {
      const ordenadas = avaliacoes.sort((a, b) => b.periodoInicio.localeCompare(a.periodoInicio));
      const [atual, anterior] = ordenadas;
      const variacaoPercentual =
        anterior && anterior.indiceGeral !== 0
          ? Math.round(((atual.indiceGeral - anterior.indiceGeral) / anterior.indiceGeral) * 1000) / 10
          : null;
      return {
        cidadeId,
        cidadeNome: atual.cidadeNome,
        uf: atual.uf,
        ativa: atual.ativa,
        indiceGeral: atual.indiceGeral,
        variacaoPercentual,
      };
    })
    .filter((r) => r.ativa)
    .sort((a, b) => b.indiceGeral - a.indiceGeral)
    .map(({ ativa, ...rest }) => rest);

  res.json(ranking);
});
