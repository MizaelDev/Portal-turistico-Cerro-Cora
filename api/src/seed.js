import dotenv from "dotenv";

import { getDb } from "./db.js";
import bcrypt from "bcryptjs";

dotenv.config();

const db = await getDb();

const email = "demo@demo.com";
const password = "demo123";
const passwordHash = await bcrypt.hash(password, 10);

const existing = await db.get("SELECT id FROM users WHERE email = ?", email);
let userId;
if (existing) {
  userId = existing.id;
} else {
  const result = await db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", email, passwordHash);
  userId = result.lastID;
}

const client = await db.get("SELECT id FROM clients WHERE user_id = ? ORDER BY id ASC LIMIT 1", userId);
let clientId = client?.id;
if (!clientId) {
  const c = await db.run(
    "INSERT INTO clients (user_id, name, email, notes) VALUES (?, ?, ?, ?)",
    userId,
    "Cliente Demo",
    "cliente@demo.com",
    "Gerado pelo seed"
  );
  clientId = c.lastID;
}

const project = await db.get("SELECT id FROM projects WHERE user_id = ? ORDER BY id ASC LIMIT 1", userId);
let projectId = project?.id;
if (!projectId) {
  const p = await db.run(
    "INSERT INTO projects (user_id, client_id, name, billing_type, rate, status) VALUES (?, ?, ?, ?, ?, ?)",
    userId,
    clientId,
    "Site institucional",
    "fixed",
    250000,
    "active"
  );
  projectId = p.lastID;
}

const invoice = await db.get("SELECT id FROM invoices WHERE user_id = ? ORDER BY id ASC LIMIT 1", userId);
if (!invoice) {
  const due = new Date();
  due.setDate(due.getDate() + 10);
  const dueDate = due.toISOString().slice(0, 10);
  await db.run(
    "INSERT INTO invoices (user_id, project_id, amount_cents, due_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)",
    userId,
    projectId,
    250000,
    dueDate,
    "sent",
    "Fatura seed"
  );
}

// eslint-disable-next-line no-console
console.log("Seed complete:", { email, password });

