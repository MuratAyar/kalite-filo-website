import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assembleCpanelRelease,
  assertNoReleaseSecrets,
  createAdminContentSnapshot,
} from "./assemble-cpanel-release.mjs";

function createFixture(name) {
  const root = path.join(tmpdir(), `kalite-filo-${name}-${process.pid}-${Date.now()}`);
  mkdirSync(path.join(root, "out"), { recursive: true });
  writeFileSync(path.join(root, "out", "index.html"), "<!doctype html>");
  mkdirSync(path.join(root, "server", "forms"), { recursive: true });
  mkdirSync(path.join(root, "server", "admin-api"), { recursive: true });
  mkdirSync(path.join(root, "src", "data"), { recursive: true });
  writeFileSync(path.join(root, "src", "data", "vehicle-portfolio.json"), JSON.stringify([
    { id: "vehicle-one", sourceStatus: "active", featured: true },
    { id: "vehicle-two", sourceStatus: "active", featured: true },
    { id: "vehicle-three", sourceStatus: "archived", featured: true },
    { id: "vehicle-four", sourceStatus: "active", featured: true },
  ]));
  writeFileSync(path.join(root,"src","data","featured-vehicle-ids.json"),JSON.stringify(["vehicle-one","vehicle-two","vehicle-three","vehicle-four"]));
  writeFileSync(path.join(root, "src", "data", "article-records.json"), JSON.stringify([
    { id: "one", slug: "one", contentKey: "one", title: "Bir", excerpt: "Bir özet", categoryId: "filo-yonetimi", publishedAt: "2026-08-30", readingMinutes: 4, featured: true, publicationStatus: "published", coverImage: { alt: "Türkçe alternatif metin" }, seo: { title: "Bir | Kalite Filo", description: "Bir meta açıklaması" } },
    { id: "two", slug: "two", contentKey: "two", publicationStatus: "draft" },
  ]));
  writeFileSync(path.join(root, "src", "data", "articles.en.ts"), '  "one": { slug: "one-english", title: "One", excerpt: "One excerpt", alt: "English alternative text" },\n');
  mkdirSync(path.join(root, "src", "content", "filo-rehberi"), { recursive: true });
  writeFileSync(path.join(root, "src", "content", "filo-rehberi", "one.md"), "---\ntitle: Fixture\n---\n\n## Türkçe gövde");
  writeFileSync(path.join(root, "src", "content", "filo-rehberi", "one-english-en.md"), "## English body");
  writeFileSync(path.join(root, "src", "content", "filo-rehberi", "two.md"), "fixture");
  writeFileSync(path.join(root, "src", "data", "vehicle-list-prices.json"), JSON.stringify({ amountsMinor: {} }));
  writeFileSync(path.join(root, "src", "data", "vehicle-portfolio.ts"), "const portfolioMedia = {};\n");
  for (const file of [
    "teklif.php",
    "iletisim.php",
    "bulten.php",
    "customer-mailer.php",
    "export-iys-daily.php",
    "subscriber-store.php",
    "unsubscribe-store.php",
    "unsubscribe.php",
    "quote-mailer.php",
    "composer.json",
    "composer.lock",
  ]) {
    writeFileSync(path.join(root, "server", "forms", file), "fixture");
  }
  for (const file of [
    "bootstrap.php",
    "auth.php",
    "read-model.php",
    "session.php",
    "login.php",
    "logout.php",
    "dashboard.php",
    "audit.php",
    "articles.php",
    "article-store.php",
    "article-preview.php",
    "article.php",
    "article-revisions.php",
    "article-import.php",
    "subscribers.php",
    "iys.php",
    "iys-export.php",
    "iys-download.php",
    "subscriber-operation.php",
    "campaign-store.php",
    "campaigns.php",
    "campaign.php",
    "campaign-preview.php",
    "campaign-test-mailer.php",
    "campaign-test.php",
    "campaign-queue-store.php",
    "campaign-queue.php",
    "campaign-worker.php",
    "vehicle-store.php",
    "vehicles.php",
    "vehicle.php",
    "vehicle-revisions.php",
    "vehicle-media.php",
    "media.php",
    "media-store.php",
    "media-update.php",
    "media-file.php",
    "media-delete.php",
    "taxonomy-store.php",
    "tags.php",
    "featured-vehicles.php",
    "publishing-store.php",
    "publishing.php",
    "publish-staging.php",
  ]) {
    writeFileSync(path.join(root, "server", "admin-api", file), "fixture");
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

test("release secret scan rejects an admin config inside a web root", () => {
  const root = createFixture("private-admin-config");
  mkdirSync(path.join(root, "out", "admin-api"), { recursive: true });
  writeFileSync(path.join(root, "out", "admin-api", "config.php"), "secret");
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
    "forms/iletisim.php",
    "forms/bulten.php",
    "forms/customer-mailer.php",
    "forms/export-iys-daily.php",
    "forms/subscriber-store.php",
    "forms/unsubscribe-store.php",
    "forms/unsubscribe.php",
    "forms/quote-mailer.php",
    "forms/composer.json",
    "forms/composer.lock",
    "forms/vendor/autoload.php",
    "admin-api/bootstrap.php",
    "admin-api/auth.php",
    "admin-api/read-model.php",
    "admin-api/session.php",
    "admin-api/login.php",
    "admin-api/logout.php",
    "admin-api/dashboard.php",
    "admin-api/audit.php",
    "admin-api/articles.php",
    "admin-api/article-store.php",
    "admin-api/article-preview.php",
    "admin-api/article.php",
    "admin-api/article-revisions.php",
    "admin-api/article-import.php",
    "admin-api/subscribers.php",
    "admin-api/iys.php",
    "admin-api/iys-export.php",
    "admin-api/iys-download.php",
    "admin-api/subscriber-operation.php",
    "admin-api/campaign-store.php",
    "admin-api/campaigns.php",
    "admin-api/campaign.php",
    "admin-api/campaign-preview.php",
    "admin-api/campaign-test-mailer.php",
    "admin-api/campaign-test.php",
    "admin-api/campaign-queue-store.php",
    "admin-api/campaign-queue.php",
    "admin-api/campaign-worker.php",
    "admin-api/vehicle-store.php",
    "admin-api/vehicles.php",
    "admin-api/vehicle.php",
    "admin-api/vehicle-revisions.php",
    "admin-api/vehicle-media.php",
    "admin-api/media.php",
    "admin-api/media-store.php",
    "admin-api/media-update.php",
    "admin-api/media-file.php",
    "admin-api/media-delete.php",
    "admin-api/taxonomy-store.php",
    "admin-api/tags.php",
    "admin-api/featured-vehicles.php",
    "admin-api/publishing-store.php",
    "admin-api/publishing.php",
    "admin-api/publish-staging.php",
    "admin-api/_content-snapshot.php",
  ]) {
    assert.equal(existsSync(path.join(releaseRoot, relativePath)), true, relativePath);
  }
  assert.equal(existsSync(path.join(releaseRoot, "forms", "kalite-filo-mail.php")), false);
  assert.equal(existsSync(path.join(releaseRoot, "admin-api", "kalite-filo-admin.example.php")), false);
  assert.equal(existsSync(path.join(releaseRoot, "admin-api", "tests")), false);
  assert.equal(readFileSync(path.join(releaseRoot, "index.html"), "utf8"), "<!doctype html>");
  const snapshotSource = readFileSync(
    path.join(releaseRoot, "admin-api", "_content-snapshot.php"),
    "utf8",
  );
  assert.match(snapshotSource, /^<\?php/);
  assert.equal(snapshotSource.includes("password"), false);
  const snapshot = createAdminContentSnapshot(root, "staging");
  assert.equal(snapshot.articles.records[0].translations.tr.complete, true);
  assert.equal(snapshot.articles.records[0].translations.en.complete, true);
  assert.equal(snapshot.articles.records[1].translations.en.complete, false);
  assert.equal(snapshot.articles.records[0].importDraft.locales.tr.markdown, "## Türkçe gövde");
  assert.equal(snapshot.articles.records[0].importDraft.locales.en.markdown, "## English body");
  assert.equal(snapshot.articles.records[1].importDraft, null);
});
