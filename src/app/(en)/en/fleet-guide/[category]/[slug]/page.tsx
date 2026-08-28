import type { Metadata } from "next";
import Link from "next/link";

import { ArticleContent, getArticleTableOfContents } from "@/components/editorial";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { englishArticleCategories, englishArticles } from "@/data";
import { readArticleMarkdown } from "@/lib/article-content";
import { ENGLISH_ARTICLE_CATEGORY_SLUGS, ENGLISH_ARTICLE_SLUGS } from "@/config/localized-routes";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { const categories = new Map(englishArticleCategories.map((item) => [item.id, item])); return englishArticles.map((article) => ({ category: categories.get(article.categoryId)?.slug, slug: article.slug })); }
function getRecord(categorySlug: string, articleSlug: string) { const category = englishArticleCategories.find((item) => item.slug === categorySlug); const article = englishArticles.find((item) => item.slug === articleSlug && item.categoryId === category?.id); if (!category || !article) throw new Error(`Unknown English Fleet Guide article: ${categorySlug}/${articleSlug}`); return { article, category }; }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const values = await params; const { article, category } = getRecord(values.category, values.slug); const path = `/en/fleet-guide/${category.slug}/${article.slug}/`; const trCategory = Object.entries(ENGLISH_ARTICLE_CATEGORY_SLUGS).find(([, en]) => en === category.slug)?.[0]; const trArticle = Object.entries(ENGLISH_ARTICLE_SLUGS).find(([, en]) => en === article.slug)?.[0]; const trPath = trCategory && trArticle ? `/filo-rehberi/${trCategory}/${trArticle}/` : "/filo-rehberi/"; return { title: { absolute: article.seo.title }, description: article.seo.description, alternates: { canonical: path, languages: { en: path, tr: trPath, "x-default": trPath } }, robots: createTranslatedRouteRobots("fleet-guide-article") }; }

export default async function EnglishFleetGuideArticlePage({ params }: Props) {
  const values = await params; const { article, category } = getRecord(values.category, values.slug); const markdown = readArticleMarkdown(article.contentKey); const contents = getArticleTableOfContents(markdown);
  const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", timeZone: "UTC", year: "numeric" }).format(new Date(`${article.publishedAt}T00:00:00Z`));
  return <main className="flex-1" id="main-content" tabIndex={-1}>
    <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { href: "/en/fleet-guide/", label: "Fleet Guide" }, { label: article.title }]} breadcrumbsAriaLabel="Breadcrumb" intro={article.excerpt} mobileStartAtTitle title={article.title} variant="high-emphasis">
      <ul aria-label="Article information" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-text-secondary"><li className="rounded-pill bg-corporate-blue px-3 py-2 font-semibold text-text-inverse">{category.label}</li><li><span className="sr-only">Published: </span><time dateTime={article.publishedAt}>{date}</time></li><li>{article.readingMinutes} min read</li></ul>
    </PageHeader>
    <Section spacing="none" surface="page"><PageContainer className="grid gap-8 pb-section lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
      {article.coverImage ? <figure className="min-w-0 overflow-hidden rounded-panel border border-border-subtle bg-surface-card p-3 md:p-4">
        {/* Static rights-cleared local editorial image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={article.coverImage.alt} className="aspect-video w-full rounded-card object-cover" height={article.coverImage.height} src={article.coverImage.src} width={article.coverImage.width} />
      </figure> : null}
      <aside aria-label="Article navigation" className="space-y-5 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start"><section aria-labelledby="contents-title" className="rounded-card border border-border-subtle bg-surface-card p-6"><h2 className="text-label font-semibold tracking-wide uppercase" id="contents-title">Contents</h2><nav aria-label="Article contents" className="mt-5"><ol className="space-y-3">{contents.map((item) => <li className="relative pl-4" key={item.id}><span aria-hidden="true" className="absolute top-[0.65em] left-0 size-1.5 rounded-pill bg-border-control"/><a className="text-body text-text-secondary underline-offset-4 hover:text-corporate-blue hover:underline" href={`#${item.id}`}>{item.label}</a></li>)}</ol></nav></section><Link className="inline-flex min-h-11 items-center font-semibold text-corporate-blue hover:underline" href="/en/fleet-guide/">← Back to Fleet Guide</Link></aside>
      <article className={`min-w-0 rounded-panel border border-border-subtle bg-surface-card p-6 md:p-10 ${article.coverImage ? "lg:col-start-1 lg:row-start-2" : "lg:col-start-1 lg:row-start-1"}`}><ArticleContent markdown={markdown} /></article>
    </PageContainer></Section>
  </main>;
}
