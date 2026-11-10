import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useScrollRoot } from "./ScrollRoot";

/** Fires once when the element enters the (mockup-aware) scroll viewport. */
export function useInView<T extends Element>(threshold = 0.05) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  const root = useScrollRoot();

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    // Check if already in viewport immediately
    const checkRect = () => {
      const rect = el.getBoundingClientRect();
      const vh = root ? root.clientHeight : (window.innerHeight || document.documentElement.clientHeight);
      if (rect.top < vh + 100 && rect.bottom > -100) {
        setSeen(true);
        return true;
      }
      return false;
    };

    if (checkRect()) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { root: root ?? null, threshold, rootMargin: "60px 0px 60px 0px" },
    );
    io.observe(el);

    // Also listen to scroll event as a resilient fallback
    const target = root ?? window;
    const onScroll = () => {
      if (checkRect()) {
        io.disconnect();
        target.removeEventListener("scroll", onScroll);
      }
    };
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      target.removeEventListener("scroll", onScroll);
    };
  }, [root, seen, threshold]);

  return [ref, seen] as const;
}

/** Simple fade-up reveal with optional stagger delay (ms). */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  style,
  from = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  from?: "up" | "left" | "right" | "zoom";
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const hidden =
    from === "left"
      ? "-translate-x-8"
      : from === "right"
        ? "translate-x-8"
        : from === "zoom"
          ? "scale-90"
          : "translate-y-6";
  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-out ${
        seen ? "translate-x-0 translate-y-0 scale-100 opacity-100" : `${hidden} opacity-0`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
