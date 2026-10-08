---
paths:
  - './**/*'
---

# Project

SvelteKit 3 + Svelte 5 + TypeScript + Tailwind CSS v4 + Flowbite Svelte.

## Commands (run from repo root)

- `pnpm dev` – Vite dev server (loads `.env` outside production)
- `pnpm check` – Svelte + TypeScript errors
- `pnpm exec prettier --check .` / `pnpm format` – Prettier check / write
- `pnpm check:design` – design-system violations (`scripts/check-design.mjs`)
- `pnpm build` – production build
- Before finishing frontend work, run the Prettier check, `check`, `check:design` and
  `build`. `check` and `check:design` already fail on existing issues (see `CLAUDE.md`):
  add no new errors or design violations. There are no tests.

## Project conventions

- SvelteKit config is in `vite.config.ts` (there is no `svelte.config.js`).
- Import app code via `$lib/...` (not `#lib`). Folder imports don't resolve:
  import files directly, e.g. `$lib/components/ui/FormField.svelte`.
- Layout:
  - `src/routes/` – pages; keep them thin (load data, compose components)
  - `src/lib/components/ui/` – generic wrappers on top of Flowbite
  - `src/lib/features/<feature>/` – feature components and state (sessions, artifacts…)

## Svelte 5

- Runes only: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
  No `export let`, `$:` statements, or `on:` directives; use `onclick` etc.
- Shared reactive state lives in `.svelte.ts` modules, not Svelte stores.
- Prefer `$derived` over `$effect`; use `$effect` only for side effects
  (subscriptions, timers, DOM) and return a cleanup.
- Pass content with snippets (`{#snippet}` / `{@render}`), not slots.

## Data

- The app is server-rendered. Load page data in `+page.server.ts`
  `load` functions; SyncFlow calls go through `$lib/server/syncflow-client.ts`.
- All HTTP goes through `$lib/api`. Never call `fetch('/api/...')`
  from components; add a typed function to the client instead.
- Every view that loads data handles loading, empty and error states.

## General

- TypeScript strict; no `any` without a comment explaining why.
- Ask before adding a dependency.
- UI and styling rules: see `.claude/rules/design-system.md`.
