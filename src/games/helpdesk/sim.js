// Patch & Kettle: game rules. Pure state in, state out; no DOM, no timers. The state is plain JSON.
import { makeRng } from '../../shell/rng.js';
import {
  TENANTS, TENANT_BY_ID, FACTS, FIRST_FACT, THREADS, THREAD_BY_ID, EVENTS, EVENT_BY_ID, UPGRADES, UPGRADE_BY_ID,
  HATS, HAT_BY_ID, QUIRK_BY_ID, WEATHER, KETTLE_SPOTS, TITLES, CAMPAIGN_DAYS, OPEN_DAY, WEEK,
} from './data.js';
import { TYPES, TYPE_IDS, STORIES, SPECIAL_STORIES, EXPIRE_LINES, PREVENT_LINES } from './stories.js';
import { gen } from './puzzles.js';

export const SAVE_VERSION = 2;
export const ACTIVE_THREADS = 14;
export const BOARD_CAP = 8;
export const WIKI_NOTES = 3;
export const DRIFT_AGE = 2;       // nights a ticket waits before the person finds a workaround
export const MAX_HOURS = 9;       // a day never holds more hours than this

function roll(s) {
  s.n = (s.n + 1) >>> 0;
  return makeRng((s.seed ^ Math.imul(s.n, 0x9e3779b1)) >>> 0);
}
const fill = (line, vars) => line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));

// ---------- setup ----------
function eventPossible(ev, active) { return ev.needs.some((set) => set.every((id) => active.includes(id))); }

export function newGame(seed, quirkId = null) {
  const rng = makeRng(seed >>> 0);
  const always = THREADS.filter((t) => t.always).map((t) => t.id);
  const optional = THREADS.filter((t) => !t.always).map((t) => t.id);
  let active = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    active = [...always, ...rng.shuffle(optional).slice(0, ACTIVE_THREADS - always.length)];
    if (EVENTS.filter((e) => eventPossible(e, active)).length >= 4) break;
  }
  const used = new Set();
  for (const id of active) { used.add(THREAD_BY_ID[id].a); used.add(THREAD_BY_ID[id].b); }
  const inAnyThread = new Set();
  for (const t of THREADS) { inAnyThread.add(t.a); inAnyThread.add(t.b); }

  const people = {};
  for (const t of TENANTS) {
    const mine = Object.keys(FACTS).filter((f) => FACTS[f].t === t.id);
    const core = mine.filter((f) => used.has(f));
    const decoys = rng.shuffle(mine.filter((f) => !inAnyThread.has(f)));
    let facts = rng.shuffle([...core, ...decoys]);
    const first = FIRST_FACT[t.id];
    if (first && facts.includes(first)) facts = [first, ...facts.filter((f) => f !== first)];
    people[t.id] = { facts, known: [], rel: 0, gift: false, hat: false, tea: 0 };
  }

  const quirk = QUIRK_BY_ID[quirkId] ? quirkId : null;
  const s = {
    v: SAVE_VERSION, seed: seed >>> 0, n: 0, quirk,
    day: 1, phase: 'morning', hours: 0, purred: false,
    budget: quirk === 'earlybird' ? 0 : quirk === 'thrifty' ? 30 : 10, goodwill: 0, gwTotal: 0, cheer: 0,
    people, active, threads: [], pending: [], events: [],
    board: [], nextId: 1,
    up: {}, wiki: {}, notes: {}, seenTypes: {}, solvedByType: {}, lastType: {}, specials: {},
    decor: [], hats: [], hat: null, gifts: [],
    kettle: { pets: 0, today: 0, spot: 'server' },
    sam: { xp: 0, used: 0 },
    stats: { solved: 0, prevented: 0, drifted: 0, intros: 0, teas: 0, delegated: 0, clean: 0, misses: 0, kettleFixes: 0 },
    history: [], today: null, weather: 0, flags: {}, ended: false, finale: null,
  };
  if (quirk === 'labelmaker') s.up.labels = true;
  return s;
}

// ---------- derived values ----------
export const person = (s, id) => s.people[id];
export const hasLabels = (s) => !!s.up.labels;

function perks(s) {
  const out = [];
  for (const id of s.threads) out.push(THREAD_BY_ID[id].perk);
  for (const id of s.events) out.push(EVENT_BY_ID[id].perk);
  return out.filter(Boolean);
}

export function dayHours(s) {
  let h = 6;
  if (s.up.chair) h += 1;
  if (s.quirk === 'earlybird') h += 1;
  for (const p of perks(s)) if (p.hours) h += p.hours;
  return Math.min(MAX_HOURS, h);
}

export function waiting(s) { return s.board.filter((t) => !t.project).length; }

export function moodOf(s) {
  let warm = s.threads.length * 3 + s.events.length * 3 + s.gifts.length;
  for (const p of perks(s)) if (p.mood) warm += p.mood;
  for (const id of Object.keys(s.up)) if (UPGRADE_BY_ID[id] && UPGRADE_BY_ID[id].mood) warm += UPGRADE_BY_ID[id].mood;
  warm += Math.min(15, s.gwTotal / 15) + Math.min(6, s.cheer);
  let m = 24 + warm * 0.7;
  m -= s.board.filter((t) => !t.project && t.age >= 1).length * 2;
  const recent = s.history.slice(-2).reduce((a, d) => a + d.drifted, 0);
  m -= recent * 2;
  return Math.round(Math.max(5, Math.min(100, m)));
}

export function scoreOf(s) {
  return s.threads.length * 10 + s.events.length * 15 + moodOf(s) + s.stats.prevented * 2 + s.stats.solved + s.gifts.length * 3 + s.hats.length * 2;
}

export function titleOf(s) {
  const pick = (id) => TITLES.find((t) => t.id === id);
  if (moodOf(s) >= 90) return pick('heart');
  const styles = [
    ['introducer', s.threads.length / 11], ['ceremonies', s.events.length / 4], ['gardener', s.stats.prevented / 34],
    ['catfriend', s.kettle.pets / 15], ['fixer', s.stats.solved / 72],
  ].sort((a, b) => b[1] - a[1]);
  return pick(styles[0][1] >= 0.6 ? styles[0][0] : 'keeper');
}

export const samLevel = (s) => (s.sam.xp < 4 ? 1 : s.sam.xp < 10 ? 2 : 3);
export const samLeft = (s) => (s.up.volunteer ? Math.max(0, samLevel(s) - s.sam.used) : 0);

export function hoursFor(s, t) {
  if (t.find && s.up.backups) return 0;
  return t.hours;
}

export function levelFor(s, type) {
  const base = 1 + Math.floor((s.solvedByType[type] || 0) / 2) + (s.day >= 8 ? 1 : 0) + (s.day >= 13 ? 1 : 0);
  return Math.max(1, Math.min(4, base));
}

// ---------- tickets ----------
function pickStory(s, rng, who, type, find) {
  const key = `${who}:${type}`;
  if (!find && SPECIAL_STORIES[key] && !s.specials[key]) { s.specials[key] = 1; return 'special'; }
  const pool = STORIES[find ? 'desktop_find' : type];
  return rng.int(0, pool.length - 1);
}

export function ticketLines(t) {
  const who = TENANT_BY_ID[t.who];
  if (t.project) return ['We would love to get started. There is just one thing first.', `${THREAD_BY_ID[t.project].projectName}. Could you?`];
  const lines = t.story === 'special' ? SPECIAL_STORIES[`${t.who}:${t.type}`] : STORIES[t.find ? 'desktop_find' : t.type][t.story];
  return lines.map((l) => fill(l, { device: who.device, doc: who.doc, name: who.name }));
}

export function ticketTitle(t) {
  if (t.project) return THREAD_BY_ID[t.project].projectName;
  if (t.find) return 'Deleted by mistake';
  return TYPES[t.type].name;
}

function makeTicket(s, rng, who, type, extra = {}) {
  const find = type === 'desktop' && !extra.project && (extra.find != null ? extra.find : rng.chance(0.4));
  const t = {
    id: s.nextId++, who, type, find, level: extra.level || levelFor(s, type), hours: TYPES[type].hours,
    age: 0, seed: (rng.next() * 4294967296) >>> 0, story: 0, day: s.day,
  };
  t.story = extra.project ? 0 : pickStory(s, rng, who, type, find);
  Object.assign(t, extra, { find });
  return t;
}

function puzzleOpts(s, t) {
  const who = TENANT_BY_ID[t.who];
  switch (t.type) {
    case 'cables': return { labels: hasLabels(s) };
    case 'password': return { words: who.words };
    case 'inbox': return { owner: t.who };
    case 'diagnosis': return { family: t.family, cause: t.cause, cat: true };
    case 'desktop': return { find: t.find, backups: !!s.up.backups, shared: !!t.project };
    case 'videocall': return { caller: t.project === 'videochess' ? 'The Porto Rooks' : t.who === 'vogel' ? 'Mina' : 'Their friend' };
    case 'calendar': return t.project === 'roomshare' ? { groups: [{ name: 'Knight Owls', color: '#b79be0' }, { name: 'Bolt Club', color: '#f6c445' }] } : {};
    default: return {};
  }
}

export function ticketPuzzle(s, t) { return gen(t.type, makeRng(t.seed), t.level, puzzleOpts(s, t)); }

function preventionFor(s, type) {
  const out = [];
  if (s.wiki[type]) out.push({ p: 0.4, kind: 'wiki', by: 'your wiki page' });
  for (const id of Object.keys(s.up)) {
    const u = UPGRADE_BY_ID[id];
    if (u && u.prevent && u.prevent[type]) out.push({ p: u.prevent[type], kind: 'upgrade', by: u.by });
  }
  for (const id of s.events) {
    const p = EVENT_BY_ID[id].perk;
    if (p.prevent && p.prevent.includes(type)) out.push({ p: p.p, kind: 'event', by: EVENT_BY_ID[id].title });
    if (p.preventAll) out.push({ p: p.preventAll, kind: 'event', by: EVENT_BY_ID[id].title });
  }
  return out;
}

function ticketCount(s) {
  const d = s.day;
  if (d <= 1) return 3;
  if (d <= 2) return 4;
  if (d <= 5) return 5;
  if (d <= 10) return 6;
  return 7;
}

function generateTickets(s, rng, report) {
  if (s.day === 1) {
    s.board.push(makeTicket(s, rng, 'bea', 'reboot', { level: 1, story: 0, forced: true }));
    s.board.push(makeTicket(s, rng, 'rashid', 'cables', { level: 1, forced: true }));
    s.board.push(makeTicket(s, rng, 'dot', 'diagnosis', { level: 1, family: 'typing', cause: 'cat_keys', forced: true }));
    report.newTickets = s.board.map((t) => t.id);
    return;
  }
  const unlocked = TYPE_IDS.filter((t) => TYPES[t].unlock <= s.day);
  const fresh = TYPE_IDS.filter((t) => TYPES[t].unlock === s.day);
  const count = ticketCount(s);
  const busy = {};
  for (const t of s.board) busy[t.who] = (busy[t.who] || 0) + 1;
  const todays = new Set();
  const pickTenant = (prefer) => {
    if (prefer && !todays.has(prefer)) return prefer;
    const pool = TENANTS.map((t) => t.id).filter((id) => !todays.has(id));
    const min = Math.min(...pool.map((id) => busy[id] || 0));
    return rng.pick(pool.filter((id) => (busy[id] || 0) === min));
  };
  for (let i = 0; i < count; i++) {
    const forcedType = fresh[i] || null;
    const forcedWho = s.day === 2 && i === 0 && !s.people.juno.known.includes('juno_synth') ? 'juno' : null;
    const who = pickTenant(forcedWho);
    todays.add(who);
    let type = forcedType;
    if (!type) {
      type = rng.weighted(unlocked.map((ty) => {
        let w = TYPES[ty].weight;
        if (!s.seenTypes[ty]) w *= 2;
        if (s.lastType[who] === ty) w *= 0.15;
        if (ty === 'wifi' && s.quirk === 'thrifty') w *= 1.6;
        if (s.board.filter((b) => b.type === ty).length >= 2) w *= 0.3;
        return [ty, w];
      }));
    }
    s.lastType[who] = type;
    const forced = !!forcedType || !!forcedWho;
    let prevented = null;
    if (!forced) {
      for (const pr of preventionFor(s, type)) { if (rng.chance(pr.p)) { prevented = pr; break; } }
    }
    if (prevented) {
      s.stats.prevented++; s.today.prevented++;
      gain(s, 'goodwill', 1);
      const name = TENANT_BY_ID[who].name;
      report.prevented.push({ who, type, kind: prevented.kind, text: fill(PREVENT_LINES[prevented.kind], { name, by: prevented.by }) });
      continue;
    }
    if (waiting(s) >= BOARD_CAP) continue;
    const t = makeTicket(s, rng, who, type, forced ? { forced: true } : {});
    s.board.push(t);
    busy[who] = (busy[who] || 0) + 1;
    report.newTickets.push(t.id);
  }
}

function gain(s, what, n) {
  if (what === 'goodwill') { s.goodwill += n; s.gwTotal += n; if (s.today) s.today.gw += n; }
  else { s.budget += n; if (s.today) s.today.budget += n; }
}

function revealFact(s, who, rngForTie = null) {
  const p = s.people[who];
  const next = p.facts.find((f) => !p.known.includes(f));
  if (!next) return null;
  p.known.push(next);
  return next;
}

export function unknownCount(s, who) { const p = s.people[who]; return p.facts.length - p.known.length; }

// ---------- day flow ----------
export function beginDay(s) {
  if (s.phase !== 'morning') return null;
  if (s.day === OPEN_DAY && !s.ended) { s.phase = 'openday'; return { day: s.day, openDay: true }; }
  const rng = roll(s);
  s.today = { solved: 0, prevented: 0, drifted: 0, threads: 0, events: 0, gw: 0, budget: 0 };
  s.hours = dayHours(s);
  s.purred = false;
  s.kettle.today = 0;
  s.sam.used = 0;
  s.weather = rng.int(0, WEATHER.length - 1);
  const report = { day: s.day, weather: WEATHER[s.weather], newTickets: [], prevented: [], perks: [], gossip: null, kettleFix: null, hours: s.hours };

  let gw = 0, budget = 0;
  for (const p of perks(s)) { if (p.gw) gw += p.gw; if (p.budget) budget += p.budget; }
  if (gw) { gain(s, 'goodwill', gw); report.perks.push({ cur: 'goodwill', n: gw }); }
  if (budget) { gain(s, 'budget', budget); report.perks.push({ cur: 'budget', n: budget }); }

  if (s.threads.includes('stories') && s.day % 2 === 0) {
    const pool = TENANTS.map((t) => t.id).filter((id) => unknownCount(s, id) > 0);
    if (pool.length) { const who = rng.pick(pool); report.gossip = { who, fact: revealFact(s, who) }; }
  }

  const spots = KETTLE_SPOTS.filter((sp) => (sp !== 'roof' || s.decor.includes('telescope') || s.decor.includes('rooflights')));
  s.kettle.spot = s.day === 1 ? 'server' : rng.pick(spots);

  // Now and then Kettle sits on a problem until it goes away.
  if (s.day > 3 && rng.chance(0.14)) {
    const c = s.board.find((t) => !t.project && !t.forced && ['reboot', 'cables', 'printer', 'wifi'].includes(t.type));
    if (c) {
      s.board = s.board.filter((t) => t !== c);
      s.stats.kettleFixes++; s.stats.solved++; s.today.solved++;
      gain(s, 'goodwill', 1);
      report.kettleFix = { who: c.who, type: c.type };
    }
  }

  generateTickets(s, rng, report);
  s.phase = 'day';
  return report;
}

export function canAfford(s, hours) { return s.hours >= hours; }

export function completeTicket(s, id, { reply = null, clean = false } = {}) {
  const t = s.board.find((x) => x.id === id);
  if (!t) return null;
  const cost = hoursFor(s, t);
  if (s.hours < cost) return null;
  s.hours -= cost;
  s.board = s.board.filter((x) => x !== t);
  const p = s.people[t.who];
  const rescued = t.find && s.up.backups;
  const res = { ticket: t, who: t.who, pay: 0, gw: 0, notes: 0, fact: null, gift: null, hat: null, thread: null, wikiReady: false, rescued };

  res.pay = t.project ? 0 : rescued ? 4 : t.hours * 4 + 1;
  res.gw = 2 + (clean ? 1 : 0) + (reply === 'kind' ? 2 : reply === 'funny' ? 1 : 0) + (rescued ? 2 : 0) + (t.project ? 1 : 0);
  if (reply === 'funny') s.cheer += 0.5;
  res.notes = 1 + (reply === 'practical' ? 1 : 0);
  if (res.pay) gain(s, 'budget', res.pay);
  gain(s, 'goodwill', res.gw);
  if (!s.wiki[t.type]) {
    const before = s.notes[t.type] || 0;
    s.notes[t.type] = before + res.notes;
    res.wikiReady = before < WIKI_NOTES && s.notes[t.type] >= WIKI_NOTES;
  } else res.notes = 0;

  p.rel++;
  // Small talk: people open up on every other visit; gifts and hats fill the gaps.
  if (p.rel % 2 === 1) res.fact = revealFact(s, t.who);
  const tenant = TENANT_BY_ID[t.who];
  if (p.rel >= 4 && !p.gift) { p.gift = true; s.gifts.push(tenant.gift.id); res.gift = tenant.gift; }
  const hat = HATS.find((h) => h.from === t.who);
  if (hat && p.rel >= 6 && !p.hat) { p.hat = true; s.hats.push(hat.id); res.hat = hat; if (!s.hat) s.hat = hat.id; }
  if (t.type === 'videocall' && t.who === 'vogel') s.flags.mina = true;

  s.seenTypes[t.type] = 1;
  s.solvedByType[t.type] = (s.solvedByType[t.type] || 0) + 1;
  s.stats.solved++; s.today.solved++;
  if (clean) s.stats.clean++;
  if (t.project) {
    s.pending = s.pending.filter((x) => x !== t.project);
    res.thread = finishThread(s, t.project);
  }
  return res;
}

export function canDelegate(s, t) {
  return !!s.up.volunteer && samLeft(s) > 0 && !t.project && !t.forced && t.level <= samLevel(s) + 1;
}

export function delegate(s, id) {
  const t = s.board.find((x) => x.id === id);
  if (!t || !canDelegate(s, t)) return null;
  s.board = s.board.filter((x) => x !== t);
  s.sam.used++; s.sam.xp++;
  const before = samLevel({ sam: { xp: s.sam.xp - 1 } });
  const pay = Math.ceil((t.hours * 4 + 1) / 2);
  gain(s, 'budget', pay); gain(s, 'goodwill', 1);
  if (!s.wiki[t.type]) s.notes[t.type] = (s.notes[t.type] || 0) + 1;
  s.seenTypes[t.type] = 1;
  s.stats.solved++; s.stats.delegated++; s.today.solved++;
  return { ticket: t, pay, gw: 1, levelUp: samLevel(s) > before ? samLevel(s) : 0 };
}

export function teaCost(s) { return s.up.teatin && !s.flags.teaDay ? 0 : 1; }
export function canTea(s, who) { return s.phase === 'day' && s.people[who].tea !== s.day && s.hours >= teaCost(s); }

export function tea(s, who) {
  if (!canTea(s, who)) return null;
  const cost = teaCost(s);
  s.hours -= cost;
  s.flags.teaDay = true;
  const p = s.people[who];
  p.tea = s.day;
  const facts = [];
  const n = s.quirk === 'chatterbox' ? 2 : 1;
  for (let i = 0; i < n; i++) { const f = revealFact(s, who); if (f) facts.push(f); }
  const gw = facts.length ? 1 : 2;
  gain(s, 'goodwill', gw);
  s.stats.teas++;
  return { who, facts, gw, cost };
}

export const petsLeft = (s) => (s.quirk === 'catperson' ? 2 : 1) - s.kettle.today;

export function pet(s) {
  if (s.phase !== 'day' || petsLeft(s) <= 0) return null;
  const rng = roll(s);
  s.kettle.today++; s.kettle.pets++;
  const gw = s.up.kettlebed ? 2 : 1;
  gain(s, 'goodwill', gw);
  let hour = 0;
  const chance = (s.up.kettlebed ? 0.45 : 0.25) + (s.quirk === 'catperson' ? 0.15 : 0);
  if (!s.purred && rng.chance(chance)) { s.purred = true; s.hours += 1; hour = 1; }
  return { gw, hour, pets: s.kettle.pets };
}

// ---------- improvements ----------
export function canBuy(s, id) {
  const u = UPGRADE_BY_ID[id];
  return !!u && !s.up[id] && (u.cur === 'budget' ? s.budget : s.goodwill) >= u.cost;
}
export function buy(s, id) {
  if (!canBuy(s, id)) return false;
  const u = UPGRADE_BY_ID[id];
  if (u.cur === 'budget') s.budget -= u.cost; else s.goodwill -= u.cost;
  s.up[id] = true;
  if (u.decor && !s.decor.includes(u.decor)) s.decor.push(u.decor);
  if (u.hours && s.phase === 'day') s.hours += u.hours;
  return true;
}
export function canBuyHat(s, id) { const h = HAT_BY_ID[id]; return !!h && h.cost != null && !s.hats.includes(id) && s.goodwill >= h.cost; }
export function buyHat(s, id) {
  if (!canBuyHat(s, id)) return false;
  s.goodwill -= HAT_BY_ID[id].cost;
  s.hats.push(id); s.hat = id;
  return true;
}
export function wearHat(s, id) { if (id === null || s.hats.includes(id)) { s.hat = id; return true; } return false; }

export function canWriteWiki(s, type) { return !s.wiki[type] && (s.notes[type] || 0) >= WIKI_NOTES && s.hours >= 1 && s.phase === 'day'; }
export function writeWiki(s, type) {
  if (!canWriteWiki(s, type)) return false;
  s.hours -= 1;
  s.wiki[type] = true;
  gain(s, 'goodwill', 2);
  return true;
}

// ---------- threads ----------
function finishThread(s, id) {
  const th = THREAD_BY_ID[id];
  if (s.threads.includes(id)) return th;
  s.threads.push(id);
  if (th.decor && !s.decor.includes(th.decor)) s.decor.push(th.decor);
  gain(s, 'goodwill', 5);
  s.stats.intros++;
  if (s.today) s.today.threads++;
  return th;
}

export function threadFor(s, f1, f2) {
  return THREADS.find((t) => s.active.includes(t.id) && ((t.a === f1 && t.b === f2) || (t.a === f2 && t.b === f1))) || null;
}

// Threads whose two facts are both in the notebook and that have not been started.
export function hunches(s) {
  const known = new Set();
  for (const id of Object.keys(s.people)) for (const f of s.people[id].known) known.add(f);
  return s.active.filter((id) => !s.threads.includes(id) && !s.pending.includes(id) && known.has(THREAD_BY_ID[id].a) && known.has(THREAD_BY_ID[id].b));
}

export function hunchPeople(s) {
  const out = new Set();
  for (const id of hunches(s)) { out.add(FACTS[THREAD_BY_ID[id].a].t); out.add(FACTS[THREAD_BY_ID[id].b].t); }
  return [...out];
}

export function introduce(s, f1, f2) {
  if (s.phase !== 'day') return { status: 'closed' };
  const A = FACTS[f1], B = FACTS[f2];
  if (!A || !B || A.t === B.t) return { status: 'same' };
  if (!s.people[A.t].known.includes(f1) || !s.people[B.t].known.includes(f2)) return { status: 'unknown' };
  const th = threadFor(s, f1, f2);
  if (!th) { s.stats.misses++; return { status: 'nope', a: A.t, b: B.t }; }
  if (s.threads.includes(th.id)) return { status: 'already', thread: th };
  if (s.pending.includes(th.id)) return { status: 'pending', thread: th };
  if (s.hours < 1) return { status: 'tired' };
  s.hours -= 1;
  s.stats.misses = 0;
  if (th.project) {
    const rng = roll(s);
    s.pending.push(th.id);
    const who = FACTS[th.a].t;
    const t = makeTicket(s, rng, who, th.project, { project: th.id, hours: 2, level: Math.min(3, Math.max(2, levelFor(s, th.project))) });
    s.board.push(t);
    return { status: 'project', thread: th, ticket: t };
  }
  return { status: 'thread', thread: finishThread(s, th.id) };
}

export function eventReady(s, id) {
  const ev = EVENT_BY_ID[id];
  return !!ev && !s.events.includes(id) && ev.needs.some((set) => set.every((t) => s.threads.includes(t)));
}
export const eventsReady = (s) => EVENTS.filter((e) => eventReady(s, e.id)).map((e) => e.id);
export const eventPossibleThisRun = (s, id) => eventPossible(EVENT_BY_ID[id], s.active);
// The set of threads an event is closest to completing, for the "what is missing" hint.
export function eventProgress(s, id) {
  const ev = EVENT_BY_ID[id];
  let best = null;
  for (const set of ev.needs) {
    if (!set.every((t) => s.active.includes(t))) continue;
    const have = set.filter((t) => s.threads.includes(t)).length;
    if (!best || have > best.have) best = { set, have };
  }
  return best;
}
export function canHold(s, id) { return s.phase === 'day' && eventReady(s, id) && s.hours >= 2 && s.budget >= EVENT_BY_ID[id].cost; }
export function holdEvent(s, id) {
  if (!canHold(s, id)) return null;
  const ev = EVENT_BY_ID[id];
  s.hours -= 2; s.budget -= ev.cost;
  s.events.push(id);
  if (ev.decor && !s.decor.includes(ev.decor)) s.decor.push(ev.decor);
  gain(s, 'goodwill', 8);
  s.today.events++;
  return ev;
}

// ---------- end of day ----------
export function endDay(s) {
  if (s.phase !== 'day') return null;
  const rng = roll(s);
  const drifted = [];
  for (const t of s.board) if (!t.project) t.age++;
  const keep = [];
  for (const t of s.board) {
    if (!t.project && t.age >= DRIFT_AGE) {
      drifted.push({ who: t.who, type: t.type, text: fill(rng.pick(EXPIRE_LINES), { name: TENANT_BY_ID[t.who].name }) });
    } else keep.push(t);
  }
  s.board = keep;
  s.stats.drifted += drifted.length;
  s.today.drifted = drifted.length;
  s.flags.teaDay = false;
  const rec = {
    day: s.day, solved: s.today.solved, prevented: s.today.prevented, drifted: drifted.length,
    threads: s.today.threads, events: s.today.events, gw: s.today.gw, budget: s.today.budget, mood: 0, waiting: waiting(s),
  };
  s.history.push(rec);
  rec.mood = moodOf(s);
  const summary = { ...rec, driftedList: drifted, week: null, next: 'day' };
  if (s.day % WEEK === 0) summary.week = weekSummary(s, s.day / WEEK);
  s.day++;
  s.phase = 'morning';
  if (s.day === OPEN_DAY && !s.ended) summary.next = 'openday';
  return summary;
}

export function weekSummary(s, week) {
  const slice = (w) => s.history.filter((d) => d.day > (w - 1) * WEEK && d.day <= w * WEEK);
  const sum = (arr, k) => arr.reduce((a, d) => a + d[k], 0);
  const cur = slice(week), prev = slice(week - 1);
  const pack = (arr) => ({
    solved: sum(arr, 'solved'), prevented: sum(arr, 'prevented'), threads: sum(arr, 'threads'), events: sum(arr, 'events'),
    drifted: sum(arr, 'drifted'), mood: arr.length ? arr[arr.length - 1].mood : moodOf(s),
  });
  return { week, days: cur, now: pack(cur), before: prev.length ? pack(prev) : null, totalThreads: s.threads.length };
}

// ---------- Open Day ----------
export function openDay(s) {
  if (s.phase !== 'openday') return s.finale;
  const title = titleOf(s);
  const finale = {
    threads: s.threads.slice(), events: s.events.slice(), decor: s.decor.length, mood: moodOf(s), score: scoreOf(s),
    title: title.id, solved: s.stats.solved, prevented: s.stats.prevented, gifts: s.gifts.length, pets: s.kettle.pets,
    mina: !!s.flags.mina, sam: !!s.up.volunteer, hat: s.hat,
  };
  s.finale = finale;
  s.ended = true;
  s.day = OPEN_DAY + 1;
  s.phase = 'morning';
  return finale;
}

export function bestLabel(s) {
  const n = s.threads.length;
  return `Best: ${n} thread${n === 1 ? '' : 's'}, cozy ${moodOf(s)}`;
}

// ---------- save ----------
export const serialize = (s) => JSON.stringify(s);
export function deserialize(raw) {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!s || s.v !== SAVE_VERSION || !s.people || !Array.isArray(s.board)) return null;
    for (const t of TENANTS) if (!s.people[t.id]) return null;
    return s;
  } catch { return null; }
}

export { CAMPAIGN_DAYS, OPEN_DAY, WEEK };
