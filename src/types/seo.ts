import type { MediaAsset } from "./media";

export interface SeoMetadata {
  readonly title: string;
  readonly description?: string;
  readonly socialImage?: MediaAsset;
}

