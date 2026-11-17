#!/usr/bin/env sh
set -eu

# Parameterized per-client build + D1 migration + Cloudflare Worker deploy script.
# Usage:
#   CLIENT_WORKER_NAME=brand-x CLIENT_DB_NAME=brand-x-db ./scripts/deploy-client.sh

WORKER_NAME="${CLIENT_WORKER_NAME:-insta-store}"
DB_NAME="${CLIENT_DB_NAME:-insta-store-db}"

echo "==> Running guards, tests, and production build..."
npm run guards
npm test
npm run build

echo "==> Applying D1 migrations to remote database: $DB_NAME"
npx wrangler d1 migrations apply "$DB_NAME" --remote

echo "==> Deploying Worker: $WORKER_NAME"
npx wrangler deploy --name "$WORKER_NAME"
