"use client";

import { useState } from "react";

/** Кнопка выхода: сабмитит форму с серверным action signOut. */
export default function SignOutButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="submit" disabled={busy} className={className} onClick={() => setBusy(true)}>
      {label}
    </button>
  );
}
