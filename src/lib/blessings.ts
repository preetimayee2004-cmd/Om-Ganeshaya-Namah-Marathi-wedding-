import { apiUrl, postToApi } from "./api";

/** Approved blessings from the Sheet (latest 50). Returns null if storage isn't connected or fails. */
export async function fetchApprovedBlessings(): Promise<BlessingInput[] | null> {
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}?type=blessings`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.blessings)
      ? data.blessings.map((b: { name: string; message: string }) => ({ name: String(b.name), message: String(b.message) }))
      : null;
  } catch {
    return null;
  }
}

export interface BlessingInput {
  name: string;
  message: string;
}

const OUTBOX_KEY = "blessings-outbox";
const LAST_KEY = "blessings-last";

export const limits = { nameMin: 2, nameMax: 40, msgMin: 1, msgMax: 300 };

export function validate(v: BlessingInput): Partial<Record<keyof BlessingInput, string>> {
  const errors: Partial<Record<keyof BlessingInput, string>> = {};
  const n = v.name.trim().length;
  const m = v.message.trim().length;
  if (n < limits.nameMin) errors.name = "Please enter your name.";
  else if (n > limits.nameMax) errors.name = `Name must be under ${limits.nameMax} characters.`;
  if (m < limits.msgMin) errors.message = "Please write your blessing.";
  else if (m > limits.msgMax) errors.message = `Please keep it under ${limits.msgMax} characters.`;
  return errors;
}

/** True if this exact blessing was already sent from this browser. */
export function isDuplicate(v: BlessingInput): boolean {
  try {
    return localStorage.getItem(LAST_KEY) === `${v.name.trim()}|${v.message.trim()}`;
  } catch {
    return false;
  }
}

/**
 * Sends a blessing for moderation. It is never shown publicly until approved.
 * With VITE_API_URL set it is saved to the Google Sheet; otherwise it is only kept in this
 * browser's localStorage (dev fallback) and is NOT delivered to the couple.
 */
export async function submitBlessing(v: BlessingInput): Promise<void> {
  const payload = { name: v.name.trim(), message: v.message.trim(), submittedAt: new Date().toISOString() };
  if (apiUrl) {
    await postToApi({ type: "blessing", ...payload });
  } else {
    await new Promise((r) => setTimeout(r, 700));
    try {
      const prev = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
      localStorage.setItem(OUTBOX_KEY, JSON.stringify([...prev, payload]));
    } catch {
      /* storage unavailable: nothing more to do in the dev fallback */
    }
  }
  try {
    localStorage.setItem(LAST_KEY, `${payload.name}|${payload.message}`);
  } catch {
    /* ignore */
  }
}
