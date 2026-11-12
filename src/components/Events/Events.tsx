import { useState, type CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { useInView } from "../Layout/Reveal";

/**
 * "Time Line": the schedule as a zig-zag of round illustrated medallions joined by a wavy gold
 * thread. Each medallion alternates side; the event's name, date/time, venue, a short line and a
 * map button sit beside it. Each row reveals as it scrolls in: medallion, then text, then the
 * thread to the next event draws itself.
 */

const MAROON = "#7a1f2b";
const INK = "#4a1a16";
const GOLD = "#b8862f";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const u = (n: number) => `calc(var(--u) * ${n})`;
const tz = wedding.timeZone;

const whenLine = (iso: string) => {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d).toLowerCase();
  return `${day}, ${time}`;
};

/** "Friday, 26 February" */
const dayLine = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));

const TL_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .tl-row .tl-medal { opacity: 0; transform: scale(.88); transition: opacity 700ms ease-out, transform 900ms cubic-bezier(.2,.8,.25,1); }
  .tl-row.is-seen .tl-medal { opacity: 1; transform: none; }
  .tl-row .tl-stub { opacity: 0; transition: opacity 700ms ease-out 200ms; }
  .tl-row.is-seen .tl-stub { opacity: 1; }
  .tl-row .tl-text > * { opacity: 0; transform: translateX(calc(var(--u) * var(--dx))); transition: opacity 600ms ease-out, transform 700ms cubic-bezier(.2,.8,.25,1); transition-delay: calc(300ms + var(--i) * 110ms); }
  .tl-row.is-seen .tl-text > * { opacity: 1; transform: none; }
  /* the thread is revealed top-to-bottom, as if drawn (dash animation does not mix with non-scaling strokes) */
  .tl-thread svg { clip-path: inset(0 0 100% 0); transition: clip-path 1100ms ease-in-out 200ms; }
  .tl-thread.is-seen svg { clip-path: inset(-10% -10% -10% -10%); }
  .tl-thread .tl-bead { opacity: 0; transition: opacity 400ms ease-out 800ms; }
  .tl-thread.is-seen .tl-bead { opacity: 1; }
  .tl-more { animation: tl-more 450ms ease-out both; }
  @keyframes tl-more { from { opacity: 0; transform: translateY(calc(var(--u) * -6)); } to { opacity: 1; transform: none; } }
}
`;

/** small maroon-and-gold diamond used on the medallion ring and the heading rules */
function Diamond({ style, size = 9 }: { style?: CSSProperties; size?: number }) {
  return (
    <span
      aria-hidden
      className="absolute block"
      style={{ width: u(size), height: u(size), background: MAROON, border: `${u(1.5)} solid #e2be6e`, rotate: "45deg", ...style }}
    />
  );
}

function Medallion({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="tl-medal relative mx-auto aspect-square w-full">
      <div className="absolute inset-0 rounded-full" style={{ border: `${u(3)} solid ${MAROON}`, background: "radial-gradient(circle, #fbeee6 0%, #f3dcd2 100%)" }} />
      <div className="absolute overflow-hidden rounded-full" style={{ inset: u(7) }}>
        <img src={src} alt={alt} loading="lazy" draggable={false} className="h-full w-full object-cover" />
      </div>
      <div className="pointer-events-none absolute rounded-full" style={{ inset: u(10), border: `${u(1)} dashed rgba(226,190,110,0.85)` }} />
      {/* ornaments at the four points of the ring */}
      <Diamond style={{ left: "50%", top: 0, translate: "-50% -50%" }} />
      <Diamond style={{ left: "50%", bottom: 0, translate: "-50% 50%" }} />
      <Diamond style={{ top: "50%", left: 0, translate: "-50% -50%" }} size={7} />
      <Diamond style={{ top: "50%", right: 0, translate: "50% -50%" }} size={7} />
    </div>
  );
}

function PinButton({ href, name }: { href: string; name: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Directions to ${name}`}
      className="inline-flex items-center justify-center rounded-full transition active:scale-95"
      style={{ width: u(38), height: u(38), border: `${u(1.5)} solid #d9b56a`, background: "#fffaf2", boxShadow: `0 ${u(2)} ${u(6)} rgba(120,80,20,0.15)` }}
    >
      <svg viewBox="0 0 16 16" style={{ width: u(16), height: u(16) }} aria-hidden>
        <path d="M8 15s5-4.5 5-8.5a5 5 0 1 0-10 0C3 10.5 8 15 8 15Z" fill="#c9963a" />
        <circle cx="8" cy="6.5" r="1.9" fill="#fffaf2" />
      </svg>
    </a>
  );
}

type Ev = (typeof wedding.events)[number];

/** short straight piece of the gold thread that fills the gap between a medallion and its row edge */
function Stub({ hidden }: { hidden: boolean }) {
  return <span aria-hidden className="tl-stub mx-auto block w-px flex-1" style={{ background: hidden ? "transparent" : "#c9a056" }} />;
}

function Row({ e, i, first, last }: { e: Ev; i: number; first: boolean; last: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const left = i % 2 === 0; // medallion on the left for even rows
  const t = (k: number) => ({ "--i": k, "--dx": left ? 14 : -14 } as CSSProperties);
  const [open, setOpen] = useState(false);
  return (
    <div ref={ref} className={`tl-row grid items-stretch ${seen ? "is-seen" : ""}`} style={{ gridTemplateColumns: left ? "44% 1fr" : "1fr 44%" }}>
      {/* medallion centred in its column; the stubs above and below keep the thread unbroken */}
      <div className={`flex flex-col ${left ? "order-1" : "order-2"}`}>
        <Stub hidden={first} />
        <Medallion src={e.image} alt={`${e.name} illustration`} />
        <Stub hidden={last} />
      </div>
      <div className={`tl-text min-w-0 self-center ${left ? "order-2 pl-3 text-left" : "order-1 pr-3 text-right"}`}>
        <h3 id={`tl-${e.id}`} className="font-script text-[36px] font-normal leading-[1.05] [overflow-wrap:anywhere]" style={{ color: MAROON, ...t(0) }}>
          {e.name}
        </h3>
        <p lang="mr" className="mt-0.5 font-marathi text-[13px]" style={{ color: GOLD, ...t(1) }}>
          {e.marathi}
        </p>
        <p className="mt-1 text-[16px] font-semibold leading-snug" style={{ fontFamily: SERIF, color: INK, ...t(2) }}>
          <time dateTime={e.start}>{dayLine(e.start)}</time>
        </p>
        <div className="mt-3" style={t(3)}>
          <button
            type="button"
            className="btn-gold whitespace-nowrap !px-3 !text-[10px] !tracking-[0.05em]"
            aria-expanded={open}
            aria-controls={`tl-more-${e.id}`}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide details" : "Tap to view details"}
          </button>
        </div>
        {open && (
          <div id={`tl-more-${e.id}`} className="tl-more mt-3">
            <p className="text-[15px] font-medium leading-snug" style={{ fontFamily: SERIF, color: INK }}>
              {whenLine(e.start)}
            </p>
            <p className="mt-1 text-[16px] font-bold leading-snug" style={{ fontFamily: SERIF, color: MAROON }}>
              {e.venue}
            </p>
            <p className="mt-1.5 text-[13.5px] italic leading-snug" style={{ fontFamily: SERIF, color: "#8a6a5a" }}>
              {e.description}
            </p>
            <div className="mt-2.5">
              <PinButton href={e.mapUrl} name={e.name} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** the wavy gold thread from one medallion's bottom to the next one's top, with a bead midway */
function Thread({ fromLeft }: { fromLeft: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  // medallion centres sit at 22% (left column) and 78% (right column) of the row width
  const a = fromLeft ? 22 : 78;
  const b = fromLeft ? 78 : 22;
  return (
    <div ref={ref} aria-hidden className={`tl-thread relative ${seen ? "is-seen" : ""}`} style={{ height: u(70) }}>
      <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={`M${a} 0 C${a} 34, ${b} 36, ${b} 70`} fill="none" stroke="#c9a056" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="tl-bead absolute block"
        style={{ left: "50%", top: "50%", width: u(8), height: u(8), translate: "-50% -50%", rotate: "45deg", background: "#fffaf2", border: `${u(1.5)} solid ${GOLD}` }}
      />
    </div>
  );
}

export default function Events() {
  const { guestName, isPersonalised } = useGuest();
  const events = wedding.events;

  return (
    <section id="events" aria-labelledby="events-title" className="px-4 py-6">
      <style>{TL_CSS}</style>

      {/* heading: SCHEDULE between two gold rules, then "Time Line" in script */}
      <div className="text-center">
        <div className="relative mx-auto flex items-center justify-center gap-3" style={{ width: u(210) }}>
          <span className="relative h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }}>
            <Diamond size={6} style={{ right: 0, top: "50%", translate: "50% -50%" }} />
          </span>
          <span className="font-serif text-[12px] font-semibold uppercase tracking-[0.5em]" style={{ color: MAROON, paddingLeft: "0.5em" }}>
            Schedule
          </span>
          <span className="relative h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }}>
            <Diamond size={6} style={{ left: 0, top: "50%", translate: "-50% -50%" }} />
          </span>
        </div>
        <h2 id="events-title" className="mt-1 font-script text-[52px] font-normal leading-tight" style={{ color: MAROON }}>
          Time Line
        </h2>
        <svg viewBox="0 0 160 14" className="mx-auto block" style={{ width: u(120), height: u(11) }} fill="none" stroke={GOLD} strokeWidth="1" aria-hidden>
          <path d="M4 7h58M98 7h58" />
          <path d="M62 7c5-5 11-5 14 0-3 5-9 5-14 0ZM98 7c-5-5-11-5-14 0 3 5 9 5 14 0Z" fill={GOLD} fillOpacity=".25" />
          <path d="M80 2l4 5-4 5-4-5z" fill={MAROON} stroke="#e2be6e" />
        </svg>
        {isPersonalised && (
          <p className="mx-auto mt-2 max-w-[17rem] font-body text-[14px] text-espresso/75">
            <span className="guest-name">{guestName}</span>, here is how we celebrate.
          </p>
        )}
      </div>

      <ol className="mt-8 list-none">
        {events.map((e, i) => (
          <li key={e.id} aria-labelledby={`tl-${e.id}`}>
            {i > 0 && <Thread fromLeft={(i - 1) % 2 === 0} />}
            <Row e={e} i={i} first={i === 0} last={i === events.length - 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}
