import { useEffect, useMemo, useRef, useState } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { submitRsvp } from "../../lib/rsvp";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Royal envelope RSVP.
 * Everything inside the envelope box is positioned in the artwork's own pixel space (715 x 607) and converted to %.
 *  - /rsvp/envelope-clean.jpg : the envelope with the wax seal + tassel painted out (base layer)
 *  - /rsvp/envelope.jpg       : the untouched artwork; the seal / tassel are cut out of it as overlays that break away
 *  - /rsvp/couple.png         : the illustrated bride and groom (rises out of the envelope together with the card)
 */
const W = 715;
const H = 607;
const px = (x: number) => `${((x / W) * 100).toFixed(3)}%`;
const py = (y: number) => `${((y / H) * 100).toFixed(3)}%`;
const FLAP: [number, number][] = [[88, 185], [600, 185], [344, 382]];
const FLAP_POLY = `polygon(${FLAP.map(([x, y]) => `${px(x)} ${py(y)}`).join(", ")})`;
const FLAP_INNER = `polygon(${[[91, 187], [597, 187], [344, 378]].map(([x, y]) => `${px(x)} ${py(y)}`).join(", ")})`;
// the card is only visible above the envelope and inside the open flap triangle (it sits in the pocket)
const CARD_CLIP = `polygon(-60% -250%, 160% -250%, 160% ${py(185)}, ${px(600)} ${py(185)}, ${px(344)} ${py(382)}, ${px(88)} ${py(185)}, -60% ${py(185)})`;
const SEAL = { x: 344, y: 341, r: 58 };

// ===== layout (in container-width units, cqw) =====
const SPACE_CLOSED = 25; // heading zone above the envelope
const SPACE_OPEN = 62; // room for the couple + card once the envelope is open
const ENV_SCALE = 112; // envelope is shown ~12% larger than the column

// ===== timing (ms after "Joyfully Accept"), about 2.7 s in total =====
const T_SEAL = 450; // seal breaks, then the flap opens
const T_FLAP = 800; // flap opens
const T_CARD = 700; // card + couple rise
const T_TEXT = 500; // headline + message fade in
const T_CAL = 2250; // calendar button appears last

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const RADIUS = 12; // one border radius for cards and buttons
const MASK_EDGE =
  "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)";

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

  // section entry (fade in, envelope rises, frame revealed through a mask)
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
        name: isPersonalised && guestName.trim().length >= 2 ? guestName : "Guest",
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
                top: -30,
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
      {/* clip paths for the seal pieces (objectBoundingBox, artwork coordinates) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="rsvp-seal-l" clipPathUnits="objectBoundingBox">
            <path d={`M${SEAL.x / W} ${(SEAL.y - SEAL.r) / H} A${SEAL.r / W} ${SEAL.r / H} 0 0 0 ${SEAL.x / W} ${(SEAL.y + SEAL.r) / H} Z`} />
          </clipPath>
          <clipPath id="rsvp-seal-r" clipPathUnits="objectBoundingBox">
            <path d={`M${SEAL.x / W} ${(SEAL.y - SEAL.r) / H} A${SEAL.r / W} ${SEAL.r / H} 0 0 1 ${SEAL.x / W} ${(SEAL.y + SEAL.r) / H} Z`} />
          </clipPath>
          <clipPath id="rsvp-seal-c" clipPathUnits="objectBoundingBox">
            <ellipse cx={SEAL.x / W} cy={SEAL.y / H} rx={SEAL.r / W} ry={SEAL.r / H} />
          </clipPath>
          <clipPath id="rsvp-tassel" clipPathUnits="objectBoundingBox">
            <rect x={306 / W} y={392 / H} width={76 / W} height={108 / H} />
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
            className="absolute inset-x-0 top-0 text-center font-script font-normal leading-[1.02] text-[#6d0f1b]"
            style={{
              fontSize: "10.5cqw",
              opacity: entered && stage === 0 ? 1 : 0,
              transform: entered && stage === 0 ? "none" : "translateY(10px)",
              transition: stage === 0 ? `opacity 1200ms ${EASE} 250ms, transform 1200ms ${EASE} 250ms` : `opacity 350ms ${EASE}`,
            }}
          >
            <span className="block">Your Presence,</span>
            <span className="block">Our Blessing</span>
            <svg viewBox="0 0 120 10" className="mx-auto mt-[1.6cqw] h-[2.4cqw] w-[26cqw] text-[#b98a2e]" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden>
              <path d="M2 5h44M74 5h44" strokeWidth=".9" />
              <path d="M60 .8l4.2 4.2L60 9.2 55.8 5z" fill="currentColor" strokeWidth=".4" />
            </svg>
          </h2>
        </div>

        {/* envelope: larger than the column, rises into place with a slight 3D tilt */}
        <div
          className="relative"
          style={{
            width: `${ENV_SCALE}%`,
            marginLeft: `${(100 - ENV_SCALE) / 2}%`,
            marginTop: "-3cqw",
            aspectRatio: `${W} / ${H}`,
            opacity: entered ? 1 : 0,
            transform: entered ? "none" : "translateY(70px) perspective(900px) rotateX(18deg)",
            transformOrigin: "50% 100%",
            transition: `opacity 1200ms ease, transform 1000ms ${EASE}`,
          }}
        >
          <div className="h-full w-full" style={{ animation: stage === 0 && revealDone ? "rsvp-float 7s ease-in-out infinite alternate" : undefined }}>
            {/* floral frame revealed through a soft mask while entering */}
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
              <div className="relative h-full w-full" style={{ perspective: "1400px", perspectiveOrigin: "50% 35%" }}>
                {/* base: envelope with the seal and tassel removed */}
                <img
                  src="/rsvp/envelope-clean.jpg"
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    WebkitMaskImage: MASK_EDGE,
                    maskImage: MASK_EDGE,
                    WebkitMaskComposite: "source-in",
                    maskComposite: "intersect",
                  }}
                />

                {/* separation: a soft shadow around the envelope so the floral arch never merges into it */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    left: px(86),
                    top: py(183),
                    width: `${((516 / W) * 100).toFixed(3)}%`,
                    height: `${((320 / H) * 100).toFixed(3)}%`,
                    borderRadius: 3,
                    boxShadow: "0 10px 22px rgba(45,8,14,0.5), 0 2px 6px rgba(45,8,14,0.4), 0 0 0 1px rgba(60,12,18,0.35)",
                  }}
                />

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
                      left: "21%",
                      width: "58%",
                      top: py(-28),
                      height: py(520),
                      transform: cardUp ? "translateY(0)" : "translateY(112%)",
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
                        border: "2px solid #d4a53c",
                        boxShadow: "inset 0 0 0 4px #fbf3df, inset 0 0 0 5px rgba(212,165,60,0.7), 0 6px 16px rgba(40,10,5,0.35)",
                      }}
                    />
                    {/* the couple stands on the card, rising out of the envelope with it */}
                    <div className="absolute" style={{ left: "16.5%", width: "67%", top: "-86cqw" }}>
                      <img
                        src="/rsvp/couple.png"
                        alt="The bride and groom waving"
                        draggable={false}
                        className="block w-full" loading="lazy" decoding="async"
                        style={{
                          transformOrigin: "50% 100%",
                          animation: textShown ? "rsvp-wave 2.8s ease-in-out infinite" : undefined,
                          WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                          maskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                          filter: "drop-shadow(0 4px 6px rgba(80,30,20,0.28))",
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
                        transform: textShown ? "none" : "translateY(8px)",
                        transition: `opacity ${T_TEXT}ms ease, transform ${T_TEXT}ms ${EASE}`,
                      }}
                    >
                      <p role="status" className="font-script leading-none text-[#6d0f1b]" style={{ fontSize: "10.5cqw", whiteSpace: "nowrap" }}>
                        Yay! You&apos;re Coming! ♡
                      </p>
                      <p className="mt-[3cqw] font-body leading-snug text-[#4b0f16]/90" style={{ fontSize: "5.6cqw" }}>
                        We can&apos;t wait to celebrate this beautiful day with you!
                      </p>
                    </div>
                  </div>
                </div>

                {/* the flap: front = artwork, back = lining */}
                <div
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: `50% ${py(185)}`,
                    transform: flapOpen ? "rotateX(180deg)" : "rotateX(0deg)",
                    transition: `transform ${T_FLAP}ms cubic-bezier(0.55, 0.05, 0.25, 1)`,
                    zIndex: flapBack ? 1 : 3,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src="/rsvp/envelope-clean.jpg"
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
                      transformOrigin: `${px(344)} 50%`,
                      background: "linear-gradient(180deg, #f3e2bd 0%, #e6c98c 100%)",
                      boxShadow: "inset 0 0 0 3px #d4a53c",
                    }}
                  />
                </div>

                {/* wax seal (two halves) and tassel: pixel-exact cut-outs of the artwork */}
                {([
                  ["rsvp-seal-l", "translate(-14px, 8px) rotate(-16deg)"],
                  ["rsvp-seal-r", "translate(14px, 10px) rotate(18deg)"],
                ] as const).map(([id, move]) => (
                  <img
                    key={id}
                    src="/rsvp/envelope.jpg"
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{
                      clipPath: `url(#${id})`,
                      zIndex: 6,
                      transformOrigin: `${px(SEAL.x)} ${py(SEAL.y)}`,
                      transform: sealOpen ? move : "none",
                      opacity: sealOpen ? 0 : 1,
                      transition: `transform ${T_SEAL}ms ${EASE}, opacity ${T_SEAL}ms ease ${T_SEAL * 0.2}ms`,
                    }}
                  />
                ))}
                <img
                  src="/rsvp/envelope.jpg"
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{
                    clipPath: "url(#rsvp-tassel)",
                    zIndex: 6,
                    transform: sealOpen ? "translateY(16px)" : "none",
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

      {/* Joyfully Accept: slim maroon and antique-gold button (compresses, then folds away) */}
      <div
        className="relative mx-auto flex flex-col items-center overflow-hidden"
        style={{
          zIndex: 1,
          maxHeight: stage === 0 ? 90 : 0,
          opacity: stage === 0 && entered ? 1 : 0,
          marginTop: stage === 0 ? 0 : 0,
          transition: `opacity ${stage === 0 ? "500ms ease 600ms" : "350ms ease 120ms"}, max-height 600ms ${EASE} 300ms, margin-top 600ms ${EASE} 300ms`,
        }}
      >
        <button
          onClick={accept}
          disabled={stage !== 0}
          className="relative inline-flex min-h-[44px] min-w-[210px] items-center justify-center gap-2.5 px-6 transition active:scale-[0.97]"
          style={{
            borderRadius: RADIUS,
            background: "linear-gradient(180deg, #8f1427 0%, #6d0f1b 100%)",
            border: "1.5px solid #d4a53c",
            boxShadow: "inset 0 0 0 2px #6d0f1b, inset 0 0 0 3px rgba(217,178,90,0.55), 0 3px 8px rgba(60,5,15,0.3)",
            transform: stage >= 1 ? "scale(0.9)" : "none",
            transition: `transform 280ms ${EASE}`,
          }}
        >
          <svg viewBox="0 0 40 28" className="h-5 w-7 text-[#f3d98b]" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <path d="M20 3c4 5 4 12 0 17-4-5-4-12 0-17Z" />
            <path d="M20 20c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
            <path d="M6 24c6 3 22 3 28 0" />
          </svg>
          <span className="text-[19px] font-semibold leading-none tracking-wide text-[#f9e7b0]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Joyfully Accept
          </span>
        </button>
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
          transform: stage >= 5 ? "none" : "translateY(8px)",
          marginTop: stage >= 5 ? 12 : 0,
          transition: `opacity 500ms ease, transform 500ms ${EASE}, max-height 600ms ${EASE}, margin-top 600ms ${EASE}`,
        }}
        aria-hidden={stage < 5}
      >
        <button
          onClick={downloadIcs}
          tabIndex={stage >= 5 ? 0 : -1}
          className="inline-flex min-h-[44px] items-center gap-2 px-5 font-body text-[11px] font-bold uppercase tracking-[0.18em] transition active:scale-95"
          style={{
            borderRadius: RADIUS,
            background: "linear-gradient(180deg, #7A3B24, #5A2614)",
            color: "#F6DFA2",
            border: "1.5px solid #D4A53C",
            boxShadow: "0 2px 6px rgba(60,30,10,0.35)",
          }}
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
