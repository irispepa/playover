// Mini-games for the hardware tickets: Wi-Fi placement, the printer jam and the reboot ritual.
// Each is mount(host, spec, api) -> { hint() }. api: { scope, sfx, pop, done, miss, say }.
import { wifiSignal, solve } from '../puzzles.js';
import { el, clamp } from '../dom.js';
import { icon, iconG } from '../icons.js';

// ---------- Wi-Fi: put the routers where every desk gets signal ----------
export function mountWifi(host, spec, api) {
  const { w, h } = spec;
  const walls = new Set(spec.walls), desks = new Set(spec.desks);
  const root = el(`<div class="pk-wf"><div class="pk-mg-note"></div><div class="pk-wf-grid" style="grid-template-columns:repeat(${w},1fr)"></div></div>`);
  const grid = root.lastElementChild, note = root.firstElementChild;
  const cells = [];
  for (let c = 0; c < w * h; c++) {
    const b = el(`<button class="pk-wf-cell ${walls.has(c) ? 'wall' : desks.has(c) ? 'desk' : ''}" data-c="${c}"><i></i>${desks.has(c) ? icon('monitor', 22) : ''}<span class="r">${icon('router', 24)}</span></button>`);
    cells.push(b); grid.append(b);
  }
  host.replaceChildren(root);
  let routers = [], finished = false;
  const render = () => {
    const sig = wifiSignal(spec, routers);
    let covered = 0;
    cells.forEach((b, c) => {
      b.firstElementChild.style.opacity = walls.has(c) ? 0 : Math.min(1, sig[c] / (spec.range + 1)) * 0.85;
      b.classList.toggle('has', routers.includes(c));
      if (desks.has(c)) { b.classList.toggle('ok', sig[c] > 0); if (sig[c] > 0) covered++; }
    });
    const left = spec.routers - routers.length;
    note.innerHTML = `${icon('router', 18)} <b>${left}</b> ${left === 1 ? 'router' : 'routers'} to place &nbsp; ${icon('monitor', 18)} <b>${covered}/${spec.desks.length}</b> desks online`;
    return covered === spec.desks.length;
  };
  api.scope.on(grid, 'click', (ev) => {
    const b = ev.target.closest('.pk-wf-cell');
    if (!b || finished) return;
    const c = +b.dataset.c;
    if (walls.has(c)) { api.say('That is a wall. Signal cannot get through walls, and neither can routers.'); api.sfx('nope'); return; }
    if (desks.has(c)) { api.say('That desk is taken. Put the router on an empty floor tile.'); api.sfx('nope'); return; }
    if (routers.includes(c)) routers = routers.filter((r) => r !== c);
    else { if (routers.length >= spec.routers) routers.shift(); routers.push(c); }
    api.sfx('place');
    if (render()) {
      finished = true;
      const r = grid.getBoundingClientRect();
      api.pop(r.left + r.width / 2, r.top + r.height / 2, 14);
      api.scope.timeout(() => api.done(), 700);
    } else if (routers.length === spec.routers) api.say('Some desks are still in the dark. Tap a router to pick it up, or tap a new tile to move one.');
  });
  render();
  return {
    hint() {
      const sol = solve(spec) || [];
      const c = sol.find((x) => !routers.includes(x));
      if (c == null) return;
      cells[c].classList.add('pk-pulse');
      api.scope.timeout(() => cells[c].classList.remove('pk-pulse'), 3200);
      api.say('Kettle sits on one tile and looks at you meaningfully.');
    },
  };
}

// ---------- printer: open the flaps in the order the paper travels ----------
export function mountPrinter(host, spec, api) {
  const S = 62, PAD = 34, W = spec.cols * S + PAD * 2, H = spec.rows * S + PAD * 2;
  const cx = (c) => PAD + (c % spec.cols) * S + S / 2, cy = (c) => PAD + ((c / spec.cols) | 0) * S + S / 2;
  const want = spec.flaps.filter((f) => f.at >= 0).sort((a, b) => a.at - b.at);
  const first = spec.path[0], last = spec.path[spec.path.length - 1];
  let svg = `<svg class="pk-pr" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="26" fill="#eef1f6"/><rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="18" fill="#dfe4ee"/>`;
  svg += `<path d="M${spec.path.map((c) => `${cx(c)} ${cy(c)}`).join('L')}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`;
  svg += `<path class="pk-pr-route" d="M${spec.path.map((c) => `${cx(c)} ${cy(c)}`).join('L')}" fill="none" stroke="#9aa3b8" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" stroke-linejoin="round"/>`;
  svg += `<g transform="translate(${cx(first)} ${cy(first)})"><rect x="-22" y="-17" width="44" height="34" rx="8" fill="#f6a81c"/><text y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="inherit">TRAY</text></g>`;
  svg += `<g transform="translate(${cx(last)} ${cy(last)})"><circle r="19" fill="#58b98f"/>${iconG('check', 0, 0, 20, '#fff', 3)}</g>`;
  for (const f of spec.flaps) svg += `<g class="pk-pr-flap" data-id="${f.id}" transform="translate(${cx(f.cell)} ${cy(f.cell)})"><rect x="-24" y="-24" width="48" height="48" fill="transparent"/><rect class="b" x="-20" y="-20" width="40" height="40" rx="11" fill="#5b6478"/><rect class="lid" x="-20" y="-20" width="40" height="15" rx="7" fill="#737d94"/><text y="9" text-anchor="middle" font-size="19" font-weight="900" fill="#fff" font-family="inherit">${f.id}</text></g>`;
  svg += `<g class="pk-pr-paper" style="transform:translate(${cx(first)}px,${cy(first) - 24}px)"><rect x="-9" y="-12" width="18" height="24" rx="2.500" fill="#fff" stroke="#c5ccda" stroke-width="1.500"/><path d="M-5 -5h10M-5 0h10M-5 5h6" stroke="#c5ccda" stroke-width="1.500"/></g></svg>`;
  host.innerHTML = svg;
  const root = host.firstElementChild, paper = root.querySelector('.pk-pr-paper');
  const flapEl = (id) => root.querySelector(`.pk-pr-flap[data-id="${id}"]`);
  let n = 0, finished = false;
  api.scope.on(root, 'click', (ev) => {
    const g = ev.target.closest('.pk-pr-flap');
    if (!g || finished) return;
    const f = spec.flaps.find((x) => x.id === g.dataset.id);
    if (g.classList.contains('pk-on')) return;
    const shake = () => { g.classList.add('pk-shake'); api.scope.timeout(() => g.classList.remove('pk-shake'), 400); };
    if (f.at < 0) { api.miss(); api.sfx('nope'); shake(); api.say(`The paper never passes flap ${f.id}. Follow the dotted line from the tray.`); return; }
    if (f.id !== want[n].id) { api.miss(); api.sfx('nope'); shake(); api.say(`Flap ${f.id} comes later. The paper reaches another flap first.`); return; }
    g.classList.add('pk-on'); api.sfx('click'); n++;
    paper.style.transform = `translate(${cx(f.cell)}px,${cy(f.cell)}px)`;
    if (n === want.length) {
      finished = true; api.sfx('paper');
      api.scope.timeout(() => { paper.style.transform = `translate(${cx(last)}px,${cy(last) - 26}px)`; }, 380);
      const r = root.getBoundingClientRect();
      api.scope.timeout(() => { api.pop(r.left + r.width / 2, r.top + r.height / 2, 12); api.done(); }, 900);
    }
  });
  return {
    hint() {
      if (finished) return;
      const g = flapEl(want[n].id);
      g.classList.add('pk-pulse');
      api.scope.timeout(() => g.classList.remove('pk-pulse'), 3200);
      api.say('Kettle bats at one flap. The paper goes there next.');
    },
  };
}

// ---------- reboot: hold to switch off, then tap in time to wake it up ----------
export function mountReboot(host, spec, api) {
  const root = el(`<div class="pk-rb"><div class="pk-rb-screen frozen"><div class="pk-rb-spin"></div><div class="pk-rb-log"></div><div class="pk-rb-face">${icon('check', 54)}</div></div>
    <div class="pk-rb-bar"><div class="pk-rb-zone"></div><div class="pk-rb-dot"></div></div>
    <button class="pk-rb-btn"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#f0dfc4" stroke-width="8"/><circle class="ring" cx="50" cy="50" r="45" fill="none" stroke="#f6a81c" stroke-width="8" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283" transform="rotate(-90 50 50)"/></svg>${icon('power', 44)}</button>
    <div class="pk-rb-tip">Hold the button until the screen goes dark</div></div>`);
  host.replaceChildren(root);
  const screen = root.querySelector('.pk-rb-screen'), log = root.querySelector('.pk-rb-log'), bar = root.querySelector('.pk-rb-bar');
  const zone = root.querySelector('.pk-rb-zone'), dot = root.querySelector('.pk-rb-dot'), btn = root.querySelector('.pk-rb-btn'), ring = root.querySelector('.ring'), tip = root.querySelector('.pk-rb-tip');
  let phase = 'hold', held = 0, holding = false, beat = 0, t = 0, pos = 0, widen = 1, slow = 1, finished = false;
  const setBeat = () => {
    const b = spec.beats[beat];
    widen = 1; slow = 1; t = b.dir > 0 ? 0 : 1;
    zone.style.left = `${(b.pos - b.window / 2) * 100}%`; zone.style.width = `${b.window * 100}%`;
    tip.textContent = `Tap when the light is in the glow (${beat + 1} of ${spec.beats.length})`;
  };
  const sizeZone = () => { const b = spec.beats[beat]; const wd = Math.min(0.6, b.window * widen); zone.style.left = `${clamp(b.pos - wd / 2, 0, 1 - wd) * 100}%`; zone.style.width = `${wd * 100}%`; };
  api.scope.raf((dt) => {
    if (phase === 'hold') {
      if (holding) {
        held += dt;
        if (held >= spec.hold) {
          holding = false; phase = 'wait'; api.sfx('off');
          screen.classList.remove('frozen'); screen.classList.add('dark');
          ring.setAttribute('stroke-dashoffset', '283');
          tip.textContent = 'Off. Give it a moment…';
          api.scope.timeout(() => { phase = 'beats'; bar.classList.add('on'); screen.classList.add('boot'); setBeat(); }, 900);
        }
      } else held = Math.max(0, held - dt * 2);
      if (phase === 'hold') ring.setAttribute('stroke-dashoffset', String(283 * (1 - held / spec.hold)));
    } else if (phase === 'beats') {
      const b = spec.beats[beat];
      t += (dt / b.speed) * slow;
      const u = t % 2;
      pos = u <= 1 ? u : 2 - u;
      dot.style.left = `${pos * 100}%`;
    }
  });
  const down = (ev) => {
    ev.preventDefault();
    if (finished) return;
    if (phase === 'hold') { holding = true; api.sfx('tap'); return; }
    if (phase !== 'beats') return;
    const b = spec.beats[beat];
    if (Math.abs(pos - b.pos) <= (b.window * widen) / 2) {
      api.sfx('beep');
      log.append(el(`<div>${icon('check', 14)} ${spec.lines[beat] || 'Starting up'}</div>`));
      beat++;
      if (beat >= spec.beats.length) {
        finished = true; phase = 'done'; bar.classList.remove('on');
        api.scope.timeout(() => { api.sfx('boot'); screen.classList.add('happy'); tip.textContent = 'Good as new.'; }, 300);
        const r = screen.getBoundingClientRect();
        api.scope.timeout(() => { api.pop(r.left + r.width / 2, r.top + r.height / 2, 14); api.done(); }, 1100);
      } else setBeat();
    } else {
      api.miss(); api.sfx('nope');
      widen += 0.4; sizeZone();
      api.say(pos < b.pos ? 'A touch early. No harm done: the glow just got wider.' : 'A touch late. No harm done: the glow just got wider.');
    }
  };
  const up = () => { if (phase === 'hold' && holding) { holding = false; if (held < spec.hold) api.say('Keep holding. It needs a good long press.'); } };
  api.scope.on(btn, 'pointerdown', down);
  api.scope.on(btn, 'pointerup', up);
  api.scope.on(btn, 'pointerleave', up);
  api.scope.on(btn, 'pointercancel', up);
  api.scope.on(btn, 'contextmenu', (e) => e.preventDefault());
  return {
    hint() {
      if (phase === 'beats') { slow = 0.45; widen += 0.3; sizeZone(); api.say('Kettle rests a paw on the light and slows it down.'); }
      else api.say('Press and hold the round button. Count to two.');
    },
  };
}
