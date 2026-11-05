import { useEffect, useRef, useState, type FormEvent } from "react";
import { useGuest } from "../../context/GuestContext";
import { readPreviousRsvp, rsvpLimits, submitRsvp, validateRsvp, type RsvpInput } from "../../lib/rsvp";
import Reveal from "../Layout/Reveal";

const inputCls =
  "w-full rounded-md border border-gold/60 bg-[#fffdf6] px-4 py-3 font-body text-base text-espresso placeholder:text-espresso/40 focus:border-wine focus:outline-none focus:ring-2 focus:ring-gold/50";
const labelCls = "mb-1 block font-body text-xs uppercase tracking-widest text-olive";

export default function RSVP({ inScene = false }: { inScene?: boolean }) {
  const { guestName, isPersonalised } = useGuest();
  const [values, setValues] = useState<RsvpInput>({
    name: isPersonalised ? guestName : "",
    attending: "",
    guests: 1,
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RsvpInput, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [previous, setPrevious] = useState(readPreviousRsvp);
  const sending = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof RsvpInput>(k: K, v: RsvpInput[K]) => setValues((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    const errs = validateRsvp(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`rsvp-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    sending.current = true;
    setStatus("sending");
    try {
      await submitRsvp(values);
      setPrevious(readPreviousRsvp());
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      sending.current = false;
    }
  };

  const showDone = status === "sent" || (previous && status === "idle" && !values.attending);
  const attending = (previous?.attending ?? values.attending) === "yes";

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className={inScene ? "px-0 py-8" : "weave bg-maroon px-5 py-20 text-ivory"}>
      <Reveal className="text-center">
        <p className={`font-body text-[10px] uppercase tracking-[0.35em] ${inScene ? "text-gold" : "text-zari"}`}>Kindly reply</p>
        <h2 id="rsvp-title" className={`mt-2 text-5xl ${inScene ? "" : "!text-zari"}`}>RSVP</h2>
        <p className={`mx-auto mt-3 max-w-[18rem] font-body text-sm font-light ${inScene ? "text-espresso/80" : "text-ivory/80"}`}>
          Your presence would mean the world to us. Please let us know if you can join the celebration.
        </p>
      </Reveal>

      <Reveal className="mx-auto mt-8 max-w-sm" delay={150}>
        {showDone ? (
          <div ref={doneRef} tabIndex={-1} role="status" className="rounded-xl border border-gold/70 bg-ivory px-6 py-10 text-center text-espresso outline-none">
            <p className="font-script text-4xl text-wine">{attending ? "See you there!" : "You will be missed"}</p>
            <p className="mt-2 font-body text-sm">
              {attending
                ? `Your RSVP is confirmed${previous && previous.guests ? ` for ${previous.guests} ${previous.guests === 1 ? "guest" : "guests"}` : ""}. We can't wait to celebrate with you.`
                : "Thank you for letting us know. You'll be in our hearts on the day."}
            </p>
            <button
              onClick={() => {
                setPrevious(null);
                setStatus("idle");
                setValues((s) => ({ ...s, attending: "" }));
              }}
              className="mt-5 min-h-11 font-body text-xs font-bold uppercase tracking-widest text-wine underline underline-offset-4"
            >
              Change my response
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-xl border border-gold/70 bg-ivory p-5 text-espresso">
            <div>
              <label htmlFor="rsvp-name" className={labelCls}>Your name</label>
              <input
                id="rsvp-name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "rsvp-name-err" : undefined}
                className={inputCls}
              />
              {errors.name && <p id="rsvp-name-err" role="alert" className="mt-1 text-sm text-wine">{errors.name}</p>}
            </div>

            <fieldset>
              <legend className={labelCls}>Will you attend?</legend>
              <div id="rsvp-attending" tabIndex={-1} className="grid grid-cols-2 gap-3">
                {([
                  ["yes", "Joyfully accept"],
                  ["no", "Regretfully decline"],
                ] as const).map(([val, label]) => (
                  <label
                    key={val}
                    className={`flex min-h-14 cursor-pointer items-center justify-center rounded-md border px-2 text-center font-body text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
                      values.attending === val ? "border-wine bg-wine text-ivory" : "border-gold/60 bg-[#fffdf6]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="attending"
                      value={val}
                      checked={values.attending === val}
                      onChange={() => set("attending", val)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {errors.attending && <p role="alert" className="mt-1 text-sm text-wine">{errors.attending}</p>}
            </fieldset>

            {values.attending === "yes" && (
              <div>
                <label htmlFor="rsvp-guests" className={labelCls}>Number of guests (including you)</label>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Fewer guests" onClick={() => set("guests", Math.max(1, values.guests - 1))} className="h-12 w-12 rounded-full border border-gold/70 text-xl">−</button>
                  <input
                    id="rsvp-guests"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={rsvpLimits.maxGuests}
                    value={values.guests}
                    onChange={(e) => set("guests", Number(e.target.value))}
                    aria-invalid={!!errors.guests}
                    className={`${inputCls} text-center`}
                  />
                  <button type="button" aria-label="More guests" onClick={() => set("guests", Math.min(rsvpLimits.maxGuests, values.guests + 1))} className="h-12 w-12 rounded-full border border-gold/70 text-xl">+</button>
                </div>
                {errors.guests && <p role="alert" className="mt-1 text-sm text-wine">{errors.guests}</p>}
              </div>
            )}

            <div>
              <label htmlFor="rsvp-phone" className={labelCls}>Contact number <span className="normal-case tracking-normal text-espresso/50">(optional)</span></label>
              <input
                id="rsvp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "rsvp-phone-err" : undefined}
                className={inputCls}
              />
              {errors.phone && <p id="rsvp-phone-err" role="alert" className="mt-1 text-sm text-wine">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="rsvp-message" className={labelCls}>Message for the couple <span className="normal-case tracking-normal text-espresso/50">(optional)</span></label>
              <textarea
                id="rsvp-message"
                rows={3}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                className={`${inputCls} resize-none`}
              />
              {errors.message && <p role="alert" className="mt-1 text-sm text-wine">{errors.message}</p>}
            </div>

            {status === "error" && <p role="alert" className="text-sm text-wine">Something went wrong. Please try again.</p>}

            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-12 w-full rounded-full bg-wine font-body text-sm font-bold uppercase tracking-widest text-ivory shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Confirm Your Presence"}
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}
