# Project Rules (`AGENTS.md`) — `insta-store`

1. **Always Branch:** Never commit features directly to `main`. Create a focused branch (`feat/...`, `fix/...`, `chore/...`), verify guards & tests, and merge cleanly.
2. **Plan & Approve:** State a concise plan before major architectural or UI changes. Follow [PRD.md](./PRD.md), [STACK.md](./STACK.md), [GLOSSARY.md](./GLOSSARY.md), and `DESIGN_SYSTEM.md`.
3. **Zero Fabricated Data:** Never invent demo customer reviews, sales numbers, subscriber counts, or external placeholder links.
4. **Mobile-First (`375px`):** Both Storefront and `/admin` Dashboard must work cleanly at `375px` width with touch-friendly controls.
5. **Deep Modules & TDD (`Pro` Track):** Keep business logic (pricing, coupons, shipping, `D1.batch()` stock/order transitions, auth) in small-interface deep modules covered by unit/integration tests at agreed seams.
6. **Server-Side Security Lock:** Every `/admin` SSR route and `/api/admin/*` mutation must verify `admin_session` + `Origin` CSRF check on the server.
7. **Prove Everything (`أرِني`):** Never report a feature or fix as done without running automated checks/tests and live browser or HTTP verification.
8. **Secrets Protection:** Never commit `.env`, `.dev.vars`, API tokens, or credentials. Keep `.gitignore` and secret-scanner hooks active.
