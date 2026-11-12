import { sound, useSoundState } from "../../lib/sound";

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      {off ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}

/**
 * Speaker (top-left, always visible, on every section) and Skip (top-right, only while the
 * opening animation runs). `sticky` is used inside the laptop mockup's scrolling screen,
 * `fixed` on real phones.
 */
export default function TopControls({ mode }: { mode: "fixed" | "sticky" }) {
  const { muted, introActive } = useSoundState();
  const off = muted;
  const pill = "pointer-events-auto flex items-center justify-center rounded-full bg-[#fbf3e2]/95 text-[#3b2417] shadow-[0_2px_8px_rgba(60,30,10,0.25)] backdrop-blur-sm transition active:scale-95";

  const row = (
    <div className="top-controls pointer-events-none flex items-center justify-between">
      <button
        type="button"
        onClick={() => sound.toggle()}
        aria-label={off ? "Turn sound on" : "Turn sound off"}
        aria-pressed={!off}
        className={`${pill} h-[34px] w-[34px]`}
      >
        <SpeakerIcon off={off} />
      </button>
      {introActive && (
        <button type="button" onClick={() => sound.skipIntro()} className={`${pill} h-[32px] gap-1 px-4 font-body text-[14px] font-semibold`}>
          Skip
          <svg viewBox="0 0 16 16" className="h-[12px] w-[12px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      )}
    </div>
  );

  if (mode === "sticky") {
    return <div className="pointer-events-none sticky top-0 z-[110] h-0">{row}</div>;
  }
  return <div className="pointer-events-none fixed inset-x-0 top-0 z-[110] mx-auto max-w-[430px]">{row}</div>;
}
