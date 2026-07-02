"use client";

import { useFormStatus } from "react-dom";

/**
 * Кнопка отправки для форм с серверными экшенами. Сама блокируется и
 * показывает спиннер, пока экшен выполняется — это защищает от повторной
 * отправки (двойной/тройной клик создавал дубли записей).
 */
export default function SubmitButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      <span className="inline-flex items-center justify-center gap-2">
        {pending && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
}
