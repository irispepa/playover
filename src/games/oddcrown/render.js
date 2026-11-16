import * as THREE from 'three';
import { material, mesh, roundedBox } from '../../shell/arcade.js';
import { legalMoves } from './sim.js';
export function createBoard(a) {
  const {
      scene
    } = a.stage,
    board = new THREE.Group();
  scene.add(board);
  a.setSpan(7.15);
  a.camera.position.set(0, 12, 5.8);
  a.camera.lookAt(0, 0, 0);
  board.add(roundedBox(6.5, .22, 6.5, 0x131c30, 0, -.23, 0));
  const pieces = new Map(),
    tileShape = roundedBox(.97, .07, .97, 0xffffff);
  const tiles = new THREE.InstancedMesh(tileShape.geometry, tileShape.material, 36),
    dummy = new THREE.Object3D();
  board.add(tiles);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
    const i = y * 6 + x;
    dummy.position.set(x - 2.5, 0, y - 2.5);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    tiles.setColorAt(i, new THREE.Color((x + y) % 2 ? 0x58677e : 0xa7b2bf));
  }
  const ring = mesh(new THREE.RingGeometry(.3, .35, 32), new THREE.MeshBasicMaterial({
    color: 0xffdf9d,
    side: THREE.DoubleSide
  }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .095;
  board.add(ring);
  ring.visible = false;
  const dots = [];
  for (let i = 0; i < 36; i++) {
    const d = mesh(new THREE.CircleGeometry(.1, 16), new THREE.MeshBasicMaterial({
      color: 0xffde91,
      transparent: true,
      opacity: .9
    }));
    d.rotation.x = -Math.PI / 2;
    d.position.y = .1;
    d.visible = false;
    board.add(d);
    dots.push(d);
  }
  const trapMarks = [];
  function model(p) {
    const g = new THREE.Group(),
      gold = p.side === 0,
      col = gold ? 0xe9c78d : 0x80bada,
      mat = material(col, {
        metalness: .35
      });
    g.add(mesh(new THREE.CylinderGeometry(.24, .3, .12, 24), mat, 0, .15));
    g.add(mesh(new THREE.CylinderGeometry(.1, .2, .27, 18), mat, 0, .32));
    g.add(mesh(new THREE.TorusGeometry(.17, .025, 6, 20), mat, 0, .47));
    g.children.at(-1).rotation.x = Math.PI / 2;
    if (p.type === 'pawn') g.add(mesh(new THREE.SphereGeometry(.16, 16, 12), mat, 0, .58));
    if (p.type === 'rook') {
      g.add(mesh(new THREE.CylinderGeometry(.23, .16, .16, 16), mat, 0, .58));
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(.11, .13, .11), mat, Math.cos(i * Math.PI / 2) * .17, .7, Math.sin(i * Math.PI / 2) * .17));
    }
    if (p.type === 'bishop') {
      g.add(mesh(new THREE.ConeGeometry(.21, .38, 16), mat, 0, .64));
      g.add(mesh(new THREE.SphereGeometry(.065, 10, 8), mat, 0, .86));
    }
    if (p.type === 'knight') {
      const head = mesh(new THREE.BoxGeometry(.24, .32, .19), mat, 0, .62);
      head.rotation.z = -.3;
      g.add(head);
      g.add(mesh(new THREE.BoxGeometry(.28, .13, .18), mat, .1, .69));
      g.add(mesh(new THREE.ConeGeometry(.06, .16, 4), mat, -.07, .84));
      g.add(mesh(new THREE.SphereGeometry(.028, 8, 6), material(0x152438), .12, .76, .101));
    }
    if (p.type === 'queen' || p.type === 'king') {
      g.add(mesh(new THREE.CylinderGeometry(.14, .12, .18, 16), mat, 0, .56));
      g.add(mesh(new THREE.CylinderGeometry(.24, .14, .14, 16), mat, 0, .71));
      if (p.type === 'queen') {
        for (let i = 0; i < 5; i++) g.add(mesh(new THREE.SphereGeometry(.065, 10, 8), mat, Math.cos(i * Math.PI * .4) * .19, .84, Math.sin(i * Math.PI * .4) * .19));
      } else {
        g.add(mesh(new THREE.BoxGeometry(.08, .28, .08), mat, 0, .9));
        g.add(mesh(new THREE.BoxGeometry(.25, .08, .08), mat, 0, .93));
      }
    }
    const shadow = mesh(new THREE.CircleGeometry(.29, 20), new THREE.MeshBasicMaterial({
      color: 0x101629,
      transparent: true,
      opacity: .28
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .085;
    g.add(shadow);
    g.userData = {
      ...p,
      teamMaterial: mat
    };
    g.position.set(p.x - 2.5, 0, p.y - 2.5);
    board.add(g);
    return g;
  }
  function sync(s, selected) {
    for (const p of s.pieces) {
      let g = pieces.get(p.id);
      if (g && g.userData.side !== p.side) {
        g.userData.teamMaterial.color.setHex(p.side === 0 ? 0xe9c78d : 0x80bada);
        g.userData.side = p.side;
      }
      if (!g) {
        g = model(p);
        pieces.set(p.id, g);
      }
      g.visible = true;
      g.userData.tx = p.x - 2.5;
      g.userData.tz = p.y - 2.5;
    }
    for (const [id, g] of pieces) if (!s.pieces.some(p => p.id === id)) g.visible = false;
    const p = s.pieces.find(p => p.id === selected);
    ring.visible = !!p;
    if (p) ring.position.set(p.x - 2.5, .1, p.y - 2.5);
    const moves = p && s.known[p.type] ? legalMoves(s, p) : [];
    dots.forEach((d, i) => {
      d.visible = i < moves.length;
      if (d.visible) d.position.set(moves[i].x - 2.5, .1, moves[i].y - 2.5);
    });
    s.traps.forEach((t, i) => {
      if (!trapMarks[i]) {
        const m = mesh(new THREE.RingGeometry(.19, .27, t.kind === 'pit' ? 24 : 4), new THREE.MeshBasicMaterial({
          color: t.kind === 'pit' ? 0x9c4260 : t.kind === 'spring' ? 0x51dbbb : 0xe9baef,
          side: THREE.DoubleSide
        }));
        m.rotation.x = -Math.PI / 2;
        m.position.set(t.x - 2.5, .105, t.y - 2.5);
        board.add(m);
        trapMarks[i] = m;
      }
      trapMarks[i].visible = t.revealed;
      trapMarks[i].position.set(t.x - 2.5, .105, t.y - 2.5);
    });
  }
  a.stage.onFrame((dt, t) => {
    for (const g of pieces.values()) {
      const ease = a.reducedMotion ? 1 : Math.min(1, dt * 14);
      g.position.x += (g.userData.tx - g.position.x) * ease;
      g.position.z += (g.userData.tz - g.position.z) * ease;
      g.position.y = g.userData.id === selectedId?.() ? .055 + (a.reducedMotion ? 0 : Math.sin(t * 3) * .025) : 0;
    }
  });
  let selectedId = null;
  return {
    sync,
    setSelectionGetter(fn) {
      selectedId = fn;
    },
    pick(e) {
      const hit = a.pick(e, [tiles]);
      return hit ? {
        x: hit.instanceId % 6,
        y: Math.floor(hit.instanceId / 6)
      } : undefined;
    }
  };
}
