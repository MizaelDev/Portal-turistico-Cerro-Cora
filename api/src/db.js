import fs from "node:fs";
import path from "node:path";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

let dbPromise;

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function getDb() {
  if (!dbPromise) {
    const dbPath = process.env.DB_PATH || "./data/app.db";
    ensureDir(dbPath);
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const db = await dbPromise;
    await db.exec("PRAGMA foreign_keys = ON;");
  }

  return dbPromise;
}
