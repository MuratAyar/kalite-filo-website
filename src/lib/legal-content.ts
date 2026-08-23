import { readFileSync } from "node:fs";
import path from "node:path";

export type LegalContentKey =
  | "cerez-politikasi"
  | "kullanim-kosullari"
  | "kvkk-ve-guvenlik";

export type LegalDocumentSource = {
  readonly description: string;
  readonly markdown: string;
  readonly title: string;
};

const legalContentKeys = new Set<LegalContentKey>([
  "cerez-politikasi",
  "kullanim-kosullari",
  "kvkk-ve-guvenlik",
]);

function readFrontmatterValue(markdown: string, key: string): string {
  const frontmatter = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const value = frontmatter
    ?.split(/\r?\n/)
    .find((line) => line.startsWith(`${key}:`))
    ?.slice(key.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!value) {
    throw new Error(`Legal document is missing ${key} frontmatter.`);
  }

  return value;
}

/** Reads owner-supplied legal Markdown only during static generation. */
export function readLegalDocument(key: LegalContentKey): LegalDocumentSource {
  if (!legalContentKeys.has(key)) {
    throw new Error(`Unknown legal content key: ${key}`);
  }

  const markdown = readFileSync(
    path.join(process.cwd(), "src", "content", "legal", `${key}.md`),
    "utf8",
  );

  return {
    description: readFrontmatterValue(markdown, "description"),
    markdown,
    title: readFrontmatterValue(markdown, "title"),
  };
}
