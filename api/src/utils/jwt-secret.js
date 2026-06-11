export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === "dev-secret" || secret === "dev-secret-change-me") {
    throw new Error("JWT_SECRET must be configured with a strong production value.");
  }

  return secret;
}

export function getJwtIssuer() {
  return process.env.JWT_ISSUER || "portal-cerro-cora-api";
}
