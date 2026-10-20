type SafeContext = Record<string, string | number | boolean | null | undefined>;

function errorCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" || typeof code === "number" ? String(code).slice(0, 80) : undefined;
}

export function reportServerError(scope: string, error: unknown, context: SafeContext = {}) {
  const safeContext = Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !/(token|secret|password|authorization|cookie|payload|email|ip)/i.test(key))
      .map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? value.slice(0, 160) : value]),
  );

  console.error("[portal-error]", {
    scope: scope.slice(0, 120),
    errorType: error instanceof Error ? error.name : typeof error,
    code: errorCode(error),
    ...safeContext,
  });
}
