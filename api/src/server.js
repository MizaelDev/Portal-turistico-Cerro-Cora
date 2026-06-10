import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { errorHandler } from "./utils/error-handler.js";
import { authRouter } from "./routes/auth.js";
import { clientsRouter } from "./routes/clients.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { invoicesRouter } from "./routes/invoices.js";
import { projectsRouter } from "./routes/projects.js";

dotenv.config();

export async function createApp() {
  const app = express();

  app.set("port", Number(process.env.PORT || 3001));

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: false
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/clients", clientsRouter);
  app.use("/projects", projectsRouter);
  app.use("/invoices", invoicesRouter);
  app.use("/dashboard", dashboardRouter);

  app.use(errorHandler);
  return app;
}

