import { useEffect, useMemo, useRef, useState } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { submitRsvp } from "../../lib/rsvp";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Royal envelope RSVP.
 * Everything inside the envelope box is positioned in the artwork's own pixel space (1200 x 896) and converted to %.
 *  - /rsvp/envelope-only.png : the envelope on transparency (seal + tassel painted out), cropped from the 1200 x 896 artwork at (240, 200)
 *  - /rsvp/seal-piece.png   : the wax seal + tassel as a separate cut-out (200 x 390, taken at x=500, y=340) that breaks away
 *  - /rsvp/couple.png       : the illustrated bride and groom (rises out of the envelope together with the card)
 */
// coordinates below stay in the original 1200 x 896 artwork space; the image is the crop starting at (OX, OY)
const OX = 240;
const OY = 200;
const W = 720;
const H = 540;
const px = (x: number) => `${(((x - OX) / W) * 100).toFixed(3)}%`;
const py = (y: number) => `${(((y - OY) / H) * 100).toFixed(3)}%`;
const FLAP: [number, number][] = [[270, 222], [928, 222], [928, 296], [598, 522], [270, 296]];
const FLAP_POLY = `polygon(${FLAP.map(([x, y]) => `${px(x)} ${py(y)}`).join(", ")})`;
const FLAP_INNER = `polygon(${[[274, 225], [924, 225], [924, 292], [598, 516], [274, 292]].map(([x, y]) => `${px(x)} ${py(y)}`).join(", ")})`;
// the card is only visible above the envelope and inside the open flap shape (it sits in the pocket)
const CARD_CLIP = `polygon(-60% -250%, 160% -250%, 160% ${py(222)}, ${px(928)} ${py(222)}, ${px(928)} ${py(296)}, ${px(598)} ${py(522)}, ${px(270)} ${py(296)}, ${px(270)} ${py(222)}, -60% ${py(222)})`;
const SEAL = { x: 598, y: 431, r: 80 };
const PIECE = { x: 500, y: 340, w: 200, h: 390 }; // seal-piece.png position inside the artwork

// ===== layout (in container-width units, cqw) =====
const SPACE_CLOSED = 60; // heading zone above the envelope (leaves breathing room before it)
const SPACE_OPEN = 95; // room for the couple + card once the envelope is open
const ENV_SCALE = 100; // the envelope fills the column

// ===== timing (ms after "Joyfully Accept"), about 2.7 s in total =====
const T_SEAL = 450; // seal breaks, then the flap opens
const T_FLAP = 800; // flap opens
const T_CARD = 700; // card + couple rise
const T_TEXT = 500; // headline + message fade in
const T_CAL = 2250; // calendar button appears last

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const RADIUS = 12; // one border radius for cards and buttons
const SERIF = "'Cormorant Garamond', Georgia, serif";

function downloadIcs() {
  const start = new Date(wedding.date);
  const end = new Date(start.getTime() + 4 * 3600 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const title = `Wedding of ${coupleOrder[0]} & ${coupleOrder[1]}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${f(start)}@wedding-invitation`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(`${wedding.venue.name}, ${wedding.venue.city}`)}`,
    `DESCRIPTION:${esc("We can't wait to celebrate this beautiful day with you!")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "wedding-invitation.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function RSVP(_props: { inScene?: boolean } = {}) {
  const { guestName, isPersonalised } = useGuest();
  const scroller = useScrollRoot();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const [sectionW, setSectionW] = useState(400);
  const [fallPx, setFallPx] = useState(700);
  const [visible, setVisible] = useState(false);

  const [entered, setEntered] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  // 0 closed | 1 seal breaking | 2 flap opening | 3 card rising | 4 text shown | 5 calendar shown
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);
  const timers = useRef<number[]>([]);

  // section entry (fade in, envelope rises, artwork revealed through a mask)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setEntered(true);
          io.disconnect();
        }
      },
      { root: scroller ?? null, threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scroller]);
  useEffect(() => {
    if (!entered || revealDone) return;
    const t = window.setTimeout(() => setRevealDone(true), 1500);
    return () => clearTimeout(t);
  }, [entered, revealDone]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // petals only run while the section is on screen (and are removed when it is not)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { root: scroller ?? null, threshold: 0.05 });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      setSectionW(el.clientWidth);
      setFallPx(el.clientHeight + 40);
    });
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, [scroller]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const accept = async () => {
    if (sending.current || stage !== 0) return;
    sending.current = true;
    setError(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setStage(5);
    else {
      setStage(1); // button compresses, seal breaks
      later(() => setStage(2), T_SEAL); // flap opens
      later(() => setStage(3), T_SEAL + T_FLAP * 0.55); // card + couple rise
      later(() => setStage(4), T_SEAL + T_FLAP * 0.55 + T_CARD); // headline + message
      later(() => setStage(5), T_CAL); // calendar button last
    }
    try {
      await submitRsvp({
        name: isPersonalised && guestName.trim().length >= 2 ? guestName : wedding.guestFallback,
        attending: "yes",
        guests: 1,
        phone: "",
        message: "",
      });
    } catch {
      // saving failed: close the envelope again so the guest can retry
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setStage(0);
      setError(true);
    } finally {
      sending.current = false;
    }
  };

  const fragments = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
        const d = 26 + Math.random() * 34;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d + 8, rot: Math.random() * 360, size: 2 + Math.random() * 3, delay: Math.random() * 120 };
      }),
    [],
  );

  const petalSpecs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: 4 + ((i * 97) % 92) + Math.random() * 4,
        dx: 60 + Math.random() * 120,
        sway: (Math.random() - 0.5) * 50,
        rot: (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 240),
        dur: 9 + Math.random() * 7,
        delay: -Math.random() * 14,
        size: 13 + Math.random() * 8,
        color: ["#F4C6CF", "#D98F9F", "#8E3347", "#FBF1E3", "#EBA9B6", "#B85A6E"][i % 6],
      })),
    [],
  );
  const petalCount = sectionW < 440 ? 9 : 14;
  const showPetals = stage >= 1 && visible && !(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const sealOpen = stage >= 1;
  const flapOpen = stage >= 2;
  const flapBack = stage >= 3; // once the flap has passed upright it lies behind the card
  const cardUp = stage >= 3;
  const textShown = stage >= 4;
  const gone = (on: boolean): React.CSSProperties => ({ opacity: on ? 0 : 1 });

  // seal piece geometry, as fractions of the piece image
  const sp = {
    cx: (SEAL.x - PIECE.x) / PIECE.w,
    cy: (SEAL.y - PIECE.y) / PIECE.h,
    rx: SEAL.r / PIECE.w,
    ry: SEAL.r / PIECE.h,
  };

  return (
    <section ref={sectionRef} id="rsvp" aria-labelledby="rsvp-title" className="relative overflow-x-clip px-5 py-6 text-[#4b0f16]">
      {/* continuous falling petals (behind the envelope, the couple, the text and the buttons) */}
      {showPetals && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
          {petalSpecs.slice(0, petalCount).map((pt, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="absolute"
              style={{
                left: `${pt.left}%`,
                top: "calc(var(--u) * -30)",
                width: pt.size,
                height: pt.size,
                opacity: 0,
                willChange: "transform, opacity",
                ["--dx" as string]: `${pt.dx}px`,
                ["--sway" as string]: `${pt.sway}px`,
                ["--rot" as string]: `${pt.rot}deg`,
                ["--fall" as string]: `${fallPx}px`,
                animation: `rsvp-petal ${pt.dur.toFixed(1)}s linear ${pt.delay.toFixed(1)}s infinite`,
              }}
            >
              <defs>
                <linearGradient id={`pg${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={pt.color} stopOpacity=".95" />
                  <stop offset="1" stopColor={pt.color} stopOpacity=".62" />
                </linearGradient>
              </defs>
              <path d="M12 1.5C18.5 6 20 14 12 22.5 4 14 5.5 6 12 1.5Z" fill={`url(#pg${i})`} />
              <path d="M12 4C12.4 9 12.2 15 12 20" stroke="#fff" strokeOpacity=".28" strokeWidth=".6" fill="none" />
            </svg>
          ))}
        </div>
      )}
      {/* clip paths for the seal pieces (objectBoundingBox) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="rsvp-seal-l" clipPathUnits="objectBoundingBox">
            <path d={`M${sp.cx} ${sp.cy - sp.ry} A${sp.rx} ${sp.ry} 0 0 0 ${sp.cx} ${sp.cy + sp.ry} Z`} />
          </clipPath>
          <clipPath id="rsvp-seal-r" clipPathUnits="objectBoundingBox">
            <path d={`M${sp.cx} ${sp.cy - sp.ry} A${sp.rx} ${sp.ry} 0 0 1 ${sp.cx} ${sp.cy + sp.ry} Z`} />
          </clipPath>
          <clipPath id="rsvp-seal-c" clipPathUnits="objectBoundingBox">
            <ellipse cx={(SEAL.x - OX) / W} cy={(SEAL.y - OY) / H} rx={SEAL.r / W} ry={SEAL.r / H} />
          </clipPath>
          <clipPath id="rsvp-tassel" clipPathUnits="objectBoundingBox">
            <rect x={44 / PIECE.w} y={(505 - PIECE.y) / PIECE.h} width={112 / PIECE.w} height={(PIECE.h - (505 - PIECE.y)) / PIECE.h} />
          </clipPath>
        </defs>
      </svg>

      <div
        ref={stageRef}
        className="relative mx-auto w-full max-w-[420px] select-none"
        style={{ containerType: "inline-size", zIndex: 1 }}
      >
        {/* heading zone (grows once the envelope opens, to make room for the card and the couple) */}
        <div
          className="relative"
          style={{
            height: `${stage >= 1 ? SPACE_OPEN : SPACE_CLOSED}cqw`,
            transition: `height ${T_SEAL + T_FLAP * 0.55 + T_CARD}ms ${EASE}`,
          }}
        >
          <h2
            id="rsvp-title"
            className="absolute inset-x-0 top-0 text-center font-normal text-[#7a1420]"
            style={{
              fontFamily: SERIF,
              opacity: entered && stage === 0 ? 1 : 0,
              transform: entered && stage === 0 ? "none" : "translateY(calc(var(--u) * 10))",
              transition: stage === 0 ? `opacity 1200ms ${EASE} 250ms, transform 1200ms ${EASE} 250ms` : `opacity 350ms ${EASE}`,
            }}
          >
            <span className="block leading-[1.1]" style={{ fontSize: "10cqw", fontWeight: 700, letterSpacing: "0.01em" }}>
              Your Presence,
            </span>
            <span className="block leading-[1.1]" style={{ fontSize: "10cqw", fontWeight: 700 }}>
              Our Blessing
            </span>
            {/* divider: gold hairlines with small diamonds and a four-petal centre */}
            <svg viewBox="0 0 300 16" className="mx-auto mt-[2cqw] block h-[4.4cqw] w-[82cqw] text-[#b5782a]" fill="none" aria-hidden>
              <path d="M6 8h112M182 8h112" stroke="currentColor" strokeWidth=".9" />
              <path d="M126 8l3.2-3.2L132.4 8l-3.2 3.2zM167.6 8l3.2-3.2L174 8l-3.2 3.2z" fill="currentColor" />
              <path d="M150 1.5l4.6 6.5-4.6 6.5-4.6-6.5z" fill="currentColor" />
              <path d="M143 8l4-2.4 3 2.4-3 2.4zM157 8l-4-2.4-3 2.4 3 2.4z" fill="currentColor" opacity=".75" />
            </svg>
            <span className="mx-auto mt-[2.4cqw] block max-w-[84cqw] leading-[1.22]" style={{ fontSize: "5.6cqw", fontWeight: 600 }}>
              Kindly let us know, <span className="guest-name">{guestName}</span>,{" "}
              if you will be joining us for this special occasion.
            </span>
          </h2>
        </div>

        {/* envelope + corner flowers: rises into place with a slight 3D tilt */}
        <div
          className="relative"
          style={{
            width: `${ENV_SCALE}%`,
            marginLeft: `${(100 - ENV_SCALE) / 2}%`,
            marginTop: 0,
            aspectRatio: `${W} / ${H}`,
            opacity: entered ? 1 : 0,
            transform: entered ? "none" : "translateY(calc(var(--u) * 70)) perspective(calc(var(--u) * 900)) rotateX(18deg)",
            transformOrigin: "50% 100%",
            transition: `opacity 1200ms ease, transform 1000ms ${EASE}`,
          }}
        >
          <div className="h-full w-full" style={{ animation: stage === 0 && revealDone ? "rsvp-float 7s ease-in-out infinite alternate" : undefined }}>
            {/* artwork revealed through a soft mask while entering */}
            <div
              className={`h-full w-full ${entered && !revealDone ? "smoke-reveal" : ""}`}
              style={
                entered && !revealDone
                  ? {
                      animationDuration: "1400ms",
                      WebkitMaskImage: "radial-gradient(ellipse 75% 85% at 50% 58%, #000 calc(var(--r) * 0.9), transparent calc(var(--r) * 0.9 + 22%))",
                      maskImage: "radial-gradient(ellipse 75% 85% at 50% 58%, #000 calc(var(--r) * 0.9), transparent calc(var(--r) * 0.9 + 22%))",
                    }
                  : !entered
                    ? { opacity: 0 }
                    : undefined
              }
            >
              <div className="relative h-full w-full" style={{ perspective: "calc(var(--u) * 1400)", perspectiveOrigin: "50% 35%" }}>
                {/* base: envelope + corner flowers, seal and tassel removed */}
                <img src="/rsvp/envelope-only.png" alt="" draggable={false} className="absolute inset-0 h-full w-full" />

                {/* inside of the envelope (shows once the flap lifts) */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: FLAP_INNER, background: "linear-gradient(180deg, #2c0509 0%, #4b0a14 55%, #6a1020 100%)", zIndex: 1 }}
                />

                {/* invitation card (short) + couple rise out of the pocket */}
                <div className="pointer-events-none absolute inset-0" style={{ clipPath: CARD_CLIP, zIndex: 2 }}>
                  <div
                    className="absolute text-center"
                    style={{
                      left: px(380),
                      width: `${((440 / W) * 100).toFixed(3)}%`,
                      top: py(-38),
                      height: `${((560 / H) * 100).toFixed(3)}%`,
                      transform: cardUp ? "translateY(0)" : "translateY(128%)",
                      transition: `transform ${T_CARD}ms ${EASE}`,
                      containerType: "inline-size",
                    }}
                  >
                    {/* the card itself */}
                    <div
                      className="absolute inset-0"
                      style={{
                        borderRadius: RADIUS,
                        background: "linear-gradient(170deg, #fffaf0 0%, #f9efd9 60%, #f1e2c0 100%)",
                        border: "calc(var(--u) * 2) solid #d4a53c",
                        boxShadow: "inset 0 0 0 calc(var(--u) * 4) #fbf3df, inset 0 0 0 calc(var(--u) * 5) rgba(212,165,60,0.7), 0 calc(var(--u) * 6) calc(var(--u) * 16) rgba(40,10,5,0.35)",
                      }}
                    />
                    {/* the couple stands on the card, rising out of the envelope with it */}
                    <div className="absolute" style={{ left: "11%", width: "78%", top: "-97cqw" }}>
                      <img
                        src={wedding.images.rsvpCouple}
                        alt="The bride and groom waving"
                        draggable={false}
                        className="block w-full"
                        loading="lazy"
                        decoding="async"
                        style={{
                          transformOrigin: "50% 100%",
                          animation: textShown ? "rsvp-wave 2.8s ease-in-out infinite" : undefined,
                          WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                          maskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                          filter: "drop-shadow(0 calc(var(--u) * 4) calc(var(--u) * 6) rgba(80,30,20,0.28))",
                        }}
                      />
                    </div>
                    {/* headline + one supporting message */}
                    <div
                      className="absolute inset-x-0 flex flex-col items-center"
                      style={{
                        top: "9cqw",
                        padding: "0 6%",
                        opacity: textShown ? 1 : 0,
                        transform: textShown ? "none" : "translateY(calc(var(--u) * 8))",
                        transition: `opacity ${T_TEXT}ms ease, transform ${T_TEXT}ms ${EASE}`,
                      }}
                    >
                      <p role="status" className="font-script leading-[1.08] text-[#6d0f1b]" style={{ fontSize: "13.5cqw" }}>
                        <span className="block">Yay!</span>
                        <span className="block">You&apos;re</span>
                        <span className="block">Coming! ♡</span>
                      </p>
                      <span className="mt-[3.5cqw] block h-px w-[44cqw] bg-gradient-to-r from-transparent via-[#c9992f] to-transparent" aria-hidden />
                      <p className="mt-[3.5cqw] font-body leading-[1.45] text-[#4b0f16]/90" style={{ fontSize: "5.6cqw" }}>
                        We can&apos;t wait to celebrate this beautiful day with you, <span className="guest-name">{guestName}</span>!
                      </p>
                      {/* a small heart fills the space above the envelope's V */}
                      <svg
                        viewBox="0 0 24 22"
                        className="mt-[5cqw] block h-[11cqw] w-[12cqw]"
                        aria-hidden
                        style={{ animation: textShown ? "rsvp-heart 1.8s ease-in-out infinite" : undefined }}
                      >
                        <defs>
                          <linearGradient id="rsvp-heart-g" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#b3243a" />
                            <stop offset="1" stopColor="#6d0f1b" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 21s-8.5-5.3-10.6-10.4C-.1 5.9 3.6 1.5 7.7 2.6c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1.1 7.8 3.3 6.3 8C20.5 15.7 12 21 12 21Z"
                          fill="url(#rsvp-heart-g)"
                          stroke="#d4a53c"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* the flap: front = artwork, back = lining */}
                <div
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: `50% ${py(222)}`,
                    transform: flapOpen ? "rotateX(180deg)" : "rotateX(0deg)",
                    transition: `transform ${T_FLAP}ms cubic-bezier(0.55, 0.05, 0.25, 1)`,
                    zIndex: flapBack ? 1 : 3,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src="/rsvp/envelope-only.png"
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full"
                    style={{ clipPath: FLAP_POLY, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: FLAP_POLY,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      transformOrigin: `${px(599)} 50%`,
                      background: "linear-gradient(180deg, #f3e2bd 0%, #e6c98c 100%)",
                      boxShadow: "inset 0 0 0 calc(var(--u) * 3) #d4a53c",
                    }}
                  />
                </div>

                {/* wax seal (two halves) and tassel: pixel-exact cut-outs of the artwork */}
                {([
                  ["rsvp-seal-l", "translate(calc(var(--u) * -16), calc(var(--u) * 9)) rotate(-16deg)"],
                  ["rsvp-seal-r", "translate(calc(var(--u) * 16), calc(var(--u) * 11)) rotate(18deg)"],
                ] as const).map(([id, move]) => (
                  <img
                    key={id}
                    src="/rsvp/seal-piece.png"
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute"
                    style={{
                      left: px(PIECE.x),
                      top: py(PIECE.y),
                      width: `${((PIECE.w / W) * 100).toFixed(3)}%`,
                      height: `${((PIECE.h / H) * 100).toFixed(3)}%`,
                      clipPath: `url(#${id})`,
                      zIndex: 6,
                      transformOrigin: `${(sp.cx * 100).toFixed(2)}% ${(sp.cy * 100).toFixed(2)}%`,
                      transform: sealOpen ? move : "none",
                      opacity: sealOpen ? 0 : 1,
                      transition: `transform ${T_SEAL}ms ${EASE}, opacity ${T_SEAL}ms ease ${T_SEAL * 0.2}ms`,
                    }}
                  />
                ))}
                <img
                  src="/rsvp/seal-piece.png"
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute"
                  style={{
                    left: px(PIECE.x),
                    top: py(PIECE.y),
                    width: `${((PIECE.w / W) * 100).toFixed(3)}%`,
                    height: `${((PIECE.h / H) * 100).toFixed(3)}%`,
                    clipPath: "url(#rsvp-tassel)",
                    zIndex: 6,
                    transform: sealOpen ? "translateY(calc(var(--u) * 18))" : "none",
                    ...gone(sealOpen),
                    transition: `transform ${T_SEAL}ms ${EASE}, opacity ${T_SEAL * 0.8}ms ease`,
                  }}
                />
                {/* idle gold shimmer over the seal */}
                {stage === 0 && revealDone && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      clipPath: "url(#rsvp-seal-c)",
                      zIndex: 7,
                      background: "linear-gradient(115deg, transparent 38%, rgba(255,240,190,0.7) 50%, transparent 62%) 0 0 / 260% 100%",
                      mixBlendMode: "soft-light",
                      animation: "rsvp-seal-shine 5s ease-in-out infinite",
                    }}
                  />
                )}
                {/* tiny gold sparkles */}
                {sealOpen &&
                  fragments.map((f, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="pointer-events-none absolute"
                      style={{
                        left: px(SEAL.x),
                        top: py(SEAL.y),
                        width: f.size,
                        height: f.size,
                        zIndex: 8,
                        background: "linear-gradient(135deg, #f6d98a, #b98a2e)",
                        borderRadius: i % 3 === 0 ? "50%" : "1px",
                        opacity: 0,
                        ["--dx" as string]: `${f.dx}px`,
                        ["--dy" as string]: `${f.dy}px`,
                        ["--rot" as string]: `${f.rot}deg`,
                        animation: `rsvp-frag 700ms ${f.delay}ms ease-out forwards`,
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Joyfully Accept: slim maroon and antique-gold button (compresses, then folds away) + the line beneath it */}
      <div
        className="relative mx-auto flex flex-col items-center overflow-hidden"
        style={{
          zIndex: 1,
          maxHeight: stage === 0 ? "calc(var(--u) * 190)" : 0,
          opacity: stage === 0 && entered ? 1 : 0,
          marginTop: stage === 0 ? 0 : 0,
          transition: `opacity ${stage === 0 ? "500ms ease 600ms" : "350ms ease 120ms"}, max-height 600ms ${EASE} 300ms`,
        }}
      >
        <button
          onClick={accept}
          disabled={stage !== 0}
          className="btn-gold relative"
          style={{
            transform: stage >= 1 ? "scale(0.9)" : "none",
            transition: `transform 280ms ${EASE}`,
          }}
        >
          <svg viewBox="0 0 40 28" className="h-5 w-7" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <path d="M20 3c4 5 4 12 0 17-4-5-4-12 0-17Z" />
            <path d="M20 20c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
            <path d="M6 24c6 3 22 3 28 0" />
          </svg>
          <span>Joyfully Accept</span>
        </button>
        <p className="mt-2 font-body text-[12.5px] font-semibold tracking-[0.06em] text-[#8a5f15]">
          <span aria-hidden>↑ </span>Tap on the Accept button
        </p>
        {/* "We can't wait to celebrate with you!" framed by gold rules */}
        <div className="mt-4 flex w-full max-w-[360px] items-center gap-3 px-1" aria-hidden={false}>
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #b5782a)" }} />
          <span className="relative -ml-1 -mr-1 h-1.5 w-1.5 rotate-45 bg-[#b5782a]" style={{ marginRight: "calc(var(--u) * -6)" }} />
          <p className="whitespace-nowrap text-center italic leading-none text-[#7a1420]" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "calc(var(--u) * 20)" }}>
            We can&apos;t wait to celebrate with you!
          </p>
          <span className="relative h-1.5 w-1.5 rotate-45 bg-[#b5782a]" style={{ marginLeft: "calc(var(--u) * -6)" }} />
          <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, #b5782a)" }} />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-center font-body text-sm text-[#6d0f1b]">
            Something went wrong. Please try again.
          </p>
        )}
      </div>

      {/* Add to Calendar appears last, beneath the envelope */}
      <div
        className="relative mx-auto flex flex-col items-center overflow-hidden"
        style={{
          zIndex: 1,
          maxHeight: stage >= 5 ? 80 : 0,
          opacity: stage >= 5 ? 1 : 0,
          transform: stage >= 5 ? "none" : "translateY(calc(var(--u) * 8))",
          marginTop: stage >= 5 ? 12 : 0,
          transition: `opacity 500ms ease, transform 500ms ${EASE}, max-height 600ms ${EASE}, margin-top 600ms ${EASE}`,
        }}
        aria-hidden={stage < 5}
      >
        <button
          onClick={downloadIcs}
          tabIndex={stage >= 5 ? 0 : -1}
          className="btn-gold"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
          Add to Calendar
        </button>
      </div>
    </section>
  );
}
