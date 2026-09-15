import axios from "axios";
import type {
  Avaliacao,
  AvaliacaoInput,
  Cidade,
  DashboardOverview,
  Estado,
  Indicador,
  RankingItem,
} from "@radar-sebrae/shared";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";
const api = axios.create({ baseURL });

export const estadosApi = {
  listar: () => api.get<Estado[]>("/estados").then((r) => r.data),
};

export const cidadesApi = {
  listar: () => api.get<Cidade[]>("/cidades").then((r) => r.data),
  criar: (nome: string, estadoId: string) =>
    api.post<Cidade>("/cidades", { nome, estadoId }).then((r) => r.data),
  atualizar: (id: string, dados: Partial<Pick<Cidade, "nome" | "ativo">>) =>
    api.put<Cidade>(`/cidades/${id}`, dados).then((r) => r.data),
  remover: (id: string) => api.delete(`/cidades/${id}`),
};

export const indicadoresApi = {
  listar: (somenteAtivos = false) =>
    api
      .get<Indicador[]>("/indicadores", { params: { ativos: somenteAtivos } })
      .then((r) => r.data),
  criar: (dados: Pick<Indicador, "nome" | "descricao" | "ordem" | "peso">) =>
    api.post<Indicador>("/indicadores", dados).then((r) => r.data),
  atualizar: (id: string, dados: Partial<Indicador>) =>
    api.put<Indicador>(`/indicadores/${id}`, dados).then((r) => r.data),
  remover: (id: string) => api.delete(`/indicadores/${id}`),
};

export const avaliacoesApi = {
  listarPorCidade: (cidadeId: string) =>
    api.get<Avaliacao[]>(`/avaliacoes/cidade/${cidadeId}`).then((r) => r.data),
  criar: (dados: AvaliacaoInput) =>
    api.post<Avaliacao>("/avaliacoes", dados).then((r) => r.data),
  remover: (id: string) => api.delete(`/avaliacoes/${id}`),
};

export const rankingApi = {
  listar: () => api.get<RankingItem[]>("/ranking").then((r) => r.data),
};

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview").then((r) => r.data),
};
