import type { Metadata } from "next";

import { EnglishSiteFooter, EnglishSiteHeader } from "@/components/layout";
import { SkipLink } from "@/components/navigation/skip-link";
import { PrivacyPreferencesDialog } from "@/components/privacy";
import { getSiteEnvironment } from "@/config/site";

import "../../globals.css";

const siteEnvironment = getSiteEnvironment();

export const metadata: Metadata = {
  metadataBase: new URL(siteEnvironment.origin),
  applicationName: "Kalite Filo",
  title: { default: "Kalite Filo", template: "%s | Kalite Filo" },
};

export default function EnglishRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className="flex min-h-svh flex-col bg-page font-sans text-foreground antialiased">
        <SkipLink label="Skip to main content" />
        <EnglishSiteHeader />
        {children}
        <EnglishSiteFooter />
        <PrivacyPreferencesDialog locale="en" />
      </body>
    </html>
  );
}
