# Admin API runtime boundary

`/admin/` is a static Next.js export route. Authentication and every private
operation run through the PHP 8.5 files in this directory, released as
`/admin-api/*.php`. PHP does not render the public site or admin shell.

## Private configuration

No real config, username, password hash, session data, or admin data belongs in
this directory or a release. The runtime loads the absolute path in
`KALITE_FILO_ADMIN_CONFIG`; otherwise it resolves the target-specific default:

```text
<account-home>/private/kalite-filo-admin/staging/config.php
<account-home>/private/kalite-filo-admin/production/config.php
```

The target comes from `KALITE_FILO_ADMIN_TARGET` when explicitly configured, or
from the exact known production/staging server name. An unknown target fails
closed. Use `kalite-filo-admin.example.php` only as a shape reference and create
the real file outside every document root with mode `0600`. The configured
`data_root` must be absolute and target-specific.

Admin access is not restricted by source IP. `allowedDevOrigins` in
`next.config.ts` remains a Next.js development setting and is not an admin
security control. Authentication, CSRF, secure sessions, rate limiting and audit
logging remain mandatory for requests from every address.

Generate the Owner password hash in a trusted interactive environment using
PHP's `password_hash()` and transfer only the resulting hash into the private
configuration. Do not place a plaintext password on a shell command line, in
Git, in an environment checked into cPanel, or in browser code.

## Session and request contract

- host-only `__Host-kf_admin` cookie, `Secure`, `HttpOnly`, `SameSite=Strict`;
- private environment-specific PHP session directory;
- 30-minute idle and 8-hour absolute expiry, with rotation every 15 minutes;
- same-origin and synchronizer-token CSRF checks on every POST;
- five failed logins per username/IP key in 15 minutes;
- generic login errors, private audit records and no-store/noindex headers.

`GET session.php` bootstraps the CSRF token. `POST login.php` and
`POST logout.php` accept same-origin requests only. Authenticated
`GET dashboard.php` combines a release-generated, secrets-free public content
snapshot with bounded read-only aggregates from the target's private contact
and audit stores. The snapshot PHP file returns data when required and emits no
direct HTTP content. Authenticated `GET audit.php` returns newest-first,
bounded pages with exact action/result filters; stored summaries are never sent
to the browser. Examples, tests and private configuration are excluded
from releases.

`GET articles.php` exposes the release-generated Filo Rehberi metadata and
verified TR/EN Markdown-presence flags to authenticated sessions. The inventory
is read-only; article draft persistence remains disabled until its API contract
is implemented.

`POST article-preview.php` accepts at most 128 KiB of Markdown with same-origin,
session and CSRF enforcement. Its small allowlisted renderer escapes raw HTML,
permits only HTTP(S) or contained root-relative links, and emits sanitized HTML
inside a no-store JSON response. `article-store.php` defines the versioned TR/EN
draft normalization and persistence contract.

Article draft persistence is now enabled for `owner`, `admin` and `editor`
roles through `POST articles.php` and `PATCH article.php?id=`. The private JSON
store uses an exclusive transaction lock and atomic replacement; every accepted
create/update writes an immutable private revision. TR and EN slugs are checked
against both published inventory and every draft. These APIs do not alter public
Markdown or make a draft publicly visible.

`GET article-revisions.php?id=` returns at most the latest 20 safe revision
summaries. It includes revision number and changed field paths but never the
stored before/after content or Markdown bodies.

Before production use, deploy to staging and verify cookie/session persistence,
cPanel environment/default path behavior, permissions, headers, throttling and
logout in a real HTTPS browser session.
