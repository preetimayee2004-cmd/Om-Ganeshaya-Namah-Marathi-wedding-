import { useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";

// Golden card: the exact gold of the Save-the-Date border, deep maroon ink
const GOLD = "linear-gradient(180deg, #FCEFCB 0%, #F3DB9C 55%, #F8E8BC 100%)"; // a lighter take on the Save-the-Date gold
const CARD_BORDER = "#D4AE5E";
const INK = "#4A0E1A"; // deep maroon text
const INK_SOFT = "#6B1A26";
const tz = wedding.timeZone;
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(new Date(iso));
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

/** small gold corner flourish like the reference card */
function Corner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`pointer-events-none absolute h-5 w-5 ${className}`} fill="none" stroke="#8A5F15" strokeWidth="1" strokeLinecap="round" aria-hidden>
      <path d="M2 20C2 10 8 3 20 2" />
      <path d="M2 14C2 9 6 5 12 4" opacity=".7" />
      <circle cx="3.2" cy="3.2" r="1.3" fill="#8A5F15" stroke="none" />
    </svg>
  );
}

export default function Events() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="events" aria-labelledby="events-title" className="overflow-x-clip px-5 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">
          Order of the day
        </p>
        <h2 id="events-title" className="section-title mt-2">
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
                <article
                  className="relative overflow-hidden rounded-[10px] shadow-[0_2px_6px_rgba(90,60,30,0.18)]"
                  style={{
                    background: GOLD,
                    border: `calc(var(--u) * 1.5) solid ${CARD_BORDER}`,
                    boxShadow: "inset 0 0 0 calc(var(--u) * 3) rgba(255,244,205,0.45), inset 0 0 0 calc(var(--u) * 4) rgba(176,127,37,0.55), 0 calc(var(--u) * 3) calc(var(--u) * 8) rgba(110,70,10,0.28)",
                  }}
                >
                  <Corner className="left-1 top-1" />
                  <Corner className="bottom-1 left-1 -scale-y-100" />
                  <button
                    onClick={() => setOpenId(open ? null : e.id)}
                    aria-expanded={open}
                    aria-controls={`event-${e.id}`}
                    className="relative flex min-h-[92px] w-full items-center gap-3 px-2.5 py-2 text-left"
                  >
                    <span
                      className="h-[68px] w-[100px] shrink-0 overflow-hidden rounded-lg"
                      style={{ border: `1px solid ${CARD_BORDER}`, boxShadow: "0 1px calc(var(--u) * 3) rgba(90,60,30,0.3)" }}
                    >
                      <img
                        src={`/events/${e.art}.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full scale-[1.06] object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1 break-words" style={{ color: INK }}>
                      <span
                        className="block text-[19px] italic leading-[1.1]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
                      >
                        {e.name}
                      </span>
                      <span lang="mr" className="block text-[13px] leading-snug">
                        {e.marathi}
                      </span>
                      <span className="block font-body text-[12px] font-medium leading-snug">
                        {fmtDate(e.start)} · {fmtTime(e.start)}
                      </span>
                      <span className="block font-body text-[12px] leading-snug" style={{ color: INK_SOFT }}>
                        {e.tagline}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
                      style={{ color: INK }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7 4l6 6-6 6" />
                    </svg>
                  </button>

                  <div
                    id={`event-${e.id}`}
                    className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2.5 border-t px-4 pb-3 pt-2.5" style={{ borderColor: CARD_BORDER, color: INK }}>
                        <p
                          className="text-center text-[13.5px] italic leading-snug"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: INK }}
                        >
                          {e.description}
                        </p>

                        {/* dress code */}
                        <div className="text-center">
                          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#6B1A26" }}>
                            Dress Code
                          </p>
                          <ul className="mt-1.5 flex items-start justify-center gap-4">
                            {e.dressCode.map((d) => (
                              <li key={d.name} className="flex w-[68px] flex-col items-center gap-0.5">
                                <span
                                  className="h-7 w-7 rounded-full"
                                  style={{
                                    background: d.color,
                                    border: "calc(var(--u) * 2) solid #fff8e6",
                                    boxShadow: "0 0 0 calc(var(--u) * 1.5) #8A5F15, 0 calc(var(--u) * 2) calc(var(--u) * 4) rgba(90,60,30,0.3)",
                                  }}
                                />
                                <span className="font-body text-[10.5px] font-medium leading-tight">{d.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* venue */}
                        <div className="text-center">
                          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#6B1A26" }}>
                            Venue
                          </p>
                          <p className="mt-0.5 font-body text-[12.5px] font-semibold">{e.venue}</p>
                        </div>

                        {/* directions: small brown button with golden stroke */}
                        <div className="text-center">
                          <a
                            href={e.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3.5 font-body text-[10.5px] font-bold uppercase tracking-[0.2em]"
                            style={{
                              background: "linear-gradient(180deg, #7A3B24, #5A2614)",
                              color: "#F6DFA2",
                              border: "calc(var(--u) * 1.5) solid #D4A53C",
                              boxShadow: "0 1px calc(var(--u) * 4) rgba(60,30,10,0.35)",
                            }}
                          >
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                              <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 10 8 14 8 14Z" />
                              <circle cx="8" cy="6.5" r="1.6" />
                            </svg>
                            Get Directions
                          </a>
                        </div>
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
