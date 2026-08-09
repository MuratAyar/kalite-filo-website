import type {
  EntityId,
  InternalPath,
  IsoDate,
  PublicationStatus,
} from "./primitives";
import type { SeoMetadata } from "./seo";

export interface LegalPageMetadata {
  readonly id: EntityId;
  readonly path: InternalPath;
  readonly title: string;
  readonly version: string;
  readonly effectiveAt: IsoDate;
  readonly updatedAt?: IsoDate;
  readonly owner?: string;
  readonly publicationStatus: PublicationStatus;
  readonly seo: SeoMetadata;
}

