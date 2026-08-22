# Araçlar implementation status

Date: 2026-08-15

Price reconciliation: 2026-08-14

Vehicle-card presentation reconciliation: 2026-08-14

## Outcome

The canonical `/arac-listesi/` route implements the Phase 1 vehicle catalogue, and all 32 owner-supplied records now have statically generated detail pages in `/arac-listesi/[slug]/`. Catalogue and Home vehicle cards link to their matching detail URL. The index keeps the shared public shell, responsive filters, category navigation, active-filter chips, result count, quote banner, and no-storage newsletter preview.

This is still a review build. Both the index and detail family remain `canonical-path`, `indexable: false`, and `sitemap: false`. On 14 August 2026, the project owner explicitly approved all 32 `Portföy_32` `Önerilen Liste Net` values for display. They are rendered as monthly TRY net list prices with a `KDV hariç` qualification. The pages do not claim stock or availability, approved duration/kilometre terms, price validity, service scope, binding offer terms, or VAT-inclusive totals.

## Design evidence and deliberate departures

The primary visual evidence is `references/stitch/kalite_filo_arac_listesi/araç_listesi.png` (3840 × 4888, 5,078,669 bytes). Its sibling `code.html` was used only as secondary structural evidence. Neither the generated implementation, remote assets, demo vehicle content, prices, customer-login control, placeholder links, nor external font/CDN dependencies were copied into production.

The implementation preserves the reference hierarchy and restrained visual direction:

- breadcrumb and large page title;
- left filter panel with the catalogue to its right on desktop;
- horizontal vehicle-category treatment;
- active-filter summary and card grid;
- dark shared conversion banner; and
- newsletter strip before the shared footer.

Content that the owner-supplied records do not support was intentionally omitted or adapted:

- the demo `Premium` and `Executive` badges and the later category overlays are omitted from cards; the verified category taxonomy remains available through the catalogue filters;
- `Yönetici` and `İkinci El` category tabs were not invented;
- rental-duration and unverified body-type controls were not invented; the available record taxonomy supports Segment instead;
- the Stitch demo amounts were not used; each row instead uses its owner-approved workbook `Önerilen Liste Net` value in the `Aylık Liste Net` / `₺…/ay` / `KDV hariç` presentation; and
- vehicle cards are single, full-card links to the matching `/arac-listesi/[slug]/` page; the visible action is `Aracı İncele`.

## Local portfolio and imagery

The catalogue renders all 32 owner-supplied records held in `src/data/vehicle-portfolio.json` and exposed through the typed `vehiclePortfolio` collection. The current data shape contains 14 makes and 31 make/model combinations across:

| Category | Records |
| --- | ---: |
| Binek | 11 |
| SUV | 13 |
| Ticari | 8 |

No record has been converted into a complete or binding commercial offer. The approved display amount is limited to the workbook's monthly KDV-excluded net list price; `Nihai Yayın Net`, a VAT-inclusive total, approved duration/kilometre assumptions, validity, availability, service scope, and other offer conditions remain unresolved. Every row still requires editorial review before publication.

Twenty-eight representative model-family photographs have been promoted to local JPEG derivatives under `public/images/vehicles/`. Together they occupy 4,486,546 bytes. Each has intrinsic dimensions, Turkish alt intent, creator/source/licence metadata in the typed record, and a matching internal ledger entry in `public/images/vehicles/LICENSES.md`. No source/licence ledger link is rendered in the website UI.

The photographs represent model families; they do not claim the exact trim, colour, body length, engine, or country specification unless explicitly documented. Four records deliberately use the neutral “Doğrulanmış araç görseli mevcut değil” state because the available candidates materially mismatched the record:

- `KF-015` Renault Duster;
- `KF-026` Fiat Doblo Combi;
- `KF-030` Ford Transit Van; and
- `KF-031` Citroën Berlingo Van.

No vehicle image is remote, base64-embedded, or served through a runtime image optimizer.

## Filtering and query behavior

`VehicleQueryState` is the existing, isolated Client Component for catalogue query state. It reads `useSearchParams()` inside the page's `Suspense` boundary, normalizes supported values against the static records, and updates the query string with `window.history.replaceState`. The page itself, layout, card composition, shared shell, conversion banner, and newsletter wrapper remain Server Components.

Supported filters are:

| UI control | Query key | Source |
| --- | --- | --- |
| Category | `kategori` | `Binek`, `SUV`, `Ticari` |
| Make | `marka` | owner-supplied records |
| Model | `model` | models beneath the selected make |
| Segment | `segment` | exact owner-supplied segment labels |
| Fuel | `yakit` | normalized Benzin, Dizel, Hybrid, Elektrik groups |
| Transmission | `vites` | normalized Otomatik or Manuel groups |

Model remains disabled until Make is selected. Unknown values are discarded, a model is accepted only beneath its selected make, and Turkish label matching is canonicalized without creating filter-result routes. Active filters can be removed individually or reset together. Result changes are announced through an `aria-live` count, and an explicit empty state is provided.

The full 32-card `VehicleCatalogueStaticFallback` is emitted as useful static HTML while the query-aware island resolves. In a no-JavaScript context it retains native `GET /arac-listesi/` filter controls, category links, all records, and detail links.

## Responsive decisions

The implementation derives conservative behavior from the approved desktop system because no dedicated mobile vehicle-list screen exists:

- below `lg`, filters use a native `<details>` disclosure and the desktop sidebar is absent;
- from `lg`, the fixed-width filter column sits beside a fluid catalogue column;
- cards render in one column by default, two from `md`, and three from `xl`;
- every catalogue card is one semantic detail link, so its complete surface is clickable without a nested CTA link; card hover and keyboard focus also activate the visible `Aracı İncele` treatment;
- every card shows only fuel and transmission in a compact two-column row; the transmission fact uses the project-owned cog icon;
- category controls and active-filter chips wrap instead of forcing horizontal overflow; and
- filter controls and actions retain minimum touch-friendly heights.

The staging and production exports are checked in Microsoft Edge at 320, 390, 768, 1024, 1440, and 1920 CSS pixels. The acceptance contract requires one H1, the expected mobile or desktop filter treatment, all 32 records, 28 unique local images, four missing-image states, fuel and transmission aligned from the same row start, no per-card category/credit overlay, no page-level image-credit disclosure, no public licence-ledger link, and no page-level horizontal overflow.

## Accessibility decisions

- The page has one H1 and retains real breadcrumb links.
- The catalogue uses labelled native selects and a native mobile disclosure.
- Category controls expose the selected state; the static fallback uses `aria-current` and the interactive version uses `aria-pressed`.
- Result changes use a polite live region, and the zero-result treatment uses a status region.
- Cards use semantic articles, definition-list labels for fuel/transmission/segment and body, intrinsic image dimensions, and descriptive missing-image alternatives.
- Image provenance remains available to maintainers in the internal ledger; cards and public page chrome do not render source/licence links. Card actions are real detail links.
- Existing shared focus-visible styling, skip link, landmarks, and navigation behavior are reused.

## Static-export and publication boundary

- No dependency was added for this page.
- No Server Action, runtime API route, Middleware, Proxy, SSR, ISR, database, ORM, authentication, customer-login route, portal, CRM, admin panel, or runtime CMS was introduced.
- The only browser state required by the catalogue stays inside the existing vehicle query island.
- The current authored Client Component source count remains four; this page does not add a new client boundary.
- `/arac-listesi/` must remain page-level `noindex, nofollow` in both production and staging until explicitly published.
- Its canonical URL must remain `https://kalitefilo.com.tr/arac-listesi/` in the production artifact.
- The sitemap must remain empty while every approved route is unpublished.

## Verification and artifact comparison

Final integrated checks were run against both target-specific static exports.

| Check | Current task result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors |
| `npm run typecheck` | Passed in strict mode with no emit |
| `npm test` | Passed: 40 tests, 0 failures, including exact Home/catalogue price mapping, card-presentation, centralized-credit, and formatter cases |
| `npm run validate` | Passed: 12 route decisions, 4 authored Client Components |
| `npm run build:staging` | Passed: all 15 outputs were generated statically |
| staging `npm run verify:output` | Passed; 32 exact list prices, catalogue contract, staging canonical/noindex, and empty sitemap verified |
| `npm run build` | Passed: all 15 outputs were generated statically |
| production `npm run verify:output` | Passed; 32 exact list prices, catalogue contract, production canonical/noindex, and empty sitemap verified |
| Home and vehicle catalogue browser smoke | Passed on staging and production at 320, 390, 768, 1024, 1440, and 1920 px; exact featured, Clio, and Transit Van prices verified |

The comparison baseline is the immediately preceding production Home artifact recorded in `docs/home-status.md`; the final column is the measured production export after the vehicle catalogue build.

| Metric | Before | Final | Delta |
| --- | ---: | ---: | ---: |
| Files | 130 | 155 | +25 |
| Total raw bytes | 4,325,806 | 9,475,496 | +5,149,690 |
| JavaScript | 646,981 / 14 files | 669,452 / 14 files | +22,471 / 0 files |
| CSS | 64,237 / 1 file | 66,751 / 1 file | +2,514 / 0 files |
| Images | 2,614,487 / 22 files | 6,579,825 / 47 files | +3,965,338 / +25 files |
| Authored Client Components | 4 | 4 | 0 |

The 28 local vehicle JPEGs currently total 4,486,546 bytes; 25 of them are additions relative to that baseline because the three Home-card files already existed. The image byte delta is exactly those 25 new derivatives. The JavaScript increase comes from expanding the existing vehicle query Client Component and its static card presentation; the owner-approved price and card-presentation reconciliations added no Client Component and the authored count did not change.

At that historical checkpoint, centralizing the image credits and simplifying the cards changed no file or image count, reduced JavaScript by 672 bytes, added 84 CSS bytes, and changed total raw output by +8,007 bytes. The later 2026-08-14 reconciliation removed the remaining public ledger link while retaining the source file for maintainers.

## Remaining blockers

- Business and editorial approval of all 32 owner-supplied vehicle records, including model-year, trim, technical labels, taxonomy, summaries, and features not currently shown on cards.
- Approved binding-offer, availability, duration/kilometre, contract, service-inclusion, validity, and disclaimer policy. The 32 monthly KDV-excluded net list amounts themselves are no longer a blocker.
- Correct approved representative images for the four deliberately image-less records, plus any required per-vehicle galleries and final crop/alt review.
- Detail-page gallery assets and a verified multi-image interaction; the current page deliberately uses one approved image or the honest missing-image state.
- Approved quote and basket workflows. The two requested detail actions are intentionally inert and expose explanatory status text.
- Final page title/intro/metadata review and a publication decision; no description or structured data was invented.
- Manual keyboard, 200% text/zoom, screen-reader, and broader representative-browser QA beyond the automated Edge checks.
- Apache/cPanel staging deployment verification for the final deployable site.

Until these gates are explicitly resolved, `/arac-listesi/` remains unpublished, noindex, and outside the sitemap.

## 2026-08-14 transmission-label reconciliation

The card and filter presentation now maps the 32 source transmission strings into exactly three customer-facing groups without altering the supplied portfolio source values:

- `Otomatik`: 10 records;
- `Yarı Otomatik`: 17 records; and
- `Manuel`: 5 records.

Technical strings such as `7DCT Otomatik`, `DCT Otomatik`, and `X-Tronic Otomatik` are no longer shown on Home or catalogue cards. The shared card contract and static-output validator require one of the three labels above, and the Edge catalogue smoke checks all 32 cards at every supported viewport.

The final production export contains 155 files and 9,343,077 raw bytes: 669,696 JavaScript bytes across 14 files and 67,009 CSS bytes in one file. The authored Client Component count remains four; this reconciliation added no dependency or client boundary.

## 2026-08-15 vehicle-detail reconciliation

- `src/app/arac-listesi/[slug]/page.tsx` statically generates all 32 owner-supplied slugs with `generateStaticParams()` and `dynamicParams = false`.
- Every detail receives a unique build-time title, supplied summary description, concrete canonical URL, one H1, and registry-driven `noindex, nofollow`; staging also receives `nocache`.
- The page reuses the production PageHeader, PageContainer, Section, Button, price, facts, shell, surface, radius, focus, and responsive contracts. Stitch was used only for hierarchy evidence.
- Only one rights-reviewed local image is shown per record; the four unresolved images keep their honest fallback. No fake thumbnails or remote gallery assets were introduced.
- Technical content is limited to typed owner-supplied fields already present in the local portfolio: model year, category, segment/body, fuel, transmission, power where present, seats where present, summary, and feature labels.
- The reference's deposit/duration/kilometre calculator was not copied because no approved formula or offer contract exists. The displayed amount remains `Aylık Liste Net`, `/ay`, `KDV hariç`, with a non-binding qualifier.
- `Hemen Teklif İste` and `Araç Sepetine Ekle` are inert semantic buttons with shared explanatory text; they are neither links nor forms.
- Every detail renders exactly four other records from the same `Binek`, `SUV`, or `Ticari` category and links each card to its real detail path.
- Automated Edge smoke passed for Binek, SUV, and Ticari examples. Renault Clio passed at 320, 1440, and 1920 px; the other categories passed at 1440 px. All cases had no horizontal overflow, four unique related vehicles, two inert actions, local-only resources, correct staging canonical metadata, and noindex.
- Final staging and production checks passed with 43 dependency-free tests, 12 validated route decisions, and four authored Client Components. Both exports generated 47 static pages, including all 32 vehicle details. Production browser smoke repeated the catalogue checks at 320, 390, 768, 1024, 1440, and 1920 px and the representative detail checks above with production canonicals and `noindex, nofollow`.
- The final production artifact contains 444 files and 18,137,021 raw bytes: 670,293 JavaScript bytes across 14 files, 74,045 CSS bytes in one file, and 8,103,622 image bytes across 48 files. Compared with the immediately preceding About production checkpoint (156 files / 11,121,283 bytes; 669,503 JS bytes; 70,583 CSS bytes), the integrated delta is +288 files, +7,015,738 total bytes, +790 JavaScript bytes, and +3,462 CSS bytes. This task adds no image asset, dependency, or Client Component; the authored Client Component count remains four.
- A representative production detail emits canonical `https://kalitefilo.com.tr/arac-listesi/renault-clio-evolution-1-0-tce-x-tronic-90/` and robots `noindex, nofollow`. Production `robots.txt` allows crawling, while the sitemap remains a valid empty URL set because no route was published.

## 2026-08-15 vehicle-detail content and related-navigation refinement

- The breadcrumb current item now contains the complete make, model, and trim; the PageHeader keeps the concise make/model H1 and no longer repeats the trim as intro copy.
- The standalone category tag was removed from the offer panel. The related-vehicle heading no longer repeats the category or the former explanatory sentence.
- The separate `Araç Hakkında` panel was removed. Its owner-supplied summary and feature list now precede the typed definition list inside the single `Teknik Özellikler` panel.
- Detail pages now render every other vehicle in the same category: 10 alternatives for a Binek record, 12 for an SUV record, and 7 for a Ticari record. The responsive track shows four cards at desktop width and fewer, readable cards at narrow widths.
- Two labelled, keyboard-operable 44px controls move the horizontal related-vehicle track and wrap at its ends. Touch and native horizontal scrolling remain available without JavaScript; only the two arrow controls require the new isolated `RelatedVehicleCarouselControls` Client Component.
- The validator now checks the exact same-category record set, unique real detail links, one related track, both controls, the consolidated technical section, two inert quote/basket actions, and the absence of the retired copy.
- Staging Edge smoke passed at 320, 1440, and 1920 px for Renault Clio and at 1440 px for SUV and Ticari representatives. It verified complete breadcrumbs, no duplicate intro, consolidated technical content, removed category/copy treatments, no page-level horizontal scrolling, functional next controls, local-only resources, noindex metadata, and target-specific canonicals.
- This refinement introduces no dependency, image, runtime API, Server Action, Middleware, Proxy, SSR, ISR, database, authentication, or customer-login feature. The authored Client Component count is now five; all page/data/card rendering remains server-side and static-export compatible.
- Final production verification also passed. Edge repeated the catalogue checks at 320, 390, 768, 1024, 1440, and 1920 px and the representative detail checks at 320, 1440, and 1920 px. The Binek, SUV, and Ticari detail examples exposed respectively 10, 12, and 7 unique same-category alternatives; the next control moved the nested track, while every tested page remained free of page-level horizontal scrolling and remote runtime resources.
- The final production artifact contains 445 files and 22,573,744 raw bytes: 673,473 JavaScript bytes across 15 files, 74,549 CSS bytes in one file, and 8,103,622 image bytes across 48 files. Compared with the immediately preceding vehicle-detail checkpoint (444 files / 18,137,021 bytes; 670,293 JS bytes; 74,045 CSS bytes), the refinement adds 1 file, 4,436,723 total bytes, 3,180 JavaScript bytes, and 504 CSS bytes; image count and image bytes are unchanged. Most of the total-byte increase is statically exported HTML from rendering every same-category alternative on every vehicle detail page, not browser JavaScript.

## 2026-08-17 vehicle-detail technical-content refinement

- The visible owner-supplied summary paragraph and the full checkmark feature list were removed from the technical panel. The metadata description still uses the supplied summary, but it is no longer repeated as visible page copy.
- `Teknik Özellikler` now contains one definition-list system only. Existing model year, category, segment/body, fuel, transmission, power, and seating rows remain. Measurable, non-duplicating source values are normalized into the same rows when present: luggage/load volume, torque, WLTP range, battery capacity, energy/fuel consumption, and drivetrain.
- Non-technical feature labels such as compact dimensions, corporate-use positioning, service-network claims, design descriptions, and use-case recommendations are not rendered on vehicle detail pages. Duplicate power, fuel, transmission, seating, and body-style feature labels are also omitted.
- The existing Home `EditorialPreview` is reused after related vehicles and immediately before the shared Footer. It renders the same `Filo Dünyası'nı Keşfedin` heading, approved local article records, and canonical Filo Rehberi action without adding another component or Client boundary.
- Lint, strict typecheck, 43 dependency-free tests, source validation, staging and production builds, and output validation passed. Both target-specific exports generated 47 static pages. Staging and production Edge smoke passed for the catalogue viewports and representative Binek/SUV/Ticari details; it verified no repeated summary, no checkmark list, at least five structured technical rows, exactly one editorial preview, no page-level overflow, no remote resources, and target-correct noindex canonicals.
- The production artifact contains 445 files and 23,398,004 raw bytes: 678,638 JavaScript bytes across 15 files, 74,549 CSS bytes in one file, and 8,103,622 image bytes across 48 files. Relative to the preceding detail checkpoint this is +824,260 total bytes and +5,165 JavaScript bytes; CSS and image bytes are unchanged. The increase primarily reflects the existing editorial composition being statically included across all 32 detail outputs. Authored Client Component count remains five.
