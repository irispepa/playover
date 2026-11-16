import * as THREE from 'three';
import { mesh, material, roundedBox } from '../../shell/arcade.js';
import { makeRng } from '../../shell/rng.js';
import { rotate, flow, DIRS } from './sim.js';
export function createBoard(a, s) {
  const {
    scene
  } = a.stage;
  a.setSpan(7);
  a.camera.position.set(0, 12, 4.8);
  a.camera.lookAt(0, 0, 0);
  const board = new THREE.Group();
  scene.add(board);
  board.add(roundedBox(5.5, .15, 5.5, 0x21515b, 0, -.22));
  const tileShape = roundedBox(.93, .08, .93, 0x39717b),
    tiles = new THREE.InstancedMesh(tileShape.geometry, tileShape.material, 25),
    dummy = new THREE.Object3D();
  board.add(tiles);
  const pipes = [],
    pearls = [],
    rotations = [];
  const ring = mesh(new THREE.RingGeometry(.4, .44, 32), new THREE.MeshBasicMaterial({
    color: 0xffde9b,
    side: THREE.DoubleSide
  }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .08;
  ring.visible = false;
  board.add(ring);
  for (let i = 0; i < 25; i++) {
    const x = i % 5 - 2,
      z = Math.floor(i / 5) - 2;
    dummy.position.set(x, -.07, z);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    board.add(g);
    const base = s.solution[i],
      water = material(0x477a85, {
        emissive: 0x000000,
        roughness: .3
      });
    const ceramic = material(0x8bb3ad, {
      roughness: .6
    });
    g.add(mesh(new THREE.CylinderGeometry(.18, .18, .12, 20), ceramic, 0, .09));
    g.add(mesh(new THREE.CylinderGeometry(.11, .11, .021, 20), water, 0, .26));
    for (const [dx, dy, bit] of DIRS) {
      if (!(base & bit)) continue;
      const channel = mesh(new THREE.CylinderGeometry(.145, .145, .47, 12), ceramic, dx * .24, .1, dy * .24);
      channel.rotation.z = dx ? Math.PI / 2 : 0;
      channel.rotation.x = dy ? Math.PI / 2 : 0;
      g.add(channel);
      const stream = mesh(new THREE.BoxGeometry(dx ? .47 : .12, .028, dy ? .47 : .12), water, dx * .24, .26, dy * .24);
      g.add(stream);
    }
    pipes.push({
      g,
      base,
      water
    });
    rotations[i] = 0;
    const pearl = mesh(new THREE.SphereGeometry(.125, 20, 14), material(0xfce8d7, {
      metalness: .35,
      emissive: 0x000000
    }));
    pearl.position.set(x, .45, z);
    board.add(pearl);
    pearls.push(pearl);
  }
  const inlet = mesh(new THREE.CylinderGeometry(.21, .21, .9, 16), material(0xa3e5d2), -2.9, .09, 0);
  inlet.rotation.z = Math.PI / 2;
  board.add(inlet);
  board.add(mesh(new THREE.BoxGeometry(.9, .025, .17), material(0x8ef1d3, {
    emissive: 0x1e6551
  }), -2.9, .31, 0));
  const outlet = mesh(new THREE.TorusGeometry(.25, .07, 10, 28), material(0xd6b8a3), 2.9, .09, 0);
  outlet.rotation.x = Math.PI / 2;
  board.add(outlet);
  const shell = mesh(new THREE.SphereGeometry(.35, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), material(0xe4c3b4), 2.93, .02, 0);
  shell.scale.set(1, .5, 1);
  board.add(shell);
  const rng = makeRng(s.seed),
    decor = new THREE.Group();
  scene.add(decor);
  for (const [x, z] of [[-2.8, -2.7], [2.7, -2.7], [-2.7, 2.7], [2.8, 2.7]]) {
    for (let k = 0; k < 4; k++) {
      const height = rng.float(.25, .65),
        stem = mesh(new THREE.CylinderGeometry(.025, .065, height, 8), material(rng.pick([0xde9d9c, 0x86bda4, 0x78b6bd])), x + rng.float(-.25, .25), height / 2 - .1, z + rng.float(-.15, .15));
      stem.rotation.z = rng.float(-.5, .5);
      decor.add(stem);
      const bud = mesh(new THREE.SphereGeometry(.09, 10, 8), material(0xd1b5bf), stem.position.x, stem.position.y + height / 2, stem.position.z);
      decor.add(bud);
    }
  }
  const bubbles = [];
  for (let i = 0; i < 14; i++) {
    const b = mesh(new THREE.SphereGeometry(rng.float(.02, .055), 8, 6), new THREE.MeshBasicMaterial({
      color: 0xa9ddd9,
      transparent: true,
      opacity: .3
    }));
    b.position.set(rng.float(-3.1, 3.1), rng.float(-1, 2), rng.float(-3, 3));
    decor.add(b);
    bubbles.push(b);
  }
  function sync(s, highlight = -1) {
    const f = flow(s);
    pipes.forEach((p, i) => {
      let n = 0;
      while (n < 4 && rotate(p.base, n) !== s.tiles[i]) n++;
      const wanted = -n * Math.PI / 2;
      let diff = wanted - p.g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      rotations[i] = p.g.rotation.y + diff;
      p.water.color.setHex(f.wet.has(i) ? 0x8ef1d3 : 0x315d6a);
      p.water.emissive.setHex(f.wet.has(i) ? 0x1e6551 : 0x000000);
    });
    pearls.forEach((p, i) => {
      p.visible = s.pearls.includes(i);
      p.material.color.setHex(f.wet.has(i) ? 0xfff9db : 0x92a5ad);
      p.material.emissive.setHex(f.wet.has(i) ? 0x65512a : 0x000000);
    });
    ring.visible = highlight >= 0;
    if (ring.visible) ring.position.set(highlight % 5 - 2, .08, Math.floor(highlight / 5) - 2);
    shell.material.emissive.setHex(f.exit ? 0x6a4632 : 0x000000);
    return f;
  }
  const off = a.stage.onFrame((dt, t) => {
    pipes.forEach((p, i) => p.g.rotation.y += (rotations[i] - p.g.rotation.y) * (a.reducedMotion ? 1 : Math.min(1, dt * 16)));
    pearls.forEach((p, i) => {
      if (p.visible) p.position.y = .43 + (a.reducedMotion ? 0 : Math.sin(t * 2 + i) * .035);
    });
    bubbles.forEach((b, i) => {
      if (!a.reducedMotion) b.position.y += dt * (.1 + i * .008);
      if (b.position.y > 2) b.position.y = -1;
    });
  });
  sync(s);
  return {
    sync,
    pick(e) {
      return a.pick(e, [tiles])?.instanceId;
    },
    dispose() {
      off();
      scene.remove(board, decor);
      for (const group of [board, decor]) group.traverse(o => {
        if (o.isInstancedMesh) o.dispose();
        o.geometry?.dispose();
        o.material?.dispose();
      });
    }
  };
}
