import type { ReactNode } from "react";
import { useInView } from "./Reveal";
import { ChandrakorRule, PaithaniBand, PALETTE, Rangoli } from "./Marathi";

/**
 * One "chapter" of the invitation. Every section after the couple screen is wrapped in this:
 *  - a Paithani border band (purple with gold zari peacocks and parrots) joins it to the section above,
 *  - a large Marathi heading in Rozha One with the English name smaller beneath it,
 *  - a chandrakor divider and a small Sanskar Bharati rangoli under the heading.
 * Most chapters sit on ivory paper; "green" (parrot green) and "purple" (Paithani purple) chapters get their
 * own coloured ground with a faint gold butta pattern, and switch to light text.
 */
export type Tone = "ivory" | "green" | "purple" | "parchment" | "blush" | "saffron" | "sage";

const DEV = "०१२३४५६७८९";
const mr = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => DEV[+d]);

export default function Chapter({
  n,
  name,
  marathi,
  tone = "ivory",
  children,
}: {
  n: number;
  name: string;
  marathi: string;
  tone?: Tone;
  children: ReactNode;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const dark = tone === "green" || tone === "purple";
  const title = dark ? "#FAF1DC" : PALETTE.kumkum;
  const sub = dark ? "#F3D98B" : "#5a2a1e";
  return (
    <div ref={ref} className={`chapter chapter-${tone} relative`}>
      {/* the coloured ground of a green / purple chapter (ivory chapters just show the paper) */}
      {dark && <div aria-hidden className="chapter-ground pointer-events-none absolute inset-0" />}
      <PaithaniBand />
      <div className="chapter-mark relative px-4 pt-12 text-center" style={{ opacity: seen ? 1 : 0, transition: "opacity 900ms ease" }}>
        <p className="flex items-center justify-center gap-2 leading-none">
          <span lang="mr" className="font-marathi text-[13px] tracking-[0.08em]" style={{ color: sub }}>
            अध्याय {mr(n)}
          </span>
        </p>
        <h2 lang="mr" className="chapter-title mt-2" style={{ color: title }}>
          {marathi}
        </h2>
        <p className="mt-1 text-[19px] italic leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600, color: sub }}>
          {name}
        </p>
        <div className="mt-3">
          <ChandrakorRule color={dark ? PALETTE.haldi : PALETTE.kumkum} line={dark ? "rgba(243,217,139,0.7)" : "rgba(200,150,30,0.6)"} />
        </div>
        <div className="mt-3">
          <Rangoli size={52} dark={dark} />
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
