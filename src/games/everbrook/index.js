// Everbrook: a peaceful town through six ages. Wires the pure rules to the 3D valley and the HUD.
import './style.css';
import { createStage } from '../../shell/stage.js';
import { randomSeed } from '../../shell/rng.js';
import { B, ERAS, SERVICES, SEASONS, DISC_BY_ID, RES, HOME_LEVELS } from './data.js';
import { N, T, idx, inb } from './gen.js';
import * as S from './sim.js';
import { createView } from './render.js';
import { createInput } from './input.js';
import { createUI } from './ui.js';
import { ICON } from './icons.js';
import { thumbnail, disposeThumbs, modelKey } from './models.js';

const RATE = [0, 1.6, 5, 14];          // days per second at each speed

export default {
  start(ctx) {
    const stage = createStage(ctx.root, { background: 0xc4e8f6 });
    const view = createView(stage);
    const store = ctx.storage;
    let acc = 0, hudClock = 0, saveClock = 0, dirty = false, strokeWarned = false;

    const g = {
      s: null, live: false, speed: 1, mode: 'browse', type: null, ghost: null, hover: null, hold: null, sel: null, overlay: null, touch: matchMedia('(pointer: coarse)').matches,
      previewHomes: 0, selHomes: 0, view, seen: new Set(store.get('seen', [])),
      tap: () => ctx.audio.play('tap'),
      sound: (n) => ctx.audio.play(n),
      thumb: (key) => thumbnail(key, view.material),
      keyOf: (b) => modelKey(b),
      exit: () => { save(); ctx.exit(); },
    };
    const ui = createUI(stage, g);

    // ---------- persistence ----------
    function save() {
      if (!g.live || !g.s) return;
      store.set('save', S.toSave(g.s));
      store.set('seen', [...g.seen]);
      const s = g.s;
      const best = store.get('best', 0), now = S.legacy(s);
      if (now > best) store.set('best', now);
      ctx.setBest(s.done ? `Chronicle complete · legacy ${Math.max(best, now)}` : `${ERAS[s.era].name} · ${s.d.pop} residents`);
      dirty = false;
    }
    const saveLine = (s) => `${ERAS[s.era].name} · year ${S.year(s)} · ${s.d.pop} residents`;

    function enter(s) {
      g.s = s; g.live = true; g.mode = 'browse'; g.type = null; g.ghost = null; g.hover = null; g.hold = null; g.sel = null; g.overlay = null; acc = 0;
      view.setGhost(null); view.setSelection(null); view.setOverlay(null); view.setFits(null);
      view.controls.snapYaw();
      ui.setCat('homes'); ui.accent(); ui.rebuildBar(); ui.hud();
    }
    g.resume = () => enter(g.s);
    g.newGame = (keepPreview) => {
      const s = keepPreview && g.s && g.s.day === 0 && !g.s.b.length ? g.s : S.newGame(randomSeed());
      if (s !== g.s) view.setState(s);
      g.seen = new Set();
      enter(s);
      view.controls.focus(s.m.start.x, s.m.start.y, 15);
      save();
      ui.openEra(0);
    };
    g.setSpeed = (n) => { g.speed = n; };

    // ---------- overlays ----------
    // Tiles a farmstead tends (the same square neighbourhood the rules use).
    function farmReach() {
      const s = g.s, mask = new Uint8Array(N * N);
      for (const b of s.b) {
        const f = B[b.type].farm;
        if (!f) continue;
        for (let yy = b.y - f.r; yy <= b.y + f.r; yy++) for (let xx = b.x - f.r; xx <= b.x + f.r; xx++) if (inb(xx, yy)) mask[idx(xx, yy)] = 1;
      }
      return mask;
    }
    function homesIn(mask) { let n = 0; for (const b of g.s.b) if (b.type === 'home' && mask[idx(b.x, b.y)]) n++; return n; }
    function applyOverlay() {
      const s = g.s;
      const def = g.type && B[g.type];
      if (def && def.service) {
        const mask = Uint8Array.from(s.d.cover[def.service.type]);
        if (g.ghost && S.canPlace(s, g.type, g.ghost.x, g.ghost.y, { free: true }).ok) {
          const mine = S.serviceTiles(s, g.ghost.x, g.ghost.y, def.size, def.service);
          g.previewHomes = homesIn(mine);
          for (let i = 0; i < N * N; i++) if (mine[i]) mask[i] = 1;
        }
        view.setOverlay(mask, SERVICES[def.service.type].color, { markHomes: true });
      } else if (g.type === 'field') view.setOverlay(farmReach(), 0xe8c55a);
      else if (g.sel && B[g.sel.type].service) {
        const d = B[g.sel.type];
        const mine = S.serviceTiles(s, g.sel.x, g.sel.y, d.size, d.service);
        g.selHomes = homesIn(mine);
        view.setOverlay(mine, SERVICES[d.service.type].color);
      } else if (g.overlay) view.setOverlay(s.d.cover[g.overlay], SERVICES[g.overlay].color, { markHomes: true });
      else view.setOverlay(null);
    }
    g.setOverlay = (k) => { g.overlay = k; applyOverlay(); if (k) ui.toast(`Showing ${SERVICES[k].name.toLowerCase()}. Red pins mark homes out of reach.`); };

    // ---------- building ----------
    // Origin of a size-s footprint centred on the pointer: even sizes centre on the nearest grid corner.
    // Clamped to the map so edge hovers stay on it (and the touch same-origin check stays stable).
    const clampO = (v, sz) => Math.max(0, Math.min(N - sz, v));
    const origin = (t, type) => { const sz = B[type].size; return { x: clampO(Math.round(t.fx - sz / 2), sz), y: clampO(Math.round(t.fy - sz / 2), sz) }; };
    const same = (a, b) => (!a && !b) || (!!a && !!b && a.x === b.x && a.y === b.y);
    // The ghost in place mode, the hovered tile in paint mode. Hidden over the spot just built until the pointer moves on.
    let ghostOk = null;          // last canPlace result shown for the ghost, to catch resources arriving
    function showGhost() {
      const o = g.mode === 'place' ? g.ghost : g.mode === 'paint' ? g.hover : null;
      ghostOk = g.mode === 'place' && o ? S.canPlace(g.s, g.type, o.x, o.y).ok : null;
      if (!o || same(o, g.hold)) view.setGhost(null); else view.setGhost(g.type, o.x, o.y);
    }
    const refreshFits = () => view.setFits(g.mode === 'place' ? g.type : null);
    g.selectType = (type) => {
      ui.closePop();
      g.type = type; g.ghost = null; g.hover = null; g.hold = null; g.sel = null; view.setSelection(null);
      g.mode = !type ? 'browse' : type === 'clear' || B[type].tile ? 'paint' : 'place';
      if (type && type !== 'clear' && !g.seen.has(type)) { g.seen.add(type); }
      showGhost(); applyOverlay(); refreshFits(); ui.refreshBottom();
    };
    // Paint strokes batch their map refresh: at most once per frame, flushed on the next frame or at stroke end.
    let pending = false, pendingTrees = false;
    function flushPaint() { if (!pending) return; const trees = pendingTrees; pending = pendingTrees = false; afterChange({ trees }); }
    function afterChange({ trees = true } = {}) {
      view.refresh({ trees }); dirty = true; applyOverlay(); refreshFits(); ui.hud();
    }
    function tryPlace(o, fromMouse) {
      const s = g.s, type = g.type;
      const chk = S.canPlace(s, type, o.x, o.y);
      if (!chk.ok) { ctx.audio.play('error'); ui.toast(chk.why); return false; }
      const made = S.place(s, type, o.x, o.y);
      if (!made) return false;
      ctx.audio.play('place');
      const def = B[type];
      if (def.wonder) { g.selectType(null); afterChange(); g.select(made); ui.toast(`The ${def.name} is begun. Tap it to bring materials.`, 'good'); return true; }
      g.ghost = null; g.hold = fromMouse ? { x: o.x, y: o.y } : null;
      afterChange(); showGhost(); ui.rebuildBar();
      return true;
    }
    g.confirmPlace = () => { if (g.ghost) tryPlace(g.ghost, false); };
    g.select = (b) => {
      ui.closePop();
      g.sel = b; view.setSelection(b);
      if (b && g.type) { g.type = null; g.mode = 'browse'; g.ghost = g.hover = g.hold = null; view.setGhost(null); view.setFits(null); }
      applyOverlay(); ui.refreshBottom();
    };
    g.removeSel = () => {
      const b = g.sel;
      if (!b) return;
      S.removeAt(g.s, b.x, b.y);
      ctx.audio.play('explode');
      view.puffAt(b.x, b.y, 0xd8c7a4);
      g.select(null); afterChange(); ui.rebuildBar();
    };
    g.upgrade = (type) => {
      if (!S.upgrade(g.s, g.sel, type)) { ctx.audio.play('error'); return; }
      ctx.audio.play('good'); g.seen.add(type);
      afterChange({ trees: false }); ui.rebuildBar(); g.select(g.sel);
    };
    g.contribute = () => {
      const r = S.contribute(g.s);
      if (!r) { ctx.audio.play('error'); return; }
      afterChange({ trees: false });
      if (r.complete) { ctx.audio.play('level'); view.celebrate(r.building); ui.toast(`The ${B[r.building.type].name} is complete!`, 'good'); }
      else ctx.audio.play('good');
      g.select(g.sel);
    };
    g.discover = (id) => {
      if (!S.discover(g.s, id)) return;
      ctx.audio.play('level');
      ui.toast(`${ICON.knowledge} Discovered ${DISC_BY_ID[id].name}`, 'good');
      dirty = true; ui.rebuildBar();
    };
    g.trade = (k, amt) => { const n = S.trade(g.s, k, amt); if (n) { ctx.audio.play('coin'); dirty = true; } else ctx.audio.play('error'); return n; };
    g.festival = (id, name) => {
      const text = S.holdFestival(g.s, id);
      if (text == null) return;
      ctx.audio.play('level');
      const spot = g.s.b.find((b) => B[b.type].wonder) || g.s.b.find((b) => B[b.type].service?.type === 'faith') || g.s.b[0];
      if (spot) view.celebrate(spot);
      ui.toast(`${ICON.culture} ${name}: ${text}`, 'good');
      dirty = true; ui.hud();
    };
    g.resolveEvent = (i) => {
      const text = S.resolveEvent(g.s, i);
      if (text == null) return;
      ctx.audio.play('good');
      if (text) ui.toast(text, 'good');
      dirty = true; ui.hud();
    };

    // ---------- input ----------
    const input = createInput(stage.canvas, view, {
      paintMode: () => g.live && g.mode === 'paint' && !ui.blocking(),
      stepCost: (x, y) => { if (g.type === 'clear') return 0; if (!inb(x, y)) return 2; const t = g.s.m.terr[idx(x, y)]; return t === T.HILL ? 2 : t === T.WATER ? 1 : 0; },
      onPaint(t) {
        if (g.mode !== 'paint') return;
        const s = g.s, i = idx(t.x, t.y);
        if (g.type === 'clear') {
          if (!s.road[i] && !s.field[i]) return;
          S.removeAt(s, t.x, t.y); ctx.audio.play('tap'); g.hold = { x: t.x, y: t.y }; pending = pendingTrees = true; showGhost();
          return;
        }
        const chk = S.canPlace(s, g.type, t.x, t.y);
        if (!chk.ok) {
          if (!strokeWarned && (chk.short || !(s.road[i] || s.field[i]))) { strokeWarned = true; ctx.audio.play('error'); ui.toast(chk.why); }
          return;
        }
        S.place(s, g.type, t.x, t.y); ctx.audio.play('place'); g.hold = { x: t.x, y: t.y }; pending = pendingTrees = true; showGhost();
      },
      onPaintEnd() { strokeWarned = false; flushPaint(); ui.rebuildBar(); },
      onHover(t) {
        if (!g.live || ui.blocking()) return;
        if (g.mode === 'paint') {
          const o = t ? { x: t.x, y: t.y } : null;
          if (same(o, g.hover)) return;
          if (!same(o, g.hold)) g.hold = null;
          g.hover = o; showGhost();
          return;
        }
        if (g.mode !== 'place') return;
        const o = t ? origin(t, g.type) : null;
        if (same(o, g.ghost) || (o && same(o, g.hold))) return;
        g.hold = null; g.ghost = o;
        showGhost(); applyOverlay(); ui.refreshInfo();
      },
      onTap(t, ptype) {
        if (!g.live || ui.blocking()) return;
        ui.closePop();
        if (g.mode === 'place') {
          const o = origin(t, g.type);
          if (ptype === 'mouse') { g.touch = false; g.ghost = o; tryPlace(o, true); ui.refreshInfo(); return; }
          g.touch = true;
          // A second tap anywhere on the preview's footprint confirms it; elsewhere moves it.
          const gh = g.ghost, sz = B[g.type].size;
          if (gh && t.x >= gh.x && t.x < gh.x + sz && t.y >= gh.y && t.y < gh.y + sz) { tryPlace(gh, false); ui.refreshInfo(); return; }
          g.ghost = o; ctx.audio.play('tap');
          showGhost(); applyOverlay(); ui.refreshInfo();
          return;
        }
        const b = S.buildingAt(g.s, t.x, t.y);
        if (b) ctx.audio.play('tap');
        g.select(b && b !== g.sel ? b : null);
      },
      onKey(k, e) {
        if (!g.live) return;
        if (k === 'escape') { if (g.type) g.selectType(null); else if (g.sel) g.select(null); }
        if (k === ' ' && !ui.blocking()) { e.preventDefault(); g.setSpeed(g.speed ? 0 : 1); ui.hud(); }
      },
    });

    // ---------- time ----------
    function handle(events) {
      let refresh = false;
      const s = g.s;
      for (const ev of events) {
        if (ev.type === 'homeUp') { refresh = true; ui.float(ev.b.x, ev.b.y, HOME_LEVELS[ev.b.lvl].name); }
        else if (ev.type === 'homeDown') refresh = true;
        else if (ev.type === 'season') ui.toast(`${SEASONS[ev.season]}, year ${S.year(s)}`);
        else if (ev.type === 'quest') {
          const rw = Object.entries(ev.quest.reward).map(([k, v]) => `+${v} ${RES[k].name.toLowerCase()}`).join(', ');
          ctx.audio.play('good'); ui.toast(`${ICON.check} ${ev.quest.text}${rw ? ` · ${rw}` : ''}`, 'good');
        } else if (ev.type === 'era') { ctx.audio.play('level'); refresh = true; ui.rebuildBar(); ui.openEra(ev.era); save(); }
        else if (ev.type === 'finale') { ctx.audio.play('level'); ui.openFinale(); save(); }
        else if (ev.type === 'event') { ctx.audio.play('coin'); }
      }
      if (refresh) { view.refresh({ trees: false }); applyOverlay(); refreshFits(); showGhost(); }
    }

    stage.onFrame((dt, elapsed) => {
      input.update(dt);
      flushPaint();
      const s = g.s;
      if (!s) return;
      if (g.live && g.speed > 0 && !ui.blocking()) {
        acc += dt * RATE[g.speed];
        let n = 0;
        while (acc >= 1 && n++ < 30) { acc -= 1; handle(S.tick(s)); dirty = true; if (ui.blocking()) { acc = 0; break; } }
        if (acc > 1) acc = 1;
      }
      if (!g.live) view.controls.rotate(dt * 0.04);
      view.update(dt, elapsed, S.yearPhase(s, Math.min(1, acc)));
      hudClock += dt; saveClock += dt;
      if (hudClock > 0.3 && g.live) {
        hudClock = 0; ui.hud();
        if (g.mode === 'place' && g.ghost && S.canPlace(s, g.type, g.ghost.x, g.ghost.y).ok !== ghostOk) { showGhost(); ui.refreshInfo(); }
      }
      if (saveClock > 8) { saveClock = 0; if (dirty) save(); }
    });

    const onHide = () => { if (document.hidden) save(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);

    // ---------- boot ----------
    const saved = S.fromSave(store.get('save', null));
    g.s = saved || S.newGame(randomSeed());
    view.setState(g.s);
    if (!saved) view.controls.jump(g.s.m.start.x, g.s.m.start.y, 24);
    ui.showTitle(saved ? saveLine(saved) : null);
    if (import.meta.env.DEV) window.__eb = { g, S, view, ui };

    return {
      dispose() {
        save();
        document.removeEventListener('visibilitychange', onHide);
        window.removeEventListener('pagehide', save);
        input.dispose(); ui.dispose(); view.dispose(); disposeThumbs(); stage.dispose();
        if (import.meta.env.DEV) delete window.__eb;
      },
    };
  },
};
