"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  timeAgo,
  waLink,
  normalizeWhatsapp,
  sourceLabel,
  type ApplicationStatus,
  type RequiredDocument,
  type Source,
} from "@/lib/career";
import { setApplicationStatus, signApplicationDoc } from "@/app/employer/actions";

export type BoardDoc = { type: string; label: string; file_name: string; path: string };
export type BoardAnswer = { question: string; answer: string; type: string };
export type BoardApp = {
  id: string;
  full_name: string;
  whatsapp: string;
  email: string | null;
  status: ApplicationStatus;
  source: Source;
  created_at: string;
  documents: BoardDoc[];
  answers: BoardAnswer[];
};

type Filter = "all" | "new" | "complete" | "missing";

const M = {
  en: {
    total: "Total", new: "New", shortlisted: "Shortlisted", rejected: "Rejected",
    fAll: "All", fNew: "New", fComplete: "All docs complete", fMissing: "Missing docs",
    empty: "No applications match this filter yet.",
    shortlist: "Shortlist", reject: "Reject", whatsapp: "WhatsApp", requestDoc: "Request doc",
    stNew: "New", stViewed: "Viewed", stShortlisted: "Shortlisted", stRejected: "Rejected",
    funnel: (opens: number, apps: number, pct: string) => `Link opens: ${opens} → Applications: ${apps} (${pct}%)`,
    pickDocTitle: "Which document to request?", close: "Close",
    reqMsg: (name: string, title: string, company: string, doc: string) =>
      `Hello ${name}! Your application for ${title} at ${company} is missing: ${doc}. Please send it here to complete your application.`,
  },
  id: {
    total: "Total", new: "Baru", shortlisted: "Terpilih", rejected: "Ditolak",
    fAll: "Semua", fNew: "Baru", fComplete: "Dokumen lengkap", fMissing: "Dokumen kurang",
    empty: "Belum ada lamaran yang cocok dengan filter ini.",
    shortlist: "Pilih", reject: "Tolak", whatsapp: "WhatsApp", requestDoc: "Minta dokumen",
    stNew: "Baru", stViewed: "Dilihat", stShortlisted: "Terpilih", stRejected: "Ditolak",
    funnel: (opens: number, apps: number, pct: string) => `Kunjungan tautan: ${opens} → Lamaran: ${apps} (${pct}%)`,
    pickDocTitle: "Dokumen mana yang diminta?", close: "Tutup",
    reqMsg: (name: string, title: string, company: string, doc: string) =>
      `Halo ${name}! Lamaran Anda untuk ${title} di ${company} belum lengkap: ${doc}. Silakan kirim dokumen tersebut di sini.`,
  },
  ru: {
    total: "Всего", new: "Новые", shortlisted: "Отобраны", rejected: "Отклонены",
    fAll: "Все", fNew: "Новые", fComplete: "Все документы", fMissing: "Не хватает",
    empty: "Пока нет откликов под этот фильтр.",
    shortlist: "В шортлист", reject: "Отклонить", whatsapp: "WhatsApp", requestDoc: "Запросить док.",
    stNew: "Новый", stViewed: "Просмотрен", stShortlisted: "Отобран", stRejected: "Отклонён",
    funnel: (opens: number, apps: number, pct: string) => `Переходы: ${opens} → Отклики: ${apps} (${pct}%)`,
    pickDocTitle: "Какой документ запросить?", close: "Закрыть",
    reqMsg: (name: string, title: string, company: string, doc: string) =>
      `Здравствуйте, ${name}! В вашем отклике на «${title}» в ${company} не хватает: ${doc}. Пришлите его сюда, чтобы завершить заявку.`,
  },
  uz: {
    total: "Jami", new: "Yangi", shortlisted: "Tanlangan", rejected: "Rad etilgan",
    fAll: "Barchasi", fNew: "Yangi", fComplete: "Hujjatlar to‘liq", fMissing: "Hujjat yetishmaydi",
    empty: "Bu filtrga mos ariza yo‘q.",
    shortlist: "Tanlash", reject: "Rad etish", whatsapp: "WhatsApp", requestDoc: "Hujjat so‘rash",
    stNew: "Yangi", stViewed: "Ko‘rilgan", stShortlisted: "Tanlangan", stRejected: "Rad etilgan",
    funnel: (opens: number, apps: number, pct: string) => `Havola ochilishi: ${opens} → Arizalar: ${apps} (${pct}%)`,
    pickDocTitle: "Qaysi hujjat so‘ralsin?", close: "Yopish",
    reqMsg: (name: string, title: string, company: string, doc: string) =>
      `Salom, ${name}! ${company}dagi ${title} uchun arizangizda yetishmaydi: ${doc}. Iltimos, uni shu yerga yuboring.`,
  },
} as const;

function StatusBadge({ status, t }: { status: ApplicationStatus; t: (typeof M)[Locale] }) {
  const map: Record<ApplicationStatus, { label: string; cls: string }> = {
    new: { label: t.stNew, cls: "bg-blue-100 text-blue-700" },
    viewed: { label: t.stViewed, cls: "bg-slate-100 text-slate-600" },
    shortlisted: { label: t.stShortlisted, cls: "bg-green-100 text-green-700" },
    rejected: { label: t.stRejected, cls: "bg-red-100 text-red-700" },
  };
  const s = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

async function openDoc(path: string) {
  const w = window.open("", "_blank");
  const url = await signApplicationDoc(path);
  if (url && w) w.location.href = url;
  else if (w) w.close();
}

export default function ApplicationsBoard({
  locale,
  vacancyId,
  vacancyTitle,
  companyName,
  viewsCount,
  requiredDocs,
  initialApplications,
}: {
  locale: Locale;
  vacancyId: string;
  vacancyTitle: string;
  companyName: string;
  viewsCount: number;
  requiredDocs: RequiredDocument[];
  initialApplications: BoardApp[];
}) {
  const t = M[locale];
  const [apps, setApps] = useState<BoardApp[]>(initialApplications);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [reqDocFor, setReqDocFor] = useState<BoardApp | null>(null);

  const requiredOnly = requiredDocs.filter((d) => d.required);
  const hasType = (app: BoardApp, type: string) => app.documents.some((d) => d.type === type);
  const isComplete = (app: BoardApp) => requiredOnly.every((d) => hasType(app, d.type));
  const missingDocs = (app: BoardApp) => requiredOnly.filter((d) => !hasType(app, d.type));

  const stats = useMemo(() => {
    let nw = 0, sl = 0, rj = 0;
    for (const a of apps) {
      if (a.status === "shortlisted") sl++;
      else if (a.status === "rejected") rj++;
      else nw++;
    }
    return { total: apps.length, nw, sl, rj };
  }, [apps]);

  const bySource = useMemo(() => {
    const c: Record<string, number> = { wa: 0, ig: 0, qr: 0, direct: 0, other: 0 };
    for (const a of apps) c[a.source] = (c[a.source] ?? 0) + 1;
    return c;
  }, [apps]);

  const conversion =
    viewsCount > 0 ? ((apps.length / viewsCount) * 100).toFixed(1) : "0.0";

  const filtered = useMemo(() => {
    switch (filter) {
      case "new": return apps.filter((a) => a.status === "new" || a.status === "viewed");
      case "complete": return apps.filter((a) => isComplete(a));
      case "missing": return apps.filter((a) => !isComplete(a));
      default: return apps;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, filter]);

  async function changeStatus(id: string, status: ApplicationStatus) {
    const prev = apps;
    setApps((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await setApplicationStatus(id, vacancyId, status);
    } catch {
      setApps(prev);
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  function requestDocFor(app: BoardApp, docLabel: string) {
    const msg = t.reqMsg(app.full_name, vacancyTitle, companyName, docLabel);
    const digits = normalizeWhatsapp(app.whatsapp).replace(/\D/g, "");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function onRequestDoc(app: BoardApp) {
    const missing = missingDocs(app);
    if (missing.length === 0) return;
    if (missing.length === 1) requestDocFor(app, missing[0].label);
    else setReqDocFor(app);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t.fAll },
    { key: "new", label: t.fNew },
    { key: "complete", label: t.fComplete },
    { key: "missing", label: t.fMissing },
  ];

  const sourceChips: { key: Source; n: number }[] = [
    { key: "wa", n: bySource.wa },
    { key: "ig", n: bySource.ig },
    { key: "qr", n: bySource.qr },
    { key: "direct", n: bySource.direct },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          { label: t.total, value: stats.total },
          { label: t.new, value: stats.nw },
          { label: t.shortlisted, value: stats.sl },
          { label: t.rejected, value: stats.rj },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-[#e8e0d5] bg-[#fdfaf5] p-3 text-center">
            <div className="text-xl font-semibold">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel + source breakdown */}
      <div className="mb-4 rounded-lg border border-[#e8e0d5] bg-white p-3">
        <p className="text-sm text-slate-700">{t.funnel(viewsCount, apps.length, conversion)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sourceChips.map((c) => (
            <span key={c.key} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {sourceLabel(c.key)} {c.n}
            </span>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={(filter === f.key ? "bg-brand-500 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100") +
              " min-h-[36px] rounded-lg px-3 text-sm font-medium"}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const missing = missingDocs(a);
            return (
              <li key={a.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{a.full_name}</p>
                    <p className="text-xs text-slate-400">{timeAgo(a.created_at, locale)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {sourceLabel(a.source)}
                    </span>
                    <StatusBadge status={a.status} t={t} />
                  </div>
                </div>

                {requiredDocs.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {requiredDocs.map((d, i) => {
                      const uploaded = a.documents.find((x) => x.type === d.type);
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {uploaded ? <span className="text-green-600">✅</span> : <span className="text-red-500">❌</span>}
                          {uploaded ? (
                            <button type="button" onClick={() => openDoc(uploaded.path)} className="text-brand-600 hover:underline">
                              {d.label}
                            </button>
                          ) : (
                            <span className="text-slate-500">{d.label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {a.answers.length > 0 && (
                  <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {a.answers.map((ans, i) => (
                      <div key={i}>
                        <dt className="text-xs text-slate-400">{ans.question}</dt>
                        <dd className="text-sm text-slate-700">{ans.answer || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {(a.status === "new" || a.status === "viewed") && (
                    <button type="button" disabled={pending[a.id]} onClick={() => changeStatus(a.id, "shortlisted")}
                      className="btn border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
                      ⭐ {t.shortlist}
                    </button>
                  )}
                  <a href={waLink(a.whatsapp)} target="_blank" rel="noreferrer"
                    className="btn border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    💬 {t.whatsapp}
                  </a>
                  <button type="button" disabled={missing.length === 0} onClick={() => onRequestDoc(a)}
                    className="btn border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40">
                    📄 {t.requestDoc}
                  </button>
                  {a.status !== "rejected" && (
                    <button type="button" disabled={pending[a.id]} onClick={() => changeStatus(a.id, "rejected")}
                      className="btn border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                      {t.reject}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Request-doc picker (>1 missing) */}
      {reqDocFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setReqDocFor(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{t.pickDocTitle}</p>
              <button type="button" className="text-sm text-slate-500" onClick={() => setReqDocFor(null)}>{t.close}</button>
            </div>
            <ul className="space-y-1">
              {missingDocs(reqDocFor).map((d, i) => (
                <li key={i}>
                  <button type="button"
                    onClick={() => { requestDocFor(reqDocFor, d.label); setReqDocFor(null); }}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">
                    <span className="text-red-500">❌</span> {d.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
