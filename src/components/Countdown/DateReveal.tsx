import React, { useEffect, useRef, useState, useCallback } from "react";
import { weddingAudio } from "./weddingAudio";
import { sound } from "../../lib/sound";
import { wedding } from "../../config/wedding";
import { triggerPartyPopper } from "./partyPopper";
import PointerHand, { TIP } from "../Layout/PointerHand";
import { useScrollRoot } from "../Layout/ScrollRoot";
import { useGuest } from "../../context/GuestContext";

/** erase a soft round spot of the foil (destination-out) */
function eraseAt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
  radial.addColorStop(0, "rgba(0,0,0,1)");
  radial.addColorStop(0.7, "rgba(0,0,0,0.85)");
  radial.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

interface Petal {
  id: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
  spin: number;
  size: number;
  color: string;
  opacity: number;
}

interface DateRevealProps {
  onRevealed?: () => void;
}

const TAU = Math.PI * 2;

/** teardrop paisley with a curled tip, centred on the origin */
function paisleyPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.9, s * 0.5, 0, s * 0.8);
  ctx.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.5, -s * 0.2, -s * 0.05, -s * 0.1);
  ctx.bezierCurveTo(s * 0.25, 0, s * 0.25, -s * 0.35, 0, -s * 0.4);
}

/** rounded-rectangle path */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** draw a path twice, offset, as if pressed into soft metal (shadow below-right, light above-left) */
function engrave(ctx: CanvasRenderingContext2D, draw: () => void, width = 1) {
  ([[0.8, 0.8, "rgba(92,60,14,0.42)"], [-0.6, -0.6, "rgba(255,244,214,0.55)"]] as const).forEach(([dx, dy, c]) => {
    ctx.save();
    ctx.translate(dx, dy);
    draw();
    ctx.strokeStyle = c;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * Scratch foil: matte antique-gold leaf with a faint linen grain, an engraved double rounded border,
 * kairi (paisley) motifs in the corners and a small engraved lotus medallion in the centre.
 * Deliberately flat: no bokeh, no sheen, no glow.
 */
function drawSilkFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // matte antique gold, a very gentle top-to-bottom tone shift
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#d7b56e");
  base.addColorStop(0.5, "#cdaa60");
  base.addColorStop(1, "#c29d55");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // fine linen grain
  ctx.save();
  ctx.lineWidth = 0.5;
  for (let y = 0, i = 0; y < h; y += 2.2, i++) {
    ctx.strokeStyle = i % 3 ? "rgba(120,84,24,0.05)" : "rgba(255,240,205,0.07)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();

  // soft edge darkening, like gold leaf on board
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.65);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(100,66,16,0.18)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // engraved double rounded border
  const r = Math.min(14, h * 0.12);
  engrave(ctx, () => roundRect(ctx, 9, 9, w - 18, h - 18, r), 1.1);
  engrave(ctx, () => roundRect(ctx, 14, 14, w - 28, h - 28, r - 4), 0.6);

  // kairi motifs in the corners, turned inward
  const k = Math.min(9, h * 0.08);
  ([[26, 26, 0.8], [w - 26, 26, 2.35], [w - 26, h - 26, -2.35], [26, h - 26, -0.8]] as const).forEach(([x, y, rot]) => {
    engrave(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot);
      paisleyPath(ctx, k);
    }, 0.9);
  });

  // small dotted bead line along the top and bottom inner edges
  ctx.save();
  for (let x = 40; x < w - 40; x += 7) {
    [h * 0.5 - (h - 28) / 2 + 5, h * 0.5 + (h - 28) / 2 - 5].forEach((y) => {
      ctx.fillStyle = "rgba(255,244,214,0.45)";
      ctx.beginPath();
      ctx.arc(x - 0.4, y - 0.4, 0.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(92,60,14,0.35)";
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 0.5, 0.8, 0, TAU);
      ctx.fill();
    });
  }
  ctx.restore();

  // engraved lotus medallion in the centre
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(16, h * 0.13);
  engrave(ctx, () => {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 1.9, 0, TAU);
  }, 0.7);
  engrave(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.55, cy - s * 0.45, cx + s * 0.45, cy + s * 0.25, cx, cy + s * 0.55);
    ctx.bezierCurveTo(cx - s * 0.45, cy + s * 0.25, cx - s * 0.55, cy - s * 0.45, cx, cy - s);
    ctx.moveTo(cx, cy + s * 0.55);
    ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.3, cx - s * 1.05, cy - s * 0.05, cx - s * 1.2, cy - s * 0.35);
    ctx.bezierCurveTo(cx - s * 0.9, cy + s * 0.35, cx - s * 0.5, cy + s * 0.6, cx, cy + s * 0.55);
    ctx.bezierCurveTo(cx + s * 0.5, cy + s * 0.6, cx + s * 0.9, cy + s * 0.35, cx + s * 1.2, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 1.05, cy - s * 0.05, cx + s * 0.5, cy + s * 0.3, cx, cy + s * 0.55);
    ctx.moveTo(cx - s * 1.1, cy + s * 0.85);
    ctx.quadraticCurveTo(cx, cy + s * 1.15, cx + s * 1.1, cy + s * 0.85);
  }, 0.9);
}

/** symmetrical hand-painted floral motif for the top: a lotus with a thin vine, a few blooms and leaves */
function FloralCrest() {
  const side = (flip: boolean) => (
    <g transform={flip ? "translate(320 0) scale(-1 1)" : undefined}>
      <path d="M134 34C112 26 92 30 72 22 56 16 44 18 30 26" fill="none" stroke="#9a7a3a" strokeWidth=".9" strokeLinecap="round" />
      {/* leaves */}
      {([[116, 28, -20], [96, 28, 25], [78, 23, -30], [58, 18, 20], [42, 20, -25]] as const).map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y}c3-5 9-6 12-4-3 5-8 6-12 4Z`} transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? "#7f9a5a" : "#6d8a4c"} opacity=".85" />
      ))}
      {/* small marigold blooms */}
      {([[104, 31, 3.6], [66, 20, 3.1], [34, 24, 2.6]] as const).map(([x, y, rr], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={rr} fill="#e3a23a" />
          <circle cx={x} cy={y} r={rr * 0.55} fill="#c97a1e" />
        </g>
      ))}
      {/* a rose-pink bud */}
      <path d="M86 26c2-3 5-3 6 0-1 3-4 4-6 0Z" fill="#c4566e" />
    </g>
  );
  return (
    <svg viewBox="0 0 320 48" className="mx-auto block" style={{ width: "calc(var(--u) * 300)", height: "calc(var(--u) * 45)" }} aria-hidden>
      {side(false)}
      {side(true)}
      {/* central lotus */}
      <g transform="translate(160 30)">
        <path d="M0-20c6 6 7 15 0 22-7-7-6-16 0-22Z" fill="#e9a7b4" stroke="#a8455c" strokeWidth=".7" />
        <path d="M0 2c-4-8-11-12-19-12 2 8 9 12 19 12Zm0 0c4-8 11-12 19-12-2 8-9 12-19 12Z" fill="#f2c2cb" stroke="#a8455c" strokeWidth=".7" />
        <path d="M0 2c-2-5-6-8-11-9M0 2c2-5 6-8 11-9" fill="none" stroke="#a8455c" strokeWidth=".5" />
        <path d="M-16 6c8 3 24 3 32 0" fill="none" stroke="#9a7a3a" strokeWidth=".8" />
        <circle cy="-24" r="1.4" fill="#b8862f" />
      </g>
    </svg>
  );
}

/** thin vine with a small lotus centrepiece, for the bottom */
function VineRule() {
  return (
    <svg viewBox="0 0 320 24" className="mx-auto block" style={{ width: "calc(var(--u) * 280)", height: "calc(var(--u) * 21)" }} aria-hidden>
      <path d="M18 13C60 9 100 17 140 12M302 13C260 9 220 17 180 12" fill="none" stroke="#a8843f" strokeWidth=".8" strokeLinecap="round" />
      {([[52, 11, -25], [86, 14, 25], [118, 12, -20], [268, 11, 25], [234, 14, -25], [202, 12, 20]] as const).map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y}c2.5-4 7-5 10-3-2.5 4-7 5-10 3Z`} transform={`rotate(${r} ${x} ${y})`} fill="#7f9a5a" opacity=".8" />
      ))}
      <g transform="translate(160 14)">
        <path d="M0-10c3.5 3.5 4 8.5 0 12-4-3.5-3.5-8.5 0-12Z" fill="#f2c2cb" stroke="#a8455c" strokeWidth=".6" />
        <path d="M0 2c-2.5-4.5-6.5-7-11-7 1.2 4.5 5.2 7 11 7Zm0 0c2.5-4.5 6.5-7 11-7-1.2 4.5-5.2 7-11 7Z" fill="#f7d6dc" stroke="#a8455c" strokeWidth=".6" />
        <path d="M-9 5c5 2 13 2 18 0" fill="none" stroke="#a8843f" strokeWidth=".7" />
      </g>
    </svg>
  );
}

/** delicate antique-gold divider under the heading */
function GoldDivider() {
  return (
    <svg viewBox="0 0 200 12" className="mx-auto block" style={{ width: "calc(var(--u) * 150)", height: "calc(var(--u) * 9)" }} fill="none" stroke="#b08a3e" strokeLinecap="round" aria-hidden>
      <path d="M10 6h70M120 6h70" strokeWidth=".7" />
      <path d="M80 6c6-4 10-4 14 0M120 6c-6-4-10-4-14 0" strokeWidth=".7" />
      <path d="M100 1.5l3.5 4.5-3.5 4.5-3.5-4.5z" fill="#b08a3e" fillOpacity=".25" strokeWidth=".7" />
    </svg>
  );
}

/** small traditional lotus used as an icon */
function Lotus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden>
      <path d="M12 3c2.6 3 2.6 8 0 11-2.6-3-2.6-8 0-11Z" fill="currentColor" fillOpacity=".18" />
      <path d="M12 14c-4-.5-7-3-8-7 4 0 7 2.3 8 7Zm0 0c4-.5 7-3 8-7-4 0-7 2.3-8 7Z" fill="currentColor" fillOpacity=".12" />
      <path d="M3 17c4 3 14 3 18 0" />
    </svg>
  );
}

/** gold corner flourish; rotate with a class for the other three corners */
function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" className={`pointer-events-none absolute h-6 w-6 text-[#C9963A] ${className}`} fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden>
      <path d="M2 28V11C2 5.5 5.5 2 11 2h17" strokeWidth="1.4" />
      <path d="M7 28V14c0-4 3-7 7-7h14" strokeWidth=".7" opacity=".75" />
      <circle cx="11.5" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** how much of the foil must be scratched away before the date is revealed completely */
const REVEAL_PERCENT = 40;
/** the date reveals itself this long after the card is first on screen, if nobody scratched it */
const AUTO_REVEAL_MS = 8000;
/** how long the self-scratch sweep takes */
const AUTO_SCRATCH_MS = 1200;

export default function DateReveal({ onRevealed }: DateRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isScratchingRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const lastParticleTime = useRef(0);
  const lastCheckTime = useRef(0);

  const [isRevealed, setIsRevealed] = useState(false);
  const [phase, setPhase] = useState<number>(0); // 0: initial, 1: dissolving (600ms), 2: date/mandala (900ms-1500ms), 3: settled
  const [hasInteracted, setHasInteracted] = useState(false);
  const [peek, setPeek] = useState(false); // the date shows through the scratched spots
  const demoHandRef = useRef<HTMLDivElement | null>(null);
  const scroller = useScrollRoot();
  const { guestName } = useGuest();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [petals, setPetals] = useState<Petal[]>([]);

  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const scratchDistanceRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);


  // Initialize Canvas Surface
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    drawSilkFoil(ctx, w, h);
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (!isRevealed) initCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas, isRevealed]);

  // Hint hand demo: once the card is on screen the hand scratches a short wavy stroke over the
  // middle of the date (a peek, far below the reveal threshold), lifts, and repeats the same
  // stroke, so it never clears more, until the guest scratches themselves.
  useEffect(() => {
    if (hasInteracted || isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const STROKE = 1900;
    const LIFT = 900;
    const at = (t: number, w: number, h: number) => ({
      x: w * (0.27 + 0.4 * t),
      y: h * (0.42 + 0.08 * Math.sin(t * Math.PI * 4)),
    });
    let raf = 0;
    let t0 = 0;
    let prev: { x: number; y: number } | null = null;
    let peeked = false;
    const tick = (now: number) => {
      const hand = demoHandRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!hand || !ctx) return;
      if (!t0) t0 = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const k = (now - t0) % (STROKE + LIFT);
      let p: { x: number; y: number };
      if (k < STROKE) {
        const s = k / STROKE;
        const e = s < 0.5 ? 2 * s * s : 1 - (-2 * s + 2) ** 2 / 2; // ease in-out
        p = at(e, w, h);
        const r = w < 360 ? 15 : 18;
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        if (prev) {
          const steps = Math.max(1, Math.floor(Math.hypot(p.x - prev.x, p.y - prev.y) / 4));
          for (let i = 1; i <= steps; i++) eraseAt(ctx, prev.x + ((p.x - prev.x) * i) / steps, prev.y + ((p.y - prev.y) * i) / steps, r);
        } else eraseAt(ctx, p.x, p.y, r);
        ctx.restore();
        prev = p;
        if (!peeked) {
          peeked = true;
          setPeek(true);
        }
        hand.style.opacity = "1";
      } else {
        // lift and glide back to the start of the stroke
        const s = (k - STROKE) / LIFT;
        const a = at(1, w, h);
        const b = at(0, w, h);
        p = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s - Math.sin(s * Math.PI) * h * 0.12 };
        prev = null;
      }
      const hw = hand.offsetWidth;
      const hh = hand.offsetHeight;
      hand.style.transform = `translate(${(p.x - TIP.x * hw).toFixed(1)}px, ${(p.y - TIP.y * hh).toFixed(1)}px) rotate(${k < STROKE ? -8 : 4}deg)`;
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    let running = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          t0 = 0;
          prev = null;
          raf = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { root: scroller ?? null, threshold: 0.5 },
    );
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [hasInteracted, isRevealed, scroller]);

  // Trigger Refined Celebration Sequence
  const triggerCelebration = useCallback(() => {
    if (isRevealed) return;
    setIsRevealed(true);
    setPhase(1); // 0ms: Dissolving remaining texture over 600ms
    triggerPartyPopper({ muted: sound.isMuted() }); // party popper: sound x2 + confetti + vibration

    if (onRevealed) onRevealed();

    // Clear scratch dust particles
    setParticles([]);

    // 200ms: As surface dissolves, date becomes visible + gentle Shehnai flourish + mandala draws
    setTimeout(() => {
      setPhase(2);

      // Spawn exactly 4 softly drifting marigold petals (requirement: 3-5 petals)
      const marigoldColors = ["#FFA000", "#FFB300", "#E65100", "#FF8F00"];
      const newPetals: Petal[] = [
        { id: 1, x: 20, y: -12, speed: 0.9, angle: 12, spin: 0.5, size: 14, color: marigoldColors[0], opacity: 0.85 },
        { id: 2, x: 45, y: -24, speed: 1.1, angle: -18, spin: -0.4, size: 16, color: marigoldColors[1], opacity: 0.9 },
        { id: 3, x: 72, y: -16, speed: 0.95, angle: 25, spin: 0.4, size: 13, color: marigoldColors[2], opacity: 0.85 },
        { id: 4, x: 88, y: -28, speed: 1.05, angle: -12, spin: -0.5, size: 15, color: marigoldColors[3], opacity: 0.88 },
      ];
      setPetals(newPetals);
    }, 200);

    // 3000ms: Settle into completely still wedding invitation composition
    setTimeout(() => {
      setPhase(3);
    }, 3000);
  }, [isRevealed, onRevealed]);

  // Auto-scratch: AUTO_REVEAL_MS after the card is first on screen, if the date is still hidden,
  // the foil scratches itself away in a quick zig-zag and the usual celebration plays.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (isRevealed || autoStarted.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let timer = 0;
    let raf = 0;
    const run = () => {
      if (autoStarted.current) return;
      autoStarted.current = true;
      hasInteractedRef.current = true;
      setHasInteracted(true); // stops the hint hand
      setPeek(true);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!ctx || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        triggerCelebration();
        return;
      }
      const ROWS = 4;
      const r = Math.max(w, h) * 0.13;
      const at = (t: number) => {
        const row = Math.min(ROWS - 1, Math.floor(t * ROWS));
        const k = t * ROWS - row;
        const x = row % 2 === 0 ? k : 1 - k;
        return { x: w * (0.06 + 0.88 * x), y: h * (0.14 + (0.72 * (row + k * 0.6)) / (ROWS - 0.4)) };
      };
      const t0 = performance.now();
      let prev = at(0);
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / AUTO_SCRATCH_MS);
        const p = at(t);
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        const steps = Math.max(1, Math.floor(Math.hypot(p.x - prev.x, p.y - prev.y) / 6));
        for (let i = 1; i <= steps; i++) eraseAt(ctx, prev.x + ((p.x - prev.x) * i) / steps, prev.y + ((p.y - prev.y) * i) / steps, r);
        ctx.restore();
        prev = p;
        if (t < 1) raf = requestAnimationFrame(tick);
        else triggerCelebration();
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) timer = window.setTimeout(run, AUTO_REVEAL_MS);
      },
      { root: scroller ?? null, threshold: 0.5 },
    );
    io.observe(canvas);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [isRevealed, triggerCelebration, scroller]);

  // Calculate Cleared Percentage (fast 20px sampling to eliminate frame drops)
  const checkScratchPercentage = useCallback((force = false) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const now = performance.now();
    if (!force && now - lastCheckTime.current < 150) return;
    lastCheckTime.current = now;

    const w = canvas.width;
    const h = canvas.height;
    const sampleSize = 20; // Fast sparse sampling
    let cleared = 0;
    let total = 0;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y += sampleSize) {
      for (let x = 0; x < w; x += sampleSize) {
        total++;
        const alphaIndex = (y * w + x) * 4 + 3;
        if (data[alphaIndex] < 50) {
          cleared++;
        }
      }
    }

    const pct = Math.round((cleared / total) * 100);

    // Reveal everything only once about 40% of the foil has been scratched away
    if (pct >= REVEAL_PERCENT && !isRevealed) {
      triggerCelebration();
    }
  }, [isRevealed, triggerCelebration]);

  // Scratch Drawing
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 1. First interaction: one soft, authentic temple bell
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
      setPeek(true);
      weddingAudio.playTempleBell();
    }

    // 2. Scratch movement: very subtle scratch whisper (throttled)
    weddingAudio.playScratchSound();

    // 3. Subtle gold dust effect, very few particles (throttled to avoid any lag)
    const now = performance.now();
    if (now - lastParticleTime.current > 140) {
      lastParticleTime.current = now;
      setParticles((prev) => [
        ...prev.slice(-3),
        {
          id: Date.now() + Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.4,
          size: 2 + Math.random() * 2,
          color: "#E2A84B",
          alpha: 0.85,
          life: 0.5,
        },
      ]);
    }

    // Erase smooth progressive path
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const brushRadius = rect.width < 360 ? 26 : 32;

    if (lastPoint.current) {
      const dist = Math.hypot(x - lastPoint.current.x, y - lastPoint.current.y);
      scratchDistanceRef.current += dist;
      const steps = Math.max(1, Math.floor(dist / 4));
      for (let i = 0; i <= steps; i++) {
        const cx = lastPoint.current.x + ((x - lastPoint.current.x) * i) / steps;
        const cy = lastPoint.current.y + ((y - lastPoint.current.y) * i) / steps;

        const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, brushRadius);
        radial.addColorStop(0, "rgba(0,0,0,1)");
        radial.addColorStop(0.7, "rgba(0,0,0,0.85)");
        radial.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(cx, cy, brushRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const radial = ctx.createRadialGradient(x, y, 0, x, y, brushRadius);
      radial.addColorStop(0, "rgba(0,0,0,1)");
      radial.addColorStop(0.7, "rgba(0,0,0,0.85)");
      radial.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    lastPoint.current = { x, y };
    strokeCount.current++;

    // reveal only after ~40% of the foil is cleared (the check is throttled and sparsely sampled)
    checkScratchPercentage();
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // stops text selection, so the I-beam never appears while scratching
    isScratchingRef.current = true;
    lastPoint.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current) return;
    e.preventDefault();
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isScratchingRef.current = false;
    lastPoint.current = null;
    checkScratchPercentage(true); // reveal only if 40% is already cleared
  };

  // Touch Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isScratchingRef.current = true;
      lastPoint.current = null;
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    isScratchingRef.current = false;
    lastPoint.current = null;
    checkScratchPercentage(true); // reveal only if 40% is already cleared
  };

  // Particle & Petal Animation Loop
  useEffect(() => {
    let active = true;

    const loop = () => {
      // Animate Scratch Dust Particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.05,
            alpha: p.alpha - 0.03,
            life: p.life - 0.035,
          }))
          .filter((p) => p.life > 0 && p.alpha > 0)
      );

      // Animate Falling Marigold Petals (gentle 2.5s drift)
      setPetals((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speed * 0.4,
            x: p.x + Math.sin(p.angle * (Math.PI / 180)) * 0.18,
            angle: p.angle + p.spin,
          }))
          .filter((p) => p.y < 125)
      );

      if (active) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const SERIF = '"Cormorant Garamond", Georgia, serif';
  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[430px] cursor-default select-none overflow-hidden rounded-[1.4rem] border border-[#d9bf86]"
      style={{ boxShadow: "0 calc(var(--u) * 10) calc(var(--u) * 26) calc(var(--u) * -14) rgba(109,15,27,0.22)" }}
    >
      {/* cream paper with the site's soft sky wash */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#faddb5]"
        style={{
          backgroundImage: `linear-gradient(rgba(250,221,181,0.86), rgba(250,221,181,0.86)), url("${wedding.images.sky}")`,
          backgroundSize: "100% 100%, 100% auto",
        }}
      />
      {/* one inner antique-gold hairline */}
      <div className="pointer-events-none absolute inset-[6px] z-20 rounded-[1.1rem] border border-[#c9a45a]/50" />

      <div className="relative z-10 px-6 pb-5 pt-4 text-center">
        {/* hand-painted floral crest */}
        <FloralCrest />

        {/* heading */}
        <h2
          className="mt-2 uppercase text-[#6d0f1b]"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "calc(var(--u) * 27)", letterSpacing: "0.14em", paddingLeft: "0.14em", lineHeight: 1.1 }}
        >
          Save the Date
        </h2>
        <div className="mt-2">
          <GoldDivider />
        </div>

        {/* greeting */}
        <p className="mt-4 font-script leading-none text-[#7a1420]" style={{ fontSize: "calc(var(--u) * 28)" }}>
          Dear <span className="guest-name">{guestName}</span>
        </p>
        <p className="mt-1.5 text-[#6b4a3a]" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "calc(var(--u) * 15.5)", letterSpacing: "0.03em" }}>
          keep this day for us
        </p>

        {/* ===== scratch panel: engraved antique-gold frame around the foil ===== */}
        <div
          className="relative mx-auto mt-5 w-full max-w-[350px] rounded-[18px] p-[5px]"
          style={{
            background: "#c8a25a",
            boxShadow: "inset 0 0 0 1px rgba(255,240,205,0.55), inset 0 0 0 4px #c8a25a, inset 0 0 0 5px rgba(110,72,18,0.45), 0 calc(var(--u) * 6) calc(var(--u) * 14) calc(var(--u) * -8) rgba(80,40,10,0.35)",
          }}
        >
          <div className="relative overflow-hidden rounded-[13px]" style={{ minHeight: "calc(var(--u) * 172)" }}>
            {/* underneath: the date on cream paper */}
            <div
              className="pointer-events-none relative flex flex-col items-center justify-center px-3 text-center"
              style={{ minHeight: "calc(var(--u) * 172)", background: "radial-gradient(ellipse at 50% 40%, #fbe3c0 0%, #faddb5 60%, #f4d0a2 100%)" }}
            >
              <div
                className="flex flex-col items-center"
                style={{
                  // shown under the foil as soon as anything scratches it (the hint hand or the guest)
                  opacity: phase >= 2 || peek ? 1 : 0,
                  transform: phase >= 2 ? "scale(1.0)" : "scale(0.96)",
                  transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <p className="uppercase text-[#a8843f]" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "calc(var(--u) * 12)", letterSpacing: "0.3em", paddingLeft: "0.3em" }}>
                  Sunday
                </p>
                <div className="mt-1 flex items-center justify-center gap-3 text-[#6d0f1b]" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "calc(var(--u) * 42)", lineHeight: 1 }}>
                  <span>28</span>
                  <span className="text-[#b08a3e]" style={{ fontSize: "0.4em" }}>◆</span>
                  <span>02</span>
                  <span className="text-[#b08a3e]" style={{ fontSize: "0.4em" }}>◆</span>
                  <span>2027</span>
                </div>
                <p className="mt-2 italic text-[#7a1420]" style={{ fontFamily: SERIF, fontSize: "calc(var(--u) * 17)", letterSpacing: "0.04em" }}>
                  the twenty-eighth of February
                </p>
              </div>
            </div>

            {/* the scratch foil */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              aria-label="Scratch surface to reveal wedding date"
              className="absolute inset-0 z-[15] h-full w-full cursor-pointer touch-none select-none"
              style={{
                opacity: isRevealed ? 0 : 1,
                pointerEvents: isRevealed ? "none" : "auto",
                transition: "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />

            {/* fine gold dust while scratching */}
            {particles.map((p) => (
              <span
                key={p.id}
                className="pointer-events-none absolute rounded-full"
                style={{ left: `${p.x}px`, top: `${p.y}px`, width: `${p.size}px`, height: `${p.size}px`, backgroundColor: p.color, opacity: p.alpha, transform: "translate(-50%, -50%)" }}
              />
            ))}

            {/* hint hand: scratches a little by itself until the guest starts */}
            {!hasInteracted && !isRevealed && (
              <div ref={demoHandRef} className="pointer-events-none absolute left-0 top-0 z-20" style={{ opacity: 0, transition: "opacity 400ms ease" }} aria-hidden>
                <PointerHand size={22} />
              </div>
            )}
          </div>
        </div>

        {/* instruction */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[#b08a3e]">
          <Lotus className="h-3 w-3" />
          <p className="italic text-[#6d0f1b]" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "calc(var(--u) * 16.5)", letterSpacing: "0.05em" }}>
            {isRevealed ? "We can't wait to celebrate with you" : "Scratch to reveal"}
          </p>
          <Lotus className="h-3 w-3" />
        </div>

        {/* thin vine with a lotus */}
        <div className="mt-3">
          <VineRule />
        </div>
      </div>

      {/* a few marigold petals after the reveal */}
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="pointer-events-none absolute z-40"
          style={{
            left: `${petal.x}%`,
            top: `${petal.y}%`,
            width: `${petal.size}px`,
            height: `${petal.size * 0.7}px`,
            transform: `rotate(${petal.angle}deg)`,
            opacity: phase >= 3 ? 0 : petal.opacity,
            transition: phase >= 3 ? "opacity 800ms ease-out" : undefined,
          }}
        >
          <div className="h-full w-full rounded-[60%_40%_60%_40%]" style={{ backgroundColor: petal.color }} />
        </div>
      ))}
    </div>
  );
}
