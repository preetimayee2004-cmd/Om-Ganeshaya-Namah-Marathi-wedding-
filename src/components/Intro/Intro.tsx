import { useEffect, useRef, useState, type CSSProperties } from "react";
import PointerHand from "../Layout/PointerHand";
import { useScrollRoot } from "../Layout/ScrollRoot";
import { wedding, coupleOrder } from "../../config/wedding";
import { sound } from "../../lib/sound";
import { useGuest } from "../../context/GuestContext";

// ===== SMOKE REVEAL SETTINGS (invitation -> couple screen) =====
const SMOKE_MS = 1800;     // speed: total time of the reveal (bigger = slower)
const SMOKE_BLOBS = 8;     // number of overlapping smoke blobs
const SMOKE_SOFT = 16;     // softness of the edge, in % (bigger = softer, more cloud-like)
const SMOKE_SPREAD = 140;  // px: how far blob centres wander from the button
const SMOKE_SPARKLES = 25; // golden sparkles drifting out of the button
const smokeSupported = () =>
  typeof CSS !== "undefined" && "registerProperty" in CSS &&
  (CSS.supports("mask-image", "radial-gradient(#000, transparent)") || CSS.supports("-webkit-mask-image", "radial-gradient(#000, transparent)"));

interface Sparkle { id: number; tx: number; ty: number; size: number; delay: number; dur: number }

/**
 * MASTER MOTION TIMING — CINEMATIC MARATHI WEDDING OPENING
 * 
 * SCENE 1 — Envelope Opening (2.8s)
 * SCENE 2 — Ganpati Bappa Reveal (3.4s) [Eyes open 0.9s-1.7s, Blessing hand 1.4s-2.3s]
 * SCENE 3 — Ganpati to Invitation Transition (2.4s)
 * SCENE 4 — Invitation Screen Reveal (2.8s) [Line by line 180ms, drawing divider, wada courtyard]
 * SCENE 5 — Invitation to Couple Transition (2.2s) [Triggered on scroll/tap]
 * SCENE 6 — Couple Section Reveal (2.8s) [Bride 0.35-1.3s, Groom 0.65-1.5s, settling, quotation]
 * 
 * Global Easings:
 *  - Primary: cubic-bezier(0.22, 1, 0.36, 1)
 *  - Secondary: cubic-bezier(0.4, 0, 0.2, 1)
 *  - Soft Exit: cubic-bezier(0.16, 1, 0.3, 1)
 */

const EASE_PRIMARY = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_SECONDARY = "cubic-bezier(0.4, 0, 0.2, 1)";
const EASE_SOFT_EXIT = "cubic-bezier(0.16, 1, 0.3, 1)";
/** couple-section names: Great Vibes has no bold, so a thin same-colour outline thickens the strokes */
const NAME_STROKE = { WebkitTextStroke: "0.7px #6d0f1b" } as const;

/** left-to-right watercolor "ink" wipe: a soft-edged mask slides across the text */
const inkWipe = (show: boolean, delay: number, ms = 1100): CSSProperties => {
  const mask = "linear-gradient(90deg, #000 40%, transparent 60%)";
  return {
    // the mask only covers the element's box, and script swashes reach past it: pad the box
    // (and pull it back with negative margins) so no stroke of the name gets clipped
    padding: "0.3em 0.4em 0.22em",
    margin: "-0.3em -0.4em -0.22em",
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: "260% 100%",
    maskSize: "260% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: show ? "0% 0" : "100% 0",
    maskPosition: show ? "0% 0" : "100% 0",
    transition: `-webkit-mask-position ${ms}ms cubic-bezier(.45,0,.25,1) ${delay}ms, mask-position ${ms}ms cubic-bezier(.45,0,.25,1) ${delay}ms`,
  };
};

/** small gold scroll flanking the ampersand */
function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 48 14" className={`h-[11px] w-[40px] text-[#a8741a] ${flip ? "-scale-x-100" : ""}`} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden>
      <path d="M2 7h26c6 0 9-4 6-6-3-1.5-5 2-3 4 2 1.6 6 1 9-1" />
      <circle cx="44" cy="5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** read at mount time, so images changed from the Edit panel are the ones preloaded */
const introImages = () => {
  const i = wedding.images;
  return [i.door, i.ganeshClosed, i.ganeshBlessing, i.invitationScene, i.coupleScene];
};

const MAROON = "#6d0f1b";

interface Particle {
  id: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
}

// Falling Rose & Marigold Petals data matching the user's video (negative delays so they are already mid-flight)
const ROSE_PETALS = [
  { id: 1, left: "12%", delay: "-0.5s", duration: "5.5s", size: 19, rot: 15, isMarigold: false },
  { id: 2, left: "26%", delay: "-2.8s", duration: "4.8s", size: 23, rot: -25, isMarigold: true },
  { id: 3, left: "42%", delay: "-1.2s", duration: "5.8s", size: 17, rot: 35, isMarigold: false },
  { id: 4, left: "59%", delay: "-3.5s", duration: "4.6s", size: 21, rot: -15, isMarigold: false },
  { id: 5, left: "76%", delay: "-0.8s", duration: "5.2s", size: 18, rot: 28, isMarigold: true },
  { id: 6, left: "88%", delay: "-2.2s", duration: "5.0s", size: 16, rot: -30, isMarigold: false },
  { id: 7, left: "18%", delay: "-4.1s", duration: "5.4s", size: 22, rot: 20, isMarigold: false },
  { id: 8, left: "70%", delay: "-1.7s", duration: "4.9s", size: 15, rot: -20, isMarigold: false },
  { id: 9, left: "50%", delay: "-3.0s", duration: "5.6s", size: 24, rot: 40, isMarigold: true },
];

// Authentic Multi-Lobed Watercolor Paint Splash Vector Path matching video frame 00:04
const WATERCOLOR_SPLASH_PATH =
  "M 500,60 " +
  "C 580,55 650,95 700,150 " +
  "C 755,210 820,230 865,290 " +
  "C 915,355 940,430 925,510 " +
  "C 910,595 865,665 820,730 " +
  "C 770,800 710,855 635,890 " +
  "C 555,925 470,930 395,905 " +
  "C 320,880 255,835 200,770 " +
  "C 145,705 105,630 100,545 " +
  "C 95,455 130,375 180,305 " +
  "C 230,235 295,185 365,135 " +
  "C 425,90 460,62 500,60 Z";

// Radiating Watercolor Splatter Droplets
const SPLASH_DROPLETS = [
  { id: 1, angle: 15, dist: 130, size: 14, dx: 110, dy: -25 },
  { id: 2, angle: 42, dist: 155, size: 9, dx: 135, dy: 75 },
  { id: 3, angle: 68, dist: 140, size: 16, dx: 105, dy: 130 },
  { id: 4, angle: 95, dist: 165, size: 8, dx: 30, dy: 160 },
  { id: 5, angle: 125, dist: 150, size: 13, dx: -80, dy: 145 },
  { id: 6, angle: 155, dist: 170, size: 10, dx: -150, dy: 90 },
  { id: 7, angle: 185, dist: 145, size: 15, dx: -160, dy: -15 },
  { id: 8, angle: 215, dist: 160, size: 7, dx: -130, dy: -95 },
  { id: 9, angle: 245, dist: 150, size: 12, dx: -70, dy: -145 },
  { id: 10, angle: 280, dist: 175, size: 16, dx: 25, dy: -170 },
  { id: 11, angle: 315, dist: 155, size: 11, dx: 115, dy: -125 },
  { id: 12, angle: 345, dist: 140, size: 8, dx: 140, dy: -50 },
  { id: 13, angle: 30, dist: 190, size: 6, dx: 170, dy: 60 },
  { id: 14, angle: 110, dist: 195, size: 7, dx: -45, dy: 185 },
  { id: 15, angle: 200, dist: 185, size: 6, dx: -175, dy: -55 },
  { id: 16, angle: 295, dist: 190, size: 8, dx: 70, dy: -180 },
];

export default function Intro() {
  const { guestName, isPersonalised } = useGuest();
  // Stages:
  // 0: Initial closed envelope (waiting for tap)
  // 1: Scene 1 — Envelope Opening (2.8s)
  // 2: Scene 2 — Ganpati Bappa Reveal (3.4s)
  // 3: Scene 3 — Ganpati to Invitation Transition (2.4s)
  // 4: Scene 4 — Invitation Screen Reveal (2.8s) -> then holds for user scroll/tap
  // 5: Scene 5 — Invitation to Couple Transition (2.2s)
  // 6: Scene 6 — Couple Section Reveal (2.8s)
  // 7: Completed (hands off to main scroll root)
  const getInitialStage = () => {
    if (typeof window === "undefined") return 0;
    const p = new URLSearchParams(window.location.search).get("scene");
    if (p === "ganpati" || p === "2") return 2;
    if (p === "splash" || p === "3") return 3;
    if (p === "invitation" || p === "4") return 4;
    if (p === "couple" || p === "6") return 6;
    if (p === "done" || p === "7") return 7;
    return 0;
  };

  const [stage, setStage] = useState<number>(getInitialStage);
  const stageNow = useRef(stage); // latest stage for timers created in earlier renders
  stageNow.current = stage;
  const [ready, setReady] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Micro-timings for Scene 1 (Royal Temple Double Doors Opening)
  const [s1Scale, setS1Scale] = useState(false);
  const [s1DoorUnlock, setS1DoorUnlock] = useState(false);
  const [s1DoorOpen, setS1DoorOpen] = useState(false);

  // Micro-timings for Scene 2 (Smooth Divine Ganpati Reveal matching video)
  const [s2Silhouette, setS2Silhouette] = useState(() => getInitialStage() === 2);
  const [s2KenBurns, setS2KenBurns] = useState(() => getInitialStage() === 2);
  const [s2MantraGlow, setS2MantraGlow] = useState(() => getInitialStage() === 2);
  const [s2Halo, setS2Halo] = useState(() => getInitialStage() === 2);
  const [s2GlowAwaken, setS2GlowAwaken] = useState(() => getInitialStage() === 2);
  const [s2BlessingMurti, setS2BlessingMurti] = useState(() => getInitialStage() === 2);
  const [s2Settle, setS2Settle] = useState(() => getInitialStage() === 2);

  // Micro-timings for Scene 3
  const [s3SplashStart, setS3SplashStart] = useState(() => getInitialStage() === 3);
  const [s3SplashSpread, setS3SplashSpread] = useState(() => getInitialStage() === 3);
  const [s3GaneshDissolve, setS3GaneshDissolve] = useState(() => getInitialStage() >= 4);
  const [s3WadaAppear, setS3WadaAppear] = useState(() => getInitialStage() >= 3);
  const [s3DetailsReveal, setS3DetailsReveal] = useState(() => getInitialStage() >= 4);

  // Micro-timings for Scene 4
  const [s4Heading, setS4Heading] = useState(() => getInitialStage() === 4);
  const [s4Lines, setS4Lines] = useState<boolean[]>(() =>
    getInitialStage() === 4 ? [true, true, true, true, true, true, true] : [false, false, false, false, false, false, false]
  );
  const [s4Dividers, setS4Dividers] = useState(() => getInitialStage() === 4);
  const [s4Temple, setS4Temple] = useState(() => getInitialStage() === 4);
  const [s4Hold, setS4Hold] = useState(() => getInitialStage() === 4);

  // Micro-timings for Scene 5
  const [s5SplashUp, setS5SplashUp] = useState(false);
  // smoke reveal: the CSS mask (null = none), whether it is running, sparkles, and a double-click lock
  const [smokeMask, setSmokeMask] = useState<string | null>(null);
  const [smokeActive, setSmokeActive] = useState(false);
  const [smokeFade, setSmokeFade] = useState(false); // fallback: plain cross-fade
  const [smokeOrigin, setSmokeOrigin] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [wadaMask, setWadaMask] = useState<string | null>(null); // smoke mask for the Ganpati -> invitation reveal
  const smokeBusy = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [s5TextDissolve, setS5TextDissolve] = useState(false);
  const [s5CoupleBg, setS5CoupleBg] = useState(() => getInitialStage() >= 6);

  // Micro-timings for Scene 6
  const [s6Landscape, setS6Landscape] = useState(() => getInitialStage() === 6);
  const [s6Bride, setS6Bride] = useState(() => getInitialStage() === 6);
  const [s6Groom, setS6Groom] = useState(() => getInitialStage() === 6);
  const [s6BothSettle, setS6BothSettle] = useState(() => getInitialStage() === 6);
  const [s6Names, setS6Names] = useState(() => getInitialStage() === 6);
  const [s6Divider, setS6Divider] = useState(() => getInitialStage() === 6);
  const [s6Quotation, setS6Quotation] = useState(() => getInitialStage() === 6);
  const [s6Finished, setS6Finished] = useState(false);


  const scroller = useScrollRoot();
  const timers = useRef<number[]>([]);
  const touchStartY = useRef<number | null>(null);

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const [first, second] = coupleOrder;
  // invitation screen shows the place only (the date is revealed later by the scratch card)

  // Preload all 5 master images
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    Promise.all(
      introImages().map(
        (src) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.onload = img.onerror = () => res();
            img.src = src;
          })
      )
    ).then(finish);
    const timeout = window.setTimeout(finish, 2500);
    return () => clearTimeout(timeout);
  }, []);

  // Skip button (top-right) is shown only while the opening animation runs (doors -> invitation)
  useEffect(() => {
    sound.setIntroActive(stage < 5 && !smokeActive);
  }, [stage, smokeActive]);

  // Lock scroll while intro animation is playing (unlocked on Scene 6 for natural scrolling)
  useEffect(() => {
    if (stage >= 6) return;
    const el = scroller ?? document.body;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    scroller?.scrollTo(0, 0);
    return () => {
      el.style.overflow = prev;
    };
  }, [stage, scroller]);

  // Cleanup timers on unmount
  useEffect(() => () => clearAllTimers(), []);

  // Fast-forward / Skip to end (settles permanently on the Couple section)
  const skip = () => {
    clearAllTimers();
    setStage(6);
    setS6Landscape(true);
    setS6Bride(true);
    setS6Groom(true);
    setS6BothSettle(true);
    setS6Names(true);
    setS6Divider(true);
    setS6Quotation(true);
    setS6Finished(true);
  };

  useEffect(() => {
    const w = window as unknown as {
      __skipIntro?: () => void;
      __goToInvitation?: () => void;
      __goToCouple?: () => void;
    };
    w.__skipIntro = skip;
    sound.registerIntro(skip);
    w.__goToInvitation = triggerBackToInvitation;
    w.__goToCouple = triggerCoupleTransition;
  }, []);

  // Check reduced motion
  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------------------------------------------
  // SCENE 1: ROYAL TEMPLE DOUBLE DOORS (OPENS TO REVEAL GANPATI)
  // -------------------------------------------------------------
  const handleDoorTap = () => {
    if (stage !== 0 || !ready) return;
    sound.start(); // the door tap is the first gesture: background music begins here

    if (reduced()) {
      skip();
      return;
    }

    setStage(1);

    // 0.00s: subtle tactile scale press feedback 1 -> 1.02
    setS1Scale(true);

    // 0.15s: divine golden light burst & particles from the central "श्री" medallion
    later(() => {
      setS1DoorUnlock(true);
      // Generate radial golden particles
      const p: Particle[] = [];
      const colors = ["#ffd780", "#ffecb4", "#e2a84b", "#ffffff", "#f6d98a", "#d4af37"];
      for (let i = 0; i < 28; i++) {
        const angle = (i * (360 / 28) * Math.PI) / 180 + (Math.random() * 0.25 - 0.12);
        const dist = 30 + Math.random() * 70;
        p.push({
          id: i,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          size: 3 + Math.random() * 4,
          color: colors[i % colors.length],
        });
      }
      setParticles(p);
    }, 150);

    // 0.25s: The double doors swing smoothly inward (away from the guest) in 3D perspective
    later(() => setS1DoorOpen(true), 250);

    // 1.5s: Doors have swung inward -> directly flow into Ganpati Bappa Divine Awakening!
    later(() => runScene2(), 1500);
  };

  // -------------------------------------------------------------
  // SCENE 2: GANPATI BAPPA DIVINE REVEAL
  // Directly visible under the opening flaps, awakens smoothly
  // -------------------------------------------------------------
  const runScene2 = () => {
    setStage(2);
    setS2Silhouette(true);
    setS2KenBurns(true);
    setS2MantraGlow(true);

    // 0.35s: Divine golden sunburst halo begins rotating behind crown
    later(() => setS2Halo(true), 350);

    // 0.85s: Warm golden prana radiance bloom bathes Bappa's chest & crown
    later(() => setS2GlowAwaken(true), 850);

    // 1.25s: Under the veil of warm golden light, eyes open & hand raises into Abhaya Mudra blessing
    later(() => setS2BlessingMurti(true), 1250);

    // 2.20s: Prana light bloom gently settles into golden halo, presenting full blessing murti
    later(() => setS2Settle(true), 2200);

    // 3.00s: only a brief darshan after the blessing settles (2.2s), then flow on automatically.
    // Nothing on this screen is tappable: the guest cannot jump ahead, and it never waits for a tap.
    later(() => runScene3(), 3000);
  };

  // -------------------------------------------------------------
  // SCENE 3: GANPATI TO INVITATION WATERCOLOR SPLASH TRANSITION
  // -------------------------------------------------------------
  const runScene3 = () => {
    setStage(3);

    // Smoke grows out of Ganpati's centre and reveals the courtyard invitation scene
    const box = stageRef.current?.getBoundingClientRect();
    const ox = (box?.width ?? 390) / 2;
    const oy = (box?.height ?? 844) * 0.46;
    setSmokeOrigin({ x: ox, y: oy });
    setSparkles(buildSparkles());
    const supported = smokeSupported();
    if (supported) setWadaMask(buildSmokeMask(ox, oy));

    // Ganpati melts away underneath the cloud
    later(() => setS3GaneshDissolve(true), 800);

    // The invitation text starts as the smoke finishes
    later(() => runScene4(), supported ? SMOKE_MS - 300 : 700);

    // Smoke done: drop the mask so the scene renders normally
    later(() => {
      setWadaMask(null);
      setSparkles([]);
    }, supported ? SMOKE_MS + 100 : 1000);
  };

  // -------------------------------------------------------------
  // SCENE 4: INVITATION SCREEN REVEAL
  // -------------------------------------------------------------
  const runScene4 = () => {
    setStage(4);

    // 0.00s – 0.50s: Ganesh line & invitation heading fade in
    setS4Heading(true);

    // 0.35s: Couple names fade in
    later(() => {
      setS4Lines((prev) => {
        const next = [...prev];
        next[0] = true;
        return next;
      });
    }, 350);

    // 0.75s: Slim "See Couple ›" glass button reveals, holds cleanly
    later(() => setS4Hold(true), 750);
    // After a reading pause the film continues on its own (one tap for the whole opening);
    // "Open Invitation" still lets the guest move on sooner.
    later(() => {
      if (stageNow.current === 4 && !smokeBusy.current) triggerCoupleTransition();
    }, 6500);
  };

  // -------------------------------------------------------------
  // TRANSITION BACK TO INVITATION FROM COUPLE SECTION
  // -------------------------------------------------------------
  const triggerBackToInvitation = () => {
    // Scroll smoothly to top if user had scrolled down
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    setStage(4);
    setS4Heading(true);
    setS4Lines([true, true, true, true, true, true, true]);
    setS4Dividers(true);
    setS4Temple(true);
    setS4Hold(true);

    // Reset Scene 5 transition states
    setS5SplashUp(false);
    setS5TextDissolve(false);
    setS5CoupleBg(false);
  };

  // -------------------------------------------------------------
  // SCENE 5: INVITATION TO COUPLE TRANSITION
  // Continuous cinematic flow into Couple Section
  // -------------------------------------------------------------
  /** N soft radial-gradient blobs growing from (ox, oy); --r is animated by .smoke-reveal */
  const buildSmokeMask = (ox: number, oy: number) =>
    Array.from({ length: SMOKE_BLOBS }, () => {
      const x = ox + (Math.random() * 2 - 1) * SMOKE_SPREAD;
      const y = oy + (Math.random() * 2 - 1) * SMOKE_SPREAD;
      const f = (0.55 + Math.random() * 0.55).toFixed(2); // growth factor 0.55 - 1.10
      return `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, #000 calc(var(--r) * ${f}), transparent calc(var(--r) * ${f} + ${SMOKE_SOFT}%))`;
    }).join(", ");
  const buildSparkles = (): Sparkle[] =>
    Array.from({ length: SMOKE_SPARKLES }, (_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 190;
      return { id: i, tx: Math.cos(ang) * dist, ty: Math.sin(ang) * dist - 30, size: 2 + Math.random() * 3, delay: Math.random() * 500, dur: 900 + Math.random() * 800 };
    });

  const triggerCoupleTransition = (e?: React.MouseEvent<HTMLElement>) => {
    if (s6Finished) {
      setStage(6);
      setS6Landscape(true);
      setS6Bride(true);
      setS6Groom(true);
      setS6BothSettle(true);
      setS6Names(true);
      setS6Divider(true);
      setS6Quotation(true);
      return;
    }

    if (smokeBusy.current) return; // ignore double clicks while it runs
    smokeBusy.current = true;

    // 1) origin = centre of the button (bottom-centre when triggered by scroll/swipe)
    const box = stageRef.current?.getBoundingClientRect();
    const br = e?.currentTarget?.getBoundingClientRect?.();
    const ox = box && br ? br.left + br.width / 2 - box.left : (box?.width ?? 390) / 2;
    const oy = box && br ? br.top + br.height / 2 - box.top : (box?.height ?? 844) * 0.9;
    setSmokeOrigin({ x: ox, y: oy });

    // 2) the couple screen is already in the DOM: start its own animations now (the mask hides it at first)
    runScene6(false);
    setSmokeActive(true);

    // 3) sparkles drifting outward from the button
    setSparkles(
      Array.from({ length: SMOKE_SPARKLES }, (_, i) => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * 190;
        return { id: i, tx: Math.cos(ang) * dist, ty: Math.sin(ang) * dist - 30, size: 2 + Math.random() * 3, delay: Math.random() * 500, dur: 900 + Math.random() * 800 };
      })
    );

    const supported = smokeSupported();
    if (supported) {
      // N overlapping radial-gradient blobs with random centres and growth factors; --r is animated in CSS
      const blobs = Array.from({ length: SMOKE_BLOBS }, () => {
        const x = ox + (Math.random() * 2 - 1) * SMOKE_SPREAD;
        const y = oy + (Math.random() * 2 - 1) * SMOKE_SPREAD;
        const f = (0.55 + Math.random() * 0.55).toFixed(2); // growth factor 0.55 - 1.10
        return `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, #000 calc(var(--r) * ${f}), transparent calc(var(--r) * ${f} + ${SMOKE_SOFT}%))`;
      });
      setSmokeMask(blobs.join(", "));
    } else {
      setSmokeFade(true); // fallback: 1 s opacity cross-fade
    }

    // 4) when it ends: drop the mask so the couple screen renders normally, hand over to stage 6
    later(() => {
      setStage(6);
      setSmokeMask(null);
      setSmokeActive(false);
      setSmokeFade(false);
      setSparkles([]);
      smokeBusy.current = false;
    }, supported ? SMOKE_MS : 1000);
  };

  // -------------------------------------------------------------
  // SCENE 6: COUPLE SECTION REVEAL
  // Final resting state of the invitation
  // -------------------------------------------------------------
  const runScene6 = (setStageNow = true) => {
    if (setStageNow) setStage(6);

    // 0.00s – 0.50s: watercolor landscape appears
    setS6Landscape(true);

    // 0.25s – 0.90s: bride illustration reveals through soft watercolor mask
    later(() => setS6Bride(true), 250);

    // 0.45s – 1.10s: groom illustration reveals (overlaps bride)
    later(() => setS6Groom(true), 450);

    // 0.80s – 1.30s: both illustrations settle into final positions
    later(() => setS6BothSettle(true), 800);

    // 1.00s – 1.50s: bride and groom names fade in with elegant typography
    later(() => setS6Names(true), 1000);

    // 1.25s – 1.65s: ornamental divider draws itself
    later(() => setS6Divider(true), 1250);

    // 1.45s – 1.90s: romantic quotation fades in, couple section settles
    later(() => setS6Quotation(true), 1450);

    // 1.90s: Settled on the Couple section permanently! Natural scrolling active.
    later(() => setS6Finished(true), 1900);
  };

  // Wheel and Touch detection on Scene 4 to trigger Scene 5 (Invitation to Couple)
  const handleWheel = (e: React.WheelEvent) => {
    if (stage === 4 && s4Hold && e.deltaY > 10) {
      triggerCoupleTransition();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.touches[0].clientY;
    if (stage === 4 && s4Hold && diff > 20) {
      touchStartY.current = null;
      triggerCoupleTransition();
    }
  };

  return (
    <section
      id="couple"
      aria-label="Maharashtrian Wedding Cinematic Invitation"
      className={
        stage >= 6
          ? "intro-fit relative h-screen min-h-[100dvh] w-full select-none overflow-hidden bg-transparent"
          : "intro-fit fixed inset-0 z-[95] select-none overflow-hidden bg-[#F8DFBF]"
      }
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* SVG Filters & Gradients for Watercolor and Sacred FX */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id="mm-watercolor-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="mm-rose-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d92b3f" />
            <stop offset="45%" stopColor="#a81525" />
            <stop offset="100%" stopColor="#5e0912" />
          </linearGradient>
          <linearGradient id="mm-marigold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb326" />
            <stop offset="60%" stopColor="#e87609" />
            <stop offset="100%" stopColor="#aa3e00" />
          </linearGradient>
        </defs>
      </svg>

      {/* Mobile Viewport Stage */}
      <div ref={stageRef} className={`relative mx-auto h-full w-full overflow-hidden ${stage >= 6 ? "bg-transparent" : "bg-[#F8DFBF]"}`}>
        {/* ========================================================= */}
        {/* SCENE 1: ROYAL TEMPLE DOUBLE DOORS (OPENS TO REVEAL GANPATI) */}
        {/* ========================================================= */}
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center transition-all"
          style={{
            opacity: stage <= 1 ? 1 : 0,
            pointerEvents: stage === 0 ? "auto" : "none",
            transition: `opacity 650ms ${EASE_SOFT_EXIT}`,
          }}
          onClick={handleDoorTap}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              transform: s1Scale ? "scale(1.02)" : "scale(1)",
              transition: `transform 300ms ${EASE_PRIMARY}`,
            }}
          >
            {/* 3D Perspective Double Doors (Left & Right leaves swinging open) */}
            <div className="absolute inset-0 pointer-events-none" style={{ perspective: "calc(var(--u) * 1400)" }}>
              {/* LEFT DOOR LEAF */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden"
                style={{
                  transformOrigin: "left center",
                  transform: s1DoorOpen ? "rotateY(82deg)" : "rotateY(0deg) translateX(0)",
                  opacity: s1DoorOpen ? 0 : 1,
                  transition: `transform 1900ms cubic-bezier(0.45, 0.05, 0.25, 1), opacity 800ms 1100ms ease-in-out`,
                  filter: "drop-shadow(calc(var(--u) * 12) 0 calc(var(--u) * 28) rgba(30,15,5,0.65))",
                }}
              >
                {/* Left Door Image: pinned to left edge, width 200% */}
                <img
                  src={wedding.images.door}
                  alt="Royal Maharashtrian Palace Temple Door Left"
                  className="door-tone absolute left-0 top-0 h-full w-[200%] max-w-none object-cover"
                  draggable={false}
                />
                {/* Dynamic 3D lighting shadow as leaf swings */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/25"
                  style={{
                    opacity: s1DoorOpen ? 0.75 : 0,
                    transition: `opacity 850ms ${EASE_PRIMARY}`,
                  }}
                />
              </div>

              {/* RIGHT DOOR LEAF */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden"
                style={{
                  transformOrigin: "right center",
                  transform: s1DoorOpen ? "rotateY(-82deg)" : "rotateY(0deg) translateX(0)",
                  opacity: s1DoorOpen ? 0 : 1,
                  transition: `transform 1900ms cubic-bezier(0.45, 0.05, 0.25, 1), opacity 800ms 1100ms ease-in-out`,
                  filter: "drop-shadow(calc(var(--u) * -12) 0 calc(var(--u) * 28) rgba(30,15,5,0.65))",
                }}
              >
                {/* Right Door Image: pinned to right edge, width 200% */}
                <img
                  src={wedding.images.door}
                  alt="Royal Maharashtrian Palace Temple Door Right"
                  className="door-tone absolute right-0 top-0 h-full w-[200%] max-w-none object-cover"
                  draggable={false}
                />
                {/* Dynamic 3D lighting shadow as leaf swings */}
                <div
                  className="absolute inset-0 bg-gradient-to-l from-black/55 via-transparent to-black/25"
                  style={{
                    opacity: s1DoorOpen ? 0.75 : 0,
                    transition: `opacity 850ms ${EASE_PRIMARY}`,
                  }}
                />
              </div>
            </div>

            {/* Glowing Golden Light Seam & Burst along the Centerline */}
            {s1DoorUnlock && (
              <div
                className="pointer-events-none absolute inset-y-0 left-1/2 z-25 -translate-x-1/2 w-8"
                style={{
                  background: "radial-gradient(ellipse calc(var(--u) * 20) 80% at 50% 50%, rgba(255,245,190,0.95) 0%, rgba(245,190,55,0.65) 45%, transparent 75%)",
                  animation: "mm-crack-glow 650ms ease-out forwards",
                }}
              />
            )}

            {/* Subtle floating gold embers around the royal door */}
            {stage === 0 && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(14)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute rounded-full bg-[#fcd475]"
                    style={{
                      left: `${10 + (i * 23) % 80}%`,
                      top: `${15 + (i * 31) % 70}%`,
                      width: 3 + (i % 3),
                      height: 3 + (i % 3),
                      opacity: 0.75,
                      boxShadow: "0 0 calc(var(--u) * 8) #fcd475",
                      animation: `mm-float ${3 + (i % 3)}s ease-in-out ${i * 0.35}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Animated finger tapping hint, centred on the "श्री" medallion */}
            {stage === 0 && (
              <div
                className="pointer-events-none absolute left-1/2 top-[52%] z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{
                  opacity: s1Scale ? 0 : 1,
                  transform: s1Scale ? "translate(-50%, -50%) scale(0.7)" : "translate(-50%, -50%) scale(1)",
                  transition: `opacity 250ms ${EASE_PRIMARY}, transform 250ms ${EASE_PRIMARY}`,
                }}
              >
                {/* Expanding soft golden ripples around "श्री" */}
                <span
                  className="absolute h-20 w-20 rounded-full border border-[#fde188]/80 bg-[#ffecb4]/20"
                  style={{ animation: "mm-tap-ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite" }}
                />
                <span
                  className="absolute h-12 w-12 rounded-full bg-[#f6d98a]/30"
                  style={{ animation: "mm-tap-ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) 0.6s infinite" }}
                />

                {/* Gentle tapping hand pointer icon */}
                <div
                  className="relative"
                  style={{ animation: "mm-hand-tap 1.5s ease-in-out infinite" }}
                >
                  <PointerHand size={38} />
                </div>
              </div>
            )}

            {/* Normal Text: Tap on door (Placed cleanly below the medallion) */}
            {stage === 0 && (
              <div
                className="pointer-events-none absolute left-1/2 top-[69%] z-30 -translate-x-1/2 text-center"
                style={{
                  opacity: s1Scale ? 0 : 1,
                  transform: s1Scale ? "translate(-50%, calc(var(--u) * 6))" : "translate(-50%, 0)",
                  transition: `opacity 250ms ${EASE_PRIMARY}, transform 250ms ${EASE_PRIMARY}`,
                }}
              >
                <p className="font-body text-[12px] font-medium uppercase tracking-[0.25em] text-[#FFFDF7] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                  Tap on door
                </p>
              </div>
            )}

            {/* Bursting Ornamental Golden Particles on Tap */}
            {particles.length > 0 && (
              <div className="pointer-events-none absolute left-1/2 top-[52%] z-30 -translate-x-1/2 -translate-y-1/2">
                {particles.map((pt) => (
                  <span
                    key={pt.id}
                    className="absolute rounded-full"
                    style={{
                      width: pt.size,
                      height: pt.size,
                      backgroundColor: pt.color,
                      boxShadow: `0 0 calc(var(--u) * 8) ${pt.color}`,
                      animation: "mm-sparkle 650ms ease-out forwards",
                      ["--tx" as any]: `${pt.tx}px`,
                      ["--ty" as any]: `${pt.ty}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCENE 2: GANPATI BAPPA DIVINE REVEAL                       */}
        {/* Sits directly underneath the opening envelope flaps        */}
        {/* ========================================================= */}
        <div
          className="absolute inset-0 z-10 overflow-hidden"
          style={{
            opacity: stage <= 2 || (stage === 3 && !s3GaneshDissolve) ? 1 : 0,
            pointerEvents: "none",
            transition: `opacity 900ms ${EASE_SOFT_EXIT}`,
          }}
        >
          {/* Zooming Bappa Murti Container (Ken Burns Slow Push-In like video) */}
          <div
            className="absolute inset-0"
            style={{
              transform: s2KenBurns ? "scale(1.055)" : "scale(1.0)",
              transition: "transform 4500ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {/* Base Layer: Meditative Ganpati with Closed Eyes & Namaskar (ganesh-closed) */}
            <div className="absolute inset-0">
              <img
                src={wedding.images.ganeshClosed}
                alt="Lord Ganesha in peaceful meditation"
                className="intro-tone h-full w-full object-cover"
                draggable={false}
              />
            </div>

            {/* Awakening Murti: Lord Ganesha Eyes Open & Blessing Abhaya Mudra Hand (ganesh-blessing) */}
            <div
              className="absolute inset-0"
              style={{
                opacity: s2BlessingMurti ? 1 : 0,
                transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <img
                src={wedding.images.ganeshBlessing}
                alt="Lord Ganesha with divine blessing"
                className="intro-tone h-full w-full object-cover"
                draggable={false}
              />
            </div>

            {/* Divine Golden Halo / Tejo-valay Radiating behind Mukut */}
            <div
              className="pointer-events-none absolute left-1/2 top-[31%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: "calc(var(--u) * 260)",
                height: "calc(var(--u) * 260)",
                background: "radial-gradient(circle, rgba(255,230,120,0.65) 0%, rgba(245,180,45,0.3) 45%, rgba(220,130,20,0.08) 65%, transparent 75%)",
                opacity: s2Halo ? 0.95 : 0,
                transform: s2Halo ? "translate(-50%, -50%) scale(1.15)" : "translate(-50%, -50%) scale(0.65)",
                transition: `opacity 900ms ${EASE_PRIMARY}, transform 1100ms ${EASE_PRIMARY}`,
              }}
            />

            {/* Divine Golden Awakening Prana Light Bloom across Chest & Face */}
            <div
              className="pointer-events-none absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: "calc(var(--u) * 320)",
                height: "calc(var(--u) * 320)",
                background: "radial-gradient(circle at 50% 50%, rgba(255,248,205,0.95) 0%, rgba(255,215,80,0.7) 35%, rgba(226,170,50,0.25) 60%, transparent 80%)",
                mixBlendMode: "screen",
                opacity: s2GlowAwaken && !s2Settle ? 0.95 : s2Settle ? 0.25 : 0,
                transform: s2GlowAwaken ? "translate(-50%, -50%) scale(1.3)" : "translate(-50%, -50%) scale(0.4)",
                transition: "opacity 750ms ease-out, transform 850ms cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            />

            {/* Subtle Divine Golden Aura beneath ॥ श्री गणेशाय नमः ॥ */}
            <div
              className="pointer-events-none absolute left-1/2 top-[64.2%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: "calc(var(--u) * 280)",
                height: "calc(var(--u) * 50)",
                background: "radial-gradient(ellipse at center, rgba(255,225,120,0.3) 0%, transparent 70%)",
                opacity: s2MantraGlow ? 1 : 0,
                transition: `opacity 800ms ${EASE_PRIMARY}`,
              }}
            />
          </div>

          {/* Floating Falling Rose & Marigold Petals (Drifting downward like in the video) */}
          {(stage === 1 || stage === 2 || (stage === 3 && !s3GaneshDissolve)) && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
              {ROSE_PETALS.map((p) => (
                <svg
                  key={p.id}
                  className="pointer-events-none absolute"
                  style={{
                    left: p.left,
                    top: "calc(var(--u) * -30)",
                    width: p.size,
                    height: p.size * 1.3,
                    animation: `mm-rose-petal ${p.duration} ease-in-out ${p.delay} infinite`,
                    filter: "drop-shadow(0 calc(var(--u) * 4) calc(var(--u) * 6) rgba(60, 10, 15, 0.35))",
                  }}
                  viewBox="0 0 24 30"
                  fill="none"
                >
                  <path
                    d="M 12,2 C 18,5 23,12 21,20 C 19,26 14,29 12,29 C 10,29 5,26 3,20 C 1,12 6,5 12,2 Z"
                    fill={p.isMarigold ? "url(#mm-marigold-gradient)" : "url(#mm-rose-gradient)"}
                  />
                  <path
                    d="M 12,5 C 15,9 17,15 15,22 C 14,25 13,27 12,28"
                    stroke={p.isMarigold ? "rgba(255, 235, 180, 0.45)" : "rgba(255, 180, 190, 0.35)"}
                    strokeWidth="0.8"
                    fill="none"
                  />
                </svg>
              ))}
            </div>
          )}

          {/* Floating Sacred Golden Embers & Prana Sparks */}
          {(stage === 1 || stage === 2) && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-15">
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-[#fde188]"
                  style={{
                    left: `${15 + (i * 21) % 72}%`,
                    top: `${20 + (i * 27) % 65}%`,
                    width: 3 + (i % 3),
                    height: 3 + (i % 3),
                    opacity: 0.85,
                    boxShadow: "0 0 calc(var(--u) * 8) #fde188",
                    animation: `mm-float ${3 + (i % 3)}s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* WADA COURTYARD LAYER (Revealed via Organic Splash)        */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 z-24 overflow-hidden pointer-events-none ${wadaMask ? "smoke-reveal" : ""}`}
          style={{
            opacity: stage >= 3 && stage <= 5 ? (s5TextDissolve ? 0 : 1) : 0,
            ...(wadaMask ? { WebkitMaskImage: wadaMask, maskImage: wadaMask, animationDuration: `${SMOKE_MS}ms` } : null),
            transition: stage === 3 && !wadaMask ? "opacity 1000ms ease" : `opacity 700ms ${EASE_SOFT_EXIT}`,
          }}
        >
          <img
            src={wedding.images.invitationScene}
            alt="Traditional Maharashtrian Wada Courtyard"
            className="invite-tone h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* ========================================================= */}
        {/* SCENE 3: GANPATI TO INVITATION WATERCOLOR SPLASH OVERLAY   */}
        {/* Matching exact video watercolor splash wipe (frame 00:04) */}
        {/* ========================================================= */}
        <div
          className="pointer-events-none absolute inset-0 z-26 overflow-hidden"
          style={{
            opacity: stage === 3 ? (s3DetailsReveal ? 0 : 1) : 0,
            transition: "opacity 650ms ease-out",
          }}
        >
          {/* Multi-Lobed Watercolor Paint Splash Splatter Bloom */}
          <div
            className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "calc(var(--u) * 480)",
              height: "calc(var(--u) * 480)",
              transform: s3SplashSpread
                ? "translate(-50%, -50%) scale(3.5)"
                : "translate(-50%, -50%) scale(0.08)",
              opacity: s3SplashSpread ? 1 : 0,
              transition: `transform 1400ms ${EASE_PRIMARY}, opacity 600ms ease-out`,
            }}
          >
            {/* Organic SVG Watercolor Ink Bleed & Splatter Wash */}
            <svg
              viewBox="0 0 1000 1000"
              className="h-full w-full"
              style={{
                filter: "url(#mm-watercolor-filter) drop-shadow(0 0 calc(var(--u) * 16) rgba(226, 178, 79, 0.7)) drop-shadow(0 0 calc(var(--u) * 35) rgba(247, 233, 205, 0.9))",
              }}
            >
              {/* Outer Translucent Watercolor Amber Fringe */}
              <path
                d={WATERCOLOR_SPLASH_PATH}
                fill="rgba(235, 192, 105, 0.55)"
                transform="scale(1.05) translate(-25, -25)"
              />
              {/* Inner Rich Watercolor Paper Wash */}
              <path
                d={WATERCOLOR_SPLASH_PATH}
                fill="rgba(251, 245, 232, 0.98)"
              />
              {/* Radiating Satellite Splatter Paint Droplets */}
              {SPLASH_DROPLETS.map((d) => (
                <circle
                  key={d.id}
                  cx={500 + Math.cos((d.angle * Math.PI) / 180) * d.dist * 2.3}
                  cy={500 + Math.sin((d.angle * Math.PI) / 180) * d.dist * 2.3}
                  r={d.size}
                  fill="rgba(247, 233, 205, 0.95)"
                  stroke="rgba(226, 178, 79, 0.6)"
                  strokeWidth="2"
                  style={{
                    transform: s3SplashSpread ? `translate(${d.dx}px, ${d.dy}px) scale(1)` : "translate(0, 0) scale(0.1)",
                    opacity: s3SplashSpread ? 0.9 : 0,
                    transition: `transform 1200ms ${EASE_PRIMARY}, opacity 800ms ease-out`,
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCENE 4: INVITATION SCREEN REVEAL                          */}
        {/* ========================================================= */}
        <div
          className="absolute inset-0 z-30 flex flex-col justify-between overflow-hidden"
          style={{
            opacity: stage === 4 ? (s5TextDissolve ? 0 : 1) : 0,
            pointerEvents: stage === 4 && s4Hold ? "auto" : "none",
            transition: `opacity 700ms ${EASE_SOFT_EXIT}`,
          }}
        >
          {/* Top Zone: Clean English Invitation Typography positioned in clear sunset sky */}
          <div className={`tilt-3d intro-fit-top invite-zoom relative z-10 px-6 pt-[20%] text-center flex flex-col items-center has-guest`}>
            {/* Invitation Heading */}
            <div
              className="relative z-10 flex flex-col items-center"
              style={{
                opacity: s4Heading ? 1 : 0,
                transform: s4Heading ? "translateY(0)" : "translateY(calc(var(--u) * 8))",
                transition: `opacity 600ms ${EASE_PRIMARY}, transform 600ms ${EASE_PRIMARY}`,
              }}
            >
              <h2 className="font-serif text-base font-medium tracking-wide text-[#6d0f1b] leading-snug drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                Dear <span className="guest-name">{guestName}</span>,<br />
                With Joyful Hearts,<br />We Invite You
              </h2>
            </div>

            {/* Couple's Names: Vertically Aligned Shreyash & Sayeli with refined, balanced spacing */}
            <div
              className="relative z-10 mt-2.5 flex flex-col items-center"
              style={{
                opacity: s4Lines[0] ? 1 : 0,
                transform: s4Lines[0] ? "scale(1)" : "scale(0.96)",
                transition: `opacity 500ms ${EASE_PRIMARY}, transform 500ms ${EASE_PRIMARY}`,
              }}
            >
              <p className="font-script text-[44px] font-normal leading-tight text-[#6d0f1b] drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]">
                {first}
              </p>
              <p className="my-0 font-serif italic text-lg font-light text-[#C9963A] leading-none opacity-90">
                &amp;
              </p>
              <p className="font-script text-[44px] font-normal leading-tight text-[#6d0f1b] drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]">
                {second}
              </p>
            </div>

            {/* Delicate Antique-Gold Line Ornamental Divider */}
            <div
              className="relative z-10 mt-2 flex items-center justify-center gap-2"
              style={{
                opacity: s4Lines[0] ? 1 : 0,
                transform: s4Lines[0] ? "scale(1)" : "scale(0.9)",
                transition: `opacity 600ms 150ms ${EASE_PRIMARY}, transform 600ms 150ms ${EASE_PRIMARY}`,
              }}
            >
              <span className="h-[0.8px] w-16 bg-gradient-to-r from-transparent via-[#C9963A] to-[#C9963A]" />
              <span className="text-[#C9963A] text-[9px] leading-none opacity-85">❖</span>
              <span className="h-[0.8px] w-16 bg-gradient-to-l from-transparent via-[#C9963A] to-[#C9963A]" />
            </div>

            {/* Time and place (no date here) */}
            <div
              className="relative z-10 mt-3 flex flex-col items-center text-center"
              style={{
                opacity: s4Lines[0] ? 1 : 0,
                transform: s4Lines[0] ? "translateY(0)" : "translateY(calc(var(--u) * 6))",
                transition: `opacity 600ms 300ms ${EASE_PRIMARY}, transform 600ms 300ms ${EASE_PRIMARY}`,
              }}
            >
              <p className="font-serif text-sm font-medium italic text-[#4b0f16] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]">
                {wedding.venue.name}, {wedding.venue.city}
              </p>
            </div>
          </div>

          {/* Refined Slim Pill Button: chota aur patla, thin gold border, maroon serif typography, smaller arrow */}
          <div
            className="invite-zoom relative z-20 flex flex-col items-center pb-7 pt-2"
            style={{
              opacity: s4Hold ? 1 : 0,
              transform: s4Hold ? "translateY(0)" : "translateY(calc(var(--u) * 10))",
              transition: `opacity 500ms 100ms ${EASE_PRIMARY}, transform 500ms 100ms ${EASE_PRIMARY}`,
            }}
          >
            <button
              type="button"
              onClick={triggerCoupleTransition}
              aria-label="Open Invitation"
              className="group cursor-pointer inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full px-5 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(180deg, #FCEFCB 0%, #F3DB9C 55%, #F8E8BC 100%)",
                border: "calc(var(--u) * 1.5) solid #D4AE5E",
                boxShadow: "inset 0 0 0 calc(var(--u) * 2) rgba(255,248,225,0.7), inset 0 0 0 calc(var(--u) * 3) rgba(212,174,94,0.45), 0 calc(var(--u) * 3) calc(var(--u) * 10) rgba(110,70,10,0.22)",
              }}
            >
              <span className="font-serif text-[12.5px] font-bold tracking-[0.14em] uppercase text-[#6d0f1b]">
                Open Invitation
              </span>
              <span className="text-[#C9963A] text-[11px] leading-none transition-transform duration-300 group-hover:translate-y-0.5 animate-bounce">
                ↓
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCENE 5: INVITATION TO COUPLE WATERCOLOR SPLASH TRANSITION  */}
        {/* Matching exact video watercolor splash wipe (frame 00:17) */}
        {/* ========================================================= */}
        <div
          className="pointer-events-none absolute inset-0 z-35 overflow-hidden"
          style={{
            opacity: stage === 5 ? 1 : 0,
            transition: `opacity 500ms ${EASE_PRIMARY}`,
          }}
        >
          {/* Multi-Lobed Watercolor Paint Splash Bloom to Couple Mandap */}
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2"
            style={{
              width: "calc(var(--u) * 520)",
              height: "calc(var(--u) * 520)",
              transform: s5SplashUp
                ? "translate(-50%, 15%) scale(3.5)"
                : "translate(-50%, 65%) scale(0.1)",
              opacity: s5SplashUp ? 1 : 0,
              transition: `transform 1300ms ${EASE_PRIMARY}, opacity 600ms ease-out`,
            }}
          >
            <svg
              viewBox="0 0 1000 1000"
              className="h-full w-full"
              style={{
                filter: "url(#mm-watercolor-filter) drop-shadow(0 0 calc(var(--u) * 18) rgba(226, 178, 79, 0.7)) drop-shadow(0 0 calc(var(--u) * 40) rgba(247, 233, 205, 0.9))",
              }}
            >
              {/* Outer Translucent Watercolor Amber Fringe */}
              <path
                d={WATERCOLOR_SPLASH_PATH}
                fill="rgba(235, 192, 105, 0.55)"
                transform="scale(1.05) translate(-25, -25)"
              />
              {/* Inner Rich Watercolor Paper Wash */}
              <path
                d={WATERCOLOR_SPLASH_PATH}
                fill="rgba(251, 245, 232, 0.98)"
              />
              {/* Radiating Satellite Splatter Paint Droplets */}
              {SPLASH_DROPLETS.map((d) => (
                <circle
                  key={d.id}
                  cx={500 + Math.cos((d.angle * Math.PI) / 180) * d.dist * 2.3}
                  cy={500 + Math.sin((d.angle * Math.PI) / 180) * d.dist * 2.3}
                  r={d.size}
                  fill="rgba(247, 233, 205, 0.95)"
                  stroke="rgba(226, 178, 79, 0.6)"
                  strokeWidth="2"
                  style={{
                    transform: s5SplashUp ? `translate(${d.dx}px, ${d.dy}px) scale(1)` : "translate(0, 0) scale(0.1)",
                    opacity: s5SplashUp ? 0.9 : 0,
                    transition: `transform 1100ms ${EASE_PRIMARY}, opacity 700ms ease-out`,
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Smoke reveal: golden sparkles drifting out of the button */}
        {sparkles.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden>
            {sparkles.map((p) => (
              <span
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: smokeOrigin.x,
                  top: smokeOrigin.y,
                  width: p.size,
                  height: p.size,
                  background: "#F6D98A",
                  boxShadow: "0 0 calc(var(--u) * 6) 1px rgba(246,217,138,0.9)",
                  opacity: 0,
                  ["--tx" as string]: `${p.tx}px`,
                  ["--ty" as string]: `${p.ty}px`,
                  animation: `smoke-sparkle ${p.dur}ms ${p.delay}ms ease-out forwards`,
                }}
              />
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* SCENE 6: COUPLE SECTION REVEAL (2.8s)                      */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 z-40 overflow-hidden ${smokeMask ? "smoke-reveal" : ""}`}
          style={{
            opacity: stage >= 6 || smokeActive ? 1 : 0,
            pointerEvents: stage >= 6 ? "auto" : "none",
            transition: smokeFade ? "opacity 1000ms ease" : smokeActive ? "none" : `opacity 600ms ${EASE_PRIMARY}`,
            ...(smokeMask
              ? { WebkitMaskImage: smokeMask, maskImage: smokeMask, animationDuration: `${SMOKE_MS}ms` }
              : null),
            ...(smokeFade ? { opacity: 1 } : null),
          }}
        >
          {/* Glass Back Button to Invitation (Top-Left Corner, clean icon only) */}
          {stage >= 6 && (
            <button
              onClick={triggerBackToInvitation}
              aria-label="Back to Invitation"
              className="pill-gold group absolute left-4 top-[10px] z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#e6c47a]/80 bg-[#f6dc9c]/45 shadow-[0_4px_20px_rgba(110,60,10,0.22),inset_0_1px_1px_rgba(255,240,200,0.9)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-[#f6dc9c]/65 active:scale-95"
            >
              <svg
                className="h-4 w-4 text-[#6d0f1b] transition-transform duration-300 group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* the couple scene melts into the shared sky below: the pictures fade out at the foot
              (mask on .couple-tone) over the transparent section, so the sections' sunset sky shows through */}
          {/* Base Couple Mandap Illustration */}
          <div
            className="absolute inset-0"
            style={{
              opacity: s6Landscape || stage >= 6 ? 1 : 0,
              transform: s6BothSettle ? "scale(1)" : "scale(1.025)",
              transition: `opacity 800ms ${EASE_PRIMARY}, transform 900ms ${EASE_PRIMARY}`,
            }}
          >
            <img
              src={wedding.images.coupleScene}
              alt="The Maharashtrian Bride and Groom in Traditional Attire"
              className="couple-tone h-full w-full object-cover"
              draggable={false}
            />
          </div>

          {/* Soft Watercolor Mask Revealing Bride (0.35s – 1.30s) */}
          <div
            className="absolute inset-0"
            style={{
              opacity: s6Bride ? 1 : 0,
              WebkitMaskImage: "radial-gradient(ellipse 42% 55% at 42% 65%, black 45%, transparent 95%)",
              maskImage: "radial-gradient(ellipse 42% 55% at 42% 65%, black 45%, transparent 95%)",
              transition: `opacity 950ms ${EASE_PRIMARY}`,
            }}
          >
            <img
              src={wedding.images.coupleScene}
              alt="Bride in Paithani Nauvari"
              className="couple-tone h-full w-full object-cover"
              draggable={false}
            />
          </div>

          {/* Soft Watercolor Mask Revealing Groom (0.65s – 1.50s) */}
          <div
            className="absolute inset-0"
            style={{
              opacity: s6Groom ? 1 : 0,
              WebkitMaskImage: "radial-gradient(ellipse 42% 55% at 58% 62%, black 45%, transparent 95%)",
              maskImage: "radial-gradient(ellipse 42% 55% at 58% 62%, black 45%, transparent 95%)",
              transition: `opacity 850ms ${EASE_PRIMARY}`,
            }}
          >
            <img
              src={wedding.images.coupleScene}
              alt="Groom in Kurta Dhoti and Pheta"
              className="couple-tone h-full w-full object-cover"
              draggable={false}
            />
          </div>

          {/* Top Sky Region: Couple Names, Romantic Marathi Quotation, Parents (positioned below floral toran to prevent overlap) */}
          <div className={`tilt-3d couple-text relative z-10 px-6 pt-20 text-center${isPersonalised ? " has-guest" : ""}`}>
            {/* Marathi Romantic Quotation (2.20s – 2.80s) */}
            <div
              style={{
                opacity: s6Quotation ? 1 : 0,
                transform: s6Quotation ? "translateY(0)" : "translateY(calc(var(--u) * 10))",
                transition: `opacity 600ms ${EASE_PRIMARY}, transform 600ms ${EASE_PRIMARY}`,
              }}
            >
              {isPersonalised && (
                <p className="mb-1 font-serif text-[19px] italic text-[#7a3a2a]">
                  Dear <span className="guest-name not-italic">{guestName}</span>,
                </p>
              )}
              <p lang="mr" className="font-marathi text-[28px] font-bold text-[#6d0f1b]">
                दोन मने, एक गाठ
              </p>
              <p className="mt-0.5 font-serif text-[17px] italic tracking-wide text-[#7a3a2a]">
                Two hearts, one knot
              </p>
            </div>

            {/* Names (1.50s – 2.10s) */}
            {/* names are written one after the other, like ink flowing from left to right */}
            <div className="mt-3">
              <div className="flex flex-col items-center leading-none">
                <p className="font-script text-[54px] leading-[1.05] text-[#6d0f1b]" style={{ ...NAME_STROKE, ...inkWipe(s6Names, 0) }}>{first}</p>
                <div className="flex items-center gap-2" style={inkWipe(s6Names, 650, 700)}>
                  <Flourish />
                  <p className="font-script text-[30px] leading-none text-[#a8741a]">&amp;</p>
                  <Flourish flip />
                </div>
                <p className="font-script text-[54px] leading-[1.05] text-[#6d0f1b]" style={{ ...NAME_STROKE, ...inkWipe(s6Names, 1000) }}>{second}</p>
              </div>
            </div>

            {/* Ornamental Divider (1.90s – 2.40s) */}
            <div className="my-2 flex justify-center">
              <svg
                viewBox="0 0 160 12"
                className="h-3 w-36 text-[#a8741a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path
                  d="M10 6 L65 6 M95 6 L150 6"
                  strokeDasharray="160"
                  strokeDashoffset={s6Divider ? "0" : "160"}
                  style={{ transition: `stroke-dashoffset 500ms ${EASE_PRIMARY}` }}
                />
                <circle cx="80" cy="6" r="3" fill="#6d0f1b" opacity={s6Divider ? 1 : 0} />
              </svg>
            </div>

            {/* Parents' Blessings (English) */}
            <div
              className="space-y-0.5"
              style={{
                opacity: s6Quotation ? 1 : 0,
                transform: s6Quotation ? "translateY(0)" : "translateY(calc(var(--u) * 8))",
                transition: `opacity 600ms ${EASE_PRIMARY}, transform 600ms ${EASE_PRIMARY}`,
              }}
            >
              <p className="font-serif text-[18px] font-semibold tracking-wide text-[#4b0f16]">
                {wedding.parentsEn.groom}
              </p>
              <p className="font-serif text-[18px] font-semibold tracking-wide text-[#4b0f16]">
                {wedding.parentsEn.bride}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Scroll hint at the bottom of the couple section */}
      {stage >= 6 && (
        <button
          type="button"
          onClick={() => {
            const next = document.getElementById("countdown");
            if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="absolute inset-x-0 bottom-[22px] z-40 mx-auto flex w-max flex-col items-center gap-0.5 font-serif text-[15px] font-bold uppercase tracking-[0.2em] text-[#6d0f1b]"
          style={{
            opacity: s6Finished ? 1 : 0,
            transition: "opacity 800ms ease",
            textShadow: "0 0 6px rgba(255,248,230,0.95), 0 0 14px rgba(255,248,230,0.9)",
            filter: "drop-shadow(0 0 4px rgba(255,248,230,0.95))",
          }}
          aria-label="Scroll down to see the invitation details"
        >
          Scroll Down
          <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "zv-chevron 1.4s ease-in-out infinite" }} aria-hidden>
            <path d="m6 6 6 6 6-6" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </button>
      )}
    </section>
  );
}
