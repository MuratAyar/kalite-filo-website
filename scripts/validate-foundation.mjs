import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCurrentPublicNavigationRouteId } from "../src/lib/navigation-route-matching.mjs";
import { formatVehicleListNetPrice } from "../src/lib/vehicle-list-price.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const routeRegistryPath = path.join(
  repositoryRoot,
  "src",
  "config",
  "approved-routes.json",
);
const brandLogoRelativePath = "images/brand/kalite-filo-logo.png";
const vehiclePortfolioPath = path.join(
  repositoryRoot,
  "src",
  "data",
  "vehicle-portfolio.json",
);
const vehicleListPricePath = path.join(
  repositoryRoot,
  "src",
  "data",
  "vehicle-list-prices.json",
);
const featuredVehicleIdsPath = path.join(repositoryRoot,"src","data","featured-vehicle-ids.json");
const vehiclePortfolioWorkbookPath = path.join(
  repositoryRoot,
  "references",
  "source-data",
  "vehicle-portfolio",
  "Kalite_Filo_32_Arac_Portfoyu_2026.xlsx",
);
const articleRecordsPath = path.join(
  repositoryRoot,
  "src",
  "data",
  "article-records.json",
);
const articleContentRoot = path.join(
  repositoryRoot,
  "src",
  "content",
  "filo-rehberi",
);
const articleSourceArchivePath = path.join(
  repositoryRoot,
  "references",
  "source-data",
  "filo-rehberi-18-blog",
  "kalite-filo-filo-rehberi-18-blog.zip",
);
const quotePhpSourcePath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "teklif.php",
);
const contactPhpSourcePath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "iletisim.php",
);
const newsletterPhpSourcePath = path.join(repositoryRoot, "server", "forms", "bulten.php");
const subscriberStoreSourcePath = path.join(repositoryRoot, "server", "forms", "subscriber-store.php");
const quoteMailerSourcePath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "quote-mailer.php",
);
const quoteMailExamplePath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "kalite-filo-mail.example.php",
);
const quoteComposerJsonPath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "composer.json",
);
const quoteComposerLockPath = path.join(
  repositoryRoot,
  "server",
  "forms",
  "composer.lock",
);
const expectedArticleArchiveHash =
  "b8100d2419c1e77f250995e19f8d3e8277ddf6f7b38ec8b9cca41a6fe7fadead";
const approvedClientComponents = new Set([
  "src/components/admin/admin-app.tsx",
  "src/components/admin/audit-log-view.tsx",
  "src/components/admin/article-list-view.tsx",
  "src/components/admin/media-library-view.tsx",
  "src/components/admin/subscriber-list-view.tsx",
  "src/components/admin/iys-management-view.tsx",
  "src/components/admin/campaign-manager.tsx",
  "src/components/admin/form-submissions-view.tsx",
  "src/components/admin/publishing-center.tsx",
  "src/components/admin/vehicle-manager.tsx",
  "src/components/admin/tag-manager.tsx",
  "src/components/admin/featured-vehicles-manager.tsx",
  "src/components/contact/contact-form.tsx",
  "src/components/editorial/article-share-actions.tsx",
  "src/components/editorial/fleet-guide-listing.tsx",
  "src/components/faq/faq-category-filter.tsx",
  "src/components/forms/quote-form.tsx",
  "src/components/home/newsletter-signup-demo.tsx",
  "src/components/home/vehicle-finder-fields.tsx",
  "src/components/layout/footer-preference-menus.tsx",
  "src/components/layout/mobile-page-start.tsx",
  "src/components/navigation/primary-navigation.tsx",
  "src/components/navigation/cart-count-badge.tsx",
  "src/components/privacy/consent-aware-map.tsx",
  "src/components/privacy/privacy-preferences.tsx",
  "src/components/privacy/privacy-settings-button.tsx",
  "src/components/vehicles/mobile-vehicle-filter-dialog.tsx",
  "src/components/vehicles/related-vehicle-carousel-controls.tsx",
  "src/components/vehicles/vehicle-image-gallery.tsx",
  "src/components/vehicles/vehicle-offer-controls.tsx",
  "src/components/vehicles/vehicle-query-state.tsx",
]);

const forbiddenRoutePrefixes = [
  "/musteri-girisi/",
  "/login/",
  "/portal/",
  "/auth/",
  "/crm/",
  "/admin/",
  "/api/",
];

const approvedRouteFamilyPaths = new Set([
  "/arac-listesi/[slug]/",
  "/filo-rehberi/[category]/",
  "/filo-rehberi/[category]/[slug]/",
]);

const requiredHomeMainPaths = [
  "/teklif-al/",
  "/arac-listesi/",
  "/filo-rehberi/",
];

const headerNavigationRouteIds = new Set([
  "about",
  "vehicles",
  "fleet-guide",
  "faq",
  "quote",
]);

const siteEnvironments = {
  production: {
    origin: "https://kalitefilo.com.tr",
    allowsCrawling: true,
    allowsSearchIndexing: true,
  },
  staging: {
    origin: "https://staging.kalitefilo.com.tr",
    allowsCrawling: false,
    allowsSearchIndexing: false,
  },
};

const forbiddenDependencies = [
  "@auth/core",
  "@prisma/client",
  "@supabase/supabase-js",
  "drizzle-orm",
  "firebase",
  "mongoose",
  "next-auth",
  "prisma",
  "sequelize",
  "typeorm",
];

function fail(message) {
  throw new Error(message);
}

function readPngMetadata(filePath) {
  const content = readFileSync(filePath);
  const pngSignature = "89504e470d0a1a0a";

  if (
    content.length < 26 ||
    content.subarray(0, 8).toString("hex") !== pngSignature ||
    content.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    fail(`${path.relative(repositoryRoot, filePath)} is not a valid PNG asset.`);
  }

  return {
    bytes: content.length,
    colorType: content.readUInt8(25),
    height: content.readUInt32BE(20),
    width: content.readUInt32BE(16),
  };
}

function validateBrandLogoAsset(baseDirectory) {
  const logoPath = path.join(baseDirectory, brandLogoRelativePath);

  if (!existsSync(logoPath)) {
    fail(`Missing approved local brand logo: ${logoPath}`);
  }

  const metadata = readPngMetadata(logoPath);

  if (metadata.width !== 560 || metadata.height !== 112) {
    fail("The optimized brand logo must remain 560 by 112 pixels.");
  }

  if (metadata.colorType !== 4 && metadata.colorType !== 6) {
    fail("The optimized brand logo must preserve PNG transparency.");
  }

  if (metadata.bytes > 100_000) {
    fail("The optimized header logo is unexpectedly large.");
  }
}

function validateVehiclePortfolioSource() {
  if (
    !existsSync(vehiclePortfolioPath) ||
    !existsSync(vehicleListPricePath) ||
    !existsSync(vehiclePortfolioWorkbookPath) ||
    !existsSync(featuredVehicleIdsPath)
  ) {
    fail("The owner-supplied vehicle portfolio source or its local typed extract is missing.");
  }

  const records = JSON.parse(readFileSync(vehiclePortfolioPath, "utf8"));
  const featuredVehicleIds = JSON.parse(readFileSync(featuredVehicleIdsPath,"utf8"));
  const listPriceSource = JSON.parse(
    readFileSync(vehicleListPricePath, "utf8"),
  );
  if (!Array.isArray(records) || records.length !== 32) {
    fail("The owner-supplied vehicle portfolio must contain exactly 32 records.");
  }
  if(!Array.isArray(featuredVehicleIds)||featuredVehicleIds.length!==4||new Set(featuredVehicleIds).size!==4){fail("The featured vehicle ordering contract must contain exactly four unique ids.");}

  const ids = new Set();
  const sourceIds = new Set();
  const slugs = new Set();
  let featuredCount = 0;

  const workbookHash = createHash("sha256")
    .update(readFileSync(vehiclePortfolioWorkbookPath))
    .digest("hex")
    .toUpperCase();
  if (
    workbookHash !== listPriceSource.source?.workbookSha256 ||
    listPriceSource.source?.sheet !== "Portföy_32" ||
    listPriceSource.source?.column !== "Önerilen Liste Net" ||
    listPriceSource.source?.currency !== "TRY" ||
    listPriceSource.source?.billingPeriod !== "month" ||
    listPriceSource.source?.vatTreatment !== "excluded" ||
    listPriceSource.source?.approvalStatus !== "owner-approved-list-net"
  ) {
    fail("The owner-approved vehicle list-price source contract is invalid.");
  }

  const listPriceEntries = Object.entries(listPriceSource.amountsMinor ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const listPriceFingerprint = createHash("sha256")
    .update(
      listPriceEntries
        .map(([sourceId, amountMinor]) => `${sourceId}:${amountMinor / 100}`)
        .join("|"),
    )
    .digest("hex");
  if (
    listPriceEntries.length !== 32 ||
    listPriceFingerprint !==
      "d68b4b7e5b8a88b12bcc2f364bc591529474c7e9ff6f794dd6bc24dc7b074545"
  ) {
    fail("The owner-approved 32-record list-price mapping has changed.");
  }

  for (const record of records) {
    if (ids.has(record.id) || slugs.has(record.slug)) {
      fail("The owner-supplied vehicle portfolio contains a duplicate id or slug.");
    }
    ids.add(record.id);
    sourceIds.add(record.sourceId);
    slugs.add(record.slug);

    if (
      record.contentStatus !== "owner-supplied" ||
      record.sourceStatus !== "active" ||
      record.priceStatus !== "owner-approved-list-net"
    ) {
      fail(`Vehicle portfolio ${record.id} has an unsupported source or price state.`);
    }

    if (
      "offer" in record ||
      "price" in record ||
      "amountMinor" in record ||
      "benchmarkPrice" in record
    ) {
      fail(`Vehicle portfolio ${record.id} must keep list prices in the approved price source.`);
    }

    const amountMinor = listPriceSource.amountsMinor?.[record.sourceId];
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0 ||
      amountMinor % 100 !== 0
    ) {
      fail(`Vehicle portfolio ${record.id} is missing a valid owner-approved list-net price.`);
    }

    if (record.featured) {
      featuredCount += 1;
    }
  }

  if (featuredCount !== 4) {
    fail("The Home vehicle portfolio must contain exactly four featured records.");
  }
  if(featuredVehicleIds.some((id)=>!ids.has(id))||records.some((record)=>Boolean(record.featured)!==featuredVehicleIds.includes(record.id))){fail("Featured vehicle flags and the explicit ordering contract do not match.");}

  if (
    sourceIds.size !== listPriceEntries.length ||
    listPriceEntries.some(([sourceId]) => !sourceIds.has(sourceId))
  ) {
    fail("Vehicle portfolio and owner-approved list-price source ids do not match.");
  }

  for (const relativePath of [
    "images/vehicles/renault-clio.jpg",
    "images/vehicles/hyundai-i20.jpg",
    "images/vehicles/opel-corsa.jpg",
    "images/vehicles/fiat-egea-tipo-sedan.jpg",
    "images/vehicles/LICENSES.md",
  ]) {
    if (!existsSync(path.join(repositoryRoot, "public", relativePath))) {
      fail(`Vehicle portfolio asset is missing: ${relativePath}`);
    }
  }
}

function validateArticleSource() {
  if (!existsSync(articleSourceArchivePath)) {
    fail("The user-supplied 18-article source archive is missing.");
  }
  const archiveHash = createHash("sha256")
    .update(readFileSync(articleSourceArchivePath))
    .digest("hex");
  if (archiveHash !== expectedArticleArchiveHash) {
    fail("The 18-article source archive hash does not match the approved package.");
  }

  const records = JSON.parse(readFileSync(articleRecordsPath, "utf8"));
  if (!Array.isArray(records) || records.length !== 18) {
    fail("Filo Rehberi must contain exactly 18 supplied article records.");
  }

  const ids = new Set(records.map((record) => record.id));
  const slugs = new Set(records.map((record) => record.slug));
  if (ids.size !== 18 || slugs.size !== 18) {
    fail("Filo Rehberi article ids and slugs must be unique.");
  }
  if (records.filter((record) => record.featured === true).length !== 1) {
    fail("Filo Rehberi must have exactly one featured article.");
  }

  const categoryCounts = new Map();
  for (const record of records) {
    categoryCounts.set(
      record.categoryId,
      (categoryCounts.get(record.categoryId) ?? 0) + 1,
    );
    const contentPath = path.join(articleContentRoot, `${record.contentKey}.md`);
    if (!existsSync(contentPath)) {
      fail(`Filo Rehberi is missing Markdown content for ${record.id}.`);
    }
    if (record.coverImage) {
      if (
        typeof record.coverImage.src !== "string" ||
        !record.coverImage.src.startsWith("/images/filo-rehberi/") ||
        !record.coverImage.src.endsWith(".webp")
      ) {
        fail(`Article ${record.id} has an invalid local cover path.`);
      }
      if (!existsSync(path.join(repositoryRoot, "public", record.coverImage.src.slice(1)))) {
        fail(`Article ${record.id} references a missing local cover.`);
      }
    }
  }
  if (
    categoryCounts.size !== 6 ||
    [...categoryCounts.values()].some((count) => count !== 3)
  ) {
    fail("The supplied Filo Rehberi package must keep three articles in each of six categories.");
  }
  if (records.filter((record) => record.coverImage).length !== 6) {
    fail("Only the six previously rights-cleared article covers may be assigned.");
  }
}

export function isValidInternalPath(value, options = {}) {
  const { allowFamily = false } = options;

  if (value === "/") {
    return true;
  }

  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    !value.endsWith("/") ||
    value.includes("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return false;
  }

  const segments = value.slice(1, -1).split("/");
  return segments.every((segment) => {
    if (allowFamily && /^\[[a-z]+\]$/.test(segment)) {
      return true;
    }

    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment);
  });
}

export function getRouteRobotsPolicy(route, deployTarget) {
  const environment = siteEnvironments[deployTarget];

  if (!environment) {
    fail(`Unsupported deployment target: ${deployTarget}`);
  }

  const indexable =
    environment.allowsSearchIndexing &&
    route.status === "published" &&
    route.indexable === true;

  return {
    index: indexable,
    follow: indexable,
    nocache: deployTarget === "staging",
  };
}

export function validateRoutes(routes) {
  if (!Array.isArray(routes)) {
    fail("The approved route registry must contain an array.");
  }

  const ids = new Set();
  const paths = new Set();

  for (const route of routes) {
    if (!route || typeof route !== "object") {
      fail("Every approved route entry must be an object.");
    }

    if (typeof route.id !== "string" || route.id.trim() === "") {
      fail("Every approved route entry needs a non-empty id.");
    }

    if (ids.has(route.id)) {
      fail(`Duplicate route id: ${route.id}`);
    }
    ids.add(route.id);

    if (route.kind !== "static" && route.kind !== "family") {
      fail(`Route ${route.id} has an unsupported kind.`);
    }

    if (
      !isValidInternalPath(route.path, {
        allowFamily: route.kind === "family",
      })
    ) {
      fail(`Route ${route.id} has a malformed internal path: ${route.path}`);
    }

    if (route.kind === "family" && !/\[[a-z]+\]/.test(route.path)) {
      fail(`Route family ${route.id} must contain a dynamic segment.`);
    }

    if (
      route.kind === "family" &&
      !approvedRouteFamilyPaths.has(route.path)
    ) {
      fail(`Route family ${route.id} uses an unapproved path pattern.`);
    }

    if (route.kind === "static" && /\[[a-z]+\]/.test(route.path)) {
      fail(`Static route ${route.id} cannot contain a dynamic segment.`);
    }

    if (paths.has(route.path)) {
      fail(`Duplicate route path: ${route.path}`);
    }
    paths.add(route.path);

    if (typeof route.label !== "string" || route.label.trim() === "") {
      fail(`Route ${route.id} needs a non-empty label.`);
    }

    if (
      !["foundation", "canonical-path", "published"].includes(route.status)
    ) {
      fail(`Route ${route.id} has an unsupported status.`);
    }

    if (typeof route.indexable !== "boolean" || typeof route.sitemap !== "boolean") {
      fail(`Route ${route.id} needs boolean indexable and sitemap flags.`);
    }

    if ((route.indexable || route.sitemap) && route.status !== "published") {
      fail(`Unpublished route ${route.id} cannot be indexable or in the sitemap.`);
    }

    if (route.sitemap && !route.indexable) {
      fail(`Route ${route.id} cannot enter the sitemap while noindex.`);
    }

    const normalizedPath = route.path.replace("[slug]", "slug");
    if (
      forbiddenRoutePrefixes.some(
        (prefix) =>
          normalizedPath === prefix.slice(0, -1) ||
          normalizedPath.startsWith(prefix),
      )
    ) {
      fail(`Route ${route.id} uses a prohibited Phase 1 path.`);
    }
  }

  return routes;
}

function walkFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
  });
}

function validateSourceArchitecture() {
  const sourceRoot = path.join(repositoryRoot, "src");
  const sourceFiles = walkFiles(sourceRoot).filter((file) =>
    /\.(?:ts|tsx|js|jsx|mjs|json|css)$/.test(file),
  );
  const clientComponents = [];
  const sourceRules = [
    [/^[\t ]*["']use server["']/m, 'the "use server" directive'],
    [/from\s+["']next\/headers["']/, "Next request APIs"],
    [/\b(?:cookies|headers|draftMode)\s*\(/, "a request-time Next API"],
    [/export\s+const\s+revalidate\b/, "ISR/revalidation configuration"],
    [/dynamic\s*=\s*["']force-dynamic["']/, "forced dynamic rendering"],
    [/href\s*=\s*["']#["']/, "a placeholder # link"],
    [
      /https?:\/\/(?:lh3\.googleusercontent\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.tailwindcss\.com)/,
      "a prohibited external design/font/runtime asset",
    ],
    [
      /material(?:[\s_-]+)symbols/i,
      "a prohibited Material Symbols design artifact",
    ],
  ];
  const prohibitedPublicRoutePattern =
    /["'`]\/(?:musteri-girisi|login|portal|auth|crm|admin|api)(?:\/|["'`])/i;

  for (const file of sourceFiles) {
    const relativePath = path.relative(repositoryRoot, file).replaceAll("\\", "/");
    const basename = path.basename(file);

    if (/^route\.(?:ts|tsx|js|jsx)$/.test(basename)) {
      fail(`Runtime Route Handler is prohibited: ${relativePath}`);
    }

    if (/^(?:middleware|proxy)\.(?:ts|tsx|js|jsx)$/.test(basename)) {
      fail(`Middleware/Proxy is prohibited: ${relativePath}`);
    }

    const content = readFileSync(file, "utf8");
    if (/^[\t ]*["']use client["']/m.test(content)) {
      clientComponents.push(relativePath);
    }

    for (const [pattern, description] of sourceRules) {
      if (pattern.test(content)) {
        fail(`${relativePath} contains ${description}.`);
      }
    }
    const isAdminSource =
      relativePath.startsWith("src/app/(admin)/")
      || relativePath.startsWith("src/components/admin/")
      || relativePath === "src/app/robots.ts";
    if (!isAdminSource && prohibitedPublicRoutePattern.test(content)) {
      fail(`${relativePath} contains a prohibited Phase 1 route.`);
    }
  }

  for (const clientComponent of clientComponents) {
    if (!approvedClientComponents.has(clientComponent)) {
      fail(`Unapproved Client Component found: ${clientComponent}`);
    }
  }

  for (const approvedClientComponent of approvedClientComponents) {
    if (!clientComponents.includes(approvedClientComponent)) {
      fail(`Expected approved Client Component is missing: ${approvedClientComponent}`);
    }
  }

  return clientComponents;
}

export function validateQuotePhpSource({ requireComposerLock = true } = {}) {
  for (const [sourcePath, description] of [
    [quotePhpSourcePath, "quote PHP endpoint"],
    [contactPhpSourcePath, "contact PHP endpoint"],
    [newsletterPhpSourcePath, "newsletter PHP endpoint"],
    [subscriberStoreSourcePath, "durable subscriber store"],
    [quoteMailerSourcePath, "authenticated SMTP boundary"],
    [quoteMailExamplePath, "secret-free mail configuration example"],
    [quoteComposerJsonPath, "quote-form Composer manifest"],
  ]) {
    if (!existsSync(sourcePath)) {
      fail(`The approved ${description} source is missing.`);
    }
  }
  if (requireComposerLock && !existsSync(quoteComposerLockPath)) {
    fail(
      "The quote-form Composer lock is missing. Run composer --working-dir=server/forms install --no-dev --prefer-dist --optimize-autoloader --no-interaction.",
    );
  }

  const content = readFileSync(quotePhpSourcePath, "utf8");
  const contactContent = readFileSync(contactPhpSourcePath, "utf8");
  const newsletterContent = readFileSync(newsletterPhpSourcePath, "utf8");
  const subscriberStoreContent = readFileSync(subscriberStoreSourcePath, "utf8");
  const mailerContent = readFileSync(quoteMailerSourcePath, "utf8");
  const exampleContent = readFileSync(quoteMailExamplePath, "utf8");
  const composerManifest = JSON.parse(readFileSync(quoteComposerJsonPath, "utf8"));
  const requiredContracts = [
    [/declare\s*\(strict_types\s*=\s*1\)/, "strict PHP typing"],
    [/require_once __DIR__ \. '\/quote-mailer\.php'/, "the SMTP mailer boundary"],
    [/REQUEST_METHOD[^;]+POST/s, "POST-only handling"],
    [/FILTER_VALIDATE_EMAIL/, "server-side email validation"],
    [/normalized_field\('website'/, "a honeypot field"],
    [/normalized_field\('tc_kimlik_no'[^\n]+!\$isCorporate\)/, "the individual identity contract"],
    [/normalized_field\('sirket_unvani'[^\n]+\$isCorporate\)/, "the corporate title contract"],
    [/normalized_field\('vergi_numarasi'[^\n]+\$isCorporate\)/, "the corporate tax contract"],
    [/normalized_field\('arac_markasi'[^\n]+!\$isCart\)/, "the required non-cart vehicle make"],
    [/normalized_field\('arac_modeli'[^\n]+!\$isCart\)/, "the required non-cart vehicle model"],
    [/\$formType !== 'sepet'/, "the cart quote type"],
    [/normalized_field\('sepet_json'[^\n]+true\)/, "the required cart payload"],
    [/validated_integer\('kiralama_suresi', 12, 120\)/, "the twelve-month minimum"],
    [/is_valid_turkish_identity_number\(/, "T.C. identity validation"],
    [/rate_limit_allows_request\(\)/, "rate limiting"],
    [/HTTP_ORIGIN/, "origin validation"],
    [/https:\/\/kalitefilo\.com\.tr/, "the production origin allowlist"],
    [/https:\/\/staging\.kalitefilo\.com\.tr/, "the staging origin allowlist"],
    [/kalite_filo_send_quote_email\(/, "authenticated SMTP delivery"],
    [/header\('Location: \/teklif-al\/\?sonuc='/, "a local result redirect"],
  ];

  for (const [pattern, description] of requiredContracts) {
    if (!pattern.test(content)) {
      fail(`The quote PHP endpoint is missing ${description}.`);
    }
  }

  const requiredMailerContracts = [
    [/vendor\/autoload\.php/, "the Composer autoloader"],
    [/KALITE_FILO_MAIL_CONFIG/, "the absolute-path environment override"],
    [/dirname\(\$formsDirectory, 2\)/, "the account-private fallback path"],
    [/['\"]private['\"]/, "the private configuration directory"],
    [/\$mail->isSMTP\(\)/, "SMTP transport"],
    [/\$mail->SMTPAuth\s*=\s*true/, "mandatory SMTP authentication"],
    [/ENCRYPTION_SMTPS/, "implicit TLS support"],
    [/ENCRYPTION_STARTTLS/, "STARTTLS support"],
    [/\$mail->setFrom\(\(string\) \$config\['from_address'\]/, "configured sender identity"],
    [/\$mail->addAddress\(\(string\) \$config\[\$recipientAddressKey\]/, "configured recipient identity"],
    [/\$mail->addReplyTo\(\$message\['reply_to_address'\]/, "visitor Reply-To handling"],
    [/PHPMailer::CHARSET_UTF8/, "UTF-8 message encoding"],
    [/\$mail->Body\s*=\s*\$message\['html_body'\]/, "HTML message content"],
    [/\$mail->AltBody\s*=\s*\$message\['text_body'\]/, "plain-text alternative content"],
  ];
  for (const [pattern, description] of requiredMailerContracts) {
    if (!pattern.test(mailerContent)) {
      fail(`The quote SMTP boundary is missing ${description}.`);
    }
  }

  if (composerManifest.require?.["phpmailer/phpmailer"] !== "^7.1") {
    fail("The quote-form Composer manifest must require phpmailer/phpmailer ^7.1.");
  }
  if (composerManifest.require?.php !== ">=8.1") {
    fail("The form Composer runtime must remain compatible with PHP 8.1+ web handlers.");
  }

  for (const [pattern, description] of [
    [/declare\s*\(strict_types\s*=\s*1\)/, "strict PHP typing"],
    [/contact_field\('website'/, "a honeypot field"],
    [/FILTER_VALIDATE_EMAIL/, "server-side email validation"],
    [/contact_rate_limit_allows_request\(\)/, "rate limiting"],
    [/https:\/\/kalitefilo\.com\.tr/, "the production origin allowlist"],
    [/https:\/\/staging\.kalitefilo\.com\.tr/, "the staging origin allowlist"],
    [/kalite_filo_send_email\([^;]+, 'contact'\)/s, "contact-recipient SMTP delivery"],
  ]) {
    if (!pattern.test(contactContent)) fail(`The contact PHP endpoint is missing ${description}.`);
  }

  for (const [pattern, description] of [
    [/REQUEST_METHOD[^;]+POST/s, "POST-only handling"],
    [/FILTER_VALIDATE_EMAIL/, "server-side email validation"],
    [/2026-08-28-v2/, "the approved consent-text version"],
    [/website_newsletter/, "the newsletter consent source"],
    [/kalite_filo_store_contact\(/, "durable subscriber persistence"],
  ]) {
    if (!pattern.test(newsletterContent)) fail(`The newsletter PHP endpoint is missing ${description}.`);
  }
  for (const [pattern, description] of [
    [/KALITE_FILO_CONTACT_STORE_PATH/, "the absolute-path environment override"],
    [/newsletter-contacts\.csv/, "the durable CSV filename"],
    [/consent_text_version/, "the consent audit schema"],
    [/iys_synced_at/, "the IYS audit schema"],
    [/flock\(/, "exclusive file locking"],
    [/fputcsv\(/, "CSV serialization"],
    [/rename\(/, "atomic replacement"],
    [/chmod\([^;]+0600/, "private file permissions"],
  ]) {
    if (!pattern.test(subscriberStoreContent)) fail(`The subscriber store is missing ${description}.`);
  }

  const projectOwnedPhp = [content, contactContent, newsletterContent, subscriberStoreContent, mailerContent, exampleContent].join("\n");
  if (/\bmail\s*\(/i.test(projectOwnedPhp)) {
    fail("Project-owned quote PHP must not use PHP mail().");
  }
  if (/verify_peer\s*['\"]?\s*=>\s*false|allow_self_signed\s*['\"]?\s*=>\s*true/i.test(projectOwnedPhp)) {
    fail("The quote SMTP boundary must not disable TLS certificate validation.");
  }
  if (/K@liteFilo|(?:smtp|mail)[_-]?(?:pass|password)\s*['\"]?\s*=>\s*(?!['\"]CHANGE_ME)/i.test(projectOwnedPhp)) {
    fail("Project-owned quote PHP must not contain a real mail credential.");
  }

  for (const publicPath of [
    path.join(repositoryRoot, "public", "forms", "teklif.php"),
    path.join(repositoryRoot, "out", "forms", "teklif.php"),
    path.join(repositoryRoot, "public", "forms", "iletisim.php"),
    path.join(repositoryRoot, "out", "forms", "iletisim.php"),
    path.join(repositoryRoot, "public", "forms", "bulten.php"),
    path.join(repositoryRoot, "out", "forms", "bulten.php"),
    path.join(repositoryRoot, "public", "forms", "subscriber-store.php"),
    path.join(repositoryRoot, "out", "forms", "subscriber-store.php"),
    path.join(repositoryRoot, "public", "forms", "quote-mailer.php"),
    path.join(repositoryRoot, "out", "forms", "quote-mailer.php"),
    path.join(repositoryRoot, "server", "forms", "kalite-filo-mail.php"),
  ]) {
    if (existsSync(publicPath)) {
      fail("PHP source must remain outside public/ and the raw static export.");
    }
  }
}

function validatePackageAndNextConfig() {
  const packageJson = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const dependency of forbiddenDependencies) {
    if (dependency in dependencies) {
      fail(`Prohibited runtime dependency found: ${dependency}`);
    }
  }

  if (packageJson.dependencies?.next !== "16.2.11") {
    fail("Next.js must remain pinned to 16.2.11.");
  }

  if (
    packageJson.dependencies?.react !== "19.2.4" ||
    packageJson.dependencies?.["react-dom"] !== "19.2.4"
  ) {
    fail("React and React DOM must remain pinned to 19.2.4.");
  }

  const nextConfig = readFileSync(
    path.join(repositoryRoot, "next.config.ts"),
    "utf8",
  );
  if (!/output\s*:\s*["']export["']/.test(nextConfig)) {
    fail('next.config.ts must preserve output: "export".');
  }
  if (!/trailingSlash\s*:\s*true/.test(nextConfig)) {
    fail("next.config.ts must preserve trailingSlash: true.");
  }
  if (!/unoptimized\s*:\s*true/.test(nextConfig)) {
    fail("Static export must preserve images.unoptimized: true.");
  }
}

export function routeToSourcePageFile(routePath) {
  if (routePath === "/") {
    return path.join(repositoryRoot, "src", "app", "(tr)", "page.tsx");
  }

  return path.join(
    repositoryRoot,
    "src",
    "app",
    "(tr)",
    ...routePath.slice(1, -1).split("/"),
    "page.tsx",
  );
}

export function routeToOutputFile(routePath) {
  if (routePath === "/") {
    return path.join(repositoryRoot, "out", "index.html");
  }

  return path.join(
    repositoryRoot,
    "out",
    ...routePath.slice(1, -1).split("/"),
    "index.html",
  );
}

function validateStaticRouteSources(routes) {
  for (const route of routes) {
    if (route.kind !== "static") {
      continue;
    }

    const sourceFile = routeToSourcePageFile(route.path);
    if (!existsSync(sourceFile)) {
      fail(`Approved static route is missing its page skeleton: ${route.path}`);
    }
  }

  const vehicleDetailRoute = routes.find(
    (route) => route.id === "vehicle-detail" && route.kind === "family",
  );
  if (
    !vehicleDetailRoute ||
    !existsSync(routeToSourcePageFile(vehicleDetailRoute.path))
  ) {
    fail("The approved vehicle-detail family is missing its App Router source page.");
  }
}

function getMetaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const metaName = tag.match(/\bname=["']([^"']+)["']/i)?.[1];
    if (metaName?.toLowerCase() !== name.toLowerCase()) {
      continue;
    }

    return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
  }

  return undefined;
}

function getCanonicalHref(html) {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const link of links) {
    const rel = link.match(/\brel=["']([^"']+)["']/i)?.[1];
    if (rel?.toLowerCase() === "canonical") {
      return link.match(/\bhref=["']([^"']+)["']/i)?.[1];
    }
  }

  return undefined;
}

function getAnchorHrefs(html) {
  return (html.match(/<a\b[^>]*>/gi) ?? []).flatMap((anchor) => {
    const href = anchor.match(/\bhref=["']([^"']+)["']/i)?.[1];
    return href ? [href] : [];
  });
}

function isApprovedAssetCreditLink(anchorTag, href) {
  if (!/\bdata-asset-credit=["']true["']/i.test(anchorTag)) {
    return false;
  }

  let url;
  try {
    url = new URL(href);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    (url.hostname === "commons.wikimedia.org" ||
      url.hostname === "creativecommons.org")
  );
}

function validateNoVehicleLicenseLedgerLink(html, context) {
  if (/\bdata-vehicle-image-credits=/i.test(html)) {
    fail(`${context} must not render the removed vehicle image-credit component.`);
  }

  const ledgerLinks = (html.match(/<a\b[^>]*>/gi) ?? []).filter((anchorTag) =>
    /\bdata-vehicle-license-ledger=["']true["']/i.test(anchorTag),
  );

  if (ledgerLinks.length !== 0 || /Ara\u00e7 g\u00f6rsel lisanslar\u0131/i.test(html)) {
    fail(`${context} must not expose a vehicle-license ledger link in the website UI.`);
  }
}

function validateVehicleCardPresentation(cardBlocks, context) {
  for (const cardBlock of cardBlocks) {
    if (
      /\bdata-asset-credit=["']true["']/i.test(cardBlock) ||
      /G\u00f6rsel\s*:/i.test(cardBlock)
    ) {
      fail(`${context} must not repeat image-credit text inside individual cards.`);
    }

    if (
      /\bdata-vehicle-category-badge=/i.test(cardBlock) ||
      /<(?:span|p)\b[^>]*\bclass=["'][^"']*\babsolute\b[^"']*["'][^>]*>\s*(?:Binek|SUV|Ticari(?:\s+Ara\u00e7lar)?)\s*</i.test(
        cardBlock,
      )
    ) {
      fail(`${context} must not render category badges on vehicle cards.`);
    }

    if (!/\bdata-vehicle-media=["']true["']/i.test(cardBlock)) {
      fail(`${context} vehicle cards must expose their media region.`);
    }

    const cardSlug = cardBlock.match(
      /\bdata-vehicle-card=["']([^"']+)["']/i,
    )?.[1];
    const detailLinks = (cardBlock.match(/<a\b[^>]*>/gi) ?? []).filter(
      (anchorTag) =>
        /\bdata-vehicle-card-link=["']true["']/i.test(anchorTag),
    );
    const quoteCtas = cardBlock.match(
      /<span\b[^>]*\bdata-vehicle-card-cta=["']true["'][^>]*>/gi,
    ) ?? [];

    if (
      !cardSlug ||
      detailLinks.length !== 1 ||
      detailLinks[0].match(/\bhref=["']([^"']+)["']/i)?.[1] !==
        `/arac-listesi/${cardSlug}/` ||
      quoteCtas.length !== 1 ||
      !/\bclass=["'][^"']*\bgroup\b[^"']*["']/i.test(detailLinks[0]) ||
      !/\bclass=["'][^"']*\bgroup-hover:bg-orange-dark\b[^"']*["']/i.test(
        quoteCtas[0],
      )
    ) {
      fail(
        `${context} vehicle cards must be single, full-card detail links with a group-hover CTA.`,
      );
    }

    const factsBlock = cardBlock.match(
      /<dl\b[^>]*\bdata-vehicle-facts=["']true["'][^>]*>[\s\S]*?<\/dl>/i,
    )?.[0];
    const factsTag = factsBlock?.match(/<dl\b[^>]*>/i)?.[0] ?? "";
    if (
      !factsBlock ||
      !/\bdata-vehicle-facts-layout=["']single-row["']/i.test(factsTag)
    ) {
      fail(`${context} vehicle facts must use the single-row presentation contract.`);
    }

    const factNames = (
      factsBlock.match(/\bdata-vehicle-fact=["']([^"']+)["']/gi) ?? []
    ).map(
      (attribute) =>
        attribute.match(/\bdata-vehicle-fact=["']([^"']+)["']/i)?.[1],
    );

    if (
      factNames.length !== 2 ||
      new Set(factNames).size !== 2 ||
      ["fuel", "transmission"].some(
        (factName) => !factNames.includes(factName),
      )
    ) {
      fail(`${context} vehicle cards must expose only fuel and transmission facts.`);
    }

    const transmissionBlock = factsBlock.match(
      /<div\b[^>]*\bdata-vehicle-fact=["']transmission["'][^>]*>[\s\S]*?<\/div>/i,
    )?.[0];
    const transmissionTag = transmissionBlock?.match(/<div\b[^>]*>/i)?.[0] ?? "";
    const transmissionDisplay = transmissionTag.match(
      /\bdata-vehicle-transmission-display=["']([^"']+)["']/i,
    )?.[1];

    if (
      !transmissionBlock ||
      !["Manuel", "Otomatik", "Yar\u0131 Otomatik"].includes(
        transmissionDisplay,
      ) ||
      !new RegExp(`>\\s*${transmissionDisplay}\\s*<`, "i").test(
        transmissionBlock,
      )
    ) {
      fail(
        `${context} transmission facts must use only Manuel, Otomatik or Yar\u0131 Otomatik.`,
      );
    }
  }
}

/**
 * Verifies that Home-owned calls to action use only approved local routes.
 * The scope is deliberately the route's main landmark so shared shell links
 * cannot satisfy the Home page contract.
 */
export function validateHomeMainLinks(
  html,
  origin,
  approvedStaticPaths,
  approvedVehicleDetailPaths = [],
) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];

  if (!mainHtml) {
    fail("Home output is missing its main landmark.");
  }

  const anchorTags = mainHtml.match(/<a\b[^>]*>/gi) ?? [];
  const hrefs = getAnchorHrefs(mainHtml);
  const approvedPaths = new Set([
    ...approvedStaticPaths,
    ...approvedVehicleDetailPaths,
  ]);

  for (const requiredPath of requiredHomeMainPaths) {
    if (!hrefs.includes(requiredPath)) {
      fail(`Home main content is missing its required ${requiredPath} link.`);
    }
  }

  for (const anchorTag of anchorTags) {
    const href = anchorTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) {
      continue;
    }

    if (href.startsWith("#")) {
      continue;
    }

    if (isApprovedAssetCreditLink(anchorTag, href)) {
      continue;
    }

    if (!href.startsWith("/") || href.startsWith("//")) {
      fail(`Home main content contains an external or protocol link: ${href}`);
    }

    const resolved = new URL(href, origin);

    if (
      resolved.origin !== origin ||
      !approvedPaths.has(resolved.pathname)
    ) {
      fail(`Home main content links to an unapproved static path: ${href}`);
    }
  }

  return hrefs;
}

/** Keep the static Home finder a local, progressively enhanced GET form. */
export function validateHomeVehicleFinder(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];

  if (!mainHtml) {
    fail("Home output is missing its main landmark.");
  }

  const forms = mainHtml.match(/<form\b[\s\S]*?<\/form>/gi) ?? [];
  const finderForms = forms.filter(
    (form) =>
      /\bname=["']marka["']/i.test(form) ||
      /\bname=["']model["']/i.test(form),
  );

  if (finderForms.length !== 1) {
    fail("Home must contain exactly one marka/model vehicle finder form.");
  }

  const finderForm = finderForms[0];
  const openingTag = finderForm.match(/<form\b[^>]*>/i)?.[0] ?? "";
  const action = openingTag.match(/\baction=["']([^"']+)["']/i)?.[1];
  const method = openingTag.match(/\bmethod=["']([^"']+)["']/i)?.[1];

  if (action !== "/arac-listesi/") {
    fail("Home vehicle finder must submit only to /arac-listesi/.");
  }

  if (method?.toLowerCase() !== "get") {
    fail("Home vehicle finder must use the GET method.");
  }

  if (
    !/\bname=["']marka["']/i.test(finderForm) ||
    !/\bname=["']model["']/i.test(finderForm)
  ) {
    fail("Home vehicle finder must expose marka and model fields.");
  }

  const selectTags = finderForm.match(/<select\b[^>]*>/gi) ?? [];
  const makeSelect = selectTags.find((tag) =>
    /\bname=["']marka["']/i.test(tag),
  );
  const modelSelect = selectTags.find((tag) =>
    /\bname=["']model["']/i.test(tag),
  );

  if (!makeSelect || !modelSelect) {
    fail("Home vehicle finder must expose native marka and model selects.");
  }

  if (!/\bdisabled(?:\s|=|>)/i.test(modelSelect)) {
    fail("Home vehicle finder model select must start disabled.");
  }

  if (/\brequired(?:\s|=|>)/i.test(makeSelect + modelSelect)) {
    fail("Home vehicle finder must allow empty and make-only submissions.");
  }

  return { action, method: method.toLowerCase() };
}

/** Keep the reference-derived Home layouts semantic and free of nested links. */
export function validateHomeInteractionLayouts(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];

  if (!mainHtml) {
    fail("Home output is missing its main landmark.");
  }

  const whySection = mainHtml.match(
    /<section\b[^>]*aria-labelledby=["']why-kalite-filo-title["'][\s\S]*?<\/section>/i,
  )?.[0];

  if (
    !whySection ||
    !/\bdata-why-layout=["']unframed["']/i.test(whySection) ||
    /home-why-decoration/i.test(whySection)
  ) {
    fail("Home why section must use the approved unframed layout.");
  }

  const solutionLinks = (
    mainHtml.match(
      /<a\b[^>]*\bdata-fleet-solution-card=["']true["'][^>]*>[\s\S]*?<\/a>/gi,
    ) ?? []
  );

  if (solutionLinks.length !== 4) {
    fail("Every Home fleet-solution card must be one complete link.");
  }

  for (const link of solutionLinks) {
    const openingTag = link.match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = openingTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const className = openingTag.match(/\bclass=["']([^"']+)["']/i)?.[1] ?? "";

    if (
      !["/arac-listesi/", "/teklif-al/"].includes(href) ||
      !/(?:^|\s)no-underline(?:\s|$)/.test(className) ||
      !/<article\b/i.test(link) ||
      (link.match(/<a\b/gi) ?? []).length !== 1
    ) {
      fail("Home fleet-solution cards must be unnested, local, underline-free links.");
    }
  }

  return { solutionCardCount: solutionLinks.length };
}

export function validateHomeFeaturedVehiclePrices(
  html,
  expectedListPricesTry = (() => {
    const featuredIds = JSON.parse(readFileSync(featuredVehicleIdsPath, "utf8"));
    const portfolio = JSON.parse(readFileSync(vehiclePortfolioPath, "utf8"));
    const amounts = JSON.parse(readFileSync(vehicleListPricePath, "utf8")).amountsMinor;
    const recordsById = new Map(portfolio.map((record) => [record.id, record]));
    return Object.fromEntries(featuredIds.map((id) => {
      const sourceId = recordsById.get(id)?.sourceId;
      const amountMinor = sourceId ? amounts[sourceId] : undefined;
      if (!sourceId || !Number.isInteger(amountMinor)) fail("Featured vehicle price source is incomplete.");
      return [sourceId, amountMinor / 100];
    }));
  })(),
) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  const sectionHtml = mainHtml?.match(
    /<section\b[^>]*aria-labelledby=["']featured-vehicles-title["'][\s\S]*?<\/section>/i,
  )?.[0];

  if (!sectionHtml) {
    fail("Home output is missing the featured vehicle section.");
  }

  const browseAction = sectionHtml.match(
    /<a\b[^>]*\bdata-featured-vehicles-action=["']true["'][^>]*>/i,
  )?.[0];
  const browseActionHref = browseAction?.match(
    /\bhref=["']([^"']+)["']/i,
  )?.[1];
  const browseActionClass = browseAction?.match(
    /\bclass=["']([^"']+)["']/i,
  )?.[1] ?? "";

  if (
    !browseAction ||
    browseActionHref !== "/arac-listesi/" ||
    !/(?:^|\s)h-control-primary(?:\s|$)/.test(browseActionClass) ||
    !/(?:^|\s)featured-vehicles-action(?:\s|$)/.test(browseActionClass)
  ) {
    fail("Home featured vehicle action must use the primary-size outlined hover contract.");
  }

  const cardBlocks = sectionHtml.match(
    /<li\b[^>]*data-vehicle-source-id=["'][^"']+["'][\s\S]*?<\/li>/gi,
  ) ?? [];
  const expectedEntries = Object.entries(expectedListPricesTry);

  if (cardBlocks.length !== expectedEntries.length) {
    fail("Home featured vehicles must expose every approved featured list price.");
  }

  validateVehicleCardPresentation(cardBlocks, "Home featured vehicles");
  const seenSourceIds = new Set();
  for (const cardBlock of cardBlocks) {
    const openingTag = cardBlock.match(/<li\b[^>]*>/i)?.[0] ?? "";
    const sourceId = openingTag.match(
      /\bdata-vehicle-source-id=["']([^"']+)["']/i,
    )?.[1];
    const amountTry = Number(
      openingTag.match(
        /\bdata-monthly-list-net-price-try=["']([^"']+)["']/i,
      )?.[1],
    );

    if (
      !sourceId ||
      seenSourceIds.has(sourceId) ||
      expectedListPricesTry[sourceId] !== amountTry
    ) {
      fail("Home featured vehicles contain an incorrect approved list price.");
    }
    seenSourceIds.add(sourceId);

    if (
      !cardBlock.includes(formatVehicleListNetPrice(amountTry * 100)) ||
      cardBlock.includes("Aylık Liste Net") ||
      !cardBlock.includes("+ %20 KDV") ||
      !cardBlock.includes("/ay") ||
      (cardBlock.match(/\bdata-vehicle-fact=["'][^"']+["']/gi) ?? [])
        .length !== 2
    ) {
      fail("Home featured vehicle price or factual icon context is incomplete.");
    }
  }

  if (expectedEntries.some(([sourceId]) => !seenSourceIds.has(sourceId))) {
    fail("Home featured vehicle price coverage does not match the approved source.");
  }

  return {
    cardCount: cardBlocks.length,
    listPriceCount: seenSourceIds.size,
  };
}

/**
 * Keeps the exported vehicle index tied to the owner-supplied 32-record
 * catalogue without turning representative media into inventory claims.
 */
export function validateVehicleCatalogueOutput(
  html,
  {
    expectedCardCount = 32,
    expectedImageCount = 32,
    expectedMissingImageCount = 4,
    expectedListPricesTry = Object.fromEntries(
      Object.entries(
        JSON.parse(readFileSync(vehicleListPricePath, "utf8")).amountsMinor,
      ).map(([sourceId, amountMinor]) => [sourceId, amountMinor / 100]),
    ),
  } = {},
) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];

  if (!mainHtml) {
    fail("Vehicle catalogue output is missing its main landmark.");
  }

  if (!/\bdata-vehicle-catalogue=["']true["']/i.test(mainHtml)) {
    fail("Vehicle catalogue output is missing its catalogue landmark.");
  }

  const cardBlocks = (mainHtml.match(/<article\b[\s\S]*?<\/article>/gi) ?? []).filter(
    (block) => /\bdata-vehicle-card=["'][^"']+["']/i.test(block),
  );
  const cardTags = cardBlocks.map(
    (block) => block.match(/<article\b[^>]*>/i)?.[0] ?? "",
  );
  const cardIds = cardTags.map(
    (tag) => tag.match(/\bdata-vehicle-card=["']([^"']+)["']/i)?.[1],
  );

  if (cardTags.length !== expectedCardCount) {
    fail(
      `Vehicle catalogue must export exactly ${expectedCardCount} portfolio cards.`,
    );
  }

  if (new Set(cardIds).size !== cardIds.length) {
    fail("Vehicle catalogue output contains duplicate card identifiers.");
  }

  validateVehicleCardPresentation(cardBlocks, "Vehicle catalogue");
  const seenPriceSourceIds = new Set();
  for (const [index, cardBlock] of cardBlocks.entries()) {
    const openingTag = cardTags[index];
    const sourceId = openingTag.match(
      /\bdata-vehicle-source-id=["']([^"']+)["']/i,
    )?.[1];
    const amountTryText = openingTag.match(
      /\bdata-monthly-list-net-price-try=["']([^"']+)["']/i,
    )?.[1];
    const amountTry = Number(amountTryText);
    const expectedAmountTry = sourceId
      ? expectedListPricesTry[sourceId]
      : undefined;

    if (
      !sourceId ||
      seenPriceSourceIds.has(sourceId) ||
      !Number.isSafeInteger(amountTry) ||
      amountTry <= 0 ||
      amountTry !== expectedAmountTry
    ) {
      fail("Vehicle catalogue contains a missing, duplicate or incorrect approved list price.");
    }
    seenPriceSourceIds.add(sourceId);

    const expectedFormattedPrice = formatVehicleListNetPrice(amountTry * 100);
    const dataTag = cardBlock.match(/<data\b[^>]*>[\s\S]*?<\/data>/i)?.[0];
    if (
      !dataTag ||
      !new RegExp(`\\bvalue=["']${amountTry}["']`, "i").test(dataTag) ||
      !dataTag.includes(expectedFormattedPrice) ||
      cardBlock.includes("Aylık Liste Net") ||
      !cardBlock.includes("+ %20 KDV") ||
      !cardBlock.includes("/ay") ||
      !/\bdata-vehicle-list-price=["']true["']/i.test(cardBlock)
    ) {
      fail("Vehicle catalogue list prices must expose their visible net-monthly context.");
    }

    for (const fact of ["fuel", "transmission"]) {
      if (
        !new RegExp(`\\bdata-vehicle-fact=["']${fact}["']`, "i").test(
          cardBlock,
        )
      ) {
        fail(`Vehicle catalogue card ${sourceId} is missing its ${fact} fact.`);
      }
    }
  }

  if (
    seenPriceSourceIds.size !== expectedCardCount ||
    Object.keys(expectedListPricesTry).some(
      (sourceId) => !seenPriceSourceIds.has(sourceId),
    )
  ) {
    fail("Vehicle catalogue list-price coverage does not match the approved source.");
  }

  const vehicleImageTags = (mainHtml.match(/<img\b[^>]*>/gi) ?? []).filter(
    (tag) =>
      /\bsrc=["']\/images\/vehicles\/cards\/[^"']+\.jpg["']/i.test(tag),
  );

  if (vehicleImageTags.length !== expectedImageCount) {
    fail(
      `Vehicle catalogue must export exactly ${expectedImageCount} approved local vehicle images.`,
    );
  }

  const vehicleImageSources = vehicleImageTags.map(
    (tag) => tag.match(/\bsrc=["']([^"']+)["']/i)?.[1],
  );

  const nonPlaceholderImageSources = vehicleImageSources.filter(
    (source) => source !== "/images/vehicles/cards/vehicle-placeholder.jpg",
  );

  if (
    new Set(nonPlaceholderImageSources).size !==
    nonPlaceholderImageSources.length
  ) {
    fail("Vehicle catalogue output must not reuse a verified vehicle image as another record.");
  }

  for (const imageTag of vehicleImageTags) {
    if (
      !/\balt=["'][^"']+["']/i.test(imageTag) ||
      !/\bwidth=["']\d+["']/i.test(imageTag) ||
      !/\bheight=["']\d+["']/i.test(imageTag)
    ) {
      fail("Every vehicle image needs non-empty alt text and intrinsic dimensions.");
    }
  }

  const missingImageTags = vehicleImageTags.filter(
    (tag) =>
      /\bsrc=["']\/images\/vehicles\/cards\/vehicle-placeholder\.jpg["']/i.test(
        tag,
      ),
  );

  if (missingImageTags.length !== expectedMissingImageCount) {
    fail(
      `Vehicle catalogue must expose exactly ${expectedMissingImageCount} shared card-image placeholders.`,
    );
  }

  if (expectedImageCount !== expectedCardCount) {
    fail("Vehicle catalogue card-image coverage does not match its card count.");
  }

  const requiredFilterNames = ["marka", "model", "segment", "yakit", "vites"];
  for (const name of requiredFilterNames) {
    if (!new RegExp(`\\bname=["']${name}["']`, "i").test(mainHtml)) {
      fail(`Vehicle catalogue output is missing its ${name} filter control.`);
    }
  }

  const requiredCategoryHrefs = [
    "/arac-listesi/",
    "/arac-listesi/?kategori=Binek",
    "/arac-listesi/?kategori=SUV",
    "/arac-listesi/?kategori=Ticari",
  ];
  const catalogueLinks = getAnchorHrefs(mainHtml);
  for (const href of requiredCategoryHrefs) {
    if (!catalogueLinks.includes(href)) {
      fail(`Vehicle catalogue output is missing its ${href} category link.`);
    }
  }

  return {
    cardCount: cardTags.length,
    imageCount: vehicleImageTags.length,
    listPriceCount: seenPriceSourceIds.size,
    missingImageCount: missingImageTags.length,
  };
}

export function validateVehicleDetailOutput(
  html,
  vehicle,
  vehicleRecords,
) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) {
    fail(`Vehicle detail ${vehicle.slug} is missing its main landmark.`);
  }

  if (
    !new RegExp(
      `\\bdata-vehicle-detail=["']${vehicle.slug}["']`,
      "i",
    ).test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} is missing its record marker.`);
  }

  const actionButtons = (mainHtml.match(/<button\b[^>]*>/gi) ?? []).filter(
    (buttonTag) => /\bdata-vehicle-detail-action=["'][^"']+["']/i.test(buttonTag),
  );
  const actionKinds = actionButtons.map(
    (buttonTag) =>
      buttonTag.match(/\bdata-vehicle-detail-action=["']([^"']+)["']/i)?.[1],
  );
  if (
    actionButtons.length !== 2 ||
    !actionKinds.includes("quote") ||
    !actionKinds.includes("basket") ||
    /<(?:a|form)\b[^>]*\bdata-vehicle-detail-action=/i.test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} must expose both actions as controlled client buttons.`);
  }

  const relatedSlugs = Array.from(
    mainHtml.matchAll(/\bdata-related-vehicle=["']([^"']+)["']/gi),
    (match) => match[1],
  );
  const recordsBySlug = new Map(
    vehicleRecords.map((record) => [record.slug, record]),
  );
  const expectedRelatedSlugs = vehicleRecords
    .filter(
      (record) =>
        record.slug !== vehicle.slug &&
        record.categoryLabel === vehicle.categoryLabel,
    )
    .map((record) => record.slug);
  if (
    relatedSlugs.length !== expectedRelatedSlugs.length ||
    new Set(relatedSlugs).size !== expectedRelatedSlugs.length ||
    expectedRelatedSlugs.some((slug) => !relatedSlugs.includes(slug))
  ) {
    fail(
      `Vehicle detail ${vehicle.slug} must render every unique same-category related vehicle.`,
    );
  }

  for (const relatedSlug of relatedSlugs) {
    const relatedVehicle = recordsBySlug.get(relatedSlug);
    if (
      !relatedVehicle ||
      relatedVehicle.slug === vehicle.slug ||
      relatedVehicle.categoryLabel !== vehicle.categoryLabel ||
      !mainHtml.includes(`href="/arac-listesi/${relatedSlug}/"`)
    ) {
      fail(
        `Vehicle detail ${vehicle.slug} related vehicles must belong to the same category and use real detail links.`,
      );
    }
  }

  const relatedControls = Array.from(
    mainHtml.matchAll(
      /<button\b[^>]*\bdata-related-vehicles-control=["']([^"']+)["'][^>]*>/gi,
    ),
    (match) => match[1],
  );
  if (
    relatedControls.length !== 2 ||
    !relatedControls.includes("previous") ||
    !relatedControls.includes("next") ||
    !/\bdata-related-vehicles-track=["']true["']/i.test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} must expose one related-vehicle track with previous and next controls.`);
  }

  if (
    /Ara\u00e7 Hakk\u0131nda/i.test(mainHtml) ||
    /Ayn\u0131 ara\u00e7 kategorisindeki di\u011fer portf\u00f6y se\u00e7enekleri/i.test(mainHtml) ||
    !/\bdata-vehicle-technical-section=["']true["']/i.test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} must use one technical section without the retired about or related copy.`);
  }

  if (
    (vehicle.coverImage && (
      !/\bdata-vehicle-gallery=["']true["']/i.test(mainHtml) ||
      !/(?:Görseli Büyüt|Enlarge Image)/i.test(mainHtml)
    )) ||
    /Araç görseli model ailesini temsil edebilir/i.test(mainHtml) ||
    /The vehicle image may represent the model family/i.test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} must render the interactive gallery without the retired image disclaimer.`);
  }

  const technicalSpecificationCount = (
    mainHtml.match(/\bdata-vehicle-technical-specification=["']true["']/gi) ?? []
  ).length;
  if (
    technicalSpecificationCount < 5 ||
    (vehicle.summary && mainHtml.includes(vehicle.summary)) ||
    /(?:✓|&#x2713;|&#10003;)/i.test(mainHtml)
  ) {
    fail(`Vehicle detail ${vehicle.slug} must render only structured, non-repeating technical rows.`);
  }

  const luggageFeature = vehicle.featureLabels?.find((feature) =>
    /^(\d+(?:[.,]\d+)?)\s*L bagaj$/i.test(feature),
  );
  if (luggageFeature) {
    const volume = luggageFeature.match(/^(\d+(?:[.,]\d+)?)\s*L/i)?.[1];
    if (!mainHtml.includes("Bagaj hacmi") || !mainHtml.includes(`${volume} L`)) {
      fail(`Vehicle detail ${vehicle.slug} must normalize its supplied luggage volume as a technical row.`);
    }
  }

  if ((mainHtml.match(/id=["']editorial-preview-title["']/gi) ?? []).length !== 1) {
    fail(`Vehicle detail ${vehicle.slug} must reuse the Filo D\u00fcnyas\u0131 editorial preview once.`);
  }

  const offerPanelHtml = mainHtml.match(
    /<aside\b[^>]*\bdata-vehicle-offer-panel=["']true["'][^>]*>[\s\S]*?<\/aside>/i,
  )?.[0];
  if (
    !offerPanelHtml ||
    /Ayl\u0131k Liste Net/.test(offerPanelHtml) ||
    /KDV hari\u00e7/.test(offerPanelHtml) ||
    !/\+ %20 KDV/.test(offerPanelHtml) ||
    !offerPanelHtml.includes(formatVehicleListNetPrice(vehicle.listPrice.amountMinor))
  ) {
    fail(`Vehicle detail ${vehicle.slug} is missing its approved monthly price context.`);
  }

  if (
    !/name=["']kiralama-suresi["']/i.test(offerPanelHtml) ||
    !/name=["']yillik-kilometre["']/i.test(offerPanelHtml) ||
    ![12, 18, 24, 30, 36].every((value) =>
      new RegExp(`<option\\b[^>]*value=["']${value}["']`, "i").test(offerPanelHtml),
    ) ||
    ![10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000].every(
      (value) =>
        new RegExp(`<option\\b[^>]*value=["']${value}["']`, "i").test(offerPanelHtml),
    )
  ) {
    fail(`Vehicle detail ${vehicle.slug} is missing its approved lease selectors.`);
  }

  return {
    actionCount: actionButtons.length,
    relatedControlCount: relatedControls.length,
    relatedVehicleCount: relatedSlugs.length,
    technicalSpecificationCount,
  };
}

function getHtmlAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1];
}

export function validateEditorialPreviewLinks(html, expectedCount) {
  const anchors = (html.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    /\bdata-editorial-preview-article-link=["']true["']/i.test(tag),
  );
  const hrefs = anchors.map((tag) => getHtmlAttribute(tag, "href"));

  if (
    anchors.length !== expectedCount ||
    hrefs.some(
      (href) =>
        !href ||
        !/^\/filo-rehberi\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(
          href,
        ),
    ) ||
    new Set(hrefs).size !== hrefs.length
  ) {
    fail(
      `The shared editorial preview must expose exactly ${expectedCount} unique, category-aware article links.`,
    );
  }

  return { articleLinkCount: anchors.length };
}

export function validateArticleDetailOutput(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) {
    fail("Filo Rehberi article output is missing its main landmark.");
  }

  const tocCount = (
    mainHtml.match(/\bdata-article-table-of-contents=["']true["']/gi) ?? []
  ).length;
  const tocAnchors = (mainHtml.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    /\bdata-article-toc-link=["']true["']/i.test(tag),
  );
  const sectionHeadings = (mainHtml.match(/<h2\b[^>]*>/gi) ?? []).filter(
    (tag) => /\bdata-article-section=["']true["']/i.test(tag),
  );
  const tocTargets = tocAnchors.map((tag) =>
    getHtmlAttribute(tag, "href")?.replace(/^#/, ""),
  );
  const sectionIds = sectionHeadings.map((tag) => getHtmlAttribute(tag, "id"));
  const headerMetaCount = (
    mainHtml.match(/\bdata-article-header-meta=["']true["']/gi) ?? []
  ).length;
  const shareActionsCount = (
    mainHtml.match(/\bdata-article-share-actions=["']true["']/gi) ?? []
  ).length;
  const sharePanelCount = (
    mainHtml.match(/\bdata-article-share-panel=["']true["']/gi) ?? []
  ).length;
  const shareDialogCount = (
    mainHtml.match(/\bdata-article-share-dialog=["']true["']/gi) ?? []
  ).length;
  const shareCopyCount = (
    mainHtml.match(/\bdata-share-copy=["']true["']/gi) ?? []
  ).length;
  const shareXAnchors = (mainHtml.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    /\bdata-share-x=["']true["']/i.test(tag),
  );
  const shareWhatsAppAnchors = (mainHtml.match(/<a\b[^>]*>/gi) ?? []).filter(
    (tag) => /\bdata-share-whatsapp=["']true["']/i.test(tag),
  );
  const articleCtaAnchors = (mainHtml.match(/<a\b[^>]*>/gi) ?? []).filter(
    (tag) => /\bdata-article-cta-link=["']true["']/i.test(tag),
  );
  const sidebarTags = (mainHtml.match(/<aside\b[^>]*>/gi) ?? []).filter((tag) =>
    /\bdata-article-sidebar=["']true["']/i.test(tag),
  );
  const keyTakeawayCount = (
    mainHtml.match(/\bdata-article-key-takeaway=["']true["']/gi) ?? []
  ).length;
  const relatedAnchors = (mainHtml.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    /\bdata-article-related=["']true["']/i.test(tag),
  );
  const relatedHref = relatedAnchors[0]
    ? getHtmlAttribute(relatedAnchors[0], "href")
    : undefined;

  if (
    tocCount !== 1 ||
    tocTargets.length === 0 ||
    tocTargets.some((target) => !target) ||
    sectionIds.some((id) => !id) ||
    new Set(tocTargets).size !== tocTargets.length ||
    JSON.stringify(tocTargets) !== JSON.stringify(sectionIds)
  ) {
    fail(
      "Filo Rehberi article contents links must map one-to-one, in order, to visible article section headings.",
    );
  }

  if (
    /İç Link Önerileri|\/araclar\/|\bButon(?:lar)?\s*:/i.test(mainHtml) ||
    articleCtaAnchors.length === 0 ||
    articleCtaAnchors.some((tag) => {
      const href = getHtmlAttribute(tag, "href");
      return href !== "/arac-listesi/" && href !== "/teklif-al/";
    })
  ) {
    fail("Filo Rehberi article output contains source-only editorial scaffolding.");
  }

  if (
    headerMetaCount !== 1 ||
    shareActionsCount !== 1 ||
    sharePanelCount !== 1 ||
    shareDialogCount !== 1 ||
    shareCopyCount !== 1 ||
    shareXAnchors.length !== 1 ||
    !/^https:\/\/x\.com\/intent\/tweet\?/i.test(
      getHtmlAttribute(shareXAnchors[0] ?? "", "href") ?? "",
    ) ||
    shareWhatsAppAnchors.length !== 1 ||
    !/^https:\/\/wa\.me\/?\?/i.test(
      getHtmlAttribute(shareWhatsAppAnchors[0] ?? "", "href") ?? "",
    ) ||
    sidebarTags.length !== 1 ||
    /(?:^|\s)(?:overflow-y-auto|max-h-\S+)/i.test(
      getHtmlAttribute(sidebarTags[0] ?? "", "class") ?? "",
    ) ||
    keyTakeawayCount !== 1 ||
    relatedAnchors.length !== 1 ||
    !relatedHref ||
    !/^\/filo-rehberi\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(
      relatedHref,
    ) ||
    /id=["']article-information-title["']/i.test(mainHtml)
  ) {
    fail(
      "Filo Rehberi article output must expose compact header metadata, one compact share group, one editorial takeaway, and one category-aware related article in a sidebar without an independent scrollbar or the former information card.",
    );
  }

  return {
    articleCtaLinkCount: articleCtaAnchors.length,
    headerMetaCount,
    keyTakeawayCount,
    relatedArticleCount: relatedAnchors.length,
    shareActionsCount,
    shareDialogCount,
    sidebarCount: sidebarTags.length,
    tocItemCount: tocTargets.length,
  };
}

export function validateAboutOutput(html) {
  const requiredSections = [
    'data-about-section="hero"',
    'data-about-section="vision-mission-values"',
    'data-about-section="operational-excellence"',
    'data-about-section="service-network"',
    'data-about-section="why-kalite-filo"',
    'id="conversion-banner-title"',
    'id="editorial-preview-title"',
  ];

  for (const marker of requiredSections) {
    if ((html.match(new RegExp(marker, "g")) ?? []).length !== 1) {
      fail(`The About output must contain exactly one ${marker} section marker.`);
    }
  }

  for (const imagePath of [
    "/images/home/commercial-fleet.jpg",
    "/images/home/hero-fleet-highway.jpg",
    "/images/about/volvo-xc90-vision-mission.png",
    "/images/home/fleet-campus.jpg",
    "/images/home/quote-operations.jpg",
  ]) {
    if (!html.includes(`src="${imagePath}"`)) {
      fail(`The About output is missing local media ${imagePath}.`);
    }
  }

  const prohibitedClaims = [
    /15\s*[kK]\s*\+/,
    /1200\s*\+/,
    /7\s*\/\s*24/,
    /T\u00fcrkiye genelinde/i,
    /telematik/i,
    /ikame ara\u00e7 garantisi/i,
  ];

  for (const claim of prohibitedClaims) {
    if (claim.test(html)) {
      fail(`The About output contains an unverified claim: ${claim}.`);
    }
  }

  for (const approvedHeroFact of [
    "300+",
    "Araç Filosu",
    "%98",
    "Müşteri Memnuniyeti",
    "Kilometre Taşlarımız",
    "Vizyonumuz",
  ]) {
    if (!html.includes(approvedHeroFact)) {
      fail(`The About output is missing approved hero content: ${approvedHeroFact}.`);
    }
  }

  for (const approvedVisionMissionValue of [
    "Vizyonumuz",
    "Misyonumuz",
    "Değerlerimiz",
    "Güven",
    "Kalite",
    "Liderlik",
    "Müşteri Odaklılık",
    "Operasyonel Mükemmellik",
    "Yenilikçilik",
    "Sorumluluk",
    "Sürdürülebilirlik",
    "Sürekli Gelişim",
  ]) {
    if (!html.includes(approvedVisionMissionValue)) {
      fail(
        `The About output is missing approved vision, mission, or value content: ${approvedVisionMissionValue}.`,
      );
    }
  }

  if (
    !html.includes('href="#vizyon-misyon-degerler"') ||
    !html.includes('id="vizyon-misyon-degerler"')
  ) {
    fail("The About vision control must target the vision, mission, and values section.");
  }

  if (
    !/<button\b[^>]*data-about-hero-control=["']milestones["'][^>]*>/i.test(
      html,
    )
  ) {
    fail("The inactive About milestones control must remain a button.");
  }

  if (!html.includes('data-content-status="draft"')) {
    fail("The unpublished About page must preserve its draft content marker.");
  }

  return { sectionCount: requiredSections.length };
}

export function validateFaqOutput(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) {
    fail("FAQ output is missing its main landmark.");
  }

  const itemCount = (mainHtml.match(/data-faq-item=["']true["']/gi) ?? []).length;
  const detailsCount = (mainHtml.match(/<details\b/gi) ?? []).length;
  const summaryCount = (mainHtml.match(/<summary\b/gi) ?? []).length;
  const openCount = (mainHtml.match(/<details\b[^>]*\bopen(?:=["'][^"']*["'])?/gi) ?? [])
    .length;
  const categoryFilterCount = (
    mainHtml.match(/data-faq-category-filter=["']true["']/gi) ?? []
  ).length;
  const categoryControlCount = (
    mainHtml.match(/data-faq-category-control=["']true["']/gi) ?? []
  ).length;
  const contactCount = (mainHtml.match(/data-faq-contact=["']true["']/gi) ?? [])
    .length;
  const editorialCount = (mainHtml.match(/id=["']editorial-preview-title["']/gi) ?? [])
    .length;

  if (itemCount !== 6 || detailsCount !== 6 || summaryCount !== 6) {
    fail("FAQ output must contain exactly six native disclosure items.");
  }
  if (openCount !== 1) {
    fail("FAQ output must initially open exactly one disclosure item.");
  }
  if (categoryFilterCount !== 1 || categoryControlCount !== 5) {
    fail("FAQ output must contain one five-option category filter.");
  }
  if (/href=["']#faq(?:-list|-category-)/i.test(mainHtml)) {
    fail("FAQ category controls must filter in place instead of navigating to fragments.");
  }
  if (contactCount !== 1 || !/href=["']\/iletisim\/["']/i.test(mainHtml)) {
    fail("FAQ output must contain one real contact-page call to action.");
  }
  if (editorialCount !== 1) {
    fail("FAQ output must reuse the shared editorial preview once.");
  }
  if (/Bu cevap faydalı oldu mu|0850\s*X/i.test(mainHtml)) {
    fail("FAQ output contains unsupported feedback or placeholder contact UI.");
  }

  return { itemCount };
}

export function validateFleetGuideOutput(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) {
    fail("Filo Rehberi output is missing its main landmark.");
  }

  const listingCount = (
    mainHtml.match(/data-fleet-guide-listing=["']true["']/gi) ?? []
  ).length;
  const articleCount = (
    mainHtml.match(/data-fleet-guide-article=["']true["']/gi) ?? []
  ).length;
  const featuredCount = (
    mainHtml.match(/data-fleet-guide-featured=["']true["']/gi) ?? []
  ).length;
  const categoryFilterCount = (
    mainHtml.match(/data-fleet-guide-category-filter=["']true["']/gi) ?? []
  ).length;
  const categoryControlCount = (
    mainHtml.match(/data-fleet-guide-category-control=["']true["']/gi) ?? []
  ).length;
  const imageSources = Array.from(
    mainHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1],
  );
  const coverPlaceholderCount = (
    mainHtml.match(/data-fleet-guide-cover-placeholder=["']true["']/gi) ?? []
  ).length;
  const paginationCount = (
    mainHtml.match(/data-fleet-guide-pagination=["']true["']/gi) ?? []
  ).length;
  const pageControlCount = (
    mainHtml.match(/data-fleet-guide-page-control=/gi) ?? []
  ).length;
  const articleLinkCount = (
    mainHtml.match(/data-fleet-guide-article-link=["']true["']/gi) ?? []
  ).length;
  const listingTag = mainHtml.match(
    /<div\b[^>]*data-fleet-guide-listing=["']true["'][^>]*>/i,
  )?.[0];
  const recordCount = Number(
    listingTag?.match(/data-fleet-guide-record-count=["'](\d+)["']/i)?.[1],
  );
  const pageSize = Number(
    listingTag?.match(/data-fleet-guide-page-size=["'](\d+)["']/i)?.[1],
  );
  const pageCount = Number(
    listingTag?.match(/data-fleet-guide-page-count=["'](\d+)["']/i)?.[1],
  );

  if (listingCount !== 1 || articleCount !== 7 || featuredCount !== 1) {
    fail(
      "Filo Rehberi output must contain one featured article and at most six page-one cards.",
    );
  }
  if (articleLinkCount !== articleCount) {
    fail("Every visible Filo Rehberi card must be one complete article link.");
  }
  if (categoryFilterCount !== 1 || categoryControlCount !== 7) {
    fail("Filo Rehberi output must contain the all-content control and six approved categories.");
  }
  if (
    imageSources.length !== 6 ||
    imageSources.some(
      (source) => !source.startsWith("/images/filo-rehberi/") || !source.endsWith(".webp"),
    )
  ) {
    fail("Filo Rehberi output must use exactly six approved local WebP cover images.");
  }
  if (coverPlaceholderCount !== 1) {
    fail("Filo Rehberi page one must render one honest missing-cover state.");
  }
  if (
    recordCount !== 18 ||
    pageSize !== 6 ||
    pageCount !== 3 ||
    paginationCount !== 1 ||
    pageControlCount !== 5
  ) {
    fail("Filo Rehberi output must expose the 18-record, six-per-page pagination contract.");
  }
  if (/\bBlog\b/i.test(mainHtml)) {
    fail('Filo Rehberi output must not use the retired public label "Blog".');
  }
  const categoryAnchorTags =
    mainHtml.match(
      /<a\b[^>]*data-fleet-guide-category-control=["']true["'][^>]*>/gi,
    ) ?? [];
  const canonicalCategoryLinks = categoryAnchorTags.map(
    (tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1],
  );
  const categoryLinks = Array.from(
    mainHtml.matchAll(/href=["'](\/filo-rehberi\/(?:[a-z0-9-]+\/)?)["'][^>]*data-fleet-guide-category-control/gi),
  );
  if (
    ![0, 7].includes(categoryLinks.length) ||
    canonicalCategoryLinks.length !== 7 ||
    canonicalCategoryLinks.some(
      (href) =>
        href !== "/filo-rehberi/" &&
        !/^\/filo-rehberi\/[a-z0-9-]+\/$/.test(href ?? ""),
    )
  ) {
    fail("Filo Rehberi categories must use seven canonical static links.");
  }
  const articleAnchorTags =
    mainHtml.match(
      /<a\b[^>]*data-fleet-guide-article-link=["']true["'][^>]*>/gi,
    ) ?? [];
  const canonicalArticleLinks = articleAnchorTags.map(
    (tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1],
  );
  const articleHrefs = Array.from(
    mainHtml.matchAll(/data-fleet-guide-article-link=["']true["'][^>]*href=["'](\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/)["']/gi),
    (match) => match[1],
  );
  if (
    ![0, articleCount].includes(articleHrefs.length) ||
    canonicalArticleLinks.length !== articleCount ||
    canonicalArticleLinks.some(
      (href) =>
        !/^\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(href ?? ""),
    )
  ) {
    fail("Filo Rehberi cards must link through category-aware article URLs.");
  }

  return { articleCount, categoryControlCount, pageCount, recordCount };
}

function getCurrentAnchorHrefs(html, scopeTag) {
  const scope = html.match(new RegExp(`<${scopeTag}\\b[\\s\\S]*?<\\/${scopeTag}>`, "i"))?.[0];

  if (!scope) {
    return [];
  }

  return (scope.match(/<a\b[^>]*aria-current=["']page["'][^>]*>/gi) ?? [])
    .map((anchor) => anchor.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
}

function getOutputTarget(robotsText) {
  if (robotsText.includes(siteEnvironments.production.origin)) {
    return "production";
  }

  if (robotsText.includes(siteEnvironments.staging.origin)) {
    return "staging";
  }

  fail("Unable to determine the static artifact deployment target.");
}

function assertRobotsMetadata(content, policy, context) {
  if (!content) {
    fail(`${context} is missing page-level robots metadata.`);
  }

  const directives = new Set(
    content
      .toLowerCase()
      .split(",")
      .map((directive) => directive.trim()),
  );
  const required = [
    policy.index ? "index" : "noindex",
    policy.follow ? "follow" : "nofollow",
  ];

  for (const directive of required) {
    if (!directives.has(directive)) {
      fail(`${context} must contain the ${directive} robots directive.`);
    }
  }

  if (policy.nocache && !directives.has("nocache")) {
    fail(`${context} must contain the nocache robots directive.`);
  }

  if (!policy.index && directives.has("index")) {
    fail(`${context} cannot contain index while the route is unpublished.`);
  }

  if (policy.index && directives.has("noindex")) {
    fail(`${context} cannot contain both index and noindex.`);
  }

  if (policy.follow && directives.has("nofollow")) {
    fail(`${context} cannot contain both follow and nofollow.`);
  }

  if (!policy.follow && directives.has("follow")) {
    fail(`${context} cannot contain follow while the route is nofollow.`);
  }
}

function assertSingleElement(html, tagName, context) {
  const matches = html.match(new RegExp(`<${tagName}\\b`, "gi")) ?? [];

  if (matches.length !== 1) {
    fail(`${context} must contain exactly one <${tagName}> element.`);
  }
}

export function validateQuoteFormOutput(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) {
    fail("Quote output is missing its main landmark.");
  }

  const forms = mainHtml.match(/<form\b[\s\S]*?<\/form>/gi) ?? [];
  if (forms.length !== 1) {
    fail("Quote output must contain exactly one form.");
  }

  const form = forms[0];
  const openingTag = form.match(/<form\b[^>]*>/i)?.[0] ?? "";
  const action = openingTag.match(/\baction=["']([^"']+)["']/i)?.[1];
  const method = openingTag.match(/\bmethod=["']([^"']+)["']/i)?.[1];
  if (action !== "/forms/teklif.php" || method?.toLowerCase() !== "post") {
    fail("Quote form must POST to the approved local PHP endpoint.");
  }

  for (const name of [
    "form_turu",
    "website",
    "ad",
    "soyad",
    "ulke_kodu",
    "telefon",
    "eposta",
    "unvan",
    "il",
    "ilce",
    "firma_web_sitesi",
    "sirket_tipi",
    "sirket_unvani",
    "vergi_dairesi_ili",
    "vergi_dairesi",
    "vergi_numarasi",
    "kiralama_suresi",
    "arac_sayisi",
    "arac_markasi",
    "arac_modeli",
    "yillik_km",
    "not",
  ]) {
    if (!new RegExp(`\\bname=["']${name}["']`, "i").test(form)) {
      fail(`Quote form is missing its ${name} field.`);
    }
  }

  const formTypeButtons =
    form.match(/<button\b[^>]*\baria-pressed=[^>]*\btype=["']button["'][^>]*>/gi) ??
    [];
  if (
    formTypeButtons.length !== 3 ||
    !form.includes("Kurumsal") ||
    !form.includes("Bireysel") ||
    !form.includes("Sepetim")
  ) {
    fail("Quote form must expose three stateful, non-submitting form-type buttons.");
  }

  if (
    !mainHtml.includes('href="tel:+905317158068"') ||
    !mainHtml.includes('href="mailto:info@kalitefilo.com.tr"')
  ) {
    fail("Quote sidebar must expose the verified phone and email links.");
  }

  if (
    !/href=["']\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/["']/i.test(
      mainHtml,
    ) ||
    !/<img\b[^>]*\bsrc=["']\/images\/filo-rehberi\//i.test(mainHtml)
  ) {
    fail("Quote sidebar must contain one local, real Filo Rehberi card.");
  }

  if (
    /teklif@kalitefilo\.com\.tr|noreply@kalitefilo\.com\.tr/i.test(mainHtml)
  ) {
    fail("Quote transport addresses must not leak into browser output.");
  }

  return { formCount: forms.length };
}

export function validateContactFormOutput(html) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!mainHtml) fail("Contact output is missing its main landmark.");
  const forms = mainHtml.match(/<form\b[\s\S]*?<\/form>/gi) ?? [];
  const contactForms = forms.filter((form) => /\baction=["']\/forms\/iletisim\.php["']/i.test(form));
  if (contactForms.length !== 1) fail("Contact output must contain exactly one contact form.");
  const form = contactForms[0];
  const openingTag = form.match(/<form\b[^>]*>/i)?.[0] ?? "";
  if (
    openingTag.match(/\baction=["']([^"']+)["']/i)?.[1] !== "/forms/iletisim.php"
    || openingTag.match(/\bmethod=["']([^"']+)["']/i)?.[1]?.toLowerCase() !== "post"
  ) {
    fail("Contact form must POST to the approved local PHP endpoint.");
  }
  for (const name of ["website", "isim", "eposta", "mesaj"]) {
    if (!new RegExp(`\\bname=["']${name}["']`, "i").test(form)) {
      fail(`Contact form is missing its ${name} field.`);
    }
  }
}

function validateOutput(routes) {
  const outputRoot = path.join(repositoryRoot, "out");
  const requiredFiles = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
    brandLogoRelativePath,
  ];

  for (const relativePath of requiredFiles) {
    if (!existsSync(path.join(outputRoot, relativePath))) {
      fail(`Static output is missing ${relativePath}.`);
    }
  }

  const staticRoutes = routes.filter((route) => route.kind === "static");
  const approvedStaticPaths = new Set(staticRoutes.map((route) => route.path));
  const vehicleListPriceAmounts = JSON.parse(
    readFileSync(vehicleListPricePath, "utf8"),
  ).amountsMinor;
  const vehicleRecords = JSON.parse(
    readFileSync(vehiclePortfolioPath, "utf8"),
  ).map((record) => ({
    ...record,
    listPrice: { amountMinor: vehicleListPriceAmounts[record.sourceId] },
  }));
  const vehicleDetailRoute = routes.find(
    (route) => route.id === "vehicle-detail" && route.kind === "family",
  );
  if (!vehicleDetailRoute) {
    fail("The approved route registry must contain the vehicle-detail family.");
  }
  const vehicleDetailPaths = new Set(
    vehicleRecords.map((record) => `/arac-listesi/${record.slug}/`),
  );
  const articleRecords = JSON.parse(readFileSync(articleRecordsPath, "utf8"));
  const articleCategoryPaths = new Set(
    [...new Set(articleRecords.map((record) => record.categoryId))]
      .map((category) => `/filo-rehberi/${category}/`),
  );
  const articleDetailPaths = new Set(
    articleRecords.map(
      (record) => `/filo-rehberi/${record.categoryId}/${record.slug}/`,
    ),
  );
  const fleetGuideCategoryRoute = routes.find(
    (route) => route.id === "fleet-guide-category" && route.kind === "family",
  );
  const fleetGuideArticleRoute = routes.find(
    (route) => route.id === "fleet-guide-article" && route.kind === "family",
  );
  if (!fleetGuideCategoryRoute || !fleetGuideArticleRoute) {
    fail("The route registry must contain both Filo Rehberi route families.");
  }
  const approvedOutputPaths = new Set([
    ...approvedStaticPaths,
    ...vehicleDetailPaths,
    ...articleCategoryPaths,
    ...articleDetailPaths,
  ]);

  for (const route of staticRoutes) {
    const outputFile = routeToOutputFile(route.path);

    if (!existsSync(outputFile)) {
      fail(`Approved static route is absent from out/: ${route.path}`);
    }
  }

  const outputFiles = walkFiles(outputRoot).filter((file) =>
    /\.(?:html|css|js|json|xml|txt|webmanifest|svg)$/.test(file),
  );
  validateBrandLogoAsset(outputRoot);

  const leakedMarkers = walkFiles(outputRoot).filter(
    (file) => path.basename(file) === ".gitkeep",
  );
  if (leakedMarkers.length > 0) {
    fail("Static output contains source-control directory markers.");
  }
  const prohibitedOutput = [
    [/Create Next App/i, "Create Next App starter copy"],
    [/Generated by create next app/i, "starter metadata"],
    [/vercel\.svg/i, "a Vercel starter asset"],
    [/next\.svg/i, "a Next.js starter asset"],
    [/href=["']#["']/i, "a placeholder # link"],
    [/(?:Müşteri Girişi|\/musteri-girisi\/)/i, "excluded customer-login content"],
    [
      /https?:\/\/(?:lh3\.googleusercontent\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.tailwindcss\.com)/i,
      "a prohibited remote asset",
    ],
    [
      /material(?:[\s_-]+)symbols/i,
      "a prohibited Material Symbols design artifact",
    ],
  ];

  for (const file of outputFiles) {
    const content = readFileSync(file, "utf8");
    for (const [pattern, description] of prohibitedOutput) {
      if (pattern.test(content)) {
        fail(
          `${path.relative(repositoryRoot, file)} contains ${description}.`,
        );
      }
    }
  }

  const rootHtml = readFileSync(path.join(outputRoot, "index.html"), "utf8");
  if (!/<html[^>]+lang=["']tr["']/i.test(rootHtml)) {
    fail('The exported root document must use lang="tr".');
  }

  const robotsText = readFileSync(path.join(outputRoot, "robots.txt"), "utf8");
  const deployTarget = getOutputTarget(robotsText);
  const environment = siteEnvironments[deployTarget];
  const homeRoute = routes.find((route) => route.id === "home");
  const adminHtmlPath = path.join(outputRoot, "admin", "index.html");

  if (!existsSync(adminHtmlPath)) {
    fail("The static export is missing the Phase 2 admin entry route.");
  }
  const adminHtml = readFileSync(adminHtmlPath, "utf8");
  const adminRobots = getMetaContent(adminHtml, "robots") ?? "";
  if (
    !/<html[^>]+lang=["']tr["']/i.test(adminHtml)
    || !adminRobots.includes("noindex")
    || !adminRobots.includes("nofollow")
    || !adminRobots.includes("nocache")
  ) {
    fail("The admin export is missing its language or noindex contract.");
  }
  if (
    deployTarget === "production"
    && (!robotsText.includes("Disallow: /admin/") || !robotsText.includes("Disallow: /admin-api/"))
  ) {
    fail("Production robots.txt must disallow admin UI and API routes.");
  }

  if (!homeRoute) {
    fail("The approved route registry must contain Home.");
  }

  for (const route of staticRoutes) {
    const html = readFileSync(routeToOutputFile(route.path), "utf8");
    const context = `${deployTarget} route ${route.path}`;

    if (route.id === "home") {
      validateHomeMainLinks(
        html,
        environment.origin,
        approvedStaticPaths,
        [...vehicleDetailPaths, ...articleDetailPaths],
      );
      validateHomeVehicleFinder(html);
      validateHomeInteractionLayouts(html);
      validateHomeFeaturedVehiclePrices(html);
      validateEditorialPreviewLinks(html, 4);
    }

    if (route.id === "vehicles") {
      validateVehicleCatalogueOutput(html);
    }

    if (route.id === "about") {
      validateAboutOutput(html);
      validateEditorialPreviewLinks(html, 3);
    }

    if (route.id === "faq") {
      validateFaqOutput(html);
      validateEditorialPreviewLinks(html, 4);
    }

    if (route.id === "fleet-guide") {
      validateFleetGuideOutput(html);
    }

    if (route.id === "quote") {
      validateQuoteFormOutput(html);
    }

    if (route.id === "contact") {
      validateContactFormOutput(html);
    }

    assertRobotsMetadata(
      getMetaContent(html, "robots"),
      getRouteRobotsPolicy(route, deployTarget),
      context,
    );

    const expectedCanonical = new URL(route.path, environment.origin).toString();
    if (getCanonicalHref(html) !== expectedCanonical) {
      fail(`${context} has an unexpected canonical URL.`);
    }

    assertSingleElement(html, "header", context);
    assertSingleElement(html, "main", context);
    assertSingleElement(html, "h1", context);
    assertSingleElement(html, "footer", context);
    validateNoVehicleLicenseLedgerLink(html, context);

    for (const imageTag of html.match(/<img\b[^>]*>/gi) ?? []) {
      const src = imageTag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      if (!src) {
        continue;
      }
      if (!src.startsWith("/") || src.startsWith("//")) {
        fail(`${context} contains a remote or protocol-relative image source.`);
      }
      const localImagePath = path.join(outputRoot, src.slice(1));
      if (!existsSync(localImagePath)) {
        fail(`${context} references a missing local image: ${src}`);
      }
    }

    const brandLogoTag = (html.match(/<img\b[^>]*>/gi) ?? []).find((tag) =>
      /\bsrc=["']\/images\/brand\/kalite-filo-logo\.png["']/i.test(tag),
    );

    if (!brandLogoTag) {
      fail(`${context} is missing the approved local header logo.`);
    }

    if (!/\balt=["']Kalite Filo["']/i.test(brandLogoTag)) {
      fail(`${context} brand logo needs the accessible Kalite Filo alt text.`);
    }

    if (
      !/\bwidth=["']560["']/i.test(brandLogoTag) ||
      !/\bheight=["']112["']/i.test(brandLogoTag)
    ) {
      fail(`${context} brand logo needs explicit intrinsic dimensions.`);
    }

    const currentRouteId = getCurrentPublicNavigationRouteId(route.path);
    const headerCurrentHrefs = getCurrentAnchorHrefs(html, "header");
    const footerCurrentHrefs = getCurrentAnchorHrefs(html, "footer");

    if (!currentRouteId) {
      if (headerCurrentHrefs.length || footerCurrentHrefs.length) {
        fail(`${context} must not fabricate an ordinary current navigation item.`);
      }
    } else {
      const currentRoute = routes.find((candidate) => candidate.id === currentRouteId);

      if (!currentRoute || currentRoute.kind !== "static") {
        fail(`${context} resolves to an invalid navigation owner.`);
      }

      const expectedHeaderCount = headerNavigationRouteIds.has(currentRouteId)
        ? 2
        : 0;
      if (
        headerCurrentHrefs.length !== expectedHeaderCount ||
        headerCurrentHrefs.some((href) => href !== currentRoute.path)
      ) {
        fail(`${context} has an incorrect desktop/mobile current-page state.`);
      }

      if (
        footerCurrentHrefs.length !== 1 ||
        footerCurrentHrefs[0] !== currentRoute.path
      ) {
        fail(`${context} has an incorrect footer current-page state.`);
      }
    }

    if (!/href=["']#main-content["']/i.test(html)) {
      fail(`${context} is missing the shared skip-link destination.`);
    }

    if (!/\bid=["']main-content["']/i.test(html)) {
      fail(`${context} is missing the main-content target.`);
    }

    for (const href of getAnchorHrefs(html)) {
      if (href.startsWith("#")) {
        continue;
      }

      const resolved = new URL(href, environment.origin);
      if (
        resolved.origin === environment.origin &&
        !approvedOutputPaths.has(resolved.pathname)
      ) {
        fail(`${context} links to an unapproved output path: ${resolved.pathname}`);
      }
    }
  }

  for (const vehicle of vehicleRecords) {
    const concretePath = `/arac-listesi/${vehicle.slug}/`;
    const outputFile = routeToOutputFile(concretePath);
    const context = `${deployTarget} vehicle detail ${concretePath}`;
    if (!existsSync(outputFile)) {
      fail(`Approved vehicle detail is absent from out/: ${concretePath}`);
    }

    const html = readFileSync(outputFile, "utf8");
    validateVehicleDetailOutput(html, vehicle, vehicleRecords);
    validateEditorialPreviewLinks(html, 4);
    assertRobotsMetadata(
      getMetaContent(html, "robots"),
      getRouteRobotsPolicy(vehicleDetailRoute, deployTarget),
      context,
    );
    const expectedCanonical = new URL(concretePath, environment.origin).toString();
    if (getCanonicalHref(html) !== expectedCanonical) {
      fail(`${context} has an unexpected canonical URL.`);
    }
    for (const tagName of ["header", "main", "h1", "footer"]) {
      assertSingleElement(html, tagName, context);
    }
    validateNoVehicleLicenseLedgerLink(html, context);

    for (const imageTag of html.match(/<img\b[^>]*>/gi) ?? []) {
      const imageSource = imageTag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      if (!imageSource) {
        continue;
      }
      if (!imageSource.startsWith("/") || imageSource.startsWith("//")) {
        fail(`${context} contains a remote or protocol-relative image source.`);
      }
      const exportedImage = path.join(outputRoot, imageSource.slice(1));
      if (!existsSync(exportedImage)) {
        fail(`${context} references a missing local image: ${imageSource}`);
      }
    }

    const headerCurrentHrefs = getCurrentAnchorHrefs(html, "header");
    const footerCurrentHrefs = getCurrentAnchorHrefs(html, "footer");
    if (
      headerCurrentHrefs.length !== 2 ||
      headerCurrentHrefs.some((href) => href !== "/arac-listesi/") ||
      footerCurrentHrefs.length !== 1 ||
      footerCurrentHrefs[0] !== "/arac-listesi/"
    ) {
      fail(`${context} must preserve Araç Listesi as its navigation owner.`);
    }

    for (const href of getAnchorHrefs(html)) {
      if (href.startsWith("#")) {
        continue;
      }
      const resolved = new URL(href, environment.origin);
      if (
        resolved.origin === environment.origin &&
        !approvedOutputPaths.has(resolved.pathname)
      ) {
        fail(`${context} links to an unapproved output path: ${resolved.pathname}`);
      }
    }
  }

  for (const concretePath of articleCategoryPaths) {
    const outputFile = routeToOutputFile(concretePath);
    const context = `${deployTarget} Filo Rehberi category ${concretePath}`;
    if (!existsSync(outputFile)) fail(`Approved Filo Rehberi category is absent from out/: ${concretePath}`);
    const html = readFileSync(outputFile, "utf8");
    for (const tagName of ["header", "main", "h1", "footer"]) assertSingleElement(html, tagName, context);
    assertRobotsMetadata(getMetaContent(html, "robots"), getRouteRobotsPolicy(fleetGuideCategoryRoute, deployTarget), context);
    if (getCanonicalHref(html) !== new URL(concretePath, environment.origin).toString()) {
      fail(`${context} has an unexpected canonical URL.`);
    }
    if ((html.match(/data-fleet-guide-article=["']true["']/gi) ?? []).length !== 3) {
      fail(`${context} must render exactly its three supplied articles.`);
    }
  }

  for (const record of articleRecords) {
    const concretePath = `/filo-rehberi/${record.categoryId}/${record.slug}/`;
    const outputFile = routeToOutputFile(concretePath);
    const context = `${deployTarget} Filo Rehberi article ${concretePath}`;
    if (!existsSync(outputFile)) fail(`Approved Filo Rehberi article is absent from out/: ${concretePath}`);
    const html = readFileSync(outputFile, "utf8");
    for (const tagName of ["header", "main", "h1", "footer"]) assertSingleElement(html, tagName, context);
    if ((html.match(/data-article-content=["']true["']/gi) ?? []).length !== 1) {
      fail(`${context} must render its owner-supplied Markdown body once.`);
    }
    validateArticleDetailOutput(html);
    assertRobotsMetadata(getMetaContent(html, "robots"), getRouteRobotsPolicy(fleetGuideArticleRoute, deployTarget), context);
    if (getCanonicalHref(html) !== new URL(concretePath, environment.origin).toString()) {
      fail(`${context} has an unexpected canonical URL.`);
    }
    const headerCurrentHrefs = getCurrentAnchorHrefs(html, "header");
    if (headerCurrentHrefs.length !== 2 || headerCurrentHrefs.some((href) => href !== "/filo-rehberi/")) {
      fail(`${context} must preserve Filo Rehberi as its navigation owner.`);
    }
  }

  if (!environment.allowsCrawling) {
    if (!/^Disallow:\s*\/$/m.test(robotsText)) {
      fail("Staging robots.txt must disallow crawling from the root.");
    }
  } else {
    if (!/^Allow:\s*\/$/m.test(robotsText)) {
      fail("Production robots.txt must allow crawling from the root.");
    }
    if (!robotsText.includes(`${environment.origin}/sitemap.xml`)) {
      fail("Production robots.txt must advertise the production sitemap.");
    }
  }

  const sitemapXml = readFileSync(path.join(outputRoot, "sitemap.xml"), "utf8");
  const sitemapUrls = Array.from(
    sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g),
    (match) => match[1],
  ).sort();
  const expectedSitemapUrls = routes
    .filter(
      (route) =>
        route.kind === "static" &&
        route.status === "published" &&
        route.indexable &&
        route.sitemap,
    )
    .map((route) => new URL(route.path, environment.origin).toString())
    .sort();

  if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedSitemapUrls)) {
    fail("sitemap.xml does not match the published, indexable route registry.");
  }
}

export function runValidation({ checkOutput = false } = {}) {
  if (!existsSync(routeRegistryPath)) {
    fail("Missing src/config/approved-routes.json.");
  }

  const routes = validateRoutes(
    JSON.parse(readFileSync(routeRegistryPath, "utf8")),
  );
  validateStaticRouteSources(routes);
  validateBrandLogoAsset(path.join(repositoryRoot, "public"));
  validateVehiclePortfolioSource();
  validateArticleSource();
  validatePackageAndNextConfig();
  validateQuotePhpSource();
  const clientComponents = validateSourceArchitecture();

  if (checkOutput) {
    validateOutput(routes);
  }

  return { clientComponents, routeCount: routes.length };
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    const result = runValidation({
      checkOutput: process.argv.includes("--output"),
    });
    const clientSummary = result.clientComponents.length
      ? result.clientComponents.join(", ")
      : "none";
    console.log(
      `Foundation validation passed (${result.routeCount} route decisions; client components: ${clientSummary}).`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
