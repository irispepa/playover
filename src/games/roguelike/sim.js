// Deepvault simulation: one floor of a run, advanced with a fixed timestep. Pure (no DOM, no three.js).
import { makeRng, hashSeed } from '../../shell/rng.js';
import {
  T, CLASSES, ABILITIES, HAZARDS, SCROLLS, SHRINES, MAX_BOMBS, BAG_SIZE, POTION_HEAL, SYNERGIES, biomeFor, tierFor, ENEMIES,
} from './data.js';
import { generateFloor } from './gen.js';
import { computeStats, rollItem, rollPerkChoices, priceOf, sellValue, starterGear, lootValueGold, randomScroll, perkById } from './items.js';
import { solidAt, moveCircle, los, computeFlow, updateFog, revealAll, tileAt, unstick } from './world.js';
import {
  FAC_PLAYER, FAC_ENEMY, emit, toast, sfx, newStatus, makePools, makeEnemy, applyStatus, tickStatus, playerHit, hurtPlayer,
  explode, spawnProj, updateProjs, spawnTele, updateTele, spawnZone, updateZones, dropPickup, chainLightning, healPlayer,
  breakSecret, breakCrate, openArena, xpNeed, hurtEnemy,
} from './combat.js';
import { updateEnemy } from './ai.js';

export const SIM_DT = 1 / 60;
export { xpNeed };

// ---------------------------------------------------------------- runs
export function parseSeed(input) {
  const s = String(input == null ? '' : input).trim();
  if (!s) return null;
  if (/^\d{1,10}$/.test(s)) return { seed: Number(s) >>> 0, label: s };
  return { seed: hashSeed(s.toUpperCase()), label: s.toUpperCase().slice(0, 24) };
}

export function newRun(seed, classId, label) {
  const cls = CLASSES[classId] ? classId : 'warden';
  const rng = makeRng(hashSeed(`gear|${seed}`));
  const gear = starterGear(rng, cls);
  const P = {
    classId: cls, level: 1, xp: 0, hp: 1, energy: 100, gold: 0, keys: 0,
    equip: { weapon: gear.weapon, armor: gear.armor, trinket1: null, trinket2: null },
    bag: [], potions: 2, bombs: 1, scrolls: { mapping: 0, fury: 0, frost: 0, warding: 0, recall: 0 }, perks: {}, pendingPerks: 0,
  };
  P.st = computeStats(P);
  P.hp = P.st.maxHp;
  P.energy = P.st.energyMax;
  return {
    v: 1, seed: seed >>> 0, label: label || String(seed >>> 0), classId: cls, floor: 1, P, loads: 0,
    stats: { kills: 0, elites: 0, bosses: 0, dmgDealt: 0, dmgTaken: 0, gold: 0, items: 0, time: 0, killedBy: null, perks: 0 },
    floorState: null,
  };
}

// ---------------------------------------------------------------- game (one floor)
export function createGame(run, meta) {
  const fl = generateFloor(run.seed, run.floor);
  const W = fl.w, H = fl.h;
  const G = {
    run, P: run.P, meta: meta || null, fl, w: W, h: H, tiles: fl.tiles, floorN: run.floor, tier: tierFor(run.floor),
    biome: biomeFor(run.floor), hazard: biomeFor(run.floor).hazard, time: 0, acc: 0, events: [], enemies: [], byId: new Map(),
    rng: makeRng(hashSeed(`rt|${run.seed}|${run.floor}|${run.loads || 0}`)), nextId: 1,
    flow: new Int16Array(W * H), flowQ: new Int32Array(W * H), flowFrom: -1,
    vis: new Uint8Array(W * H), seen: new Uint8Array(W * H), visList: new Int32Array(W * H), visN: 0, fogVersion: 0, fogFull: false, fogDirty: true,
    spikeMap: new Float32Array(W * H).fill(-1), objects: fl.objects.map((o) => ({ ...o, used: false })),
    killed: [], opened: [], changedTiles: [], delayed: [], scratchIds: [], killLog: {}, seenLog: {},
    boss: null, bossDead: false, arenaSealed: false, decoy: null, choice: null, ctx: null, ctxLabel: '', ctxKey: '',
    descendReq: false, over: false, statsDirty: true, lastTile: -1, mapped: false, seenT: 0, uses: {},
  };
  makePools(G);
  for (const s of fl.spikes) G.spikeMap[s.y * W + s.x] = s.phase;
  const fs = run.floorState;
  if (fs) {
    for (const id of fs.opened || []) { const o = G.objects.find((q) => q.id === id); if (o) o.used = true; G.opened.push(id); }
    for (const [i, t] of fs.tiles || []) { if (i >= 0 && i < W * H) { G.tiles[i] = t; G.changedTiles.push(i); } }
    G.killed = (fs.killed || []).slice();
    if (fs.seen) decodeRle(fs.seen, G.seen);
    G.bossDead = !!fs.bossDead;
    G.uses = fs.uses || {};
    G.mapped = !!fs.mapped;
  }
  // Shop stock is deterministic per pedestal.
  for (const o of G.objects) {
    if (o.kind !== 'pedestal') continue;
    const r = makeRng(o.seed);
    if (o.sell === 'item') { o.item = rollItem(r, run.floor + 1, { minRarity: r.chance(0.3) ? 2 : 1 }); o.price = priceOf(o.item); }
    else if (o.sell === 'potion') o.price = 30 + run.floor * 4;
    else if (o.sell === 'bomb') o.price = 28 + run.floor * 3;
    else if (o.sell === 'key') o.price = 40 + run.floor * 4;
    else { o.scroll = randomScroll(r); o.price = 38 + run.floor * 4; }
  }
  const killedSet = new Set(G.killed);
  for (const sp of fl.spawns) {
    if (killedSet.has(sp.id)) continue;
    if (sp.boss && G.bossDead) continue;
    const e = makeEnemy(G, sp.type, sp.x + 0.5, sp.y + 0.5, { elite: sp.elite, spawnId: sp.id });
    if (e && e.boss) G.boss = e;
  }
  if (fl.isBoss && !G.bossDead) {
    // The stairs only appear once the boss falls.
    G.tiles[fl.stairs.y * W + fl.stairs.x] = T.FLOOR;
  }
  if (fl.isBoss && G.bossDead) openArena(G);
  if (fs && fs.pickups) for (const p of fs.pickups) dropPickup(G, p.kind, p.x, p.y, { amount: p.amount, item: p.item, scroll: p.scroll, still: true });
  initPlayerRuntime(G);
  G.P.st = computeStats(G.P);
  G.P.hp = Math.min(G.P.hp, G.P.st.maxHp);
  updateFog(G);
  G.fogFull = true;
  emit(G, { t: 'floor', floor: run.floor });
  return G;
}

function initPlayerRuntime(G) {
  const P = G.P, fl = G.fl;
  P.x = fl.start.x + 0.5; P.y = fl.start.y + 0.5; P.r = 0.32;
  P.vx = 0; P.vy = 0; P.mvx = 0; P.mvy = 0; P.faceX = 0; P.faceY = -1; P.aimX = 0; P.aimY = -1;
  P.atkT = 0.3; P.dashT = 0; P.dashCd = 0; P.dashX = 0; P.dashY = 0; P.iframes = 1.2; P.cd1 = 0; P.cd2 = 0;
  P.s = newStatus(); P.flash = 0; P.lunge = 0; P.bulwarkT = 0; P.furyT = 0; P.wardHp = 0; P.barrierCd = 0;
  P.momentumT = 0; P.dashCrits = 0; P.frenzyN = 0; P.frenzyT = 0; P.staticT = 3; P.miasmaT = 1; P.orbA = 0;
  P.phoenixUsed = false; P.hitCount = 0; P.pushT = 0; P.dead = false; P.moving = false; P.atkAnim = 0;
  P.lockToastT = 0; P.hazT = 0; P.spikeT = 0; P.potionCd = 0; P.bagFullT = 0; P.dashHit = []; P.trailT = 0; P.swing = 0;
  P.hitTile = -1;
}

export function refreshStats(G) {
  const P = G.P;
  const before = P.st ? P.st.synergies.slice() : [];
  const maxBefore = P.st ? P.st.maxHp : 0;
  P.st = computeStats(P);
  if (maxBefore && P.st.maxHp > maxBefore) P.hp += P.st.maxHp - maxBefore;
  P.hp = Math.min(P.hp, P.st.maxHp);
  P.energy = Math.min(P.energy, P.st.energyMax);
  for (const t of P.st.synergies) if (!before.includes(t)) {
    toast(G, `Synergy: ${SYNERGIES[t].name}! ${SYNERGIES[t].desc}`, '#ffd24a');
    emit(G, { t: 'synergy', tag: t });
    sfx(G, 'level');
  }
  G.statsDirty = false;
}

// Advance by real time using a fixed timestep.
export function advance(G, dt, inp) {
  G.acc += Math.min(dt, 0.1);
  let n = 0;
  while (G.acc >= SIM_DT && n < 6) {
    if (G.choice || G.over || G.descendReq) { G.acc = 0; break; }
    step(G, SIM_DT, inp);
    G.acc -= SIM_DT;
    n++;
  }
  if (n >= 6) G.acc = 0;
  return n;
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function step(G, dt, inp) {
  const P = G.P;
  if (G.over || G.choice) return;
  if (G.statsDirty) refreshStats(G);
  G.time += dt;
  G.run.stats.time += dt;
  updatePlayer(G, dt, inp);
  // Flow field and fog follow the player's tile.
  const ptile = Math.floor(P.y) * G.w + Math.floor(P.x);
  if (ptile !== G.lastTile || G.flowFrom === -1 || G.fogDirty) {
    G.lastTile = ptile;
    computeFlow(G, Math.floor(P.x), Math.floor(P.y));
    G.flowFrom = ptile;
    updateFog(G);
    G.fogDirty = false;
  }
  // Enemies.
  const en = G.enemies;
  for (let i = 0; i < en.length; i++) {
    const e = en[i];
    if (e.dead) continue;
    tickStatus(G, e, dt, false);
    if (e.dead) continue;
    updateEnemy(G, e, dt);
    if (e.dead) continue;
    // Physics: desired movement plus knockback.
    const kx = e.vx, ky = e.vy;
    if (!e.air) {
      const mx = (e.mvx || 0) + kx, my = (e.mvy || 0) + ky;
      if (mx || my) moveCircle(G, e, mx * dt, my * dt);
      if (solidAt(G, Math.floor(e.x), Math.floor(e.y))) unstick(G, e);
    }
    const damp = Math.exp(-9 * dt);
    e.vx *= damp; e.vy *= damp;
    if (!e.def.flying && !e.boss && !e.air) enemyHazards(G, e, dt);
  }
  separate(G);
  updateBossArena(G);
  updateProjs(G, dt);
  updateTele(G, dt);
  updateZones(G, dt);
  updateDecoy(G, dt);
  updateDelayed(G, dt);
  updatePickups(G, dt);
  updateObjects(G);
  updateContext(G);
  // Bestiary sightings.
  G.seenT -= dt;
  if (G.seenT <= 0) {
    G.seenT = 0.5;
    for (const e of en) if (!e.dead && G.vis[Math.floor(e.y) * G.w + Math.floor(e.x)]) G.seenLog[e.type] = 1;
  }
  // Compact dead enemies.
  let j = 0;
  for (let i = 0; i < en.length; i++) { const e = en[i]; if (!e.dead) en[j++] = e; else G.byId.delete(e.id); }
  en.length = j;
  if (P.dead && !G.over) { G.over = true; }
  if (!G.choice && P.pendingPerks > 0 && !P.dead) openLevelChoice(G);
}

// ---------------------------------------------------------------- player
function nearestEnemy(G, x, y, range, needLos) {
  let best = null, bd = range;
  for (const e of G.enemies) {
    if (e.dead || e.air || e.alpha < 0.4) continue;
    const d = Math.hypot(e.x - x, e.y - y) - e.r;
    if (d >= bd) continue;
    if (needLos && !los(G, x, y, e.x, e.y)) continue;
    best = e; bd = d;
  }
  return best;
}

function updatePlayer(G, dt, inp) {
  const P = G.P, st = P.st, fx = st.fx, cls = CLASSES[P.classId];
  if (P.dead) return;
  tickStatus(G, P, dt, true);
  if (P.dead) return;
  if (P.flash > 0) P.flash -= dt;
  if (P.iframes > 0) P.iframes -= dt;
  if (P.dashCd > 0) P.dashCd -= dt;
  if (P.cd1 > 0) P.cd1 -= dt;
  if (P.cd2 > 0) P.cd2 -= dt;
  if (P.bulwarkT > 0) P.bulwarkT -= dt;
  if (P.furyT > 0) P.furyT -= dt;
  if (P.momentumT > 0) P.momentumT -= dt;
  if (P.barrierCd > 0) P.barrierCd -= dt;
  if (P.potionCd > 0) P.potionCd -= dt;
  if (P.lockToastT > 0) P.lockToastT -= dt;
  if (P.bagFullT > 0) P.bagFullT -= dt;
  if (P.spikeT > 0) P.spikeT -= dt;
  if (P.lunge > 0) P.lunge -= dt;
  if (P.frenzyT > 0) { P.frenzyT -= dt; if (P.frenzyT <= 0) P.frenzyN = 0; }
  P.energy = Math.min(st.energyMax, P.energy + st.energyRegen * dt);
  if (st.hpRegen > 0) P.hp = Math.min(st.maxHp, P.hp + st.hpRegen * dt);
  const disabled = P.s.frozenT > 0 || P.s.stunT > 0;

  // Inputs (edge-triggered flags are consumed here).
  if (inp.potion) { inp.potion = false; usePotion(G); }
  if (inp.bomb) { inp.bomb = false; throwBomb(G); }
  if (inp.interact) { inp.interact = false; interact(G); }
  if (inp.ab1) { inp.ab1 = false; if (!disabled) castAbility(G, 0); }
  if (inp.ab2) { inp.ab2 = false; if (!disabled) castAbility(G, 1); }

  let mx = inp.mx || 0, my = inp.my || 0;
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  P.moving = ml > 0.15 && !disabled;
  if (inp.dash) {
    inp.dash = false;
    if (P.dashCd <= 0 && !disabled) {
      let dx = mx, dy = my;
      if (Math.hypot(dx, dy) < 0.2) { dx = P.faceX; dy = P.faceY; }
      const l = Math.hypot(dx, dy) || 1;
      P.dashX = dx / l; P.dashY = dy / l;
      P.dashT = 0.18; P.iframes = Math.max(P.iframes, 0.32);
      P.dashCd = cls.dashCd * st.dashCdMul;
      P.dashHit.length = 0;
      if (fx.momentum) P.momentumT = 2.2;
      if (fx.dashCrit) P.dashCrits = fx.dashCrit;
      emit(G, { t: 'dash', x: P.x, y: P.y, dx: P.dashX, dy: P.dashY });
      sfx(G, 'dash');
    }
  }
  const tile = tileAt(G, Math.floor(P.x), Math.floor(P.y));
  let blocked = 0;
  P.hitTile = -1;
  if (P.dashT > 0) {
    P.dashT -= dt;
    blocked = moveCircle(G, P, P.dashX * 17 * dt, P.dashY * 17 * dt);
    P.faceX = P.dashX; P.faceY = P.dashY;
    if (fx.dashFire) { P.trailT -= dt; if (P.trailT <= 0) { P.trailT = 0.04; spawnZone(G, 'fire', P.x, P.y, 0.6, 2.5, FAC_PLAYER, st.power * 0.9); } }
    if (fx.dashDamage) {
      for (const e of G.enemies) {
        if (e.dead || e.air || P.dashHit.includes(e.id)) continue;
        if (Math.hypot(e.x - P.x, e.y - P.y) < e.r + P.r + 0.25) {
          P.dashHit.push(e.id);
          playerHit(G, e, st.power * 1.3, { knock: 6, kx: -P.dashY, ky: P.dashX });
        }
      }
    }
    for (const o of G.objects) if (o.kind === 'crate' && !o.used && Math.abs(o.x + 0.5 - P.x) < 0.7 && Math.abs(o.y + 0.5 - P.y) < 0.7) breakCrate(G, o);
  } else {
    let speed = 4.3 * (1 + st.moveSpd);
    if (P.s.chill > 0) speed *= 0.65;
    if (tile === T.HAZARD && G.hazard === 'water') speed *= 1 - HAZARDS.water.slow;
    if (disabled) speed = 0;
    P.mvx = mx * speed; P.mvy = my * speed;
    blocked = moveCircle(G, P, (P.mvx + P.vx) * dt, (P.mvy + P.vy) * dt);
    if (P.moving && P.atkAnim <= 0) {
      const fl = Math.hypot(mx, my) || 1;
      P.faceX += (mx / fl - P.faceX) * Math.min(1, dt * 14);
      P.faceY += (my / fl - P.faceY) * Math.min(1, dt * 14);
      const n = Math.hypot(P.faceX, P.faceY) || 1; P.faceX /= n; P.faceY /= n;
    }
  }
  const damp = Math.exp(-10 * dt);
  P.vx *= damp; P.vy *= damp;
  if (P.atkAnim > 0) P.atkAnim -= dt;
  // Bumping into doors and cracked walls.
  if (blocked && P.hitTile >= 0) {
    const t = G.tiles[P.hitTile];
    if (t === T.DOOR) {
      if (P.keys > 0) {
        P.keys--;
        G.tiles[P.hitTile] = T.FLOOR;
        G.changedTiles.push(P.hitTile);
        emit(G, { t: 'tile', i: P.hitTile });
        emit(G, { t: 'door', x: P.hitTile % G.w + 0.5, y: Math.floor(P.hitTile / G.w) + 0.5 });
        toast(G, 'The vault door grinds open.', '#ffd24a');
        sfx(G, 'unlock');
        G.flowFrom = -1; G.fogDirty = true;
      } else if (P.lockToastT <= 0) {
        P.lockToastT = 2.5;
        toast(G, 'Locked. A key lies somewhere on this floor.', '#9aa8bc');
        sfx(G, 'error');
      }
    } else if (t === T.SECRET && P.moving) {
      P.pushT += dt;
      if (P.pushT > 0.4) { P.pushT = 0; breakSecret(G, P.hitTile % G.w, Math.floor(P.hitTile / G.w)); }
    } else P.pushT = Math.max(0, P.pushT - dt);
  } else P.pushT = Math.max(0, P.pushT - dt);

  playerHazards(G, dt);
  playerAttack(G, dt);
  // Guardian orbs, static field, miasma.
  if (fx.orbs) {
    P.orbA += dt * 3.4;
    const n = fx.orbs;
    for (let k = 0; k < n; k++) {
      const a = P.orbA + (k / n) * Math.PI * 2;
      const ox = P.x + Math.cos(a) * 1.5, oy = P.y + Math.sin(a) * 1.5;
      for (const e of G.enemies) {
        if (e.dead || e.air || e.orbT > 0) continue;
        if (Math.hypot(e.x - ox, e.y - oy) < e.r + 0.3) { e.orbT = 0.5; playerHit(G, e, st.power * 0.6, { knock: 2, kx: e.x - P.x, ky: e.y - P.y }); }
      }
    }
  }
  if (fx.staticField) {
    P.staticT -= dt;
    if (P.staticT <= 0) {
      P.staticT = 3 / fx.staticField;
      const e = nearestEnemy(G, P.x, P.y, 6, true);
      if (e) { emit(G, { t: 'zap', x1: P.x, y1: P.y, x2: e.x, y2: e.y }); playerHit(G, e, st.power * 1.1, { proc: true, color: 'shock' }); if (!e.dead) applyStatus(G, e, 'shock', 0, false); sfx(G, 'zap'); }
    }
  }
  if (fx.miasma) {
    P.miasmaT -= dt;
    if (P.miasmaT <= 0) {
      P.miasmaT = 1;
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - P.x, e.y - P.y) < 2.8) applyStatus(G, e, 'poison', st.power * 0.13 * (1 + (fx.poisonDmg || 0)), false);
      emit(G, { t: 'miasma', x: P.x, y: P.y });
    }
  }
}

function spikeActive(G, i) {
  const ph = G.spikeMap[i];
  if (ph < 0) return 0;
  const c = (G.time + ph) % 2.4;
  return c > 1.75 ? 2 : c > 1.25 ? 1 : 0;
}
export { spikeActive };

function spikeDmg(G) { return 6 + G.floorN * 2.2; }

function playerHazards(G, dt) {
  const P = G.P;
  const i = Math.floor(P.y) * G.w + Math.floor(P.x);
  const t = G.tiles[i];
  if (t === T.SPIKES && spikeActive(G, i) === 2 && P.spikeT <= 0 && P.dashT <= 0) {
    P.spikeT = 0.7;
    hurtPlayer(G, spikeDmg(G), { name: 'a spike trap', knock: 0 });
    emit(G, { t: 'spike', x: Math.floor(P.x) + 0.5, y: Math.floor(P.y) + 0.5 });
  }
  if (t === T.HAZARD && G.hazard) {
    P.hazT -= dt;
    if (P.hazT <= 0) {
      P.hazT = 0.5;
      const hz = HAZARDS[G.hazard];
      const pw = 4 + G.floorN * 1.5;
      if (hz.status === 'chill') applyStatus(G, P, 'chill', 28, true);
      else if (hz.status) applyStatus(G, P, hz.status, hz.status === 'poison' ? pw * 0.4 : pw * 0.8, true);
      if (hz.dmg) hurtPlayer(G, pw * hz.dmg, { dot: true, color: 'burn', name: hz.name.toLowerCase() });
    }
  }
}

function enemyHazards(G, e, dt) {
  const i = Math.floor(e.y) * G.w + Math.floor(e.x);
  const t = G.tiles[i];
  if (t === T.SPIKES && spikeActive(G, i) === 2) {
    e.spikeT = (e.spikeT || 0) - dt;
    if (e.spikeT <= 0) { e.spikeT = 0.7; hurtEnemy(G, e, spikeDmg(G) * 1.6, { dot: true, color: 'hit' }); }
  }
  if (t === T.HAZARD && G.hazard && G.hazard !== 'water') {
    e.hazT = (e.hazT || 0) - dt;
    if (e.hazT <= 0) {
      e.hazT = 0.6;
      const hz = HAZARDS[G.hazard];
      if (hz.status === 'chill') applyStatus(G, e, 'chill', 20, false);
      else if (hz.status) applyStatus(G, e, hz.status, e.dmg * 0.2, false);
    }
  }
}

function playerAttack(G, dt) {
  const P = G.P, st = P.st;
  P.atkT -= dt;
  if (P.atkT > 0 || P.dashT > 0 || P.s.frozenT > 0 || P.s.stunT > 0) return;
  const melee = st.weaponKind === 'melee';
  const reach = melee ? st.range + 0.2 : st.range;
  const e = nearestEnemy(G, P.x, P.y, reach, true);
  let speedMul = 1 + (P.frenzyN || 0) * 0.08 + (P.furyT > 0 ? 0.5 : 0) + (st.fx.lastStand && P.hp < st.maxHp * 0.35 ? 0.4 : 0);
  if (!e) {
    if (!melee) return;
    // Smash crates when nothing is around.
    for (const o of G.objects) {
      if (o.kind !== 'crate' || o.used) continue;
      const dx = o.x + 0.5 - P.x, dy = o.y + 0.5 - P.y;
      if (dx * dx + dy * dy < 1.4 * 1.4) {
        const l = Math.hypot(dx, dy) || 1;
        P.aimX = dx / l; P.aimY = dy / l; P.faceX = P.aimX; P.faceY = P.aimY;
        breakCrate(G, o);
        emit(G, { t: 'swing', x: P.x, y: P.y, ax: P.aimX, ay: P.aimY, arc: st.arc, r: st.range, kind: st.weaponBase });
        P.atkT = 1 / (st.rate * speedMul); P.atkAnim = 0.18; P.lunge = 0.12;
        return;
      }
    }
    return;
  }
  const dx = e.x - P.x, dy = e.y - P.y, l = Math.hypot(dx, dy) || 1;
  P.aimX = dx / l; P.aimY = dy / l; P.faceX = P.aimX; P.faceY = P.aimY;
  P.atkT = 1 / (st.rate * speedMul);
  P.atkAnim = Math.min(0.25, P.atkT * 0.8);
  if (melee) {
    const half = Math.cos((st.arc * Math.PI) / 360);
    P.lunge = 0.12;
    emit(G, { t: 'swing', x: P.x, y: P.y, ax: P.aimX, ay: P.aimY, arc: st.arc, r: st.range, kind: st.weaponBase });
    sfx(G, 'swing');
    for (const o of G.enemies) {
      if (o.dead || o.air) continue;
      const ox = o.x - P.x, oy = o.y - P.y, d = Math.hypot(ox, oy);
      if (d > st.range + o.r) continue;
      if (d > 0.3 && (ox * P.aimX + oy * P.aimY) / d < half) continue;
      playerHit(G, o, st.hitDmg, { knock: st.knock, kx: ox, ky: oy });
    }
    for (const o of G.objects) {
      if (o.kind !== 'crate' || o.used) continue;
      if (Math.hypot(o.x + 0.5 - P.x, o.y + 0.5 - P.y) < st.range + 0.3) breakCrate(G, o);
    }
  } else {
    const pr = st.proj;
    const n = st.projCount;
    const base = Math.atan2(P.aimY, P.aimX);
    for (let k = 0; k < n; k++) {
      const a = base + (n > 1 ? (k / (n - 1) - 0.5) * 0.22 * (n - 1) : 0);
      spawnProj(G, P.x + Math.cos(a) * 0.3, P.y + Math.sin(a) * 0.3, Math.cos(a) * pr.speed, Math.sin(a) * pr.speed, {
        fac: FAC_PLAYER, dmg: st.hitDmg, kind: pr.kind, r: pr.r, life: (st.range + 1.5) / pr.speed, pierce: st.pierceN,
        bounce: st.fx.ricochet || 0, homing: pr.homing || 0, splash: pr.splash ? pr.splash * (1 + st.area) : 0, knock: st.knock,
      });
    }
    P.lunge = 0.06;
    sfx(G, 'shoot');
  }
}

// ---------------------------------------------------------------- abilities and consumables
function aimDir(G, range) {
  const P = G.P;
  const e = nearestEnemy(G, P.x, P.y, range, true);
  if (e) { const dx = e.x - P.x, dy = e.y - P.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l, e]; }
  return [P.faceX, P.faceY, null];
}

export function castAbility(G, idx) {
  const P = G.P, st = P.st, fx = st.fx;
  const id = CLASSES[P.classId].abilities[idx];
  const A = ABILITIES[id];
  const key = idx === 0 ? 'cd1' : 'cd2';
  if (P[key] > 0) return false;
  const cost = A.energy * (1 - (fx.energyCostRed || 0));
  if (P.energy < cost) { toast(G, 'Not enough energy', '#9aa8bc'); sfx(G, 'error'); return false; }
  P.energy -= cost;
  P[key] = A.cd * (1 - st.cdr);
  if (fx.echoCast && G.rng.next() < fx.echoCast) { P[key] = 0.5; emit(G, { t: 'num', x: P.x, y: P.y - 0.5, v: 0, c: 'echo' }); }
  const pw = st.power;
  const [ax, ay] = aimDir(G, 9);
  P.aimX = ax; P.aimY = ay; P.faceX = ax; P.faceY = ay; P.atkAnim = 0.25;
  emit(G, { t: 'ability', id, x: P.x, y: P.y, ax, ay });
  switch (id) {
    case 'bash': {
      const half = Math.cos((110 * Math.PI) / 360), R = 2.4 * (1 + st.area * 0.5);
      for (const e of G.enemies) {
        if (e.dead || e.air) continue;
        const ox = e.x - P.x, oy = e.y - P.y, d = Math.hypot(ox, oy);
        if (d > R + e.r || (d > 0.3 && (ox * ax + oy * ay) / d < half)) continue;
        playerHit(G, e, pw * 1.9, { ability: true, knock: 10, kx: ox, ky: oy });
        if (!e.dead) applyStatus(G, e, 'stun', 1.3, false);
      }
      P.vx += ax * 5; P.vy += ay * 5;
      emit(G, { t: 'swing', x: P.x, y: P.y, ax, ay, arc: 110, r: R, kind: 'bash' });
      emit(G, { t: 'shake', a: 0.25 });
      sfx(G, 'bash');
      break;
    }
    case 'bulwark': P.bulwarkT = 4; sfx(G, 'buff'); break;
    case 'nova': {
      const R = 3.4 * (1 + st.area * 0.5);
      for (const e of G.enemies) {
        if (e.dead || e.air) continue;
        if (Math.hypot(e.x - P.x, e.y - P.y) > R + e.r) continue;
        playerHit(G, e, pw * 1.3, { ability: true, chill: 110, knock: 4, kx: e.x - P.x, ky: e.y - P.y });
      }
      emit(G, { t: 'nova', x: P.x, y: P.y, r: R, color: 0x9fe4ff });
      sfx(G, 'nova');
      break;
    }
    case 'fireball':
      spawnProj(G, P.x + ax * 0.4, P.y + ay * 0.4, ax * 11, ay * 11, { fac: FAC_PLAYER, dmg: pw * 2.7, kind: 'fireball', r: 0.3, life: 1.1, splash: 2.1 * (1 + st.area * 0.5), burn: true, ability: true, knock: 6 });
      sfx(G, 'fire');
      break;
    case 'fan':
      for (let k = 0; k < 7 + Math.round(st.projectiles) * 2; k++) {
        const n = 7 + Math.round(st.projectiles) * 2;
        const a = Math.atan2(ay, ax) + (k / (n - 1) - 0.5) * 1.25;
        spawnProj(G, P.x, P.y, Math.cos(a) * 15, Math.sin(a) * 15, { fac: FAC_PLAYER, dmg: pw * 0.8, kind: 'knife', r: 0.13, life: 0.55, pierce: 1, bleed: true, ability: true, knock: 2 });
      }
      sfx(G, 'shoot');
      break;
    case 'decoy':
      G.decoy = { x: P.x, y: P.y, t: 4, hp: st.maxHp * 0.6, r: 0.3, dmg: pw * 3.2 };
      P.iframes = Math.max(P.iframes, 0.4);
      emit(G, { t: 'summon', x: P.x, y: P.y, color: 0xa08cff });
      sfx(G, 'blink');
      break;
    case 'siphon': {
      const R = 3.6 * (1 + st.area * 0.5);
      let total = 0;
      for (const e of G.enemies) {
        if (e.dead || e.air || Math.hypot(e.x - P.x, e.y - P.y) > R + e.r) continue;
        emit(G, { t: 'zap', x1: e.x, y1: e.y, x2: P.x, y2: P.y, color: 0xe04050 });
        total += playerHit(G, e, pw * 1.15, { ability: true, bleed: true });
      }
      healPlayer(G, total * 0.25);
      emit(G, { t: 'nova', x: P.x, y: P.y, r: R, color: 0xe04050 });
      sfx(G, 'siphon');
      break;
    }
    case 'chain': {
      const e = nearestEnemy(G, P.x, P.y, 8, true);
      if (e) {
        emit(G, { t: 'zap', x1: P.x, y1: P.y, x2: e.x, y2: e.y });
        chainLightning(G, e, pw * 1.6, 5 + (fx.chainShock || 0), 4.5, false);
        if (!e.dead) applyStatus(G, e, 'shock', 0, false);
      } else emit(G, { t: 'zap', x1: P.x, y1: P.y, x2: P.x + ax * 3, y2: P.y + ay * 3 });
      sfx(G, 'zap');
      break;
    }
    default: break;
  }
  return true;
}

export function usePotion(G) {
  const P = G.P;
  if (P.potions <= 0) { toast(G, 'No potions', '#9aa8bc'); sfx(G, 'error'); return false; }
  if (P.hp >= P.st.maxHp - 0.5) { toast(G, 'Already at full health', '#9aa8bc'); return false; }
  if (P.potionCd > 0) return false;
  P.potions--;
  P.potionCd = 0.4;
  healPlayer(G, P.st.maxHp * POTION_HEAL * (1 + 0.5 * (P.st.fx.alchemist || 0)));
  P.s.burnT = 0; P.s.poisonT = 0; P.s.poisonN = 0; P.s.bleedT = 0; P.s.bleedN = 0;
  emit(G, { t: 'potion', x: P.x, y: P.y });
  sfx(G, 'potion');
  return true;
}

export function throwBomb(G) {
  const P = G.P;
  if (P.bombs <= 0) { toast(G, 'No bombs', '#9aa8bc'); sfx(G, 'error'); return false; }
  P.bombs--;
  const e = nearestEnemy(G, P.x, P.y, 6.5, true);
  let tx, ty;
  if (e) { tx = e.x; ty = e.y; } else { tx = P.x + P.faceX * 3.5; ty = P.y + P.faceY * 3.5; }
  const T0 = 0.55;
  spawnProj(G, P.x, P.y, (tx - P.x) / T0, (ty - P.y) / T0, { fac: FAC_PLAYER, bomb: true, kind: 'bomb', life: T0, r: 0.2 });
  spawnTele(G, { kind: 0, x: tx, y: ty, r: 2.3 * (1 + 0.4 * (P.st.fx.bombardier || 0)), total: T0, visual: true, fac: FAC_PLAYER, color: 0xffa040 });
  sfx(G, 'throw');
  return true;
}

export function useScroll(G, key) {
  const P = G.P;
  if (!P.scrolls[key]) return false;
  switch (key) {
    case 'mapping': revealAll(G); G.mapped = true; toast(G, 'The floor unfolds in your mind.', '#5ea8ff'); break;
    case 'fury': P.furyT = 10; toast(G, 'Fury fills you!', '#ff7a30'); break;
    case 'frost': {
      let n = 0;
      for (const e of G.enemies) if (!e.dead && G.vis[Math.floor(e.y) * G.w + Math.floor(e.x)]) { e.s.frozenT = e.boss ? 1.2 : 3.5; n++; }
      emit(G, { t: 'nova', x: P.x, y: P.y, r: 8, color: 0x9fe4ff });
      toast(G, n ? `${n} foes freeze solid.` : 'A cold wind blows.', '#9fe4ff');
      break;
    }
    case 'warding': P.wardHp = P.st.maxHp * 0.5; toast(G, 'A ward surrounds you.', '#c070ff'); break;
    case 'recall': {
      if (G.fl.isBoss && !G.bossDead) { toast(G, 'The arena’s power smothers the scroll.', '#9aa8bc'); return false; }
      const s = G.fl.stairs;
      for (const [dx, dy] of N4) if (!solidAt(G, s.x + dx, s.y + dy)) { P.x = s.x + dx + 0.5; P.y = s.y + dy + 0.5; break; }
      emit(G, { t: 'summon', x: P.x, y: P.y, color: 0x5ea8ff });
      toast(G, 'You step through to the stairs.', '#5ea8ff');
      break;
    }
    default: return false;
  }
  P.scrolls[key]--;
  sfx(G, 'scroll');
  return true;
}

// ---------------------------------------------------------------- world interaction
function updateDecoy(G, dt) {
  const d = G.decoy;
  if (!d) return;
  d.t -= dt;
  if (d.t <= 0 || d.hp <= 0) {
    explode(G, d.x, d.y, 2.5, d.dmg, FAC_PLAYER, { ability: true, color: 0xa08cff, knock: 8, procs: false });
    sfx(G, 'explode');
    G.decoy = null;
  }
}

function updateDelayed(G, dt) {
  const D = G.delayed;
  for (let i = D.length - 1; i >= 0; i--) {
    const d = D[i];
    d.t -= dt;
    if (d.t > 0) continue;
    const e = G.byId.get(d.id);
    if (e && !e.dead) playerHit(G, e, d.dmg, { proc: true, echo: true, color: 'echo' });
    D[i] = D[D.length - 1]; D.pop();
  }
}

function separate(G) {
  const en = G.enemies, P = G.P, n = en.length;
  for (let i = 0; i < n; i++) {
    const a = en[i];
    if (a.dead || a.air || !a.aware) continue;
    for (let j = i + 1; j < n; j++) {
      const b = en[j];
      if (b.dead || b.air) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const rr = a.r + b.r;
      if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), push = (rr - d) * 0.5;
      const ux = dx / d, uy = dy / d;
      const wa = a.boss ? 0 : b.boss ? 1 : 0.5, wb = b.boss ? 0 : a.boss ? 1 : 0.5;
      moveCircle(G, a, -ux * push * wa * 2, -uy * push * wa * 2);
      moveCircle(G, b, ux * push * wb * 2, uy * push * wb * 2);
    }
    // Keep enemies from overlapping the player.
    if (P.dashT <= 0) {
      const dx = a.x - P.x, dy = a.y - P.y, rr = a.r + P.r;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) {
        const d = Math.sqrt(d2), push = rr - d;
        if (a.boss) moveCircle(G, P, (-dx / d) * push, (-dy / d) * push);
        else moveCircle(G, a, (dx / d) * push, (dy / d) * push);
      }
    }
  }
}

function updateBossArena(G) {
  const ar = G.fl.arena;
  if (!ar || G.bossDead || !G.boss) return;
  const P = G.P;
  const inside = P.x > ar.x + 0.5 && P.x < ar.x + ar.w - 0.5 && P.y > ar.y + 0.5 && P.y < ar.y + ar.h - 1.2;
  if (inside && !G.arenaSealed) {
    G.arenaSealed = true;
    for (const [x, y] of ar.gate) {
      const i = y * G.w + x;
      G.tiles[i] = T.BARRIER;
      emit(G, { t: 'tile', i });
    }
    G.flowFrom = -1;
    const b = G.boss;
    b.aware = true; b.state = 'recover'; b.t = 1.5;
    emit(G, { t: 'bossstart', name: b.def.name });
    toast(G, `${b.def.name} awakens!`, '#e25c5c');
    sfx(G, 'boss');
  }
}

function collectPickup(G, p) {
  const P = G.P, st = P.st;
  switch (p.kind) {
    case 'gold':
      P.gold += p.amount; G.run.stats.gold += p.amount;
      emit(G, { t: 'num', x: P.x, y: P.y, v: p.amount, c: 'gold' });
      if (st.fx.goldHeal) healPlayer(G, 1 + p.amount * 0.3, true);
      sfx(G, 'coin');
      break;
    case 'potion':
      if (P.potions >= st.potionMax) return false;
      P.potions++; emit(G, { t: 'pickup', kind: 'potion', text: 'Potion' }); sfx(G, 'pickup');
      break;
    case 'bomb': {
      const cap = MAX_BOMBS + 2 * (st.fx.bombardier || 0);
      if (P.bombs >= cap) return false;
      P.bombs = Math.min(cap, P.bombs + p.amount); emit(G, { t: 'pickup', kind: 'bomb', text: p.amount > 1 ? `${p.amount} bombs` : 'Bomb' }); sfx(G, 'pickup');
      break;
    }
    case 'scroll':
      P.scrolls[p.scroll] = (P.scrolls[p.scroll] || 0) + 1;
      emit(G, { t: 'pickup', kind: 'scroll', text: SCROLLS[p.scroll].name }); sfx(G, 'pickup');
      break;
    case 'key':
      P.keys++; emit(G, { t: 'pickup', kind: 'key', text: 'Vault key' }); sfx(G, 'good');
      break;
    case 'item':
      if (P.bag.length >= BAG_SIZE) {
        if (P.bagFullT <= 0) { P.bagFullT = 3; toast(G, 'Your bag is full. Salvage something.', '#9aa8bc'); }
        return false;
      }
      P.bag.push(p.item); G.run.stats.items++;
      emit(G, { t: 'pickup', kind: 'item', text: p.item.name, rarity: p.item.rarity });
      sfx(G, p.item.rarity >= 3 ? 'good' : 'pickup');
      break;
    default: break;
  }
  return true;
}

function updatePickups(G, dt) {
  const P = G.P, st = P.st;
  const fr = Math.exp(-5 * dt);
  for (const p of G.pickups) {
    if (!p.on) continue;
    p.age += dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy);
    const magnet = p.kind !== 'item' && p.age > 0.4 && d < st.pickup && !P.dead;
    if (magnet) {
      const pull = 9 + (st.pickup - d) * 6;
      p.vx = (dx / (d || 1)) * pull; p.vy = (dy / (d || 1)) * pull;
    } else { p.vx *= fr; p.vy *= fr; }
    if (p.vx || p.vy) {
      if (magnet) { p.x += p.vx * dt; p.y += p.vy * dt; }
      else moveCircle(G, p, p.vx * dt, p.vy * dt);
    }
    if (p.age > 0.35 && d < 0.55 && !P.dead) {
      if (collectPickup(G, p)) p.on = false;
    }
  }
}

function openChest(G, o) {
  o.used = true;
  G.opened.push(o.id);
  const rng = G.rng, st = G.P.st, f = G.floorN;
  const x = o.x + 0.5, y = o.y + 0.5;
  emit(G, { t: 'chest', id: o.id, x, y, tier: o.tier });
  sfx(G, 'chest');
  const mf = st.magicFind;
  if (o.tier === 1) {
    dropPickup(G, 'item', x, y, { item: rollItem(rng, f + 1, { magicFind: mf + 0.5, minRarity: 2 }) });
    dropPickup(G, 'item', x, y, { item: rollItem(rng, f + 1, { magicFind: mf, minRarity: 1 }) });
    for (let k = 0; k < 3; k++) dropPickup(G, 'gold', x, y, { amount: lootValueGold(rng, f, st.goldFind, 2) });
    dropPickup(G, 'potion', x, y);
    if (rng.chance(0.5)) dropPickup(G, 'scroll', x, y, { scroll: randomScroll(rng) });
  } else if (o.tier === 2) {
    dropPickup(G, 'item', x, y, { item: rollItem(rng, f + 1, { magicFind: mf + 0.3, minRarity: 1 }) });
    for (let k = 0; k < 2; k++) dropPickup(G, 'gold', x, y, { amount: lootValueGold(rng, f, st.goldFind, 1.5) });
    if (rng.chance(0.5)) dropPickup(G, 'scroll', x, y, { scroll: randomScroll(rng) });
    if (rng.chance(0.4)) dropPickup(G, 'bomb', x, y, { amount: 2 });
  } else {
    dropPickup(G, 'item', x, y, { item: rollItem(rng, f, { magicFind: mf }) });
    if (rng.chance(0.35)) dropPickup(G, 'item', x, y, { item: rollItem(rng, f, { magicFind: mf }) });
    for (let k = 0; k < 2; k++) dropPickup(G, 'gold', x, y, { amount: lootValueGold(rng, f, st.goldFind, 1) });
    if (rng.chance(0.3)) dropPickup(G, 'potion', x, y);
    if (rng.chance(0.15)) dropPickup(G, 'bomb', x, y);
  }
}

function updateObjects(G) {
  const P = G.P;
  if (P.dead) return;
  for (const o of G.objects) {
    if (o.used) continue;
    const dx = o.x + 0.5 - P.x, dy = o.y + 0.5 - P.y;
    if (dx * dx + dy * dy > 0.8 * 0.8) continue;
    if (o.kind === 'chest') openChest(G, o);
    else if (o.kind === 'key') { o.used = true; G.opened.push(o.id); P.keys++; emit(G, { t: 'pickup', kind: 'key', text: 'Vault key' }); emit(G, { t: 'objgone', id: o.id }); sfx(G, 'good'); }
    else if (o.kind === 'gold') { o.used = true; G.opened.push(o.id); P.gold += o.amount; G.run.stats.gold += o.amount; emit(G, { t: 'num', x: P.x, y: P.y, v: o.amount, c: 'gold' }); emit(G, { t: 'objgone', id: o.id }); sfx(G, 'coin'); }
  }
}

function gamblePrice(G, o) { return 30 + G.floorN * 12 + (G.uses[o.id] || 0) * 25; }

function updateContext(G) {
  const P = G.P;
  let best = null, bd = 1.25, label = '', key = '';
  for (const o of G.objects) {
    if (o.used || (o.kind !== 'shrine' && o.kind !== 'pedestal')) continue;
    const d = Math.hypot(o.x + 0.5 - P.x, o.y + 0.5 - P.y);
    if (d < bd) { bd = d; best = o; }
  }
  if (best) {
    if (best.kind === 'shrine') {
      const sh = SHRINES[best.shrine];
      if (best.shrine === 'gamble') label = `${sh.name}: ${gamblePrice(G, best)} gold`;
      else if (best.shrine === 'blood') label = `${sh.name}: give health`;
      else label = sh.name;
    } else {
      const what = best.sell === 'item' ? best.item.name : best.sell === 'potion' ? 'Potion' : best.sell === 'bomb' ? '2 bombs' : best.sell === 'key' ? 'Vault key' : SCROLLS[best.scroll].name;
      label = `Buy ${what}: ${best.price} gold`;
    }
    key = `o${best.id}|${label}`;
  } else {
    const s = G.fl.stairs;
    const stairsOpen = G.tiles[s.y * G.w + s.x] === T.STAIRS;
    if (stairsOpen && Math.hypot(s.x + 0.5 - P.x, s.y + 0.5 - P.y) < 1.2) { best = { kind: 'stairs' }; label = `Descend to floor ${G.floorN + 1}`; key = 'stairs'; }
  }
  G.ctx = best;
  if (key !== G.ctxKey) { G.ctxKey = key; G.ctxLabel = label; G.ctxObj = best; emit(G, { t: 'ctx' }); }
}

export function interact(G) {
  const P = G.P, o = G.ctx;
  if (!o || P.dead) return false;
  if (o.kind === 'stairs') { G.descendReq = true; sfx(G, 'level'); return true; }
  if (o.kind === 'shrine') {
    const rng = G.rng;
    switch (o.shrine) {
      case 'perk': {
        const opts = rollPerkChoices(rng, P, G.meta, 3);
        if (!opts.length) { toast(G, 'The shrine is silent. You have every gift it can give.', '#9aa8bc'); P.gold += 50; break; }
        o.used = true; G.opened.push(o.id);
        G.choice = { source: 'shrine', options: opts };
        emit(G, { t: 'choice' });
        break;
      }
      case 'fountain':
        o.used = true; G.opened.push(o.id);
        healPlayer(G, P.st.maxHp); P.energy = P.st.energyMax;
        P.s.burnT = P.s.poisonT = P.s.bleedT = 0; P.s.poisonN = P.s.bleedN = 0;
        emit(G, { t: 'potion', x: P.x, y: P.y });
        toast(G, 'Cool water restores you.', '#4ab0ff'); sfx(G, 'good');
        break;
      case 'blood': {
        const cost = P.st.maxHp * 0.25;
        if (P.hp <= cost + 1) { toast(G, 'You are too weak to give blood.', '#9aa8bc'); sfx(G, 'error'); return false; }
        o.used = true; G.opened.push(o.id);
        P.hp -= cost;
        emit(G, { t: 'num', x: P.x, y: P.y, v: cost, c: 'hurt' });
        dropPickup(G, 'item', o.x + 0.5, o.y + 0.5, { item: rollItem(rng, G.floorN + 2, { magicFind: P.st.magicFind + 1, minRarity: rng.chance(0.35) ? 3 : 2 }) });
        toast(G, 'The altar drinks deep and offers a gift.', '#e04050'); sfx(G, 'bad');
        break;
      }
      case 'gamble': {
        const price = gamblePrice(G, o);
        if (P.gold < price) { toast(G, `You need ${price} gold.`, '#9aa8bc'); sfx(G, 'error'); return false; }
        P.gold -= price;
        G.uses[o.id] = (G.uses[o.id] || 0) + 1;
        if (G.uses[o.id] >= 3) { o.used = true; G.opened.push(o.id); }
        dropPickup(G, 'item', o.x + 0.5, o.y + 0.5, { item: rollItem(rng, G.floorN + 1, { magicFind: P.st.magicFind + 0.6 }) });
        sfx(G, 'coin');
        G.ctxKey = '';
        break;
      }
      default: break;
    }
    G.ctxKey = '';
    return true;
  }
  if (o.kind === 'pedestal') {
    if (P.gold < o.price) { toast(G, `You need ${o.price} gold.`, '#9aa8bc'); sfx(G, 'error'); return false; }
    if (o.sell === 'item' && P.bag.length >= BAG_SIZE) { toast(G, 'Your bag is full.', '#9aa8bc'); sfx(G, 'error'); return false; }
    if (o.sell === 'potion' && P.potions >= P.st.potionMax) { toast(G, 'You can’t carry more potions.', '#9aa8bc'); return false; }
    P.gold -= o.price;
    o.used = true; G.opened.push(o.id);
    if (o.sell === 'item') { P.bag.push(o.item); G.run.stats.items++; toast(G, `Bought ${o.item.name}`, '#ffd24a'); }
    else if (o.sell === 'potion') P.potions++;
    else if (o.sell === 'bomb') P.bombs += 2;
    else if (o.sell === 'key') P.keys++;
    else P.scrolls[o.scroll] = (P.scrolls[o.scroll] || 0) + 1;
    emit(G, { t: 'objgone', id: o.id });
    sfx(G, 'coin');
    G.ctxKey = '';
    return true;
  }
  return false;
}

function openLevelChoice(G) {
  const P = G.P;
  const opts = rollPerkChoices(G.rng, P, G.meta, 3);
  if (!opts.length) { P.pendingPerks = 0; P.gold += 40; toast(G, 'You have mastered every gift. +40 gold.', '#ffd24a'); return; }
  G.choice = { source: 'level', options: opts, level: P.level };
  emit(G, { t: 'choice' });
}

export function choosePerk(G, id) {
  const P = G.P, c = G.choice;
  if (!c || !c.options.includes(id)) return false;
  const p = perkById(id);
  P.perks[id] = (P.perks[id] || 0) + 1;
  G.run.stats.perks++;
  if (p.instant === 'potion') P.potions++;
  if (p.instant === 'bombs') P.bombs += 2;
  if (c.source === 'level') P.pendingPerks = Math.max(0, P.pendingPerks - 1);
  G.choice = null;
  refreshStats(G);
  if (c.source === 'level') healPlayer(G, P.st.maxHp * 0.2, true);
  sfx(G, 'good');
  return true;
}

// ---------------------------------------------------------------- inventory
export function equipFromBag(G, uid, slotName) {
  const P = G.P;
  const idx = P.bag.findIndex((i) => i.uid === uid);
  if (idx < 0) return false;
  const item = P.bag[idx];
  if (!slotName) slotName = item.slot === 'trinket' ? (!P.equip.trinket1 ? 'trinket1' : !P.equip.trinket2 ? 'trinket2' : 'trinket1') : item.slot;
  if ((item.slot === 'trinket') !== slotName.startsWith('trinket')) return false;
  if (item.slot !== 'trinket' && item.slot !== slotName) return false;
  const old = P.equip[slotName];
  P.equip[slotName] = item;
  P.bag.splice(idx, 1);
  if (old) P.bag.splice(idx, 0, old);
  refreshStats(G);
  return true;
}

export function unequip(G, slotName) {
  const P = G.P;
  if (!P.equip[slotName] || slotName === 'weapon') return false;
  if (P.bag.length >= BAG_SIZE) return false;
  P.bag.push(P.equip[slotName]);
  P.equip[slotName] = null;
  refreshStats(G);
  return true;
}

export function salvage(G, uid) {
  const P = G.P;
  const idx = P.bag.findIndex((i) => i.uid === uid);
  if (idx < 0) return 0;
  const v = sellValue(P.bag[idx]);
  P.bag.splice(idx, 1);
  P.gold += v;
  return v;
}

// ---------------------------------------------------------------- save support
function encodeRle(arr) {
  const out = [];
  let cur = 0, n = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] ? 1 : 0;
    if (v === cur) n++;
    else { out.push(n); cur = v; n = 1; }
  }
  out.push(n);
  return out;
}
function decodeRle(runs, arr) {
  let i = 0, v = 0;
  for (const n of runs) {
    for (let k = 0; k < n && i < arr.length; k++) arr[i++] = v;
    v ^= 1;
  }
}

export function snapshotFloor(G) {
  const tiles = [];
  const seenIdx = new Set();
  for (let k = G.changedTiles.length - 1; k >= 0; k--) {
    const i = G.changedTiles[k];
    if (seenIdx.has(i)) continue;
    seenIdx.add(i);
    let t = G.tiles[i];
    if (t === T.BARRIER) t = T.FLOOR;
    tiles.push([i, t]);
  }
  const pickups = [];
  for (const p of G.pickups) if (p.on) pickups.push({ kind: p.kind, x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, amount: p.amount, item: p.item, scroll: p.scroll });
  return { killed: G.killed.slice(), opened: G.opened.slice(), tiles, seen: encodeRle(G.seen), bossDead: G.bossDead, pickups, uses: { ...G.uses }, mapped: G.mapped };
}

export const PERSIST_KEYS = ['classId', 'level', 'xp', 'hp', 'energy', 'gold', 'keys', 'equip', 'bag', 'potions', 'bombs', 'scrolls', 'perks', 'pendingPerks'];

export function enemyName(type) { return ENEMIES[type] ? ENEMIES[type].name : type; }
