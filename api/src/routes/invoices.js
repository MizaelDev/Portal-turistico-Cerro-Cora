import express from "express";
import { z } from "zod";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/http-error.js";

export const invoicesRouter = express.Router();
invoicesRouter.use(requireAuth);

const invoiceCreateSchema = z.object({
  projectId: z.number().int().positive(),
  amountCents: z.number().int().nonnegative(),
  dueDate: z.string().min(10),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
  notes: z.string().max(2000).optional().nullable()
});

const invoiceUpdateSchema = invoiceCreateSchema.partial().omit({ projectId: true });

invoicesRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const items = await db.all(
      `SELECT i.id, i.project_id as projectId, i.amount_cents as amountCents, i.due_date as dueDate, i.status, i.notes,
              i.created_at as createdAt,
              p.name as projectName,
              c.name as clientName
         FROM invoices i
         JOIN projects p ON p.id = i.project_id
         JOIN clients c ON c.id = p.client_id
        WHERE i.user_id = ?
        ORDER BY i.due_date ASC`,
      req.user.id
    );
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

invoicesRouter.post("/", async (req, res, next) => {
  try {
    const input = invoiceCreateSchema.parse(req.body);
    const db = await getDb();

    const project = await db.get("SELECT id FROM projects WHERE id = ? AND user_id = ?", input.projectId, req.user.id);
    if (!project) throw new HttpError(404, "Project not found");

    const result = await db.run(
      "INSERT INTO invoices (user_id, project_id, amount_cents, due_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)",
      req.user.id,
      input.projectId,
      input.amountCents,
      input.dueDate,
      input.status ?? "draft",
      input.notes ?? null
    );
    const invoice = await db.get(
      "SELECT id, project_id as projectId, amount_cents as amountCents, due_date as dueDate, status, notes, created_at as createdAt FROM invoices WHERE id = ? AND user_id = ?",
      result.lastID,
      req.user.id
    );
    return res.status(201).json({ item: invoice });
  } catch (err) {
    return next(err);
  }
});

invoicesRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = invoiceUpdateSchema.parse(req.body);
    const db = await getDb();

    const current = await db.get("SELECT id FROM invoices WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    if (!current) throw new HttpError(404, "Invoice not found");

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(input)) {
      const col =
        key === "amountCents" ? "amount_cents" :
        key === "dueDate" ? "due_date" :
        key;
      fields.push(`${col} = ?`);
      values.push(value ?? null);
    }
    if (fields.length === 0) throw new HttpError(400, "No fields to update");

    await db.run(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, ...values, req.params.id, req.user.id);
    const invoice = await db.get(
      "SELECT id, project_id as projectId, amount_cents as amountCents, due_date as dueDate, status, notes, created_at as createdAt FROM invoices WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    return res.json({ item: invoice });
  } catch (err) {
    return next(err);
  }
});

invoicesRouter.post("/:id/mark-paid", async (req, res, next) => {
  try {
    const db = await getDb();
    const current = await db.get("SELECT id FROM invoices WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    if (!current) throw new HttpError(404, "Invoice not found");

    await db.run("UPDATE invoices SET status = 'paid' WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    const invoice = await db.get(
      "SELECT id, project_id as projectId, amount_cents as amountCents, due_date as dueDate, status, notes, created_at as createdAt FROM invoices WHERE id = ? AND user_id = ?",
      req.params.id,
      req.user.id
    );
    return res.json({ item: invoice });
  } catch (err) {
    return next(err);
  }
});

