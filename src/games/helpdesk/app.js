// Patch & Kettle: the house hub and every flow around it (tickets, threads, improvements, days, Open Day).
import { randomSeed } from '../../shell/rng.js';
import { TENANTS, TENANT_BY_ID, FACTS, THREADS, THREAD_BY_ID, EVENTS, EVENT_BY_ID, UPGRADES, HATS, HAT_BY_ID, DECOR, QUIRKS, QUIRK_BY_ID, TITLES } from './data.js';
import { TYPES, TYPE_IDS, REPLIES } from './stories.js';
import * as S from './sim.js';
import { el, esc, makeScope, plural } from './dom.js';
import { icon } from './icons.js';
import { portrait, kettleSvg, EXTRA_LOOKS } from './art.js';
import { houseSvg, kettlePoint, HOUSE_W, HOUSE_H } from './house.js';
import { makeFx } from './fx.js';
import { makeMusic } from './music.js';
import { showGuide } from './guide.js';
import mountCables from './games/cables.js';
import { mountWifi, mountPrinter, mountReboot } from './games/hardware.js';
import { mountPassword, mountInbox, mountDiagnosis, mountVideocall } from './games/people.js';
import { mountCalendar, mountDesktop } from './games/desk.js';

const MOUNT = { cables: mountCables, wifi: mountWifi, printer: mountPrinter, reboot: mountReboot, password: mountPassword, inbox: mountInbox, diagnosis: mountDiagnosis, videocall: mountVideocall, calendar: mountCalendar, desktop: mountDesktop };
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const pickOf = (arr, n) => arr[Math.abs(n) % arr.length];

export function createApp(ctx) {
  const store = ctx.storage;
  const scope = makeScope();
  const root = el('<div class="pk"><div class="pk-sky"></div><div class="pk-screen-root"></div><div class="pk-toasts"></div><div class="pk-fxlayer"></div></div>');
  ctx.root.append(root);
  const main = root.querySelector('.pk-screen-root');
  const settings = { sfx: true, music: true, ...(store.get('settings', {}) || {}) };
  const fx = makeFx({ layer: root.querySelector('.pk-fxlayer'), toasts: root.querySelector('.pk-toasts'), scope, audio: ctx.audio, settings });
  const music = makeMusic({ isMuted: () => ctx.audio.isMuted() || !settings.music });
  const book = { runs: 0, best: 0, titles: {}, decor: {}, gifts: {}, hats: {}, threads: {}, events: {}, ...(store.get('book', {}) || {}) };
  let s = S.deserialize(store.get('save', null));
  let happy = new Set(), hubEls = null, sheets = 0, guide = null;

  const tap = (node, fn) => { scope.on(node, 'click', (e) => { e.stopPropagation(); fn(e); }); return node; };
  const btn = (cls, html, fn, sound = 'tap') => tap(el(`<button class="${cls}">${html}</button>`), () => { fx.sfx(sound); fn(); });
  const face = (id, size = 48, expr = 'smile') => portrait(TENANT_BY_ID[id].look, { size, expr, bg: '#ffe9b8' });
  const dayLabel = () => (s.day > S.CAMPAIGN_DAYS ? `Day ${s.day} · free play` : `Day ${s.day} · ${DAY_NAMES[(s.day - 1) % 5].slice(0, 3)}`);
  const startMusic = () => { if (settings.music && !ctx.audio.isMuted()) music.start(); };
  function howToPlay() {
    if (guide && guide.open) return;
    store.set('guideSeen', true);
    guide = showGuide(root, () => { guide = null; });
  }

  function save() {
    if (!s) return;
    for (const id of s.decor) book.decor[id] = 1;
    for (const id of s.gifts) book.gifts[id] = 1;
    for (const id of s.hats) book.hats[id] = 1;
    for (const id of s.threads) book.threads[id] = 1;
    for (const id of s.events) book.events[id] = 1;
    store.set('save', s); store.set('book', book);
    if (s.threads.length || s.ended) ctx.setBest(S.bestLabel(s));
  }

  // ---------- sheets ----------
  function sheet({ title, sub = '', mid = false, closable = true, onClose = null, tabs = null, cls = '' }) {
    const shade = el(`<div class="pk-shade ${mid ? 'mid' : ''}"><div class="pk-sheet ${cls}"></div></div>`);
    const box = shade.firstElementChild;
    let open = true;
    const close = () => { if (!open) return; open = false; sheets--; shade.remove(); if (onClose) onClose(); };
    if (title) {
      const head = el(`<div class="pk-shead"><div style="flex:1;min-width:0"><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div></div>`);
      if (closable) head.append(btn('pk-ibtn', icon('x', 22), close));
      box.append(head);
    }
    let tabBar = null;
    if (tabs) { tabBar = el('<div class="pk-tabs"></div>'); box.append(tabBar); }
    const body = el('<div class="pk-sbody"></div>');
    box.append(body);
    if (closable) tap(shade, (e) => { if (e.target === shade) close(); });
    sheets++;
    root.append(shade);
    return { body, close, box, tabBar, head: box.firstElementChild };
  }
  const costChip = (cur, n, ok = true) => `<span class="pk-cost ${cur === 'goodwill' ? 'gw' : cur === 'hours' ? 'hr' : ''} ${ok ? '' : 'no'}">${icon(cur === 'goodwill' ? 'heart' : cur === 'hours' ? 'clock' : 'coin', 15)}${n}</span>`;

  // ---------- the house ----------
  function view(extra = {}) {
    const bubbles = {};
    for (const t of s.board) {
      const b = bubbles[t.who] || (bubbles[t.who] = { type: t.type, age: 0, project: false, count: 0 });
      b.count++; b.age = Math.max(b.age, t.age); if (t.project) { b.project = true; b.type = t.type; }
    }
    // A few friends drop in on each other, different ones each day.
    const visitors = [], away = new Set();
    const order = s.threads.slice().sort((a, b) => ((a.length * 7 + s.day * 13 + a.charCodeAt(0)) % 11) - ((b.length * 7 + s.day * 13 + b.charCodeAt(0)) % 11));
    for (const id of order) {
      if (visitors.length >= 3) break;
      const th = THREAD_BY_ID[id], host = FACTS[th.a].t, who = FACTS[th.b].t;
      if (bubbles[host] || bubbles[who] || away.has(who) || away.has(host) || visitors.some((v) => v.host === host || v.host === who)) continue;
      visitors.push({ host, who }); away.add(who);
    }
    const canPet = s.phase === 'day' && S.petsLeft(s) > 0;
    return {
      bubbles, decor: new Set(s.decor), up: s.up, visitors, away, happy,
      kettle: { spot: s.kettle.spot, hat: s.hat, awake: canPet, canPet }, gifts: s.gifts, sam: !!s.up.volunteer, youExpr: s.hours <= 0 ? 'happy' : 'smile', focus: null, ...extra,
    };
  }

  function tipText() {
    if (s.phase !== 'day') return null;
    if (s.day === 1 && s.stats.solved === 0) return ['hand', 'Somebody has a problem. Tap a room with a speech bubble.'];
    if (S.hunches(s).length && s.hours >= 1 && s.stats.intros < 2) return ['threads', 'You know two things that fit together. Open Threads and introduce them.'];
    if (s.day === 1 && S.petsLeft(s) > 0) return ['paw', 'Kettle is on the warm server. Give him a pat.'];
    if (s.hours <= 0) return ['moon', 'You are out of hours. Call it a day; tomorrow brings more.'];
    if (!S.waiting(s) && s.hours > 0) return ['tea', 'All quiet. Have tea with a neighbour, or improve the house.'];
    if (s.day <= 2) return ['tea', 'Tap a room to have tea with someone and learn what they need.'];
    return null;
  }

  function hub() {
    startMusic();
    main.replaceChildren();
    const top = el('<div class="pk-top"></div>');
    const dayEl = el('<div class="pk-stat day"></div>'), hr = el('<div class="pk-stat hr"></div>'), bd = el('<div class="pk-stat bd"></div>'), gw = el('<div class="pk-stat gw"></div>');
    top.append(btn('pk-ibtn', icon('home', 22), menu), dayEl, hr, bd, gw);
    const mood = el(`<div class="pk-mood"><i></i>${icon('heart', 13)}<span></span></div>`);
    const wrap = el('<div class="pk-housewrap"></div>');
    const tip = el('<div class="pk-tip"></div>');
    const nav = el('<div class="pk-nav"></div>');
    const nb = (ic, label, fn, cls = '') => { const b = btn(`pk-navb ${cls}`, `${icon(ic, 24)}${label}`, fn); nav.append(b); return b; };
    const bBoard = nb('tickets', 'Board', board), bThreads = nb('threads', 'Threads', () => threads()), bImprove = nb('improve', 'Improve', () => improve()), bEnd = nb('moon', 'End day', endDay, 'end');
    main.append(top, mood, wrap, tip, nav);
    tap(wrap, (e) => {
      const hit = e.target.closest('[data-act]');
      if (!hit || sheets) return;
      const act = hit.dataset.act;
      if (act === 'room') { fx.sfx('tap'); room(hit.dataset.who); }
      else if (act === 'pet') pet();
      else if (act === 'nook') { fx.sfx('tap'); improve(); }
    });
    hubEls = { dayEl, hr, bd, gw, mood, wrap, tip, bBoard, bThreads, bImprove, bEnd, last: {} };
    render();
  }
  function render() {
    if (!hubEls || !hubEls.wrap.isConnected) return;
    const h = hubEls;
    const set = (node, key, val, html) => { if (h.last[key] !== undefined && h.last[key] !== val) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); } h.last[key] = val; node.innerHTML = html; };
    h.dayEl.innerHTML = `<b>${dayLabel()}</b><small>${s.day <= S.CAMPAIGN_DAYS ? `Open Day in ${S.OPEN_DAY - s.day}` : S.titleOf(s).name}</small>`;
    set(h.hr, 'hr', s.hours, `${icon('clock', 18)}${s.hours}<small>h</small>`);
    set(h.bd, 'bd', s.budget, `${icon('coin', 18)}${s.budget}`);
    set(h.gw, 'gw', s.goodwill, `${icon('heart', 18)}${s.goodwill}`);
    const m = S.moodOf(s);
    h.mood.firstElementChild.style.transform = `scaleX(${m / 100})`;
    h.mood.lastElementChild.textContent = `Cozy ${m}`;
    h.wrap.innerHTML = houseSvg(view());
    const badge = (b, n, cls = '') => { const old = b.querySelector('.pk-badge'); if (old) old.remove(); if (n) b.append(el(`<span class="pk-badge ${cls}">${n}</span>`)); };
    badge(h.bBoard, s.board.length);
    badge(h.bThreads, s.up.noticeboard ? S.hunches(s).length : 0, 'hunch');
    badge(h.bImprove, UPGRADES.filter((u) => S.canBuy(s, u.id)).length + TYPE_IDS.filter((t) => S.canWriteWiki(s, t)).length);
    const t = tipText();
    h.tip.style.display = t ? '' : 'none';
    if (t) h.tip.innerHTML = `${icon(t[0], 20)}<span>${t[1]}</span>`;
  }
  const refresh = () => { save(); render(); };

  function pet() {
    const r = S.pet(s);
    if (!r) { fx.sfx('meow'); fx.toast(s.phase === 'day' ? 'Kettle has had enough fuss for one day.' : 'Kettle is asleep.', 'cat'); return; }
    fx.sfx('purr');
    const svg = hubEls.wrap.querySelector('svg'), rc = svg.getBoundingClientRect(), k = kettlePoint(view());
    const sc = Math.min(rc.width / HOUSE_W, rc.height / HOUSE_H), ox = rc.left + (rc.width - HOUSE_W * sc) / 2, oy = rc.top + (rc.height - HOUSE_H * sc);
    fx.floater(`+${r.gw}`, ox + k.x * sc, oy + k.y * sc);
    fx.confetti(ox + k.x * sc, oy + k.y * sc, 8);
    fx.toast(r.hour ? 'Kettle purrs so warmly you find an extra hour in the day.' : 'Kettle allows it. Purring commences.', r.hour ? 'hour' : 'cat');
    refresh();
  }

  // ---------- rooms and tea ----------
  function factChip(f, extra = '') { const F = FACTS[f]; return `<span class="pk-fact ${F.kind} ${extra}"><i></i>${esc(F.text)}</span>`; }
  function room(id) {
    const T = TENANT_BY_ID[id], p = s.people[id];
    const sh = sheet({ title: T.full, sub: T.place });
    const draw = () => {
      const b = sh.body; b.replaceChildren();
      const mine = s.board.filter((t) => t.who === id);
      const head = el(`<div class="pk-talk" style="padding:0"><div class="who">${face(id, 72, mine.length ? 'wow' : 'happy')}<div><p>${esc(pickOf(T.greet, s.day + p.rel))}</p></div></div></div>`);
      b.append(head);
      if (mine.length) { b.append(el('<h3>Needs a hand</h3>')); mine.forEach((t) => b.append(ticketRow(t, () => { sh.close(); openTicket(t); }))); }
      b.append(el('<h3>What you know</h3>'));
      const chips = el('<div class="pk-chips"></div>');
      p.known.forEach((f) => chips.insertAdjacentHTML('beforeend', factChip(f)));
      const unk = S.unknownCount(s, id);
      if (unk) chips.insertAdjacentHTML('beforeend', `<span class="pk-chip">${p.known.length ? `${unk} more to learn` : 'Nothing yet. Have a tea together.'}</span>`);
      b.append(chips);
      if (p.gift) b.append(el(`<div class="pk-perk" style="margin-top:10px">${icon('gift', 20)}<span><b>${esc(T.gift.name)}</b><br>${esc(T.gift.desc)}</span></div>`));
      const cost = S.teaCost(s);
      const tb = btn('pk-btn wide', `${icon('tea', 20)} Tea break with ${esc(T.name)} ${costChip('hours', cost ? `${cost}h` : 'free')}`, () => {
        const r = S.tea(s, id);
        if (!r) return;
        fx.sfx('heart'); happy.add(id);
        const out = el('<div></div>');
        if (r.facts.length) r.facts.forEach((f) => { out.append(el(`<div class="pk-bub">${esc(FACTS[f].say)}</div>`), el(`<div class="pk-bub note">${icon('note', 18)}<span><small>Noted</small>${esc(FACTS[f].text)}</span></div>`)); });
        else out.append(el(`<div class="pk-bub">${esc(pickOf(T.thanks, s.day))} You already know all my secrets.</div>`));
        fx.toast(`+${r.gw} goodwill`, 'gw');
        refresh(); draw(); sh.body.prepend(out);
      }, 'pop');
      tb.style.marginTop = '12px';
      tb.disabled = !S.canTea(s, id);
      if (p.tea === s.day) tb.innerHTML = `${icon('tea', 20)} You have had tea today`;
      else if (tb.disabled) tb.innerHTML = `${icon('tea', 20)} No time for tea today`;
      b.append(tb);
    };
    draw();
  }

  // ---------- tickets ----------
  function ticketRow(t, fn) {
    const T = TENANT_BY_ID[t.who], cost = S.hoursFor(s, t);
    const b = btn(`pk-row ${t.age >= 1 ? 'old' : ''} ${t.project ? 'proj' : ''}`, `<div class="ic">${icon(t.project ? 'sparkle' : TYPES[t.type].icon, 24)}</div><div class="txt"><b>${esc(S.ticketTitle(t))}</b><span class="sub">${esc(T.name)}${t.age >= 1 ? ' · waiting since yesterday' : ''}${t.project ? ' · for a new thread' : ''}</span></div>${costChip('hours', cost ? `${cost}h` : 'quick', s.hours >= cost)}`, fn);
    return b;
  }
  function board() {
    const sh = sheet({ title: 'Ticket board', sub: `${plural(s.board.length, 'ticket')} · ${plural(s.hours, 'hour')} left today` });
    if (!s.board.length) sh.body.append(el(`<div class="pk-card">${kettleSvg('loaf', s.hat, 110)}<p style="font-weight:800">Nothing on the board. Kettle approves.</p></div>`));
    s.board.slice().sort((a, b) => b.age - a.age).forEach((t, i) => { const r = ticketRow(t, () => { sh.close(); openTicket(t); }); r.style.animationDelay = `${i * 0.04}s`; sh.body.append(r); });
    if (s.board.some((t) => t.age >= 1)) sh.body.append(el('<p style="font-size:12.5px;color:var(--soft);font-weight:700">Tickets left for two nights sort themselves out, a little less happily.</p>'));
    if (s.up.volunteer) sh.body.append(el(`<p style="font-size:12.5px;color:var(--soft);font-weight:700">Sam (level ${S.samLevel(s)}) can take ${plural(S.samLeft(s), 'more ticket')} today. Open a ticket to hand it over.</p>`));
  }
  function openTicket(t) {
    const T = TENANT_BY_ID[t.who], cost = S.hoursFor(s, t);
    const sh = sheet({});
    const body = el('<div class="pk-talk"></div>');
    sh.body.replaceWith(body);
    body.append(el(`<div class="who">${face(t.who, 72, t.age >= 1 ? 'worried' : 'wow')}<div><h2>${esc(T.name)}</h2><p>${esc(S.ticketTitle(t))} · ${esc(T.place)}</p></div></div>`));
    const lines = [pickOf(T.greet, t.id), ...S.ticketLines(t)];
    lines.forEach((l, i) => { const bub = el(`<div class="pk-bub">${esc(l)}</div>`); bub.style.animationDelay = `${i * 0.28}s`; body.append(bub); });
    fx.sfx('talk');
    const acts = el('<div class="pk-actions"></div>');
    acts.append(btn('pk-btn alt', 'Later', sh.close));
    const go = btn('pk-btn', cost ? `Let's fix it ${costChip('hours', `${cost}h`)}` : 'Restore it from the backup', () => { sh.close(); play(t); }, 'pop');
    go.disabled = s.hours < cost;
    if (go.disabled) go.textContent = 'Out of hours today';
    acts.append(go);
    body.append(acts);
    if (S.canDelegate(s, t)) {
      const d = btn('pk-btn alt wide', `${portrait(EXTRA_LOOKS.sam, { size: 30 })} Let Sam take this one`, () => {
        const r = S.delegate(s, t.id);
        if (!r) return;
        sh.close(); fx.sfx('good'); happy.add(t.who);
        fx.toast(`Sam sorted it for ${T.name}. +${r.pay} budget`, 'budget');
        if (r.levelUp) fx.toast(`Sam is getting good at this: level ${r.levelUp}.`, 'info');
        refresh();
      });
      d.style.marginTop = '8px';
      body.append(d);
    }
  }

  function play(t, testSpec = null) {
    const spec = testSpec || S.ticketPuzzle(s, t);
    if (import.meta.env.DEV) window.__pkSpec = spec;
    const ty = TYPES[spec.type];
    const frame = el(`<div class="pk-mg"><div class="pk-mg-in"><div class="pk-mg-head"></div><div class="pk-mg-host"></div><div class="pk-mg-say">${kettleSvg('sit', s ? s.hat : null, 44)}<span></span></div></div></div>`);
    const head = frame.querySelector('.pk-mg-head'), host = frame.querySelector('.pk-mg-host'), say = frame.querySelector('.pk-mg-say'), sayText = say.lastElementChild;
    const how = spec.type === 'desktop' && spec.mode === 'find' ? 'Find the file they lost.' : ty.how;
    const sub = makeScope();
    let misses = 0, hinted = false, over = false;
    const leave = () => { sub.dispose(); frame.remove(); };
    head.append(btn('pk-ibtn', icon('back', 22), leave));
    head.append(el(`<div style="flex:1;min-width:0"><h2>${esc(t ? S.ticketTitle(t) : ty.name)}</h2><p>${esc(how)}</p></div>`));
    sayText.textContent = how;
    const api = {
      scope: sub, sfx: fx.sfx, pop: (x, y, n) => fx.confetti(x, y, n), who: t ? TENANT_BY_ID[t.who] : TENANTS[0],
      miss() { misses++; },
      say(text) { sayText.textContent = text; say.classList.remove('flash'); void say.offsetWidth; say.classList.add('flash'); },
      done() {
        if (over) return; over = true;
        fx.sfx('win'); fx.confetti(null, null, 34);
        sub.timeout(() => { leave(); if (t) afterFix(t, misses === 0 && !hinted); }, 700);
      },
    };
    root.append(frame);
    const game = MOUNT[spec.type](host, spec, api);
    head.append(btn('pk-hintb', `${icon('paw', 18)} Hint`, () => { hinted = true; if (game && game.hint) game.hint(); }, 'meow'));
    scope.add(() => sub.dispose());
  }

  function afterFix(t, clean) {
    const T = TENANT_BY_ID[t.who];
    const sh = sheet({ mid: true, closable: false });
    const body = el('<div class="pk-talk" style="padding:16px"></div>');
    sh.body.replaceWith(body);
    body.append(el(`<div class="who">${face(t.who, 72, 'happy')}<div><h2>Fixed!</h2><p>${clean ? 'A clean fix: no slips, no hints.' : 'All sorted.'}</p></div></div>`));
    body.append(el(`<div class="pk-bub">${esc(pickOf(T.thanks, t.id))}</div>`));
    const reps = el('<div class="pk-replies"></div>');
    const opts = [['kind', 'heart', 'Kind', pickOf(REPLIES.kind, t.id), '+2 goodwill'], ['funny', 'sparkle', 'Funny', REPLIES.funny[t.type], '+1 goodwill, and a laugh'], ['practical', 'note', 'Practical', REPLIES.practical[t.type], '+1 note towards a wiki page']];
    opts.forEach(([id, ic, label, text, effect], i) => {
      const b = btn('pk-reply', `<small>${icon(ic, 13)}${label} · ${effect}</small>${esc(text)}`, () => finish(id, text), 'pop');
      b.style.animationDelay = `${0.2 + i * 0.07}s`;
      reps.append(b);
    });
    body.append(reps);
    function finish(reply, text) {
      const res = S.completeTicket(s, t.id, { reply, clean });
      if (!res) { sh.close(); refresh(); return; }
      happy.add(t.who);
      reps.remove();
      body.append(el(`<div class="pk-bub me">${esc(text)}</div>`), el(`<div class="pk-bub">${esc(pickOf(REPLIES.response[reply], t.id + s.day))}</div>`));
      const rw = el('<div class="pk-rewards"></div>');
      if (res.pay) rw.insertAdjacentHTML('beforeend', costChip('budget', `+${res.pay}`));
      rw.insertAdjacentHTML('beforeend', costChip('goodwill', `+${res.gw}`));
      if (res.notes) rw.insertAdjacentHTML('beforeend', `<span class="pk-cost">${icon('note', 15)}+${res.notes} ${res.notes === 1 ? 'note' : 'notes'}</span>`);
      body.append(rw);
      if (res.rescued) body.append(el(`<div class="pk-bub note">${icon('cloud', 18)}<span>The nightly backup had it all along. No time lost.</span></div>`));
      if (res.fact) body.append(el(`<div class="pk-bub">${esc(FACTS[res.fact].say)}</div>`), el(`<div class="pk-bub note">${icon('note', 18)}<span><small>Noted about ${esc(T.name)}</small>${esc(FACTS[res.fact].text)}</span></div>`));
      if (res.gift) body.append(el(`<div class="pk-perk">${icon('gift', 20)}<span><b>A gift: ${esc(res.gift.name)}</b><br>${esc(res.gift.desc)}</span></div>`));
      if (res.hat) body.append(el(`<div class="pk-perk">${icon('hat', 20)}<span><b>For Kettle: ${esc(res.hat.name)}</b><br>${esc(res.hat.desc)}</span></div>`));
      if (res.wikiReady) body.append(el(`<div class="pk-perk">${icon('book', 20)}<span><b>You know this one by heart now.</b><br>Write it up as a wiki page under Improve, and fewer of these will come in.</span></div>`));
      if (res.gift || res.hat) fx.sfx('heart');
      const ok = btn('pk-btn wide', res.thread ? 'There is more…' : 'Lovely', () => { sh.close(); refresh(); if (res.thread) threadScene(res.thread); });
      ok.style.marginTop = '10px';
      body.append(ok);
      body.scrollTop = body.scrollHeight;
      save(); render();
    }
  }

  // ---------- threads ----------
  function sceneBlock(lines) {
    const box = el('<div class="pk-scene"></div>');
    const first = lines[0][0];
    lines.forEach(([who, text], i) => {
      const l = el(`<div class="l ${who === first ? '' : 'r'}">${face(who, 40, 'happy')}<div class="pk-bub">${esc(text)}</div></div>`);
      l.style.animationDelay = `${0.2 + i * 0.5}s`;
      box.append(l);
    });
    return box;
  }
  function threadScene(th) {
    fx.sfx('thread'); fx.confetti(null, null, 30);
    const sh = sheet({ mid: true, closable: false });
    const body = el('<div class="pk-card"></div>');
    sh.body.replaceWith(body);
    const a = FACTS[th.a].t, b = FACTS[th.b].t;
    body.append(el(`<div class="over">A new thread</div>`), el(`<h1>${esc(th.title)}</h1>`));
    body.append(el(`<svg viewBox="0 0 200 64" style="width:200px;margin:8px auto 0"><path class="pk-thread-line" d="M46 34C80 10 120 58 154 30" fill="none" stroke="#f27d6b" stroke-width="4" stroke-linecap="round"/><g transform="translate(6 4) scale(.56)">${portrait(TENANT_BY_ID[a].look, { size: 100, expr: 'happy' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(138 4) scale(.56)">${portrait(TENANT_BY_ID[b].look, { size: 100, expr: 'happy' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`));
    body.append(sceneBlock(th.scene));
    if (th.perk && th.perk.text) body.append(el(`<div class="pk-perk">${icon('sparkle', 20)}<span>${esc(th.perk.text)}</span></div>`));
    if (th.decor && DECOR[th.decor]) body.append(el(`<div class="pk-perk">${icon('home', 20)}<span><b>New in the house: ${esc(DECOR[th.decor].name)}</b><br>${esc(DECOR[th.decor].desc)}</span></div>`));
    const ok = btn('pk-btn wide', 'Wonderful', () => { sh.close(); refresh(); });
    ok.style.marginTop = '12px';
    body.append(ok);
    happy.add(a); happy.add(b);
    save(); render();
  }

  function threads(tab = 'people') {
    const sh = sheet({ title: 'Threads', sub: `${s.threads.length} of ${S.ACTIVE_THREADS} friendships this time round`, tabs: true });
    let sel = [], msg = null;
    const usedFacts = new Set();
    const draw = () => {
      usedFacts.clear();
      for (const id of [...s.threads, ...s.pending]) { usedFacts.add(THREAD_BY_ID[id].a); usedFacts.add(THREAD_BY_ID[id].b); }
      sh.tabBar.replaceChildren(...[['people', 'Neighbours'], ['done', `Threads (${s.threads.length})`], ['events', 'Get-togethers']].map(([id, label]) => btn(id === tab ? 'on' : '', label, () => { tab = id; draw(); })));
      const b = sh.body; b.replaceChildren();
      ({ people, done, events })[tab](b);
    };
    function people(b) {
      b.append(el('<p style="font-weight:700">Pick one thing from two different neighbours. If what one needs is what the other offers or loves, introduce them.</p>'));
      b.append(el('<div class="pk-legend"><span><i style="background:var(--coral)"></i>needs</span><span><i style="background:var(--mint)"></i>offers</span><span><i style="background:var(--lilac)"></i>loves</span></div>'));
      const hot = s.up.noticeboard ? S.hunchPeople(s) : [];
      for (const T of TENANTS) {
        const p = s.people[T.id];
        const row = el(`<div class="pk-person-row"><div class="who">${face(T.id, 48)}${hot.includes(T.id) ? `<span class="pk-match">${icon('sparkle', 12)}</span>` : ''}<div>${esc(T.name)}</div></div><div class="facts"></div></div>`);
        const facts = row.lastElementChild;
        for (const f of p.known) {
          const F = FACTS[f];
          const fb = btn(`pk-fact ${F.kind} ${sel.includes(f) ? 'sel' : ''} ${usedFacts.has(f) ? 'used' : ''}`, `<i></i>${esc(F.text)}`, () => {
            msg = null;
            if (sel.includes(f)) sel = sel.filter((x) => x !== f);
            else { sel = sel.filter((x) => FACTS[x].t !== T.id); sel.push(f); if (sel.length > 2) sel.shift(); }
            draw();
          });
          facts.append(fb);
        }
        const unk = S.unknownCount(s, T.id);
        if (unk) facts.insertAdjacentHTML('beforeend', `<span class="pk-chip">${p.known.length ? `+${unk} to learn` : 'Not much yet. Try a tea break.'}</span>`);
        b.append(row);
      }
      const bar = el('<div class="pk-introbar"></div>');
      if (msg) bar.append(el(`<div class="pk-bub note" style="margin-bottom:8px">${icon(msg[0], 18)}<span>${esc(msg[1])}</span></div>`));
      const names = sel.map((f) => TENANT_BY_ID[FACTS[f].t].name);
      const go = btn('pk-btn wide', sel.length === 2 ? `Introduce ${esc(names[0])} and ${esc(names[1])} ${costChip('hours', '1h', s.hours >= 1)}` : 'Pick two things that fit together', () => {
        const r = S.introduce(s, sel[0], sel[1]);
        if (r.status === 'thread') { sh.close(); threadScene(r.thread); return; }
        if (r.status === 'project') {
          fx.sfx('good'); sel = [];
          msg = ['sparkle', `They would love to. First, though: ${r.thread.projectName.toLowerCase()}. It is on your board.`];
        } else if (r.status === 'nope') { fx.sfx('nope'); msg = ['tea', `${names[0]} and ${names[1]} have a nice chat about the weather. Not quite a match, and no harm done.`]; }
        else if (r.status === 'already' || r.status === 'pending') msg = ['check', r.status === 'pending' ? 'That one is already under way. Finish the project on your board.' : 'They are already thick as thieves.'];
        else if (r.status === 'tired') msg = ['moon', 'An introduction takes an hour, and you are out of hours today.'];
        refresh(); draw();
      }, 'pop');
      go.disabled = sel.length !== 2;
      bar.append(go);
      b.append(bar);
    }
    function done(b) {
      if (!s.threads.length && !s.pending.length) b.append(el(`<div class="pk-card">${kettleSvg('sit', s.hat, 100)}<p style="font-weight:800">No threads yet. Learn what people need over tea, then introduce them.</p></div>`));
      for (const id of s.pending) { const th = THREAD_BY_ID[id]; b.append(el(`<div class="pk-row proj"><div class="ic">${icon('sparkle', 24)}</div><div class="txt"><b>${esc(th.title)}</b><span class="sub">Waiting on you: ${esc(th.projectName)}</span></div></div>`)); }
      for (const id of s.threads.slice().reverse()) { const th = THREAD_BY_ID[id]; b.append(el(`<div class="pk-row got"><div class="ic">${icon('threads', 24)}</div><div class="txt"><b>${esc(th.title)}</b><span class="sub">${esc(th.after || '')}${th.perk && th.perk.text ? ` ${esc(th.perk.text)}.` : ''}</span></div></div>`)); }
    }
    function events(b) {
      b.append(el('<p style="font-weight:700">Bigger get-togethers become possible once the right friendships exist.</p>'));
      for (const ev of EVENTS) {
        if (!S.eventPossibleThisRun(s, ev.id)) continue;
        const held = s.events.includes(ev.id), ready = S.eventReady(s, ev.id), pr = S.eventProgress(s, ev.id);
        const row = el(`<div class="pk-row ${held ? 'got' : ''}"><div class="ic">${icon(held ? 'check' : 'star', 24)}</div><div class="txt"><b>${esc(ev.title)}</b><span class="sub">${esc(held ? `${ev.perk.text}.` : ev.blurb)}</span></div></div>`);
        b.append(row);
        if (held) continue;
        if (ready) {
          const go = btn('pk-btn mint wide', `Hold it ${costChip('hours', '2h', s.hours >= 2)} ${costChip('budget', ev.cost, s.budget >= ev.cost)}`, () => {
            const r = S.holdEvent(s, ev.id);
            if (!r) return;
            sh.close(); eventScene(r);
          }, 'pop');
          go.disabled = !S.canHold(s, ev.id);
          go.style.margin = '-2px 0 10px';
          b.append(go);
        } else if (pr) row.querySelector('.txt').insertAdjacentHTML('beforeend', `<div class="pk-meter"><i style="transform:scaleX(${pr.have / pr.set.length})"></i></div><span class="sub">${pr.have} of ${pr.set.length} friendships it needs</span>`);
      }
    }
    draw();
  }
  function eventScene(ev) {
    fx.sfx('thread'); fx.confetti(null, null, 44);
    const sh = sheet({ mid: true, closable: false });
    const body = el('<div class="pk-card"></div>');
    sh.body.replaceWith(body);
    body.append(el('<div class="over">A get-together</div>'), el(`<h1>${esc(ev.title)}</h1>`), el(`<p>${esc(ev.blurb)}</p>`), sceneBlock(ev.scene));
    body.append(el(`<div class="pk-perk">${icon('sparkle', 20)}<span>${esc(ev.perk.text)}</span></div>`));
    if (ev.decor && DECOR[ev.decor]) body.append(el(`<div class="pk-perk">${icon('home', 20)}<span><b>New in the house: ${esc(DECOR[ev.decor].name)}</b><br>${esc(DECOR[ev.decor].desc)}</span></div>`));
    const ok = btn('pk-btn wide', 'What a night', () => { sh.close(); refresh(); });
    ok.style.marginTop = '12px';
    body.append(ok);
    for (const [who] of ev.scene) happy.add(who);
    save(); render();
  }

  // ---------- improvements ----------
  function improve(tab = 'up') {
    const sh = sheet({ title: 'Improve the house', sub: 'Prevention beats firefighting', tabs: true });
    const draw = () => {
      sh.tabBar.replaceChildren(...[['up', 'Improvements'], ['wiki', 'Wiki'], ['cat', 'Kettle']].map(([id, label]) => btn(id === tab ? 'on' : '', label, () => { tab = id; draw(); })));
      const b = sh.body; b.replaceChildren();
      ({ up, wiki, cat })[tab](b);
    };
    function up(b) {
      b.append(el(`<div class="pk-rewards">${costChip('budget', `${s.budget} budget`)}${costChip('goodwill', `${s.goodwill} goodwill`)}</div>`));
      const list = UPGRADES.slice().sort((x, y) => (!!s.up[x.id] - !!s.up[y.id]) || (S.canBuy(s, y.id) - S.canBuy(s, x.id)) || x.cost - y.cost);
      for (const u of list) {
        const own = !!s.up[u.id];
        const row = btn(`pk-row ${own ? 'got' : ''}`, `<div class="ic">${icon(own ? 'check' : u.icon, 24)}</div><div class="txt"><b>${esc(u.name)}</b><span class="sub">${esc(u.desc)}</span></div>${own ? '' : costChip(u.cur, u.cost, S.canBuy(s, u.id))}`, () => {
          if (own) return;
          if (!S.buy(s, u.id)) { fx.sfx('nope'); fx.toast(`Not enough ${u.cur} yet.`, u.cur === 'budget' ? 'budget' : 'gw'); return; }
          fx.sfx('coin'); fx.confetti(null, null, 22); fx.toast(`${u.name}: done.`, 'info');
          refresh(); draw();
        });
        b.append(row);
      }
      if (s.up.volunteer) b.append(el(`<div class="pk-perk">${portrait(EXTRA_LOOKS.sam, { size: 40 })}<span><b>Sam, level ${S.samLevel(s)}</b><br>Takes up to ${plural(S.samLevel(s), 'easy ticket')} a day. Open a ticket to hand it over.</span></div>`));
    }
    function wiki(b) {
      b.append(el('<p style="font-weight:700">Fix the same sort of thing a few times and you can write it up. A wiki page means fewer of those tickets, for good.</p>'));
      const seen = TYPE_IDS.filter((t) => s.seenTypes[t] || s.notes[t] || s.wiki[t]);
      if (!seen.length) b.append(el('<p>Nothing to write about yet.</p>'));
      for (const t of seen) {
        const n = Math.min(S.WIKI_NOTES, s.notes[t] || 0), done = !!s.wiki[t];
        b.append(el(`<div class="pk-row ${done ? 'got' : ''}"><div class="ic">${icon(done ? 'check' : TYPES[t].icon, 24)}</div><div class="txt"><b>${esc(TYPES[t].wiki)}</b><span class="sub">${done ? 'Pinned by the stairs. Fewer of these come in now.' : `${n} of ${S.WIKI_NOTES} notes`}</span>${done ? '' : `<div class="pk-meter"><i style="transform:scaleX(${n / S.WIKI_NOTES})"></i></div>`}</div></div>`));
        if (!done && n >= S.WIKI_NOTES) {
          const go = btn('pk-btn mint wide', `Write it up ${costChip('hours', '1h', s.hours >= 1)}`, () => { if (S.writeWiki(s, t)) { fx.sfx('page'); fx.confetti(null, null, 18); fx.toast('Wiki page written. +2 goodwill', 'note'); refresh(); draw(); } }, 'pop');
          go.disabled = !S.canWriteWiki(s, t);
          go.style.margin = '-2px 0 10px';
          b.append(go);
        }
      }
    }
    function cat(b) {
      b.append(el(`<div class="pk-card" style="padding:4px 0 8px">${kettleSvg('sit', s.hat, 130)}<p style="font-weight:800">Kettle has been petted ${plural(s.kettle.pets, 'time')}${s.stats.kettleFixes ? ` and has fixed ${plural(s.stats.kettleFixes, 'ticket')} by sitting on ${s.stats.kettleFixes === 1 ? 'it' : 'them'}` : ''}.</p></div>`));
      b.append(el('<h3>Hats</h3>'));
      for (const hdef of HATS) {
        const own = s.hats.includes(hdef.id), on = s.hat === hdef.id;
        const right = own ? `<span class="pk-cost">${on ? 'Wearing' : 'Wear'}</span>` : hdef.cost != null ? costChip('goodwill', hdef.cost, S.canBuyHat(s, hdef.id)) : '';
        const row = btn(`pk-row ${on ? 'got' : ''}`, `<div class="ic">${icon('hat', 24)}</div><div class="txt"><b>${esc(hdef.name)}</b><span class="sub">${esc(own || hdef.cost != null ? hdef.desc : `A gift, one day, from ${TENANT_BY_ID[hdef.from].name}.`)}</span></div>${right}`, () => {
          if (own) S.wearHat(s, on ? null : hdef.id);
          else if (hdef.cost != null) { if (!S.buyHat(s, hdef.id)) { fx.sfx('nope'); return; } fx.sfx('coin'); fx.confetti(null, null, 16); }
          else return;
          refresh(); draw();
        });
        b.append(row);
      }
    }
    draw();
  }

  // ---------- the day ----------
  function endDay() {
    const sh = sheet({ title: 'Call it a day?', mid: true });
    const waiting = S.waiting(s), old = s.board.filter((t) => !t.project && t.age >= 1).length;
    sh.body.append(el(`<p style="font-weight:700">${s.hours > 0 ? `You still have ${plural(s.hours, 'hour')} today. ` : ''}${waiting ? `${plural(waiting, 'ticket')} will wait until tomorrow${old ? `, and ${old === 1 ? 'one has' : `${old} have`} waited long enough that ${old === 1 ? 'its owner' : 'their owners'} will make do without you` : ''}.` : 'The board is clear.'}</p>`));
    const acts = el('<div class="pk-actions"></div>');
    acts.append(btn('pk-btn alt', 'Not yet', sh.close), btn('pk-btn', 'Lights out', () => { sh.close(); evening(S.endDay(s)); }, 'night'));
    sh.body.append(acts);
  }
  const trend = (now, before, goodUp = true) => (before == null || now === before ? '' : `<em class="${(now > before) === goodUp ? 'up' : 'down'}">${now > before ? '▲' : '▼'} ${Math.abs(now - before)}</em>`);
  function evening(sum) {
    if (!sum) return;
    happy = new Set();
    save();
    main.replaceChildren();
    const card = el('<div class="pk-card" style="margin:auto 0;padding-top:calc(var(--sat) + 20px)"></div>');
    card.append(el(`<div class="over">Day ${sum.day} is done</div>`), el(`<h1>${sum.solved >= 5 ? 'A proper day\'s work' : sum.threads ? 'A day for friendships' : sum.solved ? 'Good work today' : 'A quiet one'}</h1>`));
    card.append(el(`<div class="pk-tiles"><div class="pk-tile"><b>${sum.solved}</b><span>fixed</span></div><div class="pk-tile"><b>${sum.prevented}</b><span>prevented</span></div><div class="pk-tile"><b>${sum.mood}</b><span>cozy</span></div><div class="pk-tile"><b>+${sum.gw}</b><span>goodwill</span></div><div class="pk-tile"><b>+${sum.budget}</b><span>budget</span></div><div class="pk-tile"><b>${sum.threads}</b><span>new threads</span></div></div>`));
    if (sum.driftedList.length) { const l = el('<div class="list"></div>'); sum.driftedList.forEach((d) => l.append(el(`<div class="pk-line">${icon('moon', 18)}<span>${esc(d.text)}</span></div>`))); card.append(l); }
    if (sum.week) {
      const w = sum.week, n = w.now, p = w.before;
      card.append(el(`<div class="over" style="margin-top:14px">Week ${w.week} at Marigold House</div>`));
      const max = Math.max(1, ...w.days.map((d) => d.solved + d.prevented));
      card.append(el(`<div class="pk-bars">${w.days.map((d, i) => `<div><i class="p" style="height:${(d.prevented / max) * 100}%;animation-delay:${i * 0.08}s"></i><i style="height:${(d.solved / max) * 100}%;animation-delay:${i * 0.08}s"></i></div>`).join('')}</div>`));
      card.append(el('<div class="pk-legend" style="justify-content:center"><span><i style="background:var(--gold)"></i>fixed by you</span><span><i style="background:var(--mint)"></i>never happened</span></div>'));
      card.append(el(`<div class="pk-tiles"><div class="pk-tile"><b>${n.solved}</b><span>fixed</span>${trend(n.solved, p && p.solved)}</div><div class="pk-tile"><b>${n.prevented}</b><span>prevented</span>${trend(n.prevented, p && p.prevented)}</div><div class="pk-tile"><b>${n.threads}</b><span>threads</span>${trend(n.threads, p && p.threads)}</div><div class="pk-tile"><b>${n.events}</b><span>get-togethers</span></div><div class="pk-tile"><b>${n.drifted}</b><span>made do</span>${trend(n.drifted, p && p.drifted, false)}</div><div class="pk-tile"><b>${n.mood}</b><span>cozy</span>${trend(n.mood, p && p.mood)}</div></div>`));
    }
    const go = btn('pk-btn wide', sum.next === 'openday' ? 'Tomorrow is Open Day' : 'Goodnight, Kettle', morning, 'pop');
    go.style.marginTop = '12px';
    card.append(go);
    main.append(card);
  }
  function morning() {
    const rep = S.beginDay(s);
    if (!rep) { hub(); return; }
    if (rep.openDay) { finale(); return; }
    save();
    fx.sfx('day');
    main.replaceChildren();
    const card = el('<div class="pk-card" style="margin:auto 0;padding-top:calc(var(--sat) + 20px)"></div>');
    card.append(el(`<div class="over">${dayLabel()}</div>`), el(`<h1>${esc(rep.weather)}</h1>`));
    const l = el('<div class="list"></div>');
    const line = (ic, text, cls = '') => { const n = el(`<div class="pk-line ${cls}">${icon(ic, 18)}<span>${text}</span></div>`); n.style.animationDelay = `${l.children.length * 0.09}s`; l.append(n); };
    if (s.day === 1) line('home', 'Your first day as the only IT person at Marigold House. Kettle, the cat, is already at work on the warm server.');
    for (const p of rep.perks) line(p.cur === 'goodwill' ? 'heart' : 'coin', `+${p.n} ${p.cur} from the friendships in the house`, 'good');
    if (rep.gossip && rep.gossip.fact) line('note', `Overheard on the stairs about ${esc(TENANT_BY_ID[rep.gossip.who].name)}: ${esc(FACTS[rep.gossip.fact].text.toLowerCase())}`, 'good');
    if (rep.kettleFix) line('paw', `Kettle sat on ${esc(TENANT_BY_ID[rep.kettleFix.who].name)}'s ${esc(TYPES[rep.kettleFix.type].short.toLowerCase())} problem until it went away.`, 'cat');
    for (const p of rep.prevented) line('check', esc(p.text), 'good');
    for (const t of TYPE_IDS) if (TYPES[t].unlock === s.day && s.day > 1) line('sparkle', `A new kind of problem today: ${esc(TYPES[t].name.toLowerCase())}.`);
    line('tickets', rep.newTickets.length ? `${plural(rep.newTickets.length, 'new ticket')} on the board, and ${plural(rep.hours, 'hour')} to spend.` : `No new tickets at all. ${plural(rep.hours, 'hour')} to spend however you like.`);
    card.append(l);
    const firstDay = s.day === 1;
    const go = btn('pk-btn wide', 'Put the kettle on', () => { hub(); if (firstDay && !store.get('guideSeen', false)) howToPlay(); }, 'pop');
    go.style.marginTop = '8px';
    card.append(go);
    main.append(card);
  }

  function finale() {
    const fin = S.openDay(s);
    book.runs += 1; book.best = Math.max(book.best, fin.score); book.titles[fin.title] = 1;
    save(); ctx.setBest(`Best: ${book.best} points · ${TITLES.find((t) => t.id === fin.title).name}`);
    fx.sfx('win');
    scope.timeout(() => fx.confetti(null, null, 60), 400);
    main.replaceChildren();
    const title = TITLES.find((t) => t.id === fin.title);
    const card = el('<div class="pk-card" style="padding-top:calc(var(--sat) + 14px)"></div>');
    card.append(el('<div class="over">Marigold Open Day</div>'), el(`<h1>${esc(title.name)}</h1>`), el(`<p style="font-weight:700">${esc(title.desc)}</p>`));
    const hs = el(`<div style="height:300px;margin:6px 0">${houseSvg(view({ bubbles: {}, happy: new Set(TENANTS.map((t) => t.id)), kettle: { spot: 'stairs', hat: s.hat, awake: true, canPet: false } }))}</div>`);
    card.append(hs);
    card.append(el(`<div class="pk-tiles"><div class="pk-tile"><b>${fin.threads.length}</b><span>threads</span></div><div class="pk-tile"><b>${fin.events.length}</b><span>get-togethers</span></div><div class="pk-tile"><b>${fin.mood}</b><span>cozy</span></div><div class="pk-tile"><b>${fin.solved}</b><span>fixed</span></div><div class="pk-tile"><b>${fin.prevented}</b><span>prevented</span></div><div class="pk-tile"><b>${fin.score}</b><span>points</span></div></div>`));
    const l = el('<div class="list"></div>');
    const line = (ic, text) => l.append(el(`<div class="pk-line good">${icon(ic, 18)}<span>${text}</span></div>`));
    line('door', fin.threads.length >= 8 ? 'The whole street came. People who had never met were finishing each other\'s sentences.' : fin.threads.length >= 3 ? 'The doors stood open all afternoon, and neighbours showed visitors round each other\'s rooms.' : 'A small, friendly crowd came through. Everything worked, which is its own kind of magic.');
    for (const id of fin.events) line('star', `${esc(EVENT_BY_ID[id].title)} had its own corner, and a queue.`);
    if (fin.mina) line('video', 'Mina waved from the big screen for a full ten minutes.');
    if (fin.sam) line('sam', 'Sam ran the help desk for an hour, wearing your lanyard.');
    line('paw', fin.hat ? `Kettle attended in his ${esc(HAT_BY_ID[fin.hat].name.toLowerCase())}, and was photographed a great deal.` : 'Kettle slept through the entire thing on the warm server.');
    card.append(l);
    const go = btn('pk-btn wide', 'Keep the kettle on', morning, 'pop');
    card.append(go, el('<p style="font-size:12.5px;color:var(--soft);font-weight:700">The house carries on in free play. A new game deals different friendships.</p>'));
    main.append(card);
  }

  // ---------- title, menu, scrapbook ----------
  function menu() {
    const sh = sheet({ title: 'Marigold House', sub: s ? dayLabel() : '', mid: true });
    const tog = (label, key) => { const b = btn('pk-btn alt wide', '', () => { settings[key] = !settings[key]; store.set('settings', settings); if (key === 'music') { if (settings.music) startMusic(); else music.stop(); } draw(); }); const draw = () => { b.innerHTML = `${icon(settings[key] ? 'sound' : 'mute', 20)} ${label}: ${settings[key] ? 'on' : 'off'}`; }; draw(); b.style.marginBottom = '8px'; return b; };
    sh.body.append(tog('Music box', 'music'), tog('Sounds', 'sfx'));
    const hp = btn('pk-btn alt wide', `${icon('question', 20)} How to play`, () => { sh.close(); howToPlay(); }); hp.style.marginBottom = '8px';
    const sb = btn('pk-btn alt wide', `${icon('book', 20)} Scrapbook`, () => { sh.close(); scrapbook(); }); sb.style.marginBottom = '8px';
    const tt = btn('pk-btn alt wide', `${icon('door', 20)} Back to the title`, () => { sh.close(); save(); title(); });
    sh.body.append(hp, sb, tt);
  }
  function scrapbook() {
    const sh = sheet({ title: 'Scrapbook', sub: `${plural(book.runs, 'Open Day')} so far${book.best ? ` · best ${book.best} points` : ''}` });
    const b = sh.body;
    const sect = (label, items) => {
      const got = items.filter((i) => i[1]).length;
      b.append(el(`<h3>${label} · ${got} of ${items.length}</h3>`));
      const chips = el('<div class="pk-chips"></div>');
      for (const [name, have] of items) chips.insertAdjacentHTML('beforeend', `<span class="pk-chip" style="${have ? 'background:#fff0cf' : 'opacity:.45'}">${have ? esc(name) : '?'}</span>`);
      b.append(chips);
    };
    sect('Titles earned', TITLES.map((t) => [t.name, book.titles[t.id]]));
    sect('Threads seen', THREADS.map((t) => [t.title, book.threads[t.id]]));
    sect('Get-togethers held', EVENTS.map((e) => [e.title, book.events[e.id]]));
    sect('Things about the house', Object.keys(DECOR).map((d) => [DECOR[d].name, book.decor[d]]));
    sect('Gifts from neighbours', TENANTS.map((t) => [t.gift.name, book.gifts[t.gift.id]]));
    sect('Hats for Kettle', HATS.map((x) => [x.name, book.hats[x.id]]));
  }
  function newGame() {
    const start = (quirk) => { s = S.newGame(randomSeed(), quirk); happy = new Set(); save(); morning(); };
    if (!book.runs) { start(null); return; }
    const sh = sheet({ title: 'A new start', sub: 'Pick something about yourself this time', mid: true });
    const q = el('<div class="pk-quirk"></div>');
    q.append(btn('pk-row', `<div class="ic">${icon('home', 24)}</div><div class="txt"><b>Just me</b><span class="sub">Nothing special. A fine way to arrive.</span></div>`, () => { sh.close(); start(null); }));
    for (const k of QUIRKS) q.append(btn('pk-row', `<div class="ic">${icon('sparkle', 24)}</div><div class="txt"><b>${esc(k.name)}</b><span class="sub">${esc(k.desc)}</span></div>`, () => { sh.close(); start(k.id); }));
    sh.body.append(q);
  }
  function title() {
    hubEls = null;
    main.replaceChildren();
    const scr = el('<div class="pk-title"><div class="logo"><h1>Patch <span>&amp;</span> Kettle</h1><p>The nicest help desk in the world</p></div><div class="pk-housewrap"></div><div class="btns"></div></div>');
    const demo = s || S.newGame(7);
    const keep = s; s = demo;
    scr.querySelector('.pk-housewrap').innerHTML = houseSvg(view({ bubbles: {}, kettle: { spot: demo.kettle.spot, hat: demo.hat, awake: false, canPet: false } }));
    s = keep;
    const btns = scr.querySelector('.btns');
    if (s) btns.append(btn('pk-btn wide', `Continue <small>${dayLabel()} · cozy ${S.moodOf(s)}${s.quirk ? ` · ${QUIRK_BY_ID[s.quirk].name.toLowerCase()}` : ''}</small>`, () => { startMusic(); if (s.phase === 'day') hub(); else morning(); }, 'pop'));
    btns.append(btn(`pk-btn wide ${s ? 'alt' : ''}`, 'New game', () => {
      startMusic();
      if (!s) { newGame(); return; }
      const sh = sheet({ title: 'Start over?', mid: true });
      sh.body.append(el('<p style="font-weight:700">Your current house will be packed away. The scrapbook keeps everything you have found.</p>'));
      const acts = el('<div class="pk-actions"></div>');
      acts.append(btn('pk-btn alt', 'Keep it', sh.close), btn('pk-btn', 'New game', () => { sh.close(); newGame(); }));
      sh.body.append(acts);
    }, 'pop'));
    const row = el('<div class="pk-actions" style="margin:0"></div>');
    row.append(btn('pk-btn alt', `${icon('book', 20)} Scrapbook`, scrapbook), btn('pk-btn alt', `${icon('door', 20)} Games`, () => ctx.exit()));
    btns.append(row);
    main.append(scr);
  }

  scope.on(document, 'visibilitychange', () => { if (document.hidden) { save(); music.stop(); } else if (hubEls) startMusic(); });
  title();
  if (import.meta.env.DEV) window.__pk = { get s() { return s; }, S, play, hub, refresh, morning, evening, fx, test(type, level = 1, opts = {}) { play(null, S.ticketPuzzle({ up: opts.up || {} }, { type, level, seed: opts.seed || 5, who: 'bea', find: !!opts.find, project: opts.project })); } };

  return {
    dispose() {
      save();
      if (guide) guide.close();
      music.dispose();
      scope.dispose();
      root.remove();
      if (import.meta.env.DEV) delete window.__pk;
    },
  };
}
