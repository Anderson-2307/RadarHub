import { Router } from "express";
import { pool } from "../db/pool";

export const estruturaRouter = Router();

// Retorna eixo > dimensão > indicador aninhado, usado para montar os
// formulários de cadastro e de avaliação em 3 colunas.
estruturaRouter.get("/", async (req, res) => {
  const contaId = req.usuario!.contaId;
  const eixos = await pool.query(
    `SELECT id, nome, peso::float AS peso, ordem, ativo FROM eixo WHERE conta_id = $1 AND ativo = true ORDER BY ordem, nome`,
    [contaId]
  );
  const dimensoes = await pool.query(
    `SELECT id, eixo_id AS "eixoId", nome, ordem, ativo FROM dimensao WHERE conta_id = $1 AND ativo = true ORDER BY ordem, nome`,
    [contaId]
  );
  const indicadores = await pool.query(
    `SELECT id, dimensao_id AS "dimensaoId", nome, descricao, ordem, peso::float AS peso, ativo
     FROM indicador WHERE conta_id = $1 ORDER BY ordem, nome`,
    [contaId]
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
