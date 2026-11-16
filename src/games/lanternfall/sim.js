// Lanternfall rules: time, stats, bonds, clue discovery, scene assembly and endings.
// Pure and DOM-free so sim.test.mjs can play whole runs headlessly.
import { makeRng } from '../../shell/rng.js';
import { CAST, STATS, SUSPECTS, TOWNSFOLK, LOCATIONS, STAT_INFO } from './data/cast.js';
import { BONDS, CHATS, ASIDES } from './data/bonds.js';
import { PLACES, EVENTS } from './data/world.js';
import { INTRO, FINALE_PRELUDE, FINALE_LINES, ENDINGS, EPILOGUES, VERSE, VERSE_NEEDED, KEEPSAKES } from './data/story.js';
import { MOTIVES, METHOD_CONFESSION, METHOD_REVEAL, METHOD_INFO } from './data/clues.js';
import { generateMystery, generateSchedule, deduce, whoIsAt, METHODS } from './mystery.js';

export const DAYS = 7;
export const RANK_XP = [0, 0, 3, 7, 12, 18];     // total xp needed to hold rank r
export const BOND_NEED = [0, 0, 2, 5, 8, 12];    // bond points needed before scene r unlocks
export const MAX_RANK = 5;

const clone = (o) => JSON.parse(JSON.stringify(o));

// --------------------------------------------------------------------------- meta (persists across runs)
export function newMeta() {
  return { v: 1, runs: 0, endings: {}, epilogues: {}, cases: {}, solved: [], lastCulprit: null, seen: {}, settings: { speed: 'normal', sfx: true, music: true, skipAll: false } };
}
export function normalizeMeta(raw) {
  const m = newMeta();
  if (!raw || typeof raw !== 'object') return m;
  for (const k of ['endings', 'epilogues', 'cases', 'seen']) if (raw[k] && typeof raw[k] === 'object') m[k] = raw[k];
  if (Array.isArray(raw.solved)) m.solved = raw.solved.filter((s) => SUSPECTS.includes(s));
  m.runs = raw.runs | 0;
  m.lastCulprit = raw.lastCulprit || null;
  if (raw.settings) m.settings = { ...m.settings, ...raw.settings };
  return m;
}
export function verseLinesKnown(meta) {
  const n = Math.min(3, meta.solved.length);
  return VERSE.map((v, i) => (i < 3 ? i < n : i === 3 ? !!meta.epilogues.ysolde : !!meta.epilogues.wren));
}
export const verseCount = (meta) => verseLinesKnown(meta).filter(Boolean).length;
export function keepsakesUnlocked(meta) {
  const out = [];
  if (meta.runs >= 1) out.push('notebook');
  if (Object.keys(meta.epilogues).length >= 1) out.push('invitation');
  if (meta.solved.length >= 1) out.push('loupe');
  if (Object.keys(meta.endings).length >= 3) out.push('thermos');
  return out;
}
export function completion(meta) {
  const endings = Object.keys(ENDINGS).filter((e) => meta.endings[e]).length;
  const epis = TOWNSFOLK.filter((w) => meta.epilogues[w]).length;
  const cases = Object.keys(meta.cases).length;
  const verse = verseCount(meta);
  const got = endings + epis + cases + verse;
  const total = Object.keys(ENDINGS).length + TOWNSFOLK.length + SUSPECTS.length * 2 + VERSE.length;
  return { endings, endingsTotal: Object.keys(ENDINGS).length, epis, episTotal: TOWNSFOLK.length, cases, casesTotal: SUSPECTS.length * 2, verse, verseTotal: VERSE.length, got, total, pct: Math.round((got / total) * 100) };
}
function dvMet(meta, key) {
  if (!meta) return false;
  const [kind, id] = key.split(':');
  if (kind === 'epi') return !!meta.epilogues[id];
  if (kind === 'end') return !!meta.endings[id];
  return false;
}
// Prefer a culprit the player did not just see, and a case file they have not closed.
export function chooseSeed(meta, randomSeed) {
  let best = null; let bestScore = -1;
  for (let i = 0; i < 12; i++) {
    const seed = randomSeed() >>> 0;
    const m = generateMystery(seed);
    const score = (m.culprit !== meta.lastCulprit ? 2 : 0) + (meta.cases[`${m.culprit}:${m.motive}`] ? 0 : 1) + (meta.solved.includes(m.culprit) ? 0 : 1);
    if (score > bestScore) { best = seed; bestScore = score; }
    if (score >= 4) break;
  }
  return best;
}

// --------------------------------------------------------------------------- run state
export function newRun({ seed, name = 'Robin', keepsake = null, keepsakeStat = null, force = null } = {}) {
  const s = {
    v: 1, seed: seed >>> 0, force, name: String(name).trim().slice(0, 14) || 'Robin',
    phase: 'intro', day: 1, slot: 0, eventDay: 1,
    xp: { charm: 0, insight: 0, nerve: 0, craft: 0 },
    bonds: {}, clues: [], marks: {}, flags: {}, actIdx: {}, diary: [],
    keepsake, keepsakeStat, eventOrder: [], result: null,
  };
  for (const w of TOWNSFOLK) s.bonds[w] = { rank: 0, pts: 0, met: w === 'odile', chats: 0 };
  if (keepsake === 'notebook' && STATS.includes(keepsakeStat)) s.xp[keepsakeStat] = RANK_XP[2];
  if (keepsake === 'invitation') for (const w of TOWNSFOLK) { s.bonds[w].met = true; s.bonds[w].pts = 2; }
  s.eventOrder = makeRng((s.seed ^ 0x2545f491) >>> 0).shuffle(EVENTS.map((e) => e.id)).slice(0, DAYS - 1);
  return s;
}
export const serialize = (state) => clone(state);
export function deserialize(raw) {
  if (!raw || raw.v !== 1 || typeof raw.seed !== 'number' || !raw.bonds || !raw.xp) return null;
  return clone(raw);
}

const mysteryCache = new Map();
export function getMystery(state) {
  const key = `${state.seed}|${state.force ? JSON.stringify(state.force) : ''}`;
  let m = mysteryCache.get(key);
  if (!m) {
    m = generateMystery(state.seed, state.force || {});
    m.schedule = generateSchedule(state.seed);
    if (mysteryCache.size > 40) mysteryCache.clear();
    mysteryCache.set(key, m);
  }
  return m;
}

// --------------------------------------------------------------------------- stats and bonds
export function rankOf(xp) { for (let r = MAX_RANK; r > 1; r--) if (xp >= RANK_XP[r]) return r; return 1; }
export const statRank = (state, stat) => rankOf(state.xp[stat]);
export function statProgress(state, stat) {
  const xp = state.xp[stat]; const rank = rankOf(xp);
  if (rank >= MAX_RANK) return { rank, frac: 1, toNext: 0, title: STAT_INFO[stat].ranks[rank - 1] };
  const lo = RANK_XP[rank]; const hi = RANK_XP[rank + 1];
  return { rank, frac: (xp - lo) / (hi - lo), toNext: hi - xp, title: STAT_INFO[stat].ranks[rank - 1] };
}
export function nextBond(state, who) {
  const b = state.bonds[who];
  const r = b.rank + 1;
  if (r > MAX_RANK) return { maxed: true, ready: false, blocks: [] };
  const blocks = [];
  if (b.pts < BOND_NEED[r]) blocks.push({ kind: 'pts', need: BOND_NEED[r] - b.pts, text: 'Needs more time together' });
  if (state.day < r) blocks.push({ kind: 'day', day: r, text: `Not before day ${r}` });
  const gate = CAST[who].gates[r];
  if (gate && statRank(state, gate[0]) < gate[1]) blocks.push({ kind: 'stat', stat: gate[0], rank: gate[1], text: `Needs ${STAT_INFO[gate[0]].name} ${gate[1]}` });
  return { rank: r, ready: blocks.length === 0, blocks, scene: BONDS[who][r - 1], gate };
}
export function bondProgress(state, who) {
  const b = state.bonds[who];
  if (b.rank >= MAX_RANK) return { frac: 1, maxed: true };
  const need = BOND_NEED[b.rank + 1]; const prev = BOND_NEED[b.rank] || 0;
  return { frac: need <= prev ? 1 : Math.max(0, Math.min(1, (b.pts - prev) / (need - prev))), maxed: false };
}

// --------------------------------------------------------------------------- where people and clues are
export function presentAt(state, place, day = state.day, slot = state.slot) {
  return whoIsAt(getMystery(state).schedule, place, day, slot);
}
const gateRank = (state, src) => Math.max(1, (src.rank || 1) - (state.keepsake === 'loupe' ? 1 : 0));
export function cluesAt(state, place) {
  const m = getMystery(state);
  const open = []; const locked = [];
  for (const c of m.clues) {
    if (c.src.loc !== place || state.clues.includes(c.id)) continue;
    const need = gateRank(state, c.src);
    if (!c.src.stat || statRank(state, c.src.stat) >= need) open.push(c);
    else locked.push({ clue: c, stat: c.src.stat, rank: need });
  }
  open.sort((a, b) => a.pri - b.pri);
  return { open, locked };
}
function testimonyFor(state, who, rank) {
  const m = getMystery(state);
  return m.clues.filter((c) => c.src.who === who && c.src.bond <= rank && !state.clues.includes(c.id));
}

export const STRANGERS = {
  tobias: 'A big man in a knitted cap', ysolde: 'A small woman in enormous spectacles', bram: 'A huge man in a leather apron',
  pim: 'Somebody sitting on the parapet', wren: 'A tall old woman in a peaked cap', odile: 'Your landlady',
};
// Everything the player could do at a place this slot.
export function locationActions(state, place) {
  const out = [];
  for (const who of presentAt(state, place)) {
    const b = state.bonds[who]; const c = CAST[who];
    const nb = nextBond(state, who);
    if (nb.ready) {
      out.push({ id: `bond:${who}`, kind: 'bond', who, place, title: b.met ? `Spend time with ${c.short}` : 'Introduce yourself', sub: b.met ? nb.scene.title : STRANGERS[who], rank: nb.rank, stranger: !b.met });
    } else {
      const tells = testimonyFor(state, who, b.rank).length > 0;
      out.push({ id: `chat:${who}`, kind: 'chat', who, place, title: `Chat with ${c.short}`, sub: nb.maxed ? 'A true friend' : nb.blocks.map((x) => x.text).join(' · '), blocks: nb.blocks, maxed: !!nb.maxed, tells });
    }
  }
  const { open, locked } = cluesAt(state, place);
  const per = state.keepsake === 'loupe' ? 3 : 2;
  if (open.length) out.push({ id: 'investigate', kind: 'investigate', place, title: 'Investigate', sub: 'Look for traces and records', count: Math.min(per, open.length), locked });
  else if (locked.length) out.push({ id: 'investigate', kind: 'investigate', place, title: 'Investigate', sub: 'Something here is beyond you for now', disabled: true, locked });
  else out.push({ id: 'investigate', kind: 'investigate', place, title: 'Investigate', sub: 'Nothing more to find here', disabled: true, locked: [] });
  const act = PLACES[place].activity;
  out.push({ id: 'activity', kind: 'activity', place, title: act.title, sub: Object.entries(activityXp(state, place)).map(([s, n]) => `${STAT_INFO[s].name} +${n}`).join(' · '), xp: activityXp(state, place) });
  return out;
}
function activityXp(state, place) {
  const xp = { ...PLACES[place].activity.xp };
  if (state.keepsake === 'thermos') { const k = Object.keys(xp)[0]; xp[k] += 1; }
  return xp;
}
// Map badges: is there something to find, and is somebody ready to open up?
export function placeSummary(state, place) {
  const present = presentAt(state, place);
  const { open, locked } = cluesAt(state, place);
  return {
    present, known: present.filter((w) => state.bonds[w].met), strangers: present.filter((w) => !state.bonds[w].met).length,
    ready: present.filter((w) => nextBond(state, w).ready && state.bonds[w].met),
    clue: open.length > 0, clueLocked: open.length === 0 && locked.length > 0,
  };
}

// --------------------------------------------------------------------------- scene assembly
const fmtTokens = (text, tokens) => text.replace(/\{(\w+)\}/g, (m, k) => (k in tokens ? tokens[k] : m));

function clueSteps(c, leadIn) {
  return [...(leadIn ? [leadIn] : []), ...c.lines, ['fx', { clue: c.id }]];
}
function testimonySteps(state, who, rank) {
  const steps = [];
  for (const c of testimonyFor(state, who, rank).slice(0, 2)) {
    const about = CAST[c.about].short;
    const lead = c.cat === 'motive'
      ? ['you', `What do you make of ${about}? Truly.`]
      : ['you', steps.length ? `And ${about}? That same night.` : `Can I ask you about ${about}, the night the lantern went?`];
    steps.push(...clueSteps(c, lead));
  }
  return steps;
}

export function buildScene(state, action) {
  const m = getMystery(state);
  const base = { time: state.slot, kind: action.kind, place: action.place };
  if (action.kind === 'intro') return { ...INTRO, kind: 'intro' };
  if (action.kind === 'finale') return { ...FINALE_PRELUDE, kind: 'finale' };

  if (action.kind === 'bond') {
    const who = action.who; const nb = nextBond(state, who); const sc = nb.scene;
    const steps = [...sc.steps, ['fx', { rank: who }]];
    if (nb.rank === 1 && m.byId[`claim:${who}`] && !state.clues.includes(`claim:${who}`)) steps.push(...clueSteps(m.byId[`claim:${who}`]));
    steps.push(...testimonySteps(state, who, nb.rank));
    if (nb.rank === MAX_RANK && who === m.culprit) {
      const how = who === 'tobias' && m.method === 'key' ? 'Used my own key. Waxed the hasp after, same as always. Habit. Nobody thought to wonder at that.' : METHOD_CONFESSION[m.method];
      steps.push(['n', `You are at the door when ${CAST[who].short} says your name, in a different voice.`], ...MOTIVES[who][m.motive].confession, [`${who}:worried`, how], ['fx', { clue: 'confession', flag: 'confessed' }]);
    }
    return { ...base, id: sc.id, title: sc.title, bg: sc.bg, who, steps, rank: nb.rank, diary: `${CAST[who].short}: "${sc.title}"` };
  }
  if (action.kind === 'chat') {
    const who = action.who; const b = state.bonds[who];
    const lines = CHATS[who][b.chats % CHATS[who].length];
    const steps = [...lines, ['fx', { bond: { [who]: 1 }, chat: who }], ...testimonySteps(state, who, b.rank)];
    return { ...base, id: `chat:${who}:${b.chats % CHATS[who].length}`, title: `A word with ${CAST[who].short}`, bg: action.place, who, steps, diary: `Chatted with ${CAST[who].short}` };
  }
  if (action.kind === 'investigate') {
    const { open, locked } = cluesAt(state, action.place);
    const per = state.keepsake === 'loupe' ? 3 : 2;
    const take = open.slice(0, per);
    const steps = [['n', PLACES[action.place].search]];
    for (const c of take) steps.push(...clueSteps(c));
    if (open.length > take.length) steps.push(['n', 'There is more to find here, but the light is going. Another visit.']);
    else if (locked.length) steps.push(['n', 'There is something else here that you cannot quite read yet. You will need to be sharper, steadier or handier first.']);
    return { ...base, id: `inv:${action.place}`, title: `Investigating: ${PLACES[action.place].short}`, bg: action.place, steps, diary: `Investigated the ${PLACES[action.place].short}` };
  }
  if (action.kind === 'activity') {
    const act = PLACES[action.place].activity;
    const idx = (state.actIdx[action.place] || 0);
    const steps = [...act.vignettes[idx % act.vignettes.length], ['fx', { xp: activityXp(state, action.place), act: action.place }]];
    const friends = presentAt(state, action.place).filter((w) => state.bonds[w].met && state.bonds[w].rank >= 1 && state.bonds[w].rank < MAX_RANK);
    if (friends.length) {
      const who = friends[(state.day + state.slot) % friends.length];
      const aside = ASIDES[who][idx % ASIDES[who].length];
      steps.push(['n', `${CAST[who].short} is about, and keeps you company for a while.`], ...aside, ['fx', { bond: { [who]: 1 } }]);
    }
    return { ...base, id: `act:${action.place}:${idx % act.vignettes.length}`, title: act.title, bg: action.place, steps, diary: `${act.title} (${PLACES[action.place].short})` };
  }
  if (action.kind === 'event') {
    const ev = EVENTS.find((e) => e.id === action.event);
    const steps = ev ? [...ev.steps] : [];
    const rumours = m.clues.filter((c) => c.src.auto === state.day && !state.clues.includes(c.id));
    for (const c of rumours) steps.push(['n', 'Over the teapot, Odile passes on what the quay is saying.'], ...clueSteps(c));
    return { ...base, id: `event:${action.event}`, title: ev ? ev.title : 'Morning', bg: 'teahouse', time: 0, steps, kind: 'event' };
  }
  throw new Error(`unknown action ${action.kind}`);
}

export function pendingEvent(state) {
  if (state.phase !== 'day' || state.slot !== 0 || state.day < 2 || state.eventDay >= state.day) return null;
  return { kind: 'event', event: state.eventOrder[state.day - 2] || 'none' };
}

// --------------------------------------------------------------------------- effects
function applyFx(state, fx) {
  const out = [];
  if (fx.xp) for (const [stat, n] of Object.entries(fx.xp)) {
    const before = statRank(state, stat);
    state.xp[stat] += n;
    const after = statRank(state, stat);
    out.push({ kind: 'xp', stat, amount: n, rank: after, rankUp: after > before });
  }
  if (fx.bond) for (const [who, n] of Object.entries(fx.bond)) {
    const b = state.bonds[who];
    if (b.rank >= MAX_RANK) continue;
    b.pts += n; out.push({ kind: 'bond', who, amount: n });
  }
  if (fx.rank) { const b = state.bonds[fx.rank]; b.rank = Math.min(MAX_RANK, b.rank + 1); b.met = true; out.push({ kind: 'rank', who: fx.rank, rank: b.rank }); }
  if (fx.clue && !state.clues.includes(fx.clue)) { state.clues.push(fx.clue); out.push({ kind: 'clue', clue: getMystery(state).byId[fx.clue] }); }
  if (fx.chat) state.bonds[fx.chat].chats += 1;
  if (fx.act) state.actIdx[fx.act] = (state.actIdx[fx.act] || 0) + 1;
  if (fx.flag) state.flags[fx.flag] = true;
  return out;
}

// Walks a scene step by step. The UI and the test bot both drive this.
export function createWalker(draft, scene, meta = null) {
  const stack = [{ steps: scene.steps, i: 0 }];
  let pending = null;
  const tokens = { name: draft.name };
  const line = (who, expr, text) => ({ type: 'line', who, expr, text: fmtTokens(text, tokens) });
  return {
    draft, scene,
    next() {
      if (pending) return pending.view;
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.i >= top.steps.length) { stack.pop(); continue; }
        const st = top.steps[top.i++];
        const k = st[0];
        if (k === 'fx') { const results = applyFx(draft, st[1]); if (results.length) return { type: 'fx', results }; continue; }
        if (k === 'bg') return { type: 'bg', bg: st[1], time: st[2] };
        if (k === 'n') return line(null, null, st[1]);
        if (k === 'you') return line('you', null, st[1]);
        if (k === '?') {
          const opts = st[1].filter((o) => !o.dv || dvMet(meta, o.dv));
          const view = {
            type: 'choice',
            options: opts.map((o) => {
              const reqs = Object.entries(o.req || {}).map(([stat, rank]) => ({ stat, rank, met: statRank(draft, stat) >= rank }));
              return { text: fmtTokens(o.t, tokens), reqs, locked: reqs.some((r) => !r.met), dv: !!o.dv };
            }),
          };
          pending = { opts, view };
          return view;
        }
        const [who, expr] = k.split(':');
        return line(who, expr || 'neutral', st[1]);
      }
      return null;
    },
    choose(i) {
      const o = pending.opts[i];
      if (!o || pending.view.options[i].locked) return null;
      pending = null;
      const fx = { ...(o.fx || {}) };
      if (o.p && scene.who) fx.bond = { ...(fx.bond || {}), [scene.who]: o.p };
      if (o.x) fx.xp = { ...(fx.xp || {}), [o.x]: 1 };
      const results = applyFx(draft, fx);
      if (o.r) stack.push({ steps: o.r, i: 0 });
      return { results, quality: o.p || 0 };
    },
  };
}

// Begin an action on a copy of the state; commit with endAction once the scene has played out.
export function beginAction(state, action) {
  const draft = clone(state);
  return { draft, scene: buildScene(draft, action) };
}
export function endAction(draft, action, scene) {
  if (action.kind === 'intro') { draft.phase = 'day'; return draft; }
  if (action.kind === 'event') { draft.eventDay = draft.day; return draft; }
  if (action.kind === 'finale') return draft;
  if (scene && scene.diary) draft.diary.push([draft.day, draft.slot, scene.diary]);
  draft.slot += 1;
  if (draft.slot > 2) { draft.slot = 0; draft.day += 1; }
  if (draft.day > DAYS) { draft.phase = 'finale'; draft.day = DAYS; draft.slot = 2; }
  return draft;
}
// Headless: play one action to the end. chooser(view, draft) returns an option index.
export function runAction(state, action, meta, chooser) {
  const { draft, scene } = beginAction(state, action);
  const w = createWalker(draft, scene, meta);
  let guard = 0;
  for (let st = w.next(); st; st = w.next()) {
    if (st.type === 'choice') {
      let i = chooser ? chooser(st, draft) : -1;
      if (!(i >= 0) || !st.options[i] || st.options[i].locked) i = st.options.findIndex((o) => !o.locked);
      if (i < 0) throw new Error(`scene ${scene.id} has a choice with no available option`);
      w.choose(i);
    }
    if (++guard > 2000) throw new Error(`scene ${scene.id} did not end`);
  }
  return endAction(draft, action, scene);
}

// --------------------------------------------------------------------------- notebook helpers
export function foundClues(state) { const m = getMystery(state); return state.clues.map((id) => m.byId[id]).filter(Boolean); }
export function deduction(state) { return deduce(getMystery(state), state.clues); }
export function suspectStatus(state, s) {
  const d = deduction(state);
  const found = foundClues(state);
  return {
    met: state.bonds[s].met, claim: found.find((c) => c.id === `claim:${s}`) || null,
    alibi: d.confirmed.includes(s) ? 'confirmed' : d.broken.includes(s) ? 'broken' : 'unknown',
    rumour: found.find((c) => c.id === `rumour:${s}`) || null,
    mark: state.marks[s] || 'none',
  };
}
export function leads(state) {
  const d = deduction(state); const out = [];
  for (const c of foundClues(state)) {
    if (!c.lead) continue;
    if (c.cat === 'claim' && (d.confirmed.includes(c.about) || d.broken.includes(c.about))) continue;
    if (c.cat === 'break' && d.motiveKnown) continue;
    out.push({ about: c.about, text: c.lead });
  }
  if (!state.clues.some((id) => id.startsWith('method:') || id.startsWith('trait:'))) out.unshift({ about: null, text: 'Nobody has yet looked properly at the Boathouse itself.' });
  return out;
}

// --------------------------------------------------------------------------- finale
export function finaleOptions(state, meta) {
  const m = getMystery(state);
  const rng = makeRng((state.seed ^ 0x1b873593) >>> 0);
  const motives = {};
  for (const s of SUSPECTS) motives[s] = rng.shuffle([{ id: 'a', label: MOTIVES[s].a.label }, { id: 'b', label: MOTIVES[s].b.label }, { id: 'decoy', label: MOTIVES[s].decoy }]);
  return {
    canVerse: !!meta && verseCount(meta) >= VERSE_NEEDED,
    suspects: SUSPECTS, motives,
    methods: METHODS.map((id) => ({ id, label: METHOD_INFO[id].label })),
    approaches(accused) {
      const list = [
        { id: 'private', label: 'Take them aside, and say it quietly', sub: 'Only the two of you will hear.' },
        { id: 'public', label: 'Name them from the parapet', sub: 'Before the Mayor and the whole town.' },
      ];
      if (state.flags.confessed && accused === m.culprit) list.push({ id: 'own', label: 'Say nothing. Let them tell it themselves', sub: 'They trusted you with it. Trust them back.' });
      if (state.bonds[accused].rank >= 3) list.push({ id: 'blame', label: 'Protect them. Say it was you', sub: 'A terrible lie, told for a friend.', reqs: [{ stat: 'nerve', rank: 4, met: statRank(state, 'nerve') >= 4 }], locked: statRank(state, 'nerve') < 4 });
      return list;
    },
  };
}

// ans: { mode: 'accuse' | 'pass' | 'verse', accuse, motive, method, approach }
export function resolveEnding(state, ans) {
  const m = getMystery(state);
  const right = { who: ans.mode === 'accuse' && ans.accuse === m.culprit, why: ans.motive === m.motive, how: ans.method === m.method };
  let ending;
  if (ans.mode === 'verse') ending = state.bonds[m.culprit].rank >= 2 ? 'remembers' : 'papermoon';
  else if (ans.mode !== 'accuse') ending = state.clues.filter((id) => !id.startsWith('claim:') && !id.startsWith('rumour:')).length < 3 ? 'tourist' : 'papermoon';
  else if (!right.who) ending = ans.approach === 'public' ? 'wrongdoor' : 'kindmistake';
  else if (ans.approach === 'own') ending = 'ownwords';
  else if (ans.approach === 'blame') ending = 'newcomerslie';
  else if (ans.approach === 'public') ending = right.why ? 'unmasking' : 'halftruth';
  else ending = right.why && right.how ? 'returned' : 'quietmending';
  const truth = !['wrongdoor', 'papermoon', 'tourist'].includes(ending);
  return { ending, right, truth, culprit: m.culprit, motive: m.motive, method: m.method, accused: ans.mode === 'accuse' ? ans.accuse : null, epilogues: TOWNSFOLK.filter((w) => state.bonds[w].rank >= MAX_RANK) };
}

// The confrontation scene, and everything the ending screens need.
export function buildEnding(state, ans, meta) {
  const m = getMystery(state);
  const res = resolveEnding(state, ans);
  const C = CAST[m.culprit].short; const A = res.accused ? CAST[res.accused].short : '';
  const tok = { C, A, name: state.name };
  const L = FINALE_LINES; const steps = [];
  const reveal = `${MOTIVES[m.culprit][m.motive].reveal} ${m.culprit === 'tobias' && m.method === 'key' ? 'He had used his own key, and waxed the hasp after, as he did every night.' : METHOD_REVEAL[m.method]}`;
  if (ans.mode === 'verse') {
    const known = meta ? verseLinesKnown(meta) : VERSE.map(() => true);
    steps.push(['n', 'You do not answer her. You climb onto the parapet instead, and the bridge goes quiet, and you begin.']);
    VERSE.forEach((v, i) => steps.push(['you', known[i] ? v.line : '(a line you never learned; you hum it, and the tune holds)']));
    if (res.ending === 'remembers') steps.push([`${m.culprit}:surprised`, '...'], ...L[m.culprit].forward);
    else steps.push(['n', 'The verse hangs over the water. People shift. Somebody in the crowd very nearly moves, and does not. They do not know you well enough to answer it.']);
  } else if (ans.mode !== 'accuse') {
    steps.push(['you', res.ending === 'tourist' ? 'I have not found anything, exactly. I have been very busy, though.' : 'I am not sure. And I will not guess with somebody else\'s name.']);
    steps.push(['mayor:worried', res.ending === 'tourist' ? 'Busy. Doing what?' : 'I see. No. No, I suppose that is the honest answer.']);
  } else if (ans.approach === 'public') {
    steps.push(['n', `You step up onto the parapet. The bridge goes quiet. You say a name: ${A}. Then you say the rest.`]);
    steps.push(...(res.right.who ? L[res.accused].exposed : L[res.accused].falsely));
    if (!res.right.who) steps.push(['mayor:worried', 'Is that so. Well. We have all heard it now.']);
  } else if (ans.approach === 'own') {
    steps.push(['n', `You tell the Mayor that it is not your story to tell. Then you look across the bridge at ${C}, and wait.`], [`${m.culprit}:worried`, '...'], ...L[m.culprit].forward.slice(-1));
  } else if (ans.approach === 'blame') {
    steps.push(['you', 'It was me. I took it down to look at it, the night I came, and I was too ashamed to say.'], ['odile:surprised', 'Oh, for pity\'s sake.']);
    if (res.right.who) steps.push(...L[m.culprit].forward);
    else steps.push([`${res.accused}:surprised`, 'What are you doing? Who are you covering for? Not me. I never touched it.'], ...L[m.culprit].forward);
  } else {
    steps.push(['n', `You find ${A} at the edge of the crowd, away from the lamps, and say it quietly: what you think was done, and how, and why.`]);
    if (res.right.who) {
      steps.push(...(res.right.why ? L[m.culprit].caught : L[m.culprit].wrongWhy));
      if (res.right.why && !res.right.how) steps.push(['n', `You had the how of it wrong, as it turns out. ${C} puts you right on that, almost absently.`]);
    } else steps.push(...L[res.accused].falsely, ['n', 'You are still apologising when there is a stir on the bridge behind you.'], ...L[m.culprit].forward);
  }
  if (res.truth) steps.push(['n', reveal]);
  const ending = ENDINGS[res.ending];
  return {
    ...res, title: ending.title, kicker: ending.kicker, tone: ending.tone,
    text: ending.text.map((t) => fmtTokens(t, tok)),
    reveal: res.truth ? reveal : null,
    scene: { id: `end:${res.ending}`, title: ending.title, bg: 'bridge', time: 2, kind: 'ending', steps: steps.map((s) => (typeof s[1] === 'string' ? [s[0], fmtTokens(s[1], tok)] : s)) },
    epilogueCards: res.epilogues.map((w) => ({ who: w, title: EPILOGUES[w].title, text: EPILOGUES[w].text + (w === m.culprit && res.truth && EPILOGUES[w].culprit ? ` ${EPILOGUES[w].culprit}` : '') })),
  };
}

// Record a finished run in the meta save. Returns the new meta and what was newly unlocked.
export function applyEnding(metaIn, state, res) {
  const meta = clone(metaIn);
  const before = { keeps: keepsakesUnlocked(meta), verse: verseLinesKnown(meta), ending: !!meta.endings[res.ending] };
  meta.runs += 1;
  meta.endings[res.ending] = (meta.endings[res.ending] || 0) + 1;
  const newEpis = res.epilogues.filter((w) => !meta.epilogues[w]);
  for (const w of res.epilogues) meta.epilogues[w] = true;
  let newCase = false;
  if (res.right.who) {
    if (!meta.solved.includes(res.culprit)) meta.solved.push(res.culprit);
    if (res.right.why && !meta.cases[`${res.culprit}:${res.motive}`]) { meta.cases[`${res.culprit}:${res.motive}`] = true; newCase = true; }
  }
  meta.lastCulprit = res.culprit;
  const unlocks = [];
  if (!before.ending) unlocks.push({ kind: 'ending', text: `New ending: ${ENDINGS[res.ending].title}` });
  for (const w of newEpis) unlocks.push({ kind: 'epilogue', text: `New epilogue: ${CAST[w].short}, "${EPILOGUES[w].title}"` });
  if (newCase) unlocks.push({ kind: 'case', text: `Case file closed: ${CAST[res.culprit].short}, ${MOTIVES[res.culprit][res.motive].short.toLowerCase()}` });
  verseLinesKnown(meta).forEach((k, i) => { if (k && !before.verse[i]) unlocks.push({ kind: 'verse', text: `A line of the Lighting Verse: "${VERSE[i].line}"` }); });
  for (const k of keepsakesUnlocked(meta)) if (!before.keeps.includes(k)) unlocks.push({ kind: 'keepsake', text: `New keepsake: ${KEEPSAKES[k].name}` });
  if (verseCount(meta) >= VERSE_NEEDED && before.verse.filter(Boolean).length < VERSE_NEEDED) unlocks.push({ kind: 'verse', text: 'You know enough of the verse to speak it on festival night.' });
  return { meta, unlocks };
}

export { LOCATIONS, SUSPECTS, TOWNSFOLK, STATS, METHODS };
