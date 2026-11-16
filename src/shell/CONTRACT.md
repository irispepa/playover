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
  plus `tone({freq,to,dur,type,vol,delay})` and `noise({dur,vol,freq,delay})`.
- `exit()` — return to the main menu (the shell then calls your `dispose()`).
- `setBest(label)` — short string shown on the menu card, e.g. `Best: wave 23`.

Shared helpers:
- `src/shell/stage.js` — `createStage(root)` gives renderer, scene, camera, an HTML overlay `ui`,
  `onFrame(fn(dt, elapsed))`, `onResize(fn(w, h))`, `setCamera(cam)`, `dispose()`.
- `src/shell/rng.js` — `makeRng(seed)` (next, float, int, chance, pick, shuffle, weighted), `randomSeed()`.
- `src/shell/shell.css` — CSS variables: `--bg --panel --panel-2 --line --text --muted --accent --good --bad`,
  safe-area insets `--sat --sab --sal --sar`, `--font`.

Rules:
- Offline only: no network requests, no CDN, no external fonts or images. Geometry and textures are made in code.
- Target: iPhone Safari standalone PWA, portrait, 375–430 pt wide. Touch only; hit targets at least 44 pt.
- Respect safe areas (`.stage-ui` already pads by them). Always provide a visible way back to the menu.
- `.stage-ui` has `pointer-events: none`; set `pointer-events: auto` on interactive HUD elements.
- With pointer capture, hit-test by coordinates (raycast from clientX/clientY), not `event.target`.
- Autosave to `storage` so a run survives the app being closed; offer New game when a save exists.
- Seed all generation with `makeRng`; a new run uses `randomSeed()`.
- `dispose()` must remove every listener, timer and DOM node the game added, and call `stage.dispose()`.
- Keep it 60 fps on a phone: use InstancedMesh for repeated things, cap pixel ratio (the stage does), no post-processing.
- Scope a game's CSS with a unique class prefix; import the CSS from the game's index.js.
- Only touch files inside your own `src/games/<id>/` folder.
