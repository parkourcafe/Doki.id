import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import { claimApplication } from "../../actions";

export const metadata = { robots: { index: false, follow: false } };

const M = {
  en: {
    title: "Documents saved", copied: (n: number) => `${n} document(s) copied to your Doki vault.`,
    linkedOnly: "Your application is linked to your account. Documents will appear in your vault shortly.",
    failed: "We couldn't link this application. The link may be invalid.",
    openVault: "Open my vault", vaultUrl: "https://doki.help/my",
  },
  id: {
    title: "Dokumen tersimpan", copied: (n: number) => `${n} dokumen disalin ke brankas Doki Anda.`,
    linkedOnly: "Lamaran Anda tertaut ke akun. Dokumen akan muncul di brankas sebentar lagi.",
    failed: "Kami tidak dapat menautkan lamaran ini. Tautan mungkin tidak valid.",
    openVault: "Buka brankas saya", vaultUrl: "https://doki.help/my",
  },
  ru: {
    title: "Документы сохранены", copied: (n: number) => `${n} документ(ов) скопировано в ваш vault Doki.`,
    linkedOnly: "Отклик привязан к аккаунту. Документы появятся в хранилище чуть позже.",
    failed: "Не удалось привязать отклик. Возможно, ссылка недействительна.",
    openVault: "Открыть моё хранилище", vaultUrl: "https://doki.help/my",
  },
  uz: {
    title: "Hujjatlar saqlandi", copied: (n: number) => `${n} ta hujjat Doki xotirangizga nusxalandi.`,
    linkedOnly: "Ariza akkauntingizga bog‘landi. Hujjatlar tez orada xotirada paydo bo‘ladi.",
    failed: "Arizani bog‘lab bo‘lmadi. Havola yaroqsiz bo‘lishi mumkin.",
    openVault: "Xotiramni ochish", vaultUrl: "https://doki.help/my",
  },
} as const;

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/apply/claim/${token}`)}`);

  const locale = await getLocale();
  const t = M[locale];
  const res = await claimApplication(token);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mb-2 text-4xl">{res.ok ? "📁" : "⛔"}</div>
          <h1 className="text-lg font-semibold">{res.ok ? t.title : t.failed}</h1>
          {res.ok && (
            <p className="mt-1 text-sm text-slate-600">
              {res.linkedOnly ? t.linkedOnly : t.copied(res.copied)}
            </p>
          )}
          <a href={t.vaultUrl} className="btn-primary mt-4 w-full">
            {t.openVault}
          </a>
        </div>
      </div>
    </main>
  );
}
