# Design System (`DESIGN_SYSTEM.md`) — `insta-store`

> **Golden Rule:** Fix visual inconsistencies here first—never patch single pages ad-hoc. All Storefront pages inherit tokens injected inline by `StoreLayout.astro`.

---

## 1. Visual Direction (Inspired by Shopify Impulse)

- **Editorial Fashion Storefront:** High-contrast typography, generous breathing room, crisp `3:4` product framing, dual editorial promo grids, lookbook slideshows, and zero visual clutter.
- **99% Mobile-First (`375px`):** Horizontal swipe carousels on narrow screens where appropriate (`snap-x`), sticky bottom bars, and spacious tap targets.
- **Bilingual (`ar` RTL / `en` LTR):** Logical CSS properties (`ms-*`, `me-*`, `start-*`, `end-*`) and system UI Arabic/Latin stacks (zero external Google Font requests on load).

---

## 2. Curated Palette Presets (`theme_tokens`)

| Preset ID             | Name                               | `--bg-primary` | `--bg-surface` | `--text-primary` | `--accent-primary` |
| :-------------------- | :--------------------------------- | :------------- | :------------- | :--------------- | :----------------- |
| `flagship_editorial`  | **Flagship Editorial** _(Default)_ | `#FAF9F6`      | `#FFFFFF`      | `#111111`        | `#111111`          |
| `warm_dune`           | **Warm Dune**                      | `#F6F1EB`      | `#FFFDF9`      | `#241E1A`        | `#8C5A3C`          |
| `minimal_clean`       | **Minimal Clean**                  | `#FFFFFF`      | `#F5F5F7`      | `#0F172A`        | `#0F172A`          |
| `midnight_streetwear` | **Midnight Streetwear**            | `#0B0D10`      | `#151921`      | `#F5F7FA`        | `#E5E7EB`          |

---

## 3. Radius Presets

- `sharp`: `--radius-card: 0px`, `--radius-btn: 2px`, `--radius-pill: 999px`
- `soft`: `--radius-card: 10px`, `--radius-btn: 8px`, `--radius-pill: 999px`
- `pill`: `--radius-card: 16px`, `--radius-btn: 999px`, `--radius-pill: 999px`

---

## 4. Complete Homepage Section Blueprint (Inspired by Impulse)

Every optional section hides completely if its content array/fields are empty in `store_config`:

1. **Announcement Bar (`شريط الإعلان`)** — Slim top promo strip (`--btn-bg` / `--btn-text`).
2. **Sticky Compact Header** — Mobile menu drawer | Brand logo/name | Language toggle + Cart drawer badge.
3. **Shoppable Hero Video / Lookbook Banner** — Full-bleed campaign video (with instant `Poster` LCP) + clickable **Shoppable Product Pills/Hotspots** linking directly to `/p/[slug]`.
4. **Featured Collections Strip (`الأقسام`)** — 2-col mobile / 4-col desktop `4:5` portrait category tiles.
5. **Product Row #1 (`الأساسيات اليومية`)** — 2-col mobile / 4-col desktop featured product grid with color swatches & Sale/Sold Out badges.
6. **Split Promo Grid (`promo_grid`)** — 2 large editorial split cards (`1:1` / `4:5` visual + headline + short line + CTA) spotlighting key edits/drops.
7. **Product Row #2 (`وصلنا حديثاً` — Horizontal Scrollable Carousel on Mobile)** — Swipeable `snap-x` mobile product shelf (4-col desktop) for new arrivals.
8. **Brand Story Split (`text_and_image`)** — Asymmetric editorial text + layered photography highlighting craftsmanship/fabrics.
9. **Lookbook Slideshow (`slideshow`)** — Full-bleed swipeable editorial slides with dot indicators and collection CTA.
10. **6-Tile Mood / Lookbook Grid (`image_grid`)** — 2×3 mobile / 3×2 desktop clickable lookbook squares linking to collections/edits.
11. **3-Column Value Pillars (`text_with_icons`)** — Clean 3-column icon + title + 1-sentence factual store promises (never fake reviews).
12. **Multi-Column Footer** — Brand summary, Shop links, Support/WhatsApp & Instagram, Design System link.

---

## 5. Strict Component Rules

- **Badge Cap:** Maximum **1** badge per product card (`Sale` or `Sold Out`).
- **Empty State:** Any section with 0 configured items does not render at all.
- **Long Text:** Product descriptions > 180 chars truncate with "Read more / اقرأ المزيد".
- **Zero FOUC:** `:root { ... }` CSS variables rendered inline server-side in `StoreLayout.astro`.
