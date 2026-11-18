// How to play cards for Bastion Maze (shared shell guide). Art is drawn from the game's own icons and
// map colours (render.js TILE_COL), so the cards look like the board the player is about to see.
import { HERO, TOWERS, defaultMods } from './data.js';
import { ICON, towerIcon, enemyIcon, coreGem } from './icons.js';

const BG = '#0e1420', GRASS = '#5d7a46', ROCK = '#6b6862', GATE = '#3a2d3a', CORE = '#3d4f66';
const WALL = '#8f8a7e', WALL_D = '#5f5a52', PATH = '#ffe07a', GOLD = '#f0b44c', RED = '#e25c5c';
const HIGH = '#7f8f55', CRYSTAL = '#4f6272', MUD = '#6b5030', PERK = '#7fd8ff', RELIC = '#c39bff';
const SKY = '#9fd0ff', HERO_C = '#3fd0c0', AIM = '#ff7a2f', GOOD = '#4cc9a0', SKIN = '#f0c8a0', PANEL = '#18212f', LINE = '#2f3d52';

const svg = (body) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="${BG}"/>${body}</svg>`;
// An icons.js icon (32 x 32 viewBox) with its top left at x, y, drawn size wide.
const ic = (icon, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 32})">${icon.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
// The same, centred on x, y.
const icc = (icon, x, y, size) => ic(icon, x - size / 2, y - size / 2, size);

// A patch of map. rows: '.' ground, 'r' rock, 'w' wall, 'G' gate, 'C' core. path: cells joined by the dotted route.
function grid(rows, ox, oy, cs, path = []) {
  let s = '';
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const X = ox + x * cs, Y = oy + y * cs;
    const fill = ch === 'r' ? ROCK : ch === 'G' ? GATE : ch === 'C' ? CORE : GRASS;
    s += `<rect x="${X + 0.5}" y="${Y + 0.5}" width="${cs - 1}" height="${cs - 1}" rx="2" fill="${fill}"/>`;
    if (ch === 'w') s += `<rect x="${X + 1.5}" y="${Y + 1.5}" width="${cs - 3}" height="${cs - 3}" rx="1.5" fill="${WALL}"/><path d="M${X + 1.5} ${Y + cs / 2}h${cs - 3}" stroke="${WALL_D}" stroke-width="1.2"/>`;
    if (ch === 'G') s += `<path d="M${X + cs * 0.25} ${Y + cs - 3}v${-cs * 0.38}a${cs * 0.25} ${cs * 0.25} 0 0 1 ${cs * 0.5} 0v${cs * 0.38}" fill="${RED}" fill-opacity=".35" stroke="${RED}" stroke-width="2.2"/>`;
    if (ch === 'C') s += coreGem(X + cs / 2, Y + cs / 2, cs * 0.38);
  }));
  if (path.length) {
    const pts = path.map(([x, y]) => `${ox + x * cs + cs / 2},${oy + y * cs + cs / 2}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${PATH}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 4"/>`;
  }
  return s;
}
const at = (ox, oy, cs) => (x, y) => [ox + x * cs + cs / 2, oy + y * cs + cs / 2];

// A finger coming in from the lower right, fingertip at x, y, with a touch ring.
const finger = (x, y, angle = -26) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`
  + `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-6.5" y="-3" width="13" height="40" rx="6.5" fill="${SKIN}" stroke="#b98c62" stroke-width="1.2"/><rect x="-3.5" y="0" width="7" height="8" rx="3.5" fill="#fff" opacity=".55"/></g>`;
const check = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="${GOOD}" stroke="${BG}" stroke-width="1.5"/><path d="M${x - 3.2} ${y}l2.2 2.3 4.2-4.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="${RED}" stroke="${BG}" stroke-width="1.5"/><path d="M${x - 2.6} ${y - 2.6}l5.2 5.2M${x + 2.6} ${y - 2.6}l-5.2 5.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;

// 1. Enemies walk from the gate to the core; one reaching it breaks a heart.
function coreArt() {
  const cs = 16, ox = 4, oy = 4, p = at(ox, oy, cs);
  let s = grid(['............', '..r.....r...', '............', 'G..........C', '............', '....r.....r.', '............'], ox, oy, cs, [[0, 3], [11, 3]]);
  for (const [x, type] of [[2.2, 'grunt'], [4.6, 'runner'], [6.8, 'grunt'], [9.6, 'brute']]) s += icc(enemyIcon(type), ...p(x, 3), 15);
  // The core is hit: a flash ring and a broken heart above it.
  const [cx, cy] = p(11, 3);
  s += `<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${RED}" stroke-width="2" opacity=".8"/>`;
  s += icc(ICON.heart, cx - 4, cy - 26, 22) + `<path d="M${cx - 5} ${cy - 36}l3 5-3 4 3 5" fill="none" stroke="${BG}" stroke-width="2" stroke-linejoin="round"/>`;
  return svg(s);
}

// 2. An open field becomes a walled maze; the route grows long. A finger places the last wall.
function mazeArt() {
  const cs = 12, oy = 18;
  let s = grid(['.......', '.......', '.......', 'G.....C', '.......', '.......', '.......'], 6, oy, cs, [[0, 3], [6, 3]]);
  s += `<path d="M93 60h12M100 54l6 6-6 6" fill="none" stroke="#9aa8bc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += grid(['...w...', '.w.w.w.', '.w.w.w.', 'Gw.w.wC', '.w.w.w.', '.w.w.w.', '.w...w.'], 110, oy, cs,
    [[0, 3], [0, 0], [2, 0], [2, 6], [4, 6], [4, 0], [6, 0], [6, 3]]);
  const [fx, fy] = at(110, oy, cs)(5, 6);
  s += `<rect x="${fx - 7}" y="${fy - 7}" width="14" height="14" rx="3" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
  s += finger(fx + 2, fy + 3);
  return svg(s);
}

// 3. A wasp flies straight over the maze while a raider walks it; which towers can shoot it.
function flyerArt() {
  const cs = 16, ox = 6, oy = 12, p = at(ox, oy, cs);
  let s = grid(['...w...', '.w.w.w.', 'Gw.w.wC', '.w.w.w.', '.w.w.w.', '.w...w.'], ox, oy, cs,
    [[0, 2], [0, 0], [2, 0], [2, 5], [4, 5], [4, 0], [6, 0], [6, 2]]);
  s += icc(enemyIcon('grunt'), ...p(2, 3.6), 13);
  const [gx, gy] = p(0, 2), [cx] = p(6, 2);
  s += `<path d="M${gx} ${gy}H${cx - 10}" stroke="${SKY}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="5 4"/>`;
  for (const x of [1.9, 4.1]) {
    const [wx, wy] = p(x, 2);
    s += `<ellipse cx="${wx}" cy="${wy + 9}" rx="6" ry="2" fill="#000" opacity=".3"/>` + icc(enemyIcon('wasp'), wx, wy - 2, 18);
  }
  // Tower picks: three that hit flyers, the cannon that cannot.
  s += `<rect x="126" y="12" width="68" height="96" rx="10" fill="${PANEL}" stroke="${LINE}"/>`;
  [['arrow', 143, 36, true], ['frost', 177, 36, true], ['tesla', 143, 82, true], ['cannon', 177, 82, false]].forEach(([t, x, y, ok]) => {
    s += `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" rx="7" fill="#212c3d"/>` + icc(towerIcon(t), x, y, 22) + (ok ? check(x + 11, y - 12) : cross(x + 11, y - 12));
  });
  return svg(s);
}

// 4. A kill drops gold; tap a tower and spend it on the next level.
function upgradeArt() {
  let s = `<rect x="0" y="86" width="200" height="34" fill="${GRASS}" opacity=".35"/>`;
  // Defeated raider with a burst, coins arcing up to the gold counter.
  s += icc(enemyIcon('grunt'), 30, 80, 22) + `<path d="M30 62v-6M44 68l5-4M16 68l-5-4M46 82h6M14 82H8" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  s += `<path d="M34 64C44 34 66 26 82 30" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/>`;
  s += icc(ICON.coin, 44, 46, 12) + icc(ICON.coin, 60, 34, 12);
  s += `<rect x="78" y="16" width="46" height="26" rx="8" fill="${PANEL}" stroke="${LINE}"/>` + icc(ICON.coin, 92, 29, 16)
    + `<rect x="103" y="26" width="15" height="6" rx="3" fill="${GOLD}" opacity=".85"/>`;
  // The tower on its tile, levelling up, and the finger tapping it.
  s += `<rect x="132" y="50" width="46" height="46" rx="5" fill="${GRASS}"/>` + icc(towerIcon('arrow'), 155, 72, 34);
  s += `<path d="M146 44l9-9 9 9M146 34l9-9 9 9" fill="none" stroke="${GOOD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += [0, 1, 2].map((k) => `<circle cx="${147 + k * 8}" cy="104" r="3" fill="${k < 2 ? GOLD : 'none'}" stroke="${GOLD}" stroke-width="1.5"/>`).join('');
  s += `<path d="M124 32C136 34 140 40 144 46" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/>`;
  s += finger(168, 84);
  return svg(s);
}

// 5. Hero control: the hero button, a stick for each thumb, shots at an enemy.
function heroArt() {
  let s = `<rect x="0" y="0" width="200" height="120" fill="#25381f"/>`;
  s += `<rect x="0" y="0" width="100" height="120" fill="${HERO_C}" opacity=".1"/><rect x="100" y="0" width="100" height="120" fill="${AIM}" opacity=".1"/>`;
  s += `<path d="M100 8V112" stroke="#fff" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  // Hero button, tapped.
  s += `<rect x="8" y="8" width="32" height="32" rx="9" fill="${HERO_C}" fill-opacity=".22" stroke="${HERO_C}"/>` + icc(ICON.hero, 24, 24, 22);
  s += `<circle cx="24" cy="24" r="21" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`;
  // Sticks with a thumb on each.
  const stick = (x, y, kx, ky, ring, knob) => `<circle cx="${x}" cy="${y}" r="20" fill="#fff" fill-opacity=".06" stroke="${ring}" stroke-width="2"/><circle cx="${x + kx}" cy="${y + ky}" r="8" fill="${knob}"/><ellipse cx="${x + kx + 1}" cy="${y + ky + 2}" rx="7" ry="8.5" fill="${SKIN}" opacity=".75"/>`;
  s += stick(50, 86, 8, -6, 'rgba(255,255,255,.45)', 'rgba(255,255,255,.55)') + stick(150, 86, 9, -7, 'rgba(255,122,47,.75)', 'rgba(255,140,70,.75)');
  // The hero, its shots, and the enemy it aims at.
  s += icc(ICON.hero, 96, 50, 26);
  s += [0, 1, 2].map((k) => `<circle cx="${116 + k * 12}" cy="${42 - k * 6}" r="2" fill="#9ff0ff"/>`).join('');
  s += icc(enemyIcon('runner'), 162, 24, 18) + `<path d="M150 14l-4-4M174 14l4-4M162 10V5" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/>`;
  return svg(s);
}

export function guidePages() {
  return [
    { title: 'Defend the core', art: coreArt(), points: ['Enemies walk from a red gate to your crystal core.', 'Each one that gets through costs lives.'] },
    { title: 'Build the maze', art: mazeArt(), points: ['Pick a tower, tap a tile, press Build.', 'Enemies take the shortest path. Walls stretch it.'] },
    { title: 'Flyers skip the maze', art: flyerArt(), points: ['Archer, Frost and Tesla hit them. Cannon can’t.'] },
    { title: 'Upgrade with gold', art: upgradeArt(), points: ['Kills and waves pay gold. Tap a tower to upgrade it.'] },
    { title: 'Play the hero', art: heroArt(), points: [`A hero joins by wave ${HERO.unlockWave}. Tap the hero button to play.`] },
  ];
}

// ---------------------------------------------------------------- More tips (optional extra cards)

// A range ring, dashed.
const ring = (x, y, r, col, op = 0.9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" fill-opacity=".08" stroke="${col}" stroke-opacity="${op}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
// A big map tile, centred on x, y.
const tile = (x, y, size, fill) => `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="4" fill="${fill}"/>`;

// 1. High ground stretches range, crystal adds damage, mud slows walkers and takes no towers.
function groundArt() {
  let s = '';
  // High ground: a raised tile, the tower's ring grows past the faint normal one.
  s += ring(36, 70, 22, '#ffffff', 0.25) + ring(36, 70, 30, GOOD);
  s += `<rect x="18" y="56" width="36" height="36" rx="4" fill="#4f5a35"/>` + tile(36, 70, 36, HIGH) + icc(towerIcon('arrow'), 36, 70, 26);
  s += `<path d="M36 26l-7 8h14z" fill="${GOOD}"/>`;
  // Crystal: a tile with shards, the tower's shot hits harder.
  s += tile(100, 82, 36, CRYSTAL) + coreGem(87, 92, 5) + coreGem(113, 73, 4) + icc(towerIcon('cannon'), 100, 82, 26);
  s += icc(enemyIcon('brute'), 100, 34, 20) + `<path d="M100 66V50" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`;
  s += `<path d="M88 26l-5-4M112 26l5-4M86 38h-6M114 38h6" stroke="${RED}" stroke-width="2.2" stroke-linecap="round"/>`;
  // Mud: a slow enemy with short steps, and no tower allowed.
  s += tile(164, 82, 36, MUD) + `<path d="M150 74c4-3 8 3 12 0s8 3 12 0M150 90c4-3 8 3 12 0s8 3 12 0" fill="none" stroke="#4a3620" stroke-width="2" stroke-linecap="round"/>`;
  s += icc(enemyIcon('grunt'), 160, 78, 18) + `<path d="M140 78h-6M141 84h-4" stroke="#c9b08a" stroke-width="2" stroke-linecap="round"/>`;
  s += cross(178, 64);
  return svg(s);
}

// 2. Counters: sniper through knight armour, tesla through warden shields, menders first, a boss every tenth wave.
function enemyArt() {
  let s = '';
  // Knight and the sniper's piercing line.
  s += icc(enemyIcon('knight'), 28, 36, 26) + icc(towerIcon('sniper'), 28, 92, 26);
  s += `<path d="M28 80V52" stroke="${PATH}" stroke-width="2.5" stroke-linecap="round"/><path d="M28 50V20" stroke="${PATH}" stroke-width="1.5" stroke-dasharray="2 3" stroke-linecap="round"/>`;
  // Warden: its shield ring broken by the tesla arc.
  s += icc(enemyIcon('warden'), 76, 36, 24) + `<path d="M62 30a15 15 0 0 1 28 0M62 42a15 15 0 0 0 10 8" fill="none" stroke="#5aa7e0" stroke-width="2.5" stroke-linecap="round"/>`;
  s += icc(towerIcon('tesla'), 76, 92, 26) + `<path d="M76 80l-5-8 7-3-5-8 6-4-3-6" fill="none" stroke="${RELIC}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  // Mender healing its neighbours, with a target on it.
  s += icc(enemyIcon('grunt'), 112, 78, 16) + icc(enemyIcon('runner'), 140, 80, 16) + icc(enemyIcon('mender'), 126, 40, 24);
  s += `<path d="M112 64v-6M109 61h6M140 66v-6M137 63h6" stroke="#6fe0a0" stroke-width="2" stroke-linecap="round"/>`;
  s += `<circle cx="126" cy="40" r="16" fill="none" stroke="${RED}" stroke-width="2"/><path d="M126 20v8M126 52v8M106 40h8M138 40h8" stroke="${RED}" stroke-width="2" stroke-linecap="round"/>`;
  // Boss with its wave marker.
  s += `<circle cx="176" cy="44" r="20" fill="#ff7a2f" fill-opacity=".14" stroke="#ff7a2f" stroke-opacity=".6" stroke-width="1.5"/>` + icc(enemyIcon('behemoth'), 176, 44, 32);
  s += icc(ICON.wave, 176, 92, 24);
  return svg(s);
}

// 3. The next wave chip, Send with its bonus, and an ability aimed at the map.
function wavesArt() {
  let s = `<rect x="0" y="0" width="200" height="120" fill="#25381f"/>`;
  // Next wave chip with enemies, tapped.
  s += `<rect x="6" y="6" width="104" height="28" rx="8" fill="${PANEL}" stroke="${LINE}"/>`;
  s += [['grunt', 20], ['runner', 44], ['wasp', 68], ['brute', 92]].map(([t, x]) => icc(enemyIcon(t), x, 20, 15)).join('');
  // Send button with the early bonus.
  s += `<rect x="116" y="6" width="78" height="28" rx="8" fill="#2e6b52" stroke="${GOOD}"/>` + icc(ICON.play, 130, 20, 14);
  s += `<rect x="142" y="16" width="20" height="7" rx="3.5" fill="#bff5dc" opacity=".8"/>` + icc(ICON.coin, 172, 20, 12) + `<path d="M182 17v6M179 20h6" stroke="#bff5dc" stroke-width="2" stroke-linecap="round"/>`;
  // Ability buttons; meteor armed.
  s += `<circle cx="180" cy="62" r="14" fill="#ff7a2f" fill-opacity=".25" stroke="#ff7a2f" stroke-width="2"/>` + icc(ICON.meteor, 180, 62, 18);
  s += `<circle cx="180" cy="96" r="14" fill="${PANEL}" stroke="${LINE}"/>` + icc(ICON.freeze, 180, 96, 18);
  s += `<path d="M193 96a13 13 0 0 1-13 13" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`;
  // The strike on the map: enemies on the path, the target ring, the finger.
  s += `<path d="M8 84H150" stroke="${PATH}" stroke-opacity=".5" stroke-width="2" stroke-dasharray="0.1 4" stroke-linecap="round"/>`;
  s += icc(enemyIcon('grunt'), 62, 84, 14) + icc(enemyIcon('grunt'), 82, 84, 14) + icc(enemyIcon('swarm'), 98, 84, 12);
  s += `<circle cx="80" cy="84" r="22" fill="#ff7a2f" fill-opacity=".15" stroke="#ff7a2f" stroke-width="2" stroke-dasharray="5 3"/>`;
  s += finger(92, 92);
  return svg(s);
}

// 4. Three cards to pick from: a perk, a relic and a curse. The middle one is chosen.
function cardsArt() {
  const card = (x, y, col, body, on) => `<rect x="${x}" y="${y}" width="50" height="74" rx="9" fill="${on ? '#212c3d' : PANEL}" stroke="${col}" stroke-width="${on ? 2.5 : 1.5}"/>`
    + `<rect x="${x + 8}" y="${y + 52}" width="34" height="5" rx="2.5" fill="${col}" opacity=".7"/><rect x="${x + 12}" y="${y + 61}" width="26" height="4" rx="2" fill="#9aa8bc" opacity=".5"/>` + body;
  let s = '';
  s += card(16, 32, PERK, icc(towerIcon('arrow'), 41, 58, 22) + `<path d="M50 44l5-5 5 5M50 50l5-5 5 5" fill="none" stroke="${PERK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(2 4)"/>`, false);
  s += card(75, 20, RELIC, icc(ICON.star, 100, 44, 26), true);
  s += card(134, 32, RED, icc(ICON.skull, 159, 56, 24), false);
  s += `<path d="M100 8v-2M88 10l-2-2M112 10l2-2" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  s += finger(110, 84);
  return svg(s);
}

// 5. Selling: coins back from a tower. Specialising: one of two paths, the other closed for good.
function sellArt() {
  let s = '';
  // Sell: tower on its tile, coins rising back to the counter.
  s += tile(40, 82, 40, GRASS) + icc(towerIcon('cannon'), 40, 82, 30);
  s += `<path d="M40 58C40 44 50 32 66 28" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/>`;
  s += icc(ICON.coin, 42, 52, 11) + icc(ICON.coin, 52, 38, 11);
  s += `<rect x="62" y="14" width="34" height="24" rx="7" fill="${PANEL}" stroke="${LINE}"/>` + icc(ICON.coin, 74, 26, 14) + `<path d="M84 26h8M88 22v8" stroke="${GOOD}" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<path d="M104 10V110" stroke="#fff" stroke-opacity=".15" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  // Specialise: one tower, two paths; one taken, one closed.
  const bx = 152, by = 96;
  s += `<path d="M${bx} ${by - 14}L${bx - 26} 46M${bx} ${by - 14}L${bx + 26} 46" stroke="#9aa8bc" stroke-width="2.5" stroke-linecap="round"/>`;
  s += `<path d="M${bx} ${by - 14}L${bx - 26} 46" stroke="${GOOD}" stroke-width="3" stroke-linecap="round"/>`;
  s += tile(bx, by, 30, GRASS) + icc(towerIcon('arrow'), bx, by, 24);
  s += `<circle cx="${bx - 26}" cy="32" r="17" fill="#212c3d" stroke="${GOOD}" stroke-width="2"/>` + icc(towerIcon('arrow'), bx - 30, 32, 18) + icc(towerIcon('arrow'), bx - 22, 28, 14) + check(bx - 12, 18);
  s += `<g opacity=".45"><circle cx="${bx + 26}" cy="32" r="17" fill="${PANEL}" stroke="${LINE}" stroke-width="2"/>${icc(towerIcon('arrow'), bx + 26, 32, 20)}</g>` + cross(bx + 40, 18);
  return svg(s);
}

// Extra cards behind the "More tips" link: the ground, the enemy, waves, cards, and selling.
export function morePages() {
  const sell = Math.round(defaultMods().sellRate * 100);
  return [
    { title: 'Read the ground', art: groundArt(), points: ['High ground gives towers +20% range. Crystal gives +25% damage.', 'Mud halves enemy speed, but you can’t build on it.'] },
    { title: 'Know the enemy', art: enemyArt(), points: [`${TOWERS.sniper.name} and ${TOWERS.venom.name} ignore armour. ${TOWERS.tesla.name} tears through shields.`, 'Kill menders first. Every 10th wave brings a boss.'] },
    { title: 'Waves and abilities', art: wavesArt(), points: ['Tap Next to see who is coming. Send early for bonus gold.', 'For Meteor, tap it, then tap the map.'] },
    { title: 'Pick a card', art: cardsArt(), points: ['Every 5 waves, choose one of three cards.', 'Perks stack, relics are one of a kind, curses trade risk for reward.'] },
    { title: 'Sell or specialise', art: sellArt(), points: [`Selling refunds ${sell}%, or everything if built since the last wave.`, 'Top upgrades split into two paths. The choice is permanent.'] },
  ];
}
