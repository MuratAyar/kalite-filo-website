"use client";

import { useRef, useState, type MouseEvent } from "react";

import { Icon } from "@/components/ui/icon";

type ArticleShareActionsProps = {
  canonicalUrl: string;
  locale?: "en" | "tr";
  title: string;
};

export function ArticleShareActions({ canonicalUrl, locale = "tr", title }: ArticleShareActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(canonicalUrl);
  const [status, setStatus] = useState("");
  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(canonicalUrl)}`;
  const shareTitle = `${title} | Kalite Filo`;
  const whatsAppText = encodeURIComponent(`${shareTitle}\n${shareUrl}`);
  const whatsAppHref = `https://wa.me/?text=${whatsAppText}`;
  const xHref = `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

  function getCurrentPageUrl() {
    return window.location.href;
  }

  async function writeToClipboard(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = value;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    const copied = document.execCommand("copy");
    temporaryInput.remove();
    if (!copied) throw new Error("Clipboard copy failed.");
  }

  async function copyArticleLink() {
    try {
      await writeToClipboard(getCurrentPageUrl());
      setStatus(locale === "en" ? "Article link copied." : "Makale bağlantısı kopyalandı.");
    } catch {
      setStatus(locale === "en" ? "The link could not be copied." : "Bağlantı kopyalanamadı.");
    }
  }

  function openShareDialog() {
    const currentUrl = getCurrentPageUrl();
    setShareUrl(currentUrl);
    setStatus("");
    setIsDialogOpen(true);
    dialogRef.current?.showModal();
  }

  function closeShareDialog() {
    dialogRef.current?.close();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeShareDialog();
  }

  function shareOnWhatsApp(event: MouseEvent<HTMLAnchorElement>) {
    const currentShareText = encodeURIComponent(`${shareTitle}\n${getCurrentPageUrl()}`);

    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      event.preventDefault();
      window.location.href = `whatsapp://send?text=${currentShareText}`;
    }
  }

  const actionClassName =
    "inline-flex size-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:border-corporate-blue hover:text-corporate-blue";

  return (
    <div data-article-share-actions="true">
      <div className="flex flex-wrap gap-2.5">
        <button aria-label={locale === "en" ? "Share article" : "Makaleyi paylaş"} className={actionClassName} onClick={openShareDialog} type="button">
          <Icon size="sm">
            <circle cx="18" cy="5" r="2.25" />
            <circle cx="6" cy="12" r="2.25" />
            <circle cx="18" cy="19" r="2.25" />
            <path d="m8 11 7.8-4.6M8 13l7.8 4.6" />
          </Icon>
        </button>
        <a aria-label={locale === "en" ? "Share article by email" : "Makaleyi e-posta ile paylaş"} className={actionClassName} href={emailHref}>
          <Icon size="sm">
            <rect height="14" rx="2" width="18" x="3" y="5" />
            <path d="m4 7 8 6 8-6" />
          </Icon>
        </a>
        <button aria-label={locale === "en" ? "Copy article link" : "Makale bağlantısını kopyala"} className={actionClassName} onClick={copyArticleLink} type="button">
          <Icon size="sm">
            <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
            <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
          </Icon>
        </button>
      </div>
      {status && !isDialogOpen ? (
        <p aria-live="polite" className="mt-3 text-label text-text-secondary">
          {status}
        </p>
      ) : null}

      <dialog
        aria-labelledby="article-share-dialog-title"
        className="m-auto w-[calc(100%_-_2rem)] max-w-[26rem] rounded-panel border border-border-subtle bg-surface-card p-0 text-text-primary shadow-[0_24px_64px_rgba(24,33,54,0.28)] backdrop:bg-brand-navy/70 backdrop:backdrop-blur-[2px]"
        data-article-share-dialog="true"
        onClick={handleDialogClick}
        onClose={() => setIsDialogOpen(false)}
        ref={dialogRef}
      >
        <div className="overflow-hidden rounded-panel">
          <div className="flex items-center justify-between gap-4 bg-brand-navy px-5 py-4 text-text-inverse">
            <h3 className="text-body-lg font-semibold" id="article-share-dialog-title">
              {locale === "en" ? "Share article" : "Makaleyi paylaş"}
            </h3>
            <button
              aria-label={locale === "en" ? "Close sharing dialog" : "Paylaşım penceresini kapat"}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-text-inverse/30 text-text-inverse transition-colors hover:border-accent-orange hover:text-accent-orange"
              onClick={closeShareDialog}
              type="button"
            >
              <Icon size="sm">
                <path d="m6 6 12 12M18 6 6 18" />
              </Icon>
            </button>
          </div>

          <div className="space-y-3 p-5">
            <button
              className="flex min-h-12 w-full items-center justify-between gap-4 rounded-control border border-border-subtle bg-surface-muted px-4 py-3 text-left text-body font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue"
              data-share-copy="true"
              onClick={copyArticleLink}
              type="button"
            >
              {locale === "en" ? "Copy link" : "Bağlantıyı kopyala"}
              <Icon size="sm">
                <rect height="14" rx="2" width="11" x="9" y="7" />
                <path d="M15 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" />
              </Icon>
            </button>
            <a
              className="flex min-h-12 w-full items-center justify-between gap-4 rounded-control border border-border-subtle bg-surface-muted px-4 py-3 text-body font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue"
              data-share-x="true"
              href={xHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              {locale === "en" ? "Share on X" : "X'te paylaş"}
              <span aria-hidden="true" className="text-heading-md leading-none">X</span>
            </a>
            <a
              className="flex min-h-12 w-full items-center justify-between gap-4 rounded-control border border-border-subtle bg-surface-muted px-4 py-3 text-body font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue"
              data-share-whatsapp="true"
              href={whatsAppHref}
              onClick={shareOnWhatsApp}
              rel="noopener noreferrer"
              target="_blank"
            >
              {locale === "en" ? "Share on WhatsApp" : "WhatsApp'ta paylaş"}
              <Icon size="sm">
                <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" />
                <path d="M9 8.5c.5 2.6 2 4.1 4.7 4.8" />
              </Icon>
            </a>

            {status ? (
              <p aria-live="polite" className="pt-1 text-label text-text-secondary">
                {status}
              </p>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
