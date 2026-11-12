import type { CSSProperties } from "react";

/**
 * Picks a fitting typeface for a guest's wish from the script it is written in, so a blessing
 * in Marathi, Hindi, Bangla, Gujarati, Punjabi, Odia, Tamil, Telugu, Kannada, Malayalam or Urdu
 * shows in a proper font for that script (and right-to-left for Urdu / Arabic). Anything else
 * (English and other Latin text) keeps the site's Cormorant italic.
 * The fonts are linked in index.html; the browser only downloads a script's font when it is used.
 */

type Script = { re: RegExp; font: string; rtl?: boolean };

const SCRIPTS: Script[] = [
  { re: /[ऀ-ॿ]/g, font: '"Tiro Devanagari Marathi", "Noto Serif Devanagari", serif' },
  { re: /[ঀ-৿]/g, font: '"Noto Serif Bengali", serif' },
  { re: /[਀-੿]/g, font: '"Noto Sans Gurmukhi", sans-serif' },
  { re: /[઀-૿]/g, font: '"Noto Serif Gujarati", serif' },
  { re: /[଀-୿]/g, font: '"Noto Serif Oriya", serif' },
  { re: /[஀-௿]/g, font: '"Noto Serif Tamil", serif' },
  { re: /[ఀ-౿]/g, font: '"Noto Serif Telugu", serif' },
  { re: /[ಀ-೿]/g, font: '"Noto Serif Kannada", serif' },
  { re: /[ഀ-ൿ]/g, font: '"Noto Serif Malayalam", serif' },
  { re: /[؀-ۿݐ-ݿ]/g, font: '"Noto Naskh Arabic", serif', rtl: true },
];

const LATIN = /[A-Za-zÀ-ɏ]/g;
const SERIF = "'Cormorant Garamond', Georgia, serif";

/** style + dir for a piece of guest-written text; `size` is the Latin size in design px */
export function wishTextProps(text: string, size: number): { style: CSSProperties; dir?: "rtl" | "ltr" } {
  const latin = (text.match(LATIN) ?? []).length;
  let best: Script | null = null;
  let bestCount = 0;
  for (const s of SCRIPTS) {
    const n = (text.match(s.re) ?? []).length;
    if (n > bestCount) {
      best = s;
      bestCount = n;
    }
  }
  if (!best || bestCount <= latin) {
    return { style: { fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: `calc(var(--u) * ${size})`, lineHeight: 1.35 } };
  }
  // Indic and Arabic scripts: upright (italics break the letter shapes), a touch smaller, taller lines
  return {
    style: { fontFamily: best.font, fontStyle: "normal", fontWeight: 500, fontSize: `calc(var(--u) * ${size - 2})`, lineHeight: 1.65 },
    dir: best.rtl ? "rtl" : "ltr",
  };
}
