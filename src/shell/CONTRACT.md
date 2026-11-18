# Game module contract

Each game lives in `src/games/<id>/` and is loaded lazily. `index.js` default-exports:

```js
export default {
  start(ctx) { /* build everything inside ctx.root */ return { dispose() { /* tear down */ } }; },
};
```

`ctx`:
- `root` — a full-screen `<div class="game-root">` (position absolute, `touch-action: none`). Put everything in it.
- `storage` — `get(key, fallback)`, `set(key, value)`, `remove(key)`; JSON, namespaced per game, persistent.
- `audio` — `play(name)` presets: tap, place, coin, hit, explode, error, good, bad, level;
  plus `tone({freq,to,dur,type,vol,delay})`, `noise({dur,vol,freq,delay})` and `isMuted()`.
- `exit()` — return to the main menu (the shell then calls your `dispose()`).
- `setBest(label)` — short string shown on the menu card, e.g. `Best: wave 23`.

Shared helpers:
- `src/shell/stage.js` — `createStage(root)` gives renderer, scene, camera, an HTML overlay `ui`,
  `onFrame(fn(dt, elapsed))`, `onResize(fn(w, h))`, `setCamera(cam)`, `dispose()`.
- `src/shell/rng.js` — `makeRng(seed)` (next, float, int, chance, pick, shuffle, weighted), `randomSeed()`.
- `src/shell/guide.js` — `openGuide(root, { pages, more, className, doneLabel, label, onClose })`: the shared How to play
  cards (swipe, dots, Back/Next, Skip). 3–5 cards, a code-drawn SVG and 1–2 short points each; theme with `--g-*`
  variables on your `className`. Show once on the first new game (a `guideSeen` flag), reopen from help, close in `dispose()`.
  `more` adds an optional "More tips" section (3–6 cards, same rules) behind a link on the last card; open it alone from
  menus with `{ pages: more, label: MORE_LABEL }`.
- `src/shell/shell.css` — CSS variables: `--bg --panel --panel-2 --line --text --muted --accent --good --bad`,
  safe-area insets `--sat --sab --sal --sar`, `--font`.
- `scripts/pup.mjs` — headless Chrome at phone size for play-testing (`openGame({ port, game })`).
- `?game=<id>` in the URL opens a game directly.

Rules:
- Offline at runtime: no network requests, no CDN. Assets (fonts, images, models, sounds) are fine when they are
  bundled: import them from the game's folder or from an npm package so Vite fingerprints and precaches them.
  Only CC0 / OFL / MIT-style licensed assets; list each one in the game's `CREDITS.md`.
- Fonts: preact, htm and several `@fontsource` families are installed. Declare `@font-face` yourself with the
  latin woff2 only (for example `url('@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2')`).
- Target: iPhone Safari standalone PWA, portrait, 375–430 pt wide, touch, hit targets at least 44 pt.
  It must also look right in a desktop browser window (mouse and keyboard).
- Respect safe areas (`.stage-ui` already pads by them). Always provide a visible way back to the menu.
- `.stage-ui` has `pointer-events: none`; set `pointer-events: auto` on interactive HUD elements.
- With pointer capture, hit-test by coordinates (raycast from clientX/clientY), not `event.target`.
- Autosave to `storage` so a run survives the app being closed; offer New game when a save exists.
- Seed all generation with `makeRng`; a new run uses `randomSeed()`.
- `dispose()` must remove every listener, timer and DOM node the game added (and call `stage.dispose()` if used).
- Keep it 60 fps on a phone: use InstancedMesh for repeated things, cap pixel ratio (the stage does, at 1.5x).
  To save battery the stage drops to 30 fps after 2 s without input, so drive animation from `dt`, not frame counts.
- Scope a game's CSS with a unique class prefix; import the CSS from the game's index.js.
- Keep game rules in pure modules (no DOM) with a headless `sim.test.mjs` that plays the game with a bot.
- Only touch files inside your own `src/games/<id>/` folder.
