import { useEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { useInView } from "../Layout/Reveal";
import { Details, fmtTime, type Palette } from "./eventParts";
import GatewayArch from "./GatewayArch";

/**
 * Wedding celebrations as a horizontal carousel of Gateway-of-India style arches.
 * Swipe (native scroll-snap) or use the arrows / dots. The centre card is full size, its
 * neighbours sit at 0.92 and stay partly visible. On first view every arch is revealed through a
 * watercolour wash, a gold outline draws itself, the picture fades in and the details follow.
 * The active event's description, dress code and directions are shown under the carousel.
 */

const CARD = 272; // card width in design px
const GAP = 6;
const SLIDE_MS = 650;
const PALETTE: Palette = { ink: "#4a1a16", accent: "#7a1420", label: "#8a5f15", body: "#4a1a16", dotRing: "#b8862f" };
const MAROON = "#6d0f1b";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const u = (n: number) => `calc(var(--u) * ${n})`;

const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: wedding.timeZone }).format(new Date(iso));

const EVC_CSS = `
.evc-card { transition: transform ${SLIDE_MS}ms cubic-bezier(.45,0,.55,1), opacity ${SLIDE_MS}ms cubic-bezier(.45,0,.55,1); transform-origin: 50% 60%; }
.evc-illu, .evc-toran { transform-box: fill-box; }
.evc-illu { transform-origin: 50% 40%; }
.evc-toran { transform-origin: 50% 0%; }
@keyframes evc-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes evc-illu { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
@keyframes evc-up { from { opacity: 0; transform: translateY(calc(var(--u) * 8)); } to { opacity: 1; transform: none; } }
@keyframes evc-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes evc-sway { from { transform: rotate(-1.1deg); } to { transform: rotate(1.1deg); } }
.evc-outline path { stroke-dasharray: 1; stroke-dashoffset: 0; }
@media (prefers-reduced-motion: no-preference) {
  .evc-root .evc-wash { -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 62%, #000 var(--r), transparent calc(var(--r) + 22%)); mask-image: radial-gradient(ellipse 75% 70% at 50% 62%, #000 var(--r), transparent calc(var(--r) + 22%)); }
  .evc-root .evc-outline path { stroke-dashoffset: 1; }
  .evc-root .evc-illu, .evc-root .evc-txt > *, .evc-root .evc-toran { opacity: 0; }
  .evc-root.is-seen .evc-wash { animation: smoke-grow 900ms ease-in-out both; }
  .evc-root.is-seen .evc-outline path { animation: evc-draw 800ms ease-in-out 700ms both; }
  .evc-root.is-seen .evc-illu { animation: evc-illu 600ms ease-in-out 1150ms both; }
  .evc-root.is-seen .evc-toran { animation: evc-fade 500ms ease-in-out 1500ms both, evc-sway 5.5s ease-in-out 2000ms infinite alternate; }
  .evc-root.is-seen .evc-txt > * { animation: evc-up 500ms ease-in-out calc(1500ms + var(--i) * 150ms) both; }
  .evc-detail { animation: evc-fade 450ms ease-in-out both; }
}
`;

function Lotus({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 18" style={{ width: u(size), height: u(size * 0.56) }} fill="#b8862f" aria-hidden>
      <path d="M16 1c3 3 4 8 0 13-4-5-3-10 0-13Z" />
      <path d="M16 14c-2-5-6-8-11-8 1 5 5 8 11 8Zm0 0c2-5 6-8 11-8-1 5-5 8-11 8Z" opacity=".85" />
      <path d="M16 15c-5 0-10-1-14-4 3 4 8 6 14 6s11-2 14-6c-4 3-9 4-14 4Z" opacity=".7" />
    </svg>
  );
}

function Rule({ w = 120 }: { w?: number }) {
  return (
    <div className="mx-auto flex items-center justify-center gap-2" style={{ width: u(w * 2) }} aria-hidden>
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #b8862f)" }} />
      <Lotus />
      <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, #b8862f)" }} />
    </div>
  );
}

function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 14" className={`h-[12px] w-[44px] shrink-0 ${flip ? "-scale-x-100" : ""}`} fill="none" stroke="#b8862f" strokeWidth="1" aria-hidden>
      <path d="M2 7h34" />
      <path d="M36 7c4-5 10-5 12 0-2 5-8 5-12 0Z" fill="#b8862f" fillOpacity=".25" />
      <circle cx="54" cy="7" r="2" fill="#b8862f" />
    </svg>
  );
}

function Arrow({ dir, onClick, disabled }: { dir: -1 | 1; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? "Previous event" : "Next event"}
      className="btn-gold !absolute top-[38%] z-10 h-[40px] w-[40px] -translate-y-1/2 !px-0 disabled:!opacity-0"
      style={{ [dir < 0 ? "left" : "right"]: u(6) } as CSSProperties}
    >
      <svg viewBox="0 0 16 16" className="h-[14px] w-[14px] !text-[#6d0f1b]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir < 0 ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"} />
      </svg>
    </button>
  );
}

export default function Events() {
  const { guestName, isPersonalised } = useGuest();
  const events = wedding.events;
  const [rootRef, seen] = useInView<HTMLDivElement>(0.25);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const anim = useRef<number | null>(null);

  // distance between two card centres
  const step = () => {
    const t = trackRef.current;
    const card = t?.querySelector<HTMLElement>(".evc-slot");
    return card ? card.offsetWidth + parseFloat(getComputedStyle(t!).columnGap || "0") : 1;
  };

  // which card is centred, from the scroll position (works for swipes and for our own glides)
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(Math.max(0, Math.min(events.length - 1, Math.round(t.scrollLeft / step())))));
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      t.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [events.length]);

  /** arrows, dots and taps on a neighbour: a 650 ms ease-in-out glide (snap paused meanwhile) */
  const goTo = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const target = Math.max(0, Math.min(events.length - 1, i)) * step();
    if (anim.current) cancelAnimationFrame(anim.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      t.scrollLeft = target;
      return;
    }
    const from = t.scrollLeft;
    const t0 = performance.now();
    t.style.scrollSnapType = "none";
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / SLIDE_MS);
      t.scrollLeft = from + (target - from) * ease(p);
      if (p < 1) anim.current = requestAnimationFrame(tick);
      else {
        t.style.scrollSnapType = "";
        anim.current = null;
      }
    };
    anim.current = requestAnimationFrame(tick);
  };

  const cur = events[Math.min(active, events.length - 1)];

  return (
    <section id="events" aria-labelledby="events-title" className="relative py-6">
      <style>{EVC_CSS}</style>

      {/* heading */}
      <div className="px-5 text-center">
        <Rule w={70} />
        <div className="mt-2 flex items-center justify-center gap-2">
          <Flourish />
          <h2 id="events-title" className="whitespace-nowrap text-[22px] font-bold uppercase leading-tight tracking-[0.06em]" style={{ fontFamily: SERIF, color: MAROON }}>
            Our Wedding
            <br />
            Celebrations
          </h2>
          <Flourish flip />
        </div>
        <p className="mx-auto mt-2 max-w-[17rem] font-body text-[14px] text-espresso/75">
          {isPersonalised ? (
            <>
              <span className="guest-name">{guestName}</span>, swipe to see how we celebrate.
            </>
          ) : (
            "Swipe to see how we celebrate."
          )}
        </p>
      </div>

      {/* carousel */}
      <div ref={rootRef} className={`evc-root relative mt-5 ${seen ? "is-seen" : ""}`}>
        {/* soft watercolour wash behind the arches */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[6%] h-[70%]"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(233,201,150,0.35), rgba(233,201,150,0) 70%)" }}
        />
        <div
          ref={trackRef}
          className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          style={{ columnGap: u(GAP), paddingInline: `calc(50% - ${u(CARD / 2)})`, paddingBottom: u(46) }}
          role="list"
          aria-label="Wedding events"
        >
          {events.map((e, i) => {
            const isActive = i === active;
            return (
              <article
                key={e.id}
                role="listitem"
                aria-labelledby={`evc-${e.id}`}
                aria-current={isActive ? "true" : undefined}
                className="evc-slot shrink-0 snap-center"
                style={{ width: u(CARD) }}
                onClick={() => !isActive && goTo(i)}
              >
                <div className="evc-card relative" style={{ transform: isActive ? "none" : "scale(0.92)", opacity: isActive ? 1 : 0.72 }}>
                  <GatewayArch id={e.id} image={e.image} alt={`${e.name} illustration`} />

                  {/* details plaque in front of the lower arch */}
                  <div
                    className="evc-txt absolute left-[12%] right-[12%] top-[67%] px-3 pb-3 pt-4 text-center"
                    style={{
                      background: "linear-gradient(180deg, #fffaf0 0%, #f7ead0 100%)",
                      border: `${u(1)} solid #c9a056`,
                      borderRadius: "50% 50% 10px 10px / 26% 26% 10px 10px",
                      boxShadow: `inset 0 0 0 ${u(3)} #fffaf0, inset 0 0 0 ${u(4)} rgba(201,160,86,0.45), 0 ${u(4)} ${u(12)} rgba(90,50,10,0.18)`,
                    }}
                  >
                    <p lang="mr" className="font-marathi text-[14px] leading-tight" style={{ color: "#a2520a", "--i": 0 } as CSSProperties}>
                      {e.marathi}
                    </p>
                    <h3 id={`evc-${e.id}`} className="mt-0.5 flex items-center justify-center gap-1.5 text-[25px] font-semibold leading-[1.05]" style={{ fontFamily: SERIF, color: MAROON, "--i": 1 } as CSSProperties}>
                      <span aria-hidden className="text-[12px] text-[#b8862f]">✥</span>
                      {e.name}
                      <span aria-hidden className="text-[12px] text-[#b8862f]">✥</span>
                    </h3>
                    <p className="mt-1.5 flex items-center justify-center gap-1.5 font-body text-[13px] font-bold" style={{ color: "#4a1a16", "--i": 2 } as CSSProperties}>
                      <svg viewBox="0 0 16 16" className="h-[14px] w-[14px] shrink-0" fill="none" stroke={MAROON} strokeWidth="1.5" aria-hidden>
                        <rect x="2" y="3" width="12" height="11" rx="1.5" />
                        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
                      </svg>
                      <time dateTime={e.start}>
                        {shortDay(e.start)} · {fmtTime(e.start).toUpperCase()}
                      </time>
                    </p>
                    <p className="mt-1 flex items-start justify-center gap-1.5 text-[14.5px] font-semibold leading-snug" style={{ fontFamily: SERIF, color: "#4a1a16", "--i": 3 } as CSSProperties}>
                      <svg viewBox="0 0 16 16" className="mt-[3px] h-[13px] w-[13px] shrink-0" fill={MAROON} aria-hidden>
                        <path d="M8 15s5-4.5 5-8.5a5 5 0 1 0-10 0C3 10.5 8 15 8 15Zm0-6.6a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" />
                      </svg>
                      <span className="line-clamp-2">{e.venue}</span>
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Arrow dir={-1} onClick={() => goTo(active - 1)} disabled={active === 0} />
        <Arrow dir={1} onClick={() => goTo(active + 1)} disabled={active === events.length - 1} />

        {/* dots */}
        <div className="relative mt-1 flex justify-center gap-1" role="tablist" aria-label="Choose an event">
          {events.map((e, i) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${e.name}`}
              onClick={() => goTo(i)}
              className="flex h-[22px] w-[22px] items-center justify-center"
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{ width: u(i === active ? 10 : 8), height: u(i === active ? 10 : 8), background: i === active ? MAROON : "#d9bf8a" }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* the centred event's full details (content unchanged from the schedule) */}
      <div key={cur.id} className="evc-detail mx-auto mt-3 max-w-[330px] px-6" aria-live="polite">
        <p className="text-center font-serif text-[17px] font-semibold italic" style={{ color: "#a2520a" }}>
          {cur.tagline}
        </p>
        <Details e={cur} p={PALETTE} center />
      </div>

      <div className="mt-6">
        <Rule w={70} />
      </div>
    </section>
  );
}
