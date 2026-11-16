// Run saves and meta-progression. Pure (JSON in, JSON out).
import { CLASSES, CLASS_ORDER, PERKS, ENEMIES, BOSSES, SCROLL_KEYS, BAG_SIZE } from './data.js';
import { computeStats, perkUnlocked } from './items.js';
import { snapshotFloor, PERSIST_KEYS } from './sim.js';

export const SAVE_VERSION = 3;
export const META_VERSION = 1;

const clone = (v) => JSON.parse(JSON.stringify(v));

export function serializeRun(run, G) {
  const P = run.P;
  const p = {};
  for (const k of PERSIST_KEYS) p[k] = P[k];
  if (G && !G.over) p.hp = Math.max(1, P.hp);
  return clone({
    v: SAVE_VERSION, seed: run.seed, label: run.label, classId: run.classId, floor: run.floor, loads: run.loads || 0,
    stats: run.stats, P: p, floorState: G ? snapshotFloor(G) : run.floorState || null,
  });
}

function validItem(it) {
  return it && typeof it === 'object' && typeof it.slot === 'string' && typeof it.base === 'string' && typeof it.name === 'string' && Number.isFinite(it.rarity);
}

// Returns a run object, or null if the save is missing, old or broken.
export function deserializeRun(obj) {
  try {
    if (!obj || typeof obj !== 'object' || obj.v !== SAVE_VERSION) return null;
    if (!Number.isFinite(obj.seed) || !Number.isInteger(obj.floor) || obj.floor < 1 || !CLASSES[obj.classId]) return null;
    const src = obj.P;
    if (!src || !src.equip || !validItem(src.equip.weapon)) return null;
    const P = {
      classId: obj.classId, level: Math.max(1, src.level | 0), xp: Number(src.xp) || 0, hp: Number(src.hp) || 1, energy: Number(src.energy) || 0,
      gold: Math.max(0, src.gold | 0), keys: Math.max(0, src.keys | 0),
      equip: {
        weapon: src.equip.weapon, armor: validItem(src.equip.armor) ? src.equip.armor : null,
        trinket1: validItem(src.equip.trinket1) ? src.equip.trinket1 : null, trinket2: validItem(src.equip.trinket2) ? src.equip.trinket2 : null,
      },
      bag: Array.isArray(src.bag) ? src.bag.filter(validItem).slice(0, BAG_SIZE) : [],
      potions: Math.max(0, src.potions | 0), bombs: Math.max(0, src.bombs | 0), scrolls: {}, perks: {}, pendingPerks: Math.max(0, src.pendingPerks | 0),
    };
    for (const k of SCROLL_KEYS) P.scrolls[k] = Math.max(0, (src.scrolls && src.scrolls[k]) | 0);
    const perkIds = new Set(PERKS.map((p) => p.id));
    if (src.perks) for (const [k, n] of Object.entries(src.perks)) if (perkIds.has(k) && n > 0) P.perks[k] = n | 0;
    P.st = computeStats(P);
    if (!Number.isFinite(P.st.maxHp) || !Number.isFinite(P.st.hitDmg)) return null;
    P.hp = Math.min(Math.max(1, P.hp), P.st.maxHp);
    P.energy = Math.min(Math.max(0, P.energy), P.st.energyMax);
    const stats = { kills: 0, elites: 0, bosses: 0, dmgDealt: 0, dmgTaken: 0, gold: 0, items: 0, time: 0, killedBy: null, perks: 0, ...(obj.stats || {}) };
    return {
      v: SAVE_VERSION, seed: obj.seed >>> 0, label: String(obj.label || obj.seed), classId: obj.classId, floor: obj.floor,
      loads: (obj.loads | 0) + 1, P, stats, floorState: obj.floorState && typeof obj.floorState === 'object' ? obj.floorState : null,
    };
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------- meta
export function defaultMeta() {
  return { v: META_VERSION, kills: 0, elites: 0, bosses: 0, deepest: 0, runs: 0, bestByClass: {}, bestiary: {}, history: [], seenHowTo: false, lastClass: 'warden', lastSeed: '', lastSeedInput: '' };
}

export function normalizeMeta(m) {
  const d = defaultMeta();
  if (!m || typeof m !== 'object' || m.v !== META_VERSION) return d;
  const out = { ...d };
  for (const k of ['kills', 'elites', 'bosses', 'deepest', 'runs']) out[k] = Number.isFinite(m[k]) ? m[k] : 0;
  out.bestByClass = m.bestByClass && typeof m.bestByClass === 'object' ? { ...m.bestByClass } : {};
  out.bestiary = m.bestiary && typeof m.bestiary === 'object' ? { ...m.bestiary } : {};
  out.history = Array.isArray(m.history) ? m.history.slice(0, 30) : [];
  out.seenHowTo = !!m.seenHowTo;
  out.lastClass = CLASSES[m.lastClass] ? m.lastClass : 'warden';
  out.lastSeed = typeof m.lastSeed === 'string' ? m.lastSeed : '';
  out.lastSeedInput = typeof m.lastSeedInput === 'string' ? m.lastSeedInput.slice(0, 24) : '';
  return out;
}

export function classUnlocked(meta, id) {
  const c = CLASSES[id];
  if (!c.unlock) return true;
  return (meta.deepest || 0) >= c.unlock.deepest;
}

function unlockSnapshot(meta) {
  return {
    classes: CLASS_ORDER.filter((id) => classUnlocked(meta, id)),
    perks: PERKS.filter((p) => p.unlock && perkUnlocked(p, meta)).map((p) => p.id),
  };
}

// Merge kills and sightings from a floor into the bestiary. Returns names of anything newly unlocked.
export function mergeFloorLog(meta, G) {
  const before = unlockSnapshot(meta);
  for (const [type, n] of Object.entries(G.killLog)) {
    const b = meta.bestiary[type] || { k: 0, s: 1 };
    b.k += n; b.s = 1;
    meta.bestiary[type] = b;
    meta.kills += n;
  }
  for (const type of Object.keys(G.seenLog)) {
    if (!meta.bestiary[type]) meta.bestiary[type] = { k: 0, s: 1 };
  }
  G.killLog = {};
  G.seenLog = {};
  return diffUnlocks(before, meta);
}

export function recordDepth(meta, run) {
  const before = unlockSnapshot(meta);
  meta.deepest = Math.max(meta.deepest || 0, run.floor);
  const prev = meta.bestByClass[run.classId] || 0;
  if (run.floor > prev) meta.bestByClass[run.classId] = run.floor;
  return diffUnlocks(before, meta);
}

export function syncRunStats(meta, run, prevStats) {
  // Elites and bosses are counted live from the run's stats delta.
  meta.elites += Math.max(0, run.stats.elites - (prevStats.elites || 0));
  meta.bosses += Math.max(0, run.stats.bosses - (prevStats.bosses || 0));
  prevStats.elites = run.stats.elites; prevStats.bosses = run.stats.bosses;
}

export function recordRunEnd(meta, run, outcome) {
  const before = unlockSnapshot(meta);
  meta.runs += 1;
  meta.deepest = Math.max(meta.deepest || 0, run.floor);
  const prev = meta.bestByClass[run.classId] || 0;
  if (run.floor > prev) meta.bestByClass[run.classId] = run.floor;
  meta.history.unshift({
    cls: run.classId, floor: run.floor, kills: run.stats.kills, gold: run.stats.gold, time: Math.round(run.stats.time),
    seed: run.label, by: outcome === 'dead' ? run.stats.killedBy || 'the dark' : 'abandoned', level: run.P.level,
  });
  meta.history.length = Math.min(meta.history.length, 30);
  return diffUnlocks(before, meta);
}

function diffUnlocks(before, meta) {
  const after = unlockSnapshot(meta);
  const out = [];
  for (const c of after.classes) if (!before.classes.includes(c)) out.push(`New class: ${CLASSES[c].name}`);
  for (const p of after.perks) if (!before.perks.includes(p)) out.push(`New relic: ${PERKS.find((q) => q.id === p).name}`);
  return out;
}

export function bestLabel(meta) {
  return meta.deepest > 0 ? `Best: floor ${meta.deepest}` : null;
}

export function bestiaryList(meta) {
  const all = [...Object.keys(ENEMIES).filter((k) => !ENEMIES[k].minion), ...Object.keys(BOSSES)];
  return all.map((k) => {
    const def = ENEMIES[k] || BOSSES[k];
    const b = meta.bestiary[k];
    return { id: k, name: def.name, boss: !!BOSSES[k], seen: !!b, kills: b ? b.k : 0, color: def.color };
  });
}
