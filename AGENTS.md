<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kalite Filo permanent project guardrails

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

Do not implement or scaffold customer login, a customer portal, authentication, password recovery, employee CRM, CRM integrations, a database, an ORM, an admin panel, or a runtime CMS in Phase 1. Do not add placeholder routes or mock UI for these excluded systems.

## Required architecture

- Use Next.js `16.2.11`, the App Router, TypeScript strict mode, and Tailwind CSS v4.
- Preserve `output: "export"` and `trailingSlash: true`.
- The production host has no Node.js, npm, or npx runtime. Production consumes only a prebuilt Next.js static export artifact.
- Do not use SSR, ISR, Server Actions, Middleware, Proxy, runtime Next.js API routes, request-time rendering, a database, or an ORM.
- Prefer native and static HTML/CSS. Keep Server Components as the default and minimize client-side JavaScript to the smallest justified interactive islands.
- PHP is permitted only for separately approved form endpoints. The verified production runtime is PHP `8.5.8`, SAPI `cgi-fcgi`.
- Read the relevant installed Next.js `16.2.11` documentation under `node_modules/next/dist/docs/` before using or changing any framework API, convention, configuration, or route behavior.

## Verified environment and canonical routes

- Production origin: `https://kalitefilo.com.tr`, deployed at the domain root on TURKTICARET Web Eko Linux shared hosting with cPanel. HTTPS is enabled and forced.
- Staging origin: `https://staging.kalitefilo.com.tr`, with a separate document root. DNS, Let's Encrypt SSL, and forced HTTPS are configured.
- Use the public label “Filo Rehberi” with `/filo-rehberi/`, category routes at `/filo-rehberi/[category]/`, and article routes at `/filo-rehberi/[category]/[slug]/`.
- Use the label “Sıkça Sorulan Sorular” with `/sikca-sorulan-sorular/`.
- Use the CTA label “Teklif Al” with `/teklif-al/`.
- Customer login remains completely excluded from Phase 1.

These route decisions remain canonical unless a later verified business requirement explicitly overrides them.

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

Also verify that the completed work does not introduce a prohibited runtime feature or an avoidable client-side JavaScript dependency.
