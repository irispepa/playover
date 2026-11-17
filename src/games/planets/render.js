import * as THREE from 'three';
import { mesh, material, roundedBox, clearGroup } from '../../shell/arcade.js';
import { makeRng } from '../../shell/rng.js';
import { planet } from './sim.js';
export function createBoard(a) {
  const {
    scene
  } = a.stage;
  a.setSpan(5.3);
  a.camera.position.set(0, 12, 3.7);
  a.camera.lookAt(0, 0, 0);
  const board = new THREE.Group();
  scene.add(board);
  board.add(roundedBox(4.5, .2, 4.5, 0x242d50, 0, -.25));
  const shape = roundedBox(.95, .05, .95, 0x323b60),
    tiles = new THREE.InstancedMesh(shape.geometry, shape.material, 16),
    dummy = new THREE.Object3D();
  board.add(tiles);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    dummy.position.set(x - 1.5, -.02, y - 1.5);
    dummy.updateMatrix();
    tiles.setMatrixAt(y * 4 + x, dummy.matrix);
  }
  const planets = new THREE.Group();
  scene.add(planets);
  let time = 1;
  const targets = [];
  function label(text) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#fff8ed';
    g.font = 'bold 40px -apple-system, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = '#11152b';
    g.shadowBlur = 8;
    g.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      depthTest: false,
      transparent: true
    }));
    m.scale.set(.65, .325, 1);
    m.position.y = .78;
    return m;
  }
  function sync(s, result) {
    planets.traverse(o => {
      if (o.material?.map) o.material.map.dispose();
    });
    clearGroup(planets);
    targets.length = 0;
    time = 0;
    for (let i = 0; i < 16; i++) {
      const value = s.cells[i];
      if (!value) continue;
      const p = planet(value),
        g = new THREE.Group(),
        rng = makeRng(value),
        radius = .28 + Math.min(.09, Math.log2(value) * .009);
      const sphere = mesh(new THREE.SphereGeometry(radius, 24, 18), material(p.color, {
        roughness: .62
      }), 0, .38);
      g.add(sphere);
      const detail = new THREE.Group();
      sphere.add(detail);
      if (value === 2) {
        for (let k = 0; k < 5; k++) {
          const crater = mesh(new THREE.SphereGeometry(.05 + rng.next() * .025, 10, 8), material(0x818da5));
          const phi = rng.float(0, Math.PI * 2),
            theta = rng.float(.3, 2.3);
          crater.position.set(Math.cos(phi) * Math.sin(theta) * radius, Math.cos(theta) * radius, Math.sin(phi) * Math.sin(theta) * radius);
          crater.scale.z = .3;
          crater.lookAt(0, 0, 0);
          detail.add(crater);
        }
      } else {
        for (let k = 0; k < 3; k++) {
          const ring = mesh(new THREE.TorusGeometry(radius * (.6 + k * .12), .025, 6, 30), material(p.color, {
            color: new THREE.Color(p.color).multiplyScalar(.72 + k * .09)
          }));
          ring.rotation.x = Math.PI / 2;
          ring.position.y = (k - 1) * .12;
          detail.add(ring);
        }
      }
      if (value >= 32) {
        const ring = mesh(new THREE.RingGeometry(radius * 1.22, radius * 1.65, 48), new THREE.MeshStandardMaterial({
          color: p.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: .65,
          roughness: .5
        }));
        ring.rotation.x = -Math.PI * .38;
        ring.position.y = .38;
        g.add(ring);
      }
      g.add(label(String(value)));
      g.position.set(i % 4 - 1.5, 0, Math.floor(i / 4) - 1.5);
      g.userData = {
        index: i
      };
      const motion = result?.motions.find(m => m.to === i);
      if (motion) {
        g.position.x = motion.from % 4 - 1.5;
        g.position.z = Math.floor(motion.from / 4) - 1.5;
      }
      planets.add(g);
      targets.push({
        g,
        x: i % 4 - 1.5,
        z: Math.floor(i / 4) - 1.5,
        detail,
        fresh: i === s.lastSpawn,
        merged: result?.merged.includes(i)
      });
    }
  }
  const stars = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({
    color: 0xa8b9ed
  }), 45);
  scene.add(stars);
  const rng = makeRng(42);
  for (let i = 0; i < 45; i++) {
    dummy.scale.setScalar(rng.float(.008, .025));
    dummy.position.set(rng.float(-4, 4), -.5, rng.float(-4, 4));
    dummy.updateMatrix();
    stars.setMatrixAt(i, dummy.matrix);
  }
  a.stage.onFrame((dt, t) => {
    time += dt;
    for (const o of targets) {
      const ease = a.reducedMotion ? 1 : Math.min(1, dt * 17);
      o.g.position.x += (o.x - o.g.position.x) * ease;
      o.g.position.z += (o.z - o.g.position.z) * ease;
      o.g.scale.setScalar(a.reducedMotion ? 1 : o.fresh ? Math.min(1, time * 5) : o.merged ? 1 + Math.sin(Math.min(1, time * 3) * Math.PI) * .15 : 1);
      if (!a.reducedMotion) o.detail.rotation.y = t * .08;
    }
  });
  return {
    sync,
    pick(e) {
      return a.pick(e, [tiles])?.instanceId;
    },
    dispose() {
      planets.traverse(o => {
        if (o.material?.map) o.material.map.dispose();
      });
    }
  };
}
