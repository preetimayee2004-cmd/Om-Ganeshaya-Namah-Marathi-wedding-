import type { CSSProperties } from "react";
import { wedding, coupleOrder } from "../../config/wedding";
import { MAROON, goldText, useMarathiDate } from "./SceneFrame";

/**
 * Names, Marathi date, venue and the "दोन मने, एक गाठ" line. Used by the opening (animated in)
 * and by the pinned scene (static), at identical positions, so the hand-off has no jump.
 * Must be placed inside a container whose width is the canvas width (cqw units).
 */
export default function CoupleHero({ show, instant = false, onCue, cueShow = true }: { show: boolean; instant?: boolean; onCue?: () => void; cueShow?: boolean }) {
  const date = useMarathiDate();
  const [first, second] = coupleOrder;
  const fitName = (s: string) => `${10.5 * Math.min(1, 7.5 / Math.max(s.length, 1))}cqw`;
  const t = (dur: number, delay: number) => (instant ? "none" : `opacity ${dur}ms ease-out ${delay}ms, transform ${dur + 200}ms cubic-bezier(.45,0,.25,1) ${delay}ms`);
  const drop = (delay: number): CSSProperties => ({ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(-22px)", transition: t(1200, delay) });
  const rise = (delay: number): CSSProperties => ({ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)", transition: t(1000, delay) });

  return (
    <div className="absolute inset-x-0 text-center" style={{ top: "30%" }}>
      <p className="font-script" style={{ ...goldText, fontSize: fitName(first), lineHeight: 1.05, ...drop(900) }}>{first}</p>
      <p className="font-script" style={{ ...goldText, fontSize: "7cqw", lineHeight: 1, ...drop(1200) }}>&amp;</p>
      <p className="font-script" style={{ ...goldText, fontSize: fitName(second), lineHeight: 1.05, ...drop(1400) }}>{second}</p>
      <p lang="mr" className="font-marathi" style={{ marginTop: "4cqw", fontSize: "5cqw", color: MAROON, fontWeight: 600, ...rise(2100) }}>{date}</p>
      <p className="font-body" style={{ marginTop: "1.2cqw", fontSize: "3.5cqw", color: "#4a2a1c", ...rise(2400) }}>
        {wedding.venue.name}, {wedding.venue.city}
      </p>
      <p lang="mr" className="font-marathi" style={{ marginTop: "3cqw", fontSize: "4.4cqw", color: "#8a6a3a", fontStyle: "italic", ...rise(2700) }}>दोन मने, एक गाठ</p>
      <button
        onClick={onCue}
        tabIndex={show && cueShow ? 0 : -1}
        aria-label="Scroll down to the invitation"
        className="mx-auto mt-[4cqw] flex flex-col items-center"
        style={{ color: MAROON, opacity: show && cueShow ? 1 : 0, pointerEvents: show && cueShow ? "auto" : "none", transition: instant ? "none" : "opacity 900ms ease-in-out" }}
      >
        <svg viewBox="0 0 24 24" className="zv-anim" style={{ width: "6cqw", animation: "zv-chevron 1.6s ease-in-out infinite" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span lang="mr" className="font-marathi" style={{ fontSize: "3.6cqw", fontWeight: 600 }}>खाली स्क्रोल करा</span>
        <span className="font-body uppercase" style={{ fontSize: "2.3cqw", letterSpacing: ".2em", opacity: 0.8 }}>Scroll down</span>
      </button>
    </div>
  );
}
