import SaveTheDate from "./SaveTheDate";
import AntarpatCountdown from "./AntarpatCountdown";

/** "Save the Date" calendar page, then the antarpat that opens onto the live countdown. */
export default function Countdown() {
  return (
    <section id="countdown" aria-label="Save the Date and wedding countdown" className="overflow-x-clip px-5 py-6">
      <div className="mx-auto max-w-md">
        <SaveTheDate />
        <div className="mx-auto my-8 h-px w-2/3 bg-gradient-to-r from-transparent via-[#C9963A] to-transparent" />
        <AntarpatCountdown />
      </div>
    </section>
  );
}
