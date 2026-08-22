# SMTP staging test checklist

Use this checklist only on `https://staging.kalitefilo.com.tr`. Never paste a
mailbox password into Git, a ticket, browser JavaScript, a Next.js environment
file, screenshots, logs, or the release directory.

## Prepare the release

- [ ] Run the full lint, typecheck, test, validation, staging build, and output verification gates.
- [ ] Run Composer locally under `server/forms/` with `--no-dev --prefer-dist --optimize-autoloader`.
- [ ] Run `npm run release:staging`.
- [ ] Confirm `release/staging/index.html`, `forms/teklif.php`, `forms/quote-mailer.php`, and `forms/vendor/autoload.php` exist.
- [ ] Confirm no `.env*` or `kalite-filo-mail.php` exists anywhere under `release/staging/`.

## Install private configuration

- [ ] Create `/home/<cpanel-user>/private/kalite-filo-mail.php` manually with permissions limited to the account/PHP process.
- [ ] Start with host `smtp.turkticaret.net`, `smtps`, port 465, and the provider-documented same-mailbox auth/From/recipient configuration.
- [ ] Do not put the real config under `public_html/` or the staging document root.
- [ ] If using `KALITE_FILO_MAIL_CONFIG`, confirm it contains an absolute path to a readable file outside both roots.

## Functional and security tests

- [ ] Submit valid Kurumsal and Bireysel requests from staging; verify the JSON-driven success dialog and quote number.
- [ ] Verify Turkish characters in subject, HTML body, and plain-text alternative.
- [ ] Verify the validated visitor address appears only as Reply-To.
- [ ] Reply to the received message and confirm it targets the visitor address.
- [ ] Verify invalid/missing fields, invalid content type, foreign Origin/Referer, honeypot, oversized body, and rate limit return generic safe failures.
- [ ] Verify SMTP/config failure shows only the existing generic browser error and does not expose paths, credentials, or PHPMailer diagnostics.
- [ ] Inspect spam/junk folders and mail headers; confirm TLS and authenticated submission.

## Provider compatibility matrix

- [ ] Baseline: authentication, From, and recipient all use the provider-supported `teklif` mailbox configuration.
- [ ] Desired second test: change private config only so authentication/From use `noreply` and recipient uses `teklif`.
- [ ] Repeat on STARTTLS/587 if required; never disable certificate verification.
- [ ] Record which identity/port combination TURKTICARET accepts, without recording any password.

## Promotion

- [ ] Confirm SPF/DKIM/DMARC and deliverability with the hosting/mail administrator.
- [ ] Re-run the same checks against a separately assembled production artifact before upload.
- [ ] Keep a rollback copy of the previous document root.
