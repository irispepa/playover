// Inline SVG icons (no fonts or images). Each returns an <svg> string, 24x24 viewBox.
const svg = (body, cls = '') => `<svg class="tw-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

const RES_ICONS = {
  food: '<path d="M6 13c0-4 3-7 7-7 3 0 5 2 5 5 0 5-4 8-8 8-2.5 0-4-2-4-6z" fill="#e8584a"/><path d="M12 6c0-2 1-3 3-3" stroke="#5a3a1e" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M13 5c2-1.5 4-1 5 0-1.5 1.5-3.5 1.5-5 0z" fill="#59b14a"/><ellipse cx="9.5" cy="11" rx="1.2" ry="2" fill="#fff" opacity=".5"/>',
  wood: '<rect x="3" y="8" width="18" height="8" rx="4" fill="#a8743f"/><ellipse cx="18" cy="12" rx="3" ry="4" fill="#e3c08a"/><ellipse cx="18" cy="12" rx="1.4" ry="2" fill="none" stroke="#a8743f" stroke-width="1"/><path d="M6 10h8M6 14h7" stroke="#7a5230" stroke-width="1.1"/>',
  stone: '<path d="M3 17l3-7 5-2 4 3 5 1 1 5z" fill="#a9a399"/><path d="M6 10l5-2 4 3-3 3-6-1z" fill="#cfc9bd"/><path d="M3 17l9-1 9 1" stroke="#7d776e" stroke-width="1" fill="none"/>',
  planks: '<rect x="3" y="5" width="18" height="4" rx="1" fill="#e3c08a"/><rect x="3" y="10" width="18" height="4" rx="1" fill="#d1a86a"/><rect x="3" y="15" width="18" height="4" rx="1" fill="#e3c08a"/><path d="M8 5v4M15 10v4M10 15v4" stroke="#a8743f" stroke-width="1"/>',
  grain: '<path d="M12 21V6" stroke="#b8902e" stroke-width="1.6"/><g fill="#f0c14a"><ellipse cx="9.5" cy="8" rx="2" ry="3" transform="rotate(-25 9.5 8)"/><ellipse cx="14.5" cy="8" rx="2" ry="3" transform="rotate(25 14.5 8)"/><ellipse cx="9.5" cy="13" rx="2" ry="3" transform="rotate(-25 9.5 13)"/><ellipse cx="14.5" cy="13" rx="2" ry="3" transform="rotate(25 14.5 13)"/><ellipse cx="12" cy="4.5" rx="1.6" ry="2.6"/></g>',
  wool: '<circle cx="12" cy="12" r="8" fill="#f4efe6"/><path d="M6 9c4 1 8 4 10 9M5 13c3 0 6 2 8 6M9 5c3 2 6 6 7 10" stroke="#cfc4b0" stroke-width="1.3" fill="none"/>',
  cloth: '<path d="M4 7h14l2 3v8H6l-2-3z" fill="#8d63c4"/><path d="M4 7l2 3h14M6 10v8" stroke="#6a45a0" stroke-width="1.2" fill="none"/><path d="M9 13h8" stroke="#f2c34b" stroke-width="1.4"/>',
  ale: '<rect x="5" y="7" width="11" height="13" rx="2" fill="#e0a43a"/><path d="M16 10h2a2 2 0 012 2v3a2 2 0 01-2 2h-2" stroke="#b07a25" stroke-width="2" fill="none"/><path d="M4 8c0-3 3-4 5-3 1-2 5-2 6 0 2-.5 3 1 2 3z" fill="#fff"/>',
  ore: '<path d="M4 18l2-8 6-4 6 3 2 9z" fill="#7f7a73"/><circle cx="10" cy="12" r="1.8" fill="#e07b3a"/><circle cx="15" cy="14" r="1.5" fill="#f2c34b"/><circle cx="12" cy="16.5" r="1.1" fill="#e07b3a"/>',
  iron: '<path d="M3 15l4-6h12l2 6z" fill="#7d8a97"/><path d="M3 15h18v3H3z" fill="#5b6672"/><path d="M8 11h9" stroke="#c4ced8" stroke-width="1.2"/>',
  tools: '<path d="M5 19l9-9" stroke="#a8743f" stroke-width="2.6" stroke-linecap="round"/><path d="M11 5l6-1 3 3-1 3-4-1-1 1-3-3 1-1z" fill="#6b7682"/>',
  gold: '<circle cx="12" cy="12" r="8" fill="#f2c34b"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#c9972a" stroke-width="1.4"/><path d="M12 8.5v7M10 10.5h4" stroke="#c9972a" stroke-width="1.6" stroke-linecap="round"/>',
  pop: '<circle cx="12" cy="7.5" r="3.5" fill="#f4d6b8"/><path d="M5 20c0-5 3-8 7-8s7 3 7 8z" fill="#4f7fd0"/>',
  happy: '<circle cx="12" cy="12" r="8.5" fill="#f7d154"/><circle cx="9" cy="10" r="1.2" fill="#5a3a1e"/><circle cx="15" cy="10" r="1.2" fill="#5a3a1e"/><path d="M8 14c2 2.5 6 2.5 8 0" stroke="#5a3a1e" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  sad: '<circle cx="12" cy="12" r="8.5" fill="#f2a24b"/><circle cx="9" cy="10" r="1.2" fill="#5a3a1e"/><circle cx="15" cy="10" r="1.2" fill="#5a3a1e"/><path d="M8 16c2-2.5 6-2.5 8 0" stroke="#5a3a1e" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  worker: '<circle cx="12" cy="8.5" r="3.2" fill="#f4d6b8"/><path d="M8 7.5a4 4 0 018 0z" fill="#f2c34b"/><path d="M6 20c0-4.5 2.5-7 6-7s6 2.5 6 7z" fill="#a8743f"/>',
  house: '<path d="M4 11l8-7 8 7v9H4z" fill="#f4e7c8"/><path d="M2.5 11.5L12 3l9.5 8.5" stroke="#d9573d" stroke-width="2.4" fill="none" stroke-linejoin="round"/><rect x="10" y="14" width="4" height="6" fill="#6b4526"/>',
  storage: '<rect x="4" y="8" width="16" height="12" rx="1" fill="#a8743f"/><path d="M3 9l9-5 9 5" fill="#6b4526"/><path d="M4 13h16M10 13v7M14 13v7" stroke="#6b4526" stroke-width="1.2"/>',
};

const UI_ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  play: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>',
  fast: '<path d="M3 6l9 6-9 6zM12 6l9 6-9 6z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="2.2" fill="none"/>',
  up: '<path d="M12 4l7 8h-4v7H9v-7H5z" fill="currentColor"/>',
  trash: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
  wrench: '<path d="M14.5 4a5 5 0 00-4.6 6.9L4 16.8 7.2 20l5.9-5.9A5 5 0 0020 9.5l-3 3-3.5-1-1-3.5 3-3z" fill="currentColor"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
  ship: '<path d="M3 15h18l-3 5H6z" fill="#6b4526"/><path d="M11 3v12" stroke="#2c2a2e" stroke-width="1.5"/><path d="M12 4l7 9h-7z" fill="#fbf8f1"/><path d="M10.5 5l-6 8h6z" fill="#e0d6bd"/>',
  scroll: '<path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2z" fill="#f4e7c8"/><path d="M6 4a2 2 0 00-2 2v1h2M9 9h7M9 12h7M9 15h5" stroke="#a8743f" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  arrow: '<path d="M5 12h12M13 7l5 5-5 5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5" fill="currentColor"/><g fill="#18212f"><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></g>',
  hammer: '<path d="M13 9l-8 8 2 2 8-8" fill="#a8743f"/><path d="M11 4l4-1 6 6-3 3-2-2-2 1-3-3 1-2z" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  range: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>',
};

export const resIcon = (k, cls) => svg(RES_ICONS[k] || RES_ICONS.storage, cls);
export const uiIcon = (k, cls) => svg(UI_ICONS[k] || '', cls);
