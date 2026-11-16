// Valley generation: a brook winding through meadow, woods and rocky hills. Pure, seeded.
import { makeRng } from '../../shell/rng.js';

export const N = 34;
export const T = { GRASS: 0, FOREST: 1, HILL: 2, WATER: 3 };
export const idx = (x, y) => y * N + x;
export const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function makeNoise(rng, cells) {
  const g = cells + 2;
  const lat = new Float32Array(g * g);
  for (let i = 0; i < lat.length; i++) lat[i] = rng.next();
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / N) * cells, fy = (y / N) * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = sm(fx - x0), ty = sm(fy - y0);
    const a = lat[y0 * g + x0], b = lat[y0 * g + x0 + 1], c = lat[(y0 + 1) * g + x0], d = lat[(y0 + 1) * g + x0 + 1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };
}

function attempt(seed) {
  const rng = makeRng(seed);
  const terr = new Uint8Array(N * N);
  const height = new Float32Array(N * N);
  const ore = new Uint8Array(N * N);
  const coal = new Uint8Array(N * N);
  const shade = new Float32Array(N * N);      // per-tile colour jitter

  const nHill = makeNoise(rng, 5), nHill2 = makeNoise(rng, 11);
  const nForest = makeNoise(rng, 6), nForest2 = makeNoise(rng, 13);
  const nMeander = makeNoise(rng, 4);

  // The brook: enters at the top, wanders, leaves at the bottom. Sometimes the map is transposed.
  const flip = rng.chance(0.5);
  const water = new Uint8Array(N * N);
  let cx = N * rng.float(0.35, 0.65);
  let prev = Math.round(cx);
  for (let y = 0; y < N; y++) {
    cx += (nMeander(y * 1.7, 3) - 0.5) * 2.6 + (N / 2 - cx) * 0.04;
    cx = Math.max(5, Math.min(N - 6, cx));
    const x = Math.round(cx);
    const w = nMeander(7, y) > 0.62 ? 2 : 1;
    const lo = Math.min(prev, x), hi = Math.max(prev, x) + w - 1;
    for (let xx = lo; xx <= hi; xx++) water[flip ? idx(y, xx) : idx(xx, y)] = 1;
    prev = x;
  }
  // A pond or two off to one side.
  const ponds = rng.int(1, 2);
  for (let p = 0; p < ponds; p++) {
    const px = rng.int(5, N - 6), py = rng.int(5, N - 6), pr = rng.float(1.3, 2.2);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - px, (y - py) * 1.2) + (nForest2(x, y) - 0.5) * 1.5;
      if (d < pr) water[idx(x, y)] = 1;
    }
  }

  const distWater = new Uint8Array(N * N).fill(99);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let best = 99;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      if (inb(x + dx, y + dy) && water[idx(x + dx, y + dy)]) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dy)));
    }
    distWater[idx(x, y)] = best;
  }

  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y);
    shade[i] = rng.next();
    if (water[i]) { terr[i] = T.WATER; height[i] = -0.2; continue; }
    const edge = Math.min(x, y, N - 1 - x, N - 1 - y);
    const h = nHill(x, y) * 0.75 + nHill2(x, y) * 0.25 + (edge < 3 ? (3 - edge) * 0.04 : 0);
    if (h > 0.61 && distWater[i] >= 2) {
      terr[i] = T.HILL;
      height[i] = 0.3 + Math.min(4, Math.floor((h - 0.61) * 28)) * 0.22;
      continue;
    }
    const f = nForest(x, y) * 0.7 + nForest2(x, y) * 0.3;
    if (f > 0.53) terr[i] = T.FOREST;
  }

  // Ore and coal outcrops: hill tiles that touch walkable ground, spread apart.
  const rim = [];
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    if (terr[idx(x, y)] !== T.HILL) continue;
    let open = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = terr[idx(x + dx, y + dy)]; if (t === T.GRASS || t === T.FOREST) open++; }
    if (open) rim.push([x, y]);
  }
  const picked = [];
  const far = (x, y, min) => picked.every(([px, py]) => Math.abs(px - x) + Math.abs(py - y) >= min);
  for (const [x, y] of rng.shuffle(rim)) {
    if (picked.length >= 12) break;
    if (!far(x, y, 4)) continue;
    picked.push([x, y]);
    if (picked.length % 2 === 1) ore[idx(x, y)] = 1; else coal[idx(x, y)] = 1;
  }

  // Starting meadow: open ground near water, woods and stone, not too close to the edge.
  let best = null;
  for (let y = 6; y < N - 6; y++) for (let x = 6; x < N - 6; x++) {
    if (terr[idx(x, y)] !== T.GRASS) continue;
    let grass = 0, forest = 0, hill = 0, wat = 0;
    for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
      if (!inb(x + dx, y + dy)) continue;
      const t = terr[idx(x + dx, y + dy)], d = Math.max(Math.abs(dx), Math.abs(dy));
      if (t === T.GRASS && d <= 3) grass++;
      if (t === T.FOREST && d <= 5) forest++;
      if (t === T.HILL) hill++;
      if (t === T.WATER && d <= 4) wat++;
    }
    const score = grass * 2 + Math.min(forest, 14) * 1.5 + Math.min(hill, 10) * 1.5 + Math.min(wat, 6) * 3
      - (Math.abs(x - N / 2) + Math.abs(y - N / 2)) * 0.6;
    if (grass >= 34 && forest >= 6 && hill >= 3 && wat >= 2 && (!best || score > best.score)) best = { x, y, score };
  }

  const counts = [0, 0, 0, 0];
  for (let i = 0; i < N * N; i++) counts[terr[i]]++;
  const ok = best && counts[T.HILL] >= 60 && counts[T.FOREST] >= 150 && counts[T.GRASS] >= 520
    && picked.length >= 10;
  return { ok, seed, terr, height, ore, coal, shade, distWater, start: best ? { x: best.x, y: best.y } : { x: N >> 1, y: N >> 1 } };
}

export function generate(seed) {
  for (let k = 0; k < 60; k++) {
    const m = attempt((seed + k * 7919) >>> 0);
    if (m.ok) return m;
  }
  return attempt(seed);
}
