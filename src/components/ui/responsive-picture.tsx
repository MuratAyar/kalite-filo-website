import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "./class-names";

export type PictureSource = {
  media?: string;
  sizes?: string;
  srcSet: string;
  type?: string;
};

type InformativePicture = {
  alt: string;
  decorative?: false;
};

type DecorativePicture = {
  alt: "";
  decorative: true;
};

export type ResponsivePictureProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "alt" | "children" | "height" | "src" | "srcSet" | "width"
> &
  (InformativePicture | DecorativePicture) & {
    fallbackSrcSet?: string;
    height: number;
    pictureClassName?: string;
    sources?: readonly PictureSource[];
    src: string;
    width: number;
  };

/** Renders approved, pre-generated responsive assets without a runtime image service. */
export function ResponsivePicture({
  alt,
  className,
  decorative = false,
  fallbackSrcSet,
  height,
  loading = "lazy",
  pictureClassName,
  sizes,
  sources = [],
  src,
  width,
  ...props
}: ResponsivePictureProps) {
  return (
    <picture className={pictureClassName}>
      {sources.map((source) => (
        <source
          key={`${source.media ?? "all"}:${source.type ?? "any"}:${source.srcSet}`}
          media={source.media}
          sizes={source.sizes}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <img
        alt={decorative ? "" : alt}
        className={classNames("h-auto max-w-full", className)}
        decoding="async"
        height={height}
        loading={loading}
        sizes={sizes}
        src={src}
        srcSet={fallbackSrcSet}
        width={width}
        {...props}
      />
    </picture>
  );
}
