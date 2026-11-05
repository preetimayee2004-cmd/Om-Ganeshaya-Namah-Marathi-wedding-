import type { CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { MAROON, goldText, u, useMarathiDate } from "./SceneFrame";

// Exact spec, in u (u = min(screen width, 430px) / 390). Both blocks live in SCREEN space and
// start at y = 212u, just under the arched ornament. Palette: maroon #6d0f1b, ink #4b0f16,
// soft brown #7a3a2a, deep gold #a8741a, gold #f0b44c, cream #f7e6ba.
const INK = "#4b0f16";
const BROWN = "#7a3a2a";
const GOLD_DEEP = "#a8741a";
const CREAM = "#f7e6ba";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const ZONE_TOP = 212;

const block: CSSProperties = { position: "absolute", left: u(32), width: u(326), top: u(ZONE_TOP), textAlign: "center" };

/** Screen 3: shloka, "Together with their families", names, date, venue, glass-free maroon pill button. */
export function InviteText({ show, meetReady = false, onMeet }: { show: boolean; meetReady?: boolean; onMeet?: () => void }) {
  const date = useMarathiDate();
  const [first, second] = coupleOrder;
  const fit = (s: string) => u(56 * Math.min(1, 7 / Math.max(s.length, 1)));
  const line = (i: number): CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : `translateY(${12}px)`,
    transition: `opacity ${show ? 800 : 500}ms ease-in-out ${show ? 2000 + i * 300 : 0}ms, transform ${show ? 800 : 500}ms ease-in-out ${show ? 2000 + i * 300 : 0}ms`,
  });
  return (
    <div style={{ ...block, pointerEvents: "none" }}>
      <p lang="mr" className="font-marathi" style={{ fontSize: u(16), lineHeight: 1.2, color: MAROON, ...line(0) }}>॥ श्री गणेशाय नमः ॥</p>
      <p style={{ marginTop: u(10), fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: u(18), lineHeight: 1.25, color: INK, ...line(1) }}>Together with their families</p>
      <p className="font-script" style={{ ...goldText, marginTop: u(12), fontSize: fit(first), lineHeight: 1, ...line(2) }}>{first}</p>
      <p className="font-script" style={{ margin: `${u(4)} 0`, fontSize: u(36), lineHeight: 1, color: GOLD_DEEP, ...line(3) }}>&amp;</p>
      <p className="font-script" style={{ ...goldText, fontSize: fit(second), lineHeight: 1, ...line(4) }}>{second}</p>
      <p lang="mr" className="font-marathi" style={{ marginTop: u(14), fontSize: u(22), lineHeight: 1.3, color: MAROON, ...line(5) }}>{date}</p>
      <p style={{ marginTop: u(8), fontFamily: SERIF, fontWeight: 500, fontSize: u(19), lineHeight: 1.3, color: INK, ...line(6) }}>
        {wedding.venue.name}, {wedding.venue.city}
      </p>
      <button
        onClick={onMeet}
        tabIndex={meetReady ? 0 : -1}
        className="zv-anim"
        style={{
          marginTop: u(22),
          height: u(52),
          width: u(270),
          borderRadius: 999,
          background: MAROON,
          border: `${u(1.5)} solid #f0b44c`,
          color: CREAM,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: u(8),
          boxShadow: "0 4px 14px rgba(109,15,27,.3)",
          opacity: meetReady ? 1 : 0,
          pointerEvents: meetReady ? "auto" : "none",
          transition: "opacity 900ms ease-in-out",
          animation: meetReady ? "zv-pulse 2.6s ease-in-out infinite" : "none",
        }}
      >
        <span lang="mr" className="font-marathi" style={{ fontSize: u(18), fontWeight: 600 }}>वधू-वर पाहा</span>
        <span style={{ fontFamily: SERIF, fontSize: u(15), opacity: 0.9 }}>· Meet the Couple</span>
      </button>
    </div>
  );
}

/** Screen 4 (also the start of the scroll page): the couple text in the SAME zone + the scroll cue. */
export function CoupleText({ show, instant = false, onCue, cueShow = true }: { show: boolean; instant?: boolean; onCue?: () => void; cueShow?: boolean }) {
  const { groom, bride } = wedding.couple;
  const t = (dur: number, delay: number) => (instant ? "none" : `opacity ${dur}ms ease-out ${delay}ms, transform ${dur}ms ease-out ${delay}ms`);
  const line = (delay: number): CSSProperties => ({ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)", transition: t(900, delay) });
  return (
    <>
      <div style={block}>
        <p lang="mr" className="font-marathi" style={{ fontSize: u(28), lineHeight: 1.25, color: MAROON, ...line(1400) }}>दोन मने, एक गाठ</p>
        <p style={{ marginTop: u(8), fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: u(18), lineHeight: 1.25, color: BROWN, ...line(1700) }}>Two hearts, one knot</p>
        <p className="font-script" style={{ ...goldText, marginTop: u(18), fontSize: u(40), lineHeight: 1.1, ...line(2000) }}>{groom}</p>
        <p lang="mr" className="font-marathi" style={{ marginTop: u(4), fontSize: u(15), lineHeight: 1.4, color: INK, ...line(2200) }}>सुपुत्र {wedding.parentsMr.groom}</p>
        <p className="font-script" style={{ ...goldText, marginTop: u(14), fontSize: u(40), lineHeight: 1.1, ...line(2500) }}>{bride}</p>
        <p lang="mr" className="font-marathi" style={{ marginTop: u(4), fontSize: u(15), lineHeight: 1.4, color: INK, ...line(2700) }}>सुकन्या {wedding.parentsMr.bride}</p>
      </div>
      {/* scroll cue: 40u above the building (22u border + 210u art + 40u) */}
      <button
        onClick={onCue}
        tabIndex={show && cueShow ? 0 : -1}
        aria-label="Scroll down to the invitation"
        style={{
          position: "absolute",
          left: u(32),
          width: u(326),
          bottom: u(22 + 210 + 40),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: MAROON,
          opacity: show && cueShow ? 1 : 0,
          pointerEvents: show && cueShow ? "auto" : "none",
          transition: instant ? "none" : "opacity 900ms ease-in-out",
        }}
      >
        <svg viewBox="0 0 24 24" className="zv-anim" style={{ width: u(22), animation: "zv-chevron 1.6s ease-in-out infinite" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span style={{ fontFamily: '"Cormorant SC", Georgia, serif', fontSize: u(13), fontWeight: 600, letterSpacing: "0.08em" }}>Scroll down</span>
      </button>
    </>
  );
}
