# Hakkımızda implementation status

Date: 2026-08-15

## Outcome

The canonical `/hakkimizda/` route now implements the Phase 1 About composition with the existing shared public shell and production design system. It remains a review route: registry status `canonical-path`, `indexable: false`, and `sitemap: false`. No route was published and no detail, login, portal, form, PHP, database, authentication, CRM, CMS, or admin capability was added.

The page is built entirely from Server Components and statically exported. It adds no Client Component and no dependency. The repository-wide authored Client Component count remains four, all pre-existing interactive islands outside this page.

## Design evidence and content authority

The local updated Stitch screenshot and HTML under `references/stitch/kalite_filo_hakkimizda/` were used only for composition, hierarchy, and visual intent. Generated Tailwind configuration, remote images, Google fonts, Material Symbols, customer login, placeholder links, and unsupported operational claims were not copied.

The implemented page follows the current production system in root `DESIGN.md`, `src/app/globals.css`, and the shared components. Where it conflicts with the old Stitch export, the production implementation wins.

On 15 August 2026, the project owner explicitly supplied the hero statistics `300+ Araç Filosu` and `%98 Müşteri Memnuniyeti` for this page. Those two values are therefore used in the hero's corporate-blue panel. The older Stitch-only values `15k+`, `1200+`, `%98.5`, and `7/24` are not present.

## Implemented composition

- `PageHeader` supplies the sole H1 and a wrapping Home / Hakkımızda breadcrumb.
- `AboutHero` uses the approved title treatment, owner-directed hero copy, two local image panels, and the two owner-supplied statistics.
- `VisionMissionValues` follows the hero with an image-backed Vizyonumuz/Misyonumuz banner and a nine-item Değerlerimiz grid. It uses production tokens and responsive one/two/three-column layouts.
- The `Kilometre Taşlarımız` and `Vizyonumuz →` controls use native button semantics and intentionally have no navigation or runtime behavior yet.
- `OperationalExcellence` presents four claim-safe operational principles in the shared card language.
- `ServiceNetwork` combines local fleet-campus imagery with three non-quantified service-structure cards; it does not display a fabricated map or coverage total.
- `WhyKaliteFilo` presents six claim-safe reasons using shared surfaces, spacing, radii, and code-native decorative SVG icons.
- The existing shared `ConversionBanner` is reused instead of creating a page-specific duplicate.
- The existing `EditorialPreview` renders three relevant, supplied Filo Rehberi records with local WebP media. Its `Tümünü Görüntüle →` action retains its real index destination and suppresses the ordinary inline-link underline for this standalone treatment.
- The shared `SiteHeader` and `SiteFooter` continue to come from the root layout. The Hakkımızda item receives `aria-current="page"` in desktop and mobile navigation.

## Assets

The page uses repository-owned local review assets with explicit intrinsic dimensions and adds the owner-supplied vision/mission banner image:

- `/images/home/commercial-fleet.jpg` — 1200 × 800;
- `/images/home/hero-fleet-highway.jpg` — 1600 × 900;
- `/images/home/fleet-campus.jpg` — 1280 × 720;
- `/images/home/quote-operations.jpg` — 1400 × 700; and
- `/images/about/volvo-xc90-vision-mission.png` — 1376 × 768, 1,523,797 bytes, SHA-256 `AE195283B5B6067EBC0F3FE0808B50E3E6A0B18A44F4FE6ADD7E2267B1C6B0F7`;
- three supplied 1600 × 900 Filo Rehberi WebP images.

No remote image, remote font, CDN, base64 image, runtime optimizer, or external runtime asset is used.

## Responsive and accessibility decisions

- The page is mobile-first and keeps the 1360px shared container contract.
- The hero, image mosaic, service network, and card grids stack instead of shrinking a desktop canvas.
- Card columns grow only when usable width permits: one column by default, two on intermediate widths, and three or four only at wider production breakpoints.
- Turkish labels and action controls can wrap without creating page-level horizontal overflow.
- The page retains one H1, semantic section headings, one main landmark, the shared skip link, real breadcrumb links, visible focus styles, native buttons, decorative icon semantics, intrinsic image dimensions, and descriptive or empty alt treatment as appropriate.
- Reduced-motion behavior is inherited from the production token layer; this page adds no animation.

Headless Microsoft Edge QA covers 320, 390, 768, 1024, 1440, and 1920 CSS pixels. It verifies one H1/main, no horizontal overflow, both desktop/mobile current-page states, local image paths, the approved hero statistics, absence of the older unverified metrics, and zero external runtime requests.

## Metadata and static-export state

- Production canonical: `https://kalitefilo.com.tr/hakkimizda/`.
- Staging canonical: `https://staging.kalitefilo.com.tr/hakkimizda/`.
- The route remains page-level `noindex, nofollow`; staging additionally emits `nocache`.
- The sitemap remains empty because no registry route is published.
- The title uses the approved route label and the root title template; the description is repository-owned About copy and no structured data was invented.

## Deferred items

- The two inert hero controls need approved destinations or in-page content before they should perform an action.
- Company history, milestones, founding date, legal identity, office/facility claims, and service-level evidence remain unresolved.
- The supplied `300+` and `%98` values are recorded as owner-approved display content; supporting evidence and publication approval remain part of the route's later release gate.
- Final publication rights/provenance for the reused Home review photography remain a release blocker.
- The route remains unpublished until the page content, claims, imagery, metadata, and legal/commercial review are explicitly approved.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with no warning or error |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 42 tests, 0 failures |
| `npm run validate` | Passed: 12 route decisions, four existing Client Components |
| `npm run build:staging` | Passed: all 15 generated entries are static |
| staging `npm run verify:output` | Passed |
| `npm run build` | Passed: final `out/` rebuilt for production |
| production `npm run verify:output` | Passed |
| `node scripts/smoke-about.mjs` | Passed at 320, 390, 768, 1024, 1440, and 1920px |

Final production artifact snapshot:

- 156 files / 11,121,283 raw bytes;
- 14 JavaScript files / 669,503 raw bytes;
- one CSS file / 70,583 raw bytes;
- `/hakkimizda/index.html`: 106,460 bytes;
- authored Client Components: four repository-wide, zero introduced by About; and
- sitemap URLs: zero.

The production About output reports title `Hakkımızda | Kalite Filo`, canonical `https://kalitefilo.com.tr/hakkimizda/`, and robots `noindex, nofollow`.
