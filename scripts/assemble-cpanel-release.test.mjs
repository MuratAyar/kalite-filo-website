import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assembleCpanelRelease,
  assertNoReleaseSecrets,
} from "./assemble-cpanel-release.mjs";

function createFixture(name) {
  const root = path.join(tmpdir(), `kalite-filo-${name}-${process.pid}-${Date.now()}`);
  mkdirSync(path.join(root, "out"), { recursive: true });
  writeFileSync(path.join(root, "out", "index.html"), "<!doctype html>");
  mkdirSync(path.join(root, "server", "forms"), { recursive: true });
  for (const file of ["teklif.php", "quote-mailer.php", "composer.json", "composer.lock"]) {
    writeFileSync(path.join(root, "server", "forms", file), "fixture");
  }
  return root;
}

test("release assembly fails clearly when Composer vendor is missing", () => {
  const root = createFixture("missing-vendor");
  assert.throws(
    () => assembleCpanelRelease("staging", root),
    /composer --working-dir=server\/forms install/,
  );
});

test("release secret scan rejects private mail configuration", () => {
  const root = createFixture("private-config");
  mkdirSync(path.join(root, "server", "forms", "vendor"), { recursive: true });
  writeFileSync(path.join(root, "server", "forms", "vendor", "autoload.php"), "fixture");
  writeFileSync(path.join(root, "out", "kalite-filo-mail.php"), "secret");
  assert.throws(() => assembleCpanelRelease("staging", root), /runtime configuration/);
  assert.throws(() => assertNoReleaseSecrets(path.join(root, "out")), /runtime configuration/);
});

test("release assembly includes the complete Composer mail runtime and no private config", () => {
  const root = createFixture("complete-runtime");
  mkdirSync(path.join(root, "server", "forms", "vendor"), { recursive: true });
  writeFileSync(
    path.join(root, "server", "forms", "vendor", "autoload.php"),
    "<?php // fixture autoloader",
  );

  const releaseRoot = assembleCpanelRelease("staging", root);
  for (const relativePath of [
    "forms/teklif.php",
    "forms/quote-mailer.php",
    "forms/composer.json",
    "forms/composer.lock",
    "forms/vendor/autoload.php",
  ]) {
    assert.equal(existsSync(path.join(releaseRoot, relativePath)), true, relativePath);
  }
  assert.equal(existsSync(path.join(releaseRoot, "forms", "kalite-filo-mail.php")), false);
  assert.equal(readFileSync(path.join(releaseRoot, "index.html"), "utf8"), "<!doctype html>");
});
