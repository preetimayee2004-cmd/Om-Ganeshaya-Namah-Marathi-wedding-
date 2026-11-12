import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { wedding } from "../../config/wedding";
import { useScrollRoot } from "../Layout/ScrollRoot";

/**
 * Shared "stage" for the opening and the pinned scroll scene: the Paithani peacock frame
 * (9-slice border-image, so it stretches to any phone height without distorting the peacocks)
 * around an ivory canvas. Art layers are anchored to the top or bottom of the canvas, so
 * the opening and the scroll scene line up exactly.
 */
export const BORDER = "8.85cqw";
export const u = (val: number) => `calc(var(--u) * ${val})`;

/** the peacock frame + ivory paper; repeats down any height, so it can wrap a scrolling page */
export const frameStyle: CSSProperties = {
  boxSizing: "border-box",
  border: `${BORDER} solid transparent`,
  borderImage: `url(/intro/frame.webp) 99 104 96 102 / ${BORDER} round`,
  backgroundClip: "padding-box",
  backgroundColor: "#f5efe3",
  backgroundImage: "radial-gradient(ellipse at 50% 20%, #f8f3e8 0%, #f3ecdc 100%)",
  containerType: "inline-size",
};

export default function SceneFrame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "absolute", inset: 0, containerType: "inline-size", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          border: `${BORDER} solid transparent`,
          borderImage: `url(/intro/frame.webp) 99 104 96 102 / ${BORDER} round`,
          backgroundClip: "padding-box",
          backgroundColor: "#f5efe3",
          backgroundImage: "radial-gradient(ellipse at 50% 35%, #f8f3e8 0%, #f3ecdc 100%)",
          overflow: "hidden",
          containerType: "inline-size",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** heights of the cut-out art, in cqw of the canvas width (source px / 631) */
export const H = {
  arch: `${(420 / 631) * 100}cqw`,
  scene: `${(456 / 631) * 100}cqw`, // palace (+ couple)
  ganTop: `${(380 / 631) * 100}cqw`,
  ganMain: `${(906 / 631) * 100}cqw`,
};

export const vFade = (edge: "top" | "bottom", pct = 14) =>
  edge === "top" ? `linear-gradient(to bottom, transparent 0, #000 ${pct}%)` : `linear-gradient(to bottom, #000 ${100 - pct}%, transparent 100%)`;

export function ArtLayer({ src, anchor, height, mask, alt = "", style }: { src: string; anchor: "top" | "bottom"; height: string; mask?: string; alt?: string; style?: CSSProperties }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: "absolute",
        left: 0,
        width: "100%",
        [anchor]: 0,
        height,
        display: "block",
        userSelect: "none",
        WebkitMaskImage: mask,
        maskImage: mask,
        ...style,
      }}
    />
  );
}

/** palace + couple art: inset from the frame so the border always draws on top of it */
const ART_H = "89cqw"; // ~40% taller than before; full width so the art meets the border
const WIPE = "linear-gradient(to right, transparent 0%, transparent 34%, #000 50%, #000 100%)";

/** wipe: undefined = no wipe; false = hidden; true = revealed from the right */
export function SceneArt({ src, alt = "", wipe, style }: { src: string; alt?: string; wipe?: boolean; style?: CSSProperties }) {
  const masks = wipe === undefined ? [vFade("top", 14)] : [vFade("top", 14), WIPE];
  const size = wipe === undefined ? "100% 100%" : "100% 100%, 300% 100%";
  const pos = wipe === undefined ? "0 0" : `0 0, ${wipe ? "100% 0" : "0% 0"}`;
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: ART_H,
        objectFit: "cover",
        objectPosition: "85% 50%",
        display: "block",
        userSelect: "none",
        WebkitMaskImage: masks.join(","),
        maskImage: masks.join(","),
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
        WebkitMaskSize: size,
        maskSize: size,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: pos,
        maskPosition: pos,
        ...style,
      }}
    />
  );
}

export const MAROON = "#6d0f1b";

/** names: maroon to bronze, both >= 4.5:1 on the cream canvas; the stroke thickens the thin script */
export const goldText: CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #6d0f1b 0%, #8a5a12 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  WebkitTextStroke: "0.8px #6d0f1b",
  color: "transparent",
};

export function useMarathiDate() {
  return useMemo(
    () => new Intl.DateTimeFormat("mr-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: wedding.timeZone }).format(new Date(wedding.date)),
    [],
  );
}

/** px height of the visible scroll area (the phone screen in the desktop mockup, else the window) */
export function useViewportHeight() {
  const root = useScrollRoot();
  const [h, setH] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  useEffect(() => {
    const read = () => setH(root ? root.clientHeight : window.innerHeight);
    read();
    const ro = root ? new ResizeObserver(read) : null;
    ro?.observe(root as Element);
    window.addEventListener("resize", read);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [root]);
  return h;
}
