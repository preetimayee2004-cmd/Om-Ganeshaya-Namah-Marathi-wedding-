import { useEffect, useRef, useState, type FormEvent } from "react";
import { wedding } from "../../config/wedding";
import { useGuest } from "../../context/GuestContext";
import { apiUrl } from "../../lib/api";
import { fetchApprovedBlessings, isDuplicate, limits, submitBlessing, validate } from "../../lib/blessings";
import Reveal, { useInView } from "../Layout/Reveal";

const tilts = [-2.5, 1.8, -1.2, 2.4, -1.8];

function Note({ name, message, i }: { name: string; message: string; i: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const tilt = tilts[i % tilts.length];
  return (
    <article
      ref={ref}
      className="relative w-[78%] shrink-0 snap-center rounded-sm bg-[#fff8e6] px-5 pb-5 pt-7 shadow-[0_8px_22px_-10px_rgba(56,41,35,0.5)] transition-all duration-700 ease-out"
      style={{
        transform: seen ? `rotate(${tilt}deg)` : `translateY(-30px) rotate(${tilt * 4}deg)`,
        opacity: seen ? 1 : 0,
        backgroundImage: "repeating-linear-gradient(transparent 0 25px, rgba(104,114,83,0.18) 25px 26px)",
      }}
    >
      <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-blush/80" aria-hidden />
      <p className="font-script text-2xl leading-[26px] text-espresso">{message}</p>
      <p className="mt-3 text-right font-body text-[11px] uppercase tracking-widest text-wine">— {name}</p>
    </article>
  );
}

export default function WishingWall() {
  const { guestName, isPersonalised } = useGuest();
  const [name, setName] = useState(isPersonalised ? guestName : "");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Live mode: approved blessings come from the Sheet. Demo mode (no storage): sample wishes.
  const live = !!apiUrl;
  const [wall, setWall] = useState<{ name: string; message: string }[]>(live ? [] : [...wedding.blessings]);
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
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return; // block double taps
    const errs = validate({ name, message });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (honey) {
      setStatus("sent"); // bots get a fake success; nothing is sent
      return;
    }
    if (isDuplicate({ name, message })) {
      setErrors({ message: "You've already sent this blessing. Thank you!" });
      return;
    }
    sendingRef.current = true;
    setStatus("sending");
    try {
      await submitBlessing({ name, message });
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      sendingRef.current = false;
    }
  };

  const inputCls =
    "w-full rounded-md border border-gold/60 bg-[#fffdf6] px-4 py-3 font-body text-base text-espresso placeholder:text-espresso/40 focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20";

  return (
    <section id="blessings" aria-labelledby="blessings-title" className="py-6 text-[#4b0f16]">
      <Reveal className="px-5 text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-[#a8741a]">Wishing wall</p>
        <h2 id="blessings-title" className="mt-2 text-5xl text-[#6d0f1b]">Blessings &amp; Wishes</h2>
        <p lang="mr" className="mt-1 text-sm font-semibold text-[#a8741a]">शुभाशीर्वाद</p>
      </Reveal>

      {wall.length > 0 && (
        <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[11%] pb-6 pt-4" tabIndex={0} aria-label="Blessings from guests">
          {wall.map((b, i) => (
            <Note key={`${b.name}-${i}`} {...b} i={i} />
          ))}
        </div>
      )}
      <p className="mt-6 px-5 text-center font-body text-[11px] text-espresso/50">
        {live
          ? wall.length > 0
            ? "Yours appears after the couple approves it."
            : "Be the first to leave a blessing. It appears once the couple approves it."
          : "Sample wishes shown. Yours appears after the couple approves it."}
      </p>

      <Reveal className="mx-auto mt-10 max-w-sm px-5">
        {status === "sent" ? (
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            className="rounded-xl border border-gold/60 bg-[#fbf5e8] px-6 py-10 text-center outline-none"
          >
            <p className="font-script text-4xl text-wine">Thank you!</p>
            <p className="mt-2 font-body text-sm text-espresso/80">
              Your blessing has been received. It will appear on the wall once the couple approves it.
            </p>
            <button onClick={() => setStatus("idle")} className="mt-5 min-h-11 font-body text-xs font-bold uppercase tracking-widest text-wine underline underline-offset-4">
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-gold/50 bg-[#fbf5e8] p-5">
            <div>
              <label htmlFor="bl-name" className="mb-1 block font-body text-xs uppercase tracking-widest text-olive">Your name</label>
              <input
                id="bl-name"
                value={name}
                maxLength={limits.nameMax + 10}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "bl-name-err" : undefined}
                className={inputCls}
              />
              {errors.name && <p id="bl-name-err" role="alert" className="mt-1 text-sm text-wine">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="bl-msg" className="mb-1 block font-body text-xs uppercase tracking-widest text-olive">Your blessing</label>
              <textarea
                id="bl-msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your wishes for the couple…"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "bl-msg-err" : undefined}
                className={`${inputCls} resize-none`}
              />
              <div className="mt-1 flex justify-between text-sm">
                <span id="bl-msg-err" role="alert" className="text-wine">{errors.message}</span>
                <span className={`font-body text-xs ${message.length > limits.msgMax ? "text-wine" : "text-espresso/50"}`}>
                  {message.length}/{limits.msgMax}
                </span>
              </div>
            </div>
            {/* honeypot: hidden from people, bots fill it */}
            <input tabIndex={-1} autoComplete="off" aria-hidden value={honey} onChange={(e) => setHoney(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
            {status === "error" && (
              <p role="alert" className="text-sm text-wine">Something went wrong. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-12 w-full rounded-full bg-wine font-body text-sm font-bold uppercase tracking-widest text-ivory shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send Blessing"}
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}
