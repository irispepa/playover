// Flow-field pathfinding on the tile grid. Pure module.
// Ground enemies walk 4-connected tiles. The field is a BFS distance from the core over tiles that
// are walkable terrain and not occupied by a building. Recomputed whenever a building changes.
import { WALKABLE } from './data.js';

export const INF = 1 << 29;

// Shared scratch queue (grid sizes are small and fixed per map).
let scratchQ = new Int32Array(0);

// Fill `dist` (Int32Array w*h) with BFS distance to the core; `blocked` is Uint8Array (1 = building).
// extraBlock: an optional extra tile index treated as blocked (placement preview).
export function computeField(map, blocked, dist, extraBlock = -1) {
  const { w, h, tiles, core } = map;
  const n = w * h;
  if (scratchQ.length < n) scratchQ = new Int32Array(n);
  const q = scratchQ;
  dist.fill(INF);
  if (core === extraBlock) return dist;
  let qh = 0, qt = 0;
  dist[core] = 0; q[qt++] = core;
  while (qh < qt) {
    const c = q[qh++];
    const cx = c % w, cy = (c / w) | 0;
    const nd = dist[c] + 1;
    // right, left, down, up
    if (cx + 1 < w) { const i = c + 1; if (dist[i] === INF && WALKABLE[tiles[i]] && !blocked[i] && i !== extraBlock) { dist[i] = nd; q[qt++] = i; } }
    if (cx > 0) { const i = c - 1; if (dist[i] === INF && WALKABLE[tiles[i]] && !blocked[i] && i !== extraBlock) { dist[i] = nd; q[qt++] = i; } }
    if (cy + 1 < h) { const i = c + w; if (dist[i] === INF && WALKABLE[tiles[i]] && !blocked[i] && i !== extraBlock) { dist[i] = nd; q[qt++] = i; } }
    if (cy > 0) { const i = c - w; if (dist[i] === INF && WALKABLE[tiles[i]] && !blocked[i] && i !== extraBlock) { dist[i] = nd; q[qt++] = i; } }
  }
  return dist;
}

// Choose the next tile from `tile` following the field. `pref` (0..3) breaks ties so crowds spread
// over equally short routes; `lastDir` keeps walkers going straight when possible.
// Returns the next tile index, or -1 when no neighbour leads closer (should not happen in play).
export function nextStep(map, dist, tile, lastDir, pref) {
  const { w, h } = map;
  const cx = tile % w, cy = (tile / w) | 0;
  const d0 = dist[tile];
  let best = -1, bestD = d0, bestDir = -1;
  for (let k = 0; k < 4; k++) {
    const dir = (k + pref) & 3;
    let nx = cx, ny = cy;
    if (dir === 0) nx++; else if (dir === 1) nx--; else if (dir === 2) ny++; else ny--;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    const i = ny * w + nx;
    const d = dist[i];
    if (d < bestD || (d === bestD && d < d0 && dir === lastDir)) { best = i; bestD = d; bestDir = dir; }
  }
  if (best >= 0 && lastDir >= 0 && bestDir !== lastDir) {
    // prefer continuing straight on an equally good tile
    let nx = cx, ny = cy;
    if (lastDir === 0) nx++; else if (lastDir === 1) nx--; else if (lastDir === 2) ny++; else ny--;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
      const i = ny * w + nx;
      if (dist[i] === bestD) return i;
    }
  }
  return best;
}

export function dirBetween(map, a, b) {
  const d = b - a;
  if (d === 1) return 0;
  if (d === -1) return 1;
  if (d === map.w) return 2;
  if (d === -map.w) return 3;
  return -1;
}

// Path (tile indices) from a start tile to the core following the field.
export function tracePath(map, dist, start, out = []) {
  out.length = 0;
  if (dist[start] >= INF) return out;
  let t = start, last = -1, guard = map.w * map.h + 5;
  out.push(t);
  while (t !== map.core && guard-- > 0) {
    const n = nextStep(map, dist, t, last, 0);
    if (n < 0) break;
    last = dirBetween(map, t, n);
    t = n; out.push(t);
  }
  return out;
}
