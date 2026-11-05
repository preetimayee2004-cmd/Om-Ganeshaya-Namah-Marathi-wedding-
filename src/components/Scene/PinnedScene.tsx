import { useEffect, useRef, type ReactNode } from "react";
import { useScrollRoot } from "../Layout/ScrollRoot";
import CoupleHero from "./CoupleHero";
import SceneFrame, { ArtLayer, BORDER, H, useViewportHeight, vFade } from "./SceneFrame";

/**
 * Scene 5: the background (frame, arch, palace + couple) stays pinned while sections
 * scroll over it at 1x. Background layers drift at 0.2x-0.5x of the scroll so the pinned
 * art has depth. Only transform is animated, and it is written straight to a CSS variable
 * (no React state on scroll).
 */
export default function PinnedScene({ children }: { children: ReactNode }) {
  const root = useScrollRoot();
  const vh = useViewportHeight();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      el.style.setProperty("--p", reduce ? "0" : String(Math.round(root ? root.scrollTop : window.scrollY)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const target: HTMLElement | Window = root ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root]);

  const toStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ position: "relative" }}>
      {/* pinned stage */}
      <div ref={stageRef} aria-hidden style={{ position: "sticky", top: 0, height: vh, overflow: "hidden", zIndex: 0 }}>
        <SceneFrame>
          <ArtLayer
            src="/intro/arch.jpg"
            anchor="top"
            height={H.arch}
            mask={vFade("bottom", 14)}
            style={{ transform: "translate3d(0, max(calc(var(--p, 0) * -0.2px), -56px), 0)", willChange: "transform" }}
          />
          <ArtLayer
            src="/intro/couple.jpg"
            anchor="bottom"
            height={H.scene}
            mask={vFade("top", 14)}
            style={{ transform: "scale(min(calc(1 + var(--p, 0) * 0.00012), 1.08))", transformOrigin: "50% 100%", willChange: "transform" }}
          />
        </SceneFrame>
      </div>

      {/* scrolling content, 1x */}
      <div style={{ position: "relative", zIndex: 1, marginTop: -vh, containerType: "inline-size" }}>
        {/* hero: same layout as the end of the opening, so the hand-off has no jump */}
        <div style={{ height: vh, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, padding: BORDER, boxSizing: "border-box" }}>
            <div style={{ position: "relative", height: "100%", containerType: "inline-size" }}>
              <CoupleHero show instant onCue={toStory} />
            </div>
          </div>
        </div>

        <div id="story" style={{ paddingInline: `calc(${BORDER} + 10px)`, paddingBottom: 48 }} className="flex flex-col gap-7">
          {children}
        </div>
      </div>
    </div>
  );
}
