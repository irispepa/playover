// Patch & Kettle: ticket types, the little stories around them, and raw material for the puzzles. No DOM here.

// unlock: first day a type can appear. hours: time it takes. weight: how common it is.
export const TYPES = {
  reboot: { name: 'Frozen computer', short: 'Reboot', icon: 'power', unlock: 1, hours: 1, weight: 3, wiki: 'Turning it off and on again: a field guide', how: 'Do the reboot ritual: hold, wait, and tap in time.' },
  cables: { name: 'Cable muddle', short: 'Cables', icon: 'plug', unlock: 1, hours: 1, weight: 3, wiki: 'Which cable goes where (with drawings)', how: 'Drag each plug to the port it belongs in.' },
  diagnosis: { name: 'Mystery problem', short: 'Mystery', icon: 'search', unlock: 1, hours: 1, weight: 3, wiki: 'Is it plugged in? A checklist', how: 'Ask up to two questions, then pick the cause.' },
  printer: { name: 'Printer jam', short: 'Printer', icon: 'printer', unlock: 2, hours: 1, weight: 3, wiki: 'How to un-jam the printer without crying', how: 'Open the flaps in the order the paper travels.' },
  password: { name: 'Password trouble', short: 'Password', icon: 'key', unlock: 2, hours: 1, weight: 3, wiki: 'Passphrases you will actually remember', how: 'Build a passphrase from words they will remember.' },
  wifi: { name: 'Patchy Wi-Fi', short: 'Wi-Fi', icon: 'wifi', unlock: 3, hours: 2, weight: 3, wiki: 'Where the Wi-Fi lives', how: 'Place the routers so every desk gets signal.' },
  inbox: { name: 'Suspicious mail', short: 'Inbox', icon: 'mail', unlock: 3, hours: 1, weight: 3, wiki: 'Spot the phish: five easy tells', how: 'Sort the friendly mail from the fishy.' },
  desktop: { name: 'Lost files', short: 'Files', icon: 'folder', unlock: 4, hours: 1, weight: 3, wiki: 'Folders are your friends', how: 'Tidy every file into the right folder.' },
  videocall: { name: 'Video call nerves', short: 'Video call', icon: 'video', unlock: 4, hours: 1, weight: 2, wiki: 'Video calls: can you hear me now?', how: 'Pick the right camera, microphone and speaker.' },
  calendar: { name: 'Double booking', short: 'Calendar', icon: 'calendar', unlock: 5, hours: 2, weight: 2, wiki: 'The shared calendar, explained with biscuits', how: 'Fit every session into the week without a clash.' },
};
export const TYPE_IDS = Object.keys(TYPES);

// Opening lines. {device} and {doc} come from the person.
export const STORIES = {
  reboot: [
    ['My {device} has frozen on a little spinning wheel.', 'It has been spinning since breakfast. I think it is tired.'],
    ['Everything has gone slow. It is like wading through custard.', 'I clicked one thing nine times. Was that bad?'],
    ['It says "not responding".', 'I said "me neither" and came to find you.'],
  ],
  cables: [
    ['I moved my desk to catch the afternoon sun, and now nothing is plugged into anything.', 'There are a lot of cables. They all look like liquorice.'],
    ['Kettle went exploring behind my {device}.', 'Things have come unplugged. He looked very pleased with himself.'],
    ['I unplugged one thing to make room for a lamp.', 'It turns out it was the important thing.'],
  ],
  diagnosis: [
    ['Something is wrong with my {device} and I cannot even describe it properly.', 'Ask me anything. I will try to be useful.'],
    ['My {device} is doing A Thing.', 'I do not know what I did. I may have done nothing. That might be the problem.'],
    ['It worked yesterday. Today it does not.', 'Nothing has changed. Something has definitely changed.'],
  ],
  printer: [
    ['The printer ate my {doc}.', 'Now it is making a noise like a sad accordion.'],
    ['There is a paper jam. I can see the paper.', 'The paper can see me. Neither of us can move.'],
    ['It printed half a page, sighed, and stopped.', 'I know how it feels, but I do need the other half.'],
  ],
  password: [
    ['I have forgotten my password again.', 'I am fairly sure it had a seven in it. Or a Q.'],
    ['The {device} wants a new password. It says my old one is "too weak".', 'Rude. Accurate, but rude.'],
    ['I wrote my password on a sticky note, and then I tidied my desk.', 'I regret both things.'],
  ],
  wifi: [
    ['The Wi-Fi reaches the doorway and then gives up.', 'I have been working in the doorway. People keep saying excuse me.'],
    ['My {device} only gets internet if I hold it above my head.', 'My arms are tired.'],
    ['We rearranged the furniture and the Wi-Fi took it personally.', 'Could you find it a better spot?'],
  ],
  inbox: [
    ['I have fourteen new e-mails and at least one prince.', 'Which of these are real?'],
    ['Something in my inbox says my account will be closed in one hour.', 'That was three hours ago. Should I worry?'],
    ['Could you look through my mail with me?', 'Some of it smells fishy, and not in the good way.'],
  ],
  desktop: [
    ['I cannot find anything on my {device}.', 'My desktop looks like a dropped deck of cards.'],
    ['Every file I own is called "final".', 'Some are called "final final". One is called "final USE THIS ONE".'],
    ['I have been saving everything to the desktop for six years.', 'It is a system. It has stopped working.'],
  ],
  desktop_find: [
    ['I deleted my {doc}. On purpose! But the wrong one.', 'Is it gone for ever? Please say it is not gone for ever.'],
    ['I was tidying up and tidied a bit too hard.', 'There was a file. Now there is not a file.'],
  ],
  videocall: [
    ['I have a video call at four. Last time they could only see my ceiling.', 'It is a nice ceiling, but still.'],
    ['They say they cannot hear me.', 'I have tried speaking louder. And slower. And with gestures.'],
    ['My camera shows a black square.', 'I have checked: I am not a black square.'],
  ],
  calendar: [
    ['We have double-booked the common room again.', 'Two groups, one room, one biscuit tin.'],
    ['Could you help us share the back room?', 'We keep arriving at the same time and being very polite about it.'],
    ['Our week is a muddle.', 'Everyone is free on Wednesday and nobody is free on Wednesday. You see the issue.'],
  ],
};

// Bespoke openers for particular people; used instead of a generic one when they match.
export const SPECIAL_STORIES = {
  'vogel:videocall': ['My granddaughter Mina is calling from Wellington at four.', 'Last time she saw only my ceiling, and told me it needed painting.'],
  'rashid:cables': ['Somebody has unplugged the mixing desk.', 'I am not naming names, but he is grey, round, and asleep on the amplifier.'],
  'bea:printer': ['The label printer has jammed halfway through "sourdough".', 'It currently says "sour". That feels pointed.'],
  'juno:password': ['Gary set the club laptop password and now Gary will not tell me.', 'Gary is a robot. I may have made him too independent.'],
  'dot:inbox': ['A very polite prince has written to me, dear.', 'He wants my bank details, and he has spelled "kindly" four different ways.'],
  'ilse:reboot': ['My laptop froze at three this morning, in the middle of a sentence.', 'I have been staring at half a verb for hours.'],
  'fern:wifi': ['The Wi-Fi cannot get through the monstera.', 'I am not moving the monstera. The monstera was here first.'],
  'pip:desktop': ['I have four hundred files called "zine_final".', 'One of them is the real one. I believe in you.'],
};

// Reply choices after a fix. Practical ones add a note towards a wiki page.
export const REPLIES = {
  kind: ['Any time. That is what I am here for.', 'Honestly, it was a pleasure.', 'You did the hard part by asking.', 'Come and find me whenever. Truly.'],
  funny: {
    reboot: 'The computer just needed a nap. Don\'t we all.',
    cables: 'I have seen spaghetti with a better filing system.',
    diagnosis: 'Elementary, my dear neighbour.',
    printer: 'The printer and I have had words. It apologises.',
    password: 'Your secret is safe with me. Mostly because I have already forgotten it.',
    wifi: 'The Wi-Fi was shy. It has come out of its shell.',
    inbox: 'If a prince ever does write to you, I will let you know.',
    desktop: 'Your desktop can see its own wallpaper for the first time in years.',
    videocall: 'You look great. Your ceiling looked great too, to be fair.',
    calendar: 'Nobody has to share a chair. Historic.',
  },
  practical: {
    reboot: 'If it freezes again: hold the button, count to ten, start it up. I will write that down for you.',
    cables: 'I will sketch which cable goes where and tape it under the desk.',
    diagnosis: 'Next time, check the plug and the cat first. I will make a little checklist.',
    printer: 'Open the flaps in the order the paper goes. I will leave a note on the lid.',
    password: 'Four words you love beat one word you hate. I will write up how.',
    wifi: 'Routers like to be high up and out in the open. I will jot that down.',
    inbox: 'If it is urgent, odd, and asks for a password: bin it. I will write up the tells.',
    desktop: 'One folder per kind of thing. I will write a two-line guide.',
    videocall: 'Camera, microphone, speaker: check each once before the call. I will make a card.',
    calendar: 'I will pin the new timetable on the door so everyone can see it.',
  },
  response: {
    kind: ['Oh, you are lovely.', 'That is very kind. Thank you.', 'We are lucky to have you in the building.'],
    funny: ['Ha! Stop it.', 'Oh, that is terrible. I love it.', 'You should be on the radio.'],
    practical: ['Ooh, yes please. I will pin it up.', 'A note! I do love a note.', 'That is exactly what I needed. Thank you.'],
  },
};

export const EXPIRE_LINES = [
  '{name} borrowed the library computer instead. No harm done.',
  '{name} worked around it with a lot of sticky notes.',
  '{name} asked the neighbours, and they muddled through together.',
  '{name} decided it could wait until next month.',
];

export const PREVENT_LINES = {
  wiki: '{name} fixed it alone, using your wiki page.',
  upgrade: '{name} never even noticed a problem, thanks to {by}.',
  event: '{name} got a hand from a neighbour instead.',
};

// ---- Puzzle raw material ----

export const CABLE_DEVICES = ['monitor', 'printer', 'speaker', 'router', 'lamp', 'keyboard', 'scanner', 'radio'];
export const CABLE_COLORS = ['#f27d6b', '#f6a81c', '#58b98f', '#5aa7e0', '#a98be6', '#ef7fb1'];
export const CABLE_SHAPES = ['circle', 'square', 'triangle', 'hex', 'diamond', 'pill'];

export const WEAK_WORDS = ['password', '123456', 'qwerty', 'letmein', 'abc123', 'password1', 'iloveyou', 'admin'];
export const PLAIN_WORDS = ['table', 'window', 'spoon', 'carpet', 'tuesday', 'pencil', 'bucket', 'curtain', 'gravel', 'ladder'];
export const NUMBER_CARDS = ['42', '87', '1952', '212', '9', '64'];

export const CALENDAR_GROUPS = [
  { name: 'Knight Owls', color: '#b79be0' }, { name: 'Bolt Club', color: '#f6c445' }, { name: 'Salsa class', color: '#f27d6b' },
  { name: 'Zine night', color: '#f08aa6' }, { name: 'Moss society', color: '#7cc79a' }, { name: 'Radio rehearsal', color: '#5aa7e0' },
  { name: 'Choir', color: '#f2a65a' }, { name: 'Knitting circle', color: '#8fb6e8' },
];

// Mail. Friendly senders live at marigold.house. `tell` is shown when a phish is missed.
export const MAIL_FRIENDLY = [
  { from: 'Bea Okafor', addr: 'bea@marigold.house', subject: 'Leftover buns on the landing', body: 'There are six cardamom buns on the second-floor landing. First come, first served. Reg, that means one each.' },
  { from: 'Dot Whitlow', addr: 'dot@marigold.house', subject: 'Tournament ladder', body: 'Dear all, the ladder is pinned up. I am at the top. This is not a mistake.' },
  { from: 'Fern Castellanos', addr: 'fern@marigold.house', subject: 'Who wants a spider plant', body: 'The spider plant has had babies again. Free to good homes. They are very forgiving.' },
  { from: 'Rashid Mirza', addr: 'rashid@marigold.house', subject: 'Song requests for Friday', body: 'Send me your requests for the Friday show. No more than two sea shanties per person, please.' },
  { from: 'Pip Aldana', addr: 'pip@marigold.house', subject: 'Zine folding party', body: 'Thursday, my room, 200 zines to fold. I will supply biscuits and a long-arm stapler.' },
  { from: 'Juno Park', addr: 'juno@marigold.house', subject: 'Has anyone seen Gary', body: 'Gary rolled off somewhere. He is a small robot with one googly eye. He answers to "Gary".' },
  { from: 'Mr Vogel', addr: 'vogel@marigold.house', subject: 'Trousers ready', body: 'The grey trousers are ready for collection. I have also, unasked, repaired the pocket.' },
  { from: 'Ilse Novak', addr: 'ilse@marigold.house', subject: 'Quiet hours', body: 'A gentle reminder that I sleep between nine and two. In the daytime. Thank you for tiptoeing.' },
  { from: 'Marigold House', addr: 'notices@marigold.house', subject: 'Boiler service on Tuesday', body: 'The boiler man is coming on Tuesday morning. The third stair may be cold. The boiler is fine, he just likes to visit.' },
  { from: 'Marigold House', addr: 'notices@marigold.house', subject: 'Bins go out on Thursday', body: 'Recycling this week. Please flatten boxes. Kettle will sit in them otherwise.' },
  { from: 'Library on Marigold St', addr: 'desk@marigoldlibrary.org', subject: 'Your book is ready', body: 'The book you reserved is waiting at the front desk. We will hold it for a week.' },
  { from: 'Your IT person', addr: 'it@marigold.house', subject: 'I will never ask for your password', body: 'Just a note: I will never, ever ask for your password by e-mail. If something asks, it is not me. Come and knock instead.' },
];

export const MAIL_PHISH = [
  { from: 'IT Departmnet', addr: 'admin@marig0ld-house.biz', subject: 'URGENT: account closing in 1 hour', body: 'Your acount will be deleted in 1 HOUR. Reply with your password to keep it.', tell: 'It asks for a password, it is in a hurry, and "marig0ld" has a zero in it.', level: 1 },
  { from: 'Prince Alarik', addr: 'royal.prince@kingdom-mail.win', subject: 'Kindly assist a prince', body: 'Dearest friend, I wish to share my fortune of 14 million. Kindley send your bank details today.', tell: 'A stranger offering a fortune for your bank details. Real princes rarely e-mail.', level: 1 },
  { from: 'Prize Team', addr: 'winner@free-cruise-now.click', subject: 'You WON a cruise!!!', body: 'Congratulations!!! You are our lucky winner. Click here in the next 10 minutes to claim your free cruise!!!', tell: 'A prize you never entered for, a countdown, and far too many exclamation marks.', level: 1 },
  { from: 'Kettle the Cat', addr: 'kettle@definitely-a-cat.biz', subject: 'need tuna money', body: 'Hello it is me, Kettle, your cat. Please send card number for tuna. Meow. Thank you.', tell: 'Kettle cannot type. Also, Kettle would never say thank you.', level: 1 },
  { from: 'Parcel Service', addr: 'track@parcel-redelivery.top', subject: 'Parcel waiting: pay 1.99', body: 'We missed you! Pay a small 1.99 fee with your card details to arrange redelivery of your parcel.', tell: 'Nobody ordered a parcel, and it wants card details for a "small fee".', level: 2 },
  { from: 'Marigold House', addr: 'notices@marigold-house.co', subject: 'New door code: confirm your details', body: 'To receive the new door code, please confirm your e-mail password using the secure form.', tell: 'The real address is marigold.house, and no door code needs your e-mail password.', level: 2 },
  { from: 'Your Bank', addr: 'security@bank-of-secure-banking.info', subject: 'Unusual sign-in', body: 'We noticed an unusual sign-in. Verify your account now by entering your PIN, or it will be frozen.', tell: 'A bank will never ask for your PIN by e-mail, and "Bank of Secure Banking" is trying too hard.', level: 2 },
  { from: 'Bea Okafor', addr: 'bea@marigo1d.house', subject: 'quick favour', body: 'Hi its Bea, I am stuck abroad and need you to buy gift cards urgently. Do not call me, just reply.', tell: 'Bea is downstairs covered in flour. Look closely: "marigo1d" has a number one in it.', level: 3 },
  { from: 'IT Support', addr: 'it@marigold.house.support-desk.xyz', subject: 'Password expires today', body: 'Your password expires today. Keep the same password by signing in at the link below.', tell: 'The address only starts like ours: it really ends in support-desk.xyz. And your IT person never asks by e-mail.', level: 3 },
  { from: 'Dot Whitlow', addr: 'dot@marigold.house.co', subject: 'See this photo of you!', body: 'Is this you in this photo?? Open the attachment: photo.jpg.exe', tell: 'The address has an extra ".co", and a photo should never end in ".exe".', level: 3 },
];

// Diagnosis: families of symptoms. Each question has answer texts; map gives which answer each cause produces.
export const DIAG = [
  {
    id: 'black', symptom: 'The screen is completely black.',
    causes: {
      monitor_off: { name: 'The monitor is switched off', fix: 'One press of the little button on the monitor, and there it all was.' },
      unplugged: { name: 'The computer is unplugged', fix: 'The plug had slipped out behind the desk. Back in it goes.' },
      asleep: { name: 'It is just asleep', fix: 'A tap on the space bar, and it woke up looking refreshed.' },
      cat_power: { name: 'Kettle is sitting on the power switch', fix: 'Kettle has been gently relocated. The power strip glows again.', cat: true },
      brightness: { name: 'The brightness is turned to zero', fix: 'Brightness back up. Everything was there all along, in the dark.' },
    },
    questions: [
      { q: 'Is there a little light on the monitor?', a: ['No light at all.', 'A sleepy amber light.', 'A steady green light.'], map: { monitor_off: 0, unplugged: 1, asleep: 1, cat_power: 0, brightness: 2 } },
      { q: 'Can you hear the computer humming?', a: ['Yes, humming away.', 'Not a sound.', 'Very faintly, like a sigh.'], map: { monitor_off: 0, unplugged: 1, asleep: 2, cat_power: 1, brightness: 0 } },
      { q: 'Where is Kettle right now?', a: ['Asleep on the server, as usual.', 'Under the desk, on something warm. Purring.'], map: { monitor_off: 0, unplugged: 0, asleep: 0, cat_power: 1, brightness: 0 } },
      { q: 'What happens if you wiggle the mouse?', a: ['Nothing at all.', 'Oh! The light changed colour.'], map: { monitor_off: 0, unplugged: 0, asleep: 1, cat_power: 0, brightness: 0 } },
    ],
  },
  {
    id: 'typing', symptom: 'Everything I type comes out wrong.',
    causes: {
      caps_lock: { name: 'Caps lock is on', fix: 'One tap on caps lock. No more shouting.' },
      cat_keys: { name: 'Kettle is lying on the keyboard', fix: 'Kettle has been moved to a sunbeam. The keyboard is free.', cat: true },
      num_lock: { name: 'Num lock is off', fix: 'Num lock back on. The numbers are numbers again.' },
      sticky: { name: 'There is jam under a key', fix: 'One cotton bud later, the E key is un-jammed. Literally.' },
      layout: { name: 'The keyboard is set to another language', fix: 'Keyboard set back to the right language. The Z and Y are home.' },
    },
    questions: [
      { q: 'What does it look like when you type "hello"?', a: ['HELLO, in capitals.', 'hhhhhhhhhhhjjjjkkk, and it keeps going.', 'hllo. One letter is missing.', 'It looks fine, actually.'], map: { caps_lock: 0, cat_keys: 1, num_lock: 3, sticky: 2, layout: 3 } },
      { q: 'Is anything warm or furry near the keyboard?', a: ['No, just my tea.', 'Now that you mention it, yes. It is purring.'], map: { caps_lock: 0, cat_keys: 1, num_lock: 0, sticky: 0, layout: 0 } },
      { q: 'Do the number keys on the right work?', a: ['Yes, perfectly.', 'No! They move the cursor about instead.'], map: { caps_lock: 0, cat_keys: 0, num_lock: 1, sticky: 0, layout: 0 } },
      { q: 'What happens when you press Z?', a: ['I get a Z.', 'I get a Y. How odd.', 'I get a great many Zs.'], map: { caps_lock: 0, cat_keys: 2, num_lock: 0, sticky: 0, layout: 1 } },
    ],
  },
  {
    id: 'sound', symptom: 'There is no sound at all.',
    causes: {
      muted: { name: 'The sound is muted', fix: 'Un-muted. There was a little crossed-out speaker all along.' },
      headphones: { name: 'Headphones are plugged in', fix: 'The headphones were plugged in and playing to an empty drawer.' },
      knob: { name: 'The speaker knob is at zero', fix: 'The knob on the speaker was turned all the way down. Up it goes.' },
      spk_unplugged: { name: 'The speakers are unplugged', fix: 'Speaker cable back in its socket. Music.' },
      elsewhere: { name: 'The sound is playing somewhere else', fix: 'It was connected to the bakery\'s wireless speaker. Bea has been enjoying your podcasts.' },
    },
    questions: [
      { q: 'What does the little speaker on the screen look like?', a: ['It has a small cross on it.', 'It looks normal.', 'It shows a pair of headphones.', 'It says "Crumb & Co. Speaker" next to it.'], map: { muted: 0, headphones: 2, knob: 1, spk_unplugged: 1, elsewhere: 3 } },
      { q: 'Is the little light on the speakers lit?', a: ['Yes, it is on.', 'No light.'], map: { muted: 0, headphones: 0, knob: 0, spk_unplugged: 1, elsewhere: 0 } },
      { q: 'Which way is the knob on the speaker pointing?', a: ['About halfway.', 'All the way to the left.'], map: { muted: 0, headphones: 0, knob: 1, spk_unplugged: 0, elsewhere: 0 } },
      { q: 'Can you hear it anywhere else?', a: ['No, silence.', 'Funny you ask. The bakery has been playing my podcast.', 'Very faintly, from inside my desk drawer.'], map: { muted: 0, headphones: 2, knob: 0, spk_unplugged: 0, elsewhere: 1 } },
    ],
  },
  {
    id: 'net', symptom: 'The internet has stopped working.',
    causes: {
      airplane: { name: 'Aeroplane mode is on', fix: 'Aeroplane mode off. The laptop has landed.' },
      cable_out: { name: 'The network cable has fallen out', fix: 'The network cable clicked back in. That click is a lovely sound.' },
      cat_router: { name: 'Kettle unplugged the router', fix: 'Kettle was asleep on the router and had nudged its plug out. Both are fine.', cat: true },
      wrong_net: { name: 'It joined the cafe Wi-Fi next door', fix: 'It had quietly joined the cafe next door. Back on the house network now.' },
      wifi_switch: { name: 'The Wi-Fi switch is off', fix: 'There is a tiny Wi-Fi switch on the side of the laptop. It was off.' },
    },
    questions: [
      { q: 'Is there a little aeroplane in the corner of the screen?', a: ['Yes! A tiny aeroplane.', 'No aeroplane.'], map: { airplane: 0, cable_out: 1, cat_router: 1, wrong_net: 1, wifi_switch: 1 } },
      { q: 'Are the lights on the router blinking?', a: ['Blinking happily.', 'All dark. And there is a cat on it.'], map: { airplane: 0, cable_out: 0, cat_router: 1, wrong_net: 0, wifi_switch: 0 } },
      { q: 'Which network does it say it is on?', a: ['It says Marigold House.', 'It says "CafeGuest_Free".', 'It does not list any networks.', 'It says "cable unplugged".', 'It says "Wi-Fi is turned off".'], map: { airplane: 2, cable_out: 3, cat_router: 2, wrong_net: 1, wifi_switch: 4 } },
      { q: 'Does anyone else have internet?', a: ['Yes, everyone else is fine.', 'No, the whole floor is out.'], map: { airplane: 0, cable_out: 0, cat_router: 1, wrong_net: 0, wifi_switch: 0 } },
    ],
  },
  {
    id: 'mouse', symptom: 'The mouse will not move the pointer.',
    causes: {
      upside: { name: 'The mouse is upside down', fix: 'The mouse was on its back. Turned over, it works beautifully.' },
      battery: { name: 'The mouse battery is flat', fix: 'Two fresh batteries. The mouse lives.' },
      sticker: { name: 'A sticker is covering the sensor', fix: 'A price sticker was still over the sensor. Peeled off.' },
      dongle: { name: 'Its little receiver is unplugged', fix: 'The tiny receiver was in the pen pot. Plugged back in.' },
      not_mouse: { name: 'That is not the mouse', fix: 'That was the stapler. The mouse was under the newspaper.' },
    },
    questions: [
      { q: 'Is there a red glow underneath it?', a: ['No glow at all.', 'There is a glow, on top, pointing at the ceiling.', 'A faint glow behind a bit of paper.', 'Yes, a red glow underneath.'], map: { upside: 1, battery: 0, sticker: 2, dongle: 3, not_mouse: 0 } },
      { q: 'What does it do when you click it?', a: ['A normal little click.', 'It goes ker-CHUNK.'], map: { upside: 0, battery: 0, sticker: 0, dongle: 0, not_mouse: 1 } },
      { q: 'Is there a tiny plug in the side of the computer?', a: ['Yes, a tiny one.', 'No. Although there is one in my pen pot.'], map: { upside: 0, battery: 0, sticker: 0, dongle: 1, not_mouse: 0 } },
      { q: 'When did it last work?', a: ['This morning.', 'Not since I bought it.', 'It faded out slowly over the week.'], map: { upside: 0, battery: 2, sticker: 1, dongle: 0, not_mouse: 0 } },
    ],
  },
  {
    id: 'webcam', symptom: 'The webcam only shows darkness.',
    causes: {
      note: { name: 'A sticky note is over the lens', fix: 'There was a sticky note over the lens. It said "buy milk".' },
      shutter: { name: 'The privacy shutter is closed', fix: 'A tiny slider above the lens was closed. Slid open: hello, face.' },
      wrong_cam: { name: 'It is using the wrong camera', fix: 'It was using the camera on the back, pointing into the desk.' },
      cat_cam: { name: 'Kettle is in front of the camera', fix: 'The darkness was Kettle, very close up. He has been bribed away.', cat: true },
      lights_off: { name: 'The room lights are off', fix: 'The lamp is on now. It turns out cameras need light. Who knew.' },
    },
    questions: [
      { q: 'Is the darkness completely black, or a bit fuzzy?', a: ['Completely black.', 'Fuzzy and grey. And it moves.', 'Dark, but I can see shapes.', 'Yellowish, actually.'], map: { note: 3, shutter: 0, wrong_cam: 2, cat_cam: 1, lights_off: 2 } },
      { q: 'Is the little light next to the camera on?', a: ['Yes, it is lit.', 'No light.'], map: { note: 0, shutter: 0, wrong_cam: 1, cat_cam: 0, lights_off: 0 } },
      { q: 'Is the lamp on in there?', a: ['Yes, it is bright.', 'Ah. No. I like the dusk.'], map: { note: 0, shutter: 0, wrong_cam: 0, cat_cam: 0, lights_off: 1 } },
      { q: 'Can you hear purring?', a: ['No purring.', 'A great deal of purring, yes.'], map: { note: 0, shutter: 0, wrong_cam: 0, cat_cam: 1, lights_off: 0 } },
    ],
  },
];

// Files for the desktop puzzles. kind: photo, doc, music, sheet.
export const FILE_KINDS = {
  photo: { folder: 'Pictures', ext: 'jpg' },
  doc: { folder: 'Writing', ext: 'txt' },
  music: { folder: 'Music', ext: 'mp3' },
  sheet: { folder: 'Numbers', ext: 'xls' },
};
export const FILE_NAMES = {
  photo: ['kettle_asleep', 'kettle_asleep_2', 'holiday_beach', 'the_goose_lamp', 'open_day_poster', 'gary_the_robot', 'saturn_blurry', 'best_loaf_ever', 'stairwell_lights', 'reg_losing'],
  doc: ['letter_to_council', 'rye_recipe', 'meeting_notes', 'poem_draft', 'shopping_list', 'zine_page_four', 'thank_you_note', 'play_act_one', 'quiz_answers', 'house_rules'],
  music: ['tango_mix', 'jingle_take_9', 'boiler_in_b_flat', 'rainy_day_songs', 'opera_sunday', 'whale_song', 'margin_error_demo', 'stairs_recording'],
  sheet: ['budget_march', 'tournament_ladder', 'watering_rota', 'flour_orders', 'raffle_tickets', 'members_list', 'opening_hours', 'bake_sale_takings'],
};
export const SHARED_FOLDERS = ['Scans', 'Notes', 'Songs', 'Lists'];
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Video call devices. good: the one that works. Others have a funny reason.
export const CALL_DEVICES = {
  cam: {
    label: 'Camera', good: ['Clip-on camera', 'Laptop camera', 'Little round webcam'],
    bad: [['Document scanner', 'Shows the inside of the scanner lid.'], ['Back camera', 'A lovely view of the desk.'], ['Doorbell camera', 'That is the front step.'], ['Virtual camera 2', 'Shows a grey square with a question mark.']],
  },
  mic: {
    label: 'Microphone', good: ['Headset microphone', 'Laptop microphone', 'Desk microphone'],
    bad: [['Microphone (unplugged)', 'A flat line. Nobody home.'], ['Hallway intercom', 'You can hear the stairs creak.'], ['Karaoke machine', 'A great deal of echo.'], ['Line in', 'A faint hiss, like a distant sea.']],
  },
  spk: {
    label: 'Speaker', good: ['Desk speakers', 'Laptop speakers', 'Headset'],
    bad: [['Monitor (no speakers)', 'Silence. The monitor has no speakers.'], ['Bakery wireless speaker', 'Somewhere downstairs, a ding.'], ['Drawer headphones', 'Tinny music from inside a drawer.'], ['Fax line', 'An alarming screech.']],
  },
};
