// lib/geist.ts
import { createStitches } from "@stitches/react";

// Create a Stitches instance (SSR-safe)
export const { styled, css, globalCss, getCssText } = createStitches({
  theme: {
    fonts: {
      sans: "Inter, sans-serif",
    },
    colors: {
      primary: "#0070f3",
      secondary: "#ff4081",
    },
  },
  utils: {
    marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
    paddingX: (value: string | number) => ({ paddingLeft: value, paddingRight: value }),
  },
});

// Define Geist className (deterministic, SSR-safe)
export const geist = {
  className: css({
    fontFamily: "$sans",
    color: "$primary",
  })(),
};
