import { Router } from "express";
import { pool } from "../db/pool";

export const dimensoesRouter = Router();

const SELECT_DIMENSAO = `
  SELECT d.id, d.eixo_id AS "eixoId", e.nome AS "eixoNome", d.nome, d.ordem, d.ativo
  FROM dimensao d
  JOIN eixo e ON e.id = d.eixo_id
`;

dimensoesRouter.get("/", async (req, res) => {
  const somenteAtivos = req.query.ativos === "true";
  const filtroAtivo = somenteAtivos ? "AND d.ativo = true" : "";
  const result = await pool.query(
    `${SELECT_DIMENSAO} WHERE d.conta_id = $1 ${filtroAtivo} ORDER BY e.ordem, d.ordem, d.nome`,
    [req.usuario!.contaId]
  );
  res.json(result.rows);
});

dimensoesRouter.post("/", async (req, res) => {
  const { eixoId, nome, ordem } = req.body;
  if (!eixoId || !nome) return res.status(400).json({ error: "Informe o eixo e o nome da dimensão." });
  const result = await pool.query(
    `INSERT INTO dimensao (eixo_id, nome, ordem, conta_id) VALUES ($1, $2, COALESCE($3, 0), $4) RETURNING id`,
    [eixoId, nome, ordem ?? null, req.usuario!.contaId]
  );
  const created = await pool.query(`${SELECT_DIMENSAO} WHERE d.id = $1`, [result.rows[0].id]);
  res.status(201).json(created.rows[0]);
});

dimensoesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { eixoId, nome, ordem, ativo } = req.body;
  await pool.query(
    `UPDATE dimensao SET
       eixo_id = COALESCE($1, eixo_id),
       nome = COALESCE($2, nome),
       ordem = COALESCE($3, ordem),
       ativo = COALESCE($4, ativo)
     WHERE id = $5 AND conta_id = $6`,
    [eixoId ?? null, nome ?? null, ordem ?? null, ativo ?? null, id, req.usuario!.contaId]
  );
  const updated = await pool.query(`${SELECT_DIMENSAO} WHERE d.id = $1 AND d.conta_id = $2`, [id, req.usuario!.contaId]);
  if (updated.rows.length === 0) return res.status(404).json({ error: "Dimensão não encontrada." });
  res.json(updated.rows[0]);
});

dimensoesRouter.delete("/:id", async (req, res) => {
  await pool.query("UPDATE dimensao SET ativo = false WHERE id = $1 AND conta_id = $2", [req.params.id, req.usuario!.contaId]);
  res.status(204).send();
});
