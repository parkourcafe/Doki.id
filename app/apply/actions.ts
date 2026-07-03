"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeWhatsapp, type Source, type CandidateProfile } from "@/lib/career";
import { currentIpHash, verifyTurnstile } from "@/lib/antispam";
import { sendNewApplicationEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n";

// ---------------------------- Precheck --------------------------------

export type PrecheckResult = {
  ok?: boolean;
  duplicate?: boolean;
  accessToken?: string;
  rateLimited?: boolean;
  notFound?: boolean;
};

/**
 * Быстрая проверка ПЕРЕД загрузкой файлов: дубликат и лимит по IP — чтобы не
 * заливать файлы впустую. Финальный submit всё равно перепроверяет (backstop).
 */
export async function precheckApplication(input: {
  slug: string;
  whatsapp: string;
}): Promise<PrecheckResult> {
  const supabase = await getSupabaseServer();
  const ipHash = await currentIpHash();
  const { data, error } = await supabase.rpc("precheck_application", {
    p_slug: input.slug,
    p_whatsapp: normalizeWhatsapp(input.whatsapp),
    p_ip_hash: ipHash,
  });
  if (error) return { ok: true };
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    ok: r.ok === true,
    duplicate: r.duplicate === true,
    accessToken: (r.access_token as string) ?? undefined,
    rateLimited: r.rate_limited === true,
    notFound: r.not_found === true,
  };
}

// ---------------------------- Submit ----------------------------------

export type SubmitApplicationInput = {
  applicationId: string;
  slug: string;
  fullName: string;
  whatsapp: string;
  email?: string;
  consentText: string;
  source: Source;
  turnstileToken?: string | null;
  answers: { question: string; type: string; answer: string }[];
  documents: { type: string; label: string; path: string; name: string; size: number }[];
  profile: CandidateProfile;
  docsComplete: number;
  docsTotal: number;
};

export type SubmitResult =
  | { ok: true; duplicate: boolean; accessToken: string }
  | { ok: false; error: "turnstile" | "rate_limited" | "generic" };

/**
 * Публичная подача отклика (без авторизации). Порядок: Turnstile → лимит IP →
 * дубликат → создание (лимит и дубликат также внутри submit_application).
 * Ошибка письма работодателю НЕ роняет подачу.
 */
export async function submitApplication(input: SubmitApplicationInput): Promise<SubmitResult> {
  const okToken = await verifyTurnstile(input.turnstileToken);
  if (!okToken) return { ok: false, error: "turnstile" };

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ipHash = await currentIpHash();

  const { data, error } = await supabase.rpc("submit_application", {
    p_application_id: input.applicationId,
    p_slug: input.slug,
    p_full_name: input.fullName,
    p_whatsapp: normalizeWhatsapp(input.whatsapp),
    p_email: input.email || null,
    p_consent_text: input.consentText,
    p_answers: input.answers ?? [],
    p_documents: input.documents ?? [],
    p_source: input.source,
    p_ip_hash: ipHash,
    p_user_id: user?.id ?? null,
    p_profile: input.profile ?? {},
  });

  if (error) {
    if ((error.message || "").includes("rate_limited")) return { ok: false, error: "rate_limited" };
    return { ok: false, error: "generic" };
  }

  const res = data as {
    duplicate: boolean;
    access_token: string;
    vacancy_id?: string;
    employer_email?: string | null;
    vacancy_title?: string;
    company_name?: string;
  };

  if (!res.duplicate && res.employer_email) {
    const locale = await getLocale();
    // Письмо в фоне; try/catch внутри — сбой не влияет на результат.
    await sendNewApplicationEmail({
      to: res.employer_email,
      locale,
      candidateName: input.fullName,
      vacancyTitle: res.vacancy_title ?? "",
      companyName: res.company_name ?? "",
      docsComplete: input.docsComplete,
      docsTotal: input.docsTotal,
      source: input.source,
      vacancyId: res.vacancy_id ?? "",
    });
  }

  return { ok: true, duplicate: res.duplicate, accessToken: res.access_token };
}

// ---------------------- Reuse loop (growth) --------------------------

/** Автозаполнение формы для залогиненного кандидата. */
export async function getCandidatePrefill(): Promise<{ fullName: string; email: string } | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = (meta.full_name as string) || (meta.name as string) || "";
  return { fullName, email: user.email ?? "" };
}

export type VaultDoc = {
  fileId: string;
  title: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
};

/** Документы из личного vault кандидата — для «прикрепить из хранилища». */
export async function listVaultDocuments(): Promise<VaultDoc[]> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("document_files")
    .select("id, storage_path, file_name, mime_type, documents(title)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];

  return (data as unknown as {
    id: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
    documents: { title: string } | null;
  }[]).map((f) => ({
    fileId: f.id,
    title: f.documents?.title ?? f.file_name ?? "Document",
    fileName: f.file_name ?? "file",
    storagePath: f.storage_path,
    mimeType: f.mime_type,
  }));
}

/**
 * Копирует файл из vault-files в bucket applications под текущий отклик.
 * Сессия кандидата читает свой vault (RLS: член household) и заливает в
 * applications (anon-инсерт в папку активной вакансии).
 */
export async function attachVaultDoc(input: {
  vacancyId: string;
  applicationId: string;
  docType: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
}): Promise<{ ok: boolean; path?: string; name?: string; size?: number }> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const dl = await supabase.storage.from("vault-files").download(input.storagePath);
  if (dl.error || !dl.data) return { ok: false };
  const blob = dl.data;
  const safe = input.fileName.replace(/[^\w.\-]+/g, "_") || "file";
  const path = `${input.vacancyId}/${input.applicationId}/${input.docType}_vault-${Date.now()}-${safe}`;
  const up = await supabase.storage.from("applications").upload(path, blob, {
    contentType: input.mimeType || "application/octet-stream",
    upsert: false,
  });
  if (up.error) return { ok: false };
  return { ok: true, path, name: input.fileName, size: blob.size };
}

/**
 * Claim после регистрации: связывает отклик с аккаунтом (claim_application) и
 * копирует загруженные файлы в личный vault кандидата. Чтение приватного
 * bucket `applications` требует service_role (владелец — работодатель),
 * поэтому копирование делаем admin-клиентом; запись в vault — сессией юзера.
 * Без service_role связь ставится, копирование пропускается.
 */
export async function claimApplication(
  token: string
): Promise<{ ok: boolean; copied: number; linkedOnly?: boolean }> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, copied: 0 };

  const { data: claim } = await supabase.rpc("claim_application", { p_token: token });
  const c = (claim ?? {}) as { ok?: boolean; application_id?: string };
  if (!c.ok || !c.application_id) return { ok: false, copied: 0 };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, copied: 0, linkedOnly: true };

  const { data: docs } = await admin
    .from("application_documents")
    .select("document_type, document_label, file_path, file_name")
    .eq("application_id", c.application_id);
  const docList = (docs ?? []) as {
    document_type: string;
    document_label: string;
    file_path: string;
    file_name: string;
  }[];
  if (!docList.length) return { ok: true, copied: 0 };

  // household кандидата (создаём при отсутствии).
  let householdId: string | null = null;
  const { data: mem } = await supabase
    .from("household_members")
    .select("household_id")
    .limit(1)
    .maybeSingle();
  if (mem) householdId = (mem as { household_id: string }).household_id;
  else {
    const { data: hid } = await supabase.rpc("create_household", { p_name: "My documents" });
    householdId = (hid as string) ?? null;
  }
  if (!householdId) return { ok: true, copied: 0, linkedOnly: true };

  // member (нужен documents.member_id NOT NULL).
  let memberId: string | null = null;
  const { data: m } = await supabase
    .from("members")
    .select("id")
    .eq("household_id", householdId)
    .limit(1)
    .maybeSingle();
  if (m) memberId = (m as { id: string }).id;
  else {
    const { data: nm } = await supabase
      .from("members")
      .insert({ household_id: householdId, full_name: "Me" })
      .select("id")
      .single();
    memberId = (nm as { id: string } | null)?.id ?? null;
  }
  if (!memberId) return { ok: true, copied: 0, linkedOnly: true };

  let copied = 0;
  for (const d of docList) {
    const dl = await admin.storage.from("applications").download(d.file_path);
    if (dl.error || !dl.data) continue;
    const blob = dl.data;
    const { data: docRow } = await supabase
      .from("documents")
      .insert({
        household_id: householdId,
        member_id: memberId,
        category: "other",
        title: d.document_label || d.file_name || "Document",
      })
      .select("id")
      .single();
    const docId = (docRow as { id: string } | null)?.id;
    if (!docId) continue;
    const safe = (d.file_name || "file").replace(/[^\w.\-]+/g, "_");
    const path = `${householdId}/${docId}/${Date.now()}-${safe}`;
    const up = await supabase.storage.from("vault-files").upload(path, blob, {
      contentType: "application/octet-stream",
      upsert: false,
    });
    if (up.error) continue;
    await supabase.from("document_files").insert({
      document_id: docId,
      household_id: householdId,
      storage_path: path,
      file_name: d.file_name,
      size_bytes: blob.size,
    });
    copied++;
  }

  return { ok: true, copied };
}
