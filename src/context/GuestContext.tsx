import { createContext, useContext, useMemo, type ReactNode } from "react";
import { wedding } from "../config/wedding";

interface GuestState {
  guestName: string;
  /** true when the name came from the URL rather than the fallback */
  isPersonalised: boolean;
}

const GuestContext = createContext<GuestState>({
  guestName: wedding.guestFallback,
  isPersonalised: false,
});

function readGuestName(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    // Accept ?guest= and the common ?name= alias.
    const raw = params.get(wedding.guestParam) ?? params.get("name");
    // Strip control chars / angle brackets, collapse whitespace, cap length.
    const clean = (raw ?? "")
      .replace(/[\u0000-\u001f<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    return clean || null;
  } catch {
    return null;
  }
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const value = useMemo<GuestState>(() => {
    const name = readGuestName();
    return {
      guestName: name ?? wedding.guestFallback,
      isPersonalised: name !== null,
    };
  }, []);
  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export const useGuest = () => useContext(GuestContext);
