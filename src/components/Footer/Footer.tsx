import { wedding, coupleOrder } from "../../config/wedding";
import { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

export default function Footer() {
  const [ref, seen] = useInView<HTMLElement>(0.1);
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
    <footer ref={ref} className="px-6 pb-10 pt-6 text-center text-[#4b0f16]">

      <p
        className="mx-auto max-w-[18rem] font-script text-4xl leading-tight text-[#6d0f1b]"
        style={{ opacity: seen ? 1 : 0, transition: "opacity 1600ms ease 400ms" }}
      >
        {wedding.finalNote}
      </p>

      <div style={{ opacity: seen ? 1 : 0, transition: "opacity 1600ms ease 900ms" }}>
        <p className="mt-6 font-script text-4xl text-[#6d0f1b]">
          {coupleOrder[0]} &amp; {coupleOrder[1]}
        </p>
        <p className="mt-1 font-body text-xs font-semibold uppercase tracking-[0.3em] text-[#a8741a]">
          {date}
        </p>
        <p className="mt-3 font-body text-sm font-medium text-[#7a3a2a]">
          {wedding.hashtag}
        </p>
      </div>

      <button
        onClick={toTop}
        className="mt-8 min-h-11 rounded-full border border-[#a8741a]/60 bg-[#fbf5e8]/90 px-8 font-body text-xs font-bold uppercase tracking-widest text-[#6d0f1b] shadow-sm transition active:scale-95 cursor-pointer"
      >
        Back to top ↑
      </button>

      <p lang="mr" className="mt-8 font-marathi text-sm font-semibold text-[#6d0f1b]/70">
        ॥ श्री गणेशाय नमः ॥
      </p>
    </footer>
  );
}
