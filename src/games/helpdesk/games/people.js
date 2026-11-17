// Mini-games for the people-shaped tickets: passphrases, suspicious mail, mystery problems and video calls.
// Each is mount(host, spec, api) -> { hint() }. api: { scope, sfx, pop, done, miss, say, who }.
import { passwordVerdict, diagFamily, diagAnswer, diagPossible, solve } from '../puzzles.js';
import { el, esc } from '../dom.js';
import { icon } from '../icons.js';
import { portrait, EXTRA_LOOKS } from '../art.js';

const popAt = (api, node, n = 12) => { const r = node.getBoundingClientRect(); api.pop(r.left + r.width / 2, r.top + r.height / 2, n); };

// ---------- password: build a passphrase the person will actually remember ----------
export function mountPassword(host, spec, api) {
  const name = api.who ? api.who.name : 'They';
  const root = el(`<div class="pk-pw"><div class="pk-mg-note">${icon('key', 18)} Pick <b>${spec.slots}</b> cards. Words ${esc(name)} loves are easy to remember${spec.needNum ? ', and one number makes it sturdier' : ''}.</div>
    <div class="pk-pw-slots"></div><div class="pk-pw-meter"><i></i></div><div class="pk-pw-cards"></div></div>`);
  host.replaceChildren(root);
  const slots = root.querySelector('.pk-pw-slots'), cards = root.querySelector('.pk-pw-cards'), meter = root.querySelector('.pk-pw-meter i');
  let picked = [], finished = false, hinted = false;
  const render = () => {
    slots.replaceChildren(...Array.from({ length: spec.slots }, (_, i) => {
      const c = picked[i] != null ? spec.cards[picked[i]] : null;
      return el(`<button class="pk-pw-slot ${c ? 'full' : ''}" data-i="${i}">${c ? esc(c.w) : ''}</button>`);
    }));
    cards.replaceChildren(...spec.cards.map((c, i) => el(`<button class="pk-pw-card ${picked.includes(i) ? 'used' : ''} ${hinted && c.tag === 'hobby' ? 'fav' : ''} ${hinted && c.tag === 'weak' ? 'weak' : ''}" data-i="${i}">${hinted && c.tag === 'hobby' ? icon('heart', 13) : ''}${esc(c.w)}</button>`)));
    const good = picked.filter((i) => spec.cards[i].tag !== 'weak').length;
    meter.style.transform = `scaleX(${good / spec.slots})`;
    meter.style.background = picked.some((i) => spec.cards[i].tag === 'weak') ? '#f27d6b' : '#58b98f';
  };
  const judge = () => {
    const v = passwordVerdict(spec, picked);
    if (v === 'ok') { finished = true; api.sfx('good'); popAt(api, slots); api.scope.timeout(() => api.done(), 700); return; }
    api.miss(); api.sfx('nope');
    slots.classList.add('pk-shake'); api.scope.timeout(() => slots.classList.remove('pk-shake'), 400);
    if (v === 'weak') { const w = picked.map((i) => spec.cards[i]).find((c) => c.tag === 'weak'); api.say(`"${w.w}" is the first thing anyone would guess. Tap it to swap it out.`); }
    else if (v === 'num') api.say('Nearly. Swap one card for a number to make it sturdier.');
    else api.say(`Strong, but would ${name} remember it? Use more words that are theirs.`);
  };
  api.scope.on(root, 'click', (ev) => {
    if (finished) return;
    const s = ev.target.closest('.pk-pw-slot'), c = ev.target.closest('.pk-pw-card');
    if (s && picked[+s.dataset.i] != null) { picked.splice(+s.dataset.i, 1); api.sfx('tap'); render(); return; }
    if (!c) return;
    const i = +c.dataset.i;
    if (picked.includes(i)) { picked = picked.filter((x) => x !== i); api.sfx('tap'); render(); return; }
    if (picked.length >= spec.slots) { api.say('The passphrase is full. Tap a word in it to take it out.'); return; }
    picked.push(i); api.sfx('place'); render();
    if (picked.length === spec.slots) judge();
  });
  render();
  return { hint() { hinted = true; render(); api.say(`Kettle sniffs the cards. The ones with a heart smell of ${name}.`); } };
}

// ---------- inbox: friendly or fishy? ----------
export function mountInbox(host, spec, api) {
  const root = el(`<div class="pk-ib"><div class="pk-mg-note"></div><div class="pk-ib-stack"></div>
    <div class="pk-ib-btns"><button class="pk-ib-b ok" data-v="0">${icon('heart', 20)} Friendly</button><button class="pk-ib-b bad" data-v="1">${icon('fish', 20)} Fishy</button></div></div>`);
  host.replaceChildren(root);
  const stack = root.querySelector('.pk-ib-stack'), note = root.firstElementChild;
  let i = 0, finished = false;
  const show = () => {
    const m = spec.mails[i];
    note.innerHTML = `${icon('mail', 18)} Letter <b>${i + 1}</b> of <b>${spec.mails.length}</b>. Read the address as well as the name.`;
    stack.replaceChildren(el(`<div class="pk-ib-mail"><div class="from"><b>${esc(m.from)}</b><span class="addr">${esc(m.addr)}</span></div><div class="subj">${esc(m.subject)}</div><p>${esc(m.body)}</p></div>`));
  };
  api.scope.on(root, 'click', (ev) => {
    const b = ev.target.closest('.pk-ib-b');
    if (!b || finished) return;
    const m = spec.mails[i], saysPhish = b.dataset.v === '1';
    const card = stack.firstElementChild;
    if (saysPhish !== m.phish) {
      api.miss(); api.sfx('nope');
      card.classList.add('pk-shake'); api.scope.timeout(() => card.classList.remove('pk-shake'), 400);
      card.querySelector('.addr').classList.add('mark');
      api.say(m.phish ? m.tell : 'That one is real. The address is one of ours, and it asks for nothing.');
      return;
    }
    api.sfx(m.phish ? 'paper' : 'pop');
    card.classList.add(m.phish ? 'toss' : 'keep');
    i++;
    if (i >= spec.mails.length) { finished = true; api.scope.timeout(() => { popAt(api, stack); api.done(); }, 450); }
    else api.scope.timeout(show, 300);
  });
  show();
  return {
    hint() {
      const a = stack.querySelector('.addr');
      if (a) a.classList.add('mark');
      api.say(spec.mails[i].phish ? 'Kettle narrows his eyes at the address.' : 'Kettle yawns. Nothing wrong with this one.');
    },
  };
}

// ---------- diagnosis: ask two questions, then name the cause ----------
export function mountDiagnosis(host, spec, api) {
  const fam = diagFamily(spec);
  const root = el(`<div class="pk-dg"><div class="pk-dg-sym">"${esc(fam.symptom)}"</div><div class="pk-mg-note"></div><div class="pk-dg-qs"></div><h4>What is it?</h4><div class="pk-dg-cs"></div></div>`);
  host.replaceChildren(root);
  const qs = root.querySelector('.pk-dg-qs'), cs = root.querySelector('.pk-dg-cs'), note = root.querySelector('.pk-mg-note');
  const asked = [], wrong = new Set();
  let finished = false;
  const render = () => {
    const left = spec.asks - asked.length;
    note.innerHTML = `${icon('search', 18)} ${left > 0 ? `You can ask <b>${left}</b> more ${left === 1 ? 'question' : 'questions'}.` : 'No more questions. Time to decide.'}`;
    qs.replaceChildren(...spec.questions.map((qi) => {
      const q = fam.questions[qi], done = asked.includes(qi);
      return el(`<button class="pk-dg-q ${done ? 'asked' : ''}" data-q="${qi}" ${!done && left <= 0 ? 'disabled' : ''}><span>${esc(q.q)}</span>${done ? `<em>${esc(diagAnswer(spec, qi))}</em>` : ''}</button>`);
    }));
    const possible = new Set(diagPossible(spec, asked));
    cs.replaceChildren(...spec.causes.map((c) => el(`<button class="pk-dg-c ${!possible.has(c) || wrong.has(c) ? 'out' : ''}" data-c="${c}">${esc(fam.causes[c].name)}</button>`)));
  };
  api.scope.on(root, 'click', (ev) => {
    if (finished) return;
    const q = ev.target.closest('.pk-dg-q'), c = ev.target.closest('.pk-dg-c');
    if (q && !q.disabled && !asked.includes(+q.dataset.q)) { asked.push(+q.dataset.q); api.sfx('talk'); render(); return; }
    if (!c) return;
    const id = c.dataset.c;
    if (id === spec.truth) {
      finished = true; c.classList.add('right'); api.sfx('good');
      api.say(fam.causes[id].fix);
      popAt(api, c); api.scope.timeout(() => api.done(), 1500);
    } else {
      wrong.add(id); api.miss(); api.sfx('nope'); render();
      api.say(asked.length < spec.asks ? 'Not that. Another question might narrow it down.' : 'Not that one. Have another look at what they told you.');
    }
  });
  render();
  return {
    hint() {
      const best = (solve(spec).ask || []).find((qi) => !asked.includes(qi));
      if (best != null && asked.length < spec.asks) {
        const b = qs.querySelector(`[data-q="${best}"]`);
        b.classList.add('pk-pulse'); api.scope.timeout(() => b.classList.remove('pk-pulse'), 3200);
        api.say('Kettle taps a question with his tail. That one would settle a lot.');
      } else { wrong.add(spec.causes.find((c) => c !== spec.truth && !wrong.has(c))); render(); api.say('Kettle knocks one idea off the desk.'); }
    },
  };
}

// ---------- video call: pick the camera, microphone and speaker that actually work ----------
export function mountVideocall(host, spec, api) {
  const look = api.who ? api.who.look : EXTRA_LOOKS.you;
  const root = el(`<div class="pk-vc"><div class="pk-vc-prev"><div class="cam"></div><div class="lvl"><i></i><i></i><i></i><i></i><i></i></div><div class="spk">${icon('speaker', 20)}<span></span></div></div>
    <div class="pk-vc-ch"></div><div class="pk-vc-foot"><button class="pk-vc-mute">${icon('mic', 18)} <span>Muted</span></button><button class="pk-vc-join" disabled>${icon('video', 20)} Join the call</button></div></div>`);
  host.replaceChildren(root);
  const chs = root.querySelector('.pk-vc-ch'), cam = root.querySelector('.cam'), lvl = root.querySelector('.lvl'), spk = root.querySelector('.spk span');
  const mute = root.querySelector('.pk-vc-mute'), join = root.querySelector('.pk-vc-join');
  const pick = spec.channels.map((c) => c.start);
  let unmuted = !spec.muted, finished = false, hintCh = -1;
  if (!spec.muted) mute.style.display = 'none';
  const render = () => {
    chs.replaceChildren(...spec.channels.map((c, ci) => {
      const row = el(`<div class="pk-vc-row"><b>${icon(c.key === 'cam' ? 'camera' : c.key === 'mic' ? 'mic' : 'speaker', 18)} ${esc(c.label)}</b><div class="opts"></div></div>`);
      c.options.forEach((o, oi) => row.lastElementChild.append(el(`<button class="pk-vc-opt ${pick[ci] === oi ? 'on' : ''} ${hintCh === ci && o.good ? 'pk-pulse' : ''}" data-c="${ci}" data-o="${oi}">${esc(o.name)}</button>`)));
      return row;
    }));
    const sel = spec.channels.map((c, ci) => c.options[pick[ci]]);
    cam.innerHTML = sel[0].good ? portrait(look, { size: 86, expr: 'happy', bg: '#dff3e8' }) : `<span>${esc(sel[0].note)}</span>`;
    lvl.classList.toggle('live', sel[1].good && unmuted);
    lvl.title = sel[1].note;
    spk.textContent = sel[2].good ? 'Ding! Loud and clear.' : sel[2].note;
    root.querySelector('.spk').classList.toggle('ok', sel[2].good);
    mute.classList.toggle('on', unmuted);
    mute.querySelector('span').textContent = unmuted ? 'Microphone on' : 'Muted: tap to unmute';
    join.disabled = !(sel.every((o) => o.good) && unmuted);
    return sel;
  };
  api.scope.on(root, 'click', (ev) => {
    if (finished) return;
    const o = ev.target.closest('.pk-vc-opt');
    if (o) {
      const ci = +o.dataset.c;
      pick[ci] = +o.dataset.o; if (hintCh === ci) hintCh = -1;
      const opt = spec.channels[ci].options[pick[ci]];
      api.sfx(opt.good ? (ci === 2 ? 'ring' : 'pop') : 'tap');
      if (!opt.good) api.say(opt.note); else if (ci === 1 && !unmuted) api.say('That microphone works. It is still muted, though.');
      render(); return;
    }
    if (ev.target.closest('.pk-vc-mute')) { unmuted = !unmuted; api.sfx('click'); render(); return; }
    if (ev.target.closest('.pk-vc-join') && !join.disabled) {
      finished = true; api.sfx('ring');
      api.say(`${spec.caller} can see and hear everything. There is waving.`);
      popAt(api, cam, 16); api.scope.timeout(() => api.done(), 1100);
    }
  });
  render();
  return {
    hint() {
      const ci = spec.channels.findIndex((c, k) => !c.options[pick[k]].good);
      if (ci >= 0) { hintCh = ci; render(); api.say('Kettle rubs his chin on one of the choices.'); }
      else if (!unmuted) api.say('Everything is picked. Kettle stares at the mute button.');
    },
  };
}
