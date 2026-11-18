// Bastion Maze: static game data. Pure module (no DOM, no three.js).

export const SAVE_VERSION = 3;
export const DT = 1 / 30;                // fixed simulation step, seconds

// Tile types
export const T = {
  GROUND: 0, ROCK: 1, WATER: 2, RUIN: 3, HIGH: 4, CRYSTAL: 5, MUD: 6, BRIDGE: 7, GATE: 8, CORE: 9,
};
export const TILE_NAMES = ['Ground', 'Rock', 'Water', 'Ruins', 'High ground', 'Crystal', 'Mud', 'Bridge', 'Gate', 'Core'];
export const TILE_INFO = [
  'Open ground. Build here.',
  'Rock. Blocks walking and building.',
  'Water. Only flyers cross it.',
  'Old ruins. Block walking and building.',
  'High ground: towers here gain +20% range.',
  'Crystal: towers here deal +25% damage.',
  'Mud: enemies wade through at half speed. Cannot build.',
  'Bridge: walkable, cannot build.',
  'Enemy gate.',
  'Your core. Defend it.',
];
export const WALKABLE = [1, 0, 0, 0, 1, 1, 1, 1, 1, 1];
export const BUILDABLE = [1, 0, 0, 0, 1, 1, 0, 0, 0, 0];

export const DTYPES = ['phys', 'pierce', 'fire', 'cold', 'shock', 'poison'];
export const DTYPE_NAMES = { phys: 'Physical', pierce: 'Piercing', fire: 'Fire', cold: 'Cold', shock: 'Shock', poison: 'Poison' };
export const DTYPE_COLORS = { phys: '#e8dcc0', pierce: '#ffe07a', fire: '#ff7a2f', cold: '#7fd8ff', shock: '#c39bff', poison: '#8be05a' };

export const PRIORITIES = ['first', 'last', 'strong', 'weak', 'close'];
export const PRIORITY_NAMES = { first: 'First', last: 'Last', strong: 'Strong', weak: 'Weak', close: 'Close' };

// ---------------------------------------------------------------------------------------------
// Towers. `levels` are the base levels (cumulative: each entry overrides the previous one);
// after the last base level the player picks branch a or b, whose levels continue the same way.
// role: the short line in the build bar and tower sheet; tip: what it is good at (the Towers reference).
// kind: bolt | shell | mortar | chain | snipe | rail | pulse | flame | aura | support | mine | none
// ---------------------------------------------------------------------------------------------
export const TOWERS = {
  wall: {
    name: 'Wall', cost: 5, color: '#8f8a7e', role: 'Cheap block. Shape the maze.',
    tip: 'Cheap blocks that stretch the enemy path.',
    kind: 'none', air: false, ground: true,
    levels: [{ range: 0 }],
    branches: {
      a: { name: 'Spike Wall', desc: 'Stakes jab every ground enemy that walks past.', levels: [
        { cost: 25, kind: 'aura', dtype: 'phys', dmg: 7, rate: 2, range: 1.5 },
        { cost: 40, dmg: 14 },
      ] },
      b: { name: 'Lookout', desc: 'Reveals hidden enemies and lengthens the reach of neighbours.', levels: [
        { cost: 30, kind: 'none', detect: 2.6, rangeAura: 0.08, range: 2.6 },
        { cost: 45, detect: 3.6, rangeAura: 0.14, range: 3.6 },
      ] },
    },
  },
  arrow: {
    name: 'Archer', cost: 25, color: '#c9a36b', role: 'Fast single target. Hits flyers.',
    tip: 'Cheap, quick shots. Strong early and against flyers.',
    kind: 'bolt', dtype: 'phys', air: true, ground: true, projSpeed: 12,
    levels: [
      { dmg: 6, rate: 2.0, range: 2.6 },
      { cost: 30, dmg: 10, rate: 2.2, range: 2.8 },
      { cost: 50, dmg: 15, rate: 2.5, range: 3.0 },
    ],
    branches: {
      a: { name: 'Longbow', desc: 'Looses a volley at several enemies at once.', levels: [
        { cost: 90, dmg: 19, rate: 2.4, range: 3.5, multishot: 3 },
        { cost: 150, dmg: 29, rate: 2.6, range: 3.9, multishot: 4 },
      ] },
      b: { name: 'Hunter', desc: 'Spots hidden enemies and lands heavy critical hits.', levels: [
        { cost: 90, dmg: 24, rate: 2.7, range: 3.1, crit: 0.25, critMul: 3, detect: 3.1 },
        { cost: 150, dmg: 37, rate: 3.0, range: 3.3, crit: 0.35, critMul: 3.5, detect: 3.3 },
      ] },
    },
  },
  cannon: {
    name: 'Cannon', cost: 50, color: '#6f7480', role: 'Splash damage. Ground only.',
    tip: 'Blasts tight groups of ground enemies.',
    kind: 'shell', dtype: 'phys', air: false, ground: true, projSpeed: 7,
    levels: [
      { dmg: 16, rate: 0.7, range: 2.5, splash: 0.9 },
      { cost: 45, dmg: 27, rate: 0.72, range: 2.6 },
      { cost: 75, dmg: 42, rate: 0.75, range: 2.8, splash: 1.05 },
    ],
    branches: {
      a: { name: 'Siege Gun', desc: 'Huge blasts that crack armour for a while.', levels: [
        { cost: 140, dmg: 80, splash: 1.35, shred: 3, shredMax: 9 },
        { cost: 220, dmg: 130, splash: 1.6, shred: 5, shredMax: 15 },
      ] },
      b: { name: 'Tar Cannon', desc: 'Coats enemies in tar: slowed, and fire does double damage.', levels: [
        { cost: 130, dmg: 46, splash: 1.2, oil: 4, slow: 0.3, slowDur: 2 },
        { cost: 200, dmg: 70, splash: 1.35, oil: 5, slow: 0.4, slowDur: 2.5 },
      ] },
    },
  },
  frost: {
    name: 'Frost', cost: 40, color: '#7fd8ff', role: 'Slows enemies. Hits flyers.',
    tip: 'Slows enemies so other towers get more hits.',
    kind: 'bolt', dtype: 'cold', air: true, ground: true, projSpeed: 10,
    levels: [
      { dmg: 4, rate: 1.1, range: 2.5, slow: 0.35, slowDur: 2 },
      { cost: 40, dmg: 7, rate: 1.2, slow: 0.4 },
      { cost: 60, dmg: 11, rate: 1.3, range: 2.8, slow: 0.45 },
    ],
    branches: {
      a: { name: 'Glacier', desc: 'Hits stack frost until the enemy freezes solid and can shatter.', levels: [
        { cost: 120, dmg: 18, rate: 1.6, slow: 0.5, freezeAt: 5, freezeDur: 1.0 },
        { cost: 180, dmg: 28, rate: 1.9, slow: 0.55, freezeAt: 4, freezeDur: 1.4 },
      ] },
      b: { name: 'Blizzard', desc: 'Pulses cold over everything in range, flyers included.', levels: [
        { cost: 120, kind: 'pulse', dmg: 9, rate: 1.0, range: 2.6, slow: 0.45, slowDur: 1.5 },
        { cost: 180, dmg: 16, rate: 1.1, range: 3.0, slow: 0.55 },
      ] },
    },
  },
  tesla: {
    name: 'Tesla', cost: 70, color: '#c39bff', role: 'Chain lightning. Rips shields.',
    tip: 'Chains through crowds and strips shields fast.',
    kind: 'chain', dtype: 'shock', air: true, ground: true,
    levels: [
      { dmg: 13, rate: 0.9, range: 2.4, jumps: 3, jumpRange: 1.6, falloff: 0.85 },
      { cost: 60, dmg: 21, rate: 0.95 },
      { cost: 90, dmg: 32, rate: 1.0, range: 2.6, jumps: 4 },
    ],
    branches: {
      a: { name: 'Storm Coil', desc: 'Lightning leaps through whole crowds without weakening.', levels: [
        { cost: 170, dmg: 40, jumps: 7, jumpRange: 1.9, falloff: 1 },
        { cost: 260, dmg: 58, jumps: 10, jumpRange: 2.1 },
      ] },
      b: { name: 'Overload', desc: 'Each strike stuns and tears shields apart.', levels: [
        { cost: 160, dmg: 52, jumps: 3, stun: 0.35, shieldMul: 4 },
        { cost: 240, dmg: 82, jumps: 4, stun: 0.5 },
      ] },
    },
  },
  venom: {
    name: 'Venom', cost: 45, color: '#8be05a', role: 'Poison stacks. Ignores armour and shields.',
    tip: 'Poison that ignores armour and shields.',
    kind: 'bolt', dtype: 'poison', air: true, ground: true, projSpeed: 9,
    levels: [
      { dmg: 2, rate: 1.0, range: 2.6, poison: 6, poisonDur: 4, poisonMax: 5 },
      { cost: 40, dmg: 3, poison: 10 },
      { cost: 65, dmg: 4, poison: 15, range: 2.8 },
    ],
    branches: {
      a: { name: 'Plague', desc: 'When a poisoned enemy dies the poison jumps to its neighbours.', levels: [
        { cost: 130, poison: 22, plague: 1.6 },
        { cost: 200, poison: 34, plague: 2.0, poisonMax: 7 },
      ] },
      b: { name: 'Acid', desc: 'Dissolves armour and makes enemies take more damage.', levels: [
        { cost: 130, poison: 18, shred: 2, shredMax: 8, corrode: 0.1 },
        { cost: 200, poison: 28, shred: 4, shredMax: 12, corrode: 0.15 },
      ] },
    },
  },
  sniper: {
    name: 'Sniper', cost: 80, color: '#ffe07a', role: 'Huge range, pierces armour.',
    tip: 'Huge range. Picks off the strongest, armour or not.',
    kind: 'snipe', dtype: 'pierce', air: true, ground: true, prio: 'strong',
    levels: [
      { dmg: 45, rate: 0.45, range: 5 },
      { cost: 70, dmg: 75 },
      { cost: 110, dmg: 115, range: 5.5 },
    ],
    branches: {
      a: { name: 'Deadeye', desc: 'Executes weakened enemies outright. Triple damage to bosses.', levels: [
        { cost: 220, dmg: 170, execute: 0.15, bossMul: 3 },
        { cost: 330, dmg: 260, execute: 0.2, rate: 0.5 },
      ] },
      b: { name: 'Railgun', desc: 'The shot punches through every enemy in a line.', levels: [
        { cost: 220, kind: 'rail', dmg: 140, rate: 0.4, range: 6 },
        { cost: 330, dmg: 220, range: 6.5 },
      ] },
    },
  },
  mortar: {
    name: 'Mortar', cost: 75, color: '#9c7b5b', role: 'Long-range lobs. Cannot hit close or flyers.',
    tip: 'Long-range splash. Cannot hit enemies right beside it.',
    kind: 'mortar', dtype: 'phys', air: false, ground: true, minRange: 1.5, flight: 1.0,
    levels: [
      { dmg: 30, rate: 0.4, range: 5.5, splash: 1.2 },
      { cost: 65, dmg: 50, rate: 0.42 },
      { cost: 100, dmg: 78, rate: 0.45, range: 6, splash: 1.3 },
    ],
    branches: {
      a: { name: 'Napalm', desc: 'Shells leave burning ground. Ignites tar.', levels: [
        { cost: 200, dmg: 90, napalm: 22, napalmR: 1.0, napalmDur: 3 },
        { cost: 300, dmg: 140, napalm: 36, napalmR: 1.2, napalmDur: 3.5 },
      ] },
      b: { name: 'Cluster', desc: 'Shells burst into a ring of bomblets.', levels: [
        { cost: 200, dmg: 80, cluster: 5, clusterDmg: 34 },
        { cost: 300, dmg: 120, cluster: 7, clusterDmg: 50 },
      ] },
    },
  },
  flame: {
    name: 'Flamer', cost: 60, color: '#ff7a2f', role: 'Short-range fire cone. Burns.',
    tip: 'Burns crowds walking right past it.',
    kind: 'flame', dtype: 'fire', air: false, ground: true,
    levels: [
      { dmg: 5, rate: 5, range: 1.8, cone: 0.9, burn: 4, burnDur: 2 },
      { cost: 55, dmg: 8, burn: 6 },
      { cost: 85, dmg: 12, range: 2.0, burn: 9 },
    ],
    branches: {
      a: { name: 'Inferno', desc: 'A wide sheet of flame with long, fierce burns.', levels: [
        { cost: 180, dmg: 15, cone: 1.6, burn: 20, burnDur: 4 },
        { cost: 270, dmg: 22, cone: 1.9, burn: 32 },
      ] },
      b: { name: 'Dragon', desc: 'A long jet of fire that also scorches flyers.', levels: [
        { cost: 180, dmg: 22, cone: 0.7, range: 2.8, air: true },
        { cost: 270, dmg: 32, range: 3.2 },
      ] },
    },
  },
  beacon: {
    name: 'Beacon', cost: 90, color: '#f0b44c', role: 'Buffs nearby towers.',
    tip: 'Makes the towers around it hit harder.',
    kind: 'support', air: false, ground: false,
    levels: [
      { range: 1.6, buffDmg: 0.12 },
      { cost: 80, buffDmg: 0.18, buffRange: 0.05 },
      { cost: 120, buffDmg: 0.25, buffRange: 0.1, detect: 2.5 },
    ],
    branches: {
      a: { name: 'War Drum', desc: 'Neighbours fire much faster.', levels: [
        { cost: 200, range: 2.3, buffRate: 0.25 },
        { cost: 300, buffRate: 0.4, buffDmg: 0.3 },
      ] },
      b: { name: 'Oracle', desc: 'Sees far and marks enemies so everything hits them harder.', levels: [
        { cost: 200, range: 2.3, detect: 4, mark: 0.15 },
        { cost: 300, detect: 5, mark: 0.25 },
      ] },
    },
  },
  mine: {
    name: 'Gold Mine', cost: 60, color: '#e8c25a', role: 'Earns gold every wave.',
    tip: 'Pays gold every wave. Best built early.',
    kind: 'mine', air: false, ground: false,
    levels: [
      { income: 11, range: 0 },
      { cost: 60, income: 19 },
      { cost: 90, income: 29 },
    ],
    branches: {
      a: { name: 'Bank', desc: 'Also pays interest on your gold each wave.', levels: [
        { cost: 180, income: 38, interest: 0.03, interestCap: 80 },
        { cost: 260, income: 52, interest: 0.05, interestCap: 150 },
      ] },
      b: { name: 'Prospector', desc: 'Enemies that die nearby drop extra gold.', levels: [
        { cost: 160, income: 34, range: 2.5, killBonus: 2 },
        { cost: 240, income: 48, range: 3, killBonus: 4 },
      ] },
    },
  },
};
export const TOWER_ORDER = ['wall', 'arrow', 'cannon', 'frost', 'tesla', 'venom', 'sniper', 'mortar', 'flame', 'beacon', 'mine'];

export function baseLevels(type) { return TOWERS[type].levels.length; }
export function maxLevel(type) {
  const d = TOWERS[type];
  return d.levels.length + d.branches.a.levels.length;
}

// ---------------------------------------------------------------------------------------------
// Enemies. hp/shield are at wave 1 and scaled per wave by the wave generator.
// shape is the renderer's model; threat is the budget cost used by the wave generator.
// ---------------------------------------------------------------------------------------------
export const ENEMIES = {
  grunt: { name: 'Raider', hp: 32, speed: 1.0, bounty: 3, lives: 1, shape: 'box', color: '#d06a4a', size: 0.42, threat: 1, from: 1,
    desc: 'Plain foot soldier.' },
  runner: { name: 'Runner', hp: 18, speed: 1.9, bounty: 3, lives: 1, shape: 'cone', color: '#f2c14e', size: 0.36, threat: 0.8, from: 2,
    desc: 'Fast and fragile.' },
  swarm: { name: 'Swarmling', hp: 9, speed: 1.3, bounty: 1, lives: 1, shape: 'ball', color: '#e0814f', size: 0.24, threat: 0.3, from: 3,
    resist: { fire: 1.5 }, desc: 'Comes in crowds. Burns easily.' },
  brute: { name: 'Brute', hp: 130, speed: 0.62, armor: 2, bounty: 8, lives: 2, shape: 'box', color: '#9a4f3a', size: 0.6, threat: 3, from: 4,
    slowResist: 0.3, desc: 'Big, slow and hard to slow.' },
  wasp: { name: 'Wasp', hp: 26, speed: 1.25, bounty: 4, lives: 1, shape: 'wing', color: '#f6e05e', size: 0.36, threat: 1.2, from: 5, flying: true,
    resist: { fire: 1.2 }, desc: 'Flies straight over the maze.' },
  knight: { name: 'Knight', hp: 62, speed: 0.85, armor: 6, bounty: 6, lives: 1, shape: 'spike', color: '#b8c2cc', size: 0.46, threat: 2, from: 6,
    desc: 'Heavy armour. Use piercing, poison or big hits.' },
  splitter: { name: 'Splitter', hp: 70, speed: 0.85, bounty: 5, lives: 1, shape: 'ball', color: '#c46bd6', size: 0.5, threat: 2.2, from: 7,
    split: { type: 'splitling', n: 3 }, desc: 'Bursts into three when killed.' },
  splitling: { name: 'Splitling', hp: 16, speed: 1.3, bounty: 1, lives: 1, shape: 'ball', color: '#d99be6', size: 0.26, threat: 0.4, from: 999,
    desc: 'Piece of a splitter.' },
  warden: { name: 'Warden', hp: 46, shield: 50, speed: 0.9, bounty: 6, lives: 1, shape: 'disc', color: '#5aa7e0', size: 0.46, threat: 2, from: 8,
    desc: 'Regenerating shield. Shock tears it.' },
  mender: { name: 'Mender', hp: 52, speed: 0.85, bounty: 7, lives: 1, shape: 'tetra', color: '#6fe0a0', size: 0.46, threat: 2.2, from: 9,
    heal: { r: 1.8, pct: 0.07, every: 1.8 }, desc: 'Heals nearby enemies. Kill it first.' },
  troll: { name: 'Troll', hp: 115, speed: 0.7, bounty: 8, lives: 2, shape: 'box', color: '#5f8f4a', size: 0.58, threat: 3, from: 11,
    regen: 0.05, resist: { fire: 1.5, poison: 1.3 }, desc: 'Regenerates. Fire and poison stop it.' },
  shade: { name: 'Shade', hp: 42, speed: 1.15, bounty: 6, lives: 1, shape: 'tetra', color: '#7a6cc9', size: 0.42, threat: 1.7, from: 12,
    stealth: true, shimmer: { every: 3, dur: 0.7 }, resist: { cold: 1.3 }, shoot: { dmg: 8, every: 2.5, r: 3 }, desc: 'Invisible except for a brief shimmer. Detectors (Hunter, Lookout, Beacon III) or splash reveal it.' },
  burrower: { name: 'Burrower', hp: 58, speed: 0.9, bounty: 6, lives: 1, shape: 'cone', color: '#a07a4a', size: 0.46, threat: 1.9, from: 13,
    burrow: { every: 4, dur: 1.6, speedMul: 1.7 }, desc: 'Dives underground, untouchable for a moment.' },
  sapper: { name: 'Sapper', hp: 54, speed: 1.0, armor: 2, bounty: 7, lives: 1, shape: 'disc', color: '#e05a5a', size: 0.44, threat: 2.1, from: 14,
    sap: { jam: 4, every: 6, r: 1.5 }, desc: 'Jams towers it walks past.' },
  gargoyle: { name: 'Gargoyle', hp: 95, speed: 0.8, armor: 4, bounty: 9, lives: 2, shape: 'wing', color: '#8c96a0', size: 0.5, threat: 3, from: 17,
    flying: true, resist: { phys: 0.75 }, shoot: { dmg: 12, every: 2, r: 3.5 }, desc: 'Armoured flyer.' },
  // Bosses
  behemoth: { name: 'Behemoth', hp: 1300, speed: 0.42, armor: 5, bounty: 120, lives: 6, shape: 'boss', color: '#b0563a', size: 1.0, threat: 60, boss: true,
    slowResist: 0.5, summon: { type: 'brute', n: 2, at: [0.66, 0.33] }, stomp: { every: 8, r: 1.6, jam: 2 },
    desc: 'Stomps towers silent and calls brutes as it weakens.' },
  hivequeen: { name: 'Hive Queen', hp: 2000, shield: 600, speed: 0.48, bounty: 120, lives: 7, shape: 'boss', color: '#e0a040', size: 0.95, threat: 60, boss: true,
    spawn: { type: 'swarm', n: 3, every: 2.2 }, desc: 'Lays swarmlings as she walks.' },
  lich: { name: 'Lich', hp: 1800, shield: 1100, speed: 0.5, bounty: 130, lives: 8, shape: 'boss', color: '#7a6cc9', size: 0.9, threat: 60, boss: true,
    heal: { r: 2.5, pct: 0.1, every: 3 }, shoot: { dmg: 25, every: 1.5, r: 4 }, blink: { every: 7, tiles: 2 }, desc: 'Heals its host and blinks forward.' },
  colossus: { name: 'Colossus', hp: 3400, speed: 0.36, armor: 10, bounty: 150, lives: 10, shape: 'boss', color: '#8c96a0', size: 1.1, threat: 60, boss: true,
    regen: 0.01, slowResist: 0.5, stomp: { every: 6, r: 2.5, jam: 3 }, desc: 'EMP pulses jam everything near it.' },
  wyrm: { name: 'Storm Wyrm', hp: 2600, shield: 1300, speed: 0.55, bounty: 150, lives: 10, shape: 'boss', color: '#5aa7e0', size: 1.0, threat: 60, boss: true,
    flying: true, spawn: { type: 'wasp', n: 2, every: 3 }, shoot: { dmg: 25, every: 1.5, r: 4.5 }, desc: 'Flies over the maze with a wasp escort.' },
};
export const BOSS_ORDER = ['behemoth', 'hivequeen', 'lich', 'colossus', 'wyrm'];
export const ENEMY_ORDER = Object.keys(ENEMIES);

// ---------------------------------------------------------------------------------------------
// Modes and difficulties
// ---------------------------------------------------------------------------------------------
export const DIFFICULTY = {
  easy: { name: 'Easy', hp: 0.75, gold: 300, lives: 30, bounty: 1.15, speed: 0.95, timer: 30 },
  normal: { name: 'Normal', hp: 1.0, gold: 250, lives: 20, bounty: 1.0, speed: 1.0, timer: 22 },
  hard: { name: 'Hard', hp: 1.3, gold: 220, lives: 15, bounty: 0.9, speed: 1.08, timer: 16 },
};

export const OP = {
  gold: 6000, lives: 100, buildCost: 0.5, upgradeCost: 0.3, dmg: 3, range: 1.25, rate: 1.6,
  count: 2.6, perk: 2.5, cardEvery: 3, timer: 12, bounty: 1.5, hpRamp: 1.07,
};

export const ARCHETYPES = {
  field: { name: 'Open Field', desc: 'One gate, open ground, scattered rocks.' },
  twin: { name: 'Twin Gates', desc: 'Two gates converge on the core.' },
  islands: { name: 'Islands', desc: 'Rivers cut the land. Bridges are the choke points.' },
  canyon: { name: 'Canyon', desc: 'Ridges force a winding road.' },
  lake: { name: 'Lake', desc: 'Gates on both flanks of a lake.' },
  citadel: { name: 'Citadel', desc: 'An old ring of ruins around the core, gates on every side.' },
};
export const ARCHETYPE_ORDER = Object.keys(ARCHETYPES);

// ---------------------------------------------------------------------------------------------
// Abilities
// ---------------------------------------------------------------------------------------------
export const ABILITIES = {
  meteor: { name: 'Meteor', cd: 40, targeted: true, r: 1.8, desc: 'Tap the map to drop a fiery meteor.' },
  freeze: { name: 'Deep Freeze', cd: 60, targeted: false, desc: 'Freezes every enemy for a few seconds.' },
  rush: { name: 'Gold Rush', cd: 90, targeted: false, desc: 'Instant gold, then double bounty for 12 s.' },
  orbital: { name: 'Orbital', cd: 7, targeted: true, r: 2.4, op: true, desc: 'Tap the map: a beam from orbit erases everything there.' },
};

// ---------------------------------------------------------------------------------------------
// Cards. kind: perk (stackable to 3), econ, relic (unique), curse (risk with reward).
// mod(m, k) changes the persistent modifier object; now(state, k) runs once when picked.
// k is the strength multiplier (OP mode makes every card stronger).
// ---------------------------------------------------------------------------------------------
const pct = (x) => Math.round(x * 100) + '%';
export const CARDS = [
  { id: 'steel', kind: 'perk', name: 'Tempered Steel', text: (k) => `+${pct(0.15 * k)} physical and piercing damage.`,
    mod: (m, k) => { m.dmg.phys += 0.15 * k; m.dmg.pierce += 0.15 * k; } },
  { id: 'sight', kind: 'perk', name: 'Watchtowers', text: (k) => `+${pct(0.08 * k)} range for every tower.`,
    mod: (m, k) => { m.range += 0.08 * k; } },
  { id: 'drill', kind: 'perk', name: 'Drill Sergeant', text: (k) => `+${pct(0.1 * k)} fire rate for every tower.`,
    mod: (m, k) => { m.rate += 0.1 * k; } },
  { id: 'hoar', kind: 'perk', name: 'Hoarfrost', text: (k) => `+${pct(0.3 * k)} cold damage and stronger slows.`,
    mod: (m, k) => { m.dmg.cold += 0.3 * k; m.slowBonus += 0.06 * k; } },
  { id: 'caps', kind: 'perk', name: 'Capacitors', text: (k) => `+${pct(0.2 * k)} shock damage, +${Math.round(k)} chain jump.`,
    mod: (m, k) => { m.dmg.shock += 0.2 * k; m.jumps += Math.round(k); } },
  { id: 'viru', kind: 'perk', name: 'Virulence', text: (k) => `+${pct(0.3 * k)} poison damage.`,
    mod: (m, k) => { m.dmg.poison += 0.3 * k; } },
  { id: 'pyre', kind: 'perk', name: 'Pitch and Pyre', text: (k) => `+${pct(0.3 * k)} fire damage, burns last longer.`,
    mod: (m, k) => { m.dmg.fire += 0.3 * k; m.burnDur += 0.3 * k; } },
  { id: 'powder', kind: 'perk', name: 'Black Powder', text: (k) => `+${pct(0.15 * k)} splash radius, +${pct(0.1 * k)} splash damage.`,
    mod: (m, k) => { m.splash += 0.15 * k; m.splashDmg += 0.1 * k; } },
  { id: 'keen', kind: 'perk', name: 'Keen Eyes', text: (k) => `Every tower gains ${pct(0.08 * k)} chance to crit for double damage.`,
    mod: (m, k) => { m.crit += 0.08 * k; } },
  { id: 'mason', kind: 'perk', name: 'Masons Guild', text: (k) => `Walls cost ${pct(Math.min(0.9, 0.5 * k))} less.`,
    mod: (m, k) => { m.wallCost *= 1 - Math.min(0.9, 0.5 * k); } },
  { id: 'tax', kind: 'econ', name: 'Tax Collector', text: (k) => `+${Math.round(k)} gold for every kill.`,
    mod: (m, k) => { m.killGold += Math.round(k); } },
  { id: 'chest', kind: 'econ', name: 'War Chest', text: (k) => `+${Math.round(200 * k)} gold right now.`,
    now: (s, k) => { s.gold += Math.round(200 * k); s.stats.goldEarned += Math.round(200 * k); } },
  { id: 'lender', kind: 'econ', name: 'Moneylender', text: (k) => `Earn ${pct(0.04 * k)} interest on your gold each wave (max ${Math.round(100 * k)}).`,
    mod: (m, k) => { m.interest += 0.04 * k; m.interestCap += Math.round(100 * k); } },
  { id: 'veins', kind: 'econ', name: 'Deep Veins', text: (k) => `Gold mines earn ${pct(0.5 * k)} more.`,
    mod: (m, k) => { m.mine += 0.5 * k; } },
  { id: 'guild', kind: 'econ', name: 'Guild Discount', text: (k) => `Building and upgrading cost ${pct(Math.min(0.6, 0.12 * k))} less.`,
    mod: (m, k) => { const f = 1 - Math.min(0.6, 0.12 * k); m.buildCost *= f; m.upgradeCost *= f; } },
  { id: 'salvage', kind: 'econ', name: 'Salvage Crews', text: () => 'Selling refunds 90% of what you spent.',
    mod: (m) => { m.sellRate = Math.max(m.sellRate, 0.9); } },
  { id: 'bounty', kind: 'econ', name: 'Bounty Board', text: (k) => `Bosses pay ${Math.round(1 + 2 * k)}x gold, wave bonus +${pct(0.5 * k)}.`,
    mod: (m, k) => { m.bossGold += 2 * k; m.waveBonus += 0.5 * k; } },
  { id: 'shatter', kind: 'relic', name: 'Shatter Rune', text: () => 'Chilled and frozen enemies take double physical damage.',
    mod: (m) => { m.shatter = Math.max(m.shatter, 1.0); } },
  { id: 'volatile', kind: 'relic', name: 'Volatile Ore', text: () => 'Enemies that die burning explode for 15% of their health.',
    mod: (m) => { m.chainReaction = 0.15; } },
  { id: 'thorns', kind: 'relic', name: 'Thorn Walls', text: (k) => `Every wall jabs adjacent enemies for ${Math.round(5 * k)} damage per second.`,
    mod: (m, k) => { m.thorns += 5 * k; } },
  { id: 'eagle', kind: 'relic', name: 'Eagle Eye', text: () => 'Every tower can see hidden enemies within half its range.',
    mod: (m) => { m.detectAll = Math.max(m.detectAll, 0.5); } },
  { id: 'hourglass', kind: 'relic', name: 'Hourglass', text: () => 'Abilities recharge 35% faster.',
    mod: (m) => { m.cooldown *= 0.65; } },
  { id: 'heart', kind: 'relic', name: 'Heart of the Bastion', text: (k) => `+${Math.round(8 * k)} lives now and +1 life every 5 waves.`,
    mod: (m) => { m.lifeRegen += 1; }, now: (s, k) => { s.lives += Math.round(8 * k); } },
  { id: 'conduit', kind: 'relic', name: 'Ley Conduit', text: () => 'Crystal and high ground bonuses are doubled.',
    mod: (m) => { m.terrain = 2; } },
  { id: 'overclock', kind: 'relic', name: 'Overclock', text: (k) => `+${pct(0.25 * k)} damage for every tower, but upgrades cost 15% more.`,
    mod: (m, k) => { m.dmgAll += 0.25 * k; m.upgradeCost *= 1.15; } },
  { id: 'blood', kind: 'curse', name: 'Blood Pact', text: (k) => `Lose 5 lives. Gain ${Math.round(350 * k)} gold.`,
    now: (s, k) => { s.lives = Math.max(1, s.lives - 5); s.gold += Math.round(350 * k); s.stats.goldEarned += Math.round(350 * k); } },
  { id: 'haste', kind: 'curse', name: 'Hasty Foes', text: (k) => `Enemies move 12% faster. Kills pay ${pct(0.3 * k)} more.`,
    mod: (m, k) => { m.enemySpeed += 0.12; m.killGoldMul += 0.3 * k; } },
  { id: 'hides', kind: 'curse', name: 'Thick Hides', text: (k) => `Enemies have 18% more health. Towers deal ${pct(0.14 * k)} more damage.`,
    mod: (m, k) => { m.enemyHp += 0.18; m.dmgAll += 0.14 * k; } },
  { id: 'iron', kind: 'curse', name: 'Iron Tide', text: (k) => `Enemies gain 2 armour. +${Math.round(2 * k)} gold per kill.`,
    mod: (m, k) => { m.enemyArmor += 2; m.killGold += Math.round(2 * k); } },
];
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const CARD_KIND_NAMES = { perk: 'Perk', econ: 'Economy', relic: 'Relic', curse: 'Curse', hero: 'Hero' };

export function defaultMods() {
  return {
    dmg: { phys: 1, pierce: 1, fire: 1, cold: 1, shock: 1, poison: 1 },
    dmgAll: 1, range: 1, rate: 1, buildCost: 1, upgradeCost: 1, wallCost: 1, sellRate: 0.7,
    killGold: 0, killGoldMul: 1, interest: 0, interestCap: 0, mine: 1, enemyHp: 1, enemySpeed: 1, enemyArmor: 0,
    slowBonus: 0, jumps: 0, burnDur: 1, splash: 1, splashDmg: 1, crit: 0, shatter: 0.35, chainReaction: 0,
    thorns: 0, detectAll: 0, cooldown: 1, bossGold: 1, waveBonus: 1, lifeRegen: 0, terrain: 1,
    heroMark: 0, heroRally: 0, heroGold: 0, heroRod: 0, heroHp: 1, heroRespawn: 1, heroDmg: 1, heroEng: 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Hero: a unit the player can steer directly (twin-stick) during waves.
// ---------------------------------------------------------------------------------------------
export const HERO = {
  hp: 120, speed: 2.6, radius: 0.28, regen: 0.05, regenDelay: 3, respawn: 10, unlockWave: 3,
  dash: { dist: 2.4, dur: 0.18, iframes: 0.4, cd: 4 },
  ult: { name: 'Nova', cd: 40, r: 2.8, dmg: 90, stun: 1.2 },
  per: { dmg: 0.07, rate: 0.05, speed: 0.04, hp: 0.12 },
  statCap: { rate: 12, speed: 10, hp: 20, dmg: 99 },
};
export const HERO_OP = { hp: 5, dmg: 4, rate: 1.8, speed: 1.3, cd: 0.35, respawn: 3 };
export function heroXpNeed(level) { return Math.round(30 + 26 * Math.pow(level, 1.4)); }

// kind: shot (straight projectiles) | grenade | rail | flame | arc
export const HERO_WEAPONS = {
  blaster: { name: 'Blaster', kind: 'shot', dtype: 'phys', dmg: 9, rate: 5, range: 4.2, speed: 15, pellets: 1, spread: 0.05,
    desc: 'Steady rapid fire.' },
  shotgun: { name: 'Scattergun', kind: 'shot', dtype: 'phys', dmg: 7, rate: 1.6, range: 2.8, speed: 13, pellets: 6, spread: 0.55,
    desc: 'A wide blast of pellets. Brutal up close.' },
  rail: { name: 'Rail Rifle', kind: 'rail', dtype: 'pierce', dmg: 48, rate: 0.9, range: 6.5,
    desc: 'Pierces armour and every enemy in a line.' },
  grenade: { name: 'Grenades', kind: 'grenade', dtype: 'phys', dmg: 36, rate: 1.1, range: 4.5, speed: 8, splash: 1.25,
    desc: 'Lobbed bombs that burst on contact.' },
  flamer: { name: 'Hand Flamer', kind: 'flame', dtype: 'fire', dmg: 4, rate: 10, range: 2.2, cone: 0.7, burn: 6, burnDur: 2,
    desc: 'A short cone of fire that sets crowds burning.' },
  arc: { name: 'Arc Caster', kind: 'arc', dtype: 'shock', dmg: 15, rate: 2, range: 3.6, jumps: 3, jumpRange: 1.7,
    desc: 'Chain lightning from your hands. Rips shields.' },
};
export const HERO_WEAPON_ORDER = Object.keys(HERO_WEAPONS);

// Hero cards join the deck once the hero is unlocked.
CARDS.push(
  { id: 'w_shotgun', kind: 'hero', weapon: 'shotgun', name: 'Armoury: Scattergun', text: () => 'Hero weapon: a wide spray of pellets.' },
  { id: 'w_rail', kind: 'hero', weapon: 'rail', name: 'Armoury: Rail Rifle', text: () => 'Hero weapon: piercing shots through whole lines.' },
  { id: 'w_grenade', kind: 'hero', weapon: 'grenade', name: 'Armoury: Grenades', text: () => 'Hero weapon: bombs that splash crowds.' },
  { id: 'w_flamer', kind: 'hero', weapon: 'flamer', name: 'Armoury: Hand Flamer', text: () => 'Hero weapon: a burning cone.' },
  { id: 'w_arc', kind: 'hero', weapon: 'arc', name: 'Armoury: Arc Caster', text: () => 'Hero weapon: chain lightning.' },
  { id: 'spotter', kind: 'hero', name: 'Spotter', text: (k) => `Enemies the hero hits are marked: towers deal +${pct(0.25 * k)} to them.`,
    mod: (m, k) => { m.heroMark += 0.25 * k; } },
  { id: 'rally', kind: 'hero', name: 'Rallying Cry', text: (k) => `Towers within 2.5 tiles of the hero fire ${pct(0.3 * k)} faster.`,
    mod: (m, k) => { m.heroRally += 0.3 * k; } },
  { id: 'scav', kind: 'hero', name: 'Scavenger', text: (k) => `Hero kills pay +${Math.round(2 * k)} gold.`,
    mod: (m, k) => { m.heroGold += Math.round(2 * k); } },
  { id: 'rod', kind: 'hero', name: 'Lightning Rod', text: () => 'Hero hits arc to 2 nearby enemies for 35% shock damage.',
    mod: (m) => { m.heroRod = Math.max(m.heroRod, 0.35); } },
  { id: 'vigor', kind: 'hero', name: 'Vigor', text: (k) => `Hero +${pct(0.5 * k)} health and respawns twice as fast.`,
    mod: (m, k) => { m.heroHp += 0.5 * k; m.heroRespawn *= 0.5; } },
  { id: 'training', kind: 'hero', name: 'Field Training', text: (k) => `Hero +${pct(0.2 * k)} damage and 2 upgrade points now.`,
    mod: (m, k) => { m.heroDmg += 0.2 * k; }, now: (s) => { s.hero.points += 2; } },
  { id: 'engineer', kind: 'hero', name: 'Field Engineer', text: () => 'The hero clears jams from nearby towers and they deal +15% damage.',
    mod: (m) => { m.heroEng = 0.15; } },
);
for (const c of CARDS) CARD_BY_ID[c.id] = c;
