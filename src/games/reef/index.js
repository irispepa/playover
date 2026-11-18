import { arcade, button, node } from '../../shell/arcade.js';
import { openGuide } from '../../shell/guide.js';
import { randomSeed } from '../../shell/rng.js';
import { newGame, turn, undo, flow, hint, applyHint, validSave } from './sim.js';
import { createBoard } from './render.js';
import { GUIDE } from './guide.js';
import './reef.css';
export default {
  start(ctx) {
    const a = arcade(ctx, {
      theme: 'reef',
      title: 'Reef Relay',
      subtitle: 'A quiet current, a living reef',
      background: 0x103a46
    });
    const saved = ctx.storage.get('save');
    let s = validSave(saved) ? saved : newGame(randomSeed()),
      active = false,
      direction = 1,
      highlight = -1,
      board = createBoard(a, s),
      gesture = null,
      guide = null;
    const level = a.stat('reef', s.level),
      moves = a.stat('turns', s.moves),
      pearls = a.stat('pearls', '0 / 3');
    const turnButton = button('Turn clockwise', () => {
        direction = -direction;
        turnButton.textContent = direction === 1 ? 'Turn clockwise' : 'Turn anticlockwise';
        ctx.audio.play('tap');
      }),
      hintButton = button('A little help', helpTile),
      undoButton = button('Undo', rewind),
      newButton = button('New reef', confirmNew);
    a.controls.append(turnButton, hintButton, undoButton, newButton);
    const legend = node('div', 'arc-legend');
    legend.textContent = 'Left spring → every pearl → right shell';
    a.controls.after(legend);
    function save() {
      if (active) ctx.storage.set('save', s);
    }
    function status(message) {
      const f = board.sync(s, highlight);
      level.textContent = s.level;
      moves.textContent = s.moves;
      pearls.textContent = `${f.collected.length} / 3`;
      undoButton.disabled = !s.history.length;
      a.message(s.won ? 'The reef is flowing again.' : message || 'Tap a channel to turn it.', s.won ? 'Every pearl is lit. The current has found its way home.' : f.exit && f.collected.length < 3 ? 'The shell has water. Connect the remaining pearls, too.' : `${f.collected.length} of 3 pearls lit. Connect the left spring to every pearl and the right shell.`);
    }
    function start(fresh, nextLevel = s.level) {
      if (fresh) {
        s = newGame(randomSeed(), nextLevel);
        board.dispose();
        board = createBoard(a, s);
      }
      active = true;
      highlight = -1;
      save();
      status();
      if (s.won) victory();
      else if (fresh && !ctx.storage.get('guideSeen', false)) help();
    }
    function confirmNew() {
      a.modal('Find a new current?', 'A new solvable reef, at the same level. Your restored reef record stays.', [{
        label: 'Stay here'
      }, {
        label: 'New reef',
        primary: true,
        fn: () => start(true)
      }]);
    }
    function victory() {
      if (!s.claimed) {
        s.claimed = true;
        const restored = ctx.storage.get('restored', 0) + 1;
        ctx.storage.set('restored', restored);
        ctx.storage.set('level', Math.max(ctx.storage.get('level', 1), s.level + 1));
        ctx.setBest(`${restored} reef${restored === 1 ? '' : 's'} restored`);
        save();
      }
      ctx.audio.play('good');
      a.modal('A little life returns.', `All three pearls are glowing, and the shell has water.\n\nReef ${s.level} restored in ${s.moves} turns${s.hints ? `, with ${s.hints} helping hand${s.hints === 1 ? '' : 's'}` : ''}.`, [{
        label: 'Explore the next reef',
        primary: true,
        fn: () => start(true, s.level + 1)
      }, {
        label: 'Admire this reef'
      }]);
    }
    function tap(index) {
      if (!active || a.modalOpen || guide?.open || s.won || index === undefined) return;
      highlight = -1;
      if (turn(s, index, direction)) {
        ctx.audio.play('place');
        status();
        save();
        if (s.won) victory();
      }
    }
    function rewind() {
      if (!undo(s)) return;
      highlight = -1;
      ctx.audio.play('tap');
      status('One turn, gently undone.');
      save();
    }
    function helpTile() {
      if (s.won) return;
      const i = hint(s);
      if (i < 0) return;
      if (highlight === i) {
        applyHint(s);
        highlight = -1;
        status('A small nudge in the right direction.');
        save();
        if (s.won) victory();
      } else {
        highlight = i;
        status('Try turning the glowing channel.');
        a.message('A useful place to start.', 'Tap “A little help” again to turn this channel for you. Hints are unlimited.');
      }
    }
    function help() {
      guide?.close();
      ctx.storage.set('guideSeen', true);
      guide = openGuide(ctx.root, GUIDE);
    }
    a.help.onclick = help;
    function down(e) {
      gesture = {
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId
      };
      a.stage.canvas.setPointerCapture(e.pointerId);
    }
    function up(e) {
      if (!gesture || gesture.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y);
      gesture = null;
      if (moved < 18) tap(board.pick(e));
    }
    function cancel() {
      gesture = null;
    }
    a.stage.canvas.addEventListener('pointerdown', down);
    a.stage.canvas.addEventListener('pointerup', up);
    a.stage.canvas.addEventListener('pointercancel', cancel);
    let cursor = 10;
    a.stage.canvas.tabIndex = 0;
    a.stage.canvas.setAttribute('aria-label', 'Reef channels. Arrow keys choose a tile; Enter turns it.');
    function key(e) {
      if (a.modalOpen || guide?.open) return;
      const d = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -5,
        ArrowDown: 5
      };
      if (d[e.key]) {
        e.preventDefault();
        cursor = Math.max(0, Math.min(24, cursor + d[e.key]));
        highlight = cursor;
        status(`Channel ${cursor % 5 + 1}, row ${Math.floor(cursor / 5) + 1}. Press Enter to turn.`);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        tap(cursor);
      }
    }
    a.stage.canvas.addEventListener('keydown', key);
    status();
    a.modal('Take the scenic route.', 'Turn coral channels to wake the pearls. Every reef can be solved.', [...(validSave(saved) ? [{
      label: 'Continue your reef',
      primary: true,
      fn: () => start(false)
    }] : []), {
      label: 'Explore a new reef',
      primary: !validSave(saved),
      fn: () => start(true, ctx.storage.get('level', 1))
    }], {
      onCancel: ctx.exit
    });
    function visibility() {
      if (document.hidden) save();
    }
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    return {
      dispose() {
        guide?.close();
        save();
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('pagehide', save);
        a.stage.canvas.removeEventListener('pointerdown', down);
        a.stage.canvas.removeEventListener('pointerup', up);
        a.stage.canvas.removeEventListener('pointercancel', cancel);
        a.stage.canvas.removeEventListener('keydown', key);
        board.dispose();
        a.dispose();
      }
    };
  }
};
