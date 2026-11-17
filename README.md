# insta-store

White-label, mobile-first customizable clothing store template built with Astro 6.4 (Vite 7), React 19 islands, Tailwind CSS v4, Cloudflare Workers + D1, and Cloudinary Free.

## Documentation

- [PRD.md](./PRD.md) — Product requirements & `v1` vs deferred scope
- [STACK.md](./STACK.md) — Architecture, free-tier limits, and scaling triggers
- [GLOSSARY.md](./GLOSSARY.md) — Ubiquitous domain vocabulary
- [AGENTS.md](./AGENTS.md) — Engineering and security rules

## Quick Start (Docker — 1 Command)

```bash
docker compose up --build
```
Opens at `http://localhost:4321` with live reload.

## Local Verification & Guards

```bash
npm install
npm run guards   # Biome format + lint, file-size guard, secret scanner
npm test         # Vitest suite
npm run build    # Typecheck + Astro Cloudflare production build
```
