import { getSupabaseServer } from "@/lib/supabase/server";

/** Текущий пользователь (или null). */
export async function getUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
