import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import { signOut } from "@/app/login/actions";
import SignOutButton from "@/components/SignOutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const M = {
  en: { brand: "Doki for employers", newVacancy: "+ New vacancy", vacancies: "Vacancies", signOut: "Sign out" },
  id: { brand: "Doki untuk perusahaan", newVacancy: "+ Lowongan baru", vacancies: "Lowongan", signOut: "Keluar" },
  ru: { brand: "Doki для работодателей", newVacancy: "+ Новая вакансия", vacancies: "Вакансии", signOut: "Выйти" },
  uz: { brand: "Ish beruvchilar uchun Doki", newVacancy: "+ Yangi vakansiya", vacancies: "Vakansiyalar", signOut: "Chiqish" },
} as const;

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = M[locale];
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e8e0d5] bg-[#fdfaf5]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/employer" className="font-semibold text-brand-700">
            {t.brand}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={locale} />
            <Link href="/employer/vacancies/new" className="btn-primary">
              {t.newVacancy}
            </Link>
            <form action={signOut}>
              <SignOutButton label={t.signOut} className="btn-ghost" />
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
