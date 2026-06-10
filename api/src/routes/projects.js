import express from "express";
import { z } from "zod";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/http-error.js";

export const projectsRouter = express.Router();
projectsRouter.use(requireAuth);

const projectCreateSchema = z.object({
  clientId: z.number().int().positive(),
  name: z.string().min(2),
  billingType: z.enum(["fixed", "hourly"]),
  rate: z.number().nonnegative(),
  status: z.enum(["active", "paused", "done"]).optional()
});

const projectUpdateSchema = projectCreateSchema.partial().omit({ clientId: true });

projectsRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const items = await db.all(
      `SELECT p.id, p.client_id as clientId, p.name, p.billing_type as billingType, p.rate, p.status, p.created_at as createdAt,
              c.name as clientName
         FROM projects p
         JOIN clients c ON c.id = p.client_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC`,
      req.user.id
    );
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

projectsRouter.post("/", async (req, res, next) => {
  try {
    const input = projectCreateSchema.parse(req.body);
    const db = await getDb();

    const client = await db.get("SELECT id FROM clients WHERE id = ? AND user_id = ?", input.clientId, req.user.id);
    if (!client) throw new HttpError(404, "Client not found");

    const result = await db.run(
      "INSERT INTO projects (user_id, client_id, name, billing_type, rate, status) VALUES (?, ?, ?, ?, ?, ?)",
      req.user.id,
      input.clientId,
      input.name,
      input.billingType,
      input.rate,
      input.status ?? "active"
    );
    const project = await db.get(
      "SELECT id, client_id as clientId, name, billing_type as billingType, rate, status, created_at as createdAt FROM projects WHERE id = ? AND user_id = ?",
      result.lastID,
      req.user.id
    );
    return res.status(201).json({ item: project });
  } catch (err) {
    return next(err);
  }
});

projectsRouter.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const project = await db.get(
      "SELECT id, client_id as clientId, name, billing_type as billingType, rate, status, created_at as createdAt FROM projects WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    if (!project) throw new HttpError(404, "Project not found");
    return res.json({ item: project });
  } catch (err) {
    return next(err);
  }
});

projectsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = projectUpdateSchema.parse(req.body);
    const db = await getDb();

    const current = await db.get("SELECT id FROM projects WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    if (!current) throw new HttpError(404, "Project not found");

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(input)) {
      const col =
        key === "billingType" ? "billing_type" : key;
      fields.push(`${col} = ?`);
      values.push(value ?? null);
    }
    if (fields.length === 0) throw new HttpError(400, "No fields to update");

    await db.run(`UPDATE projects SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, ...values, req.params.id, req.user.id);
    const project = await db.get(
      "SELECT id, client_id as clientId, name, billing_type as billingType, rate, status, created_at as createdAt FROM projects WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    return res.json({ item: project });
  } catch (err) {
    return next(err);
  }
});

