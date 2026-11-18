// Tidewater: island colony builder. Wires the pure simulation to the three.js view and HTML UI.
import './style.css';
import { createStage } from '../../shell/stage.js';
import { randomSeed } from '../../shell/rng.js';
import { BUILDINGS, BUILD_ORDER, DIFFICULTY, SIZES, T } from './data.js';
import {
  newGame, advance, build, upgrade, demolish, repair, togglePause, togglePrio, acceptDeal, serialize, deserialize,
  canPlace, canAfford, startEndless, dayOf,
} from './sim.js';
import { cache, siteMult, forDisc, radiusOf, reachOf, isComplete } from './world.js';
import { createView, makeThumbnails, SKY } from './render.js';
import { createInput } from './input.js';
import { createUI } from './ui.js';
import { islandName } from './gen.js';

const SEED_WORDS = ['gull', 'kelp', 'amber', 'tern', 'salt', 'cove', 'reef', 'mist', 'otter', 'heron', 'brine', 'drift', 'pearl', 'cobble', 'thistle', 'lantern'];

export default {
  start(ctx) {
    const stage = createStage(ctx.root, { background: SKY });
    const view = createView(stage);
    const thumbKeys = [...BUILD_ORDER.map((t) => t + ':1'), 'house:2', 'house:3', 'townhall:1'];
    const thumbs = makeThumbnails(stage.renderer, thumbKeys);
    const store = ctx.storage;

    const randomSeedStr = () => {
      const n = randomSeed();
      return SEED_WORDS[n % SEED_WORDS.length] + '-' + (Math.floor(n / 16) % 9000 + 1000);
    };

    const game = {
      s: null, live: false, speed: 1, mode: 'browse', placeType: null, placeTile: -1, selTile: -1, thumbs,
      modalPause: false, newOpts: null, prevState: null, prevLive: false,
      tap: () => ctx.audio.play('tap'),
    };
    let ui = null;

    // ---------- persistence ----------
    function save() {
      if (!game.live || !game.s) return;
      store.set('save', serialize(game.s));
      const peak = Math.max(store.get('peakPop', 0), game.s.stats.peakPop);
      store.set('peakPop', peak);
      updateBestLabel();
    }
    game.bests = () => store.get('best', {}) || {};
    function updateBestLabel() {
      const best = game.bests();
      let top = null;
      for (const k in best) if (best[k] && (!top || best[k].score > top.score)) top = best[k];
      if (top) ctx.setBest(`Best: ${top.score} pts`);
      else {
        const p = store.get('peakPop', 0);
        if (p > 6) ctx.setBest(`Best: ${p} people`);
      }
    }
    game.saveInfo = () => {
      const s = game.live && game.s ? game.s : deserialize(store.get('save', null));
      if (!s) return null;
      return { name: s.name, line: `Day ${dayOf(s)} · ${s.pop} people · ${SIZES[s.size].name}, ${DIFFICULTY[s.difficulty].name}${s.charter ? ' · chartered' : ''}` };
    };

    // ---------- state switching ----------
    function useState(s, live) {
      game.s = s; game.live = live;
      game.mode = 'browse'; game.placeType = null; game.placeTile = -1; game.selTile = -1;
      view.setSelection(s, -1); view.setGhost(s, null, -1); view.setOverlay(s, null);
      view.sync(s, 0);
      const cs = view.camState;
      cs.tx = s.start.x + 0.5 - s.W / 2; cs.tz = s.start.y + 0.5 - s.H / 2;
      cs.dist = live ? 17 : Math.max(s.W, s.H) * 1.05;
      cs.yaw = Math.PI / 4;
      if (!live) { cs.tx = 0; cs.tz = 0; }
      view.updateCamera();
      overlayKey = '';
      ui.setHudVisible(live);
      ui.renderTray(true);
      ui.update();
    }

    game.openNew = () => {
      if (!game.newOpts) game.newOpts = { size: store.get('lastSize', 'medium'), difficulty: store.get('lastDiff', 'standard'), seed: randomSeedStr() };
      else game.newOpts.seed = randomSeedStr();
      if (game.live) { save(); game.prevState = game.s; game.prevLive = true; } else { game.prevState = game.s; game.prevLive = false; }
      previewNew();
      ui.showModal('new');
    };
    function previewNew() {
      const o = game.newOpts;
      useState(newGame(o), false);
    }
    game.setNewOpt = (k, v, fromInput) => {
      game.newOpts[k] = v;
      previewNew();
      if (!fromInput) ui.refreshModal();
      else ui.refreshModalSoft?.();
    };
    game.randomSeedStr = randomSeedStr;
    game.closeNew = () => {
      ui.hideModal();
      if (game.prevState) useState(game.prevState, game.prevLive);
      game.prevState = null;
      if (!game.live) ui.showModal('title');
    };
    game.startNew = () => {
      const o = game.newOpts;
      store.set('lastSize', o.size); store.set('lastDiff', o.difficulty);
      const s = newGame(o);
      game.prevState = null;
      useState(s, true);
      ui.hideModal();
      save();
      ctx.audio.play('level');
      ui.toast(`You land on ${s.name}. Start with a few Houses, a Woodcutter and a Fishing Hut.`, 'good');
      // First run: the guide opens, then short pointers at the goal, stores and tray (once ever).
      const coach = !store.get('coachSeen', false);
      game.coachAfterHelp = false;
      if (!store.get('seenHelp', false)) {
        store.set('seenHelp', true);
        game.coachAfterHelp = coach;
        ui.openHelp(true);
      } else if (coach) startCoach();
    };
    game.continueGame = () => {
      const s = game.live ? game.s : deserialize(store.get('save', null));
      if (!s) { ui.toast('That save could not be read. Start a new island.', 'bad'); store.remove('save'); ui.refreshModal(); return; }
      useState(s, true);
      ui.hideModal();
      ctx.audio.play('good');
    };
    game.exit = () => { save(); ctx.exit(); };
    game.endless = () => { if (game.s) { startEndless(game.s); save(); } };

    // A modal, the How to play guide (which can sit over a modal) and a coach mark each hold their own pause;
    // the game stays paused while any one is up.
    const pauseBy = { modal: false, help: false, coach: false };
    game.onModal = (open, kind) => {
      pauseBy[kind === 'coach' || kind === 'help' ? kind : 'modal'] = open && kind !== 'title' && kind !== 'new';
      game.modalPause = pauseBy.modal || pauseBy.help || pauseBy.coach;
      if (open && game.live) save();
      if (!open && !game.live && kind !== 'new' && kind !== 'confirmNew' && kind !== 'coach' && kind !== 'help') ui.showModal('title');
      if (!open && kind === 'help' && game.coachAfterHelp && game.live) { game.coachAfterHelp = false; startCoach(); }
    };
    function startCoach() {
      store.set('coachSeen', true);
      ui.startCoach();
    }
    game.setSpeed = (v) => { game.speed = v; store.set('speed', v); if (v === 0) save(); };

    // ---------- selection and placement ----------
    game.select = (i) => {
      game.selTile = i;
      view.setSelection(game.s, i);
      ui.renderSheet(true);
      overlayKey = '';
    };
    game.startPlace = (type, tile = -1) => {
      const s = game.s;
      const d = BUILDINGS[type];
      if (d.tier > s.tier) { ctx.audio.play('error'); ui.toast(`${d.name} unlocks at tier ${d.tier}. Check the goals to see how.`, 'info'); return; }
      ctx.audio.play('tap');
      if (game.mode === 'place' && game.placeType === type && tile < 0) { game.cancelPlace(); return; }
      game.mode = 'place'; game.placeType = type; game.placeTile = tile;
      game.selTile = -1; view.setSelection(s, -1);
      view.setGhost(s, tile >= 0 ? type : null, tile, tile >= 0 && canPlace(s, type, tile % s.W, (tile / s.W) | 0).ok);
      overlayKey = '';
      ui.renderSheet(true); ui.renderTray(true); ui.renderConfirm(true);
    };
    game.cancelPlace = () => {
      game.mode = 'browse'; game.placeType = null; game.placeTile = -1;
      view.setGhost(game.s, null, -1);
      overlayKey = '';
      ui.renderTray(true); ui.renderConfirm(true); ui.renderSheet(true);
    };
    game.confirmBuild = () => {
      const s = game.s;
      const i = game.placeTile;
      if (game.mode !== 'place' || i < 0) return;
      const r = build(s, game.placeType, i % s.W, (i / s.W) | 0);
      if (!r.ok) { ctx.audio.play('error'); ui.toast(r.reason, 'bad'); return; }
      ctx.audio.play('place');
      game.placeTile = -1;
      view.setGhost(s, null, -1);
      overlayKey = '';
      if (BUILDINGS[game.placeType].unique || !canAfford(s, BUILDINGS[game.placeType].cost)) game.cancelPlace();
      ui.renderConfirm(true); ui.renderTray(true);
    };
    game.act = (a, id) => {
      const s = game.s;
      let r = { ok: true };
      if (a === 'up') r = upgrade(s, id);
      else if (a === 'pause') togglePause(s, id);
      else if (a === 'prio') togglePrio(s, id);
      else if (a === 'repair') r = repair(s, id);
      else if (a === 'demolish') { r = demolish(s, id); if (r.ok) { ctx.audio.play('hit'); game.select(-1); return; } }
      if (!r.ok) { ctx.audio.play('error'); ui.toast(r.reason, 'bad'); }
      else ctx.audio.play(a === 'up' ? 'level' : a === 'repair' ? 'good' : 'tap');
      overlayKey = '';
      ui.renderSheet(true);
    };
    game.deal = (i) => {
      const r = acceptDeal(game.s, i);
      if (r.ok) ctx.audio.play('coin'); else { ctx.audio.play('error'); ui.toast(r.reason, 'bad'); }
    };

    function onTap(x, y) {
      if (!game.s || ui.modalKind) return;
      const i = view.pick(x, y);
      if (!game.live) return;
      if (game.mode === 'place') {
        if (i < 0) return;
        const s = game.s;
        game.placeTile = i;
        const ok = canPlace(s, game.placeType, i % s.W, (i / s.W) | 0).ok;
        view.setGhost(s, game.placeType, i, ok);
        ctx.audio.tone({ freq: ok ? 520 : 200, dur: 0.05, type: 'triangle', vol: 0.12 });
        overlayKey = '';
        ui.renderConfirm(true);
        return;
      }
      if (i < 0 || i === game.selTile) { game.select(-1); return; }
      game.tap();
      game.select(i);
    }

    // ---------- overlays ----------
    let overlayKey = '';
    const overlay = [];
    function computeOverlay() {
      const s = game.s;
      const key = `${game.mode}|${game.placeType}|${game.placeTile}|${game.selTile}|${s ? s.ver : 0}|${s ? s.tier : 0}`;
      if (key === overlayKey) return;
      overlayKey = key;
      overlay.length = 0;
      if (!s || !game.live) { view.setOverlay(s, null); return; }
      const c = cache(s);
      const W = s.W;
      if (game.mode === 'place') {
        const type = game.placeType, d = BUILDINGS[type];
        const ring = new Set();
        if (game.placeTile >= 0) {
          const px = game.placeTile % W, py = (game.placeTile / W) | 0;
          const r = d.radius || d.reach || (d.noise ? 2 : d.site === 'wood' || d.site === 'fish' || d.site === 'forage' || d.plants ? 2 : 0);
          if (r) forDisc(s, px, py, r, (x, y, i) => { ring.add(i); });
        }
        for (let i = 0; i < W * s.H; i++) {
          const x = i % W, y = (i / W) | 0;
          if (ring.has(i)) {
            const id = c.occ[i];
            const isHouse = id >= 0 && c.byId.get(id).type === 'house';
            overlay.push(i, d.noise && isHouse ? 0xff5a4a : d.reach ? 0xffffff : 0x6fc3ff);
            continue;
          }
          if (!canPlace(s, type, x, y).ok) continue;
          let color = 0x5fe07a;
          if (d.site) {
            const m = siteMult(s, c, type, x, y, true).mult;
            color = m >= 1.2 ? 0x3cff6e : m >= 0.85 ? 0x8fe05a : m >= 0.5 ? 0xf2d14b : 0xf28a3b;
          } else if (type === 'house') {
            let v = 0;
            for (const k of ['well', 'market', 'tavern', 'shrine']) if (c.cov[k][i]) v++;
            color = c.noise[i] ? 0xf2a03b : v >= 3 ? 0x3cff6e : v >= 1 ? 0x8fe05a : 0xd8f0a0;
          }
          overlay.push(i, color);
        }
      } else if (game.selTile >= 0) {
        const id = c.occ[game.selTile];
        const b = id >= 0 ? c.byId.get(id) : null;
        if (b && isComplete(b)) {
          const d = BUILDINGS[b.type];
          const r = radiusOf(b) || reachOf(b) || (d.site === 'wood' || d.site === 'fish' || d.site === 'forage' || d.plants ? 2 : 0) || (d.noise ? 2 : 0);
          if (r) forDisc(s, b.x, b.y, r, (x, y, i) => { if (i !== game.selTile) overlay.push(i, d.reach ? 0xffffff : d.noise && !d.site ? 0xff8a5a : 0x6fc3ff); });
        }
      }
      view.setOverlay(s, overlay);
    }

    // ---------- sim messages ----------
    function handle(msgs) {
      for (const m of msgs) {
        if (m.type === 'toast') { ui.toast(m.text, m.kind); if (m.sound) ctx.audio.play(m.sound); }
        else if (m.type === 'milestone') {
          ui.toast(`<b>Milestone: ${m.name}</b>${m.unlock ? ' · new buildings unlocked!' : ''}`, 'mile', true);
          ctx.audio.play('level');
          if (m.unlock) ui.markNewTier(m.unlock);
        } else if (m.type === 'built') {
          ctx.audio.tone({ freq: 740, to: 990, dur: 0.08, type: 'triangle', vol: 0.08 });
        } else if (m.type === 'relief') view.relief();
        else if (m.type === 'fx' && m.kind === 'storm') { ui.flash(); ctx.audio.noise({ dur: 0.9, vol: 0.25, freq: 600 }); }
        else if (m.type === 'charter') {
          const s = game.s;
          const best = game.bests();
          const prev = best[s.difficulty];
          if (!prev || prev.score < s.charter.score) {
            best[s.difficulty] = { score: s.charter.score, name: s.name, seed: s.seed, pop: s.pop };
            store.set('best', best);
          }
          save();
          ctx.audio.play('level');
          ui.showModal('charter');
        }
      }
    }

    ui = createUI(stage.ui, game, ctx.root);
    const input = createInput(stage.canvas, view, {
      onTap,
      getBounds: () => {
        const s = game.s;
        const n = s ? Math.max(s.W, s.H) : 35;
        return { w: s ? s.W : 35, h: s ? s.H : 35, minDist: 6, maxDist: n * 1.35 };
      },
    });

    // ---------- main loop ----------
    let uiT = 0, saveT = 0;
    const msgs = [];
    const offFrame = stage.onFrame((dt, t) => {
      const s = game.s;
      if (!s) return;
      if (game.live && !game.modalPause && game.speed > 0) {
        msgs.length = 0;
        advance(s, dt * game.speed, msgs);
        if (msgs.length) handle(msgs);
      }
      if (!game.live) { view.camState.yaw += dt * 0.06; view.updateCamera(); }
      input.update(dt);
      let pk = 0;
      for (const b of s.buildings) if (b.prog < 1) pk += b.id * 31 + Math.floor(b.prog * 5) + 1;
      view.sync(s, pk);
      view.frame(dt, t, s);
      uiT += dt;
      if (uiT > 0.25) { uiT = 0; ui.update(); computeOverlay(); }
      saveT += dt;
      if (saveT > 10) { saveT = 0; save(); }
    });

    const onVis = () => { if (document.hidden) save(); };
    document.addEventListener('visibilitychange', onVis);
    const onHide = () => save();
    window.addEventListener('pagehide', onHide);

    // ---------- boot ----------
    game.speed = store.get('speed', 1);
    if (![0, 1, 3].includes(game.speed)) game.speed = 1;
    const raw = store.get('save', null);
    const saved = deserialize(raw);
    if (raw && !saved) store.remove('save'); // incompatible or corrupt save
    if (saved) useState(saved, false);
    else useState(newGame({ seed: randomSeedStr(), size: 'medium', difficulty: 'standard' }), false);
    updateBestLabel();
    ui.showModal('title');
    if (raw && !saved) ui.toast('An older save could not be loaded, so it was set aside.', 'info');

    return {
      dispose() {
        save();
        offFrame();
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pagehide', onHide);
        input.dispose();
        ui.dispose();
        view.dispose();
        stage.dispose();
      },
    };
  },
};
void T; void islandName;
