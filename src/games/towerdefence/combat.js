// Shared combat helpers: spatial queries, damage, statuses, kills, spawning, effects.
// Pure module (no DOM, no three.js). All hot paths avoid allocation: enemies, projectiles,
// zones and blasts are pooled; queries write into preallocated buffers.
import { ENEMIES, DIFFICULTY, OP } from './data.js';
import { INF, nextStep, dirBetween } from './path.js';

export const F_DOT = 1, F_SPLASH = 2;
export const QCAP = 2048;
export const FX_CAP = 700;

for (const k in ENEMIES) ENEMIES[k].colN = parseInt(ENEMIES[k].color.slice(1), 16);

export const DCOL = { phys: 0xf2e6c8, pierce: 0xffe07a, fire: 0xff7a2f, cold: 0x8fe0ff, shock: 0xc8a2ff, poison: 0x8be05a };

// ---------- effects -----------------------------------------------------------------------
// fx kinds: beam, boom, hit, pulse, flame, gold, jam, heal, death, muzzle, shake, nova, spawn, leak, text
export function makeFxRing() {
  const a = new Array(FX_CAP);
  for (let i = 0; i < FX_CAP; i++) a[i] = { k: '', x: 0, y: 0, x2: 0, y2: 0, r: 0, c: 0, a: 0 };
  return a;
}
export function fx(s, k, x, y, x2 = 0, y2 = 0, r = 0, c = 0xffffff, a = 0) {
  if (s.fxN >= FX_CAP) return;
  const o = s.fx[s.fxN++];
  o.k = k; o.x = x; o.y = y; o.x2 = x2; o.y2 = y2; o.r = r; o.c = c; o.a = a;
}

// ---------- spatial buckets -----------------------------------------------------------------
export function rebuildBuckets(s) {
  const { w, h } = s.map;
  const head = s.bhead;
  head.fill(null);
  const list = s.enemies;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.alive) continue;
    let tx = e.x | 0, ty = e.y | 0;
    if (tx < 0) tx = 0; else if (tx >= w) tx = w - 1;
    if (ty < 0) ty = 0; else if (ty >= h) ty = h - 1;
    const b = ty * w + tx;
    e.bnext = head[b];
    head[b] = e;
  }
}

// Fill buf with live enemies within r of (x, y). mode: 0 any, 1 ground only, 2 air only. Returns count.
export function query(s, x, y, r, buf, mode = 0) {
  const { w, h } = s.map;
  const r2 = r * r;
  let x0 = Math.floor(x - r - 0.5), x1 = Math.floor(x + r + 0.5);
  let y0 = Math.floor(y - r - 0.5), y1 = Math.floor(y + r + 0.5);
  if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x1 >= w) x1 = w - 1; if (y1 >= h) y1 = h - 1;
  let n = 0;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      let e = s.bhead[ty * w + tx];
      while (e) {
        if (e.alive && e.hp > 0) {
          if (mode === 0 || (mode === 1 && !e.flying) || (mode === 2 && e.flying)) {
            const dx = e.x - x, dy = e.y - y;
            if (dx * dx + dy * dy <= r2 && n < QCAP) buf[n++] = e;
          }
        }
        e = e.bnext;
      }
    }
  }
  return n;
}

// ---------- spawning --------------------------------------------------------------------------
export function enemyScale(s, wave) {
  const d = DIFFICULTY[s.difficulty] || DIFFICULTY.normal;
  return s.hpScaleFn(wave, s.mode) * d.hp * s.mods.enemyHp;
}

export function spawnEnemy(s, type, x, y, tile, wave, hpScaleV) {
  const def = ENEMIES[type];
  let e = s.epool.pop();
  if (!e) e = {};
  const d = DIFFICULTY[s.difficulty] || DIFFICULTY.normal;
  e.uid = s.uid++;
  e.type = type; e.alive = true; e.wave = wave;
  e.x = x; e.y = y; e.tile = tile; e.next = -1; e.lastDir = -1; e.pref = e.uid & 3;
  e.flying = !!def.flying;
  e.boss = !!def.boss;
  e.maxHp = Math.max(1, def.hp * hpScaleV);
  e.hp = e.maxHp;
  e.maxShield = (def.shield || 0) * hpScaleV;
  e.shield = e.maxShield; e.shieldDelay = 0;
  e.armor = (def.armor || 0) + (def.armor ? s.armorBonusFn(wave) : 0) + s.mods.enemyArmor;
  e.speed = def.speed * d.speed * s.speedScaleFn(wave) * s.mods.enemySpeed;
  e.slowResist = def.slowResist || 0;
  e.size = def.size;
  e.slow = 0; e.slowT = 0; e.stunT = 0; e.stunImm = 0; e.frozenT = 0; e.chill = 0; e.chillT = 0; e.freezeImm = 0;
  e.burn = 0; e.burnT = 0; e.burnSrc = null;
  e.poison = 0; e.poisonStacks = 0; e.poisonT = 0; e.poisonSrc = null; e.plague = 0;
  e.oilT = 0; e.shred = 0; e.shredT = 0; e.corrode = 0; e.corrodeT = 0;
  e.mark = 0; e.markT = 0; e.heroMarkT = 0;
  e.stealth = !!def.stealth; e.revealT = 0;
  e.burrowT = 0; e.burrowCd = def.burrow ? def.burrow.every * (0.5 + 0.5 * s.rng.next()) : 0;
  e.sapCd = def.sap ? 1 + s.rng.next() * 2 : 0;
  e.healCd = def.heal ? def.heal.every : 0;
  e.spawnCd = def.spawn ? def.spawn.every : 0;
  e.stompCd = def.stomp ? def.stomp.every * 0.6 : 0;
  e.blinkCd = def.blink ? def.blink.every : 0;
  e.shootCd = def.shoot ? def.shoot.every * (0.5 + s.rng.next()) : 0;
  e.summonIdx = 0;
  e.vx = 0; e.vy = 0; e.prog = 0; e.age = 0; e.bnext = null; e.hitT = 0; e.stuckT = 0;
  e.scale = hpScaleV;
  if (!e.flying) {
    e.next = nextStep(s.map, s.dist, tile, -1, e.pref);
    if (e.next < 0) e.next = tile;
  }
  s.enemies.push(e);
  s.waveAlive[wave] = (s.waveAlive[wave] || 0) + 1;
  return e;
}

// ---------- statuses ------------------------------------------------------------------------
export function applySlow(s, e, f, dur) {
  f = (f + s.mods.slowBonus) * (1 - e.slowResist);
  if (e.boss) f *= 0.6;
  if (f > 0.8) f = 0.8;
  if (f >= e.slow || e.slowT <= 0) { e.slow = f; e.slowT = dur; }
  else if (e.slowT < dur * 0.5) e.slowT = dur * 0.5;
}
// Stuns grant a short immunity afterwards so nothing can be stun-locked forever (bosses longer).
export function applyStun(e, d) {
  if (e.stunImm > 0) return;
  if (e.boss) d *= 0.3;
  if (e.stunT < d) e.stunT = d;
  e.stunImm = e.stunT + (e.boss ? 2.5 : 0.6);
}
export function applyPoison(e, dps, dur, max, src, plague) {
  if (dps > e.poison) e.poison = dps;
  if (e.poisonStacks < max) e.poisonStacks++;
  e.poisonT = dur;
  e.poisonSrc = src;
  if (plague > e.plague) e.plague = plague;
}
export function applyBurn(s, e, dps, dur, src) {
  if (dps > e.burn) e.burn = dps;
  dur *= s.mods.burnDur;
  if (e.burnT < dur) e.burnT = dur;
  e.burnSrc = src;
}

// On-hit effects shared by towers (st = tower stats) and hero weapons.
export function applyOnHit(s, e, st, src) {
  if (!e.alive || e.hp <= 0) return;
  if (st.slow) applySlow(s, e, st.slow, st.slowDur || 1.5);
  if (st.dtype === 'cold') { e.chill = Math.min(10, e.chill + 1); e.chillT = 2.5; }
  if (st.freezeAt && e.chill >= st.freezeAt && e.freezeImm <= 0) {
    const d = st.freezeDur * (e.boss ? 0.3 : 1);
    applyStun(e, st.freezeDur);
    e.frozenT = d; e.chill = 0; e.freezeImm = 3;
    fx(s, 'pulse', e.x, e.y, 0, 0, 0.6, 0x9fe8ff);
    s.sfx.freeze++;
  }
  if (st.poison) applyPoison(e, st.poison, st.poisonDur || 4, st.poisonMax || 5, src, st.plague || 0);
  if (st.oil) { if (e.oilT < st.oil) e.oilT = st.oil; }
  if (st.shred) { e.shred = Math.min(st.shredMax || 10, e.shred + st.shred); e.shredT = 6; }
  if (st.corrode) { if (st.corrode > e.corrode) e.corrode = st.corrode; e.corrodeT = 4; }
  if (st.stun) applyStun(e, st.stun);
  if (st.burn) applyBurn(s, e, st.burn, st.burnDur || 2, src);
}

// ---------- damage ---------------------------------------------------------------------------
// Returns damage dealt to health+shield. src: tower object, the hero object, or null.
export function damage(s, e, amt, dtype, src, flags = 0, shieldMul = 2) {
  if (!e.alive || e.hp <= 0) return 0;
  if (e.burrowT > 0 && !(flags & F_DOT)) return 0;
  const def = ENEMIES[e.type];
  const mods = s.mods;
  let m = mods.dmg[dtype] * mods.dmgAll;
  if (def.resist) { const r = def.resist[dtype]; if (r) m *= r; }
  if (e.markT > 0) m *= 1 + e.mark;
  if (e.corrodeT > 0) m *= 1 + e.corrode;
  if (e.heroMarkT > 0 && src !== s.hero) m *= 1 + mods.heroMark;
  if (src && src.engBoost > 0) m *= 1 + src.engBoost;
  if (dtype === 'phys' || dtype === 'pierce') {
    if (e.frozenT > 0) m *= 1 + mods.shatter * 1.6;
    else if (e.slowT > 0 && e.chillT > 0) m *= 1 + mods.shatter;
  }
  if (dtype === 'fire' && e.oilT > 0) m *= 2;
  amt *= m;
  // armour
  const armor = e.armor - e.shred;
  if (armor > 0) {
    if (flags & F_DOT) {
      if (dtype !== 'poison') amt *= 1 - Math.min(0.6, armor * 0.04);
    } else if (dtype === 'phys' || dtype === 'fire' || dtype === 'cold') {
      amt = Math.max(amt * 0.2, amt - armor);
    } else if (dtype === 'shock') {
      amt = Math.max(amt * 0.3, amt - armor * 0.5);
    }
  }
  let dealt = 0;
  // shield
  if (e.shield > 0 && dtype !== 'poison') {
    const sm = dtype === 'shock' ? shieldMul : 1;
    const want = amt * sm;
    const absorb = want < e.shield ? want : e.shield;
    e.shield -= absorb;
    amt -= absorb / sm;
    dealt += absorb;
    e.shieldDelay = 2.5;
  }
  if (amt > 0) { dealt += amt < e.hp ? amt : e.hp; e.hp -= amt; }
  e.hitT = 0.12;
  if (e.stealth && !(flags & F_DOT) && e.revealT < 0.8) e.revealT = 0.8;
  if (src) src.dealt += dealt;
  s.stats.dmg += dealt;
  if (e.hp <= 0) kill(s, e, src);
  return dealt;
}

export function killGold(s, e) {
  const def = ENEMIES[e.type];
  const d = DIFFICULTY[s.difficulty] || DIFFICULTY.normal;
  let g = def.bounty * (1 + 0.02 * (e.wave - 1)) * d.bounty * s.mods.killGoldMul;
  if (s.mode === 'op') g *= OP.bounty;
  if (def.boss) g *= s.mods.bossGold;
  if (s.rushT > 0) g *= 2;
  return Math.max(1, Math.round(g + s.mods.killGold));
}

export function kill(s, e, src) {
  if (!e.alive) return;
  e.alive = false;
  e.hp = 0;
  const def = ENEMIES[e.type];
  let g = killGold(s, e);
  // prospector mines
  for (let i = 0; i < s.mines.length; i++) {
    const t = s.mines[i];
    if (!t.st.killBonus) continue;
    const dx = t.x - e.x, dy = t.y - e.y;
    if (dx * dx + dy * dy <= t.st.range * t.st.range) g += t.st.killBonus * (s.mode === 'op' ? 3 : 1);
  }
  const hero = s.hero;
  if (src === hero) {
    g += s.mods.heroGold;
    hero.kills++;
    grantXp(s, 2 + def.threat * 2);
  } else if (hero.deployed) {
    grantXp(s, (2 + def.threat * 2) * 0.15);
  }
  if (src && src !== hero) src.kills++;
  s.gold += g;
  s.stats.goldEarned += g;
  s.stats.kills++;
  if (def.boss) s.stats.bossKills++;
  s.waveAlive[e.wave]--;
  fx(s, 'death', e.x, e.y, 0, 0, e.size, def.colN, e.flying ? 1 : 0);
  if (g >= 5 || def.boss) fx(s, 'gold', e.x, e.y, 0, 0, 0, 0xf0b44c, g);
  s.sfx.kill++;
  if (def.boss) { fx(s, 'shake', e.x, e.y, 0, 0, 0.5); s.sfx.boom++; }
  // splitting
  if (def.split) {
    for (let i = 0; i < def.split.n; i++) {
      const c = spawnEnemy(s, def.split.type, e.x + (i - 1) * 0.15, e.y + (s.rng.next() - 0.5) * 0.2, e.tile, e.wave, e.scale);
      if (!c.flying) { c.next = e.next >= 0 ? e.next : c.next; c.lastDir = e.lastDir; }
    }
  }
  // plague: poison jumps to neighbours
  if (e.poisonT > 0 && e.plague > 0) {
    const buf = s.qbuf3;
    const n = query(s, e.x, e.y, e.plague, buf);
    for (let i = 0; i < n; i++) {
      const o = buf[i];
      if (o === e) continue;
      applyPoison(o, e.poison, 4, 7, e.poisonSrc, e.plague);
      if (o.poisonStacks < e.poisonStacks) o.poisonStacks = e.poisonStacks;
    }
    fx(s, 'pulse', e.x, e.y, 0, 0, e.plague, 0x8be05a);
  }
  // volatile ore: burning enemies explode
  if (s.mods.chainReaction > 0 && e.burnT > 0 && src !== s.srcVolatile) {
    addBlast(s, e.x, e.y, 1.1, e.maxHp * s.mods.chainReaction, 'fire', s.srcVolatile);
  }
}

function grantXp(s, xp) {
  const h = s.hero;
  if (!h.deployed) return;
  h.xp += xp;
  let guard = 0;
  while (h.xp >= h.need && guard++ < 50) {
    h.xp -= h.need;
    h.level++;
    h.points++;
    h.need = s.heroXpNeed(h.level);
    s.events.push('herolevel');
    if (h.autoSpend) s.heroAutoSpend(s);
  }
}

// ---------- blasts (deferred area damage, avoids recursion) -----------------------------------
export function addBlast(s, x, y, r, dmg, dtype, src, ground = false) {
  let b = s.bpool.pop();
  if (!b) b = {};
  b.x = x; b.y = y; b.r = r; b.dmg = dmg; b.dtype = dtype; b.src = src; b.ground = ground;
  s.blasts.push(b);
}

export function processBlasts(s) {
  const list = s.blasts;
  const n0 = list.length;
  if (!n0) return;
  const buf = s.qbuf2;
  for (let i = 0; i < n0; i++) {
    const b = list[i];
    const n = query(s, b.x, b.y, b.r, buf, b.ground ? 1 : 0);
    for (let j = 0; j < n; j++) damage(s, buf[j], b.dmg, b.dtype, b.src, F_SPLASH);
    fx(s, 'boom', b.x, b.y, 0, 0, b.r, DCOL[b.dtype] || 0xffaa55);
    s.sfx.boom++;
  }
  // keep blasts added during processing for next step
  for (let i = 0; i < n0; i++) s.bpool.push(list[i]);
  list.splice(0, n0);
}

// ---------- splash -------------------------------------------------------------------------
export function splash(s, x, y, r, dmg, dtype, src, st, groundOnly) {
  const buf = s.qbuf2;
  const n = query(s, x, y, r, buf, groundOnly ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const e = buf[i];
    const dx = e.x - x, dy = e.y - y;
    const falloff = 1 - 0.35 * Math.sqrt(dx * dx + dy * dy) / r;
    damage(s, e, dmg * falloff, dtype, src, F_SPLASH);
    if (st) applyOnHit(s, e, st, src);
  }
  return n;
}

// ---------- projectiles ----------------------------------------------------------------------
export function newProj(s) {
  let p = s.ppool.pop();
  if (!p) p = {};
  p.alive = true; p.kind = ''; p.x = 0; p.y = 0; p.z = 0.5; p.sx = 0; p.sy = 0; p.tx = 0; p.ty = 0;
  p.vx = 0; p.vy = 0; p.target = null; p.tuid = 0; p.speed = 8; p.dmg = 0; p.dtype = 'phys';
  p.src = null; p.st = null; p.t = 0; p.T = 1; p.range = 0; p.splash = 0; p.color = 0xffffff; p.crit = false;
  s.proj.push(p);
  return p;
}

// ---------- ground movement helpers ------------------------------------------------------------
// Advance a ground enemy along the flow field. Returns true if it reached the core.
export function moveGround(s, e, step) {
  const map = s.map;
  const w = map.w;
  let guard = 4;
  while (step > 0 && guard-- > 0) {
    let nt = e.next;
    if (nt < 0 || s.dist[nt] >= INF) {
      // re-route from the current tile
      nt = nextStep(map, s.dist, e.tile, e.lastDir, e.pref);
      if (nt < 0) {
        // trapped (should be impossible): walk straight to the core as a last resort
        e.stuckT += step;
        const cx = (map.core % w) + 0.5, cy = ((map.core / w) | 0) + 0.5;
        const dx = cx - e.x, dy = cy - e.y, d = Math.hypot(dx, dy);
        if (d < step) return true;
        e.x += dx / d * step; e.y += dy / d * step;
        e.vx = dx / d; e.vy = dy / d;
        e.tile = ((e.y | 0) * w) + (e.x | 0);
        return false;
      }
      e.next = nt;
    }
    const tx = (nt % w) + 0.5, ty = ((nt / w) | 0) + 0.5;
    const dx = tx - e.x, dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    if (d <= step) {
      e.x = tx; e.y = ty;
      step -= d;
      e.lastDir = dirBetween(map, e.tile, nt);
      e.tile = nt;
      if (nt === map.core) return true;
      const nn = nextStep(map, s.dist, nt, e.lastDir, e.pref);
      e.next = nn;
      if (d > 0) { e.vx = dx / d; e.vy = dy / d; }
    } else {
      e.x += dx / d * step; e.y += dy / d * step;
      e.vx = dx / d; e.vy = dy / d;
      step = 0;
    }
  }
  return false;
}

