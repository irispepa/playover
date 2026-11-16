// Patch & Kettle: content tables for people, facts, threads, events and improvements. No DOM here.

export const CAMPAIGN_DAYS = 15;          // working days before the Open Day
export const OPEN_DAY = CAMPAIGN_DAYS + 1;
export const WEEK = 5;

// Rooms are indexed bottom-up, left then right: 0 bakery, 1 plants, 2 robotics, 3 tailor, 4 zine, 5 chess, 6 radio, 7 translator.
export const TENANTS = [
  {
    id: 'bea', name: 'Bea', full: 'Bea Okafor', place: 'Crumb & Co. back office', room: 0, color: '#f2a65a',
    device: 'order tablet', doc: 'bread orders',
    look: { skin: '#8a5a3c', hair: '#2a1b14', style: 'bun', top: '#e9825f', acc: 'apron', cheeks: '#c9603f' },
    words: ['sourdough', 'cinnamon', 'salsa', 'crumb', 'rye', 'proving', 'gerald', 'crossword'],
    greet: ['Morning, love! Mind the flour.', 'Oh good, it is you. I saved you a crust.', 'Hello, hello. Do not look at the state of this desk.'],
    thanks: ['You are a marvel. Take a bun. Take two.', 'Sorted before the second proof! Bless you.', 'That is the best thing to happen in here since butter.'],
    gift: { id: 'gift_knot', name: 'Cinnamon knot', desc: 'From Bea. Still warm, somehow, every single day.' },
  },
  {
    id: 'fern', name: 'Fern', full: 'Fern Castellanos', place: 'Leaf Lending plant shop', room: 1, color: '#7cc79a',
    device: 'till laptop', doc: 'plant care cards',
    look: { skin: '#e9bd92', hair: '#a6522e', style: 'braid', top: '#6fae7f', acc: 'dungarees', cheeks: '#e58f72' },
    words: ['moss', 'monstera', 'wren', 'clay', 'drizzle', 'sprout', 'kiln', 'fiddlehead'],
    greet: ['Hi! Careful, that one bites. Kidding. Mostly.', 'Oh, hello. I was just telling the ferns about you.', 'Welcome to the jungle. It is very gentle.'],
    thanks: ['You are a ray of indirect sunlight.', 'Thank you! The pothos already looks relieved.', 'Brilliant. Take a cutting, it likes you.'],
    gift: { id: 'gift_cactus', name: 'Tiny cactus', desc: 'From Fern. Its name is Colin and it needs nothing from you.' },
  },
  {
    id: 'juno', name: 'Juno', full: 'Juno Park', place: 'Bolt Club robotics', room: 2, color: '#f6c445', kid: true,
    device: 'club laptop', doc: 'robot blueprints',
    look: { skin: '#f3cfa6', hair: '#22202a', style: 'bob', top: '#f6c445', acc: 'goggles', cheeks: '#f08f7a' },
    words: ['solder', 'synth', 'servo', 'resistor', 'whiskers', 'gizmo', 'beep', 'sprocket'],
    greet: ['Hi! Do not step on Gary. Gary is the small robot.', 'You came! Okay so, technically, nothing exploded.', 'Hello! I am twelve and three quarters and I have a question.'],
    thanks: ['YES. You are officially an honorary Bolt.', 'That was so cool. Can you show me how you did it?', 'Thanks! Gary says thanks too. Gary says beep.'],
    gift: { id: 'gift_bolt', name: 'Honorary Bolt badge', desc: 'From Juno. A hex nut on a ribbon. It blinks.' },
  },
  {
    id: 'vogel', name: 'Mr Vogel', full: 'Anselm Vogel', place: 'A Stitch in Time, tailor', room: 3, color: '#9db4d9', elder: true,
    device: 'beige computer', doc: 'measurements book',
    look: { skin: '#f0cfb4', hair: '#f4f1ec', style: 'bald', top: '#7e8fb0', acc: 'tape', cheeks: '#e7a08c', glasses: 'round', moustache: true },
    words: ['tango', 'bobbin', 'aria', 'thimble', 'velvet', 'brunhilde', 'waltz', 'hemline'],
    greet: ['Ah. The young technician. Do come in.', 'Good day. I have made tea, and a mistake.', 'Welcome. Please excuse Brunhilde, she is temperamental.'],
    thanks: ['Impeccable work. A clean seam.', 'Wonderful. You have the patience of a hand-stitched hem.', 'I am obliged to you. Truly.'],
    gift: { id: 'gift_pin', name: 'Pincushion tomato', desc: 'From Mr Vogel. Hand-stitched, with your initials underneath.' },
  },
  {
    id: 'pip', name: 'Pip', full: 'Pip Aldana', place: 'Staple Hearts zine press', room: 4, color: '#f08aa6',
    device: 'layout laptop', doc: 'zine proofs',
    look: { skin: '#c88f66', hair: '#3fb7a8', style: 'quiff', top: '#3a3340', acc: 'pin', cheeks: '#d9735f' },
    words: ['staple', 'riso', 'collage', 'margin', 'glue', 'zine', 'ink', 'halftone'],
    greet: ['Hey hey. Mind the wet ink.', 'Oh nice, the cavalry. Want a sticker?', 'Hi! Everything is fine and also on fire. Metaphorically.'],
    thanks: ['Legend. You are getting a thank-you page in issue nine.', 'That ruled. Sticker for you. No, two stickers.', 'Yes! Deadline survived. I owe you a zine.'],
    gift: { id: 'gift_zine', name: 'Staple Hearts no. 8', desc: 'From Pip. A zine about the house. You are on page four, drawn kindly.' },
  },
  {
    id: 'dot', name: 'Dot', full: 'Dorothea Whitlow', place: 'The Knight Owls chess club', room: 5, color: '#c3a7e8', elder: true,
    device: 'club computer', doc: 'tournament ladder',
    look: { skin: '#7c5038', hair: '#e6e2ea', style: 'perm', top: '#b79be0', acc: 'pearls', cheeks: '#b85f4a', glasses: 'cat' },
    words: ['knight', 'gambit', 'biscuit', 'rook', 'endgame', 'cosy', 'urn', 'fianchetto'],
    greet: ['There you are, dear. Sit, sit.', 'Hello, petal. I have been losing to a computer.', 'Come in! We have shortbread and a problem.'],
    thanks: ['Checkmate, as they say. Thank you, dear.', 'Oh, you clever thing. Have the good biscuit.', 'Lovely. I shall tell everyone. I tell everyone everything.'],
    gift: { id: 'gift_cosy', name: 'Knitted mug cosy', desc: 'From Dot. Marigold yellow, with a small knitted rook.' },
  },
  {
    id: 'rashid', name: 'Rashid', full: 'Rashid Mirza', place: 'Marigold FM 87.9', room: 6, color: '#f27d6b',
    device: 'studio computer', doc: 'running order',
    look: { skin: '#b17a52', hair: '#241a17', style: 'short', top: '#e0a530', acc: 'headphones', cheeks: '#c9684f', beard: true },
    words: ['vinyl', 'jingle', 'crackle', 'groove', 'antenna', 'static', 'hum', 'b-side'],
    greet: ['You are listening to Marigold FM, and I am listening to an error beep.', 'Friend! Come in, we are off air. Sadly.', 'Hello! Excuse the mess, it is all load-bearing.'],
    thanks: ['And we are back! That deserves a dedication.', 'Beautiful. You, my friend, are in tune.', 'Fixed! I would say that went without a glitch.'],
    gift: { id: 'gift_tape', name: 'Mixtape for IT', desc: 'From Rashid. Side A: Songs to Reboot To. Side B: more of those.' },
  },
  {
    id: 'ilse', name: 'Ilse', full: 'Ilse Novak', place: 'Translator, top floor', room: 7, color: '#7f8fd6',
    device: 'laptop', doc: 'manuscript',
    look: { skin: '#f6dccb', hair: '#d9c58f', style: 'messy', top: '#3d4a7a', acc: 'pencil', cheeks: '#eba896', glasses: 'round' },
    words: ['comet', 'lisbon', 'midnight', 'verb', 'owl', 'comma', 'saudade', 'telescope'],
    greet: ['Oh. Is it daytime? Come in, quietly.', 'Good morning. Or evening. I have lost track.', 'Hello. I was awake anyway. I am always awake anyway.'],
    thanks: ['Thank you. In four languages, if you like.', 'Perfect. The deadline and I are both grateful.', 'Wonderful. I shall sleep well. Tomorrow, probably.'],
    gift: { id: 'gift_star', name: 'Star chart bookmark', desc: 'From Ilse. Tonight\'s sky, annotated in tiny handwriting.' },
  },
];

export const TENANT_BY_ID = Object.fromEntries(TENANTS.map((t) => [t.id, t]));

// Facts: what a person needs, offers or loves. Revealed one at a time by chatting.
// `say` is how they let it slip; `text` is what lands in your notebook.
export const FACTS = {
  // Bea
  bea_menu: { t: 'bea', kind: 'need', text: 'Needs a proper menu board', say: 'My menu is a napkin taped to the door. A nice napkin! But still a napkin.' },
  bea_nightbake: { t: 'bea', kind: 'offer', text: 'Bakes at 4 a.m., always has spare loaves', say: 'I am in at four every morning, and there is always a loaf or two going spare.' },
  bea_salsa: { t: 'bea', kind: 'love', text: 'Loves to dance, nobody to dance with', say: 'I used to dance salsa every Thursday. These days I mostly cha-cha with the mixer.' },
  bea_tasters: { t: 'bea', kind: 'need', text: 'Needs honest taste-testers', say: 'I am trying a cardamom thing. I need people who will tell me the truth about it.' },
  bea_gerald: { t: 'bea', kind: 'love', text: 'Her sourdough starter is called Gerald', say: 'Say hello to Gerald. He is the starter. He is eleven and very bubbly.' },
  bea_crossword: { t: 'bea', kind: 'love', text: 'Does the crossword in flour on the bench', say: 'I do the crossword on the bench, in flour. You cannot rub out ink, can you?' },
  // Fern
  fern_water: { t: 'fern', kind: 'need', text: 'Needs help remembering to water 212 plants', say: 'There are two hundred and twelve plants here, and one of me, and one watering can.' },
  fern_word: { t: 'fern', kind: 'need', text: 'Needs people to know the shop exists', say: 'Half the street thinks this is a very overgrown storage room. I need to get the word out.' },
  fern_sky: { t: 'fern', kind: 'love', text: 'Loves the night sky, has never seen Saturn', say: 'I have always wanted to see Saturn properly. The rings, you know? Just once.' },
  fern_moss: { t: 'fern', kind: 'love', text: 'Is growing moss on purpose', say: 'People scrape moss off things. I am growing it on things. We are not the same.' },
  fern_pots: { t: 'fern', kind: 'offer', text: 'Throws wobbly pots on a wheel', say: 'I make my own pots. They wobble. I call it character.' },
  fern_talk: { t: 'fern', kind: 'love', text: 'Reads the weather forecast to the ferns', say: 'I read the forecast aloud each morning. The ferns like to be prepared.' },
  // Juno
  juno_synth: { t: 'juno', kind: 'offer', text: 'Built a synthesiser from a biscuit tin', say: 'I built a synth out of a biscuit tin! It makes fourteen sounds. Twelve are good.' },
  juno_sensors: { t: 'juno', kind: 'offer', text: 'Has a drawer of sensors and loves a gadget job', say: 'I have a whole drawer of sensors. Light, damp, wobble. I just need something to sense.' },
  juno_capes: { t: 'juno', kind: 'need', text: 'Needs dust covers (capes) for the robots', say: 'The robots get dusty at night. They need covers. Or, and hear me out, capes.' },
  juno_chess: { t: 'juno', kind: 'need', text: 'Needs someone to teach Rook-E the robot chess', say: 'I built a chess robot called Rook-E, but I only know how the horse moves.' },
  juno_logo: { t: 'juno', kind: 'need', text: 'Needs a logo for Bolt Club', say: 'Bolt Club has no logo. I drew one, but it looks like a sad potato.' },
  juno_room: { t: 'juno', kind: 'offer', text: 'The club room sits empty on school days', say: 'We only use the club room after school. All day it just sits there being empty.' },
  juno_cats: { t: 'juno', kind: 'love', text: 'Is building Kettle a robot friend', say: 'I am building Kettle a friend. It is a box with ears. He ignores it, so it is going well.' },
  // Mr Vogel
  vogel_patterns: { t: 'vogel', kind: 'need', text: 'Needs sixty years of paper patterns kept safe', say: 'Sixty years of patterns, all on paper, all in one drawer. One spilled tea from oblivion.' },
  vogel_sewing: { t: 'vogel', kind: 'offer', text: 'Will sew anything for anyone who asks nicely', say: 'I will happily sew for anyone. Curtains, costumes. Nobody asks for costumes any more.' },
  vogel_tango: { t: 'vogel', kind: 'love', text: 'Loves to dance, no partner since 1998', say: 'I danced the tango, once. The shoes are still in the cupboard. They are patient.' },
  vogel_opera: { t: 'vogel', kind: 'love', text: 'Adores opera, owns no record player', say: 'I hum Puccini while I hem. I have not heard it on a real record in years.' },
  vogel_grand: { t: 'vogel', kind: 'love', text: 'His granddaughter Mina lives in Wellington', say: 'My granddaughter Mina lives in Wellington. She is nine. She has opinions about buttons.' },
  vogel_machine: { t: 'vogel', kind: 'love', text: 'His 1952 sewing machine is named Brunhilde', say: 'This is Brunhilde. 1952. She has outlived three computers and intends to outlive this one.' },
  // Pip
  pip_print: { t: 'pip', kind: 'offer', text: 'Has a scanner and a riso printer, loves an archive', say: 'I have got a scanner and a riso that prints in two colours. I will scan anything flat.' },
  pip_stories: { t: 'pip', kind: 'need', text: 'Needs real stories for the next zine', say: 'Issue nine is called Before the Internet and I have nobody to interview. I am thirty.' },
  pip_design: { t: 'pip', kind: 'offer', text: 'Designs posters, signs and logos for fun', say: 'I will design anything. Posters, signs, logos. I once made a logo for a sandwich.' },
  pip_translate: { t: 'pip', kind: 'need', text: 'Needs the zine translated for readers abroad', say: 'Someone in Porto ordered forty zines. Forty! They cannot read a word of it. I need a translator.' },
  pip_staplers: { t: 'pip', kind: 'love', text: 'Collects long-arm staplers', say: 'This is my fourth long-arm stapler. Yes, they have names. No, I will not tell you.' },
  pip_band: { t: 'pip', kind: 'love', text: 'Plays bass in a band called Margin Error', say: 'My band is called Margin Error. We have one song and it is eleven minutes long.' },
  // Dot
  dot_opponents: { t: 'dot', kind: 'need', text: 'Needs new chess opponents for the club', say: 'We have all played each other four hundred times. We need fresh opponents, dear.' },
  dot_tales: { t: 'dot', kind: 'offer', text: 'Has a tall tale for every year since 1961', say: 'Did I tell you about the time I won a goat at chess? I have a story for every year.' },
  dot_chess: { t: 'dot', kind: 'offer', text: 'Will teach chess to anything with a pulse', say: 'I taught the postman, the vicar and a parrot. I will teach anybody chess.' },
  dot_hungry: { t: 'dot', kind: 'offer', text: 'The club is twelve hungry, opinionated people', say: 'There are twelve of us, always peckish, and not one has ever kept an opinion to themselves.' },
  dot_room: { t: 'dot', kind: 'need', text: 'Needs a bigger room on tournament days', say: 'On tournament days we play in the corridor. Reg had to castle on a radiator.' },
  dot_knit: { t: 'dot', kind: 'love', text: 'Knits a tea cosy for everything', say: 'I knitted a cosy for the teapot. Then the urn. Then the router. It looked cold.' },
  dot_pen: { t: 'dot', kind: 'love', text: 'Does the crossword in pen', say: 'I do the crossword in pen, dear. Life is short.' },
  // Rashid
  rashid_jingle: { t: 'rashid', kind: 'need', text: 'Needs a jingle for Marigold FM', say: 'Every station needs a jingle. Ours is me going "ding". I need a real one.' },
  rashid_script: { t: 'rashid', kind: 'need', text: 'Needs a script for a radio play', say: 'I want to put on a radio play. Thunder, doors, the lot. I just have no script.' },
  rashid_airtime: { t: 'rashid', kind: 'offer', text: 'Has hours of airtime to give away', say: 'I have nine hours of airtime a day and about forty minutes of things to say.' },
  rashid_vinyl: { t: 'rashid', kind: 'offer', text: 'Owns two thousand records, opera included', say: 'Two thousand records back there. Jazz, opera, one of whale song. Nobody ever asks.' },
  rashid_puns: { t: 'rashid', kind: 'love', text: 'Keeps a notebook of puns', say: 'I keep a pun notebook. Volume six. Would you like to hear one? Too late, here it comes.' },
  rashid_boiler: { t: 'rashid', kind: 'love', text: 'Records the sounds of the house', say: 'I record the house. The boiler, the stairs. The third stair is a perfect B flat.' },
  // Ilse
  ilse_porto: { t: 'ilse', kind: 'offer', text: 'Pen pals with a chess club in Porto', say: 'I translate letters for a chess club in Porto. Lovely people. They keep asking for a match.' },
  ilse_bread: { t: 'ilse', kind: 'need', text: 'Works all night and forgets to eat', say: 'I work until dawn, and then realise dinner was a peppermint. Nothing is open at four.' },
  ilse_plays: { t: 'ilse', kind: 'offer', text: 'Has a drawer of plays she wrote for fun', say: 'I write little plays when I cannot sleep. A drawer full. Nobody has ever read one aloud.' },
  ilse_telescope: { t: 'ilse', kind: 'offer', text: 'Keeps a telescope by the window', say: 'That? A telescope. Saturn is lovely this month. I never have anyone to show.' },
  ilse_translate: { t: 'ilse', kind: 'offer', text: 'Translates five languages, bored of manuals', say: 'Five languages, and all anyone sends me is dishwasher manuals. I long for something fun.' },
  ilse_tea: { t: 'ilse', kind: 'love', text: 'Has a 3 a.m. tea ritual', say: 'Three o\'clock is tea o\'clock. The house is so quiet you can hear the server purr.' },
};

// Preferred reveal order for the first facts (the rest are shuffled per run).
export const FIRST_FACT = { rashid: 'rashid_jingle', juno: 'juno_synth' };

// Threads: an introduction between two people based on a pair of facts.
// project: a mini-game type that has to be set up first. perk: a small permanent effect.
export const THREADS = [
  {
    id: 'jingle', a: 'rashid_jingle', b: 'juno_synth', title: 'The Marigold FM jingle', always: true,
    scene: [['rashid', 'A synth? From a biscuit tin? Play me something.'], ['juno', 'This is sound nine. It goes BWAAAM.'], ['rashid', 'That is the most beautiful BWAAAM I have ever heard.'], ['juno', 'I can make it go "Ma-ri-gold" if I hold two buttons!'], ['rashid', 'Kid, you are hired. The pay is biscuits.']],
    perk: { gw: 1, text: 'On-air shout-outs: +1 goodwill every morning' }, decor: 'onair',
    after: 'The jingle plays every hour. Dot hums it on the stairs.',
  },
  {
    id: 'videochess', a: 'dot_opponents', b: 'ilse_porto', title: 'Chess by video with Porto', project: 'videocall',
    projectName: 'Set up the big screen for the Porto match',
    scene: [['dot', 'A whole club? In Portugal? Who have not heard any of my stories?'], ['ilse', 'They are called the Porto Rooks. They are very excited.'], ['dot', 'How does one say "prepare to lose, dear" in Portuguese?'], ['ilse', 'I will write it on a card for you.']],
    perk: { gw: 1, text: 'Porto postcards: +1 goodwill every morning' }, decor: 'bigscreen',
    after: 'Tuesdays are Porto days. The score stands at 6 all.',
  },
  {
    id: 'patterns', a: 'vogel_patterns', b: 'pip_print', title: 'The pattern archive', project: 'desktop',
    projectName: 'Build a shared drive for the scanned patterns',
    scene: [['pip', 'Sixty years of sewing patterns? Hand-drawn? Can I touch them?'], ['vogel', 'With clean hands. And reverence.'], ['pip', 'I will scan every one. And then, a zine. "Cut on the Fold".'], ['vogel', 'I should like that very much.']],
    perk: { budget: 2, text: 'Pattern zine sales: +2 budget every morning' }, decor: 'patternwall',
    after: 'The patterns are scanned, backed up, and framed along the stairs.',
  },
  {
    id: 'stories', a: 'pip_stories', b: 'dot_tales', title: 'Before the Internet, issue nine',
    scene: [['pip', 'I need stories from before the internet.'], ['dot', 'Dear, I have stories from before the telephone was any good.'], ['pip', 'Did you really win a goat at chess?'], ['dot', 'Put the kettle on. This will take a while.']],
    perk: { fact: true, text: 'Dot\'s gossip column: now and then you learn something new about a neighbour' }, decor: 'zinerack',
    after: 'Issue nine sold out. The goat story runs to three pages.',
  },
  {
    id: 'menu', a: 'bea_menu', b: 'pip_design', title: 'A menu worth reading',
    scene: [['pip', 'Your menu is a napkin.'], ['bea', 'It is a good napkin!'], ['pip', 'Give me one night, two colours of ink and a cinnamon knot.'], ['bea', 'Make it two knots and add a little drawing of Gerald.']],
    perk: { budget: 2, text: 'Busy bakery: +2 budget every morning' }, decor: 'menuboard',
    after: 'The new menu board has a queue. Gerald is on it, smiling.',
  },
  {
    id: 'waterbot', a: 'fern_water', b: 'juno_sensors', title: 'The thirsty-plant alarm', project: 'wifi',
    projectName: 'Get the damp sensors online in the plant shop',
    scene: [['juno', 'So each pot gets a damp sensor, and when it is thirsty it goes beep.'], ['fern', 'Two hundred and twelve beeps?'], ['juno', 'Okay. A light. A small polite light.'], ['fern', 'A small polite light. You are a genius, Juno.']],
    perk: { mood: 4, text: 'Greenery on every floor: the whole house feels cozier' }, decor: 'plants',
    after: 'Small polite lights glow in the pots. Nothing has wilted since.',
  },
  {
    id: 'nightloaf', a: 'ilse_bread', b: 'bea_nightbake', title: 'The four o\'clock loaf',
    scene: [['bea', 'You are awake at four? I am awake at four!'], ['ilse', 'I thought I was the only one in the building.'], ['bea', 'I will leave a warm loaf on the stairs. Every morning.'], ['ilse', 'And I shall leave you a poem. Translated, if you like.']],
    perk: { hours: 1, text: 'A warm bun on your desk: +1 hour every day' }, decor: 'breadbasket',
    after: 'There is a basket on the landing at dawn. It is never empty and never full.',
  },
  {
    id: 'capes', a: 'juno_capes', b: 'vogel_sewing', title: 'Capes for robots',
    scene: [['juno', 'They are dust covers. Technically.'], ['vogel', 'They are capes, young lady, and they shall have proper linings.'], ['juno', 'Can Gary have a red one?'], ['vogel', 'Gary shall have crimson velvet. Stand still, Gary.']],
    perk: { gw: 1, text: 'The best-dressed robots in town: +1 goodwill every morning' }, decor: 'robotcape',
    after: 'Gary has a crimson cape. Rook-E has a waistcoat.',
  },
  {
    id: 'script', a: 'rashid_script', b: 'ilse_plays', title: 'A play for the radio',
    scene: [['rashid', 'A drawer of plays? Unperformed? That is a crime against radio.'], ['ilse', 'They are small. Odd. One is about a lighthouse keeper and a moth.'], ['rashid', 'I can do a moth. Listen. Fffft. Fffft.'], ['ilse', 'That is, annoyingly, exactly how I imagined it.']],
    perk: { gw: 1, text: 'Friday night drama: +1 goodwill every morning' }, decor: 'scripts',
    after: 'The Lighthouse and the Moth airs on Fridays. People write in.',
  },
  {
    id: 'plantspot', a: 'fern_word', b: 'rashid_airtime', title: 'Plant of the week',
    scene: [['rashid', 'A weekly plant segment. I can hear it already.'], ['fern', 'On the radio? But you cannot see a plant on the radio.'], ['rashid', 'So you describe it. Lovingly.'], ['fern', 'This week: the rubber plant. Glossy. Dependable. A bit smug.']],
    perk: { budget: 2, text: 'Plant shop customers: +2 budget every morning' }, decor: 'plantradio',
    after: 'Plant of the Week has fan mail. The smug rubber plant sold in an hour.',
  },
  {
    id: 'dance', a: 'vogel_tango', b: 'bea_salsa', title: 'Thursday dance hour',
    scene: [['bea', 'You dance? I had no idea you danced!'], ['vogel', 'Not since 1998. I may creak.'], ['bea', 'I creak too. We shall creak in time.'], ['vogel', 'Then, Thursday. The hallway has excellent floorboards.']],
    perk: { mood: 4, text: 'Music in the hallway: the whole house feels cozier' }, decor: 'dancefloor',
    after: 'On Thursdays the hallway smells of bread and sounds like a tango.',
  },
  {
    id: 'robotchess', a: 'juno_chess', b: 'dot_chess', title: 'Rook-E learns chess',
    scene: [['dot', 'So this is the famous robot. Does it take sugar?'], ['juno', 'It takes double-A batteries.'], ['dot', 'Lesson one, Rook-E. Never trust a bishop.'], ['juno', 'It is writing that down! It is actually writing that down!']],
    perk: { gw: 1, text: 'Robot versus Owls: +1 goodwill every morning' }, decor: 'rooke',
    after: 'Rook-E has beaten Reg twice. Reg demands a rematch.',
  },
  {
    id: 'stargaze', a: 'fern_sky', b: 'ilse_telescope', title: 'Saturn from the roof',
    scene: [['ilse', 'Look just there. Left of the chimney.'], ['fern', 'Oh. Oh! It has rings. It really has rings.'], ['ilse', 'It always has. It is nice to have someone to tell.'], ['fern', 'I am bringing a blanket and a flask next time.']],
    perk: { mood: 4, text: 'Rooftop stargazers: the whole house feels cozier' }, decor: 'telescope',
    after: 'There is a telescope on the roof now, and two folding chairs.',
  },
  {
    id: 'tasters', a: 'bea_tasters', b: 'dot_hungry', title: 'The Tuesday tasting panel',
    scene: [['bea', 'I need people who will be honest about cardamom.'], ['dot', 'Dear, Reg once sent back a wedding cake.'], ['bea', 'Perfect. Tuesdays. I shall bring a tray and a thick skin.'], ['dot', 'Bring two trays.']],
    perk: { gw: 1, text: 'Free test bakes for the club: +1 goodwill every morning' }, decor: 'cakestand',
    after: 'The cardamom bun got nine out of ten. Reg gave it a six, which is high for Reg.',
  },
  {
    id: 'bilingual', a: 'pip_translate', b: 'ilse_translate', title: 'Staple Hearts, em português',
    scene: [['pip', 'It is a zine about staplers and feelings. Is that translatable?'], ['ilse', 'Feelings, yes. Staplers will need a footnote.'], ['pip', 'So you will do it?'], ['ilse', 'It is the first thing all year that is not a dishwasher manual. Yes.']],
    perk: { budget: 2, text: 'Zines to Porto: +2 budget every morning' }, decor: 'airmail',
    after: 'Forty zines went to Porto. They wrote back asking for forty more.',
  },
  {
    id: 'opera', a: 'vogel_opera', b: 'rashid_vinyl', title: 'Opera hour', project: 'cables',
    projectName: 'Wire the old turntable into the mixing desk',
    scene: [['rashid', 'Puccini? I have four Puccinis. Pick one.'], ['vogel', 'You have La Boheme. On vinyl. In this building.'], ['rashid', 'Sunday at six, you choose the record, I press play.'], ['vogel', 'I shall wear the good waistcoat.']],
    perk: { mood: 4, text: 'Sunday opera drifting down the stairs: the house feels cozier' }, decor: 'gramophone',
    after: 'Sunday at six, the whole house goes quiet for the aria.',
  },
  {
    id: 'stickers', a: 'juno_logo', b: 'pip_design', title: 'A logo for Bolt Club',
    scene: [['pip', 'Show me the sad potato.'], ['juno', 'It is meant to be a lightning bolt with a face.'], ['pip', 'Okay. It has heart. Let us keep the face.'], ['juno', 'Can it be on stickers? Can everything be stickers?']],
    perk: { gw: 1, text: 'Stickers on every door: +1 goodwill every morning' }, decor: 'stickers',
    after: 'There is a bolt-with-a-face sticker on every door, and on Kettle\'s bowl.',
  },
  {
    id: 'roomshare', a: 'dot_room', b: 'juno_room', title: 'One room, two clubs', project: 'calendar',
    projectName: 'Work out a room-share timetable',
    scene: [['dot', 'You have a whole room going spare at eleven in the morning?'], ['juno', 'We are at school! You can have it, if you do not touch Gary.'], ['dot', 'I would not dream of touching Gary.'], ['juno', 'Okay. You can touch Gary a little bit.']],
    perk: { hours: 1, text: 'No more corridor chess: +1 hour every day' }, decor: 'sharedsign',
    after: 'The door has two signs now. Nobody has castled on a radiator since.',
  },
];

export const THREAD_BY_ID = Object.fromEntries(THREADS.map((t) => [t.id, t]));

// Events: bigger get-togethers that need threads to exist first. `needs` lists alternatives:
// every inner list is a set of threads, and any one set is enough.
export const EVENTS = [
  {
    id: 'repaircafe', title: 'The Repair Cafe', needs: [['capes', 'waterbot'], ['capes', 'patterns'], ['waterbot', 'opera']], cost: 8,
    blurb: 'Bring a broken thing, leave with a mended thing and a biscuit.',
    scene: [['juno', 'Table one is toasters. Table two is trousers.'], ['vogel', 'And table three is, apparently, a lamp shaped like a goose.'], ['fern', 'I brought the tea. And the goose lamp.'], ['juno', 'We fixed nine things! The goose honks now. It did not before.']],
    perk: { prevent: ['cables', 'printer', 'reboot'], p: 0.25, text: 'Neighbours fix small things themselves: fewer hardware tickets' }, decor: 'repairsign',
  },
  {
    id: 'radioplay', title: 'Radio Play Night', needs: [['script', 'jingle'], ['script', 'stories']], cost: 6,
    blurb: 'A live broadcast from the top floor, with sound effects by everyone.',
    scene: [['rashid', 'Live in three, two...'], ['ilse', 'The lighthouse keeper lit his lamp.'], ['dot', 'CREEEAK. That was the door. I am the door.'], ['rashid', 'And that was The Lighthouse and the Moth. Good night, Marigold Street.']],
    perk: { gw: 2, text: 'A house with an audience: +2 goodwill every morning' }, decor: 'playposter',
  },
  {
    id: 'potluck', title: 'The Stairwell Potluck', needs: [['nightloaf', 'tasters'], ['nightloaf', 'dance'], ['tasters', 'menu']], cost: 10,
    blurb: 'One long table up the stairs, and a sign-up sheet so there are not nine potato salads.',
    scene: [['bea', 'The sign-up sheet worked. Only two potato salads.'], ['dot', 'Mine is the good one.'], ['ilse', 'I have not eaten dinner with other people since March.'], ['bea', 'Then sit down, love. There is plenty.']],
    perk: { hours: 1, text: 'Leftovers for days: +1 hour every day' }, decor: 'longtable',
  },
  {
    id: 'gamenight', title: 'LAN and Board Game Night', needs: [['robotchess', 'videochess'], ['robotchess', 'roomshare'], ['videochess', 'roomshare']], cost: 8,
    blurb: 'Laptops on one table, chess boards on the other, snacks in the middle.',
    scene: [['juno', 'The network is up! Everyone can see everyone!'], ['dot', 'I do not know what a lan is, dear, but I am winning it.'], ['juno', 'Rook-E is playing Porto. Porto is nervous.'], ['dot', 'Next month, we teach them all bridge.']],
    perk: { gw: 2, text: 'Monthly game night: +2 goodwill every morning' }, decor: 'bunting',
  },
  {
    id: 'housezine', title: 'The Marigold Mail', needs: [['stories', 'menu'], ['stories', 'bilingual'], ['stories', 'stickers'], ['menu', 'stickers'], ['bilingual', 'patterns'], ['patterns', 'stories']], cost: 6,
    blurb: 'A little house newsletter, stapled by hand, with your IT tips on the back page.',
    scene: [['pip', 'Issue one. Front page: Who Keeps Leaving Loaves on the Stairs?'], ['dot', 'I wrote the gossip column. It is all true, or near enough.'], ['pip', 'And the back page is IT tips. From our very own.'], ['dot', 'Tip one: have you tried turning it off and on again, dear.']],
    perk: { preventAll: 0.12, text: 'IT tips on the back page: a few tickets of every kind sort themselves out' }, decor: 'newsletter',
  },
  {
    id: 'rooftop', title: 'The Rooftop Listening Party', needs: [['stargaze', 'opera'], ['stargaze', 'plantspot'], ['stargaze', 'jingle']], cost: 8,
    blurb: 'Blankets, a radio, a telescope, and the whole sky.',
    scene: [['rashid', 'Tonight on Marigold FM: the sky, live.'], ['fern', 'I brought nine blankets and a fern. The fern wanted to come.'], ['ilse', 'There. Saturn. Pass the telescope along.'], ['rashid', 'Listeners, you cannot see this, but trust me. It is something.']],
    perk: { mood: 6, text: 'Lights on the roof: the whole house feels cozier' }, decor: 'rooflights',
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// Improvements. cur: 'budget' or 'goodwill'. prevent: {type: probability}.
export const UPGRADES = [
  { id: 'labels', cur: 'budget', cost: 25, name: 'Label every cable', icon: 'tag', desc: 'Little coloured tags on everything. Cable tickets are easier and half as common.', prevent: { cables: 0.5 }, by: 'the labelled cables' },
  { id: 'mailfilter', cur: 'budget', cost: 35, name: 'A friendly mail filter', icon: 'mail', desc: 'Catches the princes and the prize cruises before anybody panics.', prevent: { inbox: 0.55 }, by: 'the mail filter' },
  { id: 'pwmanager', cur: 'budget', cost: 40, name: 'Password manager roll-out', icon: 'key', desc: 'One good passphrase each, and the rest remembered for them.', prevent: { password: 0.6 }, by: 'the password manager' },
  { id: 'backups', cur: 'budget', cost: 45, name: 'Nightly backups', icon: 'cloud', desc: 'Every "I deleted it" becomes a one-tap rescue and a very happy neighbour.', by: 'the backups' },
  { id: 'router', cur: 'budget', cost: 55, name: 'A router from this decade', icon: 'wifi', desc: 'Signal on every floor. Far fewer Wi-Fi tickets.', prevent: { wifi: 0.6 }, by: 'the new router' },
  { id: 'printer', cur: 'budget', cost: 60, name: 'A shared printer that works', icon: 'printer', desc: 'One good printer on the landing instead of five sad ones.', prevent: { printer: 0.6 }, by: 'the shared printer' },
  { id: 'chair', cur: 'budget', cost: 70, name: 'A properly comfy chair', icon: 'chair', desc: 'For you. Your back says thank you: +1 hour every day.', hours: 1 },
  { id: 'kettlebed', cur: 'budget', cost: 20, name: 'A bed on the warm server', icon: 'cat', desc: 'For Kettle. Petting him gives +2 goodwill, and he purrs you an extra hour more often.' },
  { id: 'volunteer', cur: 'goodwill', cost: 16, name: 'Mentor Sam, a teen volunteer', icon: 'sam', desc: 'Sam from number 9 wants to learn. Hand over one easy ticket a day (more as Sam grows).' },
  { id: 'noticeboard', cur: 'goodwill', cost: 10, name: 'A hallway noticeboard', icon: 'board', desc: 'People pin up wants and offers. Your Threads board shows who has a match waiting.' },
  { id: 'teatin', cur: 'goodwill', cost: 10, name: 'The good biscuit tin', icon: 'tea', desc: 'Your first tea break each day costs no time at all.' },
  { id: 'fairylights', cur: 'goodwill', cost: 12, name: 'Fairy lights for the stairwell', icon: 'lights', desc: 'Warm little lights on every landing. The house feels cozier.', mood: 4, decor: 'fairylights' },
  { id: 'rug', cur: 'goodwill', cost: 8, name: 'A doormat that says HELLO', icon: 'rug', desc: 'It says HELLO in seven languages. Ilse checked.', mood: 2, decor: 'rug' },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export const HATS = [
  { id: 'hat_party', name: 'Party hat', cost: 5, desc: 'Every day is somebody\'s birthday.' },
  { id: 'hat_wizard', name: 'Wizard hat', cost: 8, desc: 'For advanced sysadmin magic.' },
  { id: 'hat_bow', name: 'Marigold bow tie', cost: 6, desc: 'Formal Fridays.' },
  { id: 'hat_beret', name: 'Tiny beret', from: 'vogel', desc: 'Hand-sewn by Mr Vogel, with a proper lining.' },
  { id: 'hat_toque', name: 'Knitted bobble hat', from: 'dot', desc: 'Knitted by Dot. It has ear holes.' },
  { id: 'hat_crown', name: 'Flower crown', from: 'fern', desc: 'Woven by Fern from the trimmings.' },
  { id: 'hat_phones', name: 'Little headphones', from: 'juno', desc: 'Built by Juno. They play nothing. He likes them anyway.' },
  { id: 'hat_chef', name: 'Baker\'s hat', from: 'bea', desc: 'From Bea. Kettle is now head of quality control.' },
];
export const HAT_BY_ID = Object.fromEntries(HATS.map((h) => [h.id, h]));

export const DECOR = {
  onair: { name: 'ON AIR sign', desc: 'It glows when the jingle plays.' },
  bigscreen: { name: 'The Porto screen', desc: 'A big screen in the chess room, with a little flag.' },
  patternwall: { name: 'Framed patterns', desc: 'Mr Vogel\'s patterns, framed along the stairs.' },
  zinerack: { name: 'Zine rack', desc: 'Issue nine, by the front door. Take one.' },
  menuboard: { name: 'Menu board', desc: 'Two colours of ink and a drawing of Gerald.' },
  plants: { name: 'Plants on every floor', desc: 'With small polite lights.' },
  breadbasket: { name: 'The dawn basket', desc: 'Never empty, never full.' },
  robotcape: { name: 'Gary\'s cape', desc: 'Crimson velvet, properly lined.' },
  scripts: { name: 'Script pages', desc: 'Pinned up by the studio door.' },
  plantradio: { name: 'Studio rubber plant', desc: 'Glossy. Dependable. A bit smug.' },
  dancefloor: { name: 'Hallway dance floor', desc: 'Excellent floorboards.' },
  rooke: { name: 'Rook-E', desc: 'A chess robot in a waistcoat.' },
  telescope: { name: 'Roof telescope', desc: 'And two folding chairs.' },
  cakestand: { name: 'Tasting cake stand', desc: 'Refilled on Tuesdays.' },
  airmail: { name: 'Airmail parcels', desc: 'To Porto, with love and staples.' },
  gramophone: { name: 'The turntable', desc: 'Sunday at six.' },
  stickers: { name: 'Bolt stickers', desc: 'A lightning bolt with a face, on every door.' },
  sharedsign: { name: 'Two door signs', desc: 'Bolt Club and the Knight Owls, sharing nicely.' },
  repairsign: { name: 'Repair Cafe sign', desc: 'First Saturday of the month.' },
  playposter: { name: 'Radio play poster', desc: 'The Lighthouse and the Moth.' },
  longtable: { name: 'The long table', desc: 'It goes up the stairs.' },
  bunting: { name: 'Game night bunting', desc: 'Nobody took it down, and nobody will.' },
  newsletter: { name: 'The Marigold Mail', desc: 'Issue one, pinned by the door.' },
  rooflights: { name: 'Roof lanterns', desc: 'You can see them from the station.' },
  fairylights: { name: 'Stairwell fairy lights', desc: 'Warm little lights on every landing.' },
  rug: { name: 'HELLO doormat', desc: 'In seven languages.' },
};

export const QUIRKS = [
  { id: 'labelmaker', name: 'You own a label maker', desc: 'You arrive with every cable already labelled. You are that sort of person.' },
  { id: 'catperson', name: 'Cats like you', desc: 'Kettle lets you pet him twice a day, and purrs a little louder.' },
  { id: 'chatterbox', name: 'You are a good listener', desc: 'Tea breaks reveal two things about a neighbour instead of one.' },
  { id: 'earlybird', name: 'You are a morning person', desc: 'One extra hour every day, but you start with an empty petty-cash tin.' },
  { id: 'thrifty', name: 'You found the petty cash', desc: 'Start with a bit more budget. The old router is grumpier than usual, though.' },
];
export const QUIRK_BY_ID = Object.fromEntries(QUIRKS.map((q) => [q.id, q]));

export const WEATHER = ['Sunny, with a breeze through the stairwell', 'Drizzle on the skylight', 'Bright and cold, good tea weather', 'Soft grey, lamps on early', 'Warm enough to open every window', 'Windy, the antenna is humming', 'Fog on the street, cozy indoors', 'Golden, the whole house glows'];

export const KETTLE_SPOTS = ['server', 'desk', 'sill', 'stairs', 'roof', 'bakery', 'chess'];

export const TITLES = [
  { id: 'introducer', name: 'The Great Introducer', desc: 'You could not walk down the stairs without starting a friendship.' },
  { id: 'gardener', name: 'Gardener of Quiet Uptime', desc: 'The best ticket is the one that never needed writing.' },
  { id: 'ceremonies', name: 'Master of Ceremonies (and Cables)', desc: 'If there was a party, you ran the extension lead.' },
  { id: 'catfriend', name: 'Kettle\'s Favourite Human', desc: 'Officially. He signed something. It was a paw print.' },
  { id: 'heart', name: 'Heart of Marigold House', desc: 'The house hums, and so does everyone in it.' },
  { id: 'keeper', name: 'Keeper of the Warm Server', desc: 'Steady hands, kind words, labelled cables.' },
  { id: 'fixer', name: 'Friendly Neighbourhood Fixer', desc: 'Things break. You turn up. That is the whole job, and you are good at it.' },
];
