import type { ReactNode } from "react";
import Link from "next/link";

type ArticleContentProps = { markdown: string };

export type ArticleTableOfContentsItem = {
  readonly id: string;
  readonly label: string;
};

const hiddenSectionHeadings = new Set([
  "Kart Özeti",
  "İçindekiler",
  "İç Link Önerileri",
]);

const tableOfContentsExcludedHeadings = new Set([
  ...hiddenSectionHeadings,
  "CTA",
]);

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, "");
}

function stripInlineMarkdown(value: string) {
  return value.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function headingSlug(value: string) {
  return stripInlineMarkdown(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bolum";
}

function getVisibleSecondLevelHeadings(markdown: string) {
  return stripFrontmatter(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => stripInlineMarkdown(line.slice(3)))
    .filter((heading) => !tableOfContentsExcludedHeadings.has(heading));
}

export function getArticleTableOfContents(
  markdown: string,
): readonly ArticleTableOfContentsItem[] {
  const occurrences = new Map<string, number>();

  return getVisibleSecondLevelHeadings(markdown).map((label) => {
    const baseId = headingSlug(label);
    const occurrence = (occurrences.get(baseId) ?? 0) + 1;
    occurrences.set(baseId, occurrence);
    return {
      id: occurrence === 1 ? baseId : `${baseId}-${occurrence}`,
      label,
    };
  });
}

function inline(value: string): ReactNode[] {
  return value
    .split(/(\[[^\]]+\]\(\/(?:arac-listesi|teklif-al)\/\)|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      const linkMatch = part.match(
        /^\[([^\]]+)\]\((\/(?:arac-listesi|teklif-al)\/)\)$/,
      );

      if (linkMatch) {
        return (
          <Link
            className="font-semibold text-corporate-blue underline decoration-current/40 underline-offset-4 transition-colors hover:text-brand-navy hover:decoration-current"
            data-article-cta-link="true"
            href={linkMatch[2]}
            key={index}
          >
            {linkMatch[1]}
          </Link>
        );
      }

      return part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      );
    });
}

function isBoundary(line: string) {
  return /^(#{2,3} |[-*] |\d+\. |> |\|)/.test(line);
}

export function ArticleContent({ markdown }: ArticleContentProps) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const sectionIds = getArticleTableOfContents(markdown);
  const nodes: ReactNode[] = [];
  let index = 0;
  let sectionIndex = 0;
  let skipSection = false;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line || line.startsWith("# ")) { index += 1; continue; }

    if (line.startsWith("## ")) {
      const heading = stripInlineMarkdown(line.slice(3));
      skipSection = hiddenSectionHeadings.has(heading);
      if (skipSection) { index += 1; continue; }

      const isTocHeading = !tableOfContentsExcludedHeadings.has(heading);
      const id = isTocHeading ? sectionIds[sectionIndex]?.id : undefined;
      if (isTocHeading) sectionIndex += 1;
      nodes.push(
        <h2
          className="mt-12 scroll-mt-28 text-heading-lg font-semibold text-pretty text-text-primary first:mt-0"
          data-article-section={id ? "true" : undefined}
          id={id}
          key={index}
        >
          {inline(line.slice(3))}
        </h2>,
      );
      index += 1;
      continue;
    }
    if (skipSection) { index += 1; continue; }

    if (line.startsWith("### ")) {
      nodes.push(<h3 className="mt-8 text-heading-md font-semibold text-pretty text-text-primary" key={index}>{inline(line.slice(4))}</h3>);
      index += 1; continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const cells = lines[index].trim().slice(1, -1).split("|").map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      const [head, ...rest] = rows;
      if (head) nodes.push(
        <div className="mt-6 overflow-x-auto rounded-card border border-border-subtle" key={index}>
          <table className="w-full min-w-[36rem] border-collapse text-left text-body">
            <thead className="bg-surface-muted"><tr>{head.map((cell) => <th className="border-b border-border-subtle p-4 font-semibold" key={cell}>{inline(cell)}</th>)}</tr></thead>
            <tbody>{rest.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td className="border-b border-border-subtle p-4 align-top last:border-b-0" key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\d+\. / : /^[-*] /;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(pattern, "")); index += 1;
      }
      const listClass = "mt-5 space-y-2 pl-6 text-body-lg text-text-secondary marker:text-corporate-blue";
      nodes.push(ordered
        ? <ol className={`${listClass} list-decimal`} key={index}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ol>
        : <ul className={`${listClass} list-disc`} key={index}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>);
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, "").replace(/\s{2}$/, "")); index += 1;
      }
      const isKeyTakeaway = stripInlineMarkdown(quote[0] ?? "") === "Önemli Çıkarım";

      if (isKeyTakeaway) {
        nodes.push(
          <aside
            aria-label="Önemli çıkarım"
            className="mt-8 border-y border-border-subtle py-5"
            data-article-key-takeaway="true"
            key={index}
          >
            <p className="text-label font-semibold tracking-wide text-corporate-blue uppercase">
              {stripInlineMarkdown(quote[0])}
            </p>
            {quote.slice(1).map((item, itemIndex) => (
              <p
                className="mt-2 max-w-[70ch] text-body-lg leading-relaxed text-text-primary"
                key={itemIndex}
              >
                {inline(item)}
              </p>
            ))}
          </aside>,
        );
      } else {
        nodes.push(
          <blockquote
            className="mt-8 border-l-2 border-border-control pl-5 text-body-lg leading-relaxed text-text-secondary italic"
            key={index}
          >
            {quote.map((item, itemIndex) => (
              <p className={itemIndex ? "mt-2" : undefined} key={itemIndex}>
                {inline(item)}
              </p>
            ))}
          </blockquote>,
        );
      }
      continue;
    }

    const paragraph = [line]; index += 1;
    while (index < lines.length && lines[index].trim() && !isBoundary(lines[index].trim())) {
      paragraph.push(lines[index].trim()); index += 1;
    }
    nodes.push(<p className="mt-5 max-w-[75ch] text-body-lg leading-relaxed text-text-secondary" key={index}>{inline(paragraph.join(" "))}</p>);
  }

  return <div data-article-content="true">{nodes}</div>;
}
