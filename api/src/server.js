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
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-me") {
    throw new Error("JWT_SECRET must be configured before starting the API.");
  }

  const app = express();

  app.set("port", Number(process.env.PORT || 3001));

  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin not allowed"));
      },
      credentials: false,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
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
