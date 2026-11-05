import { wedding } from "../../config/wedding";
import { CouplePlaceholder } from "../Couple/Couple";
import { useInView } from "../Layout/Reveal";

function Sprig({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 60 120" className={`absolute h-28 w-14 text-blush ${className}`} fill="currentColor" aria-hidden>
      <path d="M30 118C28 80 30 40 30 6" stroke="#687253" strokeWidth="1.5" fill="none" />
      {[24, 46, 68, 90].map((y, i) => (
        <ellipse key={y} cx={i % 2 ? 40 : 20} cy={y} rx="11" ry="6" transform={`rotate(${i % 2 ? 25 : -25} ${i % 2 ? 40 : 20} ${y})`} opacity={0.85} />
      ))}
      <circle cx="30" cy="8" r="6" />
    </svg>
  );
}

export default function ThankYou() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const fade = (delay: number) => ({
    opacity: seen ? 1 : 0,
    transform: seen ? "none" : "translateY(10px)",
    transition: `opacity 1400ms ease ${delay}ms, transform 1400ms ease ${delay}ms`,
  });

  return (
    <section
      ref={ref}
      id="thank-you"
      aria-labelledby="thanks-title"
      className="relative overflow-hidden px-6 py-24 text-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #fffaf0 0%, #F7EEDC 60%, #f1dfcf 100%)" }}
    >
      <Sprig className="-left-3 top-10 -rotate-12" />
      <Sprig className="-right-3 top-10 rotate-12 -scale-x-100" />

      <div
        className="mx-auto h-44 w-40 overflow-hidden rounded-t-[999px] border border-gold/60 bg-gradient-to-b from-blush/40 to-ivory p-3"
        style={fade(0)}
      >
        <CouplePlaceholder />
      </div>

      <h2 id="thanks-title" className="mt-8 text-6xl leading-none" style={fade(400)}>
        Thank You
      </h2>
      <p lang="mr" className="mt-1 text-sm text-gold" style={fade(500)}>धन्यवाद</p>

      <p className="mx-auto mt-5 max-w-[20rem] font-body text-[15px] font-light leading-relaxed" style={fade(700)}>
        {wedding.thankYouMessage}
      </p>

      <div className="mx-auto my-6 h-px w-16 bg-gold/70" style={fade(900)} />

      <p className="font-script text-5xl text-wine" style={fade(1000)}>
        {wedding.couple.bride} <span className="text-3xl text-gold">&amp;</span> {wedding.couple.groom}
      </p>
      <p className="mt-4 font-body text-[11px] uppercase leading-relaxed tracking-[0.25em] text-olive" style={fade(1200)}>
        {wedding.families.map((f) => f.surname).join("  ·  ")}
      </p>
    </section>
  );
}
