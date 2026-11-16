// three.js rendering for Bastion Maze. Reads the sim state; never mutates game rules.
import * as THREE from 'three';
import { T, TOWERS, ENEMIES } from './data.js';
import { geo, mat, enemyGeometry, buildTowerModel, buildHeroModel, disposeModelCaches } from './models.js';

const TILE_H = [0.3, 0.3, 0.1, 0.3, 0.55, 0.3, 0.24, 0.26, 0.3, 0.32];
const TILE_COL = [0x5d7a46, 0x6b6862, 0x2c6fa0, 0x6f6658, 0x7f8f55, 0x4f6272, 0x6b5030, 0x8a6a40, 0x3a2d3a, 0x3d4f66];
const SHAPES = ['box', 'ball', 'cone', 'spike', 'disc', 'tetra', 'wing', 'boss'];
const ECAP = 1200, PCAP = 1500, BEAMCAP = 400, RINGCAP = 160, PARTCAP = 2600, BARCAP = 1200, DOTCAP = 500;

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _e = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _hidden = new THREE.Matrix4().makeScale(0, 0, 0);

export function createRenderer(stage, opts = {}) {
  const scene = stage.scene;
  scene.background = new THREE.Color(0x0e1420);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  stage.setCamera(camera);
  const root = new THREE.Group();
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x40382a, 1.1);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
  sun.position.set(-4, 10, 6);
  scene.add(hemi, sun);

  const view = { W: 12, H: 18, fitDist: 30, zoom: 1, panX: 0, panZ: 0, tilt: 0.56, topPx: 110, botPx: 200, shake: 0,
    targetX: 0, targetZ: 0, centerZ: 0, follow: false, fx: 0, fz: 0, autoZoom: 1 };
  let map = null;
  let mapGroup = null;
  let tileTop = null;

  // ---------------------------------------------------------- dynamic meshes
  const enemyMeshes = {};
  for (const sh of SHAPES) {
    const m = new THREE.InstancedMesh(enemyGeometry(sh), mat(0xffffff), ECAP);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, _c.set(0xffffff));
    m.count = 0; m.frustumCulled = false;
    root.add(m);
    enemyMeshes[sh] = m;
  }
  const ghostMesh = new THREE.InstancedMesh(geo('ghostE', () => new THREE.IcosahedronGeometry(0.5, 0)), mat(0xb0a0ff, { basic: true, transparent: true, opacity: 0.22 }), ECAP);
  ghostMesh.count = 0; ghostMesh.frustumCulled = false; root.add(ghostMesh);
  const moundMesh = new THREE.InstancedMesh(geo('mound', () => new THREE.SphereGeometry(0.5, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0x6a4a2a), 300);
  moundMesh.count = 0; moundMesh.frustumCulled = false; root.add(moundMesh);
  const shadowMesh = new THREE.InstancedMesh(geo('shadow', () => new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2)), mat(0x000000, { basic: true, transparent: true, opacity: 0.3 }), ECAP);
  shadowMesh.count = 0; shadowMesh.frustumCulled = false; root.add(shadowMesh);

  const barGeo = geo('bar', () => new THREE.PlaneGeometry(1, 1));
  const barBack = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0x101418, depthTest: false, transparent: true, opacity: 0.85 }), BARCAP);
  const barFill = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }), BARCAP);
  const barShield = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0x6fc0ff, depthTest: false }), BARCAP);
  for (const b of [barBack, barFill, barShield]) { b.count = 0; b.frustumCulled = false; b.renderOrder = 20; root.add(b); }
  barFill.setColorAt(0, _c.set(0xffffff));

  const projMesh = new THREE.InstancedMesh(geo('proj', () => new THREE.IcosahedronGeometry(0.08, 0)), new THREE.MeshBasicMaterial({ color: 0xffffff }), PCAP);
  projMesh.count = 0; projMesh.frustumCulled = false; projMesh.setColorAt(0, _c.set(0xffffff)); root.add(projMesh);

  const addMat = (c = 0xffffff) => new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const beamMesh = new THREE.InstancedMesh(geo('beam', () => new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0)), addMat(), BEAMCAP);
  beamMesh.count = 0; beamMesh.frustumCulled = false; beamMesh.setColorAt(0, _c.set(0xffffff)); root.add(beamMesh);
  const ringMesh = new THREE.InstancedMesh(geo('fxring', () => new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2)), addMat(), RINGCAP);
  ringMesh.count = 0; ringMesh.frustumCulled = false; ringMesh.setColorAt(0, _c.set(0xffffff)); root.add(ringMesh);
  const discMesh = new THREE.InstancedMesh(geo('fxdisc', () => new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2)), addMat(), 120);
  discMesh.count = 0; discMesh.frustumCulled = false; discMesh.setColorAt(0, _c.set(0xffffff)); root.add(discMesh);
  const jamMesh = new THREE.InstancedMesh(geo('jam', () => new THREE.OctahedronGeometry(0.09, 0)), new THREE.MeshBasicMaterial({ color: 0xff4040 }), 300);
  jamMesh.count = 0; jamMesh.frustumCulled = false; root.add(jamMesh);

  // particles
  const pPos = new Float32Array(PARTCAP * 3), pCol = new Float32Array(PARTCAP * 3);
  const pVel = new Float32Array(PARTCAP * 3), pLife = new Float32Array(PARTCAP), pMax = new Float32Array(PARTCAP), pBase = new Float32Array(PARTCAP * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  root.add(points);
  let pHead = 0;

  // path dots
  const dotMesh = new THREE.InstancedMesh(geo('dot', () => new THREE.CircleGeometry(0.09, 6).rotateX(-Math.PI / 2)), addMat(), DOTCAP);
  dotMesh.count = 0; dotMesh.frustumCulled = false; dotMesh.setColorAt(0, _c.set(0xffffff)); root.add(dotMesh);
  const previewMesh = new THREE.InstancedMesh(geo('dot2', () => new THREE.CircleGeometry(0.11, 6).rotateX(-Math.PI / 2)), addMat(), DOTCAP);
  previewMesh.count = 0; previewMesh.frustumCulled = false; previewMesh.setColorAt(0, _c.set(0xffffff)); root.add(previewMesh);

  // selection, range ring, ghost
  const selGroup = new THREE.Group();
  const selMat = new THREE.MeshBasicMaterial({ color: 0x4cc9a0, transparent: true, opacity: 0.95, depthTest: false });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(geo('box', () => new THREE.BoxGeometry(1, 1, 1)), selMat);
    const horiz = i < 2;
    b.scale.set(horiz ? 1.02 : 0.07, 0.04, horiz ? 0.07 : 1.02);
    b.position.set(horiz ? 0 : (i === 2 ? -0.5 : 0.5), 0, horiz ? (i === 0 ? -0.5 : 0.5) : 0);
    b.renderOrder = 15;
    selGroup.add(b);
  }
  selGroup.visible = false;
  root.add(selGroup);
  const rangeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  const rangeRing = new THREE.Mesh(geo('rangeRing', () => new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2)), rangeMat);
  const rangeFill = new THREE.Mesh(geo('rangeFill', () => new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false }));
  const minRing = new THREE.Mesh(geo('rangeRing'), new THREE.MeshBasicMaterial({ color: 0xff8080, transparent: true, opacity: 0.5, depthWrite: false }));
  rangeRing.visible = rangeFill.visible = minRing.visible = false;
  rangeRing.renderOrder = rangeFill.renderOrder = minRing.renderOrder = 12;
  root.add(rangeRing, rangeFill, minRing);
  let ghost = null, ghostKey = '';
  const xMark = new THREE.Group();
  for (const r of [0.8, -0.8]) {
    const b = new THREE.Mesh(geo('box'), new THREE.MeshBasicMaterial({ color: 0xe25c5c, depthTest: false }));
    b.scale.set(0.8, 0.05, 0.1); b.rotation.y = r; b.renderOrder = 16;
    xMark.add(b);
  }
  xMark.visible = false;
  root.add(xMark);
  const targetRing = new THREE.Mesh(geo('rangeRing'), new THREE.MeshBasicMaterial({ color: 0xff7a2f, transparent: true, opacity: 0.9, depthTest: false }));
  targetRing.visible = false; targetRing.renderOrder = 17; root.add(targetRing);

  // walls are instanced; other towers are groups
  const wallMesh = new THREE.InstancedMesh(geo('wallBlock', () => new THREE.BoxGeometry(0.92, 0.62, 0.92).translate(0, 0.31, 0)), mat(0x8f8a7e), 400);
  wallMesh.count = 0; wallMesh.frustumCulled = false; root.add(wallMesh);
  const wallTop = new THREE.InstancedMesh(geo('wallTop', () => new THREE.BoxGeometry(0.72, 0.1, 0.72).translate(0, 0.67, 0)), mat(0x9c978a), 400);
  wallTop.count = 0; wallTop.frustumCulled = false; root.add(wallTop);
  const towerViews = new Map();
  let towerVer = -1;

  // hero
  const hero = buildHeroModel();
  hero.group.visible = false;
  root.add(hero.group);
  let heroAngle = 0, heroStep = 0;

  // core & gates
  let coreParts = null;
  const gateParts = [];
  const zoneViews = [];

  // ---------------------------------------------------------- map
  function setMap(s) {
    map = s.map;
    view.W = map.w; view.H = map.h;
    if (mapGroup) { root.remove(mapGroup); mapGroup.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); }
    mapGroup = new THREE.Group();
    root.add(mapGroup);
    const n = map.w * map.h;
    tileTop = new Float32Array(n);
    const tiles = new THREE.InstancedMesh(geo('tile', () => new THREE.BoxGeometry(1, 1, 1)), mat(0xffffff), n);
    const rocks = [], ruins = [], crystals = [], bridges = [], tufts = [];
    let seed = map.w * 31 + map.h * 7 + map.tiles[3];
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed % 10000) / 10000; };
    for (let i = 0; i < n; i++) {
      const t = map.tiles[i];
      const x = i % map.w, y = (i / map.w) | 0;
      const h = TILE_H[t];
      tileTop[i] = h;
      _p.set(wx(x + 0.5), h / 2 - 0.02, wz(y + 0.5));
      _s.set(0.97, h, 0.97);
      tiles.setMatrixAt(i, _m.compose(_p, _q.identity(), _s));
      _c.set(TILE_COL[t]);
      if (t === T.GROUND) _c.offsetHSL(0, 0, ((x + y) & 1 ? 0.018 : -0.012) + (rnd() - 0.5) * 0.02);
      tiles.setColorAt(i, _c);
      if (t === T.ROCK) rocks.push(i);
      else if (t === T.RUIN) ruins.push(i);
      else if (t === T.CRYSTAL) crystals.push(i);
      else if (t === T.BRIDGE) bridges.push(i);
      else if (t === T.GROUND && rnd() < 0.22) tufts.push(i);
    }
    tiles.instanceMatrix.needsUpdate = true;
    mapGroup.add(tiles);
    const base = new THREE.Mesh(geo('base', () => new THREE.BoxGeometry(1, 1, 1)), mat(0x232a22));
    base.scale.set(map.w + 0.6, 0.4, map.h + 0.6); base.position.y = -0.2;
    mapGroup.add(base);
    const inst = (g, m, list, fn) => {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(g, m, list.length);
      list.forEach((i, k) => { fn(i, k); im.setMatrixAt(k, _m.compose(_p, _q, _s)); });
      mapGroup.add(im);
      return im;
    };
    inst(geo('rock', () => new THREE.DodecahedronGeometry(0.42, 0)), mat(0x8a8780), rocks, (i) => {
      _p.set(wx(i % map.w + 0.5), 0.45, wz(((i / map.w) | 0) + 0.5));
      _q.setFromEuler(_e.set(rnd() * 3, rnd() * 3, rnd() * 3));
      _s.set(1 + rnd() * 0.3, 0.8 + rnd() * 0.7, 1 + rnd() * 0.3);
    });
    inst(geo('ruinCol', () => new THREE.BoxGeometry(0.26, 0.8, 0.26).translate(0, 0.4, 0)), mat(0xa89c86), ruins.concat(ruins), (i, k) => {
      const second = k >= ruins.length;
      _p.set(wx(i % map.w + 0.5) + (second ? 0.22 : -0.2), 0.3, wz(((i / map.w) | 0) + 0.5) + (second ? -0.18 : 0.2));
      _q.setFromEuler(_e.set(0, rnd(), second ? 0.2 : 0));
      _s.set(1, second ? 0.5 + rnd() * 0.4 : 0.8 + rnd() * 0.5, 1);
    });
    inst(geo('crys', () => new THREE.OctahedronGeometry(0.16, 0)), mat(0x7fe8ff, { emissive: 0x2a8ab0 }), crystals.concat(crystals), (i, k) => {
      const second = k >= crystals.length;
      _p.set(wx(i % map.w + 0.5) + (second ? 0.3 : -0.3), 0.45, wz(((i / map.w) | 0) + 0.5) + (second ? 0.28 : -0.3));
      _q.setFromEuler(_e.set(0.2, rnd() * 3, 0.1));
      _s.set(1, 1.8, 1);
    });
    inst(geo('plank', () => new THREE.BoxGeometry(0.9, 0.05, 0.16)), mat(0x9a7a4a), bridges.flatMap((i) => [i, i, i, i]), (i, k) => {
      const j = k % 4;
      _p.set(wx(i % map.w + 0.5), 0.29, wz(((i / map.w) | 0) + 0.5) - 0.33 + j * 0.22);
      _q.identity(); _s.set(1, 1, 1);
    });
    inst(geo('tuft', () => new THREE.ConeGeometry(0.06, 0.18, 4)), mat(0x7aa050), tufts.flatMap((i) => [i, i]), (i, k) => {
      _p.set(wx(i % map.w + 0.5) + (rnd() - 0.5) * 0.7, 0.38, wz(((i / map.w) | 0) + 0.5) + (rnd() - 0.5) * 0.7);
      _q.identity(); _s.set(1, 0.6 + rnd(), 1);
    });
    // core
    const cx = wx(map.core % map.w + 0.5), cz = wz(((map.core / map.w) | 0) + 0.5);
    const core = new THREE.Group();
    core.position.set(cx, 0.32, cz);
    const ped = new THREE.Mesh(geo('hex'), mat(0x5a6a80)); ped.scale.set(1.1, 0.25, 1.1); ped.position.y = 0.12; core.add(ped);
    const gem = new THREE.Mesh(geo('oct', () => new THREE.OctahedronGeometry(1, 0)), mat(0x7fd8ff, { emissive: 0x2070a0 }));
    gem.scale.set(0.26, 0.42, 0.26); gem.position.y = 0.75; core.add(gem);
    const halo = new THREE.Mesh(geo('torus'), mat(0xf0b44c, { emissive: 0x604010 })); halo.scale.setScalar(0.4); halo.rotation.x = Math.PI / 2; halo.position.y = 0.75; core.add(halo);
    mapGroup.add(core);
    coreParts = { core, gem, halo, hit: 0 };
    // gates
    gateParts.length = 0;
    for (const g of map.gates) {
      const gx = g % map.w, gy = (g / map.w) | 0;
      const grp = new THREE.Group();
      grp.position.set(wx(gx + 0.5), 0.3, wz(gy + 0.5));
      const vertical = gy === 0 || gy === map.h - 1;
      grp.rotation.y = vertical ? 0 : Math.PI / 2;
      for (const sx of [-0.42, 0.42]) { const p = new THREE.Mesh(geo('box'), mat(0x4a3a4a)); p.scale.set(0.16, 0.8, 0.16); p.position.set(sx, 0.4, 0); grp.add(p); }
      const lintel = new THREE.Mesh(geo('box'), mat(0x5a4a5a)); lintel.scale.set(1.04, 0.14, 0.2); lintel.position.y = 0.84; grp.add(lintel);
      const portal = new THREE.Mesh(geo('portal', () => new THREE.PlaneGeometry(0.7, 0.75)), new THREE.MeshBasicMaterial({ color: 0xe25c5c, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      portal.position.y = 0.42; grp.add(portal);
      mapGroup.add(grp);
      gateParts.push({ grp, portal });
    }
    towerViews.forEach((v) => removeTowerView(v));
    towerViews.clear();
    towerVer = -1;
    fit();
  }

  const wx = (x) => x - view.W / 2;
  const wz = (y) => y - view.H / 2;

  // ---------------------------------------------------------- camera
  function camPos(tx, tz, dist, out) {
    out.set(tx, Math.cos(view.tilt) * dist, tz + Math.sin(view.tilt) * dist);
    return out;
  }
  function placeCamera(tx, tz, dist) {
    camPos(tx, tz, dist, camera.position);
    camera.lookAt(tx, 0, tz);
    camera.updateMatrixWorld();
  }
  // Fit the map into the screen area between the HUD bars.
  function fit() {
    const w = stage.size.width, h = stage.size.height;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const top = 1 - 2 * (view.topPx / h), bot = -1 + 2 * (view.botPx / h);
    const corners = [];
    for (const x of [-view.W / 2, view.W / 2]) for (const z of [-view.H / 2, view.H / 2]) for (const y of [0, 0.6]) corners.push(new THREE.Vector3(x, y, z));
    let tz = 0;
    let lo = 5, hi = 120, dist = 30;
    for (let iter = 0; iter < 6; iter++) {
      lo = 5; hi = 140;
      for (let k = 0; k < 30; k++) {
        dist = (lo + hi) / 2;
        placeCamera(0, tz, dist);
        let ok = true;
        for (const c of corners) {
          _v.copy(c).project(camera);
          const midY = (top + bot) / 2, halfY = (top - bot) / 2;
          if (Math.abs(_v.x) > 0.96 || Math.abs(_v.y - midY) > halfY * 0.98) { ok = false; break; }
        }
        if (ok) hi = dist; else lo = dist;
      }
      dist = hi;
      placeCamera(0, tz, dist);
      // centre vertically in the usable band
      let minY = 9, maxY = -9;
      for (const c of corners) { _v.copy(c).project(camera); minY = Math.min(minY, _v.y); maxY = Math.max(maxY, _v.y); }
      const off = (minY + maxY) / 2 - (top + bot) / 2;
      // move the target along z to shift the image (approximate: 1 NDC ~ dist*tan(fov/2) world)
      tz -= off * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
    }
    view.fitDist = dist;
    view.centerZ = tz;
    clampPan();
  }
  function clampPan() {
    const z = view.zoom;
    const mx = (view.W / 2) * (1 - 1 / z), mz = (view.H / 2) * (1 - 1 / z);
    view.panX = Math.max(-mx, Math.min(mx, view.panX));
    view.panZ = Math.max(-mz, Math.min(mz, view.panZ));
  }
  function updateCamera(dt) {
    const z = view.zoom * view.autoZoom;
    let tx = view.panX, tz = view.centerZ + view.panZ;
    if (view.follow) {
      const k = Math.min(1, dt * 4);
      view.fx += (view.followX - view.fx) * k;
      view.fz += (view.followZ - view.fz) * k;
      const mx = (view.W / 2) * (1 - 1 / z), mz = (view.H / 2) * (1 - 1 / z) + 1;
      tx = Math.max(-mx, Math.min(mx, view.fx));
      tz = view.centerZ + Math.max(-mz, Math.min(mz, view.fz));
    }
    let sx = 0, sz = 0;
    if (view.shake > 0.001) {
      sx = (Math.random() - 0.5) * view.shake * 0.5;
      sz = (Math.random() - 0.5) * view.shake * 0.5;
      view.shake *= Math.pow(0.02, dt);
    }
    placeCamera(tx + sx, tz + sz, view.fitDist / z);
  }

  // ---------------------------------------------------------- picking
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
  const ndc = new THREE.Vector2();
  function pickWorld(clientX, clientY) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.ray.intersectPlane(plane, _v2);
    if (!hit) return null;
    return { x: hit.x + view.W / 2, y: hit.z + view.H / 2 };
  }
  function pickTile(clientX, clientY) {
    const p = pickWorld(clientX, clientY);
    if (!p || !map) return -1;
    const x = Math.floor(p.x), y = Math.floor(p.y);
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return -1;
    return y * map.w + x;
  }
  function worldToScreen(x, y, h, out) {
    _v.set(wx(x), h, wz(y)).project(camera);
    out.x = (_v.x + 1) / 2 * stage.size.width;
    out.y = (1 - _v.y) / 2 * stage.size.height;
    out.vis = _v.z < 1;
    return out;
  }

  // ---------------------------------------------------------- towers
  function removeTowerView(v) {
    if (v.group) root.remove(v.group);
  }
  function syncTowers(s) {
    if (s.towerVer !== towerVer) {
      towerVer = s.towerVer;
      const seen = new Set();
      for (const t of s.towers) {
        seen.add(t.id);
        let v = towerViews.get(t.id);
        const key = `${t.level}:${t.branch}`;
        if (v && v.key !== key) { removeTowerView(v); v = null; }
        if (!v) {
          v = { key, id: t.id, group: null, head: null, tip: null, angle: t.angle, lastCd: t.cd, recoil: 0, spin: [], pulse: [] };
          if (!(t.type === 'wall' && !t.branch)) {
            const md = buildTowerModel(t.type, t.level, t.branch, TOWERS[t.type].color);
            v.group = md.group; v.head = md.head; v.tip = md.tip; v.height = md.height;
            md.group.position.set(wx(t.x), tileTop[t.tile], wz(t.y));
            md.group.traverse((o) => { if (o.userData.spin || o.userData.spinZ) v.spin.push(o); if (o.userData.pulse || o.userData.bob) v.pulse.push(o); });
            root.add(md.group);
            if (t.type !== 'wall' && !v.built) { burst(t.x, t.y, tileTop[t.tile] + 0.3, 14, 0xf0d8a0, 1.6, 0.5); }
          }
          v.built = true;
          towerViews.set(t.id, v);
        }
      }
      for (const [id, v] of towerViews) if (!seen.has(id)) { removeTowerView(v); towerViews.delete(id); }
      // walls (plain and branched share the block)
      let k = 0;
      for (const t of s.towers) {
        if (t.type !== 'wall') continue;
        _p.set(wx(t.x), tileTop[t.tile], wz(t.y));
        _m.compose(_p, _q.identity(), _s.set(1, 1, 1));
        if (t.branch) { const v = towerViews.get(t.id); if (v && v.group) { /* group draws its own block */ continue; } }
        wallMesh.setMatrixAt(k, _m); wallTop.setMatrixAt(k, _m); k++;
      }
      wallMesh.count = k; wallTop.count = k;
      wallMesh.instanceMatrix.needsUpdate = true; wallTop.instanceMatrix.needsUpdate = true;
    }
  }
  function animateTowers(s, dt, time) {
    let jn = 0;
    for (const t of s.towers) {
      const v = towerViews.get(t.id);
      if (!v) continue;
      if (v.head) {
        if (t.st.kind !== 'support' && t.st.kind !== 'mine' && t.st.kind !== 'none') {
          let da = t.angle - v.angle;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          v.angle += da * Math.min(1, dt * 14);
          v.head.rotation.y = -v.angle;
        }
        if (t.cd > v.lastCd + 0.02) v.recoil = 1;
        v.lastCd = t.cd;
        if (v.recoil > 0) {
          v.recoil = Math.max(0, v.recoil - dt * 6);
          const r = v.recoil * 0.06;
          v.head.position.x = -Math.cos(v.angle) * r; v.head.position.z = -Math.sin(v.angle) * r;
        }
        for (const o of v.spin) { if (o.userData.spin) o.rotation.y += o.userData.spin * dt; if (o.userData.spinZ) o.rotation.z += o.userData.spinZ * dt; }
        for (const o of v.pulse) {
          if (o.userData.bob) o.position.y = 0.86 + Math.sin(time * 2.5 + t.id) * 0.05;
          if (o.userData.pulse) o.scale.setScalar((o.userData.s0 || (o.userData.s0 = o.scale.x)) * (1 + Math.sin(time * 8 + t.id) * 0.15));
        }
      }
      if (t.jamT > 0 && jn < 300) {
        const h = (v.height || 0.8) + 0.25;
        for (let k = 0; k < 2 && jn < 300; k++) {
          const a = time * 5 + k * Math.PI + t.id;
          _p.set(wx(t.x) + Math.cos(a) * 0.25, tileTop[t.tile] + h, wz(t.y) + Math.sin(a) * 0.25);
          jamMesh.setMatrixAt(jn++, _m.compose(_p, _q.identity(), _s.set(1, 1, 1)));
        }
      }
    }
    jamMesh.count = jn;
    jamMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------- enemies
  const counts = {};
  function syncEnemies(s, time) {
    for (const sh of SHAPES) counts[sh] = 0;
    let gn = 0, mn = 0, sn = 0, bn = 0;
    const camQ = camera.quaternion;
    for (let i = 0; i < s.enemies.length; i++) {
      const e = s.enemies[i];
      if (!e.alive) continue;
      const def = ENEMIES[e.type];
      const size = def.size;
      const jx = ((e.uid * 37) % 7 - 3) * 0.035, jz = ((e.uid * 53) % 7 - 3) * 0.035;
      const x = wx(e.x) + (e.flying ? 0 : jx), z = wz(e.y) + (e.flying ? 0 : jz);
      const ti = (Math.min(map.h - 1, Math.max(0, e.y | 0)) * map.w) + Math.min(map.w - 1, Math.max(0, e.x | 0));
      const ground = tileTop[ti] || 0.3;
      const bob = e.stunT > 0 ? 0 : Math.abs(Math.sin(time * 9 * e.speed + e.uid)) * 0.06 * size;
      const y = e.flying ? 1.35 + Math.sin(time * 3 + e.uid) * 0.08 : ground + size * 0.5 + bob;
      const yaw = -Math.atan2(e.vy, e.vx);
      if (e.burrowT > 0) {
        if (mn < 300) {
          _p.set(x, ground, z); _s.set(size, size * 0.5, size);
          moundMesh.setMatrixAt(mn++, _m.compose(_p, _q.identity(), _s));
        }
        continue;
      }
      if (e.stealth && e.revealT <= 0) {
        _p.set(x, y, z); _s.setScalar(size);
        ghostMesh.setMatrixAt(gn++, _m.compose(_p, _q.identity(), _s));
        continue;
      }
      const shape = def.shape;
      const mesh = enemyMeshes[shape];
      const k = counts[shape]++;
      if (k >= ECAP) continue;
      _q.setFromAxisAngle(_up, yaw);
      const sq = e.hitT > 0 ? 1.12 : 1;
      _p.set(x, y, z); _s.set(size * sq, size * (2 - sq), size * sq);
      if (e.boss) _s.multiplyScalar(1.5);
      mesh.setMatrixAt(k, _m.compose(_p, _q, _s));
      _c.setHex(def.colN);
      if (e.hitT > 0) _c.lerp(_white, 0.6);
      else if (e.frozenT > 0) _c.lerp(_ice, 0.75);
      else if (e.burnT > 0) _c.lerp(_fire, 0.35 + 0.15 * Math.sin(time * 20 + e.uid));
      else if (e.poisonT > 0) _c.lerp(_poison, 0.3);
      else if (e.slowT > 0) _c.lerp(_ice, 0.3);
      if (e.oilT > 0) _c.multiplyScalar(0.6);
      if (e.heroMarkT > 0 || e.markT > 0) _c.lerp(_mark, 0.15);
      mesh.setColorAt(k, _c);
      if (e.flying && sn < ECAP) {
        _p.set(x, ground + 0.02, z); _s.setScalar(size * 0.9);
        shadowMesh.setMatrixAt(sn++, _m.compose(_p, _q.identity(), _s));
      }
      // health bars
      const hurt = e.hp < e.maxHp - 0.5 || (e.maxShield > 0 && e.shield < e.maxShield - 0.5) || e.boss;
      if (hurt && bn < BARCAP) {
        const bw = e.boss ? 1.3 : 0.32 + size * 0.5;
        const by = y + size * (e.boss ? 1.0 : 0.65) + 0.12;
        _p.set(x, by, z); _s.set(bw + 0.04, 0.09, 1);
        barBack.setMatrixAt(bn, _m.compose(_p, camQ, _s));
        const f = Math.max(0, Math.min(1, e.hp / e.maxHp));
        _p.set(x - (1 - f) * bw / 2, by, z); _s.set(bw * f, 0.06, 1);
        barFill.setMatrixAt(bn, _m.compose(_p, camQ, _s));
        _c.setRGB(f < 0.5 ? 1 : 2 - f * 2 + 0.2, f > 0.5 ? 0.85 : f * 1.7, 0.25);
        barFill.setColorAt(bn, _c);
        if (e.maxShield > 0 && e.shield > 0) {
          const fs = e.shield / e.maxShield;
          _p.set(x - (1 - fs) * bw / 2, by + 0.07, z); _s.set(bw * fs, 0.04, 1);
        } else _s.set(0, 0, 0);
        barShield.setMatrixAt(bn, _m.compose(_p, camQ, _s));
        bn++;
      }
    }
    for (const sh of SHAPES) {
      const m = enemyMeshes[sh];
      m.count = Math.min(ECAP, counts[sh]);
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    ghostMesh.count = gn; ghostMesh.instanceMatrix.needsUpdate = true;
    moundMesh.count = mn; moundMesh.instanceMatrix.needsUpdate = true;
    shadowMesh.count = sn; shadowMesh.instanceMatrix.needsUpdate = true;
    for (const b of [barBack, barFill, barShield]) { b.count = bn; b.instanceMatrix.needsUpdate = true; }
    if (barFill.instanceColor) barFill.instanceColor.needsUpdate = true;
  }
  const _white = new THREE.Color(0xffffff), _ice = new THREE.Color(0xaaf0ff), _fire = new THREE.Color(0xff6a20);
  const _poison = new THREE.Color(0x9be060), _mark = new THREE.Color(0xff3060);

  // ---------------------------------------------------------- projectiles
  function syncProjectiles(s) {
    let n = 0;
    for (let i = 0; i < s.proj.length && n < PCAP; i++) {
      const p = s.proj[i];
      if (!p.alive) continue;
      const big = p.kind === 'mortar' || p.kind === 'shell' || p.kind === 'hgren';
      _p.set(wx(p.x), p.z + 0.3, wz(p.y));
      _s.setScalar(big ? 1.8 : p.kind === 'eshot' ? 1.5 : 1);
      projMesh.setMatrixAt(n, _m.compose(_p, _q.identity(), _s));
      projMesh.setColorAt(n, _c.setHex(p.color));
      n++;
    }
    projMesh.count = n;
    projMesh.instanceMatrix.needsUpdate = true;
    if (projMesh.instanceColor) projMesh.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------- effects
  const beams = [], rings = [];
  for (let i = 0; i < BEAMCAP; i++) beams.push({ on: false });
  for (let i = 0; i < RINGCAP; i++) rings.push({ on: false });
  let beamHead = 0, ringHead = 0;
  function addBeam(x1, y1, x2, y2, w, c, life, h = 0.75) {
    const b = beams[beamHead]; beamHead = (beamHead + 1) % BEAMCAP;
    b.on = true; b.x1 = wx(x1); b.z1 = wz(y1); b.x2 = wx(x2); b.z2 = wz(y2); b.w = w; b.c = c; b.t = 0; b.T = life || 0.12; b.h = h;
  }
  function addRing(x, y, r, c, life = 0.4, h = 0.34, fill = false) {
    const g = rings[ringHead]; ringHead = (ringHead + 1) % RINGCAP;
    g.on = true; g.x = wx(x); g.z = wz(y); g.r = r; g.c = c; g.t = 0; g.T = life; g.h = h; g.fill = fill;
  }
  function burst(x, y, h, n, c, speed = 2, life = 0.5, up = 1.5) {
    _c.setHex(c);
    for (let i = 0; i < n; i++) {
      const k = pHead; pHead = (pHead + 1) % PARTCAP;
      pPos[k * 3] = wx(x); pPos[k * 3 + 1] = h; pPos[k * 3 + 2] = wz(y);
      const a = Math.random() * Math.PI * 2, sp = speed * (0.3 + Math.random() * 0.7);
      pVel[k * 3] = Math.cos(a) * sp; pVel[k * 3 + 1] = up * (0.4 + Math.random()); pVel[k * 3 + 2] = Math.sin(a) * sp;
      pLife[k] = pMax[k] = life * (0.6 + Math.random() * 0.6);
      pBase[k * 3] = _c.r; pBase[k * 3 + 1] = _c.g; pBase[k * 3 + 2] = _c.b;
    }
  }
  function cone(x, y, a, range, cone, c) {
    _c.setHex(c);
    for (let i = 0; i < 4; i++) {
      const k = pHead; pHead = (pHead + 1) % PARTCAP;
      const aa = a + (Math.random() - 0.5) * cone;
      const sp = range * (2.2 + Math.random() * 1.2);
      pPos[k * 3] = wx(x) + Math.cos(a) * 0.35; pPos[k * 3 + 1] = 0.75; pPos[k * 3 + 2] = wz(y) + Math.sin(a) * 0.35;
      pVel[k * 3] = Math.cos(aa) * sp; pVel[k * 3 + 1] = 0.3; pVel[k * 3 + 2] = Math.sin(aa) * sp;
      pLife[k] = pMax[k] = 0.32 + Math.random() * 0.1;
      const yel = Math.random();
      pBase[k * 3] = 1; pBase[k * 3 + 1] = 0.35 + yel * 0.5; pBase[k * 3 + 2] = 0.1 * yel;
    }
  }
  const floats = [];
  function consumeFx(s, hooks) {
    const n = s.fxN;
    let budget = 220; // particles per frame cap
    for (let i = 0; i < n; i++) {
      const f = s.fx[i];
      const h = map ? (tileTop[Math.max(0, Math.min(map.w * map.h - 1, ((f.y | 0) * map.w) + (f.x | 0)))] || 0.3) : 0.3;
      switch (f.k) {
        case 'beam': addBeam(f.x, f.y, f.x2, f.y2, f.r * 0.06, f.c, f.a); break;
        case 'boom':
          addRing(f.x, f.y, f.r, f.c, 0.35, h + 0.05);
          addRing(f.x, f.y, f.r * 0.7, 0xffffff, 0.18, h + 0.05, true);
          if (budget > 0) { const k = Math.min(16, 6 + f.r * 6 | 0); burst(f.x, f.y, h + 0.3, k, f.c, 2.5 * f.r, 0.5); budget -= k; }
          break;
        case 'hit': if (budget > 0) { burst(f.x, f.y, h + 0.45, 3, f.c, 1.5, 0.25, 0.8); budget -= 3; } break;
        case 'pulse': addRing(f.x, f.y, f.r, f.c, 0.45, h + 0.08); break;
        case 'nova': addRing(f.x, f.y, f.r, f.c, 0.6, h + 0.1); addRing(f.x, f.y, f.r * 0.6, 0xffffff, 0.3, h + 0.1, true); if (budget > 0) { burst(f.x, f.y, h + 0.5, 24, f.c, 4, 0.6); budget -= 24; } break;
        case 'flame': if (budget > 0) { cone(f.x, f.y, f.x2, f.y2, f.r, f.c); budget -= 4; } break;
        case 'death': if (budget > 0) { const k = f.r > 0.8 ? 30 : 7; burst(f.x, f.y, (f.a ? 1.3 : h + 0.3), k, f.c, f.r > 0.8 ? 3 : 1.6, 0.5); budget -= k; } break;
        case 'muzzle': if (budget > 0) { burst(f.x + f.x2 * 0.2, f.y + f.y2 * 0.2, h + 0.55, 2, f.c, 0.8, 0.12, 0.3); budget -= 2; } break;
        case 'heal': addRing(f.x, f.y, f.r, f.c, 0.5, h + 0.1); if (budget > 0) { burst(f.x, f.y, h + 0.3, 5, f.c, 0.4, 0.6, 2); budget -= 5; } break;
        case 'jam': addRing(f.x, f.y, f.r, f.c, 0.4, h + 0.1); if (budget > 0) { burst(f.x, f.y, h + 0.5, 6, f.c, 2, 0.3); budget -= 6; } break;
        case 'shake': view.shake = Math.min(1.2, view.shake + f.r * (opts.shake === false ? 0 : 1)); break;
        case 'leak': if (coreParts) coreParts.hit = 1; hooks.leak && hooks.leak(f.a); break;
        case 'gold': hooks.float && hooks.float(f.x, f.y, '+' + f.a, 'gold'); break;
        case 'text': hooks.float && hooks.float(-1, -1, '+' + f.a, 'gold'); break;
      }
    }
    s.fxN = 0;
  }
  function updateFx(dt) {
    let bn = 0;
    for (const b of beams) {
      if (!b.on) continue;
      b.t += dt;
      if (b.t >= b.T) { b.on = false; continue; }
      const f = 1 - b.t / b.T;
      const dx = b.x2 - b.x1, dz = b.z2 - b.z1, L = Math.hypot(dx, dz);
      _p.set(b.x1, b.h, b.z1);
      _q.setFromAxisAngle(_up, -Math.atan2(dz, dx));
      _s.set(L, b.w * (0.5 + f), b.w * (0.5 + f));
      beamMesh.setMatrixAt(bn, _m.compose(_p, _q, _s));
      beamMesh.setColorAt(bn, _c.setHex(b.c).multiplyScalar(f * 1.2));
      bn++;
    }
    beamMesh.count = bn; beamMesh.instanceMatrix.needsUpdate = true; if (beamMesh.instanceColor) beamMesh.instanceColor.needsUpdate = true;
    let rn = 0, dn = 0;
    for (const g of rings) {
      if (!g.on) continue;
      g.t += dt;
      if (g.t >= g.T) { g.on = false; continue; }
      const f = g.t / g.T;
      const r = g.r * (0.25 + 0.75 * Math.sqrt(f));
      _p.set(g.x, g.h, g.z); _s.set(r, 1, r);
      if (g.fill) {
        if (dn < 120) { discMesh.setMatrixAt(dn, _m.compose(_p, _q.identity(), _s)); discMesh.setColorAt(dn, _c.setHex(g.c).multiplyScalar((1 - f) * 0.5)); dn++; }
      } else {
        ringMesh.setMatrixAt(rn, _m.compose(_p, _q.identity(), _s));
        ringMesh.setColorAt(rn, _c.setHex(g.c).multiplyScalar(1 - f));
        rn++;
      }
    }
    ringMesh.count = rn; ringMesh.instanceMatrix.needsUpdate = true; if (ringMesh.instanceColor) ringMesh.instanceColor.needsUpdate = true;
    discCount = dn;
    // particles
    const g = 6;
    for (let k = 0; k < PARTCAP; k++) {
      if (pLife[k] <= 0) { if (pCol[k * 3] !== 0) { pCol[k * 3] = pCol[k * 3 + 1] = pCol[k * 3 + 2] = 0; pPos[k * 3 + 1] = -50; } continue; }
      pLife[k] -= dt;
      const f = Math.max(0, pLife[k] / pMax[k]);
      pVel[k * 3 + 1] -= g * dt;
      pPos[k * 3] += pVel[k * 3] * dt; pPos[k * 3 + 1] += pVel[k * 3 + 1] * dt; pPos[k * 3 + 2] += pVel[k * 3 + 2] * dt;
      if (pPos[k * 3 + 1] < 0.3) { pPos[k * 3 + 1] = 0.3; pVel[k * 3 + 1] *= -0.3; pVel[k * 3] *= 0.6; pVel[k * 3 + 2] *= 0.6; }
      pCol[k * 3] = pBase[k * 3] * f; pCol[k * 3 + 1] = pBase[k * 3 + 1] * f; pCol[k * 3 + 2] = pBase[k * 3 + 2] * f;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }
  let discCount = 0;

  function syncZones(s, time) {
    let dn = discCount;
    let targetShown = false;
    for (const z of s.zones) {
      if (dn >= 120) break;
      const h = 0.34;
      if (z.kind === 'fire') {
        const f = Math.min(1, z.t / 0.6);
        _p.set(wx(z.x), h, wz(z.y)); _s.set(z.r, 1, z.r);
        discMesh.setMatrixAt(dn, _m.compose(_p, _q.identity(), _s));
        discMesh.setColorAt(dn, _c.setHex(0xff5a10).multiplyScalar(f * (0.45 + 0.15 * Math.sin(time * 18 + z.x))));
        dn++;
        if (Math.random() < 0.5) burstUp(z.x + (Math.random() - 0.5) * z.r, z.y + (Math.random() - 0.5) * z.r);
      } else if (z.kind === 'meteor' || z.kind === 'orbital') {
        _p.set(wx(z.x), h, wz(z.y)); _s.set(z.r, 1, z.r);
        discMesh.setMatrixAt(dn, _m.compose(_p, _q.identity(), _s));
        discMesh.setColorAt(dn, _c.setHex(z.kind === 'orbital' ? 0x60e0ff : 0xff4010).multiplyScalar(0.25 + 0.2 * Math.sin(time * 30)));
        dn++;
        if (z.kind === 'orbital') addBeam(z.x, z.y, z.x + 0.001, z.y, 0.5, 0x9ff0ff, 0.05, 0.3);
        else { burst(z.x - 1.5 + (0.75 - z.t) * 2, z.y - 1.5 + (0.75 - z.t) * 2, 0.4 + z.t * 8, 2, 0xffa040, 0.3, 0.3, 0); }
      }
    }
    discMesh.count = dn; discMesh.instanceMatrix.needsUpdate = true; if (discMesh.instanceColor) discMesh.instanceColor.needsUpdate = true;
    if (!targetShown) targetRing.visible = targetRing.visible && true;
  }
  function burstUp(x, y) {
    const k = pHead; pHead = (pHead + 1) % PARTCAP;
    pPos[k * 3] = wx(x); pPos[k * 3 + 1] = 0.35; pPos[k * 3 + 2] = wz(y);
    pVel[k * 3] = 0; pVel[k * 3 + 1] = 2.2; pVel[k * 3 + 2] = 0;
    pLife[k] = pMax[k] = 0.35;
    pBase[k * 3] = 1; pBase[k * 3 + 1] = 0.45; pBase[k * 3 + 2] = 0.1;
  }

  // ---------------------------------------------------------- path dots
  let pathKey = '';
  const pathDots = [];
  function setPaths(paths, color = 0xffe9a0) {
    pathDots.length = 0;
    for (const p of paths) for (let i = 0; i < p.length; i++) pathDots.push(p[i]);
    pathKey = '';
    dotColor = color;
  }
  let dotColor = 0xffe9a0;
  function drawPath(mesh, paths, time, color, strong) {
    let n = 0;
    for (const p of paths) {
      for (let i = 0; i < p.length - 1 && n < DOTCAP - 1; i++) {
        const a = p[i], b = p[i + 1];
        const ax = a % map.w + 0.5, ay = ((a / map.w) | 0) + 0.5, bx = b % map.w + 0.5, by = ((b / map.w) | 0) + 0.5;
        for (let k = 0; k < 2; k++) {
          const f = k / 2;
          const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
          const h = Math.max(tileTop[a], tileTop[b]) + 0.03;
          _p.set(wx(x), h, wz(y)); _s.setScalar(1);
          mesh.setMatrixAt(n, _m.compose(_p, _q.identity(), _s));
          const wave = 0.5 + 0.5 * Math.sin((i * 2 + k) * 0.7 - time * 6);
          mesh.setColorAt(n, _c.setHex(color).multiplyScalar((strong ? 0.55 : 0.18) + wave * (strong ? 0.6 : 0.25)));
          n++;
        }
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------- hero
  function syncHero(s, dt, time) {
    const h = s.hero;
    const vis = h.deployed && h.downT <= 0;
    hero.group.visible = vis && !(h.iT > 0 && Math.floor(time * 14) % 2 === 0);
    if (!vis) return;
    const ti = ((h.y | 0) * map.w) + (h.x | 0);
    hero.group.position.set(wx(h.x), tileTop[ti] || 0.3, wz(h.y));
    let da = h.angle - heroAngle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    heroAngle += da * Math.min(1, dt * 20);
    hero.body.rotation.y = -heroAngle;
    if (h.moving) heroStep += dt * 14; else heroStep *= 0.8;
    hero.legL.rotation.z = Math.sin(heroStep) * 0.6;
    hero.legR.rotation.z = -Math.sin(heroStep) * 0.6;
    hero.body.position.y = Math.abs(Math.sin(heroStep)) * 0.03;
    hero.flash.visible = h.flash > 0;
    hero.ring.scale.setScalar(1 + Math.sin(time * 4) * 0.08);
    view.followX = wx(h.x); view.followZ = wz(h.y);
  }

  // ---------------------------------------------------------- selection API
  function setSelection(tile, color) {
    if (tile < 0 || !map) { selGroup.visible = false; return; }
    selGroup.visible = true;
    selGroup.position.set(wx(tile % map.w + 0.5), tileTop[tile] + 0.04, wz(((tile / map.w) | 0) + 0.5));
    selMat.color.setHex(color);
  }
  function setRange(x, y, r, minR = 0, color = 0xffffff) {
    if (r <= 0 || !map) { rangeRing.visible = rangeFill.visible = minRing.visible = false; return; }
    const ti = ((y | 0) * map.w) + (x | 0);
    const h = (tileTop[ti] || 0.3) + 0.05;
    rangeRing.visible = rangeFill.visible = true;
    rangeRing.position.set(wx(x), h, wz(y)); rangeRing.scale.set(r, 1, r);
    rangeFill.position.set(wx(x), h - 0.01, wz(y)); rangeFill.scale.set(r, 1, r);
    rangeMat.color.setHex(color);
    minRing.visible = minR > 0;
    if (minR > 0) { minRing.position.set(wx(x), h, wz(y)); minRing.scale.set(minR, 1, minR); }
  }
  function setGhost(type, tile, ok) {
    const key = type && tile >= 0 ? `${type}:${tile}` : '';
    if (key === ghostKey) { xMark.visible = !!key && !ok; return; }
    ghostKey = key;
    if (ghost) { root.remove(ghost); ghost = null; }
    xMark.visible = false;
    if (!key) return;
    const md = buildTowerModel(type, 1, null, TOWERS[type].color, true);
    ghost = md.group;
    ghost.position.set(wx(tile % map.w + 0.5), tileTop[tile], wz(((tile / map.w) | 0) + 0.5));
    root.add(ghost);
    xMark.position.set(ghost.position.x, tileTop[tile] + 0.5, ghost.position.z);
    xMark.visible = !ok;
  }
  function setTargeting(x, y, r) {
    if (r <= 0) { targetRing.visible = false; return; }
    targetRing.visible = true;
    targetRing.position.set(wx(x), 0.4, wz(y));
    targetRing.scale.set(r, 1, r);
  }

  // ---------------------------------------------------------- per frame
  let pathsCur = [], pathsPreview = null, previewOk = true, showPaths = true;
  function sync(s, dt, time, hooks = {}) {
    if (!map || map !== s.map) setMap(s);
    syncTowers(s);
    animateTowers(s, dt, time);
    syncEnemies(s, time);
    syncProjectiles(s);
    consumeFx(s, hooks);
    updateFx(dt);
    syncZones(s, time);
    syncHero(s, dt, time);
    if (showPaths) drawPath(dotMesh, pathsCur, time, 0xffe9a0, false);
    else dotMesh.count = 0;
    if (pathsPreview) drawPath(previewMesh, pathsPreview, time, previewOk ? 0x60f0c0 : 0xff5050, true);
    else previewMesh.count = 0;
    if (coreParts) {
      coreParts.gem.rotation.y += dt * 1.2;
      coreParts.halo.rotation.z += dt * 0.8;
      coreParts.gem.position.y = 0.75 + Math.sin(time * 2) * 0.05;
      if (coreParts.hit > 0) {
        coreParts.hit = Math.max(0, coreParts.hit - dt * 2);
        coreParts.gem.material = coreParts.hit > 0 ? mat(0xff6060, { emissive: 0x902020 }) : mat(0x7fd8ff, { emissive: 0x2070a0 });
      }
    }
    for (const g of gateParts) g.portal.material.opacity = 0.45 + 0.2 * Math.sin(time * 4);
    view.follow = !!opts.followHero && s.hero.deployed && s.hero.downT <= 0;
    const targetAZ = view.follow ? 1.35 : 1;
    view.autoZoom += (targetAZ - view.autoZoom) * Math.min(1, dt * 3);
    if (!view.follow) { view.fx = view.panX; view.fz = view.panZ; }
    updateCamera(dt);
  }

  return {
    camera, setMap, sync, pickTile, pickWorld, worldToScreen, setSelection, setRange, setGhost, setTargeting,
    setPaths(cur) { pathsCur = cur; },
    setPreview(p, ok) { pathsPreview = p; previewOk = ok; },
    setShowPaths(v) { showPaths = v; },
    setInsets(top, bot) {
      const h = stage.size.height;
      top = Number.isFinite(top) ? Math.max(0, top) : 110; bot = Number.isFinite(bot) ? Math.max(0, bot) : 170;
      if (top + bot > h * 0.6) { const k = (h * 0.6) / (top + bot); top *= k; bot *= k; }
      view.topPx = top; view.botPx = bot; fit();
    },
    resize() { fit(); },
    zoomBy(f, cx, cy) {
      const before = view.zoom;
      view.zoom = Math.max(1, Math.min(2.6, view.zoom * f));
      if (view.zoom !== before) clampPan();
    },
    panBy(dxPx, dyPx) {
      const k = (view.fitDist / (view.zoom * view.autoZoom)) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 2 / stage.size.height;
      view.panX -= dxPx * k; view.panZ -= dyPx * k * 1.25;
      clampPan();
    },
    resetView() { view.zoom = 1; view.panX = 0; view.panZ = 0; },
    get zoom() { return view.zoom; },
    setFollow(v) { opts.followHero = v; },
    setShakeEnabled(v) { opts.shake = v; },
    dispose() {
      if (ghost) root.remove(ghost);
      scene.remove(root, hemi, sun);
      root.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
      pGeo.dispose(); pMat.dispose();
      disposeModelCaches();
    },
  };
}
