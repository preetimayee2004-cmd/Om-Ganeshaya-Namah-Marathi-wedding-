import { useEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { useInView } from "../Layout/Reveal";
import PointerHand, { TIP } from "../Layout/PointerHand";

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
.tl-seal .tl-seal-disc { transition: transform 300ms cubic-bezier(.2,.8,.25,1); }
.tl-seal:hover .tl-seal-disc { transform: rotate(-8deg) scale(1.06); }
.tl-seal:active .tl-seal-disc { transform: scale(.94); }
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
  .tl-hint-tap { animation: tl-hint-tap 2s ease-in-out infinite; transform-origin: 35% 6%; }
  @keyframes tl-hint-tap { 0%, 55%, 100% { transform: none; } 70% { transform: translateY(calc(var(--u) * 3)) scale(.9); } 82% { transform: none; } }
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

/** small gold lotus, used as the medallion finial and on the seals */
function Lotus({ size = 16, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 16" style={{ width: u(size), height: u(size * 0.66) }} aria-hidden>
      <path d="M12 1c2.3 2.8 2.3 6.7 0 10-2.3-3.3-2.3-7.2 0-10Z" fill={color} />
      <path d="M12 11.6c-3.4-.4-6.2-2.6-7-6 3.4 0 6.1 2.2 7 6Zm0 0c3.4-.4 6.2-2.6 7-6-3.4 0-6.1 2.2-7 6Z" fill={color} opacity=".8" />
      <path d="M4 14.2c4.6 1.6 11.4 1.6 16 0" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function Medallion({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="tl-medal relative mx-auto aspect-square w-[74%]">
      {/* outer hairline ring + soft ivory mat */}
      <div className="absolute inset-0 rounded-full" style={{ border: `${u(1)} solid ${GOLD}`, background: "radial-gradient(circle, #fff7e8 0%, #f7e6c4 100%)" }} />
      <div className="absolute rounded-full" style={{ inset: u(4), border: `${u(1.5)} solid rgba(122,31,43,0.75)` }} />
      <div className="absolute overflow-hidden rounded-full" style={{ inset: u(7) }}>
        <img src={src} alt={alt} loading="lazy" draggable={false} className="h-full w-full object-cover" />
      </div>
      {/* lotus finial on top, two small beads at the sides */}
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[62%] rounded-full px-1" style={{ background: "#f6e3bd" }}>
        <Lotus size={18} />
      </span>
      {(["left", "right"] as const).map((side) => (
        <span
          key={side}
          aria-hidden
          className="absolute top-1/2 block rounded-full"
          style={{ [side]: 0, width: u(5), height: u(5), translate: side === "left" ? "-50% -50%" : "50% -50%", background: GOLD } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** "View details" as a small wax seal with an italic label */
function SealButton({ open, onClick, id }: { open: boolean; onClick: () => void; id: string }) {
  return (
    <button
      type="button"
      data-tl-btn
      aria-expanded={open}
      aria-controls={`tl-more-${id}`}
      onClick={onClick}
      className="tl-seal group inline-flex items-center gap-2 whitespace-nowrap"
    >
      <span
        aria-hidden
        className="tl-seal-disc relative grid place-items-center rounded-full"
        style={{
          width: u(30),
          height: u(30),
          background: "radial-gradient(circle at 38% 32%, #9a2a37 0%, #7a1f2b 55%, #5c1520 100%)",
          boxShadow: `0 0 0 ${u(1)} #e2be6e, 0 0 0 ${u(3)} rgba(226,190,110,0.25)`,
        }}
      >
        <Lotus size={14} color="#f3d98b" />
      </span>
      <span className="text-[15px] italic leading-none" style={{ fontFamily: SERIF, fontWeight: 600, color: MAROON, borderBottom: `${u(1)} dotted ${GOLD}`, paddingBottom: u(2) }}>
        {open ? "Close details" : "View details"}
      </span>
    </button>
  );
}

const DEVANAGARI = "०१२३४५६७८९";
const mrNum = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => DEVANAGARI[+d]);

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

function Row({ e, i, first, last, onTap }: { e: Ev; i: number; first: boolean; last: boolean; onTap: () => void }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const left = i % 2 === 0; // medallion on the left for even rows
  const t = (k: number) => ({ "--i": k, "--dx": left ? 14 : -14 } as CSSProperties);
  const [open, setOpen] = useState(false);
  return (
    <div ref={ref} className={`tl-row grid items-stretch ${seen ? "is-seen" : ""}`} style={{ gridTemplateColumns: left ? "44% 1fr" : "1fr 44%", columnGap: u(6) }}>
      {/* medallion centred in its column; the stubs above and below keep the thread unbroken */}
      <div className={`flex flex-col ${left ? "order-1" : "order-2"}`}>
        <Stub hidden={first} />
        <Medallion src={e.image} alt={`${e.name} illustration`} />
        <Stub hidden={last} />
      </div>
      <div className={`tl-text min-w-0 self-center py-2 ${left ? "order-2 pl-3 text-left" : "order-1 pr-3 text-right"}`}>
        <p lang="mr" className="font-marathi text-[12px] leading-none tracking-[0.2em]" style={{ color: GOLD, ...t(0) }}>
          {mrNum(i + 1)}
        </p>
        <h3 id={`tl-${e.id}`} className={`mt-1 font-script ${e.name.length > 14 ? "text-[31px]" : "text-[40px]"} font-normal leading-[1.02] [overflow-wrap:anywhere]`} style={{ color: MAROON, ...t(0) }}>
          {e.name}
        </h3>
        <p lang="mr" className="mt-0.5 font-marathi text-[13px]" style={{ color: GOLD, ...t(1) }}>
          {e.marathi}
        </p>
        <p className={`mt-1.5 flex items-center gap-1.5 text-[16px] italic leading-snug ${left ? "" : "justify-end"}`} style={{ fontFamily: SERIF, fontWeight: 600, color: INK, ...t(2) }}>
          <span aria-hidden className="inline-block rotate-45" style={{ width: u(5), height: u(5), background: GOLD }} />
          <time dateTime={e.start}>{dayLine(e.start)}</time>
        </p>
        <div className="mt-3.5" style={t(3)}>
          <SealButton
            id={e.id}
            open={open}
            onClick={() => {
              onTap();
              setOpen((o) => !o);
            }}
          />
        </div>
      </div>
      {open && (
        <div className="order-3 col-span-2 mt-4">
          <EventDetails e={e} />
        </div>
      )}
    </div>
  );
}

const timeOnly = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso)).toUpperCase();
const listNames = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} & ${xs[xs.length - 1]}`);

/** one-event calendar file, so "Calendar" adds just this ceremony */
function downloadEventIcs(e: Ev) {
  const start = new Date(e.start);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//EN", "BEGIN:VEVENT",
    `UID:${e.id}-${f(start)}@wedding-invitation`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${esc(e.name)}`, `LOCATION:${esc(e.venue)}`, `DESCRIPTION:${esc(e.description)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const Icon = {
  clock: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  ),
  place: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
      <path d="M10 2.5l1 2h-2zM4 8h12L10 4.5zM5 8v8M15 8v8M8 16v-4a2 2 0 0 1 4 0v4M3 16.5h14" />
    </svg>
  ),
  wear: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 6.2a1.8 1.8 0 1 0-1.8-1.8M10 6.2v1.3L2.8 13a1 1 0 0 0 .6 1.8h13.2a1 1 0 0 0 .6-1.8L10 7.5" />
    </svg>
  ),
};

// soft palette for the expanded card: turmeric yellow, ivory, muted marigold
const HAIRLINE = "rgba(184, 134, 47, 0.28)";

function Tile({ icon, value, label }: { icon: JSX.Element; value: string; label: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-start px-2 py-1 text-center">
      <span className="block" style={{ width: u(15), height: u(15), color: GOLD }}>{icon}</span>
      <span className="mt-1.5 font-body text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>{label}</span>
      <span className="mt-1 text-[14.5px] font-semibold leading-tight [overflow-wrap:anywhere]" style={{ fontFamily: SERIF, color: INK }}>{value}</span>
    </div>
  );
}

/** the expanded event: time / place / wear, description, dress code, calendar + directions */
function EventDetails({ e }: { e: Ev }) {
  const wear = e.dressCode[0]?.name ?? "Festive";
  const place = e.venue.split(",")[0];
  return (
    <div
      id={`tl-more-${e.id}`}
      className="tl-more relative overflow-hidden rounded-[16px] px-5 pb-5 pt-5 text-left"
      style={{
        background: "linear-gradient(180deg, #fbefcf 0%, #fdf6e4 100%)",
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      {/* header: small illustration on the left, Marathi title on the right */}
      <div className="flex items-center justify-between gap-4">
        <img src={e.image} alt="" aria-hidden className="h-[46px] w-[46px] rounded-[10px] object-cover" draggable={false} />
        <div className="min-w-0 text-right">
          <p lang="mr" className="font-marathi text-[24px] font-semibold leading-tight" style={{ color: MAROON }}>
            {e.marathi}
          </p>
          <p className="mt-0.5 text-[13px] italic leading-none" style={{ fontFamily: SERIF, color: GOLD }}>
            {e.name}
          </p>
        </div>
      </div>

      {/* three equal information boxes */}
      <div
        className="mt-5 grid grid-cols-3 items-stretch divide-x divide-[rgba(184,134,47,0.28)] rounded-[14px] py-3"
        style={{ background: "rgba(255, 250, 236, 0.45)" }}
      >
        <Tile icon={Icon.clock} value={timeOnly(e.start)} label="Time" />
        <Tile icon={Icon.place} value={place} label="Place" />
        <Tile icon={Icon.wear} value={wear} label="Wear" />
      </div>

      {/* description */}
      <p className="mx-1 mt-6 text-[15.5px] italic" style={{ fontFamily: SERIF, color: "#5a3a2a", lineHeight: 1.6 }}>
        {e.description}
      </p>

      {/* dress code: one clean row, text left, swatches right */}
      {e.dressCode.length > 0 && (
        <div className="mx-1 mt-6 flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: HAIRLINE }}>
          <div className="min-w-0">
            <p className="font-body text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Dress code</p>
            <p className="mt-0.5 text-[15px] font-semibold leading-snug" style={{ fontFamily: SERIF, color: INK }}>
              {listNames(e.dressCode.map((d) => d.name))}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {e.dressCode.map((d) => (
              <span
                key={d.name}
                aria-hidden
                title={d.name}
                className="block rounded-full"
                style={{ width: u(18), height: u(18), background: d.color, boxShadow: `0 0 0 1px ${HAIRLINE}` }}
              />
            ))}
          </div>
        </div>
      )}


      {/* actions: equal height, single thin border, subtle backgrounds */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => downloadEventIcs(e)}
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-full font-body text-[11px] font-bold uppercase tracking-[0.16em] transition active:scale-[0.98]"
          style={{ background: "rgba(122, 31, 43, 0.06)", color: MAROON, border: "1px solid rgba(122, 31, 43, 0.45)" }}
        >
          <svg viewBox="0 0 16 16" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
          Calendar
        </button>
        <a
          href={e.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-full font-body text-[11px] font-bold uppercase tracking-[0.16em] transition active:scale-[0.98]"
          style={{ background: "transparent", color: MAROON, border: "1px solid rgba(184, 134, 47, 0.6)" }}
        >
          <svg viewBox="0 0 16 16" className="h-[13px] w-[13px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 10 8 14 8 14Z" />
            <circle cx="8" cy="6.5" r="1.6" />
          </svg>
          Directions
        </a>
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
  const id = `tlg-${fromLeft ? "l" : "r"}`;
  return (
    <div ref={ref} aria-hidden className={`tl-thread relative ${seen ? "is-seen" : ""}`} style={{ height: u(84) }}>
      <svg viewBox="0 0 100 84" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9a056" stopOpacity=".9" />
            <stop offset=".5" stopColor="#d9b56a" stopOpacity=".55" />
            <stop offset="1" stopColor="#c9a056" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <path d={`M${a} 0 C${a} 46, ${b} 38, ${b} 84`} fill="none" stroke={`url(#${id})`} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        <path d={`M${a} 0 C${a} 46, ${b} 38, ${b} 84`} fill="none" stroke="#c9a056" strokeOpacity=".22" strokeWidth="3.5" strokeDasharray="0.1 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="tl-bead absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-0.5" style={{ left: "50%", top: "50%", background: "#f6e3bd" }}>
        <Lotus size={13} />
      </span>
    </div>
  );
}

export default function Events() {
  const { guestName, isPersonalised } = useGuest();
  const events = wedding.events;

  // hint hand: glides to the next event's "Tap to view details" every 2 s (only rows already
  // revealed) until the guest taps one of them
  const listRef = useRef<HTMLOListElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const [tapped, setTapped] = useState(false);
  useEffect(() => {
    if (tapped) return;
    let idx = -1;
    const move = () => {
      const list = listRef.current;
      const hand = handRef.current;
      if (!list || !hand) return;
      const btns = Array.from(list.querySelectorAll<HTMLElement>("[data-tl-btn]")).filter((b) => b.closest(".tl-row")?.classList.contains("is-seen"));
      if (!btns.length) {
        hand.style.opacity = "0";
        return;
      }
      idx = (idx + 1) % btns.length;
      const lr = list.getBoundingClientRect();
      const br = btns[idx].getBoundingClientRect();
      const x = br.left - lr.left + br.width * 0.72 - TIP.x * hand.offsetWidth;
      const y = br.top - lr.top + br.height * 0.62 - TIP.y * hand.offsetHeight;
      const first = hand.style.opacity !== "1";
      hand.style.transition = first ? "opacity 400ms ease" : "transform 1300ms cubic-bezier(.45,.05,.3,1), opacity 400ms ease";
      hand.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      hand.style.opacity = "1";
    };
    move();
    const id = window.setInterval(move, 2000);
    return () => window.clearInterval(id);
  }, [tapped]);

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
        <h2 id="events-title" className="section-title mt-2" style={{ color: MAROON }}>
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

      <ol ref={listRef} className="relative mt-8 list-none">
        {events.map((e, i) => (
          <li key={e.id} aria-labelledby={`tl-${e.id}`}>
            {i > 0 && <Thread fromLeft={(i - 1) % 2 === 0} />}
            <Row e={e} i={i} first={i === 0} last={i === events.length - 1} onTap={() => setTapped(true)} />
          </li>
        ))}
        {!tapped && (
          <div ref={handRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10" style={{ opacity: 0 }}>
            <div className="tl-hint-tap">
              <PointerHand size={22} />
            </div>
          </div>
        )}
      </ol>
    </section>
  );
}
