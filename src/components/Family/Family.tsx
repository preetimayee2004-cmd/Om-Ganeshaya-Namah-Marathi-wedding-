import type { CSSProperties, ReactNode } from "react";
import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";

type Fam = (typeof wedding.families)[number];

/** true when the text is (mostly) Devanagari, so it gets the Marathi font instead of the Latin one */
const isMarathi = (s: string) => /[ऀ-ॿ]/.test(s);

const MAROON = "#6d0f1b";
const MAROON2 = "#7a1420";
const GOLD = "#b8862f";
const GOLD2 = "#C9963A";
const GOLD3 = "#D4AE5E";
const INK = "#4a1a16";
const u = (n: number) => `calc(var(--u) * ${n})`;

/** keyframes + reduced-motion fallbacks (inline lengths use --u, px here are not converted) */
const CSS = `
@keyframes fam-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes fam-leaf { from { opacity: 0; transform: translateY(calc(var(--u) * -4)) rotate(var(--r, 0deg)) } to { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)) } }
@keyframes fam-glow { 0%, 100% { opacity: .85 } 50% { opacity: 1 } }
.fam-rope { stroke-dasharray: 1; stroke-dashoffset: 1; }
.fam-go .fam-rope { animation: fam-draw 1300ms cubic-bezier(.45,.05,.3,1) 150ms forwards; }
.fam-leaf { opacity: 0; transform-box: fill-box; transform-origin: 50% 0%; }
.fam-go .fam-leaf { animation: fam-leaf 600ms ease-out forwards; }
.fam-flame { transform-box: fill-box; transform-origin: 50% 100%; }
.fam-go .fam-flame { animation: fam-glow 2400ms ease-in-out 1500ms 2; }
@media (prefers-reduced-motion: reduce) {
  .fam-rope { stroke-dashoffset: 0; }
  .fam-leaf { opacity: 1; }
  .fam-go .fam-rope, .fam-go .fam-leaf, .fam-go .fam-flame { animation: none; }
  .fam-item, .fam-arch, .fam-spine { transition: none !important; }
}
`;

/* ------------------------------------------------------------------ toran */

/** mango-leaf toran with marigolds, hung in two swags across both families */
const ropeY = (x: number) => {
  // two gentle swags: 0..160 and 160..320, deepest at 82 and 238
  const half = x <= 160 ? (x - 4) / 156 : (x - 160) / 156;
  return 7 + 11 * Math.sin(Math.PI * Math.min(Math.max(half, 0), 1));
};
const ROPE = Array.from({ length: 80 }, (_, i) => {
  const x = 4 + (i * 312) / 79;
  return `${i ? "L" : "M"}${x.toFixed(1)} ${ropeY(x).toFixed(1)}`;
}).join(" ");
const LEAVES = Array.from({ length: 15 }, (_, i) => 14 + i * 20.9);

function Toran() {
  return (
    <svg viewBox="0 0 320 46" className="relative z-10 block w-full" aria-hidden style={{ overflow: "visible" }}>
      {/* rope */}
      <path className="fam-rope" d={ROPE} pathLength={1} fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
      {/* end tassels */}
      {[4, 316].map((x) => (
        <g key={x} className="fam-leaf" style={{ animationDelay: "200ms" }}>
          <circle cx={x} cy="7" r="3" fill={GOLD2} />
          <path d={`M${x} 10v10`} stroke={GOLD} strokeWidth="1" />
          <path d={`M${x - 2.5} 20h5l-2.5 6Z`} fill={MAROON2} />
        </g>
      ))}
      {LEAVES.map((x, i) => {
        const y = ropeY(x);
        const marigold = i % 2 === 1;
        const tilt = ((i % 3) - 1) * 6;
        return (
          <g
            key={x}
            className="fam-leaf"
            style={{ animationDelay: `${450 + i * 55}ms`, ["--r" as string]: `${tilt}deg` } as CSSProperties}
          >
            {marigold ? (
              <>
                <path d={`M${x} ${y}v5`} stroke={GOLD} strokeWidth=".8" />
                <circle cx={x} cy={y + 9} r="4.4" fill="#E2A84B" />
                <circle cx={x} cy={y + 9} r="2.6" fill="#d9822b" />
                <circle cx={x} cy={y + 9} r="1" fill="#b8551f" />
              </>
            ) : (
              <>
                <path d={`M${x} ${y}c-4.5 5-4.8 13 0 19 4.8-6 4.5-14 0-19Z`} fill="#5f7340" />
                <path d={`M${x} ${y + 1.5}v15`} stroke={GOLD3} strokeWidth=".6" opacity=".9" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------- centre motif */

function Kalash() {
  return (
    <svg viewBox="0 0 40 52" style={{ width: u(36), height: u(47) }} aria-hidden>
      {/* mango leaves + coconut */}
      <path d="M20 14c-6-1-11-4-13-8 5 0 10 3 13 8Zm0 0c6-1 11-4 13-8-5 0-10 3-13 8Z" fill="#5f7340" />
      <ellipse cx="20" cy="10" rx="5" ry="6" fill="#8a5a2b" />
      <path d="M17 6c2-2 4-2 6 0" stroke="#5c3a1a" strokeWidth=".8" fill="none" />
      {/* pot */}
      <rect x="13" y="15" width="14" height="3" rx="1.2" fill={GOLD2} />
      <path d="M14 18c-8 4-9 17-2 23 5 4 11 4 16 0 7-6 6-19-2-23Z" fill={GOLD} />
      <path d="M12 27c5 2 11 2 16 0" stroke="#fbe7b8" strokeWidth="1" fill="none" />
      <path d="M11 32c6 2 12 2 18 0" stroke={MAROON2} strokeWidth="1.2" fill="none" />
      <circle cx="20" cy="29.5" r="1.6" fill={MAROON2} />
      <path d="M14 45h12" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Rings() {
  return (
    <svg viewBox="0 0 40 24" style={{ width: u(34), height: u(20) }} fill="none" stroke={GOLD} strokeWidth="1.5" aria-hidden>
      <circle cx="15" cy="13" r="8.5" />
      <circle cx="25" cy="13" r="8.5" />
      <path d="M15 4.5l-1.6-2.4h3.2Z" fill={GOLD3} stroke="none" />
    </svg>
  );
}

function Diya() {
  return (
    <svg viewBox="0 0 30 26" style={{ width: u(28), height: u(24) }} aria-hidden>
      <path className="fam-flame" d="M15 2c3 4 3 8 0 10-3-2-3-6 0-10Z" fill="#E2A84B" />
      <path d="M15 6c1.2 2 1.2 4 0 5-1.2-1-1.2-3 0-5Z" fill="#fff3c9" />
      <path d="M3 14h24c-1 6-6 9-12 9S4 20 3 14Z" fill={MAROON2} />
      <path d="M5 15.5h20" stroke={GOLD3} strokeWidth="1" />
    </svg>
  );
}

/** the gold thread that joins the two families: kalash at the top, rings in the middle, a diya below */
function Spine({ seen }: { seen: boolean }) {
  const line = (delay: number): CSSProperties => ({
    width: 1,
    background: `linear-gradient(180deg, transparent, ${GOLD3} 15%, ${GOLD3} 85%, transparent)`,
    transform: seen ? "scaleY(1)" : "scaleY(0)",
    transformOrigin: "top",
    transition: `transform 1200ms ease-out ${delay}ms`,
  });
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div
        className="fam-spine"
        style={{ marginTop: u(64), opacity: seen ? 1 : 0, transition: "opacity 800ms ease-out 300ms" }}
      >
        <Kalash />
      </div>
      <div className="fam-spine flex-1" style={line(700)} />
      <div className="fam-spine py-1" style={{ opacity: seen ? 1 : 0, transition: "opacity 700ms ease-out 1100ms" }}>
        <Rings />
      </div>
      <div className="fam-spine flex-1" style={line(1200)} />
      <div className="fam-spine" style={{ opacity: seen ? 1 : 0, transition: "opacity 700ms ease-out 1700ms" }}>
        <Diya />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- one side */

const ARCH = "50% 50% 7% 7% / 34% 34% 4% 4%";

/** jharokha window: gold double frame, dome finial and a small ledge, photo rising into it */
function Jharokha({ f, seen, delay }: { f: Fam; seen: boolean; delay: number }) {
  return (
    <figure className="relative mx-auto w-full" style={{ maxWidth: u(124) }}>
      {/* dome finial */}
      <svg viewBox="0 0 30 16" className="relative z-10 mx-auto block" style={{ width: u(26), height: u(14), marginBottom: u(-4) }} aria-hidden>
        <path d="M15 0v3" stroke={GOLD} strokeWidth="1.2" />
        <circle cx="15" cy="4" r="1.6" fill={GOLD2} />
        <path d="M6 15c0-6 4-9 9-9s9 3 9 9Z" fill={GOLD2} />
        <path d="M9 15c0-4 3-6.5 6-6.5s6 2.5 6 6.5" fill="none" stroke="#fbe7b8" strokeWidth=".8" />
      </svg>
      <div
        style={{
          borderRadius: ARCH,
          padding: u(3),
          background: `linear-gradient(160deg, #f3dc9d, ${GOLD} 45%, #e8c779 70%, ${GOLD})`,
          boxShadow: `0 ${u(8)} ${u(18)} ${u(-10)} rgba(90,40,10,.45)`,
        }}
      >
        <div style={{ borderRadius: ARCH, padding: u(3), background: "#fbf1df" }}>
          <div
            className="fam-arch relative overflow-hidden"
            style={{
              borderRadius: ARCH,
              aspectRatio: "3 / 4",
              background: "linear-gradient(180deg, #f6e3b8, #edd09a)",
              clipPath: seen ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
              transition: `clip-path 1200ms cubic-bezier(.3,.6,.2,1) ${delay}ms`,
            }}
          >
            {f.photo ? (
              <img
                src={f.photo}
                alt={`${f.side} photograph`}
                loading="lazy"
                className="block h-full w-full object-cover"
                style={{ objectPosition: "center 30%" }}
              />
            ) : (
              <svg viewBox="0 0 40 40" className="absolute inset-0 m-auto h-1/3 w-1/3" fill={GOLD} opacity=".55" aria-hidden>
                <path d="M20 6c4 5 4 12 0 18-4-6-4-13 0-18Z" />
                <path d="M20 26c-6-1-11-5-13-11 6 0 11 4 13 11Zm0 0c6-1 11-5 13-11-6 0-11 4-13 11Z" />
              </svg>
            )}
            {/* inner hairline of the window */}
            <div className="pointer-events-none absolute inset-0" style={{ borderRadius: ARCH, boxShadow: `inset 0 0 0 1px rgba(255,240,200,.55)` }} />
          </div>
        </div>
      </div>
      {/* chhajja ledge */}
      <div
        aria-hidden
        style={{
          height: u(6),
          margin: `${u(-2)} ${u(-6)} 0`,
          borderRadius: u(3),
          background: `linear-gradient(180deg, #f0d48e, ${GOLD})`,
          boxShadow: `0 ${u(3)} ${u(6)} ${u(-3)} rgba(90,40,10,.4)`,
        }}
      />
    </figure>
  );
}

function Item({ seen, delay, children, className = "" }: { seen: boolean; delay: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={`fam-item ${className}`}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : `translateY(${u(10)})`,
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FamilySide({ f, index, seen }: { f: Fam; index: number; seen: boolean }) {
  // the two sides reveal line by line, interleaved: row * 150ms, the groom's side 75ms behind
  const at = (row: number) => 500 + row * 150 + index * 75;
  const membersMr = isMarathi(f.members.join(""));
  let row = 0;
  return (
    <article className="min-w-0 text-center" aria-label={f.side}>
      <Jharokha f={f} seen={seen} delay={100 + index * 150} />

      <Item seen={seen} delay={at(row++)} className="mt-4">
        <p lang="mr" className="font-marathi text-[16px] font-semibold leading-tight" style={{ color: MAROON2 }}>
          {f.marathi}
        </p>
      </Item>
      <Item seen={seen} delay={at(row++)}>
        <p className="font-script text-[23px] leading-tight" style={{ color: GOLD }}>{f.side}</p>
      </Item>
      <Item seen={seen} delay={at(row++)} className="mt-1.5">
        <h3
          className="font-serif text-[16px] font-semibold uppercase leading-snug tracking-[0.08em]"
          style={{ color: MAROON, textWrap: "balance" } as CSSProperties}
        >
          {f.surname}
        </h3>
        <svg viewBox="0 0 60 8" className="mx-auto mt-1.5 block" style={{ width: u(54), height: u(7) }} aria-hidden>
          <path d="M2 4h22M36 4h22" stroke={GOLD3} strokeWidth=".9" />
          <path d="M30 .8l3.2 3.2L30 7.2 26.8 4Z" fill={GOLD2} />
        </svg>
      </Item>

      <ul className="mt-2 space-y-1">
        {f.parents.map((p) => (
          <li key={p}>
            <Item seen={seen} delay={at(row++)}>
              <span className="block font-serif text-[18px] font-semibold leading-[1.15]" style={{ color: INK }}>{p}</span>
            </Item>
          </li>
        ))}
      </ul>

      <Item seen={seen} delay={at(row++)} className="mt-3">
        {isMarathi(f.message) ? (
          <p lang="mr" className="font-marathi text-[14px] leading-[1.65]" style={{ color: MAROON2, textWrap: "balance" } as CSSProperties}>
            &ldquo;{f.message}&rdquo;
          </p>
        ) : (
          <p className="font-serif text-[15.5px] font-medium italic leading-snug" style={{ color: MAROON2, textWrap: "balance" } as CSSProperties}>
            &ldquo;{f.message}&rdquo;
          </p>
        )}
      </Item>

      <Item seen={seen} delay={at(row++)} className="mt-3">
        {membersMr ? (
          <p lang="mr" className="font-marathi text-[13.5px] leading-relaxed" style={{ color: `${INK}cc`, textWrap: "balance" } as CSSProperties}>
            {f.members.join(" · ")}
          </p>
        ) : (
          <p className="font-body text-[13px] leading-relaxed" style={{ color: `${INK}cc` }}>{f.members.join(" · ")}</p>
        )}
      </Item>
    </article>
  );
}

export default function Family() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const [bride, groom] = wedding.families;
  return (
    <section id="family" aria-labelledby="family-title" className="px-5 py-6">
      <style>{CSS}</style>
      <Reveal className="text-center">
        <p className="font-body text-[11px] uppercase tracking-[0.35em] text-olive">Two families, one celebration</p>
        <h2 id="family-title" className="section-title mt-2">With Our Families</h2>
      </Reveal>

      <div ref={ref} className={`relative mt-6 ${seen ? "fam-go" : ""}`}>
        {/* soft watercolor wash behind the composition */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[8%] bottom-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 22% 30%, rgba(212,174,94,.22), transparent 70%)," +
              "radial-gradient(ellipse 55% 40% at 78% 30%, rgba(201,139,123,.18), transparent 70%)," +
              "radial-gradient(ellipse 70% 45% at 50% 75%, rgba(226,168,75,.14), transparent 72%)",
            filter: `blur(${u(6)})`,
            opacity: seen ? 1 : 0,
            transition: "opacity 1400ms ease-out",
          }}
        />

        <Toran />

        <div className="relative -mt-1 grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] gap-x-1.5">
          <FamilySide f={bride} index={0} seen={seen} />
          <Spine seen={seen} />
          <FamilySide f={groom} index={1} seen={seen} />
        </div>
      </div>
    </section>
  );
}
