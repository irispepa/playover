// How to play: one topic per page, each with a small picture built in code. Facts come from data.js.
import { icon, glyph } from './icons.js';
import {
  CLASSES, CLASS_ORDER, ABILITIES, RARITIES, WEAPONS, ARMORS, TRINKETS, PERK_TAGS, SYNERGIES, isShopFloor, isBossFloor, biomeFor,
} from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = (n) => `#${(n >>> 0).toString(16).padStart(6, '0')}`;

// ---------------------------------------------------------------- page 1: controls diagram
// A phone screen drawn to scale from the real HUD layout (style.css, 390 x 844 pt), labelled on both sides.
function controlsPic(classId) {
  const s = 140 / 390, ox = 90, oy = 5;
  const X = (v) => +(ox + v * s).toFixed(1), Y = (v) => +(oy + v * s).toFixed(1), S = (v) => +(v * s).toFixed(1);
  const zoneTop = Y(844 * 0.22); // input.js ignores touches in the top 22% of the screen
  const [a1, a2] = CLASSES[classId] ? CLASSES[classId].abilities.map((a) => ABILITIES[a].icon) : ['spark', 'spark'];
  // Button centres and radii from the CSS (right/bottom offsets turned into x/y).
  const btn = (cx, cy, d, ic, col, big) => {
    const r = S(d / 2), g = S(d * (big ? 0.42 : 0.46));
    return `<circle cx="${X(cx)}" cy="${Y(cy)}" r="${r}" fill="#1f2536" stroke="#ffffff55" stroke-width="1"/>${glyph(ic, +(X(cx) - g / 2).toFixed(1), +(Y(cy) - g / 2).toFixed(1), g, col)}`;
  };
  const dash = [336, 782], ab1 = [254, 794], ab2 = [336, 698], pot = [265, 719], bomb = [187, 795];
  const line = (pts) => `<path d="M${pts.map((p) => p.join(' ')).join(' L')}" fill="none" stroke="#ffffff66" stroke-width="0.8"/>`;
  const lblR = (y, t) => `<text x="244" y="${y + 3.5}" class="dv-svl">${t}</text>`;
  const lblL = (y, t) => `<text x="82" y="${y + 3.5}" class="dv-svl" text-anchor="end">${t}</text>`;
  return `<svg class="dv-pic dv-picctl" viewBox="0 0 320 324" role="img" aria-label="Phone screen showing where the controls are">
    <defs><clipPath id="dv-phone"><rect x="${ox}" y="${oy}" width="140" height="${S(844)}" rx="14"/></clipPath></defs>
    <rect x="${ox}" y="${oy}" width="140" height="${S(844)}" rx="14" fill="#0b0f18"/>
    <rect x="${ox}" y="${zoneTop}" width="140" height="${(Y(844) - zoneTop).toFixed(1)}" fill="#5ea8ff" fill-opacity="0.1" clip-path="url(#dv-phone)"/>
    <rect x="${ox}" y="${oy}" width="140" height="${S(844)}" rx="14" fill="none" stroke="#46506a" stroke-width="1.5"/>
    <path d="M${ox} ${zoneTop} H${ox + 140}" stroke="#5ea8ff" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="${ox + 70}" y="${zoneTop + 24}" class="dv-svz" text-anchor="middle">Drag anywhere</text>
    <text x="${ox + 70}" y="${zoneTop + 36}" class="dv-svz" text-anchor="middle">below the line</text>
    <circle cx="${X(150)}" cy="${Y(560)}" r="18" fill="#ffffff14" stroke="#ffffff70" stroke-width="1"/>
    <circle cx="${X(150) + 7}" cy="${Y(560) - 6}" r="8" fill="#ffffff88"/>
    <circle cx="${X(195)}" cy="${Y(330)}" r="5" fill="#5a8ad0" stroke="#d8dee8" stroke-width="1"/>
    <rect x="${X(10)}" y="${Y(8)}" width="${S(218)}" height="${S(18)}" rx="2" fill="#c2303a"/>
    <rect x="${X(10)}" y="${Y(30)}" width="${S(218)}" height="${S(12)}" rx="2" fill="#2f74d0"/>
    <rect x="${X(282)}" y="${Y(8)}" width="${S(46)}" height="${S(46)}" rx="4" fill="#1f2536" stroke="#ffffff55" stroke-width="0.8"/>${glyph('pause', X(287), Y(13), S(36), '#eef2f7')}
    <rect x="${X(334)}" y="${Y(8)}" width="${S(46)}" height="${S(46)}" rx="4" fill="#1f2536" stroke="#ffffff55" stroke-width="0.8"/>${glyph('bag', X(339), Y(13), S(36), '#eef2f7')}
    <rect x="${X(284)}" y="${Y(60)}" width="${S(96)}" height="${S(96)}" rx="4" fill="#141a26" stroke="#ffffff55" stroke-width="0.8"/>
    <path d="M${X(300)} ${Y(110)} H${X(340)} V${Y(80)} M${X(330)} ${Y(110)} V${Y(140)}" stroke="#7880a0" stroke-width="2.5" fill="none"/>
    <rect x="${X(228)}" y="${Y(600)}" width="${S(150)}" height="${S(48)}" rx="${S(24)}" fill="#e2a238"/>
    ${glyph('hand', X(240), Y(610), S(28), '#241604')}<text x="${X(270)}" y="${Y(632)}" class="dv-svb">Descend</text>
    ${btn(...ab2, 64, a2, '#ffe8b0')}${btn(...pot, 50, 'potion', '#ff6070')}${btn(...bomb, 50, 'bomb', '#c8ccd8')}${btn(...ab1, 64, a1, '#ffe8b0')}${btn(...dash, 80, 'dash', '#d8e8ff', true)}
    ${line([[X(380) + 1, Y(31)], [240, Y(31)]])}${lblR(Y(31), 'Pause, bag')}
    ${line([[X(380) + 1, Y(108)], [240, Y(108)]])}${lblR(Y(108), 'Map')}
    ${line([[X(378) + 1, Y(624)], [240, Y(624)]])}${lblR(Y(624), 'Action')}
    ${line([[X(336 + 32) + 1, Y(698)], [240, Y(698)]])}${lblR(Y(698), 'Skill 2')}
    ${line([[X(336 + 40) + 1, Y(782)], [240, Y(782)]])}${lblR(Y(782), 'Dash')}
    ${line([[X(10) - 1, Y(25)], [86, Y(25)]])}${lblL(Y(25) - 3, 'Health')}${lblL(Y(25) + 10, 'and energy')}
    ${line([[X(265 - 25) - 1, Y(719)], [86, Y(719)]])}${lblL(Y(719), 'Potion')}
    ${line([[X(187 - 25) - 1, Y(795)], [86, Y(795)]])}${lblL(Y(795), 'Bomb')}
    ${line([[X(254), Y(794 + 32) + 1], [X(254), 316], [86, 316]])}${lblL(316, 'Skill 1')}
  </svg>`;
}

// ---------------------------------------------------------------- page 2: fighting and telegraphs
function fightPic() {
  return `<svg class="dv-pic" viewBox="0 0 320 150" role="img" aria-label="A red circle on the floor marks where an attack will land">
    <rect x="4" y="4" width="312" height="142" rx="12" fill="#151a24" stroke="#2f3d52"/>
    <path d="M4 52H316M4 100H316M60 4V146M116 4V146M172 4V146M228 4V146M284 4V146" stroke="#ffffff0d"/>
    <circle cx="178" cy="78" r="40" fill="#ff3a28" fill-opacity="0.2" stroke="#ff3a28" stroke-width="2"/>
    <path d="M292 30 L120 86" stroke="#ff3a28" stroke-opacity="0.45" stroke-width="9" stroke-linecap="round"/>
    <circle cx="300" cy="26" r="9" fill="#c9c1a8"/>
    <circle cx="186" cy="64" r="14" fill="#ff3020"/><circle cx="186" cy="64" r="19" fill="none" stroke="#ff3020" stroke-opacity="0.5" stroke-width="2"/>
    <path d="M150 110 a40 40 0 0 1 -22 -30" fill="none" stroke="#ffffffcc" stroke-width="3" stroke-linecap="round"/>
    <circle cx="150" cy="98" r="10" fill="#5a8ad0" stroke="#d8dee8" stroke-width="2"/>
    <path d="M140 104 L84 128" stroke="#a0c8ff" stroke-width="2.5" stroke-dasharray="5 4"/>
    <path d="M78 131 l12 -1 -5 -9z" fill="#a0c8ff"/>
    <text x="22" y="24" class="dv-svl">Dash out of the red</text>
  </svg>`;
}

// ---------------------------------------------------------------- page 3: skills and energy
function skillsPic(classId) {
  const c = CLASSES[classId] || CLASSES.warden;
  const cards = c.abilities.map((id, i) => {
    const A = ABILITIES[id];
    return `<div class="dv-hsk"><span class="dv-hskb">${icon(A.icon, 26, '#ffe8b0')}<em>${A.energy}</em></span>
      <span><b>${esc(A.name)}</b><small>Skill ${i + 1} · ${A.energy} energy · ${A.cd} s recharge</small></span></div>`;
  }).join('');
  return `<div class="dv-pic dv-hskills">${cards}
    <div class="dv-hen"><span class="dv-hbar"><i></i></span>${icon('bolt', 14, '#7cc4ff')}<small>Energy refills over time</small></div></div>`;
}

// ---------------------------------------------------------------- page 4: relics and synergies
function relicsPic() {
  const t = PERK_TAGS.fire, S = SYNERGIES.fire;
  const names = ['Ember Heart', 'Kindling', 'Bombardier'];
  const cards = names.map((n) => `<div class="dv-hrel"><b>${esc(n)}</b><span class="dv-tag" style="--tc:${t.color}">${esc(t.name)}</span></div>`).join('');
  return `<div class="dv-pic dv-hrelics"><div class="dv-hrels">${cards}</div>
    <div class="dv-hsyn" style="--tc:${t.color}">${icon('star', 16)}<span><b>${esc(S.name)}</b> ${esc(t.name)} ${S.need}/${S.need}</span></div></div>`;
}

// ---------------------------------------------------------------- page 5: loot
function lootPic() {
  const its = [WEAPONS.sword.icon, ARMORS.leather.icon, TRINKETS.ring.icon, WEAPONS.bow.icon, TRINKETS.amulet.icon];
  const cells = RARITIES.map((r, i) => `<div class="dv-hloot"><span class="dv-cell" style="--rc:${r.color}">${icon(its[i], 24, r.color)}${i === 2 ? `<b class="dv-up">${icon('up', 11)}</b>` : ''}</span><small style="color:${r.color}">${esc(r.name)}</small></div>`).join('');
  return `<div class="dv-pic dv-hloots">${cells}</div>`;
}

// ---------------------------------------------------------------- page 6: keys, vaults, secrets
function vaultPic() {
  return `<svg class="dv-pic" viewBox="0 0 320 130" role="img" aria-label="A key opens a golden door; a bomb opens a cracked wall">
    ${glyph('key', 20, 40, 34, '#ffd24a')}
    <path d="M62 57h18m-6-6 6 6-6 6" stroke="#9aa8bc" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <rect x="86" y="18" width="64" height="80" fill="#2a2f3d"/>
    <path d="M96 98V44a22 22 0 0 1 44 0v54z" fill="#6b4a14" stroke="#ffd24a" stroke-width="3"/>
    <circle cx="118" cy="62" r="4.5" fill="#1a1206"/><path d="M116 64h4l1.5 12h-7z" fill="#1a1206"/>
    <text x="118" y="120" class="dv-svl" text-anchor="middle">Vault door</text>
    ${glyph('bomb', 176, 40, 34, '#c8ccd8')}
    <path d="M218 57h18m-6-6 6 6-6 6" stroke="#9aa8bc" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <rect x="242" y="18" width="64" height="80" fill="#6b6678"/>
    <path d="M242 38h64M242 58h64M242 78h64M262 18v20M286 38v20M262 58v20M286 78v20" stroke="#4a4656" stroke-width="2"/>
    <path d="M270 22l8 14-6 10 10 12-4 14 8 12" stroke="#1a1820" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
    <text x="274" y="120" class="dv-svl" text-anchor="middle">Cracked wall</text>
  </svg>`;
}

// ---------------------------------------------------------------- page 7: floors, shops, bosses
function floorsPic() {
  let cells = '';
  for (let f = 1; f <= 10; f++) {
    const b = biomeFor(f), shop = isShopFloor(f), boss = isBossFloor(f);
    const ic = boss ? icon('crown', 14, '#ff8a7a') : shop ? icon('coin', 14, '#ffcc40') : '';
    cells += `<div class="dv-hfl ${boss ? 'dv-hboss' : ''} ${shop ? 'dv-hshop' : ''}" style="--bc:${hex(b.floor)}"><b>${f}</b>${ic}</div>`;
  }
  return `<div class="dv-pic dv-hfloors"><div class="dv-hfls">${cells}</div>
    <div class="dv-hkey"><span>${icon('coin', 14, '#ffcc40')} Shop</span><span>${icon('crown', 14, '#ff8a7a')} Boss</span><span>Floors 1 to 5: ${esc(biomeFor(1).name)}. 6 to 10: ${esc(biomeFor(6).name)}.</span></div></div>`;
}

// ---------------------------------------------------------------- page 8: death and saving
function deathPic() {
  return `<div class="dv-pic dv-hkeep">
    <div class="dv-hcol dv-hlost"><b>${icon('skull', 18, '#ff8a7a')} Lost</b><span>${icon('bag', 14)} Gear</span><span>${icon('coin', 14, '#ffcc40')} Gold</span><span>${icon('star', 14, '#ffd24a')} Relics</span></div>
    <div class="dv-hcol dv-hkept"><b>${icon('crown', 18, '#ffd24a')} Kept</b><span>${icon('stairs', 14)} Records</span><span>${icon('eye', 14)} Bestiary</span><span>${icon('lock', 14)} Unlocks</span></div>
  </div>`;
}

export function howToPages(classId, keyboard) {
  const shops = [];
  for (let f = 1; shops.length < 3; f++) if (isShopFloor(f)) shops.push(f);
  let bossEvery = 1;
  while (!isBossFloor(bossEvery)) bossEvery++;
  const locked = CLASS_ORDER.filter((id) => CLASSES[id].unlock).map((id) => `Reach floor ${CLASSES[id].unlock.deepest} to unlock the ${CLASSES[id].name}.`);
  const keys = keyboard ? '<p class="dv-hkb">Keyboard: WASD or arrows to move, Space to dash, Q and E for skills, F potion, B bomb, R to use, I for the bag, Esc to pause.</p>' : '';
  return [
    {
      title: 'Controls', pic: controlsPic(classId), extra: keys,
      points: [
        'Drag anywhere below the line to move. The stick appears under your thumb.',
        'Tap the big round button to dash. Your two skills sit beside it.',
        'A gold Action button appears near stairs, shops and shrines.',
        'Tap the map to see the whole floor.',
      ],
    },
    {
      title: 'Fighting', pic: fightPic(),
      points: [
        'You attack on your own. Your weapon hits the nearest enemy in reach.',
        'Red circles and lines show where an attack will land. Get out of the red.',
        'Enemies flash red just before they strike.',
        'You can’t be hurt mid-dash, so dash through attacks.',
      ],
    },
    {
      title: 'Skills and energy', pic: skillsPic(classId),
      points: [
        'Each class has two skills. They aim at the nearest enemy.',
        'The blue number on a skill is its energy cost. Energy refills over time.',
        'A dark sweep shows a skill recharging. A dim skill needs more energy.',
      ],
    },
    {
      title: 'Relics', pic: relicsPic(),
      points: [
        'Each time you level up, choose one of three relics.',
        'Relics carry colour tags. Three of one colour unlock a synergy.',
        'A Shrine of Gifts offers a relic too.',
        'More relics unlock as you slay monsters, go deeper and beat bosses.',
      ],
    },
    {
      title: 'Loot', pic: lootPic(),
      points: [
        'Walk over loot to pick it up. Gold, potions and bombs drift to you.',
        'Open the bag, top right, to compare and equip. A green arrow marks a likely upgrade.',
        'Colour shows rarity, from common grey to legendary orange.',
        'The bag holds 12 items. Salvage spare gear for gold.',
      ],
    },
    {
      title: 'Keys and secrets', pic: vaultPic(),
      points: [
        'A golden door locks a vault. Its key is somewhere on the same floor.',
        'Carry the key and walk into the door to open it.',
        'Cracked walls hide secret rooms. Push into one, or bomb it.',
        'Bombs fly to the nearest enemy, or straight ahead.',
      ],
    },
    {
      title: 'Going deeper', pic: floorsPic(),
      points: [
        'Find the glowing stairs, then tap Descend. Each new floor heals you a little.',
        `A shop waits on floors ${shops.join(', ')} and every five floors after.`,
        `Every ${({ 5: 'fifth' })[bossEvery] || `${bossEvery}th`} floor a boss guards the way. The stairs appear when it falls.`,
        'Every five floors the dungeon changes, with new monsters and hazards.',
      ],
    },
    {
      title: 'Death and saving', pic: deathPic(),
      points: [
        'When you fall, the run is over. Gear, gold and relics are lost.',
        `Records, the bestiary and unlocks stay. ${locked.join(' ')}`.trim(),
        'Your run saves on each new floor, when you pause and when you leave.',
      ],
    },
  ];
}
