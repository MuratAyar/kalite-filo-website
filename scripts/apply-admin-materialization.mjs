import { createHash } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyReviewManifest } from "./materialize-admin-snapshot.mjs";

function fail(message) { throw new Error(`Admin materialization application failed: ${message}`); }
function sha256(file) { return createHash("sha256").update(readFileSync(file)).digest("hex"); }
function allowed(relative) {
  return [
    /^src\/data\/(?:vehicle-portfolio|vehicle-list-prices|featured-vehicle-ids|vehicle-media|article-records|article-admin-records\.en)\.json$/,
    /^src\/content\/filo-rehberi\/[a-z0-9]+(?:-[a-z0-9]+)*(?:-en)?\.md$/,
    /^public\/images\/vehicles\/(?:cards\/)?[a-z0-9][a-z0-9-]*-[a-f0-9]{12}\.(?:jpg|png|webp)$/,
    /^public\/images\/filo-rehberi\/article-[a-f0-9]{32}-[a-f0-9]{12}\.(?:jpg|png|webp)$/,
  ].some((pattern) => pattern.test(relative));
}
function contained(root, relative) {
  if (!allowed(relative)) fail(`output path is not allowed: ${relative}`);
  const target = path.resolve(root, ...relative.split("/"));
  if (!target.startsWith(`${root}${path.sep}`)) fail("output escaped its root");
  return target;
}
function emptyDirectory(directory) { return !existsSync(directory) || statSync(directory).isDirectory() && readdirSync(directory).length === 0; }

export function planRepositoryApplication(reviewRoot, repositoryRoot, snapshotHash) {
  const review = realpathSync(path.resolve(reviewRoot));
  const repository = realpathSync(path.resolve(repositoryRoot));
  const manifest = verifyReviewManifest(review, snapshotHash);
  const changes = manifest.files.map((record) => {
    const source = contained(review, record.path);
    const target = contained(repository, record.path);
    if (!existsSync(source) || lstatSync(source).isSymbolicLink() || !statSync(source).isFile()) fail(`review source is unavailable: ${record.path}`);
    if (existsSync(target) && (lstatSync(target).isSymbolicLink() || !statSync(target).isFile())) fail(`repository target is not a regular file: ${record.path}`);
    const beforeSha256 = existsSync(target) ? sha256(target) : null;
    return { path: record.path, action: beforeSha256 === record.sha256 ? "unchanged" : beforeSha256 === null ? "create" : "replace", beforeSha256, afterSha256: record.sha256, size: record.size };
  });
  return { schemaVersion: 1, snapshotHash, changes };
}

export function assertCleanRepositoryTargets(repositoryRoot, plan) {
  const changed = plan.changes.filter((item) => item.action !== "unchanged").map((item) => item.path);
  if (changed.length === 0) return;
  const result = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all", "--", ...changed], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) fail("repository target status could not be inspected");
  if (result.stdout.trim() !== "") fail("repository contains overlapping local changes");
}

export function applyRepositoryApplication(reviewRoot, repositoryRoot, backupRoot, snapshotHash) {
  const review = realpathSync(path.resolve(reviewRoot));
  const repository = realpathSync(path.resolve(repositoryRoot));
  const backup = path.resolve(backupRoot);
  if (backup === repository || backup.startsWith(`${repository}${path.sep}`)) fail("backup must remain outside the repository");
  if (!emptyDirectory(backup)) fail("backup directory must be new or empty");
  const plan = planRepositoryApplication(review, repository, snapshotHash);
  assertCleanRepositoryTargets(repository, plan);
  const changed = plan.changes.filter((item) => item.action !== "unchanged");
  mkdirSync(backup, { recursive: true });
  const staging = mkdtempSync(path.join(tmpdir(), "kalite-filo-apply-"));
  const applied = [];
  try {
    for (const item of changed) {
      const source = contained(review, item.path), staged = contained(staging, item.path);
      mkdirSync(path.dirname(staged), { recursive: true }); copyFileSync(source, staged);
      if (sha256(staged) !== item.afterSha256 || statSync(staged).size !== item.size) fail(`staged output verification failed: ${item.path}`);
    }
    for (const item of changed) {
      const target = contained(repository, item.path), staged = contained(staging, item.path), backupTarget = path.resolve(backup, ...item.path.split("/"));
      if (!backupTarget.startsWith(`${backup}${path.sep}`)) fail("backup path escaped its root");
      mkdirSync(path.dirname(target), { recursive: true });
      if (existsSync(target)) { mkdirSync(path.dirname(backupTarget), { recursive: true }); copyFileSync(target, backupTarget); }
      applied.push(item);
      if (existsSync(target)) rmSync(target);
      renameSync(staged, target);
      if (sha256(target) !== item.afterSha256 || statSync(target).size !== item.size) fail(`applied output verification failed: ${item.path}`);
    }
    const backupManifest = { schemaVersion: 1, snapshotHash, createdAt: new Date().toISOString(), files: changed.map(({ path: filePath, action, beforeSha256, afterSha256 }) => ({ path: filePath, action, beforeSha256, afterSha256 })) };
    writeFileSync(path.join(backup, "backup-manifest.json"), `${JSON.stringify(backupManifest, null, 2)}\n`, "utf8");
    return { plan, backupManifest };
  } catch (error) {
    for (const item of [...applied].reverse()) {
      const target = contained(repository, item.path), backupTarget = path.resolve(backup, ...item.path.split("/"));
      if (existsSync(target)) rmSync(target);
      if (existsSync(backupTarget)) { mkdirSync(path.dirname(target), { recursive: true }); copyFileSync(backupTarget, target); }
    }
    throw error;
  } finally { rmSync(staging, { recursive: true, force: true }); }
}

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const review = argument("--review"), repository = argument("--repository"), backup = argument("--backup"), snapshotHash = argument("--snapshot-hash"), apply = process.argv.includes("--apply");
  if (!review || !repository || !snapshotHash || apply && !backup) fail("use --review, --repository, --snapshot-hash and, with --apply, --backup");
  const plan = planRepositoryApplication(review, repository, snapshotHash); assertCleanRepositoryTargets(path.resolve(repository), plan);
  if (!apply) process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  else { const result = applyRepositoryApplication(review, repository, backup, snapshotHash); process.stdout.write(`Applied ${result.backupManifest.files.length} reviewed files; backup: ${path.resolve(backup)}\n`); }
}
