import Layout from "./components/Layout/Layout";
import Intro from "./components/Intro/Intro";
import PinnedScene from "./components/Scene/PinnedScene";
import { ClosingCard, CountdownCard, EventsCard, RsvpBlessingsCard, StoryCard, VenueCard } from "./components/Scene/sections";

// Opening (tap to begin) -> pinned scene: the Paithani frame, arch, palace and couple stay fixed
// while these cards scroll over them. Family, Gallery and the other earlier section components
// are still in src/components if you want them back as extra cards.
export default function App() {
  return (
    <Layout>
      <Intro />
      <PinnedScene>
        <StoryCard />
        <EventsCard />
        <VenueCard />
        <CountdownCard />
        <RsvpBlessingsCard />
        <ClosingCard />
      </PinnedScene>
    </Layout>
  );
}
