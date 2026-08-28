import type { Metadata } from "next";

import { FleetGuideListing } from "@/components/editorial";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { articleCategories, articles } from "@/data";
import { getFiloRehberiCategoryPath } from "@/lib/paths";
import { createFamilyRouteMetadata } from "@/lib/route-metadata";

type CategoryPageProps = { params: Promise<{ category: string }> };
const homeRoute = getPublicStaticRoute("home");
const guideRoute = getPublicStaticRoute("fleet-guide");

export const dynamicParams = false;

export function generateStaticParams() {
  return articleCategories
    .filter((category) => category.publicationStatus === "approved")
    .map((category) => ({ category: category.slug }));
}

function getCategory(slug: string) {
  const category = articleCategories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Unknown Filo Rehberi category: ${slug}`);
  return category;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = getCategory((await params).category);
  return {
    ...createFamilyRouteMetadata("fleet-guide-category", getFiloRehberiCategoryPath(category.slug)),
    title: `${category.label} | Filo Rehberi`,
  };
}

export default async function FleetGuideCategoryPage({ params }: CategoryPageProps) {
  const category = getCategory((await params).category);
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { href: guideRoute.path, label: guideRoute.label },
          { label: category.label },
        ]}
        title={category.label}
        variant="high-emphasis"
      />
      <Section aria-labelledby="fleet-guide-category-title" className="pt-2 md:pt-4" surface="page">
        <PageContainer>
          <h2 className="sr-only" id="fleet-guide-category-title">{category.label} içerikleri</h2>
          <FleetGuideListing articles={articles} categories={articleCategories} initialCategoryId={category.id} />
        </PageContainer>
      </Section>
    </main>
  );
}
