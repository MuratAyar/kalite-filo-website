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
  checks before calling the hosting mail transport.
- Development access from `192.168.1.122`, `192.168.1.157`, and `172.20.10.8` is explicitly
  allowlisted through Next.js `allowedDevOrigins`; this changes development
  resource access only and does not alter production origins.
- The sender and recipient addresses are fixed server-side. No mail credential
  is stored in the repository or exposed to the browser.

## Deployment boundary

The static export does not execute PHP. During controlled cPanel release
assembly, `server/forms/teklif.php` must be copied to the document-root path
`/forms/teklif.php`. `npm run release:production` now creates the deployable
`release/production/` cPanel package with the static export and this endpoint.
The raw PHP source must never be copied into a generic
static preview artifact.

The local machine has no PHP CLI, so PHP syntax and real delivery cannot be
proved locally. Before release, staging must verify PHP 8.5 syntax, both form
variants, invalid submissions, throttling, Turkish character encoding,
`Reply-To`, spam handling, and actual delivery. A successful `mail()` return
only means the local mail system accepted the message; it does not prove inbox
delivery.

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
