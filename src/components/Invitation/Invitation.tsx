import { useGuest } from "../../context/GuestContext";
import { wedding, coupleOrder } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";
import { useScrollRoot } from "../Layout/ScrollRoot";

// Placeholder line-art Ganesha until the custom illustration is delivered.
function GaneshaPlaceholder() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      role="img"
      aria-label="Lord Ganesha illustration"
    >
      <path d="M20 110V55a40 40 0 0 1 80 0v55" />
      <path d="M44 38l16-14 16 14" />
      <circle cx="60" cy="58" r="16" />
      <path d="M44 52c-14-4-18 12-10 22 4 5 8 2 10-2M76 52c14-4 18 12 10 22-4 5-8 2-10-2" />
      <path d="M60 64c0 14-8 20-4 28s12 2 10-6" />
      <circle cx="54" cy="55" r="1.2" fill="currentColor" />
      <circle cx="66" cy="55" r="1.2" fill="currentColor" />
      <path d="M40 100c6-4 14-6 20-6s14 2 20 6" />
    </svg>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`absolute h-8 w-8 text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <path d="M2 38V8a6 6 0 0 1 6-6h30" />
      <path d="M8 38V14a6 6 0 0 1 6-6h24" opacity=".5" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Invitation() {
  const { guestName, isPersonalised } = useGuest();
  const [cardRef, cardSeen] = useInView<HTMLElement>(0.1);
  const root = useScrollRoot();

  const explore = () => {
    const target = document.getElementById("couple");
    if (!target) return;
    const top = target.getBoundingClientRect().top;
    if (root) root.scrollBy({ top, behavior: "smooth" });
    else window.scrollBy({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={cardRef}
      id="invitation"
      aria-labelledby="invitation-title"
      className="weave relative flex min-h-screen items-center justify-center bg-maroon px-5 py-14"
    >
      {/* Paper card: unfolds on first view */}
      <div
        className="relative w-full origin-top rounded-sm border border-gold/50 bg-[#fbf5e8] px-6 pb-10 pt-10 text-center shadow-[0_12px_40px_-18px_rgba(56,41,35,0.45)] transition-all duration-[1100ms] ease-out"
        style={{
          opacity: cardSeen ? 1 : 0,
          transform: cardSeen ? "scaleY(1)" : "scaleY(0.92)",
          clipPath: cardSeen ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
          backgroundImage:
            "radial-gradient(rgba(198,161,91,0.10) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        <Corner className="left-2 top-2" />
        <Corner className="right-2 top-2 -scale-x-100" />
        <Corner className="bottom-2 left-2 -scale-y-100" />
        <Corner className="bottom-2 right-2 -scale-100" />

        <div className="flex flex-col items-center gap-5">
          <Reveal delay={300}>
            <p lang="mr" className="text-lg tracking-wide text-gold">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <p className="mt-1 font-body text-[10px] uppercase tracking-[0.35em] text-espresso/60">
              Shri Ganeshaya Namah
            </p>
          </Reveal>

          <Reveal delay={450}>
            <GaneshaPlaceholder />
          </Reveal>

          <Reveal delay={600}>
            <h2 id="invitation-title" className="text-5xl leading-none">
              Wedding Invitation
            </h2>
          </Reveal>

          <Reveal delay={750}>
            <p className="font-body text-sm text-espresso/80">
              Dear <strong className="font-bold text-wine">{guestName}</strong>
              {isPersonalised ? "," : " —"}
            </p>
          </Reveal>

          <Reveal delay={900}>
            <p className="font-script text-5xl leading-tight text-wine">
              {coupleOrder[0]}
              <span className="mx-2 text-3xl text-gold">&amp;</span>
              {coupleOrder[1]}
            </p>
          </Reveal>

          <Reveal delay={1050}>
            <p className="mx-auto max-w-[19rem] font-body text-[15px] font-light leading-relaxed text-espresso">
              {wedding.invitationMessage}
            </p>
          </Reveal>

          <Reveal delay={1200} className="w-full">
            <div className="mx-auto mb-4 h-px w-16 bg-gold/70" />
            <div className="grid grid-cols-2 gap-4 text-center">
              {([wedding.parents.bride, wedding.parents.groom] as const).map((p) => (
                <div key={p.heading}>
                  <p className="font-body text-[10px] uppercase tracking-[0.25em] text-olive">
                    {p.heading}
                  </p>
                  <p className="mt-1 font-body text-sm text-espresso">{p.names}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={1350}>
            <button
              onClick={explore}
              className="mt-2 min-h-12 rounded-full bg-wine px-8 font-body text-sm font-bold uppercase tracking-widest text-ivory shadow-md transition active:scale-95"
            >
              Explore Wedding
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
