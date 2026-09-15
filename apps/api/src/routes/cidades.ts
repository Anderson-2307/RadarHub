import { Router } from "express";
import { pool } from "../db/pool";

export const cidadesRouter = Router();

const SELECT_CIDADE = `
  SELECT c.id, c.nome, c.estado_id AS "estadoId", e.uf, c.ativo
  FROM cidade c
  JOIN estado e ON e.id = c.estado_id
`;

cidadesRouter.get("/", async (_req, res) => {
  const result = await pool.query(`${SELECT_CIDADE} ORDER BY c.nome`);
  res.json(result.rows);
});

cidadesRouter.post("/", async (req, res) => {
  const { nome, estadoId } = req.body;
  if (!nome || !estadoId) {
    return res.status(400).json({ error: "Informe nome e estadoId." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO cidade (nome, estado_id) VALUES ($1, $2) RETURNING id",
      [nome, estadoId]
    );
    const created = await pool.query(`${SELECT_CIDADE} WHERE c.id = $1`, [result.rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Cidade já cadastrada para este estado." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar cidade." });
  }
});

cidadesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  await pool.query(
    "UPDATE cidade SET nome = COALESCE($1, nome), ativo = COALESCE($2, ativo) WHERE id = $3",
    [nome ?? null, ativo ?? null, id]
  );
  const updated = await pool.query(`${SELECT_CIDADE} WHERE c.id = $1`, [id]);
  if (updated.rows.length === 0) return res.status(404).json({ error: "Cidade não encontrada." });
  res.json(updated.rows[0]);
});

cidadesRouter.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM cidade WHERE id = $1", [req.params.id]);
  res.status(204).send();
});
