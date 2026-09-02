import { createHash } from "node:crypto";
import { openSync, closeSync, readFileSync, readSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { completeRunner, completionStages, runnerCredentials, runnerHeaders, runnerJson, STAGING_ORIGIN, withRunnerRetry } from "./admin-publish-runner-client.mjs";
import { smokeStaging, validateReleaseReady, verifyStagingReleaseMarker } from "./deploy-staging-artifact.mjs";

const CHUNK_BYTES = 1024 * 1024;
function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }

export async function uploadArtifact(result, artifactPath, credentials, fetcher = fetch) {
  validateReleaseReady(result, artifactPath);
  const total = statSync(artifactPath).size;
  const chunkCount = Math.ceil(total / CHUNK_BYTES);
  if (chunkCount < 1 || chunkCount > 128) throw new Error("Staging artifact exceeds the API deployment limit.");
  const handle = openSync(artifactPath, "r");
  try {
    for (let index = 0; index < chunkCount; index++) {
      const length = Math.min(CHUNK_BYTES, total - index * CHUNK_BYTES);
      const chunk = Buffer.allocUnsafe(length);
      if (readSync(handle, chunk, 0, length, index * CHUNK_BYTES) !== length) throw new Error("Staging artifact could not be read.");
      await withRunnerRetry(async () => {
        const response = await fetcher(`${STAGING_ORIGIN}/admin-api/publish-runner-upload.php`, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(60_000),
          headers: runnerHeaders(credentials, {
            "Content-Type": "application/octet-stream",
            "Content-Length": String(length),
            "X-Kalite-Request-Id": result.requestId,
            "X-Kalite-Snapshot-SHA256": result.snapshotHash,
            "X-Kalite-Artifact-SHA256": result.artifactHash,
            "X-Kalite-Chunk-SHA256": createHash("sha256").update(chunk).digest("hex"),
            "X-Kalite-Chunk-Index": String(index),
            "X-Kalite-Chunk-Count": String(chunkCount),
          }),
          body: chunk,
        });
        if (!response.ok) throw new Error(`Artifact chunk ${index + 1}/${chunkCount} failed with HTTP ${response.status}.`);
      });
    }
  } finally { closeSync(handle); }
  return chunkCount;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const resultPath = argument("--release-result");
  const artifactPath = argument("--artifact");
  if (!resultPath || !artifactPath) throw new Error("Use --release-result and --artifact.");
  const result = JSON.parse(readFileSync(path.resolve(resultPath), "utf8"));
  const resolvedArtifact = path.resolve(artifactPath);
  const credentials = runnerCredentials();
  let failedStage = "deployment";
  let deployed = false;
  try {
    const chunkCount = await uploadArtifact(result, resolvedArtifact, credentials);
    await withRunnerRetry(() => runnerJson("/admin-api/publish-runner-deploy.php", {
      method: "POST",
      signal: AbortSignal.timeout(180_000),
      headers: runnerHeaders(credentials, { "Content-Type": "application/json", "X-Kalite-Manifest-SHA256": result.manifestHash }),
      body: JSON.stringify({ requestId: result.requestId, snapshotHash: result.snapshotHash, artifactHash: result.artifactHash, chunkCount }),
    }));
    deployed = true;
    failedStage = "smoke";
    await verifyStagingReleaseMarker(STAGING_ORIGIN, result);
    await smokeStaging(STAGING_ORIGIN);
    await withRunnerRetry(() => completeRunner(result, credentials, {
      outcome: "succeeded",
      stages: completionStages(result),
      summary: "GitHub Actions build, atomik staging deployment ve HTTPS smoke kontrolleri başarılı.",
    }));
  } catch (error) {
    let rollbackNote = "";
    if (deployed) {
      try {
        await withRunnerRetry(() => runnerJson("/admin-api/publish-runner-rollback.php", {
          method: "POST",
          headers: runnerHeaders(credentials, { "Content-Type": "application/json" }),
          body: JSON.stringify({ requestId: result.requestId, snapshotHash: result.snapshotHash, artifactHash: result.artifactHash }),
        }));
        rollbackNote = " Önceki staging sürümü geri yüklendi.";
      } catch { rollbackNote = " Otomatik rollback de doğrulanamadı; cPanel incelemesi gerekli."; }
    }
    const message = `${error instanceof Error ? error.message : "Staging deployment failed."}${rollbackNote}`.slice(0, 300);
    try {
      await withRunnerRetry(() => completeRunner(result, credentials, { outcome: "failed", stages: completionStages(result, failedStage), summary: message }));
    } catch { /* Preserve the original deployment failure in the Actions log. */ }
    throw error;
  }
}
