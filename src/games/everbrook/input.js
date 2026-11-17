// Touch, mouse and keyboard for the map. One finger pans (or paints paths and fields), two fingers
// pinch, twist and pan. Mouse: drag to pan, wheel to zoom, right-drag to turn. Keys: WASD/arrows, Q/E.
export function createInput(el, view, h) {
  const pts = new Map();
  let moved = 0, painting = false, lastTile = null, pinch = null, rotating = false;
  const keys = new Set();
  const TAP_SLOP = 9;

  const tileAt = (e) => view.pickTile(e.clientX, e.clientY);
  const cost = (x, y) => h.stepCost?.(x, y) ?? 0;     // 0 land, 1 water, 2 blocked: corners avoid the costly side

  // Painted tiles go out through emit(). A costly tile (a bridge) waits one step: if the stroke then turns
  // diagonally around it and the other corner tile is cheaper, the turn is made there instead, so a stroke
  // never turns mid-stream when it could turn on the bank.
  let prev = null, held = null;
  function emit(t) {
    if (held) {
      if (prev && Math.abs(prev.x - t.x) === 1 && Math.abs(prev.y - t.y) === 1) {
        const cx = prev.x + t.x - held.x, cy = prev.y + t.y - held.y;
        if (cost(cx, cy) < cost(held.x, held.y)) held = { x: cx, y: cy };
      }
      h.onPaint(held); prev = held; held = null;
    }
    if (prev && cost(t.x, t.y) > 0) { held = t; return; }
    h.onPaint(t); prev = t;
  }
  function endStroke() { if (held) h.onPaint(held); prev = held = null; painting = false; h.onPaintEnd(); }

  function down(e) {
    if (e.pointerType === 'mouse' && e.button === 1) e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, button: e.button, type: e.pointerType });
    if (pts.size === 1) {
      moved = 0; rotating = e.pointerType === 'mouse' && e.button !== 0;
      painting = !rotating && h.paintMode();
      lastTile = null; prev = held = null;
      if (painting) paint(e);
    } else if (pts.size === 2) {
      if (painting) endStroke();
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      moved = 99;
    }
  }
  function paint(e) {
    const t = tileAt(e);
    if (!t) return;
    if (lastTile && lastTile.x === t.x && lastTile.y === t.y) { lastTile = t; return; }
    // Walk from the last tile in orthogonal unit steps so a stroke is always 4-connected (paths link edge to
    // edge). At each corner, step across whichever tile edge the straight line between the two hit points
    // crosses first, which keeps the walk closest to the line.
    if (lastTile) {
      let x = lastTile.x, y = lastTile.y;
      const ax = lastTile.fx, ay = lastTile.fy, dx = t.fx - ax, dy = t.fy - ay, sx = Math.sign(t.x - x), sy = Math.sign(t.y - y);
      let guard = 4 * 34;
      while ((x !== t.x || y !== t.y) && guard-- > 0) {
        if (x === t.x) y += sy;
        else if (y === t.y) x += sx;
        else {
          // A corner: if one of the two steps is cheaper (land rather than water), take it.
          const cx = cost(x + sx, y), cy = cost(x, y + sy);
          if (cx !== cy) { if (cx < cy) x += sx; else y += sy; }
          else {
            const tx = Math.abs(dx) < 1e-9 ? Infinity : ((sx > 0 ? x + 1 : x) - ax) / dx;
            const ty = Math.abs(dy) < 1e-9 ? Infinity : ((sy > 0 ? y + 1 : y) - ay) / dy;
            if (tx <= ty) x += sx; else y += sy;
          }
        }
        if (x !== t.x || y !== t.y) emit({ x, y });
      }
    }
    lastTile = t;
    emit(t);
    if (e.pointerType === 'mouse') h.onHover(t);
  }
  function move(e) {
    const p = pts.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse') h.onHover(tileAt(e)); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (painting) { paint(e); return; }
      if (rotating) { view.controls.rotate(-dx * 0.006); return; }
      if (moved > TAP_SLOP) view.controls.pan(dx, dy);
    } else if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      if (pinch.d > 0 && d > 0) view.controls.zoom(pinch.d / d);
      let da = ang - pinch.ang; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
      view.controls.rotate(-da);
      view.controls.pan(cx - pinch.cx, cy - pinch.cy);
      pinch = { d, ang, cx, cy };
    }
  }
  function up(e) {
    const p = pts.get(e.pointerId);
    if (!p) return;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (painting) { endStroke(); return; }
    if (pts.size === 0 && moved <= TAP_SLOP && !rotating && e.type === 'pointerup') {
      const t = tileAt(e);
      if (t) h.onTap(t, p.type);
    }
    rotating = false;
  }
  function wheel(e) { e.preventDefault(); view.controls.zoom(Math.exp(e.deltaY * 0.0012)); }
  const ctx = (e) => e.preventDefault();
  function keydown(e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'q', 'e'].includes(k)) { keys.add(k); e.preventDefault(); }
    else h.onKey?.(k, e);
  }
  const keyup = (e) => keys.delete(e.key.toLowerCase());
  const leave = (e) => { if (e.pointerType === 'mouse') h.onHover(null); };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('wheel', wheel, { passive: false });
  el.addEventListener('contextmenu', ctx);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);

  return {
    update(dt) {
      if (!keys.size) return;
      const sp = 620 * dt;
      let dx = 0, dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx += sp;
      if (keys.has('d') || keys.has('arrowright')) dx -= sp;
      if (keys.has('w') || keys.has('arrowup')) dy += sp;
      if (keys.has('s') || keys.has('arrowdown')) dy -= sp;
      if (dx || dy) view.controls.pan(dx, dy);
      if (keys.has('q')) view.controls.rotate(1.6 * dt);
      if (keys.has('e')) view.controls.rotate(-1.6 * dt);
    },
    dispose() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('contextmenu', ctx);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    },
  };
}
