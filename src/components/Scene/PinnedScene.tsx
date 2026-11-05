import type { ReactNode } from "react";
import ArtLayerBg from "./SceneBackdrop";
import { CoupleText } from "./Texts";
import { BORDER, useViewportHeight } from "./SceneFrame";

/**
 * After the opening there is no parallax: the frame, arch, palace and couple stay exactly as
 * the opening left them (pinned, static), and each card simply fades up as it scrolls in.
 */
export default function PinnedScene({ children }: { children: ReactNode }) {
  const vh = useViewportHeight();
  const toStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ position: "relative" }}>
      <div aria-hidden style={{ position: "sticky", top: 0, height: vh, overflow: "hidden", zIndex: 0 }}>
        <ArtLayerBg />
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: -vh, containerType: "inline-size" }}>
        {/* hero: identical layout to the end of the opening, so the hand-off has no jump */}
        <div style={{ height: vh, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, padding: BORDER, boxSizing: "border-box" }}>
            <div style={{ position: "relative", height: "100%", containerType: "inline-size" }}>
              <CoupleText show instant onCue={toStory} />
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
