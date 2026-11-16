// The people of Vesper Quay. Pure data: no DOM.
// `look` feeds the portrait rig in ui/portraits.js.

export const STATS = ['charm', 'insight', 'nerve', 'craft'];
export const STAT_INFO = {
  charm: { name: 'Charm', blurb: 'Putting people at ease, and getting them talking.', ranks: ['Tongue-tied', 'Pleasant', 'Winning', 'Disarming', 'Irresistible'] },
  insight: { name: 'Insight', blurb: 'Noticing what is there, and what ought to be.', ranks: ['Unobservant', 'Curious', 'Sharp', 'Piercing', 'Uncanny'] },
  nerve: { name: 'Nerve', blurb: 'Wet ladders, high ledges and hard questions.', ranks: ['Cautious', 'Steady', 'Bold', 'Unshakeable', 'Fearless'] },
  craft: { name: 'Craft', blurb: 'Good hands. Knots, solder, wood and wire.', ranks: ['All thumbs', 'Handy', 'Deft', 'Skilled', 'Masterly'] },
};

export const LOCATIONS = ['teahouse', 'boathouse', 'archive', 'workshop', 'bridge', 'lighthouse'];
export const SUSPECTS = ['tobias', 'ysolde', 'bram', 'pim', 'wren'];
export const TOWNSFOLK = ['odile', 'tobias', 'ysolde', 'bram', 'pim', 'wren'];

export const TRAIT_TEXT = {
  hand: { L: 'Left-handed', R: 'Right-handed' },
  build: { tall: 'Tall', small: 'Slight' },
  shoes: { nail: 'Nailed boots', felt: 'Felt soles' },
};

export const CAST = {
  odile: {
    id: 'odile', name: 'Odile Marrow', short: 'Odile', role: 'Keeper of the Steeping Heron',
    color: '#b56a8c', home: 'teahouse', haunts: ['bridge', 'archive'],
    about: 'Your landlady. Dry as a cracker, kind by stealth, and impossible to lie to before her second cup.',
    gates: { 3: ['charm', 2], 5: ['insight', 3] },
    look: {
      skin: '#d9a57c', head: 'round', hair: 'bun', hairColor: '#cfc9d6', brow: '#8d8796',
      outfit: 'shawl', outfitColor: '#7a3f66', outfit2: '#e9c46a', glasses: 'half', earrings: '#58b6a6', age: 2, lips: '#a8505e',
    },
  },
  tobias: {
    id: 'tobias', name: 'Tobias Fenn', short: 'Tobias', role: 'Boatwright, keeper of the boathouse',
    color: '#c97a4a', home: 'boathouse', haunts: ['workshop', 'bridge'],
    about: 'Speaks in short planks. Apologises to boats, never to people. Holds the only key to the boathouse.',
    traits: { hand: 'L', build: 'tall', shoes: 'nail' },
    gates: { 3: ['nerve', 2], 5: ['craft', 3] },
    look: {
      skin: '#e2b08a', head: 'square', hair: 'cap', hairColor: '#7a3b22', brow: '#5c2c1a', beard: 'full', beardColor: '#8a4526',
      outfit: 'sweater', outfitColor: '#b4552f', outfit2: '#2f3f5c', capColor: '#2f3f5c', age: 1, lips: '#9c5546',
    },
  },
  ysolde: {
    id: 'ysolde', name: 'Ysolde Quill', short: 'Ysolde', role: 'Town archivist',
    color: '#5f7fc2', home: 'archive', haunts: ['teahouse', 'bridge'],
    about: 'Precise to the half-inch and anxious to the quarter. Says "footnote" out loud. Knows where everything is filed.',
    traits: { hand: 'R', build: 'small', shoes: 'felt' },
    gates: { 3: ['insight', 2], 5: ['charm', 3] },
    look: {
      skin: '#f3d9c4', head: 'long', hair: 'bob', hairColor: '#2a2438', brow: '#2a2438',
      outfit: 'highcollar', outfitColor: '#34447e', outfit2: '#f1e3c8', glasses: 'round', pencil: true, age: 1, lips: '#b5566a',
    },
  },
  bram: {
    id: 'bram', name: 'Bram Halloway', short: 'Bram', role: 'Lantern maker',
    color: '#d9a43a', home: 'workshop', haunts: ['teahouse', 'lighthouse'],
    about: 'Booming, generous, calls everyone "my dear". Talks to his lanterns and expects them to answer.',
    traits: { hand: 'R', build: 'tall', shoes: 'felt' },
    gates: { 3: ['craft', 2], 5: ['nerve', 3] },
    look: {
      skin: '#8b5a3c', head: 'wide', hair: 'bald', hairColor: '#efe9df', brow: '#efe9df', beard: 'walrus', beardColor: '#f2ece2',
      outfit: 'apron', outfitColor: '#d8a236', outfit2: '#6b4630', goggles: true, age: 2, lips: '#6e3a30',
    },
  },
  pim: {
    id: 'pim', name: 'Pim Okoro', short: 'Pim', role: "Lamplighter's apprentice",
    color: '#3fa7a0', home: 'bridge', haunts: ['lighthouse', 'boathouse'],
    about: 'Nineteen, quick as a rumour, and the source of most of them. Calls you "New Tea".',
    traits: { hand: 'L', build: 'small', shoes: 'nail' },
    gates: { 3: ['charm', 2], 5: ['nerve', 3] },
    look: {
      skin: '#a86c48', head: 'heart', hair: 'curls', hairColor: '#2b1d1a', brow: '#2b1d1a',
      outfit: 'jacket', outfitColor: '#2f8f8a', outfit2: '#ef8d6b', freckles: true, age: 0, lips: '#8c463e',
    },
  },
  wren: {
    id: 'wren', name: 'Wren Castellane', short: 'Wren', role: 'Keeper of the Gull Rock light',
    color: '#8d8fb5', home: 'lighthouse', haunts: ['teahouse', 'archive', 'boathouse'],
    about: 'Everyone calls her Captain. Deadpan teller of enormous sea stories. Notices everything from up there.',
    traits: { hand: 'R', build: 'tall', shoes: 'nail' },
    gates: { 3: ['nerve', 2], 5: ['insight', 3] },
    look: {
      skin: '#eac1a4', head: 'oval', hair: 'crop', hairColor: '#f1eee8', brow: '#b9b4ac',
      outfit: 'peacoat', outfitColor: '#28365a', outfit2: '#d8b25a', captainCap: true, age: 2, lips: '#a2584e',
    },
  },
  // Not a bond character; appears in the intro and the finale.
  mayor: {
    id: 'mayor', name: 'Mayor Hespera Vance', short: 'The Mayor', role: 'Mayor of Vesper Quay',
    color: '#c2564f',
    look: {
      skin: '#f0cdb0', head: 'oval', hair: 'updo', hairColor: '#a8442e', brow: '#7b3222',
      outfit: 'chain', outfitColor: '#7c2f3a', outfit2: '#e2bd5c', age: 1, lips: '#b24a4a',
    },
  },
};

export const EXPRESSIONS = ['neutral', 'happy', 'worried', 'surprised', 'thinking', 'sly'];
