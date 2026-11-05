import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useScrollRoot } from "../Layout/ScrollRoot";
import SceneFrame, { ArtLayer, H, MAROON, SceneArt, ScreenSpace, u, useUnit, vFade } from "../Scene/SceneFrame";
import { CoupleText, InviteText } from "../Scene/Texts";

/**
 * Opening (tap-driven). Sizes follow the design spec in u (u = min(screen width, 430px) / 390):
 *  0  seal     140u gold seal, group centred at 42% of the screen height, Skip, whole screen taps
 *  1  Ganpati  toran 326u wide at top 36u; Ganesh 240u x 270u centred at 46%; 300u halo;
 *              diyas 46u x 150u, 26u from the border, bottom 70u; calligraphy bottom 56u
 *  2  palace   Ganpati fades out; 346u x 210u building on the ground line; invitation text from y = 212u
 *  3  couple   the couple appears; couple text replaces the invitation text in the same zone
 *  4  cue      "Scroll down"; tap or scroll to enter the page
 *  5 leaving, 6 gone
 */
const FADE_MS = 900;
const IMAGES = ["frame.webp", "toran.jpg", "ganesh.jpg", "diya-l.jpg", "diya-r.jpg", "calli.jpg", "arch.jpg", "palace.jpg", "couple.jpg"].map((n) => `/intro/${n}`);
const SAFE_TOP = "env(safe-area-inset-top, 0px)";
const PETALS = [
  { l: 8, d: 0, t: 5.5, s: 11 }, { l: 24, d: 1.2, t: 6.5, s: 9 }, { l: 38, d: 0.4, t: 5, s: 12 },
  { l: 52, d: 2.1, t: 6.8, s: 10 }, { l: 66, d: 0.8, t: 5.8, s: 11 }, { l: 78, d: 1.6, t: 6.2, s: 9 },
  { l: 90, d: 0.2, t: 6.9, s: 12 },
];
// melts each cut-out's paper edge into the canvas (rectangle fade on all four sides)
const edge = "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, transparent 0, #000 10%, #000 90%, transparent 100%)";
const soft: CSSProperties = { WebkitMaskImage: edge, maskImage: edge, WebkitMaskComposite: "source-in", maskComposite: "intersect" };

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [rippling, setRippling] = useState(false);
  const [btnReady, setBtnReady] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const unit = useUnit<HTMLDivElement>();
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
    setStage(6); // lands on the end of the opening: couple text + cue, scroll unlocked
  };

  if (gone) return null;

  const on = (n: number) => stage >= n;
  const multiply: CSSProperties = { position: "absolute", mixBlendMode: "multiply", userSelect: "none" };
  const g1 = on(1) && !on(2); // Ganpati scene is on screen

  const pill: CSSProperties = {
    position: "absolute",
    right: u(34),
    top: `calc(${SAFE_TOP} + ${u(stage === 1 ? 96 : 58)})`,
    zIndex: 40,
    padding: `${u(7)} ${u(14)}`,
    borderRadius: 999,
    fontSize: u(13),
    lineHeight: 1.2,
    letterSpacing: "0.12em",
    color: MAROON,
    background: "rgba(247,230,186,.9)",
    border: "1px solid rgba(109,15,27,.25)",
    transition: "top 600ms ease-in-out",
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
      <div ref={unit.ref} style={{ ...unit.style, position: "relative", height: "100%", maxWidth: 430, margin: "0 auto" }}>
        <SceneFrame>
          {/* ---------- screen 3 / 4 art (canvas coordinates, anchored to the ground line) ---------- */}
          <ArtLayer src="/intro/arch.jpg" anchor="top" height={H.arch} mask={vFade("bottom", 14)} style={{ opacity: on(2) ? 1 : 0, transition: "opacity 1600ms ease-in-out 600ms" }} />
          <SceneArt src="/intro/palace.jpg" style={{ opacity: on(2) ? 1 : 0, transition: "opacity 1500ms ease-out 700ms" }} />
          <SceneArt
            src="/intro/couple.jpg"
            alt="The bride and groom in traditional Maharashtrian attire, looking at the palace"
            wipe={on(3)}
            style={{
              transform: on(3) ? "translateX(0)" : "translateX(60px)",
              transition: "mask-position 1600ms ease-in-out, -webkit-mask-position 1600ms ease-in-out, transform 1400ms ease-out",
            }}
          />

          {/* ---------- everything below is placed in SCREEN coordinates (u) ---------- */}
          <ScreenSpace>
            {/* screen 2: Ganpati */}
            <div style={{ position: "absolute", inset: 0, opacity: g1 ? 1 : 0, transition: on(2) ? "opacity 1800ms ease-in-out" : "opacity 900ms ease-in-out 400ms", pointerEvents: "none" }}>
              {/* golden halo, 300u across, centred behind Ganesh */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "46%",
                  width: u(300),
                  height: u(300),
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(242,163,58,.95) 0%, rgba(242,163,58,.35) 40%, rgba(242,163,58,0) 68%)",
                  transform: `translate(-50%, -50%) scale(${g1 ? 1.15 : 0.8})`,
                  opacity: g1 ? 0.5 : 0,
                  transition: "transform 2200ms ease-out 300ms, opacity 1600ms ease-out 300ms",
                }}
              />
              {/* marigold toran with the header: full inner width, drops in and settles */}
              <img
                src="/intro/toran.jpg"
                alt="Marigold toran: Shri Ganeshaya Namah"
                draggable={false}
                style={{
                  ...multiply,
                  left: u(32),
                  width: u(326),
                  top: u(36),
                  height: u(326 * (565 / 1175)),
                  WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
                  transform: on(1) ? "translateY(0)" : "translateY(calc(var(--u, 1px) * -120))",
                  transition: "transform 1500ms cubic-bezier(.34,1.3,.5,1)",
                }}
              />
              {/* Ganesh on the lotus: 240u x 270u, centred at 46% of the screen height */}
              <img
                src="/intro/ganesh.jpg"
                alt="Lord Ganesha seated on a lotus"
                draggable={false}
                style={{
                  ...multiply,
                  left: "50%",
                  top: "46%",
                  width: u(270 * (790 / 1080)),
                  height: u(270),
                  ...soft,
                  transform: `translate(-50%, -50%) scale(${on(1) ? 1 : 0.9})`,
                  opacity: on(1) ? 1 : 0,
                  transition: "transform 1300ms ease-out 400ms, opacity 1200ms ease-out 400ms",
                }}
              />
              {/* the two brass diyas: 46u x 150u, 26u from the border, bottom 70u */}
              {(["l", "r"] as const).map((side) => (
                <img
                  key={side}
                  src={`/intro/diya-${side}.jpg`}
                  alt=""
                  draggable={false}
                  style={{
                    ...multiply,
                    [side === "l" ? "left" : "right"]: u(22 + 26),
                    bottom: u(70),
                    width: u(46),
                    height: u(150),
                    ...soft,
                    opacity: on(1) ? 1 : 0,
                    transition: "opacity 1200ms ease-out 900ms",
                  }}
                />
              ))}
              {/* petals stay in the bottom strip, behind the calligraphy */}
              <div className="pointer-events-none absolute inset-x-0 overflow-hidden" style={{ bottom: u(22), height: u(110) }}>
                {PETALS.map((p, i) => (
                  <svg key={i} viewBox="0 0 10 14" className="zv-anim absolute" style={{ left: `${p.l}%`, top: 0, width: p.s, animation: on(1) ? `zv-petal-low ${p.t}s ease-in ${p.d}s infinite` : "none" }} aria-hidden>
                    <path d="M5 0 C9 3 10 9 5 14 C0 9 1 3 5 0Z" fill={i % 3 === 0 ? "#e9a23b" : "#d96a82"} opacity=".85" />
                  </svg>
                ))}
              </div>
              {/* "शुभ विवाह निमंत्रण": centred, bottom 56u, clear of the diya bases */}
              <img
                src="/intro/calli.jpg"
                alt="शुभ विवाह निमंत्रण"
                draggable={false}
                style={{
                  ...multiply,
                  left: "50%",
                  bottom: u(56),
                  width: u(190),
                  transform: "translateX(-50%)",
                  ...soft,
                  opacity: on(1) ? 1 : 0,
                  transition: "opacity 1200ms ease-out 700ms",
                }}
              />
            </div>

            {/* screen 3: invitation text + button (fades out when the couple arrives) */}
            <div style={{ position: "absolute", inset: 0, opacity: stage === 2 ? 1 : 0, transition: "opacity 500ms ease-in-out" }}>
              <InviteText show={on(2)} meetReady={btnReady && stage === 2} onMeet={meet} />
            </div>

            {/* screen 4: couple text + scroll cue (same component the page uses) */}
            <CoupleText show={on(3)} cueShow={on(4)} onCue={enter} />

            {/* screen 1: seal group, centred at 42% of the screen height */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden={stage !== 0}>
              <svg viewBox="0 0 200 110" style={{ position: "absolute", left: "50%", bottom: u(44), width: u(240), transform: "translateX(-50%)", opacity: stage === 0 && ready ? 0.15 : 0, transition: "opacity 700ms" }} fill="none" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" aria-hidden>
                <path d="M100 8 C122 34 122 64 100 88 C78 64 78 34 100 8Z" />
                <path d="M100 88 C70 86 46 68 40 38 C66 40 90 58 100 88Z M100 88 C130 86 154 68 160 38 C134 40 110 58 100 88Z" />
                <path d="M100 88 C60 94 28 80 14 56 C40 58 76 66 100 88Z M100 88 C140 94 172 80 186 56 C160 58 124 66 100 88Z" />
                <path d="M20 98 C60 108 140 108 180 98" />
              </svg>

              <div
                style={{ position: "absolute", left: 0, right: 0, top: "42%", transform: stage === 0 ? "translateY(-50%)" : "translateY(-50%) scale(1.2)", opacity: stage === 0 && ready ? 1 : 0, transition: "opacity 600ms ease-in-out, transform 600ms ease-in-out", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
              >
                <p lang="mr" className="font-marathi" style={{ fontSize: u(26), lineHeight: 1.2, color: MAROON, fontWeight: 600 }}>शुभमंगल सावधान</p>

                {/* 180u soft ring around the 140u seal; 20u above/16u below the text */}
                <div style={{ position: "relative", marginTop: u(20), width: u(180), height: u(180), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${u(1.5)} solid rgba(226,178,79,.55)`, background: "radial-gradient(circle, rgba(246,217,138,.28) 40%, rgba(246,217,138,0) 72%)" }} />
                  {rippling &&
                    [0, 1, 2].map((i) => (
                      <span key={i} className="zv-anim" style={{ position: "absolute", left: "50%", top: "50%", width: u(140), height: u(140), borderRadius: "50%", border: "2px solid #e2b24f", animation: `zv-ripple 1000ms ease-out ${i * 220}ms both` }} />
                    ))}
                  <div
                    className="zv-anim"
                    style={{
                      width: u(140),
                      height: u(140),
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 30%, #f6d98a, #c9963a 55%, #8f5f14)",
                      border: `${u(5)} double rgba(255,236,180,.9)`,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "zv-seal 2.5s ease-in-out infinite",
                    }}
                  >
                    <span lang="mr" className="font-marathi" style={{ fontSize: u(56), color: "#6d0f1b", fontWeight: 600, lineHeight: 1 }}>श्री</span>
                  </div>
                </div>

                <p lang="mr" className="font-marathi" style={{ marginTop: u(16), fontSize: u(22), lineHeight: 1.2, color: MAROON, fontWeight: 600 }}>निमंत्रण उघडा</p>
                <p className="zv-anim uppercase" style={{ marginTop: u(12), fontFamily: "Lato, system-ui, sans-serif", fontSize: u(14), letterSpacing: "0.2em", color: MAROON, fontWeight: 600, animation: "zv-hint 2s ease-in-out infinite" }}>
                  Tap to open
                </p>
              </div>
            </div>
          </ScreenSpace>
        </SceneFrame>

        {/* Skip + sound sit above the frame, 12u inside the border and below the notch */}
        {stage < 4 && (
          <button onClick={skip} style={pill}>
            Skip
          </button>
        )}
        {hasAudio && (
          <button onClick={() => setSoundOn((s) => !s)} aria-pressed={soundOn} aria-label={soundOn ? "Mute shehnai music" : "Play shehnai music"} style={{ ...pill, right: "auto", left: u(34) }}>
            {soundOn ? "Sound on" : "Sound off"}
          </button>
        )}
      </div>

      {/* the whole screen is tappable while waiting */}
      {stage === 0 && (
        <button autoFocus disabled={!ready} onClick={open} aria-label="Open the invitation. Tap anywhere to begin." className="absolute inset-0 cursor-pointer" style={{ outlineOffset: -8 }} />
      )}
    </div>
  );
}
