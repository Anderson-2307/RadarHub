import { Router } from "express";
import { pool } from "../db/pool";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", async (_req, res) => {
  const client = await pool.connect();
  try {
    const resumo = await client.query(`
      WITH ultima AS (
        SELECT a.id AS avaliacao_id, a.cidade_id,
               ROW_NUMBER() OVER (PARTITION BY a.cidade_id ORDER BY a.periodo_inicio DESC) AS rn
        FROM avaliacao a
      ),
      medias_cidade AS (
        SELECT u.cidade_id, AVG(ai.nota) AS nota_media
        FROM ultima u
        JOIN avaliacao_indicador ai ON ai.avaliacao_id = u.avaliacao_id
        WHERE u.rn = 1
        GROUP BY u.cidade_id
      )
      SELECT
        COALESCE(AVG(nota_media), 0)::float AS "notaMediaGeral",
        COUNT(*)::int AS "totalCidades"
      FROM medias_cidade;
    `);

    const totalAvaliacoes = await client.query(`SELECT COUNT(*)::int AS total FROM avaliacao`);

    const perfil = await client.query(`
      WITH ultima AS (
        SELECT a.id AS avaliacao_id, a.cidade_id,
               ROW_NUMBER() OVER (PARTITION BY a.cidade_id ORDER BY a.periodo_inicio DESC) AS rn
        FROM avaliacao a
      )
      SELECT i.nome, AVG(ai.nota)::float AS media
      FROM ultima u
      JOIN avaliacao_indicador ai ON ai.avaliacao_id = u.avaliacao_id
      JOIN indicador i ON i.id = ai.indicador_id
      WHERE u.rn = 1
      GROUP BY i.id, i.nome, i.ordem
      ORDER BY i.ordem, i.nome;
    `);

    const topRanking = await client.query(`
      WITH ultima AS (
        SELECT a.id AS avaliacao_id, a.cidade_id,
               ROW_NUMBER() OVER (PARTITION BY a.cidade_id ORDER BY a.periodo_inicio DESC) AS rn
        FROM avaliacao a
      ),
      medias AS (
        SELECT u.cidade_id, AVG(ai.nota)::float AS nota_media
        FROM ultima u
        JOIN avaliacao_indicador ai ON ai.avaliacao_id = u.avaliacao_id
        WHERE u.rn = 1
        GROUP BY u.cidade_id
      )
      SELECT c.id AS "cidadeId", c.nome AS "cidadeNome", e.uf, m.nota_media AS "notaMedia"
      FROM medias m
      JOIN cidade c ON c.id = m.cidade_id
      JOIN estado e ON e.id = c.estado_id
      WHERE c.ativo = true
      ORDER BY m.nota_media DESC
      LIMIT 5;
    `);

    const evolucao = await client.query(`
      SELECT to_char(a.periodo_inicio, 'YYYY-MM') AS periodo, AVG(ai.nota)::float AS "notaMedia"
      FROM avaliacao a
      JOIN avaliacao_indicador ai ON ai.avaliacao_id = a.id
      GROUP BY periodo
      ORDER BY periodo ASC;
    `);

    const perfilRows: { nome: string; media: number }[] = perfil.rows;
    const indicadorCritico = perfilRows.length
      ? perfilRows.reduce((min, r) => (r.media < min.media ? r : min))
      : null;
    const indicadorDestaque = perfilRows.length
      ? perfilRows.reduce((max, r) => (r.media > max.media ? r : max))
      : null;

    res.json({
      notaMediaGeral: resumo.rows[0].notaMediaGeral,
      totalCidades: resumo.rows[0].totalCidades,
      totalAvaliacoes: totalAvaliacoes.rows[0].total,
      indicadorCritico,
      indicadorDestaque,
      perfilMedioIndicadores: perfilRows,
      topRanking: topRanking.rows,
      evolucaoTemporal: evolucao.rows,
    });
  } finally {
    client.release();
  }
});
