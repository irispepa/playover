// Deepvault: a real-time dungeon roguelike. Entry point and glue between sim, renderer, UI, input and storage.
import './style.css';
import { createStage } from '../../shell/stage.js';
import { randomSeed } from '../../shell/rng.js';
import { CLASSES, CLASS_ORDER, SCROLLS } from './data.js';
import {
  newRun, createGame, advance, parseSeed, choosePerk, equipFromBag, unequip, salvage, usePotion, useScroll, refreshStats,
} from './sim.js';
import {
  serializeRun, deserializeRun, normalizeMeta, mergeFloorLog, recordDepth, recordRunEnd, syncRunStats, classUnlocked, bestLabel,
} from './save.js';
import { createRenderer } from './render.js';
import { solidAt } from './world.js';
import { createUI } from './ui.js';
import { createInput } from './input.js';
import { showGuide, showMoreTips } from './guide.js';

function makeSfx(audio) {
  const last = new Map();
  const a = audio;
  const S = {
    swing: () => a.noise({ dur: 0.06, vol: 0.1, freq: 2600 }),
    shoot: () => a.tone({ freq: 760, to: 420, dur: 0.07, type: 'triangle', vol: 0.07 }),
    hit: () => a.noise({ dur: 0.05, vol: 0.12, freq: 1100 }),
    crit: () => { a.noise({ dur: 0.07, vol: 0.18, freq: 1600 }); a.tone({ freq: 1200, to: 700, dur: 0.06, type: 'square', vol: 0.05 }); },
    hurt: () => { a.play('hit'); a.tone({ freq: 180, to: 90, dur: 0.14, type: 'sawtooth', vol: 0.12 }); },
    dash: () => a.noise({ dur: 0.14, vol: 0.14, freq: 1800 }),
    coin: () => a.play('coin'),
    pickup: () => a.tone({ freq: 520, to: 900, dur: 0.1, type: 'triangle', vol: 0.14 }),
    good: () => a.play('good'), bad: () => a.play('bad'), level: () => a.play('level'), error: () => a.play('error'), explode: () => a.play('explode'),
    eshoot: () => a.tone({ freq: 330, to: 200, dur: 0.08, type: 'square', vol: 0.035 }),
    charge: () => a.tone({ freq: 170, to: 80, dur: 0.3, type: 'sawtooth', vol: 0.09 }),
    fuse: () => a.tone({ freq: 880, to: 1500, dur: 0.5, type: 'square', vol: 0.04 }),
    summon: () => a.tone({ freq: 200, to: 520, dur: 0.35, type: 'sine', vol: 0.12 }),
    blink: () => a.tone({ freq: 1300, to: 300, dur: 0.16, type: 'sine', vol: 0.1 }),
    cast: () => a.tone({ freq: 420, to: 760, dur: 0.2, type: 'triangle', vol: 0.08 }),
    crate: () => a.noise({ dur: 0.1, vol: 0.18, freq: 650 }),
    chest: () => { a.play('good'); a.noise({ dur: 0.12, vol: 0.1, freq: 500 }); },
    unlock: () => [300, 450, 600].forEach((f, i) => a.tone({ freq: f, dur: 0.1, type: 'square', vol: 0.08, delay: i * 0.06 })),
    block: () => a.tone({ freq: 1500, to: 1100, dur: 0.05, type: 'square', vol: 0.06 }),
    bash: () => { a.noise({ dur: 0.18, vol: 0.25, freq: 500 }); a.tone({ freq: 140, to: 60, dur: 0.2, type: 'sawtooth', vol: 0.12 }); },
    buff: () => [400, 600, 800].forEach((f, i) => a.tone({ freq: f, dur: 0.12, type: 'triangle', vol: 0.1, delay: i * 0.05 })),
    nova: () => { a.noise({ dur: 0.3, vol: 0.18, freq: 3000 }); a.tone({ freq: 900, to: 200, dur: 0.3, type: 'sine', vol: 0.1 }); },
    fire: () => { a.noise({ dur: 0.25, vol: 0.16, freq: 700 }); a.tone({ freq: 220, to: 120, dur: 0.2, type: 'sawtooth', vol: 0.06 }); },
    zap: () => a.tone({ freq: 1900, to: 300, dur: 0.1, type: 'sawtooth', vol: 0.07 }),
    siphon: () => a.tone({ freq: 320, to: 140, dur: 0.35, type: 'sine', vol: 0.14 }),
    potion: () => [500, 700, 900].forEach((f, i) => a.tone({ freq: f, dur: 0.1, type: 'sine', vol: 0.12, delay: i * 0.05 })),
    throw: () => a.noise({ dur: 0.1, vol: 0.1, freq: 1200 }),
    scroll: () => [660, 990].forEach((f, i) => a.tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.1, delay: i * 0.08 })),
    boss: () => [110, 98, 82].forEach((f, i) => a.tone({ freq: f, dur: 0.4, type: 'sawtooth', vol: 0.14, delay: i * 0.22 })),
    kill: () => a.tone({ freq: 420, to: 160, dur: 0.1, type: 'triangle', vol: 0.06 }),
    step: () => a.tone({ freq: 300, to: 600, dur: 0.25, type: 'triangle', vol: 0.12 }),
  };
  return (name) => {
    const f = S[name];
    if (!f) return;
    const now = performance.now();
    if (now - (last.get(name) || 0) < 45) return;
    last.set(name, now);
    try { f(); } catch { /* audio not available */ }
  };
}

function dailySeedLabel() {
  const d = new Date();
  return `DAILY-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export default {
  start(ctx) {
    const { storage } = ctx;
    const stage = createStage(ctx.root, { background: 0x05050a });
    const R = createRenderer(stage);
    const sfx = makeSfx(ctx.audio);
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

    let meta = normalizeMeta(storage.get('meta', null));
    let run = null, G = null, mode = 'title';
    let selClass = CLASSES[meta.lastClass] && classUnlocked(meta, meta.lastClass) ? meta.lastClass : 'warden';
    const prevStats = { elites: 0, bosses: 0 };

    const U = createUI(stage.ui, { renderer: () => R, tap: () => ctx.audio.play('tap') });
    const input = createInput(U.touch, U.joy, U.knob, { onPause: () => togglePause(), onInventory: () => openInventory() });
    input.bindButton(U.dashBtn, 'dash');
    input.bindButton(U.ab1Btn, 'ab1');
    input.bindButton(U.ab2Btn, 'ab2');
    input.bindButton(U.potBtn, 'potion');
    input.bindButton(U.bombBtn, 'bomb');
    input.bindButton(U.ctxBtn, 'interact');
    input.bindButton(U.pauseBtn, () => togglePause());
    input.bindButton(U.bagBtn, () => openInventory());

    const saveMeta = () => {
      storage.set('meta', meta);
      const lbl = bestLabel(meta);
      if (lbl) ctx.setBest(lbl);
    };
    const loadSave = () => {
      const raw = storage.get('run', null);
      if (!raw) return null;
      const r = deserializeRun(raw);
      if (!r) storage.remove('run');
      return r;
    };
    function saveRun() {
      if (!run || !G || G.over || mode === 'dead') return;
      mergeFloorLog(meta, G);
      syncRunStats(meta, run, prevStats);
      storage.set('run', serializeRun(run, G));
      saveMeta();
    }

    // ---------------------------------------------------------------- flow
    function showTitle() {
      mode = 'title';
      G = null; run = null;
      U.setPlaying(false);
      input.setEnabled(false);
      U.showTitle({ save: loadSave(), meta });
    }

    function enterFloor() {
      G = createGame(run, meta);
      if (import.meta.env.DEV) window.__dv = { G, solidAt }; // dev-only handle for automated play tests
      R.setGame(G);
      R.snapCamera();
      U.setClass(run.classId);
      U.setFirstRun(meta.runs === 0 && run.floor === 1);
      U.close();
      U.setPlaying(true);
      input.setEnabled(true);
      mode = 'play';
      processEvents();
    }

    function beginRun(r) {
      run = r;
      prevStats.elites = run.stats.elites; prevStats.bosses = run.stats.bosses;
      meta.lastClass = run.classId;
      saveMeta();
      enterFloor();
      storage.set('run', serializeRun(run, G));
    }

    function startNew(classId, seedText) {
      let parsed = parseSeed(seedText);
      if (!parsed) { const s = randomSeed(); parsed = { seed: s, label: String(s) }; }
      meta.lastSeedInput = seedText || '';
      const r = newRun(parsed.seed, classId, parsed.label);
      // First new run ever: the guide first, then the floor (and its first-run button labels).
      if (!meta.seenHowTo) {
        meta.seenHowTo = true;
        saveMeta();
        openHowTo(r.classId, 'Descend', () => beginRun(r));
        return;
      }
      beginRun(r);
    }

    // How to play: the shared guide over whatever screen is open (title, new run or pause menu).
    let guide = null, disposed = false;
    function openHowTo(classId, doneLabel, then) {
      guide?.close();
      guide = showGuide(ctx.root, {
        classId, doneLabel,
        onClose: () => { guide = null; if (!disposed && then) then(); },
      });
    }
    // More tips on their own, through the same slot so dispose and the pause menu treat it alike.
    function openMoreTips(classId) {
      guide?.close();
      guide = showMoreTips(ctx.root, { classId, onClose: () => { guide = null; } });
    }

    function descend() {
      mergeFloorLog(meta, G);
      syncRunStats(meta, run, prevStats);
      run.floor++;
      run.floorState = null;
      U.setFirstRun(false);
      const P = run.P;
      P.hp = Math.min(P.st.maxHp, P.hp + P.st.maxHp * 0.1);
      P.energy = P.st.energyMax;
      const unl = recordDepth(meta, run);
      saveMeta();
      enterFloor();
      storage.set('run', serializeRun(run, G));
      sfx('step');
      for (const u of unl) U.toast(u, '#ffd24a');
    }

    function onDeath() {
      mode = 'dead';
      input.setEnabled(false);
      mergeFloorLog(meta, G);
      syncRunStats(meta, run, prevStats);
      const wasBest = run.floor > (meta.deepest || 0) || run.floor > (meta.bestByClass[run.classId] || 0);
      const unlocks = recordRunEnd(meta, run, 'dead');
      storage.remove('run');
      saveMeta();
      sfx('bad');
      const r = run;
      later(() => { if (mode === 'dead') { U.setPlaying(false); U.showDeath(r, unlocks, wasBest); } }, 1300);
    }

    function abandon() {
      if (!run) return showTitle();
      if (G) { mergeFloorLog(meta, G); syncRunStats(meta, run, prevStats); }
      recordRunEnd(meta, run, 'abandoned');
      storage.remove('run');
      saveMeta();
      showTitle();
    }

    function togglePause() {
      if (mode !== 'play' || !G || G.choice) return;
      if (U.isOpen()) { if (U.overlay === 'dv-pauseov' || U.overlay === 'dv-invov') resume(); return; }
      saveRun();
      input.setEnabled(false);
      U.showPause(G);
    }
    function resume() {
      U.close();
      if (mode === 'play') input.setEnabled(true);
    }
    function openInventory() {
      if (mode !== 'play' || !G || G.choice) return;
      if (U.overlay === 'dv-invov') { resume(); return; }
      if (!U.isOpen()) saveRun();
      input.setEnabled(false);
      U.inv.sel = null; U.inv.scroll = 0;
      U.showInventory(G);
    }
    const refreshInv = () => { processEvents(); U.showInventory(G); };

    // ---------------------------------------------------------------- UI actions
    Object.assign(U.actions, {
      continue: () => { const r = loadSave(); if (r) beginRun(r); else showTitle(); },
      newrun: () => { if (!classUnlocked(meta, selClass)) selClass = 'warden'; U.showNewRun(meta, selClass); },
      pickclass: (id) => { const v = U.seedValue(); selClass = id; meta.lastSeedInput = v; U.showNewRun(meta, selClass); },
      lockedclass: (id) => { U.toast(`${CLASSES[id].name}: ${CLASSES[id].unlock.text} to unlock`, '#9aa8bc'); ctx.audio.play('error'); },
      seedrandom: () => U.setSeedValue(String(randomSeed())),
      seeddaily: () => U.setSeedValue(dailySeedLabel()),
      start: () => startNew(selClass, U.seedValue()),
      records: () => U.showRecords(meta),
      howto: () => openHowTo(mode === 'play' && run ? run.classId : selClass, 'Got it'),
      moretips: () => openMoreTips(mode === 'play' && run ? run.classId : selClass),
      back: () => showTitle(),
      title: () => showTitle(),
      exit: () => { saveRun(); ctx.exit(); },
      resume: () => resume(),
      pause: () => { if (mode === 'play' && G) U.showPause(G); },
      inventory: () => openInventory(),
      abandon: () => U.showConfirm('Abandon this run? It ends now and counts toward your records.', 'abandonyes', 'Abandon run'),
      abandonyes: () => abandon(),
      perk: (id) => {
        if (!G || !G.choice) return;
        choosePerk(G, id);
        processEvents();
        if (G.choice) U.showChoice(G); else { resume(); saveRun(); }
      },
      seleq: (slot) => { U.inv.sel = { where: 'eq', slot }; refreshInv(); },
      selbag: (uid) => { U.inv.sel = { where: 'bag', uid }; refreshInv(); },
      equip: (slot) => {
        const sel = U.inv.sel;
        if (sel && sel.where === 'bag' && equipFromBag(G, sel.uid, slot)) { U.inv.sel = { where: 'eq', slot }; ctx.audio.play('place'); }
        refreshInv();
      },
      unequip: (slot) => { if (unequip(G, slot)) { U.inv.sel = null; ctx.audio.play('place'); } refreshInv(); },
      salvage: (uid) => { const g = salvage(G, uid); if (g) { U.inv.sel = null; ctx.audio.play('coin'); } refreshInv(); },
      drink: () => { usePotion(G); refreshInv(); },
      read: (k) => {
        if (useScroll(G, k)) {
          processEvents();
          if (k === 'recall' || k === 'mapping' || k === 'frost') { resume(); return; }
        }
        refreshInv();
      },
      closeinv: () => resume(),
      restart: () => { const s = randomSeed(); beginRun(newRun(s, run.classId, String(s))); },
      retryseed: () => beginRun(newRun(run.seed, run.classId, run.label)),
      none: () => {},
    });

    // ---------------------------------------------------------------- events and frame loop
    function processEvents() {
      if (!G) return;
      const ev = G.events;
      for (let i = 0; i < ev.length; i++) {
        const e = ev[i];
        R.onEvent(e);
        U.onEvent(e, G);
        switch (e.t) {
          case 'sfx': sfx(e.name); break;
          case 'num': if (e.c === 'hit') sfx('hit'); else if (e.c === 'crit') sfx('crit'); break;
          case 'phurt': sfx('hurt'); break;
          case 'death': sfx(e.boss ? 'explode' : 'kill'); break;
          case 'levelup': sfx('level'); break;
          case 'synergy': break;
          default: break;
        }
      }
      ev.length = 0;
    }

    stage.onFrame((dt, t) => {
      if (!G || (mode !== 'play' && mode !== 'dead')) return;
      const paused = U.isOpen();
      if (mode === 'play' && !paused) {
        input.update();
        advance(G, dt, input.state);
      }
      processEvents();
      if (mode === 'play') {
        if (G.choice && !U.isOpen()) { input.setEnabled(false); U.showChoice(G); sfx('level'); }
        if (G.descendReq) { descend(); return; }
        if (G.over) onDeath();
      }
      U.hud(G, paused ? 0 : dt);
      R.sync(paused ? 0 : dt, t);
    });

    const onVis = () => {
      if (document.hidden && mode === 'play' && G) {
        saveRun();
        if (!U.isOpen() && !G.choice) { input.setEnabled(false); U.showPause(G); }
      }
    };
    const onHide = () => saveRun();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);

    const lbl = bestLabel(meta);
    if (lbl) ctx.setBest(lbl);
    showTitle();

    return {
      dispose() {
        disposed = true;
        guide?.close();
        saveRun();
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pagehide', onHide);
        for (const id of timers) clearTimeout(id);
        timers.clear();
        input.dispose();
        U.dispose();
        R.dispose();
        stage.dispose();
      },
    };
  },
};
