import jwt from "jsonwebtoken";

import { HttpError } from "../utils/http-error.js";
import { getJwtIssuer, getJwtSecret } from "../utils/jwt-secret.js";

export function requireAuth(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) return next(new HttpError(401, "Missing token"));

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: getJwtIssuer()
    });
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}
