import type { ReactNode } from "react";
import { useInView } from "./Reveal";

/**
 * One "chapter" of the illustrated wedding story. Every section after the couple screen is wrapped in this:
 *  - a soft watercolor wash behind it, taken from the couple section's parchment palette (each chapter has its
 *    own tint so they feel related but not identical),
 *  - a small chapter mark above it: a hand-drawn gold vine with a lotus, the Marathi chapter number and an
 *    italic chapter name. The vine draws itself in when the chapter scrolls into view.
 */
export type Tone = "parchment" | "blush" | "saffron" | "sage";

const DEV = "०१२३४५६७८९";
const mr = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => DEV[+d]);

function Vine({ seen }: { seen: boolean }) {
  return (
    <svg viewBox="0 0 220 26" className={`chapter-vine mx-auto block ${seen ? "is-seen" : ""}`} style={{ width: "calc(var(--u) * 200)", height: "calc(var(--u) * 24)" }} fill="none" aria-hidden>
      {/* two curling vines that meet at a lotus */}
      <path className="chapter-vine-line" pathLength={1} d="M100 13C84 13 76 6 62 8S38 18 24 14 8 10 2 13" stroke="#b8862f" strokeWidth="0.9" strokeLinecap="round" />
      <path className="chapter-vine-line" pathLength={1} d="M120 13c16 0 24-7 38-5s24 10 38 6 16-4 22-1" stroke="#b8862f" strokeWidth="0.9" strokeLinecap="round" />
      {/* leaves */}
      {[
        [70, 7, -30], [44, 15, 25], [22, 13, -20],
        [150, 7, 30], [176, 15, -25], [198, 13, 20],
      ].map(([x, y, r], i) => (
        <path key={i} className="chapter-vine-leaf" d={`M${x} ${y}c3-3 7-3 9 0-3 3-7 3-9 0Z`} fill="#8f9a5a" fillOpacity=".7" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {/* lotus */}
      <g className="chapter-vine-leaf">
        <path d="M110 3c2.6 3 2.6 7 0 10.5-2.6-3.5-2.6-7.5 0-10.5Z" fill="#7a1f2b" />
        <path d="M110 14c-3.6-.4-6.6-2.8-7.4-6.4 3.6 0 6.5 2.4 7.4 6.4Zm0 0c3.6-.4 6.6-2.8 7.4-6.4-3.6 0-6.5 2.4-7.4 6.4Z" fill="#b8862f" />
        <path d="M102 17.5c5 1.6 11 1.6 16 0" stroke="#b8862f" strokeWidth=".9" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Chapter({ n, name, tone = "parchment", children }: { n: number; name: string; tone?: Tone; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`chapter chapter-${tone} relative`}>
      {/* painted first and with no z-index, so it sits behind the chapter without creating a stacking context */}
      <div aria-hidden className="chapter-wash pointer-events-none absolute" />
      <div className="chapter-mark relative pt-6 text-center" style={{ opacity: seen ? 1 : 0, transition: "opacity 900ms ease" }}>
        <Vine seen={seen} />
        <p className="mt-1.5 flex items-center justify-center gap-2 leading-none">
          <span lang="mr" className="font-marathi text-[12px] tracking-[0.12em]" style={{ color: "#a8741a" }}>
            अध्याय {mr(n)}
          </span>
          <span aria-hidden className="inline-block h-1 w-1 rotate-45" style={{ background: "#b8862f" }} />
          <span className="text-[14px] italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600, color: "#7a1f2b" }}>
            {name}
          </span>
        </p>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
