import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Sacred invitation reveal (tap to open), one continuous motion path:
 *  1  Ganesha is drawn by the golden thread (reference artwork, revealed from the diya upward)
 *  2  a subtle zari mandala forms around Ganesha
 *  3  the thread flows down from the mandala to the top of the parchment
 *  4  the thread traces the parchment border while the parchment unfolds downward from it,
 *     maroon drapes ease in, and the glowing Ganesha travels into the top-centre emblem
 *  5  invitation typography rises line by line
 *  6  settled: "View Invitation"
 *  7 leaving, 8 gone
 * Only SVG stroke-dashoffset, transform, opacity and clip-path are animated.
 */
const T = [0, 0, 3200, 4400, 5200, 7000, 8800];
const FADE_MS = 900;
const EASE = "cubic-bezier(.45,0,.25,1)";
const GOLD = "#E2A84B";
const ANTIQUE = "#A8762E";
const WINE = "#6B1624";

// reference plate geometry (public/intro/p2.jpg is 700x643 native)
const P2 = { w: 700, h: 643, focusX: 0.36, ganesha: { x: 150, y: 30, w: 305, h: 315 }, cx: 290, cy: 190 };
const PLATES = ["p1", "p2"].map((n) => `/intro/${n}.jpg`);
const petal = (R: number) => `M0 ${-R} Q${0.09 * R} ${-0.78 * R} 0 ${-0.58 * R} Q${-0.09 * R} ${-0.78 * R} 0 ${-R}Z`;

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

function Tassel({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={GOLD} strokeLinecap="round" strokeWidth="1.3" fill="none">
      <path d={`M${x} ${y} V${y + 34}`} />
      <circle cx={x} cy={y + 37} r="4.2" fill={GOLD} stroke="none" />
      <path d={`M${x - 5} ${y + 42} L${x - 3.5} ${y + 74} M${x - 2.5} ${y + 42} L${x - 1.5} ${y + 76} M${x} ${y + 42} V${y + 77} M${x + 2.5} ${y + 42} L${x + 1.5} ${y + 76} M${x + 5} ${y + 42} L${x + 3.5} ${y + 74}`} />
    </g>
  );
}

export default function Intro() {
  const [stage, setStage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
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
    const fit = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gone]);

  useEffect(() => {
    ["/intro/ganesha-glow.png", "/intro/emblem.png", "/intro/band.jpg", PLATES[1]].forEach((src) => {
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
      setStage(6);
      return;
    }
    T.forEach((ms, i) => (i === 0 ? null : i === 1 ? setStage(1) : later(() => setStage(i), ms)));
  };

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setStage(7);
    later(() => setStage(8), FADE_MS);
  };
  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage(8);
  };

  // ---- geometry (px, from the overlay size) ----
  const { w: W, h: H } = box;
  const g = useMemo(() => {
    const s = Math.max(W / P2.w, H / P2.h);
    const offX = (W - P2.w * s) * P2.focusX;
    const offY = (H - P2.h * s) * 0.5;
    const ph = H * 0.88;
    const pw = Math.min(W * 0.88, ph * 0.62, 480);
    const px = (W - pw) / 2;
    const py = (H - ph) / 2 - H * 0.012;
    const gan = P2.ganesha;
    const gl = offX + gan.x * s, gt = offY + gan.y * s, gw = gan.w * s, gh = gan.h * s;
    const gcx = gl + gw / 2, gcy = gt + gh / 2;
    // emblem slot inside the parchment
    const eh = ph * 0.125;
    const ecx = W / 2, ecy = py + ph * 0.04 + eh / 2;
    const k = (eh * 1.55) / gh; // glowing Ganesha shrinks to ~1.5x the emblem height, then crossfades
    const mx = offX + P2.cx * s, my = offY + P2.cy * s; // mandala centre = Ganesha's body
    const R = Math.min(W * 0.46, 190);
    const r = 12;
    const cx = W / 2;
    const left = `M${cx} ${py} H${px + r} Q${px} ${py} ${px} ${py + r} V${py + ph - r} Q${px} ${py + ph} ${px + r} ${py + ph} H${cx}`;
    const right = `M${cx} ${py} H${px + pw - r} Q${px + pw} ${py} ${px + pw} ${py + r} V${py + ph - r} Q${px + pw} ${py + ph} ${px + pw - r} ${py + ph} H${cx}`;
    const ii = 7; // inner border inset
    const li = `M${cx} ${py + ii} H${px + r} Q${px + ii} ${py + ii} ${px + ii} ${py + r} V${py + ph - r} Q${px + ii} ${py + ph - ii} ${px + r} ${py + ph - ii} H${cx}`;
    const ri = `M${cx} ${py + ii} H${px + pw - r} Q${px + pw - ii} ${py + ii} ${px + pw - ii} ${py + r} V${py + ph - r} Q${px + pw - ii} ${py + ph - ii} ${px + pw - r} ${py + ph - ii} H${cx}`;
    const dw = Math.max(W * 0.1, (W - pw) / 2 + pw * 0.06);
    return { s, gl, gt, gw, gh, gcx, gcy, ecx, ecy, eh, k, mx, my, R, px, py, pw, ph, left, right, li, ri, dw, cx };
  }, [W, H]);

  if (gone) return null;

  const on = (n: number) => stage >= n;
  const draw = (n: number, delay: number, dur = 1200): CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: on(n) ? 0 : 1,
    transition: `stroke-dashoffset ${dur}ms ease-in-out ${delay}ms`,
  });
  const rise = (i: number): CSSProperties => ({
    opacity: on(5) ? 1 : 0,
    transform: on(5) ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 900ms ease-in-out ${i * 240}ms, transform 900ms ease-in-out ${i * 240}ms`,
  });
  const [first, second] = coupleOrder;
  const fit = (s: string, base: number) => `${base * Math.min(1, 8 / Math.max(s.length, 1))}cqw`;
  const abs = (top: string): CSSProperties => ({ position: "absolute", left: 0, right: 0, top, textAlign: "center", transform: "translateY(-50%)" });
  const ready = W > 0;
  const ganeshaDx = g.ecx - g.gcx, ganeshaDy = g.ecy - g.gcy;
  const wipe = "linear-gradient(to bottom, transparent 0%, transparent 34%, #000 50%, #000 100%)";

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
        opacity: stage === 7 ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    >
      {/* diya scene with its "tap to open" line */}
      <img src={PLATES[0]} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: on(1) ? 0 : 1, transition: "opacity 1600ms ease-in-out" }} />

      {/* Ganesha drawn by the thread: revealed from the diya upward, then fades once the parchment takes over */}
      <img
        src={PLATES[1]}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${P2.focusX * 100}% 50%`,
          opacity: on(4) ? 0 : 1,
          transform: on(1) ? "scale(1.03)" : "scale(1)",
          WebkitMaskImage: wipe,
          maskImage: wipe,
          WebkitMaskSize: "100% 300%",
          maskSize: "100% 300%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: on(1) ? "0% 100%" : "0% 0%",
          maskPosition: on(1) ? "0% 100%" : "0% 0%",
          transition: `mask-position 3400ms ease-in-out, -webkit-mask-position 3400ms ease-in-out, transform 6000ms ease-out, opacity 2000ms ease-in-out ${on(4) ? 400 : 0}ms`,
        }}
      />

      {ready && (
        <>
          {/* mandala + thread flowing down + the border the thread traces */}
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
            <g transform={`translate(${g.mx} ${g.my})`} style={{ opacity: on(2) && !on(4) ? 1 : 0, transition: "opacity 1800ms ease-in-out" }}>
              <g stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity=".6">
                <circle r={g.R} pathLength={1} style={draw(2, 0, 2200)} />
                <circle r={g.R * 0.9} pathLength={1} strokeDasharray="0.004 0.008" style={{ opacity: on(2) ? 1 : 0, transition: "opacity 1800ms ease-in-out 600ms" }} />
                {Array.from({ length: 16 }, (_, i) => (
                  <path key={i} d={petal(g.R)} pathLength={1} transform={`rotate(${i * 22.5})`} style={draw(2, 400 + i * 80, 1400)} />
                ))}
              </g>
            </g>

            {/* thread: mandala base -> top centre of the parchment */}
            <path
              d={`M${g.mx} ${g.my + g.R} C ${g.mx - 30} ${(g.my + g.R + g.py) / 2 - 10}, ${g.cx + 30} ${(g.my + g.R + g.py) / 2 + 10}, ${g.cx} ${g.py}`}
              pathLength={1}
              stroke={GOLD}
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ ...draw(3, 0, 1300), filter: "drop-shadow(0 0 3px rgba(226,168,75,.7))" }}
            />
          </svg>

          {/* parchment: unfolds downward from the thread at its top edge */}
          <div
            className="absolute"
            style={{
              left: g.px,
              top: g.py,
              width: g.pw,
              height: g.ph,
              containerType: "size",
              borderRadius: 12,
              background: "radial-gradient(ellipse at 50% 38%, #fbeccb 0%, #f4dfb4 68%, #e8c88a 100%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35), inset 0 0 36px rgba(168,118,46,.22)",
              clipPath: on(4) ? "inset(0% 0% 0% 0% round 12px)" : "inset(0% 0% 100% 0% round 12px)",
              transition: `clip-path 2000ms ${EASE} 300ms`,
              color: "#3a2412",
            }}
          >
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(168,118,46,.16) 1px, transparent 1px)", backgroundSize: "9px 9px", opacity: 0.5 }} />

            <img src="/intro/emblem.png" alt="Lord Ganesha" draggable={false} style={{ position: "absolute", left: "50%", top: "4%", height: "12.5%", transform: "translateX(-50%)", opacity: on(4) ? 1 : 0, transition: "opacity 1000ms ease-in-out 2100ms" }} />

            <p lang="mr" className="font-marathi" style={{ ...abs("22%"), fontSize: "4.4cqw", color: WINE, ...rise(0), transform: `translateY(-50%) ${rise(0).transform}` }}>॥ श्री गणेशाय नमः ॥</p>
            <p className="font-body" style={{ ...abs("28%"), fontSize: "3.9cqw", ...rise(1), transform: `translateY(-50%) ${rise(1).transform}` }}>Together with their families</p>

            <p className="font-script" style={{ ...abs("39%"), fontSize: fit(first, 17), lineHeight: 1, color: WINE, ...rise(2), transform: `translateY(-50%) ${rise(2).transform}` }}>{first}</p>
            <p className="font-script" style={{ ...abs("47.5%"), fontSize: "8cqw", lineHeight: 1, color: ANTIQUE, ...rise(3), transform: `translateY(-50%) ${rise(3).transform}` }}>&amp;</p>
            <p className="font-script" style={{ ...abs("56%"), fontSize: fit(second, 17), lineHeight: 1, color: WINE, ...rise(4), transform: `translateY(-50%) ${rise(4).transform}` }}>{second}</p>

            <p className="font-body" style={{ ...abs("69%"), fontSize: "5.2cqw", fontWeight: 600, ...rise(5), transform: `translateY(-50%) ${rise(5).transform}` }}>
              {date.day}
              <sup style={{ fontSize: ".6em" }}>{date.suffix}</sup> {date.month} {date.year}
            </p>
            <p className="font-body" style={{ ...abs("73.5%"), fontSize: "3.6cqw", opacity: on(5) ? 0.75 : 0, transition: "opacity 900ms ease-in-out 1.5s" }}>at</p>
            <p className="font-body" style={{ ...abs("77.5%"), fontSize: "4.6cqw", ...rise(7), transform: `translateY(-50%) ${rise(7).transform}` }}>{wedding.venue.name}</p>
            <p className="font-body" style={{ ...abs("81.5%"), fontSize: "4cqw", opacity: on(5) ? 0.85 : 0, transition: "opacity 900ms ease-in-out 2s" }}>{wedding.venue.city}</p>

            {/* Paithani peacock band + temple bases from the reference; its top melts into the paper */}
            <img
              src="/intro/band.jpg"
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: "-5%",
                bottom: 0,
                width: "110%",
                maxWidth: "none",
                borderRadius: "0 0 12px 12px",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 22%)",
                maskImage: "linear-gradient(to bottom, transparent 0, #000 22%)",
                opacity: on(5) ? 1 : 0,
                transition: "opacity 1400ms ease-in-out",
              }}
            />
          </div>

          {/* maroon silk drapes ease in from both edges */}
          {(["left", "right"] as const).map((side) => (
            <div
              key={side}
              className="absolute top-0"
              style={{
                [side]: 0,
                width: g.dw,
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,.4), transparent 28%, rgba(255,255,255,.1) 52%, transparent 74%, rgba(0,0,0,.35)), repeating-linear-gradient(90deg, #5a0f1c 0 16%, #7d1b2a 16% 34%, #3d0912 34% 50%)",
                borderRadius: side === "left" ? "0 70px 160px 0 / 0 50px 110px 0" : "70px 0 0 160px / 50px 0 0 110px",
                [side === "left" ? "borderRight" : "borderLeft"]: `2px solid ${GOLD}`,
                boxShadow: side === "left" ? "6px 0 20px rgba(0,0,0,.5)" : "-6px 0 20px rgba(0,0,0,.5)",
                transform: on(4) ? "translateX(0)" : `translateX(${side === "left" ? "-105%" : "105%"})`,
                transition: `transform 2200ms ${EASE} 600ms`,
              }}
            />
          ))}

          {/* front SVG: border thread, tassels, travelling Ganesha */}
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
            <g strokeLinecap="round" style={{ filter: on(4) && !on(6) ? "drop-shadow(0 0 2.5px rgba(226,168,75,.8))" : "none", transition: "filter 1600ms" }}>
              <path d={g.left} pathLength={1} stroke={ANTIQUE} strokeWidth="2" style={draw(4, 0, 3000)} />
              <path d={g.right} pathLength={1} stroke={ANTIQUE} strokeWidth="2" style={draw(4, 0, 3000)} />
              <path d={g.li} pathLength={1} stroke={ANTIQUE} strokeWidth=".9" opacity=".75" style={draw(4, 400, 3000)} />
              <path d={g.ri} pathLength={1} stroke={ANTIQUE} strokeWidth=".9" opacity=".75" style={draw(4, 400, 3000)} />
            </g>
            <g style={{ opacity: on(4) ? 1 : 0, transition: "opacity 1200ms ease-in-out 2200ms" }}>
              <Tassel x={g.dw - 7} y={H * 0.1} />
              <Tassel x={W - g.dw + 7} y={H * 0.1} />
            </g>
          </svg>

          {/* the glowing Ganesha, pixel-aligned over the scene, then travelling into the emblem slot */}
          <img
            src="/intro/ganesha-glow.png"
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: g.gl,
              top: g.gt,
              width: g.gw,
              height: g.gh,
              opacity: !on(2) ? 0 : on(4) ? 0 : 1,
              transformOrigin: "50% 50%",
              transform: on(4) ? `translate(${ganeshaDx}px, ${ganeshaDy}px) scale(${g.k})` : "none",
              transition: on(4)
                ? `transform 2400ms ${EASE} 300ms, opacity 900ms ease-in-out 1800ms`
                : "opacity 1200ms ease-in-out",
              pointerEvents: "none",
              willChange: "transform, opacity",
            }}
          />

          <div className="absolute inset-x-0 flex justify-center" style={{ bottom: Math.max(10, (H - g.ph) / 2 - H * 0.012 - 44) }}>
            <button
              onClick={finish}
              tabIndex={on(6) ? 0 : -1}
              className="rounded-full border font-body text-xs uppercase"
              style={{
                letterSpacing: ".25em",
                padding: "9px 24px",
                color: GOLD,
                borderColor: GOLD,
                background: "rgba(15,47,31,.9)",
                opacity: on(6) ? 1 : 0,
                pointerEvents: on(6) ? "auto" : "none",
                transition: "opacity 900ms ease-in-out",
              }}
            >
              View Invitation
            </button>
          </div>
        </>
      )}

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
      {!on(6) && (
        <button
          onClick={skip}
          className="absolute right-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest underline-offset-4 hover:underline lg:top-12"
          style={{ color: GOLD }}
        >
          Skip Animation
        </button>
      )}
    </div>
  );
}
