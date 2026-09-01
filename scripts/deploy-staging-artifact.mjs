import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const sha256File = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const fail = (message) => { throw new Error(`Staging deployment failed: ${message}`); };
const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
const bounded = (value, pattern, label) => { if (!value || !pattern.test(value)) fail(`invalid ${label}`); return value; };

export function validateReleaseReady(result, artifactPath) {
  if (result?.outcome !== "release_ready") fail("runner result is not release_ready");
  if (!/^[a-f0-9]{64}$/.test(result.artifactHash ?? "")) fail("runner artifact hash is invalid");
  if (!/^[a-f0-9]{64}$/.test(result.manifestHash ?? "")) fail("runner manifest hash is invalid");
  if (!/^[a-f0-9]{64}$/.test(result.snapshotHash ?? "")) fail("runner snapshot hash is invalid");
  if (!/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/.test(result.requestId ?? "")) fail("runner request ID is invalid");
  for (const stage of ["materialization", "validation", "build", "release"]) if (result.stages?.[stage] !== "passed") fail(`${stage} is not passed`);
  if (result.stages?.deployment !== "skipped" || result.stages?.smoke !== "skipped") fail("release_ready result already claims deployment evidence");
  if (!existsSync(artifactPath) || sha256File(artifactPath) !== result.artifactHash) fail("artifact SHA-256 mismatch");
  return result;
}

export function deploymentStages(failedStage = null) {
  if (failedStage !== null && !["deployment", "smoke"].includes(failedStage)) fail("invalid deployment stage");
  return {
    materialization: "passed", validation: "passed", build: "passed", release: "passed",
    deployment: failedStage === "deployment" ? "failed" : "passed",
    smoke: failedStage === "smoke" ? "failed" : failedStage === "deployment" ? "skipped" : "passed",
  };
}

export async function smokeStaging(origin, fetcher = fetch) {
  const checks = [
    ["/", "text/html"], ["/admin/", "text/html"], ["/robots.txt", "text/plain"],
    ["/admin-api/session.php", "application/json"],
  ];
  for (const [pathname, contentType] of checks) {
    const response = await fetcher(`${origin}${pathname}`, { redirect: "error", headers: { "cache-control": "no-cache" } });
    if (!response.ok) fail(`smoke ${pathname} returned HTTP ${response.status}`);
    if (!(response.headers.get("content-type") ?? "").toLowerCase().includes(contentType)) fail(`smoke ${pathname} returned an unexpected content type`);
    const body = await response.text();
    if (body.length < 2) fail(`smoke ${pathname} returned an empty body`);
    if (pathname === "/admin-api/session.php") {
      const session = JSON.parse(body);
      if (session.authenticated !== false || session.environment !== "staging" || typeof session.csrfToken !== "string") fail("session smoke did not return the unauthenticated staging contract");
      if (!(response.headers.get("cache-control") ?? "").toLowerCase().includes("no-store")) fail("session smoke is missing no-store");
    }
    if (pathname === "/robots.txt" && !/disallow:\s*\//i.test(body)) fail("staging robots policy is not fail-closed");
  }
}

export async function verifyStagingReleaseMarker(origin, expected, fetcher = fetch) {
  const response = await fetcher(`${origin}/kalite-filo-release.json`, { redirect: "error", headers: { "cache-control": "no-cache" } });
  if (!response.ok) fail(`release marker returned HTTP ${response.status}`);
  const marker = JSON.parse(await response.text());
  for (const key of ["requestId", "snapshotHash", "manifestHash"]) if (marker?.[key] !== expected?.[key]) fail(`release marker ${key} mismatch`);
  if (marker.schemaVersion !== 1 || marker.target !== "staging") fail("release marker contract is invalid");
  return marker;
}

const remoteScript = String.raw`set -euo pipefail
artifact="$1"; expected="$2"; document_root="$3"; work_root="$4"; release_id="$5"
command -v sha256sum >/dev/null
command -v unzip >/dev/null
command -v rsync >/dev/null
command -v realpath >/dev/null
[ "$(sha256sum "$artifact" | awk '{print $1}')" = "$expected" ]
[ -d "$document_root" ] && [ ! -L "$document_root" ]
[ "$(realpath "$document_root")" = "$document_root" ]
incoming="$work_root/incoming-$release_id"; backup="$work_root/rollback-$release_id"
[ ! -e "$incoming" ] && [ ! -e "$backup" ]
mkdir -p "$incoming" "$backup"
unzip -q "$artifact" -d "$incoming"
[ -f "$incoming/index.html" ] && [ -f "$incoming/admin/index.html" ] && [ -f "$incoming/admin-api/session.php" ]
rsync -a "$document_root/" "$backup/"
restore() { rsync -a --delete "$backup/" "$document_root/"; }
trap restore ERR INT TERM
rsync -a --delete "$incoming/" "$document_root/"
trap - ERR INT TERM
rm -rf "$incoming" "$artifact"
printf '%s' "$backup"
`;

function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: "utf8", windowsHide: true, ...options });
  if (result.status !== 0) fail(`${binary} failed: ${(result.stderr || result.stdout || "unknown error").trim().slice(0, 300)}`);
  return result.stdout.trim();
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const releaseResultPath = path.resolve(argument("--release-result") ?? "");
  const artifactPath = path.resolve(argument("--artifact") ?? "");
  const outputPath = path.resolve(argument("--result") ?? "");
  if (!argument("--release-result") || !argument("--artifact") || !argument("--result")) fail("use --release-result, --artifact and --result");
  const release = validateReleaseReady(JSON.parse(readFileSync(releaseResultPath, "utf8")), artifactPath);
  const target = bounded(process.env.KALITE_FILO_STAGING_SSH_TARGET, /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, "KALITE_FILO_STAGING_SSH_TARGET");
  const documentRoot = bounded(process.env.KALITE_FILO_STAGING_DOCUMENT_ROOT, /^\/home\/[a-zA-Z0-9._-]+\/staging\.kalitefilo\.com\.tr$/, "KALITE_FILO_STAGING_DOCUMENT_ROOT");
  const workRoot = bounded(process.env.KALITE_FILO_STAGING_REMOTE_WORK_ROOT, /^\/home\/[a-zA-Z0-9._-]+\/private\/kalite-filo-deploy\/staging$/, "KALITE_FILO_STAGING_REMOTE_WORK_ROOT");
  const origin = process.env.KALITE_FILO_STAGING_ORIGIN ?? "https://staging.kalitefilo.com.tr";
  if (origin !== "https://staging.kalitefilo.com.tr") fail("staging origin must be canonical");
  const sshArgs = ["-o", "BatchMode=yes"], scpArgs = ["-o", "BatchMode=yes"];
  const port = process.env.KALITE_FILO_STAGING_SSH_PORT;
  if (port) { bounded(port, /^\d{1,5}$/, "SSH port"); sshArgs.push("-p", port); scpArgs.push("-P", port); }
  const key = process.env.KALITE_FILO_STAGING_SSH_KEY;
  if (key) { sshArgs.push("-i", key); scpArgs.push("-i", key); }
  const releaseId = `${release.requestId}-${release.artifactHash.slice(0, 12)}`;
  const remoteArtifact = `${workRoot}/${releaseId}.zip`;
  let failedStage = "deployment", rollbackRef = null;
  try {
    run("ssh", [...sshArgs, target, "mkdir", "-p", workRoot]);
    run("scp", [...scpArgs, artifactPath, `${target}:${remoteArtifact}`]);
    rollbackRef = run("ssh", [...sshArgs, target, "bash", "-s", "--", remoteArtifact, release.artifactHash, documentRoot, workRoot, releaseId], { input: remoteScript });
    if (rollbackRef !== `${workRoot}/rollback-${releaseId}`) fail("remote rollback reference is invalid");
    failedStage = "smoke";
    await smokeStaging(origin);
    const result = { schemaVersion: 1, requestId: release.requestId, snapshotHash: release.snapshotHash, outcome: "succeeded", manifestHash: release.manifestHash, artifactHash: release.artifactHash, stages: deploymentStages(), summary: `Staging deployment and HTTPS smoke passed; rollback ${path.posix.basename(rollbackRef)} retained.`, createdAt: new Date().toISOString(), rollbackRef };
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  } catch (error) {
    if (failedStage === "smoke" && rollbackRef === `${workRoot}/rollback-${releaseId}`) {
      try { run("ssh", [...sshArgs, target, "rsync", "-a", "--delete", `${rollbackRef}/`, `${documentRoot}/`]); } catch { /* Preserve the original smoke failure; rollback state remains retained remotely. */ }
    }
    const message = error instanceof Error ? error.message.slice(0, 300) : "Staging deployment failed.";
    const result = { schemaVersion: 1, requestId: release.requestId, snapshotHash: release.snapshotHash, outcome: "failed", manifestHash: release.manifestHash, artifactHash: release.artifactHash, stages: deploymentStages(failedStage), summary: message, createdAt: new Date().toISOString(), rollbackRef };
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    throw error;
  }
}
