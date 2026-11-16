// Headless test: fuzzes every puzzle generator against its solver, then plays whole campaigns with a bot.
//   node src/games/helpdesk/sim.test.mjs
import assert from 'node:assert/strict';
import { makeRng } from '../../shell/rng.js';
import { gen, solve, check, PUZZLE_TYPES, wifiSignal, passwordVerdict, diagPossible } from './puzzles.js';
import * as S from './sim.js';
import { TENANTS, THREADS, THREAD_BY_ID, EVENTS, UPGRADES, FACTS, HATS, OPEN_DAY, DECOR, TENANT_BY_ID } from './data.js';
import { TYPES, TYPE_IDS, DIAG, STORIES } from './stories.js';

let checks = 0;
const ok = (cond, msg) => { checks++; assert.ok(cond, msg); };

// ---- content sanity ----
for (const t of THREADS) {
  ok(FACTS[t.a] && FACTS[t.b], `thread ${t.id} facts exist`);
  ok(FACTS[t.a].t !== FACTS[t.b].t, `thread ${t.id} joins two people`);
  ok(!t.project || TYPES[t.project], `thread ${t.id} project type`);
  ok(DECOR[t.decor], `thread ${t.id} decor`);
  for (const [who] of t.scene) ok(TENANT_BY_ID[who], `thread ${t.id} scene speaker ${who}`);
}
for (const e of EVENTS) {
  ok(DECOR[e.decor], `event ${e.id} decor`);
  for (const set of e.needs) for (const id of set) ok(THREAD_BY_ID[id], `event ${e.id} needs ${id}`);
  for (const [who] of e.scene) ok(TENANT_BY_ID[who], `event ${e.id} scene speaker ${who}`);
}
for (const u of UPGRADES) ok(!u.decor || DECOR[u.decor], `upgrade ${u.id} decor`);
for (const f of Object.keys(FACTS)) ok(TENANT_BY_ID[FACTS[f].t], `fact ${f} owner`);
for (const ty of TYPE_IDS) ok(STORIES[ty] && STORIES[ty].length >= 2, `stories for ${ty}`);
for (const fam of DIAG) {
  for (const q of fam.questions) for (const c of Object.keys(fam.causes)) ok(q.a[q.map[c]] != null, `diag ${fam.id} answer for ${c}`);
}

// ---- puzzles: every generated puzzle is solvable, and wrong answers are refused ----
const perType = {};
for (const type of PUZZLE_TYPES) {
  perType[type] = 0;
  for (let level = 1; level <= 4; level++) {
    for (let seed = 1; seed <= 250; seed++) {
      const variants = type === 'desktop' ? [{}, { find: true }, { find: true, backups: true }, { shared: true }]
        : type === 'cables' ? [{}, { labels: true }]
        : type === 'password' ? [{ words: TENANTS[seed % TENANTS.length].words }]
        : type === 'inbox' ? [{ owner: TENANTS[seed % TENANTS.length].id }]
        : type === 'diagnosis' ? [{}, { cat: true }, { family: 'typing', cause: 'cat_keys' }]
        : [{}];
      for (const opts of variants) {
        const spec = gen(type, makeRng(seed * 7919 + level), level, opts);
        const again = gen(type, makeRng(seed * 7919 + level), level, opts);
        ok(JSON.stringify(spec) === JSON.stringify(again), `${type} L${level} deterministic`);
        const answer = solve(spec);
        ok(answer != null && check(spec, answer), `${type} L${level} seed ${seed} solvable`);
        perType[type]++;
        // A deliberately wrong answer must not pass.
        if (type === 'cables') { const bad = answer.slice(); [bad[0], bad[1]] = [bad[1], bad[0]]; ok(!check(spec, bad), 'cables wrong refused'); }
        if (type === 'wifi') {
          ok(!check(spec, []), 'wifi empty refused');
          ok(answer.length <= spec.routers, 'wifi within router budget');
          const sig = wifiSignal(spec, answer);
          ok(spec.desks.every((d) => sig[d] > 0), 'wifi covers desks');
          ok(spec.desks.every((d) => !spec.walls.includes(d)), 'wifi desks not in walls');
        }
        if (type === 'printer') { ok(!check(spec, answer.slice().reverse()), 'printer reversed refused'); ok(new Set(spec.flaps.map((f) => f.id)).size === spec.flaps.length, 'printer flap ids unique'); ok(new Set(spec.flaps.map((f) => f.cell)).size === spec.flaps.length, 'printer flap cells unique'); }
        if (type === 'reboot') { ok(spec.beats.every((b) => b.window * b.speed >= 280), 'reboot window humane'); }
        if (type === 'password') {
          const weak = spec.cards.findIndex((c) => c.tag === 'weak');
          const bad = answer.slice(); bad[0] = weak;
          ok(passwordVerdict(spec, bad) === 'weak', 'weak password refused');
        }
        if (type === 'calendar') { ok(!check(spec, new Array(15).fill(-1)), 'calendar empty refused'); }
        if (type === 'inbox') { ok(!check(spec, answer.map((v) => !v)), 'inbox inverted refused'); ok(spec.mails.some((m) => m.phish) && spec.mails.some((m) => !m.phish), 'inbox has both kinds'); ok(new Set(spec.mails.map((m) => m.subject)).size === spec.mails.length, 'inbox no duplicates'); }
        if (type === 'diagnosis') { ok(answer.ask.length <= 2, 'diagnosis needs at most two questions'); ok(diagPossible(spec, answer.ask).length === 1, 'diagnosis unique'); ok(spec.causes.includes(spec.truth), 'truth among causes'); }
        if (type === 'desktop' && spec.mode === 'find') {
          const same = spec.files.filter((f) => f.name === spec.files[spec.target].name && f.day === spec.files[spec.target].day);
          ok(same.length === 1, 'find target unique');
          ok(!check(spec, (spec.target + 1) % spec.files.length), 'find wrong refused');
        }
        if (type === 'desktop' && spec.mode === 'tidy') { ok(spec.files.every((f) => spec.folders.some((fo) => fo.kind === f.kind)), 'every file has a folder'); }
        if (type === 'videocall') { ok(spec.channels.every((c) => c.options.filter((o) => o.good).length === 1), 'one good device per channel'); ok(!check(spec, { pick: spec.channels.map((c) => c.start), unmuted: true }), 'videocall start state is not solved'); }
      }
    }
  }
}

// ---- campaign bot ----
function playDay(s, rng, style) {
  const report = S.beginDay(s);
  ok(report && !report.openDay, 'day begins');
  ok(s.hours >= 6, 'day has hours');
  let guard = 0, teas = 0;
  while (guard++ < 80) {
    if (S.petsLeft(s) > 0) { ok(S.pet(s), 'pet kettle'); continue; }
    if (style.social) {
      const hs = S.hunches(s);
      if (hs.length && s.hours >= 1 && rng.chance(style.spot || 1)) {
        const th = THREAD_BY_ID[hs[0]];
        const r = S.introduce(s, th.a, th.b);
        ok(r.status === 'thread' || r.status === 'project', `introduce ${th.id}: ${r.status}`);
        continue;
      }
      const ev = S.eventsReady(s).find((id) => S.canHold(s, id));
      if (ev) { ok(S.holdEvent(s, ev), 'event held'); continue; }
    }
    if (style.invest) {
      const u = UPGRADES.find((x) => S.canBuy(s, x.id));
      if (u) { ok(S.buy(s, u.id), 'bought'); continue; }
      const w = TYPE_IDS.find((ty) => S.canWriteWiki(s, ty));
      if (w) { ok(S.writeWiki(s, w), 'wiki written'); continue; }
      const h = HATS.find((x) => S.canBuyHat(s, x.id));
      if (h && s.goodwill > 30) { ok(S.buyHat(s, h.id), 'hat'); continue; }
    }
    const tickets = s.board.slice().sort((a, b) => (b.project ? 1 : 0) - (a.project ? 1 : 0) || b.age - a.age);
    const del = tickets.find((t) => S.canDelegate(s, t));
    if (del) { ok(S.delegate(s, del.id), 'delegated'); continue; }
    if (style.social && teas < (style.teas || 0)) {
      const who = TENANTS.map((x) => x.id).find((id) => S.canTea(s, id) && S.unknownCount(s, id) > 0);
      if (who) { const r = S.tea(s, who); ok(r && r.facts.length >= 1, 'tea reveals something'); teas++; continue; }
    }
    const t = tickets.find((x) => S.hoursFor(s, x) <= s.hours);
    if (t) {
      const spec = S.ticketPuzzle(s, t);
      ok(check(spec, solve(spec)), `ticket puzzle ${t.type} solvable in campaign`);
      ok(S.ticketLines(t).every((l) => l && !l.includes('{') && !l.includes('undefined')), 'ticket lines filled');
      const res = S.completeTicket(s, t.id, { reply: rng.pick(['kind', 'funny', 'practical', null]), clean: rng.chance(0.7) });
      ok(res && res.gw > 0, 'ticket completes');
      continue;
    }
    break;
  }
  ok(s.hours >= 0, 'hours never negative');
  ok(s.budget >= 0 && s.goodwill >= 0, 'no debt');
  const sum = S.endDay(s);
  ok(sum, 'day ends');
  return sum;
}

function playCampaign(seed, style, quirk) {
  const s = S.newGame(seed, quirk);
  const rng = makeRng(seed ^ 0xabcdef);
  let weeks = 0;
  while (s.day < OPEN_DAY) {
    const sum = playDay(s, rng, style);
    if (sum.week) weeks++;
    ok(S.waiting(s) <= S.BOARD_CAP + 1, 'board stays bounded');
  }
  ok(weeks === 3, 'three weekly summaries');
  const r = S.beginDay(s);
  ok(r.openDay, 'open day arrives');
  const fin = S.openDay(s);
  ok(fin && s.ended && fin.score > 0, 'finale');
  for (let i = 0; i < 4; i++) playDay(s, rng, style);   // free play continues
  return { s, fin };
}

const SEEDS = 120;
const quirks = [null, 'labelmaker', 'catperson', 'chatterbox', 'earlybird', 'thrifty'];
const agg = { threads: [], events: [], prevented: [], solved: [], mood: [], drifted: [], titles: {}, lazyThreads: [], fixerMood: [], fixerDrift: [], fixerSolved: [], chatThreads: [], chatDrift: [], chatMood: [], casualThreads: [], casualMood: [] };
const allThreads = new Set();
for (let i = 1; i <= SEEDS; i++) {
  const { s, fin } = playCampaign(i * 2654435761 >>> 0, { social: true, invest: true, teas: 2, spot: 0.7 }, quirks[i % quirks.length]);
  agg.threads.push(fin.threads.length); agg.events.push(fin.events.length); agg.prevented.push(fin.prevented);
  agg.solved.push(fin.solved); agg.mood.push(fin.mood); agg.drifted.push(s.stats.drifted);
  agg.titles[fin.title] = (agg.titles[fin.title] || 0) + 1;
  fin.threads.forEach((t) => allThreads.add(t));
  ok(fin.threads.length <= S.ACTIVE_THREADS, 'threads within the active set');
  ok(s.active.length === S.ACTIVE_THREADS, 'active thread count');
  const fixer = playCampaign(i * 2654435761 >>> 0, { social: false, invest: false }, null);
  const chat = playCampaign(i * 2654435761 >>> 0, { social: true, invest: false, teas: 2, spot: 0.7 }, null);
  agg.chatThreads.push(chat.fin.threads.length); agg.chatDrift.push(chat.s.stats.drifted); agg.chatMood.push(chat.fin.mood);
  const casual = playCampaign(i * 2654435761 >>> 0, { social: true, invest: true, teas: 1, spot: 0.5 }, null);
  agg.casualThreads.push(casual.fin.threads.length); agg.casualMood.push(casual.fin.mood);
  agg.titles[casual.fin.title] = (agg.titles[casual.fin.title] || 0) + 1;
  agg.titles[fixer.fin.title] = (agg.titles[fixer.fin.title] || 0) + 1;
  agg.lazyThreads.push(fixer.fin.threads.length); agg.fixerMood.push(fixer.fin.mood); agg.fixerDrift.push(fixer.s.stats.drifted); agg.fixerSolved.push(fixer.fin.solved);
}
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
const minmax = (a) => `${Math.min(...a)}..${Math.max(...a)}`;
// ---- saves round-trip and stay deterministic ----
for (let i = 1; i <= 20; i++) {
  const a = S.newGame(1000 + i, quirks[i % quirks.length]);
  const rngA = makeRng(i);
  for (let d = 0; d < 6; d++) playDay(a, rngA, { social: true, invest: true, teas: 2 });
  const b = S.deserialize(S.serialize(a));
  ok(b && JSON.stringify(a) === JSON.stringify(b), 'save round-trips');
  const r1 = makeRng(99), r2 = makeRng(99);
  for (let d = 0; d < 4; d++) { playDay(a, r1, { social: true, invest: true, teas: 2 }); playDay(b, r2, { social: true, invest: true, teas: 2 }); }
  ok(JSON.stringify(a) === JSON.stringify(b), 'a loaded save plays out identically');
  const mid = S.newGame(2000 + i);
  S.beginDay(mid);
  const t = mid.board[0];
  const before = JSON.stringify(S.ticketPuzzle(mid, t));
  const loaded = S.deserialize(S.serialize(mid));
  ok(JSON.stringify(S.ticketPuzzle(loaded, loaded.board[0])) === before, 'a ticket puzzle is the same after loading');
}
ok(S.deserialize('{"v":0}') === null && S.deserialize('nonsense') === null, 'bad saves are refused');

// ---- a few rule checks ----
{
  const s = S.newGame(42);
  S.beginDay(s);
  ok(s.board.length === 3 && s.board[0].who === 'bea', 'day one is scripted');
  const r = S.introduce(s, 'rashid_jingle', 'juno_synth');
  ok(r.status === 'unknown', 'cannot introduce on facts you have not learned');
  s.people.rashid.known.push('rashid_jingle'); s.people.juno.known.push('juno_synth');
  ok(S.hunches(s).includes('jingle'), 'hunch appears once both facts are known');
  const bad = S.introduce(s, 'rashid_jingle', s.people.juno.facts.find((f) => f !== 'juno_synth'));
  ok(bad.status === 'unknown' || bad.status === 'nope', 'a wrong pairing is gently refused');
  const h0 = s.hours;
  ok(S.introduce(s, 'juno_synth', 'rashid_jingle').status === 'thread' && s.hours === h0 - 1, 'introduction costs an hour and works either way round');
  ok(s.decor.includes('onair') && s.threads.includes('jingle'), 'thread leaves a mark on the house');
  ok(S.introduce(s, 'juno_synth', 'rashid_jingle').status === 'already', 'no double introductions');
}

console.log(`puzzles verified: ${Object.entries(perType).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`campaigns: ${SEEDS} seeds x 4 play styles, all reached Open Day and continued into free play`);
console.log(`connector bot: threads avg ${avg(agg.threads)} (${minmax(agg.threads)}) of ${S.ACTIVE_THREADS} active / ${THREADS.length} total, events avg ${avg(agg.events)} (${minmax(agg.events)}), solved avg ${avg(agg.solved)}, prevented avg ${avg(agg.prevented)}, drifted avg ${avg(agg.drifted)}, cozy avg ${avg(agg.mood)} (${minmax(agg.mood)})`);
console.log(`casual bot (one tea a day, spots half the matches): threads avg ${avg(agg.casualThreads)} (${minmax(agg.casualThreads)}), cozy avg ${avg(agg.casualMood)}`);
console.log(`chatty bot (never invests): threads avg ${avg(agg.chatThreads)}, drifted avg ${avg(agg.chatDrift)}, cozy avg ${avg(agg.chatMood)}`);
console.log(`firefighter bot: threads avg ${avg(agg.lazyThreads)}, solved avg ${avg(agg.fixerSolved)}, drifted avg ${avg(agg.fixerDrift)}, cozy avg ${avg(agg.fixerMood)}`);
console.log(`titles: ${Object.entries(agg.titles).map(([k, v]) => `${k} ${v}`).join(', ')}`);
ok(allThreads.size === THREADS.length, 'every thread is reachable in some run');
ok(Math.max(...agg.threads) < THREADS.length, 'no single run completes every possible thread');
ok(Number(avg(agg.mood)) > Number(avg(agg.fixerMood)) + 10, 'connecting people makes a cozier house than firefighting alone');
ok(Number(avg(agg.drifted)) < Number(avg(agg.chatDrift)) - 5, 'prevention frees time: fewer tickets drift away than when only socialising');
ok(Number(avg(agg.casualThreads)) < S.ACTIVE_THREADS - 3, 'a casual player leaves threads for another run');

console.log(`ok: ${checks} checks passed`);
