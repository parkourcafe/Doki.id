"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const M = {
  ru: { copied: "Скопировано ✓", copy: "Копировать ссылку" },
  en: { copied: "Copied ✓", copy: "Copy link" },
  uz: { copied: "Nusxalandi ✓", copy: "Havoladan nusxa olish" },
  id: { copied: "Tersalin ✓", copy: "Salin tautan" },
} as const;

export default function CopyButton({
  text,
  className,
  locale,
}: {
  text: string;
  className?: string;
  locale: Locale;
}) {
  const t = M[locale];
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className ?? "btn-ghost"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* noop */
        }
      }}
    >
      {copied ? t.copied : t.copy}
    </button>
  );
}
