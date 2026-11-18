// How to play cards for Odd Crown. Art is flat SVG in the board's own colours (see render.js).
const GOLD = '#e9c78d', GOLD_EDGE = '#9a7843', BLUE = '#80bada', BLUE_EDGE = '#3d6684';
const LIGHT = '#a7b2bf', DARK = '#58677e', FRAME = '#131c30', DOT = '#ffde91', RING = '#ffdf9d', MISS = '#e07d97';
const SPRING = '#51dbbb', PARTY = '#e9baef', PIT = '#9c4260';

// Checkered board patch with a dark frame; returns the SVG and a tile-centre lookup.
function board(cols, rows, x0, y0, s) {
  let out = `<rect x="${x0 - 3}" y="${y0 - 3}" width="${cols * s + 6}" height="${rows * s + 6}" rx="5" fill="${FRAME}"/>`;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    out += `<rect x="${x0 + x * s + .6}" y="${y0 + y * s + .6}" width="${s - 1.2}" height="${s - 1.2}" rx="2" fill="${(x + y) % 2 ? DARK : LIGHT}"/>`;
  }
  return { svg: out, c: (x, y) => [x0 + x * s + s / 2, y0 + y * s + s / 2] };
}

// Side-on piece silhouette standing on (x, y). Shapes echo the 3D models in render.js.
const TOPS = {
  pawn: '<circle cy="-24" r="5.5"/>',
  rook: '<path d="M-7 -19 V-31 H-4 V-28 H-1.5 V-31 H1.5 V-28 H4 V-31 H7 V-19 Z"/>',
  bishop: '<path d="M0 -34 C6 -28 7 -22 0 -19 C-7 -22 -6 -28 0 -34 Z"/><circle cy="-35.5" r="2.2"/>',
  knight: '<path d="M-5 -19 L-6.5 -27 Q-5.5 -34 1.5 -35 L3 -38 L4.5 -34 L8.5 -29 L6.5 -25.5 L1.5 -27 L4.5 -19 Z"/>',
  queen: '<path d="M-6.5 -19 L-8.5 -30 L-4 -25 L0 -32 L4 -25 L8.5 -30 L6.5 -19 Z"/>',
  king: '<rect x="-6" y="-28" width="12" height="9" rx="2"/><path d="M-1.6 -37 H1.6 V-34.5 H4.5 V-31.5 H1.6 V-28 H-1.6 V-31.5 H-4.5 V-34.5 H-1.6 Z"/>',
};
function piece(type, x, y, side = 0, k = 1, extra = '') {
  const fill = side ? BLUE : GOLD, edge = side ? BLUE_EDGE : GOLD_EDGE;
  return `<g transform="translate(${x} ${y}) scale(${k})${extra}">`
    + '<ellipse rx="11" ry="3" fill="#101629" opacity=".35"/>'
    + `<g fill="${fill}" stroke="${edge}" stroke-width="1.3" stroke-linejoin="round">`
    + '<rect x="-10" y="-5.5" width="20" height="5.5" rx="2"/><path d="M-6 -5.5 L-3.5 -17 H3.5 L6 -5.5 Z"/>'
    + `<rect x="-7.5" y="-19.5" width="15" height="3" rx="1.5"/>${TOPS[type]}</g></g>`;
}
const arrowHead = (id, color) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${color}"/></marker></defs>`;
const svg = (body) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

function captureArt() {
  const b = board(6, 3, 28, 26, 24);
  const [qx, qy] = b.c(1, 2), [kx, ky] = b.c(4, 0);
  const sparks = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = i * Math.PI / 4, r1 = 15, r2 = 21, cx = kx, cy = ky - 6;
    return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}"/>`;
  }).join('');
  return svg(arrowHead('oc-a1', DOT) + b.svg
    + `<g stroke="${DOT}" stroke-width="2.4" stroke-linecap="round">${sparks}</g>`
    + piece('king', kx + 2, ky + 8, 1, .95, ' rotate(28)')
    + `<path d="M${qx + 10} ${qy - 22} Q${qx + 30} ${ky - 26} ${kx - 16} ${ky - 6}" fill="none" stroke="${DOT}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 6" marker-end="url(#oc-a1)"/>`
    + piece('queen', qx, qy + 8, 0, 1));
}

function question(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="11" fill="#2b3850" stroke="${DOT}" stroke-width="1.6"/>`
    + `<path d="M${cx - 3.5} ${cy - 3} a3.5 3.5 0 1 1 3.5 3.5 v2.5" fill="none" stroke="${DOT}" stroke-width="2.3" stroke-linecap="round"/>`
    + `<circle cx="${cx}" cy="${cy + 7}" r="1.5" fill="${DOT}"/>`;
}
function secretArt() {
  const b = board(3, 1, 49, 60, 34);
  const xs = [0, 1, 2].map((i) => b.c(i, 0));
  return svg(arrowHead('oc-a2', DOT) + b.svg
    + ['rook', 'knight', 'bishop'].map((t, i) => piece(t, xs[i][0], xs[i][1] + 10, 0, 1)).join('')
    + xs.map(([x]) => question(x, 26)).join('')
    + `<path d="M70 106 Q100 118 130 106" fill="none" stroke="${DOT}" stroke-width="2.2" stroke-linecap="round" marker-start="url(#oc-a2)" marker-end="url(#oc-a2)"/>`);
}

function cross(x, y) {
  return `<g stroke="${MISS}" stroke-width="3" stroke-linecap="round"><line x1="${x - 5}" y1="${y - 5}" x2="${x + 5}" y2="${y + 5}"/><line x1="${x + 5}" y1="${y - 5}" x2="${x - 5}" y2="${y + 5}"/></g>`;
}
function finger(x, y) {
  // Index fingertip at (x, y), hand trailing down and right.
  return `<g transform="translate(${x} ${y}) rotate(-28)" fill="#f2dcc2" stroke="${FRAME}" stroke-width="1.4" stroke-linejoin="round">`
    + '<path d="M-5 26 V4 a5 5 0 0 1 10 0 V18 h4 a4 4 0 0 1 4 4 v4 h3 a4 4 0 0 1 4 4 v10 a12 12 0 0 1 -12 12 h-4 a12 12 0 0 1 -12 -12 Z"/></g>';
}
function testArt() {
  const b = board(5, 3, 40, 22, 24);
  const [px, py] = b.c(1, 2), [m1x, m1y] = b.c(1, 0), [m2x, m2y] = b.c(3, 2), [tx, ty] = b.c(3, 0);
  return svg(b.svg
    + `<ellipse cx="${px}" cy="${py + 6}" rx="13" ry="5" fill="none" stroke="${RING}" stroke-width="2.2"/>`
    + piece('bishop', px, py + 6, 0, .9)
    + cross(m1x, m1y) + cross(m2x, m2y)
    + `<circle cx="${tx}" cy="${ty}" r="7" fill="none" stroke="${DOT}" stroke-width="2"/><circle cx="${tx}" cy="${ty}" r="12" fill="none" stroke="${DOT}" stroke-width="1.4" opacity=".55"/>`
    + finger(tx, ty));
}

function eye(cx, cy) {
  return `<path d="M${cx - 14} ${cy} Q${cx} ${cy - 12} ${cx + 14} ${cy} Q${cx} ${cy + 12} ${cx - 14} ${cy} Z" fill="#2b3850" stroke="${DOT}" stroke-width="2"/>`
    + `<circle cx="${cx}" cy="${cy}" r="4.2" fill="${DOT}"/>`
    + `<g stroke="${DOT}" stroke-width="1.8" stroke-linecap="round"><line x1="${cx}" y1="${cy - 12}" x2="${cx}" y2="${cy - 16}"/><line x1="${cx - 10}" y1="${cy - 9}" x2="${cx - 13}" y2="${cy - 12}"/><line x1="${cx + 10}" y1="${cy - 9}" x2="${cx + 13}" y2="${cy - 12}"/></g>`;
}
function peekArt() {
  const b = board(6, 3, 28, 38, 24);
  const [gx, gy] = b.c(1, 1), [bx, by] = b.c(4, 1), [ox, oy] = b.c(5, 2);
  const dots = [[0, 0], [2, 0], [0, 2], [2, 2]].map(([x, y]) => {
    const [cx, cy] = b.c(x, y);
    return `<circle cx="${cx}" cy="${cy}" r="3.6" fill="${DOT}"/>`;
  }).join('');
  return svg(arrowHead('oc-a4', BLUE) + b.svg + dots
    + piece('knight', gx, gy + 7, 0, .9) + eye(gx, 18)
    + `<ellipse cx="${ox}" cy="${oy + 3}" rx="9" ry="3.5" fill="none" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="2.5 2.5"/>`
    + `<path d="M${ox - 3} ${oy - 2} L${bx + 9} ${by + 3}" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 5" marker-end="url(#oc-a4)"/>`
    + piece('knight', bx, by + 7, 1, .9));
}

function floorArt() {
  const b = board(3, 1, 40, 70, 40);
  const [sx, sy] = b.c(0, 0), [cx, cy] = b.c(1, 0), [tx, ty] = b.c(2, 0);
  const diamond = (x, y, c) => `<path d="M${x} ${y - 10} L${x + 10} ${y} L${x} ${y + 10} L${x - 10} ${y} Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`;
  const bits = [[-16, -28, GOLD], [14, -32, SPRING], [-6, -42, PARTY], [20, -16, PARTY], [-22, -12, SPRING], [6, -24, GOLD], [-12, -50, GOLD], [16, -46, PARTY]]
    .map(([dx, dy, c], i) => `<rect x="${cx + dx - 2.5}" y="${cy + dy - 1.5}" width="5" height="3" rx="1" fill="${c}" transform="rotate(${i * 37} ${cx + dx} ${cy + dy})"/>`).join('');
  return svg(b.svg
    // Spring: launches a piece away.
    + diamond(sx, sy, SPRING)
    + `<polyline points="${sx} ${sy - 12} ${sx - 6} ${sy - 17} ${sx + 6} ${sy - 22} ${sx - 6} ${sy - 27} ${sx + 6} ${sy - 32} ${sx} ${sy - 37}" fill="none" stroke="${SPRING}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`
    + piece('pawn', sx, sy - 42, 0, .8)
    // Confetti cannon: sweeps nearby rivals.
    + diamond(cx, cy, PARTY) + bits
    + `<g stroke="${PARTY}" stroke-width="2" stroke-linecap="round"><line x1="${cx}" y1="${cy - 12}" x2="${cx}" y2="${cy - 20}"/><line x1="${cx - 9}" y1="${cy - 9}" x2="${cx - 14}" y2="${cy - 15}"/><line x1="${cx + 9}" y1="${cy - 9}" x2="${cx + 14}" y2="${cy - 15}"/></g>`
    // Trapdoor: only kings fall; the first fall has a parachute.
    + `<ellipse cx="${tx}" cy="${ty + 2}" rx="13" ry="7" fill="#0b1020" stroke="${PIT}" stroke-width="3"/>`
    + `<path d="M${tx - 15} ${ty - 54} Q${tx} ${ty - 80} ${tx + 15} ${ty - 54} Q${tx + 7.5} ${ty - 58} ${tx} ${ty - 54} Q${tx - 7.5} ${ty - 58} ${tx - 15} ${ty - 54} Z" fill="#c9d3e3" stroke="${FRAME}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<g stroke="#c9d3e3" stroke-width="1"><line x1="${tx - 15}" y1="${ty - 54}" x2="${tx - 3}" y2="${ty - 38}"/><line x1="${tx + 15}" y1="${ty - 54}" x2="${tx + 3}" y2="${ty - 38}"/></g>`
    + piece('king', tx, ty - 8, 0, .8));
}

export const GUIDE_PAGES = [
  { title: 'Capture the blue king', art: captureArt(), points: ['You are gold. Take the blue king to win.'] },
  { title: 'Every rule is secret', art: secretArt(), points: ['Each piece type’s move and capture power is secret, reshuffled every court.'] },
  { title: 'Tap, then test', art: testArt(), points: ['Tap a gold piece, then a square. Misses cost no turn.', 'Two misses reveal its rule.'] },
  { title: 'Peek or watch', art: peekArt(), points: ['Peek spends 1 insight to reveal a piece’s rule.', 'Blue’s moves reveal rules too.'] },
  { title: 'Watch your step', art: floorArt(), points: ['Hidden tiles: a spring, a confetti cannon, a king’s trapdoor.'] },
];

// "More tips": optional extra cards, offered from the last How to play card.
const label = (x, y, t, size = 15) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" font-weight="bold" fill="${DOT}">${t}</text>`;

function truceArt() {
  const b = board(5, 2, 40, 48, 24);
  const [gx, gy] = b.c(0, 1), [kx, ky] = b.c(4, 0);
  const shield = `<path d="M${kx} ${ky - 40} L${kx + 15} ${ky - 34} V${ky - 20} Q${kx + 15} ${ky - 4} ${kx} ${ky + 4} Q${kx - 15} ${ky - 4} ${kx - 15} ${ky - 20} V${ky - 34} Z" fill="${RING}" fill-opacity=".18" stroke="${RING}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const pips = [0, 1, 2].map((i) => `<circle cx="${82 + i * 18}" cy="22" r="6" fill="${DOT}"/>`).join('');
  return svg(arrowHead('oc-b1', MISS) + b.svg + pips
    + `<path d="M${gx + 12} ${gy - 18} Q${(gx + kx) / 2} ${ky - 34} ${kx - 20} ${ky - 18}" fill="none" stroke="${MISS}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 6" marker-end="url(#oc-b1)"/>`
    + piece('king', gx, gy + 8, 0, .9) + shield + piece('king', kx, ky + 8, 1, .9));
}

function insightArt() {
  const b = board(2, 1, 22, 72, 30);
  const [qx, qy] = b.c(0, 0), [px, py] = b.c(1, 0);
  const sparks = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = i * Math.PI / 3 + .3, cx = px, cy = py - 8;
    return `<line x1="${cx + Math.cos(a) * 12}" y1="${cy + Math.sin(a) * 12}" x2="${cx + Math.cos(a) * 17}" y2="${cy + Math.sin(a) * 17}"/>`;
  }).join('');
  const coins = [0, 1, 2, 3, 4].map((i) => `<circle cx="${64 + i * 18}" cy="18" r="6.5" fill="${i < 4 ? DOT : 'none'}" stroke="${DOT}" stroke-width="1.8"/>`).join('');
  const rounds = [0, 1, 2].map((i) => `<circle cx="${130 + i * 18}" cy="88" r="6" fill="${DOT}"/>`).join('');
  return svg(coins
    + b.svg + `<g stroke="${DOT}" stroke-width="2.2" stroke-linecap="round">${sparks}</g>`
    + piece('pawn', px + 2, py + 6, 1, .8, ' rotate(30)') + piece('queen', qx, qy + 7, 0, .85)
    + label(52, 56, '+1', 17)
    + `<path d="M124 100 Q148 108 172 100" fill="none" stroke="${DOT}" stroke-width="1.8" stroke-linecap="round"/>`
    + rounds + label(148, 66, '+1', 17));
}

function dotsArt() {
  const b = board(6, 3, 28, 26, 24);
  const [rx, ry] = b.c(1, 1), [kx, ky] = b.c(4, 1);
  const dots = [[0, 1], [2, 1], [3, 1], [1, 2]].map(([x, y]) => {
    const [cx, cy] = b.c(x, y);
    return `<circle cx="${cx}" cy="${cy}" r="3.6" fill="${DOT}"/>`;
  }).join('');
  return svg(b.svg + dots
    + `<ellipse cx="${rx}" cy="${ry + 6}" rx="13" ry="5" fill="none" stroke="${RING}" stroke-width="2.2"/>`
    + piece('rook', rx, ry + 6, 1, .9)
    + `<ellipse cx="${kx}" cy="${ky + 6}" rx="13" ry="5" fill="none" stroke="${MISS}" stroke-width="2.2"/>`
    + `<circle cx="${kx}" cy="${ky}" r="3.6" fill="${DOT}"/>`
    + piece('king', kx, ky + 6, 0, .9)
    + `<g fill="${MISS}"><rect x="${kx + 13}" y="${ky - 34}" width="4" height="11" rx="2"/><circle cx="${kx + 15}" cy="${ky - 18}" r="2.2"/></g>`);
}

function notebookArt() {
  const PAGE = '#efe4cc', INK = '#5d6c84';
  const lines = (x, y, n) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * 9}" width="${i === n - 1 ? 30 : 44}" height="3" rx="1.5" fill="${INK}" opacity=".55"/>`).join('');
  return svg(`<path d="M28 26 Q64 18 100 28 Q136 18 172 26 V104 Q136 96 100 106 Q64 96 28 104 Z" fill="${FRAME}"/>`
    + `<path d="M34 28 Q66 22 98 31 V100 Q66 92 34 98 Z" fill="${PAGE}" stroke="${GOLD_EDGE}" stroke-width="1.2"/>`
    + `<path d="M102 31 Q134 22 166 28 V98 Q134 92 102 100 Z" fill="${PAGE}" stroke="${GOLD_EDGE}" stroke-width="1.2"/>`
    + piece('knight', 66, 62, 0, .8) + lines(44, 72, 3)
    + question(134, 50) + lines(112, 72, 3));
}

function undoArt() {
  const b = board(5, 2, 40, 58, 24);
  const [ox, oy] = b.c(1, 1), [nx, ny] = b.c(3, 0);
  return svg(arrowHead('oc-b5', DOT) + b.svg + eye(100, 24)
    + `<g opacity=".38">${piece('bishop', nx, ny + 6, 0, .85)}</g>`
    + piece('bishop', ox, oy + 6, 0, .85)
    + `<path d="M${nx - 6} ${ny - 26} Q${(ox + nx) / 2} ${ny - 34} ${ox + 10} ${oy - 34}" fill="none" stroke="${DOT}" stroke-width="2.6" stroke-linecap="round" marker-end="url(#oc-b5)"/>`);
}

function parachuteArt() {
  const b = board(2, 1, 50, 62, 50);
  const [lx, ly] = b.c(0, 0), [rx, ry] = b.c(1, 0);
  const chute = (x, y) => `<path d="M${x - 15} ${y - 46} Q${x} ${y - 72} ${x + 15} ${y - 46} Q${x + 7.5} ${y - 50} ${x} ${y - 46} Q${x - 7.5} ${y - 50} ${x - 15} ${y - 46} Z" fill="#c9d3e3" stroke="${FRAME}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<g stroke="#c9d3e3" stroke-width="1"><line x1="${x - 15}" y1="${y - 46}" x2="${x - 3}" y2="${y - 30}"/><line x1="${x + 15}" y1="${y - 46}" x2="${x + 3}" y2="${y - 30}"/></g>`;
  const pit = (x, y, marked) => `<ellipse cx="${x}" cy="${y + 2}" rx="15" ry="8" fill="#0b1020" stroke="${PIT}" stroke-width="3"/>`
    + (marked ? `<ellipse cx="${x}" cy="${y + 2}" rx="21" ry="11.5" fill="none" stroke="${PIT}" stroke-width="2" stroke-dasharray="3 3"/>` : '');
  return svg(b.svg
    + pit(lx, ly, false) + chute(lx, ly) + piece('king', lx, ly, 0, .8)
    + pit(rx, ry, true) + piece('king', rx + 3, ry - 4, 0, .8, ' rotate(24)') + cross(rx + 18, ry - 42));
}

export const MORE_PAGES = [
  { title: 'Not quite chess', art: truceArt(), points: ['No check, castling or promotion. Just capture the king.', 'Kings can’t be taken during the first 3 rounds.'] },
  { title: 'Earning insight', art: insightArt(), points: ['Each capture you make earns 1 insight.', 'Every 3 rounds earns 1 more, up to 5.'] },
  { title: 'Follow the gold dots', art: dotsArt(), points: ['Tap a piece with a known rule to see its landing squares.', 'Try blue pieces to spot threats.'] },
  { title: 'Check the Notebook', art: notebookArt(), points: ['The Notebook lists every rule found so far.', 'It also shows recent moves and your parachute.'] },
  { title: 'Undo keeps discoveries', art: undoArt(), points: ['Undo rewinds your move and blue’s reply, up to 3 turns.', 'Rules and tiles you found stay found.'] },
  { title: 'One parachute per king', art: parachuteArt(), points: ['Each king survives one trapdoor fall by parachute.', 'Then the hole is marked. A second fall loses.'] },
];
