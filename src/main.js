import './shell/shell.css';
import { registerSW } from 'virtual:pwa-register';
import { makeStorage } from './shell/storage.js';
import { audio } from './shell/audio.js';
import { cover } from './shell/covers.js';

let offlineReady = false;
let updateOfflineStatus = () => {};
window.addEventListener('online', () => updateOfflineStatus());
window.addEventListener('offline', () => updateOfflineStatus());
// A new version installs in the background and is applied (one reload) only when the player is on the menu.
const UPDATE_CHECK_MS = 30 * 60 * 1000;
let updatePending = false;
let inGame = false;
const updateSW = registerSW({
  immediate: true,
  onOfflineReady() { offlineReady = true; updateOfflineStatus(); },
  onNeedRefresh() { updatePending = true; if (!inGame) applyUpdate(); },
  // iOS often resumes a suspended home-screen app instead of relaunching it, which skips the load-time
  // update check. Check again on return to the foreground, at most every 30 minutes.
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !navigator.onLine || Date.now() - lastCheck < UPDATE_CHECK_MS) return;
      lastCheck = Date.now();
      reg.update().catch(() => {});
    });
  },
});
function applyUpdate() { if (updatePending) { updatePending = false; updateSW(true); } }
// Ask the browser not to evict saved games under storage pressure (granted silently or ignored).
if (navigator.storage?.persist) navigator.storage.persisted().then((p) => p || navigator.storage.persist()).catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(() => { offlineReady = true; updateOfflineStatus(); });

// Each game is a lazily loaded module whose default export is
//   { start(ctx) -> { dispose() } }       (see src/shell/CONTRACT.md)
const GAMES = [
  { id: 'everbrook', title: 'Everbrook', genre: 'Peaceful city builder', duration: 'An afternoon', tagline: 'Raise a peaceful river town from the first hearth to the age of steam. No wars, only neighbours.',
    color: '#8fd06a', load: () => import('./games/everbrook/index.js') },
  { id: 'lanternfall', title: 'Lanternfall', genre: 'Mystery visual novel', duration: '30–45 min', tagline: 'Seven days in a canal town. Make friends, sharpen your wits, and find who took the Moon Lantern.',
    color: '#f29d7e', load: () => import('./games/lanternfall/index.js') },
  { id: 'helpdesk', title: 'Patch & Kettle', genre: 'Cozy IT management', duration: '10 min sessions', tagline: 'Cozy IT for a house full of neighbours. Fix small things, introduce people, pet the server cat.',
    color: '#f5c86a', load: () => import('./games/helpdesk/index.js') },
  { id: 'oddcrown', title: 'Odd Crown', genre: 'Discovery chess', duration: '5–15 min', tagline: 'A secret rulebook. A suspicious king. Discover a different kind of chess each time.',
    color: '#e9c78d', load: () => import('./games/oddcrown/index.js') },
  { id: 'planets', title: 'Pocket Planets', genre: 'Merge puzzle', duration: 'One more turn', tagline: 'Slide moons into planets. Build a tiny universe, all the way to a sun.',
    color: '#d6b0e8', load: () => import('./games/planets/index.js') },
  { id: 'reef', title: 'Reef Relay', genre: 'Quiet puzzles', duration: '5–10 min', tagline: 'Turn coral channels, wake the pearls, and let a quiet current find its way.',
    color: '#a5e6ce', load: () => import('./games/reef/index.js') },
  { id: 'builder', title: 'Tidewater', tagline: 'Settle a generated island. Chain resources, weather storms, grow a colony.',
    color: '#4cc9a0', load: () => import('./games/builder/index.js') },
  { id: 'roguelike', title: 'Deepvault', tagline: 'Real-time dungeon descent. New floors, loot and monsters every run.',
    color: '#f0b44c', load: () => import('./games/roguelike/index.js') },
  { id: 'towerdefence', title: 'Bastion Maze', tagline: 'Build the maze, upgrade towers, and take the field yourself against endless waves.',
    color: '#e25c5c', load: () => import('./games/towerdefence/index.js') },
];

const app = document.getElementById('app');
const settings = makeStorage('shell');
audio.setMuted(settings.get('muted', false));
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
// Stop iOS pinch-zoom and double-tap zoom inside the app.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

let current = null;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function showMenu() {
  if (current) { try { current.dispose(); } catch (err) { console.error(err); } current = null; }
  inGame = false;
  app.replaceChildren();
  const menu = el('div', 'menu');
  const header = el('header', 'menu-head');
  header.append(el('div', 'menu-mark', 'Your carry-on arcade'), el('h1', null, 'Flight Games'), el('div', 'sub', 'Nine little worlds. Take the long way home.'));
  menu.append(header);
  const grid = el('div', 'menu-grid');
  for (const g of GAMES) {
    const card = el('button', 'card');
    card.style.setProperty('--card-color', g.color);
    const illustration = el('div', 'card-art'); illustration.innerHTML = cover(g.id);
    const copy = el('div', 'card-copy');
    copy.append(el('div', 'card-genre', g.genre || ({ builder: 'Island builder', roguelike: 'Dungeon adventure', towerdefence: 'Tower defence' }[g.id])), el('div', 'title', g.title), el('div', 'tag', g.tagline));
    const meta = el('div', 'card-meta'); meta.append(el('span', '', g.duration || 'Settle in'), el('span', 'card-play', 'Play'));
    copy.append(meta); card.append(illustration, copy);
    const best = makeStorage(g.id).get('bestLabel', null);
    if (best) copy.append(el('div', 'best', best));
    card.addEventListener('click', () => { audio.play('tap'); launch(g); });
    grid.append(card);
  }
  menu.append(grid);
  const foot = el('div', 'menu-foot');
  const status = el('span');
  updateOfflineStatus = () => { status.textContent = offlineReady ? '✓ All six games ready offline' : import.meta.env.DEV ? 'Local preview · offline cache in production' : navigator.onLine ? 'Preparing for offline play…' : 'Offline · reconnect once to finish caching'; };
  updateOfflineStatus();
  const mute = el('button', 'pill', audio.isMuted() ? 'Sound off' : 'Sound on');
  mute.addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    settings.set('muted', audio.isMuted());
    mute.textContent = audio.isMuted() ? 'Sound off' : 'Sound on';
    audio.play('tap');
  });
  foot.append(status, mute);
  menu.append(foot);
  menu.append(el('div', 'menu-note', 'No timers in the new puzzles. Progress saves as you play.'));
  app.append(menu);
  applyUpdate();
}

async function launch(game) {
  inGame = true;
  app.replaceChildren();
  const root = el('div', 'game-root');
  const loading = el('div', 'load-msg', 'Loading…');
  root.append(loading);
  app.append(root);
  try {
    const mod = await game.load();
    const storage = makeStorage(game.id);
    current = mod.default.start({
      root,
      storage,
      audio,
      exit: showMenu,
      // Shown on the menu card, e.g. setBest('Best: floor 7').
      setBest: (label) => storage.set('bestLabel', label),
    }) || { dispose() {} };
    loading.remove();
  } catch (err) {
    console.error(err);
    loading.textContent = 'This game failed to start.';
    const back = el('button', 'pill', 'Back');
    back.style.cssText = 'position:absolute;left:50%;top:60%;transform:translateX(-50%)';
    back.addEventListener('click', showMenu);
    root.append(back);
  }
}

// ?game=<id> opens a game directly (handy for testing and for home-screen shortcuts).
const direct = GAMES.find((g) => g.id === new URLSearchParams(location.search).get('game'));
if (direct) launch(direct); else showMenu();
