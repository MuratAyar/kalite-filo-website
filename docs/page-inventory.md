# Kalite Filo page inventory

Audit date: 2026-08-08; route decisions reconciled 2026-08-09

Status: audit only. The nine core Home, About, Vehicle, Filo Rehberi, FAQ, Contact, and Quote paths/families below are now canonical Phase 1 decisions. Legal, category, result, and utility routes remain inventory candidates. No public page is published, and route approval is not approval to publish unverified content.

## Outcome

The repository currently contains one authored App Router route, `/`, as a neutral unpublished foundation placeholder. None of the Kalite Filo public page compositions is implemented or published. The available page evidence consists of nine local Stitch exports, the connected Stitch project summarized in [design-audit.md](./design-audit.md), and four design-derived content reference files.

The approved core route set is `/`, `/hakkimizda/`, `/araclar/`, `/araclar/[slug]/`, `/filo-rehberi/`, `/filo-rehberi/[slug]/`, `/sikca-sorulan-sorular/`, `/iletisim/`, and `/teklif-al/`. The public content name is **Filo Rehberi**, the FAQ label is **Sıkça Sorulan Sorular**, and the quote CTA is **Teklif Al**. Customer login, portal, authentication, CRM, database, ORM, admin, Server Actions, Middleware/Proxy, runtime Next.js API routes, SSR, and ISR are excluded.

## Current implementation

| Route | Current source | Current result | Production-ready |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Neutral foundation placeholder; registry status `foundation`, non-indexable, and excluded from the sitemap | No |

Global implementation observations:

- `src/app/layout.tsx` establishes Turkish document metadata and the environment-aware foundation policy; the Home route supplies its own canonical and route-level robots metadata.
- No other public `page.tsx` or dynamic segment exists. Static foundation metadata outputs and a neutral `not-found.tsx` exist, but they do not publish any Phase 1 page.
- `public/` contains an obvious placeholder icon but no approved Kalite Filo logo or photography.
- `next.config.ts` already sets `output: "export"`, `trailingSlash: true`, and unoptimized images. `package.json` pins Next.js 16.2.11, and `tsconfig.json` has strict mode enabled.

## Verified deployment context

- Canonical production origin: `https://kalitefilo.com.tr`.
- The production site is deployed at the domain root on TURKTICARET Web Eko Linux shared hosting with cPanel.
- Production has no Node.js, npm, or npx runtime and must receive only a prebuilt Next.js static export artifact.
- Production PHP is verified as `8.5.8` with SAPI `cgi-fcgi`; PHP remains reserved for later approved form endpoints.
- HTTPS is enabled and forced for the production origin.
- Staging origin: `https://staging.kalitefilo.com.tr`, with a separate document root, configured DNS, Let's Encrypt SSL, and forced HTTPS.

These facts resolve the origin, root-path, staging, HTTPS, and PHP-runtime questions. They do not verify company identity, contact information, legal text, form delivery, or any public claim.

## Phase 1 route map

The nine core routes explicitly marked canonical are approved for consistent use in future navigation, metadata, breadcrumbs, sitemaps, canonical URLs, and Apache deployment rules. Approval establishes the path only: every core route remains unpublished, non-indexable, and excluded from the sitemap until its page and content pass their publication gates. Legal paths in the table remain proposed until separately approved.

| Route | Page | Route status | Current implementation | Required decision or dependency |
| --- | --- | --- | --- | --- |
| `/` | Home | **Canonical; foundation only** | Neutral unpublished placeholder; page composition missing | Verified claims, featured vehicles, real assets, and CTA destinations |
| `/hakkimizda/` | About | **Canonical** | Missing | Real corporate story and verified service claims/metrics |
| `/araclar/` | Vehicle portfolio | **Canonical** | Missing | Verified static dataset, taxonomy, filters, availability, and price policy |
| `/araclar/[slug]/` | Vehicle detail | **Canonical family** | Missing design and route | One statically generated path per verified vehicle; detail layout and content still required |
| `/filo-rehberi/` | Filo Rehberi index | **Canonical** | Missing | Approved article corpus, taxonomy, and real pagination |
| `/filo-rehberi/[slug]/` | Filo Rehberi article detail | **Canonical family** | Missing | Every slug needs complete approved content and static generation |
| `/sikca-sorulan-sorular/` | Sıkça Sorulan Sorular | **Canonical** | Missing | Approved answers and category taxonomy; fake hotline must be removed |
| `/iletisim/` | Contact | **Canonical** | Missing | Verified address/channels, form endpoint, notice, validation, and result states |
| `/teklif-al/` | Quote request | **Canonical** | Missing | Corporate-only scope, option datasets, PHP contract, and legal wording remain unresolved |
| `/kvkk-ve-gizlilik/` | KVKK/privacy | Proposed | Missing content and design | Counsel-approved text and verified data-controller details |
| `/aydinlatma-metni/` | Form privacy notice | Proposed | Missing content and design | Decide whether one scoped notice or separate contact/quote/newsletter notices are required |
| `/cerez-politikasi/` | Cookie policy | Proposed | Missing content and design | Must describe the actual production cookies/vendors, not hypothetical ones |
| `/kullanim-kosullari/` | Terms of use | Proposed | Missing content and design | Counsel-approved copy |
| Framework 404 output | Not found | Required utility output | Neutral foundation output exists; branded/approved treatment pending | Final safe navigation and Apache 404-status behavior; no server fallback is available |

### Crawl and indexability contract

Crawler access and page indexability are separate static-build decisions. Staging always emits noindex/nofollow page metadata and disallows crawling. Production `robots.txt` may allow crawling, but each route remains noindex unless its registry entry is explicitly `published` with `indexable: true`. Sitemap generation additionally requires `sitemap: true`. Because all nine approved core entries are currently unpublished and non-indexable, the production foundation sitemap is intentionally empty.

### Optional routes that are not yet approved

The following may be useful, but there is insufficient evidence to add them to the committed Phase 1 information architecture:

- Vehicle category landing pages such as `/araclar/binek/`, `/araclar/suv/`, `/araclar/hafif-ticari/`, and `/araclar/yonetici/`. `vehicles.md` suggests these for SEO, while the design also supports one client-filtered `/araclar/` route. Choose one strategy after the real taxonomy is approved.
- Article category/tag landing pages. The categories exist as design filters, but no URL policy or publishable article corpus exists.
- Service-detail pages for Long-Term Rental, Operational Management, Commercial Vehicles, or Executive Vehicles. Home shows “Keşfet” actions, but no page designs or long-form content exist. Those actions may instead target approved anchors, vehicle filters, or the quote page.
- A campaign page. Blog Detail advertises a 2026 campaign, but no real campaign, terms, or destination is supplied.
- Separate form success/thank-you URLs. Inline status regions may be sufficient; the experience and tracking requirements have not been decided.

No optional route should be created solely to make an inert design control appear functional.

## Resolved naming and canonical-route decisions

### Filo Rehberi

The generated screens mix “Blog” and “Filo Rehberi,” but the Phase 1 decision is now:

- public label: **Filo Rehberi**;
- canonical index: `/filo-rehberi/`;
- canonical article family: `/filo-rehberi/[slug]/`.

Do not emit a duplicate `/blog/` page family. A future `/blog/` redirect should be added only if a verified legacy-URL requirement is supplied. Category URL/query strategy remains unresolved until the real taxonomy and article volume are approved.

### Other labels

- Use **Sıkça Sorulan Sorular** at `/sikca-sorulan-sorular/`; do not use “SSS” or “Sık Sorulan Sorular” as the primary navigation/page label.
- Use **Teklif Al** for the quote CTA and `/teklif-al/` for the route. The final page H1 and explanatory copy still require content approval.
- The design includes “Bireysel” on the quote form, but the approved positioning and fields are corporate/B2B. Do not create a consumer route or flow without an explicit business decision and approved content.

## Out of scope

`references/stitch/kalite_filo_muteri_giris/` is design evidence only and must not become a Phase 1 route.

- Do not create `/musteri-girisi/`, sign-in, password recovery, sessions, accounts, authentication, or a portal.
- Remove “Müşteri Girişi” from the Phase 1 header and footer.
- No verified external portal URL has been supplied, so an external link must not be invented.
- Login-specific legal and security requirements in the reference material remain future-scope.
- Approved-content suggestions for CMS/API/database-backed pricing and CRM-ready forms do not authorize those prohibited systems in Phase 1.

## Route-to-navigation inventory

Every navigation or CTA must resolve to a real route, anchor, phone/email URI, or deliberately be removed. Stitch HTML contains 146 `href="#"` occurrences and many inert buttons.

| Control family | Intended destination or decision |
| --- | --- |
| Brand/logo | `/` |
| Hakkımızda | Approved `/hakkimizda/` route once the page is implemented and published |
| Araç Listesi | Approved `/araclar/` route once the page is implemented and published |
| Filo Rehberi | `/filo-rehberi/` |
| Sıkça Sorulan Sorular | `/sikca-sorulan-sorular/` |
| Teklif Al | `/teklif-al/`; vehicle-originated links may carry a non-sensitive static identifier after its contract is approved |
| Araçları İncele | Vehicle index |
| Vehicle card/detail action | Corresponding statically generated vehicle-detail route |
| Article card | Corresponding statically generated `/filo-rehberi/[slug]/` route |
| İletişim / İletişim Formu | Approved `/iletisim/` route or its later approved form anchor |
| Legal footer links | Corresponding real legal routes |
| Phone/email | Verified `tel:` / `mailto:` values only |
| About “Kilometre Taşlarımız” / “Vizyonumuz” | Approved section anchors or remove |
| Service “Keşfet” | Approved service/vehicle/quote destination or remove |
| Related campaign | Verified campaign destination or remove |
| Article sharing | Real share/email/copy behavior with accessible labels, or remove |
| Newsletter | Approved subscription processor and legal flow, or defer |
| Customer login | Remove from Phase 1 |

## Missing page and interaction states

These are required design/content states even when they do not become separate URLs:

- Vehicle detail at desktop, tablet, and mobile sizes
- Mobile navigation open/closed and keyboard states
- Mobile vehicle-filter sheet/drawer, active filters, empty results, and filter reset
- Vehicle unavailable/no-price presentation and quote-only presentation
- Article index empty category and genuine pagination states
- Article detail without related content and mobile contents/share treatment
- FAQ collapsed/expanded, filtered empty state, and keyboard/assistive-technology states
- Contact and quote: pristine, required/format errors, server failure, retry, submitting, and success
- Newsletter: legal notice, invalid/duplicate address, success, failure, and unsubscribe path if retained
- Cookie banner/preferences only if non-essential cookies are actually used
- Custom 404 and invalid static-detail slug behavior
- Image loading/failure fallbacks that do not display broken `img` text

## Static-export route implications

The production host has no Node.js, npm, or npx runtime. Route design therefore has these non-negotiable consequences:

- Every vehicle and article detail URL must be known at build time and emitted as a physical static page. Arbitrary runtime slugs cannot be resolved by Next.js.
- Vehicle/article records must be repository-local or available at build time. Phase 1 must not depend on a runtime database, ORM, CMS server, ISR, or SSR.
- Client-side filters may read/write URL query parameters, but the underlying catalogue is part of the static build. Query combinations are not separate generated pages unless explicitly designed as category routes.
- Forms must use approved PHP handlers or an explicitly approved external processor. They cannot use Server Actions or runtime Next.js API routes.
- With `trailingSlash: true`, internal links and the upload layout must consistently target directory-style URLs such as `/araclar/volkswagen-passat/`.
- Direct navigation must resolve to generated `index.html` files; unknown URLs receive the static 404 rather than an application server fallback.
- Any later verified legacy redirect or alias must be expressible through approved Apache `.htaccess` rules or additional static files; no `/blog/` alias is currently required.
- Sitemap, robots, canonical URLs, and route metadata must be generated from the same finite route inventory.

## Route readiness gate

A route is ready for implementation only when:

1. Its canonical path is approved; this is satisfied for all nine core route entries. Navigation labels are fixed where explicitly stated and otherwise still require normal content review.
2. Required content is supplied and marked publishable.
3. Claims, prices, availability, contact data, and legal text are verified where applicable.
4. All target links and form outcomes are defined.
5. Approved local assets and alt-text intent exist.
6. Dynamic-detail records can be fully generated during `next build`.
7. Desktop, tablet, and mobile behavior is specified.

See [content-gaps.md](./content-gaps.md) for the unresolved facts and [design-audit.md](./design-audit.md) for screen-level evidence.
