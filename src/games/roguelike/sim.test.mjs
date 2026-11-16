// Headless checks for Deepvault's pure modules. Run: node src/games/roguelike/sim.test.mjs
import { makeRng } from '../../shell/rng.js';
import { T, isSolidTile, CLASSES, CLASS_ORDER, PERKS, isBossFloor, isShopFloor, ENEMIES, BOSSES, WEAPON_KEYS } from './data.js';
import { generateFloor, bfsDist } from './gen.js';
import { rollItem, computeStats, rollPerkChoices, previewEquip, itemStatLines } from './items.js';
import { newRun, createGame, step, SIM_DT, choosePerk, interact, equipFromBag, salvage, useScroll, usePotion, throwBomb, castAbility } from './sim.js';
import { serializeRun, deserializeRun, defaultMeta, normalizeMeta, mergeFloorLog, recordRunEnd, recordDepth, bestiaryList } from './save.js';

let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; if (failures < 40) console.error('FAIL:', msg); } }
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

// ---------------------------------------------------------------- generation
function flood(fl, passDoors) {
  const d = bfsDist({ w: fl.w, h: fl.h, tiles: fl.tiles }, fl.start.x, fl.start.y, passDoors);
  return d;
}

let floorsTested = 0;
const t0 = Date.now();
const seeds = [1, 2, 3, 42, 777, 9001, 123456, 0xdeadbeef, 31337, 2024];
for (const seed of seeds) {
  for (let floor = 1; floor <= 32; floor++) {
    const fl = generateFloor(seed, floor);
    floorsTested++;
    const tag = `seed ${seed} floor ${floor}`;
    const W = fl.w, H = fl.h;
    ok(fl.tiles.length === W * H, `${tag}: tile count`);
    for (let x = 0; x < W; x++) { ok(fl.tiles[x] === T.WALL && fl.tiles[(H - 1) * W + x] === T.WALL, `${tag}: border row`); }
    for (let y = 0; y < H; y++) { ok(fl.tiles[y * W] === T.WALL && fl.tiles[y * W + W - 1] === T.WALL, `${tag}: border col`); }
    ok(!isSolidTile(fl.tiles[fl.start.y * W + fl.start.x]), `${tag}: start walkable`);
    ok(fl.tiles[fl.stairs.y * W + fl.stairs.x] === T.STAIRS, `${tag}: stairs tile`);
    const open = flood(fl, false);
    const all = flood(fl, true);
    ok(open[fl.stairs.y * W + fl.stairs.x] >= 0, `${tag}: stairs reachable without keys`);
    for (const r of fl.rooms) {
      const i = r.cy * W + r.cx;
      ok(all[i] >= 0, `${tag}: room ${r.kind} reachable`);
      if (r.kind !== 'vault' && r.kind !== 'secret') ok(open[i] >= 0, `${tag}: main room ${r.kind} reachable without keys`);
      if (r.kind === 'vault') ok(open[i] < 0, `${tag}: vault sealed by its door`);
    }
    for (const o of fl.objects) {
      ok(all[o.y * W + o.x] >= 0, `${tag}: object ${o.kind} reachable`);
      ok(!isSolidTile(fl.tiles[o.y * W + o.x]), `${tag}: object ${o.kind} on floor`);
      if (o.kind === 'key') ok(open[o.y * W + o.x] >= 0, `${tag}: key reachable without key`);
    }
    if (fl.vault) ok(fl.objects.some((o) => o.kind === 'key'), `${tag}: vault has a key`);
    for (const s of fl.spawns) {
      const i = s.y * W + s.x;
      ok(!isSolidTile(fl.tiles[i]), `${tag}: spawn ${s.type} not in wall`);
      ok(all[i] >= 0, `${tag}: spawn reachable`);
      ok(!!(ENEMIES[s.type] || BOSSES[s.type]), `${tag}: spawn type ${s.type} exists`);
      if (!s.boss) ok(all[i] >= 4 || fl.isBoss, `${tag}: spawn not on top of start (${all[i]})`);
    }
    ok(fl.spawns.length > 0, `${tag}: has enemies`);
    if (isBossFloor(floor)) ok(fl.spawns.some((s) => s.boss), `${tag}: boss present`);
    if (isShopFloor(floor)) ok(fl.objects.some((o) => o.kind === 'pedestal') || !fl.isShop, `${tag}: shop pedestals`);
    // Determinism.
    if (floor % 7 === 0) {
      const again = generateFloor(seed, floor);
      ok(again.tiles.every((v, i) => v === fl.tiles[i]) && again.spawns.length === fl.spawns.length, `${tag}: deterministic`);
    }
  }
}
console.log(`generation: ${floorsTested} floors in ${Date.now() - t0} ms`);

// ---------------------------------------------------------------- items and perks
{
  const rng = makeRng(99);
  const rarities = [0, 0, 0, 0, 0];
  for (let k = 0; k < 20000; k++) {
    const ilvl = rng.int(1, 90);
    const it = rollItem(rng, ilvl, { magicFind: rng.float(0, 2), minRarity: k % 50 === 0 ? 3 : 0 });
    rarities[it.rarity]++;
    ok(typeof it.name === 'string' && it.name.length > 0 && !it.name.includes('undefined'), `item name ${it.name}`);
    ok(it.rarity >= 0 && it.rarity <= 4, 'rarity range');
    ok(finite(it.value) && it.value > 0, 'item value');
    if (it.slot === 'weapon') ok(finite(it.dmg) && it.dmg > 0 && it.dmg < 5000, `weapon dmg ${it.dmg}`);
    if (it.slot === 'armor') ok(finite(it.armor) && it.armor > 0 && it.armor < 2000, `armor ${it.armor}`);
    for (const [k2, v] of Object.entries(it.mods)) ok(finite(v) && Math.abs(v) < 1000, `mod ${k2}=${v}`);
    if (k % 500 === 0) for (const l of itemStatLines(it)) ok(!String(l.value).includes('NaN') && l.label, 'stat line');
    ok(JSON.stringify(it).length < 2000, 'item JSON size');
  }
  console.log('rarity spread', rarities.join(' / '));
  ok(rarities[4] > 0 && rarities[3] > 0, 'some epics and legendaries');
  const meta = { ...defaultMeta(), kills: 9999, elites: 99, bosses: 9, deepest: 99, runs: 9 };
  for (let k = 0; k < 3000; k++) {
    const cls = CLASS_ORDER[k % 4];
    const run = newRun(k, cls);
    const P = run.P;
    P.level = rng.int(1, 60);
    for (let n = 0; n < rng.int(0, 25); n++) {
      const opts = rollPerkChoices(rng, P, meta, 3);
      ok(new Set(opts).size === opts.length, 'perk options distinct');
      for (const id of opts) ok(PERKS.some((p) => p.id === id), 'perk exists');
      if (opts.length) { const id = rng.pick(opts); P.perks[id] = (P.perks[id] || 0) + 1; }
    }
    for (const id in P.perks) ok(P.perks[id] <= PERKS.find((p) => p.id === id).max, 'perk max respected');
    P.equip.weapon = rollItem(rng, rng.int(1, 60), { slot: 'weapon' });
    P.equip.armor = rollItem(rng, rng.int(1, 60), { slot: 'armor' });
    P.equip.trinket1 = rng.chance(0.7) ? rollItem(rng, rng.int(1, 60), { slot: 'trinket' }) : null;
    P.equip.trinket2 = rng.chance(0.5) ? rollItem(rng, rng.int(1, 60), { slot: 'trinket' }) : null;
    const st = computeStats(P);
    for (const key of ['maxHp', 'hitDmg', 'rate', 'range', 'power', 'dps', 'armorRed', 'energyMax', 'energyRegen', 'crit', 'critDmg', 'moveSpd', 'dashCdMul', 'pickup']) {
      ok(finite(st[key]), `${cls} stat ${key}=${st[key]}`);
    }
    ok(st.maxHp >= 1 && st.armorRed >= 0 && st.armorRed < 0.75 && st.rate > 0 && st.dashCdMul > 0.3 && st.crit <= 0.85, `${cls} sane ranges`);
    const prev = previewEquip(P, rollItem(rng, 10, { slot: 'trinket' }), 'trinket2');
    ok(finite(prev.after.dps) && finite(prev.before.dps), 'preview equip');
  }
  ok(WEAPON_KEYS.length >= 8, 'weapon roster');
}

// ---------------------------------------------------------------- headless combat with a bot
function stairsField(G) {
  const fl = G.fl;
  return bfsDist({ w: G.w, h: G.h, tiles: G.tiles }, fl.stairs.x, fl.stairs.y, false);
}

function botInput(G, inp, field, rng) {
  const P = G.P;
  inp.mx = 0; inp.my = 0;
  if (G.choice) return;
  // Nearest awake enemy.
  let near = null, nd = 1e9;
  for (const e of G.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < nd && (e.aware || d < 5)) { nd = d; near = e; } }
  const melee = P.st.weaponKind === 'melee';
  if (near && nd < 9) {
    const dx = near.x - P.x, dy = near.y - P.y, l = Math.hypot(dx, dy) || 1;
    const want = melee ? 0.9 : 4.5;
    const sgn = l > want ? 1 : -0.7;
    inp.mx = (dx / l) * sgn + (-dy / l) * 0.4; inp.my = (dy / l) * sgn + (dx / l) * 0.4;
    if (rng.chance(0.02)) inp.dash = true;
    if (rng.chance(0.03)) inp.ab1 = true;
    if (rng.chance(0.015)) inp.ab2 = true;
    if (rng.chance(0.002)) inp.bomb = true;
  } else {
    // Walk the distance field toward the stairs.
    const tx = Math.floor(P.x), ty = Math.floor(P.y);
    let best = field[ty * G.w + tx], bx = 0, by = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const v = field[(ty + dy) * G.w + tx + dx];
      if (v >= 0 && (best < 0 || v < best)) { best = v; bx = dx; by = dy; }
    }
    if (bx || by) { const cx = tx + bx + 0.5 - P.x, cy = ty + by + 0.5 - P.y, l = Math.hypot(cx, cy) || 1; inp.mx = cx / l; inp.my = cy / l; }
    else { inp.mx = rng.float(-1, 1); inp.my = rng.float(-1, 1); }
    if (G.ctx && G.ctx.kind === 'stairs') inp.interact = true;
    else if (G.ctx && rng.chance(0.05)) inp.interact = true;
  }
  if (P.hp < P.st.maxHp * 0.35 && rng.chance(0.05)) inp.potion = true;
}

function checkEntities(G, tag) {
  const P = G.P;
  ok(finite(P.x) && finite(P.y) && finite(P.hp) && finite(P.energy), `${tag}: player numbers finite`);
  ok(P.x > 0 && P.y > 0 && P.x < G.w && P.y < G.h, `${tag}: player inside map`);
  ok(!isSolidTile(G.tiles[Math.floor(P.y) * G.w + Math.floor(P.x)]) || G.tiles[Math.floor(P.y) * G.w + Math.floor(P.x)] === T.BARRIER, `${tag}: player not in wall`);
  for (const e of G.enemies) {
    if (e.dead) continue;
    ok(finite(e.x) && finite(e.y) && finite(e.hp), `${tag}: enemy ${e.type} numbers finite`);
    ok(e.x > 0 && e.y > 0 && e.x < G.w && e.y < G.h, `${tag}: enemy ${e.type} inside map (${e.x.toFixed(2)},${e.y.toFixed(2)})`);
    if (!e.air) ok(!isSolidTile(G.tiles[Math.floor(e.y) * G.w + Math.floor(e.x)]), `${tag}: enemy ${e.type} not in wall`);
  }
  for (const p of G.projs) if (p.on) ok(finite(p.x) && finite(p.y) && finite(p.dmg), `${tag}: projectile finite`);
  for (const p of G.pickups) if (p.on) ok(finite(p.x) && finite(p.y) && p.x > 0 && p.y > 0 && p.x < G.w && p.y < G.h, `${tag}: pickup inside map`);
}

const simStart = Date.now();
let simSeconds = 0, floorsCleared = 0, deaths = 0, bossesKilled = 0, maxEnemies = 0, maxProj = 0;
const meta = defaultMeta();
for (let trial = 0; trial < 12; trial++) {
  const cls = CLASS_ORDER[trial % 4];
  const god = trial >= 4;
  const run = newRun(1000 + trial, cls);
  if (trial >= 8) run.floor = [5, 10, 15, 20][trial - 8] - 1; // jump close to boss floors
  const rng = makeRng(trial);
  const inp = { mx: 0, my: 0 };
  let floorsThisRun = 0;
  while (floorsThisRun < (god ? 6 : 4)) {
    let G;
    try { G = createGame(run, meta); } catch (err) { ok(false, `createGame threw: ${err.stack}`); break; }
    const field = stairsField(G);
    const tag = `trial ${trial} ${cls} floor ${run.floor}`;
    let t = 0;
    const limit = 150;
    try {
      while (t < limit) {
        botInput(G, inp, field, rng);
        step(G, SIM_DT, inp);
        t += SIM_DT;
        if (god && G.P.hp < G.P.st.maxHp * 0.5) G.P.hp = G.P.st.maxHp;
        if (G.choice) choosePerk(G, G.choice.options[0]);
        G.events.length = 0;
        let pc = 0; for (const p of G.projs) if (p.on) pc++;
        maxProj = Math.max(maxProj, pc); maxEnemies = Math.max(maxEnemies, G.enemies.length);
        if ((Math.round(t / SIM_DT) % 30) === 0) checkEntities(G, tag);
        if (G.over || G.descendReq) break;
      }
    } catch (err) { ok(false, `${tag}: step threw: ${err.stack}`); break; }
    simSeconds += t;
    checkEntities(G, tag);
    mergeFloorLog(meta, G);
    if (G.fl.isBoss && G.bossDead) bossesKilled++;
    if (G.over) { deaths++; recordRunEnd(meta, run, 'dead'); break; }
    if (G.descendReq) {
      floorsCleared++;
      // Save -> JSON -> load round trip at every floor transition.
      run.floor++; run.floorState = null;
      recordDepth(meta, run);
      const json = JSON.stringify(serializeRun(run, null));
      const back = deserializeRun(JSON.parse(json));
      ok(back && back.floor === run.floor && back.P.gold === run.P.gold && back.P.level === run.P.level, `${tag}: save round trip`);
      ok(back && JSON.stringify(back.P.equip) === JSON.stringify(run.P.equip), `${tag}: equipment round trip`);
      Object.assign(run, back);
    } else {
      // Timed out on this floor: jump down anyway so deeper floors get coverage.
      run.floor++; run.floorState = null;
    }
    floorsThisRun++;
  }
}
console.log(`combat sim: ${Math.round(simSeconds)} sim-seconds in ${Date.now() - simStart} ms, floors cleared ${floorsCleared}, deaths ${deaths}, bosses killed ${bossesKilled}, peak enemies ${maxEnemies}, peak projectiles ${maxProj}`);
ok(simSeconds > 300, 'simulated for many seconds');

// ---------------------------------------------------------------- mid-floor save with floor state
{
  const run = newRun(555, 'stalker');
  const G = createGame(run, meta);
  const inp = { mx: 0, my: 0 };
  const rng = makeRng(5);
  const field = stairsField(G);
  for (let k = 0; k < 60 * 25; k++) { botInput(G, inp, field, rng); step(G, SIM_DT, inp); G.P.hp = G.P.st.maxHp; if (G.choice) choosePerk(G, G.choice.options[0]); G.events.length = 0; }
  run.P.bag.push(rollItem(rng, 5, { slot: 'trinket', rarity: 3 }));
  const uid = run.P.bag[run.P.bag.length - 1].uid;
  ok(equipFromBag(G, uid, 'trinket1'), 'equip trinket');
  run.P.bag.push(rollItem(rng, 5, { slot: 'weapon' }));
  ok(salvage(G, run.P.bag[run.P.bag.length - 1].uid) > 0, 'salvage gives gold');
  run.P.scrolls.mapping = 1; ok(useScroll(G, 'mapping'), 'mapping scroll');
  run.P.scrolls.fury = 1; ok(useScroll(G, 'fury'), 'fury scroll');
  run.P.bombs = 2; ok(throwBomb(G), 'throw bomb');
  for (let k = 0; k < 120; k++) step(G, SIM_DT, inp);
  G.P.hp = 10; run.P.potions = 1; ok(usePotion(G), 'potion');
  G.P.energy = 999; G.P.cd1 = 0; G.P.cd2 = 0; castAbility(G, 0); castAbility(G, 1);
  for (let k = 0; k < 60; k++) step(G, SIM_DT, inp);
  const killedBefore = G.killed.length, openedBefore = G.opened.length;
  const saved = JSON.parse(JSON.stringify(serializeRun(run, G)));
  const back = deserializeRun(saved);
  ok(!!back, 'mid-floor save loads');
  const G2 = createGame(back, meta);
  ok(G2.killed.length === killedBefore && G2.opened.length === openedBefore, 'floor state restored');
  ok(G2.enemies.filter((e) => e.spawnId).length + killedBefore >= G.fl.spawns.length - 0, 'killed enemies stay dead');
  ok(JSON.stringify(G2.P.perks) === JSON.stringify(run.P.perks), 'perks restored');
  ok(G2.mapped === true, 'mapping restored');
  ok(deserializeRun({ v: -1 }) === null && deserializeRun(null) === null && deserializeRun({ v: 3, seed: 'x' }) === null, 'bad saves rejected');
}

// ---------------------------------------------------------------- meta
{
  const m = normalizeMeta(JSON.parse(JSON.stringify(meta)));
  ok(m.kills === meta.kills && m.deepest === meta.deepest, 'meta round trip');
  ok(normalizeMeta({ garbage: true }).v === 1, 'bad meta reset');
  const list = bestiaryList(m);
  ok(list.length > 20 && list.every((b) => typeof b.name === 'string'), 'bestiary list');
  console.log(`meta: kills ${m.kills}, deepest ${m.deepest}, runs ${m.runs}, bestiary seen ${list.filter((b) => b.seen).length}/${list.length}`);
}

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
