// Low-poly building models, generated in code. Each model is one merged, vertex-coloured geometry.
// Units: one tile = 1. Models are centred on their footprint and sit on y = 0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { B } from './data.js';

const C = {
  thatch: 0xc9a455, thatch2: 0xb38d42, hide: 0xcfae7d, wood: 0x8a623c, wood2: 0x6f4c2c, dark: 0x3a2c22, log: 0xa07448,
  mud: 0xd8b086, mud2: 0xc79a6b, brick: 0xb5593f, brick2: 0x9c4a35, stone: 0xa7a59c, stone2: 0x8c8a82, marble: 0xeee9dd, marble2: 0xdcd5c4,
  terra: 0xc8643c, terra2: 0xb5523a, plaster: 0xeadfc4, beam: 0x5b4330, slate: 0x56626e, slate2: 0x454f59, ochre: 0xe6c488, rose: 0xdba58c,
  iron: 0x4a4f57, glass: 0xa9dde6, copper: 0x62b39c, gold: 0xe0b23c, water: 0x4aa8d8, leaf: 0x5fae4a, leaf2: 0x4c9440, hedge: 0x3f8a3e,
  red: 0xc9503c, blue: 0x3f78b5, yellow: 0xe6b93a, white: 0xf4f1ea, soil: 0x8a6a45, coal: 0x2e2e33, fire: 0xff8a2a, wool: 0xf3efe6, sand: 0xdccb9a,
  purple: 0x8a5aa6, green: 0x3f9b6b,
};

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Color();

class Kit {
  constructor() { this.parts = []; }
  add(geo, color, x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute('uv'); g.deleteAttribute('normal');
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
    g.applyMatrix4(_m.compose(_p, _q, _s));
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  }
  // y is always the base of the shape.
  box(w, h, d, x, y, z, color, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, ry); }
  cyl(r, h, x, y, z, color, seg = 8, rTop = r) { return this.add(new THREE.CylinderGeometry(rTop, r, h, seg), color, x, y + h / 2, z); }
  cone(r, h, x, y, z, color, seg = 8) { return this.add(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z); }
  pyr(w, h, d, x, y, z, color) { return this.add(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), color, x, y + 0.5, z, Math.PI / 4).scaleLast(w, h, d); }
  ball(r, x, y, z, color, sy = 1) { return this.add(new THREE.IcosahedronGeometry(r, 0), color, x, y, z, 0.4, 0, 0, 1, sy, 1); }
  dome(r, x, y, z, color, seg = 8, sy = 1) { return this.add(new THREE.SphereGeometry(r, seg, 4, 0, Math.PI * 2, 0, Math.PI / 2), color, x, y, z, 0, 0, 0, 1, sy, 1); }
  // Gable roof: a triangular prism, ridge along x (or along z when alongZ).
  gable(w, h, d, x, y, z, color, alongZ = false) {
    const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false });
    g.translate(0, 0, -0.5);
    return alongZ ? this.add(g, color, x, y, z, 0, 0, 0, w, h, d) : this.add(g, color, x, y, z, Math.PI / 2, 0, 0, d, h, w);
  }
  // Horizontal cylinder (logs, barrels, vaults).
  hcyl(r, len, x, y, z, color, alongZ = false, seg = 8, arc = Math.PI * 2) {
    const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false, alongZ ? -Math.PI / 2 : 0, arc);
    return this.add(g, color, x, y, z, 0, alongZ ? -Math.PI / 2 : 0, alongZ ? 0 : Math.PI / 2);
  }
  scaleLast(w, h, d) {         // used by pyr: stretch the unit pyramid after its 45 degree turn
    const g = this.parts[this.parts.length - 1], p = g.attributes.position;
    let cx = 0, cy = 0, cz = 0; for (let i = 0; i < p.count; i++) { cx += p.getX(i); cy += p.getY(i); cz += p.getZ(i); }
    cx /= p.count; cz /= p.count;
    let minY = Infinity; for (let i = 0; i < p.count; i++) minY = Math.min(minY, p.getY(i));
    for (let i = 0; i < p.count; i++) p.setXYZ(i, cx + (p.getX(i) - cx) * w, minY + (p.getY(i) - minY) * h, cz + (p.getZ(i) - cz) * d);
    return this;
  }
  win(x, y, z, alongZ = false, color = C.dark, w = 0.09, h = 0.11) { return alongZ ? this.box(0.02, h, w, x, y, z, color) : this.box(w, h, 0.02, x, y, z, color); }
  tree(x, z, s = 1, color = C.leaf) { this.cyl(0.03 * s, 0.14 * s, x, 0, z, C.wood2, 5); return this.ball(0.13 * s, x, 0.24 * s, z, color, 1.15); }
  pine(x, z, s = 1, color = C.leaf2) { this.cyl(0.025 * s, 0.1 * s, x, 0, z, C.wood2, 5); this.cone(0.12 * s, 0.22 * s, x, 0.08 * s, z, color, 6); return this.cone(0.085 * s, 0.18 * s, x, 0.22 * s, z, color, 6); }
  build(clipY = null) {
    let g = mergeGeometries(this.parts, false);
    if (clipY !== null) {
      const p = g.attributes.position, c = g.attributes.color, keepP = [], keepC = [];
      for (let i = 0; i < p.count; i += 3) {
        const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
        if (cy > clipY) continue;
        for (let k = 0; k < 3; k++) { keepP.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k)); keepC.push(c.getX(i + k), c.getY(i + k), c.getZ(i + k)); }
      }
      g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(keepP, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(keepC, 3));
    }
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

const shade = (hex, f) => _c.set(hex).multiplyScalar(f).getHex();
const pick = (arr, v) => arr[v % arr.length];

// ---------- homes, one look per level ----------
const HOMES = [
  (k, v) => { // tent
    k.cone(0.3, 0.42, 0, 0, 0, pick([C.hide, 0xc4a070, 0xd8ba8c], v), 6); k.box(0.1, 0.16, 0.04, 0, 0, 0.24, C.dark);
    k.cyl(0.012, 0.5, 0, 0, 0, C.wood2, 4); k.cyl(0.06, 0.03, 0.3, 0, 0.28, C.stone2, 6); k.cone(0.035, 0.07, 0.3, 0.03, 0.28, C.fire, 5);
  },
  (k, v) => { // roundhouse
    k.cyl(0.3, 0.2, 0, 0, 0, pick([C.mud, 0xcfa47a, 0xd9b792], v), 10); k.cone(0.4, 0.38, 0, 0.2, 0, pick([C.thatch, C.thatch2, 0xbf9a4a], v), 10);
    k.box(0.1, 0.16, 0.04, 0, 0, 0.3, C.dark); k.cyl(0.05, 0.1, -0.33, 0, 0.25, C.log, 6);
  },
  (k, v) => { // mudbrick house
    const w = pick([C.mud, 0xe0bd95, C.mud2], v);
    k.box(0.62, 0.34, 0.5, -0.04, 0, 0, w); k.box(0.66, 0.04, 0.54, -0.04, 0.34, 0, shade(w, 0.9));
    k.box(0.3, 0.26, 0.3, 0.1, 0.38, -0.08, shade(w, 1.04)); k.box(0.34, 0.03, 0.34, 0.1, 0.64, -0.08, shade(w, 0.9));
    k.box(0.1, 0.18, 0.02, -0.1, 0, 0.26, C.dark); k.win(0.14, 0.16, 0.26); k.win(0.1, 0.46, 0.08);
    k.box(0.26, 0.02, 0.14, -0.1, 0.22, 0.33, pick([C.red, C.blue, C.yellow], v), 0); k.cyl(0.05, 0.08, -0.3, 0.38, 0.14, C.terra, 6);
  },
  (k, v) => { // villa
    const r = pick([C.terra, C.terra2, 0xd0704a], v);
    k.box(0.72, 0.3, 0.56, 0, 0, -0.04, C.marble); k.pyr(0.82, 0.2, 0.66, 0, 0.3, -0.04, r);
    k.box(0.5, 0.03, 0.14, 0, 0, 0.3, C.marble2);
    for (const x of [-0.22, -0.07, 0.07, 0.22]) k.cyl(0.022, 0.26, x, 0.03, 0.33, C.white, 6);
    k.box(0.54, 0.04, 0.16, 0, 0.29, 0.31, r);
    k.box(0.1, 0.18, 0.02, 0, 0.03, 0.245, C.wood2); k.win(-0.24, 0.12, 0.245); k.win(0.24, 0.12, 0.245);
  },
  (k, v) => { // timber house
    const roof = pick([C.slate, 0x9b4a34, 0x6b5a48], v);
    k.box(0.56, 0.26, 0.5, 0, 0, 0, C.stone); k.box(0.64, 0.26, 0.56, 0, 0.26, 0, C.plaster);
    for (const x of [-0.3, 0, 0.3]) k.box(0.03, 0.26, 0.58, x, 0.26, 0, C.beam);
    k.box(0.66, 0.03, 0.58, 0, 0.26, 0, C.beam); k.box(0.66, 0.03, 0.58, 0, 0.5, 0, C.beam);
    k.gable(0.7, 0.36, 0.64, 0, 0.52, 0, roof, true);
    k.box(0.1, 0.18, 0.02, 0, 0, 0.255, C.wood2); k.win(-0.16, 0.34, 0.285); k.win(0.16, 0.34, 0.285);
    k.box(0.09, 0.3, 0.09, 0.2, 0.6, -0.12, C.stone2);
  },
  (k, v) => { // townhouse
    const w = pick([C.ochre, C.rose, 0xd9d2a6, 0xc9d3c0], v), sh = pick([C.blue, C.green, C.red], v);
    k.box(0.6, 0.72, 0.56, 0, 0, 0, w); k.box(0.64, 0.03, 0.6, 0, 0.24, 0, C.marble2); k.box(0.66, 0.04, 0.62, 0, 0.72, 0, C.marble2);
    k.pyr(0.7, 0.26, 0.66, 0, 0.76, 0, C.terra2);
    for (const y of [0.32, 0.52]) for (const x of [-0.18, 0, 0.18]) { k.win(x, y, 0.285); k.box(0.025, 0.11, 0.02, x - 0.06, y, 0.285, sh); k.box(0.025, 0.11, 0.02, x + 0.06, y, 0.285, sh); }
    k.box(0.12, 0.19, 0.02, 0, 0, 0.285, C.wood2); k.win(-0.19, 0.08, 0.285, false, C.dark, 0.1, 0.12); k.win(0.19, 0.08, 0.285, false, C.dark, 0.1, 0.12);
    k.box(0.08, 0.2, 0.08, -0.18, 0.86, -0.1, C.brick2); k.box(0.1, 0.1, 0.02, 0, 0.82, 0.3, w); k.gable(0.14, 0.07, 0.04, 0, 0.92, 0.3, C.terra2, true);
  },
  (k, v) => { // brick terrace
    const b = pick([C.brick, C.brick2, 0xb86a4a], v);
    k.box(0.84, 0.66, 0.56, 0, 0, 0, b); k.gable(0.88, 0.24, 0.6, 0, 0.66, 0, C.slate2);
    k.box(0.86, 0.03, 0.58, 0, 0.3, 0, C.sand);
    for (const x of [-0.21, 0.21]) {
      k.box(0.2, 0.3, 0.07, x, 0, 0.3, shade(b, 1.08)); k.box(0.22, 0.03, 0.09, x, 0.3, 0.3, C.sand);
      k.win(x, 0.1, 0.34, false, C.glass, 0.12, 0.13); k.win(x - 0.07, 0.42, 0.285, false, C.glass); k.win(x + 0.07, 0.42, 0.285, false, C.glass);
      k.box(0.07, 0.24, 0.07, x * 1.7, 0.76, 0, C.brick2); k.cyl(0.02, 0.05, x * 1.7, 1.0, 0, C.terra, 5);
    }
    k.box(0.09, 0.19, 0.02, -0.04, 0, 0.285, C.green); k.box(0.09, 0.19, 0.02, 0.04, 0, 0.285, C.blue); k.box(0.24, 0.03, 0.08, 0, 0, 0.32, C.stone);
  },
];

// ---------- everything else ----------
const M = {
  forager(k) {
    k.box(0.44, 0.2, 0.36, -0.06, 0, -0.04, C.wood); k.gable(0.52, 0.24, 0.46, -0.06, 0.2, -0.04, C.thatch, true);
    k.box(0.1, 0.14, 0.02, -0.06, 0, 0.145, C.dark);
    for (const [x, z, c] of [[0.3, 0.2, C.red], [0.2, 0.32, C.purple], [0.34, 0.34, 0xd9703c]]) { k.cyl(0.055, 0.06, x, 0, z, C.thatch2, 6); k.ball(0.04, x, 0.07, z, c); }
    k.cyl(0.012, 0.3, 0.26, 0, -0.26, C.wood2, 4); k.cyl(0.012, 0.3, 0.38, 0, -0.1, C.wood2, 4); k.box(0.02, 0.02, 0.22, 0.32, 0.28, -0.18, C.wood2, 0.65);
  },
  fisher(k) {
    for (const [x, z] of [[-0.2, -0.16], [0.14, -0.16], [-0.2, 0.12], [0.14, 0.12]]) k.cyl(0.02, 0.14, x, 0, z, C.wood2, 4);
    k.box(0.46, 0.04, 0.4, -0.03, 0.12, -0.02, C.log); k.box(0.36, 0.2, 0.3, -0.05, 0.16, -0.04, C.wood); k.gable(0.44, 0.2, 0.38, -0.05, 0.36, -0.04, C.thatch2, true);
    k.box(0.3, 0.06, 0.12, 0.2, 0, 0.34, C.wood2, 0.4); k.box(0.22, 0.02, 0.06, 0.2, 0.06, 0.34, C.log, 0.4);
    k.cyl(0.012, 0.34, 0.36, 0, -0.2, C.wood2, 4); k.cyl(0.012, 0.34, 0.36, 0, 0.02, C.wood2, 4); k.box(0.02, 0.02, 0.24, 0.36, 0.32, -0.09, C.wood2);
    for (const z of [-0.16, -0.09, -0.02]) k.box(0.015, 0.09, 0.03, 0.36, 0.22, z, 0x9fb7c4);
  },
  woodcutter(k) {
    for (const [x, z] of [[-0.3, -0.24], [0.1, -0.24], [-0.3, 0.06], [0.1, 0.06]]) k.cyl(0.02, 0.26, x, 0, z, C.wood2, 4);
    k.gable(0.52, 0.16, 0.42, -0.1, 0.26, -0.09, C.thatch, true);
    for (let i = 0; i < 3; i++) k.hcyl(0.05, 0.34, -0.1, 0.05, -0.2 + i * 0.1, C.log, false, 6);
    for (let i = 0; i < 2; i++) k.hcyl(0.05, 0.34, -0.1, 0.14, -0.15 + i * 0.1, shade(C.log, 0.92), false, 6);
    k.cyl(0.08, 0.1, 0.28, 0, 0.26, C.wood, 7); k.box(0.02, 0.16, 0.02, 0.3, 0.1, 0.26, C.wood2, 0, ); k.box(0.07, 0.04, 0.015, 0.3, 0.22, 0.26, C.iron);
    k.hcyl(0.04, 0.2, 0.05, 0.04, 0.34, C.log, false, 6);
  },
  stonecutter(k) {
    k.box(0.36, 0.2, 0.3, -0.16, 0, -0.14, C.wood); k.box(0.42, 0.03, 0.38, -0.16, 0.2, -0.14, C.thatch2, 0); k.gable(0.42, 0.12, 0.38, -0.16, 0.22, -0.14, C.thatch, true);
    k.box(0.16, 0.12, 0.14, 0.24, 0, 0.2, C.stone); k.box(0.14, 0.1, 0.12, 0.1, 0, 0.3, C.stone2); k.box(0.12, 0.1, 0.12, 0.22, 0.12, 0.22, shade(C.stone, 1.06));
    k.ball(0.14, 0.26, 0.08, -0.2, C.stone2, 0.8); k.ball(0.08, -0.34, 0.05, 0.3, C.stone);
    k.box(0.02, 0.2, 0.02, -0.02, 0, 0.3, C.wood2); k.box(0.1, 0.03, 0.03, -0.02, 0.2, 0.3, C.iron);
  },
  storyteller(k) {
    k.cyl(0.11, 0.03, 0, 0, 0, C.stone2, 8); k.cone(0.07, 0.16, 0, 0.03, 0, C.fire, 6); k.cone(0.04, 0.1, 0.02, 0.05, 0.02, 0xffc94a, 5);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; k.cyl(0.05, 0.07, Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32, i % 2 ? C.log : C.wood, 6); }
    k.cyl(0.035, 0.5, -0.36, 0, -0.34, C.wood2, 6); k.box(0.12, 0.08, 0.05, -0.36, 0.34, -0.34, C.red); k.box(0.1, 0.06, 0.05, -0.36, 0.44, -0.34, C.yellow);
    k.cone(0.05, 0.08, -0.36, 0.5, -0.34, C.blue, 5);
  },
  well(k) {
    k.cyl(0.17, 0.14, 0, 0, 0, C.stone, 9); k.cyl(0.12, 0.02, 0, 0.125, 0, C.water, 9);
    k.cyl(0.018, 0.34, -0.17, 0, 0, C.wood2, 4); k.cyl(0.018, 0.34, 0.17, 0, 0, C.wood2, 4);
    k.gable(0.46, 0.12, 0.26, 0, 0.34, 0, C.thatch, false); k.hcyl(0.02, 0.34, 0, 0.3, 0, C.wood, false, 5); k.cyl(0.035, 0.05, 0.05, 0.17, 0, C.log, 6);
  },
  storehouse(k) {
    for (const [x, z] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) k.cyl(0.035, 0.1, x, 0, z, C.stone2, 5);
    k.box(0.62, 0.26, 0.52, 0, 0.1, 0, C.wood); k.gable(0.7, 0.26, 0.6, 0, 0.36, 0, C.thatch2, true);
    k.box(0.14, 0.18, 0.02, 0, 0.1, 0.265, C.dark); k.box(0.12, 0.1, 0.1, 0.36, 0, 0.3, C.log); k.cyl(0.05, 0.1, -0.36, 0, 0.3, C.wood2, 7);
  },
  warehouse(k) {
    k.box(0.72, 0.3, 0.6, 0, 0, 0, C.stone); k.box(0.76, 0.34, 0.64, 0, 0.3, 0, C.plaster);
    for (const x of [-0.37, -0.12, 0.12, 0.37]) k.box(0.03, 0.34, 0.66, x, 0.3, 0, C.beam);
    k.gable(0.82, 0.34, 0.7, 0, 0.64, 0, 0x9b4a34, true);
    k.box(0.16, 0.2, 0.02, 0, 0, 0.305, C.wood2); k.box(0.12, 0.12, 0.02, 0, 0.42, 0.325, C.wood2); k.box(0.03, 0.03, 0.2, 0, 0.84, 0.4, C.beam); k.box(0.07, 0.07, 0.07, 0, 0.66, 0.46, C.log);
    k.cyl(0.06, 0.12, 0.42, 0, 0.36, C.wood, 7); k.box(0.12, 0.1, 0.1, -0.42, 0, 0.36, C.log);
  },
  standingstone(k) {
    k.box(0.16, 0.62, 0.1, 0, 0, 0, C.stone, 0.2); k.box(0.12, 0.08, 0.08, 0, 0.6, 0, C.stone2, 0.2);
    k.box(0.1, 0.22, 0.08, -0.28, 0, 0.14, C.stone2, -0.4); k.box(0.09, 0.16, 0.08, 0.26, 0, 0.2, C.stone, 0.6);
    for (const [x, z, c] of [[0.1, 0.3, C.yellow], [-0.08, 0.34, C.white], [-0.3, -0.2, C.red], [0.32, -0.16, C.purple]]) k.ball(0.03, x, 0.04, z, c);
  },
  farmstead(k) {
    k.box(0.5, 0.26, 0.4, -0.1, 0, -0.08, C.wood); k.gable(0.58, 0.28, 0.48, -0.1, 0.26, -0.08, C.thatch, true);
    k.box(0.16, 0.18, 0.02, -0.1, 0, 0.125, C.dark); k.box(0.1, 0.08, 0.02, -0.1, 0.34, 0.165, C.dark);
    k.cyl(0.1, 0.12, 0.3, 0, 0.22, C.yellow, 7); k.cone(0.11, 0.1, 0.3, 0.12, 0.22, shade(C.yellow, 0.9), 7);
    k.cyl(0.07, 0.08, 0.34, 0, -0.1, C.yellow, 7); k.cone(0.08, 0.07, 0.34, 0.08, -0.1, shade(C.yellow, 0.9), 7);
    for (const x of [-0.4, -0.25, -0.1, 0.05]) k.box(0.015, 0.1, 0.015, x, 0, 0.4, C.wood2); k.box(0.5, 0.015, 0.015, -0.17, 0.07, 0.4, C.wood2);
  },
  granary(k) {
    k.cyl(0.2, 0.44, -0.16, 0, 0, C.mud, 9); k.cone(0.24, 0.2, -0.16, 0.44, 0, C.thatch, 9);
    k.cyl(0.16, 0.34, 0.22, 0, 0.1, C.mud2, 9); k.cone(0.2, 0.17, 0.22, 0.34, 0.1, C.thatch2, 9);
    k.box(0.07, 0.1, 0.02, -0.16, 0.06, 0.2, C.dark); k.box(0.02, 0.3, 0.02, 0.02, 0, 0.16, C.wood2, 0, ); k.cyl(0.05, 0.08, 0.2, 0, -0.3, C.terra, 6);
  },
  windmill(k) {
    k.cyl(0.24, 0.62, 0, 0, 0, C.plaster, 8, 0.15); k.cone(0.2, 0.2, 0, 0.62, 0, 0x9b4a34, 8);
    k.box(0.1, 0.16, 0.02, 0, 0, 0.235, C.wood2); k.win(0, 0.36, 0.19);
    k.cyl(0.03, 0.1, 0, 0.6, 0.2, C.beam, 5); k.hcyl(0.025, 0.14, 0, 0.62, 0.22, C.beam, true, 5);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.5; k.add(new THREE.BoxGeometry(0.1, 0.44, 0.012), C.white, Math.sin(a) * 0.25, 0.62 + Math.cos(a) * 0.25, 0.29, 0, 0, -a); k.add(new THREE.BoxGeometry(0.02, 0.5, 0.02), C.beam, Math.sin(a) * 0.25, 0.62 + Math.cos(a) * 0.25, 0.28, 0, 0, -a); }
  },
  kiln(k) {
    k.dome(0.24, -0.08, 0, 0, C.brick, 8, 1.15); k.cyl(0.07, 0.3, -0.08, 0.2, 0, C.brick2, 6, 0.05); k.box(0.12, 0.1, 0.06, -0.08, 0, 0.22, C.dark); k.box(0.08, 0.05, 0.04, -0.08, 0.01, 0.24, C.fire);
    for (let i = 0; i < 3; i++) k.box(0.16, 0.05, 0.1, 0.3, i * 0.05, 0.18 - i * 0.01, i % 2 ? C.brick : C.brick2);
    k.box(0.16, 0.05, 0.1, 0.3, 0, -0.1, C.mud2); k.box(0.3, 0.02, 0.2, 0.26, 0, -0.32, C.mud);
  },
  mine(k) {
    k.ball(0.36, -0.1, 0.04, -0.14, C.stone2, 0.8); k.box(0.26, 0.24, 0.1, -0.1, 0, 0.14, C.dark);
    k.box(0.04, 0.3, 0.04, -0.25, 0, 0.2, C.wood); k.box(0.04, 0.3, 0.04, 0.05, 0, 0.2, C.wood); k.box(0.38, 0.04, 0.06, -0.1, 0.28, 0.2, C.wood);
    k.box(0.16, 0.08, 0.12, 0.26, 0.04, 0.3, C.wood2); k.cyl(0.03, 0.03, 0.2, 0, 0.3, C.iron, 6); k.cyl(0.03, 0.03, 0.32, 0, 0.3, C.iron, 6); k.ball(0.06, 0.26, 0.14, 0.3, 0xc98c4a, 0.7);
    k.ball(0.07, 0.34, 0.04, -0.1, 0xc98c4a); k.ball(0.05, 0.4, 0.03, 0.04, C.stone);
  },
  smithy(k) {
    k.box(0.5, 0.28, 0.44, -0.06, 0, -0.04, C.stone); k.gable(0.58, 0.22, 0.52, -0.06, 0.28, -0.04, C.terra2, true);
    k.box(0.14, 0.5, 0.14, 0.12, 0.2, -0.16, C.stone2); k.box(0.16, 0.14, 0.02, -0.12, 0, 0.185, C.dark); k.box(0.1, 0.07, 0.02, -0.12, 0.02, 0.19, C.fire);
    k.box(0.1, 0.06, 0.06, 0.32, 0.08, 0.24, C.iron); k.box(0.05, 0.08, 0.05, 0.32, 0, 0.24, C.wood2); k.cyl(0.05, 0.1, 0.3, 0, -0.02, C.wood, 7);
  },
  weaver(k) {
    k.box(0.44, 0.24, 0.38, -0.12, 0, -0.1, C.mud); k.gable(0.52, 0.22, 0.46, -0.12, 0.24, -0.1, C.thatch, true); k.box(0.09, 0.15, 0.02, -0.12, 0, 0.095, C.dark);
    k.box(0.02, 0.26, 0.02, 0.2, 0, 0.1, C.wood2); k.box(0.02, 0.26, 0.02, 0.4, 0, 0.1, C.wood2); k.box(0.22, 0.02, 0.02, 0.3, 0.24, 0.1, C.wood2); k.box(0.18, 0.16, 0.012, 0.3, 0.07, 0.1, C.purple);
    for (const [x, z] of [[0.24, 0.34], [-0.3, 0.34], [0.36, -0.26]]) { k.ball(0.07, x, 0.09, z, C.wool, 0.85); k.ball(0.035, x + 0.07, 0.11, z, C.dark); }
  },
  tradingpost(k) {
    k.box(0.44, 0.26, 0.36, -0.14, 0, -0.14, C.wood); k.gable(0.52, 0.2, 0.44, -0.14, 0.26, -0.14, C.terra, true); k.box(0.1, 0.16, 0.02, -0.14, 0, 0.045, C.dark);
    k.box(0.9, 0.05, 0.22, 0, 0.02, 0.34, C.log); for (const x of [-0.4, 0, 0.4]) k.cyl(0.025, 0.12, x, 0, 0.44, C.wood2, 5);
    k.box(0.12, 0.1, 0.1, 0.24, 0.07, 0.32, C.wood2); k.box(0.1, 0.08, 0.1, 0.36, 0.07, 0.36, C.log); k.cyl(0.045, 0.1, 0.1, 0.07, 0.34, C.wood, 7);
    k.cyl(0.012, 0.5, 0.3, 0, -0.2, C.wood2, 4); k.box(0.16, 0.1, 0.01, 0.38, 0.38, -0.2, C.yellow);
  },
  guildhall(k) {
    k.box(0.7, 0.3, 0.54, 0, 0, 0, C.stone); k.box(0.74, 0.22, 0.58, 0, 0.3, 0, C.plaster);
    for (const x of [-0.36, -0.12, 0.12, 0.36]) k.box(0.03, 0.22, 0.6, x, 0.3, 0, C.beam);
    k.gable(0.8, 0.4, 0.64, 0, 0.52, 0, C.slate, false);
    k.box(0.14, 0.2, 0.02, 0, 0, 0.275, C.wood2); for (const x of [-0.24, 0.24]) k.win(x, 0.36, 0.295, false, C.yellow, 0.1, 0.1);
    k.box(0.14, 0.34, 0.14, 0.26, 0.6, -0.1, C.plaster); k.pyr(0.18, 0.2, 0.18, 0.26, 0.94, -0.1, C.slate2);
    k.cyl(0.01, 0.3, -0.3, 0.3, 0.32, C.wood2, 4); k.box(0.12, 0.16, 0.01, -0.3, 0.4, 0.38, C.red); k.cyl(0.01, 0.3, 0.3, 0.3, 0.32, C.wood2, 4); k.box(0.12, 0.16, 0.01, 0.3, 0.4, 0.38, C.blue);
  },
  papermill(k) {
    k.box(0.5, 0.3, 0.44, -0.1, 0, -0.06, C.stone); k.box(0.54, 0.16, 0.48, -0.1, 0.3, -0.06, C.plaster); k.gable(0.6, 0.28, 0.54, -0.1, 0.46, -0.06, 0x9b4a34, true);
    k.add(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 10), C.wood2, 0.26, 0.2, 0.1, 0, 0, Math.PI / 2);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI; k.add(new THREE.BoxGeometry(0.02, 0.56, 0.1), C.wood, 0.26, 0.2, 0.1, 0, a, 0); }
    k.box(0.1, 0.16, 0.02, -0.14, 0, 0.165, C.wood2); k.box(0.14, 0.06, 0.1, -0.36, 0, 0.3, C.white); k.box(0.14, 0.03, 0.1, -0.36, 0.06, 0.3, C.sand);
  },
  glassworks(k) {
    k.box(0.52, 0.3, 0.46, -0.1, 0, 0, C.brick); k.gable(0.58, 0.2, 0.52, -0.1, 0.3, 0, C.terra2, true);
    k.cone(0.2, 0.7, 0.24, 0, -0.16, C.brick2, 9); k.cyl(0.05, 0.1, 0.24, 0.62, -0.16, C.dark, 6);
    k.box(0.12, 0.16, 0.02, -0.1, 0, 0.235, C.dark); k.box(0.08, 0.06, 0.02, -0.1, 0.02, 0.24, C.fire);
    for (const [x, z] of [[0.24, 0.3], [0.34, 0.24], [0.14, 0.36]]) k.ball(0.04, x, 0.05, z, C.glass, 1.3); k.win(-0.26, 0.14, 0.235, false, C.glass, 0.1, 0.1);
  },
  coalmine(k) {
    k.box(0.36, 0.22, 0.3, -0.2, 0, -0.16, C.brick2); k.gable(0.42, 0.14, 0.36, -0.2, 0.22, -0.16, C.slate2, true);
    for (const [x, z] of [[0.04, 0.02], [0.32, 0.02], [0.04, 0.3], [0.32, 0.3]]) k.add(new THREE.BoxGeometry(0.03, 0.72, 0.03), C.iron, x + (x < 0.18 ? 0.05 : -0.05), 0.35, z + (z < 0.16 ? 0.05 : -0.05), 0, z < 0.16 ? 0.14 : -0.14, x < 0.18 ? -0.14 : 0.14);
    k.box(0.2, 0.03, 0.2, 0.18, 0.66, 0.16, C.iron); k.add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10), C.wood2, 0.18, 0.78, 0.16, 0, 0, Math.PI / 2);
    k.cone(0.14, 0.14, -0.26, 0, 0.26, C.coal, 7); k.cone(0.1, 0.1, -0.08, 0, 0.36, C.coal, 7); k.box(0.14, 0.08, 0.1, 0.18, 0, 0.16, C.dark);
  },
  steelworks(k) {
    k.box(1.2, 0.5, 0.8, -0.2, 0, 0.2, C.brick); k.gable(1.26, 0.26, 0.86, -0.2, 0.5, 0.2, C.slate2, false);
    for (const x of [-0.6, -0.3, 0, 0.3]) k.win(x, 0.24, 0.605, false, C.fire, 0.14, 0.2);
    k.cyl(0.26, 0.9, 0.62, 0, -0.5, C.iron, 10, 0.18); k.cyl(0.2, 0.06, 0.62, 0.9, -0.5, C.fire, 10);
    k.cyl(0.09, 1.3, -0.6, 0, -0.56, C.brick2, 8, 0.06); k.cyl(0.09, 1.1, -0.2, 0, -0.56, C.brick2, 8, 0.06);
    k.box(0.5, 0.08, 0.3, 0.2, 0, -0.5, C.dark); k.box(0.3, 0.16, 0.24, 0.66, 0, 0.3, C.iron); k.cone(0.16, 0.14, 0.7, 0, 0.72, C.coal, 7);
  },
  factory(k) {
    k.box(1.5, 0.46, 1.0, 0, 0, 0.1, C.brick);
    for (let i = 0; i < 4; i++) { const x = -0.56 + i * 0.375; const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(-0.5, 1); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); k.add(g, C.slate, x, 0.46, 0.1, 0, 0, 0, 0.375, 0.22, 1.0); k.box(0.02, 0.2, 0.96, x - 0.18, 0.46, 0.1, C.glass); }
    for (const x of [-0.5, -0.17, 0.17, 0.5]) k.win(x, 0.2, 0.605, false, C.glass, 0.16, 0.18);
    k.cyl(0.1, 1.3, 0.5, 0, -0.6, C.brick2, 8, 0.065); k.box(0.3, 0.26, 0.24, 0.1, 0, -0.56, C.brick2); k.box(0.2, 0.22, 0.02, -0.4, 0, 0.605, C.wood2);
  },
  station(k) {
    k.box(1.3, 0.44, 0.56, 0, 0, -0.4, C.brick); k.gable(1.36, 0.22, 0.62, 0, 0.44, -0.4, C.slate2, false);
    k.box(0.36, 0.7, 0.6, 0, 0, -0.4, shade(C.brick, 1.06)); k.gable(0.4, 0.2, 0.64, 0, 0.7, -0.4, C.slate2, true); k.cyl(0.09, 0.02, 0, 0.56, -0.09, C.white, 10); k.add(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10), C.white, 0, 0.56, -0.09, 0, Math.PI / 2, 0);
    for (const x of [-0.46, -0.26, 0.26, 0.46]) k.win(x, 0.18, -0.115, false, C.glass, 0.1, 0.16);
    k.box(1.7, 0.06, 0.4, 0, 0, 0.1, C.stone); for (const x of [-0.7, -0.24, 0.24, 0.7]) k.cyl(0.02, 0.34, x, 0.06, 0.22, C.iron, 5); k.box(1.7, 0.03, 0.44, 0, 0.4, 0.1, C.slate);
    k.box(1.9, 0.02, 0.03, 0, 0, 0.5, C.iron); k.box(1.9, 0.02, 0.03, 0, 0, 0.7, C.iron); for (let i = 0; i < 9; i++) k.box(0.05, 0.015, 0.3, -0.8 + i * 0.2, 0, 0.6, C.wood2);
    k.hcyl(0.1, 0.34, -0.3, 0.16, 0.6, C.green, false, 8); k.box(0.2, 0.22, 0.2, -0.02, 0.05, 0.6, C.green); k.cyl(0.035, 0.12, -0.42, 0.24, 0.6, C.dark, 6); k.box(0.34, 0.18, 0.2, 0.32, 0.05, 0.6, C.red);
    for (const x of [-0.4, -0.2, 0.0, 0.24, 0.42]) k.add(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8), C.dark, x, 0.05, 0.6, 0, Math.PI / 2, Math.PI / 2);
  },
  fountain(k) {
    k.cyl(0.3, 0.08, 0, 0, 0, C.marble, 10); k.cyl(0.25, 0.02, 0, 0.075, 0, C.water, 10); k.cyl(0.05, 0.3, 0, 0.08, 0, C.marble2, 6);
    k.cyl(0.13, 0.04, 0, 0.36, 0, C.marble, 8, 0.16); k.cyl(0.12, 0.01, 0, 0.4, 0, C.water, 8); k.ball(0.04, 0, 0.46, 0, C.marble);
    for (const [x, z] of [[-0.38, -0.38], [0.38, 0.38]]) k.box(0.14, 0.05, 0.06, x, 0, z, C.marble2, 0.78);
  },
  watertower(k) {
    k.cyl(0.2, 0.7, 0, 0, 0, C.brick, 8, 0.16); k.cyl(0.28, 0.3, 0, 0.7, 0, C.iron, 10); k.cone(0.3, 0.14, 0, 1.0, 0, C.slate2, 10);
    k.box(0.09, 0.16, 0.02, 0, 0, 0.2, C.wood2); k.win(0, 0.4, 0.175, false, C.glass); k.cyl(0.29, 0.03, 0, 0.82, 0, C.dark, 10);
  },
  market(k) {
    const cols = [C.red, C.yellow, C.blue];
    [[-0.26, -0.18], [0.26, -0.18], [0, 0.22]].forEach(([x, z], i) => {
      for (const [dx, dz] of [[-0.15, -0.11], [0.15, -0.11], [-0.15, 0.11], [0.15, 0.11]]) k.cyl(0.012, 0.26, x + dx, 0, z + dz, C.wood2, 4);
      k.gable(0.36, 0.1, 0.28, x, 0.26, z, cols[i], false); k.box(0.3, 0.1, 0.2, x, 0, z, C.log);
      k.ball(0.035, x - 0.08, 0.13, z, i === 0 ? C.yellow : C.red); k.ball(0.035, x + 0.02, 0.13, z, C.leaf); k.ball(0.035, x + 0.1, 0.13, z, 0xd9703c);
    });
    k.cyl(0.05, 0.1, 0.38, 0, 0.32, C.wood, 7); k.box(0.1, 0.08, 0.1, -0.38, 0, 0.3, C.wood2);
  },
  markethall(k) {
    for (const x of [-0.3, -0.1, 0.1, 0.3]) for (const z of [-0.22, 0.22]) k.box(0.06, 0.26, 0.06, x, 0, z, C.stone);
    k.box(0.76, 0.05, 0.6, 0, 0.26, 0, C.beam); k.box(0.72, 0.2, 0.56, 0, 0.31, 0, C.plaster);
    for (const x of [-0.35, -0.12, 0.12, 0.35]) k.box(0.03, 0.2, 0.58, x, 0.31, 0, C.beam);
    k.gable(0.8, 0.34, 0.64, 0, 0.51, 0, 0x9b4a34, false); k.box(0.1, 0.16, 0.1, 0, 0.78, 0, C.plaster); k.pyr(0.14, 0.14, 0.14, 0, 0.94, 0, C.slate);
    k.box(0.2, 0.08, 0.14, -0.14, 0, 0, C.log); k.box(0.2, 0.08, 0.14, 0.16, 0, 0.02, C.wood2); k.ball(0.035, -0.14, 0.11, 0, C.red); k.ball(0.035, 0.16, 0.11, 0.02, C.yellow);
  },
  bathhouse(k) {
    k.box(0.62, 0.26, 0.5, -0.06, 0, -0.06, C.marble2); k.dome(0.2, -0.2, 0.26, -0.06, C.terra, 8, 0.8); k.dome(0.16, 0.12, 0.26, -0.06, C.terra2, 8, 0.8);
    k.box(0.1, 0.17, 0.02, -0.06, 0, 0.195, C.dark); for (const x of [-0.14, 0.02]) k.cyl(0.02, 0.2, x, 0, 0.24, C.white, 6); k.box(0.24, 0.03, 0.08, -0.06, 0.2, 0.24, C.marble);
    k.box(0.22, 0.05, 0.3, 0.34, 0, 0.1, C.marble); k.box(0.17, 0.02, 0.25, 0.34, 0.045, 0.1, C.water);
    k.ball(0.04, 0.36, 0.05, -0.3, C.leaf); k.ball(0.04, 0.26, 0.05, -0.36, C.hedge);
  },
  clinic(k) {
    k.box(0.7, 0.5, 0.52, 0, 0, 0, C.white); k.pyr(0.78, 0.2, 0.6, 0, 0.5, 0, C.slate); k.box(0.72, 0.03, 0.54, 0, 0.24, 0, C.sand);
    for (const y of [0.08, 0.32]) for (const x of [-0.22, 0.22]) k.win(x, y, 0.265, false, C.glass, 0.12, 0.12);
    k.box(0.12, 0.19, 0.02, 0, 0, 0.265, C.wood2); k.box(0.2, 0.03, 0.12, 0, 0.2, 0.32, C.green);
    k.box(0.03, 0.1, 0.02, 0, 0.32, 0.265, C.green); k.box(0.1, 0.03, 0.02, 0, 0.355, 0.265, C.green);
    k.box(0.07, 0.16, 0.07, 0.2, 0.6, -0.1, C.brick2);
  },
  tavern(k) {
    k.box(0.6, 0.26, 0.5, 0, 0, 0, C.stone); k.box(0.66, 0.2, 0.56, 0, 0.26, 0, C.plaster);
    for (const x of [-0.32, 0, 0.32]) k.box(0.03, 0.2, 0.58, x, 0.26, 0, C.beam);
    k.gable(0.72, 0.32, 0.62, 0, 0.46, 0, C.thatch2, false); k.box(0.1, 0.36, 0.1, -0.22, 0.5, -0.1, C.stone2);
    k.box(0.11, 0.18, 0.02, 0, 0, 0.255, C.wood2); k.win(-0.18, 0.1, 0.255, false, C.yellow); k.win(0.18, 0.1, 0.255, false, C.yellow);
    k.box(0.02, 0.02, 0.14, 0.3, 0.3, 0.34, C.beam); k.box(0.1, 0.1, 0.015, 0.3, 0.19, 0.38, C.green);
    k.hcyl(0.055, 0.12, 0.38, 0.055, 0.2, C.wood, false, 7); k.cyl(0.05, 0.1, -0.4, 0, 0.3, C.wood, 7);
  },
  scribe(k) {
    k.box(0.56, 0.3, 0.46, 0, 0, -0.04, C.mud); k.box(0.6, 0.04, 0.5, 0, 0.3, -0.04, C.mud2); k.box(0.24, 0.14, 0.2, -0.12, 0.34, -0.1, C.mud);
    k.box(0.1, 0.17, 0.02, -0.12, 0, 0.195, C.dark); k.win(0.14, 0.14, 0.195); k.box(0.3, 0.02, 0.16, 0.1, 0.22, 0.27, C.blue);
    for (let i = 0; i < 3; i++) k.box(0.1, 0.02, 0.07, 0.3, i * 0.02, 0.34, i % 2 ? C.mud2 : C.terra);
    k.cyl(0.04, 0.08, -0.36, 0, 0.3, C.terra, 6);
  },
  academy(k) {
    k.box(1.6, 0.06, 1.6, 0, 0, 0, C.marble2); k.box(1.4, 0.34, 0.4, 0, 0.06, -0.5, C.marble); k.gable(1.46, 0.16, 0.46, 0, 0.4, -0.5, C.terra, false);
    k.box(0.36, 0.3, 0.9, -0.52, 0.06, 0.15, C.marble); k.box(0.36, 0.3, 0.9, 0.52, 0.06, 0.15, C.marble);
    k.box(0.42, 0.04, 0.96, -0.52, 0.36, 0.15, C.terra); k.box(0.42, 0.04, 0.96, 0.52, 0.36, 0.15, C.terra);
    for (let i = 0; i < 5; i++) { k.cyl(0.03, 0.3, -0.3, 0.06, -0.24 + i * 0.2, C.white, 6); k.cyl(0.03, 0.3, 0.3, 0.06, -0.24 + i * 0.2, C.white, 6); }
    for (let i = 0; i < 4; i++) k.cyl(0.03, 0.3, -0.18 + i * 0.12, 0.06, -0.27, C.white, 6);
    k.tree(0, 0.2, 1.5, C.leaf2); k.box(0.2, 0.05, 0.08, 0, 0.06, 0.5, C.marble);
  },
  school(k) {
    k.box(0.62, 0.3, 0.46, 0, 0, 0, C.plaster); k.gable(0.7, 0.26, 0.54, 0, 0.3, 0, 0x9b4a34, false);
    for (const x of [-0.32, 0.32]) k.box(0.03, 0.3, 0.48, x, 0, 0, C.beam); k.box(0.66, 0.03, 0.48, 0, 0.28, 0, C.beam);
    k.box(0.1, 0.18, 0.02, 0, 0, 0.235, C.wood2); k.win(-0.2, 0.12, 0.235, false, C.glass); k.win(0.2, 0.12, 0.235, false, C.glass);
    k.box(0.12, 0.14, 0.12, 0, 0.52, 0, C.plaster); k.pyr(0.18, 0.14, 0.18, 0, 0.66, 0, C.slate); k.ball(0.03, 0, 0.58, 0.07, C.gold);
    k.box(0.02, 0.1, 0.3, 0.42, 0, 0.2, C.wood2); k.box(0.3, 0.1, 0.02, 0.28, 0, 0.36, C.wood2);
  },
  press(k) {
    k.box(0.58, 0.44, 0.5, 0, 0, 0, C.ochre); k.box(0.62, 0.03, 0.54, 0, 0.22, 0, C.marble2); k.gable(0.64, 0.24, 0.56, 0, 0.44, 0, C.terra2, true);
    k.win(0, 0.08, 0.255, false, C.glass, 0.3, 0.12); k.box(0.1, 0.18, 0.02, -0.22, 0, 0.255, C.wood2); k.win(-0.14, 0.3, 0.255, false, C.glass); k.win(0.14, 0.3, 0.255, false, C.glass);
    k.box(0.14, 0.03, 0.1, 0.36, 0, 0.3, C.white); k.box(0.14, 0.03, 0.1, 0.36, 0.03, 0.3, C.sand); k.box(0.14, 0.03, 0.1, 0.36, 0.06, 0.3, C.white);
    k.box(0.02, 0.02, 0.12, 0.2, 0.3, 0.32, C.beam); k.box(0.1, 0.08, 0.015, 0.2, 0.21, 0.36, C.blue);
  },
  university(k) {
    k.box(1.7, 0.05, 1.7, 0, 0, 0, C.stone);
    k.box(1.5, 0.44, 0.34, 0, 0.05, -0.6, C.ochre); k.box(1.5, 0.44, 0.34, 0, 0.05, 0.6, C.ochre); k.box(0.34, 0.44, 0.9, -0.58, 0.05, 0, C.ochre); k.box(0.34, 0.44, 0.9, 0.58, 0.05, 0, C.ochre);
    k.gable(1.56, 0.2, 0.4, 0, 0.49, -0.6, C.terra2, false); k.gable(1.56, 0.2, 0.4, 0, 0.49, 0.6, C.terra2, false); k.gable(0.4, 0.2, 0.9, -0.58, 0.49, 0, C.terra2, true); k.gable(0.4, 0.2, 0.9, 0.58, 0.49, 0, C.terra2, true);
    k.box(0.36, 0.7, 0.36, 0, 0.05, 0.6, C.rose); k.dome(0.2, 0, 0.75, 0.6, C.copper, 8); k.ball(0.03, 0, 0.97, 0.6, C.gold);
    k.box(0.14, 0.24, 0.02, 0, 0.05, 0.785, C.dark);
    for (const x of [-0.5, -0.3, 0.3, 0.5]) k.win(x, 0.26, 0.775, false, C.glass, 0.09, 0.14);
    k.box(0.5, 0.02, 0.5, 0, 0.05, 0, C.leaf); k.tree(0, 0, 1.4, C.leaf2);
  },
  institute(k) {
    k.box(1.7, 0.08, 1.5, 0, 0, 0, C.stone); k.box(1.5, 0.5, 0.9, 0, 0.08, -0.2, C.marble2); k.box(1.56, 0.05, 0.96, 0, 0.58, -0.2, C.marble);
    k.box(0.6, 0.6, 0.3, 0, 0.08, 0.36, C.marble); k.gable(0.66, 0.16, 0.34, 0, 0.68, 0.36, C.marble2, true);
    for (const x of [-0.24, -0.08, 0.08, 0.24]) k.cyl(0.035, 0.52, x, 0.12, 0.56, C.white, 7);
    k.box(0.7, 0.04, 0.3, 0, 0.08, 0.62, C.marble2); k.cyl(0.26, 0.14, 0, 0.63, -0.2, C.marble, 10); k.dome(0.25, 0, 0.77, -0.2, C.copper, 10); k.ball(0.03, 0, 1.03, -0.2, C.gold);
    for (const x of [-0.6, -0.42, 0.42, 0.6]) k.win(x, 0.3, 0.255, false, C.glass, 0.09, 0.2);
    k.cyl(0.012, 0.3, -0.7, 0.08, 0.6, C.iron, 4); k.box(0.14, 0.09, 0.01, -0.62, 0.3, 0.6, C.blue);
  },
  shrine(k) {
    k.box(0.6, 0.06, 0.6, 0, 0, 0, C.mud2); k.box(0.46, 0.06, 0.46, 0, 0.06, 0, C.mud); k.box(0.3, 0.26, 0.26, 0, 0.12, -0.04, C.mud);
    k.box(0.36, 0.04, 0.32, 0, 0.38, -0.04, C.terra); k.box(0.1, 0.16, 0.02, 0, 0.12, 0.095, C.dark); k.box(0.12, 0.06, 0.08, 0, 0.12, 0.17, C.stone);
    for (const x of [-0.22, 0.22]) { k.cyl(0.035, 0.12, x, 0.06, 0.2, C.stone2, 6); k.cone(0.03, 0.07, x, 0.18, 0.2, C.fire, 5); }
    k.ball(0.03, -0.05, 0.2, 0.17, C.yellow); k.ball(0.03, 0.05, 0.2, 0.17, C.red);
  },
  temple(k) {
    k.box(1.7, 0.06, 1.3, 0, 0, 0, C.marble2); k.box(1.56, 0.06, 1.16, 0, 0.06, 0, C.marble); k.box(1.1, 0.5, 0.7, 0, 0.12, 0, C.marble2);
    for (let i = 0; i < 6; i++) { const x = -0.68 + i * 0.272; k.cyl(0.045, 0.5, x, 0.12, 0.48, C.white, 7); k.cyl(0.045, 0.5, x, 0.12, -0.48, C.white, 7); }
    for (const z of [-0.16, 0.16]) { k.cyl(0.045, 0.5, -0.68, 0.12, z, C.white, 7); k.cyl(0.045, 0.5, 0.68, 0.12, z, C.white, 7); }
    k.box(1.54, 0.07, 1.12, 0, 0.62, 0, C.marble); k.gable(1.58, 0.26, 1.16, 0, 0.69, 0, C.terra, false);
    k.box(0.16, 0.3, 0.02, 0.56, 0.12, 0, C.dark); k.box(0.3, 0.04, 0.5, 0.86, 0, 0, C.marble);
  },
  chapel(k) {
    k.box(0.4, 0.34, 0.6, 0.1, 0, 0, C.stone); k.gable(0.46, 0.3, 0.66, 0.1, 0.34, 0, C.slate, true);
    k.box(0.22, 0.72, 0.22, -0.22, 0, 0.16, C.stone2); k.pyr(0.26, 0.36, 0.26, -0.22, 0.72, 0.16, C.slate2); k.ball(0.025, -0.22, 1.1, 0.16, C.gold);
    k.win(-0.22, 0.52, 0.275, false, C.dark, 0.08, 0.12); k.box(0.1, 0.18, 0.02, 0.1, 0, 0.305, C.wood2); k.cyl(0.06, 0.02, 0.1, 0.4, 0.305, C.blue, 8); k.add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), C.blue, 0.1, 0.44, 0.305, 0, Math.PI / 2, 0);
    for (const z of [-0.16, 0.06]) k.win(0.305, 0.14, z, true, C.yellow, 0.07, 0.14);
  },
  garden(k) {
    k.box(0.84, 0.03, 0.84, 0, 0, 0, 0x7fbf5f);
    for (const [x, z, w, d] of [[0, -0.38, 0.84, 0.08], [0, 0.38, 0.3, 0.08], [-0.38, 0, 0.08, 0.7], [0.38, 0, 0.08, 0.7]]) k.box(w, 0.1, d, x, 0.02, z, C.hedge);
    const cols = [C.red, C.yellow, C.white, C.purple, 0xe88aa8];
    for (let i = 0; i < 9; i++) k.ball(0.035, -0.22 + (i % 3) * 0.2 + (i % 2) * 0.03, 0.06, -0.2 + Math.floor(i / 3) * 0.16, cols[i % 5]);
    k.tree(0.2, 0.18, 1.2); k.box(0.2, 0.05, 0.07, -0.16, 0.03, 0.26, C.wood);
  },
  statue(k) {
    k.box(0.36, 0.06, 0.36, 0, 0, 0, C.marble2); k.box(0.24, 0.26, 0.24, 0, 0.06, 0, C.marble);
    k.cyl(0.07, 0.3, 0, 0.32, 0, C.white, 7, 0.05); k.ball(0.055, 0, 0.67, 0, C.white); k.box(0.2, 0.03, 0.03, 0.04, 0.52, 0, C.white, 0, );
    k.ball(0.04, -0.3, 0.04, 0.3, C.red); k.ball(0.04, 0.3, 0.04, -0.3, C.yellow); k.ball(0.04, 0.3, 0.04, 0.3, C.leaf); k.ball(0.04, -0.3, 0.04, -0.3, C.leaf);
  },
  amphitheatre(k) {
    for (let i = 0; i < 5; i++) {
      const g = new THREE.CylinderGeometry(0.9 - i * 0.12, 0.9 - i * 0.12, 0.09 * (5 - i), 14, 1, false, Math.PI / 2, Math.PI);
      k.add(g, i % 2 ? C.marble : C.marble2, 0, 0.045 * (5 - i), 0.1);
    }
    k.box(1.0, 0.08, 0.36, 0, 0, 0.42, C.sand); k.box(1.1, 0.5, 0.1, 0, 0, 0.66, C.marble);
    for (const x of [-0.36, -0.12, 0.12, 0.36]) k.cyl(0.035, 0.42, x, 0.08, 0.58, C.white, 6);
    k.box(1.14, 0.05, 0.16, 0, 0.5, 0.64, C.terra);
  },
  theatre(k) {
    k.cyl(0.82, 0.56, 0, 0, 0, C.plaster, 12); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; k.box(0.04, 0.56, 0.04, Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8, C.beam); }
    k.cyl(0.84, 0.03, 0, 0.27, 0, C.beam, 12); k.cyl(0.88, 0.22, 0, 0.56, 0, C.thatch2, 12, 0.6); k.cyl(0.58, 0.03, 0, 0.74, 0, C.sand, 12);
    k.box(0.3, 0.5, 0.2, 0, 0, 0.82, C.plaster); k.gable(0.36, 0.14, 0.24, 0, 0.5, 0.82, C.thatch2, true); k.box(0.14, 0.24, 0.02, 0, 0, 0.925, C.dark);
    k.cyl(0.012, 0.5, 0, 0.6, -0.3, C.wood2, 4); k.box(0.2, 0.12, 0.01, 0.1, 0.96, -0.3, C.red);
  },
  botanic(k) {
    k.box(1.7, 0.03, 1.7, 0, 0, 0, 0x7fbf5f); k.box(1.1, 0.4, 0.66, 0, 0.03, -0.3, C.glass); k.hcyl(0.33, 1.1, 0, 0.43, -0.3, C.glass, false, 10, Math.PI);
    for (const x of [-0.55, -0.275, 0, 0.275, 0.55]) k.box(0.025, 0.42, 0.68, x, 0.03, -0.3, C.white);
    k.box(1.12, 0.025, 0.68, 0, 0.42, -0.3, C.white); k.box(1.12, 0.02, 0.03, 0, 0.75, -0.3, C.white); k.box(0.14, 0.24, 0.02, 0, 0.03, 0.035, C.white);
    k.tree(-0.6, 0.4, 1.5); k.tree(0.62, 0.5, 1.3, C.leaf2); k.pine(-0.2, 0.6, 1.4); k.tree(0.2, 0.36, 1.1, 0xe88aa8);
    for (let i = 0; i < 6; i++) k.ball(0.04, -0.7 + i * 0.28, 0.06, 0.74, [C.red, C.yellow, C.purple][i % 3]);
    k.ball(0.14, -0.2, 0.2, -0.3, C.leaf2); k.ball(0.14, 0.24, 0.22, -0.3, C.leaf);
  },
  park(k) {
    k.box(1.8, 0.03, 1.8, 0, 0, 0, 0x7fbf5f); k.cyl(0.34, 0.02, -0.4, 0.025, 0.4, C.water, 10);
    k.cyl(0.3, 0.06, 0.36, 0.03, -0.3, C.stone, 8); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; k.cyl(0.015, 0.3, 0.36 + Math.cos(a) * 0.26, 0.09, -0.3 + Math.sin(a) * 0.26, C.iron, 4); }
    k.cone(0.34, 0.18, 0.36, 0.39, -0.3, C.copper, 8); k.ball(0.03, 0.36, 0.59, -0.3, C.gold);
    for (const [x, z] of [[-0.74, -0.74], [0.74, 0.74], [-0.74, 0.0], [0.1, 0.74]]) { k.cyl(0.015, 0.36, x, 0.03, z, C.iron, 4); k.ball(0.045, x, 0.42, z, 0xffe9a6); }
    k.tree(-0.5, -0.5, 1.6); k.tree(0.7, 0.2, 1.3, C.leaf2); k.tree(-0.1, -0.74, 1.2); k.pine(0.72, -0.74, 1.4);
    k.box(0.22, 0.05, 0.07, -0.1, 0.03, 0.1, C.wood); k.box(1.8, 0.035, 0.12, 0, 0, -0.02, C.sand);
  },
};

// Wonders are built whole, then cut off at a height that rises with each stage.
const WONDERS = {
  stonecircle(k) {
    k.cyl(0.92, 0.04, 0, 0, 0, 0x93b86a, 16);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, x = Math.cos(a) * 0.72, z = Math.sin(a) * 0.72;
      k.box(0.16, 0.58 + (i % 3) * 0.05, 0.1, x, 0.03, z, i % 2 ? C.stone : C.stone2, -a + Math.PI / 2);
      if (i % 2 === 0) { const a2 = ((i + 0.5) / 10) * Math.PI * 2; k.box(0.5, 0.09, 0.12, Math.cos(a2) * 0.72, 0.66, Math.sin(a2) * 0.72, C.stone, -a2 + Math.PI / 2); }
    }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; k.box(0.14, 0.78, 0.1, Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32, C.stone2, -a + Math.PI / 2); }
    k.box(0.3, 0.1, 0.18, 0, 0.03, 0, C.stone);
  },
  gardens(k) {
    k.box(1.8, 0.3, 1.8, 0, 0, 0, C.mud); k.box(1.4, 0.3, 1.4, 0, 0.3, 0, C.mud2); k.box(1.0, 0.3, 1.0, 0, 0.6, 0, C.mud); k.box(0.56, 0.3, 0.56, 0, 0.9, 0, C.mud2);
    for (let t = 0; t < 4; t++) {
      const w = 0.9 - t * 0.2 - 0.07, y = 0.3 * (t + 1);
      for (let i = 0; i < 12 - t * 2; i++) { const s = i % 4, u = ((i >> 2) / Math.max(1, (12 - t * 2) / 4 - 0.01)) * 2 - 1; const x = s === 0 ? u * w : s === 1 ? w : s === 2 ? -u * w : -w, z = s === 0 ? w : s === 1 ? u * w : s === 2 ? -w : -u * w; k.ball(0.09, x, y + 0.06, z, [C.leaf, C.leaf2, C.hedge, 0x7fbf5f][i % 4], 0.9); if (i % 5 === 0) k.ball(0.04, x * 0.94, y + 0.14, z * 0.94, [C.red, C.yellow, 0xe88aa8][i % 3]); }
    }
    k.box(0.14, 1.2, 0.03, 0, 0, 0.92, C.water); k.pine(0, 0, 2.2); k.tree(0.16, 0.14, 1.6); k.tree(-0.16, -0.1, 1.5, C.leaf2);
    k.box(0.3, 0.06, 0.2, 0, 1.2, 0, 0x7fbf5f);
    for (const x of [-0.8, 0.8]) for (const z of [-0.8, 0.8]) k.cyl(0.05, 0.5, x, 0.3, z, C.marble, 6);
  },
  library(k) {
    k.box(1.9, 0.08, 1.7, 0, 0, 0, C.marble2); k.box(1.8, 0.08, 1.5, 0, 0.08, -0.05, C.marble); k.box(1.5, 0.7, 1.1, 0, 0.16, -0.15, C.marble2);
    for (let i = 0; i < 8; i++) k.cyl(0.05, 0.7, -0.77 + i * 0.22, 0.16, 0.52, C.white, 8);
    for (let i = 0; i < 4; i++) { k.cyl(0.05, 0.7, -0.84, 0.16, -0.6 + i * 0.3, C.white, 8); k.cyl(0.05, 0.7, 0.84, 0.16, -0.6 + i * 0.3, C.white, 8); }
    k.box(1.84, 0.1, 1.4, 0, 0.86, -0.08, C.marble); k.gable(1.88, 0.34, 1.44, 0, 0.96, -0.08, C.terra, false);
    k.box(0.9, 0.05, 0.3, 0, 0, 0.9, C.marble); k.box(0.24, 0.4, 0.02, 0, 0.16, 0.405, C.dark);
    for (const x of [-0.8, 0.8]) { k.box(0.1, 0.9, 0.1, x, 0, 0.84, C.sand); k.pyr(0.1, 0.14, 0.1, x, 0.9, 0.84, C.gold); }
    k.ball(0.06, 0, 1.32, -0.08, C.gold);
  },
  clocktower(k) {
    k.box(1.1, 0.5, 0.8, 0.3, 0, 0.2, C.stone); k.gable(1.16, 0.4, 0.86, 0.3, 0.5, 0.2, C.slate, false);
    for (const x of [0, 0.3, 0.6]) k.win(x, 0.2, 0.605, false, C.yellow, 0.1, 0.2);
    k.box(0.6, 1.9, 0.6, -0.5, 0, -0.4, C.stone2); k.box(0.7, 0.08, 0.7, -0.5, 1.2, -0.4, C.stone); k.box(0.68, 0.1, 0.68, -0.5, 1.9, -0.4, C.stone);
    for (const [dx, dz, ry] of [[0, 0.31, 0], [0.31, 0, Math.PI / 2], [0, -0.31, 0], [-0.31, 0, Math.PI / 2]]) {
      k.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12), C.white, -0.5 + dx, 1.56, -0.4 + dz, ry, Math.PI / 2, 0);
      k.add(new THREE.BoxGeometry(0.02, 0.15, 0.02), C.dark, -0.5 + dx * 1.04, 1.61, -0.4 + dz * 1.04, ry, 0, 0.5);
    }
    k.pyr(0.7, 0.7, 0.7, -0.5, 2.0, -0.4, C.slate2); k.ball(0.05, -0.5, 2.74, -0.4, C.gold);
    for (const [x, z] of [[-0.78, -0.68], [-0.22, -0.68], [-0.78, -0.12], [-0.22, -0.12]]) k.pyr(0.12, 0.26, 0.12, x, 2.0, z, C.slate);
    k.box(0.2, 0.34, 0.02, -0.5, 0, -0.095, C.wood2);
  },
  starhall(k) {
    k.cyl(0.95, 0.1, 0, 0, 0, C.stone, 8); k.cyl(0.8, 0.7, 0, 0.1, 0, C.ochre, 8); k.cyl(0.84, 0.08, 0, 0.8, 0, C.marble2, 8);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; k.win(Math.cos(a) * 0.76, 0.36, Math.sin(a) * 0.76, Math.abs(Math.cos(a)) > 0.7, C.glass, 0.12, 0.24); }
    k.dome(0.76, 0, 0.88, 0, C.copper, 12); k.box(0.16, 0.8, 0.9, 0, 0.9, 0.36, C.dark, 0); k.hcyl(0.07, 0.8, 0, 1.36, 0.5, C.gold, true, 8);
    k.box(0.5, 0.6, 0.4, 0, 0, 0.9, C.ochre); k.gable(0.56, 0.2, 0.44, 0, 0.6, 0.9, C.terra2, true); k.box(0.16, 0.3, 0.02, 0, 0, 1.105, C.dark);
    for (const x of [-0.8, 0.8]) { k.cyl(0.14, 0.9, x, 0, -0.5, C.rose, 8); k.cone(0.17, 0.3, x, 0.9, -0.5, C.copper, 8); }
  },
  pavilion(k) {
    k.box(2.8, 0.06, 2.4, 0, 0, 0, C.stone); k.box(2.6, 0.5, 1.0, 0, 0.06, 0, C.glass); k.hcyl(0.5, 2.6, 0, 0.56, 0, C.glass, false, 12, Math.PI);
    k.box(1.0, 0.7, 2.2, 0, 0.06, 0, C.glass); k.hcyl(0.5, 2.2, 0, 0.76, 0, C.glass, true, 12, Math.PI);
    for (let i = 0; i <= 8; i++) { const x = -1.3 + i * 0.325; k.box(0.03, 0.52, 1.03, x, 0.06, 0, C.white); }
    for (let i = 0; i <= 6; i++) { const z = -1.1 + i * 0.366; k.box(1.03, 0.72, 0.03, 0, 0.06, z, C.white); }
    k.box(2.62, 0.03, 1.04, 0, 0.55, 0, C.white); k.box(1.04, 0.03, 2.22, 0, 0.75, 0, C.white); k.box(2.62, 0.03, 0.04, 0, 1.06, 0, C.iron); k.box(0.04, 0.03, 2.22, 0, 1.26, 0, C.iron);
    k.dome(0.36, 0, 1.2, 0, C.glass, 10); k.ball(0.05, 0, 1.6, 0, C.gold);
    for (const [x, z, c] of [[-1.3, 0, C.red], [1.3, 0, C.blue], [0, 1.1, C.yellow], [0, -1.1, C.green]]) { k.cyl(0.015, 0.5, x, 0.9, z, C.iron, 4); k.box(0.2, 0.12, 0.01, x + 0.1, 1.28, z, c); }
    k.tree(-1.1, 0.9, 1.6); k.tree(1.1, 0.9, 1.6, C.leaf2); k.tree(-1.1, -0.9, 1.6, C.leaf2); k.tree(1.1, -0.9, 1.6);
    k.cyl(0.26, 0.06, 0.6, 0.06, 0.85, C.marble, 10); k.cyl(0.2, 0.02, 0.6, 0.11, 0.85, C.water, 10);
  },
};
const WONDER_HEIGHT = { stonecircle: 0.9, gardens: 1.7, library: 1.4, clocktower: 2.8, starhall: 1.7, pavilion: 1.7 };

const cache = new Map();

// key parts: type, level (homes), stage (wonders), variant
export function modelKey(b) {
  if (b.type === 'home') return `home:${b.lvl}:${b.id % 3}`;
  if (B[b.type].wonder) return `${b.type}:${b.stage}`;
  return b.type;
}

export function getGeometry(key) {
  if (cache.has(key)) return cache.get(key);
  const [type, a, v] = key.split(':');
  const k = new Kit();
  let clip = null;
  if (type === 'home') HOMES[+a](k, +v || 0);
  else if (WONDERS[type]) {
    WONDERS[type](k);
    const stages = B[type].stages.length, st = a === undefined ? stages : +a;
    if (st < stages) {
      clip = 0.12 + (WONDER_HEIGHT[type] - 0.12) * (st / stages) * 0.8;
      const half = B[type].size / 2 - 0.08;
      for (const [x, z] of [[-half, -half], [half, -half], [-half, half], [half, half]]) k.cyl(0.02, clip + 0.25, x, 0, z, C.wood2, 4);
      k.box(half * 2, 0.02, 0.03, 0, Math.max(0.1, clip - 0.02), half, C.wood); k.box(half * 2, 0.02, 0.03, 0, Math.max(0.1, clip - 0.02), -half, C.wood);
      k.box(0.16, 0.1, 0.14, half - 0.2, 0, half - 0.3, C.log); k.box(0.14, 0.1, 0.14, -half + 0.3, 0, half - 0.2, C.stone);
      clip += 0.3;
    }
  } else if (M[type]) M[type](k);
  else k.box(0.6, 0.4, 0.6, 0, 0, 0, C.stone);
  const g = k.build(clip);
  cache.set(key, g);
  return g;
}

export function disposeModels() { for (const g of cache.values()) g.dispose(); cache.clear(); thumbs.clear(); }

// Small rendered portraits of each building for the build bar.
const thumbs = new Map();
let thumbKit = null;
export function thumbnail(key, material) {
  if (thumbs.has(key)) return thumbs.get(key);
  if (!thumbKit) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 144;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f7a, 1.5));
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.2); sun.position.set(3, 5, 4); scene.add(sun);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    scene.add(mesh);
    thumbKit = { canvas, renderer, scene, cam, mesh };
  }
  const { canvas, renderer, scene, cam, mesh } = thumbKit;
  const g = getGeometry(key);
  g.computeBoundingBox();
  const bb = g.boundingBox, cy = (bb.max.y + bb.min.y) / 2;
  const span = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z, (bb.max.y - bb.min.y) * 1.1) * 0.74 + 0.08;
  cam.left = -span; cam.right = span; cam.top = span; cam.bottom = -span; cam.updateProjectionMatrix();
  cam.position.set(6, 5.2 + cy, 7); cam.lookAt(0, cy * 0.9, 0);
  mesh.geometry = g; mesh.material = material;
  renderer.render(scene, cam);
  const url = canvas.toDataURL('image/png');
  thumbs.set(key, url);
  return url;
}
export function disposeThumbs() {
  if (thumbKit) { thumbKit.renderer.dispose(); thumbKit.renderer.forceContextLoss?.(); thumbKit = null; }
  thumbs.clear();
}
