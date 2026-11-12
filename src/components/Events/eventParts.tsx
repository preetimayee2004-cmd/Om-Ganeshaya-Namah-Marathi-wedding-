import type { CSSProperties, ReactNode } from "react";
import { wedding } from "../../config/wedding";

export type WeddingEvent = (typeof wedding.events)[number];

/** Per-event colour set. `body` is the colour of running text, `label` of small caps labels. */
export type Palette = {
  ink: string;
  accent: string;
  label: string;
  body: string;
  dotRing: string;
};

const tz = wedding.timeZone;
export const fmtDay = (iso: string, withYear = false) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: tz,
  }).format(new Date(iso));
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

/** inline length in design px (inline styles are not converted by PostCSS) */
export const u = (n: number) => `calc(var(--u) * ${n})`;

/** animation delay / duration custom properties for the ev- classes */
export const t = (delay: number, dur?: number): CSSProperties =>
  ({ "--ev-delay": `${delay}ms`, ...(dur ? { "--ev-dur": `${dur}ms` } : {}) }) as CSSProperties;

export function Names({ e, p, center = false, big = false }: { e: WeddingEvent; p: Palette; center?: boolean; big?: boolean }) {
  return (
    <div className={`relative min-w-0 [overflow-wrap:anywhere] ${center ? "text-center" : ""}`}>
      <p lang="mr" className={`font-marathi leading-snug ${big ? "text-[24px]" : "text-[19px]"}`} style={{ color: p.accent }}>
        {e.marathi}
      </p>
      <h3
        id={`ev-${e.id}-title`}
        className={`font-serif font-semibold leading-[1.08] ${big ? "text-[32px]" : "text-[25px]"}`}
        style={{ color: p.ink }}
      >
        {e.name}
      </h3>
    </div>
  );
}

export function Tagline({ e, p, center = false }: { e: WeddingEvent; p: Palette; center?: boolean }) {
  return (
    <p className={`mt-1 font-serif text-[16px] font-semibold italic leading-snug ${center ? "text-center" : ""}`} style={{ color: p.accent }}>
      {e.tagline}
    </p>
  );
}

export function When({ e, p, center = false }: { e: WeddingEvent; p: Palette; center?: boolean }) {
  return (
    <p className={`mt-2 font-body text-[13px] font-bold leading-snug ${center ? "text-center" : ""}`} style={{ color: p.ink }}>
      <time dateTime={e.start}>
        {fmtDay(e.start)}
        <span aria-hidden> · </span>
        <span className="whitespace-nowrap">{fmtTime(e.start)}</span>
      </time>
    </p>
  );
}

function Label({ p, children, center }: { p: Palette; children: ReactNode; center?: boolean }) {
  return (
    <p className={`font-body text-[11px] font-bold uppercase tracking-[0.22em] ${center ? "text-center" : ""}`} style={{ color: p.label }}>
      {children}
    </p>
  );
}

/** venue, description, dress code and directions: shared by every vignette */
export function Details({ e, p, center = false }: { e: WeddingEvent; p: Palette; center?: boolean }) {
  return (
    <div className={`relative mt-4 space-y-3.5 [overflow-wrap:anywhere] ${center ? "text-center" : ""}`}>
      <div>
        <Label p={p} center={center}>Venue</Label>
        <p className={`mt-0.5 flex items-start gap-1.5 font-body text-[13.5px] font-semibold leading-snug ${center ? "justify-center" : ""}`} style={{ color: p.body }}>
          <svg viewBox="0 0 16 16" className="mt-[2px] h-3.5 w-3.5 shrink-0" fill="none" stroke={p.label} strokeWidth="1.6" aria-hidden>
            <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 10 8 14 8 14Z" />
            <circle cx="8" cy="6.5" r="1.6" />
          </svg>
          <span className="min-w-0">{e.venue}</span>
        </p>
      </div>

      <p className="font-serif text-[15.5px] font-semibold italic leading-snug" style={{ color: p.body }}>
        {e.description}
      </p>

      <div>
        <Label p={p} center={center}>Dress Code</Label>
        <ul className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-2 ${center ? "justify-center" : ""}`}>
          {e.dressCode.map((d) => (
            <li key={d.name} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-5 w-5 shrink-0 rounded-full"
                style={{
                  background: d.color,
                  border: `${u(2)} solid #fff8e6`,
                  boxShadow: `0 0 0 ${u(1.2)} ${p.dotRing}, 0 ${u(1.5)} ${u(3)} rgba(60,30,10,0.25)`,
                }}
              />
              <span className="font-body text-[12.5px] font-semibold leading-tight" style={{ color: p.body }}>
                {d.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={center ? "text-center" : ""}>
        <a href={e.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-gold">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 10 8 14 8 14Z" />
            <circle cx="8" cy="6.5" r="1.6" />
          </svg>
          Get Directions
        </a>
      </div>
    </div>
  );
}

/**
 * Keyframes + states for every vignette. All "hidden before entrance" states live inside
 * prefers-reduced-motion: no-preference, so with reduced motion everything is simply shown.
 * Lengths use var(--u) because this CSS is not processed by PostCSS.
 */
export const EV_CSS = `
.ev-v .ev-draw { stroke-dasharray: 1; stroke-dashoffset: 0; }
.ev-v .ev-bloom, .ev-v .ev-orn { transform-box: fill-box; transform-origin: center; }
.ev-v .ev-sweep { opacity: 0; }
.ev-v .ev-cloth-l { transform: translateX(-105%); }
.ev-v .ev-cloth-r { transform: translateX(105%); }

@keyframes ev-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ev-bloom { from { opacity: 0; transform: scale(0.2) rotate(-25deg); } to { opacity: 1; transform: none; } }
@keyframes ev-cloth-l { 0%, 15% { transform: none; } 100% { transform: translateX(-105%) skewY(-4deg); } }
@keyframes ev-cloth-r { 0%, 15% { transform: none; } 100% { transform: translateX(105%) skewY(4deg); } }
@keyframes ev-arch { from { clip-path: inset(0 0 100% 0); transform: scale(1.07); filter: brightness(0.8) saturate(0.85); }
                     to { clip-path: inset(0 0 0 0); transform: none; filter: none; } }
@keyframes ev-glint { from { opacity: 0; transform: scale(0.5) rotate(-45deg); } to { opacity: 1; transform: none; } }
@keyframes ev-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.9); } }
@keyframes ev-sweep { 0% { opacity: 0; transform: translateX(-160%) skewX(-18deg); } 30% { opacity: 1; }
                      100% { opacity: 0; transform: translateX(260%) skewX(-18deg); } }
@keyframes ev-wash { from { opacity: 0; transform: scaleX(0.6); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: no-preference) {
  .ev-v .ev-draw { stroke-dashoffset: 1; }
  .ev-v.is-seen .ev-draw { animation: ev-draw var(--ev-dur, 1000ms) cubic-bezier(.55,.08,.3,1) var(--ev-delay, 0ms) both; }

  .ev-v .ev-bloom { opacity: 0; }
  .ev-v.is-seen .ev-bloom { animation: ev-bloom var(--ev-dur, 600ms) cubic-bezier(.2,.7,.3,1) var(--ev-delay, 0ms) both; }

  .ev-v .ev-wash { opacity: 0; transform-origin: left center; }
  .ev-v.is-seen .ev-wash { animation: ev-wash 900ms ease-out var(--ev-delay, 0ms) both; }

  .ev-v .ev-cloth-l, .ev-v .ev-cloth-r { transform: none; }
  .ev-v.is-seen .ev-cloth-l { animation: ev-cloth-l 1100ms cubic-bezier(.65,0,.35,1) 250ms both; }
  .ev-v.is-seen .ev-cloth-r { animation: ev-cloth-r 1100ms cubic-bezier(.65,0,.35,1) 250ms both; }

  .ev-v .ev-arch { clip-path: inset(0 0 100% 0); }
  .ev-v.is-seen .ev-arch { animation: ev-arch 1400ms cubic-bezier(.33,0,.2,1) 200ms both; }

  .ev-v .ev-orn { opacity: 0; }
  .ev-v.is-seen .ev-orn {
    animation: ev-glint 800ms ease-out var(--ev-delay, 0ms) both,
               ev-pulse 4800ms ease-in-out calc(var(--ev-delay, 0ms) + 800ms) infinite;
  }
  .ev-v.is-seen .ev-sweep { animation: ev-sweep 1400ms ease-in-out 450ms both; }
}
`;
