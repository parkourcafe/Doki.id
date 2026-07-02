import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Админ-клиент (service_role). ТОЛЬКО на сервере. Нужен для копирования файлов
 * отклика из приватного bucket `applications` (читать может лишь владелец
 * вакансии) в личный vault кандидата при «claim» после регистрации.
 * Возвращает null, если ключ не задан — фича деградирует мягко.
 */
export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
