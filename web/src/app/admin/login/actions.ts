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

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Esse email ainda não foi confirmado no Supabase Auth.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha inválidos.";
  }

  return "Não foi possível entrar. Verifique o usuário no Supabase Auth.";
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
    if (await isRateLimited()) {
      return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: authErrorMessage(error.message) };
    }

    await clearLoginAttempts();
  } catch {
    return { error: "Configure as variáveis do Supabase antes de acessar o painel." };
  }

  redirect("/admin");
}
