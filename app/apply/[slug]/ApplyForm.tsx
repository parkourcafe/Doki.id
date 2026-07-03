"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  ACCEPT_ATTR,
  ACCEPTED_MIME,
  MAX_FILE_BYTES,
  isValidWhatsapp,
  PROFILE_FIELDS,
  profileFieldLabel,
  isUrlField,
  type RequiredDocument,
  type ScreeningQuestion,
  type Source,
  type CandidateProfile,
} from "@/lib/career";
import { ymGoal } from "@/lib/metrica";
import {
  submitApplication,
  precheckApplication,
  listVaultDocuments,
  attachVaultDoc,
  type VaultDoc,
} from "../actions";

const M = {
  en: {
    yourApplication: "Your application", aboutYou: "About you (optional)", fullName: "Full name", fullNamePh: "e.g. Budi Santoso",
    whatsapp: "WhatsApp number", whatsappPh: "08123456789", whatsappHint: "We'll send updates here.",
    email: "Email", emailOpt: "optional", documents: "Documents", required: "required", optional: "optional",
    choose: "📎 Choose file", replace: "Replace", fromVault: "📁 From my vault", pending: "Not uploaded",
    uploading: "Uploading…", uploaded: "Uploaded", errored: "Upload failed — try again",
    questions: "Questions", yes: "Yes", no: "No",
    consentTpl: (c: string) => `I agree to share my name, contact information, documents, and answers with ${c} for this vacancy only. I can request deletion anytime.`,
    submit: "Submit application", submitting: "Submitting…",
    errName: "Please enter your full name.", errWa: "Please enter a valid WhatsApp number.",
    errDoc: (l: string) => `Please upload: ${l}.`, errAns: "Please answer all questions.",
    errConsent: "Please agree to the consent to continue.", errFileType: "Only PDF, JPG or PNG files are allowed.",
    errFileSize: "File is too large (max 10MB).", errGeneric: "Something went wrong. Please try again.",
    errTurnstile: "Anti-spam check failed. Please try again.", errRate: "Too many submissions. Please try again later.",
    doneTitle: "Application submitted!", doneText: "You'll receive updates via WhatsApp.",
    statusLink: "Track your application status",
    dupTitle: "You already applied", dupText: "We found an application from this WhatsApp number for this vacancy.",
    ctaTitle: "Save your documents to a free Doki account", ctaText: "Next time you apply in one tap.",
    createAccount: "Create a free account",
    vaultPick: "Attach from vault", vaultEmpty: "No documents in your vault yet.", close: "Close", attaching: "Attaching…",
  },
  id: {
    yourApplication: "Lamaran Anda", aboutYou: "Tentang Anda (opsional)", fullName: "Nama lengkap", fullNamePh: "mis. Budi Santoso",
    whatsapp: "Nomor WhatsApp", whatsappPh: "08123456789", whatsappHint: "Kami kirim kabar ke sini.",
    email: "Email", emailOpt: "opsional", documents: "Dokumen", required: "wajib", optional: "opsional",
    choose: "📎 Pilih berkas", replace: "Ganti", fromVault: "📁 Dari brankas", pending: "Belum diunggah",
    uploading: "Mengunggah…", uploaded: "Terunggah", errored: "Gagal unggah — coba lagi",
    questions: "Pertanyaan", yes: "Ya", no: "Tidak",
    consentTpl: (c: string) => `Saya setuju membagikan nama, kontak, dokumen, dan jawaban saya kepada ${c} khusus untuk lowongan ini. Saya dapat meminta penghapusan kapan saja.`,
    submit: "Kirim lamaran", submitting: "Mengirim…",
    errName: "Silakan masukkan nama lengkap.", errWa: "Masukkan nomor WhatsApp yang valid.",
    errDoc: (l: string) => `Silakan unggah: ${l}.`, errAns: "Silakan jawab semua pertanyaan.",
    errConsent: "Setujui persetujuan untuk melanjutkan.", errFileType: "Hanya berkas PDF, JPG, atau PNG.",
    errFileSize: "Berkas terlalu besar (maks 10MB).", errGeneric: "Terjadi kesalahan. Coba lagi.",
    errTurnstile: "Pemeriksaan anti-spam gagal. Coba lagi.", errRate: "Terlalu banyak pengiriman. Coba lagi nanti.",
    doneTitle: "Lamaran terkirim!", doneText: "Anda akan menerima kabar via WhatsApp.",
    statusLink: "Lacak status lamaran Anda",
    dupTitle: "Anda sudah melamar", dupText: "Kami menemukan lamaran dari nomor WhatsApp ini untuk lowongan ini.",
    ctaTitle: "Simpan dokumen Anda ke akun Doki gratis", ctaText: "Lain kali melamar cukup satu ketukan.",
    createAccount: "Buat akun gratis",
    vaultPick: "Lampirkan dari brankas", vaultEmpty: "Belum ada dokumen di brankas Anda.", close: "Tutup", attaching: "Melampirkan…",
  },
  ru: {
    yourApplication: "Ваш отклик", aboutYou: "О себе (по желанию)", fullName: "Имя и фамилия", fullNamePh: "напр. Budi Santoso",
    whatsapp: "Номер WhatsApp", whatsappPh: "08123456789", whatsappHint: "Сюда пришлём обновления.",
    email: "Email", emailOpt: "необязательно", documents: "Документы", required: "обязательно", optional: "необязательно",
    choose: "📎 Выбрать файл", replace: "Заменить", fromVault: "📁 Из хранилища", pending: "Не загружен",
    uploading: "Загрузка…", uploaded: "Загружен", errored: "Ошибка загрузки — повторите",
    questions: "Вопросы", yes: "Да", no: "Нет",
    consentTpl: (c: string) => `Я согласен(на) поделиться именем, контактами, документами и ответами с ${c} только для этой вакансии. Я могу запросить удаление в любой момент.`,
    submit: "Отправить отклик", submitting: "Отправка…",
    errName: "Введите имя и фамилию.", errWa: "Введите корректный номер WhatsApp.",
    errDoc: (l: string) => `Загрузите: ${l}.`, errAns: "Ответьте на все вопросы.",
    errConsent: "Подтвердите согласие.", errFileType: "Только PDF, JPG или PNG.",
    errFileSize: "Файл слишком большой (макс. 10 МБ).", errGeneric: "Что-то пошло не так. Попробуйте ещё раз.",
    errTurnstile: "Проверка анти-спам не пройдена. Попробуйте ещё раз.", errRate: "Слишком много отправок. Попробуйте позже.",
    doneTitle: "Отклик отправлен!", doneText: "Обновления придут в WhatsApp.",
    statusLink: "Отслеживать статус отклика",
    dupTitle: "Вы уже откликались", dupText: "Мы нашли отклик с этого номера WhatsApp на эту вакансию.",
    ctaTitle: "Сохраните документы в бесплатный аккаунт Doki", ctaText: "В следующий раз отклик в один тап.",
    createAccount: "Создать бесплатный аккаунт",
    vaultPick: "Прикрепить из хранилища", vaultEmpty: "В вашем хранилище пока нет документов.", close: "Закрыть", attaching: "Прикрепляю…",
  },
  uz: {
    yourApplication: "Arizangiz", aboutYou: "O‘zingiz haqingizda (ixtiyoriy)", fullName: "To‘liq ism", fullNamePh: "mas. Budi Santoso",
    whatsapp: "WhatsApp raqami", whatsappPh: "08123456789", whatsappHint: "Yangiliklarni shu yerga yuboramiz.",
    email: "Email", emailOpt: "ixtiyoriy", documents: "Hujjatlar", required: "majburiy", optional: "ixtiyoriy",
    choose: "📎 Fayl tanlash", replace: "Almashtirish", fromVault: "📁 Xotiradan", pending: "Yuklanmagan",
    uploading: "Yuklanmoqda…", uploaded: "Yuklandi", errored: "Yuklashda xato — qayta urining",
    questions: "Savollar", yes: "Ha", no: "Yo‘q",
    consentTpl: (c: string) => `Ismim, kontaktlarim, hujjatlarim va javoblarimni faqat shu vakansiya uchun ${c} bilan ulashishga roziman. Istalgan vaqtda o‘chirishni so‘rashim mumkin.`,
    submit: "Arizani yuborish", submitting: "Yuborilmoqda…",
    errName: "To‘liq ismingizni kiriting.", errWa: "To‘g‘ri WhatsApp raqamini kiriting.",
    errDoc: (l: string) => `Yuklang: ${l}.`, errAns: "Barcha savollarga javob bering.",
    errConsent: "Davom etish uchun rozilikni tasdiqlang.", errFileType: "Faqat PDF, JPG yoki PNG.",
    errFileSize: "Fayl juda katta (maks 10MB).", errGeneric: "Xatolik yuz berdi. Qayta urining.",
    errTurnstile: "Anti-spam tekshiruvi o‘tmadi. Qayta urining.", errRate: "Juda ko‘p yuborildi. Keyinroq urining.",
    doneTitle: "Ariza yuborildi!", doneText: "Yangiliklarni WhatsApp orqali olasiz.",
    statusLink: "Ariza holatini kuzatish",
    dupTitle: "Siz allaqachon ariza berdingiz", dupText: "Bu vakansiyaga shu WhatsApp raqamdan ariza topildi.",
    ctaTitle: "Hujjatlaringizni bepul Doki akkauntiga saqlang", ctaText: "Keyingi safar bir tegishda ariza.",
    createAccount: "Bepul akkaunt yaratish",
    vaultPick: "Xotiradan biriktirish", vaultEmpty: "Xotirangizda hali hujjat yo‘q.", close: "Yopish", attaching: "Biriktirilmoqda…",
  },
} as const;

type UploadState = "pending" | "uploading" | "uploaded" | "error";
type Picked =
  | { kind: "file"; file: File }
  | { kind: "vault"; path: string; name: string; size: number };

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_") || "file";
}

function cleanProfile(p: CandidateProfile): CandidateProfile {
  const out: CandidateProfile = {};
  for (const k of Object.keys(p) as (keyof CandidateProfile)[]) {
    const v = (p[k] ?? "").trim();
    if (v) out[k] = v;
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TurnstileApi = any;

export default function ApplyForm({
  locale,
  vacancyId,
  slug,
  companyName,
  requiredDocuments,
  screeningQuestions,
  source,
  prefill,
  loggedIn,
  turnstileSiteKey,
}: {
  locale: Locale;
  vacancyId: string;
  slug: string;
  companyName: string;
  requiredDocuments: RequiredDocument[];
  screeningQuestions: ScreeningQuestion[];
  source: Source;
  prefill: { fullName: string; email: string } | null;
  loggedIn: boolean;
  turnstileSiteKey: string;
}) {
  const t = M[locale];
  const consentText = t.consentTpl(companyName);

  const [fullName, setFullName] = useState(prefill?.fullName ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [picked, setPicked] = useState<Record<number, Picked>>({});
  const [docStatus, setDocStatus] = useState<Record<number, UploadState>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [profile, setProfile] = useState<CandidateProfile>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneToken, setDoneToken] = useState<string | null>(null);
  const [duplicateToken, setDuplicateToken] = useState<string | null>(null);
  const startedRef = useRef(false);
  const appIdRef = useRef<string>(crypto.randomUUID());

  // ---- Turnstile (invisible) ----
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef<string | null>(null);
  const tsWidget = useRef<string | null>(null);

  useEffect(() => {
    ymGoal("apply_opened");
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    const w = window as unknown as { turnstile?: TurnstileApi };
    function render() {
      if (!w.turnstile || !tsRef.current || tsWidget.current) return;
      tsWidget.current = w.turnstile.render(tsRef.current, {
        sitekey: turnstileSiteKey,
        size: "invisible",
        callback: (token: string) => {
          tsToken.current = token;
        },
      });
      try {
        w.turnstile.execute(tsWidget.current);
      } catch {
        /* invisible выполняется автоматически — ок */
      }
    }
    if (w.turnstile) {
      render();
      return;
    }
    const id = "cf-turnstile-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if ((window as unknown as { turnstile?: TurnstileApi }).turnstile) {
          clearInterval(iv);
          render();
        }
      }, 200);
      return () => clearInterval(iv);
    }
  }, [turnstileSiteKey]);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      ymGoal("form_started");
    }
  }

  function pickFile(i: number, file: File | null) {
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type)) return setError(t.errFileType);
    if (file.size > MAX_FILE_BYTES) return setError(t.errFileSize);
    setError(null);
    markStarted();
    setPicked((p) => ({ ...p, [i]: { kind: "file", file } }));
    setDocStatus((p) => ({ ...p, [i]: "pending" }));
  }

  // ---- Vault picker ----
  const [vaultFor, setVaultFor] = useState<number | null>(null);
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[] | null>(null);
  const [attaching, setAttaching] = useState(false);

  async function openVault(i: number) {
    setVaultFor(i);
    if (vaultDocs === null) setVaultDocs(await listVaultDocuments());
  }

  async function attach(i: number, vd: VaultDoc) {
    setAttaching(true);
    const doc = requiredDocuments[i];
    const res = await attachVaultDoc({
      vacancyId,
      applicationId: appIdRef.current,
      docType: doc.type,
      storagePath: vd.storagePath,
      fileName: vd.fileName,
      mimeType: vd.mimeType,
    });
    setAttaching(false);
    if (res.ok && res.path) {
      markStarted();
      setPicked((p) => ({ ...p, [i]: { kind: "vault", path: res.path!, name: res.name!, size: res.size ?? 0 } }));
      setDocStatus((p) => ({ ...p, [i]: "uploaded" }));
      setVaultFor(null);
    } else {
      setError(t.errGeneric);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError(t.errName);
    if (!isValidWhatsapp(whatsapp)) return setError(t.errWa);
    for (let i = 0; i < requiredDocuments.length; i++) {
      if (requiredDocuments[i].required && !picked[i]) return setError(t.errDoc(requiredDocuments[i].label));
    }
    for (let i = 0; i < screeningQuestions.length; i++) {
      if (!(answers[i] ?? "").trim()) return setError(t.errAns);
    }
    if (!consent) return setError(t.errConsent);

    setBusy(true);
    try {
      // 1) Precheck: дубликат / лимит — до загрузки файлов.
      const pre = await precheckApplication({ slug, whatsapp });
      if (pre.rateLimited) { setBusy(false); return setError(t.errRate); }
      if (pre.duplicate && pre.accessToken) { setBusy(false); return setDuplicateToken(pre.accessToken); }

      // 2) Turnstile token (invisible).
      let token = tsToken.current;
      if (turnstileSiteKey && !token) {
        const w = window as unknown as { turnstile?: TurnstileApi };
        try { if (w.turnstile && tsWidget.current) w.turnstile.execute(tsWidget.current); } catch { /* noop */ }
        await new Promise((r) => setTimeout(r, 1200));
        token = tsToken.current;
      }

      // 3) Загрузка файлов (vault-вложения уже в bucket).
      const supabase = getSupabaseBrowser();
      const uploaded: { type: string; label: string; path: string; name: string; size: number }[] = [];
      let firedDocEvent = false;
      for (let i = 0; i < requiredDocuments.length; i++) {
        const p = picked[i];
        if (!p) continue;
        const doc = requiredDocuments[i];
        if (p.kind === "vault") {
          uploaded.push({ type: doc.type, label: doc.label, path: p.path, name: p.name, size: p.size });
          continue;
        }
        setDocStatus((s) => ({ ...s, [i]: "uploading" }));
        const path = `${vacancyId}/${appIdRef.current}/${doc.type}_${Date.now()}-${safeName(p.file.name)}`;
        const { error: upErr } = await supabase.storage.from("applications").upload(path, p.file, {
          contentType: p.file.type || "application/octet-stream",
          upsert: false,
        });
        if (upErr) { setDocStatus((s) => ({ ...s, [i]: "error" })); throw new Error(upErr.message); }
        setDocStatus((s) => ({ ...s, [i]: "uploaded" }));
        if (!firedDocEvent) { ymGoal("doc_uploaded"); firedDocEvent = true; }
        uploaded.push({ type: doc.type, label: doc.label, path, name: p.file.name, size: p.file.size });
      }

      const answerPayload = screeningQuestions.map((q, i) => ({
        question: q.question, type: q.type, answer: (answers[i] ?? "").trim(),
      }));
      const requiredTotal = requiredDocuments.filter((d) => d.required).length;
      const requiredDone = requiredDocuments.filter((d, i) => d.required && picked[i]).length;

      const res = await submitApplication({
        applicationId: appIdRef.current,
        slug,
        fullName: fullName.trim(),
        whatsapp,
        email: email.trim() || undefined,
        consentText,
        source,
        turnstileToken: token,
        answers: answerPayload,
        documents: uploaded,
        profile: cleanProfile(profile),
        docsComplete: requiredDone,
        docsTotal: requiredTotal,
      });

      if (!res.ok) {
        setBusy(false);
        if (res.error === "turnstile") return setError(t.errTurnstile);
        if (res.error === "rate_limited") return setError(t.errRate);
        return setError(t.errGeneric);
      }
      if (res.duplicate) { setBusy(false); return setDuplicateToken(res.accessToken); }
      ymGoal("apply_submitted");
      setDoneToken(res.accessToken);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setError(m || t.errGeneric);
      setBusy(false);
    }
  }

  // ---- Screens ----
  if (duplicateToken) {
    return (
      <div className="card text-center">
        <div className="mb-2 text-4xl">✋</div>
        <h2 className="text-lg font-semibold">{t.dupTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.dupText}</p>
        <Link href={`/applications/status/${duplicateToken}`} className="btn-primary mt-4 w-full">
          {t.statusLink}
        </Link>
      </div>
    );
  }

  if (doneToken) {
    return (
      <div className="card text-center">
        <div className="mb-2 text-4xl">✅</div>
        <h2 className="text-lg font-semibold">{t.doneTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.doneText}</p>
        <Link href={`/applications/status/${doneToken}`} className="btn-primary mt-4 w-full">
          {t.statusLink}
        </Link>
        {!loggedIn && (
          <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-left">
            <p className="text-sm font-medium text-brand-700">{t.ctaTitle}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t.ctaText}</p>
            <Link
              href={`/login?next=${encodeURIComponent(`/apply/claim/${doneToken}`)}`}
              className="btn-ghost mt-2 w-full"
            >
              {t.createAccount}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h2 className="text-base font-semibold">{t.yourApplication}</h2>

      <div>
        <label className="label">{t.fullName} *</label>
        <input className="input" value={fullName} onChange={(e) => { markStarted(); setFullName(e.target.value); }}
          placeholder={t.fullNamePh} autoComplete="name" />
      </div>

      <div>
        <label className="label">{t.whatsapp} *</label>
        <input className="input" value={whatsapp} onChange={(e) => { markStarted(); setWhatsapp(e.target.value); }}
          placeholder={t.whatsappPh} inputMode="tel" autoComplete="tel" />
        <p className="mt-1 text-xs text-slate-400">{t.whatsappHint}</p>
      </div>

      <div>
        <label className="label">{t.email} <span className="font-normal text-slate-400">({t.emailOpt})</span></label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>

      {requiredDocuments.length > 0 && (
        <div>
          <p className="label">{t.documents}</p>
          <ul className="space-y-2">
            {requiredDocuments.map((doc, i) => {
              const st = docStatus[i] ?? "pending";
              const chosen = picked[i];
              const chosenName = chosen ? (chosen.kind === "file" ? chosen.file.name : chosen.name) : null;
              return (
                <li key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.label}</p>
                      <p className="text-xs text-slate-400">{doc.required ? t.required : t.optional}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <label className="btn-ghost cursor-pointer">
                        {chosen ? t.replace : t.choose}
                        <input type="file" accept={ACCEPT_ATTR} className="hidden"
                          onChange={(e) => pickFile(i, e.target.files?.[0] ?? null)} />
                      </label>
                      {loggedIn && (
                        <button type="button" className="btn-ghost" onClick={() => openVault(i)}>
                          {t.fromVault}
                        </button>
                      )}
                    </div>
                  </div>
                  {chosenName && (
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <span className="truncate text-slate-500">{chosenName}</span>
                      <span className={
                        st === "uploaded" ? "text-green-600" : st === "error" ? "text-red-600"
                          : st === "uploading" ? "text-brand-600" : "text-slate-400"}>
                        {st === "uploaded" ? `✓ ${t.uploaded}` : st === "error" ? t.errored
                          : st === "uploading" ? t.uploading : t.pending}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {screeningQuestions.length > 0 && (
        <div className="space-y-3">
          <p className="label">{t.questions}</p>
          {screeningQuestions.map((q, i) => (
            <div key={i}>
              <label className="mb-1 block text-sm text-slate-700">{q.question} *</label>
              {q.type === "yes_no" ? (
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((val) => (
                    <button key={val} type="button"
                      onClick={() => { markStarted(); setAnswers((p) => ({ ...p, [i]: val })); }}
                      className={(answers[i] === val ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-white text-slate-700") +
                        " min-h-[44px] flex-1 rounded-lg border px-3 text-sm font-medium sm:min-h-0 sm:py-2"}>
                      {val === "yes" ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              ) : (
                <input className="input" value={answers[i] ?? ""}
                  onChange={(e) => { markStarted(); setAnswers((p) => ({ ...p, [i]: e.target.value })); }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* About you (all optional) */}
      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">{t.aboutYou}</summary>
        <div className="mt-3 space-y-3">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-slate-500">{profileFieldLabel(locale, f.key)}</label>
              {f.kind === "textarea" ? (
                <textarea
                  rows={2}
                  className="input"
                  value={profile[f.key] ?? ""}
                  onChange={(e) => { markStarted(); setProfile((p) => ({ ...p, [f.key]: e.target.value })); }}
                />
              ) : (
                <input
                  className="input"
                  type={isUrlField(f.key) ? "url" : "text"}
                  inputMode={isUrlField(f.key) ? "url" : undefined}
                  placeholder={isUrlField(f.key) ? "https://…" : undefined}
                  value={profile[f.key] ?? ""}
                  onChange={(e) => { markStarted(); setProfile((p) => ({ ...p, [f.key]: e.target.value })); }}
                />
              )}
            </div>
          ))}
        </div>
      </details>

      <label className="flex items-start gap-2 rounded-lg bg-brand-50/50 p-3 text-sm text-slate-700">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{consentText}</span>
      </label>

      {/* Invisible Turnstile mount point */}
      <div ref={tsRef} />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? t.submitting : t.submit}
      </button>

      {/* Vault picker */}
      {vaultFor !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setVaultFor(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{t.vaultPick}</p>
              <button type="button" className="text-sm text-slate-500" onClick={() => setVaultFor(null)}>{t.close}</button>
            </div>
            {vaultDocs === null ? (
              <p className="py-6 text-center text-sm text-slate-400">…</p>
            ) : vaultDocs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">{t.vaultEmpty}</p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-auto">
                {vaultDocs.map((vd) => (
                  <li key={vd.fileId}>
                    <button type="button" disabled={attaching} onClick={() => attach(vaultFor, vd)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                      <span className="truncate">{vd.title}</span>
                      <span className="ml-2 shrink-0 text-xs text-brand-600">{attaching ? t.attaching : "+"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
