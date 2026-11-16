// Builds one consistent case per seed: who took the Moon Lantern, why, how, and the full set of
// clues that prove it. Also the weekly schedule. Pure: no DOM, deterministic for a given seed.
import { makeRng } from '../../shell/rng.js';
import { SUSPECTS, CAST, TOWNSFOLK, LOCATIONS } from './data/cast.js';
import { TRAIT_CLUES, METHOD_CLUES, ALIBIS, MOTIVES } from './data/clues.js';

export const METHODS = ['key', 'water', 'roof'];
// Pim cannot swim and will not set foot in a boat, so never leaves by the water gate.
export const methodsFor = (culprit) => (culprit === 'pim' ? ['key', 'roof'] : METHODS);

export function allVariants() {
  const out = [];
  for (const culprit of SUSPECTS) for (const motive of ['a', 'b']) for (const method of methodsFor(culprit)) out.push({ culprit, motive, method });
  return out;
}

const PRIORITY = { method: 1, alibi: 2, break: 2, trait: 3, motive: 5 };

export function generateMystery(seed, force = {}) {
  const rng = makeRng(((seed >>> 0) ^ 0x5bd1e995) >>> 0);
  const rCulprit = rng.pick(SUSPECTS);
  const rMotive = rng.pick(['a', 'b']);
  const culprit = force.culprit || rCulprit;
  const motive = force.motive || rMotive;
  const options = methodsFor(culprit);
  const rMethod = options[Math.floor(rng.next() * options.length)];
  const method = force.method || rMethod;
  const clues = [];
  const add = (c) => { clues.push({ pri: PRIORITY[c.cat] || 9, ...c }); };

  // --- traces: one easy to read, one that needs real skill
  const types = rng.shuffle(['hand', 'build', 'shoes']);
  types.slice(0, 2).forEach((type, i) => {
    const value = CAST[culprit].traits[type];
    const t = TRAIT_CLUES[type];
    add({
      id: `trait:${type}`, cat: 'trait', title: t[value].title, note: t[value].note, lines: t[value].lines,
      src: { loc: t.loc, stat: t.stat, rank: i === 0 ? 2 : 4 },
      logic: { trait: type, value, exclude: SUSPECTS.filter((s) => CAST[s].traits[type] !== value) },
      pri: i === 0 ? 3 : 4,
    });
  });

  // --- method: the true one, plus one clue ruling out each of the others
  const pos = METHOD_CLUES[method].pos;
  add({ id: 'method:pos', cat: 'method', title: pos.title, note: pos.note, lines: pos.lines, src: { loc: pos.loc, stat: pos.stat, rank: pos.rank }, logic: { method } });
  for (const m of METHODS) {
    if (m === method) continue;
    const neg = rng.pick(METHOD_CLUES[m].neg);
    add({ id: `method:not-${m}`, cat: 'method', title: neg.title, note: neg.note, lines: neg.lines, src: { loc: neg.loc, stat: neg.stat, rank: neg.rank }, logic: { notMethod: m } });
  }

  // --- alibis
  for (const s of SUSPECTS) {
    const a = ALIBIS[s];
    add({ id: `claim:${s}`, cat: 'claim', about: s, title: a.claim.title, note: a.claim.note, lead: a.claim.lead, lines: a.claim.lines, src: { meet: s }, logic: {} });
    const rec = a.record;
    if (s !== culprit) {
      add({ id: `record:${s}`, cat: 'alibi', about: s, title: rec.ok.title, note: rec.ok.note, lines: rec.ok.lines, src: { loc: rec.loc, stat: rec.stat, rank: rec.rank }, logic: { confirm: s } });
      const who = rng.shuffle(Object.keys(a.witnesses)).find((w) => w !== culprit);
      const w = a.witnesses[who];
      add({ id: `witness:${s}`, cat: 'alibi', about: s, title: `${CAST[who].short} vouches for ${CAST[s].short}`, note: w.note, lines: w.lines, src: { who, bond: 2 }, logic: { confirm: s } });
    } else {
      add({ id: `record:${s}`, cat: 'break', about: s, title: rec.broken.title, note: rec.broken.note, lines: rec.broken.lines, src: { loc: rec.loc, stat: rec.stat, rank: rec.rank }, logic: { breaks: s },
        lead: `Someone knows why ${CAST[s].short} would do such a thing. Friends talk, once they trust you.` });
      const bw = a.breakWitness;
      add({ id: `witness:${s}`, cat: 'break', about: s, title: `${CAST[bw.who].short} contradicts ${CAST[s].short}`, note: bw.note, lines: bw.lines, src: { who: bw.who, bond: 2 }, logic: { breaks: s } });
    }
  }

  // --- rumours: honest sightings. Most are innocent; one may be the real thing.
  const rumourPool = rng.shuffle(SUSPECTS.filter((s) => !(s === 'pim' && culprit === 'pim')));
  rumourPool.slice(0, 2).forEach((s, i) => {
    const h = ALIBIS[s].herring;
    add({ id: `rumour:${s}`, cat: 'rumour', about: s, title: h.title, note: h.note, explained: h.explained, lines: h.lines, src: { auto: i === 0 ? 2 : 4 }, logic: { implicates: s } });
  });

  // --- motive
  const mv = MOTIVES[culprit][motive];
  add({ id: 'motive:loc', cat: 'motive', about: culprit, title: mv.loc.title, note: mv.loc.note, lines: mv.loc.lines, src: { loc: mv.loc.loc, stat: mv.loc.stat, rank: mv.loc.rank }, logic: { motive } });
  add({ id: 'motive:talk', cat: 'motive', about: culprit, title: `${CAST[mv.confidant.who].short} on ${CAST[culprit].short}`, note: mv.confidant.note, lines: mv.confidant.lines, src: { who: mv.confidant.who, bond: mv.confidant.bond }, logic: { motive } });

  // --- a confession, for a player who has earned the culprit's whole trust
  add({ id: 'confession', cat: 'motive', about: culprit, title: `${CAST[culprit].short} told you everything`, note: `${CAST[culprit].short} confessed to you, in confidence: ${mv.short.toLowerCase()}.`, lines: [], src: { confess: culprit }, logic: { motive, method, confess: culprit } });

  const byId = {};
  for (const c of clues) byId[c.id] = c;
  return { seed, culprit, motive, method, clues, byId };
}

// What a careful reader can conclude from a set of found clue ids.
export function deduce(mystery, found) {
  const have = new Set(found);
  const excluded = new Set();
  const confirmed = new Set();
  const broken = new Set();
  let methods = new Set(METHODS);
  let methodKnown = null;
  let motiveKnown = false;
  for (const c of mystery.clues) {
    if (!have.has(c.id)) continue;
    const l = c.logic;
    if (l.exclude) l.exclude.forEach((s) => excluded.add(s));
    if (l.confirm) { excluded.add(l.confirm); confirmed.add(l.confirm); }
    if (l.breaks) broken.add(l.breaks);
    if (l.confess) SUSPECTS.forEach((s) => { if (s !== l.confess) excluded.add(s); });
    if (l.method) methodKnown = l.method;
    if (l.notMethod) methods.delete(l.notMethod);
    if (l.motive) motiveKnown = true;
  }
  if (methodKnown) methods = new Set([methodKnown]);
  const candidates = SUSPECTS.filter((s) => !excluded.has(s));
  return {
    candidates, confirmed: [...confirmed], broken: [...broken], methods: [...methods], motiveKnown,
    whoSolved: candidates.length === 1, methodSolved: methods.size === 1,
  };
}

// --------------------------------------------------------------------------- schedule
// schedule[who][day - 1][slot] = place id, or null when they are not about.
export function generateSchedule(seed) {
  const rng = makeRng(((seed >>> 0) ^ 0x9e3779b9) >>> 0);
  const sched = {};
  for (const who of TOWNSFOLK) {
    const c = CAST[who];
    const days = [];
    for (let d = 0; d < 7; d++) {
      const slots = [];
      for (let s = 0; s < 3; s++) {
        if (d === 0 && s === 0) { slots.push(c.home); continue; }
        if (who === 'odile' && s === 0) { slots.push('teahouse'); continue; }
        const entries = [[c.home, 5], ...c.haunts.map((h) => [h, 2]), [null, 1]];
        slots.push(rng.weighted(entries));
      }
      // Everybody is findable at least twice a day.
      if (slots.filter(Boolean).length < 2) { const i = slots.indexOf(null); slots[i] = c.home; }
      days.push(slots);
    }
    sched[who] = days;
  }
  return sched;
}

export function whoIsAt(schedule, place, day, slot) {
  return TOWNSFOLK.filter((w) => schedule[w][day - 1][slot] === place);
}

export { LOCATIONS };
