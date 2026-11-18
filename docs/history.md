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

## 2026-11-17 · Session 3 · Opus 5.5 · How to play guides for six games (branch `claude/playover-missing-tutorials-ca78d7`)
- Added a shared guide component, `src/shell/guide.js` + `guide.css` (`openGuide`): swipeable cards with page dots, Back/Next, Skip, arrow keys and Escape. All cards stack in one grid cell so the box keeps the tallest card's height. Themed per game through `--g-*` variables. Documented in `src/shell/CONTRACT.md`.
- Odd Crown, Pocket Planets, Reef Relay, Everbrook, Patch & Kettle and Lanternfall now use it, replacing the old wall-of-text help (or adding help where there was none). Each guide has 3–5 cards and 66–80 words, with SVG art drawn from the game's own palette and helpers. It shows once on the first new game (a `guideSeen` storage flag) and reopens from the ? button or the menu.
- **Owner's direction:** keep it as short as possible, so players read less and start sooner. Each card has a title of at most 5 words and 1–2 points of about 12 words.
- One subagent per game worked in parallel, and a review agent went over the whole diff. It found no serious bugs. Three nits were fixed: a desktop drag over a button counted as both a swipe and a click; the Odd Crown theme selector depended on CSS load order; Lanternfall skipped the guide for players who had finished an earlier run.
- Every guide fits without scrolling at 390×844, 375×667 and 320×568.
