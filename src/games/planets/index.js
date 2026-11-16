import { arcade, button, node } from '../../shell/arcade.js';
import { randomSeed } from '../../shell/rng.js';
import { newGame, move, undo, recycle, validSave, planet, PLANETS } from './sim.js';
import { createBoard } from './render.js';
export default {
  start(ctx) {
    const a = arcade(ctx, {
      theme: 'planets',
      title: 'Pocket Planets',
      subtitle: 'Make a little room for the universe',
      background: 0x171d39
    });
    const saved = ctx.storage.get('save');
    let s = validSave(saved) ? saved : newGame(randomSeed()),
      active = false,
      recycling = false,
      gesture = null,
      locked = 0;
    let best = ctx.storage.get('best', 0);
    const board = createBoard(a);
    const score = a.stat('stardust', s.score),
      bestStat = a.stat('best', best),
      top = a.stat('largest', Math.max(...s.cells));
    const row = node('div', 'planet-controls'),
      tools = node('div', 'planet-tools'),
      pad = node('div', 'planet-pad'),
      right = node('div', 'planet-tools');
    const undoButton = button('Undo', rewind),
      recycleButton = button('Recycle · 2', () => {
        recycling = !recycling;
        status();
      }),
      atlasButton = button('Planet atlas', atlas),
      newButton = button('New galaxy', confirmNew);
    tools.append(undoButton, atlasButton);
    right.append(recycleButton, newButton);
    for (const [label, dir, col, gridrow] of [['↑', 'up', 2, 1], ['←', 'left', 1, 2], ['↓', 'down', 2, 2], ['→', 'right', 3, 2]]) {
      const b = button(label, () => slide(dir));
      b.style.gridColumn = col;
      b.style.gridRow = gridrow;
      b.setAttribute('aria-label', `Slide ${dir}`);
      pad.append(b);
    }
    row.append(tools, pad, right);
    a.controls.append(row);
    function save() {
      if (active) ctx.storage.set('save', s);
    }
    function status(text) {
      score.textContent = s.score.toLocaleString();
      bestStat.textContent = best.toLocaleString();
      top.textContent = Math.max(...s.cells);
      undoButton.disabled = !s.history.length;
      recycleButton.textContent = recycling ? 'Cancel recycle' : `Recycle · ${s.dust}`;
      recycleButton.disabled = !s.dust && !recycling;
      recycleButton.classList.toggle('arc-primary', recycling);
      const v = Math.max(...s.cells);
      a.message(recycling ? 'Tap a planet to recycle it.' : text || `${planet(v).name} is your biggest little world.`, recycling ? 'Costs one charge. Earn a new charge every 512 stardust.' : 'Swipe anywhere on the tray. Equal planets merge. Make a 2048 Sun.');
    }
    function start(fresh) {
      if (fresh) s = newGame(randomSeed());
      active = true;
      recycling = false;
      board.sync(s);
      save();
      status();
    }
    function confirmNew() {
      a.modal('A fresh patch of space?', 'Start with two tiny moons. Your best stardust score and discovered planets stay.', [{
        label: 'Keep this galaxy'
      }, {
        label: 'Start fresh',
        primary: true,
        fn: () => start(true)
      }]);
    }
    function slide(dir) {
      if (!active || a.modalOpen || recycling || locked > 0) return;
      const result = move(s, dir);
      if (!result) {
        ctx.audio.play('tap');
        if (s.over) gameOver();
        return;
      }
      locked = .16;
      if (s.score > best) {
        best = s.score;
        ctx.storage.set('best', best);
        ctx.setBest(`Best: ${best.toLocaleString()} stardust`);
      }
      const high = Math.max(...s.cells);
      ctx.storage.set('discovered', Math.max(high, ctx.storage.get('discovered', 2)));
      board.sync(s, result);
      ctx.audio.play(result.score ? 'coin' : 'place');
      status(result.score ? `A new world. +${result.score} stardust.` : null);
      save();
      if (high >= 2048 && !s.won) {
        s.won = true;
        save();
        a.modal('You made a sun.', 'Two little moons became something luminous. Keep going and see how big this pocket universe can get.', [{
          label: 'Keep exploring',
          primary: true
        }, {
          label: 'Start a new galaxy',
          fn: () => start(true)
        }]);
      } else if (s.over) gameOver();
    }
    function gameOver() {
      a.modal('A very full universe.', s.dust ? 'No slides left. Recycle a planet to make room, or undo your last move.' : 'No slides left. Undo a move and try a different direction, or start a fresh galaxy.', [...(s.dust ? [{
        label: 'Choose a planet to recycle',
        primary: true,
        fn: () => {
          recycling = true;
          status();
        }
      }] : []), ...(s.history.length ? [{
        label: 'Undo last move',
        fn: rewind
      }] : []), {
        label: 'New galaxy',
        fn: () => start(true)
      }]);
    }
    function rewind() {
      const prev = undo(s);
      if (!prev) return;
      s = prev;
      locked = 0;
      recycling = false;
      board.sync(s);
      ctx.audio.play('tap');
      save();
      status('A small reversal of time.');
    }
    function atlas() {
      const content = node('div');
      const discovered = ctx.storage.get('discovered', Math.max(...s.cells));
      for (const p of PLANETS) {
        const r = node('div', 'arc-rule');
        const name = node('strong', '', `${p.value} · ${p.value <= discovered ? p.name : 'Undiscovered'}`);
        name.style.color = '#' + p.color.toString(16).padStart(6, '0');
        r.append(name);
        content.append(r);
      }
      content.append(node('p', '', 'Each pair becomes the next planet. Reach 2048 to make a Sun; keep merging for a higher score.'));
      a.modal('The pocket atlas', content, [{
        label: 'Back to space',
        primary: true
      }]);
    }
    function help() {
      a.modal('A universe under your thumb.', 'Swipe up, down, left or right to slide every planet. Two equal planets merge into one larger world. Each slide adds a new moon or rose planet.\n\nPlan ahead: keep your biggest planets near a corner. A planet can merge only once per slide. Aim for a 2048 Sun, then keep exploring.\n\nUndo reverses your last move. Recycle removes any one planet; you start with two charges and earn more every 512 stardust.\n\nNo timer. No rush. Your galaxy saves after every move.', [{
        label: 'Back to the stars',
        primary: true
      }]);
    }
    a.help.onclick = help;
    function down(e) {
      if (a.modalOpen) return;
      gesture = {
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId
      };
      a.stage.canvas.setPointerCapture(e.pointerId);
    }
    function up(e) {
      if (!gesture || gesture.id !== e.pointerId) return;
      const dx = e.clientX - gesture.x,
        dy = e.clientY - gesture.y;
      gesture = null;
      if (recycling && Math.hypot(dx, dy) < 20) {
        const index = board.pick(e);
        if (index !== undefined && recycle(s, index)) {
          recycling = false;
          board.sync(s);
          save();
          ctx.audio.play('good');
          status('A little breathing room.');
        }
        return;
      }
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) slide(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
    }
    function cancel() {
      gesture = null;
    }
    function key(e) {
      const dirs = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down'
      };
      if (dirs[e.key] && !a.modalOpen) {
        e.preventDefault();
        slide(dirs[e.key]);
      }
    }
    a.stage.canvas.addEventListener('pointerdown', down);
    a.stage.canvas.addEventListener('pointerup', up);
    a.stage.canvas.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    a.stage.onFrame(dt => locked = Math.max(0, locked - dt));
    board.sync(s);
    status();
    a.modal('A whole universe. Pocket-sized.', 'Slide tiny planets together. Grow moons into oceans, rings, and eventually a sun. A calm puzzle for the long way home.', [...(validSave(saved) ? [{
      label: 'Continue your galaxy',
      primary: true,
      fn: () => start(false)
    }] : []), {
      label: 'Start a new galaxy',
      primary: !validSave(saved),
      fn: () => {
        start(true);
        help();
      }
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
        save();
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('pagehide', save);
        window.removeEventListener('keydown', key);
        a.stage.canvas.removeEventListener('pointerdown', down);
        a.stage.canvas.removeEventListener('pointerup', up);
        a.stage.canvas.removeEventListener('pointercancel', cancel);
        board.dispose();
        a.dispose();
      }
    };
  }
};
