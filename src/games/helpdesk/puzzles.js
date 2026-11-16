// Patch & Kettle: puzzle generators, solvers and checkers for every mini-game. Pure, no DOM.
// gen(type, rng, level, opts) -> spec;  solve(spec) -> answer;  check(spec, answer) -> boolean.
import {
  CABLE_DEVICES, CABLE_COLORS, CABLE_SHAPES, WEAK_WORDS, PLAIN_WORDS, NUMBER_CARDS, CALENDAR_GROUPS,
  MAIL_FRIENDLY, MAIL_PHISH, DIAG, FILE_KINDS, FILE_NAMES, SHARED_FOLDERS, WEEKDAYS, CALL_DEVICES,
} from './stories.js';

const clampLevel = (l) => Math.max(1, Math.min(4, l | 0 || 1));
const range = (n) => Array.from({ length: n }, (_, i) => i);

// ---------- cables ----------
function genCables(rng, level, opts) {
  const n = [3, 4, 5, 6][level - 1];
  const devs = rng.shuffle(CABLE_DEVICES).slice(0, n);
  const colors = rng.shuffle(CABLE_COLORS).slice(0, n);
  const shapes = rng.shuffle(CABLE_SHAPES).slice(0, n);
  const items = devs.map((dev, i) => ({ dev, color: colors[i], shape: shapes[i] }));
  let plugOrder = rng.shuffle(range(n));
  // Make sure the tangle is a real tangle: no cable hangs straight down when tracing.
  if (level > 1) for (let i = 0; i < 20 && plugOrder.some((v, k) => v === k); i++) plugOrder = rng.shuffle(range(n));
  let portOrder = rng.shuffle(range(n));
  for (let i = 0; i < 20 && portOrder.every((v, k) => v === plugOrder[k]); i++) portOrder = rng.shuffle(range(n));
  return {
    type: 'cables', level, n, items, plugOrder, portOrder,
    mode: level === 1 ? 'match' : 'trace', tagged: !!opts.labels, wobble: range(n).map(() => rng.float(-1, 1)),
  };
}
const solveCables = (s) => s.plugOrder.map((item) => s.portOrder.indexOf(item));
const checkCables = (s, a) => Array.isArray(a) && a.length === s.n && a.every((port, k) => s.portOrder[port] === s.plugOrder[k]);

// ---------- wifi ----------
// Signal spreads `range` steps from a router through open cells; walls block it.
export function wifiSignal(spec, routers) {
  const { w, h } = spec;
  const wall = new Set(spec.walls);
  const best = new Array(w * h).fill(0);
  for (const r of routers) {
    const dist = new Map([[r, 0]]);
    const queue = [r];
    while (queue.length) {
      const c = queue.shift();
      const d = dist.get(c);
      best[c] = Math.max(best[c], spec.range - d + 1);
      if (d >= spec.range) continue;
      const x = c % w, y = (c / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nc = ny * w + nx;
        if (wall.has(nc) || dist.has(nc)) continue;
        dist.set(nc, d + 1);
        queue.push(nc);
      }
    }
  }
  return best;
}
function wifiSpots(spec) {
  const blocked = new Set([...spec.walls, ...spec.desks]);
  return range(spec.w * spec.h).filter((c) => !blocked.has(c));
}
function wifiMinRouters(spec, maxR) {
  const spots = wifiSpots(spec);
  const cover = spots.map((c) => { const sig = wifiSignal(spec, [c]); return spec.desks.map((d) => sig[d] > 0); });
  const nd = spec.desks.length;
  const ok = (idxs) => { for (let d = 0; d < nd; d++) { let c = false; for (const i of idxs) if (cover[i][d]) { c = true; break; } if (!c) return false; } return true; };
  for (let i = 0; i < spots.length; i++) if (ok([i])) return { r: 1, at: [spots[i]] };
  if (maxR >= 2) for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) if (ok([i, j])) return { r: 2, at: [spots[i], spots[j]] };
  if (maxR >= 3) for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) for (let k = j + 1; k < spots.length; k++) if (ok([i, j, k])) return { r: 3, at: [spots[i], spots[j], spots[k]] };
  return null;
}
function genWifi(rng, level) {
  const cfg = [{ w: 5, h: 5, r: 1, range: 3, walls: 3 }, { w: 6, h: 5, r: 2, range: 2, walls: 4 }, { w: 6, h: 6, r: 2, range: 3, walls: 7 }, { w: 6, h: 6, r: 3, range: 2, walls: 7 }][level - 1];
  let fallback = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const { w, h } = cfg;
    const walls = new Set();
    for (let i = 0; i < cfg.walls; i++) {
      const horiz = rng.chance(0.5);
      const len = rng.int(2, 3);
      let x = rng.int(0, w - 1), y = rng.int(0, h - 1);
      for (let k = 0; k < len; k++) {
        if (x >= 0 && y >= 0 && x < w && y < h) walls.add(y * w + x);
        if (horiz) x++; else y++;
      }
    }
    const free = range(w * h).filter((c) => !walls.has(c));
    if (free.length < w * h * 0.6) continue;
    const base = { type: 'wifi', level, w, h, walls: [...walls], desks: [], routers: cfg.r, range: cfg.range };
    const hidden = rng.shuffle(free).slice(0, cfg.r);
    const sigs = hidden.map((c) => wifiSignal(base, [c]));
    const desks = new Set();
    let fine = true;
    for (let i = 0; i < cfg.r; i++) {
      // Each hidden router gets desks only it can reach, far enough away to matter.
      const own = free.filter((c) => sigs[i][c] > 0 && sigs[i][c] <= 2 && !hidden.includes(c) && sigs.every((s, j) => j === i || s[c] === 0));
      if (own.length < 2) { fine = false; break; }
      rng.shuffle(own).slice(0, 2).forEach((c) => desks.add(c));
    }
    if (!fine) continue;
    const any = free.filter((c) => !hidden.includes(c) && !desks.has(c) && sigs.some((s) => s[c] > 0));
    rng.shuffle(any).slice(0, level >= 3 ? 2 : 1).forEach((c) => desks.add(c));
    const spec = { ...base, desks: [...desks].sort((a, b) => a - b) };
    const min = wifiMinRouters(spec, cfg.r);
    if (!min) continue;
    if (min.r === cfg.r) return spec;
    if (!fallback) fallback = { ...spec, routers: min.r };
  }
  if (fallback) return fallback;
  // Always-solvable last resort: an open room with one desk per corner region.
  return { type: 'wifi', level, w: 5, h: 5, walls: [], desks: [6, 8, 16], routers: 1, range: 3 };
}
const solveWifi = (s) => { const m = wifiMinRouters(s, s.routers); return m ? m.at : null; };
function checkWifi(s, a) {
  if (!Array.isArray(a) || a.length > s.routers || new Set(a).size !== a.length) return false;
  const spots = new Set(wifiSpots(s));
  if (!a.every((c) => spots.has(c))) return false;
  const sig = wifiSignal(s, a);
  return s.desks.every((d) => sig[d] > 0);
}

// ---------- printer ----------
function genPrinter(rng, level) {
  const cols = 5, rows = level >= 3 ? 5 : 4;
  const want = [8, 11, 14, 17][level - 1];
  const flapsN = [3, 4, 5, 6][level - 1];
  let path = null;
  for (let attempt = 0; attempt < 200 && !path; attempt++) {
    const start = rng.int(0, rows - 1) * cols;       // left edge: the paper tray
    const seen = new Set([start]);
    const walk = [start];
    let steps = 0;
    const dfs = () => {
      if (walk.length === want) return true;
      if (++steps > 4000) return false;
      const c = walk[walk.length - 1];
      const x = c % cols, y = (c / cols) | 0;
      for (const [dx, dy] of rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const nc = ny * cols + nx;
        if (seen.has(nc)) continue;
        seen.add(nc); walk.push(nc);
        if (dfs()) return true;
        seen.delete(nc); walk.pop();
      }
      return false;
    };
    if (dfs()) path = walk;
  }
  if (!path) path = range(want).map((i) => { const y = (i / cols) | 0; const x = i % cols; return y * cols + (y % 2 ? cols - 1 - x : x); });
  // Flaps sit on the path, never on the first or last cell, spread out along it.
  const inner = range(path.length - 2).map((i) => i + 1);
  let picks = [];
  for (let attempt = 0; attempt < 50; attempt++) {
    picks = rng.shuffle(inner).slice(0, flapsN).sort((a, b) => a - b);
    if (picks.every((p, i) => i === 0 || p - picks[i - 1] >= 2)) break;
  }
  const letters = rng.shuffle('ABCDEFGH'.split('').slice(0, flapsN + (level >= 3 ? level - 2 : 0)));
  const flaps = picks.map((p, i) => ({ id: letters[i], cell: path[p], at: p }));
  const offPath = range(cols * rows).filter((c) => !path.includes(c));
  const decoys = level >= 3 ? rng.shuffle(offPath).slice(0, level - 2).map((cell, i) => ({ id: letters[flapsN + i], cell, at: -1 })) : [];
  return { type: 'printer', level, cols, rows, path, flaps: rng.shuffle([...flaps, ...decoys]) };
}
const solvePrinter = (s) => s.flaps.filter((f) => f.at >= 0).sort((a, b) => a.at - b.at).map((f) => f.id);
const checkPrinter = (s, a) => { const want = solvePrinter(s); return Array.isArray(a) && a.length === want.length && a.every((id, i) => id === want[i]); };

// ---------- reboot ----------
function genReboot(rng, level) {
  const beats = [3, 3, 4, 5][level - 1];
  const speed = [2400, 2100, 1900, 1750][level - 1];
  return {
    type: 'reboot', level, hold: 1200,
    beats: range(beats).map((i) => ({ speed: Math.round(speed * rng.float(0.9, 1.1)), window: [0.26, 0.24, 0.22, 0.21][level - 1], pos: rng.float(0.15, 0.85), dir: i % 2 ? -1 : 1 })),
    lines: rng.shuffle(['Checking for crumbs', 'Waking the hard disk', 'Counting to ten', 'Finding the Wi-Fi', 'Warming the screen', 'Asking nicely']).slice(0, beats),
  };
}
const solveReboot = (s) => s.beats.map((b) => b.pos);
const checkReboot = (s, a) => Array.isArray(a) && a.length === s.beats.length && a.every((p, i) => Math.abs(p - s.beats[i].pos) <= s.beats[i].window / 2 + 1e-9);

// ---------- password ----------
function genPassword(rng, level, opts) {
  const words = opts.words && opts.words.length >= 5 ? opts.words : ['marigold', 'kettle', 'teapot', 'stairs', 'biscuit', 'lantern'];
  const slots = [3, 4, 4, 5][level - 1];
  const needNum = level >= 3;
  const hobbyMin = needNum ? slots - 1 : slots - 1;
  const hobby = rng.shuffle(words).slice(0, Math.min(words.length, hobbyMin + 1 + (level >= 2 ? 1 : 0)));
  const weak = rng.shuffle(WEAK_WORDS).slice(0, level >= 2 ? 3 : 2);
  const plain = rng.shuffle(PLAIN_WORDS).slice(0, 2);
  const nums = needNum ? rng.shuffle(NUMBER_CARDS).slice(0, 2) : [];
  const cards = rng.shuffle([
    ...hobby.map((w) => ({ w, tag: 'hobby' })), ...weak.map((w) => ({ w, tag: 'weak' })),
    ...plain.map((w) => ({ w, tag: 'plain' })), ...nums.map((w) => ({ w, tag: 'num' })),
  ]);
  return { type: 'password', level, slots, hobbyMin, needNum, cards };
}
export function passwordVerdict(s, a) {
  if (!Array.isArray(a) || a.length !== s.slots || new Set(a).size !== a.length) return 'short';
  const picked = a.map((i) => s.cards[i]);
  if (picked.some((c) => !c)) return 'short';
  if (picked.some((c) => c.tag === 'weak')) return 'weak';
  if (s.needNum && !picked.some((c) => c.tag === 'num')) return 'num';
  if (picked.filter((c) => c.tag === 'hobby').length < s.hobbyMin) return 'bland';
  return 'ok';
}
function solvePassword(s) {
  const idx = (tag) => s.cards.map((c, i) => (c.tag === tag ? i : -1)).filter((i) => i >= 0);
  const out = [];
  if (s.needNum) out.push(idx('num')[0]);
  for (const i of idx('hobby')) if (out.length < s.slots) out.push(i);
  for (const i of idx('plain')) if (out.length < s.slots) out.push(i);
  return out;
}
const checkPassword = (s, a) => passwordVerdict(s, a) === 'ok';

// ---------- calendar ----------
function genCalendar(rng, level, opts) {
  const days = 5, slots = 3, cells = days * slots;
  const cfg = [{ g: 2, k: 2, extra: 0.45 }, { g: 2, k: 3, extra: 0.35 }, { g: 3, k: 2, extra: 0.3 }, { g: 3, k: 3, extra: 0.22 }][level - 1];
  const names = opts.groups && opts.groups.length >= cfg.g ? opts.groups.slice(0, cfg.g) : rng.shuffle(CALENDAR_GROUPS).slice(0, cfg.g);
  for (let attempt = 0; attempt < 100; attempt++) {
    const used = new Set();
    const groups = [];
    let fine = true;
    for (let g = 0; g < cfg.g && fine; g++) {
      const dayPick = rng.shuffle(range(days)).slice(0, cfg.k);
      const sol = [];
      for (const d of dayPick) {
        const open = range(slots).map((sl) => d * slots + sl).filter((c) => !used.has(c));
        if (!open.length) { fine = false; break; }
        const c = rng.pick(open);
        used.add(c); sol.push(c);
      }
      const avail = range(cells).map((c) => sol.includes(c) || rng.chance(cfg.extra));
      groups.push({ name: names[g].name, color: names[g].color, need: cfg.k, avail });
    }
    if (!fine) continue;
    const spec = { type: 'calendar', level, days, slots, groups };
    if (solveCalendar(spec)) return spec;
  }
  // Last resort: two groups on alternating mornings.
  const mk = (name, color, on) => ({ name, color, need: 2, avail: range(cells).map((c) => on.includes(c)) });
  return { type: 'calendar', level, days, slots, groups: [mk(names[0].name, names[0].color, [0, 6]), mk(names[1].name, names[1].color, [3, 9])] };
}
function solveCalendar(s) {
  const cells = s.days * s.slots;
  const assign = new Array(cells).fill(-1);
  const place = (g, count, fromCell, daysUsed) => {
    if (g === s.groups.length) return true;
    if (count === s.groups[g].need) return place(g + 1, 0, 0, new Set());
    for (let c = fromCell; c < cells; c++) {
      const day = (c / s.slots) | 0;
      if (assign[c] !== -1 || !s.groups[g].avail[c] || daysUsed.has(day)) continue;
      assign[c] = g; daysUsed.add(day);
      if (place(g, count + 1, c + 1, daysUsed)) return true;
      assign[c] = -1; daysUsed.delete(day);
    }
    return false;
  };
  return place(0, 0, 0, new Set()) ? assign : null;
}
export function calendarProblems(s, a) {
  const out = { missing: [], clash: false };
  if (!Array.isArray(a) || a.length !== s.days * s.slots) { out.clash = true; return out; }
  s.groups.forEach((g, gi) => {
    const mine = a.map((v, c) => (v === gi ? c : -1)).filter((c) => c >= 0);
    if (mine.some((c) => !g.avail[c])) out.clash = true;
    const daySet = new Set(mine.map((c) => (c / s.slots) | 0));
    if (daySet.size !== mine.length) out.clash = true;
    if (mine.length !== g.need) out.missing.push(gi);
  });
  return out;
}
const checkCalendar = (s, a) => { const p = calendarProblems(s, a); return !p.clash && p.missing.length === 0; };

// ---------- inbox ----------
function genInbox(rng, level, opts) {
  const total = [4, 5, 6, 7][level - 1];
  const phishN = [2, 2, 3, 3][level - 1] + (level === 4 && rng.chance(0.5) ? 1 : 0);
  const pool = MAIL_PHISH.filter((m) => m.level <= Math.max(1, level));
  let phish = rng.shuffle(pool).slice(0, phishN);
  if (level >= 3 && !phish.some((m) => m.level === 3)) phish[0] = rng.pick(MAIL_PHISH.filter((m) => m.level === 3));
  phish = [...new Set(phish)];
  const friendly = rng.shuffle(MAIL_FRIENDLY.filter((m) => !opts.owner || !m.addr.startsWith(`${opts.owner}@`))).slice(0, total - phish.length);
  const mails = rng.shuffle([...phish.map((m) => ({ ...m, phish: true })), ...friendly.map((m) => ({ ...m, phish: false }))]);
  return { type: 'inbox', level, mails };
}
const solveInbox = (s) => s.mails.map((m) => m.phish);
const checkInbox = (s, a) => Array.isArray(a) && a.length === s.mails.length && a.every((v, i) => v === s.mails[i].phish);

// ---------- diagnosis ----------
function diagBestPair(fam, causes, truth) {
  const qs = fam.questions;
  for (let i = 0; i < qs.length; i++) {
    if (causes.every((c) => c === truth || qs[i].map[c] !== qs[i].map[truth])) return [i];
  }
  for (let i = 0; i < qs.length; i++) for (let j = i + 1; j < qs.length; j++) {
    if (causes.every((c) => c === truth || qs[i].map[c] !== qs[i].map[truth] || qs[j].map[c] !== qs[j].map[truth])) return [i, j];
  }
  return null;
}
function genDiagnosis(rng, level, opts) {
  const fams = opts.family ? DIAG.filter((f) => f.id === opts.family) : DIAG;
  for (let attempt = 0; attempt < 200; attempt++) {
    const fam = rng.pick(fams);
    const all = Object.keys(fam.causes);
    let truth = opts.cause && fam.causes[opts.cause] ? opts.cause : rng.pick(all);
    if (!opts.cause && opts.cat && rng.chance(0.5)) truth = all.find((c) => fam.causes[c].cat) || truth;
    const count = level >= 3 ? Math.min(5, all.length) : level === 2 ? 4 : 3;
    const causes = rng.shuffle([truth, ...rng.shuffle(all.filter((c) => c !== truth)).slice(0, count - 1)]);
    if (!diagBestPair(fam, causes, truth)) continue;
    const order = rng.shuffle(range(fam.questions.length));
    return { type: 'diagnosis', level, family: fam.id, causes, truth, questions: order, asks: 2 };
  }
  const fam = DIAG[0];
  return { type: 'diagnosis', level, family: fam.id, causes: ['monitor_off', 'asleep', 'brightness'], truth: 'asleep', questions: [0, 1, 2, 3], asks: 2 };
}
export const diagFamily = (s) => DIAG.find((f) => f.id === s.family);
export function diagAnswer(s, qIndex) { const q = diagFamily(s).questions[qIndex]; return q.a[q.map[s.truth]]; }
// Which causes are still possible after hearing the answers to the asked questions.
export function diagPossible(s, asked) {
  const fam = diagFamily(s);
  return s.causes.filter((c) => asked.every((qi) => fam.questions[qi].map[c] === fam.questions[qi].map[s.truth]));
}
function solveDiagnosis(s) {
  const ask = diagBestPair(diagFamily(s), s.causes, s.truth) || [];
  const left = diagPossible(s, ask);
  return { ask, pick: left.length === 1 ? left[0] : null };
}
const checkDiagnosis = (s, a) => !!a && a.pick === s.truth && (a.ask || []).length <= s.asks;

// ---------- desktop ----------
function genDesktop(rng, level, opts) {
  if (opts.find) return genFind(rng, level, opts);
  const kindsN = level >= 3 ? 4 : 3;
  const per = [2, 3, 2, 3][level - 1];
  const kinds = rng.shuffle(Object.keys(FILE_KINDS)).slice(0, kindsN);
  const files = [];
  for (const kind of kinds) {
    for (const base of rng.shuffle(FILE_NAMES[kind]).slice(0, per)) files.push({ name: `${base}.${FILE_KINDS[kind].ext}`, kind });
  }
  if (level >= 3) {
    const dupOf = rng.shuffle(files).slice(0, level - 1);
    for (const f of dupOf) files.push({ name: `copy_of_${f.name}`, kind: 'bin' });
  }
  const folders = kinds.map((kind, i) => ({ kind, name: opts.shared ? SHARED_FOLDERS[Object.keys(FILE_KINDS).indexOf(kind)] : FILE_KINDS[kind].folder }));
  if (level >= 3) folders.push({ kind: 'bin', name: 'Bin' });
  // Scatter on a jittered grid so nothing overlaps.
  const cols = 4, rowsN = Math.ceil(files.length / cols);
  const slots = rng.shuffle(range(cols * rowsN)).slice(0, files.length);
  const out = rng.shuffle(files).map((f, i) => ({ ...f, x: (slots[i] % cols + 0.5 + rng.float(-0.16, 0.16)) / cols, y: (((slots[i] / cols) | 0) + 0.5 + rng.float(-0.14, 0.14)) / rowsN, tilt: rng.float(-9, 9) }));
  return { type: 'desktop', mode: 'tidy', level, folders, files: out, shared: !!opts.shared };
}
function genFind(rng, level, opts) {
  const n = [6, 7, 8, 9][level - 1];
  const kind = rng.pick(['doc', 'sheet', 'photo']);
  const bases = rng.shuffle(FILE_NAMES[kind]);
  const stem = bases[0];
  const day = rng.int(1, 4);
  const ext = FILE_KINDS[kind].ext;
  const files = [{ name: `${stem}.${ext}`, kind, day, target: true }];
  // Near misses: the same file from other days, and other files from the same day.
  const otherDays = rng.shuffle(range(5).filter((d) => d !== day)).slice(0, level >= 2 ? 2 : 1);
  for (const d of otherDays) files.push({ name: `${stem}.${ext}`, kind, day: d });
  let b = 1;
  while (files.length < n) {
    const k2 = rng.chance(0.6) ? kind : rng.pick(Object.keys(FILE_KINDS));
    const base = k2 === kind ? bases[b++ % bases.length] : rng.pick(FILE_NAMES[k2]);
    const cand = { name: `${base}.${FILE_KINDS[k2].ext}`, kind: k2, day: rng.chance(0.5) ? day : rng.int(0, 4) };
    if (base === stem && k2 === kind) continue;
    if (files.some((f) => f.name === cand.name && f.day === cand.day)) continue;
    files.push(cand);
  }
  const shuffled = rng.shuffle(files);
  return {
    type: 'desktop', mode: 'find', level, files: shuffled.map(({ target, ...f }) => f), target: shuffled.findIndex((f) => f.target),
    clue: { stem, kind, day, dayName: WEEKDAYS[day] }, backups: !!opts.backups,
  };
}
const solveDesktop = (s) => (s.mode === 'find' ? s.target : s.files.map((f) => f.kind));
function checkDesktop(s, a) {
  if (s.mode === 'find') return a === s.target;
  return Array.isArray(a) && a.length === s.files.length && a.every((k, i) => k === s.files[i].kind);
}

// ---------- videocall ----------
function genVideocall(rng, level, opts) {
  const optsN = [2, 3, 3, 4][level - 1];
  const channels = ['cam', 'mic', 'spk'].map((key) => {
    const d = CALL_DEVICES[key];
    const good = { name: rng.pick(d.good), good: true, note: '' };
    const bad = rng.shuffle(d.bad).slice(0, optsN - 1).map(([name, note]) => ({ name, good: false, note }));
    const options = rng.shuffle([good, ...bad]);
    return { key, label: d.label, options, start: options.findIndex((o) => !o.good) };
  });
  return { type: 'videocall', level, channels, muted: level >= 3, caller: opts.caller || 'the caller' };
}
const solveVideocall = (s) => ({ pick: s.channels.map((c) => c.options.findIndex((o) => o.good)), unmuted: true });
const checkVideocall = (s, a) => !!a && Array.isArray(a.pick) && s.channels.every((c, i) => c.options[a.pick[i]] && c.options[a.pick[i]].good) && (!s.muted || a.unmuted === true);

// ---------- registry ----------
const REG = {
  cables: [genCables, solveCables, checkCables],
  wifi: [genWifi, solveWifi, checkWifi],
  printer: [genPrinter, solvePrinter, checkPrinter],
  reboot: [genReboot, solveReboot, checkReboot],
  password: [genPassword, solvePassword, checkPassword],
  calendar: [genCalendar, solveCalendar, checkCalendar],
  inbox: [genInbox, solveInbox, checkInbox],
  diagnosis: [genDiagnosis, solveDiagnosis, checkDiagnosis],
  desktop: [genDesktop, solveDesktop, checkDesktop],
  videocall: [genVideocall, solveVideocall, checkVideocall],
};

export const PUZZLE_TYPES = Object.keys(REG);
export function gen(type, rng, level, opts = {}) { return REG[type][0](rng, clampLevel(level), opts); }
export function solve(spec) { return REG[spec.type][1](spec); }
export function check(spec, answer) { return !!REG[spec.type][2](spec, answer); }
