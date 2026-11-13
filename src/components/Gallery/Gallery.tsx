import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { wedding } from "../../config/wedding";
import { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";
import { Bougainvillea } from "../Family/Family";

/**
 * "Our Gallery": the title sits inside a cusped arch outline; below it a carousel shows the
 * current photo large in a gold frame with an ogee-arched top, its neighbours peeking out
 * behind it. Round tasselled arrows, dots and a script caption. Around it: bougainvillea,
 * a sepia sketch of the Gateway with the sun and birds, and a skyline, sea link and boats
 * along the water at the foot. The carousel advances by itself and holds still while the
 * mouse rests on it or a finger holds it; tap the centre photo to open it full screen.
 */

type Photo = (typeof wedding.gallery)[number];

const MAROON = "#8e1726";
const GOLD = "#b8862f";
const SEPIA = "#a88559";
const u = (n: number) => `calc(var(--u) * ${n})`;

const AUTO_MS = 3600; // one photo every AUTO_MS while nobody is touching it
const RESUME_MS = 1500; // wait after a touch / swipe before moving again

const GAL_CSS = `
.gal2-slide { transition: transform 900ms cubic-bezier(.22,1,.36,1), opacity 700ms ease, filter 700ms ease; will-change: transform; }
.gal2-in > * { opacity: 0; transform: translateY(calc(var(--u) * 16)); transition: opacity 900ms ease-out, transform 1000ms cubic-bezier(.2,.8,.25,1); transition-delay: calc(var(--i) * 150ms); }
.gal2-in.is-seen > * { opacity: 1; transform: none; }
.gal2-petal { position: absolute; top: -3%; width: calc(var(--u) * 10); height: calc(var(--u) * 7); border-radius: 70% 0 70% 0; background: linear-gradient(135deg, #ec5a8a, #b0144f); opacity: 0; animation: gal2-fall linear infinite; pointer-events: none; }
@keyframes gal2-fall { 0% { transform: translate(0,0) rotate(0); opacity: 0 } 8% { opacity: .85 } 85% { opacity: .7 } 100% { transform: translate(var(--dx), calc(var(--u) * 700)) rotate(300deg); opacity: 0 } }
.gal2-tassel { transform-origin: 50% 0; animation: gal2-swing 3.2s ease-in-out infinite alternate; }
@keyframes gal2-swing { from { transform: rotate(-5deg) } to { transform: rotate(5deg) } }
.gal2-bird { animation: gal2-bird 2.4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes gal2-bird { from { transform: scaleY(1) } to { transform: scaleY(.55) } }
@media (prefers-reduced-motion: reduce) {
  .gal2-slide { transition: none; }
  .gal2-in > * { opacity: 1 !important; transform: none !important; }
  .gal2-petal, .gal2-tassel, .gal2-bird { animation: none; }
  .gal2-petal { display: none; }
}
`;

/** frame outline with an ogee (raised, cusped) centre on the top edge, viewBox 200 x 250 */
const FRAME =
  "M0 34Q0 22 12 22H58C70 22 76 16 82 9Q91 0 100 0Q109 0 118 9C124 16 130 22 142 22H188Q200 22 200 34V238Q200 250 188 250H12Q0 250 0 238Z";

function FramedPhoto({ p, id }: { p: Photo; id: string }) {
  return (
    <svg viewBox="-4 -4 208 258" className="block h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={FRAME} transform="translate(9 10) scale(0.91 0.92)" />
        </clipPath>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e1a0" />
          <stop offset=".5" stopColor="#c99a37" />
          <stop offset="1" stopColor="#f1d68c" />
        </linearGradient>
      </defs>
      <path d={FRAME} fill="#fbf3df" stroke={`url(#${id}-gold)`} strokeWidth="3" style={{ filter: "drop-shadow(0 6px 10px rgba(80,40,10,.3))" }} />
      <rect x="9" y="10" width="182" height="230" fill="#3b2a1e" clipPath={`url(#${id}-clip)`} />
      {p.src && (
        <image href={p.src} x="9" y="10" width="182" height="230" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-clip)`} />
      )}
      <path d={FRAME} transform="translate(9 10) scale(0.91 0.92)" fill="none" stroke="#d9b25a" strokeWidth="1.4" />
    </svg>
  );
}

/** round ivory arrow with a gold ring and a swinging tassel */
function Arrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Previous photo" : "Next photo"}
      className="absolute z-30 flex flex-col items-center"
      style={{ top: "42%", [dir < 0 ? "left" : "right"]: "1.5%", width: u(40) }}
    >
      <span
        className="flex items-center justify-center rounded-full transition active:scale-95"
        style={{ width: u(40), height: u(40), background: "radial-gradient(circle at 40% 35%, #fffdf6, #f6ead0)", border: `${u(1.5)} solid #c99a37`, boxShadow: `0 ${u(3)} ${u(8)} rgba(90,50,10,0.3), inset 0 0 0 ${u(2)} #fffaf0` }}
      >
        <svg viewBox="0 0 16 16" style={{ width: u(15), height: u(15) }} fill="none" stroke={MAROON} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={dir < 0 ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
        </svg>
      </span>
      <svg viewBox="0 0 14 40" className="gal2-tassel -mt-px" style={{ width: u(12), height: u(34) }} aria-hidden>
        <path d="M7 0v10" stroke="#b8862f" strokeWidth="1.2" />
        <circle cx="7" cy="12" r="3" fill="#d9a73c" stroke="#8a6020" strokeWidth=".6" />
        <path d="M3.5 15h7l1.5 22c-3 1.5-7 1.5-10 0Z" fill="#d9a73c" stroke="#8a6020" strokeWidth=".6" />
        <path d="M5 17v19M7 17v20M9 17v19" stroke="#a9781f" strokeWidth=".5" />
      </svg>
    </button>
  );
}

/** maroon cusped (multifoil) arch outline that holds the title */
function TitleArch() {
  return (
    <svg viewBox="0 0 300 170" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" fill="none" aria-hidden>
      <path
        d="M6 170V96C6 74 22 62 40 60C44 44 58 34 76 34C84 18 104 10 124 12C132 4 142 1 150 1C158 1 168 4 176 12C196 10 216 18 224 34C242 34 256 44 260 60C278 62 294 74 294 96V170"
        stroke={MAROON}
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M14 170V98C14 80 28 70 44 68C48 54 60 44 78 43C87 28 104 20 124 21C132 13 141 10 150 10C159 10 168 13 176 21C196 20 213 28 222 43C240 44 252 54 256 68C272 70 286 80 286 98V170"
        stroke="#d4ae5e"
        strokeWidth=".8"
        vectorEffect="non-scaling-stroke"
        opacity=".8"
      />
    </svg>
  );
}

/** sepia pen sketch of the Gateway */
function GatewaySketch({ style }: { style?: CSSProperties }) {
  const tower = (x: number, y: number, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-9" y="0" width="18" height="40" fill="#f3e3c3" />
      <path d="M-9 0v40M9 0v40M-9 12h18M-9 26h18" />
      <path d="M-4 22v-6c0-3 8-3 8 0v6Z" />
      <path d="M-11 0h22M-10 -3h20" />
      <path d="M-8 -3C-8 -16 8 -16 8 -3" fill="#efdcb8" />
      <path d="M0 -15v-6M-2 -21h4" />
    </g>
  );
  return (
    <svg viewBox="0 0 220 200" className="pointer-events-none absolute" style={style} fill="none" stroke={SEPIA} strokeWidth="1" strokeLinejoin="round" aria-hidden>
      {/* side wings */}
      <rect x="18" y="110" width="44" height="80" fill="#f3e3c3" />
      <rect x="158" y="110" width="44" height="80" fill="#f3e3c3" />
      <path d="M28 190v-34c0-10 24-10 24 0v34M168 190v-34c0-10 24-10 24 0v34" />
      <path d="M18 124h44M158 124h44M18 110h44M158 110h44" />
      {Array.from({ length: 6 }, (_, k) => (
        <path key={k} d={`M${21 + k * 7} 110v-5h4v5M${161 + k * 7} 110v-5h4v5`} />
      ))}
      {/* central block */}
      <rect x="58" y="62" width="104" height="128" fill="#f6e8cc" />
      <path d="M82 190v-62c0-26 56-26 56 0v62" fill="#e8d3ab" />
      <path d="M88 190v-60c0-20 44-20 44 0v60" />
      <path d="M58 78h104M58 94h104M58 62h104" />
      {Array.from({ length: 14 }, (_, k) => (
        <path key={k} d={`M${60 + k * 7.4} 62v-5h4v5`} />
      ))}
      <path d="M66 112v-10c0-4 8-4 8 0v10ZM146 112v-10c0-4 8-4 8 0v10Z" />
      <path d="M66 150v-14c0-5 8-5 8 0v14ZM146 150v-14c0-5 8-5 8 0v14Z" />
      {/* corner towers */}
      {tower(64, 22)}
      {tower(156, 22)}
      {tower(92, 34, 0.75)}
      {tower(128, 34, 0.75)}
      {/* central dome */}
      <path d="M96 57C96 34 124 34 124 57" fill="#efdcb8" />
      <path d="M110 36v-8M107 28h6" />
      {/* hatching */}
      <path d="M62 170l8-8M62 182l12-12M150 170l8-8M150 182l10-10M22 180l8-8M190 180l8-8" opacity=".55" />
      <path d="M0 196h220" strokeWidth="1.3" />
    </svg>
  );
}

/** skyline across the water on the left, the sea link on the right, boats between */
function Waterfront() {
  const towers = [
    [4, 40], [16, 64], [28, 34], [52, 72], [64, 50], [118, 46], [130, 60], [142, 38], [154, 54],
  ] as const;
  return (
    <svg viewBox="0 0 400 110" className="pointer-events-none absolute inset-x-0 bottom-0 w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="gal2-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6d0" stopOpacity=".55" />
          <stop offset="1" stopColor="#efe0c2" stopOpacity=".9" />
        </linearGradient>
      </defs>
      <g fill="#e2cfab" stroke="#b49a72" strokeWidth=".6" opacity=".85">
        {towers.map(([x, h], i) => (
          <rect key={i} x={x} y={88 - h} width="11" height={h} />
        ))}
        {/* domed heritage building */}
        <rect x="74" y="54" width="44" height="34" />
        <path d="M84 54c0-14 24-14 24 0" />
        <path d="M96 40v-6" />
        <path d="M78 66h36M78 76h36" />
        <rect x="70" y="60" width="6" height="28" />
        <rect x="116" y="60" width="6" height="28" />
      </g>
      <path d="M0 88h180" stroke="#6f8a52" strokeWidth="3" opacity=".5" />
      {/* sea link */}
      <g stroke="#a88a62" fill="none" strokeWidth=".8" opacity=".9">
        <path d="M200 86C260 82 330 80 400 80" strokeWidth="1.6" />
        {[300, 340].map((x) => (
          <g key={x}>
            <path d={`M${x - 4} 84L${x} 36L${x + 4} 84`} strokeWidth="1.6" />
            {Array.from({ length: 6 }, (_, k) => (
              <path key={k} d={`M${x} ${40 + k * 4}L${x - 16 - k * 7} 83M${x} ${40 + k * 4}L${x + 16 + k * 7} 82`} strokeWidth=".45" />
            ))}
          </g>
        ))}
        {Array.from({ length: 12 }, (_, k) => (
          <path key={k} d={`M${212 + k * 16} 86v8`} strokeWidth=".7" />
        ))}
      </g>
      <rect x="0" y="88" width="400" height="22" fill="url(#gal2-sea)" />
      <path d="M20 96h30M90 100h24M160 95h40M250 99h30M320 96h36M60 104h20" stroke="#fff" strokeWidth=".8" opacity=".8" strokeLinecap="round" />
      {[
        [40, 95],
        [120, 98],
        [196, 94],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 3h18l-3 3H3Z" fill="#7a3a46" />
          <rect x="4" y="-1" width="9" height="4" fill="#f3e6cc" stroke="#7a3a46" strokeWidth=".4" />
        </g>
      ))}
    </svg>
  );
}

export default function Gallery() {
  const photos = wedding.gallery;
  const n = photos.length;
  const scroller = useScrollRoot();
  const [ref, seen] = useInView<HTMLDivElement>(0.15);

  const [active, setActive] = useState(Math.min(2, n - 1));
  const hold = useRef(false);
  const resumeAt = useRef(0);
  const visible = useRef(false);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // lightbox
  const [index, setIndex] = useState<number | null>(null);
  const [box, setBox] = useState<CSSProperties>({});
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const go = useCallback((d: number) => setActive((a) => (a + d + n) % n), [n]);
  const nudge = () => (resumeAt.current = performance.now() + RESUME_MS);

  // only glide while the stage is on screen
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { root: scroller ?? null, threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [scroller]);

  // auto-advance
  useEffect(() => {
    if (!seen || index !== null || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!visible.current || hold.current || performance.now() < resumeAt.current) return;
      go(1);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [seen, index, go]);

  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    // portalled into the scroller (phone mockup) or <body>, so no transformed ancestor can shift it
    setBox(scroller ? { position: "absolute", top: scroller.scrollTop, left: 0, width: "100%", height: scroller.clientHeight } : { position: "fixed", inset: 0 });
    setIndex(i);
  };
  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + n) % n)), [n]);

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
    { left: "4%", dx: u(30), delay: "0s", dur: "12s" },
    { left: "16%", dx: u(-20), delay: "4s", dur: "14s" },
    { left: "88%", dx: u(-36), delay: "2s", dur: "13s" },
    { left: "70%", dx: u(24), delay: "7s", dur: "15s" },
    { left: "40%", dx: u(30), delay: "9.5s", dur: "13.5s" },
  ];
  const t = (i: number) => ({ "--i": i } as CSSProperties);

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="relative overflow-hidden pb-[27%] pt-6">
      <style>{GAL_CSS}</style>

      {/* ---------- scenery ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Bougainvillea style={{ left: u(-6), top: u(-6), width: u(150), height: u(150), zIndex: 6 }} />
        <div className="absolute" style={{ right: u(-6), bottom: u(-6), width: u(140), height: u(140), transform: "rotate(180deg)", zIndex: 6 }}>
          <Bougainvillea style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
        </div>
        {/* sun and birds */}
        <span className="absolute rounded-full" style={{ right: "12%", top: u(26), width: u(54), height: u(54), background: "radial-gradient(circle, rgba(246,214,130,0.75), rgba(246,214,130,0.25) 70%, transparent 72%)" }} />
        <svg viewBox="0 0 120 60" className="absolute" style={{ right: "4%", top: u(20), width: u(120) }} fill="none" stroke="#6b5a4a" strokeWidth="1.1" strokeLinecap="round">
          <path className="gal2-bird" d="M20 30q5-5 10 0q5-5 10 0" />
          <path className="gal2-bird" style={{ animationDelay: ".6s" }} d="M70 14q4-4 8 0q4-4 8 0" />
          <path className="gal2-bird" style={{ animationDelay: "1.1s" }} d="M92 36q4-4 8 0q4-4 8 0" />
        </svg>
        <svg viewBox="0 0 80 30" className="absolute" style={{ left: "26%", top: u(120), width: u(64) }} fill="none" stroke="#6b5a4a" strokeWidth="1.1" strokeLinecap="round">
          <path className="gal2-bird" d="M6 14q5-5 10 0q5-5 10 0" />
          <path className="gal2-bird" style={{ animationDelay: ".8s" }} d="M44 20q4-4 8 0q4-4 8 0" />
        </svg>
        <GatewaySketch style={{ right: "-8%", top: u(70), width: "52%", opacity: 0.8 }} />
        <Waterfront />
        <div className="absolute inset-0 overflow-hidden">
          {petals.map((p, i) => (
            <span key={i} className="gal2-petal" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, ["--dx" as string]: p.dx }} />
          ))}
        </div>
      </div>

      <div ref={ref} className={`gal2-in relative z-10 ${seen ? "is-seen" : ""}`}>
        {/* ---------- title in the cusped arch ---------- */}
        <div className="relative mx-auto px-6 pb-6 pt-[9%] text-center" style={{ width: "78%", ...t(0) }}>
          <TitleArch />
          <h2 id="gallery-title" className="relative font-script text-[48px] font-normal leading-none" style={{ color: MAROON }}>
            Our Gallery
          </h2>
          <svg viewBox="0 0 200 16" className="relative mx-auto mt-2 block" style={{ width: u(150), height: u(12) }} fill="none" aria-hidden>
            <path d="M6 8h70M124 8h70" stroke={MAROON} strokeWidth=".9" />
            <path d="M84 8l4-3 4 3-4 3ZM108 8l4-3 4 3-4 3Z" fill={GOLD} />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="100" cy="4.5" rx="2" ry="3.5" transform={`rotate(${a} 100 8)`} fill={MAROON} />
            ))}
            <circle cx="100" cy="8" r="1.5" fill="#f3d58c" />
          </svg>
        </div>

        {/* ---------- carousel ---------- */}
        <div
          ref={stageRef}
          className="relative -mt-[4%] w-full select-none"
          style={{ aspectRatio: "1 / 0.86", touchAction: "pan-y", ...t(1) }}
          aria-roledescription="carousel"
          aria-label="Wedding photographs"
          onPointerEnter={(e) => e.pointerType === "mouse" && (hold.current = true)}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") return;
            hold.current = false;
            nudge();
          }}
          onPointerDown={(e) => {
            hold.current = true;
            swipe.current = { x: e.clientX, moved: false };
          }}
          onPointerUp={(e) => {
            const s = swipe.current;
            if (s && Math.abs(e.clientX - s.x) > 40) {
              s.moved = true;
              go(e.clientX < s.x ? 1 : -1);
            }
            if (e.pointerType !== "mouse") hold.current = false;
            nudge();
            setTimeout(() => (swipe.current = null), 0);
          }}
          onPointerCancel={() => {
            hold.current = false;
            swipe.current = null;
            nudge();
          }}
        >
          {photos.map((p, i) => {
            let d = (((i - active) % n) + n) % n;
            if (d > n / 2) d -= n;
            const ad = Math.abs(d);
            const style: CSSProperties = {
              left: "18%",
              width: "64%",
              top: "2%",
              transform: `translateX(${d * 60}%) scale(${ad === 0 ? 1 : ad === 1 ? 0.8 : 0.62})`,
              opacity: ad > 1 ? 0 : 1,
              filter: ad ? "brightness(.88) saturate(.9)" : "none",
              zIndex: 20 - ad * 5,
              pointerEvents: ad > 1 ? "none" : "auto",
            };
            return (
              <button
                key={p.src ?? p.alt}
                type="button"
                className="gal2-slide absolute block"
                style={style}
                tabIndex={ad === 0 ? 0 : -1}
                aria-hidden={ad > 1}
                aria-label={ad === 0 ? `Open photo: ${p.alt}` : `Show photo: ${p.alt}`}
                onClick={(e) => {
                  if (swipe.current?.moved) return;
                  if (d === 0) open(i, e.currentTarget);
                  else {
                    go(d);
                    nudge();
                  }
                }}
              >
                <FramedPhoto p={p} id={`gal2-${i}`} />
              </button>
            );
          })}

          <Arrow dir={-1} onClick={() => { go(-1); nudge(); }} />
          <Arrow dir={1} onClick={() => { go(1); nudge(); }} />
        </div>

        {/* ---------- dots + caption ---------- */}
        <div className="relative -mt-[3%] flex items-center justify-center gap-2.5" style={t(2)}>
          <span className="h-px w-[18%]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
          {photos.map((p, i) => {
            const on = i === active;
            return (
              <button
                key={p.src ?? p.alt}
                type="button"
                aria-label={`Photo ${i + 1}: ${p.caption}`}
                aria-current={on}
                onClick={() => {
                  setActive(i);
                  nudge();
                }}
                className="rounded-full transition-all duration-500"
                style={{ width: on ? u(13) : u(7), height: on ? u(13) : u(7), background: on ? MAROON : "#d4a54a" }}
              />
            );
          })}
          <span className="h-px w-[18%]" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
        </div>

        <div className="relative mt-3 text-center" style={t(3)}>
          <p key={active} className="font-script text-[40px] leading-none animate-[fadeIn_600ms_ease-out]" style={{ color: MAROON }} aria-live="polite">
            {photos[active]?.caption}
          </p>
          <svg viewBox="0 0 220 26" className="mx-auto mt-1 block" style={{ width: u(190), height: u(22) }} fill="none" stroke={MAROON} strokeLinecap="round" aria-hidden>
            <path d="M4 6C40 18 80 16 104 14M216 6C180 18 140 16 116 14" strokeWidth="1" />
            <path d="M110 22c-6-4-8-7-6-9 1.5-1.5 4-1 6 1.5 2-2.5 4.5-3 6-1.5 2 2 0 5-6 9Z" strokeWidth="1.1" />
          </svg>
        </div>
      </div>

      {/* ---------- full-screen viewer ---------- */}
      {current &&
        index !== null &&
        createPortal(
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
            <div className="flex items-center justify-between px-4 pt-12 text-ivory">
              <span className="font-body text-xs tracking-widest">
                {index + 1} / {n}
              </span>
              <button ref={closeRef} onClick={close} aria-label="Close viewer" className="flex h-11 w-11 items-center justify-center text-2xl">
                ×
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
              <div key={index} className="max-h-full w-full animate-[fadeIn_300ms_ease-out] overflow-hidden rounded-md" style={{ aspectRatio: current.ratio, maxHeight: "100%" }}>
                {current.src ? (
                  <img src={current.src} alt={current.alt} className="h-full w-full object-contain" draggable={false} />
                ) : (
                  <div role="img" aria-label={current.alt} className="h-full w-full" style={{ background: "linear-gradient(160deg,#d9b872,#a8843f)" }} />
                )}
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
          </div>,
          scroller ?? document.body,
        )}
    </section>
  );
}
