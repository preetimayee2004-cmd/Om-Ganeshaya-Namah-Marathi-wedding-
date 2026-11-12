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
  // same gold pill as the Open Invitation button (.btn-gold)
    // outline (stroke) pills, the same everywhere
  const pill = "btn-gold btn-outline pointer-events-auto";

  const row = (
    <div className="top-controls pointer-events-none flex items-center justify-between">
      <button
        type="button"
        onClick={() => sound.toggle()}
        aria-label={off ? "Turn sound on" : "Turn sound off"}
        aria-pressed={!off}
        className={`${pill} h-[36px] w-[36px] !px-0`}
      >
        <SpeakerIcon off={off} />
      </button>
      {introActive && (
        <button type="button" onClick={() => sound.skipIntro()} className={`${pill} gap-1.5`}>
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
