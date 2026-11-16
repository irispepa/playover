// Tidewater simulation: state, tick, player actions, milestones, scoring, save/load. Pure.
import { makeRng, hashSeed } from '../../shell/rng.js';
import {
  SAVE_VERSION, TICK, T, BUILDINGS, RES, START_STOCK, FOUNDERS, HOUSE_GRACE, CLOTH_PER_MANOR_MIN,
  FOOD_PER_PERSON_MIN, IDLE_ALLOWANCE, D, MILESTONES, DIFFICULTY, SIZES, RES_INFO, DAY_SECONDS,
} from './data.js';
import { generateIsland } from './gen.js';
import {
  cache, touch, def, isComplete, forDisc, workersNeeded, maxWorkers, radiusOf, canPlace, canAfford, pay, missing,
  totalCost, eventMult, happyMod, difficulty, charterPop, buildingAt,
} from './world.js';
import { eventsTick, log, removeBuilding, acceptDeal as acceptDealImpl, repairCost } from './events.js';

export { canPlace, canAfford, buildingAt, repairCost, charterPop };

function blankRes() { const r = {}; for (const k of RES) r[k] = 0; return r; }

export function newGame({ seed, size = 'medium', difficulty: diffId = 'standard' }) {
  const seedStr = String(seed);
  const g = generateIsland({ seed: seedStr, size, difficulty: diffId });
  const diff = DIFFICULTY[diffId] || DIFFICULTY.standard;
  const res = blankRes();
  for (const k in START_STOCK) res[k] = Math.round(START_STOCK[k] * diff.start);
  const s = {
    v: SAVE_VERSION, seed: seedStr, size, difficulty: diffId, name: g.name,
    W: g.W, H: g.H, terrain: g.terrain, deposit: g.deposit, start: g.start,
    t: 0, acc: 0, ver: 0, nextId: 1,
    buildings: [], res, pop: 6, happy: 60, popT: 0, popMode: '', starving: false, clothShort: false,
    housing: 6, taxMin: 0, idle: 0, tier: 1, mi: 0,
    stats: { made: {}, goldEarned: 0, trades: 0, peakPop: 6, events: 0 },
    effects: [], ship: null, nextShipAt: -1, reliefAt: -9999,
    nextEventAt: 200 + (hashSeed(seedStr) % 60),
    rng: hashSeed('sim:' + seedStr + ':' + size + ':' + diffId),
    log: [], charter: null, endless: null, terrainVer: 0,
  };
  addBuilding(s, 'townhall', g.start.x, g.start.y, true);
  log(s, `Your ship runs aground on ${s.name}. The founders unload what they can and look around for timber.`, 'info');
  return s;
}

function addBuilding(s, type, x, y, instant) {
  const b = {
    id: s.nextId++, type, x, y, level: 1, prog: instant || !BUILDINGS[type].build ? 1 : 0, work: 0, workers: 0,
    paused: false, prio: false, damaged: false, fire: 0, grace: HOUSE_GRACE, res: 0, eff: 1, status: 'build', buf: 0,
  };
  const i = y * s.W + x;
  if (s.terrain[i] === T.FOREST) { s.terrain[i] = T.GRASS; s.terrainVer = (s.terrainVer || 0) + 1; } // clearing the plot
  s.buildings.push(b);
  touch(s);
  return b;
}

// ---- Actions ----
export function build(s, type, x, y) {
  const p = canPlace(s, type, x, y);
  if (!p.ok) return p;
  const cost = BUILDINGS[type].cost;
  if (!canAfford(s, cost)) return { ok: false, reason: 'Need more ' + missing(s, cost).map((k) => RES_INFO[k].name.toLowerCase()).join(', ') };
  const wasForest = s.terrain[y * s.W + x] === T.FOREST;
  pay(s, cost);
  const b = addBuilding(s, type, x, y, false);
  if (wasForest) s.res.wood = Math.min(cache(s).caps.wood, s.res.wood + 3);
  return { ok: true, id: b.id, cleared: wasForest };
}

export function upgradeInfo(s, b) {
  const d = def(b);
  if (d.levels) {
    if (b.level >= d.levels.length) return null;
    const next = d.levels[b.level];
    const info = { name: next.name, cost: next.cost, ok: true, reason: '' };
    if ((next.tier || 1) > s.tier) return { ...info, ok: false, reason: `Unlocks at tier ${next.tier}` };
    if (!isComplete(b)) return { ...info, ok: false, reason: 'Still being built' };
    if (b.damaged) return { ...info, ok: false, reason: 'Repair it first' };
    const unmet = needsUnmet(s, b, b.level + 1, true);
    if (unmet.length) return { ...info, ok: false, reason: 'Needs ' + unmet.join(', ') };
    if (!canAfford(s, next.cost)) return { ...info, ok: false, reason: 'Need more ' + missing(s, next.cost).map((k) => RES_INFO[k].name.toLowerCase()).join(', ') };
    return info;
  }
  if (!d.up || b.level >= 2) return null;
  const info = { name: `${d.name} II`, cost: d.up.cost, ok: true, reason: '' };
  if (d.up.tier > s.tier) return { ...info, ok: false, reason: `Unlocks at tier ${d.up.tier}` };
  if (!isComplete(b)) return { ...info, ok: false, reason: 'Still being built' };
  if (b.damaged) return { ...info, ok: false, reason: 'Repair it first' };
  if (!canAfford(s, d.up.cost)) return { ...info, ok: false, reason: 'Need more ' + missing(s, d.up.cost).map((k) => RES_INFO[k].name.toLowerCase()).join(', ') };
  return info;
}

export function upgrade(s, id) {
  const b = cache(s).byId.get(id);
  if (!b) return { ok: false, reason: 'No building' };
  const u = upgradeInfo(s, b);
  if (!u) return { ok: false, reason: 'Fully upgraded' };
  if (!u.ok) return u;
  pay(s, u.cost);
  b.level++;
  b.grace = HOUSE_GRACE;
  touch(s);
  return { ok: true };
}

export function demolish(s, id) {
  const b = cache(s).byId.get(id);
  if (!b || b.type === 'townhall') return { ok: false, reason: 'Cannot demolish this' };
  if (b.type === 'charter' && s.charter) return { ok: false, reason: 'The charter hall stays' };
  const c = cache(s);
  const refund = {};
  const tc = totalCost(b);
  const frac = isComplete(b) ? 0.5 : 1;
  for (const k in tc) {
    refund[k] = Math.floor(tc[k] * frac);
    s.res[k] = Math.min(c.caps[k], (s.res[k] || 0) + refund[k]);
  }
  removeBuilding(s, b);
  return { ok: true, refund };
}

export function repair(s, id) {
  const b = cache(s).byId.get(id);
  if (!b || !b.damaged) return { ok: false, reason: 'Not damaged' };
  if (b.fire > 0) return { ok: false, reason: 'Still burning' };
  const cost = repairCost(b);
  if (!canAfford(s, cost)) return { ok: false, reason: 'Need more ' + missing(s, cost).map((k) => RES_INFO[k].name.toLowerCase()).join(', ') };
  pay(s, cost);
  b.damaged = false;
  touch(s);
  return { ok: true };
}

export function togglePause(s, id) { const b = cache(s).byId.get(id); if (b) { b.paused = !b.paused; touch(s); } }
export function togglePrio(s, id) { const b = cache(s).byId.get(id); if (b) { b.prio = !b.prio; touch(s); } }
export function acceptDeal(s, i) { return acceptDealImpl(s, i); }

// ---- Needs ----
// Returns a list of unmet need labels for a house at `level`. `forUpgrade` checks cloth stock instead of the shortage flag.
export function needsUnmet(s, b, level, forUpgrade = false) {
  const lv = BUILDINGS.house.levels[level - 1];
  const c = cache(s);
  const i = b.y * s.W + b.x;
  const out = [];
  for (const n of lv.needs) {
    if (n === 'cloth') {
      if (forUpgrade ? (s.res.cloth || 0) < 1 : s.clothShort) out.push('cloth');
    } else if (!c.cov[n][i]) out.push(BUILDINGS[n].name);
  }
  return out;
}

// ---- Simulation ----
export function advance(s, dt, out = []) {
  s.acc += dt;
  let n = 0;
  while (s.acc >= TICK && n < 200) { s.acc -= TICK; tick(s, out); n++; }
  if (n >= 200) s.acc = 0;
  return out;
}

export function tick(s, out = []) {
  const dt = TICK;
  s.t += dt;
  const r = makeRng(s.rng);
  const diff = difficulty(s);

  // 1. Construction.
  for (const b of s.buildings) {
    if (b.prog < 1) {
      b.prog = Math.min(1, b.prog + dt / BUILDINGS[b.type].build);
      if (b.prog >= 1) {
        touch(s);
        out.push({ type: 'built', id: b.id });
        if (b.type === 'charter') grantCharter(s, out);
      }
    }
  }
  const c = cache(s);

  // 2. Workers (priority order).
  let avail = s.pop;
  for (const b of c.order) {
    const need = workersNeeded(b);
    const w = Math.min(need, avail);
    b.workers = w; avail -= w;
  }
  s.idle = avail;

  // 3. Services and coverage.
  for (const k in c.cov) c.cov[k].fill(0);
  for (const b of s.buildings) {
    const d = def(b);
    if (!d.service) continue;
    let active = isComplete(b) && !b.damaged && !(b.fire > 0) && !b.paused;
    if (active && d.workers) active = b.workers >= Math.ceil(maxWorkers(b) / 2);
    if (active && d.ale) {
      const use = d.ale / 60 * dt;
      if (b.buf < use) {
        const take = Math.min(s.res.ale || 0, 2 - b.buf);
        s.res.ale -= take; b.buf += take;
      }
      if (b.buf >= use - 1e-9) b.buf = Math.max(0, b.buf - use);
      else active = false;
    }
    b.status = !isComplete(b) ? 'build' : active ? 'ok' : b.damaged ? 'damaged' : b.paused ? 'paused' : d.ale && b.workers > 0 ? 'input' : 'idle';
    if (!active) continue;
    const cov = c.cov[d.service];
    forDisc(s, b.x, b.y, radiusOf(b), (x, y, i) => { cov[i] = 1; });
  }

  // 4. Production.
  for (const b of s.buildings) {
    const d = def(b);
    if (b.type === 'townhall') {
      for (const k in d.trickle) gain(s, c, k, d.trickle[k] / 60 * dt);
      b.status = 'ok';
      continue;
    }
    if (!isComplete(b)) { b.status = 'build'; continue; }
    if (!d.cycle) {
      if (d.service || d.levels) continue;
      b.status = b.fire > 0 ? 'fire' : b.damaged ? 'damaged' : b.paused ? 'paused' : d.workers && b.workers === 0 ? 'idle' : 'ok';
      continue;
    }
    if (b.fire > 0) { b.status = 'fire'; continue; }
    if (b.damaged) { b.status = 'damaged'; continue; }
    if (b.paused) { b.status = 'paused'; continue; }
    const need = maxWorkers(b);
    const eff = need ? b.workers / need : 1;
    if (eff <= 0) { b.status = 'idle'; continue; }
    const lv = b.level >= 2 && d.up && d.up.rate ? d.up.rate : 1;
    const m = (c.site.get(b.id) ?? 1) * eventMult(s, b) * lv;
    if (b.work < 1) b.work = Math.min(1, b.work + dt / d.cycle * eff * m);
    if (b.work >= 1) {
      let blocked = '';
      for (const k in d.in || {}) if ((s.res[k] || 0) < d.in[k]) blocked = 'input';
      if (!blocked) for (const k in d.out) if ((s.res[k] || 0) + d.out[k] > c.caps[k] + 1e-9) blocked = 'full';
      if (blocked) { b.status = blocked; continue; }
      for (const k in d.in || {}) s.res[k] -= d.in[k];
      for (const k in d.out) { s.res[k] += d.out[k]; s.stats.made[k] = (s.stats.made[k] || 0) + d.out[k]; }
      b.work -= 1;
    }
    b.status = m <= 0.001 ? 'idle' : 'ok';
  }

  // 5. Houses: needs, capacity, residents, happiness, taxes.
  const L = BUILDINGS.house.levels;
  let cap = 0;
  let clothDemand = 0;
  for (const b of s.buildings) {
    if (b.type === 'house' && b.level === 3 && isComplete(b) && b.res > 0) clothDemand += CLOTH_PER_MANOR_MIN / 60 * dt;
  }
  s.clothShort = clothDemand > 0 && (s.res.cloth || 0) < clothDemand;
  for (const b of s.buildings) {
    const d = def(b);
    if (b.type === 'townhall') { cap += d.housing; b.eff = 1; continue; }
    if (b.type !== 'house') continue;
    if (!isComplete(b)) { b.eff = 0; continue; }
    let eff = b.level;
    if (b.level >= 2) {
      if (needsUnmet(s, b, b.level).length) {
        b.grace = Math.max(0, b.grace - dt);
        if (b.grace <= 0) {
          eff = b.level - 1;
          while (eff >= 2 && needsUnmet(s, b, eff).length) eff--;
        }
      } else b.grace = HOUSE_GRACE;
    }
    b.eff = eff;
    let hc = L[eff - 1].cap;
    if (b.damaged || b.fire > 0) hc = Math.floor(hc / 2);
    b.cap = hc;
    cap += hc;
    b.status = b.damaged ? 'damaged' : b.fire > 0 ? 'fire' : eff < b.level ? 'needs' : b.grace < HOUSE_GRACE ? 'warn' : 'ok';
  }
  s.housing = cap;
  // Fill dwellings in order.
  let left = s.pop;
  let hsum = 0, tax = 0, clothUse = 0;
  const hm = happyMod(s);
  for (const b of s.buildings) {
    if (b.type !== 'townhall' && !(b.type === 'house' && isComplete(b))) { if (b.type === 'house') b.res = 0; continue; }
    const hc = b.type === 'townhall' ? BUILDINGS.townhall.housing : b.cap;
    const n = Math.min(hc, left);
    left -= n;
    b.res = n;
    const h = dwellingHappy(s, c, b, hm);
    b.happy = h;
    hsum += h * n;
    const lvTax = b.type === 'townhall' ? 0.05 : L[b.eff - 1].tax;
    tax += n * lvTax * Math.max(0.5, Math.min(1.3, h / 70));
    if (b.type === 'house' && b.eff === 3 && n > 0) clothUse += CLOTH_PER_MANOR_MIN / 60 * dt;
  }
  s.res.cloth = Math.max(0, (s.res.cloth || 0) - clothUse);
  const target = s.pop > 0 ? hsum / Math.max(1, s.pop - left) : 50;
  s.happy += (target - s.happy) * Math.min(1, dt / 4);
  s.taxMin = tax;
  const g = tax / 60 * dt;
  gain(s, c, 'gold', g);
  s.stats.goldEarned += g;

  // 6. Food and population.
  const eat = s.pop * FOOD_PER_PERSON_MIN / 60 * diff.eat * dt;
  if (s.res.food >= eat) { s.res.food -= eat; s.starving = false; } else { s.res.food = 0; s.starving = true; }
  let mode = '', interval = 0;
  if (s.starving) { mode = 'starve'; interval = 6; }
  else if (s.pop > cap) { mode = 'over'; interval = 2; }
  else if (s.happy < 30) { mode = 'unhappy'; interval = 10; }
  else if (s.pop < cap && s.happy >= 40 && s.idle <= IDLE_ALLOWANCE(s.pop)) { mode = 'grow'; interval = 3 + (100 - s.happy) * 0.12; }
  if (mode !== s.popMode) { s.popMode = mode; s.popT = 0; }
  if (mode) {
    s.popT += dt;
    if (s.popT >= interval) {
      s.popT -= interval;
      if (mode === 'grow') s.pop++;
      else if (s.pop > FOUNDERS) {
        s.pop--;
        if (mode === 'starve' && r.chance(0.25)) out.push({ type: 'toast', text: 'Hungry settlers are leaving. Build food: a Fishing Hut or Forager.', kind: 'bad', sound: 'bad' });
      }
    }
  }
  if (s.pop > s.stats.peakPop) s.stats.peakPop = s.pop;

  // 7. Forests: foresters plant, and woods slowly spread on their own.
  forestTick(s, r, dt);

  // 8. Events, fires, ships, relief.
  eventsTick(s, r, out, dt);

  // 9. Goals.
  checkGoals(s, r, out);

  // 10. Sanity: storage caps, no negatives, no NaN.
  const caps = cache(s).caps;
  for (const k of RES) {
    let v = s.res[k];
    if (!Number.isFinite(v) || v < 0) v = 0;
    if (v > caps[k]) v = caps[k];
    s.res[k] = v;
  }
  if (!Number.isFinite(s.happy)) s.happy = 50;
  s.rng = r.state();
  return out;
}

function forestTick(s, r, dt) {
  const c = cache(s);
  let changed = false;
  for (const b of s.buildings) {
    const d = def(b);
    if (!d.plants || !isComplete(b) || b.workers <= 0) { if (d.plants) b.status = !isComplete(b) ? 'build' : b.paused ? 'paused' : b.damaged ? 'damaged' : 'idle'; continue; }
    if (b.damaged || b.fire > 0) { b.status = b.damaged ? 'damaged' : 'fire'; continue; }
    const lv = b.level >= 2 ? 1.6 : 1;
    b.work += dt / 20 * lv * eventMult(s, b);
    b.status = 'ok';
    if (b.work < 1) continue;
    b.work -= 1;
    const spots = [];
    forDisc(s, b.x, b.y, d.plants, (x, y, i) => {
      if (s.terrain[i] === T.GRASS && s.deposit[i] === D.NONE && c.occ[i] < 0) spots.push(i);
    });
    if (spots.length) { s.terrain[r.pick(spots)] = T.FOREST; changed = true; }
    else b.status = 'full';
  }
  // Natural spread: one try every 8 seconds.
  if (Math.floor(s.t / 8) !== Math.floor((s.t - dt) / 8)) {
    const x = r.int(1, s.W - 2), y = r.int(1, s.H - 2);
    const i = y * s.W + x;
    if (s.terrain[i] === T.GRASS && s.deposit[i] === D.NONE && c.occ[i] < 0) {
      let f = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (s.terrain[(y + dy) * s.W + x + dx] === T.FOREST) f++;
      if (f >= 2) { s.terrain[i] = T.FOREST; changed = true; }
    }
  }
  if (changed) { touch(s); s.terrainVer = (s.terrainVer || 0) + 1; }
}

function gain(s, c, k, n) { s.res[k] = Math.min(c.caps[k], (s.res[k] || 0) + n); }

export function dwellingHappy(s, c, b, hm = happyMod(s)) {
  const i = b.y * s.W + b.x;
  let h = 60;
  if (c.cov.well[i]) h += 4;
  if (c.cov.market[i]) h += 8;
  if (c.cov.tavern[i]) h += 10;
  if (c.cov.shrine[i]) h += 12;
  const n = c.noise[i];
  if (n) h -= Math.min(20, 8 + 4 * (n - 1));
  if (s.starving) h -= 35;
  if (b.type === 'house' && b.eff < b.level) h -= 10;
  if (b.damaged) h -= 10;
  h += hm;
  return Math.max(0, Math.min(100, h));
}

export function happyBreakdown(s, b) {
  const c = cache(s);
  const i = b.y * s.W + b.x;
  const rows = [['Base', 60]];
  if (c.cov.well[i]) rows.push(['Well', 4]);
  if (c.cov.market[i]) rows.push(['Market', 8]);
  if (c.cov.tavern[i]) rows.push(['Tavern', 10]);
  if (c.cov.shrine[i]) rows.push(['Shrine', 12]);
  const n = c.noise[i];
  if (n) rows.push(['Industry noise', -Math.min(20, 8 + 4 * (n - 1))]);
  if (s.starving) rows.push(['Hunger', -35]);
  if (b.type === 'house' && b.eff < b.level) rows.push(['Needs unmet', -10]);
  if (b.damaged) rows.push(['Damaged', -10]);
  for (const e of s.effects) if (e.kind === 'happy') rows.push([e.label, e.amount]);
  return rows;
}

// ---- Goals ----
function evalCheck(s, ch) {
  switch (ch.kind) {
    case 'count': return [countDone(s, ch.of), ch.n];
    case 'countAny': return [ch.of.reduce((a, t) => a + countDone(s, t), 0), ch.n];
    case 'pop': return [s.pop, ch.n];
    case 'stock': return [Math.floor(s.res[ch.res] || 0), ch.n];
    case 'made': return [Math.floor(s.stats.made[ch.res] || 0), ch.n];
    case 'trades': return [s.stats.trades, ch.n];
    case 'happy': return [Math.round(s.happy), ch.n];
    case 'level': return [s.buildings.filter((b) => b.type === ch.of && b.level >= ch.level && isComplete(b)).length, ch.n];
    case 'charter': return [s.charter ? 1 : 0, 1];
    case 'all': {
      const parts = ch.of.map((p) => evalCheck(s, p));
      const done = parts.filter(([a, b]) => a >= b).length;
      return [done, parts.length, parts];
    }
    default: return [0, 1];
  }
}
const countDone = (s, type) => s.buildings.filter((b) => b.type === type && isComplete(b)).length;

export function goalProgress(s, goal) {
  const [cur, need, parts] = evalCheck(s, goal.check);
  return { cur, need, done: cur >= need, parts };
}
export function currentGoal(s) {
  if (s.mi < MILESTONES.length) return MILESTONES[s.mi];
  return s.endless ? s.endless.goal : null;
}

function grantReward(s, reward) {
  const c = cache(s);
  for (const k in reward) s.res[k] = Math.min(c.caps[k], (s.res[k] || 0) + reward[k]);
}

function checkGoals(s, r, out) {
  let guard = 0;
  while (s.mi < MILESTONES.length && guard++ < 3) {
    const m = MILESTONES[s.mi];
    if (!goalProgress(s, m).done) break;
    grantReward(s, m.reward);
    if (m.unlock) s.tier = Math.max(s.tier, m.unlock);
    s.mi++;
    log(s, `Milestone reached: ${m.name}.` + (m.unlock ? ' New buildings unlocked!' : ''), 'good');
    out.push({ type: 'milestone', id: m.id, name: m.name, unlock: m.unlock || 0, reward: m.reward });
  }
  if (s.endless) {
    const g = s.endless.goal;
    if (goalProgress(s, g).done) {
      grantReward(s, g.reward);
      s.endless.done++;
      log(s, `Goal reached: ${g.name}.`, 'good');
      out.push({ type: 'milestone', id: 'endless', name: g.name, unlock: 0, reward: g.reward });
      s.endless.goal = endlessGoal(s, r);
    }
  }
}

function endlessGoal(s, r) {
  const k = s.endless ? s.endless.done : 0;
  const kinds = ['pop', 'made', 'trades', 'level', 'stock'];
  const kind = r.pick(kinds);
  const gold = 40 + k * 10;
  if (kind === 'pop') {
    const n = Math.ceil((s.pop + 15 + k * 5) / 5) * 5;
    return { name: `Grow to ${n} people`, text: 'The crown wants a bigger town.', check: { kind: 'pop', n }, reward: { gold } };
  }
  if (kind === 'made') {
    const res = r.pick(['tools', 'cloth', 'iron', 'planks', 'ale']);
    const n = Math.floor(s.stats.made[res] || 0) + 20 + k * 5;
    return { name: `Produce ${RES_INFO[res].name.toLowerCase()}`, text: `Bring lifetime ${RES_INFO[res].name.toLowerCase()} made to ${n}.`, check: { kind: 'made', res, n }, reward: { gold } };
  }
  if (kind === 'trades') {
    const n = s.stats.trades + 3;
    return { name: 'Busy harbour', text: `Make ${n - s.stats.trades} more trades with ships.`, check: { kind: 'trades', n }, reward: { gold } };
  }
  if (kind === 'level') {
    const have = s.buildings.filter((b) => b.type === 'house' && b.level >= 3).length;
    const n = have + 2;
    return { name: `${n} Manors`, text: 'Raise two more Manors.', check: { kind: 'level', of: 'house', level: 3, n }, reward: { gold } };
  }
  const res = r.pick(['stone', 'planks', 'food', 'cloth', 'tools']);
  const n = Math.min(cache(s).caps[res], Math.floor((s.res[res] || 0) + 20 + k * 5));
  return { name: `Stockpile ${RES_INFO[res].name.toLowerCase()}`, text: `Hold ${n} ${RES_INFO[res].name.toLowerCase()} at once.`, check: { kind: 'stock', res, n }, reward: { gold } };
}

function grantCharter(s, out) {
  const sc = scoreOf(s);
  s.charter = { score: sc.total, parts: sc.parts, t: Math.round(s.t), pop: s.pop };
  log(s, `The Royal Charter is granted! ${s.name} is a free town. Score ${sc.total}.`, 'good');
  out.push({ type: 'charter', score: sc.total });
}

export function startEndless(s) {
  if (!s.charter || s.endless) return;
  const r = makeRng(s.rng);
  s.endless = { done: 0, goal: null };
  s.endless.goal = endlessGoal(s, r);
  s.rng = r.state();
}

export function scoreOf(s) {
  const diff = DIFFICULTY[s.difficulty] || DIFFICULTY.standard;
  const size = SIZES[s.size] || SIZES.medium;
  const manors = s.buildings.filter((b) => b.type === 'house' && b.level >= 3).length;
  const minutes = s.t / 60;
  const parts = [
    ['People', s.pop * 10],
    ['Happiness', Math.round(s.happy * 10)],
    ['Manors', manors * 60],
    ['Wealth earned', Math.round(s.stats.goldEarned / 4)],
    ['Swiftness', Math.max(0, Math.round(3000 - minutes * 25))],
  ];
  const raw = parts.reduce((a, p) => a + p[1], 0);
  const mult = diff.scoreMult * size.scoreMult;
  parts.push(['Difficulty and size', `×${mult.toFixed(2)}`]);
  return { total: Math.round(raw * mult), parts };
}

export function dayOf(s) { return Math.floor(s.t / DAY_SECONDS) + 1; }

// ---- Save / load ----
export function serialize(s) { return { v: SAVE_VERSION, state: s }; }

export function deserialize(o) {
  try {
    if (!o || o.v !== SAVE_VERSION || !o.state) return null;
    const s = o.state;
    if (s.v !== SAVE_VERSION || !Array.isArray(s.terrain) || s.terrain.length !== s.W * s.H) return null;
    if (!Array.isArray(s.deposit) || s.deposit.length !== s.W * s.H || !Array.isArray(s.buildings)) return null;
    if (!s.buildings.some((b) => b.type === 'townhall')) return null;
    for (const b of s.buildings) if (!BUILDINGS[b.type] || !Number.isInteger(b.x) || !Number.isInteger(b.y)) return null;
    for (const k of RES) if (!Number.isFinite(s.res[k])) s.res[k] = 0;
    return s;
  } catch { return null; }
}
