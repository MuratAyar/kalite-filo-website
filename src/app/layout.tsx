import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/layout";
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
        url: "/icons/kalite-filo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/kalite-filo-icon.png",
        sizes: "512x512",
        type: "image/png",
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
    <html data-scroll-behavior="smooth" lang="tr">
      <body className="flex min-h-svh flex-col bg-page font-sans text-foreground antialiased">
        <SkipLink />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
