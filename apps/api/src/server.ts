import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { estadosRouter } from "./routes/estados";
import { cidadesRouter } from "./routes/cidades";
import { eixosRouter } from "./routes/eixos";
import { dimensoesRouter } from "./routes/dimensoes";
import { indicadoresRouter } from "./routes/indicadores";
import { estruturaRouter } from "./routes/estrutura";
import { avaliacoesRouter } from "./routes/avaliacoes";
import { rankingRouter } from "./routes/ranking";
import { dashboardRouter } from "./routes/dashboard";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/estados", estadosRouter);
app.use("/api/cidades", cidadesRouter);
app.use("/api/eixos", eixosRouter);
app.use("/api/dimensoes", dimensoesRouter);
app.use("/api/indicadores", indicadoresRouter);
app.use("/api/estrutura", estruturaRouter);
app.use("/api/avaliacoes", avaliacoesRouter);
app.use("/api/ranking", rankingRouter);
app.use("/api/dashboard", dashboardRouter);

const port = process.env.PORT ?? 3333;
app.listen(port, () => {
  console.log(`API Radar Hub rodando em http://localhost:${port}`);
});
