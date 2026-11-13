import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import Reveal from "../Layout/Reveal";
import ContactCard from "../Contact/ContactCard";

const INK = "#6d0f1b";
const INK_SOFT = "#4b0f16";
const GOLD = "#a8741a";
const RED = "#7a1420"; // maroon, like the rest of the site
const SERIF = "'Cormorant Garamond', Georgia, serif";
const tz = wedding.timeZone;

/** small heading with gold rules and a lotus, like "GETTING THERE" */
function RuleHeading({ children }: { children: string }) {
  return (
    <div className="text-center">
      <p className="font-body text-[12px] font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>{children}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${RED})` }} />
        <svg viewBox="0 0 24 14" className="h-3.5 w-6" fill={RED} aria-hidden>
          <path d="M12 1c2 2.5 2 6 0 9-2-3-2-6.5 0-9Z" />
          <path d="M12 11c-3-.4-5.6-2.4-6.4-5.4 3 0 5.4 2 6.4 5.4Zm0 0c3-.4 5.6-2.4 6.4-5.4-3 0-5.4 2-6.4 5.4Z" />
        </svg>
        <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${RED})` }} />
      </div>
    </div>
  );
}

function Plane() {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16" aria-hidden>
      <path d="M6 30c10 6 22 7 34 1" fill="none" stroke="#d4a53c" strokeWidth="1.2" strokeLinecap="round" />
      <g transform="rotate(-24 32 20)">
        <path d="M8 21c0-2 2-3.5 5-3.5h34c4 0 8 1.6 9 3.5-1 1.9-5 3.5-9 3.5H13c-3 0-5-1.5-5-3.5Z" fill={RED} />
        <path d="M27 18l-6-12h5l12 12ZM27 24l-6 12h5l12-12Z" fill="#8e0f22" />
        <path d="M10 18.5l-4-7h4l6 7Z" fill="#8e0f22" />
        <path d="M46 19.5h4M40 19.5h3M34 19.5h3" stroke="#f3d98b" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
function Train() {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16" aria-hidden>
      <rect x="8" y="16" width="34" height="16" rx="3" fill={RED} />
      <rect x="40" y="10" width="16" height="22" rx="2" fill={RED} />
      <rect x="44" y="14" width="8" height="7" rx="1" fill="#faddb5" />
      <rect x="38" y="7" width="20" height="4" rx="1.5" fill="#d4a53c" />
      <rect x="12" y="10" width="5" height="7" rx="1" fill={RED} />
      <rect x="10.5" y="8" width="8" height="3" rx="1" fill="#d4a53c" />
      <path d="M12 23h26" stroke="#f3d98b" strokeWidth="1.4" />
      <path d="M4 32l4-4" stroke={RED} strokeWidth="2" strokeLinecap="round" />
      {[16, 26, 36, 50].map((x) => (
        <g key={x}>
          <circle cx={x} cy="34" r="4.2" fill="#8e0f22" />
          <circle cx={x} cy="34" r="1.6" fill="#d4a53c" />
        </g>
      ))}
      <path d="M4 39h58" stroke="#d4a53c" strokeWidth="1.2" />
    </svg>
  );
}
function Car() {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16" aria-hidden>
      <rect x="27" y="9" width="10" height="4" rx="1" fill="#d4a53c" />
      <path d="M14 22l5-9h26l5 9Z" fill={RED} />
      <path d="M19.5 21l3.5-6h8v6ZM34 15h8l3.5 6H34Z" fill="#faddb5" />
      <rect x="6" y="21" width="52" height="11" rx="4" fill={RED} />
      <path d="M8 26h48" stroke="#f3d98b" strokeWidth="1" />
      {[18, 46].map((x) => (
        <g key={x}>
          <circle cx={x} cy="33" r="5" fill="#5a0a16" />
          <circle cx={x} cy="33" r="2" fill="#d4a53c" />
        </g>
      ))}
      <path d="M4 39h56" stroke="#d4a53c" strokeWidth="1.2" />
    </svg>
  );
}

const MODES = [
  { key: "air", label: "By Air", Icon: Plane },
  { key: "train", label: "By Train", Icon: Train },
  { key: "road", label: "By Road & Metro", Icon: Car },
] as const;

const cardFrame: React.CSSProperties = {
  background: "#faddb5",
  border: "calc(var(--u) * 1.5) solid #dcc08a",
  boxShadow: "inset 0 0 0 calc(var(--u) * 4) #faddb5, inset 0 0 0 calc(var(--u) * 5) #e4cd9c",
  borderRadius: "calc(var(--u) * 14)",
};

function Dots() {
  return (
    <div className="relative mx-6 h-4" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dotted" style={{ borderColor: "#d8bd85" }} />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-0 rounded-full" style={{ background: "#c9a35a" }} />
    </div>
  );
}

/* ------------------------------------------------------------ route map */

/** keyframes for the map. Lengths inside the SVG are viewBox units, so plain px are fine there. */
const VEN_CSS = `
@keyframes ven-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ven-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ven-pin { 0% { transform: translateY(-34px); opacity: 0 } 45% { opacity: 1 } 100% { transform: translateY(0); opacity: 1 } }
@keyframes ven-ripple { from { transform: scale(.4); opacity: .75 } to { transform: scale(2.6); opacity: 0 } }
.ven-map .ven-route-mask { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ven-map .ven-node, .ven-map .ven-pin, .ven-map .ven-label, .ven-map .ven-shadow { opacity: 0; }
.ven-map .ven-ripple { opacity: 0; transform-box: fill-box; transform-origin: center; }
.ven-map.ven-go .ven-node { animation: ven-fade 600ms ease-out forwards; }
.ven-map.ven-go .ven-route-mask { animation: ven-draw 1400ms cubic-bezier(.5,.1,.3,1) forwards; }
.ven-map.ven-go .ven-pin { animation: ven-pin 700ms cubic-bezier(.2,.7,.3,1) 1650ms forwards; }
.ven-map.ven-go .ven-shadow { animation: ven-fade 500ms ease-out 2050ms forwards; }
.ven-map.ven-go .ven-ripple { animation: ven-ripple 1300ms ease-out forwards; }
.ven-map.ven-go .ven-label { animation: ven-fade 800ms ease-out 2200ms forwards; }
@media (prefers-reduced-motion: reduce) {
  .ven-map .ven-route-mask { stroke-dashoffset: 0; }
  .ven-map .ven-node, .ven-map .ven-pin, .ven-map .ven-label, .ven-map .ven-shadow { opacity: 1; }
  .ven-map.ven-go .ven-node, .ven-map.ven-go .ven-route-mask, .ven-map.ven-go .ven-pin,
  .ven-map.ven-go .ven-shadow, .ven-map.ven-go .ven-ripple, .ven-map.ven-go .ven-label { animation: none; }
}
`;


function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="#C9963A" strokeWidth="1.4" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeLinecap="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="#C9963A" strokeWidth="1.4" aria-hidden>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 4.8V8l2.2 1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function TravelStay() {
  const { venue, travel } = wedding;
  const { guestName, isPersonalised } = useGuest();

  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(wedding.date));
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(wedding.date));

  return (
    <section id="venue" aria-labelledby="venue-title" className="px-5 py-6" style={{ color: INK_SOFT }}>
      <style>{VEN_CSS}</style>
      <Reveal className="text-center">
        <p className="font-body text-[11px] uppercase tracking-[0.35em]" style={{ color: GOLD }}>Where &amp; how</p>
        <h2 id="venue-title" className="section-title mt-2" style={{ color: INK, whiteSpace: "normal" }}>
          <span className="block">Venue &amp; Travel</span>
          <span className="block">Accommodation</span>
        </h2>
      </Reveal>

      {/* venue illustration, melting into the shared sky */}
      <Reveal className="mx-auto -mt-3 max-w-[380px]" from="zoom" delay={100}>
        <img
          src={wedding.images.venue}
          alt={`Floral mandap at ${venue.name}`}
          loading="lazy"
          className="block w-full"
          style={{
            aspectRatio: "760 / 800", // crop the empty sky above the mandap
            objectFit: "cover",
            objectPosition: "center bottom",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 6%, #000 88%, transparent 100%), linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 14%, #000 84%, transparent 100%), linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
      </Reveal>

      {/* wedding location, date and time: large and easy to read */}
      <Reveal className="mt-3 text-center" delay={150}>
        <p lang="mr" className="font-marathi text-[15px] font-semibold" style={{ color: GOLD }}>{venue.marathi}</p>
        <h3
          className="mt-1 font-serif text-[36px] font-semibold leading-[1.05]"
          style={{ color: INK, textWrap: "balance" } as React.CSSProperties}
        >
          {venue.name}
        </h3>
        <p className="mt-1.5 font-body text-[13px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>{venue.city}</p>
        <address className="mx-auto mt-3 max-w-[19rem] font-body text-[15px] not-italic leading-relaxed" style={{ color: INK_SOFT }}>
          {venue.address}
        </address>

        <div className="mx-auto mt-5 max-w-[300px] space-y-2 px-4 py-3.5 text-left" style={cardFrame}>
          <p className="flex items-center gap-2.5 font-body text-[15px] font-bold" style={{ color: INK }}>
            <IconCalendar />
            <span>{date}</span>
          </p>
          <span className="block h-px" style={{ background: "linear-gradient(90deg, transparent, #dcc08a, transparent)" }} aria-hidden />
          <p className="flex items-center gap-2.5 font-body text-[15px]" style={{ color: INK }}>
            <IconClock />
            <span>
              <span className="font-bold uppercase tracking-[0.12em] text-[12px]" style={{ color: GOLD }}>Muhurat</span>{" "}
              <span className="font-bold">{time}</span>
            </span>
          </p>
        </div>

        <a
          href={venue.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-5"
          style={{ minHeight: "calc(var(--u) * 44)", padding: "0 calc(var(--u) * 26)", fontSize: "calc(var(--u) * 14)" }}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 10 8 14 8 14Z" />
            <circle cx="8" cy="6.5" r="1.6" />
          </svg>
          Get Directions
        </a>
        {venue.note ? (
          <p className="mx-auto mt-3 max-w-[18rem] font-serif text-[15px] italic leading-snug" style={{ color: INK_SOFT }}>
            {venue.note}
          </p>
        ) : null}
      </Reveal>

      {/* getting there */}
      <Reveal className="mx-auto mt-10 max-w-[420px]" delay={100}>
        <RuleHeading>Getting There</RuleHeading>
        <div className="mt-5">
          {MODES.map(({ key, label, Icon }, i) => (
            <div key={key}>
              {i > 0 && <Dots />}
              <div className="flex items-center gap-3 px-4 py-3.5" style={cardFrame}>
                <span className="shrink-0">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <span className="block text-[22px] italic leading-tight" style={{ fontFamily: SERIF, fontWeight: 600, color: RED }}>{label}</span>
                  <span className="block font-body text-[13.5px] leading-snug" style={{ color: INK_SOFT }}>{travel[i]?.detail}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* contact & assistance */}
      <Reveal className="mx-auto mt-12 max-w-[420px] text-center" delay={100}>
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: GOLD }}>Here for you</p>
        <h3 className="section-title mt-1" style={{ color: INK }}>
          Contact &amp; Assistance
        </h3>
        <p className="mx-auto mt-2 max-w-[18rem] text-[16px] italic leading-snug" style={{ fontFamily: SERIF, color: INK_SOFT }}>
          For anything you need{isPersonalised ? (
            <>
              , <span className="guest-name not-italic">{guestName}</span>
            </>
          ) : null}, our families are always happy to help.
        </p>
        <ContactCard />
      </Reveal>
    </section>
  );
}
