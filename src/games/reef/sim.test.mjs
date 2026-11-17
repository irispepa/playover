import assert from 'node:assert/strict';
import { newGame, flow, rotate, turn, undo, applyHint, validSave } from './sim.js';
for (let seed = 1; seed <= 500; seed++) {
  const s = newGame(seed, seed % 20 + 1);
  assert(validSave(s));
  assert.deepEqual(s, newGame(seed, seed % 20 + 1));
  assert(!flow(s).solved, 'Fresh puzzle starts unsolved');
  assert.equal(new Set(s.pearls).size, 3);
  assert(flow({
    ...s,
    tiles: s.solution
  }).solved, 'Every generated reef has a solution');
  let n = 0;
  while (!s.won && n++ < 26) assert(applyHint(s) >= 0);
  assert(s.won, 'Hints always reach a solution');
  assert(flow(s).exit);
  assert.equal(flow(s).collected.length, 3);
}
{
  const s = newGame(2),
    before = s.tiles.slice();
  assert(turn(s, 0));
  assert.equal(s.tiles[0], rotate(before[0]));
  assert(undo(s));
  assert.deepEqual(s.tiles, before);
  assert.equal(s.moves, 0);
}
assert.equal(rotate(3, 4), 3);
assert.equal(rotate(3, -1), 9);
console.log('Reef Relay: 500 solvable randomized reefs, guaranteed hint completion, water connectivity, rotations and undo verified.');
