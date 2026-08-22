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
const target = process.argv[2];

if (!allowedTargets.has(target)) {
  throw new Error(
    `Release target must be one of: ${Array.from(allowedTargets).join(", ")}.`,
  );
}

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const staticOutput = path.resolve(repositoryRoot, "out");
const releaseBase = path.resolve(repositoryRoot, "release");
const releaseRoot = path.resolve(releaseBase, target);
const phpSource = path.resolve(repositoryRoot, "server", "forms", "teklif.php");

if (!releaseRoot.startsWith(`${releaseBase}${path.sep}`)) {
  throw new Error("Resolved release path escaped the project release directory.");
}

if (!existsSync(path.join(staticOutput, "index.html"))) {
  throw new Error("Static output is missing. Run the matching build before assembly.");
}

if (!existsSync(phpSource)) {
  throw new Error("The reviewed quote form PHP source is missing.");
}

rmSync(releaseRoot, { force: true, recursive: true });
mkdirSync(releaseRoot, { recursive: true });
cpSync(staticOutput, releaseRoot, { recursive: true });

const formsDirectory = path.join(releaseRoot, "forms");
mkdirSync(formsDirectory, { recursive: true });
copyFileSync(phpSource, path.join(formsDirectory, "teklif.php"));

function assertNoSecrets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const resolved = path.join(directory, entry.name);
    if (entry.name === ".env" || entry.name.startsWith(".env.")) {
      throw new Error(`Secret-bearing environment file found in release: ${resolved}`);
    }
    if (entry.isDirectory()) assertNoSecrets(resolved);
  }
}

assertNoSecrets(releaseRoot);
console.log(`cPanel ${target} release assembled at ${releaseRoot}`);
