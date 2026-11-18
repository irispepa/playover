// Shared How to play guide: swipeable cards, one idea per card.
//
//   import { openGuide } from '../../shell/guide.js';
//   const g = openGuide(ctx.root, {
//     className: 'my-guide',                  // optional: set --g-* colour variables on it
//     pages: [{ title: 'Tap to flip', art: '<svg viewBox="0 0 200 120">…</svg>', points: ['Short line.', 'Another.'] }],
//     doneLabel: 'Play',                      // last card's primary button
//     onClose(finished) {},                   // finished: true if the last card's button was used
//   });
//   g.close();                                // safe to call twice; call from the game's dispose()
//
// Theme variables (all optional): --g-bg --g-panel --g-ink --g-muted --g-line --g-accent --g-on-accent
// --g-font --g-title-font --g-art-bg. Keep `points` to one or two lines of about 12 words.
import './guide.css';

export function openGuide(root, { pages, className = '', doneLabel = 'Play', onClose } = {}) {
  if (!pages?.length) throw new Error('openGuide: pages required');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dlg = document.createElement('dialog');
  dlg.className = `fg-guide ${className}`.trim();
  dlg.setAttribute('aria-roledescription', 'guide');

  const top = el('div', 'fg-top');
  const count = el('span', 'fg-count');
  const skip = btn('Skip', 'fg-skip');
  top.append(count, skip);

  // Every card is built up front and stacked in one grid cell, so the guide keeps the height of
  // its tallest card and does not jump while paging.
  const stack = el('div', 'fg-stack');
  const uid = Math.random().toString(36).slice(2, 8);
  const cards = pages.map((p, k) => {
    const card = el('div', 'fg-card');
    if (p.art) {
      const art = el('div', 'fg-art');
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = p.art;
      card.append(art);
    }
    const title = el('h2', 'fg-title', p.title);
    title.id = `fg-title-${uid}-${k}`;
    const list = el('ul', 'fg-points');
    list.append(...(p.points || []).map((t) => el('li', '', t)));
    card.append(title, list);
    stack.append(card);
    return card;
  });

  const dots = el('div', 'fg-dots');
  const dotEls = pages.map((_, i) => {
    const d = btn('', 'fg-dot');
    d.setAttribute('aria-label', `Card ${i + 1} of ${pages.length}`);
    d.addEventListener('click', () => go(i));
    dots.append(d);
    return d;
  });

  const nav = el('div', 'fg-nav');
  const back = btn('Back', 'fg-back');
  const next = btn('Next', 'fg-next');
  nav.append(back, next);

  dlg.append(top, stack, dots, nav);
  root.append(dlg);

  let i = 0, closed = false;
  function render(dir = 0) {
    const card = cards[i];
    cards.forEach((c, k) => {
      const on = k === i;
      c.classList.toggle('fg-on', on);
      c.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    dlg.setAttribute('aria-labelledby', `fg-title-${uid}-${i}`);
    count.textContent = `${i + 1} / ${pages.length}`;
    dotEls.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'step' : 'false'));
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    const last = i === pages.length - 1;
    next.textContent = last ? doneLabel : 'Next';
    next.classList.toggle('fg-done', last);
    skip.style.visibility = last ? 'hidden' : 'visible';
    if (dir && !reduced) {
      card.classList.remove('fg-in-l', 'fg-in-r');
      void card.offsetWidth;
      card.classList.add(dir > 0 ? 'fg-in-r' : 'fg-in-l');
    }
  }
  function go(k) {
    k = Math.max(0, Math.min(pages.length - 1, k));
    if (k === i) return;
    const dir = Math.sign(k - i);
    i = k;
    render(dir);
  }
  function close(finished = false) {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKey, true);
    if (dlg.open) dlg.close();
    dlg.remove();
    onClose?.(finished);
  }

  back.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => (i === pages.length - 1 ? close(true) : go(i + 1)));
  skip.addEventListener('click', () => close(false));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });

  // Arrow keys page; captured so the game underneath does not also react.
  function onKey(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(i - 1); }
  }
  window.addEventListener('keydown', onKey, true);

  // Horizontal swipe anywhere on the guide.
  // A drag that ends on a button would also click it, so a swipe swallows the click that follows.
  let sx = null, sy = 0, swiped = false;
  dlg.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; swiped = false; });
  dlg.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; go(i + (dx < 0 ? 1 : -1)); }
  });
  dlg.addEventListener('click', (e) => { if (swiped) { swiped = false; e.stopPropagation(); e.preventDefault(); } }, true);
  dlg.addEventListener('pointercancel', () => { sx = null; });

  render();
  // Focus the guide itself rather than a button, so no focus ring shows on open; Tab reaches the buttons.
  dlg.tabIndex = -1;
  dlg.showModal();
  dlg.focus({ preventScroll: true });
  return { close: () => close(false), get open() { return !closed; } };
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function btn(text, cls) {
  const b = el('button', cls, text);
  b.type = 'button';
  return b;
}
