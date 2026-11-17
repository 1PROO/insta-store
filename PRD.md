# Product Requirements Document (PRD) — `insta-store`

- **Project Name:** `insta-store` (White-Label Customizable Clothing Store Template)
- **Track:** `Pro` (Goldfish-Reviewed & Approved Spec)
- **Target Launch Goal:** Build a reusable, mobile-first clothing storefront + owner dashboard template **once**, deployed on the developer's Cloudflare account (plus per-store Cloudinary Free media), handed over to each boutique owner with full mobile customization.

---

## 1. Confirmed Decisions (Intake + Goldfish Resolution)
- **Business Model & Hosting Topology:** Single-tenant cloneable template built once and deployed per client under the developer's Cloudflare account (`$0/mo` free tier for initial stores; upgrades to `$5/mo` Workers Paid on developer account once scaling beyond 10 D1 databases or free quotas — zero client credit-card friction).
- **Primary Audience & UX:** **99% mobile** — both shoppers in Instagram's in-app browser and store owners managing the store from their phones (`375px` mobile-first for Storefront **and** Dashboard).
- **Primary Visitor Action:** Browse lookbook/products → pick `variant` (size + color) → place `Guest Order` (COD) protected against spam, or message via owner's WhatsApp.
- **Bilingual Scope (`ui_chrome_only`):** UI chrome, checkout labels, and Dashboard labels switch cleanly between **Arabic (RTL)** and **English (LTR)** (configurable in `Dashboard`: `ar` / `en` / `both`), while the owner enters product/collection content once in their chosen store language.
- **Currency:** Configurable in `store_config`; default **`EGP / ج.م`**.
- **Dashboard Authentication:** Email + Password using Workers-safe `WebCrypto PBKDF2-SHA256` (<3 ms CPU budget), D1 brute-force lockout (`failed_attempts`, `locked_until`), `session_version` revocation on password change, `Origin` CSRF check, unique `SESSION_SECRET` per deploy, and documented CLI emergency password reset runbook.
- **Media Storage & Hero Video:** **Cloudinary Free** (no credit card required, 25 monthly credits) via direct browser signed uploads (never proxied through the Worker's 128 MB RAM). Supports compressed MP4/WebM upload (`<= 5 MB`, H.264/MP4 checked client-side) **or** direct external video URL, with an instant `Poster` LCP image (`fetchpriority="high"`) and `navigator.connection?.saveData` respect.
- **Theme Customizer (`presets_plus_accent`):** 4 curated Shopify-Impulse-inspired palette presets (Flagship Editorial, Warm Dune, Minimal Clean, Midnight Streetwear) + custom Brand Accent / Button colors (with WCAG contrast warning) + corner radius (`sharp`, `soft`, `pill`) + system/bundled font choice (zero Google Fonts external requests on load).
- **Visual Inspiration:** Shopify Impulse preset style — layout inspiration only; zero fabricated stats or copied brands.

---

## 2. Scope of `v1` (What We WILL Build)

### A. Storefront (Mobile-First, Cached Edge SSR + Interactive Islands)
Public storefront HTML and `store_config` are cached via Cloudflare Cache API and purged immediately when the owner saves changes in `Dashboard`, while `variant` stock is fetched freshly on product/checkout interaction.

1. **Home (`/`)**
   - Announcement bar (configurable text/toggle from `Dashboard`, hidden if empty).
   - Sticky compact mobile header (logo/brand name, slide-out menu, search trigger, optional UI language toggle, cart icon with live badge).
   - **Hero Video / Banner Section:** Renders `Poster` immediately as LCP; loads/autoplays muted inline MP4/WebM (`<= 5 MB` upload or direct video URL) when `canplay` and not on `saveData`; optional headline + CTA button.
   - **Collections Grid:** Visual `collection` tiles linking to `/c/[slug]`.
   - **Featured / New Arrivals Grid:** Product cards showing photo, normalized color swatches, `base_price` (and `compare_at_price` strike-through if higher), quick-view/tap to product.
   - Footer (store bio, Instagram link, WhatsApp link, optional policy text).
2. **Catalog / Collection (`/shop` and `/c/[slug]`)**
   - Filter by `collection`, `size`, curated color swatch family, and `in_stock` availability; sort by newest, price low→high, price high→low.
3. **Product Detail Page (`/p/[slug]`)**
   - Swipeable mobile gallery.
   - `Variant` selector (Size pills + Color swatches + live stock check; out-of-stock disabled clearly; supports optional `price_override`).
   - **Size Guide** modal/drawer (product-specific or fallback `store_config.default_size_guide`; **hidden completely if neither is set**).
   - Collapsible accordions for Description (truncated with "Read more / اقرأ المزيد" for long text), Care/Fabric notes, Shipping summary (**empty sections hidden**).
   - Sticky mobile "Add to Cart" bar + direct **"Ask on WhatsApp"** pre-filled link.
4. **Slide-Over Cart Drawer & 1-Page Guest Checkout (`/checkout`)**
   - Quantity adjustment, stock check, `Promo Coupon` apply/remove, `Shipping Zone` selector (governorate/region), free-shipping calculation on **post-coupon merchandise subtotal** (per-zone threshold overrides `store_config.global_free_shipping_threshold` if set).
   - Guest fields: Full Name, Mobile Number (normalized & validated, e.g., Egyptian `01xxxxxxxxx`), Governorate (`shipping_zone`), Street Address, Notes.
   - Protected by **Cloudflare Turnstile**, IP rate limiting, client-generated `idempotency_key`, and server-side price/coupon/shipping calculation.
   - **Atomic `D1.batch()` Checkout:** Conditionally deducts `variant` stock (`WHERE stock >= ?`) and increments `coupon.used_count` (`WHERE max_uses IS NULL OR used_count < max_uses`) with `stock_state = 'reserved'`. Rejects cleanly if any item lacks stock.
   - Order Confirmation screen with Order Reference Code + **"Send Order Details to Store WhatsApp"** button.
5. **Tracking & Social Sharing**
   - Inject Meta Pixel / TikTok Pixel **only if configured in `Dashboard`**.
   - Dynamic OpenGraph tags for Instagram bio & WhatsApp previews.
   - **Strict Privacy Rule:** Zero third-party network calls on page load other than configured Storefront media CDN (`res.cloudinary.com` / configured video host) and explicitly configured Analytics Pixels / Turnstile on checkout.

### B. Owner Dashboard (`/admin` — Mobile-First `375px` UX)
1. **Auth & Security:** `/admin/login` (with lockout), server-side auth & `Origin` CSRF validation on every `/admin` page and `/api/admin/*` route, password change (`/admin/account`) invalidating old sessions via `session_version`.
2. **Store & Theme Customizer (`/admin/theme`):**
   - Store name, logo upload, favicon/OG image, UI language mode (`ar` / `en` / `both`), default store language, currency label, `default_size_guide`.
   - 4 curated Impulse-style presets + Accent/Button color picker (with contrast check) + corner radius (`sharp`, `soft`, `pill`), injected via inline `<style>:root{...}</style>` in Astro SSR (zero FOUC).
   - Hero editor: direct compressed MP4/WebM upload (`<= 5 MB`) OR direct video URL (rejecting non-direct Instagram/TikTok/YouTube share links with a clear tip) + Poster image + headline/CTA.
   - Contact & Tracking: WhatsApp number, Instagram URL, announcement bar, Meta Pixel ID, TikTok Pixel ID.
3. **Products, Variants & Trash (`/admin/products`):**
   - Create / Edit / Publish / Hide / Soft-delete (`Trash`) / Restore / Permanent Purge.
   - Client-side Canvas image resizing to WebP (`<= 1600px`, `< 400 KB`) before direct browser-to-Cloudinary signed upload.
   - Tracked in `media_asset` so replacing media or permanently purging from Trash deletes orphaned Cloudinary files.
   - Immutable `slug` (editable before first publish, locked with warning after publish).
   - `Variant` matrix (size, curated color family + hex + label, stock, optional `price_override`).
4. **Collections (`/admin/collections`):**
   - Create/edit/reorder collections with immutable `slug` and cover image (block deletion if active products exist without reassignment).
5. **Shipping Zones & Promo Coupons (`/admin/shipping`, `/admin/coupons`):**
   - Manage `shipping_zone` fees + optional per-zone override + global free-shipping threshold.
   - Manage `coupon` codes (`%` or fixed amount, `min_subtotal`, `max_uses`, expiry, active toggle).
6. **Orders Management (`/admin/orders`):**
   - Mobile card layout + status filter (`new`, `confirmed`, `shipped`, `delivered`, `cancelled`) + bulk cancel for spam orders.
   - Guarded state transitions: cancelling an order with `stock_state = 'reserved'` atomically restores `variant` stock and marks `stock_state = 'released'` (`WHERE stock_state = 'reserved'`), preventing double-restoration or stock inflation on status toggles.

---

## 3. Initial Setup & Operational Standards (Approved in `v1`)
- **`npm run seed:blank`:** Seeds clean default `store_config`, initial `admin` user from environment/CLI prompt (forcing password change on first login, zero hardcoded credentials in repo), and starter governorate `shipping_zone` rows locally or via `wrangler d1 execute --remote`.
- **Single-Client Deployment Script:** Parameterized `wrangler` config + migration runner (`wrangler d1 migrations apply`) so patching and deploying updates across N client stores stays automated and consistent.

---

## 4. Deferred (`نؤجل` — Explicitly Out of Scope for `v1`)
- Online card / wallet payment gateways (Paymob, Stripe, automated InstaPay verification).
- Customer accounts, login, wishlists, order history portal, and loyalty points.
- Shared multi-tenant SaaS billing/super-admin portal.
- Courier API integrations (Bosta / Aramex API).
- Free-form arbitrary 6-color + external Google Fonts customizer (replaced by contrast-safe curated presets + Accent).
