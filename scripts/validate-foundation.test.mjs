import assert from "node:assert/strict";
import test from "node:test";

import {
  getRouteRobotsPolicy,
  isValidInternalPath,
  validateRoutes,
} from "./validate-foundation.mjs";

const validRoute = {
  id: "fleet-guide",
  kind: "static",
  path: "/filo-rehberi/",
  label: "Filo Rehberi",
  status: "canonical-path",
  indexable: false,
  sitemap: false,
};

test("accepts canonical directory-style internal paths", () => {
  assert.equal(isValidInternalPath("/"), true);
  assert.equal(isValidInternalPath("/filo-rehberi/"), true);
});

test("accepts both approved dynamic route families", () => {
  assert.doesNotThrow(() =>
    validateRoutes([
      {
        ...validRoute,
        id: "vehicle-detail",
        kind: "family",
        path: "/araclar/[slug]/",
      },
      {
        ...validRoute,
        id: "fleet-guide-article",
        kind: "family",
        path: "/filo-rehberi/[slug]/",
      },
    ]),
  );
});

test("rejects an arbitrary unapproved dynamic route family", () => {
  assert.throws(
    () =>
      validateRoutes([
        {
          ...validRoute,
          id: "product-detail",
          kind: "family",
          path: "/urunler/[slug]/",
        },
      ]),
    /unapproved path pattern/,
  );
});

test("rejects fragments, queries, uppercase, and missing trailing slashes", () => {
  assert.equal(isValidInternalPath("#"), false);
  assert.equal(isValidInternalPath("/filo-rehberi/?page=2"), false);
  assert.equal(isValidInternalPath("/Filo-Rehberi/"), false);
  assert.equal(isValidInternalPath("/filo-rehberi"), false);
});

test("rejects duplicate route ids and paths", () => {
  assert.throws(
    () => validateRoutes([validRoute, { ...validRoute }]),
    /Duplicate route id/,
  );
  assert.throws(
    () =>
      validateRoutes([
        validRoute,
        { ...validRoute, id: "another-route" },
      ]),
    /Duplicate route path/,
  );
});

test("prevents unpublished routes from becoming indexable", () => {
  assert.throws(
    () => validateRoutes([{ ...validRoute, indexable: true }]),
    /cannot be indexable/,
  );
});

test("prevents unpublished routes from entering the sitemap", () => {
  assert.throws(
    () => validateRoutes([{ ...validRoute, sitemap: true }]),
    /cannot be indexable or in the sitemap/,
  );
});

test("prevents noindex published routes from entering the sitemap", () => {
  assert.throws(
    () =>
      validateRoutes([
        {
          ...validRoute,
          status: "published",
          sitemap: true,
        },
      ]),
    /cannot enter the sitemap while noindex/,
  );
});

test("keeps foundation Home noindex for a production artifact", () => {
  assert.deepEqual(
    getRouteRobotsPolicy(
      {
        ...validRoute,
        id: "home",
        path: "/",
        status: "foundation",
      },
      "production",
    ),
    { index: false, follow: false, nocache: false },
  );
});

test("keeps staging noindex regardless of route publication", () => {
  assert.deepEqual(
    getRouteRobotsPolicy(
      {
        ...validRoute,
        status: "published",
        indexable: true,
        sitemap: true,
      },
      "staging",
    ),
    { index: false, follow: false, nocache: true },
  );
});

test("allows indexing only for an explicitly published production route", () => {
  assert.deepEqual(
    getRouteRobotsPolicy(
      {
        ...validRoute,
        status: "published",
        indexable: true,
      },
      "production",
    ),
    { index: true, follow: true, nocache: false },
  );
});

test("rejects excluded customer and runtime-system routes", () => {
  assert.throws(
    () =>
      validateRoutes([
        { ...validRoute, id: "login", path: "/musteri-girisi/" },
      ]),
    /prohibited Phase 1 path/,
  );
  assert.throws(
    () =>
      validateRoutes([
        { ...validRoute, id: "runtime-api", path: "/api/" },
      ]),
    /prohibited Phase 1 path/,
  );
});
