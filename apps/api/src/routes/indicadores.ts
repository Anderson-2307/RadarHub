import { Router } from "express";
import { pool } from "../db/pool";

export const indicadoresRouter = Router();

const SELECT_INDICADOR = `
  SELECT id, nome, descricao, ordem, peso::float AS peso, ativo
  FROM indicador
`;

indicadoresRouter.get("/", async (req, res) => {
  const somenteAtivos = req.query.ativos === "true";
  const where = somenteAtivos ? "WHERE ativo = true" : "";
  const result = await pool.query(`${SELECT_INDICADOR} ${where} ORDER BY ordem, nome`);
  res.json(result.rows);
});

indicadoresRouter.post("/", async (req, res) => {
  const { nome, descricao, ordem, peso } = req.body;
  if (!nome) return res.status(400).json({ error: "Informe o nome do indicador." });
  const result = await pool.query(
    `INSERT INTO indicador (nome, descricao, ordem, peso)
     VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 1.0)) RETURNING id`,
    [nome, descricao ?? null, ordem ?? null, peso ?? null]
  );
  const created = await pool.query(`${SELECT_INDICADOR} WHERE id = $1`, [result.rows[0].id]);
  res.status(201).json(created.rows[0]);
});

indicadoresRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ordem, peso, ativo } = req.body;
  await pool.query(
    `UPDATE indicador SET
       nome = COALESCE($1, nome),
       descricao = COALESCE($2, descricao),
       ordem = COALESCE($3, ordem),
       peso = COALESCE($4, peso),
       ativo = COALESCE($5, ativo)
     WHERE id = $6`,
    [nome ?? null, descricao ?? null, ordem ?? null, peso ?? null, ativo ?? null, id]
  );
  const updated = await pool.query(`${SELECT_INDICADOR} WHERE id = $1`, [id]);
  if (updated.rows.length === 0) return res.status(404).json({ error: "Indicador não encontrado." });
  res.json(updated.rows[0]);
});

indicadoresRouter.delete("/:id", async (req, res) => {
  await pool.query("UPDATE indicador SET ativo = false WHERE id = $1", [req.params.id]);
  res.status(204).send();
});
