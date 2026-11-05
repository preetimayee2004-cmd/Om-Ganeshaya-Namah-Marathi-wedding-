import { wedding } from "../../config/wedding";
import { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

export default function Footer() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const root = useScrollRoot();

  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: wedding.timeZone,
  }).format(new Date(wedding.date));

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduce ? "auto" : "smooth";
    if (root) root.scrollTo({ top: 0, behavior });
    else window.scrollTo({ top: 0, behavior });
  };

  return (
    <footer ref={ref} className="bg-wine px-6 pb-10 pt-16 text-center text-ivory">
      <svg viewBox="0 0 48 44" className="mx-auto h-10 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden
        style={{ transform: seen ? "scale(1)" : "scale(0.6)", opacity: seen ? 1 : 0, transition: "all 1200ms cubic-bezier(.2,1.4,.4,1)" }}>
        <path d="M24 40C8 28 4 18 4 12a9 9 0 0 1 20-3 9 9 0 0 1 20 3c0 6-4 16-20 28Z" />
      </svg>

      <p
        className="mx-auto mt-5 max-w-[16rem] font-script text-4xl leading-tight text-ivory"
        style={{ opacity: seen ? 1 : 0, transition: "opacity 1600ms ease 400ms" }}
      >
        {wedding.finalNote}
      </p>

      <div style={{ opacity: seen ? 1 : 0, transition: "opacity 1600ms ease 900ms" }}>
        <p className="mt-6 font-script text-3xl text-gold">
          {wedding.couple.bride} &amp; {wedding.couple.groom}
        </p>
        <p className="mt-1 font-body text-xs uppercase tracking-[0.3em] text-ivory/80">{date}</p>
        <p className="mt-3 font-body text-sm text-ivory/70">{wedding.hashtag}</p>
      </div>

      <button
        onClick={toTop}
        className="mt-8 min-h-11 rounded-full border border-gold/70 px-6 font-body text-xs font-bold uppercase tracking-widest text-gold transition active:scale-95"
      >
        Back to top ↑
      </button>

      <p lang="mr" className="mt-8 text-xs text-ivory/50">॥ श्री गणेशाय नमः ॥</p>
    </footer>
  );
}
