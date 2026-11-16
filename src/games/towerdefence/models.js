// Low-poly models built from primitives, with shared geometries and materials.
import * as THREE from 'three';

const geoCache = new Map();
const matCache = new Map();

const DEFAULT_GEOS = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  hex: () => new THREE.CylinderGeometry(0.4, 0.44, 1, 6),
  torus: () => new THREE.TorusGeometry(1, 0.12, 4, 10),
  oct: () => new THREE.OctahedronGeometry(1, 0),
  rangeRing: () => new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2),
};
export function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = (make || DEFAULT_GEOS[key])(); geoCache.set(key, g); }
  return g;
}
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (!m) {
    if (opts.basic) m = new THREE.MeshBasicMaterial({ color, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !opts.transparent });
    else m = new THREE.MeshLambertMaterial({ color, flatShading: true, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.ei ?? 1, transparent: !!opts.transparent, opacity: opts.opacity ?? 1 });
    matCache.set(key, m);
  }
  return m;
}
export function disposeModelCaches() {
  for (const g of geoCache.values()) g.dispose();
  for (const m of matCache.values()) m.dispose();
  geoCache.clear(); matCache.clear();
}

// Merge non-indexed copies of several geometries into one (position + normal only).
export function mergeGeos(list) {
  const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    if (!p.attributes.normal) p.computeVertexNormals();
    pos.set(p.attributes.position.array, o * 3);
    nor.set(p.attributes.normal.array, o * 3);
    o += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}
function tx(g, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  return g.clone().applyMatrix4(m);
}

// ---------------------------------------------------------------- enemy shapes (unit scale)
export function enemyGeometry(shape) {
  return geo('enemy:' + shape, () => {
    switch (shape) {
      case 'ball': return mergeGeos([new THREE.IcosahedronGeometry(0.5, 0), tx(new THREE.BoxGeometry(0.22, 0.14, 0.5), { x: 0.36, y: 0.08 })]);
      case 'cone': return mergeGeos([tx(new THREE.ConeGeometry(0.42, 0.9, 5), { rz: -Math.PI / 2, y: 0 }), tx(new THREE.BoxGeometry(0.5, 0.3, 0.6), { x: -0.1, y: -0.15 })]);
      case 'spike': return mergeGeos([tx(new THREE.OctahedronGeometry(0.5, 0), { sy: 1.15 }), tx(new THREE.BoxGeometry(0.7, 0.12, 0.7), { y: -0.1 })]);
      case 'disc': return mergeGeos([tx(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8), {}), tx(new THREE.SphereGeometry(0.28, 6, 4), { y: 0.25 })]);
      case 'tetra': return mergeGeos([tx(new THREE.TetrahedronGeometry(0.6, 0), { ry: 0.6, y: 0.05 }), tx(new THREE.BoxGeometry(0.2, 0.2, 0.2), { y: 0.5 })]);
      case 'wing': return mergeGeos([
        tx(new THREE.ConeGeometry(0.25, 0.9, 4), { rz: -Math.PI / 2 }),
        tx(new THREE.BoxGeometry(0.35, 0.05, 1.3), { x: -0.05 }),
        tx(new THREE.BoxGeometry(0.2, 0.25, 0.05), { x: -0.38, y: 0.12 }),
      ]);
      case 'boss': return mergeGeos([
        new THREE.DodecahedronGeometry(0.55, 0),
        tx(new THREE.ConeGeometry(0.12, 0.45, 4), { x: 0.2, y: 0.5, z: 0.25, rx: 0.4 }),
        tx(new THREE.ConeGeometry(0.12, 0.45, 4), { x: 0.2, y: 0.5, z: -0.25, rx: -0.4 }),
        tx(new THREE.BoxGeometry(0.3, 0.2, 0.6), { x: 0.45, y: 0.05 }),
      ]);
      case 'box':
      default: return mergeGeos([tx(new THREE.BoxGeometry(0.8, 0.8, 0.8), {}), tx(new THREE.BoxGeometry(0.3, 0.3, 0.5), { x: 0.45, y: 0.15 })]);
    }
  });
}

// ---------------------------------------------------------------- towers
const STONE = 0x7d776c, STONE_D = 0x5f5a52, WOOD = 0x8a6440, IRON = 0x4c525c, GOLD = 0xe8c25a;

function add(parent, g, m, p = {}) {
  const mesh = new THREE.Mesh(g, m);
  if (p.x || p.y || p.z) mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
  if (p.rx || p.ry || p.rz) mesh.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
  // `s` is the uniform scale; sx/sy/sz override single axes on top of it.
  const u = p.s || 1;
  if (p.s || p.sx || p.sy || p.sz) mesh.scale.set(p.sx || u, p.sy || u, p.sz || u);
  parent.add(mesh);
  return mesh;
}
const G = {
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  hex: () => geo('hex', () => new THREE.CylinderGeometry(0.4, 0.44, 1, 6)),
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 8)),
  cylX: () => geo('cylX', () => new THREE.CylinderGeometry(1, 1, 1, 8).rotateZ(Math.PI / 2).translate(0.5, 0, 0)),
  cone: () => geo('cone', () => new THREE.ConeGeometry(1, 1, 6)),
  coneX: () => geo('coneX', () => new THREE.ConeGeometry(1, 1, 6).rotateZ(-Math.PI / 2).translate(0.5, 0, 0)),
  sph: () => geo('sph', () => new THREE.IcosahedronGeometry(1, 0)),
  oct: () => geo('oct', () => new THREE.OctahedronGeometry(1, 0)),
  dod: () => geo('dod', () => new THREE.DodecahedronGeometry(1, 0)),
  torus: () => geo('torus', () => new THREE.TorusGeometry(1, 0.12, 4, 10)),
  pyr: () => geo('pyr', () => new THREE.ConeGeometry(1, 1, 4)),
};

// Returns { group, head, tip (Object3D at the muzzle), height }.
// Head forward is +X; the renderer sets head.rotation.y = -angle.
export function buildTowerModel(type, level, branch, color, ghost = false) {
  const group = new THREE.Group();
  const M = (c, o = {}) => (ghost ? mat(0x9fe0ff, { basic: true, transparent: true, opacity: 0.45 }) : mat(c, o));
  const col = parseInt(color.slice(1), 16);
  const baseH = 0.2 + 0.07 * Math.min(level - 1, 2);
  if (type !== 'wall') {
    add(group, G.hex(), M(STONE), { y: baseH / 2, sy: baseH });
    for (let i = 1; i < Math.min(level, 3); i++) add(group, G.hex(), M(col), { y: 0.2 + 0.07 * i - 0.03, sy: 0.04, s: 0.92 });
    if (branch) add(group, G.oct(), M(branch === 'a' ? 0xffd75e : 0xd8e4f0, { emissive: branch === 'a' ? 0x553300 : 0x223344 }), { x: -0.32, y: baseH + 0.05, z: 0.22, s: 0.09 });
    if (level >= 5) add(group, G.oct(), M(0xff6f9f, { emissive: 0x551122 }), { x: -0.32, y: baseH + 0.05, z: -0.22, s: 0.09 });
  }
  const head = new THREE.Group();
  head.position.y = baseH;
  group.add(head);
  const tip = new THREE.Object3D();
  head.add(tip);
  const sc = 1 + 0.06 * (level - 1);
  head.scale.setScalar(sc);
  let height = baseH + 0.5;

  switch (type) {
    case 'wall': {
      add(group, G.box(), M(0x8f8a7e), { y: 0.3, sx: 0.92, sy: 0.6, sz: 0.92 });
      add(group, G.box(), M(0x7a756a), { y: 0.62, sx: 0.7, sy: 0.08, sz: 0.7 });
      head.position.y = 0.62;
      if (branch === 'a') {
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 + Math.PI / 4;
          add(head, G.cone(), M(0xd0c8b8), { x: Math.cos(a) * 0.3, z: Math.sin(a) * 0.3, y: 0.12, s: 0.08, sy: 0.35, rx: Math.sin(a) * 0.5, rz: -Math.cos(a) * 0.5 });
        }
        if (level >= 3) for (let i = 0; i < 4; i++) add(head, G.cone(), M(0xd0c8b8), { x: (i % 2 ? 1 : -1) * 0.45, z: (i < 2 ? 1 : -1) * 0.1, y: -0.2, s: 0.07, sy: 0.3, rz: (i % 2 ? -1 : 1) * 1.2 });
      } else if (branch === 'b') {
        add(head, G.cyl(), M(WOOD), { y: 0.35, s: 0.04, sy: 0.7 });
        add(head, G.box(), M(0x5aa7e0), { x: 0.14, y: 0.6, sx: 0.26, sy: 0.16, sz: 0.02 });
        if (level >= 3) add(head, G.sph(), M(0xbfe8ff, { emissive: 0x2a6080 }), { y: 0.76, s: 0.08 });
      }
      height = 0.9;
      break;
    }
    case 'arrow': {
      add(head, G.box(), M(WOOD), { y: 0.12, sx: 0.32, sy: 0.24, sz: 0.32 });
      const shafts = branch === 'a' ? (level >= 5 ? 4 : 3) : 1;
      for (let i = 0; i < shafts; i++) {
        const z = (i - (shafts - 1) / 2) * 0.1;
        add(head, G.box(), M(0xd8c8a8), { x: 0.2, y: 0.3, z, sx: 0.5, sy: 0.03, sz: 0.03 });
        add(head, G.coneX(), M(IRON), { x: 0.44, y: 0.3, z, s: 0.05, sx: 0.1 });
      }
      add(head, G.torus(), M(0x6a4a2a), { x: 0.14, y: 0.3, s: 0.24, sz: 0.5, ry: Math.PI / 2, rz: 0 });
      if (branch === 'b') {
        add(head, G.cylX(), M(IRON), { x: -0.05, y: 0.45, s: 0.05, sx: 0.32 });
        add(head, G.sph(), M(0xff4040, { emissive: 0x801010 }), { x: 0.28, y: 0.45, s: 0.045 });
      }
      tip.position.set(0.5, 0.3, 0);
      break;
    }
    case 'cannon': {
      add(head, G.sph(), M(IRON), { y: 0.2, s: 0.24 });
      const r = branch === 'a' ? 0.12 : 0.085;
      if (branch === 'a') {
        add(head, G.cylX(), M(0x3a3e46), { y: 0.22, z: 0.09, s: r * 0.8, sx: 0.55 });
        add(head, G.cylX(), M(0x3a3e46), { y: 0.22, z: -0.09, s: r * 0.8, sx: 0.55 });
      } else add(head, G.cylX(), M(0x3a3e46), { y: 0.22, s: r, sx: 0.5 });
      if (branch === 'b') add(head, G.cyl(), M(0x2a2018), { x: -0.2, y: 0.32, s: 0.11, sy: 0.18 });
      if (level >= 3) add(head, G.torus(), M(GOLD), { x: 0.42, y: 0.22, s: 0.1, ry: Math.PI / 2 });
      tip.position.set(0.55, 0.22, 0);
      break;
    }
    case 'frost': {
      const c = add(head, G.oct(), M(0x9fe8ff, { emissive: 0x2a7090, transparent: !ghost, opacity: 0.92 }), { y: 0.38, s: 0.2, sy: 0.38 });
      c.userData.spin = 1.2;
      if (level >= 2) add(head, G.oct(), M(0xcff4ff, { emissive: 0x2a7090 }), { x: 0.16, y: 0.2, s: 0.07, sy: 0.15 });
      if (level >= 3) add(head, G.oct(), M(0xcff4ff, { emissive: 0x2a7090 }), { x: -0.14, y: 0.2, z: 0.1, s: 0.07, sy: 0.15 });
      if (branch === 'a') for (let i = 0; i < 3; i++) add(head, G.oct(), M(0xdaf6ff, { emissive: 0x3a90b0 }), { x: Math.cos(i * 2.1) * 0.26, z: Math.sin(i * 2.1) * 0.26, y: 0.32, s: 0.06, sy: 0.18 });
      if (branch === 'b') { const r = add(head, G.torus(), M(0xbfefff, { emissive: 0x2a7090 }), { y: 0.4, s: 0.32, rx: Math.PI / 2 }); r.userData.spin = -2; }
      tip.position.set(0.1, 0.4, 0);
      height = baseH + 0.8;
      break;
    }
    case 'tesla': {
      add(head, G.cyl(), M(IRON), { y: 0.25, s: 0.06, sy: 0.5 });
      const rings = branch === 'a' ? 4 : 2 + Math.min(level, 3) - 1;
      for (let i = 0; i < rings; i++) add(head, G.torus(), M(0xb08a40), { y: 0.12 + i * 0.1, s: 0.17 - i * 0.015, rx: Math.PI / 2 });
      const orb = add(head, G.sph(), M(0xd8b8ff, { emissive: 0x7040c0 }), { y: 0.62, s: 0.12 });
      orb.userData.pulse = true;
      if (branch === 'b') for (let i = 0; i < 4; i++) add(head, G.cone(), M(0xd8b8ff, { emissive: 0x5030a0 }), { x: Math.cos(i * 1.57) * 0.14, z: Math.sin(i * 1.57) * 0.14, y: 0.66, s: 0.04, sy: 0.2, rz: -Math.cos(i * 1.57) * 0.9, rx: Math.sin(i * 1.57) * 0.9 });
      tip.position.set(0, 0.62, 0);
      height = baseH + 0.8;
      break;
    }
    case 'venom': {
      add(head, G.cyl(), M(0x3f6a30), { y: 0.18, s: 0.2, sy: 0.32 });
      add(head, G.cyl(), M(0x8be05a, { emissive: 0x2a5010 }), { y: 0.36, s: 0.17, sy: 0.06 });
      add(head, G.cylX(), M(IRON), { y: 0.2, s: 0.045, sx: 0.42 });
      if (branch === 'b') add(head, G.cylX(), M(IRON), { y: 0.3, z: 0.08, s: 0.035, sx: 0.4 });
      if (branch === 'a') add(head, G.sph(), M(0xe8f0d0), { y: 0.48, s: 0.1 });
      tip.position.set(0.44, 0.2, 0);
      break;
    }
    case 'sniper': {
      add(head, G.box(), M(STONE_D), { y: 0.3, sx: 0.2, sy: 0.6, sz: 0.2 });
      const rail = branch === 'b';
      if (rail) {
        add(head, G.box(), M(0x6a7080), { x: 0.3, y: 0.62, z: 0.05, sx: 0.7, sy: 0.04, sz: 0.03 });
        add(head, G.box(), M(0x6a7080), { x: 0.3, y: 0.62, z: -0.05, sx: 0.7, sy: 0.04, sz: 0.03 });
        add(head, G.box(), M(0xfff0a0, { emissive: 0x806020 }), { x: 0.3, y: 0.62, sx: 0.6, sy: 0.02, sz: 0.02 });
      } else add(head, G.cylX(), M(0x30343c), { y: 0.62, s: 0.035, sx: 0.65 });
      add(head, G.cylX(), M(IRON), { x: -0.05, y: 0.7, s: 0.04, sx: 0.25 });
      add(head, G.sph(), M(branch === 'a' ? 0xff3030 : 0x60c0ff, { emissive: branch === 'a' ? 0x801010 : 0x103060 }), { x: 0.21, y: 0.7, s: 0.03 });
      tip.position.set(0.66, 0.62, 0);
      height = baseH + 0.9;
      break;
    }
    case 'mortar': {
      add(head, G.cyl(), M(0x6a5a48), { y: 0.1, s: 0.3, sy: 0.18 });
      const tubes = branch === 'b' ? 3 : 1;
      for (let i = 0; i < tubes; i++) {
        const z = (i - (tubes - 1) / 2) * 0.14;
        add(head, G.cyl(), M(0x2f3138), { x: 0.08, y: 0.3, z, s: tubes > 1 ? 0.07 : 0.11, sy: 0.4, rz: -0.6 });
      }
      if (branch === 'a') add(head, G.cyl(), M(0xff7a2f, { emissive: 0x602000 }), { x: -0.2, y: 0.26, s: 0.09, sy: 0.3 });
      tip.position.set(0.22, 0.48, 0);
      break;
    }
    case 'flame': {
      add(head, G.sph(), M(0xa04020), { y: 0.2, s: 0.2 });
      const wide = branch === 'a';
      const long = branch === 'b';
      add(head, G.coneX(), M(IRON), { x: 0.1, y: 0.22, s: wide ? 0.13 : 0.07, sx: long ? 0.6 : 0.4 });
      const pilot = add(head, G.sph(), M(0xffb040, { emissive: 0xff6000 }), { x: long ? 0.72 : 0.52, y: 0.22, s: 0.04 });
      pilot.userData.pulse = true;
      if (long) add(head, G.cone(), M(0xa04020), { x: -0.05, y: 0.4, s: 0.05, sy: 0.18 });
      tip.position.set(long ? 0.72 : 0.52, 0.22, 0);
      break;
    }
    case 'beacon': {
      add(head, G.pyr(), M(0xc8a050), { y: 0.35, s: 0.18, sy: 0.7, ry: Math.PI / 4 });
      const orb = add(head, G.oct(), M(0xffe090, { emissive: 0xa07010 }), { y: 0.86, s: 0.11 });
      orb.userData.spin = 1.5; orb.userData.bob = true;
      if (branch === 'a') add(head, G.cyl(), M(0x9a3a2a), { y: 0.12, s: 0.22, sy: 0.18 });
      if (branch === 'b') { add(head, G.sph(), M(0xffffff), { y: 1.05, s: 0.1 }); add(head, G.sph(), M(0x202040), { x: 0.07, y: 1.05, s: 0.045 }); }
      tip.position.set(0, 0.86, 0);
      height = baseH + 1.1;
      break;
    }
    case 'mine': {
      add(head, G.box(), M(WOOD), { x: -0.1, y: 0.25, rz: 0.35, sx: 0.05, sy: 0.55, sz: 0.05 });
      add(head, G.box(), M(WOOD), { x: 0.1, y: 0.25, rz: -0.35, sx: 0.05, sy: 0.55, sz: 0.05 });
      const wheel = add(head, G.torus(), M(IRON), { y: 0.5, s: 0.1, rx: 0 });
      wheel.userData.spinZ = 2;
      const nug = 2 + Math.min(level, 3);
      for (let i = 0; i < nug; i++) add(head, G.dod(), M(GOLD, { emissive: 0x403000 }), { x: Math.cos(i * 2.4) * 0.22, z: Math.sin(i * 2.4) * 0.22, y: 0.06, s: 0.07 });
      if (branch === 'a') for (let i = 0; i < 3; i++) add(head, G.cyl(), M(GOLD, { emissive: 0x403000 }), { x: 0.2, z: -0.18, y: 0.03 + i * 0.05, s: 0.09, sy: 0.04 });
      if (branch === 'b') add(head, G.box(), M(IRON), { x: -0.22, y: 0.18, z: 0.18, sx: 0.04, sy: 0.04, sz: 0.3, ry: 0.5 });
      height = baseH + 0.7;
      break;
    }
  }
  group.userData.height = height;
  return { group, head, tip, height };
}

// ---------------------------------------------------------------- hero
export function buildHeroModel() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const teal = mat(0x3fd0c0), dark = mat(0x23323f), skin = mat(0xf0c8a0), cape = mat(0xe25c5c);
  const legL = add(body, G.box(), dark, { x: 0, y: 0.12, z: 0.08, sx: 0.1, sy: 0.24, sz: 0.09 });
  const legR = add(body, G.box(), dark, { x: 0, y: 0.12, z: -0.08, sx: 0.1, sy: 0.24, sz: 0.09 });
  add(body, G.box(), teal, { y: 0.36, sx: 0.2, sy: 0.26, sz: 0.28 });
  add(body, G.box(), cape, { x: -0.12, y: 0.32, sx: 0.04, sy: 0.3, sz: 0.26 });
  add(body, G.sph(), skin, { y: 0.58, s: 0.11 });
  add(body, G.box(), mat(0x3fd0c0), { y: 0.66, sx: 0.2, sy: 0.05, sz: 0.2 });
  const gun = new THREE.Group();
  gun.position.set(0.08, 0.38, -0.15);
  body.add(gun);
  add(gun, G.box(), mat(0x4c525c), { x: 0.16, sx: 0.32, sy: 0.07, sz: 0.07 });
  add(gun, G.box(), mat(0x9ff0ff, { emissive: 0x206070 }), { x: 0.3, sx: 0.05, sy: 0.05, sz: 0.05 });
  const flash = add(gun, G.sph(), mat(0xfff0b0, { basic: true, transparent: true, opacity: 0.9, additive: true }), { x: 0.4, s: 0.09 });
  flash.visible = false;
  const ring = new THREE.Mesh(geo('heroRing', () => new THREE.RingGeometry(0.3, 0.38, 24).rotateX(-Math.PI / 2)), mat(0x3fd0c0, { basic: true, transparent: true, opacity: 0.8, additive: true }));
  ring.position.y = 0.02;
  group.add(ring);
  return { group, body, legL, legR, gun, flash, ring };
}
