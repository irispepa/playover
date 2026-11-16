// Touch camera controls: one-finger pan, two-finger pinch zoom, tap to select. Hit-tests by coordinates.
export function createInput(canvas, view, { onTap, getBounds }) {
  const pts = new Map();
  let mode = 'none';            // none | pan | pinch
  let downX = 0, downY = 0, downT = 0, moved = 0, multi = false;
  let pinchStart = 0, distStart = 0;
  const g0 = { x: 0, z: 0 }, g1 = { x: 0, z: 0 };
  let lastX = 0, lastY = 0;
  const vel = { x: 0, z: 0 };
  let lastMoveT = 0;
  const cs = view.camState;

  const clampCam = () => {
    const b = getBounds();
    cs.tx = Math.max(-b.w / 2, Math.min(b.w / 2, cs.tx));
    cs.tz = Math.max(-b.h / 2, Math.min(b.h / 2, cs.tz));
    cs.dist = Math.max(b.minDist, Math.min(b.maxDist, cs.dist));
    view.updateCamera();
  };

  function panBy(fromX, fromY, toX, toY) {
    if (!view.groundAt(fromX, fromY, g0) || !view.groundAt(toX, toY, g1)) return;
    const dx = g0.x - g1.x, dz = g0.z - g1.z;
    cs.tx += dx; cs.tz += dz;
    const now = performance.now();
    const dtm = Math.max(1, now - lastMoveT);
    vel.x = vel.x * 0.5 + (dx / dtm) * 1000 * 0.5;
    vel.z = vel.z * 0.5 + (dz / dtm) * 1000 * 0.5;
    lastMoveT = now;
    clampCam();
  }

  const span = () => {
    const a = [...pts.values()];
    return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
  };
  const mid = () => {
    const a = [...pts.values()];
    return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
  };

  function down(e) {
    canvas.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    vel.x = vel.z = 0;
    if (pts.size === 1) {
      mode = 'pan'; multi = false;
      downX = lastX = e.clientX; downY = lastY = e.clientY; downT = performance.now(); moved = 0;
      lastMoveT = downT;
    } else if (pts.size === 2) {
      mode = 'pinch'; multi = true;
      pinchStart = span(); distStart = cs.dist;
      const m = mid(); lastX = m.x; lastY = m.y;
    }
  }
  function move(e) {
    const p = pts.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (mode === 'pan' && pts.size === 1) {
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
      if (moved > 8) panBy(lastX, lastY, e.clientX, e.clientY);
      if (moved > 8) { lastX = e.clientX; lastY = e.clientY; }
    } else if (mode === 'pinch' && pts.size >= 2) {
      const sp = span();
      if (sp > 10 && pinchStart > 10) { cs.dist = distStart * (pinchStart / sp); clampCam(); }
      const m = mid();
      panBy(lastX, lastY, m.x, m.y);
      lastX = m.x; lastY = m.y;
      vel.x = vel.z = 0;
    }
  }
  function up(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (mode === 'pan' && pts.size === 0) {
      const dt = performance.now() - downT;
      if (!multi && moved <= 8 && dt < 500) { vel.x = vel.z = 0; onTap(e.clientX, e.clientY); }
      if (performance.now() - lastMoveT > 80) { vel.x = vel.z = 0; }
      mode = 'none';
    } else if (mode === 'pinch') {
      if (pts.size === 1) {
        // Continue as a pan with the remaining finger, but never as a tap.
        const r = [...pts.values()][0];
        mode = 'pan'; lastX = r.x; lastY = r.y; moved = 99;
      } else if (pts.size === 0) mode = 'none';
    }
  }
  function cancel(e) { pts.delete(e.pointerId); if (!pts.size) mode = 'none'; vel.x = vel.z = 0; }
  function wheel(e) {
    e.preventDefault();
    cs.dist *= Math.exp(e.deltaY * 0.0015);
    clampCam();
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false });

  return {
    update(dt) {
      if (mode !== 'none') return;
      if (Math.abs(vel.x) + Math.abs(vel.z) < 0.05) return;
      cs.tx += vel.x * dt; cs.tz += vel.z * dt;
      const k = Math.exp(-dt * 5);
      vel.x *= k; vel.z *= k;
      clampCam();
    },
    clampCam,
    stop() { vel.x = vel.z = 0; },
    dispose() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('wheel', wheel);
    },
  };
}
