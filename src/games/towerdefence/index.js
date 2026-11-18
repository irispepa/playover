// Bastion Maze — real-time maze-building tower defence with a twin-stick hero.
// Glue: game loop, input (tap / pinch / pan / joysticks / keys), saving, sound, records.
import './style.css';
import { createStage } from '../../shell/stage.js';
import { randomSeed, hashSeed } from '../../shell/rng.js';
import { DT, TOWERS, ABILITIES, ENEMIES, DIFFICULTY, ARCHETYPES, HERO, SAVE_VERSION } from './data.js';
import {
  newGame, step, canBuild, build, upgrade, sell, setPriority, previewPaths, callWave, useAbility, abilityReady, pickCard,
  serialize, deserialize, setHeroInput, deployHero, heroDash, heroUlt, cycleWeapon, spendPoint, heroStats, heroWeapons,
} from './sim.js';
import { createRenderer } from './render.js';
import { createHud } from './ui.js';

const SFX = {
  shoot: [70, (a) => a.tone({ freq: 880, to: 600, dur: 0.04, type: 'triangle', vol: 0.035 })],
  hit: [60, (a) => a.noise({ dur: 0.04, vol: 0.05, freq: 1800 })],
  boom: [110, (a) => { a.noise({ dur: 0.22, vol: 0.12, freq: 420 }); a.tone({ freq: 110, to: 45, dur: 0.2, type: 'sine', vol: 0.1 }); }],
  zap: [90, (a) => a.tone({ freq: 1400, to: 260, dur: 0.08, type: 'sawtooth', vol: 0.04 })],
  kill: [70, (a) => a.tone({ freq: 520, to: 880, dur: 0.06, type: 'square', vol: 0.025 })],
  leak: [300, (a) => a.play('error')],
  freeze: [220, (a) => a.tone({ freq: 1600, to: 500, dur: 0.25, type: 'triangle', vol: 0.08 })],
  snipe: [120, (a) => { a.noise({ dur: 0.08, vol: 0.12, freq: 3000 }); a.tone({ freq: 300, to: 80, dur: 0.12, type: 'square', vol: 0.05 }); }],
  flame: [160, (a) => a.noise({ dur: 0.16, vol: 0.05, freq: 600 })],
  jam: [200, (a) => a.tone({ freq: 220, to: 160, dur: 0.15, type: 'square', vol: 0.06 })],
  hshot: [55, (a) => a.tone({ freq: 1500, to: 900, dur: 0.045, type: 'square', vol: 0.03 })],
  rail: [140, (a) => a.tone({ freq: 2200, to: 180, dur: 0.16, type: 'sawtooth', vol: 0.06 })],
  dash: [150, (a) => a.noise({ dur: 0.12, vol: 0.08, freq: 2400 })],
  bad: [500, (a) => a.play('bad')],
  mortar: [180, (a) => a.tone({ freq: 140, to: 70, dur: 0.18, type: 'sine', vol: 0.1 })],
};
const STICK_R = 56;

export default {
  start(ctx) {
    const stage = createStage(ctx.root, { background: 0x0e1420 });
    const stored = ctx.storage.get('settings', {}) || {};
    // seenCoach: the first-wave pointers. Players who already saw the guide before the coach existed skip it.
    const settings = Object.assign({ autoWaves: true, shake: true, paths: true, seenHow: false, seenCoach: !!stored.seenHow, last: {} }, stored);
    const saveSettings = () => ctx.storage.set('settings', settings);
    const records = Object.assign({}, ctx.storage.get('records', {}) || {});
    const renderer = createRenderer(stage, { shake: settings.shake });
    const lastSfx = {};
    let s = null;           // sim state
    let run = null;         // { mode, difficulty, archetype, seed, seedText, label }
    let disposed = false;
    const c = {             // controller state the HUD reads
      speed: 1, heroMode: false, armed: null, selTile: -1, selTower: null, preview: null, targeting: null,
      hintSeen: false, settings, runLabel: '', get s() { return s; },
    };
    let acc = 0, saveTimer = 0, paused = false, overShown = false;
    const timers = [];

    // ---------------------------------------------------------------- HUD handlers
    const hud = createHud(stage.ui, {
      pause: () => openPause(),
      resume: () => { hud.closeModal(); paused = false; },
      setSpeed: (v) => { c.speed = v; ctx.audio.play('tap'); },
      callWave: () => {
        if (!s) return;
        const b = callWave(s);
        if (s.wave >= 1) coachDone();
        ctx.audio.play(b > 0 ? 'coin' : 'tap');
        if (b > 0) hud.toast(`Called early: +${b} gold`, 'good');
      },
      ability: (id) => {
        if (!s) return;
        if (!abilityReady(s, id)) { ctx.audio.play('error'); return; }
        if (ABILITIES[id].targeted) { c.targeting = c.targeting === id ? null : id; ctx.audio.play('tap'); return; }
        if (useAbility(s, id)) { ctx.audio.play(id === 'rush' ? 'coin' : 'good'); }
      },
      toggleHero: () => toggleHero(),
      dash: () => { if (s && heroDash(s)) ctx.audio.tone({ freq: 500, to: 1200, dur: 0.12, type: 'triangle', vol: 0.08 }); },
      ult: () => { if (s && heroUlt(s)) ctx.audio.play('explode'); else ctx.audio.play('error'); },
      swap: () => { if (!s) return; const w = cycleWeapon(s); ctx.audio.play('tap'); hud.toast(heroWeaponName(w), 'hero'); },
      openHeroSheet: () => { if (!s || !s.hero.deployed) return; clearSelection(); hud.openHeroSheet(s); },
      spend: (k) => { if (s && spendPoint(s, k)) ctx.audio.play('coin'); },
      toggleAutoSpend: () => { if (s) { s.hero.autoSpend = !s.hero.autoSpend; if (s.hero.autoSpend) s.heroAutoSpend(s); } },
      equip: (w) => { if (s && heroWeapons(s).includes(w)) { s.hero.weapon = w; ctx.audio.play('tap'); } },
      arm: (type) => { c.armed = c.armed === type ? null : type; c.targeting = null; hud.closeSheet(); c.selTower = null; refreshPreview(); ctx.audio.play('tap'); },
      confirm: () => confirmBuild(),
      cancel: () => { clearSelection(); c.armed = null; c.targeting = null; refreshPreview(); },
      closeSheet: () => clearSelection(),
      upgrade: (branch) => {
        if (!s || !c.selTower) return;
        const r = upgrade(s, c.selTower, branch);
        if (r.ok) { ctx.audio.play('level'); showRange(); } else { ctx.audio.play('error'); hud.toast(r.reason, 'bad'); }
      },
      sell: () => {
        if (!s || !c.selTower) return;
        const v = sell(s, c.selTower);
        ctx.audio.play('coin');
        hud.toast(`Sold for ${v} gold`);
        clearSelection();
        updatePaths();
      },
      setPrio: (p) => { if (s && c.selTower) { setPriority(s, c.selTower, p); ctx.audio.play('tap'); } },
      pickCard: (i) => {
        if (!s) return;
        const id = pickCard(s, i);
        hud.closeModal();
        ctx.audio.play('good');
        if (id) save();
      },
      toggleSetting: (k) => {
        if (k === 'autoWaves') { s.autoWaves = !s.autoWaves; settings.autoWaves = s.autoWaves; if (s.autoWaves && !s.activeWaves.length && s.timer <= 0 && !s.waiting) s.timer = s.timerMax; }
        else settings[k] = !settings[k];
        renderer.setShakeEnabled(settings.shake);
        renderer.setShowPaths(settings.paths);
        saveSettings();
      },
      restart: () => { hud.closeModal(); startRun({ ...run, seed: run.mode === 'daily' || run.mode === 'seed' ? run.seed : randomSeed() }); },
      exitToMenu: () => { save(); hud.closeModal(); s = null; showTitle(); },
      toTitle: () => { hud.closeModal(); s = null; showTitle(); },
      coachDone: () => coachDone(),
      showWaveInfo: () => { if (!s) return; paused = true; hud.showWaveInfo(s, () => { paused = false; }); },
      showTowers: () => { if (!s) return; ctx.audio.play('tap'); hud.showTowers(); }, // from the tray or a tower sheet; the open modal pauses the run
    }, ctx.root);
    renderer.setShowPaths(settings.paths);

    function coachDone() { if (!settings.seenCoach) { settings.seenCoach = true; saveSettings(); } }
    const heroWeaponName = (w) => (w ? w[0].toUpperCase() + w.slice(1) : '');

    // ---------------------------------------------------------------- runs
    function today() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    function recordKey(r) { return r.mode === 'op' ? 'op' : r.mode === 'daily' ? 'daily' : r.mode === 'seed' ? 'seed' : `std-${r.difficulty}`; }
    const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    // Returns HTML: the HUD renders it with innerHTML, so the player's seed text is escaped.
    function runLabel(r, st) {
      const m = r.mode === 'op' ? 'Overpowered' : r.mode === 'daily' ? `Daily ${r.date || ''}` : r.mode === 'seed' ? `Seed "${esc(r.seedText)}"` : DIFFICULTY[r.difficulty].name;
      return `${m} · ${ARCHETYPES[st ? st.archetype : r.archetype] ? ARCHETYPES[st ? st.archetype : r.archetype].name : 'Random'}`;
    }
    function bestLabel() {
      const std = Math.max(records['std-easy'] || 0, records['std-normal'] || 0, records['std-hard'] || 0, records.seed || 0);
      let l = std ? `Best: wave ${std}` : '';
      if (records.op) l += (l ? ' · ' : 'Best: ') + `OP wave ${records.op}`;
      return l; // empty until a run has been recorded, so the menu card shows nothing
    }
    function dailyRecord() { return records.dailyDate === today() ? records.daily : 0; }

    function startRun(o) {
      const r = { mode: o.mode, difficulty: o.mode === 'std' ? o.difficulty : 'normal', archetype: o.archetype || 'random', seedText: o.seedText || '', seed: o.seed };
      if (r.mode === 'daily') { r.date = today(); r.seed = hashSeed('daily:' + r.date); r.archetype = 'random'; }
      else if (r.mode === 'seed') {
        if (!r.seedText) r.seedText = String(randomSeed() % 100000);
        r.seed = /^\d+$/.test(r.seedText) ? Number(r.seedText) >>> 0 : hashSeed(r.seedText);
      } else if (r.seed == null) r.seed = randomSeed();
      settings.last = { mode: r.mode, difficulty: o.difficulty || 'normal', archetype: o.archetype || 'random', seedText: r.seedText };
      saveSettings();
      run = r;
      s = newGame({ seed: r.seed, mode: r.mode, difficulty: r.difficulty, archetype: r.archetype });
      s.autoWaves = settings.autoWaves;
      afterLoad();
      save();
      if (!settings.seenHow) { settings.seenHow = true; saveSettings(); paused = true; hud.showHow(() => { paused = false; }, { doneLabel: 'Start building' }); }
    }
    function afterLoad() {
      if (import.meta.env.DEV) window.__bm = { get s() { return s; }, canBuild, build, upgrade, callWave }; // dev-only handle for automated play tests
      c.heroMode = false; c.armed = null; c.selTile = -1; c.selTower = null; c.targeting = null; c.speed = 1;
      paused = false; overShown = false; acc = 0;
      c.runLabel = runLabel(run, s);
      hud.closeSheet(); hud.closeModal();
      renderer.setMap(s);
      renderer.resetView();
      renderer.setFollow(false);
      layout();
      updatePaths();
      refreshPreview();
    }
    function continueRun() {
      const o = ctx.storage.get('save', null);
      const st = o && o.v === SAVE_VERSION ? deserialize(o.state) : null;
      if (!st || !o.run) { ctx.storage.remove('save'); hud.toast('That save could not be loaded', 'bad'); showTitle(); return; }
      run = o.run;
      s = st;
      afterLoad();
      paused = true;
      openPause();
    }
    function save() {
      if (!s || s.over || !run) return;
      try { ctx.storage.set('save', { v: SAVE_VERSION, run, state: serialize(s) }); } catch (e) { /* storage full */ }
    }
    function savedLabel() {
      const o = ctx.storage.get('save', null);
      if (!o || o.v !== SAVE_VERSION || !o.state || !o.run) return null;
      return `Wave ${o.state.wave} · ${runLabel(o.run, o.state)}`;
    }
    function showTitle() {
      s = null;
      clearSelection();
      hud.showTitle({
        save: savedLabel(), records: { ...records, daily: dailyRecord() }, last: settings.last || {}, today: today(),
        onContinue: () => continueRun(),
        onStart: (o) => startRun(o),
        onExit: () => ctx.exit(),
      });
    }
    function gameOver() {
      if (overShown) return;
      overShown = true;
      ctx.storage.remove('save');
      const k = recordKey(run);
      let prev = k === 'daily' ? dailyRecord() : records[k] || 0;
      const record = s.wave > prev;
      if (record) {
        if (k === 'daily') { records.daily = s.wave; records.dailyDate = today(); } else records[k] = s.wave;
        ctx.storage.set('records', records);
      }
      ctx.setBest(bestLabel());
      ctx.audio.play('bad');
      c.heroMode = false;
      hud.showGameOver(s, { runLabel: c.runLabel, record, best: Math.max(prev, s.wave) });
    }
    function openPause() {
      if (!s || s.over) return;
      paused = true;
      save();
      hud.showPause(c);
    }

    // ---------------------------------------------------------------- selection & building
    function clearSelection() {
      c.selTile = -1; c.selTower = null; c.preview = null;
      hud.closeSheet();
      renderer.setSelection(-1); renderer.setRange(0, 0, 0); renderer.setGhost(null, -1); renderer.setPreview(null);
    }
    function updatePaths() { if (s) renderer.setPaths(previewPaths(s)); }
    let previewVer = '';
    function refreshPreview() {
      if (!s) return;
      if (c.selTile >= 0 && c.armed && !c.selTower) {
        const r = canBuild(s, c.selTile, c.armed);
        c.preview = r;
        const ok = r.pathOk;
        renderer.setSelection(c.selTile, ok ? (r.ok ? 0x4cc9a0 : 0xf0b44c) : 0xe25c5c);
        renderer.setGhost(c.armed, c.selTile, ok);
        const d = TOWERS[c.armed];
        const tx = c.selTile % s.map.w + 0.5, ty = ((c.selTile / s.map.w) | 0) + 0.5;
        const rr = d.levels[0].range || (d.kind === 'support' ? d.levels[0].range : 0);
        renderer.setRange(tx, ty, rr * s.mods.range * s.modeRange * (s.map.tiles[c.selTile] === 4 ? 1 + 0.2 * s.mods.terrain : 1), d.minRange || 0, ok ? 0xffffff : 0xff8080);
        if (r.reason === 'An enemy is in the way' || r.reason.startsWith('Cannot') || r.reason === 'Already built here' || r.reason === 'The hero is standing there') renderer.setPreview(null);
        else renderer.setPreview(ok ? previewPaths(s, c.selTile) : previewPaths(s), ok);
      } else if (c.selTile >= 0 && !c.selTower) {
        c.preview = null;
        renderer.setSelection(c.selTile, 0xffffff);
        renderer.setGhost(null, -1); renderer.setRange(0, 0, 0); renderer.setPreview(null);
      } else if (!c.selTower) {
        c.preview = null;
        renderer.setGhost(null, -1); renderer.setPreview(null);
        if (c.selTile < 0) renderer.setSelection(-1);
      }
      previewVer = `${s.fieldVer}:${s.towerVer}:${Math.floor(s.gold)}`;
    }
    function showRange() {
      const t = c.selTower;
      if (!t) return;
      const r = t.st.detect && t.st.kind !== 'bolt' ? Math.max(t.st.range, t.st.detect) : t.st.range;
      renderer.setRange(t.x, t.y, r || 0.7, t.st.minRange || 0, 0xffffff);
      renderer.setSelection(t.tile, 0xf0b44c);
    }
    function confirmBuild() {
      if (!s || c.selTile < 0 || !c.armed) return;
      const r = build(s, c.selTile, c.armed);
      if (r.ok) {
        ctx.audio.play('place');
        c.selTile = -1;
        renderer.setSelection(-1);
        updatePaths();
        refreshPreview();
      } else { ctx.audio.play('error'); hud.toast(r.reason, 'bad'); }
    }
    function tapTile(tile) {
      if (!s || tile < 0) { clearSelection(); return; }
      const t = s.towerGrid[tile];
      if (t) {
        c.selTile = -1; c.selTower = t; c.preview = null;
        renderer.setGhost(null, -1); renderer.setPreview(null);
        hud.openTowerSheet(s, t);
        showRange();
        ctx.audio.play('tap');
        return;
      }
      hud.closeSheet(); c.selTower = null;
      c.selTile = c.selTile === tile && !c.armed ? -1 : tile;
      refreshPreview();
      ctx.audio.play('tap');
    }
    function toggleHero() {
      if (!s) return;
      const h = s.hero;
      if (!h.unlocked) { hud.toast(`The hero joins at wave ${HERO.unlockWave}`); return; }
      if (!h.deployed) { deployHero(s); c.heroMode = true; ctx.audio.play('level'); hud.toast('Hero deployed. Left thumb moves, right thumb aims.', 'hero'); }
      else c.heroMode = !c.heroMode;
      if (c.heroMode) { clearSelection(); c.armed = null; c.targeting = null; }
      renderer.setFollow(c.heroMode);
      if (!c.heroMode) { sticks.L = null; sticks.R = null; hud.setStick('L', false); hud.setStick('R', false); }
      ctx.audio.play('tap');
    }

    // ---------------------------------------------------------------- input
    const canvas = stage.canvas;
    const pointers = new Map();
    const sticks = { L: null, R: null };
    let pinch = null;
    const keys = new Set();
    function rootRect() { return ctx.root.getBoundingClientRect(); }
    // offset of the safe-area-inset HUD layer inside the game root (CSS px)
    let offCache = null;
    function bmOff() {
      if (!offCache) { const r = rootRect(), b = hud.rect(); offCache = { x: b.left - r.left, y: b.top - r.top, b: r.bottom - b.bottom, left: b.left, top: b.top }; }
      return offCache;
    }
    const safeTop = () => bmOff().y, safeLeft = () => bmOff().x;

    function onDown(e) {
      if (!s || hud.modal || hud.guideOpen) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: false, role: 'tap' };
      pointers.set(e.pointerId, p);
      if (c.targeting) { p.role = 'target'; return; }
      if (c.heroMode) {
        const r = rootRect();
        const half = r.left + r.width / 2;
        if (e.clientX < half && !sticks.L) { sticks.L = p; p.role = 'L'; }
        else if (e.clientX >= half && !sticks.R) { sticks.R = p; p.role = 'R'; }
        else p.role = 'none';
        if (p.role === 'L' || p.role === 'R') { c.hintSeen = true; drawStick(p); }
        return;
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z: 1 };
        for (const q of pointers.values()) q.role = 'pinch';
      }
    }
    function drawStick(p) {
      const o = bmOff();
      let dx = p.x - p.x0, dy = p.y - p.y0;
      const m = Math.hypot(dx, dy);
      if (m > STICK_R) { dx = dx / m * STICK_R; dy = dy / m * STICK_R; }
      hud.setStick(p.role, true, p.x0 - o.left, p.y0 - o.top, dx, dy);
    }
    function onMove(e) {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const px = p.x, py = p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(p.x - p.x0, p.y - p.y0) > 10) p.moved = true;
      if (p.role === 'L' || p.role === 'R') { drawStick(p); return; }
      if (p.role === 'pinch' && pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.d0 > 10) { renderer.zoomBy(d / pinch.d0); pinch.d0 = d; }
        renderer.panBy((p.x - px) / 2, (p.y - py) / 2);
        return;
      }
      if (p.role === 'tap' && p.moved && renderer.zoom > 1.01) { p.role = 'pan'; }
      if (p.role === 'pan') renderer.panBy(p.x - px, p.y - py);
    }
    function onUp(e) {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      pointers.delete(e.pointerId);
      if (p === sticks.L) { sticks.L = null; hud.setStick('L', false); }
      if (p === sticks.R) { sticks.R = null; hud.setStick('R', false); }
      if (pointers.size < 2) pinch = null;
      if (e.type === 'pointercancel') return;
      const quick = !p.moved && performance.now() - p.t0 < 600;
      if (p.role === 'target' && quick && s) {
        const w = renderer.pickWorld(e.clientX, e.clientY);
        const inside = w && w.x >= 0 && w.y >= 0 && w.x <= s.map.w && w.y <= s.map.h;
        if (inside && useAbility(s, c.targeting, w.x, w.y)) { ctx.audio.play('explode'); c.targeting = null; }
        else { ctx.audio.play('error'); if (!inside) c.targeting = null; }
        return;
      }
      if (p.role === 'tap' && quick) tapTile(renderer.pickTile(e.clientX, e.clientY));
    }
    function onWheel(e) { e.preventDefault(); if (!c.heroMode) renderer.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); }
    function onKey(e) {
      if (!s || e.target && e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        if (hud.guideOpen) return; // the guide pages with the arrows and closes with Escape itself
        keys.add(k);
        if (k === ' ' && c.heroMode) heroDash(s);
        else if (k === 'e' && c.heroMode) heroUlt(s);
        else if (k === 'q' && c.heroMode) cycleWeapon(s);
        else if (k === 'h') toggleHero();
        else if (k === 'escape' || k === 'p') { if (hud.modal) { if (hud.back()) { /* went back to the menu underneath */ } else if (!s.pendingCards && !s.over) { hud.closeModal(); paused = false; } } else openPause(); }
        else if (k === '0') c.speed = 0; else if (k === '1') c.speed = 1; else if (k === '2') c.speed = 2; else if (k === '3' || k === '4') c.speed = 4;
      } else keys.delete(k);
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    const onVis = () => { if (document.hidden) { save(); } };
    document.addEventListener('visibilitychange', onVis);
    const onHide = () => save();
    window.addEventListener('pagehide', onHide);

    function heroInput() {
      let mx = 0, my = 0, ax = 0, ay = 0, aim = false;
      if (sticks.L) { mx = (sticks.L.x - sticks.L.x0) / STICK_R; my = (sticks.L.y - sticks.L.y0) / STICK_R; }
      if (sticks.R) {
        ax = (sticks.R.x - sticks.R.x0) / STICK_R; ay = (sticks.R.y - sticks.R.y0) / STICK_R;
        aim = Math.hypot(ax, ay) > 0.25;
      }
      if (keys.has('w') || keys.has('arrowup')) my -= 1;
      if (keys.has('s') || keys.has('arrowdown')) my += 1;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      const m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }
      // the camera has no yaw, but its tilt shortens screen-vertical motion; compensate slightly
      setHeroInput(s, mx, my * 1.0, ax, ay, aim, c.heroMode);
    }

    // ---------------------------------------------------------------- frame loop
    const scr = { x: 0, y: 0, vis: true };
    let lastFloat = 0;
    const hooks = {
      leak: () => hud.hurtFlash(),
      float: (x, y, text) => {
        const now = performance.now();
        if (x >= 0 && now - lastFloat < 90) return;
        if (x >= 0) lastFloat = now;
        if (x < 0) { const r = stage.size; hud.float(r.width / 2 - safeLeft(), r.height * 0.32, text, true); return; }
        renderer.worldToScreen(x, y, 1.0, scr);
        if (scr.vis) hud.float(scr.x - safeLeft(), scr.y - safeTop(), text, false);
      },
    };
    function handleEvents() {
      const ev = s.events;
      for (let i = 0; i < ev.length; i++) {
        switch (ev[i]) {
          case 'wave': coachDone(); break;
          case 'boss': {
            const g = s.spawns.find((x) => ENEMIES[x.type].boss);
            hud.toast(`Boss wave ${s.wave}: ${g ? ENEMIES[g.type].name : 'boss'}`, 'boss');
            ctx.audio.play('bad');
            break;
          }
          case 'cleared': save(); ctx.audio.play('good'); break;
          case 'cards': paused = false; hud.closeSheet(); c.selTower = null; hud.showCards(s); ctx.audio.play('coin'); break;
          case 'over': break;
          case 'heroUnlock': hud.toast('A hero has arrived! Tap Deploy on the left.', 'hero'); ctx.audio.play('level'); break;
          case 'herolevel': hud.toast(`Hero level ${s.hero.level}${s.hero.autoSpend ? '' : ': tap the hero card to spend points'}`, 'hero'); ctx.audio.play('level'); break;
          case 'herodown': hud.toast('Hero down. Back at the core soon.', 'bad'); break;
          case 'herorespawn': break;
        }
      }
      ev.length = 0;
    }
    function playSfx(now) {
      const sf = s.sfx;
      for (const k in sf) {
        if (sf[k] > 0) {
          const d = SFX[k];
          if (d && (!lastSfx[k] || now - lastSfx[k] >= d[0])) { lastSfx[k] = now; try { d[1](ctx.audio); } catch (_) { /* ignore */ } }
          sf[k] = 0;
        }
      }
    }
    let lastLives = -1;
    stage.onFrame((dt, elapsed) => {
      if (disposed) return;
      if (!s) return;
      const running = !paused && c.speed > 0 && !s.pendingCards && !s.over && !hud.modal && !hud.guideOpen;
      if (running) {
        heroInput();
        acc += dt * c.speed;
        let n = 0;
        while (acc >= DT && n < 10) { step(s, DT); acc -= DT; n++; if (s.pendingCards || s.over) break; }
        if (n >= 10) acc = 0;
        saveTimer += dt;
        if (saveTimer > 30) { saveTimer = 0; save(); }
      } else if (c.heroMode) heroInput();
      if (s.lives < lastLives && lastLives >= 0) { /* flash handled by leak hook */ }
      lastLives = s.lives;
      handleEvents();
      playSfx(performance.now());
      if (s.over) gameOver();
      // refresh build preview when the world changes under it
      if (c.selTile >= 0 && c.armed && previewVer !== `${s.fieldVer}:${s.towerVer}:${Math.floor(s.gold)}`) refreshPreview();
      else if (c.selTile >= 0 && c.armed && (s.tick & 15) === 0) refreshPreview();
      if (c.selTower && !s.towers.includes(c.selTower)) clearSelection();
      if (s.fieldVer !== pathVer) { pathVer = s.fieldVer; updatePaths(); }
      if (c.targeting) {
        const id = c.targeting;
        if (!abilityReady(s, id)) c.targeting = null;
      }
      renderer.sync(s, dt, elapsed, hooks);
      hud.update(s, c, dt);
    });
    let pathVer = -1;

    function layout() {
      requestAnimationFrame(() => {
        if (disposed) return;
        offCache = null;
        const ins = hud.insets();
        renderer.setInsets(ins.top + safeTop(), Math.max(ins.bottom, 150) + bmOff().b + 4);
      });
    }
    const offResize = stage.onResize(() => layout());

    ctx.setBest(bestLabel());
    showTitle();

    return {
      dispose() {
        disposed = true;
        save();
        offResize();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pagehide', onHide);
        for (const t of timers) clearTimeout(t);
        hud.dispose();
        renderer.dispose();
        stage.dispose();
      },
    };
  },
};
