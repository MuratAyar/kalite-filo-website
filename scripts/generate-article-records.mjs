import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contentRoot = path.join(repositoryRoot, "src", "content", "filo-rehberi");
const outputPath = path.join(repositoryRoot, "src", "data", "article-records.json");

const categoryIds = new Map([
  ["Uzun Dönem Kiralama", "uzun-donem-kiralama"],
  ["Maliyet ve Finans", "maliyet-ve-finans"],
  ["Araç Rehberi", "arac-rehberi"],
  ["Filo Yönetimi", "filo-yonetimi"],
  ["Elektrikli Araçlar", "elektrikli-araclar"],
  ["Bakım ve Hasar", "bakim-ve-hasar"],
]);

const approvedCovers = new Map([
  ["operasyonel-arac-kiralama-nedir", {
    src: "/images/filo-rehberi/01-operasyonel-arac-kiralama.webp",
    alt: "Havadan çekilmiş, sıralar halinde park edilmiş otomobiller",
  }],
  ["filo-toplam-sahip-olma-maliyeti-tco", {
    src: "/images/filo-rehberi/02-filo-tco-maliyet.webp",
    alt: "Hesap makinesi, ABD doları banknotları ve otomobil anahtarı",
  }],
  ["kurumsal-filoda-dogru-arac-secimi", {
    src: "/images/filo-rehberi/03-dogru-arac-secimi.webp",
    alt: "Otoparkta sıralanmış SUV araçlar",
  }],
  ["filo-kiralama-kilometre-limiti-nasil-belirlenir", {
    src: "/images/filo-rehberi/04-kilometre-limiti.webp",
    alt: "86490 kilometreyi gösteren otomobil gösterge paneli",
  }],
  ["elektrikli-araclar-sirket-filosu-gecis-rehberi", {
    src: "/images/filo-rehberi/05-elektrikli-filo.webp",
    alt: "Supercharger istasyonunda şarj edilen beyaz Tesla otomobil",
  }],
  ["filo-bakim-hasar-yonetimi", {
    src: "/images/filo-rehberi/06-bakim-hasar-yonetimi.webp",
    alt: "Servis atölyesinde otomobil üzerinde çalışan teknisyen",
  }],
]);

function readQuotedField(frontmatter, field) {
  const match = frontmatter.match(
    new RegExp(`^${field}:\\s*"(?<value>.*)"\\s*$`, "m"),
  );
  if (!match?.groups?.value) {
    throw new Error(`Missing ${field} in article frontmatter.`);
  }
  return match.groups.value;
}

function slugify(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseArticle(fileName) {
  const markdown = readFileSync(path.join(contentRoot, fileName), "utf8");
  const frontmatter = markdown.match(/^---\s*\r?\n(?<value>[\s\S]*?)\r?\n---/)
    ?.groups?.value;
  if (!frontmatter) {
    throw new Error(`Invalid frontmatter in ${fileName}.`);
  }

  const slug = readQuotedField(frontmatter, "slug");
  const categoryLabel = readQuotedField(frontmatter, "category");
  const categoryId = categoryIds.get(categoryLabel);
  if (!categoryId) {
    throw new Error(`Unknown category ${categoryLabel} in ${fileName}.`);
  }

  const excerpt = markdown.match(
    /^## Kart Özeti\s*\r?\n\s*(?<value>.+?)\r?\n\s*## /ms,
  )?.groups?.value.trim();
  if (!excerpt) {
    throw new Error(`Missing card summary in ${fileName}.`);
  }

  const tagsBlock = frontmatter.match(
    /^tags:[ \t]*\r?\n(?<value>(?:^[ \t]+-[ \t]+"[^"]+"[ \t]*\r?\n?)+)/m,
  )?.groups?.value;
  const tagIds = [...(tagsBlock?.matchAll(/"(?<value>[^"]+)"/g) ?? [])]
    .map((match) => slugify(match.groups.value));
  const readingMinutes = Number.parseInt(
    readQuotedField(frontmatter, "reading_time"),
    10,
  );
  const featured = /^featured:\s*true\s*$/m.test(frontmatter);
  const approvedCover = approvedCovers.get(slug);

  return {
    id: slug,
    slug,
    title: readQuotedField(frontmatter, "title"),
    excerpt,
    categoryId,
    tagIds,
    publishedAt: readQuotedField(frontmatter, "publish_date"),
    readingMinutes,
    featured,
    coverImage: approvedCover
      ? { ...approvedCover, width: 1600, height: 900 }
      : null,
    contentKey: slug,
    seo: {
      title: readQuotedField(frontmatter, "seo_title"),
      description: readQuotedField(frontmatter, "meta_description"),
    },
  };
}

const records = readdirSync(contentRoot)
  .filter((fileName) => fileName.endsWith(".md"))
  .filter((fileName) => !["IMAGE-LICENSE.md", "README.md"].includes(fileName))
  .map(parseArticle)
  .sort(
    (left, right) =>
      Number(right.featured) - Number(left.featured) ||
      right.publishedAt.localeCompare(left.publishedAt),
  );

if (records.length !== 18) {
  throw new Error(`Expected 18 article records, received ${records.length}.`);
}

writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} article records.`);
