import { useState, type ReactNode } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ScrollRootContext } from "./ScrollRoot";

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
        {/* overflow-x-clip: slide-in reveals start off to the side; never let them add a horizontal scrollbar */}
        <main className="mx-auto min-h-screen w-full max-w-[480px] overflow-x-clip bg-ivory">
          {children}
        </main>
      </ScrollRootContext.Provider>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-espresso via-[#4a342d] to-wine/80 p-6">
      {/* Phone: 440x956 pt aspect (iPhone 17 Pro Max), fitted to viewport height */}
      <div
        className="relative rounded-[3.4rem] bg-[#1b1412] p-[10px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.65),inset_0_0_0_2px_#6b5a52]"
        style={{ height: "min(calc(100vh - 3rem), 956px)", aspectRatio: "440 / 956" }}
      >
        {/* side buttons */}
        <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#6b5a52]" />
        <span className="absolute -left-[3px] top-[180px] h-14 w-[3px] rounded-l bg-[#6b5a52]" />
        <span className="absolute -left-[3px] top-[250px] h-14 w-[3px] rounded-l bg-[#6b5a52]" />
        <span className="absolute -right-[3px] top-[200px] h-20 w-[3px] rounded-r bg-[#6b5a52]" />

        {/* Screen. translateZ(0) makes position:fixed children stay inside the phone. */}
        <div
          ref={setScreen}
          className="no-scrollbar relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[2.7rem] bg-ivory"
          style={{ transform: "translateZ(0)" }}
        >
          {/* dynamic island */}
          <div className="pointer-events-none sticky top-0 z-[100] flex h-0 justify-center">
            <span className="mt-[11px] h-[30px] w-[110px] rounded-full bg-black" />
          </div>
          <ScrollRootContext.Provider value={screen}>
            <main>{children}</main>
          </ScrollRootContext.Provider>
        </div>
      </div>

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 font-body text-xs tracking-widest text-ivory/50">
        BEST VIEWED ON MOBILE · SHARE THE LINK ON WHATSAPP
      </p>
    </div>
  );
}
