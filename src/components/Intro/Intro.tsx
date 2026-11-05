import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Opening storyboard (tap-driven), all artwork from the supplied reference images (public/intro):
 *  0  cover        ivory canvas inside the Paithani peacock frame + golden seal "tap to open"
 *  1  Ganpati      toran slides down, Ganpati rises into his halo, petals drift
 *  2  palace       Ganpati zooms softly away; arch + heritage palace slide up on the same canvas;
 *                  Marathi invitation text fades in with a "Meet the Couple" button
 *  3  couple       the couple steps in from the right; names and date settle in gold
 *  4  scroll hint  "scroll down" chevron; tap or scroll to enter the site
 *  5 leaving, 6 gone
 * The frame is one persistent overlay, so the canvas never reloads between scenes.
 */
const FRAME_RATIO = 1376 / 768;
// interior of the frame, as a share of the frame image
const IN = { l: 68 / 768, t: 66 / 1376, w: 631 / 768, h: 1246 / 1376 };
const FADE_MS = 900;
const MAROON = "#7a1a2a";
const GOLD = "#b8862f";
const EASE = "cubic-bezier(.45,0,.25,1)";
const IMAGES = ["frame.webp", "gan-top.jpg", "gan-main.jpg", "arch.jpg", "palace.jpg", "couple.jpg"].map((n) => `/intro/${n}`);

const PETALS = [
  { l: 8, d: 0, t: 7.5, s: 11 }, { l: 22, d: 1.2, t: 8.5, s: 9 }, { l: 35, d: 0.4, t: 7, s: 12 },
  { l: 48, d: 2.1, t: 9, s: 10 }, { l: 60, d: 0.8, t: 7.8, s: 11 }, { l: 72, d: 1.6, t: 8.2, s: 9 },
  { l: 84, d: 0.2, t: 9.2, s: 12 }, { l: 92, d: 2.4, t: 7.4, s: 10 }, { l: 15, d: 3, t: 8.8, s: 9 },
];

const vFade = (edge: "top" | "bottom", pct = 14) =>
  edge === "top"
    ? `linear-gradient(to bottom, transparent 0, #000 ${pct}%)`
    : `linear-gradient(to bottom, #000 ${100 - pct}%, transparent 100%)`;

const goldText: CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #e2b24f 0%, #a06a14 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

function useMarathiDate() {
  return useMemo(
    () =>
      new Intl.DateTimeFormat("mr-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: wedding.timeZone }).format(new Date(wedding.date)),
    [],
  );
}

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [btnReady, setBtnReady] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const touchY = useRef<number | null>(null);
  const dateText = useMarathiDate();
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
    IMAGES.forEach((src) => {
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
    fetch("/audio/shehnai.mp3", { method: "HEAD" })
      .then((r) => setHasAudio(r.ok && (r.headers.get("content-type") ?? "").startsWith("audio")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasAudio) return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/shehnai.mp3");
      audioRef.current.loop = true;
    }
    const a = audioRef.current;
    if (soundOn) void a.play().catch(() => setSoundOn(false));
    else a.pause();
    return () => a.pause();
  }, [soundOn, hasAudio]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const open = () => {
    if (stage !== 0) return;
    if (reduced()) {
      setStage(4);
      setBtnReady(true);
      return;
    }
    setStage(1);
    later(() => setStage(2), 2800);
    later(() => setBtnReady(true), 2800 + 3600);
  };

  const meet = () => {
    if (stage !== 2 || !btnReady) return;
    setStage(3);
    later(() => setStage(4), 3000);
  };

  const enter = () => {
    if (stage < 4) return;
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
  const fw = Math.max(0, Math.min(box.w, (box.h / FRAME_RATIO) * 1, 520));
  const fh = fw * FRAME_RATIO;
  const [first, second] = coupleOrder;
  const { bride, groom } = wedding.couple;
  const fitName = (s: string) => `${10.5 * Math.min(1, 7.5 / Math.max(s.length, 1))}cqw`;
  const fade = (visible: boolean, delay = 0, dur = 1000): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(10px)",
    transition: `opacity ${dur}ms ease-in-out ${delay}ms, transform ${dur}ms ease-in-out ${delay}ms`,
  });
  const layer = (top: string, height: string): CSSProperties => ({ position: "absolute", left: 0, width: "100%", top, height, display: "block", userSelect: "none" });
  const wipe = "linear-gradient(to right, transparent 0%, transparent 34%, #000 50%, #000 100%)";
  const coupleMask = `${vFade("top", 16)}, ${wipe}`;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Opening invitation"
      className="z-[90] overflow-hidden"
      style={{
        position: scroller ? "absolute" : "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: scroller ? scroller.clientHeight : "100dvh",
        inset: scroller ? undefined : 0,
        background: "#5c1421",
        opacity: stage === 5 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
      onWheel={(e) => e.deltaY > 8 && enter()}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchMove={(e) => {
        if (touchY.current !== null && touchY.current - e.touches[0].clientY > 24) {
          touchY.current = null;
          enter();
        }
      }}
    >
      <style>{`
        @keyframes zv-petal { 0% { transform: translate(0,-8cqh) rotate(0deg); opacity: 0 } 10% { opacity: .9 } 50% { transform: translate(14px,50cqh) rotate(160deg) } 100% { transform: translate(-10px,106cqh) rotate(320deg); opacity: .5 } }
        @keyframes zv-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(184,134,47,.45) } 50% { box-shadow: 0 0 0 10px rgba(184,134,47,0) } }
        @keyframes zv-chevron { 0%,100% { transform: translateY(0) } 50% { transform: translateY(7px) } }
        @media (prefers-reduced-motion: reduce) { .zv-anim { animation: none !important } }
      `}</style>

      <div style={{ position: "absolute", left: "50%", top: "50%", width: fw, height: fh, transform: "translate(-50%,-50%)", visibility: fw ? "visible" : "hidden" }}>
        {/* ivory canvas + all scenes, inside the frame */}
        <div
          style={{
            position: "absolute",
            left: `${IN.l * 100}%`,
            top: `${IN.t * 100}%`,
            width: `${IN.w * 100}%`,
            height: `${IN.h * 100}%`,
            overflow: "hidden",
            containerType: "size",
            background: "radial-gradient(ellipse at 50% 35%, #f8f3e8 0%, #f3ecdc 100%)",
          }}
        >
          {/* scene 1: Ganpati (toran drops, Ganpati rises into the halo) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "50% 45%",
              transform: on(2) ? "scale(1.14)" : "scale(1)",
              opacity: on(1) && !on(2) ? 1 : 0,
              transition: on(2) ? `transform 2200ms ${EASE}, opacity 1700ms ease-in-out` : "opacity 1400ms ease-in-out",
            }}
          >
            <img
              src="/intro/gan-main.jpg"
              alt=""
              draggable={false}
              style={{
                ...layer("27.3%", "72.7%"),
                WebkitMaskImage: vFade("top", 12),
                maskImage: vFade("top", 12),
                transform: on(1) ? "scale(1)" : "scale(.94)",
                transformOrigin: "50% 40%",
                transition: `transform 2000ms ${EASE} 300ms`,
              }}
            />
            <img
              src="/intro/gan-top.jpg"
              alt="Lord Ganesha"
              draggable={false}
              style={{
                ...layer("0%", "30.5%"),
                WebkitMaskImage: vFade("bottom", 12),
                maskImage: vFade("bottom", 12),
                transform: on(1) ? "translateY(0)" : "translateY(-14%)",
                transition: `transform 1600ms ${EASE}`,
              }}
            />
          </div>

          {/* scene 2: arch + palace on the same canvas */}
          <img
            src="/intro/arch.jpg"
            alt=""
            draggable={false}
            style={{ ...layer("0%", "33.7%"), WebkitMaskImage: vFade("bottom", 14), maskImage: vFade("bottom", 14), opacity: on(2) ? 1 : 0, transition: "opacity 1600ms ease-in-out 500ms" }}
          />
          <img
            src="/intro/palace.jpg"
            alt=""
            draggable={false}
            style={{
              ...layer("63.4%", "36.6%"),
              WebkitMaskImage: vFade("top", 14),
              maskImage: vFade("top", 14),
              opacity: on(2) ? 1 : 0,
              transform: on(2) ? "translateY(0)" : "translateY(40px)",
              transition: `opacity 1500ms ease-out 300ms, transform 1800ms ease-out 300ms`,
            }}
          />

          {/* scene 3: the couple steps in from the right */}
          <img
            src="/intro/couple.jpg"
            alt="The bride and groom in traditional Maharashtrian attire, looking at the palace"
            draggable={false}
            style={{
              ...layer("63.4%", "36.6%"),
              WebkitMaskImage: coupleMask,
              maskImage: coupleMask,
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
              WebkitMaskSize: "100% 100%, 300% 100%",
              maskSize: "100% 100%, 300% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: on(3) ? "0 0, 100% 0" : "0 0, 0% 0",
              maskPosition: on(3) ? "0 0, 100% 0" : "0 0, 0% 0",
              transform: on(3) ? "translateX(0)" : "translateX(28px)",
              transition: "mask-position 2200ms ease-in-out, -webkit-mask-position 2200ms ease-in-out, transform 2200ms ease-out",
            }}
          />

          {/* petals (Step 1 only) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: on(1) && !on(3) ? 1 : 0, transition: "opacity 1200ms" }}>
            {PETALS.map((p, i) => (
              <svg key={i} viewBox="0 0 10 14" className="zv-anim absolute" style={{ left: `${p.l}%`, top: 0, width: p.s, animation: on(1) ? `zv-petal ${p.t}s ease-in-out ${p.d}s infinite` : "none" }} aria-hidden>
                <path d="M5 0 C9 3 10 9 5 14 C0 9 1 3 5 0Z" fill={i % 3 === 0 ? "#e9a23b" : "#d96a82"} opacity=".85" />
              </svg>
            ))}
          </div>

          {/* cover: golden seal */}
          <div
            className="absolute inset-x-0 flex flex-col items-center text-center"
            style={{ top: "34%", opacity: stage === 0 ? 1 : 0, transform: stage === 0 ? "none" : "scale(1.25)", transition: "opacity 700ms ease-in-out, transform 900ms ease-in-out", pointerEvents: "none" }}
          >
            <p lang="mr" className="font-marathi" style={{ fontSize: "6cqw", color: MAROON, fontWeight: 600, letterSpacing: ".02em" }}>
              शुभमंगल सावधान
            </p>
            <div
              className="zv-anim"
              style={{
                marginTop: "5cqw",
                width: "26cqw",
                height: "26cqw",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #f6d98a, #c9963a 55%, #8f5f14)",
                border: "1.6cqw double rgba(255,236,180,.9)",
                boxShadow: "0 6px 18px rgba(90,40,10,.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "zv-pulse 2.4s ease-in-out infinite",
              }}
            >
              <span lang="mr" className="font-marathi" style={{ fontSize: "11cqw", color: "#6b1624", fontWeight: 600, lineHeight: 1 }}>
                श्री
              </span>
            </div>
            <p lang="mr" className="font-marathi" style={{ marginTop: "5cqw", fontSize: "6cqw", color: MAROON, fontWeight: 600 }}>
              निमंत्रण उघडा
            </p>
            <p className="font-body uppercase" style={{ marginTop: "1.5cqw", fontSize: "3cqw", letterSpacing: ".3em", color: "#8a6a3a" }}>
              Tap to open
            </p>
          </div>

          {/* scene 2 copy + button */}
          <div
            className="absolute inset-x-0 text-center"
            style={{ top: "30%", padding: "0 9cqw", opacity: stage === 2 || (on(2) && !on(3)) ? 1 : 0, transition: `opacity ${on(3) ? 700 : 900}ms ease-in-out`, pointerEvents: stage === 2 ? "auto" : "none" }}
          >
            <p lang="mr" className="font-marathi" style={{ fontSize: "7.4cqw", color: MAROON, fontWeight: 600, ...fade(on(2), 1600) }}>
              सस्नेह निमंत्रण...
            </p>
            <p lang="mr" className="font-marathi" style={{ marginTop: "4cqw", fontSize: "5.2cqw", lineHeight: 1.65, color: "#4a2a1c", ...fade(on(2), 2100) }}>
              आमच्या लाडक्या चि. <strong style={{ color: MAROON }}>{groom}</strong> आणि चि. सौ. कां. <strong style={{ color: MAROON }}>{bride}</strong> यांच्या शुभविवाहास उपस्थित राहून आशीर्वाद द्यावेत.
            </p>
            <button
              onClick={meet}
              tabIndex={on(2) && btnReady ? 0 : -1}
              className="zv-anim"
              style={{
                marginTop: "6cqw",
                padding: "3cqw 7cqw",
                borderRadius: 999,
                border: "1px solid #e2b24f",
                background: "linear-gradient(180deg, #8a1f32, #5e1020)",
                color: "#fbe9b8",
                boxShadow: "0 4px 14px rgba(94,16,32,.35)",
                opacity: btnReady && stage === 2 ? 1 : 0,
                transition: "opacity 900ms ease-in-out",
                animation: btnReady ? "zv-pulse 2.4s ease-in-out infinite" : "none",
                pointerEvents: btnReady && stage === 2 ? "auto" : "none",
              }}
            >
              <span lang="mr" className="font-marathi" style={{ display: "block", fontSize: "5cqw", fontWeight: 600 }}>
                वधू-वरांना भेटा
              </span>
              <span className="font-body uppercase" style={{ display: "block", fontSize: "2.6cqw", letterSpacing: ".22em", opacity: 0.85 }}>
                Meet the Couple
              </span>
            </button>
          </div>

          {/* scene 3: names + date drop in */}
          <div className="absolute inset-x-0 text-center" style={{ top: "33%", pointerEvents: "none" }}>
            <p className="font-script" style={{ ...goldText, fontSize: fitName(first), lineHeight: 1.05, opacity: on(3) ? 1 : 0, transform: on(3) ? "translateY(0)" : "translateY(-22px)", transition: `opacity 1200ms ease-out 900ms, transform 1400ms ${EASE} 900ms` }}>
              {first}
            </p>
            <p className="font-script" style={{ ...goldText, fontSize: "7cqw", lineHeight: 1, opacity: on(3) ? 1 : 0, transition: "opacity 1200ms ease-out 1200ms" }}>&amp;</p>
            <p className="font-script" style={{ ...goldText, fontSize: fitName(second), lineHeight: 1.05, opacity: on(3) ? 1 : 0, transform: on(3) ? "translateY(0)" : "translateY(-22px)", transition: `opacity 1200ms ease-out 1400ms, transform 1400ms ${EASE} 1400ms` }}>
              {second}
            </p>
            <p lang="mr" className="font-marathi" style={{ marginTop: "4cqw", fontSize: "5.6cqw", color: MAROON, fontWeight: 600, ...fade(on(3), 2100, 1100) }}>
              {dateText}
            </p>
            <p className="font-body" style={{ marginTop: "1.5cqw", fontSize: "3.6cqw", color: "#4a2a1c", ...fade(on(3), 2400, 1100) }}>
              {wedding.venue.name}, {wedding.venue.city}
            </p>
          </div>

          {/* scroll hint */}
          <button
            onClick={enter}
            tabIndex={on(4) ? 0 : -1}
            className="absolute inset-x-0 flex flex-col items-center"
            style={{ top: "55.5%", opacity: on(4) ? 1 : 0, pointerEvents: on(4) ? "auto" : "none", transition: "opacity 900ms ease-in-out", color: MAROON }}
            aria-label="Scroll down to the invitation"
          >
            <svg viewBox="0 0 24 24" className="zv-anim" style={{ width: "6cqw", animation: "zv-chevron 1.6s ease-in-out infinite" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
            <span lang="mr" className="font-marathi" style={{ fontSize: "3.8cqw", fontWeight: 600 }}>खाली स्क्रोल करा</span>
            <span className="font-body uppercase" style={{ fontSize: "2.4cqw", letterSpacing: ".2em", opacity: 0.8 }}>Scroll down for events</span>
          </button>
        </div>

        {/* persistent Paithani frame */}
        <img src="/intro/frame.webp" alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      </div>

      {stage === 0 && (
        <button autoFocus onClick={open} aria-label="Open the invitation. Tap anywhere to begin." className="absolute inset-0 cursor-pointer" />
      )}

      {hasAudio && (
        <button
          onClick={() => setSoundOn((s) => !s)}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute shehnai music" : "Play shehnai music"}
          className="absolute left-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest lg:top-12"
          style={{ color: "#f3d79a" }}
        >
          {soundOn ? "Sound on" : "Sound off"}
        </button>
      )}
      {stage < 4 && (
        <button
          onClick={skip}
          className="absolute right-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest underline-offset-4 hover:underline lg:top-12"
          style={{ color: "#f3d79a" }}
        >
          Skip Animation
        </button>
      )}
    </div>
  );
}
