// Patch & Kettle: small inline SVG icons (24x24, rounded strokes). No emoji anywhere.
const P = {
  power: '<path d="M12 3v8"/><path d="M7 6.5a7.5 7.5 0 1 0 10 0"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
  printer: '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2.5"/><path d="M7 14h10v7H7z"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 20 3M16 7l3 3M13.5 9.5l2 2"/>',
  wifi: '<path d="M2.5 9.5a14 14 0 0 1 19 0"/><path d="M6 13.2a9 9 0 0 1 12 0"/><path d="M9.3 16.8a4.2 4.2 0 0 1 5.4 0"/><circle cx="12" cy="20" r="1.2" fill="currentColor"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7.5 8 6 8-6"/>',
  folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2.5h6.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  tag: '<path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 12.5 20z"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5a4 4 0 0 1-.5 8z"/><path d="M12 12v5M9.8 14.8 12 17l2.2-2.2"/>',
  chair: '<path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v7h-13V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M4 12h16v3.5H4zM12 15.5V19M7 21.5l5-2.5 5 2.5"/>',
  cat: '<path d="M4.5 4 8 8.2a7.3 7.3 0 0 1 8 0L19.5 4v8.2a7.5 7.5 0 0 1-15 0z"/><path d="M9.3 12.5v.6M14.7 12.5v.6M10.8 15.6 12 16.6l1.2-1"/>',
  sam: '<circle cx="12" cy="9" r="4.5"/><path d="M6.5 8.5c0-4 2.5-5.5 5.5-5.5s5.5 1.5 5.5 5.5h3"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  board: '<rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M7 8.5h4v4H7zM14 8.5h3M14 12h3M9 18v3M15 18v3"/>',
  tea: '<path d="M4 10h13v4.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5z"/><path d="M17 11.5h1.5a2.5 2.5 0 0 1 0 5H16.6"/><path d="M8 3.5c-1 1.2 1 2 0 3.5M12.5 3.5c-1 1.2 1 2 0 3.5"/>',
  lights: '<path d="M2.5 5c5 4 14 4 19 0"/><circle cx="6.5" cy="10" r="2"/><circle cx="12" cy="11.5" r="2"/><circle cx="17.5" cy="10" r="2"/><path d="M6.5 7.3V8M12 8.6v.9M17.5 7.3V8"/>',
  rug: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6.5 10.5h11M6.5 13.5h11M3 9.5H1.5M3 14.5H1.5M21 9.5h1.5M21 14.5h1.5"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.6 9.6c-.6-.8-1.5-1.1-2.6-1.1-1.5 0-2.6.7-2.6 1.8 0 2.6 5.4 1.2 5.4 3.9 0 1.1-1.2 1.8-2.8 1.8-1.200 0-2.2-.4-2.800-1.2"/>',
  heart: '<path d="M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8 2.3c0 5.700-8 10.600-8 10.600z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.300 2"/>',
  home: '<path d="M3.500 11.500 12 4l8.500 7.500"/><path d="M5.500 10v9.500h13V10"/><path d="M10 19.500v-5h4v5"/>',
  tickets: '<path d="M4 7.500A2.500 2.500 0 0 1 6.500 5h11A2.500 2.500 0 0 1 20 7.500V10a2 2 0 0 0 0 4v2.500a2.500 2.500 0 0 1-2.500 2.500h-11A2.500 2.500 0 0 1 4 16.500V14a2 2 0 0 0 0-4z"/><path d="M9.500 9.500h5M9.500 14.500h5"/>',
  threads: '<circle cx="6" cy="7" r="2.800"/><circle cx="18" cy="8" r="2.800"/><circle cx="11" cy="18" r="2.800"/><path d="M8.600 7.800c3 .800 4.500.800 6.700.400M7.200 9.600c.800 2.500 1.700 4 2.800 5.800M16.600 10.500c-1 2.200-2.200 3.800-3.800 5.600"/>',
  improve: '<path d="M14.500 5.500a4.500 4.500 0 0 0-6 5.600L3.500 16.100a2 2 0 0 0 0 2.900l1.500 1.500a2 2 0 0 0 2.900 0l5-5a4.500 4.500 0 0 0 5.600-6l-2.800 2.800-2.700-.500-.500-2.700z"/>',
  book: '<path d="M5 4.500h11.500A2.500 2.500 0 0 1 19 7v13H7.500A2.500 2.500 0 0 1 5 17.500z"/><path d="M5 17.500A2.500 2.500 0 0 1 7.500 15H19M9 8.500h6M9 11.500h4"/>',
  back: '<path d="M14.500 5 7.500 12l7 7"/>',
  door: '<path d="M6 21V4.500A1.500 1.500 0 0 1 7.500 3h9A1.500 1.500 0 0 1 18 4.500V21M3.500 21h17"/><circle cx="14.500" cy="12.500" r="1" fill="currentColor"/>',
  gear: '<circle cx="12" cy="12" r="3.200"/><path d="M12 2.800v2.400M12 18.800v2.400M2.800 12h2.400M18.800 12h2.400M5.500 5.500l1.700 1.700M16.800 16.800l1.700 1.700M5.500 18.500l1.700-1.700M16.800 7.200l1.700-1.700"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sound: '<path d="M4 9.500v5h3.500l5 4v-13l-5 4z"/><path d="M16 9a4.500 4.500 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9.500v5h3.500l5 4v-13l-5 4z"/><path d="m16.500 9.500 5 5M21.500 9.500l-5 5"/>',
  star: '<path d="m12 3.500 2.600 5.400 5.900.800-4.300 4.100 1.100 5.900L12 16.900l-5.300 2.800 1.100-5.900-4.300-4.100 5.900-.800z"/>',
  sparkle: '<path d="M12 3c.600 4.500 2 6 6.500 6.500-4.500.600-5.900 2-6.500 6.500-.600-4.500-2-5.900-6.500-6.500C10 9 11.400 7.500 12 3z"/><path d="M18.500 15.500c.300 1.800.900 2.500 2.700 2.700-1.800.300-2.400.900-2.700 2.800-.300-1.900-.900-2.500-2.700-2.800 1.800-.200 2.400-.900 2.700-2.700z"/>',
  question: '<path d="M8.500 9a3.500 3.500 0 1 1 5.200 3.100c-1 .600-1.700 1.300-1.700 2.400"/><circle cx="12" cy="18.200" r="1.100" fill="currentColor"/>',
  bulb: '<path d="M8.500 14.500a6 6 0 1 1 7 0c-.700.600-1 1.300-1 2.500h-5c0-1.200-.300-1.900-1-2.500z"/><path d="M10 20.500h4"/>',
  arrow: '<path d="M5 12h13M13 6.500l5.500 5.500-5.500 5.500"/>',
  moon: '<path d="M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300 7 7M17 17l1.700 1.700M5.300 18.700 7 17M17 7l1.700-1.700"/>',
  note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.500 8.500h7M8.500 12h4"/>',
  gift: '<rect x="3.500" y="9" width="17" height="11" rx="2"/><path d="M3.500 13h17M12 9v11"/><path d="M12 9C9 9 7 7.800 7 6.200 7 5 8 4 9.200 4 11 4 12 6.500 12 9zm0 0c3 0 5-1.200 5-2.800C17 5 16 4 14.800 4 13 4 12 6.500 12 9z"/>',
  hat: '<path d="M4 17.500h16"/><path d="M6.500 17.500 12 4l5.500 13.500"/><circle cx="12" cy="4" r="1.200" fill="currentColor"/>',
  trash: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 13h9l1-13M10 11v5.500M14 11v5.500"/>',
  photo: '<rect x="3.500" y="5" width="17" height="14" rx="2.500"/><circle cx="9" cy="10" r="1.700"/><path d="m5 17 4.500-4 3.500 3 2.500-2 3.500 3"/>',
  doc: '<path d="M6.500 3.500h8l4 4v13h-12z"/><path d="M14.500 3.500v4h4M9.500 12h5.500M9.500 15.500h5.500"/>',
  music: '<path d="M9.500 17.500V6l9-2v11.500"/><circle cx="7" cy="17.500" r="2.500"/><circle cx="16" cy="15.500" r="2.500"/>',
  sheet: '<rect x="4" y="4" width="16" height="16" rx="2.500"/><path d="M4 9.500h16M4 14.500h16M10 4v16"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
  camera: '<circle cx="12" cy="11" r="6.500"/><circle cx="12" cy="11" r="2.500"/><path d="M8 20.500h8M12 17.500v3"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14.500" r="3"/><circle cx="12" cy="7.500" r="1.200" fill="currentColor"/>',
  monitor: '<rect x="3" y="4.500" width="18" height="12" rx="2.500"/><path d="M9 20.500h6M12 16.500v4"/>',
  router: '<rect x="3.500" y="13" width="17" height="6.500" rx="2"/><path d="M7 16.200h.1M10.500 16.200h.1M17 13V7M14 5.500a4 4 0 0 1 6 0"/>',
  lamp: '<path d="M8 3.500h8l3 8H5z"/><path d="M12 11.500v8M8 20.500h8"/>',
  keyboard: '<rect x="2.500" y="6.500" width="19" height="11" rx="2.500"/><path d="M6 10h.1M9.500 10h.1M13 10h.1M16.500 10h.1M6 13.500h.1M16.500 13.500h.1M9.500 13.500h4"/>',
  scanner: '<path d="M4 13.500h16v5.500H4z"/><path d="M5.500 13.500 17 6M8 16.500h5"/>',
  radio: '<rect x="3.500" y="8" width="17" height="12" rx="2.500"/><circle cx="9" cy="14" r="2.800"/><path d="M15 12h2.500M15 15.500h2.500M7 8l9-4.500"/>',
  lock: '<rect x="5" y="10.500" width="14" height="10" rx="2.500"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>',
  fish: '<path d="M3 12c3-5 9-5.500 13-1.500L20.500 7v10L16 13.500C12 17.500 6 17 3 12z"/><circle cx="8" cy="11" r="1" fill="currentColor"/>',
  paw: '<circle cx="7" cy="9.500" r="1.800"/><circle cx="12" cy="7" r="1.800"/><circle cx="17" cy="9.500" r="1.800"/><path d="M12 12c-3 0-5 2.200-5 4.300 0 1.500 1.200 2.200 2.500 2.200 1 0 1.500-.500 2.500-.500s1.500.500 2.500.500c1.300 0 2.500-.700 2.500-2.200 0-2.100-2-4.300-5-4.300z"/>',
  wave: '<path d="M3 12h2l2-5 3 10 3-13 3 13 2-5h3"/>',
  restart: '<path d="M4.500 12a7.500 7.500 0 1 0 2.500-5.600"/><path d="M4 4.500v4.500h4.500"/>',
  hand: '<path d="M8 11.500V5.200a1.600 1.600 0 0 1 3.200 0V10M11.200 9V4.200a1.600 1.600 0 0 1 3.200 0V10M14.400 9.500V5.700a1.600 1.600 0 0 1 3.200 0v8.300a6.500 6.500 0 0 1-6.500 6.500c-2.600 0-4-1-5.300-3.200L3.700 13a1.600 1.600 0 0 1 2.700-1.700L8 13.500"/>',
};

export function icon(name, size = 22, cls = '') {
  const inner = P[name] || P.question;
  return `<svg class="pk-ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// For use inside a larger SVG: the icon's shapes in a <g>, centred on (x, y).
export function iconG(name, x, y, size = 16, color = 'currentColor', sw = 2) {
  const s = size / 24;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${s})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" color="${color}">${P[name] || P.question}</g>`;
}

export const hasIcon = (name) => !!P[name];
