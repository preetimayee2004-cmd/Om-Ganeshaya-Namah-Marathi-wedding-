import { useEffect, useState } from "react";
import { useInView } from "../Layout/Reveal";
import { wedding } from "../../config/wedding";

const u = (n: number) => `calc(var(--u) * ${n})`;

type Left = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function timeLeft(target: number): Left {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms <= 0,
  };
}

function useCountdown() {
  const target = new Date(wedding.date).getTime();
  const [left, setLeft] = useState(() => timeLeft(target));
  useEffect(() => {
    if (left.done) return;
    const id = window.setInterval(() => {
      const next = timeLeft(target);
      setLeft(next);
      if (next.done) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [target, left.done]);
  return left;
}

/** Swastik drawn in gold thread */
function Swastik({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 40" style={{ width: u(size), height: u(size) }} aria-hidden="true">
      <g fill="none" stroke="#E2BC6A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 V34 M6 20 H34" />
        <path d="M20 6 H31 M34 20 V31 M20 34 H9 M6 20 V9" />
      </g>
      <g fill="#E2BC6A">
        <circle cx="13" cy="13" r="1.8" />
        <circle cx="27" cy="13" r="1.8" />
        <circle cx="13" cy="27" r="1.8" />
        <circle cx="27" cy="27" r="1.8" />
      </g>
    </svg>
  );
}

/** Mangal kalash with mango leaves and coconut, in gold thread */
function Kalash({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 60 64" style={{ width: u(size), height: u(size * (64 / 60)) }} aria-hidden="true">
      <g fill="none" stroke="#E2BC6A" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        {/* leaves */}
        <path d="M30 20 C22 14 13 14 8 18 C14 21 22 22 30 20 Z" />
        <path d="M30 20 C38 14 47 14 52 18 C46 21 38 22 30 20 Z" />
        <path d="M30 20 C26 12 20 8 15 8 C18 14 24 18 30 20 Z" />
        <path d="M30 20 C34 12 40 8 45 8 C42 14 36 18 30 20 Z" />
        {/* coconut */}
        <path d="M23 18 C23 9 37 9 37 18" />
        <path d="M30 4 V9" />
        {/* neck + pot */}
        <path d="M22 22 H38 M24 22 V26 M36 22 V26 M20 26 H40" />
        <path d="M20 26 C8 32 8 52 22 58 H38 C52 52 52 32 40 26" />
        <path d="M14 40 H46" />
        <path d="M20 58 L18 62 H42 L40 58" />
      </g>
      <g fill="#E2BC6A">
        <circle cx="22" cy="46" r="1.6" />
        <circle cx="30" cy="48" r="1.6" />
        <circle cx="38" cy="46" r="1.6" />
      </g>
    </svg>
  );
}

/** The whole antarpat artwork; each half shows one side of it so the motif splits down the middle. */
function Cloth() {
  return (
    <div className="apc-cloth absolute inset-0 flex flex-col items-center justify-center">
      <div className="apc-border pointer-events-none absolute" />
      <div className="apc-stitch pointer-events-none absolute" />
      <Swastik size={34} />
      <p
        lang="mr"
        className="apc-embroidery mt-3 whitespace-nowrap font-marathi text-[24px] font-bold leading-tight text-[#E8C470]"
      >
        शुभमंगल सावधान
      </p>
      <div className="mt-3">
        <Kalash size={50} />
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function AntarpatCountdown() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const left = useCountdown();

  const units: [string, number][] = [
    ["Days", left.days],
    ["Hours", left.hours],
    ["Minutes", left.minutes],
    ["Seconds", left.seconds],
  ];

  return (
    <div ref={ref} className={`apc-root text-center ${seen ? "apc-on" : ""}`}>
      <style>{STYLES}</style>

      <p lang="mr" className="font-marathi text-[15px] font-semibold text-[#7a1420]">
        अंतरपाट
      </p>
      <h3 className="mt-1 font-serif text-[26px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#6d0f1b]">
        The Countdown
      </h3>
      <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />

      <div className="apc-panel relative mx-auto mt-4 w-full max-w-[310px] overflow-hidden rounded-[10px]">
        {/* revealed: the live countdown on ivory paper */}
        <div className="apc-reveal flex h-full flex-col items-center justify-center px-3">
          {left.done ? (
            <p className="px-2 font-serif text-[22px] font-semibold leading-snug text-[#6d0f1b]">
              {wedding.countdownDoneMessage}
            </p>
          ) : (
            <>
              <div className="grid w-full grid-cols-4" role="timer" aria-live="off">
                {units.map(([label, value], i) => (
                  <div key={label} className={`flex flex-col items-center ${i ? "apc-sep" : ""}`}>
                    <span className="font-serif text-[40px] font-semibold leading-none tabular-nums text-[#6d0f1b]">
                      {label === "Days" ? value : pad(value)}
                    </span>
                    <span className="mt-2 font-body text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8862f]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mx-auto my-4 h-px w-3/5 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />
              <p className="font-body text-[13px] text-[#4a1a16]">until the sacred moment</p>
            </>
          )}
        </div>

        {/* the two halves of the antarpat */}
        <div className="apc-half apc-left absolute inset-y-0 left-0 w-1/2 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 w-[200%]">
            <Cloth />
          </div>
        </div>
        <div className="apc-half apc-right absolute inset-y-0 right-0 w-1/2 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 w-[200%]">
            <Cloth />
          </div>
        </div>
      </div>
    </div>
  );
}

const STYLES = `
.apc-panel {
  height: calc(var(--u) * 230);
  background: linear-gradient(180deg, #fbf1df, #f6e6c8);
  box-shadow: inset 0 0 0 1px rgba(201, 150, 58, 0.55), 0 calc(var(--u) * 8) calc(var(--u) * 22) rgba(74, 26, 22, 0.14);
}
.apc-sep { border-left: 1px solid rgba(201, 150, 58, 0.45); }

.apc-cloth {
  background:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.05) calc(var(--u) * 9), rgba(0, 0, 0, 0.07) calc(var(--u) * 18), rgba(255, 255, 255, 0) calc(var(--u) * 26)),
    radial-gradient(120% 90% at 50% 40%, #8e1a28 0%, #7a1420 45%, #5a0c16 100%);
}
.apc-border {
  inset: calc(var(--u) * 8);
  border: calc(var(--u) * 5) solid #C9963A;
  border-radius: calc(var(--u) * 4);
  background: transparent;
  box-shadow: inset 0 0 0 1px #f0d48a, 0 0 0 1px #8a5f1c;
}
.apc-stitch {
  inset: calc(var(--u) * 18);
  border: 1px dashed rgba(232, 196, 112, 0.7);
  border-radius: calc(var(--u) * 2);
}
.apc-embroidery {
  text-shadow: 0 1px 0 #7a5212, 0 -1px 0 rgba(255, 236, 180, 0.35), 0 0 calc(var(--u) * 6) rgba(0, 0, 0, 0.35);
}
.apc-half { will-change: transform; }
.apc-left::after, .apc-right::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: calc(var(--u) * 10); pointer-events: none;
}
.apc-left::after { right: 0; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.22)); }
.apc-right::after { left: 0; background: linear-gradient(270deg, transparent, rgba(0, 0, 0, 0.22)); }
.apc-reveal { opacity: 0; transform: scale(0.98); }

.apc-on .apc-left { animation: apc-open-left 1400ms cubic-bezier(0.65, 0, 0.35, 1) 450ms both; }
.apc-on .apc-right { animation: apc-open-right 1400ms cubic-bezier(0.65, 0, 0.35, 1) 450ms both; }
.apc-on .apc-reveal { animation: apc-reveal 700ms ease-out 1050ms both; }

@keyframes apc-open-left {
  from { transform: translateX(0) scaleX(1); transform-origin: 0 50%; }
  to { transform: translateX(-100%) scaleX(0.55); transform-origin: 0 50%; }
}
@keyframes apc-open-right {
  from { transform: translateX(0) scaleX(1); transform-origin: 100% 50%; }
  to { transform: translateX(100%) scaleX(0.55); transform-origin: 100% 50%; }
}
@keyframes apc-reveal { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .apc-half { display: none; }
  .apc-reveal { opacity: 1; transform: none; animation: none !important; }
}
`;
