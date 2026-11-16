// Headless check: a simple bot grows a town through every age. Run: node src/games/everbrook/sim.test.mjs [--long]
import * as S from './sim.js';
import { B, DISC, HOME_LEVELS, ERAS, RES_KEYS, QUESTS } from './data.js';
import { N, T, idx, inb } from './gen.js';
import { makeRng } from '../../shell/rng.js';

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

function spots(s, type, score, radius) {
  const { x: cx, y: cy } = s.m.start;
  let best = null;
  for (let y = Math.max(0, cy - radius); y <= Math.min(N - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(N - 1, cx + radius); x++) {
      if (!S.canPlace(s, type, x, y, { free: true }).ok) continue;
      const sc = score(x, y);
      if (sc > -1e8 && (!best || sc > best.sc)) best = { x, y, sc };
    }
  }
  return best;
}
const dist = (s, x, y) => Math.hypot(x - s.m.start.x, y - s.m.start.y);
function nearRoad(s, x, y, size = 1) {
  for (let k = 0; k < size; k++) for (const [xx, yy] of [[x + k, y - 1], [x + k, y + size], [x - 1, y + k], [x + size, y + k]]) if (inb(xx, yy) && s.road[idx(xx, yy)]) return true;
  return false;
}

function makeBot(s, rng) {
  const radius = () => Math.min(16, 5 + Math.floor(Math.sqrt(s.b.length) * 1.6));
  const tryBuild = (type, score) => {
    if (!S.unlocked(s, type) || !S.canAfford(s, B[type].cost)) return false;
    const sp = spots(s, type, score, B[type].adj ? N : radius());
    return sp ? !!S.place(s, type, sp.x, sp.y) : false;
  };
  const byRoad = (type) => tryBuild(type, (x, y) => (nearRoad(s, x, y, B[type].size) ? 5 : 0) - dist(s, x, y) * 0.3);
  const byBonus = (type) => tryBuild(type, (x, y) => S.bonusAt(s, B[type], x, y).total * 10 - dist(s, x, y) * 0.25);

  function growRoad() {
    if (s.d.roads > 14 + s.d.n.home * 3) return;
    if (!s.d.roads) { const { x, y } = s.m.start; for (let dx = -3; dx <= 3; dx++) S.place(s, 'road', x + dx, y); return; }
    // Branch off from any free tile beside an existing path, heading away from it.
    const cands = [];
    for (let i = 0; i < N * N; i++) {
      if (!s.road[i]) continue;
      const x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (S.canPlace(s, 'road', x + dx, y + dy, { free: true }).ok && s.m.distWater[idx(x + dx, y + dy)] > 1) cands.push([x + dx, y + dy, dx, dy, dist(s, x, y)]);
    }
    if (cands.length) {
      cands.sort((a, b) => a[4] - b[4]);
      let [x, y, dx, dy] = cands[Math.floor(rng.next() * Math.min(cands.length, 6))];
      for (let k = 0; k < 5 && inb(x, y) && s.m.distWater[idx(x, y)] > 1 && S.place(s, 'road', x, y); k++) { x += dx; y += dy; }
      return;
    }
    const sp = spots(s, 'road', (x, y) => -dist(s, x, y), N);
    if (sp) for (let k = 0; k < 5 && S.place(s, 'road', sp.x + k, sp.y); k++);
  }

  function coverNeed() {
    // Which service do the most homes lack for their next level?
    const lack = {};
    for (const b of s.b) if (b.type === 'home') { const t = S.homeTarget(s, b); if (t.lack && t.lack.service && t.target <= b.lvl) lack[t.lack.service] = (lack[t.lack.service] || 0) + 1; }
    return Object.entries(lack).sort((a, b) => b[1] - a[1]);
  }
  const SERVICE_ORDER = {
    water: ['watertower', 'fountain', 'well'], faith: ['chapel', 'temple', 'shrine', 'standingstone'], market: ['markethall', 'market'],
    health: ['clinic', 'bathhouse'], learning: ['university', 'school'], leisure: ['theatre', 'park', 'tavern', 'amphitheatre'],
  };
  function buildService(type) {
    const def = B[type];
    return tryBuild(type, (x, y) => {
      if (!nearRoad(s, x, y, def.size)) return -1e9;
      const mask = S.serviceTiles(s, x, y, def.size, def.service);
      let gain = 0;
      for (const b of s.b) if (b.type === 'home' && mask[idx(b.x, b.y)] && !s.d.cover[def.service.type][idx(b.x, b.y)]) gain++;
      return gain > 0 ? gain * 3 - dist(s, x, y) * 0.1 : -1e9;
    });
  }

  function farm() {
    if (!S.unlocked(s, 'farmstead') || !S.canAfford(s, { wood: 30, stone: 10 })) return false;
    const sp = spots(s, 'farmstead', (x, y) => {
      let free = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if ((dx || dy) && S.canPlace(s, 'field', x + dx, y + dy, { free: true }).ok && !fieldTaken(x + dx, y + dy)) free += s.m.distWater[idx(x + dx, y + dy)] <= 2 ? 1.3 : 1;
      }
      return free >= 8 ? free - dist(s, x, y) * 0.3 : -1e9;
    }, radius() + 3);
    if (!sp || !S.place(s, 'farmstead', sp.x, sp.y)) return false;
    let n = 0;
    for (let dy = -2; dy <= 2 && n < 8; dy++) for (let dx = -2; dx <= 2 && n < 8; dx++) if ((dx || dy) && S.place(s, 'field', sp.x + dx, sp.y + dy)) n++;
    return true;
  }
  const fieldTaken = (x, y) => {
    for (const b of s.b) if (b.type === 'farmstead' && Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= 2) return true;
    return false;
  };

  const cap = (t) => s.d.n[t] < 2 + s.era * 2;
  const want = (k, perDay) => s.d.rate[k] < perDay && s.res[k] < s.d.caps[k] * 0.6;

  return function step() {
    if (s.event) { const ev = S.eventDef(s); const i = ev.options.findIndex((o) => S.optionAffordable(s, o)); S.resolveEvent(s, i); }
    if (S.festivalReady(s)) S.holdFestival(s, S.festivalChoices(s)[0].id);
    for (const d of DISC.filter((d) => S.canDiscover(s, d.id)).sort((a, b) => a.cost - b.cost).slice(0, 1)) S.discover(s, d.id);
    const wid = ERAS[s.era].wonder;
    if (S.unlocked(s, wid) && s.d.n[wid] === 0 && !byRoad(wid) && S.canAfford(s, B[wid].cost)) { const sp = spots(s, wid, (x, y) => -dist(s, x, y), N); if (sp) S.place(s, wid, sp.x, sp.y); }
    S.contribute(s);
    if (s.d.trade && s.res.coin > 300) {
      // Buy whatever the wonder is short of.
      const w = S.currentWonder(s);
      if (w) { const cost = B[w.type].stages[w.stage]; for (const k in cost) if (k !== 'coin' && s.res[k] < cost[k]) S.trade(s, k, Math.min(20, cost[k] - s.res[k])); }
    }
    const pop = s.d.pop, d = s.d;
    if (d.roads < 6) growRoad();
    const eat = pop * 0.085;
    const short = d.jobs > pop;                       // more jobs than people
    const foodLow = s.res.food < eat * 15 || d.rate.food < 0;
    if (pop >= 3 && (!short || s.res.food < eat * 6) && foodLow) { if (farm()) return; if (d.n.fisher < 6 && byBonus('fisher')) return; if (d.n.forager < 5 && byBonus('forager')) return; }
    // Room to grow.
    if ((pop >= d.room - 2 || short) && (s.res.food > eat * 8 || pop < 6)) {
      if (tryBuild('home', (x, y) => (nearRoad(s, x, y) ? 0 : -1e9) + Object.values(d.cover).reduce((t, c) => t + (c[idx(x, y)] ? 3 : 0), 0) - dist(s, x, y) * 0.4)) return;
      if (S.canAfford(s, B.home.cost)) growRoad();
    }
    // Services homes are waiting for.
    for (const [svc] of coverNeed()) { for (const t of SERVICE_ORDER[svc]) if (buildService(t)) return; }
    // Storage when things are full.
    if (RES_KEYS.some((k) => k !== 'coin' && k !== 'food' && s.res[k] >= d.caps[k] - 1) && d.n.storehouse + d.n.warehouse < 2 + s.era * 2) { if (byRoad('warehouse') || byRoad('storehouse')) return; }
    if (s.res.food >= d.caps.food - 1 && d.n.granary < 1 + s.era) if (byRoad('granary')) return;
    // One of everything the age offers, so no chain is missing.
    for (const t of ['woodcutter', 'stonecutter', 'storyteller', 'kiln', 'mine', 'smithy', 'weaver', 'tradingpost', 'scribe', 'papermill', 'glassworks', 'coalmine', 'steelworks', 'factory', 'station']) {
      if (!S.unlocked(s, t) || d.n[t] > 0) continue;
      if (B[t].bonus || B[t].adj ? byBonus(t) : byRoad(t)) return;
      // An outcrop can get boxed in by the bot's own sprawl: clear one neighbouring tile and try again next step.
      if ((B[t].adj === 'coal' || B[t].adj === 'ore') && S.canAfford(s, B[t].cost)) {
        for (let i = 0; i < N * N; i++) if (s.m[B[t].adj][i]) {
          const x = i % N, y = (i / N) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (S.removeAt(s, x + dx, y + dy)) return;
        }
      }
    }
    if (S.unlocked(s, 'papermill') && d.n.papermill < d.n.press * 2 + (s.era >= 5 ? 2 : 0) && byRoad('papermill')) return;
    if (short) return;
    if (want('wood', 1.2 + s.era * 0.8) && cap('woodcutter') && byBonus('woodcutter')) return;
    if (want('stone', 0.8 + s.era * 0.5) && byBonus('stonecutter')) return;
    if (s.era >= 1) {
      if (want('brick', 0.5 + s.era * 0.25) && byBonus('kiln')) return;
      if (S.unlocked(s, 'mine') && want('ore', 0.4 + (s.era >= 5 ? 0.8 : 0)) && byBonus('mine')) return;
      if (S.unlocked(s, 'smithy') && want('tools', 0.3 + s.era * 0.1) && s.res.ore > 20 && cap('smithy') && byRoad('smithy')) return;
      if (S.unlocked(s, 'weaver') && want('cloth', 0.3 + s.era * 0.15) && byBonus('weaver')) return;
    }
    if (S.unlocked(s, 'papermill') && want('paper', 0.4) && byRoad('papermill')) return;
    if (S.unlocked(s, 'glassworks') && want('glass', 0.4) && byRoad('glassworks')) return;
    if (S.unlocked(s, 'coalmine') && want('coal', 1.2) && byBonus('coalmine')) return;
    if (S.unlocked(s, 'steelworks') && want('steel', 0.4) && d.rate.coal > 0 && byRoad('steelworks')) return;
    for (const t of ['guildhall', 'windmill']) if (d.n[t] < 1 && byRoad(t)) return;
    for (const t of ['institute', 'university', 'press', 'academy', 'school', 'scribe', 'storyteller']) {
      if (S.unlocked(s, t) && d.n[t] < (B[t].size > 1 ? 2 : 3) && byRoad(t)) return;
    }
    for (const t of ['botanic', 'statue', 'garden']) if (d.n[t] < 4 && tryBuild(t, (x, y) => -dist(s, x, y))) return;
  };
}

function run(seed, maxDays) {
  const s = S.newGame(seed);
  const bot = makeBot(s, makeRng(seed + 1));
  let quests = 0;
  for (let day = 0; day < maxDays && !s.done; day++) {
    if (day % 2 === 0) bot();
    for (const e of S.tick(s)) { if (e.type === 'quest') quests++; if (e.type === 'era' && process.argv.includes('--debug')) console.log(`    -> era ${e.era} day ${s.day} pop ${s.d.pop} kRate ${s.d.kRate.toFixed(1)} know ${s.knowledge.toFixed(0)} homes ${S.questStats(s).lv.join(',')} bld ${s.b.length}`); }
    for (const k of RES_KEYS) if (!(s.res[k] >= 0) || !Number.isFinite(s.res[k])) { fails.push(`seed ${seed}: bad ${k}=${s.res[k]} day ${day}`); return s; }
  }
  s._quests = quests;
  return s;
}

const long = process.argv.includes('--long');
const seeds = long ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3];
let finished = 0;
for (const seed of seeds) {
  const s = run(seed, 6000);
  const lv = S.questStats(s).lv;
  console.log(`seed ${seed}: era ${s.era} done=${s.done} day ${s.day} eraDays=${s.eraDays.join('/')} pop ${s.d.pop} bld ${s.b.length} harmony ${s.harmony.toFixed(0)} quests ${s._quests}/${QUESTS.length} homes ${lv.join(',')} legacy ${S.legacy(s)}`);
  if (process.argv.includes('--debug')) {
    console.log('  res', RES_KEYS.map((k) => `${k}:${s.res[k].toFixed(0)}/${s.d.caps[k]}(${s.d.rate[k].toFixed(2)})`).join(' '));
    console.log('  know', s.knowledge.toFixed(0), 'kRate', s.d.kRate.toFixed(2), 'culture', s.culture.toFixed(0), 'jobs', s.d.jobs, 'room', s.d.room, 'disc', Object.keys(s.disc).join(','));
    console.log('  n', Object.entries(s.d.n).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(' '));
    { let c = 0; const why = {}; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = S.canPlace(s, 'papermill', x, y, { free: true }); if (r.ok) c++; else why[r.why] = (why[r.why] || 0) + 1; } console.log('  papermill spots', c, JSON.stringify(why)); }
    const w = S.currentWonder(s); if (w) console.log('  wonder', w.type, w.stage, JSON.stringify(B[w.type].stages[w.stage]));
  }
  // The bot is a clumsy planner; every town must get deep into the chronicle and at least one must finish it.
  check(s.era >= 4, `seed ${seed}: only reached era ${s.era}`);
  finished += s.done ? 1 : 0;
  // Save round trip.
  const copy = S.fromSave(JSON.parse(JSON.stringify(S.toSave(s))));
  check(copy && copy.b.length === s.b.length && copy.d.pop === s.d.pop && copy.d.roads === s.d.roads, `seed ${seed}: save round trip`);
  if (copy) { S.tick(copy); check(copy.day === s.day + 1, `seed ${seed}: loaded game ticks`); }
}

check(finished >= 1, 'no bot town completed the chronicle');

// Maps: every seed must give a workable valley.
for (let seed = 100; seed < 160; seed++) {
  const s = S.newGame(seed);
  const { x, y } = s.m.start;
  check(s.m.terr[idx(x, y)] === T.GRASS, `map ${seed}: start not on grass`);
  let ore = 0, coal = 0; for (let i = 0; i < N * N; i++) { ore += s.m.ore[i]; coal += s.m.coal[i]; }
  check(ore >= 3 && coal >= 3, `map ${seed}: ore ${ore} coal ${coal}`);
}
// Data sanity: everything referenced exists.
for (const d of DISC) for (const u of d.unlocks) check(B[u] && B[u].disc === d.id, `discovery ${d.id} -> ${u} mismatch`);
for (const b of Object.values(B)) { if (b.disc) check(DISC.some((d) => d.id === b.disc && d.unlocks.includes(b.id)), `${b.id} needs unknown discovery ${b.disc}`); if (b.from) check(B[b.from], `${b.id} from ${b.from}`); }
for (const e of ERAS) check(B[e.wonder] && B[e.wonder].wonder, `era ${e.id} wonder`);
check(HOME_LEVELS.length === 7, 'home levels');

if (fails.length) { console.log('FAILED'); for (const f of fails) console.log(' -', f); process.exit(1); }
console.log('ok');
