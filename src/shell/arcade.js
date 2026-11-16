import * as THREE from 'three';
import { createStage } from './stage.js';
import './arcade.css';
export function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
export function button(text, fn, cls = '') {
  const b = node('button', `arc-button ${cls}`, text);
  b.addEventListener('click', fn);
  return b;
}
export function arcade(ctx, {
  theme,
  title,
  subtitle,
  background
}) {
  const shell = node('section', `arcade arc-${theme}`);
  const header = node('header', 'arc-header');
  const back = button('‹ Games', ctx.exit, 'arc-back');
  const heading = node('div', 'arc-heading');
  heading.append(node('h1', '', title), node('span', '', subtitle));
  const help = button('?', () => {}, 'arc-help');
  help.setAttribute('aria-label', 'How to play');
  header.append(back, heading, help);
  const stats = node('div', 'arc-stats');
  const viewport = node('div', 'arc-viewport');
  const info = node('div', 'arc-info');
  info.setAttribute('aria-live', 'polite');
  const controls = node('div', 'arc-controls');
  const bottom = node('div', 'arc-bottom');
  bottom.append(info, controls);
  shell.append(header, stats, viewport, bottom);
  ctx.root.append(shell);
  const stage = createStage(viewport, {
    background
  });
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 100);
  camera.position.set(0, 11, 7);
  camera.lookAt(0, 0, 0);
  stage.setCamera(camera);
  stage.scene.add(new THREE.HemisphereLight(0xffffff, 0x3b4860, 3));
  const light = new THREE.DirectionalLight(0xffffff, 3.2);
  light.position.set(-3, 10, 5);
  stage.scene.add(light);
  stage.renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  let span = 7.5;
  const fit = () => {
    const a = stage.size.width / stage.size.height;
    const w = Math.max(span, span * a * .82),
      h = w / a;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  };
  stage.onResize(fit);
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  function pick(e, objects) {
    const r = stage.canvas.getBoundingClientRect();
    pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(objects, true)[0];
  }
  let dialog = null;
  function close() {
    if (dialog) {
      dialog.close();
      dialog.remove();
      dialog = null;
    }
  }
  function modal(titleText, content, actions = [], {
    onCancel
  } = {}) {
    close();
    dialog = node('dialog', 'arc-dialog');
    const title = node('h2', '', titleText);
    title.id = 'arc-dialog-title';
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(title);
    if (typeof content === 'string') dialog.append(node('p', '', content));else dialog.append(content);
    const row = node('div', 'arc-dialog-actions');
    actions.forEach(a => row.append(button(a.label, () => {
      close();
      a.fn?.();
    }, a.primary ? 'arc-primary' : '')));
    dialog.append(row);
    shell.append(dialog);
    dialog.showModal();
    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      close();
      onCancel?.();
    });
    return dialog;
  }
  function stat(label, value) {
    const n = node('div', 'arc-stat');
    const v = node('strong', '', value);
    n.append(v, node('span', '', label));
    stats.append(n);
    return v;
  }
  function message(titleText, detail = '') {
    info.replaceChildren(node('strong', '', titleText), node('span', '', detail));
  }
  return {
    shell,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    stage,
    camera,
    stats,
    viewport,
    controls,
    info,
    help,
    pick,
    modal,
    close,
    stat,
    message,
    setSpan(v) {
      span = v;
      fit();
    },
    get modalOpen() {
      return !!dialog?.open;
    },
    dispose() {
      close();
      stage.dispose();
      shell.remove();
    }
  };
}
export function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: .42,
    metalness: .12,
    ...extra
  });
}
export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}
export function clearGroup(group) {
  group.traverse(o => {
    o.geometry?.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
  group.clear();
}
export function roundedBox(w, h, d, color, x = 0, y = 0, z = 0) {
  // Bevelled extrusions catch light without a texture or an external model.
  const r = Math.min(w, d) * .12,
    s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h,
    bevelEnabled: true,
    bevelSize: .025,
    bevelThickness: .025,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 3
  });
  g.rotateX(-Math.PI / 2);
  return mesh(g, material(color), x, y, z);
}
