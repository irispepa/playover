// Enemy and boss behaviour. Pure.
import { T, HAZARDS } from './data.js';
import { moveCircle, los, flowDir, solidAt, tileAt } from './world.js';
import {
  FAC_ENEMY, emit, sfx, hurtPlayer, spawnProj, spawnTele, makeEnemy, radialVolley, spawnZone, statusPowForEnemy, anName, wake,
} from './combat.js';

const tmp = { x: 0, y: 0 };

function target(G) {
  const d = G.decoy;
  if (d) return d;
  return G.P;
}

function refreshLos(G, e, tx, ty, dt) {
  e.losT -= dt;
  if (e.losT <= 0) {
    e.losT = 0.2 + (e.id % 5) * 0.02;
    e.hasLos = los(G, e.x, e.y, tx, ty);
  }
  return e.hasLos;
}

// Move e toward (tx, ty) at speed, using direct steering with line of sight, else the flow field.
function steer(G, e, tx, ty, speed, dt, hasLos) {
  let dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.01) return;
  if (hasLos || G.decoy) { dx /= d; dy /= d; }
  else if (flowDir(G, e.x, e.y, tmp)) { dx = tmp.x; dy = tmp.y; }
  else { dx /= d; dy /= d; }
  e.faceX += (dx - e.faceX) * Math.min(1, dt * 10);
  e.faceY += (dy - e.faceY) * Math.min(1, dt * 10);
  e.mvx = dx * speed; e.mvy = dy * speed;
}

function faceToward(e, dx, dy, rate, dt) {
  const l = Math.hypot(dx, dy) || 1;
  dx /= l; dy /= l;
  if (rate <= 0) { e.faceX = dx; e.faceY = dy; return; }
  const cur = Math.atan2(e.faceY, e.faceX), want = Math.atan2(dy, dx);
  let diff = want - cur;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  const a = cur + step;
  e.faceX = Math.cos(a); e.faceY = Math.sin(a);
}

function meleeStrike(G, e, reach, arcCos, dmgMul) {
  const tg = target(G);
  const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
  emit(G, { t: 'eswing', id: e.id, x: e.x, y: e.y, ax: e.aimX, ay: e.aimY, r: reach + e.r, boss: e.boss });
  if (d > reach + e.r + (tg.r || 0.3) + 0.15) return;
  if ((dx * e.aimX + dy * e.aimY) / d < arcCos) return;
  if (tg !== G.P) { tg.hp -= e.dmg * dmgMul; return; }
  hurtPlayer(G, e.dmg * dmgMul, { melee: true, src: e, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), kx: dx, ky: dy, knock: e.boss ? 7 : 3, name: anName(e) });
}

function contact(G, e, dmgMul) {
  if (e.contactT > 0) return;
  const tg = target(G);
  const dx = tg.x - e.x, dy = tg.y - e.y;
  const rr = e.r + (tg.r || 0.3) + 0.05;
  if (dx * dx + dy * dy > rr * rr) return;
  e.contactT = e.def.cd ? e.def.cd * e.cdMul : 0.8;
  if (tg !== G.P) { tg.hp -= e.dmg * dmgMul; return; }
  hurtPlayer(G, e.dmg * dmgMul, { melee: true, src: e, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), kx: dx, ky: dy, knock: 3, name: anName(e) });
}

function fireProj(G, e, ax, ay) {
  const pr = e.def.proj;
  const n = pr.count || 1, spread = pr.spread || 0;
  const base = Math.atan2(ay, ax);
  for (let k = 0; k < n; k++) {
    const a = base + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0);
    spawnProj(G, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, Math.cos(a) * pr.speed, Math.sin(a) * pr.speed, {
      fac: FAC_ENEMY, dmg: e.dmg, kind: pr.kind, r: pr.r, life: 3, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), owner: e.id,
    });
  }
  sfx(G, 'eshoot');
}

function pickBlinkDest(G, e, tx, ty, rmin, rmax) {
  for (let k = 0; k < 12; k++) {
    const a = G.rng.float(0, Math.PI * 2), r = G.rng.float(rmin, rmax);
    const x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r;
    if (solidAt(G, Math.floor(x), Math.floor(y))) continue;
    if (!los(G, tx, ty, x, y)) continue;
    // keep a bit of clearance from walls
    if (solidAt(G, Math.floor(x + 0.4), Math.floor(y)) || solidAt(G, Math.floor(x - 0.4), Math.floor(y)) || solidAt(G, Math.floor(x), Math.floor(y + 0.4)) || solidAt(G, Math.floor(x), Math.floor(y - 0.4))) continue;
    e.destX = x; e.destY = y;
    return true;
  }
  return false;
}

function keepDistance(G, e, tx, ty, d, hasLos, pref, speed, dt) {
  const dx = tx - e.x, dy = ty - e.y;
  if (!hasLos || d > pref + 1) { steer(G, e, tx, ty, speed, dt, hasLos); return; }
  if (d < pref * 0.55) { e.mvx = (-dx / d) * speed; e.mvy = (-dy / d) * speed; faceToward(e, dx, dy, 0, dt); return; }
  e.strafeT -= dt;
  if (e.strafeT <= 0) { e.strafeT = G.rng.float(1, 2.2); e.strafe = -e.strafe; }
  e.mvx = (-dy / d) * speed * 0.45 * e.strafe; e.mvy = (dx / d) * speed * 0.45 * e.strafe;
  faceToward(e, dx, dy, 0, dt);
}

export function updateEnemy(G, e, dt) {
  const def = e.def;
  const tg = target(G);
  const tx = tg.x, ty = tg.y;
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy) || 0.001;
  e.mvx = 0; e.mvy = 0;
  if (e.flash > 0) e.flash -= dt;
  if (e.contactT > 0) e.contactT -= dt;
  if (e.arcT > 0) e.arcT -= dt;
  if (e.orbT > 0) e.orbT -= dt;
  if (e.wardMax > 0) { e.wardT -= dt; if (e.wardT <= 0 && e.ward < e.wardMax) { e.ward = e.wardMax; e.wardT = 6; } }

  if (!e.aware) {
    e.sense -= dt;
    if (e.sense <= 0) {
      e.sense = 0.3;
      if (d < 8.5 && los(G, e.x, e.y, G.P.x, G.P.y)) wake(G, e);
    }
    return;
  }
  const s = e.s;
  if (s.frozenT > 0 || s.stunT > 0) { e.tele = 0; return; }
  let slow = s.chill > 0 ? 0.6 : 1;
  if (!def.flying && !e.boss) {
    const tt = tileAt(G, Math.floor(e.x), Math.floor(e.y));
    if (tt === T.HAZARD && G.hazard === 'water') slow *= 1 - HAZARDS.water.slow;
  }
  const speed = e.speed * slow;
  const hasLos = refreshLos(G, e, tx, ty, dt);
  e.cd -= dt * slow;
  e.cd2 -= dt;
  if (e.boss) { updateBoss(G, e, dt, d, dx, dy, hasLos, speed); return; }
  if (e.trail && (e.mvx || e.state === 'charge')) {
    e.trailT -= dt;
    if (e.trailT <= 0) { e.trailT = 0.25; spawnZone(G, e.trail, e.x, e.y, 0.55, 2.5, FAC_ENEMY, e.dmg * 0.5); }
  }

  switch (def.ai) {
    case 'chaser':
    case 'shielded': {
      const shielded = def.ai === 'shielded';
      if (e.state === 'move') {
        if (d <= def.range + e.r + 0.35 && e.cd <= 0 && hasLos) {
          e.state = 'windup'; e.t = def.windup; e.aimX = dx / d; e.aimY = dy / d;
        } else {
          steer(G, e, tx, ty, speed, dt, hasLos);
          if (shielded) { faceToward(e, dx, dy, def.turn, dt); }
          if (d < e.r + 0.55) { e.mvx *= 0.1; e.mvy *= 0.1; }
        }
      } else if (e.state === 'windup') {
        e.t -= dt; e.tele = 1 - e.t / def.windup;
        if (shielded) faceToward(e, e.aimX, e.aimY, def.turn, dt);
        if (e.t <= 0) {
          e.vx += e.aimX * 3; e.vy += e.aimY * 3;
          meleeStrike(G, e, def.range, 0.35, 1);
          e.state = 'recover'; e.t = 0.35; e.cd = def.cd * e.cdMul; e.tele = 0;
        }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'move'; if (shielded) faceToward(e, dx, dy, def.turn, dt); }
      break;
    }
    case 'kiter': {
      if (e.state === 'move') {
        keepDistance(G, e, tx, ty, d, hasLos, def.range, speed, dt);
        if (hasLos && d <= def.range + 1.5 && e.cd <= 0) {
          e.state = 'windup'; e.t = def.windup; e.aimX = dx / d; e.aimY = dy / d;
          spawnTele(G, { kind: 1, x: e.x, y: e.y, dx: e.aimX, dy: e.aimY, len: Math.min(10, def.range + 3), w: 0.18, total: def.windup, visual: true, follow: e.id, owner: e.id });
        }
      } else if (e.state === 'windup') {
        e.t -= dt; e.tele = 1 - e.t / def.windup;
        e.faceX = e.aimX; e.faceY = e.aimY;
        if (e.t <= 0) { fireProj(G, e, e.aimX, e.aimY); e.state = 'recover'; e.t = 0.3; e.cd = def.cd * e.cdMul; e.tele = 0; }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'move'; }
      break;
    }
    case 'charger': {
      if (e.state === 'move') {
        steer(G, e, tx, ty, speed, dt, hasLos);
        if (hasLos && d < 7 && e.cd <= 0) {
          e.state = 'windup'; e.t = def.windup; e.aimX = dx / d; e.aimY = dy / d;
          spawnTele(G, { kind: 1, x: e.x, y: e.y, dx: e.aimX, dy: e.aimY, len: def.chargeSpeed * def.chargeTime + 0.6, w: e.r * 2 + 0.3, total: def.windup, visual: true, owner: e.id });
        }
      } else if (e.state === 'windup') {
        e.t -= dt; e.tele = 1 - e.t / def.windup;
        e.faceX = e.aimX; e.faceY = e.aimY;
        if (e.t <= 0) { e.state = 'charge'; e.t = def.chargeTime; e.hitDone = false; e.tele = 0; sfx(G, 'charge'); }
      } else if (e.state === 'charge') {
        e.t -= dt;
        const bl = moveCircle(G, e, e.aimX * def.chargeSpeed * dt, e.aimY * def.chargeSpeed * dt);
        if (!e.hitDone) {
          const pdx = tg.x - e.x, pdy = tg.y - e.y;
          if (pdx * pdx + pdy * pdy < (e.r + (tg.r || 0.3) + 0.15) ** 2) {
            e.hitDone = true;
            if (tg === G.P) hurtPlayer(G, e.dmg * 1.25, { melee: true, src: e, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), kx: e.aimX, ky: e.aimY, knock: 9, name: anName(e) });
            else tg.hp -= e.dmg;
          }
        }
        if (bl) { e.state = 'stunned'; e.t = 0.9; emit(G, { t: 'dust', x: e.x + e.aimX * e.r, y: e.y + e.aimY * e.r }); emit(G, { t: 'shake', a: 0.15 }); e.cd = def.cd * e.cdMul; }
        else if (e.t <= 0) { e.state = 'recover'; e.t = 0.5; e.cd = def.cd * e.cdMul; }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'move'; }
      break;
    }
    case 'exploder': {
      if (e.state === 'move') {
        steer(G, e, tx, ty, speed, dt, hasLos);
        if (d < 1.45 && hasLos) {
          e.state = 'fuse'; e.t = def.fuse;
          spawnTele(G, { kind: 0, x: e.x, y: e.y, r: def.blastR, total: def.fuse, dmg: e.dmg, fac: FAC_ENEMY, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), follow: e.id, owner: e.id, selfDestruct: true, linger: def.cloud || null, name: anName(e) });
          sfx(G, 'fuse');
        }
      } else if (e.state === 'fuse') {
        e.t -= dt; e.tele = 1 - e.t / def.fuse;
      }
      break;
    }
    case 'summoner': {
      if (e.state === 'move') {
        keepDistance(G, e, tx, ty, d, hasLos, def.range, speed, dt);
        if (hasLos && d < 9 && e.cd <= 0 && e.minions < def.maxMinions) {
          e.state = 'cast'; e.t = 0.9; e.sn = 0;
          for (let k = 0; k < def.summonCount && e.sn < 4; k++) {
            const a = G.rng.float(0, Math.PI * 2);
            const sx = e.x + Math.cos(a) * 1.3, sy = e.y + Math.sin(a) * 1.3;
            if (solidAt(G, Math.floor(sx), Math.floor(sy))) continue;
            e.sx[e.sn] = sx; e.sy[e.sn] = sy; e.sn++;
            spawnTele(G, { kind: 0, x: sx, y: sy, r: 0.5, total: 0.9, visual: true, color: def.accent });
          }
        } else if (hasLos && d < 8 && e.cd2 <= 0 && def.proj) {
          e.cd2 = 2.4; fireProj(G, e, dx / d, dy / d);
        }
      } else if (e.state === 'cast') {
        e.t -= dt; e.tele = 1 - e.t / 0.9;
        if (e.t <= 0) {
          for (let k = 0; k < e.sn; k++) {
            const m = makeEnemy(G, def.summon, e.sx[k], e.sy[k], { master: e.id, aware: true });
            if (m) { e.minions++; m.cd = 0.8; emit(G, { t: 'summon', x: m.x, y: m.y, color: def.accent }); }
          }
          e.state = 'move'; e.cd = def.cd * e.cdMul; e.tele = 0;
          sfx(G, 'summon');
        }
      }
      break;
    }
    case 'teleporter': {
      if (e.state === 'move') {
        steer(G, e, tx, ty, speed * 0.7, dt, hasLos);
        if (e.cd <= 0 && d < 10 && hasLos && pickBlinkDest(G, e, tx, ty, 1.4, 2.3)) {
          e.state = 'blink'; e.t = 0.45;
          spawnTele(G, { kind: 0, x: e.destX, y: e.destY, r: 0.6, total: 0.45, visual: true, color: def.accent });
          sfx(G, 'blink');
        } else if (d <= def.range + e.r + 0.3 && e.cd2 <= 0) {
          e.state = 'windup'; e.t = def.windup; e.aimX = dx / d; e.aimY = dy / d; e.cd2 = 1.2;
        }
      } else if (e.state === 'blink') {
        e.t -= dt; e.alpha = Math.max(0.1, e.t / 0.45);
        if (e.t <= 0) {
          e.x = e.destX; e.y = e.destY; e.alpha = 1; e.losT = 0;
          const ddx = tg.x - e.x, ddy = tg.y - e.y, dd = Math.hypot(ddx, ddy) || 1;
          e.state = 'windup'; e.t = def.windup; e.aimX = ddx / dd; e.aimY = ddy / dd; e.cd = def.cd * e.cdMul;
          emit(G, { t: 'summon', x: e.x, y: e.y, color: def.accent });
        }
      } else if (e.state === 'windup') {
        e.t -= dt; e.tele = 1 - e.t / def.windup; e.faceX = e.aimX; e.faceY = e.aimY;
        if (e.t <= 0) { meleeStrike(G, e, def.range, 0.3, 1); e.state = 'recover'; e.t = 0.4; e.tele = 0; }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'move'; }
      break;
    }
    case 'splitter': {
      e.hop += dt * (5 + (2 - e.size) * 1.5);
      const hopMul = 0.25 + 0.95 * Math.max(0, Math.sin(e.hop));
      steer(G, e, tx, ty, speed * hopMul, dt, hasLos);
      contact(G, e, 1);
      break;
    }
    case 'swarmer': {
      e.hop += dt * 5;
      steer(G, e, tx, ty, speed, dt, hasLos);
      const wob = Math.sin(e.hop + e.id) * 0.9;
      const mx = e.mvx, my = e.mvy;
      e.mvx = mx - my * wob; e.mvy = my + mx * wob;
      contact(G, e, 1);
      break;
    }
    case 'spitter': {
      if (e.state === 'move') {
        if (speed > 0 && d > 3) steer(G, e, tx, ty, speed, dt, hasLos);
        faceToward(e, dx, dy, 0, dt);
        if (hasLos && d < 9 && e.cd <= 0) { e.state = 'windup'; e.t = def.windup; }
      } else if (e.state === 'windup') {
        e.t -= dt; e.tele = 1 - e.t / def.windup;
        if (e.t <= 0) {
          if (def.spin) e.spin += 0.35; else e.spin = Math.atan2(dy, dx);
          radialVolley(G, e.x, e.y, def.burst, def.proj.speed, e.spin, e.dmg, def.proj.kind, e.onHit, statusPowForEnemy(e, e.onHit), e.id);
          sfx(G, 'eshoot');
          e.state = 'move'; e.cd = def.cd * e.cdMul; e.tele = 0;
        }
      }
      break;
    }
    case 'caster': {
      if (e.state === 'move') {
        keepDistance(G, e, tx, ty, d, hasLos, def.range * 0.8, speed, dt);
        if (hasLos && d < 9 && e.cd <= 0) { e.state = 'cast'; e.t = 0.55; }
      } else if (e.state === 'cast') {
        e.t -= dt; e.tele = 1 - e.t / 0.55;
        if (e.t <= 0) {
          const tvx = tg === G.P ? G.P.mvx || 0 : 0, tvy = tg === G.P ? G.P.mvy || 0 : 0;
          for (let k = 0; k < def.zones; k++) {
            let zx = tx + tvx * 0.4, zy = ty + tvy * 0.4;
            if (k > 0) { const a = G.rng.float(0, Math.PI * 2), r = G.rng.float(1.2, 2.6); zx = tx + Math.cos(a) * r; zy = ty + Math.sin(a) * r; }
            if (solidAt(G, Math.floor(zx), Math.floor(zy))) continue;
            spawnTele(G, { kind: 0, x: zx, y: zy, r: def.zoneR, total: def.zoneDelay, dmg: e.dmg, fac: FAC_ENEMY, status: e.onHit, spow: statusPowForEnemy(e, e.onHit), owner: e.id, name: anName(e), color: def.accent });
          }
          sfx(G, 'cast');
          e.state = 'move'; e.cd = def.cd * e.cdMul; e.tele = 0;
        }
      }
      break;
    }
    default: steer(G, e, tx, ty, speed, dt, hasLos);
  }
}

// ---------------------------------------------------------------- bosses
function nextPattern(G, e, ph) {
  if (!e.bag.length) e.bag = G.rng.shuffle(ph.patterns);
  return e.bag.pop();
}

function startAction(G, e, key, ph) {
  const a = e.def.attacks[key];
  e.act = { key, a, stage: 0, t: 0, n: 0, ang: G.rng.float(0, 6.28) };
  const spd = ph.speed;
  const P = G.P;
  switch (a.type) {
    case 'volley': e.act.t = 0.5 / spd; break;
    case 'slam':
      e.act.t = a.delay / spd;
      spawnTele(G, { kind: 0, x: e.x, y: e.y, r: a.r, total: a.delay / spd, dmg: e.dmg * a.dmg, fac: FAC_ENEMY, status: a.status, spow: a.status ? statusPowForEnemy(e, a.status) : 0, follow: e.id, owner: e.id, ring: a.ring || 0, ringKind: a.kind, name: e.def.name });
      break;
    case 'leap': {
      e.act.t = a.delay / spd;
      e.act.sx = e.x; e.act.sy = e.y; e.act.tx = P.x; e.act.ty = P.y; e.act.total = e.act.t;
      spawnTele(G, { kind: 0, x: P.x, y: P.y, r: a.r, total: a.delay / spd, dmg: e.dmg * a.dmg, fac: FAC_ENEMY, owner: e.id, ring: a.ring || 0, ringKind: a.kind, name: e.def.name });
      e.air = true;
      sfx(G, 'charge');
      break;
    }
    case 'charge': e.act.stage = 0; e.act.t = a.windup / spd; aimCharge(G, e, a); break;
    case 'summon': e.act.t = 0.8 / spd; emit(G, { t: 'summon', x: e.x, y: e.y, color: e.def.accent }); break;
    case 'zones': e.act.t = 0.5 / spd; break;
    case 'blink': {
      e.act.t = 0.5 / spd;
      const ar = G.fl.arena;
      for (let k = 0; k < 20; k++) {
        const x = ar.x + 2 + G.rng.float(0, ar.w - 4), y = ar.y + 2 + G.rng.float(0, ar.h - 4);
        if (solidAt(G, Math.floor(x), Math.floor(y)) || Math.hypot(x - P.x, y - P.y) < 4.5) continue;
        let clear = true;
        for (let oy = -1; oy <= 1 && clear; oy++) for (let ox = -1; ox <= 1; ox++) if (solidAt(G, Math.floor(x + ox * e.r), Math.floor(y + oy * e.r))) { clear = false; break; }
        if (!clear) continue;
        e.destX = x; e.destY = y; break;
      }
      if (!e.destX) { e.destX = e.x; e.destY = e.y; }
      spawnTele(G, { kind: 0, x: e.destX, y: e.destY, r: e.r + 0.4, total: 0.5 / spd, visual: true, color: e.def.accent });
      sfx(G, 'blink');
      break;
    }
    case 'chase': e.act.t = a.time; e.act.swing = 0; break;
    default: e.act.t = 0.5;
  }
}

function aimCharge(G, e, a) {
  const P = G.P;
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
  e.aimX = dx / d; e.aimY = dy / d;
  spawnTele(G, { kind: 1, x: e.x, y: e.y, dx: e.aimX, dy: e.aimY, len: a.speed * a.time + 1, w: e.r * 2 + 0.3, total: a.windup, visual: true, owner: e.id });
}

function bossVolley(G, e, a) {
  const P = G.P;
  const dmg = e.dmg * 0.7;
  const spow = a.status ? statusPowForEnemy(e, a.status) : 0;
  if (a.shape === 'ring') {
    e.act.ang += Math.PI / a.count;
    radialVolley(G, e.x, e.y, a.count, a.speed, e.act.ang, dmg, a.kind, a.status, spow, e.id);
  } else if (a.shape === 'spiral') {
    e.act.ang += a.spin;
    radialVolley(G, e.x, e.y, a.count, a.speed, e.act.ang, dmg, a.kind, a.status, spow, e.id);
  } else {
    const base = Math.atan2(P.y - e.y, P.x - e.x);
    for (let k = 0; k < a.count; k++) {
      const ang = base + (a.count > 1 ? (k / (a.count - 1) - 0.5) * a.spread : 0);
      spawnProj(G, e.x, e.y, Math.cos(ang) * a.speed, Math.sin(ang) * a.speed, { fac: FAC_ENEMY, dmg, kind: a.kind, r: 0.18, life: 4, status: a.status, spow, owner: e.id });
    }
  }
  sfx(G, 'eshoot');
}

function updateBoss(G, e, dt, d, dx, dy, hasLos, speed) {
  const def = e.def;
  if (e.state === 'sleep') return;
  // Phase changes.
  while (e.phase < def.phases.length - 1 && e.hp / e.maxHp <= def.phases[e.phase + 1].at) {
    e.phase++;
    e.bag = [];
    e.act = null; e.air = false;
    e.state = 'recover'; e.t = 1.0;
    const ph = def.phases[e.phase];
    emit(G, { t: 'bossphase', say: ph.say || '', phase: e.phase });
    spawnTele(G, { kind: 0, x: e.x, y: e.y, r: 2.6, total: 0.8, dmg: e.dmg, fac: FAC_ENEMY, follow: e.id, owner: e.id, name: def.name });
  }
  const ph = def.phases[e.phase];
  const spd = ph.speed;
  if (e.state === 'recover') {
    e.t -= dt * spd;
    if (d > 3) steer(G, e, G.P.x, G.P.y, speed * 0.5, dt, hasLos);
    faceToward(e, dx, dy, 4, dt);
    if (e.t <= 0) { e.state = 'act'; startAction(G, e, nextPattern(G, e, ph), ph); }
    return;
  }
  const A = e.act;
  if (!A) { e.state = 'recover'; e.t = 0.6; return; }
  const a = A.a;
  A.t -= dt;
  let done = false;
  switch (a.type) {
    case 'volley':
      e.tele = A.n === 0 ? Math.min(1, 1 - A.t / (0.5 / spd)) : 0;
      if (A.t <= 0) {
        bossVolley(G, e, a);
        A.n++;
        A.t = a.interval / spd;
        if (A.n >= a.repeats) done = true;
      }
      break;
    case 'slam':
      e.tele = 1 - Math.max(0, A.t) / (a.delay / spd);
      if (A.t <= 0) { done = true; e.tele = 0; sfx(G, 'explode'); }
      break;
    case 'leap': {
      const k = 1 - Math.max(0, A.t) / A.total;
      e.x = A.sx + (A.tx - A.sx) * k; e.y = A.sy + (A.ty - A.sy) * k;
      e.z = Math.sin(k * Math.PI) * 3.5;
      if (A.t <= 0) {
        e.air = false; e.z = 0;
        e.x = A.tx; e.y = A.ty;
        // Make sure the boss lands on open ground.
        if (solidAt(G, Math.floor(e.x), Math.floor(e.y))) { e.x = A.sx; e.y = A.sy; }
        moveCircle(G, e, 0.001, 0.001);
        done = true; sfx(G, 'explode');
      }
      break;
    }
    case 'charge':
      if (A.stage === 0) {
        e.tele = 1 - Math.max(0, A.t) / a.windup;
        e.faceX = e.aimX; e.faceY = e.aimY;
        if (A.t <= 0) { A.stage = 1; A.t = a.time; e.hitDone = false; e.tele = 0; sfx(G, 'charge'); }
      } else {
        const bl = moveCircle(G, e, e.aimX * a.speed * dt, e.aimY * a.speed * dt);
        if (a.trail) { e.trailT -= dt; if (e.trailT <= 0) { e.trailT = 0.12; spawnZone(G, a.trail, e.x, e.y, 0.8, 3, FAC_ENEMY, e.dmg * 0.4); } }
        const P = G.P;
        if (!e.hitDone && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 0.2) {
          e.hitDone = true;
          hurtPlayer(G, e.dmg * a.dmg, { melee: true, src: e, kx: e.aimX, ky: e.aimY, knock: 10, name: def.name });
        }
        if (bl || A.t <= 0) {
          if (bl) { emit(G, { t: 'shake', a: 0.35 }); emit(G, { t: 'dust', x: e.x + e.aimX * e.r, y: e.y + e.aimY * e.r }); }
          A.n++;
          if (A.n >= (a.repeats || 1)) done = true;
          else { A.stage = 0; A.t = (a.windup * 0.8) / spd; aimCharge(G, e, a); }
        }
      }
      break;
    case 'summon':
      e.tele = 1 - Math.max(0, A.t) / (0.8 / spd);
      if (A.t <= 0) {
        let alive = 0;
        for (const o of G.enemies) if (!o.dead && o.summoned) alive++;
        for (let k = 0; k < a.count && alive < 8; k++) {
          const ang = G.rng.float(0, Math.PI * 2);
          const x = e.x + Math.cos(ang) * (e.r + 1.2), y = e.y + Math.sin(ang) * (e.r + 1.2);
          if (solidAt(G, Math.floor(x), Math.floor(y))) continue;
          const m = makeEnemy(G, a.enemy, x, y, { aware: true, summoned: true, size: a.size });
          if (m) { alive++; emit(G, { t: 'summon', x, y, color: def.accent }); }
        }
        sfx(G, 'summon');
        done = true; e.tele = 0;
      }
      break;
    case 'zones':
      e.tele = 1 - Math.max(0, A.t) / (0.5 / spd);
      if (A.t <= 0) {
        const P = G.P;
        for (let k = 0; k < a.count; k++) {
          let x = P.x, y = P.y;
          if (k > 0) { const ang = G.rng.float(0, Math.PI * 2), r = G.rng.float(1.2, a.spread); x += Math.cos(ang) * r; y += Math.sin(ang) * r; }
          if (solidAt(G, Math.floor(x), Math.floor(y))) continue;
          spawnTele(G, { kind: 0, x, y, r: a.r, total: a.delay / spd, dmg: e.dmg * a.dmg, fac: FAC_ENEMY, status: a.status, spow: a.status ? statusPowForEnemy(e, a.status) : 0, owner: e.id, linger: a.linger || null, name: def.name, color: def.accent });
        }
        sfx(G, 'cast');
        done = true; e.tele = 0;
      }
      break;
    case 'blink':
      e.alpha = Math.max(0.1, A.t / (0.5 / spd));
      if (A.t <= 0) { e.x = e.destX; e.y = e.destY; e.alpha = 1; e.destX = 0; done = true; emit(G, { t: 'summon', x: e.x, y: e.y, color: def.accent }); }
      break;
    case 'chase': {
      const P = G.P;
      if (A.swing > 0) {
        A.swing -= dt;
        e.tele = 1 - A.swing / (0.5 / spd);
        if (A.swing <= 0) { meleeStrike(G, e, 1.3, 0.2, 1.1); e.tele = 0; e.vx += e.aimX * 3; e.vy += e.aimY * 3; }
      } else {
        steer(G, e, P.x, P.y, speed * spd, dt, hasLos);
        if (d < e.r + 1.6) { A.swing = 0.5 / spd; e.aimX = dx / d; e.aimY = dy / d; }
      }
      if (A.t <= 0 && A.swing <= 0) done = true;
      break;
    }
    default: done = true;
  }
  if (done) { e.act = null; e.state = 'recover'; e.t = 0.9; e.tele = 0; e.alpha = 1; }
}
