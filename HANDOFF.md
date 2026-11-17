# Session Handoff — `insta-store`

## Where We Are
- **Skill Active:** `motalim-web-builder` (`~/.gemini/config/skills/motalim-web-builder/SKILL.md`), **Track: `Pro`**.
- **Phase 1 (Planning — 0 LOC): COMPLETED & GOLD-REVIEWED.**
  - Read [PRD.md](./PRD.md), [STACK.md](./STACK.md), and [GLOSSARY.md](./GLOSSARY.md).
  - Two fresh Goldfish subagents (`egm-zoom-out` & `egm-design`) reviewed the specs, and the user resolved all 6 trade-offs in `.motalim/goldfish-answers.json`.
- **Next Step: Phase 2 (Setup & Automated Code Guards)**
  - Follow `~/.gemini/config/skills/motalim-web-builder/references/phase-2-setup-guards.md`:
    1. Initialize Git + `.gitignore` (ignore `.env*`, `.motalim/`, `node_modules/`, `dist/`, `.wrangler/`) and link Private GitHub repo when provided.
    2. Verify Docker + Node 24 LTS + official Astro Cloudflare SSR + React Islands + Tailwind starter (check licenses & disable telemetry).
    3. Write concise `AGENTS.md` project rules.
    4. Install and live-test all **4 Code Guards** (Formatter, Linter/Typecheck, File-size guard, Secret scanner) with negative failure proofs (`أرِني أمامي`).
- **Live Tailscale Mission Control:**
  - Script: `~/.gemini/config/skills/motalim-web-builder/scripts/live_board.py`
  - State file: `.motalim/live-state.json` (update at milestones so the user can monitor progress from mobile).
