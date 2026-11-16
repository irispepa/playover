// Headless tests for Bastion Maze. Run: node src/games/towerdefence/sim.test.mjs [--quick]
import { generateMap, terrainDistance, buildableCount } from './mapgen.js';
import { ARCHETYPE_ORDER, DT, BUILDABLE, WALKABLE, CARDS, TOWER_ORDER, TOWERS, ENEMIES } from './data.js';
import { generateWave, waveSummary } from './waves.js';
import {
  newGame, step, canBuild, build, serialize, deserialize, upgrade, sell, upgradeInfo, previewPaths, INF,
  pickCard, setHeroInput, deployHero, callWave,
} from './sim.js';
import { makeBot, botAct } from './bot.mjs';

const quick = process.argv.includes('--quick');
let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error('FAIL:', msg); }
}
function section(name) { console.log(`\n== ${name}`); }

// ------------------------------------------------------------------------------------------------
section('Map generation');
{
  let n = 0;
  const t0 = Date.now();
  for (let seed = 1; seed <= 60; seed++) {
    for (const arch of ARCHETYPE_ORDER) {
      const m = generateMap(seed * 7919, arch);
      n++;
      const d = terrainDistance(m);
      for (const g of m.gates) check(d[g] >= 0, `gate unreachable seed=${seed} arch=${arch}`);
      check(buildableCount(m) >= m.w * m.h * 0.35, `too little buildable ground seed=${seed} arch=${arch}`);
      check(m.w >= 11 && m.w <= 13 && m.h >= 17 && m.h <= 20, `bad size ${m.w}x${m.h}`);
      check(m.archetype === arch, 'archetype mismatch');
      // determinism
      if (seed % 10 === 0) {
        const m2 = generateMap(seed * 7919, arch);
        check(m2.tiles.every((v, i) => v === m.tiles[i]), 'map gen not deterministic');
      }
    }
  }
  for (let seed = 1000; seed < 1100; seed++) { generateMap(seed, 'random'); n++; }
  console.log(`${n} maps generated in ${Date.now() - t0} ms`);
}

// ------------------------------------------------------------------------------------------------
section('Blocking check');
{
  // On an open field map, wall off the gate's neighbourhood: the last sealing wall must be rejected.
  let tested = 0;
  for (let seed = 1; seed <= 20 && tested < 8; seed++) {
    const s = newGame({ seed, mode: 'std', difficulty: 'normal', archetype: 'field' });
    s.gold = 1e6;
    const { w, h } = s.map;
    const gate = s.map.gates[0];
    const gx = gate % w, gy = (gate / w) | 0;
    // try to seal a full row below the gate
    const row = gy + 2;
    let rejected = 0, accepted = 0;
    for (let x = 0; x < w; x++) {
      const i = row * w + x;
      if (!BUILDABLE[s.map.tiles[i]]) continue;
      const r = build(s, i, 'wall');
      if (r.ok) accepted++; else if (r.reason === 'That would block the path') rejected++;
    }
    // the gate must still reach the core, and the row must have been left open somewhere
    check(s.dist[gate] < INF, `gate sealed seed=${seed}`);
    let open = 0;
    for (let x = 0; x < w; x++) { const i = row * w + x; if (WALKABLE[s.map.tiles[i]] && !s.blocked[i]) open++; }
    check(open >= 1, 'row fully sealed');
    if (rejected > 0) tested++;
    check(accepted > 0, 'legal walls were rejected');
  }
  check(tested > 0, 'never exercised the sealing rejection');
  console.log(`sealing rejection exercised on ${tested} maps`);

  // A legal serpentine maze is accepted and lengthens the path.
  const s = newGame({ seed: 42, mode: 'std', difficulty: 'normal', archetype: 'field' });
  s.gold = 1e6;
  const before = s.dist[s.map.gates[0]];
  const { w, h } = s.map;
  let built = 0;
  for (let y = 3; y < h - 3; y += 3) {
    const leftGap = ((y / 3) | 0) % 2 === 0;
    for (let x = 0; x < w; x++) {
      if (leftGap ? x === 0 : x === w - 1) continue;
      const i = y * w + x;
      if (BUILDABLE[s.map.tiles[i]] && build(s, i, 'wall').ok) built++;
    }
  }
  const after = s.dist[s.map.gates[0]];
  console.log(`maze: ${built} walls, path ${before} -> ${after}`);
  check(after > before + 10, 'serpentine maze did not lengthen the path');
  check(previewPaths(s)[0].at(-1) === s.map.core, 'preview path does not end at the core');
  // sell refund and rebuild
  const t = s.towers[0];
  const g0 = s.gold;
  sell(s, t);
  check(s.gold === g0 + t.invested, 'fresh sell should refund 100%');
}

// ------------------------------------------------------------------------------------------------
section('Waves');
{
  for (const mode of ['std', 'op']) {
    for (let n = 1; n <= 150; n++) {
      const wv = generateWave(n, 1234, mode, 2);
      const total = wv.groups.reduce((a, g) => a + g.count, 0);
      check(total > 0, `empty wave ${n}`);
      for (const g of wv.groups) {
        check(ENEMIES[g.type], `bad type ${g.type}`);
        check(g.interval > 0 && Number.isFinite(g.delay), 'bad timing');
      }
      if (n % 10 === 0) check(wv.boss && wv.groups.some((g) => ENEMIES[g.type].boss), `wave ${n} has no boss`);
      check(waveSummary(wv).length > 0, 'empty summary');
    }
  }
  const w60 = generateWave(60, 1, 'std', 1).groups.reduce((a, g) => a + g.count, 0);
  const w60op = generateWave(60, 1, 'op', 1).groups.reduce((a, g) => a + g.count, 0);
  console.log(`wave 60 size: std ${w60}, op ${w60op}`);
}

// ------------------------------------------------------------------------------------------------
section('Save round trip');
{
  const s = newGame({ seed: 777, mode: 'std', difficulty: 'hard', archetype: 'twin' });
  const bot = makeBot(s, { hero: true, seed: 5 });
  for (let i = 0; i < 30 * 200; i++) {
    if (i % 15 === 0) botAct(s, bot);
    step(s, DT); s.fxN = 0; s.events.length = 0;
    if (s.over) break;
  }
  const json = JSON.stringify(serialize(s));
  const s2 = deserialize(JSON.parse(json));
  check(s2, 'deserialize returned null');
  if (s2) {
    const a = serialize(s), b = serialize(s2);
    check(JSON.stringify(a) === JSON.stringify(b), 'save -> load -> save differs');
    check(s2.towers.length === s.towers.length && s2.enemies.length === s.enemies.length, 'counts differ after load');
    // both continue identically for a while (projectiles are dropped on save, so compare loosely)
    for (let i = 0; i < 300; i++) { step(s2, DT); s2.fxN = 0; }
    check(Number.isFinite(s2.gold) && s2.lives >= 0, 'loaded game broke');
    console.log(`saved ${json.length} bytes at wave ${s.wave} with ${s.towers.length} towers, ${s.enemies.length} enemies`);
  }
  check(deserialize({ v: -1 }) === null, 'old version should be rejected');
  check(deserialize(null) === null, 'null should be rejected');
  check(deserialize({ ...JSON.parse(json), towers: [{ type: 'arrow', tile: -5 }] }) === null, 'bad tower should be rejected');
}

// ------------------------------------------------------------------------------------------------
section('Full games');
function runGame({ seed, mode, difficulty, archetype, hero, maxWave, label }) {
  const s = newGame({ seed, mode, difficulty, archetype });
  const bot = makeBot(s, { hero, seed: seed + 11 });
  const t0 = Date.now();
  let maxEnemies = 0, steps = 0, problems = 0;
  const leakLog = [];
  let lastLeaks = 0, lastWave = 0;
  const { w, h } = s.map;
  while (!s.over && s.wave < maxWave && steps < 30 * 60 * 60 * 3) {
    if (steps % 15 === 0) botAct(s, bot);
    step(s, DT);
    steps++;
    s.fxN = 0; s.events.length = 0;
    if (s.enemies.length > maxEnemies) maxEnemies = s.enemies.length;
    if (s.wave !== lastWave) { if (s.stats.leaks > lastLeaks) leakLog.push(`${lastWave}:${s.stats.leaks - lastLeaks}`); lastLeaks = s.stats.leaks; lastWave = s.wave; }
    if (steps % 30 === 0) {
      if (!Number.isFinite(s.gold) || !Number.isFinite(s.lives)) { problems++; check(false, `${label}: NaN economy`); }
      for (const e of s.enemies) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.hp) || !Number.isFinite(e.shield)) {
          problems++; check(false, `${label}: NaN enemy ${e.type}`); break;
        }
        if (e.x < -0.01 || e.y < -0.01 || e.x > w + 0.01 || e.y > h + 0.01) { problems++; check(false, `${label}: enemy left the map`); break; }
        if (!e.flying && s.blocked[(e.y | 0) * w + (e.x | 0)] && e.stunT <= 0) {
          // an enemy may stand on its exact tile edge; only flag if deep inside a blocked tile
          const fx = e.x - (e.x | 0), fy = e.y - (e.y | 0);
          if (fx > 0.2 && fx < 0.8 && fy > 0.2 && fy < 0.8) { problems++; check(false, `${label}: enemy inside a building`); break; }
        }
        if (e.age > 600) { problems++; check(false, `${label}: enemy ${e.type} alive ${e.age.toFixed(0)}s (stuck?)`); break; }
      }
      const hr = s.hero;
      if (hr.deployed) {
        if (!Number.isFinite(hr.x) || !Number.isFinite(hr.y) || !Number.isFinite(hr.hp)) { problems++; check(false, `${label}: NaN hero`); }
        if (hr.x < 0 || hr.y < 0 || hr.x > w || hr.y > h) { problems++; check(false, `${label}: hero left the map`); }
        const ti = (hr.y | 0) * w + (hr.x | 0);
        if (hr.downT <= 0 && (s.blocked[ti] || !WALKABLE[s.map.tiles[ti]])) { problems++; check(false, `${label}: hero inside a solid tile`); }
      }
      if (problems > 5) break;
    }
  }
  check(s.stats.stuck === 0, `${label}: an enemy had to use the stuck fallback`);
  const res = {
    label, wave: s.wave, over: s.over, kills: s.stats.kills, leaks: s.stats.leaks, towers: s.towers.length,
    maxEnemies, heroLvl: s.hero.level, heroKills: s.hero.kills, perks: s.perks.length, ms: Date.now() - t0,
    simMin: (s.time / 60).toFixed(0), leaksByWave: leakLog.slice(-8).join(' '),
  };
  console.log(JSON.stringify(res));
  return res;
}

const results = {};
const seeds = quick ? [3] : [3, 17, 29];
const archs = ['field', 'twin', 'islands', 'canyon', 'lake', 'citadel'];
for (const [mode, difficulty, hero, maxWave] of [
  ['std', 'easy', false, 150], ['std', 'normal', false, 150], ['std', 'hard', false, 150],
  ['std', 'normal', true, 150], ['op', 'normal', true, 400],
]) {
  const key = `${mode}-${difficulty}${hero ? '-hero' : ''}`;
  results[key] = [];
  seeds.forEach((seed, i) => {
    results[key].push(runGame({ seed, mode, difficulty, archetype: archs[(i * 2 + seed) % archs.length], hero, maxWave, label: `${key} s${seed}` }));
  });
}

section('Balance summary');
const avg = (k) => results[k].reduce((a, r) => a + r.wave, 0) / results[k].length;
for (const k of Object.keys(results)) console.log(`${k.padEnd(18)} avg wave ${avg(k).toFixed(1)}  [${results[k].map((r) => r.wave + (r.over ? '' : '+')).join(', ')}]`);
check(avg('std-normal') >= 15, 'Normal bot should survive many waves');
check(results['std-normal'].every((r) => r.over), 'Normal bot should eventually lose');
check(avg('std-easy') >= avg('std-hard'), 'Easy should be easier than Hard');
check(avg('op-normal-hero') >= avg('std-normal') * 1.8, 'Overpowered should go dramatically further');
check(avg('std-normal-hero') >= avg('std-normal'), 'The hero should help');

console.log(failures ? `\n${failures} FAILURES` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
