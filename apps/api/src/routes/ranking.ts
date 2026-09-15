import { Router } from "express";
import { pool } from "../db/pool";

export const rankingRouter = Router();

rankingRouter.get("/", async (_req, res) => {
  const result = await pool.query(`
    WITH medias AS (
      SELECT
        a.id AS avaliacao_id,
        a.cidade_id,
        a.periodo_inicio,
        AVG(ai.nota) AS nota_media,
        ROW_NUMBER() OVER (PARTITION BY a.cidade_id ORDER BY a.periodo_inicio DESC) AS rn
      FROM avaliacao a
      JOIN avaliacao_indicador ai ON ai.avaliacao_id = a.id
      GROUP BY a.id, a.cidade_id, a.periodo_inicio
    )
    SELECT
      c.id AS "cidadeId",
      c.nome AS "cidadeNome",
      e.uf,
      m1.nota_media::float AS "notaMedia",
      CASE
        WHEN m2.nota_media IS NULL OR m2.nota_media = 0 THEN NULL
        ELSE ROUND((((m1.nota_media - m2.nota_media) / m2.nota_media) * 100)::numeric, 1)
      END AS "variacaoPercentual"
    FROM medias m1
    JOIN cidade c ON c.id = m1.cidade_id
    JOIN estado e ON e.id = c.estado_id
    LEFT JOIN medias m2 ON m2.cidade_id = m1.cidade_id AND m2.rn = 2
    WHERE m1.rn = 1 AND c.ativo = true
    ORDER BY "notaMedia" DESC;
  `);
  res.json(result.rows);
});
