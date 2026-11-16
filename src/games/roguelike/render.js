// three.js view of a Deepvault floor. Reads sim state; never mutates it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { T, CLASSES, ELITES, BIOMES } from './data.js';
import {
  buildCharacter, buildWeapon, buildProp, buildPickup, setCharMaterial, FLASH, TELE, ICE, lam, basic, glow, geo, sph, cyl, box, disposeCaches,
} from './models.js';
import { spikeActive } from './sim.js';
import { MAX_PROJ, MAX_TELE, MAX_ZONE } from './combat.js';

const CAM_EL = (67 * Math.PI) / 180;
const VIEW_W = 9; // tiles visible across a portrait screen
const VIEW_H = 13.5;
const SEEN_DIM = 0.42;
const LIGHT_I = 9, LIGHT_D = 16, LIGHT_DECAY = 1.1;
const CHAR_SCALE = 1.35; // characters are drawn larger than their collision radius so they read on a phone

const PROJ_COLORS = {
  arrow: 0xf0e6c8, bolt: 0xd8dcf0, orb: 0xc890ff, spark: 0xffe890, fireball: 0xff7a20, knife: 0xe0e8f8, bomb: 0x2a2a32,
  bone: 0xf4eed8, rock: 0xb09a7a, hex: 0x9aff9c, spore: 0xc8f05a, slime: 0x7ff0b0, fire: 0xff8a30, ice: 0xb0f0ff, void: 0xe080ff,
};
const ZONE_COLORS = { fire: 0xff6a20, poison: 0x7fd13b, frost: 0x8fd8ff, void: 0xa050ff };

function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

export function createRenderer(stage) {
  const { scene } = stage;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 220);
  stage.setCamera(camera);
  const world = new THREE.Group();
  scene.add(world);

  const ambient = new THREE.AmbientLight(0xffffff, 1.4);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(0.4, 1, 0.6);
  const torch = new THREE.PointLight(0xffc27a, LIGHT_I, LIGHT_D, LIGHT_DECAY);
  scene.add(ambient, sun, torch);

  // ---- shared tile geometry
  const wallGeo = (() => {
    const g = new THREE.BoxGeometry(1, 0.7, 1); // low walls so they never hide a character standing behind them
    g.translate(0, 0.35, 0);
    const n = g.attributes.normal, c = new Float32Array(n.count * 3);
    for (let i = 0; i < n.count; i++) {
      const ny = n.getY(i), nz = n.getZ(i);
      const v = ny > 0.5 ? 1 : ny < -0.5 ? 0.3 : nz > 0.5 ? 0.68 : 0.55;
      c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = v;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  })();
  const floorGeo = new THREE.PlaneGeometry(1, 1); floorGeo.rotateX(-Math.PI / 2);
  const spikeGeo = (() => {
    const parts = [];
    for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2], [0, 0]]) {
      const c = new THREE.ConeGeometry(0.08, 0.36, 4); c.translate(x, 0.18, z); parts.push(c);
    }
    const m = mergeGeometries(parts); parts.forEach((p) => p.dispose()); return m;
  })();
  const wallMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const floorMat = new THREE.MeshLambertMaterial();
  const hazMat = new THREE.MeshBasicMaterial();
  const spikeMat = new THREE.MeshLambertMaterial({ color: 0xb8b8c4 });

  const R = {
    camera, world, torch, G: null, frame: 0, camX: 0, camZ: 0, shake: 0, shakeT: 0, w: 1, h: 1,
    tileGroup: null, floorMesh: null, wallMesh: null, hazMesh: null, spikeMesh: null,
    floorIdx: null, wallIdx: null, hazIdx: null, floorBase: null, wallBase: null, hazBase: null,
    fogVersion: -1, prevVis: new Int32Array(0), prevN: 0,
    props: new Map(), pickups: new Map(), enemies: new Map(), pools: new Map(), doors: [], barriers: [], stairs: null,
    player: null, playerWeapon: '', decoy: null, orbs: [], bubble: null,
  };

  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const projV = new THREE.Vector3();

  // ---- dynamic instanced layers
  const projGeo = new THREE.IcosahedronGeometry(1, 1);
  const projCore = new THREE.InstancedMesh(projGeo, new THREE.MeshBasicMaterial(), MAX_PROJ);
  const projHalo = new THREE.InstancedMesh(projGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }), MAX_PROJ);
  for (const m of [projCore, projHalo]) { m.frustumCulled = false; m.count = 0; m.setColorAt(0, tmpC.set(0xffffff)); world.add(m); }

  const PCAP = 900;
  const partMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), PCAP);
  partMesh.frustumCulled = false; partMesh.count = 0; partMesh.setColorAt(0, tmpC.set(0xffffff));
  world.add(partMesh);
  const P_ = { x: new Float32Array(PCAP), y: new Float32Array(PCAP), z: new Float32Array(PCAP), vx: new Float32Array(PCAP), vy: new Float32Array(PCAP), vz: new Float32Array(PCAP), life: new Float32Array(PCAP), max: new Float32Array(PCAP), size: new Float32Array(PCAP), r: new Float32Array(PCAP), g: new Float32Array(PCAP), b: new Float32Array(PCAP), grav: new Float32Array(PCAP), n: 0 };

  const zoneGeo = new THREE.CircleGeometry(1, 20); zoneGeo.rotateX(-Math.PI / 2);
  const zoneMesh = new THREE.InstancedMesh(zoneGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), MAX_ZONE);
  zoneMesh.frustumCulled = false; zoneMesh.count = 0; zoneMesh.setColorAt(0, tmpC.set(0xffffff));
  world.add(zoneMesh);

  const boltMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), 200);
  boltMesh.frustumCulled = false; boltMesh.count = 0; boltMesh.setColorAt(0, tmpC.set(0xffffff));
  world.add(boltMesh);
  const bolts = [];

  // Telegraph meshes, one slot per sim telegraph.
  const ringGeo = new THREE.RingGeometry(0.9, 1, 40); ringGeo.rotateX(-Math.PI / 2);
  const discGeo = new THREE.CircleGeometry(1, 40); discGeo.rotateX(-Math.PI / 2);
  const lineGeo = new THREE.PlaneGeometry(1, 1); lineGeo.translate(0, -0.5, 0); lineGeo.rotateX(-Math.PI / 2);
  const teleMats = new Map();
  function teleMat(color, opacity) {
    const k = `${color}|${opacity}`;
    let m = teleMats.get(k);
    if (!m) { m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); teleMats.set(k, m); }
    return m;
  }
  const teles = [];
  for (let i = 0; i < MAX_TELE; i++) {
    const ring = new THREE.Mesh(ringGeo, teleMat(0xff4030, 0.8));
    const fill = new THREE.Mesh(discGeo, teleMat(0xff4030, 0.28));
    const line = new THREE.Mesh(lineGeo, teleMat(0xff4030, 0.18));
    const lineFill = new THREE.Mesh(lineGeo, teleMat(0xff4030, 0.32));
    for (const m of [ring, fill, line, lineFill]) { m.visible = false; m.renderOrder = 2; world.add(m); }
    teles.push({ ring, fill, line, lineFill });
  }

  // Swing arcs and expanding rings.
  const swings = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(geo('arc110', () => arcGeo(110)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; m.renderOrder = 3; world.add(m);
    swings.push({ m, life: 0, max: 0.16 });
  }
  function arcGeo(deg) {
    const g = new THREE.RingGeometry(0.3, 1, 18, 1, -((deg * Math.PI) / 360), (deg * Math.PI) / 180);
    g.rotateX(-Math.PI / 2);
    return g;
  }
  const rings = [];
  const ringThin = new THREE.RingGeometry(0.82, 1, 48); ringThin.rotateX(-Math.PI / 2);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(ringThin, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.visible = false; m.renderOrder = 3; world.add(m);
    rings.push({ m, life: 0, max: 0.35, r: 1 });
  }

  // Shared small meshes for characters.
  const shadowGeo = new THREE.CircleGeometry(1, 16); shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false });
  const eliteRingGeo = new THREE.RingGeometry(0.85, 1.05, 28); eliteRingGeo.rotateX(-Math.PI / 2);
  const barGeo = new THREE.PlaneGeometry(1, 1); barGeo.translate(0.5, 0, 0);
  const barBg = new THREE.MeshBasicMaterial({ color: 0x101014, depthTest: false });
  const barFg = new THREE.MeshBasicMaterial({ color: 0xe25c5c, depthTest: false });
  const barWard = new THREE.MeshBasicMaterial({ color: 0xd8a0ff, depthTest: false });

  // ---------------------------------------------------------------- camera
  function onResize(w, h) {
    R.w = w; R.h = h;
    camera.aspect = w / h;
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    const dW = VIEW_W / 2 / Math.tan(hf);
    const dH = VIEW_H / 2 / Math.tan(vf);
    R.camDist = Math.max(dW, dH) * 0.95;
    camera.updateProjectionMatrix();
  }
  const offResize = stage.onResize(onResize);

  function placeCamera(dt, snap) {
    const P = R.G.P;
    const tx = P.x, tz = P.y + 1.2;
    const k = snap ? 1 : 1 - Math.exp(-9 * dt);
    R.camX += (tx - R.camX) * k; R.camZ += (tz - R.camZ) * k;
    let sx = 0, sz = 0;
    if (R.shake > 0.001) {
      R.shakeT += dt * 50;
      sx = Math.sin(R.shakeT * 1.3) * R.shake * 0.5; sz = Math.cos(R.shakeT * 1.7) * R.shake * 0.5;
      R.shake *= Math.exp(-7 * dt);
    }
    const d = R.camDist || 30;
    camera.position.set(R.camX + sx, Math.sin(CAM_EL) * d, R.camZ + Math.cos(CAM_EL) * d + sz);
    camera.lookAt(R.camX + sx, 0, R.camZ + sz);
  }

  // ---------------------------------------------------------------- tiles
  function clearTiles() {
    if (!R.tileGroup) return;
    world.remove(R.tileGroup);
    for (const m of [R.floorMesh, R.wallMesh, R.hazMesh, R.spikeMesh]) if (m) m.dispose();
    R.tileGroup = null;
  }

  function buildTiles() {
    clearTiles();
    const G = R.G, W = G.w, H = G.h, tiles = G.tiles, b = G.biome;
    const grp = new THREE.Group();
    let nF = 0, nW = 0, nH = 0, nS = 0;
    const isWallish = (t) => t === T.WALL || t === T.SECRET;
    const nearOpen = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (!isWallish(tiles[ny * W + nx])) return true;
      }
      return false;
    };
    const wallFlags = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = tiles[i];
      if (isWallish(t)) { if (t === T.SECRET || nearOpen(x, y)) { wallFlags[i] = 1; nW++; } }
      else if (t === T.HAZARD) nH++;
      else { nF++; if (t === T.SPIKES) nS++; }
    }
    R.floorIdx = new Int32Array(W * H).fill(-1); R.wallIdx = new Int32Array(W * H).fill(-1); R.hazIdx = new Int32Array(W * H).fill(-1);
    R.floorBase = new Float32Array(Math.max(1, nF) * 3); R.wallBase = new Float32Array(Math.max(1, nW) * 3); R.hazBase = new Float32Array(Math.max(1, nH) * 3);
    const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, Math.max(1, nF));
    const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, Math.max(1, nW));
    const hazMesh = new THREE.InstancedMesh(floorGeo, hazMat, Math.max(1, nH));
    const spikeMesh = new THREE.InstancedMesh(spikeGeo, spikeMat, Math.max(1, nS));
    floorMesh.count = nF; wallMesh.count = nW; hazMesh.count = nH; spikeMesh.count = nS;
    const cF = new THREE.Color(b.floor), cF2 = new THREE.Color(b.floorAlt), cW = new THREE.Color(b.wall), cW2 = new THREE.Color(b.wallAlt), cS = new THREE.Color(b.secret), cH = new THREE.Color(b.hazardColor);
    let iF = 0, iW = 0, iH = 0, iS = 0;
    R.spikeList = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = tiles[i];
      const n = hash2(x, y);
      if (wallFlags[i]) {
        const hgt = 0.92 + hash2(x + 7, y + 3) * 0.2;
        tmpM.makeScale(1, hgt, 1); tmpM.setPosition(x + 0.5, 0, y + 0.5);
        wallMesh.setMatrixAt(iW, tmpM);
        tmpC.copy(t === T.SECRET ? cS : (n > 0.5 ? cW : cW2)).multiplyScalar(0.9 + n * 0.2);
        R.wallBase[iW * 3] = tmpC.r; R.wallBase[iW * 3 + 1] = tmpC.g; R.wallBase[iW * 3 + 2] = tmpC.b;
        wallMesh.setColorAt(iW, tmpC.setRGB(0, 0, 0));
        R.wallIdx[i] = iW++;
      } else if (t === T.HAZARD) {
        tmpM.makeTranslation(x + 0.5, -0.02, y + 0.5);
        hazMesh.setMatrixAt(iH, tmpM);
        tmpC.copy(cH).multiplyScalar(0.85 + n * 0.3);
        R.hazBase[iH * 3] = tmpC.r; R.hazBase[iH * 3 + 1] = tmpC.g; R.hazBase[iH * 3 + 2] = tmpC.b;
        hazMesh.setColorAt(iH, tmpC.setRGB(0, 0, 0));
        R.hazIdx[i] = iH++;
      } else if (!isWallish(t)) {
        tmpM.makeTranslation(x + 0.5, 0, y + 0.5);
        floorMesh.setMatrixAt(iF, tmpM);
        tmpC.copy(((x + y) & 1) ? cF : cF2).multiplyScalar(0.88 + n * 0.24);
        if (t === T.SPIKES) tmpC.multiplyScalar(0.7);
        R.floorBase[iF * 3] = tmpC.r; R.floorBase[iF * 3 + 1] = tmpC.g; R.floorBase[iF * 3 + 2] = tmpC.b;
        floorMesh.setColorAt(iF, tmpC.setRGB(0, 0, 0));
        R.floorIdx[i] = iF++;
        if (t === T.SPIKES) { R.spikeList.push(i, iS); tmpM.makeTranslation(x + 0.5, -0.4, y + 0.5); spikeMesh.setMatrixAt(iS++, tmpM); }
      }
    }
    for (const m of [floorMesh, wallMesh, hazMesh, spikeMesh]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      grp.add(m);
    }
    R.floorMesh = floorMesh; R.wallMesh = wallMesh; R.hazMesh = hazMesh; R.spikeMesh = spikeMesh;
    R.tileGroup = grp;
    world.add(grp);
    R.fogVersion = -1;
    R.fullFog = true;
    buildDoors();
  }

  function setTileFog(i, f) {
    let k = R.floorIdx[i];
    if (k >= 0) { tmpC.setRGB(R.floorBase[k * 3] * f, R.floorBase[k * 3 + 1] * f, R.floorBase[k * 3 + 2] * f); R.floorMesh.setColorAt(k, tmpC); }
    k = R.wallIdx[i];
    if (k >= 0) { tmpC.setRGB(R.wallBase[k * 3] * f, R.wallBase[k * 3 + 1] * f, R.wallBase[k * 3 + 2] * f); R.wallMesh.setColorAt(k, tmpC); }
    k = R.hazIdx[i];
    if (k >= 0) { tmpC.setRGB(R.hazBase[k * 3] * f, R.hazBase[k * 3 + 1] * f, R.hazBase[k * 3 + 2] * f); R.hazMesh.setColorAt(k, tmpC); }
  }

  function updateFog() {
    const G = R.G;
    if (G.fogVersion === R.fogVersion && !R.fullFog) return;
    const { vis, seen } = G;
    if (R.fullFog || G.fogFull) {
      for (let i = 0; i < G.w * G.h; i++) setTileFog(i, vis[i] ? 1 : seen[i] ? SEEN_DIM : 0);
      G.fogFull = false; R.fullFog = false;
    } else {
      for (let k = 0; k < R.prevN; k++) { const i = R.prevVis[k]; setTileFog(i, vis[i] ? 1 : seen[i] ? SEEN_DIM : 0); }
      for (let k = 0; k < G.visN; k++) setTileFog(G.visList[k], 1);
    }
    if (R.prevVis.length < G.visList.length) R.prevVis = new Int32Array(G.visList.length);
    R.prevVis.set(G.visList.subarray(0, G.visN));
    R.prevN = G.visN;
    R.fogVersion = G.fogVersion;
    for (const m of [R.floorMesh, R.wallMesh, R.hazMesh]) if (m && m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- doors, barriers, stairs
  function clearDoors() {
    for (const d of R.doors) world.remove(d.g);
    for (const b of R.barriers) world.remove(b.g);
    R.doors = []; R.barriers = [];
  }
  function buildDoors() {
    clearDoors();
    const G = R.G, W = G.w;
    for (let i = 0; i < G.tiles.length; i++) {
      if (G.tiles[i] !== T.DOOR) continue;
      const x = i % W, y = (i / W) | 0;
      const g = new THREE.Group();
      g.position.set(x + 0.5, 0, y + 0.5);
      const horiz = G.tiles[i - 1] !== T.WALL || G.tiles[i + 1] !== T.WALL;
      const inner = new THREE.Group(); if (horiz) inner.rotation.y = Math.PI / 2; g.add(inner);
      const wood = lam(0x6a4424), gold = lam(0xffd24a);
      const add = (geom, mat, px, py, pz) => { const m = new THREE.Mesh(geom, mat); m.position.set(px, py, pz); inner.add(m); };
      add(box(1, 1.15, 0.36), wood, 0, 0.575, 0);
      add(box(1.02, 0.1, 0.38), gold, 0, 0.3, 0);
      add(box(1.02, 0.1, 0.38), gold, 0, 0.85, 0);
      add(box(0.22, 0.26, 0.42), gold, 0, 0.58, 0);
      add(box(0.06, 0.1, 0.44), lam(0x14141c), 0, 0.56, 0);
      world.add(g);
      R.doors.push({ g, i });
    }
    if (G.fl.arena) {
      for (const [x, y] of G.fl.arena.gate) {
        const g = new THREE.Mesh(box(1, 1.5, 1), glow(0xff4030, 0.45));
        g.position.set(x + 0.5, 0.75, y + 0.5);
        g.visible = false;
        world.add(g);
        R.barriers.push({ g, i: y * W + x });
      }
    }
    if (!R.stairs) {
      const g = new THREE.Group();
      const hole = new THREE.Mesh(box(0.92, 0.02, 0.92), basic(0x000000)); hole.position.y = 0.01; g.add(hole);
      for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(box(0.8, 0.1, 0.24), lam(0x7a7480)); s.position.set(0, -0.05 - k * 0.12, -0.3 + k * 0.24); g.add(s); }
      const ring = new THREE.Mesh(geo('ring2', () => { const r = new THREE.RingGeometry(0.55, 0.68, 28); r.rotateX(-Math.PI / 2); return r; }), glow(0x8fd8ff, 0.7));
      ring.position.y = 0.04; g.add(ring);
      const beam = new THREE.Mesh(cyl(0.45, 0.45, 2.4, 14), glow(0x8fd8ff, 0.12)); beam.position.y = 1.2; g.add(beam);
      R.stairs = { g, ring, beam };
      world.add(g);
    }
    R.stairs.g.position.set(G.fl.stairs.x + 0.5, 0, G.fl.stairs.y + 0.5);
  }

  function updateDoors(t) {
    const G = R.G;
    for (const d of R.doors) d.g.visible = G.tiles[d.i] === T.DOOR && !!G.seen[d.i];
    for (const b of R.barriers) { b.g.visible = G.tiles[b.i] === T.BARRIER; b.g.material.opacity = 0.35 + Math.sin(t * 6) * 0.12; }
    const s = G.fl.stairs, si = s.y * G.w + s.x;
    const open = G.tiles[si] === T.STAIRS;
    R.stairs.g.visible = open && !!G.seen[si];
    R.stairs.ring.material.opacity = 0.5 + Math.sin(t * 3) * 0.25;
    R.stairs.ring.rotation.y = t * 0.5;
    // Spikes.
    const L = R.spikeList;
    if (L && L.length) {
      for (let k = 0; k < L.length; k += 2) {
        const i = L[k], idx = L[k + 1];
        const st = spikeActive(G, i);
        const y = !G.seen[i] ? -1 : st === 2 ? 0 : st === 1 ? -0.24 + Math.sin(t * 40) * 0.03 : -0.4;
        tmpM.makeTranslation((i % G.w) + 0.5, y, ((i / G.w) | 0) + 0.5);
        R.spikeMesh.setMatrixAt(idx, tmpM);
      }
      R.spikeMesh.instanceMatrix.needsUpdate = true;
    }
    hazMat.color.setScalar(0.85 + Math.sin(t * 2.2) * 0.15);
  }

  // ---------------------------------------------------------------- props
  function clearProps() { for (const v of R.props.values()) world.remove(v.group); R.props.clear(); }
  function buildProps() {
    clearProps();
    for (const o of R.G.objects) {
      const v = buildProp(o, R.G.biome);
      v.group.position.set(o.x + 0.5, 0, o.y + 0.5);
      v.group.rotation.y = o.kind === 'chest' ? (hash2(o.x, o.y) - 0.5) * 0.6 : 0;
      world.add(v.group);
      R.props.set(o.id, v);
      v.o = o;
    }
  }
  function updateProps(t) {
    const G = R.G;
    for (const v of R.props.values()) {
      const o = v.o;
      const i = o.y * G.w + o.x;
      const seen = !!G.seen[i];
      let show = seen;
      if (o.used && (o.kind === 'crate' || o.kind === 'key' || o.kind === 'gold' || o.kind === 'pedestal')) show = false;
      v.group.visible = show;
      if (!show) continue;
      if (o.kind === 'chest') {
        if (o.used) { v.lid.rotation.x += (-1.9 - v.lid.rotation.x) * 0.2; if (v.orb) v.orb.visible = false; }
        else if (v.orb) { v.orb.position.y = 0.85 + Math.sin(t * 3 + o.id) * 0.08; v.orb.rotation.y = t * 2; }
      } else if (o.kind === 'shrine') {
        if (v.orb) { v.orb.visible = !o.used; v.orb.position.y = (o.shrine === 'fountain' ? 0.78 : 1.15) + Math.sin(t * 2 + o.id) * 0.06; v.orb.rotation.y = t * 1.5; }
        if (v.ring) v.ring.visible = !o.used;
      } else if (o.kind === 'pedestal' && v.item) { v.item.rotation.y = t * 2; v.item.position.y = 0.8 + Math.sin(t * 2.5 + o.id) * 0.05; }
      else if (o.kind === 'key' && v.spin) { v.spin.rotation.y = t * 3; v.spin.position.y = 0.45 + Math.sin(t * 3) * 0.06; }
    }
  }

  // ---------------------------------------------------------------- pickups
  const pickPool = new Map();
  function updatePickups(t) {
    const G = R.G;
    R.frame++;
    for (const p of G.pickups) {
      if (!p.on) continue;
      let v = R.pickups.get(p.id);
      if (!v) {
        const key = p.kind === 'item' ? `item${p.item ? p.item.rarity : 0}` : p.kind;
        const pool = pickPool.get(key);
        v = pool && pool.length ? pool.pop() : buildPickup(p);
        v.key = key;
        world.add(v.group);
        R.pickups.set(p.id, v);
      }
      v.f = R.frame;
      const i = Math.floor(p.y) * G.w + Math.floor(p.x);
      v.group.visible = !!G.vis[i];
      v.group.position.set(p.x, 0.25 + Math.sin(t * 4 + p.id) * 0.06 + Math.max(0, 0.5 - p.age) * 0.8, p.y);
      v.spin.rotation.y = t * 3 + p.id;
    }
    for (const [id, v] of R.pickups) {
      if (v.f === R.frame) continue;
      world.remove(v.group);
      R.pickups.delete(id);
      let pool = pickPool.get(v.key);
      if (!pool) { pool = []; pickPool.set(v.key, pool); }
      if (pool.length < 30) pool.push(v);
    }
  }

  // ---------------------------------------------------------------- characters
  function wrapChar(v, r) {
    const root = new THREE.Group();
    root.add(v.group);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = 0.02; sh.scale.setScalar(r * 1.1); root.add(sh);
    v.root = root; v.shadow = sh;
    return v;
  }
  function addBar(v, height) {
    const bar = new THREE.Group();
    bar.position.y = height;
    bar.rotation.x = -CAM_EL;
    const bg = new THREE.Mesh(barGeo, barBg); bg.scale.set(0.9, 0.11, 1); bg.position.x = -0.45; bg.renderOrder = 10;
    const fg = new THREE.Mesh(barGeo, barFg); fg.scale.set(0.86, 0.07, 1); fg.position.set(-0.43, 0, 0.001); fg.renderOrder = 11;
    const wd = new THREE.Mesh(barGeo, barWard); wd.scale.set(0.86, 0.03, 1); wd.position.set(-0.43, 0.06, 0.002); wd.renderOrder = 11;
    bar.add(bg, fg, wd);
    v.root.add(bar);
    v.bar = bar; v.barFg = fg; v.barWard = wd;
  }

  function acquireEnemy(e) {
    const key = `${e.type}|${e.elite ? e.elite[0] : ''}`;
    const pool = R.pools.get(key);
    let v = pool && pool.length ? pool.pop() : null;
    if (!v) {
      const def = e.def;
      v = buildCharacter(def.model, def.color, def.accent, { crown: e.boss ? def.crown : null });
      wrapChar(v, Math.max(0.3, e.r));
      if (e.def.model === 'humanoid' || e.def.model === 'knight') {
        const kind = e.def.ai === 'kiter' ? 'bow' : e.def.ai === 'shielded' ? 'sword' : e.def.model === 'knight' ? 'sword' : 'axe';
        if (v.weaponHolder) v.weaponHolder.add(buildWeapon(kind, 0xb8b8c0, 0x5a4030));
      }
      if (e.elite) {
        const col = ELITES[e.elite[0]] ? ELITES[e.elite[0]].color : 0xffffff;
        v.ring = new THREE.Mesh(eliteRingGeo, glow(col, 0.85)); v.ring.position.y = 0.03; v.ring.scale.setScalar(e.r * 1.25); v.root.add(v.ring);
        v.aura = new THREE.Mesh(sph(1, 1), glow(col, 0.12)); v.aura.scale.setScalar(e.r * 1.6); v.aura.position.y = 0.5; v.root.add(v.aura);
      }
      if (e.boss) { v.ring = new THREE.Mesh(eliteRingGeo, glow(0xff4030, 0.8)); v.ring.position.y = 0.03; v.ring.scale.setScalar(e.r * 1.3); v.root.add(v.ring); }
      v.ward = new THREE.Mesh(sph(1, 2), glow(0xd8a0ff, 0.22)); v.ward.visible = false; v.root.add(v.ward);
      addBar(v, (v.height || 1) * (e.scale || 1) + 0.35);
      v.key = key;
    }
    v.group.scale.setScalar((e.scale || 1) * CHAR_SCALE);
    v.shadow.scale.setScalar(Math.max(0.3, e.r) * 1.1);
    v.bar.position.y = (v.height || 1) * (e.scale || 1) + 0.35;
    v.ward.scale.setScalar(e.r * 1.5); v.ward.position.y = e.r;
    v.bar.visible = false;
    setCharMaterial(v, null);
    world.add(v.root);
    return v;
  }
  function releaseEnemy(id, v) {
    world.remove(v.root);
    R.enemies.delete(id);
    let pool = R.pools.get(v.key);
    if (!pool) { pool = []; R.pools.set(v.key, pool); }
    if (pool.length < 24) pool.push(v);
  }

  function animChar(v, moving, t, speedK, atk, ent) {
    const swing = moving ? Math.sin(t * 11 * speedK) : 0;
    if (v.legs.length === 2) { v.legs[0].rotation.x = swing * 0.6; v.legs[1].rotation.x = -swing * 0.6; }
    else if (v.legs.length === 4) { v.legs[0].rotation.x = v.legs[3].rotation.x = swing * 0.6; v.legs[1].rotation.x = v.legs[2].rotation.x = -swing * 0.6; }
    if (v.arms.length === 2 && v.model !== 'floater') {
      v.arms[0].rotation.x = -swing * 0.5;
      v.arms[1].rotation.x = atk > 0 ? -1.6 + (1 - atk) * 2.4 : swing * 0.5;
    } else if (v.arms.length === 1) v.arms[0].rotation.x = atk > 0 ? -1.2 * atk : 0;
    for (let k = 0; k < v.wings.length; k++) v.wings[k].rotation.z = Math.sin(t * 22 + (ent ? ent.id : 0)) * 0.7 * (k ? -1 : 1);
    let bob = moving ? Math.abs(Math.sin(t * 11 * speedK)) * 0.07 : 0;
    if (v.hover) bob = v.hover + Math.sin(t * 3 + (ent ? ent.id : 0)) * 0.08;
    v.body.position.y = bob;
  }

  function updateEnemies(t, dt) {
    const G = R.G;
    const fr = ++R.frame;
    for (const e of G.enemies) {
      if (e.dead) continue;
      let v = R.enemies.get(e.id);
      if (!v) { v = acquireEnemy(e); R.enemies.set(e.id, v); }
      v.f = fr;
      const i = Math.floor(e.y) * G.w + Math.floor(e.x);
      const show = !!G.vis[i] || e.boss && G.arenaSealed;
      v.root.visible = show;
      if (!show) continue;
      v.root.position.set(e.x, 0, e.y);
      v.group.rotation.y = Math.atan2(e.faceX, e.faceY);
      const moving = Math.abs(e.mvx || 0) + Math.abs(e.mvy || 0) > 0.1 || e.state === 'charge';
      const atk = e.state === 'recover' ? Math.max(0, e.t / 0.35) : 0;
      animChar(v, moving, t, e.state === 'charge' ? 2 : 1, atk, e);
      // Squash and stretch.
      let sx = 1, sy = 1;
      if (e.def.ai === 'splitter') { const h = Math.max(0, Math.sin(e.hop)); sy = 0.85 + h * 0.3; sx = 1.1 - h * 0.15; v.body.position.y = h * 0.25; }
      if (e.tele > 0) { const p = 1 + e.tele * 0.12; sx *= p; sy *= p; v.group.rotation.x = -e.tele * 0.15; } else v.group.rotation.x = 0;
      const sc = (e.scale || 1) * CHAR_SCALE * Math.max(0.05, e.alpha);
      v.group.scale.set(sc * sx, sc * sy, sc * sx);
      v.group.position.y = e.z || 0;
      v.shadow.scale.setScalar(Math.max(0.3, e.r) * 1.1 * (1 - Math.min(0.6, (e.z || 0) * 0.15)));
      const blink = e.tele > 0.55 && Math.sin(t * 40) > 0;
      setCharMaterial(v, e.flash > 0 ? FLASH : e.s.frozenT > 0 ? ICE : blink ? TELE : null);
      if (v.ring) v.ring.rotation.y = t * 1.5;
      if (v.eye && e.def.model === 'eye') v.eye.scale.setScalar(1 + e.tele * 0.6);
      v.ward.visible = e.ward > 0;
      if (e.hp < e.maxHp && !e.boss) {
        v.bar.visible = true;
        v.barFg.scale.x = 0.86 * Math.max(0, e.hp / e.maxHp);
        v.barWard.scale.x = e.wardMax ? 0.86 * (e.ward / e.wardMax) : 0;
      } else v.bar.visible = false;
      // Status particles.
      if (Math.random() < dt * 8) {
        if (e.s.burnT > 0) burst(e.x, 0.6, e.y, 1, 0xff8a30, 0.6, 0.5, 0.1, -2, 1.5);
        if (e.s.poisonN > 0) burst(e.x, 0.5, e.y, 1, 0x8ee04a, 0.5, 0.6, 0.08, -1, 1);
        if (e.s.shockT > 0) burst(e.x, 0.7, e.y, 1, 0xffe14a, 2.5, 0.2, 0.06, 0, 1);
        if (e.s.bleedN > 0) burst(e.x, 0.6, e.y, 1, 0xc01020, 0.4, 0.5, 0.07, 6, 0.5);
        if (e.s.stunT > 0) burst(e.x, (v.height || 1) * e.scale + 0.2, e.y, 1, 0xffffa0, 1, 0.3, 0.07, 0, 0.5);
      }
    }
    for (const [id, v] of R.enemies) if (v.f !== fr) releaseEnemy(id, v);
  }

  function buildPlayer() {
    const P = R.G.P;
    const cls = CLASSES[P.classId];
    if (R.player && R.player.cls === P.classId) return;
    if (R.player) { world.remove(R.player.root); R.player.bubble.material.dispose(); }
    const opts = P.classId === 'warden' ? { shield: true } : P.classId === 'arcanist' ? { hat: 0x5a3aa0 } : P.classId === 'stalker' ? { hood: 0x2a4a36 } : { cape: 0x6a1020 };
    const v = buildCharacter('player', cls.color, cls.accent, opts);
    wrapChar(v, 0.34);
    v.group.scale.setScalar(CHAR_SCALE);
    v.cls = P.classId;
    v.bubble = new THREE.Mesh(sph(0.75, 2), new THREE.MeshBasicMaterial({ color: 0x60a8ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); v.bubble.position.y = 0.55; v.bubble.visible = false; v.root.add(v.bubble);
    v.light = new THREE.Mesh(geo('ring3', () => { const r = new THREE.RingGeometry(0.42, 0.5, 24); r.rotateX(-Math.PI / 2); return r; }), glow(0x8fd8ff, 0.5));
    v.light.position.y = 0.03; v.root.add(v.light);
    world.add(v.root);
    R.player = v;
    R.playerWeapon = '';
  }

  function updatePlayer(t, dt) {
    const G = R.G, P = G.P, v = R.player, st = P.st;
    if (R.playerWeapon !== st.weaponBase) {
      R.playerWeapon = st.weaponBase;
      v.weaponHolder.clear();
      v.weaponHolder.add(buildWeapon(st.weaponBase, 0xd8dce8, 0x7a5030));
    }
    v.root.position.set(P.x, 0, P.y);
    v.group.rotation.y = Math.atan2(P.faceX, P.faceY);
    const atk = P.atkAnim > 0 ? Math.min(1, P.atkAnim / 0.25) : 0;
    animChar(v, P.moving, t, 1 + st.moveSpd, atk, null);
    const lunge = P.lunge > 0 ? P.lunge * 1.5 : 0;
    v.group.position.set(P.aimX * lunge, 0, P.aimY * lunge);
    v.group.rotation.x = P.dashT > 0 ? 0.35 : 0;
    setCharMaterial(v, P.flash > 0 ? FLASH : P.s.frozenT > 0 ? ICE : null);
    v.root.visible = !P.dead && !(P.iframes > 0 && P.dashT <= 0 && P.flash <= 0 && P.iframes < 0.9 && Math.sin(t * 50) > 0.3);
    v.bubble.visible = P.bulwarkT > 0 || P.wardHp > 0;
    if (v.bubble.visible) { v.bubble.material.color.set(P.bulwarkT > 0 ? 0x60a8ff : 0xc070ff); v.bubble.material.opacity = 0.25 + Math.sin(t * 8) * 0.05; }
    v.light.visible = !!(st.fx.barrier && P.barrierCd <= 0);
    if (P.dashT > 0) burst(P.x, 0.5, P.y, 2, CLASSES[P.classId].color, 0.5, 0.25, 0.14, 0, 0.3);
    if (P.furyT > 0 && Math.random() < dt * 10) burst(P.x, 0.7, P.y, 1, 0xff5020, 1, 0.4, 0.08, -2, 1);
    // Torch.
    const fl = 1 + Math.sin(t * 13) * 0.04 + Math.sin(t * 7.3) * 0.03;
    torch.position.set(P.x, 2.4, P.y + 0.2);
    torch.intensity = LIGHT_I * fl;
    // Orbs.
    const n = st.fx.orbs || 0;
    while (R.orbs.length < n) { const m = new THREE.Mesh(sph(0.16, 1), glow(0xffe080, 0.95)); world.add(m); R.orbs.push(m); }
    for (let k = 0; k < R.orbs.length; k++) {
      const m = R.orbs[k];
      m.visible = k < n && !P.dead;
      if (!m.visible) continue;
      const a = P.orbA + (k / n) * Math.PI * 2;
      m.position.set(P.x + Math.cos(a) * 1.5, 0.6, P.y + Math.sin(a) * 1.5);
    }
    // Decoy.
    if (G.decoy) {
      if (!R.decoy) {
        const g = new THREE.Group();
        const b = new THREE.Mesh(cyl(0.2, 0.25, 0.7, 8), glow(0xa08cff, 0.55)); b.position.y = 0.4; g.add(b);
        const h = new THREE.Mesh(sph(0.16, 1), glow(0xa08cff, 0.65)); h.position.y = 0.9; g.add(h);
        world.add(g); R.decoy = g;
      }
      R.decoy.visible = true;
      R.decoy.position.set(G.decoy.x, Math.sin(t * 4) * 0.05, G.decoy.y);
    } else if (R.decoy) R.decoy.visible = false;
  }

  // ---------------------------------------------------------------- projectiles, zones, telegraphs
  function updateProjs() {
    const G = R.G;
    let n = 0, nh = 0;
    for (let k = 0; k < MAX_PROJ; k++) {
      const p = G.projs[k];
      if (!p.on) continue;
      const i = Math.floor(p.y) * G.w + Math.floor(p.x);
      if (!G.vis[i]) continue;
      const col = PROJ_COLORS[p.kind] || 0xffffff;
      const ang = Math.atan2(p.vx, p.vy);
      tmpQ.setFromAxisAngle(yAxis, ang);
      let r = p.r * 1.2, len = 1;
      if (p.kind === 'arrow' || p.kind === 'bolt' || p.kind === 'knife') { r = 0.06; len = p.kind === 'knife' ? 3 : 5; }
      if (p.kind === 'bomb') r = 0.16;
      tmpS.set(r, r, r * len);
      tmpP.set(p.x, p.bomb ? 0.3 + p.z : 0.55, p.y);
      tmpM.compose(tmpP, tmpQ, tmpS);
      projCore.setMatrixAt(n, tmpM);
      projCore.setColorAt(n, tmpC.set(col));
      n++;
      if (p.fac === 1 || p.kind === 'fireball' || p.kind === 'orb' || p.kind === 'spark') {
        tmpS.set(r * 2.4, r * 2.4, r * 2.4 * (len > 1 ? 2 : 1));
        tmpM.compose(tmpP, tmpQ, tmpS);
        projHalo.setMatrixAt(nh, tmpM);
        projHalo.setColorAt(nh, tmpC.set(p.fac === 1 ? col : col));
        nh++;
      }
    }
    projCore.count = n; projHalo.count = nh;
    for (const m of [projCore, projHalo]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }

  function updateZones() {
    const G = R.G;
    let n = 0;
    for (const z of G.zones) {
      if (!z.on) continue;
      const f = Math.min(1, z.t / Math.min(1, z.max)) * (0.8 + Math.sin(z.t * 8 + z.x) * 0.2);
      tmpM.makeScale(z.r, 1, z.r); tmpM.setPosition(z.x, 0.02 + n * 0.0005, z.y);
      zoneMesh.setMatrixAt(n, tmpM);
      tmpC.set(ZONE_COLORS[z.kind] || 0xffffff).multiplyScalar(f);
      zoneMesh.setColorAt(n, tmpC);
      n++;
    }
    zoneMesh.count = n;
    zoneMesh.instanceMatrix.needsUpdate = true;
    if (zoneMesh.instanceColor) zoneMesh.instanceColor.needsUpdate = true;
  }

  function updateTeles() {
    const G = R.G;
    for (let i = 0; i < MAX_TELE; i++) {
      const t = G.tele[i], m = teles[i];
      if (!t.on) { m.ring.visible = m.fill.visible = m.line.visible = m.lineFill.visible = false; continue; }
      const prog = Math.min(1, t.t / t.total);
      const col = t.color || (t.fac === 0 ? 0xffa040 : 0xff3a28);
      if (t.kind === 0) {
        m.line.visible = m.lineFill.visible = false;
        m.ring.visible = m.fill.visible = true;
        m.ring.material = teleMat(col, t.visual ? 0.6 : 0.85);
        m.fill.material = teleMat(col, t.visual ? 0.18 : 0.3);
        m.ring.position.set(t.x, 0.04, t.y); m.ring.scale.setScalar(t.r);
        m.fill.position.set(t.x, 0.035, t.y); m.fill.scale.setScalar(Math.max(0.01, t.r * prog));
      } else {
        m.ring.visible = m.fill.visible = false;
        m.line.visible = m.lineFill.visible = true;
        const ang = Math.atan2(t.dx, t.dy);
        m.line.material = teleMat(col, 0.16); m.lineFill.material = teleMat(col, 0.34);
        m.line.position.set(t.x, 0.04, t.y); m.line.rotation.y = ang; m.line.scale.set(t.w, 1, t.len);
        m.lineFill.position.set(t.x, 0.045, t.y); m.lineFill.rotation.y = ang; m.lineFill.scale.set(t.w, 1, Math.max(0.01, t.len * prog));
      }
    }
  }

  // ---------------------------------------------------------------- particles and effects
  function burst(x, y, z, n, color, spd, life, size, grav = 9, up = 2) {
    tmpC.set(color);
    for (let k = 0; k < n; k++) {
      if (P_.n >= PCAP) return;
      const i = P_.n++;
      const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.8);
      P_.x[i] = x; P_.y[i] = y; P_.z[i] = z;
      P_.vx[i] = Math.cos(a) * s; P_.vz[i] = Math.sin(a) * s; P_.vy[i] = up * (0.5 + Math.random());
      P_.life[i] = P_.max[i] = life * (0.6 + Math.random() * 0.6);
      P_.size[i] = size * (0.7 + Math.random() * 0.6);
      P_.r[i] = tmpC.r; P_.g[i] = tmpC.g; P_.b[i] = tmpC.b; P_.grav[i] = grav;
    }
  }
  function updateParticles(dt) {
    let i = 0;
    while (i < P_.n) {
      P_.life[i] -= dt;
      if (P_.life[i] <= 0) {
        const j = --P_.n;
        for (const key of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'life', 'max', 'size', 'r', 'g', 'b', 'grav']) P_[key][i] = P_[key][j];
        continue;
      }
      P_.vy[i] -= P_.grav[i] * dt;
      P_.x[i] += P_.vx[i] * dt; P_.y[i] += P_.vy[i] * dt; P_.z[i] += P_.vz[i] * dt;
      if (P_.y[i] < 0.03) { P_.y[i] = 0.03; P_.vy[i] *= -0.3; P_.vx[i] *= 0.6; P_.vz[i] *= 0.6; }
      const s = P_.size[i] * Math.min(1, (P_.life[i] / P_.max[i]) * 1.5);
      tmpM.makeScale(s, s, s); tmpM.setPosition(P_.x[i], P_.y[i], P_.z[i]);
      partMesh.setMatrixAt(i, tmpM);
      partMesh.setColorAt(i, tmpC.setRGB(P_.r[i], P_.g[i], P_.b[i]));
      i++;
    }
    partMesh.count = P_.n;
    partMesh.instanceMatrix.needsUpdate = true;
    if (partMesh.instanceColor) partMesh.instanceColor.needsUpdate = true;
  }

  function addSwing(x, y, ax, ay, arcDeg, r, color, boss) {
    const s = swings.find((q) => q.life <= 0) || swings[0];
    const deg = Math.max(20, Math.min(340, Math.round(arcDeg / 10) * 10));
    s.m.geometry = geo(`arc${deg}`, () => arcGeo(deg));
    s.m.position.set(x, 0.35, y);
    s.m.rotation.set(0, -Math.atan2(ay, ax), 0);
    s.m.scale.setScalar(r);
    s.m.material.color.set(color);
    s.m.visible = true;
    s.life = s.max = boss ? 0.22 : 0.16;
  }
  function addRing(x, y, r, color, life = 0.35, y0 = 0.08) {
    const s = rings.find((q) => q.life <= 0) || rings[0];
    s.m.position.set(x, y0, y);
    s.m.material.color.set(color);
    s.m.visible = true;
    s.life = s.max = life; s.r = r;
  }
  function addBolt(x1, y1, x2, y2, color) {
    const segs = 5, pts = [];
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    const px = -dy / l, py = dx / l;
    for (let k = 0; k <= segs; k++) {
      const f = k / segs, off = k === 0 || k === segs ? 0 : (Math.random() - 0.5) * Math.min(0.8, l * 0.25);
      pts.push(x1 + dx * f + px * off, y1 + dy * f + py * off);
    }
    bolts.push({ pts, life: 0.18, max: 0.18, color: color || 0xfff080 });
    if (bolts.length > 30) bolts.shift();
  }
  function updateEffects(dt) {
    for (const s of swings) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.m.material.opacity = Math.max(0, s.life / s.max) * 0.75;
      if (s.life <= 0) s.m.visible = false;
    }
    for (const s of rings) {
      if (s.life <= 0) continue;
      s.life -= dt;
      const k = 1 - Math.max(0, s.life / s.max);
      s.m.scale.setScalar(0.2 + s.r * k);
      s.m.material.opacity = (1 - k) * 0.9;
      if (s.life <= 0) s.m.visible = false;
    }
    let n = 0;
    for (let b = bolts.length - 1; b >= 0; b--) {
      const B = bolts[b];
      B.life -= dt;
      if (B.life <= 0) { bolts.splice(b, 1); continue; }
      const f = B.life / B.max;
      for (let k = 0; k + 3 < B.pts.length && n < 200; k += 2) {
        const ax = B.pts[k], ay = B.pts[k + 1], bx = B.pts[k + 2], by = B.pts[k + 3];
        const l = Math.hypot(bx - ax, by - ay);
        tmpQ.setFromAxisAngle(yAxis, Math.atan2(bx - ax, by - ay));
        tmpP.set((ax + bx) / 2, 0.7, (ay + by) / 2);
        tmpS.set(0.07 * (0.5 + f), 0.07 * (0.5 + f), l);
        tmpM.compose(tmpP, tmpQ, tmpS);
        boltMesh.setMatrixAt(n, tmpM);
        boltMesh.setColorAt(n, tmpC.set(B.color).multiplyScalar(0.5 + f * 0.5));
        n++;
      }
    }
    boltMesh.count = n;
    boltMesh.instanceMatrix.needsUpdate = true;
    if (boltMesh.instanceColor) boltMesh.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- public API
  function onEvent(e) {
    const G = R.G;
    switch (e.t) {
      case 'death': burst(e.x, 0.5, e.y, e.boss ? 60 : 14, e.color, e.boss ? 6 : 3, 0.7, e.boss ? 0.2 : 0.12); if (e.boss) { addRing(e.x, e.y, 6, 0xffd24a, 0.8); R.shake = 1; } break;
      case 'explode': burst(e.x, 0.4, e.y, Math.min(30, 8 + e.r * 6), e.color, e.r * 2.2, 0.5, 0.14, 4, 3); addRing(e.x, e.y, e.r, e.color, 0.3); break;
      case 'spark': burst(e.x, 0.55, e.y, 3, PROJ_COLORS[e.kind] || 0xffffff, 2, 0.2, 0.06, 4, 1); break;
      case 'swing': addSwing(e.x, e.y, e.ax, e.ay, e.arc, e.r, e.kind === 'bash' ? 0x80c0ff : 0xffffff, false); break;
      case 'eswing': addSwing(e.x, e.y, e.ax, e.ay, 100, e.r, 0xff6050, e.boss); break;
      case 'dash': burst(e.x, 0.3, e.y, 6, 0xd8e0f0, 1.5, 0.3, 0.1, 2, 0.5); break;
      case 'zap': if (e.sky) addBolt(e.x2 + 0.3, e.y2 - 3.5, e.x2, e.y2, 0xfff080); else addBolt(e.x1, e.y1, e.x2, e.y2, e.color); burst(e.x2, 0.6, e.y2, 3, e.color || 0xfff080, 2.5, 0.2, 0.06, 0, 1); break;
      case 'nova': addRing(e.x, e.y, e.r, e.color, 0.4); burst(e.x, 0.5, e.y, 24, e.color, e.r * 2.5, 0.4, 0.1, 2, 1); break;
      case 'freeze': burst(e.x, 0.6, e.y, 10, 0xbfeaff, 2, 0.5, 0.09, 4, 1.5); break;
      case 'burst': burst(e.x, 0.5, e.y, 14, e.color, 2.5, 0.5, 0.1, 3, 2); addRing(e.x, e.y, 1.6, e.color, 0.3); break;
      case 'rubble': case 'door': burst(e.x, 0.6, e.y, 22, G.biome.wall, 3, 0.8, 0.16, 10, 3); R.shake = Math.max(R.shake, 0.3); break;
      case 'crate': burst(e.x, 0.4, e.y, 12, 0x8a6a40, 2.5, 0.6, 0.12, 10, 3); break;
      case 'chest': burst(e.x, 0.5, e.y, 20, e.tier ? 0xffd24a : 0xffe8a0, 2.5, 0.8, 0.09, 3, 4); break;
      case 'summon': addRing(e.x, e.y, 1, e.color || 0xffffff, 0.4); burst(e.x, 0.3, e.y, 10, e.color || 0xffffff, 1.5, 0.5, 0.08, -2, 2); break;
      case 'potion': burst(e.x, 0.3, e.y, 16, 0xff6080, 1.2, 0.7, 0.09, -3, 2); break;
      case 'levelup': { const P = G.P; addRing(P.x, P.y, 2.5, 0xffd24a, 0.6); burst(P.x, 0.3, P.y, 30, 0xffd24a, 2, 0.9, 0.1, -3, 3); break; }
      case 'phoenix': addRing(e.x, e.y, 3.2, 0xff8a2a, 0.6); burst(e.x, 0.4, e.y, 40, 0xff8a2a, 4, 0.9, 0.14, -2, 4); break;
      case 'barrier': case 'block': burst(e.x, 0.6, e.y, 6, 0xd8e8ff, 2.5, 0.25, 0.07, 0, 1); break;
      case 'spike': burst(e.x, 0.3, e.y, 6, 0xc01020, 1.5, 0.4, 0.07, 8, 2); break;
      case 'dust': burst(e.x, 0.3, e.y, 12, 0xa09080, 2.5, 0.5, 0.12, 6, 2); break;
      case 'miasma': burst(e.x, 0.3, e.y, 8, 0x8ee04a, 2.8, 0.6, 0.08, -1, 0.5); break;
      case 'shake': R.shake = Math.max(R.shake, e.a); break;
      case 'phurt': R.shake = Math.max(R.shake, 0.18 + e.amt * 1.5); break;
      case 'tile': R.tilesDirty = true; break;
      case 'bossdead': R.tilesDirty = true; break;
      default: break;
    }
  }

  function setGame(G) {
    R.G = G;
    const b = G.biome;
    stage.scene.background = new THREE.Color(b.bg);
    ambient.color.set(b.ambient).lerp(new THREE.Color(0xffffff), 0.55);
    ambient.intensity = 2.3;
    torch.color.set(b.light);
    sun.color.set(b.light).lerp(new THREE.Color(0xffffff), 0.6);
    sun.intensity = 1.5;
    for (const [id, v] of R.enemies) releaseEnemy(id, v);
    R.pools.clear();
    for (const v of R.pickups.values()) world.remove(v.group);
    R.pickups.clear(); pickPool.clear();
    P_.n = 0; bolts.length = 0;
    buildTiles();
    buildProps();
    buildPlayer();
    R.camX = G.P.x; R.camZ = G.P.y + 1.2;
    R.tilesDirty = false;
    R.fullFog = true;
  }

  function sync(dt, t) {
    const G = R.G;
    if (!G) return;
    if (R.tilesDirty) { R.tilesDirty = false; buildTiles(); }
    updateFog();
    updateDoors(t);
    updateProps(t);
    updatePickups(t);
    updateEnemies(t, dt);
    updatePlayer(t, dt);
    updateProjs();
    updateZones();
    updateTeles();
    updateParticles(dt);
    updateEffects(dt);
    placeCamera(dt, false);
  }

  // World position -> CSS pixel position on the canvas.
  function project(x, h, y, out) {
    projV.set(x, h, y).project(camera);
    out.x = (projV.x + 1) * 0.5 * R.w;
    out.y = (1 - projV.y) * 0.5 * R.h;
    out.ok = projV.z < 1;
    return out;
  }

  function dispose() {
    offResize();
    clearTiles(); clearDoors(); clearProps();
    wallGeo.dispose(); floorGeo.dispose(); spikeGeo.dispose(); projGeo.dispose(); zoneGeo.dispose(); ringGeo.dispose(); discGeo.dispose(); lineGeo.dispose(); ringThin.dispose();
    shadowGeo.dispose(); eliteRingGeo.dispose(); barGeo.dispose();
    for (const m of teleMats.values()) m.dispose();
    for (const m of [wallMat, floorMat, hazMat, spikeMat, shadowMat, barBg, barFg, barWard]) m.dispose();
    disposeCaches();
  }

  return { setGame, sync, onEvent, project, dispose, snapCamera: () => placeCamera(0, true), get shake() { return R.shake; } };
}
