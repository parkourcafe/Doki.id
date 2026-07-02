"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

// Порядок и подписи языков в переключателе.
const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Indonesia" },
  { code: "uz", label: "O‘zbekcha" },
];

/**
 * Явный выбор языка интерфейса. Пишет выбор в cookie `locale` (её читает
 * getLocale на сервере) и обновляет серверные компоненты через router.refresh().
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  function choose(code: Locale) {
    // 1 год; доступна на всех маршрутах.
    document.cookie = `locale=${code}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <select
      aria-label="Language"
      value={current}
      onChange={(e) => choose(e.target.value as Locale)}
      className="rounded-md border border-[#e8e0d5] bg-white px-2 py-1.5 text-sm text-slate-600"
    >
      {OPTIONS.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
