import type { Metadata } from "next";

import "../../globals.css";

export const metadata: Metadata = {
  applicationName: "Kalite Filo Admin",
  title: "Yönetim Paneli | Kalite Filo",
  description: "Kalite Filo yetkili yönetim paneli.",
  icons: {
    icon: [{ url: "/icons/kalite-filo-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icons/kalite-filo-icon.png", type: "image/png", sizes: "512x512" }],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="min-h-svh bg-page font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
