import { useCallback, useState } from "react";

export type NavMode = "wizard" | "allTabs";

const NAV_MODE_KEY = "pdr-workbench.nav-mode";

// Wizard is the default for first-time/cleared-storage visitors, per the
// phase-driven guided view becoming the new default landing navigation.
// Persisted with the same localStorage-flag pattern SiteContentContext uses
// for editMode, but kept as its own standalone hook rather than a Context
// since App.tsx is the only consumer.
export function useNavMode(): [NavMode, (next: NavMode) => void] {
  const [navMode, setNavModeState] = useState<NavMode>(
    () => (localStorage.getItem(NAV_MODE_KEY) as NavMode | null) ?? "wizard",
  );

  const setNavMode = useCallback((next: NavMode) => {
    setNavModeState(next);
    localStorage.setItem(NAV_MODE_KEY, next);
  }, []);

  return [navMode, setNavMode];
}
