"use client";

import { Button } from "@/components/ui";

export type RelatedVehicleCarouselControlsProps = {
  trackId: string;
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
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
    track.scrollLeft = shouldWrap
      ? direction < 0
        ? track.scrollWidth
        : 0
      : track.scrollLeft + direction * track.clientWidth;
  }

  return (
    <div className="flex shrink-0 items-center gap-2" data-related-vehicles-controls="true">
      <Button
        aria-controls={trackId}
        aria-label="Önceki araçları göster"
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
