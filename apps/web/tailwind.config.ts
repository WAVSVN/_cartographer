import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ui)", "Consolas", "Courier New", "monospace"],
        mono: ["var(--font-ui)", "Consolas", "Courier New", "monospace"],
        brand: ["var(--font-brand)", "monospace"],
      },
      fontSize: {
        base: ["0.82rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        ops: "0px",
      },
      colors: {
        ops: {
          bg: "#000000",
          panel: "rgba(0, 0, 0, 0.94)",
          elevated: "rgba(255, 255, 255, 0.03)",
          line: "rgba(255, 255, 255, 0.08)",
          "line-hover": "rgba(101, 146, 150, 0.45)",
          "tree-line": "#4a6a72",
          text: "#e8e8e8",
          chrome: "#d8d9d8",
          muted: "#666666",
          "muted-bright": "#8f9c9f",
          link: "#9bb7c4",
          "link-dim": "#659296",
          accent: "#1eff00",
          "accent-dim": "rgba(30, 255, 0, 0.65)",
          teal: "#659296",
          "teal-dim": "#355665",
          "teal-hover": "#9bb7c4",
          green: "#1eff00",
          amber: "#c4a84a",
          "amber-dim": "#8a7840",
          critical: "#ff0033",
          high: "#c4a84a",
          pass: "#4a8f52",
        },
      },
    },
  },
  plugins: [],
};

export default config;
