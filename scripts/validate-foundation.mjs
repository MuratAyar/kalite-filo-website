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
const vehiclePortfolioWorkbookPath = path.join(
  repositoryRoot,
  "references",
  "source-data",
  "vehicle-portfolio",
  "Kalite_Filo_32_Arac_Portfoyu_2026.xlsx",
);
const approvedClientComponents = new Set([
  "src/components/home/newsletter-signup-demo.tsx",
  "src/components/home/vehicle-finder-fields.tsx",
  "src/components/navigation/primary-navigation.tsx",
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
  "/araclar/[slug]/",
  "/filo-rehberi/[slug]/",
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
    !existsSync(vehiclePortfolioWorkbookPath)
  ) {
    fail("The owner-supplied vehicle portfolio source or its local typed extract is missing.");
  }

  const records = JSON.parse(readFileSync(vehiclePortfolioPath, "utf8"));
  const listPriceSource = JSON.parse(
    readFileSync(vehicleListPricePath, "utf8"),
  );
  if (!Array.isArray(records) || records.length !== 32) {
    fail("The owner-supplied vehicle portfolio must contain exactly 32 records.");
  }

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
    if (allowFamily && segment === "[slug]") {
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

    if (route.kind === "family" && !route.path.includes("[slug]")) {
      fail(`Route family ${route.id} must contain a [slug] segment.`);
    }

    if (
      route.kind === "family" &&
      !approvedRouteFamilyPaths.has(route.path)
    ) {
      fail(`Route family ${route.id} uses an unapproved path pattern.`);
    }

    if (route.kind === "static" && route.path.includes("[slug]")) {
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
    [
      /["'`]\/(?:musteri-girisi|login|portal|auth|crm|admin|api)(?:\/|["'`])/i,
      "a prohibited Phase 1 route",
    ],
  ];

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
    return path.join(repositoryRoot, "src", "app", "page.tsx");
  }

  return path.join(
    repositoryRoot,
    "src",
    "app",
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

    const quoteLinks = cardBlock.match(
      /<a\b[^>]*\bdata-vehicle-card-link=["']true["'][^>]*\bhref=["']\/teklif-al\/["'][^>]*>/gi,
    ) ?? cardBlock.match(
      /<a\b[^>]*\bhref=["']\/teklif-al\/["'][^>]*\bdata-vehicle-card-link=["']true["'][^>]*>/gi,
    ) ?? [];
    const quoteCtas = cardBlock.match(
      /<span\b[^>]*\bdata-vehicle-card-cta=["']true["'][^>]*>/gi,
    ) ?? [];

    if (
      quoteLinks.length !== 1 ||
      quoteCtas.length !== 1 ||
      !/\bclass=["'][^"']*\bgroup\b[^"']*["']/i.test(quoteLinks[0]) ||
      !/\bclass=["'][^"']*\bgroup-hover:bg-orange-dark\b[^"']*["']/i.test(
        quoteCtas[0],
      )
    ) {
      fail(
        `${context} vehicle cards must be single, full-card quote links with a group-hover CTA.`,
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
export function validateHomeMainLinks(html, origin, approvedStaticPaths) {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];

  if (!mainHtml) {
    fail("Home output is missing its main landmark.");
  }

  const anchorTags = mainHtml.match(/<a\b[^>]*>/gi) ?? [];
  const hrefs = getAnchorHrefs(mainHtml);
  const approvedPaths = new Set(approvedStaticPaths);

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
  expectedListPricesTry = Object.fromEntries(
    ["KF-001", "KF-002", "KF-003", "KF-004"].map((sourceId) => [
      sourceId,
      JSON.parse(readFileSync(vehicleListPricePath, "utf8")).amountsMinor[
        sourceId
      ] / 100,
    ]),
  ),
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
      !cardBlock.includes("Aylık Liste Net") ||
      !cardBlock.includes("KDV hariç") ||
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
    expectedImageCount = 28,
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
      !cardBlock.includes("Aylık Liste Net") ||
      !cardBlock.includes("KDV hariç") ||
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
      /\bsrc=["']\/images\/vehicles\/[^"']+\.jpg["']/i.test(tag),
  );

  if (vehicleImageTags.length !== expectedImageCount) {
    fail(
      `Vehicle catalogue must export exactly ${expectedImageCount} approved local vehicle images.`,
    );
  }

  const vehicleImageSources = vehicleImageTags.map(
    (tag) => tag.match(/\bsrc=["']([^"']+)["']/i)?.[1],
  );

  if (new Set(vehicleImageSources).size !== vehicleImageSources.length) {
    fail("Vehicle catalogue output must not reuse a vehicle image as another record.");
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

  const missingImageTags = (mainHtml.match(/<[^/!][^>]*>/g) ?? []).filter(
    (tag) =>
      /\brole=["']img["']/i.test(tag) &&
      /\baria-label=["'][^"']*doğrulanmış araç görseli mevcut değil[^"']*["']/i.test(
        tag,
      ),
  );

  if (missingImageTags.length !== expectedMissingImageCount) {
    fail(
      `Vehicle catalogue must fail closed with exactly ${expectedMissingImageCount} missing-image placeholders.`,
    );
  }

  if (expectedImageCount + expectedMissingImageCount !== expectedCardCount) {
    fail("Vehicle catalogue media coverage does not match its card count.");
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

  if (
    catalogueLinks.some(
      (href) =>
        /^\/araclar\/[^?/#]+\/?(?:[?#].*)?$/i.test(href) &&
        href !== "/arac-listesi/",
    )
  ) {
    fail("Vehicle catalogue must not link to unimplemented vehicle detail routes.");
  }

  return {
    cardCount: cardTags.length,
    imageCount: vehicleImageTags.length,
    listPriceCount: seenPriceSourceIds.size,
    missingImageCount: missingImageTags.length,
  };
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
      );
      validateHomeVehicleFinder(html);
      validateHomeInteractionLayouts(html);
      validateHomeFeaturedVehiclePrices(html);
    }

    if (route.id === "vehicles") {
      validateVehicleCatalogueOutput(html);
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
        !approvedStaticPaths.has(resolved.pathname)
      ) {
        fail(`${context} links to an unapproved static path: ${resolved.pathname}`);
      }
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
  validatePackageAndNextConfig();
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
