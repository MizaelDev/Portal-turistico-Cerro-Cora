import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

const secureCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase não configurado.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...secureCookieOptions,
            });
          });
        } catch {
          // Server Components não podem gravar cookies. Middleware/actions fazem isso.
        }
      },
    },
  });
}
