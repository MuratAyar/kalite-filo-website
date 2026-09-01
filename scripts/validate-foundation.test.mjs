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
  validateAboutOutput,
  validateArticleDetailOutput,
  validateEditorialPreviewLinks,
  validateFaqOutput,
  validateFleetGuideOutput,
  validateHomeFeaturedVehiclePrices,
  validateHomeInteractionLayouts,
  validateHomeMainLinks,
  validateHomeVehicleFinder,
  validateQuoteFormOutput,
  validateQuotePhpSource,
  validateRoutes,
  validateVehicleCatalogueOutput,
  validateVehicleDetailOutput,
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

test("quote delivery source uses the approved authenticated SMTP boundary", () => {
  assert.doesNotThrow(() => validateQuotePhpSource({ requireComposerLock: false }));

  const endpoint = readFileSync(
    path.join(repositoryRoot, "server", "forms", "teklif.php"),
    "utf8",
  );
  const mailer = readFileSync(
    path.join(repositoryRoot, "server", "forms", "quote-mailer.php"),
    "utf8",
  );
  assert.doesNotMatch(`${endpoint}\n${mailer}`, /\bmail\s*\(/i);
  assert.match(mailer, /\$config\['from_address'\]/);
  assert.match(mailer, /\$config\[\$recipientAddressKey\]/);
  assert.match(mailer, /addReplyTo\(\$message\['reply_to_address'\]/);
  assert.doesNotMatch(mailer, /\$_(?:POST|REQUEST).*?(?:Username|setFrom|addAddress)/s);
});

test("accepts canonical directory-style internal paths", () => {
  assert.equal(isValidInternalPath("/"), true);
  assert.equal(isValidInternalPath("/filo-rehberi/"), true);
});

test("validates the claim-safe About output contract", () => {
  const validAbout = `
    <main data-content-status="draft">
      <section data-about-section="hero">
        <img src="/images/home/commercial-fleet.jpg">
        <img src="/images/home/hero-fleet-highway.jpg">
        <button data-about-hero-control="milestones">Kilometre Taşlarımız</button><a href="#vizyon-misyon-degerler">Vizyonumuz</a>
        <p>300+ Araç Filosu</p><p>%98 Müşteri Memnuniyeti</p>
      </section>
      <section data-about-section="vision-mission-values" id="vizyon-misyon-degerler">
        <img src="/images/about/volvo-xc90-vision-mission.png">
        <h3>Vizyonumuz</h3><h3>Misyonumuz</h3><h3>Değerlerimiz</h3>
        <p>Güven Kalite Liderlik Müşteri Odaklılık Operasyonel Mükemmellik Yenilikçilik Sorumluluk Sürdürülebilirlik Sürekli Gelişim</p>
      </section>
      <section data-about-section="operational-excellence"></section>
      <section data-about-section="service-network">
        <img src="/images/home/fleet-campus.jpg">
      </section>
      <section data-about-section="why-kalite-filo"></section>
      <section><h2 id="conversion-banner-title">Teklif Al</h2>
        <img src="/images/home/quote-operations.jpg">
      </section>
      <section><h2 id="editorial-preview-title">Filo Dünyası</h2></section>
    </main>`;

  assert.deepEqual(validateAboutOutput(validAbout), { sectionCount: 7 });
  assert.throws(() =>
    validateAboutOutput(validAbout.replace("1200", "1200+").concat("1200+")),
  );
  assert.throws(() =>
    validateAboutOutput(
      validAbout.replace('data-about-section="service-network"', ""),
    ),
  );
});

test("validates the static native FAQ output contract", () => {
  const items = Array.from(
    { length: 6 },
    (_, index) =>
      `<details data-faq-item="true"${index === 0 ? " open" : ""}><summary>Soru ${index + 1}</summary><p>Yanıt</p></details>`,
  ).join("");
  const validFaq = `<main>
    <div data-faq-category-filter="true">
      ${Array.from({ length: 5 }, () => '<button data-faq-category-control="true"></button>').join("")}
    </div>
    ${items}
    <aside data-faq-contact="true"><a href="/iletisim/">İletişime Geçin</a></aside>
    <section><h2 id="editorial-preview-title">Filo Dünyası</h2></section>
  </main>`;

  assert.deepEqual(validateFaqOutput(validFaq), { itemCount: 6 });
  assert.throws(() => validateFaqOutput(validFaq.replace("<details", "<div")));
  assert.throws(() =>
    validateFaqOutput(
      validFaq.replace(
        '<button data-faq-category-control="true"></button>',
        '<a data-faq-category-control="true" href="#faq-list"></a>',
      ),
    ),
  );
  assert.throws(() =>
    validateFaqOutput(validFaq.replace("/iletisim/", "/teklif-al/")),
  );
  assert.throws(() =>
    validateFaqOutput(
      validFaq.replace("</main>", "Bu cevap faydalı oldu mu?</main>"),
    ),
  );
});

test("validates the Filo Rehberi index output contract", () => {
  const categoryPaths = [
    "/filo-rehberi/",
    "/filo-rehberi/uzun-donem-kiralama/",
    "/filo-rehberi/maliyet-ve-finans/",
    "/filo-rehberi/arac-rehberi/",
    "/filo-rehberi/filo-yonetimi/",
    "/filo-rehberi/elektrikli-araclar/",
    "/filo-rehberi/bakim-ve-hasar/",
  ];
  const controls = categoryPaths
    .map(
      (href) =>
        `<a data-fleet-guide-category-control="true" href="${href}"></a>`,
    )
    .join("");
  const articles = Array.from({ length: 7 }, (_, index) => `
    <article data-fleet-guide-article="true"${index === 0 ? ' data-fleet-guide-featured="true"' : ""}>
      <a data-fleet-guide-article-link="true" href="/filo-rehberi/uzun-donem-kiralama/makale-${index + 1}/">
        ${index < 6
          ? `<img src="/images/filo-rehberi/0${index + 1}-article.webp" alt="Kapak">`
          : '<div data-fleet-guide-cover-placeholder="true" role="img"></div>'}
      </a>
    </article>
  `).join("");
  const validFleetGuide = `<main>
    <h1>Filo Rehberi</h1>
    <div data-fleet-guide-listing="true" data-fleet-guide-page-count="3" data-fleet-guide-page-size="6" data-fleet-guide-record-count="18">
      <div data-fleet-guide-category-filter="true">${controls}</div>
      ${articles}
      <nav data-fleet-guide-pagination="true">
        <button data-fleet-guide-page-control="previous"></button>
        <button data-fleet-guide-page-control="1"></button>
        <button data-fleet-guide-page-control="2"></button>
        <button data-fleet-guide-page-control="3"></button>
        <button data-fleet-guide-page-control="next"></button>
      </nav>
    </div>
  </main>`;

  assert.deepEqual(validateFleetGuideOutput(validFleetGuide), {
    articleCount: 7,
    categoryControlCount: 7,
    pageCount: 3,
    recordCount: 18,
  });
  assert.throws(() =>
    validateFleetGuideOutput(
      validFleetGuide.replace('data-fleet-guide-featured="true"', ""),
    ),
  );
  assert.throws(() =>
    validateFleetGuideOutput(validFleetGuide.replace("Filo Rehberi", "Blog")),
  );
  assert.throws(() =>
    validateFleetGuideOutput(
      validFleetGuide.replace(
        "/filo-rehberi/uzun-donem-kiralama/makale-1/",
        "/filo-rehberi/makale-1/",
      ),
    ),
  );
  assert.throws(() =>
    validateFleetGuideOutput(
      validFleetGuide.replace('data-fleet-guide-page-size="6"', 'data-fleet-guide-page-size="9"'),
    ),
  );
  assert.throws(() =>
    validateFleetGuideOutput(
      validFleetGuide.replace('data-fleet-guide-page-control="next"', 'data-page-control="next"'),
    ),
  );
});

test("accepts every approved dynamic route family", () => {
  assert.doesNotThrow(() =>
    validateRoutes([
      {
        ...validRoute,
        id: "vehicle-detail",
        kind: "family",
        path: "/arac-listesi/[slug]/",
      },
      {
        ...validRoute,
        id: "fleet-guide-category",
        kind: "family",
        path: "/filo-rehberi/[category]/",
      },
      {
        ...validRoute,
        id: "fleet-guide-article",
        kind: "family",
        path: "/filo-rehberi/[category]/[slug]/",
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
    path.join(repositoryRoot, "src", "app", "(tr)", "hakkimizda", "page.tsx"),
  );
  assert.equal(
    routeToOutputFile("/hakkimizda/"),
    path.join(repositoryRoot, "out", "hakkimizda", "index.html"),
  );
  assert.equal(
    routeToSourcePageFile("/"),
    path.join(repositoryRoot, "src", "app", "(tr)", "page.tsx"),
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
    getCurrentPublicNavigationRouteId("/arac-listesi/example-slug/"),
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

test("requires the quote page to use the approved local PHP form boundary", () => {
  const fields = [
    "form_turu",
    "website",
    "ad",
    "soyad",
    "ulke_kodu",
    "telefon",
    "eposta",
    "unvan",
    "il",
    "ilce",
    "firma_web_sitesi",
    "sirket_tipi",
    "sirket_unvani",
    "vergi_dairesi_ili",
    "vergi_dairesi",
    "vergi_numarasi",
    "kiralama_suresi",
    "arac_sayisi",
    "arac_markasi",
    "arac_modeli",
    "yillik_km",
    "not",
  ]
    .map((name) => `<input name="${name}">`)
    .join("");
  const valid = `<main>
    <form action="/forms/teklif.php" method="post">
      <button aria-pressed="true" type="button">Kurumsal</button>
      <button aria-pressed="false" type="button">Bireysel</button>
      <button aria-pressed="false" type="button">Sepetim</button>
      ${fields}
    </form>
    <a href="tel:+905317158068">05317158068</a>
    <a href="mailto:info@kalitefilo.com.tr">info</a>
    <a href="/filo-rehberi/filo-yonetimi/ornek-makale/"><img src="/images/filo-rehberi/ornek.webp"></a>
  </main>`;

  assert.deepEqual(validateQuoteFormOutput(valid), { formCount: 1 });
  assert.throws(
    () => validateQuoteFormOutput(valid.replace("/forms/teklif.php", "https://example.com/send")),
    /approved local PHP endpoint/,
  );
  assert.throws(
    () => validateQuoteFormOutput(valid.replace('name="eposta"', 'name="email"')),
    /eposta field/,
  );
  assert.throws(
    () => validateQuoteFormOutput(valid.replace("</main>", "<p>noreply@kalitefilo.com.tr</p></main>")),
    /must not leak/,
  );
});

test("quote validation exposes client and server errors on rejected fields", () => {
  const clientSource = readFileSync(
    path.join(repositoryRoot, "src", "components", "forms", "quote-form.tsx"),
    "utf8",
  );
  const serverSource = readFileSync(
    path.join(repositoryRoot, "server", "forms", "teklif.php"),
    "utf8",
  );

  assert.match(clientSource, /input:not\(\[type='hidden'\]\), select, textarea/);
  assert.match(clientSource, /payload\.fieldErrors/);
  assert.match(clientSource, /focusField\(form, firstInvalidField\)/);
  assert.match(serverSource, /'fieldErrors' => \$fieldErrors/);
  assert.doesNotMatch(serverSource, /FILTER_VALIDATE_URL/);
  assert.doesNotMatch(serverSource, /\$fieldErrors\['firma_web_sitesi'\]/);
});

const approvedVehicleListPrices = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-list-prices.json"),
    "utf8",
  ),
).amountsMinor;
const featuredVehicleIds = JSON.parse(readFileSync(path.join(repositoryRoot, "src", "data", "featured-vehicle-ids.json"), "utf8"));
const vehicleSourceIdsById = new Map(JSON.parse(readFileSync(path.join(repositoryRoot, "src", "data", "vehicle-portfolio.json"), "utf8")).map((record) => [record.id, record.sourceId]));

function createVehiclePriceMarkup(amountMinor) {
  const amountTry = amountMinor / 100;
  return `<div data-vehicle-list-price="true">
    <p><data value="${amountTry}">${formatVehicleListNetPrice(amountMinor)}</data><span>/ay</span></p>
    <p>+ %20 KDV</p>
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
    const source = position <= 28
      ? `/images/vehicles/cards/arac-${position}.jpg`
      : "/images/vehicles/cards/vehicle-placeholder.jpg";
    const media = `<div data-vehicle-media="true"><img alt="Araç ${position}" height="440" src="${source}" width="640"></div>`;

      return `<article data-vehicle-card="arac-${position}" data-monthly-list-net-price-try="${amountMinor / 100}" data-vehicle-source-id="${sourceId}"><a class="group" data-vehicle-card-link="true" href="/arac-listesi/arac-${position}/">${media}${createVehicleFactsMarkup()}${createVehiclePriceMarkup(amountMinor)}<span class="group-hover:bg-orange-dark" data-vehicle-card-cta="true">Aracı İncele</span></a></article>`;
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
  const featuredSourceIds = featuredVehicleIds.map((id) => vehicleSourceIdsById.get(id));
  const cards = featuredSourceIds
    .map((sourceId) => {
      const amountMinor = approvedVehicleListPrices[sourceId];
      const slug = sourceId.toLowerCase();
      return `<li data-vehicle-card="${slug}" data-monthly-list-net-price-try="${amountMinor / 100}" data-vehicle-source-id="${sourceId}"><a class="group" data-vehicle-card-link="true" href="/arac-listesi/${slug}/"><div data-vehicle-media="true"><img alt="Araç" height="440" src="/images/vehicles/cards/${sourceId}.jpg" width="640"></div>${createVehicleFactsMarkup()}${createVehiclePriceMarkup(amountMinor)}<span class="group-hover:bg-orange-dark" data-vehicle-card-cta="true">Aracı İncele</span></a></li>`;
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
        html.replace(`data-monthly-list-net-price-try="${approvedVehicleListPrices[featuredSourceIds[0]] / 100}"`, 'data-monthly-list-net-price-try="1"'),
      ),
    /incorrect approved list price/,
  );
});

test("locks the exported vehicle catalogue to prices and 32/4 card media coverage", () => {
  assert.deepEqual(validateVehicleCatalogueOutput(createVehicleCatalogueFixture()), {
    cardCount: 32,
    imageCount: 32,
    listPriceCount: 32,
    missingImageCount: 4,
  });
});

test("rejects incomplete, duplicated, mispriced, or incorrectly linked vehicle output", () => {
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
        valid.replace("<p>+ %20 KDV</p>", "<p>KDV dahil</p>"),
      ),
    /visible net-monthly context/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace(
          'href="/arac-listesi/arac-1/"',
          'href="/arac-listesi/yanlis-arac/"',
        ),
      ),
    /full-card detail links/,
  );
  assert.throws(
    () =>
      validateVehicleCatalogueOutput(
        valid.replace('data-vehicle-card-link="true"', 'data-card-link="false"'),
      ),
    /full-card detail links/,
  );
});

test("validates controlled vehicle-detail actions and a same-category vehicle track", () => {
  const vehicle = {
    slug: "ana-arac",
    categoryLabel: "Binek",
    featureLabels: ["352 L bagaj", "Kompakt ölçüler"],
    summary: "Tekrarlanan araç özeti",
    listPrice: { amountMinor: 4_020_000 },
  };
  const related = [1, 2, 3, 4].map((position) => ({
    slug: `ilgili-${position}`,
    categoryLabel: "Binek",
  }));
  const relatedMarkup = related
    .map(
      (record) =>
        `<article data-related-vehicle="${record.slug}"><a href="/arac-listesi/${record.slug}/">Araç</a></article>`,
    )
    .join("");
  const specifications = Array.from(
    { length: 5 },
    (_, index) => `<div data-vehicle-technical-specification="true">Özellik ${index + 1}</div>`,
  ).join("");
  const durationOptions = [12, 18, 24, 30, 36]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  const kilometreOptions = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  const html = `<main><section data-vehicle-detail="ana-arac"><div data-vehicle-technical-section="true">${specifications}<div>Bagaj hacmi</div><div>352 L</div></div><aside data-vehicle-offer-panel="true"><p>₺40.200</p><p>+ %20 KDV</p><select name="kiralama-suresi">${durationOptions}</select><select name="yillik-kilometre">${kilometreOptions}</select><button data-vehicle-detail-action="quote">Hemen Teklif İste</button><button data-vehicle-detail-action="basket">Araç Sepetine Ekle</button></aside><button data-related-vehicles-control="previous">Önceki</button><button data-related-vehicles-control="next">Sonraki</button><ul data-related-vehicles-track="true">${relatedMarkup}</ul><section><h2 id="editorial-preview-title">Filo Dünyası'nı Keşfedin</h2></section></section></main>`;

  assert.deepEqual(
    validateVehicleDetailOutput(html, vehicle, [vehicle, ...related]),
    {
      actionCount: 2,
      relatedControlCount: 2,
      relatedVehicleCount: 4,
      technicalSpecificationCount: 5,
    },
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace('data-related-vehicle="ilgili-4"', ""),
      vehicle,
      [vehicle, ...related],
    ),
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace(
        '<button data-vehicle-detail-action="quote">',
        '<a data-vehicle-detail-action="quote">',
      ),
      vehicle,
      [vehicle, ...related],
    ),
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace('data-related-vehicles-control="next"', ""),
      vehicle,
      [vehicle, ...related],
    ),
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace(
        '<div data-vehicle-technical-section="true">',
        '<div data-vehicle-technical-section="true"><h2>Araç Hakkında</h2>',
      ),
      vehicle,
      [vehicle, ...related],
    ),
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace("Bagaj hacmi", vehicle.summary),
      vehicle,
      [vehicle, ...related],
    ),
  );
  assert.throws(() =>
    validateVehicleDetailOutput(
      html.replace('id="editorial-preview-title"', 'id="removed-editorial"'),
      vehicle,
      [vehicle, ...related],
    ),
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

test("validates category-aware shared editorial preview links", () => {
  const valid = `
    <section>
      <a data-editorial-preview-article-link="true" href="/filo-rehberi/filo-yonetimi/birinci-yazi/"></a>
      <a data-editorial-preview-article-link="true" href="/filo-rehberi/bakim-ve-hasar/ikinci-yazi/"></a>
    </section>`;

  assert.deepEqual(validateEditorialPreviewLinks(valid, 2), {
    articleLinkCount: 2,
  });
  assert.throws(() =>
    validateEditorialPreviewLinks(
      valid.replace(
        "/filo-rehberi/bakim-ve-hasar/ikinci-yazi/",
        "/filo-rehberi/ikinci-yazi/",
      ),
      2,
    ),
  );
  assert.throws(() =>
    validateEditorialPreviewLinks(
      valid.replace(
        "/filo-rehberi/bakim-ve-hasar/ikinci-yazi/",
        "/filo-rehberi/filo-yonetimi/birinci-yazi/",
      ),
      2,
    ),
  );
});

test("validates article contents targets and rejects source-only scaffolding", () => {
  const valid = `
    <main>
      <ul data-article-header-meta="true"><li>Kategori</li></ul>
      <aside class="sticky top-28" data-article-sidebar="true">
        <section data-article-table-of-contents="true">
          <a data-article-toc-link="true" href="#ilk-bolum">İlk bölüm</a>
          <a data-article-toc-link="true" href="#ikinci-bolum">İkinci bölüm</a>
        </section>
        <section data-article-share-panel="true">
          <div data-article-share-actions="true">
            <dialog data-article-share-dialog="true">
              <button data-share-copy="true">Bağlantıyı kopyala</button>
              <a data-share-x="true" href="https://x.com/intent/tweet?url=ornek">X'te paylaş</a>
              <a data-share-whatsapp="true" href="https://wa.me/?text=ornek">WhatsApp'ta paylaş</a>
            </dialog>
          </div>
        </section>
        <a data-article-related="true" href="/filo-rehberi/bakim-ve-hasar/ikinci-yazi/">İlgili yazı</a>
      </aside>
      <article data-article-content="true">
        <a data-article-cta-link="true" href="/teklif-al/">teklif alın</a>
        <aside data-article-key-takeaway="true">Önemli çıkarım</aside>
        <h2 data-article-section="true" id="ilk-bolum">İlk bölüm</h2>
        <h2 data-article-section="true" id="ikinci-bolum">İkinci bölüm</h2>
      </article>
    </main>`;

  assert.deepEqual(validateArticleDetailOutput(valid), {
    articleCtaLinkCount: 1,
    headerMetaCount: 1,
    keyTakeawayCount: 1,
    relatedArticleCount: 1,
    shareActionsCount: 1,
    shareDialogCount: 1,
    sidebarCount: 1,
    tocItemCount: 2,
  });
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace('href="#ikinci-bolum"', 'href="#yanlis-bolum"'),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace("teklif alın</a>", "Buton: Teklif Al</a>"),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace(' data-article-share-dialog="true"', ""),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace("</article>", "<h2>İç Link Önerileri</h2></article>"),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace("</article>", "<p>Araç Listesi → /araclar/</p></article>"),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace(' data-article-share-actions="true"', ""),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(valid.replace("sticky top-28", "max-h-screen overflow-y-auto")),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace(' data-article-key-takeaway="true"', ""),
    ),
  );
  assert.throws(() =>
    validateArticleDetailOutput(
      valid.replace(
        "/filo-rehberi/bakim-ve-hasar/ikinci-yazi/",
        "/filo-rehberi/ikinci-yazi/",
      ),
    ),
  );
});
