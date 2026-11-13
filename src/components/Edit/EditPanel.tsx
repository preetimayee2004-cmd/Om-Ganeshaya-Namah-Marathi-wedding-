import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { wedding } from "../../config/wedding";
import { apiUrl, callApi } from "../../lib/api";
import { DEFAULTS, DRAFT_KEY, pick, readDraft, type Content } from "../../lib/content";

/**
 * Website editor, opened with ?edit.
 * Change any text, photo or illustration, look at it with Preview, then Publish (saved to the
 * Google Sheet, live for every guest) or Download a content.json to put in /public.
 */

type Kind = "text" | "textarea" | "image" | "datetime" | "select" | "strings";
type Field = { path: string; label: string; kind: Kind; hint?: string; options?: [string, string][] };
type ListDef = {
  path: string;
  label: string;
  title: (item: Record<string, unknown>, i: number) => string;
  fields: Field[];
  newItem?: () => Record<string, unknown>;
  min?: number;
};
type Section = { id: string; title: string; note?: string; fields?: Field[]; lists?: ListDef[] };

const IMAGE_LABELS: Record<keyof typeof wedding.images, string> = {
  door: "Opening: darwaza (dono hisse isi tasveer se)",
  ganeshClosed: "Ganpati: aankhein band",
  ganeshBlessing: "Ganpati: aashirwad",
  invitationScene: "Invitation screen ka scene",
  coupleScene: "Couple section (Open Invitation ke baad)",
  thankYouCouple: "Thank You arch mein couple",
  rsvpCouple: "RSVP lifafe se nikalta couple (transparent PNG)",
  venue: "Venue illustration",
  sky: "Aasmaan background (har section ke peeche)",
  peacockBorder: "Scratch card ke upar-neeche ki patti",
  laptopBackground: "Laptop pe phone ke peeche ka background",
};

const SECTIONS: Section[] = [
  {
    id: "couple",
    title: "Dulha-dulhan, tareekh aur parents",
    fields: [
      { path: "couple.groom", label: "Dulhe ka naam", kind: "text" },
      { path: "couple.bride", label: "Dulhan ka naam", kind: "text" },
      { path: "couple.showFirst", label: "Pehle kiska naam dikhe", kind: "select", options: [["groom", "Dulha"], ["bride", "Dulhan"]] },
      { path: "date", label: "Shaadi ki tareekh aur muhurat (IST)", kind: "datetime" },
      { path: "parentsEn.groom", label: "Couple section: groom ke parents (English)", kind: "text", hint: "jaise: Son of Mr. Anil & Mrs. Sunita" },
      { path: "parentsEn.bride", label: "Couple section: bride ke parents (English)", kind: "text" },
      { path: "parentsMr.groom", label: "Groom ke parents (Marathi)", kind: "text" },
      { path: "parentsMr.bride", label: "Bride ke parents (Marathi)", kind: "text" },
      { path: "hashtag", label: "Hashtag", kind: "text" },
    ],
  },
  {
    id: "images",
    title: "Illustrations aur backgrounds",
    note: "Nayi tasveer usi shape/size ki ho to design sabse achha dikhega (jaise lambi tasveer ki jagah lambi).",
    fields: (Object.keys(IMAGE_LABELS) as (keyof typeof wedding.images)[]).map((k) => ({ path: `images.${k}`, label: IMAGE_LABELS[k], kind: "image" as const })),
  },
  {
    id: "events",
    title: "Events (Haldi, Mehendi, ...)",
    lists: [
      {
        path: "events",
        label: "Event",
        title: (e) => String(e.name || "Naya event"),
        fields: [
          { path: "name", label: "Naam", kind: "text" },
          { path: "marathi", label: "Marathi naam", kind: "text" },
          { path: "start", label: "Tareekh aur samay (IST)", kind: "datetime" },
          { path: "tagline", label: "Chhoti line", kind: "text" },
          { path: "venue", label: "Jagah", kind: "text" },
          { path: "mapUrl", label: "Google Maps link", kind: "text" },
          { path: "description", label: "Vivaran", kind: "textarea" },
          { path: "image", label: "Event ki photo", kind: "image" },
        ],
        newItem: () => ({
          id: `event-${Date.now()}`,
          art: "lagn",
          image: "/events/backup/ganpati.jpg", // backup Marathi illustration for any new event
          name: "New Event",
          marathi: "",
          start: wedding.date,
          tagline: "",
          venue: wedding.venue.name,
          mapUrl: wedding.venue.mapUrl,
          description: "",
          dressCode: [],
        }),
        min: 1,
      },
    ],
  },
  {
    id: "families",
    title: "Families",
    lists: [
      {
        path: "families",
        label: "Family",
        title: (f) => String(f.side),
        fields: [
          { path: "side", label: "Heading", kind: "text" },
          { path: "marathi", label: "Marathi heading", kind: "text" },
          { path: "surname", label: "Surname line", kind: "text", hint: "jaise: Kulkarni Family" },
          { path: "parents", label: "Parents (comma se alag karein)", kind: "strings" },
          { path: "message", label: "Message", kind: "textarea" },
          { path: "members", label: "Parivaar ki line (comma se alag karein)", kind: "strings" },
          { path: "photo", label: "Family photo", kind: "image" },
        ],
        min: 2,
      },
    ],
  },
  {
    id: "gallery",
    title: "Gallery photos",
    note: "Kam se kam 3 photos rakhein; teesri photo antarpat wale reveal mein sabse badi dikhti hai.",
    lists: [
      {
        path: "gallery",
        label: "Photo",
        title: (g, i) => `${i + 1}. ${String(g.caption || "Photo")}`,
        fields: [
          { path: "src", label: "Photo", kind: "image" },
          { path: "caption", label: "Caption", kind: "text" },
          { path: "alt", label: "Photo ka chhota vivaran (screen reader ke liye)", kind: "text" },
        ],
        newItem: () => ({ alt: "", caption: "Memories", ratio: "4/5", tone: "gold", src: "" }),
        min: 3,
      },
    ],
  },
  {
    id: "venue",
    title: "Venue aur travel",
    fields: [
      { path: "venue.name", label: "Venue ka naam", kind: "text" },
      { path: "venue.city", label: "Shahar", kind: "text" },
      { path: "venue.marathi", label: "Marathi heading", kind: "text" },
      { path: "venue.address", label: "Poora pata", kind: "textarea" },
      { path: "venue.mapUrl", label: "Google Maps link", kind: "text" },
      { path: "venue.note", label: "Note (parking, samay ...)", kind: "textarea" },
    ],
    lists: [
      {
        path: "travel",
        label: "Getting there",
        title: (t) => String(t.mode),
        fields: [
          { path: "mode", label: "Heading", kind: "text" },
          { path: "detail", label: "Detail", kind: "text" },
        ],
        min: 3,
      },
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    lists: [
      {
        path: "contacts",
        label: "Contact",
        title: (c) => `${String(c.name)} · ${String(c.role)}`,
        fields: [
          { path: "name", label: "Naam", kind: "text" },
          { path: "role", label: "Rishta / kaam", kind: "text", hint: "jaise: Bride's Brother" },
          { path: "phone", label: "Phone (country code ke saath, jaise +919876543210)", kind: "text" },
          { path: "note", label: "Chhota vivaran (coordinators ke liye, jaise: Stay, travel & pickups)", kind: "text" },
        ],
        newItem: () => ({ name: "", role: "", phone: "+91" }),
        min: 1,
      },
    ],
  },
  {
    id: "messages",
    title: "Messages",
    fields: [
      { path: "thankYouMessage", label: "Thank You message", kind: "textarea" },
      { path: "finalNote", label: "Footer ki aakhri line", kind: "text" },
    ],
  },
];

// ---------- helpers ----------
type Obj = Record<string, unknown>;
const get = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a as Obj | undefined)?.[k], o);
function setIn<T>(o: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const copy = (Array.isArray(o) ? [...o] : { ...(o as Obj) }) as Obj;
  const [head, ...rest] = keys;
  copy[head] = rest.length ? setIn(copy[head], rest.join("."), value) : value;
  return copy as T;
}
/** "2027-02-28T11:30:00+05:30" <-> "2027-02-28T11:30" (times are always IST) */
const toLocal = (iso: unknown) => (typeof iso === "string" ? iso.slice(0, 16) : "");
const fromLocal = (v: string) => (v ? `${v}:00+05:30` : "");

/** shrink a picked photo in the browser (max 1600px, PNG kept for transparency) */
async function shrink(file: File): Promise<{ dataUrl: string; mime: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const png = file.type === "image/png";
    const max = png ? 1200 : 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const mime = png ? "image/png" : "image/jpeg";
    return { dataUrl: c.toDataURL(mime, 0.85), mime };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------- inputs ----------
const inputCls =
  "w-full rounded-lg border border-[#d9c39a] bg-white px-3 py-2 font-body text-[15px] text-[#3b2417] outline-none focus:border-[#7a1420] focus:ring-2 focus:ring-[#7a1420]/20";

function ImageInput({ value, fallback, onChange, upload }: { value: string; fallback: string; onChange: (v: string) => void; upload: (f: File) => Promise<string> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="flex gap-3">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#d9c39a] bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-[#8a7]">Khaali</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-gold" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Upload ho raha hai…" : "Photo chuno"}
          </button>
          {value !== fallback && (
            <button type="button" className="rounded-full px-3 font-body text-sm text-[#7a1420] underline" onClick={() => onChange(fallback)}>
              Pehle wali
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              onChange(await upload(f));
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Upload nahi hua");
            } finally {
              setBusy(false);
            }
          }}
        />
        <input className={inputCls} value={value.startsWith("data:") ? "(is device se chuni gayi photo)" : value} readOnly={value.startsWith("data:")} placeholder="ya photo ka link (https://...)" onChange={(e) => onChange(e.target.value.trim())} />
        {err && <p className="font-body text-sm text-red-700">{err}</p>}
      </div>
    </div>
  );
}

function FieldInput({ f, value, fallback, onChange, upload }: { f: Field; value: unknown; fallback: unknown; onChange: (v: unknown) => void; upload: (file: File) => Promise<string> }) {
  const id = useMemo(() => `f-${Math.random().toString(36).slice(2)}`, []);
  let control: ReactNode;
  if (f.kind === "image") control = <ImageInput value={String(value ?? "")} fallback={String(fallback ?? "")} onChange={onChange} upload={upload} />;
  else if (f.kind === "textarea") control = <textarea id={id} rows={3} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  else if (f.kind === "datetime") control = <input id={id} type="datetime-local" className={inputCls} value={toLocal(value)} onChange={(e) => onChange(fromLocal(e.target.value))} />;
  else if (f.kind === "select")
    control = (
      <select id={id} className={inputCls} value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {f.options!.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    );
  else if (f.kind === "strings")
    control = (
      <input
        id={id}
        key={(Array.isArray(value) ? value : []).join("|")}
        className={inputCls}
        defaultValue={(Array.isArray(value) ? value : []).join(", ")}
        onBlur={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
      />
    );
  else control = <input id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-body text-[13px] font-bold text-[#5a3a1a]">
        {f.label}
      </label>
      {control}
      {f.hint && <p className="font-body text-xs text-[#8a6a4a]">{f.hint}</p>}
    </div>
  );
}

// ---------- panel ----------
export default function EditPanel() {
  const published = useMemo(() => pick(wedding), []);
  const [draft, setDraft] = useState<Content>(() => (readDraft() as Content | null) ?? published);
  const [hadDraft] = useState(() => readDraft() !== null);
  const [key, setKey] = useState(() => sessionStorage.getItem("wedding-admin-key") ?? "");
  const [msg, setMsg] = useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // keep an unpublished copy in this browser (Preview reads it)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      setMsg({ tone: "err", text: "Is browser mein draft save nahi ho paya (photos bahut badi hain). Publish ya Download kar lijiye." });
    }
  }, [draft]);

  useEffect(() => {
    document.title = "Website Editor";
  }, []);

  const update = (path: string, v: unknown) => setDraft((d) => setIn(d, path, v));

  const upload = async (f: File) => {
    const { dataUrl, mime } = await shrink(f);
    if (!apiUrl) return dataUrl; // no Google Sheet: the picture travels inside the settings file
    if (!key) throw new Error("Upload ke liye pehle upar Editor password daaliye.");
    const r = await callApi<{ url?: string }>({ type: "upload", key, name: f.name, mime, data: dataUrl.split(",")[1] });
    if (!r.ok || !r.url) throw new Error(r.error === "key" ? "Password galat hai." : "Upload nahi hua. Apps Script ka naya version deploy hua hai?");
    return r.url;
  };

  const publish = async () => {
    if (!apiUrl) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await callApi({ type: "content", key, content: draft });
      if (r.ok) {
        sessionStorage.setItem("wedding-admin-key", key);
        localStorage.removeItem(DRAFT_KEY);
        setMsg({ tone: "ok", text: "Publish ho gaya! Ab sab guests ko naya content dikhega." });
      } else setMsg({ tone: "err", text: r.error === "key" ? "Password galat hai." : r.error === "nokey" ? "Apps Script mein ADMIN_KEY set nahi hai (backend/SETUP.md dekhiye)." : "Save nahi hua." });
    } catch {
      setMsg({ tone: "err", text: "Google Sheet se connect nahi ho paya." });
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ tone: "info", text: "content.json download ho gayi. Ise project ke public/ folder mein rakh ke site dobara deploy karein." });
  };

  const preview = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.open("/?preview", "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-[#f6ecd9] pb-40">
      <header className="sticky top-0 z-20 border-b border-[#d9c39a] bg-[#fbf3e2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="font-script text-3xl text-[#7a1420]">Website Editor</h1>
          <a href="/" className="ml-auto font-body text-sm text-[#7a1420] underline">
            Site dekho
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        <div className="rounded-xl border border-[#d9c39a] bg-white/70 p-4 font-body text-[14px] leading-relaxed text-[#4a2a14]">
          <p>
            Koi bhi naam, tareekh, message, photo ya illustration yahan badlo. <b>Preview</b> se naye tab mein dekh lo, phir{" "}
            {apiUrl ? (
              <>
                <b>Publish</b> dabao: sab guests ko turant dikhega.
              </>
            ) : (
              <>
                <b>Download</b> dabao aur <code>content.json</code> ko project ke <code>public/</code> folder mein rakh ke deploy karo. (Google Sheet jodne pe seedha Publish bhi ho sakega: backend/SETUP.md)
              </>
            )}
          </p>
          {hadDraft && (
            <p className="mt-2 text-[#7a1420]">
              Pichhli baar ka bina publish kiya draft khula hai.{" "}
              <button type="button" className="underline" onClick={() => setDraft(published)}>
                Use chhod ke live content se shuru karo
              </button>
            </p>
          )}
          {apiUrl && (
            <div className="mt-3 space-y-1">
              <label htmlFor="admin-key" className="block text-[13px] font-bold">
                Editor password (Apps Script ka ADMIN_KEY)
              </label>
              <input id="admin-key" type="password" autoComplete="current-password" className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} />
            </div>
          )}
        </div>

        {SECTIONS.map((s) => (
          <details key={s.id} className="group rounded-xl border border-[#d9c39a] bg-[#fffaf0] open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-body text-[16px] font-bold text-[#7a1420]">
              {s.title}
              <span className="transition group-open:rotate-90">›</span>
            </summary>
            <div className="space-y-4 border-t border-[#eadcbf] px-4 py-4">
              {s.note && <p className="font-body text-[13px] text-[#8a6a4a]">{s.note}</p>}
              {s.fields?.map((f) => (
                <FieldInput key={f.path} f={f} value={get(draft, f.path)} fallback={get(DEFAULTS, f.path)} onChange={(v) => update(f.path, v)} upload={upload} />
              ))}
              {s.lists?.map((l) => {
                const items = (get(draft, l.path) as Obj[]) ?? [];
                const defaults = (get(DEFAULTS, l.path) as Obj[]) ?? [];
                const setItems = (next: Obj[]) => update(l.path, next);
                return (
                  <div key={l.path} className="space-y-3">
                    {items.map((item, i) => (
                      <details key={String(item.id ?? i)} className="rounded-lg border border-[#eadcbf] bg-white/80">
                        <summary className="cursor-pointer px-3 py-2 font-body text-[14px] font-semibold text-[#5a3a1a]">{l.title(item, i)}</summary>
                        <div className="space-y-3 border-t border-[#f0e4cc] p-3">
                          {l.fields.map((f) => (
                            <FieldInput
                              key={f.path}
                              f={f}
                              value={item[f.path]}
                              fallback={defaults[i]?.[f.path] ?? item[f.path]}
                              onChange={(v) => setItems(items.map((it, j) => (j === i ? { ...it, [f.path]: v } : it)))}
                              upload={upload}
                            />
                          ))}
                          <div className="flex flex-wrap gap-3 pt-1 font-body text-sm">
                            <button type="button" disabled={i === 0} className="text-[#7a1420] underline disabled:opacity-40" onClick={() => setItems(items.map((it, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : it)))}>
                              Upar karo
                            </button>
                            <button type="button" disabled={i === items.length - 1} className="text-[#7a1420] underline disabled:opacity-40" onClick={() => setItems(items.map((it, j) => (j === i + 1 ? items[i] : j === i ? items[i + 1] : it)))}>
                              Neeche karo
                            </button>
                            {l.newItem && items.length > (l.min ?? 0) && (
                              <button type="button" className="ml-auto text-red-700 underline" onClick={() => confirm(`"${l.title(item, i)}" hata dein?`) && setItems(items.filter((_, j) => j !== i))}>
                                Hatao
                              </button>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                    {l.newItem && (
                      <button type="button" className="btn-gold" onClick={() => setItems([...items, l.newItem!()])}>
                        + {l.label} jodo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        ))}

        <button
          type="button"
          className="font-body text-sm text-red-700 underline"
          onClick={() => confirm("Saari details shuru wali (default) kar dein? Abhi ke badlav is draft se hat jayenge.") && setDraft(JSON.parse(JSON.stringify(DEFAULTS)))}
        >
          Sab kuch default pe wapas karo
        </button>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d9c39a] bg-[#fbf3e2]/95 backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-3">
          {msg && (
            <p role="status" className={`font-body text-[14px] ${msg.tone === "err" ? "text-red-700" : msg.tone === "ok" ? "text-green-800" : "text-[#5a3a1a]"}`}>
              {msg.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-gold" onClick={preview}>
              Preview
            </button>
            {apiUrl && (
              <button type="button" className="btn-gold" disabled={saving || !key} onClick={publish}>
                {saving ? "Publish ho raha hai…" : "Publish"}
              </button>
            )}
            <button type="button" className="btn-gold" onClick={download}>
              Download content.json
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
