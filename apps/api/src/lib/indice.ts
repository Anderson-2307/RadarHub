export interface NotaBruta {
  indicadorId: string;
  indicadorNome: string;
  nota: number;
  indicadorPeso: number;
  dimensaoId: string;
  dimensaoNome: string;
  eixoId: string;
  eixoNome: string;
  eixoPeso: number;
}

export interface PontuacaoEixo {
  eixoId: string;
  eixoNome: string;
  peso: number;
  pontuacao: number;
}

export interface PontuacaoDimensao {
  dimensaoId: string;
  nome: string;
  pontuacao: number;
  eixoId: string;
  eixoNome: string;
}

// Normaliza uma média de maturidade (1 a 5) para o índice 0-100.
export function normalizar(media: number) {
  return ((media - 1) / 4) * 100;
}

// Agrega notas de indicador (1-5) em: média ponderada por dimensão,
// normalizada para 0-100; média simples das dimensões por eixo;
// e índice geral como soma dos eixos ponderada pelo peso de cada um.
export function calcularIndice(notas: NotaBruta[]): { indiceGeral: number; porEixo: PontuacaoEixo[] } {
  const porDimensao = new Map<string, { somaPonderada: number; somaPesos: number; eixoId: string }>();
  for (const n of notas) {
    const atual = porDimensao.get(n.dimensaoId) ?? { somaPonderada: 0, somaPesos: 0, eixoId: n.eixoId };
    atual.somaPonderada += n.nota * n.indicadorPeso;
    atual.somaPesos += n.indicadorPeso;
    porDimensao.set(n.dimensaoId, atual);
  }

  const scorePorEixo = new Map<string, { soma: number; qtd: number; nome: string; peso: number }>();
  for (const [, dim] of porDimensao) {
    const mediaDimensao = dim.somaPesos > 0 ? dim.somaPonderada / dim.somaPesos : 0;
    const scoreDimensao = normalizar(mediaDimensao);
    const eixoInfo = notas.find((n) => n.eixoId === dim.eixoId)!;
    const atual = scorePorEixo.get(dim.eixoId) ?? { soma: 0, qtd: 0, nome: eixoInfo.eixoNome, peso: eixoInfo.eixoPeso };
    atual.soma += scoreDimensao;
    atual.qtd += 1;
    scorePorEixo.set(dim.eixoId, atual);
  }

  const porEixo = Array.from(scorePorEixo.entries()).map(([eixoId, e]) => ({
    eixoId,
    eixoNome: e.nome,
    peso: e.peso,
    pontuacao: e.qtd > 0 ? e.soma / e.qtd : 0,
  }));

  const indiceGeral = porEixo.reduce((acc, e) => acc + e.pontuacao * e.peso, 0);

  return { indiceGeral, porEixo };
}

// Pontuação normalizada (0-100) por dimensão, para perfis e rankings de dimensão.
export function calcularDimensoes(notas: NotaBruta[]): PontuacaoDimensao[] {
  const porDimensao = new Map<
    string,
    { somaPonderada: number; somaPesos: number; nome: string; eixoId: string; eixoNome: string }
  >();
  for (const n of notas) {
    const atual =
      porDimensao.get(n.dimensaoId) ??
      { somaPonderada: 0, somaPesos: 0, nome: n.dimensaoNome, eixoId: n.eixoId, eixoNome: n.eixoNome };
    atual.somaPonderada += n.nota * n.indicadorPeso;
    atual.somaPesos += n.indicadorPeso;
    porDimensao.set(n.dimensaoId, atual);
  }

  return Array.from(porDimensao.entries()).map(([dimensaoId, dim]) => ({
    dimensaoId,
    nome: dim.nome,
    pontuacao: dim.somaPesos > 0 ? normalizar(dim.somaPonderada / dim.somaPesos) : 0,
    eixoId: dim.eixoId,
    eixoNome: dim.eixoNome,
  }));
}
