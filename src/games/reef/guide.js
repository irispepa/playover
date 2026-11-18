// How to play cards for Reef Relay. The art redraws the board's own tiles in flat SVG, in the scene's colours.
import { DIRS, rotate } from './sim.js';

const C = {
  board: '#21515b', tile: '#39717b', ceramic: '#8bb3ad', wet: '#8ef1d3', dry: '#315d6a',
  pearl: '#fff9db', inlet: '#a3e5d2', shell: '#e4c3b4', ring: '#ffde9b', panel: '#1a4a56', line: '#397280', ink: '#eef4f3'
};

// One channel tile: mask bits follow sim.js DIRS (1 up, 2 right, 4 down, 8 left).
function tile(x, y, s, mask, wet = false) {
  const cx = x + s / 2, cy = y + s / 2, w = s * .3, sw = s * .1, water = wet ? C.wet : C.dry;
  let out = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * .12}" fill="${C.tile}"/>`;
  for (const [dx, dy, bit] of DIRS) {
    if (!(mask & bit)) continue;
    const half = s / 2;
    const rx = dx ? (dx > 0 ? cx : x) : cx - w / 2, ry = dy ? (dy > 0 ? cy : y) : cy - w / 2;
    const rw = dx ? half : w, rh = dy ? half : w;
    out += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${C.ceramic}"/>`;
    const sx = dx ? (dx > 0 ? cx : x) : cx - sw / 2, sy = dy ? (dy > 0 ? cy : y) : cy - sw / 2;
    out += `<rect x="${sx}" y="${sy}" width="${dx ? half : sw}" height="${dy ? half : sw}" fill="${water}"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${s * .2}" fill="${C.ceramic}"/><circle cx="${cx}" cy="${cy}" r="${s * .1}" fill="${water}"/>`;
  return out;
}
const pearl = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${C.pearl}" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.pearl}"/>`;
const spring = (x, cy, len, h) => `<rect x="${x}" y="${cy - h / 2}" width="${len}" height="${h}" rx="${h / 2}" fill="${C.inlet}"/><rect x="${x}" y="${cy - h * .18}" width="${len}" height="${h * .36}" fill="${C.wet}"/>`;
const shell = (cx, cy, r) => `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${C.shell}"/><path d="M${cx - r} ${cy}h${2 * r}" stroke="${C.shell}" stroke-width="3" stroke-linecap="round"/>` +
  [-.5, 0, .5].map(k => `<path d="M${cx} ${cy}L${cx + k * r * 1.2} ${cy - r * .8}" stroke="${C.board}" stroke-width="1.4" opacity=".5"/>`).join('');
// A fingertip pressing at (x, y), with a small tap ripple.
const finger = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${C.ink}" stroke-width="1.5" opacity=".7"/>` +
  `<path d="M${x - 4.5} ${y + 4.5}a4.5 4.5 0 0 1 9 0v34h-9z" fill="${C.ink}" stroke="${C.board}" stroke-width="1.5"/>`;
// Arrowhead with its tip at (x, y), pointing along `ang` degrees (screen coordinates, clockwise).
const arrowHead = (x, y, ang, fill = C.ring) => {
  const a = ang * Math.PI / 180, p = o => `${(x + Math.cos(a + o) * 8).toFixed(1)} ${(y + Math.sin(a + o) * 8).toFixed(1)}`;
  return `<path d="M${x} ${y}L${p(2.6)}L${p(-2.6)}z" fill="${fill}"/>`;
};
const svg = body => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// Card 1: tap a channel and it turns; once its openings line up, the water runs on.
const turnArt = svg(
  spring(0, 60, 12, 12) + tile(6, 43, 34, 10, true) + tile(42, 43, 34, 5) +
  `<path d="M50.8 37.4A24 24 0 0 1 81.6 51.8" fill="none" stroke="${C.ring}" stroke-width="3" stroke-linecap="round"/>` + arrowHead(83, 56, 70) +
  finger(66, 70) +
  `<path d="M90 60h9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` + arrowHead(106, 60, 0, C.ink) +
  spring(110, 60, 12, 12) + tile(116, 43, 34, 10, true) + tile(152, 43, 34, 10, true)
);

// Card 2: a solved reef. Spring on the left, three lit pearls on the route, the shell on the right.
const ROUTE = [10, 5, 0, 1, 2, 7, 12, 17, 22, 23, 24, 19, 14];
const between = (a, b) => DIRS.find(([dx, dy]) => b % 5 - a % 5 === dx && Math.floor(b / 5) - Math.floor(a / 5) === dy)[2];
const routeArt = (() => {
  const masks = [12, 6, 3, 9, 5, 10, 3, 6, 10, 12, 9, 5];
  const m = Array.from({ length: 25 }, (_, i) => masks[i % masks.length]);
  ROUTE.forEach((p, i) => { m[p] = (i ? between(p, ROUTE[i - 1]) : 8) | (i < ROUTE.length - 1 ? between(p, ROUTE[i + 1]) : 2); });
  const pearls = [.25, .5, .75].map(f => ROUTE[Math.floor((ROUTE.length - 1) * f)]);
  const s = 21, gap = 1.5, ox = 100 - (5 * s + 4 * gap) / 2, oy = 60 - (5 * s + 4 * gap) / 2;
  const at = i => [ox + i % 5 * (s + gap), oy + Math.floor(i / 5) * (s + gap)];
  let body = `<rect x="${ox - 4}" y="${oy - 4}" width="${5 * s + 4 * gap + 8}" height="${5 * s + 4 * gap + 8}" rx="8" fill="${C.board}"/>`;
  for (let i = 0; i < 25; i++) body += tile(...at(i), s, m[i], ROUTE.includes(i));
  for (const p of pearls) { const [x, y] = at(p); body += pearl(x + s / 2, y + s / 2, 4.5); }
  body += spring(ox - 26, 60, 22, 12) + shell(ox + 5 * s + 4 * gap + 20, 66, 14);
  return svg(body);
})();

// Card 3: the three buttons, as pictures: turn direction, undo, and a hint ring on a channel.
const btnBox = x => `<rect x="${x}" y="28" width="56" height="64" rx="12" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>`;
const toolsArt = svg(
  btnBox(8) + `<path d="M24 54a12 12 0 0 1 22 -3" fill="none" stroke="${C.wet}" stroke-width="3" stroke-linecap="round"/>` + arrowHead(48, 56, 75, C.wet) +
  `<path d="M48 66a12 12 0 0 1 -22 3" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` + arrowHead(24, 64, 255, C.ink) +
  btnBox(72) + `<path d="M88 52h20a10 10 0 0 1 0 20h-12" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>` + arrowHead(84, 52, 180, C.ink) +
  btnBox(136) + tile(146, 42, 36, 6) + `<circle cx="164" cy="60" r="21" fill="none" stroke="${C.ring}" stroke-width="2.5"/>`
);

// More tips, card 1: tap "A little help" a second time and it turns the glowing channel into place.
const twiceArt = svg(
  spring(0, 44, 12, 12) + tile(6, 27, 34, 10, true) + tile(42, 27, 34, 5) +
  `<circle cx="59" cy="44" r="21" fill="none" stroke="${C.ring}" stroke-width="2.5"/>` +
  `<path d="M86 44h9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` + arrowHead(102, 44, 0, C.ink) +
  spring(110, 44, 12, 12) + tile(116, 27, 34, 10, true) + tile(152, 27, 34, 10, true) +
  `<rect x="58" y="78" width="84" height="36" rx="10" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>` +
  tile(68, 85, 22, 6) + `<circle cx="79" cy="96" r="14" fill="none" stroke="${C.ring}" stroke-width="2"/>` +
  `<circle cx="122" cy="96" r="14" fill="none" stroke="${C.ink}" stroke-width="1.5" opacity=".45"/>` + finger(122, 96)
);

// Card 2: from reef 3 a channel on the route can split three ways. The side branch may end loose; that is fine.
const branchArt = svg(
  `<rect x="4" y="22" width="166" height="72" rx="8" fill="${C.board}"/>` +
  tile(40, 26, 30, 6, true) + tile(72, 26, 30, 5) +
  tile(8, 58, 30, 10, true) + tile(40, 58, 30, 11, true) + tile(72, 58, 30, 10, true) + tile(104, 58, 30, 10, true) + tile(136, 58, 30, 10, true) +
  `<circle cx="55" cy="73" r="20" fill="none" stroke="${C.ring}" stroke-width="2.5"/>` +
  pearl(87, 73, 4.5) + pearl(151, 73, 4.5) +
  spring(-6, 73, 14, 12) + shell(185, 79, 12)
);

// Card 3: a restored reef leads on to the next one, a fresh tangle of channels.
const nextArt = (() => {
  const s = 22, gap = 1.5, route = [3, 0, 1, 4, 7, 8, 5], pearls = [1, 4, 8];
  const dir = (a, b) => DIRS.find(([dx, dy]) => b % 3 - a % 3 === dx && Math.floor(b / 3) - Math.floor(a / 3) === dy)[2];
  const solved = [3, 6, 12, 12, 10, 10, 9, 9, 10];
  route.forEach((p, i) => { solved[p] = (i ? dir(p, route[i - 1]) : 8) | (i < route.length - 1 ? dir(p, route[i + 1]) : 2); });
  const scrambled = solved.map((m, i) => rotate(m, [1, 2, 1, 3, 1, 1, 2, 1, 3][i]));
  function mini(ox, oy, masks, wet) {
    const at = i => [ox + i % 3 * (s + gap), oy + Math.floor(i / 3) * (s + gap)];
    let out = `<rect x="${ox - 4}" y="${oy - 4}" width="${3 * s + 2 * gap + 8}" height="${3 * s + 2 * gap + 8}" rx="7" fill="${C.board}"/>`;
    masks.forEach((m, i) => { out += tile(...at(i), s, m, wet && route.includes(i)); });
    for (const p of pearls) {
      const [x, y] = at(p);
      out += wet ? pearl(x + s / 2, y + s / 2, 4) : `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="4" fill="${C.pearl}" opacity=".45"/>`;
    }
    return out;
  }
  const w = 3 * s + 2 * gap;
  return svg(
    `<circle cx="${18 + w / 2}" cy="60" r="${w / 2 + 14}" fill="${C.wet}" opacity=".12"/>` +
    mini(18, 60 - w / 2, solved, true) + mini(182 - w, 60 - w / 2, scrambled, false) +
    `<path d="M92 60h10" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` + arrowHead(109, 60, 0, C.ink)
  );
})();

// Optional "More tips" cards, reached from the link on the last card.
export const MORE = [
  { title: 'Tap help twice', art: twiceArt, points: ['Tap “A little help” again to turn the glowing channel into place.', 'It counts as a turn, and Undo can take it back.'] },
  { title: 'Branches from reef 3', art: branchArt, points: ['From reef 3, some channels on the route split three ways.', 'Loose ends are fine. Only the pearls and the shell need water.'] },
  { title: 'Take your time', art: nextArt, points: ['Every reef can be solved. There is no timer or turn limit.', 'Your reef saves after each turn. Restore it to reach the next.'] }
];

export const GUIDE = {
  className: 'reef-guide',
  doneLabel: 'Let it flow',
  pages: [
    { title: 'Turn the channels', art: turnArt, points: ['Tap a coral channel to rotate it.', 'Line up the openings so water flows through.'] },
    { title: 'Light all three pearls', art: routeArt, points: ['Guide water from the left spring to the right shell.', 'It must pass through every pearl on the way.'] },
    { title: 'Turn, undo, get help', art: toolsArt, points: ['The turn button switches clockwise or anticlockwise. Undo takes a turn back.', '“A little help” shows a useful channel, as often as you like.'] }
  ],
  more: MORE
};
