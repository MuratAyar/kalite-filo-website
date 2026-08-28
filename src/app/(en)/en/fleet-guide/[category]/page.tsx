import type { Metadata } from "next";

import { FleetGuideListing } from "@/components/editorial";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { englishArticleCategories, englishArticles } from "@/data";
import { ENGLISH_ARTICLE_CATEGORY_SLUGS } from "@/config/localized-routes";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

type Props = { params: Promise<{ category: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return englishArticleCategories.map(({ slug }) => ({ category: slug })); }
function getCategory(slug: string) { const category = englishArticleCategories.find((item) => item.slug === slug); if (!category) throw new Error(`Unknown English Fleet Guide category: ${slug}`); return category; }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const category = getCategory((await params).category); const path = `/en/fleet-guide/${category.slug}/`; const trSlug = Object.entries(ENGLISH_ARTICLE_CATEGORY_SLUGS).find(([, en]) => en === category.slug)?.[0]; const trPath = trSlug ? `/filo-rehberi/${trSlug}/` : "/filo-rehberi/"; return { title: `${category.label} | Fleet Guide`, description: `${category.label} articles from the Kalite Filo Fleet Guide.`, alternates: { canonical: path, languages: { en: path, tr: trPath, "x-default": trPath } }, robots: createTranslatedRouteRobots("fleet-guide-category") }; }
export default async function EnglishFleetGuideCategoryPage({ params }: Props) { const category = getCategory((await params).category); return <main className="flex-1" id="main-content" tabIndex={-1}>
  <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { href: "/en/fleet-guide/", label: "Fleet Guide" }, { label: category.label }]} breadcrumbsAriaLabel="Breadcrumb" title={category.label} variant="high-emphasis" />
  <Section aria-labelledby="english-fleet-guide-category-title" className="pt-2 md:pt-4" surface="page"><PageContainer><h2 className="sr-only" id="english-fleet-guide-category-title">{category.label} articles</h2><FleetGuideListing articles={englishArticles} categories={englishArticleCategories} initialCategoryId={category.id} locale="en" /></PageContainer></Section>
</main>; }
