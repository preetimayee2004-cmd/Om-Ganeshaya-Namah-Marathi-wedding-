import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { apiUrl } from "../../lib/api";
import { fetchApprovedBlessings, isDuplicate, limits, submitBlessing, validate } from "../../lib/blessings";
import { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";
import Parrot from "../Parrot/Parrot";

/**
 * Wishing wall: "parrot-delivered wishes".
 * The latest three blessings are written on an aged parchment scroll (deckled edges, gilded rollers);
 * "View all wishes" unrolls the rest. Sending a blessing: a parrot flies in with a folded note (1200 ms arc),
 * drops it onto the scroll (450 ms), the note unfurls as the newest entry (700 ms) while the parrot flies off,
 * then the confirmation appears.
 */

const WALL_MAX = 3; // only the latest three wishes are shown on the scroll at first
const INK = "#4a1a16";
const MAROON = "#6d0f1b";
const GOLD = "#b8862f";
const GOLD_LABEL = "#a8741a";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// ===== delivery timing (ms after a successful send) =====
const T_FLY = 1200;
const T_DROP = 450;
const T_EXIT = 900;
const T_UNFURL = 700;

type Wish = { name: string; message: string; fresh?: boolean };
type Flight = { id: number; phase: "fly" | "drop" | "exit" };

const u = (n: number) => `calc(var(--u) * ${n})`;

/** deckled (torn) left and right paper edges, deterministic */
const DECKLE = (() => {
  let s = 17;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 56;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${(rnd() * 1.7).toFixed(2)}% ${((i / n) * 100).toFixed(2)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(100 - rnd() * 1.7).toFixed(2)}% ${((i / n) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
})();

const PAPER_BG = [
  "radial-gradient(ellipse at 22% 14%, rgba(255,251,238,0.75) 0%, rgba(255,251,238,0) 46%)",
  "radial-gradient(ellipse at 78% 68%, rgba(186,134,60,0.14) 0%, rgba(186,134,60,0) 42%)",
  "radial-gradient(circle at 10% 84%, rgba(150,98,36,0.13) 0%, rgba(150,98,36,0) 20%)",
  "radial-gradient(circle at 90% 24%, rgba(150,98,36,0.1) 0%, rgba(150,98,36,0) 16%)",
  "radial-gradient(circle at 60% 40%, rgba(150,98,36,0.06) 0%, rgba(150,98,36,0) 12%)",
  "linear-gradient(180deg, #f8ead0 0%, #f5e3c1 50%, #efd8ad 100%)",
].join(", ");

const ROD = "linear-gradient(180deg, #f3d995 0%, #d4ae5e 26%, #a87628 55%, #6b4519 80%, #b8862f 100%)";

function Roller() {
  return (
    <div className="relative z-[2] h-[18px] w-full" aria-hidden>
      <div className="absolute inset-y-0 left-[10px] right-[10px] rounded-full" style={{ background: ROD, boxShadow: `0 ${u(3)} ${u(6)} rgba(70,40,10,0.35)` }} />
      {(["left-0", "right-0"] as const).map((side) => (
        <span
          key={side}
          className={`absolute top-1/2 h-[24px] w-[24px] -translate-y-1/2 rounded-full ${side}`}
          style={{
            background: "radial-gradient(circle at 35% 30%, #f8e3a6 0%, #c9963a 45%, #7a5220 100%)",
            boxShadow: `inset 0 0 0 ${u(2.5)} rgba(122,20,32,0.45), 0 ${u(2)} ${u(4)} rgba(70,40,10,0.35)`,
          }}
        />
      ))}
    </div>
  );
}

function Flourish() {
  return (
    <svg viewBox="0 0 120 10" className="mx-auto my-3 block h-[8px] w-[96px]" fill="none" aria-hidden>
      <path d="M4 5C20 1 34 9 52 5M68 5C86 1 100 9 116 5" stroke={GOLD} strokeOpacity=".7" strokeWidth=".9" strokeLinecap="round" />
      <path d="M60 1.5l3.2 3.5-3.2 3.5-3.2-3.5z" fill={GOLD} fillOpacity=".8" />
    </svg>
  );
}

function Entry({ w, i, live }: { w: Wish; i: number; live: boolean }) {
  return (
    <li className={w.fresh ? "wsh-fresh" : undefined}>
      <div className="min-h-0 overflow-hidden">
        {i > 0 && <Flourish />}
        <div className={w.fresh ? "wsh-ink" : undefined}>
        <div className="relative px-1" style={{ transform: `rotate(${i % 2 ? 0.35 : -0.4}deg)` }}>
          {w.fresh && <span className="wsh-wash pointer-events-none absolute inset-0 rounded-md" aria-hidden />}
          <p className="relative text-[19px] italic leading-[1.42]" style={{ fontFamily: SERIF, color: INK }}>
            &ldquo;{w.message}&rdquo;
          </p>
          <p className="relative mt-1 text-right text-[16px] font-semibold tracking-[0.06em]" style={{ fontFamily: SERIF, color: "#8a5a1c", fontVariant: "small-caps" }}>
            &mdash; {w.name}
          </p>
          {w.fresh && live && (
            <p className="relative mt-0.5 text-right font-body text-[11px] italic" style={{ color: `${INK}99` }}>
              Shown to everyone once the couple approves it
            </p>
          )}
        </div>
        </div>
      </div>
    </li>
  );
}

function FoldedNote({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 18 18" className="pointer-events-none absolute" style={style} aria-hidden>
      <path d="M1 2.5L16 1.5L17 16.5L2 17.5Z" fill="#fbf1df" stroke="#b88b4a" strokeWidth=".6" />
      <path d="M1.3 7.5L16.4 6.5" stroke="#b88b4a" strokeOpacity=".6" strokeWidth=".5" />
      <circle cx="9.2" cy="7.2" r="2.1" fill="#a3242a" />
    </svg>
  );
}

export default function WishingWall() {
  const { guestName, isPersonalised } = useGuest();
  const root = useScrollRoot();
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showAll, setShowAll] = useState(false);
  // Live mode: approved blessings come from the Sheet. Demo mode (no storage): sample wishes.
  const live = !!apiUrl;
  const [wall, setWall] = useState<Wish[]>(live ? [] : [...wedding.blessings]);
  useEffect(() => {
    if (!live) return;
    let off = false;
    fetchApprovedBlessings().then((list) => {
      if (!off && list) setWall(list);
    });
    return () => {
      off = true;
    };
  }, [live]);
  const sendingRef = useRef(false);

  const [headRef, headSeen] = useInView<HTMLDivElement>(0.2);
  const [scrollRef, scrollSeen] = useInView<HTMLDivElement>(0.15);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [delivered, setDelivered] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const name = isPersonalised && guestName.trim().length >= limits.nameMin ? guestName : "Guest";

  const launch = (text: string) => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const pin = () => setWall((w) => [{ name, message: text, fresh: true }, ...w.map((x) => ({ ...x, fresh: false }))]);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    // bring the top of the scroll into view so the guest sees the delivery
    const a = anchorRef.current;
    if (a) {
      const r = a.getBoundingClientRect();
      const view = root ? root.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      if (r.top < view.top || r.top > view.bottom - 260) a.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    if (reduce) {
      pin();
      setDelivered(true);
      return;
    }
    setDelivered(false);
    const id = Date.now();
    setFlight({ id, phase: "fly" }); // the parrot arcs in from the left
    later(() => setFlight({ id, phase: "drop" }), T_FLY); // hovers and lets go of the note
    later(() => {
      pin(); // the note unfurls as the newest entry
      setFlight({ id, phase: "exit" }); // the parrot flies off
    }, T_FLY + T_DROP);
    later(() => setDelivered(true), T_FLY + T_DROP + T_UNFURL);
    later(() => setFlight(null), T_FLY + T_DROP + T_EXIT);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return; // block double taps
    const errs = validate({ name, message });
    setError(errs.message);
    if (errs.message) return;
    if (honey) {
      setStatus("sent"); // bots get a fake success; nothing is sent
      setDelivered(true);
      return;
    }
    if (isDuplicate({ name, message })) {
      setError("You've already sent this blessing. Thank you!");
      return;
    }
    sendingRef.current = true;
    setStatus("sending");
    try {
      await submitBlessing({ name, message });
      const text = message.trim();
      setStatus("sent");
      launch(text);
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      sendingRef.current = false;
    }
  };

  const latest = wall.slice(0, WALL_MAX);
  const rest = wall.slice(WALL_MAX);
  const flyLeft = `calc(50% - ${u(50)})`;

  return (
    <section id="blessings" aria-labelledby="blessings-title" className="wsh-root relative overflow-x-clip px-5 py-8" style={{ color: INK }}>
      <style>{`
        @keyframes wsh-fly-x { from { left: calc(var(--u) * -230) } to { left: ${flyLeft} } }
        @keyframes wsh-fly-y {
          0% { transform: translateY(calc(var(--u) * 150)) rotate(-8deg) }
          55% { transform: translateY(calc(var(--u) * -30)) rotate(-3deg) }
          100% { transform: translateY(0) rotate(0deg) }
        }
        @keyframes wsh-hover { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(calc(var(--u) * -4)) } }
        @keyframes wsh-exit-x { from { left: ${flyLeft} } to { left: calc(100% + var(--u) * 140) } }
        @keyframes wsh-exit-y {
          0% { transform: translateY(0) rotate(0deg); opacity: 1 }
          80% { opacity: 1 }
          100% { transform: translateY(calc(var(--u) * -130)) rotate(-10deg); opacity: 0 }
        }
        @keyframes wsh-drop {
          0% { transform: translate(0, 0) rotate(14deg); opacity: 1 }
          85% { opacity: 1 }
          100% { transform: translate(calc(var(--u) * -50), calc(var(--u) * 74)) rotate(-6deg) scale(.85); opacity: 0 }
        }
        @keyframes wsh-rows { from { grid-template-rows: 0fr } to { grid-template-rows: 1fr } }
        @keyframes wsh-unfurl { from { clip-path: inset(0 0 100% 0); transform: scaleY(.6) } to { clip-path: inset(0 0 0 0); transform: none } }
        @keyframes wsh-wash { 0% { opacity: 0 } 25% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes wsh-msg-in { from { opacity: 0; transform: translateY(calc(var(--u) * 6)) } to { opacity: 1; transform: none } }
        .wsh-fresh { display: grid; animation: wsh-rows ${T_UNFURL}ms ${EASE} both; }
        .wsh-fresh .wsh-ink { animation: wsh-unfurl ${T_UNFURL}ms ${EASE} both; transform-origin: 50% 0; }
        .wsh-wash { background: radial-gradient(ellipse at center, rgba(226,178,79,0.28) 0%, rgba(226,178,79,0) 70%); animation: wsh-wash 2400ms ease both; }
        @media (prefers-reduced-motion: reduce) {
          .wsh-root *, .wsh-root { animation: none !important; transition: none !important; }
          .wsh-wash { opacity: 0; }
        }
      `}</style>

      <div
        ref={headRef}
        className="text-center"
        style={{
          opacity: headSeen ? 1 : 0,
          transform: headSeen ? "none" : `translateY(${u(14)})`,
          transition: `opacity 900ms ease, transform 900ms ${EASE}`,
        }}
      >
        <p className="font-body text-[11px] uppercase tracking-[0.35em]" style={{ color: GOLD_LABEL }}>Wishing wall</p>
        <h2 id="blessings-title" className="section-title mt-2" style={{ color: MAROON }}>Blessings &amp; Wishes</h2>
        <p lang="mr" className="mt-1 font-marathi text-sm font-semibold" style={{ color: GOLD_LABEL }}>शुभाशीर्वाद</p>
      </div>

      {/* the parchment scroll */}
      <div
        ref={scrollRef}
        className="relative mx-auto mt-[72px] max-w-[350px]"
        style={{
          opacity: scrollSeen ? 1 : 0,
          transform: scrollSeen ? "none" : `translateY(${u(20)})`,
          transition: `opacity 1000ms ease 150ms, transform 1000ms ${EASE} 150ms`,
        }}
      >
        <span ref={anchorRef} className="pointer-events-none absolute left-0" style={{ top: u(-110) }} aria-hidden />
        {/* a parrot resting on the top roller, a marigold in its beak */}
        <div className="pointer-events-none absolute right-[14px] z-[3]" style={{ top: u(-51), width: u(70) }} aria-hidden>
          <Parrot facing="left" carrying="marigold" />
        </div>

        <Roller />
        <div className="relative z-[1] mx-[16px] -my-[8px]" style={{ filter: `drop-shadow(0 ${u(6)} ${u(9)} rgba(90,55,15,0.28))` }}>
          <div
            className="relative px-6 pb-8 pt-7"
            style={{
              clipPath: DECKLE,
              background: PAPER_BG,
              boxShadow: `inset 0 0 ${u(26)} rgba(140,90,30,0.3), inset 0 0 ${u(5)} rgba(120,70,20,0.22)`,
            }}
          >
            {/* paper curling round the rollers */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[22px]" style={{ background: "linear-gradient(180deg, rgba(105,65,22,0.38), rgba(105,65,22,0))" }} aria-hidden />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[22px]" style={{ background: "linear-gradient(0deg, rgba(105,65,22,0.38), rgba(105,65,22,0))" }} aria-hidden />

            <svg viewBox="0 0 300 16" className="mx-auto block h-[12px] w-[200px]" fill="none" aria-hidden style={{ color: GOLD }}>
              <path d="M6 8h112M182 8h112" stroke="currentColor" strokeWidth=".9" />
              <path d="M126 8l3.2-3.2L132.4 8l-3.2 3.2zM167.6 8l3.2-3.2L174 8l-3.2 3.2z" fill="currentColor" />
              <path d="M150 1.5l4.6 6.5-4.6 6.5-4.6-6.5z" fill="currentColor" />
            </svg>

            <ul className="mt-4" aria-label="Latest blessings from guests">
              {latest.map((w, i) => (
                <Entry key={`${w.name}-${w.message.slice(0, 16)}-${i}-${w.fresh ? "n" : "o"}`} w={w} i={i} live={live} />
              ))}
              {wall.length === 0 && (
                <li className="py-4 text-center text-[18px] italic" style={{ fontFamily: SERIF }}>
                  No wishes yet. Be the first!
                </li>
              )}
            </ul>

            {/* the rest of the wishes unroll below */}
            <div
              id="all-wishes"
              className="grid"
              style={{ gridTemplateRows: showAll ? "1fr" : "0fr", transition: `grid-template-rows 700ms ${EASE}` }}
              aria-hidden={!showAll}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="no-scrollbar max-h-[440px] overflow-y-auto overscroll-contain">
                  {rest.map((w, i) => (
                    <Entry key={`all-${i}`} w={w} i={i + WALL_MAX} live={live} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Roller />

        {/* the delivering parrot (clipped at the sides by the section) */}
        {flight && (
          <>
            <div
              key={`${flight.id}-${flight.phase}`}
              className="pointer-events-none absolute z-[5]"
              style={{
                top: u(-62),
                width: u(100),
                left: flyLeft,
                animation:
                  flight.phase === "fly"
                    ? `wsh-fly-x ${T_FLY}ms cubic-bezier(0.25, 0.6, 0.3, 1) both`
                    : flight.phase === "exit"
                      ? `wsh-exit-x ${T_EXIT}ms cubic-bezier(0.55, 0, 0.8, 0.45) both`
                      : undefined,
              }}
              aria-hidden
            >
              <div
                style={{
                  animation:
                    flight.phase === "fly"
                      ? `wsh-fly-y ${T_FLY}ms ease-in-out both`
                      : flight.phase === "drop"
                        ? `wsh-hover ${T_DROP}ms ease-in-out both`
                        : `wsh-exit-y ${T_EXIT}ms ease-in both`,
                }}
              >
                <Parrot pose="flying" facing="right" carrying={flight.phase === "fly" ? "note" : "none"} />
              </div>
            </div>
            {flight.phase === "drop" && (
              <FoldedNote
                style={{
                  left: `calc(50% + ${u(34)})`,
                  top: u(-6),
                  width: u(20),
                  height: u(20),
                  zIndex: 4,
                  animation: `wsh-drop ${T_DROP}ms cubic-bezier(0.5, 0, 0.75, 0.6) both`,
                }}
              />
            )}
          </>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-sm">
        {rest.length > 0 && (
          <div className="mb-6 text-center">
            <button type="button" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll} aria-controls="all-wishes" className="btn-gold">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d={showAll ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {showAll ? "Hide wishes" : `View all wishes (${wall.length})`}
            </button>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          noValidate
          className="relative space-y-2.5 rounded-xl p-4"
          style={{
            background: "linear-gradient(180deg, #fdf5e1 0%, #f8e8c2 100%)",
            border: `${u(1.5)} solid #e2c27a`,
            boxShadow: `inset 0 0 0 ${u(4)} #fdf5e1, inset 0 0 0 ${u(5)} rgba(217,178,90,0.55), 0 ${u(6)} ${u(18)} ${u(-8)} rgba(120,80,20,0.35)`,
          }}
        >
          <div>
            <label htmlFor="bl-msg" className="mb-1.5 block font-body text-xs uppercase tracking-widest" style={{ color: GOLD_LABEL }}>
              Your blessing
              {isPersonalised && (
                <>
                  {" "}· <span className="guest-name normal-case tracking-normal">{guestName}</span>
                </>
              )}
            </label>
            <textarea
              id="bl-msg"
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (status === "sent") setStatus("idle");
              }}
              placeholder="Write your wishes for the couple…"
              aria-invalid={!!error}
              aria-describedby={error ? "bl-msg-err" : undefined}
              className="w-full resize-none rounded-md border border-[#e2c27a] bg-[#fffdf6] px-3 py-2 font-body text-base leading-[26px] placeholder:text-[#4a1a16]/40 focus:border-[#c9963a] focus:outline-none focus:ring-2 focus:ring-[#e2c27a]/50"
              style={{
                color: INK,
                backgroundImage: `repeating-linear-gradient(transparent 0 ${u(25)}, rgba(184,134,47,0.16) ${u(25)} ${u(26)})`,
                backgroundPositionY: u(8),
              }}
            />
            <div className="mt-1 flex justify-between gap-3 text-sm">
              <span id="bl-msg-err" role="alert" style={{ color: MAROON }}>{error}</span>
              <span className="shrink-0 font-body text-xs" style={{ color: message.length > limits.msgMax ? MAROON : `${INK}80` }}>
                {message.length}/{limits.msgMax}
              </span>
            </div>
          </div>
          {/* honeypot: hidden from people, bots fill it */}
          <input tabIndex={-1} autoComplete="off" aria-hidden value={honey} onChange={(e) => setHoney(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
          {status === "error" && (
            <p role="alert" className="text-sm" style={{ color: MAROON }}>Something went wrong. Please try again.</p>
          )}
          <div role="status" aria-live="polite">
            {status === "sent" && delivered && (
              <p
                className="text-center text-[18px] font-semibold italic leading-[1.35]"
                style={{ fontFamily: SERIF, color: MAROON, animation: "wsh-msg-in 600ms ease both" }}
              >
                {live
                  ? "Your blessing has been delivered to the couple ♡ It will appear on the scroll for everyone once they approve it."
                  : "Thank you! Your blessing has been delivered and pinned on the scroll ♡"}
              </p>
            )}
          </div>
          <button type="submit" disabled={status === "sending" || !!flight} className="btn-gold min-h-[44px] w-full text-[14px]">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <path d="M14.5 1.5C8 2.5 4 6.5 2.5 13.5M14.5 1.5C13 7 9.5 10.5 4.5 11.5M7 8.5l-2.5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {status === "sending" ? "Sending…" : "Send Blessing"}
          </button>
        </form>
      </div>
    </section>
  );
}
