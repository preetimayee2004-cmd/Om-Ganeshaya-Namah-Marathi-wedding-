import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";

// A dotted route that draws itself from "you" to the venue pin on first view.
function RouteDraw() {
  const [ref, seen] = useInView<SVGSVGElement>(0.4);
  return (
    <svg ref={ref} viewBox="0 0 240 70" className="mx-auto h-16 w-full max-w-[240px]" fill="none" aria-hidden>
      <circle cx="14" cy="56" r="5" fill="#687253" />
      <path
        d="M14 56C60 56 60 14 110 14S170 52 214 22"
        stroke="#C6A15B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 7"
        pathLength={100}
        style={{
          strokeDashoffset: seen ? 0 : 100,
          transition: "stroke-dashoffset 1800ms ease-out",
        }}
      />
      <g style={{ opacity: seen ? 1 : 0, transition: "opacity 600ms ease 1500ms" }}>
        <path d="M214 4c-7 0-12 5-12 12 0 9 12 22 12 22s12-13 12-22c0-7-5-12-12-12Z" fill="#722B35" />
        <circle cx="214" cy="16" r="4" fill="#F7EEDC" />
      </g>
    </svg>
  );
}

export default function TravelStay() {
  const { venue, travel, stays } = wedding;

  return (
    <section id="venue" aria-labelledby="venue-title" className="px-5 py-6 text-[#4b0f16]">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-[#a8741a]">Venue &amp; stay</p>
        <h2 id="venue-title" className="mt-2 text-5xl text-[#6d0f1b]">Getting Here</h2>
      </Reveal>

      <Reveal className="mt-8 rounded-xl border border-gold/50 bg-[#fbf5e8] px-6 py-8 text-center" delay={100}>
        <RouteDraw />
        <p lang="mr" className="mt-3 text-sm font-semibold text-[#a8741a]">{venue.marathi}</p>
        <h3 className="text-4xl leading-none text-[#6d0f1b]">{venue.name}</h3>
        <address className="mt-3 font-body text-sm not-italic leading-relaxed text-espresso/80">
          {venue.address}
        </address>
        <p className="mx-auto mt-3 max-w-[17rem] font-body text-[13px] font-light text-espresso/70">{venue.note}</p>
        <a
          href={venue.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-wine px-8 font-body text-sm font-bold uppercase tracking-widest text-ivory shadow-md transition active:scale-95"
        >
          Get Directions
        </a>
      </Reveal>

      <Reveal className="mt-10" delay={100}>
        <h3 className="text-center text-3xl">How to Reach</h3>
        <dl className="mt-4 divide-y divide-gold/30 border-y border-gold/30">
          {travel.map((t) => (
            <div key={t.mode} className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
              <dt className="font-body text-xs font-bold uppercase tracking-widest text-wine">{t.mode}</dt>
              <dd className="font-body text-sm text-espresso/85">{t.detail}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal className="mt-10" delay={100}>
        <h3 className="text-center text-3xl">Where to Stay</h3>
        <ul className="mt-4 space-y-3">
          {stays.map((s) => (
            <li key={s.name} className="rounded-lg border border-gold/40 bg-[#fbf5e8] p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-body text-base font-bold text-espresso">{s.name}</p>
                <span className="shrink-0 font-body text-[10px] uppercase tracking-widest text-olive">{s.tier}</span>
              </div>
              <p className="mt-0.5 font-body text-sm text-espresso/70">{s.distance}</p>
              {(s.phone || s.link) && (
                <div className="mt-3 flex gap-3">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="inline-flex min-h-11 items-center rounded-full border border-wine px-5 font-body text-xs font-bold uppercase tracking-widest text-wine">
                      Call
                    </a>
                  )}
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-wine px-5 font-body text-xs font-bold uppercase tracking-widest text-wine">
                      Website
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
