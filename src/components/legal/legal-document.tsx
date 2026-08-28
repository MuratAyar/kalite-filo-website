import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentProps = {
  readonly markdown: string;
  readonly locale?: "en" | "tr";
};

type TableOfContentsItem = {
  readonly id: string;
  readonly label: string;
};

const approvedInternalLinks = new Map([
  ["/aydinlatma-metni", "/aydinlatma-metni/"],
  ["/en/data-protection-and-security/", "/en/data-protection-and-security/"],
  ["/en/privacy-notice/", "/en/privacy-notice/"],
  ["/en/cookie-policy/", "/en/cookie-policy/"],
  ["/en/terms-of-use/", "/en/terms-of-use/"],
  ["/cerez-politikasi", "/cerez-politikasi/"],
  ["/kullanim-kosullari", "/kullanim-kosullari/"],
  ["/kvkk-ve-guvenlik", "/kvkk-ve-guvenlik/"],
]);

function stripDocumentScaffolding(markdown: string): string {
  return markdown
    .replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function headingSlug(value: string): string {
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

function getTableOfContents(markdown: string): readonly TableOfContentsItem[] {
  const occurrences = new Map<string, number>();

  return stripDocumentScaffolding(markdown)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => stripInlineMarkdown(line.slice(3)))
    .map((label) => {
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
    .split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

      if (linkMatch) {
        const [, label, target] = linkMatch;
        const href = approvedInternalLinks.get(target);

        if (href) {
          return (
            <Link
              className="font-semibold text-corporate-blue underline decoration-current/40 underline-offset-4 transition-colors hover:text-brand-navy hover:decoration-current"
              href={href}
              key={index}
            >
              {label}
            </Link>
          );
        }

        if (target.startsWith("#")) {
          return (
            <a
              className="font-semibold text-corporate-blue underline decoration-current/40 underline-offset-4 transition-colors hover:text-brand-navy hover:decoration-current"
              href={target}
              key={index}
            >
              {label}
            </a>
          );
        }

        return (
          <span key={index}>
            {label} <code className="text-label">{target}</code>
          </span>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            className="rounded-control bg-surface-muted px-1.5 py-0.5 text-[0.9em] text-text-primary"
            key={index}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return part;
    });
}

function isBoundary(line: string): boolean {
  return /^(#{1,4} |[-*] |\d+\. |> |\||---$)/.test(line);
}

function LegalDocumentBody({ markdown }: LegalDocumentProps) {
  const lines = stripDocumentScaffolding(markdown).split(/\r?\n/);
  const tableOfContents = getTableOfContents(markdown);
  const nodes: ReactNode[] = [];
  let index = 0;
  let sectionIndex = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line || line === "---" || line.startsWith("# ")) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      const item = tableOfContents[sectionIndex];
      sectionIndex += 1;
      nodes.push(
        <h2
          className="mt-12 scroll-mt-28 text-heading-md font-semibold text-pretty text-text-primary first:mt-0"
          id={item?.id}
          key={index}
        >
          {inline(line.slice(3))}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("### ") || line.startsWith("#### ")) {
      const level = line.startsWith("#### ") ? 4 : 3;
      const value = line.slice(level + 1);
      nodes.push(
        <h3
          className="mt-8 text-xl font-semibold text-pretty text-text-primary"
          key={index}
        >
          {inline(value)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const cells = lines[index]
          .trim()
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      const [head, ...body] = rows;
      if (head) {
        nodes.push(
          <div
            className="mt-6 overflow-x-auto rounded-card border border-border-subtle bg-surface-card"
            key={`table-${index}`}
          >
            <table className="w-full min-w-[42rem] border-collapse text-left text-body">
              <thead className="bg-surface-muted">
                <tr>
                  {head.map((cell, cellIndex) => (
                    <th
                      className="border-b border-border-subtle p-4 font-semibold text-text-primary"
                      key={cellIndex}
                      scope="col"
                    >
                      {inline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        className="border-b border-border-subtle p-4 align-top text-text-secondary last:border-b-0"
                        key={cellIndex}
                      >
                        {inline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const pattern = ordered ? /^\d+\. / : /^[-*] /;
      const items: string[] = [];
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(pattern, ""));
        index += 1;
      }
      const className =
        "mt-4 space-y-2 pl-6 text-body text-text-secondary marker:text-corporate-blue";
      nodes.push(
        ordered ? (
          <ol className={`${className} list-decimal`} key={`list-${index}`}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{inline(item)}</li>
            ))}
          </ol>
        ) : (
          <ul className={`${className} list-disc`} key={`list-${index}`}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>{inline(item)}</li>
            ))}
          </ul>
        ),
      );
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      nodes.push(
        <aside
          className="mt-6 rounded-card border-l-4 border-accent-orange bg-surface-muted px-5 py-4 text-body text-text-primary"
          key={`quote-${index}`}
        >
          {quote.map((item, itemIndex) => (
            <p className={itemIndex ? "mt-2" : undefined} key={itemIndex}>
              {inline(item)}
            </p>
          ))}
        </aside>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBoundary(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim().replace(/\s{2}$/, ""));
      index += 1;
    }
    nodes.push(
      <p
        className="mt-4 max-w-[75ch] text-body leading-relaxed text-text-secondary"
        key={`paragraph-${index}`}
      >
        {inline(paragraph.join(" "))}
      </p>,
    );
  }

  return <div>{nodes}</div>;
}

export function LegalDocument({ markdown, locale = "tr" }: LegalDocumentProps) {
  const tableOfContents = getTableOfContents(markdown);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-12">
      <article className="min-w-0 rounded-panel border border-border-subtle bg-surface-card px-5 py-7 shadow-sm sm:px-8 sm:py-10 lg:px-10">
        <LegalDocumentBody markdown={markdown} />
      </article>
      <aside className="rounded-card border border-border-subtle bg-surface-card p-5 lg:sticky lg:top-24">
        <h2 className="text-label font-semibold tracking-wide text-text-primary uppercase">
          {locale === "en" ? "Contents" : "İçindekiler"}
        </h2>
        <nav aria-label={locale === "en" ? "Page contents" : "Sayfa içeriği"} className="mt-4">
          <ol className="space-y-3">
            {tableOfContents.map((item) => (
              <li key={item.id}>
                <a
                  className="block text-label leading-relaxed text-text-secondary transition-colors hover:text-corporate-blue"
                  href={`#${item.id}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </div>
  );
}
