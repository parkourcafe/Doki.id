import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getLocale, type Locale } from "@/lib/i18n";
import { waLink, type ApplicationStatus } from "@/lib/career";

export const metadata = {
  robots: { index: false, follow: false },
};

type StatusData = {
  status: ApplicationStatus;
  full_name: string;
  created_at: string;
  vacancy: { title: string; company_name: string; location: string | null; slug: string };
  employer_contact: { whatsapp: string | null; email: string | null } | null;
  timeline: { old_status: string | null; new_status: string; created_at: string }[];
};

const M = {
  en: {
    notFoundTitle: "Application not found",
    notFoundText: "This status link is invalid or the application was deleted.",
    yourApplication: "Your application",
    submittedOn: "Submitted on",
    statusLabels: { new: "Submitted", viewed: "Viewed", shortlisted: "Shortlisted", rejected: "Not selected" },
    timeline: "Timeline",
    contact: "Employer contact",
    contactHint: "You've been shortlisted — reach out to the employer:",
    poweredBy: "Powered by",
  },
  id: {
    notFoundTitle: "Lamaran tidak ditemukan",
    notFoundText: "Tautan status ini tidak valid atau lamaran telah dihapus.",
    yourApplication: "Lamaran Anda",
    submittedOn: "Dikirim pada",
    statusLabels: { new: "Terkirim", viewed: "Dilihat", shortlisted: "Terpilih", rejected: "Tidak dipilih" },
    timeline: "Linimasa",
    contact: "Kontak perusahaan",
    contactHint: "Anda terpilih — hubungi perusahaan:",
    poweredBy: "Didukung oleh",
  },
  ru: {
    notFoundTitle: "Отклик не найден",
    notFoundText: "Ссылка недействительна или отклик был удалён.",
    yourApplication: "Ваш отклик",
    submittedOn: "Отправлено",
    statusLabels: { new: "Отправлено", viewed: "Просмотрено", shortlisted: "В шортлисте", rejected: "Не выбран" },
    timeline: "История",
    contact: "Контакт работодателя",
    contactHint: "Вас отобрали — свяжитесь с работодателем:",
    poweredBy: "Работает на",
  },
  uz: {
    notFoundTitle: "Ariza topilmadi",
    notFoundText: "Havola yaroqsiz yoki ariza o‘chirilgan.",
    yourApplication: "Arizangiz",
    submittedOn: "Yuborilgan sana",
    statusLabels: { new: "Yuborildi", viewed: "Ko‘rildi", shortlisted: "Tanlangan", rejected: "Tanlanmadi" },
    timeline: "Vaqt chizig‘i",
    contact: "Ish beruvchi aloqasi",
    contactHint: "Siz tanlandingiz — ish beruvchiga murojaat qiling:",
    poweredBy: "Ishlaydi",
  },
} as const;

const LOCALE_CODE: Record<Locale, string> = {
  en: "en-US", id: "id-ID", ru: "ru-RU", uz: "uz-UZ",
};

function fmt(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(LOCALE_CODE[locale], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </main>
  );
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const locale = await getLocale();
  const t = M[locale];
  const { token } = await params;

  const supabase = await getSupabaseServer();
  const { data } = await supabase.rpc("get_application_status", { p_token: token });
  const app = data as StatusData | null;

  if (!app) {
    return (
      <Shell>
        <div className="card text-center">
          <div className="mb-2 text-3xl">🔍</div>
          <h1 className="text-lg font-semibold">{t.notFoundTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.notFoundText}</p>
        </div>
      </Shell>
    );
  }

  const statusLabel = (s: string) =>
    t.statusLabels[s as ApplicationStatus] ?? s;

  const badgeCls: Record<ApplicationStatus, string> = {
    new: "bg-blue-100 text-blue-700",
    viewed: "bg-slate-100 text-slate-600",
    shortlisted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <Shell>
      <div className="card space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t.yourApplication}
          </p>
          <h1 className="mt-1 text-xl font-semibold leading-tight">{app.vacancy.title}</h1>
          <p className="text-sm text-slate-500">
            {app.vacancy.company_name}
            {app.vacancy.location ? ` · ${app.vacancy.location}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t.submittedOn} {fmt(app.created_at, locale)}
          </p>
        </div>

        <div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${badgeCls[app.status]}`}>
            {statusLabel(app.status)}
          </span>
        </div>

        {app.status === "shortlisted" && app.employer_contact && (
          <div className="rounded-lg bg-green-50 p-3 text-sm">
            <p className="font-medium text-green-800">{t.contact}</p>
            <p className="mt-1 text-green-700">{t.contactHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {app.employer_contact.whatsapp && (
                <a
                  href={waLink(app.employer_contact.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn border border-green-200 bg-white text-green-700 hover:bg-green-100"
                >
                  💬 {app.employer_contact.whatsapp}
                </a>
              )}
              {app.employer_contact.email && (
                <a
                  href={`mailto:${app.employer_contact.email}`}
                  className="btn border border-green-200 bg-white text-green-700 hover:bg-green-100"
                >
                  ✉️ {app.employer_contact.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{t.timeline}</p>
          <ol className="space-y-3">
            {app.timeline.map((e, i) => (
              <li key={i} className="flex gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  {i < app.timeline.length - 1 && (
                    <span className="mt-1 h-full w-px flex-1 bg-slate-200" />
                  )}
                </div>
                <div className="pb-1">
                  <p className="text-sm text-slate-800">{statusLabel(e.new_status)}</p>
                  <p className="text-xs text-slate-400">{fmt(e.created_at, locale)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-400">
        {t.poweredBy}{" "}
        <Link href="/" className="font-medium text-brand-600 hover:underline">
          doki.help
        </Link>
      </footer>
    </Shell>
  );
}
