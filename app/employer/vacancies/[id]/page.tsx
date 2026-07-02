import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import { appBaseUrl, type Vacancy } from "@/lib/career";
import { markApplicationsViewed } from "@/app/employer/actions";
import ShareBox from "./ShareBox";
import ApplicationsBoard, { type BoardApp } from "./ApplicationsBoard";

const M = {
  en: { back: "← All vacancies", created: "Vacancy created — share the link below to start receiving applications." },
  id: { back: "← Semua lowongan", created: "Lowongan dibuat — bagikan tautan di bawah untuk mulai menerima lamaran." },
  ru: { back: "← Все вакансии", created: "Вакансия создана — поделитесь ссылкой ниже, чтобы начать принимать отклики." },
  uz: { back: "← Barcha vakansiyalar", created: "Vakansiya yaratildi — arizalarni qabul qilish uchun havolani ulashing." },
} as const;

export default async function VacancyDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const locale = await getLocale();
  const t = M[locale];
  const { id } = await params;
  const { created } = await searchParams;
  const user = await getUser();
  const supabase = await getSupabaseServer();

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!profile) redirect("/employer");

  const { data: vacData } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", id)
    .eq("employer_id", profile.id)
    .maybeSingle();
  const vacancy = vacData as Vacancy | null;
  if (!vacancy) notFound();

  const { data: appData } = await supabase
    .from("applications")
    .select("id, full_name, whatsapp, email, status, source, created_at")
    .eq("vacancy_id", vacancy.id)
    .order("created_at", { ascending: false });
  const rows = (appData ?? []) as Omit<BoardApp, "documents" | "answers">[];

  // Автопометка «просмотрено»: все new → viewed при открытии дашборда.
  const newIds = rows.filter((r) => r.status === "new").map((r) => r.id);
  if (newIds.length) {
    await markApplicationsViewed(newIds);
    for (const r of rows) if (r.status === "new") r.status = "viewed";
  }

  const appIds = rows.map((r) => r.id);
  const docsByApp: Record<string, BoardApp["documents"]> = {};
  const answersByApp: Record<string, BoardApp["answers"]> = {};
  if (appIds.length) {
    const [{ data: docs }, { data: answers }] = await Promise.all([
      supabase
        .from("application_documents")
        .select("application_id, document_type, document_label, file_name, file_path")
        .in("application_id", appIds),
      supabase
        .from("application_answers")
        .select("application_id, question, answer, question_type")
        .in("application_id", appIds),
    ]);
    for (const d of (docs ?? []) as {
      application_id: string;
      document_type: string;
      document_label: string;
      file_name: string;
      file_path: string;
    }[]) {
      (docsByApp[d.application_id] ??= []).push({
        type: d.document_type,
        label: d.document_label,
        file_name: d.file_name,
        path: d.file_path,
      });
    }
    for (const a of (answers ?? []) as {
      application_id: string;
      question: string;
      answer: string;
      question_type: string;
    }[]) {
      (answersByApp[a.application_id] ??= []).push({
        question: a.question,
        answer: a.answer,
        type: a.question_type,
      });
    }
  }

  const applications: BoardApp[] = rows.map((r) => ({
    ...r,
    documents: docsByApp[r.id] ?? [],
    answers: answersByApp[r.id] ?? [],
  }));

  const applyUrl = `${appBaseUrl()}/apply/${vacancy.slug}`;

  return (
    <div>
      <Link href="/employer" className="text-sm text-slate-500 hover:text-slate-800">
        {t.back}
      </Link>

      <div className="mb-4 mt-2">
        <h1 className="text-2xl font-semibold">{vacancy.title}</h1>
        <p className="text-sm text-slate-500">
          {vacancy.company_name}
          {vacancy.location ? ` · ${vacancy.location}` : ""}
        </p>
      </div>

      {created && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {t.created}
        </p>
      )}

      <div className="mb-5">
        <ShareBox
          locale={locale}
          applyUrl={applyUrl}
          title={vacancy.title}
          company={vacancy.company_name}
          slug={vacancy.slug}
        />
      </div>

      <ApplicationsBoard
        locale={locale}
        vacancyId={vacancy.id}
        vacancyTitle={vacancy.title}
        companyName={vacancy.company_name}
        viewsCount={vacancy.views_count ?? 0}
        requiredDocs={vacancy.required_documents ?? []}
        initialApplications={applications}
      />
    </div>
  );
}
