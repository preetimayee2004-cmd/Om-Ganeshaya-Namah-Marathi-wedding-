import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * "Shree Ganesh Mangal Aarambh": automatic opening, one continuous timeline (~9s).
 * stage 1 (0s)    bottle-green scene: bells, diya, "शुभारंभ"
 *       2 (1.5s)  flame -> zari thread draws Ganesha stroke by stroke
 *       3 (3.5s)  halo, mandala and lotus form; thread flows to the mandala's lower edge
 *       4 (5.0s)  cream ceremonial cloth unfolds, maroon drapes + tassels, Ganesha rides to the top
 *       5 (6.5s)  zari border draws itself, invitation text rises line by line
 *       6 (8.0s)  everything settles; the thread runs down toward the next section
 *       7 leaving, 8 gone
 * Only SVG stroke-dashoffset, transform, opacity and clip-path are animated.
 */
const T = [0, 100, 1600, 3600, 5100, 6600, 8100];
const FADE_MS = 900;

const BG = "#123C2E";
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
  "M60 696 V672 H72 V650 L85 626 L98 650 V672 H110 V696 M114 696 V660 L134 628 L154 660 V696 M85 626 V616 M134 628 V616";
const BORDER_OUTER = "M60 96 H340 Q352 96 352 108 V692 Q352 704 340 704 H60 Q48 704 48 692 V108 Q48 96 60 96Z";
const BORDER_INNER = "M66 105 H334 Q343 105 343 114 V686 Q343 695 334 695 H66 Q57 695 57 686 V114 Q57 105 66 105Z";
const BELLS: [number, number][] = [[34, 0], [66, 0.4], [334, 0.2], [366, 0.7]];

const ordinal = (n: number) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
};

function useWeddingDate() {
  return useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: wedding.timeZone }).formatToParts(new Date(wedding.date));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return { day: get("day"), suffix: ordinal(Number(get("day"))), month: get("month"), year: get("year") };
  }, []);
}

function Bell({ x, delay, swing }: { x: number; delay: number; swing: boolean }) {
  return (
    <g
      className="zari-anim"
      style={{
        transformOrigin: `${x}px 0px`,
        animation: swing ? `zari-swing 3.4s ease-in-out ${delay}s infinite` : "none",
        transform: swing ? undefined : "rotate(0deg)",
        transition: "transform 1600ms ease-out",
      }}
    >
      <path d={`M${x} 0 V46`} stroke={ANTIQUE} strokeWidth="1.2" />
      <path d={`M${x - 9} 74 Q${x - 9} 50 ${x} 46 Q${x + 9} 50 ${x + 9} 74 Z`} fill="url(#zBell)" />
      <rect x={x - 11} y="73" width="22" height="4" rx="2" fill={GOLD} />
      <circle cx={x} cy="81" r="3" fill={GOLD} />
    </g>
  );
}

function Tassel({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 104 V150`} stroke={GOLD} strokeWidth="1.4" />
      <circle cx={x} cy="152" r="5" fill={GOLD} />
      <path d={`M${x - 6} 158 L${x - 4} 196 M${x - 3} 158 L${x - 2} 198 M${x} 158 V200 M${x + 3} 158 L${x + 2} 198 M${x + 6} 158 L${x + 4} 196`} stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [size, setSize] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useScrollRoot();
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const date = useWeddingDate();
  const gone = stage >= 8;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => setSize(Math.min(el.clientWidth, el.clientHeight / 2));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gone]);

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

  // Automatic start: one timeline from page load. Reduced motion jumps to the finished invitation.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(6);
      return;
    }
    T.forEach((ms, i) => {
      if (i === 0) return;
      timers.current.push(window.setTimeout(() => setStage(i), ms));
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

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

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setStage(7);
    timers.current.push(window.setTimeout(() => setStage(8), FADE_MS));
  };
  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage(8);
  };

  if (gone) return null;

  const on = (n: number) => stage >= n;
  const draw = (n: number, delay: number, dur = 900): CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: on(n) ? 0 : 1,
    transition: `stroke-dashoffset ${dur}ms ease-in-out ${delay}ms`,
  });
  const rise = (i: number): CSSProperties => ({
    opacity: on(5) ? 1 : 0,
    transform: on(5) ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 800ms ease-in-out ${i * 220}ms, transform 800ms ease-in-out ${i * 220}ms`,
  });
  const cqw = (n: number): CSSProperties => ({ fontSize: `${n}cqw` });
  const [first, second] = coupleOrder;
  const settled = on(6);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Opening invitation animation"
      className="z-[90] flex items-center justify-center overflow-hidden"
      style={{
        position: scroller ? "absolute" : "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: scroller ? scroller.clientHeight : "100dvh",
        inset: scroller ? undefined : 0,
        background: `radial-gradient(ellipse at 50% 40%, #1d4a3a 0%, ${BG} 62%, #0a251c 100%)`,
        opacity: stage === 7 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      <style>{`
        @keyframes zari-flicker { 0%,100% { transform: scale(1,1) } 30% { transform: scale(.94,1.06) } 55% { transform: scale(1.04,.96) } 80% { transform: scale(.97,1.04) } }
        @keyframes zari-twinkle { 0%,100% { opacity: .15 } 50% { opacity: .9 } }
        @keyframes zari-spin { to { transform: rotate(360deg) } }
        @keyframes zari-swing { 0%,100% { transform: rotate(-2.5deg) } 50% { transform: rotate(2.5deg) } }
        @media (prefers-reduced-motion: reduce) { .zari-anim { animation: none !important } }
      `}</style>

      {/* Maharashtrian textile pattern, very faint */}
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'url("/bg/vine.png")', backgroundSize: "240px auto" }} />

      <div className="relative" style={{ width: size, height: size * 2, containerType: "inline-size", visibility: size ? "visible" : "hidden" }}>
        {/* ---------- back layer ---------- */}
        <svg viewBox="0 0 400 800" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <defs>
            <radialGradient id="zGlow">
              <stop offset="0" stopColor="#ffb347" stopOpacity=".5" />
              <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="zFlame" cx="50%" cy="70%" r="60%">
              <stop offset="0" stopColor="#fff1b8" />
              <stop offset="1" stopColor="#ff8a1f" />
            </radialGradient>
            <linearGradient id="zBowl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6cf7a" />
              <stop offset="1" stopColor="#a8762e" />
            </linearGradient>
            <linearGradient id="zBell" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b8862f" />
              <stop offset=".5" stopColor="#f2cf7a" />
              <stop offset="1" stopColor="#9a6c22" />
            </linearGradient>
          </defs>

          {/* warm halo behind Ganesha */}
          <circle cx="200" cy="330" r="190" fill="url(#zGlow)" style={{ opacity: on(3) && !on(4) ? 1 : 0, transition: "opacity 1600ms ease-in-out" }} />

          {/* mandala */}
          <g style={{ transform: "translate(200px,330px)", opacity: on(4) ? 0 : 1, transition: "opacity 1400ms ease-in-out" }}>
            <g className="zari-anim" style={{ animation: on(3) ? "zari-spin 90s linear infinite" : undefined }}>
              <g stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" opacity=".9">
                <circle r="118" pathLength={1} strokeDasharray="0.004 0.006" style={{ opacity: on(3) ? 1 : 0, transition: "opacity 1500ms ease-in-out" }} />
                <circle r="108" pathLength={1} style={draw(3, 0, 1800)} />
                <circle r="76" pathLength={1} style={draw(3, 200, 1600)} />
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d={PETAL} pathLength={1} transform={`rotate(${i * 30})`} style={draw(3, 300 + i * 70, 1000)} />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={`s${i}`} d={PETAL} pathLength={1} transform={`rotate(${i * 30 + 15}) scale(.7)`} style={draw(3, 700 + i * 70, 1000)} />
                ))}
              </g>
            </g>
          </g>

          {/* lotus unfolds beneath Ganesha, with the thread flowing off its lower edge */}
          <g stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" style={{ opacity: on(4) ? 0 : 1, transition: "opacity 1400ms ease-in-out" }}>
            <path d="M200 492 Q182 472 200 452 Q218 472 200 492Z" pathLength={1} style={draw(3, 400, 1300)} />
            <path d="M200 492 Q168 488 160 464 Q184 464 200 492 M200 492 Q232 488 240 464 Q216 464 200 492" pathLength={1} style={draw(3, 700, 1300)} />
            <path d="M150 498 Q200 484 250 498" pathLength={1} style={draw(3, 1000, 1100)} />
            <path d="M200 498 C 214 520 186 540 200 566" pathLength={1} style={draw(3, 1300, 1200)} />
          </g>

          {/* idle ornament under the diya */}
          <g stroke={GOLD} strokeWidth="1" style={{ opacity: on(2) ? 0 : 0.5, transition: "opacity 800ms ease-in-out" }}>
            <ellipse cx="200" cy="650" rx="120" ry="22" />
            <ellipse cx="200" cy="650" rx="92" ry="16" strokeDasharray="3 5" />
            <ellipse cx="200" cy="650" rx="64" ry="11" />
          </g>

          {/* zari thread: flame -> Ganesha's crown */}
          <g style={{ filter: on(2) && !on(4) ? "drop-shadow(0 0 4px rgba(255,170,60,.9))" : "none" }}>
            <path
              d="M200 596 C150 548 250 500 200 452 S150 300 200 214"
              pathLength={1}
              stroke={GOLD}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: on(2) ? 0 : 1, opacity: on(3) ? 0 : 1, transition: "stroke-dashoffset 1300ms ease-in-out, opacity 1600ms ease-in-out" }}
            />
          </g>

          {/* sparks that follow the thread */}
          <g fill={GOLD} style={{ opacity: on(2) && !on(6) ? 1 : 0, transition: "opacity 1200ms ease-in-out" }}>
            {SPARKS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.6" className="zari-anim" style={{ animation: `zari-twinkle ${2 + (i % 3) * 0.6}s ease-in-out ${i * 0.18}s infinite` }} />
            ))}
          </g>

          {/* diya: fades in, flame lengthens into the thread */}
          <g style={{ opacity: on(1) ? 1 : 0, transition: "opacity 1200ms ease-in-out" }}>
            <g style={{ transformOrigin: "200px 606px", transform: on(2) ? "scaleY(2.8) scaleX(.5)" : "none", opacity: on(2) ? 0 : 1, transition: "transform 1300ms ease-in-out, opacity 1300ms ease-in-out" }}>
              <g className="zari-anim" style={{ transformOrigin: "200px 606px", animation: "zari-flicker 2.4s ease-in-out infinite" }}>
                <path d="M200 560 Q216 584 200 606 Q184 584 200 560Z" fill="url(#zFlame)" />
              </g>
            </g>
            <path d="M162 610 Q200 656 238 610 Z" fill="url(#zBowl)" />
            <path d="M156 608 H244" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
            <circle cx="200" cy="609" r="40" fill="url(#zGlow)" style={{ opacity: settled ? 0.25 : 0.5, transition: "opacity 1600ms" }} />
          </g>
        </svg>

        {/* ---------- scene-1 copy ---------- */}
        <div
          className="pointer-events-none absolute inset-x-0 text-center"
          style={{ top: "54%", color: GOLD, opacity: on(1) && !on(2) ? 1 : 0, transition: "opacity 900ms ease-in-out" }}
        >
          <p lang="mr" className="font-marathi" style={{ ...cqw(5.6), letterSpacing: ".02em" }}>
            ॥ श्री गणेशाय नमः ॥
          </p>
          <div className="mx-auto my-[3cqw] h-px w-[40cqw]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        </div>
        <p
          lang="mr"
          className="font-marathi pointer-events-none absolute inset-x-0 text-center"
          style={{ top: "87%", ...cqw(5), color: GOLD, opacity: on(1) && !on(2) ? 1 : 0, transition: "opacity 900ms ease-in-out" }}
        >
          शुभारंभ
        </p>

        {/* ---------- ceremonial cloth: unfolds from behind the mandala ---------- */}
        <div
          className="absolute"
          style={{
            left: "12%",
            top: "12%",
            width: "76%",
            height: "76%",
            background: "radial-gradient(ellipse at 50% 40%, #fbeccb 0%, #f4dfb4 70%, #e9c98d 100%)",
            boxShadow: "0 0 40px rgba(226,168,75,.25), inset 0 0 40px rgba(168,118,46,.25)",
            clipPath: on(4) ? "inset(0% 0% 0% 0% round 8px)" : "inset(37% 0% 63% 0% round 8px)",
            transition: "clip-path 1700ms cubic-bezier(.45,0,.25,1)",
          }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(168,118,46,.07) 0 14px, transparent 14px 30px), radial-gradient(rgba(168,118,46,.18) 1px, transparent 1px)", backgroundSize: "auto, 9px 9px" }} />
        </div>

        {/* maroon silk drapes slide in from the edges */}
        {(["left", "right"] as const).map((side) => (
          <div
            key={side}
            className="absolute top-0"
            style={{
              [side]: 0,
              width: "13%",
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(0,0,0,.35), transparent 30%, rgba(255,255,255,.08) 55%, transparent 75%, rgba(0,0,0,.3)), repeating-linear-gradient(90deg, #5a0f1c 0 18%, #7a1a28 18% 36%, #3d0912 36% 52%)",
              borderRadius: side === "left" ? "0 60px 140px 0 / 0 40px 90px 0" : "60px 0 0 140px / 40px 0 0 90px",
              boxShadow: side === "left" ? "6px 0 18px rgba(0,0,0,.45)" : "-6px 0 18px rgba(0,0,0,.45)",
              transform: on(4) ? "translateX(0)" : `translateX(${side === "left" ? "-105%" : "105%"})`,
              transition: "transform 1700ms cubic-bezier(.45,0,.25,1)",
            }}
          />
        ))}

        {/* ---------- front layer: bells, tassels, border, temple, Ganesha ---------- */}
        <svg viewBox="0 0 400 800" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <g style={{ opacity: on(1) ? 1 : 0, transition: "opacity 1400ms ease-in-out" }}>
            {BELLS.map(([x, d]) => (
              <Bell key={x} x={x} delay={d} swing={!settled} />
            ))}
          </g>
          <g style={{ opacity: on(4) ? 1 : 0, transition: "opacity 1200ms ease-in-out 900ms" }}>
            <Tassel x={40} />
            <Tassel x={360} />
          </g>

          <g strokeLinecap="round" style={{ filter: on(5) && !settled ? "drop-shadow(0 0 3px rgba(226,168,75,.8))" : "none" }}>
            <path d={BORDER_OUTER} pathLength={1} stroke={ANTIQUE} strokeWidth="2.2" style={draw(5, 0, 2200)} />
            <path d={BORDER_INNER} pathLength={1} stroke={ANTIQUE} strokeWidth="1" opacity=".8" style={draw(5, 500, 2200)} />
          </g>
          <g stroke={ANTIQUE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
            <path d={TEMPLE} pathLength={1} style={draw(5, 900, 1600)} />
            <path d={TEMPLE} pathLength={1} transform="translate(400 0) scale(-1 1)" style={draw(5, 900, 1600)} />
          </g>

          {/* the thread continues down from the invitation: link to the next section */}
          <path d="M200 704 C 190 730 210 750 200 800" pathLength={1} stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" style={draw(6, 0, 1800)} />

          {/* Ganesha: drawn stroke by stroke, then rides up to the top of the invitation */}
          <g
            style={{
              transformOrigin: "0 0",
              transform: on(4) ? "translate(166px,118px) scale(.34)" : "translate(115px,220px) scale(.85)",
              transition: "transform 1800ms cubic-bezier(.45,0,.25,1)",
              filter: on(4) ? "none" : "drop-shadow(0 0 5px rgba(255,160,50,.95))",
            }}
          >
            <g
              stroke={on(4) ? ANTIQUE : "#ffbf5e"}
              strokeWidth={on(4) ? 3.6 : 1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 1600ms ease-in-out, stroke-width 1600ms ease-in-out" }}
            >
              {GANESHA.map((d, i) => (
                <path key={i} d={d} pathLength={1} style={draw(2, 300 + i * 150, 900)} />
              ))}
            </g>
          </g>
        </svg>

        {/* ---------- invitation copy ---------- */}
        <div
          className="absolute flex flex-col items-center text-center"
          style={{ left: "12%", top: "12%", width: "76%", height: "76%", paddingTop: "20%", color: "#3a1a12" }}
        >
          <p lang="mr" className="font-marathi" style={{ ...cqw(4.2), color: "#6B1624", ...rise(0) }}>॥ श्री गणेशाय नमः ॥</p>
          <p className="font-body" style={{ ...cqw(3.7), marginTop: "3cqw", ...rise(1) }}>Together with their families</p>
          <p className="font-script" style={{ ...cqw(14), lineHeight: 1, marginTop: "3cqw", color: "#6B1624", ...rise(2) }}>{first}</p>
          <p className="font-script" style={{ ...cqw(7.5), lineHeight: 1, color: ANTIQUE, ...rise(3) }}>&amp;</p>
          <p className="font-script" style={{ ...cqw(14), lineHeight: 1, color: "#6B1624", ...rise(4) }}>{second}</p>
          <p className="font-body" style={{ ...cqw(4.6), marginTop: "6cqw", ...rise(5) }}>
            {date.day}
            <sup style={{ fontSize: ".6em" }}>{date.suffix}</sup> {date.month} {date.year}
          </p>
          <p className="font-body" style={{ ...cqw(3.4), marginTop: "1cqw", opacity: on(5) ? 0.8 : 0, transition: "opacity 800ms ease-in-out 1.5s" }}>at</p>
          <p className="font-body" style={{ ...cqw(4), marginTop: "1cqw", ...rise(7) }}>{wedding.venue.name}</p>
          <p className="font-body" style={{ ...cqw(3.6), opacity: on(5) ? 0.85 : 0, transition: "opacity 800ms ease-in-out 2s" }}>{wedding.venue.city}</p>
        </div>

        {/* continue: sits where the thread ends */}
        <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "1.2%" }}>
          <button
            onClick={finish}
            tabIndex={settled ? 0 : -1}
            className="rounded-full border font-body uppercase"
            style={{
              ...cqw(3),
              letterSpacing: ".25em",
              padding: "2.2cqw 7cqw",
              color: GOLD,
              borderColor: GOLD,
              background: "rgba(18,60,46,.85)",
              opacity: settled ? 1 : 0,
              pointerEvents: settled ? "auto" : "none",
              transition: "opacity 900ms ease-in-out 1.6s",
            }}
          >
            View Invitation
          </button>
        </div>
      </div>

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
