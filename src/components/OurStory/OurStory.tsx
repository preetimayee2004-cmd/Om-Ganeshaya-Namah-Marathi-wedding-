import { useEffect, useRef } from "react";
import { wedding } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

function Milestone({ m, i }: { m: (typeof wedding.story)[number]; i: number }) {
  const [ref, seen] = useInView<HTMLLIElement>(0.35);
  return (
    <li ref={ref} className="relative pb-10 pl-12 last:pb-0">
      {/* hand-drawn style dot that pops in when reached */}
      <span
        className="absolute left-[11px] top-1.5 h-[18px] w-[18px] rounded-full border-2 border-wine bg-ivory transition-transform duration-500"
        style={{ transform: seen ? "scale(1)" : "scale(0)", transitionTimingFunction: "cubic-bezier(.2,1.6,.4,1)" }}
        aria-hidden
      >
        <span className="absolute inset-[3px] rounded-full bg-gold" />
      </span>
      <article
        className="rounded-sm bg-[#fff8e6] p-4 shadow-[0_6px_18px_-10px_rgba(56,41,35,0.5)] transition-all duration-700 ease-out"
        style={{
          opacity: seen ? 1 : 0,
          transform: seen ? `rotate(${i % 2 ? 0.8 : -0.8}deg)` : "translateY(calc(var(--u) * 18)) rotate(0deg)",
          backgroundImage: "repeating-linear-gradient(transparent 0 calc(var(--u) * 25), rgba(104,114,83,0.12) calc(var(--u) * 25) calc(var(--u) * 26))",
        }}
      >
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-olive">
          {String(i + 1).padStart(2, "0")}
          {m.when ? ` · ${m.when}` : ""}
        </p>
        <h3 className="mt-1 text-3xl leading-tight">{m.title}</h3>
        {m.photo && (
          <img src={m.photo} alt={m.title} loading="lazy" className="mt-3 aspect-[4/3] w-full rounded-sm border border-gold/40 object-cover" />
        )}
        <p className="mt-2 font-body text-[14px] font-light leading-relaxed">{m.text}</p>
      </article>
    </li>
  );
}

export default function OurStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const root = useScrollRoot();

  // Growing line: fill follows scroll progress through the list. Written straight to the
  // DOM (no React state) so scrolling never triggers re-renders.
  useEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section || !line) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      if (reduce) {
        line.style.transform = "scaleY(1)";
        return;
      }
      const rect = section.getBoundingClientRect();
      const viewTop = root ? root.getBoundingClientRect().top : 0;
      const viewH = root ? root.clientHeight : window.innerHeight;
      const p = (viewTop + viewH * 0.65 - rect.top) / rect.height;
      line.style.transform = `scaleY(${Math.min(1, Math.max(0, p))})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const target: HTMLElement | Window = root ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root]);

  return (
    <section ref={sectionRef} id="story" aria-labelledby="story-title" className="px-5 py-20">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">From the pages of our journal</p>
        <h2 id="story-title" className="mt-2 text-5xl">Our Story</h2>
      </Reveal>

      <ol className="relative mt-10">
        {/* track + growing fill */}
        <span className="absolute bottom-2 left-5 top-2 w-px bg-gold/30" aria-hidden />
        <span
          ref={lineRef}
          className="absolute bottom-2 left-5 top-2 w-px origin-top bg-wine"
          style={{ transform: "scaleY(0)", willChange: "transform" }}
          aria-hidden
        />
        {wedding.story.map((m, i) => (
          <Milestone key={m.title} m={m} i={i} />
        ))}
      </ol>
    </section>
  );
}
