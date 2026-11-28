// Import React to use hooks like useState and useEffect
import * as React from "react";
import { useEffect } from 'react'
// Must match Tailwind's lg breakpoint (1024px) so JS and CSS agree
const MOBILE_BREAKPOINT = 1024;

// Hook that tells shadcn's Sidebar whether to use the Sheet (mobile) mode
export function useIsMobile() {
  // Explicit type: without it, TS infers `undefined` and setIsMobile(boolean) errors
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  // Run once on the client, because window doesn't exist during SSR
  useEffect(() => {
    // Media query matches when the width is below the breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // Re-evaluate whenever the viewport crosses the breakpoint
    const onChange = () => {
      // Read mql.matches instead of window.innerWidth so there is one source of truth
      setIsMobile(mql.matches);
    };
    // Subscribe to breakpoint-crossing events
    mql.addEventListener("change", onChange);
    // Set the initial value on mount
    setIsMobile(mql.matches);
    // Cleanup: unsubscribe when the component unmounts
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Coerce undefined (before mount) to false
  return !!isMobile;
}