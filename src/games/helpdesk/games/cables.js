// Mini-game: drag each plug to its port. Level 1 matches colour and shape; later levels are a tangle to trace.
import { localPoint, clamp } from '../dom.js';
import { iconG } from '../icons.js';

const W = 340, H = 430;
const NEUTRAL = '#8f96a8';

function shapeG(shape, x, y, r, fill, stroke = 'none', sw = 0) {
  const a = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
  switch (shape) {
    case 'square': return `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="2" ${a}/>`;
    case 'triangle': return `<path d="M${x} ${y - r}L${x + r} ${y + r * 0.8}H${x - r}Z" ${a}/>`;
    case 'hex': return `<path d="M${x - r} ${y}L${x - r / 2} ${y - r * 0.87}H${x + r / 2}L${x + r} ${y}L${x + r / 2} ${y + r * 0.87}H${x - r / 2}Z" ${a}/>`;
    case 'diamond': return `<path d="M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z" ${a}/>`;
    case 'pill': return `<rect x="${x - r}" y="${y - r * 0.55}" width="${r * 2}" height="${r * 1.1}" rx="${r * 0.55}" ${a}/>`;
    default: return `<circle cx="${x}" cy="${y}" r="${r}" ${a}/>`;
  }
}

export default function mountCables(host, spec, api) {
  const n = spec.n;
  const X = (i) => (W / (n + 1)) * (i + 1) + (n === 3 ? 0 : 0);
  const DEV_Y = 36, HOME_Y = 250, PORT_Y = 376;
  const match = spec.mode === 'match';
  const showTag = spec.tagged && !match;
  const item = (k) => spec.items[spec.plugOrder[k]];

  function cablePath(k, px, py) {
    const i = spec.plugOrder[k];
    const x0 = X(i), y0 = DEV_Y + 22, y1 = py - 18;
    if (match || showTag) return `M${x0} ${y0}C${x0} ${y0 + 80} ${px} ${y1 - 90} ${px} ${y1}`;
    const mid = clamp((x0 + px) / 2 + spec.wobble[i] * 80, 24, W - 24);
    const my = 138 + spec.wobble[i] * 14;
    return `M${x0} ${y0}C${x0} ${y0 + 44} ${mid} ${my - 44} ${mid} ${my}S${px} ${y1 - 60} ${px} ${y1}`;
  }

  let svg = `<svg class="pk-cb" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
  svg += `<rect x="6" y="4" width="${W - 12}" height="62" rx="16" fill="#fff" opacity=".7"/>`;
  svg += `<rect x="6" y="${PORT_Y - 58}" width="${W - 12}" height="106" rx="18" fill="#5b6478"/><rect x="14" y="${PORT_Y - 26}" width="${W - 28}" height="66" rx="12" fill="#4a5265"/>`;
  // ports
  spec.portOrder.forEach((it, j) => {
    const x = X(j), d = spec.items[it];
    svg += `<g class="pk-cb-port" data-j="${j}"><rect x="${x - 21}" y="${PORT_Y - 20}" width="42" height="42" rx="11" fill="#2f3546" stroke="${match ? d.color : '#8f96a8'}" stroke-width="2.500"/>`;
    if (match) svg += shapeG(d.shape, x, PORT_Y + 1, 9, 'none', d.color, 2.500);
    else svg += `<rect x="${x - 9}" y="${PORT_Y - 6}" width="5" height="13" rx="2" fill="#12151f"/><rect x="${x + 4}" y="${PORT_Y - 6}" width="5" height="13" rx="2" fill="#12151f"/>`;
    if (!match) svg += `<rect x="${x - 15}" y="${PORT_Y - 52}" width="30" height="26" rx="8" fill="#fff"/>${iconG(d.dev, x, PORT_Y - 39, 19, '#4b3a33', 2)}`;
    svg += `</g>`;
  });
  // cables (under plugs), then devices
  for (let k = 0; k < n; k++) svg += `<path class="pk-cb-cable" data-k="${k}" d="${cablePath(k, X(k), HOME_Y)}" fill="none" stroke="${match ? item(k).color : '#7d7482'}" stroke-width="5.500" stroke-linecap="round"/>`;
  for (let k = 0; k < n; k++) svg += `<path class="pk-cb-shine" data-k="${k}" d="${cablePath(k, X(k), HOME_Y)}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.500" stroke-linecap="round"/>`;
  spec.items.forEach((d, i) => {
    svg += `<g class="pk-cb-dev" data-i="${i}"><circle cx="${X(i)}" cy="${DEV_Y}" r="22" fill="#fff" stroke="#f0dfc4" stroke-width="2.500"/>${iconG(d.dev, X(i), DEV_Y, 24, '#4b3a33', 2)}</g>`;
  });
  // plugs
  for (let k = 0; k < n; k++) {
    const d = item(k);
    const body = match ? d.color : NEUTRAL;
    svg += `<g class="pk-cb-plug" data-k="${k}" transform="translate(${X(k)} ${HOME_Y})"><circle class="pk-cb-ring" r="27" fill="none" stroke="#f6a81c" stroke-width="3" opacity="0"/>`
      + `<rect x="-8.500" y="12" width="5" height="10" rx="2" fill="#d9dde6"/><rect x="3.500" y="12" width="5" height="10" rx="2" fill="#d9dde6"/>`
      + `<rect x="-16" y="-18" width="32" height="32" rx="9" fill="${body}"/><rect x="-16" y="-18" width="32" height="12" rx="6" fill="rgba(255,255,255,.22)"/>`
      + (match ? shapeG(d.shape, 0, -2, 8, '#fff') : showTag ? `<rect x="-11" y="-13" width="22" height="22" rx="6" fill="#fff"/>${iconG(d.dev, 0, -2, 16, d.color, 2.200)}` : `<circle cx="0" cy="-2" r="4" fill="rgba(255,255,255,.55)"/>`)
      + `</g>`;
  }
  svg += `</svg>`;
  host.innerHTML = svg;
  const root = host.firstElementChild;
  const plugs = [...root.querySelectorAll('.pk-cb-plug')];
  const cables = [...root.querySelectorAll('.pk-cb-cable')];
  const shines = [...root.querySelectorAll('.pk-cb-shine')];
  const ports = [...root.querySelectorAll('.pk-cb-port')];
  const pos = plugs.map((_, k) => ({ x: X(k), y: HOME_Y }));
  const locked = new Array(n).fill(-1);            // plug k -> port j
  const taken = new Array(n).fill(false);
  let drag = null, selected = -1, finished = false;

  const place = (k, x, y) => {
    pos[k] = { x, y };
    plugs[k].setAttribute('transform', `translate(${x} ${y})`);
    const d = cablePath(k, x, y);
    cables[k].setAttribute('d', d); shines[k].setAttribute('d', d);
  };
  const tween = (k, tx, ty, ms = 260, then = null) => {
    const sx = pos[k].x, sy = pos[k].y;
    let t = 0;
    const stop = api.scope.raf((dt) => {
      t = Math.min(1, t + dt / ms);
      const e = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.06;   // ease out with a little overshoot
      place(k, sx + (tx - sx) * e, sy + (ty - sy) * e);
      if (t >= 1) { stop(); place(k, tx, ty); if (then) then(); }
    });
  };
  const select = (k) => {
    selected = k;
    plugs.forEach((p, i) => p.querySelector('.pk-cb-ring').setAttribute('opacity', i === k ? '1' : '0'));
  };
  const nearestPlug = (p) => {
    let best = -1, bd = 40;
    for (let k = 0; k < n; k++) { if (locked[k] >= 0) continue; const d = Math.hypot(pos[k].x - p.x, pos[k].y - p.y); if (d < bd) { bd = d; best = k; } }
    return best;
  };
  const nearestPort = (p) => {
    let best = -1, bd = 44;
    for (let j = 0; j < n; j++) { if (taken[j]) continue; const d = Math.hypot(X(j) - p.x, PORT_Y - p.y); if (d < bd) { bd = d; best = j; } }
    return best;
  };
  const attempt = (k, j) => {
    if (spec.portOrder[j] === spec.plugOrder[k]) {
      locked[k] = j; taken[j] = true; select(-1);
      plugs[k].classList.add('pk-locked');
      cables[k].setAttribute('stroke', item(k).color);
      ports[j].classList.add('pk-on');
      root.querySelector(`.pk-cb-dev[data-i="${spec.plugOrder[k]}"]`).classList.add('pk-on');
      tween(k, X(j), PORT_Y - 14, 160);
      api.sfx('place');
      const r = ports[j].getBoundingClientRect();
      api.pop(r.left + r.width / 2, r.top + r.height / 2, 8);
      if (locked.every((v) => v >= 0) && !finished) { finished = true; api.scope.timeout(() => api.done(), 650); }
    } else {
      api.miss(); api.sfx('nope');
      ports[j].classList.add('pk-shake');
      api.scope.timeout(() => ports[j].classList.remove('pk-shake'), 400);
      api.say(match ? 'Not that one. Match the colour and the shape.' : showTag ? 'Not that one. Check the little tag on the plug.' : 'Not that one. Follow the cable up to see what it belongs to.');
      tween(k, X(k), HOME_Y, 300);
    }
  };

  api.scope.on(root, 'pointerdown', (ev) => {
    if (finished) return;
    const p = localPoint(root, ev, W, H);
    const k = nearestPlug(p);
    if (k >= 0) {
      drag = { k, ox: pos[k].x - p.x, oy: pos[k].y - p.y, sx: p.x, sy: p.y, moved: false };
      try { root.setPointerCapture(ev.pointerId); } catch { /* fine */ }
      plugs[k].classList.add('pk-drag');
      root.append(plugs[k]);                        // bring to front
      api.sfx('tap');
      return;
    }
    const j = nearestPort(p);
    if (j >= 0 && selected >= 0) attempt(selected, j);
  });
  api.scope.on(root, 'pointermove', (ev) => {
    if (!drag) return;
    const p = localPoint(root, ev, W, H);
    if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
    place(drag.k, clamp(p.x + drag.ox, 18, W - 18), clamp(p.y + drag.oy, 110, H - 30));
  });
  const end = (ev) => {
    if (!drag) return;
    const { k, moved } = drag;
    drag = null;
    plugs[k].classList.remove('pk-drag');
    try { root.releasePointerCapture(ev.pointerId); } catch { /* fine */ }
    if (!moved) { select(selected === k ? -1 : k); tween(k, X(k), HOME_Y, 120); if (selected === k) api.say('Now tap the port it belongs in, or drag it there.'); return; }
    const j = nearestPort({ x: pos[k].x, y: pos[k].y + 8 });
    if (j >= 0) attempt(k, j); else tween(k, X(k), HOME_Y, 260);
  };
  api.scope.on(root, 'pointerup', end);
  api.scope.on(root, 'pointercancel', end);

  return {
    hint() {
      const k = locked.findIndex((v) => v < 0);
      if (k < 0) return;
      const j = spec.portOrder.indexOf(spec.plugOrder[k]);
      cables[k].setAttribute('stroke', item(k).color);
      cables[k].classList.add('pk-glowline');
      ports[j].classList.add('pk-pulse');
      select(k);
      api.scope.timeout(() => { cables[k].classList.remove('pk-glowline'); ports[j].classList.remove('pk-pulse'); }, 3200);
      api.say('Kettle paws at one cable. Follow the glowing one.');
    },
  };
}
