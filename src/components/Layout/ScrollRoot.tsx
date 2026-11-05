import { createContext, useContext } from "react";

/**
 * In the desktop phone mockup the invitation scrolls inside the "screen" element,
 * not the window. Scroll-driven sections (timeline, parallax, reveals) must use
 * this as their IntersectionObserver `root` / scroll listener target.
 * `null` means "use the window" (real mobile / tablet).
 */
export const ScrollRootContext = createContext<HTMLElement | null>(null);
export const useScrollRoot = () => useContext(ScrollRootContext);
