import './shell/shell.css';
import { registerSW } from 'virtual:pwa-register';
import { makeStorage } from './shell/storage.js';
import { audio } from './shell/audio.js';
import { GAMES } from './games.js';
import { createHome, createInfo, el, button } from './shell/home.js';
import { openGuide } from './shell/guide.js';
import { loadGuide } from './shell/home-guides.js';

const app = document.getElementById('app');
const settings = makeStorage('shell');
audio.setMuted(settings.get('muted', false));
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });

let current = null, home = null, sheet = null, guide = null;
let generation = 0;
let route = { kind: 'home' };
let position = history.state?.home || { scroll: 0, focus: '' };
let updatePending = false, updateSW;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// The committed PWA workstream defers updates until idle Home.
updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { updatePending = true; applyUpdate(); },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !navigator.onLine || Date.now() - lastCheck < UPDATE_CHECK_MS) return;
      lastCheck = Date.now();
      registration.update().catch(() => {});
    });
  },
});
function applyUpdate() {
  if (updatePending && route.kind === 'home' && updateSW) {
    updatePending = false;
    updateSW(true);
  }
}
if (navigator.storage?.persisted && navigator.storage?.persist) {
  navigator.storage.persisted().then((persisted) => persisted || navigator.storage.persist()).catch(() => {});
}

function gameFor(id) { return GAMES.find((game) => game.id === id); }
function urlFor(next) {
  const url = new URL(location.href);
  for (const key of ['game', 'info', 'guide']) url.searchParams.delete(key);
  if (next.kind !== 'home') url.searchParams.set(next.kind, next.id);
  return url;
}
function readRoute() {
  const query = new URLSearchParams(location.search);
  for (const kind of ['game', 'guide', 'info']) {
    const id = query.get(kind);
    if (gameFor(id)) return { kind, id };
  }
  return { kind: 'home' };
}
function rememberHome() {
  if (!home) return;
  position.scroll = home.node.scrollTop;
  const focused = document.activeElement;
  if (focused?.id && home.node.contains(focused) && !sheet?.node.contains(focused)) position.focus = focused.id;
}
function navigate(next) {
  rememberHome();
  const index = (history.state?.playover ? history.state.index : 0) + 1;
  history.replaceState({ ...history.state, home: { ...position } }, '', location.href);
  history.pushState({ playover: true, index, home: { ...position } }, '', urlFor(next));
  render(next);
}
function returnBack(fallback = { kind: 'home' }) {
  if (history.state?.playover && history.state.index > 0) history.back();
  else {
    history.replaceState({ playover: true, index: 0, home: { ...position } }, '', urlFor(fallback));
    render(fallback);
  }
}
function disposeView() {
  ++generation;
  const oldGuide = guide;
  guide = null;
  oldGuide?.close();
  sheet?.close();
  sheet = null;
  if (current) {
    try { current.dispose(); } catch (error) { console.error(error); }
    current = null;
  }
  home = null;
  app.replaceChildren();
}
function soundChanged() {
  audio.setMuted(!audio.isMuted());
  settings.set('muted', audio.isMuted());
  audio.play('tap');
}
window.addEventListener('storage', (event) => {
  if (event.key === 'flightgames:shell:muted' || event.key === null) {
    audio.setMuted(settings.get('muted', false));
    home?.updateSound();
  }
});

function render(next) {
  const previous = route;
  rememberHome();
  disposeView();
  route = next;
  const token = generation;
  if (next.kind === 'game') {
    if (!position.focus) position.focus = `play-${next.id}`;
    launch(gameFor(next.id), token);
    return;
  }
  home = createHome({
    games: GAMES, audio, version: __APP_VERSION__, onSound: soundChanged,
    onPlay: (game) => { position.focus = `play-${game.id}`; audio.play('tap'); navigate({ kind: 'game', id: game.id }); },
    onInfo: (game) => { position.focus = `info-${game.id}`; navigate({ kind: 'info', id: game.id }); },
  });
  app.append(home.node);
  home.node.scrollTop = position.scroll;
  if (next.kind === 'home') {
    document.getElementById(position.focus)?.focus({ preventScroll: true });
    applyUpdate();
    return;
  }
  const game = gameFor(next.id);
  sheet = createInfo(home.node, game, {
    onClose: () => returnBack(),
    onPlay: () => { audio.play('tap'); navigate({ kind: 'game', id: game.id }); },
    onGuide: () => navigate({ kind: 'guide', id: game.id }),
  });
  if (previous.kind === 'guide') sheet.guideButton.focus({ preventScroll: true });
  if (previous.kind === 'game') sheet.playButton.focus({ preventScroll: true });
  if (next.kind === 'guide') showHomeGuide(game, token);
}

async function showHomeGuide(game, token) {
  const status = el('div', 'po-guide-status', 'Loading guide…');
  status.setAttribute('role', 'status');
  sheet.node.append(status);
  try {
    const options = await loadGuide(game.id, () => token === generation);
    if (token !== generation) return;
    status.remove();
    guide = openGuide(home.node, {
      ...options, className: `po-guide ${options.className || ''}`, doneLabel: 'Done',
      onClose() {
        if (token !== generation) return;
        guide = null;
        returnBack({ kind: 'info', id: game.id });
      },
    });
  } catch (error) {
    if (token !== generation) return;
    console.error(error);
    status.textContent = 'The guide could not load. ';
    status.append(button('Retry', 'po-action', () => location.reload()),
      button('Back', 'po-action', () => returnBack({ kind: 'info', id: game.id })));
  }
}

async function launch(game, token) {
  const root = el('div', 'game-root');
  const loading = el('section', 'po-loading');
  const heading = el('h1', '', game.title);
  heading.tabIndex = -1;
  const status = el('p', '', 'Loading…');
  status.setAttribute('role', 'status');
  const back = button('Back', 'po-action', () => returnBack());
  loading.append(heading, status, back);
  root.append(loading);
  app.append(root);
  heading.focus();
  try {
    const module = await game.load();
    if (token !== generation) return;
    const storage = makeStorage(game.id);
    const instance = module.default.start({ root, storage, audio, exit: () => {
      if (token === generation) returnBack();
    }, setBest: (label) => storage.set('bestLabel', label) }) || { dispose() {} };
    if (token !== generation) { instance.dispose(); return; }
    current = instance;
    loading.remove();
  } catch (error) {
    if (token !== generation) return;
    console.error(error);
    root.replaceChildren(loading);
    status.textContent = 'This game could not start.';
    // Reload also clears the browser's cache of a rejected dynamic import.
    loading.insertBefore(button('Retry', 'po-action po-primary', () => location.reload()), back);
    heading.focus();
  }
}

history.scrollRestoration = 'manual';
history.replaceState({ playover: true, index: history.state?.playover ? history.state.index : 0, home: { ...position } }, '', location.href);
window.addEventListener('popstate', () => {
  if (history.state?.home) position = { ...history.state.home };
  render(readRoute());
});
window.addEventListener('pagehide', (event) => { if (!event.persisted) disposeView(); });
render(readRoute());
