// Tidewater renderer: instanced low-poly terrain, decor, buildings, animated water, overlays, ships.
import * as THREE from 'three';
import { T, D, BUILDINGS } from './data.js';
import { modelParts, scaffoldParts, shipParts } from './models.js';

export const SKY = 0x9fdcf5;
const TOP = [-0.95, -0.3, 0.16, 0.3, 0.32, 0.62, 0.95];
const TERRAIN_COLOR = [0x2a6f9e, 0x63c6c0, 0xf2d99a, 0x8fd05c, 0x63ad48, 0xb6b277, 0x9c968e];
const FERTILE_COLOR = 0x6e9e3a;
const ORE_ROCK = 0xc8743a;

const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export function tileTop(terrain, i) {
  const t = terrain[i];
  let h = TOP[t];
  if (t === T.HILL) h += hash(i) * 0.12;
  if (t === T.MOUNTAIN) h += hash(i) * 0.45;
  if (t === T.GRASS || t === T.FOREST) h += hash(i + 7) * 0.03;
  return h;
}

function prismGeometry() {
  const v = [];
  const A = [-0.5, 0, -0.5], B = [-0.5, 0, 0.5], Cp = [-0.5, 1, 0];
  const A2 = [0.5, 0, -0.5], B2 = [0.5, 0, 0.5], C2 = [0.5, 1, 0];
  const tri = (a, b, c) => v.push(...a, ...b, ...c);
  tri(A, B, Cp); tri(A2, C2, B2);
  tri(B, B2, C2); tri(B, C2, Cp);
  tri(A, Cp, C2); tri(A, C2, A2);
  tri(A, A2, B2); tri(A, B2, B);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

function makeGeos() {
  return {
    box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    prism: prismGeometry(),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0),
    cone: new THREE.ConeGeometry(0.5, 1, 7).translate(0, 0.5, 0),
    pyr: new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
    ball: new THREE.IcosahedronGeometry(0.5, 1).translate(0, 0.5, 0),
    rock: new THREE.DodecahedronGeometry(0.5, 0).translate(0, 0.3, 0),
    oct: new THREE.OctahedronGeometry(0.5, 0),
  };
}

// Growable instanced pool with per-instance colour and an optional tag (tile index) for picking.
class Pool {
  constructor(parent, geo, mat, cap = 64) {
    this.parent = parent; this.geo = geo; this.mat = mat;
    this.cap = 0; this.n = 0;
    this.mats = new Float32Array(cap * 16); this.cols = new Float32Array(cap * 3); this.tags = new Int32Array(cap);
    this.mesh = null;
    this.alloc(cap);
  }
  alloc(cap) {
    if (this.mesh) { this.parent.remove(this.mesh); this.mesh.dispose(); }
    this.cap = cap;
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.parent.add(this.mesh);
  }
  begin() { this.n = 0; }
  push(m, color, tag = -1) {
    if (this.n >= this.mats.length / 16) {
      const nm = new Float32Array(this.mats.length * 2); nm.set(this.mats); this.mats = nm;
      const nc = new Float32Array(this.cols.length * 2); nc.set(this.cols); this.cols = nc;
      const nt = new Int32Array(this.tags.length * 2); nt.set(this.tags); this.tags = nt;
    }
    m.toArray(this.mats, this.n * 16);
    this.cols[this.n * 3] = color.r; this.cols[this.n * 3 + 1] = color.g; this.cols[this.n * 3 + 2] = color.b;
    this.tags[this.n] = tag;
    this.n++;
  }
  end(bounds = true) {
    if (this.n > this.cap) this.alloc(Math.max(this.n, this.cap * 2));
    const im = this.mesh.instanceMatrix, ic = this.mesh.instanceColor;
    im.array.set(this.mats.subarray(0, this.n * 16));
    ic.array.set(this.cols.subarray(0, this.n * 3));
    im.needsUpdate = true; ic.needsUpdate = true;
    this.mesh.count = this.n;
    if (bounds) { this.mesh.boundingSphere = null; this.mesh.boundingBox = null; if (this.n) this.mesh.computeBoundingSphere(); }
  }
  dispose() { this.parent.remove(this.mesh); this.mesh.dispose(); }
}

const WATER_VERT = /* glsl */`
uniform float uTime;
uniform vec2 uHalf;
varying vec2 vTile;
varying float vWave;
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  float w = sin(p.x * 0.9 + uTime * 1.3) * 0.035 + sin(p.z * 1.1 - uTime * 1.05) * 0.03 + sin((p.x + p.z) * 0.45 + uTime * 0.7) * 0.025;
  p.y += w;
  vWave = w;
  vTile = vec2(p.x + uHalf.x, p.z + uHalf.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform sampler2D uShore;
uniform vec2 uSize;
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
varying vec2 vTile;
varying float vWave;
#include <fog_pars_fragment>
void main() {
  vec2 uv = vTile / uSize;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float land = texture2D(uShore, clamp(uv, 0.0, 1.0)).r * inside;
  vec3 col = mix(uDeep, uShallow, smoothstep(0.08, 0.62, land));
  float band = smoothstep(0.6, 0.78, land) * (1.0 - smoothstep(0.9, 1.0, land));
  float stripes = 0.5 + 0.5 * sin(land * 34.0 - uTime * 2.4);
  col = mix(col, uFoam, band * (0.35 + 0.5 * stripes));
  col += vec3(vWave * 1.6);
  float a = mix(0.9, 0.72, smoothstep(0.25, 0.7, land));
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export function createView(stage) {
  const { scene } = stage;
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 40, 120);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
  stage.setCamera(camera);

  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x7a8f5a, 1.5);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
  sun.position.set(-12, 30, 18);
  scene.add(hemi, sun);

  const world = new THREE.Group();
  scene.add(world);
  const geos = makeGeos();
  const lambert = new THREE.MeshLambertMaterial({ flatShading: true });
  const lambertSmooth = new THREE.MeshLambertMaterial();

  const terrain = new Pool(world, geos.box, lambert, 1600);
  const decor = {
    trunk: new Pool(world, geos.cyl, lambert, 512),
    leaf: new Pool(world, geos.cone, lambert, 512),
    rock: new Pool(world, geos.rock, lambert, 256),
    tuft: new Pool(world, geos.box, lambert, 256),
    disc: new Pool(world, geos.cyl, lambert, 32),
  };
  const bpools = {};
  for (const k of ['box', 'prism', 'cyl', 'cone', 'pyr', 'ball']) bpools[k] = new Pool(world, geos[k], k === 'ball' ? lambertSmooth : lambert, 256);
  const markers = new Pool(world, geos.oct, new THREE.MeshBasicMaterial(), 32);
  const flames = new Pool(world, geos.cone, new THREE.MeshBasicMaterial(), 32);
  const smoke = new Pool(world, geos.ball, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }), 32);
  const fins = new Pool(world, geos.box, new THREE.MeshBasicMaterial(), 32);
  const overlay = new Pool(world, new THREE.PlaneGeometry(0.94, 0.94).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false }), 256);
  overlay.mesh.renderOrder = 2;

  // Water.
  let waterMesh = null, shoreTex = null;
  const waterUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uHalf: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
    uShore: { value: null }, uDeep: { value: new THREE.Color(0x2b8fd6) }, uShallow: { value: new THREE.Color(0x5fe0d6) },
    uFoam: { value: new THREE.Color(0xffffff) },
  }]);
  const waterMat = new THREE.ShaderMaterial({ uniforms: waterUniforms, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false, fog: true });

  // Selection frame.
  const sel = new THREE.Group();
  const selMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(geos.box, selMat);
    const horiz = k < 2;
    m.scale.set(horiz ? 1.04 : 0.07, 0.07, horiz ? 0.07 : 1.04);
    m.position.set(horiz ? 0 : (k === 2 ? -0.5 : 0.5), 0, horiz ? (k === 0 ? -0.5 : 0.5) : 0);
    sel.add(m);
  }
  sel.visible = false;
  world.add(sel);

  // Ghost preview.
  const ghost = new THREE.Group();
  const ghostMat = new THREE.MeshLambertMaterial({ color: 0x9cffb0, transparent: true, opacity: 0.6, depthWrite: false });
  world.add(ghost);
  let ghostKey = '';

  // Ships.
  const makeShip = (relief) => {
    const g = new THREE.Group();
    for (const p of shipParts(relief)) {
      const m = new THREE.Mesh(geos[p[0]], new THREE.MeshLambertMaterial({ color: p[1], flatShading: true }));
      m.position.set(p[2], p[3], p[4]); m.scale.set(p[5], p[6], p[7]);
      m.rotation.set(p[10] || 0, p[8] || 0, p[9] || 0);
      g.add(m);
    }
    g.visible = false;
    world.add(g);
    return g;
  };
  const tradeShip = makeShip(false);
  const reliefShip = makeShip(true);
  let reliefT = 0;

  // Scratch objects (no per-frame allocation).
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Mb = new THREE.Matrix4();
  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const col = new THREE.Color(), col2 = new THREE.Color();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
  const hit = new THREE.Vector3();

  let W = 1, H = 1, half = { x: 0.5, z: 0.5 };
  let state = null, lastVer = -1, lastTVer = -1, lastBuildPhase = '';
  const rotOf = new Map();
  let smokeSources = [], markerList = [], fireList = [], shoals = [];

  const wx = (x) => x + 0.5 - half.x;
  const wz = (y) => y + 0.5 - half.z;

  function setState(s) {
    state = s;
    W = s.W; H = s.H; half = { x: W / 2, z: H / 2 };
    if (waterMesh) { world.remove(waterMesh); waterMesh.geometry.dispose(); }
    const size = Math.max(W, H) + 160;
    const geo = new THREE.PlaneGeometry(size, size, 140, 140).rotateX(-Math.PI / 2);
    waterMesh = new THREE.Mesh(geo, waterMat);
    waterMesh.position.y = 0.04;
    waterMesh.renderOrder = 1;
    world.add(waterMesh);
    waterUniforms.uHalf.value.set(half.x, half.z);
    waterUniforms.uSize.value.set(W, H);
    lastVer = -1; lastTVer = -1;
    rotOf.clear();
  }

  function rebuildShore(s) {
    const data = new Uint8Array(W * H * 4);
    const dist = new Float32Array(W * H).fill(99);
    for (let i = 0; i < W * H; i++) if (s.terrain[i] >= T.SAND) dist[i] = 0;
    for (let pass = 0; pass < 4; pass++) for (let i = 0; i < W * H; i++) {
      if (dist[i] === 0) continue;
      const x = i % W, y = (i / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const d = dist[ny * W + nx] + (dx && dy ? 1.4 : 1);
        if (d < dist[i]) dist[i] = d;
      }
    }
    for (let i = 0; i < W * H; i++) {
      const d = dist[i];
      const v = d === 0 ? 1 : d <= 1.01 ? 0.7 : d <= 1.5 ? 0.6 : d <= 2.5 ? 0.42 : d <= 3.5 ? 0.22 : 0.05;
      data[i * 4] = Math.round(v * 255); data[i * 4 + 3] = 255;
    }
    if (shoreTex) shoreTex.dispose();
    shoreTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    shoreTex.magFilter = THREE.LinearFilter; shoreTex.minFilter = THREE.LinearFilter;
    shoreTex.wrapS = shoreTex.wrapT = THREE.ClampToEdgeWrapping;
    shoreTex.needsUpdate = true;
    waterUniforms.uShore.value = shoreTex;
  }

  function rebuildTerrain(s, occ) {
    terrain.begin();
    for (const k in decor) decor[k].begin();
    shoals = [];
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0, t = s.terrain[i];
      const top = tileTop(s.terrain, i);
      const bottom = -1.3;
      P.set(wx(x), bottom, wz(y)); S.set(1, top - bottom, 1); Q.identity();
      M.compose(P, Q, S);
      col.setHex(s.deposit[i] === D.FERTILE ? FERTILE_COLOR : TERRAIN_COLOR[t]);
      const j = (hash(i * 3 + 1) - 0.5) * 0.06;
      col.offsetHSL(0, 0, j);
      terrain.push(M, col, i);
      const r1 = hash(i + 11), r2 = hash(i + 23), r3 = hash(i + 37);
      const built = occ && occ[i] >= 0;
      if (t === T.FOREST && !built) {
        const n = 2 + (r1 > 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const ox = (hash(i * 7 + k) - 0.5) * 0.6, oz = (hash(i * 13 + k) - 0.5) * 0.6;
          const sc = 0.75 + hash(i * 17 + k) * 0.5;
          P.set(wx(x) + ox, top, wz(y) + oz); S.set(0.07 * sc, 0.16 * sc, 0.07 * sc); M.compose(P, Q, S);
          decor.trunk.push(M, col.setHex(0x7a5232));
          P.y = top + 0.12 * sc; S.set(0.34 * sc, 0.6 * sc, 0.34 * sc); M.compose(P, Q, S);
          col.setHex(hash(i + k * 5) > 0.5 ? 0x3f8f3c : 0x4fa046).offsetHSL(0, 0, (hash(i * 19 + k) - 0.5) * 0.08);
          decor.leaf.push(M, col);
        }
      } else if ((t === T.MOUNTAIN || (t === T.HILL && r1 > 0.6) || s.deposit[i] === D.ORE) && !built) {
        const n = t === T.MOUNTAIN ? 2 : s.deposit[i] === D.ORE ? 3 : 1;
        for (let k = 0; k < n; k++) {
          const ox = (hash(i * 5 + k) - 0.5) * 0.55, oz = (hash(i * 9 + k) - 0.5) * 0.55;
          const sc = (t === T.MOUNTAIN ? 0.45 : 0.25) * (0.7 + hash(i * 3 + k) * 0.6);
          E.set(0, hash(i + k) * 6, 0); Q.setFromEuler(E);
          P.set(wx(x) + ox, top - 0.04, wz(y) + oz); S.set(sc, sc, sc); M.compose(P, Q, S);
          col.setHex(s.deposit[i] === D.ORE ? (k === 0 ? 0xf2c34b : ORE_ROCK) : (t === T.MOUNTAIN ? 0x8c867e : 0xa39d92));
          decor.rock.push(M, col);
        }
        Q.identity();
        if (t === T.MOUNTAIN && r2 > 0.55) {
          P.set(wx(x), top - 0.02, wz(y)); S.set(0.5, 0.06, 0.5); M.compose(P, Q, S);
          decor.tuft.push(M, col.setHex(0xffffff));
        }
      } else if (s.deposit[i] === D.FERTILE && !built) {
        for (let k = 0; k < 3; k++) {
          const ox = (hash(i * 5 + k) - 0.5) * 0.7, oz = (hash(i * 9 + k) - 0.5) * 0.7;
          P.set(wx(x) + ox, top, wz(y) + oz); S.set(0.07, 0.07, 0.07); M.compose(P, Q, S);
          decor.tuft.push(M, col.setHex(k === 0 ? 0xffe066 : k === 1 ? 0xffffff : 0xf28ab0));
        }
      } else if (t === T.GRASS && !built && r2 > 0.86) {
        P.set(wx(x) + (r1 - 0.5) * 0.6, top, wz(y) + (r3 - 0.5) * 0.6); S.set(0.16, 0.12, 0.16); M.compose(P, Q, S);
        decor.tuft.push(M, col.setHex(0x5aa843));
      } else if (t === T.SAND && !built && r2 > 0.9) {
        P.set(wx(x) + (r1 - 0.5) * 0.5, top, wz(y) + (r3 - 0.5) * 0.5); S.set(0.05, 0.42, 0.05); M.compose(P, Q, S);
        decor.trunk.push(M, col.setHex(0x9a7449));
        P.y = top + 0.38; S.set(0.36, 0.1, 0.36); M.compose(P, Q, S);
        decor.leaf.push(M, col.setHex(0x55b04a));
      }
      if (s.deposit[i] === D.FISH) {
        P.set(wx(x), -0.12, wz(y)); S.set(0.8, 0.02, 0.8); M.compose(P, Q, S);
        decor.disc.push(M, col.setHex(0x1f5f86));
        shoals.push(i);
      }
    }
    terrain.end();
    for (const k in decor) decor[k].end(false);
  }

  function facing(s, b) {
    const d = BUILDINGS[b.type];
    if (d.place === 'coast') {
      const dirs = [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]];
      for (const [dx, dy, a] of dirs) {
        const nx = b.x + dx, ny = b.y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && s.terrain[ny * W + nx] <= T.SHALLOW) return a;
      }
    }
    // Face the camera-ish, with a little variety for homes.
    const base = Math.PI / 4;
    if (b.type === 'house') return base + (hash(b.id * 3) > 0.5 ? 0 : -Math.PI / 2);
    return base;
  }

  function pushParts(parts, b, top, rot, grow, dark) {
    P.set(wx(b.x), top, wz(b.y)); Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rot); S.set(1, 1, 1);
    Mb.compose(P, Q, S);
    const tile = b.y * W + b.x;
    for (const p of parts) {
      E.set(p[10] || 0, p[8] || 0, p[9] || 0);
      Q.setFromEuler(E);
      P.set(p[2], p[3] * grow, p[4]); S.set(p[5], p[6] * grow, p[7]);
      M2.compose(P, Q, S);
      M.multiplyMatrices(Mb, M2);
      col.setHex(p[1]);
      if (dark) col.multiplyScalar(0.45);
      bpools[p[0]].push(M, col, tile);
    }
  }

  function rebuildBuildings(s) {
    for (const k in bpools) bpools[k].begin();
    smokeSources = [];
    for (const b of s.buildings) {
      const top = tileTop(s.terrain, b.y * W + b.x);
      let rot = rotOf.get(b.id);
      if (rot === undefined) { rot = facing(s, b); rotOf.set(b.id, rot); }
      if (b.prog < 1) {
        const p = Math.floor(b.prog * 5) / 5;
        pushParts(scaffoldParts(p), b, top, rot, 1, false);
        if (p > 0.2) pushParts(modelParts(b.type, b.level), b, top, rot, p * 0.8, false);
        continue;
      }
      pushParts(modelParts(b.type, b.level), b, top, rot, 1, b.damaged);
      if (['smelter', 'bakery', 'toolsmith'].includes(b.type) || (b.type === 'house' && b.level >= 2)) smokeSources.push(b);
    }
    for (const k in bpools) bpools[k].end();
  }

  function sync(s, phaseKey) {
    if (s !== state) setState(s);
    const tv = s.terrainVer || 0;
    if (lastTVer === -1) rebuildShore(s); // land and water never change shape
    if (tv !== lastTVer) { lastTVer = tv; lastVer = -1; }
    if (s.ver !== lastVer || phaseKey !== lastBuildPhase) {
      const occ = new Int32Array(W * H).fill(-1);
      for (const b of s.buildings) occ[b.y * W + b.x] = b.id;
      rebuildTerrain(s, occ);
      rebuildBuildings(s);
      lastVer = s.ver; lastBuildPhase = phaseKey;
    }
  }

  // ---- per-frame ----
  const camState = { tx: 0, tz: 0, dist: 24, yaw: Math.PI / 4, pitch: 0.92 };
  function updateCamera() {
    const { tx, tz, dist, yaw, pitch } = camState;
    camera.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, tz + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(tx, 0.3, tz);
    scene.fog.near = dist * 1.3; scene.fog.far = dist * 3.6 + 30;
  }

  const STATUS_COLOR = { damaged: 0xe2483d, input: 0xf2a93b, full: 0xf2a93b, needs: 0xf2a93b, warn: 0xf7d154, idle: 0xb0b6c0, paused: 0x5b8def };

  function frame(dt, t, s) {
    waterUniforms.uTime.value = t;
    if (!s) return;
    // Markers above buildings with problems.
    markers.begin(); flames.begin(); smoke.begin(); fins.begin();
    for (const b of s.buildings) {
      const top = tileTop(s.terrain, b.y * W + b.x);
      if (b.fire > 0) {
        for (let k = 0; k < 4; k++) {
          const f = 0.7 + 0.3 * Math.sin(t * 14 + k * 2.1 + b.id);
          P.set(wx(b.x) + (k % 2 - 0.5) * 0.3, top + 0.05, wz(b.y) + ((k >> 1) - 0.5) * 0.3);
          S.set(0.2 * f, 0.55 * f, 0.2 * f); Q.identity(); M.compose(P, Q, S);
          flames.push(M, col.setHex(k % 2 ? 0xffd24a : 0xff6a1f));
        }
        continue;
      }
      const c = STATUS_COLOR[b.status];
      if (c && b.prog >= 1) {
        const bob = Math.sin(t * 3 + b.id) * 0.06;
        P.set(wx(b.x), top + 1.0 + bob, wz(b.y)); E.set(0, t * 1.5, 0); Q.setFromEuler(E); S.set(0.2, 0.28, 0.2);
        M.compose(P, Q, S);
        markers.push(M, col.setHex(c));
      }
    }
    for (const b of smokeSources) {
      if (b.status !== 'ok' && b.type !== 'house') continue;
      const top = tileTop(s.terrain, b.y * W + b.x);
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.5 + k / 3 + b.id * 0.13) % 1);
        P.set(wx(b.x) + 0.15 + ph * 0.15, top + 0.7 + ph * 0.8, wz(b.y) - 0.1);
        const sc = 0.1 + ph * 0.18;
        S.set(sc, sc, sc); Q.identity(); M.compose(P, Q, S);
        smoke.push(M, col.setHex(0xf2f2f2));
      }
    }
    for (const i of shoals) {
      const x = i % W, y = (i / W) | 0;
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.6 + hash(i + k) * 3) % 3;
        if (ph > 1) continue;
        const a = ph * Math.PI;
        P.set(wx(x) + (hash(i * 3 + k) - 0.5) * 0.6 + ph * 0.3, 0.05 + Math.sin(a) * 0.25, wz(y) + (hash(i * 7 + k) - 0.5) * 0.6);
        E.set(0, 0.6, Math.PI / 2 - a); Q.setFromEuler(E); S.set(0.05, 0.16, 0.03); M.compose(P, Q, S);
        fins.push(M, col.setHex(0xdff3ff));
      }
    }
    markers.end(false); flames.end(false); smoke.end(false); fins.end(false);
    if (sel.visible) { const p = 1 + Math.sin(t * 5) * 0.04; sel.scale.set(p, 1, p); }
    animateShips(dt, t, s);
  }

  function shipTarget(s, near) {
    // Nearest deep-ish water tile beside `near` tile, and direction out to sea.
    let best = null, bd = 1e9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = near.x + dx, y = near.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (s.terrain[y * W + x] > T.SHALLOW) continue;
      const d = dx * dx + dy * dy;
      if (d < bd && d > 0) { bd = d; best = { x, y }; }
    }
    if (!best) return null;
    let ox = best.x - (W - 1) / 2, oz = best.y - (H - 1) / 2;
    const L = Math.hypot(ox, oz) || 1; ox /= L; oz /= L;
    return { x: wx(best.x), z: wz(best.y), ox, oz };
  }
  function placeShip(g, tgt, k, t) {
    // k: 0 = far out at sea, 1 = moored.
    const far = 22 * (1 - k) * (1 - k);
    g.position.set(tgt.x + tgt.ox * far, 0.02 + Math.sin(t * 1.7) * 0.03, tgt.z + tgt.oz * far);
    g.rotation.y = Math.atan2(-tgt.ox, -tgt.oz) + (k >= 1 ? 0.6 : 0);
    g.rotation.z = Math.sin(t * 1.3) * 0.04;
    g.visible = true;
  }
  function animateShips(dt, t, s) {
    const ship = s.ship;
    const dock = ship && s.buildings.find((b) => b.type === 'dock');
    if (ship && dock) {
      const tgt = shipTarget(s, dock);
      if (tgt) {
        const inT = Math.min(1, (s.t - ship.arrive) / 6), outT = Math.min(1, (ship.leave - s.t) / 6);
        placeShip(tradeShip, tgt, Math.max(0, Math.min(inT, outT)), t);
      }
    } else tradeShip.visible = false;
    if (reliefT > 0) {
      reliefT -= dt;
      const tgt = shipTarget(s, s.start);
      if (tgt) {
        const k = Math.max(0, Math.min(1, Math.min((14 - reliefT) / 5, reliefT / 5)));
        placeShip(reliefShip, tgt, k, t + 1);
      }
    } else reliefShip.visible = false;
  }

  // ---- picking ----
  function pick(clientX, clientY) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = [terrain.mesh];
    for (const k in bpools) if (bpools[k].n) targets.push(bpools[k].mesh);
    const hits = raycaster.intersectObjects(targets, false);
    for (const h of hits) {
      if (h.instanceId == null) continue;
      for (const k in bpools) if (bpools[k].mesh === h.object) return bpools[k].tags[h.instanceId];
      if (h.object === terrain.mesh) return terrain.tags[h.instanceId];
    }
    return -1;
  }
  // World point on the ground plane under a screen point (for panning).
  function groundAt(clientX, clientY, out) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return false;
    out.x = hit.x; out.z = hit.z;
    return true;
  }

  function setSelection(s, i) {
    if (i < 0 || !s) { sel.visible = false; return; }
    const x = i % W, y = (i / W) | 0;
    sel.position.set(wx(x), Math.max(0.06, tileTop(s.terrain, i)) + 0.01, wz(y));
    sel.visible = true;
  }

  function setGhost(s, type, i, valid) {
    if (!type || i < 0) { ghost.visible = false; return; }
    const key = type;
    if (key !== ghostKey) {
      ghost.clear();
      for (const p of modelParts(type, 1)) {
        const m = new THREE.Mesh(geos[p[0]], ghostMat);
        m.position.set(p[2], p[3], p[4]); m.scale.set(p[5], p[6], p[7]);
        m.rotation.set(p[10] || 0, p[8] || 0, p[9] || 0);
        ghost.add(m);
      }
      ghostKey = key;
    }
    const x = i % W, y = (i / W) | 0;
    ghost.position.set(wx(x), Math.max(0.06, tileTop(s.terrain, i)), wz(y));
    ghost.rotation.y = facing(s, { type, x, y, id: 0 });
    ghostMat.color.setHex(valid ? 0x9cffb0 : 0xff7a7a);
    ghost.visible = true;
  }

  // list: flat array [tileIndex, colorHex, ...]
  function setOverlay(s, list) {
    overlay.begin();
    if (s && list) for (let k = 0; k < list.length; k += 2) {
      const i = list[k];
      const x = i % W, y = (i / W) | 0;
      P.set(wx(x), Math.max(0.07, tileTop(s.terrain, i)) + 0.015, wz(y)); Q.identity(); S.set(1, 1, 1);
      M.compose(P, Q, S);
      overlay.push(M, col2.setHex(list[k + 1]));
    }
    overlay.end(false);
  }

  function relief() { reliefT = 14; }

  function dispose() {
    terrain.dispose(); for (const k in decor) decor[k].dispose(); for (const k in bpools) bpools[k].dispose();
    markers.dispose(); flames.dispose(); smoke.dispose(); fins.dispose(); overlay.dispose();
    if (shoreTex) shoreTex.dispose();
    for (const g of Object.values(geos)) g.dispose();
    waterMat.dispose(); lambert.dispose(); lambertSmooth.dispose(); ghostMat.dispose(); selMat.dispose();
  }

  return {
    camera, camState, updateCamera, sync, frame, pick, groundAt, setSelection, setGhost, setOverlay, relief, dispose,
    get size() { return { W, H }; }, geos,
  };
}

// ---- Thumbnails: render each building model once to a small image. ----
export function makeThumbnails(renderer, keys, px = 112) {
  const out = {};
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x7a8f5a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-3, 8, 5); scene.add(sun);
  const cam = new THREE.OrthographicCamera(-0.75, 0.75, 0.85, -0.65, 0.1, 50);
  const d = 6;
  cam.position.set(Math.sin(Math.PI / 4) * Math.cos(0.6) * d, Math.sin(0.6) * d, Math.cos(Math.PI / 4) * Math.cos(0.6) * d);
  cam.lookAt(0, 0.3, 0);
  const rt = new THREE.WebGLRenderTarget(px, px);
  const buf = new Uint8Array(px * px * 4);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = px;
  const ctx2 = canvas.getContext('2d');
  const geos = makeGeos();
  const mats = new Map();
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    lut[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
  }
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  for (const key of keys) {
    const [type, lv] = key.split(':');
    const g = new THREE.Group();
    const parts = modelParts(type, Number(lv) || 1);
    for (const p of parts) {
      let m = mats.get(p[1]);
      if (!m) { m = new THREE.MeshLambertMaterial({ color: p[1], flatShading: true }); mats.set(p[1], m); }
      const mesh = new THREE.Mesh(geos[p[0]], m);
      mesh.position.set(p[2], p[3], p[4]); mesh.scale.set(p[5], p[6], p[7]);
      mesh.rotation.set(p[10] || 0, p[8] || 0, p[9] || 0);
      g.add(mesh);
    }
    // Ground tile under it.
    const ground = new THREE.Mesh(geos.box, new THREE.MeshLambertMaterial({ color: type === 'fishing' || type === 'dock' || type === 'lighthouse' ? 0xf2d99a : 0x8fd05c }));
    ground.scale.set(1, 0.12, 1); ground.position.y = -0.12;
    g.add(ground);
    const tall = type === 'lighthouse' ? 0.55 : type === 'townhall' || type === 'charter' ? 0.2 : 0;
    cam.top = 0.85 + tall; cam.bottom = -0.65; cam.left = -0.75 - tall / 2; cam.right = 0.75 + tall / 2; cam.updateProjectionMatrix();
    g.rotation.y = type === 'fishing' || type === 'dock' ? Math.PI / 4 : 0;
    scene.add(g);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, px, px, buf);
    const img = ctx2.createImageData(px, px);
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
      const si = ((px - 1 - y) * px + x) * 4, di = (y * px + x) * 4;
      img.data[di] = lut[buf[si]]; img.data[di + 1] = lut[buf[si + 1]]; img.data[di + 2] = lut[buf[si + 2]]; img.data[di + 3] = buf[si + 3];
    }
    ctx2.putImageData(img, 0, 0);
    out[key] = canvas.toDataURL('image/png');
    scene.remove(g);
    ground.material.dispose();
  }
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  rt.dispose();
  for (const m of mats.values()) m.dispose();
  for (const g of Object.values(geos)) g.dispose();
  return out;
}
