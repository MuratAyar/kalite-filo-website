import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    /\.(?:ts|tsx|js|jsx|mjs|json)$/.test(file),
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

function routeToOutputFile(routePath) {
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

function validateOutput(routes) {
  const outputRoot = path.join(repositoryRoot, "out");
  const requiredFiles = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
  ];

  for (const relativePath of requiredFiles) {
    if (!existsSync(path.join(outputRoot, relativePath))) {
      fail(`Static output is missing ${relativePath}.`);
    }
  }

  for (const route of routes) {
    if (
      route.kind === "static" &&
      route.status === "published" &&
      !existsSync(routeToOutputFile(route.path))
    ) {
      fail(`Published route is absent from out/: ${route.path}`);
    }
  }

  const outputFiles = walkFiles(outputRoot).filter((file) =>
    /\.(?:html|css|js|json|xml|txt|webmanifest|svg)$/.test(file),
  );

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
    [
      /https?:\/\/(?:lh3\.googleusercontent\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.tailwindcss\.com)/i,
      "a prohibited remote asset",
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

  assertRobotsMetadata(
    getMetaContent(rootHtml, "robots"),
    getRouteRobotsPolicy(homeRoute, deployTarget),
    `${deployTarget} Home`,
  );

  const expectedCanonical = new URL(homeRoute.path, environment.origin).toString();
  if (getCanonicalHref(rootHtml) !== expectedCanonical) {
    fail(`${deployTarget} Home has an unexpected canonical URL.`);
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
