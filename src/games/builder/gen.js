// Island generation from a seed. Pure (no DOM, no three).
import { makeRng, hashSeed } from '../../shell/rng.js';
import { T, D, SIZES, DIFFICULTY, ISLAND_A, ISLAND_B } from './data.js';

function makeNoise(rng) {
  const perm = new Uint8Array(512);
  const p = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256);
  for (let i = 0; i < 256; i++) val[i] = rng.next();
  const lat = (ix, iy) => val[perm[(perm[ix & 255] + iy) & 255]];
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = lat(ix, iy), b = lat(ix + 1, iy), c = lat(ix, iy + 1), d = lat(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y, oct = 4) => {
    let s = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < oct; o++) { s += amp * noise(x * f, y * f); norm += amp; amp *= 0.5; f *= 2.03; }
    return s / norm;
  };
}

const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const isLand = (t) => t >= T.SAND;
const isWater = (t) => t <= T.SHALLOW;

function quantile(sorted, q) {
  const i = Math.max(0, Math.min(sorted.length - 1, Math.floor(q * sorted.length)));
  return sorted[i];
}

export function islandName(seed) {
  const r = makeRng(hashSeed('name:' + seed));
  return r.pick(ISLAND_A) + r.pick(ISLAND_B);
}

// Returns { W, H, terrain[], deposit[], start:{x,y}, name, attempt } — plain arrays, JSON-safe.
export function generateIsland({ seed, size = 'medium', difficulty = 'standard' }) {
  const N = (SIZES[size] || SIZES.medium).n;
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.standard;
  let last = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = makeRng(hashSeed(`${seed}|${size}|${difficulty}|${attempt}`));
    const g = tryGenerate(rng, N, diff, difficulty);
    g.attempt = attempt;
    last = g;
    if (g.ok) break;
  }
  if (!last.ok) repair(last, makeRng(hashSeed(`${seed}|repair`)));
  delete last.ok;
  last.name = islandName(seed);
  return last;
}

function tryGenerate(rng, N, diff, difficulty) {
  const W = N, H = N;
  const fbm = makeNoise(rng);
  const fbm2 = makeNoise(rng);
  const ox = rng.float(0, 100), oy = rng.float(0, 100);
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = ((x + 0.5) / W) * 2 - 1, ny = ((y + 0.5) / H) * 2 - 1;
    const d = Math.sqrt(nx * nx + ny * ny);
    const warp = fbm2((x / N) * 3.2 + ox, (y / N) * 3.2 + oy, 3) - 0.5;
    const warp2 = fbm2((x / N) * 7 + oy, (y / N) * 7 + ox, 2) - 0.5;
    const base = fbm((x / N) * 4.2 + ox, (y / N) * 4.2 + oy, 4);
    const mask = 1 - smoothstep(0.25, 0.95, d + warp * 0.8 + warp2 * 0.3);
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    h[y * W + x] = edge < 2 ? 0 : mask * (0.45 + 0.75 * base);
  }
  const sorted = Array.from(h).sort((a, b) => a - b);
  const landFrac = diff.landFrac;
  const seaLevel = quantile(sorted, 1 - landFrac);
  const shallowLevel = quantile(sorted, Math.max(0, 1 - landFrac - 0.1));
  const terrain = new Array(W * H).fill(T.DEEP);
  const deposit = new Array(W * H).fill(D.NONE);
  for (let i = 0; i < W * H; i++) {
    if (h[i] >= seaLevel && h[i] > 0) terrain[i] = T.GRASS;
    else if (h[i] >= shallowLevel && h[i] > 0) terrain[i] = T.SHALLOW;
  }
  // Drop tiny islets so the colony is one readable landmass (plus maybe a few big outliers).
  const comp = components(terrain, W, H);
  let mainId = -1, mainSize = 0;
  comp.sizes.forEach((s, id) => { if (s > mainSize) { mainSize = s; mainId = id; } });
  for (let i = 0; i < W * H; i++) {
    if (isLand(terrain[i]) && comp.id[i] !== mainId && comp.sizes[comp.id[i]] < 8) terrain[i] = T.SHALLOW;
  }
  // Rank land heights for classes.
  const landIdx = [];
  for (let i = 0; i < W * H; i++) if (isLand(terrain[i])) landIdx.push(i);
  landIdx.sort((a, b) => h[a] - h[b]);
  const rank = new Float32Array(W * H);
  landIdx.forEach((i, k) => { rank[i] = k / Math.max(1, landIdx.length - 1); });
  for (const i of landIdx) {
    const x = i % W, y = (i / W) | 0;
    const coastal = nearWater(terrain, W, H, x, y, 1);
    const r = rank[i];
    if (r >= 0.94) terrain[i] = T.MOUNTAIN;
    else if (r >= 0.8) terrain[i] = T.HILL;
    else if (r < 0.12 || (coastal && r < 0.32)) terrain[i] = T.SAND;
    else terrain[i] = T.GRASS;
  }
  // Forest by moisture rank among grass.
  const grassIdx = landIdx.filter((i) => terrain[i] === T.GRASS);
  const moist = new Float32Array(W * H);
  for (const i of grassIdx) { const x = i % W, y = (i / W) | 0; moist[i] = fbm2((x / N) * 6 + 31, (y / N) * 6 + 17, 3); }
  grassIdx.sort((a, b) => moist[b] - moist[a]);
  const forestN = Math.round(grassIdx.length * 0.4);
  for (let k = 0; k < forestN; k++) terrain[grassIdx[k]] = T.FOREST;
  // Any water touching land is shallow; everything else deep.
  for (let i = 0; i < W * H; i++) {
    if (!isWater(terrain[i])) continue;
    const x = i % W, y = (i / W) | 0;
    terrain[i] = nearLand(terrain, W, H, x, y, 1) ? T.SHALLOW : (terrain[i] === T.SHALLOW && nearLand(terrain, W, H, x, y, 3) ? T.SHALLOW : T.DEEP);
  }
  const comp2 = components(terrain, W, H);
  let main2 = -1, ms2 = 0;
  comp2.sizes.forEach((s, id) => { if (s > ms2) { ms2 = s; main2 = id; } });
  const onMain = (i) => comp2.id[i] === main2;

  const g = { W, H, terrain, deposit, start: null, ok: false };
  placeDeposits(g, rng, onMain, difficulty);
  g.start = findStart(g, rng, onMain);
  if (g.start) {
    const si = g.start.y * W + g.start.x;
    terrain[si] = T.GRASS; deposit[si] = D.NONE;
  }
  g.ok = validate(g, onMain);
  return g;
}

function components(terrain, W, H) {
  const id = new Int32Array(W * H).fill(-1);
  const sizes = [];
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (!isLand(terrain[i]) || id[i] >= 0) continue;
    const c = sizes.length; let s = 0;
    stack.push(i); id[i] = c;
    while (stack.length) {
      const j = stack.pop(); s++;
      const x = j % W, y = (j / W) | 0;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of nb) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (isLand(terrain[k]) && id[k] < 0) { id[k] = c; stack.push(k); }
      }
    }
    sizes.push(s);
  }
  return { id, sizes };
}

function nearWater(terrain, W, H, x, y, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return true;
    if (isWater(terrain[ny * W + nx])) return true;
  }
  return false;
}
function nearLand(terrain, W, H, x, y, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    if (isLand(terrain[ny * W + nx])) return true;
  }
  return false;
}

function placeDeposits(g, rng, onMain, difficulty) {
  const { W, H, terrain, deposit } = g;
  const N = W;
  const harsh = difficulty === 'harsh';
  // Ore clusters on hills.
  const hills = [];
  for (let i = 0; i < W * H; i++) if (terrain[i] === T.HILL && onMain(i)) hills.push(i);
  const oreClusters = N < 33 ? 2 : 3;
  const centers = [];
  for (const i of rng.shuffle(hills)) {
    if (centers.length >= oreClusters) break;
    const x = i % W, y = (i / W) | 0;
    if (centers.some((c) => Math.abs(c.x - x) + Math.abs(c.y - y) < 6)) continue;
    centers.push({ x, y });
  }
  for (const c of centers) {
    const want = rng.int(harsh ? 2 : 3, harsh ? 3 : 5);
    let got = 0;
    const q = [c.y * W + c.x];
    const seen = new Set(q);
    while (q.length && got < want) {
      const j = q.shift();
      if (terrain[j] === T.HILL && deposit[j] === D.NONE) { deposit[j] = D.ORE; got++; }
      const x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (!seen.has(k) && terrain[k] === T.HILL) { seen.add(k); q.push(k); }
      }
    }
  }
  // Fertile soil patches on meadows.
  const grass = [];
  for (let i = 0; i < W * H; i++) if (terrain[i] === T.GRASS && onMain(i)) grass.push(i);
  const patches = rng.int(3, harsh ? 4 : 5);
  let made = 0;
  for (const i of rng.shuffle(grass)) {
    if (made >= patches) break;
    if (deposit[i] !== D.NONE) continue;
    made++;
    const want = rng.int(3, 6);
    let got = 0;
    const q = [i]; const seen = new Set(q);
    while (q.length && got < want) {
      const j = q.shift();
      if (terrain[j] === T.GRASS && deposit[j] === D.NONE) { deposit[j] = D.FERTILE; got++; }
      const x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (!seen.has(k) && terrain[k] === T.GRASS) { seen.add(k); q.push(k); }
      }
    }
  }
  // Fish shoals in shallows near the main island.
  const shallow = [];
  for (let i = 0; i < W * H; i++) if (terrain[i] === T.SHALLOW) {
    const x = i % W, y = (i / W) | 0;
    if (nearLand(terrain, W, H, x, y, 2)) shallow.push(i);
  }
  const shoals = rng.int(harsh ? 4 : 5, harsh ? 6 : 8);
  const placed = [];
  for (const i of rng.shuffle(shallow)) {
    if (placed.length >= shoals) break;
    const x = i % W, y = (i / W) | 0;
    if (placed.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 4)) continue;
    placed.push({ x, y });
    deposit[i] = D.FISH;
  }
}

function findStart(g, rng, onMain) {
  const { W, H, terrain } = g;
  let best = null, bestScore = -1;
  let cx = 0, cy = 0, n = 0;
  for (let i = 0; i < W * H; i++) if (isLand(terrain[i]) && onMain(i)) { cx += i % W; cy += (i / W) | 0; n++; }
  if (!n) return null;
  cx /= n; cy /= n;
  for (let i = 0; i < W * H; i++) {
    const t = terrain[i];
    if (!(t === T.GRASS || t === T.SAND || t === T.FOREST) || !onMain(i)) continue;
    const x = i % W, y = (i / W) | 0;
    let build = 0, forest = 0, coast = 0;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      if (dx * dx + dy * dy > 37) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const tt = terrain[ny * W + nx];
      if (tt >= T.SAND && tt <= T.HILL) build++;
      if (tt === T.FOREST && dx * dx + dy * dy <= 26) forest++;
      if (tt === T.SHALLOW && dx * dx + dy * dy <= 17) coast++;
    }
    if (build < 40 || forest < 5 || coast < 3) continue;
    const dist = Math.hypot(x - cx, y - cy);
    const score = build + Math.min(forest, 14) * 2 + Math.min(coast, 10) * 2 - dist * 1.5 + rng.next() * 3;
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  return best;
}

function validate(g, onMain) {
  const { W, H, terrain, deposit } = g;
  if (!g.start) return false;
  let build = 0, ore = 0, fert = 0, fish = 0, hill = 0, forest = 0;
  for (let i = 0; i < W * H; i++) {
    const t = terrain[i];
    if (t >= T.SAND && t <= T.HILL && onMain(i)) build++;
    if (t === T.HILL && onMain(i)) hill++;
    if (t === T.FOREST) forest++;
    if (deposit[i] === D.ORE && onMain(i)) ore++;
    if (deposit[i] === D.FERTILE && onMain(i)) fert++;
    if (deposit[i] === D.FISH) fish++;
  }
  return build >= W * H * 0.26 && ore >= 4 && fert >= 8 && fish >= 4 && hill >= 12 && forest >= 30;
}

// Last resort: force the deposits we need onto the island so a run is always playable.
function repair(g, rng) {
  const { W, H, terrain, deposit } = g;
  const land = [];
  for (let i = 0; i < W * H; i++) if (terrain[i] >= T.SAND && terrain[i] <= T.HILL) land.push(i);
  if (!g.start) {
    const i = land[Math.floor(land.length / 2)] ?? ((H >> 1) * W + (W >> 1));
    g.start = { x: i % W, y: (i / W) | 0 };
    terrain[i] = T.GRASS;
  }
  const count = (f) => { let c = 0; for (let i = 0; i < W * H; i++) if (f(i)) c++; return c; };
  const sh = rng.shuffle(land);
  let k = 0;
  while (count((i) => deposit[i] === D.ORE) < 4 && k < sh.length) {
    const i = sh[k++];
    if (Math.abs(i % W - g.start.x) + Math.abs(((i / W) | 0) - g.start.y) < 3) continue;
    terrain[i] = T.HILL; deposit[i] = D.ORE;
  }
  while (count((i) => deposit[i] === D.FERTILE) < 8 && k < sh.length) {
    const i = sh[k++];
    if (deposit[i] !== D.NONE || i === g.start.y * W + g.start.x) continue;
    terrain[i] = T.GRASS; deposit[i] = D.FERTILE;
  }
  const water = [];
  for (let i = 0; i < W * H; i++) if (terrain[i] === T.SHALLOW && deposit[i] === D.NONE) water.push(i);
  for (const i of rng.shuffle(water)) {
    if (count((j) => deposit[j] === D.FISH) >= 4) break;
    deposit[i] = D.FISH;
  }
}
