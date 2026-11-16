// createStage(root): the three.js boilerplate every game shares.
// Returns { renderer, scene, camera, canvas, ui, size, onFrame, onResize, setCamera, dispose }.
//  - canvas fills `root`; `ui` is an absolutely positioned overlay div for HTML HUD (pointer-events: none
//    by default — set pointer-events: auto on the buttons/panels you add).
//  - onFrame(fn): fn(dt, elapsed) each animation frame; dt is seconds, clamped to 0.1.
//  - The loop pauses while the page is hidden.
import * as THREE from 'three';

export function createStage(root, { antialias = true, background = 0x0e1420 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  root.appendChild(canvas);
  const ui = document.createElement('div');
  ui.className = 'stage-ui';
  root.appendChild(ui);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  let camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

  const size = { width: 1, height: 1 };
  const frameFns = new Set();
  const resizeFns = new Set();

  function resize() {
    const w = Math.max(1, root.clientWidth), h = Math.max(1, root.clientHeight);
    size.width = w; size.height = h;
    renderer.setSize(w, h, false);
    if (camera.isPerspectiveCamera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    resizeFns.forEach((fn) => fn(w, h));
  }
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  let raf = 0, last = performance.now(), elapsed = 0, disposed = false;
  function tick(now) {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    elapsed += dt;
    frameFns.forEach((fn) => fn(dt, elapsed));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  return {
    renderer, scene, canvas, ui, size,
    get camera() { return camera; },
    setCamera(c) { camera = c; resize(); },
    onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    onResize(fn) { resizeFns.add(fn); fn(size.width, size.height); return () => resizeFns.delete(fn); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      canvas.remove(); ui.remove();
    },
  };
}
