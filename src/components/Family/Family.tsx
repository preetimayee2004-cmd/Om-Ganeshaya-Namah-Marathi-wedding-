import type { CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";

/**
 * "With Our Families": one parchment card per side. The family photo stands inside a carved
 * sandstone arch with chhatri turrets, bougainvillea spills over the top corners, petals drift
 * down, and small watercolour vignettes (local train with palms, the Gateway with a boat) sit
 * beside the family's name. All artwork is inline SVG, so it scales with the phone column.
 */

type Family = (typeof wedding.families)[number];

const MAROON = "#8e1726";
const INK = "#3a1d14";
const GOLD = "#b8862f";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const u = (n: number) => `calc(var(--u) * ${n})`;
const isMarathi = (s: string) => /[ऀ-ॿ]/.test(s);

const FAM_CSS = `
.fam-card { opacity: 0; transform: translateY(calc(var(--u) * 26)); transition: opacity 900ms ease-out, transform 1100ms cubic-bezier(.2,.8,.25,1); }
.fam-card.is-seen { opacity: 1; transform: none; }
.fam-card .fam-photo { transform: scale(1.08); transform-origin: 50% 30%; transition: transform 2400ms cubic-bezier(.2,.8,.25,1) 200ms; }
.fam-card.is-seen .fam-photo { transform: none; }
.fam-card .fam-text > * { opacity: 0; transform: translateY(calc(var(--u) * 10)); transition: opacity 700ms ease-out, transform 800ms ease-out; transition-delay: calc(500ms + var(--i) * 140ms); }
.fam-card.is-seen .fam-text > * { opacity: 1; transform: none; }
.fam-petal { position: absolute; top: -4%; width: calc(var(--u) * 9); height: calc(var(--u) * 7); border-radius: 70% 0 70% 0; background: linear-gradient(135deg, #e0457b, #a3134a); opacity: 0; animation: fam-fall linear infinite; }
@keyframes fam-fall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0 }
  8% { opacity: .85 }
  85% { opacity: .75 }
  100% { transform: translate(var(--dx), calc(var(--u) * 640)) rotate(320deg); opacity: 0 }
}
@media (prefers-reduced-motion: reduce) {
  .fam-card, .fam-card .fam-photo, .fam-card .fam-text > * { opacity: 1 !important; transform: none !important; transition: none !important; }
  .fam-petal { display: none; }
}
`;

/** small gold lotus between two hairlines */
function LotusRule({ w = 150, dotted = false, style }: { w?: number; dotted?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 18" className="mx-auto block" style={{ width: u(w), height: u(w * 0.09), ...style }} fill="none" stroke={GOLD} aria-hidden>
      <path d="M8 10h74M118 10h74" strokeWidth=".9" strokeDasharray={dotted ? "1 5" : undefined} strokeLinecap="round" />
      <path d="M100 2.5c2.6 2.6 3.4 6.4 0 10.5-3.4-4.1-2.6-7.9 0-10.5Z" fill="#f3dfae" strokeWidth=".9" />
      <path d="M100 13c-1.8-4-5-6-9.5-6 .9 4 4.4 6 9.5 6Zm0 0c1.8-4 5-6 9.5-6-.9 4-4.4 6-9.5 6Z" fill="#f3dfae" strokeWidth=".9" />
      <path d="M88 14.5c6 1.6 18 1.6 24 0" strokeWidth=".8" />
    </svg>
  );
}

/** maroon swash under a heading */
function Swash({ w = 120 }: { w?: number }) {
  return (
    <svg viewBox="0 0 200 14" className="mx-auto block" style={{ width: u(w), height: u(w * 0.07) }} fill="none" stroke={MAROON} strokeLinecap="round" aria-hidden>
      <path d="M6 9C50 1 110 1 194 7" strokeWidth="1.3" />
      <path d="M30 10c40-5 90-5 140-1" strokeWidth=".6" opacity=".5" />
    </svg>
  );
}

/** bougainvillea spray for a top corner (drawn for the left corner; mirror it for the right) */
export function Bougainvillea({ flip, style }: { flip?: boolean; style?: CSSProperties }) {
  const blooms = [
    [14, 12, 1.2], [34, 8, 1], [52, 18, 1.1], [24, 30, 1.15], [8, 44, 1], [44, 38, 0.9], [66, 10, 0.85],
    [18, 62, 0.9], [36, 54, 0.8], [80, 24, 0.75], [6, 80, 0.8], [58, 30, 0.7], [28, 86, 0.65], [92, 8, 0.7],
  ] as const;
  const leaves = [
    [22, 20, 30], [46, 26, -20], [12, 54, 70], [60, 22, -40], [30, 44, 10], [74, 16, -10], [16, 72, 80], [40, 66, 40],
  ] as const;
  return (
    <svg viewBox="0 0 110 110" className="pointer-events-none absolute" style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }} aria-hidden>
      <path d="M0 6C30 10 60 14 104 4M2 4C6 40 10 70 4 104M10 14C30 30 40 50 36 70" fill="none" stroke="#6b4a2a" strokeWidth="1.1" opacity=".55" />
      {leaves.map(([x, y, r], i) => (
        <ellipse key={`l${i}`} cx={x} cy={y} rx="6" ry="2.8" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? "#5d7d3a" : "#4b6b2f"} opacity=".9" />
      ))}
      {blooms.map(([x, y, s], i) => (
        <g key={`b${i}`} transform={`translate(${x} ${y}) scale(${s}) rotate(${i * 37})`}>
          {[0, 120, 240].map((a) => (
            <path key={a} d="M0 0C-4.5-3-4.5-8.5 0-10 4.5-8.5 4.5-3 0 0Z" transform={`rotate(${a})`} fill={i % 3 === 0 ? "#c2185b" : i % 3 === 1 ? "#d6336c" : "#ad1457"} stroke="#8a0f45" strokeWidth=".4" />
          ))}
          <circle r="1.3" fill="#fff3c4" />
        </g>
      ))}
    </svg>
  );
}

/** palms and a yellow-and-violet local train running into the distance */
function TrainVignette({ style }: { style?: CSSProperties }) {
  const cars = [
    { x: 0, y: 44, w: 40, h: 20 },
    { x: 41, y: 47, w: 32, h: 16 },
    { x: 74, y: 49, w: 25, h: 13 },
    { x: 100, y: 51, w: 18, h: 10 },
  ];
  return (
    <svg viewBox="0 0 124 70" className="pointer-events-none absolute" style={style} aria-hidden>
      <defs>
        <linearGradient id="fam-wash" x1="0" x2="1">
          <stop offset="0" stopColor="#f2dcb0" stopOpacity=".9" />
          <stop offset="1" stopColor="#f2dcb0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="62" width="124" height="6" fill="url(#fam-wash)" />
      {/* palms */}
      {[
        [16, 42, 4, -6],
        [30, 46, 0, 4],
      ].map(([x, top, lean, sway], i) => (
        <g key={i}>
          <path d={`M${x} 64C${x + lean} 54 ${x + lean} ${top + 4} ${x + sway / 2} ${top - 24}`} fill="none" stroke="#7a5a3a" strokeWidth="1.6" />
          {[-150, -110, -70, -30, 10, -180].map((a, k) => {
            const cx = x + sway / 2;
            const cy = top - 24;
            const r = (a * Math.PI) / 180;
            return <path key={k} d={`M${cx} ${cy}q${Math.cos(r) * 7} ${Math.sin(r) * 7 - 3} ${Math.cos(r) * 14} ${Math.sin(r) * 14 + 4}`} fill="none" stroke={k % 2 ? "#4f7a35" : "#3f6a2a"} strokeWidth="2.2" strokeLinecap="round" />;
          })}
        </g>
      ))}
      {/* rails */}
      <path d="M0 66L124 60M0 68.5L124 62" stroke="#8a7560" strokeWidth=".7" opacity=".7" />
      {cars.map((c, i) => {
        const n = Math.max(2, Math.round(c.w / 8));
        return (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="1.6" fill="#f0cf63" stroke="#6b5a4a" strokeWidth=".5" />
          <rect x={c.x} y={c.y + c.h * 0.55} width={c.w} height={c.h * 0.32} fill="#8d74c0" />
          <rect x={c.x} y={c.y - 1.2} width={c.w} height="1.6" rx=".8" fill="#9c958c" />
          {Array.from({ length: n }, (_, k) => (
            <rect key={k} x={c.x + 2 + (k * (c.w - 4)) / n} y={c.y + c.h * 0.16} width={(c.w - 4) / n - 1.6} height={c.h * 0.28} fill="#4a4358" opacity=".85" />
          ))}
        </g>
        );
      })}
    </svg>
  );
}

/** the Gateway with a little ferry and birds over the water */
function GatewayVignette({ style }: { style?: CSSProperties }) {
  const stone = "#d6b182";
  const line = "#8a6a48";
  return (
    <svg viewBox="0 0 124 70" className="pointer-events-none absolute" style={style} aria-hidden>
      {/* birds */}
      <path d="M86 8q3-3 6 0q3-3 6 0M100 15q2-2 4 0q2-2 4 0M78 18q2-2 4 0q2-2 4 0" fill="none" stroke="#6b5a4a" strokeWidth=".7" />
      {/* side wings */}
      <rect x="28" y="30" width="14" height="22" fill={stone} stroke={line} strokeWidth=".5" />
      <rect x="82" y="30" width="14" height="22" fill={stone} stroke={line} strokeWidth=".5" />
      {/* central block with the great arch */}
      <path d="M42 52V20h40v32h-10V36c0-6-4-10-10-10s-10 4-10 10v16Z" fill={stone} stroke={line} strokeWidth=".6" />
      <path d="M44 22h36M44 28h36" stroke={line} strokeWidth=".35" />
      {/* corner turrets and domes */}
      {[42, 52, 72, 82].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="11" width="6" height="9" fill={stone} stroke={line} strokeWidth=".45" />
          <path d={`M${x - 3.6} 11c0-4 7.2-4 7.2 0Z`} fill="#c99f6c" stroke={line} strokeWidth=".45" />
          <path d={`M${x} 6.5v-2`} stroke={line} strokeWidth=".5" />
        </g>
      ))}
      <path d="M30 30c0-3 10-3 10 0M84 30c0-3 10-3 10 0" fill="#c99f6c" stroke={line} strokeWidth=".45" />
      {/* water */}
      <rect x="0" y="52" width="124" height="18" fill="#a9c6cf" opacity=".55" />
      <path d="M6 57h14M30 60h18M64 58h12M90 63h20M14 65h16" stroke="#ffffff" strokeWidth=".8" opacity=".8" strokeLinecap="round" />
      {/* reflection */}
      <rect x="44" y="53" width="36" height="6" fill={stone} opacity=".25" />
      {/* ferry */}
      <g transform="translate(90 55)">
        <path d="M0 4h20l-3 4H3Z" fill="#f7f3ea" stroke="#5a6b80" strokeWidth=".5" />
        <rect x="4" y="0" width="11" height="4" fill="#3f6ea8" />
        <rect x="6" y="-2.5" width="6" height="2.5" fill="#f7f3ea" stroke="#5a6b80" strokeWidth=".4" />
      </g>
    </svg>
  );
}

/** carved sandstone arch with chhatri turrets; the family photo fills the opening and fades at the foot */
function StoneArch({ photo, alt, id }: { photo?: string; alt: string; id: string }) {
  const opening = "M84 430V222C84 168 140 140 200 124C260 140 316 168 316 222V430Z";
  const turret = (cx: number) => (
    <g key={cx}>
      <path d={`M${cx} 10v12`} stroke="#9a7238" strokeWidth="1.4" />
      <circle cx={cx} cy="9" r="2" fill="#d9b673" stroke="#9a7238" strokeWidth=".7" />
      <path d={`M${cx - 19} 48C${cx - 19} 24 ${cx + 19} 24 ${cx + 19} 48Z`} fill={`url(#${id}-dome)`} stroke="#9a7238" strokeWidth=".9" />
      <path d={`M${cx - 10} 30C${cx - 6} 27 ${cx + 6} 27 ${cx + 10} 30`} fill="none" stroke="#b58e4e" strokeWidth=".6" />
      <rect x={cx - 25} y="47" width="50" height="6" rx="1.5" fill="#e6c88e" stroke="#9a7238" strokeWidth=".8" />
      <rect x={cx - 19} y="53" width="38" height="36" fill={`url(#${id}-stone)`} stroke="#9a7238" strokeWidth=".8" />
      <path d={`M${cx - 7} 86V68c0-6 14-6 14 0v18Z`} fill="#6f5232" opacity=".8" />
      <path d={`M${cx - 15} 86V72M${cx + 15} 86V72`} stroke="#b58e4e" strokeWidth=".7" />
      <rect x={cx - 24} y="89" width="48" height="11" rx="1.5" fill="#e3c487" stroke="#9a7238" strokeWidth=".8" />
    </g>
  );
  return (
    <svg viewBox="18 0 364 430" className="block w-full" role={photo ? "img" : undefined} aria-label={photo ? alt : undefined} aria-hidden={photo ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1d9a6" />
          <stop offset=".6" stopColor="#e2c085" />
          <stop offset="1" stopColor="#d6ad6c" />
        </linearGradient>
        <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9b673" />
          <stop offset=".45" stopColor="#f6e2b5" />
          <stop offset="1" stopColor="#c9a05e" />
        </linearGradient>
        <pattern id={`${id}-blocks`} width="34" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 15.5h34M17 0v15.5" stroke="#a9803f" strokeWidth=".55" opacity=".45" fill="none" />
        </pattern>
        <clipPath id={`${id}-open`}>
          <path d={opening} />
        </clipPath>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".7" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="430">
          <rect x="0" y="0" width="400" height="430" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>

      <g mask={`url(#${id}-mask)`}>
        {/* photo in the opening */}
        <rect x="84" y="120" width="232" height="310" fill="#3b2a1e" clipPath={`url(#${id}-open)`} />
        {photo && (
          <g clipPath={`url(#${id}-open)`}>
            <image className="fam-photo" href={photo} x="80" y="120" width="240" height="310" preserveAspectRatio="xMidYMin slice" />
          </g>
        )}

        {/* the wall around the opening, with stone courses */}
        <path d={`M30 112H370V430H30Z${opening}`} fillRule="evenodd" fill={`url(#${id}-stone)`} />
        <path d={`M30 112H370V430H30Z${opening}`} fillRule="evenodd" fill={`url(#${id}-blocks)`} />

        {/* pillars */}
        {[34, 322].map((x) => (
          <g key={x}>
            <rect x={x} y="214" width="44" height="216" fill="#ecd29d" stroke="#a9803f" strokeWidth=".8" />
            <path d={`M${x + 11} 226v204M${x + 22} 226v204M${x + 33} 226v204`} stroke="#b9914f" strokeWidth=".7" opacity=".8" />
            <rect x={x - 5} y="204" width="54" height="10" rx="2" fill="#e8c98e" stroke="#9a7238" strokeWidth=".8" />
            <rect x={x - 2} y="214" width="48" height="6" fill="#dcbb7d" stroke="#9a7238" strokeWidth=".5" />
          </g>
        ))}

        {/* moulded arch frame with a bead trim */}
        <path d="M74 430V220C74 160 136 126 200 110C264 126 326 160 326 220V430" fill="none" stroke="#9a7238" strokeWidth="1.6" />
        <path d="M79 430V221C79 164 138 132 200 117C262 132 321 164 321 221V430" fill="none" stroke="#f7e6bd" strokeWidth="2" opacity=".8" />
        <path d={opening} fill="none" stroke="#c49a55" strokeWidth="4.5" strokeDasharray="0 8.5" strokeLinecap="round" />
        <path d={opening} fill="none" stroke="#8a6430" strokeWidth=".9" />
        {/* spandrel rosettes */}
        {[58, 342].map((x) => (
          <g key={x} transform={`translate(${x} 160)`}>
            <circle r="11" fill="#ecd29d" stroke="#9a7238" strokeWidth=".8" />
            {Array.from({ length: 8 }, (_, k) => (
              <ellipse key={k} cx="0" cy="-5.5" rx="2.3" ry="4.6" transform={`rotate(${k * 45})`} fill="#f6e3b8" stroke="#a9803f" strokeWidth=".5" />
            ))}
            <circle r="2.6" fill="#c49a55" />
          </g>
        ))}

        {/* cornice and parapet */}
        <rect x="24" y="100" width="352" height="13" rx="2" fill="#e6c88e" stroke="#9a7238" strokeWidth=".9" />
        <path d="M24 108h352" stroke="#a9803f" strokeWidth=".5" />
        {Array.from({ length: 14 }, (_, k) => (
          <rect key={k} x={84 + k * 17} y="90" width="9" height="10" rx="1" fill="#e9cf98" stroke="#9a7238" strokeWidth=".6" />
        ))}

        {/* crest over the apex */}
        <path d="M200 66c14 10 22 22 22 36H178c0-14 8-26 22-36Z" fill={`url(#${id}-dome)`} stroke="#9a7238" strokeWidth=".9" />
        <path d="M200 74v26M190 82l10 18 10-18M184 92l16 8 16-8" fill="none" stroke="#a9803f" strokeWidth=".7" />
        <circle cx="200" cy="64" r="2.4" fill="#d9b673" stroke="#9a7238" strokeWidth=".6" />

        {/* chhatri turrets on the corners */}
        {turret(52)}
        {turret(348)}

        {/* marigold strings hanging inside the arch */}
        {[102, 298].map((x) => (
          <g key={x}>
            {Array.from({ length: 7 }, (_, k) => (
              <circle key={k} cx={x} cy={190 + k * 6} r="3" fill={k % 2 ? "#f2a71b" : "#e98a15"} />
            ))}
            <circle cx={x} cy="236" r="2" fill="#fff4d6" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function FamilyCard({ f, index }: { f: Family; index: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  const flip = index % 2 === 1; // groom's card puts the train on the right
  const msgMarathi = isMarathi(f.message);
  const petals = [
    { left: "8%", dx: u(40), delay: "0s", dur: "11s" },
    { left: "22%", dx: u(-30), delay: "3.5s", dur: "13s" },
    { left: "78%", dx: u(-44), delay: "1.6s", dur: "12s" },
    { left: "90%", dx: u(26), delay: "6s", dur: "14s" },
    { left: "60%", dx: u(30), delay: "8s", dur: "12.5s" },
  ];
  const t = (i: number) => ({ "--i": i } as CSSProperties);
  return (
    <div ref={ref} className={`fam-card ${seen ? "is-seen" : ""}`}>
      <article
        className="relative mx-auto max-w-[400px] overflow-hidden text-center"
        style={{
          borderRadius: u(26),
          background: "radial-gradient(ellipse at 50% 35%, #fbe3c0 0%, #faddb5 55%, #f4d0a2 100%)",
          border: `${u(1.5)} solid #dcc08a`,
          boxShadow: `0 ${u(10)} ${u(26)} ${u(-12)} rgba(110,70,20,0.38)`,
        }}
        aria-label={f.side}
      >
        <div className="pointer-events-none absolute z-[3]" style={{ inset: u(7), borderRadius: u(20), border: `${u(1)} solid #e4cd9c` }} aria-hidden />

        {/* bougainvillea over the top corners, petals drifting down */}
        <Bougainvillea style={{ left: u(-4), top: u(-4), width: u(122), height: u(122), zIndex: 4 }} />
        <Bougainvillea flip style={{ right: u(-4), top: u(-4), width: u(122), height: u(122), zIndex: 4 }} />
        <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
          {petals.map((p, i) => (
            <span key={i} className="fam-petal" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, ["--dx" as string]: p.dx }} />
          ))}
        </div>

        {/* arch with the photo */}
        <div className="relative z-[2] px-[3%] pt-[6%]">
          <StoneArch photo={f.photo} alt={`${f.side} photograph`} id={`fam${index}`} />
        </div>

        {/* name block, with the vignettes on either side */}
        <div className="relative z-[2] -mt-[6%] px-6 pb-16">
          <TrainVignette style={{ [flip ? "right" : "left"]: 0, bottom: u(12), width: u(100), opacity: 0.85, transform: flip ? "scaleX(-1)" : undefined }} />
          <GatewayVignette style={{ [flip ? "left" : "right"]: 0, bottom: u(12), width: u(100), opacity: 0.8, transform: flip ? "scaleX(-1)" : undefined }} />

          <div className="fam-text relative">
            <div style={t(0)}>
              <LotusRule w={150} />
            </div>
            <p lang="mr" className="mt-2 font-marathi text-[17px] font-semibold" style={{ color: MAROON, ...t(1) }}>
              {f.marathi}
            </p>
            <h3 className="font-script text-[46px] font-normal leading-[1.05]" style={{ color: MAROON, ...t(2) }}>
              {f.side}
            </h3>
            <div style={t(3)}>
              <Swash w={130} />
            </div>
            <ul className="mt-4 space-y-0.5 text-[20px] font-medium leading-snug" style={{ fontFamily: SERIF, color: INK, ...t(4) }}>
              {f.parents.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-4" style={t(5)}>
              <LotusRule w={170} />
            </div>
            {msgMarathi ? (
              <p lang="mr" className="mx-auto mt-3 max-w-[18rem] font-marathi text-[17px] leading-[1.7]" style={{ color: MAROON, textWrap: "balance", ...t(6) }}>
                &ldquo;{f.message}&rdquo;
              </p>
            ) : (
              <p className="mx-auto mt-3 max-w-[17.5rem] font-script text-[27px] leading-[1.25]" style={{ color: MAROON, textWrap: "balance", ...t(6) }}>
                &ldquo;{f.message}&rdquo;
              </p>
            )}
            <div className="mt-5" style={t(7)}>
              <LotusRule w={150} dotted />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function Family() {
  return (
    <section id="family" aria-labelledby="family-title" className="px-4 py-6">
      <style>{FAM_CSS}</style>
      <Reveal className="text-center">
        <p className="font-serif text-[12px] font-semibold uppercase tracking-[0.32em]" style={{ color: INK, paddingLeft: "0.32em" }}>
          Two families · One celebration
        </p>
        <LotusRule w={190} style={{ marginTop: u(8) }} />
        <h2 id="family-title" className="section-title mt-2" style={{ color: MAROON }}>
          With Our Families
        </h2>
        <Swash w={110} />
      </Reveal>

      <div className="mt-8 space-y-8">
        {wedding.families.map((f, i) => (
          <FamilyCard key={f.side} f={f} index={i} />
        ))}
      </div>
    </section>
  );
}
