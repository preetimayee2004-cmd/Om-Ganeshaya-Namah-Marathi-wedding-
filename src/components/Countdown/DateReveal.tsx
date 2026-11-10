import React, { useEffect, useRef, useState, useCallback } from "react";
import { wedding } from "../../config/wedding";
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

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface DateRevealProps {
  onRevealed?: () => void;
}

export default function DateReveal({ onRevealed }: DateRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isScratchingRef = useRef(false);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [phase, setPhase] = useState<number>(0); // 0: initial, 1: dissolving, 2: date scale, 3: petals/diyas, 4: settled
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [petals, setPetals] = useState<Petal[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

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

  // Calculate Cleared Percentage
  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const sampleSize = 12; // Sample every 12 pixels for fast 60fps checks
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
    setScratchPercent(pct);

    // Threshold reached: trigger cinematic celebration
    if (pct >= 38 && !isRevealed) {
      triggerCelebration();
    }
  }, [isRevealed]);

  // Trigger Full Cinematic Celebration Sequence
  const triggerCelebration = useCallback(() => {
    if (isRevealed) return;
    setIsRevealed(true);
    setPhase(1); // 0.0s - 0.5s: Dissolving remaining texture

    if (onRevealed) onRevealed();

    // 0.0s: Spawn gold particle scatter burst from remaining surface
    const burstParticles: Particle[] = [];
    const colors = ["#FFD700", "#FFECB4", "#E2A84B", "#FFFFFF", "#F6D98A"];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      burstParticles.push({
        id: i,
        x: 180 + Math.cos(angle) * (Math.random() * 80),
        y: 65 + Math.sin(angle) * (Math.random() * 35),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        alpha: 1,
        life: 1,
      });
    }
    setParticles(burstParticles);

    // 0.5s: Mandala forms behind the date + Shimmer chime
    setTimeout(() => {
      setPhase(2);
      weddingAudio.playMandalaShimmer();
    }, 500);

    // 1.5s: Date scale-up with golden glow + Melodious Shehnai wedding flourish
    setTimeout(() => {
      setPhase(3);
      weddingAudio.playShehnaiFlourish();

      // Spawn falling marigold petals
      const newPetals: Petal[] = [];
      const petalColors = ["#FFA000", "#FFB300", "#FF8F00", "#E65100", "#F57C00"];
      for (let i = 0; i < 24; i++) {
        newPetals.push({
          id: i,
          x: Math.random() * 100, // percentage
          y: -10 - Math.random() * 40,
          speed: 1.2 + Math.random() * 1.8,
          angle: Math.random() * 360,
          spin: (Math.random() - 0.5) * 4,
          size: 14 + Math.random() * 12,
          color: petalColors[i % petalColors.length],
          opacity: 0.85 + Math.random() * 0.15,
        });
      }
      setPetals(newPetals);
    }, 1500);

    // 3.5s: All animations settle permanently
    setTimeout(() => {
      setPhase(4);
    }, 3500);
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

    if (!hasInteracted) {
      setHasInteracted(true);
      weddingAudio.playTempleBell();
    }

    weddingAudio.playScratchSound();

    // Create soft expanding gold touch ripple
    if (Math.random() < 0.25) {
      setRipples((prev) => [...prev.slice(-4), { id: Date.now() + Math.random(), x, y, size: 24 }]);
    }

    // Spawn tiny golden scratch flakes
    if (Math.random() < 0.35) {
      setParticles((prev) => [
        ...prev.slice(-30),
        {
          id: Date.now() + Math.random(),
          x,
          y,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2 - 0.5,
          size: 2 + Math.random() * 3,
          color: "#E2A84B",
          alpha: 1,
          life: 0.6,
        },
      ]);
    }

    // Erase smooth progressive path
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const brushRadius = rect.width < 360 ? 26 : 32;

    if (lastPoint.current) {
      // Connect line between previous and current touch point
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

    if (strokeCount.current % 6 === 0) {
      checkScratchPercentage();
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = true;
    setIsScratching(true);
    lastPoint.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isScratchingRef.current = false;
    setIsScratching(false);
    lastPoint.current = null;
    checkScratchPercentage();
  };

  // Touch Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isScratchingRef.current = true;
      setIsScratching(true);
      lastPoint.current = null;
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current || e.touches.length !== 1) return;
    // Prevent page scrolling while actively scratching the card
    e.preventDefault();
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    isScratchingRef.current = false;
    setIsScratching(false);
    lastPoint.current = null;
    checkScratchPercentage();
  };

  // Particle & Petal Animation Loop
  useEffect(() => {
    let active = true;

    const loop = () => {
      // Animate Sparkle Particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08, // gravity
            alpha: p.alpha - 0.025,
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0 && p.alpha > 0)
      );

      // Animate Falling Marigold Petals
      setPetals((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speed * 0.45,
            x: p.x + Math.sin(p.angle * (Math.PI / 180)) * 0.25,
            angle: p.angle + p.spin,
          }))
          .filter((p) => p.y < 120) // remove after leaving container
      );

      // Clean up Ripples
      setRipples((prev) =>
        prev
          .map((r) => ({ ...r, size: r.size + 1.8 }))
          .filter((r) => r.size < 70)
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

      {/* AUDIO MUTE / UNMUTE FLOATING PILL */}
      <button
        onClick={handleToggleMute}
        aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
        className="group absolute right-3.5 top-16 z-30 flex items-center gap-1 rounded-full border border-[#D4AF37]/50 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#6d0f1b] shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/90 active:scale-95"
      >
        <span>{isMuted ? "🔇" : "🔔"}</span>
        <span className="font-serif text-[11px] tracking-wider">
          {isMuted ? "Muted" : "Sound"}
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
          {/* UNDERNEATH LAYER: THE REVEALED SACRED WEDDING DATE      */}
          {/* ======================================================= */}
          <div className="relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#FFFDF9] via-[#FCF5E8] to-[#F7EBD2] px-3 py-4 text-center">
            {/* Traditional Gold Marathi Wedding Mandala (Forming on Reveal) */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-1000"
              style={{
                opacity: phase >= 2 ? (phase >= 4 ? 0.35 : 0.65) : 0,
                transform: phase >= 2 ? "scale(1)" : "scale(0.7)",
              }}
            >
              <svg viewBox="0 0 200 200" className="h-44 w-44 text-[#C9963A]">
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="470"
                  strokeDashoffset={phase >= 2 ? "0" : "470"}
                  style={{ transition: "stroke-dashoffset 1200ms ease-in-out" }}
                />
                <circle
                  cx="100"
                  cy="100"
                  r="55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray="350"
                  strokeDashoffset={phase >= 2 ? "0" : "350"}
                  style={{ transition: "stroke-dashoffset 1000ms ease-in-out 200ms" }}
                />
                {/* Radiating 12 Lotus Petals */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <path
                    key={deg}
                    d="M100 25 C108 50 115 65 100 85 C85 65 92 50 100 25 Z"
                    fill="rgba(212,175,55,0.18)"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    transform={`rotate(${deg} 100 100)`}
                  />
                ))}
              </svg>
            </div>

            {/* Brass Diyas at Left and Right (Flickering on celebration) */}
            <div
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-opacity duration-700"
              style={{ opacity: phase >= 3 ? 1 : 0.2 }}
            >
              <div className="relative">
                {/* Diya Flame */}
                <div
                  className="mx-auto h-2.5 w-1.5 rounded-full bg-gradient-to-t from-[#FF8F00] to-[#FFF176] shadow-[0_0_10px_#FFA000]"
                  style={{ animation: phase >= 3 ? "mm-flame 1.2s ease-in-out infinite" : "none" }}
                />
                {/* Diya Base */}
                <svg viewBox="0 0 24 16" className="h-3 w-5 text-[#C9963A]" fill="currentColor">
                  <path d="M2 6 C6 16 18 16 22 6 C17 8 7 8 2 6 Z" />
                </svg>
              </div>
            </div>

            <div
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-700"
              style={{ opacity: phase >= 3 ? 1 : 0.2 }}
            >
              <div className="relative">
                {/* Diya Flame */}
                <div
                  className="mx-auto h-2.5 w-1.5 rounded-full bg-gradient-to-t from-[#FF8F00] to-[#FFF176] shadow-[0_0_10px_#FFA000]"
                  style={{ animation: phase >= 3 ? "mm-flame 1.2s ease-in-out 0.3s infinite" : "none" }}
                />
                {/* Diya Base */}
                <svg viewBox="0 0 24 16" className="h-3 w-5 text-[#C9963A]" fill="currentColor">
                  <path d="M2 6 C6 16 18 16 22 6 C17 8 7 8 2 6 Z" />
                </svg>
              </div>
            </div>

            {/* Revealed Date Content (Scale-up + Golden Glow) */}
            <div
              className="relative z-10 transition-all duration-700"
              style={{
                transform: phase >= 3 ? "scale(1)" : phase >= 2 ? "scale(0.92)" : "scale(0.88)",
                filter: phase >= 3 ? "drop-shadow(0 0 12px rgba(212,175,55,0.5))" : "none",
              }}
            >
              {/* Auspicious Shubh Vivah Date */}
              <div className="flex items-center justify-center gap-2">
                <span className="font-serif text-3xl font-bold tracking-wider text-[#6d0f1b] sm:text-4xl">
                  28
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-3xl font-bold tracking-wider text-[#6d0f1b] sm:text-4xl">
                  02
                </span>
                <span className="text-[#a8741a] text-xl font-serif">♦</span>
                <span className="font-serif text-3xl font-bold tracking-wider text-[#6d0f1b] sm:text-4xl">
                  2027
                </span>
              </div>

              {/* Day & Muhurat */}
              <p className="mt-1 font-serif text-xs font-bold tracking-[0.25em] text-[#8E1726] uppercase">
                Sunday · रविवार
              </p>

              <p lang="mr" className="mt-0.5 font-marathi text-[11px] font-semibold text-[#4B0A13]">
                शुभमुहूर्त: सकाळी ११:३० वा.
              </p>

              <p className="mt-0.5 font-serif text-[11px] italic text-[#6d0f1b]/80">
                Shree Mangal Karyalaya, Pune
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* INTERACTIVE SCRATCH CANVAS (Disappears on threshold)    */}
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
            className="absolute inset-0 h-full w-full cursor-pointer touch-none select-none transition-opacity duration-500"
            style={{
              opacity: isRevealed ? 0 : 1,
              pointerEvents: isRevealed ? "none" : "auto",
            }}
          />

          {/* Sparkling Scratch Particles */}
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
                boxShadow: `0 0 6px ${p.color}`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Golden Interaction Ripples */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className="pointer-events-none absolute rounded-full border border-[#FFE8A3] bg-[#FFD700]/20"
              style={{
                left: `${r.x}px`,
                top: `${r.y}px`,
                width: `${r.size}px`,
                height: `${r.size}px`,
                transform: "translate(-50%, -50%)",
                opacity: Math.max(0, 1 - r.size / 70),
                transition: "width 250ms ease-out, height 250ms ease-out, opacity 250ms ease-out",
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

      {/* FALLING MARIGOLD PETALS SHOWER (Celebration) */}
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
            opacity: petal.opacity,
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
