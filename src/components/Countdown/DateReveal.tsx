import React, { useEffect, useRef, useState, useCallback } from "react";
import { weddingAudio } from "./weddingAudio";
import { sound } from "../../lib/sound";
import { triggerPartyPopper } from "./partyPopper";

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

/** Ceremonial scratch foil: deep-maroon silk, embossed paisley, antique-gold double border, lotus motif. */
function drawSilkFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gold = ctx.createLinearGradient(0, 0, w, 0);
  [[0, "#f0cf7a"], [0.3, "#c9963a"], [0.55, "#f6dd93"], [0.8, "#b8862f"], [1, "#e9c667"]].forEach(([o, c]) => gold.addColorStop(o as number, c as string));

  // golden base
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, "#d8a83e");
  base.addColorStop(0.35, "#e9c46a");
  base.addColorStop(0.65, "#d5a23a");
  base.addColorStop(1, "#c08b2a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // fine silk threads
  ctx.save();
  ctx.lineWidth = 0.6;
  for (let x = -h, i = 0; x < w + h; x += 3, i++) {
    ctx.strokeStyle = i % 2 ? "rgba(255,240,200,0.06)" : "rgba(120,80,10,0.07)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h * 0.6, h);
    ctx.stroke();
  }
  ctx.restore();

  // soft diagonal sheen
  ([[0.18, 0.1], [0.55, 0.07], [0.86, 0.09]] as const).forEach(([pos, a]) => {
    const g = ctx.createLinearGradient(w * pos - 60, 0, w * pos + 60, h);
    g.addColorStop(0, "rgba(255,215,190,0)");
    g.addColorStop(0.5, `rgba(255,215,190,${a})`);
    g.addColorStop(1, "rgba(255,215,190,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  // soft golden bokeh
  for (let i = 0; i < 26; i++) {
    const bx = ((i * 97) % 100) / 100 * w, by = ((i * 53) % 100) / 100 * h, br = 6 + ((i * 37) % 14);
    const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, "rgba(255,248,220,0.42)");
    bg.addColorStop(1, "rgba(255,248,220,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TAU);
    ctx.fill();
  }

  // embossed paisley lattice (shadow + highlight + body stroke)
  const stepX = 44, stepY = 40;
  for (let row = 0; row * stepY < h + stepY; row++) {
    for (let col = -1; col * stepX < w + stepX; col++) {
      const cx = col * stepX + (row % 2 ? stepX / 2 : 0) + 14;
      const cy = row * stepY + 16;
      const rot = row % 2 ? -0.5 : 0.5;
      ([[1, 1, "rgba(110,70,10,0.28)"], [-0.8, -0.8, "rgba(255,245,210,0.35)"], [0, 0, "rgba(150,100,25,0.35)"]] as const).forEach(([dx, dy, stroke]) => {
        ctx.save();
        ctx.translate(cx + dx, cy + dy);
        ctx.rotate(rot);
        paisleyPath(ctx, 10);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  // depth: soft vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.62);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(110,70,10,0.28)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // antique-gold double border with small corner roundels
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(11, 11, w - 22, h - 22);
  ctx.fillStyle = gold;
  [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, TAU);
    ctx.fill();
  });
  ctx.restore();

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

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[430px] cursor-default select-none overflow-hidden rounded-3xl border-2 border-[#D4AF37]/60 shadow-[0_12px_45px_rgba(109,15,27,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)]"
      style={{
        boxShadow: "0 calc(var(--u) * 16) calc(var(--u) * 48) calc(var(--u) * -8) rgba(109,15,27,0.22), 0 0 0 1px rgba(212,175,55,0.35)",
      }}
    >
      {/* Background Soft Peach Watercolor Sky matching the website theme */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#F8DFBF]"
        style={{
          backgroundImage: `url("/bg/mandap-sky.jpg"), radial-gradient(ellipse at 50% 0%, #FFF8EE 0%, #FDEBD1 25%, #F8DFBF 60%, #EFE0C1 100%)`,
          backgroundSize: "100% auto, 100% 100%",
          backgroundRepeat: "repeat-y, no-repeat",
          backgroundPosition: "center top, center center",
        }}
      />

      {/* Outer frame refinement: inner gold hairline + corner flourishes */}
      <div className="pointer-events-none absolute inset-[5px] z-20 rounded-[1.25rem] border border-[#D4AF37]/45" />
      <Flourish className="left-[7px] top-[7px] z-20" />
      <Flourish className="right-[7px] top-[7px] z-20 -scale-x-100" />
      <Flourish className="bottom-[7px] left-[7px] z-20 -scale-y-100" />
      <Flourish className="bottom-[7px] right-[7px] z-20 -scale-100" />

      {/* TOP PEACOCK FLORAL BORDER STRIP */}
      <div className="relative w-full overflow-hidden border-b border-[#B8862F]/60" style={{ background: "linear-gradient(180deg,#F6DD93 0%,#E2B24F 55%,#EFCB73 100%)" }}>
        <img
          src="/border/peacock-border.png"
          alt="Traditional Royal Maharashtrian Peacock Floral Border"
          className="w-full object-cover object-center h-16"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#8A5A12] to-transparent" />
        <span className="pointer-events-none absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-[#8A5A12] bg-[#E2B24F]" />
      </div>

      {/* sound is controlled by the speaker button at the top-left of the screen */}

      {/* CARD CONTENT HEADER */}
      <div className="relative z-10 px-5 pt-4 pb-0 text-center">
        <h2
          className="font-bold uppercase text-[#6d0f1b]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: "calc(var(--u) * 30)", letterSpacing: "0.3em", paddingLeft: "0.3em", lineHeight: 1.1, fontWeight: 700 }}
        >
          Save The Date
        </h2>
        {/* traditional gold divider */}
        <svg viewBox="0 0 180 14" className="mx-auto mt-1.5 h-3.5 w-44 text-[#B8862F]" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden>
          <path d="M6 7h62M112 7h62" strokeWidth="0.9" />
          <path d="M44 7h24M112 7h24" strokeWidth="0.9" />
          <path d="M90 1.5l5.5 5.5L90 12.5 84.5 7z" fill="currentColor" strokeWidth="0.6" />
          <circle cx="76" cy="7" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="104" cy="7" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {/* ========================================================= */}
      {/* SCRATCH CARD CONTAINER (Deep Vermilion with Gold Frame)   */}
      {/* ========================================================= */}
      <div className="relative mx-auto mt-1 w-[92%] max-w-[370px]">
        {/* Royal Ornate Frame with Bracket Corners */}
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-[#C9963A] bg-gradient-to-b from-[#7d1626] via-[#5e0d1a] to-[#430911] p-1.5 shadow-[0_14px_30px_-8px_rgba(60,8,16,0.55),0_2px_6px_rgba(60,8,16,0.35),inset_0_1px_3px_rgba(255,236,180,0.45),inset_0_-2px_6px_rgba(0,0,0,0.35)]"
          style={{
            minHeight: "calc(var(--u) * 150)",
          }}
        >
          {/* Inner gold hairline + refined corners (kept above the foil so they stay after the reveal) */}
          <div className="pointer-events-none absolute inset-[5px] z-20 rounded-xl border border-[#E2B24F]/60" />
          <Flourish className="left-[7px] top-[7px] z-20 h-5 w-5 text-[#E2B24F]" />
          <Flourish className="right-[7px] top-[7px] z-20 h-5 w-5 -scale-x-100 text-[#E2B24F]" />
          <Flourish className="bottom-[7px] left-[7px] z-20 h-5 w-5 -scale-y-100 text-[#E2B24F]" />
          <Flourish className="bottom-[7px] right-[7px] z-20 h-5 w-5 -scale-100 text-[#E2B24F]" />

          {/* ======================================================= */}
          {/* UNDERNEATH LAYER: ONLY THE SACRED WEDDING DATE          */}
          {/* ======================================================= */}
          <div
            className="pointer-events-none relative flex h-full min-h-[136px] flex-col items-center justify-center rounded-xl px-3 py-4 text-center bg-[#FAF0DF]"
            style={{
              backgroundImage: `url("/bg/mandap-sky.jpg"), radial-gradient(ellipse at 50% 30%, #FFF8EE 0%, #FDEBD1 40%, #F8DFBF 100%)`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          >
            {/* Revealed Date Content: ONLY the wedding date (scale 0.96 to 1.0, 900ms) */}
            <div
              className="relative z-10 flex flex-col items-center justify-center transition-all"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? "scale(1.0)" : "scale(0.96)",
                transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* Auspicious Shubh Vivah Date */}
              <div className="flex items-center justify-center gap-3">
                <span className="font-serif text-4xl font-bold tracking-wider text-[#6d0f1b]">
                  28
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-4xl font-bold tracking-wider text-[#6d0f1b]">
                  02
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-4xl font-bold tracking-wider text-[#6d0f1b]">
                  2027
                </span>
              </div>

              <p className="mt-1 font-serif text-xs font-semibold tracking-[0.25em] text-[#8E1726] uppercase">
                28 February 2027
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* INTERACTIVE SCRATCH CANVAS (Dissolves over 600ms)       */}
          {/* ======================================================= */}
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

          {/* Sparkling Scratch Particles (Subtle gold dust, max 4 flakes) */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.alpha,
                boxShadow: `0 0 calc(var(--u) * 4) ${p.color}`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Tiny hand hint: rubs back and forth over the foil until the guest starts scratching */}
          {!hasInteracted && !isRevealed && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" aria-hidden>
              <div className="relative h-8 w-24">
                <span className="absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full" style={{ background: "repeating-linear-gradient(90deg, rgba(246,221,147,0.75) 0 calc(var(--u) * 4), transparent calc(var(--u) * 4) calc(var(--u) * 9))" }} />
                <div className="absolute left-0 top-0" style={{ animation: "scratch-hand 1.6s ease-in-out infinite" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ width: "calc(var(--u) * 26)", height: "calc(var(--u) * 26)", filter: "drop-shadow(0 calc(var(--u) * 2) calc(var(--u) * 4) rgba(0,0,0,0.55)) drop-shadow(0 0 calc(var(--u) * 6) rgba(255,235,160,0.8))" }}>
                    <path
                      d="M12 2a1.5 1.5 0 0 0-1.5 1.5v7.2l-1.3-1.3a1.5 1.5 0 0 0-2.1 0 1.5 1.5 0 0 0 0 2.1l3.5 3.5c1 1 2.2 1.7 3.5 1.7h2.4a4.5 4.5 0 0 0 4.5-4.5V9.5a1.5 1.5 0 0 0-3 0v1a1.5 1.5 0 0 0-3 0V9a1.5 1.5 0 0 0-3 0v-5.5A1.5 1.5 0 0 0 12 2z"
                      fill="#FFFDF7"
                      stroke="#6d0f1b"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3-5 SOFTLY DRIFTING MARIGOLD PETALS (Celebration) */}
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
          {/* Stylized Marigold Petal Shape */}
          <div
            className="h-full w-full rounded-[60%_40%_60%_40%]"
            style={{
              backgroundColor: petal.color,
              boxShadow: "0 calc(var(--u) * 2) calc(var(--u) * 4) rgba(0,0,0,0.15)",
              backgroundImage: "radial-gradient(ellipse at 30% 30%, #FFE082, transparent 70%)",
            }}
          />
        </div>
      ))}

      {/* FOOTER: Scratch to reveal */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-3 pb-3 text-center">
        {!isRevealed ? (
          <div className="flex items-center gap-2.5 text-[#B8862F]">
            <Lotus className="h-4 w-4" />
            <p
              className="text-[#6d0f1b]"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: "italic", fontWeight: 600, fontSize: "calc(var(--u) * 20)", letterSpacing: "0.06em", lineHeight: 1.2 }}
            >
              Scratch to reveal
            </p>
            <Lotus className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="text-[#D4AF37]">✦</span>
            <p className="font-serif text-sm font-bold tracking-wider text-[#6d0f1b]">
              Save the Date · 28 February 2027
            </p>
            <span className="text-[#D4AF37]">✦</span>
          </div>
        )}
      </div>

      {/* BOTTOM BORDER: same artwork turned over and mirrored, with a scalloped gold edge and a lotus */}
      <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#F6DD93 0%,#E2B24F 55%,#EFCB73 100%)" }}>
        <svg className="relative block h-3.5 w-full text-[#8A5A12]" aria-hidden>
          <defs>
            <pattern id="dr-scallop" width="22" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 14Q11-3 22 14" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="11" cy="9.5" r="1.1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="14" fill="url(#dr-scallop)" />
        </svg>
        <span className="pointer-events-none absolute left-1/2 top-0 z-10 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-b-full bg-[#E2B24F] text-[#6D0F1B]">
          <Lotus className="h-4 w-4" />
        </span>
        <img
          src="/border/peacock-border.png"
          alt="Traditional Royal Maharashtrian Peacock Floral Border"
          className="w-full object-cover object-center h-14"
          style={{ transform: "scale(-1, -1)" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
