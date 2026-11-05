import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * "Shree Ganesh: The Sacred Invitation Reveal"
 * One continuous sequence driven by a stage number (0 = waiting for tap):
 *  1 tap     diya flame becomes a golden thread that draws Ganesha         (0s)
 *  2 blessing glow + mandala + lotus form around Ganesha                    (+3.0s)
 *  3 reveal   parchment unfolds, border drawn by the thread, Ganesha rises  (+4.5s)
 *  4 text     invitation lines fade up in turn                              (+6.0s)
 *  5 ready    "View Invitation" appears                                     (+8.0s)
 *  6 leaving  overlay fades out, 7 = gone
 * Everything is SVG stroke-dash / transform / opacity / clip-path (compositor friendly).
 */
const T = { glow: 3000, reveal: 4500, text: 6000, ready: 8000 };
const FADE_MS = 900;

const MAROON = "#3B0710";
const GOLD = "#E2A84B";
const ANTIQUE = "#A8762E";

const GANESHA = [
  "M72 70 Q100 54 128 70 M80 62 L100 26 L120 62 M86 62 Q100 48 114 62 M98 19 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0",
  "M72 70 Q60 104 76 132 Q86 148 93 168",
  "M128 70 Q140 104 124 132 Q114 148 107 168",
  "M70 80 Q28 54 20 98 Q14 140 60 146 Q74 134 76 118",
  "M130 80 Q172 54 180 98 Q186 140 140 146 Q126 134 124 118",
  "M82 100 q7 -6 14 0 M104 100 q7 -6 14 0 M100 78 v18 M93 84 q7 9 14 0",
  "M95 108 Q92 150 95 174 Q98 198 120 202 Q138 204 134 186 Q132 178 124 182",
  "M105 108 Q108 148 106 170 Q106 184 118 190 Q126 192 126 186 M86 152 q-12 14 -3 30",
  "M64 150 Q50 196 40 244 M136 150 Q150 196 160 244 M72 160 Q100 190 128 160",
  "M60 250 Q100 226 140 250 M72 250 Q100 238 128 250",
];

const PETAL = "M0 -104 Q14 -86 0 -70 Q-14 -86 0 -104Z";
const SPARKS = [
  [176, 560], [226, 520], [168, 470], [232, 430], [182, 390], [222, 350], [190, 300], [214, 262], [172, 240], [228, 226], [200, 190], [160, 330],
];

const TEMPLE =
  "M50 696 V672 H62 V650 L75 626 L88 650 V672 H100 V696 M104 696 V660 L124 628 L144 660 V696 M75 626 V616 M124 628 V616";
const BORDER_OUTER =
  "M44 96 H356 Q368 96 368 108 V692 Q368 704 356 704 H44 Q32 704 32 692 V108 Q32 96 44 96Z";
const BORDER_INNER =
  "M50 105 H350 Q359 105 359 114 V686 Q359 695 350 695 H50 Q41 695 41 686 V114 Q41 105 50 105Z";

const ordinal = (n: number) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
};

function useWeddingDate() {
  return useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: wedding.timeZone,
    }).formatToParts(new Date(wedding.date));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return { day: get("day"), suffix: ordinal(Number(get("day"))), month: get("month"), year: get("year") };
  }, []);
}

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [size, setSize] = useState(0); // scene width in px (scene is 1:2)
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const date = useWeddingDate();

  // Fit a 1:2 scene inside whatever box we have (full phone screen or mockup screen).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => setSize(Math.min(el.clientWidth, el.clientHeight / 2));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage === 7]);

  // Lock scrolling while the overlay is up.
  useEffect(() => {
    if (stage >= 7) return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    scroller?.scrollTo(0, 0);
    return () => {
      el.style.overflow = prev;
    };
  }, [stage >= 7, scroller]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Sound toggle only appears if a sanai file has actually been supplied.
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStage(5); // CSS also collapses transitions: go straight to the finished invitation
      return;
    }
    setStage(1);
    later(() => setStage(2), T.glow);
    later(() => setStage(3), T.reveal);
    later(() => setStage(4), T.text);
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

  if (stage >= 7) return null;

  const on = (n: number) => stage >= n;
  const draw = (n: number, delay: number, dur = 900): CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: on(n) ? 0 : 1,
    transition: `stroke-dashoffset ${dur}ms ease-in-out ${delay}ms`,
  });
  const rise = (n: number, i: number): CSSProperties => ({
    opacity: on(n) ? 1 : 0,
    transform: on(n) ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 900ms ease-in-out ${i * 260}ms, transform 900ms ease-in-out ${i * 260}ms`,
  });

  const cqw = (n: number): CSSProperties => ({ fontSize: `${n}cqw` });

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Opening invitation animation"
      className="z-[90] flex items-center justify-center overflow-hidden"
      style={{
        position: scroller ? "absolute" : "fixed",
        top: scroller ? 0 : 0,
        left: 0,
        width: "100%",
        height: scroller ? scroller.clientHeight : "100dvh",
        inset: scroller ? undefined : 0,
        background: `radial-gradient(ellipse at 50% 40%, #5a0f1c 0%, ${MAROON} 62%, #240409 100%)`,
        opacity: stage === 6 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      <style>{`
        @keyframes zari-flicker { 0%,100% { transform: scale(1,1) } 30% { transform: scale(.94,1.06) } 55% { transform: scale(1.04,.96) } 80% { transform: scale(.97,1.04) } }
        @keyframes zari-twinkle { 0%,100% { opacity: .15 } 50% { opacity: .9 } }
        @keyframes zari-spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) { .zari-anim { animation: none !important } }
      `}</style>

      {/* faint textile weave */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #E2A84B 0 1px, transparent 1px 10px), repeating-linear-gradient(-45deg, #E2A84B 0 1px, transparent 1px 10px)",
        }}
      />

      {/* 1:2 scene; text sizes use container-query width so everything scales together */}
      <div
        className="relative"
        style={{ width: size, height: size * 2, containerType: "inline-size", visibility: size ? "visible" : "hidden" }}
      >
        {/* ---------- back layer: diya, thread, glow, mandala ---------- */}
        <svg viewBox="0 0 400 800" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <defs>
            <radialGradient id="zGlow">
              <stop offset="0" stopColor="#ff9f3a" stopOpacity=".55" />
              <stop offset="1" stopColor="#ff9f3a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="zFlame" cx="50%" cy="70%" r="60%">
              <stop offset="0" stopColor="#fff1b8" />
              <stop offset="1" stopColor="#ff8a1f" />
            </radialGradient>
            <linearGradient id="zBowl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6cf7a" />
              <stop offset="1" stopColor="#a8762e" />
            </linearGradient>
          </defs>

          {/* soft blessing glow behind Ganesha */}
          <circle cx="200" cy="330" r="190" fill="url(#zGlow)" style={{ opacity: on(2) && !on(3) ? 1 : on(3) ? 0 : 0, transition: "opacity 1800ms ease-in-out" }} />

          {/* mandala */}
          <g
            style={{ transform: "translate(200px,330px)", opacity: on(3) ? 0 : 1, transition: "opacity 1400ms ease-in-out" }}
          >
            <g className="zari-anim" style={{ animation: on(2) ? "zari-spin 90s linear infinite" : undefined }}>
              <g stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" opacity=".9">
                <circle r="118" pathLength={1} strokeDasharray="0.004 0.006" style={{ opacity: on(2) ? 1 : 0, transition: "opacity 1500ms ease-in-out" }} />
                <circle r="108" pathLength={1} style={draw(2, 0, 2200)} />
                <circle r="76" pathLength={1} style={draw(2, 300, 2000)} />
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d={PETAL} pathLength={1} transform={`rotate(${i * 30})`} style={draw(2, 400 + i * 90, 1200)} />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={`s${i}`} d={PETAL} pathLength={1} transform={`rotate(${i * 30 + 15}) scale(.7)`} style={draw(2, 900 + i * 90, 1200)} />
                ))}
              </g>
            </g>
          </g>

          {/* lotus at the base of the mandala */}
          <g stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" style={{ opacity: on(3) ? 0 : 1, transition: "opacity 1400ms ease-in-out" }}>
            <path d="M200 492 Q182 472 200 452 Q218 472 200 492Z" pathLength={1} style={draw(2, 500, 1400)} />
            <path d="M200 492 Q168 488 160 464 Q184 464 200 492 M200 492 Q232 488 240 464 Q216 464 200 492" pathLength={1} style={draw(2, 800, 1400)} />
            <path d="M150 498 Q200 484 250 498" pathLength={1} style={draw(2, 1100, 1200)} />
          </g>

          {/* idle ornament under the diya */}
          <g stroke={GOLD} strokeWidth="1" opacity=".5" style={{ opacity: on(1) ? 0 : 0.5, transition: "opacity 800ms ease-in-out" }}>
            <ellipse cx="200" cy="650" rx="120" ry="22" />
            <ellipse cx="200" cy="650" rx="92" ry="16" strokeDasharray="3 5" />
            <ellipse cx="200" cy="650" rx="64" ry="11" />
          </g>

          {/* the golden zari thread: flame -> up to Ganesha's crown */}
          <g style={{ filter: on(1) && !on(3) ? "drop-shadow(0 0 4px rgba(255,170,60,.9))" : "none" }}>
            <path
              d="M200 596 C150 548 250 500 200 452 S150 300 200 214"
              pathLength={1}
              stroke={GOLD}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ ...draw(1, 0, 1500), opacity: on(2) ? 0.0 : 1, transition: `stroke-dashoffset 1500ms ease-in-out, opacity 1600ms ease-in-out` }}
            />
          </g>

          {/* sparks that follow the thread */}
          <g fill={GOLD} style={{ opacity: on(1) && !on(3) ? 1 : 0, transition: "opacity 900ms ease-in-out" }}>
            {SPARKS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.6" className="zari-anim" style={{ animation: `zari-twinkle ${2 + (i % 3) * 0.6}s ease-in-out ${i * 0.18}s infinite` }} />
            ))}
          </g>

          {/* diya */}
          <g>
            <g style={{ transformOrigin: "200px 606px", transform: on(1) ? "scaleY(2.8) scaleX(.5)" : "none", opacity: on(1) ? 0 : 1, transition: "transform 1300ms ease-in-out, opacity 1300ms ease-in-out" }}>
              <g className="zari-anim" style={{ transformOrigin: "200px 606px", animation: "zari-flicker 2.4s ease-in-out infinite" }}>
                <path d="M200 560 Q216 584 200 606 Q184 584 200 560Z" fill="url(#zFlame)" />
              </g>
            </g>
            <path d="M162 610 Q200 656 238 610 Z" fill="url(#zBowl)" />
            <path d="M156 608 H244" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
            <circle cx="200" cy="609" r="40" fill="url(#zGlow)" opacity=".5" style={{ opacity: on(1) ? 0 : 0.5, transition: "opacity 1200ms" }} />
          </g>
        </svg>

        {/* ---------- idle copy ---------- */}
        <div
          className="pointer-events-none absolute inset-x-0 text-center"
          style={{ top: "34%", opacity: on(1) ? 0 : 1, transition: "opacity 700ms ease-in-out", color: GOLD }}
        >
          <p lang="mr" className="font-marathi" style={{ ...cqw(5.6), letterSpacing: ".02em" }}>
            ॥ श्री गणेशाय नमः ॥
          </p>
          <div className="mx-auto my-[3cqw] h-px w-[40cqw]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
          <p lang="mr" className="font-marathi" style={{ ...cqw(4.2), opacity: 0.9 }}>
            उघडण्यासाठी स्पर्श करा
          </p>
          <p className="mt-[2cqw] font-body uppercase" style={{ ...cqw(2.6), letterSpacing: ".3em", opacity: 0.6 }}>
            Tap to open
          </p>
        </div>

        {/* ---------- parchment (unfolds from the centre line) ---------- */}
        <div
          className="absolute"
          style={{
            left: "8%",
            top: "12%",
            width: "84%",
            height: "76%",
            background:
              "radial-gradient(ellipse at 50% 40%, #fbeccb 0%, #f4dfb4 70%, #e9c98d 100%)",
            boxShadow: "0 0 40px rgba(226,168,75,.25), inset 0 0 40px rgba(168,118,46,.25)",
            clipPath: on(3) ? "inset(0% 0% 0% 0% round 12px)" : "inset(50% 0% 50% 0% round 12px)",
            transition: "clip-path 1700ms cubic-bezier(.45,0,.25,1)",
          }}
        >
          <div className="absolute inset-0 opacity-[.35]" style={{ backgroundImage: "radial-gradient(rgba(168,118,46,.18) 1px, transparent 1px)", backgroundSize: "9px 9px" }} />
        </div>

        {/* ---------- front layer: border drawn by the thread, temple, Ganesha ---------- */}
        <svg viewBox="0 0 400 800" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <g strokeLinecap="round" style={{ filter: on(3) && !on(4) ? "drop-shadow(0 0 3px rgba(226,168,75,.8))" : "none" }}>
            <path d={BORDER_OUTER} pathLength={1} stroke={ANTIQUE} strokeWidth="2.2" style={draw(3, 700, 2600)} />
            <path d={BORDER_INNER} pathLength={1} stroke={ANTIQUE} strokeWidth="1" opacity=".8" style={draw(3, 1300, 2600)} />
          </g>
          <g stroke={ANTIQUE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
            <path d={TEMPLE} pathLength={1} style={draw(3, 2200, 1800)} />
            <path d={TEMPLE} pathLength={1} transform="translate(400 0) scale(-1 1)" style={draw(3, 2200, 1800)} />
          </g>

          {/* Ganesha: drawn by the thread, then rides up to the top of the invitation */}
          <g
            style={{
              transformOrigin: "0 0",
              transform: on(3) ? "translate(166px,118px) scale(.34)" : "translate(115px,220px) scale(.85)",
              transition: "transform 1900ms cubic-bezier(.45,0,.25,1)",
              filter: on(3) ? "none" : "drop-shadow(0 0 5px rgba(255,160,50,.95))",
            }}
          >
            <g
              stroke={on(3) ? ANTIQUE : "#ffbf5e"}
              strokeWidth={on(3) ? 3.6 : 1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 1600ms ease-in-out, stroke-width 1600ms ease-in-out" }}
            >
              {GANESHA.map((d, i) => (
                <path key={i} d={d} pathLength={1} style={draw(1, 1400 + i * 230, 1000)} />
              ))}
            </g>
          </g>
        </svg>

        {/* ---------- invitation copy ---------- */}
        <div
          className="absolute flex flex-col items-center text-center"
          style={{ left: "8%", top: "12%", width: "84%", height: "76%", paddingTop: "21%", color: "#5a1420" }}
        >
          <p lang="mr" className="font-marathi" style={{ ...cqw(4.6), color: "#722B35", ...rise(4, 0) }}>
            ॥ श्री गणेशाय नमः ॥
          </p>
          <p className="font-body" style={{ ...cqw(3.9), marginTop: "3cqw", ...rise(4, 1) }}>
            Together with their families
          </p>
          <p className="font-script" style={{ ...cqw(16), lineHeight: 1, marginTop: "3cqw", color: "#722B35", ...rise(4, 2) }}>
            {wedding.couple.bride}
          </p>
          <p className="font-script" style={{ ...cqw(8), lineHeight: 1, color: ANTIQUE, ...rise(4, 3) }}>
            &amp;
          </p>
          <p className="font-script" style={{ ...cqw(16), lineHeight: 1, color: "#722B35", ...rise(4, 4) }}>
            {wedding.couple.groom}
          </p>
          <p className="font-body" style={{ ...cqw(5), marginTop: "6cqw", ...rise(4, 5) }}>
            {date.day}
            <sup style={{ fontSize: ".6em" }}>{date.suffix}</sup> {date.month} {date.year}
          </p>
          <p className="font-body" style={{ ...cqw(3.6), marginTop: "1cqw", opacity: on(4) ? 0.8 : 0, transition: "opacity 900ms ease-in-out 1.6s" }}>
            at
          </p>
          <p className="font-body" style={{ ...cqw(4.4), marginTop: "1cqw", ...rise(4, 7) }}>
            {wedding.venue.name}
          </p>
          <p className="font-body" style={{ ...cqw(3.8), opacity: on(4) ? 0.85 : 0, transition: "opacity 900ms ease-in-out 2.1s" }}>
            {wedding.venue.city}
          </p>
        </div>

        {/* continue */}
        <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "2.2%" }}>
          <button
            onClick={finish}
            tabIndex={on(5) ? 0 : -1}
            className="rounded-full border font-body uppercase"
            style={{
              ...cqw(3),
              letterSpacing: ".25em",
              padding: "2.4cqw 7cqw",
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

      {/* controls */}
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
