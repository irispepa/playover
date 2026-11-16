// Patch & Kettle: juice. Toasts, paper confetti and sound effects built on the shell's audio.
import { el } from './dom.js';
import { icon } from './icons.js';

const PAPER = ['#f6a81c', '#f27d6b', '#8fd3b5', '#a9d8f0', '#c9b8f0', '#f6b7c5', '#fff'];

export function makeFx({ layer, toasts, scope, audio, settings }) {
  const sfxOn = () => settings.sfx !== false && !audio.isMuted();
  const t = (o) => { if (sfxOn()) audio.tone(o); };
  const n = (o) => { if (sfxOn()) audio.noise(o); };
  const SFX = {
    tap: () => t({ freq: 620, dur: 0.05, type: 'triangle', vol: 0.12 }),
    pop: () => { t({ freq: 420, to: 760, dur: 0.09, type: 'sine', vol: 0.2 }); },
    place: () => { t({ freq: 300, to: 420, dur: 0.08, type: 'triangle', vol: 0.2 }); n({ dur: 0.04, vol: 0.08, freq: 2400 }); },
    click: () => { n({ dur: 0.03, vol: 0.14, freq: 3200 }); t({ freq: 900, dur: 0.03, type: 'square', vol: 0.05 }); },
    nope: () => { t({ freq: 240, to: 190, dur: 0.14, type: 'triangle', vol: 0.16 }); },
    good: () => [523, 659, 784].forEach((f, i) => t({ freq: f, dur: 0.16, type: 'triangle', vol: 0.18, delay: i * 0.08 })),
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => t({ freq: f, dur: 0.22, type: 'triangle', vol: 0.17, delay: i * 0.09 })),
    coin: () => { t({ freq: 988, dur: 0.06, type: 'square', vol: 0.07 }); t({ freq: 1319, dur: 0.14, type: 'square', vol: 0.07, delay: 0.06 }); },
    heart: () => { t({ freq: 660, to: 880, dur: 0.12, type: 'sine', vol: 0.18 }); t({ freq: 990, dur: 0.16, type: 'sine', vol: 0.12, delay: 0.1 }); },
    purr: () => { for (let i = 0; i < 9; i++) n({ dur: 0.07, vol: 0.1, freq: 190, delay: i * 0.085 }); },
    meow: () => { t({ freq: 760, to: 520, dur: 0.28, type: 'triangle', vol: 0.14 }); },
    talk: () => t({ freq: 300 + Math.random() * 160, dur: 0.045, type: 'triangle', vol: 0.07 }),
    page: () => n({ dur: 0.12, vol: 0.12, freq: 2600 }),
    paper: () => n({ dur: 0.18, vol: 0.14, freq: 1800 }),
    off: () => t({ freq: 440, to: 110, dur: 0.4, type: 'sine', vol: 0.18 }),
    boot: () => [392, 523, 659, 784].forEach((f, i) => t({ freq: f, dur: 0.3, type: 'sine', vol: 0.14, delay: i * 0.12 })),
    beep: () => t({ freq: 880, dur: 0.08, type: 'square', vol: 0.06 }),
    thread: () => [392, 494, 587, 784, 988].forEach((f, i) => t({ freq: f, dur: 0.35, type: 'sine', vol: 0.15, delay: i * 0.11 })),
    day: () => [659, 784, 988].forEach((f, i) => t({ freq: f, dur: 0.3, type: 'sine', vol: 0.12, delay: i * 0.14 })),
    night: () => [784, 659, 523, 392].forEach((f, i) => t({ freq: f, dur: 0.4, type: 'sine', vol: 0.11, delay: i * 0.16 })),
    whoosh: () => n({ dur: 0.2, vol: 0.1, freq: 900 }),
    ring: () => [0, 0.22].forEach((d) => { t({ freq: 880, dur: 0.14, type: 'sine', vol: 0.14, delay: d }); t({ freq: 1109, dur: 0.14, type: 'sine', vol: 0.1, delay: d }); }),
  };
  const last = new Map();
  const sfx = (name) => {
    const f = SFX[name];
    if (!f) return;
    const now = performance.now();
    if (now - (last.get(name) || 0) < 40) return;
    last.set(name, now);
    try { f(); } catch { /* audio unavailable */ }
  };

  // A short message that floats in near the top. kind: 'gw' | 'budget' | 'note' | 'info'.
  function toast(text, kind = 'info') {
    const ic = { gw: 'heart', budget: 'coin', note: 'note', info: 'sparkle', cat: 'paw', hour: 'clock' }[kind] || 'sparkle';
    const node = el(`<div class="pk-toast pk-toast-${kind}">${icon(ic, 18)}<span></span></div>`);
    node.querySelector('span').textContent = text;
    toasts.append(node);
    while (toasts.children.length > 4) toasts.firstElementChild.remove();
    scope.timeout(() => { node.classList.add('pk-out'); scope.timeout(() => node.remove(), 400); }, 2600);
  }

  // Paper bits bursting from a point given in client coordinates (defaults to the middle of the stage).
  function confetti(cx = null, cy = null, count = 26) {
    const r = layer.getBoundingClientRect();
    const x = cx == null ? r.width / 2 : cx - r.left, y = cy == null ? r.height * 0.42 : cy - r.top;
    const frag = document.createDocumentFragment();
    const bits = [];
    for (let i = 0; i < count; i++) {
      const b = document.createElement('i');
      b.className = 'pk-bit';
      const ang = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 120;
      b.style.cssText = `left:${x}px;top:${y}px;background:${PAPER[i % PAPER.length]};--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 60}px;--rot:${(Math.random() * 720 - 360) | 0}deg;width:${6 + Math.random() * 6}px;height:${8 + Math.random() * 7}px;animation-delay:${Math.random() * 0.08}s;border-radius:${Math.random() < 0.3 ? '50%' : '2px'}`;
      frag.append(b); bits.push(b);
    }
    layer.append(frag);
    scope.timeout(() => bits.forEach((b) => b.remove()), 1500);
  }

  // A small "+2" style floater at a client point.
  function floater(text, cx, cy, cls = '') {
    const r = layer.getBoundingClientRect();
    const node = el(`<div class="pk-floater ${cls}"></div>`);
    node.textContent = text;
    node.style.left = `${cx - r.left}px`; node.style.top = `${cy - r.top}px`;
    layer.append(node);
    scope.timeout(() => node.remove(), 1100);
  }

  return { sfx, toast, confetti, floater };
}
