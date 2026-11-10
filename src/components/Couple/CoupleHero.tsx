import { wedding } from "../../config/wedding";

/**
 * CoupleHero: The grand Maharashtrian couple under the floral mandap.
 * Serves as the top hero section of the scrollable page.
 * Unobstructed by buttons, continuing seamlessly into the sky background below.
 */
export default function CoupleHero() {
  return (
    <section id="couple" className="relative h-screen min-h-[100dvh] w-full overflow-hidden select-none bg-[#F8DFBF]">
      <div className="absolute inset-0">
        <img
          src="/intro/couple-mandap.jpg"
          alt="The Maharashtrian Bride and Groom in Traditional Attire"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Top Sky Region Typography: Matching Scene 6 (positioned below floral toran to prevent overlap) */}
      <div className="absolute inset-x-0 top-0 z-10 px-6 pt-28 sm:pt-32 text-center">
        <p lang="mr" className="font-marathi text-2xl font-bold text-[#6d0f1b] drop-shadow-sm">
          दोन मने, एक गाठ
        </p>
        <p className="font-serif text-xs italic tracking-wider text-[#7a3a2a]">
          Two hearts, one knot
        </p>

        <div className="mt-3">
          <p className="font-script text-4xl text-[#6d0f1b]">
            {wedding.couple.groom}{" "}
            <span className="text-2xl text-[#a8741a]">&amp;</span>{" "}
            {wedding.couple.bride}
          </p>
        </div>

        <div className="my-2 flex justify-center">
          <svg viewBox="0 0 160 12" className="h-3 w-36 text-[#a8741a]" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M10 6 L65 6 M95 6 L150 6" />
            <circle cx="80" cy="6" r="3" fill="#6d0f1b" />
          </svg>
        </div>

        <div className="space-y-0.5">
          <p className="font-serif text-[13px] sm:text-sm font-medium tracking-wide text-[#4b0f16]">
            {wedding.parentsEn.groom}
          </p>
          <p className="font-serif text-[13px] sm:text-sm font-medium tracking-wide text-[#4b0f16]">
            {wedding.parentsEn.bride}
          </p>
        </div>
      </div>
      {/* 100% clean, no buttons! */}
    </section>
  );
}
