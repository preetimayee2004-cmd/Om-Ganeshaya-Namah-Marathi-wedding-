import { useState, type ReactNode } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ScrollRootContext } from "./ScrollRoot";

/**
 * Responsive shell.
 *  - < 1024px: full-bleed, window scroll, no mockup (tablet gets a centred 480px column).
 *  - >= 1024px: the live site is rendered inside an iPhone 17 Pro Max style mockup.
 * The same children tree is used in both modes; only the wrapper changes.
 */
function Paisley({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 300 420" className={className} fill="none" stroke="rgba(176,128,52,.45)" strokeWidth="1.4" aria-hidden>
      <path d="M-10 10 C 120 -20 250 40 270 170 C 285 270 220 360 130 380 C 60 394 10 350 20 290 C 28 240 80 220 110 245 C 135 266 120 300 92 292" fill="rgba(255,250,235,.3)" />
      <path d="M12 40 C 120 20 228 70 246 176 C 258 258 204 336 128 352 C 76 362 40 330 48 288 C 54 256 90 244 108 262" />
      <path d="M40 80 C 120 66 204 104 218 184 C 228 244 186 300 130 312" strokeDasharray="2 6" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <ellipse key={i} cx={70 + i * 24} cy={40 + i * 26} rx="9" ry="16" transform={`rotate(${-30 + i * 8} ${70 + i * 24} ${40 + i * 26})`} fill="rgba(255,250,235,.45)" />
      ))}
      <circle cx="104" cy="272" r="7" fill="rgba(176,128,52,.35)" />
    </svg>
  );
}

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
      style={{ background: "radial-gradient(ellipse at 50% 45%, #fbf4e2 0%, #f1e3c2 55%, #e2cd9f 100%)" }}
    >
      {/* paisley corners: decorative stage around the phone */}
      {[
        "left-0 top-0",
        "right-0 top-0 -scale-x-100",
        "bottom-0 left-0 -scale-y-100",
        "bottom-0 right-0 -scale-100",
      ].map((pos) => (
        <Paisley key={pos} className={`pointer-events-none absolute h-[52vh] w-auto ${pos}`} />
      ))}

      {/* Phone: slim bezel, nearly full viewport height (about 94%), 408:860 like the reference */}
      <div
        className="relative rounded-[3.3rem] bg-[#2b1f27] p-[8px] shadow-[0_30px_70px_-20px_rgba(60,40,20,0.55)]"
        style={{ height: "min(94vh, 960px)", aspectRatio: "408 / 860" }}
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

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 font-body text-xs tracking-widest text-espresso/50">
        BEST VIEWED ON MOBILE · SHARE THE LINK ON WHATSAPP
      </p>
    </div>
  );
}
