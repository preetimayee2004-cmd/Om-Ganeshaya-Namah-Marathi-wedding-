import type { CSSProperties } from "react";

/**
 * The site's hint hand: a classic pointing hand (index finger up, the other fingers folded, thumb out),
 * ivory with a maroon outline and a soft gold glow. The fingertip sits at TIP (fractions of the box),
 * so callers can place the very tip of the finger on the thing it points at.
 */
export const TIP = { x: 0.35, y: 0.06 };

export default function PointerHand({ size = 30, style, className = "" }: { size?: number; style?: CSSProperties; className?: string }) {
  const u = (n: number) => `calc(var(--u) * ${n})`;
  return (
    <svg
      viewBox="0 0 24 27"
      className={`pointer-events-none block ${className}`}
      style={{
        width: u(size),
        height: u(size * 1.125),
        overflow: "visible",
        filter: `drop-shadow(0 ${u(2)} ${u(3)} rgba(60,20,10,0.45)) drop-shadow(0 0 ${u(5)} rgba(255,235,160,0.85))`,
        ...style,
      }}
      aria-hidden
    >
      <path
        d="M6.6 15.4V3.6a1.8 1.8 0 0 1 3.6 0v8.1a1.7 1.7 0 0 1 3.4 0v.7a1.7 1.7 0 0 1 3.4 0v.8a1.5 1.5 0 0 1 3 0V18c0 4-2.6 7-6.4 7h-1.5c-2.1 0-3.6-.9-4.8-2.3L3 17.9a1.6 1.6 0 0 1 2.3-2.2l1.3 1.3Z"
        fill="#FFFDF7"
        stroke="#6d0f1b"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M10.2 11.7v3.6M13.6 12.4v3.2M17 13.2v2.6" fill="none" stroke="#6d0f1b" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
