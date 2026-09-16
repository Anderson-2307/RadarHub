import { Router } from "express";
import { pool } from "../db/pool";
import { calcularIndice, calcularDimensoes, NotaBruta } from "../lib/indice";

export const avaliacoesRouter = Router();

async function buscarAvaliacaoCompleta(id: string) {
  const avaliacaoResult = await pool.query(
    `SELECT id, cidade_id AS "cidadeId", to_char(data_avaliacao, 'YYYY-MM-DD') AS "dataAvaliacao",
            to_char(periodo_inicio, 'YYYY-MM-DD') AS "periodoInicio",
            to_char(periodo_fim, 'YYYY-MM-DD') AS "periodoFim", observacao
     FROM avaliacao WHERE id = $1`,
    [id]
  );
  if (avaliacaoResult.rows.length === 0) return null;

  const notasResult = await pool.query(
    `SELECT ai.indicador_id AS "indicadorId", i.nome AS "indicadorNome", ai.nota::float AS nota,
            i.peso::float AS "indicadorPeso", i.dimensao_id AS "dimensaoId", d.nome AS "dimensaoNome",
            d.eixo_id AS "eixoId", e.nome AS "eixoNome", e.peso::float AS "eixoPeso"
     FROM avaliacao_indicador ai
     JOIN indicador i ON i.id = ai.indicador_id
     JOIN dimensao d ON d.id = i.dimensao_id
     JOIN eixo e ON e.id = d.eixo_id
     WHERE ai.avaliacao_id = $1
     ORDER BY e.ordem, d.ordem, i.ordem, i.nome`,
    [id]
  );

  const notasBrutas: NotaBruta[] = notasResult.rows;
  const { indiceGeral, porEixo } = calcularIndice(notasBrutas);
  const porDimensao = calcularDimensoes(notasBrutas);
  const notas = notasBrutas.map(({ indicadorId, indicadorNome, nota }) => ({ indicadorId, indicadorNome, nota }));

  return { ...avaliacaoResult.rows[0], notas, indiceGeral, porEixo, porDimensao };
}

// Listar avaliações de uma cidade (para o comparador de períodos)
avaliacoesRouter.get("/cidade/:cidadeId", async (req, res) => {
  const result = await pool.query(
    `SELECT id FROM avaliacao WHERE cidade_id = $1 ORDER BY periodo_inicio ASC`,
    [req.params.cidadeId]
  );
  const avaliacoes = await Promise.all(result.rows.map((r) => buscarAvaliacaoCompleta(r.id)));
  res.json(avaliacoes);
});

avaliacoesRouter.get("/:id", async (req, res) => {
  const avaliacao = await buscarAvaliacaoCompleta(req.params.id);
  if (!avaliacao) return res.status(404).json({ error: "Avaliação não encontrada." });
  res.json(avaliacao);
});

avaliacoesRouter.post("/", async (req, res) => {
  const { cidadeId, dataAvaliacao, periodoInicio, periodoFim, observacao, notas } = req.body;

  if (!cidadeId || !dataAvaliacao || !periodoInicio || !periodoFim || !Array.isArray(notas) || notas.length === 0) {
    return res.status(400).json({ error: "Preencha cidade, datas e ao menos um indicador." });
  }
  for (const n of notas) {
    if (typeof n.nota !== "number" || n.nota < 1 || n.nota > 5) {
      return res.status(400).json({ error: "Cada nota deve estar entre 1 e 5." });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const avaliacaoResult = await client.query(
      `INSERT INTO avaliacao (cidade_id, data_avaliacao, periodo_inicio, periodo_fim, observacao)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [cidadeId, dataAvaliacao, periodoInicio, periodoFim, observacao ?? null]
    );
    const avaliacaoId = avaliacaoResult.rows[0].id;

    for (const n of notas) {
      await client.query(
        `INSERT INTO avaliacao_indicador (avaliacao_id, indicador_id, nota) VALUES ($1, $2, $3)`,
        [avaliacaoId, n.indicadorId, n.nota]
      );
    }

    await client.query("COMMIT");
    const avaliacaoCompleta = await buscarAvaliacaoCompleta(avaliacaoId);
    res.status(201).json(avaliacaoCompleta);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar avaliação." });
  } finally {
    client.release();
  }
});

avaliacoesRouter.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM avaliacao WHERE id = $1", [req.params.id]);
  res.status(204).send();
});
