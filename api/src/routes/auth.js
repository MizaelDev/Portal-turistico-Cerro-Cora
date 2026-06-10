import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { getDb } from "../db.js";
import { HttpError } from "../utils/http-error.js";

export const authRouter = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign({ email: user.email }, secret, {
    subject: String(user.id),
    expiresIn: "7d"
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const db = await getDb();

    const existing = await db.get("SELECT id FROM users WHERE email = ?", input.email);
    if (existing) throw new HttpError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const result = await db.run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      input.email,
      passwordHash
    );

    const user = { id: result.lastID, email: input.email };
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const db = await getDb();

    const user = await db.get("SELECT id, email, password_hash FROM users WHERE email = ?", input.email);
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.password_hash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    return res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

