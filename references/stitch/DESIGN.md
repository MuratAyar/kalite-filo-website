---
name: Premium Fleet Nexus
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#555e76'
  primary: '#020a1e'
  on-primary: '#ffffff'
  primary-container: '#182136'
  on-primary-container: '#8088a2'
  inverse-primary: '#bdc6e2'
  secondary: '#2a5cb1'
  on-secondary: '#ffffff'
  secondary-container: '#79a4ff'
  on-secondary-container: '#003881'
  tertiary: '#130900'
  on-tertiary: '#ffffff'
  tertiary-container: '#321d00'
  on-tertiary-container: '#bd7b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#bdc6e2'
  on-primary-fixed: '#121b30'
  on-primary-fixed-variant: '#3e465d'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#aec6ff'
  on-secondary-fixed: '#001a43'
  on-secondary-fixed-variant: '#004397'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  navy-deep: '#182136'
  navy-secondary: '#172750'
  corporate-blue: '#014499'
  accent-orange: '#FFB343'
  orange-dark: '#D47504'
  orange-light: '#FCD8B6'
  text-primary: '#182136'
  text-secondary: '#5E6675'
  border-subtle: '#E6E8EC'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  max-content-width: 1360px
  gutter: 24px
  margin-desktop: 40px
  section-v-space: 100px
  card-padding: 24px
  stack-gap: 16px
---

## Brand & Style

This design system establishes a **Corporate Modern** identity tailored for the B2B logistics and automotive sector. The visual narrative centers on reliability, precision, and operational excellence. It avoids the fleeting trends of consumer startups in favor of a "high-end institutional" aesthetic that resonates with fleet managers and corporate procurement officers.

The brand personality is **authoritative yet tech-forward**, utilizing a structured layout that communicates stability while hinting at digital efficiency. Key characteristics include:
- **Precision-driven:** Every element is aligned to a strict grid, reflecting the logistical accuracy of fleet management.
- **B2B Focus:** Information density is optimized for utility, allowing users to compare complex data (fleet specs, pricing, contract terms) without cognitive overload.
- **Premium Sophistication:** Subtle use of borders and a deep navy palette creates a "First Class" professional environment.

## Colors

The palette is anchored by **Primary Dark Navy**, providing a foundation of trust and corporate strength. **Corporate Blue** is used for secondary structural elements and links, while **Accent Orange** is reserved strictly for high-priority actions (CTAs), active states, and critical price highlights.

- **Primary & Secondary Navies:** Used for headers, footers, and primary text to ensure maximum legibility and brand presence.
- **Accent Orange:** Provides high contrast against the navy foundation, ensuring clear paths to conversion.
- **Backgrounds & Borders:** A "Light Gray BG" is used to define section breaks, while "Border Subtle" replaces heavy shadows to maintain a flat, modern architectural feel.

## Typography

The typography system uses **Plus Jakarta Sans** for its contemporary, clean proportions and excellent legibility in technical contexts. The scale is designed to handle high information density while maintaining a clear hierarchy.

- **Headlines:** Use SemiBold and Bold weights with slight negative letter-spacing for a tight, professional appearance in hero sections and vehicle names.
- **Body:** Set primarily in 16px (Medium) for maximum readability in data-heavy fleet tables and descriptions.
- **Labels:** Small, bold, and uppercase labels are used for vehicle categories and technical specifications to distinguish them from prose.

## Layout & Spacing

The layout utilizes a **12-column fixed grid** with a maximum width of 1360px to ensure content remains readable on large desktop monitors.

- **Grid Philosophy:** High-density filtering logic on the left (2 or 3 columns) balanced by a results grid on the right.
- **Section Spacing:** Generous vertical padding (80px-120px) between major sections prevents the "cluttered" look often found in legacy rental sites.
- **Responsive Behavior:** 
    - **Desktop:** 12 columns, 24px gutters.
    - **Tablet:** 8 columns, 16px gutters, margins reduced to 24px.
    - **Mobile:** 4 columns, 16px gutters, margins 16px. Filtering shifts to a sticky bottom sheet or full-screen overlay.

## Elevation & Depth

To maintain a "Premium Corporate" feel, this design system avoids heavy drop shadows and instead relies on **Tonal Layers** and **Low-contrast outlines**.

- **Surfaces:** Cards and containers use a crisp White background (#FFFFFF) against a Light Gray (#F7F8FA) page background.
- **Borders:** Depth is primarily communicated through a 1px solid border (#E6E8EC). 
- **Active States:** Only when an element is hovered or selected is a very subtle, diffused ambient shadow (8% opacity Navy) applied to signify interactivity without breaking the flat, professional aesthetic.
- **Backdrop:** Sticky navigation bars use a backdrop blur (12px) with 90% opacity white to maintain context while keeping text sharp.

## Shapes

The shape language is **Rounded**, striking a balance between modern friendliness and corporate structure.

- **Standard Radius (8px):** Used for input fields, small buttons, and UI controls.
- **Large Radius (16px):** Reserved for vehicle cards and primary container blocks to soften the large 1360px layout.
- **Sharp Corners:** Never used, as they feel too aggressive for a solution-oriented service brand.

## Components

### Buttons
- **Primary:** Orange BG, Navy text (Bold). Height: 54px. Used for "Teklif Al" or "Hemen Kirala".
- **Secondary:** Navy BG, White text. Height: 48px. Used for "Araç Detayı".
- **Outline:** Transparent BG, 2px Navy or Orange border. Used for tertiary actions like "Filtreleri Temizle".

### Cards (Vehicle Cards)
- **Style:** White BG, 1px #E6E8EC border, 16px corner radius.
- **Content:** Large image top, specification icons (Transmission, Fuel, Class) in a horizontal row using thin-line icons, and price highlighted in Orange.

### Input Fields & Selects
- **Style:** 48px height, 8px radius, #E6E8EC border. 
- **States:** Focus state uses a 2px Corporate Blue border. 
- **Labels:** Turkish labels (e.g., "Marka Seçiniz", "Kiralama Süresi") placed above the field in Secondary Text (#5E6675).

### Filtering & Lists
- Sidebar filters use a clean accordion style. 
- Active filter chips use the Light Orange (#FCD8B6) background with Dark Orange (#D47504) text for high visibility without the "weight" of a primary button.

### Icons
- **Style:** 24px viewbox, 1.5pt stroke weight.
- **Library:** Lucide-style thin-line icons. Consistent stroke terminals (rounded) to match the shape language.