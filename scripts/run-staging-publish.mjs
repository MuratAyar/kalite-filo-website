import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyRepositoryApplication, assertCleanRepositoryTargets, planRepositoryApplication } from "./apply-admin-materialization.mjs";
import { copyPrivateMediaBinaries, createArticleMaterialization, createVehicleMaterialization, verifyReviewManifest, writeArticleMaterialization, writeReviewManifest, writeVehicleMaterialization } from "./materialize-admin-snapshot.mjs";

const stages = ["materialization", "validation", "build", "release", "deployment", "smoke"];
const hashFile = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
function fail(message) { throw new Error(`Staging publish runner failed: ${message}`); }
function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function command(binary, args, cwd) { const result = spawnSync(binary, args, { cwd, encoding: "utf8", stdio: "inherit", windowsHide: true }); if (result.status !== 0) fail(`${binary} ${args.join(" ")} exited with ${result.status ?? "unknown"}`); }
export function runnerStages(failedStage = null, releaseReady = false) { const failedIndex = failedStage === null ? -1 : stages.indexOf(failedStage); if (failedStage !== null && failedIndex < 0) fail("invalid failed stage"); return Object.fromEntries(stages.map((stage, index) => [stage, failedStage === null ? releaseReady && index < 4 ? "passed" : "skipped" : index < failedIndex ? "passed" : index === failedIndex ? "failed" : "skipped"])); }
export function writeRunnerResult(target, request, outcome, stageResults, manifestHash = null, artifactHash = null, summary = null) { const result = { schemaVersion: 1, requestId: request.id, snapshotHash: request.snapshotHash, outcome, manifestHash, artifactHash, stages: stageResults, summary, createdAt: new Date().toISOString() }; mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, "utf8"); return result; }

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const requestPath = argument("--request"), privateRoot = argument("--private-data-root"), repository = path.resolve(argument("--repository") ?? "."), review = argument("--review"), backup = argument("--backup"), artifact = argument("--artifact"), resultPath = argument("--result"), apply = process.argv.includes("--apply");
  if (!requestPath || !privateRoot || !review || !resultPath || apply && (!backup || !artifact)) fail("use --request, --private-data-root, --repository, --review, --result and, with --apply, --backup and --artifact");
  const reviewRoot = path.resolve(review); if (existsSync(reviewRoot) && readdirSync(reviewRoot).length > 0) fail("review directory must be new or empty"); mkdirSync(reviewRoot, { recursive: true });
  const request = JSON.parse(readFileSync(path.resolve(requestPath), "utf8")); let manifestHash = null, activeStage = "materialization";
  try {
    const prices = JSON.parse(readFileSync(path.join(repository, "src", "data", "vehicle-list-prices.json"), "utf8")), media = JSON.parse(readFileSync(path.join(repository, "src", "data", "vehicle-media.json"), "utf8")), articles = JSON.parse(readFileSync(path.join(repository, "src", "data", "article-records.json"), "utf8")), english = JSON.parse(readFileSync(path.join(repository, "src", "data", "article-admin-records.en.json"), "utf8"));
    const vehicles = createVehicleMaterialization(request, prices.source, media), articleMaterialization = createArticleMaterialization(request); writeVehicleMaterialization(reviewRoot, vehicles); writeArticleMaterialization(reviewRoot, articleMaterialization, articles, english); const copied = copyPrivateMediaBinaries(reviewRoot, privateRoot, vehicles, articleMaterialization); writeReviewManifest(reviewRoot, request.snapshotHash, articleMaterialization, copied); verifyReviewManifest(reviewRoot, request.snapshotHash); manifestHash = hashFile(path.join(reviewRoot, "review-manifest.json"));
    const plan = planRepositoryApplication(reviewRoot, repository, request.snapshotHash); assertCleanRepositoryTargets(repository, plan); process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`); if (!apply) { writeRunnerResult(path.resolve(resultPath), request, "plan_ready", runnerStages(), manifestHash, null, "Review and repository plan generated; no files applied."); process.exit(0); }
    applyRepositoryApplication(reviewRoot, repository, path.resolve(backup), request.snapshotHash);
    activeStage = "validation"; const npm = process.platform === "win32" ? "npm.cmd" : "npm"; command(npm, ["run", "lint"], repository); command(npm, ["run", "typecheck"], repository); command(npm, ["test"], repository); activeStage = "build"; command(npm, ["run", "release:staging"], repository); activeStage = "release"; command(npm, ["run", "verify:output"], repository);
    const artifactPath = path.resolve(artifact); mkdirSync(path.dirname(artifactPath), { recursive: true }); command("tar", ["-a", "-c", "-f", artifactPath, "-C", path.join(repository, "release", "staging"), "."], repository); writeRunnerResult(path.resolve(resultPath), request, "release_ready", runnerStages(null, true), manifestHash, hashFile(artifactPath), "Validated staging artifact is ready for explicit deployment and smoke testing.");
  } catch (error) { const message = error instanceof Error ? error.message.slice(0, 300) : "Runner failed."; writeRunnerResult(path.resolve(resultPath), request, "failed", runnerStages(activeStage), manifestHash, null, message); throw error; }
}
