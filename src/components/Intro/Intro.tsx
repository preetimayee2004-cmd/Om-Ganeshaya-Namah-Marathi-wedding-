import { useEffect, useRef, useState, type CSSProperties } from "react";
import { coupleOrder } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Sacred invitation reveal, built from the supplied green reference artwork (public/intro/*.jpg):
 *   p1      diya, bells, temples, "tap to open"        (waiting for a tap)
 *   p2      Ganesha drawn in a golden thread           (wipes up from the diya)
 *   invite  ceremonial cloth, drapes, tassels, parchment (unfolds from its centre line)
 * The couple names are NOT baked into invite.jpg: they are live text from config.
 *
 * stage: 0 idle, 1 thread draws Ganesha, 2 invitation unfolds, 3 names appear, 4 ready,
 *        5 leaving, 6 gone
 */
const T = { unfold: 3800, names: 6000, ready: 7600 };
const FADE_MS = 900;
const GOLD = "#E2A84B";
const PLATES = ["p1", "p2", "invite"].map((n) => `/intro/${n}.jpg`);
const RATIO = 641 / 617; // height / width of invite.jpg

const plate = (pos = "50% 50%"): CSSProperties => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: pos,
  userSelect: "none",
});

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const gone = stage >= 6;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gone]);

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
      setStage(4);
      return;
    }
    setStage(1);
    later(() => setStage(2), T.unfold);
    later(() => setStage(3), T.names);
    later(() => setStage(4), T.ready);
  };

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setStage(5);
    later(() => setStage(6), FADE_MS);
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage(6);
  };

  if (gone) return null;

  const on = (n: number) => stage >= n;
  const pw = Math.max(0, Math.min(box.w, 480, (box.h - 110) / RATIO));
  const ph = pw * RATIO;

  const [first, second] = coupleOrder;
  const nameSize = (s: string, base: number) => `${base * Math.min(1, 8.5 / Math.max(s.length, 1))}cqw`;
  const rise = (i: number): CSSProperties => ({
    opacity: on(3) ? 1 : 0,
    transform: `translate(-50%, -50%) translateY(${on(3) ? 0 : 10}px)`,
    transition: `opacity 1000ms ease-in-out ${i * 300}ms, transform 1000ms ease-in-out ${i * 300}ms`,
  });
  const nameStyle: CSSProperties = {
    position: "absolute",
    left: "50.2%",
    whiteSpace: "nowrap",
    color: "#6e1a24",
    lineHeight: 1,
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 600,
  };
  const wipe = "linear-gradient(to bottom, transparent 0%, transparent 34%, #000 50%, #000 100%)";
  const edge = "linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)";

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
        background: "#0f2f1f",
        opacity: stage === 5 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      {/* 1. diya scene, with the "tap to open" line */}
      <img src={PLATES[0]} alt="" draggable={false} style={{ ...plate(), opacity: on(1) ? 0 : 1, transition: "opacity 1600ms ease-in-out" }} />

      {/* 2. golden thread draws Ganesha: wipes upward from the diya */}
      <img
        src={PLATES[1]}
        alt=""
        draggable={false}
        style={{
          ...plate("47% 50%"),
          opacity: on(2) ? 0 : 1,
          transform: on(1) ? "scale(1.04)" : "scale(1)",
          WebkitMaskImage: wipe,
          maskImage: wipe,
          WebkitMaskSize: "100% 300%",
          maskSize: "100% 300%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: on(1) ? "0% 100%" : "0% 0%",
          maskPosition: on(1) ? "0% 100%" : "0% 0%",
          transition: "mask-position 3200ms ease-in-out, -webkit-mask-position 3200ms ease-in-out, transform 6000ms ease-out, opacity 1800ms ease-in-out",
        }}
      />

      {/* 3. ceremonial cloth unfolds from its centre line; live names on top */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 14 }}>
        <div
          style={{
            width: pw,
            height: ph,
            position: "relative",
            containerType: "inline-size",
            clipPath: on(2) ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)",
            transition: "clip-path 2200ms cubic-bezier(.45,0,.25,1)",
            WebkitMaskImage: edge,
            maskImage: edge,
            visibility: pw ? "visible" : "hidden",
          }}
        >
          <img src={PLATES[2]} alt="Wedding invitation" draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
          <p style={{ ...nameStyle, top: "42.4%", fontSize: nameSize(first, 11.6), ...rise(0) }}>{first}</p>
          <p style={{ ...nameStyle, top: "49.9%", fontSize: "9cqw", ...rise(1) }}>&amp;</p>
          <p style={{ ...nameStyle, top: "57.4%", fontSize: nameSize(second, 11.6), ...rise(2) }}>{second}</p>
        </div>

        <button
          onClick={finish}
          tabIndex={on(4) ? 0 : -1}
          className="rounded-full border font-body text-xs uppercase"
          style={{
            letterSpacing: ".25em",
            padding: "10px 26px",
            color: GOLD,
            borderColor: GOLD,
            opacity: on(4) ? 1 : 0,
            pointerEvents: on(4) ? "auto" : "none",
            transition: "opacity 900ms ease-in-out",
          }}
        >
          View Invitation
        </button>
      </div>

      {/* tap anywhere to begin */}
      {stage === 0 && (
        <button autoFocus onClick={start} aria-label="Open the invitation. Tap anywhere to begin." className="absolute inset-0 cursor-pointer" />
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
