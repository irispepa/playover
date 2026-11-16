// Headless checks for Lanternfall: node src/games/lanternfall/sim.test.mjs
// Proves every case variant is solvable from its clues, plays whole runs with bots,
// reaches every ending, and round-trips saves.
import assert from 'node:assert/strict';
import { makeRng } from '../../shell/rng.js';
import { CAST, SUSPECTS, TOWNSFOLK, LOCATIONS, STATS, EXPRESSIONS } from './data/cast.js';
import { BONDS, CHATS, ASIDES } from './data/bonds.js';
import { PLACES, EVENTS } from './data/world.js';
import { INTRO, FINALE_PRELUDE, ENDINGS, EPILOGUES, FINALE_LINES, ENDING_ORDER } from './data/story.js';
import { MOTIVES } from './data/clues.js';
import { generateMystery, deduce, allVariants, generateSchedule, METHODS } from './mystery.js';
import {
  newRun, newMeta, normalizeMeta, serialize, deserialize, getMystery, locationActions, pendingEvent, runAction, beginAction, createWalker, endAction,
  statRank, nextBond, deduction, finaleOptions, resolveEnding, buildEnding, applyEnding, verseCount, keepsakesUnlocked, completion, chooseSeed, leads, suspectStatus, placeSummary,
} from './sim.js';

let checks = 0;
const ok = (cond, msg) => { checks++; assert.ok(cond, msg); };
const section = (name) => console.log(`\n== ${name}`);

// ------------------------------------------------------------------ 1. content lint
section('content');
{
  const speakers = new Set([...Object.keys(CAST), 'n', 'you', '?', 'fx', 'bg']);
  let lines = 0; let choices = 0; let words = 0;
  const lintSteps = (steps, where) => {
    for (const st of steps) {
      const [who, expr] = String(st[0]).split(':');
      ok(speakers.has(who), `${where}: unknown speaker ${st[0]}`);
      if (expr) ok(EXPRESSIONS.includes(expr), `${where}: unknown expression ${st[0]}`);
      if (who === '?') {
        choices++;
        ok(st[1].some((o) => !o.req && !o.dv), `${where}: a choice needs one option with no requirement`);
        for (const o of st[1]) {
          ok(o.t && o.t.length <= 110, `${where}: option too long: ${o.t}`);
          if (o.x) ok(STATS.includes(o.x), `${where}: bad stat ${o.x}`);
          if (o.req) for (const k of Object.keys(o.req)) ok(STATS.includes(k), `${where}: bad req ${k}`);
          if (o.r) lintSteps(o.r, where);
        }
      } else if (who === 'bg') ok(LOCATIONS.includes(st[1]), `${where}: bad bg ${st[1]}`);
      else if (who !== 'fx') {
        lines++; words += st[1].split(/\s+/).length;
        ok(typeof st[1] === 'string' && st[1].length > 0, `${where}: empty line`);
        ok(st[1].length <= 420, `${where}: line too long (${st[1].length}): ${st[1].slice(0, 40)}`);
        ok(!/\{(?!name\})/.test(st[1]), `${where}: stray token in "${st[1].slice(0, 50)}"`);
      }
    }
  };
  for (const w of TOWNSFOLK) {
    ok(BONDS[w].length === 5, `${w} has five bond scenes`);
    BONDS[w].forEach((sc) => { ok(LOCATIONS.includes(sc.bg), `${sc.id} bg`); lintSteps(sc.steps, sc.id); });
    CHATS[w].forEach((c, i) => lintSteps(c, `chat ${w} ${i}`));
    ASIDES[w].forEach((c, i) => lintSteps(c, `aside ${w} ${i}`));
  }
  for (const p of LOCATIONS) PLACES[p].activity.vignettes.forEach((v, i) => lintSteps(v, `activity ${p} ${i}`));
  EVENTS.forEach((e) => lintSteps(e.steps, `event ${e.id}`));
  lintSteps(INTRO.steps, 'intro'); lintSteps(FINALE_PRELUDE.steps, 'finale');
  for (const s of SUSPECTS) {
    for (const k of ['caught', 'wrongWhy', 'exposed', 'falsely', 'forward']) lintSteps(FINALE_LINES[s][k], `finale ${s} ${k}`);
    for (const v of ['a', 'b']) lintSteps(MOTIVES[s][v].confession, `confession ${s} ${v}`);
  }
  ok(ENDING_ORDER.length === Object.keys(ENDINGS).length && ENDING_ORDER.every((e) => ENDINGS[e]), 'ending order covers all endings');
  for (const w of TOWNSFOLK) ok(EPILOGUES[w] && EPILOGUES[w].text.length > 80, `epilogue ${w}`);
  console.log(`   ${lines} scripted lines, ${choices} choices, about ${words} words in scenes; ${EVENTS.length} events; ${Object.keys(ENDINGS).length} endings + ${TOWNSFOLK.length} epilogues`);
}

// ------------------------------------------------------------------ 2. solvability of every variant
section('mystery solvability');
const variants = allVariants();
{
  const SEEDS = 60; let cases = 0; const placements = new Set();
  for (const v of variants) {
    for (let i = 0; i < SEEDS; i++) {
      const seed = (i * 7919 + 13) >>> 0;
      const m = generateMystery(seed, v);
      cases++;
      const tag = `${v.culprit}/${v.motive}/${v.method} seed ${seed}`;
      ok(m.culprit === v.culprit && m.motive === v.motive && m.method === v.method, `${tag}: forced variant`);
      const ids = new Set(m.clues.map((c) => c.id));
      ok(ids.size === m.clues.length, `${tag}: clue ids unique`);
      const lintClue = (c) => { ok(c.title && c.note, `${tag}: ${c.id} has text`); if (c.src.loc) ok(LOCATIONS.includes(c.src.loc), `${tag}: ${c.id} place`); if (c.src.who) ok(TOWNSFOLK.includes(c.src.who) && c.src.who !== m.culprit, `${tag}: ${c.id} witness is honest`); };
      m.clues.forEach(lintClue);
      const discoverable = m.clues.filter((c) => !c.src.confess);
      // (a) every discoverable clue together names exactly the culprit, the method, and a motive
      const all = deduce(m, discoverable.map((c) => c.id));
      ok(all.candidates.length === 1 && all.candidates[0] === v.culprit, `${tag}: all clues name ${v.culprit}, got ${all.candidates}`);
      ok(all.methods.length === 1 && all.methods[0] === v.method, `${tag}: method`);
      ok(all.motiveKnown, `${tag}: motive`);
      ok(all.broken.length === 1 && all.broken[0] === v.culprit, `${tag}: only the culprit's alibi breaks`);
      // (b) no clue ever rules out the culprit
      for (const c of m.clues) ok(!(c.logic.exclude || []).includes(v.culprit) && c.logic.confirm !== v.culprit, `${tag}: ${c.id} excludes the culprit`);
      // (c) solvable by a beginner: only clues needing stat rank <= 2 and bond <= 2
      const easy = discoverable.filter((c) => (c.src.loc && (c.src.rank || 1) <= 2) || (c.src.who && c.src.bond <= 2) || c.src.auto || c.src.meet);
      const e = deduce(m, easy.map((c) => c.id));
      ok(e.candidates.length === 1 && e.candidates[0] === v.culprit, `${tag}: easy clues name the culprit`);
      ok(e.methods.length === 1, `${tag}: easy clues give the method`);
      // (d) solvable from places alone, and from people alone
      const places = deduce(m, discoverable.filter((c) => c.src.loc).map((c) => c.id));
      ok(places.whoSolved && places.methodSolved && places.motiveKnown, `${tag}: physical clues alone suffice`);
      const people = deduce(m, discoverable.filter((c) => c.src.who).map((c) => c.id));
      ok(people.whoSolved && people.motiveKnown, `${tag}: testimony alone names culprit and motive`);
      // (e) removing any single clue still leaves the culprit identifiable (redundancy)
      for (const c of discoverable) {
        const d = deduce(m, discoverable.filter((x) => x !== c).map((x) => x.id));
        ok(d.whoSolved && d.methodSolved && d.motiveKnown, `${tag}: still solvable without ${c.id}`);
      }
      // (f) rumours: honest, and every innocent one can be explained
      for (const c of m.clues.filter((x) => x.cat === 'rumour')) {
        if (c.about !== v.culprit) ok(m.clues.some((x) => x.logic.confirm === c.about), `${tag}: rumour about ${c.about} can be explained`);
      }
      // (g) confession says the same thing as the clues
      ok(m.byId.confession.logic.motive === v.motive && m.byId.confession.logic.method === v.method, `${tag}: confession`);
      placements.add(m.clues.map((c) => `${c.id}@${c.src.loc || c.src.who || ''}`).join('|'));
    }
  }
  console.log(`   ${variants.length} culprit/motive/method variants x ${SEEDS} seeds = ${cases} cases, all uniquely solvable; ${placements.size} distinct clue layouts`);
  // natural distribution
  const count = {};
  for (let i = 0; i < 3000; i++) { const m = generateMystery((i * 2654435761) >>> 0); count[m.culprit] = (count[m.culprit] || 0) + 1; }
  for (const s of SUSPECTS) ok(count[s] > 400, `culprit ${s} comes up naturally (${count[s]}/3000)`);
  console.log(`   natural culprit spread over 3000 seeds: ${SUSPECTS.map((s) => `${s} ${count[s]}`).join(', ')}`);
}

// ------------------------------------------------------------------ bots
const allActions = (state) => LOCATIONS.flatMap((p) => locationActions(state, p)).filter((a) => !a.disabled);
const bestChoice = (view) => { let bi = -1; let bq = -1; view.options.forEach((o, i) => { if (!o.locked && (o.dv ? 5 : 1) > bq) { bq = o.dv ? 5 : 1; bi = i; } }); return bi; };
// Picks the option worth most bond points, by reading the scene (the UI player learns this by feel).
function smartChooser(scene) {
  return (view, draft) => {
    const flat = []; const walk = (steps) => { for (const st of steps) if (st[0] === '?') { flat.push(st[1]); st[1].forEach((o) => o.r && walk(o.r)); } };
    walk(scene.steps);
    const texts = view.options.map((o) => o.text);
    const src = flat.find((opts) => texts.every((t) => opts.some((o) => o.t.replace('{name}', draft.name) === t)));
    let bi = view.options.findIndex((o) => !o.locked); let bp = -1;
    view.options.forEach((o, i) => { if (o.locked) return; const so = src && src.find((x) => x.t.replace('{name}', draft.name) === o.text); const p = so ? (so.p || 0) + (so.x ? 0.5 : 0) : 0; if (p > bp) { bp = p; bi = i; } });
    return bi;
  };
}
function playAction(state, action, meta, mode, rng) {
  const { draft, scene } = beginAction(state, action);
  const w = createWalker(draft, scene, meta);
  const choose = mode === 'smart' ? smartChooser(scene) : null;
  let guard = 0;
  for (let st = w.next(); st; st = w.next()) {
    if (st.type === 'choice') {
      const open = st.options.map((o, i) => (o.locked ? -1 : i)).filter((i) => i >= 0);
      ok(open.length > 0, `${scene.id}: no open option`);
      const i = choose ? choose(st, draft) : rng.pick(open);
      ok(w.choose(i) !== null, `${scene.id}: choose failed`);
    }
    ok(++guard < 500, `${scene.id}: runaway scene`);
  }
  return endAction(draft, action, scene);
}
// policy(state, actions) -> action
function playRun(state, meta, policy, { mode = 'smart', rng = makeRng(1), roundTrip = false } = {}) {
  let s = playAction(state, { kind: 'intro' }, meta, mode, rng);
  let steps = 0;
  while (s.phase === 'day') {
    const ev = pendingEvent(s);
    if (ev) { s = playAction(s, ev, meta, mode, rng); continue; }
    const actions = allActions(s);
    ok(actions.length >= LOCATIONS.length, 'there is always something to do');
    s = playAction(s, policy(s, actions), meta, mode, rng);
    if (roundTrip) { const back = deserialize(JSON.parse(JSON.stringify(serialize(s)))); assert.deepEqual(back, s); s = back; checks++; }
    ok(++steps <= 21, 'a run has at most 21 actions');
  }
  ok(steps === 21, `run used ${steps} actions`);
  ok(s.phase === 'finale', 'run reached the finale');
  return s;
}
// A methodical investigator: looks first, then talks, and trains whatever is blocking a clue.
function detectivePolicy(s, actions) {
  const wantStats = {};
  for (const a of actions) if (a.kind === 'investigate') for (const l of a.locked || []) wantStats[l.stat] = Math.max(wantStats[l.stat] || 0, 3);
  for (const p of LOCATIONS) for (const a of locationActions(s, p)) {
    if (a.kind === 'investigate' && a.disabled) for (const l of a.locked) wantStats[l.stat] = Math.max(wantStats[l.stat] || 0, 3);
    if (a.kind === 'chat') for (const b of a.blocks || []) if (b.kind === 'stat') wantStats[b.stat] = Math.max(wantStats[b.stat] || 0, 2);
  }
  const d = deduction(s);
  const score = (a) => {
    if (a.kind === 'investigate') return 20 + a.count;
    if (a.kind === 'bond') return (d.whoSolved && d.motiveKnown ? 8 : 12) + (a.rank <= 3 ? 3 : 0);
    if (a.kind === 'chat') return a.tells ? 11 : 1;
    if (a.kind === 'activity') return Math.max(2, ...Object.keys(a.xp).map((st) => (wantStats[st] || 0) * (d.whoSolved ? 5 : 3) * a.xp[st] / 2 + (statRank(s, st) < 2 ? 2 : 0)));
    return 0;
  };
  return actions.slice().sort((a, b) => score(b) - score(a))[0];
}
// A friend-maker: everything for one person.
const friendPolicy = (target) => (s, actions) => {
  const nb = nextBond(s, target);
  const need = {};
  for (const r of [3, 5]) { const g = CAST[target].gates[r]; if (g && s.bonds[target].rank < r && statRank(s, g[0]) < g[1]) need[g[0]] = (need[g[0]] || 0) + (r === 3 ? 6 : 3); }
  const score = (a) => {
    if (a.who === target) return a.kind === 'bond' ? 100 : (nb.blocks || []).some((b) => b.kind === 'pts') ? 50 : 4;
    if (a.kind === 'activity') return Math.max(1, ...Object.keys(a.xp).map((st) => (need[st] || 0) * a.xp[st])) + (locationActions(s, a.place).some((x) => x.who === target) ? 2 : 0);
    if (a.kind === 'bond') return 5;
    if (a.kind === 'investigate') return 3;
    return 0;
  };
  return actions.slice().sort((a, b) => score(b) - score(a))[0];
};
function honestAnswer(s) {
  const d = deduction(s); const m = getMystery(s);
  if (!d.whoSolved) return { mode: 'pass' };
  const motiveClue = s.clues.map((id) => m.byId[id]).find((c) => c.logic.motive);
  return { mode: 'accuse', accuse: d.candidates[0], motive: motiveClue ? motiveClue.logic.motive : 'decoy', method: d.methodSolved ? d.methods[0] : 'key', approach: 'private' };
}

// ------------------------------------------------------------------ 3. detective bot on every variant
section('detective bot (real schedule, stat gates, 21 actions)');
const endingsSeen = {};
{
  let runs = 0; let solvedWho = 0; let full = 0; let clueSum = 0; const fails = {};
  for (const v of variants) {
    for (let i = 0; i < 12; i++) {
      const seed = (i * 104729 + 71) >>> 0;
      const s = playRun(newRun({ seed, name: 'Bot', force: v }), newMeta(), detectivePolicy);
      runs++; clueSum += s.clues.length;
      const d = deduction(s);
      ok(d.candidates.includes(v.culprit), 'the culprit is never excluded');
      if (d.whoSolved) solvedWho++;
      const res = resolveEnding(s, honestAnswer(s));
      if (res.right.who && res.right.why && res.right.how) full++;
      else { fails[`${res.right.why ? '' : 'why '}${res.right.how ? '' : 'how'}`] = (fails[`${res.right.why ? '' : 'why '}${res.right.how ? '' : 'how'}`] || 0) + 1; }
      endingsSeen[res.ending] = (endingsSeen[res.ending] || 0) + 1;
    }
  }
  console.log(`   ${runs} runs: culprit identified in ${solvedWho} (${Math.round((100 * solvedWho) / runs)}%), fully solved (who+why+how) in ${full} (${Math.round((100 * full) / runs)}%), avg ${(clueSum / runs).toFixed(1)} clues`);
  if (Object.keys(fails).length) console.log(`   misses: ${JSON.stringify(fails)}`);
  ok(solvedWho === runs, `a methodical player always identifies the culprit (${solvedWho}/${runs})`);
  ok(full / runs >= 0.9, `a methodical player nearly always gets why and how too (${full}/${runs})`);
}

// ------------------------------------------------------------------ 4. friend bot: every bond can be maxed, not all at once
section('bonds');
{
  for (const w of TOWNSFOLK) {
    let maxed = 0; const N = 20; let confessed = 0;
    for (let i = 0; i < N; i++) {
      const force = SUSPECTS.includes(w) ? { culprit: w } : null;
      const s = playRun(newRun({ seed: (i * 31337 + 5) >>> 0, name: 'Bot', force }), newMeta(), friendPolicy(w));
      if (s.bonds[w].rank === 5) maxed++;
      if (s.flags.confessed) { confessed++; ok(s.clues.includes('confession'), 'confession is in the notebook'); ok(deduction(s).whoSolved, 'a confession settles who'); }
      const maxedCount = TOWNSFOLK.filter((x) => s.bonds[x].rank === 5).length;
      ok(maxedCount <= 4, 'nobody can befriend everyone in one week');
    }
    console.log(`   ${w}: maxed in ${maxed}/${N} focused runs${SUSPECTS.includes(w) ? `, confessed in ${confessed}` : ''}`);
    ok(maxed >= N * 0.9, `${w} can reliably be befriended (${maxed}/${N})`);
    if (SUSPECTS.includes(w)) ok(confessed === maxed, `${w} confesses when culprit and fully trusted`);
  }
  // exclusivity: the greediest possible socialiser
  let most = 0;
  for (let i = 0; i < 40; i++) {
    const pol = (s, actions) => actions.slice().sort((a, b) => (b.kind === 'bond' ? 10 + b.rank : b.kind === 'chat' ? 1 : b.kind === 'activity' ? 3 : 0) - (a.kind === 'bond' ? 10 + a.rank : a.kind === 'chat' ? 1 : a.kind === 'activity' ? 3 : 0))[0];
    const s = playRun(newRun({ seed: (i * 977 + 3) >>> 0 }), newMeta(), pol);
    most = Math.max(most, TOWNSFOLK.filter((x) => s.bonds[x].rank === 5).length);
  }
  ok(most < TOWNSFOLK.length, 'bond routes are mutually exclusive');
  console.log(`   most bonds maxed by a pure socialiser in one run: ${most} of ${TOWNSFOLK.length}`);
}

// ------------------------------------------------------------------ 5. random bot, saves, endings, meta
section('random runs, saves and endings');
{
  const rng = makeRng(424242);
  let meta = newMeta(); let runs = 0;
  const approaches = ['private', 'public', 'own', 'blame'];
  for (let i = 0; i < 150; i++) {
    const seed = chooseSeed(meta, () => rng.int(0, 0xffffffff));
    const keeps = keepsakesUnlocked(meta);
    const keepsake = keeps.length && rng.chance(0.7) ? rng.pick(keeps) : null;
    const start = newRun({ seed, name: 'Rnd', keepsake, keepsakeStat: rng.pick(STATS) });
    const s = playRun(start, meta, (st, actions) => rng.pick(actions), { mode: 'random', rng, roundTrip: i % 5 === 0 });
    const opts = finaleOptions(s, meta);
    const m = getMystery(s);
    const mode = rng.weighted([['accuse', 6], ['pass', 1], ['verse', opts.canVerse ? 2 : 0]]);
    const accuse = rng.chance(0.6) ? m.culprit : rng.pick(SUSPECTS);
    const appr = opts.approaches(accuse).filter((a) => !a.locked);
    const ans = { mode, accuse, motive: rng.chance(0.6) ? m.motive : rng.pick(opts.motives[accuse]).id, method: rng.chance(0.6) ? m.method : rng.pick(METHODS), approach: rng.pick(appr).id };
    const end = buildEnding(s, ans, meta);
    ok(ENDINGS[end.ending], 'ending exists');
    ok(end.text.every((t) => !/\{\w+\}/.test(t)), `ending text has no stray tokens: ${end.ending}`);
    ok(end.scene.steps.every((st) => typeof st[1] !== 'string' || !/\{(?!name\})\w+\}/.test(st[1])), 'ending scene has no stray tokens');
    // the confrontation scene plays to the end
    const w = createWalker(JSON.parse(JSON.stringify(s)), end.scene, meta); let n = 0; while (w.next()) ok(++n < 200, 'ending scene ends');
    const applied = applyEnding(meta, s, end);
    meta = normalizeMeta(JSON.parse(JSON.stringify(applied.meta)));
    assert.deepEqual(meta, applied.meta); checks++;
    endingsSeen[end.ending] = (endingsSeen[end.ending] || 0) + 1; runs++;
    ok(approaches.includes(ans.approach), 'approach');
  }
  console.log(`   ${runs} random runs all reached an ending; meta after: ${JSON.stringify(completion(meta))}`);

  // determinism: the same seed and choices give the same run, with or without save round-trips
  const a = playRun(newRun({ seed: 99 }), newMeta(), detectivePolicy);
  const b = playRun(newRun({ seed: 99 }), newMeta(), detectivePolicy, { roundTrip: true });
  assert.deepEqual(a, b); checks++;
  ok(deserialize({ v: 2 }) === null && deserialize(null) === null, 'bad saves are rejected');

  // targeted endings
  const target = (name, build) => { const r = build(); ok(r.ending === name, `expected ending ${name}, got ${r.ending}`); endingsSeen[r.ending] = (endingsSeen[r.ending] || 0) + 1; return r; };
  const det = playRun(newRun({ seed: 7, force: { culprit: 'bram', motive: 'a', method: 'roof' } }), newMeta(), detectivePolicy);
  const right = { mode: 'accuse', accuse: 'bram', motive: 'a', method: 'roof' };
  target('returned', () => buildEnding(det, { ...right, approach: 'private' }, newMeta()));
  target('quietmending', () => buildEnding(det, { ...right, method: 'key', approach: 'private' }, newMeta()));
  target('unmasking', () => buildEnding(det, { ...right, approach: 'public' }, newMeta()));
  target('halftruth', () => buildEnding(det, { ...right, motive: 'decoy', approach: 'public' }, newMeta()));
  target('kindmistake', () => buildEnding(det, { ...right, accuse: 'pim', approach: 'private' }, newMeta()));
  target('wrongdoor', () => buildEnding(det, { ...right, accuse: 'pim', approach: 'public' }, newMeta()));
  target('papermoon', () => buildEnding(det, { mode: 'pass' }, newMeta()));
  const lazy = playRun(newRun({ seed: 7 }), newMeta(), (s, actions) => actions.find((x) => x.kind === 'activity'));
  target('tourist', () => buildEnding(lazy, { mode: 'pass' }, newMeta()));
  const friend = playRun(newRun({ seed: 11, force: { culprit: 'wren' } }), newMeta(), friendPolicy('wren'));
  ok(friend.flags.confessed, 'wren confessed');
  ok(finaleOptions(friend, newMeta()).approaches('wren').some((x) => x.id === 'own'), 'own-words approach offered after a confession');
  target('ownwords', () => buildEnding(friend, { mode: 'accuse', accuse: 'wren', motive: getMystery(friend).motive, method: getMystery(friend).method, approach: 'own' }, newMeta()));
  const brave = playRun(newRun({ seed: 12, force: { culprit: 'tobias' }, keepsake: 'notebook', keepsakeStat: 'nerve' }), newMeta(), (s, actions) => {
    if (statRank(s, 'nerve') < 4) { const row = actions.find((x) => x.kind === 'activity' && x.place === 'boathouse'); const t = actions.find((x) => x.kind === 'bond' && x.who === 'tobias'); return s.bonds.tobias.rank < 1 && t ? t : row; }
    return friendPolicy('tobias')(s, actions);
  });
  ok(statRank(brave, 'nerve') >= 4 && brave.bonds.tobias.rank >= 3, `brave run: nerve ${statRank(brave, 'nerve')}, bond ${brave.bonds.tobias.rank}`);
  ok(finaleOptions(brave, newMeta()).approaches('tobias').some((x) => x.id === 'blame' && !x.locked), 'take-the-blame offered');
  target('newcomerslie', () => buildEnding(brave, { mode: 'accuse', accuse: 'tobias', motive: 'a', method: 'key', approach: 'blame' }, newMeta()));
  // the true ending needs lines learned in earlier runs
  const fresh = newMeta();
  ok(!finaleOptions(friend, fresh).canVerse, 'no verse on a first run');
  const veteran = normalizeMeta({ runs: 4, solved: ['tobias', 'bram'], epilogues: { ysolde: true, wren: true }, endings: { returned: 2 } });
  ok(verseCount(veteran) === 4 && finaleOptions(friend, veteran).canVerse, 'four lines unlock the verse');
  target('remembers', () => buildEnding(friend, { mode: 'verse' }, veteran));
  const stranger = playRun(newRun({ seed: 13, force: { culprit: 'ysolde' } }), newMeta(), (s, actions) => actions.find((x) => x.kind === 'activity'));
  ok(buildEnding(stranger, { mode: 'verse' }, veteran).ending === 'papermoon', 'the verse needs the culprit to know you');
  // meta: unlock flow
  let m2 = newMeta();
  const e1 = buildEnding(friend, { mode: 'accuse', accuse: 'wren', motive: getMystery(friend).motive, method: getMystery(friend).method, approach: 'own' }, m2);
  const ap = applyEnding(m2, friend, e1); m2 = ap.meta;
  ok(m2.epilogues.wren && m2.solved.includes('wren') && m2.runs === 1, 'meta records the run');
  ok(keepsakesUnlocked(m2).includes('notebook') && keepsakesUnlocked(m2).includes('invitation') && keepsakesUnlocked(m2).includes('loupe'), 'keepsakes unlock');
  ok(ap.unlocks.some((u) => u.kind === 'verse') && ap.unlocks.some((u) => u.kind === 'ending') && ap.unlocks.some((u) => u.kind === 'keepsake'), 'unlock notices');
  ok(e1.epilogueCards.length >= 1 && e1.epilogueCards[0].text.includes('kraken'), 'culprit epilogue variant');
  // déjà vu options appear only with the right memory
  const dvCount = (meta) => { let n = 0; let s = newRun({ seed: 3 }); s.phase = 'day'; const { draft, scene } = beginAction({ ...s, day: 2, bonds: { ...s.bonds, odile: { rank: 1, pts: 5, met: true, chats: 0 } } }, { kind: 'bond', who: 'odile', place: 'teahouse' }); const w = createWalker(draft, scene, meta); for (let st = w.next(); st; st = w.next()) if (st.type === 'choice') { n += st.options.filter((o) => o.dv).length; w.choose(0); } return n; };
  ok(dvCount(newMeta()) === 0 && dvCount(normalizeMeta({ epilogues: { odile: true } })) === 1, 'déjà vu options need an earlier epilogue');
  // keepsakes change a run
  ok(statRank(newRun({ seed: 1, keepsake: 'notebook', keepsakeStat: 'craft' }), 'craft') === 2, 'notebook keepsake');
  ok(TOWNSFOLK.every((w) => newRun({ seed: 1, keepsake: 'invitation' }).bonds[w].met), 'invitation keepsake');
  const lp = newRun({ seed: 1, keepsake: 'loupe' }); lp.phase = 'day';
  const plain = newRun({ seed: 1 }); plain.phase = 'day';
  ok(locationActions(lp, 'boathouse').find((a) => a.kind === 'investigate').count >= locationActions(plain, 'boathouse').find((a) => a.kind === 'investigate').count, 'loupe keepsake');
  // notebook helpers do not throw
  ok(Array.isArray(leads(det)) && suspectStatus(det, 'bram').alibi === 'broken' && placeSummary(det, 'teahouse'), 'notebook helpers');
}

// ------------------------------------------------------------------ 6. schedule variety
section('schedule');
{
  const sigs = new Set();
  for (let i = 0; i < 50; i++) {
    const sch = generateSchedule(i * 17 + 1);
    sigs.add(JSON.stringify(sch));
    for (const w of TOWNSFOLK) for (let d = 0; d < 7; d++) ok(sch[w][d].filter(Boolean).length >= 2, 'everyone is about at least twice a day');
    ok(TOWNSFOLK.every((w) => sch[w][0][0] === CAST[w].home), 'everyone starts at home on day one');
  }
  ok(sigs.size === 50, 'schedules differ per seed');
  console.log('   50 seeds gave 50 different weekly schedules');
}

section('endings reached');
for (const e of ENDING_ORDER) { console.log(`   ${e.padEnd(14)} ${endingsSeen[e] || 0}`); ok(endingsSeen[e] > 0, `ending ${e} reachable`); }

console.log(`\nAll good: ${checks} checks passed.`);
