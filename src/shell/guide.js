// Shared How to play guide: swipeable cards, one idea per card.
//
//   import { openGuide } from '../../shell/guide.js';
//   const g = openGuide(ctx.root, {
//     className: 'my-guide',                  // optional: set --g-* colour variables on it
//     pages: [{ title: 'Tap to flip', art: '<svg viewBox="0 0 200 120">…</svg>', points: ['Short line.', 'Another.'] }],
//     doneLabel: 'Play',                      // last card's primary button
//     more: [ /* pages */ ],                  // optional: extra "More tips" cards, offered by a link on the last card
//     label: 'More tips',                     // optional: a name shown before the card count
//     onClose(finished) {},                   // finished: true when closed by the last card's button or from More tips
//   });
//   g.close();                                // safe to call twice; call from the game's dispose()
//
// To open the extra cards on their own (from a menu): openGuide(root, { pages: more, label: 'More tips', ... }).
// Theme variables (all optional): --g-bg --g-panel --g-ink --g-muted --g-line --g-accent --g-on-accent
// --g-font --g-title-font --g-art-bg. Keep `points` to one or two lines of about 12 words.
import './guide.css';

export const MORE_LABEL = 'More tips';

export function openGuide(root, { pages, more = null, className = '', doneLabel = 'Play', label = '', onClose } = {}) {
  if (!pages?.length) throw new Error('openGuide: pages required');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uid = Math.random().toString(36).slice(2, 8);
  const dlg = document.createElement('dialog');
  dlg.className = `fg-guide ${className}`.trim();
  dlg.setAttribute('aria-roledescription', 'guide');

  const top = el('div', 'fg-top');
  const count = el('span', 'fg-count');
  const skip = btn('Skip', 'fg-skip');
  top.append(count, skip);

  // A section is one run of cards. Its cards are stacked in one grid cell, so the guide keeps the
  // height of the section's tallest card and does not jump while paging.
  const sections = [section(pages, label, 'a')];
  if (more?.length) sections.push(section(more, MORE_LABEL, 'b'));
  function section(list, name, key) {
    const stack = el('div', 'fg-stack');
    const cards = list.map((p, k) => {
      const card = el('div', 'fg-card');
      if (p.art) {
        const art = el('div', 'fg-art');
        art.setAttribute('aria-hidden', 'true');
        art.innerHTML = p.art;
        card.append(art);
      }
      const title = el('h2', 'fg-title', p.title);
      title.id = `fg-title-${uid}-${key}${k}`;
      const ul = el('ul', 'fg-points');
      ul.append(...(p.points || []).map((t) => el('li', '', t)));
      card.append(title, ul);
      stack.append(card);
      return card;
    });
    const dots = el('div', 'fg-dots');
    const dotEls = list.map((_, k) => {
      const d = btn('', 'fg-dot');
      d.setAttribute('aria-label', `Card ${k + 1} of ${list.length}`);
      d.addEventListener('click', () => go(k));
      dots.append(d);
      return d;
    });
    return { stack, cards, dots, dotEls, name, key };
  }

  const moreLink = btn(`${MORE_LABEL} →`, 'fg-more');
  const nav = el('div', 'fg-nav');
  const back = btn('Back', 'fg-back');
  const next = btn('Next', 'fg-next');
  nav.append(back, next);

  dlg.append(top);
  for (const s of sections) dlg.append(s.stack, s.dots);
  dlg.append(moreLink, nav);
  root.append(dlg);

  let si = 0, i = 0, closed = false;
  const cur = () => sections[si];
  function render(dir = 0) {
    const s = cur(), n = s.cards.length, last = i === n - 1, extra = si > 0;
    sections.forEach((x, k) => { x.stack.hidden = k !== si; x.dots.hidden = k !== si; });
    s.cards.forEach((c, k) => {
      const on = k === i;
      c.classList.toggle('fg-on', on);
      c.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    dlg.setAttribute('aria-labelledby', `fg-title-${uid}-${s.key}${i}`);
    count.textContent = `${s.name ? `${s.name} · ` : ''}${i + 1} / ${n}`;
    s.dotEls.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'step' : 'false'));
    // Back on the first extra card returns to the last main card.
    back.style.visibility = i === 0 && !extra ? 'hidden' : 'visible';
    next.textContent = last ? doneLabel : 'Next';
    next.classList.toggle('fg-done', last);
    // In the extra cards the main guide is already done, so Skip reads as Done.
    // (s.name is the section label; the main set only has one when opened as a labelled set.)
    // The same goes for a labelled set opened on its own (More tips from a menu).
    skip.textContent = extra || s.name ? 'Done' : 'Skip';
    skip.style.visibility = last ? 'hidden' : 'visible';
    // In the main section the link keeps its space on every card, so the guide does not change height on
    // the last one. The More tips section has its own height and no link.
    moreLink.hidden = sections.length < 2 || extra;
    moreLink.style.visibility = last && !extra ? 'visible' : 'hidden';
    const card = s.cards[i];
    if (dir && !reduced) {
      card.classList.remove('fg-in-l', 'fg-in-r');
      void card.offsetWidth;
      card.classList.add(dir > 0 ? 'fg-in-r' : 'fg-in-l');
    }
    // A control that just got hidden (Back, the More tips link) drops focus to <body>, where the game's
    // own key handlers would see the keys. Pull focus back onto the guide.
    const a = document.activeElement;
    if (dlg.open && a !== dlg && (!dlg.contains(a) || !a.offsetParent || getComputedStyle(a).visibility === 'hidden')) {
      dlg.focus({ preventScroll: true });
    }
  }
  function go(k) {
    const n = cur().cards.length;
    if (k < 0 && si > 0) { si -= 1; i = cur().cards.length - 1; render(-1); return; }
    k = Math.max(0, Math.min(n - 1, k));
    if (k === i) return;
    const dir = Math.sign(k - i);
    i = k;
    render(dir);
  }
  function openMore() {
    if (sections.length < 2) return;
    si = 1; i = 0;
    render(1);
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
  next.addEventListener('click', () => (i === cur().cards.length - 1 ? close(true) : go(i + 1)));
  skip.addEventListener('click', () => close(si > 0));
  moreLink.addEventListener('click', openMore);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(si > 0); });

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
