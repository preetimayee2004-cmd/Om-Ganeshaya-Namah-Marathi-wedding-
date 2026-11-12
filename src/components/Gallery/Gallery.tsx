import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

type Photo = (typeof wedding.gallery)[number];

// ===== ANTARPAT REVEAL TIMING (ms after the section comes into view) =====
const T_REVEAL = 800; // couple photo starts to fade in while the curtains are still parting
const T_STRIP = 1700; // remaining photos slide out into the film strip
const T_SETTLED = 2100; // the carousel starts gliding (and becomes swipeable) about 2 s after arriving
const SLIDE_MS = 3400; // film strip glides continuously: one photo passes the centre every SLIDE_MS
const RESUME_MS = 1000; // after the visitor touches / drags, the glide resumes after this long
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
  const drag = useRef({ down: false, moved: false, x: 0, pos: 0 });
  const pausedUntil = useRef(0);
  const inView = useRef(false);
  const posRef = useRef(Math.min(HERO_INDEX, photos.length - 1)); // film position, in photo-pitches

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
      { root: scroller ?? null, threshold: 0.2 },
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

  // place + emphasise every slide on a ring around the centre (transform / opacity only)
  const apply = useCallback(() => {
    const c = trackRef.current;
    if (!c) return;
    const slides = c.querySelectorAll<HTMLElement>("[data-slide]");
    const n = slides.length;
    if (!n) return;
    const pitch = c.clientWidth * 0.62 * 0.8;
    const open = phaseRef.current >= 3;
    const shown = phaseRef.current >= 2;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((el, i) => {
      const du = ((((i - posRef.current + n / 2) % n) + n) % n) - n / 2; // distance from the centre, in pitches
      const ad = Math.abs(du);
      if (ad < bestD) {
        bestD = ad;
        best = i;
      }
      const inner = el.firstElementChild as HTMLElement;
      const edge = Math.max(0, 1 - Math.max(0, ad - 2) * 2); // fades out where the ring wraps (off screen)
      const s2 = (1 - 0.18 * Math.min(ad, 1.6)) * (!open && ad < 0.5 && !shown ? 0.94 : 1);
      const op = open ? (1 - 0.3 * Math.min(ad, 1.6)) * edge : ad < 0.5 && shown ? 1 : 0;
      const tx = (open ? 1 : 0.15) * du * pitch; // before the strip opens everything sits behind the hero
      inner.style.transform = `translateX(${tx.toFixed(2)}px) scale(${s2.toFixed(4)}) rotateY(${(-du * 24).toFixed(1)}deg)`;
      inner.style.opacity = op.toFixed(3);
      inner.style.filter = open && ad > 0.5 ? `brightness(${(1 - 0.2 * Math.min(ad, 1.6)).toFixed(3)})` : "none";
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

  useLayoutEffect(() => {
    const c = trackRef.current;
    if (!c) return;
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(c);
    return () => ro.disconnect();
  }, [apply]);

  // continuous cinematic glide (pauses while out of view, dragged, or the viewer is open)
  useEffect(() => {
    if (!settled) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const n = photos.length;
    let raf = 0;
    let running = false;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(64, t - last) / 1000;
      last = t;
      if (!reduce && !drag.current.down && t > pausedUntil.current) posRef.current = (posRef.current + dt / (SLIDE_MS / 1000)) % n;
      apply();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || index !== null) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const el = stageRef.current;
    const io = el
      ? new IntersectionObserver(
          ([e]) => {
            inView.current = e.isIntersecting;
            if (e.isIntersecting) start();
            else stop();
          },
          { root: scroller ?? null, threshold: 0.2 },
        )
      : null;
    if (el) io?.observe(el);
    return () => {
      stop();
      io?.disconnect();
    };
  }, [settled, index, scroller, photos.length, apply]);

  // drag / swipe (touch and mouse): the glide resumes RESUME_MS after the finger lifts
  const onPointerDown = (e: React.PointerEvent) => {
    if (!settled) return;
    drag.current = { down: true, moved: false, x: e.clientX, pos: posRef.current };
    pausedUntil.current = Infinity;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (d.moved) {
      const c = trackRef.current!;
      const n = photos.length;
      const pitch = c.clientWidth * 0.62 * 0.8;
      posRef.current = (((d.pos - dx / pitch) % n) + n) % n;
      apply();
    }
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    pausedUntil.current = performance.now() + RESUME_MS;
    if (d.moved) setTimeout(() => (drag.current.moved = false), 0);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!settled || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const c = trackRef.current!;
    const n = photos.length;
    posRef.current = (((posRef.current + e.deltaX / (c.clientWidth * 0.62 * 0.8)) % n) + n) % n;
    pausedUntil.current = performance.now() + RESUME_MS;
    apply();
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
    { left: "22%", dx: "calc(var(--u) * 30)", delay: "1.2s", dur: "9s" },
    { left: "40%", dx: "calc(var(--u) * -26)", delay: "3.4s", dur: "10s" },
    { left: "58%", dx: "calc(var(--u) * 34)", delay: "2.2s", dur: "8.5s" },
    { left: "74%", dx: "calc(var(--u) * -30)", delay: "5s", dur: "9.5s" },
    { left: "32%", dx: "calc(var(--u) * 22)", delay: "6.6s", dur: "10.5s" },
  ];

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="px-4 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Moments</p>
        <h2 id="gallery-title" className="section-title mt-2">Our Gallery</h2>
      </Reveal>

      {/* ===== Antarpat reveal stage ===== */}
      <div
        ref={stageRef}
        className="relative mx-auto mt-6 w-full max-w-[460px] select-none"
        style={{ aspectRatio: "1 / 1.12" }}
      >
        {/* photographs: hero first, then a continuously gliding film strip */}
        <div
          ref={trackRef}
          className={`absolute left-0 right-0 ${settled ? "" : "gal-anim"}`}
          style={{
            top: "11%",
            height: "80%",
            overflow: "hidden",
            perspective: 700,
            touchAction: "pan-y",
            cursor: settled ? "grab" : "default",
            zIndex: 2,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          aria-label="Wedding photographs"
        >
          {photos.map((p, i) => (
            <div
              key={p.src ?? p.alt}
              data-slide
              className="absolute"
              style={{ left: "19%", width: "62%", top: "50%", marginTop: "-38.75%" }}
            >
              <div
                className="gal-slide w-full overflow-hidden rounded-[6px]"
                style={{
                  aspectRatio: "4 / 5",
                  opacity: 0,
                  border: "calc(var(--u) * 3) solid #fbf3df",
                  outline: "1px solid rgba(201,153,47,0.8)",
                  boxShadow: "0 calc(var(--u) * 10) calc(var(--u) * 22) rgba(60,25,10,0.35)",
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
                    open(i, e.currentTarget);
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
          <div className="flex items-center justify-between px-4 text-ivory pt-12">
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
