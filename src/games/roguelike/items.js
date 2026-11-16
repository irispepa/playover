// Items, loot rolls, perks and derived player stats. Pure: no DOM, no three.js.
import {
  RARITIES, WEAPONS, WEAPON_KEYS, ARMORS, ARMOR_KEYS, TRINKETS, TRINKET_KEYS, AFFIXES, UNIQUES,
  PERKS, SYNERGIES, CLASSES, SCROLL_KEYS, MAX_POTIONS, STAT_INFO,
} from './data.js';

export const ilvlScale = (l) => { const d = Math.max(0, l - 1); return 1 + 0.16 * d + 0.006 * d * d; };
const flatScale = (l) => 1 + 0.12 * Math.max(0, l - 1);

let uidCounter = 0;
function makeUid(rng) { uidCounter = (uidCounter + 1) % 1e6; return `${rng.int(0, 2 ** 30).toString(36)}${uidCounter.toString(36)}`; }

export function rollRarity(rng, ilvl, magicFind = 0, minRarity = 0) {
  const mf = 1 + magicFind;
  const depth = Math.min(1.6, ilvl * 0.035);
  const w = [
    60,
    28 * mf,
    (8 + depth * 6) * mf,
    (1.8 + depth * 2.5) * mf,
    (0.5 + depth * 1.0) * mf,
  ];
  for (let i = 0; i < minRarity; i++) w[i] = 0;
  return rng.weighted(w.map((x, i) => [i, x]));
}

function round2(v) { return Math.round(v * 1000) / 1000; }

function rollAffixes(rng, slotCode, n, ilvl, rarity, exclude) {
  const pool = AFFIXES.filter((a) => a.slots.includes(slotCode) && !exclude.has(a.stat));
  const chosen = rng.shuffle(pool).slice(0, n);
  const mods = {};
  for (const a of chosen) {
    let v = rng.float(a.min, a.max) * (1 + rarity * 0.08);
    if (a.scale) v *= flatScale(ilvl);
    v = a.scale || a.stat === 'maxHp' || a.stat === 'armor' || a.stat === 'thorns' || a.stat === 'flatDmg' ? Math.max(1, Math.round(v)) : round2(v);
    mods[a.stat] = v;
  }
  return { mods, chosen };
}

const RARE_A = ['Grim', 'Dusk', 'Storm', 'Bone', 'Ash', 'Night', 'Blood', 'Iron', 'Frost', 'Gloom', 'Wyrm', 'Star', 'Hollow', 'Ember', 'Rune', 'Dread'];
const RARE_B = { weapon: ['fang', 'bite', 'song', 'edge', 'reaver', 'thorn', 'spite', 'brand'], armor: ['ward', 'shell', 'hide', 'guard', 'mantle', 'aegis'], trinket: ['eye', 'heart', 'tear', 'knot', 'seal', 'coil'] };

export function makeItem(rng, slot, base, ilvl, rarity, opts = {}) {
  const r = RARITIES[rarity];
  const slotCode = slot === 'weapon' ? 'w' : slot === 'armor' ? 'a' : 't';
  const item = { uid: makeUid(rng), slot, base, rarity, ilvl, name: '', mods: {}, fx: null };
  let baseName;
  if (slot === 'weapon') {
    const b = WEAPONS[base];
    baseName = b.name;
    item.dmg = Math.max(1, Math.round(b.dmg * ilvlScale(ilvl) * r.mul * rng.float(0.92, 1.08) * 10) / 10);
  } else if (slot === 'armor') {
    const b = ARMORS[base];
    baseName = b.name;
    item.armor = Math.max(1, Math.round(b.armor * flatScale(ilvl) * r.mul * rng.float(0.9, 1.1)));
  } else {
    baseName = TRINKETS[base].name;
  }
  const n = rng.int(r.affixes[0], r.affixes[1]);
  const { mods, chosen } = rollAffixes(rng, slotCode, n, ilvl, rarity, new Set());
  item.mods = mods;
  if (rarity === 4) {
    const uniq = opts.unique ? UNIQUES.find((u) => u.id === opts.unique) : rng.pick(UNIQUES.filter((u) => u.slot === slot));
    item.unique = uniq.id;
    item.fx = uniq.fx ? { ...uniq.fx } : null;
    if (uniq.stats) for (const [k, v] of Object.entries(uniq.stats)) item.mods[k] = round2((item.mods[k] || 0) + v);
    item.name = uniq.name;
  } else if (rarity >= 2) {
    item.name = `${rng.pick(RARE_A)}${rng.pick(RARE_B[slot])} ${baseName}`;
    item.name = item.name[0].toUpperCase() + item.name.slice(1);
  } else if (rarity === 1) {
    const pre = chosen.find((a) => a.pre), suf = chosen.find((a) => a.suf);
    item.name = [pre ? pre.pre : '', baseName, suf ? suf.suf : ''].filter(Boolean).join(' ');
  } else item.name = baseName;
  item.value = Math.round((8 + ilvl * 3) * r.value);
  return item;
}

export function rollItem(rng, ilvl, opts = {}) {
  const slot = opts.slot || rng.weighted([['weapon', 45], ['armor', 25], ['trinket', 30]]);
  const keys = slot === 'weapon' ? WEAPON_KEYS : slot === 'armor' ? ARMOR_KEYS : TRINKET_KEYS;
  const base = opts.base || rng.pick(keys);
  const rarity = opts.rarity != null ? opts.rarity : rollRarity(rng, ilvl, opts.magicFind || 0, opts.minRarity || 0);
  return makeItem(rng, slot, base, Math.max(1, Math.round(ilvl)), rarity, opts);
}

export function starterGear(rng, classId) {
  const c = CLASSES[classId];
  const weapon = makeItem(rng, 'weapon', c.weapon, 1, 0);
  const armor = makeItem(rng, 'armor', c.armor, 1, 0);
  return { weapon, armor };
}

// Prices for shops.
export function priceOf(item) { return Math.round(item.value * 4.5); }
export function sellValue(item) { return Math.max(1, Math.round(item.value)); }

// ---------------------------------------------------------------- derived stats
const ZERO_STATS = {
  maxHp: 0, hpPct: 0, energyMax: 0, energyRegen: 0, hpRegen: 0, dmgPct: 0, flatDmg: 0, atkSpd: 0, crit: 0, critDmg: 0,
  armor: 0, moveSpd: 0, cdr: 0, lifesteal: 0, thorns: 0, burnCh: 0, poisonCh: 0, chillCh: 0, shockCh: 0, bleedCh: 0,
  goldFind: 0, magicFind: 0, dashCd: 0, pickup: 0, area: 0, abilityDmg: 0, projectiles: 0, pierce: 0,
};

function addStats(s, mods, mul = 1) {
  if (!mods) return;
  for (const k in mods) if (k in s) s[k] += mods[k] * mul;
}
function addFx(fx, add, mul = 1) {
  if (!add) return;
  for (const k in add) fx[k] = (fx[k] || 0) + add[k] * mul;
}

export function perkById(id) { return PERK_MAP[id]; }
const PERK_MAP = Object.fromEntries(PERKS.map((p) => [p.id, p]));

export function tagCounts(perks) {
  const c = {};
  for (const id in perks) {
    const p = PERK_MAP[id];
    if (!p) continue;
    for (const t of p.tags) c[t] = (c[t] || 0) + 1;
  }
  return c;
}

export function computeStats(P) {
  const cls = CLASSES[P.classId];
  const s = { ...ZERO_STATS };
  const fx = {};
  s.maxHp = 100 + (P.level - 1) * 7;
  s.energyMax = 100;
  s.energyRegen = 9;
  s.crit = 0.05;
  s.critDmg = 0.6;
  s.dmgPct = (P.level - 1) * 0.025;
  s.pickup = 1.2;
  addStats(s, cls.stats);
  const eq = P.equip;
  const w = eq.weapon;
  const wb = WEAPONS[w ? w.base : cls.weapon];
  s.weaponBase = w ? w.base : cls.weapon;
  s.weaponKind = wb.kind;
  s.wDmg = w ? w.dmg : wb.dmg;
  addStats(s, wb.implicit);
  for (const slot of ['weapon', 'armor', 'trinket1', 'trinket2']) {
    const it = eq[slot];
    if (!it) continue;
    addStats(s, it.mods);
    if (it.slot === 'armor') { s.armor += it.armor || 0; addStats(s, ARMORS[it.base].implicit); }
    if (it.slot === 'trinket') {
      const tb = TRINKETS[it.base];
      if (tb.scaleImplicit) addStats(s, tb.implicit, 1 + 0.12 * (it.ilvl - 1)); else addStats(s, tb.implicit);
    }
    if (it.fx) addFx(fx, it.fx);
  }
  for (const id in P.perks) {
    const p = PERK_MAP[id];
    if (!p) continue;
    const n = P.perks[id];
    addStats(s, p.stats, n);
    addFx(fx, p.fx, n);
  }
  const tags = tagCounts(P.perks);
  s.synergies = [];
  for (const t in SYNERGIES) {
    const syn = SYNERGIES[t];
    if ((tags[t] || 0) >= syn.need) { s.synergies.push(t); addFx(fx, syn.fx); addStats(s, syn.stats); }
  }
  s.fx = fx;
  // Derived values.
  s.maxHp = Math.max(1, Math.round(s.maxHp * (1 + s.hpPct)));
  s.energyMax = Math.round(s.energyMax);
  s.armorRed = Math.min(0.72, s.armor / (s.armor + 60));
  s.cdr = Math.min(0.55, s.cdr);
  s.dashCdMul = Math.max(0.35, 1 - s.dashCd);
  s.moveSpd = Math.max(-0.3, Math.min(0.8, s.moveSpd));
  s.crit = Math.min(0.85, s.crit);
  s.lifesteal = Math.min(0.25, s.lifesteal * (1 + (fx.lifestealMul || 0)));
  s.hitDmg = (s.wDmg + s.flatDmg) * (1 + s.dmgPct);
  s.rate = wb.rate * (1 + s.atkSpd);
  s.range = wb.kind === 'melee' ? wb.range * (1 + s.area * 0.5) : wb.range;
  s.arc = wb.arc ? Math.min(330, wb.arc * (1 + s.area)) : 0;
  s.knock = wb.knock;
  s.proj = wb.proj || null;
  s.projCount = 1 + Math.round(s.projectiles);
  s.pierceN = (wb.proj ? wb.proj.pierce : 0) + Math.round(s.pierce);
  s.power = s.hitDmg * wb.rate / 1.6; // normalised damage used by abilities and damage-over-time
  s.dps = s.hitDmg * s.rate * (1 + s.crit * s.critDmg) * (wb.kind === 'ranged' ? Math.min(s.projCount, 1 + (s.projCount - 1) * 0.6) : 1);
  s.potionMax = MAX_POTIONS + (fx.alchemist || 0);
  return s;
}

// Stats shown in the inventory comparison.
export const COMPARE_KEYS = ['dps', 'maxHp', 'armor', 'crit', 'critDmg', 'rate', 'moveSpd', 'energyRegen', 'lifesteal', 'cdr'];
export const COMPARE_INFO = {
  dps: { label: 'Damage / sec', icon: 'sword', fmt: 'num' },
  maxHp: { label: 'Max health', icon: 'heart', fmt: 'num' },
  armor: { label: 'Armour', icon: 'shield', fmt: 'num' },
  crit: { label: 'Crit chance', icon: 'star', fmt: 'pct' },
  critDmg: { label: 'Crit damage', icon: 'star', fmt: 'pct' },
  rate: { label: 'Attacks / sec', icon: 'clock', fmt: 'dec' },
  moveSpd: { label: 'Move speed', icon: 'boot', fmt: 'pct' },
  energyRegen: { label: 'Energy regen', icon: 'bolt', fmt: 'dec' },
  lifesteal: { label: 'Lifesteal', icon: 'drop', fmt: 'pct' },
  cdr: { label: 'Cooldowns', icon: 'clock', fmt: 'pct' },
};

export function formatStat(fmt, v) {
  if (fmt === 'pct') return `${Math.round(v * 100)}%`;
  if (fmt === 'dec') return (Math.round(v * 10) / 10).toString();
  return Math.round(v).toString();
}

// Equip `item` into a copy of P to measure the change. slotName: weapon | armor | trinket1 | trinket2
export function previewEquip(P, item, slotName) {
  const before = computeStats(P);
  const Q = { ...P, equip: { ...P.equip, [slotName]: item } };
  const after = computeStats(Q);
  return { before, after };
}

export function itemStatLines(item) {
  const lines = [];
  if (item.slot === 'weapon') {
    const b = WEAPONS[item.base];
    lines.push({ icon: 'sword', label: 'Damage', value: String(item.dmg) });
    lines.push({ icon: 'clock', label: 'Attacks / sec', value: String(b.rate) });
    if (b.implicit) for (const [k, v] of Object.entries(b.implicit)) lines.push(statLine(k, v));
  } else if (item.slot === 'armor') {
    lines.push({ icon: 'shield', label: 'Armour', value: String(item.armor) });
    const imp = ARMORS[item.base].implicit;
    if (imp) for (const [k, v] of Object.entries(imp)) lines.push(statLine(k, v));
  } else {
    const tb = TRINKETS[item.base];
    for (const [k, v] of Object.entries(tb.implicit)) lines.push(statLine(k, tb.scaleImplicit ? Math.round(v * (1 + 0.12 * (item.ilvl - 1))) : v));
  }
  for (const [k, v] of Object.entries(item.mods)) lines.push({ ...statLine(k, v), affix: true });
  return lines;
}

export function statLine(k, v) {
  const info = STAT_INFO[k] || { label: k, icon: 'spark', fmt: 'num' };
  const sign = v >= 0 ? '+' : '−';
  return { icon: info.icon, label: info.label, value: sign + formatStat(info.fmt, Math.abs(v)) };
}

// ---------------------------------------------------------------- perks
export function perkUnlocked(p, meta) {
  if (!p.unlock) return true;
  if (!meta) return false;
  return (meta[p.unlock.stat] || 0) >= p.unlock.n;
}

export function rollPerkChoices(rng, P, meta, count = 3) {
  const owned = tagCounts(P.perks);
  const pool = PERKS.filter((p) => perkUnlocked(p, meta) && (P.perks[p.id] || 0) < p.max);
  const weighted = pool.map((p) => {
    let w = 10;
    if (p.tags.some((t) => owned[t])) w *= 1.7;
    if (p.max === 1) w *= 0.8;
    if (p.id === 'split_shot' || p.id === 'piercing') w *= P.st && P.st.weaponKind === 'ranged' ? 1.3 : 0.7;
    return [p, w];
  });
  const out = [];
  for (let i = 0; i < count && weighted.length; i++) {
    const p = rng.weighted(weighted);
    out.push(p.id);
    weighted.splice(weighted.findIndex((e) => e[0] === p), 1);
  }
  return out;
}

export function lootValueGold(rng, floor, goldFind, mult = 1) {
  return Math.max(1, Math.round((rng.int(2, 6) + floor * 1.2) * mult * (1 + goldFind)));
}

export function randomScroll(rng) { return rng.pick(SCROLL_KEYS); }
