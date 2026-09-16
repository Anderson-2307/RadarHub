import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  const aplicadas = await pool.query<{ filename: string }>("SELECT filename FROM schema_migrations");
  const jaAplicadas = new Set(aplicadas.rows.map((r) => r.filename));

  const migrationsDir = path.resolve(__dirname, "../../../../db/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (jaAplicadas.has(file)) {
      console.log(`Migration já aplicada, pulando: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Aplicando migration: ${file}`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("Migrations aplicadas com sucesso.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Erro ao aplicar migrations:", err);
  process.exit(1);
});
