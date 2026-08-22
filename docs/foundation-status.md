# Foundation status

Date: 2026-08-09

## Outcome

The neutral Phase 1 foundation was implemented and verified as a Next.js static export. A later scoped checkpoint has since added the shared public shell and minimal static route skeletons without publishing any route; see `docs/shared-shell-status.md`. No complete public page, form handler, customer login, portal, authentication, database, ORM, CRM, admin panel, or runtime CMS has been implemented.

The artifact measurements and command results below record the foundation checkpoint. The current `out/` directory may reflect the later shared-shell checkpoint. Production and staging artifacts remain intentionally target-specific because their origins, crawler policy, and environment-level metadata constraints are frozen at build time.

## Current-state reconciliation — 2026-08-17

The sections and metrics below remain the historical 2026-08-09 foundation checkpoint. Current repository facts that supersede its empty-data and nine-route statements are:

- the route registry now has 13 decisions: 10 static routes plus `/arac-listesi/[slug]/`, `/filo-rehberi/[category]/`, and `/filo-rehberi/[category]/[slug]/`;
- `/kvkk-ve-guvenlik/`, `/cerez-politikasi/`, and `/kullanim-kosullari/` now have minimal static skeletons in `canonical-path` state, with no legal body, version, effective date, or publication approval;
- the project owner has verified `05317158068` and `info@kalitefilo.com.tr`, now stored as typed contact data;
- 32 owner-supplied vehicle records are preserved locally; 28 representative model-family images have completed licence/visual-match review and local promotion, while four records deliberately remain image-less;
- 18 owner-supplied Markdown articles are integrated and statically rendered through category-aware detail routes; six have matched local WebPs, while author/reviewer/source and publication approval remain deferred; and
- Home remains `foundation` and noindex, every route remains outside the sitemap, and the sitemap remains empty.

No current artifact-size or final command metric is asserted by this addendum; the original measurements below must not be read as the current integrated output.

### Price reconciliation — 2026-08-14

The project owner explicitly approved the `Portföy_32` `Önerilen Liste Net`
values for display on all 32 catalogue cards and the corresponding three Home
cards. These are monthly TRY net list prices and must be labelled `Aylık Liste
Net`, `₺…/ay`, and `KDV hariç`. This narrow approval does not fill the workbook's
blank `Nihai Yayın Net` or `KDV Dahil Nihai` fields and does not approve the
template duration/kilometre values, price validity, availability, service scope,
contract conditions, or a binding offer. It does not publish any route; Home and
the catalogue remain noindex and outside the empty sitemap.

## Completed foundation work

- Preserved Next.js `16.2.11`, React/React DOM `19.2.4`, App Router, strict TypeScript, Tailwind CSS v4, `output: "export"`, `trailingSlash: true`, and unoptimized static image delivery.
- Removed Create Next App metadata, Google-font build downloads, Vercel/Next starter assets, the starter favicon, starter links, and the automatic dark theme.
- Set the root document language to Turkish and added a working skip-link target.
- Added an allowlisted build target:
  - `production` → `https://kalitefilo.com.tr`, where `robots.txt` may allow crawling but a route is indexable only when its registry entry is explicitly published and has `indexable: true`;
  - `staging` → `https://staging.kalitefilo.com.tr`, where every route is forced to noindex/nofollow and `robots.txt` disallows crawling;
  - an unset target falls back safely to staging/noindex for development; unknown values fail.
- Added a reusable, request-independent route-metadata policy. Route publication/indexability and the deployment environment are evaluated together: an unpublished route remains noindex in production, and staging remains noindex regardless of a route's future publication state.
- Added static, request-independent `robots.txt`, `sitemap.xml`, and manifest generation. Next.js 16.2.11 requires these generated metadata endpoints to declare `dynamic = "force-static"` under export mode; this is an explicit build-time-only contract, not request-time rendering or ISR.
- Added a neutral static 404. Apache mapping to `404.html` with a real 404 response remains a staging-tested deployment task.
- Added an obvious gray question-mark site-icon placeholder. It is not brand artwork and is release-blocking until an approved logo/icon is supplied.
- Established semantic colors, surfaces, text roles, borders, functional error/success/focus states, container/gutters, spacing, radii, control heights, and typography roles in Tailwind CSS v4.
- Established a safe system font stack. No font file was downloaded or invented.
- Added typed contracts for site identity, contact information, navigation, vehicles and commercial offers, articles and sources, FAQ entries/categories, legal-page metadata, local media, and SEO metadata.
- Kept site identity/contact as `null` and every vehicle, article, FAQ, legal, category, and navigation collection empty. No business fact or example record was seeded.
- Added the explicit approved-route registry with only:
  - `/` as the unpublished foundation route;
  - `/hakkimizda/`;
  - `/arac-listesi/`;
  - `/arac-listesi/[slug]/`;
  - `/filo-rehberi/`;
  - `/filo-rehberi/[slug]/`;
  - `/sikca-sorulan-sorular/`;
  - `/iletisim/`; and
  - `/teklif-al/`.
- The Home entry remains in `foundation` status; the other eight approved core paths remain in `canonical-path` status. All nine are unpublished, non-indexable, and excluded from the sitemap until the corresponding page and content pass their publication gates. The current empty sitemap is deliberate.
- Added neutral Server Component primitives for containers, sections, stack/cluster flow, native buttons, action/text links, card surfaces, headings, breadcrumbs, skip links, local SVG icons, and responsive native pictures.
- Added a dependency-free validator for route integrity, duplicate IDs/paths, malformed paths, publication/indexability/sitemap invariants, explicitly approved dynamic route families, placeholder links, excluded system routes, prohibited runtime architecture, prohibited direct dependencies, pinned framework versions, static export config, starter/remote asset leakage, and exported-file presence.
- Added dependency-free Node tests for the route/path and environment-aware metadata contracts.
- Added project-specific repository, build, artifact, PHP-boundary, and Apache-boundary documentation. No PHP endpoint or `.htaccess` file exists.

The functional success tokens are accessibility-oriented interface colors, not verified Kalite Filo brand colors. They require normal visual QA with the rest of the system.

## Commands and results

Final integrated checks:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 12 tests, 0 failures |
| `npm run validate` | Passed: 9 route decisions, 0 Client Components |
| `npm run build:staging` | Passed; root, 404, robots, sitemap, and manifest outputs were generated statically |
| `npm run verify:output` after staging | Passed; staging robots disallow `/`, root metadata is `noindex, nofollow, nocache`, canonical origin is staging |
| `npm run build` | Passed; the production-target root, 404, robots, sitemap, and manifest outputs were generated statically |
| `npm run verify:output` after production | Passed; production robots allow `/` and advertise the production sitemap, while unpublished Home emits `noindex, nofollow` with the production canonical |

The first staging build correctly failed before the generated metadata routes had the explicit Next.js 16 static-handler declaration. The installed Next.js 16.2.11 route-handler/export guidance and the build error were reconciled by adding `dynamic = "force-static"` to `robots.ts`, `sitemap.ts`, and `manifest.ts`; all final checks then passed.

Current production foundation SEO output:

- Home canonical: `https://kalitefilo.com.tr/`
- Home robots metadata: `noindex, nofollow`
- `robots.txt`: permits crawling from `/` and advertises `https://kalitefilo.com.tr/sitemap.xml`
- `sitemap.xml`: valid empty `<urlset>` with zero URLs because no route is published

## Final production artifact snapshot

- Total files: 34
- Total raw size: 750,735 bytes
- JavaScript: 12 files, 633,125 raw bytes
- CSS: 1 file, 51,862 raw bytes
- Font files: 0
- Authored Client Components: 0
- Authored `use client` directives: 0
- Source-control directory markers in `out/`: 0

The JavaScript total is the Next.js/App Router static-export baseline; this foundation adds no authored hydration island. Later work must record and justify any increase.

## Dependencies

No dependency was installed or added.

Existing pinned runtime packages remain:

- `next` `16.2.11`
- `react` `19.2.4`
- `react-dom` `19.2.4`

The package now declares Node.js `>=20.9.0` for development/CI builds, matching Next.js 16.2.11. Production does not run Node.js, npm, or npx.

## Deferred work and blockers

The following remain deliberately unresolved and must not be represented as verified:

- complete Home or any other Phase 1 page composition;
- vehicle cards, editorial cards, forms, or complete responsive page compositions beyond the shared shell;
- approved Home, About, Vehicle, Filo Rehberi, FAQ, Contact, and Quote paths now have only minimal unpublished skeletons; legal, result, category, and utility routes remain unresolved;
- company legal identity, address, phones, emails, hours, history, statistics, service claims, and commercial claims;
- vehicle inventory, taxonomy, specifications, availability, prices, VAT treatment, contract terms, kilometre limits, offer dates, and disclaimers;
- article/FAQ/legal body content, authors, reviewers, dates, sources, and approved SEO descriptions;
- final logo, favicon, social image, photos, image rights, alt text, crops, and optimized variants;
- licensed local Plus Jakarta Sans WOFF2 files with Turkish coverage and font-rights confirmation;
- contact/newsletter form contracts and every workflow's consent/legal copy,
  retention and mail-delivery validation; the quote form and its secret-free
  PHP source now exist, but cPanel execution/delivery and legal approval remain
  release blockers;
- analytics, cookie classification/consent, social links, and third-party integrations;
- project-owned Apache rules, 404 mapping/status behavior, cache/compression/security headers, artifact assembly, upload, rollback, and cPanel staging verification;
- manual responsive, keyboard, zoom/reflow, screen-reader, browser, accessibility, and visual-comparison testing for real pages.

The foundation artifact is a technical verification artifact, not a launch-ready website. Implementation must stop here until the next scoped task supplies or approves the inputs needed by the implementation plan.
