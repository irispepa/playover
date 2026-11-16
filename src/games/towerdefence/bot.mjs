// A simple greedy bot used only by the headless tests (not bundled into the game).
import { makeRng } from '../../shell/rng.js';
import { TOWERS, BUILDABLE, WALKABLE, CARD_BY_ID } from './data.js';
import {
  canBuild, build, upgrade, upgradeInfo, buildCost, previewPaths, pickCard, useAbility, abilityReady, abilityList,
  callWave, deployHero, setHeroInput, heroDash, heroUlt, INF,
} from './sim.js';

export function makeBot(s, { hero = false, seed = 1 } = {}) {
  return { rng: makeRng(seed), hero, rot: 0, lastPaths: null, pathVer: -1, s };
}

const ROTATION = ['arrow', 'cannon', 'frost', 'arrow', 'tesla', 'venom', 'mortar', 'sniper', 'flame', 'cannon', 'tesla', 'sniper'];

function pathTiles(s, bot) {
  if (bot.pathVer !== s.fieldVer) {
    const set = new Set();
    for (const p of previewPaths(s)) for (const t of p) set.add(t);
    bot.lastPaths = [...set];
    bot.pathVer = s.fieldVer;
  }
  return bot.lastPaths;
}

function totalLen(s, dist) {
  let L = 0;
  for (const g of s.map.gates) L += dist[g];
  return L;
}

function neighboursOfPath(s, bot) {
  const { w, h } = s.map;
  const out = new Set();
  for (const t of pathTiles(s, bot)) {
    const x = t % w, y = (t / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const i = ny * w + nx;
      if (BUILDABLE[s.map.tiles[i]] && !s.towerGrid[i]) out.add(i);
    }
  }
  return [...out];
}

function tryWall(s, bot) {
  const cost = buildCost(s, 'wall');
  if (s.gold < cost) return false;
  const cands = bot.rng.shuffle(pathTiles(s, bot).filter((i) => BUILDABLE[s.map.tiles[i]] && !s.towerGrid[i])).slice(0, 24);
  const base = totalLen(s, s.dist);
  let best = -1, bestGain = 0;
  for (const i of cands) {
    const r = canBuild(s, i, 'wall');
    if (!r.ok) continue;
    const gain = totalLen(s, s.scratch) - base;
    if (gain > bestGain) { bestGain = gain; best = i; }
  }
  if (best >= 0) return build(s, best, 'wall').ok;
  return false;
}

function coverage(s, bot, tile, range, minRange) {
  const w = s.map.w;
  const x = (tile % w) + 0.5, y = ((tile / w) | 0) + 0.5;
  let c = 0;
  for (const t of pathTiles(s, bot)) {
    const dx = (t % w) + 0.5 - x, dy = ((t / w) | 0) + 0.5 - y;
    const d = Math.hypot(dx, dy);
    if (d <= range && d >= minRange) c++;
  }
  return c;
}

function tryTower(s, bot, type) {
  const def = TOWERS[type];
  if (s.gold < buildCost(s, type)) return false;
  const range = def.levels[0].range || 1.5;
  let cands = neighboursOfPath(s, bot);
  if (type === 'mortar' || type === 'sniper' || type === 'mine' || type === 'beacon') {
    const all = [];
    for (let i = 0; i < s.n; i++) if (BUILDABLE[s.map.tiles[i]] && !s.towerGrid[i]) all.push(i);
    cands = bot.rng.shuffle(all).slice(0, 60);
  }
  let best = -1, bs = -1;
  for (const i of cands) {
    let sc;
    if (type === 'mine') sc = -coverage(s, bot, i, 1.5, 0) + bot.rng.next();
    else if (type === 'beacon') {
      sc = 0;
      for (const t of s.towers) if (t.type !== 'wall' && t.type !== 'mine' && Math.hypot(t.x - (i % s.map.w) - 0.5, t.y - ((i / s.map.w) | 0) - 0.5) <= 1.6) sc++;
    } else sc = coverage(s, bot, i, range, def.minRange || 0) + bot.rng.next() * 0.5;
    if (sc > bs) {
      const r = canBuild(s, i, type);
      if (!r.ok) continue;
      bs = sc; best = i;
    }
  }
  if (best >= 0) return build(s, best, type).ok;
  return false;
}

function tryUpgrade(s, bot) {
  let best = null, bc = Infinity;
  for (const t of s.towers) {
    if (t.type === 'wall') continue;
    const info = upgradeInfo(s, t);
    if (info.kind === 'max') continue;
    const c = info.kind === 'branch' ? Math.min(info.a.cost, info.b.cost) : info.cost;
    const score = c * (1 + t.level * 0.2);
    if (score < bc) { bc = score; best = t; }
  }
  if (!best) return false;
  const info = upgradeInfo(s, best);
  const br = info.kind === 'branch' ? (bot.rng.chance(0.5) ? 'a' : 'b') : undefined;
  return upgrade(s, best, br).ok;
}

export function botAct(s, bot) {
  if (s.over) return;
  if (s.pendingCards) {
    // prefer non-curse cards
    let idx = s.pendingCards.findIndex((id) => CARD_BY_ID[id].kind !== 'curse');
    if (idx < 0) idx = 0;
    if (bot.rng.chance(0.3)) idx = bot.rng.int(0, s.pendingCards.length - 1);
    pickCard(s, idx);
  }
  if (s.waiting) {
    // initial build then start
    for (let k = 0; k < 6; k++) tryWall(s, bot);
    tryTower(s, bot, 'arrow'); tryTower(s, bot, 'arrow'); tryTower(s, bot, 'cannon');
    callWave(s);
  }
  // hero
  if (bot.hero) {
    const h = s.hero;
    if (h.unlocked && !h.deployed) deployHero(s);
    h.autoSpend = true;
    if (h.deployed && h.downT <= 0) {
      let target = null, bp = Infinity;
      for (const e of s.enemies) if (e.alive && e.prog < bp && e.burrowT <= 0) { bp = e.prog; target = e; }
      let mx = 0, my = 0;
      let gx, gy;
      if (target) { gx = target.x; gy = target.y; }
      else { gx = (s.map.core % s.map.w) + 0.5; gy = ((s.map.core / s.map.w) | 0) + 0.5; }
      const d = Math.hypot(gx - h.x, gy - h.y);
      if (!target || d > 2.2) {
        const wp = navStep(s, h.x, h.y, gx, gy);
        if (wp) { mx = wp[0] - h.x; my = wp[1] - h.y; const m = Math.hypot(mx, my) || 1; mx /= m; my /= m; }
      } else if (d < 1.2) { mx = (h.x - gx) / d; my = (h.y - gy) / d; }
      setHeroInput(s, mx, my, 0, 0, false, true);
      if (h.hp < 0.35 * (s.hst.maxHp || 100) && h.dashCd <= 0) heroDash(s);
      let near = 0;
      for (const e of s.enemies) if (e.alive && Math.hypot(e.x - h.x, e.y - h.y) < 2.5) near++;
      if (near >= 4) heroUlt(s);
    }
  }
  // abilities
  for (const id of abilityList(s)) {
    if (!abilityReady(s, id)) continue;
    if (id === 'rush') { useAbility(s, id); continue; }
    if (s.enemies.length < 6 && id !== 'orbital') continue;
    let best = null, bp = Infinity;
    for (const e of s.enemies) if (e.alive && e.prog < bp) { bp = e.prog; best = e; }
    if (!best) continue;
    if (id === 'freeze') { if (bp < 6) useAbility(s, id); }
    else useAbility(s, id, best.x, best.y);
  }
  // a detector once stealth enemies appear, and air cover near the core once flyers appear
  if (s.wave >= 11 && !s.towers.some((t) => t.st.detect > 0)) {
    const wall = s.towers.filter((t) => t.type === 'wall' && t.level === 1)[0];
    if (wall) upgrade(s, wall, 'b');
  }
  if (s.wave >= 4 && !bot.coreCover) {
    const core = s.map.core, w = s.map.w;
    let built = 0;
    for (let r = 1; r <= 3 && built < 2; r++) {
      for (let dy = -r; dy <= r && built < 2; dy++) for (let dx = -r; dx <= r && built < 2; dx++) {
        const x = (core % w) + dx, y = ((core / w) | 0) + dy;
        if (x < 0 || y < 0 || x >= w || y >= s.map.h) continue;
        if (build(s, y * w + x, 'arrow').ok) built++;
      }
    }
    if (built >= 2) bot.coreCover = true;
  }
  // spending
  let guard = 12;
  while (guard-- > 0 && s.gold > 4) {
    const attack = s.towers.filter((t) => t.type !== 'wall' && t.type !== 'mine' && t.type !== 'beacon').length;
    const walls = s.towers.length - attack;
    const mines = s.towers.filter((t) => t.type === 'mine').length;
    let did = false;
    if (walls < 8 + s.wave * 0.5 && bot.rng.chance(0.35)) did = tryWall(s, bot);
    if (!did && mines < 2 && s.wave >= 3 && s.wave < 30 && bot.rng.chance(0.3)) did = tryTower(s, bot, 'mine');
    if (!did && attack >= 6 && s.towers.filter((t) => t.type === 'beacon').length < Math.floor(attack / 8) && bot.rng.chance(0.3)) did = tryTower(s, bot, 'beacon');
    if (!did && (attack < 3 + s.wave * 0.35 || bot.rng.chance(0.15))) {
      did = tryTower(s, bot, ROTATION[bot.rot % ROTATION.length]);
      if (did) bot.rot++;
    }
    if (!did) did = tryUpgrade(s, bot);
    if (!did && attack < 4 + s.wave * 0.5) { did = tryTower(s, bot, ROTATION[bot.rot % ROTATION.length]); if (did) bot.rot++; }
    if (!did) did = tryWall(s, bot);
    if (!did) break;
  }
}

// BFS over hero-walkable tiles; returns the centre of the next tile toward (gx, gy).
function navStep(s, x, y, gx, gy) {
  const { w, h, tiles } = s.map;
  const start = (y | 0) * w + (x | 0), goal = (gy | 0) * w + (gx | 0);
  if (start === goal) return [gx, gy];
  const prev = new Int32Array(w * h).fill(-1);
  const q = [goal]; prev[goal] = goal;
  const ok = (i) => WALKABLE[tiles[i]] && !s.blocked[i];
  while (q.length) {
    const c = q.shift();
    if (c === start) break;
    const cx = c % w, cy = (c / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (prev[n] >= 0 || !(ok(n) || n === start)) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[start] < 0) return null;
  const nt = prev[start];
  return [(nt % w) + 0.5, ((nt / w) | 0) + 0.5];
}

export { INF };
