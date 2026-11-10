import React, { useEffect, useRef, useState, useCallback } from "react";
import { weddingAudio } from "./weddingAudio";

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

export default function DateReveal({ onRevealed }: DateRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isScratchingRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const lastParticleTime = useRef(0);
  const lastCheckTime = useRef(0);

  const [isRevealed, setIsRevealed] = useState(false);
  const [phase, setPhase] = useState<number>(0); // 0: initial, 1: dissolving (600ms), 2: date/mandala (900ms-1500ms), 3: settled
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [petals, setPetals] = useState<Petal[]>([]);

  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Toggle audio
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    weddingAudio.setMuted(next);
  };

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

    // Rich Vermilion Red to Deep Royal Maroon Gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#8E1726");
    grad.addColorStop(0.5, "#6D0F1B");
    grad.addColorStop(1, "#520912");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Traditional Paithani Gold Watermark Pattern
    ctx.save();
    ctx.strokeStyle = "rgba(235, 192, 105, 0.22)";
    ctx.lineWidth = 1;

    // Geometric Diamond / Paisley Weave Lattice
    const step = 28;
    for (let x = 0; x < w + step; x += step) {
      for (let y = 0; y < h + step; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Inner Antique Gold Ornate Border
    ctx.strokeStyle = "rgba(226, 178, 79, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.strokeStyle = "rgba(255, 236, 180, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(12, 12, w - 24, h - 24);

    // Delicate Subtle Gold Center Accent on Scratch Foil
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 236, 180, 0.35)";
    ctx.font = "14px serif";
    ctx.fillText("❖", w / 2, h / 2);

    ctx.restore();
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (!isRevealed) initCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas, isRevealed]);

  // Calculate Cleared Percentage (fast 20px sampling to eliminate frame drops)
  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const now = performance.now();
    if (now - lastCheckTime.current < 150) return;
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

    // Threshold reached: trigger cinematic celebration
    if (pct >= 36 && !isRevealed) {
      triggerCelebration();
    }
  }, [isRevealed]);

  // Trigger Refined Celebration Sequence
  const triggerCelebration = useCallback(() => {
    if (isRevealed) return;
    setIsRevealed(true);
    setPhase(1); // 0ms: Dissolving remaining texture over 600ms

    if (onRevealed) onRevealed();

    // Clear scratch dust particles
    setParticles([]);

    // 200ms: As surface dissolves, date becomes visible + gentle Shehnai flourish + mandala draws
    setTimeout(() => {
      setPhase(2);
      weddingAudio.playShehnaiFlourish();

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

    if (strokeCount.current % 12 === 0) {
      checkScratchPercentage();
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = true;
    lastPoint.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isScratchingRef.current = false;
    lastPoint.current = null;
    checkScratchPercentage();
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
    checkScratchPercentage();
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
      className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-3xl border-2 border-[#D4AF37]/60 bg-[#FFFDF7] shadow-[0_12px_45px_rgba(109,15,27,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)]"
      style={{
        boxShadow: "0 16px 48px -8px rgba(109,15,27,0.22), 0 0 0 1px rgba(212,175,55,0.35)",
      }}
    >
      {/* Background Vintage Royal Parchment Texture with Subtle Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFFDF7] via-[#FAF3E4] to-[#F5EAD4] opacity-90" />

      {/* TOP PEACOCK FLORAL BORDER STRIP */}
      <div className="relative w-full overflow-hidden border-b border-[#D4AF37]/35 bg-[#FFFDF7]">
        <img
          src="/border/peacock-border.png"
          alt="Traditional Royal Maharashtrian Peacock Floral Border"
          className="h-14 w-full object-cover object-center sm:h-16"
          draggable={false}
        />
      </div>

      {/* TINY CORNER BELL AUDIO BUTTON */}
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
        title={isMuted ? "Unmute sound" : "Mute sound"}
        className="group absolute right-3.5 top-3 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-white/85 text-[#6d0f1b] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95"
      >
        <span className="text-xs leading-none select-none">
          {isMuted ? "🔇" : "🔔"}
        </span>
      </button>

      {/* CARD CONTENT HEADER */}
      <div className="relative z-10 px-5 pt-5 pb-2 text-center">
        {/* SAVE THE DATE Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] text-[#6d0f1b] uppercase">
          Save The Date
        </h2>
        {/* Delicate Golden Divider */}
        <div className="mx-auto mt-2 flex items-center justify-center gap-2">
          <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
          <span className="text-[#D4AF37] text-xs">❖</span>
          <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCRATCH CARD CONTAINER (Deep Vermilion with Gold Frame)   */}
      {/* ========================================================= */}
      <div className="relative mx-auto mt-2 w-[92%] max-w-[370px]">
        {/* Royal Ornate Frame with Bracket Corners */}
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#871724] via-[#6d0f1b] to-[#4A0A13] p-1.5 shadow-[0_8px_30px_rgba(75,10,18,0.35),inset_0_1px_3px_rgba(255,236,180,0.4)]"
          style={{
            minHeight: "150px",
          }}
        >
          {/* Inner Golden Beaded Double Rule */}
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#FFECB4]/40" />

          {/* Golden Corner Floral Ornaments */}
          <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#FFE8A3]" />
          <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#FFE8A3]" />
          <div className="pointer-events-none absolute left-2 bottom-2 h-4 w-4 border-l-2 border-b-2 border-[#FFE8A3]" />
          <div className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2 border-[#FFE8A3]" />

          {/* ======================================================= */}
          {/* UNDERNEATH LAYER: ONLY THE SACRED WEDDING DATE          */}
          {/* ======================================================= */}
          <div className="relative flex h-full min-h-[136px] flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#FFFDF9] via-[#FCF5E8] to-[#F7EBD2] px-3 py-4 text-center">
            {/* Delicate Traditional Marathi Wedding Mandala */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                opacity: phase >= 2 ? 0.38 : 0,
                transition: "opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <svg viewBox="0 0 200 200" className="h-44 w-44 text-[#C9963A]">
                {/* Outer Ring (1.5s stroke drawing) */}
                <circle
                  cx="100"
                  cy="100"
                  r="72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="453"
                  strokeDashoffset={phase >= 2 ? "0" : "453"}
                  style={{ transition: "stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
                {/* Inner Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray="327"
                  strokeDashoffset={phase >= 2 ? "0" : "327"}
                  style={{ transition: "stroke-dashoffset 1300ms cubic-bezier(0.22, 1, 0.36, 1) 200ms" }}
                />
                {/* 12 Auspicious Lotus Petals */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <path
                    key={deg}
                    d="M100 28 C107 50 114 65 100 84 C86 65 93 50 100 28 Z"
                    fill="rgba(212,175,55,0.12)"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    transform={`rotate(${deg} 100 100)`}
                    style={{
                      opacity: phase >= 2 ? 1 : 0,
                      transition: `opacity 1000ms cubic-bezier(0.22, 1, 0.36, 1) ${300 + (deg / 30) * 40}ms`,
                    }}
                  />
                ))}
              </svg>
            </div>

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
              <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-[#6d0f1b]">
                  28
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-[#6d0f1b]">
                  02
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-[#6d0f1b]">
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
            className="absolute inset-0 h-full w-full cursor-pointer touch-none select-none"
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
                boxShadow: `0 0 4px ${p.color}`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Animated Finger Scratch / Tap Hint over Scratch Box */}
          {!hasInteracted && !isRevealed && (
            <div
              className="pointer-events-none absolute right-4 sm:right-8 top-1/2 z-20 -translate-y-1/2 flex items-center gap-1.5 transition-opacity duration-300"
            >
              <div className="relative flex items-center justify-center">
                {/* Expanding glowing touch ripple ring */}
                <span className="absolute -left-1 -top-1 h-6 w-6 rounded-full border-2 border-[#FFE8A3] animate-ping opacity-75" />
                {/* Finger pointer icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-[#FFE8A3] drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] animate-bounce"
                  fill="currentColor"
                >
                  <path d="M9 11.25V6.5a1.5 1.5 0 0 1 3 0v4.75m0 0V3.5a1.5 1.5 0 0 1 3 0v7.75m0 0V5.5a1.5 1.5 0 0 1 3 0v6.25m0 0a1.5 1.5 0 0 1 3 0v3.25a7 7 0 0 1-7 7H12a7 7 0 0 1-5.6-2.8l-3.2-4.4a1.5 1.5 0 0 1 2.4-1.8L7 15.5V11.25a1.5 1.5 0 0 1 2 0z" />
                </svg>
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
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              backgroundImage: "radial-gradient(ellipse at 30% 30%, #FFE082, transparent 70%)",
            }}
          />
        </div>
      ))}

      {/* FOOTER: Scratch to reveal */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-3 pb-3 text-center">
        {!isRevealed ? (
          <div className="flex items-center gap-2 text-[#6d0f1b]">
            <svg
              className="h-4 w-4 text-[#8E1726] animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 11.25V6.5a1.5 1.5 0 0 1 3 0v4.75m0 0V3.5a1.5 1.5 0 0 1 3 0v7.75m0 0V5.5a1.5 1.5 0 0 1 3 0v6.25m0 0a1.5 1.5 0 0 1 3 0v3.25a7 7 0 0 1-7 7H12a7 7 0 0 1-5.6-2.8l-3.2-4.4a1.5 1.5 0 0 1 2.4-1.8L7 15.5V11.25a1.5 1.5 0 0 1 2 0z" />
            </svg>
            <p className="font-serif text-sm sm:text-base italic font-semibold tracking-wider text-[#6d0f1b]">
              Scratch to reveal
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="text-[#D4AF37]">✦</span>
            <p className="font-serif text-xs sm:text-sm font-bold tracking-wider text-[#6d0f1b]">
              Save the Date · 28 February 2027
            </p>
            <span className="text-[#D4AF37]">✦</span>
          </div>
        )}
      </div>

      {/* BOTTOM PEACOCK FLORAL BORDER STRIP (INVERTED/MIRRORED) */}
      <div className="relative w-full overflow-hidden border-t border-[#D4AF37]/35 bg-[#FFFDF7]">
        <img
          src="/border/peacock-border.png"
          alt="Traditional Royal Maharashtrian Peacock Floral Border"
          className="h-12 w-full object-cover object-center sm:h-14"
          style={{ transform: "scaleY(-1)" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
