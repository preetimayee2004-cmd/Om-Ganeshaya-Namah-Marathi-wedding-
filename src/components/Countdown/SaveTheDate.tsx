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
          <stop offset="0" stopColor="#e8434f" />
          <stop offset="1" stopColor="#a3101f" />
        </linearGradient>
      </defs>
      <path d="M12 20.5s-8.3-5.2-10.4-10.2C.1 5.9 3.6 1.7 7.7 2.7c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1 7.6 3.2 6.1 7.6C20.3 15.3 12 20.5 12 20.5Z" fill="url(#std-heart-g)" stroke="#7a0c18" strokeWidth=".6" />
      <path d="M7 6.2c-1.4.3-2.4 1.6-2.3 3" stroke="#ffd6da" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".85" />
      <circle cx="16.6" cy="6.4" r=".9" fill="#ffe3e6" opacity=".75" />
    </svg>
  );
}

/*
 * Timeline after the calendar scrolls into view (all CSS, ~3.5 s, replays on every page load):
 *   0    - 1600  the page unrolls from its maroon binding; a soft roll-shadow rides the edge down;
 *                 month, weekdays and each week row fade in 30 ms apart; the rings swing ±3°
 *   1750 - 2270  a glossy red heart pops up behind the 28 (0 -> 1.28 -> 0.9 -> 1), the 28 turns
 *                 ivory on it, a ripple and three sparkles spread
 *   2350 - 2750  two heartbeat pulses; the date, weekday and muhurat fade up (done by ~3.1 s)
 */
const T = { pop: 1750, beat: 2350, date: 2500, details: 2650 };
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
    }, reduce ? 0 : T.pop);
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
                          {/* the heart: centred behind the 28, then pop / beat layers */}
                          <span className="std-heart-home pointer-events-none absolute left-1/2 top-1/2 z-0 block leading-none">
                            <span className="std-heart-drop block">
                              <span className="std-heart-float block">
                                <span className="std-heart-beat block">
                                  <Heart className="block h-[36px] w-[39px] drop-shadow-[0_2px_3px_rgba(120,10,20,0.35)]" />
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
.std-curl { height: calc(var(--u) * 18); opacity: 0;
  background: linear-gradient(180deg, rgba(120, 80, 30, 0) 0%, rgba(120, 80, 30, 0.22) 45%, #f3dfae 55%, #e7c98a 80%, rgba(120, 80, 30, 0) 100%);
  border-radius: 50% / 40%; }
.std-ripple { width: calc(var(--u) * 30); height: calc(var(--u) * 30); opacity: 0; transform: translate(-50%, -50%) scale(.4); }
.std-spark { opacity: 0; }
/* the heart's resting place: centred on the 28, lifted above the number */
.std-heart-home { transform: translate(-50%, -46%); }
.std-heart-drop, .std-heart-beat { transform-origin: 50% 55%; }

@media (prefers-reduced-motion: no-preference) {
  /* before the calendar is in view: rolled up, nothing below the binding */
  .std-page { clip-path: inset(0 0 100% 0); }
  .std-row, .std-heart-drop, .std-date, .std-details { opacity: 0; }

  /* 1. unroll */
  .std-on .std-page { animation: std-unroll 1500ms ${ROLL} 100ms both; }
  .std-on .std-curl { animation: std-curl 1500ms ${ROLL} 100ms both; }
  .std-on .std-row { animation: std-fade 420ms ease-out calc(250ms + var(--row) * ${ROW_STEP}ms) both; }
  .std-on .std-ring-hook { animation: std-swing 1200ms ease-in-out 100ms both; }

  /* 2. heart drops, bounces twice, squashes and stretches */
  .std-on .std-heart-drop { animation: std-pop 520ms cubic-bezier(.2,.9,.3,1) ${T.pop}ms both; }
  .std-on .std-day { animation: std-ink 260ms ease-out ${T.pop + 160}ms both; }
  .std-on .std-ripple { animation: std-ripple 650ms ease-out ${T.pop + 150}ms both; }
  .std-on .std-spark { animation: std-spark 600ms ease-out ${T.pop + 180}ms both; }
  .std-on .std-heart-beat { animation: std-beat 400ms ease-in-out ${T.beat}ms 2; }

  /* 3. the date, then a slow idle float */
  .std-on .std-date { animation: std-up 400ms ease-out ${T.date}ms both; }
  .std-on .std-details { animation: std-up 400ms ease-out ${T.details}ms both; }
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
@keyframes std-pop {
  0%   { opacity: 0; transform: scale(0) rotate(-10deg); }
  55%  { opacity: 1; transform: scale(1.28) rotate(4deg); }
  78%  { transform: scale(.9) rotate(-2deg); }
  100% { opacity: 1; transform: none; }
}
@keyframes std-ink { from { color: #6d0f1b; } to { color: #fff8ec; text-shadow: 0 1px 2px rgba(90, 0, 10, 0.45); } }
@keyframes std-ripple { 0% { opacity: .8; transform: translate(-50%, -50%) scale(.4); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(2); } }
@keyframes std-spark { 0% { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scale(.4); } 30% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) rotate(45deg) scale(1); } }
@keyframes std-beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes std-up { from { opacity: 0; transform: translateY(calc(var(--u) * 12)); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .std-day { color: #fff8ec; text-shadow: 0 1px 2px rgba(90, 0, 10, 0.45); } }
`;
