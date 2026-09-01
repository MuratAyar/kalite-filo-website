import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { command, runnerStages, writeRunnerResult, writeStagingReleaseMarker } from "./run-staging-publish.mjs";

test("creates bounded release-ready stage evidence without claiming deployment",()=>{const value=runnerStages(null,true);assert.deepEqual(value,{materialization:"passed",validation:"passed",build:"passed",release:"passed",deployment:"skipped",smoke:"skipped"});});
test("creates ordered fail-closed stage evidence",()=>{assert.deepEqual(runnerStages("build"),{materialization:"passed",validation:"passed",build:"failed",release:"skipped",deployment:"skipped",smoke:"skipped"});assert.throws(()=>runnerStages("unknown"),/invalid failed stage/);});
test("writes a bounded runner result bound to request and snapshot",()=>{const root=mkdtempSync(path.join(tmpdir(),"kalite-filo-runner-result-"));try{const target=path.join(root,"result.json"),request={id:"publish-one",snapshotHash:"a".repeat(64)},result=writeRunnerResult(target,request,"plan_ready",runnerStages(),"b".repeat(64),null,"No files applied.");assert.equal(result.requestId,"publish-one");assert.equal(JSON.parse(readFileSync(target,"utf8")).snapshotHash,request.snapshotHash);}finally{rmSync(root,{recursive:true,force:true});}});
test("surfaces command start errors instead of an unknown exit",()=>{assert.throws(()=>command("missing-command",[],process.cwd(),()=>({status:null,error:new Error("spawn failed")})),/could not start: spawn failed/);});
test("writes a non-secret staging marker bound to the frozen request",()=>{const root=mkdtempSync(path.join(tmpdir(),"kalite-filo-release-marker-"));try{const request={id:"publish-20260901-120000-abcdef123456",snapshotHash:"a".repeat(64)},marker=writeStagingReleaseMarker(root,request,"b".repeat(64));assert.equal(marker.target,"staging");assert.deepEqual(JSON.parse(readFileSync(path.join(root,"kalite-filo-release.json"),"utf8")),marker);}finally{rmSync(root,{recursive:true,force:true});}});
