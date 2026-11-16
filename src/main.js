import './shell/shell.css';
import { registerSW } from 'virtual:pwa-register';
import { makeStorage } from './shell/storage.js';
import { audio } from './shell/audio.js';

registerSW({ immediate: true });

// Each game is a lazily loaded module whose default export is
//   { start(ctx) -> { dispose() } }       (see src/shell/CONTRACT.md)
const GAMES = [
  { id: 'builder', title: 'Tidewater', tagline: 'Settle a generated island. Chain resources, weather storms, grow a colony.',
    color: '#4cc9a0', load: () => import('./games/builder/index.js') },
  { id: 'roguelike', title: 'Deepvault', tagline: 'Real-time dungeon descent. New floors, loot and monsters every run.',
    color: '#f0b44c', load: () => import('./games/roguelike/index.js') },
  { id: 'towerdefence', title: 'Bastion Maze', tagline: 'Build the maze, upgrade towers, and take the field yourself against endless waves.',
    color: '#e25c5c', load: () => import('./games/towerdefence/index.js') },
  { id: 'everbrook', title: 'Everbrook', tagline: 'Raise a peaceful river town from the first hearth to the age of steam. No wars, only neighbours.',
    color: '#8fd06a', load: () => import('./games/everbrook/index.js') },
  { id: 'lanternfall', title: 'Lanternfall', tagline: 'Seven days in a canal town. Make friends, sharpen your wits, and find who took the Moon Lantern.',
    color: '#f29d7e', load: () => import('./games/lanternfall/index.js') },
  { id: 'helpdesk', title: 'Patch & Kettle', tagline: 'Cozy IT for a house full of neighbours. Fix small things, introduce people, pet the server cat.',
    color: '#f5c86a', load: () => import('./games/helpdesk/index.js') },
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
  app.replaceChildren();
  const menu = el('div', 'menu');
  menu.append(el('h1', null, 'Flight Games'), el('div', 'sub', 'Six games, no signal needed.'));
  for (const g of GAMES) {
    const card = el('button', 'card');
    card.style.setProperty('--card-color', g.color);
    card.append(el('div', 'title', g.title), el('div', 'tag', g.tagline));
    const best = makeStorage(g.id).get('bestLabel', null);
    if (best) card.append(el('div', 'best', best));
    card.addEventListener('click', () => { audio.play('tap'); launch(g); });
    menu.append(card);
  }
  const foot = el('div', 'menu-foot');
  const status = el('span', null, navigator.onLine ? 'Online' : 'Offline — all set');
  const mute = el('button', 'pill', audio.isMuted() ? 'Sound off' : 'Sound on');
  mute.addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    settings.set('muted', audio.isMuted());
    mute.textContent = audio.isMuted() ? 'Sound off' : 'Sound on';
    audio.play('tap');
  });
  foot.append(status, mute);
  menu.append(foot);
  app.append(menu);
}

async function launch(game) {
  app.replaceChildren();
  const root = el('div', 'game-root');
  const loading = el('div', 'load-msg', 'Loading…');
  root.append(loading);
  app.append(root);
  try {
    const mod = await game.load();
    loading.remove();
    const storage = makeStorage(game.id);
    current = mod.default.start({
      root,
      storage,
      audio,
      exit: showMenu,
      // Shown on the menu card, e.g. setBest('Best: floor 7').
      setBest: (label) => storage.set('bestLabel', label),
    }) || { dispose() {} };
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
