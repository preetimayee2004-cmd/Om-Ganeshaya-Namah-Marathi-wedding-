/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PRD palette (confirmed by client over the brief's #ca4c3d / #f7f2eb)
        wine: "#6B1624", // deep maroon-red: headings, CTAs on parchment
        maroon: "#0E210B", // dark forest green: dark sections and page frame (client-chosen swatch)
        zari: "#E2A84B", // bright gold for text on maroon
        gold: "#0E210B", // borders, rules and small labels on parchment: forest green (client-chosen); bright gold lives in `zari`
        ivory: "#F6E6C3", // parchment: main background
        olive: "#687253", // secondary accents
        espresso: "#0E210B", // body text: dark forest green (client-chosen swatch)
        blush: "#E8C9BE", // floral accents
      },
      fontFamily: {
        // Exactly two Latin families + a Devanagari fallback. No ad hoc fonts per section.
        script: ['"Great Vibes"', "cursive"], // headings & couple names
        body: ["Lato", "system-ui", "sans-serif"], // all body copy
        marathi: ['"Tiro Devanagari Marathi"', '"Noto Serif Devanagari"', "serif"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      keyframes: { fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } } },
      // Mobile-first. `lg` is the only point where the phone mockup activates.
      screens: {
        sm: "480px",
        md: "768px",
        lg: "1024px",
      },
    },
  },
  plugins: [],
};
