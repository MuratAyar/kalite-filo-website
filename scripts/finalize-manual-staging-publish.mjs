import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deploymentStages, smokeStaging, validateReleaseReady, verifyStagingReleaseMarker } from "./deploy-staging-artifact.mjs";

const fail = (message) => { throw new Error(`Manual staging finalization failed: ${message}`); };
const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
export function writeManualDeploymentResult(target, release, outcome, failedStage = null, summary = null) {
  const result = { schemaVersion: 1, requestId: release.requestId, snapshotHash: release.snapshotHash, outcome, manifestHash: release.manifestHash, artifactHash: release.artifactHash, stages: deploymentStages(failedStage), summary, createdAt: new Date().toISOString() };
  mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, "utf8"); return result;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const releaseResultPath = argument("--release-result"), artifactPath = argument("--artifact"), resultPath = argument("--result");
  if (!releaseResultPath || !artifactPath || !resultPath) fail("use --release-result, --artifact and --result");
  const release = validateReleaseReady(JSON.parse(readFileSync(path.resolve(releaseResultPath), "utf8")), path.resolve(artifactPath));
  const origin = "https://staging.kalitefilo.com.tr"; let failedStage = "deployment";
  try {
    await verifyStagingReleaseMarker(origin, release); failedStage = "smoke"; await smokeStaging(origin);
    writeManualDeploymentResult(path.resolve(resultPath), release, "succeeded", null, "Manual cPanel deployment identity and HTTPS smoke checks passed.");
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Manual staging verification failed.";
    writeManualDeploymentResult(path.resolve(resultPath), release, "failed", failedStage, message); throw error;
  }
}
