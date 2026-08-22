# Kalite Filo public website

This repository contains the Phase 1 public corporate website foundation for Kalite Filo. The application uses Next.js 16.2.11, the App Router, strict TypeScript, Tailwind CSS v4, and a static export. Website page implementation and unverified business content are intentionally deferred.

Read [AGENTS.md](AGENTS.md) and the audit documents in `docs/` before changing the project. Material in `references/stitch/` is design evidence only; it is not deployable source or approved content.

## Runtime boundary

Production is `https://kalitefilo.com.tr` at the domain root. Staging is `https://staging.kalitefilo.com.tr` with a separate document root. Both force HTTPS.

The production host is TURKTICARET Web Eko Linux shared hosting with cPanel. It has no Node.js, npm, or npx runtime, so it consumes only a prebuilt release artifact. PHP 8.5.8 (`cgi-fcgi`) serves the separately approved quote endpoint; it does not render the Next.js site.

## Local requirements

- Node.js 20.9.0 or newer
- npm with `npm ci` support
- PHP 8.5 CLI for project-owned PHP syntax/config tests
- Composer 2 for installing the release-time PHPMailer runtime

Install the locked dependencies on a development or CI machine:

```sh
npm ci
composer --working-dir=server/forms install --no-dev --prefer-dist --optimize-autoloader --no-interaction
```

No dependency installation occurs on production.

## Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm test
npm run validate
npm run build:staging
npm run build
npm run verify:output
npm run release:staging
npm run release:production
```

`npm run build:staging` freezes the staging origin and non-indexing directives into `out/`. `npm run build` produces the production-target artifact. Unknown build targets fail; the development fallback is staging/noindex. The two environments require separate builds because a static artifact cannot discover its request host.

`npm run verify:output` checks the current static artifact after a build.
`release:*` assembles the target-specific static files with the reviewed PHP
quote endpoint and its locally installed Composer runtime. Private SMTP config
is never part of this package. `next start` is deliberately not part of this project.

## Repository boundaries

- `src/app/`: static App Router entry points and metadata files
- `src/components/`: neutral shared Server Component primitives; client islands require a documented need
- `src/config/`: verified origins and explicit approved-route registry
- `src/types/`: content contracts
- `src/data/`: reviewed build-time records; arrays remain empty until facts are approved
- `src/content/`: guidance for repository-owned editorial content
- `public/`: approved static assets only
- `server/forms/`: PHP quote endpoint, authenticated SMTP boundary, and Composer manifest
- `server/php/`: boundary notes for separately approved future PHP endpoints
- `deploy/apache/`: deferred, staging-tested Apache deployment material
- `references/`: approved-content inputs and non-production design evidence

Do not add SSR, ISR, Server Actions, Middleware/Proxy, runtime Next.js API routes, databases, ORMs, authentication, a customer portal, CRM, or an admin panel. Customer login is outside Phase 1.

## Content and assets

Do not invent company facts, contact details, legal text, vehicle inventory, prices, commercial claims, article content, dates, image rights, fonts, or form behavior. Plus Jakarta Sans is the intended family, but the site uses a safe system stack until licensed local WOFF2 files with Turkish coverage are supplied. The current icon is an obvious foundation placeholder and must be replaced by approved brand artwork before launch.

## Deployment outline

1. Run the complete quality gate on a development or CI machine.
2. Build the target-specific static artifact.
3. Install the locked `server/forms/` Composer runtime and assemble the target release.
4. Upload the versioned artifact to the target cPanel document root.
5. Verify HTTPS, routes, robots, metadata, 404 status, caching, and rollback on staging before production.

Project-owned Apache rules remain deferred. Quote SMTP credentials belong only
in the cPanel account-private configuration described in
`server/forms/README.md`; never place them in Git, Next.js env, or a release.
