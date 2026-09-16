import { Router } from "express";
import { calcularIndice, calcularDimensoes } from "../lib/indice";
import { buscarLinhasBrutas, agruparPorAvaliacao, LinhaBruta } from "../lib/avaliacoesBrutas";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", async (_req, res) => {
  const linhas = await buscarLinhasBrutas();
  const porAvaliacao = agruparPorAvaliacao(linhas);

  interface ResumoAvaliacao {
    cidadeId: string;
    cidadeNome: string;
    uf: string;
    cidadeAtiva: boolean;
    periodoInicio: string;
    indiceGeral: number;
    dimensoes: { dimensaoId: string; nome: string; pontuacao: number }[];
  }

  const resumos: ResumoAvaliacao[] = Array.from(porAvaliacao.values()).map((linhasAvaliacao: LinhaBruta[]) => {
    const { cidadeId, cidadeNome, uf, cidadeAtiva, periodoInicio } = linhasAvaliacao[0];
    const { indiceGeral } = calcularIndice(linhasAvaliacao);
    const dimensoes = calcularDimensoes(linhasAvaliacao);
    return { cidadeId, cidadeNome, uf, cidadeAtiva, periodoInicio, indiceGeral, dimensoes };
  });

  const totalAvaliacoes = resumos.length;

  const ultimaPorCidade = new Map<string, ResumoAvaliacao>();
  for (const r of resumos) {
    if (!r.cidadeAtiva) continue;
    const atual = ultimaPorCidade.get(r.cidadeId);
    if (!atual || r.periodoInicio > atual.periodoInicio) ultimaPorCidade.set(r.cidadeId, r);
  }
  const ultimas = Array.from(ultimaPorCidade.values());

  const totalCidades = ultimas.length;
  const indiceMedioGeral = totalCidades
    ? ultimas.reduce((acc, r) => acc + r.indiceGeral, 0) / totalCidades
    : 0;

  const somaPorDimensao = new Map<string, { nome: string; soma: number; qtd: number }>();
  for (const r of ultimas) {
    for (const d of r.dimensoes) {
      const atual = somaPorDimensao.get(d.dimensaoId) ?? { nome: d.nome, soma: 0, qtd: 0 };
      atual.soma += d.pontuacao;
      atual.qtd += 1;
      somaPorDimensao.set(d.dimensaoId, atual);
    }
  }
  const perfilMedioDimensoes = Array.from(somaPorDimensao.entries()).map(([dimensaoId, d]) => ({
    dimensaoId,
    nome: d.nome,
    media: d.qtd ? d.soma / d.qtd : 0,
  }));

  const dimensaoCritica = perfilMedioDimensoes.length
    ? perfilMedioDimensoes.reduce((min, r) => (r.media < min.media ? r : min))
    : null;
  const dimensaoDestaque = perfilMedioDimensoes.length
    ? perfilMedioDimensoes.reduce((max, r) => (r.media > max.media ? r : max))
    : null;

  const topRanking = ultimas
    .sort((a, b) => b.indiceGeral - a.indiceGeral)
    .slice(0, 5)
    .map((r) => ({ cidadeId: r.cidadeId, cidadeNome: r.cidadeNome, uf: r.uf, indiceGeral: r.indiceGeral }));

  const somaPorPeriodo = new Map<string, { soma: number; qtd: number }>();
  for (const r of resumos) {
    const periodo = r.periodoInicio.slice(0, 7);
    const atual = somaPorPeriodo.get(periodo) ?? { soma: 0, qtd: 0 };
    atual.soma += r.indiceGeral;
    atual.qtd += 1;
    somaPorPeriodo.set(periodo, atual);
  }
  const evolucaoTemporal = Array.from(somaPorPeriodo.entries())
    .map(([periodo, p]) => ({ periodo, indiceMedio: p.qtd ? p.soma / p.qtd : 0 }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  res.json({
    indiceMedioGeral,
    totalCidades,
    totalAvaliacoes,
    dimensaoCritica,
    dimensaoDestaque,
    perfilMedioDimensoes,
    topRanking,
    evolucaoTemporal,
  });
});
