import { getSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import SubmitButton from "@/components/SubmitButton";
import { saveEmployerProfile } from "@/app/employer/actions";
import VacancyForm from "./VacancyForm";

const M = {
  en: {
    setupTitle: "Set up your company",
    setupText: "This appears on your vacancy and application pages.",
    company: "Company name",
    companyPh: "e.g. Sunset Cafe",
    whatsapp: "Contact WhatsApp",
    email: "Contact email",
    emailHint: "New application notifications are sent here.",
    optional: "optional",
    save: "Continue",
  },
  id: {
    setupTitle: "Siapkan perusahaan Anda",
    setupText: "Ini tampil di halaman lowongan dan lamaran Anda.",
    company: "Nama perusahaan",
    companyPh: "mis. Sunset Cafe",
    whatsapp: "WhatsApp kontak",
    email: "Email kontak",
    emailHint: "Notifikasi lamaran baru dikirim ke sini.",
    optional: "opsional",
    save: "Lanjut",
  },
  ru: {
    setupTitle: "Настройте компанию",
    setupText: "Это увидят на страницах вакансии и отклика.",
    company: "Название компании",
    companyPh: "напр. Sunset Cafe",
    whatsapp: "WhatsApp для связи",
    email: "Email для связи",
    emailHint: "На этот email приходят уведомления о новых откликах.",
    optional: "необязательно",
    save: "Продолжить",
  },
  uz: {
    setupTitle: "Kompaniyangizni sozlang",
    setupText: "Bu vakansiya va ariza sahifalarida ko‘rinadi.",
    company: "Kompaniya nomi",
    companyPh: "mas. Sunset Cafe",
    whatsapp: "Aloqa WhatsApp",
    email: "Aloqa email",
    emailHint: "Yangi arizalar haqida xabarlar shu emailga keladi.",
    optional: "ixtiyoriy",
    save: "Davom etish",
  },
} as const;

export default async function NewVacancyPage() {
  const locale = await getLocale();
  const t = M[locale];
  const user = await getUser();
  const supabase = await getSupabaseServer();

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <form action={saveEmployerProfile} className="card space-y-4">
          <div>
            <h1 className="text-xl font-semibold">{t.setupTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{t.setupText}</p>
          </div>
          <div>
            <label className="label">{t.company} *</label>
            <input name="company_name" required className="input" placeholder={t.companyPh} />
          </div>
          <div>
            <label className="label">
              {t.whatsapp} <span className="font-normal text-slate-400">({t.optional})</span>
            </label>
            <input name="contact_whatsapp" className="input" inputMode="tel" placeholder="08123456789" />
          </div>
          <div>
            <label className="label">{t.email} *</label>
            <input name="contact_email" type="email" required className="input" />
            <p className="mt-1 text-xs text-slate-400">{t.emailHint}</p>
          </div>
          <SubmitButton className="btn-primary w-full">{t.save}</SubmitButton>
        </form>
      </div>
    );
  }

  return <VacancyForm locale={locale} defaultCompany={profile.company_name} />;
}
