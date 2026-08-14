# Kalite Filo Phase 1 Implementation Plan

## Status and purpose

This began as an audit deliverable and remains the governing implementation sequence. The neutral foundation described below has now been implemented; public website pages and unresolved business content have not.

The plan must be read together with:

- `docs/design-audit.md`
- `docs/page-inventory.md`
- `docs/component-inventory.md`
- `docs/responsive-gaps.md`
- `docs/content-gaps.md`
- the approved-content files under `references/approved-content/`
- the design evidence under `references/stitch/`

Stitch HTML, generated code, CDN links, placeholder content, and generated images are evidence only. They are not production source code or approved business data.

## Foundation implementation checkpoint — 2026-08-09

Implementation-order step 2 is complete, together with only the neutral foundation portions of step 3. The repository now has:

- target-specific static builds for the verified production and staging origins;
- Turkish root metadata, environment-aware crawler directives, registry-driven page indexability, an explicit-route sitemap architecture, a minimal manifest, an obvious placeholder icon, and a neutral static 404;
- Tailwind CSS v4 semantic design tokens with a system-font fallback;
- typed site, navigation, vehicle, article, FAQ, legal, media, and SEO contracts with no placeholder records;
- an explicit approved-route registry containing the nine verified core canonical decisions, none yet published, indexable, or included in the sitemap;
- static Server Component layout, navigation, action, card, typography, icon, and picture primitives;
- dependency-free architecture/content-route validation and tests; and
- documented PHP and Apache boundaries without handlers or `.htaccess` rules.

This checkpoint does **not** complete the shared public header/footer, any Phase 1 page, vehicle or article detail route, real company/content data, forms, PHP handlers, deployment assembly, or launch approval. Plus Jakarta Sans and all final brand/media assets remain blocked on approved local files and rights. See `docs/foundation-status.md` for the exact verification record and current output footprint.

## Current-state reconciliation — 2026-08-13; price update 2026-08-14

The dated foundation checkpoint above remains historical. Planning now proceeds from these verified repository inputs:

- The approved registry contains 12 decisions: 10 static routes and two detail families. The new canonical legal skeletons are `/kvkk-ve-guvenlik/`, `/cerez-politikasi/`, and `/kullanim-kosullari/`; all remain unpublished, noindex, and excluded from the sitemap.
- `05317158068` and `info@kalitefilo.com.tr` are verified for public contact use. The company legal identity, address, other channel roles, business hours, and social destinations still require approval.
- Thirty-two owner-supplied portfolio records are local inputs for vehicle work and render in the responsive catalogue; 28 have attributed local representative images. On 14 August 2026, the project owner approved their `Önerilen Liste Net` values for monthly KDV-excluded list-price display on all 32 catalogue cards and the three Home cards. Phase 4 still requires binding-offer, availability, duration/kilometre, validity, service-scope and disclaimer policy; technical/editorial review; four remaining representative images; detail implementation; and publication approval.
- Six owner-supplied Markdown articles and local WebPs are integrated inputs for Filo Rehberi work. Phase 5 still requires authors/reviewers, citations and claim review, final metadata/taxonomy, index/detail rendering, and static slug generation.
- Legal route approval does not satisfy Gate 3: counsel-approved bodies, versions, effective dates, owners, and applicable form notices remain required.
- Home remains in `foundation` state with noindex metadata; no route is published and the sitemap remains empty.

These inputs reduce content uncertainty but do not change the static-export architecture, publication gates, or the remaining implementation order.

## Phase 1 scope contract

Phase 1 includes only:

- the public corporate website
- the vehicle portfolio and vehicle detail pages
- the Filo Rehberi listing and article pages
- corporate/about pages
- contact information and contact form
- quote request form
- FAQ
- approved legal pages
- static SEO, accessibility, and deployment foundations required by those pages

The following are explicitly excluded and must not be scaffolded, mocked, linked to a fake destination, or implemented behind a feature flag:

- customer login
- customer portal
- authentication or authorization
- password reset or account recovery
- employee CRM
- CRM screens or integrations
- database
- ORM
- admin panel
- runtime CMS
- runtime Next.js API routes

The Stitch customer-login screen is out of scope. A “Müşteri Girişi” navigation item must be removed until a real, separately scoped external destination is supplied and approved. It must not point to `#`, a dead route, or a mock login page.

## Hard architecture guardrails

These are release-blocking requirements, not preferences.

| Area | Required implementation | Forbidden implementation |
| --- | --- | --- |
| Framework | Next.js `16.2.11`, App Router, React `19.2.4` | Pages Router, framework substitution, unreviewed version upgrade |
| Language | TypeScript with `strict: true`; application code remains typed | Untyped application JavaScript, ignored TypeScript build errors |
| Styling | Tailwind CSS v4 compiled at build time, with project-owned design tokens | Tailwind CDN, copied Stitch runtime configuration, CSS-in-JS requiring runtime work |
| Rendering | Static HTML generated by `next build`; Server Components execute only at build time | SSR, PPR, request-time rendering, streaming assumptions, ISR |
| Export | `output: "export"` and `trailingSlash: true`; deploy the assembled static artifact | `next start` in production, a Node.js production process |
| Data | Repository-owned, reviewed, typed content and data files | Database, ORM, runtime CMS, request-time content fetches |
| Dynamic routes | Every approved vehicle/article slug is enumerated with `generateStaticParams()` | `dynamicParams: true`, runtime-only or fallback slugs |
| Request data | Static route input only; filtering uses prebuilt routes or a bounded client island | Server-page `searchParams`, `cookies()`, `headers()`, request-dependent redirects |
| Mutations | Native HTML POST to later approved same-origin PHP handlers; production runtime is PHP `8.5.8`, SAPI `cgi-fcgi` | Server Actions, Next route-handler POSTs, Next API routes |
| Routing/security | Apache-compatible `.htaccess` in the assembled artifact | Next.js `headers`, `redirects`, `rewrites`, Middleware, or Next 16 Proxy |
| Images | Approved local assets, pre-optimized for static delivery | Hotlinked Stitch/Google-hosted images or default runtime Next image optimization |
| Fonts/icons | Licensed, self-hosted font files and local SVG icons | Browser-time Google Fonts, Material Symbols, or icon-font dependencies |
| Interactivity | Semantic HTML/CSS first; small isolated Client Components only where necessary | A global client layout, SPA-only rendering, large UI libraries for simple controls |
| Secrets | Server-only configuration outside the webroot/repository | Secrets in Next public assets, browser JavaScript, PHP committed config, or generated HTML |

The current `next.config.ts` already establishes static export, trailing slashes, and unoptimized images. Those settings must remain covered by build tests. `reactStrictMode` may remain. `poweredByHeader` is harmless but does not replace Apache security headers.

App Router pages and layouts should remain Server Components by default. Do not add `"use client"` to a layout, page, header, footer, card grid, or content body merely to simplify implementation. A client boundary includes its imported graph in the browser bundle.

Do not add `loading.tsx` as a request-time streaming strategy. The static artifact must contain complete, usable HTML for every route.

## Verified pre-foundation decisions

The following facts are closed and should no longer be treated as implementation blockers:

| Area | Verified decision |
| --- | --- |
| Production origin | `https://kalitefilo.com.tr` |
| Production path | Domain root |
| Production hosting | TURKTICARET Web Eko Linux shared hosting with cPanel |
| Production build/runtime boundary | No Node.js, npm, or npx; production consumes only a prebuilt Next.js static export artifact |
| Production PHP | `8.5.8`, SAPI `cgi-fcgi`; only for later approved form endpoints |
| Production TLS | HTTPS enabled and forced |
| Staging | `https://staging.kalitefilo.com.tr`, separate document root, DNS and Let's Encrypt SSL configured, HTTPS forced |
| Home | Canonical path `/` |
| About | Canonical path `/hakkimizda/` |
| Vehicles | Index `/arac-listesi/`, detail family `/araclar/[slug]/` |
| Fleet content | Label “Filo Rehberi”, index `/filo-rehberi/`, article family `/filo-rehberi/[slug]/` |
| FAQ | Label “Sıkça Sorulan Sorular”, route `/sikca-sorulan-sorular/` |
| Contact | Canonical path `/iletisim/` |
| Quote | CTA label “Teklif Al”, route `/teklif-al/` |
| Customer login | Completely excluded from Phase 1 |

These decisions do not verify the company identity, public contact values, legal text, vehicle inventory, pricing, claims, assets, fonts, article content, or form-processing contract.

## Remaining prerequisites and decision gates

No placeholder may be converted into a production claim. Work can proceed on neutral foundations, but the affected route or feature cannot pass its gate until its inputs are approved.

### Gate 0 — company identity and remaining public-site settings

Confirm in writing:

- the verified brand logo, wordmark, favicon, and usage rights
- the exact legal trade name
- the official address, phone numbers, email addresses, and support hours
- MERSİS, trade registry, tax, KEP, and other company fields required by approved legal copy
- the final Turkish site name/title template and public contact-link policy
- whether any verified legacy URLs need Apache redirects; no `/blog/` alias is currently required

`metadataBase` and canonical URLs may use the verified production origin `https://kalitefilo.com.tr`. Until the remaining company facts pass this gate, do not add structured organization data or publish the placeholder address, conflicting email addresses, or unverified call-center number from the designs. HSTS remains a separately staged security-policy decision even though HTTPS is already enabled and forced.

### Gate 1 — content and commercial facts

Obtain approval for:

- the complete vehicle inventory, stable slug, brand/model/trim, category, transmission, fuel, body type, and rental attributes for each vehicle
- whether any vehicle is genuinely available
- the 32 visible price values are now approved as monthly TRY net list amounts with KDV excluded; obtain the still-missing `Nihai Yayın Net`/VAT-inclusive decision, duration, kilometre, stock, validity, service-scope, disclaimer, and any “starting from” qualifications
- final FAQ questions and answers
- final article titles, slugs, body copy, categories, authors/reviewers, publication dates, update dates, and sources
- every quantitative claim, including fleet size, service points, support availability, satisfaction rates, and claimed savings
- all campaign dates and expiration rules

Only approved records generate pages. Do not generate the twelve pagination pages shown in Stitch unless enough approved articles exist. Do not create duplicate cars by changing only their displayed model name, as the design evidence does.

### Gate 2 — assets and licensing

Obtain:

- original logo/vector files
- original vehicle and corporate photographs
- written confirmation that each image may be published commercially
- focal-point/crop guidance where important
- the selected typeface and its webfont licence
- an approved replacement for every generated or hotlinked Stitch image

The production site must not depend on `lh3.googleusercontent.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.tailwindcss.com`, or Material Symbols. If Plus Jakarta Sans is approved, provide local WOFF2 files with Turkish/Latin Extended coverage and only the weights actually used.

### Gate 3 — legal, privacy, and forms

Confirm:

- final KVKK/privacy, disclosure, cookie, terms, and commercial-communication texts
- which consent is necessary to process each form and which consent is optional marketing permission
- the version identifier and effective date for every consent text
- the form recipient addresses and operational owner
- the approved email delivery mechanism: cPanel mail transport, authenticated SMTP, or another reviewed service
- sender domain, SPF, DKIM, DMARC, bounce, retry, and failure-handling expectations
- newsletter provider, double-opt-in behavior, unsubscribe process, retention, and evidence-of-consent requirements
- permitted anti-spam service, if any, and its privacy implications
- retention and deletion rules for submissions and server logs

No database is allowed in Phase 1. If the business requires durable lead storage, CRM insertion, an auditable consent database, or an admin queue, that requirement is outside this phase and needs a scope decision before forms can promise it.

### Gate 4 — remaining hosting and release mechanism

Already verified:

- production is TURKTICARET Web Eko Linux shared hosting with cPanel;
- production has no Node.js, npm, or npx runtime;
- production PHP is `8.5.8`, SAPI `cgi-fcgi`;
- production is served from the domain root and forces HTTPS;
- staging uses `https://staging.kalitefilo.com.tr`, a separate document root, working DNS, Let's Encrypt SSL, and forced HTTPS.

Confirm on the configured staging account:

- required PHP extensions are available
- Apache modules permitted by the hosting plan, especially rewrite, headers, expires, and compression
- whether `.htaccess` options directives are permitted
- exact production/staging document-root paths and file permissions
- SSH/SFTP/Git deployment capabilities and any cPanel deployment hooks
- environment/secrets mechanism outside the public document root
- mail transport behavior and outbound limits
- backup and rollback procedure

The source repository alone is not deployable by a production `git pull`: `out/` is ignored and production has no Node.js, npm, or npx. Gate 4 still must select and prove an artifact deployment and rollback method.

## Proposed production source structure

The implementation should converge on this responsibility split. Exact filenames may be refined during implementation, but the boundaries must remain.

```text
src/
  app/                    # Static App Router routes and metadata files
  components/             # Shared Server Components; explicit client islands
  content/                # Reviewed long-form page/article/legal content
  data/                   # Typed vehicles, articles, FAQ, navigation, site settings
  lib/                    # Pure build-time helpers and schema/type guards
public/
  images/                 # Approved, optimized local raster assets
  icons/                  # Project-owned SVG assets
  fonts/                  # Licensed local WOFF2 assets, if used directly
server/
  php/                    # PHP source without secrets; excluded from Next runtime
deploy/
  apache/                 # Reviewed .htaccess source and deployment notes
scripts/
  assemble-export.*       # Build-environment-only artifact assembly/validation
```

`references/` remains evidence and must not be imported by production components. Approved facts are deliberately promoted into production content/data so review history is clear.

Secrets must never be placed in `public/`. Next development and generic static preview servers do not execute PHP and could serve a `.php` file as source. The recommended packaging boundary is therefore:

1. Build Next.js into `out/` on a machine with Node.
2. Copy reviewed, secret-free PHP handlers and `.htaccess` into a separate release-artifact directory.
3. Inject no secrets into that artifact; PHP reads server environment or protected configuration outside the document root.
4. Deploy only the assembled release artifact, not `node_modules`, `.next`, `references`, source files, or local environment files.

## Content and static route model

Production crawler permission is not page-publication permission. `robots.txt` may allow production crawling, but a route emits index/follow metadata only when the approved-route registry marks it `published` and `indexable: true`. Every other route emits noindex behavior. Staging overrides route publication and remains noindex/nofollow with crawling disallowed. Sitemap generation uses the same registry and includes only published, indexable entries with `sitemap: true`.

### Single-source data

Create strict types for at least:

- site identity and verified contact values
- navigation/footer links
- vehicles and vehicle filter facets
- articles and article categories
- FAQ entries and categories
- legal-page metadata
- form select options

Components must receive those values as props rather than repeating phone numbers, email addresses, prices, labels, or URLs across pages. All slugs must be explicit, stable, unique, lowercase, and validated during the build. A build must fail on duplicate slugs, missing required fields, invalid internal links, unapproved placeholder flags, or a detail record without its corresponding listing entry.

### Vehicle routes

The vehicle listing is static HTML at the approved `/arac-listesi/` path. Each approved vehicle receives a static detail route in the canonical `/araclar/[slug]/` family, implemented later as `app/araclar/[slug]/page.tsx`.

That route must:

- return every approved slug from `generateStaticParams()`
- set `dynamicParams = false`
- resolve the vehicle from local typed data
- generate unique title, description, canonical, and social metadata at build time
- call `notFound()` for an invalid build-time lookup
- show only approved availability and pricing information
- include a clear price/availability qualification where required
- link to the quote form with a stable, non-sensitive vehicle identifier

Vehicle filtering must not use the Server Component `searchParams` prop because it makes rendering request-dependent. Choose one of these approaches after the real inventory size is known:

1. Generate useful, indexable category routes for major categories and allow ordinary navigation between them.
2. Render the approved inventory in the initial HTML and add one small client filter island that reads local data or URL state.

The first approach is preferred where categories deserve search landing pages. The second is acceptable for purely presentational combinations. The unfiltered list and all vehicle detail links must remain usable with JavaScript disabled.

### Filo Rehberi routes

Use `/filo-rehberi/` for the index and `/filo-rehberi/[slug]/` for article details. Do not create a duplicate `/blog/` family. Category pages and pagination are generated only for approved content that exists. Each article detail route must enumerate its slug with `generateStaticParams()` and generate its metadata from the same record used for its body.

Article dates must be real ISO dates in data and human-readable Turkish dates in the UI. Tax, legal, financial, or regulatory claims require a source and content-owner approval. An updated date is shown only when a substantive reviewed update exists.

Do not implement fake pagination, client-only article bodies, or runtime search. Simple category navigation should use static links. If a later search feature is requested, it needs a separate static-search design and bundle review.

### FAQ and simple interactions

Render all approved FAQ answers in the initial document. Prefer native `<details>` and `<summary>` so keyboard, screen-reader, and no-JavaScript behavior are available without a React client bundle. Category filtering may use static anchors/routes or one bounded island if the content volume justifies it.

Prefer CSS scroll snap for horizontal card collections. Do not add an autoplay carousel library. Share actions should be ordinary links where possible; “copy link” may be a tiny optional client component with a visible status announcement.

## Implementation phases and exit criteria

### Phase 0 — close blocking decisions

Actions:

- reconcile unresolved category, result, notice, and utility routes and content while preserving all 12 approved route decisions
- mark every Stitch-only placeholder and unsupported page
- complete Gates 0–4 or identify exactly which later phase each unresolved item blocks
- approve the deployment artifact strategy
- approve the production visual direction where screens conflict

Exit criteria:

- no route is ambiguous
- customer login is recorded as excluded
- every public claim is approved or explicitly omitted
- assets have ownership status
- form and deployment owners are named

### Phase 1 — repository and build foundation

Actions:

- retain the required Next 16.2.11 export configuration
- make TypeScript enforcement unambiguous and add a dedicated typecheck command
- pin/document a build-time Node version compatible with Next 16.2.11
- replace the starter README with local build, static preview, artifact, PHP, and cPanel instructions
- define typed content/data contracts and build-time validation
- establish Tailwind v4 brand tokens for color, typography, spacing, radius, shadow, container width, and focus appearance
- install no dependency unless native HTML/CSS or a small local helper cannot meet the requirement

Exit criteria:

- lint, strict typecheck, and a clean static export pass
- route/data validation fails correctly on bad test data
- the export contains no runtime-server requirement
- the baseline browser JavaScript and asset sizes are recorded

### Phase 2 — assets, metadata, and shared shell

Actions:

- add licensed local fonts with Turkish glyph coverage
- convert approved imagery into responsive AVIF/WebP plus fallback assets
- build the skip link, header, primary navigation, mobile navigation, footer, breadcrumbs, CTA, layout container, and branded 404
- set `lang="tr"`
- add a metadata title template and verified site defaults
- create reusable accessible link, button, card, icon, picture, and form-field foundations

Exit criteria:

- header/footer are consistent at all audited viewports
- navigation works with keyboard and JavaScript disabled, except for a documented optional enhancement
- there are no placeholder links or external design-system dependencies
- all shared components have visible focus and valid landmarks/headings

### Phase 3 — core corporate pages

Implement in this order:

1. home
2. about/corporate
3. contact information page shell
4. FAQ content and question-answer behavior
5. approved legal pages

At this phase, forms may be visually present only on a non-production branch if Gate 3 is incomplete. They must not submit to a fake endpoint or display false success.

Exit criteria:

- each page matches the approved content matrix rather than the Stitch placeholders
- desktop and mobile layouts are both intentionally designed
- each route has a unique title, description, heading, and breadcrumb where appropriate
- internal navigation contains no dead destinations

### Phase 4 — vehicle portfolio

Actions:

- implement the typed vehicle repository
- implement reusable vehicle cards without nested interactive controls
- implement the static vehicle list and approved categories
- implement every approved vehicle detail route with `generateStaticParams()`
- add the smallest justified filter enhancement after the static experience works
- connect vehicle CTAs to the quote route; expose only the approved monthly KDV-excluded net list prices and no unapproved availability or offer conditions

Exit criteria:

- every vehicle card resolves to one generated detail page
- every generated detail page appears in the intended sitemap/listing
- filter controls are keyboard operable and preserve a no-JavaScript baseline
- image dimensions, responsive sources, alt decisions, and loading priority are reviewed

### Phase 5 — Filo Rehberi

Actions:

- implement typed article/category records
- implement featured and standard article cards from one consistent system
- generate only real category and pagination routes
- implement every article detail route with `generateStaticParams()`
- add article contents navigation, comparison-table treatment, tags, and related content only where supported by approved copy

Exit criteria:

- no fake article, category count, date, campaign, author, or pagination remains
- articles are readable without JavaScript
- tables and contents navigation work at narrow widths and with a keyboard
- claims and sources have content-owner approval

### Phase 6 — PHP forms

Implement only after Gate 3 passes. Use ordinary same-origin HTML forms with `method="post"` and dedicated PHP endpoints for the approved contact, quote, and newsletter workflows.

Each handler must:

- reject non-POST methods and unexpected content types
- enforce total body and per-field length limits
- validate required fields, email/phone formats, numeric ranges, and select values with allowlists
- normalize input and prevent CRLF/mail-header injection
- escape any value rendered into HTML
- verify required acknowledgement separately from optional marketing consent
- include a honeypot and approved, privacy-conscious rate limiting
- apply the approved Origin/Referer or CSRF strategy
- avoid logging message bodies or unnecessary personal data
- fail closed when mail/configuration is unavailable
- use Post/Redirect/Get to approved static success/error pages, or return an explicitly designed accessible response
- expose no credentials or stack traces

HTML forms must include real labels, correct control types, `autocomplete`, `inputmode` where helpful, instructions before controls, accessible required indicators, field-level descriptions, and a linked legal disclosure. Success/error pages or enhancements must announce status and guide focus. Client validation is supplementary; PHP validation is authoritative.

PHP source must contain no secret. Mail credentials and recipient configuration stay outside the webroot. Run `php -l` on every PHP file in the release pipeline. Test mail failure, injection strings, excessive input, invalid consent, repeated submissions, and direct endpoint access on staging.

Newsletter submission remains disabled or absent until the subscription lifecycle, commercial-message consent, double opt-in, unsubscribe, and retention process are approved. Do not silently turn a newsletter field into a generic email notification.

Exit criteria:

- valid and invalid form paths work without JavaScript
- no endpoint depends on Next.js runtime code
- the operational recipient confirms receipt and failure handling
- security/privacy review passes
- no database, CRM, or admin workflow was introduced

### Phase 7 — SEO and discoverability

Actions:

- add unique route metadata and a verified title template
- set canonical trailing-slash URLs against the verified origin `https://kalitefilo.com.tr`
- add local Open Graph/Twitter images
- generate a static sitemap from the same approved route data
- add a static robots policy
- add breadcrumbs and internal links
- add Organization/Article/Breadcrumb structured data only from verified facts
- mark form-result and other utility routes `noindex` and exclude them from the sitemap
- verify favicon and social previews

Do not add structured `Offer`, price, stock, rating, address, service-area, author, or organization fields unless the corresponding production fact is approved. Structured data must match visible content exactly.

Exit criteria:

- no page has starter metadata, duplicate titles, an unapproved canonical, or an orphaned route
- sitemap, robots, canonical URLs, Open Graph URLs, and trailing-slash behavior agree
- important content is present in exported HTML rather than only after hydration

### Phase 8 — Apache and release artifact

Create an Apache configuration for the assembled artifact, not Next server configuration. Subject to staging support, it should cover:

- `DirectoryIndex index.html`
- directory-style trailing-slash routes
- `ErrorDocument 404 /404.html`
- disabling MultiViews and directory listing where permitted
- preserve and test forced HTTPS and the canonical production origin `https://kalitefilo.com.tr` without redirect loops
- compression for text assets
- immutable caching for fingerprinted `/_next/static/` assets
- revalidation-oriented caching for HTML and unfingerprinted public assets
- MIME-type correctness for scripts, styles, fonts, images, JSON, XML, and exported Next route payloads
- reviewed security headers
- exclusion of PHP POST endpoints and result redirects from inappropriate caching
- denial of access to environment, config, backup, source-map, and source-only files if any could reach the document root

Do not enable HSTS until HTTPS and all intended subdomains are confirmed. Build the content-security policy from the final asset/form inventory and test it against the generated Next HTML; do not paste a generic policy that breaks required inline framework scripts.

The build and deployment pipeline must run outside production:

1. Use the pinned Node version.
2. Run `npm ci`.
3. Run lint and strict typecheck.
4. Run the clean Next static export.
5. Validate routes, links, assets, metadata, and forbidden patterns.
6. Run PHP syntax/security checks.
7. Assemble `out/`, `.htaccess`, and PHP handlers into a versioned release artifact.
8. Record a checksum and retain the last known-good artifact.
9. Deploy to staging and run Apache/PHP smoke tests.
10. Deploy with the safest atomic or recoverable mechanism the host supports.

Choose one deployment mechanism at Gate 4. In either case, deploy to the configured staging document root before production:

- preferred: CI or a controlled build machine uploads a versioned artifact over SSH/SFTP
- acceptable: a dedicated generated deployment branch containing only the artifact and cPanel deployment instructions

Do not run `npm install`, `next build`, or `next start` on production. Do not deploy the source branch and assume ignored `out/` files will appear.

Exit criteria:

- direct requests to every nested route resolve through Apache
- missing routes return the branded 404 with an actual 404 status
- PHP executes and is never downloaded as source
- HTTPS/canonical redirects have no loop
- cache, compression, and security headers match their intended file classes
- rollback is tested

## Minimal client-side JavaScript policy

The allowed client-island candidates are:

- a mobile navigation disclosure only if semantic HTML/CSS cannot meet the approved behavior
- vehicle or FAQ filter controls when static routes/native disclosure are insufficient
- an optional copy-link control
- optional progressive form feedback, provided native POST remains complete

Everything else should remain a Server Component or native element. In particular:

- header/footer markup is not a global Client Component
- FAQ disclosure does not require React state
- article and vehicle cards do not require React state
- forms do not require Server Actions or a client form library
- card rows do not require a carousel library
- content does not require client fetching

Each proposed Client Component must document why native HTML/CSS is insufficient, its imported dependencies, its JavaScript cost, keyboard behavior, and no-JavaScript fallback. Adding a new browser dependency requires a bundle and privacy review.

## Accessibility acceptance criteria

Target WCAG 2.2 AA for the implemented public experience. Automated linting is necessary but not sufficient.

Every release candidate must demonstrate:

- correct `lang="tr"`, page titles, landmarks, one clear `h1`, and logical headings
- a working skip link
- complete keyboard operation and visible focus
- no keyboard trap in navigation, filters, FAQ, tables, or forms
- accessible names for icon-only controls and `aria-hidden` on decorative icons
- no information conveyed by color alone
- approved contrast in default, hover, focus, disabled, and error states
- usable reflow at 320 CSS pixels and at 200%/400% zoom as applicable
- reduced-motion behavior for non-essential animation
- no forced autoplay or inaccessible carousel
- descriptive alt text for informative images and empty alt text for decorative images
- form labels, instructions, error association, status announcements, and focus recovery
- table captions/headers and a labelled keyboard-accessible overflow region on narrow screens
- meaningful link text and no nested links/buttons in cards

Run automated axe checks and Lighthouse accessibility checks, then complete manual keyboard, zoom/reflow, screen-reader, and motion/contrast review. Document any accepted exception with an owner and remediation date; no known critical or serious issue may ship.

## QA and release gates

### Architecture gate

Fail the release if source or output contains:

- `use server`, Server Actions, runtime route handlers, Pages API routes
- Middleware or Proxy
- cookies/headers/request-dependent server rendering
- ISR/revalidation configuration
- database, ORM, authentication, portal, CRM, or admin dependencies
- dynamic route pages without complete `generateStaticParams()` coverage
- a production requirement for Node.js

### Content gate

Fail the release for:

- placeholder links, `#` CTAs, lorem/example values, starter assets, or TODO copy visible to users
- unverified contact/legal/company data
- unsupported quantitative claims
- duplicated or contradictory vehicle/article records
- unapproved images or remote design-evidence URLs
- fake pricing, availability, dates, authors, pagination, or campaigns

### Static-output gate

Verify after a clean build:

- every inventory route exists as HTML in the artifact
- every internal link resolves and uses the canonical slash form
- sitemap entries match generated public pages
- 404 and utility-page behavior is correct
- no remote font, icon, Tailwind, or Stitch image dependency remains
- HTML contains essential page content and metadata
- responsive images have dimensions and correct loading priority
- JavaScript/CSS/image totals are recorded and reviewed against the baseline

### Browser and responsive gate

Test at minimum narrow mobile, common mobile, tablet, desktop, and wide desktop widths, including the widths recorded in the responsive audit. Cover current Chrome, Firefox, Safari/WebKit, and mobile touch behavior available to the team. Check long Turkish labels, form errors, large text, landscape orientation, slow network, JavaScript disabled, and missing-image behavior.

### PHP and Apache gate

On the configured staging origin `https://staging.kalitefilo.com.tr`, using its separate document root and the verified hosting stack, test:

- valid, invalid, malicious, oversized, repeated, and bot-like submissions
- consent combinations and mail-delivery failure
- HTTPS and canonical redirects
- direct nested-route loads and refreshes
- correct 404 status
- caching/compression/security headers
- PHP execution and protection of secrets/source/configuration
- deploy rollback

### Final approval gate

Release requires named approval for:

- content and vehicle inventory
- legal/privacy/consent text
- image and font rights
- form recipients and mail flow
- responsive visual comparison
- accessibility review
- SEO metadata and canonical-URL output against the verified production origin
- hosting/deployment/rollback verification

## Implementation order

1. Preserve the verified production/staging context and all 12 approved route decisions; approve the remaining category, result, notice, and utility route matrix and close company identity, content, asset, legal/form, mail, deployment, and rollback prerequisites in Gates 0–4.
2. Lock the static architecture, typed content contracts, build validation, Node build version, Tailwind v4 tokens, and artifact strategy.
3. Replace starter assets and build the Turkish metadata foundation, shared shell, navigation, footer, breadcrumbs, accessibility primitives, and branded 404.
4. Implement the home, about, contact-information, FAQ, and approved legal pages using only verified content.
5. Implement the typed vehicle inventory, static list/category experience, and all vehicle detail pages with complete `generateStaticParams()` coverage.
6. Implement the typed Filo Rehberi index at `/filo-rehberi/`, real category/pagination routes, and all `/filo-rehberi/[slug]/` article pages with complete `generateStaticParams()` coverage.
7. Add only the approved, measured client islands for mobile navigation, filtering, or copy-link behavior; preserve the no-JavaScript baseline.
8. Implement and security-test the PHP contact, quote, and—only if fully approved—newsletter workflows without a database, CRM, Server Actions, or Next API routes.
9. Complete per-route SEO, sitemap, robots, structured data from verified facts, static result-page indexing rules, and social assets.
10. Assemble `.htaccess`, PHP, and the Next `out/` files into a versioned artifact; validate it at `https://staging.kalitefilo.com.tr` in the separate staging document root.
11. Run all architecture, content, static-output, browser, responsive, accessibility, SEO, PHP, Apache, and rollback gates.
12. Obtain final named approvals, deploy the tested artifact, verify production smoke checks, and stop Phase 1 without adding customer login, authentication, portal, database, ORM, CRM, or admin features.
