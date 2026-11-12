import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "../Layout/Reveal";
import { wedding } from "../../config/wedding";
import { sound, useSoundState } from "../../lib/sound";
import { weddingAudio } from "./weddingAudio";

const u = (n: number) => `calc(var(--u) * ${n})`;

/** small antique-gold heart */
function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="std-heart-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2b65a" />
          <stop offset="1" stopColor="#9a6a1c" />
        </linearGradient>
      </defs>
      <path d="M12 20.5s-8.3-5.2-10.4-10.2C.1 5.9 3.6 1.7 7.7 2.7c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1 7.6 3.2 6.1 7.6C20.3 15.3 12 20.5 12 20.5Z" fill="url(#std-heart-g)" stroke="#7a4d10" strokeWidth=".8" />
      <path d="M7 6.2c-1.4.3-2.4 1.6-2.3 3" stroke="#fff3cf" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".8" />
    </svg>
  );
}

// heart timing (ms after the section enters the viewport)
const T_HEART_IN = 1150; // starts once the page has unfolded
const T_TRAVEL = 2000; // 1.8 - 2.2 s across the dates
const HEART_LIFT = 24; // design px above the centre of the date cell

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
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flyRef = useRef<HTMLDivElement>(null);
  // idle -> flying (overlay heart travels the grid) -> landed (heart sits inside the date cell)
  const [heart, setHeart] = useState<"idle" | "flying" | "landed">("idle");

  // the heart wanders across the dates, slows down and settles above the wedding day.
  // Every point is measured from the rendered grid cells, so it lands right on any screen size.
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setHeart("landed");
      return;
    }
    let raf = 0;
    let guard = 0;
    const start = window.setTimeout(() => {
      const grid = gridRef.current;
      if (!grid) return setHeart("landed");
      const unit = parseFloat(getComputedStyle(grid).getPropertyValue("--u")) || 1;
      const g = grid.getBoundingClientRect();
      const centre = (i: number) => {
        const r = cellRefs.current[i]?.getBoundingClientRect();
        return r ? { x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2 - HEART_LIFT * unit } : null;
      };
      const first = cal.cells.indexOf(1);
      const target = cal.cells.indexOf(cal.day);
      // one date in each week row, wandering left and right, ending on the wedding day
      const idx = [first];
      const firstRow = Math.floor(first / 7);
      for (let row = firstRow + 1; row < Math.floor(target / 7); row++) idx.push(row * 7 + ((row - firstRow) % 2 ? 5 : 1));
      if (target !== first) idx.push(target);
      const pts = idx.map(centre).filter((p): p is { x: number; y: number } => !!p);
      if (pts.length < 2) return setHeart("landed");

      // Catmull-Rom curve through the waypoints
      const at = (t: number) => {
        const n = pts.length - 1;
        const seg = Math.min(n - 1, Math.floor(t * n));
        const l = t * n - seg;
        const p0 = pts[Math.max(0, seg - 1)], p1 = pts[seg], p2 = pts[seg + 1], p3 = pts[Math.min(n, seg + 2)];
        const c = (a: number, b: number, cc: number, d: number) =>
          0.5 * (2 * b + (-a + cc) * l + (2 * a - 5 * b + 4 * cc - d) * l * l + (-a + 3 * b - 3 * cc + d) * l * l * l);
        return { x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) };
      };

      setHeart("flying");
      const t0 = performance.now();
      const step = (now: number) => {
        const fly = flyRef.current;
        const k = Math.min(1, (now - t0) / T_TRAVEL);
        const e = 1 - Math.pow(1 - k, 2.6); // brisk start, gentle slowdown into the date
        const p = at(e);
        const tilt = Math.sin(e * Math.PI * (pts.length - 1)) * 10 * (1 - k);
        if (fly) {
          fly.style.transform = "translate(" + p.x + "px, " + p.y + "px) translate(-50%, -50%) rotate(" + tilt + "deg)";
          fly.style.opacity = String(Math.min(1, k * 6));
        }
        if (k < 1) raf = requestAnimationFrame(step);
        else setHeart("landed");
      };
      raf = requestAnimationFrame(step);
      // if animation frames are paused (background tab), still end on the date
      guard = window.setTimeout(() => setHeart("landed"), T_TRAVEL + 400);
    }, T_HEART_IN);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.clearTimeout(guard);
    };
  }, [seen, cal]);

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

            <div ref={gridRef} className="relative grid grid-cols-7 gap-y-1" role="grid" aria-label={`${cal.monthName} ${cal.year}`}>
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="pb-1 font-body text-[11px] font-bold tracking-[0.1em] text-[#7a1420]/80" aria-hidden="true">
                  {w}
                </div>
              ))}
              {heart === "flying" && (
                <div ref={flyRef} className="pointer-events-none absolute left-0 top-0 z-[3]" style={{ opacity: 0 }}>
                  <Heart className="block h-[15px] w-[16px] drop-shadow-[0_1px_2px_rgba(90,50,10,0.35)]" />
                </div>
              )}
              {cal.cells.map((d, i) => {
                const isDay = d === cal.day;
                return (
                  <div key={i} ref={(el) => { cellRefs.current[i] = el; }} className="relative flex h-[34px] items-center justify-center">
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
                    {isDay && heart === "landed" && (
                      <span className="std-heart-home pointer-events-none absolute left-1/2 top-1/2 z-[2] block leading-none">
                        <Heart className="std-heart-pulse block h-[15px] w-[16px]" />
                      </span>
                    )}
                    {isDay && (
                      <svg className={`std-ring pointer-events-none absolute${heart === "landed" ? " std-ring-on" : ""}`} viewBox="0 0 60 50" aria-hidden="true">
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
      <div className={`mt-5${heart === "landed" ? " std-done" : ""}`}>
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
.std-details { opacity: 0; transform: translateY(calc(var(--u) * 10)); }
.std-date { opacity: 0; clip-path: inset(0 100% 0 0); }
/* the landed heart: centred on the date cell, lifted above the number */
.std-heart-home { transform: translate(-50%, calc(-50% - var(--u) * 24)); }
.std-heart-pulse { transform-origin: 50% 60%; }

.std-on .std-page { animation: std-unfold 1100ms cubic-bezier(0.22, 0.8, 0.3, 1) both; }
/* after the heart lands: the gold circle draws (700 ms), the heart pulses once, then the date line */
.std-ring-on path { animation: std-draw 700ms cubic-bezier(0.55, 0.1, 0.35, 1) 80ms both; }
.std-ring-on .std-tail { animation-duration: 250ms; animation-delay: 700ms; }
.std-on .std-ring-on ~ .std-day, .std-on .std-day { animation: std-ink 600ms ease-out 3200ms both; }
.std-heart-pulse { animation: std-pulse 650ms ease-in-out 850ms 1 both; }
.std-done .std-date { animation: std-write 1100ms cubic-bezier(0.45, 0, 0.25, 1) 1300ms both; }
.std-done .std-details { animation: std-rise 800ms ease-out 2300ms both; }

@keyframes std-unfold {
  0% { opacity: 0; transform: rotateX(-88deg); }
  25% { opacity: 1; }
  100% { opacity: 1; transform: rotateX(0deg); }
}
@keyframes std-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes std-ink { from { color: #4a1a16; } to { color: #6d0f1b; } }
@keyframes std-pulse { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.28); } }
@keyframes std-write { from { opacity: 1; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes std-rise { from { opacity: 0; transform: translateY(calc(var(--u) * 14)); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .std-page, .std-details, .std-date { opacity: 1; transform: none; clip-path: none; animation: none !important; }
  .std-heart-pulse { animation: none !important; }
  .std-ring path { stroke-dashoffset: 0; animation: none !important; }
  .std-day { animation: none !important; }
}
`;
