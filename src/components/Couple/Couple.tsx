import { wedding, coupleOrder } from "../../config/wedding";
import Reveal, { useInView } from "../Layout/Reveal";

// The couple in traditional Maharashtrian wedding attire under the mandap
export function CouplePlaceholder() {
  return (
    <img
      src="/intro/couple-mandap.jpg"
      alt="The bride and groom in traditional Maharashtrian wedding attire"
      draggable={false}
      className="h-full w-full object-cover"
      style={{ objectPosition: "50% 50%" }}
    />
  );
}

function PaithaniBorder() {
  return (
    <svg
      className="h-6 w-full"
      preserveAspectRatio="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        <pattern id="paithani" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M12 2l8 10-8 10-8-10Z" fill="#722B35" />
          <path d="M12 7l4 5-4 5-4-5Z" fill="#C6A15B" />
          <circle cx="0" cy="12" r="1.6" fill="#687253" />
          <circle cx="24" cy="12" r="1.6" fill="#687253" />
        </pattern>
      </defs>
      <rect width="100%" height="2" fill="#C6A15B" />
      <rect y="2" width="100%" height="24" fill="url(#paithani)" />
    </svg>
  );
}

function Lotus({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`absolute h-9 w-9 text-blush ${className}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M20 4c5 6 5 14 0 20-5-6-5-14 0-20Z" />
      <path d="M20 24c-8-1-13-6-14-13 8 0 13 4 14 13Zm0 0c8-1 13-6 14-13-8 0-13 4-14 13Z" opacity=".8" />
    </svg>
  );
}

export default function Couple() {
  const [archRef, archSeen] = useInView<HTMLDivElement>(0.25);
  const { bride, groom } = wedding.couple;
  const [first, second] = coupleOrder;
  const bios = (
    wedding.couple.showFirst === "groom"
      ? [[groom, wedding.bios.groom], [bride, wedding.bios.bride]]
      : [[bride, wedding.bios.bride], [groom, wedding.bios.groom]]
  ) as [string, string][];

  return (
    <section
      id="couple"
      aria-labelledby="couple-title"
      className="px-5 pb-16 pt-20 text-center"
    >
      <Reveal>
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">
          Meet the couple
        </p>
        <h2 id="couple-title" className="mt-2 text-4xl leading-tight">
          {wedding.coupleHeading}
        </h2>
      </Reveal>

      {/* Peshwa-style arch: rises from the bottom, then the couple settles in */}
      <div ref={archRef} className="relative mx-auto mt-10 w-[78%] max-w-[300px]">
        <Lotus className="-left-5 top-1/3" />
        <Lotus className="-right-5 top-1/2 -scale-x-100" />
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border-2 border-gold bg-gradient-to-b from-blush/50 to-ivory transition-all duration-[1200ms] ease-out"
          style={{
            clipPath: archSeen ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
          }}
        >
          <div className="absolute inset-2 rounded-t-[999px] border border-gold/50" />
          <div
            className="absolute inset-x-4 bottom-6 top-12 transition-all delay-700 duration-1000 ease-out"
            style={{
              opacity: archSeen ? 1 : 0,
              transform: archSeen ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
            }}
          >
            <CouplePlaceholder />
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <PaithaniBorder />
          </div>
        </div>
      </div>

      {/* Names slide in from opposite sides */}
      <div className="mt-8 overflow-hidden">
        <div
          className="flex items-baseline justify-center gap-3 font-script text-5xl text-wine transition-all duration-1000 ease-out"
          style={{
            opacity: archSeen ? 1 : 0,
            transform: archSeen ? "none" : "translateY(10px)",
            transitionDelay: "1100ms",
          }}
        >
          <span
            className="transition-all duration-1000 ease-out"
            style={{
              transform: archSeen ? "translateX(0)" : "translateX(-24px)",
              transitionDelay: "1100ms",
            }}
          >
            {first}
          </span>
          <span className="text-3xl text-gold">&amp;</span>
          <span
            className="transition-all duration-1000 ease-out"
            style={{
              transform: archSeen ? "translateX(0)" : "translateX(24px)",
              transitionDelay: "1100ms",
            }}
          >
            {second}
          </span>
        </div>
      </div>

      <Reveal className="mx-auto mt-5 max-w-[20rem]">
        <p className="font-body text-[15px] font-light leading-relaxed">
          {wedding.coupleMessage}
        </p>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-xs grid-cols-2 gap-5">
        {bios.map(([name, bio], i) => (
          <Reveal key={name} delay={i * 150}>
            <h3 className="text-3xl">{name}</h3>
            <p className="mt-1 font-body text-[13px] leading-relaxed text-espresso/80">
              {bio}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
