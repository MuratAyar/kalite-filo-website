import type { Metadata } from "next";

import { SkipLink } from "@/components/navigation/skip-link";
import { getSiteEnvironment } from "@/config/site";
import { validateFoundationContent } from "@/lib/content-validation";
import { createDefaultRobotsMetadata } from "@/lib/route-metadata";

import "./globals.css";

const siteEnvironment = getSiteEnvironment();
validateFoundationContent();

export const metadata: Metadata = {
  metadataBase: new URL(siteEnvironment.origin),
  applicationName: "Kalite Filo",
  title: {
    default: "Kalite Filo",
    template: "%s | Kalite Filo",
  },
  icons: {
    icon: [
      {
        url: "/icons/site-icon-placeholder.svg",
        type: "image/svg+xml",
      },
    ],
  },
  robots: createDefaultRobotsMetadata(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-svh bg-page font-sans text-foreground antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
