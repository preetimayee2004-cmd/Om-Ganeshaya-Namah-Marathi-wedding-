import { useState, type ReactNode } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ScrollRootContext } from "./ScrollRoot";
import TopControls from "./TopControls";
import { wedding } from "../../config/wedding";

/**
 * Responsive shell.
 *  - < 1024px: full-bleed, window scroll, no mockup (tablet gets a centred 480px column).
 *  - >= 1024px: the live site is rendered inside an iPhone 17 Pro Max style mockup.
 * The same children tree is used in both modes; only the wrapper changes.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);

  if (!isDesktop) {
    return (
      <ScrollRootContext.Provider value={null}>
        {/* .screen: the 430px phone column; every size inside scales with its width (see index.css).
            overflow-x clip: slide-in reveals start off to the side; never let them add a horizontal scrollbar */}
        <div className="screen paper">
          <main className="screen-content min-h-screen">
            <TopControls mode="fixed" />
            {children}
          </main>
        </div>
      </ScrollRootContext.Provider>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#E2BF86" }}
    >
      {/* Desktop backdrop = the invitation's own sky with the same antique-gold wash as every section,
          softly blurred, so the page around the phone feels like part of the invitation (scaled so the blur never shows an edge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: "#F8DFBF",
          backgroundImage: `linear-gradient(180deg, rgba(214,178,112,0.55) 0%, rgba(200,160,96,0.5) 100%), url("${wedding.images.sky}")`,
          backgroundSize: "100% 100%, cover",
          backgroundPosition: "center, center",
          backgroundBlendMode: "multiply, normal",
          filter: "blur(6px)",
          transform: "scale(1.08)",
        }}
      />
      {/* warm vignette + a faint gold glow behind the phone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 38% 60% at 50% 50%, rgba(255,236,190,0.45) 0%, rgba(255,236,190,0) 70%), radial-gradient(ellipse 85% 85% at 50% 50%, rgba(110,62,18,0) 55%, rgba(110,62,18,0.28) 100%)",
        }}
      />

      {/* Phone: slim bezel, nearly full viewport height (94.3%), 414:860 as measured on the reference */}
      <div
        className="relative rounded-[3.3rem] bg-[#3a2216] p-[8px] shadow-[0_30px_70px_-20px_rgba(90,50,15,0.55),0_0_0_1.5px_rgba(212,174,94,0.75)]"
        style={{
          // capped at 926px tall so the display (width - 16px bezel) never exceeds the 430px column
          height: "min(94.3vh, 926px)",
          aspectRatio: "414 / 860",
          width: "calc(min(94.3vh, 926px) * 414 / 860)",
          maxWidth: "100vw",
          minWidth: 0,
          flex: "none",
        }}
      >
        {/* side buttons */}
        <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#3a2216]" />
        <span className="absolute -left-[3px] top-[180px] h-14 w-[3px] rounded-l bg-[#3a2216]" />
        <span className="absolute -left-[3px] top-[250px] h-14 w-[3px] rounded-l bg-[#3a2216]" />
        <span className="absolute -right-[3px] top-[200px] h-20 w-[3px] rounded-r bg-[#3a2216]" />

        {/* Screen. translateZ(0) makes position:fixed children stay inside the phone. */}
        <div
          ref={setScreen}
          className="screen screen--mockup no-scrollbar relative rounded-[2.7rem] paper"
          style={{ transform: "translateZ(0)" }}
        >
          {/* dynamic island */}
          <div className="pointer-events-none sticky top-0 z-[100] flex h-0 justify-center">
            <span className="mt-[10px] h-[28px] w-[100px] rounded-full bg-black" />
          </div>
          <ScrollRootContext.Provider value={screen}>
            <main className="screen-content">
              <TopControls mode="sticky" />
              {children}
            </main>
          </ScrollRootContext.Provider>
        </div>
      </div>
    </div>
  );
}
