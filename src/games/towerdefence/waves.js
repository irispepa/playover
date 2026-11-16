// Procedural wave generation; scales forever. Pure module.
import { makeRng, hashSeed } from '../../shell/rng.js';
import { ENEMIES, BOSS_ORDER, OP } from './data.js';

// Health multiplier for wave n (1-based).
export function hpScale(n, mode) {
  const ramp = mode === 'op' ? OP.hpRamp : 1.038;
  return (1 + 0.09 * (n - 1)) * Math.pow(ramp, n - 1);
}

export function speedScale(n) { return 1 + Math.min(0.3, (n - 1) * 0.004); }
export function armorBonus(n) { return Math.floor((n - 1) / 12); }

// Grunt-equivalent "threat points" per wave.
export function waveBudget(n, mode) {
  const base = 8 + 1.5 * n + 0.025 * n * n;
  return mode === 'op' ? base * OP.count : base;
}

const POOL = Object.keys(ENEMIES).filter((k) => !ENEMIES[k].boss && ENEMIES[k].from < 900);

// Returns { n, boss, groups: [{ type, count, interval, delay, gate }], tags: [] }.
// gate is an index into map.gates, or -1 meaning "alternate between all gates".
export function generateWave(n, seed, mode, gateCount) {
  const rng = makeRng(hashSeed(`${seed}:wave:${n}`));
  const groups = [];
  const tags = [];
  let budget = waveBudget(n, mode);
  const isBoss = n % 10 === 0;
  const duration = 14 + Math.min(18, n * 0.35);

  if (isBoss) {
    const bi = (n / 10 - 1) % BOSS_ORDER.length;
    const bossType = BOSS_ORDER[bi];
    const bossCount = 1 + Math.floor((n - 10) / 50) * (mode === 'op' ? 2 : 1);
    groups.push({ type: bossType, count: bossCount, interval: 4, delay: duration * 0.35, gate: rng.int(0, gateCount - 1) });
    tags.push('boss');
    budget *= 0.55;
  }

  const avail = POOL.filter((k) => ENEMIES[k].from <= n);
  const fresh = POOL.find((k) => ENEMIES[k].from === n);
  let kinds = Math.min(avail.length, 1 + (n >= 4 ? 1 : 0) + (n >= 12 ? 1 : 0) + (n >= 26 ? 1 : 0));
  const chosen = [];
  if (fresh) { chosen.push(fresh); tags.push('new:' + fresh); }
  // themed waves for variety
  const theme = n > 6 && !isBoss ? rng.weighted([['mixed', 6], ['rush', 1], ['air', 1], ['heavy', 1], ['swarm', 1]]) : 'mixed';
  if (theme !== 'mixed') tags.push(theme);
  const weightOf = (k) => {
    const e = ENEMIES[k];
    let wgt = 1;
    if (theme === 'rush' && e.speed >= 1.2) wgt = 6;
    if (theme === 'air' && e.flying) wgt = 7;
    if (theme === 'heavy' && (e.armor || 0) + (e.shield ? 4 : 0) + (e.threat >= 3 ? 4 : 0) >= 4) wgt = 6;
    if (theme === 'swarm' && e.threat <= 0.8) wgt = 7;
    if (n - e.from < 4) wgt *= 1.3;
    return wgt;
  };
  while (chosen.length < kinds) {
    const left = avail.filter((k) => !chosen.includes(k));
    if (!left.length) break;
    chosen.push(rng.weighted(left.map((k) => [k, weightOf(k)])));
  }

  // share the budget
  const shares = chosen.map((k) => rng.float(0.6, 1.4) * (k === fresh ? 0.45 : 1));
  const total = shares.reduce((a, b) => a + b, 0);
  const cap = mode === 'op' ? 420 : 240;
  let spent = 0;
  chosen.forEach((type, i) => {
    const e = ENEMIES[type];
    const pts = budget * shares[i] / total;
    let count = Math.max(1, Math.round(pts / e.threat));
    if (e.split) count = Math.max(1, Math.round(count * 0.8));
    count = Math.min(count, Math.max(1, cap - spent));
    spent += count;
    const delay = i * duration * 0.3 + (rng.next() * 1.5);
    const interval = Math.max(0.06, Math.min(1.4, duration / Math.max(1, count)));
    const gate = gateCount > 1 && rng.chance(0.55) ? -1 : rng.int(0, gateCount - 1);
    groups.push({ type, count, interval, delay, gate });
  });

  return { n, boss: isBoss, groups, tags };
}

// Summary for the next-wave preview: [{ type, count }], merged by type.
export function waveSummary(wave) {
  const byType = new Map();
  for (const g of wave.groups) byType.set(g.type, (byType.get(g.type) || 0) + g.count);
  return [...byType.entries()].map(([type, count]) => ({ type, count }));
}
