// Node test for the pure Tidewater modules:  node src/games/builder/sim.test.mjs [--long]
// Generates islands, runs a greedy bot, checks invariants and save round-trips.
import { generateIsland } from './gen.js';
import { T, D, BUILDINGS, RES, MILESTONES, TICK, SIZES } from './data.js';
import {
  newGame, tick, build, upgrade, upgradeInfo, repair, acceptDeal, serialize, deserialize, canPlace, canAfford,
  goalProgress, startEndless, demolish,
} from './sim.js';
import { cache, rates, siteMult, forDisc, isComplete, countOf } from './world.js';

const LONG = process.argv.includes('--long');
let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL:', msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

// ---------- 1. Generation ----------
const seeds = [1, 2, 3, 42, 777, 'banana', 'tidewater', 99991, 31337, 'x'];
for (const size of Object.keys(SIZES)) for (const difficulty of ['gentle', 'standard', 'harsh']) for (const seed of seeds) {
  const g = generateIsland({ seed, size, difficulty });
  const n = g.W * g.H;
  let build = 0, ore = 0, fert = 0, fish = 0, forest = 0, hill = 0;
  for (let i = 0; i < n; i++) {
    const t = g.terrain[i];
    if (t >= T.SAND && t <= T.HILL) build++;
    if (t === T.FOREST) forest++;
    if (t === T.HILL) hill++;
    if (g.deposit[i] === D.ORE) { ore++; ok(t === T.HILL, `ore off hill ${seed}`); }
    if (g.deposit[i] === D.FERTILE) fert++;
    if (g.deposit[i] === D.FISH) { fish++; ok(t === T.SHALLOW || t === T.DEEP, `fish on land ${seed}`); }
  }
  const tag = `${size}/${difficulty}/${seed}`;
  ok(g.W >= 28 && g.W <= 40, `size ${tag}`);
  ok(build >= n * 0.25, `buildable land ${build}/${n} ${tag}`);
  ok(ore >= 4 && fert >= 8 && fish >= 4 && forest >= 30 && hill >= 12, `deposits ore${ore} fert${fert} fish${fish} forest${forest} hill${hill} ${tag}`);
  ok(g.start && g.terrain[g.start.y * g.W + g.start.x] === T.GRASS, `start tile ${tag}`);
  ok(JSON.stringify(g) === JSON.stringify(generateIsland({ seed, size, difficulty })), `determinism ${tag}`);
  // First buildings must be placeable from the start.
  const s = newGame({ seed, size, difficulty });
  let wc = 0, fh = 0, hs = 0;
  for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
    if (canPlace(s, 'woodcutter', x, y).ok) wc++;
    if (canPlace(s, 'fishing', x, y).ok) fh++;
    if (canPlace(s, 'house', x, y).ok) hs++;
  }
  ok(wc >= 3 && fh >= 2 && hs >= 20, `starting sites wc${wc} fish${fh} house${hs} ${tag}`);
}
console.log('generation checks done');

// ---------- 2. Bot ----------
function tilesOk(s, type) {
  const out = [];
  for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) if (canPlace(s, type, x, y).ok) out.push([x, y]);
  return out;
}
const SERVICE_TYPES = ['well', 'market', 'tavern', 'shrine'];
function scoreSite(s, type, x, y) {
  const c = cache(s);
  const d = BUILDINGS[type];
  const th = s.start;
  const dist = Math.hypot(x - th.x, y - th.y);
  if (d.site) return siteMult(s, c, type, x, y, true).mult * 10 - dist * 0.05;
  if (type === 'house') {
    const i = y * s.W + x;
    let v = 10 - dist * 0.3;
    if (c.noise[i]) v -= 8;
    if (s.terrain[i] === T.FOREST) v -= 4;
    if (s.deposit[i] !== D.NONE) v -= 6;
    for (const k of SERVICE_TYPES) if (c.cov[k][i]) v += 3;
    let nearSvc = 0;
    for (const b of s.buildings) if (BUILDINGS[b.type].service && Math.hypot(b.x - x, b.y - y) <= 3) nearSvc++;
    return v + nearSvc;
  }
  if (d.service) {
    let v = 0;
    forDisc(s, x, y, d.radius, (nx, ny, i) => {
      const id = c.occ[i];
      if (id < 0) return;
      const b = c.byId.get(id);
      if (b.type === 'house' && !c.cov[d.service][i]) v += 3;
      else if (b.type === 'house') v += 0.5;
    });
    return v - dist * 0.02;
  }
  if (type === 'warehouse') {
    // Prefer spots that extend reach over new buildable land.
    let v = 0;
    forDisc(s, x, y, d.reach, (nx, ny, i) => { if (!c.reach[i] && s.terrain[i] >= T.SAND && s.terrain[i] <= T.HILL) v += s.deposit[i] === D.ORE && s.tier >= 3 ? 12 : 1; });
    return v;
  }
  if (d.noise) return dist * 0.2;
  return -dist;
}
function tryBuild(s, type) {
  if (BUILDINGS[type].tier > s.tier) return false;
  if (!canAfford(s, BUILDINGS[type].cost)) return false;
  if (BUILDINGS[type].workers > s.idle) return false;
  const sites = tilesOk(s, type);
  if (!sites.length) return false;
  let best = null, bv = -Infinity;
  for (const [x, y] of sites) {
    const v = scoreSite(s, type, x, y);
    if (v > bv) { bv = v; best = [x, y]; }
  }
  if (BUILDINGS[type].site && bv < 4) return false;
  const r = build(s, type, best[0], best[1]);
  return r.ok;
}
const cnt = (s, type) => countOf(s, type);

function botStep(s) {
  const r = rates(s);
  const caps = cache(s).caps;
  for (const b of s.buildings) if (b.damaged && !b.fire) repair(s, b.id);
  // Trade: sell surplus, buy what is short.
  if (s.ship) s.ship.deals.forEach((d, i) => {
    if (d.done) return;
    const giveK = Object.keys(d.give)[0], getK = Object.keys(d.get)[0];
    const have = s.res[giveK] || 0;
    const surplus = giveK === 'gold' ? have > 60 : have > caps[giveK] * 0.5;
    const wanted = getK === 'gold' || (s.res[getK] || 0) < caps[getK] * 0.4;
    if (surplus && wanted) acceptDeal(s, i);
  });
  const free = s.housing - s.pop;
  const building = s.buildings.some((b) => b.prog < 1);
  if (building && s.buildings.filter((b) => b.prog < 1).length > 2) return;
  const plan = [];
  if (s.res.wood < 12 && r.wood < 8) plan.push('woodcutter', 'forester');
  const foodNeed = r.food < Math.max(3, s.pop * 0.12) || s.res.food < 15;
  if (foodNeed) {
    if (s.tier >= 2 && cnt(s, 'farm') <= cnt(s, 'bakery') * 1.3) plan.push('farm');
    if (s.tier >= 2 && cnt(s, 'farm') > cnt(s, 'bakery') * 1.2) plan.push('bakery');
    plan.push('fishing');
    if (cnt(s, 'forager') < 3 || s.tier < 2) plan.push('forager');
  }
  if (r.wood < 4 + s.pop * 0.1 || s.res.wood < 15) plan.push('woodcutter');
  if (cnt(s, 'forester') < Math.ceil(cnt(s, 'woodcutter') / 2)) plan.push('forester');
  if (free < 3 && (s.res.food > 10 || s.idle < 2)) plan.unshift('house');
  if ((r.stone < 3 || s.res.stone < 10) && cnt(s, 'quarry') < 3) plan.push('quarry');
  if (s.buildings.filter((b) => b.type === 'house').length > 3 && cnt(s, 'well') < 1 + Math.floor(cnt(s, 'house') / 8)) plan.push('well');
  if (s.tier >= 2) {
    if ((r.planks < 6 || s.res.planks < 30) && cnt(s, 'sawmill') < 2 + s.pop / 80) plan.push('sawmill');
    if (cnt(s, 'market') < 1 + Math.floor(cnt(s, 'house') / 10)) plan.push('market');
    if (!cnt(s, 'dock')) plan.push('dock');
    if (s.tier >= 2 && r.cloth < 1 + cnt(s, 'house') * 0.2 && s.mi >= 6) {
      if (r.wool < 3 || cnt(s, 'weaver') * 2 >= cnt(s, 'pasture')) plan.push('pasture'); else plan.push('weaver');
    }
  }
  if (s.tier >= 3) {
    if (cnt(s, 'mine') < 2 && r.ore < 3) { plan.push('mine'); if (!tilesOk(s, 'mine').length) plan.push('warehouse'); }
    if (cnt(s, 'mine') && (cnt(s, 'smelter') < 1 || (r.iron < 1 && s.res.ore > 20 && cnt(s, 'smelter') < 3))) plan.push('smelter');
    if (cnt(s, 'toolsmith') < 1 || (r.tools < 1 && s.res.iron > 15 && cnt(s, 'toolsmith') < 3)) plan.push('toolsmith');
    if (cnt(s, 'tavern') < 1 + Math.floor(cnt(s, 'house') / 12)) plan.unshift('tavern');
    if (r.ale < 1 && cnt(s, 'brewery') < cnt(s, 'tavern') + 1) plan.push('brewery', 'farm');
    if (cnt(s, 'shrine') < Math.floor(cnt(s, 'house') / 12)) plan.push('shrine');
  }
  if (s.tier >= 4) {
    // Save up for the charter: build it first, keep a warehouse for the gold, make tools and cloth.
    plan.unshift('charter');
    if (!cnt(s, 'warehouse')) plan.push('warehouse');
    if (r.tools < 2 && cnt(s, 'toolsmith') < 3) plan.push('toolsmith');
    if (r.cloth < 2 && cnt(s, 'weaver') < 4) plan.push('weaver', 'pasture');
    if (!cnt(s, 'lighthouse') && s.res.tools > 40) plan.push('lighthouse');
  }
  const nearCap = RES.some((k) => k !== 'gold' && s.res[k] > caps[k] * 0.9);
  if (nearCap || tilesOk(s, 'house').length < 6 || (s.tier >= 3 && cnt(s, 'warehouse') < 2)) plan.push('warehouse');
  for (const t of plan) if (tryBuild(s, t)) return;
  // Upgrades: houses first, then producers.
  for (const b of s.buildings) {
    if (b.type !== 'house') continue;
    const u = upgradeInfo(s, b);
    if (u && u.ok && (b.level === 1 || (s.res.cloth > 5 && s.tier < 4) || s.buildings.filter((h) => h.type === 'house' && h.level >= 3).length < 4)) { upgrade(s, b.id); return; }
  }
  if (s.tier === 3) for (const b of s.buildings) {
    const u = upgradeInfo(s, b);
    if (u && u.ok && b.type !== 'house' && s.res.tools > 12) { upgrade(s, b.id); return; }
  }
  if (free < 6 && s.res.food > 20) tryBuild(s, 'house');
}

function checkInvariants(s, tag) {
  const caps = cache(s).caps;
  for (const k of RES) {
    const v = s.res[k];
    if (!Number.isFinite(v) || v < 0) { fail(`${tag}: ${k} = ${v}`); return false; }
    if (v > caps[k] + 1e-6) { fail(`${tag}: ${k} ${v} over cap ${caps[k]}`); return false; }
  }
  if (!Number.isInteger(s.pop) || s.pop < 4) { fail(`${tag}: pop ${s.pop}`); return false; }
  if (!Number.isFinite(s.happy)) { fail(`${tag}: happy NaN`); return false; }
  for (const b of s.buildings) if (!Number.isFinite(b.work) || !Number.isFinite(b.prog)) { fail(`${tag}: building NaN`); return false; }
  return true;
}

function runBot(seed, size, difficulty, minutes) {
  const s = newGame({ seed, size, difficulty });
  const tag = `${seed}/${size}/${difficulty}`;
  const times = {};
  const ticks = Math.round(minutes * 60 / TICK);
  let roundTripped = false;
  for (let i = 0; i < ticks; i++) {
    let out;
    try { out = tick(s, []); } catch (e) { fail(`${tag}: exception ${e.stack}`); return null; }
    for (const m of out) if (m.type === 'milestone' && !times[m.id]) times[m.id] = Math.round(s.t / 60);
    if (i % 12 === 0) { try { botStep(s); } catch (e) { fail(`${tag}: bot exception ${e.stack}`); return null; } }
    if (i % 40 === 0 && !checkInvariants(s, tag)) return null;
    if (s.charter && !s.endless) startEndless(s);
    if (!roundTripped && s.t > minutes * 30) {
      roundTripped = true;
      const json = JSON.stringify(serialize(s));
      const s2 = deserialize(JSON.parse(json));
      ok(s2 && JSON.stringify(s2) === JSON.stringify(s), `${tag}: round-trip differs`);
      // Both copies must evolve identically (no hidden state outside the save).
      const s3 = deserialize(JSON.parse(JSON.stringify(serialize(s))));
      const a = JSON.parse(JSON.stringify(s));
      for (let k = 0; k < 2000; k++) { tick(a); tick(s3); }
      ok(JSON.stringify(a) === JSON.stringify(s3), `${tag}: replay after load diverges`);
    }
  }
  return { s, times };
}

const runs = LONG
  ? [[1, 'small', 'gentle'], [2, 'medium', 'standard'], [3, 'large', 'standard'], [4, 'medium', 'harsh'], ['coral', 'small', 'standard'], [77, 'large', 'harsh']]
  : [[1, 'small', 'gentle'], [2, 'medium', 'standard'], [4, 'medium', 'harsh'], ['coral', 'large', 'standard']];
const minutes = LONG ? 150 : 90;
for (const [seed, size, difficulty] of runs) {
  const res = runBot(seed, size, difficulty, minutes);
  if (!res) continue;
  const { s, times } = res;
  const reached = MILESTONES.slice(0, s.mi).map((m) => `${m.id}@${times[m.id] ?? '?'}m`).join(' ');
  const counts = {};
  s.buildings.forEach((b) => { counts[b.type] = (counts[b.type] || 0) + 1; });
  console.log(`${seed}/${size}/${difficulty}: pop ${s.pop}/${s.housing} happy ${Math.round(s.happy)} tier ${s.tier} trades ${s.stats.trades} events ${s.stats.events}` +
    (s.charter ? ` CHARTER score ${s.charter.score} at ${Math.round(s.charter.t / 60)}m` : ''));
  console.log('   milestones:', reached);
  console.log('   buildings:', JSON.stringify(counts));
  console.log('   res:', RES.map((k) => `${k}:${Math.floor(s.res[k])}`).join(' '));
  if (s.tier >= 4 && !s.charter) {
    const sites = tilesOk(s, 'charter').length;
    let why = '';
    for (let y = 0; y < s.H && !why; y++) for (let x = 0; x < s.W && !why; x++) { const p = canPlace(s, 'charter', x, y); if (!p.ok && p.reason !== 'Tile is occupied' && !p.reason.startsWith('Out') && !p.reason.startsWith('Needs dry') && !p.reason.startsWith('Too')) why = p.reason; }
    console.log('   charter: sites', sites, why, 'missing', Object.keys(BUILDINGS.charter.cost).filter(k => s.res[k] < BUILDINGS.charter.cost[k]).map(k => k + ':' + Math.floor(s.res[k]) + '/' + cache(s).caps[k]).join(' '));
  }
  ok(s.mi >= 3, `${seed}/${size}/${difficulty}: only ${s.mi} milestones in ${minutes} min`);
  const bytes = JSON.stringify(serialize(s)).length;
  console.log(`   save size ${(bytes / 1024).toFixed(1)} KB`);
  ok(bytes < 400000, `${seed}: save too large (${bytes})`);
}

// ---------- 3. Recovery from ruin ----------
{
  const s = newGame({ seed: 'ruin', size: 'small', difficulty: 'harsh' });
  for (const k of RES) s.res[k] = 0;
  s.pop = 6;
  for (let i = 0; i < (8 * 60) / TICK; i++) tick(s);
  ok(checkInvariants(s, 'ruin'), 'ruin invariants');
  ok(s.res.food > 0 || s.res.wood > 0, `ruin: no recovery (food ${s.res.food} wood ${s.res.wood})`);
  ok(s.pop >= 4, 'ruin: founders stay');
  // With the trickle and relief the bot can rebuild.
  for (let i = 0; i < (20 * 60) / TICK; i++) { tick(s); if (i % 12 === 0) botStep(s); }
  ok(s.mi >= 1, `ruin: bot could not recover (milestones ${s.mi})`);
  console.log(`ruin recovery: pop ${s.pop} milestones ${s.mi}`);
}

// ---------- 4. Actions ----------
{
  const s = newGame({ seed: 5, size: 'medium', difficulty: 'standard' });
  const sites = tilesOk(s, 'house');
  const [x, y] = sites[0];
  const before = s.res.wood;
  const r = build(s, 'house', x, y);
  ok(r.ok, 'build house');
  ok(s.res.wood <= before - 6 + 3, 'house cost paid');
  ok(!build(s, 'house', x, y).ok, 'cannot double build');
  ok(!build(s, 'mine', x, y).ok, 'mine needs ore');
  ok(!canPlace(s, 'sawmill', sites[1][0], sites[1][1]).ok, 'sawmill locked at tier 1');
  const d = demolish(s, r.id);
  ok(d.ok && s.buildings.length === 1, 'demolish');
  ok(deserialize({ v: -1, state: s }) === null, 'old save rejected');
  ok(deserialize(null) === null && deserialize({}) === null, 'junk save rejected');
  ok(goalProgress(s, MILESTONES[0]).need === 3, 'goal progress');
}

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall checks passed');
