// Patch & Kettle: the character rig. Everyone is drawn from the same parts in a 100 x 110 box; Kettle in 100 x 80.
// These return SVG markup strings so they can be dropped into the house view, portraits and scenes alike.

const INK = '#5b3a31';

export const EXTRA_LOOKS = {
  you: { skin: '#e2b08a', hair: '#6b4a3a', style: 'beanie', top: '#f6a81c', acc: 'hoodie', cheeks: '#e08a6e' },
  sam: { skin: '#d6a074', hair: '#3a2a22', style: 'cap', top: '#e9675a', acc: 'hoodie', cheeks: '#d9795f' },
  mina: { skin: '#f0cfb4', hair: '#7a4a2c', style: 'bob', top: '#f08aa6', acc: '', cheeks: '#ee9c8a' },
  rook: { skin: '#e9bd92', hair: '#3b3038', style: 'short', top: '#3f8f7f', acc: '', cheeks: '#e08a6e', moustache: false },
};

function hairBack(l) {
  const h = l.hair;
  switch (l.style) {
    case 'bun': return `<circle cx="50" cy="11" r="10" fill="${h}"/>`;
    case 'braid': return `<path d="M21 46C18 15 82 15 79 46L80 74C80 82 71 82 70 74L70 50H30L30 74C29 82 20 82 20 74Z" fill="${h}"/>`;
    case 'bob': return `<path d="M19 48C17 13 83 13 81 48L81 68C81 75 72 75 70 68L70 46H30L30 68C28 75 19 75 19 68Z" fill="${h}"/>`;
    case 'messy': return `<circle cx="66" cy="13" r="10" fill="${h}"/><path d="M74 6l9-6M58 20l-6-12" stroke="${h}" stroke-width="3" stroke-linecap="round"/>`;
    case 'perm': return [[23, 40], [26, 27], [35, 18], [50, 13], [65, 18], [74, 27], [77, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${h}"/>`).join('');
    case 'cap': return [[23, 48], [77, 48], [25, 58], [75, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${h}"/>`).join('');
    default: return '';
  }
}

function hairFront(l) {
  const h = l.hair;
  switch (l.style) {
    case 'bun': return `<path d="M22 45C20 20 36 14 50 14C64 14 80 20 78 45C74 34 64 28 50 28C36 28 26 34 22 45Z" fill="${h}"/>`;
    case 'braid': return `<path d="M22 46C20 20 38 14 52 14C66 14 80 22 78 46C73 37 66 32 59 31C50 39 34 38 22 46Z" fill="${h}"/>`
      + [[77, 62], [79, 73], [78, 84]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${6 - i * 0.6}" ry="6.500" fill="${h}"/>`).join('')
      + `<circle cx="78" cy="92" r="3" fill="#f6a81c"/>`;
    case 'bob': return `<path d="M22 43C22 21 37 15 50 15C63 15 78 21 78 43C68 36 32 36 22 43Z" fill="${h}"/>`;
    case 'bald': return `<ellipse cx="23" cy="45" rx="5.500" ry="10" fill="${h}"/><ellipse cx="77" cy="45" rx="5.500" ry="10" fill="${h}"/>`;
    case 'quiff': return `<path d="M23 43C23 24 36 18 50 18C64 18 77 24 77 43C74 35 66 31 50 31C34 31 26 35 23 43Z" fill="#2c7f75"/>`
      + `<path d="M29 31C24 9 48 1 66 7C78 11 80 23 75 31C66 22 44 22 29 31Z" fill="${h}"/>`;
    case 'perm': return [[33, 27], [45, 22], [57, 22], [68, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${h}"/>`).join('');
    case 'short': return `<path d="M22 45C21 21 36 14 50 14C64 14 79 21 78 45C76 36 72 30 66 28C56 25 44 25 34 28C28 30 24 36 22 45Z" fill="${h}"/>`;
    case 'messy': return `<path d="M22 47C20 21 36 14 50 14C64 14 80 21 78 47C74 35 63 28 50 31C37 28 26 35 22 47Z" fill="${h}"/>`
      + `<path d="M22 44C19 56 21 65 25 70L27 49ZM78 44C81 56 79 65 75 70L73 49Z" fill="${h}"/>`
      + `<path d="M56 4l22 16" stroke="#f6a81c" stroke-width="3" stroke-linecap="round"/><path d="M76 18.500l2 1.500" stroke="#4b3a33" stroke-width="3" stroke-linecap="round"/>`;
    case 'cap': return `<path d="M22 41C22 16 78 16 78 41Z" fill="#4f7fd1"/><path d="M20 41Q52 33 88 43Q90 48 85 47Q52 40 22 45Z" fill="#3c66b3"/><circle cx="50" cy="19" r="2.500" fill="#3c66b3"/>`;
    case 'beanie': return `<path d="M22 40C22 13 78 13 78 40Z" fill="#58b98f"/><rect x="20" y="35" width="60" height="10" rx="5" fill="#3f9b74"/><circle cx="50" cy="13" r="5" fill="#fff6e4"/>`;
    default: return '';
  }
}

function bodyParts(l) {
  const top = l.top;
  let out = `<path d="M12 112C12 86 30 75 50 75C70 75 88 86 88 112Z" fill="${top}"/>`;
  switch (l.acc) {
    case 'apron':
      out += `<path d="M39 76L36 88M61 76L64 88" stroke="#fff3df" stroke-width="4" stroke-linecap="round"/><rect x="32" y="86" width="36" height="30" rx="7" fill="#fff3df"/><path d="M44 97h12" stroke="#f2a65a" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'dungarees':
      out = `<path d="M12 112C12 86 30 75 50 75C70 75 88 86 88 112Z" fill="#fbe9c9"/>`
        + `<path d="M38 77L35 90M62 77L65 90" stroke="${top}" stroke-width="6" stroke-linecap="round"/><rect x="30" y="88" width="40" height="28" rx="7" fill="${top}"/><circle cx="36" cy="93" r="2" fill="#fff3df"/><circle cx="64" cy="93" r="2" fill="#fff3df"/>`;
      break;
    case 'goggles': out += `<path d="M42 78l5 12M58 78l-5 12" stroke="#fff6e4" stroke-width="2.500" stroke-linecap="round"/>`; break;
    case 'tape':
      out = `<path d="M12 112C12 86 30 75 50 75C70 75 88 86 88 112Z" fill="#fbf6ee"/>`
        + `<path d="M12 112C12 88 28 78 40 76L50 100L60 76C72 78 88 88 88 112Z" fill="${top}"/>`
        + `<circle cx="50" cy="104" r="2" fill="#fbf6ee"/><path d="M36 78C36 92 33 100 32 112M64 78C64 92 67 100 68 112" stroke="#f6c445" stroke-width="4" stroke-linecap="round" fill="none"/>`;
      break;
    case 'pin': out += `<path d="M62 92c-3-4 2-7 3.500-3.500C67 85 72 88 69 92l-3.500 4z" fill="#f08aa6"/>`; break;
    case 'pearls': out += [[36, 80], [41, 84], [47, 86], [53, 86], [59, 84], [64, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.800" fill="#fffaf0"/>`).join(''); break;
    case 'headphones': out += `<path d="M31 80Q50 98 69 80" stroke="#3b3340" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="24" y="72" width="11" height="15" rx="5" fill="#3b3340"/><rect x="65" y="72" width="11" height="15" rx="5" fill="#3b3340"/>`; break;
    case 'pencil': out += `<rect x="40" y="70" width="20" height="10" rx="5" fill="${top}"/>`; break;
    case 'hoodie': out += `<path d="M30 80Q50 92 70 80" stroke="rgba(0,0,0,.14)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M45 88v10M55 88v10" stroke="#fff6e4" stroke-width="2.500" stroke-linecap="round"/>`; break;
    default: break;
  }
  return out;
}

function face(l, expr) {
  const closed = expr === 'happy' || expr === 'sleep';
  let eyes;
  if (closed) eyes = `<path d="M34.500 49q5-5.500 10 0M55.500 49q5-5.500 10 0" stroke="${INK}" stroke-width="2.600" fill="none" stroke-linecap="round"/>`;
  else {
    const r = l.kidEyes ? 4.600 : 4;
    eyes = `<g class="pk-eyes"><ellipse cx="39.500" cy="48" rx="3.300" ry="${r}" fill="${INK}"/><ellipse cx="60.500" cy="48" rx="3.300" ry="${r}" fill="${INK}"/><circle cx="40.700" cy="46.500" r="1.100" fill="#fff"/><circle cx="61.700" cy="46.500" r="1.100" fill="#fff"/></g>`;
  }
  let mouth;
  const my = l.moustache || l.beard ? 63 : 60;
  if (expr === 'talk') mouth = `<ellipse cx="50" cy="${my + 2}" rx="4.500" ry="5" fill="#7a3b34"/>`;
  else if (expr === 'worried') mouth = `<path d="M44 ${my + 4}Q50 ${my - 1} 56 ${my + 4}" stroke="${INK}" stroke-width="2.600" fill="none" stroke-linecap="round"/>`;
  else if (expr === 'wow') mouth = `<circle cx="50" cy="${my + 2}" r="3.800" fill="#7a3b34"/>`;
  else if (expr === 'happy') mouth = `<path d="M42 ${my - 1}Q50 ${my + 11} 58 ${my - 1}Z" fill="#7a3b34"/>`;
  else mouth = `<path d="M43 ${my}Q50 ${my + 7} 57 ${my}" stroke="${INK}" stroke-width="2.600" fill="none" stroke-linecap="round"/>`;
  const brows = expr === 'worried' ? `<path d="M33 40l9-3M67 40l-9-3" stroke="${INK}" stroke-width="2.200" stroke-linecap="round"/>` : '';
  const cheeks = `<circle cx="31" cy="57" r="5.500" fill="${l.cheeks}" opacity=".5"/><circle cx="69" cy="57" r="5.500" fill="${l.cheeks}" opacity=".5"/>`;
  let extra = '';
  if (l.beard) extra += `<path d="M24 52C24 72 38 79 50 79C62 79 76 72 76 52C73 61 66 64 58 62C54 59 46 59 42 62C34 64 27 61 24 52Z" fill="${l.hair}"/>`;
  if (l.moustache) extra += `<path d="M38 59Q44 53 50 58Q56 53 62 59Q56 65 50 61Q44 65 38 59Z" fill="${l.hair}" stroke="rgba(0,0,0,.1)" stroke-width=".800"/>`;
  let glasses = '';
  if (l.glasses === 'round') glasses = `<g fill="rgba(255,255,255,.3)" stroke="#6b5148" stroke-width="2"><circle cx="39" cy="48" r="8.500"/><circle cx="61" cy="48" r="8.500"/><path d="M47.500 48h5" fill="none"/></g>`;
  if (l.glasses === 'cat') glasses = `<g fill="rgba(255,255,255,.3)" stroke="#c0457a" stroke-width="2.200" stroke-linejoin="round"><path d="M29 43l5-3h12l2 7c0 5-4 8-9 8s-9-3-9-8z"/><path d="M71 43l-5-3H54l-2 7c0 5 4 8 9 8s9-3 9-8z"/><path d="M48 47h4" fill="none"/></g>`;
  const goggles = l.acc === 'goggles' ? `<path d="M22 30Q50 20 78 30" stroke="#4b3a33" stroke-width="4" fill="none"/><circle cx="39" cy="27" r="7.500" fill="#a9d8f0" stroke="#4b3a33" stroke-width="2.500"/><circle cx="61" cy="27" r="7.500" fill="#a9d8f0" stroke="#4b3a33" stroke-width="2.500"/>` : '';
  const ring = l.acc === 'pin' ? `<circle cx="53.500" cy="55.500" r="1.800" fill="none" stroke="#f6c445" stroke-width="1.200"/>` : '';
  return `${cheeks}${extra}${eyes}${brows}<path d="M48.500 53.500q1.500 2 3 0" stroke="rgba(0,0,0,.2)" stroke-width="1.600" fill="none" stroke-linecap="round"/>${mouth}${glasses}${goggles}${ring}`;
}

// The inner markup of a person (no <svg> wrapper), drawn in a 100 x 110 box.
export function personG(look, expr = 'smile') {
  const l = look;
  return `${hairBack(l)}${bodyParts(l)}<rect x="43" y="64" width="14" height="16" rx="6" fill="${l.skin}"/><rect x="43" y="68" width="14" height="6" fill="rgba(0,0,0,.08)"/>`
    + (l.acc === 'pencil' ? `<rect x="41" y="70" width="18" height="11" rx="5" fill="${l.top}"/>` : '')
    + `<circle cx="23.500" cy="48" r="5" fill="${l.skin}"/><circle cx="76.500" cy="48" r="5" fill="${l.skin}"/>`
    + `<ellipse cx="50" cy="46" rx="27" ry="26" fill="${l.skin}"/>${hairFront(l)}${face(l, expr)}`;
}

// A round portrait badge.
export function portrait(look, { size = 64, expr = 'smile', bg = '#ffe9b8', ring = '#fff' } = {}) {
  return `<svg class="pk-portrait" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">`
    + `<defs><clipPath id="pkc${size}"><circle cx="50" cy="50" r="47"/></clipPath></defs>`
    + `<circle cx="50" cy="50" r="48.500" fill="${ring}"/><circle cx="50" cy="50" r="45" fill="${bg}"/>`
    + `<g clip-path="url(#pkc${size})"><g transform="translate(6 7) scale(.88)">${personG(look, expr)}</g></g></svg>`;
}

// A bust placed inside a larger SVG at (x, y) = bottom centre, h = height in px.
export function personAt(look, x, y, h = 46, expr = 'smile', cls = '') {
  const s = h / 110;
  return `<g class="pk-person ${cls}" transform="translate(${x - 50 * s} ${y - 110 * s}) scale(${s})">${personG(look, expr)}</g>`;
}

// ---------- Kettle ----------
const KG = '#6f6878', KD = '#544e5d', KC = '#fff3df', KP = '#f29aa5';

function catFace(cx, cy, asleep) {
  const eyes = asleep
    ? `<path d="M${cx - 12} ${cy - 1}q4.500 3.500 9 0M${cx + 3} ${cy - 1}q4.500 3.500 9 0" stroke="#2f2a33" stroke-width="2.200" fill="none" stroke-linecap="round"/>`
    : `<g class="pk-eyes"><ellipse cx="${cx - 7.500}" cy="${cy - 2}" rx="4" ry="4.600" fill="#f6c445"/><ellipse cx="${cx + 7.500}" cy="${cy - 2}" rx="4" ry="4.600" fill="#f6c445"/><ellipse cx="${cx - 7.500}" cy="${cy - 2}" rx="1.700" ry="3.600" fill="#2f2a33"/><ellipse cx="${cx + 7.500}" cy="${cy - 2}" rx="1.700" ry="3.600" fill="#2f2a33"/></g>`;
  return `<path d="M${cx - 18} ${cy - 9}L${cx - 16} ${cy - 27}L${cx - 3} ${cy - 17}Z" fill="${KG}"/><path d="M${cx + 18} ${cy - 9}L${cx + 16} ${cy - 27}L${cx + 3} ${cy - 17}Z" fill="${KG}"/>`
    + `<path d="M${cx - 14.500} ${cy - 13}L${cx - 13.500} ${cy - 22}L${cx - 7} ${cy - 17}Z" fill="${KP}"/><path d="M${cx + 14.500} ${cy - 13}L${cx + 13.500} ${cy - 22}L${cx + 7} ${cy - 17}Z" fill="${KP}"/>`
    + `<circle cx="${cx}" cy="${cy}" r="20" fill="${KG}"/>`
    + `<path d="M${cx - 5} ${cy - 19}v6M${cx} ${cy - 20}v7M${cx + 5} ${cy - 19}v6" stroke="${KD}" stroke-width="2.400" stroke-linecap="round"/>`
    + `<ellipse cx="${cx}" cy="${cy + 8}" rx="11" ry="7.500" fill="${KC}"/>`
    + `<path d="M${cx - 2.600} ${cy + 3.500}h5.200l-2.600 3z" fill="${KP}"/>`
    + `<path d="M${cx} ${cy + 6.500}q-3 4-6 1.500M${cx} ${cy + 6.500}q3 4 6 1.500" stroke="#2f2a33" stroke-width="1.500" fill="none" stroke-linecap="round"/>`
    + `<path d="M${cx - 12} ${cy + 6}l-11-2M${cx - 12} ${cy + 9}l-11 2M${cx + 12} ${cy + 6}l11-2M${cx + 12} ${cy + 9}l11 2" stroke="rgba(255,255,255,.75)" stroke-width="1.100" stroke-linecap="round"/>`
    + eyes;
}

function hatG(hat, cx, cy) {
  const top = cy - 18;
  switch (hat) {
    case 'hat_party': return `<path d="M${cx - 9} ${top + 3}L${cx + 2} ${top - 22}L${cx + 11} ${top + 3}Z" fill="#f27d6b"/><path d="M${cx - 5} ${top - 6}l11 2M${cx - 2} ${top - 13}l7 1.500" stroke="#fff3df" stroke-width="2.400"/><circle cx="${cx + 2}" cy="${top - 23}" r="3.500" fill="#f6c445"/>`;
    case 'hat_wizard': return `<path d="M${cx - 16} ${top + 4}h32l-4-5h-24z" fill="#7b5fc4"/><path d="M${cx - 11} ${top}L${cx + 6} ${top - 28}L${cx + 11} ${top}Z" fill="#8f73d8"/><circle cx="${cx + 1}" cy="${top - 9}" r="1.800" fill="#f6c445"/><circle cx="${cx + 5}" cy="${top - 17}" r="1.300" fill="#f6c445"/>`;
    case 'hat_bow': return `<path d="M${cx} ${cy + 19}l-10-6v12zM${cx} ${cy + 19}l10-6v12z" fill="#f6a81c"/><circle cx="${cx}" cy="${cy + 19}" r="3" fill="#d98200"/>`;
    case 'hat_beret': return `<ellipse cx="${cx + 3}" cy="${top + 1}" rx="17" ry="7" fill="#d9534f" transform="rotate(-10 ${cx} ${top})"/><path d="M${cx + 4} ${top - 6}v-5" stroke="#d9534f" stroke-width="2.500" stroke-linecap="round"/>`;
    case 'hat_toque': return `<path d="M${cx - 14} ${top + 4}C${cx - 14} ${top - 18} ${cx + 14} ${top - 18} ${cx + 14} ${top + 4}Z" fill="#f6c445"/><rect x="${cx - 16}" y="${top}" width="32" height="7" rx="3.500" fill="#f27d6b"/><circle cx="${cx}" cy="${top - 15}" r="5" fill="#fff3df"/>`;
    case 'hat_crown': return [[-13, 2, '#f08aa6'], [-7, -3, '#fff3df'], [0, -5, '#f6c445'], [7, -3, '#f08aa6'], [13, 2, '#fff3df']].map(([dx, dy, c]) => `<circle cx="${cx + dx}" cy="${top + dy + 2}" r="4.500" fill="${c}"/><circle cx="${cx + dx}" cy="${top + dy + 2}" r="1.600" fill="#f6a81c"/>`).join('') + `<path d="M${cx - 16} ${top + 6}q16-8 32 0" stroke="#58b98f" stroke-width="2.500" fill="none"/>`;
    case 'hat_phones': return `<path d="M${cx - 19} ${cy - 2}C${cx - 19} ${cy - 30} ${cx + 19} ${cy - 30} ${cx + 19} ${cy - 2}" stroke="#3b3340" stroke-width="4" fill="none"/><rect x="${cx - 24}" y="${cy - 9}" width="9" height="14" rx="4" fill="#58b98f"/><rect x="${cx + 15}" y="${cy - 9}" width="9" height="14" rx="4" fill="#58b98f"/>`;
    case 'hat_chef': return `<rect x="${cx - 10}" y="${top - 6}" width="20" height="11" rx="2" fill="#fff"/><circle cx="${cx - 8}" cy="${top - 9}" r="7" fill="#fff"/><circle cx="${cx + 8}" cy="${top - 9}" r="7" fill="#fff"/><circle cx="${cx}" cy="${top - 13}" r="8" fill="#fff"/><path d="M${cx - 10} ${top + 3}h20" stroke="#e8dccb" stroke-width="1.500"/>`;
    default: return '';
  }
}

// pose: 'loaf' (asleep), 'sit', 'look' (loaf with open eyes). Returns inner markup for a 100 x 80 box.
export function kettleG(pose = 'loaf', hat = null) {
  if (pose === 'sit') {
    return `<path class="pk-tail" d="M68 70C92 72 94 52 83 46" stroke="${KG}" stroke-width="9" fill="none" stroke-linecap="round"/>`
      + `<ellipse cx="50" cy="60" rx="24" ry="19" fill="${KG}"/><ellipse cx="50" cy="63" rx="12" ry="13" fill="${KC}"/>`
      + `<ellipse cx="41" cy="77" rx="7" ry="3.500" fill="${KC}"/><ellipse cx="59" cy="77" rx="7" ry="3.500" fill="${KC}"/>`
      + `<g class="pk-cathead">${catFace(50, 32, false)}${hatG(hat, 50, 32)}</g>`;
  }
  const asleep = pose === 'loaf';
  return `<path class="pk-tail" d="M80 66C98 64 96 44 85 43" stroke="${KG}" stroke-width="9" fill="none" stroke-linecap="round"/>`
    + `<ellipse class="pk-breathe" cx="56" cy="57" rx="33" ry="21" fill="${KG}"/>`
    + `<path d="M54 37v8M64 38l1 8M74 42l2 7" stroke="${KD}" stroke-width="3" stroke-linecap="round"/>`
    + `<ellipse cx="30" cy="75" rx="7.500" ry="3.800" fill="${KC}"/><ellipse cx="46" cy="76" rx="7.500" ry="3.800" fill="${KC}"/>`
    + `<g class="pk-cathead">${catFace(32, 48, asleep)}${hatG(hat, 32, 48)}</g>`;
}

export function kettleSvg(pose = 'sit', hat = null, size = 96) {
  return `<svg class="pk-kettle" width="${size}" height="${size * 0.9}" viewBox="-4 -14 108 97" aria-hidden="true">${kettleG(pose, hat)}</svg>`;
}

export function kettleAt(x, y, w = 40, pose = 'loaf', hat = null) {
  const s = w / 100;
  return `<g class="pk-kettle-g" data-act="pet" transform="translate(${x - 50 * s} ${y - 80 * s}) scale(${s})"><rect x="-8" y="-20" width="116" height="104" fill="transparent"/>${kettleG(pose, hat)}</g>`;
}
