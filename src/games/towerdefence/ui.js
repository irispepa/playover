// HTML overlay for Bastion Maze: HUD, tray, sheets, modals. No game rules here; it calls `h` handlers.
import {
  TOWERS, TOWER_ORDER, ENEMIES, ABILITIES, CARD_BY_ID, CARD_KIND_NAMES, PRIORITIES, PRIORITY_NAMES, DTYPE_NAMES,
  ARCHETYPES, ARCHETYPE_ORDER, DIFFICULTY, TILE_NAMES, TILE_INFO, HERO, HERO_WEAPONS, maxLevel, baseLevels, defaultMods,
} from './data.js';
import { ICON, towerIcon, enemyIcon } from './icons.js';
import {
  buildCost, upgradeInfo, sellValue, nextWaveSummary, canCallWave, earlyBonus, abilityList, heroStats, heroWeapons, cardStrength,
} from './sim.js';

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function btn(cls, html, fn) {
  const b = el('button', cls, html);
  b.type = 'button';
  b.addEventListener('click', (e) => { e.stopPropagation(); fn && fn(e); });
  return b;
}
const fmt = (n) => {
  n = Math.round(n);
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
};
const f1 = (n) => (n >= 100 ? fmt(n) : n >= 10 ? n.toFixed(0) : n.toFixed(1));

// ---------------------------------------------------------------- art made in code (title emblem, guide diagrams)
// Tile colours match render.js TILE_COL so the diagrams look like the map.
const TILE_HEX = ['#5d7a46', '#6b6862', '#2c6fa0', '#6f6658', '#7f8f55', '#4f6272', '#6b5030', '#8a6a40', '#3a2d3a', '#3d4f66'];
const iconInner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const placeIcon = (s, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 32})">${iconInner(s)}</g>`;
const CORE_GEM = (cx, cy, r) => `<path d="M${cx} ${cy - r}l${r * 0.75} ${r}-${r * 0.75} ${r}-${r * 0.75}-${r}z" fill="#7fd8ff"/><path d="M${cx} ${cy - r}l${r * 0.3} ${r}-${r * 0.3} ${r}z" fill="#d8f6ff"/>`;

const EMBLEM = `<svg class="bm-emblem" viewBox="0 0 64 64" aria-hidden="true">
<rect x="1" y="1" width="62" height="62" rx="15" fill="#162030" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>
<g fill="#8f8a7e"><rect x="9" y="9" width="18" height="5" rx="1.2"/><rect x="37" y="9" width="18" height="5" rx="1.2"/><rect x="9" y="9" width="5" height="46" rx="1.2"/><rect x="50" y="9" width="5" height="46" rx="1.2"/><rect x="9" y="50" width="46" height="5" rx="1.2"/>
<rect x="20" y="20" width="24" height="5" rx="1.2"/><rect x="20" y="20" width="5" height="24" rx="1.2"/><rect x="39" y="20" width="5" height="24" rx="1.2"/></g>
<path d="M32 5 V17 H17 V47 H32 V40" fill="none" stroke="#f0b44c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 4.4"/>
<path d="M27.5 8v-3.5a4.5 4.5 0 0 1 9 0V8" fill="none" stroke="#e25c5c" stroke-width="2.6"/>
${CORE_GEM(32, 33, 7.5)}
</svg>`;

const ARROW_R = '<svg class="bm-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// rows: strings of '.' ground, 'w' wall, 'r' rock, 'G' gate, 'C' core. path: cell list, drawn as the dotted route.
function gridSvg(rows, path, o = {}) {
  const cs = 16, H = rows.length, W = rows[0].length;
  let out = '';
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const X = x * cs, Y = y * cs;
    const fill = ch === 'r' ? TILE_HEX[1] : ch === 'G' ? TILE_HEX[8] : ch === 'C' ? TILE_HEX[9] : TILE_HEX[0];
    out += `<rect x="${X + 0.5}" y="${Y + 0.5}" width="${cs - 1}" height="${cs - 1}" rx="2" fill="${fill}"/>`;
    if (ch === 'w') out += `<rect x="${X + 1.5}" y="${Y + 1.5}" width="${cs - 3}" height="${cs - 3}" rx="1.5" fill="#8f8a7e"/><path d="M${X + 1.5} ${Y + cs / 2}h${cs - 3}" stroke="#5f5a52" stroke-width="1.2"/>`;
    if (ch === 'G') out += `<path d="M${X + 4} ${Y + cs - 3}v-6a4 4 0 0 1 8 0v6" fill="none" stroke="#e25c5c" stroke-width="2.4"/>`;
    if (ch === 'C') out += CORE_GEM(X + cs / 2, Y + cs / 2, 6);
  }));
  const pts = path.map(([x, y]) => `${x * cs + cs / 2},${y * cs + cs / 2}`).join(' ');
  out += `<polyline points="${pts}" fill="none" stroke="#ffe07a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 4"/>`;
  for (const [x, y] of o.enemies || []) out += `<circle cx="${x * cs + cs / 2}" cy="${y * cs + cs / 2}" r="3.6" fill="#d06a4a" stroke="#0e1420" stroke-width="1"/>`;
  return `<svg class="bm-grid" viewBox="0 0 ${W * cs} ${H * cs}" aria-hidden="true">${out}</svg>`;
}

const badge = (n, x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#f0b44c"/><text x="${x}" y="${y + 3.6}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#1a1205">${n}</text>`;

// A mock of the top of the play screen, numbered to match the points on the page.
const HUD_MOCK = (() => {
  const box = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#101620" stroke="rgba(255,255,255,0.18)" ${extra}/>`;
  let s = `<rect x="0.5" y="0.5" width="299" height="179" rx="14" fill="#25381f" stroke="rgba(255,255,255,0.15)"/>`;
  s += `<path d="M20 150 H120 V110 H200" fill="none" stroke="#ffe07a" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 5" opacity="0.7"/>`;
  // row 1: menu, lives, gold ... pause/speed
  s += box(8, 8, 22, 22) + placeIcon(ICON.menu, 11, 11, 16).replace(/currentColor/g, '#e8edf4');
  s += box(34, 8, 44, 22) + placeIcon(ICON.heart, 38, 12, 14) + '<text x="56" y="23.5" font-size="11" font-weight="700" fill="#e8edf4">20</text>';
  s += box(82, 8, 50, 22) + placeIcon(ICON.coin, 86, 12, 14) + '<text x="104" y="23.5" font-size="11" font-weight="700" fill="#e8edf4">250</text>';
  s += box(232, 8, 60, 22) + placeIcon(ICON.pause, 238, 12, 14).replace(/currentColor/g, '#e8edf4') + '<text x="264" y="23.5" font-size="11" font-weight="700" fill="#e8edf4">1x</text>';
  // row 2: wave, next preview, send
  s += box(8, 36, 34, 22) + '<text x="25" y="51.5" text-anchor="middle" font-size="11" font-weight="700" fill="#e8edf4">4</text>';
  s += box(46, 36, 180, 22) + '<text x="53" y="51" font-size="8.5" font-weight="800" fill="#9aa6b6">NEXT</text>';
  s += placeIcon(enemyIcon('grunt'), 80, 40, 14) + placeIcon(enemyIcon('runner'), 110, 40, 14) + placeIcon(enemyIcon('wasp'), 140, 40, 14);
  s += `<rect x="230" y="36" width="62" height="22" rx="5" fill="#2e6b52" stroke="#4cc9a0"/>` + placeIcon(ICON.play, 238, 41, 12).replace(/currentColor/g, '#e8edf4') + '<text x="254" y="51.5" font-size="11" font-weight="700" fill="#e8edf4">Send</text>';
  // abilities column
  [['meteor', 84], ['freeze', 114], ['rush', 144]].forEach(([id, y]) => {
    s += `<circle cx="279" cy="${y + 12}" r="12" fill="#101620" stroke="rgba(240,180,76,0.7)"/>` + placeIcon(ICON[id], 271, y + 4, 16);
  });
  s += '<path d="M136 62 V58 M261 62 V58 M252 126 H267 M220 19 H232" stroke="#f0b44c" stroke-width="1.5"/>';
  s += badge(1, 136, 70) + badge(2, 261, 70) + badge(3, 248, 126) + badge(4, 220, 19);
  return `<svg class="bm-mock" viewBox="0 0 300 180" aria-hidden="true">${s}</svg>`;
})();

// Where the thumbs go in hero control.
const HERO_MOCK = (() => {
  let s = `<rect x="0.5" y="0.5" width="299" height="179" rx="14" fill="#25381f" stroke="rgba(255,255,255,0.15)"/>`;
  s += `<rect x="1" y="1" width="149" height="178" rx="13" fill="rgba(63,208,192,0.10)"/><rect x="150" y="1" width="149" height="178" rx="13" fill="rgba(255,122,47,0.10)"/>`;
  s += `<path d="M150 12 V168" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  // left stick
  s += `<circle cx="80" cy="104" r="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.45)" stroke-width="2"/><circle cx="93" cy="95" r="11" fill="rgba(255,255,255,0.55)"/>`;
  s += `<text x="80" y="156" text-anchor="middle" font-size="12.5" font-weight="800" fill="#bff5ec">Left thumb: move</text>`;
  // right stick
  s += `<circle cx="200" cy="104" r="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,122,47,0.7)" stroke-width="2"/><circle cx="187" cy="93" r="11" fill="rgba(255,140,70,0.7)"/>`;
  s += `<text x="218" y="156" text-anchor="middle" font-size="12.5" font-weight="800" fill="#ffd2b0">Right thumb: aim</text>`;
  // hero between the sticks
  s += placeIcon(ICON.hero, 128, 88, 26);
  // build button top left, hero buttons right column
  s += `<rect x="8" y="8" width="38" height="38" rx="10" fill="rgba(63,208,192,0.2)" stroke="#3fd0c0"/>` + placeIcon(ICON.build, 15, 11, 24) + '<text x="52" y="31" font-size="10" font-weight="700" fill="#cfd8e4">Build</text>';
  [['dash', 14, 'Dash'], ['nova', 48, 'Nova'], ['swap', 82, 'Swap']].forEach(([id, y, l]) => {
    s += `<circle cx="279" cy="${y + 12}" r="12" fill="#101620" stroke="rgba(255,255,255,0.3)"/>` + placeIcon(ICON[id], 271, y + 4, 16).replace(/currentColor/g, '#e8edf4');
    s += `<text x="261" y="${y + 15.5}" text-anchor="end" font-size="9" font-weight="700" fill="#cfd8e4">${l}</text>`;
  });
  return `<svg class="bm-mock" viewBox="0 0 300 180" aria-hidden="true">${s}</svg>`;
})();

export function createHud(ui, h) {
  const rootEl = el('div', 'bm');
  ui.appendChild(rootEl);

  // ---------------------------------------------------------------- top bar
  const top = el('div', 'bm-top');
  const row1 = el('div', 'bm-row');
  const menuB = btn('bm-iconbtn', ICON.menu, () => h.pause());
  menuB.setAttribute('aria-label', 'Menu');
  const lives = el('div', 'bm-chip', `${ICON.heart}<span>0</span>`);
  const gold = el('div', 'bm-chip', `${ICON.coin}<span>0</span>`);
  const wave = el('div', 'bm-chip', `${ICON.wave}<span>0</span>`);
  const speed = el('div', 'bm-speed');
  let lastSpeed = 1, curSpeed = 1;
  const pauseB = btn('', ICON.pause, () => h.setSpeed(curSpeed > 0 ? 0 : lastSpeed));
  pauseB.setAttribute('aria-label', 'Pause or resume');
  const speedB = btn('', '1x', () => h.setSpeed(curSpeed === 0 ? lastSpeed : curSpeed === 1 ? 2 : curSpeed === 2 ? 4 : 1));
  speedB.setAttribute('aria-label', 'Game speed');
  speed.append(pauseB, speedB);
  row1.append(menuB, lives, gold, el('div', 'bm-spacer'), speed);
  const row2 = el('div', 'bm-row');
  const next = el('div', 'bm-next');
  next.append(el('span', 'lbl', 'Next'));
  const nextList = el('div', 'bm-enemies');
  next.appendChild(nextList);
  next.addEventListener('click', () => h.showWaveInfo());
  const call = btn('bm-call', 'Start', () => h.callWave());
  row2.append(wave, next, call);
  top.append(row1, row2);
  rootEl.appendChild(top);

  // ---------------------------------------------------------------- side columns
  const side = el('div', 'bm-side');
  // each round button sits in a wrapper with a name label, shown before the first wave (and the first hero touch)
  const wrapBtn = (b, name) => {
    b.setAttribute('aria-label', name);
    const w = el('div', 'bm-aw');
    w.append(el('span', 'bm-alab', name), b);
    side.appendChild(w);
    return w;
  };
  const abBtns = {}, abWrap = {};
  for (const id of ['orbital', 'meteor', 'freeze', 'rush']) {
    const b = btn('bm-abtn', `${ICON[id]}<div class="cd"></div><div class="cdt"></div>`, () => h.ability(id));
    abBtns[id] = b;
    abWrap[id] = wrapBtn(b, ABILITIES[id].name);
  }
  const heroBtns = {
    dash: btn('bm-abtn', `${ICON.dash}<div class="cd"></div><div class="cdt"></div>`, () => h.dash()),
    ult: btn('bm-abtn', `${ICON.nova}<div class="cd"></div><div class="cdt"></div>`, () => h.ult()),
    swap: btn('bm-abtn', `${ICON.swap}<div class="cdt"></div>`, () => h.swap()),
  };
  const heroWrap = { dash: wrapBtn(heroBtns.dash, 'Dash'), ult: wrapBtn(heroBtns.ult, HERO.ult.name), swap: wrapBtn(heroBtns.swap, 'Swap weapon') };
  rootEl.appendChild(side);

  const left = el('div', 'bm-left');
  const modeB = btn('bm-mode', `${ICON.hero}<span>Hero</span>`, () => h.toggleHero());
  modeB.setAttribute('aria-label', 'Switch between building and hero control');
  const hstat = el('div', 'bm-hstat', `<div class="lv">Lv 1</div><div class="bm-bar"><i></i></div><div class="bm-bar xp"><i></i></div><div class="pts"></div>`);
  hstat.addEventListener('click', () => h.openHeroSheet());
  hstat.setAttribute('role', 'button');
  hstat.setAttribute('aria-label', 'Hero upgrades');
  left.append(modeB, hstat);
  rootEl.appendChild(left);

  // ---------------------------------------------------------------- bottom (build)
  const bottom = el('div', 'bm-bottom');
  const ctx = el('div', 'bm-ctx');
  const ctxTxt = el('div', 'txt');
  const confirm = btn('bm-confirm', `${ICON.check}<span>Build</span>`, () => h.confirm());
  const cancel = btn('bm-x', ICON.close, () => h.cancel());
  cancel.setAttribute('aria-label', 'Cancel');
  ctx.append(ctxTxt, confirm, cancel);
  const tray = el('div', 'bm-tray');
  const cards = {};
  for (const type of TOWER_ORDER) {
    const c = btn('bm-card', `${towerIcon(type)}<span class="nm">${TOWERS[type].name}</span><span class="ct">${ICON.coin}<span>0</span></span>`, () => h.arm(type));
    cards[type] = c;
    tray.appendChild(c);
  }
  bottom.append(ctx, tray);
  rootEl.appendChild(bottom);

  // ---------------------------------------------------------------- first-run coach (two pointers, shown once)
  const coachEl = (where) => {
    const n = el('div', 'bm-coach ' + where + ' bm-hidden', '<i class="tip"></i><span class="t"></span>');
    n.setAttribute('role', 'status');
    const x = btn('bm-coach-x', 'Got it', () => h.coachDone());
    n.appendChild(x);
    return n;
  };
  const coachTray = coachEl('at-tray');
  const coachCall = coachEl('at-call');
  bottom.appendChild(coachTray);
  top.appendChild(coachCall);

  // ---------------------------------------------------------------- hero mode controls
  const stickL = el('div', 'bm-stick', '<i></i>');
  const stickR = el('div', 'bm-stick aim', '<i></i>');
  const heroHint = el('div', 'bm-hint', 'Left thumb moves. Right thumb aims and fires. Let go to auto-aim.');
  rootEl.append(stickL, stickR, heroHint);

  const toasts = el('div', 'bm-toasts');
  const flash = el('div', 'bm-flash');
  const targetMsg = el('div', 'bm-target bm-hidden', 'Tap the map to aim');
  rootEl.append(flash, toasts, targetMsg);

  let sheet = null, modal = null, titleOn = false;
  const floats = [];
  for (let i = 0; i < 16; i++) { const f = el('div', 'bm-float'); f.style.opacity = '0'; rootEl.appendChild(f); floats.push({ el: f, t: 0, x: 0, y: 0 }); }
  let floatHead = 0;

  // ---------------------------------------------------------------- update
  const cache = {};
  const setText = (key, node, v) => { if (cache[key] !== v) { cache[key] = v; node.textContent = v; } };
  const setCls = (key, node, cls, on) => { const k = key + cls; if (cache[k] !== on) { cache[k] = on; node.classList.toggle(cls, on); } };
  const show = (key, node, on) => setCls(key, node, 'bm-hidden', !on);

  function update(s, c, dt) {
    if (titleOn) { titleOn = false; rootEl.classList.remove('bm-title-on'); }
    setText('lives', lives.lastChild, fmt(s.lives));
    setText('gold', gold.lastChild, fmt(s.gold));
    setText('wave', wave.lastChild, String(s.wave));
    curSpeed = c.speed;
    if (c.speed > 0) lastSpeed = c.speed;
    const ph = c.speed === 0 ? ICON.play : ICON.pause;
    if (cache.ph !== ph) { cache.ph = ph; pauseB.innerHTML = ph; }
    setCls('pon', pauseB, 'on', c.speed === 0);
    setText('spd', speedB, `${lastSpeed}x`);
    // next wave
    const nk = `${s.wave}:${s.next ? s.next.n : 0}`;
    if (cache.nextKey !== nk) {
      cache.nextKey = nk;
      nextList.replaceChildren();
      const sum = nextWaveSummary(s).sort((a, b) => (ENEMIES[b.type].boss ? 1 : 0) - (ENEMIES[a.type].boss ? 1 : 0));
      const fresh = s.next && s.next.tags.find((t) => t.startsWith('new:'));
      for (const it of sum.slice(0, 5)) {
        const isNew = fresh === 'new:' + it.type;
        const ch = el('span', 'bm-ech' + (ENEMIES[it.type].boss ? ' boss' : isNew ? ' new' : ''), `${enemyIcon(it.type)}${it.count}`);
        nextList.appendChild(ch);
      }
    }
    // call button
    let label;
    const can = canCallWave(s);
    if (s.waiting) label = s.wave === 0 ? 'Start' : 'Send';
    else if (s.activeWaves.length) label = 'Send';
    else label = s.autoWaves ? `${Math.ceil(Math.max(0, s.timer))}s` : 'Send';
    const bonus = earlyBonus(s);
    const callHtml = `${ICON.play}<span>${label}</span>${bonus > 0 ? `<small>+${fmt(bonus)}</small>` : ''}`;
    if (cache.call !== callHtml) { cache.call = callHtml; call.innerHTML = callHtml; }
    call.disabled = !can;
    setCls('callp', call, 'pulse', s.waiting && can);

    // abilities
    const list = abilityList(s);
    for (const id in abBtns) {
      const b = abBtns[id];
      const on = list.includes(id);
      show('ab' + id, abWrap[id], on);
      if (!on) continue;
      const cd = Math.max(0, s.ab[id]);
      const max = ABILITIES[id].cd * s.mods.cooldown;
      const frac = Math.min(1, cd / max);
      const fk = Math.round(frac * 40);
      if (cache['abf' + id] !== fk) { cache['abf' + id] = fk; b.children[1].style.transform = `scaleY(${frac})`; }
      setText('abt' + id, b.children[2], cd > 0 ? String(Math.ceil(cd)) : '');
      setCls('abr' + id, b, 'ready', cd <= 0);
      setCls('aba' + id, b, 'armed', c.targeting === id);
    }
    // hero
    const hero = s.hero;
    show('modeB', modeB, hero.unlocked);
    const heroMode = c.heroMode;
    const modeHtml = heroMode ? `${ICON.build}<span>Build</span>` : hero.deployed ? `${ICON.hero}<span>Hero</span>` : `${ICON.hero}<span>Deploy</span>`;
    if (cache.modeHtml !== modeHtml) { cache.modeHtml = modeHtml; modeB.innerHTML = modeHtml; }
    setCls('modeHero', modeB, 'hero', heroMode);
    setCls('modeReady', modeB, 'ready', hero.unlocked && !hero.deployed);
    show('hstat', hstat, hero.deployed);
    if (hero.deployed) {
      const st = heroStats(s, s.hst);
      const hpF = hero.downT > 0 ? 0 : Math.max(0, Math.min(1, hero.hp / st.maxHp));
      const xpF = Math.max(0, Math.min(1, hero.xp / hero.need));
      const k1 = Math.round(hpF * 50), k2 = Math.round(xpF * 50);
      if (cache.hpF !== k1) { cache.hpF = k1; hstat.children[1].firstChild.style.transform = `scaleX(${hpF})`; }
      if (cache.xpF !== k2) { cache.xpF = k2; hstat.children[2].firstChild.style.transform = `scaleX(${xpF})`; }
      setText('hlv', hstat.children[0], hero.downT > 0 ? `Down ${Math.ceil(hero.downT)}s` : `Lv ${hero.level}`);
      setText('hpts', hstat.children[3], hero.points > 0 ? `+${hero.points} pts` : HERO_WEAPONS[hero.weapon].name);
    }
    for (const id in heroBtns) show('hb' + id, heroWrap[id], heroMode);
    setCls('labels', side, 'labels', heroMode ? !c.hintSeen : s.wave === 0);
    if (heroMode) {
      const d = Math.max(0, hero.dashCd), u = Math.max(0, hero.ultCd);
      const st = heroStats(s, s.hst);
      const dm = HERO.dash.cd * st.cdMul, um = HERO.ult.cd * st.cdMul * s.mods.cooldown;
      const dk = Math.round(d / dm * 30), uk = Math.round(u / um * 30);
      if (cache.dk !== dk) { cache.dk = dk; heroBtns.dash.children[1].style.transform = `scaleY(${Math.min(1, d / dm)})`; }
      if (cache.uk !== uk) { cache.uk = uk; heroBtns.ult.children[1].style.transform = `scaleY(${Math.min(1, u / um)})`; }
      setText('dt', heroBtns.dash.children[2], d > 0 ? d.toFixed(1) : '');
      setText('ut', heroBtns.ult.children[2], u > 0 ? String(Math.ceil(u)) : '');
      setText('wt', heroBtns.swap.children[1], HERO_WEAPONS[hero.weapon].name.split(' ').pop());
    }
    show('bottom', bottom, !heroMode && !sheet);
    show('stickL', stickL, heroMode); show('stickR', stickR, heroMode); show('hint', heroHint, heroMode && !c.hintSeen);
    show('target', targetMsg, !!c.targeting);
    // tray
    if (!heroMode) {
      for (const type of TOWER_ORDER) {
        const cost = buildCost(s, type);
        setText('tc' + type, cards[type].lastChild.lastChild, fmt(cost));
        setCls('tp' + type, cards[type], 'poor', s.gold < cost);
        setCls('ton' + type, cards[type], 'on', c.armed === type);
      }
      updateCtx(s, c);
    }
    updateCoach(s, c, heroMode);
    if (sheet && sheet.refresh) sheet.refresh(s, c);
    // floats
    for (const f of floats) {
      if (f.t <= 0) continue;
      f.t -= dt;
      const k = Math.max(0, f.t / f.T);
      f.el.style.opacity = String(Math.min(1, k * 2));
      f.el.style.transform = `translate(${f.x}px, ${f.y - (1 - k) * 36}px) translate(-50%, -50%)`;
    }
  }

  function updateCtx(s, c) {
    let html = '', confirmOn = false, confirmOk = false, confirmLabel = 'Build', cancelOn = true;
    if (c.targeting) {
      html = `<b>${ABILITIES[c.targeting].name}</b>: tap the map where it should strike.`;
    } else if (c.selTile >= 0) {
      const tt = s.map.tiles[c.selTile];
      const tileName = `<b>${TILE_NAMES[tt]}</b>`;
      if (c.armed) {
        const r = c.preview;
        if (r && r.ok) { html = `${tileName}: build <b>${TOWERS[c.armed].name}</b> for ${fmt(r.cost)}`; confirmOn = true; confirmOk = true; confirmLabel = 'Build'; }
        else if (r) { html = `${tileName}: <span class="bad">${r.reason}</span>`; confirmOn = r.reason === 'Not enough gold'; confirmLabel = fmt(r.cost); }
      } else html = `${tileName}. ${TILE_INFO[tt]} Choose a tower below.`;
    } else if (c.armed) {
      const d = TOWERS[c.armed];
      html = `<b>${d.name}</b> (${fmt(buildCost(s, c.armed))}): ${d.role} Tap a tile.`;
    } else {
      cancelOn = false;
      html = s.wave === 0 ? 'Tap a tile, pick a tower, then press <b>Build</b>. Walls bend the enemy path.' : 'Tap a tile to build, or a tower to upgrade it.';
    }
    if (cache.ctx !== html) { cache.ctx = html; ctxTxt.innerHTML = html; }
    show('confirm', confirm, confirmOn);
    show('cancel', cancel, cancelOn);
    setCls('cno', confirm, 'no', !confirmOk);
    confirm.disabled = !confirmOk;
    setText('cl', confirm.lastChild, confirmLabel);
  }

  function updateCoach(s, c, heroMode) {
    let tray = '', call = '';
    if (!c.settings.seenCoach && s.wave === 0 && !heroMode && !modal && !sheet && !c.targeting) {
      if (s.stats.built > 0) call = 'Build more if you like, then press <b>Start</b> to send the first wave.';
      else if (c.armed && c.selTile >= 0) tray = 'Press <b>Build</b> to place it.';
      else if (c.armed) tray = `Now tap an open tile on the map to place the ${TOWERS[c.armed].name}.`;
      else if (c.selTile >= 0) tray = 'Now pick a tower from the tray below.';
      else tray = 'Pick a tower from the tray below, then tap a tile on the map.';
    }
    if (cache.coachT !== tray) { cache.coachT = tray; if (tray) coachTray.children[1].innerHTML = tray; }
    if (cache.coachC !== call) { cache.coachC = call; if (call) coachCall.children[1].innerHTML = call; }
    show('coachT', coachTray, !!tray);
    show('coachC', coachCall, !!call);
    setCls('coachB', coachTray, 'to-build', !!(c.armed && c.selTile >= 0));
  }

  const timeouts = new Set();
  function toast(text, kind = '') {
    const t = el('div', 'bm-toast ' + kind);
    t.textContent = text;
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    const id = setTimeout(() => { timeouts.delete(id); t.remove(); }, 2700);
    timeouts.add(id);
  }
  function float(x, y, text, big) {
    const f = floats[floatHead]; floatHead = (floatHead + 1) % floats.length;
    f.el.textContent = text; f.el.className = 'bm-float' + (big ? ' big' : '');
    f.x = x; f.y = y; f.t = f.T = big ? 1.6 : 1.0;
  }
  function hurtFlash() {
    flash.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
  }
  function setStick(which, on, x = 0, y = 0, kx = 0, ky = 0) {
    const st = which === 'L' ? stickL : stickR;
    st.classList.toggle('on', on);
    if (on) {
      st.style.left = x + 'px'; st.style.top = y + 'px';
      st.firstChild.style.transform = `translate(${kx}px, ${ky}px)`;
    }
  }

  // ---------------------------------------------------------------- sheets
  function closeSheet() { if (sheet) { sheet.el.remove(); sheet = null; } }
  function openTowerSheet(s, t) {
    closeSheet();
    const box = el('div', 'bm-sheet');
    rootEl.appendChild(box);
    sheet = { el: box, kind: 'tower', t, key: '' };
    sheet.refresh = (s2, c) => {
      const info = upgradeInfo(s2, t);
      const afford = info.kind === 'level' ? s2.gold >= info.cost : info.kind === 'branch' ? `${s2.gold >= info.a.cost}${s2.gold >= info.b.cost}` : '';
      const key = `${t.level}:${t.branch}:${t.prio}:${afford}:${s2.towerVer}:${t.jamT > 0}:${Math.floor(s2.time * 2)}:${sellValue(s2, t)}`;
      if (key === sheet.key) return;
      sheet.key = key;
      renderTowerSheet(box, s2, t, info);
    };
    sheet.refresh(s, {});
  }
  function renderTowerSheet(box, s, t, info) {
    const d = TOWERS[t.type];
    const st = t.st;
    const nb = baseLevels(t.type);
    const brName = t.branch ? d.branches[t.branch].name : '';
    box.replaceChildren();
    const head = el('div', 'bm-sh-head', `<div class="ic">${towerIcon(t.type)}</div><div class="t"><b>${brName || d.name}</b><span>Level ${t.level}/${maxLevel(t.type)}${brName ? ' · ' + d.name : ''} · ${t.jamT > 0 ? '<span style="color:#ff8a8a">Jammed</span>' : d.role}</span></div>`);
    head.appendChild(btn('bm-x', ICON.close, () => h.closeSheet()));
    box.appendChild(head);
    const stats = el('div', 'bm-stats');
    const add = (k, v) => stats.appendChild(el('div', 'bm-stat', `<small>${k}</small><b>${v}</b>`));
    const k = st.kind;
    if (k === 'mine') {
      add('Per wave', fmt(st.income * s.mods.mine * (s.mode === 'op' ? 3 : 1)));
      if (st.interest) add('Interest', Math.round(st.interest * 100) + '%');
      if (st.killBonus) add('Kill bonus', '+' + st.killBonus);
    } else if (k === 'support') {
      add('Radius', st.range.toFixed(1));
      if (st.buffDmg) add('Damage', '+' + Math.round(st.buffDmg * 100) + '%');
      if (st.buffRate) add('Fire rate', '+' + Math.round(st.buffRate * 100) + '%');
      if (st.buffRange) add('Range', '+' + Math.round(st.buffRange * 100) + '%');
      if (st.detect) add('Detects', st.detect.toFixed(1));
      if (st.mark) add('Marks', '+' + Math.round(st.mark * 100) + '%');
    } else if (k === 'none') {
      if (st.detect) add('Detects', st.detect.toFixed(1));
      if (st.rangeAura) add('Range aura', '+' + Math.round(st.rangeAura * 100) + '%');
      if (st.thorns) add('Thorns', f1(st.thorns) + '/s');
      if (!st.detect && !st.thorns) add('Blocks', 'Path');
    } else {
      add('Damage', f1(st.dmg) + (st.multishot ? ` x${st.multishot}` : ''));
      add('Rate', st.rate.toFixed(2) + '/s');
      add('Range', st.range.toFixed(1) + (st.minRange ? ` (min ${st.minRange})` : ''));
      add('DPS', f1(st.dps));
      add('Type', DTYPE_NAMES[st.dtype] || 'Physical');
      add('Targets', st.air && st.ground ? 'Air + ground' : st.air ? 'Air' : 'Ground');
    }
    add('Kills', fmt(t.kills));
    if (k !== 'mine' && k !== 'support') add('Dealt', fmt(t.dealt));
    const extra = [];
    if (st.splash) extra.push(`splash ${st.splash.toFixed(1)}`);
    if (st.slow) extra.push(`slows ${Math.round(st.slow * 100)}%`);
    if (st.freezeAt) extra.push(`freezes after ${st.freezeAt} hits`);
    if (st.poison) extra.push(`poison ${f1(st.poison)}/s per stack`);
    if (st.burn) extra.push(`burns ${f1(st.burn)}/s`);
    if (st.oil) extra.push('tars (fire x2)');
    if (st.shred) extra.push(`shreds ${st.shred} armour`);
    if (st.jumps) extra.push(`chains ${st.jumps}`);
    if (st.stun) extra.push(`stuns ${st.stun}s`);
    if (st.crit) extra.push(`${Math.round(st.crit * 100)}% crit`);
    if (st.execute) extra.push(`executes below ${Math.round(st.execute * 100)}%`);
    if (st.detect && k !== 'support' && k !== 'none') extra.push('detects hidden');
    if (st.napalm) extra.push('burning ground');
    if (st.cluster) extra.push(`${st.cluster} bomblets`);
    if (st.buffDmgIn || st.buffRateIn || st.buffRangeIn) extra.push('boosted by a beacon');
    box.appendChild(stats);
    if (extra.length) box.appendChild(el('div', 'bm-note', extra.join(' · ')));
    if (k !== 'support' && k !== 'mine' && k !== 'none' && k !== 'aura') {
      const seg = el('div', 'bm-seg');
      for (const p of PRIORITIES) {
        const b = btn(t.prio === p ? 'on' : '', PRIORITY_NAMES[p], () => h.setPrio(p));
        seg.appendChild(b);
      }
      box.appendChild(seg);
    }
    if (info.kind === 'branch') {
      box.appendChild(el('div', 'bm-note', 'Choose a specialisation. This is permanent for this tower.'));
      const brs = el('div', 'bm-branches');
      for (const key of ['a', 'b']) {
        const o = info[key];
        const b = btn('bm-branch', `<b>${o.name}</b><span>${o.desc}</span><em>${fmt(o.cost)} gold</em>`, () => h.upgrade(key));
        b.disabled = s.gold < o.cost;
        brs.appendChild(b);
      }
      box.appendChild(brs);
    }
    const acts = el('div', 'bm-acts');
    if (info.kind === 'level') {
      const b = btn('bm-up', `<span>Upgrade to level ${t.level + 1}</span><small>${fmt(info.cost)} gold</small>`, () => h.upgrade());
      b.disabled = s.gold < info.cost;
      acts.appendChild(b);
    } else if (info.kind === 'max') {
      acts.appendChild(el('div', 'bm-note', 'Fully upgraded.'));
      acts.firstChild.style.flex = '1';
    } else acts.appendChild(el('div', 'bm-spacer'));
    const sv = sellValue(s, t);
    acts.appendChild(btn('bm-sell', `Sell +${fmt(sv)}`, () => h.sell()));
    box.appendChild(acts);
    if (t.fresh) box.appendChild(el('div', 'bm-note', 'Built since the last wave: selling refunds everything.'));
  }

  function openHeroSheet(s) {
    closeSheet();
    const box = el('div', 'bm-sheet');
    rootEl.appendChild(box);
    sheet = { el: box, kind: 'hero', key: '' };
    sheet.refresh = (s2) => {
      const hr = s2.hero;
      const key = `${hr.level}:${hr.points}:${hr.weapon}:${hr.autoSpend}:${JSON.stringify(hr.up)}:${s2.perks.length}:${Math.round(hr.xp)}`;
      if (key === sheet.key) return;
      sheet.key = key;
      renderHeroSheet(box, s2);
    };
    sheet.refresh(s);
  }
  function renderHeroSheet(box, s) {
    const hr = s.hero;
    const st = heroStats(s, {});
    box.replaceChildren();
    const head = el('div', 'bm-sh-head', `<div class="ic">${ICON.hero}</div><div class="t"><b>Hero · level ${hr.level}</b><span>${Math.floor(hr.xp)}/${hr.need} xp · ${hr.kills} kills · ${hr.points} point${hr.points === 1 ? '' : 's'} to spend</span></div>`);
    head.appendChild(btn('bm-x', ICON.close, () => h.closeSheet()));
    box.appendChild(head);
    const rows = [
      ['dmg', 'Damage', `${f1(st.dmg)} per hit`, `+${Math.round(HERO.per.dmg * 100)}%`],
      ['rate', 'Fire rate', `${st.rate.toFixed(1)}/s`, `+${Math.round(HERO.per.rate * 100)}%`],
      ['speed', 'Move speed', `${st.speed.toFixed(1)} tiles/s`, `+${Math.round(HERO.per.speed * 100)}%`],
      ['hp', 'Health', `${fmt(st.maxHp)}`, `+${Math.round(HERO.per.hp * 100)}%`],
    ];
    for (const [key, name, val, per] of rows) {
      const r = el('div', 'bm-hrow', `<div class="n">${name} <small>${val} · rank ${hr.up[key]}/${HERO.statCap[key] > 50 ? '∞' : HERO.statCap[key]}</small></div>`);
      const b = btn('', `+ <small>${per}</small>`, () => h.spend(key));
      b.disabled = hr.points <= 0 || hr.up[key] >= HERO.statCap[key];
      r.appendChild(b);
      box.appendChild(r);
    }
    const tog = el('div', 'bm-tog', '<span>Spend new points automatically</span>');
    tog.appendChild(btn(hr.autoSpend ? 'on' : '', hr.autoSpend ? 'On' : 'Off', () => h.toggleAutoSpend()));
    box.appendChild(tog);
    box.appendChild(el('div', 'bm-note', '<b>Weapons</b> (more come from Armoury cards):'));
    const weps = el('div', 'bm-weps');
    for (const w of heroWeapons(s)) weps.appendChild(btn(hr.weapon === w ? 'on' : '', HERO_WEAPONS[w].name, () => h.equip(w)));
    box.appendChild(weps);
    const W = HERO_WEAPONS[hr.weapon];
    box.appendChild(el('div', 'bm-note', `${W.name}: ${W.desc} ${DTYPE_NAMES[W.dtype]} damage, range ${W.range}.`));
    box.appendChild(el('div', 'bm-note', `Dash: a quick dodge with a moment of invulnerability (${HERO.dash.cd}s). Nova: a shock blast that stuns everything nearby (${HERO.ult.cd}s). Downed heroes return to the core after ${Math.round(st.respawn)}s.`));
  }

  // ---------------------------------------------------------------- modals
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  function openModal(build) {
    closeModal();
    modal = el('div', 'bm-modal');
    const box = el('div', 'bm-box');
    modal.appendChild(box);
    build(box);
    rootEl.appendChild(modal);
    return box;
  }

  function showCards(s) {
    openModal((box) => {
      box.appendChild(el('h2', null, 'Choose one'));
      box.appendChild(el('p', null, `Wave ${s.cleared} cleared. Pick a card to shape this run.`));
      const pick = el('div', 'bm-pick');
      const k = cardStrength(s);
      s.pendingCards.forEach((id, i) => {
        const c = CARD_BY_ID[id];
        pick.appendChild(btn('bm-pcard ' + c.kind, `<span class="k">${CARD_KIND_NAMES[c.kind]}</span><b>${c.name}</b><span>${c.text(k)}</span>`, () => h.pickCard(i)));
      });
      box.appendChild(pick);
    });
  }

  function showPause(c) {
    openModal((box) => {
      box.appendChild(el('h2', null, 'Paused'));
      box.appendChild(el('p', 'bm-desc', `Wave ${c.s.wave} · ${c.runLabel}`));
      box.appendChild(btn('bm-btn pri', 'Resume', () => h.resume()));
      const grp = el('div', 'bm-setgrp');
      box.appendChild(grp);
      const tog = (label, on, fn) => {
        const r = el('div', 'bm-tog', `<span>${label}</span>`);
        const b = btn(on ? 'on' : '', on ? 'On' : 'Off', fn);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', label);
        r.appendChild(b);
        grp.appendChild(r);
      };
      tog('Start waves automatically', c.s.autoWaves, () => { h.toggleSetting('autoWaves'); showPause(c); });
      tog('Screen shake', c.settings.shake, () => { h.toggleSetting('shake'); showPause(c); });
      tog('Show enemy path', c.settings.paths, () => { h.toggleSetting('paths'); showPause(c); });
      const row = el('div', 'bm-row2');
      row.append(btn('bm-btn', 'How to play', () => showHow(() => showPause(c))),
        btn('bm-btn', 'Restart run', () => confirmBox('Restart this run?', 'You lose the progress on this run and start again on the same settings.', 'Restart', () => h.restart(), () => showPause(c))));
      box.appendChild(row);
      box.appendChild(btn('bm-btn', 'Save and exit to menu', () => h.exitToMenu()));
      if (c.s.perks.length) {
        const k = cardStrength(c.s);
        box.appendChild(el('h3', null, 'Cards this run'));
        const ul = el('ul');
        const counts = {};
        for (const id of c.s.perks) counts[id] = (counts[id] || 0) + 1;
        for (const id in counts) ul.appendChild(el('li', null, `<b>${CARD_BY_ID[id].name}</b>${counts[id] > 1 ? ' x' + counts[id] : ''}: ${CARD_BY_ID[id].text(k)}`));
        box.appendChild(ul);
      }
    });
  }

  function confirmBox(title, text, yesLabel, yes, no) {
    openModal((box) => {
      box.appendChild(el('h2', null, title));
      box.appendChild(el('p', null, text));
      box.appendChild(btn('bm-btn pri', yesLabel, yes));
      box.appendChild(btn('bm-btn', 'Cancel', no));
    });
  }

  // ---------------------------------------------------------------- how to play (paged, illustrated)
  function howPages() {
    const sellPct = Math.round(defaultMods().sellRate * 100);
    const arrowT = TOWERS.arrow;
    const towerRows = TOWER_ORDER.map((k) => {
      const d = TOWERS[k];
      return `<div class="bm-trow">${towerIcon(k)}<div><b>${d.name}</b><span>${d.role}</span></div>${d.air ? '<em class="bm-air">Air</em>' : ''}</div>`;
    }).join('');
    const enemyRow = (type, text) => `<div class="bm-trow">${enemyIcon(type)}<div><b>${ENEMIES[type].name}</b><span>${text}</span></div></div>`;
    const tileRow = (t, text) => `<div class="bm-trow"><i class="bm-sw" style="background:${TILE_HEX[t]}"></i><div><b>${TILE_NAMES[t]}</b><span>${text}</span></div></div>`;
    const card = (kind, id) => {
      const c = CARD_BY_ID[id];
      return `<div class="bm-mcard ${kind}"><small>${CARD_KIND_NAMES[kind]}</small><b>${c.name}</b><span>${c.text(1)}</span></div>`;
    };
    return [
      {
        title: 'Defend the core',
        pic: gridSvg(['..r......', 'G.......C', '.....r...'], [[0, 1], [8, 1]], { enemies: [[1.6, 1], [3.1, 1], [4.4, 1]] }),
        points: [
          'Enemies walk from the red gate to your crystal core.',
          'Each one that gets through costs lives. Bosses cost many.',
          'Kills and cleared waves pay gold. Spend it on towers.',
          'The waves never end. See how far you get.',
        ],
      },
      {
        title: 'Build the maze',
        pic: `<div class="bm-pic2">${gridSvg(['.......', '.......', 'G.....C', '.......', '.......'], [[0, 2], [6, 2]])}${ARROW_R}${gridSvg(['....w..', '..w.w..', 'G.w.w.C', '..w.w..', '..w....'], [[0, 2], [1, 2], [1, 0], [3, 0], [3, 4], [5, 4], [5, 2], [6, 2]])}</div>`,
        points: [
          '<b>Tap a tile</b>, pick a tower in the tray, then press <b>Build</b>.',
          'Every building blocks its tile. Enemies on foot take the shortest open route, shown as a dotted line.',
          'Walls are cheap. Use them to make the route long.',
          'You can never close the last route. The preview turns red.',
        ],
      },
      {
        title: 'Read the ground',
        lead: 'Tap any tile on the map to see what it is.',
        pic: `<div class="bm-list">${tileRow(4, 'Towers here get +20% range.')}${tileRow(5, 'Towers here deal +25% damage.')}${tileRow(6, 'Enemies wade at half speed. No building.')}${tileRow(2, 'Only flyers cross it.')}${tileRow(1, 'Blocks walking and building, like ruins.')}</div>`,
        points: [],
      },
      {
        title: 'Towers',
        lead: 'Flyers ignore the maze. Only towers marked <em class="bm-air">Air</em> can hit them.',
        pic: `<div class="bm-list bm-list-s">${towerRows}</div>`,
        points: [],
      },
      {
        title: 'Upgrade and sell',
        pic: `<div class="bm-branchpic"><div class="bm-bp-src">${towerIcon('arrow')}<b>${arrowT.name}</b><small>Level ${baseLevels('arrow')}</small></div>${ARROW_R}<div class="bm-bp-col"><div class="bm-mcard perk"><b>${arrowT.branches.a.name}</b><small>${arrowT.branches.a.desc}</small></div><div class="bm-mcard perk"><b>${arrowT.branches.b.name}</b><small>${arrowT.branches.b.desc}</small></div></div></div>`,
        points: [
          '<b>Tap a tower</b> to see its stats, upgrade it, sell it or choose what it targets.',
          'After its last base level, pick one of two specialisations. The choice is permanent.',
          `Selling pays back ${sellPct}%. Towers built since the last wave refund in full.`,
        ],
      },
      {
        title: 'Know the enemy',
        pic: `<div class="bm-list bm-list-s">${enemyRow('wasp', 'Flies over the maze. Needs Air towers.')}${enemyRow('knight', 'Armour shrinks every hit. Use Sniper, Venom or big hits.')}${enemyRow('warden', 'Shield regrows. Shock from Tesla tears it twice as fast.')}${enemyRow('shade', 'Hidden. Hunter, Lookout, Beacon level 3 or splash reveal it.')}${enemyRow('mender', 'Heals nearby enemies. Kill it first.')}${enemyRow('sapper', 'Jams towers it walks past.')}</div>`,
        points: [
          'A boss comes every 10th wave.',
          'Chilled or frozen enemies take extra physical damage. Tar doubles fire damage.',
        ],
      },
      {
        title: 'Waves and abilities',
        pic: HUD_MOCK,
        points: [
          { n: 1, t: 'The next wave. Tap it to see who is coming.' },
          { n: 2, t: 'Press <b>Send</b> to call the next wave early for bonus gold.' },
          { n: 3, t: 'Abilities recharge over time. For Meteor, tap it, then the map.' },
          { n: 4, t: 'Pause and speed: 1x, 2x, 4x. You can build while paused.' },
        ],
      },
      {
        title: 'Cards',
        pic: `<div class="bm-cardpic">${card('perk', 'drill')}${card('econ', 'chest')}${card('relic', 'hourglass')}</div>`,
        points: [
          'Every 5 waves you pick one of three cards. In Overpowered, every 3.',
          'Perks can stack, relics are one of a kind, economy cards boost your gold.',
          'Curses trade a risk for a reward.',
        ],
      },
      {
        title: 'The hero',
        pic: HERO_MOCK,
        points: [
          `From wave ${HERO.unlockWave}, tap <b>Deploy</b> on the left. In Overpowered the hero starts in play.`,
          'Left thumb moves. Right thumb aims and fires. Let go and the hero aims by itself.',
          'Dash dodges, Nova stuns everything nearby, Swap changes weapon.',
          'Tap the hero card to spend level-up points. <b>Build</b> takes you back to building.',
        ],
      },
    ];
  }

  function showHow(onClose, opts = {}) {
    const pages = howPages();
    let page = 0;
    const done = () => { closeModal(); onClose && onClose(); };
    openModal((box) => {
      box.classList.add('bm-how');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-label', 'How to play');
      const head = el('div', 'bm-how-head');
      const dots = el('div', 'bm-dots');
      dots.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < pages.length; i++) dots.appendChild(el('i'));
      const count = el('span', 'bm-sr');
      count.setAttribute('aria-live', 'polite');
      const skip = btn('bm-skip', 'Skip', done);
      head.append(dots, count, skip);
      const body = el('div', 'bm-how-body');
      const nav = el('div', 'bm-how-nav');
      const back = btn('bm-btn', 'Back', () => go(page - 1));
      const next = btn('bm-btn pri', 'Next', () => (page < pages.length - 1 ? go(page + 1) : done()));
      nav.append(back, next);
      box.append(head, body, nav);

      function go(p, dir = p > page ? 1 : -1) {
        if (p < 0 || p >= pages.length) return;
        page = p;
        const pg = pages[p];
        const inner = el('div', 'bm-how-page ' + (dir > 0 ? 'in-r' : 'in-l'));
        inner.appendChild(el('h2', null, pg.title));
        if (pg.lead) inner.appendChild(el('p', 'bm-lead', pg.lead));
        inner.appendChild(el('div', 'bm-pic', pg.pic));
        const ul = el('ul', 'bm-points');
        for (const pt of pg.points) {
          if (typeof pt === 'string') ul.appendChild(el('li', null, pt));
          else ul.appendChild(el('li', 'num', `<span class="bm-num">${pt.n}</span><span>${pt.t}</span>`));
        }
        if (pg.points.length) inner.appendChild(ul);
        body.replaceChildren(inner);
        body.scrollTop = 0;
        [...dots.children].forEach((d, i) => d.classList.toggle('on', i === p));
        count.textContent = `Page ${p + 1} of ${pages.length}`;
        back.classList.toggle('bm-invis', p === 0);
        back.disabled = p === 0;
        const last = p === pages.length - 1;
        next.textContent = last ? (opts.doneLabel || 'Got it') : 'Next';
        skip.classList.toggle('bm-invis', last);
      }
      // swipe between pages
      let sx = 0, sy = 0, sid = null;
      box.addEventListener('pointerdown', (e) => { sid = e.pointerId; sx = e.clientX; sy = e.clientY; });
      box.addEventListener('pointerup', (e) => {
        if (e.pointerId !== sid) return;
        sid = null;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(page + (dx < 0 ? 1 : -1));
      });
      box.addEventListener('pointercancel', () => { sid = null; });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.stopPropagation(); go(page + 1); }
        else if (e.key === 'ArrowLeft') { e.stopPropagation(); go(page - 1); }
      });
      go(0, 1);
      box.tabIndex = -1;
      requestAnimationFrame(() => box.focus({ preventScroll: true }));
    });
  }

  function showWaveInfo(s, onClose) {
    openModal((box) => {
      const boss = s.next && s.next.boss;
      box.appendChild(el('div', 'bm-mhead', `<h2>Wave ${s.wave + 1}</h2>${boss ? '<span class="bm-tag boss">Boss wave</span>' : ''}`));
      const fresh = s.next ? s.next.tags.filter((t) => t.startsWith('new:')).map((t) => t.slice(4)) : [];
      const sum = nextWaveSummary(s).sort((a, b) => (ENEMIES[b.type].boss ? 1 : 0) - (ENEMIES[a.type].boss ? 1 : 0));
      const list = el('div', 'bm-list');
      for (const it of sum) {
        const e = ENEMIES[it.type];
        const tags = (e.flying ? '<em class="bm-air">Air</em>' : '') + (fresh.includes(it.type) ? '<em class="bm-new">New</em>' : '');
        list.appendChild(el('div', 'bm-trow' + (e.boss ? ' boss' : ''), `${enemyIcon(it.type)}<div><b><span class="bm-n">${it.count}</span> x ${e.name}</b><span>${e.desc}</span></div>${tags}`));
      }
      box.appendChild(list);
      box.appendChild(btn('bm-btn pri', 'Close', () => { closeModal(); onClose && onClose(); }));
    });
  }

  function showGameOver(s, info) {
    openModal((box) => {
      box.classList.add('bm-over');
      box.appendChild(el('h2', null, 'The core has fallen'));
      if (info.record) box.appendChild(el('div', 'bm-banner', `${ICON.star}<span>New record: wave ${s.wave}</span>`));
      box.appendChild(el('p', null, `${info.runLabel}. You reached <b>wave ${s.wave}</b>.`));
      const sum = el('div', 'bm-sum');
      const add = (k, v) => sum.appendChild(el('div', 'bm-stat', `<small>${k}</small><b>${v}</b>`));
      add('Waves cleared', s.cleared); add('Best', `wave ${info.best}`);
      add('Kills', fmt(s.stats.kills)); add('Bosses', s.stats.bossKills);
      add('Gold earned', fmt(s.stats.goldEarned)); add('Towers built', s.stats.built);
      add('Hero level', s.hero.deployed ? s.hero.level : '-'); add('Cards', s.perks.length);
      box.appendChild(sum);
      box.appendChild(btn('bm-btn pri', 'Play again', () => h.restart()));
      box.appendChild(btn('bm-btn', 'Menu', () => h.toTitle()));
    });
  }

  // ---------------------------------------------------------------- title
  function showTitle(o) {
    // o: { save: label | null, records, onContinue, onStart(opts), onExit, last, today }
    let mode = o.last.mode || 'std', diff = o.last.difficulty || 'normal', arch = o.last.archetype || 'random';
    let seedText = o.last.seedText || '';
    let expanded = !o.save; // with a save, Continue leads and the new-run options stay folded until asked for
    if (!DIFFICULTY[diff]) diff = 'normal';
    if (arch !== 'random' && !ARCHETYPES[arch]) arch = 'random';
    titleOn = true;
    rootEl.classList.add('bm-title-on');
    const MODES = {
      std: ['Standard', 'Choose a difficulty and a map. Records are kept per difficulty.'],
      op: ['Overpowered', 'Mountains of gold, triple damage, a hero in play and an orbital strike. Bigger waves, separate records.'],
      daily: ['Daily', `Today's map and waves (${o.today}), the same all day. Normal difficulty.`],
      seed: ['Seed', 'The same seed and map always give the same run. Normal difficulty.'],
    };
    const MAPS = ['random', ...ARCHETYPE_ORDER];
    const RECS = [['std-easy', 'Easy'], ['std-normal', 'Normal'], ['std-hard', 'Hard'], ['op', 'Overpowered'], ['daily', 'Daily (today)'], ['seed', 'Seeded']];

    const render = () => {
      const prevBox = modal && modal.firstChild;
      const scroll = prevBox && prevBox.classList.contains('bm-tbox') ? prevBox.scrollTop : 0;
      const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
      const box = openModal((b) => build(b));
      modal.classList.add('bm-tmodal');
      box.scrollTop = scroll;
      if (fk) { const f = box.querySelector(`[data-fk="${fk}"]`); if (f) f.focus({ preventScroll: true }); }
    };
    const opt = (fk, label, on, fn, cls = '') => {
      const b = btn(cls + (on ? ' on' : ''), label, fn);
      b.dataset.fk = fk;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      return b;
    };
    const group = (label, ...kids) => {
      const g = el('div', 'bm-grp');
      g.appendChild(el('div', 'bm-glab', label));
      for (const k of kids) if (k) g.appendChild(k);
      return g;
    };

    function build(box) {
      box.classList.add('bm-tbox');
      box.appendChild(el('div', 'bm-thead', `${EMBLEM}<div><div class="bm-title">Bastion Maze</div><div class="bm-sub">Build the maze the enemy walks.</div></div>`));
      if (o.save) {
        const cont = btn('bm-btn pri bm-cont', `${ICON.play}<span><b>Continue</b><small>${o.save}</small></span>`, () => o.onContinue());
        cont.dataset.fk = 'cont';
        box.appendChild(cont);
      }
      if (!expanded) {
        const more = btn('bm-btn alt', 'New run', () => { expanded = true; render(); });
        more.dataset.fk = 'm-' + mode;
        box.appendChild(more);
      }
      const sec = el('div', 'bm-newrun');
      if (expanded) box.appendChild(sec);
      sec.appendChild(el('h3', null, 'New run'));
      // mode
      const modes = el('div', 'bm-seg2');
      for (const k of Object.keys(MODES)) modes.appendChild(opt('m-' + k, MODES[k][0], mode === k, () => { mode = k; render(); }, k === 'op' ? 'op' : ''));
      sec.appendChild(group('Mode', modes, el('p', 'bm-desc', MODES[mode][1])));
      // difficulty
      if (mode === 'std') {
        const ds = el('div', 'bm-segc');
        for (const k of Object.keys(DIFFICULTY)) ds.appendChild(opt('d-' + k, DIFFICULTY[k].name, diff === k, () => { diff = k; render(); }));
        const d = DIFFICULTY[diff];
        sec.appendChild(group('Difficulty', ds, el('p', 'bm-desc', `${d.lives} lives and ${d.gold} gold to start. Enemy health ${Math.round(d.hp * 100)}%.`)));
      }
      // seed
      if (mode === 'seed') {
        const inp = el('input', 'bm-input');
        inp.placeholder = 'Type any word or number';
        inp.value = seedText;
        inp.maxLength = 40;
        inp.setAttribute('aria-label', 'Seed');
        inp.addEventListener('input', () => { seedText = inp.value; });
        inp.addEventListener('keydown', (e) => e.stopPropagation());
        sec.appendChild(group('Seed', inp, el('p', 'bm-desc', 'Leave it empty for a random number.')));
      }
      // map
      if (mode !== 'daily') {
        const i = MAPS.indexOf(arch);
        const step = (d) => { arch = MAPS[(i + d + MAPS.length) % MAPS.length]; render(); };
        const row = el('div', 'bm-stepper');
        const prev = btn('bm-stepb', CHEV_L, () => step(-1));
        prev.dataset.fk = 'map-prev'; prev.setAttribute('aria-label', 'Previous map');
        const nxt = btn('bm-stepb', CHEV_R, () => step(1));
        nxt.dataset.fk = 'map-next'; nxt.setAttribute('aria-label', 'Next map');
        const name = el('div', 'bm-stepv', `<b>${arch === 'random' ? 'Random map' : ARCHETYPES[arch].name}</b><small>${i + 1} of ${MAPS.length}</small>`);
        name.setAttribute('aria-live', 'polite');
        row.append(prev, name, nxt);
        sec.appendChild(group('Map', row, el('p', 'bm-desc', arch === 'random' ? 'A different kind of map each run.' : ARCHETYPES[arch].desc)));
      }
      const start = btn('bm-btn bm-start ' + (mode === 'op' ? 'op' : o.save ? 'alt' : 'pri'), o.save ? 'Start new run' : 'Start', () => {
        o.onStart({ mode, difficulty: diff, archetype: arch, seedText: mode === 'seed' ? seedText.trim() : (o.last.seedText || '') });
      });
      start.dataset.fk = 'start';
      sec.appendChild(start);
      if (o.save) sec.appendChild(el('p', 'bm-desc bm-c', 'This replaces your saved run.'));
      // records
      const have = RECS.filter(([k]) => o.records[k]);
      const rec = el('div', 'bm-recs');
      rec.appendChild(el('h3', null, 'Records'));
      if (!have.length) rec.appendChild(el('p', 'bm-desc', 'No records yet. Your best wave in each mode shows here.'));
      else {
        const grid = el('div', 'bm-recgrid');
        for (const [k, l] of have) grid.appendChild(el('div', 'bm-stat', `<small>${l}</small><b>Wave ${o.records[k]}</b>`));
        rec.appendChild(grid);
      }
      box.appendChild(rec);
      const foot = el('div', 'bm-foot');
      const how = btn('bm-btn', 'How to play', () => showHow(render));
      how.dataset.fk = 'how';
      foot.append(how, btn('bm-btn', 'Back to games', () => o.onExit()));
      box.appendChild(foot);
    }
    render();
  }

  return {
    update, toast, float, hurtFlash, setStick, closeSheet, openTowerSheet, openHeroSheet, closeModal, showCards, showPause,
    showHow, showGameOver, showTitle, showWaveInfo,
    get sheet() { return sheet; }, get modal() { return modal; },
    insets() {
      const r = rootEl.getBoundingClientRect();
      const tb = top.getBoundingClientRect();
      const bb = bottom.getBoundingClientRect();
      return { top: tb.bottom - r.top + 6, bottom: bottom.classList.contains('bm-hidden') ? 20 : r.bottom - bb.top + 6, rootTop: r.top };
    },
    rect() { return rootEl.getBoundingClientRect(); },
    dispose() { for (const id of timeouts) clearTimeout(id); timeouts.clear(); rootEl.remove(); },
  };
}
