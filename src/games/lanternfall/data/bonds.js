// Bond scenes: five per townsperson, unlocked in order.
// Step format:
//   ['n', text] narration · ['you', text] the player · ['who:expression', text]
//   ['?', [options]] a choice. Option fields:
//     t    text shown on the button
//     p    bond points with this scene's character (3 = they loved it, 1 = fell flat)
//     x    a stat that gains 1 xp for choosing this
//     req  { stat: rank } needed to pick it (shown as a lock chip when unmet)
//     dv   déjà vu: only visible once the named ending or epilogue has been seen in an earlier run
//     r    reply steps, played before the scene carries on
// {name} is replaced by the player's name.

export const BONDS = {
  // ------------------------------------------------------------------ Odile
  odile: [
    {
      id: 'odile1', title: 'House Rules', bg: 'teahouse',
      steps: [
        ['n', 'Breakfast at the Steeping Heron arrives at a scrubbed table by the window, whether or not you have ordered it.'],
        ['odile:neutral', 'Sit. Eat. You look like a letter that has been forwarded too many times.'],
        ['odile:sly', 'House rules. One: the fourth stair creaks, so I shall always know when you come in. Two: the cat is called Admiral Biscuit, and he outranks you.'],
        ['odile:neutral', 'Three: nobody lies to me before my second cup. After it I can still tell, but it is less sporting.'],
        ['?', [
          { t: 'What gave me away as a forwarded letter?', p: 2, x: 'insight', r: [
            ['odile:thinking', 'Town boots, and hands that are not town hands. And you have changed your mind about something lately, and it was not cheap.'],
            ['odile:happy', 'Don\'t look so alarmed. I read tea leaves for forty years. People are easier. They hold still.'],
          ] },
          { t: 'Is the Admiral open to bribery?', p: 3, x: 'charm', r: [
            ['odile:happy', 'Now that is the first sensible question anyone has asked in this house since March. Kippers. He can be had for kippers.'],
            ['n', 'On the windowsill, the Admiral opens one eye, as if to confirm the terms.'],
          ] },
          { t: 'I\'ll try to be no trouble.', p: 1, r: [
            ['odile:sly', 'Oh, don\'t do that. Trouble is all that keeps a lodging house interesting. Be a moderate amount of trouble. I shall tell you when to stop.'],
          ] },
        ]],
        ['odile:neutral', 'Now. The Mayor has made you her outsider, which means the whole quay will be telling you things by nightfall. Most of them will be true. That is what makes it difficult.'],
        ['odile:happy', 'Come back when your feet hurt. I\'ll put the kettle on.'],
      ],
    },
    {
      id: 'odile2', title: 'The Regulars', bg: 'teahouse',
      steps: [
        ['n', 'Odile ties an apron on you without asking and stands you behind the counter.'],
        ['odile:neutral', 'You can learn a town from what it drinks. Fenn: black, stewed, nothing in it, and he apologises to the cup. Miss Quill: jasmine, four minutes exactly. She times it.'],
        ['odile:happy', 'Bram: anything at all, three sugars, and he will tell you it is the best he ever had. Every time. And mean it.'],
        ['odile:sly', 'Pim drinks whatever someone else has left. The Captain brings her own flask, and what is in it is between her and her Maker.'],
        ['you', 'And you?'],
        ['odile:thinking', 'Me? Whatever is nearest when I finally sit down. It is generally cold.'],
        ['?', [
          { t: 'Make her a proper cup, and make her sit down to it.', p: 3, x: 'charm', r: [
            ['n', 'You warm the pot. You count the four minutes. You pull out a chair and stand beside it until she gives in.'],
            ['odile:surprised', '...Well.'],
            ['odile:happy', 'It is a bit strong. Don\'t change it.'],
          ] },
          { t: 'And what does the Mayor drink?', p: 2, x: 'insight', r: [
            ['odile:sly', 'Hespera? Whatever is dearest, slowly, where people can see. But she tips, and she has kept a roof on this town for twelve years, so she may have the corner table.'],
          ] },
          { t: 'You drink it cold because you are always up doing someone a kindness.', p: 3, dv: 'epi:odile', r: [
            ['odile:surprised', 'Who told you that?'],
            ['you', 'Nobody. It only felt like something I already knew.'],
            ['odile:thinking', 'Hm. And the fourth stair did not creak when you came down. I shall have to keep an eye on you.'],
          ] },
          { t: 'Cold tea is a sad thing.', p: 1, r: [
            ['odile:neutral', 'It is not sad. It is efficient. Sad is a full pot and nobody to pour for.'],
            ['n', 'She says it lightly, and wipes a counter that is already clean.'],
          ] },
        ]],
        ['odile:neutral', 'Mind the till. It bites.'],
      ],
    },
    {
      id: 'odile3', title: 'After Closing', bg: 'teahouse',
      steps: [
        ['n', 'You come down after closing for a glass of water and find the lamps still lit. Odile is at the big table with a cash-box that has no cash in it.'],
        ['n', 'It is full of paper tags: the little wish tags people tie to the festival lanterns. Hundreds of them, in piles.'],
        ['odile:surprised', 'The fourth stair. I must be going deaf.'],
        ['you', 'Those are lantern wishes. Last year\'s?'],
        ['odile:sly', 'Fished out of the weir. Somebody must clear it, or the ducks choke. I am civic-minded.'],
        ['?', [
          { t: 'Pick one up and read it, gently.', p: 3, x: 'charm', r: [
            ['n', '"I wish Gran\'s window got mended before winter. T., Eel Lane." The tag is a year old. You walked down Eel Lane yesterday. Every window in it was whole.'],
            ['odile:worried', 'Put that down, dear. Some of those are private.'],
            ['you', 'Gran\'s window got mended.'],
            ['odile:neutral', 'Did it. Well. Glaziers are a law unto themselves.'],
          ] },
          { t: 'You are not clearing them. You are sorting them.', p: 2, x: 'insight', r: [
            ['odile:thinking', '...By street. It is tidier.'],
            ['n', 'It is. It is also exactly how you would sort them if you meant to do something about each one.'],
          ] },
          { t: 'I didn\'t see anything.', p: 1, r: [
            ['odile:happy', 'Good answer. Wrong, but good.'],
          ] },
        ]],
        ['odile:neutral', 'Bed, {name}. And should you hear of anything on this quay being put right by nobody in particular, you were asleep.'],
      ],
    },
    {
      id: 'odile4', title: 'An Errand', bg: 'teahouse',
      steps: [
        ['odile:neutral', 'I want something carried to Tanner\'s Row. Number nine. You are not to knock. You leave it on the step and you are round the corner before the door opens. Can you manage that, or shall I ask the cat?'],
        ['n', 'The parcel is soft, and heavier than it looks. On Tanner\'s Row you do exactly as you were told.'],
        ['n', 'From round the corner you hear the door, and a silence, and then a woman saying "Oh," very quietly, the way people do when they are trying not to cry in the street.'],
        ['n', 'It was a winter coat, child\'s size. You saw the tag pinned inside the collar before you set it down: a year old, in soft pencil.'],
        ['odile:neutral', 'Well? Did you knock?'],
        ['?', [
          { t: 'No. But I waited round the corner.', p: 3, r: [
            ['odile:thinking', 'Mm. So do I. I tell myself it is to be sure it is found.'],
            ['odile:happy', 'It isn\'t.'],
          ] },
          { t: 'How long have you been doing this?', p: 2, x: 'insight', r: [
            ['odile:sly', 'Doing what? I sent a parcel. People send parcels.'],
            ['odile:neutral', '...Thirty-one years this Lanternfall. Since you ask so nicely.'],
          ] },
          { t: 'Does anybody know?', p: 2, r: [
            ['odile:sly', 'The Admiral. He is discreet. He is a cat.'],
          ] },
        ]],
        ['odile:worried', 'It is a young person\'s game, {name}. All that nipping round corners. My knees have opinions now.'],
        ['n', 'She looks at you a moment too long, then puts the kettle on. You are learning that this means the subject is closed, but not locked.'],
      ],
    },
    {
      id: 'odile5', title: 'The Ledger', bg: 'teahouse',
      steps: [
        ['n', 'You have worked it out, you think. Not only the coat and the window. The schoolroom stove that "turned up". The widow Darrow\'s rent, paid eleven years running by "a clerical error".'],
        ['you', 'Every lantern wish in this town that one stubborn woman with a tea house could grant, has been. For thirty-one years.'],
        ['odile:surprised', '...'],
        ['odile:sly', 'Could be coincidence. Could be elves.'],
        ['you', 'Elves don\'t sort by street.'],
        ['odile:happy', 'No. No, they have not the filing for it.'],
        ['n', 'She takes a ledger down from the dresser, thick as a loaf. Every wish is in it, in her small upright hand. A tick against most. Against some, only a date, and "not yet".'],
        ['odile:neutral', 'People think the lantern grants them. Let them. It is a better story than "Odile was up late with the mending", and a town needs something to wish on.'],
        ['odile:worried', 'But I am sixty-eight, there are four hundred tags in that box, the Moon is gone, and I find I am tired, dear. Not of the doing. Of there being only the one of me.'],
        ['?', [
          { t: 'Then let there be two of you.', p: 3, r: [
            ['odile:surprised', '...'],
            ['odile:happy', 'You would have to learn to wrap a parcel. Yours look as if they have been in a fight.'],
          ] },
          { t: 'Why tell nobody, all this time?', p: 2, r: [
            ['odile:thinking', 'Because the moment they know it is me, it stops being a wish and becomes a favour. Then they owe me, and bring pies. I cannot be doing with all those pies.'],
          ] },
          { t: 'The town ought to know what you have done.', p: 1, r: [
            ['odile:worried', 'The town ought to know nothing of the kind, and if you breathe a word the Admiral will sleep on your face.'],
            ['odile:neutral', 'But thank you. For thinking it.'],
          ] },
        ]],
        ['n', 'She pushes the ledger across the table towards you. Not the whole way. An inch.'],
        ['odile:happy', 'After the festival, we shall see. If there is a festival. Find that lantern, {name}. I have four hundred wishes and nothing to hang them on.'],
      ],
    },
  ],

  // ------------------------------------------------------------------ Tobias
  tobias: [
    {
      id: 'tobias1', title: 'The Man With the Key', bg: 'boathouse',
      steps: [
        ['n', 'The boathouse smells of tar and cold tea. A big man in a knitted cap is planing an oar, and does not look up.'],
        ['tobias:neutral', 'You\'re the Mayor\'s outsider.'],
        ['you', 'I\'m {name}. I\'m lodging at the Heron.'],
        ['tobias:worried', 'I locked it. Say that first. I always lock it. Thirty years. My father before. Hasp, key, wax. I locked it.'],
        ['n', 'He says it to the oar. There is a mallet rolling slowly towards the edge of the bench.'],
        ['?', [
          { t: 'Catch the mallet before it falls.', p: 3, x: 'craft', r: [
            ['n', 'You catch it an inch from the floor and set it back in the rack, in the gap that is plainly its own.'],
            ['tobias:surprised', '...Third peg. How\'d you know third peg?'],
            ['you', 'It\'s the only empty one.'],
            ['tobias:thinking', 'Hm. Most people put it on the bench.'],
          ] },
          { t: 'Nobody has said you didn\'t lock it.', p: 2, x: 'charm', r: [
            ['tobias:neutral', 'They don\'t say it. They buy their rope off me slower. Same thing.'],
          ] },
          { t: 'Then how did it get out?', p: 1, x: 'nerve', r: [
            ['tobias:worried', 'If I knew that I\'d not be planing an oar that doesn\'t need it.'],
          ] },
        ]],
        ['tobias:neutral', 'Look round if you want. Mind the slip. It\'s wet. It\'s always wet.'],
        ['n', 'From Tobias Fenn, you gather, this is a warm welcome.'],
      ],
    },
    {
      id: 'tobias2', title: 'Catching Crabs', bg: 'boathouse',
      steps: [
        ['tobias:neutral', 'Can you row?'],
        ['you', 'Not really.'],
        ['tobias:neutral', 'Get in.'],
        ['n', 'The dinghy is called Patience, which turns out to be a comment. Tobias sits in the stern with his arms folded while you drag two oars through the canal like a man stirring cement.'],
        ['tobias:thinking', 'You\'re fighting it. Water\'s not against you. It\'s not for you either. It\'s just going somewhere. Go with.'],
        ['n', 'You catch a crab, and the oar handle hits you in the chest. A woman on the bridge applauds.'],
        ['?', [
          { t: 'Laugh, and try again.', p: 3, x: 'nerve', r: [
            ['n', 'The next stroke is clean. So is the one after. For about ten yards you are a person rowing a boat.'],
            ['tobias:happy', 'There. Felt that? That\'s her saying thanks.'],
          ] },
          { t: 'Who taught you?', p: 2, x: 'charm', r: [
            ['tobias:neutral', 'Father. Same boat. Same canal. He\'d say nothing for an hour and then say "better." Best day of my year.'],
          ] },
          { t: 'You have taught someone before. You are good at this.', p: 3, dv: 'epi:tobias', r: [
            ['tobias:surprised', '...Once. Somebody small. Long while back.'],
            ['tobias:thinking', 'Funny thing to guess.'],
          ] },
          { t: 'Perhaps you had better take the oars.', p: 1, r: [
            ['tobias:neutral', 'No. You got us out here. You get us back. That\'s the whole of boats.'],
          ] },
        ]],
        ['n', 'You get them back. It takes a while. He hands you up onto the slip without comment, and then, as you turn to go:'],
        ['tobias:neutral', 'Better.'],
      ],
    },
    {
      id: 'tobias3', title: 'The Shed', bg: 'workshop',
      steps: [
        ['n', 'Behind the lantern workshop is a tarred shed. Tobias stands in front of its door for some time, like a man deciding whether to post a letter.'],
        ['tobias:worried', 'You don\'t say what\'s in here. Not to Odile. Specially not to Pim.'],
        ['n', 'Inside, on trestles, is a skiff. Nine feet of pale larch, every plank lying against the next as if it grew there. It is not finished. It is the most careful thing you have ever seen.'],
        ['you', 'Tobias. This is beautiful.'],
        ['tobias:neutral', 'She\'s all right. Sheer\'s a bit proud at the bow.'],
        ['?', [
          { t: 'She\'s small. Who is she for?', p: 3, x: 'insight', r: [
            ['tobias:worried', '...'],
            ['tobias:neutral', 'Somebody who\'ll have grown, by now. I keep having to guess how much.'],
          ] },
          { t: 'Run a hand along the planking, the way he does.', p: 2, x: 'craft', r: [
            ['n', 'You cannot find the joins with your fingers. You try twice.'],
            ['tobias:happy', 'That\'s it. That\'s how you look at a boat. Eyes lie.'],
          ] },
          { t: 'You could sell this for a fortune.', p: 1, r: [
            ['tobias:neutral', 'Could. Won\'t.'],
          ] },
        ]],
        ['n', 'On the shelf by the door is a tin of paint, unopened, and a small brush still in its paper. The colour on the lid is a bright, unboatwrightly yellow.'],
        ['tobias:neutral', 'That\'s for the name. When she\'s got one.'],
      ],
    },
    {
      id: 'tobias4', title: 'Linnet', bg: 'boathouse',
      steps: [
        ['n', 'You find Tobias on the slip at slack water with a sheet of paper on his knee. There are four words on it. He has clearly been looking at them for an hour.'],
        ['tobias:worried', 'You write letters. You\'ve got the look.'],
        ['n', 'The four words are: "Dear Linnet. I have".'],
        ['tobias:neutral', 'My girl. She\'s nine. Ten, come spring. Lives up in the capital with her mother. Two years since I saw her. Her mother\'s not unkind. I\'m just not much of a hand at visiting.'],
        ['tobias:worried', 'Skiff\'s for her. Was going to be for her seventh birthday. Then her eighth. I keep making it better instead of making it done.'],
        ['?', [
          { t: 'Because while it isn\'t finished, she can\'t say no to it.', p: 3, x: 'insight', req: { insight: 2 }, r: [
            ['tobias:surprised', '...'],
            ['tobias:worried', 'That\'s a hard thing to say to a man.'],
            ['tobias:neutral', 'True, though. Hard and true. Like oak.'],
          ] },
          { t: 'Then don\'t write about the boat. Tell her about the gull on the roof.', p: 3, x: 'charm', r: [
            ['tobias:thinking', 'The gull. She\'d like the gull. Stole a whole kipper off the Admiral, Tuesday.'],
            ['n', 'He writes. It takes him a long time, and he says each word under his breath as it goes down.'],
          ] },
          { t: 'Shall I write it for you?', p: 1, r: [
            ['tobias:neutral', 'No. She\'d know. She knew when I\'d bought a cake instead of making it. Four years old.'],
          ] },
        ]],
        ['n', 'When you leave, the page says: "Dear Linnet. I have a thing to show you." It is more than it said this morning.'],
      ],
    },
    {
      id: 'tobias5', title: 'A Name in Yellow', bg: 'workshop',
      steps: [
        ['n', 'The last plank goes on at dusk. You hold; he fastens. You know enough now that he only has to look at where he wants your hands.'],
        ['tobias:happy', 'That\'s her closed. That\'s a boat, that is. This morning she was a pile of opinions.'],
        ['n', 'He takes down the tin of yellow paint, and the small brush, and then stands there holding them as if they were somebody else\'s baby.'],
        ['tobias:worried', 'Letter went. She wrote back. Her mother\'s bringing her for the festival. If there is one.'],
        ['tobias:neutral', 'Says she wants to see "the thing". Didn\'t tell her what. So. She needs a name before Linnet sees her. And I\'ve no gift for names. I called a dinghy Patience.'],
        ['?', [
          { t: '"Second Chance."', p: 2, r: [
            ['tobias:thinking', 'Bit on the nose. But then, so am I.'],
          ] },
          { t: '"Better." It is the kindest thing you ever say.', p: 3, r: [
            ['tobias:surprised', '...'],
            ['tobias:happy', 'Ha. "Better." Father\'d have liked that. Wouldn\'t have said so.'],
          ] },
          { t: 'Leave the bow bare. Let Linnet name her.', p: 3, x: 'insight', r: [
            ['tobias:surprised', 'Let her... Hm.'],
            ['tobias:happy', 'Then it\'s hers before she\'s even in it. That\'s good. That\'s good joinery, that is.'],
          ] },
        ]],
        ['n', 'He paints for a while without speaking. His hand, which can lay a plank to a hair, shakes on the brush. He lets it.'],
        ['tobias:neutral', 'Wouldn\'t have finished her. Without somebody stood there. You know that.'],
        ['tobias:happy', 'Find that lantern, {name}. I\'d like my girl to see it lit.'],
      ],
    },
  ],

  // ------------------------------------------------------------------ Ysolde
  ysolde: [
    {
      id: 'ysolde1', title: 'Reading-Room Rules', bg: 'archive',
      steps: [
        ['n', 'The archive is a tall cold room that smells of dust and beeswax. Behind a desk like a fortress sits a small woman in enormous spectacles, writing very fast.'],
        ['ysolde:neutral', 'Name, purpose of visit, and are your hands clean. In that order.'],
        ['you', '{name}. The Moon Lantern. And mostly.'],
        ['ysolde:worried', 'Oh. Oh, you are the outsider. I have prepared a list of everything the archive holds concerning the lantern. It runs to nine pages. Footnote: there is an appendix.'],
        ['n', 'She says the word "footnote" out loud, as other people clear their throats.'],
        ['?', [
          { t: 'Nine pages! You have saved me a week.', p: 3, x: 'charm', r: [
            ['ysolde:surprised', 'I... yes. That was the intention. People do not usually see the intention.'],
            ['ysolde:happy', 'I have also cross-referenced it. You need not thank me. You may, though.'],
          ] },
          { t: 'Is there anything in it you find strange?', p: 2, x: 'insight', r: [
            ['ysolde:thinking', 'Strange. Hm. The lantern has no maker\'s entry in the guild rolls. Two hundred years, and nobody wrote down who made it. I dislike a gap.'],
          ] },
          { t: 'Could you just tell me the important part?', p: 1, r: [
            ['ysolde:worried', 'It is all the important part. That is what an archive is. The unimportant parts are in the canal.'],
          ] },
        ]],
        ['ysolde:neutral', 'You may read at table four. Pencil only. If you lick your finger to turn a page I shall know, and I shall be disappointed, and you will feel it.'],
      ],
    },
    {
      id: 'ysolde2', title: 'Page 211', bg: 'archive',
      steps: [
        ['n', 'You are returning a volume of harbour bylaws when a loose sheet slides out of it and see-saws to the floor. It is handwritten, and it is not a bylaw.'],
        ['n', '"...Captain Ravenscar seized her by the wrist. \'Madam,\' he growled, \'you have run the blockade of my heart, and I find I have no cannon left.\'"'],
        ['ysolde:surprised', 'That is misfiled!'],
        ['n', 'She crosses the reading room faster than you would have thought the bylaws allowed, and takes it out of your hand with two fingers.'],
        ['ysolde:worried', 'It is a... a donated manuscript. Anonymous. Of no value. Footnote: of no value whatever.'],
        ['?', [
          { t: '"No cannon left." That is rather a good line.', p: 3, x: 'charm', r: [
            ['ysolde:surprised', 'It... do you think so? I mean. One supposes the anonymous author would be gratified. Wherever they are.'],
            ['n', 'She has gone pink to the tips of her ears, and files the page in her own cardigan.'],
          ] },
          { t: 'It is in your handwriting, Miss Quill.', p: 1, x: 'insight', r: [
            ['ysolde:worried', 'A great many people have upright hands with a rightward tendency. It is the commonest hand in the district. Good afternoon.'],
          ] },
          { t: 'Say nothing, and hand her the bylaws.', p: 2, r: [
            ['ysolde:neutral', 'Thank you. That is... thank you. Tact is under-catalogued.'],
          ] },
          { t: 'Does Ravenscar get the girl? I feel I ought to know.', p: 3, dv: 'epi:ysolde', r: [
            ['ysolde:surprised', 'He does not "get" anyone. She gets him, on page three hundred, on her own terms, and keeps her ship.'],
            ['ysolde:worried', 'I mean. I should imagine. From the general tone.'],
          ] },
        ]],
        ['n', 'When you look back from the door she is reading the page over, moving her lips, and smiling at it like a mother at a school play.'],
      ],
    },
    {
      id: 'ysolde3', title: 'Mrs Tempest', bg: 'archive',
      steps: [
        ['n', 'The tea house keeps a shelf of lurid novels for wet afternoons, every one by "Marguerite Tempest". A Rake Among the Reeds. The Harbourmaster\'s Regret. Odile has read them all twice.'],
        ['n', 'You have now read one. On page ninety a duchess says "footnote" out loud.'],
        ['you', 'Miss Quill. Captain Ravenscar. The blockade of his heart. You are Marguerite Tempest.'],
        ['ysolde:surprised', '!'],
        ['ysolde:worried', 'Lower your voice. This is a reading room. Also I shall die.'],
        ['?', [
          { t: 'Tell her precisely what you liked, with the page number.', p: 3, x: 'insight', r: [
            ['you', 'Page one-forty. She mends his sextant while he is still shouting at her, and he does not notice until it works.'],
            ['ysolde:surprised', 'You saw that. Nobody sees that. The reviews only ever mention the bodices.'],
            ['ysolde:happy', 'Footnote: I was very pleased with the sextant.'],
          ] },
          { t: 'Your secret is safe. I swear it on table four.', p: 2, x: 'charm', r: [
            ['ysolde:neutral', 'Table four is a serious oath. I accept it.'],
          ] },
          { t: 'The bodices are doing a great deal of work, Miss Quill.', p: 1, r: [
            ['ysolde:worried', 'The bodices are structurally essential to the plot and I will not be teased in my own archive.'],
          ] },
        ]],
        ['ysolde:worried', 'Eleven novels. Nobody knows. Not the council, who would dismiss me. Not my mother, who would ask to read them, which is worse.'],
        ['ysolde:thinking', 'I catalogue other people\'s lives all day, {name}. At night I should like to make one up. That is all it is.'],
      ],
    },
    {
      id: 'ysolde4', title: 'The Invitation', bg: 'teahouse',
      steps: [
        ['n', 'Ysolde is at the tea house window table with a letter flat under both hands, as if it might blow away, or bite.'],
        ['ysolde:worried', 'It is from Thorne and Daughters. My publishers. They wish Mrs Tempest to give a public reading. At the Lanternfall festival. Here. On the quay.'],
        ['ysolde:surprised', 'They have had posters printed. Posters! There is an engraving of a woman who is presumably me. She has a great deal of hair.'],
        ['n', 'Across the room, Odile is telling a customer, with feeling, that the new Tempest is the best yet and that she cried at the sextant.'],
        ['ysolde:worried', 'I cannot. I read the minutes of the Drainage Committee aloud once and had to sit down.'],
        ['?', [
          { t: 'Odile cried at your sextant. Look at her. That is who you would be reading to.', p: 3, x: 'charm', r: [
            ['n', 'Ysolde looks. Odile is clutching the book to her shawl and saying "and she keeps the ship, Mrs Pellow, she keeps the ship."'],
            ['ysolde:surprised', 'She... oh.'],
            ['ysolde:thinking', 'I had only ever imagined them laughing.'],
          ] },
          { t: 'What is the worst that could honestly happen?', p: 2, x: 'nerve', r: [
            ['ysolde:thinking', 'I am dismissed, mocked in the street, and die alone among the bylaws. Footnote: I have alphabetised the possibilities.'],
            ['you', 'And the best?'],
            ['ysolde:worried', '...I have not alphabetised those. There did not seem to be enough of them.'],
          ] },
          { t: 'Then write back and say no.', p: 1, r: [
            ['ysolde:neutral', 'Yes. Yes, that is the sensible course.'],
            ['n', 'She does not pick up her pen. She goes on looking at the engraving of the woman with a great deal of hair.'],
          ] },
        ]],
        ['ysolde:neutral', 'I shall consider it. Considering is not agreeing. I want that minuted.'],
      ],
    },
    {
      id: 'ysolde5', title: 'A Reading', bg: 'archive',
      steps: [
        ['n', 'After closing, the archive steps are the quietest place in Vesper Quay. Ysolde stands on the top one holding a book as if it were hot.'],
        ['ysolde:worried', 'You are the audience. You are to sit there. You are not to look encouraging; it puts me off.'],
        ['n', 'She begins. It is inaudible. A moth lands on the page and seems to be following it better than you are.'],
        ['?', [
          { t: 'Don\'t read it to me. Read it to Ravenscar. He\'s the one who needs telling.', p: 3, x: 'charm', req: { charm: 3 }, r: [
            ['ysolde:thinking', 'To... yes. He is being very obtuse in this chapter.'],
            ['n', 'She squares up to an invisible sea captain a head taller than herself, and lets him have it.'],
          ] },
          { t: 'Louder. The moth can\'t hear you.', p: 2, r: [
            ['ysolde:happy', 'The moth is not a subscriber.'],
            ['n', 'But she laughs, and the laugh loosens something, and the next line comes out at the size it was written.'],
          ] },
          { t: 'Close your eyes, and say it from memory.', p: 2, x: 'insight', r: [
            ['ysolde:surprised', 'I do know it by heart. How did you... never mind.'],
            ['n', 'She shuts the book, and her eyes, and begins again from somewhere much nearer the centre of herself.'],
          ] },
        ]],
        ['n', '"\'You may keep your blockade, Captain,\' said she, \'and I shall keep my ship; and if you want me, you may apply in writing, like anybody else.\'"'],
        ['n', 'It rings off the houses opposite. Somewhere a window goes up. Ysolde stands with her chin lifted and her spectacles flashing, astonished at the size of her own voice.'],
        ['ysolde:happy', 'Oh. Oh, that is what it is for.'],
        ['ysolde:neutral', 'I shall write to Thorne and Daughters tonight. Mrs Tempest accepts. Footnote: she is terrified. Second footnote: she is going to do it anyway.'],
        ['ysolde:worried', 'There must be a festival, {name}. I have only just decided to be in it.'],
      ],
    },
  ],

  // ------------------------------------------------------------------ Bram
  bram: [
    {
      id: 'bram1', title: 'Every One of Them Has a Name', bg: 'workshop',
      steps: [
        ['n', 'The lantern workshop is a cave of coloured light. Lanterns hang from every rafter: fish, moons, onions, a lantern shaped like a surprised owl. In the middle of it a huge man in a leather apron is addressing one of them severely.'],
        ['bram:worried', 'No, no, no. You are sulking. I can see that you are sulking. A seam does not gape like that unless it is unhappy.'],
        ['bram:happy', 'Ah! A visitor! Come in, my dear, come in, mind Gertrude, she swings. You are the Mayor\'s outsider. Splendid. Hold this.'],
        ['n', '"This" is a soldering iron. It is hot. You are apparently now employed.'],
        ['?', [
          { t: 'Which one is Gertrude?', p: 3, x: 'charm', r: [
            ['bram:happy', 'The onion, my dear, by the door. She was my first. She is dreadful. I love her like a daughter.'],
            ['bram:sly', 'They all have names. A thing that carries light for people ought to be called something.'],
          ] },
          { t: 'Where do you want the iron?', p: 2, x: 'craft', r: [
            ['bram:happy', 'Just there, on the lap of the seam. Touch, count two, lift. Ha! You see? She has stopped sulking.'],
          ] },
          { t: 'Did the Moon Lantern have a name?', p: 2, x: 'insight', r: [
            ['bram:thinking', 'She has never told anybody. Two hundred years, and no maker\'s name on her either. I have always thought that showed great tact.'],
          ] },
        ]],
        ['bram:neutral', 'I hung her myself, you know, every year. The Moon. Forty years I have lifted her onto that hook, and I can tell you this: whoever took her down, took her down gently. I am clinging to that.'],
        ['bram:happy', 'Now! You must come back and I shall teach you to make an owl. Everyone should be able to make one owl.'],
      ],
    },
    {
      id: 'bram2', title: 'The Wrong Blue', bg: 'workshop',
      steps: [
        ['bram:happy', 'Glass, my dear! Today you learn glass. Pass me the sea-green, the third sheet, for the fish\'s belly.'],
        ['n', 'You pass him the third sheet. He holds it to the window, nods with enormous satisfaction, and begins to score it.'],
        ['n', 'It is not sea-green. It is plum. A plum-bellied fish begins to take shape under the best hands in Vesper Quay.'],
        ['?', [
          { t: 'Bram. That one is the plum.', p: 3, x: 'nerve', r: [
            ['bram:surprised', 'Is it? Is it! So it is.'],
            ['bram:happy', 'Well! A plum fish. The canal has seen stranger. Thank you, my dear. Most people would have let me.'],
            ['n', 'He laughs. He goes on laughing a little longer than the joke lasts.'],
          ] },
          { t: 'Quietly swap the sheet for the right one.', p: 2, x: 'craft', r: [
            ['n', 'You slide the sea-green under his hand. He takes it without a pause, and without looking at it, and you realise he never looked at the first one either. He held it to the light and guessed.'],
          ] },
          { t: 'A plum fish might be rather handsome.', p: 1, r: [
            ['bram:surprised', 'Plum? I asked for... ah. Yes. Yes, of course. Plum. A bold choice of mine.'],
          ] },
          { t: 'Put a small notch in the corner of each sheet, so they can be told apart by touch.', p: 3, dv: 'epi:bram', r: [
            ['bram:surprised', 'By touch? Why ever would I... hm.'],
            ['bram:thinking', 'What an extraordinary thing to think of. One notch for green, two for blue. I shall do it tonight. I cannot imagine why.'],
          ] },
        ]],
        ['bram:neutral', 'The light in here is not what it was. I have said so to the windows. They do not listen.'],
        ['n', 'The light in the workshop is perfect. It pours in like honey.'],
      ],
    },
    {
      id: 'bram3', title: 'In the Dark', bg: 'workshop',
      steps: [
        ['n', 'You come by the workshop late. The windows are black, but the door is on the latch, and inside somebody is tapping.'],
        ['n', 'Bram sits at his bench in total darkness with a scarf tied round his eyes. His hands move along a lantern frame like a pianist finding a tune.'],
        ['bram:surprised', 'Who is that? {name}? Don\'t light the... ah. Well. You have seen it now.'],
        ['bram:worried', 'It is my eyes, my dear. The middle has gone out of everything. I see you as a kind of friendly smudge with a voice. The doctor in the capital says a year. Perhaps two.'],
        ['bram:neutral', 'So I practise. Scarf on, lamps out. If I can teach these to see, I need not stop.'],
        ['n', 'He holds up his hands. They are scarred, enormous, and very steady.'],
        ['?', [
          { t: 'Take the next frame, shut your eyes, and try it his way.', p: 3, x: 'craft', req: { craft: 2 }, r: [
            ['n', 'It is like reading with your fingertips. The seam is a little road; the solder is a bead you walk along it. You get an inch. It is a dreadful inch.'],
            ['bram:happy', 'Let me feel. Oh, that is appalling. That is quite the worst seam I have handled this year. Do another! You have the idea exactly.'],
          ] },
          { t: 'Who else knows?', p: 2, x: 'insight', r: [
            ['bram:neutral', 'Odile, because she brings my supper and nothing gets past her. And now you. It is a small club. The subscription is silence.'],
          ] },
          { t: 'I\'m so sorry, Bram.', p: 1, r: [
            ['bram:worried', 'Now, none of that, or I shall start, and a blindfold is a most impractical thing to cry in.'],
          ] },
        ]],
        ['bram:worried', 'A lantern maker who cannot see light. It is the sort of joke I would enjoy very much if it were happening to somebody else.'],
      ],
    },
    {
      id: 'bram4', title: 'The Last Owl', bg: 'workshop',
      steps: [
        ['n', 'There is a lantern on the bench shaped like an owl: the same surprised owl you saw your first day, but new, and very fine. Bram is not working on it. He is sitting with his hands in his lap.'],
        ['bram:neutral', 'I soldered her beak on upside down. I did not know until Pim came in and laughed. A happy owl with a very sad beak.'],
        ['bram:worried', 'I think I shall stop, my dear. After the festival. Shut the shop while people still remember the good ones. Forty years is a respectable run for a lantern maker.'],
        ['?', [
          { t: 'Turn the owl over in your hands, and tell him the truth about it.', p: 3, x: 'craft', r: [
            ['you', 'The beak is upside down. Everything else on her is better than anything else in this shop. The wing seams are finer than Gertrude\'s. You did those blind.'],
            ['bram:surprised', 'Finer than Gertrude\'s?'],
            ['bram:thinking', 'Don\'t let her hear you. But... say it again. Slowly.'],
          ] },
          { t: 'Who will make the owls, if you stop?', p: 3, x: 'insight', r: [
            ['bram:worried', 'Nobody. That is rather the trouble. I never took an apprentice. I always thought there was time, and I was having too much fun.'],
            ['bram:thinking', 'Nobody. Hm. I dislike the sound of that more than I expected.'],
          ] },
          { t: 'You have earned a rest.', p: 1, r: [
            ['bram:neutral', 'Yes. Yes, that is what people will say. Very kindly. I can hear them doing it already.'],
            ['n', 'It was the wrong thing. You can tell from how politely he agrees.'],
          ] },
        ]],
        ['n', 'He picks up the owl and runs a thumb over the upside-down beak. Then, to your surprise, he snorts.'],
        ['bram:happy', 'She does look very sad about it, doesn\'t she. Poor creature. I shall call her Prudence.'],
      ],
    },
    {
      id: 'bram5', title: 'Hands', bg: 'workshop',
      steps: [
        ['n', 'You have been turning it over for days, and you have decided that a man who talks to lanterns can stand to be talked to.'],
        ['?', [
          { t: 'You are not finished. You are a teacher who has not started yet. Say it to his face.', p: 3, x: 'nerve', req: { nerve: 3 }, r: [
            ['you', 'Your eyes are going. Your hands are not. Everything those hands know dies in this room unless you put it into somebody else\'s. Stopping is not dignity, Bram. It is waste.'],
            ['bram:surprised', '...'],
            ['bram:worried', 'Nobody has spoken to me like that since my mother.'],
            ['bram:happy', 'I have missed it dreadfully.'],
          ] },
          { t: 'Put Prudence the owl in the window, sad beak and all, with a price on her.', p: 2, x: 'charm', r: [
            ['n', 'She sells in eleven minutes, to a child who says the beak is the best part. Bram stands at the back of the shop and listens to it happen.'],
            ['bram:thinking', 'The best part. Well. Well, well.'],
          ] },
          { t: 'Ask him to teach you one more thing before he stops.', p: 2, x: 'craft', r: [
            ['bram:happy', 'One more? My dear, there are four hundred more. There is the whole business of reeds. There is... oh. Oh, I see what you did.'],
          ] },
        ]],
        ['bram:neutral', 'An apprentice. At my age. I should need somebody quick, who climbs, who is not afraid of fire, and who talks enough for the lanterns to feel at home.'],
        ['n', 'From the street comes the sound of somebody running along the parapet of the bridge, whistling, and selling a rumour to a fishwife.'],
        ['bram:sly', 'I wonder if the lamplighters could spare a pair of hands. Two days a week. I shall ask old Okoro. He owes me for a weathervane.'],
        ['bram:happy', 'And you, my dear, shall hold the first frame while I show how it is done. In the dark. So that nobody has an unfair advantage.'],
        ['bram:neutral', 'Find her, {name}. The Moon. I should like my apprentice to see what we are aiming at.'],
      ],
    },
  ],

  // ------------------------------------------------------------------ Pim
  pim: [
    {
      id: 'pim1', title: 'The Gossip Map', bg: 'bridge',
      steps: [
        ['n', 'Somebody drops off the parapet of Market Bridge and lands in front of you like a cat that has been waiting to do that.'],
        ['pim:happy', 'You\'re the outsider! You\'re at Odile\'s, back room, the one with the damp. You came on the midnight barge and you take your tea too weak. I\'m Pim. I know everything.'],
        ['pim:sly', 'I\'m going to call you New Tea. Now. For one small coin, I can offer you my map of the quay, with all the best spots for overhearing marked in red.'],
        ['n', 'The map is drawn on the back of a fish wrapper. It is, you have to admit, extremely thorough.'],
        ['?', [
          { t: 'Pay up. Good intelligence is worth a coin.', p: 3, x: 'charm', r: [
            ['pim:happy', 'A person of quality! Free advice with every purchase: never stand under the Pellow sisters\' window at four. They water the geraniums at four. That is not all water.'],
          ] },
          { t: 'If you know everything, who took the lantern?', p: 2, x: 'nerve', r: [
            ['pim:surprised', 'Ha! Straight in. I like that.'],
            ['pim:thinking', 'I know everything that gets said. Nobody is saying this. The whole quay has gone quiet on one subject, and it is giving me a rash.'],
          ] },
          { t: 'I think I can find my own way about.', p: 1, r: [
            ['pim:sly', 'Everybody says that, and then they ask a Pellow sister for directions and lose a whole afternoon. Your funeral, New Tea.'],
          ] },
        ]],
        ['pim:neutral', 'I light the lamps at dusk, bridge to breakwater. Come along one evening. You see a town differently when you are the one switching it on.'],
        ['n', 'And Pim is gone, up a lamp-post, over a stall and along the parapet, never once looking down at the water.'],
      ],
    },
    {
      id: 'pim2', title: 'Switching It On', bg: 'bridge',
      steps: [
        ['n', 'Dusk. Pim carries the lighting-pole like a lance and talks without drawing breath, and behind the two of you the quay comes on, lamp by lamp, like a thought occurring to somebody.'],
        ['pim:happy', 'Dad did this round forty years. He says every lamp has a temper. That one is shy. That one is a show-off. That one by the eel stall only lights if you swear at it.'],
        ['n', 'Pim swears at it, fondly. It lights.'],
        ['n', 'The last lamp of the round is at the end of the old jetty, twelve planks out over black water. Pim stops at the first plank.'],
        ['pim:neutral', 'That one\'s been broken for ages. Not worth the walk. Nobody goes out there.'],
        ['n', 'It is not broken. You can see the wick from here, trimmed and ready.'],
        ['?', [
          { t: 'Hold out a hand for the pole. "I\'ll do that one. I want a go."', p: 3, x: 'nerve', r: [
            ['n', 'You walk the twelve planks and light the jetty lamp. It is easy. When you turn round Pim is watching you with an expression you cannot read, and then it is gone.'],
            ['pim:happy', 'Not bad, New Tea! A bit wobbly on the reach. We\'ll make a lamplighter of you.'],
          ] },
          { t: 'It doesn\'t look broken.', p: 1, x: 'insight', r: [
            ['pim:worried', 'Well, it is. I am the professional. Come on, I\'m starving.'],
          ] },
          { t: 'Let it go. Ask about Pim\'s father instead.', p: 2, x: 'charm', r: [
            ['pim:neutral', 'His leg went, two winters back. Fell off a ladder he had been up ten thousand times. Now he sits at the window and counts my lamps and tells me which ones I did sloppy.'],
            ['pim:happy', 'He\'s always right. It\'s unbearable.'],
          ] },
          { t: 'Walk out beside Pim, on the water side, and do not mention it.', p: 3, dv: 'epi:pim', r: [
            ['n', 'You put yourself between Pim and the edge, and talk about nothing, and somehow the two of you are at the end of the jetty and the lamp is lit.'],
            ['pim:surprised', '...Huh. How did you know to do that?'],
            ['you', 'I don\'t know. It just seemed like the side to walk on.'],
          ] },
        ]],
        ['pim:sly', 'Same time tomorrow? I\'ll let you do the sweary one.'],
      ],
    },
    {
      id: 'pim3', title: 'Can\'t', bg: 'bridge',
      steps: [
        ['n', 'A child\'s hoop goes off the quay and into the canal, an arm\'s length from the steps. Pim is nearest. Pim, who will run the bridge parapet in a gale, goes absolutely still.'],
        ['n', 'You fish the hoop out with a boathook. The child goes off happy. Pim has not moved.'],
        ['pim:worried', 'Don\'t.'],
        ['you', 'I didn\'t say anything.'],
        ['pim:worried', 'You were about to be nice. I can hear it coming, like weather.'],
        ['?', [
          { t: 'You can\'t swim. In a town that is half water. That must be exhausting.', p: 3, x: 'charm', req: { charm: 2 }, r: [
            ['pim:surprised', '...Exhausting. Yeah. That\'s... nobody says that. They\'d say "funny" or "shame".'],
            ['pim:neutral', 'Every day, New Tea. Every plank. I know where every edge in this town is, to the inch. You think I run the parapet to show off? It\'s the only place I know exactly where the water is.'],
          ] },
          { t: 'Sit down on the steps next to them and wait.', p: 2, r: [
            ['n', 'You sit. After a while Pim sits too, one step higher than you, away from the water.'],
            ['pim:neutral', 'I can\'t swim. There. Nineteen years in Vesper Quay. Mum never let me learn, after Dad\'s brother. And then I was too old to be seen learning.'],
          ] },
          { t: 'It was only a hoop.', p: 1, r: [
            ['pim:sly', 'Right. Only a hoop. Glad we cleared that up.'],
            ['n', 'Pim is smiling. It is the smile they use on customers.'],
          ] },
        ]],
        ['pim:worried', 'The long-barge captain offered me a berth. Runner, lamp-hand, all the way down to the sea and back. I\'ve wanted off this quay my whole life.'],
        ['pim:neutral', 'It\'s a boat, though, isn\'t it. It\'s six months of edges.'],
      ],
    },
    {
      id: 'pim4', title: 'The Tide Pool', bg: 'lighthouse',
      steps: [
        ['n', 'Under the lighthouse, at the bottom of a path fit for goats, is a tide pool the size of a room. Pim stands at the edge of it in a cork belt, shivering before even getting wet.'],
        ['pim:worried', 'Rules. You hold the lamp. You do not laugh. You do not tell anyone. If I drown you may have my map.'],
        ['n', 'What follows is not swimming. It is a disagreement with the sea, conducted at close quarters. But Pim goes under, and comes up, and goes under on purpose, and comes up again.'],
        ['pim:surprised', 'I\'m in! New Tea! I\'m in the actual sea! It\'s disgusting!'],
        ['?', [
          { t: 'You\'re kicking like you\'re running. You run better than anyone alive. Run.', p: 3, x: 'insight', r: [
            ['pim:thinking', 'Run. In water. That\'s the stupidest...'],
            ['n', 'Pim runs. Pim crosses the pool, cork belt and all, in a storm of spray, and hits the far side so hard they bark a knee.'],
            ['pim:happy', 'A LENGTH. That is a LENGTH. Write it on the slate!'],
          ] },
          { t: 'Hold the lamp high, and count the strokes out loud.', p: 2, x: 'nerve', r: [
            ['n', 'One. Two. Three. A lot of coughing. Four. Pim touches the far rock with one finger and looks at it as if it were the coast of another country.'],
          ] },
          { t: 'Careful! Not so far out!', p: 1, r: [
            ['pim:worried', 'It is waist deep, New Tea. I have Mum for that.'],
          ] },
        ]],
        ['n', 'High above, in the low window of the lighthouse, a lamp is burning that you did not notice being lit.'],
        ['pim:neutral', 'She does that. The Captain. Every night I come. Never says a word about it. I pretend I haven\'t noticed. It\'s the nicest thing anyone\'s ever not said to me.'],
      ],
    },
    {
      id: 'pim5', title: 'Twelve Planks', bg: 'bridge',
      steps: [
        ['n', 'The long-barge leaves the day after Lanternfall. Its captain wants an answer. Pim has brought you to the old jetty at high water, and is looking at the twelve planks like an exam.'],
        ['pim:worried', 'Pool\'s one thing. Pool\'s got a bottom. That out there is the real canal. Dad\'s brother went in off this jetty.'],
        ['pim:neutral', 'If I can go in off the end and get back to the steps, I take the berth. If I can\'t, I stay and light lamps and tell everyone I never fancied it.'],
        ['?', [
          { t: 'Take off your boots. "Then we both go in. Last one to the steps buys the buns."', p: 3, x: 'nerve', req: { nerve: 3 }, r: [
            ['pim:surprised', 'You\'re not serious. It\'s freezing. You\'re wearing your good... oh, you ARE serious.'],
            ['n', 'You go in together. The cold is like being slapped by a cathedral. Beside you, Pim comes up spitting and swearing and, beyond any doubt at all, swimming.'],
            ['pim:happy', 'I\'m winning! New Tea, I\'m WINNING, you swim like a wardrobe!'],
          ] },
          { t: 'Walk out to the end with them, and hold the lamp over the water.', p: 2, r: [
            ['n', 'Pim stands on the last plank for a long minute. Then, without a run-up, without a joke, steps off.'],
            ['n', 'It is the longest ten yards you have ever watched. A hand comes out of the dark and slaps onto the bottom step.'],
          ] },
          { t: 'You don\'t have to prove anything tonight.', p: 1, r: [
            ['pim:neutral', 'Yeah, I do. That\'s the whole thing, New Tea. Stand there, then.'],
            ['n', 'Pim goes in anyway, alone, and makes the steps, and sits there shaking and not looking at you.'],
          ] },
        ]],
        ['n', 'Afterwards, wrapped in a boat-cloak on the quay steps, with canal in their hair, Pim is quiet for the first time since you met.'],
        ['pim:neutral', 'I\'m going to take the berth. Six months. Sea and back.'],
        ['pim:happy', 'And then I\'m coming home and telling everyone on this quay exactly what they got wrong while I was away. They\'ll hate it.'],
        ['pim:worried', 'I want to light the Moon before I go, though. Just once. Find it, New Tea. Please.'],
      ],
    },
  ],

  // ------------------------------------------------------------------ Wren
  wren: [
    {
      id: 'wren1', title: 'Permission to Come Aboard', bg: 'lighthouse',
      steps: [
        ['n', 'The Gull Rock light has a hundred and forty-two steps. At the top of them a tall old woman in a peaked cap is polishing a brass rail that already shines.'],
        ['wren:neutral', 'You took the stairs at a run and stopped twice. So: keen, but not fit. Sit down before you fall down.'],
        ['you', 'Captain Castellane? I\'m {name}.'],
        ['wren:sly', 'I know. I watched you get off the midnight barge. You held your bag with both arms, as one holds a cat that may bolt. Nobody carrying a stolen lantern holds a bag like that.'],
        ['wren:neutral', 'I mention it so that you know I have already ruled you out. It saves time.'],
        ['?', [
          { t: 'What else did you see that night, from up here?', p: 2, x: 'insight', r: [
            ['wren:thinking', 'Fog, mostly. Fog and the tops of things. A town from above is all hats and chimneys. You learn people by their hats.'],
          ] },
          { t: 'Is it true you once fought a kraken?', p: 3, x: 'charm', r: [
            ['wren:sly', 'Fought is a strong word. We had a difference of opinion, off the Skerries, in the winter of the long ice. I took two of its arms. It took my second-best compass.'],
            ['wren:neutral', 'We parted with respect on both sides.'],
          ] },
          { t: 'Aren\'t you a suspect yourself?', p: 2, x: 'nerve', r: [
            ['wren:happy', 'Ha! Good. Yes. Tall, sleepless, well acquainted with ladders, and thoroughly annoyed with the council. I should suspect me at once.'],
          ] },
        ]],
        ['wren:neutral', 'Come up again. Bring something to drink, and a question worth the stairs. I shall tell you about the time I was becalmed for forty days with a cargo of parrots.'],
      ],
    },
    {
      id: 'wren2', title: 'Forty Days of Parrots', bg: 'lighthouse',
      steps: [
        ['wren:neutral', '...and by the thirtieth day every parrot aboard had learned the bosun\'s entire vocabulary, and the bosun had taken a vow of silence out of shame.'],
        ['n', 'The Captain tells a story as other people lay bricks. On the chart table between you is an ocean, weighted down with a teapot.'],
        ['wren:sly', 'We rounded the Cape of Sighs on the forty-first morning, with the wind dead astern from the north.'],
        ['n', 'You have been looking at the chart. The Cape of Sighs faces north. A north wind would have put her on the rocks.'],
        ['?', [
          { t: 'Say nothing. It\'s a good story.', p: 2, x: 'charm', r: [
            ['wren:neutral', 'You have a polite face on. I know a polite face. Out with it, or keep it for good.'],
            ['you', 'Keeping it.'],
            ['wren:happy', 'Hm. Tactful. I shall have to watch you.'],
          ] },
          { t: 'With a north wind, at that cape? You would have been aground.', p: 3, x: 'insight', r: [
            ['wren:surprised', '...'],
            ['wren:sly', 'So I would. South. The wind was south. A slip of the tongue. I am seventy-three.'],
            ['n', 'She looks at you with new and wary interest, as a chess player looks at a child who has just taken her bishop.'],
          ] },
          { t: 'Which ship was that on?', p: 1, r: [
            ['wren:neutral', 'A ship. They are much alike. Pointed at one end.'],
          ] },
          { t: 'I like the way it is told in "Passages South". Volume four, isn\'t it?', p: 3, dv: 'epi:wren', r: [
            ['wren:surprised', '...'],
            ['wren:thinking', 'You have an unsettling way of knowing things, for a person who arrived on Tuesday.'],
            ['wren:sly', 'Volume five. If one were being exact. Which we are not.'],
          ] },
        ]],
        ['wren:neutral', 'More tea. And I shall tell you about the ice. That one is perfectly true. Nearly.'],
      ],
    },
    {
      id: 'wren3', title: 'The Gallery', bg: 'lighthouse',
      steps: [
        ['n', 'There is a door at the top of the lamp room no wider than a coffin lid. Beyond it is the gallery: an iron walkway round the outside of the light, a hundred feet above the rocks, with a rail that comes up to your hip.'],
        ['wren:neutral', 'Nobody sees this town until they have seen it from out there. I shall not think the less of you if you decline. I shall think exactly the same of you, which is not yet very much.'],
        ['?', [
          { t: 'Go out. All the way round.', p: 3, x: 'nerve', req: { nerve: 2 }, r: [
            ['n', 'The wind takes hold of you like a large dog. You go round with one hand on the rail and your eyes open. Vesper Quay lies below like a spilled jewel-box: the canal, the bridge, every roof you have learned this week.'],
            ['wren:happy', 'There. Now you have seen it. It is small, isn\'t it. You could cover the whole of it with your hand.'],
          ] },
          { t: 'Go as far as the doorway, and look from there.', p: 2, r: [
            ['n', 'You stand in the frame with the wind pulling at your coat. It is enough. It is nearly too much.'],
            ['wren:neutral', 'Honest. I prefer honest to brave. Brave people fall off things.'],
          ] },
          { t: 'I would rather hear about it than see it.', p: 1, r: [
            ['wren:sly', 'Yes. That is a comfortable way to have an ocean. I know it well.'],
            ['n', 'It should be a jibe. It does not quite sound like one.'],
          ] },
        ]],
        ['wren:thinking', 'Forty years I have stood out here. Every boat that left this harbour, I watched it go. Every one that came back, I counted in.'],
        ['wren:worried', 'It is a curious trade, keeping a light. You spend your whole life pointing the way to somewhere, and you never...'],
        ['wren:neutral', 'It is turning cold. In. I have a story about a mutiny that will warm you up.'],
      ],
    },
    {
      id: 'wren4', title: 'Passages South', bg: 'archive',
      steps: [
        ['n', 'In the Voyages alcove of the archive there is a shelf rubbed pale along its edge by one hand reaching for it, year after year. "Passages South", in nine volumes. You take down the fourth.'],
        ['n', 'Becalmed forty days. A cargo of parrots. The bosun\'s vow of silence. It is all here, written by a Captain Aurelio Dunmore, a hundred years ago.'],
        ['n', 'You hear the stick before you see her. Wren stands at the end of the alcove, very straight.'],
        ['wren:neutral', 'Well. You have found my ship. She is called Volume Four.'],
        ['wren:worried', 'I have never been past the harbour bar, {name}. Not once. Maren sailed. I kept the light. Somebody must stand still, or nobody can find their way back.'],
        ['wren:neutral', 'And when people asked a lighthouse keeper for a sea story, I found I could not say, "I stood in one place for forty years and watched." So I borrowed. A little. Then a lot.'],
        ['?', [
          { t: 'You tell them better than he wrote them.', p: 3, x: 'charm', r: [
            ['wren:surprised', '...'],
            ['wren:sly', 'Dunmore had no ear. He puts the kraken in a subordinate clause. A subordinate clause!'],
            ['n', 'The corner of her mouth has moved. In Wren, this counts as helpless laughter.'],
          ] },
          { t: 'Put the book back where it lives, and say nothing to anyone.', p: 2, r: [
            ['wren:neutral', 'Thank you. That is a seamanlike thing to do. Whatever I know about it.'],
          ] },
          { t: 'Why not just tell people the truth?', p: 1, x: 'nerve', r: [
            ['wren:worried', 'Because they call me Captain, child. Do you know what they would call me instead? Nothing. Nothing at all. An old woman with a lamp.'],
          ] },
        ]],
        ['wren:thinking', 'The whole quay sets its watch by my stories. The trouble with being found out at seventy-three is that there is so little time left to be anything else.'],
      ],
    },
    {
      id: 'wren5', title: 'Which One Is Yours', bg: 'lighthouse',
      steps: [
        ['n', 'The lamp room at dusk. The great light turns, slow as a thought. Wren has not offered you a story tonight, and the silence where it would have gone is very large.'],
        ['?', [
          { t: 'Forty years of other people\'s stories. Which one is yours, Captain? Tell me that one.', p: 3, x: 'insight', req: { insight: 3 }, r: [
            ['wren:surprised', '...'],
            ['wren:thinking', 'Mine. Hm. It has no kraken in it.'],
            ['wren:neutral', 'The winter of the long ice was real. I did not sail in it. I stood here. The harbour froze, and the fleet was caught outside, eleven boats, in fog like wool.'],
            ['wren:neutral', 'The oil ran out on the second night. So I burned the chart table. Then the chairs. Then the stairs, from the top down, one tread at a time, and kept the light going on my own staircase until the last boat was in.'],
            ['wren:sly', 'I came down on a rope. The council docked my pay for the furniture.'],
          ] },
          { t: 'Ask her to tell the kraken again. You like how she tells it.', p: 2, x: 'charm', r: [
            ['wren:neutral', 'No. Not tonight. Tonight I find I am tired of that kraken.'],
            ['wren:thinking', 'I shall tell you a smaller one. About a winter, and a staircase. Stop me if it is dull. Nobody has heard it but the gulls.'],
            ['n', 'It is not dull. It is about ice, and eleven boats, and a woman who burned her own stairs to keep a lamp alight. When it is done, neither of you says anything for a while.'],
          ] },
          { t: 'Sit with her, and watch the light go round.', p: 2, r: [
            ['n', 'You sit. The beam goes out over the bar and comes back, goes out and comes back. After a long time she begins, unprompted, on a story you have not heard, about a winter and a staircase.'],
          ] },
        ]],
        ['you', 'That is better than every word of Dunmore.'],
        ['wren:worried', 'It is only standing still.'],
        ['you', 'It is eleven boats.'],
        ['n', 'She looks out at the bar for a long moment. Then she takes her cap off, turns it round in her hands, and puts it back on.'],
        ['wren:happy', 'There is a dinghy on Fenn\'s slip called Patience. After the festival, you are going to row me out past the harbour bar. I should like to see what all the fuss was about.'],
        ['wren:neutral', 'Find the lantern first. I do not put to sea with unfinished business ashore. I read that somewhere.'],
      ],
    },
  ],
};

// Short conversations for when no bond scene is ready. Cycled in order.
export const CHATS = {
  odile: [
    [['odile:neutral', 'People keep asking me who took it. As though I had it under the scones.'], ['odile:sly', 'I tell them the truth: I have my suspicions, and they change with the weather.']],
    [['odile:thinking', 'A word of advice, free with the tea. On this quay, the person who talks most knows least, and the person who says nothing is usually just shy.'], ['odile:happy', 'Which makes it very hard to tell who is hiding something. I love it here.']],
    [['odile:neutral', 'The Admiral has taken to sleeping on your bed. It is a great honour. It is also why your blanket smells of kippers.']],
    [['odile:happy', 'You are getting a quay face. Sit. There is a scone with your name on it, and I mean that literally; Pim iced it.']],
  ],
  tobias: [
    [['tobias:neutral', 'Tide\'s making. You can smell it. Like a cellar opening.'], ['tobias:thinking', 'People think a canal\'s still. It\'s never still. It\'s just polite about moving.']],
    [['tobias:neutral', 'Rope\'s like people. Treat it rough and it remembers.'], ['n', 'He coils thirty feet of it while he says this, without looking, into a circle you could serve dinner on.']],
    [['tobias:worried', 'Had the baker\'s lad in asking if I\'d "confess yet". Gave him a broom. He swept the slip. Fair trade.']],
    [['tobias:happy', 'You\'re not catching crabs any more. I watched you come in. Didn\'t say. Saying it now.']],
  ],
  ysolde: [
    [['ysolde:neutral', 'I have reshelved the whole of Harbour Law since the lantern went. It was not out of order. I needed something to be in order.']],
    [['ysolde:thinking', 'Do you know, in two hundred years of council minutes, the phrase "the lantern is safe" appears four hundred times, and "we have checked" only twice.'], ['ysolde:worried', 'Footnote: I counted. I wish I had not.']],
    [['ysolde:worried', 'Somebody returned a book with a kipper in it as a bookmark. I shall not say who. He is a cat.']],
    [['ysolde:happy', 'Table four misses you when you are not here. It has said nothing, being a table, but one can tell.']],
  ],
  bram: [
    [['bram:happy', 'Feel that, my dear. No, don\'t look, feel. That is a good seam. A good seam is like a kept promise.']],
    [['bram:thinking', 'The whole town asks me to make a new Moon. As if she were a hat! One does not make a new one. One could only make a different one, and hope she forgave us.']],
    [['bram:sly', 'Gertrude has been swinging at the Mayor again. I have spoken to her. She is unrepentant.']],
    [['bram:happy', 'You have solder on your nose. No, leave it. It suits you. It is how I know my own people.']],
  ],
  pim: [
    [['pim:sly', 'Today\'s prices. A plain rumour, one coin. A rumour with names in, two. A true one, I couldn\'t sell you; I\'d have to find one first.']],
    [['pim:happy', 'The Pellow sisters think it was pirates. River pirates. On a canal you could jump across. I told them I\'d look into it. They gave me a bun.']],
    [['pim:thinking', 'Know what\'s odd, New Tea? Nobody\'s angry. A thing like that goes missing, you\'d think they\'d be angry. They\'re all just... sad, and looking at each other.']],
    [['pim:happy', 'You walk quicker than you did Tuesday. That\'s the quay getting into your legs. Next you\'ll start having opinions about eels.']],
  ],
  wren: [
    [['wren:neutral', 'Glass is falling. Wind in the south-west by the week\'s end. I should not hang washing on festival night, if I were the Mayor. I am not the Mayor. I have said so, with relief, for twelve years.']],
    [['wren:sly', 'You want to know how I lost my second-best compass. No, you do. Everybody does. Sit down. This will take us as far as the Azores.']],
    [['wren:thinking', 'From up here you see who visits whom, and who goes the long way round to avoid whose door. A town is a tide table, if you watch it long enough.']],
    [['wren:happy', 'You took the stairs without stopping. I counted. Do not let it go to your head; the stairs are the easy part of anything.']],
  ],
};

// One-liners when someone keeps you company during an activity.
export const ASIDES = {
  odile: [
    [['odile:sly', 'Don\'t mind me. I am only here to judge.']],
    [['odile:happy', 'You are getting the hang of that. I should not have said so. Now you will stop trying.']],
  ],
  tobias: [
    [['tobias:neutral', 'Not bad. Elbows in.']],
    [['tobias:thinking', 'You stick at a thing. Noticed that.']],
  ],
  ysolde: [
    [['ysolde:neutral', 'I shall just observe. Footnote: I am not observing critically. Second footnote: I am, slightly.']],
    [['ysolde:happy', 'That was very nearly methodical. I am impressed.']],
  ],
  bram: [
    [['bram:happy', 'Splendid, my dear, splendid! No idea what you are doing, but it is being done with great heart.']],
    [['bram:happy', 'Now that is how a person learns a thing: badly, and then less badly.']],
  ],
  pim: [
    [['pim:sly', 'I\'m not laughing, New Tea. This is just what my face does.']],
    [['pim:happy', 'Go on, then. I\'ll tell everyone you were magnificent. For a coin.']],
  ],
  wren: [
    [['wren:neutral', 'Carry on. I am merely taking a bearing on you.']],
    [['wren:sly', 'I have seen worse. I have seen a great deal worse. It was a parrot.']],
  ],
};
