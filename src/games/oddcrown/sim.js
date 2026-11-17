import { makeRng } from '../../shell/rng.js';
export const SIZE = 6;
export const TYPES = ['rook', 'knight', 'queen', 'king', 'bishop', 'pawn'];
export const NAMES = {
  rook: 'Rook',
  knight: 'Knight',
  queen: 'Queen',
  king: 'King',
  bishop: 'Bishop',
  pawn: 'Pawn'
};
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]],
  DIAG = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const CAMEL = [[1, 3], [3, 1], [-1, 3], [-3, 1], [1, -3], [3, -1], [-1, -3], [-3, -1]];
export const MOVES = {
  tower: {
    name: 'Tower feet',
    text: 'Slide any distance in a straight line. Pieces block the path.',
    vectors: ORTH,
    range: 5
  },
  diagonal: {
    name: 'Bishop slippers',
    text: 'Slide diagonally any distance. Pieces block the path.',
    vectors: DIAG,
    range: 5
  },
  horse: {
    name: 'Borrowed horse',
    text: 'Jump in an L: two squares one way, one sideways. Jump over pieces.',
    vectors: KNIGHT,
    range: 1,
    leap: true
  },
  camel: {
    name: 'Long-legged camel',
    text: 'Jump three squares one way and one sideways, over any pieces.',
    vectors: CAMEL,
    range: 1,
    leap: true
  },
  monarch: {
    name: 'Tiny footsteps',
    text: 'Move one square in any direction.',
    vectors: [...ORTH, ...DIAG],
    range: 1
  },
  empress: {
    name: 'Pocket empress',
    text: 'Slide up to two squares straight or diagonally. Pieces block the path.',
    vectors: [...ORTH, ...DIAG],
    range: 2
  },
  frog: {
    name: 'Frog boots',
    text: 'Jump exactly two squares straight or diagonally, over any pieces.',
    vectors: [...ORTH, ...DIAG].map(([x, y]) => [x * 2, y * 2]),
    range: 1,
    leap: true
  },
  crab: {
    name: 'Crab shuffle',
    text: 'Step sideways, or jump two squares forward. Gold goes toward rank 6.',
    vectors: [[1, 0], [-1, 0], [0, -2]],
    range: 1,
    leap: true,
    relative: true
  },
  comet: {
    name: 'Comet rider',
    text: 'Ride one or two knight jumps in the same direction. An occupied landing stops the ride.',
    vectors: KNIGHT,
    range: 2,
    leap: true
  },
  cannon: {
    name: 'Cannon manners',
    text: 'Slide straight through empty squares. To capture, jump over exactly one piece.',
    vectors: ORTH,
    range: 5,
    cannon: true
  },
  helicopter: {
    name: 'Helicopter hat',
    text: 'Step diagonally, or jump exactly three squares straight.',
    vectors: [...DIAG, ...ORTH.map(([x, y]) => [x * 3, y * 3])],
    range: 1,
    leap: true
  },
  zigzag: {
    name: 'Drunken royal',
    text: 'Jump in an L, or step one square straight.',
    vectors: [...KNIGHT, ...ORTH],
    range: 1,
    leap: true
  }
};
export const ACTIONS = {
  plain: {
    name: 'Simple appetite',
    text: 'Capture by landing on a rival.'
  },
  blast: {
    name: 'Party popper',
    text: 'A capture also removes adjacent rivals, including the rival king. Your pieces are safe.'
  },
  return: {
    name: 'Boomerang',
    text: 'After a capture, return to the square you came from.'
  },
  recruit: {
    name: 'Persuasive speech',
    text: 'A captured non-king joins your team on the square you came from. Kings are still captured.'
  },
  vault: {
    name: 'Victory hop',
    text: 'After a capture, hop one extra square in the same direction if it is empty.'
  },
  swap: {
    name: 'Musical chairs',
    text: 'Capture rivals normally. You may also trade places with an ally, including your king.'
  }
};
export const at = (s, x, y) => s.pieces.find(p => p.x === x && p.y === y);
export const inside = (x, y) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;
export const square = (x, y) => `${'abcdef'[x]}${6 - y}`;
export function newGame(seed) {
  const rng = makeRng(seed),
    moves = rng.shuffle(Object.keys(MOVES)),
    actions = rng.shuffle(Object.keys(ACTIONS));
  const usual = {
    rook: 'tower',
    knight: 'horse',
    bishop: 'diagonal',
    king: 'monarch'
  };
  const rules = Object.fromEntries(TYPES.map((t, i) => {
    const index = moves.findIndex(m => m !== usual[t]);
    return [t, {
      move: moves.splice(index, 1)[0],
      action: actions[i]
    }];
  }));
  const pieces = [];
  let id = 0;
  for (const side of [0, 1]) {
    const y = side === 0 ? 5 : 0;
    ['rook', 'knight', 'queen', 'king', 'bishop', 'rook'].forEach((type, x) => pieces.push({
      id: id++,
      type,
      side,
      x,
      y
    }));
    for (let x = 0; x < 6; x++) pieces.push({
      id: id++,
      type: 'pawn',
      side,
      x,
      y: side === 0 ? 4 : 1
    });
  }
  const cells = rng.shuffle(Array.from({
    length: 12
  }, (_, i) => ({
    x: i % 6,
    y: 2 + Math.floor(i / 6)
  })));
  return {
    v: 1,
    seed,
    rules,
    pieces,
    known: {},
    traps: ['pit', 'spring', 'party'].map((kind, i) => ({
      ...cells[i],
      kind,
      revealed: false
    })),
    ward: [true, true],
    turn: 0,
    ply: 0,
    winner: null,
    claimed: false,
    insights: 3,
    log: ['A fresh court. Nobody read the rulebook.'],
    history: []
  };
}
export function legalMoves(s, p) {
  if (!p) return [];
  const rule = s.rules[p.type],
    m = MOVES[rule.move],
    out = [];
  for (const [dx, baseY] of m.vectors) {
    const dy = m.relative && p.side === 1 ? -baseY : baseY;
    let screen = false;
    for (let k = 1; k <= m.range; k++) {
      const x = p.x + dx * k,
        y = p.y + dy * k;
      if (!inside(x, y)) break;
      const target = at(s, x, y);
      const protectedKing = target?.type === 'king' && target.side !== p.side && s.ply < 6;
      if (m.cannon) {
        if (!screen) {
          if (!target) out.push({
            x,
            y
          });else {
            if (target.side === p.side && rule.action === 'swap') out.push({
              x,
              y
            });
            screen = true;
          }
        } else if (target) {
          if (!protectedKing && (target.side !== p.side || rule.action === 'swap')) out.push({
            x,
            y
          });
          break;
        }
      } else {
        if (!protectedKing && (!target || target.side !== p.side || rule.action === 'swap')) out.push({
          x,
          y
        });
        if (target) break;
      }
    }
  }
  return out;
}
export function allMoves(s, side) {
  return s.pieces.filter(p => p.side === side).flatMap(p => legalMoves(s, p).map(to => ({
    id: p.id,
    ...to
  })));
}
export function kingInDanger(s, side) {
  const king = s.pieces.find(p => p.side === side && p.type === 'king');
  if (!king || s.ply < 6) return false;
  return allMoves(s, 1 - side).some(m => {
    if (m.x === king.x && m.y === king.y) return true;
    const attacker = s.pieces.find(p => p.id === m.id),
      target = at(s, m.x, m.y);
    return target?.side === side && s.rules[attacker.type].action === 'blast' && Math.max(Math.abs(m.x - king.x), Math.abs(m.y - king.y)) <= 1;
  });
}
function addLog(s, t) {
  s.log.push(t);
  s.log = s.log.slice(-8);
}
function remove(s, p) {
  s.pieces = s.pieces.filter(q => q.id !== p.id);
}
export function reveal(s, type) {
  if (s.known[type]) return false;
  s.known[type] = true;
  return true;
}
function trap(s, p) {
  const t = s.traps.find(t => t.x === p.x && t.y === p.y);
  if (!t) return;
  t.revealed = true;
  if (t.kind === 'pit') {
    if (p.type !== 'king') {
      addLog(s, `${square(p.x, p.y)} has a royal trapdoor. Non-kings just step over it.`);
      return;
    }
    if (s.ward[p.side]) {
      s.ward[p.side] = false;
      addLog(s, 'The king fell through the floor! The emergency parachute saved him. This trapdoor is now marked.');
    } else {
      remove(s, p);
      addLog(s, 'The king ignored the trapdoor sign. Down he goes.');
    }
  } else if (t.kind === 'spring') {
    const free = [];
    for (let x = 0; x < 6; x++) for (const y of [0, 5]) if (!at(s, x, y)) free.push({
      x,
      y
    });
    if (free.length) {
      const to = free[(s.seed + s.ply) % free.length];
      p.x = to.x;
      p.y = to.y;
      addLog(s, `Boing! A hidden spring launched the ${NAMES[p.type].toLowerCase()} to ${square(p.x, p.y)}.`);
    } else addLog(s, 'The hidden spring squeaks. Both edges are full.');
  } else {
    const victims = s.pieces.filter(q => q.side !== p.side && (q.type !== 'king' || s.ply >= 6) && Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)) <= 1);
    victims.forEach(q => remove(s, q));
    addLog(s, `Surprise confetti cannon! ${victims.length ? `${victims.length} nearby rival${victims.length === 1 ? '' : 's'} swept away.` : 'Nobody nearby. Awkward.'}`);
  }
}
function updateWinner(s) {
  const ours = s.pieces.some(p => p.side === 0 && p.type === 'king'),
    theirs = s.pieces.some(p => p.side === 1 && p.type === 'king');
  if (!ours || !theirs) s.winner = ours ? 0 : 1;
}
export function move(s, id, x, y) {
  if (s.winner !== null) return false;
  const p = s.pieces.find(p => p.id === id);
  if (!p || p.side !== s.turn || !legalMoves(s, p).some(m => m.x === x && m.y === y)) return false;
  const origin = {
      x: p.x,
      y: p.y
    },
    target = at(s, x, y),
    rule = s.rules[p.type];
  reveal(s, p.type);
  p.x = x;
  p.y = y;
  let desc = `${p.side === 0 ? 'Gold' : 'Blue'} ${NAMES[p.type].toLowerCase()} to ${square(x, y)}.`;
  if (target && target.side === p.side) {
    target.x = origin.x;
    target.y = origin.y;
    desc += ' Musical chairs!';
  } else if (target) {
    remove(s, target);
    desc += ` Took ${NAMES[target.type].toLowerCase()}.`;
    if (rule.action === 'blast') {
      s.pieces.filter(q => q.side !== p.side && (q.type !== 'king' || s.ply >= 6) && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 1).forEach(q => remove(s, q));
      desc += ' Party popper!';
    }
    if (rule.action === 'return') {
      p.x = origin.x;
      p.y = origin.y;
      desc += ' Boomerang return.';
    }
    if (rule.action === 'recruit' && target.type !== 'king') {
      s.pieces.push({
        ...target,
        side: p.side,
        ...origin
      });
      desc += ' Recruited to the court.';
    }
    if (rule.action === 'vault') {
      const nx = x + Math.sign(x - origin.x),
        ny = y + Math.sign(y - origin.y);
      if (inside(nx, ny) && !at(s, nx, ny)) {
        p.x = nx;
        p.y = ny;
        desc += ' Victory hop!';
      }
    }
    if (p.side === 0) s.insights = Math.min(5, s.insights + 1);
  }
  addLog(s, desc);
  trap(s, p);
  s.ply++;
  s.turn = 1 - s.turn;
  updateWinner(s);
  if (s.winner === null && !allMoves(s, s.turn).length) {
    s.turn = 1 - s.turn;
    addLog(s, 'No available moves. The court passes.');
    if (!allMoves(s, s.turn).length) s.winner = 2;
  }
  if (s.ply % 6 === 0) s.insights = Math.min(5, s.insights + 1);
  if (s.ply >= 160 && s.winner === null) {
    s.winner = 2;
    addLog(s, 'A peaceful stalemate after 80 rounds.');
  }
  return true;
}
export function remember(s) {
  const {
    history,
    ...snapshot
  } = s;
  history.push(JSON.stringify(snapshot));
  if (history.length > 3) history.shift();
}
export function undo(s) {
  const prev = s.history.pop();
  if (!prev) return null;
  const restored = JSON.parse(prev);
  restored.history = s.history;
  restored.known = {
    ...s.known,
    ...restored.known
  };
  restored.claimed = s.claimed || false;
  restored.traps.forEach(t => {
    if (s.traps.some(q => q.x === t.x && q.y === t.y && q.revealed)) t.revealed = true;
  });
  addLog(restored, 'Time rewound. Your discoveries stay with you.');
  return restored;
}
const VALUE = {
  king: 1000,
  queen: 8,
  rook: 6,
  bishop: 5,
  knight: 5,
  pawn: 2
};
export function chooseAI(s) {
  const rng = makeRng(s.seed + s.ply * 179),
    options = allMoves(s, 1);
  let best = null,
    score = -Infinity;
  for (const m of options) {
    const copy = JSON.parse(JSON.stringify({
      ...s,
      history: []
    }));
    copy.traps = copy.traps.filter(t => t.revealed);
    const p = copy.pieces.find(p => p.id === m.id),
      before = copy.pieces.filter(p => p.side === 0).reduce((v, p) => v + VALUE[p.type], 0);
    move(copy, m.id, m.x, m.y);
    let n = (before - copy.pieces.filter(p => p.side === 0).reduce((v, p) => v + VALUE[p.type], 0)) * 2 + rng.float(0, 4);
    if (copy.winner === 1) n += 10000;
    if (copy.winner === 0) n -= 10000;
    const enemyKing = copy.pieces.find(p => p.side === 0 && p.type === 'king');
    if (enemyKing) n += (6 - Math.hypot(p.x - enemyKing.x, p.y - enemyKing.y)) * .2;
    // A forgiving opponent: only considers immediate replies, and occasionally misses danger.
    if (rng.chance(.8) && copy.winner === null) {
      const replies = allMoves(copy, 0);
      if (replies.some(r => {
        const q = at(copy, r.x, r.y);
        return q?.side === 1 && q.type === 'king';
      })) n -= 450;
      if (replies.some(r => r.x === p.x && r.y === p.y)) n -= VALUE[p.type] * .7;
    }
    if (n > score) {
      score = n;
      best = m;
    }
  }
  return best;
}
export function validSave(s) {
  return s?.v === 1 && Array.isArray(s.pieces) && s.pieces.length <= 36 && s.rules && TYPES.every(t => MOVES[s.rules[t]?.move] && ACTIONS[s.rules[t]?.action]) && Array.isArray(s.traps) && Array.isArray(s.history) && [0, 1].includes(s.turn);
}
