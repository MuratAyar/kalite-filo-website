import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(path.join(root,"deploy","staging","deploy-release.sh"),"utf8");
test("manual cPanel deploy executor is staging-contained and fail-closed",()=>{assert.match(source,/set -Eeuo pipefail/);assert.match(source,/staging\.kalitefilo\.com\.tr/);assert.match(source,/private\/kalite-filo-deploy\/staging/);assert.match(source,/artifact SHA-256 mismatch/);assert.match(source,/archive contains path traversal/);assert.match(source,/release marker identity mismatch/);assert.match(source,/mv -- "\$document_root" "\$rollback"/);assert.match(source,/ROLLBACK_SUCCEEDED/);assert.match(source,/preserved release identity mismatch/);assert.match(source,/REAPPLY_SUCCEEDED/);assert.doesNotMatch(source,/public_html|document_root="\$\{account_root\}\/kalitefilo\.com\.tr"/);});
