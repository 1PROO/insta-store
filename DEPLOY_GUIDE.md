# Client Deployment & Operations Guide (`DEPLOY_GUIDE.md`)

Follow the 5 MOTALIM stations to launch each independent client store on Cloudflare + Cloudinary Free (`$0/month` initial tier).

## Station 1: Domain & DNS (Optional)

- Deploy initially on `https://<client-worker>.workers.dev` for `$0`.
- If the client buys a custom domain: add it to Cloudflare, verify existing DNS records stay Grey Cloud where needed, enable Orange Cloud for the store, and copy Cloudflare's 2 nameservers to the registrar.

## Station 2: Media Storage (Cloudinary Free — No Card Needed)

1. Create or assign a free Cloudinary account (25 rolling credits/month).
2. Copy `Cloud Name`, `API Key`, and `API Secret` (never commit them to Git or paste into chat).

## Station 3: Secrets & D1 Database Provisioning

1. Create a client D1 database: `npx wrangler d1 create <client-db-name>` and update `database_id` / `database_name` in `wrangler.jsonc`.
2. Set Worker secrets via Wrangler (never in Git):
   - `npx wrangler secret put SESSION_SECRET` (random 64-char hex)
   - `npx wrangler secret put CLOUDINARY_CLOUD_NAME`
   - `npx wrangler secret put CLOUDINARY_API_KEY`
   - `npx wrangler secret put CLOUDINARY_API_SECRET`
   - Optional anti-spam: `npx wrangler secret put TURNSTILE_SITE_KEY` & `TURNSTILE_SECRET_KEY`
3. Apply migrations & blank seed:

   ```bash
   npx wrangler d1 migrations apply <client-db-name> --remote
   ADMIN_EMAIL=owner@brand.com ADMIN_PASSWORD='TempStrongPassword!' node scripts/seed-blank.mjs --remote
   ```

## Station 4: Deploy & Verify Live

```bash
CLIENT_WORKER_NAME=<client-worker> CLIENT_DB_NAME=<client-db-name> ./scripts/deploy-client.sh
```

1. Open the live URL, verify `/`, `/shop`, `/checkout`, and confirm `/admin` redirects unauthenticated requests to `/admin/login`.
2. Log in with the owner credentials, change password immediately on `/admin/settings`, customize branding on `/admin/theme`, and upload products on `/admin/products`.

## Station 5: Search Console & PageSpeed

- Submit `https://<domain>/sitemap.xml` in Google Search Console.
- Run Google PageSpeed Insights (Mobile) and DevTools slow-3G throttling check.

---

## Emergency Owner Password Reset Runbook

If a store owner forgets their `/admin` password, re-provision via Wrangler CLI (which bumps `session_version` / replaces hash safely without exposing a public reset backdoor):

```bash
ADMIN_EMAIL=owner@brand.com ADMIN_PASSWORD='NewTempPassword!2026' node scripts/seed-blank.mjs --remote
```
