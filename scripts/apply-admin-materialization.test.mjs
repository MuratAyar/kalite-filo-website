import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { applyRepositoryApplication, assertCleanRepositoryTargets, planRepositoryApplication } from "./apply-admin-materialization.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "kalite-filo-apply-test-")), review = path.join(root, "review"), repository = path.join(root, "repository"), backup = path.join(root, "backup"), snapshotHash = "a".repeat(64);
  mkdirSync(path.join(review, "src", "data"), { recursive: true }); mkdirSync(path.join(repository, "src", "data"), { recursive: true });
  const replacement = "{\"version\":2}\n", created = "[\"one\",\"two\",\"three\",\"four\"]\n";
  writeFileSync(path.join(review, "src", "data", "vehicle-portfolio.json"), replacement); writeFileSync(path.join(review, "src", "data", "featured-vehicle-ids.json"), created); writeFileSync(path.join(repository, "src", "data", "vehicle-portfolio.json"), "{\"version\":1}\n");
  const files = [{ path: "src/data/featured-vehicle-ids.json", size: Buffer.byteLength(created), sha256: hash(created) }, { path: "src/data/vehicle-portfolio.json", size: Buffer.byteLength(replacement), sha256: hash(replacement) }];
  writeFileSync(path.join(review, "review-manifest.json"), `${JSON.stringify({ schemaVersion: 1, snapshotHash, files }, null, 2)}\n`);
  spawnSync("git", ["init", "--quiet"], { cwd: repository }); spawnSync("git", ["add", "."], { cwd: repository }); spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "fixture"], { cwd: repository });
  return { root, review, repository, backup, snapshotHash };
}

test("plans and applies only manifested allowlisted files with an external backup", () => { const value = fixture(); try { const plan = planRepositoryApplication(value.review, value.repository, value.snapshotHash); assert.deepEqual(plan.changes.map((item) => item.action), ["create", "replace"]); const result = applyRepositoryApplication(value.review, value.repository, value.backup, value.snapshotHash); assert.equal(result.backupManifest.files.length, 2); assert.equal(readFileSync(path.join(value.repository, "src", "data", "vehicle-portfolio.json"), "utf8"), "{\"version\":2}\n"); assert.equal(readFileSync(path.join(value.backup, "src", "data", "vehicle-portfolio.json"), "utf8"), "{\"version\":1}\n"); assert.equal(JSON.parse(readFileSync(path.join(value.backup, "backup-manifest.json"), "utf8")).snapshotHash, value.snapshotHash); } finally { rmSync(value.root, { recursive: true, force: true }); } });
test("rejects an overlapping repository change before application", () => { const value = fixture(); try { writeFileSync(path.join(value.repository, "src", "data", "vehicle-portfolio.json"), "local change\n"); const plan = planRepositoryApplication(value.review, value.repository, value.snapshotHash); assert.throws(() => assertCleanRepositoryTargets(value.repository, plan), /overlapping local changes/); } finally { rmSync(value.root, { recursive: true, force: true }); } });
test("rejects a manifested path outside the publication allowlist", () => { const value = fixture(); try { const bytes = "forbidden"; writeFileSync(path.join(value.review, "secret.php"), bytes); const manifest = JSON.parse(readFileSync(path.join(value.review, "review-manifest.json"), "utf8")); manifest.files.unshift({ path: "secret.php", size: Buffer.byteLength(bytes), sha256: hash(bytes) }); writeFileSync(path.join(value.review, "review-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`); assert.throws(() => planRepositoryApplication(value.review, value.repository, value.snapshotHash), /not allowed/); } finally { rmSync(value.root, { recursive: true, force: true }); } });
