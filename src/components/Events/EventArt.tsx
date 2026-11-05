// Placeholder per-event illustrations (each with its own palette/composition).
// Replace with custom artwork later; keep the `art` keys in config.
const common = { viewBox: "0 0 80 80", className: "h-full w-full", "aria-hidden": true } as const;

export default function EventArt({ art }: { art: string }) {
  switch (art) {
    case "halad":
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#f3d26b" />
          <circle cx="40" cy="42" r="14" fill="#e0a82e" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="40" cy="20" rx="6" ry="10" fill="#fff6d0" transform={`rotate(${a} 40 42)`} />
          ))}
          <circle cx="40" cy="42" r="6" fill="#722B35" />
        </svg>
      );
    case "puja":
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#F7EEDC" />
          <path d="M24 56h32l-4 10H28Z" fill="#C6A15B" />
          <path d="M40 24c8 8 8 16 0 22-8-6-8-14 0-22Z" fill="#e8873a" />
          <path d="M40 32c4 4 4 8 0 11-4-3-4-7 0-11Z" fill="#fbd36a" />
          <path d="M30 56c0-5 20-5 20 0" fill="none" stroke="#722B35" strokeWidth="2" />
        </svg>
      );
    case "kalash":
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#E8C9BE" />
          <path d="M28 34c-6 14-2 30 12 30s18-16 12-30Z" fill="#C6A15B" />
          <rect x="30" y="28" width="20" height="6" rx="2" fill="#722B35" />
          <circle cx="40" cy="20" r="7" fill="#687253" />
          <path d="M40 8c-4 4-6 8-6 12M40 8c4 4 6 8 6 12" stroke="#687253" strokeWidth="2" fill="none" />
        </svg>
      );
    case "antarpat":
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#F7EEDC" />
          <path d="M6 8h28v64H6Z" fill="#722B35" />
          <path d="M46 8h28v64H46Z" fill="#C6A15B" />
          <path d="M6 8h28M46 8h28" stroke="#382923" strokeWidth="2" />
          <path d="M14 20l8 8-8 8-8-8Zm0 22l8 8-8 8-8-8Z" fill="#F7EEDC" opacity=".7" transform="translate(6 0)" />
          <path d="M54 20l8 8-8 8-8-8Zm0 22l8 8-8 8-8-8Z" fill="#722B35" opacity=".7" transform="translate(6 0)" />
        </svg>
      );
    case "evening":
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#382923" />
          <circle cx="52" cy="28" r="12" fill="#F7EEDC" />
          <circle cx="57" cy="24" r="11" fill="#382923" />
          {[[16, 18], [28, 38], [66, 52], [20, 60], [44, 14]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#C6A15B" />
          ))}
          <path d="M0 68c14-8 26-8 40 0s26 8 40 0v12H0Z" fill="#722B35" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect width="80" height="80" fill="#F7EEDC" />
        </svg>
      );
  }
}
