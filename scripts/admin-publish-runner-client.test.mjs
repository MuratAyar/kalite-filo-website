import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { completionStages, runnerCredentials, runnerHeaders, runnerJson } from "./admin-publish-runner-client.mjs";
import { uploadArtifact } from "./deploy-staging-via-admin-api.mjs";
import { requiredPrivateMedia } from "./fetch-staging-publish-inputs.mjs";

test("requires bounded machine credentials and emits no query-string secret", () => {
  const credentials = runnerCredentials({ KALITE_FILO_STAGING_RUNNER_TOKEN: "a".repeat(64), GITHUB_RUN_ID: "12345" });
  assert.equal(runnerHeaders(credentials)["X-Kalite-Runner-Token"], "a".repeat(64));
  assert.throws(() => runnerCredentials({ KALITE_FILO_STAGING_RUNNER_TOKEN: "short", GITHUB_RUN_ID: "1" }), /token/);
});

test("rejects unsuccessful and malformed runner API responses", async () => {
  await assert.rejects(() => runnerJson("/test", {}, async () => new Response("not-json", { status: 200 })), /malformed/);
  await assert.rejects(() => runnerJson("/test", {}, async () => new Response('{"error":"denied"}', { status: 401 })), /HTTP 401/);
});

test("selects only snapshot-bound private media without duplicates", () => {
  const media = { id: "a".repeat(32), extension: "webp", checksum: "b".repeat(64), size: 10 };
  const request = { snapshot: { vehicles: [{ draftMedia: media }, { draftMedia: media }], media: [media], articles: [{ coverMediaId: media.id }] } };
  assert.deepEqual(requiredPrivateMedia(request).map((item) => item.kind), ["library", "vehicle"]);
});

test("uploads a release in bounded hash-addressed chunks", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "kalite-filo-api-upload-"));
  try {
    const artifact = path.join(root, "release.tar");
    writeFileSync(artifact, Buffer.alloc(1024 * 1024 + 7, 7));
    const { createHash } = await import("node:crypto");
    const result = {
      outcome: "release_ready", requestId: "publish-20260901-120000-abcdef123456",
      snapshotHash: "a".repeat(64), manifestHash: "b".repeat(64),
      artifactHash: createHash("sha256").update(Buffer.alloc(1024 * 1024 + 7, 7)).digest("hex"),
      stages: { materialization: "passed", validation: "passed", build: "passed", release: "passed", deployment: "skipped", smoke: "skipped" },
    };
    const calls = [];
    const count = await uploadArtifact(result, artifact, { token: "c".repeat(64), runId: "8" }, async (_url, options) => {
      calls.push(options);
      return new Response("{}", { status: 200 });
    });
    assert.equal(count, 2);
    assert.equal(calls[0].headers["X-Kalite-Chunk-Count"], "2");
    assert.equal(calls[1].headers["Content-Length"], "7");
    assert.equal(completionStages(result).smoke, "passed");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
