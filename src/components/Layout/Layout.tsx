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
        <main className="mx-auto min-h-screen w-full max-w-[480px] paper overflow-x-clip">
          {children}
        </main>
      </ScrollRootContext.Provider>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#f1e3c2", backgroundImage: 'url("/bg/stage.jpg")', backgroundSize: "cover", backgroundPosition: "center" }}
    >

      {/* Phone: slim bezel, nearly full viewport height (94.3%), 414:860 as measured on the reference */}
      <div
        className="relative rounded-[3.3rem] bg-[#2b1f27] p-[8px] shadow-[0_30px_70px_-20px_rgba(60,40,20,0.55)]"
        style={{ height: "min(94.3vh, 960px)", aspectRatio: "414 / 860" }}
      >
        {/* side buttons */}
        <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#2b1f27]" />
        <span className="absolute -left-[3px] top-[180px] h-14 w-[3px] rounded-l bg-[#2b1f27]" />
        <span className="absolute -left-[3px] top-[250px] h-14 w-[3px] rounded-l bg-[#2b1f27]" />
        <span className="absolute -right-[3px] top-[200px] h-20 w-[3px] rounded-r bg-[#2b1f27]" />

        {/* Screen. translateZ(0) makes position:fixed children stay inside the phone. */}
        <div
          ref={setScreen}
          className="no-scrollbar relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[2.7rem] paper"
          style={{ transform: "translateZ(0)" }}
        >
          {/* dynamic island */}
          <div className="pointer-events-none sticky top-0 z-[100] flex h-0 justify-center">
            <span className="mt-[10px] h-[28px] w-[100px] rounded-full bg-black" />
          </div>
          <ScrollRootContext.Provider value={screen}>
            <main>{children}</main>
          </ScrollRootContext.Provider>
        </div>
      </div>
    </div>
  );
}
