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

## 2026-11-16 · Niko games merged · Fable 5.2 (`e69fce9`)
- Everbrook (`everbrook`, city builder), Lanternfall (`lanternfall`, mystery visual novel) and Patch & Kettle (`helpdesk`, cozy IT) were finished on `claude/niko-game-collection-2eb773` and merged into `main`. Nine games now ship in the illustrated launcher.
- `npm test` now runs all nine sim suites. Everbrook takes about 18 s.
- Dev vs preview: `npm run preview` serves `dist`, so run `npm run build` after merges or it shows stale games. A dev server holding a port with `--strictPort` (for example one left running from a Codex worktree) blocks `.claude/launch.json` from starting main's server.

## 2026-11-17 · Session 3 · Opus 5.5 · How to play guides for six games (branch `claude/playover-missing-tutorials-ca78d7`)
- Added a shared guide component, `src/shell/guide.js` + `guide.css` (`openGuide`): swipeable cards with page dots, Back/Next, Skip, arrow keys and Escape. All cards stack in one grid cell so the box keeps the tallest card's height. Themed per game through `--g-*` variables. Documented in `src/shell/CONTRACT.md`.
- Odd Crown, Pocket Planets, Reef Relay, Everbrook, Patch & Kettle and Lanternfall now use it, replacing the old wall-of-text help (or adding help where there was none). Each guide has 3–5 cards and 66–80 words, with SVG art drawn from the game's own palette and helpers. It shows once on the first new game (a `guideSeen` storage flag) and reopens from the ? button or the menu.
- **Owner's direction:** keep it as short as possible, so players read less and start sooner. Each card has a title of at most 5 words and 1–2 points of about 12 words.
- One subagent per game worked in parallel, and a review agent went over the whole diff. It found no serious bugs. Three nits were fixed: a desktop drag over a button counted as both a swipe and a click; the Odd Crown theme selector depended on CSS load order; Lanternfall skipped the guide for players who had finished an earlier run.
- Every guide fits without scrolling at 390×844, 375×667 and 320×568.
- **Same day, second round:** Tidewater, Deepvault and Bastion Maze moved off their own 8–9 page guides onto the shared component: 4–5 cards and 79–85 words each, down from roughly 330–400 words. Their old guide code and CSS were deleted. First-run flags (`seenHelp`, `meta.seenHowTo`, `settings.seenHow`) and coach marks were kept, and the coach marks now start after the guide closes. In all three games, opening the guide from the pause menu now returns to the pause menu. Deepvault's input ignores keys pressed inside a dialog. Patch & Kettle's title screen gained a How to play button. All nine games now share one guide style.
- **Third round, More tips:** the owner wanted the content cut from the guides kept as an optional "learn more" layer. `openGuide` gained `more`: a "More tips" section behind a link on the last card, which can also be opened alone. All nine games got 3–6 tip cards written to the same rules (80–120 words), covering the dropped topics. The arcade puzzle games have no menu, so for them the link is the only way in; the other six also have a More tips menu entry. Bastion Maze got back a full Towers reference (every tower with its cost, a one-line tip and tags, built from `data.js`), opened from the title, the pause menu, the build tray and the tower sheet.

## 2026-11-17 · Opus 5.5 · PWA deploy and battery (`claude/playover-pwa-conversion-9dbb76`)
- The app is being renamed Playover and will be hosted on GitHub Pages at `irispepa/playover`. The renaming, copy and icons are being done in a parallel worktree.
- `.github/workflows/deploy.yml`: every push to `main` runs `npm ci`, `npm test` (about 80 s) and `npm run build`, then deploys `dist/`. Pages must use "GitHub Actions" as its source. `base: './'` already works under `/playover/`.
- **Battery (`src/shell/stage.js`):** the 3D games render at up to 60 fps while there is input and for 2 s after, then at 30 fps. The pixel ratio is capped at 1.5 (was 2), and `powerPreference` is now the default (was `high-performance`). A headless check confirmed 30 fps idle, 60 fps active and a 1.5× drawing buffer at DPR 3.
- **Updates:** `registerType: 'prompt'` with no `skipWaiting`/`clientsClaim`. A new version waits while a game is open and is applied, with one reload, on the menu (`applyUpdate` in `src/main.js`; since the Playover Home merge it applies only when `route.kind === 'home'`). The first visit isn't controlled by the service worker until the next load, but offline play works from then on. Checked in headless Chrome by rebuilding under a live page.
- iOS often resumes a suspended home-screen app instead of relaunching it, which skips the load-time update check. So `onRegisteredSW` also calls `reg.update()` on return to the foreground, at most every 30 minutes and only when online.
- `navigator.storage.persist()` is requested at startup.
