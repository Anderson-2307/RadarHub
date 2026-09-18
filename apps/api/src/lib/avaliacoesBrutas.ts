import { pool } from "../db/pool";
import { NotaBruta } from "./indice";

export interface LinhaBruta extends NotaBruta {
  avaliacaoId: string;
  cidadeId: string;
  cidadeNome: string;
  uf: string;
  cidadeAtiva: boolean;
  periodoInicio: string;
}

// Uma linha por (avaliação, indicador), com toda a hierarquia eixo/dimensão/indicador
// já resolvida — base para qualquer agregação de índice (ranking, dashboard, comparador).
export async function buscarLinhasBrutas(contaId: string) {
  const result = await pool.query<LinhaBruta>(
    `
    SELECT
      a.id AS "avaliacaoId", a.cidade_id AS "cidadeId", c.nome AS "cidadeNome", est.uf, c.ativo AS "cidadeAtiva",
      to_char(a.periodo_inicio, 'YYYY-MM-DD') AS "periodoInicio",
      ai.indicador_id AS "indicadorId", i.nome AS "indicadorNome", ai.nota::float AS nota,
      i.peso::float AS "indicadorPeso", i.dimensao_id AS "dimensaoId", d.nome AS "dimensaoNome",
      d.eixo_id AS "eixoId", e.nome AS "eixoNome", e.peso::float AS "eixoPeso"
    FROM avaliacao a
    JOIN cidade c ON c.id = a.cidade_id
    JOIN estado est ON est.id = c.estado_id
    JOIN avaliacao_indicador ai ON ai.avaliacao_id = a.id
    JOIN indicador i ON i.id = ai.indicador_id
    JOIN dimensao d ON d.id = i.dimensao_id
    JOIN eixo e ON e.id = d.eixo_id
    WHERE a.conta_id = $1
  `,
    [contaId]
  );
  return result.rows;
}

export function agruparPorAvaliacao(linhas: LinhaBruta[]) {
  const porAvaliacao = new Map<string, LinhaBruta[]>();
  for (const linha of linhas) {
    const atual = porAvaliacao.get(linha.avaliacaoId) ?? [];
    atual.push(linha);
    porAvaliacao.set(linha.avaliacaoId, atual);
  }
  return porAvaliacao;
}
