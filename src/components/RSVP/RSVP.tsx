import { useEffect, useMemo, useRef, useState } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { readPreviousRsvp, submitRsvp } from "../../lib/rsvp";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Royal envelope RSVP.
 * Everything inside the envelope box is positioned in the artwork's own pixel space (715 x 607) and converted to %.
 *  - /rsvp/envelope-clean.jpg : the envelope with the wax seal + tassel painted out (base layer)
 *  - /rsvp/envelope.jpg       : the untouched artwork; the seal / tassel are cut out of it as overlays that break away
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
const STAGE_ASPECT = `${W} / ${H + 330}`;

// ===== timing (ms after "Joyfully Accept") =====
const T_SEAL = 600; // seal breaks
const T_FLAP = 1100; // flap opens
const T_CARD = 800; // card slides up
const T_MSG = 600; // message reveal

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
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
    `DESCRIPTION:${esc("We are delighted to have you join our celebration.")}`,
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
  const stageRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const previous = useMemo(readPreviousRsvp, []);
  const alreadyYes = previous?.attending === "yes";

  const [entered, setEntered] = useState(false);
  const [revealDone, setRevealDone] = useState(alreadyYes);
  // 0 closed | 1 seal breaking | 2 flap opening | 3 card rising | 4 message shown
  const [stage, setStage] = useState(alreadyYes ? 4 : 0);
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

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const accept = async () => {
    if (sending.current || stage !== 0) return;
    sending.current = true;
    setError(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setStage(4);
    else {
      setStage(1);
      later(() => setStage(2), T_SEAL);
      later(() => setStage(3), T_SEAL + 450 + T_FLAP * 0.55);
      later(() => setStage(4), T_SEAL + 450 + T_FLAP * 0.55 + T_CARD);
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
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
        const d = 26 + Math.random() * 34;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d + 8, rot: Math.random() * 360, size: 2 + Math.random() * 3, delay: Math.random() * 120 };
      }),
    [],
  );

  const sealOpen = stage >= 1;
  const flapOpen = stage >= 2;
  const flapBack = stage >= 3; // once the flap has passed upright it lies behind the card
  const cardUp = stage >= 3;
  const msgShown = stage >= 4;
  const gone = (on: boolean): React.CSSProperties => ({ opacity: on ? 0 : 1 });

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="px-5 py-6 text-[#4b0f16]">
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
        style={{ aspectRatio: STAGE_ASPECT, containerType: "inline-size" }}
      >
        {/* heading */}
        <h2
          id="rsvp-title"
          className="absolute inset-x-0 text-center font-script font-normal leading-[1.05] text-[#6d0f1b]"
          style={{
            top: "3%",
            fontSize: "11.5cqw",
            opacity: entered && stage === 0 ? 1 : 0,
            transform: entered && stage === 0 ? "none" : "translateY(10px)",
            transition: stage === 0 ? `opacity 1200ms ${EASE} 250ms, transform 1200ms ${EASE} 250ms` : `opacity 500ms ${EASE}`,
          }}
        >
          <span className="block">Your Presence,</span>
          <span className="block" style={{ transitionDelay: "400ms" }}>Our Blessing</span>
        </h2>

        {/* envelope rises into place with a slight 3D tilt */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{
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

                {/* inside of the envelope (shows once the flap lifts) */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: FLAP_INNER, background: "linear-gradient(180deg, #2c0509 0%, #4b0a14 55%, #6a1020 100%)", zIndex: 1 }}
                />

                {/* invitation card slides up out of the pocket */}
                <div className="pointer-events-none absolute inset-0" style={{ clipPath: CARD_CLIP, zIndex: 2 }}>
                  <div
                    className="absolute flex flex-col items-center rounded-[10px] text-center"
                    style={{
                      left: "21%",
                      width: "58%",
                      top: "-37%",
                      height: "110%",
                      transform: cardUp ? "translateY(0)" : "translateY(96%)",
                      transition: `transform ${T_CARD}ms ${EASE}`,
                      background: "linear-gradient(170deg, #fffaf0 0%, #f9efd9 60%, #f1e2c0 100%)",
                      border: "2px solid #d4a53c",
                      boxShadow: "inset 0 0 0 5px #fbf3df, inset 0 0 0 6px rgba(212,165,60,0.7), 0 6px 18px rgba(40,10,5,0.35)",
                      padding: "0 7%",
                      containerType: "inline-size",
                    }}
                  >
                    {/* gold shimmer, plays once */}
                    {msgShown && (
                      <span
                        aria-hidden
                        className="absolute inset-0 overflow-hidden rounded-[8px]"
                        style={{ pointerEvents: "none" }}
                      >
                        <span
                          className="absolute inset-y-0 w-1/2"
                          style={{
                            background: "linear-gradient(105deg, transparent, rgba(255,226,140,0.55), transparent)",
                            animation: "rsvp-card-shine 1400ms 200ms ease-out 1 both",
                          }}
                        />
                      </span>
                    )}
                    <div
                      className="flex flex-col items-center justify-center"
                      style={{
                        height: "50%",
                        opacity: msgShown ? 1 : 0,
                        transform: msgShown ? "none" : "translateY(10px)",
                        transition: `opacity ${T_MSG}ms ease, transform ${T_MSG}ms ${EASE}`,
                      }}
                    >
                      <svg viewBox="0 0 40 28" className="h-[7.5cqw] w-[11cqw] text-[#b98a2e]" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                        <path d="M20 3c4 5 4 12 0 17-4-5-4-12 0-17Z" />
                        <path d="M20 20c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
                        <path d="M6 24c6 3 22 3 28 0" />
                      </svg>
                      <p
                        role="status"
                        className="mt-[3cqw] italic leading-[1.25] text-[#6d0f1b]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: "9.6cqw" }}
                      >
                        We are delighted to have you join our celebration.
                      </p>
                      <span className="my-[3.5cqw] block h-px w-[40cqw] bg-gradient-to-r from-transparent via-[#c9992f] to-transparent" />
                      <button
                        onClick={downloadIcs}
                        tabIndex={msgShown ? 0 : -1}
                        className="pointer-events-auto inline-flex items-center gap-[2cqw] rounded-full font-body font-bold uppercase"
                        style={{
                          fontSize: "4.5cqw",
                          letterSpacing: "0.16em",
                          padding: "2.6cqw 6cqw",
                          background: "linear-gradient(180deg, #7A3B24, #5A2614)",
                          color: "#F6DFA2",
                          border: "1.5px solid #D4A53C",
                          boxShadow: "0 1px 4px rgba(60,30,10,0.35)",
                        }}
                      >
                        <svg viewBox="0 0 16 16" className="h-[4.6cqw] w-[4.6cqw]" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                          <rect x="2" y="3" width="12" height="11" rx="1.5" />
                          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
                        </svg>
                        Add to Calendar
                      </button>
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
                      background:
                        "linear-gradient(180deg, #f3e2bd 0%, #e6c98c 100%)",
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
                {/* tiny gold fragments */}
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

      {/* Joyfully Accept: rounded-corner red and gold button (no decline) */}
      <div
        className="mx-auto flex flex-col items-center overflow-hidden"
        style={{
          maxHeight: stage === 0 ? 120 : 0,
          opacity: stage === 0 && entered ? 1 : 0,
          marginTop: stage === 0 ? 20 : 0,
          transition: `opacity 500ms ease ${stage === 0 ? "600ms" : "0ms"}, max-height 700ms ${EASE} 200ms, margin-top 700ms ${EASE} 200ms`,
        }}
      >
        <button
          onClick={accept}
          disabled={stage !== 0}
          className="relative inline-flex min-h-[56px] min-w-[236px] items-center justify-center gap-3 rounded-2xl px-8 transition active:scale-[0.97]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,160,150,0.28), transparent 70%), linear-gradient(180deg, #a3162b 0%, #7d0f20 100%)",
            border: "2px solid #d9b25a",
            boxShadow: "inset 0 0 0 3px #7d0f20, inset 0 0 0 4px rgba(217,178,90,0.75), 0 6px 16px rgba(60,5,15,0.35)",
          }}
        >
          <svg viewBox="0 0 40 28" className="h-7 w-9 text-[#f3d98b]" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
            <path d="M20 3c4 5 4 12 0 17-4-5-4-12 0-17Z" />
            <path d="M20 20c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
            <path d="M6 24c6 3 22 3 28 0" />
          </svg>
          <span className="text-[24px] font-semibold leading-none text-[#f9e7b0]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Joyfully Accept
          </span>
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center font-body text-sm text-[#6d0f1b]">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  );
}
