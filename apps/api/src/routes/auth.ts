import { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db/pool";
import { authMiddleware } from "../middleware/auth";

export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function emitirToken(usuario: { id: string; contaId: string; papel: string }) {
  return jwt.sign(usuario, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

async function buscarUsuarioComConta(usuarioId: string) {
  const result = await pool.query(
    `SELECT u.id, u.conta_id AS "contaId", u.email, u.nome, u.papel, c.id AS "conta.id", c.nome AS "conta.nome"
     FROM usuario u JOIN conta c ON c.id = u.conta_id
     WHERE u.id = $1`,
    [usuarioId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    usuario: { id: row.id, contaId: row.contaId, email: row.email, nome: row.nome, papel: row.papel },
    conta: { id: row["conta.id"], nome: row["conta.nome"] },
  };
}

authRouter.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Credencial do Google ausente." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Não foi possível validar o login do Google." });
  }

  if (!payload?.sub || !payload.email) {
    return res.status(401).json({ error: "Login do Google incompleto." });
  }

  const { sub: googleSub, email, name } = payload;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let usuarioResult = await client.query(
      `SELECT id FROM usuario WHERE google_sub = $1 OR email = $2`,
      [googleSub, email]
    );

    let usuarioId: string;
    if (usuarioResult.rows.length > 0) {
      usuarioId = usuarioResult.rows[0].id;
      await client.query(`UPDATE usuario SET google_sub = $1 WHERE id = $2`, [googleSub, usuarioId]);
    } else {
      const contaResult = await client.query(
        `INSERT INTO conta (nome) VALUES ($1) RETURNING id`,
        [name ? `Conta de ${name}` : "Nova conta"]
      );
      const contaId = contaResult.rows[0].id;
      const novoUsuario = await client.query(
        `INSERT INTO usuario (conta_id, google_sub, email, nome, papel) VALUES ($1, $2, $3, $4, 'admin') RETURNING id`,
        [contaId, googleSub, email, name ?? email]
      );
      usuarioId = novoUsuario.rows[0].id;
    }

    await client.query("COMMIT");

    const completo = await buscarUsuarioComConta(usuarioId);
    if (!completo) throw new Error("Falha ao carregar usuário recém-autenticado.");

    const token = emitirToken({ id: completo.usuario.id, contaId: completo.usuario.contaId, papel: completo.usuario.papel });
    res.json({ token, usuario: completo.usuario, conta: completo.conta });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Erro ao autenticar com Google." });
  } finally {
    client.release();
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  const completo = await buscarUsuarioComConta(req.usuario!.id);
  if (!completo) return res.status(404).json({ error: "Usuário não encontrado." });
  res.json(completo);
});
