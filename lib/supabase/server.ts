import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Серверный Supabase-клиент, привязанный к сессии пользователя (cookies).
 * Используется в RSC, server actions и route handlers. Авторизация — через RLS.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: any }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // вызвано из RSC, где set недоступен — обновление сессии делает middleware
          }
        },
      },
    }
  );
}
