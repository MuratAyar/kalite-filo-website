import type {
  EntityId,
  PublicationStatus,
  Slug,
} from "./primitives";

export interface FaqCategory {
  readonly id: EntityId;
  readonly slug: Slug;
  readonly label: string;
  readonly publicationStatus: PublicationStatus;
}

export interface FaqEntry {
  readonly id: EntityId;
  readonly categoryId: EntityId;
  readonly question: string;
  readonly answerParagraphs: readonly string[];
  readonly order: number;
  readonly publicationStatus: PublicationStatus;
}

