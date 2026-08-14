import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  getRouteRobotsPolicy,
  isValidInternalPath,
  routeToOutputFile,
  routeToSourcePageFile,
  validateHomeFeaturedVehiclePrices,
  validateHomeInteractionLayouts,
  validateHomeMainLinks,
  validateHomeVehicleFinder,
  validateRoutes,
  validateVehicleCatalogueOutput,
} from "./validate-foundation.mjs";
import {
  getCurrentPublicNavigationRouteId,
  normalizeNavigationPath,
} from "../src/lib/navigation-route-matching.mjs";
import {
  filterVehicleRecords,
  normalizeVehicleQueryValue,
  readVehicleQueryFilters,
} from "../src/lib/vehicle-query.mjs";
import {
  buildVehicleFinderOptions,
  getModelsForSelectedMake,
} from "../src/lib/vehicle-finder-options.mjs";
import { formatVehicleListNetPrice } from "../src/lib/vehicle-list-price.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

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

test("maps directory-style routes to their source and export files", () => {
  assert.equal(
    routeToSourcePageFile("/hakkimizda/"),
    path.join(repositoryRoot, "src", "app", "hakkimizda", "page.tsx"),
  );
  assert.equal(
    routeToOutputFile("/hakkimizda/"),
    path.join(repositoryRoot, "out", "hakkimizda", "index.html"),
  );
  assert.equal(
    routeToSourcePageFile("/"),
    path.join(repositoryRoot, "src", "app", "page.tsx"),
  );
});

test("every approved static route has a source skeleton", () => {
  const routes = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, "src", "config", "approved-routes.json"),
      "utf8",
    ),
  );

  for (const route of routes.filter((candidate) => candidate.kind === "static")) {
    assert.equal(
      existsSync(routeToSourcePageFile(route.path)),
      true,
      `Missing page skeleton for ${route.path}`,
    );
  }
});

test("matches every approved static destination to its navigation owner", () => {
  const cases = new Map([
    ["/hakkimizda/", "about"],
    ["/arac-listesi/", "vehicles"],
    ["/filo-rehberi/", "fleet-guide"],
    ["/sikca-sorulan-sorular/", "faq"],
    ["/iletisim/", "contact"],
    ["/kvkk-ve-guvenlik/", "privacy-security"],
    ["/cerez-politikasi/", "cookie-policy"],
    ["/kullanim-kosullari/", "terms-of-use"],
    ["/teklif-al/", "quote"],
  ]);

  for (const [pathname, expectedRouteId] of cases) {
    assert.equal(getCurrentPublicNavigationRouteId(pathname), expectedRouteId);
  }
});

test("assigns approved future detail paths to their parent navigation item", () => {
  assert.equal(
    getCurrentPublicNavigationRouteId("/araclar/example-slug/"),
    "vehicles",
  );
  assert.equal(
    getCurrentPublicNavigationRouteId("/filo-rehberi/example-article/"),
    "fleet-guide",
  );
});

test("does not fabricate a primary item for Home or unknown paths", () => {
  assert.equal(getCurrentPublicNavigationRouteId("/"), undefined);
  assert.equal(getCurrentPublicNavigationRouteId("/araclar/"), undefined);
  assert.equal(getCurrentPublicNavigationRouteId("/bilinmeyen/"), undefined);
});

test("normalizes trailing slashes without treating queries or fragments as routes", () => {
  assert.equal(
    normalizeNavigationPath("/arac-listesi///?sort=asc#liste"),
    "/arac-listesi",
  );
  assert.equal(
    getCurrentPublicNavigationRouteId("/arac-listesi/?sort=asc#liste"),
    "vehicles",
  );
  assert.equal(
    getCurrentPublicNavigationRouteId("/filo-rehberi#icerik"),
    "fleet-guide",
  );
});

const approvedHomeLinkPaths = new Set([
  "/",
  "/hakkimizda/",
  "/arac-listesi/",
  "/filo-rehberi/",
  "/sikca-sorulan-sorular/",
  "/iletisim/",
  "/teklif-al/",
]);

test("requires Home calls to action inside main rather than the shared shell", () => {
  const shellOnlyLinks = `
    <header>
      <a href="/arac-listesi/">Araç Listesi</a>
      <a href="/filo-rehberi/">Filo Rehberi</a>
      <a href="/teklif-al/">Teklif Al</a>
    </header>
    <main><h1>Kalite Filo</h1></main>
  `;

  assert.throws(
    () =>
      validateHomeMainLinks(
        shellOnlyLinks,
        "https://kalitefilo.com.tr",
        approvedHomeLinkPaths,
      ),
    /Home main content is missing its required/,
  );

  const homeLinks = `
    <main>
      <a href="/teklif-al/">Teklif Al</a>
      <a href="/arac-listesi/">Araçları İncele</a>
      <a href="/filo-rehberi/">Tümünü Görüntüle</a>
    </main>
  `;

  assert.deepEqual(
    validateHomeMainLinks(
      homeLinks,
      "https://kalitefilo.com.tr",
      approvedHomeLinkPaths,
    ),
    ["/teklif-al/", "/arac-listesi/", "/filo-rehberi/"],
  );
});

test("rejects external and protocol links inside Home main", () => {
  for (const prohibitedHref of [
    "https://example.com/",
    "mailto:test@example.com",
    "//example.com/path/",
  ]) {
    const html = `
      <main>
        <a href="/teklif-al/">Teklif Al</a>
        <a href="/arac-listesi/">Araçları İncele</a>
        <a href="/filo-rehberi/">Tümünü Görüntüle</a>
        <a href="${prohibitedHref}">Desteklenmeyen bağlantı</a>
      </main>
    `;

    assert.throws(
      () =>
        validateHomeMainLinks(
          html,
          "https://kalitefilo.com.tr",
          approvedHomeLinkPaths,
        ),
      /external or protocol link/,
    );
  }
});

test("allows only explicitly marked Wikimedia and Creative Commons asset credits", () => {
  const html = `
    <main>
      <a href="/teklif-al/">Teklif Al</a>
      <a href="/arac-listesi/">Araçları İncele</a>
      <a href="/filo-rehberi/">Tümünü Görüntüle</a>
      <a data-asset-credit="true" href="https://commons.wikimedia.org/wiki/File:Example.jpg">Kaynak</a>
      <a data-asset-credit="true" rel="license" href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>
    </main>
  `;

  assert.doesNotThrow(() =>
    validateHomeMainLinks(
      html,
      "https://kalitefilo.com.tr",
      approvedHomeLinkPaths,
    ),
  );

  assert.throws(
    () =>
      validateHomeMainLinks(
        html.replace("commons.wikimedia.org", "example.com"),
        "https://kalitefilo.com.tr",
        approvedHomeLinkPaths,
      ),
    /external or protocol link/,
  );
});

test("rejects unapproved internal paths inside Home main", () => {
  const html = `
    <main>
      <a href="/teklif-al/">Teklif Al</a>
      <a href="/arac-listesi/">Araçları İncele</a>
      <a href="/filo-rehberi/">Tümünü Görüntüle</a>
      <a href="/urunler/">Onaylanmamış bağlantı</a>
    </main>
  `;

  assert.throws(
    () =>
      validateHomeMainLinks(
        html,
        "https://kalitefilo.com.tr",
        approvedHomeLinkPaths,
      ),
    /unapproved static path/,
  );
});

test("normalizes free-text vehicle query values safely", () => {
  assert.equal(normalizeVehicleQueryValue("  BMW   3 Serisi  "), "BMW 3 Serisi");
  assert.equal(normalizeVehicleQueryValue("\u0000 Volvo\nXC90 "), "Volvo XC90");
  assert.equal(normalizeVehicleQueryValue("   "), undefined);
  assert.equal(normalizeVehicleQueryValue(undefined), undefined);
  assert.equal(normalizeVehicleQueryValue("x".repeat(100)).length, 80);
});

test("reads only marka and model vehicle query keys", () => {
  assert.deepEqual(
    readVehicleQueryFilters(
      new URLSearchParams("marka=BMW&model=3+Serisi&ignored=value"),
    ),
    { make: "BMW", model: "3 Serisi" },
  );
  assert.deepEqual(readVehicleQueryFilters(new URLSearchParams()), {
    make: undefined,
    model: undefined,
  });
});

test("filters future vehicle records without seeding inventory", () => {
  const records = [
    { id: "one", make: "BMW", model: "3 Serisi" },
    { id: "two", make: "Volvo", model: "XC90" },
    { id: "three", make: "BMW", model: "5 Serisi" },
  ];

  assert.deepEqual(
    filterVehicleRecords(records, { make: "bmw", model: "3" }).map(
      ({ id }) => id,
    ),
    ["one"],
  );
  assert.deepEqual(
    filterVehicleRecords(records, { make: "VOLVO" }).map(({ id }) => id),
    ["two"],
  );
  assert.deepEqual(
    filterVehicleRecords(records, {}).map(({ id }) => id),
    ["one", "two", "three"],
  );
});

test("builds finder options only from approved vehicle records", () => {
  const options = buildVehicleFinderOptions([
    {
      publicationStatus: "draft",
      make: "Taslak Marka",
      model: "Taslak Model",
    },
    { publicationStatus: "approved", make: "Volvo", model: "XC90" },
    { publicationStatus: "approved", make: "BMW", model: "5 Serisi" },
    { publicationStatus: "approved", make: "BMW", model: "3 Serisi" },
    { publicationStatus: "approved", make: "BMW", model: "3 Serisi" },
  ]);

  assert.deepEqual(options, [
    { make: "BMW", models: ["3 Serisi", "5 Serisi"] },
    { make: "Volvo", models: ["XC90"] },
  ]);
  assert.deepEqual(getModelsForSelectedMake(options, ""), []);
  assert.deepEqual(getModelsForSelectedMake(options, "BMW"), [
    "3 Serisi",
    "5 Serisi",
  ]);
  assert.deepEqual(getModelsForSelectedMake(options, "Bilinmeyen"), []);
});

test("builds finder options from owner-supplied portfolio identities", () => {
  const options = buildVehicleFinderOptions([
    {
      contentStatus: "owner-supplied",
      make: "Renault",
      model: "Clio",
    },
    {
      contentStatus: "owner-supplied",
      make: "Toyota",
      model: "Corolla Sedan",
    },
  ]);

  assert.deepEqual(options, [
    { make: "Renault", models: ["Clio"] },
    { make: "Toyota", models: ["Corolla Sedan"] },
  ]);
});

test("requires the Home vehicle finder to use the local static GET route", () => {
  const validFinder = `
    <main>
      <form class="finder" action="/arac-listesi/" method="get">
        <select name="marka"><option value="">Tüm Markalar</option></select>
        <select name="model" disabled><option value="">Önce marka seçiniz</option></select>
        <button type="submit">Araçları Listele</button>
      </form>
    </main>
  `;

  assert.deepEqual(validateHomeVehicleFinder(validFinder), {
    action: "/arac-listesi/",
    method: "get",
  });

  for (const invalidFinder of [
    validFinder.replace('/arac-listesi/', 'https://example.com/arac-listesi/'),
    validFinder.replace('method="get"', 'method="post"'),
    validFinder.replace('name="model"', 'name="donanim"'),
    validFinder.replace('name="marka"', 'name="marka" required'),
  ]) {
    assert.throws(() => validateHomeVehicleFinder(invalidFinder));
  }
});

const approvedVehicleListPrices = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-list-prices.json"),
    "utf8",
  ),
).amountsMinor;

function createVehiclePriceMarkup(amountMinor) {
  const amountTry = amountMinor / 100;
  return `<div data-vehicle-list-price="true">
    <p>Aylık Liste Net</p>
    <p><data value="${amountTry}">${formatVehicleListNetPrice(amountMinor)}</data><span>/ay</span></p>
    <p>KDV hariç</p>
  </div>`;
}

function createVehicleFactsMarkup() {
  return `<dl data-vehicle-facts="true" data-vehicle-facts-layout="single-row">
    <div data-vehicle-fact="fuel"><dt>Yakıt</dt><dd>Benzin</dd></div>
    <div data-vehicle-fact="transmission" data-vehicle-transmission-display="Otomatik"><dt>Vites</dt><dd>Otomatik</dd></div>
  </dl>`;
}

test("requires unframed why content and fully clickable fleet-solution cards", () => {
  const cards = [
    ["/arac-listesi/", "Uzun Dönem Kiralama"],
    ["/teklif-al/", "Operasyonel Yönetim"],
    ["/arac-listesi/", "Ticari Araç Çözümleri"],
    ["/arac-listesi/", "Yönetici Araçları"],
  ]
    .map(
      ([href, title]) =>
        `<a class="group block no-underline" data-fleet-solution-card="true" href="${href}"><article><h3>${title}</h3></article></a>`,
    )
    .join("");
  const valid = `<main><section aria-labelledby="why-kalite-filo-title"><div data-why-layout="unframed"></div></section>${cards}</main>`;

  assert.deepEqual(validateHomeInteractionLayouts(valid), {
    solutionCardCount: 4,
  });
  assert.throws(
    () => validateHomeInteractionLayouts(valid.replace("unframed", "panel")),
    /approved unframed layout/,
  );
  assert.throws(
    () => validateHomeInteractionLayouts(valid.replace("no-underline", "underline")),
    /underline-free links/,
  );
});

function createVehicleCatalogueFixture() {
  const cards = Object.entries(approvedVehicleListPrices).map(
    ([sourceId, amountMinor], index) => {
    const position = index + 1;
    const media =
      position <= 28
        ? `<div data-vehicle-media="true"><img alt="Araç ${position}" height="540" src="/images/vehicles/arac-${position}.jpg" width="960"></div>`
        : `<div data-vehicle-media="true"><div aria-label="Araç ${position} için doğrulanmış araç görseli mevcut değil" role="img">Doğrulanmış araç görseli mevcut değil</div></div>`;

      return `<article data-vehicle-card="arac-${position}" data-monthly-list-net-price-try="${amountMinor / 100}" data-vehicle-source-id="${sourceId}"><a class="group" data-vehicle-card-link="true" href="/teklif-al/">${media}${createVehicleFactsMarkup()}${createVehiclePriceMarkup(amountMinor)}<span class="group-hover:bg-orange-dark" data-vehicle-card-cta="true">Teklif Al</span></a></article>`;
    },
  ).join("");

  return `<main>
    <nav>
      <a href="/arac-listesi/">Tüm Araçlar</a>
      <a href="/arac-listesi/?kategori=Binek">Binek</a>
      <a href="/arac-listesi/?kategori=SUV">SUV</a>
      <a href="/arac-listesi/?kategori=Ticari">Ticari Araçlar</a>
    </nav>
    <form action="/arac-listesi/" method="get">
      <select name="marka"></select>
      <select name="model"></select><select name="segment"></select>
      <select name="yakit"></select><select name="vites"></select>
    </form>
    <div data-vehicle-catalogue="true">${cards}</div>
  </main>`;
}

test("formats owner-approved list-net prices deterministically", () => {
  assert.equal(formatVehicleListNetPrice(4_020_000), "₺40.200");
  assert.equal(formatVehicleListNetPrice(10_980_000), "₺109.800");
  assert.throws(() => formatVehicleListNetPrice(0), /positive whole TRY/);
  assert.throws(() => formatVehicleListNetPrice(40_200.5), /positive whole TRY/);
});

test("locks Home featured vehicle prices to the approved source", () => {
  const cards = ["KF-001", "KF-002", "KF-003", "KF-004"]
    .map((sourceId) => {
      const amountMinor = approvedVehicleListPrices[sourceId];
      return `<li data-monthly-list-net-price-try="${amountMinor / 100}" data-vehicle-source-id="${sourceId}"><a class="group" data-vehicle-card-link="true" href="/teklif-al/"><div data-vehicle-media="true"><img alt="Araç" height="540" src="/images/vehicles/${sourceId}.jpg" width="960"></div>${createVehicleFactsMarkup()}${createVehiclePriceMarkup(amountMinor)}<span class="group-hover:bg-orange-dark" data-vehicle-card-cta="true">Teklif Al</span></a></li>`;
    })
    .join("");
  const html = `<main><section aria-labelledby="featured-vehicles-title"><a class="featured-vehicles-action h-control-primary" data-featured-vehicles-action="true" href="/arac-listesi/">Araçları Görüntüle</a>${cards}</section></main>`;

  assert.deepEqual(validateHomeFeaturedVehiclePrices(html), {
    cardCount: 4,
    listPriceCount: 4,
  });
  assert.throws(
    () =>
      validateHomeFeaturedVehiclePrices(
        html.replace('data-monthly-list-net-price-try="40200"', 'data-monthly-list-net-price-try="40100"'),
      ),
    /incorrect approved list price/,
  );
});

test("locks the exported vehicle catalogue to prices and 28/4 media coverage", () => {
  assert.deepEqual(validateVehicleCatalogueOutput(createVehicleCatalogueFixture()), {
    cardCount: 32,
    imageCount: 28,
    listPriceCount: 32,
    missingImageCount: 4,
  });
});

test("rejects incomplete, duplicated, mispriced, or detail-linked vehicle output", () => {
  const valid = createVehicleCatalogueFixture();

  assert.throws(
    () => validateVehicleCatalogueOutput(valid.replace(/<article[\s\S]*?<\/article>/, "")),
    /exactly 32 portfolio cards/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace('data-vehicle-card="arac-2"', 'data-vehicle-card="arac-1"'),
      ),
    /duplicate card identifiers/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          'data-monthly-list-net-price-try="40200"',
          'data-monthly-list-net-price-try="40100"',
        ),
      ),
    /incorrect approved list price/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace("<p>KDV hariç</p>", "<p>KDV dahil</p>"),
      ),
    /visible net-monthly context/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          'href="/teklif-al/"',
          'href="/araclar/ornek/"',
        ),
      ),
    /full-card quote links|unimplemented vehicle detail routes/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace('data-vehicle-card-link="true"', 'data-card-link="false"'),
      ),
    /full-card quote links/,
  );
});

test("rejects repeated card credits, category badges, stacked facts, or a body fact", () => {
  const valid = createVehicleCatalogueFixture();

  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          "</article>",
          '<p>Görsel: <a data-asset-credit="true" href="https://commons.wikimedia.org/wiki/File:Vehicle-1.jpg">Kaynak</a></p></article>',
        ),
      ),
    /must not repeat image-credit text inside individual cards/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          '<div data-vehicle-media="true">',
          '<div data-vehicle-media="true"><span class="absolute left-4 top-4">Binek</span>',
        ),
      ),
    /must not render category badges/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          'data-vehicle-facts-layout="single-row"',
          'data-vehicle-facts-layout="stacked"',
        ),
      ),
    /single-row presentation contract/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          '<div data-vehicle-fact="transmission" data-vehicle-transmission-display="Otomatik"><dt>Vites</dt><dd>Otomatik</dd></div>',
          '<div data-vehicle-fact="transmission" data-vehicle-transmission-display="Otomatik"><dt>Vites</dt><dd>Otomatik</dd></div><div data-vehicle-fact="body"><dt>Gövde</dt><dd>Sedan</dd></div>',
        ),
      ),
    /only fuel and transmission facts/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          'data-vehicle-transmission-display="Otomatik"',
          'data-vehicle-transmission-display="7DCT Otomatik"',
        ),
      ),
    /must use only Manuel, Otomatik or Yarı Otomatik/,
  );
});
