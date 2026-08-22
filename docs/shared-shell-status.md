# Shared public shell and static route skeleton status

Date: 2026-08-09

Last reconciled: 2026-08-13

## Outcome

The Phase 1 shared public shell and the approved static route skeleton set are implemented as a Next.js static export. Home has since gained a review implementation backed by owner-supplied vehicle and Filo Rehberi data; the remaining public routes stay minimal skeletons.

The shell remains build-time static and Server Component-first. Its one narrowly scoped authored Client Component reads the browser pathname and renders the navigation links with truthful current-page state. `RootLayout`, `SiteHeader`, `SiteFooter`, `MobileNavigation`, page skeletons, and the native mobile disclosure remain Server Components. Later Home work added three separate islands for result-query display, dependent finder selects, and a no-storage newsletter demo; none broadens the shell boundary. No dependency or menu script was added.

The registry now contains **12 decisions: 10 static routes and 2 dynamic families**. All 10 static routes are implemented, unpublished, non-indexable, and excluded from the sitemap. The two approved dynamic route families remain registry decisions only; no vehicle or article detail page has been created even though owner-supplied local records now exist.

## Design authority used

Implementation used this authority order:

1. Phase 1 scope, repository guardrails, and verified route decisions.
2. `references/stitch/DESIGN.md` for the normalized token, grid, spacing, and responsive intent.
3. The local updated Stitch HTML and screenshots under `references/stitch/`.
4. The connected Stitch project’s current “Güncellenmiş İletişim” desktop family as additional visual evidence.

The connected updated Home, About, Vehicle List, Filo Rehberi, Blog Detail, FAQ, Quote, and mixed-title updated Contact records were inspected. Every connected visual record is `DESKTOP` and 2560px wide. There is no supplied mobile or tablet screen.

The older “Unified” family was not used as implementation authority. Generated placeholder links, customer login, remote assets, conflicting contact/legal data, newsletters, stale copyright text, and generated logos/icons were not carried into the shell.

## Components implemented

| Component | Contract implemented |
| --- | --- |
| `SiteHeader` | Full-width sticky/translucent Server Component shell, centered `PageContainer`, approved local logo link, desktop primary navigation, quote CTA, and mobile disclosure. It remains in normal document flow before becoming sticky. |
| `PrimaryNavigation` | The sole shell Client Component boundary. It receives registry-derived items from Server Components, reads `usePathname()`, applies the restrained current style and `aria-current="page"`, and renders desktop, mobile, and footer link lists. |
| `MobileNavigation` | Server-rendered native, non-modal `details`/`summary`; all desktop destinations plus Teklif Al; in-flow expansion; visible open/closed affordance; no animation or menu-state JavaScript. |
| `SiteFooter` | Full-width navy Server Component shell with inverse text branding; responsive Hızlı Linkler, Kurumsal, and Bize Ulaşın groups; verified phone/email; compact `SSS` label; and three approved legal-skeleton links. |
| `PageHeader` | Exactly one H1, optional breadcrumbs/eyebrow/intro, and `standard` or `high-emphasis` type scale. Optional values render nothing when absent. |
| `BrandLink` | Header Home link with the approved local transparent PNG, intrinsic dimensions, and `alt="Kalite Filo"`; inverse/footer use remains accessible text because no approved contrast-safe inverse logo exists. |
| `public-navigation` config | Typed shell navigation derived from the approved route registry, including the three approved legal skeletons, preventing label/path drift without treating a skeleton as published content. |

The root layout owns exactly one shared header and one shared footer around every route-owned `main` landmark. Existing `SkipLink`, `PageContainer`, `Section`, `Stack`, `Breadcrumbs`, button-style, heading, focus, and typography primitives remain reused.

## Current-page state architecture

Installed Next.js 16.2.11 documentation states that layouts cannot read pathname and identifies a small Client Component using `usePathname()` as the active-link pattern. `PrimaryNavigation` is therefore the only shell `use client` boundary. It imports no site/environment/server-only module: approved navigation items and action styling are computed by Server Components and passed as serializable props.

The dependency-free `navigation-route-matching.mjs` helper removes query/fragment text, normalizes trailing slashes, and maps exact static paths to their navigation owner. `/arac-listesi/<slug>/` paths belong to Araç Listesi, and future `/filo-rehberi/<slug>/` paths belong to Filo Rehberi. Home and unknown paths return no ordinary navigation item. Contact is not a header item, but its existing footer link receives current-page state. Desktop, mobile, and footer lists share the same helper and emit `aria-current="page"` on only the matching link.

The mobile disclosure uses ordinary document-navigation anchors. That deliberately resets native `details` state when navigating between exported documents, avoiding a hydration island solely to close the menu after an App Router client transition.

## Approved logo asset

The approved source attachment was inspected as a transparent 32-bit RGBA PNG:

- source: `kalite_filo_logo_cropped_nobg.png`;
- source dimensions: 1254×359;
- source bytes: 187,570;
- non-transparent bounds: x=43–1210, y=64–296, or 1168×233 visible pixels;
- production asset: `public/images/brand/kalite-filo-logo.png`;
- production dimensions: 560×112;
- production bytes: 55,750;
- byte reduction: 70.28%.

Only fully transparent outer padding was removed. The visible blue/orange artwork was not redrawn, recolored, traced, given effects, or placed on a background. High-quality bicubic downsampling remains comfortably above 2× the current maximum display size. The header delivers this single local PNG directly with `width="560"`, `height="112"`, responsive 144/160/176px CSS widths, and no preload or runtime optimizer.

The opaque blue portion averages approximately RGB 2/34/75 and has only about 1.02:1 contrast against the navy footer. The image is therefore not used in the footer; the existing white text brand remains until a separately approved inverse logo is supplied. The horizontal wordmark is not used as the favicon or manifest square icon, so the deliberate placeholder icon remains.

## Static route skeletons and current Home

| Route | Registry ID | H1 | PageHeader variant | Publication state |
| --- | --- | --- | --- | --- |
| `/` | `home` | Filo Kiralamada İşinizin Gücüne Güç Katın | Review Home implementation | `foundation`, noindex, no sitemap |
| `/hakkimizda/` | `about` | Hakkımızda | `standard` | `canonical-path`, noindex, no sitemap |
| `/arac-listesi/` | `vehicles` | Araç Listesi | `standard` | `canonical-path`, noindex, no sitemap |
| `/filo-rehberi/` | `fleet-guide` | Filo Rehberi | `high-emphasis` | `canonical-path`, noindex, no sitemap |
| `/sikca-sorulan-sorular/` | `faq` | Sıkça Sorulan Sorular | `standard` | `canonical-path`, noindex, no sitemap |
| `/iletisim/` | `contact` | İletişim | `standard` | `canonical-path`, noindex, no sitemap |
| `/teklif-al/` | `quote` | Teklif Al | `high-emphasis` | `canonical-path`, noindex, no sitemap |
| `/kvkk-ve-guvenlik/` | `privacy-security` | KVKK ve Güvenlik | `standard` | `canonical-path`, noindex, no sitemap |
| `/cerez-politikasi/` | `cookie-policy` | Çerez Politikası | `standard` | `canonical-path`, noindex, no sitemap |
| `/kullanim-kosullari/` | `terms-of-use` | Kullanım Koşulları | `standard` | `canonical-path`, noindex, no sitemap |

Except for Home, each inner skeleton contains only a route-owned `main`, the shared `PageHeader`, its approved H1, an “Ana Sayfa” breadcrumb link, and the unlinked current breadcrumb item. The three legal skeletons contain no legal body text. No intro, eyebrow, invented legal sentence, placeholder form, statistic, or company claim was added to them.

The `/arac-listesi/[slug]/` source route now statically generates all 32 vehicle details. Filo Rehberi also statically generates six category routes under `/filo-rehberi/[category]/` and 18 article routes under `/filo-rehberi/[category]/[slug]/`.

## Responsive decisions

- Header and footer backgrounds span the viewport; their inner content uses the existing 1360px `PageContainer` contract.
- Existing gutters remain 16px at narrow widths, 24px from the tablet token breakpoint, and 40px from the desktop token breakpoint.
- Desktop navigation begins at the Tailwind `lg` breakpoint (1024px). Its three-column grid keeps the four links geometrically centered between independent brand and quote areas. The requested order is Hakkımızda, Araç Listesi, Sıkça Sorulan Sorular, Filo Rehberi. The mobile disclosure retains the same destinations/order below 1024px.
- The mobile disclosure expands in document flow. There is no invented drawer, modal, overlay, focus trap, fixed height, or animation.
- Every navigation target has at least a 44px minimum target height, and long labels can wrap.
- The approved header logo renders at 144×29px at 320/390px, 160×32px at 768/1024px, and 176×35px at 1440/1920px without stretching or collision.
- The footer is one column on narrow screens, two columns when space permits, and a balanced brand-plus-three-group layout on wide screens. The verified phone/email and longer Turkish legal labels wrap without requiring fixed widths.
- Page headings use responsive tokenized scales and normal wrapping. Breadcrumb items wrap and use `min-width: 0`/word-breaking safeguards.
- The header is sticky but remains in document flow, so it does not create initial H1 overlap. Future fragment-target offsets still require page-level verification.
- No shell component uses viewport breakout hacks, fixed desktop padding at mobile sizes, or a fixed content height.

The native mobile disclosure, its in-flow placement, its text plus/minus affordance, the 1024px desktop-navigation threshold, and the reduced footer composition are conservative implementation decisions made because no approved mobile/tablet screen exists. They are not represented as supplied Stitch designs.

At the earlier shared-shell checkpoint, headless Edge loaded the production export at 320, 390, 768, 1024, 1440, and 1920px. The native mobile disclosure was exercised below 1024px; desktop labels were verified in the requested order and their center differed from the viewport center by 0px at 1024px and above. Every viewport had `scrollWidth === innerWidth`; the logo retained its intrinsic ratio and did not collide with the menu or desktop navigation. Teklif Al remained 54px high on desktop. No remote image, font, or CDN request occurred. The reconciled portfolio/editorial/footer state still requires the parent task’s final integrated browser run. Full cross-browser, zoom, screen-reader, and approved visual-comparison testing remains a later release gate.

## Accessibility decisions

- Landmark order is SkipLink, `header`/labelled navigation, one route-owned `main`, and `footer`.
- Every implemented public route exports exactly one `main` and one H1.
- The skip link targets `#main-content` on every route.
- Desktop and mobile links expose the same primary destinations; the footer adds Contact, three approved legal skeletons, the verified `tel:` phone link, and the verified `mailto:` email link. Its FAQ label is shortened visually to `SSS` without changing the canonical route.
- The matching desktop and mobile link receives `aria-current="page"`; active primary links use blue text plus a bottom indicator on desktop and a quiet surface plus underline on mobile. Quote uses a restrained ring, and footer links use an underline. Unrelated links receive no `aria-current`.
- Links are links, the disclosure is native HTML, and no navigation action is represented by a button.
- Breadcrumbs use a labelled `nav`, an ordered list, a real Home link, decorative separators, and `aria-current="page"` on the unlinked current item.
- Focus remains visible. Footer links override the light-surface blue focus ring with the accent outline so focus is visible on navy.
- The native disclosure introduces no keyboard trap and requires no redundant hand-authored ARIA state.
- A 320px browser keyboard check traversed SkipLink → logo → summary, opened the disclosure with Enter, reached the current 44px navigation link with Tab, and returned to summary with Shift+Tab. Keyboard focus retained a separate 3px outline.
- Reduced-motion behavior remains inherited from the foundation, and the shell adds no motion.

## Validation changes

The dependency-free validator requires a source page and exported `index.html` for every approved static route. It now evaluates 10 static routes and keeps both route families constrained to their two approved patterns. For every exported public route it checks:

- registry-derived environment robots metadata;
- exact canonical origin/path;
- exactly one `header`, `main`, H1, and `footer`;
- skip-link and target presence;
- internal shell links resolving only to approved static paths;
- excluded customer-login content; and
- the existing runtime, dependency, external-asset, publication, sitemap, and route-family guardrails.

The current validator allowlists exactly four narrow boundaries: shell route awareness, vehicle query display, dependent finder fields, and the no-storage newsletter demo. It rejects any other `use client` boundary, validates the local transparent PNG signature/dimensions/size in both `public/` and `out/`, and verifies every exported route contains the local logo with intrinsic dimensions and accessible alt text.

Dependency-free route-matching tests cover all current navigation destinations, both approved future detail families, Home, an unknown path, trailing slashes, queries, and fragments. The exact current suite total belongs to the final integrated validation record below rather than this historical shell checkpoint.

## Historical build and output record

The figures below document the earlier shared-shell/logo checkpoint. They predate Home composition, the 32-record portfolio, six supplied articles, current content assets, verified footer contact links, and the three legal skeletons. They are intentionally retained as historical evidence, not current artifact measurements.

Production artifact before this correction:

- files: 82;
- total raw size: 1,344,444 bytes;
- JavaScript: 12 files, 636,388 raw bytes;
- CSS: 1 file, 53,847 raw bytes;
- logo asset: absent;
- authored Client Components: 0.

Final production artifact after this correction:

- files: 83;
- total raw size: 1,228,275 bytes;
- JavaScript: 12 files, 638,735 raw bytes;
- CSS: 1 file, 53,963 raw bytes;
- logo asset: 55,750 bytes;
- font files: 0;
- authored Client Components: 1;
- authored `use client` directives: 1.

Change from the immediately preceding shared-shell artifact:

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| Total files | 82 | 83 | +1 |
| Total raw bytes | 1,344,444 | 1,228,275 | −116,169 |
| JavaScript files | 12 | 12 | 0 |
| JavaScript raw bytes | 636,388 | 638,735 | +2,347 |
| CSS files | 1 | 1 | 0 |
| CSS raw bytes | 53,847 | 53,963 | +116 |
| Logo bytes | 0 | 55,750 | +55,750 |
| Authored Client Components | 0 | 1 | +1 |

The small client boundary adds 2,347 raw JavaScript bytes. The final artifact is nevertheless 116,169 bytes smaller overall because the repeated navigation representation across static HTML/RSC outputs changed when the shared route-aware list became one client module. No dependency, font, or remote runtime asset was added.

At that historical shared-shell checkpoint, these checks passed:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 18 tests, 0 failures |
| `npm run validate` | Passed: 9 route decisions, exactly one approved Client Component |
| `npm run build:staging` | Passed: all seven public routes and metadata outputs generated statically |
| staging `npm run verify:output` | Passed: all skeletons noindex/nofollow/nocache with staging canonicals; crawl disallowed; sitemap empty |
| `npm run build` | Passed: all seven public routes and metadata outputs generated statically |
| production `npm run verify:output` | Passed: all skeletons noindex/nofollow with production canonicals; crawling allowed; sitemap empty |

The 2026-08-13 integrated production rebuild now contains 130 files and 4,325,806 raw bytes: 646,981 JavaScript bytes across 14 files, 64,237 CSS bytes in one file, and 2,614,487 image bytes across 22 files. Lint, strict typecheck, 28 dependency-free tests, validation, staging build/verification, production build/verification, and the 320–1920px Edge smoke run all passed. The architecture still contains exactly **4** authored Client Components: route-aware navigation, vehicle-query display, dependent vehicle finder, and the no-storage newsletter demonstration.

Production `robots.txt` allows crawling and advertises the production sitemap. Every implemented route nevertheless emits `noindex, nofollow` because no registry entry is published. `sitemap.xml` remains a valid empty `urlset`.

## Deferred blockers

Still unresolved and intentionally absent:

- complete inner-page compositions and final approval of Home copy;
- a separately approved inverse/footer logo, dedicated favicon/brand mark, licensed font files, photography, and remaining image rights;
- company legal identity, address, hours, social URLs, copyright wording, claims, statistics, service guarantees, and any contact details beyond the supplied phone/email;
- publication review for the 32 supplied vehicle records, imagery for the remaining 29 vehicles, pricing, availability, terms, full vehicle listing/detail UI, and dynamic detail pages;
- final editorial review, missing author/reviewer decisions, and Filo Rehberi detail UI; 18 supplied Markdown articles and six matching local images are now present on the implemented, unpublished index;
- FAQ answers;
- contact/quote forms, legal/consent copy, PHP endpoints, mail delivery, validation, and result states;
- legal body content for the three implemented noindex skeletons;
- functional newsletter processing, analytics, cookies/consent, and third-party integrations;
- final visual approval, true mobile/tablet designs, manual WCAG/browser testing, Apache configuration, and staging deployment verification.

This document remains the shell checkpoint record, reconciled with the later Home/content/footer work. It does not claim that any route is published.

## 2026-08-14 active navigation verification

The existing isolated route-aware navigation boundary remains the only owner of current-route state. Its desktop and mobile current links now use an explicit corporate-blue text/border state so utility ordering cannot leave the neutral color visible. Edge verifies exactly one `aria-current="page"` link in each navigation on `/hakkimizda/`, `/arac-listesi/`, `/sikca-sorulan-sorular/`, and `/filo-rehberi/`; unrelated items remain unannotated. No new Client Component was introduced.
