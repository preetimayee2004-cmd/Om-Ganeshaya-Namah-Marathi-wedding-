import { useEffect, useState, type ReactNode } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";
import RSVP from "../RSVP/RSVP";
import WishingWall from "../WishingWall/WishingWall";
import { MAROON, u } from "./SceneFrame";

/** A parchment card that scrolls over the pinned scene and fades up as it enters. */
export function SceneCard({ children, delay = 0, id }: { children: ReactNode; delay?: number; id?: string }) {
  return (
    <Reveal delay={delay}>
      <section
        id={id}
        className="text-center"
        style={{ padding: u(16), border: `${u(1)} solid #f0b44c`, borderRadius: 14, background: "rgba(251,245,232,.95)", boxShadow: "0 10px 30px -12px rgba(60,30,10,.45)", fontSize: u(17), lineHeight: 1.5, color: "#4b0f16" }}
      >
        {children}
      </section>
    </Reveal>
  );
}

function Heading({ marathi, english }: { marathi: string; english: string }) {
  return (
    <header style={{ marginBottom: u(24) }}>
      <p lang="mr" className="font-marathi" style={{ fontSize: u(28), lineHeight: 1.25, fontWeight: 600, color: MAROON }}>{marathi}</p>
      <p style={{ marginTop: u(8), fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: "italic", fontSize: u(18), lineHeight: 1.25, color: "#7a3a2a" }}>{english}</p>
    </header>
  );
}

const tz = wedding.timeZone;
const fmtDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(new Date(iso));
const fmtTime = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

export function EventsCard() {
  return (
    <SceneCard>
      <Heading marathi="कार्यक्रम" english="Order of the day" />
      <ol className="relative text-left">
        <span className="absolute bottom-3 left-[7px] top-3 w-px bg-gold/40" aria-hidden />
        {wedding.events.map((e, i) => (
          <li key={e.id} className="relative pb-6 pl-8 last:pb-0">
            <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-wine bg-[#fbf5e8]" aria-hidden>
              <span className="absolute inset-[2px] rounded-full bg-wine" />
            </span>
            <Reveal delay={i * 60}>
              <p lang="mr" className="font-marathi text-[22px] font-semibold leading-tight" style={{ color: MAROON }}>{e.marathi}</p>
              <p className="font-body text-[11px] uppercase tracking-[0.25em] text-gold">{e.name}</p>
              <p className="mt-1 font-body text-sm text-espresso">{fmtDate(e.start)} · {fmtTime(e.start)}</p>
              <p className="font-body text-[13px] text-espresso/70">{e.venue}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </SceneCard>
  );
}

export function VenueCard() {
  const { venue, contacts } = wedding;
  return (
    <SceneCard id="venue">
      <Heading marathi="विवाह स्थळ" english="Venue" />
      <h3 className="font-body text-lg font-bold text-espresso" style={{ fontFamily: "inherit" }}>{venue.name}</h3>
      <p className="font-body text-sm text-espresso/80">{venue.city}</p>
      <address className="mx-auto mt-2 max-w-[17rem] font-body text-[13px] not-italic leading-relaxed text-espresso/70">{venue.address}</address>
      <a
        href={venue.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-12 items-center rounded-full bg-wine px-7 font-body text-xs font-bold uppercase tracking-widest text-ivory shadow-md transition active:scale-95"
      >
        Open in Maps
      </a>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {contacts.map((c) => (
          <a key={c.name} href={`tel:${c.phone}`} className="inline-flex min-h-11 items-center rounded-full border border-wine px-4 font-body text-[11px] font-bold uppercase tracking-widest text-wine">
            Call {c.role.split(" ")[0]}
          </a>
        ))}
      </div>
    </SceneCard>
  );
}

const target = new Date(wedding.date).getTime();
const left = (now: number) => {
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return { done: diff === 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};
const pad = (n: number) => String(n).padStart(2, "0");

export function CountdownCard() {
  const [t, setT] = useState(() => left(Date.now()));
  useEffect(() => {
    if (t.done) return;
    const id = window.setInterval(() => setT(left(Date.now())), 1000);
    return () => clearInterval(id);
  }, [t.done]);
  const units = [["Days", String(t.d)], ["Hours", pad(t.h)], ["Minutes", pad(t.m)], ["Seconds", pad(t.s)]] as const;
  return (
    <SceneCard>
      <Heading marathi="लग्नाला उरले" english="Counting down" />
      {t.done ? (
        <p className="font-script text-3xl text-wine">{wedding.countdownDoneMessage}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`${t.d} days until the wedding`}>
          {units.map(([label, v]) => (
            <div key={label} className="rounded-md border border-gold/40 bg-ivory py-3">
              <p className="font-body text-2xl font-light tabular-nums text-wine">{v}</p>
              <p className="mt-0.5 font-body text-[9px] uppercase tracking-widest text-gold">{label}</p>
            </div>
          ))}
        </div>
      )}
    </SceneCard>
  );
}

export function RsvpBlessingsCard() {
  return (
    <SceneCard>
      <Heading marathi="आशीर्वाद आणि उपस्थिती" english="Blessings & RSVP" />
      <RSVP inScene />
      <div className="my-2 h-px w-16 bg-gold/50 mx-auto" />
      <WishingWall />
    </SceneCard>
  );
}

export function ClosingCard() {
  const root = useScrollRoot();
  const [first, second] = coupleOrder;
  const toTop = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (root) root.scrollTo({ top: 0, behavior });
    else window.scrollTo({ top: 0, behavior });
  };
  return (
    <SceneCard>
      <p lang="mr" className="font-marathi text-[22px] font-semibold leading-snug" style={{ color: MAROON }}>आपल्या उपस्थितीने आमचा आनंद द्विगुणित होईल.</p>
      <p className="mt-4 font-script text-4xl text-wine">{first} <span className="text-2xl text-gold">&amp;</span> {second}</p>
      <p className="mt-2 font-body text-sm text-espresso/70">{wedding.hashtag}</p>
      <button onClick={toTop} className="mt-5 min-h-11 rounded-full border border-wine px-6 font-body text-xs font-bold uppercase tracking-widest text-wine transition active:scale-95">
        Back to top ↑
      </button>
    </SceneCard>
  );
}
