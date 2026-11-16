// Low-poly character and prop models built from primitives. All geometry and materials are cached and shared.
import * as THREE from 'three';

const geoCache = new Map();
const matCache = new Map();

export function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export const box = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const sph = (r, d = 1) => geo(`s${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));
export const cyl = (rt, rb, h, s = 8) => geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const cone = (r, h, s = 8) => geo(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
export const oct = (r) => geo(`o${r}`, () => new THREE.OctahedronGeometry(r, 0));
export const tor = (r, t) => geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 6, 14));

export function lam(color) {
  const k = `l${color}`;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); matCache.set(k, m); }
  return m;
}
export function basic(color, opts) {
  const k = `m${color}${opts ? JSON.stringify(opts) : ''}`;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshBasicMaterial({ color, ...(opts || {}) }); matCache.set(k, m); }
  return m;
}
export function glow(color, opacity = 0.6) {
  return basic(color, { transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
}

export const FLASH = new THREE.MeshBasicMaterial({ color: 0xffffff });
export const TELE = new THREE.MeshBasicMaterial({ color: 0xff3020 });
export const ICE = new THREE.MeshLambertMaterial({ color: 0xbfeaff, emissive: 0x2a6a9a });

export function disposeCaches() {
  for (const g of geoCache.values()) g.dispose();
  for (const m of matCache.values()) m.dispose();
  geoCache.clear(); matCache.clear();
  FLASH.dispose(); TELE.dispose(); ICE.dispose();
}

function part(g, m, x, y, z, parent) {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------- weapons held by humanoids
export function buildWeapon(kind, color = 0xc8ccd4, accent = 0x8a6a3a) {
  const g = new THREE.Group();
  const metal = lam(color), wood = lam(accent);
  switch (kind) {
    case 'sword': part(box(0.06, 0.5, 0.03), metal, 0, 0.3, 0, g); part(box(0.18, 0.04, 0.05), wood, 0, 0.05, 0, g); break;
    case 'axe': part(box(0.04, 0.55, 0.04), wood, 0, 0.27, 0, g); part(box(0.22, 0.16, 0.03), metal, 0.1, 0.48, 0, g); break;
    case 'dagger': part(box(0.05, 0.26, 0.025), metal, 0, 0.16, 0, g); part(box(0.12, 0.03, 0.04), wood, 0, 0.03, 0, g); break;
    case 'spear': part(box(0.035, 0.95, 0.035), wood, 0, 0.35, 0, g); part(cone(0.05, 0.18, 4), metal, 0, 0.9, 0, g); break;
    case 'hammer': part(box(0.04, 0.5, 0.04), wood, 0, 0.25, 0, g); part(box(0.26, 0.15, 0.15), metal, 0, 0.5, 0, g); break;
    case 'bow': { const t = part(tor(0.28, 0.025), wood, 0, 0.25, 0, g); t.scale.set(0.5, 1, 1); t.rotation.y = Math.PI / 2; break; }
    case 'crossbow': part(box(0.06, 0.06, 0.4), wood, 0, 0.2, 0.1, g); part(box(0.36, 0.04, 0.04), metal, 0, 0.2, 0.25, g); break;
    case 'staff': part(cyl(0.025, 0.03, 0.9, 5), wood, 0, 0.35, 0, g); part(oct(0.09), glow(0xb080ff, 0.9), 0, 0.85, 0, g); break;
    case 'wand': part(cyl(0.02, 0.025, 0.34, 5), wood, 0, 0.17, 0, g); part(oct(0.06), glow(0xffe080, 0.9), 0, 0.36, 0, g); break;
    case 'bash': break;
    default: part(box(0.05, 0.4, 0.03), metal, 0, 0.25, 0, g);
  }
  return g;
}

// ---------------------------------------------------------------- characters
// Returns { group, meshes:[], legs:[], arms:[], weaponHolder, kind, height }
export function buildCharacter(model, color, accent, opts = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const c = lam(color), a = lam(accent);
  const v = { group, body, meshes: [], legs: [], arms: [], wings: [], weaponHolder: null, model, height: 1, eye: null };
  const dark = lam(0x14141c);
  switch (model) {
    case 'humanoid':
    case 'knight':
    case 'imp':
    case 'player': {
      const small = model === 'imp' ? 0.8 : 1;
      v.legs.push(part(box(0.12, 0.32, 0.13), a, -0.1, 0.16, 0, body), part(box(0.12, 0.32, 0.13), a, 0.1, 0.16, 0, body));
      part(box(0.38, 0.42, 0.26), c, 0, 0.52, 0, body);
      part(box(0.28, 0.27, 0.26), c, 0, 0.87, 0, body);
      part(box(0.2, 0.05, 0.02), dark, 0, 0.9, 0.135, body);
      const armL = new THREE.Group(); armL.position.set(-0.25, 0.68, 0); body.add(armL);
      const armR = new THREE.Group(); armR.position.set(0.25, 0.68, 0); body.add(armR);
      part(box(0.1, 0.34, 0.11), c, 0, -0.15, 0, armL);
      part(box(0.1, 0.34, 0.11), c, 0, -0.15, 0, armR);
      v.arms.push(armL, armR);
      const wh = new THREE.Group(); wh.position.set(0, -0.3, 0.05); wh.rotation.x = Math.PI / 2.4; armR.add(wh);
      v.weaponHolder = wh;
      if (model === 'knight' || opts.shield) {
        const sh = part(box(0.34, 0.42, 0.06), a, 0, -0.12, 0.12, armL);
        sh.rotation.y = 0.15;
        part(box(0.06, 0.3, 0.07), lam(0xd8c070), 0, -0.12, 0.13, armL);
        part(box(0.32, 0.08, 0.3), a, 0, 1.03, 0, body);
      }
      if (model === 'imp') {
        part(cone(0.05, 0.18, 4), a, -0.1, 1.08, 0, body).rotation.z = 0.3;
        part(cone(0.05, 0.18, 4), a, 0.1, 1.08, 0, body).rotation.z = -0.3;
      }
      if (opts.hat) { part(cone(0.22, 0.42, 6), lam(opts.hat), 0, 1.18, 0, body); part(cyl(0.3, 0.3, 0.04, 8), lam(opts.hat), 0, 1.0, 0, body); }
      if (opts.hood) { part(box(0.32, 0.16, 0.3), lam(opts.hood), 0, 1.02, -0.02, body); part(box(0.3, 0.3, 0.08), lam(opts.hood), 0, 0.85, -0.14, body); }
      if (opts.cape) { const cp = part(box(0.36, 0.5, 0.04), lam(opts.cape), 0, 0.5, -0.16, body); cp.rotation.x = 0.12; }
      body.scale.setScalar(small);
      v.height = 1.05 * small;
      break;
    }
    case 'caster': {
      part(cone(0.3, 0.75, 7), c, 0, 0.38, 0, body);
      part(sph(0.14, 1), lam(0xd8c8b0), 0, 0.83, 0, body);
      part(cone(0.19, 0.36, 6), c, 0, 1.02, -0.02, body);
      const armR = new THREE.Group(); armR.position.set(0.22, 0.6, 0.05); body.add(armR);
      part(box(0.09, 0.3, 0.09), c, 0, -0.12, 0, armR);
      v.arms.push(armR);
      const st = new THREE.Group(); st.position.set(0.05, -0.2, 0.05); armR.add(st);
      part(cyl(0.025, 0.03, 0.95, 5), lam(0x5a4030), 0, 0.2, 0, st);
      v.eye = part(oct(0.1), glow(accent, 0.95), 0, 0.72, 0, st);
      v.height = 1.15;
      break;
    }
    case 'quadruped': {
      part(box(0.34, 0.3, 0.72), c, 0, 0.42, 0, body);
      part(box(0.28, 0.26, 0.3), c, 0, 0.55, 0.44, body);
      part(box(0.2, 0.06, 0.04), a, 0, 0.6, 0.6, body);
      part(box(0.06, 0.06, 0.3), c, 0, 0.5, -0.45, body).rotation.x = 0.5;
      for (const [x, z] of [[-0.12, 0.26], [0.12, 0.26], [-0.12, -0.26], [0.12, -0.26]]) v.legs.push(part(box(0.09, 0.3, 0.09), a, x, 0.15, z, body));
      v.height = 0.75;
      break;
    }
    case 'blob': {
      const s = part(sph(0.5, 2), c, 0, 0.42, 0, body);
      s.scale.set(1, 0.82, 1);
      part(box(0.08, 0.12, 0.04), dark, -0.14, 0.52, 0.44, body);
      part(box(0.08, 0.12, 0.04), dark, 0.14, 0.52, 0.44, body);
      part(sph(0.18, 1), lam(accent), 0.05, 0.3, 0.05, body);
      v.height = 0.85;
      break;
    }
    case 'floater': {
      const k = part(cone(0.26, 0.7, 6), c, 0, 0.55, 0, body); k.rotation.x = Math.PI;
      part(sph(0.2, 1), c, 0, 0.98, 0, body);
      part(box(0.18, 0.05, 0.04), glow(accent, 0.95), 0, 1.0, 0.18, body);
      const armL = part(box(0.08, 0.4, 0.08), c, -0.28, 0.75, 0.05, body); armL.rotation.z = 0.5;
      const armR = part(box(0.08, 0.4, 0.08), c, 0.28, 0.75, 0.05, body); armR.rotation.z = -0.5;
      v.arms.push(armL, armR);
      v.height = 1.2; v.hover = 0.35;
      break;
    }
    case 'golem': {
      part(box(0.6, 0.55, 0.42), c, 0, 0.75, 0, body);
      part(box(0.34, 0.28, 0.3), c, 0, 1.16, 0.05, body);
      part(box(0.22, 0.06, 0.04), glow(accent, 0.95), 0, 1.18, 0.21, body);
      v.legs.push(part(box(0.2, 0.45, 0.22), c, -0.17, 0.23, 0, body), part(box(0.2, 0.45, 0.22), c, 0.17, 0.23, 0, body));
      const armL = new THREE.Group(); armL.position.set(-0.42, 0.95, 0); body.add(armL);
      const armR = new THREE.Group(); armR.position.set(0.42, 0.95, 0); body.add(armR);
      part(box(0.2, 0.55, 0.22), c, 0, -0.25, 0, armL);
      part(box(0.2, 0.55, 0.22), c, 0, -0.25, 0, armR);
      part(box(0.24, 0.2, 0.24), a, 0, -0.55, 0, armL);
      part(box(0.24, 0.2, 0.24), a, 0, -0.55, 0, armR);
      v.arms.push(armL, armR);
      v.height = 1.35;
      break;
    }
    case 'bat': {
      part(sph(0.17, 1), c, 0, 0.7, 0, body);
      part(box(0.05, 0.05, 0.03), glow(accent, 1), -0.06, 0.74, 0.15, body);
      part(box(0.05, 0.05, 0.03), glow(accent, 1), 0.06, 0.74, 0.15, body);
      const wl = new THREE.Group(); wl.position.set(-0.14, 0.72, 0); body.add(wl);
      const wr = new THREE.Group(); wr.position.set(0.14, 0.72, 0); body.add(wr);
      part(box(0.4, 0.03, 0.24), a, -0.2, 0, 0, wl);
      part(box(0.4, 0.03, 0.24), a, 0.2, 0, 0, wr);
      v.wings.push(wl, wr);
      v.height = 0.9; v.hover = 0.15;
      break;
    }
    case 'mushroom': {
      part(cyl(0.12, 0.16, 0.45, 7), lam(0xe8dcc0), 0, 0.23, 0, body);
      const cap = part(sph(0.34, 1), c, 0, 0.5, 0, body); cap.scale.set(1, 0.55, 1);
      for (const [x, z] of [[0.15, 0.12], [-0.17, 0.05], [0.02, -0.2], [0.05, 0.25]]) part(sph(0.05, 0), lam(accent), x, 0.66, z, body);
      part(box(0.05, 0.07, 0.03), dark, -0.06, 0.3, 0.14, body);
      part(box(0.05, 0.07, 0.03), dark, 0.06, 0.3, 0.14, body);
      v.height = 0.8;
      break;
    }
    case 'bloat': {
      part(sph(0.42, 1), c, 0, 0.48, 0, body);
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        const sp = part(cone(0.06, 0.18, 4), lam(accent), Math.cos(ang) * 0.4, 0.5 + (k % 2) * 0.15, Math.sin(ang) * 0.4, body);
        sp.rotation.z = -Math.cos(ang) * 1.3; sp.rotation.x = Math.sin(ang) * 1.3;
      }
      part(box(0.1, 0.1, 0.04), glow(accent, 1), 0, 0.55, 0.42, body);
      v.height = 0.95;
      break;
    }
    case 'eye': {
      part(sph(0.4, 2), c, 0, 0.75, 0, body);
      part(sph(0.22, 1), lam(0xf0f0e8), 0, 0.77, 0.25, body).scale.set(1, 1, 0.5);
      v.eye = part(sph(0.12, 1), glow(accent, 1), 0, 0.77, 0.34, body);
      for (let k = 0; k < 5; k++) {
        const t = part(cone(0.05, 0.4, 4), lam(accent), Math.cos(k * 1.25) * 0.25, 0.32, Math.sin(k * 1.25) * 0.25 - 0.05, body);
        t.rotation.x = Math.PI;
      }
      v.height = 1.25; v.hover = 0.3;
      break;
    }
    default:
      part(box(0.4, 0.6, 0.4), c, 0, 0.3, 0, body);
  }
  if (opts.crown) {
    const cr = new THREE.Group();
    cr.position.set(0, v.height + 0.02, 0);
    for (let k = 0; k < 5; k++) { const ang = (k / 5) * Math.PI * 2; part(cone(0.05, 0.16, 4), basic(opts.crown), Math.cos(ang) * 0.14, 0.05, Math.sin(ang) * 0.14, cr); }
    part(cyl(0.16, 0.16, 0.06, 8), basic(opts.crown), 0, 0, 0, cr);
    body.add(cr);
  }
  body.traverse((o) => { if (o.isMesh && o.material !== undefined && !o.material.transparent) { v.meshes.push(o); o.userData.mat = o.material; } });
  return v;
}

export function setCharMaterial(v, mat) {
  if (v.curMat === mat) return;
  v.curMat = mat;
  for (const m of v.meshes) m.material = mat || m.userData.mat;
}

// ---------------------------------------------------------------- props
export function buildProp(o, biome) {
  const g = new THREE.Group();
  const v = { group: g, kind: o.kind, lid: null, orb: null, item: null, spin: null };
  switch (o.kind) {
    case 'chest': {
      const tier = o.tier || 0;
      const wood = lam(tier === 1 ? 0x6a3a8a : tier === 2 ? 0x2a6a5a : 0x7a4a24), band = lam(tier ? 0xffd24a : 0xb8a070);
      part(box(0.62, 0.34, 0.42), wood, 0, 0.17, 0, g);
      part(box(0.64, 0.06, 0.44), band, 0, 0.3, 0, g);
      const lid = new THREE.Group(); lid.position.set(0, 0.34, -0.21); g.add(lid);
      part(box(0.62, 0.14, 0.42), wood, 0, 0.07, 0.21, lid);
      part(box(0.1, 0.12, 0.04), band, 0, 0.0, 0.43, lid);
      v.lid = lid;
      if (tier) v.orb = part(oct(0.08), glow(0xffd24a, 0.9), 0, 0.85, 0, g);
      break;
    }
    case 'shrine': {
      const colors = { perk: 0xffd24a, fountain: 0x4ab0ff, blood: 0xd02a3a, gamble: 0x60e0a0 };
      const col = colors[o.shrine] || 0xffffff;
      if (o.shrine === 'fountain') {
        part(cyl(0.45, 0.5, 0.3, 10), lam(0x8a8a9a), 0, 0.15, 0, g);
        part(cyl(0.38, 0.38, 0.04, 10), glow(col, 0.8), 0, 0.31, 0, g);
        part(cyl(0.08, 0.1, 0.5, 6), lam(0x8a8a9a), 0, 0.45, 0, g);
        v.orb = part(sph(0.1, 1), glow(col, 0.9), 0, 0.78, 0, g);
      } else {
        part(box(0.5, 0.18, 0.5), lam(0x5a5866), 0, 0.09, 0, g);
        part(box(0.3, 0.7, 0.3), lam(o.shrine === 'blood' ? 0x5a2a2a : 0x7a7888), 0, 0.5, 0, g);
        part(box(0.42, 0.08, 0.42), lam(0x5a5866), 0, 0.88, 0, g);
        v.orb = part(oct(0.16), glow(col, 0.95), 0, 1.15, 0, g);
      }
      v.ring = part(geo('ring1', () => new THREE.RingGeometry(0.55, 0.62, 24)), glow(col, 0.5), 0, 0.02, 0, g);
      v.ring.rotation.x = -Math.PI / 2;
      break;
    }
    case 'pedestal': {
      part(cyl(0.26, 0.32, 0.5, 8), lam(0x6a6070), 0, 0.25, 0, g);
      const col = o.sell === 'item' && o.item ? RARITY_HEX[o.item.rarity] : o.sell === 'potion' ? 0xe04050 : o.sell === 'bomb' ? 0x303038 : o.sell === 'key' ? 0xffd24a : 0xe8dcb0;
      v.item = part(oct(0.14), o.sell === 'bomb' ? lam(col) : glow(col, 0.95), 0, 0.8, 0, g);
      break;
    }
    case 'shopkeeper': {
      const ch = buildCharacter('caster', 0x8a6a3a, 0xffd24a);
      g.add(ch.group);
      part(box(1.2, 0.5, 0.5), lam(0x5a3a24), 0, 0.25, -0.6, g);
      break;
    }
    case 'key': {
      v.spin = new THREE.Group(); v.spin.position.y = 0.45; g.add(v.spin);
      part(tor(0.1, 0.03), basic(0xffd24a), 0, 0.1, 0, v.spin);
      part(box(0.04, 0.22, 0.04), basic(0xffd24a), 0, -0.08, 0, v.spin);
      part(box(0.08, 0.04, 0.04), basic(0xffd24a), 0.04, -0.15, 0, v.spin);
      v.ring = part(geo('ring1', () => new THREE.RingGeometry(0.55, 0.62, 24)), glow(0xffd24a, 0.5), 0, 0.02, 0, g);
      v.ring.rotation.x = -Math.PI / 2;
      break;
    }
    case 'gold': {
      for (let k = 0; k < 5; k++) part(cyl(0.09, 0.09, 0.04, 8), lam(0xffcc40), (k % 3 - 1) * 0.12, 0.03 + Math.floor(k / 3) * 0.04, (k % 2) * 0.1 - 0.05, g);
      break;
    }
    case 'crate': {
      if ((o.id % 2) === 0) {
        part(box(0.56, 0.5, 0.56), lam(0x7a5a34), 0, 0.25, 0, g);
        part(box(0.6, 0.06, 0.6), lam(0x5a4024), 0, 0.5, 0, g);
      } else {
        part(cyl(0.2, 0.26, 0.5, 8), lam(0x9a6040), 0, 0.25, 0, g);
        part(cyl(0.14, 0.2, 0.1, 8), lam(0x9a6040), 0, 0.55, 0, g);
      }
      break;
    }
    default: part(box(0.3, 0.3, 0.3), lam(0xffffff), 0, 0.15, 0, g);
  }
  return v;
}

export const RARITY_HEX = [0xc8ccd4, 0x5ea8ff, 0xffd24a, 0xc070ff, 0xff8a2a];

export function buildPickup(p) {
  const g = new THREE.Group();
  const spin = new THREE.Group(); g.add(spin);
  let beam = null;
  switch (p.kind) {
    case 'gold': part(cyl(0.11, 0.11, 0.04, 8), basic(0xffcc40), 0, 0, 0, spin).rotation.x = Math.PI / 2; break;
    case 'potion': part(sph(0.12, 1), basic(0xe04050), 0, 0, 0, spin); part(box(0.06, 0.1, 0.06), lam(0xd8c8a8), 0, 0.14, 0, spin); break;
    case 'bomb': part(sph(0.13, 1), lam(0x26262e), 0, 0, 0, spin); part(box(0.03, 0.1, 0.03), basic(0xffa040), 0, 0.15, 0, spin); break;
    case 'scroll': part(cyl(0.05, 0.05, 0.3, 6), lam(0xe8dcb0), 0, 0, 0, spin).rotation.z = Math.PI / 2; part(box(0.06, 0.1, 0.02), basic(0x5ea8ff), 0, 0, 0.05, spin); break;
    case 'key': part(tor(0.08, 0.025), basic(0xffd24a), 0, 0.06, 0, spin); part(box(0.035, 0.18, 0.035), basic(0xffd24a), 0, -0.06, 0, spin); break;
    case 'item': {
      const col = RARITY_HEX[p.item ? p.item.rarity : 0];
      part(oct(0.15), basic(col), 0, 0, 0, spin);
      if (p.item && p.item.rarity >= 1) {
        beam = part(cyl(0.06, 0.12, 2.2, 6), glow(col, p.item.rarity >= 3 ? 0.45 : 0.25), 0, 1.0, 0, g);
      }
      break;
    }
    default: part(sph(0.1, 0), basic(0xffffff), 0, 0, 0, spin);
  }
  return { group: g, spin, beam, kind: p.kind };
}
