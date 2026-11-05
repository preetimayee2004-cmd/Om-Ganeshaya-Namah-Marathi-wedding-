import { useEffect, useRef, useState, type CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Sacred invitation reveal, built from the supplied reference artwork (public/intro/*.jpg):
 *   p1  diya + "tap to open"        (waiting for a tap)
 *   p2  Ganesha drawn in golden thread  (wipes up from the diya)
 *   p3  Ganesha inside the mandala      (cross-fades in)
 *   invite  arched parchment invitation (unfolds from its centre line)
 * The couple names are NOT baked into invite.jpg: they are live text from config.
 *
 * stage: 0 idle, 1 thread, 2 mandala, 3 invitation unfolds, 4 names appear, 5 ready,
 *        6 leaving, 7 gone
 */
const T = { mandala: 3200, unfold: 4800, names: 6800, ready: 8200 };
const FADE_MS = 900;
const GOLD = "#E2A84B";
const PLATES = ["p1", "p2", "p3", "invite"].map((n) => `/intro/${n}.jpg`);
const INVITE_RATIO = 646 / 485; // height / width of invite.jpg

const plate: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  userSelect: "none",
};

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const gone = stage >= 7;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gone]);

  // Warm the cache so each plate is ready before it is needed.
  useEffect(() => {
    PLATES.slice(1).forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  useEffect(() => {
    if (gone) return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    scroller?.scrollTo(0, 0);
    return () => {
      el.style.overflow = prev;
    };
  }, [gone, scroller]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The sound toggle only appears if a sanai file has actually been supplied.
  useEffect(() => {
    fetch("/audio/sanai.mp3", { method: "HEAD" })
      .then((r) => setHasAudio(r.ok && (r.headers.get("content-type") ?? "").startsWith("audio")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasAudio) return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/sanai.mp3");
      audioRef.current.loop = true;
    }
    const a = audioRef.current;
    if (soundOn) void a.play().catch(() => setSoundOn(false));
    else a.pause();
    return () => a.pause();
  }, [soundOn, hasAudio]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const start = () => {
    if (stage !== 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(5);
      return;
    }
    setStage(1);
    later(() => setStage(2), T.mandala);
    later(() => setStage(3), T.unfold);
    later(() => setStage(4), T.names);
    later(() => setStage(5), T.ready);
  };

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setStage(6);
    later(() => setStage(7), FADE_MS);
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage(7);
  };

  if (gone) return null;

  const on = (n: number) => stage >= n;

  // Invitation plate size: full width (max 480), but always leave room for the button.
  const pw = Math.max(0, Math.min(box.w, 480, ((box.h - 130) * 1) / INVITE_RATIO));
  const ph = pw * INVITE_RATIO;

  const { bride, groom } = wedding.couple;
  const nameSize = (s: string, base: number) => `${base * Math.min(1, 9 / Math.max(s.length, 1))}cqw`;
  const rise = (i: number): CSSProperties => ({
    opacity: on(4) ? 1 : 0,
    transform: `translate(-50%, -50%) translateY(${on(4) ? 0 : 10}px)`,
    transition: `opacity 1000ms ease-in-out ${i * 300}ms, transform 1000ms ease-in-out ${i * 300}ms`,
  });
  const nameStyle: CSSProperties = {
    position: "absolute",
    left: "50.7%",
    whiteSpace: "nowrap",
    color: "#6e1a24",
    lineHeight: 1,
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 600,
  };

  const wipe =
    "linear-gradient(to bottom, transparent 0%, transparent 34%, #000 50%, #000 100%)";

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Opening invitation animation"
      className="z-[90] overflow-hidden"
      style={{
        position: scroller ? "absolute" : "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: scroller ? scroller.clientHeight : "100dvh",
        inset: scroller ? undefined : 0,
        background: "radial-gradient(ellipse at 50% 40%, #5a0f1c 0%, #3B0710 62%, #240409 100%)",
        opacity: stage === 6 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      <style>{`
        @keyframes zari-glow { 0%,100% { opacity: .22 } 40% { opacity: .5 } 70% { opacity: .32 } }
        @media (prefers-reduced-motion: reduce) { .zari-anim { animation: none !important } }
      `}</style>

      {/* 1. diya + tap prompt */}
      <img src={PLATES[0]} alt="" draggable={false} style={{ ...plate, opacity: on(1) ? 0 : 1, transition: "opacity 1600ms ease-in-out" }} />
      <div
        className="zari-anim pointer-events-none absolute"
        style={{
          left: "50%",
          top: "76%",
          width: "46%",
          height: "18%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(closest-side, rgba(255,170,60,.9), transparent)",
          mixBlendMode: "screen",
          animation: on(1) ? "none" : "zari-glow 2.6s ease-in-out infinite",
          opacity: on(1) ? 0 : undefined,
          transition: "opacity 800ms",
        }}
      />

      {/* 2. golden thread draws Ganesha: wipes upward from the diya */}
      <img
        src={PLATES[1]}
        alt=""
        draggable={false}
        style={{
          ...plate,
          opacity: on(2) ? 0 : 1,
          transform: on(1) ? "scale(1.05)" : "scale(1)",
          WebkitMaskImage: wipe,
          maskImage: wipe,
          WebkitMaskSize: "100% 300%",
          maskSize: "100% 300%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: on(1) ? "0% 100%" : "0% 0%",
          maskPosition: on(1) ? "0% 100%" : "0% 0%",
          transition: "mask-position 3000ms ease-in-out, -webkit-mask-position 3000ms ease-in-out, transform 5000ms ease-out, opacity 1800ms ease-in-out",
        }}
      />

      {/* 3. Ganesha in the mandala */}
      <img
        src={PLATES[2]}
        alt=""
        draggable={false}
        style={{
          ...plate,
          opacity: on(2) && !on(3) ? 1 : 0,
          transform: on(2) ? "scale(1)" : "scale(1.06)",
          transition: "opacity 1800ms ease-in-out, transform 3200ms ease-out",
        }}
      />

      {/* 4. invitation unfolds; live names on top */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 14 }}>
        <div
          style={{
            width: pw,
            height: ph,
            position: "relative",
            containerType: "inline-size",
            clipPath: on(3) ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)",
            transition: "clip-path 2000ms cubic-bezier(.45,0,.25,1)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%), linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%), linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
            visibility: pw ? "visible" : "hidden",
          }}
        >
          <img src={PLATES[3]} alt="Wedding invitation" draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
          <p style={{ ...nameStyle, top: "42.9%", fontSize: nameSize(bride, 11.8), ...rise(0) }}>{bride}</p>
          <p style={{ ...nameStyle, top: "49.8%", fontSize: "8.6cqw", color: "#8a5a22", ...rise(1) }}>&amp;</p>
          <p style={{ ...nameStyle, top: "57.6%", fontSize: nameSize(groom, 11.8), ...rise(2) }}>{groom}</p>
        </div>

        <button
          onClick={finish}
          tabIndex={on(5) ? 0 : -1}
          className="rounded-full border font-body text-xs uppercase"
          style={{
            letterSpacing: ".25em",
            padding: "10px 26px",
            color: GOLD,
            borderColor: GOLD,
            opacity: on(5) ? 1 : 0,
            pointerEvents: on(5) ? "auto" : "none",
            transition: "opacity 900ms ease-in-out",
          }}
        >
          View Invitation
        </button>
      </div>

      {/* tap anywhere to begin */}
      {stage === 0 && (
        <button
          autoFocus
          onClick={start}
          aria-label="Open the invitation. Tap anywhere to begin."
          className="absolute inset-0 cursor-pointer"
        />
      )}

      {hasAudio && (
        <button
          onClick={() => setSoundOn((s) => !s)}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sanai music" : "Play sanai music"}
          className="absolute left-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest lg:top-12"
          style={{ color: GOLD }}
        >
          {soundOn ? "Sound on" : "Sound off"}
        </button>
      )}
      <button
        onClick={skip}
        className="absolute right-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest underline-offset-4 hover:underline lg:top-12"
        style={{ color: GOLD }}
      >
        Skip Animation
      </button>
    </div>
  );
}
