// Clue templates. mystery.js picks from these to assemble one consistent case per run.
// Step format (shared with every scene in the game):
//   ['n', text] narration · ['you', text] the player · ['who:expression', text] a character line.

// ---------------------------------------------------------------- traces left by the thief
export const TRAIT_CLUES = {
  hand: {
    stat: 'craft', loc: 'boathouse',
    L: {
      title: 'A left-handed knot',
      note: 'The hanging cord was unpicked, not cut, and re-tied with the turns running widdershins. Whoever took the lantern is left-handed.',
      lines: [
        ['n', 'The cord the Moon Lantern hung from is still looped over its hook. Nobody cut it. Somebody took the time to unpick the knot and tie it off again, tidy as a sampler.'],
        ['n', 'You try to copy the hitch and your fingers refuse. Every turn runs the wrong way round. You swap hands, and it falls together at once.'],
        ['you', 'A left-hander tied this.'],
      ],
    },
    R: {
      title: 'A right-handed knot',
      note: 'The hanging cord was unpicked, not cut, and re-tied with an ordinary sunwise hitch. Whoever took the lantern is right-handed.',
      lines: [
        ['n', 'The cord the Moon Lantern hung from is still looped over its hook. Nobody cut it. Somebody took the time to unpick the knot and tie it off again, tidy as a sampler.'],
        ['n', 'You copy the hitch on a spare end of line. It comes naturally, turn over turn, sunwise. The boathouse is full of knots that run the other way, and those are all Tobias\'s.'],
        ['you', 'A right-hander tied this. So not the man who ties everything else in here.'],
      ],
    },
  },
  build: {
    stat: 'insight', loc: 'boathouse',
    tall: {
      title: 'The stool nobody moved',
      note: 'The lantern hung from the high hook. The step-stool sits under the bench wearing a week of dust. Whoever lifted it down did not need the stool: someone tall.',
      lines: [
        ['n', 'The Moon Lantern hung from the high hook, a good arm\'s reach above your head. There is a step-stool for exactly that purpose.'],
        ['n', 'It is under the bench, where it has plainly been for a while. The dust on its top is as smooth as icing. Nobody has stood on it this week.'],
        ['you', 'So they reached it flat-footed. Somebody tall.'],
      ],
    },
    small: {
      title: 'The stool out of place',
      note: 'The step-stool was dragged from under the bench and left beneath the high hook, two small scuffs on its top. Whoever took the lantern needed it: someone slight.',
      lines: [
        ['n', 'The Moon Lantern hung from the high hook, a good arm\'s reach above your head. There is a step-stool for exactly that purpose.'],
        ['n', 'It is standing directly under the hook, with drag lines through the dust behind it and two small scuffs on top where somebody went up on their toes.'],
        ['you', 'They needed the stool, and then some. Not a tall person.'],
      ],
    },
  },
  shoes: {
    stat: 'nerve', loc: 'boathouse',
    nail: {
      title: 'Hobnails on the ledge',
      note: 'Along the outer ledge, where the damp never dries, are prints from nailed boots: a ring of studs at the heel. The thief wore hobnails.',
      lines: [
        ['n', 'The outer ledge runs along the boathouse wall a hand\'s width above the water. It is green, it is slick, and nobody sensible walks it.'],
        ['n', 'Somebody did. You edge out after them with your back to the planking. In the slime are prints, crisp as coins: a ring of studs at each heel.'],
        ['you', 'Nailed boots. Quay boots.'],
      ],
    },
    felt: {
      title: 'Soft prints on the ledge',
      note: 'Along the outer ledge, where the damp never dries, are smooth prints with no nail marks at all. The thief wore soft felt soles.',
      lines: [
        ['n', 'The outer ledge runs along the boathouse wall a hand\'s width above the water. It is green, it is slick, and nobody sensible walks it.'],
        ['n', 'Somebody did. You edge out after them with your back to the planking. In the slime are prints, but smooth ones: no studs, no heel-irons. Soft soles, pressed flat.'],
        ['you', 'Felt shoes, on a wet ledge. Either very brave or very used to creeping about indoors.'],
      ],
    },
  },
};

// ---------------------------------------------------------------- how it left a locked boathouse
// pos: found when this IS the method. neg: two alternative placements, found when it is NOT.
export const METHOD_INFO = {
  key: { label: 'Out through the door, with a key', short: 'By the door' },
  water: { label: 'Out by boat, through the water gate', short: 'By the water gate' },
  roof: { label: 'Up through the loft hatch, over the roof', short: 'Over the roof' },
};

export const METHOD_CLUES = {
  key: {
    pos: {
      loc: 'boathouse', stat: null, rank: 1,
      title: 'An obliging padlock',
      note: 'The padlock was opened with a key and locked again afterwards. No scratches, fresh oil in the wards. The lantern went out through the door.',
      lines: [
        ['n', 'You start with the famous lock. It is a brass padlock the size of a bun, and it is in perfect health: no scratches, no bent hasp, a bead of fresh oil in the keyhole.'],
        ['n', 'On the threshold, the dust has been swept by something wide and flat-bottomed being carried out. The door was opened like a door and locked again like a conscience.'],
        ['you', 'They used a key. And they were polite about it.'],
      ],
    },
    neg: [
      {
        loc: 'boathouse', stat: null, rank: 1,
        title: 'The wax seal',
        note: 'Tobias dabs red wax over the hasp every night, as his father did. The Mayor herself found the seal whole at dawn. Nobody came or went by the door.',
        lines: [
          ['n', 'You start with the famous lock. Under the hasp is a crumbled coin of red sealing wax, pressed with a thumb.'],
          ['n', 'A habit of the Fenns, it turns out: wax on the hasp every night, broken every morning. The Mayor watched Tobias break it at dawn. It was whole.'],
          ['you', 'So the door stayed shut all night. However the lantern left, it was not that way.'],
        ],
      },
      {
        loc: 'bridge', stat: null, rank: 1,
        title: 'The watchman\'s round',
        note: 'The night watchman tried the boathouse padlock at eleven and again at midnight and found the wax seal whole both times. Nobody used the door.',
        lines: [
          ['n', 'The night watchman keeps his book in a tin box under the bridge lamp, and is delighted that anybody wants to read it.'],
          ['n', '"Boathouse. Eleven: fast, seal whole. Midnight: fast, seal whole." He taps the page. "Fenn waxes that hasp like a letter. Nobody had that door open. Not on my round."'],
          ['you', 'Then the door is out. It went some other way.'],
        ],
      },
    ],
  },
  water: {
    pos: {
      loc: 'boathouse', stat: 'nerve', rank: 2,
      title: 'The water gate',
      note: 'Under the boathouse floor the water gate stands unchained, its weed torn and a fresh scrape of paint on the stone. The lantern left by boat.',
      lines: [
        ['n', 'There is a trap in the boathouse floor and an iron ladder below it, going down into a dark that smells of pennies. You go down it before you can think better.'],
        ['n', 'The water gate under the building should be hung with a season of weed. The weed is torn clean away at one side, and on the stone is a long fresh scrape where a gunwale kissed it.'],
        ['you', 'A boat came in underneath. Loaded from below, and out with the tide. Nobody ever touched the door.'],
      ],
    },
    neg: [
      {
        loc: 'archive', stat: 'insight', rank: 2,
        title: 'The tide tables',
        note: 'Low water fell at ten past eleven that night. Under the boathouse arch there was less than a foot of clearance: no boat could have used the water gate.',
        lines: [
          ['n', 'The harbour tide tables live in a long drawer that smells of salt and bureaucracy. You find the night, and run a finger along it.'],
          ['n', 'Low water at ten past eleven. The margin, in an old keeper\'s hand, notes the arch under the boathouse: "at springs low, a duck must bow."'],
          ['you', 'Nothing bigger than a duck went through the water gate that night. Cross that off.'],
        ],
      },
      {
        loc: 'boathouse', stat: 'nerve', rank: 2,
        title: 'A chain full of barnacles',
        note: 'The water gate under the boathouse is chained, and the chain is one solid crust of barnacles. It has not moved in years.',
        lines: [
          ['n', 'There is a trap in the boathouse floor and an iron ladder below it, going down into a dark that smells of pennies. You go down it before you can think better.'],
          ['n', 'The water gate is chained shut. You give the chain a tug and nothing happens, because it is no longer a chain: it is a single sculpture of barnacles, grown together link to link.'],
          ['you', 'Nobody has opened this since before I was born. It did not go by water.'],
        ],
      },
    ],
  },
  roof: {
    pos: {
      loc: 'boathouse', stat: 'nerve', rank: 2,
      title: 'The loft hatch',
      note: 'In the sail loft the roof hatch hangs loose, its cobwebs torn, and the pulley rope has been run fresh through the block. The lantern went up and out over the roof.',
      lines: [
        ['n', 'A ladder of nailed slats goes up to the sail loft. The third slat is missing. You go up anyway, and arrive among the rafters with your heart in your ears.'],
        ['n', 'The roof hatch hangs a finger open. The cobwebs across it are torn, and the old sail-hoist rope has been run through its block so recently that the dust lies only on one side.'],
        ['you', 'Hoisted up, and out over the tiles. Quiet as a cat with a pulley.'],
      ],
    },
    neg: [
      {
        loc: 'lighthouse', stat: null, rank: 1,
        title: 'A gull on the hatch',
        note: 'Through the lighthouse glass you can see the boathouse roof hatch: a gull has nested on it, three eggs and all, undisturbed. Nobody went out over the roof.',
        lines: [
          ['n', 'The lighthouse keeps a brass telescope on a swivel for looking at ships, weather and, by long tradition, other people\'s business.'],
          ['n', 'You swing it down to the boathouse roof. On the loft hatch, square in the middle, sits a herring gull on a nest like a dropped wig. Three eggs. She looks back at you with open contempt.'],
          ['you', 'Nobody has lifted that hatch in a month. Not over the roof, then.'],
        ],
      },
      {
        loc: 'boathouse', stat: 'nerve', rank: 2,
        title: 'A hatch painted shut',
        note: 'The roof hatch in the sail loft was painted over years ago. The paint is unbroken all the way round. Nobody went out over the roof.',
        lines: [
          ['n', 'A ladder of nailed slats goes up to the sail loft. The third slat is missing. You go up anyway, and arrive among the rafters with your heart in your ears.'],
          ['n', 'There is a roof hatch. Some long-ago Fenn painted straight over it, frame and all, in harbour green, and the skin of paint runs unbroken right round the edge.'],
          ['you', 'This has not opened in twenty years. Not the roof.'],
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------- where everyone was that night
// claim: what they say when first asked. record: a physical trace that confirms it (ok) or,
// if they are the culprit, gives it the lie (broken). witnesses: people who can vouch.
// herring: an honest but misleading sighting, explained once the alibi is confirmed.
export const ALIBIS = {
  tobias: {
    claim: {
      title: 'Tobias: "In the shed. Working."',
      note: 'Tobias says he was in the dry shed behind the lantern workshop until past midnight, "working", and will not say on what.',
      lead: 'The dry shed is behind the Workshop. Bram is next door and has good ears.',
      lines: [
        ['you', 'Where were you, the night it went?'],
        ['tobias:worried', 'Shed. Out back of Halloway\'s. Till gone midnight.'],
        ['you', 'Doing what?'],
        ['tobias:neutral', 'Working. On what\'s mine to work on.'],
      ],
    },
    herring: {
      title: 'Rumour: Tobias and the sailcloth',
      note: 'The baker saw Tobias after dark, carrying something long and awkward under sailcloth, and looking over his shoulder.',
      explained: 'It was the stem-post for a skiff he is building in secret.',
      lines: [
        ['odile:sly', 'The baker says Tobias Fenn went by her window after dark with something long under a sailcloth. Looking behind him like a man with a goose under his coat.'],
        ['odile:thinking', 'He also owes the chandler since spring. I only pour the tea, dear. I don\'t read it.'],
      ],
    },
    record: {
      loc: 'workshop', stat: null, rank: 1,
      ok: {
        title: 'The shed tally',
        note: 'In the dry shed: a half-built skiff, a floor of fresh shavings, and a chalk tally of hours with that night marked "till 1". Tobias was here, as he said.',
        lines: [
          ['n', 'Behind the workshop is a tarred shed with a door that sticks. Inside, on trestles, is the pale ribcage of a small boat nobody has mentioned to you.'],
          ['n', 'The shavings underfoot are still sweet and yellow. On the wall is a chalk tally of evenings, each with the hour he stopped. The night of the theft reads: "till 1. Garboard on."'],
          ['you', 'He was here. Planing, half the night. That is not a man with a lantern under his arm.'],
        ],
      },
      broken: {
        title: 'A gap in the tally',
        note: 'In the dry shed: a half-built skiff and a chalk tally of every evening for a month. The night of the theft is missing. The shavings are days old. Tobias was not here.',
        lines: [
          ['n', 'Behind the workshop is a tarred shed with a door that sticks. Inside, on trestles, is the pale ribcage of a small boat nobody has mentioned to you.'],
          ['n', 'On the wall is a chalk tally of evenings, one stroke a night for a month, each with the hour. There is a gap. One night has no stroke at all, and the shavings underfoot have gone grey.'],
          ['you', 'Every night but that one. He told me he was here.'],
        ],
      },
    },
    witnesses: {
      bram: {
        note: 'Bram heard Tobias\'s mallet in the dry shed until past midnight that night.',
        lines: [
          ['bram:thinking', 'Fenn? In the shed, my dear, the whole evening. I heard his mallet through the wall until past midnight. Tock, tock, tock, pause, small sorry noise.'],
          ['bram:happy', 'He apologises to the wood, you know. You cannot fake that.'],
        ],
      },
      pim: {
        note: 'Pim, on the late lamp round, saw light under the dry shed door and heard planing until midnight.',
        lines: [
          ['pim:thinking', 'Tobe? Oh, he was in his secret shed. It is not very secret. Light under the door when I did the half-eleven lamps, and that shhk-shhk noise, planing.'],
          ['pim:sly', 'Still going at midnight. I listened. Professionally.'],
        ],
      },
    },
    breakWitness: {
      who: 'bram',
      note: 'Bram says the dry shed was silent that night: the first quiet evening in a month.',
      lines: [
        ['bram:worried', 'Now that is the odd thing, my dear. Every night for a month, his mallet through my wall. Tock, tock, tock.'],
        ['bram:thinking', 'That night? Nothing. I remember, because I finally heard myself think and did not care for it.'],
      ],
    },
  },

  ysolde: {
    claim: {
      title: 'Ysolde: "Posting a parcel."',
      note: 'Ysolde says she walked to the night-post on Market Bridge with a parcel a little before eleven, then went back to the archive. She will not say what was in it.',
      lead: 'The night-post on Market Bridge keeps a ledger. Pim runs messages and sees everyone who crosses.',
      lines: [
        ['you', 'Where were you, the night it went?'],
        ['ysolde:worried', 'At the night-post. On the bridge. I had a parcel for the late barge, which leaves at eleven precisely, and then I returned to the archive. Directly.'],
        ['you', 'What was in the parcel?'],
        ['ysolde:surprised', 'Paper! Footnote: that is all I am prepared to say about it.'],
      ],
    },
    herring: {
      title: 'Rumour: Ysolde and the parcel',
      note: 'The fishmonger\'s boy saw Ysolde hurrying over the bridge that night, hugging a wrapped parcel "about the size of a lantern".',
      explained: 'The parcel was a manuscript for the night-post.',
      lines: [
        ['odile:sly', 'The fishmonger\'s boy saw Miss Quill scuttling over the bridge that night with a parcel clutched to her like a stolen baby. "About lantern-sized," he says.'],
        ['odile:thinking', 'Mind you, that boy thinks everything is about lantern-sized this week. He said it of a ham.'],
      ],
    },
    record: {
      loc: 'bridge', stat: 'charm', rank: 2,
      ok: {
        title: 'The night-post ledger',
        note: 'The postmistress\'s ledger shows a parcel from "Y. Quill", weighed and signed for at a quarter to eleven, to a publisher in the capital. Ysolde was on the bridge, as she said.',
        lines: [
          ['n', 'The night-post is a hatch in the bridge wall, and the postmistress behind it guards her ledger like a dragon with a cash-box. It takes a compliment about her handwriting and a second, better one.'],
          ['n', '"Quarter to eleven. Y. Quill. One parcel, paper, two pounds and a bit, to Thorne and Daughters, Printers." She sniffs. "Sends one every month. Blushes every time."'],
          ['you', 'Signed and weighed, in the middle of the window. She was exactly where she said.'],
        ],
      },
      broken: {
        title: 'Nothing in the ledger',
        note: 'The postmistress\'s ledger has no parcel from Ysolde that night. The late barge sailed without one. Ysolde was not at the night-post.',
        lines: [
          ['n', 'The night-post is a hatch in the bridge wall, and the postmistress behind it guards her ledger like a dragon with a cash-box. It takes a compliment about her handwriting and a second, better one.'],
          ['n', '"Quill? Not that night. First month she\'s missed." She turns the ledger round for you. Three parcels for the late barge, none of them hers. "I kept the hatch open an extra minute. She never came."'],
          ['you', 'She told me she was here. She was not.'],
        ],
      },
    },
    witnesses: {
      pim: {
        note: 'Pim saw Ysolde hand a parcel through the night-post hatch just before the eleven barge.',
        lines: [
          ['pim:happy', 'Quill? She was at the post hatch, I nearly ran her down. Handed over a parcel like it was going to bite, right before the eleven barge.'],
          ['pim:sly', 'She does it every month. Nobody knows what is in them. I have a book going, if you want odds.'],
        ],
      },
      odile: {
        note: 'Odile saw Ysolde at the night-post hatch from the tea house window, a quarter to eleven by the kitchen clock.',
        lines: [
          ['odile:neutral', 'Ysolde was at the post hatch at a quarter to eleven. I can see it from the scullery, and I was up with the kettle, waiting on your barge.'],
          ['odile:sly', 'She posts something once a month and comes back pink. I have my theories. They are none of them lanterns.'],
        ],
      },
    },
    breakWitness: {
      who: 'pim',
      note: 'Pim was on the bridge from ten until midnight and swears Ysolde never came to the night-post.',
      lines: [
        ['pim:thinking', 'That is the thing, though. I had the bridge lamps from ten till midnight, and I see everyone. Quill posts a parcel every month, regular as a bill.'],
        ['pim:worried', 'Not that night. Postmistress even held the hatch for her. I would not say it if I was not sure, New Tea.'],
      ],
    },
  },

  bram: {
    claim: {
      title: 'Bram: "At my bench."',
      note: 'Bram says he was at his bench in the workshop all night, soldering frames for the festival. People say the workshop windows were dark.',
      lead: 'The Workshop bench should show a night\'s work. Tobias\'s shed shares a wall with it.',
      lines: [
        ['you', 'Where were you, the night it went?'],
        ['bram:happy', 'At my bench, my dear, where else? Forty frames to solder before the festival and only the one of me.'],
        ['you', 'All night?'],
        ['bram:worried', 'All night. Ask the frames.'],
      ],
    },
    herring: {
      title: 'Rumour: the dark workshop',
      note: 'Bram says he worked at his bench all night, but two neighbours swear the workshop windows were black from supper on.',
      explained: 'He was working with the lamps out on purpose, teaching his hands to manage without his eyes.',
      lines: [
        ['odile:thinking', 'Bram tells everyone he was at his bench all night. Fine. Only the Pellow sisters live opposite, and they say his windows were black as a hat from supper on.'],
        ['odile:sly', 'A lantern maker, working in the dark. Either he is lying or he has found a very cheap way to do it.'],
      ],
    },
    record: {
      loc: 'workshop', stat: 'craft', rank: 2,
      ok: {
        title: 'Frames made by feel',
        note: 'On Bram\'s bench: a row of frames tagged with that night\'s date, their seams run by touch, and a folded blindfold beside them. He was working, in the dark, on purpose.',
        lines: [
          ['n', 'At the back of the bench is a row of lantern frames, each with a paper tag in Bram\'s big hand. The date is the night of the theft. A dozen of them: a full night\'s work.'],
          ['n', 'You turn one over. You know enough now to see it: the solder was not laid by eye. It was walked along the seam with a fingertip, bead by bead. Beside the row lies a folded scarf, knotted to fit a large head.'],
          ['you', 'He worked blindfold. All night, with the lamps out. So the windows were dark, and he was here all the same.'],
        ],
      },
      broken: {
        title: 'A cold bench',
        note: 'Bram\'s bench holds frames tagged for every night this month except the night of the theft. The solder pot for that night was never lit. He was not at his bench.',
        lines: [
          ['n', 'At the back of the bench is a row of lantern frames, each with a paper tag in Bram\'s big hand: one batch a night, dated, for weeks.'],
          ['n', 'You know enough now to count them properly. The night of the theft has no batch. And the little brass tally on the solder pot, one notch for every evening it is lit, skips a day.'],
          ['you', 'Forty frames to finish, and he took that night off. He told me to ask the frames. I have.'],
        ],
      },
    },
    witnesses: {
      tobias: {
        note: 'Tobias, in the shed next door, heard Bram at his bench until past midnight: hammering, and swearing at something in the dark.',
        lines: [
          ['tobias:neutral', 'Halloway was in. Heard him through the wall till past midnight. Tapping. Swearing.'],
          ['tobias:thinking', 'No light under his door, mind. Thought that was odd. Didn\'t ask. Man\'s shed is his own.'],
        ],
      },
      odile: {
        note: 'Odile took Bram his supper at eleven and found him at his bench, working in the dark. He asked her to keep it quiet.',
        lines: [
          ['odile:neutral', 'I took Bram his supper at eleven, as I do when he forgets he has a stomach. He was at his bench. In the pitch dark, with a scarf round his eyes.'],
          ['odile:worried', 'He asked me not to mention it. I am mentioning it to you because you are asking the right sort of questions. Don\'t make me sorry.'],
        ],
      },
    },
    breakWitness: {
      who: 'tobias',
      note: 'Tobias heard nothing through the wall that night: no hammer, no swearing. Bram\'s workshop was empty.',
      lines: [
        ['tobias:thinking', 'Halloway says he was at his bench? Hm.'],
        ['tobias:worried', 'I was in the shed. Share a wall. Most nights he taps and swears till late. That night, nothing. Not a sound. Don\'t like saying it.'],
      ],
    },
  },

  pim: {
    claim: {
      title: 'Pim: "Out by Gull Rock."',
      note: 'Pim says they were out past the lighthouse at the tide pool until near midnight, "minding my own business, which is a first". They came home soaked.',
      lead: 'The tide pool is under the Lighthouse. Wren sees those rocks from her lamp room.',
      lines: [
        ['you', 'Where were you, the night it went?'],
        ['pim:surprised', 'Me? Out past Gull Rock. The tide pool. Till nearly midnight.'],
        ['you', 'In the dark? Doing what?'],
        ['pim:sly', 'Minding my own business. I know. First time for everything.'],
      ],
    },
    herring: {
      title: 'Rumour: Pim, soaked to the skin',
      note: 'Pim was seen slipping home at midnight dripping wet, boots in hand. Pim, who famously will not set foot in a boat.',
      explained: 'Pim has been teaching themself to swim, at night, where nobody can watch.',
      lines: [
        ['odile:thinking', 'Old Okoro\'s child came home at midnight, that night, wet to the collar and carrying their boots. Three people saw. Pim, who won\'t step in a boat to save a shilling.'],
        ['odile:sly', 'So either it rained on one person only, or somebody went in the canal after something. I name no names. I name hardly anything.'],
      ],
    },
    record: {
      loc: 'lighthouse', stat: 'nerve', rank: 2,
      ok: {
        title: 'The cork belt',
        note: 'Hidden at the tide pool under the lighthouse: a cork float belt, a towel, and a chalk tally of "lengths" with that night marked "4 (!!)". Pim was here, learning to swim.',
        lines: [
          ['n', 'The way down to the tide pool is a goat-path over wet rock with the sea breathing on your ankles. You take it one handhold at a time.'],
          ['n', 'In a dry cleft above the pool: a cork float belt, a towel stiff with salt, and a slate. On the slate, a tally of nights. The night of the theft says: "4 lengths (!!) swallowed half the bay".'],
          ['you', 'Not a thief. A person learning to swim where nobody can laugh. And here till midnight, by the look of it.'],
        ],
      },
      broken: {
        title: 'A dry slate',
        note: 'Hidden at the tide pool: a cork belt and a slate tallying Pim\'s swimming practice night by night. The night of the theft is blank, and the towel is bone dry. Pim was not here.',
        lines: [
          ['n', 'The way down to the tide pool is a goat-path over wet rock with the sea breathing on your ankles. You take it one handhold at a time.'],
          ['n', 'In a dry cleft above the pool: a cork float belt, a folded towel, and a slate with a tally of nights. Somebody is learning to swim. But the night of the theft has no mark, and the towel has not been wet in days.'],
          ['you', 'So this is where Pim goes. Most nights. Only not that one.'],
        ],
      },
    },
    witnesses: {
      wren: {
        note: 'Wren watched Pim at the tide pool from the lamp room until near midnight, and kept a lamp in the low window in case.',
        lines: [
          ['wren:neutral', 'The Okoro child? In my tide pool, thrashing about like a dropped cat, till near midnight. I keep a lamp in the low window on those nights. In case.'],
          ['wren:sly', 'They think nobody knows. I have kept a light for forty years. I know what a person looks like when they are trying not to drown.'],
        ],
      },
      tobias: {
        note: 'Tobias lent Pim a cork float belt and saw them heading out to the tide pool at ten that night, and back, wet, at midnight.',
        lines: [
          ['tobias:neutral', 'Pim? Gull Rock pool. Went out past my slip at ten with my cork belt under their coat. Came back midnight. Wet.'],
          ['tobias:worried', 'Lent them the belt. Don\'t spread it. They can\'t swim. Yet.'],
        ],
      },
    },
    breakWitness: {
      who: 'wren',
      note: 'Wren keeps a lamp lit whenever Pim is at the tide pool. That night she never lit it: the pool was empty.',
      lines: [
        ['wren:thinking', 'The child says they were at my tide pool? Most nights, yes. I keep a lamp in the low window when they are.'],
        ['wren:worried', 'I did not light it that night. Nobody was down there. I would know. Watching is the whole of my trade.'],
      ],
    },
  },

  wren: {
    claim: {
      title: 'Wren: "Reading."',
      note: 'Wren says she trimmed the light at ten, then went "to read" until after midnight. She does not say where. The lamp-room gallery was empty.',
      lead: 'Where does a lighthouse keeper go to read? The Archive keeps candle stubs and reading slips. Ysolde locks up there.',
      lines: [
        ['you', 'Where were you, the night it went?'],
        ['wren:neutral', 'I trimmed the light at ten. Then I went to read, until after midnight.'],
        ['you', 'Read where?'],
        ['wren:sly', 'Somewhere with books. You are the detective. Detect.'],
      ],
    },
    herring: {
      title: 'Rumour: the empty gallery',
      note: 'Fishermen coming in late saw the lighthouse gallery empty that night, and a candle moving behind the archive windows long after closing.',
      explained: 'Wren lets herself into the archive at night to read the voyages. Ysolde knows.',
      lines: [
        ['odile:thinking', 'The Darrow boys came in late that night and say the Captain was not on her gallery. First time in their lives. And somebody had a candle going in the archive past eleven.'],
        ['odile:sly', 'Now, who do we know that is tall, walks about at night, and answers every question with a sea story? I am only stirring, dear.'],
      ],
    },
    record: {
      loc: 'archive', stat: 'insight', rank: 2,
      ok: {
        title: 'The reading slip',
        note: 'In the archive\'s Voyages alcove: a candle burnt to a stub and a reading slip for that night, signed "W.C.", volumes IV to VI. Wren was here, reading, till past midnight.',
        lines: [
          ['n', 'The Voyages alcove is at the far end, where the shelves lean together. On the reading table is a candle burnt down to a coin of wax, and under the candlestick, a slip.'],
          ['n', 'The archive makes you sign for everything. This slip has the night of the theft on it, three fat volumes of "Passages South", and initials in a hand like a ruled line: W.C. In: half past ten. Out: half past twelve.'],
          ['you', 'Two hours with other people\'s oceans. She was here the whole time.'],
        ],
      },
      broken: {
        title: 'An unsigned night',
        note: 'The archive\'s Voyages alcove has reading slips signed "W.C." for most nights this month, but none for the night of the theft, and that night\'s candle was never lit.',
        lines: [
          ['n', 'The Voyages alcove is at the far end, where the shelves lean together. Under the candlestick is a neat sheaf of reading slips, all in one hand like a ruled line: W.C.'],
          ['n', 'She comes most nights, then. You lay the slips out by date. There is a hole in the row. On the night of the theft nobody signed for anything, and the candle set out for that evening still has its white wick.'],
          ['you', 'She reads here. But not that night. That night she was somewhere else.'],
        ],
      },
    },
    witnesses: {
      ysolde: {
        note: 'Ysolde came back from the post at eleven and found Wren asleep in the Voyages alcove. She let her out at half past twelve.',
        lines: [
          ['ysolde:worried', 'The Captain was in the Voyages alcove. She has a key I pretend not to have given her. I returned from the post at eleven and she was asleep on volume five.'],
          ['ysolde:neutral', 'I let her out at half past twelve. Footnote: this is strictly against the reading-room rules, and I shall deny it under oath.'],
        ],
      },
      odile: {
        note: 'Odile saw Wren let herself into the archive at half past ten, and saw the candle in the Voyages alcove burn past midnight.',
        lines: [
          ['odile:neutral', 'Wren? She let herself into the archive at half past ten. I see the side door from the scullery. Her candle was in the end alcove till well past twelve.'],
          ['odile:sly', 'She has been borrowing oceans from that building for thirty years. I have never said a word. It is the nicest secret on the quay.'],
        ],
      },
    },
    breakWitness: {
      who: 'ysolde',
      note: 'Ysolde says the Voyages alcove was dark and empty that night: Wren, who reads there most evenings, never came.',
      lines: [
        ['ysolde:thinking', 'The Captain reads in the Voyages alcove most nights. I leave a candle out for her. Footnote: unofficially.'],
        ['ysolde:worried', 'That night the candle was never lit. I checked at eleven and again at midnight. I should prefer not to have noticed, but noticing is rather my whole character.'],
      ],
    },
  },
};

// ---------------------------------------------------------------- why
// Each suspect has two true-in-some-runs motives (a, b) and one cynical decoy the town believes.
// loc: the physical evidence. confidant: someone who knows the background. confession: told to a
// player who has earned it (bond 5). reveal: the paragraph used in the ending.
export const MOTIVES = {
  tobias: {
    decoy: 'He sold it to pay what he owes the chandler',
    a: {
      label: 'He cracked it by accident, and hid the damage',
      short: 'An accident he was ashamed of',
      loc: {
        loc: 'boathouse', stat: 'insight', rank: 3,
        title: 'A sliver of moon-glass',
        note: 'Between the floorboards under the high hook: a sliver of pearl-white glass, and a dent in the plank. The Moon Lantern was dropped here, and broken.',
        lines: [
          ['n', 'You get down on your knees under the high hook with a candle. There is a dent in the plank, fresh and pale, the size of a lantern\'s foot.'],
          ['n', 'And in the gap between two boards, winking, a sliver of glass the colour of the inside of a shell. Nothing else in this town is made of that.'],
          ['you', 'It fell. Somebody dropped two hundred years of moon on a boathouse floor.'],
        ],
      },
      confidant: {
        who: 'bram', bond: 3,
        note: 'The morning after the theft, Tobias asked Bram, far too casually, how one might mend very old milk-glass, "for a friend".',
        lines: [
          ['bram:thinking', 'Here is a thing I have told nobody. The morning it went, Fenn stood in my doorway turning his cap round and asked how a person might mend old milk-glass. Very old. For a friend.'],
          ['bram:worried', 'Tobias Fenn has two friends, my dear, and one of them is a boat.'],
        ],
      },
      confession: [
        ['tobias:worried', 'Got to tell somebody. Might as well be you.'],
        ['tobias:worried', 'I polish it. Night before they hang the bunting. Father did, his father did. Hook, cloth, down it comes.'],
        ['tobias:neutral', 'Hands were cold. It went through them like a fish. Hit the boards. One pane, the big one, the moon. Cracked clean across.'],
        ['you', 'So you hid it.'],
        ['tobias:worried', 'Two hundred years of Fenns never dropped it. I\'ve got it aboard the old Marigold, laid up off my slip. Sail locker. Been trying to mend it. I\'m a boatwright. I\'m making it worse.'],
        ['tobias:thinking', 'Don\'t know how to walk it back across that quay. If you think of a way, I\'d be glad of it.'],
      ],
      reveal: 'Tobias had taken the lantern down to polish it, as the Fenns have done for two centuries, and it slipped. One pane cracked from edge to edge. He could not bear to be the Fenn who broke the moon, so he hid it in the sail locker of a laid-up ketch and tried, badly, to mend it alone.',
    },
    b: {
      label: 'The boathouse roof is rotten, and he moved it to keep it safe',
      short: 'Keeping it safe from a rotten roof',
      loc: {
        loc: 'boathouse', stat: 'craft', rank: 3,
        title: 'The soft beam',
        note: 'The beam above the high hook is fresh-painted, but a thumbnail sinks into it like cake. There are bucket rings on the floor beneath. The roof over the lantern is rotten through.',
        lines: [
          ['n', 'You look where a maker would look: not at the hook, but at what the hook is screwed into. The beam is newly painted. Only that beam.'],
          ['n', 'You press a thumbnail in. It goes in like cake. Beneath, on the boards, are three pale rings where buckets have stood, and a tide-line of old drips down the wall.'],
          ['you', 'One good storm and this comes down. Lantern, hook and all. And somebody painted over it so nobody would see.'],
        ],
      },
      confidant: {
        who: 'wren', bond: 3,
        note: 'The week before the theft, Tobias asked Wren three separate times when the autumn storm would break, and looked at his roof each time.',
        lines: [
          ['wren:thinking', 'Fenn came up my stairs three times that week. Each time, the same question: when does the weather break. Not if. When.'],
          ['wren:neutral', 'I told him: festival week, from the south-west. He looked at his own roof as a man looks at a tooth he means to ignore.'],
        ],
      },
      confession: [
        ['tobias:worried', 'Got to tell somebody. Might as well be you.'],
        ['tobias:neutral', 'Roof\'s gone. Beam over the hook. Been rotten two winters. Lease says upkeep\'s mine, and I\'ve not got it. Painted over it. Put buckets out.'],
        ['tobias:worried', 'Captain says there\'s a blow coming festival week. That beam goes, the lantern goes with it. So I took it down. Put it aboard the old Marigold, laid up off my slip. Sail locker. Dry as a biscuit.'],
        ['you', 'Why not just tell them?'],
        ['tobias:worried', 'Because then they ask why. Then they see the roof. Then they give the boathouse to somebody who can afford it. Four generations of Fenns on that slip.'],
        ['tobias:thinking', 'Kept it safe and can\'t say so. If you see a way through that, I\'d be glad of it.'],
      ],
      reveal: 'The beam over the lantern hook has been rotten for two winters, and the upkeep, by the terms of the lease, is Tobias\'s to pay for. With a storm due festival week, he took the lantern down and hid it in the dry sail locker of a laid-up ketch. He could not say so without showing the council his roof, and losing the boathouse four generations of Fenns have kept.',
    },
  },

  ysolde: {
    decoy: 'She wanted it locked in the archive, where she thinks it belongs',
    a: {
      label: 'She found it may not be the true lantern, and took it to be sure',
      short: 'Testing whether the lantern is the real one',
      loc: {
        loc: 'archive', stat: 'insight', rank: 3,
        title: 'The flood inventory',
        note: 'A ledger from the flood of 1831, left open: "Moon Lantern, lost with the east quay." And beside it, in fresh pencil: "Then what have we been lighting?"',
        lines: [
          ['n', 'Somebody has been at the flood ledgers. One lies open on the high desk, weighted with a ruler: the inventory of what the great flood took, ninety years back.'],
          ['n', 'Halfway down: "Item. The Moon Lantern. Lost with the east quay." No later entry says it was found. In the margin, in sharp new pencil: "Then what have we been lighting? Check maker\'s mark. Before the speech."'],
          ['you', 'The Mayor is about to stand up and call it two hundred years old. And somebody in this building is not sure it is.'],
        ],
      },
      confidant: {
        who: 'bram', bond: 3,
        note: 'A fortnight ago Ysolde asked Bram how to tell the age of solder and of a maker\'s mark, "in the abstract".',
        lines: [
          ['bram:thinking', 'Miss Quill came to me a fortnight back, my dear, wanting to know how one tells the age of solder. And of a maker\'s mark. In the abstract, she said.'],
          ['bram:worried', 'Nobody asks about solder in the abstract. I told her you would need the piece in your hands, in good light, for an hour. She wrote that down.'],
        ],
      },
      confession: [
        ['ysolde:worried', 'I have to say something, and I shall say it badly, and you are not to interrupt or I shall lose my nerve.'],
        ['ysolde:worried', 'The flood inventory of 1831 lists the Moon Lantern as lost. Lost! And no record of its recovery. I have read every ledger twice.'],
        ['ysolde:thinking', 'On festival night the Mayor will tell the whole town it has burned for two hundred years. If that is false, I shall have let her say it. I am the archivist. It is the only thing I am.'],
        ['you', 'So you took it to check.'],
        ['ysolde:worried', 'I let myself in and I took it home in a hatbox. I meant to have it back by dawn. And then the bell was ringing, and I had become a thief, with a footnote.'],
        ['ysolde:surprised', 'The mark is under the base. I have not dared look. I do not know which answer frightens me more.'],
      ],
      reveal: 'In the flood ledgers of 1831 Ysolde found the Moon Lantern listed as lost, with no word of its return. Rather than let the Mayor promise the town two hundred years on festival night, she took it home in a hatbox to read the maker\'s mark for herself, meaning to have it back by dawn. Dawn came first.',
    },
    b: {
      label: 'She took it to light for her mother, who can no longer leave her bed',
      short: 'One night of lantern-light for her mother',
      loc: {
        loc: 'archive', stat: 'charm', rank: 3,
        title: 'The stair to the flat',
        note: 'At the foot of the archivist\'s private stair: a supper tray for an invalid, and a calendar with six Lanternfalls each marked "Mother, too ill". This year\'s is circled instead.',
        lines: [
          ['n', 'The junior clerk will tell you anything if you ask after his cat first. Yes, Miss Quill lives over the archive. Yes, her mother too. No, nobody has seen old Mrs Quill downstairs in years.'],
          ['n', 'At the foot of the private stair is a supper tray: beef tea, a spoon, a folded napkin. Pinned beside the door, a calendar. Six Lanternfalls running bear the same small note: "Mother, too ill." This year\'s has no note. It has a circle.'],
          ['you', 'Six festivals from a bedroom window that faces the wrong way. And this year, a circle.'],
        ],
      },
      confidant: {
        who: 'odile', bond: 3,
        note: 'Old Mrs Quill once led the lantern procession and has been bedridden six years. Ysolde asked the council to carry the lantern past her window. They said the route could not change.',
        lines: [
          ['odile:neutral', 'Old Mrs Quill led the lantern procession for thirty years. Hasn\'t left the room over the archive in six winters. Her window gives on the coal yard.'],
          ['odile:worried', 'Ysolde asked the council, very properly, in writing, to carry the lantern round by that window this year. They said the route is the route. I could have thrown a teapot.'],
        ],
      },
      confession: [
        ['ysolde:worried', 'I have to say something, and I shall say it badly, and you are not to interrupt or I shall lose my nerve.'],
        ['ysolde:neutral', 'My mother carried that lantern at the head of the procession for thirty years. She has not been down the stairs in six. Her window looks at a coal yard.'],
        ['ysolde:worried', 'I applied to have the route altered. In writing. With precedents. They declined. So I took it. I carried it up to her in a hatbox and I lit it on her washstand.'],
        ['you', 'What did she say?'],
        ['ysolde:happy', 'She said, "Oh, there you are," as though it had only been out of the room a moment. She held my hand till the oil ran out.'],
        ['ysolde:worried', 'And then it was dawn and the bell was going and I could not think how to put it back. I would do it again. Footnote: I am aware that is not a defence.'],
      ],
      reveal: 'Ysolde\'s mother led the lantern procession for thirty years and has not left her bed in six. The council would not move the route past her window. So Ysolde carried the Moon Lantern up the private stair in a hatbox and lit it on the washstand, and the old lady said, "Oh, there you are." By the time the oil ran out it was dawn, and the alarm bell was already ringing.',
    },
  },

  bram: {
    decoy: 'He means to sell the original and hang a copy in its place',
    a: {
      label: 'Its frame was failing, and he took it to mend in secret',
      short: 'Mending what the council would not let him touch',
      loc: {
        loc: 'workshop', stat: 'craft', rank: 3,
        title: 'The old-recipe solder',
        note: 'In Bram\'s small crucible: silver solder mixed to a two-hundred-year-old recipe, useless for new work. His pattern book lies open at "The Restoring of Leaded Frames".',
        lines: [
          ['n', 'There is a second, smaller crucible at the back of the hearth, with a lid on. You lift it. The solder inside is the wrong colour: pale, soft, nearly white.'],
          ['n', 'You have seen that recipe in his oldest pattern book, the one propped open on the shelf above. "The Restoring of Leaded Frames. For work of the last century use the old mixture, or the new will tear the old."'],
          ['you', 'Nobody mixes this for new lanterns. He is mending something old. Something he was told not to touch.'],
        ],
      },
      confidant: {
        who: 'tobias', bond: 3,
        note: 'Bram has petitioned the council two years running to let him re-solder the Moon Lantern\'s failing frame. They refused: "hands off a relic".',
        lines: [
          ['tobias:neutral', 'Halloway\'s been at the council two years. Says the lantern\'s frame is going. Says one hard knock and it\'s a box of glass.'],
          ['tobias:thinking', 'They told him hands off a relic. He hangs it every year. Feels it move on the hook. I\'ve seen his face.'],
        ],
      },
      confession: [
        ['bram:worried', 'Sit down, my dear. I am going to tell you something, and I should like you to be sitting.'],
        ['bram:neutral', 'That lantern is held together by habit. I hang it every year and every year the frame gives a little more under my hands. I told the council. Twice. "One does not tamper with a relic, Mr Halloway."'],
        ['bram:worried', 'One more festival, one small boy with a ball, and there would be no relic. So I borrowed it. I have it in the glass cellar under this shop, where nobody goes but me, half re-leaded, in the proper old solder.'],
        ['you', 'Why not say so?'],
        ['bram:thinking', 'Because my eyes are not what they were, and the work is going slowly, and I could not bear for anyone to see it in pieces and think I had broken it.'],
        ['bram:worried', 'I shall have it done by the festival. I think. I should feel better if someone knew.'],
      ],
      reveal: 'Bram had felt the Moon Lantern\'s frame give a little more each year he hung it, and the council twice forbade him to touch a relic. So he took it down to his glass cellar and began re-leading it in the old solder. With his eyes failing, the work went slowly, and he could not bear for anyone to see it in pieces and think he had broken it.',
    },
    b: {
      label: 'His sight is going, and he wanted to record its pattern while he still can',
      short: 'Saving the pattern before his eyes fail',
      loc: {
        loc: 'workshop', stat: 'insight', rank: 3,
        title: 'The giant tracings',
        note: 'Rolled behind Bram\'s plan chest: dozens of tracings of the Moon Lantern\'s pattern, drawn enormous, every line gone over thick and black, as if for someone who can no longer see fine ones.',
        lines: [
          ['n', 'Behind the plan chest is a roll of tracing paper as thick as your leg. You ease out the first sheet. It is the Moon Lantern\'s front pane, the moon and its nine reeds, drawn four times life size.'],
          ['n', 'Every line has been gone over, and over, with a thick black crayon. There are dozens of sheets: each pane, each joint, measurements in numerals two inches high. Nobody draws like this for pleasure.'],
          ['you', 'These are for a man who cannot see thin lines any more. And you cannot trace a lantern that is hanging in a locked boathouse.'],
        ],
      },
      confidant: {
        who: 'pim', bond: 3,
        note: 'Bram keeps asking Pim to read measurements aloud, blaming the light. He told Pim the Moon Lantern\'s pattern "dies with the last maker who really looks at it".',
        lines: [
          ['pim:thinking', 'Old Bram keeps getting me to read him measurements off his rule. Says the light is bad. The light is fine, New Tea. The light is lovely.'],
          ['pim:worried', 'And he said this thing. He said the pattern of the Moon Lantern is written down nowhere, and it dies with the last maker who really looks at it. Then he gave me a bun and changed the subject.'],
        ],
      },
      confession: [
        ['bram:worried', 'Sit down, my dear. I am going to tell you something, and I should like you to be sitting.'],
        ['bram:neutral', 'You know about my eyes. A year, the doctor says, perhaps two, and then it is shapes and weather.'],
        ['bram:thinking', 'There is no drawing of the Moon Lantern. None. Every maker of this town has learned it by looking, and I am the last who has. When my eyes go, the pattern goes.'],
        ['you', 'So you took it to copy it.'],
        ['bram:worried', 'I took it to trace it, every pane, big enough that I can still read my own lines, so that whoever comes after me can make it again. I asked for it for a week. The council said it does not leave the boathouse.'],
        ['bram:happy', 'It is in the glass cellar, under this floor. It is perfectly safe. It is the best company I have had in years.'],
      ],
      reveal: 'There has never been a drawing of the Moon Lantern. Each maker learned its pattern by looking, and Bram, whose sight is failing, is the last who has. The council would not lend it for a week. So he took it, and traced every pane four times life size in lines thick enough for his own eyes, so that whoever comes after him can make it again.',
    },
  },

  pim: {
    decoy: 'A dare, to make a name for themself before leaving town',
    a: {
      label: 'To light it once for their father, as the apprentice always has',
      short: 'An apprentice\'s right, and a promise to a father',
      loc: {
        loc: 'bridge', stat: 'insight', rank: 3,
        title: 'The lamplighters\' post',
        note: 'On the bridge lamp-post, two hundred years of apprentices have carved their names the year they lit the Moon Lantern. "P. OKORO" is cut ready. The festival bill above gives the honour to a visiting Duchess.',
        lines: [
          ['n', 'The festival bill is pasted to the great lamp-post in the middle of the bridge. "The Moon Lantern to be lit, by gracious consent, by Her Grace the Duchess of Aldermere." Somebody has scored through the line so hard the paper tore.'],
          ['n', 'Under the bill, the post itself is carved from knee to shoulder with names and years: every lamplighter\'s apprentice who ever lit the Moon. The last is cut fresh and deep, with no year after it yet. P. OKORO.'],
          ['you', 'Two hundred years of apprentices. And this year they gave it to a duchess.'],
        ],
      },
      confidant: {
        who: 'odile', bond: 3,
        note: 'Pim\'s father, the old lamplighter, has talked for ten years of watching Pim light the Moon Lantern. His leg keeps him at his window now. This year the Mayor gave the honour to a Duchess.',
        lines: [
          ['odile:neutral', 'Old Okoro lit the quay for forty years, till his leg went. Ten years he has talked of one thing: the night his Pim lights the Moon. He can\'t manage the quay steps now. He\'d have watched from his window.'],
          ['odile:worried', 'And this year Hespera gives it to a duchess, for the bridge fund. Pim laughed about it for a week. I have never seen anyone laugh so hard with so little in it.'],
        ],
      },
      confession: [
        ['pim:worried', 'New Tea. I am going to say a thing fast, and then I am going to look at the canal, and you are not to be nice about it.'],
        ['pim:neutral', 'Apprentice lights the Moon. Two hundred years. My name is already cut in the post. Dad did the carving himself, with his bad leg, the day I started.'],
        ['pim:worried', 'Then the Mayor gives it to a duchess who has never trimmed a wick in her life. For the bridge fund. And Dad just said, "Well. That is how it is," and went very quiet.'],
        ['you', 'So you took it.'],
        ['pim:happy', 'I took it under his window at midnight and I lit it. Just the once. He stood up to watch, New Tea. Held on to the sill and stood.'],
        ['pim:worried', 'I was going to put it straight back. Then I thought, if I put it back, she lights it. So it is in the lamp store, under the wick boxes, and I do not know what I am doing any more.'],
      ],
      reveal: 'For two hundred years the lamplighter\'s apprentice has lit the Moon Lantern, and Pim\'s name was already carved on the post. This year the Mayor sold the honour to a Duchess for the bridge fund. So Pim carried the lantern under their father\'s window at midnight and lit it, once, and the old man stood up to see. After that, Pim could not make themself hand it back.',
    },
    b: {
      label: 'To stop the Mayor quietly selling it to a collector',
      short: 'Hiding it from a buyer',
      loc: {
        loc: 'teahouse', stat: 'insight', rank: 3,
        title: 'A card under a saucer',
        note: 'Left at the Mayor\'s usual table: the card of "A. Voss, Antiquities, purchases by private treaty", with a pencilled sum and the words "for the bridge fund?"',
        lines: [
          ['n', 'The Mayor takes her tea at the corner table, with her back to the wall. Clearing it, you find a card under the saucer where somebody tucked it out of sight.'],
          ['n', '"A. Voss. Antiquities. Purchases by Private Treaty." On the back, in pencil, a sum of money with a great many noughts, and three words in the Mayor\'s looping hand: "for the bridge fund?"'],
          ['you', 'There is only one antiquity in this town worth that many noughts.'],
        ],
      },
      confidant: {
        who: 'ysolde', bond: 3,
        note: 'Pim asked Ysolde what "private treaty" means, and whether a town can legally sell something it has kept two hundred years. She said yes.',
        lines: [
          ['ysolde:thinking', 'Pim came to the desk last week and asked what "by private treaty" means. And then whether a town may sell a thing it has kept for two hundred years.'],
          ['ysolde:worried', 'I said that, legally, it may. Footnote: I answered the question that was asked, and I have regretted it every hour since. Pim went a very odd colour.'],
        ],
      },
      confession: [
        ['pim:worried', 'New Tea. I am going to say a thing fast, and then I am going to look at the canal, and you are not to be nice about it.'],
        ['pim:neutral', 'I carry the Mayor\'s messages. I do not read them. I read one. A man called Voss, antiquities, offering more money than the bridge costs. For the Moon Lantern. After the festival, quietly, with a copy hung up so nobody fusses.'],
        ['pim:worried', 'I asked Quill if a town can do that. She said legally, yes. Legally!'],
        ['you', 'So you hid it.'],
        ['pim:sly', 'You cannot sell what you cannot find. It is in the lamp store under the wick boxes. I check on it. I say good night to it. I know how that sounds.'],
        ['pim:worried', 'I did not think about the festival. I only thought about him putting it in a crate. What do I do now?'],
      ],
      reveal: 'Pim carries the Mayor\'s letters, and read one: a dealer named Voss, offering more than the bridge repairs cost for the Moon Lantern, to be sold quietly after the festival with a copy hung in its place. A town can legally sell what it has kept two hundred years. It cannot sell what it cannot find. Pim hid the lantern under the wick boxes in the lamp store.',
    },
  },

  wren: {
    decoy: 'Spite, because the council pensioned her off from the light',
    a: {
      label: 'To burn it in the lamp room for Maren, lost at sea forty years ago',
      short: 'A light kept for someone lost',
      loc: {
        loc: 'lighthouse', stat: 'insight', rank: 3,
        title: 'The second bracket',
        note: 'In the lamp room, beside the great lens, a new brass bracket the size of a lantern\'s foot. Below it, an old plate: "M.C. Lost Lanternfall night." Forty years ago this festival.',
        lines: [
          ['n', 'The lamp room is all brass and patience. Everything in it is a hundred years old and polished thin. Except one thing: beside the great lens, a bracket, bright and new, its screws still sharp.'],
          ['n', 'It is the size of a lantern\'s foot. Below it, let into the sill, is a small plate gone green: "M.C. Lost Lanternfall night. A moon to steer by." You count the tide-almanacs on the shelf back to that year. Forty.'],
          ['you', 'Somebody was meant to have a moon to steer by, forty years ago. And somebody has just made a place to set one.'],
        ],
      },
      confidant: {
        who: 'odile', bond: 3,
        note: 'Forty years ago this Lanternfall, Wren\'s wife Maren was lost coming home across the bar. The Moon Lantern was lit late that year, because the speeches ran long.',
        lines: [
          ['odile:neutral', 'Forty years this Lanternfall since Maren Castellane\'s boat. She was coming home over the bar, steering for the Moon Lantern, as they all did. Only it was lit late that year. The speeches ran on.'],
          ['odile:worried', 'Wren has never once spoken of it. Not once in forty years. That is how you know the size of a thing, dear: by the hole in the conversation.'],
        ],
      },
      confession: [
        ['wren:neutral', 'I am going to tell you a story. It is short, and there is no kraken in it.'],
        ['wren:neutral', 'Maren sailed. I kept the light. That was the arrangement, and it suited us both. Forty years ago this festival she was coming home over the bar, and I had promised her a moon to steer by.'],
        ['wren:worried', 'They lit the lantern late. The mayor of the day liked a speech. By the time it showed over the water she had already chosen her line, and it was the wrong one.'],
        ['you', 'And you took it now.'],
        ['wren:thinking', 'I am seventy-three. Next year I may not manage the stairs. I took it up my stairs. By day it sits in the oil cellar. Each night since, I have burned it in the lamp room, beside the great light. On time.'],
        ['wren:worried', 'I do not expect anything to come of it. I am not a fool. But I promised her, and I had only ever kept that promise late.'],
      ],
      reveal: 'Forty years ago this Lanternfall, Wren\'s wife Maren was steering home across the bar by the Moon Lantern, and it was lit late: the speeches ran long. Wren had promised her a moon to steer by. Knowing she might not manage the stairs another year, she carried the lantern up to the lamp room and burned it beside the great light, every night, on time.',
    },
    b: {
      label: 'The harbour light is failing, and she took it to bring the fleet home',
      short: 'A stand-in for a failing harbour light',
      loc: {
        loc: 'lighthouse', stat: 'craft', rank: 3,
        title: 'The cracked lens',
        note: 'The great lens of the Gull Rock light is cracked through the bullseye and wedged with folded paper. Beside it: a repair requisition stamped DEFERRED three times, "until after the festival".',
        lines: [
          ['n', 'You know good glass from bad by now. The great lens is a beehive of prisms taller than you are, and it is magnificent, and there is a crack through the bullseye you could post a letter in.'],
          ['n', 'It has been wedged with folded tide tables. On the keeper\'s desk is a requisition for a new bullseye, stamped three times in red: DEFERRED. DEFERRED. DEFERRED, UNTIL AFTER THE FESTIVAL.'],
          ['you', 'This light is not reaching the bar. And the fleet comes home festival week.'],
        ],
      },
      confidant: {
        who: 'tobias', bond: 3,
        note: 'The herring fleet is due home festival week. Wren warned the council the Gull Rock light no longer carries past the bar. They spent the money on bunting.',
        lines: [
          ['tobias:neutral', 'Fleet\'s due back festival week. Eleven boats. Captain told the council her light won\'t throw past the bar any more. Lens is cracked.'],
          ['tobias:worried', 'They bought bunting. She came down my slip after the meeting and looked at the water a long time. Didn\'t say anything. That\'s worse, with her.'],
        ],
      },
      confession: [
        ['wren:neutral', 'I am going to tell you a story. It is short, and there is no kraken in it.'],
        ['wren:neutral', 'My lens is cracked through the heart. The light does not carry past the bar. I have told the council three times. They have stamped it three times.'],
        ['wren:worried', 'The fleet comes home this week. Eleven boats, and fog due, and a light that reaches halfway.'],
        ['you', 'So you took the lantern.'],
        ['wren:thinking', 'It is the brightest flame in the town, in the clearest glass ever blown here. Each dusk I carry it up from the oil cellar and set it behind what is left of the lens. It carries. Not far. Far enough.'],
        ['wren:sly', 'They may have their festival, or their fishermen. I chose. I should be obliged if you would not make me choose again in public.'],
      ],
      reveal: 'The great lens of the Gull Rock light is cracked through, and three times the council deferred the repair until after the festival. With the herring fleet due home in fog, Wren carried the brightest flame in town up her stairs and set it behind what was left of the lens, where it would reach the bar. They could have their festival or their fishermen. She chose.',
    },
  },
};

// A sentence the culprit adds about how they got it out, by method.
export const METHOD_CONFESSION = {
  key: 'The spare key hangs in the harbour office with a paper tag on it. Nobody has counted those keys in years. I locked up after myself. It seemed only decent.',
  water: 'I went in underneath, by the water gate, on the top of the tide, and lowered it into the boat through the floor trap. The door never opened.',
  roof: 'I went in over the roof, through the loft hatch, and brought it up on the old sail hoist. The door never opened.',
};
export const METHOD_REVEAL = {
  key: 'It left by the door, with the harbour office\'s forgotten spare key, and the padlock was politely locked again behind it.',
  water: 'It left by boat, lowered through the floor trap and out under the water gate on the top of the tide.',
  roof: 'It left through the loft hatch on the old sail hoist, and away over the tiles.',
};
