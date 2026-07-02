import "server-only";
import type { Locale } from "./i18n";
import { appBaseUrl } from "./career";

type EmailLocale = "en" | "id";

/** Письмо работодателю о новом отклике. Двуязычные шаблоны (EN/ID). */
export async function sendNewApplicationEmail(params: {
  to: string;
  locale?: Locale;
  candidateName: string;
  vacancyTitle: string;
  companyName: string;
  docsComplete: number;
  docsTotal: number;
  source: string;
  vacancyId: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Doki <onboarding@resend.dev>";
  const dashboardUrl = `${appBaseUrl()}/employer/vacancies/${params.vacancyId}`;

  // ID для индонезийского локейла, иначе EN.
  const loc: EmailLocale = params.locale === "id" ? "id" : "en";
  const T = {
    en: {
      subject: `New application: ${params.candidateName} — ${params.vacancyTitle}`,
      heading: "New application received",
      intro: `${params.candidateName} applied for ${params.vacancyTitle} at ${params.companyName}.`,
      docs: `Documents: ${params.docsComplete}/${params.docsTotal} uploaded`,
      src: `Source: ${params.source}`,
      cta: "Open dashboard",
    },
    id: {
      subject: `Lamaran baru: ${params.candidateName} — ${params.vacancyTitle}`,
      heading: "Lamaran baru masuk",
      intro: `${params.candidateName} melamar ${params.vacancyTitle} di ${params.companyName}.`,
      docs: `Dokumen: ${params.docsComplete}/${params.docsTotal} terunggah`,
      src: `Sumber: ${params.source}`,
      cta: "Buka dasbor",
    },
  }[loc];

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#2c2522">
      <h2 style="color:#b85c38">${T.heading}</h2>
      <p>${T.intro}</p>
      <p style="color:#5c5248">${T.docs}<br>${T.src}</p>
      <p><a href="${dashboardUrl}" style="display:inline-block;background:#b85c38;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${T.cta}</a></p>
      <p style="color:#9c9288;font-size:12px">doki.help</p>
    </div>`;

  if (!key) {
    console.warn(
      `[email] RESEND_API_KEY not set — would send to ${params.to}: "${T.subject}" (dev, skipped).`
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject: T.subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Resend responded", res.status, await res.text());
    }
  } catch (e) {
    // Ошибка письма НЕ должна ронять подачу отклика.
    console.error("[email] send failed:", e);
  }
}
