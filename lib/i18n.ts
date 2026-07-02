import "server-only";
import { cookies, headers } from "next/headers";

export type Locale = "ru" | "en" | "id" | "uz";

const LOCALES: Locale[] = ["ru", "en", "id", "uz"];

/**
 * Язык интерфейса: явный выбор из cookie `locale`, иначе — по языку браузера
 * (Accept-Language). ru → русский, id → индонезийский, uz → узбекский, остальное → en.
 */
export async function getLocale(): Promise<Locale> {
  // Языковой префикс в URL (/ru, /en…) — middleware кладёт его в заголовок.
  const fromPath = (await headers()).get("x-locale") as Locale | undefined;
  if (fromPath && LOCALES.includes(fromPath)) return fromPath;

  const fromCookie = (await cookies()).get("locale")?.value as Locale | undefined;
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;

  const al = (await headers()).get("accept-language") ?? "";
  const primary = al.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("ru")) return "ru";
  if (primary.startsWith("id")) return "id";
  if (primary.startsWith("uz")) return "uz";
  return "en";
}
