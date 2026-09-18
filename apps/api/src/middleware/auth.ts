import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface UsuarioAutenticado {
  id: string;
  contaId: string;
  papel: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as UsuarioAutenticado;
    req.usuario = { id: payload.id, contaId: payload.contaId, papel: payload.papel };
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}
