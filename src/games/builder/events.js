// Random events, fires, trading ships and relief ships. Pure.
import { T, D, BUILDINGS, RES, RES_INFO, RES_TIER, SHIP_NAMES, SHIP_PORTS, FOUNDERS, DIFFICULTY } from './data.js';
import { cache, def, isComplete, forDisc, isWater, nearWaterTile, touch, baseCost, rates, countOf } from './world.js';

export function log(s, text, kind = 'info') {
  s.log.push({ t: Math.round(s.t), text, kind });
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
}
function say(s, out, text, kind, sound) {
  log(s, text, kind);
  out.push({ type: 'toast', text, kind, sound });
}
function addRes(s, k, n) {
  const cap = cache(s).caps[k];
  s.res[k] = Math.min(cap, (s.res[k] || 0) + n);
}
const diffOf = (s) => DIFFICULTY[s.difficulty] || DIFFICULTY.standard;
const done = (s, types) => s.buildings.filter((b) => isComplete(b) && (!types || types.includes(b.type)));
const hasLighthouse = (s) => s.buildings.some((b) => b.type === 'lighthouse' && isComplete(b) && b.workers > 0);

export function removeBuilding(s, b) {
  const i = s.buildings.indexOf(b);
  if (i >= 0) s.buildings.splice(i, 1);
  touch(s);
}

// ---- Event table ----
const EVENTS = [
  {
    id: 'storm', bad: true, w: 10,
    when: (s) => done(s).length > 4,
    run(s, r, out) {
      const lh = hasLighthouse(s);
      const scale = diffOf(s).badScale;
      let n = Math.round(r.int(1, 3) * scale * (lh ? 0.5 : 1));
      const cands = done(s).filter((b) => b.type !== 'townhall' && !b.damaged);
      const coastal = cands.filter((b) => nearWaterTile(s, b.x, b.y, 2));
      const pool = r.shuffle(coastal.length >= n ? coastal : cands);
      const hit = pool.slice(0, n);
      hit.forEach((b) => { b.damaged = true; });
      if (hit.length) touch(s);
      const names = hit.map((b) => BUILDINGS[b.type].name);
      say(s, out, hit.length
        ? `A howling storm rolls in off the sea. It wrecks ${listNames(names)}. Tap a damaged building to repair it.`
        : 'A storm lashes the island, but the lighthouse keepers had everyone battened down in time.', 'bad', 'bad');
      out.push({ type: 'fx', kind: 'storm' });
    },
  },
  {
    id: 'fire', bad: true, w: 8,
    when: (s) => done(s).filter((b) => BUILDINGS[b.type].flammable !== false).length > 3,
    run(s, r, out) {
      const c = cache(s);
      const cands = done(s).filter((b) => BUILDINGS[b.type].flammable !== false && !b.fire);
      const exposed = cands.filter((b) => !c.cov.well[b.y * s.W + b.x]);
      const b = r.pick(exposed.length && r.chance(0.75) ? exposed : cands);
      if (!b) return;
      b.fire = 0.01;
      touch(s);
      const covered = c.cov.well[b.y * s.W + b.x];
      say(s, out, covered
        ? `A spark catches at the ${BUILDINGS[b.type].name}! The bucket line from the well is already running.`
        : `Fire at the ${BUILDINGS[b.type].name}! With no well in range it may spread to its neighbours.`, 'bad', 'bad');
    },
  },
  {
    id: 'crabs', bad: true, w: 6,
    when: (s) => countOf(s, 'fishing') + countOf(s, 'farm') + countOf(s, 'forager') > 0,
    run(s, r, out) {
      s.effects.push({ kind: 'mult', types: ['fishing', 'farm', 'forager'], mult: 0.4, until: s.t + 75, coastOnly: true, label: 'Crab plague' });
      const lost = Math.floor((s.res.food || 0) * 0.1 * diffOf(s).badScale);
      s.res.food -= lost;
      say(s, out, `A plague of crabs swarms up the beaches, nipping at nets and nibbling the stores${lost ? ` (${lost} food lost)` : ''}. Shoreline food work is slowed for a while.`, 'bad', 'bad');
    },
  },
  {
    id: 'rats', bad: true, w: 5,
    when: (s) => (s.res.food || 0) + (s.res.grain || 0) > 40,
    run(s, r, out) {
      const f = Math.floor((s.res.food || 0) * 0.2 * diffOf(s).badScale);
      const g = Math.floor((s.res.grain || 0) * 0.2 * diffOf(s).badScale);
      s.res.food -= f; s.res.grain = (s.res.grain || 0) - g;
      say(s, out, `Rats got into the stores overnight. They ate ${f} food${g ? ` and ${g} grain` : ''} and look very pleased about it.`, 'bad', 'bad');
    },
  },
  {
    id: 'fever', bad: true, w: 4,
    when: (s) => s.pop > 25,
    run(s, r, out) {
      const c = cache(s);
      let lose = 0;
      for (const b of s.buildings) {
        if (!b.res) continue;
        const safe = c.cov.shrine[b.y * s.W + b.x];
        lose += b.res * 0.07 * (safe ? 0.5 : 1) * diffOf(s).badScale;
      }
      lose = Math.max(1, Math.min(s.pop - FOUNDERS, Math.round(lose)));
      if (lose <= 0) return;
      s.pop -= lose;
      say(s, out, `Marsh fever spreads through the town and ${lose} people leave on the next boat. Shrines halve the losses in their range.`, 'bad', 'bad');
    },
  },
  {
    id: 'drought', bad: true, w: 5,
    when: (s) => countOf(s, 'farm') + countOf(s, 'pasture') > 0,
    run(s, r, out) {
      s.effects.push({ kind: 'mult', types: ['farm', 'pasture', 'forager'], mult: 0.5, until: s.t + 90, wellSafe: true, label: 'Drought' });
      say(s, out, 'A dry spell bakes the fields. Farms and pastures yield half, except those a well can water.', 'bad', 'bad');
    },
  },
  {
    id: 'harvest', w: 6,
    when: (s) => countOf(s, 'farm') + countOf(s, 'forager') > 0,
    run(s, r, out) {
      s.effects.push({ kind: 'mult', types: ['farm', 'forager', 'pasture'], mult: 2, until: s.t + 60, label: 'Bountiful season' });
      say(s, out, 'Sun and soft rain in perfect measure: a bountiful season! Fields and foragers yield double for a while.', 'good', 'good');
    },
  },
  {
    id: 'settlers', w: 7,
    when: () => true,
    run(s, r, out) {
      const room = Math.max(0, (s.housing || 0) - s.pop);
      const n = Math.min(room, r.int(3, 6));
      if (n > 0) {
        s.pop += n;
        say(s, out, `A boat of ${n} weary settlers rows ashore and asks for a roof. Welcome to ${s.name}!`, 'good', 'good');
      } else {
        say(s, out, 'A boat of settlers circles the bay, sees no empty houses, and rows on. More homes would have kept them.', 'info', 'tap');
      }
    },
  },
  {
    id: 'wreck', w: 5,
    when: () => true,
    run(s, r, out) {
      const p = r.int(6, 14), g = r.int(10, 25);
      addRes(s, 'planks', p); addRes(s, 'gold', g);
      say(s, out, `The tide brings in a shipwreck. Salvagers haul up ${p} planks and a sea chest with ${g} gold.`, 'good', 'coin');
    },
  },
  {
    id: 'whale', w: 4,
    when: () => true,
    run(s, r, out) {
      const f = r.int(20, 35);
      addRes(s, 'food', f);
      say(s, out, `A whale beaches itself on the sands. Grim work, but it is ${f} food for the stores.`, 'good', 'good');
    },
  },
  {
    id: 'festival', w: 5,
    when: (s) => s.buildings.some((b) => b.type === 'tavern' && b.status === 'ok'),
    run(s, r, out) {
      s.effects.push({ kind: 'happy', amount: 15, until: s.t + 90, label: 'Festival' });
      say(s, out, 'The taverns throw a harvest festival. There is dancing on the quay and happiness is up for a while.', 'good', 'good');
    },
  },
  {
    id: 'vein', w: 3,
    when: (s) => s.tier >= 2,
    run(s, r, out) {
      const c = cache(s);
      const cands = [];
      for (let i = 0; i < s.W * s.H; i++) if (s.terrain[i] === T.HILL && s.deposit[i] === D.NONE && c.occ[i] < 0) cands.push(i);
      if (!cands.length) return;
      const reach = cands.filter((i) => c.reach[i]);
      const i = r.pick(reach.length ? reach : cands);
      s.deposit[i] = D.ORE;
      touch(s);
      s.terrainVer = (s.terrainVer || 0) + 1;
      out.push({ type: 'terrain' });
      say(s, out, `Prospectors poking about the hills find a fresh ore vein at ${i % s.W},${(i / s.W) | 0}.`, 'good', 'coin');
    },
  },
  {
    id: 'shoal', w: 3,
    when: () => true,
    run(s, r, out) {
      const c = cache(s);
      const cands = [];
      for (let i = 0; i < s.W * s.H; i++) {
        if (s.terrain[i] !== T.SHALLOW || s.deposit[i] !== D.NONE) continue;
        let near = false;
        forDisc(s, i % s.W, (i / s.W) | 0, 2, (x, y, j) => { if (c.reach[j] && !isWater(s.terrain[j])) near = true; });
        if (near) cands.push(i);
      }
      if (!cands.length) return;
      const i = r.pick(cands);
      s.deposit[i] = D.FISH;
      touch(s);
      s.terrainVer = (s.terrainVer || 0) + 1;
      out.push({ type: 'terrain' });
      say(s, out, 'Gulls are diving off the coast: a new shoal of fish has moved into the shallows.', 'good', 'good');
    },
  },
  {
    id: 'winds', w: 3,
    when: (s) => s.buildings.some((b) => b.type === 'dock' && isComplete(b)) && !s.ship,
    run(s, r, out) {
      s.nextShipAt = Math.min(s.nextShipAt, s.t + 5);
      say(s, out, 'Fair winds blow from the south. A sail is already on the horizon.', 'good', 'tap');
    },
  },
];

function listNames(names) {
  if (names.length <= 1) return 'the ' + (names[0] || 'shed');
  return 'the ' + names.slice(0, -1).join(', the ') + ' and the ' + names[names.length - 1];
}

export function eventsTick(s, r, out, dt) {
  // Expire effects.
  for (let i = s.effects.length - 1; i >= 0; i--) if (s.effects[i].until <= s.t) {
    const e = s.effects[i];
    s.effects.splice(i, 1);
    if (e.label) log(s, `${e.label} has passed.`, 'info');
  }
  fireTick(s, r, out, dt);
  shipTick(s, r, out);
  if (Math.floor(s.t / 5) !== Math.floor((s.t - dt) / 5)) reliefTick(s, out);
  if (s.t >= s.nextEventAt) {
    const diff = diffOf(s);
    s.nextEventAt = s.t + r.float(diff.eventGap[0], diff.eventGap[1]);
    const early = s.t < 360 || s.pop < 15;
    const pool = EVENTS.filter((e) => e.when(s) && !(early && e.bad));
    const entries = pool.map((e) => [e, e.bad ? e.w * diff.badScale : e.w]);
    if (entries.length) {
      const e = r.weighted(entries);
      e.run(s, r, out);
      s.stats.events++;
    }
  }
}

function fireTick(s, r, out, dt) {
  const c = cache(s);
  const diff = diffOf(s);
  const burning = s.buildings.filter((b) => b.fire > 0);
  for (const b of burning) {
    const before = b.fire;
    b.fire += dt;
    const covered = c.cov.well[b.y * s.W + b.x];
    const name = BUILDINGS[b.type].name;
    if (covered && b.fire >= 3) {
      b.fire = 0;
      b.damaged = r.chance(0.5);
      touch(s);
      say(s, out, `The bucket line douses the fire at the ${name}${b.damaged ? ', though it is badly scorched' : ' before it does any harm'}.`, 'info', 'tap');
      continue;
    }
    if (covered) continue;
    if (Math.floor(b.fire / 4) !== Math.floor(before / 4)) {
      for (const n of s.buildings) {
        if (n === b || n.fire > 0 || !isComplete(n) || BUILDINGS[n.type].flammable === false) continue;
        if (Math.abs(n.x - b.x) > 1 || Math.abs(n.y - b.y) > 1) continue;
        if (r.chance(0.35 * diff.badScale)) { n.fire = 0.01; touch(s); }
      }
    }
    if (b.fire >= 14) {
      b.fire = 0;
      if (diff.fireDestroys && b.type !== 'charter') {
        removeBuilding(s, b);
        say(s, out, `The ${name} burns to the ground. A well nearby would have saved it.`, 'bad', 'explode');
      } else {
        b.damaged = true; touch(s);
        say(s, out, `The fire at the ${name} burns itself out, leaving it charred and in need of repair.`, 'bad', 'bad');
      }
    }
  }
}

// ---- Trading ships ----
function shipTick(s, r, out) {
  const dock = s.buildings.find((b) => b.type === 'dock' && isComplete(b));
  if (!dock) {
    if (s.ship) { s.ship = null; }
    s.nextShipAt = -1;
    return;
  }
  if (s.nextShipAt < 0) s.nextShipAt = s.t + 30;
  if (s.ship && s.t >= s.ship.leave) {
    const traded = s.ship.deals.some((d) => d.done);
    log(s, `The ${s.ship.name} weighs anchor${traded ? ' with a full hold' : ''}.`, 'info');
    s.ship = null;
    s.nextShipAt = s.t + r.float(90, 150) * (hasLighthouse(s) ? 0.7 : 1);
    return;
  }
  if (!s.ship && s.t >= s.nextShipAt && dock.workers > 0 && !dock.damaged) {
    s.ship = makeShip(s, r);
    say(s, out, `The ${s.ship.name} out of ${s.ship.port} has tied up at the dock with goods to trade.`, 'good', 'coin');
    out.push({ type: 'ship' });
  }
}

export function makeShip(s, r) {
  const diff = diffOf(s);
  const avail = RES.filter((k) => k !== 'gold' && RES_TIER[k] <= s.tier);
  const cap = cache(s).caps;
  const deals = [];
  const stockList = avail.filter((k) => (s.res[k] || 0) >= 10);
  const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
  // A sale of something you hold.
  if (stockList.length) {
    const k = r.weighted(stockList.map((k) => [k, s.res[k] * RES_INFO[k].value]));
    const amt = round5(Math.min(40, s.res[k] * r.float(0.3, 0.6)));
    deals.push({ give: { [k]: amt }, get: { gold: Math.max(1, Math.round(amt * RES_INFO[k].value * r.float(0.75, 1.1) * diff.trade)) } });
  }
  // A purchase.
  {
    const k = r.pick(avail);
    const amt = round5(r.int(8, 25));
    deals.push({ give: { gold: Math.max(2, Math.round(amt * RES_INFO[k].value * r.float(1.15, 1.6) / diff.trade)) }, get: { [k]: amt } });
  }
  // Barters and extras.
  const extra = hasLighthouse(s) ? 2 : 1;
  for (let n = 0; n < extra; n++) {
    const give = stockList.length ? r.pick(stockList) : r.pick(avail);
    const others = avail.filter((k) => k !== give);
    const get = r.pick(others);
    const amt = round5(Math.min(30, Math.max(10, (s.res[give] || 10) * r.float(0.3, 0.6))));
    const back = Math.max(1, Math.round(amt * RES_INFO[give].value / RES_INFO[get].value * r.float(0.8, 1.15) * diff.trade));
    if (r.chance(0.35)) {
      const kk = r.pick(avail);
      const a2 = round5(r.int(10, 30));
      deals.push({ give: { [kk]: a2 }, get: { gold: Math.max(1, Math.round(a2 * RES_INFO[kk].value * r.float(0.8, 1.2) * diff.trade)) } });
    } else deals.push({ give: { [give]: amt }, get: { [get]: back } });
  }
  void cap;
  return { name: r.pick(SHIP_NAMES), port: r.pick(SHIP_PORTS), arrive: s.t, leave: s.t + 80, deals: deals.map((d) => ({ ...d, done: false })) };
}

// ---- Relief: the mainland never lets the colony fail outright ----
function reliefTick(s, out) {
  const diff = diffOf(s);
  if (s.t - s.reliefAt < diff.reliefGap || s.t < 60) return;
  const rt = rates(s);
  const lowFood = (s.res.food || 0) < 8 && rt.food <= 0;
  const lowWood = (s.res.wood || 0) < 6 && rt.wood <= 1.6;
  const lowStone = (s.res.stone || 0) < 4 && !s.buildings.some((b) => b.type === 'quarry') && (s.res.wood || 0) < 15;
  if (!lowFood && !lowWood && !lowStone) return;
  s.reliefAt = s.t;
  const parts = [];
  if (lowFood) { addRes(s, 'food', 35); parts.push('35 food'); }
  if (lowWood || lowStone) { addRes(s, 'wood', 25); parts.push('25 wood'); }
  if (lowStone || (s.res.stone || 0) < 6) { addRes(s, 'stone', 10); parts.push('10 stone'); }
  say(s, out, `A relief ship from the mainland drops off ${parts.join(', ')}. The governor sends regards and a stern letter.`, 'good', 'good');
  out.push({ type: 'relief' });
}

export function acceptDeal(s, i) {
  const ship = s.ship;
  if (!ship) return { ok: false, reason: 'No ship in port' };
  const d = ship.deals[i];
  if (!d || d.done) return { ok: false, reason: 'Deal is gone' };
  for (const k in d.give) if ((s.res[k] || 0) < d.give[k]) return { ok: false, reason: `Not enough ${RES_INFO[k].name.toLowerCase()}` };
  for (const k in d.give) s.res[k] -= d.give[k];
  for (const k in d.get) {
    addRes(s, k, d.get[k]);
    if (k === 'gold') s.stats.goldEarned += d.get[k];
  }
  d.done = true;
  s.stats.trades++;
  log(s, `Traded with the ${ship.name}.`, 'good');
  return { ok: true };
}

export function repairCost(b) {
  const c = baseCost(b);
  const out = {};
  for (const k in c) out[k] = Math.max(1, Math.ceil(c[k] * 0.4));
  return out;
}
void def;
