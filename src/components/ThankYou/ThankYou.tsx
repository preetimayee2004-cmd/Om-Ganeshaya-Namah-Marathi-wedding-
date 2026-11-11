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
  const [ref, seen] = useInView<HTMLElement>(0.1);
  const fade = (delay: number) => ({
    opacity: seen ? 1 : 0,
    transform: seen ? "none" : "translateY(10px)",
    transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
  });

  return (
    <section
      ref={ref}
      id="thank-you"
      aria-labelledby="thanks-title"
      className="relative overflow-hidden px-6 py-6 text-center"
    >
      <Sprig className="-left-3 top-10 -rotate-12" />
      <Sprig className="-right-3 top-10 rotate-12 -scale-x-100" />

      <div
        className="mx-auto h-44 w-40 overflow-hidden rounded-t-[999px] border border-gold/60 bg-gradient-to-b from-blush/40 to-ivory p-3"
        style={fade(0)}
      >
        <CouplePlaceholder />
      </div>

      <h2 id="thanks-title" className="mt-8 text-6xl leading-none text-[#6d0f1b]" style={fade(400)}>
        Thank You
      </h2>
      <p lang="mr" className="mt-1 text-sm font-semibold text-[#a8741a]" style={fade(500)}>धन्यवाद</p>

      <p className="mx-auto mt-5 max-w-[20rem] font-body text-[15px] font-medium leading-relaxed text-[#4b0f16]/90" style={fade(700)}>
        {wedding.thankYouMessage}
      </p>

    </section>
  );
}
