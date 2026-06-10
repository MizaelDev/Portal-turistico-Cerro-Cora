import express from "express";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = express.Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (req, res, next) => {
  try {
    const db = await getDb();

    const month = await db.get(
      `SELECT COALESCE(SUM(amount_cents), 0) as totalCents
         FROM invoices
        WHERE user_id = ?
          AND status = 'paid'
          AND strftime('%Y-%m', due_date) = strftime('%Y-%m', 'now')`,
      req.user.id
    );

    const overdue = await db.get(
      `SELECT COUNT(*) as count
         FROM invoices
        WHERE user_id = ?
          AND status IN ('sent', 'overdue')
          AND date(due_date) < date('now')`,
      req.user.id
    );

    const nextDue = await db.all(
      `SELECT id, project_id as projectId, amount_cents as amountCents, due_date as dueDate, status
         FROM invoices
        WHERE user_id = ?
          AND status IN ('draft', 'sent', 'overdue')
        ORDER BY date(due_date) ASC
        LIMIT 5`,
      req.user.id
    );

    return res.json({
      revenueThisMonthCents: month.totalCents,
      overdueCount: overdue.count,
      nextDue
    });
  } catch (err) {
    return next(err);
  }
});

