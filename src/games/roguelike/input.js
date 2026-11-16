// Touch input: a floating joystick anywhere below the HUD, plus action buttons. Multi-touch by pointerId.
// Keyboard support for desktop testing.

export function createInput(layer, joyBase, joyKnob, opts = {}) {
  const state = { mx: 0, my: 0, dash: false, ab1: false, ab2: false, potion: false, bomb: false, interact: false };
  const joy = { id: -1, bx: 0, by: 0, x: 0, y: 0 };
  const keys = new Set();
  const R = 54;
  let enabled = true;
  const cleanups = [];
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); cleanups.push(() => el.removeEventListener(ev, fn, o)); };

  function showJoy(v) { joyBase.style.display = v ? 'block' : 'none'; }
  function placeJoy() {
    const r = layer.getBoundingClientRect();
    joyBase.style.transform = `translate(${joy.bx - r.left - R}px, ${joy.by - r.top - R}px)`;
    let dx = joy.x - joy.bx, dy = joy.y - joy.by;
    const l = Math.hypot(dx, dy);
    if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  on(layer, 'pointerdown', (e) => {
    if (!enabled || joy.id !== -1) return;
    const r = layer.getBoundingClientRect();
    if (e.clientY - r.top < r.height * 0.22) return; // keep the HUD area free
    e.preventDefault();
    joy.id = e.pointerId;
    joy.bx = Math.min(Math.max(e.clientX, r.left + R + 6), r.right - R - 6);
    joy.by = Math.min(Math.max(e.clientY, r.top + R + 6), r.bottom - R - 6);
    joy.x = e.clientX; joy.y = e.clientY;
    try { layer.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    showJoy(true);
    placeJoy();
  });
  on(layer, 'pointermove', (e) => {
    if (e.pointerId !== joy.id) return;
    joy.x = e.clientX; joy.y = e.clientY;
    // Let the base trail the finger so the stick never runs out of room.
    const dx = joy.x - joy.bx, dy = joy.y - joy.by, l = Math.hypot(dx, dy);
    if (l > R * 1.25) { joy.bx = joy.x - (dx / l) * R * 1.25; joy.by = joy.y - (dy / l) * R * 1.25; }
    placeJoy();
  });
  const end = (e) => {
    if (e.pointerId !== joy.id) return;
    joy.id = -1;
    showJoy(false);
    try { layer.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  on(layer, 'pointerup', end);
  on(layer, 'pointercancel', end);
  on(layer, 'lostpointercapture', end);

  // Buttons fire on pointerdown so they work while the other thumb is steering.
  function bindButton(el, action) {
    on(el, 'pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!enabled) return;
      if (typeof action === 'function') action(); else state[action] = true;
      el.classList.add('dv-pressed');
      if (opts.onPress) opts.onPress(action);
    });
    const up = () => el.classList.remove('dv-pressed');
    on(el, 'pointerup', up); on(el, 'pointercancel', up); on(el, 'pointerleave', up);
  }

  const KEYMAP = { Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyQ: 'ab1', KeyJ: 'ab1', KeyE: 'ab2', KeyK: 'ab2', KeyF: 'potion', KeyH: 'potion', KeyB: 'bomb', KeyR: 'interact', Enter: 'interact' };
  on(window, 'keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (opts.onPause) opts.onPause(); e.preventDefault(); return; }
    if (e.code === 'KeyI' || e.code === 'Tab') { if (opts.onInventory) opts.onInventory(); e.preventDefault(); return; }
    if (!enabled) return;
    keys.add(e.code);
    const a = KEYMAP[e.code];
    if (a && !e.repeat) { state[a] = true; e.preventDefault(); }
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  on(window, 'keyup', (e) => keys.delete(e.code));
  on(window, 'blur', () => { keys.clear(); });

  function update() {
    let mx = 0, my = 0;
    if (joy.id !== -1) {
      const dx = joy.x - joy.bx, dy = joy.y - joy.by, l = Math.hypot(dx, dy);
      if (l > 7) { const m = Math.min(1, (l - 7) / (R - 7)); mx = (dx / l) * m; my = (dy / l) * m; }
    }
    if (keys.size) {
      let kx = 0, ky = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) ky -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) ky += 1;
      if (kx || ky) { const l = Math.hypot(kx, ky); mx = kx / l; my = ky / l; }
    }
    state.mx = mx; state.my = my;
  }

  function reset() {
    state.mx = state.my = 0;
    state.dash = state.ab1 = state.ab2 = state.potion = state.bomb = state.interact = false;
    if (joy.id !== -1) { try { layer.releasePointerCapture(joy.id); } catch { /* ignore */ } }
    joy.id = -1; showJoy(false); keys.clear();
  }

  return {
    state, update, bindButton, reset,
    setEnabled(v) { enabled = v; if (!v) reset(); },
    dispose() { cleanups.forEach((f) => f()); cleanups.length = 0; },
  };
}
