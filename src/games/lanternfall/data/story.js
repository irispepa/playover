// Intro, finale, endings and epilogues. Same step format as data/bonds.js, plus
//   ['bg', place, time] to change the backdrop.
// Tokens: {name} the player, {C} the true culprit, {A} the person accused.

export const INTRO = {
  id: 'intro', title: 'The Midnight Barge', bg: 'bridge', time: 2,
  steps: [
    ['n', 'The midnight barge puts you ashore at Vesper Quay with one bag, in a fog you could butter.'],
    ['n', 'You have a letter of introduction, a room booked over a tea house, and no clear idea why you came, except that the last place had stopped fitting.'],
    ['n', 'Somewhere a bell says twelve. Lamps hang in the fog like oranges. Under one of them, a door opens before you can knock.'],
    ['bg', 'teahouse', 2],
    ['odile:neutral', 'You will be my lodger. You are late. The barge is always late. I have had the kettle on since ten. Mind the fourth stair.'],
    ['n', 'The room is small and smells of bergamot. You sleep like a dropped stone.'],
    ['bg', 'boathouse', 0],
    ['n', 'You wake to a bell. Not the hour bell: a cracked, hurrying one. By the time you have found your boots, the whole quay is at the boathouse.'],
    ['n', 'The big doors stand open. Inside, over the slip, there is a brass hook, and a loop of cord, and under them nothing at all.'],
    ['mayor:worried', 'Two hundred years. Two hundred years the Moon Lantern has hung on that hook and been lit on Lanternfall night. And it goes on my watch, a week before the festival.'],
    ['mayor:neutral', 'It was there at the tenth bell. I inspected it myself. By midnight the watchman saw no glow at the window. A locked door, and Fenn\'s key round Fenn\'s neck. Nobody in, nobody out, and no lantern.'],
    ['n', 'The crowd is doing what crowds do: looking at one another sideways. A big man in a knitted cap stares at the floor. A small woman in spectacles grips a notebook. Everybody here has known everybody else since the cradle.'],
    ['odile:sly', 'Hespera. You want questions asked. You cannot ask them: half this quay owes you a favour and you owe the other half. And none of us can. We should all be questioning our cousins.'],
    ['odile:neutral', 'But I have a lodger who stepped off the midnight barge after the thing was already gone, as the bargeman will swear, and who does not know a soul.'],
    ['mayor:thinking', 'You. What is your name?'],
    ['you', '{name}.'],
    ['mayor:neutral', '{name}. Lanternfall is in seven days. They say a year the Moon stays dark is a year the town forgets itself. I do not hold with that. I notice, however, that I am not sleeping.'],
    ['mayor:neutral', 'Ask about. Look into things. People will always talk to a stranger. On festival night, come and tell me what you have found: who, and how, and for pity\'s sake, why.'],
    ['?', [
      { t: 'I\'ll find it.', x: 'nerve', r: [['mayor:happy', 'Good. I like a short answer. I so rarely get one.']] },
      { t: 'Why would anyone here steal it?', x: 'insight', r: [['mayor:worried', 'That is what frightens me. Nobody here would. So somebody here had a reason.']] },
      { t: 'Is there a fee?', x: 'charm', r: [['odile:sly', 'There is breakfast. It is more than she pays me.']] },
    ]],
    ['bg', 'teahouse', 0],
    ['odile:happy', 'There. You have a job, a week, and a room with a cat in it. People have started with less.'],
    ['odile:neutral', 'A day here has a morning, an afternoon and an evening. With each, you may go and talk to someone, go and poke about somewhere, or go and get better at something. Not all three. That is what a week is.'],
    ['odile:thinking', 'People open up slowly, and some things you will only notice once you have sharpened your wits or steadied your nerve. So choose. And write things down. Half of being clever is keeping a notebook.'],
  ],
};

export const FINALE_PRELUDE = {
  id: 'finale', title: 'Lanternfall Night', bg: 'bridge', time: 2,
  steps: [
    ['n', 'Lanternfall. The quay is hung with four hundred paper lanterns, every one of them dark. By custom none may be kindled until the Moon is.'],
    ['n', 'The whole town is on Market Bridge, in its best coats, not looking at the empty place at the head of the procession. The fog has stayed away. The canal is black glass.'],
    ['n', 'Tobias is there, cap in hands. Ysolde, holding a book too tightly. Bram, a head above everyone. Pim on the parapet. Wren at the far end, straight as her own lighthouse. And Odile, who catches your eye, and nods once.'],
    ['mayor:worried', 'Well, {name}. Seven days. They are all here, and they are all looking at me, and I am looking at you.'],
    ['mayor:neutral', 'What have you found?'],
  ],
};

// Lines for the confrontation, by suspect.
export const FINALE_LINES = {
  tobias: {
    caught: [['tobias:surprised', '...'], ['tobias:worried', 'That\'s it. That\'s all of it. Even the why. Didn\'t think anyone\'d get the why.']],
    wrongWhy: [['tobias:worried', 'I took it. Aye. But that\'s not why. You\'ve the who and not the why of it.']],
    exposed: [['tobias:worried', 'Aye. It was me.'], ['n', 'He says it to the cobbles. Nobody on the bridge will look at him, and he does not ask them to.']],
    falsely: [['tobias:surprised', 'Me.'], ['tobias:worried', 'No. I locked it. I told you first thing. I locked it.']],
    forward: [['tobias:worried', 'Stop. It wasn\'t them. It was me. I\'ll not stand here and watch somebody else carry it.']],
  },
  ysolde: {
    caught: [['ysolde:surprised', 'Oh.'], ['ysolde:worried', 'Yes. Every particular. You have even the reason correct, which I had rather hoped was illegible.']],
    wrongWhy: [['ysolde:worried', 'I took it. I do not dispute the fact. But your reason is wrong, and I find I mind that more than being caught.']],
    exposed: [['ysolde:worried', 'It is true. I took it.'], ['n', 'Her voice does not carry. People lean in to hear, and then lean away again.']],
    falsely: [['ysolde:surprised', 'I? Footnote: no. Absolutely not. I was posting a parcel, as I told you, and I can document it.']],
    forward: [['ysolde:worried', 'Stop, please. This is in error. The person you want is me. I should like that minuted.']],
  },
  bram: {
    caught: [['bram:surprised', 'My dear.'], ['bram:worried', 'Yes. All of it. You have looked at me more carefully than I have managed to look at anything in a year.']],
    wrongWhy: [['bram:worried', 'I took her, yes. But not for that, my dear. Never for that. You have the wrong end of me.']],
    exposed: [['bram:worried', 'It was I. I took her down.'], ['n', 'The biggest voice on the quay has gone very small. Around him, people who have bought his lanterns all their lives look at their shoes.']],
    falsely: [['bram:surprised', 'I? Take her? My dear, I have hung that lantern forty years. I should sooner take down the moon itself.']],
    forward: [['bram:worried', 'No, no, no. Stop this. They did nothing. It was me, my dears. It was Bram.']],
  },
  pim: {
    caught: [['pim:surprised', '...'], ['pim:worried', 'Yeah. That\'s it. That\'s the lot. Even the why. How do you even... never mind.']],
    wrongWhy: [['pim:worried', 'I took it. Fine. But not for that, New Tea. You know me better than that. I thought you did.']],
    exposed: [['pim:worried', 'It was me. All right? It was me.'], ['n', 'For once nobody on Market Bridge has anything to say back. Pim has never in their life been listened to so hard.']],
    falsely: [['pim:surprised', 'Me! New Tea. I was half drowned in a rock pool. I told you where I was.']],
    forward: [['pim:worried', 'Oi. No. Leave them alone. It was me. I\'m not having someone else take it for me.']],
  },
  wren: {
    caught: [['wren:surprised', '...'], ['wren:neutral', 'Correct in every particular. Including the reason. I had not expected the reason.']],
    wrongWhy: [['wren:neutral', 'I took it. You have that. Your reason, however, is wrong, and I shall not help you to the right one.']],
    exposed: [['wren:neutral', 'I took it.'], ['n', 'She says it as she might report the wind. The town that has called her Captain for forty years draws back from her a little, as from a cliff edge.']],
    falsely: [['wren:sly', 'I? An interesting theory. Wrong. I told you to detect, child. I see I should have added "accurately".']],
    forward: [['wren:neutral', 'That will do. Let them be. You are looking for me.']],
  },
};

export const ENDINGS = {
  remembers: {
    title: 'The Lantern Remembers', kicker: 'The true ending', tone: 'moon', secret: true,
    hint: 'A verse is learned one line at a time, and not all in the same week.',
    text: [
      'You do not name anyone. You climb onto the parapet of Market Bridge, in front of the whole town, and say the old Lighting Verse: all five lines, as it has not been said aloud in living memory.',
      'Somewhere in the crowd, {C} makes a small sound. Then {C} walks out onto the bridge with something wrapped in a coat, and unwraps it, and tells them. Everything. Nobody interrupts.',
      'There is no flame in the Moon Lantern. It lights all the same: slowly, from the inside, the colour of a pearl held up to a window. Then every paper lantern on the quay kindles at once, four hundred of them, with nobody near.',
      'Vesper Quay never discusses it afterwards. But that year\'s minutes carry one extra line, in a small upright hand: "The lantern is safe. We have checked."',
    ],
  },
  returned: {
    title: 'A Light Returned', kicker: 'Who, how and why, said kindly', tone: 'gold',
    hint: 'Get all of it right, and say it where only one person can hear.',
    text: [
      'You said it quietly, to {C} alone, and you had all of it: the who, the how, and above all the why.',
      '{C} looked at you for a long moment, like someone who has finally been allowed to put down something heavy. Then: "Will you walk over with me?" You did.',
      '{C} told the town, in plain words, with you standing half a step behind. When it was over there was a silence. Then the Mayor, of all people, said: "Well. Light it, then."',
      'The Moon was lit eleven minutes late. Nobody minded. Four hundred paper lanterns went out on the water after it, and one of them was yours.',
    ],
  },
  ownwords: {
    title: 'In Their Own Words', kicker: 'A confession, freely given', tone: 'gold',
    hint: 'Someone might tell you everything, if you become that sort of friend. Then let them tell the rest.',
    text: [
      '{C} had already told you everything, days ago, of their own accord. So you named nobody. You looked across the bridge, and nodded once, and waited.',
      '{C} stepped out of the crowd. It was not a long speech, and it was not a comfortable one, but every word of it was {C}\'s own, and nobody had to drag it out.',
      'People forgive a thing more easily when they are handed it than when they have to take it. By the end, somebody had put a hand on {C}\'s shoulder. Then somebody else.',
      'The Moon was lit by the one who had taken it down, with the whole quay watching, and you thought you had never seen anybody so relieved to be seen.',
    ],
  },
  quietmending: {
    title: 'Quiet Mending', kicker: 'The right person, half the story', tone: 'warm',
    hint: 'Find the right person and speak gently, but miss the how or the why.',
    text: [
      'You took {C} aside, and you had the right person. You did not have the whole of it.',
      '{C} set you straight, without heat, and then agreed to bring the lantern back that same hour. It was hung again before the last speech ended. The Mayor called it "a misunderstanding, now resolved", and the town let her.',
      'The festival was held. The Moon was lit. Hardly anyone ever learned the real reason, and you could not tell them, because you had only been told it afterwards, in confidence, by someone you had half misjudged.',
      'It was a good ending. It had one loose thread in it, and you kept finding it in your pocket for a long time afterwards.',
    ],
  },
  newcomerslie: {
    title: 'The Newcomer\'s Lie', kicker: 'You took the blame', tone: 'warm',
    hint: 'It takes steady nerves to stand up and confess to something a friend did.',
    text: [
      'You told the Mayor, in front of everyone, that it had been you. A misunderstanding. A newcomer who took a lantern down to look at it and was too mortified to say.',
      'It was a terrible lie. Odile actually put a hand over her eyes. The bargeman began to say that you had not even arrived, and was trodden on.',
      'And then {C} said, "No. No, I\'ll not have that," and walked out of the crowd, and told the truth, because some people can bear to be thought a thief but cannot bear to let a friend be.',
      'Afterwards {C} would not speak to you for nearly an hour. Then stood beside you while the Moon was lit, close enough for your shoulders to touch, and said only: "Idiot."',
    ],
  },
  unmasking: {
    title: 'The Unmasking', kicker: 'Right, and loud about it', tone: 'grey',
    hint: 'Be right about everything, and say so from the parapet.',
    text: [
      'You named {C} from the parapet, in a carrying voice, with the who and the how and the why laid out like fish on a slab. You were right on every count.',
      'The lantern was fetched. The Moon was lit. The festival went ahead, rather quietly, with a good deal of space left around one person.',
      'The Mayor thanked you in public. Odile set your breakfast down next morning without the look that usually came with it.',
      'Being right, it turns out, is not the same as doing right. You had a week to learn the difference, and you learned it about an hour late.',
    ],
  },
  halftruth: {
    title: 'Half a Truth', kicker: 'The right name, the wrong reason', tone: 'grey',
    hint: 'Name the right person in public, for the wrong reason.',
    text: [
      'You named {C} before the whole town, and you had the right person. But the reason you gave was not the reason, and it was an uglier one.',
      '{C} did not correct you. Perhaps it seemed too late. The lantern came back; the Moon was lit; and the town went home believing your version, because it had been said loudly, by somebody with no reason to lie.',
      'The truth came out some weeks after you had gone, in a letter from Odile. It was a short letter. It did not reproach you. It only told you what had really happened, and left a space after it.',
      'You read it twice, and then you wrote to {C}. It took you eleven drafts.',
    ],
  },
  kindmistake: {
    title: 'A Kind Mistake', kicker: 'The wrong person, gently', tone: 'warm',
    hint: 'Accuse the wrong person, but have the grace to do it in private.',
    text: [
      'You drew {A} aside and said it as kindly as you could. You were wrong.',
      '{A} heard you out, and did not shout, and at the end said only: "No. But I can see how you got there." Which was worse, and better, than shouting.',
      'What neither of you knew was that {C} had watched you take {A} aside, and understood, and could not stand it. Before you had finished apologising, {C} was on the bridge telling the Mayor everything.',
      'The Moon was lit late, by a town that had just heard two confessions, one of them yours. {A} stood next to you for it. You have made worse mistakes with better results.',
    ],
  },
  wrongdoor: {
    title: 'The Wrong Door', kicker: 'The wrong person, loudly', tone: 'dark',
    hint: 'Stand on the parapet and name somebody who did not do it.',
    text: [
      'You named {A} from the parapet, with the whole of Vesper Quay listening. You were wrong.',
      '{A} denied it, once, and then stopped, because a town that has been frightened for a week will take any answer it is handed. People drew back. There was no lantern to fetch.',
      'Lanternfall went dark that year, for the first time in two centuries. You left on the morning barge. Odile packed you a lunch and did not come down to the quay.',
      'Three days later the Moon Lantern was back on its hook, with a note tied to the cord in a hand nobody would admit to knowing: "It was never {A}. I am sorry. I was not brave enough in time."',
    ],
  },
  papermoon: {
    title: 'Paper Moon', kicker: 'No name given', tone: 'dusk',
    hint: 'Tell the Mayor you will not guess with somebody else\'s name.',
    text: [
      'You told the Mayor the truth: that you were not sure, and that you would not guess with somebody else\'s name.',
      'She looked at you for some time. Then the children of the quay came through the crowd carrying a moon they had made themselves: paper and reed and a great deal of paste, lopsided, the size of a cartwheel.',
      'They hung it at the head of the procession and lit it with a taper on a pole, and four hundred lanterns were lit from that. It was, several people said, not at all the same. Several others said it was better.',
      'The real one was found on the tea house step a month later, wrapped in a blanket, with no note. Odile wrote to tell you. She says it knows what it did.',
    ],
  },
  tourist: {
    title: 'A Lovely Week', kicker: 'You were, technically, on holiday', tone: 'dusk', secret: true,
    hint: 'What if you simply did not investigate at all?',
    text: [
      'You told the Mayor, with as much dignity as you could find, that you had not really found anything. You had been rowing. And there had been a good deal of tea.',
      'The Mayor opened her mouth and closed it again. Odile laughed until she had to sit down on a bollard.',
      '"Seven days," said the Mayor, faintly. "I gave you seven days." You said that they had been wonderful days, and that you felt very rested, and that the scones here were remarkable.',
      'The festival was held with a paper moon. You stayed another week. Nobody asked you to investigate anything, ever again, and you were surprised by how much you minded.',
    ],
  },
};

export const ENDING_ORDER = ['returned', 'ownwords', 'quietmending', 'newcomerslie', 'unmasking', 'halftruth', 'kindmistake', 'wrongdoor', 'papermoon', 'tourist', 'remembers'];

export const EPILOGUES = {
  odile: {
    title: 'Two of Them', hint: 'Earn Odile\'s whole trust.',
    text: 'You stayed on at the Steeping Heron. In the mornings you pour tea. In the evenings there is a ledger, thick as a loaf, and a box of four hundred paper tags, sorted by street. Your parcels still look as if they have been in a fight. But things on the quay keep being put right by nobody in particular, and these days nobody in particular has help.',
    culprit: '',
  },
  tobias: {
    title: 'Better', hint: 'Earn Tobias\'s whole trust.',
    text: 'Linnet came for the festival, and was shown the thing. She walked round the skiff twice without a word, exactly like her father, and then asked whether it was really hers, and whether it was allowed to be yellow. They were out on the canal before breakfast every day she stayed. Tobias writes to her each week now. The letters are four lines long, and she keeps them all.',
    culprit: 'She was told what her father had done about the lantern, and why. She thought it over, and then said that he ought to have just asked somebody, and that she would help him next time.',
  },
  ysolde: {
    title: 'Mrs Tempest Accepts', hint: 'Earn Ysolde\'s whole trust.',
    text: 'Marguerite Tempest read on the quay at Lanternfall, to the whole town, in a voice that carried to the breakwater. Odile was in the front row, and cried at the sextant. The council did not dismiss their archivist. They asked, rather shyly, whether there would be a twelfth. There will. It is dedicated "to the reader at table four".',
    culprit: 'The twelfth novel has a stolen lantern in it. The thief is treated with great understanding, and gets a footnote of her own.',
  },
  bram: {
    title: 'The Apprentice', hint: 'Earn Bram\'s whole trust.',
    text: 'Halloway\'s Lantern Works has an apprentice two days a week, who talks without pause and has already been swung at by Gertrude. Bram teaches with the lamps out, so that nobody has an unfair advantage. Every sheet of glass in the shop has notches cut in one corner now. Prudence the owl hangs in the window, sad beak and all, and is not for sale at any price.',
    culprit: 'The Moon Lantern\'s pattern hangs on the workshop wall, drawn four times life size, where any maker of Vesper Quay may come and learn it.',
  },
  pim: {
    title: 'Sea and Back', hint: 'Earn Pim\'s whole trust.',
    text: 'Pim took the berth. The long-barge left the morning after Lanternfall with a new lamp-hand standing at the very edge of the bow, where the water is, on purpose. A postcard comes to the tea house from every lock: gossip, mostly, about people you have never met. The last one said: "Swam in an actual sea. Disgusting. Tell Dad. Home by spring. Do not let anyone light my lamps sloppy."',
    culprit: 'Before the barge sailed, the lamplighters\' post on Market Bridge gained a year, cut deep after the name P. OKORO.',
  },
  wren: {
    title: 'Past the Bar', hint: 'Earn Wren\'s whole trust.',
    text: 'The morning after the festival you rowed the Captain out past the harbour bar in a dinghy called Patience. She sat very upright in the stern and said nothing for a quarter of a mile. Then she looked back at her own lighthouse from the outside, for the first time in her life, and said: "So that is what they were all steering for. It looks smaller. And kinder." On the quay she now tells a new story, about a winter and a staircase. It is the most asked for.',
    culprit: 'She tells that one too, when asked: the week she took the Moon up her stairs. She does not put a kraken in it.',
  },
};

// The Lighting Verse. Five lines; four are enough to say it.
export const VERSE = [
  { line: 'Moon in the water, moon in the glass,', from: 'Solve the case once.' },
  { line: 'light for the ones who cannot pass;', from: 'Solve a case with a different culprit.' },
  { line: 'what was carried, carry home,', from: 'Solve a case with a third culprit.' },
  { line: 'what was hidden, let be shown,', from: 'Ysolde finds it, for a true friend.' },
  { line: 'and none who love this light, alone.', from: 'Wren remembers it, for a true friend.' },
];
export const VERSE_NEEDED = 4;

// New Game Plus keepsakes: pick one at the start of a run.
export const KEEPSAKES = {
  notebook: { name: 'Dog-eared Notebook', text: 'Start with one stat of your choice already at rank 2.', unlock: 'Reach any ending.' },
  invitation: { name: 'Standing Invitation', text: 'Everyone already knows you: all townsfolk start met, with a head start on every bond.', unlock: 'See any personal epilogue.' },
  loupe: { name: 'Bram\'s Loupe', text: 'Investigating turns up one extra clue each time, and needs one rank less.', unlock: 'Name the right culprit in any ending.' },
  thermos: { name: 'Odile\'s Thermos', text: 'Every activity gives one extra point of experience.', unlock: 'See three different endings.' },
};
