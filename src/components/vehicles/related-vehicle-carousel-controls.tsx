"use client";

import { Button } from "@/components/ui";

export type RelatedVehicleCarouselControlsProps = {
  trackId: string;
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={
        direction === "left"
          ? "size-5 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none"
          : "size-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
      }
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function RelatedVehicleCarouselControls({
  trackId,
}: RelatedVehicleCarouselControlsProps) {
  function scrollTrack(direction: -1 | 1) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    const shouldWrap = (direction < 0 && atStart) || (direction > 0 && atEnd);
    const targetLeft = shouldWrap
      ? direction < 0
        ? track.scrollWidth
        : 0
      : track.scrollLeft + direction * track.clientWidth;

    track.scrollTo({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      left: targetLeft,
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2" data-related-vehicles-controls="true">
      <Button
        aria-controls={trackId}
        aria-label="Önceki araçları göster"
        className="group transition-[background-color,border-color,color,box-shadow] duration-200 hover:!border-corporate-blue hover:!bg-corporate-blue hover:!text-text-inverse hover:shadow-[0_0.5rem_1rem_rgb(1_68_153_/_0.2)] motion-reduce:transition-none"
        data-related-vehicles-control="previous"
        onClick={() => scrollTrack(-1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowIcon direction="left" />
      </Button>
      <Button
        aria-controls={trackId}
        aria-label="Sonraki araçları göster"
        className="group transition-[background-color,border-color,color,box-shadow] duration-200 hover:!border-corporate-blue hover:!bg-corporate-blue hover:!text-text-inverse hover:shadow-[0_0.5rem_1rem_rgb(1_68_153_/_0.2)] motion-reduce:transition-none"
        data-related-vehicles-control="next"
        onClick={() => scrollTrack(1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowIcon direction="right" />
      </Button>
    </div>
  );
}
