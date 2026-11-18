# Handoff

## Date / Time / Model
2026-11-16 19:05 EST · Opus 5.5

## Important links
- [src/shell/CONTRACT.md](src/shell/CONTRACT.md): rules every game follows: offline only, 44 pt targets, safe areas, dispose everything, seeded generation.
- [docs/plans/ui-polish.md](docs/plans/ui-polish.md): the UI and instructions standard, which the deferred Codex-games polish must meet.
- [docs/new-games.md](docs/new-games.md): how Odd Crown, Pocket Planets and Reef Relay work, plus phone install steps.
- [docs/wishlist.md](docs/wishlist.md): deferred items per game, including what the polish pass deliberately left.
- [docs/history.md](docs/history.md): an append-only session log with lasting decisions and gotchas. Read it for the testing setup.

## Plan / Spec
There is no multi-session plan. The UI polish pass (`docs/plans/ui-polish.md`) is finished for the three original games. Its one open item, polishing Codex's three games, is next step 1.

## Branch / Worktree
- `main` at `/Users/irispepa/Projects/flight-games` is at `fe93425`: the polish pass plus Codex's games. There is no remote.
- This handoff and `docs/history.md` were written on `claude/flight-games-ui-polish-a614ec` (`/Users/irispepa/Projects/flight-games/.claude/worktrees/flight-games-ui-polish-a614ec`), which is at the same commit as `main`. They are uncommitted; commit them, then fast-forward `main`.
- **Open branches:**
  - `codex/pocket-games-expansion` (`/Users/irispepa/.codex/worktrees/8ebe/flight-games`) is merged and can be removed.
  - `claude/niko-game-collection-2eb773` (`.claude/worktrees/niko-game-collection-2eb773`) is unfinished WIP and not merged (see Known limitations).
- In the main checkout, `docs/handoff-2026-11-16-fable.md` is the untracked first-build handoff, moved aside so the merge could run. Its lasting content is now in `docs/history.md`, so it can be deleted.

## Status
Six games are on `main`. Tidewater, Deepvault and Bastion Maze have the polished UI and illustrated How to play guides. `npm test` (all six suites) and `npm run build` pass. Nothing is hosted yet, and nothing has been tried on a real iPhone.

## How to run it
- `npm install`
- `npm run dev -- --port 5310 --strictPort`: dev server.
- `NO_HMR=1 npm run dev -- --port 5312 --strictPort`: a stable server for scripted checks. Restart it after edits, because it serves cached transforms.
- `npm test`: all six sim suites (Bastion runs with `--quick`).
- `npm run build`, then `npm run preview -- --port 5311 --strictPort`: the production build with the service worker, for offline checks.
- `node scripts/make-icons.mjs`: regenerates `public/icon-*.png`.
- **Visual checks:** the in-app Browser pane throttles when hidden. Use a private headless Chrome driven over CDP, as described in `docs/history.md` (session 2).
- **Dev handles:** `window.__dv` (Deepvault) and `window.__bm` (Bastion Maze), dev builds only.

## Next steps
1. **Done 2026-11-17 (`claude/playover-missing-tutorials-ca78d7`): all six newer games now have short How to play guides on the shared `src/shell/guide.js`; see `docs/history.md` session 3.** Original note: polish the How to play and instructions of Codex's three games (`src/games/oddcrown/`, `src/games/planets/`, `src/games/reef/`) to the standard in `docs/plans/ui-polish.md`.
   - **The standard:** paged guides, one topic per page, a picture drawn in code, 2–4 short points (about 20 words at most), page dots, Back/Next, Skip and swipe. Every fact is checked against the game's `sim.js`. Add first-run pointers only where they help.
   - **Worked examples to copy from:**
     - [src/games/builder/help.js](src/games/builder/help.js): Tidewater's pages and SVG pictures. The paging, swipe and first-run coach marks live in [src/games/builder/ui.js](src/games/builder/ui.js) (`helpGo`, `startCoach`).
     - [src/games/roguelike/howto.js](src/games/roguelike/howto.js): Deepvault's pages. The controls diagram is drawn from the real HUD layout, and the button labels on the first floor are in `ui.js` (`setFirstRun`).
     - `showHow` in [src/games/towerdefence/ui.js](src/games/towerdefence/ui.js): Bastion Maze's pages with mini-map SVGs, a tower table built from `data.js`, and the first-wave coach.
   - Verify at 390×844 and 375×667, and run `npm test` and `npm run build`.
2. Finish the Niko games branch in its own session. Then rebase it onto `main` and resolve the `src/main.js` and `vite.config.js` conflicts there; each new game should meet the same UI standard.
3. Pick HTTPS hosting (GitHub Pages, Netlify or Cloudflare Pages; needs the owner's go-ahead), install on the iPhone, and check touch feel, safe areas, frame rate and reopening in airplane mode.
4. Work through `docs/wishlist.md`: Deepvault enemy contrast (`render.js`), Bastion hero camera, Tidewater charter modal not yet seen on screen, balance from human play.

## Key decisions
- **PWA, offline, no asset files:** all art, models and sounds are made in code. No fonts, images or network.
- **Pure sims with bot tests:** keep the sim modules free of DOM and three.js, because `npm test` depends on it.
- **UI standard per game:** each game keeps its own UI and CSS prefix (`tw-`, `dv-`, `bm-`, Codex's `arcade.*`). The shared standard is in `docs/plans/ui-polish.md`, not in shared components.
- **First-run flags:** Tidewater `coachSeen`, Bastion `settings.seenCoach`, and Deepvault `meta.runs === 0` (no new key). Save formats are unchanged.
- **Impeccable hook:** no one-sided accent borders and no `width` animations. Use full borders and `transform`.
- Ask before committing or pushing.

## Known limitations / blockers
- No HTTPS host, so the app cannot be installed on a phone yet. It has never run on a real iPhone.
- Swipe in the guides was tested with simulated pointer events only.
- The Niko branch (`db82004`: Everbrook, Helpdesk, Lanternfall, about 9,400 lines) is an interrupted WIP and has not been reviewed.
- Codex's three games have only short browser and bot coverage, with no long human play.
