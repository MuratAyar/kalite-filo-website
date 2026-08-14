# Home implementation status

Date: 2026-08-13

Price reconciliation: 2026-08-14

Vehicle-card presentation reconciliation: 2026-08-14

## Outcome

The Phase 1 Home page follows the supplied updated Stitch composition with a photographic hero, quick vehicle finder, four verified-portfolio vehicle cards, commercial and fleet media splits, four fleet-solution cards, photographic quote banner, four supplied Filo Rehberi cards, and an interactive no-storage newsletter demonstration before the shared footer.

Home remains deliberately unpublished: route status `foundation`, `indexable: false`, and `sitemap: false`. The production export therefore keeps canonical `https://kalitefilo.com.tr/` and page-level `noindex, nofollow`; the sitemap remains empty.

The owner-supplied vehicle workbook and Filo Rehberi packages are now represented by local typed data and local assets. This does not publish Home or either detail-route family. No dependency, vehicle/article detail route, form processor, PHP handler, Apache rule, customer login, portal, authentication, database, ORM, CRM, CMS, or admin feature was added.

## Design evidence and safety boundary

The visual target was `references/stitch/kalite_filo_ana_sayfa/anasayfa.png` (3840 × 11176, 20,485,787 bytes) with `code.html` used only as secondary structural evidence. The generated HTML, remote Google/Stitch media, Tailwind CDN, fonts, icon fonts, placeholder links, login control, candidate contact details, legal links, and copyright line were not copied into production.

The route remains a review build and `homePageCopy` remains `draft`. The supplied records replace the former visual-preview placeholders. On 14 August 2026, the project owner approved the workbook `Önerilen Liste Net` values for card display; this narrowly verifies the monthly KDV-excluded net list amounts, not availability, duration/kilometre terms, validity, service scope, binding commercial terms, service guarantees, company metrics, a legal identity, article authors, or unprovided legal content.

Current content authority is explicit:

- 32 vehicle rows come from the owner-supplied `Kalite_Filo_32_Arac_Portfoyu_2026.xlsx` workbook and are held locally;
- the four visible Home vehicles are Renault Clio, Hyundai i20, Opel Corsa, and Fiat Egea, with their owner-approved monthly net list prices (`₺40.200`, `₺39.000`, `₺43.200`, and `₺40.200`, respectively), shown per month and KDV excluded;
- the four visible vehicle images are local derivatives with per-image source/licence provenance retained internally in `public/images/vehicles/LICENSES.md` and typed attribution metadata; no licence-ledger link is rendered in the website UI;
- six Filo Rehberi Markdown files and their six matched 1600×900 WebP images come from the owner-supplied packages and are held locally under `src/content/filo-rehberi/` and `public/images/filo-rehberi/`; and
- no author was invented where the supplied article frontmatter did not identify one.

## Implemented behavior

- The hero uses a local 1600 × 900 image, strong left navy overlay, content-driven responsive height, a wider orange “Hemen Teklif Al” link, a wider inverse “Araçları İncele” link, and the glass finder panel.
- The finder is a native `GET /arac-listesi/` form with labelled, dependent `marka` and `model` dropdowns. Its options are derived exclusively from the 32 approved typed vehicle records: 14 makes and 31 unique make/model choices. Model stays disabled until a make is selected. A small Client Component provides only this dependent-select state; no Server Action is used.
- `/arac-listesi/` remains statically exported. A small `Suspense`-isolated Client Component reads `useSearchParams()` and keeps the submitted make/model selected while filtering the catalogue without request-time rendering.
- Featured Vehicles renders Renault Clio, Hyundai i20, Opel Corsa, and Fiat Egea from the supplied portfolio. The cards use four attributed local images, display the corresponding `Aylık Liste Net` price in the `₺…/ay` format with `KDV hariç`, and each complete card is a single `/teklif-al/` link. Hovering or keyboard-focusing any card drives the visible Teklif Al state; no nested link is produced. Category overlays, card-level credit lines, and the public licence-ledger link are omitted; only fuel and transmission remain in a two-column row, with a project-owned cog icon for transmission. Carousel controls remain omitted because no carousel exists.
- Commercial and Why sections use local representative photography with intrinsic dimensions and claim-safe draft copy.
- Fleet Solution card actions retain real approved destinations and explicitly suppress the ordinary inline-link underline while preserving focus indication and an arrow cue.
- The shared `ConversionBanner` uses a local operations image with a right-side reveal and right-to-left navy fade.
- Editorial Preview renders four of the six supplied article records in the reference card rhythm, using their supplied categories, titles, dates, reading times, alt text, and local WebP images. Cards are deliberately noninteractive until detail routes exist; the real `/filo-rehberi/` index action remains available.
- The newsletter strip demonstrates the requested interaction without pretending to subscribe anyone. Native email validation runs locally; submission is prevented, no request or browser storage occurs, the input is cleared, and an accessible native dialog explicitly confirms that the address was neither sent nor saved. The input’s former blue selected-state frame is replaced by a visible orange focus treatment; keyboard focus is not removed. A real provider, endpoint, consent lifecycle, and storage remain unresolved.
- The global footer retains the responsive brand / Hızlı Linkler / Kurumsal / Bize Ulaşın structure. It now shows the owner-verified phone `05317158068` and email `info@kalitefilo.com.tr`, uses the compact footer label `SSS`, and links to three approved noindex skeletons: KVKK ve Güvenlik, Çerez Politikası, and Kullanım Koşulları. No address, legal body text, legal company title, or copyright claim was invented.
- Header navigation is geometrically centered from 1024px upward and follows the requested order: Hakkımızda, Araç Listesi, Sıkça Sorulan Sorular, Filo Rehberi. Mobile uses the same order. Customer login remains absent because it is categorically excluded from Phase 1 by the permanent project guardrails.
- The approved blue/orange image logo remains in the light header. The footer retains the accessible inverse text treatment because the blue part of the supplied logo lacks contrast on navy.

## Local Home assets

All rendered Home images are served locally with intrinsic dimensions. The hero, commercial, facility, and conversion assets remain project review assets whose final publication provenance/approval is still a gate. The former vehicle and editorial preview images are no longer used for the live cards.

| Asset | Dimensions | Bytes |
| --- | ---: | ---: |
| `hero-fleet-highway.jpg` | 1600 × 900 | 153,065 |
| `commercial-fleet.jpg` | 1200 × 800 | 130,341 |
| `fleet-campus.jpg` | 1280 × 720 | 200,184 |
| `quote-operations.jpg` | 1400 × 700 | 55,706 |
| `renault-clio.jpg` | local Commons derivative | 180,604 |
| `hyundai-i20.jpg` | local Commons derivative | 170,508 |
| `fiat-egea-tipo-sedan.jpg` | local Commons derivative | 170,096 |
| `01-operasyonel-arac-kiralama.webp` … `06-bakim-hasar-yonetimi.webp` | 1600 × 900 each | 1,115,942 total |

Vehicle attribution is recorded per image in `public/images/vehicles/LICENSES.md` as an internal provenance ledger and is not linked from the website; the supplied Filo Rehberi image package’s provenance and Pexels-license note are preserved in `src/content/filo-rehberi/IMAGE-LICENSE.md`. No card image uses a remote URL, base64 embedding, or runtime image service.

## Client JavaScript

Authored Client Components: **4**.

1. `src/components/navigation/primary-navigation.tsx` — existing route-aware navigation.
2. `src/components/vehicles/vehicle-query-state.tsx` — query-only result island required because a Server Component `searchParams` prop would introduce request-time rendering and violate static export.
3. `src/components/home/vehicle-finder-fields.tsx` — dependent make/model selection only.
4. `src/components/home/newsletter-signup-demo.tsx` — no-storage email validation and native dialog only.

Every Home section, `RootLayout`, `SiteHeader`, `SiteFooter`, native mobile disclosure, `/arac-listesi/` page, and all card/media compositions remain Server Components. No dependency was added.

## Responsive and browser review

The final production export was loaded in real headless Edge at 320, 390, 768, 1024, 1440, and 1920 CSS pixels. The integrated portfolio, editorial, footer, finder, and newsletter states were checked at every viewport.

- `scrollWidth === clientWidth`;
- exactly one H1 and eight top-level Home sections were present;
- the local hero loaded at its intrinsic 1600 × 900 dimensions;
- the logo loaded locally at 560 × 112 intrinsic dimensions and rendered at 144, 160, or 176 CSS pixels without collision;
- the mobile disclosure opened below 1024px;
- the finder remained a local GET form with exactly `marka` and `model` native selects, exposed 14 makes, and kept Model disabled until a make was selected; selecting Renault enabled Model and exposed Clio;
- the four supplied vehicle headings and four supplied article headings rendered at every viewport;
- every featured card keeps only fuel and transmission aligned from the same row start, omits its former category overlay and inline credit text, and the page-level image-credit disclosure is absent;
- the verified phone/email, compact `SSS` label, and three legal links were present in the footer;
- the newsletter input had no blue input outline; its surrounding focus treatment computed to orange `rgb(255, 179, 67)`;
- the centered desktop navigation appeared in the exact requested order from 1024px upward;
- the newsletter demo opened its native confirmation dialog, cleared the field, and added no network resource; and
- the browser resource list contained no external origin.

The earlier query smoke checkpoint loaded `/araclar/?marka=Ford&model=Transit` against the former query-only skeleton. Current catalogue filtering accepts an exact model beneath its selected make; its final integrated query and responsive smoke results belong in `docs/vehicles-status.md`. The local Home hero request returned HTTP 200 at this checkpoint.

## Historical artifact comparison

The following numbers belong to the immediately preceding Home-interaction checkpoint. They predate the 32-record portfolio, six-article package, nine new content images, footer contact/legal reconciliation, and three additional static legal routes. They are preserved as history and must not be read as current output metrics.

| Metric | Before | Final | Delta |
| --- | ---: | ---: | ---: |
| Files | 95 | 96 | +1 |
| Total raw bytes | 2,375,112 | 2,379,310 | +4,198 |
| JavaScript | 640,273 / 13 files | 646,788 / 14 files | +6,515 / +1 file |
| CSS | 61,685 / 1 file | 63,259 / 1 file | +1,574 / 0 files |
| Images | 977,337 / 13 files | 977,337 / 13 files | 0 / 0 files |
| Authored Client Components | 2 | 4 | +2 |

## Current integrated artifact comparison

This table is the pre-vehicle-catalogue baseline. The 25 additional catalogue images, page output, JavaScript/CSS deltas, and current file count must be measured after the final build and recorded in `docs/vehicles-status.md`.

The before value is the immediately preceding production Home artifact; the final value is the production export after the supplied portfolio, articles, footer contacts/legal routes, and current validation were integrated.

| Metric | Before | Final | Delta |
| --- | ---: | ---: | ---: |
| Files | 96 | 130 | +34 |
| Total raw bytes | 2,379,310 | 4,325,806 | +1,946,496 |
| JavaScript | 646,788 / 14 files | 646,981 / 14 files | +193 / 0 files |
| CSS | 63,259 / 1 file | 64,237 / 1 file | +978 / 0 files |
| Images | 977,337 / 13 files | 2,614,487 / 22 files | +1,637,150 / +9 files |
| Authored Client Components | 4 | 4 | 0 |

The image increase is exactly the three local vehicle derivatives (521,208 bytes) plus six supplied Filo Rehberi WebPs (1,115,942 bytes). No dependency or new Client Component was added in this reconciliation.

## Current integrated validation results

These results are the pre-vehicle-catalogue checkpoint. See `docs/vehicles-status.md` for the final integrated catalogue checks once completed.

| Command | Result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 28 tests, 0 failures |
| `npm run validate` | Passed: 12 route decisions; exactly 4 allowlisted Client Components |
| `npm run build:staging` | Passed: 15 static outputs generated; staging crawl disallowed and all pages noindex |
| staging `npm run verify:output` | Passed; sitemap empty |
| `npm run build` | Passed: 15 static outputs generated |
| production `npm run verify:output` | Passed; Home canonical production origin, page noindex, crawl allowed, sitemap empty |
| `node scripts/smoke-home.mjs` | Passed at 320, 390, 768, 1024, 1440, and 1920px with no external resource request or horizontal overflow |

Final static route report:

```text
○ /
○ /_not-found
○ /araclar
○ /cerez-politikasi
○ /filo-rehberi
○ /hakkimizda
○ /iletisim
○ /kullanim-kosullari
○ /kvkk-ve-guvenlik
○ /manifest.webmanifest
○ /robots.txt
○ /sikca-sorulan-sorular
○ /sitemap.xml
○ /teklif-al
```

## Historical validation results

| Command | Result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 26 tests, 0 failures |
| `npm run validate` | Passed at that checkpoint: 9 route decisions; exactly 4 allowlisted Client Components |
| `npm run build:staging` | Passed; all listed routes/endpoints generated statically |
| staging `npm run verify:output` | Passed; unpublished routes remain noindex, crawl disallowed, sitemap empty |
| `npm run build` | Passed; all listed routes/endpoints generated statically |
| production `npm run verify:output` | Passed; unpublished routes remain noindex, crawl allowed, sitemap empty |
| `node scripts/smoke-home.mjs` | Passed at 320, 390, 768, 1024, 1440, and 1920px, including dropdown/header/dialog assertions |

That checkpoint’s static route report was:

```text
○ /
○ /_not-found
○ /araclar
○ /filo-rehberi
○ /hakkimizda
○ /iletisim
○ /manifest.webmanifest
○ /robots.txt
○ /sikca-sorulan-sorular
○ /sitemap.xml
○ /teklif-al
```

## Remaining publication blockers

- business/content approval for every draft Home string;
- publication review of the 32 supplied vehicle records; approved representative images for the four deliberately image-less records (`KF-015`, `KF-026`, `KF-030`, and `KF-031`); availability, duration/kilometre, validity, service-scope and binding-offer policy; and implemented vehicle detail routes. The approved monthly KDV-excluded net list amounts are no longer a blocker;
- article author/reviewer decisions, final editorial/legal review, and implemented Filo Rehberi detail routes (the six supplied Markdown bodies and images are local but detail pages do not yet exist);
- explicit production approval and provenance record for each newly generated Home image;
- verified company identity, address, remaining contact channels, legal body texts, copyright wording, claims, and service levels; the supplied phone/email and three legal route names alone do not resolve these items;
- approved newsletter provider, legal basis/consent, retention, double opt-in, unsubscribe, and result behavior before controls can be enabled;
- licensed local Plus Jakarta Sans files if that design typeface remains required;
- final visual/content review, screen-reader and representative-browser QA; and
- Apache/cPanel staging deployment verification.

Home must remain unpublished/noindex until these gates are explicitly resolved.

## 2026-08-14 interaction and presentation reconciliation

- The Home finder now supports all three intended static GET paths: no selection opens `/arac-listesi/` without a query, Make-only adds only `marka`, and Make plus Model adds both approved parameters. Model remains dependent on Make.
- Featured vehicle cards retain the workbook's source transmission label in data, but display only the customer-facing groups `Otomatik`, `Yarı Otomatik`, or `Manuel`.
- The “Neden Kalite Filo'yu Tercih Etmelisiniz?” composition is no longer wrapped in a rounded panel. Its image retains its own crop frame. Reference claims about 7/24 support, telematics, included maintenance/repair, and tax advantages were not copied because they are not verified business facts.
- Each fleet-solution card is now one semantic link across its entire surface. The link destination remains registry-backed, visible link copy has no underline, and focus-visible behavior remains distinct.
- Edge smoke checks cover 320, 390, 768, 1024, 1440, and 1920 px with no horizontal overflow, including empty, Make-only, and Make-plus-Model finder submissions and full-card navigation.
- Final integrated checks passed: lint, strict typecheck, 41 dependency-free tests, validation, staging build/output verification, production build/output verification, and both Home/catalogue Edge smoke suites. The production artifact remains 15 static routes, four authored Client Components, page-level noindex, and an empty sitemap.
- The Why section now starts with 64px mobile, 80px tablet, and 96px desktop top padding so the muted background transition does not sit directly against its heading. The newsletter email control suppresses the browser’s blue input outline and uses only the existing orange control-border focus state, without a focus ring or box shadow.
- Customer login remains excluded from the header and route registry under the permanent Phase 1 guardrail; no placeholder login destination or authentication surface was created.
- The featured-vehicles browse CTA now uses the Hero secondary action’s primary-height outlined geometry, with a corporate-blue background and inverse text on hover. The vehicle licence ledger remains in the repository for provenance but is no longer linked or displayed anywhere in the exported UI.
