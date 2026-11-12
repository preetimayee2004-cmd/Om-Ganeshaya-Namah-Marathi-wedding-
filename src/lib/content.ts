import { wedding, refreshCoupleOrder } from "../config/wedding";
import { apiUrl } from "./api";

/**
 * Editable site content.
 *
 * `wedding` (src/config/wedding.ts) holds the defaults. At startup, before the first render,
 * saved changes are merged over it in this order:
 *   1. /content.json        a settings file shipped with the site (from the Edit panel's Download)
 *   2. the Google Sheet      what was published from the Edit panel (needs VITE_API_URL)
 *   3. ?preview only         the editor's unpublished draft from this browser
 * The last successfully loaded published content is cached, so repeat visits start instantly.
 */

/** the parts of `wedding` the Edit panel can change */
export const EDITABLE_KEYS = [
  "images",
  "couple",
  "date",
  "parentsEn",
  "parentsMr",
  "events",
  "families",
  "gallery",
  "venue",
  "travel",
  "contacts",
  "thankYouMessage",
  "finalNote",
  "hashtag",
] as const;
type Key = (typeof EDITABLE_KEYS)[number];
export type Content = { [K in Key]: (typeof wedding)[K] };

const CACHE_KEY = "wedding-content-published";
export const DRAFT_KEY = "wedding-content-draft";

/** deep copy of the built-in defaults, taken before anything is merged */
export const DEFAULTS: Content = JSON.parse(JSON.stringify(pick(wedding)));

export function pick(src: typeof wedding | Content): Content {
  const out = {} as Record<string, unknown>;
  for (const k of EDITABLE_KEYS) out[k] = (src as Record<string, unknown>)[k];
  return JSON.parse(JSON.stringify(out)) as Content;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** only allow images from this site, https, or an embedded picture; only http(s) links */
function safeValue(key: string, v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (/url$/i.test(key)) return /^https?:\/\//i.test(v) || v === "" ? v : undefined;
  if (/^(src|photo|image)$/.test(key) || key in DEFAULTS.images) {
    if (v === "" || v.startsWith("/") || /^https:\/\//i.test(v) || /^data:image\/(png|jpe?g|webp);base64,/i.test(v)) {
      return v.replace(/["'()\\\s]/g, (c) => (c === " " ? "%20" : ""));
    }
    return undefined;
  }
  return v;
}

/** merge `src` into `target` in place: objects recurse, arrays and values are replaced */
function merge(target: Obj, src: Obj) {
  for (const [k, v] of Object.entries(src)) {
    if (isObj(v) && isObj(target[k])) merge(target[k] as Obj, v);
    else if (Array.isArray(v)) target[k] = sanitizeArray(v);
    else {
      const safe = safeValue(k, v);
      if (safe !== undefined) target[k] = safe;
    }
  }
}
function sanitizeArray(arr: unknown[]): unknown[] {
  return arr.map((item) => {
    if (!isObj(item)) return item;
    const copy: Obj = {};
    for (const [k, v] of Object.entries(item)) {
      const safe = isObj(v) ? v : Array.isArray(v) ? v : safeValue(k, v);
      if (safe !== undefined) copy[k] = safe;
    }
    return copy;
  });
}

export function applyContent(over: Partial<Content> | null | undefined) {
  if (!isObj(over)) return;
  const picked: Obj = {};
  for (const k of EDITABLE_KEYS) if (k in over) picked[k] = (over as Obj)[k];
  merge(wedding as unknown as Obj, picked);
  refreshCoupleOrder();
  document.documentElement.style.setProperty("--sky-image", `url("${wedding.images.sky}")`);
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

const getJson = async (url: string) => {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok || !(r.headers.get("content-type") ?? "").includes("json")) return null;
  return r.json();
};

export const isPreview = () => new URLSearchParams(location.search).has("preview");

export function readDraft(): Partial<Content> | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
}

/** called once in main.tsx before the first render */
export async function loadContent() {
  let cached: Partial<Content> | null = null;
  try {
    cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
  } catch {
    /* no cache */
  }
  const [file, sheet] = await Promise.all([
    withTimeout(getJson("/content.json").catch(() => null), 2500),
    apiUrl ? withTimeout(getJson(`${apiUrl}?type=content`).catch(() => null), 3000) : Promise.resolve(null),
  ]);
  applyContent(file);
  const published = sheet && isObj(sheet.content) ? (sheet.content as Partial<Content>) : null;
  // the Sheet wins; if it is slow or offline, the copy from the last visit stands in
  applyContent(published ?? cached);
  try {
    if (published) localStorage.setItem(CACHE_KEY, JSON.stringify(published));
  } catch {
    /* storage full or blocked */
  }
  if (isPreview()) applyContent(readDraft());
  // anything else still at its default keeps the sky variable in sync
  document.documentElement.style.setProperty("--sky-image", `url("${wedding.images.sky}")`);
}
