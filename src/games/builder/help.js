// Tidewater: the paged How to play guide. Each page has a title, a picture built in code and 2–4 short points.
// Every fact here is taken from data.js, sim.js, world.js or events.js; keep them in step when rules change.
import { BUILDINGS, MILESTONES } from './data.js';
import { resIcon, uiIcon } from './icons.js';

const LV = BUILDINGS.house.levels;
// Milestones that unlock a new tier, with the population they ask for.
const UNLOCKS = MILESTONES.filter((m) => m.unlock).map((m) => ({
  name: m.name,
  pop: m.check.kind === 'pop' ? m.check.n : (m.check.of.find((p) => p.kind === 'pop') || {}).n,
}));

// ---------- Pictures ----------
// A labelled mock of the play screen: stores, goal, speed buttons and the build tray.
function screenMock() {
  const badge = (x, y, n) => `<g class="bd"><circle cx="${x}" cy="${y}" r="7"/><text x="${x}" y="${y + 3.6}" text-anchor="middle">${n}</text></g>`;
  const legend = (y, n, a, b) => `${badge(132, y, n)}<text class="lb" x="146" y="${y - 1}">${a}</text><text class="sb" x="146" y="${y + 12}">${b}</text>`;
  return `<svg class="tw-dg" viewBox="0 0 300 132" role="img" aria-label="The play screen: stores and goal at the top, build tray at the bottom">
    <rect x="6" y="2" width="96" height="128" rx="15" class="ph"/>
    <rect x="10" y="6" width="88" height="120" rx="11" fill="#1f5f86"/>
    <ellipse cx="54" cy="68" rx="34" ry="20" fill="#d8c58a"/><ellipse cx="56" cy="66" rx="27" ry="14" fill="#4f9a4f"/>
    <rect x="49" y="58" width="9" height="8" fill="#f4e7c8"/><path d="M47.5 58.5l6-5 6 5z" fill="#d9573d"/>
    <rect x="14" y="10" width="11" height="11" rx="3" class="hud"/>
    <rect x="28" y="10" width="66" height="11" rx="3" class="hud"/>
    <circle cx="34" cy="15.5" r="2.4" fill="#4f7fd0"/><circle cx="44" cy="15.5" r="2.4" fill="#f7d154"/><circle cx="54" cy="15.5" r="2.4" fill="#e8584a"/>
    <circle cx="64" cy="15.5" r="2.4" fill="#a8743f"/><circle cx="74" cy="15.5" r="2.4" fill="#a9a399"/><circle cx="84" cy="15.5" r="2.4" fill="#f2c34b"/>
    <rect x="14" y="24" width="44" height="11" rx="3" class="hud"/><rect x="18" y="27" width="5" height="5" rx="1" fill="#f4e7c8"/><rect x="26" y="28" width="26" height="3" rx="1.5" fill="#9aa8bc"/>
    <rect x="61" y="24" width="10" height="11" rx="3" class="hud"/><rect x="73" y="24" width="10" height="11" rx="3" fill="#f0b44c"/><rect x="85" y="24" width="10" height="11" rx="3" class="hud"/>
    <rect x="14" y="94" width="80" height="28" rx="5" class="hud"/>
    <rect x="18" y="97" width="14" height="5" rx="2" fill="#3a4a60"/><rect x="35" y="98" width="10" height="3" rx="1.5" fill="#56657a"/><rect x="48" y="98" width="13" height="3" rx="1.5" fill="#56657a"/><rect x="64" y="98" width="16" height="3" rx="1.5" fill="#56657a"/>
    <rect x="18" y="105" width="16" height="14" rx="2.5" fill="#2d3c51"/><rect x="37" y="105" width="16" height="14" rx="2.5" fill="#2d3c51"/><rect x="56" y="105" width="16" height="14" rx="2.5" fill="#2d3c51"/><rect x="75" y="105" width="16" height="14" rx="2.5" fill="#2d3c51"/>
    ${badge(94, 10, 1)}${badge(14, 36, 2)}${badge(96, 36, 3)}${badge(94, 94, 4)}
    ${legend(18, 1, 'Stores', 'Tap a chip for details')}
    ${legend(50, 2, 'Goal', 'Tap it to see every goal')}
    ${legend(82, 3, 'Speed', 'Pause, play or fast')}
    ${legend(114, 4, 'Build tray', 'Every building lives here')}
  </svg>`;
}

// Three touch gestures: one-finger drag, two-finger pinch, tap.
function gestures() {
  const head = (x, y, a) => `<path d="M${x} ${y}l${a[0]} ${a[1]}m${-a[0]} ${-a[1]}l${a[2]} ${a[3]}" class="ar"/>`;
  return `<svg class="tw-dg" viewBox="0 0 300 132" role="img" aria-label="Drag with one finger, pinch with two, tap to inspect">
    <rect x="4" y="4" width="92" height="84" rx="14" class="pn"/><rect x="104" y="4" width="92" height="84" rx="14" class="pn"/><rect x="204" y="4" width="92" height="84" rx="14" class="pn"/>
    <path d="M20 46h60M50 22v48" class="tr"/>
    ${head(20, 46, [6, -5, 6, 5])}${head(80, 46, [-6, -5, -6, 5])}${head(50, 22, [-5, 6, 5, 6])}${head(50, 70, [-5, -6, 5, -6])}
    <circle cx="50" cy="46" r="10" class="fg"/>
    <path d="M128 66l44-40" class="tr"/>
    ${head(128, 66, [1, -8, 8, -1])}${head(172, 26, [-1, 8, -8, 1])}
    <circle cx="140" cy="55" r="9" class="fg"/><circle cx="160" cy="37" r="9" class="fg"/>
    <circle cx="250" cy="46" r="21" class="rp" opacity=".35"/><circle cx="250" cy="46" r="15" class="rp" opacity=".7"/>
    <circle cx="250" cy="46" r="10" class="fg"/>
    <text class="lb" x="50" y="106" text-anchor="middle">Drag</text><text class="sb" x="50" y="120" text-anchor="middle">to move</text>
    <text class="lb" x="150" y="106" text-anchor="middle">Pinch</text><text class="sb" x="150" y="120" text-anchor="middle">to zoom</text>
    <text class="lb" x="250" y="106" text-anchor="middle">Tap</text><text class="sb" x="250" y="120" text-anchor="middle">to inspect</text>
  </svg>`;
}

// Tray card → glowing tiles → Build button.
function buildFlow(game) {
  // Tile colours match the placement overlay in index.js (bright green best, orange worst, grey not allowed).
  const C = ['#2c3d52', '#3cff6e', '#8fe05a', '#f2d14b', '#f28a3b'];
  const grid = [
    [0, 4, 3, 3],
    [0, 3, 2, 2],
    [4, 2, 1, 1],
    [0, 2, 1, 0],
  ];
  let tiles = '';
  grid.forEach((row, y) => row.forEach((v, x) => {
    tiles += `<rect x="${2 + x * 16}" y="${2 + y * 16}" width="14" height="14" rx="3" fill="${C[v]}" ${v ? 'opacity=".9"' : ''}/>`;
  }));
  tiles += '<rect x="33" y="33" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="2.4"/>';
  return `<div class="tw-hflow">
      <div class="tw-hstep"><div class="tw-hcard"><img src="${game.thumbs['woodcutter:1']}" alt=""><span>Woodcutter</span></div><small>1. Pick</small></div>
      <span class="tw-harr">${uiIcon('arrow', 'sm')}</span>
      <div class="tw-hstep"><svg class="tw-hgrid" viewBox="0 0 66 66" aria-hidden="true">${tiles}</svg><small>2. Tap a tile</small></div>
      <span class="tw-harr">${uiIcon('arrow', 'sm')}</span>
      <div class="tw-hstep"><div class="tw-hbtn">${uiIcon('hammer', 'sm')} Build</div><small>3. Confirm</small></div>
    </div>`;
}

// What newcomers need before they arrive.
function newcomers(game) {
  const item = (pic, a) => `<div class="tw-hitem">${pic}<span>${a}</span></div>`;
  return `<div class="tw-hcap">Newcomers come when you have all four</div>
    <div class="tw-hrow">
      ${item(`<span class="tw-hic"><img src="${game.thumbs['house:1']}" alt=""></span>`, 'A free bed')}
      ${item(`<span class="tw-hic">${resIcon('food')}</span>`, 'Food')}
      ${item(`<span class="tw-hic">${resIcon('worker')}</span>`, 'Spare work')}
      ${item(`<span class="tw-hic">${resIcon('happy')}</span>`, 'Happy 40+')}
    </div>`;
}

// Resource chips, drawn with the same classes as the real top bar.
function chips() {
  const chip = (k, v, r, cls, st, note) => `<div class="tw-hitem"><span class="tw-chip ${st}"><span class="v">${resIcon(k)}${v}</span><span class="r ${cls}">${r}</span></span><span>${note}</span></div>`;
  return `<div class="tw-hcap">The small number is the change per minute</div>
    <div class="tw-hrow">
      ${chip('food', 42, '+2.4', 'up', '', 'Rising')}
      ${chip('wood', 9, '−1.5', 'down', '', 'Falling')}
      ${chip('stone', 80, '0', '', 'full', 'Full')}
    </div>`;
}

// Hut → Cottage → Manor.
function homes(game) {
  const step = (lv) => `<div class="tw-hitem"><img src="${game.thumbs['house:' + lv]}" alt=""><span><b>${LV[lv - 1].name}</b><br>${LV[lv - 1].cap} beds</span></div>`;
  return `<div class="tw-hrow">${step(1)}<span class="tw-harr">${uiIcon('arrow', 'sm')}</span>${step(2)}<span class="tw-harr">${uiIcon('arrow', 'sm')}</span>${step(3)}</div>`;
}

// Well, Dock and the ship button.
function events(game) {
  return `<div class="tw-hrow">
      <div class="tw-hitem"><img src="${game.thumbs['well:1']}" alt=""><span>Well<br>stops fires</span></div>
      <div class="tw-hitem"><img src="${game.thumbs['dock:1']}" alt=""><span>Dock<br>brings ships</span></div>
      <div class="tw-hitem"><span class="tw-hship">${uiIcon('ship', 'lg')}</span><span>Ship button<br>tap to trade</span></div>
    </div>`;
}

// The unlock ladder up to the Charter Hall.
function ladder(game) {
  return `<div class="tw-hrow tw-hladder">
      ${UNLOCKS.map((u, i) => `<div class="tw-hrung"><b>${u.name}</b><span>${resIcon('pop', 'sm')}${u.pop}</span><small>Tier ${i + 2}</small></div>`).join(`<span class="tw-harr">${uiIcon('arrow', 'sm')}</span>`)}
      <span class="tw-harr">${uiIcon('arrow', 'sm')}</span>
      <div class="tw-hitem"><img src="${game.thumbs['charter:1']}" alt=""><span>Charter Hall</span></div>
    </div>`;
}

// ---------- Pages ----------
const ui = (k) => uiIcon(k, 'sm');
const res = (k) => resIcon(k, 'sm');

export const HELP = [
  {
    t: 'Welcome to Tidewater', pic: screenMock,
    p: [
      [res('pop'), 'You lead a few stranded settlers. Grow them into a town that earns a Royal Charter.'],
      [ui('scroll'), 'The goal at the top says what to do next. Tap it to see every goal.'],
      [res('storage'), 'Your stores run along the top. Every building waits in the tray at the bottom.'],
    ],
  },
  {
    t: 'Look around', pic: gestures,
    p: [
      [ui('arrow'), 'Drag with one finger to move around the island.'],
      [ui('range'), 'Pinch with two fingers to zoom in and out.'],
      [ui('info'), 'Tap a tile or building to see what is there. Tap it again to close.'],
    ],
  },
  {
    t: 'Building', pic: buildFlow,
    p: [
      [ui('hammer'), 'Pick a building in the tray. Glowing tiles show where it can go.'],
      [ui('star'), 'Bright green is a good spot. Yellow and orange tiles are poor ones.'],
      [ui('check'), 'Tap a tile, read the preview, then press Build. A single tap never builds.'],
      [res('storage'), 'You can only build within reach of the Town Hall or a Warehouse.'],
    ],
  },
  {
    t: 'People and work', pic: newcomers,
    p: [
      [res('worker'), 'Most buildings need workers. A grey marker above one means nobody works there.'],
      [ui('star'), 'Food buildings get workers first. Give a building priority, or pause one to free its crew.'],
      [res('sad'), 'Below 30 happiness people start to leave. Your four founders always stay.'],
    ],
  },
  {
    t: 'Food and stores', pic: chips,
    p: [
      [res('food'), 'Each person eats about 1.2 food a minute. If food runs out, people go hungry and leave.'],
      [ui('arrow'), 'Green numbers are rising and red ones are falling. Fix red food first.'],
      [res('storage'), 'Every good has a storage limit. A yellow number means that store is full. Warehouses raise every limit.'],
    ],
  },
  {
    t: 'Better homes', pic: homes,
    p: [
      [ui('up'), 'Upgrade a house from its info sheet. Bigger homes hold more people and pay more tax.'],
      [ui('check'), 'A Cottage needs a Well and a Market in range.'],
      [ui('check'), 'A Manor also needs a Tavern and a steady supply of cloth.'],
      [res('sad'), 'Quarries, sawmills, mines, smelters and toolsmiths are noisy. Keep them 3 tiles from homes.'],
    ],
  },
  {
    t: 'Weather and ships', pic: events,
    p: [
      [ui('clock'), 'Storms, fires, pests and fever strike now and then, though not in your first few minutes.'],
      [ui('wrench'), 'A Well puts out fires in its range. Tap a damaged building to repair it.'],
      [ui('ship'), 'With a staffed Dock, ships call with deals. Tap the ship button to trade.'],
      [res('food'), 'If stores run very low, the mainland sends a relief ship. You can always recover.'],
    ],
  },
  {
    t: 'The Royal Charter', pic: ladder,
    p: [
      [ui('lock'), 'Milestones come in order. Some unlock new buildings, shown locked in the tray until then.'],
      [ui('star'), 'Build the Charter Hall once you have enough people and happiness of 60.'],
      [res('gold'), 'Your score counts people, happiness, Manors, wealth and speed. Then keep building if you like.'],
    ],
  },
];
