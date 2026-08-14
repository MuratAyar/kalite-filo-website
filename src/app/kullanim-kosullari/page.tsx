import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("terms-of-use");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  title: route.label,
};

export default function TermsOfUsePage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        title={route.label}
      />
    </main>
  );
}
