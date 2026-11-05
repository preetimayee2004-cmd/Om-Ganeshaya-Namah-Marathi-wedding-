import { useEffect, useRef, useState } from "react";
import { useScrollRoot } from "../Layout/ScrollRoot";

// Placeholder timing (ms). Refine once the reference video is shared.
const DOOR_MS = 1600; // doors swing open
const GREETING_HOLD_MS = 1400; // greeting stays visible before the overlay fades
const FADE_MS = 900; // overlay fade-out

type Stage = "closed" | "opening" | "leaving" | "done";

const wood =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0 2px, transparent 2px 9px), linear-gradient(180deg, #4a2f26 0%, #382923 55%, #2b1d18 100%)";

function Door({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div
      className="absolute top-0 h-full w-1/2"
      style={{
        [isLeft ? "left" : "right"]: 0,
        background: wood,
        boxShadow: isLeft
          ? "inset -6px 0 14px rgba(0,0,0,0.5)"
          : "inset 6px 0 14px rgba(0,0,0,0.5)",
        transformOrigin: isLeft ? "left center" : "right center",
        transition: `transform ${DOOR_MS}ms cubic-bezier(0.65, 0, 0.25, 1)`,
        transform: "var(--door-t)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* arched carved panel */}
      <div className="absolute inset-x-3 bottom-8 top-12 rounded-t-[999px] border border-gold/70 p-2">
        <div className="h-full w-full rounded-t-[999px] border border-gold/40" />
      </div>
      {/* lotus motif */}
      <svg
        viewBox="0 0 40 40"
        className="absolute left-1/2 top-[22%] h-10 w-10 -translate-x-1/2 text-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        aria-hidden
      >
        <path d="M20 6c4 5 4 11 0 16-4-5-4-11 0-16Z" />
        <path d="M20 22c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
        <path d="M8 26c4 5 8 7 12 7s8-2 12-7" />
      </svg>
      {/* studs */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-gold/80"
          style={{ top: `${58 + i * 9}%`, [isLeft ? "right" : "left"]: "22px" }}
        />
      ))}
      {/* handle ring */}
      <span
        className="absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-2 border-gold"
        style={{ [isLeft ? "right" : "left"]: "10px" }}
      />
    </div>
  );
}

export default function Intro() {
  const [stage, setStage] = useState<Stage>("closed");
  const scroller = useScrollRoot();
  const timers = useRef<number[]>([]);

  // Lock scrolling while the overlay is up.
  useEffect(() => {
    if (stage === "done") return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    scroller?.scrollTo(0, 0);
    return () => {
      el.style.overflow = prev;
    };
  }, [stage, scroller]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    // Reduced motion: CSS collapses the transitions, so don't hold the screen for them either.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const door = reduce ? 0 : DOOR_MS;
    const hold = reduce ? 600 : GREETING_HOLD_MS;
    const fade = reduce ? 0 : FADE_MS;
    later(() => setStage("leaving"), door + hold);
    later(() => setStage("done"), door + hold + fade);
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStage("done");
  };

  if (stage === "done") return null;

  const opened = stage !== "closed";

  return (
    <div
      role="dialog"
      aria-label="Opening animation"
      className="absolute inset-0 z-[90] min-h-full overflow-hidden bg-ivory"
      style={{
        height: scroller ? scroller.clientHeight : "100dvh",
        position: scroller ? "absolute" : "fixed",
        opacity: stage === "leaving" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        perspective: "1400px",
      }}
    >
      {/* Revealed behind the doors */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, #fff6e2 0%, #F7EEDC 55%, #E8C9BE 140%)",
        }}
      >
        <span className="font-script text-7xl text-gold" aria-hidden>
          ॐ
        </span>
        <p lang="mr" className="text-2xl text-wine">
          ॥ श्री गणेशाय नमः ॥
        </p>
        <p className="font-script text-3xl text-wine">Welcome</p>
      </div>

      {/* Doors */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: opened ? "none" : "auto" }}
      >
        <DoorPair opened={opened} />
      </div>

      {/* Controls */}
      {!opened && (
        <div className="absolute inset-x-0 bottom-[12%] z-10 flex flex-col items-center gap-4">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
            You are invited
          </p>
          <button
            autoFocus
            onClick={open}
            className="rounded-full border border-gold bg-wine px-8 py-3 font-body text-sm font-bold uppercase tracking-widest text-ivory shadow-lg transition active:scale-95"
          >
            Open Invitation
          </button>
        </div>
      )}
      <button
        onClick={skip}
        className="absolute right-4 top-14 z-20 rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-widest text-gold/90 underline-offset-4 hover:underline lg:top-12"
      >
        Skip
      </button>
    </div>
  );
}

function DoorPair({ opened }: { opened: boolean }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ ["--door-t" as string]: opened ? "rotateY(-105deg)" : "rotateY(0deg)" }}
      >
        <Door side="left" />
      </div>
      <div
        className="absolute inset-0"
        style={{ ["--door-t" as string]: opened ? "rotateY(105deg)" : "rotateY(0deg)" }}
      >
        <Door side="right" />
      </div>
    </>
  );
}
