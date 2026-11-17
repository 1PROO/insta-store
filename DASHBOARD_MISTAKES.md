# Dashboard Mistake-Proofing Matrix (`DASHBOARD_MISTAKES.md`)

> Written **before** implementing `/admin` (Phase 4, Step 2 of `motalim-web-builder`).

| #   | Operator Mistake on Mobile Dashboard                                                | Server / UI Protection                                                                                                          |
| :-- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Selecting unreadable button/text colors in Theme Customizer                         | Curated Impulse presets + WCAG contrast ratio check (`< 4.5:1` warning + safe fallback)                                         |
| 2   | Pasting Instagram/TikTok/YouTube webpage link into Hero Video URL                   | Reject non-direct video URLs (`instagram.com`, `tiktok.com`, `youtube.com`, `youtu.be`) with clear tip                          |
| 3   | Uploading giant 4K iPhone `.MOV` or 8 MB photo from phone                           | Client-side Canvas WebP resize (`<= 1600px`, `< 400 KB`) for images + strict `<= 5 MB` MP4/WebM check before signed upload      |
| 4   | Publishing a product with missing image, zero/negative price, or 0 variants         | Block `status = 'published'` on server until title, `>= 1` image, `basePrice > 0`, and `>= 1` variant exist                     |
| 5   | Editing product title after launch and accidentally breaking Instagram bio/ad links | Lock `slug` automatically once product has been published (warn & require explicit redirect/unlock)                             |
| 6   | Creating duplicate product or collection `slug`                                     | `UNIQUE` constraint in D1 + friendly validation error linking to existing item                                                  |
| 7   | Deleting a collection that still has published/active products                      | Block deletion if active products belong to it until reassigned or moved                                                        |
| 8   | Deleting a product by mistake on a small `375px` touch screen                       | Soft-delete to **Trash (`deleted_at`)** first; permanent purge requires explicit confirmation + cleans Cloudinary `media_asset` |
| 9   | Leaving orphaned images/videos in Cloudinary after replacement or purge             | Track every upload in `media_asset`; delete previous asset on replacement/permanent purge                                       |
| 10  | Toggling order status `cancelled` ↔ `confirmed` twice and inflating stock           | Guard with `order.stock_state` (`reserved` \| `released`) inside atomic `D1.batch()` (`WHERE stock_state = 'reserved'`)         |
| 11  | Entering invalid WhatsApp number format (`010...` vs `+20...` vs letters)           | Normalize and validate WhatsApp number before saving `store_config`                                                             |
| 12  | Entering invalid coupon (`> 100%` discount or negative fixed amount)                | Validate `percentage` in `1..90`, `fixed > 0`, unique uppercase `code`                                                          |
| 13  | Setting weak/blank password or forgetting to invalidate old stolen sessions         | Enforce `>= 8` chars, `WebCrypto PBKDF2-SHA256` (`< 3 ms` CPU), and bump `session_version` on password change                   |
| 14  | Brute-force guessing `/admin/login` password                                        | D1-backed `failed_attempts` + `locked_until` cooldown after 5 failures                                                          |
| 15  | Leaving demo/test orders or products live when handing over to client               | Clean `npm run seed:blank` script + one-click test-order cleanup test before final deploy                                       |
