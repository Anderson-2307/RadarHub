import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function migrate() {
  const migrationsDir = path.resolve(__dirname, "../../../../db/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Aplicando migration: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrations aplicadas com sucesso.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Erro ao aplicar migrations:", err);
  process.exit(1);
});
