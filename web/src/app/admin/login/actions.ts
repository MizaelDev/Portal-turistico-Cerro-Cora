"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 8;
const genericLoginError = "Email ou senha inválidos.";

async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";
}

async function isRateLimited() {
  const ip = await getClientIp();
  const now = Date.now();
  const current = loginAttempts.get(ip);

  if (!current || current.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + loginWindowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxLoginAttempts;
}

async function clearLoginAttempts() {
  const ip = await getClientIp();
  loginAttempts.delete(ip);
}

async function assertSameOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const host = headersList.get("host");
  const source = origin || referer;

  if (!host || !source) {
    throw new Error("Invalid login origin.");
  }

  const allowedOrigins = new Set(
    [`https://${host}`, `http://${host}`, process.env.NEXT_PUBLIC_SITE_URL]
      .filter(Boolean)
      .map((value) => String(value).replace(/\/$/, "")),
  );

  const sourceOrigin = new URL(source).origin;
  if (!allowedOrigins.has(sourceOrigin)) {
    throw new Error("Invalid login origin.");
  }
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
    await assertSameOrigin();

    if (await isRateLimited()) {
      return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: genericLoginError };
    }

    await clearLoginAttempts();
  } catch {
    return { error: "Não foi possível processar o login agora." };
  }

  redirect("/admin");
}
