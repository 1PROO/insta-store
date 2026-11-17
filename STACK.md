# Technology Stack & Infrastructure (`STACK.md`)

- **Monthly Budget Constraint:** **`$0/month`** per initial client store instance (developer-managed free tier up to ~10 stores; `$5/month` developer account upgrade at scale).
- **Domain Plan:** Client buys custom domain only if desired (~$10–$20/yr); otherwise deploy on free `*.workers.dev` subdomain.

---

## 1. Selected Stack & Role of Each Tool (Verified Against Official Specs & Limits)

| Layer                    | Chosen Tool                                            | Exact Role                                                                                                                                                                                                                    | Verified Free-Tier Limits & Notes                                                                                                                                                        |
| :----------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | **Astro 6.4.x (SSR, Vite 7) + React 19 + Tailwind v4** | Renders cached Storefront HTML on the edge (`0 KB` JS by default) with inline `:root` `theme_tokens`, hydrating React islands only for Variant picker, Cart drawer, Checkout, and Mobile Dashboard.                           | Native `workerd` compilation via `@astrojs/cloudflare@13`; portable WASM `@astrojs/compiler` avoids Astro 7's AVX2 CPU requirement (tested on Xeon E5-2670).                             |
| **Hosting & Edge Cache** | **Cloudflare Workers + Cache API + Turnstile**         | Serves Storefront SSR, Admin Dashboard, API routes, caches public HTML/`store_config` (purged on admin mutations), and protects checkout with free Turnstile bot protection.                                                  | **Free:** 100,000 req/day, 10 ms CPU/req (I/O wait excluded), 128 MB RAM, 10 MB compressed bundle. **Paid ($5/mo):** 10M req/mo + 30M CPU ms/mo.                                         |
| **Database**             | **Cloudflare D1 (SQLite)**                             | Stores `store_config`, `collection`, `product`, `variant`, `media_asset`, `shipping_zone`, `coupon`, `order` (with line-item snapshots & `stock_state`), and `admin_user`/`admin_session`.                                    | **Free:** 5M rows read/day, 100K rows written/day, 500 MB/DB, **max 10 DBs per free account**. **Paid ($5/mo Workers Paid):** **100,000 DBs**, 25B reads/mo, 50M writes/mo.              |
| **Media Storage & CDN**  | **Cloudinary Free**                                    | Stores and delivers optimized WebP/AVIF product photos, logos, size guides, and compressed `<= 5 MB` hero MP4/WebM videos via **direct browser signed upload** (zero Worker RAM/CPU proxy cost, **no credit card required**). | **Free:** **25 credits/month** rolling 30-day window (1 credit = 1 GB storage OR 1 GB image/video bandwidth OR 1,000 transformations). Soft/hard pause if exceeded (never auto-charges). |
| **Local Isolation**      | **Docker + Node 24 LTS + npm**                         | Ensures identical builds, Wrangler/D1 local emulation, and CI parity across machines without polluting host OS.                                                                                                               | Local dev only; production runs natively on Cloudflare Workers.                                                                                                                          |
| **Code Repository**      | **GitHub (Private + 2FA)**                             | Source control, PR reviews, automated Code Guards CI, and parameterized `wrangler` deployment/migrations.                                                                                                                     | Free private repos + GitHub Actions CI.                                                                                                                                                  |

---

## 2. Architecture Constraints & Mitigations (From Goldfish Design Review)

1. **10 ms CPU Cap:** Password hashing uses `WebCrypto PBKDF2-SHA256` tuned and benchmarked `< 3 ms` CPU on `workerd`, paired with D1 login rate-limiting/lockout (`failed_attempts`, `locked_until`).
2. **128 MB RAM Cap:** Media never passes through the Worker; `/api/admin/media/sign` returns short-lived Cloudinary upload signatures, and the owner's mobile browser resizes images via Canvas before uploading directly to Cloudinary.
3. **Stateless D1 (No Interactive Transactions):** All checkout stock deductions, coupon usage caps, and order cancellations execute inside atomic `D1.batch()` conditional statements (`WHERE stock >= ?`, `WHERE stock_state = 'reserved'`).
4. **Account-Wide Quotas:** Co-hosting stores under one developer free account shares the **100K req/day** and **10 D1 DBs** pool; edge caching public Storefront HTML protects the request quota until upgrading to `$5/mo`.

---

## 3. Rejected Alternatives

1. **Cloudflare R2 (Deferred to Scale Tier):** Requires a payment card on file to activate even at $0, and serving media on `*.workers.dev` without a custom domain hits rate-limited `r2.dev` URLs or burns Worker req/day quotas. Revisit when migrating high-traffic stores onto custom domains + `$5/mo` plan.
2. **Next.js + OpenNext on Cloudflare Free Tier:** Higher bundle size and Server Component CPU overhead risk hitting Workers Free's 10 ms CPU ceiling and 10 MB bundle limit.
3. **Vercel Hobby + Supabase Free:** Vercel Hobby bans commercial client stores, and Supabase Free pauses databases after 7 days of inactivity (plus 2-project limit).

---

## 4. Strongest Reason AGAINST Our Chosen Stack

1. **Shared Free-Tier Blast Radius + 25-Credit Cloudinary Cap:** Co-hosting multiple client stores on one developer free Cloudflare account means one viral store can hit the shared 100K req/day ceiling (until upgrading to `$5/mo`), and a store using heavy uncached hero video streams on Cloudinary Free can burn through 25 GB rolling monthly bandwidth quickly.
2. **Custom Astro + React Island Admin:** Requires disciplined separation between Astro SSR routes and React interactive islands rather than relying on an off-the-shelf React SPA dashboard framework.

---

## 5. When Do We Reconsider? (`متى نعيد التفكير؟`)

1. **Client #6–10 or Viral Traffic Trigger:** Upgrade the developer Cloudflare account to **`$5/month` Workers Paid** (immediately unlocks **100,000 D1 databases**, 10M requests/mo, 50M D1 writes/mo, and 5-minute CPU budget—covering dozens of client stores for ~$5 total).
2. **Media Bandwidth Trigger:** Any single store consistently exceeds ~20 of Cloudinary's 25 monthly credits (due to heavy hero video playback) → migrate that store's media to **Cloudflare R2** (`$0` egress, 10 GB free) on a custom domain, or host its hero video externally.
3. **SaaS Pivot Trigger:** Shifting from independent per-client deployments to a unified multi-tenant SaaS with automated merchant billing.
