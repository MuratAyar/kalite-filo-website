import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerCredentials, runnerHeaders, runnerJson, STAGING_ORIGIN, withRunnerRetry } from "./admin-publish-runner-client.mjs";
import { validatePublishRequest } from "./materialize-admin-snapshot.mjs";

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function bounded(value, pattern, label) { if (!value || !pattern.test(value)) throw new Error(`Invalid ${label}.`); return value; }

export function requiredPrivateMedia(request) {
  const result = new Map();
  const add = (kind, media) => {
    if (!media || !/^[a-f0-9]{32}$/.test(media.id ?? "") || !["jpg", "png", "webp"].includes(media.extension)
      || !/^[a-f0-9]{64}$/.test(media.checksum ?? "") || !Number.isSafeInteger(media.size) || media.size < 1 || media.size > 5_242_880) {
      throw new Error("Frozen private media identity is invalid.");
    }
    result.set(`${kind}:${media.id}`, { ...media, kind });
  };
  for (const vehicle of request.snapshot.vehicles) {
    const mediaRecords = Array.isArray(vehicle?.galleryMedia)
      ? vehicle.galleryMedia
      : (vehicle?.draftMedia ? [vehicle.draftMedia] : []);
    for (const media of mediaRecords) add("vehicle", media);
  }
  const mediaById = new Map(request.snapshot.media.map((media) => [media?.id, media]));
  for (const article of request.snapshot.articles) {
    if (!article?.coverMediaId) continue;
    const media = mediaById.get(article.coverMediaId);
    if (media) add("library", media);
  }
  return [...result.values()].sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`, "en"));
}

async function downloadMedia(item, identity, credentials, privateRoot, fetcher = fetch) {
  const query = new URLSearchParams({
    requestId: identity.requestId,
    snapshotHash: identity.snapshotHash,
    kind: item.kind,
    id: item.id,
    extension: item.extension,
  });
  const response = await withRunnerRetry(async () => {
    const candidate = await fetcher(`${STAGING_ORIGIN}/admin-api/publish-runner-media.php?${query}`, {
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
      headers: runnerHeaders(credentials),
    });
    if (!candidate.ok) throw new Error(`Private media ${item.id} returned HTTP ${candidate.status}.`);
    return candidate;
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== item.size || createHash("sha256").update(buffer).digest("hex") !== item.checksum) {
    throw new Error(`Private media ${item.id} failed integrity validation.`);
  }
  const directory = path.join(privateRoot, "media", item.kind === "vehicle" ? "vehicles" : "library");
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `${item.id}.${item.extension}`), buffer, { mode: 0o600 });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  const requestId = bounded(argument("--request-id"), /^publish-\d{8}-\d{6}-[a-f0-9]{12}$/, "request ID");
  const snapshotHash = bounded(argument("--snapshot-hash"), /^[a-f0-9]{64}$/, "snapshot hash");
  const output = path.resolve(argument("--output") ?? "");
  const privateRoot = path.resolve(argument("--private-data-root") ?? "");
  if (!argument("--output") || !argument("--private-data-root")) throw new Error("Use --output and --private-data-root.");
  const credentials = runnerCredentials();
  const query = new URLSearchParams({ id: requestId, snapshotHash });
  const payload = await withRunnerRetry(() => runnerJson(`/admin-api/publish-runner-request.php?${query}`, {
    headers: runnerHeaders(credentials),
  }));
  const request = payload?.request;
  validatePublishRequest(request);
  if (request.id !== requestId || request.snapshotHash !== snapshotHash) throw new Error("Frozen request identity mismatch.");
  mkdirSync(path.dirname(output), { recursive: true });
  mkdirSync(privateRoot, { recursive: true });
  writeFileSync(output, `${JSON.stringify(request, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  for (const item of requiredPrivateMedia(request)) await downloadMedia(item, { requestId, snapshotHash }, credentials, privateRoot);
}
