import { Router } from "express";
import { pool } from "../db/pool";

export const estruturaRouter = Router();

// Retorna eixo > dimensão > indicador aninhado, usado para montar os
// formulários de cadastro e de avaliação em 3 colunas.
estruturaRouter.get("/", async (_req, res) => {
  const eixos = await pool.query(
    `SELECT id, nome, peso::float AS peso, ordem, ativo FROM eixo WHERE ativo = true ORDER BY ordem, nome`
  );
  const dimensoes = await pool.query(
    `SELECT id, eixo_id AS "eixoId", nome, ordem, ativo FROM dimensao WHERE ativo = true ORDER BY ordem, nome`
  );
  const indicadores = await pool.query(
    `SELECT id, dimensao_id AS "dimensaoId", nome, descricao, ordem, peso::float AS peso, ativo
     FROM indicador ORDER BY ordem, nome`
  );

  const resultado = eixos.rows.map((eixo: any) => ({
    ...eixo,
    dimensoes: dimensoes.rows
      .filter((d: any) => d.eixoId === eixo.id)
      .map((dimensao: any) => ({
        ...dimensao,
        indicadores: indicadores.rows.filter((i: any) => i.dimensaoId === dimensao.id),
      })),
  }));

  res.json(resultado);
});
