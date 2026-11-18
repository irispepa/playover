// Patch & Kettle: the How to play cards (shared shell guide, drawn with the game's own rig and icons).
import { openGuide, MORE_LABEL } from '../../shell/guide.js';
import { TENANT_BY_ID, CAMPAIGN_DAYS } from './data.js';
import { MAX_HOURS } from './sim.js';
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

// ---------- More tips ----------

// 1. Kettle on the warm server, patted: goodwill, and now and then an hour.
const artKettle = svg(skyBg
  + `<rect x="34" y="12" width="132" height="96" rx="8" fill="#ffe7cc" stroke="${TRIM}" stroke-width="2"/><rect x="35" y="98" width="130" height="9" rx="3" fill="#e6bd8c"/>`
  + `<rect x="74" y="70" width="52" height="34" rx="5" fill="#8f96a8"/>` + [78, 89].map((y) => `<rect x="80" y="${y}" width="40" height="7" rx="2" fill="#6f7688"/><circle cx="114" cy="${y + 3.500}" r="1.800" fill="${MINT}"/><circle cx="108" cy="${y + 3.500}" r="1.800" fill="${GOLD}"/>`).join('')
  + `<path d="M84 66c-2 3 2 5 0 8M116 66c-2 3 2 5 0 8" stroke="${CORAL}" stroke-width="1.600" fill="none" stroke-linecap="round" opacity=".5"/>`
  + `<g transform="translate(72 30) scale(.56)">${kettleG('sit')}</g>`
  + tapRings(114, 50) + hand(114, 50, 30)
  + `<g class="pk-bubble"><circle cx="56" cy="36" r="13" fill="#fff" stroke="${CORAL}" stroke-width="2"/>${iconG('heart', 56, 36, 16, CORAL, 2.200)}</g>`
  + `<g class="pk-bubble"><circle cx="146" cy="32" r="13" fill="#fff" stroke="${HOURS}" stroke-width="2"/>${iconG('clock', 146, 32, 16, HOURS, 2.200)}</g>`);

// 2. The day's hours: six to start, more to earn from the chair, friendships and a get-together, up to the cap.
const pipX = (k) => 52 + k * (120 / (MAX_HOURS - 1));
const pip = (k) => { const extra = k >= 6; return `<circle cx="${pipX(k)}" cy="29" r="5.500" fill="${extra ? GOLD : HOURS}" stroke="${extra ? GOLD_D : '#3f8fcc'}" stroke-width="1.500"/>`; };
const artLonger = svg(skyBg
  + `<rect x="14" y="17" width="172" height="30" rx="12" fill="${LINE}"/><rect x="14" y="14" width="172" height="30" rx="12" fill="#fff"/>${iconG('clock', 32, 29, 20, HOURS, 2.200)}`
  + Array.from({ length: MAX_HOURS }, (_, k) => pip(k)).join('')
  + [['chair', 40], ['threads', 90], ['star', 140]].map(([ic, x], k) => tile(x, 70, ic) + `<path d="M${x + 17} 66C${x + 17} 56 ${pipX(6 + k)} 50 ${pipX(6 + k)} 38" stroke="${GOLD_D}" stroke-width="2" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>`).join(''));

// 3. A fix-it game with its Hint button tapped, then a clean fix's extra goodwill.
const artHint = svg(skyBg
  + `<rect x="14" y="10" width="112" height="100" rx="10" fill="${CREAM}" stroke="${LINE}" stroke-width="2"/>`
  + `<rect x="66" y="19" width="50" height="22" rx="9" fill="${LINE}"/><rect x="66" y="17" width="50" height="22" rx="9" fill="#fff"/>${iconG('paw', 78, 28, 14, INK, 2)}<path d="M88 28h12" stroke="#d8c8b8" stroke-width="3" stroke-linecap="round"/>`
  + tapRings(110, 32) + hand(110, 32, 24)
  + `<rect x="30" y="48" width="14" height="10" rx="2.500" fill="${CORAL}"/><rect x="60" y="48" width="14" height="10" rx="2.500" fill="${MINT}"/><rect x="30" y="82" width="14" height="10" rx="2.500" fill="${MINT}"/><rect x="60" y="82" width="14" height="10" rx="2.500" fill="${CORAL}"/>`
  + `<path d="M37 58C37 72 67 68 67 82M67 58C67 72 37 68 37 82" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>`
  + `<g transform="translate(84 74) scale(.36)">${kettleG('sit')}</g>`
  + `<path d="M134 60h10" stroke="${SOFT}" stroke-width="3" stroke-linecap="round"/><path d="M141 54l6 6-6 6" stroke="${SOFT}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<circle cx="172" cy="62" r="18" fill="${MINT}"/>${iconG('check', 172, 62, 22, '#fff', 3)}`
  + `<g class="pk-bubble"><circle cx="186" cy="38" r="11" fill="#fff" stroke="${CORAL}" stroke-width="2"/>${iconG('heart', 186, 38, 13, CORAL, 2.200)}</g>${iconG('sparkle', 154, 90, 14, GOLD, 2)}`);

// 4. A get-together: bunting, a long table and three neighbours.
const bunting = Array.from({ length: 11 }, (_, k) => { const t = (k + 0.5) / 11, x = -20 + 240 * t, y = 8 + 2 * t * (1 - t) * 24; return `<path d="M${x - 5} ${y}h10l-5 9z" fill="${flags[k % flags.length]}"/>`; }).join('');
const artTogether = svg(skyBg
  + `<path d="M-20 8Q100 32 220 8" stroke="${SOFT}" stroke-width="1.200" fill="none"/>${bunting}`
  + personAt(look('dot'), 46, 90, 58, 'happy', 'pk-bob') + personAt(look('bea'), 100, 88, 58, 'happy', 'pk-bob3') + personAt(look('juno'), 154, 90, 58, 'happy', 'pk-bob')
  + `<rect x="6" y="84" width="188" height="7" rx="3.500" fill="${WOOD}"/><rect x="14" y="91" width="8" height="22" rx="2" fill="${WOOD_D}"/><rect x="178" y="91" width="8" height="22" rx="2" fill="${WOOD_D}"/>`
  + `<rect x="64" y="72" width="18" height="12" rx="3" fill="#fff"/><rect x="64" y="70" width="18" height="5" rx="2.500" fill="${CORAL}"/><circle cx="73" cy="68.500" r="2.200" fill="${GOLD}"/>`
  + [22, 127, 178].map((x) => `<path d="M${x - 5} 74h10v4a5 5 0 0 1-10 0z" fill="#fff" stroke="${LINE}" stroke-width="1"/><path d="M${x + 5} 75.500h1.500a2.200 2.200 0 0 1 0 4.400h-2" stroke="#fff" stroke-width="1.600" fill="none"/>`).join(''));

// 5. Open Day points: friendships and get-togethers score big, coziness and fixes add more.
const bars = [['threads', 52], ['star', 46], ['heart', 30], ['tickets', 20]];
const artJudged = svg(skyBg
  + `<path d="M8 72h140" stroke="${LINE}" stroke-width="2"/>`
  + bars.map(([ic, h], k) => { const x = 14 + k * 34, big = k < 2; return `<rect x="${x + 7}" y="${70 - h}" width="20" height="${h}" rx="5" fill="${big ? GOLD : '#f6d59a'}"/>` + tile(x, 76, ic); }).join('')
  + `<path d="M168 48l-8 30 8-5 5 7 4-30zM180 48l8 30-8-5-5 7-4-30z" fill="${CORAL}"/>`
  + Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return `<circle cx="${(174 + Math.cos(a) * 18).toFixed(1)}" cy="${(38 + Math.sin(a) * 18).toFixed(1)}" r="6" fill="${GOLD}"/>`; }).join('')
  + `<circle cx="174" cy="38" r="18" fill="${GOLD}"/><circle cx="174" cy="38" r="13" fill="#fff"/>${iconG('star', 174, 38, 16, GOLD_D, 2.200)}`);

// 6. A new game: the scrapbook keeps what you found; pick a quirk.
const slot = (x, y, ic, c) => `<rect x="${x}" y="${y}" width="26" height="24" rx="5" fill="#fff0cf"/>${iconG(ic, x + 13, y + 12, 15, c, 2)}`;
const quirk = (y, on) => `<rect x="110" y="${y}" width="82" height="26" rx="9" fill="#fff" stroke="${on ? GOLD : LINE}" stroke-width="2"/><circle cx="124" cy="${y + 13}" r="8" fill="${on ? '#fff0cf' : CREAM}"/>${iconG('sparkle', 124, y + 13, 11, on ? GOLD_D : SOFT, 2)}<path d="M138 ${y + 10}h44M138 ${y + 17}h28" stroke="#d8c8b8" stroke-width="3" stroke-linecap="round"/>`;
const artFresh = svg(skyBg
  + `<path d="M58 30C40 24 22 24 12 28v72c10-4 28-4 46 2 18-6 36-6 46-2V28c-10-4-28-4-46 2z" fill="#fff" stroke="${LINE}" stroke-width="2"/><path d="M58 30v72" stroke="${LINE}" stroke-width="2"/>`
  + slot(18, 38, 'hat', CORAL) + slot(18, 68, 'gift', MINT) + slot(70, 38, 'threads', CORAL) + slot(70, 68, 'star', GOLD_D)
  + quirk(18, false) + quirk(50, true) + quirk(82, false)
  + tapRings(176, 66) + hand(176, 66, 26));

export const MORE_PAGES = [
  { title: 'Pat Kettle', art: artKettle, points: ['He moves around the house. Pat him once a day for goodwill.', 'Now and then he purrs you an extra hour.'] },
  { title: 'Longer days', art: artLonger, points: ['A comfy chair, some friendships and one get-together each add an hour.', `A day starts with ${MAX_HOURS} hours at most.`] },
  { title: 'Ask Kettle for a hint', art: artHint, points: ['Stuck in a fix-it game? Tap Hint and Kettle helps.', 'Fixes with no slips and no hints earn extra goodwill.'] },
  { title: 'Hold a get-together', art: artTogether, points: ['The right friendships unlock a get-together under Threads.', 'It costs 2 hours and some budget. Its perk lasts all game.'] },
  { title: 'How Open Day is judged', art: artJudged, points: ['Each friendship and get-together scores big. Coziness and fixes add more.', 'Your title matches how you played.'] },
  { title: 'A fresh start', art: artFresh, points: ['After your first Open Day, a new game lets you pick a quirk.', 'The scrapbook keeps what you find, game after game.'] },
];

export function showGuide(root, onClose, first = false) {
  return openGuide(root, { className: 'pk-guide', pages: GUIDE_PAGES, more: MORE_PAGES, doneLabel: first ? 'Start the day' : 'Got it', onClose });
}

// The extra cards on their own, from the menu.
export function showMoreTips(root, onClose) {
  return openGuide(root, { className: 'pk-guide', pages: MORE_PAGES, label: MORE_LABEL, doneLabel: 'Got it', onClose });
}
