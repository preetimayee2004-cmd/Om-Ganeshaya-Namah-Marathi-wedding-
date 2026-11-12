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
        <Countdown />

        {/* 5. Events */}
        <Events />

        {/* 6. Family */}
        <Family />

        {/* 7. Gallery */}
        <Gallery />

        {/* 8. RSVP */}
        <RSVP />

        {/* 9. Blessing Wall */}
        <WishingWall />

        {/* 10. Venue */}
        <TravelStay />

        {/* 11. Thank You */}
        <ThankYou />
        </div>

        {/* 12. Final Love Notice */}
        <Footer />
      </div>
    </Layout>
  );
}
