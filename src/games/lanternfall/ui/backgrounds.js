// Painted backdrops for the six places of Vesper Quay, each in morning, afternoon and evening light.
// background(place, time) returns an SVG string that fills its box (slice).
const W = 400, H = 640;
const SKY = [['#f7c9b2', '#fbe6cf', '#cfe6ea'], ['#7fc1e3', '#bfe3ee', '#f8e7bd'], ['#17133a', '#3f2c68', '#c96f7a']];
const r = (x, y, w, h, fill, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const c = (x, y, rad, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" ${extra}/>`;
const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ln = (d, stroke, w = 2, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const defs = (t, id) => `<defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[t][0]}"/><stop offset="0.55" stop-color="${SKY[t][1]}"/><stop offset="1" stop-color="${SKY[t][2]}"/></linearGradient>
<radialGradient id="glow${id}"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.95"/><stop offset="0.35" stop-color="#f6b65a" stop-opacity="0.4"/><stop offset="1" stop-color="#f6b65a" stop-opacity="0"/></radialGradient>
<radialGradient id="moon${id}"><stop offset="0" stop-color="#fff7e0" stop-opacity="0.9"/><stop offset="1" stop-color="#fff7e0" stop-opacity="0"/></radialGradient></defs>`;

function skyBox(t, id, x, y, w, h, seed = 7) {
  let s = r(x, y, w, h, `url(#sky${id})`);
  const R = rnd(seed);
  if (t === 2) {
    for (let i = 0; i < 26; i++) s += c(x + R() * w, y + R() * h * 0.6, 0.6 + R() * 1.1, '#fff6dc', `opacity="${0.4 + R() * 0.6}"`);
    s += c(x + w * 0.76, y + h * 0.2, 34, `url(#moon${id})`) + c(x + w * 0.76, y + h * 0.2, 13, '#fff3d2');
  } else {
    const sx = x + w * (t === 0 ? 0.22 : 0.7), sy = y + h * (t === 0 ? 0.62 : 0.2);
    s += c(sx, sy, 46, `url(#moon${id})`) + c(sx, sy, 16, t === 0 ? '#ffe9c4' : '#fff6d8');
    for (let i = 0; i < 3; i++) { const cx = x + R() * w, cy = y + h * (0.12 + R() * 0.3); s += `<ellipse cx="${cx}" cy="${cy}" rx="${30 + R() * 22}" ry="${7 + R() * 4}" fill="#fff" opacity="${t === 0 ? 0.55 : 0.7}"/>`; }
  }
  return s;
}
// A row of tall canal houses with stepped gables. Windows glow after dark.
function houses(t, x0, x1, base, hMin, hMax, seed, pal) {
  const R = rnd(seed); let s = ''; let x = x0;
  while (x < x1) {
    const w = 30 + R() * 22, h = hMin + R() * (hMax - hMin), col = pal[Math.floor(R() * pal.length)], top = base - h;
    s += r(x, top, w, h, col) + p(`M${x - 2} ${top}L${x + w / 2} ${top - 12 - R() * 14}L${x + w + 2} ${top}Z`, shade(col, -0.18));
    const cols = w > 40 ? 3 : 2, rows = Math.floor(h / 22);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const lit = t === 2 && R() < 0.62;
      s += r(x + 5 + i * ((w - 10) / cols) + 1, top + 8 + j * 22, (w - 10) / cols - 4, 12, lit ? '#ffd27a' : t === 2 ? '#2a2550' : shade(col, -0.35), 1.5);
    }
    x += w + 1;
  }
  return s;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}
function water(t, y, h, seed) {
  const R = rnd(seed), col = t === 2 ? '#1d2452' : t === 0 ? '#7fb3bd' : '#4f9fb5';
  let s = r(0, y, W, h, col);
  for (let i = 0; i < 26; i++) { const yy = y + 6 + R() * (h - 10), xx = R() * W, len = 14 + R() * 40; s += ln(`M${xx} ${yy}h${len}`, t === 2 ? (R() < 0.4 ? '#ffd27a' : '#8f8fd0') : '#ffffff', 1.6, `opacity="${0.18 + R() * 0.3}"`); }
  return s;
}
function lanterns(t, id, x1, y1, x2, y2, n, sag = 18) {
  const cols = ['#f6c56b', '#ef8d6b', '#e8736f', '#8fd3c8', '#f3e2a4'];
  let s = ln(`M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}`, t === 2 ? '#0e0b24' : '#5b4a52', 1.4);
  for (let i = 1; i < n; i++) {
    const u = i / n, x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * ((x1 + x2) / 2) + u * u * x2, y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * ((y1 + y2) / 2 + sag * 2) + u * u * y2;
    if (t === 2) s += c(x, y + 9, 16, `url(#glow${id})`, 'opacity="0.55"');
    s += `<ellipse cx="${x}" cy="${y + 9}" rx="5.500" ry="7.500" fill="${cols[i % cols.length]}" opacity="${t === 2 ? 1 : 0.92}"/>` + r(x - 2.5, y + 1, 5, 2, '#5b4a52');
  }
  return s;
}
const lamp = (id, x, y, lit, size = 1) => (lit ? c(x, y, 70 * size, `url(#glow${id})`) : '') + `<ellipse cx="${x}" cy="${y}" rx="${9 * size}" ry="${12 * size}" fill="${lit ? '#ffe2a0' : '#e9d6ae'}"/>` + r(x - 5 * size, y - 15 * size, 10 * size, 4 * size, '#5b4a3a', 1);
const dusk = (t) => (t === 2 ? r(0, 0, W, H, '#191340', 0, 'opacity="0.46"') : t === 0 ? r(0, 0, W, H, '#ffcfa8', 0, 'opacity="0.1"') : '');

const SCENES = {
  bridge(t, id) {
    const pal = ['#d98f7c', '#e9c39a', '#b7786f', '#c9a3b4', '#e2a56b', '#9fb7a8'];
    let s = skyBox(t, id, 0, 0, W, 330) + houses(t, -10, 410, 330, 90, 190, 11, pal.map((x) => shade(x, -0.25))) + water(t, 330, 310, 3);
    // far houses' reflection, the bridge and its arch
    s += r(0, 330, W, 60, '#000', 0, 'opacity="0.1"');
    s += p('M-10 300H410V356H-10Z', t === 2 ? '#3a3360' : '#b9a79c') + p('M-10 290H410V304H-10Z', t === 2 ? '#4a4276' : '#d3c3b6')
      + p('M110 356C110 300 290 300 290 356Z', t === 2 ? '#1d2452' : '#4f9fb5') + p('M110 356C110 300 290 300 290 356', 'none', `stroke="${t === 2 ? '#2a2550' : '#9a877c'}" stroke-width="7"`);
    for (let x = 6; x < W; x += 28) s += r(x, 276, 5, 16, t === 2 ? '#4a4276' : '#d3c3b6', 2);
    s += lanterns(t, id, -10, 228, 200, 236, 7) + lanterns(t, id, 200, 236, 410, 222, 7);
    s += r(196, 180, 8, 112, '#3a2f3f', 3) + lamp(id, 200, 178, t === 2, 1.2);
    return s;
  },
  lighthouse(t, id) {
    let s = skyBox(t, id, 0, 0, W, 420, 5) + water(t, 400, 240, 9);
    s += p('M-10 430C60 380 150 384 210 410C260 392 330 396 410 430V640H-10Z', t === 2 ? '#2c2a4e' : '#7f8a86') + p('M-10 470C80 440 200 446 410 474V640H-10Z', t === 2 ? '#23213f' : '#69736f');
    s += p('M150 404L166 150H234L250 404Z', '#f3ece0') + p('M158 320L162 262H238L242 320Z', '#c9524a') + p('M165 206L167 176H233L235 206Z', '#c9524a')
      + r(156, 132, 88, 20, '#3a3550', 3) + r(170, 92, 60, 42, t === 2 ? '#ffe2a0' : '#bfe3ee', 4) + ln('M190 92v42M210 92v42', '#3a3550', 3) + p('M164 94L200 60L236 94Z', '#c9524a') + r(198, 44, 4, 18, '#3a3550')
      + r(188, 356, 24, 48, '#5b4a3a', 12) + r(192, 232, 14, 20, '#3a3550', 7);
    if (t === 2) s += p('M230 104L420 30V150Z', '#ffe9b0', 'opacity="0.28"') + p('M170 104L-20 60V140Z', '#ffe9b0', 'opacity="0.16"') + c(200, 112, 80, `url(#glow${id})`);
    const R = rnd(4);
    for (let i = 0; i < 4; i++) { const x = 40 + R() * 320, y = 60 + R() * 140; s += ln(`M${x - 8} ${y}q4 -6 8 0q4 -6 8 0`, t === 2 ? '#bdb7dc' : '#5b5560', 1.8); }
    return s;
  },
  teahouse(t, id) {
    const wall = '#e6c9a8';
    let s = r(0, 0, W, H, wall) + r(0, 430, W, 210, '#8a5a44');
    for (let x = 0; x < W; x += 50) s += ln(`M${x} 430V640`, '#74483a', 1.5, 'opacity="0.5"');
    // arched window on the canal
    s += `<clipPath id="win${id}"><path d="M90 400V190C90 110 310 110 310 190V400Z"/></clipPath><g clip-path="url(#win${id})">${skyBox(t, id, 80, 110, 240, 300, 2)}${houses(t, 80, 320, 350, 40, 110, 5, ['#b7786f', '#c9a3b4', '#9c7f9e'])}${r(80, 350, 240, 60, t === 2 ? '#1d2452' : '#5fa9b8')}</g>`
      + p('M90 400V190C90 110 310 110 310 190V400Z', 'none', 'stroke="#6f4a3a" stroke-width="10"') + ln('M200 130V400M92 270H308', '#6f4a3a', 6) + r(74, 396, 252, 16, '#6f4a3a', 4);
    // shelves of pots
    for (const [x, y] of [[8, 150], [8, 250], [326, 150], [326, 250]]) {
      s += r(x, y, 66, 6, '#6f4a3a', 2);
      const cols = ['#c9524a', '#58b6a6', '#e9c46a', '#7a5a9e'];
      for (let i = 0; i < 3; i++) s += `<ellipse cx="${x + 12 + i * 21}" cy="${y - 10}" rx="8" ry="10" fill="${cols[(i + x + y) % 4]}"/>` + r(x + 8 + i * 21, y - 22, 8, 4, '#5b4a3a', 1);
    }
    // the Admiral on the sill
    s += p('M236 396c-4-18 4-30 16-30s20 12 16 30z', '#e9a25a') + c(262, 362, 10, '#e9a25a') + p('M254 356l-2-9l8 4zM270 356l3-9l-8 4z', '#e9a25a') + ln('M268 394q14 2 16 -10', '#e9a25a', 5);
    s += r(196, 0, 4, 60, '#5b4a3a') + dusk(t) + lamp(id, 198, 74, t !== 1, 1.3);
    if (t === 2) s += c(200, 260, 160, `url(#glow${id})`, 'opacity="0.35"');
    return s;
  },
  boathouse(t, id) {
    let s = skyBox(t, id, 60, 120, 280, 260, 8) + water(t, 330, 130, 6) + houses(t, 60, 340, 332, 30, 80, 2, ['#8f7f9e', '#b7786f', '#9fb7a8']);
    s += r(60, 330, 280, 14, '#000', 0, 'opacity="0.12"');
    // timber walls around the open water doors
    s += p('M0 0H400V640H0ZM70 130V420H330V130Z', '#6b4a3c', 'fill-rule="evenodd"');
    for (let x = 0; x < W; x += 34) s += ln(`M${x} 0V640`, '#553729', 2, 'opacity="0.55"');
    s += r(60, 118, 280, 14, '#4a3024', 3) + r(58, 118, 14, 310, '#4a3024', 3) + r(328, 118, 14, 310, '#4a3024', 3) + r(0, 420, W, 220, '#7d5946') + ln('M0 470H400M0 530H400M0 596H400', '#63432f', 2, 'opacity="0.6"');
    s += p('M0 60L200 0L400 60V84L200 26L0 84Z', '#4a3024');
    // the hook, the cord and the place where the moon was
    s += ln('M200 26V70', '#2f2018', 3) + ln('M200 70q-10 12 0 22', '#c9a24e', 4) + ln('M200 92q-12 16 0 30q12 -14 0 -30', '#e9d6ae', 2) + c(200, 150, 26, 'none', 'stroke="#f3e2a4" stroke-width="1.500" stroke-dasharray="3 6" opacity="0.7"');
    // a hull on the slip, coils of rope
    s += p('M92 404C120 446 280 446 308 404L296 398H104Z', '#c97a4a') + p('M92 404L104 398H296L308 404Z', '#8f5433') + ln('M112 412H288', '#f3e2a4', 3, 'opacity="0.7"');
    s += c(36, 300, 20, 'none', 'stroke="#d9b98a" stroke-width="7"') + c(36, 300, 9, 'none', 'stroke="#c9a66f" stroke-width="5"') + r(350, 250, 34, 60, '#8f5433', 3) + ln('M350 270h34M350 290h34', '#6b3f26', 2);
    s += dusk(t) + lamp(id, 30, 190, t === 2) + lamp(id, 372, 190, t === 2);
    return s;
  },
  archive(t, id) {
    let s = r(0, 0, W, H, '#4b3f5e') + r(0, 470, W, 170, '#6b4a3c');
    const R = rnd(21), cols = ['#c9524a', '#58b6a6', '#e9c46a', '#7a5a9e', '#e2a56b', '#5f7fc2', '#d9d0c0', '#8a4f6a'];
    for (const sx of [10, 262]) {
      s += r(sx, 40, 128, 430, '#3a2f3f', 4);
      for (let row = 0; row < 7; row++) {
        const y = 52 + row * 60; let x = sx + 6;
        s += r(sx + 4, y + 50, 120, 5, '#5b4a3a');
        while (x < sx + 118) { const w = 6 + R() * 9, h = 34 + R() * 14; s += r(x, y + 50 - h, w, h, cols[Math.floor(R() * cols.length)], 1); x += w + 1; }
      }
    }
    // the round window and a ladder
    s += `<clipPath id="rw${id}"><circle cx="200" cy="170" r="52"/></clipPath><g clip-path="url(#rw${id})">${skyBox(t, id, 140, 110, 120, 130, 6)}</g>` + c(200, 170, 52, 'none', 'stroke="#2a2233" stroke-width="9"') + ln('M200 118V222M148 170H252', '#2a2233', 5);
    s += ln('M116 470L150 90M150 470L184 90', '#b98a5a', 5) + [150, 220, 290, 360, 430].map((y) => ln(`M${120 + (470 - y) * 0.09} ${y}h34`, '#b98a5a', 4)).join('');
    // the desk
    s += r(196, 400, 190, 14, '#8f5433', 3) + r(206, 414, 10, 90, '#74432a') + r(366, 414, 10, 90, '#74432a') + r(300, 372, 60, 28, '#f1e3c8', 2, 'transform="rotate(-6 330 386)"') + r(230, 384, 46, 16, '#7a5a9e', 2) + r(236, 370, 40, 14, '#c9524a', 2);
    s += dusk(t) + r(248, 330, 4, 54, '#c9a24e') + p('M232 332h36l-8 -22h-20z', '#58b6a6') + (t !== 1 ? c(250, 356, 90, `url(#glow${id})`, 'opacity="0.8"') : '');
    return s;
  },
  workshop(t, id) {
    let s = r(0, 0, W, H, '#5e4638') + r(0, 440, W, 200, '#3f2d26');
    for (let y = 40; y < 440; y += 46) s += ln(`M0 ${y}H400`, '#4b362b', 2, 'opacity="0.6"');
    s += `<clipPath id="ww${id}"><rect x="250" y="120" width="120" height="150" rx="6"/></clipPath><g clip-path="url(#ww${id})">${skyBox(t, id, 250, 120, 120, 150, 3)}</g>` + r(250, 120, 120, 150, 'none', 6, 'stroke="#2f2018" stroke-width="8"') + ln('M310 120V270M250 195H370', '#2f2018', 5);
    // the furnace
    s += r(18, 250, 110, 190, '#3a2f2f', 10) + p('M40 440V330C40 290 106 290 106 330V440Z', '#1f1616') + p('M52 440C52 380 66 372 73 344C82 372 94 384 94 440Z', '#f6a53a') + p('M62 440C62 404 70 398 73 380C78 398 84 406 84 440Z', '#ffe08a') + r(50, 190, 30, 64, '#3a2f2f', 4);
    // the bench
    s += r(150, 400, 240, 16, '#b98a5a', 3) + r(162, 416, 12, 110, '#8f6a44') + r(366, 416, 12, 110, '#8f6a44') + r(180, 384, 40, 16, '#8fd3de', 3, 'opacity="0.8"') + r(240, 372, 12, 28, '#c9a24e', 2) + ln('M270 398l34 -22', '#d9d0c0', 4) + c(340, 388, 12, '#e9c46a');
    s += dusk(t);
    // lanterns hanging from the beam, always a little alight
    s += r(0, 30, W, 16, '#2f2018');
    const L = [[60, 110, '#f6c56b', 1.1], [130, 150, '#e8736f', 0.9], [200, 100, '#8fd3c8', 1.2], [226, 196, '#f3e2a4', 0.8], [296, 84, '#ef8d6b', 1], [352, 76, '#b79fe0', 0.9]];
    for (const [x, y, col, k] of L) {
      s += ln(`M${x} 46V${y - 16 * k}`, '#1f1616', 1.6) + c(x, y, 46 * k, `url(#glow${id})`, `opacity="${t === 2 ? 0.9 : 0.45}"`)
        + p(`M${x - 13 * k} ${y - 12 * k}h${26 * k}l${5 * k} ${14 * k}l-${5 * k} ${14 * k}h-${26 * k}l-${5 * k} -${14 * k}z`, col) + r(x - 9 * k, y - 18 * k, 18 * k, 6 * k, '#3a2f2f', 2) + r(x - 6 * k, y + 16 * k, 12 * k, 4 * k, '#3a2f2f', 1) + ln(`M${x} ${y - 12 * k}v${28 * k}`, '#fff', 1, 'opacity="0.35"');
    }
    s += c(73, 400, 120, `url(#glow${id})`, 'opacity="0.7"');
    return s;
  },
};

const cache = new Map();
let uid = 0;
export function background(place, time = 1) {
  const key = `${place}:${time}`;
  if (!cache.has(key)) {
    const id = `${place}${time}_${uid++}`;
    cache.set(key, `<svg class="lf-bgsvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs(time, id)}${(SCENES[place] || SCENES.bridge)(time, id)}</svg>`);
  }
  return cache.get(key);
}
