// Lanternfall interface: title, scene player, town map, notebook, finale and gallery. Plain DOM.
import { randomSeed } from '../../../shell/rng.js';
import { CAST, STATS, STAT_INFO, SUSPECTS, TOWNSFOLK, LOCATIONS, TRAIT_TEXT } from '../data/cast.js';
import { PLACES, SLOT_NAMES } from '../data/world.js';
import { ENDINGS, ENDING_ORDER, EPILOGUES, VERSE, VERSE_NEEDED, KEEPSAKES } from '../data/story.js';
import { MOTIVES } from '../data/clues.js';
import * as S from '../sim.js';
import { portrait, face, silhouette } from './portraits.js';
import { background } from './backgrounds.js';
import { IC } from './icons.js';
import { GUIDE_PAGES } from './guide.js';
import { openGuide } from '../../../shell/guide.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function h(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
const SPEED = { slow: 34, normal: 18, fast: 8, instant: 0 };
const pips = (n, of = 5, cls = '') => `<span class="lf-pips ${cls}">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

export function createApp(ctx) {
  const store = ctx.storage;
  const root = h('div', 'lf');
  ctx.root.append(root);
  let meta = S.normalizeMeta(store.get('meta', null));
  let state = S.deserialize(store.get('run', null));
  let disposed = false, keyHandler = null, guide = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!disposed) fn(); }, ms); timers.add(t); return t; };
  const wait = (ms) => new Promise((res) => later(res, ms));
  const sfx = (name) => { if (meta.settings.sfx) ctx.audio.play(name); };
  const blip = (f) => { if (meta.settings.sfx) ctx.audio.tone({ freq: f, dur: 0.05, type: 'sine', vol: 0.05 }); };
  const on = (node, fn) => { node.addEventListener('click', (e) => { e.stopPropagation(); fn(e); }); return node; };
  const btn = (cls, html, fn) => on(h('button', cls, html), () => { sfx('tap'); fn(); });
  const saveMeta = () => { store.set('meta', meta); const c = S.completion(meta); if (meta.runs) ctx.setBest(`${c.pct}% discovered · ${c.endings} of ${c.endingsTotal} endings`); };
  const saveRun = () => { if (state) store.set('run', S.serialize(state)); else store.remove('run'); };
  const show = (screen) => { root.replaceChildren(screen); keyHandler = null; return screen; };
  const bgDiv = (place, time) => h('div', 'lf-bg', `<div>${background(place, time)}</div>`);
  const log = [];

  // ------------------------------------------------------------------ title
  function title() {
    const scr = h('div', 'lf-screen lf-title');
    scr.append(bgDiv('bridge', 2), h('div', 'shade'));
    const col = h('div', 'lf-col');
    col.append(h('div', 'lf-logo', '<h1 class="lf-serif">Lanternfall</h1><p>Seven days. Six neighbours. One missing moon.</p>'));
    if (state) col.append(btn('lf-btn', `Continue<small>${state.phase === 'finale' ? 'Festival night' : `Day ${state.day}, ${SLOT_NAMES[state.slot].toLowerCase()}`} · ${esc(state.name)}</small>`, resume));
    col.append(btn(`lf-btn ${state ? 'alt' : ''}`, 'New story', () => (state ? confirmNew() : setup())));
    const c = S.completion(meta);
    col.append(btn('lf-btn alt', `Endings and keepsakes<small>${c.pct}% discovered</small>`, gallery));
    const row = h('div', 'lf-foot');
    row.append(btn('lf-btn alt', 'Settings', () => settings(title)), btn('lf-btn alt', 'Back to games', () => ctx.exit()));
    col.append(row);
    scr.append(col);
    show(scr);
  }
  function confirmNew() {
    const scr = h('div', 'lf-screen lf-form');
    const col = h('div', 'lf-col');
    col.style.justifyContent = 'center';
    col.append(h('h2', 'lf-serif', 'Begin again?'), h('p', '', `${esc(state.name)}'s week on the quay will be left unfinished. What you have unlocked stays with you.`));
    col.append(btn('lf-btn', 'Start a new story', setup), btn('lf-btn alt', 'Keep the current one', title));
    scr.append(col); show(scr);
  }

  // ------------------------------------------------------------------ new run
  function setup() {
    const scr = h('div', 'lf-screen lf-form');
    const col = h('div', 'lf-col');
    col.append(h('h2', 'lf-serif', 'Who steps off the midnight barge?'), h('p', '', 'A stranger in a canal town, with one bag and a room over a tea house.'));
    const input = h('input', 'lf-input');
    input.type = 'text'; input.maxLength = 14; input.value = store.get('name', '') || ''; input.placeholder = 'Your name'; input.autocomplete = 'off';
    col.append(input);
    const keeps = S.keepsakesUnlocked(meta);
    let keep = null, keepStat = 'insight';
    const statRow = h('div', 'lf-seg');
    const drawStats = () => { statRow.replaceChildren(...STATS.map((st) => { const b = btn(st === keepStat ? 'on' : '', STAT_INFO[st].name, () => { keepStat = st; drawStats(); }); return b; })); };
    const opts = [];
    if (keeps.length) {
      col.append(h('p', '', '<b>Bring a keepsake</b> from an earlier week:'));
      const draw = () => { opts.forEach(([k, b]) => b.classList.toggle('on', keep === k)); statRow.style.display = keep === 'notebook' ? '' : 'none'; };
      for (const k of [null, ...keeps]) {
        const b = btn('lf-opt', k ? `<div class="txt"><b>${esc(KEEPSAKES[k].name)}</b><span>${esc(KEEPSAKES[k].text)}</span></div>` : '<div class="txt"><b>Nothing</b><span>Arrive as you first did.</span></div>', () => { keep = k; draw(); });
        opts.push([k, b]); col.append(b);
        if (k === 'notebook') { drawStats(); col.append(statRow); }
      }
      draw();
    } else if (meta.runs === 0) col.append(h('p', '', 'Each week on the quay is different: who took the lantern, why, how, and where everyone spends their days.'));
    const go = btn('lf-btn', 'Step ashore', () => {
      const name = input.value.trim() || 'Robin';
      store.set('name', name);
      state = S.newRun({ seed: S.chooseSeed(meta, randomSeed), name, keepsake: keep, keepsakeStat: keep === 'notebook' ? keepStat : null });
      saveRun();
      act({ kind: 'intro' });
    });
    go.style.marginTop = 'auto';
    col.append(go, btn('lf-btn alt', 'Back', title));
    scr.append(col); show(scr);
  }

  // ------------------------------------------------------------------ the scene player
  // Plays `scene` against `draft` (mutated by the walker). Resolves when the scene has ended.
  function playScene(draft, scene, sub) {
    return new Promise((done) => {
      const scr = h('div', 'lf-screen lf-scene');
      const bg = h('div', 'lf-bg');
      const zone = h('div', 'lf-tapzone');
      const char = h('div', 'lf-char hide');
      const box = h('div', 'lf-box'), text = h('div'), name = h('div', 'lf-name lf-serif'), caret = h('div', 'lf-caret');
      box.append(name, text, caret);
      const choices = h('div', 'lf-choices');
      const top = h('div', 'lf-top');
      const seen = !!meta.seen[scene.id];
      const skipBtn = btn('lf-pill', `${IC.skip}Skip`, () => { skipping = !skipping; skipBtn.classList.toggle('on', skipping); if (skipping && tapResolve) tapResolve(); });
      top.append(h('div', 'ttl', `<span>${esc(sub || '')}</span><b class="lf-serif">${esc(scene.title || '')}</b>`), skipBtn,
        btn('lf-ib', IC.log, () => overlayLog()), btn('lf-ib', IC.menu, () => sceneMenu()));
      scr.append(bg, char, zone, box, choices, top);
      show(scr);
      let skipping = false, tapResolve = null, curBg = '', curWho = null, curExpr = null, paused = false;
      const setBg = (place, time) => {
        const key = `${place}:${time}`;
        if (key === curBg) return; curBg = key;
        const layer = h('div', '', background(place, time)); layer.style.opacity = '0';
        bg.append(layer); requestAnimationFrame(() => { layer.style.opacity = '1'; });
        later(() => { while (bg.children.length > 1) bg.firstChild.remove(); }, 700);
      };
      setBg(scene.bg || 'teahouse', scene.time ?? 1);
      const tapped = () => new Promise((res) => { tapResolve = () => { tapResolve = null; res(); }; });
      on(zone, () => { if (!paused && tapResolve) tapResolve(); });
      keyHandler = (e) => {
        if (paused) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (choices.children.length) return; if (tapResolve) tapResolve(); }
        else if (/^[1-9]$/.test(e.key)) { const b = choices.children[+e.key - 1]; if (b) b.click(); }
      };

      async function line(st) {
        const who = st.who;
        box.className = `lf-box ${who === null ? 'narr' : who === 'you' ? 'you' : ''}`;
        if (who && who !== 'you' && CAST[who]) {
          if (who !== curWho || st.expr !== curExpr) {
            char.innerHTML = portrait(who, st.expr);
            if (who !== curWho) { char.classList.remove('pop'); void char.offsetWidth; char.classList.add('pop'); }
            curWho = who; curExpr = st.expr;
          }
          char.classList.remove('hide', 'dim');
          name.style.display = ''; name.textContent = CAST[who].short; name.style.background = CAST[who].color;
        } else {
          if (curWho) char.classList.add('dim');
          name.style.display = who === 'you' ? '' : 'none';
          if (who === 'you') { name.textContent = draft.name; name.style.background = '#f7ecd8'; }
        }
        log.push({ who: who === 'you' ? draft.name : who ? CAST[who].short : null, text: st.text });
        if (log.length > 160) log.shift();
        caret.classList.remove('on');
        const ms = SPEED[meta.settings.speed] ?? 18;
        if (skipping) { text.textContent = st.text; await wait(40); return; }
        if (ms === 0) text.textContent = st.text;
        else {
          let i = 0, stop = false;
          const t = tapped(); t.then(() => { stop = true; });
          while (i < st.text.length && !stop && !disposed) {
            i = Math.min(st.text.length, i + 2);
            text.textContent = st.text.slice(0, i);
            if (i % 8 === 0) blip(who === null ? 300 : who === 'you' ? 520 : 400 + (CAST[who] ? CAST[who].name.length * 12 : 0));
            await wait(ms * 2);
          }
          text.textContent = st.text;
          if (!stop) tapResolve = null;
        }
        if (skipping) return;
        caret.classList.add('on');
        await tapped();
      }

      async function choose(view) {
        skipping = false; skipBtn.classList.remove('on');
        caret.classList.remove('on');
        return new Promise((res) => {
          view.options.forEach((o, i) => {
            const chips = o.reqs.map((q) => `<span class="lf-req ${q.met ? '' : 'no'}">${q.met ? '' : IC.lock}${STAT_INFO[q.stat].name} ${q.rank}</span>`).join('') + (o.dv ? '<span class="lf-req dvt">Déjà vu</span>' : '');
            const b = h('button', `lf-choice ${o.locked ? 'locked' : ''} ${o.dv ? 'dv' : ''}`, `<span class="t">${esc(o.text)}</span>${chips}`);
            b.style.animationDelay = `${i * 0.06}s`;
            on(b, () => { if (o.locked) { sfx('error'); return; } sfx('tap'); choices.replaceChildren(); log.push({ who: draft.name, text: o.text }); res(i); });
            choices.append(b);
          });
        });
      }

      async function fx(results) {
        const cards = [];
        let clue = false, big = false;
        for (const r of results) {
          if (r.kind === 'xp') {
            cards.push(`<div class="lf-card ${r.rankUp ? 'up' : ''}"><div class="ic">${IC.up}</div><div><small>${r.rankUp ? 'Rank up' : 'You improve'}</small><b>${STAT_INFO[r.stat].name} +${r.amount}</b>${r.rankUp ? `<p>Now rank ${r.rank}: ${STAT_INFO[r.stat].ranks[r.rank - 1]}. ${pips(r.rank, 5, 'st')}</p>` : ''}</div></div>`);
            big = big || r.rankUp;
          } else if (r.kind === 'bond') cards.push(`<div class="lf-card"><div class="ic">${face(r.who, 'happy')}</div><div><small>A little closer</small><b>${CAST[r.who].short} +${r.amount}</b></div></div>`);
          else if (r.kind === 'rank') { big = true; cards.push(`<div class="lf-card up"><div class="ic">${face(r.who, 'happy')}</div><div><small>Bond deepened</small><b>${CAST[r.who].short}</b><p>${pips(r.rank)} ${['', 'Acquaintance', 'Friendly', 'Friend', 'Confidant', 'True friend'][r.rank]}</p></div></div>`); }
          else if (r.kind === 'clue' && r.clue) { clue = true; cards.push(`<div class="lf-card clue"><div class="ic">${IC.find}</div><div><small>Written in your notebook</small><b>${esc(r.clue.title)}</b><p>${esc(r.clue.note)}</p></div></div>`); }
        }
        if (!cards.length) return;
        const ov = h('div', 'lf-fx', cards.map((c, i) => c.replace('class="lf-card', `style="animation-delay:${i * 0.12}s" class="lf-card`)).join('') + (skipping ? '' : '<div class="hint">Tap to continue</div>'));
        scr.append(ov);
        sfx(big ? 'level' : clue ? 'coin' : 'good');
        if (skipping) await wait(clue ? 1300 : 650);
        else { await wait(250); await new Promise((res) => on(ov, res)); }
        ov.remove();
      }

      function overlayLog() {
        paused = true;
        const ov = paper('What was said', () => { ov.remove(); paused = false; });
        const body = ov.querySelector('.lf-pbody');
        const list = h('div', 'lf-log');
        for (const l of log.slice(-60)) list.append(h('div', l.who ? '' : 'n', `${l.who ? `<b>${esc(l.who)}</b>` : ''}${esc(l.text)}`));
        body.append(list); scr.append(ov);
        requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
      }
      function sceneMenu() {
        paused = true;
        const ov = paper('Paused', () => { ov.remove(); paused = false; });
        const body = ov.querySelector('.lf-pbody');
        settingsRows(body);
        const help = btn('lf-btn alt', 'How to play', howToPlay);
        help.style.marginTop = '16px';
        const leave = btn('lf-btn', 'Leave to the title<small>This scene will start over next time</small>', () => { stop = true; title(); });
        leave.style.marginTop = '10px';
        body.append(help, leave);
        scr.append(ov);
      }

      let stop = false;
      (async () => {
        const w = S.createWalker(draft, scene, meta);
        for (let st = w.next(); st && !stop && !disposed; st = w.next()) {
          if (st.type === 'line') await line(st);
          else if (st.type === 'bg') { setBg(st.bg, st.time ?? 1); curWho = null; char.classList.add('hide'); }
          else if (st.type === 'choice') { const i = await choose(st); const res = w.choose(i); if (res && res.results.length) await fx(res.results); }
          else if (st.type === 'fx') await fx(st.results);
        }
        if (stop || disposed) return;
        if (scene.id) { meta.seen[scene.id] = 1; saveMeta(); }
        done();
      })();
      if (seen) skipBtn.insertAdjacentHTML('beforeend', '<span style="opacity:.6;font-size:11px">seen</span>');
    });
  }

  // A paper overlay with a title and a close button; returns the element (body is .lf-pbody).
  function paper(titleText, onClose, tabs) {
    const scr = h('div', 'lf-screen lf-paper');
    scr.style.zIndex = 8;
    const col = h('div', 'lf-col');
    const head = h('div', 'lf-phead', `<h2 class="lf-serif">${esc(titleText)}</h2>`);
    head.append(btn('lf-ib', IC.close, onClose));
    col.append(head);
    if (tabs) col.append(tabs);
    col.append(h('div', 'lf-pbody'));
    scr.append(col);
    return scr;
  }

  // ------------------------------------------------------------------ flow between scenes
  async function act(action) {
    const { draft, scene } = S.beginAction(state, action);
    const sub = action.kind === 'intro' ? 'Prologue' : action.kind === 'finale' ? 'Festival night' : `Day ${state.day} · ${SLOT_NAMES[scene.time ?? state.slot]}`;
    await playScene(draft, scene, sub);
    if (disposed) return;
    const dayBefore = state.day;
    state = S.endAction(draft, action, scene);
    saveRun();
    if (action.kind === 'finale') { accuse(); return; }
    if (state.phase === 'finale') { await dayCard('Lanternfall', 'Festival night'); act({ kind: 'finale' }); return; }
    if (state.day !== dayBefore || action.kind === 'intro') await dayCard(`Day ${state.day}`, state.day === 7 ? 'Lanternfall is tomorrow night' : `${8 - state.day} days to Lanternfall`);
    if (disposed) return;
    resume();
    // The prologue hooks first; the guide follows once, over the first look at the town.
    if (action.kind === 'intro' && !store.get('guideSeen', false)) { store.set('guideSeen', true); howToPlay(); }
  }
  function resume() {
    if (!state) { title(); return; }
    if (state.phase === 'intro') { act({ kind: 'intro' }); return; }
    if (state.phase === 'finale') { act({ kind: 'finale' }); return; }
    const ev = S.pendingEvent(state);
    if (ev) { act(ev); return; }
    map();
  }
  function dayCard(big, small) {
    return new Promise((res) => {
      const c = h('div', 'lf-daycard', `<b class="lf-serif">${esc(big)}</b><span>${esc(small)}</span>`);
      root.append(c); sfx('good');
      let gone = false;
      const go = () => { if (gone) return; gone = true; c.remove(); res(); };
      on(c, go); later(go, 1900);
    });
  }

  // ------------------------------------------------------------------ the town
  function header() {
    const head = h('div', 'lf-head');
    head.append(h('div', 'day', `<b class="lf-serif">Day ${state.day} · ${SLOT_NAMES[state.slot]}</b><span>${state.day === 7 ? 'Lanternfall is tomorrow night' : `${8 - state.day} days to Lanternfall`}</span>`));
    head.append(btn('lf-pill', `${IC.book}Notebook`, () => notebook()), btn('lf-ib', IC.menu, () => settings(map, true)));
    return head;
  }
  function map() {
    const scr = h('div', 'lf-screen lf-map');
    const col = h('div', 'lf-col');
    col.append(header());
    const now = (state.day - 1) * 3 + state.slot;
    col.append(h('div', 'lf-week', Array.from({ length: 21 }, (_, i) => `<i class="${i < now ? 'done' : i === now ? 'now' : ''}" style="${i % 3 === 0 && i ? 'margin-left:4px' : ''}"></i>`).join('')));
    const stats = h('div', 'lf-stats');
    for (const st of STATS) { const pr = S.statProgress(state, st); stats.append(h('div', 'lf-stat', `<b>${STAT_INFO[st].name}<em>${pr.rank}</em></b><div class="lf-bar"><i style="transform:scaleX(${pr.frac})"></i></div>`)); }
    on(stats, () => notebook('you'));
    col.append(stats);
    const grid = h('div', 'lf-places');
    LOCATIONS.forEach((pl, i) => {
      const sum = S.placeSummary(state, pl);
      const b = btn('lf-place', '', () => place(pl));
      b.style.animationDelay = `${i * 0.05}s`;
      const who = sum.known.map((w) => `<span class="${sum.ready.includes(w) ? 'rdy' : ''}">${face(w)}</span>`).join('') + Array.from({ length: sum.strangers }, () => `<span>${silhouette()}</span>`).join('');
      const tags = (sum.clue ? `<span class="lf-tag">${IC.find}</span>` : sum.clueLocked ? `<span class="lf-tag lock">${IC.lock}</span>` : '');
      b.innerHTML = `<div class="art">${background(pl, state.slot)}</div><div class="veil"></div><div class="who">${who}</div><div class="tags">${tags}</div><div class="nm lf-serif">${PLACES[pl].short}</div>`;
      grid.append(b);
    });
    col.append(grid);
    col.append(h('div', 'lf-legend', '<span><i></i>something to find</span><span><i class="h"></i>ready to open up</span><span>? a stranger</span>'));
    scr.append(col); show(scr);
  }

  function place(pl) {
    const P = PLACES[pl];
    const scr = h('div', 'lf-screen lf-sheet');
    const hero = h('div', 'hero');
    hero.append(bgDiv(pl, state.slot), h('div', 'veil'), h('div', 'inner', `<h2 class="lf-serif">${esc(P.name)}</h2><p>${esc(P.blurb)}</p>`));
    const back = btn('lf-ib back', IC.back, map);
    const body = h('div', 'body'), list = h('div', 'list');
    S.locationActions(state, pl).forEach((a, i) => {
      let icon = IC.hand, chips = '', cls = '';
      if (a.kind === 'bond') { icon = a.stranger ? silhouette() : face(a.who, 'happy'); cls = 'bond'; chips = a.stranger ? '' : `<div class="chips"><span class="lf-req">${IC.heart} Heart-to-heart</span></div>`; }
      if (a.kind === 'chat') { icon = face(a.who); if (a.tells) chips = `<div class="chips"><span class="lf-req">${IC.chat} Has something to tell you</span></div>`; }
      if (a.kind === 'investigate') {
        icon = IC.find;
        const lk = (a.locked || []).map((l) => `<span class="lf-req no">${IC.lock}${STAT_INFO[l.stat].name} ${l.rank}</span>`).join('');
        if (lk) chips = `<div class="chips">${lk}</div>`;
      }
      const b = h('button', `lf-act ${cls}`, `<div class="ic">${icon}</div><div class="txt"><b>${esc(a.title)}</b><span class="sub">${esc(a.sub || '')}</span>${chips}</div>`);
      b.disabled = !!a.disabled;
      b.style.animationDelay = `${i * 0.05}s`;
      on(b, () => { sfx('tap'); act(a); });
      list.append(b);
    });
    body.append(list);
    scr.append(hero, back, body);
    show(scr);
  }

  // ------------------------------------------------------------------ notebook
  function notebook(tab = 'case') {
    const names = [['case', 'Case'], ['suspects', 'Suspects'], ['people', 'People'], ['you', 'You'], ['diary', 'Diary']];
    const tabs = h('div', 'lf-tabs');
    const ov = paper('Notebook', () => ov.remove(), tabs);
    const body = ov.querySelector('.lf-pbody');
    const draw = () => {
      tabs.replaceChildren(...names.map(([id, label]) => btn(id === tab ? 'on' : '', label, () => { tab = id; draw(); })));
      body.replaceChildren(); body.scrollTop = 0;
      ({ case: nbCase, suspects: nbSuspects, people: nbPeople, you: nbYou, diary: nbDiary })[tab](body, draw);
    };
    draw();
    root.append(ov);
  }
  function nbCase(body) {
    const found = S.foundClues(state);
    body.append(h('p', '', 'The Moon Lantern left a locked boathouse between the tenth bell and midnight. Find <b>who</b> took it, <b>how</b> they got it out, and <b>why</b>.'));
    const leads = S.leads(state);
    if (leads.length) { body.append(h('h3', '', 'Loose threads')); for (const l of leads) body.append(h('div', 'lf-note lead', `${l.about ? face(l.about) : ''}<div><span>${esc(l.text)}</span></div>`)); }
    const groups = [['The boathouse', ['method', 'trait']], ['Where they say they were', ['claim', 'alibi', 'break']], ['Reasons', ['motive']], ['Talk on the quay', ['rumour']]];
    for (const [label, cats] of groups) {
      const list = found.filter((c) => cats.includes(c.cat));
      if (!list.length) continue;
      body.append(h('h3', '', label));
      for (const c of list) body.append(h('div', 'lf-note', `${c.about ? face(c.about) : ''}<div><b>${esc(c.title)}</b><span>${esc(c.note)}</span></div>`));
    }
    if (!found.length) body.append(h('div', 'lf-note dim', '<div><span>Nothing written down yet. Investigate places, and get people talking.</span></div>'));
  }
  function nbSuspects(body, redraw) {
    body.append(h('p', '', 'Five people could have done it. Mark who you suspect and who you have cleared; the marks are only for you.'));
    for (const s of SUSPECTS) {
      const st = S.suspectStatus(state, s), c = CAST[s];
      const card = h('div', `lf-sus mk-${st.mark}`);
      const traits = st.met ? Object.entries(c.traits).map(([k, v]) => `<span class="lf-chip">${TRAIT_TEXT[k][v]}</span>`).join('') : '<span class="lf-chip">Not yet met</span>';
      const alibi = st.alibi === 'confirmed' ? '<span class="lf-chip ok">Alibi holds</span>' : st.alibi === 'broken' ? '<span class="lf-chip bad">Alibi broken</span>' : st.claim ? '<span class="lf-chip">Alibi unchecked</span>' : '';
      card.innerHTML = `<div class="top">${st.met ? face(s) : silhouette()}<div><b class="lf-serif">${st.met ? c.name : S.STRANGERS[s]}</b><span>${c.role}</span></div></div><div class="lf-chips">${traits}${alibi}</div>`
        + (st.claim ? `<div class="line"><b>Says:</b> ${esc(st.claim.note)}</div>` : '') + (st.rumour ? `<div class="line"><b>Rumour:</b> ${esc(st.rumour.note)}</div>` : '');
      const marks = h('div', 'lf-marks');
      for (const [id, label, k] of [['suspect', 'Suspect', 's'], ['cleared', 'Cleared', 'c']]) marks.append(btn(`${k} ${st.mark === id ? 'on' : ''}`, label, () => { state.marks[s] = st.mark === id ? 'none' : id; saveRun(); redraw(); }));
      card.append(marks); body.append(card);
    }
  }
  function nbPeople(body) {
    for (const w of TOWNSFOLK) {
      const b = state.bonds[w], c = CAST[w], nb = S.nextBond(state, w), pr = S.bondProgress(state, w);
      const where = LOCATIONS.find((pl) => S.presentAt(state, pl).includes(w));
      const next = nb.maxed ? 'A true friend.' : nb.ready ? 'Ready for a heart-to-heart.' : nb.blocks.map((x) => x.text).join(' · ');
      const card = h('div', 'lf-sus');
      card.innerHTML = `<div class="top">${b.met ? face(w) : silhouette()}<div><b class="lf-serif">${b.met ? c.name : S.STRANGERS[w]}</b><span>${b.met ? c.role : 'You have not met.'}</span></div></div>`
        + (b.met ? `<div class="line">${esc(c.about)}</div><div class="lf-chips"><span class="lf-chip">${pips(b.rank)} &nbsp;Bond ${b.rank}</span><span class="lf-chip ${nb.ready ? 'ok' : ''}">${esc(next)}</span></div><div class="lf-bar" style="background:#e2d3b4"><i style="transform:scaleX(${pr.frac});background:#d9707a"></i></div>` : '')
        + `<div class="line" style="margin-top:8px"><b>Right now:</b> ${where ? `at the ${PLACES[where].short}` : 'nowhere to be found'}</div>`;
      body.append(card);
    }
  }
  function nbYou(body) {
    body.append(h('p', '', `<b>${esc(state.name)}</b>, lodger at the Steeping Heron.${state.keepsake ? ` Carrying: ${KEEPSAKES[state.keepsake].name}.` : ''}`));
    for (const st of STATS) {
      const pr = S.statProgress(state, st), info = STAT_INFO[st];
      body.append(h('div', 'lf-statrow', `<div class="t"><b class="lf-serif">${info.name}</b><span>${pips(pr.rank, 5, 'st')} ${pr.title}</span></div><div class="lf-bar"><i style="transform:scaleX(${pr.frac})"></i></div><span>${info.blurb}${pr.toNext ? ` ${pr.toNext} more to rank ${pr.rank + 1}.` : ' As good as it gets.'}</span>`));
    }
    body.append(h('h3', '', 'Where to practise'));
    for (const pl of LOCATIONS) { const a = PLACES[pl].activity; body.append(h('div', 'lf-note', `<div><b>${esc(a.title)}</b><span>${PLACES[pl].short}: ${Object.entries(a.xp).map(([s, n]) => `${STAT_INFO[s].name} +${n}`).join(', ')}</span></div>`)); }
  }
  function nbDiary(body) {
    if (!state.diary.length) { body.append(h('div', 'lf-note dim', '<div><span>The week has only just begun.</span></div>')); return; }
    let day = 0;
    for (const [d, slot, text] of state.diary) {
      if (d !== day) { day = d; body.append(h('h3', '', `Day ${d}`)); }
      body.append(h('div', 'lf-note', `<div><b>${SLOT_NAMES[slot]}</b><span>${esc(text)}</span></div>`));
    }
  }

  // ------------------------------------------------------------------ festival night
  function accuse() {
    const opt = S.finaleOptions(state, meta);
    const ans = { mode: 'accuse', accuse: null, motive: null, method: null, approach: null };
    let step = 0;
    const scr = h('div', 'lf-screen lf-form');
    const col = h('div', 'lf-col');
    scr.append(col); show(scr);
    const draw = () => {
      col.replaceChildren();
      col.append(h('div', 'lf-steps', [0, 1, 2, 3, 4].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')));
      const add = (html, fn, dis) => { const b = btn('lf-opt', html, fn); b.disabled = !!dis; b.style.animationDelay = `${col.children.length * 0.04}s`; col.append(b); return b; };
      if (step === 0) {
        col.append(h('h2', 'lf-serif', '"What have you found?"'), h('p', '', 'The whole of Vesper Quay is on the bridge, waiting.'));
        add('<div class="txt"><b>I know who took the Moon Lantern</b><span>Name them, and say how and why.</span></div>', () => { ans.mode = 'accuse'; step = 1; draw(); });
        add('<div class="txt"><b>I cannot be sure</b><span>Better no name than the wrong one.</span></div>', () => finish({ mode: 'pass' }));
        if (opt.canVerse) add('<div class="txt"><b>Say the Lighting Verse</b><span>Name nobody. Speak the old words, and see who answers.</span></div>', () => finish({ mode: 'verse' }));
      } else if (step === 1) {
        col.append(h('h2', 'lf-serif', 'Who took it?'));
        for (const s of opt.suspects) add(`${state.bonds[s].met ? face(s) : silhouette()}<div class="txt"><b>${state.bonds[s].met ? CAST[s].name : S.STRANGERS[s]}</b><span>${CAST[s].role}</span></div>`, () => { ans.accuse = s; step = 2; draw(); });
      } else if (step === 2) {
        col.append(h('h2', 'lf-serif', `Why would ${CAST[ans.accuse].short} do it?`));
        for (const m of opt.motives[ans.accuse]) add(`<div class="txt"><b>${esc(m.label)}</b></div>`, () => { ans.motive = m.id; step = 3; draw(); });
      } else if (step === 3) {
        col.append(h('h2', 'lf-serif', 'How did it leave the boathouse?'));
        for (const m of opt.methods) add(`<div class="txt"><b>${esc(m.label)}</b></div>`, () => { ans.method = m.id; step = 4; draw(); });
      } else {
        col.append(h('h2', 'lf-serif', 'And how will you say it?'), h('p', '', `${CAST[ans.accuse].name}. ${esc(opt.motives[ans.accuse].find((m) => m.id === ans.motive).label)}.`));
        for (const a of opt.approaches(ans.accuse)) {
          const chips = (a.reqs || []).map((q) => `<span class="lf-req ${q.met ? '' : 'no'}">${q.met ? '' : IC.lock}${STAT_INFO[q.stat].name} ${q.rank}</span>`).join('');
          add(`<div class="txt"><b>${esc(a.label)}</b><span>${esc(a.sub)}</span></div>${chips}`, () => finish({ ...ans, approach: a.id }), a.locked);
        }
      }
      const foot = h('div', 'lf-foot'); foot.style.marginTop = 'auto';
      if (step > 0) foot.append(btn('lf-btn alt', 'Back', () => { step -= 1; draw(); }));
      foot.append(btn('lf-btn alt', `Notebook`, () => notebook()));
      col.append(foot);
    };
    draw();
  }

  async function finish(ans) {
    const end = S.buildEnding(state, ans, meta);
    const draft = S.serialize(state);
    await playScene(draft, end.scene, 'Festival night');
    if (disposed) return;
    const { meta: m2, unlocks } = S.applyEnding(meta, state, end);
    meta = m2; saveMeta();
    state = null; saveRun();
    endingCards(end, unlocks);
  }
  function endingCards(end, unlocks) {
    const scr = h('div', 'lf-screen lf-end');
    scr.append(bgDiv('bridge', 2), h('div', 'shade'));
    const col = h('div', 'lf-col');
    scr.append(col); show(scr); sfx('level');
    const tone = ['gold', 'moon'].includes(end.tone) ? end.tone : 'dusk';
    const card = h('div', `lf-endcard ${tone}`, `<div class="k">${esc(end.kicker)}</div><h2 class="lf-serif">${esc(end.title)}</h2>${end.text.map((t) => `<p>${esc(t)}</p>`).join('')}${end.reveal ? `<div class="truth">${esc(end.reveal)}</div>` : ''}`);
    col.append(card);
    end.epilogueCards.forEach((e, i) => {
      const c = h('div', 'lf-endcard', `<div class="who">${face(e.who, 'happy')}<div><div class="k">Epilogue · ${CAST[e.who].short}</div><h2 class="lf-serif" style="font-size:28px;margin:2px 0 0">${esc(e.title)}</h2></div></div><p>${esc(e.text)}</p>`);
      c.style.animationDelay = `${0.3 + i * 0.15}s`; col.append(c);
    });
    unlocks.forEach((u, i) => { const n = h('div', 'lf-unlock', `${esc(u.text)}`); n.style.animationDelay = `${0.6 + i * 0.12}s`; col.append(n); });
    const c = S.completion(meta);
    col.append(h('div', 'lf-unlock', `${c.pct}% of Vesper Quay discovered. Next week, somebody else will have taken it, for another reason.`));
    col.append(btn('lf-btn', 'A new week', setup), btn('lf-btn alt', 'Endings and keepsakes', gallery), btn('lf-btn alt', 'Title', title));
  }

  // ------------------------------------------------------------------ gallery and settings
  function gallery() {
    const ov = paper('Endings and keepsakes', title);
    const body = ov.querySelector('.lf-pbody');
    const c = S.completion(meta);
    body.append(h('p', '', `<b>${c.pct}%</b> discovered over ${meta.runs} week${meta.runs === 1 ? '' : 's'}.`), h('div', 'lf-progress', `<i style="transform:scaleX(${c.pct / 100})"></i>`));
    body.append(h('h3', '', `Endings · ${c.endings} of ${c.endingsTotal}`));
    const g1 = h('div', 'lf-gal');
    for (const id of ENDING_ORDER) { const e = ENDINGS[id], got = meta.endings[id]; g1.append(h('div', `lf-gcard ${got ? (['gold', 'moon'].includes(e.tone) ? e.tone : '') : 'locked'}`, got ? `<b class="lf-serif">${esc(e.title)}</b><span>${esc(e.kicker)}${got > 1 ? ` · seen ${got} times` : ''}</span>` : `<b class="lf-serif">${e.secret ? 'A hidden ending' : 'Not yet seen'}</b><span>${esc(e.hint || '')}</span>`)); }
    body.append(g1);
    body.append(h('h3', '', `Epilogues · ${c.epis} of ${c.episTotal}`));
    const g2 = h('div', 'lf-gal');
    for (const w of TOWNSFOLK) { const e = EPILOGUES[w], got = meta.epilogues[w]; g2.append(h('div', `lf-gcard ${got ? '' : 'locked'}`, got ? `<b class="lf-serif">${CAST[w].short}: ${esc(e.title)}</b>` : `<b class="lf-serif">${CAST[w].short}</b><span>${esc(e.hint)}</span>`)); }
    body.append(g2);
    body.append(h('h3', '', `Case files · ${c.cases} of ${c.casesTotal}`));
    const g3 = h('div', 'lf-gal');
    for (const s of SUSPECTS) for (const m of ['a', 'b']) { const got = meta.cases[`${s}:${m}`]; g3.append(h('div', `lf-gcard ${got ? '' : 'locked'}`, got ? `<b class="lf-serif">${CAST[s].short}</b><span>${esc(MOTIVES[s][m].short)}</span>` : `<b class="lf-serif">${meta.solved.includes(s) ? CAST[s].short : 'Unsolved'}</b><span>Name the culprit and the true reason.</span>`)); }
    body.append(g3);
    body.append(h('h3', '', `The Lighting Verse · ${c.verse} of ${c.verseTotal}`));
    const known = S.verseLinesKnown(meta);
    const g4 = h('div', 'lf-gal');
    VERSE.forEach((v, i) => g4.append(h('div', `lf-gcard wide ${known[i] ? 'moon' : 'locked'}`, known[i] ? `<b class="lf-serif"><i>${esc(v.line)}</i></b>` : `<b class="lf-serif">A missing line</b><span>${esc(v.from)}</span>`)));
    body.append(g4, h('p', '', `<br>Know ${VERSE_NEEDED} lines, and you may speak the verse on festival night.`));
    body.append(h('h3', '', 'Keepsakes'));
    const have = S.keepsakesUnlocked(meta);
    const g5 = h('div', 'lf-gal');
    for (const k of Object.keys(KEEPSAKES)) g5.append(h('div', `lf-gcard wide ${have.includes(k) ? 'gold' : 'locked'}`, `<b class="lf-serif">${esc(KEEPSAKES[k].name)}</b><span>${have.includes(k) ? esc(KEEPSAKES[k].text) : esc(KEEPSAKES[k].unlock)}</span>`));
    body.append(g5);
    show(ov);
  }
  function settingsRows(body) {
    const row = (label, opts, get, set) => {
      const r = h('div', 'lf-setrow', `<span>${label}</span>`), seg = h('div', 'lf-seg');
      const draw = () => seg.replaceChildren(...opts.map(([v, t]) => btn(get() === v ? 'on' : '', t, () => { set(v); saveMeta(); draw(); })));
      draw(); r.append(seg); body.append(r);
    };
    row('Text speed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']], () => meta.settings.speed, (v) => { meta.settings.speed = v; });
    row('Sound', [[true, 'On'], [false, 'Off']], () => meta.settings.sfx, (v) => { meta.settings.sfx = v; });
  }
  function settings(back, inRun) {
    const ov = paper(inRun ? 'Paused' : 'Settings', back);
    const body = ov.querySelector('.lf-pbody');
    settingsRows(body);
    const help = btn('lf-btn alt', 'How to play', howToPlay);
    help.style.marginTop = '16px';
    body.append(help);
    if (inRun) { const b = btn('lf-btn', 'Leave to the title<small>Your week is saved</small>', title); b.style.marginTop = '10px'; body.append(b); }
    else body.append(h('p', '', '<br>Your week is saved after every morning, afternoon and evening.'));
    show(ov);
  }
  function howToPlay() {
    if (guide?.open) return;
    guide = openGuide(ctx.root, { className: 'lf-guide', pages: GUIDE_PAGES, doneLabel: 'Ask around', onClose() { guide = null; } });
  }

  const onKey = (e) => { if (keyHandler) keyHandler(e); };
  window.addEventListener('keydown', onKey);
  saveMeta();
  title();
  if (import.meta.env.DEV) window.__lf = { get state() { return state; }, set state(v) { state = v; }, S, resume, accuse, get meta() { return meta; }, set meta(v) { meta = v; } };

  return {
    dispose() {
      disposed = true;
      guide?.close();
      window.removeEventListener('keydown', onKey);
      for (const t of timers) clearTimeout(t);
      timers.clear();
      root.remove();
      if (import.meta.env.DEV) delete window.__lf;
    },
  };
}
