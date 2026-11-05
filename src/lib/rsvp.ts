import { apiUrl, postToApi } from "./api";

export interface RsvpInput {
  name: string;
  attending: "yes" | "no" | "";
  guests: number;
  phone: string;
  message: string;
}

export const rsvpLimits = { maxGuests: 10, nameMax: 40, msgMax: 300 };

const SENT_KEY = "rsvp-sent";
const OUTBOX_KEY = "rsvp-outbox";

export function validateRsvp(v: RsvpInput): Partial<Record<keyof RsvpInput, string>> {
  const e: Partial<Record<keyof RsvpInput, string>> = {};
  const n = v.name.trim().length;
  if (n < 2) e.name = "Please enter your name.";
  else if (n > rsvpLimits.nameMax) e.name = `Name must be under ${rsvpLimits.nameMax} characters.`;
  if (!v.attending) e.attending = "Please let us know if you can join us.";
  if (v.attending === "yes" && (!Number.isInteger(v.guests) || v.guests < 1 || v.guests > rsvpLimits.maxGuests))
    e.guests = `Please choose between 1 and ${rsvpLimits.maxGuests} guests.`;
  if (v.phone.trim()) {
    const digits = v.phone.replace(/\D/g, "");
    if (!/^[+\d][\d\s\-()]*$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15)
      e.phone = "Please enter a valid phone number, or leave it blank.";
  }
  if (v.message.length > rsvpLimits.msgMax) e.message = `Please keep it under ${rsvpLimits.msgMax} characters.`;
  return e;
}

export function readPreviousRsvp(): { attending: "yes" | "no"; guests: number } | null {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Sends an RSVP. With VITE_API_URL set it is saved to the Google Sheet; otherwise it is kept only in
 * this browser's localStorage (dev fallback) and is NOT delivered to the couple.
 */
export async function submitRsvp(v: RsvpInput): Promise<void> {
  const payload = {
    name: v.name.trim(),
    attending: v.attending,
    guests: v.attending === "yes" ? v.guests : 0,
    phone: v.phone.trim(),
    message: v.message.trim(),
    submittedAt: new Date().toISOString(),
  };
  if (apiUrl) {
    await postToApi({ type: "rsvp", ...payload });
  } else {
    await new Promise((r) => setTimeout(r, 700));
    try {
      const prev = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
      localStorage.setItem(OUTBOX_KEY, JSON.stringify([...prev, payload]));
    } catch {
      /* storage unavailable */
    }
  }
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify({ attending: payload.attending, guests: payload.guests }));
  } catch {
    /* ignore */
  }
}
