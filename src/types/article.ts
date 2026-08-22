import type { MediaAsset } from "./media";
import type {
  EntityId,
  HttpsUrl,
  IsoDate,
  PublicationStatus,
  Slug,
} from "./primitives";
import type { SeoMetadata } from "./seo";

export interface ArticleCategory {
  readonly id: EntityId;
  readonly slug: Slug;
  readonly label: string;
  readonly publicationStatus: PublicationStatus;
}

export interface ArticleAttribution {
  readonly displayName: string;
  readonly role?: string;
}

export interface ArticleSource {
  readonly label: string;
  readonly href: HttpsUrl;
  readonly accessedAt?: IsoDate;
}

export interface Article {
  readonly id: EntityId;
  readonly slug: Slug;
  readonly publicationStatus: PublicationStatus;
  readonly title: string;
  readonly excerpt: string;
  readonly categoryId: EntityId;
  readonly tagIds: readonly EntityId[];
  readonly author?: ArticleAttribution;
  readonly reviewer?: ArticleAttribution;
  readonly publishedAt: IsoDate;
  readonly updatedAt?: IsoDate;
  readonly readingMinutes: number;
  readonly featured: boolean;
  /** Present only when a locally approved, rights-cleared cover is available. */
  readonly coverImage?: MediaAsset;
  readonly sources: readonly ArticleSource[];
  readonly contentKey: EntityId;
  readonly seo: SeoMetadata;
}
