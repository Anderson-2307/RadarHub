import { Router } from "express";
import { pool } from "../db/pool";

export const indicadoresRouter = Router();

const SELECT_INDICADOR = `
  SELECT i.id, i.dimensao_id AS "dimensaoId", d.nome AS "dimensaoNome",
         d.eixo_id AS "eixoId", e.nome AS "eixoNome",
         i.nome, i.descricao, i.ordem, i.peso::float AS peso, i.ativo
  FROM indicador i
  JOIN dimensao d ON d.id = i.dimensao_id
  JOIN eixo e ON e.id = d.eixo_id
`;

indicadoresRouter.get("/", async (req, res) => {
  const somenteAtivos = req.query.ativos === "true";
  const filtroAtivo = somenteAtivos ? "AND i.ativo = true" : "";
  const result = await pool.query(
    `${SELECT_INDICADOR} WHERE i.conta_id = $1 ${filtroAtivo} ORDER BY e.ordem, d.ordem, i.ordem, i.nome`,
    [req.usuario!.contaId]
  );
  res.json(result.rows);
});

indicadoresRouter.post("/", async (req, res) => {
  const { dimensaoId, nome, descricao, ordem, peso } = req.body;
  if (!dimensaoId || !nome) return res.status(400).json({ error: "Informe a dimensão e o nome do indicador." });
  const result = await pool.query(
    `INSERT INTO indicador (dimensao_id, nome, descricao, ordem, peso, conta_id)
     VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, 1.0), $6) RETURNING id`,
    [dimensaoId, nome, descricao ?? null, ordem ?? null, peso ?? null, req.usuario!.contaId]
  );
  const created = await pool.query(`${SELECT_INDICADOR} WHERE i.id = $1`, [result.rows[0].id]);
  res.status(201).json(created.rows[0]);
});

indicadoresRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { dimensaoId, nome, descricao, ordem, peso, ativo } = req.body;
  await pool.query(
    `UPDATE indicador SET
       dimensao_id = COALESCE($1, dimensao_id),
       nome = COALESCE($2, nome),
       descricao = COALESCE($3, descricao),
       ordem = COALESCE($4, ordem),
       peso = COALESCE($5, peso),
       ativo = COALESCE($6, ativo)
     WHERE id = $7 AND conta_id = $8`,
    [dimensaoId ?? null, nome ?? null, descricao ?? null, ordem ?? null, peso ?? null, ativo ?? null, id, req.usuario!.contaId]
  );
  const updated = await pool.query(`${SELECT_INDICADOR} WHERE i.id = $1 AND i.conta_id = $2`, [id, req.usuario!.contaId]);
  if (updated.rows.length === 0) return res.status(404).json({ error: "Indicador não encontrado." });
  res.json(updated.rows[0]);
});

indicadoresRouter.delete("/:id", async (req, res) => {
  await pool.query("UPDATE indicador SET ativo = false WHERE id = $1 AND conta_id = $2", [req.params.id, req.usuario!.contaId]);
  res.status(204).send();
});
