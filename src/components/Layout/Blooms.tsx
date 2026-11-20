import type { CSSProperties, ReactNode } from "react";
import { Bougainvillea } from "../Family/Family";
import { Samai, Toran, TulsiVrindavan } from "./Marathi";

/**
 * Marathi corner decorations for any section: wrap the section and name the corners.
 *  - a marigold + mango-leaf toran hangs across the top of the section
 *  - top corners (tl / tr): a marigold corner garland with hanging zendu strings
 *  - bottom-left: a tulsi vrindavan, bottom-right: a brass samai lamp
 * Everything is pointer-events: none and sits at the very edges so it never covers text.
 */
export type Corner = "tl" | "tr" | "bl" | "br";

const u = (n: number) => `calc(var(--u) * ${n})`;

const place: Record<Corner, CSSProperties> = {
  tl: { left: u(-4), top: u(28) },
  tr: { right: u(-4), top: u(28) },
  bl: { left: u(4), bottom: u(-10) },
  br: { right: u(6), bottom: u(-10) },
};

export default function Blooms({ corners, size = 96, toran = true, children }: { corners: Corner[]; size?: number; toran?: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      {toran && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[6]" style={{ top: u(30) }}>
          <Toran />
        </div>
      )}
      {children}
      {corners.map((c) => (
        <div key={c} aria-hidden className="pointer-events-none absolute z-[6]" style={place[c]}>
          {c === "tl" && <Bougainvillea style={{ position: "relative", width: u(size), height: u(size) }} />}
          {c === "tr" && <Bougainvillea flip style={{ position: "relative", width: u(size), height: u(size) }} />}
          {c === "bl" && <TulsiVrindavan size={50} />}
          {c === "br" && <Samai size={58} />}
        </div>
      ))}
    </div>
  );
}
