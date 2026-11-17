// Inline SVG icons (24x24). No external assets, no emoji.
const P = {
  heart: '<path d="M12 21s-7.5-4.6-9.3-9.3C1.4 8.2 3.6 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.9 1.4-1.8 2.8-2.9 4.8-2.9 3.6 0 5.8 3.7 4.5 7.2C19.5 16.4 12 21 12 21z" fill="currentColor"/>',
  bolt: '<path d="M13.5 2 4.5 13.5h6L9.5 22l10-12h-6.2z" fill="currentColor"/>',
  sword: '<path d="M19.5 2.5h2v2L10 16l-2-2z" fill="currentColor"/><path d="M5 13l6 6-1.5 1.5-2-2L4 22l-2-2 3.5-3.5-2-2z" fill="currentColor"/>',
  shield: '<path d="M12 2 4 5v6.5c0 5 3.4 8.7 8 10.5 4.6-1.8 8-5.5 8-10.5V5z" fill="currentColor"/>',
  boot: '<path d="M7 2h7v9l6 3.5V20H4v-3l3-1z" fill="currentColor"/>',
  star: '<path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 6.5V12l3.8 2.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  coin: '<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#00000055" stroke-width="2"/>',
  key: '<circle cx="7.5" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 12h10M18 12v4M21 12v3" stroke="currentColor" stroke-width="3" fill="none"/>',
  potion: '<path d="M9 2h6v2h-1v4.2c3 1.1 5 3.9 5 7.3A7 7 0 0 1 12 22a7 7 0 0 1-7-6.5c0-3.4 2-6.2 5-7.3V4H9z" fill="currentColor"/><path d="M7 15h10a5 5 0 0 1-10 0z" fill="#ffffff44"/>',
  bomb: '<circle cx="11" cy="14" r="7.5" fill="currentColor"/><path d="M15 7.5 17 5.5M17.5 3l1 2M20 4.5l-2 .8M19.5 7.5l-1.8-.8" stroke="#ffb040" stroke-width="2" stroke-linecap="round"/>',
  scroll: '<path d="M6 3h11a3 3 0 0 1 3 3v1h-4v12a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3v-1h3z" fill="currentColor"/><path d="M8 8h6M8 12h6M8 16h4" stroke="#00000066" stroke-width="1.8"/>',
  skull: '<path d="M12 2C7 2 3.5 5.5 3.5 10c0 2.7 1.2 4.6 3 5.8V20h11v-4.2c1.8-1.2 3-3.1 3-5.8C20.5 5.5 17 2 12 2z" fill="currentColor"/><circle cx="8.5" cy="11" r="2.3" fill="#000"/><circle cx="15.5" cy="11" r="2.3" fill="#000"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>',
  dash: '<path d="M3 7h8M2 12h9M3 17h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13 4l8 8-8 8z" fill="currentColor"/>',
  stairs: '<path d="M3 21v-4h4v-4h4V9h4V5h6v16z" fill="currentColor"/>',
  gem: '<path d="M7 3h10l4 6-9 12L3 9z" fill="currentColor"/><path d="M3 9h18M12 21 8.5 9 12 3l3.5 6z" fill="none" stroke="#00000044" stroke-width="1.4"/>',
  drop: '<path d="M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z" fill="currentColor"/>',
  fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3.5 2.5 4C11 9 10 6 12 2z" fill="currentColor"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  poison: '<circle cx="9" cy="14" r="5.5" fill="currentColor"/><circle cx="16.5" cy="8" r="4" fill="currentColor"/><circle cx="17" cy="17" r="2.5" fill="currentColor"/>',
  thorn: '<path d="M12 2 14 10l8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor"/>',
  magnet: '<path d="M5 3h4v9a3 3 0 0 0 6 0V3h4v9a7 7 0 0 1-14 0z" fill="currentColor"/><path d="M5 6h4M15 6h4" stroke="#00000066" stroke-width="2"/>',
  ring: '<circle cx="12" cy="14" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 4h6l1.5 3.5h-9z" fill="currentColor"/>',
  spark: '<path d="M12 1.5 13.8 10.2 22.5 12 13.8 13.8 12 22.5 10.2 13.8 1.5 12 10.2 10.2z" fill="currentColor"/>',
  bow: '<path d="M6 2c8 3 8 17 0 20" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M6 2v20" stroke="currentColor" stroke-width="1.2"/><path d="M4 12h16M17 9l3 3-3 3" stroke="currentColor" stroke-width="2" fill="none"/>',
  spear: '<path d="M3 21 17 7" stroke="currentColor" stroke-width="2.4"/><path d="M14.5 4.5 21.5 2.5 19.5 9.5z" fill="currentColor"/>',
  axe: '<path d="M5 21 16 6" stroke="currentColor" stroke-width="2.6"/><path d="M12 3c4-1.5 8 1 9.5 5-3.5.5-6-1-7.5-2.5z" fill="currentColor"/>',
  dagger: '<path d="M16 3h3v3L10 15l-2-2z" fill="currentColor"/><path d="M6 12l6 6M7 17l-3 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  hammer: '<rect x="11" y="2" width="9" height="7" rx="1" transform="rotate(45 15.5 5.5)" fill="currentColor"/><path d="M12 12 3.5 20.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  crossbow: '<path d="M3 8c6-4 12-4 18 0" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 6v16M8 18h8" stroke="currentColor" stroke-width="2.6"/>',
  staff: '<path d="M7 22 15 8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="16.5" cy="5.5" r="3.5" fill="currentColor"/>',
  wand: '<path d="M4 20 14 10" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="m17 2 1.2 3.3L21.5 6.5 18.2 7.7 17 11l-1.2-3.3L12.5 6.5l3.3-1.2z" fill="currentColor"/>',
  robe: '<path d="M9 2h6l1 4 4 16H4L8 6z" fill="currentColor"/>',
  leather: '<path d="M7 3h10l3 4-2 3v11H6V10L4 7z" fill="currentColor"/>',
  mail: '<path d="M6 3h12l3 5-3 2v11H6V10L3 8z" fill="currentColor"/><path d="M8 9h8M8 13h8M8 17h8" stroke="#00000055" stroke-width="1.6"/>',
  plate: '<path d="M5 3h14l2 4-2 4v10H5V11L3 7z" fill="currentColor"/><path d="M12 3v18M5 11h14" stroke="#00000055" stroke-width="1.8"/>',
  amulet: '<path d="M5 2c0 6 3 9 7 9s7-3 7-9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10l5 5-5 7-5-7z" fill="currentColor"/>',
  charm: '<circle cx="12" cy="13" r="7" fill="currentColor"/><path d="M12 2v4" stroke="currentColor" stroke-width="2.4"/><path d="M12 9l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#00000055"/>',
  talisman: '<path d="M12 2 20 7v10l-8 5-8-5V7z" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="#00000055"/>',
  wall: '<path d="M2 4h20v16H2z" fill="currentColor"/><path d="M2 9.3h20M2 14.6h20M8 4v5.3M16 4v5.3M12 9.3v5.3M6 14.6V20M18 14.6V20" stroke="#00000066" stroke-width="1.6"/>',
  fan: '<path d="M12 21 4 6M12 21l4-16M12 21l8-12M12 21 8 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  ghost: '<path d="M12 2a7 7 0 0 0-7 7v13l2.5-2 2.3 2 2.2-2 2.2 2 2.3-2 2.5 2V9a7 7 0 0 0-7-7z" fill="currentColor"/><circle cx="9.5" cy="10" r="1.6" fill="#000"/><circle cx="14.5" cy="10" r="1.6" fill="#000"/>',
  bag: '<path d="M8 7V5a4 4 0 0 1 8 0v2h3l1 15H4L5 7z" fill="currentColor"/><path d="M8 7h8" stroke="#00000055" stroke-width="2"/>',
  close: '<path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" fill="currentColor"/><path d="M9 3v16M15 5v16" stroke="#00000055" stroke-width="1.6"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><circle cx="8" cy="8" r="1.8" fill="#000"/><circle cx="16" cy="16" r="1.8" fill="#000"/><circle cx="12" cy="12" r="1.8" fill="#000"/><circle cx="16" cy="8" r="1.8" fill="#000"/><circle cx="8" cy="16" r="1.8" fill="#000"/>',
  crown: '<path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z" fill="currentColor"/>',
  eye: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="currentColor"/><circle cx="12" cy="12" r="3.5" fill="#000"/>',
  up: '<path d="M12 4 4 14h5v6h6v-6h5z" fill="currentColor"/>',
  down: '<path d="M12 20 4 10h5V4h6v6h5z" fill="currentColor"/>',
  check: '<path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="4.5" y="10" width="15" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.6"/>',
  hand: '<path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10V3a1.5 1.5 0 0 1 3 0v7V4.5a1.5 1.5 0 0 1 3 0V13l1.5-2.5a1.5 1.5 0 0 1 2.6 1.5L17 20H9l-3.5-6A1.5 1.5 0 0 1 8 12.5z" fill="currentColor"/>',
};

export function icon(name, size = 18, color) {
  const body = P[name] || P.spark;
  const style = color ? ` style="color:${color}"` : '';
  return `<svg class="dv-ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"${style}>${body}</svg>`;
}

export const SLOT_ICON = { weapon: 'sword', armor: 'shield', trinket: 'ring' };

// The same icon as a nested <svg> placed inside a larger SVG drawing (x, y = top-left, in the parent's units).
export function glyph(name, x, y, size, color) {
  const body = P[name] || P.spark;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${color || 'currentColor'}">${body}</svg>`;
}
