import { useEffect, useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";

const target = new Date(wedding.date).getTime(); // absolute instant, so correct in any viewer time zone

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

  useEffect(() => {
    if (t.done) return;
    const id = window.setInterval(() => setT(remaining(Date.now())), 1000);
    return () => clearInterval(id);
  }, [t.done]);

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: wedding.timeZone,
  }).format(new Date(target));

  const units = [
    ["Days", String(t.days)],
    ["Hours", pad(t.hours)],
    ["Minutes", pad(t.minutes)],
    ["Seconds", pad(t.seconds)],
  ] as const;

  return (
    <section id="countdown" aria-labelledby="countdown-title" className="px-5 py-16">
      <Reveal className="relative mx-auto max-w-sm rounded-t-[2.5rem] rounded-b-md border border-gold/60 bg-[#fbf5e8] px-4 pb-8 pt-10 text-center">
        <div className="pointer-events-none absolute inset-1.5 rounded-t-[2.2rem] rounded-b border border-gold/30" />
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Save the date</p>
        <h2 id="countdown-title" className="mt-1 text-4xl leading-tight">
          {t.done ? "The Day Is Here" : "Counting Down"}
        </h2>
        <p className="mt-2 font-body text-sm text-espresso/80">{dateLabel}</p>

        {t.done ? (
          <p className="mx-auto mt-6 max-w-[15rem] font-script text-3xl leading-snug text-wine">
            {wedding.countdownDoneMessage}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-2" role="timer" aria-label={`${t.days} days until the wedding`}>
            {units.map(([label, value]) => (
              <div key={label} className="rounded-md border border-gold/40 bg-ivory py-3">
                <p className="font-body text-2xl font-light tabular-nums text-wine">{value}</p>
                <p className="mt-0.5 font-body text-[9px] uppercase tracking-widest text-olive">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
