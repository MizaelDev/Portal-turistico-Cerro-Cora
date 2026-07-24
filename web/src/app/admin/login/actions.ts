"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { assertSameOriginRequest } from "@/lib/server-request-security";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um email válido.").max(254),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.").max(128),
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const loginWindowMs = 15 * 60 * 1000;
const loginWindowSeconds = loginWindowMs / 1000;
const maxLoginAttempts = 8;
const genericLoginError = "Email ou senha inválidos.";
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";
}

async function getLoginAttemptKey(email: string) {
  const ip = await getClientIp();
  return createHash("sha256").update(`${ip}:${email.toLowerCase().trim()}`).digest("hex");
}

async function isLocallyRateLimited(key: string) {
  const now = Date.now();

  if (loginAttempts.size > 5_000) {
    for (const [attemptKey, attempt] of loginAttempts) {
      if (attempt.resetAt <= now) loginAttempts.delete(attemptKey);
    }
  }
  if (loginAttempts.size > 10_000) loginAttempts.clear();

  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxLoginAttempts;
}

async function isRateLimited(supabase: SupabaseServerClient, email: string) {
  const key = await getLoginAttemptKey(email);
  const { data, error } = await supabase.rpc("check_login_rate_limit", {
    p_identifier: key,
    p_max_attempts: maxLoginAttempts,
    p_window_seconds: loginWindowSeconds,
  });

  if (!error) {
    return Boolean(data);
  }

  return isLocallyRateLimited(key);
}

async function clearLoginAttempts(supabase: SupabaseServerClient, email: string) {
  const key = await getLoginAttemptKey(email);
  loginAttempts.delete(key);

  await supabase.rpc("clear_login_rate_limit", {
    p_identifier: key,
  });
}

export async function loginAction(_: { error: string }, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Dados inválidos." };
  }

  try {
    await assertSameOriginRequest("Invalid login origin.");
    const supabase = await createSupabaseServerClient();

    if (await isRateLimited(supabase, parsed.data.email)) {
      return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
    }

    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: genericLoginError };
    }

    await clearLoginAttempts(supabase, parsed.data.email);
  } catch {
    return { error: "Não foi possível processar o login agora." };
  }

  redirect("/admin");
}
