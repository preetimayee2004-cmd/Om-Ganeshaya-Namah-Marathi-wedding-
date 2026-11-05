import type { ReactNode } from "react";
import { ArtLayer, H, SceneArt, ScreenSpace, frameStyle, u, useUnit, useViewportHeight, vFade } from "./SceneFrame";
import { CoupleText } from "./Texts";

/**
 * After the opening nothing is pinned and nothing drifts: the frame, the arch, the building with
 * the couple and the cards are one page that scrolls together. Cards just fade up as they enter.
 * (Kept under its old name so App.tsx does not change.)
 */
export default function PinnedScene({ children }: { children: ReactNode }) {
  const vh = useViewportHeight();
  const unit = useUnit<HTMLDivElement>();
  const toStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div ref={unit.ref} style={{ ...unit.style, position: "relative" }}>
      <div style={{ ...frameStyle, minHeight: vh }}>
        {/* first screen: same layout as the end of the opening, so the hand-off has no jump */}
        <div style={{ position: "relative", height: `calc(${vh}px - ${u(44)})`, overflow: "hidden" }}>
          <ArtLayer src="/intro/arch.jpg" anchor="top" height={H.arch} mask={vFade("bottom", 14)} />
          <SceneArt src="/intro/couple.jpg" alt="The bride and groom in traditional Maharashtrian attire, looking at the palace" />
          <ScreenSpace>
            <CoupleText show instant onCue={toStory} />
          </ScreenSpace>
        </div>

        {/* sections: 56u top/bottom, 32u from the screen edge (10u inside the border), 14u between cards */}
        <div id="story" style={{ padding: `${u(56)} ${u(10)}`, display: "flex", flexDirection: "column", gap: u(14) }}>
          {children}
        </div>
      </div>
    </div>
  );
}
