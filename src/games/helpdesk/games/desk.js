// Mini-games for the organising tickets: the shared calendar and the messy desktop (tidy, or find a lost file).
// Each is mount(host, spec, api) -> { hint() }. api: { scope, sfx, pop, done, miss, say, who }.
import { calendarProblems, solve } from '../puzzles.js';
import { WEEKDAYS, FILE_KINDS } from '../stories.js';
import { el, esc, clamp } from '../dom.js';
import { icon } from '../icons.js';

const popAt = (api, node, n = 12) => { const r = node.getBoundingClientRect(); api.pop(r.left + r.width / 2, r.top + r.height / 2, n); };
const KIND_ICON = { photo: 'photo', doc: 'doc', music: 'music', sheet: 'sheet', bin: 'trash' };
const KIND_COL = { photo: '#5aa7e0', doc: '#f6a81c', music: '#a98be6', sheet: '#58b98f', bin: '#8f96a8' };

// ---------- calendar: every group gets its sessions, no two on one day, nobody sharing a slot ----------
export function mountCalendar(host, spec, api) {
  const cells = spec.days * spec.slots;
  const assign = new Array(cells).fill(-1);
  const root = el(`<div class="pk-cal"><div class="pk-cal-groups"></div><div class="pk-cal-grid"></div><div class="pk-mg-note">${icon('calendar', 18)} Pick a group, then tap the times that suit it. One session a day each.</div></div>`);
  host.replaceChildren(root);
  const groups = root.querySelector('.pk-cal-groups'), grid = root.querySelector('.pk-cal-grid');
  let cur = 0, finished = false, pulse = -1;
  const count = (g) => assign.filter((v) => v === g).length;
  const render = () => {
    groups.replaceChildren(...spec.groups.map((g, gi) => el(`<button class="pk-cal-g ${gi === cur ? 'on' : ''} ${count(gi) === g.need ? 'done' : ''}" data-g="${gi}" style="--c:${g.color}"><i></i>${esc(g.name)} <b>${count(gi)}/${g.need}</b></button>`)));
    let html = '<span></span>' + WEEKDAYS.slice(0, spec.days).map((d) => `<span class="hd">${d.slice(0, 3)}</span>`).join('');
    for (let sl = 0; sl < spec.slots; sl++) {
      html += `<span class="hd side">${['Morning', 'Afternoon', 'Evening'][sl]}</span>`;
      for (let d = 0; d < spec.days; d++) {
        const c = d * spec.slots + sl, a = assign[c];
        const dots = spec.groups.map((g, gi) => (g.avail[c] ? `<i style="background:${g.color}" class="${gi === cur ? 'cur' : ''}"></i>` : '')).join('');
        html += `<button class="pk-cal-c ${a >= 0 ? 'set' : ''} ${spec.groups[cur].avail[c] && a < 0 ? 'can' : ''} ${pulse === c ? 'pk-pulse' : ''}" data-c="${c}" style="${a >= 0 ? `background:${spec.groups[a].color}` : ''}">${a >= 0 ? esc(spec.groups[a].name.split(' ')[0]) : `<span class="dots">${dots}</span>`}</button>`;
      }
    }
    grid.style.gridTemplateColumns = `auto repeat(${spec.days}, 1fr)`;
    grid.innerHTML = html;
  };
  api.scope.on(root, 'click', (ev) => {
    if (finished) return;
    const g = ev.target.closest('.pk-cal-g');
    if (g) { cur = +g.dataset.g; api.sfx('tap'); render(); return; }
    const b = ev.target.closest('.pk-cal-c');
    if (!b) return;
    const c = +b.dataset.c, grp = spec.groups[cur], day = (c / spec.slots) | 0;
    pulse = -1;
    if (assign[c] === cur) { assign[c] = -1; api.sfx('tap'); render(); return; }
    if (assign[c] >= 0) { api.sfx('nope'); api.say(`${spec.groups[assign[c]].name} already has the room then. Tap it to free the slot.`); return; }
    if (!grp.avail[c]) { api.miss(); api.sfx('nope'); api.say(`${grp.name} cannot make that time. Look for their colour dot.`); return; }
    if (assign.some((v, k) => v === cur && ((k / spec.slots) | 0) === day)) { api.sfx('nope'); api.say(`${grp.name} already meets that day. Spread them out.`); return; }
    if (count(cur) >= grp.need) { api.sfx('nope'); api.say(`${grp.name} has all its sessions. Pick the next group.`); return; }
    assign[c] = cur; api.sfx('place');
    if (count(cur) === grp.need) { const nxt = spec.groups.findIndex((x, gi) => count(gi) < x.need); if (nxt >= 0) cur = nxt; }
    render();
    const p = calendarProblems(spec, assign);
    if (!p.clash && !p.missing.length) { finished = true; api.sfx('good'); popAt(api, grid, 14); api.scope.timeout(() => api.done(), 800); }
  });
  render();
  return {
    hint() {
      const sol = solve(spec);
      if (!sol) return;
      const bad = assign.findIndex((v, c) => v >= 0 && sol[c] !== v);
      if (bad >= 0) { assign[bad] = -1; api.say('Kettle walks across the calendar and knocks one booking off. It was in the way.'); render(); return; }
      const c = sol.findIndex((v, k) => v >= 0 && assign[k] < 0);
      if (c >= 0) { cur = sol[c]; pulse = c; render(); api.say('Kettle sits on a slot. It would suit this group nicely.'); }
    },
  };
}

// ---------- desktop: tidy files into folders, or find the one that was lost ----------
export function mountDesktop(host, spec, api) {
  return spec.mode === 'find' ? mountFind(host, spec, api) : mountTidy(host, spec, api);
}

function mountTidy(host, spec, api) {
  const root = el(`<div class="pk-dt"><div class="pk-dt-area"></div><div class="pk-dt-folders"></div></div>`);
  host.replaceChildren(root);
  const area = root.firstElementChild, folders = root.lastElementChild;
  spec.folders.forEach((f) => folders.append(el(`<div class="pk-dt-folder" data-k="${f.kind}" style="--c:${KIND_COL[f.kind]}">${icon(f.kind === 'bin' ? 'trash' : 'folder', 30)}<span>${esc(f.name)}</span></div>`)));
  const files = spec.files.map((f, i) => {
    const n = el(`<div class="pk-dt-file" data-i="${i}" style="left:${f.x * 100}%;top:${f.y * 100}%;--tilt:${f.tilt}deg;--c:${KIND_COL[f.kind === 'bin' ? fileKind(f.name) : f.kind]}">${icon(KIND_ICON[f.kind === 'bin' ? fileKind(f.name) : f.kind], 26)}<span>${esc(f.name)}</span></div>`);
    area.append(n); return n;
  });
  function fileKind(name) { const ext = name.split('.').pop(); return Object.keys(FILE_KINDS).find((k) => FILE_KINDS[k].ext === ext) || 'doc'; }
  const done = new Array(files.length).fill(false);
  let drag = null, selected = -1, finished = false;
  const folderAt = (x, y) => [...folders.children].find((n) => { const r = n.getBoundingClientRect(); return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 14 && y <= r.bottom + 10; });
  const select = (i) => { selected = i; files.forEach((n, k) => n.classList.toggle('sel', k === i)); };
  const drop = (i, folder) => {
    const f = spec.files[i], n = files[i];
    if (folder.dataset.k === f.kind) {
      done[i] = true; select(-1); api.sfx('place');
      const fr = folder.getBoundingClientRect(), ar = area.getBoundingClientRect();
      n.style.transition = 'left .25s, top .25s, transform .25s, opacity .25s';
      n.style.left = `${fr.left + fr.width / 2 - ar.left}px`; n.style.top = `${fr.top + fr.height / 2 - ar.top}px`; n.classList.add('gone');
      folder.classList.add('pk-on'); api.scope.timeout(() => folder.classList.remove('pk-on'), 350);
      api.pop(fr.left + fr.width / 2, fr.top + fr.height / 2, 5);
      if (done.every(Boolean)) { finished = true; api.sfx('good'); api.scope.timeout(() => api.done(), 650); }
    } else {
      api.miss(); api.sfx('nope');
      folder.classList.add('pk-shake'); api.scope.timeout(() => folder.classList.remove('pk-shake'), 400);
      n.style.left = `${f.x * 100}%`; n.style.top = `${f.y * 100}%`;
      api.say(f.kind === 'bin' ? `"${f.name}" is a spare copy. It can go in the Bin.` : `"${f.name}" belongs somewhere else. Look at its ending: .${f.name.split('.').pop()}`);
    }
  };
  api.scope.on(root, 'pointerdown', (ev) => {
    if (finished) return;
    const n = ev.target.closest('.pk-dt-file');
    if (n) {
      const i = +n.dataset.i;
      if (done[i]) return;
      const ar = area.getBoundingClientRect(), r = n.getBoundingClientRect();
      drag = { i, ox: r.left + r.width / 2 - ev.clientX, oy: r.top + r.height / 2 - ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: false, ar };
      n.style.transition = 'none'; n.classList.add('drag'); area.append(n);
      try { root.setPointerCapture(ev.pointerId); } catch { /* fine */ }
      api.sfx('tap'); return;
    }
    const f = folderAt(ev.clientX, ev.clientY);
    if (f && selected >= 0) drop(selected, f);
  });
  api.scope.on(root, 'pointermove', (ev) => {
    if (!drag) return;
    if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 6) drag.moved = true;
    const n = files[drag.i];
    n.style.left = `${clamp(ev.clientX + drag.ox - drag.ar.left, 20, drag.ar.width - 20)}px`;
    n.style.top = `${ev.clientY + drag.oy - drag.ar.top}px`;
  });
  const end = (ev) => {
    if (!drag) return;
    const { i, moved } = drag; drag = null;
    const n = files[i], f = spec.files[i];
    n.classList.remove('drag'); n.style.transition = '';
    try { root.releasePointerCapture(ev.pointerId); } catch { /* fine */ }
    if (!moved) { select(selected === i ? -1 : i); n.style.left = `${f.x * 100}%`; n.style.top = `${f.y * 100}%`; if (selected === i) api.say('Now tap the folder it belongs in, or drag it there.'); return; }
    const folder = folderAt(ev.clientX, ev.clientY);
    if (folder) drop(i, folder); else { n.style.left = `${f.x * 100}%`; n.style.top = `${f.y * 100}%`; }
  };
  api.scope.on(root, 'pointerup', end);
  api.scope.on(root, 'pointercancel', end);
  return {
    hint() {
      const i = done.findIndex((d) => !d);
      if (i < 0) return;
      const folder = folders.querySelector(`[data-k="${spec.files[i].kind}"]`);
      select(i); folder.classList.add('pk-pulse');
      api.scope.timeout(() => folder.classList.remove('pk-pulse'), 3200);
      api.say('Kettle pats one file towards its folder.');
    },
  };
}

function mountFind(host, spec, api) {
  const c = spec.clue;
  const root = el(`<div class="pk-fd"><div class="pk-mg-note">${icon(spec.backups ? 'cloud' : 'search', 18)} ${spec.backups ? 'The nightly backup has everything. ' : 'It may still be in the bin. '}Find <b>${esc(c.stem.replace(/_/g, ' '))}</b>, a ${c.kind === 'doc' ? 'piece of writing' : c.kind === 'sheet' ? 'spreadsheet' : 'photo'} last saved on <b>${c.dayName}</b>.</div><div class="pk-fd-list"></div></div>`);
  host.replaceChildren(root);
  const list = root.lastElementChild;
  spec.files.forEach((f, i) => list.append(el(`<button class="pk-fd-row" data-i="${i}" style="--c:${KIND_COL[f.kind]}">${icon(KIND_ICON[f.kind], 24)}<span class="n">${esc(f.name)}</span><span class="d">${WEEKDAYS[f.day]}</span></button>`)));
  let finished = false;
  api.scope.on(list, 'click', (ev) => {
    const b = ev.target.closest('.pk-fd-row');
    if (!b || finished) return;
    const i = +b.dataset.i, f = spec.files[i];
    if (i === spec.target) { finished = true; b.classList.add('right'); api.sfx('good'); popAt(api, b, 14); api.scope.timeout(() => api.done(), 800); return; }
    api.miss(); api.sfx('nope'); b.classList.add('out');
    api.say(f.name.startsWith(c.stem) ? `Right name, but that copy is from ${WEEKDAYS[f.day]}. They want ${c.dayName}'s.` : `That is "${f.name}". They are after ${c.stem.replace(/_/g, ' ')}.`);
  });
  return {
    hint() {
      const wrong = [...list.children].filter((b) => +b.dataset.i !== spec.target && !b.classList.contains('out')).slice(0, 3);
      wrong.forEach((b) => b.classList.add('out'));
      api.say('Kettle sits on a few files. Not those, then.');
    },
  };
}
