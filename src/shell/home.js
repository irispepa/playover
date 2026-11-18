import { cover } from './covers.js';
import './home.css';

const asset = (name) => `${import.meta.env.BASE_URL}branding/${name}`;

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function button(text, className, action) {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function image(name, className, alt = '') {
  const node = el('img', className);
  node.src = asset(name);
  node.alt = alt;
  node.draggable = false;
  return node;
}

export function createHome({ games, audio, version, onPlay, onInfo, onSound }) {
  const home = el('main', 'po-home');
  const collection = el('div', 'po-collection');
  const header = el('header', 'po-header');
  const brand = el('h1', 'po-brand');
  brand.append(image('window.png', 'po-window'), image('wordmark.png', 'po-wordmark', 'Playover'));
  const sound = button('', 'po-sound', () => { onSound(); updateSound(); });
  sound.id = 'home-sound';
  function updateSound() {
    const enabled = !audio.isMuted();
    sound.setAttribute('aria-label', `Sound effects ${enabled ? 'on' : 'off'}`);
    sound.setAttribute('aria-pressed', String(enabled));
    sound.replaceChildren(image(enabled ? 'sound-on.svg' : 'sound-off.svg', ''));
  }
  updateSound();
  header.append(brand, sound);
  const grid = el('div', 'po-grid');
  for (const game of games) {
    const entry = el('article', 'po-game');
    const play = button('', 'po-art', () => onPlay(game));
    play.id = `play-${game.id}`;
    play.setAttribute('aria-label', `Play ${game.title}`);
    play.innerHTML = cover(game.id);
    play.firstElementChild.setAttribute('aria-hidden', 'true');
    const summary = button('', 'po-summary', () => onInfo(game));
    summary.id = `info-${game.id}`;
    summary.setAttribute('aria-label', `About ${game.title}: ${game.genre}`);
    summary.setAttribute('aria-haspopup', 'dialog');
    const title = el('span', 'po-name', game.title);
    title.append(image('chevron.svg', 'po-chevron'));
    summary.append(title, el('span', 'po-genre', game.genre));
    entry.append(play, summary);
    grid.append(entry);
  }
  collection.append(header, grid, el('span', 'po-version', `v${version}`));
  home.append(collection);
  return { node: home, updateSound };
}

export function createInfo(home, game, { onClose, onPlay, onGuide }) {
  const sheet = el('dialog', 'po-sheet');
  const header = el('div', 'po-sheet-head');
  const title = el('h2', '', game.title);
  title.id = 'po-info-title';
  sheet.setAttribute('aria-labelledby', title.id);
  const close = button('Close', 'po-close', onClose);
  header.append(title, close);
  const actions = el('div', 'po-actions');
  const guideButton = button('How to play', 'po-action', onGuide);
  guideButton.id = 'po-how-to';
  const playButton = button('Play', 'po-action po-primary', onPlay);
  playButton.id = 'po-sheet-play';
  actions.append(playButton, guideButton);
  sheet.append(header, el('p', '', game.tagline), actions);
  sheet.addEventListener('cancel', (event) => { event.preventDefault(); onClose(); });
  sheet.addEventListener('click', (event) => {
    if (event.target !== sheet) return;
    const rect = sheet.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  });
  home.append(sheet);
  sheet.showModal();
  return { node: sheet, guideButton, playButton, close: () => { sheet.close(); sheet.remove(); } };
}
