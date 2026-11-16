// Damage, statuses, projectiles, telegraphed attacks, ground zones, pickups. Pure.
import { ENEMIES, BOSSES, ELITES, SLIME_SIZE, hpScale, dmgScale, T } from './data.js';
import { solidAt, moveCircle, los, tileAt } from './world.js';
import { rollItem, lootValueGold, randomScroll } from './items.js';

export const FAC_PLAYER = 0, FAC_ENEMY = 1;
export const MAX_PROJ = 420, MAX_TELE = 72, MAX_ZONE = 56, MAX_PICK = 90;

export function emit(G, e) { if (G.events.length < 400) G.events.push(e); }
export function toast(G, text, color) { emit(G, { t: 'toast', text, color: color || '#eef2f7' }); }
export function sfx(G, name) { emit(G, { t: 'sfx', name }); }

export function newStatus() {
  return { burnT: 0, burnD: 0, poisonT: 0, poisonN: 0, poisonD: 0, bleedT: 0, bleedN: 0, bleedD: 0, chill: 0, frozenT: 0, shockT: 0, stunT: 0, dotAcc: 0, dotT: 0.5 };
}

export function makePools(G) {
  G.projs = [];
  for (let i = 0; i < MAX_PROJ; i++) G.projs.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, r: 0.1, dmg: 0, fac: 0, life: 0, pierce: 0, kind: 'arrow', status: null, spow: 0, homing: 0, bounce: 0, h0: 0, h1: 0, h2: 0, h3: 0, knock: 0, splash: 0, ability: false, bomb: false, burnF: false, chillF: 0, owner: 0, z: 0, max: 0 });
  G.tele = [];
  for (let i = 0; i < MAX_TELE; i++) G.tele.push({ on: false, kind: 0, x: 0, y: 0, r: 1, dx: 0, dy: 0, len: 0, w: 0, t: 0, total: 1, dmg: 0, fac: 1, status: null, spow: 0, follow: 0, owner: 0, selfDestruct: false, linger: null, visual: false, knock: 0, breaks: false, ring: 0, ringKind: null, color: 0 });
  G.zones = [];
  for (let i = 0; i < MAX_ZONE; i++) G.zones.push({ on: false, kind: 'fire', x: 0, y: 0, r: 1, t: 0, max: 1, fac: 1, dps: 0, tick: 0 });
  G.pickups = [];
  for (let i = 0; i < MAX_PICK; i++) G.pickups.push({ on: false, id: 0, kind: 'gold', x: 0, y: 0, vx: 0, vy: 0, r: 0.15, amount: 0, item: null, scroll: null, age: 0 });
  G.projCursor = 0; G.teleCursor = 0;
}

// ---------------------------------------------------------------- enemies
export function makeEnemy(G, type, x, y, opts = {}) {
  const bossDef = BOSSES[type];
  const def = bossDef || ENEMIES[type];
  if (!def) return null;
  const f = G.floorN;
  const tierMul = 1 + G.tier * 0.35;
  let hp = def.hp * hpScale(f) * tierMul, dmg = def.dmg * dmgScale(f) * (1 + G.tier * 0.2), speed = def.speed;
  let r = def.r, scale = def.scale || 1;
  let size = 0;
  if (def.ai === 'splitter') {
    size = opts.size != null ? opts.size : def.size;
    const S = SLIME_SIZE[size];
    hp *= S.hp; r = S.r; scale = S.scale;
    speed *= 1 + (2 - size) * 0.18;
  }
  const e = {
    id: G.nextId++, type, def, boss: !!bossDef, x, y, vx: 0, vy: 0, r, hp, maxHp: hp, dmg, speed, scale,
    faceX: 0, faceY: 1, aimX: 0, aimY: 1, state: 'move', t: 0, cd: G.rng.float(0.4, 1.4), cd2: G.rng.float(1, 2.5),
    aware: !!opts.aware, sense: G.rng.float(0, 0.3), losT: 0, hasLos: false, s: newStatus(), flash: 0, tele: 0,
    elite: null, taken: 1, leech: 0, ward: 0, wardMax: 0, wardT: 0, cdMul: 1, onHit: def.status || null, trail: def.trail || null,
    size, spawnId: opts.spawnId || 0, dead: false, minions: 0, master: opts.master || 0, contactT: 0, trailT: 0,
    hop: G.rng.float(0, 6), strafe: G.rng.chance(0.5) ? 1 : -1, strafeT: G.rng.float(1, 2), phase: 0, act: null, bag: [],
    z: 0, air: false, orbT: 0, arcT: 0, hitDone: false, destX: 0, destY: 0, spin: 0, mass: Math.max(0.6, r * r * 6),
    xp: def.xp, gold: def.gold, summoned: !!opts.master || !!opts.summoned, alpha: 1, sx: [0, 0, 0, 0], sy: [0, 0, 0, 0], sn: 0,
  };
  if (opts.elite && opts.elite.length) {
    e.elite = opts.elite.slice();
    e.hp = e.maxHp = hp * 2.5;
    e.dmg *= 1.2;
    e.scale *= 1.18; e.r = Math.min(0.62, e.r * 1.12);
    e.xp *= 3; e.gold *= 3;
    for (const m of e.elite) {
      const md = ELITES[m];
      if (!md) continue;
      if (md.speed) e.speed *= md.speed;
      if (md.cd) e.cdMul *= md.cd;
      if (md.dmg) e.dmg *= md.dmg;
      if (md.size) e.scale *= md.size;
      if (md.taken) e.taken *= md.taken;
      if (md.leech) e.leech = md.leech;
      if (md.onHit) e.onHit = md.onHit;
      if (md.trail) e.trail = md.trail;
      if (md.ward) { e.wardMax = e.maxHp * 0.3; e.ward = e.wardMax; }
    }
  }
  if (bossDef) { e.mass = 30; e.bag = []; e.state = 'sleep'; }
  G.enemies.push(e);
  G.byId.set(e.id, e);
  return e;
}

// ---------------------------------------------------------------- statuses
export function applyStatus(G, ent, kind, pow, isPlayer) {
  const s = ent.s;
  const boss = !!ent.boss;
  switch (kind) {
    case 'burn': s.burnT = 3; if (pow > s.burnD) s.burnD = pow; break;
    case 'poison': {
      const cap = isPlayer ? 6 : 8 + ((G.P.st && G.P.st.fx.poisonCap) || 0);
      s.poisonN = Math.min(cap, s.poisonN + 1); s.poisonT = 4; if (pow > s.poisonD) s.poisonD = pow;
      break;
    }
    case 'bleed':
      s.bleedN = Math.min(5, s.bleedN + 1); s.bleedT = 3; if (pow > s.bleedD) s.bleedD = pow;
      if (!isPlayer && s.bleedN >= 5 && G.P.st.fx.bleedBurst) {
        s.bleedN = 0; s.bleedT = 0;
        emit(G, { t: 'burst', x: ent.x, y: ent.y, color: 0xd02030 });
        hurtEnemy(G, ent, G.P.st.power * 2.6, { dot: true, color: 'bleed' });
      }
      break;
    case 'chill': {
      if (s.frozenT > 0) break;
      s.chill += pow;
      const need = boss ? 220 : isPlayer ? 140 : 100;
      if (s.chill >= need) {
        s.chill = 0;
        s.frozenT = boss ? 0.5 : isPlayer ? 0.7 : 1.5;
        emit(G, { t: 'freeze', x: ent.x, y: ent.y });
      }
      break;
    }
    case 'shock': s.shockT = 3; break;
    case 'stun': if (!boss) s.stunT = Math.max(s.stunT, pow); else s.stunT = Math.max(s.stunT, Math.min(0.3, pow)); break;
    default: break;
  }
}

function statusPowForEnemy(e, kind) {
  switch (kind) {
    case 'burn': return e.dmg * 0.35;
    case 'poison': return e.dmg * 0.14;
    case 'bleed': return e.dmg * 0.2;
    case 'chill': return 45;
    default: return 0;
  }
}
export { statusPowForEnemy };

export function tickStatus(G, ent, dt, isPlayer) {
  const s = ent.s;
  let dps = 0;
  if (s.burnT > 0) { s.burnT -= dt; dps += s.burnD; if (s.burnT <= 0) s.burnD = 0; }
  if (s.poisonT > 0) { s.poisonT -= dt; dps += s.poisonD * s.poisonN; if (s.poisonT <= 0) { s.poisonN = 0; s.poisonD = 0; } }
  if (s.bleedT > 0) { s.bleedT -= dt; dps += s.bleedD * s.bleedN; if (s.bleedT <= 0) { s.bleedN = 0; s.bleedD = 0; } }
  if (s.chill > 0) s.chill = Math.max(0, s.chill - 24 * dt);
  if (s.frozenT > 0) s.frozenT -= dt;
  if (s.shockT > 0) s.shockT -= dt;
  if (s.stunT > 0) s.stunT -= dt;
  s.dotAcc += dps * dt;
  s.dotT -= dt;
  if (s.dotT <= 0) {
    s.dotT = 0.5;
    if (s.dotAcc > 0.05) {
      const amt = s.dotAcc;
      s.dotAcc = 0;
      const color = s.burnT > 0 ? 'burn' : s.poisonN > 0 ? 'poison' : 'bleed';
      if (isPlayer) hurtPlayer(G, amt, { dot: true, color, name: color === 'burn' ? 'flames' : color === 'poison' ? 'poison' : 'bleeding' });
      else {
        hurtEnemy(G, ent, amt, { dot: true, color });
        if (s.bleedN > 0 && G.P.st.fx.bleedHeal) healPlayer(G, amt * 0.15, true);
      }
    } else s.dotAcc = 0;
  }
}

// ---------------------------------------------------------------- damage
export function healPlayer(G, amt, quiet) {
  const P = G.P;
  if (P.dead || amt <= 0) return;
  const before = P.hp;
  P.hp = Math.min(P.st.maxHp, P.hp + amt);
  const gained = P.hp - before;
  if (!quiet && gained >= 1) emit(G, { t: 'num', x: P.x, y: P.y, v: gained, c: 'heal' });
}

export function hurtEnemy(G, e, amount, o) {
  if (e.dead || e.air || !(amount > 0)) return 0;
  let dmg = amount;
  if (!o.dot && e.def.ai === 'shielded' && o.fx !== undefined && e.s.frozenT <= 0 && e.s.stunT <= 0) {
    const ax = o.fx - e.x, ay = o.fy - e.y;
    const l = Math.hypot(ax, ay);
    if (l > 0.01 && (ax * e.faceX + ay * e.faceY) / l > Math.cos((e.def.shieldArc * Math.PI) / 360)) {
      dmg *= 0.15;
      if (G.time - (e.blockT || 0) > 0.3) { e.blockT = G.time; emit(G, { t: 'block', x: e.x, y: e.y }); }
    }
  }
  dmg *= e.taken;
  if (e.s.shockT > 0) dmg *= 1.25;
  if (e.s.frozenT > 0) dmg *= 1.25 + ((G.P.st && G.P.st.fx.freezeDmg) || 0);
  if (e.ward > 0) {
    const a = Math.min(e.ward, dmg);
    e.ward -= a; dmg -= a; e.wardT = 6;
  }
  e.hp -= dmg;
  e.flash = 0.12;
  if (!e.aware) wake(G, e);
  if (o.knock && !e.boss) {
    const k = o.knock / e.mass;
    e.vx += o.kx * k; e.vy += o.ky * k;
  }
  G.run.stats.dmgDealt += dmg;
  if (!o.dot && o.src === 'player' && G.P.st.lifesteal > 0) healPlayer(G, dmg * G.P.st.lifesteal, true);
  if (dmg >= 0.5 || o.crit) emit(G, { t: 'num', x: e.x, y: e.y, v: dmg, c: o.crit ? 'crit' : o.color || (dmg < amount * 0.3 ? 'block' : 'hit') });
  if (e.hp <= 0) killEnemy(G, e, o);
  return dmg;
}

export function wake(G, e) {
  if (e.aware || e.dead) return;
  e.aware = true;
  if (e.boss) return;
  for (const o of G.enemies) {
    if (!o.aware && !o.boss && !o.dead && Math.abs(o.x - e.x) + Math.abs(o.y - e.y) < 5) { o.aware = true; o.cd = Math.max(o.cd, 0.4); }
  }
}

// Player-sourced hit with crits, multipliers and on-hit procs.
export function playerHit(G, e, base, o) {
  if (e.dead || e.air) return 0;
  const P = G.P, st = P.st, fx = st.fx;
  let mult = 1;
  if (P.momentumT > 0) mult *= 1.4;
  if (fx.lastStand && P.hp < st.maxHp * 0.35) mult *= 1.4;
  if (P.furyT > 0) mult *= 1.5;
  if (fx.executioner && e.hp < e.maxHp * 0.3) mult *= 1 + fx.executioner;
  if (fx.giantslayer && (e.elite || e.boss)) mult *= 1 + fx.giantslayer;
  if (o.ability) mult *= 1 + st.abilityDmg;
  let crit = !!o.forceCrit || G.rng.next() < st.crit;
  if (P.dashCrits > 0 && !o.ability && !o.proc) { crit = true; P.dashCrits--; }
  const dmg = base * mult * (crit ? 1 + st.critDmg : 1) * G.rng.float(0.92, 1.08);
  const kx = o.kx != null ? o.kx : e.x - P.x, ky = o.ky != null ? o.ky : e.y - P.y;
  const kl = Math.hypot(kx, ky) || 1;
  const sx = o.sx != null ? o.sx : P.x, sy = o.sy != null ? o.sy : P.y;
  hurtEnemy(G, e, dmg, { crit, knock: o.knock || 0, kx: kx / kl, ky: ky / kl, fx: sx, fy: sy, src: 'player', color: o.color });
  if (!o.proc) procs(G, e, dmg, crit, o);
  return dmg;
}

function procs(G, e, dmg, crit, o) {
  const P = G.P, st = P.st, fx = st.fx, rng = G.rng;
  if (!e.dead) {
    if (fx.burnAlways || o.burn || rng.next() < st.burnCh) applyStatus(G, e, 'burn', st.power * 0.3 * (1 + (fx.burnDmg || 0)), false);
    if (o.poison || rng.next() < st.poisonCh) applyStatus(G, e, 'poison', st.power * 0.13 * (1 + (fx.poisonDmg || 0)), false);
    if (o.bleed || rng.next() < st.bleedCh) applyStatus(G, e, 'bleed', st.power * 0.2, false);
    const chillAmt = 34 * (1 + (fx.chillMul || 0));
    if (fx.chillHit) applyStatus(G, e, 'chill', fx.chillHit * (1 + (fx.chillMul || 0)), false);
    if (o.chill) applyStatus(G, e, 'chill', o.chill * (1 + (fx.chillMul || 0)), false);
    else if (rng.next() < st.chillCh) applyStatus(G, e, 'chill', chillAmt, false);
    const wasShocked = e.s.shockT > 0;
    if (o.shock || rng.next() < st.shockCh) applyStatus(G, e, 'shock', 0, false);
    if (wasShocked && e.arcT <= 0) {
      e.arcT = 0.3;
      chainLightning(G, e, dmg * 0.4, 1 + (fx.chainShock || 0), 3.5, true);
    }
  }
  if (fx.thunderEvery) {
    P.hitCount = (P.hitCount || 0) + 1;
    if (P.hitCount % 4 === 0) strikeLightning(G, e.x, e.y, st.power * 1.6 * Math.max(1, fx.thunderEvery / 4));
  }
  if (crit && fx.critSpark) strikeLightning(G, e.x, e.y, st.power * 0.9);
  if (fx.echoStrike && !o.echo) G.delayed.push({ t: 0.2, id: e.id, dmg: dmg * fx.echoStrike });
}

export function strikeLightning(G, x, y, dmg) {
  emit(G, { t: 'zap', x1: x, y1: y - 0.01, x2: x, y2: y, sky: true });
  let best = null, bd = 1.3;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bd + e.r) { best = e; bd = d; }
  }
  if (best) { playerHit(G, best, dmg, { proc: true, color: 'shock' }); if (!best.dead) applyStatus(G, best, 'shock', 0, false); }
}

// Lightning leaps from `from` to up to n other enemies.
export function chainLightning(G, from, dmg, n, range, skipFirst) {
  let cur = from;
  const hit = G.scratchIds; hit.length = 0;
  hit.push(from.id);
  if (!skipFirst) playerHit(G, from, dmg, { proc: true, color: 'shock', ability: true });
  for (let k = 0; k < n; k++) {
    let best = null, bd = range;
    for (const e of G.enemies) {
      if (e.dead || hit.includes(e.id)) continue;
      const d = Math.hypot(e.x - cur.x, e.y - cur.y);
      if (d < bd && los(G, cur.x, cur.y, e.x, e.y)) { best = e; bd = d; }
    }
    if (!best) break;
    emit(G, { t: 'zap', x1: cur.x, y1: cur.y, x2: best.x, y2: best.y });
    hit.push(best.id);
    playerHit(G, best, dmg, { proc: true, color: 'shock' });
    if (!best.dead) applyStatus(G, best, 'shock', 0, false);
    cur = best;
  }
}

// Instant area damage. fac: who deals it.
export function explode(G, x, y, r, dmg, fac, o = {}) {
  emit(G, { t: 'explode', x, y, r, color: o.color != null ? o.color : 0xff9a40 });
  if (fac === FAC_PLAYER) {
    for (const e of G.enemies) {
      if (e.dead || e.air) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > r + e.r) continue;
      playerHit(G, e, dmg, { proc: !o.procs, knock: o.knock || 4, kx: e.x - x, ky: e.y - y, sx: x, sy: y, ability: !!o.ability, burn: o.burn, chill: o.chill, poison: o.poison, color: o.numColor });
      if (!e.dead && o.status) applyStatus(G, e, o.status, o.spow || 0, false);
    }
    if (o.breaks) breakAround(G, x, y, r);
    hitCrates(G, x, y, r);
  } else {
    const P = G.P;
    if (Math.hypot(P.x - x, P.y - y) < r + P.r) hurtPlayer(G, dmg, { status: o.status, spow: o.spow, kx: P.x - x, ky: P.y - y, knock: 5, name: o.name || 'an explosion' });
    if (G.decoy && Math.hypot(G.decoy.x - x, G.decoy.y - y) < r) G.decoy.hp -= dmg;
  }
}

export function breakAround(G, x, y, r) {
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(G, tx, ty) === T.SECRET && Math.hypot(tx + 0.5 - x, ty + 0.5 - y) < r + 0.7) breakSecret(G, tx, ty);
  }
}

export function breakSecret(G, tx, ty) {
  const i = ty * G.w + tx;
  if (G.tiles[i] !== T.SECRET) return;
  G.tiles[i] = T.FLOOR;
  G.changedTiles.push(i);
  emit(G, { t: 'tile', i });
  emit(G, { t: 'rubble', x: tx + 0.5, y: ty + 0.5 });
  toast(G, 'A hidden passage!', '#ffd24a');
  sfx(G, 'good');
  G.flowFrom = -1; G.fogDirty = true;
}

export function hitCrates(G, x, y, r) {
  for (const o of G.objects) {
    if (o.kind !== 'crate' || o.used) continue;
    if (Math.hypot(o.x + 0.5 - x, o.y + 0.5 - y) < r + 0.45) breakCrate(G, o);
  }
}

export function breakCrate(G, o) {
  if (o.used) return;
  o.used = true;
  G.opened.push(o.id);
  emit(G, { t: 'crate', id: o.id, x: o.x + 0.5, y: o.y + 0.5 });
  sfx(G, 'crate');
  const rng = G.rng;
  const roll = rng.next();
  if (roll < 0.5) dropPickup(G, 'gold', o.x + 0.5, o.y + 0.5, { amount: lootValueGold(rng, G.floorN, G.P.st.goldFind, 0.6) });
  else if (roll < 0.58) dropPickup(G, 'potion', o.x + 0.5, o.y + 0.5);
  else if (roll < 0.62) dropPickup(G, 'bomb', o.x + 0.5, o.y + 0.5);
  else if (roll < 0.64) dropPickup(G, 'scroll', o.x + 0.5, o.y + 0.5, { scroll: randomScroll(rng) });
}

export function hurtPlayer(G, amount, o) {
  const P = G.P;
  if (P.dead || !(amount > 0)) return 0;
  const st = P.st;
  if (!o.dot) {
    if (P.iframes > 0 || P.dashT > 0) return 0;
    if (st.fx.barrier && P.barrierCd <= 0) {
      P.barrierCd = 8; P.iframes = 0.25;
      emit(G, { t: 'barrier', x: P.x, y: P.y });
      sfx(G, 'block');
      return 0;
    }
  }
  let dmg = amount * (o.dot ? 1 : 1 - st.armorRed);
  if (P.bulwarkT > 0) dmg *= 0.4;
  if (P.s.shockT > 0) dmg *= 1.2;
  if (P.wardHp > 0) {
    const a = Math.min(P.wardHp, dmg);
    P.wardHp -= a; dmg -= a;
    if (dmg <= 0) { emit(G, { t: 'num', x: P.x, y: P.y, v: a, c: 'block' }); return 0; }
  }
  dmg = Math.max(o.dot ? 0.5 : 1, dmg);
  P.hp -= dmg;
  P.flash = 0.18;
  G.run.stats.dmgTaken += dmg;
  emit(G, { t: 'num', x: P.x, y: P.y, v: dmg, c: o.dot ? 'pdot' : 'hurt' });
  if (!o.dot) {
    P.iframes = 0.3;
    emit(G, { t: 'phurt', amt: dmg / st.maxHp });
    if (o.knock) {
      const l = Math.hypot(o.kx, o.ky) || 1;
      P.vx += (o.kx / l) * o.knock * 0.6; P.vy += (o.ky / l) * o.knock * 0.6;
    }
    if (o.status) applyStatus(G, P, o.status, o.spow || 0, true);
    const src = o.src;
    if (src && !src.dead && o.melee) {
      const thorns = st.thorns * (1 + 0.15 * (G.floorN - 1)) * (1 + (st.fx.thornsMul || 0)) + amount * (st.fx.reflect || 0);
      if (thorns > 0) hurtEnemy(G, src, thorns, { src: 'thorns', color: 'thorns', fx: P.x, fy: P.y });
      if (st.fx.chillAura && !src.dead) applyStatus(G, src, 'chill', 120, false);
    }
    if (src && !src.dead && src.leech) {
      src.hp = Math.min(src.maxHp, src.hp + dmg * src.leech);
    }
  }
  if (P.hp <= 0) {
    if (st.fx.phoenix && !P.phoenixUsed) {
      P.phoenixUsed = true;
      P.hp = st.maxHp * 0.4;
      P.iframes = 2;
      emit(G, { t: 'phoenix', x: P.x, y: P.y });
      toast(G, 'The Phoenix Mantle burns bright. You rise again!', '#ff8a2a');
      explode(G, P.x, P.y, 3.2, st.power * 4, FAC_PLAYER, { burn: true, color: 0xff8a2a });
      return dmg;
    }
    P.hp = 0;
    P.dead = true;
    G.run.stats.killedBy = o.name || 'the dark';
    emit(G, { t: 'pdead' });
  }
  return dmg;
}

// ---------------------------------------------------------------- deaths and loot
export function killEnemy(G, e, o) {
  if (e.dead) return;
  e.dead = true;
  const P = G.P, st = P.st, fx = st.fx, rng = G.rng, stats = G.run.stats;
  if (e.spawnId) G.killed.push(e.spawnId);
  emit(G, { t: 'death', id: e.id, x: e.x, y: e.y, color: e.def.color, size: e.r, boss: e.boss });
  // Cancel any self-destruct telegraph this enemy owned.
  for (const t of G.tele) if (t.on && t.owner === e.id && t.selfDestruct) t.on = false;
  if (e.master) { const m = G.byId.get(e.master); if (m) m.minions = Math.max(0, m.minions - 1); }
  if (o && o.silent) return;
  stats.kills++;
  G.killLog[e.type] = (G.killLog[e.type] || 0) + 1;
  if (e.elite) stats.elites++;
  gainXp(G, e.xp * (1 + 0.15 * (G.floorN - 1)) * (e.summoned ? 0.5 : 1));
  // On-kill effects.
  if (fx.combust && e.s.burnT > 0) explode(G, e.x, e.y, 1.9, st.power * 1.2, FAC_PLAYER, { burn: true, color: 0xff7a30, procs: false });
  if (fx.shatter && (e.s.chill > 25 || e.s.frozenT > 0)) explode(G, e.x, e.y, 1.9, st.power * 0.9, FAC_PLAYER, { chill: 60, color: 0x9fe4ff, procs: false });
  if (fx.poisonSpread && e.s.poisonN > 0) {
    for (const o2 of G.enemies) {
      if (o2.dead || o2 === e || Math.hypot(o2.x - e.x, o2.y - e.y) > 2.8) continue;
      for (let k = 0; k < e.s.poisonN; k++) applyStatus(G, o2, 'poison', e.s.poisonD, false);
    }
    emit(G, { t: 'burst', x: e.x, y: e.y, color: 0x8ee04a });
  }
  if (fx.vampKill) healPlayer(G, st.maxHp * fx.vampKill);
  if (fx.battery) P.energy = Math.min(st.energyMax, P.energy + fx.battery);
  if (fx.frenzy) { P.frenzyN = Math.min(6, (P.frenzyN || 0) + 1); P.frenzyT = 4; }
  // Elite death tricks.
  if (e.elite) {
    if (e.elite.includes('volatile')) spawnTele(G, { kind: 0, x: e.x, y: e.y, r: 2.2, total: 0.7, dmg: e.dmg * 1.6, fac: FAC_ENEMY, status: 'burn', spow: e.dmg * 0.3, name: 'a volatile corpse' });
    if (e.elite.includes('frostbound')) radialVolley(G, e.x, e.y, 10, 5.5, 0, e.dmg * 0.6, 'ice', 'chill', 45, e.id);
  }
  // Slimes split.
  if (e.def.ai === 'splitter' && e.size > 0 && !e.boss) {
    for (let k = 0; k < 2; k++) {
      const a = rng.float(0, Math.PI * 2);
      const c = makeEnemy(G, e.type, e.x + Math.cos(a) * 0.3, e.y + Math.sin(a) * 0.3, { size: e.size - 1, aware: true, summoned: true });
      if (c) { c.vx = Math.cos(a) * 4; c.vy = Math.sin(a) * 4; c.cd = 0.6; if (e.elite) { c.onHit = e.onHit; } }
    }
  }
  // Loot.
  const gMul = e.boss ? 1 : e.elite ? 3 : 1;
  if (e.boss) {
    for (let k = 0; k < 8; k++) dropPickup(G, 'gold', e.x, e.y, { amount: lootValueGold(rng, G.floorN, st.goldFind, 3) });
    dropPickup(G, 'item', e.x, e.y, { item: rollItem(rng, G.floorN + 1, { magicFind: st.magicFind, minRarity: 3 }) });
    dropPickup(G, 'item', e.x, e.y, { item: rollItem(rng, G.floorN + 1, { magicFind: st.magicFind, minRarity: 2 }) });
    dropPickup(G, 'item', e.x, e.y, { item: rollItem(rng, G.floorN, { magicFind: st.magicFind, minRarity: 1 }) });
    dropPickup(G, 'potion', e.x, e.y);
    dropPickup(G, 'potion', e.x, e.y);
    stats.bosses++;
    onBossDead(G, e);
    return;
  }
  if (e.gold > 0 && rng.next() < (e.elite ? 1 : 0.55)) dropPickup(G, 'gold', e.x, e.y, { amount: lootValueGold(rng, G.floorN, st.goldFind, gMul * (e.gold / 3)) });
  if (rng.next() < (e.elite ? 0.25 : e.summoned ? 0.01 : 0.035) * (1 + (fx.alchemist || 0) * 0.5)) dropPickup(G, 'potion', e.x, e.y);
  if (rng.next() < (e.elite ? 0.5 : e.summoned ? 0.01 : 0.05) * (1 + st.magicFind * 0.5)) dropPickup(G, 'item', e.x, e.y, { item: rollItem(rng, G.floorN, { magicFind: st.magicFind, minRarity: e.elite ? 1 : 0 }) });
  if (rng.next() < 0.018) dropPickup(G, 'bomb', e.x, e.y);
  if (rng.next() < 0.012) dropPickup(G, 'scroll', e.x, e.y, { scroll: randomScroll(rng) });
}

function onBossDead(G, e) {
  G.bossDead = true;
  G.boss = null;
  emit(G, { t: 'bossdead', name: e.def.name });
  toast(G, `${e.def.name} is slain! The way down is open.`, '#ffd24a');
  sfx(G, 'level');
  openArena(G);
  const s = G.fl.stairs;
  const i = s.y * G.w + s.x;
  G.tiles[i] = T.STAIRS;
  emit(G, { t: 'tile', i });
  // Clean up remaining minions.
  for (const o of G.enemies) if (!o.dead && o.summoned) { killEnemy(G, o, { silent: true }); }
}

export function openArena(G) {
  if (!G.fl.arena) return;
  for (const [x, y] of G.fl.arena.gate) {
    const i = y * G.w + x;
    if (G.tiles[i] === T.BARRIER) { G.tiles[i] = T.FLOOR; emit(G, { t: 'tile', i }); }
  }
  G.arenaSealed = false;
  G.flowFrom = -1;
}

export function gainXp(G, amt) {
  const P = G.P;
  P.xp += amt;
  let guard = 0;
  while (P.xp >= xpNeed(P.level) && guard++ < 20) {
    P.xp -= xpNeed(P.level);
    P.level++;
    P.pendingPerks++;
    G.statsDirty = true;
    emit(G, { t: 'levelup', level: P.level });
  }
}
export function xpNeed(level) { return Math.round(15 + 9 * Math.pow(level, 1.45)); }

// ---------------------------------------------------------------- pickups
let pickId = 1;
export function dropPickup(G, kind, x, y, extra) {
  let p = null;
  for (const q of G.pickups) if (!q.on) { p = q; break; }
  if (!p) {
    // Out of slots: merge gold into an existing coin pile, drop the rest.
    if (kind === 'gold') for (const q of G.pickups) if (q.kind === 'gold') { q.amount += extra.amount; return q; }
    return null;
  }
  const a = G.rng.float(0, Math.PI * 2), sp = G.rng.float(1.5, 3.5);
  p.on = true; p.id = pickId++; p.kind = kind; p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
  p.amount = extra && extra.amount ? extra.amount : 1;
  p.item = extra && extra.item ? extra.item : null;
  p.scroll = extra && extra.scroll ? extra.scroll : null;
  p.age = 0; p.r = 0.15;
  if (extra && extra.still) { p.vx = 0; p.vy = 0; }
  return p;
}

// ---------------------------------------------------------------- projectiles
export function spawnProj(G, x, y, vx, vy, o) {
  let p = null;
  for (let k = 0; k < MAX_PROJ; k++) {
    const q = G.projs[(G.projCursor + k) % MAX_PROJ];
    if (!q.on) { p = q; G.projCursor = (G.projCursor + k + 1) % MAX_PROJ; break; }
  }
  if (!p) return null;
  p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.r = o.r || 0.12; p.dmg = o.dmg || 1; p.fac = o.fac; p.life = o.life || 2; p.max = p.life;
  p.pierce = o.pierce || 0; p.kind = o.kind || 'arrow'; p.status = o.status || null; p.spow = o.spow || 0;
  p.homing = o.homing || 0; p.bounce = o.bounce || 0; p.h0 = p.h1 = p.h2 = p.h3 = 0;
  p.knock = o.knock || 0; p.splash = o.splash || 0; p.ability = !!o.ability; p.bomb = !!o.bomb;
  p.burnF = !!o.burn; p.chillF = o.chill || 0; p.owner = o.owner || 0; p.z = 0; p.bleedF = !!o.bleed; p.name = o.name || null;
  return p;
}

export function radialVolley(G, x, y, n, speed, offset, dmg, kind, status, spow, owner) {
  for (let k = 0; k < n; k++) {
    const a = offset + (k / n) * Math.PI * 2;
    spawnProj(G, x, y, Math.cos(a) * speed, Math.sin(a) * speed, { fac: FAC_ENEMY, dmg, kind, r: 0.17, life: 4, status, spow, owner });
  }
}

function hitListed(p, id) { return p.h0 === id || p.h1 === id || p.h2 === id || p.h3 === id; }
function hitAdd(p, id) { if (!p.h0) p.h0 = id; else if (!p.h1) p.h1 = id; else if (!p.h2) p.h2 = id; else p.h3 = id; }

function projImpact(G, p) {
  if (p.splash > 0 && p.fac === FAC_PLAYER) {
    explode(G, p.x, p.y, p.splash, p.dmg * (p.ability ? 1 : 0.5), FAC_PLAYER, { procs: !p.ability, ability: p.ability, burn: p.burnF, color: p.burnF ? 0xff7a30 : 0xb080ff, knock: 3, breaks: p.ability });
  }
  if (p.bomb) {
    const st = G.P.st;
    const big = 1 + 0.4 * (st.fx.bombardier || 0);
    explode(G, p.x, p.y, 2.3 * big, (st.power * 3.2 + 12) * (1 + 0.5 * (st.fx.bombardier || 0)), FAC_PLAYER, { procs: false, burn: true, breaks: true, color: 0xffa040, knock: 7 });
    sfx(G, 'explode');
    emit(G, { t: 'shake', a: 0.5 });
  }
  p.on = false;
}

export function updateProjs(G, dt) {
  const P = G.P;
  for (let k = 0; k < MAX_PROJ; k++) {
    const p = G.projs[k];
    if (!p.on) continue;
    p.life -= dt;
    if (p.bomb) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.z = Math.sin((1 - p.life / p.max) * Math.PI) * 1.5;
      if (solidAt(G, Math.floor(p.x), Math.floor(p.y))) { p.x -= p.vx * dt; p.y -= p.vy * dt; p.vx = 0; p.vy = 0; }
      if (p.life <= 0) projImpact(G, p);
      continue;
    }
    if (p.life <= 0) { if (p.splash) projImpact(G, p); p.on = false; continue; }
    if (p.homing > 0 && p.fac === FAC_PLAYER) {
      let best = null, bd = 5;
      for (const e of G.enemies) {
        if (e.dead || e.air || hitListed(p, e.id)) continue;
        const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        const sp = Math.hypot(p.vx, p.vy);
        const dx = best.x - p.x, dy = best.y - p.y, l = Math.hypot(dx, dy) || 1;
        const t = Math.min(1, p.homing * dt);
        p.vx += (dx / l * sp - p.vx) * t; p.vy += (dy / l * sp - p.vy) * t;
        const s2 = Math.hypot(p.vx, p.vy) || 1;
        p.vx *= sp / s2; p.vy *= sp / s2;
      }
    }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const tx = Math.floor(nx), ty = Math.floor(ny);
    if (solidAt(G, tx, ty)) {
      if (p.fac === FAC_PLAYER && tileAt(G, tx, ty) === T.SECRET && p.ability) breakSecret(G, tx, ty);
      if (p.bounce > 0) {
        p.bounce--;
        if (solidAt(G, Math.floor(nx), Math.floor(p.y))) p.vx = -p.vx;
        if (solidAt(G, Math.floor(p.x), Math.floor(ny))) p.vy = -p.vy;
        p.h0 = p.h1 = p.h2 = p.h3 = 0;
        continue;
      }
      projImpact(G, p);
      emit(G, { t: 'spark', x: p.x, y: p.y, kind: p.kind });
      continue;
    }
    p.x = nx; p.y = ny;
    if (p.fac === FAC_PLAYER) {
      for (const e of G.enemies) {
        if (e.dead || e.air) continue;
        const rr = p.r + e.r;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy > rr * rr || hitListed(p, e.id)) continue;
        hitAdd(p, e.id);
        const l = Math.hypot(p.vx, p.vy) || 1;
        playerHit(G, e, p.dmg, { knock: p.knock, kx: p.vx / l, ky: p.vy / l, sx: p.x - p.vx / l, sy: p.y - p.vy / l, ability: p.ability, burn: p.burnF, chill: p.chillF, bleed: p.bleedF });
        emit(G, { t: 'spark', x: p.x, y: p.y, kind: p.kind });
        if (p.pierce > 0) p.pierce--;
        else { projImpact(G, p); break; }
      }
      if (p.on) {
        for (const o of G.objects) {
          if (o.kind === 'crate' && !o.used && Math.abs(o.x + 0.5 - p.x) < 0.45 && Math.abs(o.y + 0.5 - p.y) < 0.45) { breakCrate(G, o); projImpact(G, p); break; }
        }
      }
    } else {
      if (G.decoy && Math.hypot(G.decoy.x - p.x, G.decoy.y - p.y) < p.r + 0.35) { G.decoy.hp -= p.dmg; p.on = false; continue; }
      const rr = p.r + P.r;
      const dx = P.x - p.x, dy = P.y - p.y;
      if (dx * dx + dy * dy < rr * rr && !P.dead) {
        if (P.bulwarkT > 0) {
          // Reflect back as a player projectile.
          p.fac = FAC_PLAYER; p.vx = -p.vx * 1.2; p.vy = -p.vy * 1.2; p.dmg = Math.max(p.dmg * 2, P.st.power); p.life = 2; p.h0 = p.h1 = p.h2 = p.h3 = 0;
          emit(G, { t: 'block', x: P.x, y: P.y });
          continue;
        }
        if (P.iframes > 0 || P.dashT > 0) continue; // dodged through
        const src = p.owner ? G.byId.get(p.owner) : null;
        hurtPlayer(G, p.dmg, { status: p.status, spow: p.spow, kx: p.vx, ky: p.vy, knock: 2, name: src ? anName(src) : (p.name || 'a stray shot'), src });
        p.on = false;
      }
    }
  }
}

export function anName(e) {
  const n = e.def.name;
  if (e.boss) return n;
  return /^[AEIOU]/.test(n) ? `an ${n}` : `a ${n}`;
}

// ---------------------------------------------------------------- telegraphs (delayed area attacks)
export function spawnTele(G, o) {
  let t = null;
  for (let k = 0; k < MAX_TELE; k++) {
    const q = G.tele[(G.teleCursor + k) % MAX_TELE];
    if (!q.on) { t = q; G.teleCursor = (G.teleCursor + k + 1) % MAX_TELE; break; }
  }
  if (!t) return null;
  t.on = true; t.kind = o.kind || 0; t.x = o.x; t.y = o.y; t.r = o.r || 1;
  t.dx = o.dx || 0; t.dy = o.dy || 0; t.len = o.len || 0; t.w = o.w || 0.5;
  t.t = 0; t.total = o.total || 1; t.dmg = o.dmg || 0; t.fac = o.fac != null ? o.fac : FAC_ENEMY;
  t.status = o.status || null; t.spow = o.spow || 0; t.follow = o.follow || 0; t.owner = o.owner || 0;
  t.selfDestruct = !!o.selfDestruct; t.linger = o.linger || null; t.visual = !!o.visual; t.knock = o.knock || 0;
  t.breaks = !!o.breaks; t.ring = o.ring || 0; t.ringKind = o.ringKind || null; t.name = o.name || null; t.color = o.color || 0;
  return t;
}

export function updateTele(G, dt) {
  const P = G.P;
  for (const t of G.tele) {
    if (!t.on) continue;
    t.t += dt;
    if (t.follow) {
      const e = G.byId.get(t.follow);
      if (e && !e.dead) { t.x = e.x; t.y = e.y; }
      else if (t.visual) { t.on = false; continue; }
    }
    if (t.t < t.total) continue;
    t.on = false;
    if (t.visual) continue;
    const owner = t.owner ? G.byId.get(t.owner) : null;
    if (t.selfDestruct) {
      if (!owner || owner.dead) continue;
      t.x = owner.x; t.y = owner.y;
      killEnemy(G, owner, { silent: true });
    }
    if (t.kind === 0) {
      explode(G, t.x, t.y, t.r, t.dmg, t.fac, { status: t.status, spow: t.spow, color: t.color || (t.fac === FAC_ENEMY ? 0xff5040 : 0xffa040), name: t.name || (owner ? anName(owner) : null), breaks: t.breaks, procs: true });
      if (t.ring) radialVolley(G, t.x, t.y, t.ring, 6, G.rng.float(0, 6.28), t.dmg * 0.5, t.ringKind || 'bone', t.status, t.spow, t.owner);
      emit(G, { t: 'shake', a: Math.min(0.6, t.r * 0.12) });
    } else if (t.kind === 1) {
      // Line: distance from P to segment.
      const px = P.x - t.x, py = P.y - t.y;
      const along = px * t.dx + py * t.dy;
      if (along >= 0 && along <= t.len) {
        const perp = Math.abs(px * -t.dy + py * t.dx);
        if (perp < t.w / 2 + P.r) hurtPlayer(G, t.dmg, { status: t.status, spow: t.spow, name: t.name || 'a sweeping blast' });
      }
    }
    if (t.linger) spawnZone(G, t.linger, t.x, t.y, t.r * 0.9, 4, t.fac, t.dmg * 0.25);
  }
}

// ---------------------------------------------------------------- ground zones
export function spawnZone(G, kind, x, y, r, time, fac, dps) {
  let z = null, oldest = null;
  for (const q of G.zones) { if (!q.on) { z = q; break; } if (!oldest || q.t < oldest.t) oldest = q; }
  if (!z) z = oldest;
  z.on = true; z.kind = kind; z.x = x; z.y = y; z.r = r; z.t = time; z.max = time; z.fac = fac; z.dps = dps; z.tick = 0;
  return z;
}

const ZONE_STATUS = { fire: 'burn', poison: 'poison', frost: 'chill', void: 'shock' };
export function updateZones(G, dt) {
  const P = G.P;
  for (const z of G.zones) {
    if (!z.on) continue;
    z.t -= dt;
    if (z.t <= 0) { z.on = false; continue; }
    z.tick -= dt;
    if (z.tick > 0) continue;
    z.tick = 0.5;
    const st = ZONE_STATUS[z.kind];
    if (z.fac === FAC_ENEMY) {
      if (Math.hypot(P.x - z.x, P.y - z.y) < z.r + P.r * 0.5) {
        if (z.dps > 0) hurtPlayer(G, z.dps * 0.5, { dot: true, color: st === 'burn' ? 'burn' : 'poison', name: z.kind === 'fire' ? 'flames' : 'a toxic cloud' });
        if (st) applyStatus(G, P, st, st === 'chill' ? 30 : z.dps * 0.4, true);
      }
    } else {
      for (const e of G.enemies) {
        if (e.dead || e.air || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.r * 0.5) continue;
        hurtEnemy(G, e, z.dps * 0.5, { dot: true, color: 'burn' });
        if (!e.dead && st) applyStatus(G, e, st, st === 'chill' ? 30 : G.P.st.power * 0.25, false);
      }
    }
  }
}
