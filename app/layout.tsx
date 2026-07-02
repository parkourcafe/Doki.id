import type { Metadata, Viewport } from "next";
import { getLocale } from "@/lib/i18n";
import { appBaseUrl } from "@/lib/career";
import YandexMetrika from "@/components/YandexMetrika";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: { default: "Doki — apply & hiring", template: "%s · Doki" },
  description:
    "Create a vacancy, share a link, and receive structured applications. Candidates apply without registration.",
  applicationName: "Doki Hiring",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#b85c38",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
