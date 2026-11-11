import { useState } from "react";
import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";

// Satin / silk card look (colours sampled from the reference): ivory-champagne base with soft diagonal sheen
const SATIN =
  "linear-gradient(112deg, #E9DFCC 0%, #E2D5C0 14%, #F3ECDC 30%, #E4D8C3 46%, #F0E8D6 62%, #E1D4BD 80%, #EAE0CD 100%)";
const CARD_BORDER = "#D8C5A3";
const INK = "#5A2433"; // maroon text
const tz = wedding.timeZone;
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(new Date(iso));
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

/** small gold corner flourish like the reference card */
function Corner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`pointer-events-none absolute h-5 w-5 ${className}`} fill="none" stroke="#C9AE7C" strokeWidth="1" strokeLinecap="round" aria-hidden>
      <path d="M2 20C2 10 8 3 20 2" />
      <path d="M2 14C2 9 6 5 12 4" opacity=".7" />
      <circle cx="3.2" cy="3.2" r="1.3" fill="#C9AE7C" stroke="none" />
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
                <article
                  className="relative overflow-hidden rounded-[10px] shadow-[0_2px_6px_rgba(90,60,30,0.18)]"
                  style={{
                    background: SATIN,
                    border: `1.5px solid ${CARD_BORDER}`,
                    boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.35), inset 0 0 0 4px #E3D3B3, 0 2px 6px rgba(90,60,30,0.18)",
                  }}
                >
                  <Corner className="left-1 top-1" />
                  <Corner className="bottom-1 left-1 -scale-y-100" />
                  <button
                    onClick={() => setOpenId(open ? null : e.id)}
                    aria-expanded={open}
                    aria-controls={`event-${e.id}`}
                    className="relative flex h-[88px] w-full items-center gap-3 px-2.5 text-left"
                  >
                    <span
                      className="h-[68px] w-[108px] shrink-0 overflow-hidden rounded-lg"
                      style={{ border: `1px solid ${CARD_BORDER}`, boxShadow: "0 1px 3px rgba(90,60,30,0.2)" }}
                    >
                      <img
                        src={`/events/${e.art}.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full scale-[1.06] object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1" style={{ color: INK, containerType: "inline-size" }}>
                      <span
                        className="block whitespace-nowrap italic leading-[1.1] tracking-tight"
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontWeight: 500,
                          fontSize: `min(21px, ${(100 / (e.name.length * 0.4)).toFixed(2)}cqw)`,
                        }}
                      >
                        {e.name}
                      </span>
                      <span
                        lang="mr"
                        className="block whitespace-nowrap leading-snug"
                        style={{ fontSize: `min(13px, ${(100 / (e.marathi.length * 0.68)).toFixed(2)}cqw)` }}
                      >
                        {e.marathi}
                      </span>
                      <span className="block whitespace-nowrap font-body leading-snug" style={{ fontSize: `min(12px, ${(100 / ((fmtDate(e.start).length + fmtTime(e.start).length + 3) * 0.55)).toFixed(2)}cqw)` }}>
                        {fmtDate(e.start)} · {fmtTime(e.start)}
                      </span>
                      <span className="block whitespace-nowrap font-body leading-snug" style={{ fontSize: `min(12px, ${(100 / (e.tagline.length * 0.55)).toFixed(2)}cqw)` }}>
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
                      <div className="space-y-4 border-t px-4 pb-5 pt-4" style={{ borderColor: CARD_BORDER, color: INK }}>
                        {/* highlighted description */}
                        <p
                          className="rounded-lg px-4 py-3 text-center text-[17px] italic leading-snug"
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontWeight: 500,
                            color: "#6B1624",
                            background: "linear-gradient(135deg, rgba(226,168,75,0.28), rgba(244,214,150,0.38))",
                            borderLeft: "3px solid #C9992F",
                            borderRight: "3px solid #C9992F",
                            boxShadow: "inset 0 0 0 1px rgba(201,153,47,0.35)",
                          }}
                        >
                          {e.description}
                        </p>

                        {/* dress code */}
                        <div className="text-center">
                          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#9A6B1E" }}>
                            Dress Code
                          </p>
                          <ul className="mt-2 flex items-start justify-center gap-5">
                            {e.dressCode.map((d) => (
                              <li key={d.name} className="flex w-[72px] flex-col items-center gap-1">
                                <span
                                  className="h-9 w-9 rounded-full"
                                  style={{
                                    background: d.color,
                                    border: "2px solid #fff8e6",
                                    boxShadow: "0 0 0 1.5px #C9992F, 0 2px 4px rgba(90,60,30,0.3)",
                                  }}
                                />
                                <span className="font-body text-[11px] leading-tight">{d.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* venue */}
                        <div className="text-center">
                          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#9A6B1E" }}>
                            Venue
                          </p>
                          <p className="mt-1 font-body text-[14px] font-semibold">{e.venue}</p>
                        </div>

                        {/* directions: small brown button with golden stroke */}
                        <div className="text-center">
                          <a
                            href={e.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 font-body text-[11px] font-bold uppercase tracking-[0.2em]"
                            style={{
                              background: "linear-gradient(180deg, #7A3B24, #5A2614)",
                              color: "#F6DFA2",
                              border: "1.5px solid #D4A53C",
                              boxShadow: "0 1px 4px rgba(60,30,10,0.35)",
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
