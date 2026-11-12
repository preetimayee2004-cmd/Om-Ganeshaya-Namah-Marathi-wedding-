import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { useId } from "react";
import Reveal, { useInView } from "../Layout/Reveal";

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
      <rect x="44" y="14" width="8" height="7" rx="1" fill="#fbf1dc" />
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
      <path d="M19.5 21l3.5-6h8v6ZM34 15h8l3.5 6H34Z" fill="#fbf1dc" />
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
  background: "#fbf1dc",
  border: "calc(var(--u) * 1.5) solid #dcc08a",
  boxShadow: "inset 0 0 0 calc(var(--u) * 4) #fbf1dc, inset 0 0 0 calc(var(--u) * 5) #e4cd9c",
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

const PIN = { x: 262, y: 104 };

/** air arcs high, rail runs nearly straight, road winds through town */
const ROUTES = [
  { key: "air", y: 34, d: `M52 34C110 28 205 16 ${PIN.x} ${PIN.y - 2}` },
  { key: "train", y: 98, d: `M52 98C120 92 180 116 ${PIN.x - 2} ${PIN.y}` },
  { key: "road", y: 162, d: `M52 162C100 176 140 136 182 150S236 150 ${PIN.x} ${PIN.y + 2}` },
] as const;

function NodeGlyph({ k }: { k: (typeof ROUTES)[number]["key"] }) {
  if (k === "air")
    return (
      <g transform="rotate(-30)" fill={RED}>
        <path d="M-9 0c0-1 1-1.6 2.4-1.6H6c2 0 3.6.7 4 1.6-.4.9-2 1.6-4 1.6H-6.6C-8 1.6-9 1-9 0Z" />
        <path d="M-1-1.4L-4-8h2.6L4-1.4ZM-1 1.4L-4 8h2.6L4 1.4ZM-8-1.2l-2-3.6h2L-5-1.2Z" fill="#8e0f22" />
      </g>
    );
  if (k === "train")
    return (
      <g fill={RED}>
        <rect x="-7" y="-8" width="14" height="13" rx="3" />
        <rect x="-4.6" y="-5.6" width="9.2" height="4.4" rx="1" fill="#fbf1dc" />
        <circle cx="-3.6" cy="2" r="1.1" fill="#d4a53c" />
        <circle cx="3.6" cy="2" r="1.1" fill="#d4a53c" />
        <path d="M-5 5l-2.6 3.6M5 5l2.6 3.6" stroke={RED} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  return (
    <g fill={RED}>
      <path d="M-6 -1l2.6-5h6.8L6-1Z" />
      <path d="M-3.4-1.6l1.4-3h4l1.4 3Z" fill="#fbf1dc" />
      <rect x="-9" y="-1.4" width="18" height="6.4" rx="2.2" />
      <circle cx="-4.8" cy="5.4" r="2.4" fill="#5a0a16" />
      <circle cx="4.8" cy="5.4" r="2.4" fill="#5a0a16" />
    </g>
  );
}

/** hand-drawn map: dashed routes draw themselves from each travel mode to the venue pin,
 *  then the pin drops once with a soft ripple and stays still */
function RouteMap({ labels, venueName, city }: { labels: string[]; venueName: string; city: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div
      ref={ref}
      className={`ven-map relative mx-auto mt-5 overflow-hidden ${seen ? "ven-go" : ""}`}
      style={{ ...cardFrame, padding: "calc(var(--u) * 6)" }}
    >
      <svg
        viewBox="0 0 340 200"
        className="block w-full"
        role="img"
        aria-label={`Map sketch: routes ${labels.join(", ").toLowerCase()} to ${venueName}, ${city}`}
      >
        <defs>
          {ROUTES.map((r) => (
            <mask key={r.key} id={`${uid}-m-${r.key}`} maskUnits="userSpaceOnUse" x="0" y="0" width="340" height="200">
              <path
                className="ven-route-mask"
                d={r.d}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth="8"
                strokeLinecap="round"
                style={{ animationDelay: `${300 + ROUTES.indexOf(r) * 150}ms` }}
              />
            </mask>
          ))}
          <radialGradient id={`${uid}-wash`} cx="78%" cy="55%" r="55%">
            <stop offset="0" stopColor="#f3d98b" stopOpacity=".45" />
            <stop offset="1" stopColor="#f3d98b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* paper: soft wash, a river and faint contour scribbles */}
        <rect width="340" height="200" fill={`url(#${uid}-wash)`} />
        <path d="M0 128c40-10 64 8 104-2s58-34 96-30 70 30 140 14" fill="none" stroke="#9fb5c0" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
        <g fill="none" stroke="#d8bd85" strokeOpacity=".55" strokeWidth=".8">
          <path d="M150 30c14-8 34-6 40 6s-8 22-24 20-26-16-16-26Z" />
          <path d="M140 26c20-14 50-10 58 8s-12 32-34 30-40-22-24-38Z" />
          <path d="M96 186c10-10 32-12 44-2" />
          <path d="M210 182c18-8 40-8 56 2" />
        </g>
        {/* compass */}
        <g transform="translate(314 26)" opacity=".8">
          <circle r="11" fill="none" stroke="#d8bd85" strokeWidth=".8" />
          <path d="M0-9l2.6 9H-2.6Z" fill={RED} />
          <path d="M0 9l2.6-9H-2.6Z" fill="#d4a53c" />
          <text y="-13" textAnchor="middle" fontSize="7" fontFamily="Lato, sans-serif" fontWeight="700" fill={GOLD}>N</text>
        </g>

        {/* routes: dashed ink revealed by a growing mask */}
        {ROUTES.map((r) => (
          <g key={r.key} mask={`url(#${uid}-m-${r.key})`}>
            <path d={r.d} fill="none" stroke="#f6e7c4" strokeWidth="4.5" strokeLinecap="round" />
            <path d={r.d} fill="none" stroke={RED} strokeWidth="1.8" strokeDasharray="5 5" strokeLinecap="round" />
          </g>
        ))}

        {/* travel-mode stations */}
        {ROUTES.map((r, i) => (
          <g key={r.key} className="ven-node" style={{ animationDelay: `${i * 120}ms` }}>
            <circle cx="34" cy={r.y} r="17" fill="#fffaf0" stroke="#d4a53c" strokeWidth="1.5" />
            <circle cx="34" cy={r.y} r="14" fill="none" stroke="#e9d4a6" strokeWidth=".8" />
            <g transform={`translate(34 ${r.y})`}>
              <NodeGlyph k={r.key} />
            </g>
            <text
              x="56"
              y={r.y - 9}
              fontSize="10.5"
              fontFamily="Lato, sans-serif"
              fontWeight="700"
              letterSpacing=".8"
              fill={RED}
            >
              {(labels[i] ?? "").toUpperCase()}
            </text>
          </g>
        ))}

        {/* venue: ground shadow, two soft ripples, then the pin drops in and stays */}
        <ellipse className="ven-shadow" cx={PIN.x} cy={PIN.y + 2} rx="7" ry="2.4" fill="#5a0a16" opacity=".25" />
        <ellipse className="ven-ripple" cx={PIN.x} cy={PIN.y + 2} rx="9" ry="3.6" fill="none" stroke="#C9963A" strokeWidth="1.4" style={{ animationDelay: "2150ms" }} />
        <ellipse className="ven-ripple" cx={PIN.x} cy={PIN.y + 2} rx="9" ry="3.6" fill="none" stroke="#C9963A" strokeWidth="1.2" style={{ animationDelay: "2550ms" }} />
        <g className="ven-pin">
          <path
            d={`M${PIN.x} ${PIN.y}c-4-7-13-14-13-23a13 13 0 0 1 26 0c0 9-9 16-13 23Z`}
            fill={RED}
            stroke="#5a0a16"
            strokeWidth=".8"
          />
          <circle cx={PIN.x} cy={PIN.y - 23} r="5.6" fill="#fbf1dc" />
          <path d={`M${PIN.x} ${PIN.y - 27.5}c1.6 1.8 1.6 4 0 6-1.6-2-1.6-4.2 0-6Z`} fill="#C9963A" />
        </g>
        <g className="ven-label" textAnchor="middle">
          <text x={PIN.x - 6} y={PIN.y + 24} fontSize="13.5" fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" fill={INK}>
            {venueName}
          </text>
          <text x={PIN.x - 6} y={PIN.y + 37} fontSize="9" fontFamily="Lato, sans-serif" fontWeight="700" letterSpacing="2" fill={GOLD}>
            {city.toUpperCase()}
          </text>
        </g>
      </svg>
    </div>
  );
}

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
  const { venue, travel, contacts } = wedding;
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
            aspectRatio: "760 / 1018",
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
        <RouteMap
          labels={MODES.map((m, i) => travel[i]?.mode ?? m.label)}
          venueName={venue.name}
          city={venue.city}
        />
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
        <svg viewBox="0 0 120 12" className="mx-auto mt-3 h-3 w-28" aria-hidden>
          <path d="M2 6h44M74 6h44" stroke="#c9a35a" strokeWidth=".9" />
          <path d="M60 1c1.6 2 1.6 4.5 0 7-1.6-2.5-1.6-5 0-7Zm0 7.5c-2.4-.3-4.4-1.8-5-4.2 2.4 0 4.2 1.6 5 4.2Zm0 0c2.4-.3 4.4-1.8 5-4.2-2.4 0-4.2 1.6-5 4.2Z" fill="#c9a35a" />
        </svg>

        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6">
          {contacts.map((c) => (
            <li key={c.name + c.role} className="relative">
              {/* lotus finial on the arch */}
              <svg viewBox="0 0 24 14" className="absolute left-1/2 top-[-9px] z-10 h-3.5 w-5 -translate-x-1/2" fill="#d4a53c" aria-hidden>
                <path d="M12 1c2 2.5 2 6 0 9-2-3-2-6.5 0-9Z" />
                <path d="M12 11c-3-.4-5.6-2.4-6.4-5.4 3 0 5.4 2 6.4 5.4Zm0 0c3-.4 5.6-2.4 6.4-5.4-3 0-5.4 2-6.4 5.4Z" />
              </svg>
              <div
                className="flex h-full flex-col items-center px-3 pb-4 pt-9"
                style={{
                  borderRadius: "calc(var(--u) * 999) calc(var(--u) * 999) calc(var(--u) * 10) calc(var(--u) * 10) / calc(var(--u) * 70) calc(var(--u) * 70) calc(var(--u) * 10) calc(var(--u) * 10)",
                  background: "linear-gradient(180deg, #fffaf0 0%, #fbf0d9 100%)",
                  border: "calc(var(--u) * 1.5) solid #dcc08a",
                  boxShadow: "inset 0 0 0 calc(var(--u) * 4) #fffaf0, inset 0 0 0 calc(var(--u) * 5) #e9d4a6, 0 calc(var(--u) * 6) calc(var(--u) * 14) calc(var(--u) * -8) rgba(120,80,20,0.35)",
                }}
              >
                <p className="text-[22px] leading-tight" style={{ fontFamily: SERIF, fontWeight: 600, color: INK }}>{c.name}</p>
                <p className="mt-0.5 font-body text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>{c.role}</p>
                <a
                  href={`tel:${c.phone}`}
                  className="btn-gold mt-3"
                  aria-label={`Call ${c.name}, ${c.role}`}
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M3.5 2.5h2.2l1.1 3-1.5 1a8 8 0 0 0 4.2 4.2l1-1.5 3 1.1v2.2a1.5 1.5 0 0 1-1.6 1.5A11 11 0 0 1 2 4.1a1.5 1.5 0 0 1 1.5-1.6Z" />
                  </svg>
                  Call
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
