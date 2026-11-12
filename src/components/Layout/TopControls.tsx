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
 * Speaker (always visible: top-left during the opening, top-right after it) and Skip (top-right, only while the
 * opening animation runs). `sticky` is used inside the laptop mockup's scrolling screen,
 * `fixed` on real phones.
 */
export default function TopControls({ mode }: { mode: "fixed" | "sticky" }) {
  const { muted, introActive } = useSoundState();
  const off = muted;
  // frosted-glass round buttons, the same look as the couple section's back (‹) button
  const pill =
    "pointer-events-auto flex h-9 items-center justify-center rounded-full border border-white/75 bg-white/45 text-[#6d0f1b] shadow-[0_4px_20px_rgba(75,15,22,0.18),inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/65 active:scale-95";

  // during the opening: sound on the left, Skip on the right; from the couple section on: sound on the right
  const row = (
    <div className={`top-controls pointer-events-none flex items-center ${introActive ? "justify-between" : "justify-end"}`}>
      <button
        type="button"
        onClick={() => sound.toggle()}
        aria-label={off ? "Turn sound on" : "Turn sound off"}
        aria-pressed={!off}
        className={`${pill} w-9`}
      >
        <SpeakerIcon off={off} />
      </button>
      {introActive && (
        <button type="button" onClick={() => sound.skipIntro()} className={`${pill} gap-1.5 px-4 font-serif text-[13px] font-bold uppercase tracking-[0.14em]`}>
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
