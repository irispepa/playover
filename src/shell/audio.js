// Synthesized sound effects (no audio files). iOS needs a user gesture before sound plays;
// the shell calls unlock() on the first touch.
let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export const audio = {
  unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
  setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.5; },
  isMuted: () => muted,

  // tone({ freq, to, dur, type, vol, delay }) — one oscillator with a pitch slide and decay.
  tone({ freq = 440, to = null, dur = 0.12, type = 'sine', vol = 0.3, delay = 0 } = {}) {
    const c = ensure(); if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },

  // noise({ dur, vol, freq }) — filtered noise burst for hits, explosions, footsteps.
  noise({ dur = 0.15, vol = 0.3, freq = 1200, delay = 0 } = {}) {
    const c = ensure(); if (!c || muted) return;
    const t0 = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(t0);
  },

  // Named presets shared by all games.
  play(name) {
    const a = audio;
    switch (name) {
      case 'tap': a.tone({ freq: 660, dur: 0.05, type: 'triangle', vol: 0.15 }); break;
      case 'place': a.tone({ freq: 220, to: 330, dur: 0.1, type: 'triangle', vol: 0.25 }); break;
      case 'coin': a.tone({ freq: 880, dur: 0.07, type: 'square', vol: 0.12 }); a.tone({ freq: 1320, dur: 0.12, type: 'square', vol: 0.12, delay: 0.07 }); break;
      case 'hit': a.noise({ dur: 0.1, vol: 0.3, freq: 900 }); break;
      case 'explode': a.noise({ dur: 0.4, vol: 0.4, freq: 500 }); a.tone({ freq: 120, to: 40, dur: 0.35, type: 'sawtooth', vol: 0.2 }); break;
      case 'error': a.tone({ freq: 180, to: 120, dur: 0.18, type: 'sawtooth', vol: 0.18 }); break;
      case 'good': [523, 659, 784].forEach((f, i) => a.tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.2, delay: i * 0.09 })); break;
      case 'bad': [392, 330, 262].forEach((f, i) => a.tone({ freq: f, dur: 0.2, type: 'triangle', vol: 0.2, delay: i * 0.13 })); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => a.tone({ freq: f, dur: 0.16, type: 'square', vol: 0.12, delay: i * 0.08 })); break;
      default: break;
    }
  },
};
