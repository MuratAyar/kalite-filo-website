import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const STAGING_ORIGIN = "https://staging.kalitefilo.com.tr";
export const RUNNER_STAGES = ["materialization", "validation", "build", "release", "deployment", "smoke"];

export function runnerCredentials(environment = process.env) {
  const token = environment.KALITE_FILO_STAGING_RUNNER_TOKEN ?? "";
  const runId = environment.GITHUB_RUN_ID ?? "";
  if (!/^[A-Za-z0-9._~-]{32,255}$/.test(token)) throw new Error("Runner token is missing or invalid.");
  if (!/^[1-9][0-9]{0,19}$/.test(runId)) throw new Error("GitHub run identity is missing or invalid.");
  return { token, runId };
}

export function runnerHeaders(credentials, extra = {}) {
  return {
    "X-Kalite-Runner-Token": credentials.token,
    "X-Kalite-Runner-Run-Id": credentials.runId,
    ...extra,
  };
}

export async function withRunnerRetry(operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await operation(); }
    catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

export async function runnerJson(pathname, options = {}, fetcher = fetch) {
  const response = await fetcher(`${STAGING_ORIGIN}${pathname}`, { redirect: "error", signal: AbortSignal.timeout(60_000), ...options });
  const text = await response.text();
  if (text.length > 36_000_000) throw new Error(`Runner API ${pathname} returned an oversized response.`);
  let payload;
  try { payload = text === "" ? {} : JSON.parse(text); }
  catch { throw new Error(`Runner API ${pathname} returned malformed JSON.`); }
  if (!response.ok) {
    const reason = typeof payload?.reason === "string" && /^[a-z0-9_]{3,64}$/.test(payload.reason)
      ? `; reason=${payload.reason}`
      : "";
    throw new Error(`Runner API ${pathname} failed with HTTP ${response.status} (${payload?.error ?? "unknown"}${reason}).`);
  }
  return payload;
}

export function sha256File(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function completionStages(result, failedStage = null) {
  if (result?.outcome === "release_ready" && failedStage === null) {
    return Object.fromEntries(RUNNER_STAGES.map((stage) => [stage, "passed"]));
  }
  const source = result?.stages && typeof result.stages === "object" ? result.stages : {};
  if (failedStage === "deployment" || failedStage === "smoke") {
    return Object.fromEntries(RUNNER_STAGES.map((stage) => [stage,
      stage === failedStage ? "failed"
        : RUNNER_STAGES.indexOf(stage) < RUNNER_STAGES.indexOf(failedStage) ? "passed" : "skipped",
    ]));
  }
  return Object.fromEntries(RUNNER_STAGES.map((stage) => [stage,
    ["passed", "failed", "skipped"].includes(source[stage]) ? source[stage] : "skipped",
  ]));
}

export async function completeRunner(result, credentials, overrides = {}, fetcher = fetch) {
  const requestId = overrides.requestId ?? result?.requestId;
  const snapshotHash = overrides.snapshotHash ?? result?.snapshotHash;
  const outcome = overrides.outcome ?? (result?.outcome === "release_ready" ? "succeeded" : "failed");
  const completed = {
    outcome,
    manifestHash: result?.manifestHash ?? null,
    artifactHash: result?.artifactHash ?? null,
    stages: overrides.stages ?? completionStages(result),
    summary: String(overrides.summary ?? result?.summary ?? "GitHub Actions runner completed.").slice(0, 300),
  };
  return runnerJson("/admin-api/publish-runner-complete.php", {
    method: "POST",
    headers: runnerHeaders(credentials, { "Content-Type": "application/json" }),
    body: JSON.stringify({ requestId, snapshotHash, result: completed }),
  }, fetcher);
}
