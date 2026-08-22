import Image from "next/image";

import type { Article, ArticleCategory } from "@/types";

import { contactInformation } from "@/data";
import { getFiloRehberiArticlePath } from "@/lib/paths";

export function QuoteSidebar({
  article,
  category,
}: {
  article: Article;
  category: ArticleCategory;
}) {
  const phone = contactInformation.phones[0];
  const email = contactInformation.emails[0];
  const articleHref = getFiloRehberiArticlePath(category.slug, article.slug);

  return (
    <aside aria-label="Teklif desteği" className="space-y-6 lg:sticky lg:top-28 lg:self-start">
      <section className="rounded-panel bg-brand-navy p-6 text-text-inverse shadow-panel sm:p-8">
        <div className="flex items-center gap-3 text-accent-orange">
          <svg aria-hidden="true" className="size-7" fill="none" viewBox="0 0 24 24">
            <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h2v5H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2Zm16 0h-2v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2ZM18 18c0 2-2 3-5 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
          <h2 className="text-heading-md font-semibold text-text-inverse">Teklif Desteği</h2>
        </div>
        <p className="mt-4 text-body text-text-inverse-muted">
          Form hakkında bilgi almak için doğrulanmış iletişim kanallarımızı kullanabilirsiniz.
        </p>
        <div className="mt-6 space-y-3 border-t border-white/15 pt-6">
          <a className="flex min-h-11 items-center gap-3 rounded-control text-body text-text-inverse hover:text-accent-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange" href={phone.href}>
            <span aria-hidden="true">☎</span>
            {phone.displayValue}
          </a>
          <a className="flex min-h-11 min-w-0 items-center gap-3 rounded-control text-body text-text-inverse hover:text-accent-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange" href={email.href}>
            <span aria-hidden="true">✉</span>
            <span className="min-w-0 break-all">{email.displayValue}</span>
          </a>
        </div>
      </section>

      <article className="overflow-hidden rounded-card border border-border-subtle bg-surface-card shadow-card transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-card-hover motion-reduce:transition-none">
        <a className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={articleHref}>
          {article.coverImage ? (
            <div className="relative aspect-video overflow-hidden bg-surface-muted">
              <Image alt={article.coverImage.alt} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" height={article.coverImage.height} loading="eager" src={article.coverImage.src} width={article.coverImage.width} />
            </div>
          ) : null}
          <div className="p-5">
            <p className="text-label font-semibold text-corporate-blue">{category.label}</p>
            <h2 className="mt-2 text-body-lg font-semibold text-text-primary">{article.title}</h2>
            <p className="mt-2 line-clamp-3 text-body text-text-secondary">{article.excerpt}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-label font-semibold text-corporate-blue">
              İncele <span aria-hidden="true">→</span>
            </span>
          </div>
        </a>
      </article>
    </aside>
  );
}
