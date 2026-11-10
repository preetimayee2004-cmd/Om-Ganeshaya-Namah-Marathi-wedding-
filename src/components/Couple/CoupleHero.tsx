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

      {/* Top Sky Region Typography: Beautifully pre-rendered directly within the illustration (kept sr-only for SEO & screen readers) */}
      <div className="sr-only">
        <p lang="mr">दोन मने, एक गाठ</p>
        <p>Two hearts, one knot</p>
        <p>
          {wedding.couple.groom} &amp; {wedding.couple.bride}
        </p>
        <p>{wedding.parentsEn.groom}</p>
        <p>{wedding.parentsEn.bride}</p>
      </div>
      {/* 100% clean, no buttons! */}
    </section>
  );
}
