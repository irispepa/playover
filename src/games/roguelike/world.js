// Grid helpers: collision, line of sight, flow field, fog of war. Pure.
import { T } from './data.js';

export function tileAt(G, x, y) {
  if (x < 0 || y < 0 || x >= G.w || y >= G.h) return T.WALL;
  return G.tiles[y * G.w + x];
}

export function solidAt(G, x, y) {
  if (x < 0 || y < 0 || x >= G.w || y >= G.h) return true;
  const t = G.tiles[y * G.w + x];
  return t === 0 || t === 2 || t === 4 || t === 7;
}

export function walkableAt(G, fx, fy) { return !solidAt(G, Math.floor(fx), Math.floor(fy)); }

// Move a circle (e.x, e.y, e.r) by (dx, dy) against the tile grid with axis-separated sliding.
// Returns a bitmask: 1 blocked on x, 2 blocked on y. Sets e.hitTile to the last blocking tile index.
export function moveCircle(G, e, dx, dy) {
  const r = e.r;
  let blocked = 0;
  // Clamp step so nothing can tunnel through a tile.
  const MAXS = 0.45;
  if (dx > MAXS) dx = MAXS; else if (dx < -MAXS) dx = -MAXS;
  if (dy > MAXS) dy = MAXS; else if (dy < -MAXS) dy = -MAXS;
  if (dx !== 0) {
    let nx = e.x + dx;
    const y0 = Math.floor(e.y - r + 0.02), y1 = Math.floor(e.y + r - 0.02);
    const tx = dx > 0 ? Math.floor(nx + r) : Math.floor(nx - r);
    for (let ty = y0; ty <= y1; ty++) {
      if (solidAt(G, tx, ty)) {
        blocked |= 1; e.hitTile = ty * G.w + tx;
        nx = dx > 0 ? tx - r - 0.001 : tx + 1 + r + 0.001;
        break;
      }
    }
    e.x = nx;
  }
  if (dy !== 0) {
    let ny = e.y + dy;
    const x0 = Math.floor(e.x - r + 0.02), x1 = Math.floor(e.x + r - 0.02);
    const ty = dy > 0 ? Math.floor(ny + r) : Math.floor(ny - r);
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(G, tx, ty)) {
        blocked |= 2; e.hitTile = ty * G.w + tx;
        ny = dy > 0 ? ty - r - 0.001 : ty + 1 + r + 0.001;
        break;
      }
    }
    e.y = ny;
  }
  return blocked;
}

// If an entity somehow ends up inside a solid tile (e.g. a tile closed on it), nudge it to the nearest open tile.
export function unstick(G, e) {
  const tx = Math.floor(e.x), ty = Math.floor(e.y);
  if (!solidAt(G, tx, ty)) return;
  for (let rad = 1; rad < 6; rad++) {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (!solidAt(G, tx + dx, ty + dy)) { e.x = tx + dx + 0.5; e.y = ty + dy + 0.5; return; }
    }
  }
}

// Line of sight between two world points (Amanatides–Woo DDA). The target tile itself is not tested.
export function los(G, x0, y0, x1, y1) {
  let tx = Math.floor(x0), ty = Math.floor(y0);
  const ex = Math.floor(x1), ey = Math.floor(y1);
  if (tx === ex && ty === ey) return true;
  const dx = x1 - x0, dy = y1 - y0;
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  let tmx = dx !== 0 ? (dx > 0 ? tx + 1 - x0 : x0 - tx) * tdx : Infinity;
  let tmy = dy !== 0 ? (dy > 0 ? ty + 1 - y0 : y0 - ty) * tdy : Infinity;
  for (let n = 0; n < 256; n++) {
    if (tmx < tmy) { tmx += tdx; tx += stepX; } else { tmy += tdy; ty += stepY; }
    if (tx === ex && ty === ey) return true;
    if (solidAt(G, tx, ty)) return false;
  }
  return true;
}

// BFS distance field from a tile, used by enemies to path around walls.
export function computeFlow(G, sx, sy) {
  const { w, h, flow, flowQ } = G;
  flow.fill(-1);
  if (solidAt(G, sx, sy)) return;
  let qh = 0, qt = 0;
  const s = sy * w + sx;
  flow[s] = 0; flowQ[qt++] = s;
  while (qh < qt) {
    const i = flowQ[qh++];
    const x = i % w, y = (i / w) | 0, d = flow[i] + 1;
    if (d > 60) continue;
    if (x > 0) { const j = i - 1; if (flow[j] < 0 && !solidAt(G, x - 1, y)) { flow[j] = d; flowQ[qt++] = j; } }
    if (x < w - 1) { const j = i + 1; if (flow[j] < 0 && !solidAt(G, x + 1, y)) { flow[j] = d; flowQ[qt++] = j; } }
    if (y > 0) { const j = i - w; if (flow[j] < 0 && !solidAt(G, x, y - 1)) { flow[j] = d; flowQ[qt++] = j; } }
    if (y < h - 1) { const j = i + w; if (flow[j] < 0 && !solidAt(G, x, y + 1)) { flow[j] = d; flowQ[qt++] = j; } }
  }
}

const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// Direction toward the flow field's source from world point (x, y). Writes into out {x, y}; returns false if no path.
export function flowDir(G, x, y, out) {
  const tx = Math.floor(x), ty = Math.floor(y);
  const w = G.w;
  const here = G.flow[ty * w + tx];
  if (here < 0) return false;
  let best = here, bx = 0, by = 0;
  for (let k = 0; k < 8; k++) {
    const dx = N8[k][0], dy = N8[k][1];
    const nx = tx + dx, ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= G.h) continue;
    const v = G.flow[ny * w + nx];
    if (v < 0 || v >= best) continue;
    if (dx !== 0 && dy !== 0 && (solidAt(G, tx + dx, ty) || solidAt(G, tx, ty + dy))) continue;
    best = v; bx = dx; by = dy;
  }
  if (bx === 0 && by === 0) return false;
  // Aim at the centre of the next tile so entities don't scrape corners.
  const cx = tx + bx + 0.5 - x, cy = ty + by + 0.5 - y;
  const l = Math.hypot(cx, cy) || 1;
  out.x = cx / l; out.y = cy / l;
  return true;
}

export const FOG_R = 8;
// Recompute visible tiles around the player. Marks seen tiles.
export function updateFog(G) {
  const P = G.P;
  const px = Math.floor(P.x), py = Math.floor(P.y);
  const { w, h, vis, seen } = G;
  for (let i = 0; i < G.visN; i++) vis[G.visList[i]] = 0;
  G.visN = 0;
  const R = FOG_R, R2 = R * R + R * 0.6;
  for (let dy = -R; dy <= R; dy++) {
    const y = py + dy;
    if (y < 0 || y >= h) continue;
    for (let dx = -R; dx <= R; dx++) {
      const x = px + dx;
      if (x < 0 || x >= w || dx * dx + dy * dy > R2) continue;
      if (!los(G, P.x, P.y, x + 0.5, y + 0.5)) continue;
      const i = y * w + x;
      vis[i] = 1; seen[i] = 1;
      G.visList[G.visN++] = i;
    }
  }
  G.fogVersion++;
}

export function revealAll(G) {
  const { w, h, seen } = G;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!solidAt(G, x, y) || G.tiles[i] === T.SECRET || G.tiles[i] === T.DOOR) { seen[i] = 1; continue; }
    for (let k = 0; k < 8 && !seen[i]; k++) {
      const nx = x + N8[k][0], ny = y + N8[k][1];
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !solidAt(G, nx, ny)) seen[i] = 1;
    }
  }
  G.fogVersion++;
  G.fogFull = true;
}
