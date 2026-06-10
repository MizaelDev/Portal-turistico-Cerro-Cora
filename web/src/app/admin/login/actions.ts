"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export async function loginAction(_: { error: string }, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Dados inválidos." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: "Email ou senha inválidos." };
    }
  } catch {
    return { error: "Configure as variáveis do Supabase antes de acessar o painel." };
  }

  redirect("/admin");
}
