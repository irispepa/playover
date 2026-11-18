// Patch & Kettle: the How to play cards (shared shell guide, drawn with the game's own rig and icons).
import { openGuide } from '../../shell/guide.js';
import { TENANT_BY_ID, CAMPAIGN_DAYS } from './data.js';
import { personAt, kettleG, EXTRA_LOOKS } from './art.js';
import { iconG } from './icons.js';

const INK = '#4b3a33', SOFT = '#8a766c', CREAM = '#fff6e4', LINE = '#f0dfc4', GOLD = '#f6a81c', GOLD_D = '#d98200';
const CORAL = '#f27d6b', MINT = '#58b98f', HOURS = '#5aa7e0', WOOD = '#d9a066', WOOD_D = '#b97f47', TRIM = '#c58f5c';
const look = (id) => TENANT_BY_ID[id].look;
const svg = (body) => `<svg viewBox="0 0 200 120" overflow="visible" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

const skyBg = `<defs><linearGradient id="pkgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaf6"/><stop offset="1" stop-color="${CREAM}"/></linearGradient></defs><rect x="-80" width="360" height="120" fill="url(#pkgSky)"/>`;
const desk = (cx, y, w = 44) => `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="6" rx="3" fill="${WOOD}"/><rect x="${cx - w / 2 + 4}" y="${y + 6}" width="${w - 8}" height="${104 - y}" rx="2" fill="${WOOD_D}" opacity=".85"/>`;
const windowG = (x, y, curtain) => `<rect x="${x}" y="${y}" width="24" height="30" rx="5" fill="${CREAM}" stroke="${TRIM}" stroke-width="2"/><rect x="${x + 3}" y="${y + 3}" width="18" height="24" rx="3" fill="#bfe3f4"/><path d="M${x + 12} ${y + 3}v24M${x + 3} ${y + 15}h18" stroke="${CREAM}" stroke-width="2"/><path d="M${x + 3} ${y + 3}h6c0 8-2 12-6 15zM${x + 21} ${y + 3}h-6c0 8 2 12 6 15z" fill="${curtain}" opacity=".9"/>`;
const chip = (x, y, w, dot) => `<rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="#fff" stroke="${dot === CORAL ? '#f6c4b8' : '#b9e3cd'}" stroke-width="2"/><circle cx="${x + 10}" cy="${y + 9}" r="3.500" fill="${dot}"/><path d="M${x + 18} ${y + 9}h${w - 28}" stroke="#d8c8b8" stroke-width="3" stroke-linecap="round"/>`;
const tile = (x, y, ic, dark = false) => `<rect x="${x}" y="${y + 3}" width="34" height="34" rx="10" fill="${dark ? '#33365a' : LINE}"/><rect x="${x}" y="${y}" width="34" height="34" rx="10" fill="${dark ? '#4b4f78' : '#fff'}"/>${iconG(ic, x + 17, y + 17, 20, dark ? '#fff' : INK, 2.200)}`;
const tapRings = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${GOLD}" stroke-width="2" opacity=".8"/><circle cx="${x}" cy="${y}" r="12" fill="none" stroke="${GOLD}" stroke-width="1.500" opacity=".4"/>`;
// The game's pointing hand, filled white so it reads on any background; (x, y) is the fingertip.
const hand = (x, y, size = 34) => { const s = size / 24, cx = x - (12.800 - 12) * s, cy = y - (2.600 - 12) * s; return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})"><path d="M8 11.500V5.200a1.600 1.600 0 0 1 3.200 0V4.200a1.600 1.600 0 0 1 3.200 0V5.700a1.600 1.600 0 0 1 3.200 0v8.300a6.500 6.500 0 0 1-6.500 6.500c-2.600 0-4-1-5.300-3.200L3.700 13a1.600 1.600 0 0 1 2.700-1.700L8 13.500z" fill="#fff"/></g>${iconG('hand', cx, cy, size, INK, 1.800)}`; };

// 1. A room with a problem bubble, tapped, then the fix-it game.
const artFix = svg(skyBg
  + `<rect x="10" y="12" width="112" height="96" rx="8" fill="#ffe7cc" stroke="${TRIM}" stroke-width="2"/><rect x="11" y="98" width="110" height="9" rx="3" fill="#e6bd8c"/>`
  + windowG(20, 24, '#f2a65a')
  + personAt(look('bea'), 72, 92, 54, 'wow', 'pk-bob') + desk(72, 82, 50)
  + `<rect x="78" y="70" width="16" height="12" rx="2" fill="#8f96a8"/><rect x="80" y="72" width="12" height="8" rx="1.500" fill="#dff1fb"/>`
  + `<g class="pk-bubble"><path d="M93 41l-9 8 12-3z" fill="#fff"/><circle cx="102" cy="32" r="14" fill="#fff" stroke="${GOLD_D}" stroke-width="2"/>${iconG('wifi', 102, 32, 17, GOLD_D, 2.200)}</g>`
  + tapRings(108, 40) + hand(108, 40, 32)
  + `<path d="M128 60h12" stroke="${SOFT}" stroke-width="3" stroke-linecap="round"/><path d="M137 54l6 6-6 6" stroke="${SOFT}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<rect x="148" y="24" width="44" height="72" rx="9" fill="${CREAM}" stroke="${LINE}" stroke-width="2"/>`
  + `<rect x="154" y="34" width="12" height="9" rx="2.500" fill="${CORAL}"/><rect x="174" y="34" width="12" height="9" rx="2.500" fill="${MINT}"/><rect x="154" y="74" width="12" height="9" rx="2.500" fill="${MINT}"/><rect x="174" y="74" width="12" height="9" rx="2.500" fill="${CORAL}"/>`
  + `<path d="M160 43C160 60 180 57 180 74M180 43C180 60 160 57 160 74" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>`
  + `<circle cx="183" cy="26" r="9" fill="${MINT}"/>${iconG('check', 183, 26, 12, '#fff', 3)}`);

// 2. A day's hours, spent by fixes, tea and introductions, then End day.
const pips = [0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${80 + k * 15}" cy="29" r="5.500" fill="${k < 3 ? HOURS : '#e8eef4'}" stroke="${k < 3 ? '#3f8fcc' : '#cfd9e3'}" stroke-width="1.500"/>`).join('');
const artHours = svg(skyBg
  + `<rect x="44" y="17" width="140" height="30" rx="12" fill="${LINE}"/><rect x="44" y="14" width="140" height="30" rx="12" fill="#fff"/>${iconG('clock', 62, 29, 20, HOURS, 2.200)}${pips}`
  + [['tickets', 18], ['tea', 60], ['threads', 102]].map(([ic, x], k) => tile(x, 70, ic) + `<path d="M${x + 17} 66C${x + 17} 56 ${80 + k * 15} 50 ${80 + k * 15} 38" stroke="${HOURS}" stroke-width="2" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>`).join('')
  + tile(148, 70, 'moon', true) + tapRings(176, 98) + hand(176, 98, 24));

// 3. Tea with a neighbour: you learn what they need.
const artTea = svg(`<rect x="-80" width="360" height="120" fill="#dcf1df"/><rect x="-80" y="96" width="360" height="24" fill="#e6bd8c"/><path d="M-80 96h360" stroke="#cf9c66" stroke-width="1.500"/>`
  + windowG(88, 14, '#7cc79a')
  + personAt(EXTRA_LOOKS.you, 46, 104, 62, 'happy', 'pk-bob') + personAt(look('fern'), 154, 104, 62, 'happy', 'pk-bob3')
  + `<rect x="66" y="88" width="68" height="6" rx="3" fill="${WOOD}"/><rect x="72" y="94" width="56" height="12" rx="2" fill="${WOOD_D}" opacity=".85"/>`
  + [86, 114].map((x) => `<path d="M${x - 7} 76h14v5a7 7 0 0 1-14 0z" fill="#fff"/><path d="M${x + 7} 78h2a3 3 0 0 1 0 6h-3" stroke="#fff" stroke-width="2" fill="none"/><path d="M${x - 2} 64c-2 3 2 5 0 8M${x + 3} 64c-2 3 2 5 0 8" stroke="#fff" stroke-width="1.800" fill="none" stroke-linecap="round" opacity=".9"/>`).join('')
  + `<g class="pk-bubble"><path d="M156 36l-6 10 12-8z" fill="#fff"/>${chip(120, 18, 72, CORAL)}</g>`);

// 4. Threads: a need on one side, a matching offer on the other, joined by a thread.
const artThreads = svg(skyBg
  + personAt(look('rashid'), 40, 84, 60, 'happy', 'pk-bob') + personAt(look('juno'), 160, 84, 60, 'happy', 'pk-bob3')
  + `<path class="pk-thread-line" d="M58 50C84 18 116 76 142 46" fill="none" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/>`
  + `<path d="M100 22c-4.500-5 2-9 4-4.500 2-4.500 8.500-.500 4 4.500l-4 4.500z" fill="${CORAL}" transform="translate(-4 4)"/>`
  + chip(10, 92, 64, CORAL) + chip(126, 92, 64, MINT));

// 5. Improve the house with budget and goodwill; Open Day at the end.
const flags = [GOLD, CORAL, MINT, '#a98be6', GOLD, CORAL, MINT];
const artHouse = svg(skyBg
  + `<path d="M-80 104q180-8 360 0v16H-80z" fill="#bfe3a8"/>`
  + `<rect x="58" y="46" width="84" height="60" rx="4" fill="#f4dfc0" stroke="${TRIM}" stroke-width="2"/>`
  + [['#ffe7cc', 62, 50], ['#dcf1df', 102, 50], ['#fff0c4', 62, 78], ['#e1eaf8', 102, 78]].map(([c, x, y]) => `<rect x="${x}" y="${y}" width="36" height="24" rx="2" fill="${c}"/>`).join('')
  + `<rect x="92" y="88" width="16" height="18" rx="3" fill="${WOOD_D}"/>`
  + `<path d="M46 48L70 20H130L154 48Z" fill="#ef8a6c"/><path d="M44 48h112" stroke="#c5634a" stroke-width="4" stroke-linecap="round"/>`
  + `<path d="M48 48Q100 66 152 48" stroke="${SOFT}" stroke-width="1.200" fill="none"/>`
  + flags.map((c, k) => { const t = (k + 1) / 8, x = 48 + 104 * t, y = 48 + 36 * t * (1 - t); return `<path d="M${x - 4} ${y}h8l-4 7z" fill="${c}"/>`; }).join('')
  + `<g transform="translate(104 78) scale(.3)">${kettleG('sit', 'hat_party')}</g>`
  + `<circle cx="26" cy="40" r="15" fill="#fff" stroke="${GOLD}" stroke-width="2"/>${iconG('coin', 26, 40, 20, GOLD_D, 2.200)}`
  + `<circle cx="174" cy="40" r="15" fill="#fff" stroke="${CORAL}" stroke-width="2"/>${iconG('heart', 174, 40, 20, CORAL, 2.200)}`
  + `<path d="M38 52Q48 62 56 66M162 52Q152 62 144 66" stroke="${SOFT}" stroke-width="2" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>`
  + `<g class="pk-bubble">${iconG('sparkle', 30, 84, 16, GOLD, 2)}${iconG('sparkle', 172, 82, 14, '#a98be6', 2)}</g>`);

export const GUIDE_PAGES = [
  { title: 'Fix what\'s broken', art: artFix, points: ['See a speech bubble? Tap that room.', 'Play the fix-it game.'] },
  { title: 'Your hours', art: artHours, points: ['Each day has about 6 hours.', 'Fixes, tea and introductions use them. Then tap End day.'] },
  { title: 'Tea and a chat', art: artTea, points: ['Share tea to learn what a neighbour needs.'] },
  { title: 'Weave threads', art: artThreads, points: ['In Threads, match one neighbour\'s need to what another offers.', 'Introduce them, and a friendship begins.'] },
  { title: 'Grow the house', art: artHouse, points: ['Spend budget and goodwill in Improve.', `After ${CAMPAIGN_DAYS} days, show it off at Open Day.`] },
];

export function showGuide(root, onClose) {
  return openGuide(root, { className: 'pk-guide', pages: GUIDE_PAGES, doneLabel: 'Start the day', onClose });
}
