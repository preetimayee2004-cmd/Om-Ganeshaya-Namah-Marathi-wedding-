import type { CSSProperties } from "react";

/**
 * Wedding headgear for the contact card's top corners (drawn, so it stays crisp at any size):
 *  - Pheta: the groom's maroon-and-gold Marathi turban with its fan (tura), a jewelled kalgi and
 *    pearl strands hanging at the sides.
 *  - Mundavalya: the strings of pearls tied across the forehead, with red beads on the bar and
 *    two long pearl strands ending in red drops.
 */

function Pearls({ x1, y1, x2, y2, n, r = 2.1 }: { x1: number; y1: number; x2: number; y2: number; n: number; r?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0 : i / (n - 1);
        return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={r} fill="url(#hg-pearl)" stroke="#b9ab96" strokeWidth=".35" />;
      })}
    </>
  );
}

/** pearls along a quadratic curve (for swags) */
function PearlSwag({ x1, y1, cx, cy, x2, y2, n, r = 1.9 }: { x1: number; y1: number; cx: number; cy: number; x2: number; y2: number; n: number; r?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
        return <circle key={i} cx={x} cy={y} r={r} fill="url(#hg-pearl)" stroke="#b9ab96" strokeWidth=".3" />;
      })}
    </>
  );
}

function Drop({ x, y, color = "#b3162a" }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.2} fill="#d9a441" />
      <path d={`M${x} ${y + 1.5}c-2.6 3-3 5.6 0 7.8 3-2.2 2.6-4.8 0-7.8Z`} fill={color} stroke="#7a0c18" strokeWidth=".4" />
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <radialGradient id="hg-pearl" cx=".35" cy=".35" r=".7">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".6" stopColor="#f3ece0" />
        <stop offset="1" stopColor="#cfc3ae" />
      </radialGradient>
      <linearGradient id="hg-maroon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9e1d33" />
        <stop offset="1" stopColor="#5c0a18" />
      </linearGradient>
      <linearGradient id="hg-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f1d27a" />
        <stop offset=".5" stopColor="#c99733" />
        <stop offset="1" stopColor="#8a5f15" />
      </linearGradient>
    </defs>
  );
}

export function Pheta({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 140" className={className} style={style} aria-hidden>
      <Defs />
      {/* tura: the pleated fan rising behind the turban */}
      <g>
        <path d="M58 40C62 14 84 4 106 12c8 3 12 10 10 18L80 44Z" fill="url(#hg-maroon)" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M80 44L${70 + i * 8} ${10 + Math.abs(2.5 - i) * 3}`} stroke="url(#hg-gold)" strokeWidth="2.2" opacity=".9" />
        ))}
        <path d="M58 40C62 14 84 4 106 12c8 3 12 10 10 18" fill="none" stroke="#d9a441" strokeWidth="2" />
      </g>
      {/* the turban: a rounded dome wrapped in maroon with gold bands */}
      <path d="M8 74C6 46 26 30 56 30s54 14 54 40c0 6-2 11-5 14H12c-3-3-4-6-4-10Z" fill="url(#hg-maroon)" stroke="#4a0812" strokeWidth=".8" />
      <path d="M14 58C30 40 70 34 104 52" fill="none" stroke="url(#hg-gold)" strokeWidth="5" opacity=".95" />
      <path d="M10 70C30 54 74 48 108 66" fill="none" stroke="url(#hg-gold)" strokeWidth="4" opacity=".9" />
      <path d="M20 46C40 36 64 34 86 38" fill="none" stroke="#e8c26a" strokeWidth="1.4" opacity=".7" />
      {[18, 30, 42, 54, 66, 78, 90].map((x, i) => (
        <circle key={x} cx={x} cy={62 - Math.sin((i / 6) * Math.PI) * 9} r=".9" fill="#f6dc93" />
      ))}
      {/* gold band along the brow */}
      <path d="M10 80C34 74 82 74 108 80l-2 7C82 82 34 82 12 87Z" fill="url(#hg-gold)" stroke="#8a5f15" strokeWidth=".6" />
      {/* kalgi: a jewelled brooch with a plume */}
      <path d="M70 46c4-10 12-14 20-12-6 3-10 8-12 14Z" fill="#f3ece0" stroke="#c9a056" strokeWidth=".6" />
      <circle cx="72" cy="52" r="5" fill="url(#hg-gold)" stroke="#8a5f15" strokeWidth=".6" />
      <circle cx="72" cy="52" r="2.3" fill="#b3162a" />
      {/* pearl swag across the front and the two strands at the sides */}
      <PearlSwag x1={18} y1={86} cx={58} cy={104} x2={98} y2={86} n={17} />
      <Pearls x1={16} y1={88} x2={16} y2={124} n={11} />
      <Pearls x1={100} y1={88} x2={100} y2={124} n={11} />
      <Drop x={16} y={127} />
      <Drop x={100} y={127} />
    </svg>
  );
}

export function Mundavalya({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 140" className={className} style={style} aria-hidden>
      <Defs />
      {/* the gold bar with red and gold beads */}
      <rect x="8" y="16" width="104" height="4" rx="2" fill="url(#hg-gold)" />
      {[20, 34, 60, 86, 100].map((x, i) => (
        <circle key={x} cx={x} cy={18} r={i === 2 ? 4.2 : 3.3} fill={i % 2 ? "#b3162a" : "url(#hg-gold)"} stroke="#7a0c18" strokeWidth=".5" />
      ))}
      {/* pearls along the bar and two loose swags beneath it */}
      <Pearls x1={12} y1={12} x2={108} y2={12} n={22} r={1.7} />
      <PearlSwag x1={14} y1={21} cx={60} cy={46} x2={106} y2={21} n={21} />
      <PearlSwag x1={22} y1={21} cx={60} cy={36} x2={98} y2={21} n={17} r={1.7} />
      {/* long strands at both ends, ending in red drops */}
      <Pearls x1={10} y1={22} x2={10} y2={118} n={26} />
      <Pearls x1={110} y1={22} x2={110} y2={118} n={26} />
      {[46, 74, 102].map((y) => (
        <g key={y}>
          <circle cx={10} cy={y} r={2.6} fill="#b3162a" />
          <circle cx={110} cy={y} r={2.6} fill="#b3162a" />
        </g>
      ))}
      <Drop x={10} y={121} />
      <Drop x={110} y={121} />
    </svg>
  );
}
