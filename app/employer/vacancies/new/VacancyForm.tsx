"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import {
  DOC_TYPES,
  docTypeLabel,
  type DocType,
  type RequiredDocument,
  type ScreeningQuestion,
} from "@/lib/career";
import { QUESTION_CATEGORIES, type QuestionTemplate } from "@/lib/questionTemplates";
import { REQUIRED_DOCS, OPTIONAL_DOCS, type DocumentTemplate } from "@/lib/documentTemplates";
import { createVacancy } from "@/app/employer/actions";

const M = {
  en: {
    title: "New vacancy",
    jobTitle: "Job title",
    jobTitlePh: "e.g. Barista",
    company: "Company name",
    location: "Location",
    locationPh: "e.g. Canggu, Bali",
    salary: "Salary range",
    salaryPh: "e.g. 3-4M IDR / month",
    schedule: "Schedule",
    schedulePh: "e.g. Full-time, shifts",
    description: "Description",
    urgency: "Urgency",
    normal: "Normal",
    hiringNow: "Hiring now",
    closesAt: "Closes on",
    optional: "optional",
    docs: "Required documents",
    docsHint: "Documents the candidate must upload.",
    addDoc: "+ Add document",
    fromDocLibrary: "Choose from library",
    hideDocLibrary: "Hide library",
    docLibHint: "Common documents — tap to add, then toggle Required if needed.",
    grpRequired: "Often required",
    grpOptional: "Optional",
    docType: "Type",
    docLabel: "Label",
    reqd: "Required",
    remove: "Remove",
    questions: "Screening questions",
    questionsHint: "Questions candidates answer when applying.",
    addQuestion: "+ Add question",
    fromLibrary: "Choose from library",
    hideLibrary: "Hide library",
    libraryHint: "Ready-made questions — tap to add, then edit if needed.",
    added: "Added",
    question: "Question",
    qText: "Text answer",
    qYesNo: "Yes / No",
    create: "Create vacancy",
    creating: "Creating…",
    errTitle: "Please enter a job title.",
    errCompany: "Please enter a company name.",
    errLocation: "Please enter a location.",
    errGeneric: "Could not create the vacancy. Please try again.",
  },
  id: {
    title: "Lowongan baru",
    jobTitle: "Nama posisi",
    jobTitlePh: "mis. Barista",
    company: "Nama perusahaan",
    location: "Lokasi",
    locationPh: "mis. Canggu, Bali",
    salary: "Kisaran gaji",
    salaryPh: "mis. 3-4jt IDR / bulan",
    schedule: "Jadwal",
    schedulePh: "mis. Penuh waktu, shift",
    description: "Deskripsi",
    urgency: "Urgensi",
    normal: "Normal",
    hiringNow: "Butuh cepat",
    closesAt: "Ditutup pada",
    optional: "opsional",
    docs: "Dokumen wajib",
    docsHint: "Dokumen yang harus diunggah kandidat.",
    addDoc: "+ Tambah dokumen",
    fromDocLibrary: "Pilih dari pustaka",
    hideDocLibrary: "Sembunyikan pustaka",
    docLibHint: "Dokumen umum — ketuk untuk menambah, lalu atur Wajib bila perlu.",
    grpRequired: "Sering wajib",
    grpOptional: "Opsional",
    docType: "Jenis",
    docLabel: "Label",
    reqd: "Wajib",
    remove: "Hapus",
    questions: "Pertanyaan seleksi",
    questionsHint: "Pertanyaan yang dijawab kandidat saat melamar.",
    addQuestion: "+ Tambah pertanyaan",
    fromLibrary: "Pilih dari pustaka",
    hideLibrary: "Sembunyikan pustaka",
    libraryHint: "Pertanyaan siap pakai — ketuk untuk menambah, lalu ubah bila perlu.",
    added: "Ditambahkan",
    question: "Pertanyaan",
    qText: "Jawaban teks",
    qYesNo: "Ya / Tidak",
    create: "Buat lowongan",
    creating: "Membuat…",
    errTitle: "Masukkan nama posisi.",
    errCompany: "Masukkan nama perusahaan.",
    errLocation: "Masukkan lokasi.",
    errGeneric: "Gagal membuat lowongan. Coba lagi.",
  },
  ru: {
    title: "Новая вакансия",
    jobTitle: "Должность",
    jobTitlePh: "напр. Бариста",
    company: "Название компании",
    location: "Локация",
    locationPh: "напр. Canggu, Bali",
    salary: "Зарплата",
    salaryPh: "напр. 3-4M IDR / мес",
    schedule: "График",
    schedulePh: "напр. Полный день, смены",
    description: "Описание",
    urgency: "Срочность",
    normal: "Обычная",
    hiringNow: "Срочный набор",
    closesAt: "Закрыть",
    optional: "необязательно",
    docs: "Обязательные документы",
    docsHint: "Документы, которые кандидат должен загрузить.",
    addDoc: "+ Добавить документ",
    fromDocLibrary: "Выбрать из библиотеки",
    hideDocLibrary: "Скрыть библиотеку",
    docLibHint: "Частые документы — нажмите, чтобы добавить, потом можно менять обязательность.",
    grpRequired: "Обычно обязательные",
    grpOptional: "По желанию",
    docType: "Тип",
    docLabel: "Название",
    reqd: "Обязательно",
    remove: "Удалить",
    questions: "Вопросы скрининга",
    questionsHint: "Вопросы, на которые отвечает кандидат.",
    addQuestion: "+ Добавить вопрос",
    fromLibrary: "Выбрать из библиотеки",
    hideLibrary: "Скрыть библиотеку",
    libraryHint: "Готовые вопросы — нажмите, чтобы добавить, потом можно отредактировать.",
    added: "Добавлен",
    question: "Вопрос",
    qText: "Текстовый ответ",
    qYesNo: "Да / Нет",
    create: "Создать вакансию",
    creating: "Создание…",
    errTitle: "Введите должность.",
    errCompany: "Введите название компании.",
    errLocation: "Введите локацию.",
    errGeneric: "Не удалось создать вакансию. Попробуйте ещё раз.",
  },
  uz: {
    title: "Yangi vakansiya",
    jobTitle: "Lavozim",
    jobTitlePh: "mas. Barista",
    company: "Kompaniya nomi",
    location: "Manzil",
    locationPh: "mas. Canggu, Bali",
    salary: "Maosh oralig‘i",
    salaryPh: "mas. 3-4M IDR / oy",
    schedule: "Jadval",
    schedulePh: "mas. To‘liq kun, smenalar",
    description: "Tavsif",
    urgency: "Shoshilinchlik",
    normal: "Oddiy",
    hiringNow: "Shoshilinch",
    closesAt: "Yopilish sanasi",
    optional: "ixtiyoriy",
    docs: "Majburiy hujjatlar",
    docsHint: "Nomzod yuklashi shart bo‘lgan hujjatlar.",
    addDoc: "+ Hujjat qo‘shish",
    fromDocLibrary: "Kutubxonadan tanlash",
    hideDocLibrary: "Kutubxonani yashirish",
    docLibHint: "Keng tarqalgan hujjatlar — qo‘shish uchun bosing, keyin majburiyligini o‘zgartiring.",
    grpRequired: "Ko‘pincha majburiy",
    grpOptional: "Ixtiyoriy",
    docType: "Turi",
    docLabel: "Nomi",
    reqd: "Majburiy",
    remove: "O‘chirish",
    questions: "Saralash savollari",
    questionsHint: "Nomzod ariza berishda javob beradigan savollar.",
    addQuestion: "+ Savol qo‘shish",
    fromLibrary: "Kutubxonadan tanlash",
    hideLibrary: "Kutubxonani yashirish",
    libraryHint: "Tayyor savollar — qo‘shish uchun bosing, keyin tahrirlash mumkin.",
    added: "Qo‘shildi",
    question: "Savol",
    qText: "Matnli javob",
    qYesNo: "Ha / Yo‘q",
    create: "Vakansiya yaratish",
    creating: "Yaratilmoqda…",
    errTitle: "Lavozimni kiriting.",
    errCompany: "Kompaniya nomini kiriting.",
    errLocation: "Manzilni kiriting.",
    errGeneric: "Vakansiya yaratilmadi. Qayta urining.",
  },
} as const;

export default function VacancyForm({
  locale,
  defaultCompany,
}: {
  locale: Locale;
  defaultCompany: string;
}) {
  const t = M[locale];
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(defaultCompany);
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [schedule, setSchedule] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "hiring_now">("normal");
  const [closesAt, setClosesAt] = useState("");
  const [docs, setDocs] = useState<RequiredDocument[]>([
    { type: "cv", label: docTypeLabel(locale, "cv"), required: true },
  ]);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showDocLibrary, setShowDocLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addDoc() {
    setDocs((p) => [...p, { type: "other", label: docTypeLabel(locale, "other"), required: false }]);
  }
  function updateDoc(i: number, patch: Partial<RequiredDocument>) {
    setDocs((p) => p.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function removeDoc(i: number) {
    setDocs((p) => p.filter((_, idx) => idx !== i));
  }
  function addDocTemplate(tpl: DocumentTemplate) {
    setDocs((p) =>
      p.some((d) => d.type === tpl.type)
        ? p
        : [...p, { type: tpl.type, label: docTypeLabel(locale, tpl.type), required: tpl.required }],
    );
  }

  function addQuestion() {
    setQuestions((p) => [...p, { question: "", type: "text" }]);
  }
  function updateQuestion(i: number, patch: Partial<ScreeningQuestion>) {
    setQuestions((p) => p.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function removeQuestion(i: number) {
    setQuestions((p) => p.filter((_, idx) => idx !== i));
  }
  function addTemplate(tpl: QuestionTemplate) {
    const text = tpl.q[locale];
    setQuestions((p) =>
      p.some((q) => q.question === text) ? p : [...p, { question: text, type: tpl.type }],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError(t.errTitle);
    if (!company.trim()) return setError(t.errCompany);
    if (!location.trim()) return setError(t.errLocation);

    setBusy(true);
    try {
      const cleanDocs = docs
        .map((d) => ({
          type: d.type,
          label: (d.label || docTypeLabel(locale, d.type)).trim(),
          required: d.required,
        }))
        .filter((d) => d.label);
      const cleanQuestions = questions
        .map((q) => ({ question: q.question.trim(), type: q.type }))
        .filter((q) => q.question);

      const { id } = await createVacancy({
        title: title.trim(),
        company_name: company.trim(),
        location: location.trim(),
        salary_range: salary.trim() || undefined,
        schedule: schedule.trim() || undefined,
        description: description.trim() || undefined,
        urgency,
        closes_at: closesAt || null,
        required_documents: cleanDocs,
        screening_questions: cleanQuestions,
      });
      router.push(`/employer/vacancies/${id}?created=1`);
    } catch {
      setError(t.errGeneric);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      <div className="card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">{t.jobTitle} *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.jobTitlePh} />
        </div>
        <div>
          <label className="label">{t.company} *</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="label">{t.location} *</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.locationPh} />
        </div>
        <div>
          <label className="label">
            {t.salary} <span className="font-normal text-slate-400">({t.optional})</span>
          </label>
          <input className="input" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder={t.salaryPh} />
        </div>
        <div>
          <label className="label">
            {t.schedule} <span className="font-normal text-slate-400">({t.optional})</span>
          </label>
          <input className="input" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder={t.schedulePh} />
        </div>
        <div>
          <label className="label">{t.urgency}</label>
          <select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value as "normal" | "hiring_now")}>
            <option value="normal">{t.normal}</option>
            <option value="hiring_now">{t.hiringNow}</option>
          </select>
        </div>
        <div>
          <label className="label">
            {t.closesAt} <span className="font-normal text-slate-400">({t.optional})</span>
          </label>
          <input type="date" className="input" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">
            {t.description} <span className="font-normal text-slate-400">({t.optional})</span>
          </label>
          <textarea rows={4} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Required documents */}
      <div className="card space-y-3">
        <div>
          <p className="label">{t.docs}</p>
          <p className="text-xs text-slate-500">{t.docsHint}</p>
        </div>
        {docs.map((d, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.docType}</label>
                <select
                  className="input"
                  value={d.type}
                  onChange={(e) => {
                    const newType = e.target.value as DocType;
                    // Обновляем подпись, если пользователь её не менял вручную.
                    const wasDefault = d.label === docTypeLabel(locale, d.type);
                    updateDoc(i, {
                      type: newType,
                      ...(wasDefault ? { label: docTypeLabel(locale, newType) } : {}),
                    });
                  }}
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {docTypeLabel(locale, dt)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.docLabel}</label>
                <input className="input" value={d.label} onChange={(e) => updateDoc(i, { label: e.target.value })} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={d.required}
                  onChange={(e) => updateDoc(i, { required: e.target.checked })}
                  className="h-4 w-4"
                />
                {t.reqd}
              </label>
              <button type="button" onClick={() => removeDoc(i)} className="text-xs text-red-500 hover:underline">
                {t.remove}
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addDoc} className="btn-ghost">
            {t.addDoc}
          </button>
          <button type="button" onClick={() => setShowDocLibrary((v) => !v)} className="btn-ghost">
            {showDocLibrary ? t.hideDocLibrary : t.fromDocLibrary}
          </button>
        </div>

        {showDocLibrary && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t.docLibHint}</p>
            {[
              { title: t.grpRequired, items: REQUIRED_DOCS },
              { title: t.grpOptional, items: OPTIONAL_DOCS },
            ].map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((tpl) => {
                    const already = docs.some((d) => d.type === tpl.type);
                    return (
                      <button
                        key={tpl.type}
                        type="button"
                        disabled={already}
                        onClick={() => addDocTemplate(tpl)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-default disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white"
                      >
                        {already && <span className="text-green-600">✓</span>}
                        {docTypeLabel(locale, tpl.type)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screening questions */}
      <div className="card space-y-3">
        <div>
          <p className="label">{t.questions}</p>
          <p className="text-xs text-slate-500">{t.questionsHint}</p>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.question}</label>
                <input className="input" value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">&nbsp;</label>
                <select
                  className="input"
                  value={q.type}
                  onChange={(e) => updateQuestion(i, { type: e.target.value as "text" | "yes_no" })}
                >
                  <option value="text">{t.qText}</option>
                  <option value="yes_no">{t.qYesNo}</option>
                </select>
              </div>
            </div>
            <div className="mt-2 text-right">
              <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-500 hover:underline">
                {t.remove}
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addQuestion} className="btn-ghost">
            {t.addQuestion}
          </button>
          <button type="button" onClick={() => setShowLibrary((v) => !v)} className="btn-ghost">
            {showLibrary ? t.hideLibrary : t.fromLibrary}
          </button>
        </div>

        {showLibrary && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t.libraryHint}</p>
            {QUESTION_CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {cat.label[locale]}
                </p>
                <div className="space-y-1.5">
                  {cat.questions.map((tpl) => {
                    const text = tpl.q[locale];
                    const already = questions.some((q) => q.question === text);
                    return (
                      <button
                        key={text}
                        type="button"
                        disabled={already}
                        onClick={() => addTemplate(tpl)}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-default disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white"
                      >
                        <span className="text-slate-700">
                          {already && <span className="mr-1 text-green-600">✓</span>}
                          {text}
                        </span>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                          {already ? t.added : tpl.type === "yes_no" ? t.qYesNo : t.qText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? t.creating : t.create}
      </button>
    </form>
  );
}
