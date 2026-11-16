// Places, the things you can practise there, and the small events that open each morning.
// Same step format as data/bonds.js. Event options may carry fx: { xp: {stat: n}, bond: {who: n} }.

export const PLACES = {
  teahouse: {
    name: 'The Steeping Heron', short: 'Tea House',
    blurb: 'Bergamot, gossip and a cat with a rank. You lodge upstairs.',
    search: 'You take a tray round the empty tables, and look at what people leave behind.',
    activity: {
      title: 'Work a shift', verb: 'pouring tea and listening', xp: { charm: 2 },
      vignettes: [
        [['n', 'You work the afternoon rush. By the third table you have learned that everybody wants to be asked about their knees, their daughter, or their boat, and that guessing which is most of the job.'], ['n', 'A fisherman who has not spoken to anyone since Easter tells you about his knees for a quarter of an hour, and tips you a mackerel.']],
        [['n', 'The Pellow sisters send their tea back twice. The third time you bring the same pot, set it down like a crown, and say you had it brewed specially. They declare it perfect.'], ['n', 'From the kitchen door Odile gives you a single slow nod, like a general.']],
        [['n', 'A honeymoon couple, a sulking schoolboy and the entire Drainage Committee, all at once. You carry four trays, settle a dispute about scones, and make the schoolboy laugh with a napkin folded like a duck.'], ['n', 'You are getting good at this. It is mostly a matter of liking people slightly more than they expect.']],
      ],
    },
  },
  boathouse: {
    name: 'The Fenn Boathouse', short: 'Boathouse',
    blurb: 'Tar, rope and one empty hook. Where the Moon Lantern hung.',
    search: 'You go over the boathouse slowly, the way you would read a letter that was not addressed to you.',
    activity: {
      title: 'Row the canals', verb: 'rowing', xp: { nerve: 2 },
      vignettes: [
        [['n', 'You take the dinghy Patience out on the canal. The canal takes one look at you and sends a coal barge.'], ['n', 'You get out of its way with your heart banging, by rowing harder than you knew you could, straight at a gap that did not look wide enough and was.']],
        [['n', 'Under Market Bridge the current pinches and the arch comes at you low and green. You ship your oars at the last moment and shoot through lying flat on your back, looking at the weed go by an inch from your nose.'], ['n', 'It is the best thing you have done all week. You go back and do it again.']],
        [['n', 'You row out as far as the harbour mouth, where the canal stops being a street and starts being the sea. The dinghy lifts under you on the first real swell like a horse deciding whether it likes you.'], ['n', 'You turn her round yourself, in the chop, without shouting for anybody. Then you row home with your hands shaking, grinning like a fool.']],
      ],
    },
  },
  archive: {
    name: 'The Tidewater Archive', short: 'Archive',
    blurb: 'Two centuries of minutes, maps and grudges, all cross-referenced.',
    search: 'You work along the shelves and the reading tables, looking for whatever is out of its place.',
    activity: {
      title: 'Read in the stacks', verb: 'reading', xp: { insight: 2 },
      vignettes: [
        [['n', 'You read two hundred years of harbour court records. A startling amount of local history turns out to be about who moved whose mooring post, by how much, at night.'], ['n', 'By the end you can tell a liar from the shape of the sentences alone. The honest witnesses ramble. The liars are tidy.']],
        [['n', 'You spend the hours on old maps of the quay, one a decade, laid on top of each other like onion skin. Streets drift. A canal changes its mind. A whole alley is quietly eaten by a warehouse.'], ['n', 'When you walk home, you find you are seeing the town in layers, and noticing which walls are younger than they pretend.']],
        [['n', 'There is a box of unclaimed letters going back a century. You read them all. Nothing in them is important. All of it is. Somebody is sorry about a dog. Somebody will be home by the spring tide, and was not.'], ['n', 'You come out blinking, having learned to read what people did not quite say.']],
      ],
    },
  },
  workshop: {
    name: 'Halloway\'s Lantern Works', short: 'Workshop',
    blurb: 'A cave of coloured light. Every lantern in it has a name.',
    search: 'You look over the benches, the hearth and the shed out the back, touching as little as you can bear to.',
    activity: {
      title: 'Help at the bench', verb: 'soldering', xp: { craft: 2 },
      vignettes: [
        [['n', 'You cut wire. You are given more wire. You cut that. Your first forty lengths are each a slightly different size, and the forty-first is right, and after that they are all right, as though your hands had only been waiting to be told.']],
        [['n', 'Today it is paper: oiled silk-paper, stretched over a reed frame while it is damp, so that it dries tight as a drum. You put your thumb through the first three.'], ['n', 'The fourth one you hang in the window. It is lopsided and it glows. You look at it rather more often than the work requires.']],
        [['n', 'You are trusted with glass. A sheet the colour of a peach, a steel wheel, one breath held. The score sings; you tap; it parts along the line as clean as a thought.'], ['n', 'You have never made a straight edge on anything in your life before this week. You make eleven more, for the pleasure of it.']],
      ],
    },
  },
  bridge: {
    name: 'Market Bridge', short: 'Market Bridge',
    blurb: 'Stalls, shouting, the night-post, and everybody\'s business.',
    search: 'You drift from stall to stall with your ears open and your purse shut.',
    activity: {
      title: 'Haggle and listen', verb: 'haggling', xp: { charm: 1, insight: 1 },
      vignettes: [
        [['n', 'You spend an hour buying a single lemon. The lemon is not the point. By the end of it the fruit-woman has told you who is courting whom, who is in debt, and which of the bridge cats is a thief.'], ['n', 'You overpay by a farthing, on purpose, and are from that moment considered a person of sense.']],
        [['n', 'The eel man swears his eels were caught this morning. You look at the eels. You look at the eel man. You ask, pleasantly, which morning. There is a long pause, and then he laughs so hard he has to sit down on a barrel.'], ['n', 'You get the fresh ones from under the counter, at the price of the old.']],
        [['n', 'Three stallholders are having a blazing row about an awning. You are appealed to as a neutral party. You have no idea whose awning it is. You listen gravely to all three and then ask each what they think would be fair.'], ['n', 'It turns out they all think the same thing. It only wanted somebody to ask.']],
      ],
    },
  },
  lighthouse: {
    name: 'The Gull Rock Light', short: 'Lighthouse',
    blurb: 'A hundred and forty-two steps, and a view of everything.',
    search: 'You climb, and look: at the lamp room, the keeper\'s desk, and the rocks a long way down.',
    activity: {
      title: 'Tend the light', verb: 'climbing and polishing', xp: { nerve: 1, craft: 1 },
      vignettes: [
        [['n', 'The brasswork of the lamp room has to be polished every day or the salt gets it. Some of the brasswork is on the outside. You are handed a rag, and a rope to tie round your middle, and shown the window.'], ['n', 'You do not look down until you have finished. Then you look down, for quite a long time, on purpose.']],
        [['n', 'The clockwork that turns the great lens is wound by a crank the size of a cartwheel, and one of its teeth has gone. You file a new one out of brass rod, by lamplight, checking it against its neighbours with your thumbnail.'], ['n', 'When you let the weight go, the lens takes up its slow turn without a click. Up there, with the whole sea watching, that feels like applause.']],
        [['n', 'A pane of the lantern-glass has worked loose in the gale. Refitting it means standing on the outer gallery with putty, in a wind that keeps trying to take your hat and your opinions.'], ['n', 'It takes an hour. The pane sits true. Your legs take rather longer to stop singing.']],
      ],
    },
  },
};

export const SLOT_NAMES = ['Morning', 'Afternoon', 'Evening'];

// ---------------------------------------------------------------- morning events
export const EVENTS = [
  {
    id: 'fog', title: 'Custard Fog',
    steps: [
      ['n', 'You wake to no view at all. Fog has come up the canal in the night and is leaning on the window like a relative.'],
      ['odile:neutral', 'Custard fog. The lamps will want lighting again or people will walk into the water. They do it every year. Mostly the same people.'],
      ['?', [
        { t: 'Go out and help light the quay lamps.', fx: { xp: { nerve: 2 } }, r: [['n', 'You go out with a taper on a pole, feeling for the edge of the quay with your foot. By the tenth lamp you have stopped feeling for it. You know where it is.']] },
        { t: 'Stay in and help Odile with the breakfast rush.', fx: { xp: { charm: 1 }, bond: { odile: 1 } }, r: [['n', 'Everyone who comes in out of the fog wants tea and a grievance heard. You supply both. Odile lets you have the last scone, which in this house is a medal.']] },
      ]],
    ],
  },
  {
    id: 'gull', title: 'The Gull and the Kipper',
    steps: [
      ['n', 'Breakfast is a kipper. For about four seconds. Then it is a gull, going out of the window backwards with your kipper crosswise in its beak.'],
      ['n', 'On the sill, Admiral Biscuit watches it go with the cold interest of a rival firm.'],
      ['?', [
        { t: 'After it! Out of the window and along the gutter.', fx: { xp: { nerve: 2 } }, r: [['n', 'You do not get the kipper back. You do get as far as the ridge of the roof in your socks, and discover that you can stand up there quite comfortably if you do not think about it.']] },
        { t: 'Laugh, and give the cat what is left on the plate.', fx: { xp: { charm: 2 } }, r: [['n', 'The Admiral accepts the skin as his due. Three customers saw the whole thing, and by noon the story has gone round the quay with you as its hero, which is not how you remember it.']] },
      ]],
    ],
  },
  {
    id: 'flood', title: 'Spring Tide',
    steps: [
      ['n', 'The spring tide has come over the low quay in the night. People are wading about in it with the calm of long practice, carrying things to higher shelves.'],
      ['?', [
        { t: 'Help carry the archive\'s bottom shelf upstairs.', fx: { xp: { insight: 2 } }, r: [['n', 'You carry forty boxes of drainage minutes up a spiral stair. On the way you cannot help reading the labels. By the end you understand the politics of this town better than its mayor.']] },
        { t: 'Help haul the boats up the slip.', fx: { xp: { nerve: 1, craft: 1 } }, r: [['n', 'You haul on a wet rope with six strangers, in time, to a song with a very rude chorus. By the last boat you know the tune, the knot, and all the words.']] },
      ]],
    ],
  },
  {
    id: 'letter', title: 'A Letter From Home',
    steps: [
      ['n', 'There is a letter for you on the breakfast table, forwarded twice. It is from the place you left. It asks how you are getting on, in a tone which suggests the writer has already decided.'],
      ['?', [
        { t: 'Write back the plain truth.', fx: { xp: { insight: 2 } }, r: [['n', 'You write: "I do not know yet why I came. But I have been here a few days and I know the names of eleven people and one cat, and I think I am being useful." It looks odd, written down. It also looks true.']] },
        { t: 'Write back something magnificent.', fx: { xp: { charm: 2 } }, r: [['n', 'You write that you have been personally retained by the Mayor on a matter of the utmost delicacy. Which is accurate. You leave out the scones.']] },
      ]],
    ],
  },
  {
    id: 'bells', title: 'Bell Practice',
    steps: [
      ['n', 'The bell-ringers are practising for the festival. They have been at it since six. There are eight of them, and by the sound of it nine bells and no agreement.'],
      ['?', [
        { t: 'Go up the tower and ask if they need a ninth pair of hands.', fx: { xp: { nerve: 1, craft: 1 } }, r: [['n', 'They do. You are given the tenor rope and told to pull when the man with the beard nods. The first time, it nearly takes you up through the ceiling. By the tenth you have it, and the whole tower hums in your teeth.']] },
        { t: 'Sit on the quay and work out the pattern they are aiming for.', fx: { xp: { insight: 2 } }, r: [['n', 'It is a pattern, somewhere under the wreckage: each bell moving one place along, like dancers changing partners. Once you hear it, you cannot unhear it. You find you can tell which ringer is lost.']] },
      ]],
    ],
  },
  {
    id: 'catgift', title: 'The Admiral Provides',
    steps: [
      ['n', 'There is something on your pillow. It is a fish head. Beside it sits Admiral Biscuit, wearing the expression of a cat who has paid a debt in full.'],
      ['odile:sly', 'He likes you. I am sorry. There is nothing to be done about it.'],
      ['?', [
        { t: 'Thank him gravely, as one officer to another.', fx: { xp: { charm: 2 }, bond: { odile: 1 } }, r: [['n', 'You salute. The Admiral blinks, once, slowly. Odile has to go into the scullery for a moment.']] },
        { t: 'Work out where a cat gets a whole fish head at this hour.', fx: { xp: { insight: 2 } }, r: [['n', 'You follow a trail of small wet prints along the gutter, over two roofs and down a drainpipe, to the back of the eel stall and a loose board. You tell nobody. A cat is entitled to a private income.']] },
      ]],
    ],
  },
  {
    id: 'paper', title: 'Paper Moons',
    steps: [
      ['n', 'The quay children are making paper lanterns for the festival, on the tea house steps, with a pot of paste and no supervision. One of them hands you a reed and a sheet of tissue, as to an equal.'],
      ['?', [
        { t: 'Make the best lantern you can.', fx: { xp: { craft: 2 } }, r: [['n', 'It takes you an hour and a great deal of paste. It is very nearly round. A girl of six inspects it and says it is "all right for a first one", and shows you what you did wrong.']] },
        { t: 'Help the smallest ones, and let them do the sticking.', fx: { xp: { charm: 1, craft: 1 } }, r: [['n', 'You hold frames steady for a row of very small, very serious people. Every lantern comes out a different shape. Every one is declared the best. You are invited back tomorrow, which you understand to be a great honour.']] },
      ]],
    ],
  },
  {
    id: 'blend', title: 'The Blind Blend',
    steps: [
      ['n', 'Odile sets a cup down in front of you with no saucer and a look.'],
      ['odile:sly', 'Tell me what is in it. Everyone who lodges here has a go. Nobody has got it since 1894, and he was a tea merchant, and he cheated.'],
      ['?', [
        { t: 'Smoke. Orange peel. And something from the hedge: bramble leaf?', req: { insight: 2 }, fx: { xp: { insight: 2 }, bond: { odile: 2 } }, r: [['odile:surprised', 'Bramble leaf.'], ['odile:happy', 'Well. I shall have to change the recipe. Sit down, you dreadful creature, and have a bun.']] },
        { t: 'Take a wild guess, with total confidence.', fx: { xp: { nerve: 2 } }, r: [['you', 'Seaweed, gunpowder, and the tears of a bishop.'], ['odile:happy', 'Wrong in every particular. But I liked the delivery.']] },
        { t: 'Tell her honestly that it is delicious and you have no idea.', fx: { xp: { charm: 2 } }, r: [['odile:neutral', 'An honest palate. Rarer than a good one. Finish it; it is doing you good.']] },
      ]],
    ],
  },
  {
    id: 'fiddler', title: 'The Fiddler on the Bridge',
    steps: [
      ['n', 'A travelling fiddler has set up on Market Bridge, and half the quay has found a reason to be crossing it. He plays like a man being chased. Then, mid-reel, a peg lets go and the tune falls on its face.'],
      ['?', [
        { t: 'Ask someone to dance anyway, while he retunes.', fx: { xp: { charm: 2 } }, r: [['n', 'You offer your arm to the nearest Pellow sister. She is eighty-one. She leads. By the time the fiddle is back, the two of you have an audience, and she will not let you stop.']] },
        { t: 'Offer to fix the peg.', fx: { xp: { craft: 2 } }, r: [['n', 'A shaving of soap, a pinch of chalk, and the peg holds as if it had never thought of doing otherwise. He plays you a tune for it, and tells you it is called after you. You suspect it is called after everybody.']] },
      ]],
    ],
  },
  {
    id: 'stray', title: 'A Stray Wish',
    steps: [
      ['n', 'A paper lantern is coming down the canal on its own, a week early, unlit, turning slowly. There is a wish tag tied to it. It is going to pass just out of reach of the quay.'],
      ['?', [
        { t: 'Step out along the mooring chain and fetch it.', fx: { xp: { nerve: 2 } }, r: [['n', 'The chain is wet and has ideas of its own. You get the lantern with two fingers, and get back with one dry foot. The tag says, in a child\'s capitals: "I WISH THE MOON WOULD COME BACK." You put it carefully in your pocket.']] },
        { t: 'Walk beside it, and read the tag as it turns.', fx: { xp: { insight: 2 } }, r: [['n', 'It takes the length of the quay and all your patience. A word each time it comes round. "I. WISH. THE MOON. WOULD COME. BACK." Then the current takes it under the bridge, and you stand there a while.']] },
      ]],
    ],
  },
  {
    id: 'washing', title: 'Washing Day',
    steps: [
      ['n', 'Washing day. Lines are strung across the canal from every upper window, and the whole street is a fleet of shirts. One of the lines has parted, and a week of somebody\'s laundry is heading for the water.'],
      ['?', [
        { t: 'Lean out of the window and splice the line.', fx: { xp: { craft: 2 } }, r: [['n', 'You have never spliced a line. You have watched it done, once, this week. Your fingers apparently took notes. It holds. A voice from across the canal shouts "Who taught you that?", and you find you rather want to say.']] },
        { t: 'Run along the quay wall and catch what falls.', fx: { xp: { nerve: 2 } }, r: [['n', 'You save four shirts, a tablecloth and a very large pair of drawers, at a dead run, along a wall a foot wide. The owner of the drawers thanks you with enormous dignity and you both agree never to speak of it.']] },
      ]],
    ],
  },
  {
    id: 'riddle', title: 'The Eel Man\'s Riddle',
    steps: [
      ['n', 'The eel man on the bridge has a riddle, and will not sell to anyone today until it is answered. "I have a mouth and never eat, a bed and never sleep, and I run all day and never leave home." A queue is forming.'],
      ['?', [
        { t: '"A canal."', req: { insight: 2 }, fx: { xp: { insight: 2 } }, r: [['n', 'There is a groan from the queue, who have been saying "a river" for an hour. A river leaves home, says the eel man, with scorn. He gives you a jellied eel, free. You are not sure it is a prize.']] },
        { t: 'Tell him a worse riddle back.', fx: { xp: { charm: 2 } }, r: [['you', 'What is long, and wet, and costs too much on this bridge?'], ['n', 'The queue roars. The eel man tries to look offended and cannot manage it. Trade resumes.']] },
        { t: 'Say loudly that the queue is entitled to eels.', fx: { xp: { nerve: 2 } }, r: [['n', 'There is a short, thrilling silence. Then the fruit-woman says "Hear, hear," and it is all over for the riddle. The eel man sells to you last, and wraps it rather hard.']] },
      ]],
    ],
  },
];
