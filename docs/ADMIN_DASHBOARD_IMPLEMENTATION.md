# Kalite Filo Admin Dashboard Implementation

Last updated: 2026-08-29

This document is the single source of truth for Phase 2 Admin Dashboard work.
Every admin development session must read it before making changes and update
the status and handoff sections before ending.

## Current Status

Phase 0 repository audit and architecture definition are complete. Phase 1 is
implemented and validated locally: the secure PHP authentication boundary,
static admin entry shell, release packaging, and automated tests pass. Phase 1
remains open until the private Owner configuration and PHP session/cookie/header
behavior are verified on the real staging host. No content mutation, subscriber
mutation, campaign delivery, or publishing action is enabled. The public site
remains a Next.js 16.2.11 static export.

The `/admin/` unauthenticated state now uses the approved Kalite Filo logo,
existing `fleet-campus.jpg` asset and production design tokens in a dedicated
full-screen admin login composition. If PHP is unavailable under `next dev`, the
form remains visible with an honest environment notice instead of replacing the
page with a service-error screen.

The login card was subsequently simplified by removing its decorative top rule,
the top-right management badge, marketing-style heading/supporting copy, and
the environment footer/divider. The submit button is now the card's final
visible element.

## Architecture

The system has four deliberately separate layers:

1. **Public site:** existing App Router Server Components rendered at build time
   into `out/`; no Node.js production runtime and no runtime Next.js APIs.
2. **Admin UI:** a secrets-free static application under `/admin/`. Only admin
   routes load its Client Components. Authentication and data are fetched from
   same-origin PHP endpoints and never embedded in the static HTML.
3. **Admin backend:** PHP 8.5 endpoints under `/admin-api/` for authentication,
   authorization, validation, private storage, audit, queues, and publish
   orchestration. APIs use JSON, same-origin checks, CSRF for state changes,
   no-store responses, and role checks.
4. **Build/publish runner:** Node/npm remains off-host. A controlled external
   runner materializes an approved content snapshot into the repository, runs
   the existing validators and `release:*` scripts, and deploys the resulting
   target artifact. The exact CI trigger and credentials remain an open hosting
   decision; PHP must not reimplement the Next.js build.

### Architecture Decision AD-001: hybrid private drafts + Git-backed releases

**Decision:** use an environment-specific private file-backed draft workspace
on cPanel, while keeping the repository and its commits as the canonical record
of published public content.

**Why:** the current public build consumes strongly typed JSON/TS/Markdown and
local media. Git provides reviewable history and rollback, while cPanel has no
Node/npm runtime and therefore cannot turn admin changes into the static site.
A private-only canonical store fetched during build would add availability,
authentication, schema-drift, and reproducibility risks to every build. Direct
editing of deployed files would bypass validation and make rollback unreliable.

**Publishing contract:** admin saves normalized drafts and immutable revisions
outside the web root. A publish request freezes a deterministic snapshot and
manifest. A separately authorized runner imports that snapshot into the known
repository contracts, runs generation/validation/tests/build/release, commits
the content change, and deploys the target artifact. Staging success is recorded
before production can be requested. Until runner transport and credentials are
verified, publishing stays disabled rather than simulated.

### Architecture Decision AD-002: no database in the initial implementation

The verified production capability is PHP 8.5.8 `cgi-fcgi`; PDO SQLite, SQLite,
MySQL provisioning, and Git availability have not been verified. The local PHP
8.5.9 installation also has PDO but no PDO drivers. Initial stores therefore use
versioned JSON/JSONL/CSV files with advisory locks, atomic replacement,
restrictive permissions, explicit schemas, and bounded reads. Revisit SQLite
only after production extension, backup, concurrency, and migration behavior
are verified. No ORM is planned.

## Hosting Constraints

- Production: `https://kalitefilo.com.tr`, domain-root cPanel document root.
- Staging: `https://staging.kalitefilo.com.tr`, separate document root.
- HTTPS is enabled and forced on both origins.
- Production runs PHP 8.5.8 as `cgi-fcgi`; it has no Node.js, npm, or npx.
- Each target receives a target-specific prebuilt static artifact plus reviewed
  PHP runtime files. Composer installation occurs on the build/release machine.
- SMTP and admin configuration live outside all document roots.
- Staging private admin storage and production private admin storage are separate
  roots. Shared media/content must move only through an explicit publish snapshot.
- Production newsletter/contact data is not copied into staging. Synthetic or
  allowlisted test recipients are required for staging campaigns.
- Apache header and directory-listing behavior still requires staging proof.
  PHP endpoints set their own headers; static `/admin/` contains no private data.

Proposed private layout (account paths are illustrative, never hard-coded):

```text
<account-home>/private/kalite-filo-admin/
  staging/config.php
  staging/data/{drafts,revisions,audit,rate-limits,queues,publish,media}/
  production/config.php
  production/data/{drafts,revisions,audit,rate-limits,queues,publish,media}/
<account-home>/private/kalite-filo-data/newsletter-contacts.csv
```

## Security Model

- Default deny: unauthenticated API calls return a generic 401; unauthorized
  roles return 403; unknown or unconfigured hosts fail closed.
- TLS-only `__Host-` session cookie with `Secure`, `HttpOnly`, `SameSite=Strict`,
  path `/`, no Domain attribute, strict session mode and cookies-only sessions.
- Session ID rotates after login and periodically. Idle timeout is 30 minutes;
  absolute timeout is 8 hours. Logout destroys server state and expires cookie.
- Synchronizer CSRF token is issued in the session. Every state-changing request
  requires the token and an exact allowed `Origin`; login is CSRF-protected too.
- Login throttling uses private, locked rate-limit records keyed by hashed IP and
  normalized username. Responses do not reveal whether the username exists.
- Admin API access is not restricted by client IP. Authentication, CSRF, secure
  sessions, login throttling and audit logging apply to every source address.
- Passwords are verified with `password_verify`; only a strong hash exists in
  private environment config. No credential or hash belongs in Git.
- JSON bodies have explicit size/type limits. Inputs are schema validated.
- PHP API responses set no-store, noindex, nosniff, frame denial, restrictive
  referrer/permissions policy, and a restrictive Content Security Policy.
- Markdown is untrusted stored input. Preview and public rendering must use an
  allowlisted parser/renderer and prevent raw HTML/script execution.
- Uploads are stored outside the web root until validated by server-derived file
  signature, dimensions, size, extension, filename, and contained destination.
- CSV downloads neutralize spreadsheet formula prefixes. Logs omit passwords,
  tokens, full secrets, SMTP content, and unnecessary personal data.
- Admin HTML has noindex metadata and `robots.txt` disallows `/admin/` and
  `/admin-api/`. Sensitive API responses are never cacheable.

## Authentication Model

Initial identity source is one Owner account in the target-specific private PHP
config. The schema is role-ready without implementing multi-user management:

```php
return [
  'environment' => 'staging',
  'users' => [[
    'id' => 'owner',
    'username' => '...',
    'display_name' => '...',
    'password_hash' => '...',
    'role' => 'owner',
    'enabled' => true,
  ]],
];
```

Supported role vocabulary: `owner`, `admin`, `editor`, `marketing`,
`read_only`. Permission checks will be capability-based. Owner is initially the
only provisioned role; there is no public registration, reset, or invitation.

Authentication flow:

1. Static admin app calls `GET /admin-api/session.php` and receives a CSRF token
   plus the current authentication state.
2. Login posts username/password with the session CSRF token.
3. Backend applies host/origin, rate-limit, account state and password checks,
   rotates the session ID, stores only safe identity fields, and writes audit.
4. Authenticated API requests use the session cookie; state changes also require
   CSRF. Logout invalidates the session.

## Admin Route Map

All routes are static UI entry points. Only `/admin/` is introduced in Phase 1;
later routes remain checklist items, not placeholder pages.

| Route | Purpose | Phase |
| --- | --- | ---: |
| `/admin/` | Login gate and operational dashboard | 1–2 |
| `/admin/araclar/` | Vehicle list, filters and CRUD | 3 |
| `/admin/araclar/yeni/` | Vehicle creation | 3 |
| `/admin/araclar/[id]/` | Vehicle editor | 3 |
| `/admin/one-cikan-araclar/` | Exactly four ordered featured vehicles | 3 |
| `/admin/filo-rehberi/` | Article list and translation completeness | 4 |
| `/admin/filo-rehberi/yeni/` | Article creation | 4 |
| `/admin/filo-rehberi/[id]/` | TR/EN Markdown editor and preview | 4 |
| `/admin/medya/` | Media library and rights metadata | 4 |
| `/admin/bulten-kisileri/` | Contacts, consent and suppression views | 5 |
| `/admin/iys/` | IYS pending/failed/synced and exports | 5 |
| `/admin/kampanyalar/` | Campaign list and send history | 6 |
| `/admin/kampanyalar/yeni/` | Campaign composer | 6 |
| `/admin/kampanyalar/[id]/` | Campaign editor, preview and status | 6 |
| `/admin/yayinlama/` | Change set and staging/production publish | 7–8 |
| `/admin/talepler/` | Quote/contact request inbox | 9 |
| `/admin/ayarlar/` | Strongly typed operational site settings | 9 |
| `/admin/denetim-kaydi/` | Audit log view | 2 |

## Admin API Route Map

PHP endpoints use the `.php` suffix because Apache rewrite support is not yet a
verified dependency. Client code uses a central route map so this can change
only after staging proof.

| Method and route | Capability / purpose | Phase |
| --- | --- | ---: |
| `GET /admin-api/session.php` | Session state and CSRF bootstrap | 1 |
| `POST /admin-api/login.php` | Rate-limited authentication | 1 |
| `POST /admin-api/logout.php` | CSRF-protected logout | 1 |
| `GET /admin-api/dashboard.php` | Aggregates and recent failures/activity | 2 |
| `GET /admin-api/audit.php` | Paginated safe audit view | 2 |
| `GET,POST /admin-api/vehicles.php` | Vehicle list/create | 3 |
| `GET,PATCH /admin-api/vehicle.php?id=` | Vehicle read/update/archive | 3 |
| `GET,PUT /admin-api/featured-vehicles.php` | Four-item ordered invariant | 3 |
| `GET,POST /admin-api/articles.php` | Article list/create | 4 |
| `GET,PATCH /admin-api/article.php?id=` | Localized article update | 4 |
| `POST /admin-api/article-preview.php` | Sanitized Markdown preview | 4 |
| `GET,POST /admin-api/media.php` | Media list/upload metadata | 4 |
| `GET /admin-api/media-file.php?id=` | Authorized private preview | 4 |
| `GET /admin-api/subscribers.php` | Filtered contact view | 5 |
| `POST /admin-api/subscriber-operation.php` | Explicit audited status operation | 5 |
| `GET /admin-api/iys.php` | State and export history | 5 |
| `POST /admin-api/iys-export.php` | Generate export | 5 |
| `GET /admin-api/iys-download.php?id=` | Authorized CSV download | 5 |
| `GET,POST /admin-api/campaigns.php` | Campaign list/create | 6 |
| `GET,PATCH /admin-api/campaign.php?id=` | Campaign edit/read | 6 |
| `POST /admin-api/campaign-test.php` | Allowlisted test mail | 6 |
| `POST /admin-api/campaign-queue.php` | Freeze audience and queue send | 6 |
| `GET /admin-api/publishing.php` | Change set and publish history | 7 |
| `POST /admin-api/publish-staging.php` | Validate/freeze staging request | 7 |
| `POST /admin-api/publish-production.php` | Explicit approved production request | 8 |
| `POST /admin-api/rollback.php` | Explicit version rollback request | 8 |
| `GET,PATCH /admin-api/requests.php` | Private request inbox | 9 |
| `GET,PATCH /admin-api/settings.php` | Typed settings | 9 |

## Content Model

Admin presents logical entities while adapters preserve existing build inputs.
Draft schemas carry `schemaVersion`, stable ID, locale variants, revision,
status, timestamps, and actor ID. Publication adapters, not the UI, materialize
repository files. Missing English content remains explicitly incomplete and is
never auto-invented. Legal content uses a separate high-approval workflow.

## Vehicle Management Model

The logical Vehicle joins `src/data/vehicle-portfolio.json`,
`src/data/vehicle-list-prices.json`, and the typed media/licence mapping currently
in `src/data/vehicle-portfolio.ts`. Existing 32-record IDs/source IDs and price
meaning remain authoritative. Phase 3 will define a normalized, generator-owned
media metadata source to remove hand-edited TS without weakening types.

Fields include the supplied identity, labels, power/seats, slug, summary,
features, priority, source/content/price states, monthly list-net price, media,
licence and future SEO fields. Archive/unpublish is a status transition, not a
destructive delete. Price and factual state changes receive revisions and audit.

Featured order becomes an explicit four-ID contract (proposed
`src/data/featured-vehicle-ids.json`). Publication fails unless it contains four
unique, active, publishable vehicles with rights-cleared covers. Homepage code
will consume that order while keeping exactly four cards and current rendering.

## Filo Rehberi Management Model

Current Turkish metadata is generated from 18 Markdown frontmatter files into
`article-records.json`. English route metadata currently lives in a separate TS
mapping and English bodies use `*-en.md`. Phase 4 will introduce a normalized
localized article manifest and deterministic generator compatible with the same
TR `/filo-rehberi/[category]/[slug]/` and EN `/en/fleet-guide/...` routes.

Editor fields: title, slug, category, excerpt, cover/alt, status, dates, reading
minutes, featured, SEO title/description, Markdown body, sources and locale.
Preview is sanitized and raw HTML is disabled. Translation completeness is a
recorded state; no fallback pretends Turkish copy is approved English copy.

## Media Management Model

Draft uploads live in an environment-specific private media directory. Metadata:
stable ID, original/safe filename, byte size, server-detected MIME, width,
height, alt by locale, usage, creator, source page, licence name/URL, upload time,
uploader, checksum and status. Publication copies immutable/checksummed variants
to approved `public/images/...` paths through the runner. Existing vehicle
licence provenance is migrated, not discarded.

Allowed types and limits will be explicit after current asset dimensions and
hosting upload limits are reviewed. Validation uses `finfo`/image parsing when
verified, never client MIME alone. Paths are generated, resolved, containment-
checked, and never derived directly from user path fragments.

## Newsletter / Subscriber Model

`newsletter-contacts.csv` remains the initial authoritative contact/consent
store with columns: `id`, `email`, `status`, `consent_source`,
`consent_text_version`, `consent_at`, `confirmed_at`, `unsubscribed_at`,
`created_at`, `updated_at`, `iys_status`, `iys_synced_at`, `recipient_type`.

`lead_only` and `not_requested` never imply marketing eligibility. Consent
evidence is read-only in normal CRUD. Any correction is a named operation with
reason, before/after summary, role authorization and audit. Campaign audience
calculation is fail-closed and excludes unsubscribed, missing/invalid consent,
unapproved IYS state, suppressed, staging-forbidden, or malformed recipients.

## IYS Model

The existing CLI exporter, daily state file, CSV schema and manual portal upload
remain authoritative. Admin adds visibility, generation and controlled download,
not an invented portal API. Export files and result imports are private and
audited. `pending`, `failed`, and verified `synced` are distinct; CSV creation is
not synchronization. Portal template/enums must be reverified before live use.

## Mail Campaign Model

Campaign fields: ID, name, subject, preheader, structured content blocks,
rendered preview, status, timestamps, audience definition/snapshot, and
statistics. Statuses: `draft`, `queued`, `sending`, `completed`,
`partially_failed`, `cancelled`.

Supported planned blocks: hero, text, CTA, vehicle cards, Filo Rehberi cards,
divider and mandatory footer/unsubscribe. Blocks reference frozen published
entities, not mutable live arrays. Test mail is limited to configured recipients.
Final preview and current eligibility summary precede queue creation.

## Publishing Model

States: draft changes → validated snapshot → staging requested → staging built →
staging deployed/verified → production approved → production built → production
deployed/verified. Each transition has an immutable ID, actor, content checksum,
target, timestamps, result and safe logs. Production requires the exact snapshot
that passed staging; a changed snapshot must return to staging.

Existing `npm run build:staging`, `npm run build`, `release:staging`, and
`release:production` remain the only build/release entry points. The future CI
workflow calls these commands; it does not duplicate them. Required secret names
will be documented only when transport is selected. No secret values are stored.

## Staging Deployment Model

Staging is the first enabled publish target. Its static build bakes the staging
origin and global noindex policy into the artifact. Admin config/data, campaign
test recipients, deploy destination and audit are staging-specific. A runner
uploads `release/staging/` to the staging document root and reports a signed or
authenticated result to the private publish record. Smoke checks must pass before
the snapshot becomes production-eligible.

## Production Deployment Model

Production publish is disabled until staging workflow, target isolation,
credentials, rollback and approval UX are verified. It requires Owner/Admin
capability, typed confirmation, recent authentication, exact staging-approved
snapshot checksum, and no failed validation/deployment. The runner builds with
the production target and deploys `release/production/` only. Credentials are
environment/CI secrets, never browser or repository values.

## Audit Log Model

Append-only JSONL records in private environment storage initially contain:
event ID, UTC timestamp, admin ID/role, action, entity type/ID, safe change
summary, request correlation ID, result and optional non-sensitive error code.
Critical events include authentication, content/consent/IYS/campaign changes,
publishes and rollback. Integrity hardening (hash chaining or off-host copy) is
an open decision before production operations. Log retention and export access
must be approved before personal-data operations launch.

## Backup / Recovery Model

- Published content and release history: Git commits/tags plus retained release
  artifacts; rollback rebuilds a known commit/snapshot.
- Private drafts/audit/queues: cPanel account-private backup plus periodic
  encrypted off-host backup once destination and retention are approved.
- Subscriber data: existing private data directory must be included explicitly
  in cPanel backups; releases never overwrite it.
- File writes: lock, temporary sibling, fsync/flush where available, atomic
  rename, `0600` files/`0700` directories.
- Recovery drills and RPO/RTO remain open business decisions. A backup is not
  considered operational until restore is tested on staging.

## Implementation Phases

- [x] **Phase 0:** repository audit, Phase 2 guardrails and architecture record
- [ ] **Phase 1:** authentication, secure PHP foundation and admin shell/layout
  - [x] Audit Next.js 16.2.11 static export/layout/route-group documentation
  - [x] Add private-config contract and secure session/auth helpers
  - [x] Add session, login and logout PHP endpoints
  - [x] Add static `/admin/` login gate and authenticated shell
  - [x] Package `/admin-api/` in target releases without secrets/tests
  - [x] Add PHP auth and release integration tests
  - [ ] Verify private Owner config and auth behavior on HTTPS staging
- [ ] **Phase 2:** dashboard and read-only operational views
- [ ] **Phase 3:** vehicle CRUD, price management and Featured Vehicles
- [ ] **Phase 4:** Filo Rehberi CMS, TR/EN management and Media Library
- [ ] **Phase 5:** Newsletter Contacts, IYS and unsubscribe infrastructure
- [ ] **Phase 6:** campaign composer, queue, cron worker and history
- [ ] **Phase 7:** content/Git bridge, staging publish and deployment status
- [ ] **Phase 8:** production publish, rollback and version history
- [ ] **Phase 9:** request inbox, Site Settings and remaining operations
- [ ] **Phase 10:** security/accessibility/responsive audit and full regression

## Completed Tasks

- [x] Audited project guardrails, design contract, README, package/config,
  App Router structure, content types/data/loaders/validators, PHP form and SMTP
  boundary, subscriber store, IYS exporter, tests, release scripts and docs.
- [x] Confirmed public runtime remains static export with separate PHP files.
- [x] Confirmed 32 joined vehicle records, separate 32-price source, exactly four
  featured records selected by boolean/source order, and licence metadata in TS.
- [x] Confirmed 18 Turkish article records generated from Markdown and separate
  English TS metadata/Markdown bodies.
- [x] Confirmed `lead_only`/`approved` and `not_requested`/`pending` consent/IYS
  semantics, atomic CSV writes, manual IYS CSV flow, and PHPMailer reuse boundary.
- [x] Recorded hybrid draft/Git publishing decision and no-database decision.
- [x] Updated `AGENTS.md` with explicit Phase 1/Phase 2 boundaries.
- [x] Defined admin UI/API route maps, security/authentication, storage,
  publishing, deployment, audit, backup and phase checklists.
- [x] Implemented environment-bound private admin config with document-root
  exclusion, role-ready Owner identity schema, and separate staging/production
  defaults.
- [x] Implemented private session storage, Secure/HttpOnly/SameSite Strict
  cookie, ID rotation, idle/absolute expiry, CSRF, same-origin POST validation,
  login throttling, logout, safe security headers and authentication audit.
- [x] Implemented the secrets-free responsive `/admin/` login gate and honest
  authenticated Phase 1 shell as an admin-only Client Component.
- [x] Reconciled the supplied Stitch customer-login evidence into a dedicated
  admin login view using only approved local logo/image assets and existing
  design tokens; public header/footer and generated remote dependencies were
  deliberately excluded.
- [x] Kept the login form visible when PHP is absent in `next dev`, with a
  non-blocking explanation that real authentication runs in the PHP release.
- [x] Removed the temporary client-IP allowlist requirement by explicit owner
  decision; admin endpoints accept all source IPs while retaining authentication,
  CSRF, secure sessions, login throttling and audit logging.
- [x] Simplified the admin login card by removing decorative and redundant UI
  details while preserving its accessible section label.
- [x] Added noindex metadata, production robots exclusions, export validation,
  explicit `/admin-api/` release packaging and secret/config release guards.
- [x] Added authentication foundation and release integration tests without
  adding a database, ORM, runtime Next.js feature, or new dependency.

## Current Task

Deploy the bounded Phase 1 foundation to the HTTPS staging host with a real
private Owner config including the requested temporary account, then verify
session persistence, cookie/header flags,
CSRF, rate limiting, expiry, logout, permissions and environment isolation.
Do not begin CRUD, campaigns or publishing before this proof is recorded.

## Next Tasks

- [ ] Deploy Phase 1 to staging with a real private Owner password hash/config.
- [ ] Verify cPanel session persistence, cookie flags, origin/host behavior,
  response headers, rate-limit file permissions and logout in browser/devtools.
- [ ] Verify whether Apache can apply no-store headers to static `/admin/` and
  disable directory listing without interfering with cPanel HTTPS rules.
- [ ] Begin Phase 2 dashboard/read-only adapters only after staging auth proof.

## Known Issues

- Production PHP extension list is not available; SQLite and `finfo` cannot be
  assumed. Local PHP has PDO but reports no PDO drivers.
- Apache rules/security headers for static admin HTML are not yet staging-tested.
- The public route registry currently describes Phase 1 routes only; admin stays
  deliberately outside sitemap/navigation contracts.
- Current article generation is Turkish-centric and English metadata is TS code;
  this needs a controlled Phase 4 migration.
- Current featured vehicle order is implicit (`featured` plus JSON order).
- Existing newsletter CSV permits multiple rows per email/source; audience
  eligibility needs a tested cross-row resolution policy before campaigns.

## Open Decisions

- CI provider/runner location and authenticated publish-request transport.
- Deployment transport and secret names for staging/production.
- Verified production PHP modules (`fileinfo`, image functions, PDO drivers) and
  cPanel Cron PHP CLI path/environment handling.
- Admin hostname policy: same `/admin/` path on both origins is planned; an
  additional network restriction may be added after operational review.
- Audit retention/integrity copy, private-data retention, backup destination,
  RPO/RTO and restore owner.
- IYS portal's current CSV template/enums and result-import process.
- Marketing eligibility rule for local `approved` while IYS is still pending;
  it remains ineligible until legal/operational approval says otherwise.
- Whether article count/category cardinality constraints remain permanent after
  the initial supplied set; validators currently require exactly 18 and 3 each.

## Phase 1 Planned Files

```text
src/app/(admin)/admin/layout.tsx
src/app/(admin)/admin/page.tsx
src/components/admin/admin-app.tsx
src/components/admin/index.ts
server/admin-api/bootstrap.php
server/admin-api/auth.php
server/admin-api/session.php
server/admin-api/login.php
server/admin-api/logout.php
server/admin-api/kalite-filo-admin.example.php
server/admin-api/tests/auth.test.php
scripts/assemble-cpanel-release.mjs        (update)
scripts/assemble-cpanel-release.test.mjs   (update)
src/app/robots.ts                          (update)
```

## Files Changed

- `AGENTS.md`
- `DESIGN.md`
- `README.md`
- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `scripts/validate-foundation.mjs`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/robots.ts`
- `src/components/admin/admin-app.tsx`
- `src/components/admin/index.ts`
- `server/admin-api/README.md`
- `server/admin-api/bootstrap.php`
- `server/admin-api/auth.php`
- `server/admin-api/session.php`
- `server/admin-api/login.php`
- `server/admin-api/logout.php`
- `server/admin-api/kalite-filo-admin.example.php`
- `server/admin-api/tests/auth.test.php`

## Validation Results

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test` — 56 Node tests plus quote config, subscriber, IYS,
  customer-mailer and admin authentication PHP suites passed
- [x] Admin test syntax-checked every top-level admin PHP runtime/example file
- [x] `npm run build:staging` — 140 static pages generated, including `/admin/`
- [x] `npm run verify:output` — admin noindex/language and existing public
  artifact contracts passed
- [x] `node scripts/assemble-cpanel-release.mjs staging` — release contains only
  the five approved admin runtime PHP files; config example/tests are excluded
- [x] `git diff --check`

No staging deployment or real credential/config test was performed in this
session. The refreshed login UI and IP allowlist tests passed locally. No secret,
temporary plaintext credential or password hash was added to the repository.

## Session Handoff

Phase 0 and the local Phase 1 implementation are complete. Next session must
start by reading this file, then provision a real config outside the staging
document root with the temporary Owner account,
deploy `release/staging/`, and verify the full authentication
boundary at `https://staging.kalitefilo.com.tr/admin/`. Record actual PHP/cPanel
behavior and any Apache header decisions here. Only after staging auth passes
should Phase 1 be marked `[x]` and Phase 2 dashboard/read-only adapters begin.
