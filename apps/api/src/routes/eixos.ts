import { Router } from "express";
import { pool } from "../db/pool";

export const eixosRouter = Router();

const SELECT_EIXO = `
  SELECT id, nome, peso::float AS peso, ordem, ativo
  FROM eixo
`;

eixosRouter.get("/", async (req, res) => {
  const somenteAtivos = req.query.ativos === "true";
  const filtroAtivo = somenteAtivos ? "AND ativo = true" : "";
  const result = await pool.query(
    `${SELECT_EIXO} WHERE conta_id = $1 ${filtroAtivo} ORDER BY ordem, nome`,
    [req.usuario!.contaId]
  );
  res.json(result.rows);
});

eixosRouter.post("/", async (req, res) => {
  const { nome, peso, ordem } = req.body;
  if (!nome) return res.status(400).json({ error: "Informe o nome do eixo." });
  const result = await pool.query(
    `INSERT INTO eixo (nome, peso, ordem, conta_id) VALUES ($1, COALESCE($2, 0), COALESCE($3, 0), $4) RETURNING id`,
    [nome, peso ?? null, ordem ?? null, req.usuario!.contaId]
  );
  const created = await pool.query(`${SELECT_EIXO} WHERE id = $1`, [result.rows[0].id]);
  res.status(201).json(created.rows[0]);
});

eixosRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, peso, ordem, ativo } = req.body;
  await pool.query(
    `UPDATE eixo SET
       nome = COALESCE($1, nome),
       peso = COALESCE($2, peso),
       ordem = COALESCE($3, ordem),
       ativo = COALESCE($4, ativo)
     WHERE id = $5 AND conta_id = $6`,
    [nome ?? null, peso ?? null, ordem ?? null, ativo ?? null, id, req.usuario!.contaId]
  );
  const updated = await pool.query(`${SELECT_EIXO} WHERE id = $1 AND conta_id = $2`, [id, req.usuario!.contaId]);
  if (updated.rows.length === 0) return res.status(404).json({ error: "Eixo não encontrado." });
  res.json(updated.rows[0]);
});

eixosRouter.delete("/:id", async (req, res) => {
  await pool.query("UPDATE eixo SET ativo = false WHERE id = $1 AND conta_id = $2", [req.params.id, req.usuario!.contaId]);
  res.status(204).send();
});
