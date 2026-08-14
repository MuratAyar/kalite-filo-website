"use client";

import { useRef, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

/**
 * Demonstrates the newsletter confirmation flow without transmitting or
 * retaining the entered address. A real subscription endpoint remains a
 * separately approved integration.
 */
export function NewsletterSignupDemo() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    dialogRef.current?.showModal();
    form.reset();
  }

  return (
    <>
      <form
        aria-describedby="newsletter-preview-status"
        className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="newsletter-preview-email">
          E-posta adresi
        </label>
        <div className="flex min-h-11 min-w-0 items-center rounded-control border border-border-subtle bg-surface-card text-text-secondary focus-within:border-accent-orange">
          <svg
            aria-hidden="true"
            className="ml-3 size-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m3.75 6.75 8.25 6 8.25-6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <input
            aria-describedby="newsletter-preview-status"
            autoComplete="email"
            className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-body text-text-secondary outline-none placeholder:text-text-secondary/80 focus:outline-none focus-visible:outline-none"
            id="newsletter-preview-email"
            inputMode="email"
            maxLength={254}
            placeholder="E-posta adresiniz"
            required
            type="email"
          />
        </div>
        <Button size="compact" type="submit">
          Kayıt Ol
          <span aria-hidden="true">→</span>
        </Button>
      </form>

      <dialog
        aria-describedby="newsletter-demo-description"
        aria-labelledby="newsletter-demo-title"
        className="m-auto w-[min(30rem,calc(100vw_-_2rem))] rounded-panel border border-border-subtle bg-surface-card p-0 text-text-primary shadow-2xl backdrop:bg-brand-navy/75 backdrop:backdrop-blur-sm"
        ref={dialogRef}
      >
        <div className="p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-success-surface text-success"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24">
              <path
                d="m6.75 12.75 3 3 7.5-7.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h3
            className="mt-5 text-heading-md font-semibold tracking-tight"
            id="newsletter-demo-title"
          >
            Tasarım ön izlemesi
          </h3>
          <p
            className="mt-3 text-body text-text-secondary"
            id="newsletter-demo-description"
          >
            Bu işlem yalnızca kayıt deneyimini gösterir. E-posta adresiniz
            herhangi bir sunucuya gönderilmedi ve kaydedilmedi.
          </p>
          <form className="mt-6 flex justify-end" method="dialog">
            <Button size="compact" type="submit">
              Anladım
            </Button>
          </form>
        </div>
      </dialog>
    </>
  );
}
