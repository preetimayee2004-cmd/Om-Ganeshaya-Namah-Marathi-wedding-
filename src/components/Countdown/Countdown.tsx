import SaveTheDate from "./SaveTheDate";

/** "Save the Date" calendar page (the countdown box was removed on request). */
export default function Countdown() {
  return (
    <section id="countdown" aria-label="Save the Date" className="overflow-x-clip px-5 py-6">
      <div className="mx-auto max-w-md">
        <SaveTheDate />
      </div>
    </section>
  );
}
