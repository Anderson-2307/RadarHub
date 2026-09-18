export interface Conta {
  id: string;
  nome: string;
}

export interface Usuario {
  id: string;
  contaId: string;
  email: string;
  nome: string;
  papel: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  conta: Conta;
}

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

export interface Eixo {
  id: string;
  nome: string;
  peso: number;
  ordem: number;
  ativo: boolean;
}

export interface Dimensao {
  id: string;
  eixoId: string;
  eixoNome?: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface Indicador {
  id: string;
  dimensaoId: string;
  dimensaoNome?: string;
  eixoId?: string;
  eixoNome?: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  peso: number;
  ativo: boolean;
}

export interface EixoComEstrutura extends Eixo {
  dimensoes: (Dimensao & { indicadores: Indicador[] })[];
}

export interface NotaIndicador {
  indicadorId: string;
  indicadorNome: string;
  nota: number;
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
}

export interface Avaliacao {
  id: string;
  cidadeId: string;
  dataAvaliacao: string;
  periodoInicio: string;
  periodoFim: string;
  observacao: string | null;
  notas: NotaIndicador[];
  indiceGeral: number;
  porEixo: PontuacaoEixo[];
  porDimensao: PontuacaoDimensao[];
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
  indiceGeral: number;
  variacaoPercentual: number | null;
}

export interface DimensaoMedia {
  dimensaoId: string;
  nome: string;
  media: number;
  eixoId: string;
  eixoNome: string;
}

export interface TopRankingItem {
  cidadeId: string;
  cidadeNome: string;
  uf: string;
  indiceGeral: number;
}

export interface PontoEvolucao {
  periodo: string;
  indiceMedio: number;
}

export interface DashboardOverview {
  indiceMedioGeral: number;
  totalCidades: number;
  totalAvaliacoes: number;
  dimensaoCritica: DimensaoMedia | null;
  dimensaoDestaque: DimensaoMedia | null;
  perfilMedioDimensoes: DimensaoMedia[];
  topRanking: TopRankingItem[];
  evolucaoTemporal: PontoEvolucao[];
}
