import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { apiUrl } from "../../lib/api";
import { fetchApprovedBlessings, isDuplicate, limits, submitBlessing, validate } from "../../lib/blessings";
import Reveal, { useInView } from "../Layout/Reveal";

const tilts = [-2.5, 1.8, -1.2, 2.4, -1.8];
const WALL_MAX = 3; // only the latest three wishes are pinned on the wall
const INK = "#6d0f1b";
const INK_SOFT = "#4b0f16";
const GOLD_LABEL = "#a8741a";

type Wish = { name: string; message: string; fresh?: boolean };

function HeartIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 22" className={className} style={style} aria-hidden>
      <path
        d="M12 21s-8.5-5.3-10.6-10.4C-.1 5.9 3.6 1.5 7.7 2.6c1.9.5 3.3 2 4.3 3.6 1-1.6 2.4-3.1 4.3-3.6 4.1-1.1 7.8 3.3 6.3 8C20.5 15.7 12 21 12 21Z"
        fill="#b3243a"
        stroke="#d4a53c"
        strokeWidth="1"
      />
    </svg>
  );
}

function Note({ name, message, i, fresh }: Wish & { i: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const tilt = tilts[i % tilts.length];
  return (
    <article
      ref={ref}
      className="relative w-[78%] shrink-0 snap-center rounded-sm bg-[#fff8e6] px-5 pb-5 pt-7 shadow-[0_8px_22px_-10px_rgba(56,41,35,0.5)] transition-all duration-700 ease-out"
      style={{
        transform: seen ? `rotate(${tilt}deg)` : `translateY(calc(var(--u) * -30)) rotate(${tilt * 4}deg)`,
        opacity: seen ? 1 : 0,
        backgroundImage: "repeating-linear-gradient(transparent 0 calc(var(--u) * 25), rgba(168,116,26,0.16) calc(var(--u) * 25) calc(var(--u) * 26))",
        animation: fresh ? "wish-stick 700ms cubic-bezier(0.22, 1, 0.36, 1) both" : undefined,
      }}
    >
      {fresh ? (
        <HeartIcon className="absolute -top-3 left-1/2 h-7 w-7 -translate-x-1/2" style={{ animation: "wish-heart-pin 700ms 250ms cubic-bezier(.3,1.6,.5,1) both" }} />
      ) : (
        <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-[#efd28f]/80" aria-hidden />
      )}
      <p className="text-[19px] font-semibold italic leading-[1.35]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: INK }}>{message}</p>
      <p className="mt-3 text-right font-body text-[11px] uppercase tracking-widest" style={{ color: GOLD_LABEL }}>— {name}</p>
    </article>
  );
}

export default function WishingWall() {
  const { guestName, isPersonalised } = useGuest();
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

  // the flying wish + heart burst
  const sectionRef = useRef<HTMLElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [flyer, setFlyer] = useState<{ text: string; x: number; y: number; w: number; dx: number; dy: number; go: boolean } | null>(null);
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; hearts: { dx: number; dy: number; s: number; r: number; d: number }[] } | null>(null);

  useLayoutEffect(() => {
    if (flyer && !flyer.go) {
      const raf = requestAnimationFrame(() => setFlyer((f) => (f ? { ...f, go: true } : f)));
      return () => cancelAnimationFrame(raf);
    }
  }, [flyer]);

  const name = isPersonalised && guestName.trim().length >= limits.nameMin ? guestName : "Guest";

  const launch = (text: string) => {
    const sec = sectionRef.current?.getBoundingClientRect();
    const ta = msgRef.current?.getBoundingClientRect();
    const wl = wallRef.current?.getBoundingClientRect();
    const bt = btnRef.current?.getBoundingClientRect();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const pin = () => {
      setWall((w) => [{ name, message: text, fresh: true }, ...w.map((x) => ({ ...x, fresh: false }))]);
      wallRef.current?.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
    };
    if (!sec || !ta || !wl || reduce) {
      pin();
      return;
    }
    // hearts burst out of the button
    if (bt) {
      setBurst({
        id: Date.now(),
        x: bt.left + bt.width / 2 - sec.left,
        y: bt.top + bt.height / 2 - sec.top,
        hearts: Array.from({ length: 14 }, (_, i) => {
          const a = -Math.PI / 2 + ((i / 13) - 0.5) * Math.PI * 1.3;
          const d = 70 + Math.random() * 90;
          return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 20, s: 12 + Math.random() * 10, r: (Math.random() - 0.5) * 60, d: Math.random() * 150 };
        }),
      });
      window.setTimeout(() => setBurst(null), 1500);
    }
    // the wish lifts off the textarea and flies to the front of the wall
    const w = Math.min(ta.width, wl.width * 0.78);
    const x = ta.left + (ta.width - w) / 2 - sec.left;
    const y = ta.top - sec.top;
    const toX = wl.left + wl.width * 0.11 - sec.left;
    const toY = wl.top + 16 - sec.top;
    setFlyer({ text, x, y, w, dx: toX - x, dy: toY - y, go: false });
    window.setTimeout(() => {
      setFlyer(null);
      pin();
    }, 950);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return; // block double taps
    const errs = validate({ name, message });
    setError(errs.message);
    if (errs.message) return;
    if (honey) {
      setStatus("sent"); // bots get a fake success; nothing is sent
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

  const inputCls =
    "w-full rounded-md border border-[#e2c27a] bg-[#fffdf6] px-3 py-2 font-body text-base placeholder:text-[#4b0f16]/40 focus:border-[#c9992f] focus:outline-none focus:ring-2 focus:ring-[#e2c27a]/50";

  return (
    <section ref={sectionRef} id="blessings" aria-labelledby="blessings-title" className="relative py-6" style={{ color: INK_SOFT }}>
      <Reveal className="px-5 text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em]" style={{ color: GOLD_LABEL }}>Wishing wall</p>
        <h2 id="blessings-title" className="section-title mt-2" style={{ color: INK }}>Blessings &amp; Wishes</h2>
        <p lang="mr" className="mt-1 text-sm font-semibold" style={{ color: GOLD_LABEL }}>शुभाशीर्वाद</p>
      </Reveal>

      <div
        ref={wallRef}
        className="no-scrollbar mt-10 flex min-h-[150px] snap-x snap-mandatory gap-4 overflow-x-auto px-[11%] pb-6 pt-4"
        tabIndex={0}
        aria-label="Latest blessings from guests"
      >
        {wall.slice(0, WALL_MAX).map((b, i) => (
          <Note key={`${b.name}-${b.message.slice(0, 12)}-${i}`} {...b} i={i} />
        ))}
      </div>

      <Reveal className="mx-auto mt-4 max-w-sm px-5">
        {/* view all wishes, above the input */}
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            aria-expanded={showAll}
            aria-controls="all-wishes"
            className="btn-gold"
          >
            <HeartIcon className="h-3.5 w-3.5" />
            {showAll ? "Hide wishes" : `View all wishes (${wall.length})`}
          </button>
        </div>
        <div
          id="all-wishes"
          className="grid transition-all duration-500 ease-out"
          style={{ gridTemplateRows: showAll ? "1fr" : "0fr", marginBottom: showAll ? 16 : 0 }}
        >
          <div className="overflow-hidden">
            <ul className="max-h-[360px] space-y-3 overflow-y-auto rounded-xl border border-[#e2c27a] bg-[#fffaf0]/90 p-4">
              {wall.map((b, i) => (
                <li key={`all-${i}`} className="border-b border-[#efd9a5] pb-3 last:border-0 last:pb-0">
                  <p className="text-[18px] font-semibold italic leading-[1.35]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: INK }}>{b.message}</p>
                  <p className="mt-1 text-right font-body text-[10px] uppercase tracking-widest" style={{ color: GOLD_LABEL }}>— {b.name}</p>
                </li>
              ))}
              {wall.length === 0 && <li className="text-center font-body text-sm">No wishes yet. Be the first!</li>}
            </ul>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="relative space-y-2.5 rounded-xl p-3.5"
          style={{
            background: "linear-gradient(180deg, #fdf5e1 0%, #f8e8c2 100%)",
            border: "calc(var(--u) * 1.5) solid #e2c27a",
            boxShadow: "inset 0 0 0 calc(var(--u) * 4) #fdf5e1, inset 0 0 0 calc(var(--u) * 5) rgba(217,178,90,0.55), 0 calc(var(--u) * 6) calc(var(--u) * 18) calc(var(--u) * -8) rgba(120,80,20,0.35)",
          }}
        >
          <div>
            <label htmlFor="bl-msg" className="mb-1 block font-body text-xs uppercase tracking-widest" style={{ color: GOLD_LABEL }}>
              Your blessing
              {isPersonalised && (
                <>
                  {" "}· <span className="guest-name normal-case tracking-normal">{guestName}</span>
                </>
              )}
            </label>
            <textarea
              ref={msgRef}
              id="bl-msg"
              rows={2}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (status === "sent") setStatus("idle");
              }}
              placeholder="Write your wishes for the couple…"
              aria-invalid={!!error}
              aria-describedby={error ? "bl-msg-err" : undefined}
              className={`${inputCls} resize-none`}
              style={{ color: INK_SOFT }}
            />
            <div className="mt-1 flex justify-between text-sm">
              <span id="bl-msg-err" role="alert" style={{ color: INK }}>{error}</span>
              <span className="font-body text-xs" style={{ color: message.length > limits.msgMax ? INK : `${INK_SOFT}80` }}>
                {message.length}/{limits.msgMax}
              </span>
            </div>
          </div>
          {/* honeypot: hidden from people, bots fill it */}
          <input tabIndex={-1} autoComplete="off" aria-hidden value={honey} onChange={(e) => setHoney(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
          {status === "error" && (
            <p role="alert" className="text-sm" style={{ color: INK }}>Something went wrong. Please try again.</p>
          )}
          {status === "sent" && (
            <p role="status" className="text-center font-body text-sm" style={{ color: INK }}>
              Thank you! Your blessing is pinned on the wall ♡
            </p>
          )}
          <button
            ref={btnRef}
            type="submit"
            disabled={status === "sending"}
            className="btn-gold w-full"
          >
            {status === "sending" ? "Sending…" : "Send Blessing"}
          </button>
        </form>
      </Reveal>

      {/* the wish flying up to the wall */}
      {flyer && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-30 rounded-sm bg-[#fff8e6] px-5 pb-4 pt-5 shadow-[0_10px_26px_-8px_rgba(56,41,35,0.55)]"
          style={{
            left: flyer.x,
            top: flyer.y,
            width: flyer.w,
            transform: flyer.go ? `translate(${flyer.dx}px, ${flyer.dy}px) rotate(-3deg) scale(0.92)` : "none",
            transition: "transform 900ms cubic-bezier(0.55, 0, 0.25, 1)",
          }}
        >
          <HeartIcon className="absolute -top-3 left-1/2 h-7 w-7 -translate-x-1/2" />
          <p className="text-[19px] font-semibold italic leading-[1.35]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: INK }}>{flyer.text}</p>
        </div>
      )}
      {/* hearts bursting out of the button */}
      {burst && (
        <div aria-hidden className="pointer-events-none absolute z-30" style={{ left: burst.x, top: burst.y }} key={burst.id}>
          {burst.hearts.map((h, i) => (
            <HeartIcon
              key={i}
              className="absolute"
              style={{
                width: h.s,
                height: h.s,
                left: -h.s / 2,
                top: -h.s / 2,
                opacity: 0,
                ["--dx" as string]: `${h.dx}px`,
                ["--dy" as string]: `${h.dy}px`,
                ["--rr" as string]: `${h.r}deg`,
                animation: `wish-heart-burst 1100ms ${h.d}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
