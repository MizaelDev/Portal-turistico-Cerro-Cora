import jwt from "jsonwebtoken";

import { HttpError } from "../utils/http-error.js";

export function requireAuth(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) return next(new HttpError(401, "Missing token"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}

