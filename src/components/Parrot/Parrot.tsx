import { useId, type CSSProperties } from "react";

/**
 * A hand-painted Indian rose-ringed parakeet (popat), drawn as an SVG watercolour:
 * layered gradients, a slightly wobbly pigment edge (displacement filter) and a fine paper grain.
 *
 *  - facing  : which way the bird looks ("right" is the drawing's own direction; "left" mirrors it)
 *  - size    : width in design px (390-wide design; converted with --u) or any CSS length; fills the parent when omitted
 *  - pose    : "perched" (wings folded, feet gripping a branch at the bottom) or "flying" (wings raised, beating)
 *  - carrying: a folded note or a marigold held in the beak
 */
export type ParrotPose = "perched" | "flying";
export type ParrotCarry = "none" | "note" | "marigold";

export interface ParrotProps {
  facing?: "left" | "right";
  size?: number | string;
  pose?: ParrotPose;
  carrying?: ParrotCarry;
  /** wing beat in the flying pose (default true; always off with prefers-reduced-motion) */
  flapping?: boolean;
  className?: string;
  style?: CSSProperties;
  /** accessible name; the bird is decorative (aria-hidden) when omitted */
  title?: string;
}

/** viewBoxes: the perched bird's feet grip at y = 88 (of 128); see PERCHED_FOOT_Y */
const VB = { perched: "0 0 120 128", flying: "-6 -10 126 116" } as const;
/** fraction of the perched drawing's height where the toes close around the branch */
export const PERCHED_FOOT_Y = 88 / 128;
/** aspect ratio (height / width) of each pose */
export const PARROT_ASPECT = { perched: 128 / 120, flying: 116 / 126 } as const;

const BODY =
  "M70 20C78 14 89 17 91 27C92 33 88 38 86 41C88 50 86 62 79 72C74 79 68 84 62 86C57 86 53 82 54 76C55 64 60 48 64 38C65 30 66 24 70 20Z";
const WING_FOLDED =
  "M70 40C61 45 55 58 54 72C53 82 50 92 44 104C52 98 58 92 62 86C68 78 73 66 74 54C74 48 73 43 70 40Z";
const PRIMARIES = "M58 76C55 86 50 96 44 104C52 97 58 90 62 82Z";
const WING_RAISED =
  "M77 49C81 35 85 21 81 5C77 -2 67 -4 58 0C62 4 60 8 53 10C58 14 56 18 49 20C55 24 54 28 47 31C55 36 61 42 66 51Z";
const UPPER_BEAK = "M87 25.5C94 23.5 100.5 28 99 37.5C98.5 40.5 96 40.5 95.5 38C95.6 34.5 93 32.2 88.5 33Z";
const LOWER_BEAK = "M88.5 33.5C91.5 33.5 94.5 35.5 93.8 38.6C92 40.5 89 39.8 87.2 37.6Z";

function Tail({ g }: { g: (n: string) => string }) {
  return (
    <g>
      {/* two long central feathers + shorter side feathers, blue-green towards the tips */}
      <path d="M58 82C48 92 36 103 15 113C32 100 44 90 53 79Z" fill={g("tail2")} opacity=".92" />
      <path d="M61 83C54 97 42 110 23 123L21.5 121C36 107 47 94 54.5 80Z" fill={g("tail")} />
      <path d="M60 80C55 90 48 97 39 102C46 93 51 86 55 78Z" fill={g("tail")} opacity=".85" />
      <path d="M57.5 84C51 96 42 106 26 117" stroke="#d7ea8a" strokeOpacity=".35" strokeWidth=".6" fill="none" />
    </g>
  );
}

function Head({ g }: { g: (n: string) => string }) {
  return (
    <g>
      <path d={BODY} fill={g("body")} />
      {/* yellow-green belly wash */}
      <ellipse cx="79" cy="58" rx="7" ry="15" transform="rotate(18 79 58)" fill={g("belly")} />
      {/* head: brighter green, lavender-blue haze on the nape */}
      <ellipse cx="80" cy="27" rx="11.5" ry="10.5" fill={g("head")} />
      <ellipse cx="69" cy="31" rx="5.5" ry="8" fill={g("nape")} />
      {/* pigment pooling on the outline (watercolour edge) */}
      <path d={BODY} fill="none" stroke="#24601f" strokeOpacity=".38" strokeWidth=".9" />
      {/* neck ring: rose collar and black ring */}
      <path d="M86.2 41.6C81 47.6 72 47.6 65.4 39.6" stroke="#e8869a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".9" />
      <path d="M87.5 39.5C83 46 73 46.5 66.5 37.5" stroke="#1d1410" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      {/* beak */}
      <path d={LOWER_BEAK} fill="#8f1c18" />
      <path d={UPPER_BEAK} fill={g("beak")} />
      <path d="M90 26.2C94.5 25.6 98 28.6 98.2 34" stroke="#ffd0bf" strokeOpacity=".55" strokeWidth=".7" fill="none" strokeLinecap="round" />
      <path d="M88.4 26.2q1.6 -1 3 0" stroke="#7a1a14" strokeWidth=".55" fill="none" />
      {/* eye */}
      <circle cx="82" cy="25" r="3" fill="#f6e3a2" stroke="#c98a32" strokeWidth=".5" />
      <circle cx="82.4" cy="25" r="1.75" fill="#1b120e" />
      <circle cx="83" cy="24.3" r=".55" fill="#fff" />
      <path d="M78.6 25.4q3.4 3.4 7 0" stroke="#2c6a25" strokeOpacity=".35" strokeWidth=".5" fill="none" />
    </g>
  );
}

function Carry({ kind, g }: { kind: ParrotCarry; g: (n: string) => string }) {
  if (kind === "note")
    return (
      <g transform="rotate(14 97 40)">
        <path d="M92 39.5L107 38.5L108 53.5L93 54.5Z" fill={g("note")} stroke="#b88b4a" strokeWidth=".55" />
        <path d="M92.3 44.5L107.4 43.5" stroke="#b88b4a" strokeOpacity=".6" strokeWidth=".45" />
        <path d="M95 48.5h9M95 51h6" stroke="#a7826b" strokeOpacity=".55" strokeWidth=".45" strokeLinecap="round" />
        <circle cx="100.2" cy="44.2" r="2" fill="#a3242a" />
        <circle cx="99.7" cy="43.7" r=".55" fill="#e8a39c" opacity=".7" />
      </g>
    );
  if (kind === "marigold")
    return (
      <g>
        <path d="M96 39C98 42 99 44 99.5 46" stroke="#4d7f2c" strokeWidth=".9" fill="none" strokeLinecap="round" />
        <g transform="translate(100.5 49.5)">
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-3.6" rx="2.1" ry="3.3" transform={`rotate(${i * 36})`} fill={g("mari")} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={`in${i}`} cx="0" cy="-2" rx="1.5" ry="2.2" transform={`rotate(${i * 51 + 20})`} fill="#f6a21e" />
          ))}
          <circle r="1.6" fill="#c2531b" />
        </g>
      </g>
    );
  return null;
}

export default function Parrot({
  facing = "right",
  size,
  pose = "perched",
  carrying = "none",
  flapping = true,
  className = "",
  style,
  title,
}: ParrotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `prt${uid}${n}`;
  const g = (n: string) => `url(#${id(n)})`;
  const width = size === undefined ? "100%" : typeof size === "number" ? `calc(var(--u) * ${size})` : size;
  const flying = pose === "flying";

  return (
    <span className={`block ${className}`} style={{ width, lineHeight: 0, ...style }} aria-hidden={title ? undefined : true}>
      <style>{`
        @keyframes prt-flap { from { transform: scaleY(1) } to { transform: scaleY(-0.42) skewX(-8deg) } }
        .prt-wing { transform-box: fill-box; transform-origin: 78% 96%; }
        .prt-wing.prt-beat { animation: prt-flap 420ms ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .prt-wing.prt-beat { animation: none; } }
      `}</style>
      <svg
        viewBox={VB[pose]}
        className="block h-auto w-full overflow-visible"
        style={{ transform: facing === "left" ? "scaleX(-1)" : undefined }}
        role={title ? "img" : undefined}
        aria-label={title}
      >
        <defs>
          <linearGradient id={id("body")} x1=".85" y1="0" x2=".2" y2="1">
            <stop offset="0" stopColor="#7cc34a" />
            <stop offset=".45" stopColor="#5aa840" />
            <stop offset="1" stopColor="#3f8f3a" />
          </linearGradient>
          <radialGradient id={id("belly")} cx=".5" cy=".45" r=".6">
            <stop offset="0" stopColor="#d6ec7a" stopOpacity=".85" />
            <stop offset="1" stopColor="#b9dc62" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("head")} cx=".6" cy=".35" r=".7">
            <stop offset="0" stopColor="#9ad65c" />
            <stop offset=".7" stopColor="#6dbb48" stopOpacity=".9" />
            <stop offset="1" stopColor="#5aa840" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("nape")} cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#8fb3c4" stopOpacity=".55" />
            <stop offset="1" stopColor="#8fb3c4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("wing")} x1=".7" y1="0" x2=".2" y2="1">
            <stop offset="0" stopColor="#5fae42" />
            <stop offset=".6" stopColor="#3f8f3a" />
            <stop offset="1" stopColor="#2c6b2b" />
          </linearGradient>
          <linearGradient id={id("wingfar")} x1=".7" y1="1" x2=".3" y2="0">
            <stop offset="0" stopColor="#3a7f34" />
            <stop offset="1" stopColor="#285f2a" />
          </linearGradient>
          <linearGradient id={id("wingup")} x1=".8" y1="1" x2=".2" y2="0">
            <stop offset="0" stopColor="#6db847" />
            <stop offset=".55" stopColor="#469a3c" />
            <stop offset="1" stopColor="#2f7030" />
          </linearGradient>
          <linearGradient id={id("tail")} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5aa845" />
            <stop offset=".6" stopColor="#3f8a5a" />
            <stop offset="1" stopColor="#5f9fa0" />
          </linearGradient>
          <linearGradient id={id("tail2")} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4c9a3e" />
            <stop offset="1" stopColor="#4d8a8e" />
          </linearGradient>
          <linearGradient id={id("beak")} x1="0" y1="0" x2=".6" y2="1">
            <stop offset="0" stopColor="#e2503e" />
            <stop offset=".6" stopColor="#c8322a" />
            <stop offset="1" stopColor="#9b211d" />
          </linearGradient>
          <linearGradient id={id("note")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fdf6e6" />
            <stop offset="1" stopColor="#f0dcb0" />
          </linearGradient>
          <radialGradient id={id("mari")} cx=".5" cy=".9" r="1">
            <stop offset="0" stopColor="#f8b42a" />
            <stop offset="1" stopColor="#e0661a" />
          </radialGradient>
          {/* watercolour: slightly irregular pigment edges + fine paper grain inside the paint */}
          <filter id={id("wc")} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="gr" />
            <feColorMatrix in="gr" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.2  0 0 0 0 0.08  -0.9 0 0 0 0.52" result="ga" />
            <feComposite in="ga" in2="d" operator="in" result="grain" />
            <feMerge>
              <feMergeNode in="d" />
              <feMergeNode in="grain" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${id("wc")})`}>
          {flying ? (
            <>
              {/* far wing (behind the body) */}
              <g transform="translate(8 -2) scale(.94)">
                <path className={`prt-wing ${flapping ? "prt-beat" : ""}`} d={WING_RAISED} fill={g("wingfar")} />
              </g>
              {/* body tilted forward into flight, feet tucked */}
              <g transform="rotate(28 68 60)">
                <Tail g={g} />
                <Head g={g} />
                <Carry kind={carrying} g={g} />
              </g>
              {/* near wing */}
              <g>
                <g className={`prt-wing ${flapping ? "prt-beat" : ""}`}>
                  <path d={WING_RAISED} fill={g("wingup")} />
                  <path d={WING_RAISED} fill="none" stroke="#24601f" strokeOpacity=".4" strokeWidth=".8" />
                  {/* primary feather lines and a yellow-green edge on the coverts */}
                  <path d="M80 8C74 20 70 32 69 46M73 4C68 14 62 24 58 32M64 2C60 10 56 16 50 22" stroke="#24601f" strokeOpacity=".35" strokeWidth=".6" fill="none" />
                  <path d="M77 46C79 36 81 26 80 16" stroke="#d3ea7c" strokeOpacity=".55" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </g>
              </g>
            </>
          ) : (
            <>
              <Tail g={g} />
              <Head g={g} />
              {/* folded wing */}
              <path d={WING_FOLDED} fill={g("wing")} />
              <path d={PRIMARIES} fill="#24582a" opacity=".75" />
              <path d={WING_FOLDED} fill="none" stroke="#24601f" strokeOpacity=".4" strokeWidth=".7" />
              <path
                d="M67 47q-4 3 -5 7M71 51q-4 3 -5 7M63 58q-3 3 -4 7M68 62q-4 3 -5 7M60 69q-3 4 -3 8"
                stroke="#d3ea7c"
                strokeOpacity=".5"
                strokeWidth=".7"
                fill="none"
                strokeLinecap="round"
              />
              {/* zygodactyl feet gripping the branch */}
              <path
                d="M61 84.5c-.5 2 -2.2 3.6 -4.6 4.1M62.4 85c.6 2 2.2 3.4 4.4 3.6M68 82.5c-.4 2.2 -1.8 4 -4 4.6M69.2 83c.8 2 2.4 3.4 4.6 3.6"
                stroke="#8f7f7b"
                strokeWidth="1.9"
                strokeLinecap="round"
                fill="none"
              />
              <Carry kind={carrying} g={g} />
            </>
          )}
        </g>
      </svg>
    </span>
  );
}
