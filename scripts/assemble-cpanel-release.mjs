import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedTargets = new Set(["production", "staging"]);
const scriptPath = fileURLToPath(import.meta.url);
const defaultRepositoryRoot = fileURLToPath(new URL("..", import.meta.url));

export function assertComposerRuntimeExists(formsSource) {
  const autoloadPath = path.join(formsSource, "vendor", "autoload.php");
  if (!existsSync(autoloadPath)) {
    throw new Error(
      "PHPMailer runtime is missing at server/forms/vendor/autoload.php. "
        + "Run: composer --working-dir=server/forms install --no-dev --prefer-dist "
        + "--optimize-autoloader --no-interaction",
    );
  }
}

export function assertNoReleaseSecrets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const resolved = path.join(directory, entry.name);
    const lowerName = entry.name.toLowerCase();
    if (
      lowerName === ".env"
      || lowerName.startsWith(".env.")
      || lowerName === "kalite-filo-mail.php"
      || lowerName === "kalite-filo-admin.php"
      || (lowerName === "config.php" && path.basename(path.dirname(resolved)) === "admin-api")
    ) {
      throw new Error(`Secret-bearing runtime configuration found in release: ${resolved}`);
    }
    if (entry.isDirectory()) assertNoReleaseSecrets(resolved);
  }
}

function readArticleMarkdownBody(filePath) {
  if (!existsSync(filePath)) return null;
  const source = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const body = source.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n)?/, "").trim();
  return body !== "" && body.length <= 120000 ? body : null;
}

function parseEnglishArticleCopy(source) {
  const records = new Map();
  for (const match of source.matchAll(/^\s*"([a-z0-9-]+)":\s*\{([^\n]+)\},?\s*$/gm)) {
    const field = (name) => {
      const value = match[2].match(new RegExp(`${name}:\\s*("(?:[^"\\\\]|\\\\.)*")`))?.[1];
      if (!value) return null;
      try { return JSON.parse(value); } catch { return null; }
    };
    const slug = field("slug"); const title = field("title"); const excerpt = field("excerpt");
    if (slug && title && excerpt) records.set(match[1], { slug, title, excerpt, alt: field("alt") });
  }
  return records;
}

export function readVehicleMediaContract(repositoryRoot) {
  const contractPath = path.join(repositoryRoot, "src", "data", "vehicle-media.json");
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  if (contract?.schemaVersion !== 2 || !Array.isArray(contract.records)) {
    throw new Error("Vehicle media contract has an unsupported schema.");
  }
  const mediaById = {};
  for (const record of contract.records) {
    if (
      !record || typeof record !== "object"
      || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(record.vehicleId)
      || !/^[a-z0-9][a-z0-9-]*\.(?:jpg|jpeg|png|webp)$/.test(record.fileName)
      || !Number.isSafeInteger(record.width) || record.width <= 0
      || !Number.isSafeInteger(record.height) || record.height <= 0
      || (record.sortOrder !== undefined && (!Number.isSafeInteger(record.sortOrder) || record.sortOrder < 1))
      || !["alt", "creator", "licenseName", "localDerivativeNote"]
        .every((field) => typeof record[field] === "string" && record[field].trim() !== "")
      || (record.rightsBasis === "user-provided-for-site-use"
        ? record.sourcePage !== undefined || record.licenseUrl !== undefined
        : !/^https:\/\//.test(record.sourcePage) || !/^https:\/\//.test(record.licenseUrl))
      || !/^[a-f0-9]{64}$/.test(record.checksum)
    ) {
      throw new Error("Vehicle media contract contains an invalid record.");
    }
    const assetPath = path.join(repositoryRoot, "public", "images", "vehicles", record.fileName);
    if (!existsSync(assetPath)) throw new Error(`Vehicle media asset is missing: ${record.fileName}`);
    const checksum = createHash("sha256").update(readFileSync(assetPath)).digest("hex");
    if (checksum !== record.checksum) {
      throw new Error(`Vehicle media checksum mismatch: ${record.fileName}`);
    }
    const records = mediaById[record.vehicleId] ?? [];
    if (records.some((item) => item.fileName === record.fileName || item.sortOrder === (record.sortOrder ?? records.length + 1))) {
      throw new Error("Vehicle media contract contains a duplicate filename or sort order.");
    }
    records.push({ ...record, sortOrder: record.sortOrder ?? records.length + 1 });
    records.sort((left, right) => left.sortOrder - right.sortOrder);
    mediaById[record.vehicleId] = records;
  }
  return mediaById;
}

export function createAdminContentSnapshot(repositoryRoot, target) {
  const vehicles = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-portfolio.json"),
    "utf8",
  ));
  const featuredVehicleIds = JSON.parse(readFileSync(
    path.join(repositoryRoot,"src","data","featured-vehicle-ids.json"),"utf8",
  ));
  if(!Array.isArray(featuredVehicleIds)||featuredVehicleIds.length!==4||new Set(featuredVehicleIds).size!==4){throw new Error("Admin content snapshot requires exactly four ordered featured vehicle ids.");}
  const featuredOrderById=new Map(featuredVehicleIds.map((id,index)=>[id,index+1]));
  const articles = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "article-records.json"),
    "utf8",
  ));
  const englishArticleSourcePath = path.join(repositoryRoot, "src", "data", "articles.en.ts");
  const englishArticleSource = existsSync(englishArticleSourcePath)
    ? readFileSync(englishArticleSourcePath, "utf8") : "";
  const englishArticlesBySourceId = parseEnglishArticleCopy(englishArticleSource);
  const adminEnglishPath = path.join(repositoryRoot, "src", "data", "article-admin-records.en.json");
  const adminEnglishRecords = existsSync(adminEnglishPath) ? JSON.parse(readFileSync(adminEnglishPath, "utf8")) : [];
  if (!Array.isArray(adminEnglishRecords)) throw new Error("Admin English article registry must be an array.");
  for (const record of adminEnglishRecords) {
    if (!record || typeof record.sourceArticleId !== "string" || typeof record.slug !== "string" || typeof record.title !== "string" || typeof record.excerpt !== "string") throw new Error("Admin English article registry contains an invalid record.");
    englishArticlesBySourceId.set(record.sourceArticleId, record);
  }
  const articleContentRoot = path.join(repositoryRoot, "src", "content", "filo-rehberi");
  const prices = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-list-prices.json"), "utf8",
  ));
  const mediaById = readVehicleMediaContract(repositoryRoot);
  if (!Array.isArray(vehicles) || !Array.isArray(articles)) {
    throw new Error("Admin content snapshot sources must be JSON arrays.");
  }
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle?.id));
  if (Object.keys(mediaById).some((id) => !vehicleIds.has(id))) {
    throw new Error("Vehicle media contract references an unknown vehicle.");
  }
  if(featuredVehicleIds.some((id)=>!vehicles.some((vehicle)=>vehicle?.id===id))){throw new Error("Admin content snapshot featured order references an unknown vehicle.");}
  if (featuredVehicleIds.some((id) => !mediaById[id])) {
    throw new Error("Admin content snapshot featured vehicle is missing licensed media.");
  }
  return {
    schemaVersion: 1,
    environment: target,
    generatedAt: new Date().toISOString(),
    vehicles: {
      active: vehicles.filter((vehicle) => vehicle?.sourceStatus === "active").length,
      featured: featuredVehicleIds.length,
      records: vehicles.map((vehicle) => ({
        ...vehicle,
        featured: featuredOrderById.has(vehicle.id),
        ...(featuredOrderById.has(vehicle.id)?{featuredOrder:featuredOrderById.get(vehicle.id)}:{}),
        publicationStatus: vehicle.sourceStatus === "active" ? "published" : "unpublished",
        priceAmountMinor: prices.amountsMinor?.[vehicle.sourceId] ?? null,
        coverImage: mediaById[vehicle.id]?.[0] ? {
          ...mediaById[vehicle.id][0],
          src: `/images/vehicles/cards/${mediaById[vehicle.id][0].fileName}`,
        } : null,
        galleryImages: (mediaById[vehicle.id] ?? []).map((media) => ({
          ...media,
          src: `/images/vehicles/${media.fileName}`,
        })),
      })),
      featuredIds: featuredVehicleIds,
    },
    articles: {
      total: articles.length,
      draft: articles.filter((article) => article?.publicationStatus === "draft").length,
      records: articles.map((article) => {
        const englishArticle = englishArticlesBySourceId.get(article.id) ?? null;
        const englishSlug = englishArticle?.slug ?? null;
        const turkishMarkdown = readArticleMarkdownBody(
          path.join(articleContentRoot, `${article.contentKey}.md`),
        );
        const englishMarkdown = typeof englishSlug === "string"
          ? readArticleMarkdownBody(path.join(articleContentRoot, `${englishSlug}-en.md`)) : null;
        const turkishCoverAlt = article.coverAlt ?? article.coverImage?.alt;
        const importDraft = turkishMarkdown && article.title && article.excerpt
          && article.categoryId && article.publishedAt && article.readingMinutes
          && turkishCoverAlt && article.seo?.title && article.seo?.description ? {
            categoryId: article.categoryId,
            featured: article.featured === true,
            locales: {
              tr: {
                status: "ready", title: article.title, slug: article.slug,
                excerpt: article.excerpt, coverAlt: turkishCoverAlt,
                publishedAt: article.publishedAt, readingMinutes: article.readingMinutes,
                seoTitle: article.seo.title, metaDescription: article.seo.description,
                markdown: turkishMarkdown,
              },
              en: englishArticle && englishMarkdown ? {
                status: "ready", title: englishArticle.title, slug: englishArticle.slug,
                excerpt: englishArticle.excerpt,
                coverAlt: englishArticle.coverAlt ?? englishArticle.coverImage?.alt ?? englishArticle.alt ?? turkishCoverAlt,
                publishedAt: englishArticle.publishedAt ?? article.publishedAt, readingMinutes: englishArticle.readingMinutes ?? article.readingMinutes,
                seoTitle: englishArticle.seo?.title ?? `${englishArticle.title} | Kalite Filo`,
                metaDescription: englishArticle.seo?.description ?? englishArticle.excerpt, markdown: englishMarkdown,
              } : null,
            },
          } : null;
        return {
          ...article,
          publicationStatus: article.publicationStatus ?? "approved",
          translations: {
            tr: { complete: turkishMarkdown !== null },
            en: {
              complete: englishMarkdown !== null,
              slug: englishSlug,
            },
          },
          importDraft,
        };
      }),
    },
  };
}

export function assembleCpanelRelease(target, repositoryRoot = defaultRepositoryRoot) {
  if (!allowedTargets.has(target)) {
    throw new Error(
      `Release target must be one of: ${Array.from(allowedTargets).join(", ")}.`,
    );
  }

  const staticOutput = path.resolve(repositoryRoot, "out");
  const releaseBase = path.resolve(repositoryRoot, "release");
  const releaseRoot = path.resolve(releaseBase, target);
  const formsSource = path.resolve(repositoryRoot, "server", "forms");
  const adminApiSource = path.resolve(repositoryRoot, "server", "admin-api");

  if (!releaseRoot.startsWith(`${releaseBase}${path.sep}`)) {
    throw new Error("Resolved release path escaped the project release directory.");
  }

  if (!existsSync(path.join(staticOutput, "index.html"))) {
    throw new Error("Static output is missing. Run the matching build before assembly.");
  }

  for (const requiredFile of [
    "teklif.php",
    "iletisim.php",
    "bulten.php",
    "customer-mailer.php",
    "export-iys-daily.php",
    "subscriber-store.php",
    "form-submission-store.php",
    "unsubscribe-store.php",
    "unsubscribe.php",
    "quote-mailer.php",
    "composer.json",
    "composer.lock",
  ]) {
    if (!existsSync(path.join(formsSource, requiredFile))) {
      throw new Error(`Required quote-form release source is missing: server/forms/${requiredFile}`);
    }
  }
  const adminRuntimeFiles = [
    "bootstrap.php",
    "auth.php",
    "read-model.php",
    "session.php",
    "login.php",
    "logout.php",
    "dashboard.php",
    "audit.php",
    "articles.php",
    "article-store.php",
    "article-preview.php",
    "article.php",
    "article-revisions.php",
    "article-import.php",
    "subscribers.php",
    "iys.php",
    "iys-export.php",
    "iys-download.php",
    "subscriber-operation.php",
    "campaign-store.php",
    "campaigns.php",
    "campaign.php",
    "campaign-preview.php",
    "campaign-test-mailer.php",
    "campaign-test.php",
    "campaign-queue-store.php",
    "campaign-queue.php",
    "campaign-worker.php",
    "vehicle-store.php",
    "vehicles.php",
    "vehicle.php",
    "vehicle-revisions.php",
    "vehicle-media.php",
    "media.php",
    "media-store.php",
    "media-update.php",
    "media-file.php",
    "media-delete.php",
    "taxonomy-store.php",
    "tags.php",
    "featured-vehicles.php",
    "featured-article-store.php",
    "featured-articles.php",
    "publishing-store.php",
    "publishing.php",
    "publishing-change-revert.php",
    "publishing-history.php",
    "publish-staging.php",
    "publish-restore.php",
    "publish-request-download.php",
    "publish-runner-result.php",
    "publishing-automation.php",
    "publishing-deployment.php",
    "publish-runner-request.php",
    "publish-runner-media.php",
    "publish-runner-upload.php",
    "publish-runner-deploy.php",
    "publish-runner-rollback.php",
    "publish-runner-complete.php",
    "publish-runner-fail.php",
    "form-submissions.php",
    "form-submission.php",
    "form-submission-reply.php",
    "form-submission-mailer.php",
  ];
  for (const requiredFile of adminRuntimeFiles) {
    if (!existsSync(path.join(adminApiSource, requiredFile))) {
      throw new Error(`Required admin API release source is missing: server/admin-api/${requiredFile}`);
    }
  }
  assertComposerRuntimeExists(formsSource);
  assertNoReleaseSecrets(staticOutput);
  assertNoReleaseSecrets(path.join(formsSource, "vendor"));

  rmSync(releaseRoot, { force: true, recursive: true });
  mkdirSync(releaseRoot, { recursive: true });
  cpSync(staticOutput, releaseRoot, { recursive: true });

  const formsDirectory = path.join(releaseRoot, "forms");
  mkdirSync(formsDirectory, { recursive: true });
  for (const runtimeFile of [
    "teklif.php",
    "iletisim.php",
    "bulten.php",
    "customer-mailer.php",
    "export-iys-daily.php",
    "subscriber-store.php",
    "form-submission-store.php",
    "unsubscribe-store.php",
    "unsubscribe.php",
    "quote-mailer.php",
    "composer.json",
    "composer.lock",
  ]) {
    copyFileSync(path.join(formsSource, runtimeFile), path.join(formsDirectory, runtimeFile));
  }
  cpSync(path.join(formsSource, "vendor"), path.join(formsDirectory, "vendor"), {
    recursive: true,
  });

  const adminApiDirectory = path.join(releaseRoot, "admin-api");
  mkdirSync(adminApiDirectory, { recursive: true });
  for (const runtimeFile of adminRuntimeFiles) {
    copyFileSync(
      path.join(adminApiSource, runtimeFile),
      path.join(adminApiDirectory, runtimeFile),
    );
  }
  const snapshot = createAdminContentSnapshot(repositoryRoot, target);
  const encodedSnapshot = Buffer.from(JSON.stringify(snapshot), "utf8").toString("base64");
  writeFileSync(
    path.join(adminApiDirectory, "_content-snapshot.php"),
    `<?php\ndeclare(strict_types=1);\nif (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }\nreturn json_decode(base64_decode('${encodedSnapshot}', true), true, 8, JSON_THROW_ON_ERROR);\n`,
    { encoding: "utf8", mode: 0o644 },
  );

  assertNoReleaseSecrets(releaseRoot);
  return releaseRoot;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(scriptPath)) {
  const releaseRoot = assembleCpanelRelease(process.argv[2]);
  console.log(`cPanel ${process.argv[2]} release assembled at ${releaseRoot}`);
}
