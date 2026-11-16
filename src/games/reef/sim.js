import { makeRng } from '../../shell/rng.js';
export const SIZE = 5;
export const DIRS = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
export function rotate(mask, turns = 1) {
  turns = (turns % 4 + 4) % 4;
  for (let i = 0; i < turns; i++) mask = mask << 1 & 15 | mask >> 3 & 1;
  return mask;
}
function route(rng) {
  const start = 10,
    finish = 14,
    path = [start],
    seen = new Set(path);
  let budget = 20000;
  function visit(i) {
    if (--budget < 0) return false;
    if (i === finish) return path.length >= 13;
    const x = i % 5,
      y = Math.floor(i / 5);
    for (const [dx, dy] of rng.shuffle(DIRS)) {
      const nx = x + dx,
        ny = y + dy,
        j = ny * 5 + nx;
      if (nx < 0 || nx >= 5 || ny < 0 || ny >= 5 || seen.has(j) || j === finish && path.length < 12) continue;
      seen.add(j);
      path.push(j);
      if (visit(j)) return true;
      path.pop();
      seen.delete(j);
    }
    return false;
  }
  if (visit(start)) return path;
  return [10, 5, 0, 1, 6, 11, 16, 21, 22, 17, 12, 7, 2, 3, 8, 13, 18, 23, 24, 19, 14];
}
function direction(from, to) {
  const dx = to % 5 - from % 5,
    dy = Math.floor(to / 5) - Math.floor(from / 5);
  return DIRS.find(([x, y]) => x === dx && y === dy)[2];
}
export function newGame(seed, level = 1) {
  const rng = makeRng(seed),
    path = route(rng),
    solution = Array.from({
      length: 25
    }, () => rng.pick([3, 5, 6, 9, 10, 12, 7, 11, 13, 14]));
  path.forEach((p, i) => {
    solution[p] = (i === 0 ? 8 : direction(p, path[i - 1])) | (i === path.length - 1 ? 2 : direction(p, path[i + 1]));
  });
  // Later reefs grow side branches. They create alternate routes, never remove the solution.
  if (level >= 3) path.slice(1, -1).forEach(p => {
    if (rng.chance(.2)) solution[p] |= rng.pick([1, 2, 4, 8]);
  });
  const pearls = [.25, .5, .75].map(f => path[Math.floor((path.length - 1) * f)]);
  const tiles = solution.map(m => rotate(m, rng.int(0, 3)));
  const s = {
    v: 1,
    seed,
    level,
    solution,
    tiles,
    pearls,
    moves: 0,
    hints: 0,
    history: [],
    won: false,
    claimed: false
  };
  if (flow(s).solved) s.tiles[10] = rotate(s.tiles[10]);
  return s;
}
export function flow(s) {
  const wet = new Set(),
    queue = [];
  if (s.tiles[10] & 8) {
    wet.add(10);
    queue.push(10);
  }
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k],
      x = i % 5,
      y = Math.floor(i / 5);
    for (const [dx, dy, bit, opposite] of DIRS) {
      if (!(s.tiles[i] & bit)) continue;
      const nx = x + dx,
        ny = y + dy,
        j = ny * 5 + nx;
      if (nx < 0 || nx >= 5 || ny < 0 || ny >= 5 || !(s.tiles[j] & opposite) || wet.has(j)) continue;
      wet.add(j);
      queue.push(j);
    }
  }
  const collected = s.pearls.filter(p => wet.has(p)),
    exit = wet.has(14) && !!(s.tiles[14] & 2);
  return {
    wet,
    collected,
    exit,
    solved: exit && collected.length === 3
  };
}
export function turn(s, index, dir = 1) {
  if (s.won || index < 0 || index >= 25 || !Number.isInteger(index)) return false;
  s.history.push({
    index,
    mask: s.tiles[index]
  });
  if (s.history.length > 150) s.history.shift();
  s.tiles[index] = rotate(s.tiles[index], dir);
  s.moves++;
  s.won = flow(s).solved;
  return true;
}
export function undo(s) {
  const old = s.history.pop();
  if (!old) return false;
  s.tiles[old.index] = old.mask;
  s.moves = Math.max(0, s.moves - 1);
  s.won = false;
  return true;
}
export function hint(s) {
  // Fix a rotated tile at the frontier of the intended solution, working from the source outward.
  const seen = new Set(),
    q = [10];
  while (q.length) {
    const i = q.shift();
    if (seen.has(i)) continue;
    seen.add(i);
    if (s.tiles[i] !== s.solution[i]) return i;
    const x = i % 5,
      y = Math.floor(i / 5);
    for (const [dx, dy, bit, opp] of DIRS) {
      const nx = x + dx,
        ny = y + dy,
        j = ny * 5 + nx;
      if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && s.solution[i] & bit && s.solution[j] & opp) q.push(j);
    }
  }
  return s.tiles.findIndex((m, i) => m !== s.solution[i]);
}
export function applyHint(s) {
  const i = hint(s);
  if (i < 0 || s.won) return -1;
  s.history.push({
    index: i,
    mask: s.tiles[i]
  });
  s.tiles[i] = s.solution[i];
  s.moves++;
  s.hints++;
  s.won = flow(s).solved;
  return i;
}
export function validSave(s) {
  return s?.v === 1 && s.tiles?.length === 25 && s.solution?.length === 25 && s.tiles.every(n => Number.isInteger(n) && n > 0 && n < 16) && s.solution.every(n => Number.isInteger(n) && n > 0 && n < 16) && s.pearls?.length === 3 && Array.isArray(s.history) && Number.isFinite(s.level);
}
