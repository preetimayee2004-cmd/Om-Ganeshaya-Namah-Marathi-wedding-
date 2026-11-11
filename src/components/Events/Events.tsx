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
                    className="relative flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <span className="flex h-[88px] w-[104px] shrink-0 items-center justify-center">
                      <img
                        src={`/events/${e.art}.jpg`}
                        alt=""
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                        style={{
                          WebkitMaskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)",
                          maskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)",
                        }}
                      />
                    </span>
                    <span className="min-w-0 flex-1" style={{ color: INK }}>
                      <span
                        className="block text-[26px] italic leading-tight"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                      >
                        {e.name}
                      </span>
                      <span lang="mr" className="block text-[15px] leading-snug">
                        {e.marathi}
                      </span>
                      <span className="mt-0.5 block font-body text-[13px] leading-snug">
                        {fmtDate(e.start)} · {fmtTime(e.start)}
                      </span>
                      <span className="block font-body text-[13px] leading-snug">{e.tagline}</span>
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-6 w-6 shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
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
                      <div className="space-y-3 border-t px-4 pb-4 pt-3" style={{ borderColor: CARD_BORDER, color: INK }}>
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
