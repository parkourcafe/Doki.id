import { createBrowserClient } from "@supabase/ssr";

/** Браузерный Supabase-клиент для клиентских компонентов (login, MFA, upload). */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
