"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { normalizeWhatsapp } from "@/lib/career";
import type {
  RequiredDocument,
  ScreeningQuestion,
  ApplicationStatus,
} from "@/lib/career";

/** Создать/обновить профиль работодателя для текущего пользователя. */
export async function saveEmployerProfile(formData: FormData) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company_name = String(formData.get("company_name") ?? "").trim();
  const contact_email = String(formData.get("contact_email") ?? "").trim();
  // Компания и email обязательны — на email приходят уведомления об откликах.
  if (!company_name || !contact_email) return;
  const contact_whatsapp = String(formData.get("contact_whatsapp") ?? "").trim();

  const { error } = await supabase.from("employer_profiles").upsert(
    {
      user_id: user.id,
      company_name,
      contact_whatsapp: contact_whatsapp ? normalizeWhatsapp(contact_whatsapp) : null,
      contact_email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  revalidatePath("/employer/vacancies/new");
  redirect("/employer/vacancies/new");
}

export type CreateVacancyInput = {
  title: string;
  company_name: string;
  location?: string;
  salary_range?: string;
  schedule?: string;
  description?: string;
  urgency?: "normal" | "hiring_now";
  closes_at?: string | null;
  required_documents: RequiredDocument[];
  screening_questions: ScreeningQuestion[];
};

/** Создать вакансию через RPC (генерит уникальный slug). Возвращает id/slug. */
export async function createVacancy(
  input: CreateVacancyInput
): Promise<{ id: string; slug: string }> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("create_vacancy", {
    p_title: input.title,
    p_company_name: input.company_name,
    p_location: input.location || null,
    p_salary_range: input.salary_range || null,
    p_schedule: input.schedule || null,
    p_description: input.description || null,
    p_urgency: input.urgency || "normal",
    p_closes_at: input.closes_at || null,
    p_required_documents: input.required_documents ?? [],
    p_screening_questions: input.screening_questions ?? [],
  });
  if (error) throw error;
  const res = data as { id: string; slug: string };
  revalidatePath("/employer");
  return res;
}

/** Работодатель меняет статус отклика (shortlist/reject/…). */
export async function setApplicationStatus(
  applicationId: string,
  vacancyId: string,
  status: ApplicationStatus
) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.rpc("update_application_status", {
    p_application_id: applicationId,
    p_new_status: status,
  });
  if (error) throw error;
  revalidatePath(`/employer/vacancies/${vacancyId}`);
}

/** Свежий signed URL (2 мин) на файл отклика. RLS пускает только владельца. */
export async function signApplicationDoc(path: string): Promise<string | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.storage
    .from("applications")
    .createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}

/** Автопометка «просмотрено» при открытии дашборда (new→viewed). */
export async function markApplicationsViewed(applicationIds: string[]) {
  if (!applicationIds.length) return;
  const supabase = await getSupabaseServer();
  await Promise.all(
    applicationIds.map((id) =>
      supabase.rpc("mark_application_viewed", { p_application_id: id })
    )
  );
}
