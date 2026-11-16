// Tidewater: static game data. Pure (no DOM, no three).
// Rates are written per cycle; the UI shows them per minute.

export const SAVE_VERSION = 3;
export const TICK = 0.25;            // fixed simulation step, seconds of game time
export const DAY_SECONDS = 30;       // one in-game day

export const T = { DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, FOREST: 4, HILL: 5, MOUNTAIN: 6 };
export const TERRAIN_NAMES = ['Deep sea', 'Shallows', 'Beach', 'Meadow', 'Forest', 'Hills', 'Crags'];
export const D = { NONE: 0, ORE: 1, FERTILE: 2, FISH: 3 };
export const DEPOSIT_NAMES = ['', 'Iron ore', 'Fertile soil', 'Fish shoal'];

export const RES = ['food', 'wood', 'stone', 'planks', 'grain', 'wool', 'cloth', 'ale', 'ore', 'iron', 'tools', 'gold'];
export const RES_INFO = {
  food: { name: 'Food', value: 1 },
  wood: { name: 'Wood', value: 1 },
  stone: { name: 'Stone', value: 1.5 },
  planks: { name: 'Planks', value: 2.5 },
  grain: { name: 'Grain', value: 1 },
  wool: { name: 'Wool', value: 1.5 },
  cloth: { name: 'Cloth', value: 5 },
  ale: { name: 'Ale', value: 3 },
  ore: { name: 'Ore', value: 2 },
  iron: { name: 'Iron', value: 5 },
  tools: { name: 'Tools', value: 8 },
  gold: { name: 'Gold', value: 1 },
};
// Resources shown in the top bar from the start; the rest appear once they are unlocked or held.
export const RES_TIER = { food: 1, wood: 1, stone: 1, gold: 1, planks: 2, grain: 2, wool: 2, cloth: 2, ore: 3, iron: 3, tools: 3, ale: 3 };

export const STORAGE_BASE = 80;      // per resource, from the Town Hall
export const STORAGE_WAREHOUSE = 60; // per resource, per Warehouse level
export const GOLD_BASE = 150;
export const GOLD_WAREHOUSE = 100;
export const FOOD_PER_PERSON_MIN = 1.2;
export const IDLE_ALLOWANCE = (pop) => 4 + Math.floor(pop * 0.15); // newcomers only come while there is work
export const FOUNDERS = 4;           // these people never leave
export const HOUSE_GRACE = 30;       // seconds a house keeps its level after a need lapses
export const CLOTH_PER_MANOR_MIN = 0.6;

export const CATEGORIES = [
  { id: 'homes', name: 'Homes' },
  { id: 'food', name: 'Food' },
  { id: 'industry', name: 'Industry' },
  { id: 'civic', name: 'Port & Civic' },
];

// Worker priority order by category (lower first). Player "priority" jumps the queue.
export const WORK_RANK = { food: 0, homes: 1, industry: 2, civic: 3 };

const UP_PROD = { cost: { planks: 10, stone: 6, tools: 3 }, tier: 3, workers: 1, rate: 1.6 };
const UP_SERVICE = { cost: { planks: 10, stone: 8, tools: 2 }, tier: 3, radius: 1 };

export const BUILDINGS = {
  townhall: {
    name: 'Town Hall', cat: 'civic', tier: 0, buildable: false, cost: {}, build: 0, workers: 0,
    housing: 6, reach: 6, flammable: false, trickle: { food: 3, wood: 2 },
    desc: 'The founders’ hall. It shelters six founders, holds the stores, and its people forage a little food and wood, so the colony never runs completely dry.',
  },
  house: {
    name: 'House', cat: 'homes', tier: 1, cost: { wood: 6 }, build: 4, workers: 0, place: 'land',
    levels: [
      { name: 'Hut', cap: 4, cost: { wood: 6 }, tax: 0.05, needs: [] },
      { name: 'Cottage', cap: 8, cost: { planks: 6, stone: 4 }, tax: 0.15, needs: ['well', 'market'], tier: 2 },
      { name: 'Manor', cap: 14, cost: { planks: 10, stone: 8, tools: 4, gold: 20 }, tax: 0.35, needs: ['well', 'market', 'tavern', 'cloth'], tier: 3 },
    ],
    desc: 'Homes for settlers. Upgrade to a Cottage once a Well and Market are in reach, and to a Manor with a Tavern and a supply of cloth.',
  },
  forager: {
    name: 'Forager', cat: 'food', tier: 1, cost: { wood: 5 }, build: 4, workers: 1, place: 'land',
    cycle: 12, out: { food: 1 }, site: 'forage', up: UP_PROD,
    desc: 'Gathers berries and roots from woods and meadows within 2 tiles. Cheap but modest, and it shares the woods with woodcutters.',
  },
  fishing: {
    name: 'Fishing Hut', cat: 'food', tier: 1, cost: { wood: 10 }, build: 6, workers: 2, place: 'coast',
    cycle: 6, out: { food: 1 }, site: 'fish', up: UP_PROD,
    desc: 'Nets fish from the water within 2 tiles. Shoals triple the catch; huts close together share the same water.',
  },
  woodcutter: {
    name: 'Woodcutter', cat: 'industry', tier: 1, cost: { wood: 8 }, build: 5, workers: 2, place: 'land',
    cycle: 5, out: { wood: 1 }, site: 'wood', up: UP_PROD,
    desc: 'Fells trees within 2 tiles. More forest means more wood; neighbouring cutters share the trees.',
  },
  forester: {
    name: 'Forester', cat: 'industry', tier: 1, cost: { wood: 8 }, build: 5, workers: 1, place: 'land', plants: 2,
    desc: 'Plants saplings on free meadow within 2 tiles, one every 20 seconds, so the woodcutters never run out.',
  },
  quarry: {
    name: 'Quarry', cat: 'industry', tier: 1, cost: { wood: 15 }, build: 8, workers: 3, place: 'hill',
    cycle: 6, out: { stone: 1 }, site: 'quarry', noise: true, flammable: false, up: UP_PROD,
    desc: 'Cuts stone from the hills. Surrounding hills and crags make it richer. Noisy: nearby homes are less happy.',
  },
  well: {
    name: 'Well', cat: 'homes', tier: 1, cost: { wood: 4, stone: 4 }, build: 5, workers: 0, place: 'land',
    radius: 3, service: 'well', flammable: false, up: UP_SERVICE,
    desc: 'Fresh water for homes in range, a Cottage need. Fires inside its range are put out quickly.',
  },
  warehouse: {
    name: 'Warehouse', cat: 'civic', tier: 1, cost: { wood: 20, stone: 8 }, build: 10, workers: 0, place: 'land',
    reach: 5, storage: 1, up: { cost: { planks: 12, stone: 10, tools: 2 }, tier: 3, storage: 1, reach: 1 },
    desc: 'Raises every storage limit and lets you build further afield: new buildings must be within reach of the Town Hall or a Warehouse.',
  },
  farm: {
    name: 'Farm', cat: 'food', tier: 2, cost: { wood: 12 }, build: 8, workers: 3, place: 'grass',
    cycle: 4, out: { grain: 1 }, site: 'farm', up: UP_PROD,
    desc: 'Grows grain on meadow. Built on fertile soil it yields half again as much, plus a little for fertile neighbours.',
  },
  bakery: {
    name: 'Bakery', cat: 'food', tier: 2, cost: { wood: 10, planks: 6, stone: 6 }, build: 10, workers: 2, place: 'land',
    cycle: 5, in: { grain: 1 }, out: { food: 2 }, up: UP_PROD,
    desc: 'Bakes grain into bread. Each sack of grain feeds twice as many mouths.',
  },
  sawmill: {
    name: 'Sawmill', cat: 'industry', tier: 2, cost: { wood: 20, stone: 6 }, build: 10, workers: 2, place: 'land',
    cycle: 5, in: { wood: 1 }, out: { planks: 1 }, noise: true, up: UP_PROD,
    desc: 'Saws logs into planks for finer buildings. Noisy.',
  },
  market: {
    name: 'Market', cat: 'homes', tier: 2, cost: { planks: 12, stone: 8, gold: 20 }, build: 12, workers: 2, place: 'land',
    radius: 4, service: 'market', up: UP_SERVICE,
    desc: 'Stalls for homes in range, a Cottage need. Needs its workers to open.',
  },
  dock: {
    name: 'Dock', cat: 'civic', tier: 2, cost: { wood: 10, planks: 15 }, build: 12, workers: 2, place: 'coast', unique: true,
    desc: 'Trading ships berth here and offer deals. Only one dock is needed.',
  },
  pasture: {
    name: 'Sheep Pasture', cat: 'industry', tier: 2, cost: { wood: 10 }, build: 6, workers: 1, place: 'pasture',
    cycle: 10, out: { wool: 1 }, site: 'pasture', up: UP_PROD,
    desc: 'Sheep graze open meadow and hills; free tiles around it fatten the flock.',
  },
  weaver: {
    name: 'Weaver', cat: 'industry', tier: 2, cost: { wood: 6, planks: 10 }, build: 8, workers: 2, place: 'land',
    cycle: 10, in: { wool: 2 }, out: { cloth: 1 }, up: UP_PROD,
    desc: 'Weaves wool into cloth. Manors use cloth, and traders pay well for it.',
  },
  mine: {
    name: 'Mine', cat: 'industry', tier: 3, cost: { wood: 10, planks: 12, stone: 4 }, build: 12, workers: 4, place: 'ore',
    cycle: 8, out: { ore: 1 }, site: 'mine', noise: true, flammable: false, up: UP_PROD,
    desc: 'Digs iron ore from a vein. More ore next to it, more ore out. Noisy.',
  },
  smelter: {
    name: 'Smelter', cat: 'industry', tier: 3, cost: { stone: 20, planks: 8 }, build: 12, workers: 3, place: 'land',
    cycle: 12, in: { ore: 2, wood: 1 }, out: { iron: 1 }, noise: true, flammable: false, up: UP_PROD,
    desc: 'Burns wood to smelt ore into iron. Noisy and smoky.',
  },
  toolsmith: {
    name: 'Toolsmith', cat: 'industry', tier: 3, cost: { planks: 12, stone: 10 }, build: 10, workers: 2, place: 'land',
    cycle: 15, in: { iron: 1, planks: 1 }, out: { tools: 1 }, noise: true, up: UP_PROD,
    desc: 'Forges iron and planks into tools for Manors, upgrades and great works. Noisy.',
  },
  brewery: {
    name: 'Brewery', cat: 'food', tier: 3, cost: { planks: 12, stone: 6 }, build: 10, workers: 2, place: 'land',
    cycle: 8, in: { grain: 1 }, out: { ale: 1 }, up: UP_PROD,
    desc: 'Brews grain into ale for the taverns.',
  },
  tavern: {
    name: 'Tavern', cat: 'homes', tier: 3, cost: { planks: 16, stone: 10, gold: 30 }, build: 12, workers: 2, place: 'land',
    radius: 4, service: 'tavern', ale: 3, up: UP_SERVICE,
    desc: 'Ale and song for homes in range, a Manor need. Pours 3 ale a minute and closes when the ale runs out.',
  },
  shrine: {
    name: 'Shrine', cat: 'homes', tier: 3, cost: { stone: 20, planks: 6, gold: 20 }, build: 12, workers: 1, place: 'land',
    radius: 4, service: 'shrine', flammable: false, up: UP_SERVICE,
    desc: 'A quiet place that lifts spirits in range and halves fever losses there.',
  },
  lighthouse: {
    name: 'Lighthouse', cat: 'civic', tier: 4, cost: { stone: 40, planks: 20, tools: 10, gold: 60 }, build: 25, workers: 1,
    place: 'coast', unique: true, flammable: false,
    desc: 'Guides ships home: traders call more often with an extra deal, and storms do less harm.',
  },
  charter: {
    name: 'Charter Hall', cat: 'civic', tier: 4, cost: { stone: 60, planks: 50, tools: 30, cloth: 30, gold: 250 }, build: 60,
    workers: 0, place: 'land', unique: true, flammable: false,
    desc: 'The seat of a chartered town. Completing it wins the Royal Charter and scores your colony.',
  },
};

export const BUILD_ORDER = ['house', 'well', 'market', 'tavern', 'shrine', 'forager', 'fishing', 'farm', 'bakery', 'brewery',
  'woodcutter', 'forester', 'quarry', 'sawmill', 'pasture', 'weaver', 'mine', 'smelter', 'toolsmith', 'warehouse', 'dock', 'lighthouse', 'charter'];

export const SIZES = {
  small: { name: 'Small', n: 30, charterPop: 100, scoreMult: 0.9 },
  medium: { name: 'Medium', n: 35, charterPop: 130, scoreMult: 1 },
  large: { name: 'Large', n: 40, charterPop: 160, scoreMult: 1.1 },
};

export const DIFFICULTY = {
  gentle: { name: 'Gentle', start: 1.5, eat: 0.85, eventGap: [110, 180], badScale: 0.6, landFrac: 0.5, fireDestroys: false, trade: 1.15, reliefGap: 180, scoreMult: 0.8, desc: 'Generous stores, mild weather, kind traders.' },
  standard: { name: 'Standard', start: 1, eat: 1, eventGap: [80, 140], badScale: 1, landFrac: 0.46, fireDestroys: true, trade: 1, reliefGap: 240, scoreMult: 1, desc: 'The intended balance.' },
  harsh: { name: 'Harsh', start: 0.7, eat: 1.15, eventGap: [55, 100], badScale: 1.4, landFrac: 0.42, fireDestroys: true, trade: 0.85, reliefGap: 360, scoreMult: 1.35, desc: 'Lean stores, wild seas, hard bargains.' },
};

export const START_STOCK = { food: 40, wood: 45, stone: 20, gold: 30 };

// Milestones are taken in order. `unlock` raises the building tier.
export const MILESTONES = [
  { id: 'roofs', name: 'First roofs', text: 'Build 3 Houses so new settlers have somewhere to sleep.', check: { kind: 'count', of: 'house', n: 3 }, reward: { wood: 15 } },
  { id: 'catch', name: 'A steady table', text: 'Grow to 12 people with 2 food buildings working.', check: { kind: 'all', of: [{ kind: 'pop', n: 12 }, { kind: 'countAny', of: ['fishing', 'forager', 'farm'], n: 2 }] }, reward: { food: 20 } },
  { id: 'village', name: 'Village', text: 'Reach 20 people. Unlocks farms, sawmills, markets and the dock.', check: { kind: 'pop', n: 20 }, unlock: 2, reward: { gold: 20 } },
  { id: 'sawdust', name: 'Sawdust', text: 'Stock 25 planks.', check: { kind: 'stock', res: 'planks', n: 25 }, reward: { stone: 15 } },
  { id: 'comfort', name: 'Comforts', text: 'Upgrade 3 Houses to Cottages (they need a Well and a Market in range).', check: { kind: 'level', of: 'house', level: 2, n: 3 }, reward: { gold: 30 } },
  { id: 'trade', name: 'Open for trade', text: 'Build a Dock and make a deal with a passing ship.', check: { kind: 'trades', n: 1 }, reward: { gold: 20 } },
  { id: 'town', name: 'Town', text: 'Reach 60 people. Unlocks mines, smithing, ale, taverns and shrines.', check: { kind: 'pop', n: 60 }, unlock: 3, reward: { planks: 20 } },
  { id: 'forge', name: 'Forge fire', text: 'Make 15 tools.', check: { kind: 'made', res: 'tools', n: 15 }, reward: { gold: 40 } },
  { id: 'manors', name: 'Fine living', text: 'Upgrade 2 Houses to Manors.', check: { kind: 'level', of: 'house', level: 3, n: 2 }, reward: { cloth: 10 } },
  { id: 'content', name: 'Content folk', text: 'Reach 80 people with happiness of 65 or more.', check: { kind: 'all', of: [{ kind: 'pop', n: 80 }, { kind: 'happy', n: 65 }] }, reward: { gold: 50 } },
  { id: 'port', name: 'Port town', text: 'Reach 100 people and 4 Manors. Unlocks the Lighthouse and Charter Hall.', check: { kind: 'all', of: [{ kind: 'pop', n: 100 }, { kind: 'level', of: 'house', level: 3, n: 4 }] }, unlock: 4, reward: { stone: 30 } },
  { id: 'charter', name: 'The Royal Charter', text: 'Build the Charter Hall. It needs the charter population and happiness of 60.', check: { kind: 'charter' }, reward: {} },
];

export const CHARTER_HAPPY = 60;

// Names for flavour.
export const SHIP_NAMES = ['Gull', 'Saltwind', 'Merry Otter', 'Brine Queen', 'Lantern', 'Patient Heron', 'Copper Kettle', 'Wandering Star', 'Old Tarry', 'Silver Mackerel', 'Dawn Treader', 'Fat Cormorant', 'Kestrel', 'Morning Bell'];
export const SHIP_PORTS = ['Varn', 'Oskeby', 'Tull', 'the Amber Coast', 'Marrowgate', 'Kessel', 'Lowmere', 'the Southern Isles', 'Port Ivy', 'Hallowind'];
export const ISLAND_A = ['Gull', 'Salt', 'Amber', 'Heron', 'Green', 'Kelp', 'Thistle', 'Cormorant', 'Driftwood', 'Lantern', 'Mallow', 'Otter', 'Seal', 'Whistle', 'Cobble', 'Tern'];
export const ISLAND_B = [' Isle', ' Key', ' Holm', 'mere', ' Rock', ' Reach', 'wick', ' Haven', ' Skerry', 'ey'];
