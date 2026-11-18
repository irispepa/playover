// HTML overlay: HUD, controls, damage numbers, toasts, minimap and all menu screens.
import { icon, SLOT_ICON } from './icons.js';
import {
  T, CLASSES, CLASS_ORDER, ABILITIES, RARITIES, WEAPONS, ARMORS, TRINKETS, PERK_TAGS, SYNERGIES, SCROLLS, SCROLL_KEYS, UNIQUES, BIOMES, biomeFor, isBossFloor,
} from './data.js';
import { perkById, tagCounts, previewEquip, itemStatLines, COMPARE_KEYS, COMPARE_INFO, formatStat, sellValue } from './items.js';
import { xpNeed } from './sim.js';
import { classUnlocked, bestiaryList } from './save.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = (n) => `#${(n >>> 0).toString(16).padStart(6, '0')}`;
function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

export function itemIcon(it) {
  if (it.slot === 'weapon') return WEAPONS[it.base].icon;
  if (it.slot === 'armor') return ARMORS[it.base].icon;
  return TRINKETS[it.base].icon;
}
function fmtTime(s) { s = Math.round(s); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }

export function createUI(root, H) {
  const ui = el('div', 'dv-ui');
  root.appendChild(ui);
  const touch = el('div', 'dv-touch');
  const joy = el('div', 'dv-joy'); const knob = el('div', 'dv-knob'); joy.appendChild(knob);
  touch.appendChild(joy);
  ui.appendChild(touch);

  // ---------------------------------------------------------------- HUD
  const hud = el('div', 'dv-hud', `
    <div class="dv-bars">
      <div class="dv-bar dv-hp"><div class="dv-fill"></div><div class="dv-ward"></div><span class="dv-bt">${icon('heart', 13)}<b></b></span></div>
      <div class="dv-bar dv-en"><div class="dv-fill"></div><span class="dv-bt">${icon('bolt', 12)}<b></b></span></div>
      <div class="dv-xp"><div class="dv-fill"></div></div>
      <div class="dv-chips">
        <span class="dv-chip dv-floor">${icon('stairs', 14)}<b></b></span>
        <span class="dv-chip dv-gold">${icon('coin', 14, '#ffcc40')}<b></b></span>
        <span class="dv-chip dv-keys">${icon('key', 14, '#ffd24a')}<b></b></span>
        <span class="dv-chip dv-lvl"><b></b></span>
      </div>
      <div class="dv-status"></div>
    </div>
    <div class="dv-right">
      <button class="dv-btn dv-pause" aria-label="Pause">${icon('pause', 22)}</button>
      <button class="dv-btn dv-bagbtn" aria-label="Inventory">${icon('bag', 22)}<i class="dv-badge"></i></button>
      <canvas class="dv-mini"></canvas>
    </div>`);
  ui.appendChild(hud);
  const $ = (s, p = ui) => p.querySelector(s);
  const hpFill = $('.dv-hp .dv-fill'), hpWard = $('.dv-hp .dv-ward'), hpTxt = $('.dv-hp b');
  const enFill = $('.dv-en .dv-fill'), enTxt = $('.dv-en b'), xpFill = $('.dv-xp .dv-fill');
  const floorTxt = $('.dv-floor b'), goldTxt = $('.dv-gold b'), keysEl = $('.dv-keys'), keysTxt = $('.dv-keys b'), lvlTxt = $('.dv-lvl b');
  const statusEl = $('.dv-status'), bagBadge = $('.dv-badge');
  const mini = $('.dv-mini');

  const boss = el('div', 'dv-boss', '<div class="dv-bname"></div><div class="dv-bbar"><div class="dv-fill"></div></div>');
  ui.appendChild(boss);
  const bossName = $('.dv-bname', boss), bossFill = $('.dv-fill', boss);

  // ---------------------------------------------------------------- controls
  const ctl = el('div', 'dv-ctl', `
    <button class="dv-act dv-dash" aria-label="Dash">${icon('dash', 30)}<i class="dv-cd"></i><span class="dv-lbl">Dash</span></button>
    <button class="dv-act dv-ab dv-ab1" aria-label="Ability 1"><span class="dv-abi"></span><i class="dv-cd"></i><em class="dv-cost"></em><span class="dv-lbl"></span></button>
    <button class="dv-act dv-ab dv-ab2" aria-label="Ability 2"><span class="dv-abi"></span><i class="dv-cd"></i><em class="dv-cost"></em><span class="dv-lbl"></span></button>
    <button class="dv-act dv-small dv-pot" aria-label="Potion">${icon('potion', 22, '#ff6070')}<i class="dv-n"></i><span class="dv-lbl">Potion</span></button>
    <button class="dv-act dv-small dv-bomb" aria-label="Bomb">${icon('bomb', 22, '#c8ccd8')}<i class="dv-n"></i><span class="dv-lbl">Bomb</span></button>
    <button class="dv-ctxbtn">${icon('hand', 18)}<span></span></button>
    <div class="dv-movehint" aria-hidden="true">${icon('hand', 18)}<span>Drag anywhere low on the screen to move</span></div>`);
  ui.appendChild(ctl);
  const dashBtn = $('.dv-dash', ctl), ab1Btn = $('.dv-ab1', ctl), ab2Btn = $('.dv-ab2', ctl), potBtn = $('.dv-pot', ctl), bombBtn = $('.dv-bomb', ctl), ctxBtn = $('.dv-ctxbtn', ctl);
  const potN = $('.dv-n', potBtn), bombN = $('.dv-n', bombBtn), ctxTxt = $('.dv-ctxbtn > span', ctl);
  const cost1 = $('.dv-cost', ab1Btn), cost2 = $('.dv-cost', ab2Btn);

  const nums = el('div', 'dv-nums');
  ui.appendChild(nums);
  const toasts = el('div', 'dv-toasts');
  ui.appendChild(toasts);
  const banner = el('div', 'dv-banner');
  ui.appendChild(banner);
  const vignette = el('div', 'dv-vig');
  ui.appendChild(vignette);
  const ov = el('div', 'dv-ov');
  ui.appendChild(ov);

  const U = {
    actions: {},
    root: ui, touch, joy, knob, dashBtn, ab1Btn, ab2Btn, potBtn, bombBtn, ctxBtn, pauseBtn: $('.dv-pause'), bagBtn: $('.dv-bagbtn'),
    overlay: null, cache: {}, timers: new Set(), numPool: [], numActive: [], miniBig: false, miniT: 0, mapV: -1, mapCanvas: null, mapData: null, curG: null,
  };

  // ---------------------------------------------------------------- per-frame HUD
  function setText(node, key, v) { if (U.cache[key] !== v) { U.cache[key] = v; node.textContent = v; } }
  function setScale(node, key, v) {
    v = Math.max(0, Math.min(1, v));
    if (Math.abs((U.cache[key] ?? -1) - v) > 0.004) { U.cache[key] = v; node.style.transform = `scaleX(${v})`; }
  }
  function setCd(btn, key, frac) {
    frac = Math.max(0, Math.min(1, frac));
    const q = Math.round(frac * 60) / 60;
    if (U.cache[key] !== q) { U.cache[key] = q; btn.style.setProperty('--cd', q); btn.classList.toggle('dv-cooling', q > 0); }
  }
  function setClass(node, key, cls, on) { if (U.cache[key] !== on) { U.cache[key] = on; node.classList.toggle(cls, on); } }

  U.setClass = (classId) => {
    const c = CLASSES[classId];
    const [a1, a2] = c.abilities;
    $('.dv-abi', ab1Btn).innerHTML = icon(ABILITIES[a1].icon, 26);
    $('.dv-abi', ab2Btn).innerHTML = icon(ABILITIES[a2].icon, 26);
    ab1Btn.setAttribute('aria-label', ABILITIES[a1].name);
    ab2Btn.setAttribute('aria-label', ABILITIES[a2].name);
    $('.dv-lbl', ab1Btn).textContent = ABILITIES[a1].name;
    $('.dv-lbl', ab2Btn).textContent = ABILITIES[a2].name;
    U.classId = classId;
    U.cache = {};
  };

  U.hud = (G, dt) => {
    const P = G.P, st = P.st, cls = CLASSES[P.classId];
    setScale(hpFill, 'hp', P.hp / st.maxHp);
    setScale(hpWard, 'ward', P.wardHp / st.maxHp);
    setText(hpTxt, 'hpt', `${Math.ceil(P.hp)} / ${st.maxHp}`);
    setScale(enFill, 'en', P.energy / st.energyMax);
    setText(enTxt, 'ent', `${Math.floor(P.energy)}`);
    setScale(xpFill, 'xp', P.xp / xpNeed(P.level));
    setText(floorTxt, 'fl', `${G.floorN}`);
    setText(goldTxt, 'gold', `${P.gold}`);
    setText(keysTxt, 'keys', `${P.keys}`);
    setClass(keysEl, 'keysh', 'dv-hide', P.keys <= 0);
    setText(lvlTxt, 'lvl', `Lv ${P.level}`);
    setText(potN, 'pot', `${P.potions}`);
    setText(bombN, 'bomb', `${P.bombs}`);
    setClass(potBtn, 'potE', 'dv-empty', P.potions <= 0);
    setClass(bombBtn, 'bombE', 'dv-empty', P.bombs <= 0);
    setClass(hud, 'low', 'dv-low', P.hp < st.maxHp * 0.3);
    setClass(vignette, 'vig', 'dv-on', P.hp < st.maxHp * 0.3);
    setText(bagBadge, 'bag', P.bag.length ? `${P.bag.length}` : '');
    const a1 = ABILITIES[cls.abilities[0]], a2 = ABILITIES[cls.abilities[1]];
    const red = 1 - (st.fx.energyCostRed || 0);
    setCd(dashBtn, 'cdD', P.dashCd / (cls.dashCd * st.dashCdMul));
    setCd(ab1Btn, 'cd1', P.cd1 / (a1.cd * (1 - st.cdr)));
    setCd(ab2Btn, 'cd2', P.cd2 / (a2.cd * (1 - st.cdr)));
    setClass(ab1Btn, 'lo1', 'dv-noen', P.energy < a1.energy * red);
    setClass(ab2Btn, 'lo2', 'dv-noen', P.energy < a2.energy * red);
    setText(cost1, 'c1', `${Math.round(a1.energy * red)}`);
    setText(cost2, 'c2', `${Math.round(a2.energy * red)}`);
    if (U.firstRun && !U.moved && P.moving) { U.moved = true; ui.classList.add('dv-moved'); }
    // Context action.
    const lbl = G.ctxLabel && G.ctx ? G.ctxLabel : '';
    if (U.cache.ctx !== lbl) { U.cache.ctx = lbl; ctxTxt.textContent = lbl; ctxBtn.classList.toggle('dv-show', !!lbl); }
    // Status chips.
    let s = '';
    if (P.furyT > 0) s += chip('fire', '#ff7a30', Math.ceil(P.furyT));
    if (P.bulwarkT > 0) s += chip('wall', '#60a8ff', Math.ceil(P.bulwarkT));
    if (P.wardHp > 0) s += chip('shield', '#c070ff', Math.ceil(P.wardHp));
    if (P.momentumT > 0) s += chip('dash', '#a08cff', '');
    if (P.frenzyN > 0) s += chip('clock', '#e04050', P.frenzyN);
    if (P.dashCrits > 0) s += chip('star', '#ffd24a', P.dashCrits);
    if (P.s.burnT > 0) s += chip('fire', '#ff5020', '');
    if (P.s.poisonN > 0) s += chip('poison', '#8ee04a', P.s.poisonN);
    if (P.s.bleedN > 0) s += chip('drop', '#e04050', P.s.bleedN);
    if (P.s.chill > 0 || P.s.frozenT > 0) s += chip('snow', '#9fe4ff', '');
    if (P.s.shockT > 0) s += chip('bolt', '#ffe14a', '');
    if (U.cache.status !== s) { U.cache.status = s; statusEl.innerHTML = s; }
    // Boss bar.
    const b = G.boss && !G.boss.dead && G.arenaSealed ? G.boss : null;
    setClass(boss, 'bossv', 'dv-show', !!b);
    if (b) {
      setText(bossName, 'bn', b.def.name);
      setScale(bossFill, 'bf', b.hp / b.maxHp);
    }
    U.miniT -= dt;
    if (U.miniT <= 0) { U.miniT = 0.1; drawMini(G); }
    updateNums(G, dt);
  };
  function chip(ic, col, n) { return `<span class="dv-sc" style="color:${col}">${icon(ic, 13)}${n !== '' ? `<b>${n}</b>` : ''}</span>`; }

  // ---------------------------------------------------------------- minimap
  const mctx = mini.getContext('2d');
  function sizeMini() {
    const css = U.miniBig ? Math.min(window.innerWidth - 40, 340) : 96;
    mini.style.width = css + 'px'; mini.style.height = css + 'px';
    const px = Math.round(css * Math.min(2, window.devicePixelRatio || 1));
    mini.width = px; mini.height = px;
  }
  sizeMini();
  mini.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); U.miniBig = !U.miniBig; mini.classList.toggle('dv-big', U.miniBig); sizeMini(); U.mapV = -1; });
  function rebuildMap(G) {
    const W = G.w, Hh = G.h;
    if (!U.mapCanvas || U.mapCanvas.width !== W || U.mapCanvas.height !== Hh) {
      U.mapCanvas = document.createElement('canvas'); U.mapCanvas.width = W; U.mapCanvas.height = Hh;
      U.mapData = U.mapCanvas.getContext('2d').createImageData(W, Hh);
    }
    const d = U.mapData.data, tiles = G.tiles, seen = G.seen, vis = G.vis;
    const hz = G.biome.hazardColor;
    const hr = (hz >> 16) & 255, hg = (hz >> 8) & 255, hb = hz & 255;
    for (let i = 0; i < W * Hh; i++) {
      const o = i * 4;
      if (!seen[i]) { d[o + 3] = 0; continue; }
      const t = tiles[i], v = vis[i] ? 1 : 0.7;
      let r = 0, g = 0, b = 0;
      if (t === T.WALL) { r = 120; g = 120; b = 140; }
      else if (t === T.SECRET) { if (G.mapped) { r = 200; g = 160; b = 80; } else { r = 120; g = 120; b = 140; } }
      else if (t === T.DOOR) { r = 255; g = 200; b = 60; }
      else if (t === T.STAIRS) { r = 120; g = 220; b = 255; }
      else if (t === T.HAZARD) { r = hr; g = hg; b = hb; }
      else if (t === T.SPIKES) { r = 150; g = 70; b = 70; }
      else if (t === T.BARRIER) { r = 255; g = 70; b = 50; }
      else { r = 58; g = 60; b = 72; }
      d[o] = r * v; d[o + 1] = g * v; d[o + 2] = b * v; d[o + 3] = 235;
    }
    U.mapCanvas.getContext('2d').putImageData(U.mapData, 0, 0);
    U.mapV = G.fogVersion;
  }
  function drawMini(G) {
    if (U.mapV !== G.fogVersion || U.mapTiles !== G.changedTiles.length) { rebuildMap(G); U.mapTiles = G.changedTiles.length; }
    const cw = mini.width, ch = mini.height;
    mctx.clearRect(0, 0, cw, ch);
    mctx.fillStyle = 'rgba(8,10,16,0.72)';
    mctx.fillRect(0, 0, cw, ch);
    const P = G.P;
    let span, x0, y0;
    if (U.miniBig) { span = Math.max(G.w, G.h); x0 = (G.w - span) / 2; y0 = (G.h - span) / 2; }
    else { span = 30; x0 = P.x - span / 2; y0 = P.y - span / 2; }
    const sc = cw / span;
    mctx.imageSmoothingEnabled = false;
    mctx.drawImage(U.mapCanvas, -x0 * sc, -y0 * sc, G.w * sc, G.h * sc);
    const dot = (x, y, r, c) => { mctx.fillStyle = c; mctx.beginPath(); mctx.arc((x - x0) * sc, (y - y0) * sc, r, 0, Math.PI * 2); mctx.fill(); };
    const base = Math.max(2, sc * 0.45);
    for (const o of G.objects) {
      if (o.used || !(G.seen[o.y * G.w + o.x] || (G.mapped && o.kind !== 'crate'))) continue;
      const c = o.kind === 'chest' ? '#ffcc40' : o.kind === 'key' ? '#ffe680' : o.kind === 'shrine' ? '#60e0ff' : o.kind === 'pedestal' ? '#60e0a0' : null;
      if (c) dot(o.x + 0.5, o.y + 0.5, base * 1.1, c);
    }
    for (const e of G.enemies) {
      if (e.dead || !G.vis[Math.floor(e.y) * G.w + Math.floor(e.x)]) continue;
      dot(e.x, e.y, e.boss ? base * 2 : base, e.elite ? '#ffa040' : '#ff4a3a');
    }
    dot(P.x, P.y, base * 1.4, '#ffffff');
  }

  // ---------------------------------------------------------------- damage numbers
  for (let i = 0; i < 44; i++) { const n = el('div', 'dv-num'); n.style.display = 'none'; nums.appendChild(n); U.numPool.push({ n, life: 0, x: 0, y: 0, vx: 0 }); }
  const proj = { x: 0, y: 0, ok: true };
  U.addNum = (x, y, text, cls) => {
    let s = U.numPool.find((q) => q.life <= 0);
    if (!s) { s = U.numPool.reduce((a, b) => (a.life < b.life ? a : b)); }
    s.life = 0.85; s.x = x; s.y = y; s.vx = (Math.random() - 0.5) * 0.6; s.h = 1.1;
    s.n.textContent = text;
    s.n.className = `dv-num dv-n-${cls}`;
    s.n.style.display = 'block';
  };
  function updateNums(G, dt) {
    const R = H.renderer();
    for (const s of U.numPool) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) { s.n.style.display = 'none'; continue; }
      s.h += dt * 1.6; s.x += s.vx * dt;
      R.project(s.x, s.h, s.y, proj);
      const a = Math.min(1, s.life * 3);
      s.n.style.transform = `translate(${proj.x}px, ${proj.y}px) translate(-50%, -50%) scale(${0.8 + Math.min(0.3, (0.85 - s.life) * 2)})`;
      s.n.style.opacity = a;
    }
  }

  // ---------------------------------------------------------------- toasts and banners
  U.toast = (html, color) => {
    const t = el('div', 'dv-toast', html);
    if (color) t.style.color = color;
    toasts.appendChild(t);
    while (toasts.children.length > 4) toasts.firstChild.remove();
    const a = setTimeout(() => { U.timers.delete(a); t.classList.add('dv-out'); }, 2400);
    const b = setTimeout(() => { U.timers.delete(b); t.remove(); }, 2900);
    U.timers.add(a); U.timers.add(b);
  };
  let bannerT = 0;
  U.banner = (title, sub, color) => {
    banner.innerHTML = `<div class="dv-bt1" style="color:${color || '#eef2f7'}">${esc(title)}</div>${sub ? `<div class="dv-bt2">${esc(sub)}</div>` : ''}`;
    banner.classList.remove('dv-show');
    void banner.offsetWidth;
    banner.classList.add('dv-show');
    clearTimeout(bannerT);
    bannerT = setTimeout(() => banner.classList.remove('dv-show'), 2200);
  };
  U.hurtFlash = () => { vignette.classList.remove('dv-hit'); void vignette.offsetWidth; vignette.classList.add('dv-hit'); };

  U.onEvent = (e, G) => {
    switch (e.t) {
      case 'num': {
        if (e.c === 'echo') { U.addNum(e.x, e.y, 'Echo!', 'echo'); break; }
        const v = Math.max(1, Math.round(e.v));
        const txt = e.c === 'gold' ? `+${v}` : e.c === 'heal' ? `+${v}` : e.c === 'crit' ? `${v}!` : `${v}`;
        U.addNum(e.x + (Math.random() - 0.5) * 0.3, e.y, txt, e.c);
        break;
      }
      case 'toast': U.toast(esc(e.text), e.color); break;
      case 'pickup': {
        const col = e.kind === 'item' ? RARITIES[e.rarity].color : '#eef2f7';
        const ic = e.kind === 'item' ? 'gem' : e.kind;
        U.toast(`${icon(ic, 16, col)} <span>${esc(e.text)}</span>`, col);
        break;
      }
      case 'levelup': U.banner(`Level ${e.level}`, 'Choose a relic', '#ffd24a'); break;
      case 'bossstart': U.banner(e.name, 'Defeat it to open the way down', '#e25c5c'); break;
      case 'bossphase': if (e.say) U.banner(e.say, '', '#ff8a5a'); break;
      case 'bossdead': U.banner('Victory', `${e.name} has fallen`, '#ffd24a'); break;
      case 'phurt': U.hurtFlash(); break;
      case 'floor': {
        const b = biomeFor(e.floor);
        U.banner(`Floor ${e.floor}`, isBossFloor(e.floor) ? `${b.name}: a great foe waits below` : b.name, '#eef2f7');
        U.mapV = -1;
        break;
      }
      default: break;
    }
  };

  U.setPlaying = (on) => {
    ui.classList.toggle('dv-playing', on);
  };
  // First floor of a player's first run: name the buttons and show how to move until they do.
  U.setFirstRun = (on) => {
    U.firstRun = on; U.moved = false;
    ui.classList.toggle('dv-firstrun', on);
    ui.classList.remove('dv-moved');
  };

  // ---------------------------------------------------------------- overlays
  function open(html, cls = '') {
    ov.className = `dv-ov dv-open ${cls}`;
    ov.innerHTML = `<div class="dv-panel">${html}</div>`;
    U.overlay = cls || 'panel';
    const panel = ov.firstChild;
    panel.scrollTop = 0;
    return panel;
  }
  U.close = () => { ov.className = 'dv-ov'; ov.innerHTML = ''; U.overlay = null; };
  U.isOpen = () => !!U.overlay;
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !ov.contains(b)) return;
    e.preventDefault();
    const act = b.dataset.act, arg = b.dataset.arg;
    if (H.tap) H.tap();
    if (U.actions[act]) U.actions[act](arg, b);
  });

  // ---- title
  const EMBLEM = `<svg class="dv-emblem" viewBox="0 0 200 132" aria-hidden="true">
    <defs>
      <radialGradient id="dv-glow"><stop offset="0" stop-color="#ffb347" stop-opacity="0.5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <radialGradient id="dv-deep" cx="0.5" cy="0.7" r="0.7"><stop offset="0" stop-color="#3a2810"/><stop offset="1" stop-color="#090705"/></radialGradient>
    </defs>
    <circle class="dv-torchglow" cx="30" cy="50" r="30" fill="url(#dv-glow)"/>
    <circle class="dv-torchglow dv-tg2" cx="170" cy="50" r="30" fill="url(#dv-glow)"/>
    <path d="M44 112V58a56 56 0 0 1 112 0v54z" fill="#1a1e29" stroke="#3a4152" stroke-width="2"/>
    <path d="M54 112V60a46 46 0 0 1 92 0v52z" fill="none" stroke="#2c3240" stroke-width="1.5" stroke-dasharray="9 3"/>
    <path d="M64 112V62a36 36 0 0 1 72 0v50z" fill="url(#dv-deep)" stroke="#f0b44c" stroke-width="2.5"/>
    <circle cx="100" cy="70" r="15" fill="none" stroke="#f0b44c" stroke-width="2.5"/>
    <path d="M100 55v30M85 70h30M89.4 59.4l21.2 21.2M110.6 59.4 89.4 80.6" stroke="#f0b44c" stroke-width="1.6" opacity="0.75"/>
    <circle cx="100" cy="70" r="4.5" fill="#f0b44c"/>
    <path d="M70 112h60l-4 5H74z" fill="#2a2f3d"/><path d="M74 117h52l-5 6H79z" fill="#3a4050"/><path d="M79 123h42l-6 7H85z" fill="#4c5366"/>
    <path d="M27 62h6l-1 14h-4z" fill="#5a4a3a"/><path d="M30 46c3 4 5 6 5 10a5 5 0 0 1-10 0c0-4 2-6 5-10z" fill="#ffb347"/><path d="M30 52c1.5 2 2.5 3 2.5 5a2.5 2.5 0 0 1-5 0c0-2 1-3 2.5-5z" fill="#fff0c0"/>
    <path d="M167 62h6l-1 14h-4z" fill="#5a4a3a"/><path d="M170 46c3 4 5 6 5 10a5 5 0 0 1-10 0c0-4 2-6 5-10z" fill="#ffb347"/><path d="M170 52c1.5 2 2.5 3 2.5 5a2.5 2.5 0 0 1-5 0c0-2 1-3 2.5-5z" fill="#fff0c0"/>
  </svg>`;
  U.showTitle = (info) => {
    const m = info.meta;
    const cont = info.save ? `<button class="dv-big dv-primary" data-act="continue">${icon('stairs', 20)}<span>Continue<small>Floor ${info.save.floor} · ${esc(CLASSES[info.save.classId].name)} · Lv ${info.save.P.level}</small></span></button>` : '';
    const stats = m.deepest || m.runs
      ? `<div class="dv-tstats"><div><b>${m.deepest || 0}</b><small>Deepest floor</small></div><div><b>${m.runs}</b><small>${m.runs === 1 ? 'Run' : 'Runs'}</small></div><div><b>${m.kills}</b><small>Kills</small></div></div>`
      : '<div class="dv-foot">Every floor is new. Death is permanent.</div>';
    open(`
      <div class="dv-title">${EMBLEM}<div class="dv-logo">DEEP<span>VAULT</span></div><div class="dv-tag">A real-time dungeon descent</div></div>
      <div class="dv-menu">
        ${cont}
        <button class="dv-big ${info.save ? '' : 'dv-primary'}" data-act="newrun">${icon('sword', 20)}<span>New run${info.save ? '<small>Replaces your saved run</small>' : ''}</span></button>
        <div class="dv-mrow">
          <button class="dv-big" data-act="howto">${icon('scroll', 20)}<span>How to play</span></button>
          <button class="dv-big" data-act="moretips">${icon('gem', 20)}<span>More tips</span></button>
        </div>
        <div class="dv-mrow">
          <button class="dv-big" data-act="records">${icon('crown', 20)}<span>Records</span></button>
          <button class="dv-big dv-ghost" data-act="exit">${icon('close', 18)}<span>Back to games</span></button>
        </div>
      </div>
      ${stats}`, 'dv-titleov');
  };

  // ---- class select
  U.showNewRun = (meta, sel) => {
    let cards = '';
    for (const id of CLASS_ORDER) {
      const c = CLASSES[id];
      const unlocked = classUnlocked(meta, id);
      const best = meta.bestByClass[id] || 0;
      const abs = c.abilities.map((a) => `<span class="dv-abl">${icon(ABILITIES[a].icon, 14)}${esc(ABILITIES[a].name)}</span>`).join('');
      const foot = unlocked ? (best ? `Best: floor ${best}` : 'Not yet played') : `${icon('lock', 12)} ${esc(c.unlock.text)} to unlock`;
      cards += `<button class="dv-class ${sel === id ? 'dv-sel' : ''} ${unlocked ? '' : 'dv-locked'}" aria-pressed="${sel === id}" data-act="${unlocked ? 'pickclass' : 'lockedclass'}" data-arg="${id}" style="--cc:${hex(c.color)}">
        <div class="dv-cn">${esc(c.name)}${sel === id ? `<i class="dv-cck">${icon('check', 14)}</i>` : ''}</div>
        <div class="dv-cw">${icon(WEAPONS[c.weapon].icon, 14)} ${esc(WEAPONS[c.weapon].name)}</div>
        <div class="dv-cb">${esc(c.blurb)}</div>
        <div class="dv-cab">${abs}</div>
        <div class="dv-cbest">${foot}</div>
      </button>`;
    }
    open(`
      <div class="dv-h"><button class="dv-x" data-act="back" aria-label="Back">${icon('close', 18)}</button><h2>New run</h2></div>
      <div class="dv-sec">Choose a class</div>
      <div class="dv-classes">${cards}</div>
      <div class="dv-sec">Seed</div>
      <div class="dv-seed">
        <input class="dv-seedin" aria-label="Seed" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="Random" value="${esc(meta.lastSeedInput || '')}"/>
        <button class="dv-pill" data-act="seedrandom">${icon('dice', 16)}Random</button>
        <button class="dv-pill" data-act="seeddaily">Daily</button>
      </div>
      <div class="dv-note">Same seed, same dungeon. Share a seed to race a friend down the same floors.</div>
      <button class="dv-big dv-primary dv-start" data-act="start">${icon('stairs', 20)}<span>Descend as ${esc(CLASSES[sel].name)}</span></button>`, 'dv-newov');
    const inp = ov.querySelector('.dv-seedin');
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { inp.blur(); } e.stopPropagation(); });
  };
  U.seedValue = () => { const i = ov.querySelector('.dv-seedin'); return i ? i.value : ''; };
  U.setSeedValue = (v) => { const i = ov.querySelector('.dv-seedin'); if (i) i.value = v; };

  // ---- pause
  U.showPause = (G) => {
    const run = G.run;
    open(`
      <div class="dv-h"><h2>Paused</h2></div>
      <div class="dv-pinfo">
        <span>${icon('stairs', 14)} Floor ${G.floorN} · ${esc(G.biome.name)}</span>
        <span>${icon(WEAPONS[CLASSES[run.classId].weapon].icon, 14)} ${esc(CLASSES[run.classId].name)} · Lv ${G.P.level}</span>
        <span>${icon('clock', 14)} ${fmtTime(run.stats.time)}</span>
        <span>${icon('skull', 14)} ${run.stats.kills} kills</span>
        <span>${icon('dice', 14)} Seed ${esc(run.label)}</span>
      </div>
      <div class="dv-menu">
        <button class="dv-big dv-primary" data-act="resume">${icon('dash', 20)}<span>Resume</span></button>
        <button class="dv-big" data-act="inventory">${icon('bag', 20)}<span>Inventory</span></button>
        <div class="dv-mrow">
          <button class="dv-big" data-act="howto">${icon('scroll', 20)}<span>How to play</span></button>
          <button class="dv-big" data-act="moretips">${icon('gem', 20)}<span>More tips</span></button>
        </div>
        <button class="dv-big dv-danger" data-act="abandon">${icon('skull', 20)}<span>Abandon run</span></button>
        <button class="dv-big dv-ghost" data-act="exit">${icon('close', 18)}<span>Save and exit to menu</span></button>
      </div>`, 'dv-pauseov');
  };
  U.showConfirm = (text, yesAct, yesLabel) => {
    open(`<div class="dv-h"><h2>Are you sure?</h2></div><p class="dv-p">${esc(text)}</p>
      <div class="dv-menu"><button class="dv-big dv-danger" data-act="${yesAct}"><span>${esc(yesLabel)}</span></button>
      <button class="dv-big" data-act="pause"><span>Cancel</span></button></div>`, 'dv-confirm');
  };

  // ---- perk choice
  U.showChoice = (G) => {
    const c = G.choice, P = G.P;
    const owned = tagCounts(P.perks);
    let cards = '';
    for (const id of c.options) {
      const p = perkById(id);
      const n = P.perks[id] || 0;
      const tags = p.tags.map((t) => `<span class="dv-tag" style="--tc:${PERK_TAGS[t].color}">${esc(PERK_TAGS[t].name)}</span>`).join('');
      let syn = '';
      for (const t of p.tags) {
        const have = n === 0 ? (owned[t] || 0) + 1 : owned[t] || 0;
        const S = SYNERGIES[t];
        if (have >= S.need && (owned[t] || 0) < S.need) syn += `<div class="dv-syn dv-synnew" style="--tc:${PERK_TAGS[t].color}">${icon('star', 13)} Unlocks ${esc(S.name)}: ${esc(S.desc)}</div>`;
        else if (have < S.need) syn += `<div class="dv-syn" style="--tc:${PERK_TAGS[t].color}">${esc(PERK_TAGS[t].name)} ${have}/${S.need} toward ${esc(S.name)}</div>`;
      }
      cards += `<button class="dv-perk" data-act="perk" data-arg="${id}">
        <div class="dv-pn">${esc(p.name)}${p.max > 1 ? `<small>${n}/${p.max}</small>` : ''}</div>
        <div class="dv-tags">${tags}</div>
        <div class="dv-pd">${esc(p.desc)}</div>${syn}</button>`;
    }
    open(`<div class="dv-h"><h2>${c.source === 'level' ? `Level ${c.level || P.level}` : 'Shrine of Gifts'}</h2></div>
      <p class="dv-p">Choose one relic. Relics that share a colour build toward a powerful synergy.</p>
      <div class="dv-perks">${cards}</div>`, 'dv-choiceov');
  };

  // ---- inventory
  U.inv = { sel: null };
  U.showInventory = (G) => {
    const P = G.P, st = P.st;
    const sel = U.inv.sel;
    const slotCell = (slot, label) => {
      const it = P.equip[slot];
      const s = sel && sel.where === 'eq' && sel.slot === slot;
      if (!it) return `<button class="dv-cell dv-emptyc ${s ? 'dv-sel' : ''}" data-act="none"><span class="dv-slotl">${label}</span>${icon(slot.startsWith('trinket') ? 'ring' : SLOT_ICON[slot], 22, '#55607a')}</button>`;
      return `<button class="dv-cell ${s ? 'dv-sel' : ''}" data-act="seleq" data-arg="${slot}" style="--rc:${RARITIES[it.rarity].color}"><span class="dv-slotl">${label}</span>${icon(itemIcon(it), 24, RARITIES[it.rarity].color)}<i>${it.ilvl}</i></button>`;
    };
    let bag = '';
    for (let i = 0; i < 12; i++) {
      const it = P.bag[i];
      if (!it) { bag += '<div class="dv-cell dv-emptyc"></div>'; continue; }
      const s = sel && sel.where === 'bag' && sel.uid === it.uid;
      const better = quickBetter(P, it);
      bag += `<button class="dv-cell ${s ? 'dv-sel' : ''}" data-act="selbag" data-arg="${it.uid}" style="--rc:${RARITIES[it.rarity].color}">${icon(itemIcon(it), 24, RARITIES[it.rarity].color)}<i>${it.ilvl}</i>${better ? `<b class="dv-up">${icon('up', 11)}</b>` : ''}</button>`;
    }
    let belt = `<div class="dv-beltrow">${icon('potion', 18, '#ff6070')}<span>Potions <b>${P.potions}/${st.potionMax}</b></span><button class="dv-pill" data-act="drink" ${P.potions ? '' : 'disabled'}>Drink</button></div>`;
    belt += `<div class="dv-beltrow">${icon('bomb', 18, '#c8ccd8')}<span>Bombs <b>${P.bombs}</b></span></div>`;
    for (const k of SCROLL_KEYS) {
      if (!P.scrolls[k]) continue;
      belt += `<div class="dv-beltrow">${icon('scroll', 18, '#e8dcb0')}<span>${esc(SCROLLS[k].name)} <b>×${P.scrolls[k]}</b><small>${esc(SCROLLS[k].desc)}</small></span><button class="dv-pill" data-act="read" data-arg="${k}">Read</button></div>`;
    }
    const statRows = [
      ['sword', 'Damage / sec', formatStat('num', st.dps)], ['heart', 'Max health', `${st.maxHp}`], ['shield', 'Armour', `${Math.round(st.armor)} (${Math.round(st.armorRed * 100)}%)`],
      ['star', 'Crit', `${Math.round(st.crit * 100)}% ×${(1 + st.critDmg).toFixed(1)}`], ['clock', 'Attacks / sec', st.rate.toFixed(2)], ['boot', 'Move speed', `${Math.round((1 + st.moveSpd) * 100)}%`],
      ['bolt', 'Energy', `${st.energyMax} (+${st.energyRegen.toFixed(1)}/s)`], ['clock', 'Cooldowns', `−${Math.round(st.cdr * 100)}%`],
    ];
    if (st.lifesteal > 0) statRows.push(['drop', 'Lifesteal', `${(st.lifesteal * 100).toFixed(1)}%`]);
    if (st.thorns > 0) statRows.push(['thorn', 'Thorns', `${Math.round(st.thorns)}`]);
    for (const [k, ic, col, nm] of [['burnCh', 'fire', '#ff7a30', 'Burn'], ['poisonCh', 'poison', '#8ee04a', 'Poison'], ['chillCh', 'snow', '#9fe4ff', 'Chill'], ['shockCh', 'bolt', '#ffe14a', 'Shock'], ['bleedCh', 'drop', '#e04050', 'Bleed']]) {
      if (st[k] > 0) statRows.push([ic, `${nm} chance`, `${Math.round(Math.min(1, st[k]) * 100)}%`, col]);
    }
    const stats = statRows.map(([ic, l, v, col]) => `<div class="dv-srow">${icon(ic, 15, col)}<span>${l}</span><b>${v}</b></div>`).join('');
    const tags = tagCounts(P.perks);
    let syn = '';
    for (const t in tags) {
      const S = SYNERGIES[t], on = tags[t] >= S.need;
      syn += `<div class="dv-synrow ${on ? 'dv-on' : ''}" style="--tc:${PERK_TAGS[t].color}"><b>${esc(PERK_TAGS[t].name)} ${Math.min(tags[t], S.need)}/${S.need}</b> ${esc(S.name)}${on ? `: ${esc(S.desc)}` : ''}</div>`;
    }
    const perks = Object.keys(P.perks).map((id) => { const p = perkById(id); return `<div class="dv-prow"><b>${esc(p.name)}${P.perks[id] > 1 ? ` ×${P.perks[id]}` : ''}</b><span>${esc(p.desc)}</span></div>`; }).join('') || '<div class="dv-dim">No relics yet. Level up or find a Shrine of Gifts.</div>';
    const panel = open(`
      <div class="dv-h"><button class="dv-x" data-act="closeinv" aria-label="Close">${icon('close', 18)}</button><h2>Inventory</h2><span class="dv-gold">${icon('coin', 15, '#ffcc40')} ${P.gold}</span></div>
      <div class="dv-sec">Equipped</div>
      <div class="dv-eq">${slotCell('weapon', 'Weapon')}${slotCell('armor', 'Armour')}${slotCell('trinket1', 'Trinket')}${slotCell('trinket2', 'Trinket')}</div>
      <div class="dv-detail">${detailHTML(G)}</div>
      <div class="dv-sec">Bag <small>${P.bag.length}/12</small></div>
      <div class="dv-bag">${bag}</div>
      <div class="dv-sec">Belt</div>
      <div class="dv-belt">${belt}</div>
      <div class="dv-sec">Character</div>
      <div class="dv-stats">${stats}</div>
      <div class="dv-sec">Relics</div>
      ${syn ? `<div class="dv-syns">${syn}</div>` : ''}
      <div class="dv-perklist">${perks}</div>
      <button class="dv-big dv-primary" data-act="closeinv">${icon('dash', 20)}<span>Back to the dungeon</span></button>`, 'dv-invov');
    if (U.inv.scroll != null) panel.scrollTop = U.inv.scroll;
    panel.addEventListener('scroll', () => { U.inv.scroll = panel.scrollTop; }, { passive: true });
  };

  function quickBetter(P, it) {
    const slot = it.slot === 'trinket' ? (!P.equip.trinket1 ? 'trinket1' : !P.equip.trinket2 ? 'trinket2' : null) : it.slot;
    if (it.slot === 'trinket' && !slot) {
      const a = previewEquip(P, it, 'trinket1'), b = previewEquip(P, it, 'trinket2');
      return Math.max(a.after.dps - a.before.dps, b.after.dps - b.before.dps) > 0.5 || Math.max(a.after.maxHp - a.before.maxHp, b.after.maxHp - b.before.maxHp) > 5;
    }
    const pv = previewEquip(P, it, slot);
    return pv.after.dps > pv.before.dps * 1.03 || pv.after.maxHp > pv.before.maxHp + 8 || (it.slot === 'armor' && pv.after.armor > pv.before.armor + 2);
  }

  function compareHTML(P, it, slot) {
    const { before, after } = previewEquip(P, it, slot);
    let rows = '';
    for (const k of COMPARE_KEYS) {
      const a = before[k], b = after[k];
      const info = COMPARE_INFO[k];
      const diff = b - a;
      const thr = info.fmt === 'pct' ? 0.004 : info.fmt === 'dec' ? 0.05 : 0.5;
      if (Math.abs(diff) < thr) continue;
      const good = diff > 0;
      rows += `<div class="dv-crow">${icon(info.icon, 14)}<span>${info.label}</span><em>${formatStat(info.fmt, a)} → ${formatStat(info.fmt, b)}</em><b class="${good ? 'dv-good' : 'dv-bad'}">${icon(good ? 'up' : 'down', 11)}${formatStat(info.fmt, Math.abs(diff))}</b></div>`;
    }
    return rows || '<div class="dv-dim">No change to your main stats.</div>';
  }

  function itemBlock(it) {
    const r = RARITIES[it.rarity];
    const lines = itemStatLines(it).map((l) => `<div class="dv-irow ${l.affix ? 'dv-aff' : ''}">${icon(l.icon, 14)}<span>${esc(l.label)}</span><b>${esc(l.value)}</b></div>`).join('');
    const u = it.unique ? UNIQUES.find((q) => q.id === it.unique) : null;
    const kind = it.slot === 'weapon' ? WEAPONS[it.base].name : it.slot === 'armor' ? ARMORS[it.base].name : TRINKETS[it.base].name;
    return `<div class="dv-iname" style="color:${r.color}">${icon(itemIcon(it), 20, r.color)} ${esc(it.name)}</div>
      <div class="dv-isub">${r.name} ${esc(kind)} · item level ${it.ilvl}</div>
      <div class="dv-ilines">${lines}</div>${u ? `<div class="dv-iuniq">${icon('star', 13)} ${esc(u.desc)}</div>` : ''}`;
  }

  function detailHTML(G) {
    const P = G.P, sel = U.inv.sel;
    if (!sel) return '<div class="dv-dim dv-hint">Tap an item to see its stats and compare it with what you wear. Items marked with an arrow look like upgrades.</div>';
    if (sel.where === 'eq') {
      const it = P.equip[sel.slot];
      if (!it) { U.inv.sel = null; return detailHTML(G); }
      return `${itemBlock(it)}<div class="dv-acts">${sel.slot !== 'weapon' ? `<button class="dv-pill" data-act="unequip" data-arg="${sel.slot}" ${P.bag.length >= 12 ? 'disabled' : ''}>Take off</button>` : ''}</div>`;
    }
    const it = P.bag.find((q) => q.uid === sel.uid);
    if (!it) { U.inv.sel = null; return detailHTML(G); }
    let acts = '', cmp = '';
    if (it.slot === 'trinket') {
      cmp = `<div class="dv-cmph">Replacing left trinket</div>${compareHTML(P, it, 'trinket1')}<div class="dv-cmph">Replacing right trinket</div>${compareHTML(P, it, 'trinket2')}`;
      acts = `<button class="dv-pill dv-pp" data-act="equip" data-arg="trinket1">Equip left</button><button class="dv-pill dv-pp" data-act="equip" data-arg="trinket2">Equip right</button>`;
    } else {
      cmp = `<div class="dv-cmph">If equipped</div>${compareHTML(P, it, it.slot)}`;
      acts = `<button class="dv-pill dv-pp" data-act="equip" data-arg="${it.slot}">Equip</button>`;
    }
    acts += `<button class="dv-pill" data-act="salvage" data-arg="${it.uid}">${icon('coin', 14, '#ffcc40')} Salvage +${sellValue(it)}</button>`;
    return `${itemBlock(it)}<div class="dv-cmp">${cmp}</div><div class="dv-acts">${acts}</div>`;
  }

  // ---- records
  U.showRecords = (meta) => {
    const best = CLASS_ORDER.map((id) => `<div class="dv-srow">${icon(WEAPONS[CLASSES[id].weapon].icon, 15)}<span>${esc(CLASSES[id].name)}</span><b>${meta.bestByClass[id] ? `floor ${meta.bestByClass[id]}` : classUnlocked(meta, id) ? '—' : 'locked'}</b></div>`).join('');
    const list = bestiaryList(meta);
    const seen = list.filter((b) => b.seen).length;
    const played = meta.runs > 0 || meta.deepest > 0 || seen > 0;
    const beasts = list.map((b) => `<div class="dv-beast ${b.seen ? '' : 'dv-unseen'}"><i style="background:${hex(b.color)}"></i><span>${b.seen ? esc(b.name) : '???'}</span>${b.boss ? icon('crown', 12, '#ffd24a') : ''}<b>${b.kills || ''}</b></div>`).join('');
    const hist = meta.history.slice(0, 15).map((h) => `<div class="dv-hist"><span>${esc(CLASSES[h.cls] ? CLASSES[h.cls].name : h.cls)} · Lv ${h.level}</span><b>Floor ${h.floor}</b><small>${h.kills} kills · ${fmtTime(h.time)} · ${esc(h.by === 'abandoned' ? 'abandoned' : `slain by ${h.by}`)} · seed ${esc(h.seed)}</small></div>`).join('');
    const body = played ? `
      <div class="dv-pinfo"><span>${icon('stairs', 14)} Deepest ${meta.deepest || 0}</span><span>${icon('skull', 14)} ${meta.kills} kills</span><span>${icon('star', 14)} ${meta.elites} elites</span><span>${icon('crown', 14)} ${meta.bosses} bosses</span><span>${icon('dice', 14)} ${meta.runs} ${meta.runs === 1 ? 'run' : 'runs'}</span></div>
      <div class="dv-sec">Best floor by class</div><div class="dv-stats">${best}</div>
      <div class="dv-sec">Bestiary <small>${seen}/${list.length}</small></div>${seen ? `<div class="dv-beasts">${beasts}</div>` : `<div class="dv-dim">No monsters met yet.</div>`}
      ${hist ? `<div class="dv-sec">Recent runs</div><div class="dv-hists">${hist}</div>` : ''}`
      : `<div class="dv-empty1">${icon('crown', 28, '#55607a')}<p>No runs yet. Your deepest floors, kills and the monsters you meet are recorded here.</p></div>`;
    open(`
      <div class="dv-h"><button class="dv-x" data-act="back" aria-label="Back">${icon('close', 18)}</button><h2>Records</h2></div>
      ${body}
      <button class="dv-big" data-act="back"><span>Back</span></button>`, 'dv-recov');
  };

  // ---- death
  U.showDeath = (run, unlocks, isBest) => {
    const s = run.stats;
    const rows = [
      ['stairs', 'Floor reached', run.floor], ['clock', 'Time', fmtTime(s.time)], ['skull', 'Kills', s.kills], ['star', 'Elites slain', s.elites],
      ['crown', 'Bosses slain', s.bosses], ['coin', 'Gold found', s.gold], ['gem', 'Items found', s.items], ['sword', 'Damage dealt', Math.round(s.dmgDealt)],
      ['heart', 'Damage taken', Math.round(s.dmgTaken)], ['spark', 'Level', run.P.level],
    ].map(([ic, l, v]) => `<div class="dv-srow">${icon(ic, 15)}<span>${l}</span><b>${v}</b></div>`).join('');
    const un = unlocks.length ? `<div class="dv-unlocks">${unlocks.map((u) => `<div>${icon('star', 14, '#ffd24a')} ${esc(u)}</div>`).join('')}</div>` : '';
    open(`
      <div class="dv-dead">${icon('skull', 40, '#ff7a6a')}<div class="dv-dt">You have fallen</div><div class="dv-ds">${esc(CLASSES[run.classId].name)}, level ${run.P.level}. Slain by ${esc(s.killedBy || 'the dark')} on floor ${run.floor}.</div>${isBest ? `<div class="dv-rec">${icon('crown', 14)} New record</div>` : ''}</div>
      ${un}
      <div class="dv-stats">${rows}</div>
      <div class="dv-menu">
        <button class="dv-big dv-primary" data-act="restart">${icon('sword', 20)}<span>Restart<small>${esc(CLASSES[run.classId].name)}, new seed</small></span></button>
        <button class="dv-big" data-act="retryseed">${icon('dice', 20)}<span>Same seed again<small>${esc(run.label)}</small></span></button>
        <button class="dv-big" data-act="newrun">${icon('stairs', 20)}<span>Choose class</span></button>
        <button class="dv-big dv-ghost" data-act="title"><span>Main menu</span></button>
      </div>`, 'dv-deadov');
  };

  U.dispose = () => { clearTimeout(bannerT); for (const id of U.timers) clearTimeout(id); U.timers.clear(); ui.remove(); };
  return U;
}
