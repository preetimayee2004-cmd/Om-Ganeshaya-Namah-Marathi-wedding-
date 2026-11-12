import Reveal from "../Layout/Reveal";
import DateReveal from "./DateReveal";

export default function Countdown() {
  return (
    <section id="countdown" aria-label="Maharashtrian Wedding Date Reveal" className="py-2 px-6">
      <Reveal className="mx-auto max-w-md">
        {/* Cinematic Marathi Wedding Scratch-to-Reveal Card */}
        <DateReveal />
      </Reveal>
    </section>
  );
}
