import type { LocalAssetPath } from "./primitives";

interface MediaAssetBase {
  readonly src: LocalAssetPath;
  readonly width: number;
  readonly height: number;
}

export interface InformativeMediaAsset extends MediaAssetBase {
  readonly purpose: "informative";
  readonly alt: string;
}

export interface DecorativeMediaAsset extends MediaAssetBase {
  readonly purpose: "decorative";
  readonly alt: "";
}

export type MediaAsset = InformativeMediaAsset | DecorativeMediaAsset;

export interface ResponsiveMediaSource {
  readonly srcSet: LocalAssetPath;
  readonly media?: string;
  readonly type: "image/avif" | "image/webp" | "image/jpeg" | "image/png";
}

export interface ResponsiveMediaAsset {
  readonly image: MediaAsset;
  readonly sources: readonly ResponsiveMediaSource[];
}

