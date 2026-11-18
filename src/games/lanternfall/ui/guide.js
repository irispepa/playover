// How to play cards for the shared guide (src/shell/guide.js), drawn with the game's own backdrops, faces and icons.
import { background } from './backgrounds.js';
import { face, portrait, silhouette } from './portraits.js';
import { IC } from './icons.js';

let uid = 0;
// Place an SVG string inside the 200x120 card: crop [x, y, w, h] of its viewBox (default: all of it) fills the box.
function fit(svg, x, y, w, h, crop = null, rx = 0) {
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const [cx, cy, cw, ch] = crop || vb;
  const k = Math.max(w / cw, h / ch);
  const tx = x + w / 2 - (cx + cw / 2) * k, ty = y + h / 2 - (cy + ch / 2) * k;
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const id = `lfg${uid++}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>`
    + `<g clip-path="url(#${id})"><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${inner}</g></g>`;
}
// A door, for how the lantern left the boathouse.
const DOOR = '<svg viewBox="0 0 24 24"><path d="M6 21V4h12v17M3.5 21h17M14.5 12.5v.01" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icon = (name, x, y, size, color) => `<g color="${color}">${fit(name === 'door' ? DOOR : IC[name], x, y, size, size)}</g>`;
const chip = (x, y, s, fill, name, color) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${fill}"/>${icon(name, x + s * 0.18, y + s * 0.18, s * 0.64, color)}`;
const lines = (x, y, widths, color = '#3a2b3f', op = 0.28) => widths.map((w, i) => `<rect x="${x}" y="${y + i * 7}" width="${w}" height="3" rx="1.5" fill="${color}" opacity="${op}"/>`).join('');
const tap = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.5"/><circle cx="${x}" cy="${y}" r="7.5" fill="#fff" opacity="0.92"/>`;
const wrap = (body) => `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// Backdrops run 40 units past each side so the shorter art box on small screens shows more scene, not bars.
// 1. The empty hook in the boathouse, and five people who might know why.
function artGoal() {
  let s = fit(background('boathouse', 2), -40, 0, 280, 120, [4, 40, 392, 168]);
  s += '<circle cx="100" cy="78.6" r="24" fill="#f6c56b" opacity="0.14"/><circle cx="100" cy="78.6" r="18.6" fill="none" stroke="#f6c56b" stroke-width="2" stroke-dasharray="4 4"/>';
  s += chip(112, 70, 26, '#f6c56b', 'find', '#3a2410');
  s += '<rect x="-40" y="96" width="280" height="24" fill="#17133a" opacity="0.6"/>';
  for (let i = 0; i < 5; i++) s += fit(silhouette(), 47 + i * 22, 98, 20, 20, null, 10);
  return wrap(s);
}

// 2. One day: morning, afternoon, evening, each spent at a place. The week bar fills a pip per turn.
function artDay() {
  const tiles = [['teahouse', 0, 'chat'], ['archive', 1, 'find'], ['lighthouse', 2, 'up']];
  let s = '';
  tiles.forEach(([pl, t, ic], i) => {
    const x = 12 + i * 61;
    s += fit(background(pl, t), x, 14, 54, 62, null, 10) + `<rect x="${x}" y="14" width="54" height="62" rx="10" fill="none" stroke="#f7ecd8" stroke-opacity="${i ? 0.3 : 0.9}" stroke-width="${i ? 1.2 : 2.2}"/>`;
    s += chip(x + 15, 56, 24, i ? '#f7ecd8' : '#f6c56b', ic, '#3a2410');
  });
  s += tap(46, 44);
  for (let d = 0; d < 7; d++) for (let k = 0; k < 3; k++) {
    const n = d * 3 + k, x = 14 + d * 25 + k * 7.6;
    s += `<rect x="${x.toFixed(1)}" y="94" width="6" height="5" rx="2.5" fill="${n === 0 ? '#fff' : '#f7ecd8'}" opacity="${n === 0 ? 1 : 0.22}"/>`;
  }
  return wrap(s);
}

// 3. The Notebook: clues written down, and a green loose thread to follow.
function artNotebook() {
  let s = '<rect x="22" y="12" width="156" height="98" rx="12" fill="#f6ecd6"/><rect x="22" y="12" width="156" height="22" rx="12" fill="#e9dcc0"/><rect x="22" y="26" width="156" height="8" fill="#e9dcc0"/>';
  s += `<g color="#3a2b3f">${fit(IC.book, 30, 15, 16, 16)}</g>` + lines(52, 21, [44], '#3a2b3f', 0.45);
  s += '<rect x="30" y="40" width="140" height="28" rx="8" fill="#e8f1ea"/>' + fit(face('tobias'), 35, 44, 20, 20, null, 10) + lines(62, 47, [96, 70], '#2f5a4a', 0.4);
  s += '<rect x="30" y="74" width="140" height="28" rx="8" fill="#fbf4e4"/>' + chip(35, 78, 20, '#f6c56b', 'find', '#3a2410') + lines(62, 81, [88, 60]);
  s += '<g transform="rotate(-14 160 96)"><rect x="150" y="66" width="8" height="40" rx="2" fill="#e9b949"/><path d="M150 106l4 9l4 -9z" fill="#f1d9b5"/><rect x="150" y="62" width="8" height="6" rx="1" fill="#d9707a"/></g>';
  return wrap(s);
}

// 4. Festival night on the bridge: who, why and how.
function artAccuse() {
  let s = fit(background('bridge', 2), -40, 0, 280, 120, [0, 190, 400, 171.4]);
  s += '<rect x="-40" y="0" width="280" height="120" fill="#17133a" opacity="0.35"/>';
  const slips = [
    (x, y) => fit(face('ysolde', 'worried'), x + 6, y + 5, 22, 22, null, 7),
    (x, y) => chip(x + 6, y + 5, 22, '#d9707a', 'heart', '#fff3d2'),
    (x, y) => chip(x + 6, y + 5, 22, '#58b6a6', 'door', '#17133a'),
  ];
  slips.forEach((draw, i) => {
    const x = 44, y = 10 + i * 35;
    s += `<rect x="${x}" y="${y + 3}" width="112" height="32" rx="9" fill="#0a081e" opacity="0.35"/><rect x="${x}" y="${y}" width="112" height="32" rx="9" fill="#f6ecd6"/>`;
    s += draw(x, y) + lines(x + 36, y + 11, [62, 40]);
  });
  return wrap(s);
}

export const GUIDE_PAGES = [
  { title: 'Find the Moon Lantern', art: artGoal(), points: ['Someone on the quay took it. Learn who, how and why.', 'Lanternfall night is seven days away.'] },
  { title: 'Three turns a day', art: artDay(), points: ['Each morning, afternoon and evening, tap a place.', 'Then talk, investigate or build a skill.'] },
  { title: 'Keep the Notebook', art: artNotebook(), points: ['Clues you find go in the Notebook.', 'Loose threads show what to follow up.'] },
  { title: 'Solve it on festival night', art: artAccuse(), points: ['Name who took it, why, and how it left the boathouse.', 'Every new week reshuffles the mystery.'] },
];

// ------------------------------------------------------------------ More tips
// Cards for the optional "More tips" run, reached from the last card or from the menus.
const pipRow = (x, y, n, on, of = 5, w = 9, gap = 3) => Array.from({ length: of }, (_, i) => `<rect x="${x + i * (w + gap)}" y="${y}" width="${w}" height="5" rx="2.5" fill="${i < n ? on : '#3a2b3f'}" opacity="${i < n ? 1 : 0.16}"/>`).join('');
const dim = (op = 0.45) => `<rect x="-40" y="0" width="280" height="120" fill="#17133a" opacity="${op}"/>`;

// 5. Four skills, each with its rank; a higher rank opens a locked choice and a clue.
function artSkills() {
  let s = fit(background('workshop', 1), -40, 0, 280, 120, [0, 300, 400, 171.4]) + dim(0.62);
  s += '<rect x="12" y="12" width="96" height="96" rx="12" fill="#f6ecd6"/>';
  [['chat', '#d9707a', '#fff3d2', 3], ['find', '#58b6a6', '#17133a', 2], ['up', '#f6c56b', '#3a2410', 4], ['hand', '#8d8fb5', '#17133a', 1]].forEach(([ic, fill, color, n], i) => {
    const y = 20 + i * 21.5;
    s += chip(20, y, 17, fill, ic, color) + pipRow(43, y + 6, n, fill);
  });
  s += '<rect x="114" y="12" width="80" height="96" rx="12" fill="#17133a" opacity="0.6"/>';
  s += '<rect x="120" y="22" width="68" height="26" rx="8" fill="#f6ecd6" opacity="0.45"/>' + chip(126, 26, 18, '#3a2b3f', 'lock', '#f6ecd6') + lines(150, 31, [30, 20], '#3a2b3f', 0.35);
  s += `<g color="#f6c56b">${fit(IC.up, 145, 51, 18, 18)}</g>`;
  s += '<rect x="120" y="72" width="68" height="26" rx="8" fill="#f6ecd6" stroke="#f6c56b" stroke-width="2"/>' + chip(126, 76, 18, '#f6c56b', 'find', '#3a2410') + lines(150, 81, [30, 20]);
  return wrap(s);
}

// 6. A bond growing: chat and company add to it, and a true friend gets an epilogue.
function artFriends() {
  let s = fit(background('teahouse', 1), -40, 0, 280, 120, [0, 300, 400, 171.4]) + dim(0.4);
  s += '<circle cx="100" cy="50" r="34" fill="#d9707a" opacity="0.18"/>' + fit(face('odile', 'happy'), 74, 24, 52, 52, null, 26);
  s += '<rect x="64" y="86" width="72" height="16" rx="8" fill="#f6ecd6"/>' + pipRow(70, 91.5, 3, '#d9707a', 5, 10, 2.5);
  s += chip(22, 36, 28, '#f6ecd6', 'chat', '#3a2b3f') + chip(150, 36, 28, '#f6ecd6', 'hand', '#3a2b3f');
  s += '<path d="M54 50h12M134 50h12" stroke="#f6ecd6" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 5" opacity="0.8"/>';
  s += chip(112, 14, 22, '#d9707a', 'heart', '#fff3d2') + chip(142, 82, 24, '#f6c56b', 'star', '#3a2410');
  return wrap(s);
}

// 7. Keepsakes from earlier weeks: three earned, one still to find, one picked for the new story.
function artKeepsakes() {
  let s = fit(background('boathouse', 0), -40, 0, 280, 120, [4, 40, 392, 168]) + dim(0.5);
  const cards = [['book', true], ['chat', false], ['find', false], ['lock', false]];
  cards.forEach(([ic, pick], i) => {
    const x = 32 + (i % 2) * 70, y = 12 + Math.floor(i / 2) * 50, got = ic !== 'lock';
    s += `<rect x="${x}" y="${y + 3}" width="64" height="44" rx="10" fill="#0a081e" opacity="0.35"/>`;
    s += `<rect x="${x}" y="${y}" width="64" height="44" rx="10" fill="${got ? '#f6ecd6' : '#3a2a60'}" ${pick ? 'stroke="#f6c56b" stroke-width="2.5"' : ''}/>`;
    s += chip(x + 8, y + 11, 22, got ? '#f6c56b' : '#4b3f7a', ic, got ? '#3a2410' : '#b9b0d4');
    s += lines(x + 36, y + 16, [20, 14], got ? '#3a2b3f' : '#b9b0d4', got ? 0.35 : 0.3);
  });
  s += tap(86, 52);
  return wrap(s);
}

// 8. Festival night: say it quietly to one person, or from the parapet to the whole town.
function artApproach() {
  let s = fit(background('bridge', 2), -40, 0, 280, 120, [0, 190, 400, 171.4]) + dim(0.35);
  s += '<rect x="10" y="14" width="84" height="92" rx="12" fill="#17133a" opacity="0.55"/><rect x="106" y="14" width="84" height="92" rx="12" fill="#17133a" opacity="0.55"/>';
  s += '<circle cx="52" cy="52" r="28" fill="#f6c56b" opacity="0.14"/>' + fit(face('bram', 'worried'), 33, 33, 38, 38, null, 19);
  s += chip(41, 78, 22, '#f6ecd6', 'chat', '#3a2b3f');
  s += '<rect x="124" y="46" width="48" height="8" rx="3" fill="#f6ecd6" opacity="0.8"/>' + fit(face('bram', 'worried'), 133, 18, 30, 30, null, 15);
  for (let i = 0; i < 4; i++) s += fit(silhouette(), 112 + i * 18.5, 74, 17, 17, null, 8.5);
  s += '<path d="M100 30v60" stroke="#f6ecd6" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round" opacity="0.6"/>';
  return wrap(s);
}

// 9. The scene player: Skip and the log up top, the text box below.
function artReading() {
  let s = fit(background('archive', 1), -40, 0, 280, 120, [0, 200, 400, 171.4]);
  s += fit(portrait('ysolde'), 62, 18, 76, 91, [0, 0, 200, 240]);
  s += '<rect x="20" y="78" width="160" height="34" rx="10" fill="#f6ecd6"/><rect x="28" y="72" width="40" height="12" rx="6" fill="#5f7fc2"/>' + lines(30, 90, [128, 96, 60], '#3a2b3f', 0.35);
  s += '<rect x="104" y="9" width="44" height="22" rx="7" fill="#f6c56b"/>' + icon('skip', 109, 13, 14, '#3a2410') + lines(127, 18.5, [15], '#3a2410', 0.55);
  s += '<rect x="153" y="9" width="22" height="22" rx="7" fill="#17133a" fill-opacity="0.8" stroke="#f7ecd8" stroke-opacity="0.3"/>' + icon('log', 157, 13, 14, '#f7ecd8');
  return wrap(s);
}

export const MORE_PAGES = [
  { title: 'Grow four skills', art: artSkills(), points: ['Each place trains Charm, Insight, Nerve or Craft.', 'Higher ranks open locked choices and clues.'] },
  { title: 'Make friends', art: artFriends(), points: ['Chat, or work beside someone, to grow your bond.', 'Friends tell you more. True friends earn an epilogue.'] },
  { title: 'Bring a keepsake', art: artKeepsakes(), points: ['Finished weeks unlock keepsakes, each a small head start.', 'Pick one to carry when you start a new story.'] },
  { title: 'Say it your way', art: artApproach(), points: ['Take them aside, or name them from the parapet.', 'How you say it changes the ending.'] },
  { title: 'Read at your own pace', art: artReading(), points: ['Skip runs to the next choice. The log shows what was said.', 'Set text speed in the menu. Your week saves after every turn.'] },
];
