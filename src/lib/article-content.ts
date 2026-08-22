import { readFileSync } from "node:fs";
import path from "node:path";

import type { EntityId } from "@/types";
import { asSlug } from "./validation";

/** Reads owner-supplied Markdown only while statically generating article pages. */
export function readArticleMarkdown(contentKey: EntityId | string): string {
  const safeKey = asSlug(contentKey, "article content key");
  return readFileSync(
    path.join(process.cwd(), "src", "content", "filo-rehberi", `${safeKey}.md`),
    "utf8",
  );
}
