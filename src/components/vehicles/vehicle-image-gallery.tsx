"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaAsset } from "@/types";

type VehicleImageGalleryProps = {
  readonly images: readonly MediaAsset[];
  readonly locale?: "en" | "tr";
  readonly vehicleName: string;
};

function ArrowIcon({ direction }: { readonly direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MagnifierIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="5.75" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 4.25 4.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function VehicleImageGallery({ images, locale = "tr", vehicleName }: VehicleImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailTrackRef = useRef<HTMLDivElement>(null);
  const hasMultipleImages = images.length > 1;
  const showThumbnailScrollControls = images.length >= 7;
  const activeImage = images[activeIndex] ?? images[0];

  const selectImage = useCallback((index: number) => {
    if (images.length === 0) return;
    const nextIndex = (index + images.length) % images.length;
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => {
      thumbnailTrackRef.current
        ?.querySelector<HTMLElement>(`[data-gallery-thumbnail="${nextIndex}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }, [images.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!hasMultipleImages) return;
      const focusedInsideGallery = document.activeElement instanceof HTMLElement
        && galleryRef.current?.contains(document.activeElement);
      if (!dialogRef.current?.open && !focusedInsideGallery) return;
      if (event.key === "ArrowLeft") selectImage(activeIndex - 1);
      if (event.key === "ArrowRight") selectImage(activeIndex + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, hasMultipleImages, selectImage]);

  if (!activeImage) return null;

  const previousLabel = locale === "en" ? "Previous image" : "Önceki görsel";
  const nextLabel = locale === "en" ? "Next image" : "Sonraki görsel";
  const arrowClass = "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-brand-navy shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  return (
    <div data-vehicle-gallery="true" ref={galleryRef}>
      <div className="relative overflow-hidden rounded-card bg-surface-muted">
        <button
          aria-label={hasMultipleImages ? nextLabel : undefined}
          className={`block w-full ${hasMultipleImages ? "cursor-pointer" : "cursor-default"}`}
          disabled={!hasMultipleImages}
          onClick={() => selectImage(activeIndex + 1)}
          type="button"
        >
          {/* Static delivery is intentional for the export-only production host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={activeImage.alt}
            className="aspect-[16/10] size-full object-contain"
            height={activeImage.height}
            loading="eager"
            src={activeImage.src}
            width={activeImage.width}
          />
        </button>

        {hasMultipleImages ? (
          <>
            <button aria-label={previousLabel} className={`${arrowClass} left-3 sm:left-4`} onClick={() => selectImage(activeIndex - 1)} type="button"><ArrowIcon direction="left" /></button>
            <button aria-label={nextLabel} className={`${arrowClass} right-3 sm:right-4`} onClick={() => selectImage(activeIndex + 1)} type="button"><ArrowIcon direction="right" /></button>
            <span className="absolute bottom-3 right-3 rounded-pill bg-brand-navy/80 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}

        <button
          className="absolute bottom-3 left-3 inline-flex min-h-9 items-center gap-2 rounded-pill bg-brand-navy/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={() => dialogRef.current?.showModal()}
          type="button"
        >
          <MagnifierIcon />
          {locale === "en" ? "Enlarge Image" : "Görseli Büyüt"}
        </button>
      </div>

      {hasMultipleImages ? (
        <div className={`mt-4 grid items-center gap-2 ${showThumbnailScrollControls ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-1"}`}>
          {showThumbnailScrollControls ? <button aria-label={locale === "en" ? "Scroll thumbnails left" : "Küçük görselleri sola kaydır"} className="grid size-9 place-items-center rounded-full border border-border-control bg-white text-brand-navy" onClick={() => thumbnailTrackRef.current?.scrollBy({ left: -320, behavior: "smooth" })} type="button"><ArrowIcon direction="left" /></button> : null}
          <div className="flex snap-x gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={thumbnailTrackRef}>
            {images.map((image, index) => (
              <button
                aria-label={locale === "en" ? `Show image ${index + 1} of ${images.length}` : `${images.length} görselden ${index + 1}. görseli göster`}
                aria-pressed={index === activeIndex}
                className={`w-24 shrink-0 snap-center overflow-hidden rounded-control border-2 bg-surface-muted p-0.5 sm:w-28 ${index === activeIndex ? "border-accent-orange" : "border-transparent hover:border-border-control"}`}
                data-gallery-thumbnail={index}
                key={`${image.src}-${index}`}
                onClick={() => selectImage(index)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="aspect-[4/3] size-full rounded-control object-cover" height={image.height} loading="lazy" src={image.src} width={image.width} />
              </button>
            ))}
          </div>
          {showThumbnailScrollControls ? <button aria-label={locale === "en" ? "Scroll thumbnails right" : "Küçük görselleri sağa kaydır"} className="grid size-9 place-items-center rounded-full border border-border-control bg-white text-brand-navy" onClick={() => thumbnailTrackRef.current?.scrollBy({ left: 320, behavior: "smooth" })} type="button"><ArrowIcon direction="right" /></button> : null}
        </div>
      ) : null}

      <dialog
        aria-label={locale === "en" ? `${vehicleName} enlarged image gallery` : `${vehicleName} büyütülmüş görsel galerisi`}
        className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-[#111]/96 p-0 text-white backdrop:bg-black/80"
        ref={dialogRef}
      >
        <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 px-4 py-3 sm:px-6">
            <p className="truncate text-sm font-semibold">{vehicleName}</p>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-control px-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white" onClick={() => dialogRef.current?.close()} type="button">
              {locale === "en" ? "Close" : "Kapat"}
              <span aria-hidden="true" className="text-2xl leading-none">×</span>
            </button>
          </div>
          <div className="relative flex min-h-0 items-center justify-center p-4 sm:p-8">
            <button
              aria-label={hasMultipleImages ? nextLabel : undefined}
              className={`flex size-full items-center justify-center ${hasMultipleImages ? "cursor-pointer" : "cursor-default"}`}
              disabled={!hasMultipleImages}
              onClick={() => selectImage(activeIndex + 1)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={activeImage.alt} className="max-h-full max-w-full object-contain" height={activeImage.height} src={activeImage.src} width={activeImage.width} />
            </button>
            {hasMultipleImages ? (
              <>
                <button aria-label={previousLabel} className={`${arrowClass} left-3 sm:left-6`} onClick={() => selectImage(activeIndex - 1)} type="button"><ArrowIcon direction="left" /></button>
                <button aria-label={nextLabel} className={`${arrowClass} right-3 sm:right-6`} onClick={() => selectImage(activeIndex + 1)} type="button"><ArrowIcon direction="right" /></button>
              </>
            ) : null}
          </div>
          <p className="border-t border-white/15 px-4 py-3 text-center text-sm font-semibold" aria-live="polite">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
      </dialog>
    </div>
  );
}
