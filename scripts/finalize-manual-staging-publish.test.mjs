import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { writeManualDeploymentResult } from "./finalize-manual-staging-publish.mjs";

test("writes bounded manual deployment evidence",()=>{const root=mkdtempSync(path.join(tmpdir(),"kalite-filo-manual-result-"));try{const target=path.join(root,"result.json"),release={requestId:"publish-20260901-120000-abcdef123456",snapshotHash:"a".repeat(64),manifestHash:"b".repeat(64),artifactHash:"c".repeat(64)},result=writeManualDeploymentResult(target,release,"failed","smoke","Smoke failed.");assert.equal(result.stages.deployment,"passed");assert.equal(result.stages.smoke,"failed");assert.equal(JSON.parse(readFileSync(target,"utf8")).requestId,release.requestId);}finally{rmSync(root,{recursive:true,force:true});}});
