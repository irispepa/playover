// HTML overlay for Bastion Maze: HUD, tray, sheets, modals. No game rules here; it calls `h` handlers.
import {
  TOWERS, TOWER_ORDER, ENEMIES, ABILITIES, CARD_BY_ID, CARD_KIND_NAMES, PRIORITIES, PRIORITY_NAMES, DTYPE_NAMES,
  ARCHETYPES, ARCHETYPE_ORDER, DIFFICULTY, TILE_NAMES, TILE_INFO, HERO, HERO_WEAPONS, maxLevel, baseLevels,
} from './data.js';
import { ICON, towerIcon, enemyIcon } from './icons.js';
import {
  buildCost, upgradeInfo, sellValue, nextWaveSummary, canCallWave, earlyBonus, abilityList, heroStats, heroWeapons, cardStrength,
} from './sim.js';

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function btn(cls, html, fn) {
  const b = el('button', cls, html);
  b.type = 'button';
  b.addEventListener('click', (e) => { e.stopPropagation(); fn && fn(e); });
  return b;
}
const fmt = (n) => {
  n = Math.round(n);
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
};
const f1 = (n) => (n >= 100 ? fmt(n) : n >= 10 ? n.toFixed(0) : n.toFixed(1));

export function createHud(ui, h) {
  const rootEl = el('div', 'bm');
  ui.appendChild(rootEl);

  // ---------------------------------------------------------------- top bar
  const top = el('div', 'bm-top');
  const row1 = el('div', 'bm-row');
  const menuB = btn('bm-iconbtn', ICON.menu, () => h.pause());
  menuB.setAttribute('aria-label', 'Menu');
  const lives = el('div', 'bm-chip', `${ICON.heart}<span>0</span>`);
  const gold = el('div', 'bm-chip', `${ICON.coin}<span>0</span>`);
  const wave = el('div', 'bm-chip', `${ICON.wave}<span>0</span>`);
  const speed = el('div', 'bm-speed');
  let lastSpeed = 1, curSpeed = 1;
  const pauseB = btn('', ICON.pause, () => h.setSpeed(curSpeed > 0 ? 0 : lastSpeed));
  pauseB.setAttribute('aria-label', 'Pause or resume');
  const speedB = btn('', '1x', () => h.setSpeed(curSpeed === 0 ? lastSpeed : curSpeed === 1 ? 2 : curSpeed === 2 ? 4 : 1));
  speedB.setAttribute('aria-label', 'Game speed');
  speed.append(pauseB, speedB);
  row1.append(menuB, lives, gold, el('div', 'bm-spacer'), speed);
  const row2 = el('div', 'bm-row');
  const next = el('div', 'bm-next');
  next.append(el('span', 'lbl', 'Next'));
  const nextList = el('div', 'bm-enemies');
  next.appendChild(nextList);
  next.addEventListener('click', () => h.showWaveInfo());
  const call = btn('bm-call', 'Start', () => h.callWave());
  row2.append(wave, next, call);
  top.append(row1, row2);
  rootEl.appendChild(top);

  // ---------------------------------------------------------------- side columns
  const side = el('div', 'bm-side');
  const abBtns = {};
  for (const id of ['orbital', 'meteor', 'freeze', 'rush']) {
    const b = btn('bm-abtn', `${ICON[id]}<div class="cd"></div><div class="cdt"></div>`, () => h.ability(id));
    b.setAttribute('aria-label', ABILITIES[id].name);
    abBtns[id] = b;
    side.appendChild(b);
  }
  const heroBtns = {
    dash: btn('bm-abtn', `${ICON.dash}<div class="cd"></div><div class="cdt"></div>`, () => h.dash()),
    ult: btn('bm-abtn', `${ICON.nova}<div class="cd"></div><div class="cdt"></div>`, () => h.ult()),
    swap: btn('bm-abtn', `${ICON.swap}<div class="cdt"></div>`, () => h.swap()),
  };
  for (const b of Object.values(heroBtns)) side.appendChild(b);
  rootEl.appendChild(side);

  const left = el('div', 'bm-left');
  const modeB = btn('bm-mode', `${ICON.hero}<span>Hero</span>`, () => h.toggleHero());
  const hstat = el('div', 'bm-hstat', `<div class="lv">Lv 1</div><div class="bm-bar"><i></i></div><div class="bm-bar xp"><i></i></div><div class="pts"></div>`);
  hstat.addEventListener('click', () => h.openHeroSheet());
  left.append(modeB, hstat);
  rootEl.appendChild(left);

  // ---------------------------------------------------------------- bottom (build)
  const bottom = el('div', 'bm-bottom');
  const ctx = el('div', 'bm-ctx');
  const ctxTxt = el('div', 'txt');
  const confirm = btn('bm-confirm', `${ICON.check}<span>Build</span>`, () => h.confirm());
  const cancel = btn('bm-x', ICON.close, () => h.cancel());
  ctx.append(ctxTxt, confirm, cancel);
  const tray = el('div', 'bm-tray');
  const cards = {};
  for (const type of TOWER_ORDER) {
    const c = btn('bm-card', `${towerIcon(type)}<span class="nm">${TOWERS[type].name}</span><span class="ct">${ICON.coin}<span>0</span></span>`, () => h.arm(type));
    cards[type] = c;
    tray.appendChild(c);
  }
  bottom.append(ctx, tray);
  rootEl.appendChild(bottom);

  // ---------------------------------------------------------------- hero mode controls
  const stickL = el('div', 'bm-stick', '<i></i>');
  const stickR = el('div', 'bm-stick aim', '<i></i>');
  const heroHint = el('div', 'bm-hint', 'Left thumb: move · Right thumb: aim and fire · Otherwise auto-aim');
  rootEl.append(stickL, stickR, heroHint);

  const toasts = el('div', 'bm-toasts');
  const flash = el('div', 'bm-flash');
  const targetMsg = el('div', 'bm-target bm-hidden', 'Tap the map to aim');
  rootEl.append(flash, toasts, targetMsg);

  let sheet = null, modal = null;
  const floats = [];
  for (let i = 0; i < 16; i++) { const f = el('div', 'bm-float'); f.style.opacity = '0'; rootEl.appendChild(f); floats.push({ el: f, t: 0, x: 0, y: 0 }); }
  let floatHead = 0;

  // ---------------------------------------------------------------- update
  const cache = {};
  const setText = (key, node, v) => { if (cache[key] !== v) { cache[key] = v; node.textContent = v; } };
  const setCls = (key, node, cls, on) => { const k = key + cls; if (cache[k] !== on) { cache[k] = on; node.classList.toggle(cls, on); } };
  const show = (key, node, on) => setCls(key, node, 'bm-hidden', !on);

  function update(s, c, dt) {
    setText('lives', lives.lastChild, fmt(s.lives));
    setText('gold', gold.lastChild, fmt(s.gold));
    setText('wave', wave.lastChild, String(s.wave));
    curSpeed = c.speed;
    if (c.speed > 0) lastSpeed = c.speed;
    const ph = c.speed === 0 ? ICON.play : ICON.pause;
    if (cache.ph !== ph) { cache.ph = ph; pauseB.innerHTML = ph; }
    setCls('pon', pauseB, 'on', c.speed === 0);
    setText('spd', speedB, `${lastSpeed}x`);
    // next wave
    const nk = `${s.wave}:${s.next ? s.next.n : 0}`;
    if (cache.nextKey !== nk) {
      cache.nextKey = nk;
      nextList.replaceChildren();
      const sum = nextWaveSummary(s).sort((a, b) => (ENEMIES[b.type].boss ? 1 : 0) - (ENEMIES[a.type].boss ? 1 : 0));
      const fresh = s.next && s.next.tags.find((t) => t.startsWith('new:'));
      for (const it of sum.slice(0, 5)) {
        const isNew = fresh === 'new:' + it.type;
        const ch = el('span', 'bm-ech' + (ENEMIES[it.type].boss ? ' boss' : isNew ? ' new' : ''), `${enemyIcon(it.type)}${it.count}`);
        nextList.appendChild(ch);
      }
    }
    // call button
    let label;
    const can = canCallWave(s);
    if (s.waiting) label = s.wave === 0 ? 'Start' : 'Send';
    else if (s.activeWaves.length) label = 'Send';
    else label = s.autoWaves ? `${Math.ceil(Math.max(0, s.timer))}s` : 'Send';
    const bonus = earlyBonus(s);
    const callHtml = `${ICON.play}<span>${label}</span>${bonus > 0 ? `<small>+${fmt(bonus)}</small>` : ''}`;
    if (cache.call !== callHtml) { cache.call = callHtml; call.innerHTML = callHtml; }
    call.disabled = !can;
    setCls('callp', call, 'pulse', s.waiting && can);

    // abilities
    const list = abilityList(s);
    for (const id in abBtns) {
      const b = abBtns[id];
      const on = list.includes(id);
      show('ab' + id, b, on);
      if (!on) continue;
      const cd = Math.max(0, s.ab[id]);
      const max = ABILITIES[id].cd * s.mods.cooldown;
      const frac = Math.min(1, cd / max);
      const fk = Math.round(frac * 40);
      if (cache['abf' + id] !== fk) { cache['abf' + id] = fk; b.children[1].style.transform = `scaleY(${frac})`; }
      setText('abt' + id, b.children[2], cd > 0 ? String(Math.ceil(cd)) : '');
      setCls('abr' + id, b, 'ready', cd <= 0);
      setCls('aba' + id, b, 'armed', c.targeting === id);
    }
    // hero
    const hero = s.hero;
    show('modeB', modeB, hero.unlocked);
    const heroMode = c.heroMode;
    const modeHtml = heroMode ? `${ICON.build}<span>Build</span>` : hero.deployed ? `${ICON.hero}<span>Hero</span>` : `${ICON.hero}<span>Deploy</span>`;
    if (cache.modeHtml !== modeHtml) { cache.modeHtml = modeHtml; modeB.innerHTML = modeHtml; }
    setCls('modeHero', modeB, 'hero', heroMode);
    setCls('modeReady', modeB, 'ready', hero.unlocked && !hero.deployed);
    show('hstat', hstat, hero.deployed);
    if (hero.deployed) {
      const st = heroStats(s, s.hst);
      const hpF = hero.downT > 0 ? 0 : Math.max(0, Math.min(1, hero.hp / st.maxHp));
      const xpF = Math.max(0, Math.min(1, hero.xp / hero.need));
      const k1 = Math.round(hpF * 50), k2 = Math.round(xpF * 50);
      if (cache.hpF !== k1) { cache.hpF = k1; hstat.children[1].firstChild.style.transform = `scaleX(${hpF})`; }
      if (cache.xpF !== k2) { cache.xpF = k2; hstat.children[2].firstChild.style.transform = `scaleX(${xpF})`; }
      setText('hlv', hstat.children[0], hero.downT > 0 ? `Down ${Math.ceil(hero.downT)}s` : `Lv ${hero.level}`);
      setText('hpts', hstat.children[3], hero.points > 0 ? `+${hero.points} pts` : HERO_WEAPONS[hero.weapon].name);
    }
    for (const id in heroBtns) show('hb' + id, heroBtns[id], heroMode);
    if (heroMode) {
      const d = Math.max(0, hero.dashCd), u = Math.max(0, hero.ultCd);
      const st = heroStats(s, s.hst);
      const dm = HERO.dash.cd * st.cdMul, um = HERO.ult.cd * st.cdMul * s.mods.cooldown;
      const dk = Math.round(d / dm * 30), uk = Math.round(u / um * 30);
      if (cache.dk !== dk) { cache.dk = dk; heroBtns.dash.children[1].style.transform = `scaleY(${Math.min(1, d / dm)})`; }
      if (cache.uk !== uk) { cache.uk = uk; heroBtns.ult.children[1].style.transform = `scaleY(${Math.min(1, u / um)})`; }
      setText('dt', heroBtns.dash.children[2], d > 0 ? d.toFixed(1) : '');
      setText('ut', heroBtns.ult.children[2], u > 0 ? String(Math.ceil(u)) : '');
      setText('wt', heroBtns.swap.children[1], HERO_WEAPONS[hero.weapon].name.split(' ').pop());
    }
    show('bottom', bottom, !heroMode && !sheet);
    show('stickL', stickL, heroMode); show('stickR', stickR, heroMode); show('hint', heroHint, heroMode && !c.hintSeen);
    show('target', targetMsg, !!c.targeting);
    // tray
    if (!heroMode) {
      for (const type of TOWER_ORDER) {
        const cost = buildCost(s, type);
        setText('tc' + type, cards[type].lastChild.lastChild, fmt(cost));
        setCls('tp' + type, cards[type], 'poor', s.gold < cost);
        setCls('ton' + type, cards[type], 'on', c.armed === type);
      }
      updateCtx(s, c);
    }
    if (sheet && sheet.refresh) sheet.refresh(s, c);
    // floats
    for (const f of floats) {
      if (f.t <= 0) continue;
      f.t -= dt;
      const k = Math.max(0, f.t / f.T);
      f.el.style.opacity = String(Math.min(1, k * 2));
      f.el.style.transform = `translate(${f.x}px, ${f.y - (1 - k) * 36}px) translate(-50%, -50%)`;
    }
  }

  function updateCtx(s, c) {
    let html = '', confirmOn = false, confirmOk = false, confirmLabel = 'Build', cancelOn = true;
    if (c.targeting) {
      html = `<b>${ABILITIES[c.targeting].name}</b>: tap the map where it should strike.`;
    } else if (c.selTile >= 0) {
      const tt = s.map.tiles[c.selTile];
      const tileName = `<b>${TILE_NAMES[tt]}</b>`;
      if (c.armed) {
        const r = c.preview;
        if (r && r.ok) { html = `${tileName}: build <b>${TOWERS[c.armed].name}</b> for ${fmt(r.cost)}`; confirmOn = true; confirmOk = true; confirmLabel = 'Build'; }
        else if (r) { html = `${tileName}: <span class="bad">${r.reason}</span>`; confirmOn = r.reason === 'Not enough gold'; confirmLabel = fmt(r.cost); }
      } else html = `${tileName}. ${TILE_INFO[tt]} Choose a tower below.`;
    } else if (c.armed) {
      const d = TOWERS[c.armed];
      html = `<b>${d.name}</b> (${fmt(buildCost(s, c.armed))}): ${d.role} Tap a tile.`;
    } else {
      cancelOn = false;
      html = s.wave === 0 ? 'Tap a tile, pick a tower, confirm. Walls shape the enemy path.' : 'Tap a tile to build, or a tower to upgrade it.';
    }
    if (cache.ctx !== html) { cache.ctx = html; ctxTxt.innerHTML = html; }
    show('confirm', confirm, confirmOn);
    show('cancel', cancel, cancelOn);
    setCls('cno', confirm, 'no', !confirmOk);
    confirm.disabled = !confirmOk;
    setText('cl', confirm.lastChild, confirmLabel);
  }

  const timeouts = new Set();
  function toast(text, kind = '') {
    const t = el('div', 'bm-toast ' + kind);
    t.textContent = text;
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    const id = setTimeout(() => { timeouts.delete(id); t.remove(); }, 2700);
    timeouts.add(id);
  }
  function float(x, y, text, big) {
    const f = floats[floatHead]; floatHead = (floatHead + 1) % floats.length;
    f.el.textContent = text; f.el.className = 'bm-float' + (big ? ' big' : '');
    f.x = x; f.y = y; f.t = f.T = big ? 1.6 : 1.0;
  }
  function hurtFlash() {
    flash.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
  }
  function setStick(which, on, x = 0, y = 0, kx = 0, ky = 0) {
    const st = which === 'L' ? stickL : stickR;
    st.classList.toggle('on', on);
    if (on) {
      st.style.left = x + 'px'; st.style.top = y + 'px';
      st.firstChild.style.transform = `translate(${kx}px, ${ky}px)`;
    }
  }

  // ---------------------------------------------------------------- sheets
  function closeSheet() { if (sheet) { sheet.el.remove(); sheet = null; } }
  function openTowerSheet(s, t) {
    closeSheet();
    const box = el('div', 'bm-sheet');
    rootEl.appendChild(box);
    sheet = { el: box, kind: 'tower', t, key: '' };
    sheet.refresh = (s2, c) => {
      const info = upgradeInfo(s2, t);
      const afford = info.kind === 'level' ? s2.gold >= info.cost : info.kind === 'branch' ? `${s2.gold >= info.a.cost}${s2.gold >= info.b.cost}` : '';
      const key = `${t.level}:${t.branch}:${t.prio}:${afford}:${s2.towerVer}:${t.jamT > 0}:${Math.floor(s2.time * 2)}:${sellValue(s2, t)}`;
      if (key === sheet.key) return;
      sheet.key = key;
      renderTowerSheet(box, s2, t, info);
    };
    sheet.refresh(s, {});
  }
  function renderTowerSheet(box, s, t, info) {
    const d = TOWERS[t.type];
    const st = t.st;
    const nb = baseLevels(t.type);
    const brName = t.branch ? d.branches[t.branch].name : '';
    box.replaceChildren();
    const head = el('div', 'bm-sh-head', `<div class="ic">${towerIcon(t.type)}</div><div class="t"><b>${brName || d.name}</b><span>Level ${t.level}/${maxLevel(t.type)}${brName ? ' · ' + d.name : ''} · ${t.jamT > 0 ? '<span style="color:#ff8a8a">Jammed</span>' : d.role}</span></div>`);
    head.appendChild(btn('bm-x', ICON.close, () => h.closeSheet()));
    box.appendChild(head);
    const stats = el('div', 'bm-stats');
    const add = (k, v) => stats.appendChild(el('div', 'bm-stat', `<small>${k}</small><b>${v}</b>`));
    const k = st.kind;
    if (k === 'mine') {
      add('Per wave', fmt(st.income * s.mods.mine * (s.mode === 'op' ? 3 : 1)));
      if (st.interest) add('Interest', Math.round(st.interest * 100) + '%');
      if (st.killBonus) add('Kill bonus', '+' + st.killBonus);
    } else if (k === 'support') {
      add('Radius', st.range.toFixed(1));
      if (st.buffDmg) add('Damage', '+' + Math.round(st.buffDmg * 100) + '%');
      if (st.buffRate) add('Fire rate', '+' + Math.round(st.buffRate * 100) + '%');
      if (st.buffRange) add('Range', '+' + Math.round(st.buffRange * 100) + '%');
      if (st.detect) add('Detects', st.detect.toFixed(1));
      if (st.mark) add('Marks', '+' + Math.round(st.mark * 100) + '%');
    } else if (k === 'none') {
      if (st.detect) add('Detects', st.detect.toFixed(1));
      if (st.rangeAura) add('Range aura', '+' + Math.round(st.rangeAura * 100) + '%');
      if (st.thorns) add('Thorns', f1(st.thorns) + '/s');
      if (!st.detect && !st.thorns) add('Blocks', 'Path');
    } else {
      add('Damage', f1(st.dmg) + (st.multishot ? ` x${st.multishot}` : ''));
      add('Rate', st.rate.toFixed(2) + '/s');
      add('Range', st.range.toFixed(1) + (st.minRange ? ` (min ${st.minRange})` : ''));
      add('DPS', f1(st.dps));
      add('Type', DTYPE_NAMES[st.dtype] || 'Physical');
      add('Targets', st.air && st.ground ? 'Air + ground' : st.air ? 'Air' : 'Ground');
    }
    add('Kills', fmt(t.kills));
    if (k !== 'mine' && k !== 'support') add('Dealt', fmt(t.dealt));
    const extra = [];
    if (st.splash) extra.push(`splash ${st.splash.toFixed(1)}`);
    if (st.slow) extra.push(`slows ${Math.round(st.slow * 100)}%`);
    if (st.freezeAt) extra.push(`freezes after ${st.freezeAt} hits`);
    if (st.poison) extra.push(`poison ${f1(st.poison)}/s per stack`);
    if (st.burn) extra.push(`burns ${f1(st.burn)}/s`);
    if (st.oil) extra.push('tars (fire x2)');
    if (st.shred) extra.push(`shreds ${st.shred} armour`);
    if (st.jumps) extra.push(`chains ${st.jumps}`);
    if (st.stun) extra.push(`stuns ${st.stun}s`);
    if (st.crit) extra.push(`${Math.round(st.crit * 100)}% crit`);
    if (st.execute) extra.push(`executes below ${Math.round(st.execute * 100)}%`);
    if (st.detect && k !== 'support' && k !== 'none') extra.push('detects hidden');
    if (st.napalm) extra.push('burning ground');
    if (st.cluster) extra.push(`${st.cluster} bomblets`);
    if (st.buffDmgIn || st.buffRateIn || st.buffRangeIn) extra.push('boosted by a beacon');
    box.appendChild(stats);
    if (extra.length) box.appendChild(el('div', 'bm-note', extra.join(' · ')));
    if (k !== 'support' && k !== 'mine' && k !== 'none' && k !== 'aura') {
      const seg = el('div', 'bm-seg');
      for (const p of PRIORITIES) {
        const b = btn(t.prio === p ? 'on' : '', PRIORITY_NAMES[p], () => h.setPrio(p));
        seg.appendChild(b);
      }
      box.appendChild(seg);
    }
    if (info.kind === 'branch') {
      box.appendChild(el('div', 'bm-note', 'Choose a specialisation. This is permanent for this tower.'));
      const brs = el('div', 'bm-branches');
      for (const key of ['a', 'b']) {
        const o = info[key];
        const b = btn('bm-branch', `<b>${o.name}</b><span>${o.desc}</span><em>${fmt(o.cost)} gold</em>`, () => h.upgrade(key));
        b.disabled = s.gold < o.cost;
        brs.appendChild(b);
      }
      box.appendChild(brs);
    }
    const acts = el('div', 'bm-acts');
    if (info.kind === 'level') {
      const b = btn('bm-up', `<span>Upgrade to level ${t.level + 1}</span><small>${fmt(info.cost)} gold</small>`, () => h.upgrade());
      b.disabled = s.gold < info.cost;
      acts.appendChild(b);
    } else if (info.kind === 'max') {
      acts.appendChild(el('div', 'bm-note', 'Fully upgraded.'));
      acts.firstChild.style.flex = '1';
    } else acts.appendChild(el('div', 'bm-spacer'));
    const sv = sellValue(s, t);
    acts.appendChild(btn('bm-sell', `Sell +${fmt(sv)}`, () => h.sell()));
    box.appendChild(acts);
    if (t.fresh) box.appendChild(el('div', 'bm-note', 'Built since the last wave: selling refunds everything.'));
  }

  function openHeroSheet(s) {
    closeSheet();
    const box = el('div', 'bm-sheet');
    rootEl.appendChild(box);
    sheet = { el: box, kind: 'hero', key: '' };
    sheet.refresh = (s2) => {
      const hr = s2.hero;
      const key = `${hr.level}:${hr.points}:${hr.weapon}:${hr.autoSpend}:${JSON.stringify(hr.up)}:${s2.perks.length}:${Math.round(hr.xp)}`;
      if (key === sheet.key) return;
      sheet.key = key;
      renderHeroSheet(box, s2);
    };
    sheet.refresh(s);
  }
  function renderHeroSheet(box, s) {
    const hr = s.hero;
    const st = heroStats(s, {});
    box.replaceChildren();
    const head = el('div', 'bm-sh-head', `<div class="ic">${ICON.hero}</div><div class="t"><b>Hero · level ${hr.level}</b><span>${Math.floor(hr.xp)}/${hr.need} xp · ${hr.kills} kills · ${hr.points} point${hr.points === 1 ? '' : 's'} to spend</span></div>`);
    head.appendChild(btn('bm-x', ICON.close, () => h.closeSheet()));
    box.appendChild(head);
    const rows = [
      ['dmg', 'Damage', `${f1(st.dmg)} per hit`, `+${Math.round(HERO.per.dmg * 100)}%`],
      ['rate', 'Fire rate', `${st.rate.toFixed(1)}/s`, `+${Math.round(HERO.per.rate * 100)}%`],
      ['speed', 'Move speed', `${st.speed.toFixed(1)} tiles/s`, `+${Math.round(HERO.per.speed * 100)}%`],
      ['hp', 'Health', `${fmt(st.maxHp)}`, `+${Math.round(HERO.per.hp * 100)}%`],
    ];
    for (const [key, name, val, per] of rows) {
      const r = el('div', 'bm-hrow', `<div class="n">${name} <small>${val} · rank ${hr.up[key]}/${HERO.statCap[key] > 50 ? '∞' : HERO.statCap[key]}</small></div>`);
      const b = btn('', `+ <small>${per}</small>`, () => h.spend(key));
      b.disabled = hr.points <= 0 || hr.up[key] >= HERO.statCap[key];
      r.appendChild(b);
      box.appendChild(r);
    }
    const tog = el('div', 'bm-tog', '<span>Spend new points automatically</span>');
    tog.appendChild(btn(hr.autoSpend ? 'on' : '', hr.autoSpend ? 'On' : 'Off', () => h.toggleAutoSpend()));
    box.appendChild(tog);
    box.appendChild(el('div', 'bm-note', '<b>Weapons</b> (more come from Armoury cards):'));
    const weps = el('div', 'bm-weps');
    for (const w of heroWeapons(s)) weps.appendChild(btn(hr.weapon === w ? 'on' : '', HERO_WEAPONS[w].name, () => h.equip(w)));
    box.appendChild(weps);
    const W = HERO_WEAPONS[hr.weapon];
    box.appendChild(el('div', 'bm-note', `${W.name}: ${W.desc} ${DTYPE_NAMES[W.dtype]} damage, range ${W.range}.`));
    box.appendChild(el('div', 'bm-note', `Dash: a quick dodge with a moment of invulnerability (${HERO.dash.cd}s). Nova: a shock blast that stuns everything nearby (${HERO.ult.cd}s). Downed heroes return to the core after ${Math.round(st.respawn)}s.`));
  }

  // ---------------------------------------------------------------- modals
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  function openModal(build) {
    closeModal();
    modal = el('div', 'bm-modal');
    const box = el('div', 'bm-box');
    modal.appendChild(box);
    build(box);
    rootEl.appendChild(modal);
    return box;
  }

  function showCards(s) {
    openModal((box) => {
      box.appendChild(el('h2', null, 'Choose one'));
      box.appendChild(el('p', null, `Wave ${s.cleared} cleared. Pick a card to shape this run.`));
      const pick = el('div', 'bm-pick');
      const k = cardStrength(s);
      s.pendingCards.forEach((id, i) => {
        const c = CARD_BY_ID[id];
        pick.appendChild(btn('bm-pcard ' + c.kind, `<span class="k">${CARD_KIND_NAMES[c.kind]}</span><b>${c.name}</b><span>${c.text(k)}</span>`, () => h.pickCard(i)));
      });
      box.appendChild(pick);
    });
  }

  function showPause(c) {
    openModal((box) => {
      box.appendChild(el('h2', null, 'Paused'));
      box.appendChild(el('p', null, `${c.runLabel}`));
      box.appendChild(btn('bm-btn pri', 'Resume', () => h.resume()));
      const tog = (label, on, fn) => {
        const r = el('div', 'bm-tog', `<span>${label}</span>`);
        r.appendChild(btn(on ? 'on' : '', on ? 'On' : 'Off', fn));
        box.appendChild(r);
      };
      tog('Start waves automatically', c.s.autoWaves, () => { h.toggleSetting('autoWaves'); showPause(c); });
      tog('Screen shake', c.settings.shake, () => { h.toggleSetting('shake'); showPause(c); });
      tog('Show enemy path', c.settings.paths, () => { h.toggleSetting('paths'); showPause(c); });
      box.appendChild(btn('bm-btn', 'How to play', () => showHow(() => showPause(c))));
      box.appendChild(btn('bm-btn', 'Restart run', () => confirmBox('Restart this run? Progress is lost.', () => h.restart(), () => showPause(c))));
      box.appendChild(btn('bm-btn', 'Exit to menu (saved)', () => h.exitToMenu()));
      if (c.s.perks.length) {
        const k = cardStrength(c.s);
        box.appendChild(el('h3', null, 'Cards this run'));
        const ul = el('ul');
        const counts = {};
        for (const id of c.s.perks) counts[id] = (counts[id] || 0) + 1;
        for (const id in counts) ul.appendChild(el('li', null, `<b>${CARD_BY_ID[id].name}</b>${counts[id] > 1 ? ' x' + counts[id] : ''}: ${CARD_BY_ID[id].text(k)}`));
        box.appendChild(ul);
      }
    });
  }

  function confirmBox(text, yes, no) {
    openModal((box) => {
      box.appendChild(el('p', null, text));
      box.appendChild(btn('bm-btn pri', 'Yes', yes));
      box.appendChild(btn('bm-btn', 'Cancel', no));
    });
  }

  const HOW = [
    ['Defend the core', `<ul><li>Enemies march from the red gates to your crystal core. Each one that gets through costs lives (bosses cost many).</li>
      <li>Kills and cleared waves pay gold. Spend it on towers and upgrades.</li><li>Waves never end. See how far you get.</li></ul>`],
    ['Build the maze', `<ul><li><b>Tap a tile</b>, pick a tower from the tray, then press <b>Build</b>. Nothing is built on a bare tap.</li>
      <li>Every building blocks its tile. Ground enemies always take the shortest open route, shown by the glowing dotted line, so walls make them walk longer under fire.</li>
      <li>You can never close the last route: a placement that would is refused, and the preview turns red.</li>
      <li>Flyers ignore the maze and fly straight at the core. Archers, Frost, Tesla, Venom and Snipers can hit them.</li>
      <li>High ground gives +20% range, crystal tiles +25% damage, mud slows enemies.</li></ul>`],
    ['Towers', `<ul><li><b>Tap a tower</b> to see its stats, change its targeting (First, Last, Strong, Weak, Close), upgrade it or sell it. Towers built since the last wave refund in full.</li>
      <li>After three levels each tower chooses one of two specialisations that change how it works.</li>
      <li>Beacons boost neighbours, Gold Mines pay every wave, Walls are cheap blocks that can grow spikes or become lookouts.</li></ul>`],
    ['Enemies and damage', `<ul><li>Armour subtracts from every hit: use big hits, Piercing (Sniper) or Poison (Venom).</li>
      <li>Shields soak damage and regrow; Shock (Tesla) tears them twice as fast.</li>
      <li>Shades are invisible except for brief shimmers: Hunters, Lookouts, Beacon level 3 and splash damage reveal them.</li>
      <li>Combos: frozen or chilled enemies shatter under physical hits; tarred enemies take double fire damage.</li>
      <li>Sappers and some bosses jam towers for a few seconds. Menders heal. Trolls regenerate unless burning or poisoned.</li></ul>`],
    ['Waves, cards, abilities', `<ul><li>The top bar shows the next wave. Press <b>Send</b> to call it early for bonus gold.</li>
      <li>Every few waves and after each boss you pick one of three cards: perks, economy, relics, or curses that trade risk for reward.</li>
      <li>Abilities on the right: Meteor (tap the button, then the map), Deep Freeze, Gold Rush. They recharge over time.</li>
      <li>Pause, 1x, 2x and 4x speed are top right. You can build while paused.</li></ul>`],
    ['The hero', `<ul><li>From wave ${HERO.unlockWave} you can <b>Deploy</b> a hero (left button). In Overpowered mode it is ready at once.</li>
      <li>The left button switches between <b>Build</b> and <b>Hero</b> control. In Hero control: <b>left thumb</b> anywhere on the left half moves, <b>right thumb</b> on the right half aims and fires. Let go of the right thumb and the hero auto-aims at the nearest enemy.</li>
      <li>Dash dodges with brief invulnerability; Nova stuns and blasts everything close. Swap cycles weapons.</li>
      <li>Kills level the hero up: tap the hero card on the left to spend points on damage, rate, speed and health. Armoury cards add weapons; hero cards link the hero to your towers.</li>
      <li>The hero is blocked by buildings but never blocks enemies. If downed it returns to the core shortly. In Build control it holds position and auto-fires.</li></ul>`],
  ];
  function showHow(onClose, page = 0) {
    openModal((box) => {
      box.appendChild(el('h2', null, HOW[page][0]));
      box.appendChild(el('div', null, HOW[page][1]));
      box.appendChild(el('p', 'bm-note', `${page + 1} / ${HOW.length}`));
      const nav = el('div', 'bm-pages');
      if (page > 0) nav.appendChild(btn('bm-btn', 'Back', () => showHow(onClose, page - 1)));
      if (page < HOW.length - 1) nav.appendChild(btn('bm-btn pri', 'Next', () => showHow(onClose, page + 1)));
      else nav.appendChild(btn('bm-btn pri', 'Got it', () => { closeModal(); onClose && onClose(); }));
      box.appendChild(nav);
      if (page < HOW.length - 1) box.appendChild(btn('bm-btn', 'Skip', () => { closeModal(); onClose && onClose(); }));
    });
  }

  function showWaveInfo(s, onClose) {
    openModal((box) => {
      box.appendChild(el('h2', null, `Wave ${s.wave + 1}`));
      const sum = nextWaveSummary(s);
      const ul = el('ul');
      for (const it of sum) {
        const e = ENEMIES[it.type];
        ul.appendChild(el('li', null, `<b>${it.count} x ${e.name}</b>${e.flying ? ' (flying)' : ''}: ${e.desc}`));
      }
      box.appendChild(ul);
      if (s.next && s.next.tags.length) {
        const tags = s.next.tags.map((t) => (t.startsWith('new:') ? `new enemy: ${ENEMIES[t.slice(4)].name}` : t)).join(', ');
        box.appendChild(el('p', 'bm-note', tags));
      }
      box.appendChild(btn('bm-btn pri', 'Close', () => { closeModal(); onClose && onClose(); }));
    });
  }

  function showGameOver(s, info) {
    openModal((box) => {
      box.appendChild(el('h2', null, 'The core has fallen'));
      box.appendChild(el('p', null, `${info.runLabel}. You reached <b>wave ${s.wave}</b>${info.record ? ' — a new record!' : ''}.`));
      const sum = el('div', 'bm-sum');
      const add = (k, v) => sum.appendChild(el('div', 'bm-stat', `<small>${k}</small><b>${v}</b>`));
      add('Waves cleared', s.cleared); add('Best', info.best);
      add('Kills', fmt(s.stats.kills)); add('Bosses', s.stats.bossKills);
      add('Gold earned', fmt(s.stats.goldEarned)); add('Towers built', s.stats.built);
      add('Hero level', s.hero.deployed ? s.hero.level : '-'); add('Cards', s.perks.length);
      box.appendChild(sum);
      box.appendChild(btn('bm-btn pri', 'Play again', () => h.restart()));
      box.appendChild(btn('bm-btn', 'Menu', () => h.toTitle()));
    });
  }

  function showTitle(o) {
    // o: { save: {label} | null, records, onContinue, onStart(opts), onHow, onExit, last }
    let mode = o.last.mode || 'std', diff = o.last.difficulty || 'normal', arch = o.last.archetype || 'random';
    const render = () => openModal((box) => {
      box.appendChild(el('div', 'bm-title', 'Bastion Maze'));
      box.appendChild(el('div', 'bm-sub', 'Build the maze the enemy walks.'));
      if (o.save) box.appendChild(btn('bm-btn pri', `Continue · ${o.save}`, () => o.onContinue()));
      box.appendChild(el('h3', null, 'New run'));
      const modes = el('div', 'bm-chips');
      for (const [k, l] of [['std', 'Standard'], ['op', 'Overpowered'], ['daily', 'Daily'], ['seed', 'Seed']]) {
        modes.appendChild(btn(mode === k ? 'on' : '', l, () => { mode = k; render(); }));
      }
      box.appendChild(modes);
      if (mode === 'std') {
        const ds = el('div', 'bm-chips');
        for (const k of Object.keys(DIFFICULTY)) ds.appendChild(btn(diff === k ? 'on' : '', DIFFICULTY[k].name, () => { diff = k; render(); }));
        box.appendChild(ds);
      }
      let seedInput = null;
      if (mode === 'op') box.appendChild(el('p', 'bm-note', 'Mountains of gold, cheap upgrades, triple damage, an orbital strike on a short fuse and a hero that is ready at once. The waves are bigger too, and they never stop growing. Separate records.'));
      if (mode === 'daily') box.appendChild(el('p', 'bm-note', `Today's map and waves are the same for everyone on this device's date (${o.today}). Normal difficulty.`));
      if (mode === 'seed') {
        seedInput = el('input', 'bm-input');
        seedInput.placeholder = 'Type any word or number';
        seedInput.value = o.last.seedText || '';
        seedInput.addEventListener('keydown', (e) => e.stopPropagation());
        box.appendChild(seedInput);
      }
      if (mode !== 'daily') {
        const as = el('div', 'bm-chips');
        as.appendChild(btn(arch === 'random' ? 'on' : '', 'Random map', () => { arch = 'random'; render(); }));
        for (const k of ARCHETYPE_ORDER) as.appendChild(btn(arch === k ? 'on' : '', ARCHETYPES[k].name, () => { arch = k; render(); }));
        box.appendChild(as);
        if (arch !== 'random') box.appendChild(el('p', 'bm-note', ARCHETYPES[arch].desc));
      }
      box.appendChild(btn('bm-btn ' + (mode === 'op' ? 'op' : 'pri'), o.save ? 'Start new run (replaces save)' : 'Start', () => {
        o.onStart({ mode, difficulty: diff, archetype: arch, seedText: seedInput ? seedInput.value.trim() : '' });
      }));
      box.appendChild(el('h3', null, 'Records'));
      const recs = [['std-easy', 'Easy'], ['std-normal', 'Normal'], ['std-hard', 'Hard'], ['op', 'Overpowered'], ['daily', 'Daily (today)'], ['seed', 'Seeded']];
      for (const [k, l] of recs) {
        const v = o.records[k];
        box.appendChild(el('div', 'bm-rec', `<span>${l}</span><b>${v ? 'wave ' + v : '—'}</b>`));
      }
      box.appendChild(btn('bm-btn', 'How to play', () => showHow(render)));
      box.appendChild(btn('bm-btn', 'Back to games', () => o.onExit()));
    });
    render();
  }

  return {
    update, toast, float, hurtFlash, setStick, closeSheet, openTowerSheet, openHeroSheet, closeModal, showCards, showPause,
    showHow, showGameOver, showTitle, showWaveInfo,
    get sheet() { return sheet; }, get modal() { return modal; },
    insets() {
      const r = rootEl.getBoundingClientRect();
      const tb = top.getBoundingClientRect();
      const bb = bottom.getBoundingClientRect();
      return { top: tb.bottom - r.top + 6, bottom: bottom.classList.contains('bm-hidden') ? 20 : r.bottom - bb.top + 6, rootTop: r.top };
    },
    rect() { return rootEl.getBoundingClientRect(); },
    dispose() { for (const id of timeouts) clearTimeout(id); timeouts.clear(); rootEl.remove(); },
  };
}
