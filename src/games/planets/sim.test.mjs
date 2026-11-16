import assert from 'node:assert/strict';
import { newGame, slideCells, move, undo, recycle, canMove, validSave } from './sim.js';
const board = row => [...row, ...Array(12).fill(0)];
assert.deepEqual(slideCells(board([2, 2, 2, 2]), 'left').cells.slice(0, 4), [4, 4, 0, 0]);
assert.deepEqual(slideCells(board([2, 2, 4, 0]), 'left').cells.slice(0, 4), [4, 4, 0, 0], 'One merge per tile');
assert.deepEqual(slideCells(board([2, 0, 2, 4]), 'right').cells.slice(0, 4), [0, 0, 4, 4]);
const vertical = Array(16).fill(0);
vertical[0] = 2;
vertical[4] = 2;
assert.equal(slideCells(vertical, 'down').cells[12], 4);
for (let seed = 1; seed <= 100; seed++) {
  const s = newGame(seed);
  assert.deepEqual(s, newGame(seed));
  assert(validSave(s));
  for (let i = 0; i < 150 && !s.over; i++) {
    const dirs = ['left', 'up', 'right', 'down'];
    const legal = dirs.filter(d => slideCells(s.cells, d).changed);
    if (!legal.length) break;
    const before = JSON.parse(JSON.stringify(s));
    assert(move(s, legal[i % legal.length]));
    assert(validSave(JSON.parse(JSON.stringify(s))));
    assert(s.cells.every(v => v === 0 || Number.isInteger(Math.log2(v))));
    if (i === 0) {
      const restored = undo(s);
      assert.deepEqual(restored, before);
      move(s, legal[i % legal.length]);
    }
  }
}
{
  const s = newGame(5),
    i = s.cells.findIndex(Boolean),
    before = s.cells[i];
  assert(recycle(s, i));
  assert.equal(s.cells[i], 0);
  assert.equal(s.dust, 1);
  assert.equal(undo(s).cells[i], before);
}
{
  const s = newGame(5);
  s.cells = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  assert(!canMove(s));
  s.dust = 0;
  assert(!recycle(s, 0));
}
console.log('Pocket Planets: merges, directionality, deterministic runs, recycling, game-over and exact undo verified across 100 seeds.');
