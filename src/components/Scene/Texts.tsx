import type { CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { MAROON, goldText, useMarathiDate } from "./SceneFrame";

// Both blocks start just under the arched top decoration and are sized in cqw of the canvas
// width, so they scale between 360 and 430px wide. Place them inside the frame canvas.
const TOP = "50cqw";
const SERIF = '"Cormorant Garamond", Georgia, serif';

/** Scene 3: shloka, "Together with their families", names, date, venue. */
export function InviteText({ show, meetReady = false, onMeet }: { show: boolean; meetReady?: boolean; onMeet?: () => void }) {
  const date = useMarathiDate();
  const [first, second] = coupleOrder;
  const fit = (s: string) => `${16.8 * Math.min(1, 7.5 / Math.max(s.length, 1))}cqw`;
  const line = (i: number): CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(12px)",
    transition: `opacity ${show ? 800 : 500}ms ease-in-out ${show ? 2000 + i * 300 : 0}ms, transform ${show ? 800 : 500}ms ease-in-out ${show ? 2000 + i * 300 : 0}ms`,
  });
  return (
    <div className="absolute inset-x-0 text-center" style={{ top: TOP, pointerEvents: "none" }}>
      <p lang="mr" className="font-marathi" style={{ fontSize: "4.4cqw", color: MAROON, ...line(0) }}>॥ श्री गणेशाय नमः ॥</p>
      <p style={{ marginTop: "1cqw", fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: "5cqw", color: "#4a2a1c", ...line(1) }}>Together with their families</p>
      <p className="font-script" style={{ ...goldText, marginTop: "1cqw", fontSize: fit(first), lineHeight: 1, ...line(2) }}>{first}</p>
      <p className="font-script" style={{ fontSize: "9cqw", lineHeight: 0.7, color: "#c4872a", ...line(3) }}>&amp;</p>
      <p className="font-script" style={{ ...goldText, fontSize: fit(second), lineHeight: 1, ...line(4) }}>{second}</p>
      <p lang="mr" className="font-marathi" style={{ marginTop: "3cqw", fontSize: "4.8cqw", color: MAROON, ...line(5) }}>{date}</p>
      <p style={{ marginTop: "5cqw", fontFamily: SERIF, fontWeight: 500, fontSize: "5.3cqw", color: "#4a2a1c", ...line(6) }}>
        {wedding.venue.name}, {wedding.venue.city}
      </p>
      {/* slim frosted-glass button */}
      <button
        onClick={onMeet}
        tabIndex={meetReady ? 0 : -1}
        className="zv-anim"
        style={{
          marginTop: "5cqw",
          width: "76cqw",
          padding: "1.2cqw 4cqw",
          lineHeight: 1.25,
          borderRadius: 999,
          color: MAROON,
          background: "linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.22))",
          border: "1px solid rgba(255,255,255,.85)",
          boxShadow: "0 4px 16px rgba(109,15,27,.18), inset 0 1px 0 rgba(255,255,255,.9)",
          WebkitBackdropFilter: "blur(8px)",
          backdropFilter: "blur(8px)",
          opacity: meetReady ? 1 : 0,
          pointerEvents: meetReady ? "auto" : "none",
          transition: "opacity 900ms ease-in-out",
          animation: meetReady ? "zv-pulse 2.6s ease-in-out infinite" : "none",
        }}
      >
        <span lang="mr" className="font-marathi" style={{ fontSize: "4.4cqw", fontWeight: 600 }}>वधू-वर पाहा</span>
        <span style={{ fontFamily: SERIF, fontSize: "4cqw", marginLeft: "2cqw", opacity: 0.85 }}>· Meet the Couple</span>
      </button>
    </div>
  );
}

/** Scene 4 (and the start of the scroll scene): the couple-section text + scroll cue. */
export function CoupleText({ show, instant = false, onCue, cueShow = true }: { show: boolean; instant?: boolean; onCue?: () => void; cueShow?: boolean }) {
  const { groom, bride } = wedding.couple;
  const t = (dur: number, delay: number) => (instant ? "none" : `opacity ${dur}ms ease-out ${delay}ms, transform ${dur}ms ease-out ${delay}ms`);
  const line = (delay: number): CSSProperties => ({ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)", transition: t(900, delay) });
  const row = (latin: string, relation: string, parents: string, delay: number) => (
    <p style={{ marginTop: "3.5cqw", ...line(delay) }}>
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "6.4cqw", color: MAROON }}>{latin}</span>
      <span style={{ color: "#8a5a12", fontSize: "5cqw" }}> · </span>
      <span lang="mr" className="font-marathi" style={{ fontSize: "4.4cqw", color: "#4a2a1c" }}>{relation} {parents}</span>
    </p>
  );
  return (
    <div className="absolute inset-x-0 text-center" style={{ top: TOP, padding: "0 4cqw" }}>
      <p lang="mr" className="font-marathi" style={{ fontSize: "7.4cqw", color: MAROON, fontStyle: "italic", ...line(1400) }}>दोन मने, एक गाठ</p>
      {row(groom, "सुपुत्र", wedding.parentsMr.groom, 1900)}
      {row(bride, "सुकन्या", wedding.parentsMr.bride, 2300)}
      <button
        onClick={onCue}
        tabIndex={show && cueShow ? 0 : -1}
        aria-label="Scroll down to the invitation"
        className="mx-auto mt-[9cqw] flex flex-col items-center"
        style={{ color: MAROON, opacity: show && cueShow ? 1 : 0, pointerEvents: show && cueShow ? "auto" : "none", transition: instant ? "none" : "opacity 900ms ease-in-out" }}
      >
        <svg viewBox="0 0 24 24" className="zv-anim" style={{ width: "7cqw", animation: "zv-chevron 1.6s ease-in-out infinite" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span lang="mr" className="font-marathi" style={{ fontSize: "4.2cqw", fontWeight: 600 }}>खाली स्क्रोल करा</span>
        <span style={{ fontFamily: SERIF, fontSize: "3.6cqw", opacity: 0.85 }}>Scroll down</span>
      </button>
    </div>
  );
}
