import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

type Photo = (typeof wedding.gallery)[number];

// ===== ANTARPAT REVEAL TIMING (ms after the section comes into view) =====
const T_REVEAL = 1500; // couple photo starts to fade in while the curtains are still parting
const T_STRIP = 3700; // remaining photos slide out into the film strip
const T_SETTLED = 4800; // animation finished: carousel becomes swipeable
const AUTO_MS = 3200; // auto-slide: time each photo stays in the centre
const AUTO_PAUSE_MS = 6000; // auto-slide waits this long after the visitor touches / drags the strip
const HERO_INDEX = 2; // which photo in `wedding.gallery` is the hero

const tones: Record<string, string> = {
  wine: "linear-gradient(160deg,#722B35,#3d161c)",
  olive: "linear-gradient(160deg,#7d8864,#4a5339)",
  blush: "linear-gradient(160deg,#F1D9CF,#E8C9BE)",
  gold: "linear-gradient(160deg,#d9b872,#a8843f)",
};

function Tile({ p, className = "", fit = "cover" }: { p: Photo; className?: string; fit?: "cover" | "contain" }) {
  if (p.src) {
    return (
      <img
        src={p.src}
        alt={p.alt}
        loading="lazy"
        draggable={false}
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={p.alt}
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ background: tones[p.tone] ?? tones.gold }}
    />
  );
}

/** Gold mandap frame: pillars, lintel with Ganesh medallion and stationary garlands (viewBox 400 x 400). */
function MandapFrame() {
  const garlandTop = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const x = 30 + i * 9.7;
        const t = (x - 30) / 340;
        const y = 45 + Math.sin(t * Math.PI) * 5;
        return { x, y, rose: i % 5 === 2 };
      }),
    [],
  );
  const garlandSide = useMemo(
    () =>
      Array.from({ length: 41 }, (_, i) => ({ y: 52 + i * 8.4, rose: i % 6 === 3, off: i % 2 ? 2.2 : -2.2 })),
    [],
  );
  const Bloom = ({ x, y, rose }: { x: number; y: number; rose: boolean }) =>
    rose ? (
      <g>
        <circle cx={x} cy={y} r="6" fill="#B3122A" stroke="#6f0a1a" strokeWidth=".6" />
        <path d={`M${x - 3} ${y} a3 3 0 1 1 3 3 a1.6 1.6 0 1 1 -1.6 -1.6`} fill="none" stroke="#e8586d" strokeWidth=".7" />
      </g>
    ) : (
      <circle cx={x} cy={y} r="4.1" fill="#FFF8E8" stroke="#dccaa0" strokeWidth=".5" />
    );
  return (
    <svg viewBox="0 0 400 400" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="gal-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#8c6320" />
          <stop offset=".35" stopColor="#f0d27c" />
          <stop offset=".65" stopColor="#b98a2e" />
          <stop offset="1" stopColor="#f6e1a0" />
        </linearGradient>
        <linearGradient id="gal-gold-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e1a0" />
          <stop offset=".5" stopColor="#c99a37" />
          <stop offset="1" stopColor="#8c6320" />
        </linearGradient>
        <linearGradient id="gal-shine-g" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="gal-rail-clip">
          <rect x="22" y="27" width="356" height="12" rx="3" />
          <rect x="6" y="20" width="12" height="376" rx="3" />
          <rect x="382" y="20" width="12" height="376" rx="3" />
        </clipPath>
      </defs>

      {/* pillars + kalash finials */}
      {[12, 388].map((x) => (
        <g key={x}>
          <rect x={x - 6} y="20" width="12" height="376" rx="3" fill="url(#gal-gold)" stroke="#7a5518" strokeWidth=".8" />
          <ellipse cx={x} cy="16" rx="9" ry="10" fill="url(#gal-gold-h)" stroke="#7a5518" strokeWidth=".8" />
          <path d={`M${x} 2 l3 7 h-6z`} fill="#e8c76a" stroke="#7a5518" strokeWidth=".6" />
          <rect x={x - 9} y="388" width="18" height="8" rx="2" fill="url(#gal-gold-h)" stroke="#7a5518" strokeWidth=".6" />
        </g>
      ))}

      {/* lintel */}
      <rect x="22" y="27" width="356" height="12" rx="3" fill="url(#gal-gold-h)" stroke="#7a5518" strokeWidth=".8" />
      <path d="M22 41 q10 8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#c99a37" strokeWidth="1.2" opacity=".9" />
      {/* Ganesh medallion */}
      <g transform="translate(200 33)">
        <path d="M-34 6 q0 -22 34 -22 q34 0 34 22 q-34 8 -68 0z" fill="url(#gal-gold-h)" stroke="#7a5518" strokeWidth=".8" />
        <circle cx="0" cy="-3" r="13" fill="#fbf1d6" stroke="#b98a2e" strokeWidth="1" />
        <path d="M0 -13 c4 3 6 9 3 14 c-2 3 -5 4 -3 9 M0 -13 c-4 3 -6 9 -3 14 c2 3 5 4 3 9" fill="none" stroke="#a8782a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="-5" cy="-3" r="1" fill="#a8782a" />
        <circle cx="5" cy="-3" r="1" fill="#a8782a" />
      </g>

      {/* stationary garlands */}
      {garlandTop.map((g, i) => (i > 14 && i < 22 ? null : <Bloom key={`t${i}`} x={g.x} y={g.y} rose={g.rose} />))}
      {[12, 388].flatMap((x) =>
        garlandSide.map((g, i) => <Bloom key={`${x}-${i}`} x={x + g.off} y={g.y} rose={g.rose} />),
      )}

      {/* golden shimmer sweeping over the gold */}
      <g clipPath="url(#gal-rail-clip)">
        <rect className="gal-shine" x="-60" y="0" width="60" height="400" fill="url(#gal-shine-g)" transform="skewX(-20)" />
      </g>
    </svg>
  );
}

function Curtain({ side, open }: { side: "left" | "right"; open: boolean }) {
  return (
    <div className={`gal-curtain ${side} ${open ? "open" : ""}`} aria-hidden>
      <div className="gal-silk">
        <div className="gal-inner-edge" />
        <div className="gal-hem" />
      </div>
    </div>
  );
}

export default function Gallery() {
  const photos = wedding.gallery;
  const [index, setIndex] = useState<number | null>(null);
  const [box, setBox] = useState<React.CSSProperties>({});
  const scroller = useScrollRoot();
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // ---------- Antarpat reveal state ----------
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [phase, setPhase] = useState(0); // 0 closed, 1 curtains opening, 2 hero revealed, 3 film strip
  const [settled, setSettled] = useState(false);
  const [active, setActive] = useState(Math.min(HERO_INDEX, photos.length - 1));
  const phaseRef = useRef(0);
  const activeRef = useRef(active);
  const drag = useRef({ down: false, moved: false, x: 0, left: 0 });
  const pausedUntil = useRef(0);
  const inView = useRef(false);

  // start automatically when the section scrolls into view
  useEffect(() => {
    const el = stageRef.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { root: scroller ?? null, threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scroller, seen]);

  // timeline
  useEffect(() => {
    if (!seen) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase(3);
      setSettled(true);
      return;
    }
    setPhase(1);
    const ts = [
      setTimeout(() => setPhase(2), T_REVEAL),
      setTimeout(() => setPhase(3), T_STRIP),
      setTimeout(() => setSettled(true), T_SETTLED),
    ];
    return () => ts.forEach(clearTimeout);
  }, [seen]);

  // position + emphasise every slide from the scroll position (transform/opacity only)
  const apply = useCallback(() => {
    const c = trackRef.current;
    if (!c) return;
    const slides = c.querySelectorAll<HTMLElement>("[data-slide]");
    if (slides.length < 2) return;
    const pitch = slides[1].offsetLeft - slides[0].offsetLeft || 1;
    const mid = c.scrollLeft + c.clientWidth / 2;
    const open = phaseRef.current >= 3;
    const shown = phaseRef.current >= 2;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((el, i) => {
      const d = (el.offsetLeft + el.offsetWidth / 2 - mid) / pitch;
      const ad = Math.abs(d);
      if (ad < bestD) {
        bestD = ad;
        best = i;
      }
      const inner = el.firstElementChild as HTMLElement;
      let s = 1 - 0.18 * Math.min(ad, 1.6);
      let op = open ? 1 - 0.3 * Math.min(ad, 1.6) : ad < 0.5 && shown ? 1 : 0;
      const tx = open ? 0 : -d * pitch * 0.85; // before the strip opens, everything sits behind the hero
      if (!open && ad < 0.5 && !shown) s *= 0.94;
      if (!open && ad >= 0.5) op = 0;
      inner.style.transform = `translateX(${tx}px) scale(${s}) rotateY(${(-d * 24).toFixed(1)}deg)`;
      inner.style.opacity = String(op);
      inner.style.filter = open && ad > 0.5 ? `brightness(${1 - 0.2 * Math.min(ad, 1.6)})` : "none";
      el.style.zIndex = String(20 - Math.round(ad * 4));
    });
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, []);

  useLayoutEffect(() => {
    phaseRef.current = phase;
    apply();
  }, [phase, apply]);

  // centre the hero on mount and whenever the layout changes
  useLayoutEffect(() => {
    const c = trackRef.current;
    if (!c) return;
    const center = () => {
      const el = c.querySelectorAll<HTMLElement>("[data-slide]")[Math.min(HERO_INDEX, photos.length - 1)];
      if (!el) return;
      c.style.scrollSnapType = "none";
      c.scrollLeft = el.offsetLeft + el.offsetWidth / 2 - c.clientWidth / 2;
      c.style.scrollSnapType = "";
      apply();
    };
    center();
    const ro = new ResizeObserver(() => {
      if (!settled) center();
      else apply();
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [apply, photos.length, settled]);

  useEffect(() => {
    const c = trackRef.current;
    if (!c) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [apply]);

  const goTo = (i: number) => {
    const c = trackRef.current;
    const el = c?.querySelectorAll<HTMLElement>("[data-slide]")[i];
    if (!c || !el) return;
    c.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - c.clientWidth / 2, behavior: "smooth" });
  };

  // auto-slide: moves to the next photo every few seconds (loops back to the first)
  useEffect(() => {
    if (!settled || index !== null) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = stageRef.current;
    const io = el
      ? new IntersectionObserver(([e]) => (inView.current = e.isIntersecting), { root: scroller ?? null, threshold: 0.3 })
      : null;
    if (el) io?.observe(el);
    const id = setInterval(() => {
      if (!inView.current || document.hidden || drag.current.down || Date.now() < pausedUntil.current) return;
      goTo((activeRef.current + 1) % photos.length);
    }, AUTO_MS);
    return () => {
      clearInterval(id);
      io?.disconnect();
    };
  }, [settled, index, scroller, photos.length]);
  const pauseAuto = () => (pausedUntil.current = Date.now() + AUTO_PAUSE_MS);

  // mouse drag (touch uses native scrolling)
  const onPointerDown = (e: React.PointerEvent) => {
    pauseAuto();
    if (e.pointerType !== "mouse" || !settled) return;
    const c = trackRef.current!;
    drag.current = { down: true, moved: false, x: e.clientX, left: c.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const c = trackRef.current!;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      c.style.scrollSnapType = "none";
    }
    if (d.moved) c.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    const c = trackRef.current!;
    if (d.moved) {
      c.style.scrollSnapType = "";
      goTo(activeRef.current);
      setTimeout(() => (drag.current.moved = false), 0);
    }
  };

  // ---------- lightbox (unchanged behaviour) ----------
  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    // Inside the phone mockup, fixed positioning is relative to the scrolled content,
    // so pin the lightbox to the visible part of the scroller instead.
    setBox(
      scroller
        ? { position: "absolute", top: scroller.scrollTop, left: 0, width: "100%", height: scroller.clientHeight }
        : { position: "fixed", inset: 0 },
    );
    setIndex(i);
  };
  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      el.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index === null, scroller, close, step]);

  const current = index !== null ? photos[index] : null;
  const petals = [
    { left: "22%", dx: "30px", delay: "1.2s", dur: "9s" },
    { left: "40%", dx: "-26px", delay: "3.4s", dur: "10s" },
    { left: "58%", dx: "34px", delay: "2.2s", dur: "8.5s" },
    { left: "74%", dx: "-30px", delay: "5s", dur: "9.5s" },
    { left: "32%", dx: "22px", delay: "6.6s", dur: "10.5s" },
  ];

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="px-4 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Moments</p>
        <h2 id="gallery-title" className="mt-2 text-5xl">Our Gallery</h2>
      </Reveal>

      {/* ===== Antarpat reveal stage ===== */}
      <div
        ref={stageRef}
        className="relative mx-auto mt-6 w-full max-w-[460px] select-none"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* photographs: hero first, film strip after the curtains open */}
        <div
          ref={trackRef}
          className={`absolute left-0 right-0 flex items-center ${settled ? "" : "gal-anim"}`}
          style={{
            top: "12%",
            height: "78%",
            overflowX: settled ? "auto" : "hidden",
            overflowY: "hidden",
            scrollSnapType: settled ? "x mandatory" : "none",
            perspective: 700,
            padding: "0 24%",
            scrollbarWidth: "none",
            overscrollBehaviorX: "contain",
            touchAction: "pan-x pan-y",
            cursor: settled ? "grab" : "default",
            zIndex: 2,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onTouchStart={pauseAuto}
          onWheel={pauseAuto}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          aria-label="Wedding photographs"
        >
          {photos.map((p, i) => (
            <div
              key={p.src ?? p.alt}
              data-slide
              className="relative shrink-0"
              style={{ width: "100%", margin: "0 -10%", scrollSnapAlign: "center" }}
            >
              <div
                className="gal-slide w-full overflow-hidden rounded-[6px]"
                style={{
                  aspectRatio: "4 / 5",
                  opacity: 0,
                  border: "3px solid #fbf3df",
                  outline: "1px solid rgba(201,153,47,0.8)",
                  boxShadow: "0 10px 22px rgba(60,25,10,0.35)",
                  background: "#fbf3df",
                  willChange: "transform, opacity",
                }}
              >
                <button
                  className="block h-full w-full"
                  tabIndex={settled ? 0 : -1}
                  aria-label={`Open photo: ${p.alt}`}
                  onClick={(e) => {
                    if (!settled || drag.current.moved) return;
                    if (i === active) open(i, e.currentTarget);
                    else goTo(i);
                  }}
                >
                  <Tile p={p} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* silk Antarpat curtains meet in the centre, then part and gather at the sides */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
          <Curtain side="left" open={phase >= 1} />
          <Curtain side="right" open={phase >= 1} />
        </div>

        {/* gold mandap frame + garlands (stationary) */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
          <MandapFrame />
        </div>

        {/* a few petals */}
        {phase >= 2 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 5 }} aria-hidden>
            {petals.map((p, i) => (
              <span
                key={i}
                className="gal-petal"
                style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, ["--dx" as string]: p.dx }}
              />
            ))}
          </div>
        )}

        {/* caption of the photo in the centre */}
        <p
          className="pointer-events-none absolute inset-x-0 text-center font-script text-[26px] leading-none text-[#6B1624]"
          style={{ top: "90.5%", zIndex: 5, opacity: phase >= 3 ? 1 : 0, transition: "opacity 800ms ease" }}
        >
          {photos[active]?.caption}
        </p>
      </div>

      {current && index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="z-[95] flex flex-col bg-espresso/95"
          style={box}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 pt-14 text-ivory lg:pt-12">
            <span className="font-body text-xs tracking-widest">
              {index + 1} / {photos.length}
            </span>
            <button
              ref={closeRef}
              onClick={close}
              aria-label="Close viewer"
              className="flex h-11 w-11 items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <div
              key={index}
              className="max-h-full w-full animate-[fadeIn_300ms_ease-out] overflow-hidden rounded-md"
              style={{ aspectRatio: current.ratio, maxHeight: "100%" }}
            >
              <Tile p={current} fit="contain" />
            </div>
          </div>

          <p className="px-4 py-3 text-center font-script text-3xl text-ivory">{current.caption}</p>

          <div className="flex justify-between px-4 pb-6">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                onClick={() => step(d)}
                aria-label={d < 0 ? "Previous photo" : "Next photo"}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-xl text-ivory"
              >
                {d < 0 ? "‹" : "›"}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
