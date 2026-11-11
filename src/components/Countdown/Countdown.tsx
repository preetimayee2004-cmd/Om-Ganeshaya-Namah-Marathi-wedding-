import Reveal from "../Layout/Reveal";
import DateReveal from "./DateReveal";

export default function Countdown() {
  return (
    <section id="countdown" aria-label="Maharashtrian Wedding Date Reveal" className="px-4 py-2 sm:px-6">
      <Reveal className="mx-auto max-w-md">
        {/* Cinematic Marathi Wedding Scratch-to-Reveal Card */}
        <DateReveal />
      </Reveal>
    </section>
  );
}
