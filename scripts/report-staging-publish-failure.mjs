import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { completeRunner, runnerCredentials, runnerHeaders, runnerJson, withRunnerRetry } from "./admin-publish-runner-client.mjs";

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const resultPath = argument("--result");
  const credentials = runnerCredentials();
  if (resultPath && existsSync(resultPath)) {
    const result = JSON.parse(readFileSync(path.resolve(resultPath), "utf8"));
    if (result.outcome === "failed") {
      await withRunnerRetry(() => completeRunner(result, credentials, { outcome: "failed" }));
      process.exit(0);
    }
  }
  const requestId = argument("--request-id");
  const snapshotHash = argument("--snapshot-hash");
  if (!/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/.test(requestId ?? "") || !/^[a-f0-9]{64}$/.test(snapshotHash ?? "")) {
    throw new Error("A valid request ID and snapshot hash are required for an early runner failure.");
  }
  await withRunnerRetry(() => runnerJson("/admin-api/publish-runner-fail.php", {
    method: "POST",
    headers: runnerHeaders(credentials, { "Content-Type": "application/json" }),
    body: JSON.stringify({ requestId, snapshotHash, stage: "materialization", summary: "GitHub Actions snapshot claim or input preparation failed." }),
  }));
}
