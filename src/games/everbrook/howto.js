// How to play cards for the shared guide (src/shell/guide.js). Art is drawn with the game's own icons
// and its 3D building thumbnails, so the cards look like the valley the player is about to see.
import { ICON } from './icons.js';
import { ERAS } from './data.js';

const C = {
  grass: '#8fd162', grass2: '#79c04c', water: '#4fb0e0', waterHi: '#9bd3ef', hill: '#a8a294', hillHi: '#cfcac0',
  leaf: '#6cc05a', pine: '#3f8f55', trunk: '#7a5a3c', paper: '#fbf3e1', paper2: '#f3e6c9', edge: '#dcc79d',
  ink: '#3b2c1c', soft: '#7a6549', btn: '#9c7440', ghost: '#3ff58e', reach: '#4aa3d9', culture: '#e0708a',
  skin: '#f1cfae', skinEdge: '#c99a72', good: '#3f8f4f',
};

const svg = (body, bg = C.grass) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="${bg}"/>${body}</svg>`;
// An icons.js icon (24 x 24) placed at x, y and drawn size wide.
const ic = (name, x, y, size, color = C.ink) => ICON[name].replace('width="1em" height="1em"', `x="${x}" y="${y}" width="${size}" height="${size}" color="${color}"`);
// A building thumbnail standing on a soft shadow, centred on x with its base at y.
const model = (href, x, y, w, extra = '') => `<ellipse cx="${x}" cy="${y - w * 0.16}" rx="${w * 0.36}" ry="${w * 0.12}" fill="#2a4a1a" opacity=".18"/><image href="${href}" x="${x - w / 2}" y="${y - w * 0.86}" width="${w}" height="${w}" ${extra}/>`;
// Grass texture: a few darker tufts so the ground does not read as a flat panel.
const tufts = (pts) => pts.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="${C.grass2}" opacity=".55"/>`).join('');
// A fingertip seen from above, with a touch ring.
const tip = (x, y, ring = true) => `${ring ? `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#fff" stroke-width="2" opacity=".75"/>` : ''}<circle cx="${x}" cy="${y}" r="7" fill="${C.skin}" stroke="${C.skinEdge}" stroke-width="1.5"/><ellipse cx="${x}" cy="${y - 2}" rx="3.2" ry="2.4" fill="#fff" opacity=".55"/>`;
// A finger coming in from the lower right, tip at x, y.
const finger = (x, y) => `<g transform="translate(${x} ${y}) rotate(-28)"><rect x="-7.5" y="-3" width="15" height="44" rx="7.5" fill="${C.skin}" stroke="${C.skinEdge}" stroke-width="1.5"/><rect x="-4.5" y="0" width="9" height="9" rx="4" fill="#fff" opacity=".6"/></g>`;
const arrow = (d, color = '#fff', w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
// A round HUD button like the side buttons.
const hudBtn = (x, y, inner, size = 40) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.33}" fill="${C.paper}" stroke="${C.edge}" stroke-width="1.5"/>${inner}`;
const tree = (x, y, s = 1, pine = false) => pine
  ? `<rect x="${x - 1.5 * s}" y="${y - 4 * s}" width="${3 * s}" height="${5 * s}" fill="${C.trunk}"/><path d="M${x} ${y - 24 * s}L${x + 9 * s} ${y - 3 * s}H${x - 9 * s}z" fill="${C.pine}"/>`
  : `<rect x="${x - 1.5 * s}" y="${y - 6 * s}" width="${3 * s}" height="${7 * s}" fill="${C.trunk}"/><circle cx="${x}" cy="${y - 13 * s}" r="${9 * s}" fill="${C.leaf}"/><circle cx="${x - 3 * s}" cy="${y - 16 * s}" r="${4 * s}" fill="#8ed06a"/>`;

export function guidePages(thumb) {
  const t = (key) => thumb(key);

  // 1. Tap a spot, confirm with Build; a well's reach grows the home inside it.
  const build = svg(`${tufts([[20, 20, 10], [182, 104, 12], [100, 108, 9], [120, 16, 8]])}
    <path d="M48 52l26 14-26 14-26-14z" fill="${C.ghost}" fill-opacity=".25" stroke="${C.ghost}" stroke-width="2.5" stroke-dasharray="5 3"/>
    ${model(t('home:0:0'), 48, 74, 44, 'opacity=".8"')}
    ${finger(62, 78)}${tip(62, 78)}
    <rect x="74" y="22" width="30" height="22" rx="8" fill="${C.btn}"/>${ic('check', 81, 25, 16, '#fff')}
    ${arrow('M66 54c2-4 4-6 7-8', '#fff', 2.5)}
    <ellipse cx="146" cy="70" rx="46" ry="28" fill="${C.reach}" fill-opacity=".22" stroke="${C.reach}" stroke-width="2" stroke-dasharray="5 4"/>
    ${model(t('well'), 128, 80, 40)}
    ${model(t('home:1:0'), 166, 70, 46)}
    <circle cx="186" cy="36" r="9" fill="${C.good}"/>${ic('up', 180, 30, 12, '#fff')}`);

  // 2. Water, hills and woods, each with the building that wants it.
  const land = svg(`${tufts([[96, 104, 10], [70, 18, 8]])}
    <path d="M0 0h34c-10 22 14 34 2 60s10 40 4 60H0z" fill="${C.water}"/>
    <path d="M10 18c6 4 12 0 16 4M6 62c6 4 12 0 16 4M12 98c6 4 12 0 14 4" stroke="${C.waterHi}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${model(t('fisher'), 43, 76, 42)}
    <path d="M78 98c6-26 16-44 26-48 8-4 14 2 20 10 8 12 10 26 12 38z" fill="${C.hill}"/>
    <path d="M104 50c8-4 14 2 20 10l-10 4-6-8-8 6z" fill="${C.hillHi}"/>
    ${model(t('stonecutter'), 104, 112, 38)}
    ${tree(150, 44, 1, true)}${tree(176, 50, 1.1)}${tree(190, 80, 1, true)}${tree(146, 100, 0.9)}
    ${model(t('woodcutter'), 170, 98, 40)}`);

  // 3. Story circle feeds the lamp; culture fills the star's ring.
  const bunting = ERAS.map((e, i) => `<path d="M${112 + i * 14} 10l7 0-3.5 9z" fill="${e.accent}"/>`).join('');
  const lore = svg(`${tufts([[24, 106, 10], [100, 110, 8]])}
    ${model(t('storyteller'), 34, 96, 52)}
    ${arrow('M60 64c8-10 14-12 22-12', C.ink, 2.5)}${arrow('M77 47l6 5-6 5', C.ink, 2.5)}
    ${hudBtn(86, 34, ic('knowledge', 94, 42, 24))}
    <path d="M106 10Q150 24 196 8" fill="none" stroke="${C.soft}" stroke-width="1.2"/>${bunting}
    ${hudBtn(140, 50, ic('culture', 148, 58, 24), 40)}
    <circle cx="160" cy="70" r="22.5" fill="none" stroke="${C.culture}" stroke-width="3.5"/>
    ${ic('star', 120, 86, 12, '#ffe9a8')}${ic('star', 186, 36, 10, '#fff')}${ic('culture', 182, 92, 12)}`);

  // 4. The age's wonder, then six ages along a road.
  const dots = ERAS.map((e, i) => `<circle cx="${30 + i * 28}" cy="104" r="${i === 0 ? 8 : 6}" fill="${e.accent}" stroke="#fff" stroke-width="${i === 0 ? 3 : 2}"/>`).join('');
  const ages = svg(`${tufts([[20, 24, 10], [180, 20, 9]])}
    <path d="M30 104H170" stroke="#fff" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round" opacity=".9"/>
    ${model(t('home:1:0'), 40, 80, 38)}${model(t('home:0:0'), 160, 82, 34)}
    ${model(t('stonecircle'), 100, 84, 78)}
    ${ic('wonder', 124, 10, 16, '#ffe9a8')}
    ${dots}`);

  // 5. One finger drags, two pinch, two twist.
  const look = svg(`${tufts([[100, 60, 16], [30, 100, 10], [176, 16, 9]])}
    <path d="M100 6l92 52-92 52L8 58z" fill="${C.grass2}" opacity=".35"/>
    ${tip(36, 58)}
    ${arrow('M36 38v-8M36 78v8M16 58h-8M56 58h8')}${arrow('M32 34l4-5 4 5M32 82l4 5 4-5M12 54l-5 4 5 4M60 54l5 4-5 4', '#fff', 2.5)}
    ${tip(90, 70)}${tip(112, 48)}
    ${arrow('M82 78l-9 9M120 40l9-9')}${arrow('M71 81v7h7M123 29h7v7', '#fff', 2.5)}
    ${tip(150, 50)}${tip(174, 70)}
    ${arrow('M146 74a24 24 0 0 0 20 12')}${arrow('M161 90l6-4-3-6', '#fff', 2.5)}
    ${arrow('M178 46a24 24 0 0 0 -20 -12')}${arrow('M163 30l-6 4 3 6', '#fff', 2.5)}`);

  return [
    { title: 'Build a town', art: build, points: ['Pick a building, tap the map, tap Build.', 'Homes grow with a well and more nearby.'] },
    { title: 'Mind the land', art: land, points: ['Some buildings need water, hills or woods.'] },
    { title: 'Learn and celebrate', art: lore, points: ['Story Circles make Knowledge to unlock new buildings.', 'Culture fills the star’s ring; tap it to celebrate.'] },
    { title: 'Six ages, no hurry', art: ages, points: ['Finish each wonder and grow to move on.'] },
    { title: 'Look around', art: look, points: ['Drag to move, pinch to zoom, twist to turn.', 'Mouse: wheel zooms, right-drag turns.'] },
  ];
}

// Text drawn inside the art, in the game's own fonts.
const txt = (x, y, s, size, fill = C.ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="'EB Nunito', sans-serif" font-weight="800" ${extra}>${s}</text>`;
// A path tile run: sandy band with the dashed rut the Path tile icon uses.
const path = (d) => `<path d="${d}" fill="none" stroke="#c4a678" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#8d6f45" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/>`;
// A paper panel like the HUD's.
const panel = (x, y, w, h, r = 10, fill = C.paper) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${C.edge}" stroke-width="1.5"/>`;
// A keyboard key.
const key = (x, y, label, w = 20) => `<rect x="${x}" y="${y + 2}" width="${w}" height="20" rx="5" fill="${C.edge}"/><rect x="${x}" y="${y}" width="${w}" height="20" rx="5" fill="${C.paper}" stroke="${C.edge}" stroke-width="1.2"/>${txt(x + w / 2, y + 14, label, label.length > 1 ? 8 : 10, C.ink, 'text-anchor="middle"')}`;

// "More tips": the things the short guide leaves out, offered from its last card and from the menu.
export function morePages(thumb) {
  const t = (k) => thumb(k);

  // 1. A well's water runs along the path that touches it, out to homes beyond its circle.
  const route = 'M44 80C76 80 92 58 128 56S176 40 198 36';
  const paths = svg(`${tufts([[20, 24, 10], [100, 108, 9], [178, 100, 10]])}
    <path d="${route}" fill="none" stroke="${C.reach}" stroke-opacity=".22" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="40" cy="76" rx="32" ry="22" fill="${C.reach}" fill-opacity=".22" stroke="${C.reach}" stroke-width="2" stroke-dasharray="5 4"/>
    ${path(route)}
    ${model(t('well'), 40, 82, 38)}
    ${model(t('home:1:0'), 128, 50, 40)}${model(t('home:1:0'), 172, 38, 36)}
    <circle cx="146" cy="16" r="8" fill="${C.good}"/>${ic('up', 141, 11, 10, '#fff')}
    ${hudBtn(150, 74, ic('eye', 158, 82, 20), 36)}`);

  // 2. The strip above the build bar lists each bonus for the spot under the ghost.
  const strip = svg(`${tufts([[16, 60, 9], [190, 14, 8]])}
    ${path('M-4 58H204')}
    ${tree(30, 40, 1, true)}${tree(56, 30, 0.9)}${tree(140, 34, 1)}${tree(166, 40, 1, true)}${tree(188, 46, 0.9)}${tree(14, 34, 0.8)}
    <path d="M100 22l30 16-30 16-30-16z" fill="${C.ghost}" fill-opacity=".25" stroke="${C.ghost}" stroke-width="2.5" stroke-dasharray="5 3"/>
    ${model(t('woodcutter'), 100, 58, 58, 'opacity=".9"')}
    ${panel(6, 70, 188, 44, 12)}
    ${txt(16, 86, 'Woodcutter’s Camp', 10, C.ink, 'font-family="\'EB Fraunces\', Georgia, serif" font-weight="650"')}
    ${txt(16, 98, '+45% Woodland nearby', 8, C.good)}${txt(16, 108, '+10% Beside a path', 8, C.good)}
    <rect x="142" y="80" width="44" height="24" rx="8" fill="${C.btn}"/>${ic('check', 148, 84, 14, '#fff')}${txt(163, 96, 'Build', 8, '#fff')}`);

  // 3. The bulb opens Discoveries; a locked building in the bar names the one it needs.
  const row = (y, name, tag, can) => `<rect x="94" y="${y}" width="96" height="22" rx="7" fill="${can ? '#fff' : '#e4f0d6'}" stroke="${can ? C.btn : '#b9d39c'}" stroke-width="1.5"/>${txt(101, y + 14, name, 8)}${tag}`;
  const disc = svg(`${tufts([[20, 110, 10], [70, 14, 8]])}
    ${hudBtn(12, 8, ic('knowledge', 19, 15, 22), 36)}
    <circle cx="46" cy="10" r="7" fill="#c2483a" stroke="${C.paper}" stroke-width="1.5"/>${txt(46, 13, '1', 8, '#fff', 'text-anchor="middle"')}
    ${panel(10, 54, 52, 60, 10)}
    <image href="${t('fisher')}" x="14" y="52" width="44" height="44" opacity=".45"/>
    ${ic('lock', 14, 98, 10, C.soft)}${txt(26, 106, 'Fishing', 7.5, C.soft)}
    ${arrow('M48 30c14-4 24-2 34 4', C.ink, 2.5)}${arrow('M76 30l7 4-6 5', C.ink, 2.5)}
    ${arrow('M66 86c8 0 14-4 18-10', C.ink, 2.5)}${arrow('M78 75l6 1 0 6', C.ink, 2.5)}
    ${panel(86, 8, 110, 104, 12)}
    ${txt(96, 25, 'Discoveries', 10, C.ink, 'font-family="\'EB Fraunces\', Georgia, serif" font-weight="650"')}
    ${row(36, 'Fishing', `${ic('knowledge', 160, 41, 12)}${txt(173, 51, '30', 8)}`, true)}
    ${row(62, 'Toolmaking', ic('check', 168, 68, 13, C.good), false)}
    <rect x="94" y="88" width="96" height="20" rx="7" fill="${C.paper2}" stroke="${C.edge}" stroke-width="1.5"/>${txt(101, 101, 'Monuments', 8, C.soft)}${ic('knowledge', 160, 92, 12)}${txt(173, 102, '90', 8, C.soft)}`);

  // 4. A full ring offers three festivals to choose from.
  const gift = (x, y, rot, icons) => `<g transform="rotate(${rot} ${x + 22} ${y + 30})">${panel(x, y, 44, 58, 9, '#fff')}${icons}</g>`;
  const fest = svg(`${tufts([[24, 104, 10], [180, 110, 8]])}
    <circle cx="40" cy="58" r="30" fill="${C.culture}" opacity=".18"/>
    ${hudBtn(20, 38, ic('culture', 28, 46, 24), 40)}
    <circle cx="40" cy="58" r="22.5" fill="none" stroke="${C.culture}" stroke-width="3.5"/>
    ${ic('star', 10, 18, 10, '#ffe9a8')}${ic('star', 62, 88, 9, '#fff')}
    ${arrow('M70 58h10', C.ink, 2.5)}${arrow('M75 52l6 6-6 6', C.ink, 2.5)}
    ${gift(86, 34, -8, ic('food', 96, 50, 24))}
    ${gift(118, 28, 0, `${ic('wood', 124, 36, 20)}${ic('stone', 124, 58, 20)}`)}
    ${gift(150, 34, 8, ic('people', 160, 50, 24))}`);

  // 5. Bring materials to the wonder, one stage at a time; storehouses hold more.
  const wonder = svg(`${tufts([[20, 110, 10], [190, 60, 9]])}
    ${model(t('stonecircle'), 64, 114, 78)}
    ${panel(12, 6, 104, 46, 10)}<rect x="20" y="13" width="88" height="8" rx="4" fill="${C.paper2}"/><rect x="20" y="13" width="44" height="8" rx="4" fill="#b98a4a"/>
    <rect x="20" y="26" width="88" height="19" rx="7" fill="${C.btn}"/>${ic('up', 40, 29, 13, '#fff')}${txt(56, 39.5, 'Raise', 8.5, '#fff')}
    ${model(t('storehouse'), 166, 110, 52)}
    ${ic('stone', 136, 34, 18)}${ic('wood', 158, 22, 18)}
    ${arrow('M156 62c-8-8-20-12-36-8', C.ink, 2.5)}${arrow('M127 49l-7 5 7 5', C.ink, 2.5)}`);

  // 6. The speed buttons and the desktop keys.
  const btnAt = (x, inner, on) => `${on ? `<rect x="${x}" y="11" width="28" height="26" rx="8" fill="#7d5a2c"/>` : ''}${inner}`;
  const keys = svg(`${tufts([[24, 110, 10], [186, 110, 8]])}
    ${panel(56, 8, 96, 32, 12)}
    ${btnAt(60, ic('pause', 66, 16, 16, C.soft))}${btnAt(90, ic('play', 96, 16, 16, C.soft))}${btnAt(120, ic('fast', 126, 16, 16, '#ffe9a8'), true)}
    ${tip(146, 34)}
    ${key(36, 56, 'W')}${key(14, 80, 'A')}${key(36, 80, 'S')}${key(58, 80, 'D')}
    ${key(92, 56, 'Q')}${key(114, 56, 'E')}
    ${key(152, 56, 'Esc', 32)}
    ${key(92, 80, 'Space', 92)}`);

  return [
    { title: 'Paths carry services', art: paths, points: ['Services reach further along paths that touch them.', 'The eye button shows which homes each service reaches.'] },
    { title: 'Read the bonus strip', art: strip, points: ['Before you build, the strip shows each spot’s bonus.', 'Workplaces beside a path make 10% more.'] },
    { title: 'Spend your Knowledge', art: disc, points: ['Tap the light bulb to choose Discoveries.', 'Tap a locked building to see what opens it.'] },
    { title: 'Pick a festival', art: fest, points: ['A full ring offers three gifts, like food, timber or newcomers.', 'Each festival needs more Culture than the last.'] },
    { title: 'Raise the wonder', art: wonder, points: ['Build it, then tap it and bring materials for each stage.', 'Stores too small? Build more storehouses.'] },
    { title: 'Time and keys', art: keys, points: ['Tap fast twice for top speed.', 'WASD moves, Q and E turn, space pauses, Escape cancels.'] },
  ];
}
