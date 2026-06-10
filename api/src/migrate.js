import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

import { getDb } from "./db.js";

dotenv.config();

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

function readSqlFiles() {
  const dirPath = path.resolve(migrationsDir);
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => ({
    name: f,
    sql: fs.readFileSync(path.join(dirPath, f), "utf8")
  }));
}

const db = await getDb();
await db.exec("PRAGMA foreign_keys = ON;");
await db.exec(
  `CREATE TABLE IF NOT EXISTS migrations (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL UNIQUE,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );`
);

const applied = await db.all("SELECT name FROM migrations");
const appliedSet = new Set(applied.map((m) => m.name));

for (const m of readSqlFiles()) {
  if (appliedSet.has(m.name)) continue;
  await db.exec("BEGIN");
  try {
    await db.exec(m.sql);
    await db.run("INSERT INTO migrations (name) VALUES (?)", m.name);
    await db.exec("COMMIT");
    // eslint-disable-next-line no-console
    console.log(`Applied ${m.name}`);
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
}

// eslint-disable-next-line no-console
console.log("Migrations up to date.");
