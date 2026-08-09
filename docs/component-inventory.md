# Kalite Filo component inventory

Audit date: 2026-08-08

Status: audit and proposed component contracts only. This document does not implement UI or authorize unverified content.

## Purpose and authority

This inventory translates the local Stitch exports and connected Stitch project into a reusable Phase 1 component model. It is not an instruction to copy generated Stitch HTML. The implementation should follow this authority order:

1. Phase 1 scope and static-hosting constraints.
2. Verified company, legal, vehicle, article, and contact content.
3. [`references/stitch/DESIGN.md`](../references/stitch/DESIGN.md).
4. The local / connected “Güncellenmiş İletişim” screens as composition evidence.
5. Older connected “Unified” variants as rejected alternative evidence only.

Customer login, authentication, the customer portal, employee CRM, database work, ORM work, and an admin panel are excluded. No login component or route belongs in this inventory.

## Component principles

- Render ordinary content as static HTML. A component is not a reason to add client-side JavaScript.
- Use semantic links for navigation and buttons for actions. Do not reproduce inert `href="#"` links or navigation buttons from Stitch.
- Keep verified content in typed data records rather than embedded independently in page components.
- Build accessibility into primitives: focus indication, names, labels, errors, contrast, reduced motion, and keyboard operation are part of each contract.
- Use one canonical header, footer, card system, field system, and token layer across all public pages.
- Treat layout variants as explicit component variants, not copied markup forks.
- Preserve the Next.js static-export boundary: no Server Actions, middleware, runtime Next.js API routes, SSR, ISR, database, or production Node.js dependency.

## Foundation inventory

### Design tokens

The following values are documented design evidence. They should be normalized into one Tailwind CSS v4 theme before page work starts.

| Token role | Documented value | Contract and audit note |
| --- | --- | --- |
| Brand navy | `#182136` | Primary headings, dark sections, and navy CTA text. Do not also call it Corporate Blue, as the Stitch PRD does. |
| Corporate blue | `#014499` | Links, focus indicators, and selected structural states. |
| Accent orange | `#FFB343` | High-priority CTA backgrounds and restrained active accents. Navy text on this background has strong contrast. |
| Orange hover | `#D47504` | May be used as a background with suitable foreground. It fails normal-text contrast on white and must not be used as small orange text there. |
| Page surface | `#f8f9fb` | Default light page background. |
| Low surface | `#f2f4f6` | Section separation and quiet control backgrounds. |
| Card surface | `#ffffff` | Cards and field surfaces. |
| Primary text | `#182136` / `#191c1e` | Choose one semantic primary-text token and document the limited role of the other. Do not alternate per page. |
| Secondary text | `#5E6675` | Supporting copy; verified at normal text sizes on white/light surfaces. |
| Subtle border | `#E6E8EC` | Decorative separation. A stronger token is required where a control boundary must meet non-text contrast. |
| Error | `#ba1a1a` | Error text and states; never rely on color alone. |
| Content width | `1360px` | Inner content maximum, not the width of the full header background. |
| Gutters | `24px` desktop; `16px` mobile intent | Generated pages often retain 40px desktop padding at narrow widths; this must be corrected. |
| Section spacing | approximately `100px` desktop | Must reduce responsively; it is not a fixed mobile value. |
| Card padding / stack gap | `24px` / `16px` | Use density variants only when named below. |
| Radii | controls `8px`; cards `16px`; large containers `24px`; pill full | Generated configs incorrectly map common radius names to 4/8/12px and add ad hoc 32px values. |
| Primary / secondary control height | `54px` / `48px` | Icon-only controls still need at least a 44×44px target. |

The palette has known accessibility constraints: `#FFB343` on white is about 1.78:1, `#D47504` on white about 3.31:1, and `#D47504` on `#FCD8B6` about 2.46:1. Those combinations must not carry normal-sized text. Orange is safest as a background with navy text.

### Typography roles

| Role | Desktop | Mobile evidence/intent | Use |
| --- | --- | --- | --- |
| Display / H1 | 64px, 700, 1.1 | 40px, 700, 1.1 | Home and high-emphasis page titles only. |
| Section heading | 44px, 600, 1.2 | 32px, 600, 1.2 | Major sections and ordinary page titles. |
| Subheading | 30px, 600, 1.3 | A mobile size is not defined and must be chosen/tested | Card groups and article subsections. |
| Body large | 18px, 400, 1.6 | Responsive line length, not a smaller arbitrary font | Introductory copy. |
| Body | 16px, 400, 1.5 | Remains readable under zoom and text scaling | Default prose and form copy. |
| Label | 14px, 600, 1 | Labels and metadata; increase line-height for wrapping labels | Controls, tags, and compact metadata. |

The intended family is Plus Jakarta Sans. Production needs an approved self-hosted strategy and resilient fallback metrics. Contact and Login screenshots visibly render differently, and the Contact export has invalid document ordering; neither is valid typography evidence.

### Layout, surface, icon, and motion primitives

| Primitive | Contract |
| --- | --- |
| `PageContainer` | Full-width outer section plus a centered inner container, maximum 1360px, responsive inline padding. |
| `Section` | Named surface (`default`, `muted`, `navy`, and only where justified `accent`) with responsive block spacing. |
| `Stack` / `Cluster` / `Grid` | Spacing primitives that support wrapping, intrinsic sizing, and content-driven columns without page-specific negative margins. |
| `CardSurface` | White or tonal surface, one documented radius, subtle border, restrained optional hover elevation. |
| `Icon` | Local SVG or an approved code-native icon; decorative icons are hidden from assistive technology, meaningful icon-only controls receive a text name. Do not depend on Material Symbols fonts. |
| `Divider` | Decorative only unless it conveys grouping; control boundaries must use a stronger non-text contrast token. |
| `Motion` | Short, nonessential transitions; no content depends on hover or animation; honor `prefers-reduced-motion`. |

## Shared shell components

| Component | Evidence and variants | Required contract | JavaScript boundary |
| --- | --- | --- | --- |
| `SkipLink` | Missing everywhere | First focusable element; moves focus to `main`; visible on focus. | None. |
| `SiteHeader` | Repeated 80px fixed header on seven updated public screens | Full-width shell, inner `PageContainer`, approved logo/home link, primary navigation, quote link, current-page state. Omit customer login unless a separately approved external portal URL is supplied. | Static by default. Only the mobile disclosure may need a small island. |
| `PrimaryNavigation` | Four-item updated nav; incompatible eight-item Unified nav | One approved information architecture; real route links; `aria-current="page"`; no placeholder destinations. | None on desktop. |
| `MobileNavigation` | No supplied design; generated nav simply disappears | Visible menu trigger, labelled expanded state, keyboard/Escape/focus behavior, same destinations as desktop. Exact drawer/disclosure appearance remains a design decision. | One small client island if native disclosure is insufficient. |
| `Breadcrumbs` | Present on most inner pages, semantics vary | Labelled navigation, ordered list, real links, final item with `aria-current="page"`, responsive wrapping, fixed-header anchor offset. | None. |
| `PageHeader` | Multiple title scales and spacing treatments | One H1 per page, optional eyebrow/breadcrumb/intro, named `display` and `standard` variants. | None. |
| `SiteFooter` | Four-column dark footer; content and styling vary | One verified trade name, contact set, legal links, real `tel:`/`mailto:`, current year strategy, responsive groups. | None. |
| `NewsletterSignup` | Appears only on some screens | Either adopt consistently with verified provider, consent, privacy link, success/error flow and unsubscribe model, or omit globally. | Prefer native POST to approved PHP/external handler; no island for basic submission. |

## Action and navigation primitives

| Component | Variants | Contract |
| --- | --- | --- |
| `ActionLink` | `primary`, `secondary`, `outline`, `text` | Use for route/URL navigation. Must have a real destination, visible focus state, minimum target size, disabled state only when semantically justified, and optional trailing icon hidden from accessibility when decorative. |
| `Button` | `primary`, `secondary`, `outline`, `quiet`, `icon` | Use only for an action. Default type must be deliberate inside forms. Icon buttons require an accessible name. Loading must preserve the label and expose status. |
| `Link` | inline and standalone | Underline or another non-color cue where context does not already identify it as a link. |
| `Chip` | category, active filter, removable filter, static tag | A static tag is text; a filter is a button with pressed/selected state; a removable chip has a named removal control. Orange-on-light-orange text requires a revised accessible color pairing. |
| `Badge` | vehicle class, article category, featured | Informational only; do not make badge color the sole category signal. Use one normalized taxonomy. |

## Vehicle components

### Inventory

| Component | Variants/status | Required data and behavior |
| --- | --- | --- |
| `VehicleCard` | `featured` for Home; `catalog` for Vehicle List | Stable id/slug, verified make/model/trim, normalized category, fuel, transmission, approved image with dimensions/alt, and detail URL. Price is optional and may render only with verified tax, duration, kilometre, validity, availability, and disclaimer data. Whole-card link behavior must not create nested interactive controls. |
| `VehicleGrid` | One, two, or three intrinsic columns based on available card width | Maintains readable card width; must not switch to three columns beside a 288px filter panel at the current `md` breakpoint. |
| `VehicleCategoryNav` | Tabs/chips | One taxonomy shared with cards and detail pages. Must expose selected state and remain operable with keyboard/touch. |
| `ActiveFilterList` | Label plus removable chips | Announces filter changes, gives each remove button a specific name, and provides a clear-all action only when filters exist. |
| `VehicleFilterPanel` | Desktop sidebar; mobile presentation missing | Fieldsets/legends and native controls, result count, apply/reset behavior. On mobile use the documented bottom-sheet or full-screen-overlay concept after a design decision; do not leave the full desktop sidebar above results. |
| `VehicleResultsSummary` | Missing in updated export | Human-readable result count and current sort/filter summary. Dynamic announcements must be polite and not fire excessively. |
| `SortControl` | Missing in updated export | Native select or accessible menu with a real default and deterministic ordering. |
| `VehiclePrice` | Present but unverified | Hide numeric pricing until all commercial qualifiers are approved. Never present a demo amount as a current offer. |
| `VehicleDetailLayout` | Required Phase 1 component; no design supplied | Provisional contract only: one H1, approved gallery, factual specs, service/term notes, quote CTA, related vehicles, metadata. Visual design and verified fields are blockers. |
| `VehicleGallery` | Missing | Prefer static responsive images/thumbnails. A gallery enhancement must retain all images and captions without JavaScript. |
| `VehicleSpecList` | Missing as a detail component | Semantic definition list/table depending on data; units and unknown values handled consistently. |

The current list repeats the same image for Passat/Audi A6, Corolla Cross/Peugeot 3008, and Transit Custom/Fiat Fiorino. Those image references cannot populate the data contract.

## Editorial components

| Component | Variants/status | Required contract |
| --- | --- | --- |
| `ArticleCard` | `overlay`, `standard`, and `featured-split` are evidenced | Semantic `<article>` with one real article link, verified title/excerpt/category, publication date as `<time>`, optional reading time, approved image/alt, and predictable heading level supplied by context. |
| `ArticleGrid` | One-to-three columns | Equal rhythm without fixed heights that clip long Turkish titles; no keyboard-inert `cursor-pointer` wrappers. |
| `ArticleCategoryNav` | Horizontal category list | Normalize with card categories; wrap or scroll with a visible cue; expose current category. |
| `Pagination` | Numbered pagination is shown, but depth is invented | Use only for real generated routes/content volume. Label previous/next, expose current page, and keep targets large enough. |
| `ArticleHeader` | Blog detail evidence is incomplete | H1, category, author/reviewer where required, published/updated dates, reading time, and approved hero/caption. The document title and H1 must describe the same article. |
| `TableOfContents` | Desktop sticky sidebar | Real fragment links and heading IDs, mobile equivalent, fixed-header scroll margin, current-section enhancement optional. |
| `ArticleCallout` | Informational “Önemli Çıkarım” block | Tone/semantic role must match content; not every callout is an alert. Claims need approved sources. |
| `ComparisonTable` | Blog detail | Caption, scoped headers, readable mobile overflow or alternate layout, and no meaning conveyed only by red/orange/green icons. |
| `ArticleTags` | Static pills | Plain text or real category/tag links, not buttons without behavior. |
| `ShareActions` | LinkedIn, email, copy | LinkedIn/email are ordinary share URLs; copy-link may be a tiny client island with status announcement and fallback displaying the URL. |
| `RelatedContent` | Sidebar card | Semantic linked article/service card with verified destination; it needs a mobile placement rather than disappearing. |

## Corporate and conversion components

| Component | Evidence | Contract |
| --- | --- | --- |
| `MediaSplitSection` | Home commercial section; About hero/coverage | Responsive text/media order, approved image, one heading, optional CTA. Content must remain readable when image is unavailable. |
| `SolutionCard` | Four Home services | Icon, title, concise verified copy, real destination. Use link semantics rather than a clickable div. |
| `BenefitList` | Home and About | Semantic list with restrained icons; claims and guarantees must be verified. |
| `MetricCard` | About | Render only sourced metrics with definition/date; do not ship `15k+`, `98%`, `1200+`, or `98.5%` as design filler. |
| `CoveragePanel` | About map and statistics | Requires verified service geography and a local, accessible visual; the generated Turkey map is not proof of coverage. |
| `ConversionBanner` | Repeated navy “Hızlı Teklif” panel | One shared compact/standard variant, one real quote link, decorative image optional. Avoid page-specific duplicated markup and heavy shadows. |
| `ContactDetails` | Contact overlay and footer | One canonical address, phone, email, hours, and map destination from verified data. |
| `MapOrLocationPanel` | Contact blank map area | Prefer a static local map/location image plus an external map link unless an approved embedded provider and consent policy exist. |

## FAQ components

| Component | Contract | JavaScript boundary |
| --- | --- | --- |
| `FaqCategoryFilter` | Buttons with selected state and result count; categories must correspond to actual answers. Without JS, all questions remain visible. | Optional small island around the filter only. |
| `FaqList` | Semantic list grouped by category. | None. |
| `FaqItem` | Prefer native `<details>/<summary>` with visible focus, adequate target size, and answer content in the document. If custom, synchronize `aria-expanded`, `aria-controls`, IDs, and hidden state. | None when native details is used; do not hydrate every row. |
| `FaqContactBanner` | Real contact-page link and verified support copy. | None. |
| `FaqFeedback` | Current buttons imply unavailable persistence | Omit in Phase 1 unless an approved privacy-respecting analytics endpoint and purpose exist. | None if omitted. |

## Form components and submission contract

### Reusable form primitives

| Component | Required contract |
| --- | --- |
| `FieldGroup` | Semantic `fieldset`/`legend` when controls form a group; heading text alone is insufficient. |
| `TextField` | Unique `id`, stable `name`, connected visible label, input type/mode/autocomplete, required/optional text, hint, server/client error association, and retained value after failure where safe. |
| `SelectField` | Same label/error contract; a real placeholder option; no permanently disabled dependent field without an explained path forward. |
| `PhoneField` | One accessible field or a correctly labelled country-prefix group; normalized server validation; no decorative flag-only meaning. |
| `CheckboxField` | Control contained by/associated with label, sufficiently large target, required status only when legally valid, separate optional marketing permission. |
| `TextareaField` | Connected label, useful length guidance, responsive sizing, and server-side limits. |
| `FormErrorSummary` | Focused after failed submission, links to invalid fields, and coexists with field-level errors. |
| `FormStatus` | Distinct loading, success, failure, and retry messages; status announced without relying on color. |
| `SubmitButton` | `type="submit"`, stable name, duplicate-submission protection in the handler, and clear in-progress behavior only if enhanced. |

### Form assemblies

| Assembly | Evidence/status | Contract |
| --- | --- | --- |
| `QuickVehicleFinder` | Home visual shell | Either a GET-based navigation/filter form with meaningful query behavior or omit it. It must not remain an inert pair of selects. |
| `QuoteRequestForm` | Long corporate form | Native POST to an approved same-origin PHP endpoint or approved external processor; separate corporate/individual flows only if both are in verified scope; server-side validation, spam defense, legal notice, optional marketing consent, and static success/failure destinations. |
| `ContactForm` | Name/email/message visual shell | Same native POST contract; define recipient, required fields, privacy notice, retention, success/error states, and spam defense. |
| `NewsletterForm` | Inconsistent site-wide evidence | Implement only after provider, lawful basis/consent, double-opt-in decision, privacy copy, and unsubscribe process are approved. |

PHP form handlers are deployment infrastructure, not Next.js runtime routes. No form may rely solely on browser validation or a client component.

## Legal and utility components with no supplied design

| Component/page shell | Status and minimum contract |
| --- | --- |
| `LegalDocumentLayout` | Missing. Needs title, effective/update date, table of contents for long documents, semantic headings, readable prose width, and verified legal text. |
| `CookieNotice` / `CookiePreferences` | Missing. Build only to match actual nonessential cookies/trackers and approved legal policy; do not invent categories. Essential-only Phase 1 may not need a consent UI. |
| `FormResultPage` | Missing. Static success and failure/retry pages are needed for PHP redirects. They must not expose submitted data in URLs. |
| `NotFoundPage` | Missing. Static-export-compatible 404 with routes back to Home, Vehicles, and Contact. |
| `EmptyResults` | Missing. Vehicle/article filter empty state with clear reset action. |
| `ErrorState` | Missing. Image-independent, actionable message for recoverable client enhancements. |

## Client-island boundary

The default is no hydration. The following is the maximum justified interactive boundary based on current evidence; implementation should reduce it further where native HTML is sufficient.

| Potential island | Why it may need JavaScript | Required no-JS baseline |
| --- | --- | --- |
| Mobile navigation disclosure | Expanded state, focus return, Escape, optional modal behavior | Logo, quote link, and a usable navigation disclosure or footer navigation remain available. |
| Vehicle filter enhancement | In-page filtering/result count without a server runtime | All vehicles render and remain linked; category anchors or a plain GET/navigation path remain usable. |
| FAQ category enhancement | Hide/show categories without reload | All FAQ answers remain visible in native details. |
| Dependent location select | Populate district options if the approved quote schema retains city/district dependency | User can still submit a free-text or complete static option path; never strand a required disabled field. |
| Copy-link action | Clipboard API and confirmation | Visible canonical article URL and ordinary share links. |
| Consent preferences | Only if approved nonessential tracking actually exists | Essential site content and forms work without consent or JavaScript. |

Do not create client islands for static cards, typography, layout, breadcrumbs, footer, CTA banners, article prose, image galleries that can use links, newsletter submission, contact submission, or quote submission. Avoid a JavaScript carousel; an overflow/scroll-snap list with ordinary links and labelled controls is sufficient if a carousel remains.

## Accessibility contract shared by all components

- One H1 per page and a logical heading outline supplied by page context.
- Visible keyboard focus with at least 3:1 contrast against adjacent colors; never remove the outline without an equivalent.
- Navigation and actions operable at 200% and 400% zoom, with no content loss or two-dimensional page scrolling.
- Minimum 44×44px target for standalone controls, with sufficient spacing between adjacent targets.
- All meaningful images receive concise Turkish `alt`; decorative images use `alt=""`; no `data-alt` substitute.
- Component state is conveyed with text/semantics as well as color.
- Error text identifies the problem and correction; status changes use an appropriate live region only when dynamic.
- Hover enhancements have focus equivalents and do not hide information on touch.
- Motion respects reduced-motion preferences.
- Repeated navigation is consistent, and skip-link/main landmarks are present.
- External links, downloads, telephone, and email behavior are clear from context.

## Component definition of done

A component is ready for page assembly only when:

1. Its content source and optional/required fields are documented and verified.
2. Its semantic element and link/button behavior are correct without JavaScript.
3. Its mobile, tablet, desktop, zoom, long-copy, empty, error, and image-failure states are defined.
4. Keyboard, focus, accessible name, contrast, reduced-motion, and screen-reader behavior pass review.
5. It uses the canonical tokens rather than local arbitrary values.
6. Any client boundary is isolated, justified, and has a no-JS baseline.
7. It works in a Next.js static export and does not call prohibited runtime features.
8. It contains no placeholder link, fake fact, generated external asset, or excluded portal/auth behavior.

