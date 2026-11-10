import { useEffect, useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import DateReveal from "./DateReveal";

const target = new Date(wedding.date).getTime();

function remaining(now: number) {
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return {
    done: diff === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown() {
  const [t, setT] = useState(() => remaining(Date.now()));
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (t.done) return;
    const id = window.setInterval(() => setT(remaining(Date.now())), 1000);
    return () => clearInterval(id);
  }, [t.done]);

  const units = [
    ["Days", String(t.days)],
    ["Hours", pad(t.hours)],
    ["Minutes", pad(t.minutes)],
    ["Seconds", pad(t.seconds)],
  ] as const;

  return (
    <section id="countdown" aria-label="Maharashtrian Wedding Date Reveal" className="px-4 py-12 sm:px-6">
      <Reveal className="mx-auto max-w-md">
        {/* Cinematic Marathi Wedding Scratch-to-Reveal Card */}
        <DateReveal onRevealed={() => setRevealed(true)} />

        {/* Live Wedding Countdown Timer */}
        <div className="mx-auto mt-6 max-w-sm text-center">
          <div className="mb-2.5 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-[#D4AF37]/50" />
            <p lang="mr" className="font-marathi text-xs font-semibold tracking-wider text-[#6d0f1b]">
              शुभमुहूर्ताची उत्सुकता · Days to Celebration
            </p>
            <span className="h-px w-8 bg-[#D4AF37]/50" />
          </div>

          {t.done ? (
            <p className="mx-auto mt-4 font-script text-3xl leading-snug text-[#6d0f1b]">
              {wedding.countdownDoneMessage}
            </p>
          ) : (
            <div
              className="grid grid-cols-4 gap-2"
              role="timer"
              aria-label={`${t.days} days until the wedding`}
            >
              {units.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#D4AF37]/45 bg-white/60 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/70 hover:bg-white/80"
                >
                  <p className="font-serif text-2xl font-bold tabular-nums text-[#6d0f1b]">
                    {value}
                  </p>
                  <p className="mt-0.5 font-serif text-[9px] font-semibold uppercase tracking-widest text-[#a8741a]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
