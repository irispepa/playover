# History

An append-only log of sessions and the decisions with lasting value. Not auto-loaded; `HANDOFF.md` holds the current state.

## 2026-11-16 · Session 1 · Fable 5.2 · first build (`f18e3a8`)
- Built an offline PWA with three three.js games: Tidewater (`builder`), Deepvault (`roguelike`) and Bastion Maze (`towerdefence`).
- **Owner's choices:** three complex games. Deepvault is real-time rather than turn-based. Bastion Maze gets a playable hero and an Overpowered mode. The app is a PWA, not a native app, so there is no App Store or Xcode; the cost is one HTTPS visit to install. There are no art or audio files; everything is generated in code.
- **Architecture:** each game has pure sim modules (no DOM, no three) plus `render.js`, `ui.js`, `input.js` and `index.js`. Content tables live in `data.js`. The headless bot tests depend on the sims staying pure. Balance so far comes from bots, not from human play.
- **Gotchas worth keeping:**
  - Bastion `models.js` `add()` takes `s` for uniform scale and `sx/sy/sz` per axis. A per-axis value falls back to `s`, then to 1.
  - Deepvault's camera, lighting, wall height and `CHAR_SCALE` constants at the top of `render.js` were tuned together by eye for a phone. Change them together.
  - Saves live in localStorage. Changing a sim's state shape needs a save-version check, or Continue breaks.
  - The dev server does not register the service worker. Test offline behaviour against `npm run preview`.

## 2026-11-16 · Codex · pocket games expansion (`012c792`)
- Added Odd Crown (discovery chess), Pocket Planets (a merge puzzle) and Reef Relay (a channel puzzle), a new illustrated launcher (`src/shell/arcade.js/css`, `covers.js`) and `npm test` covering all six games.
- No new dependencies. All art and audio are procedural. Production caching includes every game chunk.
- The CONTRACT's "own folder only" rule came from the parallel first build. This expansion deliberately registered games in the shell and added shared UI.
- Details are in `docs/new-games.md`.

## 2026-11-16 · Session 2 · Opus 5.5 · UI polish pass (`9be3c21`, merged in `fe93425`)
- Polished the UI of Tidewater, Deepvault and Bastion Maze to the standard in `docs/plans/ui-polish.md`:
  - paged, illustrated How to play guides (8, 8 and 9 pages)
  - first-run coaching
  - clearer title and modal screens
  - focus rings and reduced-motion support
- One subagent per game worked in parallel on separate folders, each with its own dev server and headless Chrome. Another agent then reviewed the diff and found five small bugs, all fixed:
  - Bastion seed text was rendered as HTML unescaped.
  - Bastion toasts were hidden behind the title screen.
  - Tidewater focus jumped to Skip.
  - Tidewater's modal pause and coach pause conflicted.
  - Deepvault's first-run labels stayed up past floor 1.
- **Decision:** the old shell menu was not polished, because Codex's launcher replaced it.
- **Merge:** Codex's branch was merged into the polish branch. The only conflict was in `docs/wishlist.md`, where both sides had appended lines. `main` was then fast-forwarded.
- **Testing lesson:** the in-app Browser pane throttles to about 2 fps when hidden and serves stale screenshots. The chrome-devtools MCP can be locked by another session's browser profile. What worked was a private headless Chrome (`--headless=new --remote-debugging-port=<port> --user-data-dir=<own dir> --use-angle=swiftshader --enable-unsafe-swiftshader`) driven by a small Node CDP script (global `WebSocket`, Node 24). It emulates 390×844 @2x and renders WebGL. Use `NO_HMR=1` dev servers so parallel edits don't reload the page.
- The Niko games branch (`claude/niko-game-collection-2eb773`, WIP `db82004`: Everbrook, Helpdesk, Lanternfall) was left unmerged because it is unfinished. It conflicts with `main` in `src/main.js` and `vite.config.js`.

## 2026-11-17 · Opus 5.5 · PWA deploy and battery (`claude/playover-pwa-conversion-9dbb76`)
- The app is being renamed Playover and will be hosted on GitHub Pages at `irispepa/playover`. The renaming, copy and icons are being done in a parallel worktree.
- `.github/workflows/deploy.yml`: every push to `main` runs `npm ci`, `npm test` (about 80 s) and `npm run build`, then deploys `dist/`. Pages must use "GitHub Actions" as its source. `base: './'` already works under `/playover/`.
- **Battery (`src/shell/stage.js`):** the 3D games render at up to 60 fps while there is input and for 2 s after, then at 30 fps. The pixel ratio is capped at 1.5 (was 2), and `powerPreference` is now the default (was `high-performance`). A headless check confirmed 30 fps idle, 60 fps active and a 1.5× drawing buffer at DPR 3.
- **Updates:** `registerType: 'prompt'` with no `skipWaiting`/`clientsClaim`. A new version waits while a game is open and is applied, with one reload, on the menu (`applyUpdate` in `src/main.js`). The first visit isn't controlled by the service worker until the next load, but offline play works from then on. Checked in headless Chrome by rebuilding under a live page.
- iOS often resumes a suspended home-screen app instead of relaunching it, which skips the load-time update check. So `onRegisteredSW` also calls `reg.update()` on return to the foreground, at most every 30 minutes and only when online.
- `navigator.storage.persist()` is requested at startup.
