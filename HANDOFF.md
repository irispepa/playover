# Handoff

## Date / Time / Model
2026-11-17 · Opus 5.5

## Important links
- [src/shell/CONTRACT.md](src/shell/CONTRACT.md): rules every game follows: offline only, 44 pt targets, safe areas, dispose everything, seeded generation.
- [docs/plans/ui-polish.md](docs/plans/ui-polish.md): the UI and instructions standard.
- [docs/new-games.md](docs/new-games.md): how Odd Crown, Pocket Planets and Reef Relay work, plus phone install steps.
- [docs/wishlist.md](docs/wishlist.md): deferred items per game.
- [docs/history.md](docs/history.md): append-only session log with lasting decisions and gotchas. Read it for the testing setup.

## Plan / Spec
No multi-session plan. A Codex review pass is planned before deploying. The owner also wants a new, ambitious full three.js game (see Next steps).

## Branch / Worktree
- `main` at `/Users/irispepa/Projects/flight-games` holds all nine games, the Everbrook path fix (`763f565`) and short How to play guides for all nine games on the shared `src/shell/guide.js` (merged from `claude/playover-missing-tutorials-ca78d7`). There is no remote.
- Merged and removable: `codex/pocket-games-expansion` (`/Users/irispepa/.codex/worktrees/8ebe/flight-games`), `claude/flight-games-ui-polish-a614ec` and `claude/niko-game-collection-2eb773` (both under `.claude/worktrees/`). Kept for now because Codex may use its worktree for the review and another session may still be in the Niko one.

## Status
Nine games on `main`: Tidewater, Deepvault, Bastion Maze, Odd Crown, Pocket Planets, Reef Relay, Everbrook, Lanternfall, Patch & Kettle. `npm test` covers all nine suites and passes. Nothing is hosted, and nothing has been tried on a real iPhone.

## How to run it
- `npm install`
- `npm run dev -- --port 5311`: dev server (main checkout).
- `npm test`: all nine sim suites (Bastion runs `--quick`).
- `npm run build`, then `npm run preview -- --port 5311 --strictPort`: production build with the service worker. Rebuild after merges or preview shows stale games. The browser may keep an old service worker; hard-reload.
- `node scripts/make-icons.mjs`: regenerates `public/icon-*.png`.
- Visual checks: use a private headless Chrome over CDP, as in `docs/history.md` (session 2).

## Next steps
1. Codex review pass of the whole app before deploying.
2. New game: a full three.js game that uses the model's strengths to the max (proposal pending the owner's choice).
3. Pick HTTPS hosting (needs the owner's go-ahead), install on an iPhone, check touch feel, safe areas, frame rate and airplane-mode reopening.
4. Remove the merged branches and worktrees once the Codex review is done.
5. Work through `docs/wishlist.md`.

## Key decisions
- PWA, offline, no asset files: all art, models and sounds are made in code.
- Pure sims with bot tests: keep sim modules free of DOM and three.js.
- Each game keeps its own UI and CSS prefix; the shared standard is in `docs/plans/ui-polish.md`.
- How to play guides are short (owner: the less to read, the quicker into the game) and use the shared `openGuide` in `src/shell/guide.js`.
- Ask before committing or pushing.

## Known limitations / blockers
- No HTTPS host; never run on a real iPhone.
- Swipe in guides tested with simulated pointer events only.
- Balance for the newer games is bot-measured only, with little human play.
