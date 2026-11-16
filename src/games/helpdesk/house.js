// Patch & Kettle: the cutaway dollhouse. Builds one SVG string from a plain "view" object (no DOM, no state access).
import { TENANTS, TENANT_BY_ID } from './data.js';
import { TYPES } from './stories.js';
import { personAt, kettleAt, EXTRA_LOOKS } from './art.js';
import { iconG } from './icons.js';

export const HOUSE_W = 360, HOUSE_H = 612;
const RW = 124, RH = 98, FLOOR_H = 102;
const WOOD = '#d9a066', WOOD_D = '#b97f47', TRIM = '#c58f5c', CREAM = '#fff6e4';
const WALLS = ['#ffe7cc', '#dcf1df', '#fff0c4', '#e1eaf8', '#ffe0ea', '#ebe2fa', '#ffdfd6', '#dde2f6'];

// Room box for tenant room index 0..7 (bottom-up, left then right).
export function roomBox(i) {
  const floor = (i / 2) | 0, side = i % 2;
  return { x: side ? 200 : 36, y: 396 - floor * FLOOR_H, w: RW, h: RH, side, floor };
}
const LAYOUT = (b) => ({
  win: b.side ? b.x + b.w - 34 : b.x + 8,           // window on the outer wall
  desk: b.side ? b.x + 58 : b.x + b.w - 58,         // desk centre
  prop: b.side ? b.x + 20 : b.x + b.w - 20,         // prop near the stairwell
  far: b.side ? b.x + b.w - 20 : b.x + 20,          // under the window
  floorY: b.y + b.h - 8,
});

function windowG(x, y, curtain) {
  return `<rect x="${x - 2}" y="${y - 2}" width="30" height="38" rx="6" fill="${CREAM}" stroke="${TRIM}" stroke-width="2"/>`
    + `<rect x="${x + 1}" y="${y + 1}" width="24" height="32" rx="4" fill="url(#pkSky)"/>`
    + `<path d="M${x + 13} ${y + 1}v32M${x + 1} ${y + 17}h24" stroke="${CREAM}" stroke-width="2"/>`
    + `<path d="M${x + 1} ${y + 1}h8c0 10-3 16-8 20zM${x + 25} ${y + 1}h-8c0 10 3 16 8 20z" fill="${curtain}" opacity=".9"/>`
    + `<rect x="${x - 4}" y="${y + 35}" width="34" height="4" rx="2" fill="${TRIM}"/>`;
}
function deskG(cx, floorY, w = 54, color = WOOD) {
  const top = floorY - 26;
  return `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="7" rx="3.500" fill="${color}"/><rect x="${cx - w / 2 + 4}" y="${top + 7}" width="${w - 8}" height="19" rx="2" fill="${WOOD_D}" opacity=".85"/>`;
}
function laptopG(x, deskTop) {
  return `<rect x="${x}" y="${deskTop - 13}" width="18" height="13" rx="2.500" fill="#8f96a8"/><rect x="${x + 2}" y="${deskTop - 11}" width="14" height="9" rx="1.500" fill="#dff1fb" class="pk-screen"/><rect x="${x - 2}" y="${deskTop - 1.500}" width="22" height="2.500" rx="1.200" fill="#737a8c"/>`;
}
function potG(x, floorY, leaf = '#5fae7b', h = 18, pot = '#e58f6a') {
  return `<path d="M${x} ${floorY - 8}C${x - 10} ${floorY - 8 - h} ${x - 3} ${floorY - 14 - h} ${x} ${floorY - 9}C${x + 3} ${floorY - 16 - h} ${x + 11} ${floorY - 8 - h} ${x} ${floorY - 8}Z" fill="${leaf}" class="pk-sway"/>`
    + `<path d="M${x} ${floorY - 8}v${-h + 2}" stroke="#3f8f62" stroke-width="1.500"/>`
    + `<path d="M${x - 6} ${floorY - 9}h12l-2 9h-8z" fill="${pot}"/>`;
}
const noteG = (x, y, c = '#f27d6b', d = 0) => `<g class="pk-note" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="2.600" fill="${c}"/><path d="M${x + 2.400} ${y}v-9l5-1.500" stroke="${c}" stroke-width="1.600" fill="none" stroke-linecap="round"/></g>`;
const boltG = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="5.500" fill="#fff6e4" stroke="#f6a81c" stroke-width="1.200"/><path d="M1-4l-4 5h3l-1 3 4-5H0z" fill="#f6a81c"/></g>`;

// ---------- the eight rooms ----------
function roomArt(i, v) {
  const b = roomBox(i), L = LAYOUT(b), D = v.decor, t = TENANTS[i];
  const fy = L.floorY, deskTop = fy - 26;
  const dir = b.side ? 1 : -1;                        // towards the outer wall
  let o = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${WALLS[i]}"/>`;
  o += `<rect x="${b.x}" y="${b.y + 64}" width="${b.w}" height="${b.h - 64}" fill="rgba(255,255,255,.28)"/>`;
  o += `<rect x="${b.x}" y="${fy}" width="${b.w}" height="8" fill="#e6bd8c"/><path d="M${b.x} ${fy}h${b.w}" stroke="#cf9c66" stroke-width="1.500"/>`;
  o += windowG(L.win, b.y + 16, t.color);
  let front = '';                                      // drawn in front of the person
  switch (t.id) {
    case 'bea': {
      const sx = L.prop - 14;
      o += `<rect x="${sx}" y="${b.y + 22}" width="30" height="3" rx="1.500" fill="${WOOD_D}"/><rect x="${sx}" y="${b.y + 40}" width="30" height="3" rx="1.500" fill="${WOOD_D}"/>`;
      o += [[sx + 7, b.y + 18], [sx + 21, b.y + 18], [sx + 13, b.y + 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6.500" ry="4.200" fill="#d9964e"/><path d="M${x - 3} ${y - 1.500}l2 2M${x} ${y - 2}l2 2" stroke="#b97434" stroke-width="1"/>`).join('');
      o += `<rect x="${L.far - 13}" y="${fy - 30}" width="26" height="30" rx="4" fill="#b9bfcc"/><rect x="${L.far - 9}" y="${fy - 24}" width="18" height="13" rx="3" fill="#f6a35a" class="pk-glow"/><circle cx="${L.far - 6}" cy="${fy - 6}" r="1.800" fill="#737a8c"/><circle cx="${L.far + 6}" cy="${fy - 6}" r="1.800" fill="#737a8c"/>`;
      if (D.has('menuboard')) o += `<g transform="rotate(${-3 * dir} ${L.desk} ${b.y + 22})"><rect x="${L.desk - 15}" y="${b.y + 9}" width="30" height="24" rx="3" fill="#4e5a52" stroke="${WOOD}" stroke-width="2"/><path d="M${L.desk - 10} ${b.y + 16}h14M${L.desk - 10} ${b.y + 21}h20M${L.desk - 10} ${b.y + 26}h11" stroke="#fff6e4" stroke-width="1.500" stroke-linecap="round"/><circle cx="${L.desk + 9}" cy="${b.y + 16}" r="2.500" fill="#f6c445"/></g>`;
      front += deskG(L.desk, fy, 56) + `<ellipse cx="${L.desk + 14}" cy="${deskTop - 3}" rx="7" ry="4" fill="#e0a25c"/><rect x="${L.desk - 22}" y="${deskTop - 9}" width="13" height="9" rx="2" fill="#737a8c"/><rect x="${L.desk - 20.500}" y="${deskTop - 7.500}" width="10" height="6" rx="1" fill="#dff1fb" class="pk-screen"/>`;
      break;
    }
    case 'fern': {
      o += `<path d="M${L.prop} ${b.y}v12" stroke="${TRIM}" stroke-width="1.500"/><path d="M${L.prop - 7} ${b.y + 12}h14l-2 7h-10z" fill="#e58f6a"/><path d="M${L.prop - 5} ${b.y + 19}c-6 8-3 16-5 22M${L.prop} ${b.y + 19}c0 9 3 13 1 24M${L.prop + 5} ${b.y + 19}c5 6 2 12 5 18" stroke="#5fae7b" stroke-width="2.200" fill="none" stroke-linecap="round" class="pk-sway"/>`;
      o += potG(L.prop + 2, fy, '#4f9f6d', 24) + potG(L.far - 6 * dir, fy, '#7cc79a', 14, '#f2c078') + potG(L.far + 10 * dir, fy, '#5fae7b', 20, '#c9b8f0');
      front += deskG(L.desk, fy, 50) + laptopG(L.desk - 20, deskTop) + `<path d="M${L.desk + 10} ${deskTop}h9l-1.500-7h-6z" fill="#f2c078"/><circle cx="${L.desk + 14.500}" cy="${deskTop - 10}" r="5" fill="#7cc79a"/>`;
      break;
    }
    case 'juno': {
      o += `<rect x="${L.prop - 16}" y="${b.y + 12}" width="32" height="26" rx="3" fill="#f6dc9a" stroke="${TRIM}" stroke-width="1.200"/>`
        + `<path d="M${L.prop - 10} ${b.y + 18}v10M${L.prop - 3} ${b.y + 17}l5 5-5 5M${L.prop + 9} ${b.y + 18}v12" stroke="#8f96a8" stroke-width="2.200" stroke-linecap="round" fill="none"/>`;
      const gx = L.far + 2 * dir, gy = fy;
      if (D.has('robotcape')) o += `<path d="M${gx - 9} ${gy - 17}l-5 17h14z" fill="#d9413f"/>`;
      o += `<g class="pk-bob2"><rect x="${gx - 8}" y="${gy - 19}" width="16" height="15" rx="4" fill="#9fb0c9"/><rect x="${gx - 6}" y="${gy - 4}" width="4" height="4" rx="1" fill="#737a8c"/><rect x="${gx + 2}" y="${gy - 4}" width="4" height="4" rx="1" fill="#737a8c"/><circle cx="${gx - 2}" cy="${gy - 12}" r="3.500" fill="#fff"/><circle cx="${gx - 1.500}" cy="${gy - 11.500}" r="1.500" fill="#2f2a33"/><path d="M${gx + 3} ${gy - 19}v-6" stroke="#737a8c" stroke-width="1.500"/><circle cx="${gx + 3}" cy="${gy - 26}" r="2" fill="#f27d6b" class="pk-blinkled"/></g>`;
      if (D.has('sharedsign')) o += `<rect x="${L.desk - 22}" y="${b.y + 8}" width="20" height="9" rx="3" fill="#f6c445"/><rect x="${L.desk + 2}" y="${b.y + 8}" width="20" height="9" rx="3" fill="#b79be0"/><path d="M${L.desk - 18} ${b.y + 12.500}h12M${L.desk + 6} ${b.y + 12.500}h12" stroke="#fff" stroke-width="1.500" stroke-linecap="round"/>`;
      front += deskG(L.desk, fy, 54, '#c9a06a') + laptopG(L.desk - 6, deskTop) + `<rect x="${L.desk - 24}" y="${deskTop - 6}" width="12" height="6" rx="1.500" fill="#f27d6b"/><circle cx="${L.desk + 20}" cy="${deskTop - 3}" r="3" fill="#58b98f"/>`;
      break;
    }
    case 'vogel': {
      const mx = L.prop;
      o += `<path d="M${mx} ${fy}v-14" stroke="${WOOD_D}" stroke-width="2.500"/><path d="M${mx - 7} ${fy}h14" stroke="${WOOD_D}" stroke-width="2.500" stroke-linecap="round"/><path d="M${mx - 8} ${fy - 40}c0-4 16-4 16 0c2 8-2 12-1 26h-14c1-14-3-18-1-26z" fill="#c9667a"/><circle cx="${mx}" cy="${fy - 45}" r="2.500" fill="${WOOD_D}"/>`;
      o += `<rect x="${L.far - 14}" y="${b.y + 60}" width="28" height="3" rx="1.500" fill="${WOOD_D}"/>` + ['#f27d6b', '#f6c445', '#58b98f', '#5aa7e0'].map((c, k) => `<rect x="${L.far - 12 + k * 6.500}" y="${b.y + 53}" width="4.500" height="7" rx="1.500" fill="${c}"/>`).join('');
      if (D.has('gramophone')) o += `<g transform="translate(${L.far - 4} ${fy})"><rect x="-9" y="-9" width="18" height="9" rx="2" fill="${WOOD_D}"/><path d="M0-9l5-9 11-7-1 14z" fill="#f6c445" stroke="#d98200" stroke-width="1"/></g>` + noteG(L.far + 12, b.y + 44, '#7e8fb0', 0.300);
      front += deskG(L.desk, fy, 54) + `<path d="M${L.desk - 4} ${deskTop}h20v-5h-5v-8h-13v4h7v4h-9z" fill="#3f4658"/><circle cx="${L.desk + 13}" cy="${deskTop - 10}" r="3" fill="#f6c445"/><rect x="${L.desk - 24}" y="${deskTop - 3}" width="14" height="3" rx="1.500" fill="#f08aa6"/>`;
      break;
    }
    case 'pip': {
      o += `<g transform="rotate(-6 ${L.prop} ${b.y + 24})"><rect x="${L.prop - 15}" y="${b.y + 10}" width="15" height="20" rx="2" fill="#3fb7a8"/><circle cx="${L.prop - 7.500}" cy="${b.y + 19}" r="4" fill="#fff6e4"/></g>`
        + `<g transform="rotate(5 ${L.prop + 8} ${b.y + 26})"><rect x="${L.prop + 2}" y="${b.y + 14}" width="14" height="19" rx="2" fill="#f6c445"/><path d="M${L.prop + 5} ${b.y + 20}h8M${L.prop + 5} ${b.y + 24}h5" stroke="#f27d6b" stroke-width="2" stroke-linecap="round"/></g>`;
      o += `<rect x="${L.far - 14}" y="${fy - 24}" width="28" height="24" rx="4" fill="#8f96a8"/><rect x="${L.far - 10}" y="${fy - 20}" width="20" height="5" rx="2" fill="#3b3340"/><rect x="${L.far - 8}" y="${fy - 30}" width="16" height="8" rx="1.500" fill="#fff"/><circle cx="${L.far + 8}" cy="${fy - 8}" r="2" fill="#58b98f" class="pk-blinkled"/>`;
      if (D.has('airmail')) o += `<rect x="${L.prop - 12}" y="${fy - 12}" width="18" height="12" rx="2" fill="#f2d2a0" stroke="#d98200" stroke-width=".800"/><rect x="${L.prop - 6}" y="${fy - 21}" width="14" height="9" rx="2" fill="#fff" stroke="#5aa7e0" stroke-width="1.500" stroke-dasharray="3 2"/>`;
      front += deskG(L.desk, fy, 54, '#c9a06a') + laptopG(L.desk - 22, deskTop) + `<rect x="${L.desk + 2}" y="${deskTop - 3}" width="16" height="3" rx="1" fill="#f08aa6"/><rect x="${L.desk + 4}" y="${deskTop - 6}" width="14" height="3" rx="1" fill="#fff"/>`;
      break;
    }
    case 'dot': {
      o += `<rect x="${L.prop - 13}" y="${b.y + 26}" width="26" height="3" rx="1.500" fill="${WOOD_D}"/><path d="M${L.prop - 6} ${b.y + 26}v-8h-3v-4h12v4h-3v8z" fill="#f6c445"/>`;
      o += `<rect x="${L.far - 9}" y="${fy - 18}" width="18" height="18" rx="2" fill="${WOOD_D}"/><path d="M${L.far - 6} ${fy - 18}c-2-14 14-14 12 0z" fill="#b9bfcc"/><rect x="${L.far - 2}" y="${fy - 33}" width="4" height="4" rx="1" fill="#737a8c"/><path d="M${L.far + 6} ${fy - 24}h4" stroke="#737a8c" stroke-width="2" stroke-linecap="round"/>`;
      if (D.has('bigscreen')) o += `<rect x="${L.desk - 19}" y="${b.y + 6}" width="38" height="24" rx="3" fill="#3b3340"/><rect x="${L.desk - 16}" y="${b.y + 9}" width="32" height="18" rx="2" fill="#bfe3f5" class="pk-screen"/><circle cx="${L.desk - 6}" cy="${b.y + 18}" r="4" fill="#f2c078"/><circle cx="${L.desk + 6}" cy="${b.y + 18}" r="4" fill="#8a5a3c"/><rect x="${L.desk + 11}" y="${b.y + 10}" width="5" height="3.500" fill="#58b98f"/><rect x="${L.desk + 13}" y="${b.y + 10}" width="3" height="3.500" fill="#f27d6b"/>`;
      front += `<rect x="${L.desk - 24}" y="${deskTop}" width="48" height="5" rx="2.500" fill="${WOOD}"/><path d="M${L.desk} ${deskTop + 5}v21M${L.desk - 10} ${fy}h20" stroke="${WOOD_D}" stroke-width="3.500" stroke-linecap="round"/>`
        + [0, 1, 2, 3].map((k) => `<rect x="${L.desk - 14 + k * 7}" y="${deskTop - 2.500}" width="7" height="2.500" fill="${k % 2 ? '#fff6e4' : '#6b5148'}"/>`).join('')
        + `<path d="M${L.desk - 11} ${deskTop - 2.500}v-6l2-2 2 2v6zM${L.desk + 5} ${deskTop - 2.500}v-5h4v5z" fill="#3b3340"/><circle cx="${L.desk - 2}" cy="${deskTop - 6}" r="2.500" fill="#fff6e4" stroke="#6b5148" stroke-width=".800"/>`;
      if (D.has('cakestand')) front += `<g transform="translate(${L.desk + 18} ${deskTop})"><path d="M0 0v-5M-6 0h12" stroke="#b9bfcc" stroke-width="1.500"/><ellipse cx="0" cy="-5" rx="8" ry="1.800" fill="#fff"/><path d="M-5-6c0-6 10-6 10 0z" fill="#f08aa6"/><circle cx="0" cy="-11" r="1.500" fill="#d9413f"/></g>`;
      if (D.has('rooke')) front += `<g class="pk-bob2" transform="translate(${L.desk + (b.side ? 38 : -38)} ${fy})"><rect x="-7" y="-22" width="14" height="13" rx="3" fill="#9fb0c9"/><rect x="-5" y="-9" width="10" height="9" rx="2" fill="#5b6b8c"/><path d="M-5-9l5 4 5-4" fill="#fff6e4"/><circle cx="-2.500" cy="-16" r="2" fill="#f6c445"/><circle cx="2.500" cy="-16" r="2" fill="#f6c445"/><path d="M-5-22v-3h3v2h4v-2h3v3z" fill="#737a8c"/></g>`;
      break;
    }
    case 'rashid': {
      const on = D.has('onair');
      o += `<rect x="${L.prop - 17}" y="${b.y + 6}" width="34" height="12" rx="4" fill="${on ? '#e9473f' : '#b9a9a2'}" class="${on ? 'pk-onair' : ''}"/><text x="${L.prop}" y="${b.y + 15}" text-anchor="middle" font-size="7.500" font-weight="900" fill="#fff" font-family="inherit" letter-spacing=".600">ON AIR</text>`;
      o += `<rect x="${L.prop - 14}" y="${b.y + 38}" width="28" height="3" rx="1.500" fill="${WOOD_D}"/>` + ['#3b3340', '#f27d6b', '#5aa7e0', '#3b3340', '#f6c445', '#58b98f'].map((c, k) => `<rect x="${L.prop - 13 + k * 4.400}" y="${b.y + 25}" width="3.200" height="13" rx="1" fill="${c}"/>`).join('');
      if (D.has('scripts')) o += `<g transform="rotate(4 ${L.prop} ${b.y + 56})"><rect x="${L.prop - 9}" y="${b.y + 46}" width="12" height="15" fill="#fff"/><path d="M${L.prop - 7} ${b.y + 50}h8M${L.prop - 7} ${b.y + 53}h8M${L.prop - 7} ${b.y + 56}h5" stroke="#b9bfcc" stroke-width="1"/><circle cx="${L.prop - 3}" cy="${b.y + 47}" r="1.300" fill="#f27d6b"/></g>`;
      if (D.has('plantradio')) o += potG(L.far - 2 * dir, fy, '#3f8f62', 22, '#f2c078');
      if (D.has('playposter')) o += `<rect x="${L.far - 10}" y="${b.y + 58}" width="16" height="20" rx="1.500" fill="#3d4a7a"/><circle cx="${L.far - 2}" cy="${b.y + 65}" r="3.500" fill="#f6c445"/><path d="M${L.far - 7} ${b.y + 73}h10" stroke="#fff" stroke-width="1.500"/>`;
      front += deskG(L.desk, fy, 58, '#6b6f80') + [0, 1, 2, 3, 4].map((k) => `<rect x="${L.desk - 22 + k * 6}" y="${deskTop - 4 - (k * 7) % 5}" width="3" height="${4 + (k * 7) % 5}" rx="1" fill="${['#58b98f', '#f6c445', '#f27d6b', '#58b98f', '#5aa7e0'][k]}" class="pk-eq" style="animation-delay:${k * 0.170}s"/>`).join('')
        + `<path d="M${L.desk + 24} ${deskTop}v-22l-12 6" stroke="#3b3340" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="${L.desk + 6}" y="${deskTop - 22}" width="8" height="12" rx="4" fill="#3b3340"/>`;
      if (on) o += noteG(L.desk - 26, b.y + 30, '#f27d6b', 0) + noteG(L.desk + 30, b.y + 38, '#f6a81c', 1.200);
      break;
    }
    default: {
      const bx = L.prop - 15;
      o += `<rect x="${bx}" y="${b.y + 10}" width="30" height="${fy - b.y - 10}" rx="2" fill="${WOOD_D}"/>`;
      for (let r = 0; r < 4; r++) {
        o += `<rect x="${bx + 2}" y="${b.y + 13 + r * 18}" width="26" height="15" fill="#8a5f3a"/>`;
        o += ['#f27d6b', '#f6c445', '#7f8fd6', '#58b98f', '#fff6e4', '#f08aa6'].map((c, k) => `<rect x="${bx + 3 + k * 4.100}" y="${b.y + 15 + r * 18 + ((k + r) % 3)}" width="3.300" height="${13 - ((k + r) % 3)}" rx=".800" fill="${[c, '#c9b8f0', '#f2a65a'][(k * r) % 3 === 0 ? 0 : (k + r) % 3]}"/>`).join('');
      }
      o += `<path d="M${L.far - 2} ${fy}v-34" stroke="#737a8c" stroke-width="2"/><path d="M${L.far - 11} ${fy - 34}h18l-4-11h-10z" fill="#f6c445" class="pk-glow"/><path d="M${L.far - 8} ${fy}h12" stroke="#737a8c" stroke-width="2.500" stroke-linecap="round"/>`;
      if (!D.has('telescope')) o += `<g transform="translate(${L.win + 13} ${b.y + 62})"><path d="M0 0l-4 12M0 0l5 12" stroke="#737a8c" stroke-width="1.500"/><rect x="-9" y="-5" width="18" height="6" rx="3" fill="#3d4a7a" transform="rotate(-25)"/></g>`;
      front += deskG(L.desk, fy, 52) + laptopG(L.desk - 9, deskTop) + `<rect x="${L.desk + 12}" y="${deskTop - 6}" width="9" height="6" rx="1.500" fill="#fff"/><path d="M${L.desk + 21} ${deskTop - 4}h2.500" stroke="#fff" stroke-width="1.500"/><rect x="${L.desk - 24}" y="${deskTop - 4}" width="12" height="4" rx="1" fill="#f08aa6"/>`;
      break;
    }
  }
  if (D.has('plants') && t.id !== 'fern') o += potG(b.side ? b.x + b.w - 7 : b.x + 7, fy, '#5fae7b', 12, '#f2c078') + `<circle cx="${b.side ? b.x + b.w - 7 : b.x + 7}" cy="${fy - 3}" r="1.200" fill="#fdf3a0" class="pk-twinkle"/>`;
  if (D.has('stickers') && i !== 2) o += boltG(b.side ? b.x + 8 : b.x + b.w - 8, b.y + 70, 0.850);
  return { back: o, front, L, b };
}

function peopleArt(i, v, parts) {
  const t = TENANTS[i], { L, b } = parts;
  const fy = L.floorY;
  let o = '';
  const home = !v.away.has(t.id);
  const bubble = v.bubbles[t.id];
  if (home) {
    const expr = bubble ? (bubble.age >= 1 ? 'worried' : 'wow') : v.happy.has(t.id) ? 'happy' : 'smile';
    o += personAt(t.look, L.desk, fy - 16, 50, expr, 'pk-bob');
  } else {
    o += `<rect x="${L.desk - 6}" y="${fy - 36}" width="12" height="10" rx="1.500" fill="#fff" transform="rotate(-5 ${L.desk} ${fy - 30})"/><path d="M${L.desk - 3} ${fy - 32}h6M${L.desk - 3} ${fy - 29}h4" stroke="#b9bfcc" stroke-width="1"/>`;
  }
  o += parts.front;
  const guest = v.visitors.find((g) => g.host === t.id);
  if (guest) {
    const gx = b.side ? b.x + 22 : b.x + b.w - 22;
    const look = TENANT_BY_ID[guest.who].look;
    o += `<g class="pk-bob3"><rect x="${gx - 8}" y="${fy - 20}" width="16" height="20" rx="6" fill="${look.top}"/>${personAt(look, gx, fy - 12, 40, 'happy')}</g>`;
    o += `<path class="pk-heartfloat" d="M${(gx + L.desk) / 2} ${b.y + 26}c-3.500-4 1.500-7 3-3.500 1.500-3.500 6.500-.500 3 3.500l-3 3.500z" fill="#f27d6b"/>`;
  }
  return o;
}

function bubbleArt(i, v) {
  const t = TENANTS[i], bub = v.bubbles[t.id];
  if (!bub) return '';
  const b = roomBox(i), L = LAYOUT(b);
  const x = L.desk + (b.side ? 26 : -26), y = b.y + 18;
  const ic = bub.project ? 'sparkle' : TYPES[bub.type].icon;
  const col = bub.project ? '#7b5fc4' : bub.age >= 1 ? '#e2603f' : '#d98200';
  const tail = b.side ? `M${x - 9} ${y + 9}l-9 8 12-3z` : `M${x + 9} ${y + 9}l9 8-12-3z`;
  return `<g class="pk-bubble" style="animation-delay:${(i % 4) * 0.230}s"><path d="${tail}" fill="#fff"/><circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="${col}" stroke-width="2"/>${iconG(ic, x, y, 17, col, 2.200)}`
    + (bub.count > 1 ? `<circle cx="${x + 11}" cy="${y - 10}" r="6" fill="${col}"/><text x="${x + 11}" y="${y - 7.200}" text-anchor="middle" font-size="8.500" font-weight="900" fill="#fff" font-family="inherit">${bub.count}</text>` : '')
    + `</g>`;
}

// ---------- stairwell, roof, basement ----------
function stairsArt(v) {
  const D = v.decor;
  let o = `<rect x="160" y="88" width="40" height="408" fill="#f7e2c2"/>`;
  for (let f = 0; f < 4; f++) {
    const y = 396 - f * FLOOR_H;
    o += `<rect x="160" y="${y + 90}" width="40" height="8" fill="#e6bd8c"/>`;
    for (let k = 0; k < 6; k++) o += `<rect x="${164 + k * 5.400}" y="${y + 86 - k * 9}" width="7" height="${4 + k * 9}" fill="${k % 2 ? '#dba873' : '#e3b684'}"/>`;
    o += `<path d="M163 ${y + 78}L196 ${y + 30}" stroke="${WOOD_D}" stroke-width="2.200" stroke-linecap="round"/>`;
    if (D.has('fairylights')) {
      o += `<path d="M160 ${y + 8}q20 12 40 0" stroke="#8a6a52" stroke-width="1" fill="none"/>`;
      o += [0, 1, 2, 3].map((k) => `<circle cx="${166 + k * 9.500}" cy="${y + 12.500 + (k === 1 || k === 2 ? 2.500 : 0)}" r="2.200" fill="${['#f6c445', '#f27d6b', '#8fd3b5', '#f6c445'][k]}" class="pk-twinkle" style="animation-delay:${(k + f) * 0.350}s"/>`).join('');
    }
  }
  // Front door on the ground floor.
  o += `<rect x="168" y="446" width="24" height="42" rx="8" fill="#e9825f"/><circle cx="187" cy="468" r="1.800" fill="#fff6e4"/><rect x="173" y="452" width="14" height="12" rx="5" fill="#ffd7a8"/>`;
  if (D.has('rug')) o += `<rect x="165" y="486" width="30" height="5" rx="2" fill="#8fd3b5"/><path d="M169 488.500h22" stroke="#fff" stroke-width="1.200" stroke-dasharray="2 2"/>`;
  if (D.has('zinerack')) o += `<rect x="161" y="424" width="9" height="20" rx="1.500" fill="${WOOD_D}"/>` + ['#f08aa6', '#3fb7a8', '#f6c445'].map((c, k) => `<rect x="162.500" y="${426 + k * 6}" width="6" height="4.500" fill="${c}"/>`).join('');
  if (D.has('patternwall')) o += [[0, 320], [1, 218]].map(([k, y]) => `<rect x="${164 + k * 3}" y="${y}" width="11" height="13" fill="#fff" stroke="${WOOD_D}" stroke-width="1.500"/><path d="M${166 + k * 3} ${y + 10}l3-7 4 7" stroke="#7e8fb0" stroke-width="1" fill="none" stroke-dasharray="1.500 1"/>`).join('');
  if (D.has('newsletter')) o += `<rect x="186" y="214" width="10" height="13" fill="#fff" transform="rotate(4 191 220)"/><path d="M188 218h6M188 221h6M188 224h4" stroke="#f08aa6" stroke-width="1"/>`;
  if (D.has('breadbasket')) o += `<path d="M183 178h14l-2 8h-10z" fill="#c98f52"/><ellipse cx="190" cy="177" rx="6" ry="3.500" fill="#e0a25c"/>`;
  if (D.has('dancefloor')) o += noteG(170, 318, '#f27d6b', 0.200) + noteG(186, 334, '#7e8fb0', 1) + `<path d="M162 384h36" stroke="#f08aa6" stroke-width="2" stroke-dasharray="4 4"/>`;
  if (v.up.printer) o += `<rect x="180" y="268" width="17" height="12" rx="2.500" fill="#8f96a8"/><rect x="183" y="263" width="11" height="6" fill="#fff"/><circle cx="194" cy="276" r="1.300" fill="#58b98f" class="pk-blinkled"/>`;
  if (v.up.noticeboard) o += `<rect x="181" y="330" width="16" height="20" rx="2" fill="#d9a066" stroke="${WOOD_D}" stroke-width="1"/><rect x="183" y="333" width="5" height="6" fill="#fff"/><rect x="190" y="335" width="5" height="5" fill="#fdf3a0"/><rect x="184" y="342" width="6" height="5" fill="#f6b7c5"/>`;
  return o;
}

function roofArt(v) {
  const D = v.decor;
  let o = '';
  // chimney and smoke
  o += `<rect x="262" y="14" width="20" height="30" rx="2" fill="#d9775b"/><rect x="259" y="10" width="26" height="7" rx="3" fill="#c5634a"/>`;
  o += [0, 1, 2].map((k) => `<circle cx="${272 + k * 3}" cy="${4 - k * 8}" r="${4 + k * 1.500}" fill="#fff" opacity=".7" class="pk-smoke" style="animation-delay:${k * 1.300}s"/>`).join('');
  // antenna
  o += `<path d="M92 34V2M84 10h16M87 17h10" stroke="#8f96a8" stroke-width="2.200" stroke-linecap="round"/><circle cx="92" cy="2" r="2.500" fill="#f27d6b" class="pk-blinkled"/>`;
  if (v.up.router) o += `<path d="M100 6a10 10 0 0 1 0 12M105 2a16 16 0 0 1 0 20" stroke="#58b98f" stroke-width="1.800" fill="none" stroke-linecap="round" class="pk-wifi"/>`;
  if (D.has('onair')) o += noteG(78, 8, '#f27d6b', 0.600) + noteG(108, 26, '#f6a81c', 1.800);
  // roof body
  o += `<path d="M14 92L62 34H298L346 92Z" fill="#ef8a6c"/><path d="M14 92L62 34H298L346 92Z" fill="url(#pkTiles)" opacity=".5"/><path d="M10 92h340" stroke="#c5634a" stroke-width="6" stroke-linecap="round"/>`;
  o += `<rect x="100" y="49" width="160" height="28" rx="10" fill="${CREAM}" stroke="#c5634a" stroke-width="2"/><text x="180" y="68" text-anchor="middle" font-size="12.500" font-weight="900" fill="#d9603f" font-family="inherit" letter-spacing="1" textLength="132" lengthAdjust="spacingAndGlyphs">MARIGOLD HOUSE</text>`;
  o += [[86, 63], [274, 63]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-4.500" rx="2.600" ry="4" fill="#f6a81c" transform="rotate(${a})"/>`).join('')}<circle r="2.600" fill="#d98200"/></g>`).join('');
  if (D.has('bunting')) {
    o += `<path d="M26 80q154 10 308 0" stroke="#8a6a52" stroke-width="1" fill="none"/>`;
    for (let k = 0; k < 14; k++) { const x = 38 + k * 21.800; const y = 80.500 + Math.sin((k + 0.500) / 14 * Math.PI) * 4.600; o += `<path d="M${x - 4.500} ${y}h9l-4.500 8z" fill="${['#f27d6b', '#f6c445', '#8fd3b5', '#c9b8f0'][k % 4]}"/>`; }
  }
  if (D.has('rooflights')) {
    o += `<path d="M104 30q76 20 158 -8" stroke="#8a6a52" stroke-width="1" fill="none"/>`;
    for (let k = 0; k < 7; k++) { const tt = (k + 0.500) / 7; const x = 104 + tt * 158; const y = 30 - 8 * tt + Math.sin(tt * Math.PI) * 13; o += `<circle cx="${x}" cy="${y + 3}" r="4" fill="${k % 2 ? '#f6c445' : '#ffd7a8'}" class="pk-twinkle" style="animation-delay:${k * 0.300}s"/>`; }
  }
  if (D.has('telescope')) o += `<g transform="translate(206 34)"><path d="M-6 0L0-15L7 0" stroke="#737a8c" stroke-width="2" fill="none"/><rect x="-13" y="-22" width="26" height="8" rx="4" fill="#3d4a7a" transform="rotate(-24 0 -18)"/></g><path d="M228 34v-8h8v8M226 26h12" stroke="#58b98f" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (v.up.fairylights || D.has('fairylights')) {
    for (let k = 0; k < 12; k++) o += `<circle cx="${28 + k * 27.600}" cy="${99 + (k % 2) * 2}" r="2" fill="${['#f6c445', '#f27d6b', '#8fd3b5'][k % 3]}" class="pk-twinkle" style="animation-delay:${k * 0.210}s"/>`;
  }
  return o;
}

function basementArt(v) {
  const y = 512, h = 92;
  let o = `<rect x="30" y="${y - 4}" width="300" height="${h + 8}" rx="6" fill="#cdb79b"/>`;
  o += `<rect x="36" y="${y}" width="140" height="${h}" fill="#f3e3c8"/><rect x="184" y="${y}" width="140" height="${h}" fill="#dfe4ee"/>`;
  o += `<rect x="36" y="${y + h - 8}" width="140" height="8" fill="#d2b48c"/><rect x="184" y="${y + h - 8}" width="140" height="8" fill="#b8c0d0"/>`;
  const fy = y + h - 8;
  // --- IT nook ---
  o += `<rect x="44" y="${y + 8}" width="50" height="16" rx="3" fill="#fff" stroke="${TRIM}" stroke-width="1.200"/><text x="69" y="${y + 19.500}" text-anchor="middle" font-size="8.500" font-weight="900" fill="#d98200" font-family="inherit" letter-spacing=".500">HELP DESK</text>`;
  o += `<rect x="42" y="${y + 40}" width="52" height="3" rx="1.500" fill="${WOOD_D}"/>`;
  const giftCols = { gift_knot: '#d9964e', gift_cactus: '#5fae7b', gift_bolt: '#f6c445', gift_pin: '#e9473f', gift_zine: '#f08aa6', gift_cosy: '#f6a81c', gift_tape: '#5aa7e0', gift_star: '#7f8fd6' };
  v.gifts.slice(0, 8).forEach((g, k) => { o += `<circle cx="${47 + (k % 8) * 6}" cy="${y + 36}" r="3.300" fill="${giftCols[g] || '#f6c445'}" stroke="#fff" stroke-width=".800"/>`; });
  if (v.up.chair) o += `<path d="M118 ${fy}v-34c0-8 24-8 24 0v34z" fill="#8fd3b5"/>`;
  o += personAt(EXTRA_LOOKS.you, 130, fy - 14, 48, v.youExpr || 'smile', 'pk-bob');
  o += deskG(130, fy, 60) + `<rect x="118" y="${fy - 44}" width="24" height="16" rx="2.500" fill="#3b3340"/><rect x="120" y="${fy - 42}" width="20" height="12" rx="1.500" fill="#bfe3f5" class="pk-screen"/><path d="M130 ${fy - 28}v2" stroke="#3b3340" stroke-width="3"/>`
    + `<path d="M104 ${fy - 26}h8v-6h-8z" fill="#fff"/><path d="M112 ${fy - 30}h2.500v3H112" stroke="#fff" stroke-width="1.500" fill="none"/><path d="M106 ${fy - 35}q2-3 0-5" stroke="#fff" stroke-width="1.200" fill="none" class="pk-steam"/>`;
  if (v.up.teatin) o += `<rect x="148" y="${fy - 34}" width="10" height="8" rx="2" fill="#e9473f"/><rect x="147" y="${fy - 36}" width="12" height="3" rx="1.500" fill="#f6c445"/>`;
  if (v.sam) o += `<ellipse cx="68" cy="${fy - 4}" rx="17" ry="7" fill="#c9b8f0"/>${personAt(EXTRA_LOOKS.sam, 68, fy - 4, 40, 'smile', 'pk-bob3')}<rect x="58" y="${fy - 12}" width="20" height="3" rx="1.500" fill="#737a8c"/>`;
  // --- server closet ---
  const sx = 250;
  o += `<rect x="${sx - 20}" y="${fy - 58}" width="40" height="58" rx="4" fill="#5b6478"/>`;
  for (let r = 0; r < 4; r++) {
    o += `<rect x="${sx - 16}" y="${fy - 53 + r * 13}" width="32" height="9" rx="2" fill="#3b4254"/>`;
    o += [0, 1, 2].map((k) => `<circle cx="${sx - 11 + k * 5}" cy="${fy - 48.500 + r * 13}" r="1.400" fill="${['#58b98f', '#f6c445', '#58b98f'][(k + r) % 3]}" class="pk-blinkled" style="animation-delay:${(k * 0.400 + r * 0.270)}s"/>`).join('');
    o += `<path d="M${sx + 4} ${fy - 48.500 + r * 13}h8" stroke="#737a8c" stroke-width="1.500" stroke-linecap="round"/>`;
  }
  if (v.up.kettlebed) o += `<rect x="${sx - 21}" y="${fy - 63}" width="42" height="6" rx="3" fill="#f08aa6"/>`;
  // cables from the rack
  const cc = ['#f27d6b', '#f6a81c', '#58b98f', '#5aa7e0'];
  o += cc.map((c, k) => `<path d="M${sx - 20} ${fy - 44 + k * 11}C${sx - 40 - k * 6} ${fy - 44 + k * 11} ${sx - 34 - k * 4} ${fy - 6} ${sx - 54 - k * 3} ${fy - 3}" stroke="${v.up.labels ? c : '#8f96a8'}" stroke-width="1.800" fill="none" stroke-linecap="round"/>`
    + (v.up.labels ? `<rect x="${sx - 30 - k * 2}" y="${fy - 47 + k * 11}" width="7" height="5" rx="1" fill="#fff" stroke="${c}" stroke-width="1"/>` : '')).join('');
  o += `<rect x="${sx - 62}" y="${fy - 10}" width="16" height="10" rx="2" fill="#737a8c"/>`;
  if (v.up.router) o += `<rect x="${sx + 30}" y="${fy - 30}" width="26" height="8" rx="3" fill="#fff"/><path d="M${sx + 35} ${fy - 30}v-8M${sx + 51} ${fy - 30}v-8" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="${sx + 38}" cy="${fy - 26}" r="1.200" fill="#58b98f" class="pk-blinkled"/><rect x="${sx + 28}" y="${fy - 22}" width="30" height="3" rx="1.500" fill="#8f96a8"/>`;
  if (v.up.backups) o += `<rect x="${sx + 32}" y="${fy - 12}" width="22" height="12" rx="2.500" fill="#7f8fd6"/><circle cx="${sx + 38}" cy="${fy - 6}" r="1.500" fill="#fff" class="pk-blinkled"/><path d="M${sx + 43} ${fy - 6}h7" stroke="#fff" stroke-width="1.500" stroke-linecap="round"/>`;
  o += `<rect x="286" y="${y + 8}" width="32" height="14" rx="3" fill="#fff" opacity=".85"/><text x="302" y="${y + 18}" text-anchor="middle" font-size="7.500" font-weight="900" fill="#5b6478" font-family="inherit">SERVER</text>`;
  return o;
}

const KETTLE_AT = {
  server: (v) => [250, 512 + 84 - 58 - (v.up.kettlebed ? 5 : 0), 44, 'loaf'],
  desk: () => [156, 512 + 84 - 26, 30, 'loaf'],
  sill: () => { const b = roomBox(1); return [b.x + b.w - 20, b.y + 52, 28, 'sit']; },
  stairs: () => [181, 396 - 2 * FLOOR_H + 90, 30, 'sit'],
  roof: () => [150, 34, 34, 'sit'],
  bakery: () => { const b = roomBox(0); return [b.x + 96, b.y + b.h - 8, 32, 'loaf']; },
  chess: () => { const b = roomBox(5); return [b.x + 104, b.y + b.h - 8, 32, 'sit']; },
};

export function kettlePoint(v) { const k = (KETTLE_AT[v.kettle.spot] || KETTLE_AT.server)(v); return { x: k[0], y: k[1] - k[2] * 0.400 }; }

// view: { bubbles, decor:Set, up, visitors, away:Set, happy:Set, kettle:{spot,hat,awake}, gifts, sam, youExpr, focus }
export function houseSvg(v) {
  let o = `<svg class="pk-house" viewBox="0 0 ${HOUSE_W} ${HOUSE_H}" preserveAspectRatio="xMidYMax meet" aria-label="Marigold House">`;
  o += `<defs><linearGradient id="pkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d8f0"/><stop offset="1" stop-color="#e6f5fb"/></linearGradient>`
    + `<pattern id="pkTiles" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 10q4-8 8 0q4-8 8 0" stroke="#c5634a" stroke-width="1.200" fill="none"/></pattern>`
    + `<pattern id="pkBrick" width="22" height="12" patternUnits="userSpaceOnUse"><path d="M0 6h22M6 0v6M17 6v6" stroke="#b79c7e" stroke-width="1" opacity=".5"/></pattern></defs>`;
  // garden
  o += `<path d="M0 500h360v112H0z" fill="#c9a77e"/><path d="M0 500h360v112H0z" fill="url(#pkBrick)"/><path d="M0 496q90-8 180 0t180 0v12H0z" fill="#bfe3a8"/>`;
  o += `<g class="pk-sway"><rect x="8" y="456" width="5" height="42" rx="2" fill="#a97a4c"/><circle cx="10" cy="446" r="15" fill="#8fd3a0"/><circle cx="18" cy="458" r="9" fill="#7cc79a"/></g>`;
  o += `<circle cx="346" cy="489" r="9" fill="#8fd3a0"/><circle cx="339" cy="494" r="6" fill="#7cc79a"/>` + [[343, 484], [350, 490], [337, 492]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#f6a81c"/>`).join('');
  if (v.decor.has('repairsign')) o += `<g transform="translate(346 478)"><path d="M-9 20L0-4L9 20" stroke="${WOOD_D}" stroke-width="2.500" fill="none"/><rect x="-10" y="-6" width="20" height="17" rx="2" fill="#fff" stroke="${WOOD_D}" stroke-width="1.200"/>${iconG('improve', 0, 2.500, 11, '#d98200', 2.400)}</g>`;
  // house shell
  o += `<rect x="28" y="86" width="304" height="414" rx="6" fill="#f4dfc0" stroke="${TRIM}" stroke-width="3"/>`;
  o += stairsArt(v);
  const rooms = TENANTS.map((_, i) => roomArt(i, v));
  o += rooms.map((r) => r.back).join('');
  if (v.decor.has('plants')) o += `<path d="M331 492c4-40-3-70 2-120s-2-80 0-120" stroke="#5fae7b" stroke-width="2.500" fill="none" stroke-linecap="round"/>` + [470, 430, 392, 350, 310, 268].map((y, k) => `<ellipse cx="${k % 2 ? 336 : 329}" cy="${y}" rx="4.500" ry="2.800" fill="#7cc79a" transform="rotate(${k % 2 ? 30 : -30} ${k % 2 ? 336 : 329} ${y})"/>`).join('');
  // floor slabs and walls
  for (let f = 0; f <= 4; f++) o += `<rect x="30" y="${88 + f * FLOOR_H - (f === 4 ? 0 : 0)}" width="300" height="${f === 0 ? 6 : 6}" fill="#d9a777"/>`;
  o += `<rect x="30" y="88" width="6" height="412" fill="#d9a777"/><rect x="324" y="88" width="6" height="412" fill="#d9a777"/>`;
  o += `<rect x="158" y="94" width="3" height="402" fill="#e3b684"/><rect x="199" y="94" width="3" height="402" fill="#e3b684"/>`;
  o += roofArt(v);
  o += basementArt(v);
  if (v.decor.has('longtable')) o += `<g transform="translate(96 498)"><rect x="-44" y="-7" width="88" height="5" rx="2.500" fill="#fff"/><path d="M-44-2h88v5l-8-3-8 3-8-3-8 3-8-3-8 3-8-3-8 3-8-3-8 3-8-3z" fill="#f6b7c5"/>${[-34, -20, -6, 8, 22, 36].map((x, k) => `<ellipse cx="${x}" cy="-9" rx="5" ry="2.600" fill="${['#f6c445', '#e0a25c', '#8fd3b5', '#f27d6b', '#fff6e4', '#c9b8f0'][k]}"/>`).join('')}</g>`;
  o += rooms.map((r, i) => peopleArt(i, v, r)).join('');
  // tap targets
  o += TENANTS.map((t, i) => { const b = roomBox(i); return `<rect class="pk-hit${v.focus === t.id ? ' pk-focus' : ''}" data-act="room" data-who="${t.id}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="transparent"/>`; }).join('');
  o += `<rect class="pk-hit" data-act="nook" x="36" y="512" width="140" height="92" fill="transparent"/><rect class="pk-hit" data-act="pet" x="184" y="512" width="140" height="92" fill="transparent"/>`;
  const k = (KETTLE_AT[v.kettle.spot] || KETTLE_AT.server)(v);
  o += kettleAt(k[0], k[1], k[2], v.kettle.awake ? (k[3] === 'sit' ? 'sit' : 'look') : k[3], v.kettle.hat);
  if (!v.kettle.awake && k[3] === 'loaf') o += `<text class="pk-zzz" x="${k[0] + k[2] * 0.300}" y="${k[1] - k[2] * 0.700}" font-size="9" font-weight="900" fill="#7f8fd6" font-family="inherit">z</text>`;
  if (v.kettle.canPet) o += `<g class="pk-bubble pk-petcue" pointer-events="none"><circle cx="${k[0] + k[2] * 0.660}" cy="${k[1] - k[2] * 0.620}" r="8.500" fill="#fff" stroke="#f08aa6" stroke-width="1.600"/>${iconG('heart', k[0] + k[2] * 0.660, k[1] - k[2] * 0.620, 10, '#f27d6b', 2.600)}</g>`;
  o += `<g pointer-events="none">${TENANTS.map((_, i) => bubbleArt(i, v)).join('')}</g>`;
  o += `</svg>`;
  return o;
}
