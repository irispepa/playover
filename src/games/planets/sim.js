import { makeRng } from '../../shell/rng.js';
export const SIZE = 4;
export const PLANETS = [{
  value: 2,
  name: 'Moon',
  color: 0xb2bdcf
}, {
  value: 4,
  name: 'Rose',
  color: 0xeaa6b7
}, {
  value: 8,
  name: 'Tide',
  color: 0x75cbd2
}, {
  value: 16,
  name: 'Moss',
  color: 0x92c5a7
}, {
  value: 32,
  name: 'Dune',
  color: 0xe5bd81
}, {
  value: 64,
  name: 'Ember',
  color: 0xec8a68
}, {
  value: 128,
  name: 'Orbit',
  color: 0xd1b1eb
}, {
  value: 256,
  name: 'Glacier',
  color: 0x9dcfee
}, {
  value: 512,
  name: 'Giant',
  color: 0xdea8df
}, {
  value: 1024,
  name: 'Nova',
  color: 0xf1d795
}, {
  value: 2048,
  name: 'Sun',
  color: 0xffe3a0
}];
export const planet = v => PLANETS[Math.min(PLANETS.length - 1, Math.max(0, Math.log2(v) - 1))];
function spawn(s) {
  const rng = makeRng(s.rng),
    free = s.cells.map((v, i) => v ? null : i).filter(i => i !== null);
  if (!free.length) return;
  const i = rng.pick(free);
  s.cells[i] = rng.chance(.9) ? 2 : 4;
  s.rng = rng.state();
  s.lastSpawn = i;
}
export function newGame(seed) {
  const s = {
    v: 1,
    seed,
    rng: seed,
    cells: Array(16).fill(0),
    score: 0,
    moves: 0,
    dust: 2,
    earned: 0,
    lastSpawn: -1,
    history: [],
    over: false,
    won: false
  };
  spawn(s);
  spawn(s);
  return s;
}
export function slideCells(cells, dir) {
  const out = cells.slice(),
    merged = [],
    motions = [];
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const indexes = Array.from({
      length: 4
    }, (_, i) => dir === 'left' ? line * 4 + i : dir === 'right' ? line * 4 + 3 - i : dir === 'up' ? i * 4 + line : (3 - i) * 4 + line);
    const entries = indexes.filter(i => cells[i]).map(i => ({
        value: cells[i],
        from: i
      })),
      values = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i],
        dest = indexes[values.length];
      if (entries[i + 1]?.value === e.value) {
        values.push(e.value * 2);
        score += e.value * 2;
        merged.push(dest);
        motions.push({
          from: e.from,
          to: dest,
          value: e.value
        }, {
          from: entries[i + 1].from,
          to: dest,
          value: e.value
        });
        i++;
      } else {
        values.push(e.value);
        motions.push({
          from: e.from,
          to: dest,
          value: e.value
        });
      }
    }
    indexes.forEach((idx, i) => out[idx] = values[i] || 0);
  }
  return {
    cells: out,
    score,
    merged,
    motions,
    changed: out.some((v, i) => v !== cells[i])
  };
}
export function canMove(s) {
  return ['left', 'right', 'up', 'down'].some(dir => slideCells(s.cells, dir).changed);
}
export function move(s, dir) {
  if (!['left', 'right', 'up', 'down'].includes(dir)) return null;
  const r = slideCells(s.cells, dir);
  if (!r.changed) return null;
  const {
    history,
    ...snapshot
  } = s;
  history.push(JSON.stringify(snapshot));
  if (history.length > 8) history.shift();
  s.cells = r.cells;
  s.score += r.score;
  s.moves++;
  const earned = Math.floor(s.score / 512);
  s.dust = Math.min(5, s.dust + earned - s.earned);
  s.earned = earned;
  spawn(s);
  s.over = !canMove(s);
  return r;
}
export function undo(s) {
  const old = s.history.pop();
  if (!old) return null;
  return {
    ...JSON.parse(old),
    history: s.history
  };
}
export function recycle(s, index) {
  if (s.dust < 1 || !s.cells[index]) return false;
  const {
    history,
    ...snapshot
  } = s;
  history.push(JSON.stringify(snapshot));
  if (history.length > 8) history.shift();
  s.cells[index] = 0;
  s.dust--;
  s.over = false;
  return true;
}
export function validSave(s) {
  return s?.v === 1 && Array.isArray(s.cells) && s.cells.length === 16 && s.cells.every(v => v === 0 || v >= 2 && Number.isInteger(Math.log2(v))) && Array.isArray(s.history) && Number.isFinite(s.rng) && Number.isFinite(s.score);
}
