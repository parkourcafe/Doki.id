import type { Locale } from "./i18n";

// ============================ Типы ====================================

export type DocType =
  | "cv"
  | "ktp"
  | "diploma"
  | "health_cert"
  | "certificate"
  | "other";

export type RequiredDocument = {
  type: DocType;
  label: string;
  required: boolean;
};

export type ScreeningQuestion = {
  question: string;
  type: "text" | "yes_no";
};

export type Urgency = "normal" | "hiring_now";
export type VacancyStatus = "active" | "paused" | "closed";
export type ApplicationStatus = "new" | "viewed" | "shortlisted" | "rejected";
export type Source = "wa" | "ig" | "qr" | "direct" | "other";

export const SOURCES: Source[] = ["wa", "ig", "qr", "direct", "other"];

/** Нормализуем ?src= в допустимое значение (по умолчанию 'direct'). */
export function parseSource(raw: string | null | undefined): Source {
  const s = (raw ?? "").toLowerCase();
  return (SOURCES as string[]).includes(s) ? (s as Source) : "direct";
}

const SOURCE_LABELS: Record<Source, string> = {
  wa: "WhatsApp",
  ig: "Instagram",
  qr: "QR",
  direct: "Direct",
  other: "Other",
};
export function sourceLabel(s: string): string {
  return SOURCE_LABELS[s as Source] ?? SOURCE_LABELS.other;
}

// ===================== Профиль кандидата (всё по желанию) =============

export type ProfileFieldKey =
  | "instagram" | "facebook" | "linkedin" | "portfolio"
  | "experience" | "prev_company" | "prev_contact"
  | "address" | "salary_expectation" | "available_from";

export type CandidateProfile = Partial<Record<ProfileFieldKey, string>>;

export const PROFILE_FIELDS: { key: ProfileFieldKey; kind: "url" | "text" | "textarea" }[] = [
  { key: "instagram", kind: "url" },
  { key: "facebook", kind: "url" },
  { key: "linkedin", kind: "url" },
  { key: "portfolio", kind: "url" },
  { key: "experience", kind: "textarea" },
  { key: "prev_company", kind: "text" },
  { key: "prev_contact", kind: "text" },
  { key: "address", kind: "text" },
  { key: "salary_expectation", kind: "text" },
  { key: "available_from", kind: "text" },
];

const PROFILE_LABELS: Record<Locale, Record<ProfileFieldKey, string>> = {
  en: {
    instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", portfolio: "Portfolio / website",
    experience: "Work experience", prev_company: "Previous employer", prev_contact: "Reference contact (phone/email)",
    address: "Address / city", salary_expectation: "Expected salary", available_from: "Available from",
  },
  id: {
    instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", portfolio: "Portofolio / situs",
    experience: "Pengalaman kerja", prev_company: "Perusahaan sebelumnya", prev_contact: "Kontak referensi (telp/email)",
    address: "Alamat / kota", salary_expectation: "Gaji diharapkan", available_from: "Bisa mulai kerja",
  },
  ru: {
    instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", portfolio: "Портфолио / сайт",
    experience: "Опыт работы", prev_company: "Прошлый работодатель", prev_contact: "Контакт для рекомендации (тел./email)",
    address: "Адрес / город", salary_expectation: "Желаемая зарплата", available_from: "Может выйти с",
  },
  uz: {
    instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", portfolio: "Portfolio / sayt",
    experience: "Ish tajribasi", prev_company: "Oldingi ish beruvchi", prev_contact: "Referens kontakti (tel./email)",
    address: "Manzil / shahar", salary_expectation: "Kutilayotgan maosh", available_from: "Ishga chiqa oladi",
  },
};

export function profileFieldLabel(locale: Locale, key: ProfileFieldKey): string {
  return (PROFILE_LABELS[locale] ?? PROFILE_LABELS.en)[key];
}

export function isUrlField(key: ProfileFieldKey): boolean {
  return PROFILE_FIELDS.find((f) => f.key === key)?.kind === "url";
}

export type EmployerProfile = {
  id: string;
  user_id: string;
  company_name: string;
  company_logo_url: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  created_at: string;
};

export type Vacancy = {
  id: string;
  employer_id: string;
  title: string;
  slug: string;
  company_name: string;
  location: string | null;
  salary_range: string | null;
  schedule: string | null;
  description: string | null;
  urgency: Urgency;
  required_documents: RequiredDocument[];
  screening_questions: ScreeningQuestion[];
  status: VacancyStatus;
  views_count: number;
  closes_at: string | null;
  created_at: string;
};

export type Application = {
  id: string;
  vacancy_id: string;
  full_name: string;
  whatsapp: string;
  email: string | null;
  status: ApplicationStatus;
  source: Source;
  created_at: string;
};

export type ApplicationDocument = {
  id: string;
  application_id: string;
  document_type: string;
  document_label: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
};

export type ApplicationAnswer = {
  id: string;
  application_id: string;
  question: string;
  question_type: string;
  answer: string;
};

// ============================ Константы ================================

export const DOC_TYPES: DocType[] = [
  "cv",
  "ktp",
  "diploma",
  "health_cert",
  "certificate",
  "other",
];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPT_ATTR = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";

// Локализованные названия типов документов (дефолтный label в конструкторе).
const DOC_LABELS: Record<Locale, Record<DocType, string>> = {
  en: {
    cv: "CV / Resume",
    ktp: "KTP (ID card)",
    diploma: "Diploma",
    health_cert: "Health certificate",
    certificate: "Certificate",
    other: "Other document",
  },
  id: {
    cv: "CV / Resume",
    ktp: "KTP",
    diploma: "Ijazah",
    health_cert: "Surat sehat",
    certificate: "Sertifikat",
    other: "Dokumen lain",
  },
  ru: {
    cv: "Резюме (CV)",
    ktp: "Удостоверение личности",
    diploma: "Диплом",
    health_cert: "Медсправка",
    certificate: "Сертификат",
    other: "Другой документ",
  },
  uz: {
    cv: "Rezyume (CV)",
    ktp: "Shaxsni tasdiqlovchi hujjat",
    diploma: "Diplom",
    health_cert: "Tibbiy maʼlumotnoma",
    certificate: "Sertifikat",
    other: "Boshqa hujjat",
  },
};

export function docTypeLabel(locale: Locale, type: DocType | string): string {
  const map = DOC_LABELS[locale] ?? DOC_LABELS.en;
  return map[type as DocType] ?? map.other;
}

// ============================ WhatsApp ================================

/**
 * Приводим индонезийский номер к международному формату +628xx.
 * Принимаем 08xx, 628xx, +628xx, с пробелами/дефисами.
 */
export function normalizeWhatsapp(raw: string): string {
  const trimmed = (raw ?? "").trim();
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return "+" + digits;
  if (digits.startsWith("0")) return "+62" + digits.slice(1);
  if (digits.startsWith("62")) return "+" + digits;
  if (digits.startsWith("8")) return "+62" + digits;
  return "+" + digits;
}

/** Ссылка wa.me/<цифры без плюса>. */
export function waLink(whatsapp: string): string {
  const digits = normalizeWhatsapp(whatsapp).replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/** Базовая валидация номера (после нормализации 10–15 цифр). */
export function isValidWhatsapp(raw: string): boolean {
  const digits = normalizeWhatsapp(raw).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

// ============================ Прочее ==================================

/** «2 hours ago» / «2 jam lalu» — компактное относительное время. */
export function timeAgo(iso: string, locale: Locale): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const L = {
    en: { now: "just now", m: (n: number) => `${n}m ago`, h: (n: number) => `${n}h ago`, d: (n: number) => `${n}d ago` },
    id: { now: "baru saja", m: (n: number) => `${n} mnt lalu`, h: (n: number) => `${n} jam lalu`, d: (n: number) => `${n} hari lalu` },
    ru: { now: "только что", m: (n: number) => `${n} мин назад`, h: (n: number) => `${n} ч назад`, d: (n: number) => `${n} дн назад` },
    uz: { now: "hozirgina", m: (n: number) => `${n} daq oldin`, h: (n: number) => `${n} soat oldin`, d: (n: number) => `${n} kun oldin` },
  }[locale];
  if (sec < 60) return L.now;
  if (min < 60) return L.m(min);
  if (hr < 24) return L.h(hr);
  return L.d(day);
}

/** Публичный адрес приложения (для apply-ссылок и QR). */
export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://doki.help").replace(/\/$/, "");
}
