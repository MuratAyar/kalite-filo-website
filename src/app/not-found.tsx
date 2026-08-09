import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-svh place-items-center px-page-gutter py-section"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-stack text-center">
        <p className="text-label font-semibold text-muted">404</p>
        <h1 className="text-heading font-semibold tracking-tight">
          Sayfa bulunamadı
        </h1>
        <p className="max-w-prose text-body text-muted">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-stack inline-flex min-h-control-primary items-center justify-center rounded-control bg-accent px-6 font-semibold text-brand-navy transition-colors hover:bg-accent/85"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
