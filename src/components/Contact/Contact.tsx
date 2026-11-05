import { wedding } from "../../config/wedding";
import Reveal from "../Layout/Reveal";

const btn =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-wine px-4 font-body text-xs font-bold uppercase tracking-widest text-wine transition active:scale-95";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="px-5 pb-20 pt-4">
      <Reveal className="text-center">
        <p className="font-body text-[10px] uppercase tracking-[0.35em] text-olive">Need help?</p>
        <h2 id="contact-title" className="mt-2 text-5xl">Get in Touch</h2>
        <p className="mx-auto mt-2 max-w-[17rem] font-body text-sm text-espresso/70">
          For travel, stay or anything else, we are just a call away.
        </p>
      </Reveal>

      <ul className="mt-8 space-y-3">
        {wedding.contacts.map((c, i) => {
          const digits = c.phone.replace(/\D/g, "");
          return (
            <li key={c.name}>
              <Reveal delay={i * 100}>
                <div className="rounded-lg border border-gold/40 bg-[#fbf5e8] p-4">
                  <p className="font-body text-base font-bold text-espresso">{c.name}</p>
                  <p className="font-body text-xs uppercase tracking-widest text-olive">{c.role}</p>
                  <div className="mt-3 flex gap-3">
                    <a href={`tel:${c.phone}`} className={btn} aria-label={`Call ${c.name}`}>
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${digits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={btn}
                      aria-label={`WhatsApp ${c.name}`}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
