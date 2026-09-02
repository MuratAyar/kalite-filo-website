import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { completeRunner, runnerCredentials, withRunnerRetry } from "./admin-publish-runner-client.mjs";

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const resultPath = argument("--result");
  if (!resultPath || !existsSync(resultPath)) throw new Error("A runner failure result is unavailable.");
  const result = JSON.parse(readFileSync(path.resolve(resultPath), "utf8"));
  if (result.outcome !== "failed") throw new Error("Runner result is not a build failure.");
  const credentials = runnerCredentials();
  await withRunnerRetry(() => completeRunner(result, credentials, { outcome: "failed" }));
}
