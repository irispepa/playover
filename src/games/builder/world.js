// Shared world helpers: grid queries, derived caches, placement and site rules. Pure.
import {
  T, D, BUILDINGS, RES, STORAGE_BASE, STORAGE_WAREHOUSE, GOLD_BASE, GOLD_WAREHOUSE, WORK_RANK, SIZES, DIFFICULTY,
  CHARTER_HAPPY, CLOTH_PER_MANOR_MIN, FOOD_PER_PERSON_MIN,
} from './data.js';

export const isLand = (t) => t >= T.SAND;
export const isWater = (t) => t <= T.SHALLOW;
export const inDisc = (dx, dy, r) => dx * dx + dy * dy <= r * r + 1;
export const inB = (s, x, y) => x >= 0 && y >= 0 && x < s.W && y < s.H;
export const tIdx = (s, x, y) => y * s.W + x;
export const def = (b) => BUILDINGS[b.type];

export function forDisc(s, x, y, r, fn) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (!inDisc(dx, dy, r)) continue;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= s.W || ny >= s.H) continue;
    fn(nx, ny, ny * s.W + nx, dx, dy);
  }
}

export const isComplete = (b) => b.prog >= 1;
export function radiusOf(b) {
  const d = def(b);
  if (!d.radius) return 0;
  return d.radius + (b.level >= 2 && d.up && d.up.radius ? d.up.radius : 0);
}
export function reachOf(b) {
  const d = def(b);
  if (!d.reach) return 0;
  return d.reach + (b.level >= 2 && d.up && d.up.reach ? d.up.reach : 0);
}
export function workersNeeded(b) {
  const d = def(b);
  if (!d.workers || !isComplete(b) || b.paused || b.damaged || b.fire > 0) return 0;
  return d.workers + (b.level >= 2 && d.up && d.up.workers ? d.up.workers : 0);
}
export function maxWorkers(b) {
  const d = def(b);
  if (!d.workers) return 0;
  return d.workers + (b.level >= 2 && d.up && d.up.workers ? d.up.workers : 0);
}

// ---- Derived cache (never saved; rebuilt from state) ----
const caches = new WeakMap();

export function cache(s) {
  let c = caches.get(s);
  if (!c || c.ver !== s.ver || c.n !== s.buildings.length) {
    c = buildStructural(s);
    caches.set(s, c);
  }
  return c;
}
export function touch(s) { s.ver++; }

function buildStructural(s) {
  const n = s.W * s.H;
  const occ = new Int32Array(n).fill(-1);
  const byId = new Map();
  s.buildings.forEach((b, i) => { occ[b.y * s.W + b.x] = b.id; byId.set(b.id, b); });
  const reach = new Uint8Array(n);
  const noise = new Uint8Array(n);
  const forestClaims = new Uint8Array(n);
  const waterClaims = new Uint8Array(n);
  let whLevels = 0;
  const counts = {};
  for (const b of s.buildings) {
    counts[b.type] = (counts[b.type] || 0) + 1;
    const d = def(b);
    const done = isComplete(b);
    if (done && d.reach) forDisc(s, b.x, b.y, reachOf(b), (x, y, i) => { reach[i] = 1; });
    if (done && d.storage) whLevels += b.level;
    if (d.noise) forDisc(s, b.x, b.y, 2, (x, y, i) => { if (noise[i] < 250) noise[i]++; });
    if (d.site === 'wood' || d.site === 'forage') forDisc(s, b.x, b.y, 2, (x, y, i) => { if (s.terrain[i] === T.FOREST || (d.site === 'forage' && s.terrain[i] === T.GRASS)) forestClaims[i]++; });
    if (d.site === 'fish') forDisc(s, b.x, b.y, 2, (x, y, i) => { if (isWater(s.terrain[i])) waterClaims[i]++; });
  }
  const caps = {};
  for (const r of RES) caps[r] = STORAGE_BASE + STORAGE_WAREHOUSE * whLevels;
  caps.gold = GOLD_BASE + GOLD_WAREHOUSE * whLevels;
  const c = {
    ver: s.ver, n: s.buildings.length, occ, byId, reach, noise, forestClaims, waterClaims, caps, counts,
    site: new Map(), order: null,
    cov: { well: new Uint8Array(n), market: new Uint8Array(n), tavern: new Uint8Array(n), shrine: new Uint8Array(n) },
    rates: {}, housingCap: 0,
  };
  for (const b of s.buildings) c.site.set(b.id, siteMult(s, c, b.type, b.x, b.y, false).mult);
  // Coverage from the last known service status, so queries between ticks stay correct.
  for (const b of s.buildings) {
    const d = def(b);
    if (!d.service || b.status !== 'ok' || !isComplete(b)) continue;
    const cov = c.cov[d.service];
    forDisc(s, b.x, b.y, radiusOf(b), (x, y, i) => { cov[i] = 1; });
  }
  c.order = s.buildings.filter((b) => def(b).workers > 0).sort((a, b) =>
    (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || WORK_RANK[def(a).cat] - WORK_RANK[def(b).cat] || a.id - b.id);
  return c;
}

export function buildingAt(s, x, y) {
  if (!inB(s, x, y)) return null;
  const id = cache(s).occ[y * s.W + x];
  return id >= 0 ? cache(s).byId.get(id) : null;
}
export const countOf = (s, type) => cache(s).counts[type] || 0;

// ---- Site multipliers ----
// `extra` = true when evaluating a building that does not exist yet (it adds a claim of its own).
export function siteMult(s, c, type, x, y, extra) {
  const d = BUILDINGS[type];
  const notes = [];
  let mult = 1;
  const add = extra ? 1 : 0;
  switch (d.site) {
    case 'wood': {
      let share = 0, n = 0;
      forDisc(s, x, y, 2, (nx, ny, i) => { if (s.terrain[i] === T.FOREST && !(nx === x && ny === y)) { share += 1 / (c.forestClaims[i] + add || 1); n++; } });
      mult = Math.min(1.6, share / 7);
      notes.push(`${n} forest tiles in range` + (share < n - 0.01 ? `, shared (${share.toFixed(1)})` : ''));
      break;
    }
    case 'forage': {
      let share = 0, f = 0, g = 0;
      forDisc(s, x, y, 2, (nx, ny, i) => {
        if (nx === x && ny === y) return;
        const t = s.terrain[i];
        if (t === T.FOREST) { share += 1 / (c.forestClaims[i] + add || 1); f++; }
        else if (t === T.GRASS && !occupied(s, c, i)) { share += 0.35 / (c.forestClaims[i] + add || 1); g++; }
      });
      mult = Math.min(1.5, share / 5);
      notes.push(`${f} forest and ${g} open meadow tiles in range`);
      break;
    }
    case 'fish': {
      let share = 0, sh = 0, w = 0;
      forDisc(s, x, y, 2, (nx, ny, i) => {
        const t = s.terrain[i];
        if (!isWater(t)) return;
        w++;
        let v = t === T.SHALLOW ? 1 : 0.6;
        if (s.deposit[i] === D.FISH) { v += 3; sh++; }
        share += v / (c.waterClaims[i] + add || 1);
      });
      mult = Math.min(2.2, share / 8);
      notes.push(`${w} water tiles` + (sh ? `, ${sh} shoal${sh > 1 ? 's' : ''}` : '') + ' in range');
      break;
    }
    case 'farm': {
      const i0 = y * s.W + x;
      mult = s.deposit[i0] === D.FERTILE ? 1.5 : 1;
      let f = 0;
      forDisc(s, x, y, 1, (nx, ny, i) => { if (i !== i0 && s.deposit[i] === D.FERTILE) f++; });
      mult += Math.min(0.4, f * 0.1);
      notes.push(s.deposit[i0] === D.FERTILE ? 'On fertile soil' : 'Ordinary soil');
      if (f) notes.push(`${f} fertile neighbours`);
      break;
    }
    case 'quarry': {
      let h = 0;
      forDisc(s, x, y, 1, (nx, ny, i) => { if (!(nx === x && ny === y) && (s.terrain[i] === T.HILL || s.terrain[i] === T.MOUNTAIN)) h++; });
      mult = 0.6 + Math.min(0.8, h * 0.1);
      notes.push(`${h} hill or crag tiles around`);
      break;
    }
    case 'mine': {
      let o = 0;
      forDisc(s, x, y, 1, (nx, ny, i) => { if (!(nx === x && ny === y) && s.deposit[i] === D.ORE) o++; });
      mult = 1 + Math.min(0.6, o * 0.15);
      notes.push(o ? `${o} more ore tiles beside it` : 'A lone vein');
      break;
    }
    case 'pasture': {
      let g = 0;
      forDisc(s, x, y, 1, (nx, ny, i) => {
        if (nx === x && ny === y) return;
        if ((s.terrain[i] === T.GRASS || s.terrain[i] === T.HILL) && !occupied(s, c, i)) g++;
      });
      mult = 0.6 + Math.min(0.64, g * 0.08);
      notes.push(`${g} free grazing tiles around`);
      break;
    }
    default: break;
  }
  return { mult: Math.max(0, mult), notes };
}
const occupied = (s, c, i) => c.occ[i] >= 0;

// ---- Tiers and placement ----
export function charterPop(s) {
  const base = (SIZES[s.size] || SIZES.medium).charterPop;
  const m = s.difficulty === 'gentle' ? 0.85 : s.difficulty === 'harsh' ? 1.1 : 1;
  return Math.round(base * m);
}

export function terrainOk(s, type, x, y) {
  const d = BUILDINGS[type];
  const i = y * s.W + x;
  const t = s.terrain[i];
  if (isWater(t)) return 'Needs dry land';
  if (t === T.MOUNTAIN) return 'Too steep to build on';
  switch (d.place) {
    case 'coast': {
      if (t === T.HILL) return 'Needs a low shore beside the water';
      let w = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (inB(s, nx, ny) && isWater(s.terrain[ny * s.W + nx])) w = true;
      }
      if (!w) return 'Must touch the water';
      break;
    }
    case 'hill': if (t !== T.HILL) return 'Must be built on hills'; break;
    case 'ore': if (s.deposit[i] !== D.ORE) return 'Must be built on an ore vein'; break;
    case 'grass': if (t !== T.GRASS) return 'Needs open meadow'; break;
    case 'pasture': if (t !== T.GRASS && t !== T.HILL) return 'Needs meadow or hills'; break;
    default: break;
  }
  return null;
}

export function canPlace(s, type, x, y) {
  const d = BUILDINGS[type];
  if (!d || d.buildable === false) return { ok: false, reason: 'Cannot be built' };
  if (!inB(s, x, y)) return { ok: false, reason: 'Off the map' };
  if (d.tier > s.tier) return { ok: false, reason: `Unlocks with milestone tier ${d.tier}` };
  const c = cache(s);
  const i = y * s.W + x;
  if (c.occ[i] >= 0) return { ok: false, reason: 'Tile is occupied' };
  const tr = terrainOk(s, type, x, y);
  if (tr) return { ok: false, reason: tr };
  if (!c.reach[i]) return { ok: false, reason: 'Out of reach: build a Warehouse closer' };
  if (d.unique && (c.counts[type] || 0) > 0) return { ok: false, reason: `You already have a ${d.name}` };
  if (d.site === 'wood') {
    let f = 0; forDisc(s, x, y, 2, (nx, ny, j) => { if (s.terrain[j] === T.FOREST && j !== i) f++; });
    if (f < 2) return { ok: false, reason: 'Needs forest within 2 tiles' };
  }
  if (type === 'charter') {
    if (s.pop < charterPop(s)) return { ok: false, reason: `Needs ${charterPop(s)} people` };
    if (s.happy < CHARTER_HAPPY) return { ok: false, reason: `Needs happiness ${CHARTER_HAPPY}` };
  }
  return { ok: true, reason: '' };
}

export function canAfford(s, cost) {
  for (const k in cost) if ((s.res[k] || 0) < cost[k] - 1e-9) return false;
  return true;
}
export function missing(s, cost) {
  const out = [];
  for (const k in cost) if ((s.res[k] || 0) < cost[k] - 1e-9) out.push(k);
  return out;
}
export function pay(s, cost) { for (const k in cost) s.res[k] = Math.max(0, (s.res[k] || 0) - cost[k]); }

export function baseCost(b) {
  const d = def(b);
  if (d.levels) return d.levels[b.level - 1].cost;
  return d.cost;
}
export function totalCost(b) {
  const d = def(b);
  const out = {};
  const addC = (c) => { for (const k in c) out[k] = (out[k] || 0) + c[k]; };
  if (d.levels) for (let l = 0; l < b.level; l++) addC(d.levels[l].cost);
  else { addC(d.cost); if (b.level >= 2 && d.up) addC(d.up.cost); }
  return out;
}

// Per-minute output of a building at its current staffing (theoretical, ignores blocked inputs).
export function prodPerMin(s, b, effOverride) {
  const d = def(b);
  if (!d.cycle) return { in: {}, out: {} };
  const c = cache(s);
  const need = maxWorkers(b);
  const eff = effOverride != null ? effOverride : (need ? b.workers / need : 1);
  const lv = b.level >= 2 && d.up && d.up.rate ? d.up.rate : 1;
  const m = (c.site.get(b.id) ?? 1) * eventMult(s, b) * lv;
  const k = (60 / d.cycle) * eff;
  const inn = {}, out = {};
  for (const r in d.in || {}) inn[r] = d.in[r] * k * m;
  for (const r in d.out) out[r] = d.out[r] * k * m;
  return { in: inn, out, mult: m, eff };
}

export function eventMult(s, b) {
  let m = 1;
  for (const e of s.effects) {
    if (e.kind !== 'mult' || !e.types.includes(b.type)) continue;
    if (e.wellSafe && cache(s).cov.well[b.y * s.W + b.x]) continue;
    if (e.coastOnly && !nearWaterTile(s, b.x, b.y, 2)) continue;
    m *= e.mult;
  }
  return m;
}
export function nearWaterTile(s, x, y, r) {
  let w = false;
  forDisc(s, x, y, r, (nx, ny, i) => { if (isWater(s.terrain[i])) w = true; });
  return w;
}

export function happyMod(s) {
  let m = 0;
  for (const e of s.effects) if (e.kind === 'happy') m += e.amount;
  return m;
}

export function difficulty(s) { return DIFFICULTY[s.difficulty] || DIFFICULTY.standard; }

// Net per-minute flow of every resource right now (for HUD and planning).
export function rates(s) {
  const r = {};
  for (const k of RES) r[k] = 0;
  const c = cache(s);
  const diff = difficulty(s);
  for (const b of s.buildings) {
    const d = def(b);
    if (b.type === 'townhall') { for (const k in d.trickle) r[k] += d.trickle[k]; continue; }
    if (d.cycle && isComplete(b) && b.status === 'ok') {
      const p = prodPerMin(s, b);
      for (const k in p.in) r[k] -= p.in[k];
      for (const k in p.out) r[k] += p.out[k];
    }
    if (d.ale && b.status === 'ok') r.ale -= d.ale;
    if (d.levels && b.eff === 3 && b.res > 0) r.cloth -= CLOTH_PER_MANOR_MIN;
  }
  r.food -= s.pop * FOOD_PER_PERSON_MIN * diff.eat;
  r.gold += s.taxMin || 0;
  return r;
}
