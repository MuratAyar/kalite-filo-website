# Kalite Filo design audit

Audit date: 2026-08-08

Status: audit only; no website implementation is included in this document.

## Outcome

The repository is not an implementation of the Kalite Filo site yet. The only authored route is the default Create Next App home page. The useful design evidence consists of a design-system document, nine local Stitch exports, and 17 current screens returned by the connected Stitch project.

The recommended visual baseline is the local / “Güncellenmiş İletişim” screen family, after it is normalized against [`references/stitch/DESIGN.md`](../references/stitch/DESIGN.md). The older connected “Unified” family should not be mixed into implementation: it has a different information architecture, logo, footer, content, contact data, and visual treatment. It is retained as audit evidence only.

No production facts should be inferred from either screen family. Company details, prices, metrics, legal statements, service guarantees, vehicle availability, and image rights all require separate verification. See [content-gaps.md](./content-gaps.md).

## Sources inspected

- Every repository-authored file outside dependency and generated-output directories.
- All material under the actual repository path `references/stitch/` (the request said `reference/stitch/`; no singular `reference/` directory exists).
- All four files under `references/approved-content/`.
- Every current screen returned by connected Stitch project `4879537684187559462`, titled “Kalite Filo UI Tasarım Sistemi”.
- Relevant installed Next.js 16.2.11 documentation under `node_modules/next/dist/docs/`, especially static export, trailing slashes, images, static params, metadata, accessibility, forms, and production guidance.

### Connected Stitch coverage

Stitch returned 17 current screen records:

| Logical page | Current screen variants | Device evidence |
| --- | --- | --- |
| Home | Unified; Güncellenmiş İletişim | Desktop only |
| Vehicle list | Unified; Güncellenmiş İletişim | Desktop only |
| About | Unified; Güncellenmiş İletişim | Desktop only |
| Fleet guide | Unified; Güncellenmiş İletişim | Desktop only |
| Blog detail | Unified; Güncellenmiş İletişim | Desktop only |
| FAQ | Unified; Güncellenmiş İletişim | Desktop only |
| Quote form | Unified; Güncellenmiş İletişim | Desktop only |
| Contact | Unified & Güncellenmiş | Desktop only |
| Customer login | One screen | Desktop only; out of Phase 1 |
| Project PRD | Text artifact, 0×0 canvas | Not a visual screen |

All visual screen records are typed `DESKTOP` and are 2560 px wide. There are no `MOBILE` or `TABLET` records. The narrow local home and About PNGs are downsampled desktop compositions—the desktop navigation and multi-column layouts remain intact—so they are not mobile designs. The connected PRD’s statement that mobile adaptations are complete is contradicted by the screen inventory.

One connected record, `SSS (Unified)`, exposed its title, ID, dimensions, device type, and variant metadata but repeatedly rejected screenshot/HTML retrieval with Stitch MCP’s `Request contains an invalid argument` response. That limitation is recorded rather than treating the inaccessible body as inspected. The updated FAQ is fully covered by its local screenshot/HTML and connected metadata; the older Unified record remains alternative evidence only.

The nine local `code.html` exports match the connected updated screens/login byte-for-byte where both could be downloaded. The local PNGs are therefore the repository copy of that current direction.

## Design authority and conflict resolution

Use this order when implementation starts:

1. The Phase 1 scope and production constraints in the task request.
2. Verified company/legal/content facts supplied by Kalite Filo.
3. The tokens and principles in `references/stitch/DESIGN.md`.
4. The local updated screen family as layout and composition evidence.
5. The connected older Unified screens only as rejected/alternative evidence.

The filename `approved-content` must not be interpreted as proof that a fact is publishable. Those documents explicitly say that much of their content came from design screens and still requires official verification.

## Shared design system

### Intended foundation

The design document defines a coherent B2B “Corporate Modern” system:

| Area | Intended system |
| --- | --- |
| Typography | Plus Jakarta Sans; 64/44/30 px desktop headings, 40/32 px mobile headings, 18/16 px body, 14 px labels |
| Core colors | Navy `#182136`, corporate blue `#014499`, orange `#FFB343`, light surface `#f8f9fb`, white cards |
| Layout | 1360 px maximum content width; 12 desktop columns; 24 px gutters; 40 px desktop and 16 px mobile margins |
| Spacing | Approximately 100 px between major sections; 24 px card padding; 16 px stack gap |
| Shape | 8 px controls, 16 px cards, 24 px large containers, full-radius chips |
| Elevation | Borders and tonal surfaces first; restrained shadows only for active/hover states |
| Buttons | 54 px primary, 48 px secondary; orange is reserved for high-priority action and active states |

### Drift in generated screens

- Every generated Tailwind configuration maps `DEFAULT`, `lg`, and `xl` radii to 4/8/12 px, not the documented 8/16/24 px. Markup then adds unrelated 16 and 32 px radii ad hoc.
- Many cards and CTAs use `shadow-lg`, `shadow-2xl`, or strong glow effects despite the design rule favoring borders and low-contrast depth.
- Primary buttons are frequently 40 or 48 px high instead of 54 px.
- Contact uses orange across almost the whole page although orange is documented as a restricted action/active color.
- The Stitch PRD names `#182136` “Corporate Blue”, uses orange `#FFA726`, and surface `#FBF8FB`; `DESIGN.md` calls `#014499` Corporate Blue and defines orange `#FFB343` and surface `#f8f9fb`.
- The current app uses Geist/Arial rather than Plus Jakarta Sans, and its favicon is still the default Vercel triangle.

Implementation needs one token layer in Tailwind v4 and must stop copying per-screen token blocks.

## Page-by-page design findings

| Page | Useful evidence | Material issues |
| --- | --- | --- |
| Home | Clear hero, vehicle discovery, featured vehicles, service cards, conversion banner, editorial cards | Hero can clip when stacked; price claims are demo data; service/editorial cards have no destinations; large remote background; carousel controls are inert/unlabelled |
| Vehicle list | Strong desktop comparison hierarchy, filter vocabulary, active chips, consistent card anatomy | Sidebar and three-column grid collide at `md`; no mobile filter sheet; cards have no detail links; duplicate/wrong images; demo prices lack terms; category/badge taxonomy conflicts |
| Vehicle detail | None | Required Phase 1 page has no design at all |
| About | Useful themes for services, benefits, coverage, and metrics | Local capture is almost entirely washed out; two H1s; all metrics/guarantees unverified; fixed mobile mosaic; no real history, milestones, or corporate photography |
| Fleet guide | Featured article plus repeatable article-card grid and category navigation | All cards are design content; false pagination depth; no mobile navigation treatment; taxonomy conflicts with home cards; dates are stale/mixed |
| Blog detail | Readable desktop article layout, contents block, callout, comparison table, tags | Accidental second fixed header inside content; `<title>` and H1 describe different articles; no author/date/sources; table accessibility gaps; sidebar vanishes on mobile; regulated claims are unsourced |
| FAQ | Category chips, large question rows, support CTA | Only four answers for six categories; accordion state is inaccessible; fake emergency number; feedback buttons imply unavailable persistence; first editorial image visibly fails |
| Contact | Clear two-column contact/form concept and CTA | Malformed HTML, no title, placeholder address/email, blank map, serif-like rendering, oversized orange field, incomplete form semantics and legal notice |
| Quote | Logical corporate information groups and support panel | “Bireysel” has no alternate flow; demo option lists; disabled district; no real submission; combined privacy/marketing consent; unverified support number |
| Customer login | Design evidence only | Explicitly excluded from Phase 1; contains a literal Stitch data token and would require prohibited auth/portal work |
| Legal, 404, cookie controls, form result states | None | Required or operationally necessary screens are missing |

## Header audit

Seven updated public screens repeat an approximately 80 px fixed header, but it has not been designed as a robust shared component.

- The header itself is constrained to 1360 px rather than using a full-width shell with an inner container; its background and border can stop short on ultrawide viewports.
- Navigation links are `href="#"`; quote and login CTAs are inert buttons.
- Below `md`, all navigation links disappear and no menu trigger or mobile drawer replaces them. Only the logo and quote CTA remain.
- “Müşteri Girişi” appears everywhere although customer login, portal, and authentication are outside Phase 1. With no supplied external portal URL, it must be omitted.
- Active state differs by page: some use blue text, FAQ adds an underline, and none use `aria-current="page"`.
- Logo treatment varies between plain blue text and car-icon/wordmark variants. No approved vector logo has been supplied.
- Fixed-header behavior lacks skip-link and anchor-offset design.

## Footer audit

- Newsletter appears on Home, Vehicle List, About, and Contact, but not on Fleet Guide, Blog Detail, or Quote. FAQ inserts editorial cards instead. A single site-wide policy is needed.
- Copyright is hard-coded to 2024 on every updated screen.
- Most phone and email values are plain text rather than `tel:` and `mailto:` links.
- Muted footer copy varies in color/opacity and becomes very small in the narrow downsampled captures.
- Legal links are all placeholders and their pages do not exist.
- The Unified family contains a wholly different five-column footer, different trade name, address, telephone, and `.com` email. It must not be combined with the updated footer.

## Typography and spacing audit

- Plus Jakarta Sans is the correct documented family, but the Contact and Login captures visibly fall back to a serif-like face. Contact’s invalid document order puts font links after the body starts, making the design fragile.
- H1 sizes vary independently: Home grows 48→64 px, Quote/Guide 40→64 px, FAQ/Contact 32→44 px, while Vehicle List and Blog Detail keep desktop-scale headings at narrow widths.
- About has two H1 elements. FAQ uses a non-existent `text-headline-md-mobile` utility.
- Fixed 40 px desktop padding is used at small widths in many screens rather than the documented 16 px mobile margin.
- Section spacing is generous on desktop but produces very tall pages; repeated 100 px sections need responsive reductions.
- Card padding and button sizes vary between pages that are visually meant to share components.

## Vehicle-card audit

The useful common anatomy is: image, badge, make/model, trim, fuel, transmission, price/quote text, and CTA. It should become one semantic card component with explicit compact and catalog variants.

Current gaps:

- The documented “class” specification is absent.
- Cards are non-semantic `<div>` elements, are not keyboard links, and contain no crawlable vehicle-detail destination.
- The list uses the same image for Passat/Audi A6, Corolla Cross/Peugeot 3008, and Transit Custom/Fiat Fiorino.
- Badge taxonomy (`Premium`, `Executive`, `Ticari`, `SUV`) does not map cleanly to category taxonomy (`Binek`, `SUV`, `Hafif Ticari`, `Yönetici`, `İkinci El`).
- Prices omit VAT status, duration, annual kilometre, validity date, availability, and disclaimer.
- Home and list use different visual density and image heights without a named variant contract.

Until inventory and pricing are verified, the safe display is a quote CTA without numeric price or stock claims.

## Blog-card and article audit

Two reusable card variants are evident:

1. Image-overlay editorial cards used by Home, FAQ, and About.
2. Image-top article cards plus a split featured card used by Fleet Guide.

They should be explicit variants of a semantic `<article>`/link component. Current designs use keyboard-inert `div cursor-pointer` structures, inconsistent category names, generated images, and articles that do not exist in the repository.

The Blog Detail design needs author/byline, publication and updated dates, sources/reviewer for financial or legal claims, accessible share links, a table caption/header scopes, and a mobile alternative to the hidden contents/sidebar.

## Form audit

All forms are visual shells, not production flows.

- Quote has 14 controls, but only the consent checkbox has a connected `id`/`for`; the fields have no names and visual asterisks are not actual `required` attributes.
- Quote’s “Formu Gönder” is `type="button"`; forms have no action or method.
- Contact labels are not associated with controls, fields lack names, and no privacy notice is shown.
- Newsletter inputs are placeholder-only and have no approved consent, recipient, subscription provider, unsubscribe flow, or record mechanism.
- Home quick finder labels are disconnected from selects and the filter is inert.
- No design shows loading, validation, field errors, an error summary, success, failure, retry, or spam-challenge states.
- The quote checkbox combines notice acknowledgement, personalization, marketing processing, and commercial-message permission. The repository legal guidance requires marketing permission to be separate, optional, and unchecked.

Static export requires ordinary same-origin POST forms to approved PHP handlers (or an explicitly approved external processor), never Server Actions or Next.js API routes. The handler contract is an implementation prerequisite, not a detail to invent during UI work.

## Responsive findings

There is no validated mobile/tablet design. Breakpoint utility classes in generated HTML are not equivalent to design coverage. The largest risks are:

- no mobile navigation;
- fixed desktop margins on small screens;
- clipped full-height Home hero after controls stack;
- inline vehicle filter sidebar instead of the specified mobile sheet;
- implausibly narrow three-column vehicle cards at medium width;
- hidden Blog Detail contents/share/related content with no replacement;
- horizontally scrolling guide categories with hidden scrollbar and no cue;
- square Contact map/form areas with large fixed padding;
- fixed two-column About mosaic;
- newsletter text forced to `white-space: nowrap`;
- no touch, keyboard, zoom/reflow, reduced-motion, or long-Turkish-copy states.

See [responsive-gaps.md](./responsive-gaps.md) for the test matrix and acceptance criteria.

## Accessibility findings

High-priority issues visible in the evidence:

- No skip links and inconsistent semantic `header`/`nav`/`main` structure.
- Missing or weak `focus-visible` treatment; some controls remove outlines.
- FAQ buttons lack `aria-expanded`, `aria-controls`, and controlled-region IDs.
- Icon-only carousel, filter-chip removal, and pagination buttons lack accessible names.
- Many images use non-standard `data-alt` instead of an HTML `alt` attribute: all 10 Guide images, both Blog Detail images, the Quote image, three About images, and one Home image are affected.
- Meaningful CSS background images have no textual alternative.
- Visually clickable cards are not keyboard-focusable links.
- Blog comparison table has no caption or column/row header scope.
- Motion/scale effects do not respect `prefers-reduced-motion`.
- Orange `#FFB343` text on white is approximately 1.78:1 and fails WCAG AA for normal text. `#D47504` on white is about 3.31:1 and also fails for normal text. Orange works well as a background with navy text (approximately 9:1).
- Light borders such as `#c6c6cd` on white are about 1.7:1 and are too weak when the boundary is needed to identify a control.

## SEO findings

- The actual Next app still publishes “Create Next App” metadata and uses `lang="en"`.
- Stitch pages generally contain only a title and viewport; Contact and Login have no title.
- There are no descriptions, canonical URLs, Open Graph/Twitter metadata, robots/sitemap, social images, or structured data.
- Blog Detail’s document title describes a 2026 monthly-rental article while the breadcrumb/H1 says “Neden Operasyonel Kiralama?”.
- About has duplicate H1s; cards are not semantic articles/links; dates are plain text rather than `<time>`.
- Placeholder links and button-based navigation are uncrawlable.
- Structured data must wait for verified facts; do not invent Organization, Vehicle/Product/Offer, Article, Breadcrumb, or FAQ data.

## Images, icons, and external assets

Across the nine local Stitch HTML files there are:

- nine runtime Tailwind CDN imports;
- 24 Google Fonts/Material Symbols stylesheet references;
- 42 generated Google-hosted image references representing 31 unique `aida-public` URLs.

These are design evidence, not production assets. No provenance or usage rights are recorded. Captures already show failure modes: About is severely washed out, Contact’s map is blank, Contact’s CTA and FAQ’s first editorial card show an `img` placeholder, and some connected screens render icon names such as `support_agent` literally.

Production needs an approved vector logo, real favicon, licensed font files or an approved self-hosting strategy, owned/licensed photography, social-preview images, and manually prepared responsive image variants. Assets should be local, have intrinsic dimensions and focal crops, and use meaningful Turkish `alt` text or empty alt for decoration.

## Priority summary

### P0 — blocks implementation or launch

- Select the updated visual direction and reject mixed use of Unified variants.
- Remove customer login from Phase 1 navigation and routes.
- Obtain verified company, vehicle, legal, contact, claims, and asset data.
- Design missing vehicle detail, legal, 404, mobile/tablet, and form-result states.
- Define a static-export-compatible PHP form contract.

### P1 — must be solved in the component foundation

- Normalize tokens, header/footer, typography, spacing, radii, buttons, cards, and link behavior.
- Establish mobile navigation and filtering patterns.
- Build accessibility into primitives rather than patching generated markup.
- Replace all remote/generated assets and placeholder links.

### P2 — release quality

- Per-route metadata and structured data based only on verified facts.
- Complete responsive, keyboard, screen-reader, reduced-motion, contrast, and zoom testing.
- Validate image performance, link integrity, HTML semantics, and consistent content freshness.
