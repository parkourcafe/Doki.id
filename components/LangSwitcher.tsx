"use client";

import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { en: "EN", id: "ID", ru: "RU", uz: "UZ" };

/**
 * Переключатель языка на публичных страницах. Ставит cookie `locale`
 * (её читает getLocale) и перезагружает страницу.
 */
export default function LangSwitcher({
  current,
  locales = ["en", "id"],
}: {
  current: Locale;
  locales?: Locale[];
}) {
  function set(l: Locale) {
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.reload();
  }
  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={
            (l === current
              ? "bg-brand-500 text-white"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100") +
            " rounded-md px-2 py-1 text-xs font-medium"
          }
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
