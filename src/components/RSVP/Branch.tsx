import { useId } from "react";

/**
 * A watercolour branch drawn across the RSVP scene (viewBox 350 x 170).
 * The top of the main branch is almost level at y ≈ 110–113 so the parrots can walk along it.
 */
export const BRANCH_VB = { w: 350, h: 170 } as const;
/** y of the branch top where the parrots stand */
export const BRANCH_PERCH_Y = 112;

// [x, y, rotation°, scale, tone] — leaves point along +x before rotation
const LEAVES: [number, number, number, number, 0 | 1][] = [
  [6, 112, -160, 1, 0],
  [18, 110, -122, 0.9, 1],
  [22, 119, 152, 0.85, 0],
  [36, 86, -146, 1, 1],
  [44, 92, -84, 0.8, 0],
  [53, 95, -168, 0.9, 1],
  [58, 121, 112, 0.8, 1],
  [94, 112, -58, 0.7, 0],
  [129, 120, 100, 0.78, 0],
  [141, 122, 58, 0.7, 1],
  [116, 140, 128, 0.85, 1],
  [122, 141, 46, 0.8, 0],
  [213, 117, 80, 0.75, 1],
  [239, 139, 58, 0.9, 0],
  [243, 135, 142, 0.75, 1],
  [262, 104, -62, 0.8, 0],
  [286, 83, -38, 1, 1],
  [277, 89, -104, 0.85, 0],
  [298, 96, -20, 0.9, 1],
  [322, 107, -72, 0.9, 0],
  [338, 109, 18, 1, 1],
  [330, 118, 62, 0.85, 0],
];
// [x, y, radius]
const FLOWERS: [number, number, number][] = [
  [47, 82, 6],
  [291, 77, 6.5],
  [118, 146, 5],
  [337, 101, 5],
  [15, 103, 4.5],
  [244, 144, 4.5],
];

export default function Branch({ drawn }: { drawn: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `rsvb${uid}${n}`;
  const url = (n: string) => `url(#${id(n)})`;

  return (
    <svg
      viewBox={`0 0 ${BRANCH_VB.w} ${BRANCH_VB.h}`}
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
      style={{
        clipPath: drawn ? "inset(-20% -5% -20% -5%)" : "inset(-20% 105% -20% -5%)",
        transition: "clip-path 1100ms cubic-bezier(0.45, 0.05, 0.25, 1)",
      }}
    >
      <defs>
        <linearGradient id={id("bark")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset=".5" stopColor="#6b4226" />
          <stop offset="1" stopColor="#4a2c18" />
        </linearGradient>
        <linearGradient id={id("l0")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f8f3a" />
          <stop offset="1" stopColor="#8cbf58" />
        </linearGradient>
        <linearGradient id={id("l1")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4d7f2c" />
          <stop offset="1" stopColor="#a9c86a" />
        </linearGradient>
        <radialGradient id={id("petal")} cx=".5" cy=".9" r=".9">
          <stop offset="0" stopColor="#f2b8c0" />
          <stop offset=".6" stopColor="#fbe3e2" />
          <stop offset="1" stopColor="#fff6ef" />
        </radialGradient>
        <filter id={id("wc")} x="-5%" y="-20%" width="110%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="gr" />
          <feColorMatrix in="gr" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.08  -0.9 0 0 0 0.5" result="ga" />
          <feComposite in="ga" in2="d" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="d" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
        <filter id={id("soft")} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* faint wash of shadow under the branch */}
      <path d="M10 124C80 120 140 128 175 126C230 124 290 120 340 124" stroke="#6b4226" strokeOpacity=".12" strokeWidth="8" fill="none" filter={url("soft")} />

      <g filter={url("wc")}>
        {/* twigs */}
        <g stroke={url("bark")} fill="none" strokeLinecap="round">
          <path d="M70 111C61 102 50 94 37 86" strokeWidth="3" />
          <path d="M252 109C262 100 272 92 287 82" strokeWidth="3" />
          <path d="M133 118C128 126 123 133 117 141" strokeWidth="2.4" />
          <path d="M213 116C221 124 230 131 241 139" strokeWidth="2.4" />
          <path d="M24 113C20 109 17 105 15 101" strokeWidth="1.8" />
          <path d="M320 110C327 106 332 103 337 100" strokeWidth="1.8" />
        </g>
        {/* main branch: nearly level along the middle so the parrots can walk */}
        <path
          d="M-8 112C60 109 120 113 175 112C230 111 290 108 358 111L358 117C290 115 230 119 175 120C120 121 60 118 -8 121Z"
          fill={url("bark")}
        />
        {/* bark highlight and knots */}
        <path d="M-4 112.6C60 110 120 114 175 113C230 112 290 109 354 112" stroke="#b98a5e" strokeOpacity=".55" strokeWidth=".9" fill="none" />
        <path d="M40 116q4 -2 8 0M104 117q5 -2 9 1M196 116q4 -2 8 0M262 114q5 -2 9 1M318 113q3 -1.5 6 0" stroke="#3a2212" strokeOpacity=".5" strokeWidth=".7" fill="none" />

        {/* leaves */}
        {LEAVES.map(([x, y, r, s, t], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
            <path d="M0 0C6 -6.5 17 -7 25 0C17 6.5 6 6.5 0 0Z" fill={url(t ? "l1" : "l0")} opacity=".93" />
            <path d="M1 0C8 -.6 16 -.4 23.5 0" stroke="#2e5a1f" strokeOpacity=".4" strokeWidth=".6" fill="none" />
          </g>
        ))}

        {/* small five-petal blossoms */}
        {FLOWERS.map(([x, y, rad], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 23})`}>
            {Array.from({ length: 5 }, (_, k) => (
              <ellipse key={k} cx="0" cy={-rad * 0.62} rx={rad * 0.48} ry={rad * 0.62} transform={`rotate(${k * 72})`} fill={url("petal")} stroke="#e7a7b1" strokeOpacity=".5" strokeWidth=".4" />
            ))}
            <circle r={rad * 0.26} fill="#e0a43a" />
            <circle r={rad * 0.1} cx={rad * 0.06} cy={-rad * 0.06} fill="#fff3c4" />
          </g>
        ))}
      </g>
    </svg>
  );
}
