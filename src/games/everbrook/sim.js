// Everbrook rules. Pure: no DOM, no three. One tick is one day.
import { B, RES_KEYS, BASE_CAP, HOME_LEVELS, DISC_BY_ID, QUESTS, FESTIVALS, EVENTS, ERAS,
  DAYS_PER_SEASON, DAYS_PER_YEAR, FIELD_SEASON, PRICES } from './data.js';
import { generate, N, T, idx, inb } from './gen.js';
import { makeRng } from '../../shell/rng.js';

export const SAVE_VERSION = 1;
const SERVICE_KEYS = ['water', 'faith', 'market', 'health', 'learning', 'leisure'];
const EAT = 0.085;                 // food per person per day
const FIELD_YIELD = 0.42;

export function newGame(seed) {
  const m = generate(seed >>> 0);
  const s = {
    v: SAVE_VERSION, seed: m.seed, day: 0, era: 0,
    res: Object.fromEntries(RES_KEYS.map((k) => [k, 0])),
    knowledge: 0, culture: 0, festivals: 0, blossomUntil: 0, harmony: 60,
    b: [], nextId: 1, disc: {}, quest: 0, event: null, nextEvent: 150, lastEvent: null,
    rng: (m.seed ^ 0x9e3779b9) >>> 0, done: false, doneDay: 0, eraDays: [0],
  };
  s.res.food = 45; s.res.wood = 75;
  attach(s, m, [], [], []);
  return s;
}

function attach(s, m, roads, fields, cleared) {
  s.m = m;
  s.road = new Uint8Array(N * N); for (const i of roads) s.road[i] = 1;
  s.field = new Uint8Array(N * N); for (const i of fields) s.field[i] = 1;
  s.cleared = new Uint8Array(N * N); for (const i of cleared) s.cleared[i] = 1;
  s.dirty = true;
  s.d = null;
  recompute(s);
}

const list = (u8) => { const out = []; for (let i = 0; i < u8.length; i++) if (u8[i]) out.push(i); return out; };

export function toSave(s) {
  const { m, d, road, field, cleared, dirty, ...rest } = s;
  return { ...rest, road: list(road), field: list(field), cleared: list(cleared) };
}

export function fromSave(o) {
  if (!o || o.v !== SAVE_VERSION) return null;
  try {
    const { road, field, cleared, ...rest } = o;
    const s = JSON.parse(JSON.stringify(rest));
    attach(s, generate(s.seed), road || [], field || [], cleared || []);
    return s;
  } catch { return null; }
}

// ---------- terrain helpers ----------
export const terrAt = (s, i) => (s.cleared[i] && s.m.terr[i] === T.FOREST ? T.GRASS : s.m.terr[i]);
export const season = (s) => Math.floor((s.day % DAYS_PER_YEAR) / DAYS_PER_SEASON);
export const year = (s) => 1 + Math.floor(s.day / DAYS_PER_YEAR);
export const yearPhase = (s, frac = 0) => ((s.day + frac) % DAYS_PER_YEAR) / DAYS_PER_YEAR;

function footprint(x, y, size) {
  const out = [];
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) out.push([x + dx, y + dy]);
  return out;
}

function ringHas(s, x, y, size, test) {
  for (let yy = y - 1; yy <= y + size; yy++) for (let xx = x - 1; xx <= x + size; xx++) {
    if (xx >= x && xx < x + size && yy >= y && yy < y + size) continue;
    if (inb(xx, yy) && test(idx(xx, yy))) return true;
  }
  return false;
}

function countNear(s, x, y, size, r, test) {
  let c = 0;
  for (let yy = y - r; yy < y + size + r; yy++) for (let xx = x - r; xx < x + size + r; xx++) {
    if (xx >= x && xx < x + size && yy >= y && yy < y + size) continue;
    if (inb(xx, yy) && test(idx(xx, yy))) c++;
  }
  return c;
}

const TERRAIN_TEST = {
  forest: (s) => (i) => terrAt(s, i) === T.FOREST,
  water: (s) => (i) => s.m.terr[i] === T.WATER,
  hill: (s) => (i) => s.m.terr[i] === T.HILL,
  ore: (s) => (i) => !!s.m.ore[i],
  coal: (s) => (i) => !!s.m.coal[i],
  meadow: (s) => (i) => terrAt(s, i) === T.GRASS && !s.road[i] && !s.field[i] && !(s.d && s.d.occ[i]),
};

function touchesRoad(s, x, y, size) {
  for (let k = 0; k < size; k++) {
    for (const [xx, yy] of [[x + k, y - 1], [x + k, y + size], [x - 1, y + k], [x + size, y + k]]) {
      if (inb(xx, yy) && s.road[idx(xx, yy)]) return true;
    }
  }
  return false;
}

// Output bonus a building would get at a spot, with a readable breakdown.
export function bonusAt(s, def, x, y) {
  const parts = [];
  let total = 0;
  for (const bo of def.bonus || []) {
    const n = Math.min(bo.max, countNear(s, x, y, def.size, bo.r, TERRAIN_TEST[bo.t](s)));
    const amt = n * bo.per;
    parts.push({ label: `${bo.label} (${n}/${bo.max})`, amt });
    total += amt;
  }
  const works = def.out || def.knowledge || def.farm;
  if (works && touchesRoad(s, x, y, def.size)) { parts.push({ label: 'Beside a path', amt: 0.1 }); total += 0.1; }
  if (def.craft && s.d) {
    const boosted = s.d.boosters.some((g) => g.kind === 'craft' && Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= g.r);
    if (boosted) { parts.push({ label: 'Guild Hall nearby', amt: 0.25 }); total += 0.25; }
  }
  return { total, parts };
}

// Tiles a service building at (x, y) reaches: a disc around it, plus two tiles either side of connected paths.
export function serviceTiles(s, x, y, size, svc, out = new Uint8Array(N * N)) {
  const cx = x + (size - 1) / 2, cy = y + (size - 1) / 2, rr = (svc.r + 0.5) * (svc.r + 0.5);
  const R = svc.r + 1;
  for (let yy = Math.floor(cy - R); yy <= Math.ceil(cy + R); yy++) for (let xx = Math.floor(cx - R); xx <= Math.ceil(cx + R); xx++) {
    if (inb(xx, yy) && (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= rr) out[idx(xx, yy)] = 1;
  }
  const seen = new Map();
  let frontier = [];
  for (let k = 0; k < size; k++) {
    for (const [xx, yy] of [[x + k, y - 1], [x + k, y + size], [x - 1, y + k], [x + size, y + k]]) {
      if (inb(xx, yy) && s.road[idx(xx, yy)] && !seen.has(idx(xx, yy))) { seen.set(idx(xx, yy), 0); frontier.push([xx, yy]); }
    }
  }
  for (let step = 0; frontier.length && step <= svc.reach; step++) {
    const next = [];
    for (const [fx, fy] of frontier) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inb(fx + dx, fy + dy)) out[idx(fx + dx, fy + dy)] = 1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = fx + dx, ny = fy + dy;
        if (inb(nx, ny) && s.road[idx(nx, ny)] && !seen.has(idx(nx, ny))) { seen.set(idx(nx, ny), step + 1); next.push([nx, ny]); }
      }
    }
    frontier = next;
  }
  return out;
}

// ---------- derived state ----------
export function recompute(s) {
  const d = {
    occ: new Int32Array(N * N), byId: new Map(), cover: {}, beauty: new Uint8Array(N * N),
    caps: Object.fromEntries(RES_KEYS.map((k) => [k, BASE_CAP])), n: Object.fromEntries(Object.keys(B).map((k) => [k, 0])),
    jobs: 0, trade: 0, boosters: [], fieldOn: new Uint8Array(N * N), fieldMult: new Float32Array(N * N), fieldFarm: new Int32Array(N * N),
    roads: 0, fields: 0, rate: (s.d && s.d.rate) || Object.fromEntries(RES_KEYS.map((k) => [k, 0])),
    kRate: (s.d && s.d.kRate) || 0, cRate: (s.d && s.d.cRate) || 0, ratio: (s.d && s.d.ratio) || 1, pop: 0, room: 0,
    starving: !!(s.d && s.d.starving),
  };
  s.d = d;
  for (const k of SERVICE_KEYS) d.cover[k] = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) { if (s.road[i]) d.roads++; if (s.field[i]) d.fields++; }
  d.n.road = d.roads; d.n.field = d.fields;
  for (const b of s.b) {
    const def = B[b.type];
    d.byId.set(b.id, b);
    d.n[b.type]++;
    for (const [x, y] of footprint(b.x, b.y, def.size)) d.occ[idx(x, y)] = b.id;
  }
  for (const b of s.b) {
    const def = B[b.type];
    const complete = !def.wonder || b.stage >= def.stages.length;
    if (def.boost && complete) d.boosters.push({ kind: def.boost.kind, x: b.x, y: b.y, r: def.boost.r, amt: def.boost.amt, id: b.id });
    if (def.service) serviceTiles(s, b.x, b.y, def.size, def.service, d.cover[def.service.type]);
    if (def.beauty && complete) {
      const r = def.beauty.r;
      for (let yy = b.y - r; yy < b.y + def.size + r; yy++) for (let xx = b.x - r; xx < b.x + def.size + r; xx++) if (inb(xx, yy)) d.beauty[idx(xx, yy)] = 1;
    }
    if (def.storage) {
      if (def.storage.all) for (const k of RES_KEYS) { if (k !== 'food' && k !== 'coin') d.caps[k] += def.storage.all; }
      if (def.storage.food) d.caps.food += def.storage.food;
    }
    if (def.trade) d.trade = Math.max(d.trade, def.trade);
    if (def.workers) d.jobs += def.workers;
  }
  d.caps.food += Math.floor(d.n.storehouse * 60 + d.n.warehouse * 150);
  d.caps.coin = 99999;
  for (const b of s.b) {
    const def = B[b.type];
    b.bonus = bonusAt(s, def, b.x, b.y).total;
    if (def.farm) {
      b.fields = 0;
      const r = def.farm.r;
      for (let yy = b.y - r; yy <= b.y + r && b.fields < def.farm.max; yy++) for (let xx = b.x - r; xx <= b.x + r && b.fields < def.farm.max; xx++) {
        if (!inb(xx, yy)) continue;
        const i = idx(xx, yy);
        if (s.field[i] && !d.fieldOn[i]) { d.fieldOn[i] = 1; d.fieldFarm[i] = b.id; b.fields++; }
      }
    }
  }
  for (let i = 0; i < N * N; i++) {
    if (!s.field[i]) continue;
    const x = i % N, y = (i / N) | 0;
    let mult = 1 + (s.m.distWater[i] <= 2 ? 0.3 : 0);
    if (d.boosters.some((g) => g.kind === 'fields' && Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= g.r)) mult += 0.3;
    d.fieldMult[i] = mult;
  }
  s.dirty = false;
  tally(s);
}

function tally(s) {
  let pop = 0, room = 0;
  for (const b of s.b) if (b.type === 'home') { pop += b.pop; room += HOME_LEVELS[b.lvl].cap; }
  s.d.pop = pop; s.d.room = room;
}

export const unlocked = (s, type) => { const def = B[type]; return def.era <= s.era && (!def.disc || !!s.disc[def.disc]); };
export const maxHomeLevel = (s) => { let l = 0; for (let i = 0; i < HOME_LEVELS.length; i++) if (HOME_LEVELS[i].era <= s.era) l = i; return l; };

export function canAfford(s, cost) { for (const k in cost) if ((s.res[k] || 0) < cost[k]) return false; return true; }
export function missing(s, cost) { for (const k in cost) if ((s.res[k] || 0) < cost[k]) return k; return null; }
function pay(s, cost) { for (const k in cost) s.res[k] -= cost[k]; }
function gain(s, k, amt) { s.res[k] = Math.max(0, Math.min(s.d.caps[k], s.res[k] + amt)); }

export function costOf(s, type, x, y) {
  if (type === 'road' && inb(x, y) && s.m.terr[idx(x, y)] === T.WATER) return { wood: 6 };
  return B[type].cost;
}

export function canPlace(s, type, x, y, { free = false } = {}) {
  const def = B[type];
  if (!unlocked(s, type)) return { ok: false, why: 'Not discovered yet' };
  if (def.wonder && s.d.n[type] > 0) return { ok: false, why: 'Already built' };
  for (const [xx, yy] of footprint(x, y, def.size)) {
    if (!inb(xx, yy)) return { ok: false, why: 'Off the map' };
    const i = idx(xx, yy), t = s.m.terr[i];
    if (s.d.occ[i] || s.road[i] || s.field[i]) return { ok: false, why: 'Something is already here' };
    if (t === T.HILL) return { ok: false, why: 'Too rocky to build on' };
    if (t === T.WATER && type !== 'road') return { ok: false, why: 'Needs dry ground' };
  }
  if (def.adj && !ringHas(s, x, y, def.size, TERRAIN_TEST[def.adj](s))) {
    return { ok: false, why: { water: 'Must touch the water', hill: 'Must touch a hill', ore: 'Must touch an ore outcrop', coal: 'Must touch a coal seam' }[def.adj] };
  }
  if (def.near && countNear(s, x, y, def.size, 2, TERRAIN_TEST[def.near](s)) < 1) return { ok: false, why: 'Needs woodland within two tiles' };
  if (!free) { const k = missing(s, costOf(s, type, x, y)); if (k) return { ok: false, why: `Not enough ${k}`, short: k }; }
  return { ok: true };
}

export function place(s, type, x, y) {
  const chk = canPlace(s, type, x, y);
  if (!chk.ok) return null;
  const def = B[type];
  pay(s, costOf(s, type, x, y));
  for (const [xx, yy] of footprint(x, y, def.size)) if (s.m.terr[idx(xx, yy)] === T.FOREST) s.cleared[idx(xx, yy)] = 1;
  let made = true;
  if (type === 'road') s.road[idx(x, y)] = 1;
  else if (type === 'field') s.field[idx(x, y)] = 1;
  else {
    made = { id: s.nextId++, type, x, y, born: s.day };
    if (type === 'home') { made.lvl = 0; made.pop = 1; made.up = 0; made.down = 0; }
    if (def.wonder) made.stage = 0;
    s.b.push(made);
  }
  recompute(s);
  return made;
}

export function buildingAt(s, x, y) { return inb(x, y) ? s.d.byId.get(s.d.occ[idx(x, y)]) || null : null; }

export function refundOf(type) { const out = {}; for (const k in B[type].cost) out[k] = Math.floor(B[type].cost[k] * 0.5); return out; }

export function removeAt(s, x, y) {
  if (!inb(x, y)) return false;
  const i = idx(x, y);
  if (s.road[i]) { s.road[i] = 0; recompute(s); return 'road'; }
  if (s.field[i]) { s.field[i] = 0; recompute(s); return 'field'; }
  const b = buildingAt(s, x, y);
  if (!b || B[b.type].wonder) return false;
  const ref = refundOf(b.type);
  s.b.splice(s.b.indexOf(b), 1);
  recompute(s);
  for (const k in ref) gain(s, k, ref[k]);
  return b.type;
}

export function upgradeOptions(s, b) {
  return Object.values(B).filter((t) => t.from === b.type && unlocked(s, t.id)).map((t) => {
    const cost = {}, ref = refundOf(b.type);
    for (const k in t.cost) { const c = t.cost[k] - (ref[k] || 0); if (c > 0) cost[k] = c; }
    return { type: t.id, cost };
  });
}

export function upgrade(s, b, type) {
  const opt = upgradeOptions(s, b).find((o) => o.type === type);
  if (!opt || !canAfford(s, opt.cost)) return false;
  pay(s, opt.cost);
  b.type = type;
  recompute(s);
  return true;
}

// ---------- wonders, discoveries, festivals, events, trade ----------
export function currentWonder(s) { return s.b.find((b) => B[b.type].wonder && b.stage < B[b.type].stages.length) || null; }

export function contribute(s) {
  const b = currentWonder(s);
  if (!b) return null;
  const def = B[b.type], cost = def.stages[b.stage];
  if (!canAfford(s, cost)) return null;
  pay(s, cost);
  b.stage++;
  recompute(s);
  return { building: b, complete: b.stage >= def.stages.length };
}

// What the town must achieve to enter the next age (or, in the last age, to complete the chronicle).
export function eraGoals(s) {
  const e = ERAS[s.era], w = B[e.wonder], qs = questStats(s);
  const goals = [{ text: `Complete the ${w.name}`, ok: s.b.some((b) => b.type === e.wonder && b.stage >= w.stages.length) }];
  goals.push({ text: `${e.goal.pop} residents`, ok: s.d.pop >= e.goal.pop, have: s.d.pop, want: e.goal.pop });
  if (e.goal.homes) {
    const [l, n] = e.goal.homes;
    goals.push({ text: `${n} homes grown to ${HOME_LEVELS[l].name}`, ok: qs.lv[l] >= n, have: qs.lv[l], want: n });
  }
  return goals;
}

export function canDiscover(s, id) {
  const d = DISC_BY_ID[id];
  if (!d || s.disc[id] || d.era > s.era) return false;
  if ((d.needs || []).some((n) => !s.disc[n])) return false;
  return s.knowledge >= d.cost;
}
export function discover(s, id) {
  if (!canDiscover(s, id)) return false;
  s.knowledge -= DISC_BY_ID[id].cost;
  s.disc[id] = true;
  return true;
}

export const festivalCost = (s) => 25 + s.festivals * 22 + s.festivals * s.festivals * 4;
export const festivalReady = (s) => s.culture >= festivalCost(s);
export function festivalChoices(s) {
  const r = makeRng((s.seed + s.festivals * 9973) >>> 0);
  return r.shuffle(FESTIVALS.filter((f) => (f.minEra || 0) <= s.era)).slice(0, 3);
}
function addPop(s, n) {
  let added = 0;
  for (const b of s.b) {
    if (b.type !== 'home') continue;
    while (added < n && b.pop < HOME_LEVELS[b.lvl].cap) { b.pop++; added++; }
    if (added >= n) break;
  }
  tally(s);
  return added;
}
export function holdFestival(s, id) {
  if (!festivalReady(s) || !festivalChoices(s).some((f) => f.id === id)) return null;
  s.culture -= festivalCost(s);
  s.festivals++;
  const e = s.era;
  let text = '';
  if (id === 'feast') { const a = Math.round(s.d.caps.food * 0.2); gain(s, 'food', a); text = `+${a} food`; }
  if (id === 'fair') { const a = 40 + e * 60; gain(s, 'coin', a); text = `+${a} coin`; }
  if (id === 'stories') { const a = Math.round(15 * Math.pow(2.1, e)); s.knowledge += a; text = `+${a} knowledge`; }
  if (id === 'raising') { const a = 40 + e * 30; gain(s, 'wood', a); gain(s, 'stone', a); text = `+${a} wood and stone`; }
  if (id === 'homecoming') { const a = addPop(s, 6 + e * 4); text = `${a} new residents`; }
  if (id === 'blossom') { s.blossomUntil = s.day + DAYS_PER_YEAR; text = 'Harmony lifted for a year'; }
  return text;
}

export function eventDef(s) { return s.event ? EVENTS.find((e) => e.id === s.event) : null; }
export function optionAffordable(s, opt) { for (const k in opt.give || {}) if ((s.res[k] || 0) < -opt.give[k]) return false; return true; }
export function resolveEvent(s, i) {
  const ev = eventDef(s);
  if (!ev) return null;
  const opt = ev.options[i];
  if (!opt || !optionAffordable(s, opt)) return null;
  const got = [];
  for (const k in opt.give || {}) { s.res[k] += opt.give[k]; got.push(`${opt.give[k]} ${k}`); }
  for (const k in opt.get || {}) {
    const v = opt.get[k];
    if (k === 'knowledge') { s.knowledge += v; got.push(`+${v} knowledge`); }
    else if (k === 'culture') { s.culture += v; got.push(`+${v} culture`); }
    else if (k === 'pop') { const a = addPop(s, v); got.push(`${a} new residents`); }
    else if (k === 'foodPct') { const a = Math.round(s.d.caps.food * v); gain(s, 'food', a); got.push(`+${a} food`); }
    else { gain(s, k, v); got.push(`+${v} ${k}`); }
  }
  s.lastEvent = s.event;
  s.event = null;
  const r = makeRng(s.rng); s.nextEvent = s.day + r.int(150, 250); s.rng = r.state();
  return got.join(', ');
}

export function prices(s, k) {
  const lv = s.d.trade;
  if (!lv || !(k in PRICES)) return null;
  return { sell: PRICES[k] * (lv >= 2 ? 0.75 : 0.6), buy: PRICES[k] * (lv >= 2 ? 1.25 : 1.5) };
}
export function trade(s, k, amt) {            // amt > 0 buys, amt < 0 sells
  const p = prices(s, k);
  if (!p) return false;
  if (amt > 0) {
    const n = Math.min(amt, Math.floor(s.d.caps[k] - s.res[k]), Math.floor(s.res.coin / p.buy));
    if (n <= 0) return false;
    s.res[k] += n; s.res.coin -= n * p.buy; return n;
  }
  const n = Math.min(-amt, Math.floor(s.res[k]));
  if (n <= 0) return false;
  s.res[k] -= n; s.res.coin += n * p.sell; return -n;
}

// ---------- quests ----------
export function questStats(s) {
  const lv = [0, 0, 0, 0, 0, 0, 0];
  for (const b of s.b) if (b.type === 'home') for (let l = 0; l <= b.lvl; l++) lv[l]++;
  return { n: s.d.n, pop: s.d.pop, lv, roads: s.d.roads, fields: s.d.fields, era: s.era,
    discCount: Object.keys(s.disc).length, festivals: s.festivals, done: s.done };
}
export function currentQuest(s) {
  while (s.quest < QUESTS.length && QUESTS[s.quest].era < s.era) s.quest++;
  return s.quest < QUESTS.length ? QUESTS[s.quest] : null;
}

// What a home at tile i could become right now, and what is holding it back.
export function homeTarget(s, b) {
  const i = idx(b.x, b.y), max = maxHomeLevel(s);
  let target = 0, lack = null;
  for (let l = 1; l <= max; l++) {
    const L = HOME_LEVELS[l];
    const need = L.needs.find((n) => !s.d.cover[n][i]);
    if (need) { lack = { service: need, level: l }; break; }
    const good = Object.keys(L.goods).find((g) => s.res[g] < 1);
    if (good) { lack = { good, level: l }; break; }
    target = l;
  }
  return { target, lack, max };
}

export function legacy(s) {
  let lv = 0, wonders = 0;
  for (const b of s.b) { if (b.type === 'home') lv += b.lvl + 1; if (B[b.type].wonder && b.stage >= B[b.type].stages.length) wonders++; }
  return Math.round(s.d.pop * 2 + lv * 3 + Object.keys(s.disc).length * 10 + wonders * 200 + s.festivals * 20 + s.harmony);
}

// ---------- the daily tick ----------
export function tick(s) {
  if (s.dirty) recompute(s);
  const d = s.d, out = [];
  const r = makeRng(s.rng);
  const before = {}; for (const k of RES_KEYS) before[k] = s.res[k];
  const k0 = s.knowledge, c0 = s.culture;
  tally(s);
  const pop = d.pop;
  const ratio = d.jobs > 0 ? Math.min(1, pop / d.jobs) : 1;
  const hf = 0.8 + 0.4 * (s.harmony / 100);
  d.ratio = ratio;
  const farmEff = new Map();

  for (const b of s.b) {
    const def = B[b.type];
    if (def.wonder && b.stage < def.stages.length) { b.eff = 0; continue; }
    let eff = def.workers ? ratio * hf * (1 + (b.bonus || 0)) : 1;
    if (def.in) {
      let f = 1;
      for (const k in def.in) f = Math.min(f, s.res[k] / (def.in[k] * eff || 1e-9));
      f = Math.max(0, Math.min(1, f));
      eff *= f;
      for (const k in def.in) s.res[k] = Math.max(0, s.res[k] - def.in[k] * eff);
    }
    b.eff = eff;
    if (def.out) for (const k in def.out) gain(s, k, def.out[k] * eff);
    if (def.knowledge) s.knowledge += def.knowledge * eff;
    if (def.culture) s.culture += def.culture * eff;
    if (def.farm) farmEff.set(b.id, eff);
  }

  // Fields
  const se = season(s);
  let fieldFood = 0;
  for (let i = 0; i < N * N; i++) {
    if (!d.fieldOn[i]) continue;
    fieldFood += FIELD_YIELD * FIELD_SEASON[se] * d.fieldMult[i] * (farmEff.get(d.fieldFarm[i]) || 0);
  }
  gain(s, 'food', fieldFood);

  // Eating
  const eat = pop * EAT;
  d.starving = s.res.food < eat;
  s.res.food = Math.max(0, s.res.food - eat);

  // Homes
  let needScore = 0, pretty = 0, homes = 0;
  const maxL = maxHomeLevel(s);
  const grow = 0.07 + 0.1 * (s.harmony / 100);
  for (const b of s.b) {
    if (b.type !== 'home') continue;
    homes++;
    const { target } = homeTarget(s, b);
    if (target > b.lvl) { b.down = 0; if (++b.up >= 5) { b.lvl++; b.up = 0; out.push({ type: 'homeUp', b }); } }
    else if (target < b.lvl) { b.up = 0; if (++b.down >= 36) { b.lvl--; b.down = 0; b.pop = Math.min(b.pop, HOME_LEVELS[b.lvl].cap); out.push({ type: 'homeDown', b }); } }
    else { b.up = 0; b.down = 0; }
    const L = HOME_LEVELS[b.lvl];
    for (const g in L.goods) s.res[g] = Math.max(0, s.res[g] - L.goods[g]);
    if (!d.starving && b.pop < L.cap && r.chance(grow)) b.pop++;
    else if (d.starving && b.pop > 1 && r.chance(0.05)) b.pop--;
    needScore += (b.lvl + 1) / (maxL + 1);
    const nice = d.beauty[idx(b.x, b.y)];
    if (nice) pretty++;
    if (s.era >= 1) s.res.coin += b.pop * 0.012 * (1 + 0.25 * b.lvl) * (nice ? 1.25 : 1);
  }

  // Harmony drifts toward what the town deserves.
  let h = 45;
  if (homes) h += 25 * (needScore / homes) + 12 * (pretty / homes);
  if (d.starving) h -= 18; else if (s.res.food > eat * 20) h += 8;
  if (s.day < s.blossomUntil) h += 10;
  if (d.jobs > 0 && ratio < 0.7) h -= 4;
  h = Math.max(5, Math.min(100, h));
  s.harmony += (h - s.harmony) * 0.04;

  // Rates for the HUD (smoothed).
  for (const k of RES_KEYS) d.rate[k] += ((s.res[k] - before[k]) - d.rate[k]) * 0.15;
  d.kRate += ((s.knowledge - k0) - d.kRate) * 0.15;
  d.cRate += ((s.culture - c0) - d.cRate) * 0.15;

  s.day++;
  if (season(s) !== se) out.push({ type: 'season', season: season(s) });

  // Quests
  const qs = questStats(s);
  for (let guard = 0; guard < 4; guard++) {
    const q = currentQuest(s);
    if (!q || !q.c(qs)) break;
    for (const k in q.reward) gain(s, k, q.reward[k]);
    s.quest++;
    out.push({ type: 'quest', quest: q });
  }

  // A new age dawns when the wonder stands and the town has grown into it.
  if (!s.done && eraGoals(s).every((g) => g.ok)) {
    if (s.era < ERAS.length - 1) { s.era++; s.eraDays.push(s.day); out.push({ type: 'era', era: s.era }); }
    else { s.done = true; s.doneDay = s.day; out.push({ type: 'finale' }); }
  }

  // Happenings
  if (!s.event && s.day >= s.nextEvent) {
    const pool = EVENTS.filter((e) => e.minEra <= s.era && e.id !== s.lastEvent && e.options.some((o) => optionAffordable(s, o))
      && !(e.options.some((o) => o.get && o.get.pop) && d.room - d.pop < 4));
    if (pool.length) { s.event = r.pick(pool).id; out.push({ type: 'event' }); }
    else s.nextEvent = s.day + 30;
  }
  s.rng = r.state();
  tally(s);
  return out;
}
