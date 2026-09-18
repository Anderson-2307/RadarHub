import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { estadosRouter } from "./routes/estados";
import { cidadesRouter } from "./routes/cidades";
import { eixosRouter } from "./routes/eixos";
import { dimensoesRouter } from "./routes/dimensoes";
import { indicadoresRouter } from "./routes/indicadores";
import { estruturaRouter } from "./routes/estrutura";
import { avaliacoesRouter } from "./routes/avaliacoes";
import { rankingRouter } from "./routes/ranking";
import { dashboardRouter } from "./routes/dashboard";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/estados", estadosRouter);

app.use("/api/cidades", authMiddleware, cidadesRouter);
app.use("/api/eixos", authMiddleware, eixosRouter);
app.use("/api/dimensoes", authMiddleware, dimensoesRouter);
app.use("/api/indicadores", authMiddleware, indicadoresRouter);
app.use("/api/estrutura", authMiddleware, estruturaRouter);
app.use("/api/avaliacoes", authMiddleware, avaliacoesRouter);
app.use("/api/ranking", authMiddleware, rankingRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);

const port = process.env.PORT ?? 3333;
app.listen(port, () => {
  console.log(`API Radar Hub rodando em http://localhost:${port}`);
});
