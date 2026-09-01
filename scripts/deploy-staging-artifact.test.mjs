import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deploymentStages, smokeStaging, validateReleaseReady } from "./deploy-staging-artifact.mjs";

const headers = (values) => ({ get: (name) => values[name.toLowerCase()] ?? null });

test("accepts only a hash-bound release_ready artifact", () => {
  const root = mkdtempSync(path.join(tmpdir(), "kalite-filo-deploy-"));
  try {
    const artifact = path.join(root, "release.zip"); writeFileSync(artifact, "artifact");
    const hash = createHash("sha256").update("artifact").digest("hex");
    const result = { outcome: "release_ready", requestId: "publish-20260901-120000-abcdef123456", snapshotHash: "a".repeat(64), manifestHash: "b".repeat(64), artifactHash: hash, stages: { materialization: "passed", validation: "passed", build: "passed", release: "passed", deployment: "skipped", smoke: "skipped" } };
    assert.equal(validateReleaseReady(result, artifact), result);
    assert.throws(() => validateReleaseReady({ ...result, artifactHash: "c".repeat(64) }, artifact), /mismatch/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("keeps deployment and smoke evidence ordered and fail-closed", () => {
  assert.deepEqual(deploymentStages("deployment"), { materialization: "passed", validation: "passed", build: "passed", release: "passed", deployment: "failed", smoke: "skipped" });
  assert.deepEqual(deploymentStages("smoke"), { materialization: "passed", validation: "passed", build: "passed", release: "passed", deployment: "passed", smoke: "failed" });
});

test("smokes public, admin, robots and unauthenticated session contracts", async () => {
  const bodies = { "/": "<html>home</html>", "/admin/": "<html>admin</html>", "/robots.txt": "User-agent: *\nDisallow: /", "/admin-api/session.php": JSON.stringify({ authenticated: false, environment: "staging", csrfToken: "token" }) };
  await smokeStaging("https://staging.kalitefilo.com.tr", async (url) => {
    const pathname = new URL(url).pathname;
    return { ok: true, status: 200, headers: headers({ "content-type": pathname.endsWith(".php") ? "application/json" : pathname.endsWith(".txt") ? "text/plain" : "text/html", "cache-control": pathname.endsWith(".php") ? "no-store" : "public" }), text: async () => bodies[pathname] };
  });
});
