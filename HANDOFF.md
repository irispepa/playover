# Handoff

## Date / Time
2026-11-16 16:08 America/New_York

## Important links
- `src/shell/CONTRACT.md` — module, offline, phone and disposal requirements.
- `docs/new-games.md` — expansion behavior, validation and phone installation.
- `docs/wishlist.md` — existing game limitations and deferred physical-device QA.

## Plan / Spec
The requested expansion is implemented: three more three.js games, including
randomized unknown-rules chess, polished mobile UI, and offline saves/assets.
The user authorized a local commit of this session's changes. No push or deployment
is authorized.

## Branch / Worktree
`codex/pocket-games-expansion` — `/Users/irispepa/.codex/worktrees/8ebe/flight-games`.
Branched from `f18e3a8` to preserve this session independently.
The original checkout is `/Users/irispepa/Projects/flight-games` on `main`.
Its untracked HANDOFF.md supplied the starting context; it was not modified.
This worktree originally had no handoff. Keep work in this checkout.

## Status
Six games are implemented, including the expansion and illustrated launcher.
Production build and all six simulation suites pass. Phone-sized browser checks
and production offline launches pass. Still not hosted or tested on real iPhone.

## How to run it
- `npm ci`
- `npm run dev -- --host 127.0.0.1 --port 5310 --strictPort`
- `npm test` — new simulations plus existing suites; tower defence uses `--quick`.
- `npm run build` — emits `dist/`, including all PWA assets.
- `npm run preview -- --host 127.0.0.1 --port 5311 --strictPort`
- `NO_HMR=1 npm run dev -- --host 127.0.0.1 --port 5312 --strictPort` for stable QA.

## Next steps
1. Review/play the new games, especially Odd Crown pacing and difficulty.
2. Choose HTTPS hosting, then install on iPhone and test airplane-mode reopen.
3. Check physical touch feel, safe areas and frame rate before the flight.
4. Ask the user before any commit or push. No remote exists in the original setup.

## Key decisions
- Plain ES modules, Vite, three.js and vite-plugin-pwa; no new dependencies.
- Existing games remain intact. New games follow the same lazy module contract.
- `arcade.js/css` supplies shared new-game UI, dialogs, camera and board helpers.
- Odd Crown: 6 × 6, six secret piece rules chosen from twelve movement patterns
  and six capture powers. Unusual jumps, cannon captures, blasts, recruitment,
  boomerangs, allied swaps, hidden trapdoor/spring/confetti tiles. New seed per court.
- Free failed attempts and automatic discovery after two misses; Peek insight;
  notebook; king danger warnings; three-round royal truce; undo retains discoveries.
- Pocket Planets: swipe-driven 2048-style merge puzzle, 3D planet atlas, undo,
  recyclable planets and persistent scores; no timer; keep playing after a Sun.
- Reef Relay: generated solvable channel networks, three pearls, unlimited hints,
  reverse rotations, undo and reef progression; no timer.
- All art, models, labels and audio are local/procedural. No external asset requests.
- Repeated tiles/stars use instancing. Stage disposal now frees instance resources.
- Production caching includes all game chunks, including those not yet launched.

## Validation
- Odd Crown: 80 unique courts and full bot games, rule/power and safety checks.
- Pocket Planets: 100 seeds, merges/spawning/recycle/undo/game-over checks.
- Reef Relay: 500 seeds, solvability/connectivity/hint/undo checks.
- Existing builder, roguelike and tower-defence suites passed.
- Browser layouts: 375 × 667, 390 × 844, 430 × 932; controls ≥44 CSS pixels.
- Browser interaction: chess raycast/AI/undo, planet swipe/merges, reef rotation/
  hints/victory, saved continuation and game exits.
- Production normal reload and all six launches worked with network blocked.
  An uncached fetch failed during that check; navigator.onLine can still report
  true under Chrome's network throttling, so it is not the test assertion.

## Known limitations / blockers
- No HTTPS hosting address; localhost cannot install this PWA on a phone.
- No physical iPhone testing. Safe-area rules exist but device behavior is unverified.
- Odd Crown rules/balance have bot and short browser coverage, not extended human QA.
- Legacy game balance/performance gaps remain in `docs/wishlist.md`.
- The game-module contract's own-folder-only rule came from parallel initial game
  development; this expansion explicitly required shell registration and shared UI.
