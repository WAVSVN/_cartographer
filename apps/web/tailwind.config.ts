import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        ops: "6px",
      },
      colors: {
        ops: {
          bg: "#080c11",
          panel: "#0f141c",
          elevated: "#151c28",
          line: "#1e2a3d",
          text: "#dce3ed",
          muted: "#6d7f99",
          amber: "#e8a317",
          "amber-dim": "#b87d10",
          critical: "#e05252",
          high: "#e07a32",
          pass: "#3d9a6a",
        },
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
