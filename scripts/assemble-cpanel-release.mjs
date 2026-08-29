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

export function createAdminContentSnapshot(repositoryRoot, target) {
  const vehicles = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-portfolio.json"),
    "utf8",
  ));
  const articles = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "article-records.json"),
    "utf8",
  ));
  const prices = JSON.parse(readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-list-prices.json"), "utf8",
  ));
  const mediaSource = readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-portfolio.ts"), "utf8",
  );
  const mediaById = {};
  for (const match of mediaSource.matchAll(/"(kf-\d{3})": createPortfolioMedia\(\{([\s\S]*?)\n  \}\),/g)) {
    const text = match[2];
    const field = (name) => text.match(new RegExp(`${name}:\\s*"([^"]+)"`))?.[1];
    const numberField = (name) => Number(text.match(new RegExp(`${name}:\\s*(\\d+)`))?.[1]);
    const fileName = field("fileName");
    if (fileName) mediaById[match[1]] = {
      src: `/images/vehicles/cards/${fileName}`,
      alt: field("alt") ?? "",
      width: numberField("width"), height: numberField("height"),
      creator: field("creator") ?? "", sourcePage: field("sourcePage") ?? "",
      licenseName: field("licenseName") ?? "", licenseUrl: field("licenseUrl") ?? "",
    };
  }
  if (!Array.isArray(vehicles) || !Array.isArray(articles)) {
    throw new Error("Admin content snapshot sources must be JSON arrays.");
  }
  return {
    schemaVersion: 1,
    environment: target,
    generatedAt: new Date().toISOString(),
    vehicles: {
      active: vehicles.filter((vehicle) => vehicle?.sourceStatus === "active").length,
      featured: vehicles.filter(
        (vehicle) => vehicle?.sourceStatus === "active" && vehicle?.featured === true,
      ).length,
      records: vehicles.map((vehicle) => ({
        ...vehicle,
        publicationStatus: vehicle.sourceStatus === "active" ? "published" : "unpublished",
        priceAmountMinor: prices.amountsMinor?.[vehicle.sourceId] ?? null,
        coverImage: mediaById[vehicle.id] ?? null,
      })),
    },
    articles: {
      total: articles.length,
      draft: articles.filter((article) => article?.publicationStatus === "draft").length,
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
    "vehicle-store.php",
    "vehicles.php",
    "vehicle.php",
    "vehicle-media.php",
    "media.php",
    "media-file.php",
    "media-delete.php",
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
