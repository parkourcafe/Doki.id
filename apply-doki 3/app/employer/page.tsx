import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import type { Vacancy } from "@/lib/career";

const M = {
  en: {
    title: "Your vacancies",
    subtitle: "Create an apply link, share it, and review candidates in one place.",
    noProfile: "Let's set up your company first.",
    setup: "Set up company",
    empty: "No vacancies yet.",
    createFirst: "Create your first vacancy",
    applications: "applications",
    statusActive: "Active",
    statusPaused: "Paused",
    statusClosed: "Closed",
    open: "Open dashboard →",
  },
  id: {
    title: "Lowongan Anda",
    subtitle: "Buat tautan lamaran, bagikan, dan tinjau kandidat di satu tempat.",
    noProfile: "Siapkan perusahaan Anda dulu.",
    setup: "Siapkan perusahaan",
    empty: "Belum ada lowongan.",
    createFirst: "Buat lowongan pertama",
    applications: "lamaran",
    statusActive: "Aktif",
    statusPaused: "Dijeda",
    statusClosed: "Ditutup",
    open: "Buka dasbor →",
  },
  ru: {
    title: "Ваши вакансии",
    subtitle: "Создайте ссылку для откликов, поделитесь и смотрите кандидатов в одном месте.",
    noProfile: "Сначала настроим вашу компанию.",
    setup: "Настроить компанию",
    empty: "Пока нет вакансий.",
    createFirst: "Создать первую вакансию",
    applications: "откликов",
    statusActive: "Активна",
    statusPaused: "На паузе",
    statusClosed: "Закрыта",
    open: "Открыть дашборд →",
  },
  uz: {
    title: "Vakansiyalaringiz",
    subtitle: "Ariza havolasini yarating, ulashing va nomzodlarni bir joyda ko‘ring.",
    noProfile: "Avval kompaniyangizni sozlaymiz.",
    setup: "Kompaniyani sozlash",
    empty: "Hozircha vakansiya yo‘q.",
    createFirst: "Birinchi vakansiyani yaratish",
    applications: "ariza",
    statusActive: "Faol",
    statusPaused: "To‘xtatilgan",
    statusClosed: "Yopilgan",
    open: "Boshqaruvni ochish →",
  },
} as const;

export default async function EmployerHome() {
  const locale = await getLocale();
  const t = M[locale];
  const user = await getUser();
  const supabase = await getSupabaseServer();

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="card text-center">
        <div className="mb-2 text-3xl">🏢</div>
        <p className="text-sm text-slate-600">{t.noProfile}</p>
        <Link href="/employer/vacancies/new" className="btn-primary mt-4">
          {t.setup}
        </Link>
      </div>
    );
  }

  const { data: vacData } = await supabase
    .from("vacancies")
    .select("*")
    .eq("employer_id", profile.id)
    .order("created_at", { ascending: false });
  const vacancies = (vacData ?? []) as Vacancy[];

  // Счётчик откликов по всем вакансиям одним запросом.
  const ids = vacancies.map((v) => v.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: apps } = await supabase
      .from("applications")
      .select("vacancy_id")
      .in("vacancy_id", ids);
    for (const a of (apps ?? []) as { vacancy_id: string }[]) {
      counts[a.vacancy_id] = (counts[a.vacancy_id] ?? 0) + 1;
    }
  }

  const statusLabel = (s: string) =>
    s === "active" ? t.statusActive : s === "paused" ? t.statusPaused : t.statusClosed;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      {vacancies.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-slate-600">{t.empty}</p>
          <Link href="/employer/vacancies/new" className="btn-primary mt-4">
            {t.createFirst}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {vacancies.map((v) => (
            <li key={v.id}>
              <Link
                href={`/employer/vacancies/${v.id}`}
                className="card flex items-center justify-between gap-3 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.title}</p>
                  <p className="truncate text-sm text-slate-500">
                    {v.company_name}
                    {v.location ? ` · ${v.location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {statusLabel(v.status)} · {counts[v.id] ?? 0} {t.applications}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-brand-600">{t.open}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
