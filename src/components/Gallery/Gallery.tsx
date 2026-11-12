import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

type Photo = (typeof wedding.gallery)[number];

/** design px -> screen-proportional length for INLINE styles (Tailwind classes are converted by PostCSS) */
const u = (n: number) => `calc(var(--u) * ${n})`;

const FILM = "#2a1a12"; // espresso film base
const VIEWER_MS = 420; // viewer open / close
const FRAME_W = 290; // design px: ~78% of the framed section, so the next frame peeks in

const tones: Record<string, string> = {
  wine: "linear-gradient(160deg,#722B35,#3d161c)",
  olive: "linear-gradient(160deg,#7d8864,#4a5339)",
  blush: "linear-gradient(160deg,#F1D9CF,#E8C9BE)",
  gold: "linear-gradient(160deg,#d9b872,#a8843f)",
};

// rounded sprocket hole, repeated along the film edges (drawn as an SVG tile)
const SPROCKET = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="22" viewBox="0 0 16 22"><rect x="4" y="6" width="8" height="10" rx="2" fill="#f3e3c3" fill-opacity=".82"/></svg>',
)}")`;
// fine film grain
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

const STYLES = `
.gfs-strip { opacity: 0; transform: translateX(${u(170)}); }
.gfs-strip.gfs-in { animation: gfs-glide 1200ms cubic-bezier(.22,.61,.36,1) forwards; }
@keyframes gfs-glide { from { opacity: 0; transform: translateX(${u(170)}); } to { opacity: 1; transform: none; } }
.gfs-photo { transition: filter 700ms ease, transform 700ms ease; filter: sepia(.6) saturate(.75) contrast(.95) brightness(.9); transform: scale(.985); }
.gfs-frame.is-active .gfs-photo { filter: none; transform: none; }
.gfs-grain, .gfs-vig { transition: opacity 700ms ease; }
.gfs-frame.is-active .gfs-grain { opacity: .18 !important; }
.gfs-frame.is-active .gfs-vig { opacity: .45 !important; }
.gfs-track { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.gfs-track::-webkit-scrollbar { display: none; }
.gfs-track.is-dragging { scroll-snap-type: none; cursor: grabbing; }
.gfs-ctrl { transition: transform 300ms ease, opacity 300ms ease; }
.gfs-ctrl:hover { transform: scale(1.05); }
.gfs-ctrl:active { transform: scale(.95); }
.gfs-dot { transition: width 400ms ease, background-color 400ms ease; }
.gfs-ov { opacity: 0; transition: opacity ${VIEWER_MS}ms ease; }
.gfs-ov.is-open { opacity: 1; }
.gfs-ov .gfs-pic { opacity: 0; transform: scale(.92); transition: opacity ${VIEWER_MS}ms ease, transform ${VIEWER_MS}ms cubic-bezier(.22,.61,.36,1); }
.gfs-ov.is-open .gfs-pic { opacity: 1; transform: none; }
.gfs-swap { animation: gfs-fade 350ms ease-out; }
@keyframes gfs-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .gfs-strip, .gfs-strip.gfs-in { animation: none; opacity: 1; transform: none; }
  .gfs-photo, .gfs-grain, .gfs-vig, .gfs-dot, .gfs-ov, .gfs-ov .gfs-pic { transition: none; }
  .gfs-swap { animation: none; }
}
`;

function Tile({ p, fit = "cover", className = "" }: { p: Photo; fit?: "cover" | "contain"; className?: string }) {
  if (p.src) {
    return (
      <img
        src={p.src}
        alt={p.alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`block h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      />
    );
  }
  // elegant placeholder: toned paper with a thin gold inset frame and an aperture mark
  return (
    <div
      role="img"
      aria-label={p.alt}
      className={`relative flex h-full w-full items-center justify-center ${className}`}
      style={{ background: tones[p.tone] ?? tones.gold }}
    >
      <span className="absolute" style={{ inset: u(10), border: "1px solid rgba(251,241,223,0.7)" }} aria-hidden />
      <svg viewBox="0 0 40 40" style={{ width: u(40), height: u(40) }} aria-hidden>
        <circle cx="20" cy="20" r="17" fill="none" stroke="#fbf1df" strokeOpacity=".8" strokeWidth="1.2" />
        <path
          d="M20 3 L26 18 M37 20 L22 26 M20 37 L14 22 M3 20 L18 14 M32 8 L24 21 M32 32 L19 24 M8 32 L16 19 M8 8 L21 16"
          stroke="#fbf1df"
          strokeOpacity=".65"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

const Chevron = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 24 24" style={{ width: u(18), height: u(18) }} aria-hidden>
    <path
      d={dir < 0 ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function Gallery() {
  const photos = wedding.gallery;
  const n = photos.length;
  const scroller = useScrollRoot();

  // ---------- film strip ----------
  const [stripRef, seen] = useInView<HTMLDivElement>(0.2);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const drag = useRef({ down: false, moved: false, x: 0, left: 0, id: -1, start: 0 });
  const activeRef = useRef(0);
  activeRef.current = active;

  const frames = () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>("[data-frame]") ?? []);

  /** horizontal scroll position that centres frame i */
  const leftFor = (i: number) => {
    const t = trackRef.current;
    const f = frames()[i];
    if (!t || !f) return 0;
    const tr = t.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    return t.scrollLeft + fr.left + fr.width / 2 - (tr.left + tr.width / 2);
  };

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const t = trackRef.current;
      if (!t || !n) return;
      const k = Math.max(0, Math.min(n - 1, i));
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      t.scrollTo({ left: leftFor(k), behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n],
  );

  // which frame is nearest the centre of the strip
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const tr = t.getBoundingClientRect();
      const c = tr.left + tr.width / 2;
      let best = 0;
      let bestD = Infinity;
      frames().forEach((f, i) => {
        const r = f.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - c);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(t);
    measure();
    return () => {
      t.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n]);

  // mouse drag (touch / trackpad use the native horizontal scroll + snap)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { down: true, moved: false, x: e.clientX, left: e.currentTarget.scrollLeft, id: e.pointerId, start: activeRef.current };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      e.currentTarget.setPointerCapture?.(d.id);
      e.currentTarget.classList.add("is-dragging");
    }
    if (d.moved) e.currentTarget.scrollLeft = d.left - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.moved) return;
    const el = e.currentTarget;
    const dx = e.clientX - d.x;
    // nearest frame to the centre now; a short flick still advances one frame in the drag direction
    const tr = el.getBoundingClientRect();
    const c = tr.left + tr.width / 2;
    let near = 0;
    let nearD = Infinity;
    frames().forEach((f, i) => {
      const r = f.getBoundingClientRect();
      const dd = Math.abs(r.left + r.width / 2 - c);
      if (dd < nearD) {
        nearD = dd;
        near = i;
      }
    });
    const target = near === d.start && Math.abs(dx) > 40 ? near + (dx < 0 ? 1 : -1) : near;
    el.classList.remove("is-dragging");
    el.scrollLeft = d.left - dx;
    goTo(target);
    setTimeout(() => (drag.current.moved = false), 0);
  };

  // ---------- full-screen viewer ----------
  const [index, setIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(false); // drives the open / close transition
  const [box, setBox] = useState<CSSProperties>({});
  const [host, setHost] = useState<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inside the laptop phone mockup the page scrolls inside `scroller` (a transformed, positioned
  // element), so position:fixed would be relative to the scrolled content. The viewer is portalled
  // into .screen-content (keeps --u for sizing and escapes the framed card's stacking context) and,
  // in the mockup, pinned absolutely to the visible part of the scroller.
  const measureBox = useCallback(() => {
    setBox(
      scroller
        ? { position: "absolute", top: scroller.scrollTop, left: 0, width: "100%", height: scroller.clientHeight }
        : { position: "fixed", inset: 0 },
    );
  }, [scroller]);

  const open = (i: number, el: HTMLElement) => {
    if (drag.current.moved) return;
    if (closing.current) clearTimeout(closing.current);
    closing.current = null;
    opener.current = el;
    setHost((sectionRef.current?.closest(".screen-content") as HTMLElement | null) ?? document.body);
    measureBox();
    setIndex(i);
    setShown(false);
  };

  const close = useCallback(() => {
    if (closing.current) return;
    setShown(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    closing.current = setTimeout(
      () => {
        closing.current = null;
        setIndex(null);
        opener.current?.focus({ preventScroll: true });
      },
      reduce ? 0 : VIEWER_MS,
    );
  }, []);

  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + n) % n)), [n]);

  // fade / scale in on the frame after mount
  useLayoutEffect(() => {
    if (index === null || shown) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index === null]);

  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        // keep focus inside the viewer
        const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measureBox);
    return () => {
      el.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measureBox);
    };
  }, [isOpen, scroller, close, step, measureBox]);

  // keep the strip in step with the viewer so focus returns to a visible frame
  useEffect(() => {
    if (index !== null && index !== active) goTo(index, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => () => void (closing.current && clearTimeout(closing.current)), []);

  const current = index !== null ? photos[index] : null;
  const ctrl =
    "gfs-ctrl flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6d0f1b] disabled:opacity-40";
  const ctrlStyle: CSSProperties = {
    background: "linear-gradient(180deg, #FCEFCB 0%, #F3DB9C 55%, #F8E8BC 100%)",
    border: "1.5px solid #D4AE5E",
    boxShadow: `inset 0 0 0 ${u(2)} rgba(255,248,225,0.7), 0 ${u(3)} ${u(10)} rgba(110,70,10,0.22)`,
  };

  return (
    <section ref={sectionRef} id="gallery" aria-labelledby="gallery-title" className="py-6">
      <style>{STYLES}</style>

      <Reveal className="px-4 text-center">
        <p className="font-body text-[11px] uppercase tracking-[0.35em] text-olive">Moments</p>
        <h2 id="gallery-title" className="section-title mt-2">Our Gallery</h2>
      </Reveal>

      {/* ===== 35mm film strip ===== */}
      <div ref={stripRef} className="relative mt-6 w-full overflow-hidden">
        <div className={`gfs-strip ${seen ? "gfs-in" : ""}`}>
          <div
            ref={trackRef}
            className="gfs-track relative overflow-x-auto overflow-y-hidden"
            style={{
              background: FILM,
              boxShadow: `inset 0 ${u(1)} 0 rgba(212,174,94,0.35), inset 0 ${u(-1)} 0 rgba(212,174,94,0.35), 0 ${u(10)} ${u(24)} ${u(-12)} rgba(42,26,18,0.7)`,
              cursor: n > 1 ? "grab" : "default",
              touchAction: "pan-x pan-y",
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Wedding photographs, film strip"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="relative flex items-stretch"
              style={{
                width: "max-content",
                minWidth: "100%",
                paddingInline: `calc((100% - ${u(FRAME_W)}) / 2)`,
                paddingBlock: u(36),
                gap: u(12),
              }}
            >
              {/* sprocket holes, top and bottom, travelling with the film */}
              {(["top", "bottom"] as const).map((edge) => (
                <span
                  key={edge}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0"
                  style={{
                    [edge]: 0,
                    height: u(22),
                    backgroundImage: SPROCKET,
                    backgroundSize: `${u(16)} ${u(22)}`,
                    backgroundRepeat: "repeat-x",
                  }}
                />
              ))}

              {photos.map((p, i) => (
                <figure
                  key={i}
                  data-frame
                  className={`gfs-frame relative m-0 shrink-0 ${i === active ? "is-active" : ""}`}
                  style={{ width: u(FRAME_W), scrollSnapAlign: "center" }}
                >
                  {/* frame numbers printed in the film edge, contact-sheet style */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 font-body text-[8px] tracking-[0.2em]"
                    style={{ top: u(-12), color: "#D4AE5E", opacity: 0.75 }}
                  >
                    ▸ {pad2(i + 1)}
                  </span>

                  <button
                    type="button"
                    className="relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AE5E]"
                    style={{
                      aspectRatio: "4 / 5",
                      borderRadius: u(3),
                      boxShadow: `0 0 0 1px rgba(212,174,94,0.55), 0 0 0 ${u(4)} rgba(251,241,223,0.06)`,
                      background: "#1a0f0a",
                    }}
                    aria-label={`Open photo ${i + 1} of ${n}: ${p.alt}`}
                    onClick={(e) => open(i, e.currentTarget)}
                  >
                    <Tile p={p} className="gfs-photo" />
                    <span
                      aria-hidden
                      className="gfs-grain pointer-events-none absolute inset-0"
                      style={{ backgroundImage: GRAIN, backgroundSize: `${u(160)} ${u(160)}`, mixBlendMode: "multiply", opacity: 0.55 }}
                    />
                    <span
                      aria-hidden
                      className="gfs-vig pointer-events-none absolute inset-0"
                      style={{
                        background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,15,8,0.75) 100%)",
                        opacity: 1,
                      }}
                    />
                  </button>

                  <figcaption
                    className="mt-3 flex items-baseline justify-between gap-2 font-serif text-[17px] italic leading-tight"
                    style={{ color: "#f1dfb8" }}
                  >
                    <span className="min-w-0 truncate">{p.caption}</span>
                    <span className="shrink-0 font-body text-[9px] not-italic tracking-[0.25em]" style={{ color: "#C9963A" }}>
                      {pad2(i + 1)}A
                    </span>
                  </figcaption>

                  {/* edge number below, like the latent image numbers on a contact sheet */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-0 font-body text-[8px] tracking-[0.2em]"
                    style={{ bottom: u(-12), color: "#D4AE5E", opacity: 0.6 }}
                  >
                    {pad2(i + 1)} ◂
                  </span>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== indicator + controls ===== */}
      {n > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 px-4">
          <button type="button" className={ctrl} style={ctrlStyle} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous photo">
            <Chevron dir={-1} />
          </button>
          <div className="flex min-w-0 flex-col items-center gap-2">
            {n <= 9 && (
              <div className="flex items-center gap-[6px]" aria-hidden>
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className="gfs-dot block rounded-full"
                    style={{
                      height: u(6),
                      width: i === active ? u(18) : u(6),
                      background: i === active ? "#b8862f" : "rgba(184,134,47,0.35)",
                    }}
                  />
                ))}
              </div>
            )}
            <p className="font-body text-[11px] uppercase tracking-[0.3em] text-[#6d0f1b]" aria-live="polite">
              Frame {pad2(active + 1)} / {pad2(n)}
            </p>
          </div>
          <button type="button" className={ctrl} style={ctrlStyle} onClick={() => goTo(active + 1)} disabled={active === n - 1} aria-label="Next photo">
            <Chevron dir={1} />
          </button>
        </div>
      )}

      {current &&
        index !== null &&
        host &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            className={`gfs-ov z-[120] flex flex-col ${shown ? "is-open" : ""}`}
            style={{ ...box, background: "rgba(26,15,10,0.96)" }}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <div className="flex items-center justify-between px-4 pt-12 text-[#fbf1df]">
              <span className="font-body text-xs tracking-[0.3em]">
                {pad2(index + 1)} / {pad2(n)}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close viewer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-2xl"
                style={{ border: "1px solid rgba(212,174,94,0.6)" }}
              >
                ×
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-3">
              <div className="gfs-pic flex h-full w-full items-center justify-center">
                <div
                  key={index}
                  className="gfs-swap max-h-full w-full overflow-hidden"
                  style={{
                    aspectRatio: current.ratio,
                    maxHeight: "100%",
                    borderRadius: u(4),
                    boxShadow: `0 0 0 1px rgba(212,174,94,0.55), 0 ${u(16)} ${u(40)} rgba(0,0,0,0.5)`,
                  }}
                >
                  <Tile p={current} fit="contain" />
                </div>
              </div>
            </div>

            <p key={`c${index}`} className="gfs-swap px-4 pb-2 text-center font-serif text-[24px] italic text-[#fbf1df]">
              {current.caption}
            </p>

            {n > 1 && (
              <div className="flex justify-between px-4 pb-6">
                {([-1, 1] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => step(d)}
                    aria-label={d < 0 ? "Previous photo" : "Next photo"}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[#fbf1df]"
                    style={{ border: "1px solid rgba(212,174,94,0.6)" }}
                  >
                    <Chevron dir={d} />
                  </button>
                ))}
              </div>
            )}
          </div>,
          host,
        )}
    </section>
  );
}
