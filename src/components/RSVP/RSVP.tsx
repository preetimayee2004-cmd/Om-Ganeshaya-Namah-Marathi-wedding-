import { useEffect, useRef, useState } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { readPreviousRsvp, rsvpLimits, submitRsvp, validateRsvp, type RsvpInput } from "../../lib/rsvp";
import { useInView } from "../Layout/Reveal";
import Parrot, { PARROT_ASPECT, PERCHED_FOOT_Y } from "../Parrot/Parrot";
import Branch, { BRANCH_PERCH_Y, BRANCH_VB } from "./Branch";

/**
 * RSVP: "Dear <guest>," over a watercolour branch with two parrots perched far apart.
 * Accepting: the parrots glide along the branch and meet in the middle (1200 ms), a heart is drawn
 * between them (600 ms), the confirmation fades in (600 ms), then Add to Calendar appears.
 */

// ===== timing (ms after "Accept Invitation") =====
const T_GLIDE = 1200;
const T_HEART = 600;
const T_TEXT = 600;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GLIDE_EASE = "cubic-bezier(0.45, 0.05, 0.25, 1)";
const SERIF = "'Cormorant Garamond', Georgia, serif";

// ===== scene geometry (in the branch's 350 x 170 space) =====
const PW = 91; // parrot width
const PH = PW * PARROT_ASPECT.perched;
const P_LEFT = 7; // distance of each parrot from its side
const P_TOP = BRANCH_PERCH_Y - PH * PERCHED_FOOT_Y; // feet on the branch
const BEAK_X = 99 / 120; // beak tip, as a fraction of the drawing width
const MID = BRANCH_VB.w / 2;
const GAP = 9; // the beaks stop this far from the centre
const GLIDE = ((MID - GAP - (P_LEFT + BEAK_X * PW)) / PW) * 100; // % of the parrot's own width
const HEART = { cx: MID, cy: 40, w: 34 }; // just above the two beaks
const pctX = (v: number) => `${((v / BRANCH_VB.w) * 100).toFixed(3)}%`;
const pctY = (v: number) => `${((v / BRANCH_VB.h) * 100).toFixed(3)}%`;
const HEART_PATH =
  "M12 20.5s-8.3-5.2-10.4-10.2C.1 5.9 3.6 1.7 7.7 2.7c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1 7.6 3.2 6.1 7.6C20.3 15.3 12 20.5 12 20.5Z";

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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** envelope-only.png is a 720 x 540 crop of the 1200 x 896 artwork taken at (240, 200); the wax seal
 *  cut-out (seal-piece.png, 200 x 390) sits at (500, 340) in that artwork */
const ENV = { ox: 240, oy: 200, w: 720, h: 540, seal: { x: 500, y: 340, w: 200 } };

export default function RSVP(_props: { inScene?: boolean } = {}) {
  const { guestName, isPersonalised } = useGuest();
  const [headRef, headSeen] = useInView<HTMLDivElement>(0.2);
  const [sceneRef, sceneSeen] = useInView<HTMLDivElement>(0.3);
  const sending = useRef(false);
  const timers = useRef<number[]>([]);

  // 0 waiting | 1 parrots gliding | 2 heart drawn | 3 message shown | 4 calendar shown
  // a guest who already accepted (in this browser) sees the joined state directly
  const [stage, setStage] = useState(() => (readPreviousRsvp()?.attending === "yes" ? 4 : 0));
  const [played, setPlayed] = useState(false); // true when this visit plays the animation
  const [error, setError] = useState(false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const accept = async () => {
    if (sending.current || stage !== 0) return;
    const payload: RsvpInput = {
      name: (isPersonalised && guestName.trim().length >= 2 ? guestName : "Guest").slice(0, rsvpLimits.nameMax),
      attending: "yes",
      guests: 1,
      phone: "",
      message: "",
    };
    if (Object.keys(validateRsvp(payload)).length > 0) {
      setError(true);
      return;
    }
    sending.current = true;
    setError(false);
    if (reducedMotion()) setStage(4);
    else {
      setPlayed(true);
      setStage(1); // parrots glide toward each other
      later(() => setStage(2), T_GLIDE); // they meet: the heart is drawn
      later(() => setStage(3), T_GLIDE + T_HEART); // confirmation fades in
      later(() => setStage(4), T_GLIDE + T_HEART + T_TEXT); // Add to Calendar
    }
    try {
      await submitRsvp(payload);
    } catch {
      // saving failed: the parrots return to their places so the guest can retry
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setStage(0);
      setError(true);
    } finally {
      sending.current = false;
    }
  };

  const met = stage >= 1;
  const heart = stage >= 2;
  const textShown = stage >= 3;
  const calShown = stage >= 4;
  const [envRef, envSeen] = useInView<HTMLDivElement>(0.35);

  const parrot = (side: "l" | "r") => {
    const left = side === "l";
    return (
      <div
        className="absolute"
        style={{
          [left ? "left" : "right"]: pctX(P_LEFT),
          top: pctY(P_TOP),
          width: pctX(PW),
          zIndex: 2,
          opacity: sceneSeen ? 1 : 0,
          transform: sceneSeen ? "none" : `translateX(calc(var(--u) * ${left ? -24 : 24}))`,
          transition: `opacity 900ms ease 650ms, transform 900ms ${EASE} 650ms`,
        }}
      >
        {/* glide along the branch (x) ... */}
        <div
          style={{
            transform: met ? `translateX(${left ? GLIDE : -GLIDE}%)` : "none",
            transition: `transform ${T_GLIDE}ms ${GLIDE_EASE}`,
          }}
        >
          {/* ... with one soft lift in the middle (y), no bounce */}
          <div style={{ animation: played && met ? `rsv-lift ${T_GLIDE}ms ease-in-out both` : undefined }}>
            <Parrot facing={left ? "right" : "left"} pose="perched" carrying={left ? "none" : "marigold"} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="rsv-root relative overflow-x-clip px-5 py-8 text-[#4a1a16]">
      <style>{`
        @keyframes rsv-seal { 0% { transform: scale(1) rotate(0) } 35% { transform: scale(1.08) rotate(-3deg) } 65% { transform: scale(.97) rotate(2deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes rsv-lift { 0% { transform: translateY(0) } 50% { transform: translateY(calc(var(--u) * -7)) } 100% { transform: translateY(0) } }
        @keyframes rsv-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes rsv-fill { from { fill-opacity: 0 } to { fill-opacity: 0.92 } }
        @keyframes rsv-glow { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) {
          .rsv-root, .rsv-root * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* heading: Dear <guest>, + the invitation to respond */}
      <div
        ref={headRef}
        className="relative mx-auto max-w-[360px] text-center"
        style={{
          opacity: headSeen ? 1 : 0,
          transform: headSeen ? "none" : "translateY(calc(var(--u) * 14))",
          transition: `opacity 900ms ease, transform 900ms ${EASE}`,
        }}
      >
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.38em] text-[#b8862f]">R.S.V.P.</p>
        {isPersonalised && (
          <p className="mt-2 text-[22px] italic leading-tight text-[#7a1420]" style={{ fontFamily: SERIF }}>
            Dear <span className="guest-name not-italic">{guestName}</span>,
          </p>
        )}
        <h2 id="rsvp-title" className="mt-1 font-script text-[46px] font-normal leading-[1.1] text-[#6d0f1b]">
          Your Presence,
          <br />
          Our Blessing
        </h2>
        <svg viewBox="0 0 300 16" className="mx-auto mt-1 block h-[14px] w-[250px] text-[#b8862f]" fill="none" aria-hidden>
          <path d="M6 8h112M182 8h112" stroke="currentColor" strokeWidth=".9" />
          <path d="M126 8l3.2-3.2L132.4 8l-3.2 3.2zM167.6 8l3.2-3.2L174 8l-3.2 3.2z" fill="currentColor" />
          <path d="M150 1.5l4.6 6.5-4.6 6.5-4.6-6.5z" fill="currentColor" />
          <path d="M143 8l4-2.4 3 2.4-3 2.4zM157 8l-4-2.4-3 2.4 3 2.4z" fill="currentColor" opacity=".75" />
        </svg>
      </div>

      {/* the red envelope (85% of the column): its seal gives and a card slides up from behind it */}
      <div ref={envRef} className="relative mx-auto mt-2 w-[85%] max-w-[330px] select-none" style={{ paddingTop: "30%" }}>
        <div className="relative" style={{ aspectRatio: `${ENV.w} / ${ENV.h}` }}>
          <div
            className="absolute left-[11%] right-[11%] top-[7%] z-0 rounded-[10px] px-4 py-4 text-center"
            style={{
              background: "linear-gradient(180deg, #fffaf0 0%, #f8ecd2 100%)",
              border: "calc(var(--u) * 1) solid #d9b25a",
              boxShadow: "inset 0 0 0 calc(var(--u) * 3) #fffaf0, inset 0 0 0 calc(var(--u) * 4) rgba(217,178,90,0.5), 0 calc(var(--u) * -4) calc(var(--u) * 14) rgba(90,30,10,0.18)",
              transform: envSeen ? "translateY(-100%)" : "translateY(0)",
              transition: `transform 1300ms ${EASE} 700ms`,
            }}
          >
            <p className="text-[18px] font-semibold leading-[1.3] text-[#7a1420]" style={{ fontFamily: SERIF }}>
              Kindly let us know if you will be joining us for this special occasion.
            </p>
          </div>
          <img src="/rsvp/envelope-only.png" alt="" draggable={false} className="absolute inset-0 z-[1] h-full w-full" />
          <img
            src="/rsvp/seal-piece.png"
            alt=""
            draggable={false}
            className="absolute z-[2]"
            style={{
              left: `${((ENV.seal.x - ENV.ox) / ENV.w) * 100}%`,
              top: `${((ENV.seal.y - ENV.oy) / ENV.h) * 100}%`,
              width: `${(ENV.seal.w / ENV.w) * 100}%`,
              transformOrigin: "50% 25%",
              animation: envSeen ? `rsv-seal 900ms ${EASE} 200ms both` : undefined,
            }}
          />
        </div>
      </div>

      {/* the branch with the two parrots */}
      <div
        ref={sceneRef}
        className="relative mx-auto mt-4 w-full max-w-[380px] select-none"
        style={{ aspectRatio: `${BRANCH_VB.w} / ${BRANCH_VB.h}` }}
        aria-hidden
      >
        <Branch drawn={sceneSeen} />
        {parrot("l")}
        {parrot("r")}

        {/* the heart that forms between them */}
        {heart && (
          <div
            className="absolute"
            style={{
              left: pctX(HEART.cx - HEART.w / 2),
              top: pctY(HEART.cy - (HEART.w * 22) / 24 / 2),
              width: pctX(HEART.w),
              zIndex: 3,
            }}
          >
            <span
              className="absolute inset-[-40%] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(226,178,79,0.35) 0%, rgba(226,178,79,0) 65%)",
                animation: played ? `rsv-glow ${T_HEART}ms ease-out both` : undefined,
              }}
            />
            <svg viewBox="0 0 24 22" className="relative block h-auto w-full overflow-visible">
              <defs>
                <linearGradient id="rsv-heart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#c23a4a" />
                  <stop offset="1" stopColor="#7a1420" />
                </linearGradient>
              </defs>
              <path
                d={HEART_PATH}
                pathLength={1}
                fill="url(#rsv-heart-fill)"
                stroke="#b8862f"
                strokeWidth="1"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 0,
                  fillOpacity: 0.92,
                  animation: played ? `rsv-draw ${T_HEART}ms ease-in-out both, rsv-fill ${T_HEART * 0.6}ms ease ${T_HEART * 0.4}ms both` : undefined,
                }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Accept Invitation (folds away once accepted; comes back with an error to retry) */}
      <div
        className="grid"
        style={{
          gridTemplateRows: met ? "0fr" : "1fr",
          opacity: met ? 0 : sceneSeen ? 1 : 0,
          transition: `grid-template-rows 600ms ${EASE}, opacity ${met ? "350ms ease" : "600ms ease 900ms"}`,
        }}
      >
        <div className="flex min-h-0 flex-col items-center overflow-hidden px-1 pb-2 pt-4">
          <button
            type="button"
            onClick={accept}
            disabled={met}
            tabIndex={met ? -1 : 0}
            className="btn-gold min-h-[50px] px-9 text-[16px] tracking-[0.16em]"
          >
            <svg viewBox="0 0 24 22" className="h-[16px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d={HEART_PATH} />
            </svg>
            Accept Invitation
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center font-body text-sm text-[#6d0f1b]">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* confirmation + Add to Calendar */}
      <div
        className="grid"
        style={{
          gridTemplateRows: textShown ? "1fr" : "0fr",
          transition: played ? `grid-template-rows ${T_TEXT}ms ${EASE}` : undefined,
        }}
        aria-hidden={!textShown}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            role="status"
            className="mx-auto flex max-w-[340px] flex-col items-center pt-2 text-center"
            style={{
              opacity: textShown ? 1 : 0,
              transform: textShown ? "none" : "translateY(calc(var(--u) * 8))",
              transition: played ? `opacity ${T_TEXT}ms ease, transform ${T_TEXT}ms ${EASE}` : undefined,
            }}
          >
            {textShown && (
              <>
                <p className="font-script text-[40px] leading-[1.1] text-[#6d0f1b]">Yay! You&apos;re coming ♡</p>
                <span className="mt-2 block h-px w-[170px] bg-gradient-to-r from-transparent via-[#c9963a] to-transparent" aria-hidden />
                <p className="mt-2 text-[20px] font-semibold italic leading-[1.3] text-[#7a1420]" style={{ fontFamily: SERIF }}>
                  We can&apos;t wait to celebrate this beautiful day with you!
                </p>
              </>
            )}
          </div>
          <div
            className="flex justify-center pb-1 pt-5"
            style={{
              opacity: calShown ? 1 : 0,
              transform: calShown ? "none" : "translateY(calc(var(--u) * 8))",
              transition: played ? `opacity 500ms ease, transform 500ms ${EASE}` : undefined,
            }}
          >
            <button type="button" onClick={downloadIcs} tabIndex={calShown ? 0 : -1} className="btn-gold min-h-[44px] px-7 text-[14px]">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
              </svg>
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
