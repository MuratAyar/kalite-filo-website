import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
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
    "session.php",
    "login.php",
    "logout.php",
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

  assertNoReleaseSecrets(releaseRoot);
  return releaseRoot;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(scriptPath)) {
  const releaseRoot = assembleCpanelRelease(process.argv[2]);
  console.log(`cPanel ${process.argv[2]} release assembled at ${releaseRoot}`);
}
