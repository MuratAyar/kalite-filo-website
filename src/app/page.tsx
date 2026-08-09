import type { Metadata } from "next";

import { createStaticRouteMetadata } from "@/lib/route-metadata";

export const metadata: Metadata = createStaticRouteMetadata("home");

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-svh place-items-center px-page-gutter py-section"
    >
      <h1 className="text-heading font-semibold tracking-tight">
        Kalite Filo
      </h1>
    </main>
  );
}
