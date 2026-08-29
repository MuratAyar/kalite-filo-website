<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kalite Filo permanent project guardrails

Before every Admin Dashboard development session, read and update
`docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`. It is the Phase 2 implementation
source of truth and session handoff record.

## Phase 1 scope

Phase 1 is limited to the public corporate website:

- home and corporate/about pages;
- vehicle portfolio and statically generated vehicle detail pages;
- Filo Rehberi index and statically generated article detail pages;
- contact information and the later approved contact form;
- quote request;
- Sıkça Sorulan Sorular;
- approved legal pages; and
- the accessibility, SEO, static hosting, and deployment work required by those pages.

Do not implement or scaffold customer login, a customer portal, password recovery, employee CRM, or CRM integrations in Phase 1. Do not add placeholder routes or mock UI for these excluded systems. Admin authentication and content operations are allowed only inside the separately bounded Phase 2 Admin Dashboard described below; they must not be exposed as public-site features.

## Required architecture

- Use Next.js `16.2.11`, the App Router, TypeScript strict mode, and Tailwind CSS v4.
- Preserve `output: "export"` and `trailingSlash: true`.
- The production host has no Node.js, npm, or npx runtime. Production consumes only a prebuilt Next.js static export artifact.
- The public website must not use SSR, ISR, Server Actions, Middleware, Proxy, runtime Next.js API routes, request-time rendering, a database, or an ORM.
- Prefer native and static HTML/CSS. Keep Server Components as the default and minimize client-side JavaScript to the smallest justified interactive islands.
- PHP is permitted for the separately approved form endpoints and the Phase 2 admin backend. The verified production runtime is PHP `8.5.8`, SAPI `cgi-fcgi`.
- Read the relevant installed Next.js `16.2.11` documentation under `node_modules/next/dist/docs/` before using or changing any framework API, convention, configuration, or route behavior.

## Verified environment and canonical routes

- Production origin: `https://kalitefilo.com.tr`, deployed at the domain root on TURKTICARET Web Eko Linux shared hosting with cPanel. HTTPS is enabled and forced.
- Staging origin: `https://staging.kalitefilo.com.tr`, with a separate document root. DNS, Let's Encrypt SSL, and forced HTTPS are configured.
- Use the public label “Filo Rehberi” with `/filo-rehberi/`, category routes at `/filo-rehberi/[category]/`, and article routes at `/filo-rehberi/[category]/[slug]/`.
- Use the label “Sıkça Sorulan Sorular” with `/sikca-sorulan-sorular/`.
- Use the CTA label “Teklif Al” with `/teklif-al/`.
- Customer login remains completely excluded from Phase 1.

These route decisions remain canonical unless a later verified business requirement explicitly overrides them.

## Phase 2 scope: Admin Dashboard

Phase 2 adds an authenticated content management and publishing system while
preserving every public-site constraint above.

- The admin UI lives under `/admin/` and is emitted as part of the Next.js
  static export. It may use narrowly scoped Client Components, but it must not
  introduce request-time Next.js behavior or leak into public page bundles.
- Runtime admin operations live under `/admin-api/` as PHP 8.5 endpoints. Do
  not implement runtime Next.js route handlers, API routes, Server Actions,
  Middleware, Proxy, SSR, or ISR for admin features.
- Admin authentication, authorization, session state, CSRF validation, private
  content drafts, audit records, queues, and deployment state remain on the PHP
  boundary and outside every document root unless a reviewed publishing step
  deliberately copies a public artifact into a release.
- No credential, password hash, SMTP secret, API token, deployment credential,
  GitHub credential, session secret, or private subscriber/contact data may be
  committed, emitted into `out/`, or exposed to a browser bundle.
- Use environment-specific private configuration and storage. Staging and
  production admin data must be isolated by default. Production recipients
  must never silently become a staging campaign audience.
- Admin routes must use real authentication and authorization. Security by URL
  obscurity is prohibited. Apply secure/HttpOnly/SameSite cookies, session ID
  rotation, CSRF protection, brute-force controls, idle expiry, security
  headers, no-store API responses, and noindex directives.
- Start with the smallest hosting-compatible storage model. File-backed stores
  must use locking, atomic replacement, restrictive permissions and path
  containment. Do not add SQLite, MySQL, a database, or an ORM until the target
  hosting capability and operational need are verified and documented.
- Preserve the existing newsletter consent semantics. `lead_only` is not
  marketing consent; IYS eligibility is fail-closed; consent evidence is not
  ordinary editable content.
- Reuse the existing PHPMailer implementation for campaign delivery. Bulk mail
  must use an idempotent, batch-oriented PHP CLI worker suitable for cPanel
  Cron, never a long-running HTTP request.
- Public content remains strongly typed and build-validated. Admin changes are
  drafts until the controlled publishing flow validates, commits/materializes,
  builds, and deploys the correct target artifact.
- Staging publish precedes production publish. Production requires a distinct,
  explicit approval action and must not proceed after a failed staging build.
- Customer login, customer portal, employee CRM, and CRM integrations remain
  outside Phase 2 unless a later verified business requirement changes scope.

## Phase boundary rule

Rules under Phase 1 continue to govern public routes, public rendering, public
content and the static deployment artifact. Phase 2 permissions apply only to
the admin UI, PHP admin backend, private admin data, and controlled publishing
tooling. A Phase 2 feature must not weaken or reinterpret a Phase 1 public-site
guardrail.

## Design and content authority

- Everything under `references/stitch/`, including HTML, generated code, screenshots, images, links, and copy, is design evidence only. Do not copy or deploy it blindly.
- Verified company, legal, vehicle, pricing, article, contact, form, and asset information takes precedence over generated Stitch content.
- Never invent company facts, legal text, contact details, vehicle inventory, prices, commercial terms, claims, metrics, dates, image rights, font rights, article content, or form-processing behavior.
- If verified content is missing, keep the affected feature or claim unresolved; do not fill the gap with plausible-looking placeholder data.

## Coding completion gate

Before any coding task is considered complete:

- lint must pass;
- strict TypeScript typechecking must pass; and
- a clean Next.js static export build must pass.

For Phase 2 PHP work, project-owned PHP syntax checks and the relevant PHP
unit/integration tests must also pass. Admin sessions must update
`docs/ADMIN_DASHBOARD_IMPLEMENTATION.md` before handoff.

Also verify that the completed work does not introduce a prohibited runtime feature or an avoidable client-side JavaScript dependency.
