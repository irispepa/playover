// Everbrook HUD, build bar, panels and dialogs. Plain DOM; all game changes go through `g` (see index.js).
import { ICON, CAT_ICON } from './icons.js';
import { B, CATS, RES, RES_KEYS, ERAS, SERVICES, HOME_LEVELS, DISC, DISC_BY_ID, SEASONS, DAYS_PER_SEASON, PRICES, QUESTS } from './data.js';
import * as S from './sim.js';
import { idx } from './gen.js';

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v) => (v >= 10000 ? `${(v / 1000).toFixed(1)}k` : String(Math.floor(v)));
const TILE_ICON = {
  road: '<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M3 15c5-1 6-7 10-8s6 1 8 0v5c-3 1-5-1-8 0s-5 7-10 8z" fill="#c4a678"/><path d="M5 17c4-2 5-7 9-8s5 0 6 0" fill="none" stroke="#8d6f45" stroke-width="1.2" stroke-dasharray="2 2.5" stroke-linecap="round"/></svg>',
  field: '<svg viewBox="0 0 24 24" width="1em" height="1em"><rect x="3" y="5" width="18" height="15" rx="2.5" fill="#8d6b46"/><path d="M6 8v9M10 8v9M14 8v9M18 8v9" stroke="#e2b93a" stroke-width="2.2" stroke-linecap="round"/></svg>',
  clear: '<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M14 3l7 7-9 9H7l-4-4z" fill="#e08a7c"/><path d="M3 15l4 4h5l2-2-6-6z" fill="#f4e9d2"/><path d="M5 21h15" stroke="#7a6549" stroke-width="2" stroke-linecap="round"/></svg>',
};

export function costHtml(cost, s) {
  const parts = Object.entries(cost).map(([k, v]) => `<span class="${s && s.res[k] < v ? 'no' : ''}">${ICON[k]}${v}</span>`);
  return `<div class="eb-cost">${parts.join('') || '<span>Free</span>'}</div>`;
}

export function createUI(stage, g) {
  const root = el('div', 'eb');
  stage.ui.append(root);
  const top = el('div', 'eb-top'), side = el('div', 'eb-side'), bottom = el('div', 'eb-bottom'), toasts = el('div', 'eb-toasts');
  root.append(top, side, bottom, toasts);
  let modals = 0, titleEl = null, popEl = null;
  const tap = (node, fn) => { node.addEventListener('click', (e) => { e.stopPropagation(); fn(e); }); return node; };
  const accent = () => root.style.setProperty('--acc', ERAS[g.s ? g.s.era : 0].accent);

  // ---------- top ----------
  const bar = el('div', 'eb-bar');
  const menuBtn = tap(el('button', 'eb-ib', ICON.menu), () => { g.tap(); openMenu(); });
  menuBtn.setAttribute('aria-label', 'Menu');
  const title = tap(el('button', 'eb-panel eb-title'), () => { g.tap(); openChronicle(); });
  const speed = el('div', 'eb-panel eb-speed');
  const speedBtns = [ICON.pause, ICON.play, ICON.fast].map((ic, i) => tap(el('button', '', ic), () => { g.tap(); g.setSpeed(i === 2 && g.speed === 2 ? 3 : i); hud(); }));
  speedBtns.forEach((b, i) => b.setAttribute('aria-label', ['Pause', 'Play', 'Fast'][i]));
  speed.append(...speedBtns);
  bar.append(menuBtn, title, speed);
  const resRow = tap(el('div', 'eb-res'), () => { g.tap(); openStores(); });
  const quest = tap(el('button', 'eb-panel eb-quest'), () => { g.tap(); openChronicle(); });
  const note = tap(el('button', 'eb-panel eb-note'), () => { g.tap(); openEvent(); });
  top.append(bar, resRow, quest, note);

  // ---------- side ----------
  const mkSide = (icon, label, fn) => { const b = tap(el('button', 'eb-ib', icon), fn); b.setAttribute('aria-label', label); side.append(b); return b; };
  const lampBtn = mkSide(ICON.knowledge, 'Discoveries', () => { g.tap(); openDiscoveries(); });
  const festBtn = mkSide(ICON.culture, 'Festival', () => { g.tap(); openFestival(); });
  const storeBtn = mkSide(ICON.scales, 'Stores and trade', () => { g.tap(); openStores(); });
  const eyeBtn = mkSide(ICON.eye, 'Show what homes can reach', () => { g.tap(); toggleEyePop(); });
  mkSide(ICON.rotr, 'Turn the view', () => { g.tap(); g.view.controls.rotate(Math.PI / 2, true); });
  lampBtn.append(el('span', 'eb-sub'));
  festBtn.insertAdjacentHTML('beforeend', '<svg class="eb-ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22.5" fill="none" stroke="#e0708a" stroke-width="3" stroke-linecap="round" stroke-dasharray="141.4" stroke-dashoffset="141.4"/></svg>');

  let chips = {}, chipEra = -1;
  function buildChips() {
    const s = g.s;
    resRow.replaceChildren(); chips = {};
    const add = (k, icon) => { const c = el('div', 'eb-chip', `${icon}<span></span>`); chips[k] = c; resRow.append(c); };
    add('people', ICON.people); add('harmony', ICON.harmony);
    for (const k of RES_KEYS) if (RES[k].era <= s.era) add(k, ICON[k]);
    chipEra = s.era;
  }

  let lastQuest = null;
  function hud() {
    const s = g.s;
    if (!s) return;
    if (chipEra !== s.era) { buildChips(); accent(); }
    const e = ERAS[s.era];
    title.innerHTML = `<b class="eb-h">${e.name}</b><span>${SEASONS[S.season(s)]}, year ${S.year(s)}</span>`;
    speedBtns.forEach((b, i) => b.classList.toggle('on', i === Math.min(2, g.speed)));
    speedBtns[2].innerHTML = g.speed === 3 ? `${ICON.fast}` : ICON.fast;
    speedBtns[2].style.color = g.speed === 3 ? '#ffe9a8' : '';
    const d = s.d;
    chips.people.lastChild.innerHTML = `${d.pop}<small>/${d.room}</small>`;
    chips.harmony.lastChild.textContent = `${Math.round(s.harmony)}%`;
    chips.harmony.classList.toggle('low', s.harmony < 35);
    for (const k of RES_KEYS) {
      const c = chips[k]; if (!c) continue;
      const v = Math.floor(s.res[k]);
      if (c.dataset.v !== String(v)) {
        if (c.dataset.v !== undefined && Math.abs(v - +c.dataset.v) >= 5) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
        c.dataset.v = v; c.lastChild.textContent = fmt(v);
      }
      c.classList.toggle('full', k !== 'coin' && s.res[k] >= d.caps[k] - 0.5);
      c.classList.toggle('low', k === 'food' && (d.starving || (d.rate.food < 0 && s.res.food < d.pop * 0.5)));
    }
    const q = S.currentQuest(s);
    const qKey = q ? q.text : s.done ? 'done' : 'none';
    if (qKey !== lastQuest) {
      lastQuest = qKey;
      quest.innerHTML = q ? `<div class="ic">${ICON.book}</div><div><b>${esc(q.text)}</b><span>${esc(q.hint)}</span></div>`
        : `<div class="ic">${ICON.star}</div><div><b>${s.done ? 'The chronicle is complete' : 'The age awaits its wonder'}</b><span>${s.done ? 'Everbrook is yours to keep tending.' : 'Tap to see what this age still asks.'}</span></div>`;
    }
    const ev = S.eventDef(s);
    note.style.display = ev ? '' : 'none';
    if (ev && note.dataset.id !== ev.id) { note.dataset.id = ev.id; note.innerHTML = `${ICON.bell}<span>${esc(ev.title)}</span>`; }
    if (!ev) note.dataset.id = '';
    // side buttons
    lampBtn.querySelector('.eb-sub').textContent = fmt(s.knowledge);
    const canDisc = DISC.filter((x) => S.canDiscover(s, x.id)).length;
    setBadge(lampBtn, canDisc);
    const fc = S.festivalCost(s), fp = Math.min(1, s.culture / fc);
    festBtn.querySelector('circle').setAttribute('stroke-dashoffset', (141.4 * (1 - fp)).toFixed(1));
    festBtn.classList.toggle('eb-ready', fp >= 1);
    eyeBtn.classList.toggle('on', !!g.overlay);
    refreshAfford();
    if (selEl && g.sel) refreshSel();
  }
  function setBadge(btn, n) {
    let b = btn.querySelector('.eb-badge');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = el('span', 'eb-badge'); btn.append(b); }
    b.textContent = n;
  }

  // ---------- eye popover ----------
  function toggleEyePop() {
    if (popEl) { popEl.remove(); popEl = null; return; }
    const s = g.s;
    popEl = el('div', 'eb-panel eb-pop');
    const r = eyeBtn.getBoundingClientRect(), rr = root.getBoundingClientRect();
    const maxNeed = HOME_LEVELS[S.maxHomeLevel(s)].needs;
    const list = Object.keys(SERVICES).filter((k) => maxNeed.includes(k) || s.b.some((b) => B[b.type].service && B[b.type].service.type === k));
    if (!list.length) list.push('water');
    for (const k of list) {
      const b = tap(el('button', g.overlay === k ? 'on' : '', `<i style="background:${SERVICES[k].color}"></i>${SERVICES[k].name}`), () => { g.tap(); g.setOverlay(g.overlay === k ? null : k); popEl.remove(); popEl = null; hud(); });
      popEl.append(b);
    }
    if (g.overlay) popEl.append(tap(el('button', '', '<i></i>Hide'), () => { g.setOverlay(null); popEl.remove(); popEl = null; hud(); }));
    root.append(popEl);
    popEl.style.top = `${Math.max(8, r.top - rr.top - 10)}px`;
  }

  // ---------- build bar ----------
  const build = el('div', 'eb-panel eb-build');
  const tabs = el('div', 'eb-tabs'), items = el('div', 'eb-items');
  build.append(tabs, items);
  const info = el('div', 'eb-panel eb-info');
  let selEl = null;
  let cat = 'homes';
  const itemEls = new Map();
  const thumb = (type) => g.thumb(type === 'home' ? 'home:0:0' : type);
  const typesIn = (c) => Object.values(B).filter((d) => d.cat === c && d.era <= g.s.era).sort((a, b) => a.era - b.era);
  const isNew = (d) => S.unlocked(g.s, d.id) && !g.seen.has(d.id) && !g.s.d.n[d.id] && d.id !== 'home' && d.id !== 'road';

  function rebuildBar() {
    const s = g.s;
    if (!s) return;
    tabs.replaceChildren();
    for (const c of CATS) {
      const list = typesIn(c.id);
      if (!list.length) continue;
      const b = tap(el('button', c.id === cat ? 'on' : '', `${CAT_ICON[c.id]}${c.name}`), () => { g.tap(); cat = c.id; rebuildBar(); items.scrollLeft = 0; });
      if (list.some(isNew)) b.append(el('i', 'dot'));
      tabs.append(b);
    }
    items.replaceChildren(); itemEls.clear();
    const list = typesIn(cat).map((d) => d.id);
    if (cat === 'homes') list.splice(1, 0, 'clear');
    for (const id of list) {
      const d = B[id];
      const b = el('button', 'eb-item');
      if (id === 'clear') b.innerHTML = `<div class="tile">${TILE_ICON.clear}</div><b>Clear paths</b><div class="eb-cost"><span>Free</span></div>`;
      else {
        const open = S.unlocked(s, id);
        const pic = d.tile ? `<div class="tile">${TILE_ICON[id]}</div>` : `<img alt="" draggable="false" src="${thumb(id)}">`;
        b.innerHTML = `${pic}<b>${esc(d.name)}</b>${open ? costHtml(d.cost, s) : `<div class="eb-cost">${ICON.lock}&nbsp;${esc(DISC_BY_ID[d.disc].name)}</div>`}`;
        if (!open) b.classList.add('lock');
        if (isNew(d)) b.classList.add('new');
        if (d.wonder && s.d.n[id]) { b.classList.add('lock'); b.lastChild.innerHTML = 'Standing'; }
      }
      tap(b, () => {
        if (id !== 'clear' && !S.unlocked(s, id)) { g.tap(); openDiscoveries(d.disc); return; }
        if (d && d.wonder && s.d.n[id]) { g.tap(); const w = s.b.find((x) => x.type === id); g.select(w); g.view.controls.focus(w.x, w.y); return; }
        g.tap(); g.selectType(g.type === id ? null : id);
      });
      itemEls.set(id, b); items.append(b);
    }
    refreshAfford();
    refreshBottom();
  }
  function refreshAfford() {
    const s = g.s;
    for (const [id, b] of itemEls) {
      b.classList.toggle('on', g.type === id);
      if (id === 'clear' || !S.unlocked(s, id)) continue;
      const poor = !S.canAfford(s, B[id].cost);
      if (b.classList.contains('poor') !== poor) { b.classList.toggle('poor', poor); if (!(B[id].wonder && s.d.n[id])) b.lastChild.outerHTML = costHtml(B[id].cost, s); }
    }
  }

  // The strip above the build bar: what is being placed, and whether it fits where the ghost is.
  function refreshInfo() {
    if (!g.type) { info.remove(); return; }
    const s = g.s, id = g.type, d = B[id];
    let name = id === 'clear' ? 'Clear paths and fields' : d.name, text = '', cls = '';
    const acts = [];
    if (g.mode === 'paint') {
      text = id === 'clear' ? 'Drag over paths or fields to take them up.' : `${d.desc} Drag to draw; two fingers move the map.`;
    } else if (!g.ghost) text = `${d.desc} Tap the map to choose a spot.`;
    else {
      const chk = S.canPlace(s, id, g.ghost.x, g.ghost.y);
      if (!chk.ok) { text = chk.why; cls = 'why'; }
      else {
        const bo = S.bonusAt(s, d, g.ghost.x, g.ghost.y);
        const parts = bo.parts.filter((p) => p.amt > 0).map((p) => `+${Math.round(p.amt * 100)}% ${p.label}`);
        if (d.service) parts.push(`Reaches ${g.previewHomes} home${g.previewHomes === 1 ? '' : 's'}`);
        text = parts.join(' · ') || (d.bonus ? 'No bonus here. Look for a better spot.' : 'A fine spot.'); cls = parts.length ? 'plus' : '';
      }
      if (g.touch) { const b = tap(el('button', 'eb-btn', `${ICON.check}Build`), () => g.confirmPlace()); b.disabled = !chk.ok; acts.push(b); }
    }
    info.innerHTML = `<div class="txt"><b class="eb-h">${esc(name)}</b><p class="${cls}">${esc(text)}</p></div>`;
    const x = tap(el('button', 'eb-btn ghost', g.mode === 'paint' ? 'Done' : ICON.close), () => { g.tap(); g.selectType(null); });
    x.setAttribute('aria-label', 'Stop building');
    info.append(...acts, x);
    if (!info.isConnected) bottom.prepend(info);
  }

  // ---------- selection panel ----------
  function selContent() {
    const s = g.s, b = g.sel, d = B[b.type];
    const rows = [];
    const row = (a, v, cls = '') => rows.push(`<div class="${cls}"><span>${a}</span><span>${v}</span></div>`);
    let name = d.name, sub = d.desc, want = '', extra = '';
    const acts = [];
    if (b.type === 'home') {
      const L = HOME_LEVELS[b.lvl], ht = S.homeTarget(s, b);
      name = L.name; sub = `${b.pop} of ${L.cap} living here`;
      const i = idx(b.x, b.y);
      const needs = HOME_LEVELS[Math.min(HOME_LEVELS.length - 1, Math.max(1, ht.max))].needs;
      for (const n of needs) row(SERVICES[n].name, s.d.cover[n][i] ? 'In reach' : 'Out of reach', s.d.cover[n][i] ? 'good' : 'bad');
      if (s.d.beauty[i]) row('Pretty surroundings', 'Happier, pays more', 'good');
      if (ht.lack) {
        const next = HOME_LEVELS[ht.lack.level].name;
        want = ht.lack.service ? `Wants ${SERVICES[ht.lack.service].name.toLowerCase()} in reach to become a ${next}.`
          : `Wants ${RES[ht.lack.good].name.toLowerCase()} in the stores to become a ${next}.`;
      } else if (ht.target > b.lvl) want = `Growing into a ${HOME_LEVELS[b.lvl + 1].name}…`;
      else if (s.era < ERAS.length - 1) want = `As fine as a home can be in the ${ERAS[s.era].name}.`;
    } else if (d.wonder && b.stage < d.stages.length) {
      const cost = d.stages[b.stage];
      sub = `Stage ${b.stage + 1} of ${d.stages.length}. Bring materials to raise it.`;
      extra = `<div class="eb-meter"><i style="transform:scaleX(${b.stage / d.stages.length})"></i></div>`;
      for (const k in cost) row(RES[k].name, `${fmt(s.res[k])} / ${cost[k]}`, s.res[k] >= cost[k] ? 'good' : 'bad');
      const capShort = Object.keys(cost).find((k) => k !== 'coin' && cost[k] > s.d.caps[k]);
      if (capShort) want = `Your stores hold only ${s.d.caps[capShort]} ${RES[capShort].name.toLowerCase()}. Build more storehouses.`;
      const c = tap(el('button', 'eb-btn', `${ICON.up}Raise the next stage`), () => g.contribute());
      c.disabled = !S.canAfford(s, cost);
      acts.push(c);
    } else {
      const eff = b.eff ?? 0;
      if (d.wonder) sub = 'Complete. People come from far away to see it.';
      for (const k in d.out || {}) row(RES[k].name, `+${(d.out[k] * eff).toFixed(1)} a day`, 'good');
      for (const k in d.in || {}) row(`Uses ${RES[k].name.toLowerCase()}`, `${(d.in[k] * eff).toFixed(1)} a day`, s.res[k] < 1 ? 'bad' : '');
      if (d.knowledge) row('Knowledge', `+${(d.knowledge * eff).toFixed(1)} a day`, 'good');
      if (d.culture) row('Culture', `+${(d.culture * eff).toFixed(1)} a day`, 'good');
      if (d.farm) row('Fields tended', `${b.fields || 0} of ${d.farm.max}`, b.fields ? '' : 'bad');
      for (const p of S.bonusAt(s, d, b.x, b.y).parts) row(p.label, `+${Math.round(p.amt * 100)}%`, p.amt > 0 ? 'good' : '');
      if (d.service) row('Homes in reach', String(g.selHomes));
      if (d.storage) row('Storage', d.storage.all ? `+${d.storage.all} of each material` : `+${d.storage.food} food`);
      if (d.workers && s.d.ratio < 0.95) want = `Short of hands: the town fills ${Math.round(s.d.ratio * 100)}% of its jobs. More homes will help.`;
      const lackIn = Object.keys(d.in || {}).find((k) => s.res[k] < 1);
      if (lackIn) want = `Waiting for ${RES[lackIn].name.toLowerCase()}.`;
      if (d.farm && !b.fields) want = 'Sow fields within two tiles (Food tab).';
    }
    for (const o of S.upgradeOptions(s, b)) {
      const u = tap(el('button', 'eb-btn', `<span>Rebuild as ${esc(B[o.type].name)}</span>${costHtml(o.cost, s)}`), () => g.upgrade(o.type));
      u.disabled = !S.canAfford(s, o.cost);
      acts.push(u);
    }
    if (!d.wonder) {
      const r = el('button', 'eb-btn ghost', `${ICON.trash}Remove`);
      tap(r, () => { if (r.dataset.sure) g.removeSel(); else { r.dataset.sure = 1; r.className = 'eb-btn warn'; r.innerHTML = `${ICON.trash}Tap again to remove`; } });
      acts.push(r);
    }
    return { name, sub, rows: rows.join(''), want, extra, acts };
  }
  let selKey = '';
  function refreshSel(force) {
    const b = g.sel;
    if (!b) { if (selEl) { selEl.remove(); selEl = null; } return; }
    const c = selContent();
    const key = [b.id, b.type, b.lvl, b.stage, c.name, c.sub, c.rows, c.want, c.extra, c.acts.map((a) => a.disabled).join()].join('|');
    if (!force && key === selKey && selEl) return;
    if (!force && selEl && selEl.querySelector('[data-sure]')) return;
    selKey = key;
    const n = el('div', 'eb-panel eb-sel');
    n.innerHTML = `<div class="head"><img alt="" src="${g.thumb(g.keyOf(b))}"><div><b class="eb-h">${esc(c.name)}</b><span>${esc(c.sub)}</span></div></div>${c.extra}<div class="eb-rows">${c.rows}</div>${c.want ? `<div class="eb-want">${esc(c.want)}</div>` : ''}`;
    const x = tap(el('button', 'x', ICON.close), () => { g.tap(); g.select(null); });
    x.setAttribute('aria-label', 'Close');
    n.firstChild.append(x);
    if (c.acts.length) { const a = el('div', 'eb-acts'); a.append(...c.acts); n.append(a); }
    if (selEl) { n.style.animation = 'none'; selEl.replaceWith(n); } else bottom.append(n);
    selEl = n;
  }

  function refreshBottom() {
    refreshInfo();
    if (g.sel) { build.remove(); refreshSel(true); }
    else { if (selEl) { selEl.remove(); selEl = null; } if (!build.isConnected && !titleEl) bottom.append(build); }
    refreshAfford();
  }

  // ---------- toasts ----------
  function toast(html, cls = '') {
    const t = el('div', `eb-toast ${cls}`, html);
    toasts.append(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    t.addEventListener('animationend', () => t.remove());
  }
  function float(x, y, text) {
    const p = g.view.project(x, y, 0.9);
    if (p.behind) return;
    const f = el('div', 'eb-float', text);
    f.style.left = `${p.x}px`; f.style.top = `${p.y}px`;
    root.append(f);
    f.addEventListener('animationend', () => f.remove());
  }

  // ---------- dialogs ----------
  function modal({ title: t, sub = '', body, closable = true, onClose }) {
    if (popEl) { popEl.remove(); popEl = null; }
    const shade = el('div', 'eb-shade'), m = el('div', 'eb-panel eb-modal');
    shade.append(m);
    let open = true;
    const close = () => { if (!open) return; open = false; modals--; shade.remove(); onClose?.(); hud(); };
    if (t) {
      const head = el('div', 'eb-mhead', `<h2 class="eb-h">${esc(t)}</h2><div class="sub">${sub}</div>`);
      if (closable) { const x = tap(el('button', 'eb-ib', ICON.close), () => { g.tap(); close(); }); x.style.boxShadow = 'none'; x.setAttribute('aria-label', 'Close'); head.append(x); }
      m.append(head);
    }
    const b = el('div', 'eb-mbody');
    m.append(b);
    if (closable) shade.addEventListener('click', (e) => { if (e.target === shade) close(); });
    modals++;
    root.append(shade);
    const api = { body: b, close, head: m.firstChild, render() { b.replaceChildren(); body(b, api); } };
    api.render();
    return api;
  }
  const opt = (cls, html, fn) => tap(el('button', `eb-opt ${cls}`, html), fn);

  function openDiscoveries(focus) {
    const s = g.s;
    const m = modal({ title: 'Discoveries', body(b, api) {
      api.head.querySelector('.sub').innerHTML = `${ICON.knowledge}${fmt(s.knowledge)} <small style="color:var(--soft)">&nbsp;+${s.d.kRate.toFixed(1)}/day</small>`;
      if (!s.d.kRate && s.knowledge < 20) b.append(el('p', '', 'Knowledge comes from Story Circles and, later, scribes and schools (Lore tab). Spend it here to learn new things to build.'));
      for (let e = s.era; e >= 0; e--) {
        const list = DISC.filter((x) => x.era === e);
        if (e < s.era && list.every((x) => s.disc[x.id])) continue;
        b.append(el('h3', '', ERAS[e].name));
        for (const x of list) {
          const got = !!s.disc[x.id], can = S.canDiscover(s, x.id);
          const lackNeed = (x.needs || []).find((n) => !s.disc[n]);
          const what = x.unlocks.map((u) => B[u].name).join(', ');
          const tag = got ? ICON.check : lackNeed ? `${ICON.lock}` : `${ICON.knowledge}${x.cost}`;
          const o = opt(got ? 'got' : can ? 'can' : '', `<div class="txt"><b>${esc(x.name)}</b><span>${esc(x.desc)} ${lackNeed ? `Needs ${esc(DISC_BY_ID[lackNeed].name)} first.` : `Opens: ${esc(what)}.`}</span></div><div class="tag">${tag}</div>`, () => {
            if (got) return;
            if (!can) { g.sound('error'); return; }
            g.discover(x.id); api.render();
          });
          if (x.id === focus) { o.style.boxShadow = '0 0 0 3px var(--acc)'; requestAnimationFrame(() => o.scrollIntoView({ block: 'center' })); }
          b.append(o);
        }
      }
    } });
    return m;
  }

  function openChronicle() {
    const s = g.s, e = ERAS[s.era];
    modal({ title: 'Chronicle', sub: `${ICON.star}${S.legacy(s)}`, body(b) {
      b.append(el('h3', '', `${e.period} · year ${S.year(s)}`), el('p', '', esc(e.blurb)));
      b.append(el('h3', '', s.era < ERAS.length - 1 ? 'To enter the next age' : 'To complete the chronicle'));
      for (const gl of S.eraGoals(s)) b.append(el('div', `eb-goal ${gl.ok ? 'ok' : ''}`, `<i>${gl.ok ? ICON.check : ''}</i>${esc(gl.text)}${gl.want ? `<small>${Math.min(gl.have, gl.want)} / ${gl.want}</small>` : ''}`));
      const q = S.currentQuest(s);
      if (q) { b.append(el('h3', '', 'Next in the chronicle')); b.append(el('div', 'eb-want', `<b>${esc(q.text)}</b><br>${esc(q.hint)}`)); }
      b.append(el('h3', '', 'The town'));
      const st = el('div', 'eb-stats');
      const qs = S.questStats(s);
      st.innerHTML = `<div><b>${s.d.pop}</b><span>residents</span></div><div><b>${Math.round(s.harmony)}%</b><span>harmony</span></div><div><b>${Object.keys(s.disc).length} / ${DISC.length}</b><span>discoveries</span></div><div><b>${s.festivals}</b><span>festivals held</span></div><div><b>${Math.min(s.quest, QUESTS.length)} / ${QUESTS.length}</b><span>chronicle entries</span></div><div><b>${qs.lv[Math.min(6, S.maxHomeLevel(s))]}</b><span>${HOME_LEVELS[S.maxHomeLevel(s)].name.toLowerCase()}s</span></div>`;
      b.append(st);
    } });
  }

  function openStores() {
    const s = g.s;
    modal({ title: s.d.trade ? 'Stores & Trade' : 'Stores', sub: `${ICON.coin}${fmt(s.res.coin)}`, body(b, api) {
      api.head.querySelector('.sub').innerHTML = s.era >= 1 ? `${ICON.coin}${fmt(s.res.coin)}` : '';
      if (!s.d.trade && s.era >= 1) b.append(el('p', '', 'Build a Trading Post on the river bank to swap what you have too much of for what you lack.'));
      const grid = el('div', 'eb-store');
      for (const k of RES_KEYS) {
        if (RES[k].era > s.era || k === 'coin') continue;
        const r = s.d.rate[k], p = S.prices(s, k);
        grid.insertAdjacentHTML('beforeend', `<div>${ICON[k]}</div><div class="n"><b>${RES[k].name}</b><small>${fmt(s.res[k])} of ${s.d.caps[k]} · <span style="color:${r < -0.02 ? 'var(--bad)' : r > 0.02 ? 'var(--good)' : 'inherit'}">${r >= 0 ? '+' : ''}${r.toFixed(1)}/day</span></small></div>`);
        const mk = (label, amt, price) => {
          const bt = el('button', '', p ? `${label}<small>${amt > 0 ? '−' : '+'}${Math.round(Math.abs(amt) * price)} coin</small>` : '');
          if (!p) { bt.style.visibility = 'hidden'; return bt; }
          bt.disabled = amt > 0 ? (s.res.coin < price * 1 || s.res[k] >= s.d.caps[k] - 1) : s.res[k] < 1;
          return tap(bt, () => { if (g.trade(k, amt)) api.render(); });
        };
        grid.append(mk('Sell 10', -10, p ? p.sell : 0), mk('Buy 10', 10, p ? p.buy : 0));
      }
      b.append(grid);
      b.append(el('h3', '', 'People'));
      b.append(el('p', '', `${s.d.pop} residents with room for ${s.d.room}. ${s.d.jobs} jobs to fill${s.d.jobs > s.d.pop ? ', so workshops run slower until more people arrive' : ''}. Each resident eats a little every day.`));
    } });
  }

  function openFestival() {
    const s = g.s;
    if (!S.festivalReady(s)) {
      modal({ title: 'Festival', sub: `${ICON.culture}${fmt(s.culture)} / ${S.festivalCost(s)}`, body(b) {
        b.append(el('p', '', 'Culture gathers from story circles, shrines, gardens and theatres. When the ring is full, the town holds a festival and you choose what kind.'));
        b.append(el('div', 'eb-meter', `<i style="transform:scaleX(${Math.min(1, s.culture / S.festivalCost(s))})"></i>`));
        if (s.d.cRate > 0) b.append(el('p', '', `<br>At this pace, the next one is about ${Math.ceil((S.festivalCost(s) - s.culture) / s.d.cRate / DAYS_PER_SEASON)} seasons away.`));
      } });
      return;
    }
    const m = modal({ title: 'A festival!', body(b) {
      b.append(el('p', '', 'The whole town has put down its tools. What shall we celebrate?'));
      for (const f of S.festivalChoices(s)) b.append(opt('can', `<div class="txt"><b>${esc(f.name)}</b><span>${esc(f.desc)} ${esc(f.effect)}</span></div>`, () => { m.close(); g.festival(f.id, f.name); }));
    } });
  }

  function openEvent() {
    const s = g.s, ev = S.eventDef(s);
    if (!ev) return;
    const m = modal({ title: ev.title, body(b) {
      b.append(el('p', '', esc(ev.text)));
      ev.options.forEach((o, i) => {
        const gives = Object.entries(o.give || {}).map(([k, v]) => `${ICON[k] || ''}${v}`).join(' ');
        const gets = Object.entries(o.get || {}).map(([k, v]) => (k === 'pop' ? `${ICON.people}+${v}` : k === 'foodPct' ? `${ICON.food}+${Math.round(s.d.caps.food * v)}` : `${ICON[k] || ''}+${v}`)).join(' ');
        const bt = opt('can', `<div class="txt"><b>${esc(o.label)}</b></div><div class="tag">${gives} ${gets}</div>`, () => { m.close(); g.resolveEvent(i); });
        bt.disabled = !S.optionAffordable(s, o);
        b.append(bt);
      });
    } });
  }

  function splash({ over, name, per, text, thumbs = [], stats = '', button, onClose }) {
    const m = modal({ closable: false, onClose, body(b) {
      b.className = 'eb-mbody eb-splash';
      b.innerHTML = `<div class="over">${esc(over)}</div><h1 class="eb-h">${esc(name)}</h1><div class="per">${esc(per)}</div><p>${esc(text)}</p>${stats}`;
      if (thumbs.length) { const t = el('div', 'thumbs'); thumbs.forEach((k, i) => { const im = el('img'); im.src = thumb(k); im.alt = B[k].name; im.style.animationDelay = `${0.2 + i * 0.05}s`; t.append(im); }); b.append(t); }
      b.append(tap(el('button', 'eb-btn', esc(button)), () => { g.tap(); m.close(); }));
    } });
  }
  function openEra(era) {
    const e = ERAS[era];
    const news = Object.values(B).filter((d) => d.era === era && !d.tile).map((d) => d.id);
    splash({ over: era === 0 ? 'A new valley' : 'A new age dawns', name: e.name, per: e.period, text: e.blurb, thumbs: era === 0 ? [] : news, button: era === 0 ? 'Begin' : 'Onward' });
  }
  function openFinale() {
    const s = g.s;
    splash({ over: 'The chronicle is complete', name: 'Everbrook', per: `Founded ${S.year(s)} years ago by a handful of families`,
      text: 'From a hearth by the bend in the brook to a hall of iron and glass, and not one wall was ever built to keep anyone out.',
      stats: `<div class="eb-stats"><div><b>${S.legacy(s)}</b><span>legacy</span></div><div><b>${s.d.pop}</b><span>residents</span></div><div><b>${s.festivals}</b><span>festivals</span></div><div><b>${Math.round(s.harmony)}%</b><span>harmony</span></div></div>`,
      button: 'Keep tending the town' });
  }

  function openHelp() {
    modal({ title: 'How to play', body(b) {
      b.innerHTML = `<p><b>Place homes</b> and the things households want. Homes grow by themselves when fresh water, gathering places, markets and more are within reach. Paths carry those services further.</p>
<p><b>Mind the land.</b> Foragers and woodcutters like woodland, stonecutters and mines must touch the hills, kilns and fishers the water. The strip above the build bar shows the bonus for each spot.</p>
<p><b>Learn.</b> Story circles and schools make Knowledge. Spend it on Discoveries to open new buildings.</p>
<p><b>Celebrate.</b> Culture fills the festival ring. Each festival is a gift of your choosing.</p>
<p><b>Raise the wonder</b> of each age and grow the town to step into the next. There are six ages, no enemies and no hurry.</p>
<h3>Controls</h3><p>Drag to move, pinch to zoom, twist to turn. On a computer: drag, scroll wheel, right-drag or Q and E to turn, WASD to move, space to pause, Escape to cancel.</p>`;
    } });
  }

  function openMenu() {
    const m = modal({ title: 'Everbrook', body(b) {
      const add = (label, sub, fn, cls = '') => b.append(opt(cls, `<div class="txt"><b>${label}</b><span>${sub}</span></div>`, fn));
      add('Back to the valley', 'The town is saved as you go.', () => { g.tap(); m.close(); }, 'can');
      add('How to play', 'A short guide.', () => { g.tap(); m.close(); openHelp(); });
      const fresh = opt('', '<div class="txt"><b>Found a new valley</b><span>Start again somewhere else. This town will be lost.</span></div>', () => {
        if (!fresh.dataset.sure) { fresh.dataset.sure = 1; fresh.querySelector('b').textContent = 'Tap again to leave this town behind'; fresh.style.borderColor = 'var(--bad)'; return; }
        m.close(); g.newGame();
      });
      b.append(fresh);
      add('Back to Flight Games', 'Return to the collection.', () => { m.close(); g.exit(); });
    } });
  }

  function showTitle(saveLine) {
    for (const n of [top, side, bottom]) n.style.display = 'none';
    titleEl = el('div', 'eb-titlescr');
    titleEl.innerHTML = '<div class="logo"><h1 class="eb-h">Everbrook</h1><p>A peaceful town through six ages</p></div>';
    const hide = () => { titleEl.remove(); titleEl = null; for (const n of [top, side, bottom]) n.style.display = ''; };
    if (saveLine) titleEl.append(tap(el('button', 'eb-btn', `Continue<small>${esc(saveLine)}</small>`), () => { g.tap(); hide(); g.resume(); }));
    titleEl.append(tap(el('button', `eb-btn ${saveLine ? 'ghost' : ''}`, 'New valley'), () => { g.tap(); hide(); g.newGame(true); }));
    titleEl.append(tap(el('button', 'eb-btn ghost', 'Back to Flight Games'), () => g.exit()));
    root.append(titleEl);
  }

  return {
    hud, rebuildBar, refreshBottom, refreshInfo, toast, float, openEra, openFinale, openEvent, openDiscoveries, showTitle, accent,
    blocking: () => modals > 0 || !!titleEl,
    setCat(c) { cat = c; },
    closePop() { if (popEl) { popEl.remove(); popEl = null; } },
    dispose() { root.remove(); },
  };
}
