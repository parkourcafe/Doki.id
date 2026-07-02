"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Locale } from "@/lib/i18n";

const M = {
  en: {
    applyLink: "Apply link", copy: "Copy link", copied: "Copied ✓",
    qr: "Show QR", hideQr: "Hide QR", download: "Download QR",
    whatsapp: "Share on WhatsApp", instagram: "Copy for Instagram", igCopied: "Copied for IG ✓",
    waMsg: (title: string, company: string, url: string) => `We're hiring: ${title} at ${company}. Apply here: ${url}`,
  },
  id: {
    applyLink: "Tautan lamaran", copy: "Salin tautan", copied: "Tersalin ✓",
    qr: "Tampilkan QR", hideQr: "Sembunyikan QR", download: "Unduh QR",
    whatsapp: "Bagikan di WhatsApp", instagram: "Salin untuk Instagram", igCopied: "Tersalin utk IG ✓",
    waMsg: (title: string, company: string, url: string) => `Kami merekrut: ${title} di ${company}. Lamar di sini: ${url}`,
  },
  ru: {
    applyLink: "Ссылка для откликов", copy: "Копировать", copied: "Скопировано ✓",
    qr: "Показать QR", hideQr: "Скрыть QR", download: "Скачать QR",
    whatsapp: "Поделиться в WhatsApp", instagram: "Копировать для Instagram", igCopied: "Скопировано для IG ✓",
    waMsg: (title: string, company: string, url: string) => `Мы нанимаем: ${title} в ${company}. Откликнуться: ${url}`,
  },
  uz: {
    applyLink: "Ariza havolasi", copy: "Nusxa olish", copied: "Nusxalandi ✓",
    qr: "QR ko‘rsatish", hideQr: "QR yashirish", download: "QR yuklab olish",
    whatsapp: "WhatsApp’da ulashish", instagram: "Instagram uchun nusxa", igCopied: "IG uchun nusxalandi ✓",
    waMsg: (title: string, company: string, url: string) => `Ishga olyapmiz: ${company}da ${title}. Ariza: ${url}`,
  },
} as const;

function withSrc(base: string, src: string): string {
  return `${base}${base.includes("?") ? "&" : "?"}src=${src}`;
}

export default function ShareBox({
  locale,
  applyUrl,
  title,
  company,
  slug,
}: {
  locale: Locale;
  applyUrl: string;
  title: string;
  company: string;
  slug: string;
}) {
  const t = M[locale];
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [igCopied, setIgCopied] = useState(false);

  const directUrl = withSrc(applyUrl, "direct");
  const waUrl = withSrc(applyUrl, "wa");
  const igUrl = withSrc(applyUrl, "ig");
  const qrUrl = withSrc(applyUrl, "qr");

  useEffect(() => {
    if (!showQr || qrDataUrl) return;
    QRCode.toDataURL(qrUrl, { width: 512, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [showQr, qrDataUrl, qrUrl]);

  async function copy(text: string, which: "direct" | "ig") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "direct") { setCopied(true); setTimeout(() => setCopied(false), 1500); }
      else { setIgCopied(true); setTimeout(() => setIgCopied(false), 1500); }
    } catch { /* noop */ }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(t.waMsg(title, company, waUrl))}`;

  return (
    <div className="rounded-lg border border-[#e8e0d5] bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{t.applyLink}</p>
      <div className="mt-1">
        <code className="block truncate rounded bg-slate-50 px-2 py-1 text-sm text-slate-700">{applyUrl}</code>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={() => copy(directUrl, "direct")}>
          {copied ? t.copied : t.copy}
        </button>
        <a href={waHref} target="_blank" rel="noreferrer" className="btn-ghost">{t.whatsapp}</a>
        <button type="button" className="btn-ghost" onClick={() => copy(igUrl, "ig")}>
          {igCopied ? t.igCopied : t.instagram}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setShowQr((s) => !s)}>
          {showQr ? t.hideQr : t.qr}
        </button>
      </div>

      {showQr && (
        <div className="mt-3 flex flex-col items-center gap-2">
          {qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR ${slug}`} className="h-44 w-44" />
              <a href={qrDataUrl} download={`apply-${slug}.png`} className="btn-ghost">{t.download}</a>
            </>
          ) : (
            <div className="h-44 w-44 animate-pulse rounded bg-slate-100" />
          )}
        </div>
      )}
    </div>
  );
}
