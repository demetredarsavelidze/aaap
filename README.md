# ASCENSION

A local-first personal operating system for planning, executing, tracking, and reviewing work across life areas.

**PLAN → EXECUTE → TRACK → REVIEW → ADJUST → REPEAT**

## Run locally

```bash
npm install
npm run dev
```

Then open the printed localhost URL. All data stays in `localStorage`. No account, backend, or network is required after install.

## Stack

React, TypeScript, Vite, React Router, Recharts, Lucide React, CSS.

## Architecture

- `src/types` — domain models
- `src/services` — persistence, mutations, analytics, score, achievements
- `src/store` — React context wrapping a single app state object
- `src/pages` — route screens
- `src/components` — shared UI

XP is stored as an append-only transaction log. Completing and uncompleting the same item reverses the same source rather than minting extra XP.

## Ascension Score

Documented in `src/services/scoreService.ts`. It is a 7-day weighted index of task completion, habit consistency, focus activity, goal momentum, and life-area balance.

## Demo data

First launch seeds a realistic demo operator named Alex Rivera. Clear it from Settings when you want an empty workspace.
