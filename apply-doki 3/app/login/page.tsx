import { redirect } from "next/navigation";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import { safeNextPath } from "@/lib/nextPath";
import LoginForm from "./LoginForm";

const M = {
  ru: {
    badge: "Doki · Найм",
    headingLead: "Вакансии и отклики —",
    headingAccent: "в одном месте",
    subtitle: "Создайте вакансию, поделитесь ссылкой и получайте структурированные отклики.",
    security: "Приватно по умолчанию · RLS · приватный storage",
    oauthError: "Не удалось войти через Google. Попробуйте ещё раз.",
  },
  en: {
    badge: "Doki · Hiring",
    headingLead: "Vacancies and applications —",
    headingAccent: "in one place",
    subtitle: "Create a vacancy, share a link, and receive structured applications.",
    security: "Private by default · RLS · private storage",
    oauthError: "Couldn't sign in with Google. Please try again.",
  },
  id: {
    badge: "Doki · Rekrutmen",
    headingLead: "Lowongan dan lamaran —",
    headingAccent: "di satu tempat",
    subtitle: "Buat lowongan, bagikan tautan, dan terima lamaran yang terstruktur.",
    security: "Privat secara bawaan · RLS · penyimpanan privat",
    oauthError: "Gagal masuk dengan Google. Silakan coba lagi.",
  },
  uz: {
    badge: "Doki · Yollash",
    headingLead: "Vakansiya va arizalar —",
    headingAccent: "bitta joyda",
    subtitle: "Vakansiya yarating, havolani ulashing va tuzilgan arizalarni oling.",
    security: "Standart boʻyicha maxfiy · RLS · maxfiy saqlash",
    oauthError: "Google orqali kirib boʻlmadi. Qayta urinib koʻring.",
  },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  if (await getUser()) redirect(next);

  const locale = await getLocale();
  const t = M[locale];
  const oauthFailed = sp.error === "google";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
            <span>💼</span> {t.badge}
          </div>
          <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-[2.6rem]">
            {t.headingLead}{" "}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-[#d4a373] bg-clip-text text-transparent">
              {t.headingAccent}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm text-slate-500">{t.subtitle}</p>
        </div>

        {oauthFailed && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {t.oauthError}
          </p>
        )}

        <div className="card shadow-md">
          <LoginForm locale={locale} next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">{t.security}</p>
      </div>
    </main>
  );
}
