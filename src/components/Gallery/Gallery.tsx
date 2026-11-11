import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

type Photo = (typeof wedding.gallery)[number];

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
    >
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-ivory/60" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <path d="M20 6c4 5 4 11 0 16-4-5-4-11 0-16Z" />
        <path d="M20 22c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
      </svg>
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

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="px-4 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Moments</p>
        <h2 id="gallery-title" className="mt-2 text-5xl">Our Gallery</h2>
      </Reveal>

      <div className="mt-10 columns-2 gap-3">
        {photos.map((p, i) => (
          <Reveal key={p.alt} from="zoom" delay={(i % 2) * 120} className="mb-3 break-inside-avoid">
            <button
              onClick={(e) => open(i, e.currentTarget)}
              className="group relative block w-full overflow-hidden rounded-md border border-gold/40"
              style={{ aspectRatio: p.ratio }}
              aria-label={`Open photo: ${p.alt}`}
            >
              <Tile p={p} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-6 text-left font-script text-xl text-ivory">
                {p.caption}
              </span>
            </button>
          </Reveal>
        ))}
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
