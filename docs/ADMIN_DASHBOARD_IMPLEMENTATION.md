# Kalite Filo Admin Dashboard Implementation

Last updated: 2026-09-02

This document is the single source of truth for Phase 2 Admin Dashboard work.
Every admin development session must read it before making changes and update
the status and handoff sections before ending.

## Current Status

Live staging automation is now confirmed successful end to end by the operator:
admin change detection, GitHub dispatch, frozen snapshot claim, validation,
static build, chunk upload, PHP extraction, atomic activation, HTTPS smoke and
terminal success reporting all complete without recurring File Manager or
cPanel Terminal work. Phase 7's normal staging publication path is therefore
operational; the remaining Phase 7 item is a deliberate rollback/retention
drill rather than basic deployment enablement.

The Publishing Center now exposes each request's safe change summary in an
expandable detail panel. Successful retained releases can be atomically
reactivated through an authenticated, CSRF-protected staging-only action; the
current release is retained in turn, and the selected request's fingerprints
become the staging baseline so newer drafts correctly reappear as unpublished.
Owner-only history cleanup preserves that baseline and any active requests
while deleting completed request records. Existing live history is not deleted
merely by deploying code: the owner must explicitly confirm `Geçmişi Temizle`.

The fourth live attempt produced the definitive deployment reason
`release_extraction_failed`. The exact failure was reproduced locally against
the real staging artifact: GNU tar had archived the release through the `.`
root operand, producing a literal dot entry, and PHP `PharData::extractTo()`
fails that archive with `Cannot extract ".", internal error`. Artifact creation
now passes the sorted top-level release entries to tar instead of `.`, retaining
USTAR, manifest and checksum guarantees. The corrected 61 MB-class artifact was
successfully extracted by local PHP and its required public/admin files were
verified. Only runner/repository code changed for this root fix; after push, no
additional cPanel bootstrap is required.

The third live attempt failed while claiming its frozen request because the
staging request endpoint returned a response that could not be parsed as JSON.
The previous runner reported only `malformed JSON`, and claim failure left the
request visually queued because terminal reporting existed only after a
successful claim/build. Runner diagnostics now report only safe response
metadata (HTTP status, MIME type, byte count and empty/HTML/PHP-source/non-JSON
classification), never response contents. A machine-authenticated early-failure
endpoint now terminally records claim/input failures, and the workflow invokes
it for pre-deployment failures. This update requires one new manual staging
bootstrap; an already-finished workflow cannot retroactively close its record.

The second live automation attempt passed checkout, dependency installation,
snapshot claim, materialization, validation and the full static release build.
It failed only when the staging PHP deployment endpoint returned a generic HTTP
503 after artifact upload. The Node 20 annotation was unrelated; the workflow
now uses the official Node-24-based `actions/checkout@v5` and
`actions/setup-node@v5`. Deployment failures now return a bounded non-secret
reason code (assembly, archive, extraction, manifest, filesystem, activation or
state) and the runner includes that code in Actions output. These updated PHP
diagnostics require one manual staging bootstrap before the next attempt.

The first live AD-004 dispatch successfully proved browser-to-PHP-to-GitHub
queueing and status reporting, but the hosted runner failed before build at
`npm run typecheck`: a clean checkout had not generated Next.js global route
types, so the English vehicle detail page could not resolve `PageProps`. The
project typecheck command now runs `next typegen` before `tsc`. This preserves
the Next.js 16 typed-route contract and makes local and clean-runner validation
equivalent. The fix is locally validated and must be pushed to `main` before
retrying the unchanged admin draft.

The GitHub workflow schema issue reported during bootstrap is fixed. The
job-level `env` block no longer references `${{ runner.temp }}`, because the
`runner` context is unavailable at `jobs.<job_id>.env`. Runtime paths now use
GitHub's default `$RUNNER_TEMP` environment variable directly inside shell
steps. The workflow is ready to be committed and pushed before the one-time
cPanel bootstrap release.

The 2026-09-02 Phase 7 automation implementation replaces the recurring manual
cPanel File Manager/Terminal publication procedure. `Staging Oluştur` now
freezes the validated snapshot and dispatches the repository's
`admin-staging-publish.yml` workflow. GitHub Actions downloads only that exact
snapshot and its referenced private media through machine-authenticated,
staging-only PHP endpoints; it reuses the existing materialization, validation,
test, static build and release scripts.

The validated release is packaged as an uncompressed USTAR archive with a
complete path/size/SHA-256 manifest. It is uploaded back to staging in 1 MiB
hash-bound chunks. PHP assembles and verifies the archive, rejects traversal,
links, special/PAX/GNU entries and unmanifested or modified files, extracts it
outside the document root, and atomically swaps the staging document root while
retaining the previous release for rollback. GitHub then verifies the live
release marker and public/admin/robots/session HTTPS contracts. A smoke failure
requests automatic rollback before a bounded terminal result is recorded.

No external SSH, FTP, cPanel API credential, Node runtime on cPanel, deployment
credential in the browser, or secret in the repository is used. Two one-time
private values are required before the first automated run: a repository-scoped
GitHub Actions-write token in cPanel `config.php`, and one strong runner token
whose SHA-256 hash is in cPanel while its raw value is a GitHub `staging`
environment secret. The updated release must be installed manually once to
bootstrap these new PHP endpoints; subsequent admin staging publications are
automatic. Live cPanel proof of `curl`, `PharData`, chunk upload, atomic rename,
smoke and rollback remains required before Phase 7 is closed.

The previously documented workstation + File Manager + Terminal route remains
only a recovery fallback and historical implementation record. It is no longer
the normal staging workflow.

TURKTİCARET support has now explicitly confirmed that external SSH is not
provided on the Web Eko shared-hosting package; only cPanel's browser Terminal
is available. The previous OpenSSH transport is therefore unsupported. The
2026-09-01 manual-cPanel transport was the second interim solution and is now a
bootstrap/recovery fallback under AD-004. No SSH key is required for deployment.
The previously disclosed key must still be revoked as an independent security
cleanup.

The historical manual workflow kept the trusted build runner on the operator
workstation. A `release_ready` ZIP contains a non-secret
`kalite-filo-release.json` marker bound to request ID, frozen snapshot and review
manifest. The operator uploads that ZIP plus the reviewed executor through
cPanel File Manager into an account-private directory, then runs one explicit
cPanel Terminal command. The executor verifies archive SHA-256, path safety,
required files and marker identity before atomically moving the existing staging
document root to a private rollback directory and moving the complete new
release into place. It never targets production and never deletes the retained
old or failed release.

`finalize-manual-staging-publish.mjs` independently fetches the live release
marker, proves that staging serves the exact frozen request, and only then runs
Home/admin/robots/session HTTPS smoke checks and emits bounded terminal evidence.
If finalization fails, the documented Terminal rollback command restores the
retained previous document root. This transport requires no cPanel API token,
FTP password, SSH key or repository secret. The code is locally tested; the
first real cPanel Terminal deployment and rollback drill remain pending.

The earlier OpenSSH adapter and connection diagnostics are retained only as
historical implementation evidence. Provider policy makes that adapter
inoperable on Web Eko, so it must not be configured or used for this account.
The frozen request remains `awaiting_runner` until the cPanel Terminal workflow
is executed, independently finalized over HTTPS, and its bounded result is
submitted through the authenticated Publishing Center.

Security incident on 2026-09-01: an operator accidentally disclosed the
contents of a private SSH deployment key in a chat message. The key material is
not recorded in this repository or this document and must not be used. The
corresponding cPanel key must be revoked/deleted, local downloaded copies
removed after revocation, and a new passphrase-protected key generated and
authorized. The replacement private key must remain only on the operator
workstation or SSH agent; it must never be pasted into chat, source control,
browser fields or environment files.

The 2026-09-01 Phase 7 local-runner orchestration pass adds
`run-staging-publish.mjs`. It accepts one downloaded frozen request plus an
explicit private-media root, produces and verifies the complete review set,
prints the controlled repository plan and stops with `plan_ready` unless the
operator also supplies `--apply`, external backup and artifact paths.

Apply mode reuses the transactional application adapter, then runs the existing
`lint`, `typecheck`, `test`, `release:staging` and output verification commands.
It packages the existing `release/staging/` output and writes a bounded local
result containing request/snapshot identity, manifest/artifact SHA-256 and stage
statuses. Its maximum success is deliberately `release_ready`: deployment and
smoke remain `skipped`, no remote upload occurs and no admin request is silently
marked deployed.

The Publishing navigation action is now sticky at the bottom of the admin
sidebar. `Staging Talebi Oluştur` remains visually unavailable when there are
no unpublished changes but retains an accessible click response that displays
`Henüz yayınlanacak bir güncelleme yapılmadı.` without opening the confirmation
prompt or calling the PHP mutation endpoint.

The 2026-09-01 Phase 7 canonical-article-registry pass closes the gap between
review-only localized article output and the public static generator. The
materializer now merges ready Turkish records by stable ID into the complete
canonical `article-records.json`, preserving every unaffected published record
and existing tag IDs. New records receive no invented tags. Existing covers are
preserved unless an explicit central cover is selected.

Explicit ready English content is emitted to the typed
`article-admin-records.en.json` overlay and consumed by `articles.en.ts` and the
release snapshot. Existing verified handwritten English copy remains as the
legacy fallback for unaffected articles; a new Turkish article without explicit
English is omitted from English routes rather than translated or synthesized.
The merge rejects duplicate stable IDs or slugs in both locales.

The 2026-09-01 Phase 7 repository-application pass adds a local trusted-runner
adapter with an explicit plan/apply split. The default command only emits the
exact manifested create/replace/unchanged file plan. `--apply` is separately
required and re-verifies the snapshot-bound review manifest, enforces a narrow
content/media path allowlist and rejects any overlapping tracked or untracked
Git change before writing.

Application stages every changed byte and rechecks size/SHA-256, requires a new
or empty backup root outside the repository, preserves each replaced original
plus a backup manifest and restores already-touched targets if a later operation
fails. It never runs Git commit, build, release or deployment. The adapter was
tested only against temporary repositories and was not executed on the user's
current dirty worktree.

The 2026-09-01 Phase 7 runner-result pass adds the bounded return channel for
the manual staging runner. Owner/Admin can explicitly move a matching frozen
request from `awaiting_runner` to `running`, then record either
`staging_succeeded` or `failed`. Every mutation requires the canonical request
ID, exact snapshot hash, same-origin CSRF-protected admin session and the locked
private publish store.

Terminal results contain only a review-manifest SHA-256, optional/required
artifact SHA-256, the six allowlisted stage statuses, a 300-character safe
summary, reporter and timestamp. Success requires materialization, validation,
build, release, deployment and smoke stages all to pass plus an artifact hash;
failure requires an explicit failed stage. Invalid transitions, mismatched
snapshots and contradictory results fail closed. Start and identical terminal
retries are idempotent. No credential or unrestricted runner log is accepted.

The 2026-09-01 Phase 7 manual-runner handoff selects the initial staging
transport without introducing a webhook secret or pretending cPanel can build
Next.js. An Owner/Admin can download an exact frozen publish-request JSON from
the Publishing Center. The endpoint resolves only canonical request IDs inside
the private publish store, returns an attachment with no-store admin headers and
audits the snapshot download. Private media remains outside HTTP transport and
is downloaded to the trusted runner workspace through authenticated cPanel
File Manager access.

The initial runner host is the operator-controlled workstation that already has
the repository, Node.js and the verified release commands. Downloading a
snapshot does not claim the request, change its `awaiting_runner` status, apply
repository files, build or deploy. Authenticated result reporting and atomic
repository application remain the next Phase 7 implementation boundary.

The 2026-09-01 Phase 7 review-manifest pass completes the tested review-output
adapter boundary. After JSON, localized Markdown and referenced private media
are materialized, `review-manifest.json` records the frozen snapshot hash plus
the exact sorted output path, byte size and SHA-256 for every generated file.
The expected set is derived from the validated materialization models rather
than accepting arbitrary files found in the output directory.

Manifest creation and later verification fail closed on missing, extra,
duplicate, reordered, symlinked or modified outputs. The CLI verifies its newly
written manifest before reporting success. This still performs no repository
application, Git operation, build or deployment; enabling those transitions
requires a reviewed external runner/transport decision.

The 2026-09-01 Phase 7 binary-media pass adds a review-only copier for private
vehicle uploads and referenced central article covers. The runner must provide
the environment-specific private `data_root` explicitly; the adapter resolves
only the fixed `media/vehicles/<opaque-id>.<ext>` and
`media/library/<opaque-id>.<ext>` stores. Real-path containment prevents a
symlink or crafted path from escaping that private root.

All referenced sources are preflighted before any output is written: opaque ID,
extension, recorded size and frozen SHA-256 must match. Only after the complete
set passes are vehicle binaries copied to both detail and card review paths and
deduplicated article covers copied to a content-addressed Filo Rehberi path.
Destinations are contained beneath the separate review root, symlink targets
are rejected, duplicate destinations fail closed, and every copied destination
is rehashed. Unreferenced central media is not copied. Repository application,
Git operations and deployment remain disabled.

The 2026-09-01 Phase 7 localized-article pass adds deterministic review-only
Filo Rehberi materialization. A frozen request now produces
`article-materialization.json` plus canonical TR/EN Markdown review files under
the existing content path shape. Each locale records its explicit category,
public route, metadata and content path. Turkish must be `ready` for an article
to be emitted; English is emitted only when explicitly present and `ready`.
Missing or draft English remains `null` and never receives synthesized copy.

Article materialization validates the request hash, stable IDs, the six
canonical category mappings, locale-specific slug uniqueness, dates, reading
time, bounded required metadata/Markdown and referenced private cover media.
Draft-only Turkish records are omitted from public review output. All output
remains in a separate review directory; no repository Markdown, route, commit,
build or deployment is mutated by the adapter.

The 2026-09-01 Phase 7 media-contract pass removes the remaining handwritten
vehicle media/licence catalogue from TypeScript. The 28 reviewed public vehicle
assets now live in the versioned `src/data/vehicle-media.json` contract with
dimensions, alt text, provenance, licence, derivative note and SHA-256 checksum.
Public rendering is unchanged. Release assembly validates schema, IDs, HTTPS
provenance, referenced files and checksums instead of parsing TypeScript text.

The review-only snapshot materializer now writes a fourth normalized output,
`vehicle-media.json`. Existing repository media is retained for published
vehicles; an approved private `draftMedia` record becomes deterministic,
content-addressed metadata carrying its private source media ID. The subsequent
contained copy pass verifies and emits referenced private binaries into the
separate review root. Featured vehicles fail closed when no media can be
materialized. No repository file is applied by either review-only step.

The 2026-09-01 subscriber reliability pass fixes correction of previously
unsubscribed contacts: returning a contact to an active status now clears the
obsolete `unsubscribed_at` value in both the editor state and submitted
operation. Safe backend validation codes are rendered beside the relevant
fields in red instead of collapsing every rejection into `Kayıt
güncellenemedi.` Contact date columns now use server-side, full-result
three-state sorting (newest, oldest, default) before pagination.

Dashboard draft content is now counted from the environment-private live
`drafts/articles.json` store rather than the build-time public snapshot. The
dashboard metrics are refetched whenever the authenticated user returns to the
Dashboard view, so newly created drafts no longer require a full browser reload.

The 2026-09-01 admin navigation pass splits vehicle operations into Published
Vehicles and Draft Vehicles, and Filo Rehberi into Published Blogs and Draft
Blogs. Published views now filter strictly to public-status records; draft
vehicles are every private record not currently `published` and use the same
editor to return to publication. Draft Blogs reads only the private article
draft store.

IYS export now downloads a newly created CSV immediately. A first environment,
or an orphan checkpoint with no CSV artifact, starts from the epoch so migrated
older pending consent is not silently stranded. Owner/Admin now has a named,
reason-required subscriber correction operation covering status, source,
consent version/dates, unsubscribe state, IYS and recipient type. Creation time
remains immutable and update time is server-owned. Every correction uses the
shared lock, atomic replacement, semantic consistency checks and before/after
field audit; resubscription is explicit rather than an ordinary toggle.

Publishing is now visually separated as the orange `Yayına Al` action at the
bottom of the sidebar. `awaiting_runner` still means only that a validated
snapshot was frozen: no build or deploy occurs until an external authenticated
runner host/transport and result callback are implemented.

The 2026-09-01 Filo Rehberi interaction pass makes each complete published
content card the edit/import trigger, matching vehicle cards without nesting
interactive controls. Existing private drafts open directly; repository-backed
records retain the explicit import confirmation boundary. The article editor
now shares backdrop/Close/Escape dismissal and unsaved-change confirmation with
the vehicle editor.

The 2026-09-01 vehicle operations UI now presents both all and published
vehicles in the same horizontal two-column visual language as Filo Rehberi.
Records are always ordered and grouped by Turkish A–Z brand headings, then by
model and trim. Each complete card opens the editor. The wider editor closes on
backdrop click, Close or Escape and requires explicit confirmation whenever
form input has changed without a successful save.

Phase 7 now has its first repository-side materialization adapter. Featured
vehicles use an explicit four-ID ordered JSON contract in the public build, and
the release snapshot carries that same order. A local runner utility verifies
the frozen request hash and writes reviewed vehicle portfolio, price and
featured-order outputs into a separate directory; it does not mutate the
repository, commit, build or deploy automatically.

The 2026-09-01 staging evidence proves the private 32-record vehicle store and
`vehicles.php` are healthy and that no custom taxonomy file exists. The tags
503 was reproduced from numeric-only model names such as `2008`: PHP converts
numeric string array keys to integers, which violated the strict string taxonomy
ID boundary. Values are now normalized back to strings and a numeric-model
regression test protects the fix. A refreshed staging deployment is required.

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
   target artifact. GitHub Actions is the selected staging runner; private PHP
   dispatch and runner bearer credentials remain split across cPanel and the
   GitHub `staging` environment. PHP does not reimplement the Next.js build.

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
repository contracts and runs generation/validation/tests/build/release before
deploying the target artifact. The Phase 7 staging runner uses an ephemeral
checkout; the reviewed Git commit/promotion step remains Phase 8 and must bind
the exact staging-approved snapshot. Staging success is recorded before
production can be requested.

### Architecture Decision AD-002: no database in the initial implementation

The verified production capability is PHP 8.5.8 `cgi-fcgi`; PDO SQLite, SQLite,
MySQL provisioning, and Git availability have not been verified. The local PHP
8.5.9 installation also has PDO but no PDO drivers. Initial stores therefore use
versioned JSON/JSONL/CSV files with advisory locks, atomic replacement,
restrictive permissions, explicit schemas, and bounded reads. Revisit SQLite
only after production extension, backup, concurrency, and migration behavior
are verified. No ORM is planned.

### Architecture Decision AD-003: workstation runner + cPanel Terminal activation

**Decision:** the first staging runner is the operator-controlled development
workstation. Owner/Admin downloads the frozen request through the authenticated
admin session; referenced private media is downloaded separately through the
authenticated cPanel File Manager into the explicit private-data input root.
The workstation creates a hash-bound `release_ready` ZIP. The operator uploads
that ZIP and the reviewed executor to an account-private directory with File
Manager and activates it with one explicit browser-Terminal command. No
deployment credential is passed through the admin browser or committed to Git.

**Why:** TURKTİCARET has confirmed that external SSH/SFTP is unavailable while
cPanel Terminal and File Manager are available. This keeps Node/npm off cPanel
and avoids an account-wide API token, FTP credential, unprovisioned CI provider,
webhook secret or background service. The immutable snapshot hash,
private-media checksums, complete review manifest, artifact hash and deployed
release marker preserve end-to-end identity. Same-filesystem directory moves
provide a bounded activation and retained rollback transaction.

**Limit:** File Manager upload and Terminal activation remain an explicit human
operation. A downloaded request or `release_ready` artifact is not a successful
publish. Requests remain `awaiting_runner` until live marker verification and
HTTPS smoke pass and the authenticated result contract records all stages.
Production is not enabled by this decision.

**Alternatives reviewed:** cPanel API tokens can authenticate UAPI calls over
HTTPS port 2083 and Fileman can upload files, but that does not alone provide
the complete project-owned atomic activate/rollback transaction. FTPS provides
file transfer but no release switch. GitHub Actions would still require one of
those powerful transport credentials plus a safe server-side activator. These
options may be reconsidered only after the manual staging workflow and rollback
drill are proven; they are not prerequisites for Phase 7 staging.

### Architecture Decision AD-004: GitHub Actions build + machine-authenticated PHP activation

**Decision:** AD-004 supersedes AD-003 as the normal staging transport. The
authenticated PHP control plane dispatches a `workflow_dispatch` event to the
fixed repository/workflow/ref configured outside the document root. GitHub
Actions is the external Node/PHP build runner. A separate high-entropy bearer
token binds runner requests to a frozen request, snapshot hash and GitHub run
ID. The PHP backend receives a manifest-bound USTAR in bounded chunks and owns
the staging-only atomic activation and rollback transaction.

**Why:** the host explicitly blocks external SSH/SFTP and has no Node runtime.
cPanel UAPI upload would still require a broad account credential and does not
provide this project-specific atomic release validation/swap. cPanel's archive
extraction API is legacy/deprecated and lacks a current UAPI equivalent. A
narrow project-owned PHP activator needs neither credential and can enforce the
exact request, archive and release-manifest contract before touching staging.

**Secret boundary:** cPanel stores a fine-grained GitHub token limited to the
single repository with Actions write permission; GitHub stores only the raw
staging runner bearer token. cPanel stores only its SHA-256 hash. Neither value
is returned by `publishing.php`, stored in a request, logged, committed or sent
to the admin browser. Production has no equivalent automation configuration yet.

**Failure boundary:** validation/build failure never uploads. Upload and deploy
are idempotent by request, run, artifact and chunk hashes. A new release is
served only after full extraction/manifest validation. The former document root
is retained privately; failed live smoke triggers an authenticated rollback.
Stale-run recovery and retention cleanup are operational follow-ups after the
first live staging drill.

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
- TURKTİCARET Web Eko explicitly does not permit external SSH/SFTP. cPanel's
  browser Terminal and File Manager are available as bootstrap/recovery tools;
  the active automated staging boundary is AD-004.

- cPanel File Manager and browser Terminal are needed only for the one-time
  automation bootstrap and recovery fallback, not routine staging publishes.
- Automatic staging requires PHP `curl` for GitHub dispatch and `PharData` for
  non-executable TAR extraction. The UI reports either missing capability and
  the first live run must prove both on the target host.

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

- Automated staging uses two independent credentials: a cPanel-only
  least-privilege GitHub Actions dispatch token and a GitHub-only raw runner
  bearer token whose hash alone is stored on cPanel. Runner operations bind the
  frozen request ID, snapshot SHA-256 and immutable GitHub run ID.
- The runner cannot list/download arbitrary private files: media requests must
  match an ID, extension, size and SHA-256 already present in the frozen
  snapshot. Uploads are capped at 128 one-MiB chunks and 128 MiB total.
- Deployment rejects absolute/traversal/control-character paths, duplicates,
  links, devices, unsupported TAR extensions and all files absent from the
  generated release manifest. Every extracted byte is size/hash verified before
  the staging document root changes.

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
| `/admin/araclar/` | All/draft vehicle views, filters and CRUD | 3 |
| `/admin/araclar/yeni/` | Vehicle creation | 3 |
| `/admin/araclar/[id]/` | Vehicle editor | 3 |
| `/admin/one-cikan-araclar/` | Exactly four ordered featured vehicles | 3 |
| `/admin/filo-rehberi/` | All/private-draft article views and translation completeness | 4 |
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
| `POST /admin-api/subscriber-operation.php` | Explicit audited unsubscribe/IYS or reason-required Owner correction | 5 |
| `GET /admin-api/iys.php` | State and export history | 5 |
| `POST /admin-api/iys-export.php` | Generate export | 5 |
| `GET /admin-api/iys-download.php?id=` | Authorized CSV download | 5 |
| `GET,POST /admin-api/campaigns.php` | Campaign list/create | 6 |
| `GET,PATCH /admin-api/campaign.php?id=` | Campaign edit/read | 6 |
| `POST /admin-api/campaign-test.php` | Allowlisted test mail | 6 |
| `GET,POST,PATCH /admin-api/campaign-queue.php` | Queue history, audience freeze and queued cancellation | 6 |
| `GET /admin-api/publishing.php` | Change set and publish history | 7 |
| `POST /admin-api/publish-staging.php` | Validate/freeze staging request | 7 |
| `GET /admin-api/publish-request-download.php?id=...` | Owner/Admin frozen request download for the trusted manual runner; audited | 7 |
| `POST /admin-api/publish-runner-result.php` | CSRF-protected bounded start/result transitions tied to request and snapshot | 7 |
| `GET /admin-api/publish-runner-request.php` | Runner-token claim and exact frozen snapshot download | 7 |
| `GET /admin-api/publish-runner-media.php` | Runner-token download of snapshot-referenced private media only | 7 |
| `POST /admin-api/publish-runner-upload.php` | Idempotent 1 MiB checksum-bound artifact chunk upload | 7 |
| `POST /admin-api/publish-runner-deploy.php` | Manifest verification and staging-only atomic activation | 7 |
| `POST /admin-api/publish-runner-rollback.php` | Same-run rollback to the retained previous staging release | 7 |
| `POST /admin-api/publish-runner-complete.php` | Machine-authenticated bounded terminal build/deploy result | 7 |
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
`src/data/vehicle-list-prices.json`, `src/data/featured-vehicle-ids.json` and the
normalized `src/data/vehicle-media.json` contract. Existing 32-record
IDs/source IDs and price meaning remain authoritative. TypeScript now adapts the
JSON contract into the existing strongly typed public model; media and licence
records are no longer handwritten inside a source module.

Fields include the supplied identity, labels, power/seats, slug, summary,
features, priority, source/content/price states, monthly list-net price, media,
licence and future SEO fields. Archive/unpublish is a status transition, not a
destructive delete. Price and factual state changes receive revisions and audit.

Featured order uses the explicit four-ID contract
`src/data/featured-vehicle-ids.json`. This contract is now implemented and
drives `featuredOrder` in both TR/EN homepage rendering. Publication fails unless it contains four
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

Repository vehicle media uses `vehicle-media.json` schema version 1. Each
record is keyed by vehicle ID and includes its safe filename, dimensions,
public alt copy, creator/source/licence evidence, derivative note and
SHA-256 checksum. Release assembly rejects missing assets, checksum drift,
unknown vehicle references, duplicate IDs and missing featured media. The Phase
7 review adapter can emit admin-upload metadata with a content-addressed public
filename; its contained copy pass now transfers only referenced, checksum- and
size-verified private binaries into the separate review root.

The binary review adapter now implements that copy boundary. Vehicle
`draftMedia` is read only from the private vehicle media store and written to
both `/images/vehicles/` and `/images/vehicles/cards/` review paths using its
content-addressed filename. Referenced Article/General library covers are read
only from the private library store and written under
`/images/filo-rehberi/`. Source and destination bytes must match the frozen
checksum and size; no unreferenced library asset crosses the boundary.

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

The Owner/Admin correction operation may repair status, source, consent
version/dates, unsubscribe state, `iys_status` and `recipient_type` only with a
mandatory reason and audited changed-field list. `created_at` is immutable and
`updated_at` is server-owned. Approved/synced requires an approved row with
explicit consent date/version and no unsubscribe timestamp; unsubscribe state
and timestamp must remain consistent.

## IYS Model

The existing CLI exporter, daily state file, CSV schema and manual portal upload
remain authoritative. Admin adds visibility, generation and controlled download,
not an invented portal API. Export files and result imports are private and
audited. `pending`, `failed`, and verified `synced` are distinct; CSV creation is
not synchronization. Portal template/enums must be reverified before live use.
Newly generated CSV files download immediately. A checkpoint is trusted only
when at least one matching private CSV artifact exists; otherwise the exporter
recovers all older still-pending/failed consent records on the next run.

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
`release:production` remain the only build/release entry points. The staging CI
workflow calls these commands; it does not duplicate them. The staging runner
secret name and split cPanel/GitHub secret boundary are documented under AD-004.
No secret values are stored.

The vehicle review adapter now emits portfolio, price, featured-order and media
JSON contracts. It accepts the current normalized repository media source as an
explicit input and never generates TypeScript. Admin-upload metadata retains
the opaque private media ID and checksum so the following binary materializer
can locate and verify the exact source without trusting a browser filename.

The same review command now emits a localized article manifest and Markdown
files. The manifest carries explicit TR and EN canonical category/route
contracts. It excludes Turkish drafts and represents missing English as `null`;
there is no translation fallback. These review files are not yet applied to the
current Turkish-centric generator because atomic application and complete
output-manifest verification remain pending.

The command now also requires an explicit `--private-data-root`. It preflights
the complete referenced private-media set before copying, so a missing or
tampered later asset cannot leave a partially copied review set. The result is
still a review directory only; no credential, remote transport or direct Git
write is involved.

The final review directory contains `review-manifest.json`. Its schema version,
frozen snapshot hash and lexically ordered records bind the complete expected
JSON, Markdown and binary set to exact byte sizes and SHA-256 values. Both
creation and verification reject missing, extra, duplicate, symlinked or
changed outputs. The manifest itself is control metadata and is excluded from
its own recursive file list.

Manual runner reporting uses `awaiting_runner → running → staging_succeeded`
or `failed`. A successful terminal record requires all six stages to pass and binds
both review manifest and staging artifact SHA-256 values. Failed results identify
the failed stage and may omit an artifact when release never completed. These
records report operator-observed outcomes; they do not themselves run or repeat
any build/deployment command.

The local orchestrator does not duplicate the public build implementation. It
calls the existing quality scripts and `release:staging`, then packages that
release. `plan_ready` means no repository mutation; `release_ready` means only
that a verified artifact exists locally. Neither is accepted as deployment or
smoke-test success without the later explicit transport step.

The manual hosting-compatible transport remains a cryptographically bound
bootstrap/recovery fallback. Normal staging publication now uses AD-004; a
File Manager upload alone never constitutes deployment success.

Repository application is a separate local CLI boundary. Its plan includes the
path action, before/after SHA-256 and size for every manifested output. Only the
five reviewed data JSON contracts, localized Filo Rehberi Markdown and
content-addressed vehicle/article media paths are allowed. Apply requires an
external backup directory and a clean target set. Localized article output now
targets the canonical Turkish registry and English admin overlay directly; the
intermediate `article-materialization.json` is no longer an applied build input.

## Staging Deployment Model

The active model is AD-004. `POST publish-staging.php` creates or reuses the
immutable request and immediately dispatches GitHub Actions. The runner claims
the request, downloads only snapshot-bound inputs, executes the existing
materialize/apply/lint/typecheck/test/release/verify chain and sends a
release-manifested USTAR to the PHP control plane in bounded chunks. The PHP
activator performs all archive and extracted-file verification before a
same-filesystem document-root rename. GitHub verifies the live marker and HTTPS
smoke contracts; only then is the request `staging_succeeded`. A failed smoke
attempts rollback and records `failed`. The admin UI polls status every eight
seconds and no longer accepts handwritten runner evidence in the normal flow.

Successful request fingerprints form the staging publication baseline. Files
whose current SHA-256 equals their last successful fingerprint are not shown as
unpublished merely because the private draft file exists.

### One-time AD-004 bootstrap

1. Commit and push this code so `admin-staging-publish.yml` exists on the
   repository default branch.
2. Generate a fresh 32-byte hexadecimal runner token locally. Put the raw token
   only in the GitHub `staging` environment secret
   `KALITE_FILO_STAGING_RUNNER_TOKEN`; put only `SHA-256(raw token)` in cPanel.
3. Create a fine-grained GitHub personal access token limited to
   `MuratAyar/kalite-filo-website` with repository **Actions: Read and write**.
   Put it only in the private cPanel config as `github_token`.
4. Add this block to the existing private staging `config.php` array (using real
   private values, never these placeholders):

```php
'publishing_automation' => [
    'enabled' => true,
    'repository' => 'MuratAyar/kalite-filo-website',
    'workflow' => 'admin-staging-publish.yml',
    'ref' => 'main',
    'github_token' => 'PRIVATE_FINE_GRAINED_GITHUB_TOKEN',
    'runner_token_hash' => '64_LOWERCASE_HEX_SHA256',
],
```

5. Install the updated staging release once with the existing manual ZIP
   process. Authenticated `GET /admin-api/publishing.php` must then report
   `automation.enabled: true` and `automation.ready: true`.
6. Make a synthetic draft change and use `Staging Oluştur`. Do not enable any
   production automation during this drill.

Staging is the first enabled publish target. Its static build bakes the staging
origin and global noindex policy into the artifact. Admin config/data, campaign
test recipients, deploy destination and audit are staging-specific. A runner
uploads `release/staging/` to the staging document root and reports a signed or
authenticated result to the private publish record. Smoke checks must pass before
the snapshot becomes production-eligible.

The original OpenSSH adapter is retained only as tested historical work and is
not usable on TURKTİCARET Web Eko. The active initial transport is documented in
`deploy/staging/README.md`: File Manager uploads the hash-bound ZIP and
`deploy-release.sh` to `private/kalite-filo-deploy/staging`; cPanel Terminal runs
the executor. The executor derives and permits only the canonical staging
document root beneath the authenticated account home, rejects unsafe ZIP paths
and symlinks, and uses a same-filesystem directory move for release activation.

The previous complete document root is retained under private `rollbacks/`.
Interrupted activation restores it automatically. HTTPS verification is a
separate workstation step bound to the live release marker. A failed smoke
requires the documented explicit Terminal rollback command and re-verification.
A planned drill can reapply the already verified preserved release and restore
the same rollback target without another upload. Production is deliberately
unsupported.

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
- Each manual staging release atomically moves the complete prior document root
  beneath `private/kalite-filo-deploy/staging/rollbacks/<release-id>`. Rollback
  swaps that directory back and preserves the failed release for diagnosis.

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
  - [x] Select initial manual runner host and authenticated request transport
  - [x] Implement tested snapshot-to-repository materialization adapters
    - [x] Add deterministic vehicle/price/featured-order review-output adapter
    - [x] Add normalized vehicle media/licence materialization
    - [x] Add localized Filo Rehberi Markdown/metadata materialization
    - [x] Add central media binary materialization and checksum verification
    - [x] Add complete deterministic review-output manifest and verification
    - [x] Add plan-first transactional repository application with overlap
      rejection and external recoverable backup
    - [x] Merge localized records into canonical TR registry and explicit EN
      overlay consumed by the static generator
  - [x] Run existing staging build/release commands and emit bounded
    `release_ready` status locally
  - [x] Implement staging-only artifact transport, rollback capture and
    automated HTTPS smoke verification
  - [x] Implement GitHub Actions dispatch, machine-authenticated snapshot/media
    fetch and hash-bound chunk upload without SSH/cPanel credentials
  - [x] Implement PHP USTAR preflight, extracted release-manifest verification,
    atomic staging activation and same-run rollback
  - [x] Replace manual result entry with direct `Staging Oluştur`, status polling
    and successful-publication fingerprint baselines
  - [ ] Bootstrap the automation endpoints/config once on cPanel and execute a
    live automated staging publish plus rollback drill
- [ ] **Phase 8:** production publish, rollback and version history
- [ ] **Phase 9:** request inbox, Site Settings and remaining operations
- [ ] **Phase 10:** security/accessibility/responsive audit and full regression

## Completed Tasks

- [x] Completed the first end-to-end live automatic staging publication.
- [x] Added expandable per-publication change details to Staging History.
- [x] Added authenticated staging-only atomic restore to a retained successful
  release, with confirmation, audit log and fingerprint-baseline update.
- [x] Added owner-only terminal history cleanup that preserves active requests
  and the latest successful publication baseline.
- [x] Reproduced `release_extraction_failed` with the real staging USTAR and
  identified the incompatible literal `.` root archive entry.
- [x] Changed staging artifact packaging to sorted top-level entries and proved
  the resulting archive extracts successfully through PHP `PharData`.
- [x] Added a regression test prohibiting the dot root operand.
- [x] Added bounded malformed-response diagnostics without echoing potentially
  sensitive response bodies into GitHub Actions logs.
- [x] Added authenticated early runner failure reporting so claim/input errors
  no longer leave publication records indefinitely shown as queued/running.
- [x] Added the early-failure PHP endpoint to release assembly and tests.
- [x] Proved the automatic runner through release build and isolated the second
  live failure to the PHP artifact activation boundary.
- [x] Added safe deploy-stage failure codes to PHP and surfaced them in GitHub
  Actions without exposing server paths, exception text or secrets.
- [x] Updated checkout/setup-node actions to their Node-24-based v5 releases.
- [x] Fixed clean GitHub runner typechecking by generating Next.js route types
  with `next typegen` before strict `tsc` validation.
- [x] Proved the live admin-to-GitHub dispatch, queued/in-progress/failed status
  polling and bounded failure reporting path with the first staging attempt.
- [x] Fixed the GitHub Actions workflow context validation error by replacing
  invalid job-level `runner.temp` expressions with step-time `$RUNNER_TEMP`
  paths.
- [x] Replaced recurring manual cPanel staging publication with a one-click
  GitHub Actions dispatch from the authenticated Publishing Center.
- [x] Added staging-only machine authentication, request/run/snapshot binding,
  private referenced-media transfer and bounded checksum-verified chunk upload.
- [x] Added complete release manifests, strict USTAR preflight, extracted file
  set/hash verification, atomic document-root activation and automatic rollback
  request after failed HTTPS smoke.
- [x] Added automatic admin status polling and a successful-publication
  fingerprint baseline so unchanged drafts are no longer repeatedly offered.
- [x] Kept production automation disabled and retained the manual procedure only
  as a bootstrap/recovery fallback.

- [x] Recorded provider confirmation that Web Eko has no external SSH and
  superseded the unusable OpenSSH staging transport.
- [x] Added a secrets-free release identity marker bound to request, snapshot
  and review-manifest hashes.
- [x] Added a staging-only cPanel Terminal executor with ZIP traversal/symlink
  rejection, SHA-256 verification, atomic document-root swap and retained
  rollback/failed-release state.
- [x] Added local live-marker verification and bounded HTTPS smoke finalization
  without cPanel API, FTP or SSH credentials.
- [x] Documented the exact File Manager, Terminal, finalization and rollback
  workflow under `deploy/staging/README.md`.

- [x] Retained the tested OpenSSH adapter as historical evidence, then marked it
  unsupported after the provider confirmed Web Eko has no external SSH/SFTP.

- [x] Added a plan-first local staging runner that composes frozen snapshot
  materialization, manifest verification, transactional apply and existing
  quality/release commands without duplicating build logic.
- [x] Added bounded `plan_ready`, fail-closed stage evidence and `release_ready`
  result files with manifest/artifact hashes while leaving deploy/smoke skipped.
- [x] Kept `Yayına Al` sticky at the sidebar bottom and added an accessible
  no-change warning without issuing an empty staging request.

- [x] Added stable-ID canonical Turkish article registry merge that preserves
  unaffected published records, existing tags and verified covers.
- [x] Added a typed English admin overlay consumed by public routes and release
  snapshots while retaining legacy verified copy for unaffected articles.
- [x] Added tests for registry update/add, unaffected-record preservation,
  existing-tag preservation and no invented missing-English record.

- [x] Added `apply-admin-materialization.mjs` with manifest-bound plan mode and
  separately authorized `--apply` mode.
- [x] Added strict repository path allowlisting, dirty-target rejection,
  pre-staging verification, external backup manifest and failure restoration.
- [x] Added temporary-Git integration tests for create/replace with backup,
  overlapping local changes and a manifested path outside the allowlist.

- [x] Added a locked, atomic and idempotent manual-runner state machine bound to
  canonical request ID and frozen snapshot hash.
- [x] Added CSRF/role-protected runner start/result API with bounded hashes,
  allowlisted stage statuses, safe summary, reporter/timestamp and audit events.
- [x] Added Publishing Center controls for runner start and success/failure
  reporting with manifest/artifact SHA-256 and explicit failed-stage selection.

- [x] Selected the operator-controlled workstation as the initial staging
  runner and documented authenticated admin download plus cPanel File Manager
  private-media transfer as the minimal transport.
- [x] Added an Owner/Admin-only audited frozen-request download endpoint with
  canonical ID validation, real-path containment and attachment headers.
- [x] Added snapshot hash visibility and `Snapshot İndir` access to staging
  request history without changing `awaiting_runner` or implying deployment.

- [x] Added `review-manifest.json` with snapshot identity, deterministic path
  ordering, exact byte sizes and SHA-256 for all generated JSON, Markdown and
  referenced binary outputs.
- [x] Derived the permitted file set from validated materialization results and
  rejected missing, extra, duplicate, reordered, symlinked or modified output.
- [x] Added integration coverage for successful full-set verification and
  separate missing, extra and checksum-drift failures.

- [x] Added explicit-private-root binary materialization for vehicle uploads
  and referenced central article covers with fixed opaque source paths.
- [x] Added real-path source/output containment, destination symlink and
  duplicate-path rejection, full-set preflight and source/destination SHA-256
  plus byte-size verification.
- [x] Added deterministic vehicle detail/card and content-addressed article
  cover review paths while excluding every unreferenced central media record.

- [x] Added deterministic localized article manifest and Markdown review
  outputs with canonical TR/EN category and public route mappings.
- [x] Enforced ready-only Turkish publication and explicit ready-only English
  emission; missing or draft translations remain absent instead of synthesized.
- [x] Added fail-closed article identity, slug, metadata, date, reading-time,
  content-size and cover-media validation plus contained review writes.

- [x] Migrated 28 reviewed vehicle media/licence records from handwritten
  TypeScript into a versioned, checksum-bearing JSON source contract.
- [x] Replaced release-time TypeScript regex parsing with strict normalized
  media schema, file, provenance, featured coverage and checksum validation.
- [x] Extended the review-only vehicle materializer with deterministic existing
  and admin-upload media metadata output; direct repository application and
  private binary copying remain disabled.

- [x] Fixed subscriber resubscription so an obsolete unsubscribe timestamp is
  cleared automatically instead of causing a consistency rejection.
- [x] Added safe, field-specific subscriber correction diagnostics to the edit
  modal while retaining server-side consent and IYS consistency validation.
- [x] Added full-result, server-side three-state sorting to subscriber date
  columns before pagination.
- [x] Changed the Dashboard draft-content metric to the live private article
  draft store and refetch it whenever Dashboard is revisited.

- [x] Split vehicle navigation into Published Vehicles and Draft Vehicles, with
  unpublished drafts editable and returnable to published status.
- [x] Split Filo Rehberi navigation into Published Blogs and private Draft Blogs.
- [x] Added immediate authenticated CSV download after successful IYS export
  and recovery for first/orphan checkpoints that previously stranded older
  pending records.
- [x] Added a controlled subscriber IYS editor for status and recipient type,
  with atomic CSV replacement, role/CSRF enforcement, consent guards and audit.
- [x] Classified subscriber and IYS audit events under their correct entity
  types instead of authentication.
- [x] Expanded Owner/Admin subscriber correction to status, source, evidence
  dates/version, unsubscribe state, IYS and recipient type with mandatory reason,
  immutable creation time, server-owned update time and semantic validation.
- [x] Moved publishing to an orange bottom-sidebar `Yayına Al` action and added
  an in-product explanation for `awaiting_runner` requests.

- [x] Made complete Filo Rehberi cards accessible edit/import triggers while
  retaining explicit confirmation before repository content becomes a draft.
- [x] Added article editor backdrop/Close/Escape dismissal with shared
  unsaved-change confirmation behavior.

- [x] Redesigned all/published vehicle cards as horizontal two-column admin
  operation cards aligned with the Filo Rehberi card language.
- [x] Added deterministic Turkish A–Z brand grouping with model/trim ordering.
- [x] Made the entire accessible vehicle card open the edit interface while
  preserving a visible Edit affordance.
- [x] Added backdrop/Close/Escape editor dismissal with unsaved-change
  confirmation and a wider Filo Rehberi-aligned editing surface.

- [x] Replaced implicit featured boolean/portfolio-order behavior with an
  explicit, build-validated four-ID ordering source while preserving the current
  homepage cards and order.
- [x] Added a hash-verifying repository-side vehicle materializer that produces
  review-only portfolio, price and featured JSON outputs and rejects tampering,
  duplicates, invalid prices and invalid featured references.
- [x] Isolated the live tag incident from vehicle storage and hardened taxonomy
  reads for absent, unreadable, oversized, malformed and wrong-schema stores.
- [x] Added taxonomy regression coverage proving vehicle-derived default values,
  custom-value merging and safe malformed-JSON classification.

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

Deploy and staging-smoke-test Publishing Center history details, owner-only
history cleanup and retained-release restore. After deployment, explicitly
clear the obsolete historical records requested by the operator, create at
least two controlled staging versions, restore the earlier one, and confirm the
newer admin draft returns to unpublished changes. Production remains disabled.

The bootstrap, dispatch and clean build paths are live. Push the deploy
diagnostics and Actions v5 update, create and install one updated staging
bootstrap release so the PHP endpoint can emit its bounded failure reason, then
retry the retained unpublished change. Use the returned reason code (or a
successful activation) to complete the hosting proof.

The immediate retry must include the malformed-response/early-failure update in
both GitHub `main` and the staging PHP bootstrap. If the request endpoint still
returns malformed data, the next Actions log will identify its safe response
class; Admin Dashboard will also move the request to `failed` instead of
remaining at `GitHub Actions sırasında`.

The extraction root cause is now fixed. Push the archive packaging change to
`main` and create a new staging publish attempt. The cPanel endpoints already
support this corrected artifact format; do not upload another bootstrap ZIP
solely for the tar fix.

The workflow context validation blocker is resolved locally. The immediate
operator action is now to commit/push the workflow and automation code, verify
the GitHub Actions workflow is visible, and install the generated bootstrap ZIP
once in the staging document root.

No recurring File Manager or cPanel Terminal action is expected after this
one-time bootstrap. Do not mark Phase 7 complete until the target host proves
PHP curl/PharData, POST chunk handling, same-filesystem rename and rollback.

Historical note: the earlier cPanel Terminal activation task below was
superseded by AD-004. Keep its executor only as a recovery fallback. The
separate task to revoke/delete the accidentally disclosed SSH key still applies.

Deploy and staging-smoke-test subscriber resubscription, modal validation,
three-state date sorting and the live Dashboard draft-content metric.

Deploy and staging-smoke-test published/draft list separation, automatic IYS
download, controlled subscriber correction and the relocated `Yayına Al` UI.

Deploy and smoke-test the completed Filo Rehberi card/editor interaction update
on HTTPS staging.

Deploy and smoke-test the completed vehicle card/editor interaction update on
HTTPS staging, including filtered and published-only result sets.

Deploy and verify the numeric-model taxonomy fix on HTTPS staging. A missing
`vehicle-taxonomy.json` is valid and must seed groups from vehicles; it will be
created atomically only after the first custom tag mutation.

Phase 7 publishing requests now feed the AD-004 GitHub Actions runner. cPanel
still never runs Node/Next.js; it dispatches, serves only frozen bounded inputs,
validates the returned static artifact and performs the staging-only swap.

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

- [ ] Deploy the new Publishing Center endpoints/UI through the now-working
  automatic staging flow and use `Geçmişi Temizle` to remove obsolete records.
- [ ] Perform a controlled retained-release restore drill and verify audit,
  baseline, current-site content and recovery of the displaced release.
- [ ] Define retention limits/cleanup for orphaned upload, incoming and rollback
  directories before closing Phase 7 completely.
- [x] Push the dot-root-free archive fix to `main`, retry `Staging Oluştur`, and
  verify activation, release marker and HTTPS smoke complete successfully.
- [x] Push and bootstrap the malformed-response diagnostics plus
  `publish-runner-fail.php`, then retry after the current queued attempt becomes
  stale (20 minutes from its last automation update).
- [x] Use the new HTTP/type/bytes/body classification to correct the actual
  request-response fault if it recurs.
- [x] Push the safe deployment diagnostics and Actions v5 update to `main`,
  rebuild the staging bootstrap ZIP, and install it once on cPanel staging.
- [x] Retry staging publish and capture the exact bounded `reason=...` value if
  activation still fails; do not infer a filesystem/Phar cause from HTTP 503.
- [x] Push the `next typegen` typecheck correction to `main` and retry the
  failed staging publication from the authenticated Publishing Center.
- [x] Confirm the retry reaches `staging_succeeded`, that the expected content
  is live, and that the published fingerprint clears the unpublished changes.
- [x] Remove the invalid job-level `${{ runner.temp }}` expressions from the
  staging workflow and use `$RUNNER_TEMP` during runner shell execution.
- [x] Push `.github/workflows/admin-staging-publish.yml` to the repository's
  default branch and create the GitHub `staging` environment.
- [x] Generate a new 64-character hexadecimal staging runner token; store only
  the raw value as GitHub secret `KALITE_FILO_STAGING_RUNNER_TOKEN` and only its
  SHA-256 hash in private cPanel `config.php`.
- [x] Create a fine-grained GitHub token limited to this repository with Actions
  write permission and store it only as private cPanel `github_token`.
- [x] Perform the one-time manual staging release bootstrap, enable automation,
  confirm `publishing.php` reports `automation.ready: true`, and run the first
  one-click staging publish.
- [ ] Prove failed-smoke rollback or a controlled rollback drill and define
  retention cleanup for old upload/incoming/rollback directories.
- [x] Add conservative stale queued/running run re-dispatch (20/45 minutes).

- [x] Add deterministic TR/EN article Markdown and metadata review outputs from
  the frozen publish request without inventing a missing translation.
- [x] Add contained binary materialization for vehicle draft media and central
  article media; verify every copied byte against the frozen SHA-256 checksum.
- [x] Add a review-manifest test covering the complete expected output file set
  before any atomic repository application or Git operation is enabled.
- [x] Add plan-first transactional repository application with strict path
  allowlisting, dirty-target rejection and recoverable external backup.
- [x] Convert localized article materialization into the existing canonical
  build registry while preserving unaffected published content and explicit
  missing-translation semantics.
- [x] Add local plan/apply/validate/release orchestration with bounded
  `release_ready` evidence and no implicit deployment.
- [x] Select and implement staging-only artifact transport, rollback capture and
  automated HTTPS smoke verification; credentials remain external secrets.
- [x] Obtain provider confirmation that external SSH is unavailable on Web Eko;
  supersede the SSH transport instead of continuing port/key discovery.
- [x] Record the historical cPanel hostname diagnostic; provider policy confirms
  that no hostname/port combination enables external SSH on this package.
- [ ] Revoke the accidentally disclosed cPanel deployment key, remove local
  copies after revocation; no replacement is required for the selected transport.
- [x] Implement the File Manager + cPanel Terminal executor, release marker,
  manual HTTPS finalizer and explicit rollback command.
- [ ] Execute the first automated staging deployment and rollback drill, then
  confirm machine-authenticated terminal evidence in the Publishing Center.

- [ ] Deploy the refreshed staging ZIP; edit the previously unsubscribed test
  contact back to an active status and verify its unsubscribe date becomes
  empty, its update timestamp advances and the correction audit is recorded.
- [ ] Submit one intentionally incomplete correction and confirm the precise
  red validation message appears inside the edit modal without closing it.
- [ ] Click each subscriber date heading three times and confirm newest-first,
  oldest-first and default order across paginated results.
- [ ] Return to Dashboard and confirm the private draft article count reports
  `1` for the currently observed staging store.

- [ ] Verify Published/Draft vehicle and Published/Draft blog tabs against live
  staging records; publish one synthetic draft vehicle and confirm it moves from
  Draft Vehicles into Published Vehicles.
- [ ] Generate the first staging IYS CSV with the existing older pending row;
  confirm browser download, private history entry and `iys` audit entity type.
- [ ] Correct a synthetic subscriber, including explicit unsubscribe reversal,
  and confirm reason/changed fields in the `subscriber` audit entity, immutable
  creation time and server-owned update time. Confirm inconsistent status/date
  or approved-IYS-without-evidence submissions are rejected.
- [x] Select the initial external runner host and authenticated request
  transport: Owner/Admin download to the operator workstation, with private
  media transferred through authenticated cPanel File Manager access.
- [x] Add authenticated bounded runner-result reporting with strict transitions,
  snapshot binding, hashes, stage results and safe audited summaries.

- [ ] On refreshed staging, click the image, title and empty card area of an
  existing Filo Rehberi draft and confirm each opens the correct editor.
- [ ] Click a published record without a draft and confirm the existing import
  approval remains required before its editor opens.
- [ ] Modify an article field and verify backdrop click, Close and Escape each
  show confirmation; Cancel must preserve the editor and Confirm must close it.

- [ ] On refreshed staging, confirm complete vehicle cards open the correct
  editor by mouse and keyboard in both All Vehicles and Published Vehicles.
- [ ] Confirm brands remain Turkish A–Z grouped after search/brand/segment
  filtering and each desktop row contains at most two horizontal cards.
- [ ] Change a field without saving and verify backdrop click, Close and Escape
  each show confirmation; verify Cancel preserves the editor and Confirm closes
  it. Confirm an untouched or successfully saved form closes without warning.

- [x] Provision the staging private Owner config and verify the session endpoint.
- [x] Verify first-attempt Owner login on HTTPS staging.
- [ ] Deploy the 2026-09-01 refreshed staging artifact, keep
  `drafts/vehicles.json` at its working `644` permission, then record the exact
  `/admin-api/tags.php` response. It must return five populated groups including
  model values `2008` and `3008` as strings.
- [x] Confirm `drafts/vehicles.json` is PHP-readable and
  `/admin-api/vehicles.php` returns the live 32-record draft. The supplied file
  works at `644` on cPanel.
- [x] Confirm no `vehicle-taxonomy.json` exists; absence is the expected initial
  state and is not a deployment or permission error.
- [ ] After tags load, create one harmless custom label in the UI and confirm
  `data/drafts/vehicle-taxonomy.json` is created, then delete the unused label.
<!-- Historical deployment diagnostic retained below. -->
- [x] Deploy the earlier diagnostic staging artifact, set `drafts/vehicles.json` to a
  PHP-readable private permission (`600` preferred, `644` if cPanel PHP ownership
  requires it), then record the exact `/admin-api/vehicles.php` and `tags.php`
  responses. The supplied 32-record JSON is locally valid.
- [ ] After deploying the 2026-08-31 artifact, open `tags.php`. If it reports
  `taxonomy_store_invalid_json` or `taxonomy_store_invalid_schema`, preserve a
  backup and remove only `data/drafts/vehicle-taxonomy.json`; reload to confirm
  the five groups seed from the 32 vehicles before creating a custom tag.
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
- [ ] Bootstrap the automated Publishing Center and verify validation blockers,
  idempotent repeated requests, machine-only endpoints and status polling on
  HTTPS staging.
- [x] Decide the initial staging runner host/request transport without storing
  any deployment secret; result reporting remains a separate pending endpoint.
- [x] Normalize existing vehicle media/licence metadata out of handwritten TS
  into a generator-owned JSON contract so uploaded draft media can be safely
  materialized without generating TypeScript source text.
- [x] Extend `materialize-admin-snapshot.mjs` with binary-verified media;
  normalized media metadata and TR/EN article outputs are complete, while
  direct repository application remains disabled until reviewed.

## Known Issues

- AD-004 is implemented and locally validated but not yet bootstrapped/proven on
  TURKTİCARET staging. PHP curl, PharData, 1 MiB POST chunks and atomic directory
  rename are fail-closed deployment requirements until live evidence exists.
- A queued run can be retried after 20 minutes and a claimed/deploying run after
  45 minutes. These conservative stale thresholds require live timing review.
- Automated release uploads and retained rollbacks do not yet have a cleanup
  retention job. Do not delete them manually before the first rollback drill.

- Production PHP extension list is not available; SQLite and `finfo` cannot be
  assumed. Local PHP has PDO but reports no PDO drivers.
- Apache rules/security headers for static admin HTML are not yet staging-tested.
- The public route registry currently describes Phase 1 routes only; admin stays
  deliberately outside sitemap/navigation contracts.
- Private featured-order changes remain drafts until the Phase 7 runner applies
  the explicit four-ID contract and deploys a rebuilt public artifact.
- Existing newsletter CSV permits multiple rows per email/source; audience
  eligibility needs a tested cross-row resolution policy before campaigns.
- The live vehicle endpoint succeeds. The taxonomy 503 root cause was
  numeric-only model labels becoming integer PHP array keys under strict types;
  the code fix is local and awaits deployment. The unrelated LiteSpeed `__next`
  404 probe lines are static-export probes and not the PHP failure.
- External SSH/SFTP is unavailable by hosting-provider policy. The historical
  OpenSSH adapter cannot be used on this account. AD-004 is the normal staging
  route; use File Manager + browser Terminal only for bootstrap or recovery.

## Open Decisions

- Staging automated-retention limits and stale-run thresholds after observing
  real GitHub Actions and shared-hosting durations.
- Production GitHub environment approval, separate tokens/data root, explicit
  recent-auth confirmation and deployment endpoint. Nothing from staging may be
  silently reused for production.

- Production deployment transport and secret names. Staging uses GitHub Actions
  plus the narrow project-owned PHP activator; production remains unselected.
- Whether cPanel HTTPS UAPI has any future recovery value. It is not required
  for AD-004 and its broader account credential is deliberately avoided.
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

Current 2026-09-02 staging history/restore continuation:

- `src/components/admin/publishing-center.tsx`
- `server/admin-api/publishing-store.php`
- `server/admin-api/publishing-deployment.php`
- `server/admin-api/publishing-history.php` (new)
- `server/admin-api/publish-restore.php` (new)
- `server/admin-api/tests/publishing-store.test.php`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-02 Phar extraction root-cause fix:

- `scripts/run-staging-publish.mjs`
- `scripts/run-staging-publish.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-02 claim-failure continuation:

- `.github/workflows/admin-staging-publish.yml`
- `scripts/admin-publish-runner-client.mjs`
- `scripts/admin-publish-runner-client.test.mjs`
- `scripts/report-staging-publish-failure.mjs`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `server/admin-api/publish-runner-fail.php` (new)
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-02 deployment-diagnostic continuation:

- `.github/workflows/admin-staging-publish.yml`
- `scripts/admin-publish-runner-client.mjs`
- `scripts/admin-publish-runner-client.test.mjs`
- `server/admin-api/publish-runner-deploy.php`
- `server/admin-api/publishing-deployment.php`
- `server/admin-api/tests/publishing-deployment.test.php`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-02 clean-runner typecheck correction:

- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-02 Phase 7 automatic-staging continuation:

- `.github/workflows/admin-staging-publish.yml` (new)
- `deploy/staging/README.md`
- `scripts/admin-publish-runner-client.mjs` (new)
- `scripts/admin-publish-runner-client.test.mjs` (new)
- `scripts/fetch-staging-publish-inputs.mjs` (new)
- `scripts/deploy-staging-via-admin-api.mjs` (new)
- `scripts/report-staging-publish-failure.mjs` (new)
- `scripts/run-staging-publish.mjs`
- `scripts/run-staging-publish.test.mjs`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `server/admin-api/bootstrap.php`
- `server/admin-api/kalite-filo-admin.example.php`
- `server/admin-api/publishing-store.php`
- `server/admin-api/publishing.php`
- `server/admin-api/publish-staging.php`
- `server/admin-api/publishing-automation.php` (new)
- `server/admin-api/publishing-deployment.php` (new)
- `server/admin-api/publish-runner-request.php` (new)
- `server/admin-api/publish-runner-media.php` (new)
- `server/admin-api/publish-runner-upload.php` (new)
- `server/admin-api/publish-runner-deploy.php` (new)
- `server/admin-api/publish-runner-rollback.php` (new)
- `server/admin-api/publish-runner-complete.php` (new)
- `server/admin-api/tests/publishing-deployment.test.php` (new)
- `src/components/admin/publishing-center.tsx`
- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-01 Phase 7 no-external-SSH transport continuation:

- `scripts/run-staging-publish.mjs`
- `scripts/run-staging-publish.test.mjs`
- `scripts/deploy-staging-artifact.mjs`
- `scripts/deploy-staging-artifact.test.mjs`
- `scripts/finalize-manual-staging-publish.mjs` (new)
- `scripts/finalize-manual-staging-publish.test.mjs` (new)
- `scripts/manual-staging-deploy.test.mjs` (new)
- `deploy/staging/deploy-release.sh` (new)
- `deploy/staging/README.md`
- `src/components/admin/publishing-center.tsx`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-01 Phase 7 staging-transport continuation:

- `scripts/deploy-staging-artifact.mjs` (new)
- `scripts/deploy-staging-artifact.test.mjs` (new)
- `deploy/staging/README.md` (new)
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-01 Phase 7 SSH-access diagnostic:

- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

Current 2026-09-01 Phase 7 local-runner/admin-publishing UX continuation:

- `scripts/run-staging-publish.mjs` (new)
- `scripts/run-staging-publish.test.mjs` (new)
- `src/components/admin/admin-app.tsx`
- `src/components/admin/publishing-center.tsx`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 canonical-article-registry continuation:

- `src/data/article-admin-records.en.json` (new)
- `src/data/articles.en.ts`
- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `scripts/apply-admin-materialization.mjs`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 repository-application continuation:

- `scripts/apply-admin-materialization.mjs` (new)
- `scripts/apply-admin-materialization.test.mjs` (new)
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 runner-result continuation:

- `server/admin-api/publishing-store.php`
- `server/admin-api/publish-runner-result.php` (new)
- `server/admin-api/tests/publishing-store.test.php`
- `src/components/admin/publishing-center.tsx`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 manual-runner handoff continuation:

- `server/admin-api/publishing-store.php`
- `server/admin-api/publish-request-download.php` (new)
- `server/admin-api/tests/publishing-store.test.php`
- `src/components/admin/publishing-center.tsx`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 complete review-manifest continuation:

- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 private-media binary continuation:

- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 localized-article continuation:

- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Phase 7 normalized vehicle-media continuation:

- `src/data/vehicle-media.json` (new canonical media/licence contract)
- `src/data/vehicle-portfolio.ts`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 subscriber/dashboard reliability continuation:

- `src/components/admin/subscriber-list-view.tsx`
- `src/components/admin/admin-app.tsx`
- `server/admin-api/subscribers.php`
- `server/admin-api/subscriber-operation.php`
- `server/admin-api/read-model.php`
- `server/admin-api/dashboard.php`
- `server/admin-api/article-store.php`
- `server/admin-api/tests/dashboard.test.php`
- `server/admin-api/tests/article-store.test.php`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 list/IYS/subscriber operations continuation:

- `src/components/admin/admin-app.tsx`
- `src/components/admin/vehicle-manager.tsx`
- `src/components/admin/article-list-view.tsx`
- `src/components/admin/iys-management-view.tsx`
- `src/components/admin/subscriber-list-view.tsx`
- `src/components/admin/audit-log-view.tsx`
- `src/components/admin/publishing-center.tsx`
- `server/forms/export-iys-daily.php`
- `server/forms/tests/iys-export.test.php`
- `server/admin-api/read-model.php`
- `server/admin-api/subscriber-operation.php`
- `server/admin-api/bootstrap.php`
- `server/admin-api/tests/dashboard.test.php`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 Filo Rehberi interaction continuation:

- `src/components/admin/article-list-view.tsx`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 vehicle operations UI continuation:

- `src/components/admin/vehicle-manager.tsx`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-08-31 taxonomy incident continuation:

- `server/admin-api/taxonomy-store.php`
- `server/admin-api/tags.php`
- `server/admin-api/tests/taxonomy-store.test.php`
- `src/components/admin/tag-manager.tsx`
- `src/components/admin/vehicle-manager.tsx`
- `package.json`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current 2026-09-01 numeric-model taxonomy fix:

- `server/admin-api/taxonomy-store.php`
- `server/admin-api/tests/taxonomy-store.test.php`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

Current Phase 7 vehicle materialization continuation:

- `src/data/featured-vehicle-ids.json`
- `src/data/vehicle-portfolio.ts`
- `src/types/vehicle-portfolio.ts`
- `src/components/home/featured-vehicles.tsx`
- `scripts/validate-foundation.mjs`
- `scripts/assemble-cpanel-release.mjs`
- `scripts/assemble-cpanel-release.test.mjs`
- `scripts/materialize-admin-snapshot.mjs`
- `scripts/materialize-admin-snapshot.test.mjs`
- `docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`
- `kalite-filo-staging.zip`

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

2026-09-02 staging history and retained-release restore:

- Operator confirmed the automatic staging workflow completes successfully end
  to end on live staging.
- Added owner-confirmed terminal history cleanup with active-run preservation
  and a separate successful fingerprint baseline.
- Added expandable safe change details and an authenticated/CSRF-protected
  staging-only retained-release restore action with atomic current-release
  retention and audit logging.
- PHP syntax and focused publishing-store/release-assembly tests passed.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed after Next.js route type generation.
- `npm test`: passed; 88 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.
- Live history deletion and restore were not executed from this local session;
  both require explicit owner confirmation after deployment.

2026-09-02 Phar extraction root-cause correction:

- The prior real USTAR reproduced PHP fatal extraction error `Cannot extract
  ".", internal error` from its literal dot root entry.
- A corrected 61,693,952-byte USTAR was generated from sorted top-level release
  entries; PHP `PharData` extracted it successfully, producing 1,702 files and
  the required `index.html` and `admin-api/session.php` files.
- Added a regression test that prohibits `.` in archive operands.
- `npm run lint`: passed without warnings after removing the isolated generated
  extraction fixture.
- `npm run typecheck`: passed after Next.js route type generation.
- `npm test`: passed; 88 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.

2026-09-02 malformed claim/failure-state continuation:

- The third live workflow received malformed JSON from the frozen-request PHP
  endpoint and exposed the missing early terminal-state transition.
- Runner errors now include bounded HTTP/MIME/size/body-class metadata without
  logging response content.
- Added a machine-authenticated, request/snapshot/run-bound early failure
  endpoint and release assembly coverage.
- PHP syntax checks passed for all new/changed deployment endpoints.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed after Next.js route type generation.
- `npm test`: passed; 87 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.

2026-09-02 deployment HTTP 503 diagnostic continuation:

- The second live attempt passed checkout, dependencies, claim and complete
  release build; only `publish-runner-deploy.php` returned HTTP 503.
- Added allowlisted failure-reason classification and nested extraction error
  handling tests; raw exception messages and server paths remain private.
- Focused Node runner tests: passed; 4 tests.
- Focused PHP deployment tests and `php -l`: passed.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed after Next.js route type generation.
- `npm test`: passed; 87 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.

2026-09-02 first live automation failure correction:

- Live staging reported automation `enabled: true`, `ready: true`, provider
  `github_actions` and no missing configuration.
- The first dispatch reached GitHub Actions and its queued/running/failure state
  returned to Admin Dashboard; failure was bounded to clean-runner typechecking.
- `npm run typecheck` now runs `next typegen` first and passed with an explicit
  `Types generated successfully` result before strict `tsc`.
- `npm run lint`: passed without warnings.
- `npm test`: passed; 87 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.
- Deployment, live marker, smoke and rollback were not reached by the failed
  live run and remain the next live proof.

2026-09-02 GitHub workflow context correction:

- Removed every `${{ runner.temp }}` expression from job-level `env`; temporary
  paths are resolved from `$RUNNER_TEMP` only after the job reaches the runner.
- Direct regression scan confirmed no invalid `runner.temp` expression remains.
- `actionlint` is not installed locally, so GitHub's hosted parser remains the
  final workflow-schema authority after push.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 87 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.

2026-09-02 Phase 7 automatic-staging continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 87 Node tests and all project-owned PHP suites passed.
- `npm run build:staging`: passed; all 140 static pages generated.
- Staging release assembly and `npm run verify:output`: passed.
- Every assembled `release/staging/admin-api/*.php` file passed `php -l`.
- A full 62,035,456-byte staging USTAR containing 2,348 entries passed the PHP
  server-side archive preflight (60,388,506 extracted file bytes).
- Focused tests cover machine credential validation, private media selection,
  bounded two-chunk upload, release-manifest ordering/hashes, tamper detection
  and traversal rejection.
- No GitHub dispatch, cPanel mutation, live staging deployment or production
  operation was performed in this development session; one-time configuration
  and live staging proof remain.

2026-09-01 Phase 7 no-external-SSH transport continuation:

- Focused release/deployment/finalizer suite: passed; 11 tests.
- `bash -n deploy/staging/deploy-release.sh`: passed with Git for Windows Bash.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 82 Node tests and all project-owned PHP suites passed.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled.
- `npm run verify:output`: passed.
- Full `run-staging-publish.mjs --apply`: passed and produced fresh
  `release_ready` evidence with materialization, validation, build and release
  all passed; deployment and smoke remain correctly skipped.
- Final generated staging artifact SHA-256:
  `4e38e64eaf2b5c8559b10c3ebd5e3cd5cedddb2fe7c730b98221372eaf3d0e56`.
- The ZIP contains `kalite-filo-release.json` bound to request
  `publish-20260901-185336-c6e2e73e03fb`, snapshot
  `e21bdb57e2641795f4818565caddec79d5d95ffca01b1b6df2a1a8b4b05197a1`
  and manifest
  `4d5e8a5b5f56cf6d05829ac01e2be6936612981d4ab34b0e36b9dc18baf5d105`.
- No cPanel upload, Terminal mutation, live smoke or production operation was
  performed from the development workstation.

2026-09-01 Phase 7 staging-transport continuation:

- Focused deployment/runner suite: passed; 6 tests.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 77 Node tests and all project-owned PHP suites passed.
- Tests cover release-ready/hash binding, ordered failure evidence, staging
  public/admin/robots/session HTTPS contracts and no-store session enforcement.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- No SSH upload or live staging mutation was attempted because external cPanel
  SSH target/key configuration was not supplied to this session.

2026-09-01 Phase 7 SSH-access diagnostic:

- Public cPanel server label resolution and TCP connection to the supplied shared
  IP on port 22 were attempted read-only; neither yielded a usable SSH endpoint.
- cPanel Terminal later confirmed the public FQDN. It resolves to the supplied
  IP, but the FQDN's port 22 is also unreachable from the operator workstation.
- No credential, private key, upload, deployment or production operation was
  attempted.
- A private SSH key was accidentally pasted into a chat message after the
  diagnostic. It was not used or stored in the repository; revocation and
  replacement are required before deployment can continue.

2026-09-01 Phase 7 local-runner/admin-publishing UX continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 74 Node tests and all project-owned PHP suites passed.
- Runner tests verify `release_ready` never claims deployment/smoke, ordered
  fail-closed stage evidence and request/snapshot-bound result persistence.
- The real-worktree `--apply` path was deliberately not executed without a
  downloaded frozen request and isolated backup/review inputs.
- `npm run release:staging`: passed; all 140 static pages generated and the
  admin navigation/no-change UX compiled successfully.
- `npm run verify:output`: passed.
- `git diff --check`: passed; yalnızca beklenen satır sonu bildirimleri raporlandı.
- Refreshed `kalite-filo-staging.zip`: 18,955,843 bytes; SHA-256
  `C8C4D4CE44EECD434D1BFFA3E3B31E4B444CC773522B2BC1721F28CF16745F7E`.

2026-09-01 Phase 7 canonical-article-registry continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 71 Node tests and all project-owned PHP suites passed.
- Materialization tests verify stable-ID TR merge, unaffected record/tag
  preservation, explicit EN overlay generation and omission of unprovided EN.
- Release tests verify admin English overlay metadata returns through the
  published-source snapshot/import boundary.
- `npm run release:staging`: passed; the unchanged current registry generated
  all 140 static pages successfully through the canonical loaders.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,954,952 bytes; SHA-256
  `F1758713E03B60E2A3A9BA4AAE3801FDF962FFA364D488BB9BDCD0F18A514495`.

2026-09-01 Phase 7 repository-application continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 70 Node tests and all project-owned PHP suites passed.
- New temporary-Git integration tests verify create/replace planning and apply,
  preservation of the replaced original and backup manifest, rejection of an
  overlapping local edit, and rejection of a manifested non-allowlisted path.
- The apply command was deliberately not run against the real dirty worktree.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,955,316 bytes; SHA-256
  `430828AE6BDCBE55F04FB163F67AFC116D0DDF42F5A2F94375C3867958F12943`.

2026-09-01 Phase 7 runner-result continuation:

- PHP syntax checks for `publishing-store.php` and
  `publish-runner-result.php`: passed.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 67 Node tests and all project-owned PHP suites passed.
- Publishing tests cover wrong snapshot rejection, completion-before-start,
  idempotent start/completion, terminal reporter identity, success requiring all
  stages and failure requiring an explicit failed stage.
- `npm run release:staging`: passed; all 140 static pages generated and the new
  endpoint was included in the cPanel release.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,955,284 bytes; SHA-256
  `26A35A1836C9C43C30C4B58F6C06E27B0E6AE6DF010AE7D05C51C944BB6B90D6`.

2026-09-01 Phase 7 manual-runner handoff continuation:

- PHP syntax checks for `publishing-store.php` and
  `publish-request-download.php`: passed.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 67 Node tests and all project-owned PHP suites passed.
- Publishing coverage verifies canonical frozen-request retrieval and rejects
  malformed/traversal IDs; release fixture coverage includes the new endpoint.
- `npm run release:staging`: passed; all 140 static pages generated and the new
  authenticated endpoint was packaged in the cPanel staging release.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,952,980 bytes.

2026-09-01 Phase 7 complete review-manifest continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 67 Node tests and all project-owned PHP suites passed.
- New integration coverage verifies an exact 11-file synthetic review set and
  independently rejects an extra file, a changed file and a missing file.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,952,588 bytes.

2026-09-01 Phase 7 private-media binary continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 66 Node tests and all project-owned PHP suites passed.
- New integration coverage builds synthetic private vehicle/library stores,
  proves only referenced files cross the boundary, verifies detail/card/article
  destinations and rejects a frozen checksum/size mismatch before copying.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled without reading any private development data.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,949,904 bytes.

2026-09-01 Phase 7 localized-article continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 64 Node tests and all project-owned PHP suites passed.
- New tests prove deterministic manifest/Markdown paths, canonical TR/EN public
  routes, Turkish draft exclusion, missing-English preservation, duplicate-slug
  rejection and fail-closed missing cover-media references.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release assembled without changing current public content.
- `npm run verify:output`: passed.
- `git diff --check`: passed; only expected line-ending notices were reported.
- Refreshed `kalite-filo-staging.zip`: 18,948,368 bytes.

2026-09-01 Phase 7 normalized vehicle-media continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 61 Node tests and all project-owned PHP suites passed.
- New tests reject repository media checksum drift, verify the fourth normalized
  adapter output and verify content-addressed admin-upload metadata.
- `npm run release:staging`: passed; all 140 static pages generated, all 28
  repository media checksums verified and the cPanel release assembled.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,949,750 bytes.

2026-09-01 subscriber/dashboard reliability continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- Changed PHP files: syntax checks passed.
- Focused dashboard and article-store PHP tests: passed.
- `npm test`: passed; 59 Node tests and all project-owned PHP suites passed.
- Sorting coverage verifies ascending/descending full-result ordering and
  rejects incomplete sort parameters; article coverage verifies live draft
  counting.
- `npm run release:staging`: passed; all 140 static pages generated and the
  cPanel staging release was assembled.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,946,381 bytes.

2026-09-01 published-list/subscriber-correction/publish-CTA refinement:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 59 Node tests and all project-owned PHP suites passed.
- Controlled correction tests cover explicit resubscription, immutable creation
  time and rejection of approved IYS without approved consent evidence.
- Changed PHP runtime syntax checks: passed.
- `npm run release:staging`: passed; all 140 static pages generated.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,947,091 bytes.

2026-09-01 list/IYS/subscriber operations continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; recovery and controlled IYS mutation coverage included.
- Changed PHP runtime syntax checks: passed.
- `npm run release:staging`: passed; all 140 static pages generated.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,947,222 bytes.

2026-09-01 Filo Rehberi interaction continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 59 Node tests and all project-owned PHP suites passed.
- `npm run release:staging`: passed; all 140 static pages generated.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,945,856 bytes.

2026-09-01 vehicle operations UI continuation:

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm test`: passed; 59 Node tests and all project-owned PHP suites passed.
- `npm run release:staging`: passed; all 140 static pages generated.
- `npm run verify:output`: passed.
- Refreshed `kalite-filo-staging.zip`: 18,944,467 bytes.

2026-09-01 numeric-model taxonomy fix:

- Root cause proven: PHP converts numeric-only string keys such as `2008` to
  integers; strict taxonomy ID generation previously rejected that key type.
- Focused taxonomy PHP test: passed, including numeric-only model preservation.
- `npm test`: passed, including all PHP admin suites and 59 Node tests.
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm run release:staging`: passed; all 140 static pages generated and the
  corrected taxonomy runtime is present in `release/staging/admin-api/`.
- `npm run verify:output`: passed.
- PHP syntax checks for taxonomy runtime and endpoint: passed.
- Refreshed `kalite-filo-staging.zip`: 18,943,511 bytes.

2026-08-31 Phase 7 vehicle materialization continuation:

- `npm run lint`, `npm run typecheck`, `npm test`: passed; Node suite now has
  59 passing tests including three materialization adapter cases.
- Tests prove deterministic ordered output, unpublished exclusion, snapshot
  tamper rejection, invalid featured rejection and review-directory writes.
- `npm run release:staging` and `npm run verify:output`: passed; 140 pages.
- Current homepage still renders the same four vehicles in the same order.
- Refreshed `kalite-filo-staging.zip`: 18,944,268 bytes.

2026-08-31 taxonomy incident continuation:

- Local PHP 8.5 generated 14 makes, 31 models, 3 categories, 15 segments and
  6 fuel values from the supplied 32-record vehicle draft.
- `npm run lint`, `npm run typecheck`, `npm test`: passed.
- New taxonomy tests cover missing-store seeding, custom merging and malformed
  JSON diagnostic behavior.
- PHP syntax checks for taxonomy runtime/tests: passed.
- `npm run release:staging` and `npm run verify:output`: passed; 140 pages.
- Refreshed `kalite-filo-staging.zip`: 18,942,310 bytes.

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

2026-09-02 history/restore handoff: automated staging is live and successful.
Commit/push the Publishing Center UI, new PHP endpoints, store/deployment and
release assembly changes. Because new PHP endpoints are not yet present on the
currently deployed release, install them using one automatic staging publish
whose artifact contains this commit; if the current static UI cannot call them
until that publish, trigger through the existing working Publishing Center.
After success, use `Geçmişi Temizle` once to remove obsolete terminal request
records while preserving the baseline. Then create two controlled versions and
use `Bu Sürüme Dön` on the earlier successful record. Confirm site content,
audit log, unpublished-change recalculation and recovery copy retention. Do not
enable production publishing yet.

2026-09-02 extraction-fix handoff: `release_extraction_failed` was a code-level
archive compatibility defect, not corrupt chunks, disk space or an Actions
retry issue. `run-staging-publish.mjs` now archives sorted release-root entries
instead of the Phar-incompatible `.` entry. Commit/push this runner change and
start a fresh Admin Dashboard staging publication; do not re-run an old Actions
run because it remains bound to its old commit. No cPanel bootstrap is needed
for this specific fix. Verify deployment, marker, smoke and unpublished-change
clearance before closing Phase 7.

2026-09-02 malformed-claim handoff: push the workflow, runner-client,
failure-reporter, release-assembly and new `publish-runner-fail.php` changes to
`main`. Generate and manually extract one fresh staging bootstrap ZIP because
the new failure endpoint must exist on cPanel before it can be called. The
currently displayed request cannot be retroactively completed by its finished
workflow; after 20 minutes it is eligible for the existing conservative stale
re-dispatch. Retry from Publishing Center. A repeated parse failure will now
show safe HTTP/type/bytes/body metadata, and the early-failure endpoint will
mark the request failed rather than leaving it in progress.

2026-09-02 deploy-503 handoff: the Node 20 annotation did not fail the job; the
workflow has nevertheless moved to checkout/setup-node v5 to remove it. The
actual failure is inside the staging PHP deployment boundary, whose currently
deployed version hides every runtime cause behind `service_unavailable`. Push
the new workflow/client/PHP diagnostic changes, assemble a fresh staging
release, and manually extract that bootstrap once so the server gains the new
endpoint. Retry from Admin Dashboard. If it still fails, Actions will report a
bounded `reason=...` code that identifies the next concrete fix. Do not change
permissions or hosting configuration speculatively before that result.

2026-09-02 clean-runner failure handoff: the automation configuration and
dispatch bridge are working. The failed run was caused by `tsc` executing in a
clean checkout before Next.js had generated global `PageProps`; `package.json`
now runs `next typegen && tsc --noEmit --incremental false`. Commit and push
this change to `main`, then retry the unpublished admin change. Do not rebuild
or upload the cPanel bootstrap ZIP for this fix: the runner reads `package.json`
from the pushed repository. On retry, verify build, deployment, smoke, live
content and cleared unpublished changes before closing the live Phase 7 proof.

2026-09-02 workflow-fix handoff: the IDE's `Unrecognized named-value: runner`
error was valid and is now fixed in `.github/workflows/admin-staging-publish.yml`.
Commit and push this correction together with the complete automation changes
before creating the bootstrap release. Confirm the Actions page recognizes
`Admin staging publish`, then assemble and install the one-time staging ZIP.
Keep the raw runner token only in the GitHub `staging` environment secret; the
cPanel config must contain only its SHA-256 hash. Keep the GitHub fine-grained
token only in private cPanel config. Do not paste either token into logs or chat.

2026-09-02 Phase 7 automatic-staging handoff: AD-004 now supersedes recurring
manual publication. Commit and push the workflow and code to `main`. Create a
GitHub `staging` environment secret named
`KALITE_FILO_STAGING_RUNNER_TOKEN`. In private cPanel staging `config.php`, add
the fixed repository/workflow/ref, a fine-grained Actions-write token and only
the runner token's SHA-256 hash. Never put either raw token in this repository,
the admin browser, a screenshot or chat.

Because the currently deployed staging PHP cannot receive the new automated
protocol, perform exactly one final manual `release:staging` ZIP installation.
Afterwards verify `/admin-api/publishing.php` while authenticated reports
`automation.enabled` and `automation.ready` as true. Make a synthetic admin
change and press `Staging Oluştur`; watch the status progress through queued,
running, deploying and completed. Verify the live content/marker and retained
private rollback. Exercise rollback before closing Phase 7. Routine later
staging publishes require no File Manager or Terminal. Production remains
disabled and must receive separate Phase 8 credentials, approvals and proof.

2026-09-01 Phase 7 no-external-SSH handoff: external SSH/SFTP is conclusively
unavailable on TURKTİCARET Web Eko. Do not continue hostname, port, SSH-agent or
replacement-key work. Use `deploy/staging/README.md`. The fresh upload artifact
is `C:\Users\murat\Downloads\kalite-filo-runner\publish-20260901-185336-c6e2e73e03fb\kalite-filo-staging-manual-cpanel-final.zip` and its bounded input/result
is the adjacent `result-release-ready-manual-cpanel-final.json`. Upload those bytes
unchanged plus `deploy/staging/deploy-release.sh` to the documented private
cPanel paths, run the exact hash-bound browser-Terminal command, retain the
printed rollback ID, and run `finalize-manual-staging-publish.mjs`. Submit a
success result only after marker and HTTPS smoke pass. Then perform one explicit
rollback drill before closing Phase 7. Production remains disabled.

The obsolete OpenSSH handoffs below are historical records only and must not be
followed for this hosting account. Independently revoke/delete the previously
disclosed cPanel SSH key; the selected workflow does not need a replacement.

2026-09-01 Phase 7 staging-transport handoff:
`deploy-staging-artifact.mjs` accepts only the artifact and result produced by
the local runner, rechecks SHA-256 before and after OpenSSH transfer, retains a
private full-document-root rollback and runs bounded HTTPS smoke checks. It is
strictly staging-only and its external variables/command are documented in
`deploy/staging/README.md`. The code and tests pass, but it has not been run
against cPanel. Next configure the operator's SSH agent and the documented
`KALITE_FILO_STAGING_*` values, perform one controlled live staging deployment,
confirm rollback retention, then submit the produced result from the Publishing
Center. Do not enable production or delete the retained rollback yet.

2026-09-01 SSH-access diagnostic handoff: cPanel-generated public key metadata
was supplied, but the matching private key has not been downloaded to the
operator workstation and external SSH access is unverified. `cpanel16-web-host-cl`
did not resolve publicly and `31.186.11.46:22` was unreachable from this
workstation. Ask the hosting provider for the exact external SSH hostname and
port, confirmation that key authentication is enabled for `kal67efilocomtr`,
and whether `rsync`, `unzip`, `sha256sum` and `realpath` are available. Then
authorize the public key, download the private key locally and run the documented
connection test before any staging deployment.

2026-09-01 SSH-key security handoff: do not use the previously generated key;
its private material was disclosed outside the intended workstation boundary.
In cPanel revoke/delete that key, then generate and authorize a replacement.
Do not share the replacement private key or passphrase. Continue only after the
hosting provider supplies a reachable external SSH hostname/port and the new
key authenticates locally.

2026-09-01 hostname follow-up: use
`cpanel16-web-host-cl.turkticaret.net` as the provider-confirmed candidate
hostname, not the short cPanel server label. It resolves correctly but external
port 22 is blocked/unreachable, so ask TURKTİCARET for the active SSH port and
whether the operator's source IP must be allowlisted. Keep the publish request
in `awaiting_runner` and do not try deployment until a new, undisclosed key and
successful local SSH test exist.

2026-09-01 Phase 7 local-runner/UI handoff: `run-staging-publish.mjs` composes
the reviewed materializer and application adapters. Without `--apply` it only
prints a plan and writes `plan_ready`; apply additionally requires external
backup/artifact paths, runs existing quality/release commands and stops at
`release_ready` with deployment/smoke skipped. Do not map `release_ready` to the
server's terminal success or add credentials to this script. `Yayına Al` is
sticky at the sidebar bottom; an empty change set displays the requested warning
and sends no publish request. Next choose the staging-only deployment transport,
external secret names, rollback capture and HTTPS smoke contract.

2026-09-01 Phase 7 canonical-article-registry handoff: review output now writes
the complete merged `src/data/article-records.json`, the explicit
`src/data/article-admin-records.en.json` overlay and localized Markdown. The
public English loader and release snapshot consume the overlay; legacy verified
English copy remains only for unaffected records. Do not restore the unused
`article-materialization.json` application path, synthesize missing English or
replace existing tag IDs with guessed values. The materializer CLI now also
requires `--article-source` and `--article-en-source`. Next add a local runner
orchestrator that reuses the existing quality/release commands and emits a
bounded result file; keep deployment separate and explicit.

2026-09-01 Phase 7 repository-application handoff:
`apply-admin-materialization.mjs` defaults to JSON plan output and requires
`--apply --backup <outside-repository-path>` for mutation. It re-verifies the
review manifest, permits only explicit generated content/media paths, refuses
overlapping Git changes, stages and rehashes every byte, and writes a recoverable
backup manifest. It does not commit/build/deploy and was not run on this real
worktree. Next bridge `article-materialization.json` into the canonical article
registry used by the static generator; preserve unaffected records and explicit
TR/EN readiness, then prove new and updated article routes in a temporary build.

2026-09-01 Phase 7 runner-result handoff: `publish-runner-result.php` and the
Publishing Center now implement explicit `start` and `complete` operations.
The store accepts only `awaiting_runner → running → staging_succeeded | failed`,
binds every operation to the frozen snapshot hash, atomically replaces the
private request and retains bounded stage/hash evidence plus reporter identity.
Do not add free-form logs, credentials, arbitrary statuses or a shortcut that
marks an unstarted request successful. Next implement a local atomic application
adapter that re-verifies the review manifest, previews the exact permitted
repository diff and creates a recoverable backup without committing/building.

2026-09-01 Phase 7 manual-runner handoff: AD-003 selects the trusted operator
workstation as the initial staging runner. The admin history now exposes an
Owner/Admin-only `Snapshot İndir` action backed by
`publish-request-download.php`; lookup is canonical/contained and each download
is audited. Retrieve referenced private media separately through existing
cPanel File Manager access and pass both roots explicitly to the materializer. A
download does not change request state or prove a build/deploy. Next implement
a bounded authenticated result contract tied to request ID plus snapshot hash,
with strict transitions and safe summaries before any UI can report success.

2026-09-01 Phase 7 review-manifest handoff: the materializer now writes and
immediately verifies `review-manifest.json`. Expected paths come only from the
validated vehicle/article models and copied-media records; every entry includes
size and SHA-256 and the verifier rejects missing, extra, duplicate, reordered,
symlinked or modified output. The snapshot-to-review adapter checklist is now
complete. Do not treat this as repository application or deployment. Next
select the external runner host and authenticated request/result transport,
then design atomic repository application and safe diff review around this
manifest before allowing any publish request past `awaiting_runner`.

2026-09-01 Phase 7 private-media binary handoff: the materializer CLI now
requires `--private-data-root` in addition to the request/output/price/media
inputs. It accepts only opaque IDs and allowlisted extensions beneath the two
known private stores, preflights the entire referenced set, then copies and
rehashes deterministic destinations beneath the review root. Vehicle uploads
produce identical detail/card binaries; shared article covers are copied once.
Do not weaken real-path containment, copy unreferenced media, or make cPanel PHP
perform the build. Next create a deterministic expected-file manifest for every
review JSON, Markdown and binary with size/checksum, and test missing, extra and
modified output detection before implementing any repository application.

2026-09-01 Phase 7 localized-article handoff: the review materializer now emits
`src/data/article-materialization.json` and localized Markdown files beneath
`src/content/filo-rehberi/` inside the separate output root. TR must be ready;
EN is written only when explicitly ready, otherwise the manifest stores `null`.
Canonical locale category IDs and public route paths are explicit, so a later
adapter must not infer or translate them. The output is deliberately not fed
into the current generator and does not mutate Git. Next implement contained
binary copying for vehicle `draftMedia` and central article covers, verifying
every source and destination byte against the frozen checksum; then create the
complete expected-file review manifest before any atomic application step.

2026-09-01 Phase 7 normalized vehicle-media handoff: public vehicle media and
licence data now comes exclusively from `src/data/vehicle-media.json`; do not
reintroduce a handwritten TS map or release-time source regex. The release
snapshot validates each repository binary against its recorded SHA-256. The
review adapter writes `vehicle-media.json`, preserving repository records and
turning private draft media into content-addressed metadata with its opaque
source ID. It still intentionally does not copy private binaries or mutate the
repository. Next implement localized article review outputs, followed by a
contained/checksummed binary copier and complete output manifest.

2026-09-01 subscriber/dashboard reliability handoff: subscriber correction no
longer resubmits a stale unsubscribe date when an operator restores an active
status. Validation remains fail-closed, but approved safe failures now map to
field-level red messages in the open modal. Date sorting is performed by the
PHP read model before pagination; the UI cycle is descending, ascending, then
default. Dashboard draft count reads the private article store and refetches on
view entry. Deploy the refreshed ZIP and complete the four browser checks at
the top of Next Tasks before closing this incident.

2026-09-01 list/IYS/subscriber handoff: sidebar list separation is UI state over
the existing static `/admin/` shell; no new Next runtime route was introduced.
Published views are strict `published` inventories and draft views are their
private counterparts. IYS auto-download and orphan-checkpoint recovery remain.
Subscriber corrections are Owner/Admin-only, reason-required, audit-tracked and
semantically validated; do not make creation/update timestamps arbitrary client
fields or remove evidence consistency checks. `Yayına Al` is now a bottom CTA.
An `awaiting_runner` request is only a frozen snapshot: next choose an external
runner host and authenticated claim/result transport before build/deploy can run.

2026-09-01 Filo Rehberi interaction handoff: a full-card overlay button now
routes published cards to either an existing draft editor or the already
required explicit import flow. Visual card content remains non-interactive
inside that single accessible control. Article forms track actual input and use
one confirmation guard for backdrop, Close and Escape dismissal. Deploy the
refreshed ZIP and complete the three browser checks listed under Next Tasks.

2026-09-01 vehicle UI handoff: All Vehicles and Published Vehicles share one
deterministically brand-grouped horizontal card renderer. The card itself is a
keyboard-accessible button and its visible Edit treatment is an affordance, not
a second nested control. The editor tracks user input as dirty and routes
backdrop, Close and Escape dismissal through the same confirmation guard. Next
deploy the refreshed staging ZIP and execute the three interaction smoke tests
listed under Next Tasks before marking the browser behavior complete.

2026-09-01 taxonomy root-cause handoff: cPanel's missing
`data/drafts/vehicle-taxonomy.json` is expected and must not be created manually.
The failure came from existing Peugeot model names `2008`/`3008`, whose numeric
string keys PHP converts to integers. The runtime now casts taxonomy labels back
to strings before hashing and returning them; regression coverage includes
`2008`. Deploy the refreshed ZIP over the same staging document root, log in,
open `/admin-api/tags.php`, and confirm five populated groups. Only the first
successful custom-tag mutation should create the private taxonomy JSON.

2026-08-31 Phase 7 vehicle-adapter handoff: public featured order now lives in
`src/data/featured-vehicle-ids.json` and is validated against the 32-record
portfolio. Both localized homepages sort by the derived `featuredOrder`; the
current four cards remain unchanged. `scripts/materialize-admin-snapshot.mjs`
accepts a private publish-request JSON plus existing price-source metadata,
verifies the SHA-256 envelope and now produces four normalized JSON files under
a separate output root, including vehicle media/licence metadata. It
intentionally does not overwrite repository files. The next work is localized
article output and contained/checksummed binary copying. Do not enable automatic
Git application or deployment before runner transport is selected.

2026-08-31 taxonomy incident handoff: `/admin-api/vehicles.php` succeeds with
the live 32-record draft, so do not change `vehicles.json` or its working 644
permission. Deploy the refreshed ZIP and reopen `/admin-api/tags.php`. Missing
`vehicle-taxonomy.json` is supported and should immediately return seeded
groups. A present corrupt file now returns `taxonomy_store_invalid_json` or
`taxonomy_store_invalid_schema`; back it up, delete only that file, then reload.
An unreadable file returns `taxonomy_store_unreadable`. After groups load, create
one harmless custom test label, confirm the file is atomically created, and then
delete the unused label. Report the exact JSON response before any broader
permission or directory changes.

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
