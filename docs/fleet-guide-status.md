# Filo Rehberi implementation status

Date: 2026-08-17

## Article detail template reconciliation — 2026-08-21

### Header and sidebar refinement — 2026-08-21

Article metadata now sits directly below the article introduction as one
compact, wrapping row containing only category, publication date, and reading
time. The duplicated section top spacing between that header and the cover was
removed, while the normal PageHeader rhythm remains intact.

The former sidebar `Makale bilgileri` panel was removed. The desktop sidebar
now follows one consistent order: sticky `İçindekiler`, compact `Makaleyi paylaş`, then
one real related-article card backed by a local approved cover and a canonical
category-aware detail URL. It has no nested scroll container or visible
sidebar scrollbar; the document itself reveals lower items as the visitor
scrolls. On smaller screens the same content stays in normal document flow.
Share controls are the sole new, isolated Client Component in
this refinement; they use the native share API when available, retain email
and copy-link alternatives, and do not move the article page itself out of the
static Server Component architecture.

The category is no longer repeated above the article H1; it remains available
in the compact metadata row below the introduction. Supplied `Önemli Çıkarım`
blocks now use a restrained editorial note treatment with simple rules and no
rounded tinted alert surface, icon, or invented copy.

All 18 category-aware article pages now use the production article-detail
composition. The shared PageHeader is followed by a local 16:9 cover when the
supplied record has one, a bordered article surface, and a right-hand
`İçindekiler`/sharing/related-article column. The sidebar is sticky without an
independent scrolling region on desktop; on narrow screens it remains in normal document
flow before the article body. No image was invented for the 12 records that do
not have an approved local cover.

The dependency-free Markdown renderer assigns stable, Turkish-aware ids to
visible second-level headings. Every contents link maps one-to-one to those
ids. Native fragment navigation uses the global smooth-scroll behavior and the
existing reduced-motion rule disables smooth movement when requested. Fixed
header clearance is preserved with heading scroll margins.

Source-only Markdown scaffolding is not public content. `Kart Özeti`, the
source `İçindekiler`, and `İç Link Önerileri` sections are suppressed by the
renderer; the sole supplied internal-link-suggestion block and its retired
`/araclar/` path were also removed from the source Markdown.

The existing shared `EditorialPreview` remains a single reusable composition
across Home, About, vehicle detail, and FAQ, but each of its cards is now one
full-card link to the matching `/filo-rehberi/[category]/[slug]/` output. Hover
and keyboard focus use the production accent-orange border plus a restrained
shadow. No new Client Component or dependency was introduced for either
behavior.

## Category and article route reconciliation — 2026-08-17

The owner-approved Filo Rehberi corpus now has a complete, category-aware
static route structure:

- index: `/filo-rehberi/`;
- six category pages: `/filo-rehberi/[category]/`; and
- 18 article pages: `/filo-rehberi/[category]/[slug]/`.

Both dynamic families use exhaustive `generateStaticParams()` output and
`dynamicParams = false`. Every concrete page has its own canonical URL while
remaining `canonical-path`, `noindex, nofollow`, and outside the empty sitemap.
No `/blog/` alias or uncategorized article URL was added.

Category controls are now real links rather than in-place filter buttons. The
selected category uses `aria-current="page"`, and each category URL renders its
three supplied records. Every featured and regular article card is one complete
semantic link to its category-aware detail page. Hover and keyboard focus use
the existing corporate-blue border, heading emphasis, and restrained card
shadow treatment.

The index still paginates its non-featured records 6/6/5 in one existing client
island. After a real previous, next, or numbered-page transition, the category
strip receives programmatic focus without an extra viewport jump and the
document scroll position is reset to the top. The initial page load is not
overridden.

Article bodies are rendered at build time from the 18 local Markdown sources
with a dependency-free, React-element renderer; no browser Markdown parser,
request-time API, or new dependency was introduced. The historical sections
below describe the earlier index-only checkpoint and are superseded where they
say article links or article pages were absent.

## Outcome

The canonical `/filo-rehberi/` route now implements the Phase 1 Filo Rehberi index with the current production design system. It uses the shared Header, Footer, PageHeader, Breadcrumbs, PageContainer, Section, token, radius, focus, and typography contracts.

The route remains `canonical-path`, `indexable: false`, and `sitemap: false`.

## Design evidence and production adaptation

The desktop screenshot and generated HTML under `references/stitch/kalite_filo_filo_rehberi/` were used only for hierarchy and composition evidence. The implementation retains the useful reference structure:

- breadcrumb, large Filo Rehberi page title, and concise introduction;
- a horizontal category treatment;
- one wide featured article;
- a responsive editorial-card grid; and
- the shared site shell.

The retired public label `Blog`, generated navigation/footer code, customer-login control, remote images, external fonts, fake dates, unsupported categories, and placeholder links were not copied. Public UI consistently uses **Filo Rehberi**.

## Content and assets

The index renders the 18 owner-supplied, locally stored article records from `src/data/articles.ts`. All 18 Markdown source files are preserved under `src/content/filo-rehberi/`. Six records use their matched 1600 × 900 local WebP covers from `public/images/filo-rehberi/`; the other 12 records use an explicit, non-photographic fallback because the supplied 18-article package did not include additional image files.

Only the six approved repository categories are exposed:

- Uzun Dönem Kiralama;
- Maliyet ve Finans;
- Araç Rehberi;
- Filo Yönetimi;
- Elektrikli Araçlar; and
- Bakım ve Hasar.

The reference-only Ticari Araçlar and Mevzuat categories were not invented. The owner-supplied corpus contains exactly three records in each approved category and exactly one featured record.

## Interaction and responsive behavior

`FleetGuideListing` remains one isolated Client Component. It owns only the current pagination page. `Tüm İçerikler` is selected on the index; categories are separate static pages and expose their state with `aria-current="page"`. The visible result count is announced through a polite live region.

The featured record is rendered separately. Beneath it, at most six additional cards are shown per page. The unfiltered corpus therefore produces three pages containing 6, 6, and 5 non-featured cards. Previous, numbered-page, and next controls are native buttons with disabled boundary states and truthful `aria-current="page"` on the current page.

The page is mobile-first:

- category and pagination controls wrap instead of creating page-level horizontal overflow;
- the featured composition stacks before becoming a two-column split at `lg`;
- article cards use one column by default, two from `sm`, and three from `xl`;
- Turkish titles and excerpts may wrap naturally; and
- images retain explicit intrinsic dimensions and intentional 16:9 crops.

No dependency, animation library, carousel, remote runtime asset, or request-time API was added.

## Accessibility

- The page has one H1 and one main landmark.
- Breadcrumbs use real routes and expose the current item through the shared component.
- Category controls are real links with canonical category URLs and `aria-current="page"`.
- The selected state uses both corporate-blue text and a bottom indicator rather than color alone.
- Focus-visible behavior and 44px minimum target height come from the production system.
- Every cover image uses the owner-supplied local alt intent and intrinsic dimensions.
- The page retains the shared skip link and truthful current-navigation state.

## Static-export and publication boundary

- The page remains a static App Router output under `output: "export"` and `trailingSlash: true`.
- Production canonical: `https://kalitefilo.com.tr/filo-rehberi/`.
- Production and staging page metadata remain `noindex, nofollow`; staging also remains `nocache`.
- The sitemap remains empty because no route is published.
- No Server Action, runtime API route, Middleware, Proxy, SSR, ISR, database, authentication, customer portal, CRM, admin panel, or runtime CMS was introduced.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed in strict mode |
| `npm test` | Passed: 47 tests, 0 failures |
| `npm run validate` | Passed: 13 route decisions, 8 approved Client Components |
| `npm run build:staging` | Passed: 71 statically generated pages |
| staging `npm run verify:output` | Passed |
| `npm run build` | Passed: 71 statically generated pages |
| production `npm run verify:output` | Passed |
| `node scripts/smoke-fleet-guide.mjs` | The preceding checkpoint passed at all six target widths; the current rerun was blocked before navigation by the local Edge CDP `Page.enable` timeout. Static-output validation covers the new metadata/share/related-card contract. |

The production output contains one featured treatment plus six regular cards on its initial view, seven category controls, three pagination pages for the unfiltered corpus, six local WebP covers, one initial honest cover fallback, no `Blog` label, the correct canonical URL, and page-level `noindex, nofollow`. Microsoft Edge verified the 6/6/5 non-featured-card pagination distribution, every three-record category transition, exactly one selected category and page, truthful Header current-page state, local-only runtime resources, and no horizontal overflow at all six target widths.

Current production artifact snapshot: 681 files / 28,483,100 raw bytes; JavaScript 700,705 bytes across 17 files; CSS 78,487 bytes in one file. Against the preceding article-detail snapshot this refinement adds 1,071,393 total bytes, 2,509 JavaScript bytes, and 1,414 CSS bytes. The authored Client Component count is now eight; the only new boundary is the small article-share control, while the article page, related-card selection, metadata, contents list, and body remain build-time Server Component output.

## Remaining blockers

- verified author/reviewer attribution and source/citation review;
- final editorial and SEO review of supplied article metadata;
- publication approval and sitemap/indexability decision;
- further editorial QA for exceptionally long tables and contents lists; and
- broader manual keyboard, screen-reader, zoom, multi-browser, and visual-regression testing beyond the automated Edge checks.

Until those gates are resolved, the index remains unpublished, noindex, and outside the sitemap.
