# Teklif Al status

Date: 2026-08-22

## Implemented

- `/teklif-al/` now uses the shared public shell, registry-aware metadata, the
  production design tokens, and a responsive two-column layout.
- The left column contains a native quote form with a small Client Component
  limited to the Kurumsal/Bireysel presentation state and result messaging.
- The form-type selector uses two explicit stateful, non-submitting buttons;
  only the selected contract is mounted, so
  hidden fields cannot become accidentally required.
- The corporate contract includes contact, company/tax, and vehicle-request
  fields. The individual contract includes contact, T.C. identity, vehicle
  request, note, and optional campaign-code fields. Both enforce a minimum
  twelve-month duration in browser and PHP validation.
- The right column contains only the verified telephone and email channels and
  one approved, local-image Filo Rehberi card.
- The browser submits standard URL-encoded form data to `/forms/teklif.php`
  without navigating away. The endpoint returns JSON to the interactive form;
  only a confirmed mail-transport acceptance opens the success dialog.
- Successful requests receive a server-generated ten-character quote number.
  The same number is included in the notification email and shown in the
  accessible modal confirmation. Leaving the modal, clicking its backdrop, or
  choosing “Anasayfaya Dön” returns to `/`.
- The shared telephone field provides an allowlisted native disclosure menu
  with project-local flag renderings, country names, and calling codes. It does
  not request a flag CDN or add a phone-input dependency. Its persistent
  `(XXX) XXX XX XX` mask keeps the remaining positions visible while the user
  types. Telephone input accepts only telephone characters, while first and
  last names accept letters, spaces, apostrophes, and hyphens. These constraints
  are repeated server-side.
- The country disclosure closes after a selection and on any pointer press
  outside the disclosure, without adding another client component.
- Required, telephone-format, and email-format failures use distinct Turkish
  inline messages and error styling. A field's message is removed as soon as
  its native validity contract is satisfied.
- The PHP 8.5 source lives at `server/forms/teklif.php`, outside `public/` and
  `out/`. It performs method, size, content-type, origin, honeypot, rate-limit,
  field, integer, telephone, email, company URL, tax-number, and T.C. identity
  checks before calling the focused PHPMailer authenticated-SMTP boundary.
- Development access from `192.168.1.122`, `192.168.1.157`, and `172.20.10.8` is explicitly
  allowlisted through Next.js `allowedDevOrigins`; this changes development
  resource access only and does not alter production origins.
- SMTP username, From, and recipient are independently configurable only in a
  private PHP config outside both document roots. Visitor email is Reply-To
  only. No mail credential is stored in the repository or exposed to the browser.

## Deployment boundary

The static export does not execute PHP. Controlled cPanel release assembly
copies the endpoint, `quote-mailer.php`, locked Composer metadata, and the local
PHPMailer `vendor/` runtime into `/forms/`. The private SMTP config is excluded.
The raw PHP source must never be copied into a generic
static preview artifact.

Local PHP syntax and config-contract tests are part of the quality gate. Before
release, staging must still verify both form
variants, invalid submissions, throttling, Turkish character encoding,
`Reply-To`, spam handling, TLS/SMTP compatibility, and actual inbox delivery.

## Deferred blockers

- Counsel-approved privacy notice, processing disclosure, retention policy,
  and any required consent wording are not yet supplied. The form must not be
  treated as launch-approved until these are resolved.
- The individual form collects a T.C. identity number. Security, minimization,
  email-transmission, retention, and access-control approval for this sensitive
  field is a release blocker even though the current endpoint does not persist
  submissions.
- Hosting mail transport configuration, sender authorization, SPF/DKIM/DMARC,
  and deliverability remain staging/cPanel checks.
- The user-facing route remains unpublished, noindex/nofollow, and excluded
  from the sitemap under the existing route registry.
