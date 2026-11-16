// Patch & Kettle: tiny DOM helpers and a disposer so nothing outlives the game.
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A scope owns listeners, timers and animation frames; dispose() removes them all. Scopes can nest.
export function makeScope() {
  const offs = new Set();
  let dead = false;
  const track = (off) => { offs.add(off); return () => { offs.delete(off); off(); }; };
  const scope = {
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      return track(() => target.removeEventListener(type, fn, opts));
    },
    timeout(fn, ms) {
      let off = null;
      const id = setTimeout(() => { offs.delete(off); if (!dead) fn(); }, ms);
      off = () => clearTimeout(id);
      offs.add(off);
      return () => { offs.delete(off); off(); };
    },
    interval(fn, ms) {
      const id = setInterval(() => { if (!dead) fn(); }, ms);
      return track(() => clearInterval(id));
    },
    raf(fn) {
      let id = 0, alive = true, last = 0;
      const loop = (t) => { if (!alive) return; const dt = last ? Math.min(60, t - last) : 16; last = t; fn(dt, t); if (alive) id = requestAnimationFrame(loop); };
      id = requestAnimationFrame(loop);
      return track(() => { alive = false; cancelAnimationFrame(id); });
    },
    child() {
      const c = makeScope();
      const off = () => c.dispose();
      offs.add(off);
      const inner = c.dispose;
      c.dispose = () => { offs.delete(off); inner(); };
      return c;
    },
    add(fn) { return track(fn); },
    get dead() { return dead; },
    dispose() { dead = true; for (const off of [...offs]) { try { off(); } catch { /* keep going */ } } offs.clear(); },
  };
  return scope;
}

// Pointer position relative to an element, in that element's own units (scale-aware for SVG viewBoxes).
export function localPoint(node, ev, vbW = null, vbH = null) {
  const r = node.getBoundingClientRect();
  const x = ev.clientX - r.left, y = ev.clientY - r.top;
  if (vbW == null) return { x, y, w: r.width, h: r.height };
  const s = Math.min(r.width / vbW, r.height / vbH);
  return { x: (x - (r.width - vbW * s) / 2) / s, y: (y - (r.height - vbH * s) / 2) / s, s };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
