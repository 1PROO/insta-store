# Drift Report (`DRIFT_REPORT.md`) — `insta-store`

- **Reviewed Specs:** `PRD.md`, `STACK.md`, `DESIGN_SYSTEM.md`, `GLOSSARY.md`
- **Date:** 2026-11-17
- **Summary:** All MVP/Pro v1 commitments in `PRD.md`, `STACK.md`, `DESIGN_SYSTEM.md`, and `GLOSSARY.md` align with the implemented repository after Phase 4 remediation. One minor intentional extension exists cleanly within scope, and no breaking drift remains.

---

## 1. Spec-by-Spec Verification

| Spec Document          | Requirement                                                                                                                                                                                                                     | Implementation Verification                                                                                                                 | Status      |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ | :---------- |
| **`PRD.md`**           | Single-tenant cloneable template on Cloudflare Workers + D1 (`$0/mo` tier) + Cloudinary Free                                                                                                                                    | `wrangler.jsonc` (`D1` binding), `migrations/0001_init.sql`, `scripts/deploy-client.sh`, `DEPLOY_GUIDE.md`, `src/lib/media/cloudinary.ts`   | **Aligned** |
| **`PRD.md`**           | Bilingual `ui_chrome_only` (`ar` RTL / `en` LTR) persisted across navigation                                                                                                                                                    | `StoreLayout.astro` (`lang` query + `ui_lang` cookie), `src/lib/theme/i18n.ts`                                                              | **Aligned** |
| **`PRD.md`**           | Mobile-first Impulse-inspired Storefront (Hero video/poster, Collections, Featured, Dual Promo, Brand Story, Lookbook Slideshow + Grid, Search/Filters, PDP Variants + Size Guide + WhatsApp, Cart Drawer, 1-page COD Checkout) | `src/pages/index.astro`, `shop.astro`, `c/[slug].astro`, `p/[slug].astro`, `checkout.astro`, `src/components/store/*`, `src/lib/commerce/*` | **Aligned** |
| **`PRD.md`**           | Mobile-first `/admin` Dashboard (Auth + D1 Lockout + `session_version`, Presets + Color/Contrast + Radius, Hero Video/URL validation, Products/Variants/PriceOverride/Trash/Purge, Zones/Coupons/Bulk Orders, Pixels)           | `src/pages/admin/*`, `src/pages/api/admin/*`, `src/components/admin/*`, `src/lib/auth/*`, `src/lib/data/d1-admin.ts`                        | **Aligned** |
| **`PRD.md`**           | Atomic `D1.batch()` checkout (`stock >= qty`, `coupon.max_uses`), Turnstile + IP rate limiting + WhatsApp order link                                                                                                            | `src/pages/api/orders.ts`, `src/lib/data/d1-orders.ts`, `src/components/store/CheckoutForm.tsx`                                             | **Aligned** |
| **`STACK.md`**         | Astro 6.4.x + Vite 7 + React 19 + Tailwind v4 + Biome + Vitest + `@astrojs/cloudflare` (avoiding Astro 7 AVX2 SIGILL)                                                                                                           | `package.json` (`astro@^6.4.8`, `overrides.vite@^7.3.2`, `@astrojs/cloudflare@^13.7.0`, `@astrojs/react@^5.0.7`)                            | **Aligned** |
| **`DESIGN_SYSTEM.md`** | 4 curated presets, inline SSR CSS vars (zero FOUC), `>= 4.5:1` contrast warning, `0px/6px/999px` corner radius presets                                                                                                          | `src/lib/theme/presets.ts`, `src/pages/design-system.astro`, `ThemeHeroPixelsSection.tsx`                                                   | **Aligned** |
| **`GLOSSARY.md`**      | Canonical entity terms (`store_config`, `collection`, `product`, `variant`, `media_asset`, `shipping_zone`, `coupon`, `order`, `admin_user`, `admin_session`)                                                                   | D1 tables and TypeScript interfaces in `migrations/0001_init.sql` & `src/lib/domain/types.ts`                                               | **Aligned** |

---

## 2. Recorded Intentional Adaptations (Non-Blocking)

1. **Product Search & Color Filter on `/shop` and `/c/[slug]`:** Extended `filterCatalogProducts()` (`src/lib/commerce/catalog-filter.ts`) with keyword (`q`) and color family filters alongside the `collection` / `size` / `in_stock` / `sort` parameters already specified in `PRD.md`.
2. **D1-Backed Store vs Sample Fallback:** When `env.DB` is bound (Wrangler / Workers runtime), `src/lib/data/store-repository.ts` strictly queries D1 without falling back to `SAMPLE_PRODUCTS` or in-memory orders (prevents silent data masking). Static/unit contexts without `env.DB` continue using `sample-catalog.ts` cleanly.
3. **Interactive Visual Showcase Page (`/design-system`):** Retained from Phase 3 as a clean live reference of the 4 theme presets, typography, and buttons for store setup/QA.
