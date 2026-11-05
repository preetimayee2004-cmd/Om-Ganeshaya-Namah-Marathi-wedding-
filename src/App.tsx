import Layout from "./components/Layout/Layout";
import Divider from "./components/Layout/Divider";
import Intro from "./components/Intro/Intro";
import Invitation from "./components/Invitation/Invitation";
import Couple from "./components/Couple/Couple";
import Countdown from "./components/Countdown/Countdown";
import OurStory from "./components/OurStory/OurStory";
import Events from "./components/Events/Events";
import Family from "./components/Family/Family";
import Gallery from "./components/Gallery/Gallery";
import RSVP from "./components/RSVP/RSVP";
import WishingWall from "./components/WishingWall/WishingWall";
import TravelStay from "./components/TravelStay/TravelStay";
import Contact from "./components/Contact/Contact";
import ThankYou from "./components/ThankYou/ThankYou";
import Footer from "./components/Footer/Footer";

export default function App() {
  return (
    <Layout>
      <Intro />
      <Invitation />
      <Divider />
      <Couple />
      <Countdown />
      <Divider />
      <OurStory />
      <Divider />
      <Events />
      <Divider />
      <Family />
      <Divider />
      <Gallery />
      <RSVP />
      <WishingWall />
      <Divider />
      <TravelStay />
      <Divider />
      <Contact />
      <ThankYou />
      <Footer />
    </Layout>
  );
}
