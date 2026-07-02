import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeNextPath } from "@/lib/nextPath";

export const dynamic = "force-dynamic";

/**
 * Возврат после Google OAuth. Обмен кода на сессию делаем на сервере.
 * Cookie сессии пишем прямо в redirect-ответ (иначе на Vercel Set-Cookie
 * может не попасть в редирект — сессия потеряется).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV !== "development" && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : url.origin;

  if (!code) return NextResponse.redirect(`${base}/login?error=google`);

  const response = NextResponse.redirect(`${base}${next}`);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${base}/login?error=google`);

  return response;
}
