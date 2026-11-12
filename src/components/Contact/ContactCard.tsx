import type { CSSProperties, ReactNode } from "react";
import { wedding } from "../../config/wedding";
import { useInView } from "../Layout/Reveal";
import { Mundavalya, Pheta } from "./HeadGear";

/**
 * Contact & Assistance as one framed ivory card: "The Families" (the bride's and groom's
 * contacts side by side, with Var / Vadhu Paksha) and "Coordinators" (one row each with a short
 * note). Every person has a filled maroon Call button and an outlined WhatsApp button.
 * Contacts whose role mentions the bride or the groom are family; everyone else is a coordinator.
 */

const MAROON = "#7a1420";
const INK = "#4a1a16";
const GOLD = "#b8862f";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const u = (n: number) => `calc(var(--u) * ${n})`;

type Contact = (typeof wedding.contacts)[number];
const side = (c: Contact) => (/groom/i.test(c.role) ? "groom" : /bride/i.test(c.role) ? "bride" : null);
const digits = (phone: string) => phone.replace(/[^\d]/g, "");

function Lotus({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 18" style={{ width: u(size), height: u(size * 0.56) }} fill="none" stroke={GOLD} strokeWidth="1.1" aria-hidden>
      <path d="M16 1.5c3 3 4 8 0 13-4-5-3-10 0-13Z" fill="#fbf1dc" />
      <path d="M16 14.5c-2-5-6-8-11-8 1 5 5 8 11 8Zm0 0c2-5 6-8 11-8-1 5-5 8-11 8Z" fill="#fbf1dc" />
      <path d="M3 15.5c4 2 22 2 26 0" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="mx-auto my-5 flex items-center justify-center gap-2" style={{ width: "78%" }} aria-hidden>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <Lotus size={26} />
      <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
    </div>
  );
}

function Label({ children, color = GOLD, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <p className="font-body text-[12.5px] font-bold uppercase tracking-[0.16em]" style={{ color, ...style }}>
      {children}
    </p>
  );
}

function Actions({ c }: { c: Contact }) {
  const size = u(42);
  return (
    <div className="flex items-center gap-2.5">
      <a
        href={`tel:${c.phone}`}
        aria-label={`Call ${c.name}, ${c.role}`}
        className="inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95"
        style={{ width: size, height: size, background: "linear-gradient(180deg, #8f1427, #6d0f1b)", boxShadow: `0 ${u(3)} ${u(8)} rgba(90,10,20,0.3)` }}
      >
        <svg viewBox="0 0 16 16" style={{ width: u(16), height: u(16) }} fill="none" stroke="#f6dfe0" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
          <path d="M3.5 2.5h2.2l1.1 3-1.5 1a8 8 0 0 0 4.2 4.2l1-1.5 3 1.1v2.2a1.5 1.5 0 0 1-1.6 1.5A11 11 0 0 1 2 4.1a1.5 1.5 0 0 1 1.5-1.6Z" />
        </svg>
      </a>
      <a
        href={`https://wa.me/${digits(c.phone)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${c.name}, ${c.role}`}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#fffaf4] transition active:scale-95"
        style={{ width: size, height: size, border: `${u(1.5)} solid ${MAROON}` }}
      >
        <svg viewBox="0 0 16 16" style={{ width: u(17), height: u(17) }} fill="none" stroke={MAROON} strokeWidth="1.3" aria-hidden>
          <path d="M8 2.2c3.4 0 6 2.3 6 5.2s-2.6 5.2-6 5.2c-.8 0-1.6-.1-2.3-.4L3 13.4l.8-2.4C2.7 10.1 2 8.8 2 7.4c0-2.9 2.6-5.2 6-5.2Z" />
          <circle cx="5.4" cy="7.4" r=".55" fill={MAROON} stroke="none" />
          <circle cx="8" cy="7.4" r=".55" fill={MAROON} stroke="none" />
          <circle cx="10.6" cy="7.4" r=".55" fill={MAROON} stroke="none" />
        </svg>
      </a>
    </div>
  );
}

/** gold curl for the two bottom corners */
function Corner({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 30 30" className={`pointer-events-none absolute bottom-[14px] ${flip ? "right-[14px] -scale-x-100" : "left-[14px]"}`} style={{ width: u(26), height: u(26) }} fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path d="M3 27C3 15 9 9 19 9c5 0 8 3 8 6s-2.5 5-5 5-4-1.6-4-3.6c0-1.6 1.2-2.6 2.6-2.6" />
      <path d="M3 27h10" />
    </svg>
  );
}

export default function ContactCard() {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const family = wedding.contacts.filter((c) => side(c));
  const coordinators = wedding.contacts.filter((c) => !side(c));
  const fade = (d: number): CSSProperties => ({
    opacity: seen ? 1 : 0,
    transform: seen ? "none" : `translateY(${u(10)})`,
    transition: `opacity 700ms ease ${d}ms, transform 700ms ease ${d}ms`,
  });

  return (
    <div ref={ref} className="relative mx-auto mt-7 max-w-[400px] px-5 pb-10 pt-9" style={{ background: "#fbf1dc", border: `${u(1.5)} solid #dcc08a`, borderRadius: u(6), boxShadow: `0 ${u(8)} ${u(22)} ${u(-12)} rgba(110,70,20,0.35)` }}>
      {/* inner hairline frame and the lotus that breaks the top border */}
      <div className="pointer-events-none absolute rounded-[3px]" style={{ inset: u(7), border: `${u(1)} solid #e4cd9c` }} aria-hidden />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#fbf1dc] px-2" aria-hidden>
        <Lotus size={34} />
      </div>
      <Corner />
      <Corner flip />
      {/* the groom's pheta on the left corner, the mundavalya on the right */}
      <Pheta className="pointer-events-none absolute z-[2] drop-shadow-[0_3px_4px_rgba(80,20,10,0.25)]" style={{ left: u(-16), top: u(-34), width: u(84) }} />
      <Mundavalya className="pointer-events-none absolute z-[2]" style={{ right: u(-6), top: u(-10), width: u(74) }} />

      {family.length > 0 && (
        <>
          <Label style={{ textAlign: "center", letterSpacing: "0.3em", ...fade(0) }}>The Families</Label>
          <div className="relative mt-4 grid grid-cols-2" style={fade(120)}>
            <span className="absolute bottom-1 left-1/2 top-1 w-px -translate-x-1/2" style={{ background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)` }} aria-hidden />
            {family.slice(0, 2).map((c) => (
              <div key={c.role + c.name} className="flex flex-col items-center px-2 text-center">
                <Label color={MAROON}>{c.role}</Label>
                <p className="mt-1 text-[23px] font-semibold leading-tight [overflow-wrap:anywhere]" style={{ fontFamily: SERIF, color: INK }}>
                  {c.name}
                </p>
                <p className="mt-0.5 text-[16px] italic" style={{ fontFamily: SERIF, color: "#8a6f62" }}>
                  {side(c) === "groom" ? "Var Paksha" : "Vadhu Paksha"}
                </p>
                <div className="mt-3">
                  <Actions c={c} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {family.length > 0 && coordinators.length > 0 && <Divider />}

      {coordinators.length > 0 && (
        <div style={fade(240)}>
          <Label style={{ textAlign: "center", letterSpacing: "0.3em" }}>Coordinators</Label>
          <ul className="mt-3">
            {coordinators.map((c, i) => (
              <li key={c.role + c.name} className="flex items-center gap-3 py-3.5" style={{ borderTop: i ? `${u(1)} solid #ecdcb9` : undefined }}>
                <div className="min-w-0 flex-1 text-left">
                  <Label>{c.role}</Label>
                  <p className="mt-0.5 text-[22px] font-semibold leading-tight [overflow-wrap:anywhere]" style={{ fontFamily: SERIF, color: INK }}>
                    {c.name}
                  </p>
                  {c.note && (
                    <p className="text-[15.5px] italic" style={{ fontFamily: SERIF, color: "#8a6f62" }}>
                      {c.note}
                    </p>
                  )}
                </div>
                <Actions c={c} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
