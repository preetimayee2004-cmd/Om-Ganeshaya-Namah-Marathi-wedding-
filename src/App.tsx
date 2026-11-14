import { useEffect } from "react";
import Layout from "./components/Layout/Layout";
import Intro from "./components/Intro/Intro";
import Countdown from "./components/Countdown/Countdown";
import Events from "./components/Events/Events";
import Family from "./components/Family/Family";
import Gallery from "./components/Gallery/Gallery";
import RSVP from "./components/RSVP/RSVP";
import WishingWall from "./components/WishingWall/WishingWall";
import TravelStay from "./components/TravelStay/TravelStay";
import ThankYou from "./components/ThankYou/ThankYou";
import Footer from "./components/Footer/Footer";
import Blooms from "./components/Layout/Blooms";
import Chapter from "./components/Layout/Chapter";

/**
 * Premium Cinematic Maharashtrian Wedding Invitation.
 * 
 * Flow:
 * 1. Intro Opening: Envelope -> Ganpati -> Invitation -> Couple Section (Scene 6 settled).
 * 2. As the user scrolls down, all subsequent sections share the exact same
 *    luminous sky background as the couple section:
 *    - Countdown
 *    - 5. Events
 *    - 6. Family
 *    - 7. Gallery
 *    - 8. RSVP
 *    - 9. Blessing Wall
 *    - 10. Venue
 *    - 11. Thank You
 *    - 12. Final Love Notice (Footer)
 */
export default function App() {
  useEffect(() => {
    const handleHash = (instant = false) => {
      if (!window.location.hash) return;
      const el = document.querySelector(window.location.hash);
      if (el) el.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    };
    // Instant jump on initial load with hash
    const t = setTimeout(() => handleHash(true), 250);
    const onHashChange = () => handleHash(false);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <Layout>
      <div className="sky-bg relative w-full overflow-x-hidden">
        {/* Intro & Fixed Couple Section Hero (Settled on Scene 6, no buttons) */}
        <Intro />

        {/* Everything from Save the Date to Thank You sits in one long framed paper card,
            the same margin and gold frame line as the Thank You card, so the page reads as one */}
        <div className="framed-page">
        {/* 2. Countdown */}
        <Blooms corners={["tl", "tr"]}>
          <Chapter n={1} name="The Date" tone="parchment">
          <Countdown />
        </Chapter>
        </Blooms>

        {/* 5. Events */}
        <Blooms corners={["tr", "bl"]}>
          <Chapter n={2} name="The Celebrations" tone="saffron">
          <Events />
        </Chapter>
        </Blooms>

        {/* 6. Family */}
        <Blooms corners={["tl"]}>
          <Chapter n={3} name="Our Families" tone="blush">
          <Family />
        </Chapter>
        </Blooms>

        {/* 7. Gallery */}
        <Chapter n={4} name="Moments" tone="parchment">
          <Gallery />
        </Chapter>

        {/* 8. RSVP */}
        <Blooms corners={["tl", "br"]}>
          <Chapter n={5} name="Your Presence" tone="blush">
          <RSVP />
        </Chapter>
        </Blooms>

        {/* 9. Blessing Wall */}
        <Blooms corners={["tr", "bl"]}>
          <Chapter n={6} name="Blessings" tone="sage">
          <WishingWall />
        </Chapter>
        </Blooms>

        {/* 10. Venue */}
        <Blooms corners={["tl", "br"]}>
          <Chapter n={7} name="The Venue" tone="saffron">
          <TravelStay />
        </Chapter>
        </Blooms>

        {/* 11. Thank You */}
        <Blooms corners={["tr", "bl"]}>
          <Chapter n={8} name="With Gratitude" tone="parchment">
          <ThankYou />
        </Chapter>
        </Blooms>
        </div>

        {/* 12. Final Love Notice */}
        <Blooms corners={["tl", "tr"]} size={88}>
          <Footer />
        </Blooms>
      </div>
    </Layout>
  );
}
