// Bastion Maze simulation: a deterministic fixed-step real-time tower defence.
// Pure module: no DOM, no three.js. Rendering and UI read the state and call the commands below.
import { makeRng, hashSeed } from '../../shell/rng.js';
import {
  SAVE_VERSION, T, BUILDABLE, TILE_NAMES, TOWERS, ENEMIES, DIFFICULTY, OP, ABILITIES, CARDS, CARD_BY_ID,
  HERO, defaultMods, heroXpNeed, PRIORITIES,
} from './data.js';
import { generateMap } from './mapgen.js';
import { computeField, INF, tracePath } from './path.js';
import { generateWave, waveSummary, hpScale, speedScale, armorBonus } from './waves.js';
import {
  QCAP, makeFxRing, fx, rebuildBuckets, query, spawnEnemy, enemyScale, applySlow, applyStun, applyOnHit, applyBurn,
  damage, kill, addBlast, processBlasts, splash, newProj, moveGround, DCOL, F_DOT, F_SPLASH,
} from './combat.js';
import {
  makeHero, heroStats, updateHero, autoSpend, heroOnTile, hurtHero, enemyShoot, heroHit, heroWeapons, deployHero,
} from './hero.js';

export { DT } from './data.js';

const STAT_KEYS = ['dmg', 'rate', 'range', 'splash', 'slow', 'slowDur', 'freezeAt', 'freezeDur', 'poison', 'poisonDur',
  'poisonMax', 'plague', 'shred', 'shredMax', 'corrode', 'oil', 'stun', 'shieldMul', 'jumps', 'jumpRange', 'falloff',
  'multishot', 'crit', 'critMul', 'detect', 'execute', 'bossMul', 'minRange', 'flight', 'napalm', 'napalmR', 'napalmDur',
  'cluster', 'clusterDmg', 'cone', 'burn', 'burnDur', 'buffDmg', 'buffRate', 'buffRange', 'mark', 'rangeAura', 'income',
  'interest', 'interestCap', 'killBonus', 'projSpeed', 'thorns'];

// ------------------------------------------------------------------------------------------------
// State creation
// ------------------------------------------------------------------------------------------------
function baseState(o) {
  const mode = o.mode === 'op' ? 'op' : o.mode || 'std';
  const difficulty = mode === 'op' ? 'normal' : (DIFFICULTY[o.difficulty] ? o.difficulty : 'normal');
  const map = generateMap(o.seed, o.archetype);
  const n = map.w * map.h;
  const diff = DIFFICULTY[difficulty];
  const s = {
    v: SAVE_VERSION, seed: o.seed >>> 0, mode, difficulty, archetype: map.archetype, label: o.label || '',
    map, n,
    blocked: new Uint8Array(n), towerGrid: new Array(n).fill(null), dist: new Int32Array(n), scratch: new Int32Array(n),
    bhead: new Array(n).fill(null),
    qbuf: new Array(QCAP).fill(null), qbuf2: new Array(QCAP).fill(null), qbuf3: new Array(QCAP).fill(null),
    qbuf4: new Array(QCAP).fill(null), chainHit: new Array(32).fill(null), excl: new Array(8).fill(null),
    fieldVer: 0, towerVer: 0,
    towers: [], nextTowerId: 1, mines: [], detectors: [], supports: [],
    enemies: [], epool: [], proj: [], ppool: [], zones: [], zpool: [], blasts: [], bpool: [],
    spawns: [], wave: 0, cleared: 0, next: null, waveAlive: {}, wavePending: {}, activeWaves: [],
    timer: 0, timerMax: mode === 'op' ? OP.timer : diff.timer, waiting: true, autoWaves: true,
    gold: 0, lives: 0, perks: [], mods: defaultMods(),
    modeDmg: mode === 'op' ? OP.dmg : 1, modeRange: mode === 'op' ? OP.range : 1, modeRate: mode === 'op' ? OP.rate : 1,
    ab: { meteor: 0, freeze: 0, rush: 0, orbital: 0 }, rushT: 0, pendingCards: null,
    stats: { kills: 0, leaks: 0, goldEarned: 0, built: 0, sold: 0, dmg: 0, bossKills: 0, stuck: 0, spent: 0 },
    time: 0, tick: 0, uid: 1, over: false,
    rng: makeRng(hashSeed(`${o.seed}:combat`)),
    fx: makeFxRing(), fxN: 0,
    sfx: { shoot: 0, hit: 0, boom: 0, zap: 0, kill: 0, leak: 0, freeze: 0, snipe: 0, flame: 0, jam: 0, hshot: 0, rail: 0, dash: 0, bad: 0, mortar: 0 },
    events: [],
    srcVolatile: { dealt: 0, kills: 0, engBoost: 0 }, srcAbility: { dealt: 0, kills: 0, engBoost: 0 },
    hero: makeHero(), hin: { mx: 0, my: 0, ax: 0, ay: 0, aim: false, control: false }, hst: {},
    hpScaleFn: hpScale, speedScaleFn: speedScale, armorBonusFn: armorBonus, heroXpNeed, heroAutoSpend: autoSpend,
  };
  computeField(map, s.blocked, s.dist);
  return s;
}

export function newGame(o) {
  const s = baseState(o);
  const diff = DIFFICULTY[s.difficulty];
  s.gold = s.mode === 'op' ? OP.gold : diff.gold;
  s.lives = s.mode === 'op' ? OP.lives : diff.lives;
  s.next = generateWave(1, s.seed, s.mode, s.map.gates.length);
  refreshTowers(s);
  if (s.mode === 'op') { s.hero.unlocked = true; deployHero(s); }
  return s;
}

export const cardStrength = (s) => (s.mode === 'op' ? OP.perk : 1);
export const cardEvery = (s) => (s.mode === 'op' ? OP.cardEvery : 5);
export function abilityList(s) { return s.mode === 'op' ? ['orbital', 'meteor', 'freeze', 'rush'] : ['meteor', 'freeze', 'rush']; }

export function recomputeMods(s) {
  const m = defaultMods();
  const k = cardStrength(s);
  for (const id of s.perks) { const c = CARD_BY_ID[id]; if (c && c.mod) c.mod(m, k); }
  s.mods = m;
}

// ------------------------------------------------------------------------------------------------
// Towers: stats, costs, commands
// ------------------------------------------------------------------------------------------------
export function buildCost(s, type) {
  const def = TOWERS[type];
  let c = def.cost * s.mods.buildCost * (s.mode === 'op' ? OP.buildCost : 1);
  if (type === 'wall') c *= s.mods.wallCost;
  return Math.max(1, Math.round(c));
}

function levelDef(type, level, branch) {
  const def = TOWERS[type];
  const nb = def.levels.length;
  if (level <= nb) return def.levels[level - 1];
  return def.branches[branch].levels[level - nb - 1];
}

export function upgradeInfo(s, t) {
  const def = TOWERS[t.type];
  const nb = def.levels.length;
  const max = nb + def.branches.a.levels.length;
  if (t.level >= max) return { kind: 'max' };
  const costOf = (ld) => Math.max(1, Math.round(ld.cost * s.mods.upgradeCost * (s.mode === 'op' ? OP.upgradeCost : 1)));
  if (t.level === nb) {
    return {
      kind: 'branch',
      a: { key: 'a', name: def.branches.a.name, desc: def.branches.a.desc, cost: costOf(def.branches.a.levels[0]) },
      b: { key: 'b', name: def.branches.b.name, desc: def.branches.b.desc, cost: costOf(def.branches.b.levels[0]) },
    };
  }
  return { kind: 'level', cost: costOf(levelDef(t.type, t.level + 1, t.branch)) };
}

function computeBase(s, t) {
  const def = TOWERS[t.type];
  const st = t.st;
  for (const k of STAT_KEYS) st[k] = 0;
  st.kind = def.kind; st.dtype = def.dtype || 'phys'; st.air = !!def.air; st.ground = !!def.ground;
  st.projSpeed = def.projSpeed || 10; st.minRange = def.minRange || 0; st.flight = def.flight || 1;
  st.falloff = 1; st.critMul = 2;
  const nb = def.levels.length;
  for (let i = 0; i < Math.min(t.level, nb); i++) assignLevel(st, def.levels[i]);
  if (t.branch) for (let i = 0; i < t.level - nb; i++) assignLevel(st, def.branches[t.branch].levels[i]);
  st.baseRange = st.range;
}
function assignLevel(st, ld) { for (const k in ld) if (k !== 'cost') st[k] = ld[k]; }

function finalize(s, t, bd, br, bR) {
  const st = t.st;
  const tile = s.map.tiles[t.tile];
  const tm = s.mods.terrain;
  const rangeMul = s.mods.range * s.modeRange * (tile === T.HIGH ? 1 + 0.2 * tm : 1) * (1 + bR);
  const dmgMul = s.modeDmg * (tile === T.CRYSTAL ? 1 + 0.25 * tm : 1) * (1 + bd);
  const rateMul = s.mods.rate * s.modeRate * (1 + br);
  const k = st.kind;
  st.buffDmgIn = bd; st.buffRateIn = br; st.buffRangeIn = bR;
  if (k !== 'support' && k !== 'mine' && k !== 'none') {
    st.range *= rangeMul; st.dmg *= dmgMul; st.rate *= rateMul;
    st.poison *= dmgMul; st.burn *= dmgMul; st.napalm *= dmgMul; st.clusterDmg *= dmgMul;
    if (st.splash > 0) { st.splash *= s.mods.splash; st.dmg *= s.mods.splashDmg; st.clusterDmg *= s.mods.splashDmg; }
    if (k === 'chain') st.jumps += s.mods.jumps;
    st.crit += s.mods.crit;
    if (st.detect) st.detect = st.range;
  } else if (st.detect) {
    st.detect *= s.mods.range * s.modeRange;
  }
  if (st.detect && t.type === 'beacon') st.detect *= 1;
  if (s.mods.detectAll > 0 && st.range > 0 && k !== 'support' && k !== 'mine' && k !== 'none') {
    st.detect = Math.max(st.detect, st.range * s.mods.detectAll);
  }
  if (t.type === 'wall' && s.mods.thorns > 0) st.thorns = s.mods.thorns * s.modeDmg;
  st.dps = estimateDps(st);
}

function estimateDps(st) {
  switch (st.kind) {
    case 'bolt': return st.dmg * st.rate * (st.multishot || 1) * (1 + st.crit * (st.critMul - 1)) + st.poison * Math.min(st.poisonMax, 3);
    case 'shell': case 'mortar': return st.dmg * st.rate + (st.cluster ? st.cluster * st.clusterDmg * st.rate * 0.5 : 0) + st.napalm * 0.5;
    case 'chain': return st.dmg * st.rate * (1 + st.jumps * 0.6);
    case 'snipe': case 'rail': return st.dmg * st.rate;
    case 'pulse': return st.dmg * st.rate;
    case 'flame': return st.dmg * st.rate + st.burn;
    case 'aura': return st.dmg * st.rate + st.thorns;
    default: return st.thorns || 0;
  }
}

export function refreshTowers(s) {
  s.mines.length = 0; s.detectors.length = 0; s.supports.length = 0;
  for (const t of s.towers) {
    computeBase(s, t);
    if (t.type === 'mine') s.mines.push(t);
    if (t.st.kind === 'support' || t.st.rangeAura) s.supports.push(t);
  }
  for (const t of s.supports) finalize(s, t, 0, 0, 0);
  for (const t of s.towers) {
    let bd = 0, br = 0, bR = 0;
    for (const u of s.supports) {
      if (u === t) continue;
      const dx = u.x - t.x, dy = u.y - t.y, d = Math.sqrt(dx * dx + dy * dy);
      if (u.type === 'beacon' && d <= u.st.range + 0.01) {
        if (u.st.buffDmg > bd) bd = u.st.buffDmg;
        if (u.st.buffRate > br) br = u.st.buffRate;
        if (u.st.buffRange > bR) bR = u.st.buffRange;
      }
      if (u.st.rangeAura && d <= 1.6) bR = Math.max(bR, u.st.rangeAura);
    }
    if (t.st.kind !== 'support') finalize(s, t, bd, br, bR);
    if (t.st.detect > 0 || t.st.mark > 0) s.detectors.push(t);
  }
  s.towerVer++;
}

// Placement check. Returns { ok, reason, cost, pathOk }.
export function canBuild(s, tile, type) {
  const res = { ok: false, reason: '', cost: TOWERS[type] ? buildCost(s, type) : 0, pathOk: false };
  if (s.over) { res.reason = 'The run is over'; return res; }
  if (!TOWERS[type]) { res.reason = 'Unknown tower'; return res; }
  if (tile < 0 || tile >= s.n) { res.reason = 'Off the map'; return res; }
  if (s.towerGrid[tile]) { res.reason = 'Already built here'; return res; }
  const tt = s.map.tiles[tile];
  if (!BUILDABLE[tt]) { res.reason = `Cannot build on ${TILE_NAMES[tt].toLowerCase()}`; return res; }
  if (heroOnTile(s, tile)) { res.reason = 'The hero is standing there'; return res; }
  for (const e of s.enemies) {
    if (e.alive && !e.flying && (e.tile === tile || e.next === tile)) { res.reason = 'An enemy is in the way'; return res; }
  }
  computeField(s.map, s.blocked, s.scratch, tile);
  for (const g of s.map.gates) if (s.scratch[g] >= INF) { res.reason = 'That would block the path'; return res; }
  for (const e of s.enemies) {
    if (e.alive && !e.flying && s.scratch[e.tile] >= INF) { res.reason = 'That would trap enemies'; return res; }
  }
  res.pathOk = true;
  if (s.gold < res.cost) { res.reason = 'Not enough gold'; return res; }
  res.ok = true;
  return res;
}

export function build(s, tile, type) {
  const r = canBuild(s, tile, type);
  if (!r.ok) return r;
  s.gold -= r.cost;
  s.stats.spent += r.cost;
  const t = {
    id: s.nextTowerId++, type, tile, x: (tile % s.map.w) + 0.5, y: ((tile / s.map.w) | 0) + 0.5,
    level: 1, branch: null, prio: TOWERS[type].prio || 'first', invested: r.cost, kills: 0, dealt: 0, fresh: true,
    cd: 0.2, angle: -Math.PI / 2, jamT: 0, st: {}, engBoost: 0, ver: 1,
  };
  placeTower(s, t);
  s.stats.built++;
  r.tower = t;
  return r;
}

function placeTower(s, t) {
  s.towers.push(t);
  s.blocked[t.tile] = 1;
  s.towerGrid[t.tile] = t;
  computeField(s.map, s.blocked, s.dist);
  s.fieldVer++;
  refreshTowers(s);
}

export function upgrade(s, t, branch) {
  const info = upgradeInfo(s, t);
  if (info.kind === 'max') return { ok: false, reason: 'Fully upgraded' };
  let cost;
  if (info.kind === 'branch') {
    if (branch !== 'a' && branch !== 'b') return { ok: false, reason: 'Choose a branch' };
    cost = info[branch].cost;
  } else cost = info.cost;
  if (s.gold < cost) return { ok: false, reason: 'Not enough gold' };
  s.gold -= cost;
  s.stats.spent += cost;
  t.invested += cost;
  if (info.kind === 'branch') t.branch = branch;
  t.level++;
  t.ver++;
  refreshTowers(s);
  return { ok: true, cost };
}

export function sellValue(s, t) {
  return Math.round(t.invested * (t.fresh ? 1 : s.mods.sellRate));
}

export function sell(s, t) {
  const i = s.towers.indexOf(t);
  if (i < 0) return 0;
  const v = sellValue(s, t);
  s.gold += v;
  s.towers.splice(i, 1);
  s.blocked[t.tile] = 0;
  s.towerGrid[t.tile] = null;
  computeField(s.map, s.blocked, s.dist);
  s.fieldVer++;
  refreshTowers(s);
  s.stats.sold++;
  return v;
}

export function setPriority(s, t, p) { if (PRIORITIES.includes(p)) t.prio = p; }

// Paths from every gate to the core for the preview line. extraTile: hypothetical building.
export function previewPaths(s, extraTile = -1) {
  let dist = s.dist;
  if (extraTile >= 0) { computeField(s.map, s.blocked, s.scratch, extraTile); dist = s.scratch; }
  return s.map.gates.map((g) => tracePath(s.map, dist, g, []));
}

export function pathLength(s) {
  let total = 0;
  for (const g of s.map.gates) total += s.dist[g] >= INF ? 0 : s.dist[g];
  return total;
}

// ------------------------------------------------------------------------------------------------
// Waves
// ------------------------------------------------------------------------------------------------
export function nextWaveSummary(s) { return s.next ? waveSummary(s.next) : []; }

export function canCallWave(s) {
  if (s.over || s.pendingCards) return false;
  for (const g of s.spawns) if (g.left > 0) return false;
  return true;
}

export function earlyBonus(s) {
  if (s.waiting) return 0;
  const n = s.wave + 1;
  const base = (4 + 1.6 * n) * (s.mode === 'op' ? OP.bounty : 1);
  if (s.activeWaves.length > 0) return Math.round(base);
  if (s.timer > 0 && s.autoWaves) return Math.round(base * s.timer / s.timerMax);
  return 0;
}

export function callWave(s) {
  if (!canCallWave(s)) return 0;
  const bonus = earlyBonus(s);
  s.gold += bonus;
  s.stats.goldEarned += bonus;
  startWave(s);
  return bonus;
}

function startWave(s) {
  const w = ++s.wave;
  const wave = s.next || generateWave(w, s.seed, s.mode, s.map.gates.length);
  let pending = 0;
  for (const g of wave.groups) {
    s.spawns.push({ type: g.type, left: g.count, interval: g.interval, t: g.delay, gate: g.gate, gi: 0, wave: w });
    pending += g.count;
  }
  s.wavePending[w] = pending;
  if (!s.waveAlive[w]) s.waveAlive[w] = 0;
  s.activeWaves.push(w);
  s.next = generateWave(w + 1, s.seed, s.mode, s.map.gates.length);
  s.waiting = false;
  s.timer = 0;
  // income
  let income = 0;
  for (const t of s.mines) {
    const g = Math.round(t.st.income * s.mods.mine * (s.mode === 'op' ? 3 : 1));
    income += g;
    fx(s, 'gold', t.x, t.y, 0, 0, 0, 0xf0b44c, g);
    if (t.st.interest) income += Math.round(Math.min(t.st.interestCap, s.gold * t.st.interest));
  }
  if (s.mods.interest > 0) income += Math.round(Math.min(s.mods.interestCap, s.gold * s.mods.interest));
  s.gold += income;
  s.stats.goldEarned += income;
  for (const t of s.towers) t.fresh = false;
  const h = s.hero;
  if (!h.unlocked && w >= HERO.unlockWave) { h.unlocked = true; s.events.push('heroUnlock'); }
  s.events.push(wave.boss ? 'boss' : 'wave');
}

function waveCleared(s, w) {
  const i = s.activeWaves.indexOf(w);
  if (i >= 0) s.activeWaves.splice(i, 1);
  delete s.waveAlive[w];
  delete s.wavePending[w];
  const bonus = Math.round((8 + 2.2 * w) * s.mods.waveBonus * (s.mode === 'op' ? OP.bounty : 1));
  s.gold += bonus;
  s.stats.goldEarned += bonus;
  if (w > s.cleared) s.cleared = w;
  if (s.mods.lifeRegen > 0 && w % 5 === 0) s.lives += s.mods.lifeRegen;
  if (s.activeWaves.length === 0) s.timer = s.timerMax;
  if (w % cardEvery(s) === 0 || w % 10 === 0) {
    const hand = drawCards(s, w);
    if (hand.length) { s.pendingCards = hand; s.events.push('cards'); }
  }
  s.events.push('cleared');
  fx(s, 'text', 0, 0, 0, 0, 0, 0xf0b44c, bonus);
}

export function drawCards(s, w) {
  const rng = makeRng(hashSeed(`${s.seed}:cards:${w}:${s.perks.length}`));
  const count = (id) => s.perks.reduce((a, p) => a + (p === id ? 1 : 0), 0);
  const owned = heroWeapons(s);
  const pool = [];
  for (const c of CARDS) {
    const n = count(c.id);
    let wgt = 0;
    if (c.kind === 'perk') wgt = n < 3 ? 5 : 0;
    else if (c.kind === 'econ') wgt = (c.id === 'salvage' ? n < 1 : n < 3) ? 3.5 : 0;
    else if (c.kind === 'relic') wgt = n < 1 ? 2 : 0;
    else if (c.kind === 'curse') wgt = n < 1 ? 1.5 : 0;
    else if (c.kind === 'hero') {
      if (!s.hero.unlocked) wgt = 0;
      else if (c.weapon) wgt = owned.includes(c.weapon) ? 0 : 2.5;
      else wgt = n < 2 ? (s.hero.deployed ? 3.5 : 1.5) : 0;
    }
    if (wgt > 0) pool.push([c.id, wgt]);
  }
  const hand = [];
  while (hand.length < 3 && pool.length) {
    const id = rng.weighted(pool);
    hand.push(id);
    pool.splice(pool.findIndex((p) => p[0] === id), 1);
  }
  return hand;
}

export function pickCard(s, idx) {
  if (!s.pendingCards) return null;
  const id = s.pendingCards[idx];
  if (!id) return null;
  const c = CARD_BY_ID[id];
  s.perks.push(id);
  recomputeMods(s);
  if (c.now) c.now(s, cardStrength(s));
  if (c.weapon) s.hero.weapon = c.weapon;
  s.pendingCards = null;
  refreshTowers(s);
  return id;
}

// ------------------------------------------------------------------------------------------------
// Abilities
// ------------------------------------------------------------------------------------------------
export function abilityReady(s, id) { return s.ab[id] <= 0 && !s.over && abilityList(s).includes(id); }

export function useAbility(s, id, x = 0, y = 0) {
  if (!abilityReady(s, id) || s.pendingCards) return false;
  const def = ABILITIES[id];
  const w = Math.max(1, s.wave);
  const gruntHp = ENEMIES.grunt.hp * Math.pow(enemyScale(s, w), 0.7);
  if (id === 'meteor' || id === 'orbital') {
    const z = newZone(s);
    z.kind = id; z.x = x; z.y = y; z.r = def.r; z.t = id === 'meteor' ? 0.75 : 0.35;
    z.dmg = gruntHp * (id === 'meteor' ? 10 : 25) * s.modeDmg;
    z.dps = 0;
  } else if (id === 'freeze') {
    for (const e of s.enemies) {
      if (!e.alive) continue;
      const d = e.boss ? 0.9 : 3;
      if (e.stunT < d) e.stunT = d;
      e.stunImm = e.stunT + (e.boss ? 2.5 : 0.6);
      e.frozenT = d;
      applySlow(s, e, 0.5, 6);
      e.chillT = 6;
    }
    fx(s, 'nova', s.map.w / 2, s.map.h / 2, 0, 0, Math.max(s.map.w, s.map.h), 0x9fe8ff);
    s.sfx.freeze++;
  } else if (id === 'rush') {
    const g = Math.round((15 + 4 * w) * (s.mode === 'op' ? 3 : 1));
    s.gold += g;
    s.stats.goldEarned += g;
    s.rushT = 12;
    fx(s, 'text', 0, 0, 0, 0, 0, 0xf0b44c, g);
  }
  s.ab[id] = def.cd * s.mods.cooldown;
  return true;
}

function newZone(s) {
  let z = s.zpool.pop();
  if (!z) z = {};
  z.kind = ''; z.x = 0; z.y = 0; z.r = 1; z.t = 1; z.dps = 0; z.dmg = 0; z.tick = 0; z.src = null; z.T = 1;
  s.zones.push(z);
  return z;
}

// ------------------------------------------------------------------------------------------------
// Hero commands
// ------------------------------------------------------------------------------------------------
export function setHeroInput(s, mx, my, ax, ay, aim, control) {
  const h = s.hin;
  h.mx = Number.isFinite(mx) ? mx : 0; h.my = Number.isFinite(my) ? my : 0;
  h.ax = Number.isFinite(ax) ? ax : 0; h.ay = Number.isFinite(ay) ? ay : 0;
  h.aim = !!aim; h.control = !!control;
}
export function cycleWeapon(s) {
  const list = heroWeapons(s);
  const i = list.indexOf(s.hero.weapon);
  s.hero.weapon = list[(i + 1) % list.length];
  s.hero.cd = Math.max(s.hero.cd, 0.15);
  return s.hero.weapon;
}

// ------------------------------------------------------------------------------------------------
// Step
// ------------------------------------------------------------------------------------------------
export function step(s, dt) {
  if (s.over || s.pendingCards) return;
  s.tick++;
  s.time += dt;
  for (const k in s.ab) if (s.ab[k] > 0) s.ab[k] -= dt;
  if (s.rushT > 0) s.rushT -= dt;

  if (s.activeWaves.length === 0 && !s.waiting && s.autoWaves && s.timer > 0) {
    s.timer -= dt;
    if (s.timer <= 0) startWave(s);
  }

  updateSpawns(s, dt);
  rebuildBuckets(s);
  if (s.tick % 3 === 0) updateDetectors(s);
  updateEnemies(s, dt);
  rebuildBuckets(s);
  updateTowers(s, dt);
  updateProjectiles(s, dt);
  updateZones(s, dt);
  processBlasts(s);
  updateHero(s, dt);
  cleanup(s);

  for (let i = s.activeWaves.length - 1; i >= 0; i--) {
    const w = s.activeWaves[i];
    if ((s.waveAlive[w] || 0) <= 0 && (s.wavePending[w] || 0) <= 0) waveCleared(s, w);
  }
}

function updateSpawns(s, dt) {
  const gates = s.map.gates;
  for (let i = 0; i < s.spawns.length; i++) {
    const g = s.spawns[i];
    if (g.left <= 0) continue;
    g.t -= dt;
    let guard = 20;
    while (g.t <= 0 && g.left > 0 && guard-- > 0) {
      const gi = g.gate >= 0 ? g.gate % gates.length : (g.gi++ % gates.length);
      const tile = gates[gi];
      const x = (tile % s.map.w) + 0.5, y = ((tile / s.map.w) | 0) + 0.5;
      spawnEnemy(s, g.type, x, y, tile, g.wave, enemyScale(s, g.wave));
      if (ENEMIES[g.type].boss) { fx(s, 'shake', x, y, 0, 0, 0.4); s.events.push('bossSpawn'); }
      g.left--;
      s.wavePending[g.wave]--;
      g.t += g.interval;
    }
  }
  let j = 0;
  for (let i = 0; i < s.spawns.length; i++) if (s.spawns[i].left > 0) s.spawns[j++] = s.spawns[i];
  s.spawns.length = j;
}

function updateDetectors(s) {
  const buf = s.qbuf;
  for (const t of s.detectors) {
    if (t.jamT > 0) continue;
    const st = t.st;
    const r = Math.max(st.detect, st.mark ? st.detect : 0);
    if (r <= 0) continue;
    const n = query(s, t.x, t.y, r, buf);
    for (let i = 0; i < n; i++) {
      const e = buf[i];
      if (e.stealth && e.revealT < 0.2) e.revealT = 0.2;
      if (st.mark) { if (e.mark < st.mark || e.markT <= 0) e.mark = st.mark; e.markT = 0.2; }
    }
  }
}

function updateEnemies(s, dt) {
  const map = s.map;
  const w = map.w;
  const list = s.enemies;
  const h = s.hero;
  const heroUp = h.deployed && h.downT <= 0;
  const coreX = (map.core % w) + 0.5, coreY = ((map.core / w) | 0) + 0.5;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.alive) continue;
    const def = ENEMIES[e.type];
    e.age += dt;
    if (e.slowT > 0) e.slowT -= dt;
    if (e.frozenT > 0) e.frozenT -= dt;
    if (e.chillT > 0) { e.chillT -= dt; if (e.chillT <= 0) e.chill = 0; }
    if (e.freezeImm > 0) e.freezeImm -= dt;
    if (e.stunImm > 0) e.stunImm -= dt;
    if (e.oilT > 0) e.oilT -= dt;
    if (e.shredT > 0) { e.shredT -= dt; if (e.shredT <= 0) e.shred = 0; }
    if (e.corrodeT > 0) e.corrodeT -= dt;
    if (e.markT > 0) e.markT -= dt;
    if (e.heroMarkT > 0) e.heroMarkT -= dt;
    if (e.revealT > 0) e.revealT -= dt;
    if (def.shimmer && (e.age % def.shimmer.every) < def.shimmer.dur && e.revealT < dt * 2) e.revealT = dt * 2;
    if (e.hitT > 0) e.hitT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      damage(s, e, e.burn * dt, 'fire', e.burnSrc, F_DOT);
      if (e.burnT <= 0) e.burn = 0;
      if (!e.alive) continue;
    }
    if (e.poisonT > 0) {
      e.poisonT -= dt;
      damage(s, e, e.poison * e.poisonStacks * dt, 'poison', e.poisonSrc, F_DOT);
      if (e.poisonT <= 0) { e.poison = 0; e.poisonStacks = 0; e.plague = 0; }
      if (!e.alive) continue;
    }
    if (def.regen && e.burnT <= 0 && e.poisonT <= 0 && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * def.regen * dt);
    }
    if (e.maxShield > 0) {
      if (e.shieldDelay > 0) e.shieldDelay -= dt;
      else if (e.shield < e.maxShield) e.shield = Math.min(e.maxShield, e.shield + e.maxShield * 0.25 * dt);
    }
    if (def.heal) {
      e.healCd -= dt;
      if (e.healCd <= 0) {
        e.healCd = def.heal.every;
        const buf = s.qbuf;
        const n = query(s, e.x, e.y, def.heal.r, buf);
        for (let k = 0; k < n; k++) {
          const o = buf[k];
          if (o === e || o.hp >= o.maxHp) continue;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * def.heal.pct);
        }
        fx(s, 'heal', e.x, e.y, 0, 0, def.heal.r, 0x6fe0a0);
      }
    }
    if (def.spawn) {
      e.spawnCd -= dt;
      if (e.spawnCd <= 0) {
        e.spawnCd = def.spawn.every;
        for (let k = 0; k < def.spawn.n; k++) {
          const c = spawnEnemy(s, def.spawn.type, e.x + (s.rng.next() - 0.5) * 0.4, e.y + (s.rng.next() - 0.5) * 0.4, e.tile, e.wave, e.scale * 0.8);
          if (!c.flying && !e.flying) { c.next = e.next >= 0 ? e.next : c.next; c.lastDir = e.lastDir; }
          if (!c.flying && e.flying) { c.x = e.x; c.y = e.y; }
        }
      }
    }
    if (def.summon) {
      while (e.summonIdx < def.summon.at.length && e.hp / e.maxHp <= def.summon.at[e.summonIdx]) {
        e.summonIdx++;
        for (let k = 0; k < def.summon.n; k++) {
          const c = spawnEnemy(s, def.summon.type, e.x, e.y, e.tile, e.wave, e.scale * 0.6);
          c.next = e.next >= 0 ? e.next : c.next; c.lastDir = e.lastDir;
        }
        fx(s, 'pulse', e.x, e.y, 0, 0, 1.2, 0xff6040);
      }
    }
    if (def.stomp) {
      e.stompCd -= dt;
      if (e.stompCd <= 0) {
        e.stompCd = def.stomp.every;
        jamTowers(s, e.x, e.y, def.stomp.r, def.stomp.jam);
        fx(s, 'pulse', e.x, e.y, 0, 0, def.stomp.r, 0xff5040);
        fx(s, 'shake', e.x, e.y, 0, 0, 0.3);
        if (heroUp && Math.hypot(h.x - e.x, h.y - e.y) < def.stomp.r) hurtHero(s, 40 * (1 + 0.03 * (e.wave - 1)));
      }
    }
    if (def.sap) {
      e.sapCd -= dt;
      if (e.sapCd <= 0) {
        const n = jamTowers(s, e.x, e.y, def.sap.r, def.sap.jam);
        const heroNear = heroUp && Math.hypot(h.x - e.x, h.y - e.y) < def.sap.r;
        if (heroNear) hurtHero(s, 22 * (1 + 0.03 * (e.wave - 1)));
        if (n > 0 || heroNear) { e.sapCd = def.sap.every; fx(s, 'jam', e.x, e.y, 0, 0, def.sap.r, 0xff5a5a); s.sfx.jam++; }
        else e.sapCd = 0.25;
      }
    }
    if (def.shoot && heroUp) {
      e.shootCd -= dt;
      if (e.shootCd <= 0) {
        const dx = h.x - e.x, dy = h.y - e.y;
        if (dx * dx + dy * dy < def.shoot.r * def.shoot.r) { enemyShoot(s, e, def); e.shootCd = def.shoot.every; }
        else e.shootCd = 0.3;
      }
    }
    if (def.burrow) {
      if (e.burrowT > 0) e.burrowT -= dt;
      else { e.burrowCd -= dt; if (e.burrowCd <= 0) { e.burrowT = def.burrow.dur; e.burrowCd = def.burrow.every; } }
    }
    if (def.blink && !e.flying) {
      e.blinkCd -= dt;
      if (e.blinkCd <= 0 && e.stunT <= 0) {
        e.blinkCd = def.blink.every;
        fx(s, 'pulse', e.x, e.y, 0, 0, 0.8, 0x9a7cff);
        if (moveGround(s, e, def.blink.tiles)) { leak(s, e); continue; }
        fx(s, 'pulse', e.x, e.y, 0, 0, 0.8, 0x9a7cff);
      }
    }
    // movement
    if (e.stunT > 0) { e.stunT -= dt; }
    else {
      let sp = e.speed * dt;
      if (e.slowT > 0) sp *= 1 - e.slow;
      if (e.burrowT > 0) sp *= def.burrow.speedMul;
      if (!e.flying) {
        const ti = ((e.y | 0) * w) + (e.x | 0);
        if (map.tiles[ti] === T.MUD) sp *= 0.5;
        if (moveGround(s, e, sp)) { leak(s, e); continue; }
      } else {
        const dx = coreX - e.x, dy = coreY - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= sp + 0.05) { leak(s, e); continue; }
        e.vx = dx / d; e.vy = dy / d;
        e.x += e.vx * sp; e.y += e.vy * sp;
      }
    }
    if (!e.flying) {
      if (e.next >= 0) {
        const nx = (e.next % w) + 0.5, ny = ((e.next / w) | 0) + 0.5;
        e.prog = s.dist[e.next] + Math.abs(nx - e.x) + Math.abs(ny - e.y);
      } else e.prog = s.dist[e.tile] < INF ? s.dist[e.tile] : 99;
    } else {
      e.prog = Math.sqrt((coreX - e.x) ** 2 + (coreY - e.y) ** 2);
    }
    if (e.stuckT > 0) s.stats.stuck = Math.max(s.stats.stuck, e.stuckT);
  }
}

function jamTowers(s, x, y, r, dur) {
  let n = 0;
  const r2 = r * r;
  for (const t of s.towers) {
    if (t.type === 'wall') continue;
    const dx = t.x - x, dy = t.y - y;
    if (dx * dx + dy * dy <= r2) { if (t.jamT < dur) t.jamT = dur; n++; }
  }
  return n;
}

function leak(s, e) {
  const def = ENEMIES[e.type];
  e.alive = false;
  s.waveAlive[e.wave]--;
  s.lives -= def.lives;
  s.stats.leaks += def.lives;
  fx(s, 'leak', e.x, e.y, 0, 0, 0, 0xe25c5c, def.lives);
  s.sfx.leak++;
  if (s.lives <= 0) {
    s.lives = 0;
    s.over = true;
    s.events.push('over');
  }
}

// ---------- towers ------------------------------------------------------------------------------
function canTarget(e, st) {
  return e.alive && e.hp > 0 && e.burrowT <= 0 && (!e.stealth || e.revealT > 0) && (e.flying ? st.air : st.ground);
}

function findTarget(s, t, st, exN) {
  const { w, h } = s.map;
  const r = st.range, r2 = r * r, m2 = st.minRange * st.minRange;
  let x0 = Math.floor(t.x - r), x1 = Math.floor(t.x + r), y0 = Math.floor(t.y - r), y1 = Math.floor(t.y + r);
  if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x1 >= w) x1 = w - 1; if (y1 >= h) y1 = h - 1;
  const prio = t.prio;
  const excl = s.excl;
  let best = null, bs = -Infinity;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      let e = s.bhead[ty * w + tx];
      while (e) {
        if (canTarget(e, st)) {
          const dx = e.x - t.x, dy = e.y - t.y, d2 = dx * dx + dy * dy;
          if (d2 <= r2 && d2 >= m2) {
            let skip = false;
            for (let k = 0; k < exN; k++) if (excl[k] === e) { skip = true; break; }
            if (!skip) {
              let sc;
              switch (prio) {
                case 'last': sc = e.prog; break;
                case 'strong': sc = e.hp + e.shield; break;
                case 'weak': sc = -(e.hp + e.shield); break;
                case 'close': sc = -d2; break;
                default: sc = -e.prog;
              }
              if (sc > bs) { bs = sc; best = e; }
            }
          }
        }
        e = e.bnext;
      }
    }
  }
  return best;
}

function updateTowers(s, dt) {
  const h = s.hero;
  const heroUp = h.deployed && h.downT <= 0;
  const rally = s.mods.heroRally;
  for (let i = 0; i < s.towers.length; i++) {
    const t = s.towers[i];
    const st = t.st;
    if (t.jamT > 0) { t.jamT -= dt; continue; }
    const kind = st.kind;
    if (t.type === 'wall') {
      if (kind !== 'aura' && !st.thorns) continue;
      t.cd -= dt;
      if (t.cd > 0) continue;
      t.cd = 0.5;
      const dmg = (kind === 'aura' ? st.dmg * st.rate * 0.5 : 0) + st.thorns * 0.5;
      const buf = s.qbuf2;
      const n = query(s, t.x, t.y, kind === 'aura' ? st.range : 1.5, buf, 1);
      for (let k = 0; k < n; k++) damage(s, buf[k], dmg, 'phys', t, F_SPLASH);
      if (n > 0 && kind === 'aura') { t.angle += 0.6; fx(s, 'hit', t.x, t.y, 0, 0, 0.3, 0xd8d0c0); }
      continue;
    }
    if (kind === 'support' || kind === 'mine' || kind === 'none') continue;
    let boost = 1;
    if (rally > 0 && heroUp) {
      const dx = t.x - h.x, dy = t.y - h.y;
      if (dx * dx + dy * dy < 6.25) boost = 1 + rally;
    }
    t.cd -= dt * boost;
    if (t.cd > 0) continue;
    const target = findTarget(s, t, st, 0);
    if (!target) { t.cd = 0.08; continue; }
    t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    fireTower(s, t, st, target);
    t.cd += 1 / st.rate;
    if (t.cd < 0) t.cd = 0;
  }
}

function rollCrit(s, st) { return st.crit > 0 && s.rng.next() < st.crit; }

function fireTower(s, t, st, target) {
  switch (st.kind) {
    case 'bolt': {
      const n = st.multishot || 1;
      let e = target;
      for (let k = 0; k < n && e; k++) {
        const p = newProj(s);
        p.kind = 'bolt'; p.x = t.x; p.y = t.y; p.z = 0.9; p.target = e; p.tuid = e.uid; p.tx = e.x; p.ty = e.y;
        p.speed = st.projSpeed; p.dmg = st.dmg; p.dtype = st.dtype; p.src = t; p.st = st; p.color = DCOL[st.dtype];
        s.excl[k] = e;
        e = k + 1 < n ? findTarget(s, t, st, k + 1) : null;
      }
      s.sfx.shoot++;
      break;
    }
    case 'shell': {
      const p = newProj(s);
      p.kind = 'shell'; p.x = t.x; p.y = t.y; p.z = 0.8; p.target = target; p.tuid = target.uid; p.tx = target.x; p.ty = target.y;
      p.speed = st.projSpeed; p.dmg = st.dmg; p.dtype = st.dtype; p.src = t; p.st = st; p.splash = st.splash; p.color = st.oil ? 0x403020 : 0x303030;
      fx(s, 'muzzle', t.x, t.y, Math.cos(t.angle), Math.sin(t.angle), 0.5, 0xffc080);
      s.sfx.boom++;
      break;
    }
    case 'mortar': {
      const p = newProj(s);
      p.kind = 'mortar'; p.sx = p.x = t.x; p.sy = p.y = t.y; p.z = 0.8;
      const sp = target.speed * (target.slowT > 0 ? 1 - target.slow : 1) * (target.stunT > 0 ? 0 : 1);
      p.tx = target.x + target.vx * sp * st.flight; p.ty = target.y + target.vy * sp * st.flight;
      p.T = st.flight; p.t = 0; p.dmg = st.dmg; p.dtype = st.dtype; p.src = t; p.st = st; p.splash = st.splash; p.color = 0x2a2a2a;
      fx(s, 'muzzle', t.x, t.y, 0, 0, 0.5, 0xffc080);
      s.sfx.mortar++;
      break;
    }
    case 'chain': {
      const hit = s.chainHit;
      let hn = 0, e = target, px = t.x, py = t.y, d = st.dmg;
      const jumps = Math.min(30, st.jumps);
      for (let j = 0; j <= jumps && e; j++) {
        damage(s, e, d, 'shock', t, 0, st.shieldMul || 2);
        applyOnHit(s, e, st, t);
        fx(s, 'beam', px, py, e.x, e.y, 0.9, 0xc8a2ff, 0.12);
        hit[hn++] = e; px = e.x; py = e.y; d *= st.falloff;
        e = chainNextTower(s, e, st, hit, hn);
      }
      s.sfx.zap++;
      break;
    }
    case 'snipe': {
      let d = st.dmg;
      if (target.boss && st.bossMul) d *= st.bossMul;
      if (rollCrit(s, st)) d *= st.critMul;
      damage(s, target, d, st.dtype, t);
      if (target.alive && st.execute && !target.boss && target.hp / target.maxHp < st.execute) {
        kill(s, target, t);
        fx(s, 'hit', target.x, target.y, 0, 0, 0.6, 0xff4040);
      }
      fx(s, 'beam', t.x, t.y, target.x, target.y, 0.6, 0xffe07a, 0.12);
      s.sfx.snipe++;
      break;
    }
    case 'rail': {
      const ca = Math.cos(t.angle), sa = Math.sin(t.angle), L = st.range;
      const list = s.enemies;
      const n0 = list.length;
      for (let i = 0; i < n0; i++) {
        const e = list[i];
        if (!e.alive || e.hp <= 0 || e.burrowT > 0) continue;
        const px = e.x - t.x, py = e.y - t.y;
        const along = px * ca + py * sa;
        if (along < 0 || along > L) continue;
        const ox = px - ca * along, oy = py - sa * along;
        const rr = 0.3 + e.size * 0.3;
        if (ox * ox + oy * oy < rr * rr) damage(s, e, st.dmg, 'pierce', t);
      }
      fx(s, 'beam', t.x, t.y, t.x + ca * L, t.y + sa * L, 1.6, 0xfff0a0, 0.2);
      s.sfx.rail++;
      break;
    }
    case 'pulse': {
      const buf = s.qbuf2;
      const n = query(s, t.x, t.y, st.range, buf);
      for (let k = 0; k < n; k++) {
        const e = buf[k];
        if (e.burrowT > 0) continue;
        damage(s, e, st.dmg, st.dtype, t, F_SPLASH);
        applyOnHit(s, e, st, t);
      }
      fx(s, 'pulse', t.x, t.y, 0, 0, st.range, 0x9fe8ff);
      break;
    }
    case 'flame': {
      const buf = s.qbuf2;
      const n = query(s, t.x, t.y, st.range, buf, st.air ? 0 : 1);
      const a = t.angle, half = st.cone / 2;
      for (let k = 0; k < n; k++) {
        const e = buf[k];
        if (e.burrowT > 0) continue;
        let da = Math.atan2(e.y - t.y, e.x - t.x) - a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) > half + 0.15) continue;
        damage(s, e, st.dmg, 'fire', t);
        applyOnHit(s, e, st, t);
      }
      if ((s.tick & 1) === 0) fx(s, 'flame', t.x, t.y, a, st.range, st.cone, 0xff7a2f);
      s.sfx.flame++;
      break;
    }
  }
}

function chainNextTower(s, from, st, hit, hn) {
  const buf = s.qbuf;
  const n = query(s, from.x, from.y, st.jumpRange, buf);
  let best = null, bd = 1e9;
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    if (!canTarget(e, st)) continue;
    let used = false;
    for (let k = 0; k < hn; k++) if (hit[k] === e) { used = true; break; }
    if (used) continue;
    const dx = e.x - from.x, dy = e.y - from.y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

// ---------- projectiles --------------------------------------------------------------------------
function updateProjectiles(s, dt) {
  const list = s.proj;
  const { w, h } = s.map;
  const hero = s.hero;
  const n0 = list.length;
  for (let i = 0; i < n0; i++) {
    const p = list[i];
    if (!p.alive) continue;
    switch (p.kind) {
      case 'bolt':
      case 'shell': {
        const e = p.target;
        const valid = e && e.alive && e.uid === p.tuid && e.hp > 0;
        if (valid) { p.tx = e.x; p.ty = e.y; }
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy);
        const stp = p.speed * dt;
        if (d <= stp + 0.05) {
          p.alive = false;
          if (p.kind === 'bolt') {
            if (valid && e.burrowT <= 0) {
              let dmg = p.dmg;
              const st = p.st;
              if (st && st.crit > 0 && s.rng.next() < st.crit) { dmg *= st.critMul; fx(s, 'hit', e.x, e.y, 0, 0, 0.5, 0xffffff); }
              damage(s, e, dmg, p.dtype, p.src);
              if (st) applyOnHit(s, e, st, p.src);
              fx(s, 'hit', p.tx, p.ty, 0, 0, 0.2, p.color);
              s.sfx.hit++;
            }
          } else {
            splash(s, p.tx, p.ty, p.splash, p.dmg, p.dtype, p.src, p.st, true);
            fx(s, 'boom', p.tx, p.ty, 0, 0, p.splash, p.st && p.st.oil ? 0x806040 : 0xffa040);
            s.sfx.boom++;
          }
        } else {
          p.x += dx / d * stp; p.y += dy / d * stp;
        }
        break;
      }
      case 'mortar':
      case 'bomblet': {
        p.t += dt;
        const f = Math.min(1, p.t / p.T);
        p.x = p.sx + (p.tx - p.sx) * f;
        p.y = p.sy + (p.ty - p.sy) * f;
        p.z = 0.6 + Math.sin(f * Math.PI) * (p.kind === 'mortar' ? 3 : 0.8);
        if (f >= 1) {
          p.alive = false;
          const st = p.st;
          splash(s, p.tx, p.ty, p.splash, p.dmg, p.dtype, p.src, p.kind === 'mortar' ? null : null, true);
          fx(s, 'boom', p.tx, p.ty, 0, 0, p.splash, 0xffa040);
          s.sfx.boom++;
          if (p.kind === 'mortar' && st) {
            if (st.napalm > 0) {
              const z = newZone(s);
              z.kind = 'fire'; z.x = p.tx; z.y = p.ty; z.r = st.napalmR; z.t = st.napalmDur; z.T = st.napalmDur; z.dps = st.napalm; z.src = p.src;
            }
            if (st.cluster > 0) {
              for (let k = 0; k < st.cluster; k++) {
                const a = (k / st.cluster) * Math.PI * 2 + s.rng.next() * 0.5;
                const rr = 0.7 + s.rng.next() * 0.5;
                const b = newProj(s);
                b.kind = 'bomblet'; b.sx = b.x = p.tx; b.sy = b.y = p.ty; b.tx = p.tx + Math.cos(a) * rr; b.ty = p.ty + Math.sin(a) * rr;
                b.T = 0.35 + s.rng.next() * 0.15; b.t = 0; b.dmg = st.clusterDmg; b.dtype = 'phys'; b.src = p.src; b.splash = 0.65; b.color = 0x2a2a2a;
              }
            }
          }
        }
        break;
      }
      case 'hshot':
      case 'hgren': {
        const sx = p.vx * dt, sy = p.vy * dt;
        p.x += sx; p.y += sy;
        p.range -= Math.sqrt(sx * sx + sy * sy);
        let done = p.range <= 0 || p.x < 0 || p.y < 0 || p.x >= w || p.y >= h;
        if (!done) {
          const buf = s.qbuf;
          const n = query(s, p.x, p.y, 0.6, buf);
          for (let k = 0; k < n; k++) {
            const e = buf[k];
            if (e.burrowT > 0 || (e.stealth && e.revealT <= 0)) continue;
            const dx = e.x - p.x, dy = e.y - p.y, rr = 0.15 + e.size * 0.5;
            if (dx * dx + dy * dy > rr * rr) continue;
            if (p.kind === 'hshot') {
              heroHit(s, e, p.dmg, p.dtype, null);
              fx(s, 'hit', p.x, p.y, 0, 0, 0.25, p.color);
              s.sfx.hit++;
            }
            done = true;
            break;
          }
        }
        if (done) {
          p.alive = false;
          if (p.kind === 'hgren') {
            addBlast(s, p.x, p.y, p.splash, p.dmg, p.dtype, hero, false);
            if (s.mods.heroMark > 0) {
              const buf = s.qbuf;
              const n = query(s, p.x, p.y, p.splash, buf);
              for (let k = 0; k < n; k++) buf[k].heroMarkT = 3;
            }
          }
        }
        break;
      }
      case 'eshot': {
        const sx = p.vx * dt, sy = p.vy * dt;
        p.x += sx; p.y += sy;
        p.range -= Math.sqrt(sx * sx + sy * sy);
        if (p.range <= 0) { p.alive = false; break; }
        if (hero.deployed && hero.downT <= 0) {
          const dx = hero.x - p.x, dy = hero.y - p.y;
          if (dx * dx + dy * dy < 0.12) {
            p.alive = false;
            hurtHero(s, p.dmg);
            fx(s, 'hit', p.x, p.y, 0, 0, 0.3, 0xff5a7a);
          }
        }
        break;
      }
      default: p.alive = false;
    }
  }
}

// ---------- zones --------------------------------------------------------------------------------
function updateZones(s, dt) {
  const list = s.zones;
  for (let i = 0; i < list.length; i++) {
    const z = list[i];
    z.t -= dt;
    if (z.kind === 'fire') {
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.25;
        const buf = s.qbuf2;
        const n = query(s, z.x, z.y, z.r, buf, 1);
        for (let k = 0; k < n; k++) {
          damage(s, buf[k], z.dps * 0.25, 'fire', z.src, F_DOT);
          if (buf[k].alive) applyBurn(s, buf[k], z.dps * 0.4, 1.5, z.src);
        }
      }
    } else if ((z.kind === 'meteor' || z.kind === 'orbital') && z.t <= 0) {
      const buf = s.qbuf2;
      const n = query(s, z.x, z.y, z.r, buf);
      for (let k = 0; k < n; k++) {
        const e = buf[k];
        damage(s, e, z.dmg, 'fire', s.srcAbility, F_SPLASH);
        if (e.alive) applyBurn(s, e, z.dmg * 0.08, 3, s.srcAbility);
      }
      fx(s, 'boom', z.x, z.y, 0, 0, z.r, z.kind === 'orbital' ? 0x9ff0ff : 0xff7a2f);
      fx(s, 'shake', z.x, z.y, 0, 0, z.kind === 'orbital' ? 0.5 : 0.7);
      s.sfx.boom += 2;
    }
  }
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const z = list[i];
    if (z.t > 0) list[j++] = z; else s.zpool.push(z);
  }
  list.length = j;
}

// ---------- cleanup -----------------------------------------------------------------------------
function cleanup(s) {
  let j = 0;
  const E = s.enemies;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.alive) E[j++] = e;
    else { e.bnext = null; e.burnSrc = null; e.poisonSrc = null; s.epool.push(e); }
  }
  E.length = j;
  j = 0;
  const P = s.proj;
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    if (p.alive) P[j++] = p;
    else { p.target = null; p.src = null; p.st = null; s.ppool.push(p); }
  }
  P.length = j;
}

// ------------------------------------------------------------------------------------------------
// Save / load
// ------------------------------------------------------------------------------------------------
const ENEMY_SKIP = new Set(['bnext', 'burnSrc', 'poisonSrc']);
const HERO_KEYS = ['unlocked', 'deployed', 'x', 'y', 'hp', 'downT', 'level', 'xp', 'need', 'points', 'up', 'weapon', 'dashCd', 'ultCd', 'kills', 'dealt', 'autoSpend'];

export function serialize(s) {
  const enemies = [];
  for (const e of s.enemies) {
    if (!e.alive) continue;
    const o = {};
    for (const k in e) if (!ENEMY_SKIP.has(k)) o[k] = e[k];
    enemies.push(o);
  }
  const hero = {};
  for (const k of HERO_KEYS) hero[k] = s.hero[k];
  return {
    v: SAVE_VERSION, seed: s.seed, mode: s.mode, difficulty: s.difficulty, archetype: s.archetype, label: s.label,
    gold: s.gold, lives: s.lives, wave: s.wave, cleared: s.cleared, timer: s.timer, waiting: s.waiting, autoWaves: s.autoWaves,
    perks: s.perks.slice(), ab: { ...s.ab }, rushT: s.rushT, pendingCards: s.pendingCards ? s.pendingCards.slice() : null,
    stats: { ...s.stats }, time: s.time, tick: s.tick, uid: s.uid, rng: s.rng.state(),
    waveAlive: { ...s.waveAlive }, wavePending: { ...s.wavePending }, activeWaves: s.activeWaves.slice(),
    spawns: s.spawns.map((g) => ({ ...g })), nextTowerId: s.nextTowerId,
    towers: s.towers.map((t) => ({ id: t.id, type: t.type, tile: t.tile, level: t.level, branch: t.branch, prio: t.prio,
      invested: t.invested, kills: t.kills, dealt: Math.round(t.dealt), fresh: t.fresh, cd: t.cd, jamT: t.jamT })),
    enemies, hero,
  };
}

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function deserialize(o) {
  try {
    if (!o || o.v !== SAVE_VERSION || typeof o.seed !== 'number') return null;
    const s = baseState(o);
    if (s.archetype !== o.archetype) return null;
    s.gold = num(o.gold); s.lives = num(o.lives, 1); s.wave = num(o.wave) | 0; s.cleared = num(o.cleared) | 0;
    s.timer = num(o.timer); s.waiting = !!o.waiting; s.autoWaves = o.autoWaves !== false;
    s.perks = Array.isArray(o.perks) ? o.perks.filter((id) => CARD_BY_ID[id]) : [];
    recomputeMods(s);
    for (const k in s.ab) s.ab[k] = num(o.ab && o.ab[k]);
    s.rushT = num(o.rushT);
    s.pendingCards = Array.isArray(o.pendingCards) ? o.pendingCards.filter((id) => CARD_BY_ID[id]) : null;
    if (s.pendingCards && !s.pendingCards.length) s.pendingCards = null;
    Object.assign(s.stats, o.stats || {});
    s.time = num(o.time); s.tick = num(o.tick) | 0; s.uid = num(o.uid, 1);
    s.rng = makeRng(num(o.rng, hashSeed(`${o.seed}:combat`)) >>> 0);
    s.waveAlive = {}; s.wavePending = { ...(o.wavePending || {}) };
    s.activeWaves = Array.isArray(o.activeWaves) ? o.activeWaves.slice() : [];
    s.spawns = Array.isArray(o.spawns) ? o.spawns.filter((g) => ENEMIES[g.type]).map((g) => ({ ...g })) : [];
    s.nextTowerId = num(o.nextTowerId, 1);
    for (const ot of o.towers || []) {
      if (!TOWERS[ot.type] || ot.tile < 0 || ot.tile >= s.n || s.towerGrid[ot.tile] || !BUILDABLE[s.map.tiles[ot.tile]]) return null;
      const t = {
        id: ot.id, type: ot.type, tile: ot.tile, x: (ot.tile % s.map.w) + 0.5, y: ((ot.tile / s.map.w) | 0) + 0.5,
        level: Math.max(1, Math.min(ot.level | 0, TOWERS[ot.type].levels.length + 2)),
        branch: ot.branch === 'a' || ot.branch === 'b' ? ot.branch : null, prio: PRIORITIES.includes(ot.prio) ? ot.prio : 'first',
        invested: num(ot.invested), kills: num(ot.kills), dealt: num(ot.dealt), fresh: !!ot.fresh, cd: num(ot.cd), angle: -Math.PI / 2,
        jamT: num(ot.jamT), st: {}, engBoost: 0, ver: 1,
      };
      if (t.level > TOWERS[t.type].levels.length && !t.branch) t.level = TOWERS[t.type].levels.length;
      s.towers.push(t);
      s.blocked[t.tile] = 1;
      s.towerGrid[t.tile] = t;
    }
    computeField(s.map, s.blocked, s.dist);
    for (const g of s.map.gates) if (s.dist[g] >= INF) return null;
    refreshTowers(s);
    for (const oe of o.enemies || []) {
      if (!ENEMIES[oe.type] || !Number.isFinite(oe.x) || !Number.isFinite(oe.y) || !Number.isFinite(oe.hp)) continue;
      const e = Object.assign({}, oe);
      e.bnext = null; e.burnSrc = null; e.poisonSrc = null; e.alive = true;
      if (!e.flying && (s.dist[e.tile] >= INF || e.tile < 0 || e.tile >= s.n)) continue;
      s.enemies.push(e);
      s.waveAlive[e.wave] = (s.waveAlive[e.wave] || 0) + 1;
    }
    // waves with nothing left become cleared on the next step
    for (const w of s.activeWaves) { if (!s.waveAlive[w]) s.waveAlive[w] = 0; if (!s.wavePending[w]) s.wavePending[w] = 0; }
    const h = s.hero;
    if (o.hero) for (const k of HERO_KEYS) if (k in o.hero) h[k] = k === 'up' ? { ...h.up, ...o.hero.up } : o.hero[k];
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y)) { h.x = 0.5; h.y = 0.5; h.deployed = false; }
    if (!heroWeapons(s).includes(h.weapon)) h.weapon = 'blaster';
    h.need = heroXpNeed(h.level);
    if (s.mode === 'op') h.unlocked = true;
    s.next = generateWave(s.wave + 1, s.seed, s.mode, s.map.gates.length);
    if (s.wave === 0) s.waiting = true;
    return s;
  } catch (err) {
    return null;
  }
}

export { heroStats, heroWeapons } from './hero.js';
export { deployHero };
export { heroDash, heroUlt, spendPoint } from './hero.js';
export { hpScale } from './waves.js';
export { INF } from './path.js';
