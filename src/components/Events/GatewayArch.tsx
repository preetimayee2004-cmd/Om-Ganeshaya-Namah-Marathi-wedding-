/**
 * A watercolour-style stone gateway inspired by Mumbai's Gateway of India: two turreted towers
 * with small domes, a crenellated centre block and one tall, wide pointed arch. The event
 * picture fills the arch with a marigold toran hanging across it.
 * Everything is in a 300 x 380 viewBox; class names drive the animations (see EVC_CSS in Events).
 */
export const GATEWAY_VB = { w: 300, h: 380 };

const BASE = 334; // ground line
const TW = 62; // tower width
const LT = 10; // left tower x
const RT = 300 - 10 - TW; // right tower x (228)

/** the arch opening (picture window) */
export const ARCH = `M84 ${BASE}V194C84 142 116 118 150 100C184 118 216 142 216 194V${BASE}Z`;
const ARCH_OUTER = `M76 ${BASE}V190C76 134 112 108 150 88C188 108 224 134 224 190V${BASE}`;

/** crenellated parapet from x0 to x1 at the top of the centre block */
const merlons = (x0: number, x1: number) => {
  let d = "";
  for (let x = x0; x < x1; x += 16) d += `H${x + 6}V104H${x + 12}V112`;
  return d + `H${x1}`;
};

// outer silhouette of the whole gateway, used for the gold outline that draws itself
const SILHOUETTE =
  `M${LT} ${BASE}V104H${LT + 12}V66Q${LT + 31} 28 ${LT + 50} 66V104H${LT + TW}V112` +
  merlons(LT + TW, RT) +
  `V104H${RT + 12}V66Q${RT + 31} 28 ${RT + 50} 66V104H${RT + TW}V${BASE}`;

function Tower({ x }: { x: number }) {
  const mid = x + TW / 2;
  return (
    <g>
      <rect x={x} y={104} width={TW} height={BASE - 104} fill="url(#gw-stone)" />
      {/* the side away from the light, for depth */}
      <rect x={x + TW * 0.62} y={104} width={TW * 0.38} height={BASE - 104} fill="#a8804a" opacity=".13" />
      <rect x={x - 4} y={98} width={TW + 8} height={10} fill="#e4c48e" />
      <rect x={x + 12} y={66} width={TW - 24} height={34} fill="url(#gw-stone)" />
      <path d={`M${x + 10} 68Q${mid} 26 ${x + TW - 10} 68Z`} fill="url(#gw-dome)" />
      <path d={`M${mid} 32V20`} stroke="#b08850" strokeWidth="1.4" />
      <circle cx={mid} cy={18} r={2.4} fill="#c9a06a" />
      {/* small chhatri openings on the turret */}
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${mid + k * 10 - 3.5} 96V84Q${mid + k * 10} 76 ${mid + k * 10 + 3.5} 84V96Z`} fill="#9c7a4f" opacity=".55" />
      ))}
      {/* arched windows down the tower */}
      {[146, 232].map((y) => (
        <g key={y}>
          <path d={`M${mid - 11} ${y + 50}V${y + 14}Q${mid} ${y - 2} ${mid + 11} ${y + 14}V${y + 50}Z`} fill="#8a6a45" opacity=".5" />
          <path d={`M${mid - 15} ${y + 54}V${y + 14}Q${mid} ${y - 7} ${mid + 15} ${y + 14}V${y + 54}`} fill="none" stroke="#b08850" strokeWidth=".9" opacity=".8" />
          <path d={`M${mid} ${y + 4}V${y + 50}M${mid - 11} ${y + 28}H${mid + 11}`} stroke="#c9a06a" strokeWidth=".6" opacity=".7" />
        </g>
      ))}
      {/* string courses */}
      {[132, 214, 298].map((y) => (
        <rect key={y} x={x - 2} y={y} width={TW + 4} height={4} fill="#d9b782" />
      ))}
    </g>
  );
}

function Toran() {
  // a gentle swag of marigolds across the arch with five short strands
  const sag = (x: number) => 128 + Math.sin(((x - 92) / 116) * Math.PI) * 10;
  const swag = Array.from({ length: 17 }, (_, i) => {
    const x = 92 + (i / 16) * 116;
    return { x, y: sag(x), c: i % 3 === 1 ? "#f3a31b" : "#e8781a" };
  });
  const strands = [106, 128, 150, 172, 194];
  return (
    <g className="evc-toran">
      <path d="M92 128Q150 148 208 128" fill="none" stroke="#6f7f3f" strokeWidth="1" />
      {strands.map((x, i) => {
        const top = sag(x);
        const len = i === 2 ? 3 : 2;
        return (
          <g key={x}>
            <path d={`M${x} ${top}V${top + len * 7 + 4}`} stroke="#6f7f3f" strokeWidth=".7" />
            {Array.from({ length: len }, (_, k) => (
              <circle key={k} cx={x} cy={top + 6 + k * 7} r={2.9} fill={k % 2 ? "#f3a31b" : "#e8781a"} />
            ))}
            <path d={`M${x} ${top + len * 7 + 4}l-3 5h6z`} fill="#5f7d33" />
          </g>
        );
      })}
      {swag.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={3.5} fill={m.c} stroke="#c55a10" strokeWidth=".4" />
      ))}
    </g>
  );
}

export default function GatewayArch({ id, image, alt }: { id: string; image: string; alt: string }) {
  const clip = `gw-clip-${id}`;
  return (
    <svg viewBox={`0 0 ${GATEWAY_VB.w} ${GATEWAY_VB.h}`} className="block h-auto w-full" role="img" aria-label={alt}>
      <defs>
        <linearGradient id="gw-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2ddb4" />
          <stop offset="1" stopColor="#dcb77f" />
        </linearGradient>
        <linearGradient id="gw-dome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9b47c" />
          <stop offset=".45" stopColor="#f6e3bd" />
          <stop offset="1" stopColor="#c9a06a" />
        </linearGradient>
        <linearGradient id="gw-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3d6bb" />
          <stop offset="1" stopColor="#d6ccb4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gw-inner" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a3a1a" stopOpacity=".35" />
          <stop offset=".12" stopColor="#5a3a1a" stopOpacity="0" />
          <stop offset=".88" stopColor="#5a3a1a" stopOpacity="0" />
          <stop offset="1" stopColor="#5a3a1a" stopOpacity=".35" />
        </linearGradient>
        <pattern id="gw-courses" width="20" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 8.5H20M10 0V8.5" stroke="#b08850" strokeWidth=".45" opacity=".5" />
        </pattern>
        <clipPath id={clip}>
          <path d={ARCH} />
        </clipPath>
      </defs>

      {/* the building appears through a watercolour wash */}
      <g className="evc-wash">
        {/* water and platform */}
        <rect x="0" y={BASE + 4} width="300" height={380 - BASE - 4} fill="url(#gw-water)" />
        <path d={`M24 ${BASE + 22}h40M118 ${BASE + 30}h64M222 ${BASE + 20}h52`} stroke="#c9b48c" strokeWidth=".8" opacity=".7" />
        <rect x="2" y={BASE - 2} width="296" height="10" rx="2" fill="#d4ae76" />
        <rect x="8" y={BASE - 8} width="284" height="8" fill="#e2c28c" />

        {/* centre block with crenellated parapet */}
        <rect x={LT + TW} y="112" width={RT - LT - TW} height={BASE - 112} fill="url(#gw-stone)" />
        {Array.from({ length: Math.floor((RT - LT - TW) / 16) }, (_, i) => (
          <rect key={i} x={LT + TW + 6 + i * 16} y={104} width={6} height={10} fill="#e4c48e" />
        ))}
        <rect x={LT + TW} y="112" width={RT - LT - TW} height="5" fill="#d9b782" />
        <rect x={LT + TW} y="112" width={RT - LT - TW} height={BASE - 112} fill="url(#gw-courses)" />

        <Tower x={LT} />
        <Tower x={RT} />
        <rect x={LT} y="104" width={TW} height={BASE - 104} fill="url(#gw-courses)" />
        <rect x={RT} y="104" width={TW} height={BASE - 104} fill="url(#gw-courses)" />

        {/* the arch's carved outer moulding */}
        <path d={ARCH_OUTER} fill="none" stroke="#c9a06a" strokeWidth="5" />
        <path d={ARCH_OUTER} fill="none" stroke="#f3dfb6" strokeWidth="1.2" />
        <path d={ARCH} fill="#efe2c6" />
      </g>

      {/* the event picture inside the arch, with a soft shadow on its sides */}
      <g clipPath={`url(#${clip})`}>
        <g className="evc-illu">
          <image href={image} x="84" y="100" width="132" height={BASE - 100} preserveAspectRatio="xMidYMin slice" />
          <rect x="84" y="100" width="132" height={BASE - 100} fill="url(#gw-inner)" />
        </g>
      </g>
      <Toran />

      {/* antique-gold outline that draws itself along the gateway */}
      <g className="evc-outline" fill="none" stroke="#b8862f" strokeLinejoin="round">
        <path d={ARCH} pathLength={1} strokeWidth="1.6" />
        <path d={SILHOUETTE} pathLength={1} strokeWidth="1.1" />
      </g>
    </svg>
  );
}
