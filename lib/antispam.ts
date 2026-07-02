import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";

/** IP клиента из заголовков (за прокси Vercel — x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

/** Соль-хэш IP (не храним сырой IP). Стабилен при заданной IP_HASH_SALT. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "doki-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Хэш IP текущего запроса. */
export async function currentIpHash(): Promise<string> {
  return hashIp(await getClientIp());
}

/**
 * Проверка токена Cloudflare Turnstile на сервере. Если TURNSTILE_SECRET_KEY
 * не задан (dev) — пропускаем с предупреждением в лог.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification (dev).");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[turnstile] verification error:", e);
    return false;
  }
}
