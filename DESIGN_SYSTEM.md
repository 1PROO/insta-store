# Design System (`DESIGN_SYSTEM.md`) — `insta-store`

> **Golden Rule:** Fix visual inconsistencies here first—never patch single pages ad-hoc. All Storefront pages inherit tokens injected inline by `StoreLayout.astro`.

---

## 1. Visual Direction (Inspired by Shopify Impulse)

- **Editorial Fashion Storefront:** High-contrast typography, generous breathing room, crisp product framing (`3:4` portrait aspect ratio for clothing), subtle micro-hover transitions, and zero visual clutter.
- **99% Mobile-First (`375px`):** Every layout, sticky bar, drawer, and `/admin` control is designed for one-handed thumb use first, expanding gracefully on tablet/desktop.
- **Bilingual (`ar` RTL / `en` LTR):** Uses logical CSS (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) and clean system UI Arabic/Latin stacks (zero external Google Font requests on load).

---

## 2. Curated Palette Presets (`theme_tokens`)

Merchants choose 1 of 4 curated presets in `/admin/theme` and may override `--accent-primary`, `--btn-bg`, `--btn-text`, and corner radius (`sharp` | `soft` | `pill`). Contrast check warns if `< 4.5:1`.

| Preset ID             | Name                               | `--bg-primary` | `--bg-surface` | `--text-primary` | `--accent-primary` |
| :-------------------- | :--------------------------------- | :------------- | :------------- | :--------------- | :----------------- |
| `flagship_editorial`  | **Flagship Editorial** _(Default)_ | `#FAF9F6`      | `#FFFFFF`      | `#111111`        | `#111111`          |
| `warm_dune`           | **Warm Dune**                      | `#F6F1EB`      | `#FFFDF9`      | `#241E1A`        | `#8C5A3C`          |
| `minimal_clean`       | **Minimal Clean**                  | `#FFFFFF`      | `#F5F5F7`      | `#0F172A`        | `#0F172A`          |
| `midnight_streetwear` | **Midnight Streetwear**            | `#0B0D10`      | `#151921`      | `#F5F7FA`        | `#E5E7EB`          |

---

## 3. Radius Presets

- `sharp`: `--radius-card: 0px`, `--radius-btn: 2px`, `--radius-pill: 999px` (classic Impulse editorial)
- `soft`: `--radius-card: 10px`, `--radius-btn: 8px`, `--radius-pill: 999px`
- `pill`: `--radius-card: 16px`, `--radius-btn: 999px`, `--radius-pill: 999px`

---

## 4. Section Blueprint (4 Properties per Homepage Section)

1. **Announcement Bar (`شريط الإعلان`)**
   - _Location:_ Topmost strip (`36px` height), hidden completely when empty.
   - _Shape:_ Full-width high-contrast slim bar (`--btn-bg` / `--btn-text`).
   - _Content:_ Single short promo or shipping notice from `store_config`.
   - _Feel:_ Crisp, non-intrusive urgency.
2. **Sticky Compact Header**
   - _Location:_ Top sticky (`56px` height on mobile).
   - _Shape:_ 3-zone bar (Menu + Search | Centered Brand Logo/Name | Language Toggle + Cart Badge).
   - _Content:_ `store_config` logo/name and live cart count.
   - _Feel:_ Editorial boutique navigation without clutter.
3. **Hero Video / Lookbook Banner**
   - _Location:_ Immediately below header (`72vh` max `640px` on mobile).
   - _Shape:_ Full-bleed edge-to-edge media with bottom gradient scrim and clean overlay stack.
   - _Content:_ Instant `Poster` LCP image + muted inline MP4 (`<= 5 MB` or direct URL, respects `saveData`) + headline + single primary CTA.
   - _Feel:_ High-fashion campaign reel inside Instagram's in-app browser.
4. **Collections Grid (`الأقسام`)**
   - _Location:_ Below hero.
   - _Shape:_ 2-column mobile grid (`4-col` desktop), `4:5` portrait tiles with bottom title overlay.
   - _Content:_ Active `collection` entries linking to `/c/[slug]`.
   - _Feel:_ Magazine-style visual directory.
5. **Featured Products Grid (`أحدث القطع`)**
   - _Location:_ Below collections.
   - _Shape:_ 2-column mobile grid (`4-col` desktop), `3:4` image frame, max 2-line title, color swatch dots (max 4 + `+N`), price + optional compare-at price, max 1 badge (`خصم` / `نفذت الكمية`).
   - _Content:_ Published `product` rows from centralized `store-repository`.
   - _Feel:_ Fast scanning with instant color visual cues.

---

## 5. Strict Component Rules

- **Badge Cap:** Maximum **1** badge per product card (`Sale` or `Sold Out`), never stacked stickers.
- **Empty State:** Sections with 0 items (announcement, size guide, fabric notes, empty collections) do not render at all.
- **Long Text:** Product descriptions longer than 180 chars truncate with an accessible "Read more / اقرأ المزيد" toggle.
- **Zero FOUC:** `StoreLayout.astro` renders `:root { ... }` CSS variables server-side on initial HTML response.
