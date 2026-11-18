// How to play: the shared shell guide, drawn with the game's own icons, HUD layout and colours. Facts come from data.js.
import { openGuide, MORE_LABEL } from '../../shell/guide.js';
import { glyph } from './icons.js';
import {
  CLASSES, ABILITIES, PERK_TAGS, BIOMES, RARITIES, WEAPONS, ARMORS, TRINKETS, POTION_HEAL, biomeFor, isBossFloor, isShopFloor,
} from './data.js';

const hex = (n) => `#${(n >>> 0).toString(16).padStart(6, '0')}`;
// overflow visible: on short screens the art box is wider than 5:3, so backgrounds run past the viewBox.
const svg = (body) => `<svg viewBox="0 0 200 120" overflow="visible" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const grid = (op) => {
  let s = '';
  for (let x = -75; x <= 275; x += 25) s += `<path d="M${x} 0V120" stroke="#ffffff" stroke-opacity="${op}"/>`;
  for (let y = 0; y <= 120; y += 25) s += `<path d="M-80 ${y}H280" stroke="#ffffff" stroke-opacity="${op}"/>`;
  return s;
};
const GOLD = '#f0b44c', RED = '#ff4030', ENERGY = '#2f74d0', STAIRS = '#8fd8ff';

// Dungeon floor in the Crypt's colours, with faint tile seams.
function floor() {
  const b = BIOMES[0];
  return `<rect x="-80" width="360" height="120" fill="${hex(b.bg)}"/><rect x="-80" width="360" height="120" fill="${hex(b.floorAlt)}" opacity=".55"/>${grid(0.05)}`;
}
// A HUD action button as style.css draws it.
function button(x, y, r, ic, col, { cost = null, ring = false } = {}) {
  const g = r * 0.95;
  let s = ring ? `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="none" stroke="${GOLD}" stroke-width="1.8"/>` : '';
  s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#262c40" stroke="#ffffff47" stroke-width="1.2"/>${glyph(ic, x - g / 2, y - g / 2, g, col)}`;
  if (cost != null) {
    s += `<rect x="${x + r * 0.45}" y="${y - r - 2}" width="15" height="10" rx="5" fill="#12284a" stroke="#5ea8ff" stroke-width=".8"/>`
      + `<text x="${x + r * 0.45 + 7.5}" y="${y - r + 5.6}" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="7" font-weight="800" fill="#cfe6ff">${cost}</text>`;
  }
  return s;
}
// A thumb pressing down, seen from above; (x, y) is the contact point.
function thumb(x, y, angle) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})" opacity=".82"><rect x="-8" y="-6" width="16" height="40" rx="8" fill="#f1d3bf"/><rect x="-5" y="-3" width="10" height="11" rx="5" fill="#fff" opacity=".45"/></g>`;
}
function hero(x, y, classId, r = 7, opacity = 1) {
  const c = CLASSES[classId];
  return `<g opacity="${opacity}"><circle cx="${x}" cy="${y}" r="${r}" fill="${hex(c.color)}" stroke="${hex(c.accent)}" stroke-width="1.6"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".3"/></g>`;
}

// 1. The lower screen to scale (390 pt wide, bottom 234 pt): floating stick on the left, buttons on the right.
function controlsArt(classId) {
  const k = 200 / 390, X = (v) => +(v * k).toFixed(1), Y = (v) => +((v - 610) * k).toFixed(1), R = (d) => +(d * k / 2).toFixed(1);
  const [a1, a2] = CLASSES[classId].abilities.map((a) => ABILITIES[a]);
  let s = `<rect x="-80" width="360" height="120" fill="#0b0f18"/>${grid(0.04)}`;
  // Stick: base, knob pushed up-right, the way it moves.
  const jx = X(84), jy = Y(716), jr = R(108);
  s += `<circle cx="${jx}" cy="${jy}" r="${jr}" fill="#ffffff14" stroke="#ffffff47" stroke-width="1.2"/>`;
  for (const [dx, dy, rot] of [[0, -1, 0], [1, 0, 90], [0, 1, 180], [-1, 0, 270]]) {
    s += `<path d="M-3 2 0 -1 3 2" transform="translate(${jx + dx * (jr - 5)} ${jy + dy * (jr - 5)}) rotate(${rot})" fill="none" stroke="#9fc8ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
  }
  const kx = jx + 9, ky = jy - 7;
  s += `<circle cx="${kx}" cy="${ky}" r="${R(50)}" fill="#f0f4ff6b" stroke="#ffffff99" stroke-width="1.2"/>`;
  s += thumb(kx, ky, 28);
  // Buttons where style.css puts them.
  s += button(X(187), Y(795), R(50), 'bomb', '#c8ccd8');
  s += button(X(265), Y(719), R(50), 'potion', '#ff6070');
  s += button(X(254), Y(794), R(64), a1.icon, '#ffe8b0', { cost: a1.energy });
  s += button(X(336), Y(698), R(64), a2.icon, '#ffe8b0', { cost: a2.energy });
  s += button(X(336), Y(782), R(80), 'dash', '#d8e8ff', { ring: true });
  s += thumb(X(336) + 7, Y(782) + 8, -30);
  return svg(s);
}

// 2. Your weapon strikes the nearest foe on its own; a brute's red circle, and you stepping out of it.
function fightArt(classId) {
  let s = floor();
  const tx = 132, ty = 58;
  s += `<circle cx="${tx}" cy="${ty}" r="34" fill="${RED}" fill-opacity=".26" stroke="${RED}" stroke-opacity=".85" stroke-width="2"/>`;
  // Rock brute winding up, flashing red.
  s += `<circle cx="${tx + 14}" cy="${ty - 12}" r="14" fill="none" stroke="${RED}" stroke-opacity=".55" stroke-width="2"/><circle cx="${tx + 14}" cy="${ty - 12}" r="10.5" fill="#ff3020"/>`;
  // Where you were, the step out, where you are.
  s += hero(118, 74, classId, 7, 0.3);
  s += `<path d="M110 78 L80 90" stroke="#a0c8ff" stroke-width="2.2" stroke-dasharray="4 4" stroke-linecap="round"/><path d="M78 85 l-6 7 9 1z" fill="#a0c8ff"/>`;
  s += hero(64, 94, classId, 8);
  // Automatic swing at the nearest skeleton.
  s += `<path d="M58 80 A16 16 0 0 0 48 94" fill="none" stroke="#ffffffd0" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="38" cy="78" r="7" fill="#d9d2bd"/><circle cx="35.5" cy="77" r="1.3" fill="#2a2620"/><circle cx="40.5" cy="77" r="1.3" fill="#2a2620"/>`;
  s += glyph('spark', 42, 80, 10, '#ffe14a');
  return svg(s);
}

// 3. Your two skills with their energy cost, one recharging, and the energy bar filling back up.
function skillsArt(classId) {
  const [a1, a2] = CLASSES[classId].abilities.map((a) => ABILITIES[a]);
  let s = `<rect x="-80" width="360" height="120" fill="#0b0f18"/>`;
  s += button(64, 50, 22, a1.icon, '#ffe8b0', { cost: a1.energy });
  s += button(136, 50, 22, a2.icon, '#ffe8b0', { cost: a2.energy });
  // Recharge sweep on the second skill, as the HUD shows it.
  s += `<path d="M136 50 L136 28 A22 22 0 1 1 115.1 56.8 Z" fill="#05070c" opacity=".62"/>`;
  s += thumb(76, 62, -24);
  // Energy bar, about two thirds full, with a refill arrow.
  s += `<rect x="40" y="94" width="120" height="10" rx="3" fill="#0a0c14" stroke="#ffffff2e"/>`;
  s += `<rect x="41" y="95" width="80" height="8" rx="2" fill="${ENERGY}"/><rect x="121" y="95" width="12" height="8" fill="${ENERGY}" opacity=".35"/>`;
  s += glyph('bolt', 26, 92, 13, '#7cc4ff');
  s += `<path d="M138 99h14m-4-4 4 4-4 4" fill="none" stroke="#7cc4ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(s);
}

// 4. Three relic cards on level up; three of one colour light a synergy.
function relicsArt() {
  const fire = PERK_TAGS.fire.color, tags = [fire, PERK_TAGS.frost.color, fire];
  let s = `<rect x="-80" width="360" height="120" fill="#0b0f18"/>`;
  tags.forEach((c, i) => {
    const x = 14 + i * 60, sel = i === 1;
    s += `<rect x="${x}" y="12" width="52" height="58" rx="7" fill="${sel ? '#212c3d' : '#18212f'}" stroke="${sel ? GOLD : '#2f3d52'}" stroke-width="${sel ? 2 : 1.4}"/>`;
    s += `<rect x="${x + 7}" y="21" width="30" height="5" rx="2.5" fill="#eef2f7" opacity=".85"/>`;
    s += `<rect x="${x + 7}" y="31" width="22" height="8" rx="4" fill="none" stroke="${c}" stroke-width="1.3"/>`;
    s += `<rect x="${x + 7}" y="45" width="38" height="3.5" rx="1.75" fill="#9aa8bc" opacity=".6"/><rect x="${x + 7}" y="52" width="30" height="3.5" rx="1.75" fill="#9aa8bc" opacity=".6"/>`;
  });
  // Three fire tags, then the synergy they unlock.
  for (let i = 0; i < 3; i++) s += `<rect x="${50 + i * 20}" y="88" width="16" height="9" rx="4.5" fill="${fire}" opacity=".9"/>`;
  s += `<path d="M115 92.5h14m-4-4 4 4-4 4" fill="none" stroke="#9aa8bc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<circle cx="146" cy="92.5" r="14" fill="${fire}" opacity=".18"/>${glyph('star', 136, 82.5, 20, fire)}`;
  return svg(s);
}

// 5. Glowing stairs with the Descend button; a boss crown on every fifth floor.
function deeperArt(classId) {
  let s = floor();
  // Stairs: dark hole, steps, cyan ring and beam as render.js draws them.
  const sx = 52, sy = 52;
  s += `<ellipse cx="${sx}" cy="${sy + 2}" rx="34" ry="28" fill="${STAIRS}" opacity=".1"/>`;
  s += `<rect x="${sx - 18}" y="${sy - 12}" width="36" height="28" rx="2" fill="#000"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="${sx - 15}" y="${sy - 9 + i * 8}" width="30" height="5" fill="#7a7480" opacity="${1 - i * 0.25}"/>`;
  s += `<ellipse cx="${sx}" cy="${sy + 2}" rx="28" ry="22" fill="none" stroke="${STAIRS}" stroke-width="2.4" opacity=".75"/>`;
  s += hero(sx + 22, sy + 28, classId, 7);
  // Descend button, as the HUD's gold action button.
  s += `<rect x="14" y="94" width="80" height="20" rx="10" fill="#e2a238"/><rect x="14" y="94" width="80" height="10" rx="10" fill="#ffd877" opacity=".5"/>`;
  s += glyph('stairs', 22, 98, 12, '#241604') + `<rect x="40" y="101.5" width="44" height="5" rx="2.5" fill="#241604" opacity=".75"/>`;
  // Floors 1 to 5 going down, the fifth guarded by a boss.
  for (let f = 1; f <= 5; f++) {
    const x = 106 + (f - 1) * 13, y = 12 + (f - 1) * 17, boss = isBossFloor(f);
    s += `<rect x="${x}" y="${y}" width="${boss ? 34 : 28}" height="${boss ? 18 : 12}" rx="3" fill="${hex(biomeFor(f).floor)}" stroke="${boss ? '#ff8a7a' : '#ffffff26'}" stroke-width="${boss ? 1.8 : 1}"/>`;
    if (boss) s += glyph('crown', x + 9, y + 1, 16, '#ff8a7a');
  }
  return svg(s);
}

// keyboard: a mouse-and-keyboard player also gets the keys (input.js KEYMAP).
export function guidePages(classId, keyboard = false) {
  const id = CLASSES[classId] ? classId : 'warden';
  const move = keyboard
    ? ['Drag low on the screen, or press WASD, to move.', 'Dash through attacks: big button or Space.']
    : ['Drag low on the screen to move.', 'Tap the big button to dash through attacks.'];
  const cast = keyboard ? 'Tap a skill, or press Q or E.' : 'Tap a skill to cast it.';
  return [
    { title: 'Move and dash', art: controlsArt(id), points: move },
    { title: 'Attacks are automatic', art: fightArt(id), points: ['You strike the nearest enemy in reach.', 'Get out of the red before it lands.'] },
    { title: 'Skills cost energy', art: skillsArt(id), points: [`${cast} Energy refills over time.`] },
    { title: 'Level up, pick a relic', art: relicsArt(), points: ['Each level, choose one of three relics.', 'Three of one colour unlock a synergy.'] },
    { title: 'Go deeper', art: deeperArt(id), points: ['At the stairs, tap Descend. Every fifth floor has a boss.', 'Death ends the run.'] },
  ];
}

// ---------------------------------------------------------------- More tips: the topics the five cards leave out.
const GREEN = '#4cd98a';
const skeleton = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#d9d2bd"/><circle cx="${x - 2.5}" cy="${y - 1}" r="1.3" fill="#2a2620"/><circle cx="${x + 2.5}" cy="${y - 1}" r="1.3" fill="#2a2620"/>`;
const arrow = (x1, y1, x2, y2, col = '#a0c8ff') => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 5;
  const p = (d) => `${(x2 + Math.cos(a + d) * h).toFixed(1)} ${(y2 + Math.sin(a + d) * h).toFixed(1)}`;
  return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"/><path d="M${p(2.6)} L${x2} ${y2} L${p(-2.6)}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
};
// The gold context button the HUD shows near stairs, shops and shrines.
const goldButton = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="20" rx="10" fill="#e2a238"/><rect x="${x}" y="${y}" width="${w}" height="10" rx="10" fill="#ffd877" opacity=".5"/>`
  + glyph('hand', x + 8, y + 4, 12, '#241604') + `<rect x="${x + 26}" y="${y + 7.5}" width="${w - 36}" height="5" rx="2.5" fill="#241604" opacity=".75"/>`;
// A glowing diamond, the way pedestals and shrines hold their wares.
const gemTop = (x, y, col, r = 6) => `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${col}" opacity=".18"/><path d="M${x} ${y - r * 1.3}L${x + r} ${y} ${x} ${y + r * 1.3} ${x - r} ${y}z" fill="${col}"/>`;

// 1. Gold, potions and bombs drift to you; the bag, with rarity borders and the green upgrade arrow.
function lootArt(classId) {
  let s = floor();
  s += hero(46, 68, classId, 8);
  s += glyph('coin', 10, 22, 13, '#ffcc40') + arrow(24, 32, 37, 55, '#ffcc40');
  s += glyph('potion', 70, 20, 14, '#ff6070') + arrow(72, 35, 55, 56, '#ff8a90');
  s += glyph('bomb', 8, 90, 14, '#c8ccd8') + arrow(24, 92, 36, 78, '#c8ccd8');
  // The bag panel, as the inventory draws its cells.
  s += `<rect x="100" y="8" width="96" height="104" rx="10" fill="#0b0f18" stroke="#2f3d52" stroke-width="1.4"/>`;
  s += glyph('bag', 108, 15, 14, '#eef2f7') + `<rect x="127" y="19.5" width="34" height="5" rx="2.5" fill="#eef2f7" opacity=".7"/>`;
  const its = [WEAPONS.sword.icon, ARMORS.leather.icon, TRINKETS.ring.icon, WEAPONS.bow.icon, TRINKETS.amulet.icon, null];
  its.forEach((ic, k) => {
    const x = 108 + (k % 3) * 28, y = 40 + Math.floor(k / 3) * 32, r = RARITIES[k];
    s += `<rect x="${x}" y="${y}" width="24" height="26" rx="6" fill="#0c1018" stroke="${r ? r.color : '#2f3d52'}" stroke-width="1.6"/>`;
    if (ic) s += glyph(ic, x + 4, y + 5, 16, r.color);
    if (k === 2) s += glyph('up', x + 1, y + 1, 9, GREEN);
  });
  return svg(s);
}

// 2. A potion fills the health bar back up; a bomb arcs to the nearest enemy.
function potionArt(classId) {
  let s = floor();
  const heal = Math.round(76 * POTION_HEAL);
  s += `<rect x="10" y="10" width="80" height="10" rx="3" fill="#0a0c14" stroke="#ffffff2e"/>`;
  s += `<rect x="11" y="11" width="26" height="8" rx="2" fill="#c2303a"/><rect x="37" y="11" width="${heal}" height="8" fill="#ff8a8a"/>`;
  s += button(34, 60, 16, 'potion', '#ff6070');
  s += arrow(40, 42, 52, 26, '#ff8a90');
  // Bomb in flight and the orange ring where it will burst.
  s += hero(104, 92, classId, 8);
  s += `<path d="M110 84 Q138 18 166 46" fill="none" stroke="#ffa040" stroke-width="1.8" stroke-dasharray="3 4" stroke-linecap="round"/>`;
  s += glyph('bomb', 126, 30, 16, '#c8ccd8');
  s += `<circle cx="168" cy="54" r="20" fill="#ffa040" fill-opacity=".22" stroke="#ffa040" stroke-width="1.8"/>`;
  s += skeleton(168, 54);
  return svg(s);
}

// 3. A key opens the gold vault door; an odd-coloured wall gives way to a push or a bomb.
function vaultArt(classId) {
  const b = BIOMES[0];
  let s = floor();
  s += glyph('key', 2, 46, 24, '#ffd24a') + arrow(28, 58, 40, 58, '#ffd24a');
  // Vault door, wood with gold bands as render.js builds it.
  s += `<rect x="44" y="18" width="52" height="80" fill="${hex(b.wall)}"/>`;
  s += `<path d="M52 98V46a18 18 0 0 1 36 0v52z" fill="#6a4424" stroke="#ffd24a" stroke-width="2.4"/>`;
  s += `<rect x="52" y="58" width="36" height="5" fill="#ffd24a"/><rect x="52" y="80" width="36" height="5" fill="#ffd24a"/>`;
  s += `<rect x="65" y="64" width="10" height="12" rx="1.5" fill="#ffd24a"/><rect x="69" y="67" width="2" height="5" fill="#14141c"/>`;
  // A wall of blocks; the secret one is a different shade.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = 128 + c * 22, y = 14 + r * 22, secret = r === 2 && c === 0;
    s += `<rect x="${x}" y="${y}" width="21" height="21" fill="${hex(secret ? b.secret : (r + c) % 2 ? b.wall : b.wallAlt)}"/>`;
    if (secret) s += `<rect x="${x + 1}" y="${y + 1}" width="19" height="19" fill="none" stroke="#ffd24a" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="3 2"/>`;
  }
  s += hero(112, 78, classId, 7) + arrow(120, 74, 126, 70, '#a0c8ff');
  s += glyph('bomb', 104, 30, 16, '#c8ccd8') + arrow(118, 44, 128, 62, '#ffa040');
  return svg(s);
}

// 4. A shop's pedestals with their prices; a Shrine of Gifts and the gold button that uses it.
function shopArt(classId) {
  let s = floor();
  const wares = [RARITIES[3].color, '#e04050', '#ffd24a']; // an epic item, a potion, a vault key
  wares.forEach((col, k) => {
    const x = 22 + k * 30;
    s += `<path d="M${x - 8} 74h16l-2-22h-12z" fill="#6a6070"/><rect x="${x - 10}" y="72" width="20" height="5" rx="1.5" fill="#5a5866"/>`;
    s += gemTop(x, 40, col);
    s += glyph('coin', x - 9, 82, 8, '#ffcc40') + `<rect x="${x + 1}" y="84.5" width="9" height="3.5" rx="1.75" fill="#ffcc40" opacity=".8"/>`;
  });
  // Shrine of Gifts: stone pillar, gold orb, ring on the floor.
  const sx = 156;
  s += `<ellipse cx="${sx}" cy="80" rx="24" ry="8" fill="none" stroke="#ffd24a" stroke-opacity=".6" stroke-width="1.6"/>`;
  s += `<rect x="${sx - 11}" y="72" width="22" height="8" fill="#5a5866"/><rect x="${sx - 7}" y="42" width="14" height="30" fill="#7a7888"/><rect x="${sx - 10}" y="38" width="20" height="5" fill="#5a5866"/>`;
  s += gemTop(sx, 24, '#ffd24a', 7);
  s += hero(124, 84, classId, 7);
  s += goldButton(112, 96, 82);
  return svg(s);
}

// 5. What a death takes and what it leaves.
function deathArt() {
  let s = `<rect x="-80" width="360" height="120" fill="#0b0f18"/>`;
  const col = (x, head, headCol, icons, kept) => {
    let c = `<rect x="${x}" y="10" width="84" height="100" rx="10" fill="${kept ? '#17202c' : '#1a1418'}" stroke="${headCol}" stroke-opacity=".6" stroke-width="1.4"/>`;
    c += glyph(head, x + 30, 18, 24, headCol);
    icons.forEach(([ic, ic2], k) => {
      const y = 50 + k * 20;
      c += `<g opacity="${kept ? 1 : 0.45}">${glyph(ic, x + 14, y, 14, ic2)}<rect x="${x + 34}" y="${y + 5}" width="36" height="4.5" rx="2.25" fill="#9aa8bc"/></g>`;
      if (!kept) c += `<path d="M${x + 10} ${y + 7}h64" stroke="#ff8a7a" stroke-width="1.6" stroke-linecap="round"/>`;
    });
    return c;
  };
  s += col(10, 'skull', '#ff8a7a', [['bag', '#eef2f7'], ['coin', '#ffcc40'], ['star', '#ffd24a']], false);
  s += col(106, 'crown', '#ffd24a', [['stairs', '#8fd8ff'], ['eye', '#eef2f7'], ['lock', GREEN]], true);
  return svg(s);
}

// 6. Keyboard only: the keys the main cards do not name (input.js KEYMAP).
function keysArt() {
  let s = `<rect x="-80" width="360" height="120" fill="#0b0f18"/>${grid(0.04)}`;
  const keys = [['F', 'potion', '#ff6070'], ['B', 'bomb', '#c8ccd8'], ['R', 'hand', '#f0b44c'], ['I', 'bag', '#eef2f7']];
  keys.forEach(([k, ic, c], n) => {
    const x = 16 + n * 44;
    s += glyph(ic, x + 7, 22, 22, c);
    s += `<rect x="${x}" y="58" width="36" height="34" rx="6" fill="#1a1f2e"/><rect x="${x}" y="56" width="36" height="31" rx="6" fill="#262c40" stroke="#ffffff47" stroke-width="1.2"/>`;
    s += `<text x="${x + 18}" y="77.5" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#eef2f7">${k}</text>`;
  });
  return svg(s);
}

export function morePages(classId, keyboard = false) {
  const id = CLASSES[classId] ? classId : 'warden';
  const shops = [];
  for (let f = 1; shops.length < 3; f++) if (isShopFloor(f)) shops.push(f);
  const pages = [
    { title: 'Loot and your bag', art: lootArt(id), points: ['Walk over gear to grab it. Gold, potions and bombs drift to you.', 'The bag, top right, marks likely upgrades with an arrow.'] },
    { title: 'Potions and bombs', art: potionArt(id), points: [`A potion heals ${Math.round(POTION_HEAL * 100)}% of your health.`, 'A bomb flies at the nearest enemy, or straight ahead.'] },
    { title: 'Vaults and secrets', art: vaultArt(id), points: ['A gold door locks a vault. Its key is on this floor.', 'Odd-coloured walls hide secret rooms. Push into one, or bomb it.'] },
    { title: 'Shops and shrines', art: shopArt(id), points: [`Shops wait on floors ${shops.join(', ')} and so on.`, 'Shrines heal, give relics or treasure. Tap the gold button.'] },
    { title: 'Death and saving', art: deathArt(), points: ['The run saves on each floor and when you pause or leave.', 'Death takes gear, gold and relics. Records and unlocks stay.'] },
  ];
  if (keyboard) pages.push({ title: 'Keyboard shortcuts', art: keysArt(), points: ['F drinks a potion. B throws a bomb.', 'R presses the gold button. I opens the bag.'] });
  return pages;
}

const hasKeyboard = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

// The main guide; its last card links on to the More tips.
export function showGuide(root, { classId, doneLabel, onClose }) {
  const keyboard = hasKeyboard();
  return openGuide(root, { className: 'dv-guide', pages: guidePages(classId, keyboard), more: morePages(classId, keyboard), doneLabel, onClose });
}

// The More tips on their own, from the title and pause menus.
export function showMoreTips(root, { classId, onClose }) {
  return openGuide(root, { className: 'dv-guide', pages: morePages(classId, hasKeyboard()), label: MORE_LABEL, doneLabel: 'Got it', onClose });
}
