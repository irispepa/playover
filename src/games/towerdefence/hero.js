// The hero: a directly controlled twin-stick unit. Pure module.
// Input arrives as plain vectors via setHeroInput(); the sim never reads devices.
import { HERO, HERO_OP, HERO_WEAPONS, WALKABLE, ENEMIES, CARD_BY_ID, heroXpNeed } from './data.js';
import { query, damage, applyOnHit, fx, newProj, addBlast, applyStun, DCOL, F_SPLASH } from './combat.js';

export function makeHero() {
  return {
    unlocked: false, deployed: false, x: 0, y: 0, hp: HERO.hp, downT: 0, level: 1, xp: 0, need: heroXpNeed(1), points: 0,
    up: { dmg: 0, rate: 0, speed: 0, hp: 0 }, weapon: 'blaster', cd: 0, dashCd: 0, dashT: 0, dvx: 0, dvy: 0, iT: 0,
    ultCd: 0, angle: -Math.PI / 2, moveA: 0, moving: false, firing: false, regenDelay: 0, kills: 0, dealt: 0,
    autoSpend: false, flash: 0, engBoost: 0, contactCd: 0,
  };
}

export function heroWeapons(s) {
  const list = ['blaster'];
  if (s.mode === 'op') return ['blaster', 'shotgun', 'rail', 'grenade', 'flamer', 'arc'];
  for (const id of s.perks) { const c = CARD_BY_ID[id]; if (c && c.weapon && !list.includes(c.weapon)) list.push(c.weapon); }
  return list;
}

// Derived hero numbers (cheap, computed on demand).
export function heroStats(s, out = {}) {
  const h = s.hero;
  const op = s.mode === 'op';
  const W = HERO_WEAPONS[h.weapon] || HERO_WEAPONS.blaster;
  const waveP = Math.pow(s.hpScaleFn(Math.max(1, s.wave), s.mode), 0.5);
  out.weapon = W;
  out.dmg = W.dmg * (1 + HERO.per.dmg * h.up.dmg) * waveP * (op ? HERO_OP.dmg : 1) * s.mods.heroDmg;
  out.rate = W.rate * (1 + HERO.per.rate * h.up.rate) * (op ? HERO_OP.rate : 1);
  out.range = W.range;
  out.speed = HERO.speed * (1 + HERO.per.speed * h.up.speed) * (op ? HERO_OP.speed : 1);
  out.maxHp = HERO.hp * (1 + HERO.per.hp * h.up.hp) * (1 + 0.03 * Math.max(0, s.wave - 1)) * (op ? HERO_OP.hp : 1) * s.mods.heroHp;
  out.cdMul = op ? HERO_OP.cd : 1;
  out.respawn = HERO.respawn * (op ? HERO_OP.respawn / HERO.respawn : 1) * s.mods.heroRespawn;
  out.ultDmg = HERO.ult.dmg * waveP * (1 + HERO.per.dmg * h.up.dmg) * (op ? HERO_OP.dmg : 1) * s.mods.heroDmg;
  return out;
}

export function spendPoint(s, stat) {
  const h = s.hero;
  if (h.points <= 0 || !(stat in h.up)) return false;
  if (h.up[stat] >= HERO.statCap[stat]) return false;
  const before = heroStats(s, s.hst).maxHp;
  h.up[stat]++;
  h.points--;
  if (stat === 'hp') { const after = heroStats(s, s.hst).maxHp; h.hp += after - before; }
  return true;
}

export function autoSpend(s) {
  const h = s.hero;
  const order = ['dmg', 'rate', 'hp', 'dmg', 'speed', 'dmg', 'hp', 'rate'];
  let guard = 0;
  while (h.points > 0 && guard++ < 40) {
    const stat = order[(h.level + guard) % order.length];
    if (!spendPoint(s, stat)) { if (!spendPoint(s, 'dmg')) break; }
  }
}

function solidAt(s, tx, ty) {
  const { w, h } = s.map;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
  const i = ty * w + tx;
  return !WALKABLE[s.map.tiles[i]] || s.blocked[i] === 1;
}

export function heroCollides(s, x, y) {
  const r = HERO.radius;
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(s, tx, ty)) return true;
  return false;
}

// Does the hero's body overlap tile i? (used to refuse building on top of the hero)
export function heroOnTile(s, i) {
  const h = s.hero;
  if (!h.deployed || h.downT > 0) return false;
  const tx = i % s.map.w, ty = (i / s.map.w) | 0;
  const r = HERO.radius;
  return h.x + r > tx && h.x - r < tx + 1 && h.y + r > ty && h.y - r < ty + 1;
}

function moveBy(s, dx, dy) {
  const h = s.hero;
  // axis-separated moves give sliding along walls
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (sx && !heroCollides(s, h.x + sx, h.y)) h.x += sx;
    if (sy && !heroCollides(s, h.x, h.y + sy)) h.y += sy;
  }
}

// If a building or bad state put the hero inside something solid, move it to the nearest free tile.
function unstick(s) {
  const h = s.hero;
  if (!heroCollides(s, h.x, h.y)) return;
  const { w, h: hh } = s.map;
  const cx = h.x | 0, cy = h.y | 0;
  for (let r = 0; r < Math.max(w, hh); r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = cx + dx + 0.5, y = cy + dy + 0.5;
      if (!heroCollides(s, x, y)) { h.x = x; h.y = y; return; }
    }
  }
  placeAtCore(s);
}

function placeAtCore(s) {
  const h = s.hero;
  h.x = (s.map.core % s.map.w) + 0.5;
  h.y = ((s.map.core / s.map.w) | 0) + 0.5;
}

export function deployHero(s) {
  const h = s.hero;
  if (!h.unlocked || h.deployed) return false;
  h.deployed = true;
  placeAtCore(s);
  h.hp = heroStats(s, s.hst).maxHp;
  h.iT = 1.5;
  s.events.push('herodeploy');
  return true;
}

export function heroDash(s) {
  const h = s.hero;
  if (!h.deployed || h.downT > 0 || h.dashCd > 0) return false;
  const st = heroStats(s, s.hst);
  let dx = s.hin.mx, dy = s.hin.my;
  let m = Math.hypot(dx, dy);
  if (m < 0.2) { dx = Math.cos(h.angle); dy = Math.sin(h.angle); m = 1; }
  h.dvx = dx / m * HERO.dash.dist / HERO.dash.dur;
  h.dvy = dy / m * HERO.dash.dist / HERO.dash.dur;
  h.dashT = HERO.dash.dur;
  h.iT = Math.max(h.iT, HERO.dash.iframes);
  h.dashCd = HERO.dash.cd * st.cdMul;
  fx(s, 'pulse', h.x, h.y, 0, 0, 0.5, 0x9fe8ff);
  s.sfx.dash++;
  return true;
}

export function heroUlt(s) {
  const h = s.hero;
  if (!h.deployed || h.downT > 0 || h.ultCd > 0) return false;
  const st = heroStats(s, s.hst);
  const buf = s.qbuf2;
  const n = query(s, h.x, h.y, HERO.ult.r, buf);
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    damage(s, e, st.ultDmg, 'shock', h, F_SPLASH, 3);
    applyStun(e, HERO.ult.stun);
  }
  h.ultCd = HERO.ult.cd * st.cdMul * s.mods.cooldown;
  h.iT = Math.max(h.iT, 0.6);
  fx(s, 'nova', h.x, h.y, 0, 0, HERO.ult.r, 0xc8a2ff);
  fx(s, 'shake', h.x, h.y, 0, 0, 0.6);
  s.sfx.boom++;
  return true;
}

export function hurtHero(s, amt) {
  const h = s.hero;
  if (!h.deployed || h.downT > 0 || h.iT > 0) return;
  h.hp -= amt;
  h.regenDelay = HERO.regenDelay;
  h.flash = 0.15;
  if (h.hp <= 0) {
    h.hp = 0;
    const st = heroStats(s, s.hst);
    h.downT = st.respawn;
    h.dashT = 0;
    fx(s, 'boom', h.x, h.y, 0, 0, 0.9, 0x7fd8ff);
    fx(s, 'shake', h.x, h.y, 0, 0, 0.4);
    s.events.push('herodown');
    s.sfx.bad++;
  }
}

function canHit(e) {
  return e.alive && e.hp > 0 && e.burrowT <= 0 && (!e.stealth || e.revealT > 0);
}

function nearestTarget(s, x, y, r) {
  const buf = s.qbuf;
  const n = query(s, x, y, r, buf);
  let best = null, bd = 1e9;
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    if (!canHit(e)) continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

// Hero hit with synergies.
export function heroHit(s, e, amt, dtype, wst) {
  const h = s.hero;
  damage(s, e, amt, dtype, h, 0, 2);
  if (wst) applyOnHit(s, e, wst, h);
  if (s.mods.heroMark > 0) e.heroMarkT = 3;
  if (s.mods.heroRod > 0) {
    const buf = s.qbuf4;
    const n = query(s, e.x, e.y, 1.6, buf);
    let c = 0;
    for (let i = 0; i < n && c < 2; i++) {
      const o = buf[i];
      if (o === e || !canHit(o)) continue;
      damage(s, o, amt * s.mods.heroRod, 'shock', h, 0, 2);
      fx(s, 'beam', e.x, e.y, o.x, o.y, 0.6, 0xc8a2ff, 0.08);
      c++;
    }
  }
}

function fireWeapon(s, st) {
  const h = s.hero;
  const W = st.weapon;
  const a = h.angle;
  const ca = Math.cos(a), sa = Math.sin(a);
  const mx = h.x + ca * 0.35, my = h.y + sa * 0.35;
  h.flash = 0.06;
  fx(s, 'muzzle', mx, my, ca, sa, 0.3, DCOL[W.dtype]);
  switch (W.kind) {
    case 'shot': {
      for (let i = 0; i < W.pellets; i++) {
        const off = W.pellets > 1 ? (i / (W.pellets - 1) - 0.5) * W.spread : (s.rng.next() - 0.5) * W.spread;
        const aa = a + off;
        const p = newProj(s);
        p.kind = 'hshot'; p.x = mx; p.y = my; p.z = 0.45;
        p.vx = Math.cos(aa) * W.speed; p.vy = Math.sin(aa) * W.speed;
        p.range = W.range; p.dmg = st.dmg; p.dtype = W.dtype; p.src = h; p.color = W.pellets > 1 ? 0xffd080 : 0x9ff0ff;
      }
      s.sfx.hshot++;
      break;
    }
    case 'grenade': {
      const p = newProj(s);
      p.kind = 'hgren'; p.x = mx; p.y = my; p.z = 0.5;
      p.vx = ca * W.speed; p.vy = sa * W.speed; p.range = W.range; p.dmg = st.dmg; p.dtype = W.dtype;
      p.splash = W.splash; p.src = h; p.color = 0xffb050;
      s.sfx.hshot++;
      break;
    }
    case 'rail': {
      const ex = h.x + ca * W.range, ey = h.y + sa * W.range;
      const list = s.enemies;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!canHit(e)) continue;
        const px = e.x - h.x, py = e.y - h.y;
        const t = px * ca + py * sa;
        if (t < 0 || t > W.range) continue;
        const ox = px - ca * t, oy = py - sa * t;
        if (ox * ox + oy * oy < 0.16 + e.size * 0.1) heroHit(s, e, st.dmg, W.dtype, null);
      }
      fx(s, 'beam', mx, my, ex, ey, 1.2, 0xffe07a, 0.18);
      fx(s, 'shake', h.x, h.y, 0, 0, 0.12);
      s.sfx.rail++;
      break;
    }
    case 'flame': {
      const buf = s.qbuf2;
      const n = query(s, h.x, h.y, W.range, buf);
      for (let i = 0; i < n; i++) {
        const e = buf[i];
        if (e.burrowT > 0) continue;
        let da = Math.atan2(e.y - h.y, e.x - h.x) - a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) > W.cone / 2) continue;
        heroHit(s, e, st.dmg, W.dtype, W);
      }
      if ((s.tick & 1) === 0) fx(s, 'flame', h.x, h.y, a, W.range, W.cone, 0xff7a2f);
      s.sfx.flame++;
      break;
    }
    case 'arc': {
      let e = nearestInCone(s, h.x, h.y, W.range, a, 0.9);
      if (!e) break;
      let px = mx, py = my, d = st.dmg;
      const hit = s.chainHit; let hn = 0;
      for (let j = 0; j <= W.jumps && e; j++) {
        heroHit(s, e, d, W.dtype, null);
        fx(s, 'beam', px, py, e.x, e.y, 0.8, 0xc8a2ff, 0.1);
        hit[hn++] = e; px = e.x; py = e.y; d *= 0.85;
        e = chainNext(s, e, W.jumpRange, hit, hn);
      }
      s.sfx.zap++;
      break;
    }
  }
}

function nearestInCone(s, x, y, r, a, cone) {
  const buf = s.qbuf;
  const n = query(s, x, y, r, buf);
  let best = null, bd = 1e9;
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    if (!canHit(e)) continue;
    let da = Math.atan2(e.y - y, e.x - x) - a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > cone) continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

export function chainNext(s, from, r, hit, hn) {
  const buf = s.qbuf;
  const n = query(s, from.x, from.y, r, buf);
  let best = null, bd = 1e9;
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    if (!canHit(e)) continue;
    let used = false;
    for (let k = 0; k < hn; k++) if (hit[k] === e) { used = true; break; }
    if (used) continue;
    const dx = e.x - from.x, dy = e.y - from.y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

export function updateHero(s, dt) {
  const h = s.hero;
  if (!h.deployed) return;
  if (h.flash > 0) h.flash -= dt;
  if (h.dashCd > 0) h.dashCd -= dt;
  if (h.ultCd > 0) h.ultCd -= dt;
  if (h.downT > 0) {
    h.downT -= dt;
    if (h.downT <= 0) {
      h.downT = 0;
      placeAtCore(s);
      unstick(s);
      h.hp = heroStats(s, s.hst).maxHp;
      h.iT = 2;
      fx(s, 'pulse', h.x, h.y, 0, 0, 0.8, 0x7fd8ff);
      s.events.push('herorespawn');
    }
    return;
  }
  const st = heroStats(s, s.hst);
  if (h.iT > 0) h.iT -= dt;
  if (h.hp > st.maxHp) h.hp = st.maxHp;
  const inp = s.hin;
  const controlled = inp.control;

  // movement
  const mud = s.map.tiles[(h.y | 0) * s.map.w + (h.x | 0)] === 6 ? 0.6 : 1;
  if (h.dashT > 0) {
    const d = Math.min(dt, h.dashT);
    moveBy(s, h.dvx * d, h.dvy * d);
    h.dashT -= dt;
    h.moving = true;
  } else if (controlled) {
    let mx = inp.mx, my = inp.my;
    const m = Math.hypot(mx, my);
    if (m > 1) { mx /= m; my /= m; }
    if (m > 0.08) {
      moveBy(s, mx * st.speed * mud * dt, my * st.speed * mud * dt);
      h.moveA = Math.atan2(my, mx);
      h.moving = true;
    } else h.moving = false;
  } else h.moving = false;
  unstick(s);
  // stay inside the map (collision already enforces it; belt and braces)
  const r = 0.3;
  if (h.x < r) h.x = r; if (h.y < r) h.y = r;
  if (h.x > s.map.w - r) h.x = s.map.w - r; if (h.y > s.map.h - r) h.y = s.map.h - r;

  // aim and fire
  h.cd -= dt;
  h.firing = false;
  let aimHeld = controlled && inp.aim && Math.hypot(inp.ax, inp.ay) > 0.25;
  if (aimHeld) {
    h.angle = Math.atan2(inp.ay, inp.ax);
    h.firing = true;
  } else {
    const t = nearestTarget(s, h.x, h.y, st.range);
    if (t) {
      h.angle = Math.atan2(t.y - h.y, t.x - h.x);
      h.firing = true;
    } else if (h.moving) h.angle = h.moveA;
  }
  if (h.firing && h.cd <= 0) {
    fireWeapon(s, st);
    h.cd += 1 / st.rate;
    if (h.cd < 0) h.cd = 0;
  }
  if (h.cd < -0.1) h.cd = 0;

  // contact damage from enemies
  h.contactCd -= dt;
  if (h.contactCd <= 0) {
    h.contactCd = 0.25;
    const buf = s.qbuf2;
    const n = query(s, h.x, h.y, 0.75, buf);
    let dmg = 0;
    for (let i = 0; i < n; i++) {
      const e = buf[i];
      if (e.burrowT > 0) continue;
      const def = ENEMIES[e.type];
      const reach = 0.25 + e.size * 0.5;
      const dx = e.x - h.x, dy = e.y - h.y;
      if (dx * dx + dy * dy > reach * reach) continue;
      dmg += (def.boss ? 70 : 6 + 5 * def.threat) * (1 + 0.03 * (e.wave - 1));
    }
    if (dmg > 0) hurtHero(s, dmg * 0.25);
  }

  // regen
  if (h.regenDelay > 0) h.regenDelay -= dt;
  else if (h.hp < st.maxHp) h.hp = Math.min(st.maxHp, h.hp + st.maxHp * HERO.regen * dt);

  // field engineer: clear jams, mark nearby towers for bonus damage
  if (s.mods.heroEng > 0 || s.mods.heroRally > 0) {
    for (let i = 0; i < s.towers.length; i++) {
      const t = s.towers[i];
      const dx = t.x - h.x, dy = t.y - h.y;
      const d2 = dx * dx + dy * dy;
      if (s.mods.heroEng > 0) {
        if (d2 < 1.6 * 1.6 && t.jamT > 0) { t.jamT = 0; fx(s, 'heal', t.x, t.y, 0, 0, 0.4, 0x7fd8ff); }
        t.engBoost = d2 < 2.5 * 2.5 ? s.mods.heroEng : 0;
      }
    }
  }
}

// Enemy shots at the hero (projectile kind 'eshot') are moved by the sim's projectile loop.
export function enemyShoot(s, e, def) {
  const h = s.hero;
  const p = newProj(s);
  p.kind = 'eshot'; p.x = e.x; p.y = e.y; p.z = e.flying ? 1.1 : 0.5;
  const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1;
  p.vx = dx / d * 5; p.vy = dy / d * 5; p.range = def.shoot.r + 1.5;
  p.dmg = def.shoot.dmg * (1 + 0.03 * (e.wave - 1)); p.color = 0xff5a7a;
}

export function heroGrenadeBurst(s, p) {
  addBlast(s, p.x, p.y, p.splash, p.dmg, p.dtype, s.hero, false);
}
