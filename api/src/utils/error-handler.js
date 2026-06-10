import { HttpError } from "./http-error.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details ?? null
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
}

