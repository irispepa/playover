// Deepvault content tables. Pure data, no DOM or three.js.

export const T = { WALL: 0, FLOOR: 1, DOOR: 2, STAIRS: 3, SECRET: 4, SPIKES: 5, HAZARD: 6, BARRIER: 7 };
export const isSolidTile = (t) => t === 0 || t === 2 || t === 4 || t === 7;

// ---------------------------------------------------------------- biomes
export const BIOMES = [
  {
    id: 'crypt', name: 'The Crypt', bg: 0x05050a,
    floor: 0x4a4a58, floorAlt: 0x3f3f4c, wall: 0x6b6678, wallAlt: 0x5c5869, secret: 0x77705f,
    light: 0xffc27a, ambient: 0x3a3a5a, hazard: null, hazardColor: 0x000000,
    trapRate: 1.0,
    enemies: [['skeleton', 5], ['bone_archer', 3], ['bone_hound', 2.2], ['necromancer', 1.1], ['crypt_knight', 1.4]],
    boss: 'bone_tyrant',
  },
  {
    id: 'caverns', name: 'The Caverns', bg: 0x06080a,
    floor: 0x4d4436, floorAlt: 0x433b2f, wall: 0x6e604a, wallAlt: 0x5e523f, secret: 0x7d6e4c,
    light: 0xffd08a, ambient: 0x403828, hazard: 'water', hazardColor: 0x2a6f9a,
    trapRate: 0.7,
    enemies: [['goblin', 5], ['slinger', 3], ['cave_bat', 3], ['cave_slime', 2], ['rock_brute', 1.6]],
    boss: 'brood_queen',
  },
  {
    id: 'fungal', name: 'Fungal Depths', bg: 0x05080a,
    floor: 0x34433a, floorAlt: 0x2d3b33, wall: 0x4f5e48, wallAlt: 0x435240, secret: 0x60704a,
    light: 0xb8ffc8, ambient: 0x24403a, hazard: 'toxic', hazardColor: 0x7fd13b,
    trapRate: 0.6,
    enemies: [['sporeling', 3.5], ['myconid', 2.5], ['fungal_shaman', 1.3], ['toxic_slime', 2.2], ['mire_wraith', 1.6], ['goblin', 2]],
    boss: 'rot_king',
  },
  {
    id: 'forge', name: 'The Sunken Forge', bg: 0x0a0504,
    floor: 0x4a3a34, floorAlt: 0x3f312c, wall: 0x5f4a42, wallAlt: 0x523f38, secret: 0x6e5240,
    light: 0xffa060, ambient: 0x4a2a20, hazard: 'lava', hazardColor: 0xff6a1a,
    trapRate: 0.9,
    enemies: [['ember_imp', 3.5], ['forge_guard', 1.8], ['flame_caster', 2], ['molten_hound', 2.2], ['automaton', 3.5]],
    boss: 'iron_colossus',
  },
  {
    id: 'frozen', name: 'Frozen Halls', bg: 0x04070c,
    floor: 0x4a5866, floorAlt: 0x415060, wall: 0x6f8496, wallAlt: 0x627688, secret: 0x8396a4,
    light: 0xcfe6ff, ambient: 0x30445a, hazard: 'ice', hazardColor: 0x9fe4ff,
    trapRate: 0.8,
    enemies: [['frost_wraith', 2], ['ice_archer', 3], ['yeti', 1.8], ['frost_slime', 2.4], ['rime_caster', 1.8], ['skeleton', 2]],
    boss: 'rime_witch',
  },
  {
    id: 'abyss', name: 'The Abyss', bg: 0x06030a,
    floor: 0x3a3048, floorAlt: 0x32293f, wall: 0x54456a, wallAlt: 0x483b5c, secret: 0x665070,
    light: 0xd8a8ff, ambient: 0x2e2040, hazard: 'void', hazardColor: 0x9a4dff,
    trapRate: 1.0,
    enemies: [['void_spawn', 4], ['gazer', 2.2], ['void_knight', 1.8], ['blinker', 2], ['abyss_caller', 1.2], ['void_bloat', 2]],
    boss: 'void_herald',
  },
];

export const HAZARDS = {
  water: { name: 'Deep water', slow: 0.45 },
  toxic: { name: 'Toxic pool', status: 'poison' },
  lava: { name: 'Lava', status: 'burn', dmg: 0.6 },
  ice: { name: 'Black ice', status: 'chill' },
  void: { name: 'Void rift', status: 'shock', dmg: 0.4 },
};

export function biomeIndex(floor) { return Math.floor((floor - 1) / 5) % BIOMES.length; }
export function biomeFor(floor) { return BIOMES[biomeIndex(floor)]; }
export function tierFor(floor) { return Math.floor((floor - 1) / (5 * BIOMES.length)); }
export const isBossFloor = (f) => f % 5 === 0;
export const isShopFloor = (f) => f % 5 === 3;

// Enemy stat scaling with depth.
export function hpScale(f) { const d = f - 1; return 1 + 0.2 * d + 0.011 * d * d; }
export function dmgScale(f) { const d = f - 1; return 1 + 0.085 * d + 0.0032 * d * d; }

// ---------------------------------------------------------------- enemies
// ai: chaser | kiter | charger | exploder | summoner | shielded | teleporter | splitter | spitter | caster | swarmer
export const ENEMIES = {
  // crypt
  skeleton: { name: 'Skeleton', ai: 'chaser', model: 'humanoid', color: 0xd9d2bd, accent: 0x5b5446, hp: 26, dmg: 7, speed: 2.3, r: 0.34, xp: 4, gold: 2, range: 0.9, windup: 0.42, cd: 1.15 },
  skeleton_minion: { name: 'Risen Bones', ai: 'chaser', model: 'humanoid', color: 0xbfb9a6, accent: 0x3f3a30, hp: 11, dmg: 5, speed: 2.6, r: 0.3, xp: 1, gold: 0, range: 0.85, windup: 0.4, cd: 1.1, minion: true },
  bone_archer: { name: 'Bone Archer', ai: 'kiter', model: 'humanoid', color: 0xc9c1a8, accent: 0x7a4b2a, hp: 19, dmg: 6, speed: 2.1, r: 0.33, xp: 5, gold: 2, range: 6, windup: 0.6, cd: 1.9, proj: { speed: 8.5, kind: 'arrow', r: 0.13 } },
  bone_hound: { name: 'Bone Hound', ai: 'charger', model: 'quadruped', color: 0xbdb59c, accent: 0x8a2020, hp: 24, dmg: 9, speed: 2.9, r: 0.36, xp: 5, gold: 2, windup: 0.7, cd: 2.6, chargeSpeed: 11, chargeTime: 0.5 },
  necromancer: { name: 'Necromancer', ai: 'summoner', model: 'caster', color: 0x3d2b4f, accent: 0x8bff9c, hp: 34, dmg: 5, speed: 1.9, r: 0.36, xp: 9, gold: 5, range: 6, cd: 6, summon: 'skeleton_minion', summonCount: 2, maxMinions: 4, minFloor: 2, proj: { speed: 6, kind: 'hex', r: 0.16 } },
  crypt_knight: { name: 'Crypt Knight', ai: 'shielded', model: 'knight', color: 0x5d6470, accent: 0xa9b6c8, hp: 55, dmg: 10, speed: 1.8, r: 0.4, xp: 9, gold: 4, range: 1.0, windup: 0.55, cd: 1.5, shieldArc: 120, turn: 2.6, minFloor: 2 },
  // caverns
  goblin: { name: 'Cave Goblin', ai: 'chaser', model: 'humanoid', scale: 0.85, color: 0x6f9a3c, accent: 0x6a4a2a, hp: 20, dmg: 6, speed: 3.1, r: 0.3, xp: 4, gold: 3, range: 0.8, windup: 0.32, cd: 0.9 },
  slinger: { name: 'Goblin Slinger', ai: 'kiter', model: 'humanoid', scale: 0.85, color: 0x87a84a, accent: 0x8a6a3a, hp: 16, dmg: 6, speed: 2.6, r: 0.3, xp: 5, gold: 3, range: 5.5, windup: 0.5, cd: 1.6, proj: { speed: 9, kind: 'rock', r: 0.14, count: 3, spread: 0.32 } },
  cave_bat: { name: 'Cave Bat', ai: 'swarmer', model: 'bat', color: 0x4a3a4a, accent: 0xd04050, hp: 9, dmg: 4, speed: 4.0, r: 0.25, xp: 2, gold: 1, cd: 0.8, flying: true },
  cave_slime: { name: 'Cave Slime', ai: 'splitter', model: 'blob', color: 0x6fc0a0, accent: 0x2a6050, hp: 34, dmg: 7, speed: 1.9, r: 0.5, xp: 3, gold: 1, cd: 0.9, size: 2 },
  rock_brute: { name: 'Rock Brute', ai: 'charger', model: 'golem', color: 0x7a6e5e, accent: 0xff9040, hp: 62, dmg: 13, speed: 1.7, r: 0.5, xp: 10, gold: 5, windup: 0.85, cd: 3.2, chargeSpeed: 9.5, chargeTime: 0.75, minFloor: 7 },
  // fungal
  sporeling: { name: 'Sporeling', ai: 'exploder', model: 'mushroom', color: 0xc8a050, accent: 0x7fd13b, hp: 14, dmg: 14, speed: 3.0, r: 0.3, xp: 3, gold: 1, fuse: 0.8, blastR: 1.8, status: 'poison', cloud: 'poison' },
  myconid: { name: 'Myconid', ai: 'spitter', model: 'mushroom', scale: 1.35, color: 0xa05a8a, accent: 0xe8d070, hp: 42, dmg: 6, speed: 0, r: 0.45, xp: 7, gold: 3, cd: 2.4, windup: 0.6, burst: 8, proj: { speed: 5.5, kind: 'spore', r: 0.17 }, status: 'poison' },
  fungal_shaman: { name: 'Fungal Shaman', ai: 'summoner', model: 'caster', color: 0x5a7a3a, accent: 0xc8ff70, hp: 36, dmg: 6, speed: 2.0, r: 0.36, xp: 10, gold: 5, range: 6, cd: 6.5, summon: 'sporeling', summonCount: 2, maxMinions: 3, minFloor: 12, proj: { speed: 6, kind: 'spore', r: 0.16 } },
  toxic_slime: { name: 'Toxic Slime', ai: 'splitter', model: 'blob', color: 0x9adf3a, accent: 0x406a10, hp: 38, dmg: 7, speed: 2.0, r: 0.5, xp: 4, gold: 2, cd: 0.9, size: 2, status: 'poison' },
  mire_wraith: { name: 'Mire Wraith', ai: 'teleporter', model: 'floater', color: 0x5a8a70, accent: 0xd0ffd0, hp: 30, dmg: 9, speed: 2.0, r: 0.34, xp: 8, gold: 4, range: 1.0, windup: 0.38, cd: 3.5, flying: true, status: 'poison' },
  // forge
  ember_imp: { name: 'Ember Imp', ai: 'exploder', model: 'imp', color: 0xff6030, accent: 0xffd040, hp: 16, dmg: 16, speed: 3.6, r: 0.3, xp: 4, gold: 2, fuse: 0.7, blastR: 1.9, status: 'burn', cloud: 'fire' },
  forge_guard: { name: 'Forge Guard', ai: 'shielded', model: 'knight', color: 0x6a4a3a, accent: 0xff9040, hp: 70, dmg: 12, speed: 1.8, r: 0.42, xp: 11, gold: 6, range: 1.05, windup: 0.55, cd: 1.5, shieldArc: 130, turn: 2.4 },
  flame_caster: { name: 'Flame Cultist', ai: 'caster', model: 'caster', color: 0x8a2a20, accent: 0xffa040, hp: 32, dmg: 13, speed: 2.0, r: 0.35, xp: 9, gold: 5, range: 7, cd: 3.4, zoneR: 1.3, zoneDelay: 1.0, zones: 3, status: 'burn' },
  molten_hound: { name: 'Molten Hound', ai: 'charger', model: 'quadruped', color: 0x8a3a20, accent: 0xffb040, hp: 34, dmg: 11, speed: 3.0, r: 0.38, xp: 7, gold: 3, windup: 0.6, cd: 2.4, chargeSpeed: 12, chargeTime: 0.5, status: 'burn', trail: 'fire' },
  automaton: { name: 'Automaton', ai: 'chaser', model: 'golem', scale: 0.8, color: 0x8a7a60, accent: 0x40d0ff, hp: 44, dmg: 10, speed: 2.4, r: 0.4, xp: 7, gold: 4, range: 1.0, windup: 0.4, cd: 1.0 },
  // frozen
  frost_wraith: { name: 'Frost Wraith', ai: 'teleporter', model: 'floater', color: 0x9fc8e8, accent: 0xffffff, hp: 34, dmg: 11, speed: 2.2, r: 0.34, xp: 9, gold: 4, range: 1.0, windup: 0.36, cd: 3.2, flying: true, status: 'chill' },
  ice_archer: { name: 'Ice Archer', ai: 'kiter', model: 'humanoid', color: 0x7aa0c0, accent: 0xcff0ff, hp: 26, dmg: 9, speed: 2.3, r: 0.33, xp: 7, gold: 3, range: 6.5, windup: 0.55, cd: 1.7, proj: { speed: 10, kind: 'ice', r: 0.15 }, status: 'chill' },
  yeti: { name: 'Yeti', ai: 'charger', model: 'golem', color: 0xe0e8f0, accent: 0x6090c0, hp: 80, dmg: 15, speed: 2.0, r: 0.55, xp: 12, gold: 6, windup: 0.8, cd: 3.0, chargeSpeed: 10.5, chargeTime: 0.7, status: 'chill' },
  frost_slime: { name: 'Frost Slime', ai: 'splitter', model: 'blob', color: 0xa8e0ff, accent: 0x4080c0, hp: 44, dmg: 9, speed: 2.1, r: 0.5, xp: 5, gold: 2, cd: 0.9, size: 2, status: 'chill' },
  rime_caster: { name: 'Rime Caster', ai: 'caster', model: 'caster', color: 0x2a4a7a, accent: 0xbfe8ff, hp: 36, dmg: 14, speed: 2.0, r: 0.35, xp: 10, gold: 5, range: 7, cd: 3.6, zoneR: 1.4, zoneDelay: 1.0, zones: 3, status: 'chill' },
  // abyss
  void_spawn: { name: 'Voidspawn', ai: 'swarmer', model: 'blob', scale: 0.6, color: 0x6a3a9a, accent: 0xff60ff, hp: 16, dmg: 7, speed: 4.0, r: 0.28, xp: 3, gold: 1, cd: 0.8 },
  gazer: { name: 'Gazer', ai: 'spitter', model: 'eye', color: 0x8a5aa8, accent: 0xff4060, hp: 50, dmg: 9, speed: 0.9, r: 0.45, xp: 10, gold: 5, cd: 2.0, windup: 0.5, burst: 10, spin: true, proj: { speed: 6, kind: 'void', r: 0.17 }, status: 'shock', flying: true },
  void_knight: { name: 'Void Knight', ai: 'shielded', model: 'knight', color: 0x3a2a5a, accent: 0xc080ff, hp: 85, dmg: 15, speed: 2.0, r: 0.42, xp: 13, gold: 7, range: 1.05, windup: 0.5, cd: 1.4, shieldArc: 130, turn: 3.0, status: 'shock' },
  blinker: { name: 'Blinker', ai: 'teleporter', model: 'imp', color: 0x9a40d0, accent: 0xffffff, hp: 32, dmg: 12, speed: 2.4, r: 0.32, xp: 9, gold: 4, range: 1.0, windup: 0.32, cd: 2.6 },
  abyss_caller: { name: 'Abyss Caller', ai: 'summoner', model: 'caster', color: 0x24143a, accent: 0xff60ff, hp: 44, dmg: 8, speed: 2.0, r: 0.36, xp: 12, gold: 6, range: 6.5, cd: 6, summon: 'void_spawn', summonCount: 3, maxMinions: 5, proj: { speed: 7, kind: 'void', r: 0.16 } },
  void_bloat: { name: 'Void Bloat', ai: 'exploder', model: 'bloat', color: 0x7a40b0, accent: 0xffe060, hp: 30, dmg: 20, speed: 2.4, r: 0.42, xp: 6, gold: 3, fuse: 0.9, blastR: 2.2, status: 'shock' },
};

// Slime sizes: 2 = big, 1 = medium, 0 = small (no further split).
export const SLIME_SIZE = [{ scale: 0.5, hp: 0.25, r: 0.26 }, { scale: 0.75, hp: 0.5, r: 0.36 }, { scale: 1, hp: 1, r: 0.5 }];

export const ELITES = {
  swift: { name: 'Swift', color: 0x6ef0ff, speed: 1.45, cd: 0.7 },
  brutal: { name: 'Brutal', color: 0xff5a3a, dmg: 1.5, size: 1.15 },
  armored: { name: 'Armored', color: 0xb8c0d0, taken: 0.55 },
  vampiric: { name: 'Vampiric', color: 0xd0203a, leech: 0.6 },
  blazing: { name: 'Blazing', color: 0xff9a2a, onHit: 'burn', trail: 'fire' },
  frostbound: { name: 'Frostbound', color: 0x9fd8ff, onHit: 'chill', deathNova: true },
  volatile: { name: 'Volatile', color: 0xffe040, deathBlast: true },
  warding: { name: 'Warding', color: 0xd8a0ff, ward: true },
};

// ---------------------------------------------------------------- bosses
// Attacks: volley(ring|spiral|fan) slam leap charge summon zones blink chase
export const BOSSES = {
  bone_tyrant: {
    name: 'The Bone Tyrant', model: 'humanoid', scale: 2.2, color: 0xe8e0c8, accent: 0xb02020, crown: 0xf0c040,
    hp: 820, dmg: 13, speed: 2.1, r: 0.85, xp: 120, gold: 80,
    attacks: {
      slam: { type: 'slam', r: 3.0, delay: 0.95, dmg: 1.5 },
      ring: { type: 'volley', shape: 'ring', count: 14, speed: 6, repeats: 2, interval: 0.45, kind: 'bone' },
      spiral: { type: 'volley', shape: 'spiral', count: 4, speed: 6.5, repeats: 16, interval: 0.12, spin: 0.32, kind: 'bone' },
      summon: { type: 'summon', enemy: 'skeleton_minion', count: 3 },
      charge: { type: 'charge', windup: 0.8, speed: 12, time: 0.75, dmg: 1.3, repeats: 1 },
      charge3: { type: 'charge', windup: 0.6, speed: 13, time: 0.6, dmg: 1.3, repeats: 3 },
      chase: { type: 'chase', time: 2.6 },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['chase', 'slam', 'ring', 'charge', 'summon'] },
      { at: 0.5, speed: 1.3, patterns: ['spiral', 'slam', 'charge3', 'summon', 'chase', 'ring'], say: 'The Bone Tyrant howls with rage!' },
    ],
  },
  brood_queen: {
    name: 'Brood Queen', model: 'blob', scale: 3.2, color: 0x6fc0a0, accent: 0x205040, crown: 0xf0c040,
    hp: 900, dmg: 14, speed: 1.6, r: 1.1, xp: 140, gold: 90,
    attacks: {
      leap: { type: 'leap', r: 2.6, delay: 1.0, dmg: 1.6, ring: 10, kind: 'slime' },
      spit: { type: 'volley', shape: 'fan', count: 5, spread: 0.7, speed: 7, repeats: 3, interval: 0.35, kind: 'slime', status: 'poison' },
      brood: { type: 'summon', enemy: 'cave_slime', count: 2, size: 1 },
      zones: { type: 'zones', count: 4, r: 1.5, delay: 1.1, dmg: 1.2, spread: 3, status: 'poison' },
      chase: { type: 'chase', time: 2.2 },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['leap', 'spit', 'chase', 'brood'] },
      { at: 0.55, speed: 1.3, patterns: ['leap', 'zones', 'spit', 'leap', 'brood'], say: 'The Brood Queen quivers and swells!' },
    ],
  },
  rot_king: {
    name: 'The Rot King', model: 'mushroom', scale: 2.6, color: 0x9a5a7a, accent: 0xd0ff60, crown: 0xd0ff60,
    hp: 1000, dmg: 15, speed: 1.8, r: 0.95, xp: 160, gold: 100,
    attacks: {
      spores: { type: 'volley', shape: 'ring', count: 16, speed: 5, repeats: 3, interval: 0.5, kind: 'spore', status: 'poison' },
      clouds: { type: 'zones', count: 5, r: 1.6, delay: 1.0, dmg: 1.0, spread: 3.5, status: 'poison', linger: 'poison' },
      sprout: { type: 'summon', enemy: 'sporeling', count: 3 },
      blink: { type: 'blink' },
      slam: { type: 'slam', r: 3.2, delay: 0.9, dmg: 1.5, status: 'poison' },
      chase: { type: 'chase', time: 2.0 },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['spores', 'chase', 'clouds', 'sprout', 'slam'] },
      { at: 0.5, speed: 1.25, patterns: ['blink', 'spores', 'clouds', 'blink', 'slam', 'sprout'], say: 'The Rot King bursts into bloom!' },
    ],
  },
  iron_colossus: {
    name: 'Iron Colossus', model: 'golem', scale: 2.3, color: 0x7a6a5a, accent: 0xff7020, crown: 0xffb040,
    hp: 1150, dmg: 17, speed: 1.7, r: 1.0, xp: 180, gold: 110,
    attacks: {
      charge3: { type: 'charge', windup: 0.75, speed: 13, time: 0.7, dmg: 1.4, repeats: 3, trail: 'fire' },
      slam: { type: 'slam', r: 3.4, delay: 1.0, dmg: 1.6, status: 'burn', ring: 12, kind: 'fire' },
      flames: { type: 'volley', shape: 'fan', count: 7, spread: 0.9, speed: 8, repeats: 4, interval: 0.3, kind: 'fire', status: 'burn' },
      lava: { type: 'zones', count: 6, r: 1.4, delay: 1.0, dmg: 1.1, spread: 4, status: 'burn', linger: 'fire' },
      chase: { type: 'chase', time: 2.4 },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['chase', 'slam', 'flames', 'charge3'] },
      { at: 0.5, speed: 1.25, patterns: ['lava', 'charge3', 'flames', 'slam', 'lava'], say: 'The Colossus glows white-hot!' },
    ],
  },
  rime_witch: {
    name: 'The Rime Witch', model: 'caster', scale: 2.0, color: 0x3a5a9a, accent: 0xcff4ff, crown: 0xcff4ff,
    hp: 1050, dmg: 16, speed: 2.2, r: 0.75, xp: 200, gold: 120,
    attacks: {
      blink: { type: 'blink' },
      shards: { type: 'volley', shape: 'spiral', count: 5, speed: 7, repeats: 18, interval: 0.11, spin: 0.28, kind: 'ice', status: 'chill' },
      nova: { type: 'slam', r: 4.2, delay: 1.2, dmg: 1.5, status: 'chill' },
      wraiths: { type: 'summon', enemy: 'frost_wraith', count: 2 },
      fan: { type: 'volley', shape: 'fan', count: 5, spread: 0.5, speed: 11, repeats: 3, interval: 0.25, kind: 'ice', status: 'chill' },
      zones: { type: 'zones', count: 5, r: 1.5, delay: 1.0, dmg: 1.2, spread: 3.5, status: 'chill' },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['fan', 'blink', 'nova', 'shards', 'zones'] },
      { at: 0.5, speed: 1.3, patterns: ['blink', 'shards', 'wraiths', 'blink', 'nova', 'fan', 'zones'], say: 'A blizzard swirls around the Witch!' },
    ],
  },
  void_herald: {
    name: 'The Void Herald', model: 'eye', scale: 2.6, color: 0x5a2a8a, accent: 0xff60ff, crown: 0xffe060,
    hp: 1250, dmg: 18, speed: 1.9, r: 1.0, xp: 240, gold: 140,
    attacks: {
      spiral: { type: 'volley', shape: 'spiral', count: 6, speed: 6, repeats: 20, interval: 0.1, spin: 0.25, kind: 'void', status: 'shock' },
      ring: { type: 'volley', shape: 'ring', count: 20, speed: 5.5, repeats: 3, interval: 0.4, kind: 'void' },
      blink: { type: 'blink' },
      zones: { type: 'zones', count: 6, r: 1.5, delay: 0.9, dmg: 1.2, spread: 4, status: 'shock' },
      spawn: { type: 'summon', enemy: 'void_spawn', count: 4 },
      leap: { type: 'leap', r: 2.8, delay: 0.95, dmg: 1.6, ring: 12, kind: 'void' },
    },
    phases: [
      { at: 1, speed: 1, patterns: ['ring', 'blink', 'zones', 'spawn', 'leap'] },
      { at: 0.6, speed: 1.2, patterns: ['spiral', 'blink', 'zones', 'leap', 'spawn'], say: 'The Herald tears the air apart!' },
      { at: 0.25, speed: 1.4, patterns: ['spiral', 'leap', 'zones', 'ring', 'blink'], say: 'Reality cracks around the Herald!' },
    ],
  },
};

// ---------------------------------------------------------------- classes and abilities
export const CLASSES = {
  warden: {
    id: 'warden', name: 'Warden', color: 0x5a8ad0, accent: 0xd8dee8, blurb: 'A shield-bearer who wades into the press. Tough, steady, hits hard up close.',
    weapon: 'sword', armor: 'mail', abilities: ['bash', 'bulwark'],
    stats: { hpPct: 0.25, armor: 8 }, dashCd: 1.4,
  },
  arcanist: {
    id: 'arcanist', name: 'Arcanist', color: 0x8a5ad0, accent: 0xffd070, blurb: 'A scholar of frost and flame. Fragile, but controls the whole room.',
    weapon: 'staff', armor: 'robe', abilities: ['nova', 'fireball'],
    stats: { energyRegen: 4, burnCh: 0.08, chillCh: 0.08, abilityDmg: 0.15 }, dashCd: 1.4,
  },
  stalker: {
    id: 'stalker', name: 'Stalker', color: 0x3a7a5a, accent: 0xc8b080, blurb: 'A hunter who never stands still. Quick dashes, deadly crits from range.',
    weapon: 'bow', armor: 'leather', abilities: ['fan', 'decoy'],
    stats: { crit: 0.08, moveSpd: 0.08, bleedCh: 0.05 }, dashCd: 1.0,
  },
  hexblade: {
    id: 'hexblade', name: 'Hexblade', color: 0xa02a3a, accent: 0x60e0ff, blurb: 'A duelist bound to blood and storm. Drains foes to stay alive.',
    weapon: 'dagger', armor: 'leather', abilities: ['siphon', 'chain'],
    stats: { lifesteal: 0.04, shockCh: 0.06, bleedCh: 0.06 }, dashCd: 1.2,
    unlock: { deepest: 6, text: 'Reach floor 6' },
  },
};
export const CLASS_ORDER = ['warden', 'arcanist', 'stalker', 'hexblade'];

export const ABILITIES = {
  bash: { name: 'Shield Bash', cd: 5, energy: 20, icon: 'shield', desc: 'Slam a cone in front of you, stunning and hurling foes back.' },
  bulwark: { name: 'Bulwark', cd: 14, energy: 30, icon: 'wall', desc: 'For 4 seconds take 60% less damage and reflect projectiles.' },
  nova: { name: 'Frost Nova', cd: 7, energy: 25, icon: 'snow', desc: 'A ring of frost that freezes everything around you.' },
  fireball: { name: 'Fireball', cd: 4, energy: 20, icon: 'fire', desc: 'Hurl a fireball that bursts and sets foes ablaze.' },
  fan: { name: 'Blade Fan', cd: 5, energy: 20, icon: 'fan', desc: 'Throw seven knives in a wide cone. They make foes bleed.' },
  decoy: { name: 'Shadow Decoy', cd: 12, energy: 25, icon: 'ghost', desc: 'Leave a decoy that draws enemies, then explodes.' },
  siphon: { name: 'Blood Siphon', cd: 6, energy: 25, icon: 'drop', desc: 'Drain every nearby foe, healing for part of the damage.' },
  chain: { name: 'Chain Lightning', cd: 4, energy: 20, icon: 'bolt', desc: 'Lightning leaps between up to six enemies.' },
};

// ---------------------------------------------------------------- items
export const RARITIES = [
  { id: 'common', name: 'Common', color: '#c8ccd4', hex: 0xc8ccd4, mul: 1, affixes: [0, 0], value: 1 },
  { id: 'magic', name: 'Magic', color: '#5ea8ff', hex: 0x5ea8ff, mul: 1.08, affixes: [1, 2], value: 2.2 },
  { id: 'rare', name: 'Rare', color: '#ffd24a', hex: 0xffd24a, mul: 1.16, affixes: [3, 3], value: 4.5 },
  { id: 'epic', name: 'Epic', color: '#c070ff', hex: 0xc070ff, mul: 1.26, affixes: [4, 4], value: 8 },
  { id: 'legendary', name: 'Legendary', color: '#ff8a2a', hex: 0xff8a2a, mul: 1.34, affixes: [3, 3], value: 14 },
];

export const WEAPONS = {
  sword: { name: 'Sword', kind: 'melee', dmg: 10, rate: 2.0, range: 1.45, arc: 110, knock: 3, icon: 'sword' },
  axe: { name: 'Axe', kind: 'melee', dmg: 17, rate: 1.2, range: 1.55, arc: 150, knock: 5, icon: 'axe', implicit: { bleedCh: 0.08 } },
  dagger: { name: 'Dagger', kind: 'melee', dmg: 6.2, rate: 3.3, range: 1.15, arc: 85, knock: 1.5, icon: 'dagger', implicit: { crit: 0.08 } },
  spear: { name: 'Spear', kind: 'melee', dmg: 12, rate: 1.65, range: 2.3, arc: 45, knock: 4, icon: 'spear' },
  hammer: { name: 'Hammer', kind: 'melee', dmg: 21, rate: 0.95, range: 1.5, arc: 130, knock: 8, icon: 'hammer', implicit: { area: 0.15 } },
  bow: { name: 'Bow', kind: 'ranged', dmg: 9, rate: 2.0, range: 7.5, knock: 1.5, icon: 'bow', proj: { speed: 15, kind: 'arrow', r: 0.12, pierce: 0 } },
  crossbow: { name: 'Crossbow', kind: 'ranged', dmg: 21, rate: 0.85, range: 8, knock: 5, icon: 'crossbow', proj: { speed: 21, kind: 'bolt', r: 0.13, pierce: 1 } },
  staff: { name: 'Staff', kind: 'ranged', dmg: 13, rate: 1.35, range: 7, knock: 2, icon: 'staff', proj: { speed: 10, kind: 'orb', r: 0.2, pierce: 0, splash: 1.1 } },
  wand: { name: 'Wand', kind: 'ranged', dmg: 5.2, rate: 3.5, range: 6.5, knock: 0.5, icon: 'wand', proj: { speed: 12, kind: 'spark', r: 0.13, pierce: 0, homing: 5 } },
};
export const WEAPON_KEYS = Object.keys(WEAPONS);

export const ARMORS = {
  robe: { name: 'Robe', armor: 3, icon: 'robe', implicit: { energyRegen: 2 } },
  leather: { name: 'Leathers', armor: 6, icon: 'leather', implicit: { moveSpd: 0.03 } },
  mail: { name: 'Chainmail', armor: 11, icon: 'mail' },
  plate: { name: 'Plate', armor: 18, icon: 'plate', implicit: { moveSpd: -0.06 } },
};
export const ARMOR_KEYS = Object.keys(ARMORS);

export const TRINKETS = {
  ring: { name: 'Ring', icon: 'ring', implicit: { crit: 0.03 } },
  amulet: { name: 'Amulet', icon: 'amulet', implicit: { maxHp: 10 }, scaleImplicit: true },
  charm: { name: 'Charm', icon: 'charm', implicit: { energyRegen: 2 } },
  talisman: { name: 'Talisman', icon: 'talisman', implicit: { dmgPct: 0.05 } },
};
export const TRINKET_KEYS = Object.keys(TRINKETS);

// slots: w weapon, a armor, t trinket. scale: grows with item level.
export const AFFIXES = [
  { stat: 'dmgPct', slots: 'wt', min: 0.06, max: 0.16, pre: 'Cruel' },
  { stat: 'flatDmg', slots: 'w', min: 1, max: 3, scale: true, pre: 'Honed' },
  { stat: 'atkSpd', slots: 'wt', min: 0.05, max: 0.12, pre: 'Swift' },
  { stat: 'crit', slots: 'wt', min: 0.03, max: 0.07, pre: 'Keen' },
  { stat: 'critDmg', slots: 'wt', min: 0.15, max: 0.35, suf: 'of Ruin' },
  { stat: 'maxHp', slots: 'at', min: 8, max: 18, scale: true, suf: 'of the Bear' },
  { stat: 'hpPct', slots: 'a', min: 0.05, max: 0.1, suf: 'of Vigor' },
  { stat: 'armor', slots: 'a', min: 3, max: 7, scale: true, pre: 'Sturdy' },
  { stat: 'moveSpd', slots: 'at', min: 0.04, max: 0.08, suf: 'of the Fox' },
  { stat: 'energyRegen', slots: 'at', min: 1.5, max: 3.5, suf: 'of Focus' },
  { stat: 'hpRegen', slots: 'at', min: 0.4, max: 1.0, scale: true, suf: 'of Mending' },
  { stat: 'cdr', slots: 'at', min: 0.05, max: 0.1, suf: 'of Haste' },
  { stat: 'lifesteal', slots: 'wt', min: 0.01, max: 0.03, pre: 'Vampiric' },
  { stat: 'thorns', slots: 'a', min: 3, max: 7, scale: true, pre: 'Spiked' },
  { stat: 'burnCh', slots: 'wt', min: 0.06, max: 0.14, pre: 'Burning' },
  { stat: 'poisonCh', slots: 'wt', min: 0.06, max: 0.14, pre: 'Venomous' },
  { stat: 'chillCh', slots: 'wt', min: 0.06, max: 0.14, pre: 'Frozen' },
  { stat: 'shockCh', slots: 'wt', min: 0.06, max: 0.14, pre: 'Charged' },
  { stat: 'bleedCh', slots: 'wt', min: 0.06, max: 0.14, pre: 'Serrated' },
  { stat: 'goldFind', slots: 'at', min: 0.1, max: 0.25, suf: 'of Greed' },
  { stat: 'magicFind', slots: 't', min: 0.1, max: 0.25, suf: 'of Fortune' },
  { stat: 'dashCd', slots: 'a', min: 0.06, max: 0.14, suf: 'of the Wind' },
  { stat: 'pickup', slots: 't', min: 0.6, max: 1.4, suf: 'of Attraction' },
  { stat: 'area', slots: 'wt', min: 0.08, max: 0.18, suf: 'of Reach' },
  { stat: 'abilityDmg', slots: 'wat', min: 0.08, max: 0.2, suf: 'of Power' },
];

export const UNIQUES = [
  { id: 'emberbrand', slot: 'weapon', name: 'Emberbrand', fx: { burnAlways: 1 }, desc: 'Every hit sets foes ablaze.' },
  { id: 'frostfang', slot: 'weapon', name: 'Frostfang', fx: { chillHit: 35 }, desc: 'Every hit chills deeply.' },
  { id: 'stormcall', slot: 'weapon', name: 'Stormcall', fx: { thunderEvery: 4 }, desc: 'Every 4th hit calls down lightning.' },
  { id: 'giantsbane', slot: 'weapon', name: "Giant's Bane", fx: { giantslayer: 0.5 }, desc: '+50% damage to elites and bosses.' },
  { id: 'echoblade', slot: 'weapon', name: 'Echoblade', fx: { echoStrike: 0.5 }, desc: 'Every attack strikes again for half damage.' },
  { id: 'phoenix', slot: 'armor', name: 'Phoenix Mantle', fx: { phoenix: 1 }, desc: 'Once per floor, rise again at 40% health.' },
  { id: 'briar', slot: 'armor', name: 'Briar Plate', fx: { reflect: 0.6 }, desc: 'Reflects 60% of melee damage taken.' },
  { id: 'windwalker', slot: 'armor', name: 'Windwalker Garb', stats: { moveSpd: 0.12, dashCd: 0.25 }, fx: { dashDamage: 1 }, desc: 'Dash through foes to cut them.' },
  { id: 'gildedheart', slot: 'trinket', name: 'Gilded Heart', fx: { goldHeal: 1 }, desc: 'Picking up gold heals you.' },
  { id: 'starseeker', slot: 'trinket', name: 'Starseeker Lens', stats: { projectiles: 1, area: 0.2 }, desc: '+1 projectile, wider swings.' },
  { id: 'bloodstone', slot: 'trinket', name: 'Bloodstone', stats: { lifesteal: 0.03 }, fx: { vampKill: 0.02 }, desc: 'Kills heal you.' },
  { id: 'orrery', slot: 'trinket', name: 'Orrery Charm', fx: { orbs: 2 }, desc: 'Two guardian orbs circle you.' },
];

// Stat display info for UI and comparisons. fmt: pct | num | dec
export const STAT_INFO = {
  dmgPct: { label: 'Damage', icon: 'sword', fmt: 'pct' },
  flatDmg: { label: 'Flat damage', icon: 'sword', fmt: 'num' },
  atkSpd: { label: 'Attack speed', icon: 'clock', fmt: 'pct' },
  crit: { label: 'Crit chance', icon: 'star', fmt: 'pct' },
  critDmg: { label: 'Crit damage', icon: 'star', fmt: 'pct' },
  maxHp: { label: 'Max health', icon: 'heart', fmt: 'num' },
  hpPct: { label: 'Health', icon: 'heart', fmt: 'pct' },
  armor: { label: 'Armour', icon: 'shield', fmt: 'num' },
  moveSpd: { label: 'Move speed', icon: 'boot', fmt: 'pct' },
  energyRegen: { label: 'Energy regen', icon: 'bolt', fmt: 'dec' },
  hpRegen: { label: 'Health regen', icon: 'heart', fmt: 'dec' },
  cdr: { label: 'Cooldowns', icon: 'clock', fmt: 'pct' },
  lifesteal: { label: 'Lifesteal', icon: 'drop', fmt: 'pct' },
  thorns: { label: 'Thorns', icon: 'thorn', fmt: 'num' },
  burnCh: { label: 'Burn chance', icon: 'fire', fmt: 'pct' },
  poisonCh: { label: 'Poison chance', icon: 'poison', fmt: 'pct' },
  chillCh: { label: 'Chill chance', icon: 'snow', fmt: 'pct' },
  shockCh: { label: 'Shock chance', icon: 'bolt', fmt: 'pct' },
  bleedCh: { label: 'Bleed chance', icon: 'drop', fmt: 'pct' },
  goldFind: { label: 'Gold find', icon: 'coin', fmt: 'pct' },
  magicFind: { label: 'Magic find', icon: 'gem', fmt: 'pct' },
  dashCd: { label: 'Dash cooldown', icon: 'dash', fmt: 'pct' },
  pickup: { label: 'Pickup range', icon: 'magnet', fmt: 'dec' },
  area: { label: 'Area', icon: 'ring', fmt: 'pct' },
  abilityDmg: { label: 'Ability damage', icon: 'spark', fmt: 'pct' },
  energyMax: { label: 'Max energy', icon: 'bolt', fmt: 'num' },
  projectiles: { label: 'Projectiles', icon: 'bow', fmt: 'num' },
  pierce: { label: 'Pierce', icon: 'spear', fmt: 'num' },
};

// ---------------------------------------------------------------- perks (relics)
// stats are added per stack. fx are numeric effect flags added per stack.
export const PERK_TAGS = {
  fire: { name: 'Fire', color: '#ff7a30' }, frost: { name: 'Frost', color: '#8fd8ff' },
  storm: { name: 'Storm', color: '#ffe14a' }, venom: { name: 'Venom', color: '#8ee04a' },
  blood: { name: 'Blood', color: '#e04050' }, shadow: { name: 'Shadow', color: '#a08cff' },
  iron: { name: 'Iron', color: '#b8c4d4' }, arcane: { name: 'Arcane', color: '#ff70d8' },
};

export const PERKS = [
  // iron
  { id: 'iron_skin', name: 'Iron Skin', tags: ['iron'], max: 3, stats: { armor: 8 }, desc: '+8 armour.' },
  { id: 'stout_heart', name: 'Stout Heart', tags: ['iron'], max: 3, stats: { maxHp: 25 }, desc: '+25 max health.' },
  { id: 'thornhide', name: 'Thornhide', tags: ['iron', 'blood'], max: 3, stats: { thorns: 8 }, desc: 'Melee attackers take 8 damage, growing with depth.' },
  { id: 'aegis', name: 'Aegis', tags: ['iron', 'arcane'], max: 1, fx: { barrier: 1 }, desc: 'A barrier blocks one hit every 8 seconds.' },
  // fire
  { id: 'ember_heart', name: 'Ember Heart', tags: ['fire'], max: 3, stats: { burnCh: 0.15 }, desc: '+15% chance to burn.' },
  { id: 'kindling', name: 'Kindling', tags: ['fire'], max: 2, fx: { burnDmg: 0.5 }, desc: 'Burns deal 50% more damage.' },
  { id: 'blazing_trail', name: 'Blazing Trail', tags: ['fire', 'shadow'], max: 1, fx: { dashFire: 1 }, desc: 'Dashing leaves a trail of fire.' },
  { id: 'combustion', name: 'Combustion', tags: ['fire'], max: 1, fx: { combust: 1 }, desc: 'Burning enemies explode when they die.', unlock: { stat: 'kills', n: 100, text: 'Slay 100 monsters' } },
  // frost
  { id: 'frost_touch', name: 'Frost Touch', tags: ['frost'], max: 3, stats: { chillCh: 0.15 }, desc: '+15% chance to chill. Chill enough and foes freeze.' },
  { id: 'deep_freeze', name: 'Deep Freeze', tags: ['frost'], max: 2, fx: { freezeDmg: 0.5 }, desc: 'Frozen enemies take 50% more damage.' },
  { id: 'shatter', name: 'Shatter', tags: ['frost'], max: 1, fx: { shatter: 1 }, desc: 'Chilled enemies burst into freezing shards on death.', unlock: { stat: 'kills', n: 250, text: 'Slay 250 monsters' } },
  { id: 'rime_shell', name: 'Rime Shell', tags: ['frost', 'iron'], max: 1, fx: { chillAura: 1 }, desc: 'Enemies that strike you are frozen solid.' },
  // storm
  { id: 'storm_coil', name: 'Storm Coil', tags: ['storm'], max: 3, stats: { shockCh: 0.15 }, desc: '+15% chance to shock. Shocked foes take more damage.' },
  { id: 'static_field', name: 'Static Field', tags: ['storm', 'arcane'], max: 2, fx: { staticField: 1 }, desc: 'Every 3 seconds, zap a nearby enemy.' },
  { id: 'conductor', name: 'Conductor', tags: ['storm'], max: 2, fx: { chainShock: 1 }, desc: 'Hits on shocked foes arc to one more enemy.' },
  { id: 'thunderstrike', name: 'Thunderstrike', tags: ['storm', 'shadow'], max: 1, fx: { critSpark: 1 }, desc: 'Critical hits call down lightning.', unlock: { stat: 'elites', n: 15, text: 'Slay 15 elites' } },
  // venom
  { id: 'venom_gland', name: 'Venom Gland', tags: ['venom'], max: 3, stats: { poisonCh: 0.15 }, desc: '+15% chance to poison. Poison stacks.' },
  { id: 'contagion', name: 'Contagion', tags: ['venom'], max: 1, fx: { poisonSpread: 1 }, desc: 'Poisoned enemies spread their poison when they die.', unlock: { stat: 'deepest', n: 4, text: 'Reach floor 4' } },
  { id: 'virulence', name: 'Virulence', tags: ['venom'], max: 2, fx: { poisonCap: 4, poisonDmg: 0.3 }, desc: 'Poison stacks 4 higher and hits 30% harder.' },
  { id: 'miasma', name: 'Miasma', tags: ['venom', 'arcane'], max: 1, fx: { miasma: 1 }, desc: 'A toxic aura poisons enemies near you.' },
  // blood
  { id: 'serrated', name: 'Serrated Edge', tags: ['blood'], max: 3, stats: { bleedCh: 0.15 }, desc: '+15% chance to cause bleeding.' },
  { id: 'vampiric', name: 'Vampiric', tags: ['blood'], max: 3, stats: { lifesteal: 0.025 }, desc: '+2.5% of damage dealt heals you.' },
  { id: 'hemorrhage', name: 'Hemorrhage', tags: ['blood'], max: 1, fx: { bleedBurst: 1 }, desc: 'Five bleed stacks burst for heavy damage.', unlock: { stat: 'runs', n: 3, text: 'Finish 3 runs' } },
  { id: 'last_stand', name: 'Last Stand', tags: ['blood', 'iron'], max: 1, fx: { lastStand: 1 }, desc: 'Below 35% health: +40% damage and attack speed.' },
  { id: 'bloodlust', name: 'Bloodlust', tags: ['blood'], max: 2, fx: { vampKill: 0.02 }, desc: 'Each kill heals 2% of max health.' },
  // shadow
  { id: 'fleet', name: 'Fleet Foot', tags: ['shadow'], max: 3, stats: { moveSpd: 0.1, dashCd: 0.1 }, desc: '+10% move speed, faster dash.' },
  { id: 'momentum', name: 'Momentum', tags: ['shadow'], max: 1, fx: { momentum: 1 }, desc: 'After a dash, deal 40% more damage for 2 seconds.' },
  { id: 'phase_strike', name: 'Phase Strike', tags: ['shadow', 'iron'], max: 1, fx: { dashDamage: 1 }, desc: 'Dashing through enemies cuts them.' },
  { id: 'assassin', name: 'Assassin', tags: ['shadow'], max: 2, fx: { dashCrit: 1 }, desc: 'Your next attack after a dash always crits.' },
  { id: 'keen_eye', name: 'Keen Eye', tags: ['shadow'], max: 3, stats: { crit: 0.06 }, desc: '+6% crit chance.' },
  { id: 'brutal', name: 'Brutality', tags: ['shadow', 'blood'], max: 3, stats: { critDmg: 0.4 }, desc: '+40% crit damage.' },
  // arcane
  { id: 'focus', name: 'Focus', tags: ['arcane'], max: 3, stats: { cdr: 0.12 }, desc: 'Abilities recharge 12% faster.' },
  { id: 'overcharge', name: 'Overcharge', tags: ['arcane'], max: 3, stats: { abilityDmg: 0.3 }, desc: '+30% ability damage.' },
  { id: 'deep_reserves', name: 'Deep Reserves', tags: ['arcane'], max: 2, stats: { energyMax: 30, energyRegen: 3 }, desc: '+30 max energy, faster regen.' },
  { id: 'echo_cast', name: 'Echo Cast', tags: ['arcane'], max: 1, fx: { echoCast: 0.25 }, desc: 'Abilities have a 25% chance to skip their cooldown.', unlock: { stat: 'deepest', n: 8, text: 'Reach floor 8' } },
  { id: 'battery', name: 'Battery', tags: ['arcane', 'storm'], max: 2, fx: { battery: 6 }, desc: 'Kills restore 6 energy.' },
  { id: 'guardian_orbs', name: 'Guardian Orbs', tags: ['arcane', 'iron'], max: 2, fx: { orbs: 2 }, desc: 'Two orbs circle you and strike foes.', unlock: { stat: 'bosses', n: 1, text: 'Defeat a boss' } },
  // untagged
  { id: 'whetstone', name: 'Whetstone', tags: [], max: 5, stats: { dmgPct: 0.15 }, desc: '+15% damage.' },
  { id: 'quickened', name: 'Quickened', tags: [], max: 4, stats: { atkSpd: 0.12 }, desc: '+12% attack speed.' },
  { id: 'split_shot', name: 'Split Shot', tags: [], max: 2, stats: { projectiles: 1, area: 0.2 }, desc: '+1 projectile, and melee swings reach 20% wider.' },
  { id: 'piercing', name: 'Piercing', tags: [], max: 2, stats: { pierce: 1 }, fx: { ricochet: 1 }, desc: 'Projectiles pierce one more foe and bounce off walls.' },
  { id: 'greed', name: 'Greed', tags: [], max: 2, stats: { goldFind: 0.35, pickup: 1.5 }, desc: '+35% gold, wider pickup range.' },
  { id: 'lucky', name: 'Lucky Coin', tags: [], max: 2, stats: { magicFind: 0.35 }, desc: 'Better loot drops.' },
  { id: 'alchemist', name: 'Alchemist', tags: [], max: 2, fx: { alchemist: 1 }, desc: 'Potions heal 50% more and you can carry one more.', instant: 'potion' },
  { id: 'bombardier', name: 'Bombardier', tags: ['fire'], max: 2, fx: { bombardier: 1 }, desc: 'Bombs are bigger and stronger. Gain 2 bombs.', instant: 'bombs' },
  { id: 'executioner', name: 'Executioner', tags: ['blood'], max: 1, fx: { executioner: 0.5 }, desc: '+50% damage to enemies below 30% health.' },
  { id: 'giant_slayer', name: 'Giant Slayer', tags: ['iron'], max: 2, fx: { giantslayer: 0.3 }, desc: '+30% damage to elites and bosses.' },
  { id: 'frenzy', name: 'Frenzy', tags: ['blood', 'shadow'], max: 1, fx: { frenzy: 1 }, desc: 'Kills grant attack speed for a few seconds, stacking.' },
];

export const SYNERGIES = {
  fire: { name: 'Pyromancer', need: 3, fx: { combust: 1, burnDmg: 0.5 }, desc: 'Burning enemies explode on death. Burns hit harder.' },
  frost: { name: 'Cryomancer', need: 3, fx: { shatter: 1, chillMul: 1 }, desc: 'Chill builds twice as fast. Chilled kills shatter.' },
  storm: { name: 'Tempest', need: 3, fx: { chainShock: 2, staticField: 1 }, desc: 'Shock arcs to two more foes. Static crackles around you.' },
  venom: { name: 'Plaguebearer', need: 3, fx: { poisonSpread: 1, poisonCap: 8 }, desc: 'Poison spreads on death and stacks much higher.' },
  blood: { name: 'Sanguine', need: 3, fx: { lifestealMul: 1, bleedHeal: 1 }, desc: 'Lifesteal doubled. Bleeding foes feed you.' },
  shadow: { name: 'Nightblade', need: 3, fx: { dashCrit: 2 }, stats: { dashCd: 0.25 }, desc: 'Two guaranteed crits after each dash. Dash more often.' },
  iron: { name: 'Juggernaut', need: 3, fx: { dashDamage: 1, thornsMul: 1 }, stats: { armor: 12 }, desc: 'Dash through foes. Thorns doubled, more armour.' },
  arcane: { name: 'Archmage', need: 3, fx: { energyCostRed: 0.3 }, stats: { cdr: 0.15 }, desc: 'Abilities cost 30% less energy and recharge faster.' },
};

// ---------------------------------------------------------------- consumables, shrines
export const SCROLLS = {
  mapping: { name: 'Scroll of Mapping', desc: 'Reveals the whole floor, secrets included.' },
  fury: { name: 'Scroll of Fury', desc: 'For 10 seconds: +50% damage and attack speed.' },
  frost: { name: 'Scroll of Winter', desc: 'Freezes every enemy you can see.' },
  warding: { name: 'Scroll of Warding', desc: 'A shield absorbs damage equal to half your health.' },
  recall: { name: 'Scroll of Passage', desc: 'Teleports you to the stairs down.' },
};
export const SCROLL_KEYS = Object.keys(SCROLLS);

export const SHRINES = {
  perk: { name: 'Shrine of Gifts', color: 0xffd24a, desc: 'Choose a relic.', weight: 40 },
  fountain: { name: 'Healing Fountain', color: 0x4ab0ff, desc: 'Restores all health and energy.', weight: 25 },
  blood: { name: 'Blood Altar', color: 0xd02a3a, desc: 'Give 25% of your health for a rare treasure.', weight: 20 },
  gamble: { name: 'Gambler’s Idol', color: 0x60e0a0, desc: 'Pay gold for a mystery item.', weight: 15 },
};

export const POTION_HEAL = 0.35;
export const MAX_POTIONS = 5;
export const MAX_BOMBS = 6;
export const BAG_SIZE = 12;
