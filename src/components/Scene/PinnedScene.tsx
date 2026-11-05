import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArtLayer, BORDER, H, SceneArt, frameStyle, useViewportHeight, vFade } from "./SceneFrame";
import { CoupleText } from "./Texts";

/**
 * After the opening nothing is pinned and nothing drifts: the frame, the arch, the palace with
 * the couple and the cards are one page that scrolls together. Cards just fade up as they enter.
 * (Kept under its old name so App.tsx does not change.)
 */
export default function PinnedScene({ children }: { children: ReactNode }) {
  const vh = useViewportHeight();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [bw, setBw] = useState(0); // frame border width in px (8.85% of the page width)

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => setBw(el.clientWidth * 0.0885);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toStory = () => document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div ref={wrapRef} style={{ position: "relative", containerType: "inline-size" }}>
      <div style={{ ...frameStyle, minHeight: vh }}>
        {/* first screen: same layout as the end of the opening, so the hand-off has no jump */}
        <div style={{ position: "relative", height: bw ? vh - 2 * bw : vh, overflow: "hidden" }}>
          <ArtLayer src="/intro/arch.jpg" anchor="top" height={H.arch} mask={vFade("bottom", 14)} />
          <SceneArt src="/intro/couple.jpg" alt="The bride and groom in traditional Maharashtrian attire, looking at the palace" />
          <CoupleText show instant onCue={toStory} />
        </div>

        <div id="story" style={{ padding: "28px 12px 48px" }} className="flex flex-col gap-7">
          {children}
        </div>
      </div>
    </div>
  );
}
