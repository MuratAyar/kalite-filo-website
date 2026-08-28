# Kalite Filo content gaps

Audit date: 2026-08-08

Status: audit only. This document records missing, conflicting, placeholder, and unverified content. It does not supply replacement company facts or legal advice.

## Current-state reconciliation — 2026-08-13

This addendum supersedes only the affected gap statements below; the original audit remains as source history.

- The project owner has now verified `05317158068` and `info@kalitefilo.com.tr` for public contact use. Address, company legal identity, support/call-centre channels, business hours, social URLs, and other contact roles remain unresolved.
- The approved registry now contains 12 decisions: 10 static routes and the two existing vehicle/article detail families. `/kvkk-ve-guvenlik/`, `/cerez-politikasi/`, and `/kullanim-kosullari/` have neutral static skeletons in `canonical-path` state. They remain unpublished, noindex, and outside the sitemap; legal body text, version, effective date, owner, and application/contact details are still missing.
- The 32 owner-supplied portfolio records are preserved in local typed data and now render in the unpublished `/arac-listesi/` catalogue and 32 statically generated `/arac-listesi/[slug]/` detail pages. On 14 August 2026, the project owner explicitly approved the `Portföy_32` `Önerilen Liste Net` values for display as monthly TRY net list prices with `KDV hariç`; the same source supplies the Home-card amounts. This does not establish `Nihai Yayın Net`, VAT-inclusive totals, binding offers, availability promises, approved duration/kilometre assumptions, validity, service scope, contract terms, or final publication readiness. Twenty-eight representative model-family images have been individually licence/visual-match reviewed and promoted to local assets; `KF-015`, `KF-026`, `KF-030`, and `KF-031` deliberately remain image-less because the available candidates materially mismatched the records. Final per-record publication approval, multi-image galleries, crops, active quote/basket workflows, and alt review remain blocked.
- Eighteen owner-supplied Markdown articles are integrated through category-aware static detail pages; six have local WebP assets. Article authors, reviewers, citations/sources, final editorial review, and publication approval remain unresolved.
- The unpublished `/filo-rehberi/` index now presents all 18 supplied records across six approved categories, with one featured item and a real six-items-per-page client pagination control. Six records have matched local covers; the other 12 use an honest non-photographic fallback because no additional images were supplied. It does not fabricate detail links; article authors, reviewers, citations/sources, final editorial metadata, article-detail rendering, and publication approval remain unresolved.
- Home remains registry status `foundation`, emits noindex behavior, and is excluded from the still-empty sitemap.

## Outcome

No page currently has a complete publishable content package. The repository contains useful brand direction and design copy, but not a verified corporate identity set, legal texts, vehicle inventory, article corpus, form-processing contract, or licensed production asset library.

The folder name `references/approved-content/` must not be read as proof that every statement is production-approved. The files explicitly say they were derived from design screens and identify facts that still require company or legal verification.

## Source authority

Use this order when resolving content conflicts:

1. The explicit Phase 1 scope and production constraints in the task request.
2. Official, current facts and publishable copy supplied by Kalite Filo and its legal advisers.
3. The four `references/approved-content/` files as structured requirements and provisional wording.
4. The updated/local Stitch family as design and content-shape evidence only.
5. The older connected “Unified” screens as rejected alternative evidence only.

Do not combine phone numbers, addresses, company names, claims, or content from different screen families. Do not infer a fact merely because it appears repeatedly in generated HTML.

## Verified pre-foundation facts

The following infrastructure and naming facts were verified after the original audit. They are no longer content gaps:

- canonical production origin: `https://kalitefilo.com.tr`;
- production deployment at the domain root on TURKTICARET Web Eko Linux shared hosting with cPanel;
- no Node.js, npm, or npx runtime in production; production receives only a prebuilt Next.js static export artifact;
- production PHP `8.5.8`, SAPI `cgi-fcgi`, reserved for later approved form endpoints;
- forced HTTPS on production;
- staging origin `https://staging.kalitefilo.com.tr`, with a separate document root, working DNS, Let's Encrypt SSL, and forced HTTPS;
- public fleet-content name **Filo Rehberi**, index `/filo-rehberi/`, category family `/filo-rehberi/[category]/`, and article family `/filo-rehberi/[category]/[slug]/`;
- FAQ label **Sıkça Sorulan Sorular** at `/sikca-sorulan-sorular/`;
- quote CTA label **Teklif Al** at `/teklif-al/`.

Except for the later explicitly verified public phone/email, portfolio records, supplied articles/assets, and the 14 August 2026 monthly net list-price approval recorded above, these verifications do not approve any company identity, contact detail, legal wording, vehicle offer condition, claim, image, font, article, or form-processing behavior listed below.

## P0 launch blockers

### Official company identity

The following are absent or explicitly unverified:

- exact registered commercial title;
- confirmation that the legal form is an A.Ş.;
- MERSİS number;
- trade registry number and registry office;
- tax office and tax number;
- KEP address;
- registered head-office address;
- authorized corporate email and phone;
- relevant ETBİS, licence, permission, certification, association, or membership details.

The canonical web origin is verified, but it is not evidence for the company identity fields above.

“Kalite Filo” is the consistent brand label. “Kalite Filo Kiralama A.Ş.” appears in design footers, but `legal-status.md` says the exact title and legal structure must be checked against official records.

### Contact channels

Candidate values in the reference material are not a completed verified contact set:

| Field | Evidence | Status |
| --- | --- | --- |
| Main phone | `+90 531 715 80 68` / `0531 715 80 68` | Candidate; verify before launch |
| General email | `info@kalitefilo.com.tr` | Candidate; verify before launch |
| Support email | `destek@kalitefilo.com` | Conflicts with general email; confirm whether it exists and its purpose |
| Call centre | `444 28 47` | Explicitly marked “verification required” |
| Emergency road assistance | `0850 XXX XX XX` | Literal placeholder; must not ship |
| Address | `Merkez Mah. No:123, Şişli / İstanbul` | Explicit placeholder; must not ship |
| Social media | Instagram, LinkedIn, Facebook, X, YouTube, TikTok are suggested | No verified URLs supplied |

Also obtain, if the company wants them published, business hours, branch/service locations, map coordinates/provider choice, support escalation channels, and accessibility details for physical locations. Their absence must not be filled with guessed values.

### Legal copy

`references/approved-content/legal-status.md` is a checklist, not publishable legal text. Counsel-approved content is missing for:

- KVKK/privacy policy, including data controller, data categories, purposes, legal grounds, recipients, retention, rights, and application methods;
- contact-form notice;
- quote-form notice;
- newsletter notice, if newsletter remains in Phase 1;
- cookie policy based on the actual cookies and vendors;
- terms of use;
- commercial electronic communication permission;
- price, VAT, term, kilometre, service-scope, availability, and offer-validity disclaimers;
- versioning and retention rules for notice/consent records.

Customer-login notices and authentication policies are not Phase 1 work because login/auth/portal are explicitly excluded.

### Forms and processing contract

The quote workflow now has an approved native field contract, privately
configured SMTP sender/recipient identities, user-facing result copy, and a
secret-free PHP 8.5 handler
under `server/forms/teklif.php`. The handler includes server-side validation,
same-origin checks, a honeypot, and a small hashed-IP rate limit. Real cPanel
mail delivery, privacy/retention decisions, counsel-approved disclosure and
consent wording, and staging abuse testing remain unresolved launch gates.

Before forms can be implemented, provide:

- endpoint and HTTP method;
- allowed field names, types, lengths, and required/optional status;
- Turkish validation and error messages;
- recipient/owner and response-time expectation, if this will be promised publicly;
- server-side validation, sanitization, rate limiting, spam protection, and logging rules;
- success, failure, duplicate, retry, and unavailable-service copy;
- retention/deletion policy and access controls;
- approved privacy-notice link/version;
- whether any optional marketing consent is collected and how its timestamp/text version is durably recorded.

The quote design combines privacy acknowledgement, personalization, marketing processing, and commercial-message permission in one checkbox. This conflicts with the repository legal guidance: marketing consent must be separate, optional, and unchecked, and it must not be presented as necessary to request service.

Phase 1 still prohibits a database and CRM implementation. The approved PHP boundary now records newsletter consent evidence and form-origin email leads in a locked CSV file outside the public document root. Newsletter rows remain pending until a later confirmation workflow exists; quote and contact rows are lead-only and must not be treated as newsletter or commercial-message consent. Server Actions and Next.js API routes remain prohibited.

## Unverified claims and service promises

Do not publish the following without current documentary support and business/legal approval:

- `15K+` active fleet;
- `1200+` service points or “authorized” service points;
- `%98`, `%98.5`, customer satisfaction, operational satisfaction, or operational readiness;
- `7/24` support or road assistance;
- `%40'a kadar` operational-load or cost benefit;
- nationwide coverage;
- replacement-vehicle guarantee;
- uninterrupted operation guarantees;
- all maintenance, repair, damage, insurance, MTV, tyre, or replacement-car costs being included in every agreement;
- an intelligent reporting portal, digital single-screen management, live telematics, safety analysis, or fuel optimization;
- fixed/predictable cost claims without conditions;
- electric/hybrid availability and sustainability outcomes;
- complete deductibility, VAT deductibility, or corporate-tax-base effects;
- campaign pricing or “2026 opportunities.”

Where a claim is valid only for specified contracts, vehicles, regions, time periods, or customer profiles, supply the qualification and evidence. Tax, accounting, finance, insurance, safety, and regulatory copy needs an identified reviewer, publication date, sources, and update policy.

## Cross-source conflicts and resolutions

| Topic | Conflict | Status / required action |
| --- | --- | --- |
| Guide name | Navigation/breadcrumbs say “Blog”; index H1 says “Filo Rehberi” | **Resolved:** use “Filo Rehberi”, `/filo-rehberi/`, `/filo-rehberi/[category]/`, and `/filo-rehberi/[category]/[slug]/`; do not create a duplicate `/blog/` family |
| FAQ name | “SSS,” “Sık Sorulan Sorular,” and “Sıkça Sorulan Sorular” all appear | **Resolved:** use “Sıkça Sorulan Sorular” and `/sikca-sorulan-sorular/` |
| Quote name | CTA says “Teklif Al”; page says “Araç Fiyat Teklif Formu” | **Resolved for navigation:** use “Teklif Al” and `/teklif-al/`; final page copy still requires approval |
| Corporate email | `info@kalitefilo.com.tr` versus `destek@kalitefilo.com` | Verify channels and use cases |
| Phone | Mobile number, unverified `444 28 47`, and fake `0850 XXX XX XX` | Supply one verified public/contact/support matrix |
| Company title | Abbreviated `A.Ş.` versus spelled-out “Anonim Şirketi”; neither officially confirmed | Use exact registry title after verification |
| Metrics | `%98` customer satisfaction versus `%98.5` operational satisfaction/readiness | Supply a defined metric, period, methodology, and evidence or remove |
| Rental term | Home/FAQ say 12–48 months; vehicle model and quote UI list 12/24/36 | Approve actual available terms |
| Annual kilometre | Proposed vehicle model includes 10k/15k/20k/30k; quote UI lists 15k/20k/30k | Approve actual options and whether vehicle-specific |
| Vehicle taxonomy | Categories, body types, badges, segments, and “Executive/Premium” are mixed | Define one controlled taxonomy |
| Editorial taxonomy | Approved eight categories differ from Home/FAQ/About labels such as Rehber/Teknik/Bakım | Define one controlled taxonomy and slug set |
| Article identity | Blog-detail document title describes a 2026 monthly-rental guide; H1 says “Neden Operasyonel Kiralama?” | Supply the final article identity and metadata |
| Dates | Guide uses 2024 dates and a 2025 title; related card advertises 2026; footers say 2024 | Review freshness; derive footer year rather than publishing stale dates |
| Audience | Brand positioning is corporate/B2B; quote design includes “Bireysel” with no alternate fields | Confirm corporate-only Phase 1 or supply a separately approved consumer flow |
| Data architecture | Reference notes suggest CMS/API/database and CRM readiness; Phase 1 prohibits database/admin/CRM | Use verified repository-local/build-time data and approved PHP/external form delivery only |

## Page-specific content gaps

### Home

Available direction:

- approved brand messages and B2B positioning;
- four top-level service themes;
- featured-vehicle, benefit, quote, and editorial section shapes.

Missing or unresolved:

- final hero copy and proof for “premium fleet”/cost-reduction statements;
- verified featured vehicles, versions, availability, and remaining offer/display qualifications beyond the approved monthly KDV-excluded net list amounts;
- real service inclusions and qualifications;
- destination for every “Keşfet”/“Detaylı İncele” action;
- full content/destinations for the three editorial cards;
- approved newsletter retention, confirmation/unsubscribe and IYS synchronization flow;
- licensed hero, commercial-fleet, facility, and editorial images.

### About

The page says “Kurumsal Hikayemiz” but no real corporate story exists. Supply:

- founding/history and dated milestones;
- mission, vision, and values if the company wants them public;
- leadership/ownership information if approved for publication;
- actual operating model, coverage, support, and service-network facts;
- proof and definitions for all metrics;
- verified descriptions of telematics, digital tools, sustainability, maintenance, road assistance, and replacement vehicles;
- approved company/team/fleet/facility imagery.

“Kilometre Taşlarımız” and “Vizyonumuz” controls currently lead nowhere. Content and anchor targets are required, or the controls should be removed.

### Vehicle portfolio

All vehicle names, trims, prices, and images in Stitch are demo content. `vehicles.md` correctly says those Stitch prices must not be published as real prices. The current card amounts are instead sourced from the owner-supplied workbook and its separately approved `Önerilen Liste Net` column.

For every vehicle that will appear, supply and verify:

- stable ID and slug;
- make, model, trim/version, and model year;
- category, segment, body type, fuel, transmission, and engine;
- power, seats, and doors where displayed;
- available rental terms and annual-kilometre options;
- availability status and its update date;
- featured status and controlled badge;
- the approved monthly net list amount is now present; a complete offer still needs any applicable validity, duration, kilometre, quantity, service assumptions, and binding-offer qualifications;
- cover image, gallery, provenance/licence, focal crop, dimensions, and Turkish alt-text intent;
- short description and verified feature list;
- included/excluded services and qualifications;
- SEO title and description.

Vehicle detail now has a production-design-system composition for the supplied summary, available technical facts, list-net price disclosure, inert quote/basket controls, and four same-category related vehicles. Multi-image galleries, approved rental options, included-service claims, FAQ content, binding quote behavior, basket behavior, and final publication approval remain unresolved.

The owner-approved monthly KDV-excluded net list amounts may be shown with explicit `Aylık Liste Net`, `₺…/ay`, and `KDV hariç` labels. Do not turn them into stock claims, VAT-inclusive totals, `Nihai Yayın Net`, or a binding offer, and do not publish the workbook's template duration/kilometre values as approved terms.

### Filo Rehberi

No article body is approved as production editorial content. The listing visually contains one featured item plus nine cards and fictitious pagination through page 12. Home, FAQ, and About also reference three additional articles that are not represented by full content files.

Each article needs:

- stable slug and final title;
- excerpt/deck;
- approved category and optional tags;
- author and, where needed, expert/legal reviewer;
- publication and last-updated dates;
- reading-time rule;
- complete structured body and heading/TOC anchors;
- source list and qualification of time-sensitive claims;
- cover/social image, rights, caption, and alt-text intent;
- SEO title, description, canonical path, and social summary;
- related-content references that resolve to real articles/routes.

The current detail article lacks author, date, update, and sources, and contains unsupported financial/tax claims. The “2026 campaign” card must be removed unless a real approved campaign with terms and destination is supplied. Pagination must derive from the real article count.

### FAQ

The production page now contains six claim-safe answers in four categories. They are limited to service definitions and the operational flow already recorded in `references/approved-content/company.md`; the Stitch-only hotline, term ranges, tax statements, service-inclusion promises, replacement-vehicle guarantees, and feedback controls were not adopted.

Required work:

- verify any future procedural answer with operations/legal teams;
- qualify contract-dependent service inclusions and replacement vehicles;
- expand categories only when approved questions exist; the current navigation contains no empty category;
- add approved content on contract, payment, vehicle use, kilometre excess, maintenance/tyres, incidents, returns, availability, pricing, and privacy as applicable;
- decide whether feedback collection remains omitted or is connected to an approved privacy-respecting processor.

Do not invent answers to make the design look populated.

### Contact

Missing:

- verified address, phone, email roles, map/location, and social links;
- approved page introduction and response expectation;
- decision on suggested phone, company, and subject fields;
- form notice/legal basis and optional marketing separation;
- endpoint/recipient, validation copy, spam protection, and all result states.

The placeholder address and conflicting support email in Stitch must not be carried into implementation.

### Quote request

The intended corporate fields are documented, but production values and behavior are incomplete:

- confirm corporate-only scope and remove “Bireysel” unless a separate approved flow is supplied;
- approve required versus optional fields;
- supply the complete sector and location strategy, or choose validated free text rather than demo lists;
- approve rental-term and kilometre options;
- decide whether make/model is free text, selected from the verified catalogue, or prefilled from a vehicle page;
- supply phone format/validation rules;
- verify the support number;
- replace the combined consent copy with counsel-approved notice and separate optional permissions;
- define submission/result copy and handling contract.

### Legal pages

No legal page has final body copy, effective/update date, owner, version, or contact/application destination. Layout can only begin with neutral content primitives; production wording must come from counsel.

## Images, logo, fonts, and external assets

The nine local Stitch exports contain 42 Google-hosted generated-image references representing 31 unique `aida-public` URLs, nine Tailwind CDN imports, and 24 Google Fonts/Material Symbols stylesheet references. They are design evidence, not a production asset licence or delivery plan.

Missing asset package:

- approved vector wordmark/logo and usage rules;
- real favicon/app icons;
- approved self-hosted Plus Jakarta Sans files or another licensed font strategy;
- owned/licensed home, company, office, service-network, contact/map, and editorial photography;
- approved representative images for the four image-less records, plus any required per-vehicle gallery images;
- social-preview images;
- intrinsic dimensions, responsive variants, focal points, captions, and Turkish alt-text intent;
- provenance/licence/expiry records.

Known defects include duplicate images across different vehicle models, nonstandard `data-alt` instead of `alt`, broken/blank image areas in captures, and generic English generated descriptions. Do not hotlink the Stitch URLs.

## SEO content gaps

Before launch, supply or approve:

- Turkish site name and default title template;
- unique title and description for every index, detail, form, and legal page;
- filter/query URL indexing and canonicalization policy; the main Filo Rehberi route family is already fixed at `/filo-rehberi/`, `/filo-rehberi/[category]/`, and `/filo-rehberi/[category]/[slug]/`;
- social titles/descriptions/images;
- index/noindex decisions for filter states and any form result pages;
- Organization details only after official facts are verified;
- per-vehicle structured data only where accurate price/offer facts exist;
- article author/date/update/source data;
- FAQ structured data only for visible, approved answers;
- sitemap inclusion rules and robots policy.

The current app’s generic metadata and English language declaration must be replaced, but structured data must not be invented merely to satisfy an SEO checklist.

## Content readiness checklist

Do not mark content ready until:

- [ ] Official company identity and contact matrix are signed off.
- [ ] Unsupported metrics and guarantees are evidenced, qualified, or removed.
- [ ] Vehicle records and images are verified individually.
- [ ] Price/availability wording and disclaimers are approved.
- [x] The Filo Rehberi canonical name and route family are selected.
- [x] The Sıkça Sorulan Sorular label and route are selected.
- [x] The Teklif Al CTA label and route are selected.
- [ ] Every published article has full body, dates, owner/reviewer, and sources where needed.
- [ ] FAQ answers and emergency/support channels are operationally approved.
- [ ] Legal pages and form notices are supplied by counsel.
- [x] The quote PHP contract and result messages are defined; contact and any
  newsletter confirmation, unsubscribe and IYS synchronization remain unresolved.
- [ ] Pending newsletter registrations are not promoted to confirmed/IYS-approved until the approved downstream workflows exist.
- [ ] Logo, font, image rights, crops, and alt-text intent are supplied.
- [ ] Footer copyright, contact links, and every CTA destination are resolved.

See [page-inventory.md](./page-inventory.md) for canonical/proposed route statuses and [design-audit.md](./design-audit.md) for visual evidence and component issues.
