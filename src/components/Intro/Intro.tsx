import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useScrollRoot } from "../Layout/ScrollRoot";
import SceneFrame, { ArtLayer, H, MAROON, SceneArt, vFade } from "../Scene/SceneFrame";
import { CoupleText, InviteText } from "../Scene/Texts";

/**
 * Opening storyboard (tap-driven), art from the supplied reference images (public/intro):
 *  0  seal         cream canvas inside the Paithani frame; gold seal, hint, Skip. Whole screen taps.
 *  1  Ganpati      seal ripples and fades; toran drops, Ganpati blooms in a golden halo, petals drift
 *  2  palace       Ganpati fades away; the palace rises on the same canvas; invitation text rises
 *                  line by line; "Meet the Couple" appears
 *  3  couple       text fades out; the couple slides in; couple-section text fades in
 *  4  scroll cue   tap the cue or scroll to enter the pinned scene (no parallax after this point)
 *  5 leaving, 6 gone
 */
const FADE_MS = 900;
const EASE = "cubic-bezier(.45,0,.25,1)";
const IMAGES = ["frame.webp", "gan-top.jpg", "gan-main.jpg", "arch.jpg", "palace.jpg", "couple.jpg"].map((n) => `/intro/${n}`);
const SAFE_TOP = "env(safe-area-inset-top, 0px)";

// Ganesha's centre sits at ~34% of gan-main's height; place that point at ~48% of the screen
const GAN_TOP = `calc(47.8% - ${0.338 * 143.6}cqw)`;
const PETALS = [
  { l: 8, d: 0, t: 5.5, s: 11 }, { l: 24, d: 1.2, t: 6.5, s: 9 }, { l: 38, d: 0.4, t: 5, s: 12 },
  { l: 52, d: 2.1, t: 6.8, s: 10 }, { l: 66, d: 0.8, t: 5.8, s: 11 }, { l: 78, d: 1.6, t: 6.2, s: 9 },
  { l: 90, d: 0.2, t: 6.9, s: 12 },
];

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [rippling, setRippling] = useState(false);
  const [btnReady, setBtnReady] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const touchY = useRef<number | null>(null);
  const gone = stage >= 6;

  // preload every layer before the seal screen is shown (with a safety timeout)
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    Promise.all(
      IMAGES.map(
        (src) =>
          new Promise<void>((res) => {
            const i = new Image();
            i.onload = i.onerror = () => res();
            i.src = src;
          }),
      ),
    ).then(finish);
    const t = window.setTimeout(finish, 3000);
    return () => clearTimeout(t);
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
    if (stage !== 0 || !ready) return;
    if (reduced()) {
      setStage(4);
      setBtnReady(true);
      return;
    }
    setRippling(true);
    later(() => setRippling(false), 1300);
    setStage(1);
    later(() => setStage(2), 4200); // 3s of Ganpati + a 1.2s hold
    later(() => setBtnReady(true), 4200 + 4400);
  };

  const meet = () => {
    if (stage !== 2 || !btnReady) return;
    setStage(3);
    later(() => setStage(4), 3600);
  };

  const enter = () => {
    if (stage < 4) return;
    timers.current.forEach(clearTimeout);
    setStage(5);
    later(() => setStage(6), FADE_MS);
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage(6); // lands on the end of the opening: couple text + scroll cue, scroll unlocked
  };

  if (gone) return null;

  const on = (n: number) => stage >= n;
  const SEAL = "min(140px, 44cqw)";

  const pill: CSSProperties = {
    position: "absolute",
    right: 12,
    top: `calc(${SAFE_TOP} + ${stage === 0 ? 12 : 60}px)`,
    zIndex: 40,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: "0.12em",
    color: MAROON,
    background: "rgba(251,245,232,.88)",
    border: "1px solid rgba(109,15,27,.25)",
    transition: "top 600ms ease-in-out, opacity 400ms",
    fontFamily: "Lato, system-ui, sans-serif",
  };

  return (
    <div
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
      <div style={{ position: "relative", height: "100%", maxWidth: 480, margin: "0 auto" }}>
        <SceneFrame>
          {/* ---------- scene 1: Ganpati ---------- */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "50% 48%",
              transform: on(2) ? "scale(1.1)" : "scale(1)",
              opacity: on(1) && !on(2) ? 1 : 0,
              transition: on(2) ? `transform 2000ms ${EASE}, opacity 1800ms ease-in-out` : "opacity 900ms ease-in-out 400ms",
            }}
          >
            {/* soft golden halo behind Ganesha (images multiply over it) */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "47.8%",
                width: "104cqw",
                height: "104cqw",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(242,163,58,.95) 0%, rgba(242,163,58,.35) 38%, rgba(242,163,58,0) 66%)",
                transform: `translate(-50%, -50%) scale(${on(1) ? 1.2 : 0.8})`,
                opacity: on(1) ? 0.5 : 0,
                transition: "transform 2200ms ease-out 300ms, opacity 1600ms ease-out 300ms",
              }}
            />
            <ArtLayer
              src="/intro/gan-main.jpg"
              anchor="top"
              height={H.ganMain}
              mask="linear-gradient(to bottom, transparent 0, #000 12%, #000 90%, transparent 100%)"
              style={{
                top: GAN_TOP,
                mixBlendMode: "multiply",
                transformOrigin: "50% 33.8%",
                transform: on(1) ? "scale(1.15)" : "scale(1.04)",
                opacity: on(1) ? 1 : 0,
                transition: `transform 1400ms ease-out 400ms, opacity 1200ms ease-out 400ms`,
              }}
            />
            <ArtLayer
              src="/intro/gan-top.jpg"
              anchor="top"
              height={H.ganTop}
              mask={vFade("bottom", 12)}
              alt="Lord Ganesha with a marigold toran"
              style={{
                top: SAFE_TOP,
                mixBlendMode: "multiply",
                transform: on(1) ? "translateY(0)" : "translateY(-120px)",
                transition: "transform 1500ms cubic-bezier(.34,1.3,.5,1)", // gentle settle
              }}
            />
            {/* petals live in the bottom strip only, behind the text */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: "16%", zIndex: 0 }}>
              {PETALS.map((p, i) => (
                <svg key={i} viewBox="0 0 10 14" className="zv-anim absolute" style={{ left: `${p.l}%`, top: 0, width: p.s, animation: on(1) ? `zv-petal-low ${p.t}s ease-in ${p.d}s infinite` : "none" }} aria-hidden>
                  <path d="M5 0 C9 3 10 9 5 14 C0 9 1 3 5 0Z" fill={i % 3 === 0 ? "#e9a23b" : "#d96a82"} opacity=".85" />
                </svg>
              ))}
            </div>
          </div>

          {/* ---------- scene 2: arch + palace ---------- */}
          <ArtLayer src="/intro/arch.jpg" anchor="top" height={H.arch} mask={vFade("bottom", 14)} style={{ opacity: on(2) ? 1 : 0, transition: "opacity 1600ms ease-in-out 600ms" }} />
          <SceneArt
            src="/intro/palace.jpg"
            style={{ opacity: on(2) ? 1 : 0, transform: on(2) ? "translateY(0)" : "translateY(90px)", transition: "opacity 1500ms ease-out 700ms, transform 1700ms cubic-bezier(.22,1,.36,1) 700ms" }}
          />

          {/* ---------- scene 4: the couple slides in from the right ---------- */}
          <SceneArt
            src="/intro/couple.jpg"
            alt="The bride and groom in traditional Maharashtrian attire, looking at the palace"
            wipe={on(3)}
            style={{
              transform: on(3) ? "translateX(0)" : "translateX(60px)",
              transition: "mask-position 1600ms ease-in-out, -webkit-mask-position 1600ms ease-in-out, transform 1400ms ease-out",
            }}
          />

          {/* ---------- scene 3 text + button ---------- */}
          <div style={{ opacity: stage === 2 ? 1 : 0, transition: "opacity 500ms ease-in-out" }}>
            <InviteText show={on(2)} />
            <div className="absolute inset-x-0 flex justify-center" style={{ top: "calc(50cqw + 93cqw)" }}>
              <button
                onClick={meet}
                tabIndex={on(2) && btnReady ? 0 : -1}
                className="zv-anim"
                style={{
                  padding: "2.6cqw 6.5cqw",
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
                <span lang="mr" className="font-marathi" style={{ display: "block", fontSize: "4.6cqw", fontWeight: 600 }}>वधू-वर पाहा</span>
                <span style={{ display: "block", fontFamily: '"Cormorant Garamond", serif', fontSize: "3.6cqw", opacity: 0.9 }}>Meet the Couple</span>
              </button>
            </div>
          </div>

          {/* ---------- scene 4 text + scroll cue (also the start of the scroll scene) ---------- */}
          <CoupleText show={on(3)} cueShow={on(4)} onCue={enter} />

          {/* ---------- scene 0: seal ---------- */}
          {/* faint lotus line-art fills the lower area */}
          <svg viewBox="0 0 200 110" style={{ position: "absolute", left: "50%", bottom: "6%", width: "62cqw", transform: "translateX(-50%)", opacity: stage === 0 && ready ? 0.15 : 0, transition: "opacity 700ms", pointerEvents: "none" }} fill="none" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" aria-hidden>
            <path d="M100 8 C122 34 122 64 100 88 C78 64 78 34 100 8Z" />
            <path d="M100 88 C70 86 46 68 40 38 C66 40 90 58 100 88Z M100 88 C130 86 154 68 160 38 C134 40 110 58 100 88Z" />
            <path d="M100 88 C60 94 28 80 14 56 C40 58 76 66 100 88Z M100 88 C140 94 172 80 186 56 C160 58 124 66 100 88Z" />
            <path d="M20 98 C60 108 140 108 180 98" />
          </svg>


          <div
            className="absolute inset-x-0"
            style={{ top: "42%", transform: "translateY(-50%)", pointerEvents: "none" }}
            aria-hidden={stage !== 0}
          >
            <div className="flex flex-col items-center text-center" style={{ opacity: stage === 0 && ready ? 1 : 0, transform: stage === 0 ? "none" : "scale(1.2)", transition: "opacity 600ms ease-in-out, transform 600ms ease-in-out" }}>
              <p lang="mr" className="font-marathi" style={{ fontSize: 26, lineHeight: 1.3, color: MAROON, fontWeight: 600 }}>शुभमंगल सावधान</p>

              <div style={{ position: "relative", marginTop: "6cqw", width: SEAL, height: SEAL }}>
                {rippling &&
                  [0, 1, 2].map((i) => (
                    <span key={i} className="zv-anim" style={{ position: "absolute", left: "50%", top: "50%", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #e2b24f", animation: `zv-ripple 1000ms ease-out ${i * 220}ms both` }} />
                  ))}
                <div
                  className="zv-anim"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 30%, #f6d98a, #c9963a 55%, #8f5f14)",
                    border: "min(2.4cqw, 9px) double rgba(255,236,180,.9)",
                    boxShadow: "0 6px 18px rgba(90,40,10,.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "zv-seal 2.5s ease-in-out infinite",
                  }}
                >
                  <span lang="mr" className="font-marathi" style={{ fontSize: "min(60px, 19cqw)", color: "#6b1624", fontWeight: 600, lineHeight: 1 }}>श्री</span>
                </div>
              </div>

              <p lang="mr" className="font-marathi" style={{ marginTop: "6cqw", fontSize: 22, lineHeight: 1.3, color: MAROON, fontWeight: 600 }}>निमंत्रण उघडा</p>
              <p className="zv-anim uppercase" style={{ marginTop: "2.5cqw", fontFamily: "Lato, system-ui, sans-serif", fontSize: 14, letterSpacing: "0.2em", color: "#6d0f1b", fontWeight: 600, animation: "zv-hint 2s ease-in-out infinite" }}>
                Tap to open
              </p>
            </div>
          </div>

          {/* Skip + sound, inside the inner frame: never over the border or the notch */}
          {stage < 4 && (
            <button onClick={skip} style={pill}>
              Skip
            </button>
          )}
          {hasAudio && (
            <button
              onClick={() => setSoundOn((s) => !s)}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Mute shehnai music" : "Play shehnai music"}
              style={{ ...pill, right: "auto", left: 12 }}
            >
              {soundOn ? "Sound on" : "Sound off"}
            </button>
          )}
        </SceneFrame>
      </div>

      {/* the whole screen is tappable while waiting */}
      {stage === 0 && (
        <button autoFocus disabled={!ready} onClick={open} aria-label="Open the invitation. Tap anywhere to begin." className="absolute inset-0 cursor-pointer" style={{ outlineOffset: -8 }} />
      )}
    </div>
  );
}
