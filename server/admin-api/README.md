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

`allowed_ip_addresses` is mandatory and enforced from the connection's
`REMOTE_ADDR`; forwarded-IP headers are deliberately not trusted. Configure the
public egress IP actually observed by cPanel. The `allowedDevOrigins` list in
`next.config.ts` only controls development-origin access to Next.js assets; it
is not authentication or a server-side IP firewall. Private `192.168.x.x` and
`10.x.x.x` addresses normally are not visible to the remote staging server.

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
`POST logout.php` accept same-origin requests only. The release assembler copies
only `bootstrap.php`, `auth.php`, and these three endpoints; examples and tests
are excluded.

Before production use, deploy to staging and verify cookie/session persistence,
cPanel environment/default path behavior, permissions, headers, throttling and
logout in a real HTTPS browser session.
