// Tidewater: How to play cards for the shared guide (src/shell/guide.js). Pictures are drawn in the island's
// own colours (render.js) with the game's icons and its 3D building thumbnails. Every fact is checked against
// data.js / sim.js / world.js: keep them in step when rules change.
import { resIcon, uiIcon } from './icons.js';

const C = {
  sea: '#2b8fd6', deep: '#1f6fa8', foam: '#9fdcf5', sand: '#f2d99a', grass: '#8fd05c', grass2: '#7cc04e',
  panel: '#172334', line: '#3a4d68', good: '#4cc9a0', accent: '#f0b44c', skin: '#f4d6b8', skinEdge: '#c99a72',
};
// Placement overlay colours from index.js: best, good, fair, poor, not allowed.
const SITE = ['#3cff6e', '#8fe05a', '#f2d14b', '#f28a3b', '#2c3d52'];

const svg = (body) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="${C.sea}"/>${body}</svg>`;
// Little wave crests at the given points.
const waves = (pts) => `<path d="${pts.map(([x, y]) => `M${x} ${y}q5-3.5 10 0t10 0`).join('')}" fill="none" stroke="${C.foam}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
// A game icon (24 x 24) placed at x, y and drawn size wide.
const place = (icon, x, y, size, color = '#fff') => icon.replace(/^<svg class="[^"]*"/, `<svg x="${x}" y="${y}" width="${size}" height="${size}" color="${color}"`);
const res = (k, x, y, size) => place(resIcon(k), x, y, size);
const ui = (k, x, y, size, color) => place(uiIcon(k), x, y, size, color);
// A building thumbnail centred on x with its base near y.
const model = (href, x, y, w, extra = '') => `<image href="${href}" x="${x - w / 2}" y="${y - w * 0.78}" width="${w}" height="${w}" ${extra}/>`;
// An island: beach rim and meadow.
const island = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.sand}"/><ellipse cx="${cx + 2}" cy="${cy - 2}" rx="${rx - 9}" ry="${ry - 7}" fill="${C.grass}"/>`;
// Isometric tile centred on x, y.
const tile = (x, y, w, fill, extra = '') => `<path d="M${x} ${y - w / 4}L${x + w / 2} ${y}L${x} ${y + w / 4}L${x - w / 2} ${y}Z" fill="${fill}" ${extra}/>`;
// A fingertip seen from above with a touch ring, and a finger reaching in from the lower right.
const tip = (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/><circle cx="${x}" cy="${y}" r="6.5" fill="${C.skin}" stroke="${C.skinEdge}" stroke-width="1.4"/>`;
const finger = (x, y) => `<g transform="translate(${x} ${y}) rotate(-30)"><rect x="-7" y="-2" width="14" height="42" rx="7" fill="${C.skin}" stroke="${C.skinEdge}" stroke-width="1.4"/><rect x="-4" y="1" width="8" height="8" rx="4" fill="#fff" opacity=".55"/></g>`;
const line = (d, color = '#fff', w = 2.6, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const panel = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.panel}" ${extra}/>`;

// 1. A tray card, glowing tiles with the best one tapped, then the Build button.
function buildArt(thumbs) {
  const grid = [[4, 3, 2, 2], [3, 2, 1, 1], [4, 1, 0, 0], [4, 1, 0, 4]];
  let tiles = '';
  grid.forEach((row, i) => row.forEach((v, j) => {
    const x = 112 + (i - j) * 14, y = 48 + (i + j) * 7;
    tiles += tile(x, y, 27, SITE[v], v < 4 ? 'opacity=".85"' : 'opacity=".55"');
  }));
  const sx = 112, sy = 76; // the tapped tile (row 2, column 2)
  return svg(`${waves([[10, 18], [60, 10], [168, 108]])}${island(112, 70, 76, 44)}${tiles}
    ${tile(sx, sy, 28, 'none', 'stroke="#fff" stroke-width="2.4"')}
    ${model(thumbs['woodcutter:1'], sx - 2, sy + 4, 32, 'opacity=".8"')}
    ${finger(sx + 12, sy + 7)}${tip(sx + 12, sy + 7)}
    ${panel(8, 66, 40, 46, `stroke="${C.accent}" stroke-width="2"`)}${model(thumbs['woodcutter:1'], 28, 102, 36)}
    ${line('M46 70q14-14 40-4', '#fff', 2.2, 'stroke-dasharray="1 5"')}
    <rect x="146" y="8" width="46" height="24" rx="8" fill="${C.good}"/>${ui('hammer', 150, 11, 18, '#062019')}${ui('check', 170, 12, 16, '#062019')}
    ${line('M126 70q24-8 32-32', '#fff', 2.2, 'stroke-dasharray="1 5"')}`);
}

// 2. A free bed, food and spare work bring a newcomer to the houses.
function settleArt(thumbs) {
  const need = (k, y) => `${panel(8, y, 46, 30)}${res(k, 14, y + 5, 20)}<circle cx="44" cy="${y + 15}" r="6" fill="${C.good}"/>${ui('check', 39, y + 10, 10, '#062019')}`;
  return svg(`${waves([[170, 16], [96, 104]])}${island(142, 72, 56, 40)}
    ${need('house', 10)}${need('food', 45)}${need('worker', 80)}
    ${line('M62 60h20', '#fff', 3)}${line('M77 54l6 6-6 6', '#fff', 3)}
    ${model(thumbs['house:1'], 132, 66, 40)}${model(thumbs['house:1'], 166, 84, 40)}
    ${res('pop', 100, 66, 22)}${res('pop', 112, 82, 18)}
    <circle cx="118" cy="62" r="7" fill="${C.good}"/>${line('M118 58.5v7M114.5 62h7', '#062019', 2.2)}`);
}

// 3. One finger drags, two pinch, a tap opens a building.
function lookArt(thumbs) {
  const box = (x) => `<rect x="${x}" y="8" width="58" height="104" rx="10" fill="${C.deep}"/>${island(x + 29, 62, 25, 30)}`;
  return svg(`${box(6)}${box(71)}${box(136)}
    ${line('M35 24v-8M35 100v8M15 62h-8M55 62h8')}${line('M31 20l4-5 4 5M31 104l4 5 4-5M11 58l-5 4 5 4M59 58l5 4-5 4', '#fff', 2.4)}
    ${tip(35, 62)}
    ${line('M86 88l-8 8M126 36l8-8')}${line('M77 89v8h8M127 27h8v8', '#fff', 2.4)}
    ${tip(92, 82)}${tip(120, 42)}
    ${model(thumbs['house:1'], 165, 74, 40)}
    <circle cx="165" cy="58" r="17" fill="none" stroke="#fff" stroke-width="2" opacity=".45"/>
    ${tip(176, 70)}
    ${panel(142, 88, 46, 18)}<rect x="147" y="93" width="20" height="3" rx="1.5" fill="#fff" opacity=".8"/><rect x="147" y="99" width="34" height="3" rx="1.5" fill="${C.line}"/>`);
}

// 4. The goal leads from a hut to a cottage and a manor, up to the Charter Hall.
function charterArt(thumbs) {
  return svg(`${waves([[104, 14], [124, 30]])}${island(100, 84, 98, 34)}
    ${line('M24 98C60 104 70 84 104 86s52-8 66-22', '#fff', 2.6, 'stroke-dasharray="1 6" opacity=".9"')}
    ${model(thumbs['house:1'], 26, 98, 34)}${model(thumbs['house:2'], 66, 94, 40)}${model(thumbs['house:3'], 110, 92, 46)}
    ${model(thumbs['charter:1'], 162, 82, 66)}
    ${ui('star', 152, 2, 20, C.accent)}
    ${panel(8, 8, 76, 26)}${ui('scroll', 12, 11, 20)}<rect x="36" y="15" width="40" height="4" rx="2" fill="#fff" opacity=".8"/>
    <rect x="36" y="23" width="40" height="4" rx="2" fill="${C.line}"/><rect x="36" y="23" width="26" height="4" rx="2" fill="${C.good}"/>`);
}

// ---------- More tips ----------
// A small round badge: a tick, plus, minus or an icon on a coloured disc.
const disc = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const plus = (x, y) => `${disc(x, y, 6.5, C.good)}${line(`M${x} ${y - 3.5}v7M${x - 3.5} ${y}h7`, '#062019', 2.2)}`;
const minus = (x, y) => `${disc(x, y, 6.5, SITE[3])}${line(`M${x - 3.5} ${y}h7`, '#2a1606', 2.2)}`;
const arrow = (x, y, len = 16) => `${line(`M${x} ${y}h${len}`, '#fff', 3)}${line(`M${x + len - 5} ${y - 5}l5 5-5 5`, '#fff', 3)}`;
// A store bar: an outline with a fill from the bottom; `frac` of 1 is full.
const bar = (x, y, w, h, frac, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="${x + 2.5}" y="${y + 2.5 + (h - 5) * (1 - frac)}" width="${w - 5}" height="${(h - 5) * frac}" rx="2.5" fill="${fill}"/>`;

// 1. Hut, Cottage and Manor, with what each upgrade needs underneath.
function homesArt(thumbs) {
  return svg(`${waves([[118, 10], [160, 18]])}${island(100, 60, 98, 34)}
    ${model(thumbs['house:1'], 30, 66, 34)}${arrow(48, 52, 14)}${model(thumbs['house:2'], 94, 68, 44)}${arrow(120, 52, 14)}${model(thumbs['house:3'], 164, 70, 52)}
    ${panel(64, 86, 60, 28)}${model(thumbs['well:1'], 80, 112, 26)}${model(thumbs['market:1'], 108, 112, 26)}
    ${panel(132, 86, 62, 28)}${model(thumbs['tavern:1'], 150, 112, 26)}${res('cloth', 168, 90, 20)}
    ${panel(8, 4, 76, 26)}${ui('up', 13, 8, 18, C.good)}${res('pop', 37, 8, 18)}${res('gold', 59, 8, 18)}`);
}

// 2. Services lift a home's happiness; a noisy quarry next door pulls it down.
function happyArt(thumbs) {
  const svc = (k, x, y) => `${model(thumbs[k + ':1'], x, y, 30)}${plus(x + 12, y - 22)}`;
  return svg(`${waves([[150, 12], [10, 108]])}${island(100, 66, 96, 48)}
    ${svc('well', 26, 52)}${svc('market', 62, 52)}${svc('tavern', 26, 96)}${svc('shrine', 62, 96)}
    ${line('M80 62l14 6M80 88l14-6', '#fff', 2.2, 'stroke-dasharray="1 5"')}
    ${model(thumbs['house:1'], 112, 86, 40)}${res('happy', 100, 22, 24)}
    ${model(thumbs['quarry:1'], 170, 90, 40)}
    ${line('M146 52q3-4 6 0t6 0M146 60q3-4 6 0t6 0', SITE[3], 2.4)}${minus(178, 48)}`);
}

// 3. A cutter stops beside a full store; a Warehouse makes every store bigger.
function storesArt(thumbs) {
  return svg(`${waves([[90, 12], [100, 110]])}${island(48, 70, 44, 40)}${island(152, 70, 44, 40)}
    ${model(thumbs['woodcutter:1'], 36, 88, 40)}${disc(52, 46, 9, C.panel)}${ui('pause', 45, 39, 14, SITE[2])}
    ${bar(70, 34, 16, 62, 1, SITE[2])}${res('wood', 66, 12, 24)}
    ${arrow(92, 64, 16)}
    ${model(thumbs['warehouse:1'], 136, 94, 46)}
    ${bar(170, 20, 16, 82, 0.55, C.good)}${ui('up', 168, 2, 20, C.good)}`);
}

// 4. Food work is staffed first; a starred building jumps the queue, a paused one lets its crew go.
function workArt(thumbs) {
  const dots = (x, y, n, full) => Array.from({ length: n }, (_, k) => disc(x + k * 11, y, 4, k < full ? '#fff' : 'none', `stroke="#fff" stroke-width="1.6" opacity="${k < full ? 1 : 0.5}"`)).join('');
  const btn = (x, k, on) => `<rect x="${x}" y="88" width="56" height="24" rx="8" fill="${on ? C.good : C.panel}" stroke="${on ? 'none' : C.line}" stroke-width="1.5"/>${ui(k, x + 20, 91, 18, on ? '#062019' : '#fff')}`;
  return svg(`${waves([[90, 12], [170, 14]])}${island(100, 54, 96, 36)}
    ${model(thumbs['fishing:1'], 40, 66, 40)}${ui('star', 52, 18, 18, C.accent)}${dots(24, 76, 2, 2)}
    ${model(thumbs['quarry:1'], 158, 66, 40)}${disc(176, 28, 9, C.panel)}${ui('pause', 169, 21, 14, '#fff')}${dots(142, 76, 3, 0)}
    ${res('worker', 90, 28, 20)}${line('M112 40h-24', '#fff', 2.4)}${line('M93 35l-5 5 5 5', '#fff', 2.4)}
    ${btn(36, 'star', true)}${btn(108, 'pause', false)}`);
}

// 5. A storm cloud over a battered house, a fire that a well's bucket line puts out.
function weatherArt(thumbs) {
  const flame = (x, y) => `<path d="M${x} ${y}c-8 0-11-7-8-13 2 3 4 3 4 0 0-5 3-9 6-11-1 5 6 8 6 15 0 5-3 9-8 9z" fill="${SITE[3]}"/><path d="M${x} ${y}c-4 0-5-4-3-7 1 2 3 1 3-1 2 2 4 4 4 6s-2 2-4 2z" fill="${SITE[2]}"/>`;
  return svg(`<rect width="200" height="48" fill="${C.deep}"/>${island(100, 86, 98, 30)}
    <g fill="#d7e3ee"><ellipse cx="40" cy="22" rx="24" ry="11"/><ellipse cx="54" cy="16" rx="14" ry="10"/><ellipse cx="26" cy="18" rx="10" ry="8"/></g>
    <path d="M44 30l-6 12h6l-4 10 10-14h-6l4-8z" fill="${C.accent}"/>${line('M24 34l-3 7M32 36l-3 7M58 34l-3 7', C.foam, 2)}
    ${model(thumbs['house:1'], 40, 100, 40)}${disc(58, 70, 9, C.accent)}${ui('wrench', 51, 63, 14, '#2a1606')}
    ${model(thumbs['woodcutter:1'], 108, 102, 42)}${flame(108, 84)}
    ${model(thumbs['well:1'], 168, 102, 38)}
    ${line('M162 72q-12-20-38-2', C.foam, 2.6, 'stroke-dasharray="2 5"')}<circle cx="122" cy="72" r="3" fill="${C.foam}"/>`);
}

// 6. A ship calls at the dock and the ship button offers a deal.
function shipArt(thumbs) {
  return svg(`${waves([[120, 96], [150, 108], [96, 20]])}${island(40, 92, 52, 30)}
    ${model(thumbs['dock:1'], 62, 98, 40)}${ui('ship', 82, 34, 46)}
    <rect x="146" y="8" width="46" height="32" rx="10" fill="#1d4d6b" stroke="#3fb6d8" stroke-width="2"/>${ui('ship', 156, 11, 26)}
    ${finger(176, 36)}${tip(176, 36)}
    ${panel(118, 70, 76, 40)}${res('wood', 124, 80, 20)}${arrow(148, 90, 12)}${res('gold', 166, 80, 20)}`);
}

// Optional extra cards, offered after the main guide and from the menus ("More tips").
export function morePages(thumbs) {
  return [
    { title: 'Upgrade your homes', art: homesArt(thumbs), points: ['Tap a house to upgrade it: more beds, more tax.', 'Cottages need a Well and Market nearby. Manors add a Tavern and cloth.'] },
    { title: 'Keep people happy', art: happyArt(thumbs), points: ['Wells, markets, taverns and shrines near homes lift happiness.', 'Noisy industry nearby lowers it. Below 30, people leave.'] },
    { title: 'Full stores stop work', art: storesArt(thumbs), points: ['Each good has a limit, and work stops when it is full.', 'Warehouses raise every limit and extend your building reach.'] },
    { title: 'Choose who works', art: workArt(thumbs), points: ['Food buildings get workers first.', 'Tap a building to give it priority, or pause it to free workers.'] },
    { title: 'Weather the storms', art: weatherArt(thumbs), points: ['Storms, fires and fever come once your town grows.', 'Wells put out nearby fires. Tap damaged buildings to repair them.'] },
    { title: 'Trade with ships', art: shipArt(thumbs), points: ['Staff a Dock and ships call with deals. Tap the ship button to trade.'] },
  ];
}

// `thumbs` is game.thumbs from render.js makeThumbnails.
export function guidePages(thumbs) {
  return [
    { title: 'Pick, tap, build', art: buildArt(thumbs), points: ['Pick a building, then tap a glowing tile.', 'Greener tiles are better. Press Build to place it.'] },
    { title: 'Beds, food and work', art: settleArt(thumbs), points: ['Settlers need free beds, food and jobs to move in.', 'Run out of food and people leave.'] },
    { title: 'Look around', art: lookArt(thumbs), points: ['Drag to move, pinch or scroll to zoom.', 'Tap a building to check on it.'] },
    { title: 'Earn the Royal Charter', art: charterArt(thumbs), points: ['Follow the goals to unlock new buildings.', 'Grow a big, happy town, then build the Charter Hall.'] },
  ];
}
