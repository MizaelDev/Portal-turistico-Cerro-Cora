import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { createSupabaseServerClient } from "@/lib/supabase-server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function requireAdminSession(supabase: SupabaseServerClient): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase.rpc("is_admin", {
    user_id: user.id,
  });

  if (error || data !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login?unauthorized=1");
  }

  return user;
}
