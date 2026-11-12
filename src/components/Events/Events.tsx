import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";
import { useGuest } from "../../context/GuestContext";
import { EV_CSS } from "./eventParts";
import { EventVignette } from "./Vignettes";

/** small dotted gold thread + bead joining one vignette to the next */
function Thread() {
  return (
    <div aria-hidden className="flex flex-col items-center py-2">
      <span className="h-[22px] w-0 border-l border-dashed" style={{ borderColor: "#b8862f" }} />
      <span className="h-[7px] w-[7px] rotate-45" style={{ background: "#C9963A" }} />
      <span className="h-[22px] w-0 border-l border-dashed" style={{ borderColor: "#b8862f" }} />
    </div>
  );
}

export default function Events() {
  const { guestName, isPersonalised } = useGuest();

  return (
    <section id="events" aria-labelledby="events-title" className="overflow-x-clip px-5 py-6">
      <style>{EV_CSS}</style>
      <Reveal className="text-center">
        <p className="font-body text-[11px] uppercase tracking-[0.35em] text-olive">
          Order of the day
        </p>
        <h2 id="events-title" className="section-title mt-2">
          Wedding Celebrations
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] font-body text-sm text-espresso/70">
          {isPersonalised ? (
            <>
              <span className="guest-name">{guestName}</span>, here is how we celebrate.
            </>
          ) : (
            "Here is how we celebrate."
          )}
        </p>
      </Reveal>

      <ol className="mt-8">
        {wedding.events.map((e, i) => (
          <li key={e.id} className="list-none">
            {i > 0 && <Thread />}
            <EventVignette e={e} index={i} />
          </li>
        ))}
      </ol>
    </section>
  );
}
