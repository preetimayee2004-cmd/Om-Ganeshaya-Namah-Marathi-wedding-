/**
 * triggerPartyPopper(): two party poppers (confetti + a short vibration, no sound). Plain JS, no libraries.
 * Call it at any moment, e.g. when a scratch card is revealed:  triggerPartyPopper();
 */

// ===== EDIT ME =====
const COLORS = ["#d9a93f", "#f3d98b", "#e0262f", "#ff9933", "#ffffff", "#1fb5a8", "#ff6fa8"]; // gold, light gold, red, saffron, white, teal, pink
const PARTICLES_PER_POPPER = 70;
const SECOND_POPPER_DELAY = 250; // ms: right popper (and second pop sound)
const LIFETIME = 4200;           // ms each piece lives
const REMOVE_AFTER = 5000;       // ms until the canvas is removed
const SPREAD_DEG = 50;           // fan angle of each popper
// ===================

const TAU = Math.PI * 2;
export function triggerPartyPopper() {
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
