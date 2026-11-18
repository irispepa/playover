# Handoff

## Date / Time / Model
2026-11-16 23:30 EST · Sonnet 5.5

## Important links
- [src/shell/CONTRACT.md](src/shell/CONTRACT.md): rules every game follows: offline only, 44 pt targets, safe areas, dispose everything, seeded generation.
- [docs/plans/ui-polish.md](docs/plans/ui-polish.md): the UI and instructions standard.
- [docs/new-games.md](docs/new-games.md): how Odd Crown, Pocket Planets and Reef Relay work, plus phone install steps.
- [docs/wishlist.md](docs/wishlist.md): deferred items per game.
- [docs/history.md](docs/history.md): append-only session log with lasting decisions and gotchas. Read it for the testing setup.

## Plan / Spec
No multi-session plan. A Codex review pass is planned before deploying. The owner also wants a new, ambitious full three.js game (see Next steps).

## Branch / Worktree
- `main` at `/Users/irispepa/Projects/flight-games` holds all nine games (tip `be4b2df` plus the uncommitted housekeeping edits to this file, `docs/history.md` and `package.json`). There is no remote.
- Merged and removable: `codex/pocket-games-expansion` (`/Users/irispepa/.codex/worktrees/8ebe/flight-games`), `claude/flight-games-ui-polish-a614ec` and `claude/niko-game-collection-2eb773` (both under `.claude/worktrees/`). Kept for now because Codex may use its worktree for the review and another session may still be in the Niko one.

## Status
Nine games on `main`: Tidewater, Deepvault, Bastion Maze, Odd Crown, Pocket Planets, Reef Relay, Everbrook, Lanternfall, Patch & Kettle. `npm test` covers all nine suites and passes. Nothing is hosted, and nothing has been tried on a real iPhone.

## Known bug (open)
- **Everbrook: the owner cannot see the path tiles.** Roads/paths placed in the city builder are not visible on screen. Not yet investigated; check `src/games/everbrook/render.js` (path or tile materials, layering against the ground, and colour contrast) and the touch placement code in `input.js`. Sim tests pass, so it is likely a render issue.

## How to run it
- `npm install`
- `npm run dev -- --port 5311`: dev server (main checkout).
- `npm test`: all nine sim suites (Bastion runs `--quick`).
- `npm run build`, then `npm run preview -- --port 5311 --strictPort`: production build with the service worker. Rebuild after merges or preview shows stale games. The browser may keep an old service worker; hard-reload.
- `node scripts/make-icons.mjs`: regenerates `public/icon-*.png`.
- Visual checks: use a private headless Chrome over CDP, as in `docs/history.md` (session 2).

## Next steps
1. Fix the Everbrook path-tile visibility bug above.
2. Codex review pass of the whole app before deploying.
3. New game: a full three.js game that uses the model's strengths to the max (proposal pending the owner's choice).
4. Polish How to play for Odd Crown, Pocket Planets and Reef Relay to `docs/plans/ui-polish.md`; check Everbrook, Lanternfall and Patch & Kettle against the same standard.
5. Pick HTTPS hosting (needs the owner's go-ahead), install on an iPhone, check touch feel, safe areas, frame rate and airplane-mode reopening.
6. Remove the merged branches and worktrees once the Codex review is done.
7. Work through `docs/wishlist.md`.

## Key decisions
- PWA, offline, no asset files: all art, models and sounds are made in code.
- Pure sims with bot tests: keep sim modules free of DOM and three.js.
- Each game keeps its own UI and CSS prefix; the shared standard is in `docs/plans/ui-polish.md`.
- Ask before committing or pushing.

## Known limitations / blockers
- No HTTPS host; never run on a real iPhone.
- Swipe in guides tested with simulated pointer events only.
- Balance for the newer games is bot-measured only, with little human play.
