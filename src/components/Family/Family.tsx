import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";

type Family = (typeof wedding.families)[number];

function Rings() {
  return (
    <svg viewBox="0 0 60 30" className="mx-auto h-8 w-16 text-gold" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <circle cx="22" cy="15" r="11" />
      <circle cx="38" cy="15" r="11" />
    </svg>
  );
}

function FamilyCard({ f }: { f: Family }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.1);
  return (
    <div ref={ref}>
      <article
        className="relative mx-auto max-w-sm overflow-hidden rounded-t-[999px] rounded-b-xl border border-gold/50 bg-[#fbf5e8] px-6 pb-8 text-center shadow-sm transition-all duration-[1100ms] ease-out"
        style={{ clipPath: seen ? "inset(0 0 0 0)" : "inset(0 50% 0 50%)", opacity: seen ? 1 : 0 }}
        aria-label={f.side}
      >
        {/* family photo fills the arch and melts into the card */}
        {f.photo ? (
          <div className="-mx-6 mb-4" aria-hidden={false}>
            <img
              src={f.photo}
              alt={`${f.side} photograph`}
              loading="lazy"
              className="block w-full object-cover"
              style={{
                aspectRatio: "4 / 4.4",
                objectPosition: "center 30%",
                WebkitMaskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
              }}
            />
          </div>
        ) : (
          <div className="pt-16" />
        )}
        <div className="pointer-events-none absolute inset-2 z-10 rounded-t-[999px] rounded-b-lg border border-gold/30" />
        <p lang="mr" className="text-sm text-gold">{f.marathi}</p>
        <h3 className="mt-1 text-4xl leading-none">{f.side}</h3>
        <div
          className="mx-auto mt-3 h-px w-20 origin-center bg-gold transition-transform delay-700 duration-700"
          style={{ transform: seen ? "scaleX(1)" : "scaleX(0)" }}
        />


        <p className="mt-5 font-body text-[10px] uppercase tracking-[0.3em] text-olive">{f.surname}</p>
        <ul className="mt-2 space-y-0.5 font-body text-base text-espresso">
          {f.parents.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <p className="mx-auto mt-4 max-w-[16rem] font-script text-2xl leading-snug text-wine">
          &ldquo;{f.message}&rdquo;
        </p>

        <p className="mt-5 font-body text-[11px] uppercase tracking-widest text-espresso/60">
          {f.members.join(" · ")}
        </p>
      </article>
    </div>
  );
}

export default function Family() {
  return (
    <section id="family" aria-labelledby="family-title" className="px-5 py-6">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Two families, one celebration</p>
        <h2 id="family-title" className="section-title mt-2">With Our Families</h2>
      </Reveal>

      <div className="mt-10 space-y-6">
        <FamilyCard f={wedding.families[0]} />
        <Reveal><Rings /></Reveal>
        <FamilyCard f={wedding.families[1]} />
      </div>
    </section>
  );
}
