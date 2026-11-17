import assert from 'node:assert/strict';
import { newGame, legalMoves, allMoves, move, chooseAI, remember, undo, validSave, at, kingInDanger } from './sim.js';
let plies = 0,
  wins = 0;
const fingerprints = new Set();
for (let seed = 1; seed <= 80; seed++) {
  const s = newGame(seed);
  assert(validSave(JSON.parse(JSON.stringify(s))));
  assert.deepEqual(s, newGame(seed));
  fingerprints.add(JSON.stringify(s.rules));
  assert.equal(Object.keys(s.known).length, 0);
  assert(allMoves(s, 0).length > 0, 'Every court starts playable');
  for (const [type, usual] of Object.entries({
    rook: 'tower',
    knight: 'horse',
    bishop: 'diagonal',
    king: 'monarch'
  })) assert.notEqual(s.rules[type].move, usual, 'Pieces do not get their standard movement');
  const original = JSON.stringify(s.pieces);
  remember(s);
  const first = allMoves(s, 0)[0];
  assert(move(s, first.id, first.x, first.y));
  const back = undo(s);
  assert.equal(JSON.stringify(back.pieces), original);
  assert(Object.keys(back.known).length > 0, 'Undo preserves discoveries');
  for (let k = 0; k < 100 && s.winner === null; k++) {
    const ms = allMoves(s, s.turn);
    assert(ms.length);
    const m = s.turn === 1 ? chooseAI(s) : ms[(seed + k * 7) % ms.length];
    assert(m);
    assert(move(s, m.id, m.x, m.y));
    plies++;
    const occupied = new Set();
    for (const p of s.pieces) {
      assert(p.x >= 0 && p.x < 6 && p.y >= 0 && p.y < 6);
      const key = p.x + ',' + p.y;
      assert(!occupied.has(key), 'No overlapping pieces');
      occupied.add(key);
    }
    assert(s.pieces.length <= 24);
  }
  if (s.winner !== null) wins++;
}
assert.equal(fingerprints.size, 80);
function scenario(action = 'plain', movement = 'tower') {
  const s = newGame(1);
  s.pieces = [{
    id: 0,
    type: 'rook',
    side: 0,
    x: 1,
    y: 3
  }, {
    id: 1,
    type: 'pawn',
    side: 1,
    x: 1,
    y: 1
  }, {
    id: 2,
    type: 'king',
    side: 0,
    x: 5,
    y: 5
  }, {
    id: 3,
    type: 'king',
    side: 1,
    x: 5,
    y: 0
  }];
  s.rules.rook = {
    move: movement,
    action
  };
  s.traps = [];
  return s;
}
for (const action of ['plain', 'blast', 'return', 'recruit', 'vault', 'swap']) {
  const s = scenario(action);
  assert(move(s, 0, 1, 1));
  if (action === 'return') assert.equal(at(s, 1, 3)?.id, 0);
  if (action === 'recruit') assert.equal(at(s, 1, 3)?.side, 0);
  if (action === 'vault') assert.equal(at(s, 1, 0)?.id, 0);
}
{
  const s = scenario('plain', 'cannon');
  assert(!legalMoves(s, s.pieces[0]).some(m => m.x === 1 && m.y === 1));
  s.pieces.push({
    id: 9,
    type: 'pawn',
    side: 0,
    x: 1,
    y: 2
  });
  assert(legalMoves(s, s.pieces[0]).some(m => m.x === 1 && m.y === 1));
}
{
  const s = scenario();
  s.rules.king = {
    move: 'monarch',
    action: 'plain'
  };
  s.traps = [{
    x: 4,
    y: 5,
    kind: 'pit',
    revealed: false
  }];
  assert(move(s, 2, 4, 5));
  assert.equal(s.ward[0], false);
  assert(s.pieces.some(p => p.id === 2));
  s.turn = 0;
  assert(move(s, 2, 5, 5));
  s.turn = 0;
  assert(move(s, 2, 4, 5));
  assert.equal(s.winner, 1);
}
{
  const s = scenario();
  s.rules.rook.action = 'swap';
  s.pieces[1].side = 0;
  assert(move(s, 0, 1, 1));
  assert.equal(at(s, 1, 3).id, 1);
}
{
  const s = scenario();
  s.pieces[1].type = 'king';
  assert(!legalMoves(s, s.pieces[0]).some(m => m.x === 1 && m.y === 1), 'Royal truce blocks early king captures');
  s.ply = 6;
  assert(legalMoves(s, s.pieces[0]).some(m => m.x === 1 && m.y === 1));
}
{
  const s = scenario();
  s.ply = 6;
  s.pieces[0].side = 1;
  s.rules.rook.action = 'blast';
  s.pieces[1].side = 0;
  s.pieces[2].x = 2;
  s.pieces[2].y = 1;
  assert(kingInDanger(s, 0), 'Blast danger is announced');
}
console.log(`Odd Crown: 80 unique courts, ${plies} legal plies, ${wins} finished games; powers, cannon, trapdoor and undo verified.`);
