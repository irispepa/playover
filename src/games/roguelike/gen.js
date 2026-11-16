// Procedural floor generation. Pure: no DOM, no three.js.
// generateFloor(seed, floor) -> a plain description of one dungeon floor.
import { makeRng, hashSeed } from '../../shell/rng.js';
import { T, biomeFor, biomeIndex, tierFor, isBossFloor, isShopFloor, ENEMIES, ELITES, SHRINES, BIOMES } from './data.js';

export function floorSeed(seed, floor) { return hashSeed(`deepvault|${seed}|${floor}`); }

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function makeMap(w, h) {
  return { w, h, tiles: new Uint8Array(w * h), corr: new Uint8Array(w * h), rooms: [] };
}

function inside(m, x, y) { return x >= 0 && y >= 0 && x < m.w && y < m.h; }
function get(m, x, y) { return inside(m, x, y) ? m.tiles[y * m.w + x] : T.WALL; }
function set(m, x, y, t) { if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1) m.tiles[y * m.w + x] = t; }

function carveRoom(m, rng, r, organic) {
  const cx = r.x + (r.w - 1) / 2, cy = r.y + (r.h - 1) / 2;
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (organic) {
        const nx = (x - cx) / (r.w / 2 + 0.3), ny = (y - cy) / (r.h / 2 + 0.3);
        if (nx * nx + ny * ny > 1 + rng.float(-0.12, 0.08)) continue;
      }
      set(m, x, y, T.FLOOR);
    }
  }
  r.cx = Math.floor(r.x + r.w / 2); r.cy = Math.floor(r.y + r.h / 2);
  set(m, r.cx, r.cy, T.FLOOR);
}

function addPillars(m, r) {
  if (r.w < 8 || r.h < 8) return;
  const px = [r.x + 2, r.x + r.w - 3], py = [r.y + 2, r.y + r.h - 3];
  for (const x of px) for (const y of py) set(m, x, y, T.WALL);
}

function carveLine(m, x0, y0, x1, y1, wide) {
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
  let x = x0, y = y0;
  for (let guard = 0; guard < 400; guard++) {
    for (let k = 0; k < (wide ? 2 : 1); k++) {
      const tx = x + (dy !== 0 ? k : 0), ty = y + (dx !== 0 ? k : 0);
      if (get(m, tx, ty) === T.WALL) { set(m, tx, ty, T.FLOOR); if (inside(m, tx, ty)) m.corr[ty * m.w + tx] = 1; }
    }
    if (x === x1 && y === y1) break;
    x += dx; y += dy;
  }
}

function carveCorridor(m, rng, a, b, wide) {
  if (rng.chance(0.5)) { carveLine(m, a.cx, a.cy, b.cx, a.cy, wide); carveLine(m, b.cx, a.cy, b.cx, b.cy, wide); }
  else { carveLine(m, a.cx, a.cy, a.cx, b.cy, wide); carveLine(m, a.cx, b.cy, b.cx, b.cy, wide); }
}

function layoutStandard(rng, floor, biome) {
  const W = Math.min(70, 42 + Math.floor(floor / 3) * 2);
  const H = W + 6;
  const m = makeMap(W, H);
  const MIN = 10;
  const leaves = [];
  function split(n, depth) {
    const canH = n.h >= MIN * 2, canV = n.w >= MIN * 2;
    if ((!canH && !canV) || (depth >= 3 && rng.chance(0.18))) { leaves.push(n); return n; }
    let horiz;
    if (canH && canV) {
      const ratio = n.h / n.w;
      horiz = ratio > 1.25 ? true : ratio < 0.8 ? false : rng.chance(0.5);
    } else horiz = canH;
    if (horiz) {
      const cut = rng.int(MIN, n.h - MIN);
      n.a = split({ x: n.x, y: n.y, w: n.w, h: cut }, depth + 1);
      n.b = split({ x: n.x, y: n.y + cut, w: n.w, h: n.h - cut }, depth + 1);
    } else {
      const cut = rng.int(MIN, n.w - MIN);
      n.a = split({ x: n.x, y: n.y, w: cut, h: n.h }, depth + 1);
      n.b = split({ x: n.x + cut, y: n.y, w: n.w - cut, h: n.h }, depth + 1);
    }
    return n;
  }
  const root = split({ x: 1, y: 1, w: W - 2, h: H - 2 }, 0);
  const organicBiome = biome.id === 'caverns' || biome.id === 'fungal';
  const pillarBiome = biome.id === 'crypt' || biome.id === 'forge' || biome.id === 'frozen' || biome.id === 'abyss';
  for (const leaf of leaves) {
    const rw = rng.int(4, Math.min(leaf.w - 2, 12));
    const rh = rng.int(4, Math.min(leaf.h - 2, 11));
    const rx = leaf.x + rng.int(1, leaf.w - rw - 1);
    const ry = leaf.y + rng.int(1, leaf.h - rh - 1);
    const room = { x: rx, y: ry, w: rw, h: rh, kind: 'normal' };
    leaf.room = room;
    const organic = organicBiome && rng.chance(0.7) && rw >= 5 && rh >= 5;
    carveRoom(m, rng, room, organic);
    if (pillarBiome && !organic && rng.chance(0.45)) addPillars(m, room);
    m.rooms.push(room);
  }
  const roomsOf = (n) => (n.room ? [n.room] : [...roomsOf(n.a), ...roomsOf(n.b)]);
  const edges = new Set();
  const edgeKey = (a, b) => (m.rooms.indexOf(a) < m.rooms.indexOf(b) ? `${m.rooms.indexOf(a)}-${m.rooms.indexOf(b)}` : `${m.rooms.indexOf(b)}-${m.rooms.indexOf(a)}`);
  function connect(n) {
    if (n.room) return;
    connect(n.a); connect(n.b);
    const A = roomsOf(n.a), B = roomsOf(n.b);
    let best = null, bd = Infinity;
    for (const a of A) for (const b of B) {
      const d = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
      if (d < bd) { bd = d; best = [a, b]; }
    }
    carveCorridor(m, rng, best[0], best[1], rng.chance(0.3));
    edges.add(edgeKey(best[0], best[1]));
  }
  connect(root);
  // A few extra loops so the floor isn't a pure tree.
  const loops = rng.int(1, 3);
  for (let k = 0; k < loops; k++) {
    const a = rng.pick(m.rooms);
    let best = null, bd = Infinity;
    for (const b of m.rooms) {
      if (b === a || edges.has(edgeKey(a, b))) continue;
      const d = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
      if (d < bd && d < 26) { bd = d; best = b; }
    }
    if (best) { carveCorridor(m, rng, a, best, false); edges.add(edgeKey(a, best)); }
  }
  return m;
}

function layoutBoss(rng, floor) {
  const W = 40, H = 54;
  const m = makeMap(W, H);
  const arena = { x: 9, y: 3, w: 21, h: 17, kind: 'arena' };
  const ante = { x: 15, y: 26, w: 9, h: 7, kind: 'ante' };
  const start = { x: 15, y: 43, w: 9, h: 7, kind: 'start' };
  for (const r of [arena, ante, start]) { carveRoom(m, rng, r, false); m.rooms.push(r); }
  // Arena pillars.
  const pp = [[arena.x + 4, arena.y + 4], [arena.x + arena.w - 6, arena.y + 4], [arena.x + 4, arena.y + arena.h - 6], [arena.x + arena.w - 6, arena.y + arena.h - 6]];
  for (const [x, y] of pp) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(m, x + dx, y + dy, T.WALL);
  const cx = Math.floor(W / 2) - 1;
  carveLine(m, cx, arena.y + arena.h - 1, cx, ante.y, true);
  carveLine(m, cx, ante.y + ante.h - 1, cx, start.y, true);
  m.gate = [[cx, arena.y + arena.h], [cx + 1, arena.y + arena.h]];
  m.arena = arena;
  return m;
}

// Carve a small room off the existing network, reached by a short passage whose first tile becomes `doorTile`.
function tryPocket(m, rng, kind, doorTile, minS, maxS) {
  const W = m.w, H = m.h;
  const cand = [];
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (m.tiles[y * W + x] !== T.FLOOR) continue;
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS4[d];
      if (get(m, x + dx, y + dy) === T.WALL) cand.push(x, y, d);
    }
  }
  if (!cand.length) return null;
  for (let attempt = 0; attempt < 160; attempt++) {
    const k = rng.int(0, cand.length / 3 - 1) * 3;
    const fx = cand[k], fy = cand[k + 1], [dx, dy] = DIRS4[cand[k + 2]];
    const px = -dy, py = dx; // perpendicular
    const len = rng.int(1, 3);
    const rw = rng.int(minS, maxS), rh = rng.int(minS, maxS);
    let rx, ry;
    if (dx === 1) { rx = fx + len + 1; ry = fy - rng.int(0, rh - 1); }
    else if (dx === -1) { rx = fx - len - rw; ry = fy - rng.int(0, rh - 1); }
    else if (dy === 1) { ry = fy + len + 1; rx = fx - rng.int(0, rw - 1); }
    else { ry = fy - len - rh; rx = fx - rng.int(0, rw - 1); }
    if (rx < 2 || ry < 2 || rx + rw > W - 2 || ry + rh > H - 2) continue;
    let ok = true;
    for (let y = ry - 1; y <= ry + rh && ok; y++) for (let x = rx - 1; x <= rx + rw; x++) if (get(m, x, y) !== T.WALL) { ok = false; break; }
    for (let i = 1; i <= len && ok; i++) {
      const tx = fx + dx * i, ty = fy + dy * i;
      if (get(m, tx, ty) !== T.WALL || get(m, tx + px, ty + py) !== T.WALL || get(m, tx - px, ty - py) !== T.WALL) ok = false;
    }
    if (!ok) continue;
    const room = { x: rx, y: ry, w: rw, h: rh, kind };
    carveRoom(m, rng, room, false);
    for (let i = 1; i <= len; i++) set(m, fx + dx * i, fy + dy * i, T.FLOOR);
    set(m, fx + dx, fy + dy, doorTile);
    room.door = { x: fx + dx, y: fy + dy };
    room.entry = { x: fx, y: fy };
    m.rooms.push(room);
    return room;
  }
  return null;
}

function bfsDist(m, sx, sy, passDoors) {
  const W = m.w, H = m.h, dist = new Int32Array(W * H).fill(-1);
  const q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  dist[sy * W + sx] = 0; q[qt++] = sy * W + sx;
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (dist[j] >= 0) continue;
      const t = m.tiles[j];
      const solid = t === T.WALL || t === T.BARRIER || (!passDoors && (t === T.DOOR || t === T.SECRET));
      if (solid) continue;
      dist[j] = dist[i] + 1; q[qt++] = j;
    }
  }
  return dist;
}
export { bfsDist };

function weightedEnemy(rng, biome, floor) {
  const tier = tierFor(floor);
  let list = biome.enemies.filter(([id]) => !(ENEMIES[id].minFloor > floor));
  if (tier > 0 && rng.chance(0.25)) {
    const other = BIOMES[rng.int(0, BIOMES.length - 1)];
    list = other.enemies;
  }
  return rng.weighted(list);
}

export function generateFloor(seed, floor) {
  const rng = makeRng(floorSeed(seed, floor));
  const biome = biomeFor(floor);
  const boss = isBossFloor(floor);
  const shop = !boss && isShopFloor(floor);
  const tier = tierFor(floor);
  const m = boss ? layoutBoss(rng, floor) : layoutStandard(rng, floor, biome);
  const W = m.w, H = m.h;

  // ---- roles
  let startRoom, stairsRoom;
  if (boss) {
    startRoom = m.rooms.find((r) => r.kind === 'start');
    stairsRoom = m.arena;
  } else {
    startRoom = rng.pick(m.rooms);
    startRoom.kind = 'start';
    const d = bfsDist(m, startRoom.cx, startRoom.cy, false);
    let bd = -1;
    for (const r of m.rooms) { const v = d[r.cy * W + r.cx]; if (r !== startRoom && v > bd) { bd = v; stairsRoom = r; } }
    stairsRoom.kind = 'stairs';
    if (shop) {
      const opts = m.rooms.filter((r) => r.kind === 'normal' && r.w >= 6 && r.h >= 5);
      const sr = opts.length ? rng.pick(opts) : null;
      if (sr) sr.kind = 'shop';
    }
  }
  const mainRooms = m.rooms.slice();

  // ---- pockets
  const vault = rng.chance(boss ? 0.6 : 0.75) ? tryPocket(m, rng, 'vault', T.DOOR, 3, 5) : null;
  const secrets = [];
  const nSecret = rng.chance(0.65) ? (rng.chance(0.3) ? 2 : 1) : 0;
  for (let i = 0; i < nSecret; i++) { const s = tryPocket(m, rng, 'secret', T.SECRET, 3, 4); if (s) secrets.push(s); }

  // ---- placement helpers
  const occ = new Uint8Array(W * H);
  const objects = [];
  const spawns = [];
  let oid = 1;
  const isFree = (x, y) => {
    const i = y * W + x;
    if (m.tiles[i] !== T.FLOOR || occ[i]) return false;
    for (const [dx, dy] of DIRS4) { const t = get(m, x + dx, y + dy); if (t === T.DOOR || t === T.SECRET) return false; }
    return true;
  };
  function pickTile(room, tries = 40, wallSide = false) {
    for (let t = 0; t < tries; t++) {
      const x = rng.int(room.x, room.x + room.w - 1), y = rng.int(room.y, room.y + room.h - 1);
      if (!isFree(x, y)) continue;
      if (room.door && Math.abs(x - room.door.x) + Math.abs(y - room.door.y) < 2) continue;
      if (wallSide) {
        let wallN = 0;
        for (const [dx, dy] of DIRS4) if (get(m, x + dx, y + dy) === T.WALL) wallN++;
        if (wallN === 0 && t < tries - 10) continue;
      }
      return [x, y];
    }
    return null;
  }
  function addObj(kind, x, y, extra) {
    occ[y * W + x] = 1;
    const o = { id: oid++, kind, x, y, ...extra };
    objects.push(o);
    return o;
  }

  // ---- stairs
  const stairs = boss ? { x: m.arena.x + 10, y: m.arena.y + 3 } : { x: stairsRoom.cx, y: stairsRoom.cy };
  m.tiles[stairs.y * W + stairs.x] = T.STAIRS;
  occ[stairs.y * W + stairs.x] = 1;
  for (const [dx, dy] of DIRS4) occ[(stairs.y + dy) * W + stairs.x + dx] = 1;
  const start = { x: startRoom.cx, y: startRoom.cy };
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) occ[(start.y + dy) * W + start.x + dx] = 1;

  const normalRooms = mainRooms.filter((r) => r.kind === 'normal' || r.kind === 'stairs');
  const startD = bfsDist(m, start.x, start.y, false);

  // ---- vault, key, secrets
  if (vault) {
    addObj('chest', vault.cx, vault.cy, { tier: 1 });
    for (let i = 0; i < 2; i++) { const p = pickTile(vault); if (p) addObj('gold', p[0], p[1], { amount: rng.int(15, 30) + floor * 3 }); }
    // The key lives in a reachable main room, preferably far from the start.
    const keyRooms = boss ? mainRooms.filter((r) => r.kind === 'ante') : normalRooms.filter((r) => r.kind === 'normal');
    const pool = keyRooms.length ? keyRooms : normalRooms;
    let kr = rng.pick(pool);
    if (!boss && pool.length > 2) {
      const sorted = pool.slice().sort((a, b) => startD[b.cy * W + b.cx] - startD[a.cy * W + a.cx]);
      kr = sorted[rng.int(0, Math.min(2, sorted.length - 1))];
    }
    const p = pickTile(kr, 80) || [kr.cx, kr.cy];
    if (!occ[p[1] * W + p[0]] && m.tiles[p[1] * W + p[0]] === T.FLOOR) addObj('key', p[0], p[1]);
    else {
      // Fall back to any free tile reachable without keys.
      let placed = false;
      for (let i = 0; i < W * H && !placed; i++) {
        const x = i % W, y = (i / W) | 0;
        if (startD[i] > 4 && isFree(x, y)) { addObj('key', x, y); placed = true; }
      }
    }
  }
  for (const s of secrets) {
    if (rng.chance(0.6)) addObj('chest', s.cx, s.cy, { tier: 2 });
    else addObj('shrine', s.cx, s.cy, { shrine: rng.chance(0.5) ? 'perk' : rng.weighted(Object.entries(SHRINES).map(([k, v]) => [k, v.weight])) });
    const p = pickTile(s); if (p) addObj('gold', p[0], p[1], { amount: rng.int(10, 25) + floor * 2 });
  }

  // ---- shop
  const shopRoom = mainRooms.find((r) => r.kind === 'shop');
  if (shopRoom) {
    const sells = ['item', 'item', 'item', 'potion', rng.pick(['bomb', 'scroll', 'key', 'scroll'])];
    const y = shopRoom.y + 1;
    const x0 = shopRoom.cx - 2;
    let n = 0;
    for (let i = 0; i < 5; i++) {
      const x = Math.max(shopRoom.x, Math.min(shopRoom.x + shopRoom.w - 1, x0 + i));
      if (!isFree(x, y)) continue;
      addObj('pedestal', x, y, { sell: sells[i], seed: rng.int(1, 2 ** 30) });
      n++;
    }
    const kx = shopRoom.cx, ky = Math.min(shopRoom.y + shopRoom.h - 1, shopRoom.y + 3);
    if (isFree(kx, ky)) addObj('shopkeeper', kx, ky);
    if (n === 0) shopRoom.kind = 'normal';
  }

  // ---- boss ante room
  if (boss) {
    const ante = mainRooms.find((r) => r.kind === 'ante');
    addObj('shrine', ante.x + 1, ante.y + 1, { shrine: 'fountain' });
    addObj('shrine', ante.x + ante.w - 2, ante.y + 1, { shrine: 'perk' });
    const p = pickTile(ante); if (p) addObj('chest', p[0], p[1], { tier: 0 });
  }

  // ---- chests, shrines, crates in normal rooms
  if (!boss && normalRooms.length) {
    const nChest = rng.int(1, 3);
    for (let i = 0; i < nChest; i++) { const r = rng.pick(normalRooms); const p = pickTile(r, 40, true); if (p) addObj('chest', p[0], p[1], { tier: 0 }); }
    const nShrine = (rng.chance(0.55) ? 1 : 0) + (rng.chance(0.2) ? 1 : 0);
    for (let i = 0; i < nShrine; i++) {
      const r = rng.pick(normalRooms); const p = pickTile(r);
      if (p) addObj('shrine', p[0], p[1], { shrine: rng.weighted(Object.entries(SHRINES).map(([k, v]) => [k, v.weight])) });
    }
    const nCrate = rng.int(4, 9);
    for (let i = 0; i < nCrate; i++) { const r = rng.pick(normalRooms); const p = pickTile(r, 30, true); if (p) addObj('crate', p[0], p[1]); }
    if (rng.chance(0.35)) { const r = rng.pick(normalRooms); const p = pickTile(r); if (p) addObj('gold', p[0], p[1], { amount: rng.int(8, 20) + floor * 2 }); }
  }

  // ---- traps: spikes in corridors and rooms
  const spikes = [];
  const nearSpecial = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = get(m, x + dx, y + dy);
      if (t === T.DOOR || t === T.SECRET || t === T.STAIRS) return true;
    }
    return false;
  };
  const trapCount = Math.round(Math.min(26, 3 + floor * 0.7) * biome.trapRate) + (boss ? 0 : rng.int(0, 3));
  const corrTiles = [];
  for (let i = 0; i < W * H; i++) if (m.corr[i] && m.tiles[i] === T.FLOOR && startD[i] > 6) corrTiles.push(i);
  for (let k = 0; k < trapCount; k++) {
    let i = -1;
    if (corrTiles.length && rng.chance(0.55)) i = rng.pick(corrTiles);
    else if (normalRooms.length) { const r = rng.pick(normalRooms); const p = pickTile(r, 20); if (p) i = p[1] * W + p[0]; }
    if (i < 0) continue;
    const x = i % W, y = (i / W) | 0;
    if (m.tiles[i] !== T.FLOOR || occ[i] || nearSpecial(x, y) || startD[i] < 5) continue;
    m.tiles[i] = T.SPIKES;
    spikes.push({ x, y, phase: rng.float(0, 2.4) });
    // Spikes come in short runs.
    if (rng.chance(0.5)) {
      const [dx, dy] = rng.pick(DIRS4);
      const j = (y + dy) * W + x + dx;
      if (m.tiles[j] === T.FLOOR && !occ[j] && !nearSpecial(x + dx, y + dy)) { m.tiles[j] = T.SPIKES; spikes.push({ x: x + dx, y: y + dy, phase: spikes[spikes.length - 1].phase + 0.35 }); }
    }
  }

  // ---- biome hazards
  if (biome.hazard && !boss) {
    const blobs = rng.int(2, 4) + Math.min(3, Math.floor(floor / 8));
    for (let b = 0; b < blobs; b++) {
      const r = rng.pick(normalRooms);
      if (!r) break;
      let x = rng.int(r.x, r.x + r.w - 1), y = rng.int(r.y, r.y + r.h - 1);
      const size = rng.int(4, 11);
      for (let s = 0; s < size * 3; s++) {
        const i = y * W + x;
        if (m.tiles[i] === T.FLOOR && !occ[i] && !nearSpecial(x, y) && startD[i] > 4) m.tiles[i] = T.HAZARD;
        const [dx, dy] = rng.pick(DIRS4);
        const nx = x + dx, ny = y + dy;
        if (nx >= r.x && nx < r.x + r.w && ny >= r.y && ny < r.y + r.h) { x = nx; y = ny; }
      }
    }
  }

  // ---- enemies
  let sid = 1;
  const eliteChance = Math.min(0.32, 0.03 + 0.011 * floor + tier * 0.08);
  const eliteKeys = Object.keys(ELITES);
  const rollElite = () => {
    if (!rng.chance(eliteChance)) return null;
    const mods = [rng.pick(eliteKeys)];
    if (tier > 0 || (floor > 15 && rng.chance(0.3))) { const k = rng.pick(eliteKeys); if (!mods.includes(k)) mods.push(k); }
    return mods;
  };
  const spawnOK = (x, y) => {
    const i = y * W + x;
    return m.tiles[i] === T.FLOOR && !occ[i];
  };
  function spawnIn(room, n, minStart) {
    for (let k = 0; k < n; k++) {
      for (let t = 0; t < 25; t++) {
        const x = rng.int(room.x, room.x + room.w - 1), y = rng.int(room.y, room.y + room.h - 1);
        if (!spawnOK(x, y)) continue;
        const di = startD[y * W + x];
        if (di >= 0 && di < minStart) continue;
        occ[y * W + x] = 1;
        spawns.push({ id: sid++, type: weightedEnemy(rng, biome, floor), x, y, elite: rollElite() });
        break;
      }
    }
  }
  const density = Math.min(0.078, 0.034 + 0.0022 * floor);
  if (boss) {
    const ante = mainRooms.find((r) => r.kind === 'ante');
    spawnIn(ante, 2 + Math.min(3, Math.floor(floor / 10)), 0);
    spawns.push({ id: sid++, type: biome.boss, x: m.arena.x + 10, y: m.arena.y + 7, elite: null, boss: true });
  } else {
    for (const r of mainRooms) {
      if (r.kind === 'start' || r.kind === 'shop') continue;
      let area = 0;
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.tiles[y * W + x] === T.FLOOR) area++;
      let n = Math.floor(area * density + rng.float(0, 1));
      if (r.kind === 'stairs') n += 1;
      spawnIn(r, Math.max(1, n), 6);
    }
    const wander = rng.int(0, 2 + Math.floor(floor / 4));
    for (let k = 0; k < wander && corrTiles.length; k++) {
      const i = rng.pick(corrTiles);
      const x = i % W, y = (i / W) | 0;
      if (!spawnOK(x, y) || startD[i] < 10) continue;
      occ[i] = 1;
      spawns.push({ id: sid++, type: weightedEnemy(rng, biome, floor), x, y, elite: rollElite() });
    }
  }
  if (vault && rng.chance(0.5)) {
    const p = pickTile(vault);
    if (p) { occ[p[1] * W + p[0]] = 1; spawns.push({ id: sid++, type: weightedEnemy(rng, biome, floor), x: p[0], y: p[1], elite: [rng.pick(eliteKeys)] }); }
  }
  for (const s of secrets) {
    const n = rng.int(0, 2);
    for (let k = 0; k < n; k++) { const p = pickTile(s); if (p) { occ[p[1] * W + p[0]] = 1; spawns.push({ id: sid++, type: weightedEnemy(rng, biome, floor), x: p[0], y: p[1], elite: null }); } }
  }

  return {
    seed, floor, w: W, h: H, tiles: m.tiles,
    biome: biome.id, biomeIdx: biomeIndex(floor), tier, isBoss: boss, isShop: !!shopRoom,
    rooms: m.rooms.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, cx: r.cx, cy: r.cy, kind: r.kind, door: r.door || null })),
    start, stairs, objects, spawns, spikes,
    arena: boss ? { x: m.arena.x, y: m.arena.y, w: m.arena.w, h: m.arena.h, gate: m.gate } : null,
    vault: vault ? { x: vault.x, y: vault.y, w: vault.w, h: vault.h, door: vault.door } : null,
    secrets: secrets.map((s) => ({ x: s.door.x, y: s.door.y })),
  };
}
