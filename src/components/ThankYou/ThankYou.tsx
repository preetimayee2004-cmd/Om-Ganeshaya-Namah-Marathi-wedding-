import type { CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { useInView } from "../Layout/Reveal";

const MAROON = "#7a1420";
const GOLD = "#b8862f";
const SERIF = '"Cormorant Garamond", Georgia, serif';

/** small gold lotus between two hairlines */
function LotusDivider({ w = 150, style }: { w?: number; style?: CSSProperties }) {
  return (
    <div className="mx-auto flex items-center justify-center gap-2" style={{ width: `calc(var(--u) * ${w * 2})`, maxWidth: "100%", ...style }} aria-hidden>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <svg viewBox="0 0 32 18" className="h-[14px] w-[26px]" fill={GOLD}>
        <path d="M16 1c3 3 4 8 0 13-4-5-3-10 0-13Z" />
        <path d="M16 14c-2-5-6-8-11-8 1 5 5 8 11 8Zm0 0c2-5 6-8 11-8-1 5-5 8-11 8Z" opacity=".85" />
        <path d="M16 15c-5 0-10-1-14-4 3 4 8 6 14 6s11-2 14-6c-4 3-9 4-14 4Z" opacity=".7" />
      </svg>
      <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
    </div>
  );
}

/** brass temple bell on a chain, swinging gently */
function Bell({ chain, className, delay = 0 }: { chain: number; className: string; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute top-0 flex flex-col items-center ${className}`} style={{ transformOrigin: "50% 0", animation: `ty-swing 3.6s ${delay}s ease-in-out infinite alternate` }} aria-hidden>
      <span className="w-px" style={{ height: `calc(var(--u) * ${chain})`, background: "repeating-linear-gradient(180deg, #8a6420 0 3px, #d6aa4f 3px 6px)" }} />
      <svg viewBox="0 0 30 34" className="h-[30px] w-[26px]">
        <defs>
          <linearGradient id="ty-brass" x1="0" x2="1">
            <stop offset="0" stopColor="#7a5418" />
            <stop offset=".45" stopColor="#e9c46a" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
        </defs>
        <circle cx="15" cy="3" r="2.5" fill="none" stroke="#8a6420" strokeWidth="1.4" />
        <path d="M15 5c-6 0-9 5-9 11 0 5-2 8-4 10h26c-2-2-4-5-4-10 0-6-3-11-9-11Z" fill="url(#ty-brass)" />
        <rect x="2" y="25" width="26" height="3" rx="1.5" fill="#8a6420" />
        <circle cx="15" cy="30.5" r="2.6" fill="#7a5418" />
      </svg>
    </div>
  );
}

/** cluster of small pink and white five-petal flowers with leaves, for the top corners */
function FlowerVine({ flip }: { flip?: boolean }) {
  const flowers = [
    [18, 14, 7, "#c94a5c"], [40, 8, 6, "#f4ead8"], [10, 36, 6, "#f4ead8"], [32, 30, 7, "#d9687a"],
    [58, 20, 5, "#c94a5c"], [14, 60, 6, "#d9687a"], [30, 52, 5, "#f4ead8"], [8, 84, 5, "#c94a5c"],
    [24, 76, 5, "#f4ead8"], [76, 10, 5, "#f4ead8"], [10, 106, 5, "#d9687a"],
  ] as const;
  return (
    <svg viewBox="0 0 90 120" className={`pointer-events-none absolute top-0 h-[150px] w-[112px] ${flip ? "right-0 -scale-x-100" : "left-0"}`} aria-hidden>
      <path d="M2 2C30 6 60 4 88 2M4 4C8 40 4 80 6 118" stroke="#6f7f3f" strokeWidth="1.4" fill="none" />
      {[[22, 22, 30], [48, 14, -20], [20, 44, 60], [44, 36, 10], [6, 70, 80], [22, 92, 50], [66, 8, -40]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="7" ry="3.2" fill="#7f9150" opacity=".85" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {flowers.map(([x, y, s, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy={-s * 0.55} rx={s * 0.42} ry={s * 0.6} fill={c} stroke="#b0485a" strokeWidth=".3" transform={`rotate(${a})`} />
          ))}
          <circle r={s * 0.22} fill="#e7b64b" />
        </g>
      ))}
    </svg>
  );
}

/** pink lotus plant for the bottom corners */
function LotusPlant({ flip }: { flip?: boolean }) {
  const petal = (a: number, len: number, w: number, fill: string) => (
    <path key={`${a}-${len}`} d={`M0 0C${-w} ${-len * 0.4} ${-w * 0.5} ${-len * 0.9} 0 ${-len}C${w * 0.5} ${-len * 0.9} ${w} ${-len * 0.4} 0 0Z`} fill={fill} stroke="#c06a7a" strokeWidth=".5" transform={`rotate(${a})`} />
  );
  const flower = (x: number, y: number, s: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {petal(-55, 16, 7, "#f2b3bd")}{petal(55, 16, 7, "#f2b3bd")}{petal(-28, 20, 8, "#f6c4cc")}{petal(28, 20, 8, "#f6c4cc")}{petal(0, 22, 8, "#f9d3d9")}
    </g>
  );
  return (
    <svg viewBox="0 0 110 100" className={`pointer-events-none absolute bottom-[18px] h-[110px] w-[121px] ${flip ? "right-0 -scale-x-100" : "left-0"}`} aria-hidden>
      <path d="M28 100C30 80 34 60 40 44M58 100C56 84 60 70 68 60M14 100C12 90 10 80 6 70" stroke="#6f7f3f" strokeWidth="1.6" fill="none" />
      <ellipse cx="20" cy="88" rx="18" ry="7" fill="#7f9150" />
      <ellipse cx="74" cy="92" rx="16" ry="6" fill="#6f8445" />
      <path d="M6 70c-4-6-2-12 2-14" stroke="#6f7f3f" strokeWidth="1.2" fill="none" />
      <circle cx="9" cy="55" r="3" fill="none" stroke="#6f7f3f" strokeWidth="1" />
      {flower(40, 46, 1.25)}
      {flower(68, 62, 0.95)}
      <path d="M86 100c0-14 2-24 6-30" stroke="#6f7f3f" strokeWidth="1.2" fill="none" />
      <path d="M92 70c-4-6-2-12 2-16 3 4 3 10-2 16Z" fill="#f2b3bd" stroke="#c06a7a" strokeWidth=".5" />
    </svg>
  );
}

/** the couple inside a gold Mughal arch, fading into the paper at the bottom */
function ArchPortrait() {
  const arch = "M14 268V112C14 80 34 64 62 58C92 52 122 40 150 8C178 40 208 52 238 58C266 64 286 80 286 112V268Z";
  return (
    <svg viewBox="0 0 300 270" className="mx-auto block w-[92%]" role="img" aria-label="Illustration of the bride and groom">
      <defs>
        <clipPath id="ty-arch">
          <path d={arch} />
        </clipPath>
        <linearGradient id="ty-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".72" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="ty-mask">
          <rect width="300" height="270" fill="url(#ty-fade)" />
        </mask>
      </defs>
      <g mask="url(#ty-mask)">
        <image href={wedding.images.thankYouCouple} x="14" y="8" width="272" height="262" preserveAspectRatio="xMidYMid slice" clipPath="url(#ty-arch)" />
      </g>
      <path d={arch} fill="none" stroke={GOLD} strokeWidth="1.6" mask="url(#ty-mask)" />
      <path d="M6 268V108C6 72 30 54 60 49C90 43 120 30 150 -2C180 30 210 43 240 49C270 54 294 72 294 108V268" fill="none" stroke={GOLD} strokeWidth=".8" opacity=".7" mask="url(#ty-mask)" />
    </svg>
  );
}

/** soft left-to-right reveal, as if the heading is being written by hand */
const handwrite = (show: boolean, delay: number): CSSProperties => {
  const mask = "linear-gradient(90deg, #000 42%, transparent 58%)";
  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: "260% 100%",
    maskSize: "260% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: show ? "0% 0" : "100% 0",
    maskPosition: show ? "0% 0" : "100% 0",
    transition: `-webkit-mask-position 1500ms cubic-bezier(.45,0,.25,1) ${delay}ms, mask-position 1500ms cubic-bezier(.45,0,.25,1) ${delay}ms`,
  };
};

export default function ThankYou() {
  const [ref, seen] = useInView<HTMLElement>(0.1);
  const { guestName, isPersonalised } = useGuest();
  const [first, second] = coupleOrder;
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: wedding.timeZone })
    .format(new Date(wedding.date))
    .toUpperCase();
  const fade = (delay: number): CSSProperties => ({
    opacity: seen ? 1 : 0,
    transform: seen ? "none" : "translateY(calc(var(--u) * 10))",
    transition: `opacity 700ms ease ${delay}ms, transform 700ms ease ${delay}ms`,
  });

  return (
    <section ref={ref} id="thank-you" aria-labelledby="thanks-title" className="pt-4">
      {/* paper, margin and gold frame come from the shared .framed-page card around all sections */}
      <div className="relative mx-auto max-w-[400px] overflow-hidden px-6 pb-[36px] pt-5 text-center">

        <Bell chain={46} className="left-[54px]" />
        <Bell chain={120} className="left-[30px]" delay={0.8} />
        <Bell chain={46} className="right-[54px]" delay={0.4} />
        <Bell chain={120} className="right-[30px]" delay={1.2} />
        {/* drifting petals */}
        {[
          [14, 26, 0], [88, 30, 1.4], [8, 62, 2.2], [92, 66, 0.6], [12, 80, 3], [90, 84, 1.8],
        ].map(([l, t, d], i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-[9px] w-[6px] rounded-[80%_20%_80%_20%]"
            style={{ left: `${l}%`, top: `${t}%`, background: "linear-gradient(135deg, #e98591, #c94a5c)", opacity: 0.75, animation: `mm-float 5s ${d}s ease-in-out infinite` }}
            aria-hidden
          />
        ))}

        <p lang="mr" className="relative font-marathi text-[13px] font-semibold" style={{ color: MAROON, ...fade(0) }}>
          ॥ श्री गणेशाय नमः ॥
        </p>
        <LotusDivider w={45} style={{ marginTop: "calc(var(--u) * 4)" }} />

        <div className="relative mt-3" style={fade(150)}>
          <ArchPortrait />
        </div>

        <h2 id="thanks-title" className="section-title relative mt-1 !text-[26px] leading-tight" style={{ color: MAROON, ...handwrite(seen, 500) }}>
          A Celebration of Love
        </h2>
        <LotusDivider w={80} style={{ marginTop: "calc(var(--u) * 6)" }} />
        <p lang="mr" className="relative mt-1 font-marathi text-[24px] font-bold leading-tight" style={{ color: MAROON, ...fade(500) }}>
          <span className="mr-2 font-normal opacity-80">॥</span>धन्यवाद<span className="ml-2 font-normal opacity-80">॥</span>
        </p>
        <LotusDivider w={65} />

        <div className="relative mx-auto mt-4 max-w-[318px] text-[18px] font-medium leading-[1.55]" style={{ fontFamily: SERIF, color: "#4a1a16", ...fade(650) }}>
          <p className="mb-1 text-[20px] italic">
            Dear <span className="guest-name not-italic">{guestName}</span>,
          </p>
          <p>{wedding.thankYouMessage}</p>
        </div>

        <LotusDivider w={65} style={{ marginTop: "calc(var(--u) * 18)" }} />

      </div>
    </section>
  );
}
