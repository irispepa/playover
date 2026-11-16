// Everbrook content tables. Pure data, no DOM, no three.

export const ERAS = [
  { id: 'stone', name: 'Age of Hearths', period: 'Stone Age', accent: '#b98a4a', wonder: 'stonecircle', goal: { pop: 24 },
    blurb: 'A handful of families settle where the brook bends. Fire, stories and a safe place to sleep.' },
  { id: 'bronze', name: 'Age of Clay', period: 'Bronze Age', accent: '#c2703d', wonder: 'gardens', goal: { pop: 80, homes: [2, 8] },
    blurb: 'Fields are sown, bricks are fired and the first marks are pressed into clay tablets.' },
  { id: 'classical', name: 'Age of Marble', period: 'Classical Age', accent: '#4f86a8', wonder: 'library', goal: { pop: 160, homes: [3, 10] },
    blurb: 'Columns rise over the brook. People argue happily about ideas in the shade.' },
  { id: 'medieval', name: 'Age of Guilds', period: 'Middle Ages', accent: '#7a5aa6', wonder: 'clocktower', goal: { pop: 260, homes: [4, 12] },
    blurb: 'Mills turn, bells ring the hours and every craft has its own hall and its own song.' },
  { id: 'renaissance', name: 'Age of Wonder', period: 'Renaissance', accent: '#2f8f7b', wonder: 'starhall', goal: { pop: 380, homes: [5, 12] },
    blurb: 'Presses clatter, lenses are ground and everyone suddenly wants to look at the stars.' },
  { id: 'industrial', name: 'Age of Steam', period: 'Industrial Age', accent: '#a8553f', wonder: 'pavilion', goal: { pop: 520, homes: [6, 14] },
    blurb: 'Brick terraces, iron rails and gaslight. Everbrook hums, and still keeps its gardens.' },
];

// Order is the order of the resource bar.
export const RES = {
  food: { name: 'Food', color: '#e08a3c', era: 0 },
  wood: { name: 'Wood', color: '#9a6b3f', era: 0 },
  stone: { name: 'Stone', color: '#8d939c', era: 0 },
  brick: { name: 'Brick', color: '#c4613e', era: 1 },
  ore: { name: 'Ore', color: '#c98c4a', era: 1 },
  tools: { name: 'Tools', color: '#5f7f96', era: 1 },
  cloth: { name: 'Cloth', color: '#b672b0', era: 1 },
  coin: { name: 'Coin', color: '#d9a821', era: 1 },
  paper: { name: 'Paper', color: '#c9b48a', era: 3 },
  glass: { name: 'Glass', color: '#5fb7c4', era: 4 },
  coal: { name: 'Coal', color: '#4a4a52', era: 5 },
  steel: { name: 'Steel', color: '#7c8ea3', era: 5 },
};
export const RES_KEYS = Object.keys(RES);
export const BASE_CAP = 150;

export const SERVICES = {
  water: { name: 'Fresh water', color: '#4aa3d9' },
  faith: { name: 'Gathering place', color: '#b07ad1' },
  market: { name: 'Market', color: '#e0a03c' },
  health: { name: 'Baths & care', color: '#58c2a4' },
  learning: { name: 'Schooling', color: '#5c7fd6' },
  leisure: { name: 'Leisure', color: '#e0708a' },
};

// Homes grow on their own when the things a household wants are within reach.
export const HOME_LEVELS = [
  { name: 'Tent', cap: 3, era: 0, needs: [], goods: {} },
  { name: 'Roundhouse', cap: 5, era: 0, needs: ['water'], goods: {} },
  { name: 'Mudbrick House', cap: 8, era: 1, needs: ['water', 'faith'], goods: {} },
  { name: 'Villa', cap: 11, era: 2, needs: ['water', 'faith', 'market'], goods: { cloth: 0.012 } },
  { name: 'Timber House', cap: 14, era: 3, needs: ['water', 'faith', 'market', 'health', 'learning'], goods: { cloth: 0.016 } },
  { name: 'Townhouse', cap: 18, era: 4, needs: ['water', 'faith', 'market', 'health', 'learning', 'leisure'], goods: { cloth: 0.018, paper: 0.012 } },
  { name: 'Brick Terrace', cap: 24, era: 5, needs: ['water', 'faith', 'market', 'health', 'learning', 'leisure'], goods: { cloth: 0.02, paper: 0.014, coal: 0.02 } },
];

export const CATS = [
  { id: 'homes', name: 'Homes' },
  { id: 'food', name: 'Food' },
  { id: 'craft', name: 'Craft' },
  { id: 'civic', name: 'Civic' },
  { id: 'lore', name: 'Lore' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'wonder', name: 'Wonder' },
];

// Building fields:
//  era, cat, size, cost, workers, desc
//  out / in   per-day production and consumption at 100%
//  adj        placement must touch this terrain: water | hill | ore | coal
//  near       needs at least one of this terrain within radius 2 (forest)
//  bonus      [{ t: terrain, r, per, max, label }] extra output per matching tile nearby
//  service    { type, r, reach }   reach = how far the service travels along connected roads
//  knowledge, culture   points per day
//  beauty     { r }      homes within r are prettier (more coin, more harmony)
//  boost      { kind: 'fields' | 'craft', r, amt }
//  storage    { all } or { food }
//  from       id of the older building this one can replace in place
//  disc       discovery that unlocks it (none = available on reaching the era)
export const B = {
  road: { name: 'Path', era: 0, cat: 'homes', size: 1, cost: { wood: 1 }, tile: true,
    desc: 'Carries water, goods and gossip. Services reach further along connected paths.' },
  home: { name: 'Home', era: 0, cat: 'homes', size: 1, cost: { wood: 8 },
    desc: 'A plot for one household. It grows by itself when water, gathering places and markets are within reach.' },
  storehouse: { name: 'Storehouse', era: 0, cat: 'homes', size: 1, cost: { wood: 20, stone: 8 }, storage: { all: 120 }, disc: 'toolmaking',
    desc: 'Raises how much of every material the town can keep.' },
  warehouse: { name: 'Warehouse', era: 3, cat: 'homes', size: 1, cost: { wood: 80, stone: 60, tools: 20 }, storage: { all: 380 }, from: 'storehouse', disc: 'architecture',
    desc: 'Three floors of barrels, bales and crates.' },

  forager: { name: "Forager's Hut", era: 0, cat: 'food', size: 1, cost: { wood: 10 }, workers: 2, out: { food: 1.0 },
    bonus: [{ t: 'forest', r: 2, per: 0.12, max: 6, label: 'Woodland nearby' }],
    desc: 'Berries, roots and mushrooms. Likes woodland close by.' },
  fisher: { name: "Fisher's Hut", era: 0, cat: 'food', size: 1, cost: { wood: 14 }, workers: 2, out: { food: 1.3 }, adj: 'water', disc: 'fishing',
    bonus: [{ t: 'water', r: 2, per: 0.1, max: 6, label: 'Open water' }],
    desc: 'Nets and wicker traps. Must stand on the bank.' },
  farmstead: { name: 'Farmstead', era: 1, cat: 'food', size: 1, cost: { wood: 20, stone: 10 }, workers: 3, farm: { r: 2, max: 8 },
    desc: 'Tends up to eight fields within two tiles. Fields by the water grow better.' },
  field: { name: 'Field', era: 1, cat: 'food', size: 1, cost: { wood: 1 }, tile: true,
    desc: 'Sown in spring, golden by autumn. Needs a farmstead within two tiles.' },
  granary: { name: 'Granary', era: 1, cat: 'food', size: 1, cost: { wood: 25, brick: 15 }, storage: { food: 260 }, disc: 'pottery',
    desc: 'Keeps the harvest dry through winter.' },
  windmill: { name: 'Windmill', era: 3, cat: 'food', size: 1, cost: { wood: 60, stone: 30, tools: 15 }, workers: 1, boost: { kind: 'fields', r: 3, amt: 0.3 }, disc: 'milling',
    desc: 'Fields within three tiles yield a third more.' },

  woodcutter: { name: "Woodcutter's Camp", era: 0, cat: 'craft', size: 1, cost: { wood: 8 }, workers: 2, out: { wood: 0.9 }, near: 'forest',
    bonus: [{ t: 'forest', r: 2, per: 0.15, max: 6, label: 'Woodland nearby' }],
    desc: 'Coppices the woods and replants as it goes.' },
  stonecutter: { name: 'Stonecutter', era: 0, cat: 'craft', size: 1, cost: { wood: 14 }, workers: 2, out: { stone: 0.7 }, adj: 'hill', disc: 'toolmaking',
    bonus: [{ t: 'hill', r: 2, per: 0.12, max: 5, label: 'Rocky ground' }],
    desc: 'Splits stone from the hillside. Must touch a hill.' },
  kiln: { name: 'Brick Kiln', era: 1, cat: 'craft', size: 1, cost: { wood: 20, stone: 15 }, workers: 2, in: { wood: 0.35 }, out: { brick: 0.6 }, adj: 'water', craft: true,
    desc: 'Digs clay from the bank and fires it into brick.' },
  mine: { name: 'Mine', era: 1, cat: 'craft', size: 1, cost: { wood: 30, stone: 10 }, workers: 3, out: { ore: 0.6 }, adj: 'ore', disc: 'bronze',
    desc: 'Follows a vein of ore into the hill. Must touch an ore outcrop.' },
  smithy: { name: 'Smithy', era: 1, cat: 'craft', size: 1, cost: { stone: 25, brick: 15 }, workers: 2, in: { ore: 0.4, wood: 0.2 }, out: { tools: 0.4 }, craft: true, disc: 'bronze',
    desc: 'Turns ore into sickles, chisels and needles.' },
  weaver: { name: "Weaver's Croft", era: 1, cat: 'craft', size: 1, cost: { wood: 30, brick: 15 }, workers: 2, out: { cloth: 0.45 }, craft: true, disc: 'weaving',
    bonus: [{ t: 'meadow', r: 2, per: 0.06, max: 8, label: 'Grazing meadow' }],
    desc: 'Keeps a few sheep. The more open meadow around it, the more wool.' },
  tradingpost: { name: 'Trading Post', era: 1, cat: 'craft', size: 1, cost: { wood: 40, brick: 30 }, workers: 2, out: { coin: 0.25 }, adj: 'water', trade: 1, disc: 'trade',
    desc: 'River boats call here. Opens the Trade ledger to swap surplus for what you lack.' },
  guildhall: { name: 'Guild Hall', era: 3, cat: 'craft', size: 1, cost: { wood: 60, stone: 60, tools: 30, coin: 80 }, workers: 2, out: { coin: 0.5 }, boost: { kind: 'craft', r: 3, amt: 0.25 }, disc: 'guilds',
    desc: 'Workshops within three tiles make a quarter more.' },
  papermill: { name: 'Paper Mill', era: 3, cat: 'craft', size: 1, cost: { wood: 60, stone: 30, tools: 20 }, workers: 3, in: { wood: 0.5 }, out: { paper: 0.5 }, adj: 'water', craft: true, disc: 'papermaking',
    desc: 'A waterwheel pounds rags and pulp into paper.' },
  glassworks: { name: 'Glassworks', era: 4, cat: 'craft', size: 1, cost: { stone: 80, brick: 60, tools: 40 }, workers: 3, in: { wood: 0.5, stone: 0.3 }, out: { glass: 0.45 }, craft: true, disc: 'optics',
    desc: 'Sand, ash and a very hot furnace.' },
  coalmine: { name: 'Coal Pit', era: 5, cat: 'craft', size: 1, cost: { wood: 80, stone: 60, tools: 40 }, workers: 4, out: { coal: 0.9 }, adj: 'coal', disc: 'steam',
    desc: 'Must touch a coal seam in the hills.' },
  steelworks: { name: 'Steelworks', era: 5, cat: 'craft', size: 2, cost: { brick: 150, stone: 100, tools: 60, coin: 200 }, workers: 5, in: { ore: 0.6, coal: 0.6 }, out: { steel: 0.5 }, craft: true, disc: 'metallurgy',
    desc: 'Ore and coal go in, girders come out.' },
  factory: { name: 'Mill Works', era: 5, cat: 'craft', size: 2, cost: { brick: 180, steel: 40, glass: 30, coin: 300 }, workers: 6, in: { coal: 0.5 }, out: { cloth: 1.0, tools: 0.8 }, craft: true, disc: 'steam',
    desc: 'Steam looms and lathes under one saw-tooth roof.' },
  station: { name: 'Railway Station', era: 5, cat: 'craft', size: 2, cost: { brick: 150, steel: 80, glass: 40, coin: 400 }, workers: 3, out: { coin: 2.0 }, trade: 2, disc: 'railways',
    desc: 'Trains bring the wider world. Better prices in the Trade ledger.' },

  well: { name: 'Well', era: 0, cat: 'civic', size: 1, cost: { wood: 10 }, service: { type: 'water', r: 3, reach: 6 },
    desc: 'Fresh water for homes nearby, and further along paths.' },
  fountain: { name: 'Fountain', era: 2, cat: 'civic', size: 1, cost: { stone: 40, brick: 20, tools: 10 }, service: { type: 'water', r: 5, reach: 12 }, beauty: { r: 1 }, from: 'well', disc: 'masonry',
    desc: 'Piped spring water and a place to sit.' },
  watertower: { name: 'Water Tower', era: 5, cat: 'civic', size: 1, cost: { brick: 80, steel: 30, coin: 100 }, service: { type: 'water', r: 7, reach: 18 }, from: 'fountain', disc: 'sanitation',
    desc: 'Water under pressure for half the town.' },
  market: { name: 'Market', era: 1, cat: 'civic', size: 1, cost: { wood: 30, brick: 20 }, workers: 2, out: { coin: 0.3 }, service: { type: 'market', r: 4, reach: 9 }, disc: 'trade',
    desc: 'Stalls under bright awnings. Homes in reach can become villas.' },
  markethall: { name: 'Market Hall', era: 3, cat: 'civic', size: 1, cost: { wood: 60, stone: 50, cloth: 20, coin: 60 }, workers: 3, out: { coin: 0.8 }, service: { type: 'market', r: 5, reach: 13 }, from: 'market', disc: 'guilds',
    desc: 'A roofed hall with the guild scales by the door.' },
  bathhouse: { name: 'Bathhouse', era: 2, cat: 'civic', size: 1, cost: { stone: 50, brick: 40, tools: 10 }, workers: 2, in: { wood: 0.2 }, service: { type: 'health', r: 4, reach: 10 }, disc: 'hygiene',
    desc: 'Warm water, clean hands and a herb garden out the back.' },
  clinic: { name: 'Clinic', era: 5, cat: 'civic', size: 1, cost: { brick: 100, glass: 30, cloth: 30, coin: 150 }, workers: 3, service: { type: 'health', r: 6, reach: 14 }, from: 'bathhouse', disc: 'sanitation',
    desc: 'A doctor, two nurses and a very clean floor.' },
  tavern: { name: 'Tavern', era: 3, cat: 'civic', size: 1, cost: { wood: 60, brick: 30, coin: 30 }, workers: 2, in: { food: 0.3 }, out: { coin: 0.4 }, culture: 0.3, service: { type: 'leisure', r: 4, reach: 9 }, disc: 'brewing',
    desc: 'Stew, cider and a fiddler by the fire.' },

  storyteller: { name: 'Story Circle', era: 0, cat: 'lore', size: 1, cost: { wood: 12 }, workers: 1, knowledge: 0.3, culture: 0.1,
    desc: 'Elders pass on what they know around the fire. Makes Knowledge.' },
  scribe: { name: 'Scribe House', era: 1, cat: 'lore', size: 1, cost: { wood: 25, brick: 25 }, workers: 2, knowledge: 0.9, disc: 'writing',
    desc: 'Clay tablets record harvests, debts and good jokes.' },
  academy: { name: 'Academy', era: 2, cat: 'lore', size: 2, cost: { stone: 70, brick: 50, cloth: 20, coin: 50 }, workers: 4, knowledge: 2.4, disc: 'philosophy',
    desc: 'A colonnade for walking and thinking.' },
  school: { name: 'School', era: 3, cat: 'lore', size: 1, cost: { wood: 50, stone: 40, cloth: 15, coin: 40 }, workers: 2, knowledge: 1.5, service: { type: 'learning', r: 4, reach: 10 }, disc: 'schooling',
    desc: 'Letters and sums for every child in reach.' },
  press: { name: 'Printing Press', era: 4, cat: 'lore', size: 1, cost: { wood: 60, tools: 40, coin: 100 }, workers: 3, in: { paper: 0.4 }, knowledge: 3.2, culture: 0.3, disc: 'printing',
    desc: 'Turns paper into pamphlets, almanacs and arguments.' },
  university: { name: 'University', era: 4, cat: 'lore', size: 2, cost: { stone: 150, brick: 100, glass: 30, paper: 40, coin: 200 }, workers: 5, knowledge: 5, service: { type: 'learning', r: 6, reach: 14 }, disc: 'humanism',
    desc: 'Cloisters, lecture halls and a suspicious number of cats.' },
  institute: { name: 'Institute', era: 5, cat: 'lore', size: 2, cost: { brick: 200, steel: 60, glass: 60, paper: 80, coin: 500 }, workers: 6, knowledge: 9, culture: 0.5, disc: 'publicgood',
    desc: 'Laboratories and a museum that is free on Sundays.' },

  standingstone: { name: 'Standing Stone', era: 0, cat: 'beauty', size: 1, cost: { stone: 12 }, culture: 0.15, service: { type: 'faith', r: 3, reach: 5 }, beauty: { r: 2 }, disc: 'ritual',
    desc: 'A place to meet at solstice. Counts as a gathering place.' },
  shrine: { name: 'Shrine', era: 1, cat: 'beauty', size: 1, cost: { stone: 20, brick: 20 }, workers: 1, culture: 0.3, service: { type: 'faith', r: 4, reach: 8 }, disc: 'worship',
    desc: 'Offerings of grain and flowers. Homes in reach can become mudbrick houses.' },
  temple: { name: 'Temple', era: 2, cat: 'beauty', size: 2, cost: { stone: 80, brick: 40, tools: 15, coin: 40 }, workers: 2, culture: 0.8, service: { type: 'faith', r: 5, reach: 12 }, disc: 'masonry',
    desc: 'White columns and a cool, echoing hall.' },
  chapel: { name: 'Chapel', era: 3, cat: 'beauty', size: 1, cost: { stone: 70, wood: 40, tools: 15, coin: 40 }, workers: 1, culture: 0.7, service: { type: 'faith', r: 5, reach: 12 }, from: 'shrine', disc: 'architecture',
    desc: 'A bell for weddings, harvests and Tuesdays.' },
  garden: { name: 'Garden', era: 2, cat: 'beauty', size: 1, cost: { stone: 10, coin: 10 }, culture: 0.1, beauty: { r: 2 },
    desc: 'Herbs, roses and a bench. Homes nearby are happier.' },
  statue: { name: 'Statue', era: 2, cat: 'beauty', size: 1, cost: { stone: 30, tools: 5 }, culture: 0.25, beauty: { r: 3 }, disc: 'sculpture',
    desc: 'Somebody important, or at least somebody tall.' },
  amphitheatre: { name: 'Amphitheatre', era: 2, cat: 'beauty', size: 2, cost: { stone: 90, tools: 15, coin: 30 }, workers: 2, culture: 0.6, service: { type: 'leisure', r: 5, reach: 12 }, disc: 'drama',
    desc: 'Comedies in spring, tragedies in autumn.' },
  theatre: { name: 'Theatre', era: 4, cat: 'beauty', size: 2, cost: { wood: 120, stone: 80, cloth: 60, glass: 20, coin: 150 }, workers: 3, culture: 1.2, service: { type: 'leisure', r: 6, reach: 14 }, disc: 'stagecraft',
    desc: 'Velvet seats and a painted sky.' },
  botanic: { name: 'Botanic Garden', era: 4, cat: 'beauty', size: 2, cost: { stone: 60, glass: 40, coin: 100 }, culture: 0.6, knowledge: 0.5, beauty: { r: 4 }, disc: 'botany',
    desc: 'A glasshouse of plants from very far away.' },
  park: { name: 'Gaslit Park', era: 5, cat: 'beauty', size: 2, cost: { stone: 40, steel: 10, glass: 10, coin: 120 }, culture: 0.8, service: { type: 'leisure', r: 4, reach: 8 }, beauty: { r: 4 }, disc: 'gaslight',
    desc: 'A bandstand, a pond and lamps that glow at dusk.' },

  stonecircle: { name: 'Stone Circle', era: 0, cat: 'wonder', size: 2, wonder: true, cost: { wood: 30, stone: 20 }, disc: 'monument', culture: 0.6, beauty: { r: 4 },
    stages: [{ wood: 50, stone: 70 }, { stone: 110, food: 60 }],
    desc: 'Great stones set to catch the midsummer sunrise. Finishing it opens the next age.' },
  gardens: { name: 'Hanging Gardens', era: 1, cat: 'wonder', size: 2, wonder: true, cost: { brick: 50, wood: 50 }, disc: 'terraces', culture: 1.2, beauty: { r: 5 },
    stages: [{ brick: 90, stone: 60, tools: 20 }, { brick: 120, tools: 40, food: 120 }, { brick: 120, cloth: 40, wood: 120 }],
    desc: 'Terraces of green rising above the rooftops, watered from the brook.' },
  library: { name: 'Great Library', era: 2, cat: 'wonder', size: 2, wonder: true, cost: { stone: 120, brick: 80 }, disc: 'greatlibrary', culture: 1.5, knowledge: 2, beauty: { r: 5 },
    stages: [{ stone: 150, cloth: 60, tools: 40 }, { stone: 180, brick: 150, coin: 200 }, { cloth: 120, tools: 80, coin: 300 }],
    desc: 'Every scroll anyone can find, copied and shelved.' },
  clocktower: { name: 'Great Clocktower', era: 3, cat: 'wonder', size: 2, wonder: true, cost: { stone: 200, wood: 150 }, disc: 'clockwork', culture: 2, beauty: { r: 6 },
    stages: [{ stone: 250, tools: 80, coin: 200 }, { wood: 250, brick: 200, cloth: 100 }, { tools: 150, paper: 100, coin: 500 }],
    desc: 'It tells the hour, the season and the phase of the moon, and it is nearly always right.' },
  starhall: { name: 'Starhall Observatory', era: 4, cat: 'wonder', size: 2, wonder: true, cost: { stone: 250, brick: 200 }, disc: 'astronomy', culture: 2, knowledge: 4, beauty: { r: 6 },
    stages: [{ stone: 250, glass: 80, tools: 120 }, { brick: 250, paper: 150, coin: 600 }, { glass: 200, tools: 150, coin: 900 }],
    desc: 'A copper dome that opens to the night sky.' },
  pavilion: { name: 'Crystal Pavilion', era: 5, cat: 'wonder', size: 3, wonder: true, cost: { brick: 300, stone: 300 }, disc: 'exhibition', culture: 4, beauty: { r: 8 },
    stages: [{ steel: 150, glass: 150, coin: 800 }, { steel: 250, glass: 250, brick: 300 }, { steel: 250, glass: 300, paper: 200, coin: 1500 }],
    desc: 'A hall of iron and glass for a great exhibition of everything Everbrook has learned.' },
};
for (const [id, b] of Object.entries(B)) b.id = id;

// Discoveries are bought with Knowledge. Each opens buildings or a standing bonus.
export const DISC = [
  { id: 'toolmaking', era: 0, cost: 20, name: 'Toolmaking', desc: 'Knapped flint and antler picks.', unlocks: ['stonecutter', 'storehouse'] },
  { id: 'fishing', era: 0, cost: 30, name: 'Fishing', desc: 'Wicker traps and bone hooks.', unlocks: ['fisher'] },
  { id: 'ritual', era: 0, cost: 40, name: 'Ritual', desc: 'Marking the seasons together.', unlocks: ['standingstone'] },
  { id: 'monument', era: 0, cost: 90, name: 'Monuments', desc: 'Moving very large stones with rope, rollers and patience.', unlocks: ['stonecircle'], needs: ['toolmaking'] },

  { id: 'pottery', era: 1, cost: 60, name: 'Pottery', desc: 'Sealed jars keep grain dry.', unlocks: ['granary'] },
  { id: 'worship', era: 1, cost: 60, name: 'Offerings', desc: 'A shared hearth for the whole town.', unlocks: ['shrine'] },
  { id: 'writing', era: 1, cost: 80, name: 'Writing', desc: 'Marks in clay that remember for you.', unlocks: ['scribe'] },
  { id: 'bronze', era: 1, cost: 80, name: 'Bronze Working', desc: 'Copper and tin, hotter fires.', unlocks: ['mine', 'smithy'] },
  { id: 'weaving', era: 1, cost: 80, name: 'Weaving', desc: 'The upright loom.', unlocks: ['weaver'] },
  { id: 'trade', era: 1, cost: 100, name: 'Trade', desc: 'Weights, measures and river boats.', unlocks: ['market', 'tradingpost'] },
  { id: 'terraces', era: 1, cost: 170, name: 'Terracing', desc: 'Lifting water uphill, one bucket-wheel at a time.', unlocks: ['gardens'], needs: ['bronze'] },

  { id: 'sculpture', era: 2, cost: 240, name: 'Sculpture', desc: 'Finding the figure inside the stone.', unlocks: ['statue'] },
  { id: 'masonry', era: 2, cost: 330, name: 'Masonry', desc: 'Arches, columns and lead pipes.', unlocks: ['fountain', 'temple'] },
  { id: 'hygiene', era: 2, cost: 350, name: 'Public Baths', desc: 'Hot rooms, cold plunges.', unlocks: ['bathhouse'] },
  { id: 'philosophy', era: 2, cost: 400, name: 'Philosophy', desc: 'Asking why, professionally.', unlocks: ['academy'] },
  { id: 'drama', era: 2, cost: 440, name: 'Drama', desc: 'Masks, chorus and applause.', unlocks: ['amphitheatre'] },
  { id: 'greatlibrary', era: 2, cost: 700, name: 'Cataloguing', desc: 'A place for every scroll.', unlocks: ['library'], needs: ['philosophy'] },

  { id: 'milling', era: 3, cost: 610, name: 'Milling', desc: 'Sails that grind the grain.', unlocks: ['windmill'] },
  { id: 'brewing', era: 3, cost: 650, name: 'Brewing', desc: 'Cider, ale and long evenings.', unlocks: ['tavern'] },
  { id: 'schooling', era: 3, cost: 680, name: 'Schooling', desc: 'A slate for every child.', unlocks: ['school'] },
  { id: 'guilds', era: 3, cost: 720, name: 'Guilds', desc: 'Masters, journeymen and fair measures.', unlocks: ['guildhall', 'markethall'] },
  { id: 'architecture', era: 3, cost: 760, name: 'Architecture', desc: 'Buttresses, vaults and tall timber frames.', unlocks: ['warehouse', 'chapel'] },
  { id: 'papermaking', era: 3, cost: 810, name: 'Papermaking', desc: 'Rags, water and a heavy hammer.', unlocks: ['papermill'] },
  { id: 'clockwork', era: 3, cost: 1170, name: 'Clockwork', desc: 'Gears that count the day.', unlocks: ['clocktower'], needs: ['papermaking'] },

  { id: 'printing', era: 4, cost: 1400, name: 'Printing', desc: 'Movable type.', unlocks: ['press'] },
  { id: 'botany', era: 4, cost: 1400, name: 'Botany', desc: 'Naming every leaf.', unlocks: ['botanic'] },
  { id: 'optics', era: 4, cost: 1500, name: 'Optics', desc: 'Clear glass and ground lenses.', unlocks: ['glassworks'] },
  { id: 'stagecraft', era: 4, cost: 1500, name: 'Stagecraft', desc: 'Trapdoors, curtains and thunder sheets.', unlocks: ['theatre'] },
  { id: 'humanism', era: 4, cost: 1600, name: 'Humanism', desc: 'The measure of all things.', unlocks: ['university'] },
  { id: 'astronomy', era: 4, cost: 2400, name: 'Astronomy', desc: 'The sky, mapped.', unlocks: ['starhall'], needs: ['optics'] },

  { id: 'steam', era: 5, cost: 2800, name: 'Steam Power', desc: 'Boiling water does the heavy lifting.', unlocks: ['coalmine', 'factory'] },
  { id: 'sanitation', era: 5, cost: 3000, name: 'Sanitation', desc: 'Clean water in, everything else out.', unlocks: ['watertower', 'clinic'] },
  { id: 'gaslight', era: 5, cost: 3000, name: 'Gaslight', desc: 'Evenings out of doors.', unlocks: ['park'] },
  { id: 'metallurgy', era: 5, cost: 3200, name: 'Steelmaking', desc: 'Stronger than iron, lighter than stone.', unlocks: ['steelworks'], needs: ['steam'] },
  { id: 'publicgood', era: 5, cost: 3400, name: 'Public Learning', desc: 'Knowledge for anyone who walks in.', unlocks: ['institute'] },
  { id: 'railways', era: 5, cost: 3600, name: 'Railways', desc: 'Iron roads to everywhere.', unlocks: ['station'], needs: ['metallurgy'] },
  { id: 'exhibition', era: 5, cost: 5200, name: 'The Great Exhibition', desc: 'Show the world what a peaceful town can do.', unlocks: ['pavilion'], needs: ['metallurgy'] },
];
export const DISC_BY_ID = Object.fromEntries(DISC.map((d) => [d.id, d]));

// The Chronicle: gentle goals that teach the game and pace each age. `c` reads a stats object
// (see questStats in sim.js): n = building counts, pop, homes by level, roads, fields, era, disc, wonderStage.
export const QUESTS = [
  { era: 0, text: 'Pitch three homes on the meadow', hint: 'Homes are in the first tab. Tap the map to place.', c: (q) => q.n.home >= 3, reward: { food: 10 } },
  { era: 0, text: "Build a Forager's Hut by the trees", hint: 'Each wooded tile within two steps adds food.', c: (q) => q.n.forager >= 1, reward: { wood: 10 } },
  { era: 0, text: "Build a Woodcutter's Camp", hint: 'Find it under Craft.', c: (q) => q.n.woodcutter >= 1, reward: { food: 10 } },
  { era: 0, text: 'Dig a Well near your homes', hint: 'Homes with fresh water grow into roundhouses.', c: (q) => q.n.well >= 1, reward: { wood: 10 } },
  { era: 0, text: 'Lay five tiles of path', hint: 'Drag across the map to lay a run of path.', c: (q) => q.roads >= 5, reward: { wood: 10 } },
  { era: 0, text: 'Gather a Story Circle', hint: 'Under Lore. It makes Knowledge.', c: (q) => q.n.storyteller >= 1, reward: { food: 15 } },
  { era: 0, text: 'Make your first discovery', hint: 'Tap the lamp button to spend Knowledge.', c: (q) => q.discCount >= 1, reward: { wood: 15 } },
  { era: 0, text: 'Build a Stonecutter against the hills', hint: 'Needs Toolmaking. It must touch a hill tile.', c: (q) => q.n.stonecutter >= 1, reward: { stone: 10 } },
  { era: 0, text: 'Grow to 24 villagers', hint: 'More homes, plenty of food, water in reach.', c: (q) => q.pop >= 24, reward: { stone: 15 } },
  { era: 0, text: 'Raise the Stone Circle and enter a new age', hint: 'Discover Monuments, place the circle, then bring it materials.', c: (q) => q.era >= 1, reward: {} },

  { era: 1, text: 'Build a Farmstead and sow six fields', hint: 'Fields must lie within two tiles of the farmstead.', c: (q) => q.n.farmstead >= 1 && q.fields >= 6, reward: { wood: 20 } },
  { era: 1, text: 'Fire your first bricks', hint: 'A Brick Kiln must stand on the river bank.', c: (q) => q.n.kiln >= 1, reward: { stone: 20 } },
  { era: 1, text: 'Build a Shrine', hint: 'Discover Offerings. Homes in reach become mudbrick houses.', c: (q) => q.n.shrine >= 1, reward: { brick: 15 } },
  { era: 1, text: 'See eight Mudbrick Houses', hint: 'They need water and a gathering place in reach.', c: (q) => q.lv[2] >= 8, reward: { brick: 20 } },
  { era: 1, text: 'Open a Mine and a Smithy', hint: 'Discover Bronze Working. Mines must touch an ore outcrop.', c: (q) => q.n.mine >= 1 && q.n.smithy >= 1, reward: { food: 30 } },
  { era: 1, text: 'Set up a Market', hint: 'Discover Trade.', c: (q) => q.n.market + q.n.markethall >= 1, reward: { coin: 20 } },
  { era: 1, text: 'Grow to 80 townsfolk', hint: 'Use the eye button to see which homes lack what.', c: (q) => q.pop >= 80, reward: { coin: 30 } },
  { era: 1, text: 'Complete the Hanging Gardens', hint: 'Discover Terracing first.', c: (q) => q.era >= 2, reward: {} },

  { era: 2, text: 'Plant three Gardens', hint: 'Homes near beauty pay more coin and lift harmony.', c: (q) => q.n.garden >= 3, reward: { coin: 30 } },
  { era: 2, text: 'See ten Villas', hint: 'Villas want a market in reach and cloth in the stores.', c: (q) => q.lv[3] >= 10, reward: { stone: 40 } },
  { era: 2, text: 'Build an Academy', hint: 'Discover Philosophy.', c: (q) => q.n.academy >= 1, reward: { coin: 40 } },
  { era: 2, text: 'Build a Bathhouse', hint: 'Discover Public Baths.', c: (q) => q.n.bathhouse + q.n.clinic >= 1, reward: { tools: 10 } },
  { era: 2, text: 'Hold a festival', hint: 'Culture fills the festival ring. Tap it when it is full.', c: (q) => q.festivals >= 1, reward: { coin: 40 } },
  { era: 2, text: 'Grow to 160 citizens', hint: 'Upgrade wells to fountains to reach more homes.', c: (q) => q.pop >= 160, reward: { coin: 60 } },
  { era: 2, text: 'Complete the Great Library', hint: 'Discover Cataloguing first.', c: (q) => q.era >= 3, reward: {} },

  { era: 3, text: 'Raise a Windmill among your fields', hint: 'Discover Milling.', c: (q) => q.n.windmill >= 1, reward: { food: 60 } },
  { era: 3, text: 'Open a School and a Tavern', hint: 'Timber houses want schooling and care; townhouses later want leisure.', c: (q) => q.n.school >= 1 && q.n.tavern >= 1, reward: { coin: 60 } },
  { era: 3, text: 'See twelve Timber Houses', hint: 'They need water, gathering, market, baths and schooling.', c: (q) => q.lv[4] >= 12, reward: { tools: 20 } },
  { era: 3, text: 'Found a Guild Hall beside your workshops', hint: 'Discover Guilds.', c: (q) => q.n.guildhall >= 1, reward: { coin: 80 } },
  { era: 3, text: 'Make paper', hint: 'A Paper Mill must stand on the bank.', c: (q) => q.n.papermill >= 1, reward: { paper: 20 } },
  { era: 3, text: 'Grow to 260 citizens', hint: 'Keep the granaries ahead of the winter.', c: (q) => q.pop >= 260, reward: { coin: 100 } },
  { era: 3, text: 'Complete the Great Clocktower', hint: 'Discover Clockwork first.', c: (q) => q.era >= 4, reward: {} },

  { era: 4, text: 'Start a Printing Press', hint: 'It turns paper into a great deal of Knowledge.', c: (q) => q.n.press >= 1, reward: { paper: 30 } },
  { era: 4, text: 'Blow glass', hint: 'Discover Optics.', c: (q) => q.n.glassworks >= 1, reward: { glass: 20 } },
  { era: 4, text: 'Found a University', hint: 'Discover Humanism.', c: (q) => q.n.university >= 1, reward: { coin: 150 } },
  { era: 4, text: 'See twelve Townhouses', hint: 'They want leisure in reach and paper in the stores.', c: (q) => q.lv[5] >= 12, reward: { coin: 150 } },
  { era: 4, text: 'Grow to 380 citizens', hint: 'A theatre reaches a long way along the streets.', c: (q) => q.pop >= 380, reward: { coin: 200 } },
  { era: 4, text: 'Complete the Starhall Observatory', hint: 'Discover Astronomy first.', c: (q) => q.era >= 5, reward: {} },

  { era: 5, text: 'Sink a Coal Pit', hint: 'Coal seams show as dark rock in the hills.', c: (q) => q.n.coalmine >= 1, reward: { coal: 30 } },
  { era: 5, text: 'Pour steel', hint: 'A Steelworks needs ore and coal.', c: (q) => q.n.steelworks >= 1, reward: { steel: 20 } },
  { era: 5, text: 'See fourteen Brick Terraces', hint: 'They want everything in reach, and coal for the hearth.', c: (q) => q.lv[6] >= 14, reward: { coin: 300 } },
  { era: 5, text: 'Open the Railway Station', hint: 'Discover Railways.', c: (q) => q.n.station >= 1, reward: { coin: 300 } },
  { era: 5, text: 'Grow to 520 citizens', hint: 'Water towers and clinics reach far.', c: (q) => q.pop >= 520, reward: { coin: 400 } },
  { era: 5, text: 'Complete the Crystal Pavilion', hint: 'Discover The Great Exhibition first.', c: (q) => q.done, reward: {} },
];

// Festivals: when Culture fills the ring, the town picks one of three.
export const FESTIVALS = [
  { id: 'feast', name: 'Harvest Feast', desc: 'Long tables down the main path.', effect: 'Stores gain food worth a fifth of your granary space.' },
  { id: 'fair', name: 'Brookside Fair', desc: 'Traders, jugglers and a prize pig.', effect: 'A purse of coin, larger in later ages.', minEra: 1 },
  { id: 'stories', name: 'Night of Stories', desc: 'Everyone tells one. Some are even true.', effect: 'A burst of Knowledge.' },
  { id: 'raising', name: 'Barn Raising', desc: 'Many hands, one roof before dusk.', effect: 'Free timber and stone.' },
  { id: 'homecoming', name: 'Homecoming', desc: 'Cousins arrive with carts and decide to stay.', effect: 'New residents fill empty rooms.' },
  { id: 'blossom', name: 'Blossom Day', desc: 'Petals on every doorstep.', effect: 'Harmony is lifted for a full year.' },
];

// Small happenings. Every option is kind; they differ in what they give.
export const EVENTS = [
  { id: 'merchant', minEra: 0, title: 'A Travelling Trader', text: 'A trader with a laden mule asks to rest by the brook, and offers a swap before moving on.',
    options: [{ label: 'Trade food for timber', give: { food: -20 }, get: { wood: 35 } }, { label: 'Share a meal and wave them on', get: { culture: 6 } }] },
  { id: 'storyteller', minEra: 0, title: 'The Wandering Storyteller', text: 'An old woman with a painted staff knows tales from beyond the hills.',
    options: [{ label: 'Listen all night', get: { knowledge: 12 } }, { label: 'Ask her to teach the children songs', get: { culture: 10 } }] },
  { id: 'shoal', minEra: 0, title: 'Silver in the Water', text: 'The brook is thick with fish heading upstream. Even the herons look pleased.',
    options: [{ label: 'Fill the baskets', get: { foodPct: 0.18 } }, { label: 'Let them pass, take a few', get: { food: 15, culture: 6 } }] },
  { id: 'newcomers', minEra: 0, title: 'Newcomers at the Ford', text: 'Three families have followed the brook looking for a quiet place to settle.',
    options: [{ label: 'Welcome them', get: { pop: 6 } }, { label: 'Welcome them and throw a supper', give: { food: -15 }, get: { pop: 6, culture: 8 } }] },
  { id: 'windfall', minEra: 0, title: 'After the Storm', text: 'A night of wind has left fallen boughs all through the woods. Nobody was hurt, and the kindling is free.',
    options: [{ label: 'Gather the timber', get: { wood: 30 } }, { label: 'Leave it for the beetles and birds', get: { culture: 8 } }] },
  { id: 'bees', minEra: 1, title: 'A Swarm Settles', text: 'Wild bees have taken a liking to the orchard wall.',
    options: [{ label: 'Build them proper hives', give: { wood: -10 }, get: { foodPct: 0.12, culture: 5 } }, { label: 'Let them be', get: { culture: 6 } }] },
  { id: 'potter', minEra: 1, title: 'The Master Potter', text: 'A potter passing through admires your clay and offers to stay a season.',
    options: [{ label: 'Have her teach the kiln hands', get: { brick: 40 } }, { label: 'Have her teach the scribes glazing', get: { knowledge: 30 } }] },
  { id: 'caravan', minEra: 1, title: 'A Caravan from the Coast', text: 'Salt, dyed cloth and gossip. They will buy whatever you can spare.',
    options: [{ label: 'Sell them stone', give: { stone: -40 }, get: { coin: 60 } }, { label: 'Buy cloth', give: { coin: -30 }, get: { cloth: 30 } }] },
  { id: 'scholar', minEra: 2, title: 'A Visiting Scholar', text: 'She has walked from the great city to see whether the rumours about your town are true.',
    options: [{ label: 'Invite her to lecture', get: { knowledge: 80 } }, { label: 'Commission a history of the town', give: { coin: -40 }, get: { culture: 40, knowledge: 30 } }] },
  { id: 'players', minEra: 2, title: 'Strolling Players', text: 'A troupe sets up a cart stage in the square and the whole town stops work to watch.',
    options: [{ label: 'Pay them to stay a week', give: { coin: -30 }, get: { culture: 50 } }, { label: 'Pass the hat', get: { culture: 20 } }] },
  { id: 'orchard', minEra: 2, title: 'A Good Apple Year', text: 'The branches are bending. There is more fruit than anyone can carry.',
    options: [{ label: 'Press cider for winter', get: { foodPct: 0.2 } }, { label: 'Sell baskets downriver', get: { coin: 80 } }] },
  { id: 'mason', minEra: 3, title: 'The Journeyman Masons', text: 'A band of masons between jobs offers a season of work for bed and board.',
    options: [{ label: 'Set them to cutting stone', give: { food: -40 }, get: { stone: 150 } }, { label: 'Have them train apprentices', get: { knowledge: 150 } }] },
  { id: 'comet', minEra: 4, title: 'A Comet', text: 'A bright tail hangs over the hills for a week. Nobody sleeps; everybody sketches.',
    options: [{ label: 'Publish the observations', get: { knowledge: 400 } }, { label: 'Hold a night fair under it', get: { culture: 120, coin: 100 } }] },
  { id: 'inventor', minEra: 5, title: 'The Inventor', text: 'A soot-smudged engineer wants to try a new engine design and needs somewhere patient.',
    options: [{ label: 'Lend her a workshop', give: { coal: -30 }, get: { knowledge: 900 } }, { label: 'Have her tune the mills', get: { steel: 60, tools: 60 } }] },
  { id: 'migrants', minEra: 3, title: 'Word Has Spread', text: 'People have heard of a town with no walls and no quarrels. A line of carts is at the bridge.',
    options: [{ label: 'Open the doors', get: { pop: 14 } }, { label: 'Open the doors and the larder', give: { food: -60 }, get: { pop: 14, culture: 30 } }] },
];

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const DAYS_PER_SEASON = 24;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4;
// Field yield by season (spring, summer, autumn, winter).
export const FIELD_SEASON = [0.8, 1.15, 1.7, 0.15];

// Trade ledger: base value of one unit, in coin. Selling pays 60%, buying costs 150% (better with a station).
export const PRICES = { food: 0.6, wood: 0.7, stone: 0.9, brick: 1.4, ore: 1.6, tools: 3, cloth: 2.6, paper: 3.2, glass: 4, coal: 2, steel: 6 };
