# Kalite Filo responsive coverage and gaps

Audit date: 2026-08-08

Status: audit and acceptance criteria only. No responsive implementation or new visual design is included.

## Outcome

There is no supplied mobile or tablet design for the Phase 1 site. Breakpoint classes inside generated Stitch HTML are implementation suggestions, not validated responsive designs.

All visual screens returned by connected Stitch project `4879537684187559462` are labelled `DEVICE_TYPE_DESKTOP` and are 2560px wide. The project contains updated and older Unified desktop variants, but no mobile or tablet record. The connected PRD’s statement that mobile adaptations are complete is contradicted by this metadata.

The recommended baseline remains the local / “Güncellenmiş İletişim” desktop family, normalized against [`references/stitch/DESIGN.md`](../references/stitch/DESIGN.md). Responsive layouts require explicit design decisions and testing before they can be considered approved.

## Supplied evidence

### Local raster evidence

| Screen | Local PNG dimensions | What the image actually demonstrates |
| --- | ---: | --- |
| Home | 367×1600 | A downsampled desktop composition: desktop nav, three vehicle cards, and multi-column sections remain. It is not a 367px mobile layout. |
| Vehicle list | 1274×2496 | Desktop sidebar plus three-column results. |
| Blog detail | 1280×2259 | Desktop article plus right sidebar. |
| Fleet guide | 1280×2565 | Desktop featured split and three-column article grid. |
| About | 448×1600 | A downsampled desktop composition, mostly washed out; not reliable mobile evidence. |
| Contact | 1290×1913 | Desktop two-column map/form layout. |
| Customer login | 1305×1490 | Desktop-only and outside Phase 1. |
| FAQ | 1283×2552 | Desktop category row and wide accordion. |
| Quote form | 1277×2287 | Desktop two-column form/sidebar layout. |

The narrow Home and About file widths must not be interpreted as mobile viewports. Connected versions identify those screens as desktop, and their preserved desktop layout confirms that they were resized/downsampled exports.

### Intended responsive rules in DESIGN.md

- Desktop: 12 columns, 24px gutters, content maximum 1360px.
- Tablet: 8 columns, 16px gutters, 24px margins.
- Mobile: 4 columns, 16px gutters and margins.
- Vehicle filters: sticky bottom sheet or full-screen overlay on mobile.
- Mobile display and section heading intentions: 40px and 32px.

These are the only explicit responsive design directions. They do not define detailed header, footer, form, table, card, mobile navigation, or interaction states.

## QA viewport targets — not supplied designs

The following are implementation test targets chosen to expose reflow failures. They are not Stitch frames, approved mockups, market-share claims, or new design requirements.

| QA target | Purpose |
| --- | --- |
| 320×568 | Minimum narrow-width reflow and long Turkish copy stress test. |
| 360×800 | Compact mobile portrait. |
| 390×844 | Common modern mobile portrait and touch-target review. |
| 412×915 | Large mobile portrait. |
| 768×1024 | Tablet portrait and the current `md` transition risk. |
| 1024×768 | Tablet landscape / small laptop; sidebar and grid pressure. |
| 1280×800 | Compact desktop and short-height viewport. |
| 1440×900 | Primary desktop composition review. |
| 1920×1080 | Wide desktop, max-width shell behavior, and excess whitespace. |

Also test browser zoom at 200% and 400%, text-only scaling to 200%, portrait/landscape orientation, reduced motion, keyboard-only input, and with remote requests blocked. At 400% zoom, the effective layout should reflow to roughly a 320 CSS-pixel presentation without loss of content or function.

Breakpoints should be selected from content pressure observed during implementation. Passing these targets matters more than mechanically preserving the generated `sm`/`md`/`lg` class choices.

## Shared shell gaps

| Area | Current evidence/problem | Required responsive decision | Acceptance check |
| --- | --- | --- | --- |
| Header shell | The fixed nav itself is max-width 1360px, so its background/border may stop on wide screens. | Full-width shell with constrained inner content. | At 1920px, header background spans the viewport while content remains aligned to the page grid. |
| Mobile navigation | Primary links and login are hidden below `md`; no menu replaces them. | Define labelled disclosure/drawer behavior. Omit excluded login. | At 320px and 400% zoom, every Phase 1 destination is keyboard/touch reachable, state is announced, Escape/focus return work if modal, and page content is not covered unexpectedly. |
| Fixed header offset | Body top padding is copied per page; article anchors have no scroll offset. | One shell-owned header height/offset strategy, resilient to wrapped content. | Page H1 and fragment targets are fully visible after load/navigation at every target and text scale. |
| Container gutters | Many sections retain 40px desktop padding on mobile. | 16px mobile, 24px tablet, 40px desktop intent with safe-area awareness where applicable. | No main content becomes unnecessarily narrower than 288px at the 320px target. |
| Breadcrumbs | Long final labels can remain on one line or use inconsistent markup. | Allow wrapping or horizontal-safe truncation only where the full current page name remains available. | No breadcrumb creates page-level horizontal scrolling; current item is understandable. |
| Footer | Four columns collapse, but spacing, type size, and contact formatting vary. | Ordered single-column mobile groups, optional two-column tablet layout, consistent links. | At 320px/200% text, all links wrap, targets remain separate, and phone/email are actionable without clipping. |
| Newsletter band | Copy uses `white-space: nowrap`; a `100vw` negative-margin breakout hack can introduce overflow. | Remove page breakout hacks; stack copy/form and decide a site-wide newsletter policy. | No horizontal scrollbar at any target; label, field, and submit remain visible at 400% zoom. |
| Conversion banner | Desktop text/action/image rows only partially stack. | Define compact mobile order, alignment, and optional image removal. | CTA stays visible without forcing a two-dimensional scroll; decorative image never obscures copy. |
| Skip/focus behavior | No skip link or mobile focus sequence is designed. | Add consistent landmark and focus order. | First Tab exposes skip link; focus order follows visual order through header, main, and footer. |

## Page-level gaps

### Home

Evidence: [`references/stitch/kalite_filo_ana_sayfa/code.html`](../references/stitch/kalite_filo_ana_sayfa/code.html) uses `h-screen min-h-[700px] overflow-hidden` for the hero while hero copy and the quick finder stack below large breakpoints. Major sections keep fixed desktop padding.

Required decisions and checks:

- Use content-driven hero height on narrow/short screens; do not clip copy, controls, focus rings, or validation messages.
- Decide whether the quick finder remains a functional GET/filter enhancement. If retained, stack labelled fields and submit without relying on the backdrop image for contrast.
- Use one vehicle card per row on narrow mobile; introduce two and three columns only when the measured card width remains readable.
- Convert featured-vehicle “carousel” evidence into a static/scroll-snap list or an accessible enhanced control; all vehicles and links must remain available without JavaScript.
- Stack media-split sections in a documented content order. Images may follow text unless the story requires otherwise.
- Reduce 100px section spacing and 40px gutters at mobile sizes while preserving clear grouping.
- At 320×568 and 1280×800, the primary quote action and quick finder must be reachable without content overlap or hero clipping.

### Vehicle list

Evidence: [`references/stitch/kalite_filo_arac_listesi/code.html`](../references/stitch/kalite_filo_arac_listesi/code.html) changes to a desktop row at `md`, reserves a 288px sidebar, and simultaneously forces results into three columns at `md`. On mobile, the full sidebar merely moves above results, contrary to DESIGN.md’s sheet/overlay direction.

Required decisions and checks:

- Keep the sidebar only where at least three readable cards or an intentionally chosen two-card layout fit beside it; the current 768px transition cannot pass.
- At mobile/tablet portrait, expose a visible “Filtrele” trigger and result count. Choose either an accessible bottom sheet or full-screen dialog; no design for the exact treatment has been supplied.
- The filter surface needs a clear title, close action, Apply/Reset behavior, focus containment/return if modal, and body-scroll handling.
- Tabs/categories must scroll or wrap with a visible cue and selected state; do not hide the only scroll affordance.
- Active chips must wrap and expose specifically named remove controls.
- Cards must not shrink below the width needed for model, specs, price qualifier, and CTA. Long model/trim names must wrap without changing CTA alignment unpredictably.
- Empty results, loading-free client filtering, and reset states require layouts.
- At 768×1024 and 1024×768, verify there is no sidebar/card collision, truncated price, or 128px-wide three-column card.

### Vehicle detail

No local or connected design exists, although this is a Phase 1 requirement.

Required responsive coverage before approval:

- Gallery/media behavior at mobile, tablet, and desktop, including image failure and zoom.
- H1/spec/quote hierarchy without sticky elements covering content.
- Semantic specifications that reflow without two-dimensional page scrolling.
- Primary quote action that remains discoverable without a permanently obstructive mobile sticky bar.
- Related vehicles using the same tested card contract.

This page cannot be declared responsive from the list-card design alone.

### About

Evidence: [`references/stitch/kalite_filo_hakkimizda/code.html`](../references/stitch/kalite_filo_hakkimizda/code.html) has a fixed 500px mobile image mosaic with two columns; the supplied updated capture is almost entirely washed out.

Required decisions and checks:

- Replace the fixed mosaic with a deliberate single/paired mobile media treatment or remove decorative images that do not survive small widths.
- Ensure only one H1; section headings scale consistently.
- Metric cards wrap without making unsupported metrics visually dominant. Unverified metrics must not render at any width.
- Coverage/map content needs an accessible text equivalent and must remain legible when the image fails.
- Benefits should be one column on mobile, two where content permits, and never reduce body text below the typography contract.
- Test the page with all images blocked; the current washed-out evidence must not recur and text contrast must remain intact.

### Fleet guide

Evidence: [`references/stitch/kalite_filo_filo_rehberi/code.html`](../references/stitch/kalite_filo_filo_rehberi/code.html) supplies a horizontal category strip, featured split card, three-column article grid, and numbered pagination.

Required decisions and checks:

- Category navigation may scroll on mobile but must expose a visible continuation/scroll cue and preserve focus visibility.
- Featured content stacks image and copy with a predictable reading order and no fixed copy height.
- Article cards change from one column to two/three only when long Turkish titles and metadata fit.
- Pagination must wrap or compact based on real page count; it cannot overflow 320px and every control needs a label/target.
- Do not show invented pagination depth or categories with no content.
- Verify title, excerpt, date, and category remain readable at 200% text size.

### Blog detail

Evidence: [`references/stitch/kalite_filo_blog_detay/code.html`](../references/stitch/kalite_filo_blog_detay/code.html) hides the entire table-of-contents/share/related sidebar below `lg`. The comparison table is merely placed in an overflow container. A duplicate fixed header exists inside the article grid.

Required decisions and checks:

- Remove the duplicate header in the future implementation; one shell owns navigation.
- Provide mobile placements for table of contents, share actions, and related content rather than dropping them. A collapsible contents section before the article is a possible pattern, not an approved design.
- Constrain prose to a readable measure on desktop while using available width on mobile.
- Give headings fragment scroll margins so the fixed header never covers them.
- The comparison table needs a visible overflow cue or a tested stacked alternative, caption, and scoped headers. Only the table region may scroll horizontally; the page must not.
- Hero image and caption must resize without text becoming too small or the crop hiding essential content.
- Long links, numbers, and source citations must wrap.
- At 320px and 400% zoom, article reading order must remain H1/meta/hero/body/related with no lost sidebar content.

### FAQ

Evidence: [`references/stitch/kalite_filo_sss/code.html`](../references/stitch/kalite_filo_sss/code.html) wraps category chips and uses large accordion rows. Feedback rows put a question and two controls side by side. The custom accordion has no accessible state.

Required decisions and checks:

- Prefer native details/summary so all answers work without JavaScript and reflow naturally.
- Category controls wrap or scroll without clipped labels; all answers remain available when JavaScript is disabled.
- Summary text and chevron cannot overlap at 320px/200% text; target height may grow.
- Answer prose, lists, and feedback controls stack when needed.
- Omit feedback unless an approved endpoint exists; no empty mobile affordance should remain.
- Support CTA stacks copy and action while preserving target size and contrast.

### Contact

Evidence: [`references/stitch/kalite_filo_iletisim/code.html`](../references/stitch/kalite_filo_iletisim/code.html) uses two square columns, keeps 40px gutters, applies 48px form padding, and overlays contact details within the square map. The map is blank in the capture.

Required decisions and checks:

- Remove forced square aspect ratios on mobile; size map/location and form from their content.
- Place verified contact details in normal document flow on narrow screens rather than a potentially cramped absolute overlay.
- Reduce form padding while retaining 44px targets and readable labels.
- Ensure address/email/phone wrap and remain actionable; no placeholder data.
- The form is a single column on mobile and must accommodate validation, legal copy, error summary, and server-returned values without overflow.
- An external map embed must not be required for core contact information. With it blocked, the address and map link remain usable.
- The full orange field is a desktop design inconsistency; contrast and visual hierarchy need approval at every width.

### Quote request

Evidence: [`references/stitch/kalite_filo_teklif_formu/code.html`](../references/stitch/kalite_filo_teklif_formu/code.html) collapses paired fields below `md` and moves the support panel after the form below `lg`, but supplies no error/success or alternate individual flow.

Required decisions and checks:

- Use one column on mobile with labels immediately preceding controls; paired fields may appear only when each retains a comfortable width.
- The Corporate/Individual control must either switch to a real approved schema or be removed. It cannot expose a nonfunctional choice.
- Phone prefix and field must not squeeze or split awkwardly at 320px.
- Long privacy notice and separate optional marketing consent must wrap without shrinking the checkbox target.
- Disabled district selection needs explanatory text and an accessible dependency, or a simpler field contract.
- Place support information before or after the form based on tested reading priority; do not repeat contradictory phone numbers.
- Server validation errors must return users to a visible summary/field, and PHP redirects need static success/failure pages.
- At 320px, 200% text, and keyboard-only use, every required label, hint, error, and submit control remains visible and ordered.

### Legal pages, form results, and 404

No designs are supplied.

- Legal prose needs a narrow readable measure, wrapping table of contents, deep-link offset, and tables/lists that reflow.
- Cookie controls, if required by the actual tracker inventory, must fit at 320px without covering the page or forcing consent.
- Form result pages need concise responsive success/failure actions and must not expose submitted personal data.
- The static 404 needs clear links to Home, Vehicles, and Contact and must work without JavaScript.

### Customer login

The customer-login desktop screen is excluded from Phase 1. Do not spend responsive-design or implementation effort on login, forgot-password, authentication, or portal components. Remove the unsupported internal login entry from the Phase 1 public header; an external portal link is a separate future decision requiring a supplied URL and authorization.

## Component-level responsive gaps

| Pattern | Gap | Acceptance criteria |
| --- | --- | --- |
| Typography | Heading sizes are inconsistent and some retain 44px at mobile. | No clipped/widowed title caused by fixed height; one H1; headings wrap at 320px and 200% text; line length remains readable. |
| Card grids | Generated breakpoints are viewport-based rather than minimum-card-width-based. | Cards never become too narrow for content/CTA; grid falls back to one column before truncation or overlap. |
| Images | Fixed heights/crops and remote failures dominate several designs. | Aspect ratios adapt by variant; intrinsic space prevents layout shift; focal content survives crops; blocked images do not hide text/actions. |
| Horizontal tabs | Scrollbars are hidden and continuation is unclear. | Keyboard focus auto-scrolls into view; a visual cue indicates overflow; page itself never scrolls horizontally. |
| Tables | Overflow exists without discoverability. | Scroll is contained and labelled/cued, focus is visible, header association remains, and a narrow alternative is evaluated. |
| Forms | No error/success layouts and disconnected labels. | Labels, hints, errors, and status all reflow; no field relies on placeholder; native submission works without JS. |
| Chips | Long labels and many active filters can crowd rows. | Chips wrap, removal targets remain named and at least 44px where standalone, clear-all remains distinguishable. |
| Pagination | Fixed sequence may exceed narrow width. | Uses real page count, responsive compaction/wrapping, labelled previous/next, current-page semantics. |
| Sticky/fixed UI | Header and possible filter/CTA stickiness can cover content. | No overlap at short viewport heights, zoom, on-screen keyboard, or fragment navigation. |
| Hover effects | Scale/translate/shadow effects have no touch/focus/reduced-motion states. | Hover is decorative, focus equivalent exists, and reduced motion disables nonessential movement. |
| Long Turkish content | Generated copy is unusually short in cards/nav. | Test longest approved labels/titles/addresses; no ellipsis unless full text remains programmatically and visually available. |

## Static export and minimal-JavaScript acceptance

- Header, footer, breadcrumbs, page content, cards, vehicle/article links, article prose, legal text, and forms render as useful static HTML.
- No page is converted wholesale to a client component for responsive behavior.
- Mobile navigation, filter enhancement, FAQ category filtering, dependent location data, and copy-link behavior are isolated islands only if native HTML cannot meet the requirement.
- FAQ disclosure uses native details where practical; forms post directly to approved PHP or external endpoints; no Server Actions or runtime Next.js API routes.
- A JavaScript failure must leave navigation destinations, all content, vehicle/article links, contact facts, and native form submission available.
- Responsive images, fonts, icons, and CSS are local build assets; blocking third-party hosts must not break layout or expose literal icon names.

## Responsive acceptance checklist

### Reflow and containment

- [ ] No page-level horizontal scrolling at any QA target, 400% zoom, or 200% text scaling. Intentional table/tab regions are the only horizontal scrollers.
- [ ] No text, focus ring, control, validation message, image caption, or CTA is clipped or hidden behind fixed/sticky UI.
- [ ] Content order is logical and unchanged for assistive technology when visual columns stack.
- [ ] Sections do not depend on fixed heights to contain dynamic text or form errors.
- [ ] Full-width backgrounds span wide screens while inner content respects the 1360px maximum.

### Navigation and interaction

- [ ] Every Phase 1 destination is reachable from mobile and desktop navigation; no placeholder or excluded login route appears.
- [ ] Menu, filters, tabs, accordions, pagination, and share actions are keyboard and touch operable with visible focus.
- [ ] Standalone targets are at least 44×44px and do not overlap at narrow widths.
- [ ] Modal/drawer patterns, if selected, label themselves, manage focus, close with Escape, return focus, and prevent accidental background interaction.
- [ ] All essential paths continue to work without JavaScript.

### Content and media

- [ ] Longest approved Turkish navigation labels, vehicle names, article titles, addresses, and legal paragraphs are tested.
- [ ] Images have approved mobile/desktop crops, intrinsic dimensions, and useful alt or empty alt; blocked images leave a coherent page.
- [ ] No unverified price, metric, guarantee, phone, email, address, or pagination depth appears at any breakpoint.
- [ ] Table and legal content remain understandable at 320px and 400% zoom.

### Forms

- [ ] Mobile forms use readable single-column flow where paired fields no longer fit.
- [ ] Labels, optional/required text, hints, consent, errors, summary, and submission status reflow without overlap.
- [ ] On-screen keyboard and short-height viewport do not hide the focused field or submit action irretrievably.
- [ ] Native POST, server-side validation, spam protection, and static success/failure destinations work with JavaScript disabled.

### Visual accessibility and resilience

- [ ] Text and component-boundary contrast meet WCAG AA in every responsive state.
- [ ] Focus visibility survives navy, orange, image, and light backgrounds.
- [ ] Reduced-motion mode removes nonessential scale/translation effects.
- [ ] Layout remains usable with local font fallback, remote requests blocked, slow images, and missing decorative media.
- [ ] Keyboard, screen-reader smoke testing, automated accessibility checks, and manual zoom/reflow review pass before release.

Until these checks pass, the presence of responsive utility classes must not be reported as responsive design completion.

