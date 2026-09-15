export interface Estado {
  id: string;
  nome: string;
  uf: string;
}

export interface Cidade {
  id: string;
  nome: string;
  estadoId: string;
  uf: string;
  ativo: boolean;
}

export interface Indicador {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  peso: number;
  ativo: boolean;
}

export interface NotaIndicador {
  indicadorId: string;
  indicadorNome: string;
  nota: number;
}

export interface Avaliacao {
  id: string;
  cidadeId: string;
  dataAvaliacao: string;
  periodoInicio: string;
  periodoFim: string;
  observacao: string | null;
  notas: NotaIndicador[];
  notaMedia: number;
}

export interface AvaliacaoInput {
  cidadeId: string;
  dataAvaliacao: string;
  periodoInicio: string;
  periodoFim: string;
  observacao?: string;
  notas: { indicadorId: string; nota: number }[];
}

export interface RankingItem {
  cidadeId: string;
  cidadeNome: string;
  uf: string;
  notaMedia: number;
  variacaoPercentual: number | null;
}
