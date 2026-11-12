import type { ComponentType, CSSProperties, ReactNode } from "react";
import { useInView } from "../Layout/Reveal";
import { Details, Names, Tagline, When, fmtDay, fmtTime, t, u, type Palette, type WeddingEvent } from "./eventParts";

type VProps = { e: WeddingEvent; index: number };

/** wrapper: owns the in-view trigger, so every vignette animates on its own scroll moment */
function Shell({ e, className = "", style, children }: { e: WeddingEvent; className?: string; style?: CSSProperties; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  return (
    <article
      ref={ref}
      aria-labelledby={`ev-${e.id}-title`}
      className={`ev-v relative overflow-hidden ${seen ? "is-seen" : ""} ${className}`}
      style={style}
    >
      {children}
    </article>
  );
}

const IMG = "h-full w-full object-cover";

/* ───────────────────────── Haldi: turmeric wash + brush stroke ───────────────────────── */

const HALDI: Palette = { ink: "#4a1a16", accent: "#a2520a", label: "#8a4a07", body: "#4a1a16", dotRing: "#c98a15" };

function Marigold({ size = 16, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="-12 -12 24 24" style={{ width: u(size), height: u(size), ...style }} aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-6.8" rx="3.3" ry="4.6" fill="#E98A15" transform={`rotate(${i * 30})`} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse key={`b${i}`} cx="0" cy="-4" rx="2.4" ry="3.3" fill="#F5B820" transform={`rotate(${i * 36 + 18})`} />
      ))}
      <circle r="2.4" fill="#B35A0B" />
    </svg>
  );
}

function Haldi({ e }: VProps) {
  const drop = [0, 6, 10, 12, 10, 6, 0];
  return (
    <Shell
      e={e}
      className="rounded-[22px_14px_26px_12px] px-4 pb-6 pt-9"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 18% 18%, rgba(245,190,40,0.55), transparent 70%)," +
          "radial-gradient(ellipse 60% 40% at 88% 70%, rgba(233,138,21,0.28), transparent 70%)," +
          "radial-gradient(ellipse 80% 50% at 40% 100%, rgba(242,193,46,0.35), transparent 70%), #fff6da",
        boxShadow: `0 ${u(3)} ${u(10)} rgba(150,95,10,0.18)`,
      }}
    >
      {/* marigold toran along the top edge */}
      <div aria-hidden className="pointer-events-none absolute inset-x-4 top-0 flex justify-between">
        <svg className="absolute inset-x-0 top-0 h-[22px] w-full" viewBox="0 0 100 22" preserveAspectRatio="none" fill="none">
          <path d="M0 2 Q50 26 100 2" stroke="#8a5f15" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {drop.map((d, i) => (
          <Marigold key={i} size={i % 2 ? 14 : 17} style={{ marginTop: u(d - 4) }} />
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative min-w-0 flex-1 py-2">
          {/* the turmeric brush stroke sweeping behind the title */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -left-2 top-1/2 h-[78px] w-[calc(100%+12px)] -translate-y-1/2"
            viewBox="0 0 300 80"
            preserveAspectRatio="none"
            fill="none"
            strokeLinecap="round"
          >
            <path className="ev-draw" style={t(150, 900)} pathLength={1} d="M10 52 C70 30 130 60 190 40 S270 28 292 34" stroke="#F2C12E" strokeOpacity="0.7" strokeWidth="30" />
            <path className="ev-draw" style={t(320, 800)} pathLength={1} d="M18 60 C80 44 140 66 200 50 S262 42 286 46" stroke="#E9A520" strokeOpacity="0.35" strokeWidth="8" />
          </svg>
          <Names e={e} p={HALDI} />
          <Tagline e={e} p={HALDI} />
        </div>
        <div className="relative shrink-0">
          <div
            className="h-[112px] w-[112px] overflow-hidden rounded-full"
            style={{ border: `${u(3)} solid #fff4d6`, boxShadow: `0 0 0 ${u(1.5)} #E98A15, 0 ${u(3)} ${u(8)} rgba(150,90,10,0.3)` }}
          >
            <img src={e.image} alt="" loading="lazy" className={IMG} />
          </div>
          <Marigold size={26} style={{ position: "absolute", bottom: u(-4), left: u(-6) }} />
        </div>
      </div>

      <When e={e} p={HALDI} />
      <Details e={e} p={HALDI} />
    </Shell>
  );
}

/* ───────────────────────── Mehendi: henna line pattern drawing itself ───────────────────────── */

const MEHENDI: Palette = { ink: "#23401f", accent: "#3f6d2f", label: "#3f6d2f", body: "#2b3a24", dotRing: "#5E8C4A" };

/** scalloped henna border around an ellipse */
function scallops(cx: number, cy: number, rx: number, ry: number, n: number, bulge: number) {
  const pt = (a: number, k = 1) => `${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`;
  let d = `M${pt(-Math.PI / 2)}`;
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const a1 = a0 + (2 * Math.PI) / n;
    d += ` Q${pt((a0 + a1) / 2, bulge)} ${pt(a1)}`;
  }
  return d;
}
const SCALLOP = scallops(75, 95, 61, 79, 22, 1.11);
const MEHENDI_DOTS = Array.from({ length: 22 }, (_, i) => {
  const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / 22;
  return { x: 75 + Math.cos(a) * 61 * 1.17, y: 95 + Math.sin(a) * 79 * 1.15 };
});

function Mehendi({ e }: VProps) {
  return (
    <Shell
      e={e}
      className="rounded-[18px] px-4 pb-6 pt-5"
      style={{
        background: "linear-gradient(160deg, #f1f7ea 0%, #e3efd8 55%, #f6f3e2 100%)",
        border: "1px solid rgba(94,140,74,0.45)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[190px] w-[150px] shrink-0">
          <div className="absolute left-[19px] top-[21px] h-[148px] w-[112px] overflow-hidden rounded-[50%]">
            <img src={e.image} alt="" loading="lazy" className={IMG} />
          </div>
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 150 190" fill="none" stroke="#3f6d2f" strokeLinecap="round">
            <ellipse className="ev-draw" style={t(0, 1000)} pathLength={1} cx="75" cy="95" rx="58.5" ry="76.5" strokeWidth="1.4" />
            <path className="ev-draw" style={t(250, 1400)} pathLength={1} d={SCALLOP} strokeWidth="1.1" />
            {MEHENDI_DOTS.map((d, i) => (
              <circle key={i} className="ev-bloom" style={t(1100 + i * 25, 400)} cx={d.x} cy={d.y} r="1.5" fill="#3f6d2f" stroke="none" />
            ))}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <Names e={e} p={MEHENDI} />
          {/* henna vine under the name */}
          <svg aria-hidden className="mt-1 h-[16px] w-full max-w-[120px]" viewBox="0 0 120 16" fill="none" stroke="#5E8C4A" strokeWidth="1.2" strokeLinecap="round">
            <path className="ev-draw" style={t(500, 900)} pathLength={1} d="M2 9 C22 2 38 15 58 8 S96 3 118 9" />
            <path className="ev-draw" style={t(900, 500)} pathLength={1} d="M30 7 q4 -6 10 -5 q-3 6 -10 5Z M78 6 q5 -5 10 -3 q-4 5 -10 3Z" />
          </svg>
          <Tagline e={e} p={MEHENDI} />
          <When e={e} p={MEHENDI} />
        </div>
      </div>
      <Details e={e} p={MEHENDI} />
    </Shell>
  );
}

/* ───────────────────────── Seemant Pujan: kalash + rangoli bloom ───────────────────────── */

const KALASH: Palette = { ink: "#4a1a16", accent: "#b2500a", label: "#8a5f15", body: "#4a1a16", dotRing: "#b8862f" };

const RANGOLI_RINGS = [
  { r: 103, n: 32 },
  { r: 113, n: 40 },
];

function KalashIcon() {
  return (
    <svg viewBox="0 0 40 44" className="mx-auto h-[38px] w-[34px]" aria-hidden>
      <path d="M20 15 C14 10 8 9 3 11 C8 14 14 15 20 15Z" fill="#5E8C4A" />
      <path d="M20 15 C26 10 32 9 37 11 C32 14 26 15 20 15Z" fill="#5E8C4A" />
      <ellipse cx="20" cy="10" rx="5.5" ry="6.5" fill="#8a5a2b" />
      <rect x="14" y="15" width="12" height="5" rx="1.5" fill="#C9963A" />
      <path d="M8 27 Q8 41 20 42 Q32 41 32 27 Q32 21 26 20 H14 Q8 21 8 27Z" fill="#E07B1A" />
      <path d="M9 28 H31" stroke="#F3D58A" strokeWidth="1.6" />
      <circle cx="20" cy="33" r="2" fill="#F3D58A" />
    </svg>
  );
}

function Kalash({ e }: VProps) {
  return (
    <Shell
      e={e}
      className="rounded-[18px] px-4 pb-6 pt-5"
      style={{
        background: "radial-gradient(circle at 50% 22%, #fff3dc 0%, #fde6c4 55%, #f9dcb2 100%)",
        border: "1px solid #D4AE5E",
        boxShadow: `inset 0 0 0 ${u(4)} rgba(255,247,230,0.6), inset 0 0 0 ${u(5)} rgba(201,150,58,0.45)`,
      }}
    >
      <div className="relative mx-auto h-[236px] w-[236px] max-w-full">
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="-120 -120 240 240">
          {Array.from({ length: 8 }, (_, i) => (
            <g key={`p${i}`} transform={`rotate(${i * 45})`}>
              <path className="ev-bloom" style={t(250 + i * 70, 650)} d="M0 -68 C10 -76 10 -90 0 -99 C-10 -90 -10 -76 0 -68Z" fill="#E07B1A" fillOpacity="0.9" />
            </g>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={`g${i}`} transform={`rotate(${i * 45 + 22.5})`}>
              <path className="ev-bloom" style={t(450 + i * 70, 600)} d="M0 -68 C7 -74 7 -82 0 -88 C-7 -82 -7 -74 0 -68Z" fill="#D4A53C" />
            </g>
          ))}
          <circle className="ev-draw" style={t(0, 800)} pathLength={1} r="67" fill="none" stroke="#b8862f" strokeWidth="2" />
          {RANGOLI_RINGS.flatMap((ring, ri) =>
            Array.from({ length: ring.n }, (_, i) => {
              const a = (i / ring.n) * Math.PI * 2;
              return (
                <circle
                  key={`d${ri}-${i}`}
                  className="ev-bloom"
                  style={t(900 + ri * 200 + (i % 4) * 30, 450)}
                  cx={(Math.cos(a) * ring.r).toFixed(1)}
                  cy={(Math.sin(a) * ring.r).toFixed(1)}
                  r={ri === 0 ? 2.6 : 2}
                  fill={ri === 0 ? "#b2500a" : "#C9963A"}
                />
              );
            }),
          )}
        </svg>
        <div className="absolute left-1/2 top-1/2 h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full" style={{ border: `${u(2)} solid #fff4dc` }}>
          <img src={e.image} alt="" loading="lazy" className={IMG} />
        </div>
      </div>

      <div className="mt-2">
        <KalashIcon />
        <Names e={e} p={KALASH} center />
        <Tagline e={e} p={KALASH} center />
        <When e={e} p={KALASH} center />
      </div>
      <Details e={e} p={KALASH} center />
    </Shell>
  );
}

/* ───────────────────────── Antarpat & Mangalashtak: the silk cloth parts ───────────────────────── */

const ANTARPAT: Palette = { ink: "#4a1a16", accent: "#7a1420", label: "#8a5f15", body: "#4a1a16", dotRing: "#b8862f" };

const cloth = (side: "l" | "r"): CSSProperties => ({
  backgroundImage:
    `radial-gradient(circle, rgba(222,184,100,0.6) ${u(1.1)}, transparent ${u(1.6)}),` +
    "linear-gradient(180deg, #8f1c2b 0%, #6d0f1b 100%)",
  backgroundSize: `${u(9)} ${u(9)}, auto`,
  boxShadow:
    `inset 0 ${u(-9)} 0 #C9963A, inset 0 ${u(-11)} 0 #6d0f1b, inset 0 ${u(-12)} 0 #D4AE5E,` +
    (side === "l" ? `inset ${u(-2)} 0 0 #D4AE5E, inset ${u(3)} 0 0 #C9963A` : `inset ${u(2)} 0 0 #D4AE5E, inset ${u(-3)} 0 0 #C9963A`),
});

function Antarpat({ e }: VProps) {
  return (
    <Shell
      e={e}
      className="rounded-[6px] px-4 pb-6 pt-6"
      style={{
        background: "#fbf1df",
        borderTop: `${u(5)} solid #7a1420`,
        borderBottom: `${u(5)} solid #7a1420`,
        boxShadow: `inset 0 ${u(3)} 0 #C9963A, inset 0 ${u(-3)} 0 #C9963A, 0 ${u(3)} ${u(10)} rgba(90,20,20,0.16)`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <Names e={e} p={ANTARPAT} />
          <Tagline e={e} p={ANTARPAT} />
          <When e={e} p={ANTARPAT} />
        </div>
        <div className="shrink-0">
          {/* the rod the cloth is held from */}
          <div aria-hidden className="mx-auto h-[4px] w-[136px] rounded-full" style={{ background: "linear-gradient(90deg,#8a5f15,#D4AE5E,#8a5f15)" }} />
          <div className="relative mx-auto h-[156px] w-[124px] overflow-hidden rounded-b-[10px]" style={{ border: "1px solid #b8862f", borderTop: "none" }}>
            <img src={e.image} alt="" loading="lazy" className={IMG} />
            <div aria-hidden className="ev-cloth-l absolute inset-y-0 left-0 w-1/2 origin-top" style={cloth("l")} />
            <div aria-hidden className="ev-cloth-r absolute inset-y-0 right-0 w-1/2 origin-top" style={cloth("r")} />
          </div>
        </div>
      </div>
      <Details e={e} p={ANTARPAT} />
    </Shell>
  );
}

/* ───────────────────────── Lagn Sohala: mandap arch, cinematic reveal ───────────────────────── */

const LAGN: Palette = { ink: "#4a1a16", accent: "#6d0f1b", label: "#8a5f15", body: "#4a1a16", dotRing: "#b8862f" };

function Lagn({ e }: VProps) {
  return (
    <Shell
      e={e}
      className="rounded-[20px] px-5 pb-7 pt-6"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #fff8e8 0%, #f9ead0 60%, #f3dfb8 100%)",
        border: `${u(1.5)} solid #b8862f`,
        boxShadow: `inset 0 0 0 ${u(4)} #fbf1df, inset 0 0 0 ${u(5)} #C9963A, 0 ${u(4)} ${u(14)} rgba(110,60,10,0.25)`,
      }}
    >
      {/* mandap: pillars, double arch and kalash finial around an arch-masked photo */}
      <div className="relative mx-auto h-[300px] w-[260px] max-w-full">
        <div className="absolute left-[30px] top-[40px] h-[245px] w-[200px] overflow-hidden rounded-b-[4px] rounded-t-[100px]">
          <img src={e.image} alt="" loading="lazy" className={`ev-arch ${IMG}`} />
        </div>
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 260 300" fill="none" strokeLinecap="round">
          <path className="ev-draw" style={t(0, 1500)} pathLength={1} d="M22 292 V140 A108 108 0 0 1 238 140 V292" stroke="#b8862f" strokeWidth="2" />
          <path className="ev-draw" style={t(200, 1500)} pathLength={1} d="M12 294 V140 A118 118 0 0 1 248 140 V294" stroke="#6d0f1b" strokeWidth="1.2" />
          {/* pillar capitals and base step */}
          <path className="ev-draw" style={t(900, 700)} pathLength={1} d="M6 150 H28 M232 150 H254 M4 296 H256" stroke="#b8862f" strokeWidth="1.6" />
          {/* kalash finial */}
          <g className="ev-bloom" style={t(1250, 700)}>
            <path d="M122 20 Q122 28 130 29 Q138 28 138 20 Q138 16 134 15 H126 Q122 16 122 20Z" fill="#C9963A" />
            <ellipse cx="130" cy="10" rx="4" ry="5" fill="#8a5a2b" />
            <path d="M130 13 C126 9 122 9 119 10 M130 13 C134 9 138 9 141 10" stroke="#5E8C4A" strokeWidth="2" />
          </g>
        </svg>
      </div>

      <div className="mt-3">
        <Names e={e} p={LAGN} center big />
        <Tagline e={e} p={LAGN} center />
      </div>

      {/* Muhurat: the key facts, largest on the page */}
      <div className="mx-auto mt-4 max-w-[260px] text-center">
        <div aria-hidden className="mx-auto h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #b8862f, transparent)" }} />
        <p className="mt-3 font-body text-[12px] font-bold uppercase tracking-[0.32em]" style={{ color: LAGN.label }}>
          Shubh Muhurat
        </p>
        <p className="mt-1 font-serif text-[40px] font-bold leading-none" style={{ color: LAGN.accent }}>
          <time dateTime={e.start}>{fmtTime(e.start)}</time>
        </p>
        <p className="mt-1.5 font-body text-[14px] font-bold leading-snug" style={{ color: LAGN.ink }}>
          {fmtDay(e.start, true)}
        </p>
        <div aria-hidden className="mx-auto mt-3 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #b8862f, transparent)" }} />
      </div>

      <Details e={e} p={LAGN} center />
    </Shell>
  );
}

/* ───────────────────────── Reception: maroon night, slow gold shimmer ───────────────────────── */

const RECEPTION: Palette = { ink: "#F3DDA2", accent: "#E2BE6E", label: "#D4AE5E", body: "#F6E8CC", dotRing: "#D4AE5E" };

function Star({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="-10 -10 20 20" className={`pointer-events-none absolute h-[14px] w-[14px] ${className}`} aria-hidden>
      <path className="ev-orn" style={style} d="M0 -9 C1 -2 2 -1 9 0 C2 1 1 2 0 9 C-1 2 -2 1 -9 0 C-2 -1 -1 -2 0 -9Z" fill="#D4AE5E" />
    </svg>
  );
}

function Reception({ e }: VProps) {
  return (
    <Shell
      e={e}
      className="rounded-[16px] px-5 pb-7 pt-7"
      style={{
        background: "radial-gradient(ellipse at 30% 0%, #8a1a28 0%, #6d0f1b 45%, #4e0a14 100%)",
        boxShadow: `0 ${u(4)} ${u(14)} rgba(60,5,10,0.35)`,
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-[8px] rounded-[10px]" style={{ border: "1px solid rgba(212,174,94,0.55)" }} />
      <Star className="left-[3px] top-[3px]" style={t(200)} />
      <Star className="right-[3px] top-[3px]" style={t(450)} />
      <Star className="bottom-[3px] left-[3px]" style={t(700)} />
      <Star className="bottom-[3px] right-[3px]" style={t(950)} />

      {/* gold ornament divider */}
      <svg aria-hidden className="mx-auto -mt-1 mb-3 block h-[16px] w-[150px]" viewBox="0 0 150 16" fill="none">
        <path className="ev-draw" style={t(100, 900)} pathLength={1} d="M4 8 H58 M92 8 H146" stroke="#C9963A" strokeWidth="1" />
        <path className="ev-orn" style={t(300)} d="M75 1 L82 8 L75 15 L68 8Z" fill="#D4AE5E" />
        <circle className="ev-orn" style={t(500)} cx="62" cy="8" r="2" fill="#D4AE5E" />
        <circle className="ev-orn" style={t(500)} cx="88" cy="8" r="2" fill="#D4AE5E" />
      </svg>

      <div className="flex items-center gap-4">
        <div className="relative h-[150px] w-[120px] shrink-0 overflow-hidden rounded-[10px]" style={{ border: `${u(1.5)} solid #C9963A`, boxShadow: `0 0 0 ${u(3)} rgba(201,150,58,0.2)` }}>
          <img src={e.image} alt="" loading="lazy" className={IMG} />
          <div
            aria-hidden
            className="ev-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,236,180,0.5), transparent)" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Names e={e} p={RECEPTION} />
          <Tagline e={e} p={RECEPTION} />
          <When e={e} p={RECEPTION} />
        </div>
      </div>
      <Details e={e} p={RECEPTION} />
    </Shell>
  );
}

/* ───────────────────────── Fallback for events the couple adds ───────────────────────── */

const CLASSIC: Palette = { ink: "#4a1a16", accent: "#7a1420", label: "#8a5f15", body: "#4a1a16", dotRing: "#b8862f" };

function Classic({ e, index }: VProps) {
  const flip = index % 2 === 1;
  return (
    <Shell e={e} className="rounded-[14px] px-4 pb-6 pt-5" style={{ background: "#fbf1df" }}>
      <svg aria-hidden className="pointer-events-none absolute inset-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)]" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none">
        <rect className="ev-draw" style={t(0, 1100)} pathLength={1} x="0.5" y="0.5" width="99" height="99" rx="2" stroke="#b8862f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={`flex items-center gap-4 ${flip ? "flex-row-reverse" : ""}`}>
        <div className="h-[120px] w-[110px] shrink-0 overflow-hidden rounded-[10px]" style={{ border: "1px solid #D4AE5E" }}>
          <img src={e.image} alt="" loading="lazy" className={IMG} />
        </div>
        <div className="min-w-0 flex-1">
          <Names e={e} p={CLASSIC} />
          <Tagline e={e} p={CLASSIC} />
          <When e={e} p={CLASSIC} />
        </div>
      </div>
      <Details e={e} p={CLASSIC} />
    </Shell>
  );
}

const THEMES: Record<string, ComponentType<VProps>> = {
  haldi: Haldi,
  mehendi: Mehendi,
  mehndi: Mehendi,
  kalash: Kalash,
  simant: Kalash,
  seemant: Kalash,
  antarpat: Antarpat,
  lagn: Lagn,
  reception: Reception,
};

/** theme by id first, then by art, else the classic gold-frame vignette */
export function EventVignette({ e, index }: VProps) {
  const V = THEMES[e.id] ?? THEMES[e.art] ?? Classic;
  return <V e={e} index={index} />;
}
