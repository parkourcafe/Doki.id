/**
 * Безопасный локальный путь для редиректа после входа: только относительные
 * пути этого же сайта (открытые редиректы на чужие домены запрещены).
 */
export function safeNextPath(raw: unknown, fallback = "/employer"): string {
  const s = typeof raw === "string" ? raw : "";
  if (s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\")) return s;
  return fallback;
}
