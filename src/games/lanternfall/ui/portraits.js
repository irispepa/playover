// The cast, drawn from one parametric rig so everybody belongs to the same picture book.
// portrait(who, expression) returns an SVG string (bust); face(who) a small head for chips and maps.
import { CAST } from '../data/cast.js';

const CX = 100, CY = 98;
const HEADS = {
  round: { w: 46, h: 52, jaw: 32 }, square: { w: 47, h: 52, jaw: 42 }, long: { w: 40, h: 58, jaw: 24 },
  wide: { w: 52, h: 51, jaw: 42 }, heart: { w: 45, h: 52, jaw: 21 }, oval: { w: 43, h: 55, jaw: 28 },
};

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}
const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ln = (d, stroke, w = 2.6, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

function headPath({ w, h, jaw }) {
  return `M${CX - w} ${CY - 6}C${CX - w} ${CY - h * 1.15} ${CX + w} ${CY - h * 1.15} ${CX + w} ${CY - 6}C${CX + w} ${CY + h * 0.56} ${CX + jaw} ${CY + h} ${CX} ${CY + h}C${CX - jaw} ${CY + h} ${CX - w} ${CY + h * 0.56} ${CX - w} ${CY - 6}Z`;
}
// The top of the skull, down to a hairline; `line` is the y of the hairline at the centre.
function capPath({ w, h }, line, grow = 3, side = 4) {
  const top = CY - h * 1.15 - grow * 1.6;
  return `M${CX - w - grow} ${CY + side}C${CX - w - grow} ${top} ${CX + w + grow} ${top} ${CX + w + grow} ${CY + side}C${CX + w - 8} ${line + 4} ${CX + w * 0.5} ${line} ${CX} ${line}C${CX - w * 0.5} ${line} ${CX - w + 8} ${line + 4} ${CX - w - grow} ${CY + side}Z`;
}

function outfit(L) {
  const c = L.outfitColor, c2 = L.outfit2, dark = shade(c, -0.22), lite = shade(c, 0.14);
  const body = p('M14 240C16 198 46 180 82 175L118 175C154 180 184 198 186 240Z', c);
  const neck = p('M84 138h32v40c-8 9-24 9-32 0z', shade(L.skin, -0.12));
  let d = '';
  switch (L.outfit) {
    case 'shawl':
      d = p('M60 180C74 196 90 214 100 240H40C30 220 40 196 60 180Z', dark) + p('M140 180C126 196 110 214 100 240H160C170 220 160 196 140 180Z', lite)
        + ln('M62 181C78 198 92 216 100 238M138 181C122 198 108 216 100 238', c2, 3) + `<circle cx="100" cy="214" r="6" fill="${c2}"/><circle cx="100" cy="214" r="2.4" fill="${dark}"/>`;
      break;
    case 'sweater':
      d = p('M78 168C86 178 114 178 122 168L124 186C112 196 88 196 76 186Z', lite) + ln('M84 176v10M92 179v11M100 180v11M108 179v11M116 176v10', dark, 1.6)
        + p('M22 214C60 204 140 204 178 214L180 228C140 218 60 218 20 228Z', c2);
      break;
    case 'highcollar':
      d = p('M80 150C88 158 112 158 120 150L123 182C112 190 88 190 77 182Z', c2) + ln('M100 158v28', shade(c2, -0.2), 1.6)
        + `<ellipse cx="100" cy="190" rx="6" ry="7" fill="${shade(c, 0.35)}"/><ellipse cx="100" cy="190" rx="3" ry="3.6" fill="${c2}"/>` + ln('M100 198v42', dark, 2);
      break;
    case 'apron':
      d = p('M14 240C16 198 46 180 82 175L118 175C154 180 184 198 186 240Z', c2) + p('M84 176C92 186 108 186 116 176L120 182C110 196 90 196 80 182Z', shade(c2, 0.18))
        + p('M66 200H134L140 240H60Z', c) + ln('M70 200L84 178M130 200L116 178', dark, 5) + p('M86 214h28v12a6 6 0 0 1-6 6H92a6 6 0 0 1-6-6z', dark);
      break;
    case 'jacket':
      d = p('M82 175L100 214L118 175C112 184 88 184 82 175Z', c2) + p('M82 175L100 214L92 240H58C56 214 66 190 82 175Z', dark) + p('M118 175L100 214L108 240H142C144 214 134 190 118 175Z', dark)
        + p('M82 175L72 196L90 204L100 214Z', lite) + p('M118 175L128 196L110 204L100 214Z', lite);
      break;
    case 'peacoat':
      d = p('M82 175L100 206L118 175C112 184 88 184 82 175Z', '#e9e2d2') + p('M82 175L64 204L92 212L100 206Z', dark) + p('M118 175L136 204L108 212L100 206Z', dark) + ln('M100 206V240', dark, 2)
        + [[84, 222], [116, 222]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c2}"/>`).join('');
      break;
    case 'chain':
      d = p('M82 175L100 200L118 175C112 184 88 184 82 175Z', '#f1e6d2') + ln('M52 186C66 214 86 224 100 226C114 224 134 214 148 186', c2, 5, 'stroke-dasharray="1 9"')
        + `<circle cx="100" cy="230" r="9" fill="${c2}"/><circle cx="100" cy="230" r="4.5" fill="${shade(c2, -0.3)}"/>`;
      break;
    default: break;
  }
  return body + neck + d;
}

function hairBack(L, H) {
  const c = L.hairColor, { w, h } = H;
  if (L.hair === 'bun') return `<circle cx="${CX}" cy="${CY - h - 12}" r="19" fill="${shade(c, -0.1)}"/>` + ln(`M${CX - 10} ${CY - h - 16}q10 -8 20 0`, shade(c, 0.3), 2);
  if (L.hair === 'bob') return p(`M${CX - w - 9} ${CY - 10}C${CX - w - 12} ${CY - h * 1.4} ${CX + w + 12} ${CY - h * 1.4} ${CX + w + 9} ${CY - 10}V${CY + h * 0.62}q-10 8 -20 0H${CX - w + 11}q-10 8 -20 0Z`, c);
  if (L.hair === 'curls') {
    let s = '';
    const pts = [[-48, -10, 17], [-46, -36, 18], [-28, -58, 19], [0, -68, 20], [28, -58, 19], [46, -36, 18], [48, -10, 17], [-52, 12, 13], [52, 12, 13]];
    for (const [x, y, r] of pts) s += `<circle cx="${CX + x}" cy="${CY + y}" r="${r}" fill="${c}"/>`;
    return s;
  }
  if (L.hair === 'updo') return p(`M${CX - w - 6} ${CY}C${CX - w - 18} ${CY - h * 1.1} ${CX - 30} ${CY - h * 1.58} ${CX + 4} ${CY - h * 1.56}C${CX + 40} ${CY - h * 1.54} ${CX + w + 16} ${CY - h * 1.05} ${CX + w + 6} ${CY}Z`, c)
    + ln(`M${CX - 20} ${CY - h * 1.36}q24 -12 44 4`, shade(c, 0.25), 2.4);
  return '';
}

function hairFront(L, H) {
  const c = L.hairColor, { w, h } = H, hi = shade(c, 0.22);
  switch (L.hair) {
    case 'bun': return p(capPath(H, CY - h * 0.6, 2, -4), c) + ln(`M${CX} ${CY - h * 0.6}C${CX - 4} ${CY - h * 0.9} ${CX - 2} ${CY - h} ${CX + 2} ${CY - h * 1.02}`, shade(c, -0.18), 1.8);
    case 'bob': return p(`M${CX - w - 4} ${CY - 2}C${CX - w - 6} ${CY - h * 1.3} ${CX + w + 6} ${CY - h * 1.3} ${CX + w + 4} ${CY - 2}L${CX + w - 3} ${CY - h * 0.36}H${CX - w + 3}Z`, c)
      + ln(`M${CX - w + 8} ${CY - h * 0.62}H${CX + w - 8}`, hi, 2, 'opacity="0.5"');
    case 'curls': {
      let s = '';
      for (const [x, y, r] of [[-30, -40, 15], [-10, -47, 16], [12, -47, 16], [32, -40, 15]]) s += `<circle cx="${CX + x}" cy="${CY + y}" r="${r}" fill="${c}"/>`;
      return s + `<circle cx="${CX - 14}" cy="${CY - 52}" r="4" fill="${hi}" opacity="0.5"/><circle cx="${CX + 20}" cy="${CY - 48}" r="3" fill="${hi}" opacity="0.5"/>`;
    }
    case 'crop': return p(capPath(H, CY - h * 0.66, 1, -8), c);
    case 'updo': return p(capPath(H, CY - h * 0.58, 2, -2), c) + ln(`M${CX - w + 2} ${CY - 4}q-6 10 2 18M${CX + w - 2} ${CY - 4}q6 10 -2 18`, c, 4);
    case 'cap': return ln(`M${CX - w + 1} ${CY - 10}q-5 9 0 18M${CX + w - 1} ${CY - 10}q5 9 0 18`, c, 6);
    case 'bald': return `<ellipse cx="${CX - w + 1}" cy="${CY - 10}" rx="7" ry="12" fill="${c}"/><ellipse cx="${CX + w - 1}" cy="${CY - 10}" rx="7" ry="12" fill="${c}"/>`;
    default: return '';
  }
}

function hat(L, H) {
  const { w, h } = H;
  if (L.hair === 'cap') {
    const c = L.capColor || '#2f3f5c';
    return p(capPath(H, CY - h * 0.42, 4, -12), c) + p(`M${CX - w - 5} ${CY - h * 0.5}q${w + 5} -10 ${2 * w + 10} 0v12q-${w + 5} -10 -${2 * w + 10} 0Z`, shade(c, 0.2))
      + ln(`M${CX - w + 6} ${CY - h * 0.42}v8M${CX - w * 0.45} ${CY - h * 0.52}v8M${CX} ${CY - h * 0.56}v8M${CX + w * 0.45} ${CY - h * 0.52}v8M${CX + w - 6} ${CY - h * 0.42}v8`, shade(c, -0.25), 1.6);
  }
  if (L.captainCap) {
    const c = '#28365a', y = CY - h * 0.62;
    return p(`M${CX - w - 8} ${y - 6}C${CX - w - 14} ${y - 34} ${CX + w + 14} ${y - 34} ${CX + w + 8} ${y - 6}Z`, '#f3efe6') + p(`M${CX - w - 2} ${y - 8}q${w + 2} -9 ${2 * w + 4} 0v12q-${w + 2} -9 -${2 * w + 4} 0Z`, c)
      + p(`M${CX - w + 2} ${y + 3}q${w - 2} -8 ${2 * w - 4} 0q-4 12 -${w - 2} 12q-${w - 6} 0 -${w - 2} -12Z`, shade(c, -0.3))
      + `<circle cx="${CX}" cy="${y - 5}" r="6" fill="${L.outfit2}"/>` + ln(`M${CX} ${y - 9}v8M${CX - 3} ${y - 3}q3 3 6 0`, c, 1.4);
  }
  return '';
}

function eyes(L, expr, H) {
  const y = CY + 3, dx = H.w * 0.4, young = L.age === 0;
  const dark = '#2b2233';
  let s = '';
  for (const sd of [-1, 1]) {
    const x = CX + sd * dx;
    if (expr === 'happy') { s += ln(`M${x - 7} ${y + 1}q7 -9 14 0`, dark, 3); continue; }
    const ry = expr === 'surprised' ? 8.6 : young ? 7.4 : 6.6, rx = expr === 'surprised' ? 7.4 : 7;
    let ix = 0, iy = 0;
    if (expr === 'thinking') { ix = 2.4; iy = -2.2; }
    if (expr === 'sly') { ix = 2.2; }
    if (expr === 'worried') { iy = 1; }
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffaf2"/><circle cx="${x + ix}" cy="${y + iy}" r="${young ? 4.6 : 4.2}" fill="${dark}"/><circle cx="${x + ix + 1.5}" cy="${y + iy - 1.6}" r="1.4" fill="#fff"/>`;
    if (expr === 'sly') s += p(`M${x - 8} ${y - 8}h16v7q-8 3 -16 0z`, L.skin) + ln(`M${x - 7.5} ${y - 1}q7.5 3 15 0`, dark, 2);
    else if (expr === 'thinking' || expr === 'worried') s += ln(`M${x - 7} ${y - ry * 0.55}q7 -5 14 0`, dark, 1.8, 'opacity="0.55"');
    else s += ln(`M${x - 7} ${y - ry * 0.62}q7 -5.500 14 0`, dark, 2, 'opacity="0.7"');
  }
  return s;
}

function brows(L, expr, H) {
  const y = CY - 11, dx = H.w * 0.4;
  const set = { neutral: [[0, 0], [0, 0]], happy: [[-3, -4], [-3, 4]], worried: [[-1, -16], [-1, 16]], surprised: [[-7, -4], [-7, 4]], thinking: [[1, 6], [-6, -12]], sly: [[2, 8], [-5, -10]] }[expr] || [[0, 0], [0, 0]];
  let s = '';
  [-1, 1].forEach((sd, i) => {
    const x = CX + sd * dx, [oy, rot] = set[i];
    s += `<path d="M${x - 9} ${y + oy + 1}q9 -4.500 18 0" fill="none" stroke="${L.brow}" stroke-width="${L.age === 2 ? 4.2 : 3.4}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y + oy})"/>`;
  });
  return s;
}

function mouth(L, expr, H, drop = 0) {
  const y = CY + H.h * 0.56 + drop, x = CX, lip = L.lips, in_ = '#6e2433';
  switch (expr) {
    case 'happy': return p(`M${x - 12} ${y - 2}q12 5 24 0q-2 13 -12 13q-10 0 -12 -13z`, in_) + p(`M${x - 10} ${y - 0.5}q10 3.500 20 0l-1.500 3.500q-8.500 2 -17 0z`, '#fffaf2');
    case 'worried': return ln(`M${x - 9} ${y + 4}q4 -6 9 -3q5 3 9 -2`, lip, 2.8);
    case 'surprised': return `<ellipse cx="${x}" cy="${y + 3}" rx="5" ry="6.500" fill="${in_}"/>`;
    case 'thinking': return ln(`M${x - 3} ${y + 2}q6 -2 12 0`, lip, 2.8);
    case 'sly': return ln(`M${x - 10} ${y + 2}q9 5 19 -5`, lip, 2.8);
    default: return ln(`M${x - 9} ${y}q9 6 18 0`, lip, 2.8);
  }
}

function beard(L, H) {
  const { w, h, jaw } = H, c = L.beardColor;
  if (L.beard === 'full') {
    return p(`M${CX - w + 1} ${CY + 6}C${CX - w - 2} ${CY + h * 0.9} ${CX - jaw * 0.7} ${CY + h + 16} ${CX} ${CY + h + 16}C${CX + jaw * 0.7} ${CY + h + 16} ${CX + w + 2} ${CY + h * 0.9} ${CX + w - 1} ${CY + 6}C${CX + w - 12} ${CY + 22} ${CX + 14} ${CY + 17} ${CX} ${CY + 20}C${CX - 14} ${CY + 17} ${CX - w + 12} ${CY + 22} ${CX - w + 1} ${CY + 6}Z`, c)
      + p(`M${CX} ${CY + 19}C${CX - 8} ${CY + 16} ${CX - 20} ${CY + 20} ${CX - 22} ${CY + 30}C${CX - 14} ${CY + 29} ${CX - 6} ${CY + 27} ${CX} ${CY + 25}C${CX + 6} ${CY + 27} ${CX + 14} ${CY + 29} ${CX + 22} ${CY + 30}C${CX + 20} ${CY + 20} ${CX + 8} ${CY + 16} ${CX} ${CY + 19}Z`, shade(c, -0.14));
  }
  if (L.beard === 'walrus') {
    return p(`M${CX} ${CY + 18}C${CX - 10} ${CY + 13} ${CX - 28} ${CY + 18} ${CX - 30} ${CY + 40}C${CX - 18} ${CY + 38} ${CX - 6} ${CY + 33} ${CX} ${CY + 27}C${CX + 6} ${CY + 33} ${CX + 18} ${CY + 38} ${CX + 30} ${CY + 40}C${CX + 28} ${CY + 18} ${CX + 10} ${CY + 13} ${CX} ${CY + 18}Z`, c)
      + ln(`M${CX} ${CY + 19}v7`, shade(c, -0.18), 1.6);
  }
  return '';
}

function extras(L, H, layer) {
  const { w, h } = H, y = CY + 3, dx = w * 0.4;
  let s = '';
  if (layer === 'face') {
    if (L.freckles) for (const [x, yy] of [[-24, 14], [-19, 18], [-28, 19], [24, 14], [19, 18], [28, 19]]) s += `<circle cx="${CX + x}" cy="${CY + yy}" r="1.300" fill="${shade(L.skin, -0.3)}"/>`;
    if (L.age === 2) s += ln(`M${CX - dx - 6} ${y + 11}q6 3 12 0M${CX + dx - 6} ${y + 11}q6 3 12 0`, shade(L.skin, -0.25), 1.4, 'opacity="0.6"');
    if (L.glasses === 'round') {
      s += `<circle cx="${CX - dx}" cy="${y}" r="13" fill="rgba(255,255,255,0.16)" stroke="#2a2438" stroke-width="2.6"/><circle cx="${CX + dx}" cy="${y}" r="13" fill="rgba(255,255,255,0.16)" stroke="#2a2438" stroke-width="2.6"/>`
        + ln(`M${CX - dx + 13} ${y}q${dx - 13} -5 ${2 * dx - 26} 0M${CX - dx - 13} ${y}L${CX - w} ${y - 4}M${CX + dx + 13} ${y}L${CX + w} ${y - 4}`, '#2a2438', 2.2)
        + ln(`M${CX - dx - 7} ${y - 6}q3 -4 7 -4M${CX + dx - 7} ${y - 6}q3 -4 7 -4`, '#fff', 1.6, 'opacity="0.7"');
    }
    if (L.glasses === 'half') {
      const gy = y + 9;
      s += p(`M${CX - dx - 10} ${gy}h20q0 9 -10 9q-10 0 -10 -9z`, 'rgba(255,255,255,0.22)') + p(`M${CX + dx - 10} ${gy}h20q0 9 -10 9q-10 0 -10 -9z`, 'rgba(255,255,255,0.22)')
        + ln(`M${CX - dx - 10} ${gy}h20q0 9 -10 9q-10 0 -10 -9zM${CX + dx - 10} ${gy}h20q0 9 -10 9q-10 0 -10 -9zM${CX - dx + 10} ${gy}h${2 * dx - 20}`, '#c9a24e', 1.8);
    }
  } else {
    if (L.earrings) s += `<circle cx="${CX - w - 1}" cy="${CY + 18}" r="4" fill="${L.earrings}"/><circle cx="${CX + w + 1}" cy="${CY + 18}" r="4" fill="${L.earrings}"/>`;
    if (L.goggles) {
      const gy = CY - h * 0.62;
      s += ln(`M${CX - w} ${gy + 6}q${w} -14 ${2 * w} 0`, '#5b3d2a', 6) + `<circle cx="${CX - 15}" cy="${gy - 1}" r="12" fill="#8fd3de" stroke="#5b3d2a" stroke-width="4"/><circle cx="${CX + 15}" cy="${gy - 1}" r="12" fill="#8fd3de" stroke="#5b3d2a" stroke-width="4"/>`
        + ln(`M${CX - 21} ${gy - 5}q3 -4 7 -4M${CX + 9} ${gy - 5}q3 -4 7 -4`, '#fff', 2, 'opacity="0.8"');
    }
    if (L.pencil) s += `<g transform="rotate(-28 ${CX + w} ${CY - 12})"><rect x="${CX + w - 3}" y="${CY - 44}" width="6" height="42" rx="1.500" fill="#e9b949"/><path d="M${CX + w - 3} ${CY - 44}l3 -8l3 8z" fill="#f1d9b5"/><rect x="${CX + w - 3}" y="${CY - 8}" width="6" height="6" fill="#d9707a"/></g>`;
  }
  return s;
}

const cache = new Map();
function inner(who, expr) {
  const key = `${who}:${expr}`;
  if (cache.has(key)) return cache.get(key);
  const L = CAST[who].look, H = HEADS[L.head] || HEADS.oval;
  const skin = L.skin, sh = shade(skin, -0.14);
  const blush = `<circle cx="${CX - H.w * 0.62}" cy="${CY + 20}" r="9" fill="#e8736f" opacity="${expr === 'happy' ? 0.38 : L.age === 0 ? 0.26 : 0.16}"/><circle cx="${CX + H.w * 0.62}" cy="${CY + 20}" r="9" fill="#e8736f" opacity="${expr === 'happy' ? 0.38 : L.age === 0 ? 0.26 : 0.16}"/>`;
  const out = hairBack(L, H) + outfit(L)
    + `<ellipse cx="${CX - H.w + 1}" cy="${CY + 5}" rx="7" ry="10" fill="${sh}"/><ellipse cx="${CX + H.w - 1}" cy="${CY + 5}" rx="7" ry="10" fill="${sh}"/>`
    + p(headPath(H), skin) + blush + extras(L, H, 'face').replace(/^$/, '')
    + ln(`M${CX - 1} ${CY + 9}q-5 9 3 10`, sh, 2.4)
    + beard(L, H) + mouth(L, expr, H, L.beard === 'walrus' ? 9 : L.beard === 'full' ? 3 : 0)
    + eyes(L, expr, H) + brows(L, expr, H)
    + (L.glasses ? extras(L, H, 'face') : '')
    + hairFront(L, H) + hat(L, H) + extras(L, H, 'over');
  cache.set(key, out);
  return out;
}

export function portrait(who, expr = 'neutral') {
  return `<svg class="lf-portrait" viewBox="0 0 200 240" aria-hidden="true">${inner(who, expr)}</svg>`;
}
export function face(who, expr = 'neutral') {
  return `<svg class="lf-face" viewBox="36 14 128 128" aria-hidden="true"><circle cx="100" cy="78" r="64" fill="${shade(CAST[who].color, 0.55)}"/><g transform="translate(0 -8)">${inner(who, expr)}</g></svg>`;
}
// A stranger: the same bust, in silhouette.
export function silhouette() {
  return '<svg class="lf-face" viewBox="36 14 128 128" aria-hidden="true"><circle cx="100" cy="78" r="64" fill="#4a416e"/><path d="M58 142c2-26 18-36 42-36s40 10 42 36zM100 34a30 32 0 1 0 .01 0z" fill="#2c2548"/><text x="100" y="92" text-anchor="middle" font-size="40" font-weight="700" fill="#f6c56b" font-family="Georgia, serif">?</text></svg>';
}
