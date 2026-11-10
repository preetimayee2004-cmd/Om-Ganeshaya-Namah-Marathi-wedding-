import { useEffect, useRef, useState, type ReactNode } from "react";
import { frameStyle, useViewportHeight } from "./SceneFrame";
import { wedding } from "../../config/wedding";

/**
 * PinnedScene: Displays the grand settled hero (Couple under Mandap)
 * and scrolls the celebration cards over the royal canvas.
 */
export default function PinnedScene({ children }: { children: ReactNode }) {
  const vh = useViewportHeight();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [bw, setBw] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => setBw(el.clientWidth * 0.0885);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toStory = () =>
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div ref={wrapRef} style={{ position: "relative", containerType: "inline-size" }}>
      <div style={{ ...frameStyle, minHeight: vh }}>
        {/* First Hero Screen: The Maharashtrian Couple under Mandap (matching Scene 6 settled state) */}
        <div style={{ position: "relative", height: bw ? vh - 2 * bw : vh, overflow: "hidden" }}>
          <img
            src="/intro/couple-mandap.jpg"
            alt="The bride and groom in traditional Maharashtrian attire under the floral mandap"
            className="h-full w-full object-cover"
            draggable={false}
          />

          {/* Sky Region Typography: Matching Scene 6 */}
          <div className="absolute inset-x-0 top-0 z-10 px-6 pt-14 text-center">
            <p lang="mr" className="font-marathi text-2xl font-bold text-[#6d0f1b]">
              दोन मने, एक गाठ
            </p>
            <p className="font-serif text-xs italic tracking-wider text-[#7a3a2a]">
              Two hearts, one knot
            </p>

            <div className="mt-3">
              <p className="font-script text-4xl text-[#6d0f1b]">
                {wedding.couple.groom}{" "}
                <span className="text-2xl text-[#a8741a]">&amp;</span>{" "}
                {wedding.couple.bride}
              </p>
            </div>

            <div className="my-2 flex justify-center">
              <svg viewBox="0 0 160 12" className="h-3 w-36 text-[#a8741a]" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M10 6 L65 6 M95 6 L150 6" />
                <circle cx="80" cy="6" r="3" fill="#6d0f1b" />
              </svg>
            </div>

            <div className="space-y-0.5">
              <p lang="mr" className="font-marathi text-xs text-[#4b0f16]">
                सुपुत्र {wedding.parentsMr.groom}
              </p>
              <p lang="mr" className="font-marathi text-xs text-[#4b0f16]">
                सुकन्या {wedding.parentsMr.bride}
              </p>
            </div>
          </div>

          {/* Scroll Down Cue */}
          <button
            onClick={toStory}
            aria-label="Scroll down to wedding celebration details"
            className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center text-center transition active:scale-95 cursor-pointer"
          >
            <div
              className="flex items-center gap-2 rounded-full border border-[#f0b44c]/60 px-4 py-1.5 shadow-lg backdrop-blur-md"
              style={{ backgroundColor: "rgba(251, 245, 232, 0.92)" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 animate-bounce text-[#6d0f1b]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <div className="flex flex-col text-left">
                <span lang="mr" className="font-marathi text-[11px] font-bold leading-none text-[#6d0f1b]">
                  खाली स्क्रोल करा
                </span>
                <span className="font-body text-[8px] font-bold uppercase tracking-wider text-[#a8741a]">
                  Scroll to celebrate
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Scrollable Celebration Cards */}
        <div id="story" style={{ padding: "28px 12px 48px" }} className="flex flex-col gap-7">
          {children}
        </div>
      </div>
    </div>
  );
}
