import { useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import EventArt from "./EventArt";

const tz = wedding.timeZone;
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(new Date(iso));
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

export default function Events() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="events" aria-labelledby="events-title" className="overflow-x-clip px-5 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">
          Order of the day
        </p>
        <h2 id="events-title" className="mt-2 text-5xl">
          Wedding Celebrations
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] font-body text-sm text-espresso/70">
          Tap an event to see the details.
        </p>
      </Reveal>

      <ol className="mt-10 space-y-4">
        {wedding.events.map((e, i) => {
          const open = openId === e.id;
          const fromLeft = i % 2 === 0;
          return (
            <li key={e.id}>
              <Reveal from={fromLeft ? "left" : "right"}>
                <article className="overflow-hidden rounded-xl border border-gold/40 bg-[#fbf5e8] shadow-sm">
                  <button
                    onClick={() => setOpenId(open ? null : e.id)}
                    aria-expanded={open}
                    aria-controls={`event-${e.id}`}
                    className="flex w-full items-center gap-4 p-3 text-left"
                  >
                    <span className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <EventArt art={e.art} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-script text-3xl leading-none text-wine">
                        {e.name}
                      </span>
                      <span lang="mr" className="block text-sm text-gold">
                        {e.marathi}
                      </span>
                      <span className="mt-1 block font-body text-xs text-espresso/80">
                        {fmtDate(e.start)} · {fmtTime(e.start)}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-5 w-5 shrink-0 text-wine transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden
                    >
                      <path d="M5 8l5 5 5-5" />
                    </svg>
                  </button>

                  <div
                    id={`event-${e.id}`}
                    className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-gold/30 px-4 pb-4 pt-3">
                        <p className="font-body text-[14px] font-light leading-relaxed">
                          {e.description}
                        </p>
                        <p className="font-body text-xs uppercase tracking-widest text-olive">
                          {e.venue}
                        </p>
                        <a
                          href={e.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center rounded-full border border-wine px-5 font-body text-xs font-bold uppercase tracking-widest text-wine"
                        >
                          Get Directions
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
