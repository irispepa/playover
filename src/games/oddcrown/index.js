import { arcade, button, node } from '../../shell/arcade.js';
import { randomSeed } from '../../shell/rng.js';
import { newGame, NAMES, TYPES, MOVES, ACTIONS, at, square, move, legalMoves, kingInDanger, reveal, remember, undo, chooseAI, validSave } from './sim.js';
import { createBoard } from './render.js';
import { openGuide } from '../../shell/guide.js';
import { GUIDE_PAGES } from './guide.js';
import './guide.css';
export default {
  start(ctx) {
    const a = arcade(ctx, {
      theme: 'crown',
      title: 'Odd Crown',
      subtitle: 'A court with questionable rules',
      background: 0x202b40
    });
    let saved = ctx.storage.get('save'),
      s = validSave(saved) ? saved : newGame(randomSeed()),
      selected = null,
      pending = 0,
      active = false,
      failures = 0,
      finished = false,
      guide = null;
    const board = createBoard(a);
    board.setSelectionGetter(() => selected);
    const turnStat = a.stat('round', 1),
      discovered = a.stat('rules found', '0 / 6'),
      insight = a.stat('insight', 3);
    const peek = button('Peek · 1 insight', peekRule),
      book = button('Notebook', notebook),
      rewind = button('Undo', rewindTurn),
      fresh = button('New court', confirmNew);
    a.controls.append(peek, book, rewind, fresh);
    const legend = node('div', 'arc-legend');
    for (const [color, text] of [['#e9c78d', 'You are gold'], ['#80bada', 'The blue court'], ['#ffde91', 'Known moves']]) {
      const n = node('span');
      const dot = node('i');
      dot.style.setProperty('--dot', color);
      n.append(dot, document.createTextNode(text));
      legend.append(n);
    }
    a.controls.after(legend);
    function save() {
      if (active) ctx.storage.set('save', s);
    }
    function status() {
      turnStat.textContent = Math.floor(s.ply / 2) + 1;
      discovered.textContent = `${Object.keys(s.known).length} / 6`;
      insight.textContent = s.insights;
      peek.disabled = !active || s.turn !== 0 || !s.pieces.find(p => p.id === selected) || s.known[s.pieces.find(p => p.id === selected)?.type] || s.insights < 1 || s.winner !== null;
      rewind.disabled = !s.history.length || pending > 0;
      board.sync(s, selected);
      if (s.winner !== null) a.message(s.winner === 0 ? 'The crown is yours.' : s.winner === 1 ? 'The blue court wins.' : 'A very odd draw.', 'Undo to try another idea, or shuffle a fresh court.');else if (s.turn === 1) a.message('The blue court is plotting…', 'Their moves reveal rules for your pieces, too.');else {
        const p = s.pieces.find(p => p.id === selected);
        if (p) {
          const r = s.rules[p.type];
          a.message((p.side === 1 ? 'Blue ' : '') + NAMES[p.type] + (s.known[p.type] ? ` · ${MOVES[r.move].name}` : ' · unknown rule'), s.known[p.type] ? `${ACTIONS[r.action].name}: ${ACTIONS[r.action].text}` : p.side === 0 ? 'Try a square. Failed attempts cost nothing. Or use Peek.' : 'Peek to discover this type’s rule for both courts.');
        } else {
          const danger = kingInDanger(s, 0);
          a.message(danger ? 'Your king is in danger.' : s.ply < 6 ? 'Royal truce: kings are protected for 3 rounds.' : 'Your move. Be a little suspicious.', danger ? 'A blue piece can capture your king or catch him in a blast. Move him or remove the threat.' : s.log.at(-1));
        }
      }
    }
    function endCheck() {
      if (s.winner !== null && !finished) {
        finished = true;
        if (s.winner === 0 && !s.claimed) {
          s.claimed = true;
          const wins = ctx.storage.get('wins', 0) + 1;
          ctx.storage.set('wins', wins);
          ctx.setBest(`${wins} court${wins === 1 ? '' : 's'} conquered`);
          save();
        }
        ctx.audio.play(s.winner === 0 ? 'good' : 'bad');
      }
    }
    function start(freshRun) {
      if (freshRun) {
        s = newGame(randomSeed());
        finished = false;
      }
      active = true;
      selected = null;
      pending = s.turn === 1 ? .65 : 0;
      save();
      status();
      endCheck();
      if (freshRun && !ctx.storage.get('guideSeen', false)) help();
    }
    function confirmNew() {
      a.modal('Shuffle the court?', 'New movements, new powers, new hidden nonsense. Your current court will be replaced.', [{
        label: 'Keep playing'
      }, {
        label: 'Shuffle & play',
        primary: true,
        fn: () => start(true)
      }]);
    }
    function peekRule() {
      const p = s.pieces.find(p => p.id === selected);
      if (!p || s.insights < 1 || s.known[p.type]) return;
      s.insights--;
      reveal(s, p.type);
      ctx.audio.play('coin');
      save();
      status();
      a.message(`${NAMES[p.type]} discovered: ${MOVES[s.rules[p.type].move].name}`, MOVES[s.rules[p.type].move].text + ' ' + ACTIONS[s.rules[p.type].action].text);
    }
    function notebook() {
      const list = node('div');
      for (const t of TYPES) {
        const row = node('div', 'arc-rule'),
          r = s.rules[t],
          known = s.known[t];
        row.append(node('strong', '', `${NAMES[t]} · ${known ? MOVES[r.move].name : 'still a mystery'}`), node('p', '', known ? `${MOVES[r.move].text}\n${ACTIONS[r.action].name}: ${ACTIONS[r.action].text}` : 'Experiment on the board or spend one insight to peek.'));
        list.append(row);
      }
      list.append(node('p', '', `Royal parachute: ${s.ward[0] ? 'ready' : 'used'}. Hidden tiles: trapdoor (king only), launch spring, confetti cannon.\n\nRecent moves\n${s.log.slice(-4).join('\n')}`));
      a.modal('The field notebook', list, [{
        label: 'Back to court',
        primary: true
      }]);
    }
    function rewindTurn() {
      const restored = undo(s);
      if (!restored) return;
      s = restored;
      selected = null;
      pending = 0;
      finished = s.winner !== null;
      ctx.audio.play('tap');
      save();
      status();
    }
    function tap(x, y) {
      if (!active || a.modalOpen || guide || s.turn !== 0 || s.winner !== null || pending > 0) return;
      const p = at(s, x, y),
        sel = s.pieces.find(p => p.id === selected);
      if (sel?.side === 0 && !(sel.x === x && sel.y === y)) {
        if (legalMoves(s, sel).some(m => m.x === x && m.y === y)) {
          remember(s);
          move(s, selected, x, y);
          selected = null;
          failures = 0;
          pending = s.turn === 1 ? .7 : 0;
          ctx.audio.play('place');
          save();
          status();
          endCheck();
          return;
        }
        if (p?.side !== 0) {
          failures++;
          ctx.audio.play('error');
          if (failures >= 2 && !s.known[sel.type]) {
            reveal(s, sel.type);
            save();
            status();
            a.message('A helpful rumour from the court.', `${MOVES[s.rules[sel.type].move].text} Landing squares are now marked.`);
          } else {
            a.message('That experiment didn’t work. No turn lost.', s.known[sel.type] ? 'Choose a marked square.' : `Try another square, or Peek at this ${NAMES[sel.type].toLowerCase()}.`);
          }
          return;
        }
      }
      selected = p ? p.id : null;
      failures = 0;
      ctx.audio.play('tap');
      status();
    }
    const onPointer = e => {
      const p = board.pick(e);
      if (p) tap(p.x, p.y);
    };
    a.stage.canvas.addEventListener('pointerup', onPointer);
    let cursor = {
      x: 3,
      y: 5
    };
    a.stage.canvas.tabIndex = 0;
    a.stage.canvas.setAttribute('aria-label', 'Odd Crown board. Use arrow keys to choose a square, Enter to select or move.');
    function key(e) {
      const dirs = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      };
      if (dirs[e.key]) {
        e.preventDefault();
        cursor.x = Math.max(0, Math.min(5, cursor.x + dirs[e.key][0]));
        cursor.y = Math.max(0, Math.min(5, cursor.y + dirs[e.key][1]));
        a.message(`Square ${square(cursor.x, cursor.y)}`, at(s, cursor.x, cursor.y) ? `${NAMES[at(s, cursor.x, cursor.y).type]}. Press Enter.` : 'Empty. Press Enter to move here.');
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        tap(cursor.x, cursor.y);
      }
    }
    a.stage.canvas.addEventListener('keydown', key);
    a.stage.onFrame(dt => {
      if (!active || a.modalOpen || guide || s.winner !== null) return;
      if (s.turn === 1) {
        pending -= dt;
        if (pending <= 0) {
          const m = chooseAI(s);
          if (m) move(s, m.id, m.x, m.y);else s.turn = 0;
          pending = 0;
          save();
          status();
          endCheck();
        }
      }
    });
    function help() {
      guide?.close();
      ctx.storage.set('guideSeen', true);
      guide = openGuide(ctx.root, {
        className: 'oddcrown-guide',
        pages: GUIDE_PAGES,
        doneLabel: 'Cause trouble',
        onClose: () => {
          guide = null;
        }
      });
    }
    a.help.onclick = help;
    status();
    a.modal('Nobody read the rules.', 'A tiny chess court with secret rules. Work them out, then use them against the blue court.', [...(validSave(saved) ? [{
      label: s.winner !== null ? 'Revisit last court' : 'Continue your court',
      primary: true,
      fn: () => start(false)
    }] : []), {
      label: 'Play a fresh court',
      primary: !validSave(saved),
      fn: () => start(true)
    }], {
      onCancel: ctx.exit
    });
    const visibility = () => {
      if (document.hidden) save();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    return {
      dispose() {
        save();
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('pagehide', save);
        a.stage.canvas.removeEventListener('pointerup', onPointer);
        a.stage.canvas.removeEventListener('keydown', key);
        guide?.close();
        a.dispose();
      }
    };
  }
};
