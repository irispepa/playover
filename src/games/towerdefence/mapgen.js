// Procedural map generation. Pure module: no DOM, no three.js.
// generateMap(seed, archetype) -> { w, h, tiles: Uint8Array, gates: [tileIndex], core: tileIndex, archetype }
import { makeRng, hashSeed } from '../../shell/rng.js';
import { T, WALKABLE, BUILDABLE, ARCHETYPE_ORDER } from './data.js';

export function pickArchetype(seed) {
  const rng = makeRng(hashSeed(`${seed}:arch`));
  return rng.pick(ARCHETYPE_ORDER);
}

export function generateMap(seed, archetype) {
  if (!archetype || archetype === 'random') archetype = pickArchetype(seed);
  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = makeRng(hashSeed(`${seed}:map:${archetype}:${attempt}`));
    const m = build(rng, archetype);
    if (validate(m)) return m;
  }
  // Fallback: a guaranteed-valid map (carve a road for every gate).
  const rng = makeRng(hashSeed(`${seed}:map:${archetype}:fallback`));
  const m = build(rng, archetype);
  for (const g of m.gates) carve(m, g, m.core, rng);
  return m;
}

function build(rng, archetype) {
  const w = rng.int(11, 13);
  const h = rng.int(17, 20);
  const tiles = new Uint8Array(w * h);
  const m = { w, h, tiles, gates: [], core: 0, archetype };
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = t; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? tiles[y * w + x] : -1);
  const mid = (w - 1) / 2;
  let core = [Math.round(mid + rng.int(-1, 1)), h - 2];
  let gates = [];

  switch (archetype) {
    case 'twin': {
      gates = [[rng.int(1, 2), 0], [w - 1 - rng.int(1, 2), 0]];
      core = [Math.round(mid), h - 2];
      // a central ridge between the gates
      const ry = rng.int(3, 5);
      for (let y = ry; y < ry + rng.int(3, 5); y++) set(Math.round(mid), y, T.ROCK);
      scatter(rng, m, rng.int(4, 6), [T.ROCK, T.RUIN]);
      break;
    }
    case 'islands': {
      gates = [[rng.int(2, w - 3), 0]];
      core = [rng.int(3, w - 4), h - 2];
      const bands = [Math.floor(h * 0.33) + rng.int(-1, 1), Math.floor(h * 0.66) + rng.int(-1, 1)];
      for (const by of bands) {
        const thick = rng.int(1, 2);
        for (let y = by; y < by + thick; y++) for (let x = 0; x < w; x++) set(x, y, T.WATER);
        const nb = rng.int(2, 3);
        const xs = rng.shuffle([...Array(w - 2).keys()].map((i) => i + 1)).slice(0, nb);
        for (const bx of xs) for (let y = by; y < by + thick; y++) set(bx, y, T.BRIDGE);
      }
      // ponds
      for (let i = 0; i < 2; i++) blob(rng, m, rng.int(1, w - 2), rng.int(2, h - 4), T.WATER, rng.int(2, 4));
      scatter(rng, m, rng.int(2, 4), [T.ROCK]);
      break;
    }
    case 'canyon': {
      gates = [[rng.chance(0.5) ? 1 : w - 2, 0]];
      core = [Math.round(mid), h - 2];
      let side = gates[0][0] < mid ? 1 : 0; // gap side opposite to the gate
      const step = rng.int(4, 5);
      for (let y = step; y < h - 4; y += step) {
        const gap = rng.int(2, 3);
        for (let x = 0; x < w; x++) {
          const inGap = side ? x >= w - gap : x < gap;
          if (!inGap) set(x, y, rng.chance(0.85) ? T.ROCK : T.RUIN);
        }
        side = 1 - side;
      }
      scatter(rng, m, rng.int(1, 3), [T.RUIN]);
      break;
    }
    case 'lake': {
      gates = [[0, rng.int(2, 5)], [w - 1, rng.int(2, 5)]];
      if (rng.chance(0.4)) gates.push([rng.int(3, w - 4), 0]);
      core = [Math.round(mid), h - 2];
      const cx = mid + rng.float(-1, 1), cy = h * 0.45, rx = rng.float(2, 3), ry = rng.float(2.5, 3.5);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d < 1) set(x, y, T.WATER);
      }
      scatter(rng, m, rng.int(3, 5), [T.ROCK, T.RUIN]);
      break;
    }
    case 'citadel': {
      core = [Math.round(mid), Math.round(h * 0.62)];
      gates = [[rng.int(2, w - 3), 0], [0, rng.int(3, Math.floor(h / 2))], [w - 1, rng.int(Math.floor(h / 2), h - 3)]];
      const R = 3.2;
      const openings = rng.int(2, 3);
      const angles = [];
      for (let i = 0; i < openings; i++) angles.push(rng.float(0, Math.PI * 2));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - core[0], dy = y - core[1];
        const d = Math.hypot(dx, dy);
        if (d > R - 0.5 && d < R + 0.5) {
          const a = Math.atan2(dy, dx);
          const open = angles.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.42);
          if (!open) set(x, y, T.RUIN);
        }
      }
      scatter(rng, m, rng.int(2, 4), [T.ROCK]);
      break;
    }
    case 'field':
    default: {
      gates = [[rng.int(2, w - 3), 0]];
      scatter(rng, m, rng.int(5, 8), [T.ROCK, T.ROCK, T.RUIN]);
      if (rng.chance(0.5)) blob(rng, m, rng.int(1, w - 2), rng.int(4, h - 6), T.WATER, rng.int(2, 4));
      break;
    }
  }

  // Special tiles
  for (let i = rng.int(2, 3); i > 0; i--) blob(rng, m, rng.int(1, w - 2), rng.int(2, h - 3), T.HIGH, rng.int(2, 4), true);
  for (let i = rng.int(2, 4); i > 0; i--) {
    const x = rng.int(1, w - 2), y = rng.int(2, h - 3);
    if (get(x, y) === T.GROUND) set(x, y, T.CRYSTAL);
  }
  for (let i = rng.int(1, 3); i > 0; i--) blob(rng, m, rng.int(1, w - 2), rng.int(3, h - 4), T.MUD, rng.int(2, 4), true);

  // Gates & core with clear surroundings
  m.core = core[1] * w + core[0];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const t = get(core[0] + dx, core[1] + dy);
    if (t >= 0 && !WALKABLE[t]) set(core[0] + dx, core[1] + dy, T.GROUND);
  }
  set(core[0], core[1], T.CORE);
  for (const [gx, gy] of gates) {
    set(gx, gy, T.GATE);
    // clear the tile in front
    const fx = gx === 0 ? 1 : gx === w - 1 ? w - 2 : gx;
    const fy = gy === 0 ? 1 : gy === h - 1 ? h - 2 : gy;
    if (!(fx === gx && fy === gy)) { const t = get(fx, fy); if (t !== T.CORE) set(fx, fy, T.GROUND); }
    m.gates.push(gy * w + gx);
  }
  return m;
}

function scatter(rng, m, n, types) {
  for (let i = 0; i < n; i++) {
    blob(rng, m, rng.int(0, m.w - 1), rng.int(2, m.h - 4), rng.pick(types), rng.int(1, 4));
  }
}

// random-walk blob; groundOnly: only overwrite plain ground
function blob(rng, m, x, y, type, size, groundOnly = false) {
  for (let i = 0; i < size; i++) {
    if (x >= 0 && y >= 0 && x < m.w && y < m.h) {
      const idx = y * m.w + x;
      if (!groundOnly || m.tiles[idx] === T.GROUND) m.tiles[idx] = type;
    }
    if (rng.chance(0.5)) x += rng.chance(0.5) ? 1 : -1; else y += rng.chance(0.5) ? 1 : -1;
  }
}

// BFS from the core over walkable tiles (ignoring towers). Returns Int32Array distances (-1 = unreachable).
export function terrainDistance(m) {
  const { w, h, tiles } = m;
  const dist = new Int32Array(w * h).fill(-1);
  const q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  dist[m.core] = 0; q[qt++] = m.core;
  while (qh < qt) {
    const c = q[qh++];
    const cx = c % w, cy = (c / w) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (dist[n] >= 0 || !WALKABLE[tiles[n]]) continue;
      dist[n] = dist[c] + 1; q[qt++] = n;
    }
  }
  return dist;
}

export function buildableCount(m) {
  let n = 0;
  for (let i = 0; i < m.tiles.length; i++) if (BUILDABLE[m.tiles[i]]) n++;
  return n;
}

export function validate(m) {
  const dist = terrainDistance(m);
  for (const g of m.gates) if (dist[g] < 0) return false;
  // gates must be distinct and not too close to the core
  for (const g of m.gates) if (dist[g] < 7) return false;
  if (new Set(m.gates).size !== m.gates.length) return false;
  if (buildableCount(m) < Math.floor(m.w * m.h * 0.42)) return false;
  // the buildable ground must mostly be reachable (connected to the road) for towers to matter
  let reach = 0;
  for (let i = 0; i < m.tiles.length; i++) if (BUILDABLE[m.tiles[i]] && dist[i] >= 0) reach++;
  if (reach < Math.floor(m.w * m.h * 0.35)) return false;
  return true;
}

// Carve a walkable road from a to b, converting obstacles (water becomes bridge).
function carve(m, a, b, rng) {
  let x = a % m.w, y = (a / m.w) | 0;
  const bx = b % m.w, by = (b / m.w) | 0;
  let guard = 0;
  while ((x !== bx || y !== by) && guard++ < 500) {
    if (x !== bx && (y === by || rng.chance(0.5))) x += Math.sign(bx - x); else y += Math.sign(by - y);
    const i = y * m.w + x;
    const t = m.tiles[i];
    if (!WALKABLE[t]) m.tiles[i] = t === T.WATER ? T.BRIDGE : T.GROUND;
  }
}
