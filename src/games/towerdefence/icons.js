// Inline SVG icons (no external assets, no emoji).
import { TOWERS, ENEMIES } from './data.js';

const svg = (body, vb = 32) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true">${body}</svg>`;

export const ICON = {
  heart: svg('<path d="M16 28C6 20 3 15 3 10.5 3 6.9 5.9 4 9.4 4c2.6 0 4.8 1.5 6.6 4 1.8-2.5 4-4 6.6-4C26.1 4 29 6.9 29 10.5 29 15 26 20 16 28z" fill="#e25c5c"/>'),
  coin: svg('<circle cx="16" cy="16" r="12" fill="#f0b44c"/><circle cx="16" cy="16" r="8" fill="none" stroke="#a8741c" stroke-width="2.5"/>'),
  wave: svg('<path d="M3 20c4-6 8-6 12 0s8 6 14 0" fill="none" stroke="#9fd0ff" stroke-width="4" stroke-linecap="round"/><path d="M3 12c4-6 8-6 12 0s8 6 14 0" fill="none" stroke="#5a8fc0" stroke-width="3" stroke-linecap="round"/>'),
  menu: svg('<rect x="6" y="8" width="20" height="3.5" rx="1.5" fill="currentColor"/><rect x="6" y="14.5" width="20" height="3.5" rx="1.5" fill="currentColor"/><rect x="6" y="21" width="20" height="3.5" rx="1.5" fill="currentColor"/>'),
  pause: svg('<rect x="8" y="6" width="6" height="20" rx="1.5" fill="currentColor"/><rect x="18" y="6" width="6" height="20" rx="1.5" fill="currentColor"/>'),
  play: svg('<path d="M9 5l18 11L9 27z" fill="currentColor"/>'),
  close: svg('<path d="M8 8l16 16M24 8L8 24" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>'),
  check: svg('<path d="M6 17l7 7 13-15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
  meteor: svg('<circle cx="19" cy="19" r="8" fill="#ff7a2f"/><path d="M4 4l10 10M8 3l8 8M3 9l8 8" stroke="#ffc080" stroke-width="2.5" stroke-linecap="round"/>'),
  freeze: svg('<path d="M16 3v26M5 9.5l22 13M27 9.5l-22 13" stroke="#9fe8ff" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="16" r="4" fill="#dff8ff"/>'),
  rush: svg('<circle cx="12" cy="18" r="8" fill="#f0b44c"/><circle cx="20" cy="13" r="8" fill="#ffd27a" stroke="#a8741c" stroke-width="1.5"/><path d="M20 9v8M17 12h6" stroke="#a8741c" stroke-width="2"/>'),
  orbital: svg('<path d="M16 2v18" stroke="#9ff0ff" stroke-width="5" stroke-linecap="round"/><ellipse cx="16" cy="25" rx="11" ry="4" fill="none" stroke="#60e0ff" stroke-width="3"/>'),
  hero: svg('<circle cx="16" cy="8" r="5" fill="#f0c8a0"/><path d="M8 28l2-14h12l2 14z" fill="#3fd0c0"/><rect x="20" y="15" width="9" height="3" fill="#9ff0ff"/>'),
  build: svg('<rect x="5" y="16" width="10" height="11" fill="#8f8a7e"/><rect x="17" y="10" width="10" height="17" fill="#c9a36b"/><path d="M17 10l5-6 5 6z" fill="#e25c5c"/>'),
  dash: svg('<path d="M4 16h14M8 10h12M8 22h12" stroke="#9fe8ff" stroke-width="3" stroke-linecap="round"/><path d="M20 8l8 8-8 8" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>'),
  nova: svg('<circle cx="16" cy="16" r="5" fill="#fff"/><circle cx="16" cy="16" r="11" fill="none" stroke="#c8a2ff" stroke-width="3"/><path d="M16 1v5M16 26v5M1 16h5M26 16h5" stroke="#c8a2ff" stroke-width="2.5"/>'),
  swap: svg('<path d="M6 11h18l-5-5M26 21H8l5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
  skull: svg('<path d="M16 4C9 4 5 8.5 5 14c0 3.5 1.8 6 4 7.2V26h14v-4.8c2.2-1.2 4-3.7 4-7.2C27 8.5 23 4 16 4z" fill="#e8dcc8"/><circle cx="11.5" cy="15" r="3" fill="#20242c"/><circle cx="20.5" cy="15" r="3" fill="#20242c"/>'),
  info: svg('<circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="16" cy="10" r="2" fill="currentColor"/><rect x="14.2" y="14" width="3.6" height="10" rx="1.5" fill="currentColor"/>'),
  star: svg('<path d="M16 3l3.8 8.3 9 1-6.7 6.1 1.9 8.9L16 22.8 8 27.3l1.9-8.9L3.2 12.3l9-1z" fill="#f0b44c"/>'),
};

const T = {
  wall: '<rect x="4" y="12" width="24" height="14" rx="1" fill="#8f8a7e"/><path d="M4 19h24M12 12v7M20 19v7" stroke="#5f5a52" stroke-width="2"/>',
  arrow: '<path d="M8 4c10 4 10 20 0 24" fill="none" stroke="#8a6440" stroke-width="3"/><path d="M8 4v24" stroke="#e8dcc0" stroke-width="1.2"/><path d="M6 16h20" stroke="#e8dcc0" stroke-width="2.5"/><path d="M27 16l-6-4v8z" fill="#c9cfd8"/>',
  cannon: '<circle cx="12" cy="19" r="8" fill="#4c525c"/><rect x="12" y="13" width="16" height="7" rx="2" fill="#30343c" transform="rotate(-18 12 16)"/><circle cx="12" cy="19" r="3" fill="#6f7480"/>',
  frost: '<path d="M16 2l7 14-7 14-7-14z" fill="#7fd8ff"/><path d="M16 2l3 14-3 14" fill="#c8f0ff"/>',
  tesla: '<rect x="14" y="12" width="4" height="17" fill="#4c525c"/><ellipse cx="16" cy="22" rx="8" ry="2.5" fill="none" stroke="#b08a40" stroke-width="2"/><ellipse cx="16" cy="17" rx="6.5" ry="2" fill="none" stroke="#b08a40" stroke-width="2"/><circle cx="16" cy="8" r="5" fill="#c39bff"/><path d="M22 4l-3 4h3l-3 4" stroke="#fff" stroke-width="1.5" fill="none"/>',
  venom: '<path d="M9 10h14v14a7 7 0 0 1-14 0z" fill="#3f6a30"/><rect x="9" y="10" width="14" height="4" fill="#8be05a"/><circle cx="24" cy="6" r="3" fill="#8be05a"/><circle cx="19" cy="4" r="1.8" fill="#8be05a"/>',
  sniper: '<rect x="3" y="14" width="26" height="3" fill="#30343c"/><rect x="9" y="9" width="10" height="4" rx="1.5" fill="#4c525c"/><circle cx="19" cy="11" r="1.5" fill="#ffe07a"/><path d="M8 17l-3 9M14 17l2 9" stroke="#5f5a52" stroke-width="2"/>',
  mortar: '<ellipse cx="16" cy="25" rx="11" ry="4" fill="#6a5a48"/><rect x="13" y="6" width="8" height="18" rx="2" fill="#2f3138" transform="rotate(25 16 18)"/>',
  flame: '<path d="M16 3c3 6 9 8 9 16a9 9 0 0 1-18 0c0-5 3-7 4-11 1 3 3 4 3 4 0-4 1-6 2-9z" fill="#ff7a2f"/><path d="M16 15c2 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1-3 2-5 1 1 1 1 2 1z" fill="#ffd27a"/>',
  beacon: '<path d="M16 6l6 22H10z" fill="#c8a050"/><circle cx="16" cy="6" r="4" fill="#ffe090"/><path d="M5 6h4M23 6h4M8 1l3 3M24 1l-3 3" stroke="#ffe090" stroke-width="2" stroke-linecap="round"/>',
  mine: '<path d="M6 28l8-20M26 28L18 8" stroke="#8a6440" stroke-width="3"/><circle cx="16" cy="8" r="3" fill="#4c525c"/><circle cx="11" cy="24" r="4" fill="#e8c25a"/><circle cx="19" cy="25" r="3.5" fill="#f0d070"/><circle cx="15" cy="20" r="3" fill="#e8c25a"/>',
};
export function towerIcon(type) { return svg(T[type] || T.wall); }

const SHAPE = {
  box: '<rect x="6" y="6" width="20" height="20" rx="3"/>',
  ball: '<circle cx="16" cy="16" r="11"/>',
  cone: '<path d="M16 4l12 22H4z"/>',
  spike: '<path d="M16 3l12 13-12 13L4 16z"/>',
  disc: '<rect x="4" y="9" width="24" height="14" rx="7"/>',
  tetra: '<path d="M4 7h24L16 27z"/>',
  wing: '<path d="M2 12l14 6 14-6-6 12H8z"/>',
  boss: '<path d="M16 2l4 9 10 1-7.5 6.5L25 29l-9-5-9 5 2.5-10.5L2 12l10-1z"/>',
};
export function enemyIcon(type) {
  const e = ENEMIES[type];
  const extra = e.flying ? '<path d="M3 30h26" stroke="#9fd0ff" stroke-width="2"/>' : '';
  return svg(`<g fill="${e.color}" stroke="#0e1420" stroke-width="1.5">${SHAPE[e.shape] || SHAPE.box}</g>${e.stealth ? '<circle cx="16" cy="16" r="13" fill="none" stroke="#b0a0ff" stroke-dasharray="3 3" stroke-width="2"/>' : ''}${extra}`);
}
export const towerColor = (type) => TOWERS[type].color;

// The crystal core as a flat gem centred on cx, cy (title emblem and guide art).
export const coreGem = (cx, cy, r) => `<path d="M${cx} ${cy - r}l${r * 0.75} ${r}-${r * 0.75} ${r}-${r * 0.75}-${r}z" fill="#7fd8ff"/><path d="M${cx} ${cy - r}l${r * 0.3} ${r}-${r * 0.3} ${r}z" fill="#d8f6ff"/>`;
