"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * A custom React hook to determine if the current viewport width is considered mobile.
 * Fully SSR-safe: does not rely on `window`, `document`, or `matchMedia`.
 *
 * @param initialWidth Optional: provide initial width (e.g., from props or server) for SSR.
 * @returns boolean: true if mobile, false if desktop.
 */
export function useIsMobile(initialWidth?: number) {
  const [isMobile, setIsMobile] = React.useState(() => {
    // Use initialWidth if provided, otherwise default to false
    if (typeof initialWidth === "number") {
      return initialWidth < MOBILE_BREAKPOINT
    }
    return false
  })

  return isMobile
}
