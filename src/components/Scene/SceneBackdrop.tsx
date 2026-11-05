import SceneFrame, { ArtLayer, H, SceneArt, vFade } from "./SceneFrame";

/** The static background of the scroll scene: frame, arch, and the palace with the couple. */
export default function SceneBackdrop() {
  return (
    <SceneFrame>
      <ArtLayer src="/intro/arch.jpg" anchor="top" height={H.arch} mask={vFade("bottom", 14)} />
      <SceneArt src="/intro/couple.jpg" alt="The bride and groom in traditional Maharashtrian attire, looking at the palace" />
    </SceneFrame>
  );
}
