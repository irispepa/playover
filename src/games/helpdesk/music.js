// Patch & Kettle: a tiny generated music-box loop. One AudioContext, a look-ahead scheduler, soft sine plucks.
// start() needs a user gesture to have happened; stop() tears every node down.
const SCALE = [0, 2, 4, 7, 9];                      // major pentatonic
const ROOTS = [0, -3, 5, -5];                       // gentle four-bar progression (in semitones from C)
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function makeMusic({ isMuted }) {
  let ac = null, master = null, timer = null, next = 0, step = 0, on = false, seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let motif = [];
  const newMotif = () => { motif = Array.from({ length: 8 }, () => (rnd() < 0.3 ? null : SCALE[(rnd() * SCALE.length) | 0] + (rnd() < 0.35 ? 12 : 0))); };

  function pluck(freq, t, vol, dur) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    // a soft octave shimmer makes it sound like a music box
    const o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * 2, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(vol * 0.22, t + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5);
    o2.connect(g2); g2.connect(master);
    o2.start(t); o2.stop(t + dur * 0.5 + 0.05);
  }

  function schedule() {
    if (!ac || !on) return;
    master.gain.setTargetAtTime(isMuted() ? 0 : 0.16, ac.currentTime, 0.2);
    const beat = 0.34;
    while (next < ac.currentTime + 0.5) {
      const bar = (step / 8) | 0, i = step % 8;
      if (i === 0 && bar % 4 === 0) newMotif();
      const root = 60 + ROOTS[bar % 4];
      if (i === 0) pluck(midi(root - 12), next, 0.5, 2.2);
      if (i === 4) pluck(midi(root - 5), next, 0.3, 1.6);
      const note = motif[i];
      if (note != null) pluck(midi(root + 12 + note), next, 0.34, 1.3);
      next += beat * (i % 2 ? 0.92 : 1.08);        // a little swing
      step++;
    }
  }

  return {
    start() {
      if (on) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        if (!ac) { ac = new AC(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination); }
        if (ac.state === 'suspended') ac.resume();
        on = true; next = ac.currentTime + 0.1; step = 0;
        timer = setInterval(schedule, 120);
      } catch { on = false; }
    },
    stop() {
      on = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (master && ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    },
    isOn: () => on,
    dispose() {
      this.stop();
      if (ac) { try { master.disconnect(); ac.close(); } catch { /* already closed */ } ac = null; master = null; }
    },
  };
}
