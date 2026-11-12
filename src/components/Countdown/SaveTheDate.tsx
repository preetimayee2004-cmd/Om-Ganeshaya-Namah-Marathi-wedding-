import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useScrollRoot } from "../Layout/ScrollRoot";
import { wedding } from "../../config/wedding";
import { sound, useSoundState } from "../../lib/sound";
import { weddingAudio } from "./weddingAudio";

const u = (n: number) => `calc(var(--u) * ${n})`;

/** small brown heart with a soft shine */
function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="std-heart-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5230" />
          <stop offset="1" stopColor="#6B3A1E" />
        </linearGradient>
      </defs>
      <path d="M12 20.5s-8.3-5.2-10.4-10.2C.1 5.9 3.6 1.7 7.7 2.7c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1 7.6 3.2 6.1 7.6C20.3 15.3 12 20.5 12 20.5Z" fill="url(#std-heart-g)" stroke="#4f2a14" strokeWidth=".8" />
      <path d="M7 6.2c-1.4.3-2.4 1.6-2.3 3" stroke="#f1d2b4" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".85" />
      <circle cx="16.6" cy="6.4" r=".9" fill="#f1d2b4" opacity=".6" />
    </svg>
  );
}

/*
 * Timeline after the calendar scrolls into view (all CSS, ~3.5 s, replays on every page load):
 *   0    - 1600  the page unrolls from its maroon binding; a soft roll-shadow rides the edge down;
 *                 month, weekdays and each week row fade in 30 ms apart; the rings swing ±3°
 *   1800 - 2470  a brown heart drops from above, tilting -12° -> +8° -> 0°, squashes on landing
 *   2470 - 3000  two small bounces settle it above the 28; the gold circle draws; a ripple spreads
 *   3000 - 3400  two heartbeat pulses; the date, weekday and muhurat fade up
 *   3500 ->      a slow 3 px idle float
 */
const T = { heart: 1800, land: 2470, beat: 3000, date: 3000, details: 3100, float: 3500 };
const HEART_LIFT = 22; // design px above the centre of the date cell (clear of the date above, resting on the ring)
const ROW_STEP = 30; // ms between rows fading in

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const CARD_GOLD = "linear-gradient(180deg, #FCEFCB 0%, #F3DB9C 55%, #F8E8BC 100%)"; // same as the event cards

/** Everything about the wedding day, read from wedding.date in wedding.timeZone (never hard-coded). */
function useWeddingCalendar() {
  return useMemo(() => {
    const when = new Date(wedding.date);
    const tz = wedding.timeZone;
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(when);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const year = get("year");
    const month = get("month"); // 1-12
    const day = get("day");
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells: (number | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);

    const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: tz, month: "long" }).format(when);
    const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long" }).format(when);
    const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(when);
    const dateLine = `${day} ${monthName} ${year}`;
    return { year, month, day, monthName, weekday, time, dateLine, cells };
  }, []);
}

const row = (r: number) => ({ "--row": r } as CSSProperties);

/**
 * true once the calendar is really on screen. Waits for the opening to finish: while the intro
 * covers the page the couple hero takes no space, so the calendar would otherwise count as visible
 * and play its animation hidden behind the intro.
 */
function useCalendarInView(introActive: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const root = useScrollRoot();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || introActive) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { root: root ?? null, threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root, seen, introActive]);
  return [ref, seen] as const;
}

export default function SaveTheDate() {
  const { started, introActive } = useSoundState();
  const [ref, seen] = useCalendarInView(introActive);
  const startedRef = useRef(started);
  startedRef.current = started;
  const cal = useWeddingCalendar();

  // one soft temple bell as the heart lands (only if the guest has sound on)
  useEffect(() => {
    if (!seen) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      if (startedRef.current && !sound.isMuted()) weddingAudio.playTempleBell();
    }, reduce ? 0 : T.land);
    return () => window.clearTimeout(t);
  }, [seen]);

  return (
    <div className={`std-root text-center ${seen ? "std-on" : ""}`}>
      <style>{STYLES}</style>

      <p lang="mr" className="font-marathi text-[15px] font-semibold text-[#7a1420]">
        ॥ शुभ विवाह ॥
      </p>
      <h2 className="section-title mt-1 font-serif font-semibold uppercase tracking-[0.08em] text-[#6d0f1b]">
        Save the Date
      </h2>

      <img
        src={wedding.images.peacockBorder}
        alt=""
        aria-hidden="true"
        className="mx-auto mt-4 block w-full max-w-[220px] select-none opacity-90"
        draggable={false}
      />

      {/* the calendar: a rolled-up page that unrolls from its maroon binding */}
      <div ref={ref} className="std-stage relative mx-auto mt-3 w-full max-w-[300px]">
        <div className="std-binding relative z-[1] mx-auto h-[14px] rounded-t-[6px] bg-gradient-to-b from-[#7a1420] to-[#5a0c16]">
          {[0.22, 0.78].map((x) => (
            <span
              key={x}
              className="std-ring-hook absolute top-[-6px] h-[14px] w-[8px] rounded-full border-2 border-[#C9963A] bg-[#fbf1df]"
              style={{ left: `calc(${x * 100}% - ${u(4)})` }}
            />
          ))}
        </div>

        <div className="relative z-[3]">
          <div className="std-page relative rounded-b-[6px] px-4 pb-5 pt-4 text-[#4a1a16]" style={{ background: CARD_GOLD }}>
            <div className="pointer-events-none absolute inset-[6px] rounded-[3px] border border-[#D4AE5E]/80" />

            <div className="relative">
              <p className="std-row font-serif text-[22px] font-semibold uppercase tracking-[0.18em] text-[#6d0f1b]" style={row(0)}>
                {cal.monthName}
              </p>
              <p className="std-row font-body text-[12px] font-bold tracking-[0.3em] text-[#b8862f]" style={row(0)}>
                {cal.year}
              </p>
              <div className="std-row mx-auto my-3 h-px w-3/4 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" style={row(1)} />

              <div className="relative grid grid-cols-7 gap-y-1" role="grid" aria-label={`${cal.monthName} ${cal.year}`}>
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="std-row pb-1 font-body text-[11px] font-bold tracking-[0.1em] text-[#7a1420]/80" style={row(2)} aria-hidden="true">
                    {w}
                  </div>
                ))}
                {cal.cells.map((d, i) => {
                  const isDay = d === cal.day;
                  return (
                    <div key={i} className="std-row relative flex h-[34px] items-center justify-center" style={row(3 + Math.floor(i / 7))}>
                      {d !== null && (
                        <span
                          className={`relative z-[1] font-serif leading-none ${
                            isDay ? "std-day text-[21px] font-bold text-[#6d0f1b]" : "text-[16px] font-semibold text-[#4a1a16]/75"
                          }`}
                          aria-current={isDay ? "date" : undefined}
                        >
                          {d}
                        </span>
                      )}
                      {isDay && (
                        <>
                          <svg className="std-ring pointer-events-none absolute" viewBox="0 0 60 50" aria-hidden="true">
                            <path
                              d="M44 9 C33 2 12 5 6 19 C1 31 12 44 30 45 C47 46 57 35 55 22 C53 11 41 5 26 7"
                              fill="none"
                              stroke="#b8862f"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              pathLength={1}
                            />
                            <path d="M26 7 C22 8 19 10 17 13" fill="none" stroke="#C9963A" strokeWidth="1.6" strokeLinecap="round" pathLength={1} className="std-tail" />
                          </svg>
                          {/* ripple + sparkles where the heart lands */}
                          <span className="std-ripple pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-[#C9963A]" aria-hidden="true" />
                          {[-1, 0, 1].map((k) => (
                            <span
                              key={k}
                              className="std-spark pointer-events-none absolute left-1/2 top-1/2 h-[4px] w-[4px] rotate-45 bg-[#d9a441]"
                              style={{ "--sx": u(k * 16), "--sy": u(k === 0 ? -40 : -30) } as CSSProperties}
                              aria-hidden="true"
                            />
                          ))}
                          {/* the heart: home position above the 28, then drop / bounce / beat / float layers */}
                          <span className="std-heart-home pointer-events-none absolute left-1/2 top-1/2 z-[2] block leading-none">
                            <span className="std-heart-drop block">
                              <span className="std-heart-float block">
                                <span className="std-heart-beat block">
                                  <Heart className="block h-[15px] w-[16px] drop-shadow-[0_1px_2px_rgba(60,30,10,0.35)]" />
                                </span>
                              </span>
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* the paper roll: a soft curl shadow that rides the unrolling edge down and fades */}
          <span className="std-curl pointer-events-none absolute inset-x-[2px] top-0 z-[1] block" aria-hidden="true" />
        </div>
      </div>

      {/* the date line, weekday and muhurat */}
      <div className="mt-5">
        <p className="std-date font-script text-[38px] leading-tight text-[#6d0f1b]">{cal.dateLine}</p>
        <div className="std-details">
          <p className="mt-1 font-body text-[13px] font-bold uppercase tracking-[0.28em] text-[#b8862f]">{cal.weekday}</p>
          <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />
          <p className="font-body text-[14px] text-[#4a1a16]">
            <span lang="mr" className="font-marathi font-semibold">शुभ मुहूर्त</span>
            <span className="mx-2 text-[#C9963A]">•</span>
            <span className="font-bold">{cal.time}</span>
          </p>
        </div>
      </div>

      <img
        src={wedding.images.peacockBorder}
        alt=""
        aria-hidden="true"
        className="mx-auto mt-4 block w-full max-w-[220px] rotate-180 select-none opacity-90"
        draggable={false}
      />
    </div>
  );
}

const ROLL = "cubic-bezier(.22,.8,.3,1)";
const STYLES = `
.std-page { box-shadow: 0 calc(var(--u) * 10) calc(var(--u) * 24) rgba(74, 26, 22, 0.16), 0 1px 2px rgba(74, 26, 22, 0.12); }
.std-binding { box-shadow: 0 calc(var(--u) * 3) calc(var(--u) * 6) rgba(60, 10, 15, 0.28); }
.std-ring-hook { transform-origin: 50% 85%; }
.std-ring { width: calc(var(--u) * 50); height: calc(var(--u) * 42); left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-6deg); }
.std-ring path { stroke-dasharray: 1; stroke-dashoffset: 0; }
.std-curl { height: calc(var(--u) * 18); opacity: 0;
  background: linear-gradient(180deg, rgba(120, 80, 30, 0) 0%, rgba(120, 80, 30, 0.22) 45%, #f3dfae 55%, #e7c98a 80%, rgba(120, 80, 30, 0) 100%);
  border-radius: 50% / 40%; }
.std-ripple { width: calc(var(--u) * 30); height: calc(var(--u) * 30); opacity: 0; transform: translate(-50%, -50%) scale(.4); }
.std-spark { opacity: 0; }
/* the heart's resting place: centred on the 28, lifted above the number */
.std-heart-home { transform: translate(-50%, calc(-50% - var(--u) * ${HEART_LIFT})); }
.std-heart-drop, .std-heart-beat { transform-origin: 50% 90%; }

@media (prefers-reduced-motion: no-preference) {
  /* before the calendar is in view: rolled up, nothing below the binding */
  .std-page { clip-path: inset(0 0 100% 0); }
  .std-row, .std-heart-drop, .std-date, .std-details { opacity: 0; }
  .std-ring path { stroke-dashoffset: 1; }

  /* 1. unroll */
  .std-on .std-page { animation: std-unroll 1500ms ${ROLL} 100ms both; }
  .std-on .std-curl { animation: std-curl 1500ms ${ROLL} 100ms both; }
  .std-on .std-row { animation: std-fade 420ms ease-out calc(250ms + var(--row) * ${ROW_STEP}ms) both; }
  .std-on .std-ring-hook { animation: std-swing 1200ms ease-in-out 100ms both; }

  /* 2. heart drops, bounces twice, squashes and stretches */
  .std-on .std-heart-drop { animation: std-drop 1200ms linear ${T.heart}ms both; }
  .std-on .std-ring path { animation: std-draw 650ms cubic-bezier(.55,.1,.35,1) ${T.land - 20}ms both; }
  .std-on .std-ring .std-tail { animation-duration: 220ms; animation-delay: ${T.land + 600}ms; }
  .std-on .std-ripple { animation: std-ripple 650ms ease-out ${T.land}ms both; }
  .std-on .std-spark { animation: std-spark 600ms ease-out ${T.land + 40}ms both; }
  .std-on .std-heart-beat { animation: std-beat 400ms ease-in-out ${T.beat}ms 2; }

  /* 3. the date, then a slow idle float */
  .std-on .std-date { animation: std-up 400ms ease-out ${T.date}ms both; }
  .std-on .std-details { animation: std-up 400ms ease-out ${T.details}ms both; }
  .std-on .std-heart-float { animation: std-float 2800ms ease-in-out ${T.float}ms infinite; }
}

/* ends open above (and a little around) so the falling heart and the shadow are never clipped */
@keyframes std-unroll { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(calc(var(--u) * -440) -12% -12% -12%); } }
@keyframes std-curl {
  0% { top: 0; opacity: .95; transform: translateY(-50%) scaleY(1.2); }
  85% { opacity: .9; }
  100% { top: 100%; opacity: 0; transform: translateY(-50%) scaleY(.6); }
}
@keyframes std-fade { from { opacity: 0; transform: translateY(calc(var(--u) * -3)); } to { opacity: 1; transform: none; } }
@keyframes std-swing { 0% { transform: rotate(0); } 25% { transform: rotate(3deg); } 55% { transform: rotate(-3deg); } 80% { transform: rotate(1.5deg); } 100% { transform: rotate(0); } }
@keyframes std-drop {
  0%   { opacity: 0; transform: translateY(calc(var(--u) * -380)) rotate(-12deg); animation-timing-function: cubic-bezier(.5,0,.9,.6); }
  8%   { opacity: 1; }
  30%  { transform: translateY(calc(var(--u) * -230)) rotate(8deg); animation-timing-function: cubic-bezier(.4,0,1,1); }
  56%  { opacity: 1; transform: translateY(0) rotate(0) scale(1.08, .85); animation-timing-function: cubic-bezier(0,.5,.5,1); }
  68%  { transform: translateY(calc(var(--u) * -14)) scale(.95, 1.1); animation-timing-function: cubic-bezier(.5,0,1,.5); }
  79%  { transform: translateY(0) scale(1.04, .92); animation-timing-function: cubic-bezier(0,.5,.5,1); }
  87%  { transform: translateY(calc(var(--u) * -5)) scale(.98, 1.04); animation-timing-function: cubic-bezier(.5,0,1,.5); }
  94%  { transform: translateY(0) scale(1.02, .97); }
  100% { opacity: 1; transform: none; }
}
@keyframes std-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes std-ripple { 0% { opacity: .8; transform: translate(-50%, -50%) scale(.4); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(2); } }
@keyframes std-spark { 0% { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scale(.4); } 30% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) rotate(45deg) scale(1); } }
@keyframes std-beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes std-up { from { opacity: 0; transform: translateY(calc(var(--u) * 12)); } to { opacity: 1; transform: none; } }
@keyframes std-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(calc(var(--u) * -3)); } }
`;
