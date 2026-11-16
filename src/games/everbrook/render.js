// The 3D valley: terrain, seasons, trees, paths, fields, buildings, townsfolk, smoke and the camera.
import * as THREE from 'three';
import { B, DAYS_PER_YEAR } from './data.js';
import { N, T, idx, inb } from './gen.js';
import { terrAt } from './sim.js';
import { getGeometry, modelKey, disposeModels } from './models.js';

const HALF = N / 2;
const wx = (x) => x - HALF + 0.5;
const lerp = (a, b, t) => a + (b - a) * t;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const _e = new THREE.Euler();
const UP = new THREE.Vector3(0, 1, 0);

// Four-season palettes; the year phase blends between neighbours.
const SEASON = {
  grass: [0x8fd162, 0x79c04c, 0xb4b453, 0xe9eef0],
  fertile: [0x7cc956, 0x66b53f, 0xa3ad4a, 0xe2e9ec],
  floor: [0x74b452, 0x5fa240, 0x9c9a48, 0xdfe6e8],
  leaf: [0x6cc05a, 0x4f9e45, 0xd9862c, 0xcfdcd6],
  leaf2: [0x8ed06a, 0x5aa84a, 0xc9a227, 0xdbe4df],
  pine: [0x3f8f55, 0x37804b, 0x3c7a4a, 0x9fc0b0],
  sky: [0xc4e8f6, 0xaedff8, 0xf2dfc0, 0xdfe9f1],
  sun: [0xfff3da, 0xfff6e0, 0xffe2b8, 0xeaf1ff],
};
function seasonColor(key, phase, out) {
  const f = phase * 4, i = Math.floor(f) % 4, t = f - Math.floor(f);
  // Hold each season, then blend over its last third.
  const k = t < 0.66 ? 0 : (t - 0.66) / 0.34;
  return out.set(SEASON[key][i]).lerp(_c2.set(SEASON[key][(i + 1) % 4]), k * k * (3 - 2 * k));
}
const ROAD_COLORS = [0xb99a6c, 0xc4a678, 0xd2cab8, 0xa8a49c, 0xbdb6a8, 0x8f8e8c];

function hash(i, k = 0) { let h = (i * 374761393 + k * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

export function createView(stage) {
  const { scene, renderer } = stage;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);
  stage.setCamera(camera);
  scene.background = new THREE.Color(0xc4e8f6);

  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x9a8866, 1.5);
  const sun = new THREE.DirectionalLight(0xfff3da, 2.3);
  sun.position.set(-14, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 80;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0 });
  const plain = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.92, metalness: 0 });
  const root = new THREE.Group();
  scene.add(root);

  let s = null;                 // game state
  let phase = 0;

  // ----- terrain -----
  const topGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const tops = new THREE.InstancedMesh(topGeo, plain, N * N);
  tops.receiveShadow = true;
  const bodyGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0);
  const bodies = new THREE.InstancedMesh(bodyGeo, plain, N * N);
  bodies.receiveShadow = true; bodies.castShadow = true;
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x4fb0e0, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.86 });
  const water = new THREE.InstancedMesh(topGeo, waterMat, N * N);
  water.receiveShadow = true;
  root.add(bodies, tops, water);

  const topY = (i) => s.m.height[i];
  function buildTerrain() {
    let w = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y), h = topY(i), t = s.m.terr[i];
      _m.makeTranslation(wx(x), h, wx(y)); tops.setMatrixAt(i, _m);
      _m.compose(_p.set(wx(x), h - 0.002, wx(y)), _q.identity(), _s.set(1, h + 1.3, 1)); bodies.setMatrixAt(i, _m);
      const j = s.m.shade[i];
      if (t === T.HILL) _c.set(0x8f8a7e).multiplyScalar(0.86 + j * 0.2); else if (t === T.WATER) _c.set(0x6f8f8a); else _c.set(0x8a6e4c).multiplyScalar(0.9 + j * 0.2);
      bodies.setColorAt(i, _c);
      if (t === T.WATER) { _m.makeTranslation(wx(x), -0.06, wx(y)); water.setMatrixAt(w++, _m); }
    }
    water.count = w;
    tops.instanceMatrix.needsUpdate = true; bodies.instanceMatrix.needsUpdate = true; bodies.instanceColor.needsUpdate = true; water.instanceMatrix.needsUpdate = true;
    paintTerrain();
  }
  function paintTerrain() {
    const g = seasonColor('grass', phase, new THREE.Color()), f = seasonColor('fertile', phase, new THREE.Color()), fl = seasonColor('floor', phase, new THREE.Color());
    const snow = Math.max(0, Math.min(1, (phase - 0.74) / 0.06)) * Math.max(0, Math.min(1, (1 - phase) / 0.03 ));
    for (let i = 0; i < N * N; i++) {
      const t = terrAt(s, i), j = s.m.shade[i];
      if (t === T.WATER) _c.set(0xc9b98a).multiplyScalar(0.8 + j * 0.15);
      else if (t === T.HILL) { const h = s.m.height[i]; _c.set(0xa8a294).lerp(_c2.set(0xcfcac0), Math.min(1, h)).multiplyScalar(0.92 + j * 0.14); if (snow > 0) _c.lerp(_c2.set(0xf2f5f7), snow * 0.8); }
      else if (t === T.FOREST) _c.copy(fl).multiplyScalar(0.94 + j * 0.1);
      else _c.copy(s.m.distWater[i] <= 2 ? f : g).multiplyScalar(0.94 + j * 0.12);
      tops.setColorAt(i, _c);
    }
    tops.instanceColor.needsUpdate = true;
  }

  // ----- trees, bushes, rocks -----
  const MAX_TREES = N * N * 3;
  const trunkGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.22, 5).translate(0, 0.11, 0);
  const pineGeo = new THREE.ConeGeometry(0.2, 0.62, 6).translate(0, 0.46, 0);
  const roundGeo = new THREE.IcosahedronGeometry(0.22, 0).translate(0, 0.4, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, plain, MAX_TREES);
  const pines = new THREE.InstancedMesh(pineGeo, plain, MAX_TREES);
  const rounds = new THREE.InstancedMesh(roundGeo, plain, MAX_TREES);
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 0), plain, N * N * 2);
  for (const im of [trunks, pines, rounds, rocks]) { im.castShadow = true; im.receiveShadow = true; root.add(im); }
  let treeList = [];           // { kind, tint } aligned with instances, for seasonal recolouring
  function buildTrees() {
    let nt = 0, np = 0, nr = 0, nk = 0;
    const pinesL = [], roundsL = [];
    for (let i = 0; i < N * N; i++) {
      const x = i % N, y = (i / N) | 0, t = terrAt(s, i);
      const busy = s.d.occ[i] || s.road[i] || s.field[i];
      if (t === T.FOREST && !busy) {
        const count = 2 + (hash(i, 1) > 0.5 ? 1 : 0);
        for (let k = 0; k < count; k++) {
          const ox = (hash(i, 10 + k) - 0.5) * 0.7, oz = (hash(i, 20 + k) - 0.5) * 0.7, sc = 0.75 + hash(i, 30 + k) * 0.6;
          _m.compose(_p.set(wx(x) + ox, 0, wx(y) + oz), _q.setFromAxisAngle(UP, hash(i, 40 + k) * 6.28), _s.set(sc, sc, sc));
          trunks.setMatrixAt(nt++, _m);
          const pine = hash(i, 50 + k) < 0.42;
          if (pine) { pines.setMatrixAt(np++, _m); pinesL.push(hash(i, 60 + k)); } else { rounds.setMatrixAt(nr++, _m); roundsL.push(hash(i, 60 + k)); }
        }
      } else if (t === T.GRASS && !busy && hash(i, 2) < 0.035 && s.m.terr[i] === T.GRASS) {
        const sc = 0.55 + hash(i, 3) * 0.3;
        _m.compose(_p.set(wx(x) + (hash(i, 4) - 0.5) * 0.5, 0, wx(y) + (hash(i, 5) - 0.5) * 0.5), _q.identity(), _s.set(sc, sc, sc));
        trunks.setMatrixAt(nt++, _m); rounds.setMatrixAt(nr++, _m); roundsL.push(hash(i, 6));
      }
      if (t === T.HILL) {
        const h = s.m.height[i];
        const n = hash(i, 7) < 0.6 ? 1 : 2;
        for (let k = 0; k < n; k++) {
          const sc = 0.5 + hash(i, 70 + k) * 0.9;
          _m.compose(_p.set(wx(x) + (hash(i, 71 + k) - 0.5) * 0.6, h + 0.02, wx(y) + (hash(i, 72 + k) - 0.5) * 0.6), _q.setFromEuler(_e.set(hash(i, 73) * 3, hash(i, 74) * 3, 0)), _s.set(sc, sc * 0.7, sc));
          rocks.setMatrixAt(nk, _m);
          if (s.m.ore[i]) _c.set(k === 0 ? 0xd08a45 : 0xb9763a); else if (s.m.coal[i]) _c.set(k === 0 ? 0x34343a : 0x45454c); else _c.set(0x9a958a).multiplyScalar(0.85 + hash(i, 75 + k) * 0.3);
          rocks.setColorAt(nk++, _c);
        }
        if (s.m.ore[i] || s.m.coal[i]) {       // a marked outcrop: extra nuggets so it reads at a glance
          for (let k = 0; k < 3; k++) {
            _m.compose(_p.set(wx(x) + (hash(i, 80 + k) - 0.5) * 0.7, h + 0.06, wx(y) + (hash(i, 83 + k) - 0.5) * 0.7), _q.identity(), _s.set(0.45, 0.45, 0.45));
            rocks.setMatrixAt(nk, _m); rocks.setColorAt(nk++, _c.set(s.m.ore[i] ? 0xe09a4c : 0x26262b));
          }
        }
      }
    }
    trunks.count = nt; pines.count = np; rounds.count = nr; rocks.count = nk;
    treeList = [pinesL, roundsL];
    for (let i = 0; i < nt; i++) trunks.setColorAt(i, _c.set(0x7a5a3c));
    for (const im of [trunks, pines, rounds, rocks]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    paintTrees();
  }
  function paintTrees() {
    const [pinesL, roundsL] = treeList;
    const pc = seasonColor('pine', phase, new THREE.Color()), a = seasonColor('leaf', phase, new THREE.Color()), b = seasonColor('leaf2', phase, new THREE.Color());
    for (let i = 0; i < pinesL.length; i++) pines.setColorAt(i, _c.copy(pc).multiplyScalar(0.88 + pinesL[i] * 0.24));
    for (let i = 0; i < roundsL.length; i++) rounds.setColorAt(i, _c.copy(a).lerp(b, roundsL[i]).multiplyScalar(0.92 + roundsL[i] * 0.14));
    if (pines.instanceColor) pines.instanceColor.needsUpdate = true;
    if (rounds.instanceColor) rounds.instanceColor.needsUpdate = true;
  }

  // ----- paths, bridges, fields: one pool of tinted boxes -----
  const BITS = 9000;
  const bitGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const bits = new THREE.InstancedMesh(bitGeo, plain, BITS);
  bits.receiveShadow = true; bits.castShadow = false;
  root.add(bits);
  function bit(n, x, y, z, w, h, d, color) {
    if (n >= BITS) return n;
    _m.compose(_p.set(x, y, z), _q.identity(), _s.set(w, h, d)); bits.setMatrixAt(n, _m); bits.setColorAt(n, color); return n + 1;
  }
  function buildBits() {
    let n = 0;
    const rc = new THREE.Color(ROAD_COLORS[s.era]), rc2 = rc.clone().multiplyScalar(0.93);
    const wood = new THREE.Color(0x9a7246), rail = new THREE.Color(0x6f4c2c);
    const soilOn = new THREE.Color(0x8d6b46), soilOff = new THREE.Color(0xa59a84);
    const f = phase * 4, se = Math.floor(f) % 4, t = f - Math.floor(f);
    // Crop height and colour through the year.
    const cropH = [lerp(0.02, 0.07, t), lerp(0.07, 0.15, t), t < 0.7 ? 0.16 : 0.03, 0.012][se];
    const crop = new THREE.Color([0x7fca55, 0x8fbe45, 0xe2b93a, 0xcdbf9a][se]);
    if (se === 1) crop.lerp(_c2.set(0xd9bd3f), Math.max(0, t - 0.5) * 2);
    if (se === 2 && t >= 0.7) crop.set(0xcdbf9a);
    const snow = se === 3 ? Math.min(1, t * 4) * Math.min(1, (1 - t) * 6) : 0;
    const road = (x, y) => inb(x, y) && s.road[idx(x, y)];
    for (let i = 0; i < N * N; i++) {
      const x = i % N, y = (i / N) | 0, X = wx(x), Z = wx(y);
      if (s.road[i]) {
        const e = road(x + 1, y), w = road(x - 1, y), so = road(x, y + 1), no = road(x, y - 1);
        if (s.m.terr[i] === T.WATER) {
          const alongX = e || w || !(so || no);
          n = bit(n, X, 0.0, Z, alongX ? 1.04 : 0.56, 0.05, alongX ? 0.56 : 1.04, wood);
          for (const o of [-0.27, 0.27]) n = bit(n, X + (alongX ? 0 : o), 0.05, Z + (alongX ? o : 0), alongX ? 1.04 : 0.04, 0.1, alongX ? 0.04 : 1.04, rail);
          for (const o of [-0.45, 0.45]) n = bit(n, X + (alongX ? o : 0), -0.3, Z + (alongX ? 0 : o), 0.1, 0.3, 0.1, rail);
          continue;
        }
        const c = (x + y) % 2 ? rc : rc2;
        n = bit(n, X, 0.0, Z, 0.58, 0.035, 0.58, c);
        if (e) n = bit(n, X + 0.395, 0, Z, 0.21, 0.035, 0.52, c);
        if (w) n = bit(n, X - 0.395, 0, Z, 0.21, 0.035, 0.52, c);
        if (so) n = bit(n, X, 0, Z + 0.395, 0.52, 0.035, 0.21, c);
        if (no) n = bit(n, X, 0, Z - 0.395, 0.52, 0.035, 0.21, c);
      } else if (s.field[i]) {
        const on = s.d.fieldOn[i];
        const soil = _c.copy(on ? soilOn : soilOff).multiplyScalar(0.94 + hash(i, 9) * 0.12);
        if (snow > 0) soil.lerp(_c2.set(0xeef2f4), snow * 0.7);
        n = bit(n, X, 0.0, Z, 0.96, 0.03, 0.96, soil.clone());
        if (on && cropH > 0.015) {
          const vertical = hash(i, 11) < 0.5;
          for (let r = 0; r < 5; r++) {
            const o = -0.36 + r * 0.18, h = cropH * (0.85 + hash(i, 12 + r) * 0.3);
            n = bit(n, X + (vertical ? o : 0), 0.03, Z + (vertical ? 0 : o), vertical ? 0.09 : 0.86, h, vertical ? 0.86 : 0.09, _c.copy(crop).multiplyScalar(0.92 + hash(i, 17 + r) * 0.16).clone());
          }
        }
      }
    }
    bits.count = n;
    bits.instanceMatrix.needsUpdate = true;
    if (bits.instanceColor) bits.instanceColor.needsUpdate = true;
  }

  // ----- buildings -----
  const meshes = new Map();     // id -> { mesh, key, pop }
  const bGroup = new THREE.Group();
  root.add(bGroup);
  function facing(b, def) {
    if (def.wonder) return 0;
    const sz = def.size;
    const sides = [[0, sz, 0], [sz, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]];   // south, east, north, west
    const test = def.adj === 'water' ? (i) => s.m.terr[i] === T.WATER : (i) => s.road[i];
    for (const [dx, dy, rot] of sides) {
      for (let k = 0; k < sz; k++) {
        const xx = b.x + (dx === 0 ? k : dx), yy = b.y + (dy === 0 ? k : dy);
        if (inb(xx, yy) && test(idx(xx, yy))) return rot;
      }
    }
    return (b.id % 4) * (Math.PI / 2) * (sz === 1 && !def.adj ? 1 : 0);
  }
  function place(mesh, b, def, scale = 1) {
    const sz = def.size;
    _m.compose(_p.set(b.x + sz / 2 - HALF, 0, b.y + sz / 2 - HALF), _q.setFromAxisAngle(UP, mesh.userData.rot), _s.set(scale, scale, scale));
    mesh.matrix.copy(_m); mesh.matrixWorldNeedsUpdate = true;
  }
  const pops = [];              // { mesh, b, def, t }
  function syncBuildings(animate = true) {
    const seen = new Set();
    for (const b of s.b) {
      const def = B[b.type], key = modelKey(b);
      seen.add(b.id);
      let e = meshes.get(b.id);
      if (!e) {
        const mesh = new THREE.Mesh(getGeometry(key), mat);
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
        mesh.userData.id = b.id;
        e = { mesh, key };
        meshes.set(b.id, e);
        bGroup.add(mesh);
        mesh.userData.rot = facing(b, def);
        place(mesh, b, def, animate ? 0.01 : 1);
        if (animate) { pops.push({ mesh, b, def, t: 0 }); dust(b, def); }
      } else {
        const rot = facing(b, def);
        if (e.key !== key) {
          e.mesh.geometry = getGeometry(key); e.key = key; e.mesh.userData.rot = rot;
          if (animate) { pops.push({ mesh: e.mesh, b, def, t: 0 }); dust(b, def); } else place(e.mesh, b, def);
        } else if (rot !== e.mesh.userData.rot) { e.mesh.userData.rot = rot; place(e.mesh, b, def); }
      }
    }
    for (const [id, e] of meshes) if (!seen.has(id)) { bGroup.remove(e.mesh); meshes.delete(id); }
  }

  // ----- particles: smoke and dust -----
  const PUFFS = 90;
  const puffMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
  const puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), puffMat, PUFFS);
  puffs.frustumCulled = false;
  root.add(puffs);
  const puffData = Array.from({ length: PUFFS }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, color: 0xffffff }));
  let puffNext = 0;
  function puff(x, y, z, opts = {}) {
    const p = puffData[puffNext]; puffNext = (puffNext + 1) % PUFFS;
    p.x = x; p.y = y; p.z = z; p.vx = opts.vx ?? 0.06; p.vy = opts.vy ?? 0.3; p.vz = opts.vz ?? 0.02;
    p.max = p.life = opts.life ?? 2.4; p.size = opts.size ?? 1; p.color = opts.color ?? 0xf2f0ea;
  }
  function dust(b, def) {
    const cx = b.x + def.size / 2 - HALF, cz = b.y + def.size / 2 - HALF;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; puff(cx + Math.cos(a) * 0.35 * def.size, 0.08, cz + Math.sin(a) * 0.35 * def.size, { vx: Math.cos(a) * 0.5, vz: Math.sin(a) * 0.5, vy: 0.25, life: 0.7, size: 0.9, color: 0xd8c7a4 }); }
  }
  const SMOKERS = { smithy: [0.12, 0.72, -0.16], kiln: [-0.08, 0.52, 0], glassworks: [0.24, 0.74, -0.16], steelworks: [-0.6, 1.32, -0.56], factory: [0.5, 1.32, -0.6],
    tavern: [-0.22, 0.88, -0.1], coalmine: [-0.2, 0.4, -0.16], bathhouse: [-0.2, 0.44, -0.06], station: [-0.42, 0.4, 0.6], storyteller: [0, 0.2, 0] };
  let smokeClock = 0;
  function emitSmoke(dt) {
    smokeClock += dt;
    if (smokeClock < 0.22 || !s.b.length) return;
    smokeClock = 0;
    for (let tries = 0; tries < 3; tries++) {
      const b = s.b[Math.floor(Math.random() * s.b.length)];
      let off = SMOKERS[b.type];
      if (b.type === 'home' && b.lvl >= 4) off = b.lvl === 4 ? [0.2, 0.92, -0.12] : b.lvl === 5 ? [-0.18, 1.08, -0.1] : [-0.36, 1.06, 0];
      if (b.type === 'home' && b.lvl === 0) off = [0.3, 0.1, 0.28];
      if (!off || (B[b.type].workers && !(b.eff > 0.05))) continue;
      const e = meshes.get(b.id); if (!e) continue;
      _p.set(off[0], off[1], off[2]).applyAxisAngle(UP, e.mesh.userData.rot);
      const def = B[b.type];
      puff(b.x + def.size / 2 - HALF + _p.x, _p.y, b.y + def.size / 2 - HALF + _p.z, { size: def.size > 1 ? 1.5 : 0.8, color: b.type === 'steelworks' || b.type === 'factory' || b.type === 'coalmine' ? 0xb9b6b2 : 0xf4f1ea });
      break;
    }
  }
  function updatePuffs(dt) {
    for (let i = 0; i < PUFFS; i++) {
      const p = puffData[i];
      if (p.life <= 0) { _m.makeScale(0, 0, 0); puffs.setMatrixAt(i, _m); continue; }
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= 0.98; p.vz *= 0.98;
      const t = 1 - p.life / p.max, sc = p.size * (0.5 + t * 1.6) * (t > 0.6 ? (1 - t) / 0.4 : 1);
      _m.compose(_p.set(p.x, p.y, p.z), _q.identity(), _s.set(sc, sc, sc)); puffs.setMatrixAt(i, _m); puffs.setColorAt(i, _c.set(p.color));
    }
    puffs.instanceMatrix.needsUpdate = true; if (puffs.instanceColor) puffs.instanceColor.needsUpdate = true;
  }

  // ----- townsfolk -----
  const FOLK = 80;
  const bodyG = new THREE.CylinderGeometry(0.035, 0.05, 0.12, 6).translate(0, 0.06, 0);
  const headG = new THREE.IcosahedronGeometry(0.038, 0).translate(0, 0.155, 0);
  const folkB = new THREE.InstancedMesh(bodyG, plain, FOLK), folkH = new THREE.InstancedMesh(headG, plain, FOLK);
  folkB.castShadow = true; folkB.frustumCulled = false; folkH.frustumCulled = false;
  root.add(folkB, folkH);
  const CLOTHES = [0xc9503c, 0x3f78b5, 0xe6b93a, 0x8a5aa6, 0x3f9b6b, 0xd9d2c4, 0x9a6b3f, 0xdb8a5a];
  const SKIN = [0xf1cfae, 0xd9a77e, 0xb07c54, 0x8a5a3a];
  const folk = [];
  function spawnWalker(i) {
    const homes = s.b.filter((b) => b.type === 'home');
    if (!homes.length) return null;
    const h = homes[Math.floor(Math.random() * homes.length)];
    let x = h.x, y = h.y;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(h.x + dx, h.y + dy) && s.road[idx(h.x + dx, h.y + dy)]) { x = h.x + dx; y = h.y + dy; break; }
    return { x, y, tx: x, ty: y, px: x, py: y, speed: 0.5 + Math.random() * 0.35, seed: Math.random() * 10, home: h.id, rest: Math.random() * 2 };
  }
  function stepWalker(w) {
    const opts = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = w.tx + dx, ny = w.ty + dy;
      if (inb(nx, ny) && s.road[idx(nx, ny)]) opts.push([nx, ny]);
    }
    const fwd = opts.filter(([nx, ny]) => !(nx === w.px && ny === w.py));
    const pickFrom = fwd.length ? fwd : opts;
    w.px = w.tx; w.py = w.ty;
    if (pickFrom.length) { const [nx, ny] = pickFrom[Math.floor(Math.random() * pickFrom.length)]; w.tx = nx; w.ty = ny; }
    else {
      // Off the paths: amble around the doorstep.
      const nx = w.tx + Math.round(Math.random() * 2 - 1), ny = w.ty + Math.round(Math.random() * 2 - 1);
      if (inb(nx, ny) && !s.d.occ[idx(nx, ny)] && s.m.terr[idx(nx, ny)] !== T.WATER && s.m.terr[idx(nx, ny)] !== T.HILL) { w.tx = nx; w.ty = ny; }
      w.rest = 0.5 + Math.random() * 2;
    }
  }
  function updateFolk(dt, elapsed) {
    const want = s ? Math.min(FOLK, Math.round(s.d.pop / 5) + (s.d.pop > 0 ? 3 : 0)) : 0;
    while (folk.length < want) { const w = spawnWalker(folk.length); if (!w) break; folk.push(w); folkB.setColorAt(folk.length - 1, _c.set(CLOTHES[Math.floor(Math.random() * CLOTHES.length)])); folkH.setColorAt(folk.length - 1, _c.set(SKIN[Math.floor(Math.random() * SKIN.length)])); }
    if (folk.length > want) folk.length = want;
    for (let i = 0; i < folk.length; i++) {
      const w = folk[i];
      if (w.rest > 0) w.rest -= dt;
      else {
        const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
        if (d < 0.03) stepWalker(w);
        else { const st = Math.min(d, w.speed * dt); w.x += (dx / d) * st; w.y += (dy / d) * st; w.ang = Math.atan2(dx, dy); }
        if (s.d.occ[idx(Math.round(w.x), Math.round(w.y))] && !s.road[idx(Math.round(w.x), Math.round(w.y))]) { const nw = spawnWalker(i); if (nw) folk[i] = nw; }
      }
      const bob = w.rest > 0 ? 0 : Math.abs(Math.sin(elapsed * 9 + w.seed)) * 0.02;
      const off = (w.seed % 1 - 0.5) * 0.24;
      _m.compose(_p.set(wx(w.x) + off, 0.035 + bob, wx(w.y) + off * 0.6), _q.setFromAxisAngle(UP, w.ang || 0), _s.set(1, 1, 1));
      folkB.setMatrixAt(i, _m); folkH.setMatrixAt(i, _m);
    }
    folkB.count = folk.length; folkH.count = folk.length;
    folkB.instanceMatrix.needsUpdate = true; folkH.instanceMatrix.needsUpdate = true;
    if (folkB.instanceColor) folkB.instanceColor.needsUpdate = true; if (folkH.instanceColor) folkH.instanceColor.needsUpdate = true;
  }

  // ----- cloud shadows -----
  const cloudMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), cloudMat);
    c.scale.set(2.5 + Math.random() * 2.5, 0.3, 1.8 + Math.random() * 2);
    c.position.set(-HALF + Math.random() * N, 12, -HALF + Math.random() * N);
    c.castShadow = true; c.userData.v = 0.25 + Math.random() * 0.3;
    clouds.push(c); root.add(c);
  }

  // ----- overlay, ghost, selection -----
  const overlayMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.42, depthWrite: false });
  const overlay = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.94, 0.94).rotateX(-Math.PI / 2), overlayMat, N * N);
  overlay.count = 0; overlay.renderOrder = 2; overlay.frustumCulled = false;
  const pinGeo = new THREE.ConeGeometry(0.09, 0.2, 5).rotateX(Math.PI);
  const pins = new THREE.InstancedMesh(pinGeo, new THREE.MeshBasicMaterial({ color: 0xe2483c }), 400);
  pins.count = 0; pins.frustumCulled = false;
  root.add(overlay, pins);
  let pinList = [];
  function setOverlay(mask, color = 0x4aa3d9, { markHomes = false } = {}) {
    let n = 0; pinList = [];
    if (mask) {
      _c.set(color);
      for (let i = 0; i < N * N; i++) {
        if (!mask[i]) continue;
        _m.makeTranslation(wx(i % N), Math.max(0, s.m.height[i]) + 0.045, wx((i / N) | 0));
        overlay.setMatrixAt(n, _m); overlay.setColorAt(n++, _c);
      }
      if (markHomes) for (const b of s.b) if (b.type === 'home' && !mask[idx(b.x, b.y)]) pinList.push(b);
    }
    overlay.count = n; pins.count = Math.min(400, pinList.length);
    overlay.instanceMatrix.needsUpdate = true; if (overlay.instanceColor) overlay.instanceColor.needsUpdate = true;
  }

  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x5fd08a, transparent: true, opacity: 0.6, depthWrite: false });
  const ghost = new THREE.Mesh(new THREE.BufferGeometry(), ghostMat);
  ghost.visible = false; ghost.renderOrder = 3;
  const flatGeo = new THREE.BoxGeometry(0.9, 0.06, 0.9).translate(0, 0.03, 0);
  const frame = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 4, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false }));
  frame.visible = false; frame.renderOrder = 4;
  root.add(ghost, frame);
  function setGhost(type, x, y, ok) {
    if (!type) { ghost.visible = false; frame.visible = false; return; }
    const def = B[type], sz = def.size;
    ghost.geometry = def.tile ? flatGeo : getGeometry(def.wonder ? type : type === 'home' ? 'home:0:0' : type);
    ghost.position.set(x + sz / 2 - HALF, def.tile && s.m.terr[idx(Math.max(0, Math.min(N - 1, x)), Math.max(0, Math.min(N - 1, y)))] === T.WATER ? 0 : 0.02, y + sz / 2 - HALF);
    ghostMat.color.set(ok ? 0x4fd98a : 0xf0605a);
    ghost.visible = true;
    frame.position.set(ghost.position.x, 0.06, ghost.position.z); frame.scale.setScalar(sz); frame.material.color.set(ok ? 0xffffff : 0xffb0a8); frame.visible = true;
  }
  let selected = null;
  function setSelection(b) {
    selected = b;
    if (!b) { if (!ghost.visible) frame.visible = false; return; }
    const sz = B[b.type].size;
    frame.position.set(b.x + sz / 2 - HALF, 0.06, b.y + sz / 2 - HALF); frame.scale.setScalar(sz); frame.material.color.set(0xffe08a); frame.visible = true;
  }
  function setTileFrame(x, y) {
    if (x === null) { if (!ghost.visible && !selected) frame.visible = false; return; }
    frame.position.set(wx(x), 0.06, wx(y)); frame.scale.setScalar(1); frame.material.color.set(0xffffff); frame.visible = true;
  }

  // ----- camera -----
  const cam = { tx: 0, tz: 0, dist: 17, yaw: Math.PI / 4, gx: 0, gz: 0, gd: 17, gyaw: Math.PI / 4 };
  function applyCamera() {
    const pitch = lerp(0.72, 1.02, Math.min(1, Math.max(0, (cam.dist - 8) / 30)));
    const cy = Math.sin(pitch) * cam.dist, r = Math.cos(pitch) * cam.dist;
    camera.position.set(cam.tx + Math.sin(cam.yaw) * r, cy, cam.tz + Math.cos(cam.yaw) * r);
    camera.lookAt(cam.tx, 0, cam.tz);
  }
  const clampCam = () => { cam.gx = Math.max(-HALF, Math.min(HALF, cam.gx)); cam.gz = Math.max(-HALF, Math.min(HALF, cam.gz)); cam.gd = Math.max(6, Math.min(52, cam.gd)); };
  const controls = {
    pan(dx, dy) {
      const k = cam.dist * 0.00115 * (camera.fov / 30) * (900 / Math.max(300, stage.size.height));
      const cs = Math.cos(cam.yaw), sn = Math.sin(cam.yaw);
      cam.gx -= (dx * cs + dy * sn * 1.45) * k; cam.gz -= (-dx * sn + dy * cs * 1.45) * k;
      clampCam(); cam.tx = cam.gx; cam.tz = cam.gz;
    },
    zoom(f) { cam.gd *= f; clampCam(); },
    rotate(a, smooth = false) { cam.gyaw += a; if (!smooth) cam.yaw = cam.gyaw; },
    focus(x, y, dist) { cam.gx = x - HALF + 0.5; cam.gz = y - HALF + 0.5; if (dist) cam.gd = dist; clampCam(); },
    jump(x, y, dist) { controls.focus(x, y, dist); cam.tx = cam.gx; cam.tz = cam.gz; cam.dist = cam.gd; applyCamera(); },
    get dist() { return cam.gd; },
  };
  const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  function pickTile(clientX, clientY) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(ground, hit)) return null;
    const x = Math.floor(hit.x + HALF), y = Math.floor(hit.z + HALF);
    return inb(x, y) ? { x, y } : null;
  }
  function project(x, y, h = 0.5) {
    _p.set(x - HALF + 0.5, h, y - HALF + 0.5).project(camera);
    return { x: (_p.x * 0.5 + 0.5) * stage.size.width, y: (-_p.y * 0.5 + 0.5) * stage.size.height, behind: _p.z > 1 };
  }

  // ----- frame -----
  let lastPaint = -1, lastBitsPhase = -1;
  function update(dt, elapsed, ph) {
    if (!s) return;
    phase = ph;
    const k = 1 - Math.pow(0.001, dt);
    cam.tx += (cam.gx - cam.tx) * k; cam.tz += (cam.gz - cam.tz) * k; cam.dist += (cam.gd - cam.dist) * k; cam.yaw += (cam.gyaw - cam.yaw) * k;
    applyCamera();
    if (Math.abs(phase - lastPaint) > 0.004) {
      lastPaint = phase; paintTerrain(); paintTrees();
      seasonColor('sky', phase, scene.background); seasonColor('sun', phase, sun.color);
      const winter = phase > 0.75 ? Math.sin(((phase - 0.75) / 0.25) * Math.PI) : 0;
      sun.intensity = 2.3 - winter * 0.5; hemi.intensity = 1.5 + winter * 0.25;
      waterMat.color.set(0x4fb0e0).lerp(_c2.set(0xbfd9e6), winter * 0.6);
    }
    if (Math.abs(phase - lastBitsPhase) > 0.01) { lastBitsPhase = phase; buildBits(); }
    waterMat.opacity = 0.84 + Math.sin(elapsed * 1.3) * 0.04;
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt / 0.42;
      const t = Math.min(1, p.t), sc = t < 0.6 ? lerp(0.2, 1.14, t / 0.6) : lerp(1.14, 1, (t - 0.6) / 0.4);
      place(p.mesh, p.b, p.def, sc);
      if (t >= 1) pops.splice(i, 1);
    }
    emitSmoke(dt); updatePuffs(dt); updateFolk(dt, elapsed);
    for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > HALF + 8) { c.position.x = -HALF - 8; c.position.z = -HALF + Math.random() * N; } }
    if (frame.visible) { const pu = 1 + Math.sin(elapsed * 5) * 0.03; frame.scale.setScalar((ghost.visible ? B[ghostType()].size : selected ? B[selected.type].size : 1) * pu); }
    for (let i = 0; i < pins.count; i++) {
      const b = pinList[i];
      _m.makeTranslation(wx(b.x), 1.0 + Math.sin(elapsed * 4 + i) * 0.06 + (b.lvl >= 5 ? 0.35 : 0), wx(b.y)); pins.setMatrixAt(i, _m);
    }
    if (pins.count) pins.instanceMatrix.needsUpdate = true;
  }
  let _ghostType = 'home';
  const ghostType = () => _ghostType;

  return {
    controls, pickTile, project, setOverlay, setSelection, setTileFrame,
    setGhost(type, x, y, ok) { if (type) _ghostType = type; setGhost(type, x, y, ok); },
    setState(state) {
      s = state; phase = ((s.day % DAYS_PER_YEAR) / DAYS_PER_YEAR);
      for (const e of meshes.values()) bGroup.remove(e.mesh); meshes.clear(); pops.length = 0; folk.length = 0;
      buildTerrain(); buildTrees(); buildBits(); syncBuildings(false); lastPaint = -1;
      controls.jump(s.m.start.x, s.m.start.y, 17);
    },
    // Call after any change to the map.
    refresh({ trees = false } = {}) { syncBuildings(true); buildBits(); if (trees) { buildTrees(); paintTerrain(); } },
    puffAt(x, y, color) { for (let i = 0; i < 5; i++) puff(wx(x) + (Math.random() - 0.5) * 0.4, 0.1, wx(y) + (Math.random() - 0.5) * 0.4, { vy: 0.5, life: 0.8, color }); },
    celebrate(b) {
      const def = B[b.type], cx = b.x + def.size / 2 - HALF, cz = b.y + def.size / 2 - HALF;
      const cols = [0xf2c94c, 0xe2604c, 0x5fb7e8, 0x7fd08a, 0xffffff];
      for (let i = 0; i < 36; i++) { const a = Math.random() * 6.28, r = 0.6 + Math.random() * 1.4; puff(cx, 0.6 + Math.random(), cz, { vx: Math.cos(a) * r, vz: Math.sin(a) * r, vy: 1.2 + Math.random() * 1.4, life: 1.2 + Math.random() * 0.8, size: 0.7, color: cols[i % 5] }); }
    },
    update,
    update3: update,
    dispose() { disposeModels(); mat.dispose(); plain.dispose(); },
  };
}
