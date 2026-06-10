import express from "express";
import { z } from "zod";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/http-error.js";

export const clientsRouter = express.Router();
clientsRouter.use(requireAuth);

const clientCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

const clientUpdateSchema = clientCreateSchema.partial().extend({
  archived: z.boolean().optional()
});

clientsRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const items = await db.all(
      "SELECT id, name, email, notes, archived, created_at FROM clients WHERE user_id = ? ORDER BY created_at DESC",
      req.user.id
    );
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

clientsRouter.post("/", async (req, res, next) => {
  try {
    const input = clientCreateSchema.parse(req.body);
    const db = await getDb();
    const result = await db.run(
      "INSERT INTO clients (user_id, name, email, notes) VALUES (?, ?, ?, ?)",
      req.user.id,
      input.name,
      input.email ?? null,
      input.notes ?? null
    );
    const client = await db.get(
      "SELECT id, name, email, notes, archived, created_at FROM clients WHERE id = ? AND user_id = ?",
      result.lastID,
      req.user.id
    );
    return res.status(201).json({ item: client });
  } catch (err) {
    return next(err);
  }
});

clientsRouter.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const client = await db.get(
      "SELECT id, name, email, notes, archived, created_at FROM clients WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    if (!client) throw new HttpError(404, "Client not found");
    return res.json({ item: client });
  } catch (err) {
    return next(err);
  }
});

clientsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = clientUpdateSchema.parse(req.body);
    const db = await getDb();

    const current = await db.get("SELECT id FROM clients WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    if (!current) throw new HttpError(404, "Client not found");

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key} = ?`);
      values.push(value ?? null);
    }
    if (fields.length === 0) throw new HttpError(400, "No fields to update");

    await db.run(`UPDATE clients SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, ...values, req.params.id, req.user.id);
    const client = await db.get(
      "SELECT id, name, email, notes, archived, created_at FROM clients WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    return res.json({ item: client });
  } catch (err) {
    return next(err);
  }
});

