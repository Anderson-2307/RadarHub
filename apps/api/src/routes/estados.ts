import { Router } from "express";
import { pool } from "../db/pool";

export const estadosRouter = Router();

estadosRouter.get("/", async (_req, res) => {
  const result = await pool.query("SELECT id, nome, uf FROM estado ORDER BY nome");
  res.json(result.rows);
});
