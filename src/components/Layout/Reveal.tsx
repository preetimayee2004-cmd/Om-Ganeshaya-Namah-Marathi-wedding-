import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useScrollRoot } from "./ScrollRoot";

/** Fires once when the element enters the (mockup-aware) scroll viewport. */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  const root = useScrollRoot();

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { root, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
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
          : "translate-y-4";
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        seen ? "translate-x-0 translate-y-0 scale-100 opacity-100" : `${hidden} opacity-0`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
