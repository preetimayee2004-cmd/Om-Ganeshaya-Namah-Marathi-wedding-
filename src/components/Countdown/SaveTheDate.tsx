import { useEffect, useMemo, useRef } from "react";
import { useInView } from "../Layout/Reveal";
import { wedding } from "../../config/wedding";
import { sound, useSoundState } from "../../lib/sound";
import { weddingAudio } from "./weddingAudio";

const u = (n: number) => `calc(var(--u) * ${n})`;

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

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

export default function SaveTheDate() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const { started } = useSoundState();
  const startedRef = useRef(started);
  startedRef.current = started;
  const cal = useWeddingCalendar();

  // one soft temple bell as the gold flourish circles the date (only if the guest has sound on)
  useEffect(() => {
    if (!seen) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      if (startedRef.current && !sound.isMuted()) weddingAudio.playTempleBell();
    }, reduce ? 0 : 1150);
    return () => window.clearTimeout(t);
  }, [seen]);

  return (
    <div ref={ref} className={`std-root text-center ${seen ? "std-on" : ""}`}>
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

      {/* the calendar page, unfolding from its top binding */}
      <div className="std-stage mx-auto mt-3 w-full max-w-[300px]">
        <div className="std-binding relative mx-auto h-[14px] rounded-t-[6px] bg-gradient-to-b from-[#7a1420] to-[#5a0c16]">
          {[0.22, 0.78].map((x) => (
            <span
              key={x}
              className="absolute top-[-6px] h-[14px] w-[8px] rounded-full border-2 border-[#C9963A] bg-[#fbf1df]"
              style={{ left: `calc(${x * 100}% - ${u(4)})` }}
            />
          ))}
        </div>

        <div className="std-page relative rounded-b-[6px] bg-gradient-to-b from-[#fbf1df] to-[#f6e6c8] px-4 pb-5 pt-4 text-[#4a1a16]">
          <div className="pointer-events-none absolute inset-[6px] rounded-[3px] border border-[#C9963A]/60" />

          <div className="relative">
            <p className="font-serif text-[22px] font-semibold uppercase tracking-[0.18em] text-[#6d0f1b]">
              {cal.monthName}
            </p>
            <p className="font-body text-[12px] font-bold tracking-[0.3em] text-[#b8862f]">{cal.year}</p>
            <div className="mx-auto my-3 h-px w-3/4 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />

            <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={`${cal.monthName} ${cal.year}`}>
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="pb-1 font-body text-[11px] font-bold tracking-[0.1em] text-[#7a1420]/80" aria-hidden="true">
                  {w}
                </div>
              ))}
              {cal.cells.map((d, i) => {
                const isDay = d === cal.day;
                return (
                  <div key={i} className="relative flex h-[34px] items-center justify-center">
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* the date line, weekday and muhurat */}
      <div className="std-details mt-5">
        <p className="font-serif text-[26px] font-semibold leading-tight text-[#6d0f1b]">{cal.dateLine}</p>
        <p className="mt-1 font-body text-[13px] font-bold uppercase tracking-[0.28em] text-[#b8862f]">{cal.weekday}</p>
        <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />
        <p className="font-body text-[14px] text-[#4a1a16]">
          <span lang="mr" className="font-marathi font-semibold">शुभ मुहूर्त</span>
          <span className="mx-2 text-[#C9963A]">•</span>
          <span className="font-bold">{cal.time}</span>
        </p>
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

const STYLES = `
.std-stage { perspective: calc(var(--u) * 900); }
.std-page {
  transform-origin: 50% 0;
  box-shadow: 0 calc(var(--u) * 10) calc(var(--u) * 24) rgba(74, 26, 22, 0.16), 0 1px 2px rgba(74, 26, 22, 0.12);
  opacity: 0;
  transform: rotateX(-88deg);
}
.std-ring {
  width: calc(var(--u) * 50);
  height: calc(var(--u) * 42);
  left: 50%; top: 50%;
  transform: translate(-50%, -50%) rotate(-6deg);
}
.std-ring path { stroke-dasharray: 1; stroke-dashoffset: 1; }
.std-details { opacity: 0; transform: translateY(calc(var(--u) * 14)); }

.std-on .std-page { animation: std-unfold 1100ms cubic-bezier(0.22, 0.8, 0.3, 1) both; }
.std-on .std-ring path { animation: std-draw 900ms cubic-bezier(0.55, 0.1, 0.35, 1) 1150ms both; }
.std-on .std-ring .std-tail { animation-duration: 300ms; animation-delay: 1950ms; }
.std-on .std-day { animation: std-ink 600ms ease-out 1300ms both; }
.std-on .std-details { animation: std-rise 800ms ease-out 2000ms both; }

@keyframes std-unfold {
  0% { opacity: 0; transform: rotateX(-88deg); }
  25% { opacity: 1; }
  100% { opacity: 1; transform: rotateX(0deg); }
}
@keyframes std-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes std-ink { from { color: #4a1a16; } to { color: #6d0f1b; } }
@keyframes std-rise { from { opacity: 0; transform: translateY(calc(var(--u) * 14)); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .std-page, .std-details { opacity: 1; transform: none; animation: none !important; }
  .std-ring path { stroke-dashoffset: 0; animation: none !important; }
  .std-day { animation: none !important; }
}
`;
