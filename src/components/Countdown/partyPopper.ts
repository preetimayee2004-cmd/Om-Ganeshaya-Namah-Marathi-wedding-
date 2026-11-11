/**
 * triggerPartyPopper(): two party poppers (sound + confetti). Plain JS, no libraries, no audio files.
 * Call it at any moment, e.g. when a scratch card is revealed:  triggerPartyPopper({ muted: isMuted });
 */

// ===== EDIT ME =====
const COLORS = ["#d9a93f", "#f3d98b", "#e0262f", "#ff9933", "#ffffff", "#1fb5a8", "#ff6fa8"]; // gold, light gold, red, saffron, white, teal, pink
const PARTICLES_PER_POPPER = 70;
const SECOND_POPPER_DELAY = 250; // ms: right popper (and second pop sound)
const LIFETIME = 4200;           // ms each piece lives
const REMOVE_AFTER = 5000;       // ms until the canvas is removed
const SPREAD_DEG = 50;           // fan angle of each popper
const MASTER_VOLUME = 0.55;      // keep below ~0.7 to avoid clipping
// ===================

const TAU = Math.PI * 2;
let ac: AudioContext | null = null;
let master: GainNode | null = null;

/** Create or resume the AudioContext. Browsers only allow this inside a user gesture. */
function unlockAudio() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!ac) {
    ac = new Ctx();
    const comp = ac.createDynamicsCompressor(); // safety net against clipping
    master = ac.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(comp).connect(ac.destination);
  }
  if (ac.state === "suspended") void ac.resume();
}
if (typeof window !== "undefined") {
  // first tap / click anywhere unlocks audio so the pop can play later
  ["pointerdown", "touchstart", "click", "keydown"].forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
}

/** white-noise buffer of `secs` seconds; `decay` shapes it into a fast-fading burst */
function noise(secs: number, decay: boolean) {
  const b = ac!.createBuffer(1, Math.ceil(ac!.sampleRate * secs), ac!.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (decay ? Math.pow(1 - i / d.length, 4) : 1);
  return b;
}

/** one pop = bang + thump + sparkle ticks, starting at `t0` */
function pop(t0: number) {
  const out = master!;
  // 1) sharp bang: 0.3 s noise burst, fast decay, highpass ~900 Hz
  const n = ac!.createBufferSource();
  n.buffer = noise(0.3, true);
  const hp = ac!.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const ng = ac!.createGain();
  ng.gain.setValueAtTime(0.9, t0);
  ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
  n.connect(hp).connect(ng).connect(out);
  n.start(t0);
  // 2) low thump: sine 220 Hz -> 50 Hz in 0.12 s, quick fade
  const o = ac!.createOscillator();
  const og = ac!.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(220, t0);
  o.frequency.exponentialRampToValueAtTime(50, t0 + 0.12);
  og.gain.setValueAtTime(0.9, t0);
  og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
  o.connect(og).connect(out);
  o.start(t0);
  o.stop(t0 + 0.2);
  // 3) confetti sparkle: ~14 triangle ticks (2500-6000 Hz, ~70 ms) over 0.7 s, softer one by one
  const TICKS = 14;
  for (let i = 0; i < TICKS; i++) {
    const s = t0 + 0.05 + (i / TICKS) * 0.7 + Math.random() * 0.02;
    const k = ac!.createOscillator();
    const kg = ac!.createGain();
    k.type = "triangle";
    k.frequency.value = 2500 + Math.random() * 3500;
    const vol = 0.07 * (1 - i / (TICKS + 2)); // fades out tick by tick
    kg.gain.setValueAtTime(vol, s);
    kg.gain.exponentialRampToValueAtTime(0.0005, s + 0.07);
    k.connect(kg).connect(out);
    k.start(s);
    k.stop(s + 0.08);
  }
}

export function triggerPartyPopper(opts: { muted?: boolean } = {}) {
  // ---------- sound: two pops, 250 ms apart ----------
  if (!opts.muted) {
    unlockAudio();
    if (ac && master) {
      const now = ac.currentTime + 0.02;
      pop(now);
      pop(now + SECOND_POPPER_DELAY / 1000);
    }
  }
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);

  // ---------- confetti canvas (fixed, on top, never blocks taps) ----------
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999"; // the tiny CSS
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext("2d")!;

  type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; col: string; born: number };
  const parts: P[] = [];
  /** side = -1: bottom-left popper (aims up-right), +1: bottom-right popper (aims up-left) */
  const shoot = (side: -1 | 1) => {
    const aim = -Math.PI / 2 - side * ((20 * Math.PI) / 180); // up, leaning toward the centre
    for (let i = 0; i < PARTICLES_PER_POPPER; i++) {
      const a = aim + ((Math.random() - 0.5) * SPREAD_DEG * Math.PI) / 180;
      const sp = (9 + Math.random() * 11) * dpr; // initial speed 9-20
      const streamer = Math.random() < 0.15;     // ~15% longer streamers
      parts.push({
        x: side < 0 ? 0 : c.width,
        y: c.height,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        w: (streamer ? 16 + Math.random() * 14 : 6 + Math.random() * 6) * dpr,
        h: (streamer ? 3 : 4 + Math.random() * 5) * dpr,
        r: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 0.4,
        col: COLORS[Math.floor(Math.random() * COLORS.length)],
        born: performance.now(),
      });
    }
  };
  shoot(-1);
  setTimeout(() => shoot(1), SECOND_POPPER_DELAY);

  const start = performance.now();
  let last = start;
  const frame = (now: number) => {
    const k = Math.min((now - last) / 16.67, 3); // frame-rate independent step
    last = now;
    g.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vx *= Math.pow(0.985, k);                 // air drag
      p.vy = p.vy * Math.pow(0.985, k) + 0.32 * dpr * k; // drag + gravity
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.r += p.vr * k;
      const life = (now - p.born) / LIFETIME;
      if (life >= 1) continue;
      g.save();
      g.globalAlpha = life < 0.65 ? 1 : 1 - (life - 0.65) / 0.35; // fade out near the end
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.col;
      const flutter = Math.max(0.15, Math.abs(Math.cos(p.r * 1.7))); // height follows rotation = flutter
      g.fillRect(-p.w / 2, (-p.h * flutter) / 2, p.w, p.h * flutter);
      g.restore();
    }
    if (now - start < REMOVE_AFTER) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}
