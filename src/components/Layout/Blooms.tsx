import type { CSSProperties, ReactNode } from "react";
import { Bougainvillea } from "../Family/Family";

/**
 * The gallery's bougainvillea, on the corners of any section: wrap the section and name the corners.
 * The sprays hang a little past the section's edge so neighbouring sections feel joined.
 */
export type Corner = "tl" | "tr" | "bl" | "br";

const u = (n: number) => `calc(var(--u) * ${n})`;

const place: Record<Corner, CSSProperties> = {
  tl: { left: u(-6), top: u(-20) },
  tr: { right: u(-6), top: u(-20), transform: "scaleX(-1)" },
  bl: { left: u(-6), bottom: u(-48), transform: "scaleY(-1)" },
  br: { right: u(-6), bottom: u(-48), transform: "rotate(180deg)" },
};

export default function Blooms({ corners, size = 116, children }: { corners: Corner[]; size?: number; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {corners.map((c) => (
        <div key={c} aria-hidden className="pointer-events-none absolute z-[6]" style={{ width: u(size), height: u(size), ...place[c] }}>
          <Bougainvillea style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}
