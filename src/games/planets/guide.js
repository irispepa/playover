// How to play cards for Pocket Planets. Art is drawn from the game's own planet palette (sim.js PLANETS).
import { planet, PLANETS } from './sim.js';
import './guide.css';

const BG = '#171d39', BOARD = '#242d50', TILE = '#323b60', ACCENT = '#e2b5fb', INK = '#fff8ed', SKIN = '#f1d3bf';

function rgb(c, k = 1) {
  const ch = (s) => Math.min(255, Math.round(((c >> s) & 255) * k));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// One planet as the game draws it: craters on a moon, bands on the rest, a ring from 32 up, the value on top.
function orb(x, y, value, r, { label = true, opacity = 1 } = {}) {
  const c = planet(value).color;
  let s = `<g opacity="${opacity}">`;
  if (value >= 2048) s += `<circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="${rgb(c)}" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r * 1.35}" fill="${rgb(c)}" opacity=".22"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rgb(c)}"/>`;
  if (value === 2) {
    for (const [dx, dy, k] of [[-.35, -.25, .22], [.3, .1, .17], [-.1, .45, .14]]) s += `<circle cx="${x + dx * r}" cy="${y + dy * r}" r="${k * r}" fill="#818da5"/>`;
  } else {
    for (const [i, dy] of [-.42, 0, .42].entries()) {
      const w = Math.sqrt(1 - dy * dy) * r * .9;
      s += `<ellipse cx="${x}" cy="${y + dy * r}" rx="${w}" ry="${r * .09}" fill="${rgb(c, .72 + i * .09)}"/>`;
    }
  }
  s += `<circle cx="${x - r * .35}" cy="${y - r * .38}" r="${r * .3}" fill="#fff" opacity=".2"/>`;
  if (value >= 32 && value < 2048) s += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.55}" ry="${r * .42}" fill="none" stroke="${rgb(c)}" stroke-width="${r * .26}" opacity=".7" transform="rotate(-14 ${x} ${y})"/>`;
  if (label) s += `<text x="${x}" y="${y}" dy=".35em" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="${Math.max(8, r * .78)}" fill="${INK}" stroke="#11152b" stroke-width="2.4" paint-order="stroke">${value}</text>`;
  return s + '</g>';
}

function finger(x, y, angle = -18) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><circle r="11" fill="none" stroke="${ACCENT}" stroke-width="2" opacity=".55"/>` +
    `<rect x="-7" y="-4" width="14" height="40" rx="7" fill="${SKIN}"/><rect x="-4" y="-1" width="8" height="9" rx="4" fill="#fff" opacity=".5"/></g>`;
}

const svg = (body) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="${BG}"/>${body}</svg>`;

// Card 1: a row of planets slid to the right edge, a finger swiping and the arrow pad.
function slideArt() {
  const bx = 10, by = 8, cell = 22, gap = 4, pad = 5;
  const cx = (i) => bx + pad + i * (cell + gap) + cell / 2, cy = (j) => by + pad + j * (cell + gap) + cell / 2;
  let s = `<rect x="${bx}" y="${by}" width="${pad * 2 + cell * 4 + gap * 3}" height="${pad * 2 + cell * 4 + gap * 3}" rx="10" fill="${BOARD}"/>`;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) s += `<rect x="${cx(i) - cell / 2}" y="${cy(j) - cell / 2}" width="${cell}" height="${cell}" rx="5" fill="${TILE}"/>`;
  // Ghosts where planets started, trails, and where they ended.
  for (const [from, to, j, v] of [[0, 3, 1, 4], [1, 2, 1, 2], [0, 3, 3, 8]]) {
    s += `<line x1="${cx(from)}" y1="${cy(j)}" x2="${cx(to) - 10}" y2="${cy(j)}" stroke="${rgb(planet(v).color)}" stroke-width="5" stroke-linecap="round" opacity=".22"/>`;
    s += orb(cx(from), cy(j), v, 8, { label: false, opacity: .25 });
    s += orb(cx(to), cy(j), v, 9);
  }
  s += orb(cx(1), cy(0), 2, 6, { label: false, opacity: .9 }); // the new little planet
  s += `<path d="M ${cx(1) - 11} ${cy(0) - 2} l -3 -3 M ${cx(1) + 11} ${cy(0) - 2} l 3 -3 M ${cx(1)} ${cy(0) - 11} v -3" stroke="${ACCENT}" stroke-width="1.6" stroke-linecap="round"/>`;
  // Swipe gesture.
  s += `<path d="M 134 34 H 184" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"/><path d="M 178 27 L 188 34 L 178 41" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += finger(170, 34);
  // Arrow pad, right arrow lit.
  const keys = [[160, 80, 'M -3 2 L 0 -2 L 3 2'], [145, 96, 'M 2 -3 L -2 0 L 2 3'], [160, 96, 'M -3 -2 L 0 2 L 3 -2'], [175, 96, 'M -2 -3 L 2 0 L -2 3']];
  keys.forEach(([x, y, d], k) => {
    const lit = k === 3;
    s += `<rect x="${x - 6.5}" y="${y - 6.5}" width="13" height="13" rx="3.5" fill="${lit ? ACCENT : '#252d50'}" stroke="#485580"/>`;
    s += `<path d="${d}" transform="translate(${x} ${y})" fill="none" stroke="${lit ? BG : '#adb7dd'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
  return svg(s);
}

// Card 2: two moons meet and become a rose; below, the whole ladder up to the Sun.
function mergeArt() {
  let s = orb(34, 42, 2, 15) + orb(84, 42, 2, 15);
  s += `<path d="M 52 42 h 7 M 66 42 h -7" stroke="${ACCENT}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M 110 42 H 132" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/><path d="M 126 35 L 134 42 L 126 49" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += orb(162, 42, 4, 19);
  for (const [dx, dy] of [[-26, -16], [26, -18], [28, 14]]) s += `<circle cx="${162 + dx}" cy="${42 + dy}" r="1.8" fill="${ACCENT}"/>`;
  // Ladder: every planet in order, growing, ending at the Sun.
  const last = PLANETS.length - 1, gap = 5.5;
  const radii = PLANETS.map((_, i) => (i === last ? 10 : 2.6 + i * .36));
  let x = (200 - radii.reduce((t, r) => t + r * 2 + gap, -gap) - 4) / 2;
  PLANETS.forEach((p, i) => {
    const r = radii[i];
    if (i === last) x += 4;
    s += orb(x + r, 96, p.value, r, { label: false });
    x += r * 2 + gap;
  });
  return svg(s);
}

// Card 3: undo pulls a planet back; recycle clears one, with two charges shown.
function rescueArt() {
  let s = `<line x1="100" y1="16" x2="100" y2="104" stroke="#485580" stroke-width="1.5" stroke-dasharray="3 5"/>`;
  // Undo: planet back at its old spot, ghost where it went.
  s += `<rect x="16" y="58" width="68" height="30" rx="8" fill="${BOARD}"/>`;
  s += `<rect x="20" y="62" width="22" height="22" rx="5" fill="${TILE}"/><rect x="58" y="62" width="22" height="22" rx="5" fill="${TILE}"/>`;
  s += orb(69, 73, 16, 8.5, { label: false, opacity: .28 }) + orb(31, 73, 16, 9);
  s += `<path d="M 70 52 C 66 30, 38 28, 33 46" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/><path d="M 26 40 L 33 49 L 40 41" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Recycle: a tapped planet bursting into dust.
  s += `<rect x="128" y="50" width="38" height="38" rx="8" fill="${TILE}"/>`;
  s += orb(147, 69, 64, 10, { label: false, opacity: .35 });
  s += `<circle cx="147" cy="69" r="15" fill="none" stroke="${ACCENT}" stroke-width="1.6" stroke-dasharray="3 4"/>`;
  for (const [dx, dy, r] of [[-22, -18, 2.2], [20, -22, 1.8], [25, 6, 2], [-24, 10, 1.6], [2, -28, 1.6]]) s += `<circle cx="${147 + dx}" cy="${69 + dy}" r="${r}" fill="${rgb(planet(64).color)}"/>`;
  s += finger(156, 78, -24);
  // Two charges, like "Recycle · 2".
  s += `<circle cx="132" cy="24" r="4" fill="${ACCENT}"/><circle cx="144" cy="24" r="4" fill="${ACCENT}"/><circle cx="156" cy="24" r="4" fill="none" stroke="#485580" stroke-width="1.5"/>`;
  return svg(s);
}

// A small 4x4 tray at (bx, by); returns the drawing and the centre of each cell.
function tray(bx, by, cell, gap = 3, pad = 4) {
  const cx = (i) => bx + pad + i * (cell + gap) + cell / 2, cy = (j) => by + pad + j * (cell + gap) + cell / 2;
  const size = pad * 2 + cell * 4 + gap * 3;
  let s = `<rect x="${bx}" y="${by}" width="${size}" height="${size}" rx="8" fill="${BOARD}"/>`;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) s += `<rect x="${cx(i) - cell / 2}" y="${cy(j) - cell / 2}" width="${cell}" height="${cell}" rx="4" fill="${TILE}"/>`;
  return { s, cx, cy, size };
}

function arrowKey(x, y, d, lit) {
  return `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="4" fill="${lit ? ACCENT : '#252d50'}" stroke="#485580"/>` +
    `<path d="${d}" transform="translate(${x} ${y})" fill="none" stroke="${lit ? BG : '#adb7dd'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const UP = 'M -3.5 2 L 0 -2 L 3.5 2', LEFT = 'M 2 -3.5 L -2 0 L 2 3.5', DOWN = 'M -3.5 -2 L 0 2 L 3.5 -2', RIGHT = 'M -2 -3.5 L 2 0 L -2 3.5';

// More 1: the biggest planet parked in the top-left corner, smaller ones lined up beside it; left and up lit.
function cornerArt() {
  const t = tray(24, 6, 23);
  let s = t.s;
  s += `<circle cx="${t.cx(0)}" cy="${t.cy(0)}" r="17" fill="none" stroke="${ACCENT}" stroke-width="1.6" stroke-dasharray="3 4"/>`;
  [[0, 0, 256, 10], [1, 0, 128, 9], [2, 0, 64, 8.5], [3, 0, 32, 7.5], [0, 1, 16, 8], [1, 1, 8, 7.5], [3, 2, 2, 7], [0, 2, 4, 7]].forEach(([i, j, v, r]) => { s += orb(t.cx(i), t.cy(j), v, r); });
  s += arrowKey(166, 50, UP, true) + arrowKey(147, 69, LEFT, true) + arrowKey(166, 69, DOWN, false) + arrowKey(185, 69, RIGHT, false);
  return svg(s);
}

// More 2: four moons in a row slide left and become two roses, not one tide.
function onceArt() {
  const row = (y, vals) => {
    let s = `<rect x="20" y="${y - 17}" width="122" height="34" rx="8" fill="${BOARD}"/>`;
    vals.forEach((v, k) => {
      const x = 37 + k * 29.5;
      s += `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="4" fill="${TILE}"/>`;
      if (v) s += orb(x, y, v, v === 2 ? 8.5 : 9.5);
    });
    return s;
  };
  let s = row(26, [2, 2, 2, 2]) + row(92, [4, 4, 0, 0]) + arrowKey(170, 26, LEFT, true);
  s += `<path d="M 81 50 V 66" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/><path d="M 74 60 L 81 68 L 88 60" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  // The tide that does not happen.
  s += orb(170, 92, 8, 10, { opacity: .55 });
  s += `<path d="M 159 81 L 181 103" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/>`;
  return svg(s);
}

// More 3: two of five charge slots lit; undo sweeping back over eight earlier moves.
function chargesArt() {
  let s = `<rect x="18" y="20" width="164" height="30" rx="15" fill="${BOARD}"/>`;
  for (let k = 0; k < 5; k++) {
    const x = 40 + k * 30;
    s += k < 2 ? `<circle cx="${x}" cy="35" r="8" fill="${ACCENT}"/>` : `<circle cx="${x}" cy="35" r="7.5" fill="none" stroke="#485580" stroke-width="2"/>`;
  }
  for (let k = 0; k < 8; k++) {
    const x = 34 + k * 17.5;
    s += `<circle cx="${x}" cy="98" r="5" fill="${rgb(planet(2 ** (k + 1)).color)}" opacity="${.35 + k * .08}"/>`;
  }
  s += orb(182, 98, 512, 8, { label: false });
  s += `<path d="M 178 84 C 160 62, 52 62, 36 84" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/><path d="M 30 77 L 35 87 L 44 81" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(s);
}

// More 4: two Suns merge into a bigger one, the score still rising.
function sunArt() {
  let s = orb(30, 60, 2048, 13) + orb(80, 60, 2048, 13);
  s += `<path d="M 108 60 H 124" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round"/><path d="M 118 53 L 126 60 L 118 67" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += orb(162, 60, 4096, 19);
  for (const [dx, dy] of [[-30, -36], [30, -38], [32, 38], [-30, 38]]) s += `<circle cx="${162 + dx}" cy="${60 + dy}" r="1.8" fill="${ACCENT}"/>`;
  return svg(s);
}

// More 5: the atlas, discovered planets in colour and the rest still a question.
function atlasArt() {
  let s = `<rect x="14" y="10" width="172" height="100" rx="10" fill="${BOARD}"/>`;
  const found = 6;
  PLANETS.forEach((p, k) => {
    const col = k < 6 ? 0 : 1, rowi = k < 6 ? k : k - 6;
    const x = 32 + col * 86, y = 22 + rowi * 15.5;
    if (k < found) {
      s += orb(x, y, p.value, 5.5, { label: false });
      s += `<rect x="${x + 11}" y="${y - 3}" width="${34 + (k % 3) * 8}" height="6" rx="3" fill="${rgb(p.color)}" opacity=".75"/>`;
    } else {
      s += `<circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="#485580" stroke-width="1.5" stroke-dasharray="2 2.5"/>`;
      s += `<text x="${x}" y="${y}" dy=".35em" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="7" fill="#adb7dd">?</text>`;
      s += `<rect x="${x + 11}" y="${y - 3}" width="38" height="6" rx="3" fill="${TILE}"/>`;
    }
  });
  return svg(s);
}

// More 6: an hourglass crossed out beside a tray marked as saved.
function calmArt() {
  let s = `<g transform="translate(52 60)"><path d="M -16 -30 H 16 M -16 30 H 16" stroke="#adb7dd" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M -12 -28 C -12 -8, 12 -8, 12 -28 Z M -12 28 C -12 8, 12 8, 12 28 Z" fill="#323b60" stroke="#adb7dd" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M -12 -28 L 12 28 M 12 -28 L -12 28" stroke="#adb7dd" stroke-width="2"/>` +
    `<path d="M -26 -26 L 26 26" stroke="${ACCENT}" stroke-width="3.4" stroke-linecap="round"/></g>`;
  const t = tray(104, 20, 16, 2.5, 3.5);
  s += t.s;
  [[0, 0, 64, 6], [1, 0, 16, 5.5], [0, 1, 8, 5.5], [2, 2, 2, 5], [3, 0, 4, 5]].forEach(([i, j, v, r]) => { s += orb(t.cx(i), t.cy(j), v, r, { label: false }); });
  const bx = 104 + t.size, by = 20 + t.size;
  s += `<circle cx="${bx - 2}" cy="${by - 2}" r="13" fill="${ACCENT}" stroke="${BG}" stroke-width="3"/><path d="M ${bx - 8} ${by - 2} l 4.5 4.5 l 8 -9" fill="none" stroke="${BG}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(s);
}

export function guidePages() {
  return [
    { title: 'Swipe to slide', art: slideArt(), points: ['Swipe the tray or tap the arrows to move every planet.', 'A new little planet appears after each slide.'] },
    { title: 'Match planets to merge', art: mergeArt(), points: ['Two equal planets merge into the next, bigger world.', 'Each merge earns stardust. Grow your way to a 2048 Sun.'] },
    { title: 'Stuck? Undo or recycle', art: rescueArt(), points: ['Undo takes back your last move.', 'Recycle clears one planet. Earn a charge every 512 stardust.'] },
  ];
}

// Optional "More tips" cards, offered after the main guide and from the Planet atlas.
export function morePages() {
  return [
    { title: 'Keep big planets cornered', art: cornerArt(), points: ['Park your biggest planet in a corner and build beside it.', 'Slide mostly two ways so it never drifts out.'] },
    { title: 'One merge per slide', art: onceArt(), points: ['A planet merges only once per slide.', 'Four moons in a row make two roses, not one planet.'] },
    { title: 'Charges and undo', art: chargesArt(), points: ['You start with two recycle charges and hold at most five.', 'Undo steps back up to eight moves, recycles too.'] },
    { title: 'Keep going past the Sun', art: sunArt(), points: ['Two Suns still merge, and stardust keeps climbing.', 'Play on as long as a slide is left.'] },
    { title: 'The planet atlas', art: atlasArt(), points: ['Tap Planet atlas to see every world up to the Sun.', 'Names fill in as you discover them, even across new galaxies.'] },
    { title: 'No timer, no rush', art: calmArt(), points: ['Take as long as you like over every slide.', 'Your galaxy saves after every move, so leave any time.'] },
  ];
}
