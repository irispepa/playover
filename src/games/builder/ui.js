// Tidewater HTML overlay: top bar, toasts, build tray, info sheet, placement bar, modals.
import {
  BUILDINGS, BUILD_ORDER, CATEGORIES, RES, RES_INFO, RES_TIER, MILESTONES, TERRAIN_NAMES, DEPOSIT_NAMES, SIZES, DIFFICULTY,
  T, D, HOUSE_GRACE, STORAGE_WAREHOUSE, CHARTER_HAPPY, IDLE_ALLOWANCE,
} from './data.js';
import { resIcon, uiIcon } from './icons.js';
import { cache, rates, prodPerMin, siteMult, canPlace, canAfford, radiusOf, reachOf, maxWorkers, isComplete, charterPop, forDisc, isWater } from './world.js';
import { upgradeInfo, goalProgress, currentGoal, needsUnmet, happyBreakdown, dayOf, repairCost, dwellingHappy } from './sim.js';
import { islandName } from './gen.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function fmt(n) {
  n = Math.floor(n + 1e-6);
  if (n >= 10000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
const fmtRate = (r) => (Math.abs(r) < 0.05 ? '0' : (r > 0 ? '+' : '−') + (Math.abs(r) < 10 ? Math.abs(r).toFixed(1) : Math.round(Math.abs(r))));
function costHTML(cost, s, mult = 1) {
  const parts = [];
  for (const k in cost) {
    const n = Math.ceil(cost[k] * mult);
    const short = s && (s.res[k] || 0) < n;
    parts.push(`<span class="${short ? 'no' : ''}">${resIcon(k)}${n}</span>`);
  }
  return `<span class="tw-costs">${parts.join('') || '<span>Free</span>'}</span>`;
}
const ioHTML = (k, n, suffix = '/min') => `<span class="io">${resIcon(k)}${n < 10 ? n.toFixed(1) : Math.round(n)}<small>${suffix}</small></span>`;
const minutesStr = (t) => { const m = Math.floor(t / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

const STATUS_TEXT = {
  ok: ['ok', 'Working'], build: ['warn', 'Under construction'], idle: ['warn', 'No workers'], input: ['warn', 'Waiting for materials'],
  full: ['warn', 'Storage full'], damaged: ['bad', 'Damaged: repair it to get it working'], paused: ['warn', 'Paused'], fire: ['bad', 'On fire!'],
  needs: ['bad', 'Needs not met'], warn: ['warn', 'A need has lapsed'],
};

const HELP = [
  { t: 'Welcome to Tidewater', b: ['You lead a handful of settlers stranded on a wild island. Your job is to grow them into a chartered town.', 'Drag with one finger to look around and pinch to zoom. Tap any tile to see what is there.'], img: ['townhall:1', 'house:1'] },
  { t: 'Building', b: ['Pick a building from the tray at the bottom. Glowing tiles show where it can go, and brighter green means a better spot.', 'Tap a tile, check the preview, then press Build. Nothing is ever built by a single tap.'], img: ['woodcutter:1', 'fishing:1'] },
  { t: 'People and work', b: ['Houses bring settlers, but newcomers only come when there is food, a free bed and work for them.', 'Each building needs workers. A grey marker means nobody is staffing it. Star a building in its info sheet to give it workers first, or pause one to free its crew.'], img: ['forager:1', 'farm:1'] },
  { t: 'Food and stores', b: ['Everyone eats. Watch the numbers under each resource: green is rising, red is falling.', 'Every good has a storage limit. Warehouses raise it and let you build further from the Town Hall.'], img: ['warehouse:1', 'bakery:1'] },
  { t: 'Better homes', b: ['Huts become Cottages when a Well and a Market are in range, and Manors with a Tavern and a supply of cloth. Bigger homes hold more people and pay more taxes.', 'Quarries, mines, mills and smithies are noisy. Keep them away from homes.'], img: ['house:2', 'house:3'] },
  { t: 'Weather and trade', b: ['Storms, fires and pests strike now and then. A Well puts out fires in its range before they spread.', 'Build a Dock and ships will call with deals. If things go badly, the mainland sends a relief ship, so you can always recover.'], img: ['dock:1', 'well:1'] },
  { t: 'The Royal Charter', b: ['Follow the goal at the top of the screen. Milestones unlock new buildings.', 'Build the Charter Hall to win the charter and score your colony, then keep building for as long as you like.'], img: ['charter:1', 'lighthouse:1'] },
];

export function createUI(host, game) {
  const root = document.createElement('div');
  root.className = 'tw';
  root.innerHTML = `
    <div class="tw-flash"></div>
    <div class="tw-top">
      <div class="tw-row">
        <button class="tw-btn" data-a="menu" aria-label="Menu">${uiIcon('menu')}</button>
        <div class="tw-res"></div>
      </div>
      <div class="tw-row">
        <button class="tw-goal" data-a="goal"><span>${uiIcon('scroll', 'lg')}</span><span class="t"><div class="n"></div><div class="p"></div></span><i class="bar"></i></button>
        <div class="tw-speed">
          <button class="tw-btn" data-a="speed" data-v="0" aria-label="Pause">${uiIcon('pause')}</button>
          <button class="tw-btn" data-a="speed" data-v="1" aria-label="Normal speed">${uiIcon('play')}</button>
          <button class="tw-btn" data-a="speed" data-v="3" aria-label="Fast">${uiIcon('fast')}</button>
        </div>
      </div>
    </div>
    <div class="tw-hint"></div>
    <div class="tw-toasts"></div>
    <button class="tw-btn tw-shipbtn" data-a="ship">${uiIcon('ship', 'lg')}<span class="st"></span></button>
    <div class="tw-tip"></div>
    <div class="tw-bottom">
      <div class="tw-panel tw-confirm"></div>
      <div class="tw-panel tw-sheet"></div>
      <div class="tw-panel tw-tray">
        <div class="tw-tabs"></div>
        <div class="tw-cards"></div>
      </div>
    </div>
    <div class="tw-modal"><div class="tw-mbox"></div></div>`;
  host.appendChild(root);
  const $ = (q) => root.querySelector(q);
  const resEl = $('.tw-res'), goalEl = $('.tw-goal'), toastsEl = $('.tw-toasts'), tipEl = $('.tw-tip'), shipBtn = $('.tw-shipbtn');
  const confirmEl = $('.tw-confirm'), sheetEl = $('.tw-sheet'), trayEl = $('.tw-tray'), tabsEl = $('.tw-tabs'), cardsEl = $('.tw-cards');
  const modalEl = $('.tw-modal'), mbox = $('.tw-mbox'), flashEl = $('.tw-flash'), hintEl = $('.tw-hint');
  resEl.style.touchAction = 'pan-x'; cardsEl.style.touchAction = 'pan-x'; sheetEl.style.touchAction = 'pan-y'; mbox.style.touchAction = 'pan-y';

  let tab = 'homes';
  let trayHidden = false;
  let lastSheet = '', lastConfirm = '', lastTray = '', lastModal = '', lastRes = '';
  let interactAt = 0;
  let tipKey = null, tipUntil = 0;
  let demolishArm = 0, demolishId = -1;
  let modal = null; // { kind, page, tab, ... }
  const newTabs = new Set();
  const timers = new Set();
  const later = (fn, ms) => { const h = setTimeout(() => { timers.delete(h); fn(); }, ms); timers.add(h); return h; };

  // ---------- Resource bar ----------
  function renderRes() {
    const s = game.s;
    if (!s) return;
    const c = cache(s);
    const r = rates(s);
    const items = [];
    const popWhy = s.popMode === 'grow' ? 'growing' : s.starving ? 'hungry' : s.pop >= s.housing ? 'no beds' : s.idle > IDLE_ALLOWANCE(s.pop) ? 'no jobs' : s.happy < 40 ? 'unhappy' : `${s.idle} idle`;
    items.push(['pop', fmt(s.pop), popWhy, s.popMode === 'grow' ? 'up' : s.popMode ? 'down' : '', s.pop >= s.housing ? 'full' : '']);
    items.push([s.happy >= 50 ? 'happy' : 'sad', Math.round(s.happy), '', '', s.happy < 40 ? 'empty' : '']);
    for (const k of RES) {
      if (RES_TIER[k] > s.tier && (s.res[k] || 0) < 1) continue;
      const v = s.res[k] || 0;
      const rt = r[k];
      items.push([k, fmt(v), fmtRate(rt), rt > 0.05 ? 'up' : rt < -0.05 ? 'down' : '', v >= c.caps[k] - 0.5 ? 'full' : v < 1 && rt <= 0 ? 'empty' : '']);
    }
    const html = items.map(([k, v, rr, cls, st]) => `<button class="tw-chip ${st}" data-a="chip" data-k="${k}"><span class="v">${resIcon(k)}${v}</span><span class="r ${cls}">${rr}</span></button>`).join('');
    if (html !== lastRes) { resEl.innerHTML = html; lastRes = html; }
    if (tipKey && performance.now() < tipUntil) showTip(tipKey, false); else hideTip();
  }
  function showTip(k, restart = true) {
    const s = game.s;
    const c = cache(s);
    const r = rates(s);
    let h = '';
    if (k === 'pop') {
      h = `<div class="h">${resIcon('pop')} People ${s.pop} / ${s.housing} beds</div>
        <div class="m">${s.idle} without work. Newcomers arrive while there is food, a free bed, happiness above 40 and work for them.</div>
        ${s.popMode === 'grow' ? '<div class="m tw-pos">Settlers are arriving.</div>' : s.popMode === 'starve' ? '<div class="m tw-neg">People are starving and leaving!</div>' : s.popMode === 'over' ? '<div class="m tw-neg">Not enough beds: people are leaving.</div>' : s.pop >= s.housing ? '<div class="m">Every bed is taken: build Houses.</div>' : s.idle > IDLE_ALLOWANCE(s.pop) ? '<div class="m">Too many idle hands: newcomers want work, so build workplaces.</div>' : ''}`;
    } else if (k === 'happy' || k === 'sad') {
      h = `<div class="h">${resIcon(k)} Happiness ${Math.round(s.happy)}</div><div class="m">Services in range lift homes; hunger, unmet needs and nearby industry lower them. Below 40 nobody new comes; below 30 people leave.</div>`;
    } else {
      const v = s.res[k] || 0;
      h = `<div class="h">${resIcon(k)} ${RES_INFO[k].name} ${fmt(v)} / ${fmt(c.caps[k])}</div><div class="m">${fmtRate(r[k])} per minute right now.${v >= c.caps[k] - 0.5 ? ' Storage is full: build a Warehouse or sell some.' : ''}</div>`;
    }
    tipEl.innerHTML = h;
    tipEl.classList.add('show');
    if (restart) { tipKey = k; tipUntil = performance.now() + 4000; }
  }
  function hideTip() { tipEl.classList.remove('show'); tipKey = null; }

  // ---------- Goal pill ----------
  function renderGoal() {
    const s = game.s;
    const g = currentGoal(s);
    const n = goalEl.querySelector('.n'), p = goalEl.querySelector('.p'), bar = goalEl.querySelector('.bar');
    if (!g) { n.textContent = s.charter ? 'Chartered town' : 'All goals done'; p.textContent = `Day ${dayOf(s)}`; bar.style.transform = 'scaleX(1)'; return; }
    const pr = goalProgress(s, g);
    n.textContent = (s.mi < MILESTONES.length ? '' : 'Endless: ') + g.name;
    const frac = Math.max(0, Math.min(1, pr.need ? pr.cur / pr.need : 0));
    p.textContent = g.check.kind === 'all' ? `${pr.cur} of ${pr.need} parts · Day ${dayOf(s)}` : g.check.kind === 'charter' ? `${s.pop}/${charterPop(s)} people · Day ${dayOf(s)}` : `${fmt(pr.cur)} / ${fmt(pr.need)} · Day ${dayOf(s)}`;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(3)})`;
  }

  function renderSpeed() {
    root.querySelectorAll('[data-a="speed"]').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === game.speed));
  }

  // ---------- Toasts ----------
  function toast(text, kind = 'info', html = false) {
    const t = document.createElement('button');
    t.className = `tw-toast ${kind}`;
    t.dataset.a = 'toast';
    if (html) t.innerHTML = text; else t.textContent = text;
    toastsEl.prepend(t);
    while (toastsEl.children.length > 3) toastsEl.lastChild.remove();
    later(() => { t.classList.add('out'); later(() => t.remove(), 320); }, kind === 'mile' ? 6500 : 5000);
  }
  function flash() { flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go'); }

  // ---------- Build tray ----------
  function renderTray(force) {
    const s = game.s;
    if (!s) return;
    const sig = [tab, s.tier, game.mode, game.placeType, trayHidden, ...BUILD_ORDER.map((t) => canAfford(s, BUILDINGS[t].cost) ? 1 : 0), [...newTabs].join()].join('|');
    if (!force && sig === lastTray) return;
    lastTray = sig;
    tabsEl.innerHTML = CATEGORIES.map((c) => `<button class="tw-tab ${c.id === tab && !trayHidden ? 'on' : ''}" data-a="tab" data-v="${c.id}">${c.name}${newTabs.has(c.id) ? '<i class="dot"></i>' : ''}</button>`).join('') +
      `<button class="tw-tab hide" data-a="hideTray" aria-label="${trayHidden ? 'Show' : 'Hide'} build menu">${trayHidden ? uiIcon('hammer') : uiIcon('close', 'sm')}</button>`;
    cardsEl.style.display = trayHidden ? 'none' : '';
    if (trayHidden) { cardsEl.innerHTML = ''; return; }
    cardsEl.innerHTML = BUILD_ORDER.filter((t) => BUILDINGS[t].cat === tab).map((t) => {
      const d = BUILDINGS[t];
      const locked = d.tier > s.tier;
      const sel = game.mode === 'place' && game.placeType === t;
      return `<button class="tw-card ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}" data-a="card" data-t="${t}">
        <img src="${game.thumbs[t + ':1']}" alt="">
        <span class="nm">${esc(d.name)}</span>
        ${locked ? `<span class="lk">${uiIcon('lock', 'sm')}</span><span class="tw-costs"><span>Tier ${d.tier}</span></span>` : costHTML(d.cost, s)}
      </button>`;
    }).join('');
  }

  // ---------- Placement bar ----------
  function placePreview(s, type, i) {
    const d = BUILDINGS[type];
    const c = cache(s);
    const x = i % s.W, y = (i / s.W) | 0;
    const lines = [];
    if (d.cycle) {
      const sm = siteMult(s, c, type, x, y, true);
      const k = 60 / d.cycle * (d.site ? sm.mult : 1);
      const outs = Object.entries(d.out).map(([r, n]) => ioHTML(r, n * k)).join('');
      const ins = Object.entries(d.in || {}).map(([r, n]) => ioHTML(r, n * 60 / d.cycle)).join('');
      lines.push(`<div class="tw-flow">${ins ? ins + uiIcon('arrow', 'sm') : ''}${outs}${d.site ? `<small class="tw-big">${Math.round(sm.mult * 100)}% site</small>` : ''}</div>`);
      if (sm.notes.length) lines.push(`<div class="ok2">${esc(sm.notes.join(' · '))}</div>`);
    } else if (type === 'house') {
      const h = dwellingHappy(s, c, { type: 'house', x, y, eff: 1, level: 1, damaged: false });
      const cov = ['well', 'market', 'tavern', 'shrine'].filter((k) => c.cov[k][i]).map((k) => BUILDINGS[k].name);
      lines.push(`<div class="ok2">Beds for 4 · happiness about ${Math.round(h)}${cov.length ? ' · near ' + cov.join(', ') : ''}${c.noise[i] ? ' · noisy spot' : ''}</div>`);
    } else if (d.service) {
      let homes = 0;
      forDisc(s, x, y, d.radius, (nx, ny, j) => { const id = c.occ[j]; if (id >= 0 && c.byId.get(id).type === 'house') homes++; });
      lines.push(`<div class="ok2">Reaches ${homes} home${homes === 1 ? '' : 's'} within ${d.radius} tiles</div>`);
    } else if (d.storage) lines.push(`<div class="ok2">+${STORAGE_WAREHOUSE} storage for every good · build reach ${d.reach} tiles</div>`);
    if (d.noise) {
      let homes = 0;
      forDisc(s, x, y, 2, (nx, ny, j) => { const id = c.occ[j]; if (id >= 0 && c.byId.get(id).type === 'house') homes++; });
      if (homes) lines.push(`<div class="why">Noisy: ${homes} home${homes === 1 ? '' : 's'} nearby will be less happy</div>`);
    }
    if (d.workers) lines.push(`<div class="ok2">${resIcon('worker', 'sm')} Needs ${d.workers} worker${d.workers > 1 ? 's' : ''} · ${s.idle} idle now</div>`);
    return lines.join('');
  }
  function renderConfirm(force) {
    const s = game.s;
    if (game.mode !== 'place' || !s) { confirmEl.classList.remove('show'); lastConfirm = ''; hintEl.classList.remove('show'); return; }
    const type = game.placeType, d = BUILDINGS[type];
    const i = game.placeTile;
    let html;
    if (i < 0) {
      html = `<div class="hd"><img src="${game.thumbs[type + ':1']}" alt=""><div class="tx"><b>${esc(d.name)}</b>${esc(d.desc)}</div></div>
        <div class="tw-acts"><button class="tw-btn" data-a="cancelPlace">Done</button></div>`;
      hintEl.textContent = 'Tap a glowing tile';
      hintEl.classList.add('show');
    } else {
      hintEl.classList.remove('show');
      const x = i % s.W, y = (i / s.W) | 0;
      const p = canPlace(s, type, x, y);
      const afford = canAfford(s, d.cost);
      html = `<div class="hd"><img src="${game.thumbs[type + ':1']}" alt=""><div class="tx"><b>${esc(d.name)}</b>${p.ok ? placePreview(s, type, i) : ''}</div></div>
        ${p.ok ? '' : `<div class="why">${esc(p.reason)}</div>`}
        ${p.ok && !afford ? '<div class="why">Not enough materials yet</div>' : ''}
        ${p.ok && s.terrain[i] === T.FOREST ? '<div class="ok2">Clearing the trees gives 3 wood.</div>' : ''}
        <div class="tw-acts"><button class="tw-btn" data-a="cancelPlace">Done</button>
        <button class="tw-btn primary col" data-a="build" ${p.ok && afford ? '' : 'disabled'}><span>${uiIcon('hammer', 'sm')} Build</span>${costHTML(d.cost, s)}</button></div>`;
    }
    if (force || html !== lastConfirm) { confirmEl.innerHTML = html; lastConfirm = html; }
    confirmEl.classList.add('show');
  }

  // ---------- Info sheet ----------
  function sheetHTML(s, i) {
    const c = cache(s);
    const x = i % s.W, y = (i / s.W) | 0;
    const id = c.occ[i];
    if (id < 0) return tileHTML(s, i, x, y);
    const b = c.byId.get(id);
    const d = BUILDINGS[b.type];
    const lvName = d.levels ? d.levels[b.level - 1].name : b.level >= 2 ? `${d.name} II` : d.name;
    const thumbKey = b.type + ':' + (d.levels ? b.level : 1);
    let h = `<div class="tw-sh-head"><img src="${game.thumbs[thumbKey]}" alt=""><div class="ttl"><b>${esc(lvName)}</b><span>${esc(d.levels ? 'House' : d.cat === 'homes' ? 'Service' : CATEGORIES.find((k) => k.id === d.cat).name)}${b.prio ? ' · ★ priority' : ''}</span></div>
      <button class="tw-btn" data-a="sheetClose" aria-label="Close">${uiIcon('close')}</button></div>`;
    // Status line.
    let [cls, text] = STATUS_TEXT[b.status] || ['', ''];
    if (b.status === 'build') text = `Under construction ${Math.floor(b.prog * 100)}%`;
    if (b.status === 'idle' && d.workers) text = `No workers: needs ${maxWorkers(b)}, ${s.idle} idle in town`;
    if (b.status === 'idle' && d.site && (c.site.get(b.id) ?? 1) < 0.05) text = 'Nothing left to gather here';
    if (b.status === 'input') {
      const miss = Object.keys(d.in || {}).filter((k) => (s.res[k] || 0) < d.in[k]);
      text = d.ale ? 'Out of ale: brew some at a Brewery' : `Waiting for ${miss.map((k) => RES_INFO[k].name.toLowerCase()).join(' and ')}`;
    }
    if (b.status === 'full') text = d.plants ? 'No free meadow left to plant' : `Storage full for ${Object.keys(d.out || {}).map((k) => RES_INFO[k].name.toLowerCase()).join(', ')}`;
    if (d.levels && isComplete(b)) {
      const unmet = needsUnmet(s, b, b.level);
      if (b.eff < b.level) text = `Needs ${unmet.join(', ')}: living as a ${d.levels[b.eff - 1].name}`;
      else if (b.grace < HOUSE_GRACE) text = `Needs ${unmet.join(', ')}: ${Math.ceil(b.grace)}s before it downgrades`;
      else if (b.status === 'ok') text = 'All needs met';
    }
    if (b.type === 'townhall') { cls = 'ok'; text = 'The heart of the colony'; }
    if (text) h += `<div class="tw-status ${cls}">${esc(text)}</div>`;

    // Workers.
    if (d.workers) {
      const mw = maxWorkers(b);
      h += `<div class="tw-kv"><span>${resIcon('worker', 'sm')} Workers</span><span><span class="tw-dots">${Array.from({ length: mw }, (_, k) => `<i class="${k < b.workers ? 'f' : ''}"></i>`).join('')}</span> ${b.workers}/${mw}</span></div>`;
    }
    // Production.
    if (d.cycle && isComplete(b)) {
      const p = prodPerMin(s, b);
      const full = prodPerMin(s, b, 1);
      const ins = Object.entries(p.in).map(([k, n]) => ioHTML(k, n)).join('');
      const outs = Object.entries(p.out).map(([k, n]) => ioHTML(k, n)).join('');
      h += `<div class="tw-sec"><h4>Production</h4><div class="tw-flow">${ins ? ins + uiIcon('arrow', 'sm') : ''}${outs}</div>`;
      if (p.eff < 1) h += `<div class="tw-note">Fully staffed: ${Object.entries(full.out).map(([k, n]) => `${n.toFixed(1)} ${RES_INFO[k].name.toLowerCase()}`).join(', ')} a minute</div>`;
      if (d.site) h += `<div class="tw-note">Site ${Math.round((c.site.get(b.id) ?? 1) * 100)}%: ${esc(siteMult(s, c, b.type, b.x, b.y, false).notes.join(' · '))}</div>`;
      const em = p.mult / ((c.site.get(b.id) ?? 1) * (b.level >= 2 && d.up ? d.up.rate || 1 : 1));
      if (Math.abs(em - 1) > 0.01) h += `<div class="tw-note ${em > 1 ? 'tw-pos' : 'tw-neg'}">Events: ×${em.toFixed(2)} for now</div>`;
      h += `<div class="tw-prog"><i style="width:${Math.round(Math.min(1, b.work) * 100)}%"></i></div></div>`;
    }
    if (d.plants) h += `<div class="tw-sec"><h4>Forestry</h4><div class="tw-note">Plants a tree on free meadow within ${d.plants} tiles every ${b.level >= 2 ? 12 : 20} seconds while staffed.</div></div>`;
    // House details.
    if (d.levels && isComplete(b)) {
      h += `<div class="tw-sec"><h4>Residents</h4><div class="tw-kv"><span>${resIcon('pop', 'sm')} Living here</span><span>${b.res} / ${b.cap ?? d.levels[b.eff - 1].cap}</span></div>`;
      h += `<div class="tw-kv"><span>${resIcon('gold', 'sm')} Taxes</span><span>${(b.res * d.levels[Math.max(0, b.eff - 1)].tax).toFixed(1)} a minute</span></div></div>`;
      const next = b.level < 3 ? b.level + 1 : 3;
      const showLv = [b.level, next].filter((v, k, a) => a.indexOf(v) === k && v >= 2);
      for (const lv of showLv) {
        const L = d.levels[lv - 1];
        const unmet = needsUnmet(s, b, lv, lv > b.level);
        h += `<div class="tw-sec"><h4>${lv > b.level ? 'To become a ' : ''}${L.name} needs</h4><div class="tw-needs">${L.needs.map((n) => {
          const label = n === 'cloth' ? 'Cloth supply' : BUILDINGS[n].name + ' in range';
          const met = !unmet.includes(n === 'cloth' ? 'cloth' : BUILDINGS[n].name);
          return `<span class="tw-need ${met ? 'met' : ''}">${met ? uiIcon('check', 'sm') : uiIcon('close', 'sm')}${label}</span>`;
        }).join('')}</div></div>`;
      }
      const hb = happyBreakdown(s, b);
      h += `<div class="tw-sec"><h4>Happiness ${Math.round(b.happy ?? 0)}</h4>${hb.map(([k, v]) => `<div class="tw-kv"><span>${esc(k)}</span><span class="${v > 0 && k !== 'Base' ? 'tw-pos' : v < 0 ? 'tw-neg' : ''}">${v > 0 && k !== 'Base' ? '+' : ''}${v}</span></div>`).join('')}</div>`;
    }
    if (b.type === 'townhall') {
      h += `<div class="tw-sec"><div class="tw-kv"><span>${resIcon('pop', 'sm')} Founders housed</span><span>${b.res} / 6</span></div>
        <div class="tw-kv"><span>Forages</span><span class="tw-flow">${ioHTML('food', d.trickle.food)}${ioHTML('wood', d.trickle.wood)}</span></div>
        <div class="tw-kv"><span>Build reach</span><span>${reachOf(b)} tiles</span></div>
        <div class="tw-kv"><span>${resIcon('storage', 'sm')} Storage per good</span><span>${c.caps.food}</span></div></div>`;
    }
    if (d.service) {
      let homes = 0;
      forDisc(s, b.x, b.y, radiusOf(b), (nx, ny, j) => { const k = c.occ[j]; if (k >= 0 && c.byId.get(k).type === 'house') homes++; });
      h += `<div class="tw-sec"><div class="tw-kv"><span>${uiIcon('range', 'sm')} Range</span><span>${radiusOf(b)} tiles · ${homes} home${homes === 1 ? '' : 's'}</span></div>
        ${d.ale ? `<div class="tw-kv"><span>Pours</span><span class="tw-flow">${ioHTML('ale', d.ale)}</span></div>` : ''}
        ${b.type === 'well' ? '<div class="tw-note">Fires in range are put out before they spread.</div>' : ''}
        ${b.type === 'shrine' ? '<div class="tw-note">Halves fever losses among homes in range.</div>' : ''}</div>`;
    }
    if (d.storage) h += `<div class="tw-sec"><div class="tw-kv"><span>${resIcon('storage', 'sm')} Adds storage</span><span>+${STORAGE_WAREHOUSE * b.level} per good</span></div><div class="tw-kv"><span>Build reach</span><span>${reachOf(b)} tiles</span></div></div>`;
    if (b.type === 'dock') {
      const t = s.ship ? `${s.ship.name} in port, leaves in ${Math.ceil(s.ship.leave - s.t)}s` : s.nextShipAt > 0 ? `Next ship in about ${Math.max(0, Math.ceil(s.nextShipAt - s.t))}s` : 'Waiting for ships';
      h += `<div class="tw-sec"><div class="tw-note">${esc(t)}${b.workers ? '' : ' (needs dock workers)'}</div></div>`;
    }
    if (b.type === 'lighthouse') h += '<div class="tw-sec"><div class="tw-note">Ships call 30% more often with an extra deal, and storms wreck half as much.</div></div>';
    if (b.type === 'charter') h += `<div class="tw-sec"><div class="tw-note">${s.charter ? `Charter granted on day ${Math.floor(s.charter.t / 30) + 1}. Score ${s.charter.score}.` : 'When the hall is finished the charter is granted.'}</div></div>`;
    // Actions.
    const acts = [];
    const u = upgradeInfo(s, b);
    if (u) acts.push(`<button class="tw-btn ${u.ok ? 'primary' : ''} col" data-a="up" data-id="${b.id}" ${u.ok ? '' : 'disabled'}><span>${uiIcon('up', 'sm')} ${esc(u.name)}</span>${costHTML(u.cost, s)}${u.ok ? '' : `<small class="tw-big">${esc(u.reason)}</small>`}</button>`);
    if (b.damaged && !(b.fire > 0)) acts.push(`<button class="tw-btn warn col" data-a="repair" data-id="${b.id}"><span>${uiIcon('wrench', 'sm')} Repair</span>${costHTML(repairCost(b), s)}</button>`);
    if (d.workers && isComplete(b)) {
      acts.push(`<button class="tw-btn ${b.paused ? 'on' : ''}" data-a="pause" data-id="${b.id}">${b.paused ? uiIcon('play', 'sm') + ' Resume' : uiIcon('pause', 'sm') + ' Pause'}</button>`);
      acts.push(`<button class="tw-btn ${b.prio ? 'on' : ''}" data-a="prio" data-id="${b.id}">${uiIcon('star', 'sm')} Priority</button>`);
    }
    if (b.type !== 'townhall' && !(b.type === 'charter' && s.charter)) {
      const armed = demolishId === b.id && performance.now() < demolishArm;
      acts.push(`<button class="tw-btn danger" data-a="demolish" data-id="${b.id}">${uiIcon('trash', 'sm')} ${armed ? 'Tap again' : isComplete(b) ? 'Demolish' : 'Cancel build'}</button>`);
    }
    if (acts.length) h += `<div class="tw-acts">${acts.join('')}</div>`;
    h += `<div class="tw-note" style="margin-top:8px">${esc(d.desc)}</div>`;
    return h;
  }

  function tileHTML(s, i, x, y) {
    const c = cache(s);
    const t = s.terrain[i], dep = s.deposit[i];
    const name = TERRAIN_NAMES[t] + (dep ? ` · ${DEPOSIT_NAMES[dep]}` : '');
    let h = `<div class="tw-sh-head"><div class="ttl"><b>${esc(name)}</b><span>Tile ${x}, ${y}${c.reach[i] ? '' : ' · out of reach'}</span></div>
      <button class="tw-btn" data-a="sheetClose" aria-label="Close">${uiIcon('close')}</button></div>`;
    const blurb = {
      [T.DEEP]: 'Open sea. Ships come and go from here.',
      [T.SHALLOW]: 'Shallow water. Fishing huts on the shore net fish from it.',
      [T.SAND]: 'Sandy beach. Good for docks, fishing huts and most buildings.',
      [T.GRASS]: 'Open meadow. Farms need it, foresters plant here and sheep graze it.',
      [T.FOREST]: 'Woodland. Woodcutters and foragers work it; building here clears the trees.',
      [T.HILL]: 'Rolling hills. Quarries cut stone here, and sheep like it too.',
      [T.MOUNTAIN]: 'Bare crags, too steep to build on. They make nearby quarries richer.',
    }[t];
    const dblurb = dep === D.ORE ? ' An iron ore vein runs here: a Mine can dig it.' : dep === D.FERTILE ? ' The soil is rich: a Farm here yields half as much again.' : dep === D.FISH ? ' A shoal of fish: fishing huts within 2 tiles catch far more.' : '';
    h += `<div class="tw-note" style="font-size:13.5px">${esc(blurb + dblurb)}</div>`;
    if (!isWater(t)) {
      const ok = BUILD_ORDER.filter((ty) => BUILDINGS[ty].tier <= s.tier && canPlace(s, ty, x, y).ok);
      if (ok.length) {
        h += `<div class="tw-sec"><h4>Build here</h4><div class="tw-chips2">${ok.map((ty) => `<button class="tw-btn" data-a="placeHere" data-t="${ty}"><img src="${game.thumbs[ty + ':1']}" alt="">${esc(BUILDINGS[ty].name)}</button>`).join('')}</div></div>`;
      } else if (!c.reach[i]) h += '<div class="tw-status warn">Too far from the Town Hall. A Warehouse nearby extends your reach.</div>';
    }
    return h;
  }

  function renderSheet(force) {
    const s = game.s;
    if (!s || game.selTile < 0 || game.mode === 'place') { sheetEl.classList.remove('show'); trayEl.style.display = ''; lastSheet = ''; return; }
    if (!force && performance.now() - interactAt < 700) return;
    const html = sheetHTML(s, game.selTile);
    if (force || html !== lastSheet) {
      const st = sheetEl.scrollTop;
      sheetEl.innerHTML = html; lastSheet = html;
      sheetEl.scrollTop = st;
    }
    sheetEl.classList.add('show');
    trayEl.style.display = 'none';
  }

  // ---------- Modals ----------
  function showModal(kind, data = {}) {
    modal = { kind, ...data };
    lastModal = '';
    renderModal(true);
    modalEl.classList.add('show');
    modalEl.classList.toggle('center', kind === 'title' || kind === 'charter');
    game.onModal(true, kind);
  }
  function hideModal() {
    if (!modal) return;
    const k = modal.kind;
    modal = null;
    modalEl.classList.remove('show');
    game.onModal(false, k);
  }
  function renderModal(force) {
    if (!modal) return;
    if (!force && performance.now() - interactAt < 700) return;
    const html = modalHTML();
    if (force || html !== lastModal) {
      const st = mbox.scrollTop;
      const focused = document.activeElement && document.activeElement.classList.contains('tw-input');
      if (focused && !force) return;
      mbox.innerHTML = html; lastModal = html;
      mbox.scrollTop = st;
    }
  }
  function modalHTML() {
    const s = game.s;
    const k = modal.kind;
    const closeBtn = `<button class="tw-btn" data-a="closeModal" aria-label="Close">${uiIcon('close')}</button>`;
    if (k === 'title') {
      const sv = game.saveInfo();
      return `<div class="tw-title"><div class="logo">Tidewater</div><div class="sub">Settle a wild island. Grow a chartered town.</div></div>
        ${sv ? `<div class="tw-save"><b>${esc(sv.name)}</b><br>${esc(sv.line)}</div>` : ''}
        <div class="tw-col">
          ${sv ? `<button class="tw-btn primary" data-a="continue">${uiIcon('play')} Continue</button>` : ''}
          <button class="tw-btn ${sv ? '' : 'primary'}" data-a="newIsland">New island</button>
          <button class="tw-btn" data-a="m-help">How to play</button>
          <button class="tw-btn" data-a="backMenu">Back to menu</button>
        </div>`;
    }
    if (k === 'new') {
      const o = game.newOpts;
      const best = game.bests();
      return `<div class="tw-mhead"><h2>New island</h2></div>
        <div class="tw-save" style="margin-top:4px"><b>${esc(islandName(o.seed))}</b><br>Seed ${esc(o.seed)} · the island behind this card is a preview.</div>
        <h3>Size</h3><div class="tw-seg">${Object.entries(SIZES).map(([id, z]) => `<button class="tw-btn ${o.size === id ? 'on' : ''}" data-a="size" data-v="${id}">${z.name}</button>`).join('')}</div>
        <h3>Difficulty</h3><div class="tw-seg">${Object.entries(DIFFICULTY).map(([id, z]) => `<button class="tw-btn ${o.difficulty === id ? 'on' : ''}" data-a="diff" data-v="${id}">${z.name}</button>`).join('')}</div>
        <div class="tw-big" style="margin-top:6px">${esc(DIFFICULTY[o.difficulty].desc)} Charter at ${Math.round(SIZES[o.size].charterPop * (o.difficulty === 'gentle' ? 0.85 : o.difficulty === 'harsh' ? 1.1 : 1))} people.${best[o.difficulty] ? ` Best: ${best[o.difficulty].score}.` : ''}</div>
        <h3>Seed</h3><div class="tw-row"><input class="tw-input" data-in="seed" value="${esc(o.seed)}" maxlength="24" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="tw-btn" data-a="dice" aria-label="Random seed">${uiIcon('dice')}</button></div>
        <div class="tw-col"><button class="tw-btn primary" data-a="start">Settle ${esc(islandName(o.seed))}</button>
        <button class="tw-btn" data-a="newBack">Back</button></div>`;
    }
    if (k === 'menu') {
      return `<div class="tw-mhead"><h2>Paused</h2>${closeBtn}</div>
        <div class="tw-big">${esc(s.name)} · Day ${dayOf(s)} · ${s.pop} people · ${SIZES[s.size].name}, ${DIFFICULTY[s.difficulty].name}</div>
        <div class="tw-col">
          <button class="tw-btn primary" data-a="resume">${uiIcon('play')} Resume</button>
          <button class="tw-btn" data-a="m-goals">Goals and chronicle</button>
          <button class="tw-btn" data-a="m-help">How to play</button>
          <button class="tw-btn" data-a="m-new">New island</button>
          <button class="tw-btn" data-a="m-exit">Save and exit to menu</button>
        </div>`;
    }
    if (k === 'confirmNew') {
      return `<h2>Leave this island?</h2><p>Starting a new island replaces your saved game on ${esc(s.name)}.</p>
        <div class="tw-col"><button class="tw-btn danger" data-a="newIsland">Yes, find a new island</button><button class="tw-btn" data-a="closeModal">Keep playing</button></div>`;
    }
    if (k === 'help') {
      const p = modal.page || 0;
      const pg = HELP[p];
      return `<div class="tw-mhead"><h2>${esc(pg.t)}</h2>${closeBtn}</div>
        <div class="tw-help-ill">${pg.img.map((t) => `<img src="${game.thumbs[t]}" alt="">`).join('')}</div>
        ${pg.b.map((t) => `<p>${esc(t)}</p>`).join('')}
        <div class="tw-pdots">${HELP.map((_, i) => `<i class="${i === p ? 'on' : ''}"></i>`).join('')}</div>
        <div class="tw-pager"><button class="tw-btn" data-a="helpPrev" ${p === 0 ? 'disabled' : ''}>Back</button>
        ${p < HELP.length - 1 ? '<button class="tw-btn primary" data-a="helpNext">Next</button>' : '<button class="tw-btn primary" data-a="closeModal">Let’s go</button>'}</div>`;
    }
    if (k === 'goals') {
      const gt = modal.tab || 'goals';
      let body = '';
      if (gt === 'goals') {
        body = MILESTONES.map((m, i) => {
          const st = i < s.mi ? 'done' : i === s.mi ? 'cur' : 'later';
          let extra = '';
          if (i === s.mi) {
            const pr = goalProgress(s, m);
            if (m.check.kind === 'all') extra = pr.parts.map(([a, b2], j) => `<div class="tw-kv"><span>${esc(partLabel(m.check.of[j]))}</span><span>${fmt(a)} / ${fmt(b2)}</span></div>`).join('');
            else if (m.check.kind === 'charter') extra = `<div class="tw-kv"><span>People</span><span>${s.pop} / ${charterPop(s)}</span></div><div class="tw-kv"><span>Happiness</span><span>${Math.round(s.happy)} / ${CHARTER_HAPPY}</span></div>`;
            else extra = `<div class="tw-prog"><i style="width:${Math.min(100, Math.round(pr.cur / pr.need * 100))}%"></i></div><div class="tw-kv"><span></span><span>${fmt(pr.cur)} / ${fmt(pr.need)}</span></div>`;
          }
          const rw = Object.keys(m.reward).length ? `<div class="tw-kv"><span>Reward</span>${costHTML(m.reward)}</div>` : '';
          return `<div class="tw-mile ${st}"><div class="mk">${i < s.mi ? uiIcon('check', 'sm') : i + 1}</div><div class="bd"><b>${esc(m.name)}</b><span>${esc(m.text)}</span>${i >= s.mi ? rw : ''}${extra}</div></div>`;
        }).join('');
        if (s.endless && s.endless.goal) {
          const g = s.endless.goal, pr = goalProgress(s, g);
          body += `<h3>Endless goal ${s.endless.done + 1}</h3><div class="tw-mile cur"><div class="mk">∞</div><div class="bd"><b>${esc(g.name)}</b><span>${esc(g.text)}</span><div class="tw-prog"><i style="width:${Math.min(100, Math.round(pr.cur / pr.need * 100))}%"></i></div><div class="tw-kv"><span>Reward</span>${costHTML(g.reward)}</div></div></div>`;
        }
      } else if (gt === 'log') {
        body = `<div class="tw-log">${s.log.slice().reverse().map((l) => `<div class="${l.kind}"><span class="d">Day ${Math.floor(l.t / 30) + 1}</span>${esc(l.text)}</div>`).join('')}</div>`;
      } else {
        const best = game.bests();
        const counts = {};
        for (const b of s.buildings) counts[b.type] = (counts[b.type] || 0) + 1;
        body = `<div class="tw-kv"><span>Island</span><span>${esc(s.name)} (seed ${esc(s.seed)})</span></div>
          <div class="tw-kv"><span>Played</span><span>${minutesStr(s.t)} · day ${dayOf(s)}</span></div>
          <div class="tw-kv"><span>People</span><span>${s.pop} (peak ${s.stats.peakPop})</span></div>
          <div class="tw-kv"><span>Buildings</span><span>${s.buildings.length}</span></div>
          <div class="tw-kv"><span>Gold earned</span><span>${fmt(s.stats.goldEarned)}</span></div>
          <div class="tw-kv"><span>Trades</span><span>${s.stats.trades}</span></div>
          <div class="tw-kv"><span>Events weathered</span><span>${s.stats.events}</span></div>
          ${s.charter ? `<div class="tw-kv"><span>Charter score</span><span>${s.charter.score}</span></div>` : ''}
          <h3>Best charters</h3>
          ${Object.entries(DIFFICULTY).map(([id, z]) => `<div class="tw-kv"><span>${z.name}</span><span>${best[id] ? `${best[id].score} · ${esc(best[id].name)}` : '—'}</span></div>`).join('')}`;
      }
      return `<div class="tw-mhead"><h2>${gt === 'goals' ? 'Goals' : gt === 'log' ? 'Chronicle' : 'Records'}</h2>${closeBtn}</div>
        <div class="tw-tabs2">${[['goals', 'Goals'], ['log', 'Chronicle'], ['stats', 'Records']].map(([id, n]) => `<button class="tw-btn ${gt === id ? 'on' : ''}" data-a="gtab" data-v="${id}">${n}</button>`).join('')}</div>
        ${body}`;
    }
    if (k === 'trade') {
      const ship = s.ship;
      if (!ship) return `<div class="tw-mhead"><h2>The ship has sailed</h2>${closeBtn}</div><p>Another will call before long.</p>`;
      const rows = ship.deals.map((d, i) => {
        const can = Object.entries(d.give).every(([r, n]) => (s.res[r] || 0) >= n);
        const caps = cache(s).caps;
        const over = Object.entries(d.get).some(([r, n]) => (s.res[r] || 0) + n > caps[r]);
        return `<div class="tw-deal"><div class="sides">${costHTML(d.give, d.done ? null : s)}${uiIcon('arrow', 'sm')}${costHTML(d.get)}${over && !d.done ? '<small class="tw-big">(some will not fit)</small>' : ''}</div>
          <button class="tw-btn ${d.done ? '' : can ? 'primary' : ''}" data-a="deal" data-i="${i}" ${d.done || !can ? 'disabled' : ''}>${d.done ? 'Done' : 'Trade'}</button></div>`;
      }).join('');
      return `<div class="tw-mhead">${uiIcon('ship', 'lg')}<h2>The ${esc(ship.name)}</h2>${closeBtn}</div>
        <div class="tw-big">Out of ${esc(ship.port)} · sails in ${Math.max(0, Math.ceil(ship.leave - s.t))}s · you give → you get</div>${rows}
        <div class="tw-big" style="margin-top:8px">${resIcon('gold', 'sm')} ${fmt(s.res.gold)} in the treasury</div>`;
    }
    if (k === 'charter') {
      const ch = s.charter;
      const best = game.bests()[s.difficulty];
      return `<div class="tw-title"><div class="logo" style="font-size:30px">Royal Charter!</div><div class="sub">${esc(s.name)} is now a free town.</div></div>
        <div class="tw-score">${ch.score}</div>
        ${ch.parts.map(([n, v]) => `<div class="tw-kv"><span>${esc(n)}</span><span>${v}</span></div>`).join('')}
        <div class="tw-big" style="margin-top:6px;text-align:center">${best && best.score > ch.score ? `Best on ${DIFFICULTY[s.difficulty].name}: ${best.score}` : `A new best on ${DIFFICULTY[s.difficulty].name}!`}</div>
        <div class="tw-col"><button class="tw-btn primary" data-a="endless">Keep building (endless)</button>
        <button class="tw-btn" data-a="m-new">New island</button><button class="tw-btn" data-a="m-exit">Exit to menu</button></div>`;
    }
    return '';
  }
  function partLabel(p) {
    switch (p.kind) {
      case 'pop': return 'People';
      case 'countAny': return 'Food buildings';
      case 'happy': return 'Happiness';
      case 'level': return 'Manors';
      default: return p.kind;
    }
  }

  // ---------- Events ----------
  function onClick(e) {
    const el = e.target.closest('[data-a]');
    if (!el || !root.contains(el)) return;
    const a = el.dataset.a;
    if (el.disabled) return;
    if (a !== 'chip') hideTip();
    const id = el.dataset.id ? Number(el.dataset.id) : -1;
    switch (a) {
      case 'menu': game.tap(); showModal('menu'); break;
      case 'speed': game.tap(); game.setSpeed(Number(el.dataset.v)); renderSpeed(); break;
      case 'goal': game.tap(); showModal('goals'); break;
      case 'chip': game.tap(); if (tipKey === el.dataset.k) hideTip(); else showTip(el.dataset.k); break;
      case 'tab': game.tap(); tab = el.dataset.v; trayHidden = false; newTabs.delete(tab); renderTray(true); break;
      case 'hideTray': game.tap(); trayHidden = !trayHidden; renderTray(true); break;
      case 'card': game.startPlace(el.dataset.t); break;
      case 'placeHere': game.startPlace(el.dataset.t, game.selTile); break;
      case 'sheetClose': game.tap(); game.select(-1); break;
      case 'up': case 'pause': case 'prio': case 'repair': game.act(a, id); break;
      case 'demolish':
        if (demolishId === id && performance.now() < demolishArm) { demolishId = -1; game.act('demolish', id); }
        else { demolishId = id; demolishArm = performance.now() + 3000; game.tap(); renderSheet(true); later(() => renderSheet(true), 3100); }
        break;
      case 'build': game.confirmBuild(); break;
      case 'cancelPlace': game.tap(); game.cancelPlace(); break;
      case 'ship': game.tap(); showModal('trade'); break;
      case 'deal': game.deal(Number(el.dataset.i)); renderModal(true); break;
      case 'toast': el.remove(); break;
      case 'closeModal': game.tap(); hideModal(); break;
      case 'resume': game.tap(); if (game.speed === 0) game.setSpeed(1); hideModal(); break;
      case 'm-goals': game.tap(); showModal('goals'); break;
      case 'm-help': game.tap(); showModal('help', { page: 0, back: modal && modal.kind }); break;
      case 'helpNext': game.tap(); modal.page++; renderModal(true); break;
      case 'helpPrev': game.tap(); modal.page = Math.max(0, modal.page - 1); renderModal(true); break;
      case 'gtab': game.tap(); modal.tab = el.dataset.v; renderModal(true); break;
      case 'm-new': game.tap(); if (game.live && !game.s.charter) showModal('confirmNew'); else game.openNew(); break;
      case 'newIsland': game.tap(); game.openNew(); break;
      case 'newBack': game.tap(); game.closeNew(); break;
      case 'size': game.tap(); game.setNewOpt('size', el.dataset.v); break;
      case 'diff': game.tap(); game.setNewOpt('difficulty', el.dataset.v); break;
      case 'dice': game.tap(); game.setNewOpt('seed', game.randomSeedStr()); break;
      case 'start': game.startNew(); break;
      case 'continue': game.continueGame(); break;
      case 'm-exit': case 'backMenu': game.exit(); break;
      case 'endless': game.tap(); game.endless(); hideModal(); break;
      default: break;
    }
  }
  let seedTimer = 0;
  function onInput(e) {
    const el = e.target;
    if (el.dataset.in === 'seed') {
      clearTimeout(seedTimer);
      const v = el.value.trim().slice(0, 24);
      seedTimer = setTimeout(() => { if (v) game.setNewOpt('seed', v, true); }, 450);
    }
  }
  function onKey(e) { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.in === 'seed') e.target.blur(); }
  const mark = () => { interactAt = performance.now(); };
  root.addEventListener('click', onClick);
  root.addEventListener('pointerdown', mark, true);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  // A tap on the dimmed backdrop closes dismissable modals.
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl && modal && ['goals', 'trade', 'help', 'menu'].includes(modal.kind)) { hideModal(); }
  });

  // ---------- Per-tick ----------
  function update() {
    const s = game.s;
    if (!s) return;
    renderRes();
    renderGoal();
    renderSpeed();
    if (s.ship && game.live) {
      shipBtn.classList.add('show');
      root.classList.add('has-ship');
      shipBtn.querySelector('.st').textContent = `${Math.max(0, Math.ceil(s.ship.leave - s.t))}s`;
    } else { shipBtn.classList.remove('show'); root.classList.remove('has-ship'); }
    renderTray(false);
    renderConfirm(false);
    renderSheet(false);
    if (modal && ['goals', 'trade', 'menu'].includes(modal.kind)) renderModal(false);
  }

  root.querySelector('.tw-top').style.visibility = '';
  function setHudVisible(v) {
    for (const q of ['.tw-top', '.tw-bottom', '.tw-toasts']) $(q).style.display = v ? '' : 'none';
    if (!v) { shipBtn.classList.remove('show'); hintEl.classList.remove('show'); }
  }

  return {
    update, toast, flash, showModal, hideModal, renderTray, renderSheet, renderConfirm, setHudVisible,
    get modalKind() { return modal ? modal.kind : null; },
    refreshModal() { renderModal(true); },
    refreshModalSoft() {
      if (!modal || modal.kind !== 'new') return;
      const n = islandName(game.newOpts.seed);
      const b = mbox.querySelector('.tw-save b'); if (b) b.textContent = n;
      const st = mbox.querySelector('[data-a="start"]'); if (st) st.textContent = 'Settle ' + n;
    },
    markNewTier(tier) {
      for (const t of BUILD_ORDER) if (BUILDINGS[t].tier === tier) newTabs.add(BUILDINGS[t].cat);
      renderTray(true);
    },
    dispose() {
      for (const h of timers) clearTimeout(h);
      clearTimeout(seedTimer);
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerdown', mark, true);
      root.removeEventListener('input', onInput);
      root.removeEventListener('keydown', onKey);
      root.remove();
    },
  };
}
