# Kalite Filo Admin Dashboard Implementation

Last updated: 2026-08-30

This document is the single source of truth for Phase 2 Admin Dashboard work.
Every admin development session must read it before making changes and update
the status and handoff sections before ending.

## Current Status

The 2026-08-30 live staging diagnostic cycle confirmed session authentication,
login throttling, audit access and Newsletter/IYS reads. The supplied vehicle
draft is structurally valid, but the deployed vehicle/tag runtime returned a
generic 503; the refreshed runtime now exposes safe draft-store diagnostic
codes. Staging public forms and admin also now share one staging-private contact
CSV by default. Deployment of the refreshed artifact and HTTPS confirmation are
the remaining incident checks.

Phase 0 is complete. Phase 1 authentication is implemented and live staging now
logs in successfully on the first submission after fixing the asynchronous form
reference bug. Final browser confirmation of persistent logout/cookie headers
remains an operational check. Phase 2 is in progress: an authenticated,
read-only dashboard API and responsive operational overview are implemented and
await staging deployment. A newest-first paginated audit view with exact action
and result filters is now implemented locally. Vehicle mutations are stored only as private drafts;
subscriber mutation, campaign delivery and publishing actions remain disabled. The public site remains a Next.js
16.2.11 static export.

Phase 3 vehicle taxonomy now manages exactly five controlled groups: brand,
model, category, segment and fuel. Existing vehicle records seed every group;
custom values remain in the environment-specific private taxonomy store. The
vehicle editor uses required dropdowns for these fields and PHP independently
rejects values outside the same taxonomy. Transmission, seats and model year
are deliberately ordinary vehicle fields rather than managed tags.

Vehicle price editing now preserves the existing `TRY`, monthly, VAT-excluded,
owner-approved list-net contract. Admin input is whole TL without grouping
separators; PHP converts it to integer minor units, rejects unsafe ranges and
prevents a price-less vehicle from entering published draft state. Every create
or update remains an immutable private revision. Authenticated editors can view
the latest 20 revision summaries without exposing revision files publicly.

Phase 4 has started with a read-only Filo Rehberi inventory. The release snapshot
joins the 18 generated Turkish records with verified local TR/EN Markdown file
presence. The admin can search and filter by category and English completeness;
no translation is inferred or generated and no Markdown source is mutated yet.

The localized article draft schema and preview security boundary are now
implemented. Turkish content is mandatory; English is either an explicit locale
record or `null`. Each locale has independent `draft`/`ready` state, bounded
metadata and Markdown, while entity revisions preserve stable identity. The
preview endpoint is authenticated, same-origin and CSRF-protected; raw HTML is
escaped and only HTTP(S) or safe root-relative links are emitted.

Article draft persistence and mutation APIs are now implemented. Writes use a
private per-environment JSON store, a dedicated exclusive transaction lock,
atomic replacement and immutable revision files. TR/EN slugs are checked
against both published inventory and every draft. Only Owner, Admin and Editor
roles may create/update; Marketing and Read Only remain non-mutating.

The admin Filo Rehberi view now includes a TR/EN tabbed editor for private
drafts, explicit English opt-in, sanitized Markdown preview and safe revision
history. Published source cards remain repository-backed and read-only. An
explicit action can now clone their verified TR/EN metadata and Markdown into a
same-identity private draft; it never writes the repository or public release.

The central private Media Library is now implemented for JPEG, PNG and WebP
assets. It records localized alt text, usage, dimensions, byte size, checksum,
creator/source/licence provenance and uploader timestamps. Article drafts can
select an Article/General asset by opaque ID; referenced assets cannot be
deleted. This remains a draft relationship until the Phase 7 publishing runner
materializes an immutable public path.

Phase 5 has started with a consent-safe, authenticated read-only Newsletter
Contacts view. It reads the environment-specific CSV under a shared lock and
supports bounded pagination plus exact status, source and IYS filters. Every
stored source row remains visible independently; the UI does not reinterpret a
quote/contact `lead_only` row as newsletter consent and exposes no mutation.

The IYS admin view now reports exact pending, failed, synced, approved and
not-requested row counts, displays eligible operational rows and lists private
manual CSV export history. Owner/Admin/Marketing may explicitly generate a CSV
through the existing exporter and download it through an authenticated endpoint.
No portal API or successful synchronization is inferred from export creation.

Unsubscribe and suppression foundations are now implemented. Campaign code can
issue a 256-bit opaque token whose SHA-256 hash, not the raw token, is stored
privately. The public PHP route uses GET only for confirmation and POST for the
idempotent state change. Admin Owner/Admin/Marketing may also perform an explicit
confirmed unsubscribe operation; all rows for the email are suppressed while
original consent evidence remains intact and the action is audited.

Phase 6 has started with a private campaign draft store and operational admin
composer. Owner/Admin/Marketing can create and revise draft-only campaigns with
name, subject, preheader and structured Hero/Text/CTA/Divider blocks. The API
returns only aggregate audience eligibility reasons, never recipient addresses.
Staging reports legally eligible contacts as environment-blocked and bulk
live delivery remains disabled by default. A saved draft may be sent only to a recipient
declared in that environment's private test allowlist, with per-admin throttling
and audit. An opt-in dry-run queue/ledger foundation exists; production live
delivery has not been enabled or operationally verified.

The Phase 2 release assembler creates a secrets-free immutable snapshot from
the validated vehicle/article sources. PHP combines it with bounded, locked,
read-only aggregates from the environment-specific newsletter CSV and audit
JSONL stores. Staging never reads production admin data by design.

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
  staging/data/newsletter-contacts.csv  # synthetic/allowlisted staging records only
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
| `GET /admin-api/vehicle-revisions.php?id=` | Latest safe vehicle revision summaries | 3 |
| `GET,POST /admin-api/featured-vehicles.php` | Four-item ordered invariant | 3 |
| `GET,POST /admin-api/articles.php` | Article list/create | 4 |
| `GET,PATCH /admin-api/article.php?id=` | Localized article update | 4 |
| `GET /admin-api/article-revisions.php?id=` | Safe article revision summaries | 4 |
| `POST /admin-api/article-preview.php` | Sanitized Markdown preview | 4 |
| `POST /admin-api/article-import.php` | Clone verified published TR/EN source to private draft | 4 |
| `GET,POST /admin-api/media.php` | Media list/upload metadata | 4 |
| `PATCH /admin-api/media-update.php` | Update private media metadata | 4 |
| `GET /admin-api/media-file.php?id=` | Authorized private preview | 4 |
| `POST /admin-api/media-delete.php` | Delete an unreferenced private asset | 4 |
| `GET /admin-api/subscribers.php` | Filtered contact view | 5 |
| `POST /admin-api/subscriber-operation.php` | Explicit audited status operation | 5 |
| `GET /admin-api/iys.php` | State and export history | 5 |
| `POST /admin-api/iys-export.php` | Generate export | 5 |
| `GET /admin-api/iys-download.php?id=` | Authorized CSV download | 5 |
| `GET,POST /admin-api/campaigns.php` | Campaign list/create | 6 |
| `GET,PATCH /admin-api/campaign.php?id=` | Campaign edit/read | 6 |
| `POST /admin-api/campaign-test.php` | Allowlisted test mail | 6 |
| `GET,POST,PATCH /admin-api/campaign-queue.php` | Queue history, audience freeze and queued cancellation | 6 |
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

The first implemented adapter is intentionally read-only: release assembly
emits safe article metadata and verified TR/EN body-presence flags into the
admin snapshot. `GET /admin-api/articles.php` exposes that inventory and the
separate private draft list only to an authenticated session. Published sources
remain read-only; authenticated draft mutation uses the contracts below.

The private draft contract uses `schemaVersion: 1`, a stable article ID,
category, featured state, explicit `tr`/`en` locale slots, monotonic revision,
created/updated timestamps and actor ID. A locale cannot become `ready` without
excerpt, cover alt, valid publication date, reading time and SEO fields. Draft
persistence uses a locked `drafts/articles.json` store and revisions under
`revisions/articles/<id>/`; the public Markdown sources remain untouched.

## Media Management Model

Draft uploads live in an environment-specific private media directory. Metadata:
stable ID, original/safe filename, byte size, server-detected MIME, width,
height, alt by locale, usage, creator, source page, licence name/URL, upload time,
uploader, checksum and status. Publication copies immutable/checksummed variants
to approved `public/images/...` paths through the runner. Existing vehicle
licence provenance is migrated, not discarded.

Allowed types are JPEG, PNG and WebP, with a 5 MiB maximum, minimum 400×225 and
maximum 4096×4096 dimensions. Validation uses PHP image parsing and its detected
MIME rather than the client MIME; production `fileinfo` remains unverified and
is not assumed. Paths use opaque 128-bit IDs plus allowlisted extensions and
are never derived from user path fragments.

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

The initial read endpoint exposes at most 50 records per page (the UI requests
20), scans at most 24 bounded monthly files and silently skips malformed rows.
Only event identity, time, safe admin/role, action, entity identity and result
leave private storage. Stored change summaries are deliberately excluded.

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
  - [x] Verify session bootstrap and CSRF issuance on HTTPS staging
  - [x] Add safe staging-only diagnostic classification and correlation reference
  - [x] Resolve the live credential submission UI failure
  - [x] Verify successful first-attempt login and authenticated session
  - [ ] Verify persistent logout and cookie/header details in browser devtools
- [ ] **Phase 2:** dashboard and read-only operational views
  - [x] Add authenticated dashboard aggregate endpoint
  - [x] Generate a release-time public content count snapshot
  - [x] Add fail-closed newsletter/consent/IYS/unsubscribe aggregates
  - [x] Add safe recent authentication activity view
  - [x] Render responsive dashboard metrics and publish-status placeholders
  - [ ] Verify dashboard data on HTTPS staging
  - [x] Add paginated audit log route/view
- [ ] **Phase 3:** vehicle CRUD, price management and Featured Vehicles
  - [x] Add release snapshot with joined vehicle, price and licensed media data
  - [x] Add private file-backed vehicle draft store and authenticated create/update APIs
  - [x] Add expandable Araçlar navigation with Tüm Araçlar/Yayındaki Araçlar views
  - [x] Add vehicle cards, search, make/segment filters and create/edit form
  - [x] Add explicit published/unpublished transition in draft state
  - [x] Add hardened private image upload/download/delete endpoints and licence editor
  - [x] Complete price editing and price-specific validation/history
  - [x] Add central vehicle taxonomy store and Settings → Tags management view
  - [x] Enforce taxonomy dropdowns for make, model, category, segment and fuel
  - [x] Remove transmission, seats and model-year from managed tag groups
  - [x] Add Featured Vehicles four-item ordered editor and draft invariant
  - [x] Enforce unique vehicle ID/sourceId/slug and bounded power/seats/summary
  - [x] Write immutable create/update vehicle revisions outside document root
  - [x] Add Featured Vehicles editor with exactly four eligible ordered IDs
- [ ] **Phase 4:** Filo Rehberi CMS, TR/EN management and Media Library
  - [x] Add release-time article inventory with verified TR/EN completeness
  - [x] Add authenticated read-only article list endpoint
  - [x] Add searchable category/translation-aware Filo Rehberi admin view
  - [x] Define and test localized private article draft/revision schema
  - [x] Add article create/edit APIs with uniqueness and publication validation
  - [x] Add authenticated raw-HTML-disabled Markdown preview endpoint
  - [x] Add lightweight TR/EN Markdown editor and connect sanitized preview
  - [x] Add safe article revision summaries and editor history
  - [x] Add explicit localized published-source to private-draft import adapter
  - [x] Add article cover workflow and central Media Library
- [ ] **Phase 5:** Newsletter Contacts, IYS and unsubscribe infrastructure
  - [x] Add authenticated paginated read-only contact API
  - [x] Add searchable status/source/IYS-aware Newsletter Contacts UI
  - [x] Add IYS pending/failed/synced view and export history UI
  - [x] Reuse existing manual CSV exporter with authenticated generation/download
  - [x] Add tokenized unsubscribe and suppression foundation
  - [x] Add explicit audited administrative unsubscribe operation and UI
  - [ ] Add other narrowly scoped IYS result/correction operations only after workflow verification
- [ ] **Phase 6:** campaign composer, queue, cron worker and history
  - [x] Add locked/atomic campaign draft schema and CRUD endpoints
  - [x] Add fail-closed deduplicated audience eligibility summary
  - [x] Add admin campaign list/composer and structured preview
  - [x] Add published vehicle/article card selection and frozen references
  - [x] Add allowlisted test-mail flow and final server-rendered preview
  - [x] Add idempotent queue, recipient ledger and cPanel Cron worker foundation
  - [x] Add recipient-safe queue history UI, queued cancellation and CLI dry-run integration coverage
- [ ] **Phase 7:** content/Git bridge, staging publish and deployment status
  - [x] Add authenticated unpublished-change and request-history API/UI
  - [x] Freeze immutable private staging snapshots with SHA-256 identity
  - [x] Add locked/idempotent request creation for identical pending snapshots
  - [x] Enforce publish-time vehicle identity and exactly-four featured invariant
  - [x] Surface article/media blockers and draft warnings before request creation
  - [ ] Select and authenticate external runner transport
  - [ ] Implement tested snapshot-to-repository materialization adapters
  - [ ] Run existing staging build/release commands and report safe status
  - [ ] Deploy staging artifact and complete automated smoke verification
- [ ] **Phase 8:** production publish, rollback and version history
- [ ] **Phase 9:** request inbox, Site Settings and remaining operations
- [ ] **Phase 10:** security/accessibility/responsive audit and full regression

## Completed Tasks

- [x] Added the first Phase 7 Publishing Center foundation: content-hashed
  change discovery, fail-closed validation, immutable snapshots, locked and
  idempotent staging requests, safe history and admin-visible blockers.

- [x] Added a private immutable audience freeze whose deduplication is
  fail-closed: missing consent/IYS is excluded and any unsubscribe row overrides
  otherwise eligible evidence for the same email.
- [x] Added queue idempotency by campaign ID, revision and audience fingerprint,
  plus an atomic per-recipient ledger with pending/sent/failed/skipped states,
  bounded retries and safe aggregate API responses.
- [x] Added Owner/Admin exact-name confirmation UI and a PHP CLI-only worker.
  Staging forbids live delivery and supports dry-run ledger validation; live
  production remains an explicit private-config choice.
- [x] Added a latest-100 queue history table without recipient addresses,
  explicit cancellation while still queued, and an integration test that runs
  the real CLI worker against a synthetic staging CSV in dry-run mode.

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
- [x] Verified the live staging session bootstrap and added non-sensitive
  staging login diagnostics plus correlation references for the remaining 503.
- [x] Diagnosed the first-login/refresh behavior as response output occurring
  around successful server-side authentication; hardened private config loading
  against UTF-8 BOM/whitespace output and made session rotation fail atomically.
- [x] Identified the remaining first-login UI failure: React form
  `event.currentTarget` was accessed after an asynchronous request. The PHP login
  succeeded, but the subsequent form reset threw before client session state was
  stored. Capturing the form element before `await` now preserves the successful
  response and eliminates the misleading service error.
- [x] Simplified the admin login card by removing decorative and redundant UI
  details while preserving its accessible section label.
- [x] Added noindex metadata, production robots exclusions, export validation,
  explicit `/admin-api/` release packaging and secret/config release guards.
- [x] Added authentication foundation and release integration tests without
  adding a database, ORM, runtime Next.js feature, or new dependency.
- [x] Added `GET /admin-api/dashboard.php` with authentication, no-store headers,
  bounded private-store reads and safe response fields.
- [x] Added an immutable release-time snapshot reporting 32 active vehicles,
  exactly four featured vehicles, 18 articles and zero explicit drafts.
- [x] Added email-deduplicated newsletter metrics; unsubscribe suppresses
  approved/IYS counts and approved consent requires stored evidence.
- [x] Made the staging contact read model default to a staging-local synthetic
  CSV; only production defaults to the existing canonical contact store.
- [x] Replaced the Phase 1 placeholder panel with a responsive dashboard showing
  eight metrics, recent safe audit activity, environment and publish state.
- [x] Seeded vehicle tags from all current portfolio records and limited managed
  groups to brand, model, category, segment and fuel.
- [x] Replaced those five vehicle editor text inputs with required dropdowns and
  added matching fail-closed PHP taxonomy validation.
- [x] Added whole-TRY monthly list-net price editing, integer-minor-unit PHP
  normalization, safe bounds and the published-vehicle price invariant.
- [x] Added authenticated read-only vehicle revision summaries and rendered the
  latest history inside the vehicle editor.
- [x] Added authenticated, paginated `GET /admin-api/audit.php` with bounded
  private reads, exact filters and a response schema that excludes summaries.
- [x] Added the responsive Denetim Kaydı table, filters and previous/next page
  controls to the admin navigation.
- [x] Classified new vehicle/taxonomy audit events with safe entity types and
  vehicle IDs while keeping authentication events separate.
- [x] Started Phase 4 with a secrets-free 18-record article inventory and
  verified all 18 Turkish and 18 English Markdown bodies during release assembly.
- [x] Added authenticated `GET /admin-api/articles.php` and a responsive Filo
  Rehberi view with search, category and translation-completeness filters.
- [x] Added the versioned localized article normalization contract with explicit
  missing-English state, field bounds, ready-state completeness and revisions.
- [x] Added CSRF-protected `POST /admin-api/article-preview.php`; its allowlisted
  renderer escapes raw HTML and drops unsafe/protocol-relative link targets.
- [x] Added PHP coverage for schema revision, incomplete ready content, unknown
  categories, raw HTML, JavaScript URLs and safe HTTPS preview links.
- [x] Added locked/atomic private article storage and immutable create/update
  revision files outside the document root.
- [x] Added published-plus-draft TR/EN slug uniqueness validation and round-trip
  persistence tests.
- [x] Enabled authenticated `POST articles.php` and `PATCH article.php?id=` for
  Owner/Admin/Editor only; public Markdown is never modified by these APIs.
- [x] Classified article create/update records as article audit entities.
- [x] Added a TR/EN tabbed draft editor for title, slug, category, excerpt,
  locale status/date/reading time, cover alt, SEO metadata and Markdown.
- [x] Connected the editor to the authenticated sanitized preview endpoint;
  English remains an explicit opt-in and is never synthesized.
- [x] Added `GET /admin-api/article-revisions.php?id=` and an editor history
  view that exposes changed field names without returning Markdown bodies.
- [x] Hid article mutation controls from Marketing/Read Only roles while the PHP
  authorization boundary remains authoritative.
- [x] Added a release-time article import payload from verified TR/EN metadata
  and Markdown, plus explicit CSRF/role-protected private-draft import.
- [x] Preserved stable published IDs, rejected duplicate imports, recorded an
  immutable import revision/audit event and kept import bodies out of list APIs.
- [x] Added a locked/atomic private media catalog, opaque contained file paths,
  server-detected JPEG/PNG/WebP type/dimension limits and checksum metadata.
- [x] Added responsive media search/filter/upload/edit/download/delete UI with
  localized alt text, usage and licence/source provenance fields.
- [x] Added article `coverMediaId`, server-side usage/existence validation and
  deletion protection for media referenced by a private article draft.
- [x] Started Phase 5 with authenticated `subscribers.php` and an operational
  Bülten Kişileri table using pagination and consent-safe exact filters.
- [x] Added operational İYS navigation, exact-state overview, authenticated
  manual CSV generation/download and bounded private export history.
- [x] Added hashed opaque unsubscribe-token storage, confirmation-before-POST
  public endpoint and idempotent suppression across every source row.
- [x] Added an Owner/Admin/Marketing-only “Abonelikten Çıkar” action to the
  contact table with explicit confirmation, CSRF, role enforcement and audit.
- [x] Started Phase 6 with versioned private campaign drafts, draft-only edits,
  header-injection validation and create/update audit events.
- [x] Added a Mail Kampanyaları interface with content blocks, live structural
  preview and aggregate fail-closed audience exclusion metrics.

- [x] Added published vehicle/Filo Rehberi card selectors, validated their IDs
  against the immutable release snapshot and froze safe public fields into each
  campaign revision.
- [x] Added a CSRF-protected PHP email renderer and sandboxed branded preview;
  authored text is escaped and campaign delivery remains disabled.
- [x] Added environment-specific private test-recipient allowlists, a
  CSRF/role-protected test endpoint, per-admin throttling, audit results and an
  admin selector that cannot submit an arbitrary recipient address.
- [x] Reused the existing PHPMailer/private SMTP boundary for test delivery;
  test subjects carry the target environment and bulk SMTP remains disabled by default.

## Current Task

Phase 7 publishing request foundation is now implemented locally. It deliberately
stops at `awaiting_runner`: cPanel PHP does not run the Next.js build, and no
transport/deployment credential has been invented. The next coding task is the
tested snapshot-to-repository adapter after runner transport is selected.

Live staging diagnostics found that Newsletter/IYS was reading the intended
staging-private contact store while the public staging forms still defaulted to
the legacy account-wide store. Both boundaries now resolve to the same isolated
staging CSV by default. Vehicle/tag APIs now return safe, actionable draft-store
error codes for unreadable, oversized, malformed or wrong-schema JSON instead
of collapsing every hosting problem into `service_unavailable`.

Phase 4 is implemented locally through inventory, localized schema, secure
preview, persistence, editor, revisions, published-source import and central
Media Library/article cover selection. Next deploy and smoke-test these Phase 4
operations on HTTPS staging. Phase 5 now has consent-safe Newsletter Contacts,
manual IYS management/export and opaque-token/admin suppression interfaces.
Phase 6 campaign drafts/composer, eligibility summaries, frozen published
vehicle/article selections, server-rendered branded preview and allowlisted
test mail are implemented. Bulk delivery defaults to disabled. The idempotent
queue, private recipient ledger and bounded CLI worker foundation are now
implemented; next smoke-test staging dry-run before any live delivery. In parallel, run
the still-required Phase 2/3 staging smoke tests before closing those phases.

## Next Tasks

- [x] Provision the staging private Owner config and verify the session endpoint.
- [x] Verify first-attempt Owner login on HTTPS staging.
- [ ] Deploy the refreshed staging artifact, set `drafts/vehicles.json` to a
  PHP-readable private permission (`600` preferred, `644` if cPanel PHP ownership
  requires it), then record the exact `/admin-api/vehicles.php` and `tags.php`
  responses. The supplied 32-record JSON is locally valid.
- [ ] Submit one new synthetic staging newsletter signup and confirm it appears
  immediately in both Bülten Kişileri and İYS without manually copying a CSV.
- [ ] Upload the refreshed `release/staging/` artifact and test vehicle create,
  edit, whole-TL price validation, publish/unpublish and revision display.
- [ ] Test draft media upload/download/delete and the four-item featured order
  against staging-private data; confirm the public homepage is unchanged.
- [ ] Replace the staging document root with the Phase 2 `release/staging/`
  artifact and verify `/admin-api/dashboard.php` while authenticated.
- [ ] Verify cPanel session persistence, cookie flags, origin/host behavior,
  response headers, rate-limit file permissions and logout in browser/devtools.
- [ ] Verify whether Apache can apply no-store headers to static `/admin/` and
  disable directory listing without interfering with cPanel HTTPS rules.
- [ ] Verify audit pagination/filters and confirm API responses never contain
  the stored `summary` field on HTTPS staging.
- [x] Define the Phase 4 localized article draft schema, field limits and
  explicit missing-translation semantics.
- [x] Implement and test raw-HTML-disabled Markdown preview before enabling any
  article mutation in the admin UI.
- [x] Add locked/atomic article draft persistence, immutable revision files and
  TR/EN slug uniqueness checks.
- [x] Add authenticated create/edit APIs.
- [x] Connect the TR/EN editor UI to draft APIs and the already-sanitized preview
  endpoint; existing published records remain read-only until import is defined.
- [x] Add authenticated safe article revision summaries.
- [x] Define and implement an explicit localized import adapter before allowing
  existing published articles to be edited as drafts.
- [x] Implement article cover selection and the central Media Library contract.
- [ ] Deploy and smoke-test article import/edit/preview, media upload/edit/
  download/delete and referenced-media deletion protection on HTTPS staging.
- [x] Start Phase 5 with authenticated read-only Newsletter Contacts filters.
- [x] Add read-only IYS pending/failed/synced summary and existing manual CSV
  workflow visibility before enabling any state-changing IYS operation.
- [x] Implement cryptographically opaque unsubscribe tokens and suppression.
- [x] Implement the narrowly scoped audited administrative unsubscribe operation;
  consent evidence remains immutable through normal editing.
- [ ] Verify token confirmation, repeated-token idempotence and admin suppression
  against synthetic staging contacts before campaign work begins.
- [x] Define campaign draft schema and fail-closed aggregate audience eligibility.
- [x] Add published vehicle/Filo Rehberi selection to campaign blocks and freeze
  the referenced snapshot before any queue operation.
- [x] Define an environment-specific allowlist and implement test mail without
  enabling queue or arbitrary-recipient SMTP delivery.
- [x] Define the immutable audience freeze, idempotency keys, recipient ledger
  and bounded cPanel CLI worker before exposing a queue action.
- [ ] Configure staging `dry_run`, queue only synthetic contacts, execute the
  CLI worker through cPanel Cron and inspect the private terminal ledger.
- [ ] Deploy the Publishing Center foundation and verify validation blockers,
  exact `STAGING` confirmation, idempotent repeated requests and private request
  permissions on HTTPS staging.
- [ ] Decide the external runner host/transport before implementing request
  claim/result endpoints or storing any deployment secret.

## Known Issues

- Production PHP extension list is not available; SQLite and `finfo` cannot be
  assumed. Local PHP has PDO but reports no PDO drivers.
- Apache rules/security headers for static admin HTML are not yet staging-tested.
- The public route registry currently describes Phase 1 routes only; admin stays
  deliberately outside sitemap/navigation contracts.
- Current article generation is Turkish-centric and English metadata is TS code;
  this needs a controlled Phase 4 migration.
- Public homepage featured order remains implicit until the Phase 7 publishing
  adapter materializes the explicit private four-ID contract into repository data.
- Existing newsletter CSV permits multiple rows per email/source; audience
  eligibility needs a tested cross-row resolution policy before campaigns.
- The live staging vehicle/tag failure is narrowed to private draft readability
  or an outdated runtime artifact. The supplied JSON parses successfully as
  schema version 1 with 32 records; the unrelated LiteSpeed `__next` 404 probe
  lines do not contain the PHP exception.

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

Current staging data-boundary/vehicle diagnostic continuation:

- `server/admin-api/vehicle-store.php`
- `server/admin-api/vehicles.php`
- `server/admin-api/tags.php`
- `server/forms/subscriber-store.php`
- `server/forms/tests/subscriber-store.test.php`
- `server/admin-api/tests/vehicle-store.test.php`
- `src/components/admin/tag-manager.tsx`
- `src/components/admin/vehicle-manager.tsx`
- `src/components/admin/publishing-center.tsx`
- `server/admin-api/publishing-store.php`
- `server/admin-api/publishing.php`
- `server/admin-api/publish-staging.php`
- `server/admin-api/tests/publishing-store.test.php`
- `server/admin-api/README.md`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `scripts/validate-foundation.mjs`
- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`


Current Phase 6 queue/worker continuation:

- `server/admin-api/bootstrap.php`
- `server/admin-api/kalite-filo-admin.example.php`
- `server/admin-api/campaign-queue-store.php`
- `server/admin-api/campaign-queue.php`
- `server/admin-api/campaign-worker.php`
- `server/admin-api/tests/campaign-queue.test.php`
- `server/admin-api/tests/campaign-worker.test.php`
- `server/admin-api/README.md`
- `src/components/admin/admin-app.tsx`
- `src/components/admin/campaign-manager.tsx`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current Phase 6 test-mail continuation:

- `server/admin-api/bootstrap.php`
- `server/admin-api/kalite-filo-admin.example.php`
- `server/admin-api/campaign-test-mailer.php`
- `server/admin-api/campaign-test.php`
- `server/admin-api/README.md`
- `server/admin-api/tests/auth.test.php`
- `src/components/admin/campaign-manager.tsx`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

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
- `src/components/admin/audit-log-view.tsx`
- `src/components/admin/article-list-view.tsx`
- `src/components/admin/media-library-view.tsx`
- `src/components/admin/subscriber-list-view.tsx`
- `src/components/admin/iys-management-view.tsx`
- `src/components/admin/campaign-manager.tsx`
- `src/components/admin/vehicle-manager.tsx`
- `src/components/admin/tag-manager.tsx`
- `src/components/admin/featured-vehicles-manager.tsx`
- `src/components/admin/index.ts`
- `server/admin-api/README.md`
- `server/admin-api/bootstrap.php`
- `server/admin-api/auth.php`
- `server/admin-api/read-model.php`
- `server/admin-api/session.php`
- `server/admin-api/login.php`
- `server/admin-api/logout.php`
- `server/admin-api/dashboard.php`
- `server/admin-api/audit.php`
- `server/admin-api/articles.php`
- `server/admin-api/article-store.php`
- `server/admin-api/article-preview.php`
- `server/admin-api/article.php`
- `server/admin-api/article-revisions.php`
- `server/admin-api/article-import.php`
- `server/admin-api/vehicle-store.php`
- `server/admin-api/vehicles.php`
- `server/admin-api/vehicle.php`
- `server/admin-api/vehicle-revisions.php`
- `server/admin-api/vehicle-media.php`
- `server/admin-api/media.php`
- `server/admin-api/media-store.php`
- `server/admin-api/media-update.php`
- `server/admin-api/subscribers.php`
- `server/admin-api/subscriber-operation.php`
- `server/admin-api/iys.php`
- `server/admin-api/iys-export.php`
- `server/admin-api/iys-download.php`
- `server/admin-api/campaign-store.php`
- `server/admin-api/campaigns.php`
- `server/admin-api/campaign.php`
- `server/admin-api/campaign-preview.php`
- `server/admin-api/campaign-test-mailer.php`
- `server/admin-api/campaign-test.php`
- `server/forms/unsubscribe-store.php`
- `server/forms/unsubscribe.php`
- `server/forms/tests/unsubscribe-store.test.php`
- `server/admin-api/tests/campaign-store.test.php`
- `server/admin-api/media-file.php`
- `server/admin-api/media-delete.php`
- `server/admin-api/taxonomy-store.php`
- `server/admin-api/tags.php`
- `server/admin-api/featured-vehicles.php`
- `server/admin-api/kalite-filo-admin.example.php`
- `server/admin-api/tests/auth.test.php`
- `server/admin-api/tests/dashboard.test.php`
- `server/admin-api/tests/vehicle-store.test.php`
- `server/admin-api/tests/article-store.test.php`
- `server/admin-api/tests/media-store.test.php`

## Validation Results

2026-08-30 Phase 7 publish-request foundation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; publishing coverage proves content fingerprints,
  exactly-four featured blocking, safe browser summaries, immutable snapshot
  hash identity and idempotent reuse of an identical pending request.
- `npm run release:staging`: passed; all 140 static pages generated.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,942,046 bytes.

2026-08-30 staging data-boundary/vehicle diagnostic continuation:

- The supplied `vehicles.json` parsed locally under PHP as schema version 1
  with 32 records; no JSON corruption was reproduced.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed, including subscriber-store isolation, vehicle-store and
  publishing-store tests.
- `npm run release:staging`: passed; all 140 static pages were generated and
  the cPanel release includes the updated form/admin PHP runtime.
- `npm run verify:output`: passed.
- Project-owned PHP syntax scan: passed.
- Refreshed `kalite-filo-staging.zip`: 18,940,563 bytes.

2026-08-30 Phase 6 history/dry-run continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed, including a subprocess execution of the real CLI worker
  against a synthetic staging contact store; the recipient reached terminal
  `skipped/dry_run` state without loading SMTP delivery.
- PHP syntax checks for queue API and worker integration test: passed.
- `npm run release:staging`: passed; 140 static pages generated.
- `npm run verify:output`: passed.
- `git diff --check`: passed (line-ending notices only).
- Refreshed `kalite-filo-staging.zip` (18,937,244 bytes).

2026-08-30 Phase 6 queue/worker continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed, including queue eligibility, unsubscribe precedence,
  idempotency and terminal retry behavior.
- PHP syntax checks for bootstrap, queue store/API and CLI worker: passed.
- `npm run release:staging`: passed; 140 static pages generated.
- `npm run verify:output`: passed.
- `git diff --check`: passed (line-ending notices only).
- Confirmed queue store/API/worker files are present in the staging release.
- Refreshed `kalite-filo-staging.zip` (18,937,113 bytes).

2026-08-30 Phase 6 allowlisted test-mail continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; private allowlist validation, arbitrary-recipient
  rejection, environment subject prefix, authored-markup escaping and rate
  limiter persistence are covered without sending SMTP in tests.
- PHP syntax checks for bootstrap and campaign test endpoints: passed.
- `npm run release:staging`: passed; 140 static pages generated.
- `npm run verify:output`: passed.
- `git diff --check`: passed (line-ending notices only).
- Confirmed the release contains the test endpoint/helper plus the existing
  PHPMailer loader and Composer runtime.
- Refreshed `kalite-filo-staging.zip` (18,930,843 bytes).

2026-08-30 Phase 6 card/preview continuation:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed, including admin campaign store and release assembly tests.
- PHP syntax checks for campaign store/list/detail/preview endpoints: passed.
- `npm run release:staging`: passed; 140 static pages generated and the PHP
  runtime assembled without introducing a Next.js runtime route.
- `npm run verify:output`: passed.
- `git diff --check`: passed (line-ending notices only).
- Confirmed `release/staging/admin-api/campaign-preview.php` is packaged.
- Refreshed `kalite-filo-staging.zip` (18,926,388 bytes).

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test` — 56 Node tests plus quote config, subscriber, IYS,
  customer-mailer, admin authentication, dashboard read-model and vehicle-store
  plus article schema/preview PHP suites passed
- [x] Admin test syntax-checked every top-level admin PHP runtime/example file
- [x] `npm run build:staging` — 140 static pages generated, including `/admin/`
- [x] `npm run verify:output` — admin noindex/language and existing public
  artifact contracts passed
- [x] `node scripts/assemble-cpanel-release.mjs staging` — release contains the
  reviewed admin runtime files plus generated content snapshot; private
  config, examples and tests are excluded
- [x] `git diff --check`

The 2026-08-30 Phase 3 build generated all 140 static pages and packaged the
featured endpoint without private draft/revision data. Vehicle-store tests cover
numeric normalization, duplicate slug rejection, technical-field bounds,
whole-TRY price normalization and rejection of published vehicles without a price.

The authentication regression test now loads a private config containing a
UTF-8 BOM and verifies that it does not leak response bytes/headers. Login now
checks successful session-ID rotation before setting authenticated state.

The 2026-08-29 Phase 2 release regenerated all 140 static pages. Snapshot
inspection returned 32 active vehicles, four featured vehicles, 18 articles and
zero explicit drafts. The cPanel artifact includes authenticated dashboard and
read-model PHP files. No secret, plaintext credential or private contact data
was added to the repository or release.

The 2026-08-30 Phase 4 inventory check found 18/18 Turkish and 18/18 English
Markdown bodies across the six existing categories. Release tests cover both a
complete English match and an explicitly missing translation. The public
article routes, Markdown files and generated records remain unchanged.

The Phase 4 schema/preview suite confirms monotonic revisions, explicit missing
English state, ready-content completeness and safe Markdown output. Preview
payloads are capped at 128 KiB. Raw tags are escaped and `javascript:` plus
protocol-relative targets are not emitted as links.

Article persistence tests now cover exclusive-lock/atomic round-trip storage,
private immutable revision creation, duplicate draft slugs and conflicts with
published slugs. Release packaging includes both article mutation endpoints but
no draft or revision data.

The article editor build exposes only private drafts for mutation. Preview HTML
comes exclusively from the authenticated sanitizer endpoint. Revision tests
verify that changed-field summaries include Markdown changes but never expose
the stored before/after Markdown bodies.

The published-source import tests verify Turkish frontmatter removal, verified
TR/EN body transfer, stable identity, fail-closed incomplete sources and release
packaging of `article-import.php`. The ordinary article-list response strips the
server-only import payload. All 140 static pages still build successfully.

The Media Library suite verifies localized metadata normalization, atomic
catalog round trips, opaque contained paths, required Turkish alt text and
unsafe source-URL rejection. Article tests verify that vehicle-only assets
cannot be selected as article covers. Release assembly includes the catalog and
metadata endpoints but excludes all private catalog records and uploaded files.

Newsletter read-model tests verify exact status/source/IYS filtering, bounded
pagination and preservation of a quote-form `lead_only`/`not_requested` row.
The API is GET-only and release packaging contains no contact CSV data.

IYS read-model tests verify exact per-row state counts and bounded discovery of
private export files/state. The original exporter tests still verify same-email
deduplication, latest consent recipient type, consent time windows and exclusion
of `lead_only`. Admin export creation records an audit event but does not modify
contact or IYS status.

Unsubscribe tests verify 256-bit token shape, absence of raw tokens at rest,
hash lookup, suppression timestamps, preservation of CSV rows, repeat-use
idempotence and fail-closed unknown tokens. Release tests include the public
confirmation endpoint and private helper without including token/contact data.

Campaign tests verify draft normalization, immutable identity/revision behavior,
atomic private persistence, header-injection rejection and audience exclusions.
An otherwise eligible staging address remains `sendable: 0`; production summary
still excludes missing consent and unsubscribed rows. No recipient list is sent
to the browser and no delivery endpoint is packaged.

## Session Handoff

2026-08-30 Phase 7 request-foundation handoff: Yayınlama now lists private
change groups, performs fail-closed validation and allows Owner/Admin to type
`STAGING` to freeze a content-addressed private request. Requests are serialized
under a private lock and an identical pending snapshot returns the existing ID,
preventing duplicate runner work. The browser receives blockers/warnings and
safe history but never the frozen snapshot or per-source fingerprints. Deploy
the refreshed ZIP and verify the UI plus `data/publish/requests/` permissions.
The request intentionally remains `awaiting_runner`: do not add a PHP shell
build, repository token, FTP credential or fake success result. Next select an
authenticated external runner transport, then implement and test the adapters
that materialize vehicles/prices/featured order, localized Markdown and media
into the repository before invoking the existing release scripts.

2026-08-30 staging incident handoff: the supplied vehicle draft is valid JSON
(`schemaVersion: 1`, 32 records), so the prior generic tag/vehicle 503 is most
consistent with file readability or an outdated extracted runtime. Deploy the
new `kalite-filo-staging.zip`, set the private `vehicles.json` permission to 600
(or 644 only if required by cPanel PHP ownership), log in, and open
`/admin-api/vehicles.php` then `/admin-api/tags.php`. The APIs now return a safe
specific code (`vehicle_draft_unreadable`, `vehicle_draft_invalid_json`,
`vehicle_draft_invalid_schema`, or `vehicle_draft_too_large`) if they still
fail. Do not create an empty `vehicle-taxonomy.json`; it is generated only when
the first custom tag is saved. Staging public forms and admin now share the
single isolated `private/kalite-filo-admin/staging/data/newsletter-contacts.csv`
by default, so verify one new synthetic signup without copying files. Existing
public featured/article output still needs the Phase 7 external publish runner;
private draft persistence alone cannot mutate the static site.

2026-08-30 Phase 6 operational-visibility handoff: Owner/Admin now sees the
latest 100 queue summaries and statistics in Mail Kampanyaları without any
recipient address. A queue can be cancelled only while its persisted status is
`queued`; once the CLI worker has changed it to `sending`, cancellation fails
closed. Cancellation marks remaining retryable recipients skipped/cancelled and
updates the campaign plus audit log. Automated tests now execute the actual CLI
worker with a synthetic staging CSV and prove dry-run completes without SMTP.
The remaining evidence is hosting-specific: deploy the refreshed artifact, set
staging `campaign_delivery_mode` to `dry_run`, create a synthetic queue, invoke
the documented cPanel CLI command and confirm the same terminal history in the
browser. Do not switch production to `live` from this handoff.

2026-08-30 Phase 6 queue/worker handoff: queue creation is now available only
to Owner/Admin and requires typing the exact saved campaign name. It freezes the
saved revision and the environment-local eligible audience, returns no recipient
addresses, and reuses an existing queue for the same revision/fingerprint.
Private ledgers retain the email because SMTP and suppression rechecks require
it; files remain outside the document root with `0600` writes. The CLI worker
uses a non-overlapping process lock, rechecks current eligibility immediately
before each attempt, limits retries to three and batches 1–50 recipients.
Staging rejects `live`; first configure `campaign_delivery_mode => 'dry_run'`
with synthetic contacts, upload the release and run the documented cPanel Cron
command. Inspect the private queue JSON before considering any production live
mode. No production delivery has been enabled or operationally verified.

2026-08-30 Phase 6 test-mail handoff: a saved draft can now be sent only to a
recipient declared in the target's private `campaign_test_recipients` config.
The browser sends a stable recipient ID, PHP resolves it against the allowlist,
limits each admin to five attempts per ten minutes, adds `[TEST][STAGING]` or
`[TEST][PRODUCTION]` to the subject, reuses the existing PHPMailer/private SMTP
configuration and audits delivery outcome without storing the email address.
Add the desired staging recipient entry to the already-private staging
`config.php` before browser smoke testing. Bulk delivery and queue actions are
still disabled. Next define/test the immutable audience snapshot, idempotency
contract, recipient ledger and bounded PHP CLI worker before adding a Send UI.

2026-08-30 Phase 6 card/preview handoff: campaign blocks now select only
published vehicle and Filo Rehberi IDs returned by the release snapshot.
Create/update and preview revalidate those IDs and freeze safe title, summary,
URL and image metadata. The branded HTML preview is rendered by PHP, escapes
authored fields and is displayed in a sandboxed iframe. `campaign-preview.php`
is included in the cPanel release. Delivery remains disabled. Next implement
environment-configured, allowlisted test mail with PHPMailer reuse; do not
accept arbitrary recipient addresses and do not create the production queue.

Live staging first-attempt login is verified. Phase 2 read-only dashboard is
implemented locally and packaged but not yet deployed. Upload the refreshed
staging artifact, then verify eight metrics, recent login activity, audit
pagination, staging isolation and persistent logout. This older handoff is
superseded by the later Phase 2/3 handoff below.

2026-08-30 handoff: the vehicle taxonomy scope is now exactly `make`, `model`,
`categoryLabel`, `segmentLabel` and `fuelLabel`. Existing vehicle snapshot
values are always included, so Fuel contains all currently used values such as
Benzin, Dizel and hybrid variants. Vehicle create/edit renders these five fields
as required dropdowns; PHP rejects values outside the same taxonomy. Deploy the
new staging artifact and smoke-test tag creation plus vehicle reassignment.

Later 2026-08-30 handoff: vehicle create/update now validates unique ID,
sourceId and slug, bounds technical fields, and writes immutable revisions.
Araçlar → Öne Çıkan Araçlar manages exactly four distinct published vehicles
with approved or draft media and explicit order. The public homepage is not
mutated directly; publishing materialization remains Phase 7. Next add price
editing/revision UI and smoke-test these Phase 3 stores on HTTPS staging.

Final 2026-08-30 handoff: whole-TL monthly list-net price editing and the
authenticated latest-20 revision view are implemented. The PHP store converts
TL to integer minor units, rejects grouping/decimal syntax and requires a price
for published drafts. `vehicle-revisions.php` is included in the cPanel release;
private revision files are not. All local quality gates and the refreshed
staging release pass. Next upload `release/staging/` and execute the Phase 3
browser smoke test above; do not mark Phase 3 complete until that evidence is
recorded here.

Audit continuation handoff: `GET /admin-api/audit.php` and the Denetim Kaydı
view are implemented, release-packaged and tested. Pages are newest-first,
limited to 20 in the UI, filter exactly by action/result, and never expose the
stored summary. Vehicle audit rows now receive safe entity classification.
Upload the refreshed staging ZIP, verify dashboard/audit behavior and then run
the Phase 3 vehicle/media/featured smoke checks. Phase 2 and Phase 3 remain open
only because those HTTPS operational checks have not yet been reported.

Phase 4 inventory handoff: Filo Rehberi is now an active admin navigation item
backed by authenticated `articles.php`. It shows the real generated metadata and
verified TR/EN completeness without exposing Markdown bodies or enabling writes.
Next implement the private localized draft/revision schema and sanitized preview
tests; do not add create/edit controls until those fail-closed contracts exist.

Phase 4 schema/preview handoff: those fail-closed contracts now exist and pass.
`article-store.php` normalizes versioned TR/EN entities; `article-preview.php`
provides authenticated sanitized preview without a new dependency. Next add
locked atomic draft storage, uniqueness, immutable revision writes and the
create/edit endpoints. Only after those tests pass should the article editor UI
be enabled. Public Markdown and routes are still unchanged.

Phase 4 persistence handoff: atomic private storage, immutable revisions,
published/draft TR–EN slug uniqueness and Owner/Admin/Editor create/update APIs
now pass. `GET articles.php` returns published inventory plus a separate `drafts`
array; POST creates a private draft and `PATCH article.php?id=` updates only an
existing draft. Next build the TR/EN tabbed editor and connect preview. Do not
silently convert a published source record into a draft until its full localized
Markdown import adapter is explicitly implemented and tested.

Phase 4 editor handoff: the TR/EN tabbed editor now creates and updates private
drafts, supports explicit English opt-in, calls the sanitized preview endpoint
and shows safe revision history. Published inventory cards remain labeled
read-only. Next define the published-source import adapter and article cover /
central Media Library workflow; do not bypass the private draft boundary or
write repository Markdown directly from PHP.

Phase 4 import handoff: published cards can now be explicitly cloned into an
editable private draft with their stable ID and verified TR/EN copy. Repeating
the import returns a conflict, and import creates both an immutable revision and
an audit event. Public Markdown remains untouched. Next implement centralized
private Media Library and article cover selection; do not assume unverified
production PHP extensions while defining signature and dimension checks.

Phase 4 Media Library handoff: the admin navigation now includes Medya with
private upload, preview, search/filter, metadata editing, download and guarded
delete. Article drafts select a private cover by opaque media ID; PHP validates
the relationship and blocks deletion while referenced. Upload the regenerated
staging artifact and smoke-test these multipart/image operations on PHP 8.5.
The next coding task after that operational proof is Phase 5’s authenticated,
read-only Newsletter Contacts view; preserve `lead_only` and fail-closed IYS
semantics when exposing filters.

Phase 5 contacts handoff: Bülten Kişileri is now an active admin view backed by
authenticated `GET subscribers.php`. It lists each evidence row with consent,
IYS, recipient, created/updated and unsubscribe dates and offers bounded exact
filters. It is intentionally read-only. Next build the IYS management summary
and manual CSV export history UI by reusing the existing exporter; do not infer
an IYS API integration or make `not_requested`/unknown states send-eligible.

Phase 5 IYS handoff: İYS is now an active admin view with exact status metrics,
operational records, manual CSV generation, authenticated downloads and export
history. It reuses `export-iys-daily.php`; generation advances that exporter’s
existing time-window state but never marks a contact synced. Next implement the
unsubscribe/suppression foundation with opaque tokens, then only narrowly scoped
audited administrative operations. Keep staging contacts isolated and synthetic.

Phase 5 unsubscribe handoff: `unsubscribe-store.php` issues opaque tokens for
future campaign links and stores only hashes; `/forms/unsubscribe.php?token=`
renders a noindex/no-store confirmation and mutates only on POST. Bülten Kişileri
offers a role/CSRF/audit-protected explicit suppression action. Deploy and test
using synthetic staging contacts. The next decision-dependent task is IYS portal
result import; do not invent its schema. If that remains unverified, proceed to
Phase 6 campaign draft schema and eligibility without enabling delivery.

Phase 6 draft handoff: Mail Kampanyaları is active with campaign list, draft
create/edit, Hero/Text/CTA/Divider blocks and structural preview. Private
campaign persistence and eligibility aggregation pass tests; staging delivery
is explicitly blocked and the UI states that queue/test/send are unavailable.
Next add selectors for published vehicle and article cards, validate those IDs
against the release snapshot and freeze their public fields into preview-ready
blocks. Do not begin SMTP delivery before allowlisted test-mail design.
