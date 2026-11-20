import type { CSSProperties } from "react";

/**
 * Marathi wedding motifs, drawn as small inline SVGs so they stay crisp at any size:
 *  - PaithaniBand: deep-purple border band with gold zari mor (peacock) and popat (parrot) and a temple-triangle edge
 *  - Toran: marigold + mango-leaf garland across the top of a section
 *  - MarigoldString: a hanging string (ladi) of marigolds for the corners
 *  - Rangoli: small Sanskar Bharati rangoli (concentric dotted floral rings)
 *  - Chandrakor: the crescent bindi, used as the small divider icon
 *  - TulsiVrindavan and Samai: recurring corner illustrations
 *  - Mundavalya: the pearl strings that hang beside the couple's names
 */

export const PALETTE = {
  ivory: "#FAF1DC",
  purple: "#5B1A6E",
  green: "#1F7A3F",
  haldi: "#F2B01E",
  kumkum: "#7A1F2B",
  gold: "#C8961E",
};

const u = (n: number) => `calc(var(--u) * ${n})`;

/** Paithani border band: purple ground, gold temple-triangle edges, a row of zari peacocks and parrots */
export function PaithaniBand({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      aria-hidden
      className={`block w-full ${className}`}
      style={{ height: u(30), ...style }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 30"
    >
      <defs>
        {/* one 40 x 30 repeat: triangles above and below, a peacock and a parrot facing each other */}
        <pattern id="paithani-repeat" width="40" height="30" patternUnits="userSpaceOnUse">
          <rect width="40" height="30" fill={PALETTE.purple} />
          <path d="M0 0h40v2.2H0z" fill={PALETTE.gold} />
          <path d="M0 2.2l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5z" fill={PALETTE.gold} />
          <path d="M0 27.8h40V30H0z" fill={PALETTE.gold} />
          <path d="M0 27.8l5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5z" fill={PALETTE.gold} />
          {/* mor: small body, crest and a fanned tail */}
          <g fill={PALETTE.gold} transform="translate(10 15)">
            <path d="M-6 3c-1-4 1-7 4-7s4 2 4 4c0 3-3 5-8 3Z" opacity=".95" />
            <circle cx="1.6" cy="-6" r="1.4" />
            <path d="M1.6-7.4l.6-2M1.6-7.4l-.8-1.8" stroke={PALETTE.gold} strokeWidth=".6" />
            <path d="M-6 3c-3 0-5-2-5-4 2 1 3 1 5 1Z" opacity=".8" />
            <path d="M-3 5l-.5 2M0 5l.5 2" stroke={PALETTE.gold} strokeWidth=".6" />
          </g>
          {/* popat: rounded body, hooked beak, long tail */}
          <g fill={PALETTE.gold} transform="translate(29 15)">
            <path d="M-3-4c3-2 6 0 6 3s-3 5-6 4c-2-1-3-5 0-7Z" />
            <path d="M3-2.6l2 .4-1.6 1.4Z" />
            <path d="M-3 3l-5 4 1-4Z" opacity=".85" />
            <circle cx="1.2" cy="-2.4" r=".55" fill={PALETTE.purple} />
          </g>
          <circle cx="20" cy="15" r="1" fill={PALETTE.gold} />
          <circle cx="0" cy="15" r="1" fill={PALETTE.gold} />
        </pattern>
      </defs>
      <rect width="400" height="30" fill="url(#paithani-repeat)" />
    </svg>
  );
}

/** marigold (zendu) flower: layered round petals */
function Marigold({ x, y, r, c = PALETTE.haldi }: { x: number; y: number; r: number; c?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x} cy={y} r={r * 0.68} fill={c === PALETTE.haldi ? "#E58A12" : "#C9620C"} />
      <circle cx={x} cy={y} r={r * 0.32} fill="#B4500A" />
    </g>
  );
}

/** mango leaf */
function Leaf({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M0 0c3 4 3 11 0 15-3-4-3-11 0-15Z" fill={PALETTE.green} />
      <path d="M0 1v13" stroke="#8fc29a" strokeWidth=".5" />
    </g>
  );
}

/** marigold and mango-leaf toran across the top of a section (repeats along any width) */
export function Toran({ style }: { style?: CSSProperties }) {
  return (
    <svg aria-hidden className="block w-full" style={{ height: u(34), ...style }} viewBox="0 0 400 34" preserveAspectRatio="xMidYMin slice">
      <defs>
        <pattern id="toran-repeat" width="50" height="34" patternUnits="userSpaceOnUse">
          {/* the rope */}
          <path d="M0 4h50" stroke="#9c6f24" strokeWidth="1" />
          {/* scallop of marigolds */}
          {[0, 6.25, 12.5, 18.75, 25, 31.25, 37.5, 43.75, 50].map((x, i) => {
            const t = x / 50;
            const y = 5 + Math.sin(t * Math.PI) * 8;
            return <Marigold key={i} x={x} y={y} r={3.4} c={i % 2 ? "#F08A1C" : PALETTE.haldi} />;
          })}
          {/* mango leaves hanging between the scallops */}
          <Leaf x={12.5} y={14} rot={8} />
          <Leaf x={25} y={16} rot={0} />
          <Leaf x={37.5} y={14} rot={-8} />
        </pattern>
      </defs>
      <rect width="400" height="34" fill="url(#toran-repeat)" />
    </svg>
  );
}

/** a hanging string (ladi) of marigolds, for a section corner */
export function MarigoldString({ count = 7, style }: { count?: number; style?: CSSProperties }) {
  const h = 12 + count * 9 + 16;
  return (
    <svg aria-hidden viewBox={`0 0 20 ${h}`} style={{ width: u(20), height: u(h), ...style }}>
      <path d={`M10 0v${h - 14}`} stroke="#9c6f24" strokeWidth=".8" />
      {Array.from({ length: count }, (_, i) => (
        <Marigold key={i} x={10} y={10 + i * 9} r={4.4} c={i % 2 ? "#F08A1C" : PALETTE.haldi} />
      ))}
      <Leaf x={10} y={h - 16} rot={0} />
    </svg>
  );
}

/** chandrakor: the crescent bindi, the small divider icon */
export function Chandrakor({ size = 14, color = PALETTE.kumkum, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 20 12" style={{ width: u(size), height: u(size * 0.6), ...style }}>
      <path d="M2 2c3 6 13 6 16 0-3 9-13 9-16 0Z" fill={color} />
      <circle cx="10" cy="2.4" r="1.4" fill={color} />
    </svg>
  );
}

/** a hairline rule with the chandrakor in the middle */
export function ChandrakorRule({ color = PALETTE.kumkum, line = "rgba(200,150,30,0.6)", width = 150 }: { color?: string; line?: string; width?: number }) {
  return (
    <div aria-hidden className="mx-auto flex items-center gap-2" style={{ width: u(width) }}>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${line})` }} />
      <Chandrakor color={color} />
      <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${line})` }} />
    </div>
  );
}

/** small Sanskar Bharati rangoli: concentric dotted floral rings in white, haldi yellow and kumkum red */
export function Rangoli({ size = 58, dark = false }: { size?: number; dark?: boolean }) {
  const ring = (r: number, n: number, dot: number, fill: string, off = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + off;
      return <circle key={`${r}-${i}`} cx={30 + Math.cos(a) * r} cy={30 + Math.sin(a) * r} r={dot} fill={fill} />;
    });
  const petals = Array.from({ length: 8 }, (_, i) => (
    <path key={i} d="M30 30c-3-5-3-11 0-15 3 4 3 10 0 15Z" fill={PALETTE.kumkum} opacity=".9" transform={`rotate(${i * 45} 30 30)`} />
  ));
  const white = dark ? "#FAF1DC" : "#ffffff";
  return (
    <svg aria-hidden viewBox="0 0 60 60" style={{ width: u(size), height: u(size), display: "block", margin: "0 auto" }}>
      {/* a soft disc so the white dots read on light paper too */}
      <circle cx="30" cy="30" r="29" fill={dark ? "rgba(0,0,0,0.12)" : "rgba(122,31,43,0.08)"} />
      {ring(27, 28, 1.3, white)}
      {ring(23, 20, 1.6, PALETTE.haldi, 0.1)}
      {petals}
      {ring(12, 12, 1.4, white, 0.26)}
      <circle cx="30" cy="30" r="5" fill={PALETTE.haldi} />
      <circle cx="30" cy="30" r="2.2" fill={PALETTE.kumkum} />
      {ring(8.5, 8, 0.9, white)}
    </svg>
  );
}

/** tulsi vrindavan: the square planter with the holy basil */
export function TulsiVrindavan({ size = 56, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 60 70" style={{ width: u(size), height: u(size * 70 / 60), ...style }}>
      {/* basil */}
      {[[-14, 0], [-6, -4], [0, -6], [6, -4], [14, 0]].map(([dx, dy], i) => (
        <g key={i}>
          <path d={`M30 30C${30 + dx * 0.4} 22 ${30 + dx} ${16 + dy} ${30 + dx} ${10 + dy}`} stroke="#3c6b2b" strokeWidth="1" fill="none" />
          <ellipse cx={30 + dx} cy={9 + dy} rx="3" ry="2" fill={PALETTE.green} />
          <ellipse cx={30 + dx * 0.7} cy={16 + dy} rx="2.6" ry="1.8" fill="#2f8f4e" />
        </g>
      ))}
      {/* vrindavan: stepped base, body with a niche, crown */}
      <path d="M14 30h32l-2 4H16Z" fill="#c9875a" />
      <path d="M17 34h26v24H17Z" fill="#e3a676" />
      <path d="M26 40c0-3 8-3 8 0v10h-8Z" fill="#7A1F2B" />
      <circle cx="30" cy="45" r="1.4" fill={PALETTE.haldi} />
      <path d="M12 58h36v4H12ZM9 62h42v4H9Z" fill="#c9875a" />
      <path d="M17 38h26M17 54h26" stroke="#b56d3d" strokeWidth=".8" />
    </svg>
  );
}

/** brass samai (tall Maharashtrian oil lamp) with three flames */
export function Samai({ size = 56, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 50 80" style={{ width: u(size * 50 / 80), height: u(size), ...style }}>
      <defs>
        <linearGradient id="samai-brass" x1="0" x2="1">
          <stop offset="0" stopColor="#9c6f24" />
          <stop offset=".5" stopColor="#f0cf7a" />
          <stop offset="1" stopColor="#a8782a" />
        </linearGradient>
      </defs>
      {/* flames */}
      {[13, 25, 37].map((x) => (
        <g key={x}>
          <path d={`M${x} 12c3 3 3 7 0 9-3-2-3-6 0-9Z`} fill="#F2B01E" />
          <path d={`M${x} 15c1.4 1.4 1.4 3.5 0 4.6-1.4-1.1-1.4-3.2 0-4.6Z`} fill="#fff3c4" />
        </g>
      ))}
      {/* top dish with a little peacock finial */}
      <path d="M6 21h38c-2 5-8 7-19 7S8 26 6 21Z" fill="url(#samai-brass)" />
      <path d="M25 4c2 0 3 2 2 4l-2 2-2-2c-1-2 0-4 2-4Z" fill="url(#samai-brass)" />
      {/* stem with knops */}
      <path d="M23 28h4v36h-4Z" fill="url(#samai-brass)" />
      {[34, 44, 54].map((y) => (
        <ellipse key={y} cx="25" cy={y} rx="5" ry="2.2" fill="url(#samai-brass)" />
      ))}
      {/* base */}
      <path d="M12 76c2-8 7-12 13-12s11 4 13 12Z" fill="url(#samai-brass)" />
      <path d="M8 76h34v3H8Z" fill="#9c6f24" />
    </svg>
  );
}

/** mundavalya: two strings of pearls (with a small gold bead) hanging beside the couple's names */
export function Mundavalya({ height = 120, flip = false, style }: { height?: number; flip?: boolean; style?: CSSProperties }) {
  const n = 13;
  return (
    <svg aria-hidden viewBox="0 0 22 120" style={{ width: u(height * 22 / 120), height: u(height), transform: flip ? "scaleX(-1)" : undefined, ...style }}>
      {[6, 15].map((x, s) => (
        <g key={x}>
          <path d={`M${x} 0C${x} 40 ${x + (s ? -2 : 2)} 80 ${x} ${104 - s * 8}`} stroke="#cbb88a" strokeWidth=".5" fill="none" />
          {Array.from({ length: n - s }, (_, i) => {
            const y = 6 + i * 7.6;
            return <circle key={i} cx={x + Math.sin(i * 0.5) * 0.6} cy={y} r={2.6} fill="#fffaf0" stroke="#a88a4e" strokeWidth=".7" />;
          })}
          <circle cx={x} cy={108 - s * 8} r="2.8" fill={PALETTE.gold} />
          <path d={`M${x} ${110 - s * 8}l-1.6 6h3.2Z`} fill="#c9a24a" />
        </g>
      ))}
    </svg>
  );
}
